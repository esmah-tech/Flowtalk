# FlowTalk UI/UX Audit — Todo

---

## Dead Buttons

### ChatArea
- [ ] `Users` icon (header) — open member list panel
- [ ] `Pin` icon (header) — open pinned messages panel
- [x] `MoreVertical` icon (header) — open dropdown menu
- [ ] `Settings` icon (header) — open channel settings panel
- [x] 👍 reaction button (message 1) — toggle reaction
- [ ] ↩️ reply button (message 1) — open reply thread
- [x] ❤️ reaction button (message 2) — toggle reaction
- [ ] ↩️ reply button (message 2) — open reply thread
- [x] "Quick view" button on link preview card — open preview
- [ ] `Paperclip` icon (compose toolbar) — open file picker
- [x] `Smile` icon (compose toolbar) — open emoji picker
- [x] `AtSign` icon (compose toolbar) — open mention picker
- [x] 📎 emoji button (compose toolbar) — duplicate of Paperclip, remove or wire up
- [x] 🎨 emoji button (compose toolbar) — wire up or remove
- [x] "Discard" button — clear the message input
- [x] "Send" button — send message (append to list)
- [ ] ↗ arrow inside message 3's inline mention card — navigate to referenced message

### LeftRail
- [ ] Workspace "F" avatar (top) — is a plain `div`, make it a button; open workspace menu
- [x] Grid/apps nav icon — wire up; add tooltip *(tooltip added)*
- [x] List/layout nav icon — wire up; add tooltip *(tooltip added)*
- [x] Circle nav icon — wire up or remove; add tooltip *(tooltip added)*
- [ ] Plus button (bottom) — wire up; add tooltip *(tooltip added)*
- [x] "Start Google Meet" (profile popover) — wire up or open external link
- [x] "Edit Profile" (profile popover) — open Edit Profile modal
- [x] "Sign Out" (profile popover) — navigate to /signin

### Sidebar
- [ ] "FlowTalk" workspace name + `ChevronDown` — open workspace menu
- [x] "Assistant" nav item — open AI Assistant view
- [x] "Drafts" nav item — open Drafts view
- [x] "Saved items" nav item — open Saved Items view
- [x] "Inbox" nav item — open Inbox view
- [ ] "Direct messages" nav item — scroll to DM section or open DM list
- [x] "Sophia Wilson" (Favorites) — open DM or channel
- [x] "Front-end" (Favorites) — navigate to #front-end channel
- [ ] `Plus` in Channels header — open Create Channel modal *(stopPropagation + console.log placeholder added)*
- [ ] `Plus` in Client: Acme header — open Create Channel modal (client context) *(stopPropagation + console.log placeholder added)*
- [ ] `Plus` in Direct Messages header — open New DM dialog *(stopPropagation + console.log placeholder added)*
- [x] Sub-channel "Wireframe" — navigate to sub-channel
- [x] Sub-channel "Design" — navigate to sub-channel
- [x] Acme channel "website-redesign" — navigate to channel
- [x] Acme channel "brand-assets" — navigate to channel
- [x] Inactive channel "design" — navigate to channel
- [x] Inactive channel "announcements" — navigate to channel

### RightPanel
- [x] "Start Google Meet" (DM profile view) — wire up or open external link
- [ ] "Shared Files" count — make clickable; show file list
- [x] `Plus` in My Tasks header — open Add Task modal
- [x] Task checkboxes — remove `readOnly`; toggle completed state
- [x] `MoreHorizontal` on each file row — open file actions dropdown (download, copy link, delete)
- [ ] File rows — make clickable; open/download file
- [x] Link URLs in Files tab — add onClick; open URL in new tab
- [ ] AI On/Off toggle — reflect state change elsewhere in UI (e.g. status indicator)

### SearchModal
- [ ] All 7 result item buttons — navigate to the relevant message/file/channel on click
- [x] "Threads" tab — filter results to threads only
- [x] "Members" tab — filter results to people only
- [x] "Files" tab — filter results to files only
- [x] "Direct messages" tab — filter results to DMs only
- [x] "Links" tab — filter results to links only
- [ ] "Sort by: Type" — make interactive; implement sort toggle

---

## Missing Modals

- [x] Emoji picker (Smile icon in compose toolbar)
- [ ] File picker / attachment browser (Paperclip icon)
- [x] @mention autocomplete popup (AtSign icon)
- [ ] Pinned messages panel (Pin icon in header)
- [ ] Members list panel (Users icon in header)
- [ ] Channel settings panel (Settings icon in header)
- [x] MoreVertical dropdown menu (mute, leave channel, copy link, etc.)
- [x] Edit Profile modal (from LeftRail profile popover)
- [ ] Sign-out confirmation / redirect to /signin
- [ ] Workspace menu (FlowTalk + ChevronDown in Sidebar header)
- [ ] Create Channel modal (Plus buttons in Channels and Client: Acme)
- [ ] New Direct Message dialog (Plus in DM section)
- [x] Add Task modal (Plus in My Tasks)
- [x] File actions dropdown on file rows (download, copy link, delete)
- [ ] Shared Files expanded list in DM profile panel
- [ ] Workspace / app browser for the three LeftRail nav icons

---

## Fake Data

- [ ] Channel messages (Sophia, Diana, Daniel) — hardcoded JSX; move to a data array
- [ ] DM messages — hardcoded in App.tsx per profile; move to data array
- [ ] Message timestamps — `"10:22"`, ~~`"10 ago"`~~ → `"10m ago"` ✓, `"5m ago"` — static strings
- [x] Reaction counts (👍 2, ❤️ 1) — hardcoded; make toggleable with local state
- [ ] Link preview card ("FlowTalk website v.3.0") — hardcoded JSX
- [ ] Inline mention card in message 3 — hardcoded JSX
- [ ] Channel list (`ALL_CHANNELS`, `ACME_CHANNELS`) — hardcoded; move to data file
- [ ] DM member list (`DM_MEMBERS`) — hardcoded, only 2 people
- [ ] Sidebar badge counts (1, 2, 4) — hardcoded, never update
- [x] Task list in My Tasks — hardcoded array with `readOnly` checkboxes *(checkboxes now functional)*
- [ ] "Detected 2 minutes ago" in AI Analyzer — static string, never updates
- [ ] Files list — hardcoded (fonts.zip, PDF, .fig)
- [ ] Links list — hardcoded
- [ ] Search results (`allResults`) — hardcoded 7-item array
- [ ] "Recent searches" section — header renders but content is empty
- [ ] Profile info ("Esma I.", "Product Designer", "esma@flowtalk.com") — hardcoded
- [ ] Workspace notification dot on LeftRail — always visible, never dismissable
- [ ] "Shared Files" count on DM profile panel — hardcoded per profile
- [x] Task due date "Feb 29" — does not exist in 2025 or 2026; fix to a valid date

---

## Poor Quality UI

### Broken Text
- [x] `"10 ago"` on message 2 — broken timestamp; fix to `"10m ago"`

### Color Inconsistency
- [x] Selected channel highlight uses `bg-blue-50 / text-blue-600` — should use brand purple `#4d298c`
- [x] Active tab underline in RightPanel uses `border-blue-600` — should use brand purple
- [x] Search input focus ring uses `ring-blue-100 / border-blue-500` — should use brand purple
- [x] "Send" button is `bg-gray-900` (black) — should be brand purple `#4d298c`

### Duplicate Controls
- [x] `Paperclip` icon AND `📎` emoji both in compose toolbar — remove the emoji duplicate
- [x] "Direct messages" nav item AND "Direct messages" section header below it — consolidate

### Broken Interactions
- [x] Task checkboxes are `readOnly` — core task manager action is non-functional
- [x] SearchModal tabs do nothing — switching tabs shows identical unfiltered results
- [x] Keyboard hints ("↑↓ Move", "↵ Select") in SearchModal footer are non-functional decoration
- [ ] Status change in LeftRail popover does not update the online indicator in Sidebar DM list
- [x] Click outside SearchModal does not close it — only X and Cancel work
- [x] Pressing Escape does not close SearchModal

### Avatar Sizing Inconsistency
- [x] DM message avatars: `w-7 h-7` (28px) → fixed to `w-9 h-9`
- [x] Channel message avatars: `w-9 h-9` (36px) — already correct
- [ ] Sidebar DM list avatars: `w-5 h-5` (20px) — nav context, acceptable
- [ ] Profile popover avatar: `w-16 h-16`
- [x] Message list avatars standardized to `w-9 h-9`

### LeftRail Nav Icons
- [x] Three nav icons use hand-written raw SVG paths — replace with lucide-react icons for consistency (LayoutGrid, Activity, AtSign)
- [x] No tooltips on any nav icon — add `title` attributes or a Tooltip component
- [x] No active/selected state on any nav button — add visual active indicator

### RightPanel
- [x] DM profile view replaces entire panel — user loses access to AI Analyzer, Tasks, and Files tabs; add tab bar to DM profile view
- [ ] "Shared Files" in DM profile shows only a count — add expand/view functionality

### SearchModal
- [x] "Recent searches" section header renders with empty content — add items or hide the section
- [x] All person results share identical blue-to-purple gradient — differentiate avatars per person
- [x] `icon` field in `SearchResult` type is defined but never used — remove or implement

### Message Compose
- [x] `<textarea rows={3}>` is fixed height — implement auto-resize as user types

### Message List
- [x] No hover-over-message action bar (add reaction, reply, more) — standard in all chat apps
- [x] No date dividers between messages (e.g. "Today", "Yesterday")
- [ ] No "New Messages" unread divider
