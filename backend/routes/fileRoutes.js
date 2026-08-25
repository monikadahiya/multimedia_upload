const express = require("express");
const { body, query, param } = require("express-validator");
const { protect } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const validate = require("../middleware/validate");
const {
  uploadFile,
  searchFiles,
  listFiles,
  getFile,
  deleteFile,
} = require("../controllers/fileController");

const router = express.Router();

router.use(protect); // every file route requires authentication

/**
 * @openapi
 * /api/files/upload:
 *   post:
 *     tags: [Files]
 *     summary: Upload a media file (image, video, audio, or PDF) to Cloudinary
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *               fileName: { type: string }
 *               description: { type: string }
 *               tags: { type: string, example: "vacation,beach,2024" }
 *     responses:
 *       201: { description: File uploaded and metadata stored }
 *       400: { description: Missing file, unsupported type, or file too large }
 *       401: { description: Not authenticated }
 */
router.post(
  "/upload",
  upload.single("file"),
  [
    body("fileName").optional().trim().isLength({ max: 200 }),
    body("description").optional().trim().isLength({ max: 500 }),
    body("tags").optional().isString(),
  ],
  validate,
  uploadFile
);

/**
 * @openapi
 * /api/files/search:
 *   get:
 *     tags: [Files]
 *     summary: Search the user's files by keyword, ranked by relevance
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema: { type: string }
 *         description: Keyword matched against file name, tags, and description
 *       - in: query
 *         name: fileType
 *         schema: { type: string, enum: [image, video, audio, pdf] }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [relevance, popularity, date], default: relevance }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *     responses:
 *       200: { description: Ranked search results }
 *       401: { description: Not authenticated }
 */
router.get(
  "/search",
  [
    query("query").optional().isString().trim(),
    query("fileType").optional().isIn(["image", "video", "audio", "pdf"]),
    query("sortBy").optional().isIn(["relevance", "popularity", "date"]),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("startDate must be YYYY-MM-DD"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("endDate must be YYYY-MM-DD"),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  searchFiles
);

/**
 * @openapi
 * /api/files:
 *   get:
 *     tags: [Files]
 *     summary: List the current user's files (most recent first)
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *     responses:
 *       200: { description: Paginated list of files }
 */
router.get("/", listFiles);

/**
 * @openapi
 * /api/files/{id}:
 *   get:
 *     tags: [Files]
 *     summary: Get a single file by id (increments its view count)
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: File metadata }
 *       404: { description: File not found }
 *   delete:
 *     tags: [Files]
 *     summary: Delete a file (removes from Cloudinary and MongoDB)
 *     security: [{ cookieAuth: [], bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: File deleted }
 *       404: { description: File not found }
 */
router.get("/:id", [param("id").isMongoId()], validate, getFile);
router.delete("/:id", [param("id").isMongoId()], validate, deleteFile);

module.exports = router;
