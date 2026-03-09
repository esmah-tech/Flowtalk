import React, { useState } from 'react';
import { Calendar, Plus, User, MoreHorizontal, Sparkles } from 'lucide-react';
import type { DMProfile } from '../App';

interface RightPanelProps {
  selectedDM: DMProfile | null;
}

export function RightPanel({ selectedDM }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState('ai');

  const tabs = [
    { id: 'ai', label: 'AI Analyzer' },
    { id: 'tasks', label: 'My Tasks' },
    { id: 'files', label: 'Files & links' },
  ];

  if (selectedDM) {
    return (
      <div className="w-80 min-h-0 bg-white border-l border-gray-200 flex flex-col">
        {/* Compact profile header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex flex-col items-center">
            {selectedDM.avatarUrl ? (
              <img src={selectedDM.avatarUrl} alt={selectedDM.fullName} className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#4d298c] to-purple-400 flex items-center justify-center">
                <span className="text-white text-[18px] font-bold">
                  {selectedDM.fullName.trim().split(/\s+/).length >= 2
                    ? (selectedDM.fullName.trim().split(/\s+/)[0][0] + selectedDM.fullName.trim().split(/\s+/).slice(-1)[0][0]).toUpperCase()
                    : selectedDM.fullName.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="text-center mt-2">
              <div className="font-bold text-[15px] text-gray-900">{selectedDM.fullName}</div>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-2 h-2 rounded-full ${selectedDM.online ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-[12px] text-gray-500">{selectedDM.online ? 'Online' : 'Away'}</span>
            </div>
            <button
              onClick={() => window.open('https://meet.google.com', '_blank', 'noopener,noreferrer')}
              className="w-full mt-3 bg-[#d7f78b] text-gray-900 font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity text-[13px]"
            >
              Start Google Meet
            </button>
          </div>
        </div>

        {/* Tabs — same as main view */}
        <div className="border-b border-gray-200 flex flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-[13px] font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#4d298c] text-[#4d298c]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'ai'    && <AIAnalyzerTab />}
          {activeTab === 'tasks' && <MyTasksTab />}
          {activeTab === 'files' && <FilesTab />}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 min-h-0 bg-white border-l border-gray-200 flex flex-col">
      {/* Tabs */}
      <div className="border-b border-gray-200 flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-[13px] font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#4d298c] text-[#4d298c]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'ai' && <AIAnalyzerTab />}
        {activeTab === 'tasks' && <MyTasksTab />}
        {activeTab === 'files' && <FilesTab />}
      </div>
    </div>
  );
}

function AIAnalyzerTab() {
  const [aiOn, setAiOn] = useState(true);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`w-2 h-2 rounded-full ${aiOn ? 'bg-green-500' : 'bg-gray-400'}`}>
              {aiOn && (
                <div className="absolute inset-0 rounded-full bg-green-500 animate-ping" />
              )}
            </div>
          </div>
          <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
            AI IS {aiOn ? 'WATCHING' : 'OFF FOR'} THIS CHANNEL
          </span>
        </div>
        <button
          onClick={() => setAiOn(!aiOn)}
          className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors ${
            aiOn
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          AI {aiOn ? 'On' : 'Off'}
        </button>
      </div>

      {/* Detected Task */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#4d298c] to-purple-400 flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] text-gray-900 leading-relaxed">
              <span className="font-semibold text-[#4d298c]">@Daniel A.</span> has been assigned:{' '}
              <span className="font-medium">Keep layers organized</span> — added to task board
            </div>
            <div className="text-[12px] text-gray-500 mt-2">Detected 2 minutes ago</div>
          </div>
        </div>
      </div>

      {/* Info text */}
      <div className="mt-4 p-3 bg-[#ede8f7] rounded-lg border border-[#d4c6f0]">
        <p className="text-[12px] text-[#4d298c] leading-relaxed">
          AI Analyzer monitors your channel conversations and automatically detects tasks, assignments, and action items. Detected items are added to your task board.
        </p>
      </div>
    </div>
  );
}

function MyTasksTab() {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Keep layers organized', assignee: 'Daniel A.', dueDate: 'Feb 28', completed: false },
    { id: 2, title: 'Prepare Lottie files for animations', assignee: 'Diana T.', dueDate: 'Feb 28', completed: false },
    { id: 3, title: 'Review UI kit components', assignee: 'Emily D.', dueDate: 'Feb 25', completed: true },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = () => {
    if (!newTitle.trim()) return;
    setTasks(prev => [...prev, {
      id: Date.now(),
      title: newTitle.trim(),
      assignee: 'Me',
      dueDate: newDueDate.trim() || '—',
      completed: false,
    }]);
    setNewTitle('');
    setNewDueDate('');
    setAddOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-bold text-gray-900">My Tasks</h3>
        <button onClick={() => setAddOpen(v => !v)} className="p-1.5 hover:bg-gray-100 rounded">
          <Plus size={16} className="text-gray-600" />
        </button>
      </div>

      {addOpen && (
        <div className="mb-4 border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
          <input
            autoFocus
            placeholder="Task title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-[13px] outline-none focus:border-[#4d298c] focus:ring-1 focus:ring-purple-100 bg-white"
          />
          <input
            placeholder="Due date (e.g. Mar 15)"
            value={newDueDate}
            onChange={e => setNewDueDate(e.target.value)}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-[13px] outline-none focus:border-[#4d298c] focus:ring-1 focus:ring-purple-100 bg-white"
          />
          <div className="flex gap-2 pt-1">
            <button
              onClick={addTask}
              className="flex-1 py-1.5 bg-[#4d298c] text-white text-[12px] font-medium rounded hover:bg-[#3d1f70]"
            >
              Add
            </button>
            <button
              onClick={() => { setAddOpen(false); setNewTitle(''); setNewDueDate(''); }}
              className="px-3 py-1.5 text-[12px] text-gray-600 hover:bg-gray-200 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors bg-white"
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#4d298c] cursor-pointer"
              />
              <div className="flex-1">
                <div className={`text-[14px] font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {task.title}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="text-gray-400" />
                    <span className="text-[12px] text-gray-600">{task.assignee}</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-gray-400" />
                    <span className={`text-[12px] ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                      {task.dueDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilesTab() {
  const [files, setFiles] = useState([
    { name: 'fonts.zip', type: 'ZIP', size: '2.4 MB', date: '2d ago' },
    { name: 'responsive-design-guidelines.pdf', type: 'PDF', size: '1.8 MB', date: '3d ago' },
    { name: 'ui-kit-components.fig', type: 'Figma', size: '12.3 MB', date: '1w ago' },
  ]);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  const links = [
    { title: 'FlowTalk website v.3.0', url: 'flowtalk.com', date: '2d ago' },
    { title: 'Design System Documentation', url: 'docs.flowtalk.com', date: '1w ago' },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-bold text-gray-900">Files</h3>
          <span className="text-[12px] text-gray-500">{files.length}</span>
        </div>
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="relative">
              <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded border border-gray-200 cursor-pointer">
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-gray-600">{file.type}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-gray-900 truncate">{file.name}</div>
                  <div className="text-[11px] text-gray-500">{file.size} • {file.date}</div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setOpenMenuIndex(openMenuIndex === index ? null : index); }}
                  className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                >
                  <MoreHorizontal size={14} className="text-gray-400" />
                </button>
              </div>
              {openMenuIndex === index && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenMenuIndex(null)} />
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[150px]">
                    <button onClick={() => setOpenMenuIndex(null)} className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50">Download</button>
                    <button onClick={() => setOpenMenuIndex(null)} className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50">Copy link</button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => { setFiles(prev => prev.filter((_, i) => i !== index)); setOpenMenuIndex(null); }}
                      className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-bold text-gray-900">Links</h3>
          <span className="text-[12px] text-gray-500">{links.length}</span>
        </div>
        <div className="space-y-2">
          {links.map((link, index) => (
            <div
              key={index}
              className="p-3 hover:bg-gray-50 rounded border border-gray-200"
            >
              <div className="text-[13px] font-medium text-gray-900 mb-1">{link.title}</div>
              <a href={`https://${link.url}`} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#4d298c] hover:underline block mb-1">{link.url}</a>
              <div className="text-[11px] text-gray-500">{link.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
