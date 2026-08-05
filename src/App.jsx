import React, { useState, useEffect, useRef } from 'react';
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
import ProductsScreen from './features/products/ProductsScreen';
import POSScreen from './features/sales/POSScreen';
import ReportsScreen from './features/reports/ReportsScreen';
import EmployeesScreen from './features/employees/EmployeesScreen';
import SettingsScreen from './features/settings/SettingsScreen';
import TeamManagementScreen from './features/team/TeamManagementScreen';
import AttendanceScreen from './features/attendance/AttendanceScreen';
import BranchManagementScreen from './features/branches/BranchManagementScreen';
import AuditLogScreen from './features/audit/AuditLogScreen';
import SessionsScreen from './features/audit/SessionsScreen';
import OrganizationSettingsScreen from './features/settings/OrganizationSettingsScreen';
import AuthScreen from './features/auth/AuthScreen';
import AcceptInvitationScreen from './features/auth/AcceptInvitationScreen';
import VerifyEmailScreen from './features/auth/VerifyEmailScreen';
import AiAssistantWidget from './features/ai_assistant/AiAssistantWidget';
import { Sparkles } from 'lucide-react';
import { useRBAC } from './core/rbac/RBACContext';
import { PERMISSIONS } from './core/rbac/permissions';
import EditProfileTab from './features/settings/components/EditProfileTab';

const WATERMARK = 'Made with 🧡 by uncannystranger';

function MainAppContent() {
  const { isAuthenticated, isEmailVerified, authLoading, currentUser } = useAuth();
  const { hasPermission } = useRBAC();
  const inviteToken = window.location.pathname.match(/^\/invite\/([^/]+)$/)?.[1];
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

  useEffect(() => {
    if (!isProfileModalOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsProfileModalOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isProfileModalOpen]);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K -> Open Search / Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      // Ctrl+N or Cmd+N -> Open Add Product Modal
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Full-screen Loading State during Startup Auth Verification
  if (inviteToken) {
    return <AcceptInvitationScreen token={inviteToken} />;
  }

  if (loaderVisible) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center bg-[#EBF0F7] dark:bg-[#0B0F17]"
        style={{
          opacity: loaderExiting ? 0 : 1,
          transition: 'opacity 350ms cubic-bezier(0.4,0,0.2,1)',
          willChange: 'opacity'
        }}
      >
        <div className="flex flex-col items-center gap-5">
          {/* Breathing logo orb */}
          <div
            className="w-14 h-14 rounded-3xl capsule-mesh-gradient flex items-center justify-center animate-session-orb"
            style={{ boxShadow: '0 0 40px rgba(99,102,241,0.45), 0 0 80px rgba(99,102,241,0.15)' }}
          >
            <Sparkles className="w-7 h-7 text-white" style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }} />
          </div>

          {/* Staggered floating dots — no text */}
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
  if (!isEmailVerified && currentUser?.requiresEmailVerification !== false) {
    return <VerifyEmailScreen />;
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
    <div className="min-h-screen flex bg-[#EBF0F7] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-100 min-w-0">
      
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
        <main key={currentSection} className="flex-1 mt-2 animate-page-transition">
          {blockedSection && (
            <div className="glass-panel rounded-4xl p-8 text-center">
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">403 Forbidden</h2>
              <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                Your role does not have access to this workspace section.
              </p>
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
        </main>

        <footer className="flex items-center justify-center py-4 text-[10px] font-semibold tracking-[0.16em] text-slate-400 dark:text-slate-500">
          <span>{WATERMARK.replace('🧡', '')}</span>
          <span className="mx-1 text-orange-500" aria-label="love">🧡</span>
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
          className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 bg-slate-950/45 backdrop-blur-md animate-fade-in-up"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsProfileModalOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className="relative w-full max-w-4xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto glass-panel rounded-[2rem] shadow-2xl animate-fade-scale"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-7 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800">
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
      <AiAssistantWidget 
        setActiveTab={setActiveTab} 
        onOpenAddProduct={() => setIsModalOpen(true)} 
      />

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
