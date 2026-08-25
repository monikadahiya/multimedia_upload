const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileName: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    tags: { type: [String], default: [], index: true },
    fileType: { type: String, enum: ['image', 'video', 'audio', 'pdf'], required: true, index: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    cloudinaryPublicId: { type: String, required: true },
    viewCount: { type: Number, default: 0, index: true },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Text index enables MongoDB-native keyword relevance scoring across name/description/tags
fileSchema.index({ fileName: 'text', description: 'text', tags: 'text' }, {
  weights: { fileName: 5, tags: 3, description: 1 },
  name: 'FileTextIndex',
});

module.exports = mongoose.model('File', fileSchema);
