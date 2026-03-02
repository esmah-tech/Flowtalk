import { Hash, Users, Pin, Search, MoreHorizontal, Settings, Smile, Paperclip, AtSign, Send, Heart, Mic, Square } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { SearchModal } from './SearchModal';
import type { DMProfile } from '../App';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

interface ChatAreaProps {
  selectedDM: DMProfile | null;
  selectedChannelId: string | null;
  onSelectChannel: (id: string | null) => void;
  onChannelsChanged: () => void;
  onToggleMute: (id: string) => void;
  mutedChannelIds: Set<string>;
}

type DbMessage = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
};

const EMOJIS = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '✅', '👀', '💯', '🙌', '😎', '🤔'];
const MENTION_MEMBERS = ['Daniel A.', 'Emily D.', 'Sophia Wilson', 'Diana T.'];

type SentMessage =
  | { kind: 'text';  text: string;     time: string }
  | { kind: 'voice'; duration: string; time: string; transcriptOpen: boolean };

export function ChatArea({
  selectedDM, selectedChannelId,
  onSelectChannel, onChannelsChanged, onToggleMute, mutedChannelIds,
}: ChatAreaProps) {
  const { session } = useAuth();
  const [isSearchOpen,        setIsSearchOpen]        = useState(false);
  const [messageInput,        setMessageInput]        = useState('');
  const [sentMessages,        setSentMessages]        = useState<SentMessage[]>([]);
  const [dbMessages,          setDbMessages]          = useState<DbMessage[]>([]);
  const [thumbsUpCount,       setThumbsUpCount]       = useState(2);
  const [heartCount,          setHeartCount]          = useState(1);
  const [quickViewExpanded,   setQuickViewExpanded]   = useState(false);
  const [settingsOpen,        setSettingsOpen]        = useState(false);
  const [channelName,         setChannelName]         = useState('');
  const [renameInput,         setRenameInput]         = useState('');
  const [renameSaving,        setRenameSaving]        = useState(false);
  const [deleteConfirm,       setDeleteConfirm]       = useState(false);
  const [emojiPickerOpen,     setEmojiPickerOpen]     = useState(false);
  const [mentionDropdownOpen, setMentionDropdownOpen] = useState(false);
  const [isRecording,         setIsRecording]         = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!selectedChannelId) return;
    const { data } = await supabase
      .from('messages')
      .select('id, content, user_id, created_at')
      .eq('channel_id', selectedChannelId)
      .order('created_at', { ascending: true });
    setDbMessages(data ?? []);
  }, [selectedChannelId]);

  useEffect(() => {
    setDbMessages([]);
    setSentMessages([]);
    fetchMessages();
  }, [selectedChannelId, fetchMessages]);

  useEffect(() => {
    if (!selectedChannelId) { setChannelName(''); setRenameInput(''); return; }
    supabase
      .from('channels')
      .select('name')
      .eq('id', selectedChannelId)
      .single()
      .then(({ data }) => {
        const name = data?.name ?? '';
        setChannelName(name);
        setRenameInput(name);
      });
  }, [selectedChannelId]);

  const handleSend = async () => {
    if (!messageInput.trim()) return;

    if (selectedDM) {
      // DM — local only
      setSentMessages(prev => [...prev, { kind: 'text', text: messageInput.trim(), time: 'just now' }]);
      setMessageInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      return;
    }

    if (!selectedChannelId || !session) return;

    const text = messageInput.trim();
    setMessageInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    await supabase.from('messages').insert({
      channel_id: selectedChannelId,
      user_id: session.user.id,
      content: text,
    });

    fetchMessages();
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setSentMessages(prev => [...prev, { kind: 'voice', duration: '0:08', time: 'just now', transcriptOpen: false }]);
  };

  const toggleTranscript = (index: number) => {
    setSentMessages(prev => prev.map((msg, i) =>
      i === index && msg.kind === 'voice' ? { ...msg, transcriptOpen: !msg.transcriptOpen } : msg
    ));
  };

  const handleEmojiClick = (emoji: string) => {
    setMessageInput(v => v + emoji);
    setEmojiPickerOpen(false);
    textareaRef.current?.focus();
  };

  const handleAtSign = () => {
    setMessageInput(v => v + '@');
    setMentionDropdownOpen(true);
    textareaRef.current?.focus();
  };

  const handleMentionSelect = (name: string) => {
    setMessageInput(v => (v.endsWith('@') ? v.slice(0, -1) : v) + `@${name} `);
    setMentionDropdownOpen(false);
    textareaRef.current?.focus();
  };

  const handleRenameChannel = async () => {
    const trimmed = renameInput.trim();
    if (!trimmed || !selectedChannelId) return;
    setRenameSaving(true);
    await supabase.from('channels').update({ name: trimmed }).eq('id', selectedChannelId);
    setChannelName(trimmed);
    setRenameSaving(false);
    setSettingsOpen(false);
    onChannelsChanged();
  };

  const handleDeleteChannel = async () => {
    if (!selectedChannelId) return;
    await supabase.from('channels').delete().eq('id', selectedChannelId);
    setSettingsOpen(false);
    setDeleteConfirm(false);
    onSelectChannel(null);
    onChannelsChanged();
  };

  const closeSettings = () => { setSettingsOpen(false); setDeleteConfirm(false); };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 relative">
        {selectedDM ? (
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedDM.gradient}`} />
              {selectedDM.online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            <div>
              <div className="font-semibold text-[15px] text-gray-900">{selectedDM.fullName}</div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${selectedDM.online ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-[12px] text-gray-500">{selectedDM.online ? 'Online' : 'Away'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Hash size={18} className="text-gray-600" />
              <span className="font-semibold text-[15px] text-gray-900">
                {channelName || 'frontend'}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button onClick={() => setIsSearchOpen(true)} className="p-2 hover:bg-gray-100 rounded transition-colors">
            <Search size={18} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded transition-colors">
            <Users size={18} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded transition-colors">
            <Pin size={18} className="text-gray-600" />
          </button>
          <button
            onClick={() => { setRenameInput(channelName); setSettingsOpen(true); }}
            className="bg-[#ede8f7] text-[#4d298c] rounded-lg p-1.5 hover:bg-[#ddd5f5] transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>

      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {selectedDM ? (
          /* DM messages — hardcoded + local sent */
          <>
            {selectedDM.messages.map((msg, i) => (
              msg.from === 'them' ? (
                <div key={i} className="flex gap-2 items-end relative group">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${selectedDM.gradient} flex-shrink-0`} />
                  <div>
                    <div className="text-[12px] text-gray-500 mb-1 ml-1">{selectedDM.name}</div>
                    <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 text-[14px] text-gray-800 max-w-xs">{msg.text}</div>
                    <div className="text-[11px] text-gray-400 mt-1 ml-1">{msg.time}</div>
                  </div>
                  <div className="absolute right-0 -top-3 hidden group-hover:flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5 z-10">
                    <button className="p-1.5 hover:bg-purple-50 rounded text-[13px]" title="React">👍</button>
                    <button className="p-1.5 hover:bg-purple-50 rounded text-[13px]" title="Reply">↩️</button>
                    <button className="p-1.5 hover:bg-purple-50 rounded" title="More options"><MoreHorizontal size={14} className="text-gray-500" /></button>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end relative group">
                  <div>
                    <div className="bg-[#4d298c] text-white rounded-2xl rounded-tr-sm px-3 py-2 text-[14px] max-w-xs">{msg.text}</div>
                    <div className="text-[11px] text-gray-400 mt-1 text-right">{msg.time}</div>
                  </div>
                  <div className="absolute left-0 -top-3 hidden group-hover:flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5 z-10">
                    <button className="p-1.5 hover:bg-purple-50 rounded text-[13px]" title="React">👍</button>
                    <button className="p-1.5 hover:bg-purple-50 rounded text-[13px]" title="Reply">↩️</button>
                    <button className="p-1.5 hover:bg-purple-50 rounded" title="More options"><MoreHorizontal size={14} className="text-gray-500" /></button>
                  </div>
                </div>
              )
            ))}
            {sentMessages.map((msg, i) => (
              <div key={`sent-${i}`} className="flex justify-end">
                <div>
                  {msg.kind === 'text' ? (
                    <div className="bg-[#4d298c] text-white rounded-2xl rounded-tr-sm px-3 py-2 text-[14px] max-w-xs">{msg.text}</div>
                  ) : (
                    <div className="bg-[#4d298c] text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs">
                      <div className="flex items-center gap-2 text-[14px]">
                        <span>🎤</span>
                        <span>Voice note · {msg.duration}</span>
                      </div>
                      <button onClick={() => toggleTranscript(i)} className="text-purple-200 text-[12px] mt-1.5 underline hover:text-white block">
                        {msg.transcriptOpen ? 'Hide transcript' : 'View transcript'}
                      </button>
                      {msg.transcriptOpen && (
                        <div className="mt-2 text-[12px] text-purple-200 border-t border-white/20 pt-2 leading-relaxed">
                          AI transcript will appear here after Supabase + Whisper integration
                        </div>
                      )}
                    </div>
                  )}
                  <div className="text-[11px] text-gray-400 mt-1 text-right">{msg.time}</div>
                </div>
              </div>
            ))}
          </>
        ) : selectedChannelId ? (
          /* Channel messages — from Supabase */
          <>
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] font-medium text-gray-400 px-1">Today</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            {dbMessages.length === 0 && (
              <p className="text-center text-[13px] text-gray-400 mt-8">No messages yet. Be the first to say something!</p>
            )}
            {dbMessages.map(msg => {
              const isMe = session?.user.id === msg.user_id;
              return isMe ? (
                <div key={msg.id} className="flex justify-end relative group">
                  <div>
                    <div className="bg-[#4d298c] text-white rounded-2xl rounded-tr-sm px-3 py-2 text-[14px] max-w-xs">{msg.content}</div>
                    <div className="text-[11px] text-gray-400 mt-1 text-right">{formatTime(msg.created_at)}</div>
                  </div>
                  <div className="absolute left-0 -top-3 hidden group-hover:flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5 z-10">
                    <button className="p-1.5 hover:bg-purple-50 rounded text-[13px]" title="React">👍</button>
                    <button className="p-1.5 hover:bg-purple-50 rounded text-[13px]" title="Reply">↩️</button>
                    <button className="p-1.5 hover:bg-purple-50 rounded" title="More options"><MoreHorizontal size={14} className="text-gray-500" /></button>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex gap-3 relative group">
                  <div className="w-9 h-9 rounded bg-gradient-to-br from-gray-300 to-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-[14px] text-gray-900">User</span>
                      <span className="text-[12px] text-gray-500">{formatTime(msg.created_at)}</span>
                    </div>
                    <div className="text-[14px] text-gray-800 leading-relaxed">{msg.content}</div>
                  </div>
                  <div className="absolute right-0 -top-3 hidden group-hover:flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5 z-10">
                    <button className="p-1.5 hover:bg-purple-50 rounded text-[13px]" title="React">👍</button>
                    <button className="p-1.5 hover:bg-purple-50 rounded text-[13px]" title="Reply">↩️</button>
                    <button className="p-1.5 hover:bg-purple-50 rounded" title="More options"><MoreHorizontal size={14} className="text-gray-500" /></button>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          /* Nothing selected — show placeholder hardcoded messages */
          <>
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] font-medium text-gray-400 px-1">Today</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Message 1 */}
            <div className="flex gap-3 relative group">
              <div className="w-9 h-9 rounded bg-gradient-to-br from-purple-400 to-pink-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-[14px] text-gray-900">@UX/UI @Sophia</span>
                  <span className="text-[12px] text-gray-500">10:22</span>
                </div>
                <div className="text-[14px] text-gray-800 leading-relaxed">
                  <p className="mb-3">Hey team, I wanted to discuss the custom UI-kit we're developing for the site redesign. We need to finalize some components and make key design decisions to ensure consistency across the board. Let's make sure we cover colors, typography, buttons, and any other essential UI elements.</p>
                  <p className="text-[#4d298c]">@UX/UI @Sophia</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setThumbsUpCount(c => c === 2 ? 3 : 2)}
                    className="flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 hover:border-gray-300 bg-white text-[12px]"
                  >
                    <span>👍</span>
                    <span className="text-gray-700">{thumbsUpCount}</span>
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded"><span className="text-gray-400">↩️</span></button>
                </div>
              </div>
              <div className="absolute right-0 -top-3 hidden group-hover:flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5 z-10">
                <button className="p-1.5 hover:bg-purple-50 rounded text-[13px]" title="React">👍</button>
                <button className="p-1.5 hover:bg-purple-50 rounded text-[13px]" title="Reply">↩️</button>
                <button className="p-1.5 hover:bg-purple-50 rounded" title="More options"><MoreHorizontal size={14} className="text-gray-500" /></button>
              </div>
            </div>

            {/* Message 2 */}
            <div className="flex gap-3 relative group">
              <div className="w-9 h-9 rounded bg-gradient-to-br from-[#4d298c] to-purple-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-[14px] text-gray-900">Diana T.</span>
                  <span className="text-[12px] text-gray-500">10m ago</span>
                </div>
                <div className="text-[14px] text-gray-800 leading-relaxed">
                  <p className="mb-3">I have already prepared all styles and components according to our standards during the design audit. I think the UI kit is complete. All that remains is to add some states to the interactive elements and prepare the Lottie files for animations.</p>
                  <p className="text-[#4d298c]">@Emily D. please take a look and let me know if you have any questions.</p>
                </div>

                {/* Link Preview Card */}
                <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between p-3 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-pink-400 to-orange-400 rounded flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">F</span>
                      </div>
                      <div>
                        <div className="font-medium text-[13px] text-gray-900">FlowTalk website v.3.0</div>
                        <div className="text-[11px] text-gray-500">flowtalk.com</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); setQuickViewExpanded(v => !v); }}
                      className="px-3 py-1.5 bg-gray-900 text-white text-[12px] font-medium rounded hover:bg-gray-800"
                    >
                      {quickViewExpanded ? 'Close' : 'Quick view'}
                    </button>
                  </div>
                  {quickViewExpanded && (
                    <div className="border-t border-gray-200 p-3 bg-white">
                      <div className="w-full h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded flex items-center justify-center text-gray-400 text-[13px]">
                        FlowTalk website v.3.0 — preview
                      </div>
                      <div className="mt-2 text-[12px] text-gray-500">flowtalk.com · Last updated today</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setHeartCount(c => c === 1 ? 2 : 1)}
                    className="flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 hover:border-gray-300 bg-white text-[12px]"
                  >
                    <Heart size={12} className="text-red-500 fill-red-500" />
                    <span className="text-gray-700">{heartCount}</span>
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded"><span className="text-gray-400">↩️</span></button>
                </div>
              </div>
              <div className="absolute right-0 -top-3 hidden group-hover:flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5 z-10">
                <button className="p-1.5 hover:bg-purple-50 rounded text-[13px]" title="React">👍</button>
                <button className="p-1.5 hover:bg-purple-50 rounded text-[13px]" title="Reply">↩️</button>
                <button className="p-1.5 hover:bg-purple-50 rounded" title="More options"><MoreHorizontal size={14} className="text-gray-500" /></button>
              </div>
            </div>

            {/* Message 3 */}
            <div className="flex gap-3 relative group">
              <div className="w-9 h-9 rounded bg-gradient-to-br from-green-400 to-teal-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-[14px] text-gray-900">Daniel A.</span>
                  <span className="text-[12px] text-gray-500">5m ago</span>
                </div>
                <div className="text-[14px] text-gray-800 leading-relaxed">
                  <p className="mb-2">Okay, keep me updated. @Diana T. I also wanted to remind you to keep the layers organized.</p>
                  <div className="inline-block bg-gray-100 px-3 py-2 rounded text-[13px] text-gray-700 border border-gray-200">
                    <div className="font-medium mb-1">Mentions</div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-gradient-to-br from-[#4d298c] to-purple-400" />
                      <span>Diana Taylor</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-5 h-5 rounded bg-gradient-to-br from-green-400 to-teal-500" />
                      <span>Daniel Anderson</span>
                    </div>
                    <div className="text-[12px] text-gray-500 mt-2">
                      ah the states and we'll start development. <span className="text-[#4d298c] cursor-pointer">↗</span> we're breaking all records
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute right-0 -top-3 hidden group-hover:flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5 z-10">
                <button className="p-1.5 hover:bg-purple-50 rounded text-[13px]" title="React">👍</button>
                <button className="p-1.5 hover:bg-purple-50 rounded text-[13px]" title="Reply">↩️</button>
                <button className="p-1.5 hover:bg-purple-50 rounded" title="More options"><MoreHorizontal size={14} className="text-gray-500" /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="border border-gray-300 rounded-lg focus-within:border-[#4d298c] focus-within:ring-2 focus-within:ring-purple-100">
          <textarea
            ref={textareaRef}
            placeholder={selectedDM ? `Message ${selectedDM.name}...` : 'Type a message...'}
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            className="w-full px-4 py-3 text-[14px] resize-none outline-none rounded-t-lg min-h-[72px]"
          />

          {isRecording ? (
            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="absolute w-3 h-3 bg-red-400 rounded-full animate-ping" />
                </div>
                <span className="text-[13px] font-medium text-red-600">Recording...</span>
              </div>
              <button
                onClick={handleStopRecording}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-[13px] font-medium rounded hover:bg-red-600"
              >
                <Square size={12} className="fill-white" />
                Stop
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <button className="p-1.5 hover:bg-gray-100 rounded">
                  <Paperclip size={18} className="text-gray-600" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => { setEmojiPickerOpen(v => !v); setMentionDropdownOpen(false); }}
                    className={`p-1.5 rounded ${emojiPickerOpen ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  >
                    <Smile size={18} className="text-gray-600" />
                  </button>
                  {emojiPickerOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setEmojiPickerOpen(false)} />
                      <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
                        <div className="grid grid-cols-6 gap-0.5">
                          {EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => handleEmojiClick(emoji)}
                              className="text-xl p-1.5 hover:bg-gray-100 rounded leading-none"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => { handleAtSign(); setEmojiPickerOpen(false); }}
                    className={`p-1.5 rounded ${mentionDropdownOpen ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  >
                    <AtSign size={18} className="text-gray-600" />
                  </button>
                  {mentionDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMentionDropdownOpen(false)} />
                      <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[160px]">
                        {MENTION_MEMBERS.map(name => (
                          <button
                            key={name}
                            onClick={() => handleMentionSelect(name)}
                            className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-purple-50 hover:text-[#4d298c]"
                          >
                            @{name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setIsRecording(true)}
                  className="p-1.5 hover:bg-gray-100 rounded"
                  title="Record voice note"
                >
                  <Mic size={18} className="text-gray-600" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setMessageInput(''); if (textareaRef.current) textareaRef.current.style.height = 'auto'; }}
                  className="px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-100 rounded"
                >
                  Discard
                </button>
                <button
                  onClick={handleSend}
                  className="px-4 py-1.5 bg-[#4d298c] text-white text-[13px] font-medium rounded hover:bg-[#3d1f70] flex items-center gap-2"
                >
                  <span>Send</span>
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {settingsOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={closeSettings}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-80 border border-[#E5E7EB] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {deleteConfirm ? (
              /* ── Delete confirmation ── */
              <>
                <div className="px-5 py-4 border-b border-[#E5E7EB]">
                  <h3 className="font-semibold text-[15px] text-gray-900">Delete channel?</h3>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    This will permanently delete <span className="font-semibold">#{channelName}</span> and all its messages. This cannot be undone.
                  </p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="flex-1 py-2 rounded-lg text-[13px] font-semibold text-gray-700 border border-[#E5E7EB] hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteChannel}
                      className="flex-1 py-2 bg-red-500 text-white rounded-lg text-[13px] font-semibold hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* ── Settings view ── */
              <>
                <div className="px-5 py-4 border-b border-[#E5E7EB]">
                  <h3 className="font-semibold text-[15px] text-gray-900">Channel settings</h3>
                </div>

                {/* Rename */}
                <div className="px-5 py-4 border-b border-[#E5E7EB]">
                  <label className="text-[12px] font-medium text-gray-700 block mb-1.5">Rename channel</label>
                  <input
                    value={renameInput}
                    onChange={e => setRenameInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRenameChannel()}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#4d298c] focus:ring-2 focus:ring-[#ede8f7]"
                  />
                  <button
                    onClick={handleRenameChannel}
                    disabled={renameSaving || !renameInput.trim()}
                    className="mt-2.5 w-full py-2 bg-[#4d298c] text-white text-[13px] font-semibold rounded-lg hover:bg-[#3d1f70] disabled:opacity-50 transition-colors"
                  >
                    {renameSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>

                {/* Actions */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      if (selectedChannelId) onToggleMute(selectedChannelId);
                      closeSettings();
                    }}
                    className="w-full text-left px-5 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {selectedChannelId && mutedChannelIds.has(selectedChannelId) ? 'Unmute channel' : 'Mute channel'}
                  </button>
                  <button className="w-full text-left px-5 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">
                    Copy link
                  </button>
                  <button className="w-full text-left px-5 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">
                    Mark as read
                  </button>
                </div>

                {/* Danger actions */}
                <div className="border-t border-[#E5E7EB] py-1">
                  <button
                    onClick={() => { closeSettings(); onSelectChannel(null); }}
                    className="w-full text-left px-5 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Leave channel
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="w-full text-left px-5 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Delete channel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
