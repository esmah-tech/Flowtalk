import { ChevronDown, Search, Sparkles, FileText, Bookmark, Inbox, Hash, Plus, ChevronRight, X } from 'lucide-react';
import React, { useState } from 'react';

type SubChannel = { id: string; name: string; badge?: number };
type Channel = {
  id: string;
  name: string;
  badge?: number;
  active: boolean;
  children?: SubChannel[];
};

const ALL_CHANNELS: Channel[] = [
  { id: 'general',       name: 'general',       badge: 1, active: true },
  { id: 'frontend',      name: 'frontend',       active: true },
  { id: 'v3.0',          name: 'v3.0',           active: true, children: [
    { id: 'wireframe',   name: 'Wireframe' },
    { id: 'design-sub',  name: 'Design' },
  ]},
  { id: 'design',        name: 'design',         active: false },
  { id: 'announcements', name: 'announcements',  active: false },
];

const ACME_CHANNELS = [
  { id: 'acme-website', name: 'website-redesign' },
  { id: 'acme-brand',   name: 'brand-assets' },
];

const DM_MEMBERS = [
  { id: 'daniel', name: 'Daniel A.', online: true,  gradient: 'from-blue-400 to-cyan-400' },
  { id: 'emily',  name: 'Emily D.',  online: false, gradient: 'from-purple-400 to-pink-400' },
];

interface SidebarProps {
  selectedDMId: string | null;
  onSelectDM: (id: string) => void;
  onClearDM: () => void;
}

export function Sidebar({ selectedDMId, onSelectDM, onClearDM }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    favorites: true,
    channels: true,
    directMessages: true,
    clientAcme: false,
    inactive: false,
  });

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>('frontend');
  const [activeNavItem, setActiveNavItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSelectChannel = (id: string) => {
    setSelectedChannelId(id);
    setActiveNavItem(null);
    onClearDM();
  };

  const handleSelectDM = (id: string) => {
    setSelectedChannelId(null);
    onSelectDM(id);
  };

  // A channel item is active only when no DM is open
  const isSelected = (id: string) => selectedChannelId === id && selectedDMId === null;

  const q = searchQuery.toLowerCase();

  function channelMatchesQuery(c: Channel): boolean {
    return (
      c.name.toLowerCase().includes(q) ||
      (c.children ?? []).some(s => s.name.toLowerCase().includes(q))
    );
  }

  const activeChannels = ALL_CHANNELS.filter(c => c.active && (q === '' || channelMatchesQuery(c)));
  const inactiveChannels = ALL_CHANNELS.filter(c => !c.active);
  const filteredAcme = ACME_CHANNELS.filter(c => q === '' || c.name.toLowerCase().includes(q));
  const filteredDMs = DM_MEMBERS.filter(m => q === '' || m.name.toLowerCase().includes(q));

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const selectedItemClass = 'bg-purple-50 text-[#4d298c]';
  const defaultItemClass = 'hover:bg-gray-100 text-gray-700';

  return (
    <div className="w-60 min-h-0 bg-[#f8f9fa] border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <button className="w-full flex items-center justify-between hover:bg-gray-100 rounded px-2 py-1.5">
          <span className="font-bold text-[15px] text-gray-900">FlowTalk</span>
          <ChevronDown size={16} className="text-gray-600" />
        </button>
      </div>

      {/* Search bar */}
      <div className="px-3 py-2">
        {isSearchOpen ? (
          <div className="flex items-center gap-1.5 bg-gray-100 rounded px-2 py-1.5">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search channels & members..."
              className="flex-1 bg-transparent text-[13px] text-gray-700 placeholder-gray-400 outline-none border-none min-w-0"
            />
            <button onClick={closeSearch} className="text-gray-400 hover:text-gray-600 shrink-0">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 px-2 py-1"
          >
            <Search size={16} />
            <span>Search</span>
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-1 px-2 space-y-0.5">
          {[
            { id: 'assistant',  icon: <Sparkles size={16} className="text-purple-500" />, label: 'Assistant', badge: <span className="ml-auto text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">NEW</span> },
            { id: 'drafts',     icon: <FileText size={16} className="text-gray-500" />,   label: 'Drafts' },
            { id: 'saved',      icon: <Bookmark size={16} className="text-gray-500" />,   label: 'Saved items' },
            { id: 'inbox',      icon: <Inbox    size={16} className="text-gray-500" />,   label: 'Inbox', badge: <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded font-medium text-white" style={{ backgroundColor: '#4d298c' }}>1</span> },
          ].map(({ id, icon, label, badge }) => (
            <button
              key={id}
              onClick={() => { setActiveNavItem(id); setSelectedChannelId(null); onClearDM(); }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] ${
                activeNavItem === id ? selectedItemClass : defaultItemClass
              }`}
            >
              {icon}
              <span>{label}</span>
              {badge}
            </button>
          ))}
        </div>

        {/* Favorites */}
        <div className="mt-4">
          <button
            onClick={() => toggleSection('favorites')}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 text-[13px] font-semibold text-gray-700"
          >
            <span>Favorites</span>
            {expandedSections.favorites ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expandedSections.favorites && (
            <div className="py-1 px-2 space-y-0.5">
              <button
                onClick={() => handleSelectChannel('fav-sophia')}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] ${isSelected('fav-sophia') ? selectedItemClass : defaultItemClass}`}
              >
                <div className="w-5 h-5 rounded bg-gradient-to-br from-pink-400 to-orange-400 shrink-0" />
                <span>Sophia Wilson</span>
                <span className="ml-auto text-[11px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-medium">2</span>
              </button>
              <button
                onClick={() => handleSelectChannel('frontend')}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] ${isSelected('frontend') ? selectedItemClass : defaultItemClass}`}
              >
                <Hash size={14} className={isSelected('frontend') ? 'text-[#4d298c]' : 'text-gray-500'} />
                <span>Front-end</span>
                <span className="ml-auto text-[11px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-medium">4</span>
              </button>
            </div>
          )}
        </div>

        {/* Channels */}
        <div className="mt-4">
          {/* Section header — div so Plus button can be a nested button */}
          <div
            onClick={() => toggleSection('channels')}
            className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 text-[13px] font-semibold text-gray-700 cursor-pointer"
          >
            <span>Channels</span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); console.log('create channel'); }}
                className="p-0.5 hover:bg-gray-200 rounded"
              >
                <Plus size={14} />
              </button>
              {expandedSections.channels ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          </div>

          {expandedSections.channels && (
            <div className="py-1 px-2 space-y-0.5">
              {activeChannels.map(channel => {
                const matchingChildren = q === ''
                  ? channel.children
                  : channel.children?.filter(s => s.name.toLowerCase().includes(q));
                const sel = isSelected(channel.id);

                return (
                  <div key={channel.id}>
                    <button
                      onClick={() => handleSelectChannel(channel.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] ${sel ? selectedItemClass : defaultItemClass}`}
                    >
                      <Hash size={14} className={sel ? 'text-[#4d298c]' : 'text-gray-500'} />
                      <span className={sel ? 'font-medium' : ''}>{channel.name}</span>
                      {channel.badge !== undefined && (
                        <span className="ml-auto text-[11px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                          {channel.badge}
                        </span>
                      )}
                    </button>
                    {matchingChildren?.map(sub => {
                      const subSel = isSelected(sub.id);
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleSelectChannel(sub.id)}
                          className={`w-full flex items-center gap-1.5 py-1 rounded text-[12px] pl-8 pr-2 ${subSel ? selectedItemClass : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                          <span className={subSel ? 'text-[#4d298c]' : 'text-gray-400'}>↳</span>
                          <Hash size={12} className={subSel ? 'text-[#4d298c]' : 'text-gray-400'} />
                          <span>{sub.name}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {/* Inactive sub-section */}
              {inactiveChannels.length > 0 && q === '' && (
                <>
                  <button
                    onClick={() => toggleSection('inactive')}
                    className="w-full flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-gray-400 hover:text-gray-600 mt-1"
                  >
                    {expandedSections.inactive ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <span>Inactive</span>
                    <span className="ml-auto">{inactiveChannels.length}</span>
                  </button>
                  {expandedSections.inactive && inactiveChannels.map(c => {
                    const sel = isSelected(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleSelectChannel(c.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12px] ${sel ? selectedItemClass : 'hover:bg-gray-100 text-gray-400 opacity-60'}`}
                      >
                        <Hash size={12} className={sel ? 'text-[#4d298c]' : 'text-gray-400'} />
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Client: Acme */}
        {(q === '' || filteredAcme.length > 0) && (
          <div className="mt-4">
            <div
              onClick={() => toggleSection('clientAcme')}
              className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 text-[13px] font-semibold text-gray-700 cursor-pointer"
            >
              <span>Client: Acme</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); console.log('create channel'); }}
                  className="p-0.5 hover:bg-gray-200 rounded"
                >
                  <Plus size={14} />
                </button>
                {expandedSections.clientAcme ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </div>
            {expandedSections.clientAcme && (
              <div className="py-1 px-2 space-y-0.5">
                {filteredAcme.map(c => {
                  const sel = isSelected(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectChannel(c.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] ${sel ? selectedItemClass : defaultItemClass}`}
                    >
                      <Hash size={14} className={sel ? 'text-[#4d298c]' : 'text-gray-500'} />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Direct Messages */}
        <div className="mt-4">
          <div
            onClick={() => toggleSection('directMessages')}
            className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 text-[13px] font-semibold text-gray-700 cursor-pointer"
          >
            <span>Direct messages</span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); console.log('create channel'); }}
                className="p-0.5 hover:bg-gray-200 rounded"
              >
                <Plus size={14} />
              </button>
              {expandedSections.directMessages ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          </div>
          {expandedSections.directMessages && (
            <div className="py-1 px-2 space-y-0.5">
              {filteredDMs.map(member => (
                <button
                  key={member.id}
                  onClick={() => handleSelectDM(member.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] ${
                    member.id === selectedDMId ? selectedItemClass : defaultItemClass
                  }`}
                >
                  <div className={`w-5 h-5 rounded bg-gradient-to-br ${member.gradient} relative shrink-0`}>
                    {member.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#f8f9fa]" />
                    )}
                  </div>
                  <span>{member.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
