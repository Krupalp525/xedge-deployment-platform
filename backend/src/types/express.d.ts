import { Express } from 'express-serve-static-core';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
      };
    }
  }
}

export {}; 