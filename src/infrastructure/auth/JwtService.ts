// src/infrastructure/auth/JwtService.ts

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

export type JwtPayload = { userId: string; email: string };

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
      if (err || !token) reject(err);
      else resolve(token);
    });
  });
}

export async function signRefreshToken(payload: JwtPayload): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" }, (err, token) => {
      if (err || !token) reject(err);
      else resolve(token);
    });
  });
}

export async function verifyAccessToken(token: string): Promise<JwtPayload | null> {
  return new Promise((resolve) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err || !decoded) resolve(null);
      else resolve(decoded as JwtPayload);
    });
  });
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload | null> {
  return new Promise((resolve) => {
    jwt.verify(token, REFRESH_SECRET, (err, decoded) => {
      if (err || !decoded) resolve(null);
      else resolve(decoded as JwtPayload);
    });
  });
}
