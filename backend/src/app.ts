import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.ts';
import { AppError } from './lib/errors.ts';
import {
  errorHandler,
  notFoundHandler,
} from './middleware/error-handler.ts';
import { authRoutes } from './routes/auth.routes.ts';
import { adminRoutes } from './routes/admin.routes.ts';
import { teacherRoutes } from './routes/teacher.routes.ts';
import { studentRoutes } from './routes/student.routes.ts';
import { libraryRoutes } from './routes/library.routes.ts';

const app = express();

app.disable('x-powered-by');

if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const allowedOrigins = new Set([env.CLIENT_URL]);

app.use((req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const origin = req.get('origin');

  if (origin && !allowedOrigins.has(origin)) {
    next(
      new AppError(403, 'Origem não permitida.', 'FORBIDDEN_ORIGIN'),
    );
    return;
  }

  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    data: { status: 'ok', timestamp: new Date().toISOString() },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api', notFoundHandler);

const frontendDist = path.resolve(process.cwd(), '..', 'frontend', 'dist');

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) {
      next();
      return;
    }

    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
