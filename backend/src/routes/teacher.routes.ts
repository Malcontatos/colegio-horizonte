import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.ts';
import { AppError } from '../lib/errors.ts';
import { parse } from '../lib/http.ts';
import {
  buildStoredName,
  decodeOriginalName,
  sanitizeFileName,
  upload,
} from '../lib/upload.ts';
import { serializeResource } from '../lib/serializers.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth, requireRole('TEACHER'));

const uuidSchema = z.string().uuid('Identificador inválido.');
const periodSchema = z.coerce.number().int().min(1).max(4);

const gradebookQuerySchema = z.object({
  subjectId: uuidSchema,
  classId: uuidSchema,
  period: periodSchema,
});

const saveGradesSchema = z.object({
  subjectId: uuidSchema,
  classId: uuidSchema,
  period: periodSchema,
  grades: z
    .array(
      z.object({
        studentId: uuidSchema,
        value: z.number().min(0).max(10).nullable(),
      }),
    )
    .min(1, 'Informe ao menos um aluno.')
    .max(200),
});

const createResourceSchema = z.object({
  title: z.string().trim().min(3, 'Informe um título.').max(160),
  description: z.string().trim().max(1000).optional(),
  subjectId: uuidSchema,
  classId: uuidSchema,
  type: z.enum(['MATERIAL', 'ACTIVITY', 'ASSESSMENT']),
});

async function getTeacher(userId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!teacher) {
    throw new AppError(404, 'Perfil de professor não encontrado.', 'NOT_FOUND');
  }

  return teacher;
}

function serializeAssignment(assignment: {
  id: string;
  subject: { id: string; name: string; code: string; workload: number };
  class: { id: string; name: string; year: number; shift: string };
}) {
  return {
    id: assignment.id,
    subject: assignment.subject,
    class: assignment.class,
  };
}

router.get('/overview', async (req, res) => {
  const teacher = await getTeacher(req.user!.id);

  const [assignments, resourcesCount, gradesCount, recentResources] =
    await Promise.all([
      prisma.teachingAssignment.findMany({
        where: { teacherId: teacher.id },
        include: { subject: true, class: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.libraryResource.count({ where: { uploadedById: req.user!.id } }),
      prisma.grade.count({ where: { teacherId: teacher.id } }),
      prisma.libraryResource.findMany({
        where: { uploadedById: req.user!.id },
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: {
          subject: true,
          class: true,
          uploadedBy: { select: { name: true } },
        },
      }),
    ]);

  const serializedAssignments = assignments
    .map(serializeAssignment)
    .sort(
      (a, b) =>
        a.class.name.localeCompare(b.class.name, 'pt-BR') ||
        a.subject.name.localeCompare(b.subject.name, 'pt-BR'),
    );

  res.json({
    data: {
      teacher: {
        id: teacher.id,
        name: teacher.user.name,
        email: teacher.user.email,
        employeeNumber: teacher.employeeNumber,
      },
      summary: {
        assignments: assignments.length,
        classes: new Set(assignments.map((item) => item.classId)).size,
        subjects: new Set(assignments.map((item) => item.subjectId)).size,
        grades: gradesCount,
        resources: resourcesCount,
      },
      assignments: serializedAssignments,
      recentResources: recentResources.map(serializeResource),
    },
  });
});

router.get('/assignments', async (req, res) => {
  const teacher = await getTeacher(req.user!.id);

  const assignments = await prisma.teachingAssignment.findMany({
    where: { teacherId: teacher.id },
    include: { subject: true, class: true },
    orderBy: { createdAt: 'asc' },
  });

  const serialized = assignments
    .map(serializeAssignment)
    .sort(
      (a, b) =>
        a.class.name.localeCompare(b.class.name, 'pt-BR') ||
        a.subject.name.localeCompare(b.subject.name, 'pt-BR'),
    );

  res.json({ data: { assignments: serialized } });
});

router.get('/gradebook', async (req, res) => {
  const { subjectId, classId, period } = parse(
    gradebookQuerySchema,
    req.query,
  );
  const teacher = await getTeacher(req.user!.id);

  const assignment = await prisma.teachingAssignment.findUnique({
    where: {
      teacherId_subjectId_classId: {
        teacherId: teacher.id,
        subjectId,
        classId,
      },
    },
    include: { subject: true, class: true },
  });

  if (!assignment) {
    throw new AppError(
      403,
      'Você não leciona esta disciplina nesta turma.',
      'FORBIDDEN',
    );
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId,
      year: assignment.class.year,
      status: 'ACTIVE',
    },
    include: {
      student: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      grades: {
        where: { subjectId, period },
        take: 1,
      },
    },
  });

  const students = enrollments
    .map((enrollment) => ({
      studentId: enrollment.studentId,
      enrollmentId: enrollment.id,
      name: enrollment.student.user.name,
      email: enrollment.student.user.email,
      registrationNumber: enrollment.student.registrationNumber,
      grade: enrollment.grades[0]
        ? {
            id: enrollment.grades[0].id,
            value: Number(enrollment.grades[0].value),
          }
        : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  res.json({
    data: {
      subject: assignment.subject,
      class: assignment.class,
      period,
      students,
    },
  });
});

router.put('/grades', async (req, res) => {
  const input = parse(saveGradesSchema, req.body);
  const teacher = await getTeacher(req.user!.id);

  const assignment = await prisma.teachingAssignment.findUnique({
    where: {
      teacherId_subjectId_classId: {
        teacherId: teacher.id,
        subjectId: input.subjectId,
        classId: input.classId,
      },
    },
    include: { class: true },
  });

  if (!assignment) {
    throw new AppError(
      403,
      'Você não leciona esta disciplina nesta turma.',
      'FORBIDDEN',
    );
  }

  const studentIds = input.grades.map((item) => item.studentId);

  if (new Set(studentIds).size !== studentIds.length) {
    throw new AppError(
      400,
      'Há alunos repetidos no lançamento de notas.',
      'DUPLICATE_STUDENT',
    );
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: input.classId,
      year: assignment.class.year,
      status: 'ACTIVE',
    },
  });

  const enrollmentByStudent = new Map(
    enrollments.map((enrollment) => [enrollment.studentId, enrollment]),
  );

  for (const item of input.grades) {
    if (!enrollmentByStudent.has(item.studentId)) {
      throw new AppError(
        400,
        'Um dos alunos informados não pertence a esta turma.',
        'STUDENT_NOT_IN_CLASS',
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const item of input.grades) {
      const enrollment = enrollmentByStudent.get(item.studentId)!;

      if (item.value === null) {
        await tx.grade.deleteMany({
          where: {
            enrollmentId: enrollment.id,
            subjectId: input.subjectId,
            period: input.period,
          },
        });
        continue;
      }

      await tx.grade.upsert({
        where: {
          enrollmentId_subjectId_period: {
            enrollmentId: enrollment.id,
            subjectId: input.subjectId,
            period: input.period,
          },
        },
        update: {
          value: item.value,
          teacherId: teacher.id,
        },
        create: {
          enrollmentId: enrollment.id,
          subjectId: input.subjectId,
          teacherId: teacher.id,
          period: input.period,
          value: item.value,
        },
      });
    }
  });

  res.json({
    data: {
      message: 'Notas salvas com sucesso.',
      saved: input.grades.length,
    },
  });
});

router.get('/resources', async (req, res) => {
  const resources = await prisma.libraryResource.findMany({
    where: { uploadedById: req.user!.id },
    include: {
      subject: true,
      class: true,
      uploadedBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data: { resources: resources.map(serializeResource) } });
});

router.post('/resources', upload.single('file'), async (req, res, next) => {
  try {
    const input = parse(createResourceSchema, req.body);

    if (!req.file) {
      throw new AppError(
        400,
        'Selecione um arquivo para enviar.',
        'FILE_REQUIRED',
      );
    }

    const teacher = await getTeacher(req.user!.id);

    const assignment = await prisma.teachingAssignment.findUnique({
      where: {
        teacherId_subjectId_classId: {
          teacherId: teacher.id,
          subjectId: input.subjectId,
          classId: input.classId,
        },
      },
    });

    if (!assignment) {
      throw new AppError(
        403,
        'Você não leciona esta disciplina nesta turma.',
        'FORBIDDEN',
      );
    }

    const originalName = sanitizeFileName(
      decodeOriginalName(req.file.originalname),
    );

    const resource = await prisma.libraryResource.create({
      data: {
        title: input.title,
        description: input.description || null,
        type: input.type,
        subjectId: input.subjectId,
        classId: input.classId,
        uploadedById: req.user!.id,
        fileName: originalName,
        storedName: buildStoredName(originalName, req.file.mimetype),
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        file: {
          create: {
            content: new Uint8Array(req.file.buffer),
          },
        },
      },
      include: {
        subject: true,
        class: true,
        uploadedBy: { select: { name: true } },
      },
    });

    res.status(201).json({ data: { resource: serializeResource(resource) } });
  } catch (error) {
    next(error);
  }
});

router.delete('/resources/:id', async (req, res) => {
  const id = parse(uuidSchema, req.params.id);

  const resource = await prisma.libraryResource.findFirst({
    where: { id, uploadedById: req.user!.id },
  });

  if (!resource) {
    throw new AppError(404, 'Material não encontrado.', 'NOT_FOUND');
  }

  await prisma.libraryResource.delete({ where: { id: resource.id } });

  res.status(204).send();
});

export { router as teacherRoutes };
