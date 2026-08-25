const File = require("../models/File");
const cloudinary = require("../config/cloudinary");
const { ApiError } = require("../middleware/errorHandler");
const asyncHandler = require("../middleware/asyncHandler");
const { resolveCategory } = require("../middleware/upload");
const { computeRelevance } = require("../utils/relevanceScore");

// @desc    Upload a media file with metadata
// @route   POST /api/files/upload
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file)
    throw new ApiError(400, 'No file was uploaded (field name must be "file")');

  const category = resolveCategory(req.file.mimetype);
  const tags = (req.body.tags || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const file = await File.create({
    owner: req.user.id,
    fileName: req.body.fileName || req.file.originalname,
    description: req.body.description || "",
    tags,
    fileType: category,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    url: req.file.path, // secure_url provided by multer-storage-cloudinary
    thumbnailUrl: category === "image" ? req.file.path : undefined,
    cloudinaryPublicId: req.file.filename,
  });

  res.status(201).json({ success: true, file });
});

// @desc    Search files by keyword, ranked by relevance
// @route   GET /api/files/search?query=&fileType=&startDate=&endDate=&page=&limit=&sortBy=
const searchFiles = asyncHandler(async (req, res) => {
  const {
    query = "",
    fileType,
    startDate,
    endDate,
    page = 1,
    limit = 12,
    sortBy = "relevance",
  } = req.query;

  const filter = { owner: req.user.id };
  if (fileType) filter.fileType = fileType;

  // Date range filter — inclusive on both ends. Validated as ISO8601 at the
  // route layer (fileRoutes.js), so these are safe to pass to Date().
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // include the whole end day
      filter.createdAt.$lte = end;
    }
  }

  let usesTextScore = false;
  let candidates;

  if (query.trim()) {
    usesTextScore = true;
    candidates = await File.find(
      { ...filter, $text: { $search: query.trim() } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(200)
      .lean();

    // Fuzzy fallback: if the exact/stemmed text index found nothing (e.g. a
    // typo like "vacaton"), fall back to scanning the user's filtered files
    // and scoring each by edit-distance similarity instead.
    if (candidates.length === 0) {
      const pool = await File.find(filter).limit(500).lean();
      candidates = pool
        .map((file) => ({ ...file, fuzzyScore: fuzzyScoreFile(file, query) }))
        .filter((file) => file.fuzzyScore > 0);
    }
  } else {
    candidates = await File.find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);

  const ranked = candidates
    .map((file) => ({
      ...file,
      relevanceScore: computeRelevance(file, {
        // Fuzzy matches use their similarity score in place of MongoDB's
        // textScore so they still rank alongside popularity/recency.
        textScore: usesTextScore ? file.score ?? file.fuzzyScore ?? 0 : 0,
        weights:
          sortBy === "popularity"
            ? { text: 0.3, popularity: 0.6, recency: 0.1 }
            : sortBy === "date"
            ? { text: 0.2, popularity: 0.1, recency: 0.7 }
            : undefined, // default balanced weights from relevanceScore.js
      }),
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  const start = (pageNum - 1) * limitNum;
  const paginated = ranked.slice(start, start + limitNum);

  res.json({
    success: true,
    count: paginated.length,
    total: ranked.length,
    page: pageNum,
    totalPages: Math.ceil(ranked.length / limitNum) || 1,
    usedFuzzyMatch: usesTextScore && candidates.some((c) => "fuzzyScore" in c),
    files: paginated,
  });
});

// @desc    Get all files owned by the current user
// @route   GET /api/files
const listFiles = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12 } = req.query;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);

  const [files, total] = await Promise.all([
    File.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    File.countDocuments({ owner: req.user.id }),
  ]);

  res.json({
    success: true,
    count: files.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    files,
  });
});

// @desc    Get a single file by id and increment its view count
// @route   GET /api/files/:id
const getFile = asyncHandler(async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
  if (!file) throw new ApiError(404, "File not found");

  file.viewCount += 1;
  await file.save();

  res.json({ success: true, file });
});

// @desc    Delete a file (removes from Cloudinary and MongoDB)
// @route   DELETE /api/files/:id
const deleteFile = asyncHandler(async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
  if (!file) throw new ApiError(404, "File not found");

  const resourceType =
    file.fileType === "video" || file.fileType === "audio" ? "video" : "image";
  await cloudinary.uploader.destroy(file.cloudinaryPublicId, {
    resource_type: resourceType,
  });
  await file.deleteOne();

  res.json({ success: true, message: "File deleted" });
});

module.exports = { uploadFile, searchFiles, listFiles, getFile, deleteFile };
