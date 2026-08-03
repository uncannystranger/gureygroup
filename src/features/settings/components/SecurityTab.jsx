import React, { useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Smartphone, 
  Laptop, 
  Globe, 
  LogOut, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle,
  KeyRound,
  Loader2
} from 'lucide-react';
import { useUserProfile } from '../../../core/user/UserProfileContext';
import { TwoFactorModal, DeleteAccountModal } from './SecurityModals';

export default function SecurityTab() {
  const { profile, saveProfile, showToast, revokeSession, revokeAllSessions } = useUserProfile();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Password Strength Calculator
  const getStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2 || score === 3) return { score: 65, label: 'Medium', color: 'bg-amber-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getStrength(newPassword);

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }

    setIsChangingPassword(true);
    setTimeout(() => {
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated successfully!');
    }, 700);
  };

  const handleToggle2FA = () => {
    if (profile.twoFactorEnabled) {
      saveProfile({ twoFactorEnabled: false });
      showToast('Two-Factor Authentication disabled.');
    } else {
      setIs2FAModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Change Password Section */}
      <div className="glass-panel rounded-4xl p-6 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-500" /> Change Password
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-semibold max-w-xl">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength Meter Bar */}
            {newPassword && (
              <div className="space-y-1 mt-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>Password Strength</span>
                  <span className={strength.color.replace('bg-', 'text-')}>{strength.label}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${strength.color}`} 
                    style={{ width: `${strength.score}%` }} 
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={!currentPassword || !newPassword || !confirmPassword || isChangingPassword}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs shadow-md disabled:opacity-40 flex items-center gap-2 hover:scale-[1.02] transition-all"
          >
            {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <Lock className="w-4 h-4" />}
            <span>Update Password</span>
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication (2FA) */}
      <div className="glass-panel rounded-4xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" /> Two-Factor Authentication (2FA)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Add an extra layer of security using an authenticator app (Google Authenticator, Authy, 1Password).</p>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
            profile.twoFactorEnabled ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
          }`}>
            {profile.twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleToggle2FA}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all hover:scale-105"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{profile.twoFactorEnabled ? 'Disable 2FA' : 'Configure 2FA'}</span>
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="glass-panel rounded-4xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Laptop className="w-4 h-4 text-indigo-500" /> Active Logged-In Sessions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Devices currently authenticated to your Gurey Group merchant workspace.</p>
          </div>

          <button
            type="button"
            onClick={revokeAllSessions}
            className="px-4 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out From All Devices
          </button>
        </div>

        <div className="space-y-3 pt-1">
          {profile.sessions?.map((sess) => (
            <div key={sess.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {sess.device.includes('iPhone') ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    {sess.device}
                    {sess.current && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 text-[10px] font-black uppercase">
                        Current Device
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-400">{sess.location} • IP: {sess.ip} • {sess.lastActive}</p>
                </div>
              </div>

              {!sess.current && (
                <button
                  type="button"
                  onClick={() => revokeSession(sess.id)}
                  className="px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-bold text-[11px] transition-colors"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Account Deletion Danger Zone */}
      <div className="glass-panel rounded-4xl p-6 border border-rose-500/30 dark:border-rose-500/20 space-y-3">
        <div>
          <h3 className="text-sm font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Danger Zone: Delete Account
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Permanently remove your account and all associated boutique data.</p>
        </div>

        <button
          type="button"
          onClick={() => setIsDeleteModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 hover:scale-105"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Account</span>
        </button>
      </div>

      {/* Security Modals */}
      <TwoFactorModal 
        isOpen={is2FAModalOpen} 
        onClose={() => setIs2FAModalOpen(false)}
        onEnable={() => saveProfile({ twoFactorEnabled: true })}
      />

      <DeleteAccountModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        userDisplayName={profile.displayName}
      />

    </div>
  );
}
