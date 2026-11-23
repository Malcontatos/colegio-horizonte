import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env.ts';
import { AppError } from './errors.ts';

export const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
fs.mkdirSync(uploadRoot, { recursive: true });

const FILE_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'application/zip': ['.zip'],
  'application/x-zip-compressed': ['.zip'],
};

export function decodeOriginalName(name: string) {
  if (/[\u0100-\uFFFF]/.test(name)) return name;

  const decoded = Buffer.from(name, 'latin1').toString('utf8');
  return decoded.includes('\uFFFD') ? name : decoded;
}

export function sanitizeFileName(name: string) {
  const base = path.basename(name);
  const cleaned = base
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .trim()
    .slice(0, 200);

  return cleaned || 'arquivo';
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const originalName = decodeOriginalName(file.originalname);
    const extension = path.extname(originalName).toLowerCase();
    const allowedExtensions = FILE_TYPES[file.mimetype];

    if (!allowedExtensions || !allowedExtensions.includes(extension)) {
      cb(
        new AppError(
          400,
          'Tipo de arquivo não permitido. Envie PDF, DOCX, PPTX, XLSX, TXT, CSV, imagem ou ZIP.',
          'INVALID_FILE_TYPE',
        ),
      );
      return;
    }

    cb(null, true);
  },
});

export function buildStoredName(originalName: string, mimeType: string) {
  const extension =
    path.extname(originalName).toLowerCase() ||
    FILE_TYPES[mimeType]?.[0] ||
    '';

  return `${randomUUID()}${extension}`;
}
