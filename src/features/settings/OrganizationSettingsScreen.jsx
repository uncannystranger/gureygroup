import React, { useState, useEffect } from 'react';
import { Building, Globe, Mail, Phone, MapPin, Camera, Save, AlertCircle, CheckCircle2, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useRBAC } from '../../core/rbac/RBACContext';
import { PERMISSIONS } from '../../core/rbac/permissions';
import { organizationAPI } from '../../services/apiService';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';

export default function OrganizationSettingsScreen() {
  const { currentUser } = useAuth();
  const { hasPermission, role } = useRBAC();
  const { activeCompany: company } = useMultiTenant();

  const [orgData, setOrgData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    description: '',
    currency: 'USD',
    timezone: 'UTC',
  });

  useEffect(() => { loadOrgData(); }, []);

  const loadOrgData = async () => {
    setLoading(true);
    try {
      const res = await organizationAPI.getMyOrg();
      setOrgData(res.organization);
      if (res.organization) {
        setFormData({
          name: res.organization.name || '',
          industry: res.organization.industry || '',
          website: res.organization.website || '',
          email: res.organization.email || '',
          phone: res.organization.phone || '',
          address: res.organization.address || '',
          city: res.organization.city || '',
          country: res.organization.country || '',
          description: res.organization.description || '',
          currency: res.organization.settings?.currency || 'USD',
          timezone: res.organization.settings?.timezone || 'UTC',
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await organizationAPI.update({
        ...formData,
        settings: { currency: formData.currency, timezone: formData.timezone },
      });
      setSuccess('Organization updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const canEdit = hasPermission(PERMISSIONS.ORG_EDIT);

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Organization Settings</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Manage your company profile, branding, and business information</p>
      </div>

      {success && (
        <div className="flex items-center space-x-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" /><span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center space-x-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
          <AlertCircle className="w-4 h-4" /><span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Info */}
        <div className="glass-panel rounded-4xl p-6">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-500" /> Company Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Company Name</label>
              <input value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} disabled={!canEdit} className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Industry</label>
              <select value={formData.industry} onChange={(e) => setFormData(f => ({ ...f, industry: e.target.value }))} disabled={!canEdit} className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none appearance-none disabled:opacity-50">
                <option value="">Select industry...</option>
                {['Retail', 'Restaurant', 'Healthcare', 'Technology', 'Manufacturing', 'Services', 'Education', 'Real Estate', 'Other'].map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))} disabled={!canEdit} rows={3} className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none resize-none disabled:opacity-50" />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="glass-panel rounded-4xl p-6">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-500" /> Contact Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Business Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))} disabled={!canEdit} className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Phone</label>
              <input value={formData.phone} onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))} disabled={!canEdit} className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Website</label>
              <input value={formData.website} onChange={(e) => setFormData(f => ({ ...f, website: e.target.value }))} disabled={!canEdit} className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none disabled:opacity-50" />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="glass-panel rounded-4xl p-6">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-500" /> Location
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">City</label>
              <input value={formData.city} onChange={(e) => setFormData(f => ({ ...f, city: e.target.value }))} disabled={!canEdit} className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Country</label>
              <input value={formData.country} onChange={(e) => setFormData(f => ({ ...f, country: e.target.value }))} disabled={!canEdit} className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none disabled:opacity-50" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Address</label>
              <input value={formData.address} onChange={(e) => setFormData(f => ({ ...f, address: e.target.value }))} disabled={!canEdit} className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none disabled:opacity-50" />
            </div>
          </div>
        </div>

        {/* Business Settings */}
        <div className="glass-panel rounded-4xl p-6">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" /> Business Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Currency</label>
              <select value={formData.currency} onChange={(e) => setFormData(f => ({ ...f, currency: e.target.value }))} disabled={!canEdit} className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none appearance-none disabled:opacity-50">
                {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'KES', 'SOS', 'AED'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Timezone</label>
              <select value={formData.timezone} onChange={(e) => setFormData(f => ({ ...f, timezone: e.target.value }))} disabled={!canEdit} className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none appearance-none disabled:opacity-50">
                {['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Africa/Nairobi', 'Asia/Dubai'].map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
        </div>

        {canEdit && (
          <button type="submit" disabled={saving} className="w-full px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center space-x-2">
            {saving ? <div className="w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin" /> : <><Save className="w-4 h-4" /><span>Save Changes</span></>}
          </button>
        )}
      </form>
    </div>
  );
}
