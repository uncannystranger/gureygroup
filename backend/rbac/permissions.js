export const PERMISSIONS = {
  ORG_VIEW: 'org:view',
  ORG_EDIT: 'org:edit',
  ORG_DELETE: 'org:delete',
  ORG_MANAGE_SUBSCRIPTION: 'org:manage_subscription',
  TEAM_VIEW: 'team:view',
  TEAM_INVITE: 'team:invite',
  TEAM_REMOVE: 'team:remove',
  TEAM_EDIT_ROLES: 'team:edit_roles',
  PRODUCTS_VIEW: 'products:view',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_EDIT: 'products:edit',
  PRODUCTS_DELETE: 'products:delete',
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_MANAGE: 'inventory:manage',
  SALES_CREATE: 'sales:create',
  SALES_VIEW: 'sales:view',
  SALES_VIEW_PROFITS: 'sales:view_profits',
  SALES_REFUND: 'sales:refund',
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  ATTENDANCE_CHECK_IN: 'attendance:check_in',
  ATTENDANCE_VIEW_OWN: 'attendance:view_own',
  ATTENDANCE_VIEW_ALL: 'attendance:view_all',
  ATTENDANCE_APPROVE: 'attendance:approve',
  BRANCHES_VIEW_OWN: 'branches:view_own',
  BRANCHES_VIEW_ALL: 'branches:view_all',
  BRANCHES_MANAGE: 'branches:manage',
  AUDIT_VIEW: 'audit:view',
  SESSIONS_VIEW: 'sessions:view',
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_MANAGE: 'settings:manage',
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS = {
  Owner: [...ALL_PERMISSIONS],
  Admin: ALL_PERMISSIONS.filter((permission) =>
    permission !== PERMISSIONS.ORG_DELETE &&
    permission !== PERMISSIONS.ORG_MANAGE_SUBSCRIPTION
  ),
  Manager: [
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.ATTENDANCE_CHECK_IN,
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.ATTENDANCE_VIEW_ALL,
    PERMISSIONS.ATTENDANCE_APPROVE,
    PERMISSIONS.BRANCHES_VIEW_OWN,
    PERMISSIONS.SETTINGS_VIEW,
  ],
  Cashier: [
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.ATTENDANCE_CHECK_IN,
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.BRANCHES_VIEW_OWN,
  ],
  'Inventory Staff': [
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.ATTENDANCE_CHECK_IN,
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.BRANCHES_VIEW_OWN,
  ],
  Employee: [
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.ATTENDANCE_CHECK_IN,
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.BRANCHES_VIEW_OWN,
  ],
};

export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Employee;
}

export function normalizePermissions(role, permissions) {
  const allowed = new Set(ALL_PERMISSIONS);
  const provided = Array.isArray(permissions) ? permissions.filter((permission) => allowed.has(permission)) : [];
  return provided.length > 0 ? provided : getPermissionsForRole(role);
}
