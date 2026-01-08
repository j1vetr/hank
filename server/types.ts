import { Request } from 'express';

declare module 'express-session' {
  interface SessionData {
    adminId?: string;
  }
}

export interface AuthRequest extends Request {
  session: {
    adminId?: string;
    destroy: (callback: () => void) => void;
  };
  sessionID: string;
}
