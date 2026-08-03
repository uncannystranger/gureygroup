import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Search, Filter, MoreHorizontal, Mail, Clock, Building2, X, ChevronDown, AlertCircle } from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useRBAC } from '../../core/rbac/RBACContext';
import { PERMISSIONS, ROLES, ROLE_LIST, PERMISSION_GROUPS, ROLE_PERMISSIONS } from '../../core/rbac/permissions';
import { teamAPI, branchAPI } from '../../services/apiService';
import { useLanguage } from '../../localization';
import InviteModal from './InviteModal';

export default function TeamManagementScreen() {
  const { currentUser } = useAuth();
  const { hasPermission } = useRBAC();
  const { t } = useLanguage();

  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [activeTab, setActiveTab] = useState('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, invitesRes, branchRes] = await Promise.allSettled([
        teamAPI.getMembers(),
        teamAPI.getInvitations(),
        branchAPI.list(),
      ]);
      if (membersRes.status === 'fulfilled') setMembers(membersRes.value.members || []);
      if (invitesRes.status === 'fulfilled') setInvitations(invitesRes.value.invitations || []);
      if (branchRes.status === 'fulfilled') setBranches(branchRes.value.branches || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter members
  const filteredMembers = members.filter(m => {
    const matchesSearch = !searchQuery ||
      m.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'All' || m.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Update member role
  const handleUpdateRole = async (userId, newRole) => {
    try {
      await teamAPI.updateMember(userId, { role: newRole });
      setMembers(prev => prev.map(m => m.userId === userId ? { ...m, role: newRole } : m));
      setEditingMember(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // Remove member
  const handleRemoveMember = async (userId, name) => {
    if (!confirm(`Remove ${name} from the organization? This action cannot be undone.`)) return;
    try {
      await teamAPI.removeMember(userId);
      setMembers(prev => prev.filter(m => m.userId !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  // Revoke invitation
  const handleRevokeInvite = async (id) => {
    try {
      await teamAPI.revokeInvitation(id);
      setInvitations(prev => prev.filter(i => i._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'Owner': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'Admin': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Manager': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Cashier': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'Inventory Staff': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'Employee': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };
    return colors[role] || colors['Employee'];
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'text-emerald-400' : 'text-slate-500';
  };

  const tabs = [
    { id: 'members', label: 'Team Members', icon: Users, count: members.length },
    { id: 'invitations', label: 'Invitations', icon: Mail, count: invitations.filter(i => i.status === 'pending').length },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Team Management
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Manage employees, roles, permissions, and invitations
          </p>
        </div>

        {hasPermission(PERMISSIONS.TEAM_INVITE) && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs shadow-lg hover:scale-105 transition-all flex items-center space-x-2 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Employee</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 p-1 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/5 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-black">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/5 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
            >
              <option value="All">All Roles</option>
              {ROLE_LIST.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>

          {/* Members list */}
          <div className="glass-panel rounded-4xl p-6">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">
              Active Members ({filteredMembers.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {members.length === 0 ? 'No employees yet' : 'No matches found'}
                </h4>
                <p className="text-xs text-slate-400">
                  {members.length === 0
                    ? 'Invite your first team member to get started'
                    : 'Try adjusting your search or filter'}
                </p>
                {members.length === 0 && hasPermission(PERMISSIONS.TEAM_INVITE) && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="mt-4 px-5 py-2 rounded-full bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors"
                  >
                    Invite First Member
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMembers.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-white/60 dark:border-white/5 hover:bg-white/90 dark:hover:bg-slate-800/80 transition-all"
                  >
                    <div className="flex items-center space-x-3.5">
                      {member.photoURL ? (
                        <img src={member.photoURL} alt={member.displayName} className="w-11 h-11 rounded-full object-cover shadow-sm" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {member.displayName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {member.displayName}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${getRoleBadgeColor(member.role)}`}>
                            {member.role}
                          </span>
                          {member.userId === currentUser?.uid && (
                            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[9px] font-black">YOU</span>
                          )}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-400">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`flex items-center space-x-1 text-[10px] font-bold ${getStatusColor(member.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        <span className="capitalize">{member.status}</span>
                      </span>

                      {hasPermission(PERMISSIONS.TEAM_EDIT_ROLES) && member.role !== 'Owner' && (
                        <div className="relative">
                          {editingMember === member.userId ? (
                            <div className="absolute right-0 top-8 z-50 p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl min-w-[160px]">
                              {ROLE_LIST.filter(r => r !== 'Owner').map(role => (
                                <button
                                  key={role}
                                  onClick={() => handleUpdateRole(member.userId, role)}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                                    member.role === role
                                      ? 'bg-indigo-500/20 text-indigo-400'
                                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                  }`}
                                >
                                  {role}
                                </button>
                              ))}
                              <hr className="my-1 border-slate-200 dark:border-slate-700" />
                              {hasPermission(PERMISSIONS.TEAM_REMOVE) && (
                                <button
                                  onClick={() => handleRemoveMember(member.userId, member.displayName)}
                                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  Remove Member
                                </button>
                              )}
                              <button
                                onClick={() => setEditingMember(null)}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : null}
                          <button
                            onClick={() => setEditingMember(editingMember === member.userId ? null : member.userId)}
                            className="px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                          >
                            Manage
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="glass-panel rounded-4xl p-6">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">
            Pending Invitations ({invitations.filter(i => i.status === 'pending').length})
          </h3>

          {invitations.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No invitations sent</h4>
              <p className="text-xs text-slate-400">Invite team members to join your organization</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((invite) => (
                <div
                  key={invite._id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-white/60 dark:border-white/5"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{invite.email}</h4>
                      <p className="text-[11px] text-slate-400">
                        Role: {invite.role} • Invited by {invite.invitedByName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                      invite.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      invite.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                    </span>

                    {invite.status === 'pending' && hasPermission(PERMISSIONS.TEAM_INVITE) && (
                      <button
                        onClick={() => handleRevokeInvite(invite._id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Roles & Permissions Tab */}
      {activeTab === 'roles' && (
        <RolesPermissionsPanel />
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          branches={branches}
          onClose={() => setShowInviteModal(false)}
          onInviteSent={() => {
            setShowInviteModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// ─── Roles & Permissions Panel ────────────────────────────────────────────────

function RolesPermissionsPanel() {
  const visibleRoles = ROLE_LIST.filter(r => r !== 'Owner');

  return (
    <div className="glass-panel rounded-4xl p-6 overflow-x-auto">
      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
        Role-Based Access Control Matrix
      </h3>
      <p className="text-xs text-slate-400 mb-6">
        View permission assignments for each role. Owner has full access to everything.
      </p>

      <div className="responsive-table-wrapper">
        <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left py-2 px-3 font-bold text-slate-500 dark:text-slate-400 min-w-[200px]">Permission</th>
            {visibleRoles.map(role => (
              <th key={role} className="text-center py-2 px-3 font-bold text-slate-700 dark:text-slate-200 min-w-[100px]">
                {role}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_GROUPS.map((group) => (
            <React.Fragment key={group.label}>
              <tr>
                <td colSpan={visibleRoles.length + 1} className="pt-4 pb-1 px-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                    {group.label}
                  </span>
                </td>
              </tr>
              {group.permissions.map((perm) => (
                <tr key={perm.key} className="border-t border-slate-100 dark:border-slate-800/50">
                  <td className="py-2 px-3 font-medium text-slate-600 dark:text-slate-300">
                    {perm.label}
                  </td>
                  {visibleRoles.map(role => {
                    const has = (ROLE_PERMISSIONS[role] || []).includes(perm.key);
                    return (
                      <td key={role} className="text-center py-2 px-3">
                        {has ? (
                          <span className="inline-block w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 leading-5 font-black">✓</span>
                        ) : (
                          <span className="inline-block w-5 h-5 rounded-lg bg-slate-200/50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 leading-5">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
