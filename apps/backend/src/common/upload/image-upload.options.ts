import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import type { Request } from 'express';

// Matches @nestjs/platform-express's MulterOptions.fileFilter callback shape,
// which is stricter (non-overloaded) than multer's own FileFilterCallback type.
type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Uploads live outside dist so they survive rebuilds; created lazily on first upload.
export const UPLOAD_ROOT = join(process.cwd(), 'apps', 'backend', 'uploads');

export function imageUploadOptions(subfolder: 'beers' | 'breweries') {
  const destination = join(UPLOAD_ROOT, subfolder);

  return {
    storage: diskStorage({
      destination: (
        _req: Request,
        _file: Express.Multer.File,
        callback: (error: Error | null, destination: string) => void,
      ) => {
        if (!existsSync(destination)) {
          mkdirSync(destination, { recursive: true });
        }
        callback(null, destination);
      },
      filename: (
        _req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, filename: string) => void,
      ) => {
        // Random name avoids path traversal / collisions from user-supplied filenames.
        callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
      },
    }),
    fileFilter: (_req: Request, file: Express.Multer.File, callback: FileFilterCallback) => {
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        callback(new BadRequestException('Nur JPEG-, PNG- oder WebP-Bilder sind erlaubt.'), false);
        return;
      }
      callback(null, true);
    },
    limits: {
      fileSize: MAX_FILE_SIZE_BYTES,
    },
  };
}
