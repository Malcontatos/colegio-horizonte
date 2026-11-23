export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type Shift = 'MORNING' | 'AFTERNOON' | 'EVENING';
export type ResourceType = 'MATERIAL' | 'ACTIVITY' | 'ASSESSMENT';
export type EnrollmentStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  profile:
    | { type: 'STUDENT'; id: string; registrationNumber: string }
    | { type: 'TEACHER'; id: string; employeeNumber: string }
    | null;
};

export type Resource = {
  id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadCount: number;
  createdAt: string;
  subject: { id: string; name: string; code: string };
  class: { id: string; name: string; year: number; shift: Shift } | null;
  uploadedBy: string | null;
};

export type SchoolClass = {
  id: string;
  name: string;
  year: number;
  shift: Shift;
  students: number;
  assignments: number;
};

export type Student = {
  id: string;
  registrationNumber: string;
  birthDate: string | null;
  phone: string | null;
  active: boolean;
  user: { id: string; name: string; email: string };
  enrollment: {
    id: string;
    year: number;
    status: EnrollmentStatus;
    class: { id: string; name: string; year: number; shift: Shift };
  } | null;
};

export type Teacher = {
  id: string;
  employeeNumber: string;
  department: string | null;
  active: boolean;
  user: { id: string; name: string; email: string };
  assignments: number;
};

export type Subject = {
  id: string;
  name: string;
  code: string;
  workload: number;
  assignments: number;
  resources: number;
  grades: number;
};

export type TeachingAssignment = {
  id: string;
  teacher: { id: string; name: string; email: string };
  subject: { id: string; name: string; code: string; workload: number };
  class: { id: string; name: string; year: number; shift: Shift };
};

export type TeacherAssignment = {
  id: string;
  subject: { id: string; name: string; code: string; workload: number };
  class: { id: string; name: string; year: number; shift: Shift };
};

export type AdminOverview = {
  counts: {
    students: number;
    teachers: number;
    subjects: number;
    classes: number;
    resources: number;
    grades: number;
  };
  recentStudents: Student[];
  classes: SchoolClass[];
  recentResources: Resource[];
};

export type TeacherOverview = {
  teacher: {
    id: string;
    name: string;
    email: string;
    employeeNumber: string;
  };
  summary: {
    assignments: number;
    classes: number;
    subjects: number;
    grades: number;
    resources: number;
  };
  assignments: TeacherAssignment[];
  recentResources: Resource[];
};

export type GradebookStudent = {
  studentId: string;
  enrollmentId: string;
  name: string;
  email: string;
  registrationNumber: string;
  grade: { id: string; value: number } | null;
};

export type Gradebook = {
  subject: { id: string; name: string; code: string; workload: number };
  class: { id: string; name: string; year: number; shift: Shift };
  period: number;
  students: GradebookStudent[];
};

export type StudentGrade = {
  id: string;
  period: number;
  value: number;
  updatedAt: string;
};

export type StudentSubject = {
  id: string;
  name: string;
  code: string;
  workload: number;
  teachers: Array<{ id: string; name: string; email: string }>;
  grades: StudentGrade[];
  average: number | null;
};

export type StudentOverview = {
  student: {
    id: string;
    name: string;
    email: string;
    registrationNumber: string;
  };
  enrollment: {
    id: string;
    year: number;
    status: EnrollmentStatus;
    class: { id: string; name: string; year: number; shift: Shift };
  };
  summary: {
    average: number | null;
    subjects: number;
    grades: number;
    resources: number;
  };
  performance: Array<{
    id: string;
    name: string;
    code: string;
    average: number | null;
  }>;
  recentGrades: Array<StudentGrade & {
    subject: { id: string; name: string; code: string };
  }>;
  recentResources: Resource[];
};

export type StudentSubjectsResponse = {
  subjects: StudentSubject[];
  summary: {
    average: number | null;
    totalGrades: number;
    subjectsWithGrades: number;
  };
};

export type ApiErrorBody = {
  error?: {
    message?: string;
    code?: string;
    details?: unknown;
  };
};
