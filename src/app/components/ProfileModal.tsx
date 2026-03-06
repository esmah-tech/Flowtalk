import React from 'react';
import { X, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export function ProfileModal({
  initialName,
  initialAvatar,
  email,
  onClose,
  onSaved,
}: {
  initialName: string | null;
  initialAvatar: string | null;
  email: string;
  onClose: () => void;
  onSaved: (name: string | null, avatarUrl: string | null) => void;
}) {
  const { session } = useAuth();
  const [nameInput, setNameInput] = React.useState(initialName ?? '');
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(initialAvatar);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const initials = (() => {
    const n = initialName ?? email;
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return n.slice(0, 2).toUpperCase();
  })();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setUploading(true);

    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${session.user.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarPreview(publicUrl);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id);
      onSaved(nameInput || null, publicUrl);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    const trimmed = nameInput.trim();
    await supabase.from('profiles').update({ full_name: trimmed || null }).eq('id', session.user.id);
    onSaved(trimmed || null, avatarPreview);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-[400px]" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-all duration-150"
        >
          <X size={18} />
        </button>

        <h2 className="text-[16px] font-extrabold text-[#111827] mb-5">Edit profile</h2>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-5">
          <div
            className="relative w-20 h-20 rounded-full cursor-pointer group"
            onClick={() => fileRef.current?.click()}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#4d298c] to-purple-400 flex items-center justify-center">
                <span className="text-white text-[22px] font-bold">{initials}</span>
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center justify-center">
              {uploading
                ? <span className="text-white text-[11px]">…</span>
                : <Camera size={20} className="text-white" />
              }
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          <div className="mt-3 text-[16px] font-bold text-[#111827]">
            {initialName || email.split('@')[0]}
          </div>
          <div className="text-[13px] text-gray-400">{email}</div>
        </div>

        {/* Name field */}
        <div className="mb-5">
          <label className="text-[12px] font-semibold text-gray-500 block mb-1.5">Display name</label>
          <input
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder={email.split('@')[0]}
            className="border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] w-full outline-none focus:border-[#4d298c] transition-colors"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="w-full py-2.5 bg-[#4d298c] text-white text-[13px] font-semibold rounded-lg hover:bg-[#3d1f70] transition-all duration-150 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
