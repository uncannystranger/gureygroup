/**
 * RBAC Permission Engine — Configuration-Driven
 * 
 * All permissions are string constants. Roles map to arrays of granted permissions.
 * Permission checks are performed by looking up the user's role in the matrix.
 * This design allows runtime customization (custom roles per org) without code changes.
 */

// ─── Permission Constants ────────────────────────────────────────────────────

export const PERMISSIONS = {
  // Organization
  ORG_VIEW:               'org:view',
  ORG_EDIT:               'org:edit',
  ORG_DELETE:             'org:delete',
  ORG_MANAGE_SUBSCRIPTION:'org:manage_subscription',

  // Team / Employee Management
  TEAM_VIEW:              'team:view',
  TEAM_INVITE:            'team:invite',
  TEAM_REMOVE:            'team:remove',
  TEAM_EDIT_ROLES:        'team:edit_roles',

  // Products
  PRODUCTS_VIEW:          'products:view',
  PRODUCTS_CREATE:        'products:create',
  PRODUCTS_EDIT:          'products:edit',
  PRODUCTS_DELETE:        'products:delete',

  // Inventory
  INVENTORY_VIEW:         'inventory:view',
  INVENTORY_MANAGE:       'inventory:manage',

  // Sales / POS
  SALES_CREATE:           'sales:create',
  SALES_VIEW:             'sales:view',
  SALES_VIEW_PROFITS:     'sales:view_profits',
  SALES_REFUND:           'sales:refund',

  // Reports & Analytics
  REPORTS_VIEW:           'reports:view',
  REPORTS_EXPORT:         'reports:export',

  // Attendance
  ATTENDANCE_CHECK_IN:    'attendance:check_in',
  ATTENDANCE_VIEW_OWN:    'attendance:view_own',
  ATTENDANCE_VIEW_ALL:    'attendance:view_all',
  ATTENDANCE_APPROVE:     'attendance:approve',

  // Branches
  BRANCHES_VIEW_OWN:      'branches:view_own',
  BRANCHES_VIEW_ALL:      'branches:view_all',
  BRANCHES_MANAGE:        'branches:manage',

  // Audit Logs
  AUDIT_VIEW:             'audit:view',

  // Sessions
  SESSIONS_VIEW:          'sessions:view',

  // Settings
  SETTINGS_VIEW:          'settings:view',
  SETTINGS_MANAGE:        'settings:manage',
};

// All permission values as a flat array
export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// ─── Role Definitions ────────────────────────────────────────────────────────

export const ROLES = {
  OWNER:           'Owner',
  ADMIN:           'Admin',
  MANAGER:         'Manager',
  CASHIER:         'Cashier',
  INVENTORY_STAFF: 'Inventory Staff',
  EMPLOYEE:        'Employee',
};

export const ROLE_LIST = Object.values(ROLES);

// ─── Role → Permission Matrix ───────────────────────────────────────────────

export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: [...ALL_PERMISSIONS],

  [ROLES.ADMIN]: ALL_PERMISSIONS.filter(p =>
    p !== PERMISSIONS.ORG_DELETE &&
    p !== PERMISSIONS.ORG_MANAGE_SUBSCRIPTION
  ),

  [ROLES.MANAGER]: [
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

  [ROLES.CASHIER]: [
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.ATTENDANCE_CHECK_IN,
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.BRANCHES_VIEW_OWN,
  ],

  [ROLES.INVENTORY_STAFF]: [
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.ATTENDANCE_CHECK_IN,
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.BRANCHES_VIEW_OWN,
  ],

  [ROLES.EMPLOYEE]: [
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.ATTENDANCE_CHECK_IN,
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.BRANCHES_VIEW_OWN,
  ],
};

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Check if a given role has a specific permission.
 * @param {string} role - The role name (e.g. 'Owner')
 * @param {string} permission - The permission string (e.g. 'team:invite')
 * @returns {boolean}
 */
export function roleHasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

/**
 * Get all permissions for a role.
 * @param {string} role - The role name
 * @returns {string[]}
 */
export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role is at least as powerful as another.
 * Uses a simple hierarchy: OWNER > ADMIN > MANAGER > CASHIER/INVENTORY_STAFF > EMPLOYEE
 */
const ROLE_HIERARCHY = {
  [ROLES.OWNER]: 100,
  [ROLES.ADMIN]: 80,
  [ROLES.MANAGER]: 60,
  [ROLES.CASHIER]: 40,
  [ROLES.INVENTORY_STAFF]: 40,
  [ROLES.EMPLOYEE]: 20,
};

export function getRoleLevel(role) {
  return ROLE_HIERARCHY[role] || 0;
}

export function isRoleAtLeast(userRole, requiredRole) {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

/**
 * Grouped permissions for UI display (e.g. permission management screen).
 */
export const PERMISSION_GROUPS = [
  {
    label: 'Organization',
    permissions: [
      { key: PERMISSIONS.ORG_VIEW, label: 'View organization' },
      { key: PERMISSIONS.ORG_EDIT, label: 'Edit organization settings' },
      { key: PERMISSIONS.ORG_DELETE, label: 'Delete organization' },
      { key: PERMISSIONS.ORG_MANAGE_SUBSCRIPTION, label: 'Manage subscription' },
    ],
  },
  {
    label: 'Team Management',
    permissions: [
      { key: PERMISSIONS.TEAM_VIEW, label: 'View team members' },
      { key: PERMISSIONS.TEAM_INVITE, label: 'Invite employees' },
      { key: PERMISSIONS.TEAM_REMOVE, label: 'Remove employees' },
      { key: PERMISSIONS.TEAM_EDIT_ROLES, label: 'Edit roles & permissions' },
    ],
  },
  {
    label: 'Products',
    permissions: [
      { key: PERMISSIONS.PRODUCTS_VIEW, label: 'View products' },
      { key: PERMISSIONS.PRODUCTS_CREATE, label: 'Create products' },
      { key: PERMISSIONS.PRODUCTS_EDIT, label: 'Edit products' },
      { key: PERMISSIONS.PRODUCTS_DELETE, label: 'Delete products' },
    ],
  },
  {
    label: 'Inventory',
    permissions: [
      { key: PERMISSIONS.INVENTORY_VIEW, label: 'View inventory' },
      { key: PERMISSIONS.INVENTORY_MANAGE, label: 'Manage inventory' },
    ],
  },
  {
    label: 'Sales & POS',
    permissions: [
      { key: PERMISSIONS.SALES_CREATE, label: 'Create sales' },
      { key: PERMISSIONS.SALES_VIEW, label: 'View sales' },
      { key: PERMISSIONS.SALES_VIEW_PROFITS, label: 'View profits' },
      { key: PERMISSIONS.SALES_REFUND, label: 'Process refunds' },
    ],
  },
  {
    label: 'Reports',
    permissions: [
      { key: PERMISSIONS.REPORTS_VIEW, label: 'View reports' },
      { key: PERMISSIONS.REPORTS_EXPORT, label: 'Export reports' },
    ],
  },
  {
    label: 'Attendance',
    permissions: [
      { key: PERMISSIONS.ATTENDANCE_CHECK_IN, label: 'Check in / out' },
      { key: PERMISSIONS.ATTENDANCE_VIEW_OWN, label: 'View own attendance' },
      { key: PERMISSIONS.ATTENDANCE_VIEW_ALL, label: 'View all attendance' },
      { key: PERMISSIONS.ATTENDANCE_APPROVE, label: 'Approve attendance' },
    ],
  },
  {
    label: 'Branches',
    permissions: [
      { key: PERMISSIONS.BRANCHES_VIEW_OWN, label: 'View own branch' },
      { key: PERMISSIONS.BRANCHES_VIEW_ALL, label: 'View all branches' },
      { key: PERMISSIONS.BRANCHES_MANAGE, label: 'Manage branches' },
    ],
  },
  {
    label: 'Administration',
    permissions: [
      { key: PERMISSIONS.AUDIT_VIEW, label: 'View audit logs' },
      { key: PERMISSIONS.SESSIONS_VIEW, label: 'View sessions' },
      { key: PERMISSIONS.SETTINGS_VIEW, label: 'View settings' },
      { key: PERMISSIONS.SETTINGS_MANAGE, label: 'Manage settings' },
    ],
  },
];
