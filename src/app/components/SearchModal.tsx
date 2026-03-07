import { X, Hash, ArrowUpRight, Search } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChannel: (id: string) => void;
}

type MessageResult = {
  id: string;
  content: string;
  channel_id: string;
  channel_name: string;
  channel_type: string;
  sender_name: string;
  sender_avatar_url: string | null;
  created_at: string;
};

const DEFAULT_RECENT_SEARCHES = ['UI kit components', 'Diana T.', 'fonts.zip'];

function loadRecentSearches(): string[] {
  try {
    const s = localStorage.getItem('flowtalk_recent_searches');
    return s ? JSON.parse(s) : DEFAULT_RECENT_SEARCHES;
  } catch {
    return DEFAULT_RECENT_SEARCHES;
  }
}

function saveRecentSearch(term: string) {
  try {
    const prev = loadRecentSearches();
    const next = [term, ...prev.filter(s => s !== term)].slice(0, 5);
    localStorage.setItem('flowtalk_recent_searches', JSON.stringify(next));
  } catch { /* ignore */ }
}

function formatDateGroup(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function HighlightedText({ text, term }: { text: string; term: string }) {
  if (!term.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-[#ede8f7] text-[#4d298c] rounded px-0.5">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
}

async function fetchResults(term: string): Promise<MessageResult[]> {
  const query = supabase
    .from('messages')
    .select('id, content, channel_id, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(30);

  if (term.trim()) {
    query.ilike('content', `%${term}%`);
  }

  const { data: messages, error } = await query;
  if (error || !messages || messages.length === 0) return [];

  const channelIds = [...new Set(messages.map(m => m.channel_id))];
  const userIds    = [...new Set(messages.map(m => m.user_id))];

  const [{ data: channels }, { data: profiles }] = await Promise.all([
    supabase.from('channels').select('id, name, type').in('id', channelIds),
    supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds),
  ]);

  const channelMap = Object.fromEntries(
    (channels ?? []).map(c => [c.id, { name: c.name, type: c.type ?? 'channel' }])
  );
  const profileMap = Object.fromEntries(
    (profiles ?? []).map(p => [p.id, { name: p.full_name, avatar_url: p.avatar_url }])
  );

  return messages.map(m => ({
    id: m.id,
    content: m.content,
    channel_id: m.channel_id,
    channel_name: channelMap[m.channel_id]?.name ?? 'unknown',
    channel_type: channelMap[m.channel_id]?.type ?? 'channel',
    sender_name: profileMap[m.user_id]?.name ?? 'Unknown',
    sender_avatar_url: profileMap[m.user_id]?.avatar_url ?? null,
    created_at: m.created_at,
  }));
}

const TABS = [
  { id: 'all',     label: 'All results' },
  { id: 'threads', label: 'Threads' },
  { id: 'members', label: 'Members' },
  { id: 'files',   label: 'Files' },
  { id: 'dm',      label: 'Direct messages' },
  { id: 'links',   label: 'Links' },
];

export function SearchModal({ isOpen, onClose, onSelectChannel }: SearchModalProps) {
  const [searchQuery, setSearchQuery]     = useState('');
  const [activeTab, setActiveTab]         = useState('all');
  const [sortByType, setSortByType]       = useState(false);
  const [results, setResults]             = useState<MessageResult[]>([]);
  const [loading, setLoading]             = useState(false);
  const [focusedIndex, setFocusedIndex]   = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>(DEFAULT_RECENT_SEARCHES);
  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (term: string) => {
    setLoading(true);
    const data = await fetchResults(term);
    setResults(data);
    setLoading(false);
    setFocusedIndex(-1);
  }, []);

  // Reset and load recent messages when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery('');
    setActiveTab('all');
    setFocusedIndex(-1);
    setRecentSearches(loadRecentSearches());
    load('');
  }, [isOpen, load]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(searchQuery);
      if (searchQuery.trim()) saveRecentSearch(searchQuery.trim());
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, isOpen, load]);

  // Tab change resets focus
  useEffect(() => { setFocusedIndex(-1); }, [activeTab]);

  // Filter by tab
  const tabFiltered = (() => {
    let base = results;
    if (activeTab === 'threads') base = results.filter(r => r.channel_type !== 'dm');
    else if (activeTab === 'dm') base = results.filter(r => r.channel_type === 'dm');
    else if (activeTab === 'members' || activeTab === 'files' || activeTab === 'links') base = [];
    if (sortByType) base = [...base].sort((a, b) => a.channel_name.localeCompare(b.channel_name));
    return base;
  })();

  // Group by date label
  const groupedResults = tabFiltered.reduce((acc, result) => {
    const label = formatDateGroup(result.created_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(result);
    return acc;
  }, {} as Record<string, MessageResult[]>);

  const handleSelect = (result: MessageResult) => {
    onSelectChannel(result.channel_id);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(i => Math.min(i + 1, tabFiltered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && focusedIndex >= 0 && tabFiltered[focusedIndex]) {
        handleSelect(tabFiltered[focusedIndex]);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, tabFiltered, focusedIndex]);

  if (!isOpen) return null;

  const isEmpty = searchQuery.trim() === '';
  let resultIndex = 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search in FlowTalk..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#4d298c]"
              autoFocus
            />
            <button onClick={onClose} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 px-4 border-b border-gray-200 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#4d298c] text-[#4d298c]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">

          {/* Empty state: recent searches chips */}
          {isEmpty && (
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold text-gray-700">Recent searches</h3>
                <button
                  onClick={() => setSortByType(v => !v)}
                  className={`text-[12px] hover:text-[#4d298c] transition-colors ${sortByType ? 'text-[#4d298c] font-semibold' : 'text-gray-500'}`}
                >
                  Sort by: <span className="font-medium">Type</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map(q => (
                  <button
                    key={q}
                    onClick={() => setSearchQuery(q)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-[12px] text-gray-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sort by type button when query is active */}
          {!isEmpty && (
            <div className="px-4 pt-3 pb-1 flex justify-end">
              <button
                onClick={() => setSortByType(v => !v)}
                className={`text-[12px] hover:text-[#4d298c] transition-colors ${sortByType ? 'text-[#4d298c] font-semibold' : 'text-gray-500'}`}
              >
                Sort by: <span className="font-medium">Type</span>
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="px-4 py-6 text-center text-[13px] text-gray-400">Searching...</div>
          )}

          {/* No results */}
          {!loading && tabFiltered.length === 0 && (!isEmpty || activeTab !== 'all') && (
            <div className="p-8 text-center text-gray-500 text-[14px]">
              {!isEmpty ? `No results for "${searchQuery}"` : 'No results in this category'}
            </div>
          )}

          {/* Grouped results */}
          {!loading && Object.entries(groupedResults).map(([date, group]) => (
            <div key={date} className="px-4 py-2">
              <h4 className="text-[12px] font-medium text-gray-500 mb-2">{date}</h4>
              <div className="space-y-1">
                {group.map((result) => {
                  const myIndex = resultIndex++;
                  const isFocused = myIndex === focusedIndex;
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className={`w-full flex items-center gap-3 p-2 rounded text-left group transition-all duration-150 ${
                        isFocused ? 'bg-purple-50 ring-1 ring-[#4d298c]/20' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Avatar */}
                      {result.sender_avatar_url ? (
                        <img
                          src={result.sender_avatar_url}
                          alt={result.sender_name}
                          className="w-6 h-6 rounded-full flex-shrink-0 object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4d298c] to-purple-400 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-semibold text-white">{getInitials(result.sender_name)}</span>
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[13px] font-semibold text-gray-900 truncate">{result.sender_name}</span>
                          <span className="flex items-center gap-0.5 text-[11px] text-[#4d298c] font-medium flex-shrink-0">
                            <Hash size={10} />{result.channel_name}
                          </span>
                        </div>
                        <div className="text-[13px] text-gray-600 truncate">
                          <HighlightedText text={result.content} term={searchQuery} />
                        </div>
                      </div>

                      <span className="text-[11px] text-gray-400 flex-shrink-0">{formatTime(result.created_at)}</span>

                      <ArrowUpRight
                        size={14}
                        className={`flex-shrink-0 ${isFocused ? 'text-[#4d298c] opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 flex items-center justify-between text-[12px] text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><kbd className="font-sans bg-gray-100 px-1 rounded">↑↓</kbd> Move</span>
            <span className="flex items-center gap-1"><kbd className="font-sans bg-gray-100 px-1 rounded">↵</kbd> Select</span>
            <span className="flex items-center gap-1"><kbd className="font-sans bg-gray-100 px-1 rounded">Esc</kbd> Close</span>
          </div>
          <button onClick={onClose} className="hover:text-gray-700">Cancel</button>
        </div>
      </div>
    </div>
  );
}
