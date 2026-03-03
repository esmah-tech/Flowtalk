import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Home, Users, Shield, Hash, User, Bell, Trash2 } from 'lucide-react';

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
        <p className="text-[14px] text-gray-500">Members</p>
      </div>
    </div>
  );
}
