export interface ClassData {
  id: number;
  name: string;
  description?: string;
  code: string;
  teacherId: number;
  teacher?: {
    id: number;
    name: string;
    email: string;
  };
  students?: Array<{ id: number; name: string; email: string }>;
  tests?: Array<{ id: number; title: string; [key: string]: unknown }>;
  studentCount?: number;
  testCount?: number;
  createdAt?: string;
}

export interface Test {
  id: number;
  title: string;
  description?: string;
  duration?: number;
  startAt?: string;
  endAt?: string;
  status?: string;
}

export interface ModalState {
  showJoinModal: boolean;
  showDetailsModal: boolean;
  showTestsModal: boolean;
  selectedClass: ClassData | null;
  testsForClass: number | null;
}

export interface LoadingState {
  loading: boolean;
  joining: boolean;
  loadingDetails: boolean;
  testsLoading: boolean;
}

export interface NotificationState {
  error: string | null;
  success: string | null;
  copiedCode: number | null;
}
