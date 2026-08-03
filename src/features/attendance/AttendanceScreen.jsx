import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, Calendar, Timer, AlertTriangle, CheckCircle2, XCircle, Users, Filter, ChevronDown } from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useRBAC } from '../../core/rbac/RBACContext';
import { PERMISSIONS } from '../../core/rbac/permissions';
import { attendanceAPI, branchAPI } from '../../services/apiService';
import { useLanguage } from '../../localization';

export default function AttendanceScreen() {
  const { currentUser } = useAuth();
  const { hasPermission, role } = useRBAC();
  const { t } = useLanguage();

  const [todayRecords, setTodayRecords] = useState([]);
  const [myHistory, setMyHistory] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [myTodayRecord, setMyTodayRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('today');
  const [filterBranch, setFilterBranch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        hasPermission(PERMISSIONS.ATTENDANCE_VIEW_ALL) ? attendanceAPI.getToday(filterBranch) : Promise.resolve({ attendance: [] }),
        attendanceAPI.getMyHistory({ limit: 30 }),
        branchAPI.list(),
      ]);
      if (results[0].status === 'fulfilled') {
        setTodayRecords(results[0].value.attendance || []);
        const myRecord = (results[0].value.attendance || []).find(r => r.userId === currentUser?.uid);
        if (myRecord) setMyTodayRecord(myRecord);
      }
      if (results[1].status === 'fulfilled') {
        const hist = results[1].value.attendance || [];
        setMyHistory(hist);
        if (!myTodayRecord) {
          const today = new Date().toISOString().split('T')[0];
          const todayRec = hist.find(r => r.date === today);
          if (todayRec) setMyTodayRecord(todayRec);
        }
      }
      if (results[2].status === 'fulfilled') setBranches(results[2].value.branches || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const res = await attendanceAPI.checkIn({
        userName: currentUser?.displayName,
        userRole: role,
      });
      setMyTodayRecord(res.attendance);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      const res = await attendanceAPI.checkOut();
      setMyTodayRecord(res.attendance);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatHours = (minutes) => {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'late': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'absent': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      present: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      late: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      absent: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return styles[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  // Calculate stats
  const presentCount = todayRecords.filter(r => r.status === 'present').length;
  const lateCount = todayRecords.filter(r => r.status === 'late').length;
  const absentCount = todayRecords.filter(r => r.status === 'absent').length;

  const isCheckedIn = myTodayRecord?.checkIn && !myTodayRecord?.checkOut;
  const isCheckedOut = myTodayRecord?.checkOut;

  const tabs = [
    { id: 'today', label: "Today's Overview", icon: Users },
    { id: 'history', label: 'My History', icon: Calendar },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Attendance</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Track check-in, check-out, and working hours</p>
      </div>

      {/* My Check-In/Out Card */}
      <div className="glass-panel rounded-4xl p-6">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" /> My Attendance Today
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-6">
            {myTodayRecord?.checkIn && (
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check In</span>
                <span className="text-lg font-black text-emerald-400">{formatTime(myTodayRecord.checkIn)}</span>
              </div>
            )}
            {myTodayRecord?.checkOut && (
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check Out</span>
                <span className="text-lg font-black text-red-400">{formatTime(myTodayRecord.checkOut)}</span>
              </div>
            )}
            {myTodayRecord?.workingHours > 0 && (
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Working Hours</span>
                <span className="text-lg font-black text-indigo-400">{formatHours(myTodayRecord.workingHours)}</span>
              </div>
            )}
            {!myTodayRecord && (
              <p className="text-xs text-slate-400">You haven't checked in today yet.</p>
            )}
          </div>

          <div className="sm:ml-auto flex items-center gap-3">
            {!isCheckedIn && !isCheckedOut && (
              <button onClick={handleCheckIn} disabled={checkingIn} className="px-6 py-3 rounded-2xl bg-emerald-500 text-white font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center space-x-2">
                {checkingIn ? <div className="w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin" /> : <><LogIn className="w-4 h-4" /><span>Check In</span></>}
              </button>
            )}
            {isCheckedIn && (
              <button onClick={handleCheckOut} disabled={checkingOut} className="px-6 py-3 rounded-2xl bg-red-500 text-white font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center space-x-2">
                {checkingOut ? <div className="w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin" /> : <><LogOut className="w-4 h-4" /><span>Check Out</span></>}
              </button>
            )}
            {isCheckedOut && (
              <span className="px-4 py-2 rounded-2xl bg-slate-500/20 text-slate-400 text-xs font-bold">Shift Complete ✓</span>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3 p-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-medium">{error}</div>
        )}
      </div>

      {/* Stats cards (Owner/Admin/Manager) */}
      {hasPermission(PERMISSIONS.ATTENDANCE_VIEW_ALL) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Today', value: todayRecords.length, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Present', value: presentCount, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Late', value: lateCount, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Absent', value: absentCount, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glass-panel rounded-3xl p-4">
                <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</span>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      {hasPermission(PERMISSIONS.ATTENDANCE_VIEW_ALL) && (
        <div className="flex items-center space-x-1 p-1 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/5 w-fit">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Today's Overview */}
      {activeTab === 'today' && hasPermission(PERMISSIONS.ATTENDANCE_VIEW_ALL) && (
        <div className="glass-panel rounded-4xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Employee Activity — Today</h3>
            {branches.length > 1 && (
              <select value={filterBranch} onChange={(e) => { setFilterBranch(e.target.value); }} className="px-3 py-1.5 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-white">
                <option value="">All Branches</option>
                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /></div>
          ) : todayRecords.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No attendance records yet</h4>
              <p className="text-xs text-slate-400">Employee check-ins will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayRecords.map((record) => (
                <div key={record._id || record.userId} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-white/60 dark:border-white/5">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(record.status)}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {record.userName || 'Employee'}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${getStatusBadge(record.status)}`}>
                          {record.status?.charAt(0).toUpperCase() + record.status?.slice(1)}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">{record.userRole || 'Employee'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400">In</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{formatTime(record.checkIn)}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400">Out</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{formatTime(record.checkOut)}</span>
                    </div>
                    {record.workingHours > 0 && (
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400">Hours</span>
                        <span className="font-bold text-indigo-400">{formatHours(record.workingHours)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My History */}
      {(activeTab === 'history' || !hasPermission(PERMISSIONS.ATTENDANCE_VIEW_ALL)) && (
        <div className="glass-panel rounded-4xl p-6">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">My Attendance History</h3>
          {myHistory.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No history yet</h4>
              <p className="text-xs text-slate-400">Your attendance records will appear here after you check in</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myHistory.map((record) => (
                <div key={record._id || record.date} className="flex items-center justify-between p-3 rounded-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-white/5">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(record.status)}
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{record.date}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black border ${getStatusBadge(record.status)}`}>{record.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-[11px]">
                    <span className="text-slate-500">{formatTime(record.checkIn)} — {formatTime(record.checkOut)}</span>
                    {record.workingHours > 0 && <span className="font-bold text-indigo-400">{formatHours(record.workingHours)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
