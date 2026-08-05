import React, { useState, useEffect } from 'react';
import { Monitor, Wifi, WifiOff, Clock, Globe, Smartphone, Laptop, History } from 'lucide-react';
import { sessionAPI } from '../../services/apiService';

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
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Session Monitoring</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Track active login sessions and session history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel rounded-3xl p-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-2">
            <Wifi className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{activeSessions.length}</span>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Online Now</span>
        </div>
        <div className="glass-panel rounded-3xl p-4">
          <div className="w-8 h-8 rounded-xl bg-slate-500/10 flex items-center justify-center mb-2">
            <History className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{historySessions.length}</span>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Sessions</span>
        </div>
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
          <div className="flex items-center justify-center py-12"><div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {(activeTab === 'active' ? activeSessions : historySessions).length === 0 ? (
              <div className="text-center py-12">
                <Monitor className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {activeTab === 'active' ? 'No active sessions' : 'No session history'}
                </h4>
                <p className="text-xs text-slate-400">Session data will appear here as users log in</p>
              </div>
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
