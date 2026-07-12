import { z } from 'zod';
import { generateUploadUrl } from '../services/storage.service.js';
import { AppError } from '../utils/errors.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/http-response.js';
import { randomUUID } from 'node:crypto';

const contentTypeExtensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

const uploadRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

export const postUploadUrl = asyncHandler(async (req, res) => {
  if (!req.auth?.userId) {
    throw new AppError('UNAUTHORIZED', 'Sign in to upload files.', 401);
  }

  const { contentType } = uploadRequestSchema.parse(req.body);
  
  const filePath = `${req.auth.userId}/${randomUUID()}.${contentTypeExtensions[contentType]}`;
  
  const uploadData = await generateUploadUrl('uploads', filePath);
  
  sendSuccess(res, uploadData);
});
