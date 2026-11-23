import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.ts';
import { AppError } from '../lib/errors.ts';
import { parse } from '../lib/http.ts';
import { serializeResource } from '../lib/serializers.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';
import type { Prisma } from '../generated/prisma/client.ts';

const router = Router();

router.use(requireAuth, requireRole('STUDENT'));

const uuidSchema = z.string().uuid('Identificador inválido.');

const resourceQuerySchema = z.object({
  subjectId: uuidSchema.optional(),
  type: z.enum(['MATERIAL', 'ACTIVITY', 'ASSESSMENT']).optional(),
  search: z.string().trim().max(100).optional(),
});

async function getStudentContext(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, email: true } },
      enrollments: {
        include: { class: true },
        orderBy: { year: 'desc' },
      },
    },
  });

  if (!student) {
    throw new AppError(404, 'Perfil de aluno não encontrado.', 'NOT_FOUND');
  }

  const currentYear = new Date().getFullYear();
  const enrollment =
    student.enrollments.find(
      (item) => item.year === currentYear && item.status === 'ACTIVE',
    ) ??
    student.enrollments.find((item) => item.status === 'ACTIVE') ??
    student.enrollments[0];

  if (!enrollment) {
    throw new AppError(
      404,
      'Nenhuma matrícula ativa encontrada. Procure a secretaria.',
      'NO_ENROLLMENT',
    );
  }

  return { student, enrollment };
}

async function getSubjectsWithGrades(enrollmentId: string, classId: string) {
  const subjects = await prisma.subject.findMany({
    where: {
      assignments: { some: { classId } },
    },
    include: {
      assignments: {
        where: { classId },
        include: {
          teacher: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
      },
      grades: {
        where: { enrollmentId },
        orderBy: [{ period: 'asc' }, { updatedAt: 'desc' }],
      },
    },
    orderBy: { name: 'asc' },
  });

  return subjects.map((subject) => {
    const grades = subject.grades.map((grade) => ({
      id: grade.id,
      period: grade.period,
      value: Number(grade.value),
      updatedAt: grade.updatedAt,
    }));

    const values = grades.map((grade) => grade.value);

    return {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      workload: subject.workload,
      teachers: subject.assignments.map((assignment) => ({
        id: assignment.teacher.id,
        name: assignment.teacher.user.name,
        email: assignment.teacher.user.email,
      })),
      grades,
      average:
        values.length > 0
          ? Number(
              (
                values.reduce((sum, value) => sum + value, 0) / values.length
              ).toFixed(2),
            )
          : null,
    };
  });
}

function average(values: number[]) {
  if (values.length === 0) return null;

  return Number(
    (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2),
  );
}

router.get('/overview', async (req, res) => {
  const { student, enrollment } = await getStudentContext(req.user!.id);
  const subjects = await getSubjectsWithGrades(
    enrollment.id,
    enrollment.classId,
  );

  const [resources, totalResources] = await Promise.all([
    prisma.libraryResource.findMany({
      where: { classId: enrollment.classId },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: {
        subject: true,
        class: true,
        uploadedBy: { select: { name: true } },
      },
    }),
    prisma.libraryResource.count({
      where: { classId: enrollment.classId },
    }),
  ]);

  const allGrades = subjects.flatMap((subject) =>
    subject.grades.map((grade) => ({
      ...grade,
      subject: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
      },
    })),
  );

  const recentGrades = [...allGrades]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);

  res.json({
    data: {
      student: {
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        registrationNumber: student.registrationNumber,
      },
      enrollment: {
        id: enrollment.id,
        year: enrollment.year,
        status: enrollment.status,
        class: {
          id: enrollment.class.id,
          name: enrollment.class.name,
          year: enrollment.class.year,
          shift: enrollment.class.shift,
        },
      },
      summary: {
        average: average(allGrades.map((grade) => grade.value)),
        subjects: subjects.length,
        grades: allGrades.length,
        resources: totalResources,
      },
      performance: subjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        average: subject.average,
      })),
      recentGrades,
      recentResources: resources.map(serializeResource),
    },
  });
});

router.get('/subjects', async (req, res) => {
  const { enrollment } = await getStudentContext(req.user!.id);
  const subjects = await getSubjectsWithGrades(
    enrollment.id,
    enrollment.classId,
  );
  const allValues = subjects.flatMap((subject) =>
    subject.grades.map((grade) => grade.value),
  );

  res.json({
    data: {
      subjects,
      summary: {
        average: average(allValues),
        totalGrades: allValues.length,
        subjectsWithGrades: subjects.filter(
          (subject) => subject.grades.length > 0,
        ).length,
      },
    },
  });
});

router.get('/resources', async (req, res) => {
  const input = parse(resourceQuerySchema, req.query);
  const { enrollment } = await getStudentContext(req.user!.id);

  const where: Prisma.LibraryResourceWhereInput = {
    classId: enrollment.classId,
    ...(input.subjectId ? { subjectId: input.subjectId } : {}),
    ...(input.type ? { type: input.type } : {}),
    ...(input.search
      ? {
          OR: [
            {
              title: { contains: input.search, mode: 'insensitive' },
            },
            {
              description: { contains: input.search, mode: 'insensitive' },
            },
          ],
        }
      : {}),
  };

  const resources = await prisma.libraryResource.findMany({
    where,
    include: {
      subject: true,
      class: true,
      uploadedBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data: { resources: resources.map(serializeResource) } });
});

export { router as studentRoutes };
