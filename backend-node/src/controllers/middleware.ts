import { NextFunction, Request, Response } from "express";

import jwt from "jsonwebtoken"

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}
export async function AuthenticatedRequest(req: Request, res: Response, next: NextFunction) {

  const secretKey = process.env.JWT_SECRET!
  const tokenHeader = req.headers['authorization'];
  if (!tokenHeader) {
    return res.status(401).json({ error: "Authorization header missing" })
  }
  const token = tokenHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: "Bearer token missing" })
  }

  type JWTPayload = {
    userId: string,
    email: string,
    name: string
  }

  try {
    const decoded = jwt.verify(token, secretKey)

    const { userId, email, name } = decoded as JWTPayload
    req.user = {
      id: userId,
      email,
      name
    }
    next()
  } catch (jwtError) {
    return res.status(401).json({ error: 'invalid token' })
  }

}