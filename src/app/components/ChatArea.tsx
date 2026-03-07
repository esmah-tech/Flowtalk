import { Hash, Users, Search, MoreHorizontal, Settings, Smile, Paperclip, AtSign, Send, Mic, Square, Inbox, MessageSquare, SmilePlus, X } from 'lucide-react';
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
  reply_count: number;
  thread_id: string | null;
};

const EMOJIS = [
  '😀','😂','😍','🥰','😎','🤔','😢','😤','🤯','🥳','😅','🤣',
  '👍','👎','👏','🙌','🤝','🙏','✌️','💪','🤞','👌','🫡','🫶',
  '❤️','🧡','💛','💚','💙','💜','🖤','💔','💯','✅','🔥','⭐',
  '🎉','🚀','💡','🎯','🏆','🎨','👀','💬','📌','🗓️','📎','🔗',
];
const MENTION_MEMBERS = ['Daniel A.', 'Emily D.', 'Sophia Wilson', 'Diana T.'];
const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '👀', '🎉'];

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
  const [threadMsg,           setThreadMsg]           = useState<DbMessage | null>(null);
  const [threadReplies,       setThreadReplies]       = useState<DbMessage[]>([]);
  const [moreMenuMsgId,       setMoreMenuMsgId]       = useState<string | null>(null);
  const [reactPickerMsgId,    setReactPickerMsgId]    = useState<string | null>(null);
  const [reactPickerPos,      setReactPickerPos]      = useState<{ top: number; left: number } | null>(null);
  const [reactions,           setReactions]           = useState<Record<string, { emoji: string; count: number }[]>>({});
  const [threadReplyInput,    setThreadReplyInput]    = useState('');
  const [attachedFile,        setAttachedFile]        = useState<File | null>(null);
  const [membersOpen,         setMembersOpen]         = useState(false);
  const [members,             setMembers]             = useState<{ id: string; full_name: string | null; avatar_url: string | null; role: string }[]>([]);
  const [copyLinkDone,        setCopyLinkDone]        = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const threadInputRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const reactBtnRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  const fetchMessages = useCallback(async () => {
    if (!selectedChannelId) return;
    const { data } = await supabase
      .from('messages')
      .select('id, content, user_id, created_at, reply_count, thread_id')
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

  const fetchReplies = useCallback(async (msgId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('id, content, user_id, created_at, reply_count, thread_id')
      .eq('thread_id', msgId)
      .order('created_at', { ascending: true });
    const replies = data ?? [];
    setThreadReplies(replies);
    const uniqueIds = [...new Set(replies.map(m => m.user_id))];
    if (uniqueIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', uniqueIds);
      const map: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      for (const p of (profiles ?? [])) map[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
      setSenderProfiles(prev => ({ ...prev, ...map }));
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    const { data: wm } = await supabase.from('workspace_members').select('user_id, role');
    if (!wm?.length) { setMembers([]); return; }
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', wm.map(m => m.user_id));
    const map: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    for (const p of (profiles ?? [])) map[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
    setMembers(wm.map(m => ({ id: m.user_id, full_name: map[m.user_id]?.full_name ?? null, avatar_url: map[m.user_id]?.avatar_url ?? null, role: m.role })));
  }, []);

  const openThread = (msg: DbMessage) => {
    setThreadMsg(msg);
    setThreadReplyInput('');
    fetchReplies(msg.id);
  };

  const addReaction = (msgKey: string, emoji: string) => {
    setReactions(prev => {
      const existing = prev[msgKey] ?? [];
      const idx = existing.findIndex(r => r.emoji === emoji);
      if (idx >= 0) {
        const updated = [...existing];
        updated[idx] = { ...updated[idx], count: updated[idx].count + 1 };
        return { ...prev, [msgKey]: updated };
      }
      return { ...prev, [msgKey]: [...existing, { emoji, count: 1 }] };
    });
    setReactPickerMsgId(null);
    setReactPickerPos(null);
  };

  return (
    <div className="flex-1 flex min-h-0 min-w-0">
      <div className="flex flex-col min-h-0 bg-white flex-1 min-w-0">
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
          <button onClick={() => { setMembersOpen(v => !v); if (!membersOpen) fetchMembers(); }} className={`p-2 rounded transition-colors ${membersOpen ? 'bg-[#ede8f7] text-[#4d298c]' : 'hover:bg-gray-100 text-gray-600'}`}>
            <Users size={18} />
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
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopyLinkDone(true); setTimeout(() => setCopyLinkDone(false), 2000); }} className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">
                      {copyLinkDone ? 'Copied!' : 'Copy link'}
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
      <div className="flex-1 overflow-y-auto px-2 pt-6 pb-4">
        {selectedDM ? (
          /* DM messages — all left-aligned, grouped by sender */
          <>
            {selectedDM.messages.map((msg, i) => {
              const isMe = msg.from === 'me';
              const prev = selectedDM.messages[i - 1];
              const isGrouped = prev && prev.from === msg.from;
              const dmKey = `dm-${i}`;
              const senderName = isMe ? 'You' : selectedDM.name;
              return (
                <div key={i} className={`flex gap-3 relative group [&:hover_.toolbar]:opacity-100 px-4 py-1 hover:bg-[#f9fafb] transition-all duration-150${!isGrouped ? ' mt-3' : ''}`}>
                  {isGrouped ? (
                    <div className="w-9 flex-shrink-0" />
                  ) : isMe ? (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4d298c] to-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-[11px] font-bold">Me</span>
                    </div>
                  ) : (
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${selectedDM.gradient} flex-shrink-0 mt-0.5`} />
                  )}
                  <div className="flex-1 min-w-0">
                    {!isGrouped && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-semibold text-[14px] text-gray-900">{senderName}</span>
                        <span className="text-[12px] text-gray-400">{msg.time}</span>
                      </div>
                    )}
                    <div className="text-[14px] text-gray-800 leading-relaxed">{msg.text}</div>
                    {(reactions[dmKey] ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(reactions[dmKey] ?? []).map(r => (
                          <button key={r.emoji} onClick={() => addReaction(dmKey, r.emoji)} className="bg-[#f5f0ff] border border-[#d8c9f7] rounded-full px-2 py-0.5 text-[13px] flex items-center gap-1 hover:bg-[#ede8f7] transition-all duration-150">
                            <span>{r.emoji}</span><span className="text-[12px] text-[#4d298c] font-medium">{r.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`toolbar absolute right-2 -top-4 transition-all duration-150 bg-white border border-[#E5E7EB] rounded-lg shadow-sm flex items-center gap-1 p-1 z-20 ${moreMenuMsgId === dmKey || reactPickerMsgId === dmKey ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button title="Reply" onClick={() => { setMessageInput(`@${senderName} `); textareaRef.current?.focus(); }} className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><MessageSquare size={15} /></button>
                    <button ref={el => { reactBtnRefs.current[dmKey] = el; }} title="React" onClick={() => { if (reactPickerMsgId === dmKey) { setReactPickerMsgId(null); setReactPickerPos(null); } else { const rect = reactBtnRefs.current[dmKey]?.getBoundingClientRect(); setReactPickerPos(rect ? { top: rect.top - 48, left: rect.left } : null); setReactPickerMsgId(dmKey); } }} className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><SmilePlus size={15} /></button>
                    <div className="relative">
                      <button title="More" onClick={() => setMoreMenuMsgId(moreMenuMsgId === dmKey ? null : dmKey)} className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><MoreHorizontal size={15} /></button>
                      {moreMenuMsgId === dmKey && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1 w-44 z-20">
                          <button onClick={() => { console.log('Reply in thread on DM', i); setMoreMenuMsgId(null); }} className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">Reply in thread</button>
                          <button onClick={() => { navigator.clipboard.writeText(msg.text); setMoreMenuMsgId(null); }} className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">Copy text</button>
                          <div className="my-1 border-t border-[#E5E7EB]" />
                          <button onClick={() => { console.log('Delete DM message', i); setMoreMenuMsgId(null); }} className="w-full text-left px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {sentMessages.map((msg, i) => {
              const lastDm = selectedDM.messages[selectedDM.messages.length - 1];
              const isGrouped = i > 0 || lastDm?.from === 'me';
              const sentKey = `sent-${i}`;
              const msgText = msg.kind === 'text' ? msg.text : `Voice note · ${msg.duration}`;
              return (
                <div key={sentKey} className={`flex gap-3 relative group [&:hover_.toolbar]:opacity-100 px-4 py-1 hover:bg-[#f9fafb] transition-all duration-150${!isGrouped ? ' mt-3' : ''}`}>
                  {isGrouped ? (
                    <div className="w-9 flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4d298c] to-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-[11px] font-bold">Me</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {!isGrouped && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-semibold text-[14px] text-gray-900">You</span>
                        <span className="text-[12px] text-gray-400">{msg.time}</span>
                      </div>
                    )}
                    {msg.kind === 'text' ? (
                      <div className="text-[14px] text-gray-800 leading-relaxed">{msg.text}</div>
                    ) : (
                      <div className="text-[14px] text-gray-800">
                        <div className="flex items-center gap-2">
                          <span>🎤</span>
                          <span>Voice note · {msg.duration}</span>
                        </div>
                        <button onClick={() => toggleTranscript(i)} className="text-[#4d298c] text-[12px] mt-1 hover:underline block">
                          {msg.transcriptOpen ? 'Hide transcript' : 'View transcript'}
                        </button>
                        {msg.transcriptOpen && (
                          <div className="mt-2 text-[12px] text-gray-500 border-t border-gray-200 pt-2 leading-relaxed">
                            AI transcript will appear here after Supabase + Whisper integration
                          </div>
                        )}
                      </div>
                    )}
                    {(reactions[sentKey] ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(reactions[sentKey] ?? []).map(r => (
                          <button key={r.emoji} onClick={() => addReaction(sentKey, r.emoji)} className="bg-[#f5f0ff] border border-[#d8c9f7] rounded-full px-2 py-0.5 text-[13px] flex items-center gap-1 hover:bg-[#ede8f7] transition-all duration-150">
                            <span>{r.emoji}</span><span className="text-[12px] text-[#4d298c] font-medium">{r.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`toolbar absolute right-2 -top-4 transition-all duration-150 bg-white border border-[#E5E7EB] rounded-lg shadow-sm flex items-center gap-1 p-1 z-20 ${moreMenuMsgId === sentKey || reactPickerMsgId === sentKey ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button title="Reply" onClick={() => { setMessageInput('@You '); textareaRef.current?.focus(); }} className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><MessageSquare size={15} /></button>
                    <button ref={el => { reactBtnRefs.current[sentKey] = el; }} title="React" onClick={() => { if (reactPickerMsgId === sentKey) { setReactPickerMsgId(null); setReactPickerPos(null); } else { const rect = reactBtnRefs.current[sentKey]?.getBoundingClientRect(); setReactPickerPos(rect ? { top: rect.top - 48, left: rect.left } : null); setReactPickerMsgId(sentKey); } }} className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><SmilePlus size={15} /></button>
                    <div className="relative">
                      <button title="More" onClick={() => setMoreMenuMsgId(moreMenuMsgId === sentKey ? null : sentKey)} className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><MoreHorizontal size={15} /></button>
                      {moreMenuMsgId === sentKey && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1 w-44 z-20">
                          <button onClick={() => { console.log('Reply in thread on sent DM', i); setMoreMenuMsgId(null); }} className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">Reply in thread</button>
                          <button onClick={() => { navigator.clipboard.writeText(msgText); setMoreMenuMsgId(null); }} className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">Copy text</button>
                          <div className="my-1 border-t border-[#E5E7EB]" />
                          <button onClick={() => { console.log('Delete sent DM', i); setMoreMenuMsgId(null); }} className="w-full text-left px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        ) : selectedChannelId ? (
          /* Channel messages — Slack-style, all left-aligned, grouped by sender */
          <>
            <div className="flex items-center gap-3 my-1 px-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] font-medium text-gray-400 px-1">Today</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            {dbMessages.length === 0 && (
              <p className="text-center text-[13px] text-gray-400 mt-8">No messages yet. Be the first to say something!</p>
            )}
            {dbMessages.map((msg, idx) => {
              const prev = dbMessages[idx - 1];
              const isGrouped = prev && prev.user_id === msg.user_id;
              const p = senderProfiles[msg.user_id];
              const name = p?.full_name ?? '';
              const initials = name
                ? name.trim().split(/\s+/).length >= 2
                  ? (name.trim().split(/\s+/)[0][0] + name.trim().split(/\s+/).slice(-1)[0][0]).toUpperCase()
                  : name.slice(0, 2).toUpperCase()
                : '?';
              return (
                <div key={msg.id} className={`flex gap-3 relative group [&:hover_.toolbar]:opacity-100 px-4 py-1 hover:bg-[#f9fafb] transition-all duration-150${!isGrouped ? ' mt-3' : ''}`}>
                  {isGrouped ? (
                    <div className="w-8 flex-shrink-0" />
                  ) : (
                    p?.avatar_url
                      ? <img src={p.avatar_url} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
                      : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4d298c] to-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-[11px] font-bold">{initials}</span>
                        </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {!isGrouped && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-semibold text-[14px] text-gray-900">{name || 'User'}</span>
                        <span className="text-[12px] text-gray-400">{formatTime(msg.created_at)}</span>
                      </div>
                    )}
                    <div className="text-[14px] text-gray-800 leading-relaxed">{msg.content}</div>
                    {msg.reply_count > 0 && (
                      <div className="text-[12px] text-[#4d298c] font-semibold cursor-pointer hover:underline mt-0.5" onClick={() => openThread(msg)}>
                        {msg.reply_count} {msg.reply_count === 1 ? 'reply' : 'replies'}
                      </div>
                    )}
                    {(reactions[msg.id] ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(reactions[msg.id] ?? []).map(r => (
                          <button key={r.emoji} onClick={() => addReaction(msg.id, r.emoji)} className="bg-[#f5f0ff] border border-[#d8c9f7] rounded-full px-2 py-0.5 text-[13px] flex items-center gap-1 hover:bg-[#ede8f7] transition-all duration-150">
                            <span>{r.emoji}</span><span className="text-[12px] text-[#4d298c] font-medium">{r.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`toolbar absolute right-2 -top-4 transition-all duration-150 bg-white border border-[#E5E7EB] rounded-lg shadow-sm flex items-center gap-1 p-1 z-20 ${moreMenuMsgId === msg.id || reactPickerMsgId === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button title="Reply" onClick={() => { setMessageInput(`@${name || 'User'} `); textareaRef.current?.focus(); }} className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><MessageSquare size={15} /></button>
                    <button ref={el => { reactBtnRefs.current[msg.id] = el; }} title="React" onClick={() => { if (reactPickerMsgId === msg.id) { setReactPickerMsgId(null); setReactPickerPos(null); } else { const rect = reactBtnRefs.current[msg.id]?.getBoundingClientRect(); setReactPickerPos(rect ? { top: rect.top - 48, left: rect.left } : null); setReactPickerMsgId(msg.id); } }} className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><SmilePlus size={15} /></button>
                    <div className="relative">
                      <button title="More" onClick={() => setMoreMenuMsgId(moreMenuMsgId === msg.id ? null : msg.id)} className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><MoreHorizontal size={15} /></button>
                      {moreMenuMsgId === msg.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1 w-44 z-20">
                          <button onClick={() => { openThread(msg); setMoreMenuMsgId(null); }} className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">Reply in thread</button>
                          <button onClick={() => { navigator.clipboard.writeText(msg.content); setMoreMenuMsgId(null); }} className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">Copy text</button>
                          <div className="my-1 border-t border-[#E5E7EB]" />
                          <button onClick={async () => { await supabase.from('messages').delete().eq('id', msg.id); setDbMessages(prev => prev.filter(m => m.id !== msg.id)); setMoreMenuMsgId(null); }} className="w-full text-left px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors">Delete</button>
                        </div>
                      )}
                    </div>
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
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.doc,.docx,.txt" className="hidden" onChange={e => { setAttachedFile(e.target.files?.[0] ?? null); e.target.value = ''; }} />
        <div className="border border-gray-300 rounded-lg focus-within:border-[#4d298c] focus-within:ring-2 focus-within:ring-purple-100">
          {attachedFile && (
            <div className="px-4 pt-3 flex items-center gap-2">
              <div className="flex items-center gap-2 bg-[#f5f0ff] border border-[#d8c9f7] rounded-lg px-3 py-1.5 text-[13px] text-[#4d298c] max-w-[240px]">
                <Paperclip size={13} className="flex-shrink-0" />
                <span className="truncate">{attachedFile.name}</span>
              </div>
              <button onClick={() => setAttachedFile(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}
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
                <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
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

      {(moreMenuMsgId !== null || reactPickerMsgId !== null) && (
        <div className="fixed inset-0 z-[19]" onClick={() => { setMoreMenuMsgId(null); setReactPickerMsgId(null); setReactPickerPos(null); }} />
      )}

      {reactPickerMsgId !== null && reactPickerPos !== null && (
        <div className="fixed z-20 bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-1 flex gap-0.5" style={{ top: reactPickerPos.top, left: reactPickerPos.left }}>
          {QUICK_EMOJIS.map(e => <button key={e} onClick={() => addReaction(reactPickerMsgId, e)} className="text-base p-1 hover:bg-[#f5f0ff] rounded transition-all duration-150">{e}</button>)}
        </div>
      )}

      {threadMsg && (
        <div className="w-[360px] border-l border-[#E5E7EB] bg-white flex flex-col h-full flex-shrink-0">
          {/* Thread header */}
          <div className="h-14 border-b border-[#E5E7EB] flex items-center justify-between px-4 flex-shrink-0">
            <span className="text-[15px] font-bold text-gray-900">Thread</span>
            <button onClick={() => { setThreadMsg(null); setThreadReplyInput(''); }} className="p-1.5 hover:bg-gray-100 rounded transition-all duration-150">
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Thread content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* Original message */}
            <div className="flex gap-3 mb-4">
              {(() => {
                const p = senderProfiles[threadMsg.user_id];
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
                    {senderProfiles[threadMsg.user_id]?.full_name || 'User'}
                  </span>
                  <span className="text-[12px] text-gray-500">{formatTime(threadMsg.created_at)}</span>
                </div>
                <div className="text-[14px] text-gray-800 leading-relaxed">{threadMsg.content}</div>
              </div>
            </div>

            {/* Replies divider */}
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[12px] text-gray-400">
                {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Reply messages */}
            <div className="space-y-4">
              {threadReplies.map(reply => {
                const p = senderProfiles[reply.user_id];
                const name = p?.full_name ?? '';
                const initials = name
                  ? name.trim().split(/\s+/).length >= 2
                    ? (name.trim().split(/\s+/)[0][0] + name.trim().split(/\s+/).slice(-1)[0][0]).toUpperCase()
                    : name.slice(0, 2).toUpperCase()
                  : '?';
                return (
                  <div key={reply.id} className="flex gap-3">
                    {p?.avatar_url
                      ? <img src={p.avatar_url} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4d298c] to-purple-400 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[11px] font-bold">{initials}</span>
                        </div>
                    }
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-[14px] text-gray-900">{name || 'User'}</span>
                        <span className="text-[12px] text-gray-500">{formatTime(reply.created_at)}</span>
                      </div>
                      <div className="text-[14px] text-gray-800 leading-relaxed">{reply.content}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Thread reply input */}
          {(() => {
            const sendReply = async () => {
              const text = threadReplyInput.trim();
              if (!text || !session || !threadMsg) return;
              setThreadReplyInput('');
              if (threadInputRef.current) threadInputRef.current.style.height = 'auto';
              await supabase.from('messages').insert({ channel_id: selectedChannelId, user_id: session.user.id, content: text, thread_id: threadMsg.id });
              await supabase.from('messages').update({ reply_count: threadMsg.reply_count + 1 }).eq('id', threadMsg.id);
              setThreadMsg(prev => prev ? { ...prev, reply_count: prev.reply_count + 1 } : prev);
              fetchReplies(threadMsg.id);
              fetchMessages();
            };
            return (
              <div className="border-t border-[#E5E7EB] p-3 flex-shrink-0">
                <textarea
                  ref={threadInputRef}
                  placeholder="Reply in thread..."
                  value={threadReplyInput}
                  onChange={e => {
                    setThreadReplyInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] resize-none outline-none focus:border-[#4d298c] min-h-[60px]"
                />
                <button
                  onClick={sendReply}
                  className="w-full mt-2 bg-[#4d298c] text-white rounded-lg px-3 py-1.5 text-[13px] font-medium hover:bg-[#3d1f70] transition-all duration-150"
                >
                  Send
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {membersOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMembersOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-[280px] bg-white border-l border-[#E5E7EB] z-50 flex flex-col shadow-xl">
            <div className="h-14 border-b border-[#E5E7EB] flex items-center justify-between px-4 flex-shrink-0">
              <span className="text-[15px] font-bold text-gray-900">Members</span>
              <button onClick={() => setMembersOpen(false)} className="p-1.5 hover:bg-gray-100 rounded transition-all duration-150">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {members.length === 0 ? (
                <p className="text-[13px] text-gray-400 text-center mt-8">No members found</p>
              ) : (
                members.map(m => {
                  const name = m.full_name ?? 'Unknown';
                  const initials = name.trim().split(/\s+/).length >= 2
                    ? (name.trim().split(/\s+/)[0][0] + name.trim().split(/\s+/).slice(-1)[0][0]).toUpperCase()
                    : name.slice(0, 2).toUpperCase();
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                      {m.avatar_url
                        ? <img src={m.avatar_url} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4d298c] to-purple-400 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[11px] font-bold">{initials}</span>
                          </div>
                      }
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-gray-900 truncate">{name}</div>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${m.role === 'admin' ? 'bg-[#ede8f7] text-[#4d298c]' : 'bg-gray-100 text-gray-500'}`}>
                        {m.role}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
