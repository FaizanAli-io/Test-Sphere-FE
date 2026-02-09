// Common types for both portals
export interface BaseClass {
  id: number | string;
  name: string;
  code: string;
  description?: string;
  role?: string; // OWNER, EDITOR, VIEWER, etc.
  assignedAt?: string;
  students?: Array<{ id: number; name: string; email: string }>;
  tests?: Array<{ id: number; title: string; [key: string]: unknown }>;
  studentCount?: number;
  testCount?: number;
  createdAt?: string;
  updatedAt?: string;
  approved?: boolean;
  disabled?: boolean;
  statusLabel?: string;
}

export interface QuickAction {
  icon: string;
  title: string;
  description: string;
  actionText: string;
  colorScheme: "indigo" | "orange" | "green" | "blue";
  onClick: () => void;
}

export interface ClassCardAction {
  label: string;
  onClick: (classData: BaseClass) => void;
  colorScheme: "green" | "blue" | "yellow" | "red" | "orange";
  variant?: "primary" | "secondary";
  badge?: (classData: BaseClass) => number | undefined;
}

export interface BasePortalProps {
  role: "student" | "teacher";
  quickActions: QuickAction[];
  classes: BaseClass[];
  loading: boolean;
  error?: string | null;
  success?: string | null;
  copiedCode: string | number | null;
  classCardActions: ClassCardAction[];
  children?: React.ReactNode;
  onPrimaryAction: () => void;
  onClassClick?: (classData: BaseClass) => void;
  onCopyCode: (code: string, id: string | number) => void;
}
