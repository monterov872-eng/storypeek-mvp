import type { NextFunction, Request, Response } from 'express';
import { apiError } from './errorHandler.js';

const DEVICE_HEADER = 'x-device-id';

export function requireDeviceId(req: Request, res: Response, next: NextFunction) {
  const deviceId = req.header(DEVICE_HEADER)?.trim();
  if (!deviceId || deviceId.length < 8) {
    return apiError(
      res,
      'VALIDATION_ERROR',
      `Missing or invalid ${DEVICE_HEADER} header`,
    );
  }
  req.deviceId = deviceId;
  next();
}

declare global {
  namespace Express {
    interface Request {
      deviceId?: string;
    }
  }
}
