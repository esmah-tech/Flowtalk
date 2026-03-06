import React, { useState, useEffect } from 'react';
import { Plus, Check, Video, LayoutGrid, Activity, AtSign } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { ProfileModal } from './ProfileModal';

const STATUS_OPTIONS = [
  { id: 'online',  label: 'Online',          color: '#d7f78b' },
  { id: 'away',    label: 'Away',             color: '#F59E0B' },
  { id: 'dnd',     label: 'Do Not Disturb',   color: '#DC2626' },
  { id: 'offline', label: 'Offline',          color: '#9CA3AF' },
] as const;

type StatusId = typeof STATUS_OPTIONS[number]['id'];

export function LeftRail() {
  const { session } = useAuth();
  const [status, setStatus] = useState<StatusId>('online');
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!session?.user) return;
    supabase.from('profiles').select('full_name, avatar_url').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => {
        setProfileName(data?.full_name ?? null);
        setProfileAvatar(data?.avatar_url ?? null);
      });
  }, [session]);

  return (
    <>
    <div className="w-14 bg-[#1a1d21] flex flex-col items-center py-4 gap-4">
      {/* Workspace Avatar */}
      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center relative">
        <span className="text-[#1a1d21] font-bold text-lg">F</span>
        {/* unread notification dot */}
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#d7f78b] border-2 border-[#1a1d21]" />
      </div>

      {/* Navigation Icons */}
      <div className="flex flex-col gap-3">
        {[
          { id: 'home',     icon: <LayoutGrid size={18} />, title: 'Home' },
          { id: 'activity', icon: <Activity   size={18} />, title: 'Activity' },
          { id: 'mentions', icon: <AtSign     size={18} />, title: 'Mentions' },
        ].map(({ id, icon, title }) => (
          <button
            key={id}
            title={title}
            onClick={() => setActiveNav(v => v === id ? null : id)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              activeNav === id ? 'bg-white/20' : 'hover:bg-[#2a2d31]'
            }`}
          >
            <span className={activeNav === id ? 'text-white' : 'text-gray-400'}>{icon}</span>
          </button>
        ))}
      </div>

      {/* Add Button */}
      <button title="Add workspace" className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#2a2d31] transition-colors mt-auto">
        <Plus size={20} className="text-gray-400" />
      </button>

      {/* User Avatar */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="w-9 h-9 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/30">
            {profileAvatar
              ? <img src={profileAvatar} alt="avatar" className="w-9 h-9 object-cover" />
              : <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#4d298c] to-purple-600 flex items-center justify-center">
                  <span className="text-white text-[12px] font-bold">
                    {(profileName ?? session?.user?.email ?? '').slice(0, 2).toUpperCase()}
                  </span>
                </div>
            }
          </button>
        </PopoverTrigger>

        <PopoverContent side="top" align="start" sideOffset={8}
          className="w-72 p-0 rounded-xl shadow-xl border border-gray-200 bg-white overflow-hidden">

          {/* Profile header */}
          <div className="p-4 flex flex-col items-center border-b border-gray-100">
            <div className="w-16 h-16 rounded-full overflow-hidden mb-3">
              {profileAvatar
                ? <img src={profileAvatar} alt="avatar" className="w-16 h-16 object-cover" />
                : <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4d298c] to-purple-600 flex items-center justify-center">
                    <span className="text-white text-[18px] font-bold">
                      {(profileName ?? session?.user?.email ?? '').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
              }
            </div>
            <div className="font-semibold text-[16px] text-gray-900">
              {profileName || session?.user?.email?.split('@')[0] || ''}
            </div>
            <div className="text-[12px] text-gray-400 mt-0.5">{session?.user?.email ?? ''}</div>
          </div>

          {/* Status selector */}
          <div className="py-2 border-b border-gray-100">
            {STATUS_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setStatus(opt.id)}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-[13px] text-gray-700">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                <span className="flex-1 text-left">{opt.label}</span>
                {status === opt.id && <Check size={14} className="text-gray-700" />}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="p-3 space-y-2">
            <button
              onClick={() => window.open('https://meet.google.com', '_blank', 'noopener,noreferrer')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-[13px] text-gray-900"
              style={{ backgroundColor: '#d7f78b' }}>
              <Video size={15} />
              Start Google Meet
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="w-full py-2.5 rounded-lg font-semibold text-[13px] text-white"
              style={{ backgroundColor: '#111827' }}>
              Edit Profile
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate('/signin'); }}
              className="w-full py-2.5 rounded-lg font-semibold text-[13px] text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>

    {showProfile && (
      <ProfileModal
        initialName={profileName}
        initialAvatar={profileAvatar}
        email={session?.user?.email ?? ''}
        onClose={() => setShowProfile(false)}
        onSaved={(name, avatar) => { setProfileName(name); setProfileAvatar(avatar); setShowProfile(false); }}
      />
    )}
    </>
  );
}
