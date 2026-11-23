import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma.ts';
import { SESSION_COOKIE, verifySession } from '../lib/auth.ts';
import { AppError } from '../lib/errors.ts';
import type { Role } from '../generated/prisma/enums.ts';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;

    if (!token) {
      throw new AppError(401, 'Faça login para continuar.', 'UNAUTHORIZED');
    }

    let session;

    try {
      session = verifySession(token);
    } catch {
      throw new AppError(
        401,
        'Sua sessão expirou. Faça login novamente.',
        'SESSION_EXPIRED',
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    if (!user || !user.active) {
      throw new AppError(
        401,
        'Usuário não encontrado ou inativo.',
        'UNAUTHORIZED',
      );
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(new AppError(401, 'Faça login para continuar.', 'UNAUTHORIZED'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new AppError(
          403,
          'Você não tem permissão para acessar este recurso.',
          'FORBIDDEN',
        ),
      );
      return;
    }

    next();
  };
