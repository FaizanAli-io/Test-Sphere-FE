import { ReactNode } from "react";

// Common types for both portals
export interface BaseClass {
  id: string | number;
  name: string;
  description?: string;
  code: string;
  students?: Array<{ id: number; name: string; email: string }>;
  tests?: Array<{ id: number; title: string; [key: string]: unknown }>;
  studentCount?: number;
  testCount?: number;
  createdAt?: string;
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
}

export interface BasePortalProps {
  title: string;
  subtitle: string;
  headerIcon: ReactNode;
  quickActions: QuickAction[];
  classes: BaseClass[];
  loading: boolean;
  error?: string | null;
  success?: string | null;
  copiedCode: string | number | null;

  // Class list configuration
  classListTitle: string;
  classListSubtitle: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  emptyStateTitle: string;
  emptyStateSubtitle: string;
  emptyStateIcon: string;
  emptyStateActionLabel: string;

  // Copy functionality
  onCopyCode: (code: string, id: string | number) => void;

  // Class card actions (these will be different for each portal)
  classCardActions: ClassCardAction[];

  // Additional content (modals, etc.)
  children?: ReactNode;
}
