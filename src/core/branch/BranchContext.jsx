import React, { createContext, useContext, useMemo } from 'react';
import { useMultiTenant } from '../tenant/MultiTenantContext';

// A single branch-aware contract for future POS, inventory, reports, mobile,
// and analytics features. It deliberately delegates persistence and fetching to
// MultiTenantContext so there is one source of truth for workspace scope.
const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  const tenant = useMultiTenant();
  const value = useMemo(() => ({
    branches: tenant.branches,
    activeBranch: tenant.activeBranch,
    activeBranchId: tenant.activeBranchId,
    selectBranch: tenant.setActiveBranchId,
    isBranchReady: Boolean(tenant.activeBranchId),
  }), [tenant.branches, tenant.activeBranch, tenant.activeBranchId, tenant.setActiveBranchId]);

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranchContext() {
  const context = useContext(BranchContext);
  if (!context) throw new Error('useBranchContext must be used within BranchProvider.');
  return context;
}
