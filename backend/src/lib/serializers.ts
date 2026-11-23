import type { Role } from '../generated/prisma/enums.ts';

export type SessionUserInput = {
  id: string;
  name: string;
  email: string;
  role: Role;
  student?: { id: string; registrationNumber: string } | null;
  teacher?: { id: string; employeeNumber: string } | null;
};

export function serializeSessionUser(user: SessionUserInput) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profile: user.student
      ? {
          type: 'STUDENT' as const,
          id: user.student.id,
          registrationNumber: user.student.registrationNumber,
        }
      : user.teacher
        ? {
            type: 'TEACHER' as const,
            id: user.teacher.id,
            employeeNumber: user.teacher.employeeNumber,
          }
        : null,
  };
}

export type ResourceWithRelations = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadCount: number;
  createdAt: Date;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  class: {
    id: string;
    name: string;
    year: number;
    shift: string;
  } | null;
  uploadedBy?: {
    name: string;
  } | null;
};

export function serializeResource(resource: ResourceWithRelations) {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    type: resource.type,
    fileName: resource.fileName,
    mimeType: resource.mimeType,
    sizeBytes: resource.sizeBytes,
    downloadCount: resource.downloadCount,
    createdAt: resource.createdAt,
    subject: {
      id: resource.subject.id,
      name: resource.subject.name,
      code: resource.subject.code,
    },
    class: resource.class
      ? {
          id: resource.class.id,
          name: resource.class.name,
          year: resource.class.year,
          shift: resource.class.shift,
        }
      : null,
    uploadedBy: resource.uploadedBy?.name ?? null,
  };
}

export type StudentWithRelations = {
  id: string;
  registrationNumber: string;
  birthDate: Date | null;
  phone: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    active: boolean;
  };
  enrollments: Array<{
    id: string;
    year: number;
    status: string;
    class: {
      id: string;
      name: string;
      year: number;
      shift: string;
    };
  }>;
};

export function serializeStudent(student: StudentWithRelations) {
  const enrollment = student.enrollments[0] ?? null;

  return {
    id: student.id,
    registrationNumber: student.registrationNumber,
    birthDate: student.birthDate,
    phone: student.phone,
    active: student.user.active,
    user: {
      id: student.user.id,
      name: student.user.name,
      email: student.user.email,
    },
    enrollment: enrollment
      ? {
          id: enrollment.id,
          year: enrollment.year,
          status: enrollment.status,
          class: {
            id: enrollment.class.id,
            name: enrollment.class.name,
            year: enrollment.class.year,
            shift: enrollment.class.shift,
          },
        }
      : null,
  };
}
