---
name: SpinChat media upload and livestream follower fan-out
description: SpinChat image/video upload with view-once, and SmartzTV go-live follower notifications
---

## SpinChat media upload + view-once
- Added `uploadToSufy` import + `fileInputRef`, `pendingViewOnce`, `viewOnceOverlay` state
- Eye/EyeOff toggle button + ImageIcon attach button in the chat input toolbar
- View-once overlay (same pattern as ChatPage/GroupChatPage)
- Messages extended to support type: 'image' | 'video' with url, viewOnce, viewedBy fields

## SmartzTV go-live follower fan-out
- After successful livestream insert, fetches `follows` table for all followers (limit 200)
- Calls `notifyUser` for each with type: 'live_stream', fire-and-forget wrapped in `Promise.allSettled`
- Never blocks go-live; silently swallows all errors

## AdminLayout branding
- Added Brand Header (logo + "SmartzConnect" / "Admin Panel" text) at top of SidebarContent
- Added mobile brand logo + "Admin" label in top bar (shown only when sidebar is hidden, md:hidden)

## Admin CSS (index.css admin-shell scope)
- Added stat number Sora font-black rules, input legibility rules, button font, badge font, code mono
**Why:** These ensure visual consistency across all admin pages in both dark and light modes.
