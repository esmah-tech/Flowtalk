import React, { useState } from 'react';
import { LeftRail } from './components/LeftRail';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { RightPanel } from './components/RightPanel';

export type DMProfile = {
  id: string;
  name: string;
  fullName: string;
  role: string;
  online: boolean;
  gradient: string;
  sharedFiles: number;
  messages: Array<{ from: 'me' | 'them'; text: string; time: string }>;
};

const DM_PROFILES: DMProfile[] = [
  {
    id: 'daniel', name: 'Daniel A.', fullName: 'Daniel Anderson',
    role: 'Frontend Dev', online: true, gradient: 'from-blue-400 to-cyan-400',
    sharedFiles: 7,
    messages: [
      { from: 'me',   text: 'Hey Daniel, do you have a moment to review the latest component changes?', time: '10:41' },
      { from: 'them', text: 'Sure! Just finishing up a PR. Give me 5 mins.', time: '10:43' },
      { from: 'me',   text: 'No rush. Check the Button and Input components — I updated the focus states.', time: '10:44' },
      { from: 'them', text: 'Nice, the focus ring looks much cleaner now 👌 One question — did we decide on the border-radius?', time: '10:49' },
      { from: 'me',   text: 'Going with 6px across the board. Same as the design system tokens.', time: '10:51' },
    ],
  },
  {
    id: 'emily', name: 'Emily D.', fullName: 'Emily Davis',
    role: 'UX Designer', online: false, gradient: 'from-purple-400 to-pink-400',
    sharedFiles: 12,
    messages: [
      { from: 'them', text: 'Hey! Saw your comment on the Figma file.', time: '9:15' },
      { from: 'me',   text: 'Yeah, I had a question about the hover states on the cards.', time: '9:17' },
      { from: 'them', text: 'Those are intentional — the elevation changes on hover to give a tactile feel.', time: '9:18' },
      { from: 'me',   text: 'Got it. Should I match that in code with a box-shadow transition?', time: '9:20' },
      { from: 'them', text: 'Exactly. Something like shadow-sm → shadow-md with a 150ms ease.', time: '9:22' },
    ],
  },
];

export default function App() {
  const [selectedDMId, setSelectedDMId] = useState<string | null>(null);
  const selectedDM = DM_PROFILES.find(p => p.id === selectedDMId) ?? null;

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      <LeftRail />
      <Sidebar
        selectedDMId={selectedDMId}
        onSelectDM={setSelectedDMId}
        onClearDM={() => setSelectedDMId(null)}
      />
      <ChatArea selectedDM={selectedDM} />
      <RightPanel selectedDM={selectedDM} />
    </div>
  );
}
