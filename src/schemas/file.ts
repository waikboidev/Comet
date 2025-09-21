import { Schema, model } from 'mongoose';

const fileSchema = new Schema({
  name: { type: String, required: true, unique: true },
  data: { type: Buffer, required: true },
  uploader: { type: String, required: true }, // Discord user ID
  uploadedAt: { type: Date, default: Date.now },
});

export const FileModel = model('File', fileSchema);