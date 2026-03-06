import { Hash, Users, Search, MoreHorizontal, Settings, Smile, Paperclip, AtSign, Send, Mic, Square, Inbox, MessageSquare, SmilePlus } from 'lucide-react';
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

const EMOJIS = [
  '😀','😂','😍','🥰','😎','🤔','😢','😤','🤯','🥳','😅','🤣',
  '👍','👎','👏','🙌','🤝','🙏','✌️','💪','🤞','👌','🫡','🫶',
  '❤️','🧡','💛','💚','💙','💜','🖤','💔','💯','✅','🔥','⭐',
  '🎉','🚀','💡','🎯','🏆','🎨','👀','💬','📌','🗓️','📎','🔗',
];
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
  const [senderProfiles,      setSenderProfiles]      = useState<Record<string, { full_name: string | null; avatar_url: string | null }>>({});
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
    const msgs = data ?? [];
    setDbMessages(msgs);

    // Fetch profiles for unique senders (excluding current user — we already know them)
    const uniqueIds = [...new Set(msgs.map(m => m.user_id))];
    if (uniqueIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', uniqueIds);
      const map: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      for (const p of (profiles ?? [])) map[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
      setSenderProfiles(map);
    }
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
                {channelName}
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
          <div className="relative">
            <button
              onClick={() => { setRenameInput(channelName); setSettingsOpen(v => !v); }}
              className="bg-[#ede8f7] text-[#4d298c] rounded-lg p-1.5 hover:bg-[#ddd5f5] transition-colors"
            >
              <Settings size={18} />
            </button>

            {settingsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeSettings} />
                <div className="absolute top-full right-0 mt-1 w-[260px] bg-white rounded-xl shadow-xl border border-[#E5E7EB] z-50 overflow-hidden">

                  {/* Rename */}
                  <div className="p-3 border-b border-[#E5E7EB]">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 block mb-1.5">Rename channel</label>
                    <input
                      autoFocus
                      value={renameInput}
                      onChange={e => setRenameInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRenameChannel()}
                      className="w-full border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-[#4d298c] focus:ring-2 focus:ring-[#ede8f7]"
                    />
                    <button
                      onClick={handleRenameChannel}
                      disabled={renameSaving || !renameInput.trim()}
                      className="mt-2 w-full py-1.5 bg-[#4d298c] text-white text-[13px] font-semibold rounded-lg hover:bg-[#3d1f70] disabled:opacity-50 transition-colors"
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
                      className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {selectedChannelId && mutedChannelIds.has(selectedChannelId) ? 'Unmute channel' : 'Mute channel'}
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">
                      Copy link
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">
                      Mark as read
                    </button>
                  </div>

                  {/* Danger */}
                  <div className="border-t border-[#E5E7EB] py-1">
                    <button
                      onClick={() => { closeSettings(); onSelectChannel(null); }}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Leave channel
                    </button>
                    <button
                      onClick={() => { closeSettings(); setDeleteConfirm(true); }}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Delete channel
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>
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
                  <div className="absolute right-0 -top-3 opacity-0 group-hover:opacity-100 transition-all duration-150 bg-white border border-[#E5E7EB] rounded-lg shadow-sm flex items-center gap-1 px-1 py-1 z-10">
                    <button title="Reply" className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><MessageSquare size={15} /></button>
                    <button title="React" className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><SmilePlus size={15} /></button>
                    <button title="More" className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><MoreHorizontal size={15} /></button>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end relative group">
                  <div>
                    <div className="bg-[#4d298c] text-white rounded-2xl rounded-tr-sm px-3 py-2 text-[14px] max-w-xs">{msg.text}</div>
                    <div className="text-[11px] text-gray-400 mt-1 text-right">{msg.time}</div>
                  </div>
                  <div className="absolute left-0 -top-3 opacity-0 group-hover:opacity-100 transition-all duration-150 bg-white border border-[#E5E7EB] rounded-lg shadow-sm flex items-center gap-1 px-1 py-1 z-10">
                    <button title="Reply" className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><MessageSquare size={15} /></button>
                    <button title="React" className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><SmilePlus size={15} /></button>
                    <button title="More" className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><MoreHorizontal size={15} /></button>
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
                  <div className="absolute left-0 -top-3 opacity-0 group-hover:opacity-100 transition-all duration-150 bg-white border border-[#E5E7EB] rounded-lg shadow-sm flex items-center gap-1 px-1 py-1 z-10">
                    <button title="Reply" className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><MessageSquare size={15} /></button>
                    <button title="React" className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><SmilePlus size={15} /></button>
                    <button title="More" className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><MoreHorizontal size={15} /></button>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex gap-3 relative group">
                  {(() => {
                    const p = senderProfiles[msg.user_id];
                    const name = p?.full_name ?? '';
                    const initials = name
                      ? name.trim().split(/\s+/).length >= 2
                        ? (name.trim().split(/\s+/)[0][0] + name.trim().split(/\s+/).slice(-1)[0][0]).toUpperCase()
                        : name.slice(0, 2).toUpperCase()
                      : '?';
                    return p?.avatar_url
                      ? <img src={p.avatar_url} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4d298c] to-purple-400 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[11px] font-bold">{initials}</span>
                        </div>;
                  })()}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-[14px] text-gray-900">
                        {senderProfiles[msg.user_id]?.full_name || 'User'}
                      </span>
                      <span className="text-[12px] text-gray-500">{formatTime(msg.created_at)}</span>
                    </div>
                    <div className="text-[14px] text-gray-800 leading-relaxed">{msg.content}</div>
                  </div>
                  <div className="absolute right-0 -top-3 opacity-0 group-hover:opacity-100 transition-all duration-150 bg-white border border-[#E5E7EB] rounded-lg shadow-sm flex items-center gap-1 px-1 py-1 z-10">
                    <button title="Reply" className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><MessageSquare size={15} /></button>
                    <button title="React" className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><SmilePlus size={15} /></button>
                    <button title="More" className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><MoreHorizontal size={15} /></button>
                  </div>
                </div>
              );
            })}
          </>
        ) : selectedChannelId === '' ? (
          /* Inbox — empty state */
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Inbox size={44} className="text-gray-300 mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-gray-400">Your inbox is empty for now.</p>
          </div>
        ) : (
          /* No channel selected */
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <Hash size={32} className="text-gray-300" strokeWidth={1.5} />
            <p className="text-[14px] text-gray-400">Select a channel to start chatting</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 relative">
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

                <button
                  onClick={() => { setEmojiPickerOpen(v => !v); setMentionDropdownOpen(false); }}
                  className={`p-1.5 rounded ${emojiPickerOpen ? 'bg-[#ede8f7] text-[#4d298c]' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <Smile size={18} />
                </button>

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

        {emojiPickerOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setEmojiPickerOpen(false)} />
            <div className="absolute bottom-full left-0 mb-2 w-[320px] max-h-[400px] overflow-y-auto bg-white border border-[#E5E7EB] rounded-xl shadow-xl z-50 p-3">
              <div className="grid grid-cols-8 gap-0.5">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-2xl p-2 hover:bg-[#ede8f7] rounded-lg leading-none flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => setDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-80 border border-[#E5E7EB] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
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
          </div>
        </div>
      )}

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
