import React, { useState, useEffect } from 'react';
import { Monitor, Wifi, WifiOff, Clock, Globe, Smartphone, Laptop, History, RefreshCw } from 'lucide-react';
import { sessionAPI } from '../../services/apiService';
import StatCard from '../../shared/ui/StatCard';
import { EmptyState, SkeletonRows } from '../../shared/ui/States';

export default function SessionsScreen() {
  const [activeSessions, setActiveSessions] = useState([]);
  const [historySessions, setHistorySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const [activeRes, historyRes] = await Promise.allSettled([
        sessionAPI.getActive(),
        sessionAPI.getHistory({ limit: 50 }),
      ]);
      if (activeRes.status === 'fulfilled') setActiveSessions(activeRes.value.sessions || []);
      if (historyRes.status === 'fulfilled') setHistorySessions(historyRes.value.sessions || []);
    } catch (err) {
      console.error('Load Sessions Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getDeviceIcon = (device) => {
    if (device?.toLowerCase().includes('mobile') || device?.toLowerCase().includes('phone')) return Smartphone;
    return Laptop;
  };

  return (
    <div className="space-y-6 pb-12 page-enter">
      <div className="ds-page-header">
        <div className="min-w-0">
          <h2 className="ds-title">Session monitoring</h2>
          <p className="ds-caption mt-0.5">Every device currently signed in to this workspace, and the history behind it.</p>
        </div>
        <div className="ds-page-header__actions">
          <button type="button" onClick={loadSessions} className="ds-btn ds-btn-secondary ds-btn-sm" disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {/* Two counts do not need two oversized cards; a compact row reads faster */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard index={0} label="Online now" value={activeSessions.length} icon={Wifi} tone={activeSessions.length ? 'positive' : 'neutral'} support="Active in the last 5 minutes" />
        <StatCard index={1} label="Recorded sessions" value={historySessions.length} icon={History} support="Most recent 50" />
        <StatCard index={2} label="Devices" value={new Set(activeSessions.map(s => `${s.device}-${s.browser}`)).size} icon={Monitor} support="Distinct device signatures" />
        <StatCard index={3} label="People online" value={new Set(activeSessions.map(s => s.userId)).size} icon={Globe} support="Unique signed-in members" />
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 p-1 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/5 w-fit">
        {[
          { id: 'active', label: 'Currently Online', icon: Wifi },
          { id: 'history', label: 'Session History', icon: History },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
              <Icon className="w-3.5 h-3.5" /><span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Session list */}
      <div className="glass-panel rounded-4xl p-6">
        {loading ? (
          <SkeletonRows count={4} />
        ) : (
          <div className="space-y-3">
            {(activeTab === 'active' ? activeSessions : historySessions).length === 0 ? (
              <EmptyState
                icon={Monitor}
                title={activeTab === 'active' ? 'Nobody is signed in right now' : 'No session history yet'}
                description="Sessions appear here as members of this workspace sign in, and are marked offline five minutes after their last activity."
              />
            ) : (
              (activeTab === 'active' ? activeSessions : historySessions).map((session) => {
                const DeviceIcon = getDeviceIcon(session.device);
                return (
                  <div key={session._id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-white/60 dark:border-white/5">
                    <div className="flex min-w-0 flex-1 items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${session.isActive ? 'bg-emerald-500/10' : 'bg-slate-500/10'}`}>
                        <DeviceIcon className={`w-5 h-5 ${session.isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {session.userName || 'User'}
                          {session.isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {session.browser || 'Unknown Browser'} • {session.os || 'Unknown OS'}
                        </p>
                      </div>
                    </div>
                    <div className="max-w-full text-right text-[11px]">
                      <div className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {session.isActive ? `Active ${formatDate(session.lastActive)}` : `Logged out ${formatDate(session.logoutTime)}`}
                      </div>
                      <div className="text-slate-400">Login: {formatDate(session.loginTime)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
