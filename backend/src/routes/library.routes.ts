import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.ts';
import { AppError } from '../lib/errors.ts';
import { parse } from '../lib/http.ts';
import { uploadRoot } from '../lib/upload.ts';
import { requireAuth } from '../middleware/auth.ts';

const router = Router();

const uuidSchema = z.string().uuid('Identificador inválido.');

router.get('/:id/download', requireAuth, async (req, res) => {
  const id = parse(uuidSchema, req.params.id);

  const resource = await prisma.libraryResource.findUnique({
    where: { id },
    include: { file: { select: { content: true } } },
  });

  if (!resource) {
    throw new AppError(404, 'Arquivo não encontrado.', 'NOT_FOUND');
  }

  if (req.user!.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user!.id },
    });

    if (!teacher) {
      throw new AppError(403, 'Perfil de professor não encontrado.', 'FORBIDDEN');
    }

    if (resource.uploadedById !== req.user!.id) {
      const assignment = await prisma.teachingAssignment.findFirst({
        where: {
          teacherId: teacher.id,
          subjectId: resource.subjectId,
          ...(resource.classId ? { classId: resource.classId } : {}),
        },
      });

      if (!assignment) {
        throw new AppError(
          403,
          'Você não tem acesso a este material.',
          'FORBIDDEN',
        );
      }
    }
  }

  if (req.user!.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          orderBy: { year: 'desc' },
          take: 1,
        },
      },
    });

    const enrollment = student?.enrollments[0];

    if (!enrollment) {
      throw new AppError(403, 'Nenhuma matrícula ativa encontrada.', 'FORBIDDEN');
    }

    if (resource.classId && resource.classId !== enrollment.classId) {
      throw new AppError(
        403,
        'Este material não está disponível para a sua turma.',
        'FORBIDDEN',
      );
    }
  }

  const filePath = path.resolve(uploadRoot, resource.storedName);

  if (!filePath.startsWith(uploadRoot + path.sep)) {
    throw new AppError(400, 'Caminho de arquivo inválido.', 'INVALID_PATH');
  }

  if (!resource.file) {
    try {
      await fs.promises.access(filePath);
    } catch {
      throw new AppError(
        404,
        'O arquivo não está disponível. Solicite o reenvio ao professor.',
        'FILE_NOT_FOUND',
      );
    }
  }

  await prisma.libraryResource.update({
    where: { id: resource.id },
    data: { downloadCount: { increment: 1 } },
  });

  res.setHeader('Cache-Control', 'private, no-store');

  if (resource.file) {
    res.type(resource.mimeType);
    res.attachment(resource.fileName);
    res.send(Buffer.from(resource.file.content));
    return;
  }

  res.download(filePath, resource.fileName);
});

export { router as libraryRoutes };
