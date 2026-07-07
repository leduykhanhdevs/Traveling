import { z } from 'zod';
import { generateUploadUrl } from '../services/storage.service.js';
import { AppError } from '../utils/errors.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/http-response.js';

const uploadRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
});

export const postUploadUrl = asyncHandler(async (req, res) => {
  if (!req.auth?.userId) {
    throw new AppError('UNAUTHORIZED', 'Sign in to upload files.', 401);
  }

  const { fileName } = uploadRequestSchema.parse(req.body);
  
  // Create a unique file path within the 'uploads' bucket
  const uniqueId = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const ext = fileName.split('.').pop() || 'bin';
  const filePath = `${req.auth.userId}/${uniqueId}.${ext}`;
  
  const uploadData = await generateUploadUrl('uploads', filePath);
  
  sendSuccess(res, uploadData);
});
