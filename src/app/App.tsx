import React, { useState } from 'react';
import { LeftRail } from './components/LeftRail';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { RightPanel } from './components/RightPanel';

export type DMProfile = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  online: boolean;
};

export default function App() {
  const [selectedDM, setSelectedDM] = useState<DMProfile | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [channelReloadTick, setChannelReloadTick] = useState(0);
  const [mutedChannelIds, setMutedChannelIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('flowtalk_muted_channels');
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const handleChannelsChanged = () => setChannelReloadTick(v => v + 1);
  const handleToggleMute = (id: string) => setMutedChannelIds(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    localStorage.setItem('flowtalk_muted_channels', JSON.stringify([...n]));
    return n;
  });

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      <LeftRail />
      <Sidebar
        selectedDMUserId={selectedDM?.userId ?? null}
        onSelectDM={setSelectedDM}
        onClearDM={() => setSelectedDM(null)}
        selectedChannelId={selectedChannelId}
        onSelectChannel={setSelectedChannelId}
        reloadTrigger={channelReloadTick}
        mutedChannelIds={mutedChannelIds}
      />
      <ChatArea
        selectedDM={selectedDM}
        selectedChannelId={selectedChannelId}
        onSelectChannel={setSelectedChannelId}
        onChannelsChanged={handleChannelsChanged}
        onToggleMute={handleToggleMute}
        mutedChannelIds={mutedChannelIds}
      />
      <RightPanel selectedDM={selectedDM} />
    </div>
  );
}
