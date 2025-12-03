import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import fs from 'fs';

// Ensure upload directories exist
const uploadDirs = ['vehicles', 'avatars', 'documents', 'chat', 'orders'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(config.upload.path, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'documents';

    if (req.baseUrl.includes('vehicles')) {
      folder = 'vehicles';
    } else if (req.baseUrl.includes('users') && req.path.includes('avatar')) {
      folder = 'avatars';
    } else if (req.baseUrl.includes('messages') || req.baseUrl.includes('conversations')) {
      folder = 'chat';
    } else if (req.baseUrl.includes('orders') && req.path.includes('photo')) {
      folder = 'orders';
    }

    cb(null, path.join(config.upload.path, folder));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// File filter
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('فرمت فایل پشتیبانی نمی‌شود'));
  }
};

// Image only filter
const imageFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('فقط فایل‌های تصویری مجاز هستند'));
  }
};

// Export multer instances
export const uploadFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

// Helper to get file URL
export const getFileUrl = (filename: string, folder: string): string => {
  return `/uploads/${folder}/${filename}`;
};

// Helper to delete file
export const deleteFile = (filePath: string): void => {
  const fullPath = path.join(config.upload.path, filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};
