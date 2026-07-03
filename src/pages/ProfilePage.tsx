import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, Edit3, Save, X, MapPin, Briefcase, GraduationCap, Heart, Shield, Crown, Settings, Bell, Lock, LogOut, ChevronRight, Check, Upload } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

const interestOptions = [
  'Music', 'Travel', 'Cooking', 'Art', 'Tech', 'Fitness', 'Fashion', 'Gaming',
  'Books', 'Movies', 'Dance', 'Photography', 'Business', 'Sports', 'Nature', 'Food',
  'Comedy', 'Education', 'Spirituality', 'Family',
]

const photos = ['🌅', '🎵', '🌍', '💃', '🍛', '🎨', '🏖️', '🌺']

const settingsItems = [
  { icon: Bell,    label: 'Notifications',    desc: 'Manage push & email alerts',  color: 'text-blue-500' },
  { icon: Lock,    label: 'Privacy & Safety', desc: 'Control who sees your profile', color: 'text-emerald-500' },
  { icon: Shield,  label: 'Verification',     desc: 'Verify your identity for a badge', color: 'text-purple-500' },
  { icon: Crown,   label: 'Subscription',     desc: 'Manage your plan',            color: 'text-amber-500' },
  { icon: Settings,label: 'Account Settings', desc: 'Email, password, linked accounts', color: 'text-gray-500' },
]

interface ProfileStats {
  posts: number
  matches: number
  likes: number
  rating: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'photos' | 'settings'>('profile')
  const [editing, setEditing] = useState(false)
  const [interests, setInterests] = useState(['Music', 'Travel', 'Art', 'Cooking', 'Tech', 'Fashion'])
  const [saved, setSaved] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [userPhotos, setUserPhotos] = useState<string[]>([])
  const [_reportOpen, _setReportOpen] = useState(false)
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    const fetchStats = async () => {
      const [postsRes, matchesRes, likesRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
        supabase.from('matches').select('id', { count: 'exact', head: true })
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
        supabase.from('post_likes').select('id', { count: 'exact', head: true })
          .in('post_id', (await supabase.from('posts').select('id').eq('author_id', user.id)).data?.map((p: any) => p.id) ?? []),
      ])
      setProfileStats({
        posts: postsRes.count ?? 0,
        matches: matchesRes.count ?? 0,
        likes: likesRes.count ?? 0,
        rating: '5.0',
      })
    }
    fetchStats()
  }, [user])

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
        setAvatarUrl(data.publicUrl + '?t=' + Date.now())
      }
    } catch { /* ignore upload error */ }
    setUploading(false)
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
        setUserPhotos(prev => [...prev, data.publicUrl])
      }
    } catch { /* ignore upload error */ }
    setPhotoUploading(false)
  }

  const displayName = (user as any)?.name || user?.email?.split('@')[0] || 'Amara Kollie'
  const [form, setForm] = useState({
    name: displayName,
    bio: 'Fashion designer & creative soul from Monrovia 🇱🇷 Looking for genuine connection and adventure 💕',
    location: 'Monrovia, Liberia',
    job: 'Fashion Designer',
    education: 'University of Liberia',
    goal: 'Long-term relationship',
    age: '24',
    height: '5\'6"',
    languages: 'English, Liberian English',
  })

  const handleSave = () => {
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2500)
  }

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : prev.length < 10 ? [...prev, interest] : prev
    )
  }

  return (
    <div className="h-full flex flex-col dark:bg-[#0D0A14] bg-gray-50">

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 dark:bg-[#130E1E] bg-white border-b dark:border-white/6 border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-black dark:text-white text-gray-900">My Profile</h1>
          <div className="flex items-center gap-2">
            {saved && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
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
                  <button onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-love-gradient text-white text-xs font-bold shadow-md shadow-pink-500/20">
                    <Save className="w-3.5 h-3.5" /> Save
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
          <div className="p-4 sm:p-6 space-y-4">

            {/* Avatar + name */}
            <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-5 border dark:border-white/6 border-gray-100 flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-love-gradient flex items-center justify-center text-4xl shadow-lg shadow-pink-500/20 overflow-hidden">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    : <span>👩🏾</span>
                  }
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <button onClick={() => avatarInputRef.current?.click()} disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-love-gradient flex items-center justify-center shadow-md disabled:opacity-50">
                  {uploading ? <div className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
                </button>
              </div>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full font-display font-black text-xl dark:text-white text-gray-900 bg-transparent border-b dark:border-white/20 border-gray-300 focus:outline-none focus:border-brand-pink pb-0.5 mb-1" />
                ) : (
                  <h2 className="font-display font-black text-xl dark:text-white text-gray-900">{form.name}</h2>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-xs dark:text-gray-400 text-gray-500">
                    <MapPin className="w-3 h-3 text-brand-pink" /> {form.location}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400">
                    <Shield className="w-2.5 h-2.5" /> Verified
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400">
                    <Crown className="w-2.5 h-2.5" /> Premium
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { emoji: '❤️', label: 'Likes',   value: profileStats ? String(profileStats.likes)   : '—' },
                { emoji: '📝', label: 'Posts',   value: profileStats ? String(profileStats.posts)   : '—' },
                { emoji: '💕', label: 'Matches', value: profileStats ? String(profileStats.matches) : '—' },
                { emoji: '⭐', label: 'Rating',  value: profileStats ? profileStats.rating          : '—' },
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
                  className="w-full text-sm dark:text-white text-gray-900 bg-transparent border dark:border-white/10 border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-brand-pink resize-none" />
              ) : (
                <p className="text-sm dark:text-gray-300 text-gray-700 leading-relaxed">{form.bio}</p>
              )}
            </div>

            {/* Details */}
            <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-100">
              <p className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider mb-3">Details</p>
              <div className="space-y-3">
                {[
                  { icon: Briefcase,     label: 'Occupation',        key: 'job' as const },
                  { icon: GraduationCap, label: 'Education',         key: 'education' as const },
                  { icon: Heart,         label: 'Looking for',       key: 'goal' as const },
                  { icon: MapPin,        label: 'Location',          key: 'location' as const },
                ].map(({ icon: Icon, label, key }) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-brand-pink" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] dark:text-gray-500 text-gray-400">{label}</p>
                      {editing ? (
                        <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                          className="text-sm dark:text-white text-gray-900 bg-transparent border-b dark:border-white/10 border-gray-200 focus:outline-none focus:border-brand-pink w-full" />
                      ) : (
                        <p className="text-sm dark:text-white text-gray-900 truncate">{form[key]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider">Interests</p>
                {editing && <p className="text-[10px] dark:text-gray-500 text-gray-400">{interests.length}/10 selected</p>}
              </div>
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
        )}

        {/* ── PHOTOS TAB ── */}
        {activeTab === 'photos' && (
          <div className="p-4 sm:p-6">
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider mb-3">My Photos ({photos.length}/12)</p>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((emoji, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className="aspect-square dark:bg-gradient-to-br dark:from-pink-500/15 dark:to-purple-600/15 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl flex items-center justify-center text-4xl border dark:border-white/6 border-pink-100 cursor-pointer hover:border-brand-pink transition-all group relative overflow-hidden">
                  {emoji}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                    <X className="w-5 h-5 text-white" />
                  </div>
                  {i === 0 && (
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-love-gradient text-white text-[8px] font-black">MAIN</div>
                  )}
                </motion.div>
              ))}
              {userPhotos.map((url, i) => (
                <motion.div key={url} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="aspect-square rounded-2xl overflow-hidden border dark:border-white/6 border-gray-100 group relative">
                  <img src={url} alt={`Photo ${i}`} className="w-full h-full object-cover" />
                  <button onClick={() => setUserPhotos(prev => prev.filter(u => u !== url))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </motion.div>
              ))}
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <div onClick={() => photoInputRef.current?.click()}
                className="aspect-square dark:bg-white/5 bg-gray-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed dark:border-white/10 border-gray-300 cursor-pointer hover:border-brand-pink transition-all group">
                {photoUploading
                  ? <div className="w-5 h-5 border-2 border-brand-pink/40 border-t-brand-pink rounded-full animate-spin" />
                  : <>
                      <Upload className="w-6 h-6 dark:text-gray-600 text-gray-400 mb-1 group-hover:text-brand-pink transition-colors" />
                      <span className="text-[10px] dark:text-gray-500 text-gray-400 group-hover:text-brand-pink transition-colors">Upload Photo</span>
                    </>
                }
              </div>
            </div>
            <p className="text-xs dark:text-gray-500 text-gray-400 mt-3 text-center">Tap a photo to set as main or remove it</p>
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

            {/* Danger zone */}
            <div className="dark:bg-red-500/5 bg-red-50 rounded-2xl p-4 border dark:border-red-500/15 border-red-200 mt-4">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Danger Zone</p>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 py-2.5 text-sm text-red-400 hover:text-red-500 transition-colors">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
                <button className="w-full flex items-center gap-3 py-2.5 text-sm text-red-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" /> Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
