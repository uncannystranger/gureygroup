import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { MultiTenantProvider } from './core/tenant/MultiTenantContext';
import { BranchProvider } from './core/branch/BranchContext';
import { ThemeProvider } from './core/theme/ThemeContext';
import { UserProfileProvider } from './core/user/UserProfileContext';
import { LanguageProvider } from './localization/LanguageContext';
import { AuthProvider, useAuth } from './core/auth/AuthContext';
import { RBACProvider } from './core/rbac/RBACContext';

import Sidebar from './shared/components/Sidebar';
import Header from './shared/components/Header';
import CommandPalette from './shared/components/CommandPalette';
import AddProductModal from './shared/components/AddProductModal';
import NotificationToast from './shared/components/NotificationToast';

import DashboardScreen from './features/dashboard/DashboardScreen';
import AuthScreen from './features/auth/AuthScreen';

// Only the dashboard and the sign-in screen are needed for a first paint;
// every other section is fetched the first time it is opened.
const ProductsScreen = lazy(() => import('./features/products/ProductsScreen'));
const POSScreen = lazy(() => import('./features/sales/POSScreen'));
const ReportsScreen = lazy(() => import('./features/reports/ReportsScreen'));
const SettingsScreen = lazy(() => import('./features/settings/SettingsScreen'));
const TeamManagementScreen = lazy(() => import('./features/team/TeamManagementScreen'));
const AttendanceScreen = lazy(() => import('./features/attendance/AttendanceScreen'));
const BranchManagementScreen = lazy(() => import('./features/branches/BranchManagementScreen'));
const AuditLogScreen = lazy(() => import('./features/audit/AuditLogScreen'));
const SessionsScreen = lazy(() => import('./features/audit/SessionsScreen'));
const OrganizationSettingsScreen = lazy(() => import('./features/settings/OrganizationSettingsScreen'));
const AcceptInvitationScreen = lazy(() => import('./features/auth/AcceptInvitationScreen'));
const VerifyEmailScreen = lazy(() => import('./features/auth/VerifyEmailScreen'));
const VerifyEmailLanding = lazy(() => import('./features/auth/VerifyEmailLanding'));
const AiAssistantWidget = lazy(() => import('./features/ai_assistant/AiAssistantWidget'));
import { Sparkles, ShieldOff } from 'lucide-react';
import { EmptyState, SkeletonBlock, SkeletonRows } from './shared/ui/States';
import { useRBAC } from './core/rbac/RBACContext';
import { PERMISSIONS } from './core/rbac/permissions';
import EditProfileTab from './features/settings/components/EditProfileTab';

/** Shown while a lazily-loaded section's chunk is still in flight. */
function ScreenFallback() {
  return (
    <div className="space-y-4 py-6" role="status" aria-live="polite" aria-label="Loading section">
      <SkeletonBlock className="h-8 w-56 rounded-xl" />
      <SkeletonRows count={4} />
    </div>
  );
}

function MainAppContent() {
  const { isAuthenticated, isEmailVerified, authLoading, currentUser } = useAuth();
  const { hasPermission } = useRBAC();
  const inviteToken = window.location.pathname.match(/^\/invite\/([^/]+)$/)?.[1];
  // Opened from the confirmation email — often on a different device, so this
  // route must resolve before any session check.
  const verifyToken = window.location.pathname.match(/^\/verify-email\/([^/]+)$/)?.[1];
  const [activeTab, setActiveTab] = useState('general');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Smooth exit: keep loader mounted briefly after authLoading resolves
  // so it can fade out without a hard cut
  const [loaderVisible, setLoaderVisible] = useState(authLoading);
  const [loaderExiting, setLoaderExiting] = useState(false);
  const loaderTimer = useRef(null);

  useEffect(() => {
    if (!authLoading && loaderVisible) {
      // Trigger exit animation, then unmount after it completes
      setLoaderExiting(true);
      loaderTimer.current = setTimeout(() => {
        setLoaderVisible(false);
        setLoaderExiting(false);
      }, 350);
    }
    if (authLoading && !loaderVisible) {
      setLoaderVisible(true);
    }
    return () => clearTimeout(loaderTimer.current);
  }, [authLoading]);

  // Sync URL with auth state
  useEffect(() => {
    if (authLoading) return;
    const path = window.location.pathname;
    if (!isAuthenticated && path !== '/login' && !inviteToken && !verifyToken) {
      window.history.replaceState(null, '', '/login');
    } else if (isAuthenticated && path === '/login') {
      window.history.replaceState(null, '', '/');
    }
  }, [isAuthenticated, authLoading, inviteToken, verifyToken]);

  // Global Keyboard Shortcuts & Navigation Listener
  useEffect(() => {
    const isEditable = (el) => {
      if (!el) return false;
      const tag = el.tagName?.toUpperCase();
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };

    const handleKeyDown = (e) => {
      // Esc key -> close overlays/modals
      if (e.key === 'Escape') {
        if (isSearchOpen) setIsSearchOpen(false);
        if (isModalOpen) setIsModalOpen(false);
        if (isProfileModalOpen) setIsProfileModalOpen(false);
        if (mobileNavOpen) setMobileNavOpen(false);
        return;
      }

      // Ctrl+K or Cmd+K -> Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
        return;
      }
      // Ctrl+N or Cmd+N -> Add Product
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsModalOpen(true);
        return;
      }

      if (!isEditable(document.activeElement)) {
        const page = window.innerHeight * 0.8;
        const scrollBy = (top) => { e.preventDefault(); window.scrollBy({ top, behavior: 'smooth' }); };
        if (e.key === 'ArrowDown') scrollBy(120);
        else if (e.key === 'ArrowUp') scrollBy(-120);
        else if (e.key === 'PageDown') scrollBy(page);
        else if (e.key === 'PageUp') scrollBy(-page);
        else if (e.key === 'Home') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        else if (e.key === 'End') { e.preventDefault(); window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }); }
        else if (e.key === ' ' || e.code === 'Space') scrollBy(e.shiftKey ? -page : page);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isModalOpen, isProfileModalOpen, mobileNavOpen]);

  // 1. Full-screen Loading State during Startup Auth Verification
  if (verifyToken) {
    return (
      <Suspense fallback={<ScreenFallback />}>
        <VerifyEmailLanding token={verifyToken} />
      </Suspense>
    );
  }

  if (inviteToken) {
    return (
      <Suspense fallback={<ScreenFallback />}>
        <AcceptInvitationScreen token={inviteToken} />
      </Suspense>
    );
  }

  if (loaderVisible) {
    return (
      <div
        className="ds-app-shell min-h-screen w-full flex flex-col items-center justify-center"
        style={{
          opacity: loaderExiting ? 0 : 1,
          transition: 'opacity 350ms cubic-bezier(0.4,0,0.2,1)',
          willChange: 'opacity'
        }}
      >
        <div className="flex flex-col items-center gap-5">
          <div
            className="w-14 h-14 rounded-3xl capsule-mesh-gradient flex items-center justify-center animate-session-orb"
            style={{ boxShadow: '0 0 40px rgba(99,102,241,0.45), 0 0 80px rgba(99,102,241,0.15)' }}
          >
            <Sparkles className="w-7 h-7 text-white" style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/70 animate-dot-stagger-1" />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/70 animate-dot-stagger-2" />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/70 animate-dot-stagger-3" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Gateway
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // 3. Email Registration Verification Restriction Gateway
  // Gate on the server's verification record. Direct navigation cannot bypass
  // this, and even if it could, every data route rejects an unverified account.
  if (!isEmailVerified) {
    return (
      <Suspense fallback={<ScreenFallback />}>
        <VerifyEmailScreen />
      </Suspense>
    );
  }

  // 4. Authenticated & Verified Dashboard Workspace Access
  const getMappedTab = (tab) => {
    if (['dashboard', 'overview', 'general'].includes(tab)) return 'general';
    if (['products', 'inventory', 'categories', 'suppliers', 'stock', 'barcodes'].includes(tab)) return 'products';
    if (['sales', 'pos', 'orders', 'invoices', 'customers', 'receipts'].includes(tab)) return 'sales';
    if (['reports', 'analytics', 'export', 'performance'].includes(tab)) return 'reports';
    if (['users', 'employees', 'roles', 'permissions', 'team'].includes(tab)) return 'users';
    if (['attendance'].includes(tab)) return 'attendance';
    if (['branches'].includes(tab)) return 'branches';
    if (['audit'].includes(tab)) return 'audit';
    if (['sessions'].includes(tab)) return 'sessions';
    if (['settings', 'profile', 'organization'].includes(tab)) return 'settings';
    return 'general';
  };

  const requestedSection = getMappedTab(activeTab);
  const employeeDefault = currentUser?.accountType === 'employee'
    ? (hasPermission(PERMISSIONS.SALES_VIEW) ? 'sales' : 'attendance')
    : 'general';
  const currentSection = currentUser?.accountType === 'employee' && requestedSection === 'general'
    ? employeeDefault
    : requestedSection;
  const sectionPermissions = {
    products: PERMISSIONS.PRODUCTS_VIEW,
    sales: PERMISSIONS.SALES_VIEW,
    reports: PERMISSIONS.REPORTS_VIEW,
    users: PERMISSIONS.TEAM_VIEW,
    attendance: PERMISSIONS.ATTENDANCE_VIEW_OWN,
    branches: PERMISSIONS.BRANCHES_VIEW_OWN,
    audit: PERMISSIONS.AUDIT_VIEW,
    sessions: PERMISSIONS.SESSIONS_VIEW,
    settings: PERMISSIONS.SETTINGS_VIEW,
  };
  const blockedSection = sectionPermissions[currentSection] && !hasPermission(sectionPermissions[currentSection]);

  return (
    <div className="ds-app-shell min-h-screen flex text-[var(--ds-text)] min-w-0">
      <a
        href="#workspace-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] ds-btn ds-btn-primary ds-btn-sm"
      >
        Skip to main content
      </a>
      
      {/* Floating Sidebar (Desktop Fixed + Mobile Overlay Drawer) */}
      <Sidebar 
        activeTab={currentSection} 
        setActiveTab={setActiveTab} 
        onOpenProfile={() => setIsProfileModalOpen(true)}
        mobileOpen={mobileNavOpen}
        setMobileOpen={setMobileNavOpen}
      />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 max-w-[1700px] w-full mx-auto px-3 sm:px-6 md:px-8">
        
        {/* Header with Search, Theme Toggle, Notification Bell & Mobile Menu Trigger */}
        <Header 
          setActiveTab={setActiveTab}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          currentTab={activeTab}
          onToggleMobileNav={() => setMobileNavOpen(prev => !prev)}
        />

        {/* View Router */}
        <main id="workspace-main" tabIndex={-1} key={currentSection} className="flex-1 mt-2 animate-page-transition focus:outline-none">
          <Suspense fallback={<ScreenFallback />}>
          {blockedSection && (
            <div className="glass-panel rounded-3xl">
              <EmptyState
                icon={ShieldOff}
                title="You don't have access to this section"
                description="Your role does not include permission for this part of the workspace. An owner or admin can grant it from Team & Employees."
              />
            </div>
          )}

          {!blockedSection && currentSection === 'general' && (
            <DashboardScreen onViewAllSales={() => setActiveTab('sales')} />
          )}

          {!blockedSection && currentSection === 'products' && (
            <ProductsScreen onOpenAddProduct={() => setIsModalOpen(true)} />
          )}

          {!blockedSection && currentSection === 'sales' && (
            <POSScreen />
          )}

          {!blockedSection && currentSection === 'reports' && (
            <ReportsScreen />
          )}

          {!blockedSection && currentSection === 'users' && (
            <TeamManagementScreen />
          )}

          {!blockedSection && currentSection === 'attendance' && (
            <AttendanceScreen />
          )}

          {!blockedSection && currentSection === 'branches' && (
            <BranchManagementScreen />
          )}

          {!blockedSection && currentSection === 'audit' && (
            <AuditLogScreen />
          )}

          {!blockedSection && currentSection === 'sessions' && (
            <SessionsScreen />
          )}

          {!blockedSection && currentSection === 'settings' && (
            activeTab === 'organization' 
              ? <OrganizationSettingsScreen />
              : <SettingsScreen initialTab={activeTab === 'profile' ? 'profile' : undefined} />
          )}
          </Suspense>
        </main>

        <footer className="flex items-center justify-center gap-1 py-5 text-[10px] font-semibold tracking-[0.14em] text-[var(--ds-text-muted)]">
          <span>Made with</span>
          <span className="text-orange-500" role="img" aria-label="love">🧡</span>
          <span>by uncannystranger</span>
        </footer>

      </div>

      {/* Global Command Palette Modal (Ctrl + K) */}
      <CommandPalette 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        setActiveTab={setActiveTab}
      />

      {/* Manual Add Product Modal (Ctrl + N) */}
      <AddProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {isProfileModalOpen && (
        <div
          className="glass-scrim fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 animate-fade-in-up"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsProfileModalOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className="relative w-full max-w-4xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto glass glass-strong rounded-[1.75rem] animate-fade-scale"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-7 py-4 glass-chrome">
              <div>
                <h2 id="edit-profile-title" className="text-base font-black text-slate-900 dark:text-white">Edit Profile</h2>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Update your personal details and profile image.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors btn-micro"
                aria-label="Close edit profile dialog"
              >
                <span aria-hidden="true" className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="p-4 sm:p-7">
              <EditProfileTab />
            </div>
          </section>
        </div>
      )}

      {/* Floating Interactive AI Assistant with Micro-Animations & Monthly Report */}
      <Suspense fallback={null}>
        <AiAssistantWidget 
          setActiveTab={setActiveTab} 
          onOpenAddProduct={() => setIsModalOpen(true)} 
        />
      </Suspense>

      {/* Floating Bottom-Right Toast Notifications */}
      <NotificationToast />

    </div>
  );
}


export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <UserProfileProvider>
            <MultiTenantProvider>
              <BranchProvider>
                <RBACProvider>
                  <MainAppContent />
                </RBACProvider>
              </BranchProvider>
            </MultiTenantProvider>
          </UserProfileProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
