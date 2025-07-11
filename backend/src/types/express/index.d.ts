import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        id: string;
        email: string;
        role: string;
        // Add other user properties as needed
      };
      // Add any other custom properties you need
    }
  }
}
