import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { diskStorage } from 'multer';
import { join } from 'node:path';
import type { Request } from 'express';

type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

// Extension is derived from the validated MIME type, never from the user-supplied filename,
// so an uploaded file can only ever land as a known-safe image extension.
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Single, fixed uploads directory for the backend. Both multer (writing) and the static
// file handler (serving) use this same constant so they can never point at different folders.
export const UPLOAD_ROOT = join(process.cwd(), 'apps', 'backend', 'uploads');

export function imageUploadOptions(subfolder: 'beers' | 'breweries' | 'users') {
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
        const ext = MIME_EXTENSIONS[file.mimetype];
        if (!ext) {
          callback(new BadRequestException('Only JPEG, PNG or WebP images are allowed.'), '');
          return;
        }
        callback(null, `${randomUUID()}${ext}`);
      },
    }),
    fileFilter: (_req: Request, file: Express.Multer.File, callback: FileFilterCallback) => {
      if (!(file.mimetype in MIME_EXTENSIONS)) {
        callback(new BadRequestException('Only JPEG, PNG or WebP images are allowed.'), false);
        return;
      }
      callback(null, true);
    },
    limits: {
      fileSize: MAX_FILE_SIZE_BYTES,
      files: 1,
    },
  };
}
