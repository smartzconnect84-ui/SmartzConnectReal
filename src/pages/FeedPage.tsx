import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Image, Video, Send, Heart, MessageCircle, Share2, MoreHorizontal,
  Bookmark, TrendingUp, RefreshCw, MapPin, Plus, Smile,
  Users, Calendar, Gift, ChevronRight, Wifi, Camera, X, PartyPopper,
  Link2, Trash2, Flag, Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadToSufy } from '@/lib/sufy'
import { useAuth } from '@/hooks/useAuth'
import ReportBlockModal from '@/components/ReportBlockModal'

// ── Types ───────────────────────────────────────────────────────────────────
interface Post {
  id: string
  author: string
  handle: string
  emoji: string
  avatar_url?: string
  location?: string
  time: string
  content: string
  image_url?: string | null
  video_url?: string | null
  likes: number
  comments: number
  shares: number
  liked: boolean
  saved: boolean
  verified?: boolean
  premium?: boolean
  authorId?: string
}

interface Story {
  id: string
  name: string
  avatar: string
  gradient: string
  isOwn?: boolean
}

// ── Static data ──────────────────────────────────────────────────────────────
const trendingTopics = [
  { tag: '#AfricaTech',     posts: '12.4K' },
  { tag: '#SmartzTV',       posts: '8.1K' },
  { tag: '#Afrobeats',      posts: '31K' },
  { tag: '#NaijaFashion',   posts: '5.7K' },
  { tag: '#AccraTech',      posts: '3.2K' },
  { tag: '#MonroviaVibes',  posts: '2.8K' },
]

const suggestedFriends = [
  { id: '1', name: 'Amara Diallo',    mutual: 12, avatar: '👩🏾', gradient: 'from-pink-500 to-rose-500' },
  { id: '2', name: 'Kwame Asante',    mutual: 7,  avatar: '👨🏿', gradient: 'from-purple-500 to-violet-500' },
  { id: '3', name: 'Zainab Okonkwo',  mutual: 5,  avatar: '👩🏽', gradient: 'from-amber-500 to-orange-500' },
]

const upcomingEvents = [
  { id: '1', title: 'AfricaTech Summit 2026', date: 'Jul 12', attendees: 1240 },
  { id: '2', title: 'Lagos Fashion Week',      date: 'Jul 18', attendees: 870 },
]

const birthdays = [
  { id: '1', name: 'Fatima Bah',   avatar: '👩🏿' },
  { id: '2', name: 'Kofi Mensah',  avatar: '👨🏾' },
]

const onlineContacts = [
  { id: '1', name: 'Amara',    avatar: '👩🏾', gradient: 'from-pink-500 to-rose-500' },
  { id: '2', name: 'Kwame',    avatar: '👨🏿', gradient: 'from-purple-500 to-violet-500' },
  { id: '3', name: 'Zainab',   avatar: '👩🏽', gradient: 'from-amber-500 to-orange-500' },
  { id: '4', name: 'Emeka',    avatar: '👨🏾', gradient: 'from-emerald-500 to-teal-500' },
  { id: '5', name: 'Ngozi',    avatar: '👩🏾', gradient: 'from-sky-500 to-blue-500' },
]

const defaultEmojis = ['👩🏾', '👨🏿', '👩🏽', '👨🏾', '👩🏿', '👨🏽']
const EMOJI_PALETTE = [
  '😀','😂','🥰','😍','😎','🤔','😢','😡','👍','🙏','🔥','💯',
  '🎉','❤️','💕','😊','😉','🤩','😴','🥳','👏','💪','✨','🌟',
]

const REACTION_EMOJIS = ['❤️', '🔥', '😂', '😮', '😢', '👏']

const TEXT_STORY_BG_OPTIONS = [
  { label: 'Pink',    value: 'from-pink-500 to-rose-600',      text: 'text-white' },
  { label: 'Purple',  value: 'from-purple-500 to-violet-600',  text: 'text-white' },
  { label: 'Blue',    value: 'from-sky-500 to-blue-600',       text: 'text-white' },
  { label: 'Green',   value: 'from-emerald-500 to-teal-600',   text: 'text-white' },
  { label: 'Amber',   value: 'from-amber-500 to-orange-600',   text: 'text-white' },
  { label: 'Dark',    value: 'from-gray-800 to-gray-950',      text: 'text-white' },
]

// ── Emoji picker popover — used in ComposeBox and the comment composer ──────
function EmojiPicker({ onPick, onClose }: { onPick: (emoji: string) => void; onClose: () => void }) {
  return (
    <div className="absolute z-20 bottom-full mb-2 left-0 dark:bg-[#1A1428] bg-white border dark:border-white/10 border-gray-200 rounded-2xl shadow-xl p-2 grid grid-cols-6 gap-1 w-56">
      {EMOJI_PALETTE.map(e => (
        <button
          key={e}
          type="button"
          onClick={() => { onPick(e); onClose() }}
          className="text-lg leading-none p-1.5 rounded-lg dark:hover:bg-white/10 hover:bg-gray-100 transition-colors"
        >
          {e}
        </button>
      ))}
    </div>
  )
}

// ── Location picker — uses browser geolocation + OpenStreetMap reverse geocoding (no API key needed) ──
async function detectLocation(): Promise<string | null> {
  if (!('geolocation' in navigator)) return null
  const coords = await new Promise<GeolocationCoordinates | null>(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos.coords),
      () => resolve(null),
      { timeout: 8000 },
    )
  })
  if (!coords) return null
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10`,
      { headers: { Accept: 'application/json' } },
    )
    if (!res.ok) return null
    const data = await res.json()
    const a = data?.address || {}
    return a.city || a.town || a.village || a.state || data?.display_name || null
  } catch {
    return null
  }
}
const storyGradients = [
  'from-pink-500 to-rose-600',
  'from-purple-500 to-violet-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-pink-600',
]

// ── Skeleton Loader ───────────────────────────────────────────────────────────
function PostSkeleton() {
  return (
    <div className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/6 border-gray-200 mb-3 overflow-hidden shadow-sm animate-pulse">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-10 h-10 rounded-full dark:bg-white/8 bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded-full dark:bg-white/8 bg-gray-200 w-32" />
          <div className="h-2.5 rounded-full dark:bg-white/5 bg-gray-100 w-24" />
        </div>
      </div>
      <div className="px-4 pb-4 space-y-2">
        <div className="h-3 rounded-full dark:bg-white/8 bg-gray-200 w-full" />
        <div className="h-3 rounded-full dark:bg-white/8 bg-gray-200 w-4/5" />
        <div className="h-3 rounded-full dark:bg-white/5 bg-gray-100 w-3/5" />
      </div>
      <div className="flex gap-2 px-4 pb-3">
        <div className="h-8 rounded-xl dark:bg-white/5 bg-gray-100 w-16" />
        <div className="h-8 rounded-xl dark:bg-white/5 bg-gray-100 w-16" />
        <div className="h-8 rounded-xl dark:bg-white/5 bg-gray-100 w-16" />
      </div>
    </div>
  )
}

// ── Stories Bar ───────────────────────────────────────────────────────────────
interface DbStory {
  id: string
  author_id: string
  media_url: string
  media_type: string
  text_content?: string | null
  bg_color?: string | null
  expires_at: string
  profile?: { full_name: string | null; avatar_url: string | null; username: string | null }
}

interface ViewStory {
  id: string
  authorId: string
  name: string
  avatar: string | null
  mediaUrl: string
  mediaType?: string
  textContent?: string | null
  bgColor?: string | null
  isOwn?: boolean
}

function StoriesBar({ user }: { user: { id?: string; email?: string } | null }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const storyInputRef = useRef<HTMLInputElement>(null)
  const [dbStories, setDbStories] = useState<DbStory[]>([])
  const [uploading, setUploading] = useState(false)
  const [viewing, setViewing] = useState<ViewStory | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showTextStory, setShowTextStory] = useState(false)
  const [textContent, setTextContent] = useState('')
  const [textBg, setTextBg] = useState(TEXT_STORY_BG_OPTIONS[0].value)
  const [postingTextStory, setPostingTextStory] = useState(false)

  const handleTextStorySubmit = async () => {
    if (!textContent.trim() || !user?.id) return
    setPostingTextStory(true)
    try {
      await supabase.from('stories').insert({
        user_id: user.id,
        media_url: '',
        media_type: 'text',
        text_content: textContent.trim(),
        bg_color: textBg,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      setShowTextStory(false)
      setTextContent('')
      await loadStories()
    } catch { /* ignore */ }
    setPostingTextStory(false)
  }

  const loadStories = useCallback(async () => {
    // stories.user_id has no FK to profiles, so PostgREST join would silently
    // return null. Fetch stories first, then hydrate profiles separately.
    const { data: rows } = await supabase
      .from('stories')
      .select('id,user_id,media_url,media_type,text_content,bg_color,expires_at')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(20)
    if (!rows?.length) { setDbStories([]); return }

    const ids = [...new Set(rows.map((r: any) => r.user_id).filter(Boolean))]
    const { data: profs } = await supabase
      .from('profiles')
      .select('id,full_name,avatar_url,username')
      .in('id', ids)
    const profMap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]))

    setDbStories(rows.map((r: any) => ({
      ...r,
      author_id: r.user_id,            // keep author_id alias for rendering
      text_content: r.text_content ?? null,
      bg_color: r.bg_color ?? null,
      profiles: profMap[r.user_id] ?? null,
    })) as any)
  }, [])

  useEffect(() => { loadStories() }, [loadStories])

  const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    setUploading(true)
    setUploadError(null)
    try {
      const publicUrl = await uploadToSufy(file, 'stories')
      const isVideo = file.type.startsWith('video/')
      await supabase.from('stories').insert({
        user_id: user.id,           // live DB column is user_id (not author_id)
        media_url: publicUrl,
        media_type: isVideo ? 'video' : 'image',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      await loadStories()
    } catch (err: any) {
      setUploadError(err?.message || 'Story upload failed. Please try again.')
      setTimeout(() => setUploadError(null), 4000)
    }
    setUploading(false)
  }

  const myStory = dbStories.find(s => s.author_id === user?.id)
  const othersStories = dbStories.filter(s => s.author_id !== user?.id)

  return (
    <>
      {/* Upload error banner */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            key="story-upload-error"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mx-4 mb-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm font-semibold text-red-500"
          >
            <X className="w-4 h-4 flex-shrink-0" />
            {uploadError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story viewer overlay */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setViewing(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" onClick={() => setViewing(null)}>
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="max-w-sm w-full mx-4 rounded-2xl overflow-hidden">
            {viewing.mediaType === 'text' ? (
              <div className={`w-full h-[360px] bg-gradient-to-br ${viewing.bgColor || 'from-pink-500 to-rose-600'} flex items-center justify-center p-8`}>
                <p className="text-white text-center font-bold text-2xl leading-snug break-words">
                  {viewing.textContent || ''}
                </p>
              </div>
            ) : viewing.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
              <video src={viewing.mediaUrl} autoPlay controls className="w-full" />
            ) : (
              <img src={viewing.mediaUrl} alt="Story" className="w-full object-contain max-h-[80vh]" />
            )}
            <div className="bg-black/60 p-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-love-gradient flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                {viewing.avatar ? <img src={viewing.avatar} alt="" className="w-full h-full object-cover" /> : viewing.name[0]}
              </div>
              <p className="text-white text-sm font-semibold">{viewing.name}</p>
            </div>
          </div>
        </div>
      )}

      <div className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/6 border-gray-200 mb-3 shadow-sm overflow-hidden">
        <div ref={scrollRef} className="flex gap-3 px-4 py-3.5 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>

          {/* Text story modal */}
          <AnimatePresence>
            {showTextStory && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setShowTextStory(false)}>
                <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
                  onClick={e => e.stopPropagation()}
                  className="w-full max-w-sm dark:bg-[#0D0A14] bg-white rounded-2xl overflow-hidden shadow-2xl border dark:border-white/8 border-gray-200">
                  {/* Preview */}
                  <div className={`h-44 bg-gradient-to-br ${textBg} flex items-center justify-center p-6`}>
                    <p className="text-white text-center font-bold text-lg leading-snug break-words">
                      {textContent || 'Your story text here…'}
                    </p>
                  </div>
                  <div className="p-4 space-y-3">
                    <textarea
                      value={textContent}
                      onChange={e => setTextContent(e.target.value)}
                      placeholder="What's on your mind?"
                      rows={3}
                      maxLength={200}
                      className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none resize-none"
                    />
                    {/* BG color picker */}
                    <div className="flex gap-2">
                      {TEXT_STORY_BG_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => setTextBg(opt.value)}
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${opt.value} flex-shrink-0 transition-transform ${textBg === opt.value ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-gray-100 dark:ring-offset-[#0D0A14]' : ''}`}
                          title={opt.label} />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowTextStory(false)}
                        className="flex-1 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 text-sm font-semibold dark:text-gray-300 text-gray-700">
                        Cancel
                      </button>
                      <button onClick={handleTextStorySubmit} disabled={!textContent.trim() || postingTextStory}
                        className="flex-1 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                        {postingTextStory ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
                        {postingTextStory ? 'Posting…' : 'Share Story'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Own story / add story */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
            <div className="relative">
              <button
                onClick={() => myStory
                  ? setViewing({ id: myStory.id, authorId: myStory.author_id, name: 'Your Story', avatar: null, mediaUrl: myStory.media_url, mediaType: myStory.media_type, textContent: myStory.text_content, bgColor: myStory.bg_color })
                  : storyInputRef.current?.click()
                }
                disabled={uploading}
                className={`w-14 h-14 rounded-full bg-gradient-to-br from-brand-pink to-brand-purple flex items-center justify-center text-white font-bold text-lg overflow-hidden border-2 dark:border-[#0D0A14] border-white ${myStory ? 'ring-2 ring-offset-1 ring-pink-500' : ''}`}>
                {uploading
                  ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <span className="text-lg">{user?.email?.[0]?.toUpperCase() ?? 'U'}</span>
                }
              </button>
              {!myStory && !uploading && (
                <button onClick={() => storyInputRef.current?.click()}
                  className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-love-gradient flex items-center justify-center border-2 dark:border-[#0D0A14] border-white">
                  <Plus className="w-3 h-3 text-white" />
                </button>
              )}
              <input ref={storyInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleStoryUpload} />
            </div>
            <span className="text-[10px] font-semibold dark:text-gray-400 text-gray-500 max-w-[56px] truncate text-center">
              {myStory ? 'Your Story' : 'Add Story'}
            </span>
          </div>

          {/* Text story button */}
          {!myStory && (
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <button onClick={() => setShowTextStory(true)}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 dark:border-[#0D0A14] border-white hover:scale-105 transition-transform">
                <span className="text-xl">Aa</span>
              </button>
              <span className="text-[10px] font-semibold dark:text-gray-400 text-gray-500 max-w-[56px] truncate text-center">Text Story</span>
            </div>
          )}

          {/* Others' stories */}
          {othersStories.map((story, idx) => {
            const profile = (story as any).profiles as { full_name: string | null; avatar_url: string | null; username: string | null } | null
            const name = profile?.full_name || profile?.username || 'User'
            return (
              <button key={story.id}
                onClick={() => setViewing({ id: story.id, authorId: story.author_id, name, avatar: profile?.avatar_url ?? null, mediaUrl: story.media_url, mediaType: story.media_type, textContent: story.text_content, bgColor: story.bg_color })}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
                <div className="relative">
                  <div className="absolute -inset-0.5 rounded-full bg-love-gradient" />
                  <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${storyGradients[idx % storyGradients.length]} flex items-center justify-center text-xl overflow-hidden border-2 dark:border-[#0D0A14] border-white`}>
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
                      : <span className="text-white font-bold">{name[0]?.toUpperCase()}</span>
                    }
                  </div>
                </div>
                <span className="text-[10px] font-semibold dark:text-gray-400 text-gray-500 max-w-[56px] truncate text-center group-hover:text-brand-pink transition-colors">
                  {name.split(' ')[0]}
                </span>
              </button>
            )
          })}

          {/* Placeholder if no stories */}
          {othersStories.length === 0 && (
            <div className="flex items-center gap-2 pl-2">
              <Camera className="w-4 h-4 dark:text-gray-600 text-gray-300" />
              <span className="text-[11px] dark:text-gray-500 text-gray-400">Stories from people you follow will appear here</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Compose Box ───────────────────────────────────────────────────────────────
function ComposeBox({
  user,
  onPost,
}: {
  user: { email?: string } | null
  onPost: () => void
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string>('')
  const [mediaKind, setMediaKind] = useState<'image' | 'video' | null>(null)
  const [location, setLocation] = useState('')
  const [locating, setLocating] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const { user: authUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pickMedia = (kind: 'image' | 'video') => {
    setMediaKind(kind)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaFile(file)
    const reader = new FileReader()
    reader.onload = () => setMediaPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleCheckIn = async () => {
    if (location) { setLocation(''); return }
    setLocating(true)
    const place = await detectLocation()
    setLocating(false)
    setLocation(place || '')
  }

  const insertEmoji = (emoji: string) => setText(t => t + emoji)

  const handlePost = async () => {
    if ((!text.trim() && !mediaFile) || !authUser?.id) return
    setPosting(true)
    try {
      const updates: Record<string, any> = {
        content: text,
        author_id: authUser.id,
        visibility: 'public',
      }
      if (location) updates.location = location
      if (mediaFile) {
        const url = await uploadToSufy(mediaFile, 'posts')
        if (mediaKind === 'video') updates.video_url = url
        else updates.image_url = url
      }
      const { error } = await supabase.from('posts').insert(updates)
      if (error) return // keep composer open so user can retry
      setText(''); setMediaFile(null); setMediaPreview(''); setMediaKind(null); setLocation('')
      setOpen(false)
      onPost()
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4 mb-3 shadow-sm">
      <input
        ref={fileInputRef}
        type="file"
        accept={mediaKind === 'video' ? 'video/*' : 'image/*'}
        onChange={handleFileChange}
        className="sr-only"
      />
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.div key="trigger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button onClick={() => setOpen(true)} className="w-full flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-full bg-love-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.email?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1 px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 hover:border-brand-pink/30 transition-colors">
                <p className="text-sm dark:text-gray-500 text-gray-400">What's on your mind?</p>
              </div>
            </button>
            <div className="flex items-center gap-1 mt-3 pt-3 border-t dark:border-white/6 border-gray-100">
              {[
                { icon: Image,   label: 'Photo',  color: 'text-green-500', act: () => { setOpen(true); setTimeout(() => pickMedia('image'), 50) } },
                { icon: Video,   label: 'Video',  color: 'text-blue-500', act: () => { setOpen(true); setTimeout(() => pickMedia('video'), 50) } },
                { icon: Smile,   label: 'Feeling', color: 'text-amber-500', act: () => { setOpen(true); setTimeout(() => setShowEmoji(true), 50) } },
                { icon: MapPin,  label: 'Check in', color: 'text-red-500', act: () => { setOpen(true); setTimeout(handleCheckIn, 50) } },
              ].map(a => (
                <button key={a.label} onClick={a.act}
                  className="flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded-xl dark:hover:bg-white/5 hover:bg-gray-100 transition-colors">
                  <a.icon className={`w-4 h-4 ${a.color}`} />
                  <span className="text-xs font-semibold dark:text-gray-400 text-gray-500 hidden sm:block">{a.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="compose" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-love-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.email?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <textarea
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Share something with the community…"
                rows={3}
                className="flex-1 bg-transparent text-sm dark:text-white text-gray-900 placeholder:dark:text-gray-500 placeholder:text-gray-400 resize-none focus:outline-none"
              />
            </div>

            {mediaPreview && (
              <div className="relative rounded-xl overflow-hidden dark:bg-black/20 bg-gray-100 max-h-56">
                {mediaKind === 'video'
                  ? <video src={mediaPreview} className="w-full max-h-56 object-cover" controls />
                  : <img src={mediaPreview} alt="Upload preview" className="w-full max-h-56 object-cover" />}
                <button
                  onClick={() => { setMediaFile(null); setMediaPreview(''); setMediaKind(null) }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {location && (
              <div className="flex items-center gap-1.5 text-xs text-brand-pink font-semibold">
                <MapPin className="w-3.5 h-3.5" /> {locating ? 'Detecting…' : location}
                <button onClick={() => setLocation('')} className="dark:text-gray-500 text-gray-400 hover:text-red-400"><X className="w-3 h-3" /></button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t dark:border-white/6 border-gray-100">
              <div className="flex gap-1 relative">
                <button onClick={() => pickMedia('image')} title="Photo" className="p-2 rounded-xl dark:hover:bg-white/5 hover:bg-gray-100 transition-colors">
                  <Image className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                </button>
                <button onClick={() => pickMedia('video')} title="Video" className="p-2 rounded-xl dark:hover:bg-white/5 hover:bg-gray-100 transition-colors">
                  <Video className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                </button>
                <button onClick={handleCheckIn} title="Check in" className="p-2 rounded-xl dark:hover:bg-white/5 hover:bg-gray-100 transition-colors relative">
                  {locating ? <Loader2 className="w-4 h-4 dark:text-gray-400 text-gray-500 animate-spin" /> : <MapPin className="w-4 h-4 dark:text-gray-400 text-gray-500" />}
                </button>
                <button onClick={() => setShowEmoji(s => !s)} title="Emoji" className="p-2 rounded-xl dark:hover:bg-white/5 hover:bg-gray-100 transition-colors relative">
                  <Smile className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                </button>
                {showEmoji && <EmojiPicker onPick={insertEmoji} onClose={() => setShowEmoji(false)} />}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setOpen(false); setText(''); setMediaFile(null); setMediaPreview(''); setLocation('') }}
                  className="px-3 py-1.5 rounded-xl dark:bg-white/5 bg-gray-100 text-xs font-semibold dark:text-gray-400 text-gray-600">
                  Cancel
                </button>
                <button onClick={handlePost} disabled={(!text.trim() && !mediaFile) || posting}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-love-gradient text-white text-xs font-bold disabled:opacity-50 shadow-md shadow-pink-500/20">
                  <Send className="w-3.5 h-3.5" />
                  {posting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Render post text with @mentions highlighted (Tag feature) ──────────────
// Post content only stores the @handle text (not the tagged user's UUID), and
// there's no username-based lookup route yet, so mentions are styled but not
// linked — avoids sending users to a dead/incorrect route.
function renderContentWithTags(content: string) {
  const parts = content.split(/(@[a-zA-Z0-9_]+)/g)
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="text-brand-pink font-semibold">{part}</span>
      : <span key={i}>{part}</span>
  )
}

interface DbComment {
  id: string
  content: string
  created_at: string
  user_id: string
  profile?: { full_name: string | null; avatar_url: string | null }
}

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, onLike, onSave, currentUserId }: {
  post: Post
  onLike: (id: string) => void
  onSave: (id: string) => void
  currentUserId?: string
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<DbComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [localCommentCount, setLocalCommentCount] = useState(post.comments)
  const [localShareCount, setLocalShareCount] = useState(post.shares)
  const [copied, setCopied] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reactions, setReactions] = useState<Record<string, number>>({})
  const [myReaction, setMyReaction] = useState<string | null>(null)
  const isOwn = currentUserId && post.authorId === currentUserId

  // Fetch emoji reactions for this post
  useEffect(() => {
    let mounted = true
    supabase.from('post_reactions').select('emoji').eq('post_id', post.id)
      .then(({ data }) => {
        if (!mounted) return
        const counts: Record<string, number> = {}
        for (const r of (data as any[]) || []) counts[r.emoji] = (counts[r.emoji] || 0) + 1
        setReactions(counts)
      })
    if (currentUserId) {
      supabase.from('post_reactions').select('emoji').eq('post_id', post.id).eq('user_id', currentUserId).maybeSingle()
        .then(({ data }) => { if (mounted) setMyReaction((data as any)?.emoji || null) })
    }
    return () => { mounted = false }
  }, [post.id, currentUserId])

  const handleReaction = async (emoji: string) => {
    if (!currentUserId) return
    if (myReaction === emoji) {
      setMyReaction(null)
      setReactions(prev => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] || 0) - 1) }))
      await supabase.from('post_reactions').delete().eq('post_id', post.id).eq('user_id', currentUserId).eq('emoji', emoji)
    } else {
      if (myReaction) {
        setReactions(prev => ({ ...prev, [myReaction]: Math.max(0, (prev[myReaction] || 0) - 1) }))
        await supabase.from('post_reactions').delete().eq('post_id', post.id).eq('user_id', currentUserId)
      }
      setMyReaction(emoji)
      setReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }))
      await supabase.from('post_reactions').insert({ post_id: post.id, user_id: currentUserId, emoji })
        .then(() => {})
    }
  }

  const loadComments = async () => {
    setLoadingComments(true)
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('id, content, created_at, user_id')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })
        .limit(50)
      if (error) throw error
      const rows = (data as any[]) || []
      const userIds = [...new Set(rows.map(r => r.user_id))]
      const profMap: Record<string, any> = {}
      if (userIds.length) {
        const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds)
        for (const p of (profs as any[]) || []) profMap[p.id] = p
      }
      setComments(rows.map(r => ({ ...r, profile: profMap[r.user_id] })))
    } catch (err) {
      console.error('Failed to load comments', err)
    } finally {
      setLoadingComments(false)
    }
  }

  const toggleComments = () => {
    const next = !commentsOpen
    setCommentsOpen(next)
    if (next && comments.length === 0) loadComments()
  }

  const submitComment = async () => {
    if (!commentText.trim() || !currentUserId) return
    const text = commentText.trim()
    setCommentText('')
    // post_comments.author_id is NOT NULL in the live schema; user_id is kept in
    // sync alongside it for compatibility with older queries/policies.
    const { error } = await supabase.from('post_comments').insert({ post_id: post.id, author_id: currentUserId, user_id: currentUserId, content: text })
    if (!error) {
      setLocalCommentCount(c => c + 1)
      loadComments()
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/app/post/${post.id}`
    const shared = await (async () => {
      if (navigator.share) {
        try { await navigator.share({ url, title: 'SmartzConnect post' }); return true } catch { return false }
      }
      return false
    })()
    if (!shared) {
      try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* ignore */ }
    }
    if (currentUserId) {
      const { error } = await supabase.from('post_shares').insert({ post_id: post.id, user_id: currentUserId, share_type: shared ? 'native' : 'copy_link' })
      if (!error) setLocalShareCount(s => s + 1)
    }
  }

  const handleDelete = async () => {
    setMenuOpen(false)
    if (!isOwn) return
    await supabase.from('posts').update({ is_deleted: true }).eq('id', post.id)
    window.location.reload()
  }

  return (
    <div className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/6 border-gray-200 mb-3 overflow-hidden shadow-sm hover:shadow-md hover:dark:shadow-pink-500/5 transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-10 h-10 rounded-full dark:bg-white/8 bg-gray-100 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
          {post.avatar_url
            ? <img src={post.avatar_url} alt={post.author} className="w-full h-full object-cover" />
            : post.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm dark:text-white text-gray-900">{post.author}</span>
            {post.verified && (
              <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[9px] font-black">✓</span>
              </span>
            )}
            {post.premium && <span className="text-[10px] text-amber-500">👑</span>}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] dark:text-gray-500 text-gray-400">{post.handle}</span>
            {post.location && (
              <>
                <span className="dark:text-gray-700 text-gray-300">·</span>
                <span className="text-[11px] dark:text-gray-500 text-gray-400 flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" />{post.location}
                </span>
              </>
            )}
            <span className="dark:text-gray-700 text-gray-300">·</span>
            <span className="text-[11px] dark:text-gray-500 text-gray-400">{post.time}</span>
          </div>
        </div>
        <div className="relative flex-shrink-0">
          <button onClick={() => setMenuOpen(o => !o)}
            className="w-8 h-8 rounded-lg flex items-center justify-center dark:hover:bg-white/5 hover:bg-gray-100 transition-colors">
            <MoreHorizontal className="w-4 h-4 dark:text-gray-500 text-gray-400" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute z-20 right-0 top-full mt-1 w-44 dark:bg-[#1A1428] bg-white border dark:border-white/10 border-gray-200 rounded-xl shadow-xl overflow-hidden py-1">
                  <button onClick={() => { handleShare(); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold dark:text-gray-300 text-gray-700 dark:hover:bg-white/5 hover:bg-gray-50">
                    <Link2 className="w-3.5 h-3.5" /> Copy link
                  </button>
                  {isOwn ? (
                    <button onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 dark:hover:bg-white/5 hover:bg-gray-50">
                      <Trash2 className="w-3.5 h-3.5" /> Delete post
                    </button>
                  ) : (
                    <button onClick={() => { setReportOpen(true); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 dark:hover:bg-white/5 hover:bg-gray-50">
                      <Flag className="w-3.5 h-3.5" /> Report post
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm dark:text-gray-200 text-gray-800 leading-relaxed whitespace-pre-wrap">{renderContentWithTags(post.content || '')}</p>
      </div>

      {/* Media */}
      {(post.image_url || post.video_url) && (
        <div className="dark:bg-black/20 bg-gray-100 max-h-[420px] overflow-hidden">
          {post.video_url
            ? <video src={post.video_url} className="w-full max-h-[420px] object-cover" controls />
            : <img src={post.image_url!} alt="" className="w-full max-h-[420px] object-cover" />}
        </div>
      )}

      {/* Stats row */}
      {(post.likes > 0 || localCommentCount > 0) && (
        <div className="flex items-center justify-between px-4 py-1.5 text-[11px] dark:text-gray-500 text-gray-400">
          {post.likes > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-love-gradient flex items-center justify-center"><Heart className="w-2.5 h-2.5 text-white fill-white" /></span>
              {post.likes.toLocaleString()}
            </span>
          )}
          {localCommentCount > 0 && <span>{localCommentCount} comments</span>}
        </div>
      )}

      {/* Emoji Reaction bar */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-t dark:border-white/4 border-gray-50 overflow-x-auto scrollbar-none">
        {REACTION_EMOJIS.map(emoji => (
          <button key={emoji} onClick={() => handleReaction(emoji)}
            className={`flex items-center gap-0.5 px-2 py-1 rounded-xl text-sm transition-all flex-shrink-0 ${
              myReaction === emoji
                ? 'dark:bg-pink-500/15 bg-pink-50 scale-110'
                : 'dark:hover:bg-white/5 hover:bg-gray-50 opacity-60 hover:opacity-100'
            }`}>
            <span>{emoji}</span>
            {(reactions[emoji] || 0) > 0 && (
              <span className="text-[10px] font-bold dark:text-gray-400 text-gray-600 ml-0.5">{reactions[emoji]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center px-2 py-1.5 border-t dark:border-white/4 border-gray-50 gap-0.5">
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex-1 justify-center ${
            post.liked ? 'text-brand-pink dark:bg-pink-500/10 bg-pink-50' : 'dark:text-gray-400 text-gray-500 hover:text-brand-pink dark:hover:bg-white/5 hover:bg-gray-50'
          }`}>
          <Heart className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`} />
          <span>Like</span>
        </motion.button>
        <button onClick={toggleComments}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors text-xs font-semibold flex-1 justify-center ${
            commentsOpen ? 'text-brand-pink dark:bg-pink-500/10 bg-pink-50' : 'dark:text-gray-400 text-gray-500 hover:text-brand-pink dark:hover:bg-white/5 hover:bg-gray-50'
          }`}>
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>
        <button onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl dark:text-gray-400 text-gray-500 hover:text-brand-pink dark:hover:bg-white/5 hover:bg-gray-50 transition-colors text-xs font-semibold flex-1 justify-center">
          <Share2 className="w-4 h-4" />
          <span>{copied ? 'Link copied!' : localShareCount > 0 ? `Share (${localShareCount})` : 'Share'}</span>
        </button>
        <button onClick={() => onSave(post.id)}
          className={`p-2 rounded-xl transition-all ${post.saved ? 'text-brand-pink dark:bg-pink-500/10 bg-pink-50' : 'dark:text-gray-400 text-gray-500 dark:hover:bg-white/5 hover:bg-gray-50'}`}>
          <Bookmark className={`w-4 h-4 ${post.saved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Comments panel */}
      <AnimatePresence>
        {commentsOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t dark:border-white/4 border-gray-50 px-4 py-3 space-y-3 overflow-hidden">
            {loadingComments && <p className="text-xs dark:text-gray-500 text-gray-400">Loading comments…</p>}
            {!loadingComments && comments.length === 0 && (
              <p className="text-xs dark:text-gray-500 text-gray-400">No comments yet — be the first to reply.</p>
            )}
            {comments.map(c => (
              <div key={c.id} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full dark:bg-white/8 bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-xs">
                  {c.profile?.avatar_url ? <img src={c.profile.avatar_url} className="w-full h-full object-cover" /> : '👤'}
                </div>
                <div className="flex-1 min-w-0 dark:bg-white/5 bg-gray-50 rounded-xl px-3 py-2">
                  <p className="text-[11px] font-bold dark:text-white text-gray-900">{c.profile?.full_name || 'Anonymous'}</p>
                  <p className="text-xs dark:text-gray-300 text-gray-700 break-words">{c.content}</p>
                </div>
              </div>
            ))}
            {currentUserId && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submitComment() }}
                  placeholder="Write a comment…"
                  className="flex-1 text-xs px-3 py-2 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 focus:outline-none focus:border-brand-pink dark:text-white text-gray-900 placeholder:dark:text-gray-500 placeholder:text-gray-400"
                />
                <button onClick={submitComment} disabled={!commentText.trim()}
                  className="p-2 rounded-xl bg-love-gradient text-white disabled:opacity-40">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ReportBlockModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetUserId={post.authorId}
        targetName={post.author}
      />
    </div>
  )
}

// ── Right Sidebar ─────────────────────────────────────────────────────────────
function RightSidebar() {
  return (
    <aside className="hidden xl:flex flex-col w-72 flex-shrink-0 py-4 pr-4 space-y-3 overflow-y-auto">

      {/* Trending */}
      <div className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-pink" />
            <span className="font-bold text-sm dark:text-white text-gray-900">Trending Now</span>
          </div>
          <span className="text-[10px] dark:text-gray-500 text-gray-400 font-semibold">Today</span>
        </div>
        <div className="space-y-2.5">
          {trendingTopics.map((t, i) => (
            <button key={t.tag} className="w-full flex items-center justify-between group">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-black dark:text-gray-600 text-gray-300 w-4">{i + 1}</span>
                <div className="text-left">
                  <p className="text-xs font-bold dark:text-pink-300 text-pink-600 group-hover:underline">{t.tag}</p>
                  <p className="text-[10px] dark:text-gray-500 text-gray-400">{t.posts} posts</p>
                </div>
              </div>
              <ChevronRight className="w-3 h-3 dark:text-gray-600 text-gray-300 group-hover:text-brand-pink transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Friends */}
      <div className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-pink" />
            <span className="font-bold text-sm dark:text-white text-gray-900">People You May Know</span>
          </div>
        </div>
        <div className="space-y-3">
          {suggestedFriends.map(f => (
            <div key={f.id} className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${f.gradient} flex items-center justify-center text-base flex-shrink-0`}>
                {f.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold dark:text-white text-gray-900 truncate">{f.name}</p>
                <p className="text-[10px] dark:text-gray-500 text-gray-400">{f.mutual} mutual friends</p>
              </div>
              <button className="text-[11px] font-bold text-brand-pink hover:text-brand-rose transition-colors flex-shrink-0">
                + Add
              </button>
            </div>
          ))}
        </div>
        <button className="w-full mt-3 text-xs font-semibold text-brand-pink hover:text-brand-rose transition-colors text-center">
          See all suggestions
        </button>
      </div>

      {/* Upcoming Events */}
      <div className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-brand-pink" />
          <span className="font-bold text-sm dark:text-white text-gray-900">Upcoming Events</span>
        </div>
        <div className="space-y-2.5">
          {upcomingEvents.map(ev => (
            <button key={ev.id} className="w-full flex items-start gap-2.5 text-left group">
              <div className="w-9 h-9 rounded-xl bg-love-gradient flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-white text-[9px] font-black leading-none">{ev.date.split(' ')[0]}</span>
                <span className="text-white text-[11px] font-black leading-none">{ev.date.split(' ')[1]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold dark:text-white text-gray-900 group-hover:text-brand-pink transition-colors truncate">{ev.title}</p>
                <p className="text-[10px] dark:text-gray-500 text-gray-400">{ev.attendees.toLocaleString()} attending</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Birthdays */}
      <div className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-4 h-4 text-brand-pink" />
          <span className="font-bold text-sm dark:text-white text-gray-900">Today's Birthdays</span>
        </div>
        <div className="space-y-2">
          {birthdays.map(b => (
            <div key={b.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{b.avatar}</span>
                <span className="text-xs font-semibold dark:text-white text-gray-900">{b.name}</span>
              </div>
              <button className="text-[11px] font-bold text-brand-pink hover:text-brand-rose transition-colors">
                🎂 Wish
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Online Now */}
      <div className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="font-bold text-sm dark:text-white text-gray-900">Online Now</span>
          <span className="ml-auto text-[11px] font-black text-green-500">{onlineContacts.length}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onlineContacts.map(c => (
            <Link key={c.id} to="/app/matches" className="relative group" title={c.name}>
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${c.gradient} flex items-center justify-center text-sm transition-transform group-hover:scale-110`}>
                {c.avatar}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 dark:border-[#0D0A14] border-white" />
            </Link>
          ))}
        </div>
      </div>

      {/* Sponsored */}
      <div className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4 shadow-sm">
        <p className="text-[9px] font-black uppercase tracking-widest dark:text-gray-600 text-gray-400 mb-2.5">Sponsored</p>
        <div className="w-full h-28 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center mb-3 overflow-hidden">
          <span className="text-white/90 text-3xl">📱</span>
        </div>
        <p className="text-xs font-bold dark:text-white text-gray-900 mb-0.5">SmartzConnect Premium</p>
        <p className="text-[11px] dark:text-gray-400 text-gray-500 mb-2.5">Unlock exclusive features, go ad-free, and more.</p>
        <Link to="/app/subscriptions"
          className="block text-center text-xs font-bold px-3 py-2 rounded-xl bg-love-gradient text-white hover:opacity-90 transition-opacity shadow-md shadow-pink-500/20">
          Upgrade Now
        </Link>
      </div>

      {/* Footer links */}
      <div className="px-1 pb-2">
        <p className="text-[10px] dark:text-gray-600 text-gray-400">
          © 2026 SmartzConnect · <a href="/privacy" className="hover:underline">Privacy</a> · <a href="/terms" className="hover:underline">Terms</a> · <a href="/cookie-policy" className="hover:underline">Cookies</a>
        </p>
      </div>
    </aside>
  )
}

// ── Main FeedPage ─────────────────────────────────────────────────────────────
export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newPostsCount, setNewPostsCount] = useState(0)
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showWelcome, setShowWelcome] = useState(searchParams.get('welcome') === '1')

  useEffect(() => {
    if (showWelcome) {
      const params = new URLSearchParams(searchParams)
      params.delete('welcome')
      setSearchParams(params, { replace: true })
      const t = setTimeout(() => setShowWelcome(false), 6000)
      return () => clearTimeout(t)
    }
  }, [showWelcome])

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: postRows, error: postErr } = await supabase
      .from('posts')
      .select('id, content, image_url, video_url, created_at, likes_count, comments_count, shares_count, location, author_id, visibility')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(30)

    if (postErr) { setError(postErr.message); setLoading(false); return }
    if (!postRows?.length) { setPosts([]); setLoading(false); return }

    const authorIds = [...new Set(postRows.map((p: any) => p.author_id).filter(Boolean))]
    const postIds = postRows.map((p: any) => p.id)

    const [profilesRes, likesRes, savesRes] = await Promise.all([
      authorIds.length
        ? supabase.from('profiles').select('id, full_name, avatar_url, is_verified, subscription_tier, username').in('id', authorIds)
        : { data: [] },
      user?.id
        ? supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds)
        : { data: [] },
      user?.id
        ? supabase.from('post_saves').select('post_id').eq('user_id', user.id).in('post_id', postIds)
        : { data: [] },
    ])

    const profileMap = Object.fromEntries(((profilesRes.data as any[]) || []).map((p: any) => [p.id, p]))
    const likedSet = new Set(((likesRes.data as any[]) || []).map((l: any) => l.post_id))
    const savedSet = new Set(((savesRes.data as any[]) || []).map((s: any) => s.post_id))

    const mapped: Post[] = postRows.map((p: any, i: number) => {
      const profile = profileMap[p.author_id]
      return {
        id: String(p.id),
        author: profile?.full_name || 'Anonymous',
        handle: profile?.username ? `@${profile.username}` : '@user',
        avatar_url: profile?.avatar_url,
        emoji: defaultEmojis[i % defaultEmojis.length],
        location: p.location,
        time: new Date(p.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        content: p.content,
        image_url: p.image_url,
        video_url: p.video_url,
        likes: p.likes_count || 0,
        comments: p.comments_count || 0,
        shares: p.shares_count || 0,
        liked: likedSet.has(p.id),
        saved: savedSet.has(p.id),
        verified: profile?.is_verified,
        premium: profile?.subscription_tier === 'vip' || profile?.subscription_tier === 'premium',
        authorId: p.author_id,
      }
    })

    setPosts(mapped)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  // Realtime: new posts from others + live like counts
  useEffect(() => {
    const postsSub = supabase
      .channel('feed:realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
      }, (payload) => {
        const p = payload.new as any
        if (p.author_id !== user?.id && p.is_deleted !== true) {
          setNewPostsCount(c => c + 1)
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'post_likes',
      }, (payload) => {
        const l = payload.new as any
        if (l.user_id !== user?.id) {
          setPosts(prev => prev.map(p =>
            p.id === String(l.post_id) ? { ...p, likes: p.likes + 1 } : p
          ))
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'post_likes',
      }, (payload) => {
        const l = payload.old as any
        if (l.user_id !== user?.id) {
          setPosts(prev => prev.map(p =>
            p.id === String(l.post_id) && p.likes > 0 ? { ...p, likes: p.likes - 1 } : p
          ))
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'post_comments',
      }, (payload) => {
        const c = payload.new as any
        setPosts(prev => prev.map(p =>
          p.id === String(c.post_id) ? { ...p, comments: p.comments + 1 } : p
        ))
      })
      .subscribe()

    return () => { supabase.removeChannel(postsSub) }
  }, [user?.id])

  const toggleLike = async (id: string) => {
    if (!user?.id) return
    const post = posts.find(p => p.id === id)
    if (!post) return
    const nowLiked = !post.liked
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: nowLiked, likes: nowLiked ? p.likes + 1 : p.likes - 1 } : p))
    if (nowLiked) {
      await supabase.from('post_likes').insert({ post_id: id, user_id: user.id })
    } else {
      await supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', user.id)
    }
  }

  const toggleSave = async (id: string) => {
    if (!user?.id) return
    const post = posts.find(p => p.id === id)
    if (!post) return
    const nowSaved = !post.saved
    setPosts(prev => prev.map(p => p.id === id ? { ...p, saved: nowSaved } : p))
    if (nowSaved) {
      await supabase.from('post_saves').insert({ post_id: id, user_id: user.id })
    } else {
      await supabase.from('post_saves').delete().eq('post_id', id).eq('user_id', user.id)
    }
  }

  return (
    <div className="h-full flex dark:bg-[#0A0710] bg-gray-50">
      {/* Feed column */}
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="max-w-xl mx-auto px-3 pt-4">

          {/* Welcome banner (post email confirmation) */}
          <AnimatePresence>
            {showWelcome && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                className="w-full flex items-center gap-3 p-4 mb-3 rounded-2xl bg-love-gradient text-white shadow-lg shadow-pink-500/30"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <PartyPopper className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-tight">Welcome to SmartzConnect! 🎉</p>
                  <p className="text-xs text-white/85 leading-tight mt-0.5">Your email is confirmed — your account is fully active.</p>
                </div>
                <button
                  onClick={() => setShowWelcome(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stories */}
          <StoriesBar user={user} />

          {/* Compose */}
          <ComposeBox user={user} onPost={() => { setNewPostsCount(0); fetchPosts() }} />

          {/* New posts banner */}
          <AnimatePresence>
            {newPostsCount > 0 && (
              <motion.button
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onClick={() => { setNewPostsCount(0); fetchPosts() }}
                className="w-full flex items-center justify-center gap-2 py-2.5 mb-3 rounded-2xl bg-love-gradient text-white text-sm font-bold shadow-lg shadow-pink-500/30 hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-4 h-4" />
                {newPostsCount} new {newPostsCount === 1 ? 'post' : 'posts'} — tap to refresh
              </motion.button>
            )}
          </AnimatePresence>

          {/* Loading skeletons */}
          {loading && (
            <div>
              {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl dark:bg-red-500/10 bg-red-50 flex items-center justify-center text-3xl">⚠️</div>
              <div>
                <p className="font-bold dark:text-white text-gray-900">Could not load feed</p>
                <p className="text-sm dark:text-gray-400 text-gray-500 max-w-xs mt-1">{error}</p>
              </div>
              <button onClick={fetchPosts}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold shadow-md shadow-pink-500/20">
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-love-gradient flex items-center justify-center text-3xl shadow-lg shadow-pink-500/30">✍️</div>
              <div>
                <p className="font-bold dark:text-white text-gray-900">No posts yet</p>
                <p className="text-sm dark:text-gray-400 text-gray-500 mt-1">Be the first to share something!</p>
              </div>
            </div>
          )}

          {/* Posts */}
          {!loading && !error && posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <PostCard post={post} onLike={toggleLike} onSave={toggleSave} currentUserId={user?.id} />
            </motion.div>
          ))}

          {/* Load more hint */}
          {!loading && !error && posts.length > 0 && (
            <div className="text-center py-6">
              <button onClick={fetchPosts}
                className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 text-sm font-semibold dark:text-gray-400 text-gray-600 hover:text-brand-pink transition-colors">
                <RefreshCw className="w-4 h-4" /> Refresh feed
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <RightSidebar />
    </div>
  )
}
