// middleware/logMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import Log from '../database/models/logs.model';

const logMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Capture the original send function
  const originalSend = res.send;

  // Override the send function to capture the response payload
  res.send = function (body: any): Response {
    const end = Date.now();
    const timeTaken = end - start;

    // Convert response body to JSON if it is not already an object
    let responsePayload;
    try {
      responsePayload = JSON.parse(body);
    } catch (error) {
      responsePayload = body;
    }

    const logEntry = new Log({
      url: req.originalUrl,
      method: req.method,
      requestPayload: req.body,
      responsePayload,
      responseStatus: res.statusCode,
      userId: (req as any).userId, // Assuming userId is attached to req object
      timeTaken,
      calledAt: start
    });

    logEntry.save().catch((err) => {
      console.error('Error saving log entry', err);
    });

    // Call the original send function with the response data and return the response object
    return originalSend.call(this, body);
  };

  next();
};

export default logMiddleware;
