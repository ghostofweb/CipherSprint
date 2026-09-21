// Augments Express's Request with the field requireAuth/optionalAuth set,
// so route handlers can read req.userId without individually casting.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
