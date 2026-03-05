import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Home, Users, Shield, Hash, User, Bell, Trash2,
  Search, Link, UserPlus, CheckCircle, XCircle, X,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

type Member = {
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  status: 'online' | 'offline';
  joined_at: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
};

type NavItemId =
  | 'overview' | 'members' | 'permissions' | 'channels'
  | 'profile' | 'notifications'
  | 'delete';

const NAV_SECTIONS = [
  {
    label: 'WORKSPACE',
    items: [
      { id: 'overview'    as NavItemId, icon: Home,   label: 'Overview' },
      { id: 'members'     as NavItemId, icon: Users,  label: 'Members' },
      { id: 'permissions' as NavItemId, icon: Shield, label: 'Permissions' },
      { id: 'channels'    as NavItemId, icon: Hash,   label: 'Channels' },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { id: 'profile'       as NavItemId, icon: User, label: 'Profile' },
      { id: 'notifications' as NavItemId, icon: Bell, label: 'Notifications' },
    ],
  },
];

// ─── Members panel ────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
  owner: 'bg-[#fef3c7] text-[#92400e]',
  admin: 'bg-[#ede8f7] text-[#4d298c]',
  member: 'bg-[#dcfce7] text-[#166534]',
};

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.split('@')[0].slice(0, 2).toUpperCase();
}

function getDisplayName(name: string | null, email: string): string {
  if (name) return name;
  return email.split('@')[0].split(/[._-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatJoined(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[1fr_108px_92px_108px_124px_56px] px-4 py-3 gap-2 items-center border-b border-[#E5E7EB] last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
          <div className="h-2.5 w-32 bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
      <div className="h-5 w-14 bg-gray-200 animate-pulse rounded-full" />
      <div className="h-3 w-12 bg-gray-200 animate-pulse rounded" />
      <div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
      <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
      <div />
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastState = {
  id: number;
  success: boolean;
  name: string;
  role?: string;
};

function ToastNotification({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white border border-[#E5E7EB] rounded-xl shadow-lg px-4 py-3 w-72 flex items-start gap-3">
      {toast.success
        ? <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
        : <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
      }
      <div>
        <div className="text-[13px] font-semibold text-[#111827]">
          {toast.success ? 'Role updated' : 'Something went wrong'}
        </div>
        <div className="text-[12px] text-gray-500 mt-0.5">
          {toast.success ? `${toast.name} is now ${toast.role}` : 'Try again.'}
        </div>
      </div>
    </div>
  );
}

// ─── Remove modal ─────────────────────────────────────────────────────────────

function RemoveModal({
  member,
  removing,
  onCancel,
  onConfirm,
}: {
  member: Member;
  removing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const name = getDisplayName(member.full_name, member.email);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-[400px]">
        <h2 className="text-[16px] font-extrabold text-[#111827] mb-1">Remove {name}?</h2>
        <p className="text-[13px] text-gray-500 mb-5">
          They will lose access to all channels immediately.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={removing}
            className="px-4 py-2 text-[13px] text-gray-600 border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-all duration-150 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={removing}
            className="px-4 py-2 text-[13px] text-white bg-red-600 rounded-lg font-medium hover:bg-red-700 transition-all duration-150 disabled:opacity-60"
          >
            {removing ? 'Removing…' : 'Remove member'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── InviteModal ──────────────────────────────────────────────────────────────

type InviteTab = 'email' | 'link';
type InviteRole = 'admin' | 'member';

function InviteModal({
  onClose,
  onInvited,
}: {
  onClose: () => void;
  onInvited?: (emails: string[]) => void;
}) {
  const { session } = useAuth();
  const [tab, setTab] = useState<InviteTab>('email');
  const [emailInput, setEmailInput] = useState('');
  const [role, setRole] = useState<InviteRole>('member');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSend = async () => {
    const emails = emailInput
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (emails.length === 0) {
      setError('Enter at least one email address.');
      return;
    }

    setSending(true);
    setError('');

    const rows = emails.map(email => ({
      email,
      role,
      invited_by: session?.user?.id ?? null,
      token: crypto.randomUUID(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    const { error: dbError } = await supabase.from('workspace_invites').insert(rows);

    setSending(false);

    if (dbError) {
      setError('Failed to send invites. Try again.');
    } else {
      setSent(true);
      onInvited?.(emails);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('flowtalk.com/join/abc123');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-[480px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-extrabold text-[#111827]">Invite members</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-all duration-150"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E5E7EB] mb-5">
          {(['email', 'link'] as InviteTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 mr-5 text-[13px] transition-all duration-150 ${
                tab === t
                  ? 'border-b-2 border-[#4d298c] text-[#4d298c] font-semibold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'email' ? 'Email invite' : 'Invite link'}
            </button>
          ))}
        </div>

        {/* Email tab */}
        {tab === 'email' && (
          <div className="flex flex-col gap-4">
            {sent ? (
              <div className="flex flex-col items-center py-6 gap-2">
                <CheckCircle size={32} className="text-green-500" />
                <p className="text-[14px] font-semibold text-[#111827]">Invites sent!</p>
                <p className="text-[12px] text-gray-500">
                  Recipients will get an email with a join link.
                </p>
                <button
                  onClick={onClose}
                  className="mt-3 px-5 py-2 bg-[#4d298c] text-white text-[13px] font-medium rounded-lg hover:bg-[#3d1f70] transition-all duration-150"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <textarea
                  value={emailInput}
                  onChange={e => { setEmailInput(e.target.value); setError(''); }}
                  placeholder="Enter email addresses, separated by commas"
                  className="border border-[#E5E7EB] rounded-lg p-3 text-[13px] text-[#111827] placeholder-gray-400 w-full h-24 resize-none outline-none focus:border-[#4d298c] transition-colors"
                />

                {/* Role selection */}
                <div className="flex gap-3">
                  {([
                    { value: 'admin' as InviteRole, label: 'Admin', desc: 'Can manage members and channels' },
                    { value: 'member' as InviteRole, label: 'Member', desc: 'Can view and send messages' },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRole(opt.value)}
                      className={`flex-1 text-left border rounded-lg p-3 transition-all duration-150 ${
                        role === opt.value
                          ? 'border-[#4d298c] bg-[#f5f0ff]'
                          : 'border-[#E5E7EB] hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${
                            role === opt.value ? 'border-[#4d298c] bg-[#4d298c]' : 'border-gray-300'
                          }`}
                        />
                        <span className="text-[13px] font-semibold text-[#111827]">{opt.label}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 pl-5">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                {error && <p className="text-[12px] text-red-500">{error}</p>}

                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full py-2.5 bg-[#4d298c] text-white text-[13px] font-semibold rounded-lg hover:bg-[#3d1f70] transition-all duration-150 disabled:opacity-60"
                >
                  {sending ? 'Sending…' : 'Send invites'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Link tab */}
        {tab === 'link' && (
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-gray-500">
              Share this link with anyone you want to invite to the workspace.
            </p>
            <div className="flex items-center gap-2 border border-[#E5E7EB] rounded-lg px-3 py-2.5 bg-[#F7F8FA]">
              <span className="text-[13px] text-gray-600 flex-1 truncate">flowtalk.com/join/abc123</span>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-[12px] font-medium text-[#4d298c] hover:underline shrink-0 transition-all duration-150"
              >
                <Link size={13} />
                {copiedLink ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MembersPanel ─────────────────────────────────────────────────────────────

function MembersPanel() {
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [removing, setRemoving] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const currentUserId = session?.user?.id;

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true);

      // Query 1: fetch all workspace_members rows
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_members')
        .select('user_id, role, joined_at');
      console.log('[MembersPanel] workspace_members raw:', membersData, 'error:', membersError);

      if (membersError || !membersData) {
        setLoading(false);
        return;
      }

      // Query 2: fetch profiles for each user_id
      const userIds = membersData.map(r => r.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);
      console.log('[MembersPanel] profiles raw:', profilesData, 'error:', profilesError);

      const profileMap: Record<string, { full_name: string | null; email: string; avatar_url: string | null }> = {};
      for (const p of (profilesData ?? [])) {
        profileMap[p.id] = { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url };
      }
      console.log('[MembersPanel] profileMap keys:', Object.keys(profileMap), 'membersData user_ids:', membersData.map(r => r.user_id));

      const mapped: Member[] = membersData.map(row => {
        const profile = profileMap[row.user_id];
        const isCurrentUser = row.user_id === currentUserId;
        const rawRole = (row.role ?? 'member').toLowerCase() as 'owner' | 'admin' | 'member';
        return {
          user_id: row.user_id,
          role: rawRole,
          status: 'offline' as const,
          joined_at: row.joined_at,
          full_name: profile?.full_name || null,
          email: profile?.email || (isCurrentUser ? (session?.user?.email ?? '') : ''),
          avatar_url: profile?.avatar_url || null,
        };
      });

      mapped.sort((a, b) => {
        if (a.user_id === currentUserId) return -1;
        if (b.user_id === currentUserId) return 1;
        return 0;
      });

      setMembers(mapped);
      console.log('[MembersPanel] mapped members:', mapped);
      setLoading(false);
    }
    fetchMembers();
  }, [currentUserId, session]);

  const showToast = (t: ToastState) => setToast(t);

  const handleRoleChange = async (member: Member, newRole: 'admin' | 'member') => {
    const name = getDisplayName(member.full_name, member.email);
    const { error } = await supabase
      .from('workspace_members')
      .update({ role: newRole })
      .eq('user_id', member.user_id);

    if (!error) {
      setMembers(prev => prev.map(m =>
        m.user_id === member.user_id ? { ...m, role: newRole } : m
      ));
      showToast({ id: Date.now(), success: true, name, role: newRole.charAt(0).toUpperCase() + newRole.slice(1) });
    } else {
      showToast({ id: Date.now(), success: false, name });
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('user_id', removeTarget.user_id);

    if (!error) {
      setMembers(prev => prev.filter(m => m.user_id !== removeTarget.user_id));
    }
    setRemoving(false);
    setRemoveTarget(null);
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText('flowtalk.com/join/abc123');
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const filtered = members.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return getDisplayName(m.full_name, m.email).toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-[18px] font-extrabold text-[#111827] mb-1">Members</h1>
        <p className="text-[13px] text-gray-500">Manage who has access to your workspace</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 border border-[#E5E7EB] rounded-lg px-3 py-2 flex-1 max-w-xs bg-white">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className="text-[13px] text-gray-700 placeholder-gray-400 outline-none bg-transparent w-full"
          />
        </div>
        <button
          onClick={handleCopyInvite}
          className="flex items-center gap-2 px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] text-gray-700 hover:bg-[#F7F8FA] transition-all duration-150 shrink-0"
        >
          <Link size={14} className="text-gray-500 shrink-0" />
          {copiedInvite ? 'Copied!' : 'Copy invite link'}
        </button>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[#4d298c] text-white rounded-lg text-[13px] font-medium hover:bg-[#3d1f70] transition-all duration-150 shrink-0"
        >
          <UserPlus size={14} className="shrink-0" />
          Invite members
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_108px_92px_108px_124px_56px] bg-[#F7F8FA] border-b border-[#E5E7EB] px-4 py-2.5 gap-2">
          {['Member', 'Role', 'Status', 'Joined', 'Channel access', 'Actions'].map(h => (
            <span key={h} className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {h}
            </span>
          ))}
        </div>

        {/* Loading skeletons */}
        {loading && [0, 1, 2].map(i => <SkeletonRow key={i} />)}

        {/* No results */}
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-[13px] text-gray-400">No members found</div>
        )}

        {/* Member rows */}
        {!loading && filtered.map((m, idx) => {
          const isCurrentUser = m.user_id === currentUserId;
          const isOwner = m.role === 'owner';
          const initials = getInitials(m.full_name, m.email);
          const displayName = getDisplayName(m.full_name, m.email);
          const badgeCls = ROLE_BADGE[m.role] ?? ROLE_BADGE.member;

          return (
            <div
              key={m.user_id}
              className={`grid grid-cols-[1fr_108px_92px_108px_124px_56px] px-4 py-3 gap-2 hover:bg-gray-50 transition-all duration-150 items-center${idx < filtered.length - 1 ? ' border-b border-[#E5E7EB]' : ''}`}
            >
              {/* Member */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4d298c] to-purple-400 flex items-center justify-center shrink-0">
                  <span className="text-white text-[11px] font-bold">{initials}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[#111827] truncate">
                    {displayName}
                    {isCurrentUser && <span className="ml-1.5 text-[11px] text-gray-400 font-normal">(you)</span>}
                  </div>
                  <div className="text-[11px] text-gray-400 truncate">{m.email}</div>
                </div>
              </div>

              {/* Role — badge for owner/self, dropdown for others */}
              <div>
                {isOwner || isCurrentUser ? (
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badgeCls}`}>
                    {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                  </span>
                ) : (
                  <select
                    value={m.role}
                    onChange={e => handleRoleChange(m, e.target.value as 'admin' | 'member')}
                    className="border border-[#E5E7EB] rounded-lg px-2 py-1 text-[12px] bg-white cursor-pointer outline-none focus:border-[#4d298c] transition-colors"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: m.status === 'online' ? '#d7f78b' : '#E5E7EB' }}
                />
                <span className="text-[13px] text-gray-600">{m.status === 'online' ? 'Active' : 'Offline'}</span>
              </div>

              {/* Joined */}
              <div className="text-[13px] text-gray-600">{m.joined_at ? formatJoined(m.joined_at) : '—'}</div>

              {/* Channel access */}
              <div>
                {isOwner
                  ? <span className="text-[13px] text-gray-600">All channels</span>
                  : <button className="text-[13px] text-[#4d298c] hover:underline">Manage →</button>
                }
              </div>

              {/* Actions */}
              <div className="flex justify-center">
                {!isCurrentUser && !isOwner && (
                  <button
                    onClick={() => setRemoveTarget(m)}
                    className="text-gray-400 hover:text-red-500 transition-all duration-150"
                    title="Remove member"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4">
        <span className="text-[12px] text-gray-400">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Toast */}
      {toast && (
        <ToastNotification toast={toast} onDismiss={() => setToast(null)} />
      )}

      {/* Remove confirmation modal */}
      {removeTarget && (
        <RemoveModal
          member={removeTarget}
          removing={removing}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={confirmRemove}
        />
      )}

      {/* Invite modal */}
      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export default function Settings() {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState<NavItemId>('members');

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      {/* Left nav */}
      <div className="w-[200px] min-w-[200px] bg-[#F7F8FA] border-r border-[#E5E7EB] flex flex-col">
        {/* Back link */}
        <div className="px-4 py-4 border-b border-[#E5E7EB]">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-[#111827] transition-all duration-150"
          >
            <ArrowLeft size={15} className="shrink-0" />
            <span>Back to FlowTalk</span>
          </button>
        </div>

        {/* Nav sections */}
        <div className="flex-1 overflow-y-auto py-3">
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.label} className={si > 0 ? 'mt-4' : ''}>
              <div className="px-4 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  {section.label}
                </span>
              </div>
              {section.items.map(item => {
                const Icon = item.icon;
                const active = activeItem === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveItem(item.id)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-left transition-all duration-150 ${
                      active
                        ? 'bg-[#ede8f7] text-[#4d298c] font-semibold border-r-2 border-[#4d298c]'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={15} className="shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Danger zone */}
          <div className="mt-4">
            <div className="px-4 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Danger Zone
              </span>
            </div>
            <button
              onClick={() => setActiveItem('delete')}
              className={`w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-left transition-all duration-150 ${
                activeItem === 'delete'
                  ? 'bg-red-50 text-red-600 font-semibold border-r-2 border-red-500'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <Trash2 size={15} className="shrink-0" />
              Delete workspace
            </button>
          </div>
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '28px 32px' }}>
        {activeItem === 'members' ? (
          <MembersPanel />
        ) : (
          <p className="text-[13px] text-gray-400">Coming soon.</p>
        )}
      </div>
    </div>
  );
}
