import { Hash, Users, Search, MoreHorizontal, Settings, Smile, Paperclip, AtSign, Send, Mic, Square, Inbox, MessageSquare, SmilePlus, X, Download, FileText, Pin } from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  highlightedMessageId: string | null;
  onClearHighlight: () => void;
  onTaskDetected?: (task: { assigneeName: string; taskTitle: string; detectedAt: Date }) => void;
}

type DbMessage = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  reply_count: number;
  thread_id: string | null;
  file_url: string | null;
  file_name: string | null;
  is_pinned: boolean | null;
};

const EMOJIS = [
  '😀','😂','😍','🥰','😎','🤔','😢','😤','🤯','🥳','😅','🤣',
  '👍','👎','👏','🙌','🤝','🙏','✌️','💪','🤞','👌','🫡','🫶',
  '❤️','🧡','💛','💚','💙','💜','🖤','💔','💯','✅','🔥','⭐',
  '🎉','🚀','💡','🎯','🏆','🎨','👀','💬','📌','🗓️','📎','🔗',
];

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '👀', '🎉'];

function fileTypeIcon(name: string): { bg: string; icon: React.ReactNode } {
  if (/\.pdf$/i.test(name))   return { bg: 'bg-red-50',    icon: <FileText size={18} className="text-red-500" /> };
  if (/\.docx?$/i.test(name)) return { bg: 'bg-blue-50',   icon: <FileText size={18} className="text-blue-500" /> };
  if (/\.txt$/i.test(name))   return { bg: 'bg-gray-100',  icon: <FileText size={18} className="text-gray-500" /> };
  return                             { bg: 'bg-[#f5f0ff]', icon: <Paperclip size={18} className="text-[#4d298c]" /> };
}

function renderMessageContent(content: string): React.ReactNode {
  const parts = content.split(/(@[A-Za-z0-9]+(?:\s[A-Za-z0-9]+)*)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="text-[#4d298c] font-semibold bg-[#ede8f7] px-1 rounded">{part}</span>
    ) : part
  );
}

type SentMessage =
  | { kind: 'text';  text: string;     time: string }
  | { kind: 'voice'; duration: string; time: string; transcriptOpen: boolean };

type DmMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
};

export function ChatArea({
  selectedDM, selectedChannelId,
  onSelectChannel, onChannelsChanged, onToggleMute, mutedChannelIds,
  highlightedMessageId, onClearHighlight, onTaskDetected,
}: ChatAreaProps) {
  const { session } = useAuth();
  const [isSearchOpen,        setIsSearchOpen]        = useState(false);
  const [messageInput,        setMessageInput]        = useState('');
  const [sentMessages,        setSentMessages]        = useState<SentMessage[]>([]);
  const [isRecording,         setIsRecording]         = useState(false);
  const [dmMessages,          setDmMessages]          = useState<DmMessage[]>([]);
  const [dbMessages,          setDbMessages]          = useState<DbMessage[]>([]);
  const [senderProfiles,      setSenderProfiles]      = useState<Record<string, { full_name: string | null; avatar_url: string | null }>>({});
  const [settingsOpen,        setSettingsOpen]        = useState(false);
  const [channelName,         setChannelName]         = useState('');
  const [renameInput,         setRenameInput]         = useState('');
  const [renameSaving,        setRenameSaving]        = useState(false);
  const [deleteConfirm,       setDeleteConfirm]       = useState(false);
  const [emojiPickerOpen,     setEmojiPickerOpen]     = useState(false);
  const [mentionDropdownOpen, setMentionDropdownOpen] = useState(false);
  const [threadMsg,           setThreadMsg]           = useState<DbMessage | null>(null);
  const [threadReplies,       setThreadReplies]       = useState<DbMessage[]>([]);
  const [moreMenuMsgId,       setMoreMenuMsgId]       = useState<string | null>(null);
  const [reactPickerMsgId,    setReactPickerMsgId]    = useState<string | null>(null);
  const [reactPickerPos,      setReactPickerPos]      = useState<{ top: number; left: number } | null>(null);
  const [reactions,           setReactions]           = useState<Record<string, { emoji: string; count: number }[]>>({});
  const [threadReplyInput,    setThreadReplyInput]    = useState('');
  const [attachedFile,        setAttachedFile]        = useState<File | null>(null);
  const [lightboxUrl,         setLightboxUrl]         = useState<string | null>(null);
  const [lightboxName,        setLightboxName]        = useState<string | null>(null);
  const [membersOpen,         setMembersOpen]         = useState(false);
  const [members,             setMembers]             = useState<{ id: string; full_name: string | null; avatar_url: string | null; role: string }[]>([]);
  const [copyLinkDone,        setCopyLinkDone]        = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const threadInputRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const reactBtnRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!highlightedMessageId) return;
    const el = msgRefs.current[highlightedMessageId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => onClearHighlight(), 2500);
    return () => clearTimeout(timer);
  }, [highlightedMessageId]);

  const fetchDMMessages = useCallback(async (partnerId: string) => {
    const myId = session?.user?.id;
    if (!myId) return;
    const { data } = await supabase
      .from('direct_messages')
      .select('id, sender_id, receiver_id, content, file_url, file_name, created_at')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true });
    setDmMessages(data ?? []);
    // Populate senderProfiles for both sides
    const ids = [myId, partnerId];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', ids);
    const map: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    for (const p of (profiles ?? [])) map[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
    setSenderProfiles(prev => ({ ...prev, ...map }));
  }, [session]);

  const fetchMessages = useCallback(async () => {
    if (!selectedChannelId) return;
    const { data } = await supabase
      .from('messages')
      .select('id, content, user_id, created_at, reply_count, thread_id, file_url, file_name, is_pinned')
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
    setAttachedFile(null);
    setMessageInput('');
    setEmojiPickerOpen(false);
    setMentionDropdownOpen(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    fetchMessages();

    if (!selectedChannelId) return;

    const channel = supabase
      .channel(`messages:${selectedChannelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${selectedChannelId}` },
        async (payload) => {
          const newMsg = payload.new as DbMessage;
          // Fetch sender profile if not already cached
          setSenderProfiles(prev => {
            if (prev[newMsg.user_id]) return prev;
            supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', newMsg.user_id)
              .single()
              .then(({ data }) => {
                if (data) setSenderProfiles(p => ({ ...p, [data.id]: { full_name: data.full_name, avatar_url: data.avatar_url } }));
              });
            return prev;
          });
          setDbMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `channel_id=eq.${selectedChannelId}` },
        (payload) => {
          const updated = payload.new as DbMessage;
          setDbMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChannelId, fetchMessages]);

  // DM loading + realtime
  useEffect(() => {
    setDmMessages([]);
    setMessageInput('');
    setAttachedFile(null);
    setEmojiPickerOpen(false);
    setMentionDropdownOpen(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    if (!selectedDM || !session?.user) return;

    fetchDMMessages(selectedDM.userId);

    const myId = session.user.id;
    const partnerId = selectedDM.userId;
    const sub = supabase
      .channel(`dm:${[myId, partnerId].sort().join('-')}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        (payload) => {
          const msg = payload.new as DmMessage;
          // Only messages between this pair
          const relevant =
            (msg.sender_id === partnerId && msg.receiver_id === myId) ||
            (msg.sender_id === myId && msg.receiver_id === partnerId);
          if (!relevant) return;
          // Sender already added the message locally in handleSend — skip to avoid duplicate
          if (msg.sender_id === myId) return;
          setDmMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [selectedDM, session, fetchDMMessages]);

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setLightboxUrl(null); setLightboxName(null); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dbMessages, dmMessages]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (attachedFile && /\.(jpe?g|png|gif|webp)$/i.test(attachedFile.name)) {
      const url = URL.createObjectURL(attachedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [attachedFile]);

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
    const hasText = messageInput.trim().length > 0;
    const hasFile = attachedFile !== null;
    if (!hasText && !hasFile) return;

    if (selectedDM) {
      if (!session) return;
      const text = messageInput.trim();
      setMessageInput('');
      setAttachedFile(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      const { data } = await supabase.from('direct_messages').insert({
        sender_id: session.user.id,
        receiver_id: selectedDM.userId,
        content: text,
      }).select('id, sender_id, receiver_id, content, file_url, file_name, created_at').single();
      if (data) setDmMessages(prev => [...prev, data]);
      await supabase.from('notifications').insert({
        user_id: selectedDM.userId,
        from_user_id: session.user.id,
        type: 'dm',
        message: 'sent you a direct message',
        channel_id: null,
        read: false,
      });
      return;
    }

    if (!selectedChannelId || !session) return;

    const text = messageInput.trim();
    setMessageInput('');
    setAttachedFile(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    let file_url: string | null = null;
    let file_name: string | null = null;

    if (attachedFile) {
      const path = `${session.user.id}/${Date.now()}-${attachedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('attachment')
        .upload(path, attachedFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('attachment').getPublicUrl(path);
        file_url = urlData.publicUrl;
        file_name = attachedFile.name;
      }
    }

    const { data: insertedMsg } = await supabase.from('messages').insert({
      channel_id: selectedChannelId,
      user_id: session.user.id,
      content: text,
      ...(file_url ? { file_url, file_name } : {}),
    }).select('id, created_at').single();

    // @mention detection
    if (text) {
      const mentionRegex = /@([A-Za-z0-9 ]+)/g;
      let match;
      while ((match = mentionRegex.exec(text)) !== null) {
        const mentionedName = match[1].trim();
        const mentionedMember = members.find(
          m => m.full_name?.toLowerCase() === mentionedName.toLowerCase()
        );
        if (mentionedMember && mentionedMember.id !== session.user.id) {
          await supabase.from('notifications').insert({
            user_id: mentionedMember.id,
            from_user_id: session.user.id,
            type: 'mention',
            message: `mentioned you in #${channelName}`,
            channel_id: selectedChannelId,
            read: false,
          });
        }
      }
    }

    // Background Gemini task detection — never blocks message send
    if (text.includes('@') && insertedMsg) {
      const { data: channelRow } = await supabase.from('channels').select('ai_enabled').eq('id', selectedChannelId).single();
      if (channelRow?.ai_enabled !== false) {
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const msgId = insertedMsg.id;
      const msgTime = insertedMsg.created_at;
      const senderName = members.find(m => m.id === session.user.id)?.full_name ?? null;
      const capturedChannelId = selectedChannelId;
      const capturedChannelName = channelName;
      const capturedMembers = [...members];
      const capturedUserId = session.user.id;
      const sourceFiles = file_url && file_name ? [{ url: file_url, name: file_name }] : null;

      (async () => {
        try {
          const prompt = `Does this message assign a task? Message: ${text}\nReply only JSON: {hasTask:true,taskTitle:'max 8 words',assigneeName:'name after @',dueDate:'date or null'} or {hasTask:false}`;
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            }
          );
          const data = await res.json();
          const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (!jsonMatch) return;
          const parsed = JSON.parse(jsonMatch[0]);
          if (!parsed.hasTask) return;
          const assignee = capturedMembers.find(
            m => m.full_name?.toLowerCase() === (parsed.assigneeName ?? '').toLowerCase()
          );
          if (!assignee || assignee.id === capturedUserId) return;
          await supabase.from('tasks').insert({
            title: parsed.taskTitle,
            assigned_to: assignee.id,
            assigned_by: capturedUserId,
            due_date: parsed.dueDate ?? null,
            status: 'pending',
            source_message_id: msgId,
            source_channel_id: capturedChannelId,
            source_channel_name: capturedChannelName,
            source_message_content: text,
            source_message_time: msgTime,
            source_sender_name: senderName,
            source_files: sourceFiles,
          });
        } catch {
          // silently ignore — background task detection must never affect message send
        }
      })();
      } // end ai_enabled check
    }

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
      .select('id, content, user_id, created_at, reply_count, thread_id, file_url, file_name')
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

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handlePinMessage = async (msgId: string, pin: boolean) => {
    await supabase.from('messages').update({ is_pinned: pin }).eq('id', msgId);
    setDbMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_pinned: pin } : m));
    setMoreMenuMsgId(null);
  };

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
              {selectedDM.avatarUrl ? (
                <img src={selectedDM.avatarUrl} alt={selectedDM.fullName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4d298c] to-purple-400 flex items-center justify-center">
                  <span className="text-white text-[11px] font-bold">
                    {selectedDM.fullName.trim().split(/\s+/).length >= 2
                      ? (selectedDM.fullName.trim().split(/\s+/)[0][0] + selectedDM.fullName.trim().split(/\s+/).slice(-1)[0][0]).toUpperCase()
                      : selectedDM.fullName.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
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

      {/* Pinned message banner */}
      {(() => { const pinned = dbMessages.find(m => m.is_pinned); return pinned ? (
        <div className="bg-[#f5f0ff] border-b border-[#d8c9f7] px-4 py-2 flex items-center gap-2">
          <Pin size={14} className="text-[#4d298c] flex-shrink-0" />
          <span className="text-[13px] text-[#4d298c] flex-1 truncate">
            Pinned: {pinned.content.slice(0, 60)}{pinned.content.length > 60 ? '…' : ''}
          </span>
          <button onClick={() => handlePinMessage(pinned.id, false)} className="text-[#7c5cbf] hover:text-[#4d298c] flex-shrink-0 transition-colors">
            <X size={14} />
          </button>
        </div>
      ) : null; })()}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 pt-6 pb-4">
        {selectedDM ? (
          /* DM messages — real from direct_messages table */
          <>
            {dmMessages.length === 0 && (
              <p className="text-center text-[13px] text-gray-400 mt-8">
                Start a conversation with {selectedDM.fullName}
              </p>
            )}
            {dmMessages.map((msg, idx) => {
              const isMe = msg.sender_id === session?.user?.id;
              const prev = dmMessages[idx - 1];
              const isGrouped = prev && prev.sender_id === msg.sender_id;
              const dmKey = msg.id;
              const p = senderProfiles[msg.sender_id];
              const name = isMe
                ? (p?.full_name ?? 'You')
                : selectedDM.fullName;
              const avatarUrl = isMe ? p?.avatar_url : selectedDM.avatarUrl;
              const initials = name.trim().split(/\s+/).length >= 2
                ? (name.trim().split(/\s+/)[0][0] + name.trim().split(/\s+/).slice(-1)[0][0]).toUpperCase()
                : name.slice(0, 2).toUpperCase();
              return (
                <div key={msg.id} className={`flex gap-3 relative group [&:hover_.toolbar]:opacity-100 px-4 py-1 hover:bg-[#f9fafb] transition-all duration-150${!isGrouped ? ' mt-3' : ''}`}>
                  {isGrouped ? (
                    <div className="w-8 flex-shrink-0" />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4d298c] to-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-[11px] font-bold">{initials}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {!isGrouped && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-semibold text-[14px] text-gray-900">{name}</span>
                        <span className="text-[12px] text-gray-400">{formatTime(msg.created_at)}</span>
                      </div>
                    )}
                    {msg.content && <div className="text-[14px] text-gray-800 leading-relaxed">{renderMessageContent(msg.content)}</div>}
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
                    <button title="Reply" onClick={() => { setMessageInput(`@${name} `); textareaRef.current?.focus(); }} className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><MessageSquare size={15} /></button>
                    <button ref={el => { reactBtnRefs.current[dmKey] = el; }} title="React" onClick={() => { if (reactPickerMsgId === dmKey) { setReactPickerMsgId(null); setReactPickerPos(null); } else { const rect = reactBtnRefs.current[dmKey]?.getBoundingClientRect(); setReactPickerPos(rect ? { top: rect.top - 48, left: rect.left } : null); setReactPickerMsgId(dmKey); } }} className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><SmilePlus size={15} /></button>
                    <div className="relative">
                      <button title="More" onClick={() => setMoreMenuMsgId(moreMenuMsgId === dmKey ? null : dmKey)} className="text-gray-400 hover:text-[#4d298c] hover:bg-[#f5f0ff] rounded px-1.5 py-1 transition-all duration-150"><MoreHorizontal size={15} /></button>
                      {moreMenuMsgId === dmKey && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1 w-44 z-20">
                          <button onClick={() => { navigator.clipboard.writeText(msg.content); setMoreMenuMsgId(null); }} className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">Copy text</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
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
                <div
                  key={msg.id}
                  ref={el => { msgRefs.current[msg.id] = el; }}
                  className={`flex gap-3 relative group [&:hover_.toolbar]:opacity-100 px-4 py-1 transition-all duration-150${!isGrouped ? ' mt-3' : ''} ${highlightedMessageId === msg.id ? 'bg-[#f5f0ff]' : 'hover:bg-[#f9fafb]'}`}
                >
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
                    {msg.content && <div className="text-[14px] text-gray-800 leading-relaxed">{renderMessageContent(msg.content)}</div>}
                    {msg.file_url && msg.file_name && (
                      /\.(jpe?g|png|gif|webp)$/i.test(msg.file_name)
                        ? <img src={msg.file_url} alt={msg.file_name} onClick={() => { setLightboxUrl(msg.file_url); setLightboxName(msg.file_name); }} className="mt-1.5 max-w-[300px] rounded-lg border border-[#E5E7EB] cursor-zoom-in" />
                        : (() => { const ft = fileTypeIcon(msg.file_name!); return (
                          <div className="mt-1.5 bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 inline-flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${ft.bg}`}>{ft.icon}</div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-medium text-gray-900 truncate max-w-[180px]">{msg.file_name}</div>
                              <a href={msg.file_url!} download={msg.file_name} target="_blank" rel="noreferrer" className="text-[12px] text-[#4d298c] hover:underline flex items-center gap-0.5 mt-0.5"><Download size={11} />Download</a>
                            </div>
                          </div>
                        ); })()
                    )}
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
                          <button onClick={() => handlePinMessage(msg.id, !msg.is_pinned)} className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">{msg.is_pinned ? 'Unpin message' : 'Pin message'}</button>
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
            <div ref={messagesEndRef} />
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
              {previewUrl ? (
                /* Image preview */
                <div className="flex items-center gap-2 bg-[#f5f0ff] border border-[#d8c9f7] rounded-lg p-1.5 pr-3">
                  <img src={previewUrl} alt={attachedFile.name} className="w-[60px] h-[60px] rounded-lg object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[13px] text-[#4d298c] truncate max-w-[180px]">{attachedFile.name}</div>
                    <div className="text-[12px] text-[#7c5cbf]">
                      {attachedFile.size < 1024
                        ? `${attachedFile.size} B`
                        : attachedFile.size < 1024 * 1024
                          ? `${Math.round(attachedFile.size / 1024)} KB`
                          : `${(attachedFile.size / (1024 * 1024)).toFixed(1)} MB`}
                    </div>
                  </div>
                </div>
              ) : (
                /* Non-image file card */
                (() => { const ft = fileTypeIcon(attachedFile.name); return (
                  <div className="bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 flex items-center gap-3 max-w-[280px]">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${ft.bg}`}>{ft.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-gray-900 truncate">{attachedFile.name}</div>
                      <div className="text-[11px] text-gray-400">
                        {attachedFile.size < 1024
                          ? `${attachedFile.size} B`
                          : attachedFile.size < 1024 * 1024
                            ? `${Math.round(attachedFile.size / 1024)} KB`
                            : `${(attachedFile.size / (1024 * 1024)).toFixed(1)} MB`}
                      </div>
                    </div>
                  </div>
                ); })()
              )}
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
                        {members.filter(m => m.id !== session?.user?.id && m.full_name).map(m => (
                          <button
                            key={m.id}
                            onClick={() => handleMentionSelect(m.full_name!)}
                            className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-purple-50 hover:text-[#4d298c]"
                          >
                            @{m.full_name}
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

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelectChannel={(id) => { onSelectChannel(id); setIsSearchOpen(false); }} />
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
                <div className="text-[14px] text-gray-800 leading-relaxed">{renderMessageContent(threadMsg.content)}</div>
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
                      <div className="text-[14px] text-gray-800 leading-relaxed">{renderMessageContent(reply.content)}</div>
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
              if (threadMsg.user_id !== session.user.id) {
                await supabase.from('notifications').insert({
                  user_id: threadMsg.user_id,
                  from_user_id: session.user.id,
                  type: 'reply',
                  message: `replied to your message in #${channelName}`,
                  channel_id: selectedChannelId,
                  read: false,
                });
              }
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

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => { setLightboxUrl(null); setLightboxName(null); }}>
          <div className="absolute top-4 right-4 flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <a href={lightboxUrl} download={lightboxName ?? undefined} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[13px] rounded-lg transition-colors">
              <Download size={14} />Download
            </a>
            <button onClick={() => { setLightboxUrl(null); setLightboxName(null); }} className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
          <img src={lightboxUrl} alt={lightboxName ?? ''} onClick={e => e.stopPropagation()} className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}
