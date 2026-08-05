/**
 * RBAC Context — Role-Based Access Control Provider & Hooks
 * 
 * Reads the current user's role from AuthContext and provides
 * permission-checking utilities throughout the component tree.
 */

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  ROLES,
  ROLE_PERMISSIONS,
  roleHasPermission,
  getPermissionsForRole,
  isRoleAtLeast,
  getRoleLevel,
} from './permissions';

const RBACContext = createContext({
  role: ROLES.EMPLOYEE,
  permissions: [],
  hasPermission: () => false,
  isAtLeast: () => false,
});

export function RBACProvider({ children }) {
  const { currentUser } = useAuth();
  const isEmployeeAccount = currentUser?.accountType === 'employee';

  // Derive role from the authenticated user — default to EMPLOYEE for safety
  const role = currentUser?.role || ROLES.EMPLOYEE;

  const permissions = useMemo(() => {
    if (Array.isArray(currentUser?.permissions) && currentUser.permissions.length > 0) {
      return currentUser.permissions;
    }
    return getPermissionsForRole(role);
  }, [currentUser?.permissions, role]);

  // Check if the current user has a specific permission
  const hasPermission = useCallback(
    (permission) => {
      // An employee may hold an operational role, but never receives owner
      // administration access merely because that role is named "Admin".
      const ownerOnly = ['org:edit', 'org:delete', 'org:manage_subscription', 'team:view', 'team:invite', 'team:remove', 'team:edit_roles', 'settings:view', 'settings:manage'];
      if (isEmployeeAccount && ownerOnly.includes(permission)) return false;
      return permissions.includes(permission) || roleHasPermission(role, permission);
    },
    [permissions, role, isEmployeeAccount]
  );

  // Check if user's role is at least the given level
  const isAtLeast = useCallback(
    (requiredRole) => isRoleAtLeast(role, requiredRole),
    [role]
  );

  const value = useMemo(() => ({
    role,
    permissions,
    hasPermission,
    isAtLeast,
  }), [role, permissions, hasPermission, isAtLeast]);

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Get the full RBAC context.
 */
export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
}

/**
 * Get the current user's role string.
 */
export function useRole() {
  const { role } = useRBAC();
  return role;
}

/**
 * Check a single permission. Returns boolean.
 * @param {string} permission - e.g. 'team:invite'
 */
export function usePermission(permission) {
  const { hasPermission } = useRBAC();
  return hasPermission(permission);
}

/**
 * Check multiple permissions. Returns true if ALL are granted.
 * @param {string[]} permissions
 */
export function usePermissions(permissions) {
  const { hasPermission } = useRBAC();
  return permissions.every(p => hasPermission(p));
}

/**
 * Check if user can do at least one of the given permissions.
 * @param {string[]} permissions
 */
export function useAnyPermission(permissions) {
  const { hasPermission } = useRBAC();
  return permissions.some(p => hasPermission(p));
}

// ─── Guard Components ────────────────────────────────────────────────────────

/**
 * Renders children only if the user has the specified permission.
 * Optionally renders a fallback component otherwise.
 *
 * Usage:
 *   <RequirePermission permission="team:invite" fallback={<AccessDenied />}>
 *     <InviteButton />
 *   </RequirePermission>
 */
export function RequirePermission({ permission, permissions, fallback = null, children }) {
  const { hasPermission } = useRBAC();

  // Single permission check
  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  // Multiple permissions — require ALL
  if (permissions && !permissions.every(p => hasPermission(p))) {
    return fallback;
  }

  return children;
}

/**
 * Renders children only if user role is at least the specified role level.
 */
export function RequireRole({ role: requiredRole, fallback = null, children }) {
  const { isAtLeast } = useRBAC();

  if (!isAtLeast(requiredRole)) {
    return fallback;
  }

  return children;
}

export default RBACContext;
