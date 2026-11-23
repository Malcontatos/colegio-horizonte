import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import type { Role } from '../generated/prisma/enums.ts';

export const SESSION_COOKIE = 'horizonte_session';

const ROLES: Role[] = ['ADMIN', 'TEACHER', 'STUDENT'];

export type SessionPayload = {
  sub: string;
  role: Role;
};

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifySession(token: string): SessionPayload & jwt.JwtPayload {
  const payload = jwt.verify(token, env.JWT_SECRET);

  if (
    typeof payload === 'string' ||
    typeof payload.sub !== 'string' ||
    typeof payload.role !== 'string' ||
    !ROLES.includes(payload.role as Role)
  ) {
    throw new Error('Token de sessão inválido.');
  }

  return payload as SessionPayload & jwt.JwtPayload;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
  };
}
