import { ChevronDown, ChevronRight, Search, Hash, Plus, X, Inbox, BellOff } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type DbChannel = {
  id: string;
  name: string;
  type: string;
  category: string | null;
  is_active: boolean | null;
};

const DM_MEMBERS = [
  { id: 'daniel', name: 'Daniel A.', online: true,  gradient: 'from-[#4d298c] to-purple-400' },
  { id: 'emily',  name: 'Emily D.',  online: false, gradient: 'from-purple-400 to-pink-400' },
];

interface SidebarProps {
  selectedDMId: string | null;
  onSelectDM: (id: string) => void;
  onClearDM: () => void;
  selectedChannelId: string | null;
  onSelectChannel: (id: string) => void;
  reloadTrigger: number;
  mutedChannelIds: Set<string>;
}

// ─── Create Channel Modal ─────────────────────────────────────────────────────

interface CreateChannelModalProps {
  initialCategory: string;
  onClose: () => void;
  onCreated: () => void;
}

function CreateChannelModal({ initialCategory, onClose, onCreated }: CreateChannelModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) { setError('Channel name is required.'); return; }
    setSaving(true);
    const { error: dbError } = await supabase.from('channels').insert({
      name: trimmedName,
      category: category.trim() || 'General',
      is_active: true,
      type: 'channel',
    });
    setSaving(false);
    if (dbError) { setError(dbError.message); return; }
    onCreated();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-80 p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-[16px] font-bold text-gray-900 mb-4">New Channel</h2>
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-gray-700 block mb-1">Channel name</label>
            <input
              autoFocus
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="e.g. design-feedback"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#4d298c] focus:ring-2 focus:ring-[#ede8f7]"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-gray-700 block mb-1">Category</label>
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. General"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#4d298c] focus:ring-2 focus:ring-[#ede8f7]"
            />
          </div>
          {error && <p className="text-[12px] text-red-500">{error}</p>}
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-[#4d298c] text-white rounded-lg font-semibold text-[13px] hover:bg-[#3d1f70] disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle Pill ─────────────────────────────────────────────────────────────

function TogglePill({ on, onClick }: { on: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-5 rounded-full relative transition-all duration-200 flex-shrink-0 ${on ? 'bg-[#4d298c]' : 'bg-[#E5E7EB]'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar({
  selectedDMId, onSelectDM, onClearDM, selectedChannelId, onSelectChannel,
  reloadTrigger, mutedChannelIds,
}: SidebarProps) {
  const [channels, setChannels] = useState<DbChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dmExpanded, setDmExpanded] = useState(true);
  const [inactiveExpanded, setInactiveExpanded] = useState(false);
  // category name → expanded (default true)
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [createModal, setCreateModal] = useState<{ open: boolean; category: string }>({ open: false, category: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(() => localStorage.getItem('flowtalk_focus_mode') === 'true');
  const [dnd, setDnd] = useState(() => localStorage.getItem('flowtalk_dnd') === 'true');
  const [modePopupOpen, setModePopupOpen] = useState(false);

  const toggleFocusMode = () => {
    const next = !focusMode;
    setFocusMode(next);
    localStorage.setItem('flowtalk_focus_mode', String(next));
  };

  const toggleDnd = () => {
    const next = !dnd;
    setDnd(next);
    localStorage.setItem('flowtalk_dnd', String(next));
  };

  const loadChannels = useCallback(async () => {
    const { data } = await supabase
      .from('channels')
      .select('id, name, type, category, is_active')
      .order('name');
    setChannels(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadChannels(); }, [loadChannels, reloadTrigger]);

  const isCatExpanded = (cat: string) => expandedCats[cat] ?? true;
  const toggleCat = (cat: string) =>
    setExpandedCats(prev => ({ ...prev, [cat]: !isCatExpanded(cat) }));

  const handleSelectChannel = (id: string) => {
    onSelectChannel(id);
    setActiveNavItem(null);
    onClearDM();
  };

  const handleSelectDM = (id: string) => {
    onSelectChannel('');
    onSelectDM(id);
  };

  const isSelected = (id: string) => selectedChannelId === id && selectedDMId === null;

  const q = searchQuery.toLowerCase();

  // Partition active vs inactive (treat null as active)
  const activeChannels  = channels.filter(c => c.is_active !== false);
  const inactiveChannels = channels.filter(c => c.is_active === false);

  // Group active channels by category
  const categoryMap = new Map<string, DbChannel[]>();
  activeChannels.forEach(c => {
    const cat = c.category ?? 'General';
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(c);
  });

  const filteredDMs = DM_MEMBERS.filter(m => q === '' || m.name.toLowerCase().includes(q));

  const sel = 'bg-purple-50 text-[#4d298c]';
  const def = 'hover:bg-gray-100 text-gray-700';

  return (
    <div className="w-60 min-h-0 bg-[#f8f9fa] border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <button className="w-full flex items-center justify-between hover:bg-gray-100 rounded px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[15px] text-gray-900">FlowTalk</span>
            {dnd && <span className="text-[13px]">🔕</span>}
          </div>
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
            <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="text-gray-400 hover:text-gray-600 shrink-0">
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

      {/* Inbox nav item */}
      <div className="px-2 pb-1">
        <button
          onClick={() => { setActiveNavItem('inbox'); onSelectChannel(''); onClearDM(); }}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] ${activeNavItem === 'inbox' ? sel : def}`}
        >
          <Inbox size={16} className="text-gray-500 shrink-0" />
          <span>Inbox</span>
          <span className="ml-auto w-5 h-5 rounded-full bg-[#4d298c] text-white text-[10px] flex items-center justify-center font-semibold shrink-0">
            1
          </span>
        </button>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Channels section ───────────────────────────────────── */}
        <div className="mt-2">
          {/* Section header */}
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Channels</span>
            <button
              onClick={() => setCreateModal({ open: true, category: '' })}
              className="p-0.5 hover:bg-gray-200 rounded"
              title="New channel"
            >
              <Plus size={14} className="text-gray-500" />
            </button>
          </div>

          {loading && (
            <p className="px-5 py-1.5 text-[12px] text-gray-400">Loading…</p>
          )}

          {!loading && Array.from(categoryMap.entries()).map(([cat, catChannels]) => {
            const expanded = isCatExpanded(cat);
            const filtered = q === '' ? catChannels : catChannels.filter(c => c.name.toLowerCase().includes(q));
            if (q !== '' && filtered.length === 0) return null;

            return (
              <div key={cat}>
                {/* Category row */}
                <div className="flex items-center px-2 py-0.5 group">
                  <button
                    onClick={() => toggleCat(cat)}
                    className="flex items-center gap-1 flex-1 min-w-0 hover:bg-gray-100 rounded px-1 py-1 text-left"
                  >
                    {expanded
                      ? <ChevronDown size={12} className="text-gray-400 shrink-0" />
                      : <ChevronRight size={12} className="text-gray-400 shrink-0" />
                    }
                    <span className="text-[12px] font-semibold text-gray-600 truncate">{cat}</span>
                  </button>
                  <button
                    onClick={() => setCreateModal({ open: true, category: cat })}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded shrink-0 ml-1"
                    title={`New channel in ${cat}`}
                  >
                    <Plus size={12} className="text-gray-500" />
                  </button>
                </div>

                {/* Channels under this category */}
                {expanded && (
                  <div className="space-y-0.5 px-2 pb-0.5">
                    {(q === '' ? catChannels : filtered).map(channel => {
                      const active = isSelected(channel.id);
                      return (
                        <button
                          key={channel.id}
                          onClick={() => handleSelectChannel(channel.id)}
                          className={`w-full flex items-center gap-2 pl-5 pr-2 py-1.5 rounded text-[13px] text-left ${active ? sel : def}`}
                        >
                          <Hash size={13} className={active ? 'text-[#4d298c] shrink-0' : 'text-gray-400 shrink-0'} />
                          <span className={`truncate flex-1 ${active ? 'font-medium' : ''}`}>{channel.name}</span>
                          {mutedChannelIds.has(channel.id) && (
                            <BellOff size={11} className="text-gray-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {!loading && categoryMap.size === 0 && q === '' && (
            <p className="px-5 py-1.5 text-[12px] text-gray-400">No channels yet.</p>
          )}
        </div>

        {/* ── Inactive section ───────────────────────────────────── */}
        <div className="mt-3">
          <button
            onClick={() => setInactiveExpanded(v => !v)}
            className="w-full flex items-center gap-1 px-3 py-1 hover:bg-gray-100"
          >
            {inactiveExpanded
              ? <ChevronDown size={11} className="text-gray-400 shrink-0" />
              : <ChevronRight size={11} className="text-gray-400 shrink-0" />
            }
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
              Inactive · AI
            </span>
          </button>
          {inactiveExpanded && (
            <div className="pb-1">
              {inactiveChannels.length === 0 ? (
                <p className="pl-6 pr-2 py-1 text-[11px] text-gray-400">No inactive channels</p>
              ) : (
                <div className="space-y-0.5 px-2 opacity-50">
                  {inactiveChannels.map(channel => {
                    const active = isSelected(channel.id);
                    return (
                      <button
                        key={channel.id}
                        onClick={() => handleSelectChannel(channel.id)}
                        className={`w-full flex items-center gap-2 pl-5 pr-2 py-1.5 rounded text-[13px] text-left ${active ? sel : def}`}
                      >
                        <Hash size={13} className="text-gray-400 shrink-0" />
                        <span className="truncate">{channel.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Direct Messages section ────────────────────────────── */}
        <div className="mt-4 mb-2">
          <div
            onClick={() => setDmExpanded(v => !v)}
            className="flex items-center justify-between px-3 py-1 hover:bg-gray-100 cursor-pointer"
          >
            <div className="flex items-center gap-1">
              {dmExpanded
                ? <ChevronDown size={12} className="text-gray-400 shrink-0" />
                : <ChevronRight size={12} className="text-gray-400 shrink-0" />
              }
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Direct messages
              </span>
            </div>
            <button
              onClick={e => e.stopPropagation()}
              className="p-0.5 hover:bg-gray-200 rounded"
              title="New DM"
            >
              <Plus size={13} className="text-gray-500" />
            </button>
          </div>

          {dmExpanded && (
            <div className="space-y-0.5 px-2 pb-1">
              {filteredDMs.map(member => (
                <button
                  key={member.id}
                  onClick={() => handleSelectDM(member.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] text-left ${
                    member.id === selectedDMId ? sel : def
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${member.gradient} relative shrink-0`}>
                    {member.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-[#f8f9fa]" />
                    )}
                  </div>
                  <span className="truncate">{member.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Bottom bar */}
      <div className="relative">
        {modePopupOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setModePopupOpen(false)} />
            <div className="absolute bottom-full left-2 right-2 mb-1 bg-white rounded-xl shadow-xl border border-[#E5E7EB] z-50 overflow-hidden">
              {/* Focus Mode row */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-[14px]">🎯</span>
                  <span className="text-[13px] font-medium text-[#444]">Focus Mode</span>
                </div>
                <TogglePill on={focusMode} onClick={(e) => { e.stopPropagation(); toggleFocusMode(); }} />
              </div>
              <div className="border-t border-[#E5E7EB]" />
              {/* DND row */}
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px]">🔕</span>
                    <span className="text-[13px] font-medium text-[#444]">Do Not Disturb</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5 pl-6">Silence all until you turn off</div>
                </div>
                <TogglePill on={dnd} onClick={(e) => { e.stopPropagation(); toggleDnd(); }} />
              </div>
            </div>
          </>
        )}
        <div
          onClick={() => setModePopupOpen(v => !v)}
          className={`w-full h-10 flex items-center justify-between px-3 border-t border-[#E5E7EB] cursor-pointer transition-all duration-200 ${focusMode ? 'bg-[#f0edf7]' : ''}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-[14px]">🎯</span>
            <span className={`text-[13px] transition-all duration-200 ${focusMode ? 'font-semibold text-[#4d298c]' : 'font-medium text-[#444]'}`}>
              Focus Mode
            </span>
          </div>
          <TogglePill on={focusMode} onClick={(e) => { e.stopPropagation(); toggleFocusMode(); }} />
        </div>
      </div>

      {/* Create Channel Modal */}
      {createModal.open && (
        <CreateChannelModal
          initialCategory={createModal.category}
          onClose={() => setCreateModal({ open: false, category: '' })}
          onCreated={loadChannels}
        />
      )}
    </div>
  );
}
