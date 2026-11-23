import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.ts';
import { AppError } from '../lib/errors.ts';
import { parse } from '../lib/http.ts';
import {
  serializeResource,
  serializeStudent,
  type StudentWithRelations,
} from '../lib/serializers.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';
import type { Prisma } from '../generated/prisma/client.ts';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

const uuidSchema = z.string().uuid('Identificador inválido.');
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Informe um e-mail válido.');
const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .regex(/[A-Za-z]/, 'A senha deve conter letras.')
  .regex(/[0-9]/, 'A senha deve conter números.');
const nameSchema = z
  .string()
  .trim()
  .min(3, 'Informe o nome completo.')
  .max(120, 'O nome deve ter no máximo 120 caracteres.');

const studentInclude = {
  user: { select: { id: true, name: true, email: true, active: true } },
  enrollments: {
    include: { class: true },
    orderBy: { year: 'desc' as const },
    take: 1,
  },
} satisfies Prisma.StudentInclude;

const teacherInclude = {
  user: { select: { id: true, name: true, email: true, active: true } },
  _count: { select: { assignments: true } },
} satisfies Prisma.TeacherInclude;

const assignmentInclude = {
  teacher: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
  subject: true,
  class: true,
} satisfies Prisma.TeachingAssignmentInclude;

const createStudentSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  registrationNumber: z
    .string()
    .trim()
    .min(3, 'Informe a matrícula.')
    .max(30, 'A matrícula deve ter no máximo 30 caracteres.'),
  classId: uuidSchema,
  birthDate: z.coerce.date().optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
});

const updateStudentSchema = z.object({
  active: z.boolean().optional(),
  classId: uuidSchema.optional(),
});

const createTeacherSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  employeeNumber: z
    .string()
    .trim()
    .min(3, 'Informe a matrícula funcional.')
    .max(30, 'A matrícula funcional deve ter no máximo 30 caracteres.'),
  department: z.string().trim().max(80).optional().nullable(),
});

const createSubjectSchema = z.object({
  name: z.string().trim().min(3, 'Informe o nome da disciplina.').max(80),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'Informe o código da disciplina.')
    .max(10, 'O código deve ter no máximo 10 caracteres.')
    .regex(/^[A-Z0-9]+$/, 'Use apenas letras e números no código.'),
  workload: z.coerce
    .number()
    .int()
    .min(1, 'A carga horária deve ser maior que zero.')
    .max(2000),
});

const createClassSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da turma.').max(60),
  year: z.coerce.number().int().min(2000).max(2100),
  shift: z.enum(['MORNING', 'AFTERNOON', 'EVENING']),
});

const createAssignmentSchema = z.object({
  teacherId: uuidSchema,
  subjectId: uuidSchema,
  classId: uuidSchema,
});

const searchSchema = z.object({
  search: z.string().trim().max(100).optional(),
});

function serializeTeacher(teacher: {
  id: string;
  employeeNumber: string;
  department: string | null;
  user: { id: string; name: string; email: string; active: boolean };
  _count: { assignments: number };
}) {
  return {
    id: teacher.id,
    employeeNumber: teacher.employeeNumber,
    department: teacher.department,
    active: teacher.user.active,
    user: {
      id: teacher.user.id,
      name: teacher.user.name,
      email: teacher.user.email,
    },
    assignments: teacher._count.assignments,
  };
}

function serializeAssignment(assignment: {
  id: string;
  teacher: {
    id: string;
    user: { id: string; name: string; email: string };
  };
  subject: { id: string; name: string; code: string; workload: number };
  class: { id: string; name: string; year: number; shift: string };
}) {
  return {
    id: assignment.id,
    teacher: {
      id: assignment.teacher.id,
      name: assignment.teacher.user.name,
      email: assignment.teacher.user.email,
    },
    subject: assignment.subject,
    class: assignment.class,
  };
}

router.get('/overview', async (_req, res) => {
  const [
    students,
    teachers,
    subjects,
    classes,
    resources,
    grades,
    recentStudents,
    classList,
    recentResources,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.subject.count(),
    prisma.schoolClass.count(),
    prisma.libraryResource.count(),
    prisma.grade.count(),
    prisma.student.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: studentInclude,
    }),
    prisma.schoolClass.findMany({
      include: {
        _count: { select: { enrollments: true, assignments: true } },
      },
      orderBy: [{ year: 'desc' }, { name: 'asc' }],
    }),
    prisma.libraryResource.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: {
        subject: true,
        class: true,
        uploadedBy: { select: { name: true } },
      },
    }),
  ]);

  res.json({
    data: {
      counts: { students, teachers, subjects, classes, resources, grades },
      recentStudents: recentStudents.map((student) =>
        serializeStudent(student as StudentWithRelations),
      ),
      classes: classList.map((schoolClass) => ({
        id: schoolClass.id,
        name: schoolClass.name,
        year: schoolClass.year,
        shift: schoolClass.shift,
        students: schoolClass._count.enrollments,
        assignments: schoolClass._count.assignments,
      })),
      recentResources: recentResources.map(serializeResource),
    },
  });
});

router.get('/students', async (req, res) => {
  const { search } = parse(searchSchema, req.query);

  const where: Prisma.StudentWhereInput = search
    ? {
        OR: [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { registrationNumber: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const students = await prisma.student.findMany({
    where,
    include: studentInclude,
    orderBy: { user: { name: 'asc' } },
  });

  res.json({
    data: {
      students: students.map((student) =>
        serializeStudent(student as StudentWithRelations),
      ),
    },
  });
});

router.post('/students', async (req, res) => {
  const input = parse(createStudentSchema, req.body);

  const schoolClass = await prisma.schoolClass.findUnique({
    where: { id: input.classId },
  });

  if (!schoolClass) {
    throw new AppError(404, 'Turma não encontrada.', 'NOT_FOUND');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const student = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: 'STUDENT',
        student: {
          create: {
            registrationNumber: input.registrationNumber,
            birthDate: input.birthDate ?? null,
            phone: input.phone || null,
          },
        },
      },
      include: { student: true },
    });

    if (!user.student) {
      throw new AppError(
        500,
        'Não foi possível criar o perfil do aluno.',
        'INTERNAL_ERROR',
      );
    }

    await tx.enrollment.create({
      data: {
        studentId: user.student.id,
        classId: schoolClass.id,
        year: schoolClass.year,
        status: 'ACTIVE',
      },
    });

    return tx.student.findUniqueOrThrow({
      where: { id: user.student.id },
      include: studentInclude,
    });
  });

  res.status(201).json({
    data: { student: serializeStudent(student as StudentWithRelations) },
  });
});

router.patch('/students/:id', async (req, res) => {
  const id = parse(uuidSchema, req.params.id);
  const input = parse(updateStudentSchema, req.body);

  const student = await prisma.student.findUnique({
    where: { id },
    include: studentInclude,
  });

  if (!student) {
    throw new AppError(404, 'Aluno não encontrado.', 'NOT_FOUND');
  }

  await prisma.$transaction(async (tx) => {
    if (input.active !== undefined) {
      await tx.user.update({
        where: { id: student.userId },
        data: { active: input.active },
      });
    }

    if (input.classId) {
      const schoolClass = await tx.schoolClass.findUnique({
        where: { id: input.classId },
      });

      if (!schoolClass) {
        throw new AppError(404, 'Turma não encontrada.', 'NOT_FOUND');
      }

      await tx.enrollment.upsert({
        where: {
          studentId_year: {
            studentId: student.id,
            year: schoolClass.year,
          },
        },
        update: { classId: schoolClass.id, status: 'ACTIVE' },
        create: {
          studentId: student.id,
          classId: schoolClass.id,
          year: schoolClass.year,
          status: 'ACTIVE',
        },
      });
    }
  });

  const updated = await prisma.student.findUniqueOrThrow({
    where: { id },
    include: studentInclude,
  });

  res.json({
    data: { student: serializeStudent(updated as StudentWithRelations) },
  });
});

router.get('/teachers', async (_req, res) => {
  const teachers = await prisma.teacher.findMany({
    include: teacherInclude,
    orderBy: { user: { name: 'asc' } },
  });

  res.json({ data: { teachers: teachers.map(serializeTeacher) } });
});

router.post('/teachers', async (req, res) => {
  const input = parse(createTeacherSchema, req.body);
  const passwordHash = await bcrypt.hash(input.password, 10);

  const teacher = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: 'TEACHER',
        teacher: {
          create: {
            employeeNumber: input.employeeNumber,
            department: input.department || null,
          },
        },
      },
      include: { teacher: true },
    });

    if (!user.teacher) {
      throw new AppError(
        500,
        'Não foi possível criar o perfil do professor.',
        'INTERNAL_ERROR',
      );
    }

    return tx.teacher.findUniqueOrThrow({
      where: { id: user.teacher.id },
      include: teacherInclude,
    });
  });

  res.status(201).json({ data: { teacher: serializeTeacher(teacher) } });
});

router.get('/subjects', async (_req, res) => {
  const subjects = await prisma.subject.findMany({
    include: {
      _count: { select: { assignments: true, resources: true, grades: true } },
    },
    orderBy: { name: 'asc' },
  });

  res.json({
    data: {
      subjects: subjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        workload: subject.workload,
        assignments: subject._count.assignments,
        resources: subject._count.resources,
        grades: subject._count.grades,
      })),
    },
  });
});

router.post('/subjects', async (req, res) => {
  const input = parse(createSubjectSchema, req.body);

  const subject = await prisma.subject.create({
    data: input,
    include: {
      _count: { select: { assignments: true, resources: true, grades: true } },
    },
  });

  res.status(201).json({
    data: {
      subject: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        workload: subject.workload,
        assignments: subject._count.assignments,
        resources: subject._count.resources,
        grades: subject._count.grades,
      },
    },
  });
});

router.get('/classes', async (_req, res) => {
  const classes = await prisma.schoolClass.findMany({
    include: {
      _count: { select: { enrollments: true, assignments: true } },
    },
    orderBy: [{ year: 'desc' }, { name: 'asc' }],
  });

  res.json({
    data: {
      classes: classes.map((schoolClass) => ({
        id: schoolClass.id,
        name: schoolClass.name,
        year: schoolClass.year,
        shift: schoolClass.shift,
        students: schoolClass._count.enrollments,
        assignments: schoolClass._count.assignments,
      })),
    },
  });
});

router.post('/classes', async (req, res) => {
  const input = parse(createClassSchema, req.body);

  const schoolClass = await prisma.schoolClass.create({
    data: input,
    include: {
      _count: { select: { enrollments: true, assignments: true } },
    },
  });

  res.status(201).json({
    data: {
      class: {
        id: schoolClass.id,
        name: schoolClass.name,
        year: schoolClass.year,
        shift: schoolClass.shift,
        students: schoolClass._count.enrollments,
        assignments: schoolClass._count.assignments,
      },
    },
  });
});

router.get('/assignments', async (_req, res) => {
  const assignments = await prisma.teachingAssignment.findMany({
    include: assignmentInclude,
    orderBy: { createdAt: 'asc' },
  });

  const serialized = assignments
    .map(serializeAssignment)
    .sort(
      (a, b) =>
        a.class.name.localeCompare(b.class.name, 'pt-BR') ||
        a.teacher.name.localeCompare(b.teacher.name, 'pt-BR') ||
        a.subject.name.localeCompare(b.subject.name, 'pt-BR'),
    );

  res.json({ data: { assignments: serialized } });
});

router.post('/assignments', async (req, res) => {
  const input = parse(createAssignmentSchema, req.body);

  const [teacher, subject, schoolClass] = await Promise.all([
    prisma.teacher.findUnique({ where: { id: input.teacherId } }),
    prisma.subject.findUnique({ where: { id: input.subjectId } }),
    prisma.schoolClass.findUnique({ where: { id: input.classId } }),
  ]);

  if (!teacher) {
    throw new AppError(404, 'Professor não encontrado.', 'NOT_FOUND');
  }

  if (!subject) {
    throw new AppError(404, 'Disciplina não encontrada.', 'NOT_FOUND');
  }

  if (!schoolClass) {
    throw new AppError(404, 'Turma não encontrada.', 'NOT_FOUND');
  }

  const assignment = await prisma.teachingAssignment.create({
    data: input,
    include: assignmentInclude,
  });

  res.status(201).json({
    data: { assignment: serializeAssignment(assignment) },
  });
});

router.delete('/assignments/:id', async (req, res) => {
  const id = parse(uuidSchema, req.params.id);

  const assignment = await prisma.teachingAssignment.findUnique({
    where: { id },
  });

  if (!assignment) {
    throw new AppError(404, 'Vínculo não encontrado.', 'NOT_FOUND');
  }

  await prisma.teachingAssignment.delete({ where: { id } });
  res.status(204).send();
});

export { router as adminRoutes };
