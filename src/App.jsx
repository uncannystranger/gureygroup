import React, { useState, useEffect, useRef } from 'react';
import { MultiTenantProvider } from './core/tenant/MultiTenantContext';
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
import VerifyEmailScreen from './features/auth/VerifyEmailScreen';
import AiAssistantWidget from './features/ai_assistant/AiAssistantWidget';
import { Sparkles } from 'lucide-react';


function MainAppContent() {
  const { isAuthenticated, isEmailVerified, authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
  if (!isEmailVerified) {
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

  const currentSection = getMappedTab(activeTab);

  return (
    <div className="min-h-screen flex bg-[#EBF0F7] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-100 min-w-0">
      
      {/* Floating Sidebar (Desktop Fixed + Mobile Overlay Drawer) */}
      <Sidebar 
        activeTab={currentSection} 
        setActiveTab={setActiveTab} 
        mobileOpen={mobileNavOpen}
        setMobileOpen={setMobileNavOpen}
      />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 max-w-[1700px] w-full mx-auto px-3 sm:px-6 md:px-8">
        
        {/* Header with Search, Theme Toggle, Notification Bell & Mobile Menu Trigger */}
        <Header 
          setActiveTab={setActiveTab}
          onOpenSearch={() => setIsSearchOpen(true)}
          currentTab={activeTab}
          onToggleMobileNav={() => setMobileNavOpen(prev => !prev)}
        />

        {/* View Router */}
        <main key={currentSection} className="flex-1 mt-2 animate-page-transition">
          {currentSection === 'general' && (
            <DashboardScreen onViewAllSales={() => setActiveTab('sales')} />
          )}

          {currentSection === 'products' && (
            <ProductsScreen onOpenAddProduct={() => setIsModalOpen(true)} />
          )}

          {currentSection === 'sales' && (
            <POSScreen />
          )}

          {currentSection === 'reports' && (
            <ReportsScreen />
          )}

          {currentSection === 'users' && (
            <TeamManagementScreen />
          )}

          {currentSection === 'attendance' && (
            <AttendanceScreen />
          )}

          {currentSection === 'branches' && (
            <BranchManagementScreen />
          )}

          {currentSection === 'audit' && (
            <AuditLogScreen />
          )}

          {currentSection === 'sessions' && (
            <SessionsScreen />
          )}

          {currentSection === 'settings' && (
            activeTab === 'organization' 
              ? <OrganizationSettingsScreen />
              : <SettingsScreen initialTab={activeTab === 'profile' ? 'profile' : undefined} />
          )}
        </main>

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
              <RBACProvider>
                <MainAppContent />
              </RBACProvider>
            </MultiTenantProvider>
          </UserProfileProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
