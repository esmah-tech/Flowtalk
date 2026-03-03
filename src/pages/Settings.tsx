import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Home, Users, Shield, Hash, User, Bell, Trash2,
  Search, Link, UserPlus,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

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

function MembersPanel() {
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);

  const email = session?.user?.email ?? '';
  const namePart = email.split('@')[0] ?? '';
  const displayName = namePart
    .split(/[._-]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const initials = namePart.slice(0, 2).toUpperCase();
  const joinedDate = session?.user?.created_at
    ? new Date(session.user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—';

  const handleCopyInvite = () => {
    navigator.clipboard.writeText('flowtalk.com/join/abc123');
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

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
        <button className="flex items-center gap-2 px-3 py-2 bg-[#4d298c] text-white rounded-lg text-[13px] font-medium hover:bg-[#3d1f70] transition-all duration-150 shrink-0">
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

        {/* Current user row */}
        <div className="grid grid-cols-[1fr_108px_92px_108px_124px_56px] px-4 py-3 gap-2 hover:bg-gray-50 transition-all duration-150 items-center">
          {/* Member */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4d298c] to-purple-400 flex items-center justify-center shrink-0">
              <span className="text-white text-[11px] font-bold">{initials}</span>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-[#111827] truncate">{displayName || email}</div>
              <div className="text-[11px] text-gray-400 truncate">{email}</div>
            </div>
          </div>
          {/* Role */}
          <div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e]">
              Owner
            </span>
          </div>
          {/* Status */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#d7f78b' }} />
            <span className="text-[13px] text-gray-600">Active</span>
          </div>
          {/* Joined */}
          <div className="text-[13px] text-gray-600">{joinedDate}</div>
          {/* Channel access */}
          <div className="text-[13px] text-gray-600">All channels</div>
          {/* Actions */}
          <div />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4">
        <span className="text-[12px] text-gray-400">1 member</span>
      </div>
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
