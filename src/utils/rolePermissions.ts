/**
 * Role-based permission utilities for teacher access control
 * DRY principle: centralized permission checks
 */

export type TeacherRole = "OWNER" | "EDITOR" | "VIEWER";

/**
 * Check if teacher can perform general edit operations
 * (create/edit tests, questions, pools, etc.)
 */
export const canEdit = (role?: TeacherRole): boolean => {
  return role === "OWNER" || role === "EDITOR";
};

/**
 * Check if teacher can delete resources
 * Only OWNER can delete: classes, tests, submissions, proctoring logs
 */
export const canDelete = (role?: TeacherRole): boolean => {
  return role === "OWNER";
};

/**
 * Check if teacher can manage class members
 * Only OWNER can: add/update/remove teachers, approve/reject students
 */
export const canManageMembers = (role?: TeacherRole): boolean => {
  return role === "OWNER";
};

/**
 * Check if teacher can view resources (always true for any teacher role)
 */
export const canView = (role?: TeacherRole): boolean => {
  return true;
};

/**
 * Permission object for easy destructuring
 */
export const getPermissions = (role?: TeacherRole) => ({
  canEdit: canEdit(role),
  canDelete: canDelete(role),
  canManageMembers: canManageMembers(role),
  canView: canView(role),
});
