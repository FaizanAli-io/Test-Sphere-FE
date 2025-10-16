export interface Student {
  id: number;
  email: string;
  firebaseId: string | null;
  cnic: string;
  role: string;
  name: string;
  password: string;
  profileImage: string | null;
  verified: boolean;
  otp: string | null;
  otpExpiry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClassStudent {
  studentId: number;
  classId: number;
  approved: boolean;
  joinedAt: string;
  student: Student;
}

export interface Class {
  id: string;
  name: string;
  description: string;
  code: string;
  createdBy: string;
  teacherId?: number;
  students?: ClassStudent[];
  tests?: Array<{ id: number; title: string; [key: string]: unknown }>;
  studentCount?: number;
  testCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface KickConfirm {
  classId: string;
  studentId: number;
  studentName: string;
}

export interface RequestAction {
  classId: string;
  studentId: number;
  studentName: string;
  action: "approve" | "reject";
}

export interface NewClass {
  name: string;
  description: string;
}
