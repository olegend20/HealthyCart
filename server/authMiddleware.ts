import type { Request, Response, NextFunction, RequestHandler } from "express";
import { authService } from "./auth";
import { storage } from "./storage";

// Extend the Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const isAuthenticated: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated via session
    if (req.session && (req.session as any).userId) {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      
      if (user) {
        req.user = { 
          id: user.id, 
          email: user.email, 
          claims: { sub: user.id }
        };
        return next();
      }
    }
    
    // Check for OIDC authentication (backward compatibility)
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      return next();
    }
    
    return res.status(401).json({ message: "Unauthorized" });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

export const optionalAuth: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Try to authenticate but don't require it
    if (req.session && (req.session as any).userId) {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      
      if (user) {
        req.user = { 
          id: user.id, 
          email: user.email, 
          claims: { sub: user.id }
        };
      }
    }
    
    // Check for OIDC authentication (backward compatibility)
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      // Already authenticated via OIDC
    }
    
    next();
  } catch (error) {
    console.error("Optional authentication error:", error);
    next();
  }
};