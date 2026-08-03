import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, Calendar, User, ChevronDown, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { auditAPI } from '../../services/apiService';
import { useLanguage } from '../../localization';

export default function AuditLogScreen() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionTypes, setActionTypes] = useState([]);
  const [filters, setFilters] = useState({ action: '', userEmail: '', page: 1 });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => { loadLogs(); }, [filters]);

  useEffect(() => {
    auditAPI.getActionTypes().then(res => setActionTypes(res.actions || [])).catch(() => {});
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await auditAPI.getLogs({ ...filters, limit: 30 });
      setLogs(res.logs || []);
      setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getActionColor = (action) => {
    if (action?.includes('CREATED') || action?.includes('ACCEPTED')) return 'text-emerald-400 bg-emerald-500/10';
    if (action?.includes('DELETED') || action?.includes('REMOVED') || action?.includes('REVOKED')) return 'text-red-400 bg-red-500/10';
    if (action?.includes('UPDATED') || action?.includes('CHANGED')) return 'text-blue-400 bg-blue-500/10';
    if (action?.includes('LOGIN') || action?.includes('CHECK')) return 'text-indigo-400 bg-indigo-500/10';
    return 'text-slate-400 bg-slate-500/10';
  };

  const formatActionLabel = (action) => {
    return (action || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Audit Logs</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Complete activity trail of all actions in your organization</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by user email..." value={filters.userEmail} onChange={(e) => setFilters(f => ({ ...f, userEmail: e.target.value, page: 1 }))} className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/5 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={filters.action} onChange={(e) => setFilters(f => ({ ...f, action: e.target.value, page: 1 }))} className="px-4 py-2.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none">
          <option value="">All Actions</option>
          {actionTypes.map(a => <option key={a} value={a}>{formatActionLabel(a)}</option>)}
        </select>
      </div>

      {/* Log feed */}
      <div className="glass-panel rounded-4xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" /> Activity Feed
          </h3>
          <span className="text-[10px] font-bold text-slate-400">{pagination.total} total entries</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No audit logs yet</h4>
            <p className="text-xs text-slate-400">Actions performed in your organization will be recorded here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log, idx) => (
              <div key={log._id || idx} className="relative pl-6 py-3 border-l-2 border-indigo-500/20 hover:border-indigo-500/50 transition-colors">
                <div className="absolute left-[-5px] top-4 w-2.5 h-2.5 rounded-full bg-indigo-500/40 border-2 border-white dark:border-slate-900" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${getActionColor(log.action)}`}>
                        {formatActionLabel(log.action)}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-500">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{log.details}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3" /> {log.userEmail}
                      {log.userRole && <span className="text-slate-500">({log.userRole})</span>}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
            <button disabled={pagination.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Page {pagination.page} of {pagination.totalPages}</span>
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
