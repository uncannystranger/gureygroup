import React, { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Phone, User, Edit3, X, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRBAC } from '../../core/rbac/RBACContext';
import { PERMISSIONS } from '../../core/rbac/permissions';
import { branchAPI, teamAPI } from '../../services/apiService';

export default function BranchManagementScreen() {
  const { hasPermission } = useRBAC();
  const [branches, setBranches] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '', city: '', phone: '', managerId: '', managerName: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [branchRes, memberRes] = await Promise.allSettled([
        branchAPI.list(),
        teamAPI.getMembers(),
      ]);
      if (branchRes.status === 'fulfilled') setBranches(branchRes.value.branches || []);
      if (memberRes.status === 'fulfilled') setMembers(memberRes.value.members || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await branchAPI.update(editingBranch._id, formData);
        setSuccess('Branch updated successfully!');
      } else {
        await branchAPI.create(formData);
        setSuccess('Branch created successfully!');
      }
      setShowForm(false);
      setEditingBranch(null);
      setFormData({ name: '', address: '', city: '', phone: '', managerId: '', managerName: '' });
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || '',
      address: branch.address || '',
      city: branch.city || '',
      phone: branch.phone || '',
      managerId: branch.managerId || '',
      managerName: branch.managerName || '',
    });
    setShowForm(true);
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this branch?')) return;
    try {
      await branchAPI.delete(id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Branch Management</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Manage locations, assign managers, and organize teams</p>
        </div>
        {hasPermission(PERMISSIONS.BRANCHES_MANAGE) && (
          <button onClick={() => { setEditingBranch(null); setFormData({ name: '', address: '', city: '', phone: '', managerId: '', managerName: '' }); setShowForm(true); }} className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs shadow-lg hover:scale-105 transition-all flex items-center space-x-2 self-start sm:self-auto">
            <Plus className="w-4 h-4" /><span>Add Branch</span>
          </button>
        )}
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

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>
      ) : branches.length === 0 ? (
        <div className="glass-panel rounded-4xl p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No branches yet</h3>
          <p className="text-xs text-slate-400 mb-6">Create your first branch to organize employees by location</p>
          {hasPermission(PERMISSIONS.BRANCHES_MANAGE) && (
            <button onClick={() => setShowForm(true)} className="px-6 py-2.5 rounded-full bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors">Create First Branch</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <div key={branch._id} className="glass-panel rounded-3xl p-5 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${branch.status === 'active' ? 'bg-indigo-500/10' : 'bg-slate-500/10'}`}>
                    <Building2 className={`w-5 h-5 ${branch.status === 'active' ? 'text-indigo-400' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{branch.name}</h4>
                    <span className="text-[10px] font-bold text-slate-400">{branch.code}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${branch.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                  {branch.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {branch.city && (
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3 h-3" /><span>{branch.city}{branch.address ? ` • ${branch.address}` : ''}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Phone className="w-3 h-3" /><span>{branch.phone}</span>
                  </div>
                )}
                {branch.managerName && (
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <User className="w-3 h-3" /><span>Manager: {branch.managerName}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <Users className="w-3 h-3" /><span>{branch.employeeCount || 0} employees</span>
                </div>
              </div>

              {hasPermission(PERMISSIONS.BRANCHES_MANAGE) && (
                <div className="flex items-center space-x-2">
                  <button onClick={() => handleEdit(branch)} className="flex-1 px-3 py-1.5 rounded-xl bg-slate-200/60 dark:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center space-x-1">
                    <Edit3 className="w-3 h-3" /><span>Edit</span>
                  </button>
                  {branch.status === 'active' && (
                    <button onClick={() => handleDeactivate(branch._id)} className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-red-400 hover:bg-red-500/10 transition-colors">
                      Deactivate
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-md glass-panel rounded-4xl p-6 sm:p-8 relative shadow-2xl border border-white/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90">
            <button onClick={() => { setShowForm(false); setEditingBranch(null); }} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">
              {editingBranch ? 'Edit Branch' : 'New Branch'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Branch Name *</label>
                <input required value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Downtown Store" className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">City</label>
                  <input value={formData.city} onChange={(e) => setFormData(f => ({ ...f, city: e.target.value }))} className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Phone</label>
                  <input value={formData.phone} onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Address</label>
                <input value={formData.address} onChange={(e) => setFormData(f => ({ ...f, address: e.target.value }))} className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Assign Manager</label>
                <select value={formData.managerId} onChange={(e) => {
                  const m = members.find(m => m.userId === e.target.value);
                  setFormData(f => ({ ...f, managerId: e.target.value, managerName: m?.displayName || '' }));
                }} className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none appearance-none">
                  <option value="">No manager assigned</option>
                  {members.filter(m => ['Owner', 'Admin', 'Manager'].includes(m.role)).map(m => (
                    <option key={m.userId} value={m.userId}>{m.displayName} ({m.role})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm shadow-lg hover:scale-[1.02] transition-all">
                {editingBranch ? 'Update Branch' : 'Create Branch'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
