import { X, FileText, Hash, ArrowUpRight } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResult = {
  type: 'file' | 'person' | 'channel';
  title: string;
  subtitle?: string;
  date?: string;
};

const PERSON_GRADIENTS: Record<string, string> = {
  'Sophia Wilson':   'from-pink-400 to-orange-400',
  'Michael Brown':   'from-green-400 to-teal-500',
  'Nathan Mitchell': 'from-[#4d298c] to-purple-400',
};

const allResults: SearchResult[] = [
  { type: 'file',    title: 'fonts.zip',                           subtitle: 'Website / v3.0',               date: 'Today' },
  { type: 'file',    title: 'responsive-design-guidelines.pdf',    subtitle: 'UI-kit design / UI-kit design', date: 'Today' },
  { type: 'person',  title: 'Sophia Wilson',                       subtitle: 'UX/UI designer',               date: 'Today' },
  { type: 'person',  title: 'Michael Brown',                       subtitle: 'Back-end dev',                 date: 'Yesterday' },
  { type: 'file',    title: 'responsive-design-guidelines.pdf',    subtitle: '',                             date: 'Yesterday' },
  { type: 'channel', title: 'Front-end',                           subtitle: '',                             date: '20 May' },
  { type: 'person',  title: 'Nathan Mitchell',                     subtitle: 'Front-end dev',                date: '20 May' },
];

const RECENT_SEARCHES = ['UI kit components', 'Diana T.', 'fonts.zip'];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [filteredResults, setFilteredResults] = useState(allResults);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [sortByType, setSortByType] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredResults(allResults);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredResults(allResults.filter(r =>
        r.title.toLowerCase().includes(query) ||
        (r.subtitle && r.subtitle.toLowerCase().includes(query))
      ));
    }
    setFocusedIndex(-1);
  }, [searchQuery]);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [activeTab]);

  const baseResults = activeTab === 'all'
    ? filteredResults
    : filteredResults.filter(r => {
        if (activeTab === 'members') return r.type === 'person';
        if (activeTab === 'files')   return r.type === 'file';
        if (activeTab === 'threads') return r.type === 'channel';
        if (activeTab === 'dm')      return r.type === 'person';
        return false;
      });

  const tabFilteredResults = sortByType
    ? [...baseResults].sort((a, b) => a.type.localeCompare(b.type))
    : baseResults;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(i => Math.min(i + 1, tabFilteredResults.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && focusedIndex >= 0) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, tabFilteredResults.length, focusedIndex]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'all',     label: 'All results' },
    { id: 'threads', label: 'Threads' },
    { id: 'members', label: 'Members' },
    { id: 'files',   label: 'Files' },
    { id: 'dm',      label: 'Direct messages' },
    { id: 'links',   label: 'Links' },
  ];

  const groupedResults = tabFilteredResults.reduce((acc, result) => {
    const date = result.date || 'Other';
    if (!acc[date]) acc[date] = [];
    acc[date].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  let resultIndex = 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search in FlowTalk..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#4d298c]"
              autoFocus
            />
            <button onClick={onClose} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 px-4 border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
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
          {searchQuery.trim() === '' && (
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
                {RECENT_SEARCHES.map(q => (
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

          {searchQuery.trim() !== '' && (
            <div className="px-4 pt-3 pb-1 flex justify-end">
              <button
                onClick={() => setSortByType(v => !v)}
                className={`text-[12px] hover:text-[#4d298c] transition-colors ${sortByType ? 'text-[#4d298c] font-semibold' : 'text-gray-500'}`}
              >
                Sort by: <span className="font-medium">Type</span>
              </button>
            </div>
          )}

          {Object.entries(groupedResults).map(([date, results]) => (
            <div key={date} className="px-4 py-2">
              <h4 className="text-[12px] font-medium text-gray-500 mb-2">{date}</h4>
              <div className="space-y-1">
                {results.map((result, i) => {
                  const myIndex = resultIndex++;
                  const isFocused = myIndex === focusedIndex;
                  return (
                    <button
                      key={i}
                      onClick={onClose}
                      className={`w-full flex items-center gap-3 p-2 rounded text-left group transition-colors ${
                        isFocused ? 'bg-purple-50 ring-1 ring-[#4d298c]/20' : 'hover:bg-gray-50'
                      }`}
                    >
                      {result.type === 'file' && (
                        <FileText size={16} className="text-gray-400 flex-shrink-0" />
                      )}
                      {result.type === 'person' && (
                        <div className={`w-6 h-6 rounded bg-gradient-to-br ${PERSON_GRADIENTS[result.title] ?? 'from-[#4d298c] to-purple-400'} flex-shrink-0`} />
                      )}
                      {result.type === 'channel' && (
                        <Hash size={16} className="text-gray-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] text-gray-900 truncate">{result.title}</div>
                        {result.subtitle && (
                          <div className="text-[12px] text-gray-500 truncate">{result.subtitle}</div>
                        )}
                      </div>
                      <ArrowUpRight size={14} className={`flex-shrink-0 ${isFocused ? 'text-[#4d298c] opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {tabFilteredResults.length === 0 && (searchQuery.trim() !== '' || activeTab !== 'all') && (
            <div className="p-8 text-center text-gray-500 text-[14px]">
              {searchQuery.trim() !== '' ? `No results for "${searchQuery}"` : 'No results in this category'}
            </div>
          )}
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
