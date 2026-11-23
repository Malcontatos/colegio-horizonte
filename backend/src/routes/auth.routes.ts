import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.ts';
import { AppError } from '../lib/errors.ts';
import { parse } from '../lib/http.ts';
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from '../lib/auth.ts';
import { serializeSessionUser } from '../lib/serializers.ts';
import { requireAuth } from '../middleware/auth.ts';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: {
      message:
        'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.',
      code: 'TOO_MANY_REQUESTS',
    },
  },
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual.'),
  newPassword: z
    .string()
    .min(8, 'A nova senha deve ter pelo menos 8 caracteres.')
    .regex(/[A-Za-z]/, 'A nova senha deve conter letras.')
    .regex(/[0-9]/, 'A nova senha deve conter números.'),
});

router.post('/login', loginLimiter, async (req, res) => {
  const input = parse(loginSchema, req.body);

  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { student: true, teacher: true },
  });

  if (!user || !user.active) {
    throw new AppError(401, 'E-mail ou senha incorretos.', 'INVALID_CREDENTIALS');
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!validPassword) {
    throw new AppError(401, 'E-mail ou senha incorretos.', 'INVALID_CREDENTIALS');
  }

  const token = signSession({ sub: user.id, role: user.role });

  res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
  res.json({ data: { user: serializeSessionUser(user) } });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { student: true, teacher: true },
  });

  if (!user) {
    throw new AppError(401, 'Usuário não encontrado.', 'UNAUTHORIZED');
  }

  res.json({ data: { user: serializeSessionUser(user) } });
});

router.post('/logout', (_req, res) => {
  const { maxAge: _maxAge, ...clearOptions } = sessionCookieOptions();
  res.clearCookie(SESSION_COOKIE, clearOptions);
  res.json({ data: { message: 'Sessão encerrada.' } });
});

router.patch('/password', requireAuth, async (req, res) => {
  const input = parse(changePasswordSchema, req.body);

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
  });

  if (!user) {
    throw new AppError(401, 'Usuário não encontrado.', 'UNAUTHORIZED');
  }

  const validPassword = await bcrypt.compare(
    input.currentPassword,
    user.passwordHash,
  );

  if (!validPassword) {
    throw new AppError(400, 'A senha atual está incorreta.', 'INVALID_PASSWORD');
  }

  if (input.currentPassword === input.newPassword) {
    throw new AppError(
      400,
      'A nova senha deve ser diferente da senha atual.',
      'SAME_PASSWORD',
    );
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  res.json({ data: { message: 'Senha alterada com sucesso.' } });
});

export { router as authRoutes };
