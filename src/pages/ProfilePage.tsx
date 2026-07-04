import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Camera, Edit3, Save, X, MapPin, Briefcase, GraduationCap, Heart,
  Shield, Crown, Settings, Bell, Lock, LogOut, ChevronRight, Check,
  Upload, UserPlus, UserMinus, Image as ImageIcon, Trash2, AlertTriangle
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

const interestOptions = [
  'Music', 'Travel', 'Cooking', 'Art', 'Tech', 'Fitness', 'Fashion', 'Gaming',
  'Books', 'Movies', 'Dance', 'Photography', 'Business', 'Sports', 'Nature', 'Food',
  'Comedy', 'Education', 'Spirituality', 'Family',
]

const settingsItems = [
  { icon: Bell,     label: 'Notifications',    desc: 'Manage push & email alerts',       color: 'text-blue-500',    key: 'notifications' },
  { icon: Lock,     label: 'Privacy & Safety', desc: 'Control who sees your profile',    color: 'text-emerald-500', key: 'privacy' },
  { icon: Shield,   label: 'Verification',     desc: 'Verify your identity for a badge', color: 'text-purple-500',  key: 'verification' },
  { icon: Crown,    label: 'Subscription',     desc: 'Manage your plan',                 color: 'text-amber-500',   key: 'subscription' },
  { icon: Settings, label: 'Account Settings', desc: 'Email, password, linked accounts', color: 'text-gray-500',   key: 'account' },
]

interface ProfileForm {
  full_name: string
  bio: string
  location: string
  occupation: string
  education: string
  relationship_goal: string
  height: string
  languages: string
  website: string
}

interface ProfileStats {
  posts: number
  followers: number
  following: number
  likes: number
}

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'profile' | 'photos' | 'settings'>('profile')
  const [editing, setEditing] = useState(false)
  const [interests, setInterests] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [userPhotos, setUserPhotos] = useState<string[]>([])
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [signOutConfirm, setSignOutConfirm] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<ProfileForm>({
    full_name: '',
    bio: '',
    location: '',
    occupation: '',
    education: '',
    relationship_goal: '',
    height: '',
    languages: '',
    website: '',
  })

  const loadProfile = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('full_name,bio,location,occupation,education,relationship_goal,height,languages,website,avatar_url,cover_url,interests,is_verified,is_premium')
      .eq('id', user.id)
      .single()
    if (data) {
      setForm({
        full_name: data.full_name || user.email?.split('@')[0] || '',
        bio: data.bio || '',
        location: data.location || '',
        occupation: data.occupation || '',
        education: data.education || '',
        relationship_goal: data.relationship_goal || '',
        height: data.height || '',
        languages: Array.isArray(data.languages) ? data.languages.join(', ') : (data.languages || ''),
        website: data.website || '',
      })
      setAvatarUrl(data.avatar_url || null)
      setCoverUrl(data.cover_url || null)
      setInterests(data.interests || [])
      setIsVerified(data.is_verified || false)
      setIsPremium(data.is_premium || false)
    }
  }, [user])

  const loadStats = useCallback(async () => {
    if (!user) return
    const [postsRes, followersRes, followingRes, likesRes] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', user.id),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', user.id),
      supabase.from('post_likes').select('id', { count: 'exact', head: true })
        .in('post_id',
          (await supabase.from('posts').select('id').eq('author_id', user.id)).data?.map((p: any) => p.id) ?? []
        ),
    ])
    setProfileStats({
      posts: postsRes.count ?? 0,
      followers: followersRes.count ?? 0,
      following: followingRes.count ?? 0,
      likes: likesRes.count ?? 0,
    })
  }, [user])

  const loadPhotos = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.storage.from('user-uploads').list(`photos/${user.id}`, { limit: 30 })
    if (data) {
      const urls = data.map(f =>
        supabase.storage.from('user-uploads').getPublicUrl(`photos/${user.id}/${f.name}`).data.publicUrl
      )
      setUserPhotos(urls)
    }
  }, [user])

  useEffect(() => {
    loadProfile()
    loadStats()
    loadPhotos()
  }, [loadProfile, loadStats, loadPhotos])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      const { error } = await supabase.storage.from('user-uploads').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('user-uploads').getPublicUrl(path)
        const url = data.publicUrl + '?t=' + Date.now()
        setAvatarUrl(url)
        await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
      }
    } catch { /* ignore */ }
    setUploading(false)
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setCoverUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `covers/${user.id}.${ext}`
      const { error } = await supabase.storage.from('user-uploads').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('user-uploads').getPublicUrl(path)
        const url = data.publicUrl + '?t=' + Date.now()
        setCoverUrl(url)
        await supabase.from('profiles').update({ cover_url: data.publicUrl }).eq('id', user.id)
      }
    } catch { /* ignore */ }
    setCoverUploading(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setPhotoUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `photos/${user.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('user-uploads').upload(path, file, { upsert: false })
      if (!error) {
        const { data } = supabase.storage.from('user-uploads').getPublicUrl(path)
        setUserPhotos(prev => [data.publicUrl, ...prev])
      }
    } catch { /* ignore */ }
    setPhotoUploading(false)
  }

  const handleDeletePhoto = async (url: string) => {
    if (!user) return
    const parts = url.split(`/user-uploads/`)
    if (parts.length < 2) { setUserPhotos(prev => prev.filter(u => u !== url)); return }
    const filePath = parts[1].split('?')[0]
    await supabase.storage.from('user-uploads').remove([filePath])
    setUserPhotos(prev => prev.filter(u => u !== url))
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const updateData = {
      full_name: form.full_name,
      bio: form.bio,
      location: form.location,
      occupation: form.occupation,
      education: form.education,
      relationship_goal: form.relationship_goal,
      height: form.height,
      languages: form.languages ? form.languages.split(',').map(l => l.trim()).filter(Boolean) : [],
      website: form.website,
      interests,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('profiles').update(updateData).eq('id', user.id)
    setSaving(false)
    if (!error) {
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    await supabase.from('profiles').update({ is_active: false, is_banned: false }).eq('id', user.id)
    await supabase.auth.signOut()
    navigate('/login')
  }

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : prev.length < 10 ? [...prev, interest] : prev
    )
  }

  const displayName = form.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <div className="h-full flex flex-col dark:bg-[#0D0A14] bg-gray-50">

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 dark:bg-[#130E1E] bg-white border-b dark:border-white/6 border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-black dark:text-white text-gray-900">My Profile</h1>
          <div className="flex items-center gap-2">
            {saved && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-500">Saved!</span>
              </motion.div>
            )}
            {activeTab === 'profile' && (
              editing ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)}
                    className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-md shadow-pink-500/20 disabled:opacity-60">
                    {saving
                      ? <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                      : <Save className="w-3.5 h-3.5" />
                    }
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 dark:text-gray-300 text-gray-700 text-xs font-semibold hover:text-brand-pink transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              )
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 dark:bg-white/5 bg-gray-100 rounded-xl p-1 mt-3">
          {(['profile', 'photos', 'settings'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === tab ? 'bg-love-gradient text-white shadow-md' : 'dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              {tab === 'profile' ? '👤 Profile' : tab === 'photos' ? '📸 Photos' : '⚙️ Settings'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <div className="space-y-4">

            {/* Cover photo + avatar */}
            <div className="relative">
              {/* Cover photo */}
              <div className="relative h-36 sm:h-48 dark:bg-gradient-to-br dark:from-pink-900/40 dark:to-purple-900/40 bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
                {coverUrl
                  ? <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl opacity-20">🌅</span>
                    </div>
                }
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                <button onClick={() => coverInputRef.current?.click()} disabled={coverUploading}
                  className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white text-xs font-semibold backdrop-blur-sm transition-all disabled:opacity-50">
                  {coverUploading
                    ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                    : <ImageIcon className="w-3 h-3" />
                  }
                  {coverUploading ? 'Uploading…' : 'Change Cover'}
                </button>
              </div>

              {/* Avatar overlapping cover */}
              <div className="px-4 sm:px-6">
                <div className="relative -mt-10 w-20 h-20 rounded-2xl bg-love-gradient flex items-center justify-center text-4xl shadow-lg shadow-pink-500/20 overflow-hidden border-4 dark:border-[#0D0A14] border-white">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    : <span>👤</span>
                  }
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <button onClick={() => avatarInputRef.current?.click()} disabled={uploading}
                    className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploading
                      ? <div className="w-4 h-4 border border-white/50 border-t-white rounded-full animate-spin" />
                      : <Camera className="w-5 h-5 text-white" />
                    }
                  </button>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 space-y-4">
              {/* Name + badges */}
              <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-100">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    {editing ? (
                      <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                        placeholder="Your full name"
                        className="w-full font-display font-black text-xl dark:text-white text-gray-900 bg-transparent border-b dark:border-white/20 border-gray-300 focus:outline-none focus:border-brand-pink pb-0.5" />
                    ) : (
                      <h2 className="font-display font-black text-xl dark:text-white text-gray-900">{displayName}</h2>
                    )}
                    <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">@{user?.email?.split('@')[0] ?? 'user'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isVerified && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400">
                        <Shield className="w-2.5 h-2.5" /> Verified
                      </span>
                    )}
                    {isPremium && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400">
                        <Crown className="w-2.5 h-2.5" /> Premium
                      </span>
                    )}
                  </div>
                </div>
                {form.location && (
                  <p className="flex items-center gap-1 text-xs dark:text-gray-400 text-gray-500">
                    <MapPin className="w-3 h-3 text-brand-pink" />{form.location}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { emoji: '📝', label: 'Posts',     value: profileStats ? String(profileStats.posts)     : '—' },
                  { emoji: '👥', label: 'Followers',  value: profileStats ? String(profileStats.followers)  : '—' },
                  { emoji: '➡️', label: 'Following',  value: profileStats ? String(profileStats.following)  : '—' },
                  { emoji: '❤️', label: 'Likes',      value: profileStats ? String(profileStats.likes)      : '—' },
                ].map(s => (
                  <div key={s.label} className="dark:bg-[#130E1E] bg-white rounded-2xl p-3 text-center border dark:border-white/6 border-gray-100">
                    <p className="text-lg mb-0.5">{s.emoji}</p>
                    <p className="font-display font-black text-base dark:text-white text-gray-900">{s.value}</p>
                    <p className="text-[9px] dark:text-gray-500 text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Bio */}
              <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-100">
                <p className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider mb-2">About Me</p>
                {editing ? (
                  <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3}
                    placeholder="Write something about yourself…"
                    className="w-full text-sm dark:text-white text-gray-900 bg-transparent border dark:border-white/10 border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-brand-pink resize-none placeholder:dark:text-gray-600 placeholder:text-gray-400" />
                ) : (
                  <p className="text-sm dark:text-gray-300 text-gray-700 leading-relaxed">
                    {form.bio || <span className="dark:text-gray-600 text-gray-400 italic">No bio yet — tap Edit to add one</span>}
                  </p>
                )}
              </div>

              {/* Details */}
              <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-100">
                <p className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider mb-3">Details</p>
                <div className="space-y-3">
                  {([
                    { icon: Briefcase,      label: 'Occupation',    key: 'occupation' as const,        placeholder: 'Your job or role' },
                    { icon: GraduationCap, label: 'Education',     key: 'education' as const,         placeholder: 'School or university' },
                    { icon: Heart,          label: 'Looking for',   key: 'relationship_goal' as const, placeholder: 'e.g. Long-term, Friendship' },
                    { icon: MapPin,         label: 'Location',      key: 'location' as const,          placeholder: 'City, Country' },
                  ] as const).map(({ icon: Icon, label, key, placeholder }) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-brand-pink" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] dark:text-gray-500 text-gray-400">{label}</p>
                        {editing ? (
                          <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                            placeholder={placeholder}
                            className="text-sm dark:text-white text-gray-900 bg-transparent border-b dark:border-white/10 border-gray-200 focus:outline-none focus:border-brand-pink w-full placeholder:dark:text-gray-600 placeholder:text-gray-400" />
                        ) : (
                          <p className="text-sm dark:text-white text-gray-900 truncate">
                            {form[key] || <span className="dark:text-gray-600 text-gray-400">—</span>}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {editing && (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-pink text-xs">📏</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] dark:text-gray-500 text-gray-400">Height</p>
                          <input value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                            placeholder="e.g. 168cm or 5ft6"
                            className="text-sm dark:text-white text-gray-900 bg-transparent border-b dark:border-white/10 border-gray-200 focus:outline-none focus:border-brand-pink w-full placeholder:dark:text-gray-600 placeholder:text-gray-400" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-pink text-xs">🌐</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] dark:text-gray-500 text-gray-400">Languages</p>
                          <input value={form.languages} onChange={e => setForm(f => ({ ...f, languages: e.target.value }))}
                            placeholder="e.g. English, French"
                            className="text-sm dark:text-white text-gray-900 bg-transparent border-b dark:border-white/10 border-gray-200 focus:outline-none focus:border-brand-pink w-full placeholder:dark:text-gray-600 placeholder:text-gray-400" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-pink text-xs">🔗</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] dark:text-gray-500 text-gray-400">Website</p>
                          <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                            placeholder="https://yoursite.com"
                            className="text-sm dark:text-white text-gray-900 bg-transparent border-b dark:border-white/10 border-gray-200 focus:outline-none focus:border-brand-pink w-full placeholder:dark:text-gray-600 placeholder:text-gray-400" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Interests */}
              <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider">Interests</p>
                  {editing && <p className="text-[10px] dark:text-gray-500 text-gray-400">{interests.length}/10 selected</p>}
                </div>
                {(editing ? interestOptions : interests).length === 0 && !editing && (
                  <p className="text-sm dark:text-gray-600 text-gray-400 italic">No interests added yet</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {(editing ? interestOptions : interests).map(interest => {
                    const selected = interests.includes(interest)
                    return (
                      <button key={interest} onClick={() => editing && toggleInterest(interest)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          selected
                            ? 'bg-love-soft text-brand-pink border border-pink-500/30'
                            : editing
                              ? 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 border dark:border-white/8 border-gray-200 hover:border-pink-300'
                              : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600'
                        } ${editing ? 'cursor-pointer' : 'cursor-default'}`}>
                        {interest}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PHOTOS TAB ── */}
        {activeTab === 'photos' && (
          <div className="p-4 sm:p-6">
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider mb-3">
              My Photos ({userPhotos.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <div onClick={() => photoInputRef.current?.click()}
                className="aspect-square dark:bg-white/5 bg-gray-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed dark:border-white/10 border-gray-300 cursor-pointer hover:border-brand-pink transition-all group">
                {photoUploading
                  ? <div className="w-5 h-5 border-2 border-brand-pink/40 border-t-brand-pink rounded-full animate-spin" />
                  : <>
                      <Upload className="w-6 h-6 dark:text-gray-600 text-gray-400 mb-1 group-hover:text-brand-pink transition-colors" />
                      <span className="text-[10px] dark:text-gray-500 text-gray-400 group-hover:text-brand-pink transition-colors">Add Photo</span>
                    </>
                }
              </div>
              {userPhotos.map((url, i) => (
                <motion.div key={url} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="aspect-square rounded-2xl overflow-hidden border dark:border-white/6 border-gray-100 group relative">
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => handleDeletePhoto(url)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80">
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                  {i === 0 && (
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-love-gradient text-white text-[8px] font-black">MAIN</div>
                  )}
                </motion.div>
              ))}
            </div>
            {userPhotos.length === 0 && (
              <p className="text-center text-xs dark:text-gray-500 text-gray-400 mt-6">
                No photos yet — tap Add Photo to upload your first
              </p>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === 'settings' && (
          <div className="p-4 sm:p-6 space-y-3">
            {settingsItems.map((item, i) => (
              <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="w-full flex items-center gap-3 p-4 dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-100 hover:border-brand-pink/30 hover:shadow-md transition-all group text-left">
                <div className="w-10 h-10 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-love-soft transition-colors">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold dark:text-white text-gray-900">{item.label}</p>
                  <p className="text-xs dark:text-gray-400 text-gray-500">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 dark:text-gray-500 text-gray-400 group-hover:text-brand-pink transition-colors flex-shrink-0" />
              </motion.button>
            ))}

            {/* Account info */}
            <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-100">
              <p className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider mb-3">Account</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs dark:text-gray-400 text-gray-500">Email</span>
                  <span className="text-xs font-semibold dark:text-white text-gray-900 truncate max-w-[180px]">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs dark:text-gray-400 text-gray-500">User ID</span>
                  <span className="text-[10px] font-mono dark:text-gray-500 text-gray-400 truncate max-w-[140px]">{user?.id?.slice(0, 16)}…</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs dark:text-gray-400 text-gray-500">Member since</span>
                  <span className="text-xs font-semibold dark:text-white text-gray-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger zone */}
            <div className="dark:bg-red-500/5 bg-red-50 rounded-2xl p-4 border dark:border-red-500/15 border-red-200">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Danger Zone</p>
              <div className="space-y-1">
                {!signOutConfirm ? (
                  <button onClick={() => setSignOutConfirm(true)}
                    className="w-full flex items-center gap-3 py-2.5 px-2 rounded-xl text-sm text-red-400 hover:text-red-500 hover:dark:bg-red-500/10 hover:bg-red-100 transition-all">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                ) : (
                  <div className="flex gap-2 items-center py-1">
                    <span className="text-xs dark:text-gray-300 text-gray-700 flex-1">Sign out of your account?</span>
                    <button onClick={handleSignOut} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold">Yes, sign out</button>
                    <button onClick={() => setSignOutConfirm(false)} className="px-3 py-1.5 rounded-lg dark:bg-white/5 bg-gray-200 text-xs font-bold dark:text-gray-300 text-gray-700">Cancel</button>
                  </div>
                )}

                {!deleteConfirm ? (
                  <button onClick={() => setDeleteConfirm(true)}
                    className="w-full flex items-center gap-3 py-2.5 px-2 rounded-xl text-sm text-red-400 hover:text-red-500 hover:dark:bg-red-500/10 hover:bg-red-100 transition-all">
                    <AlertTriangle className="w-4 h-4" /> Deactivate Account
                  </button>
                ) : (
                  <div className="dark:bg-red-500/10 bg-red-100 rounded-xl p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs dark:text-gray-300 text-gray-700">This will deactivate your account. Your data will be preserved and you can contact support to reactivate.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleDeleteAccount} className="flex-1 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold">Deactivate</button>
                      <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-1.5 rounded-lg dark:bg-white/10 bg-white text-xs font-bold dark:text-gray-300 text-gray-700">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
