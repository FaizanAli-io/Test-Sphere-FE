export interface Class {
  id: string;
  name: string;
  description: string;
  code: string;
  createdBy: string;
  students?: Array<{ id: number; name: string; email: string }>;
  tests?: Array<{ id: number; title: string; [key: string]: unknown }>;
  studentCount?: number;
  testCount?: number;
  createdAt?: string;
}

export interface KickConfirm {
  classId: string;
  studentId: number;
  studentName: string;
}

export interface NewClass {
  name: string;
  description: string;
}
