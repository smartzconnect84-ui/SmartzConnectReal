import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Image, Video, Send, Heart, MessageCircle, Share2, MoreHorizontal,
  Bookmark, TrendingUp, RefreshCw, MapPin, Plus, Smile,
  Users, Calendar, Gift, ChevronRight, Wifi, Camera, X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

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
  likes: number
  comments: number
  shares: number
  liked: boolean
  saved: boolean
  verified?: boolean
  premium?: boolean
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
  expires_at: string
  profile?: { full_name: string | null; avatar_url: string | null; username: string | null }
}

interface ViewStory {
  id: string
  authorId: string
  name: string
  avatar: string | null
  mediaUrl: string
  isOwn?: boolean
}

function StoriesBar({ user }: { user: { id?: string; email?: string } | null }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const storyInputRef = useRef<HTMLInputElement>(null)
  const [dbStories, setDbStories] = useState<DbStory[]>([])
  const [uploading, setUploading] = useState(false)
  const [viewing, setViewing] = useState<ViewStory | null>(null)

  const loadStories = useCallback(async () => {
    const { data } = await supabase
      .from('stories')
      .select('id,author_id,media_url,media_type,expires_at,profiles(full_name,avatar_url,username)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setDbStories(data as any)
  }, [])

  useEffect(() => { loadStories() }, [loadStories])

  const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `stories/${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('user-uploads').upload(path, file, { upsert: false })
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('user-uploads').getPublicUrl(path)
        const isVideo = file.type.startsWith('video/')
        await supabase.from('stories').insert({
          author_id: user.id,
          media_url: urlData.publicUrl,
          media_type: isVideo ? 'video' : 'image',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        await loadStories()
      }
    } catch { /* ignore */ }
    setUploading(false)
  }

  const myStory = dbStories.find(s => s.author_id === user?.id)
  const othersStories = dbStories.filter(s => s.author_id !== user?.id)

  return (
    <>
      {/* Story viewer overlay */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setViewing(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" onClick={() => setViewing(null)}>
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="max-w-sm w-full mx-4 rounded-2xl overflow-hidden">
            {viewing.mediaUrl.match(/\.(mp4|webm|mov)$/i)
              ? <video src={viewing.mediaUrl} autoPlay controls className="w-full" />
              : <img src={viewing.mediaUrl} alt="Story" className="w-full object-contain max-h-[80vh]" />
            }
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

          {/* Own story / add story */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
            <div className="relative">
              <button
                onClick={() => myStory
                  ? setViewing({ id: myStory.id, authorId: myStory.author_id, name: 'Your Story', avatar: null, mediaUrl: myStory.media_url })
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

          {/* Others' stories */}
          {othersStories.map((story, idx) => {
            const profile = (story as any).profiles as { full_name: string | null; avatar_url: string | null; username: string | null } | null
            const name = profile?.full_name || profile?.username || 'User'
            return (
              <button key={story.id}
                onClick={() => setViewing({ id: story.id, authorId: story.author_id, name, avatar: profile?.avatar_url ?? null, mediaUrl: story.media_url })}
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
  const { user: authUser } = useAuth()

  const handlePost = async () => {
    if (!text.trim() || !authUser?.id) return
    setPosting(true)
    const { error } = await supabase.from('posts').insert({ content: text, author_id: authUser.id, visibility: 'public' })
    setPosting(false)
    if (error) return // keep composer open so user can retry
    setText('')
    setOpen(false)
    onPost()
  }

  return (
    <div className="dark:bg-[#0D0A14] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4 mb-3 shadow-sm">
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
                { icon: Image,   label: 'Photo',  color: 'text-green-500' },
                { icon: Video,   label: 'Video',  color: 'text-blue-500' },
                { icon: Smile,   label: 'Feeling', color: 'text-amber-500' },
                { icon: MapPin,  label: 'Check in', color: 'text-red-500' },
              ].map(a => (
                <button key={a.label} onClick={() => setOpen(true)}
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
            <div className="flex items-center justify-between pt-2 border-t dark:border-white/6 border-gray-100">
              <div className="flex gap-1">
                {[Image, Video, MapPin, Smile].map((Icon, i) => (
                  <button key={i} className="p-2 rounded-xl dark:hover:bg-white/5 hover:bg-gray-100 transition-colors">
                    <Icon className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setOpen(false); setText('') }}
                  className="px-3 py-1.5 rounded-xl dark:bg-white/5 bg-gray-100 text-xs font-semibold dark:text-gray-400 text-gray-600">
                  Cancel
                </button>
                <button onClick={handlePost} disabled={!text.trim() || posting}
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

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, onLike, onSave }: { post: Post; onLike: (id: string) => void; onSave: (id: string) => void }) {
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
        <button className="w-8 h-8 rounded-lg flex items-center justify-center dark:hover:bg-white/5 hover:bg-gray-100 transition-colors flex-shrink-0">
          <MoreHorizontal className="w-4 h-4 dark:text-gray-500 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm dark:text-gray-200 text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Stats row */}
      {(post.likes > 0 || post.comments > 0) && (
        <div className="flex items-center justify-between px-4 py-1.5 text-[11px] dark:text-gray-500 text-gray-400">
          {post.likes > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-love-gradient flex items-center justify-center"><Heart className="w-2.5 h-2.5 text-white fill-white" /></span>
              {post.likes.toLocaleString()}
            </span>
          )}
          {post.comments > 0 && <span>{post.comments} comments</span>}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center px-2 py-1.5 border-t dark:border-white/4 border-gray-50 gap-0.5">
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex-1 justify-center ${
            post.liked ? 'text-brand-pink dark:bg-pink-500/10 bg-pink-50' : 'dark:text-gray-400 text-gray-500 hover:text-brand-pink dark:hover:bg-white/5 hover:bg-gray-50'
          }`}>
          <Heart className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`} />
          <span>Like</span>
        </motion.button>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl dark:text-gray-400 text-gray-500 hover:text-brand-pink dark:hover:bg-white/5 hover:bg-gray-50 transition-colors text-xs font-semibold flex-1 justify-center">
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl dark:text-gray-400 text-gray-500 hover:text-brand-pink dark:hover:bg-white/5 hover:bg-gray-50 transition-colors text-xs font-semibold flex-1 justify-center">
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
        <button onClick={() => onSave(post.id)}
          className={`p-2 rounded-xl transition-all ${post.saved ? 'text-brand-pink dark:bg-pink-500/10 bg-pink-50' : 'dark:text-gray-400 text-gray-500 dark:hover:bg-white/5 hover:bg-gray-50'}`}>
          <Bookmark className={`w-4 h-4 ${post.saved ? 'fill-current' : ''}`} />
        </button>
      </div>
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
            <Link key={c.id} to="/app/chat/1" className="relative group" title={c.name}>
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
  const { user } = useAuth()

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: postRows, error: postErr } = await supabase
      .from('posts')
      .select('id, content, created_at, likes_count, comments_count, shares_count, location, author_id, visibility')
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
        likes: p.likes_count || 0,
        comments: p.comments_count || 0,
        shares: p.shares_count || 0,
        liked: likedSet.has(p.id),
        saved: savedSet.has(p.id),
        verified: profile?.is_verified,
        premium: profile?.subscription_tier === 'vip' || profile?.subscription_tier === 'premium',
      }
    })

    setPosts(mapped)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchPosts() }, [fetchPosts])

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

          {/* Stories */}
          <StoriesBar user={user} />

          {/* Compose */}
          <ComposeBox user={user} onPost={fetchPosts} />

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
              <PostCard post={post} onLike={toggleLike} onSave={toggleSave} />
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
