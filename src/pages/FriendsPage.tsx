import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, UserPlus, UserMinus, Users, UserCheck, Loader2, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { notifyUser } from '@/lib/notify'

interface Profile {
  id: string
  full_name: string
  username: string
  avatar_url: string | null
  occupation: string | null
  location: string | null
  is_verified: boolean
  is_premium: boolean
  followers_count?: number
  isFollowing?: boolean
}

function Avatar({ profile, size = 10 }: { profile: Profile; size?: number }) {
  const sizeClass = size === 10 ? 'w-10 h-10' : size === 12 ? 'w-12 h-12' : 'w-10 h-10'
  return (
    <div className={`${sizeClass} rounded-full bg-love-gradient flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0`}>
      {profile.avatar_url
        ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
        : <span>{(profile.full_name || profile.username || '?')[0]?.toUpperCase()}</span>
      }
    </div>
  )
}

function ProfileCard({ profile, onFollow, currentUserId }: { profile: Profile; onFollow: (id: string, following: boolean) => void; currentUserId?: string }) {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleToggle = async () => {
    setLoading(true)
    await onFollow(profile.id, profile.isFollowing ?? false)
    setLoading(false)
  }

  const goToProfile = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (profile.id !== currentUserId) navigate(`/app/profile/${profile.id}`)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-100">
      <div onClick={goToProfile} className="cursor-pointer flex-shrink-0">
        <Avatar profile={profile} size={12} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold dark:text-white text-gray-900 truncate">
            {profile.full_name || profile.username || 'Unknown'}
          </p>
          {profile.is_verified && (
            <span className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[8px] font-black">✓</span>
            </span>
          )}
          {profile.is_premium && <span className="text-[10px] text-amber-500 flex-shrink-0">👑</span>}
        </div>
        <p className="text-[11px] dark:text-gray-500 text-gray-400 truncate">
          {profile.occupation || profile.location || `@${profile.username || 'user'}`}
        </p>
      </div>
      {/* Message button — navigates to direct chat */}
      <button
        onClick={() => navigate(`/app/chat/${profile.id}`)}
        title="Message"
        className="w-8 h-8 rounded-xl dark:bg-purple-500/10 bg-purple-50 border dark:border-purple-500/20 border-purple-100 flex items-center justify-center hover:bg-purple-500/20 transition-colors flex-shrink-0">
        <MessageCircle className="w-3.5 h-3.5 text-purple-500" />
      </button>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 disabled:opacity-60 ${
          profile.isFollowing
            ? 'dark:bg-white/8 bg-gray-100 dark:text-gray-300 text-gray-700 hover:bg-red-500/10 hover:text-red-400'
            : 'bg-love-gradient text-white shadow-md shadow-pink-500/20'
        }`}>
        {loading
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : profile.isFollowing
            ? <><UserMinus className="w-3 h-3" /> Unfollow</>
            : <><UserPlus className="w-3 h-3" /> Follow</>
        }
      </button>
    </motion.div>
  )
}

export default function FriendsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'following' | 'followers' | 'discover'>('discover')
  const [search, setSearch] = useState('')
  const [following, setFollowing] = useState<Profile[]>([])
  const [followers, setFollowers] = useState<Profile[]>([])
  const [suggested, setSuggested] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

  const loadFollowingIds = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
    setFollowingIds(new Set(data?.map((f: any) => f.following_id) ?? []))
  }, [user])

  const loadFollowing = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data: rows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
    const ids = rows?.map((r: any) => r.following_id) ?? []
    if (ids.length === 0) { setFollowing([]); setLoading(false); return }
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,full_name,username,avatar_url,occupation,location,is_verified,is_premium')
      .in('id', ids)
    setFollowing((profiles ?? []).map((p: any) => ({ ...p, isFollowing: true })))
    setLoading(false)
  }, [user])

  const loadFollowers = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data: rows } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', user.id)
    const ids = rows?.map((r: any) => r.follower_id) ?? []
    if (ids.length === 0) { setFollowers([]); setLoading(false); return }
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,full_name,username,avatar_url,occupation,location,is_verified,is_premium')
      .in('id', ids)
    setFollowers((profiles ?? []).map((p: any) => ({ ...p, isFollowing: followingIds.has(p.id) })))
    setLoading(false)
  }, [user, followingIds])

  const loadSuggested = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const excludeIds = [user.id, ...Array.from(followingIds)]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,full_name,username,avatar_url,occupation,location,is_verified,is_premium')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .limit(30)
    setSuggested((profiles ?? []).map((p: any) => ({ ...p, isFollowing: false })))
    setLoading(false)
  }, [user, followingIds])

  useEffect(() => {
    loadFollowingIds()
  }, [loadFollowingIds])

  useEffect(() => {
    if (activeTab === 'following') loadFollowing()
    else if (activeTab === 'followers') loadFollowers()
    else loadSuggested()
  }, [activeTab, loadFollowing, loadFollowers, loadSuggested])

  const handleFollow = async (targetId: string, isCurrentlyFollowing: boolean) => {
    if (!user) return
    if (isCurrentlyFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', user.id).eq('following_id', targetId)
      setFollowingIds(prev => { const s = new Set(prev); s.delete(targetId); return s })
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId })
      setFollowingIds(prev => new Set([...prev, targetId]))

      // Persist + push in one call (fire-and-forget)
      const myProfile = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      const myName = myProfile.data?.full_name || 'Someone'
      notifyUser({
        userId: targetId,
        type: 'follow',
        title: `${myName} followed you`,
        message: 'You have a new follower on SmartzConnect!',
        actionUrl: `/app/profile/${user.id}`,
        emoji: '👤',
      }).catch(() => {})
    }
    const toggle = (p: Profile) => p.id === targetId ? { ...p, isFollowing: !isCurrentlyFollowing } : p
    setFollowing(prev => prev.map(toggle))
    setFollowers(prev => prev.map(toggle))
    setSuggested(prev => prev.map(toggle))
  }

  const getList = () => {
    const list = activeTab === 'following' ? following : activeTab === 'followers' ? followers : suggested
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(p =>
      (p.full_name || '').toLowerCase().includes(q) ||
      (p.username || '').toLowerCase().includes(q) ||
      (p.occupation || '').toLowerCase().includes(q) ||
      (p.location || '').toLowerCase().includes(q)
    )
  }

  return (
    <div className="h-full flex flex-col dark:bg-[#0D0A14] bg-gray-50">

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 dark:bg-[#130E1E] bg-white border-b dark:border-white/6 border-gray-100 flex-shrink-0">
        <h1 className="font-display text-xl font-black dark:text-white text-gray-900 mb-4">Friends & Follows</h1>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search people…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 placeholder:dark:text-gray-500 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 dark:bg-white/5 bg-gray-100 rounded-xl p-1">
          {([
            { key: 'discover', label: '🔍 Discover', count: null },
            { key: 'following', label: '➡️ Following', count: following.length },
            { key: 'followers', label: '👥 Followers', count: followers.length },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${activeTab === tab.key ? 'bg-love-gradient text-white shadow-md' : 'dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeTab === tab.key ? 'bg-white/20 text-white' : 'dark:bg-white/10 bg-gray-200'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-6 h-6 text-brand-pink animate-spin" />
            <p className="text-sm dark:text-gray-500 text-gray-400">Loading…</p>
          </div>
        ) : getList().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            {activeTab === 'following'
              ? <><UserCheck className="w-12 h-12 dark:text-gray-700 text-gray-300" />
                  <p className="text-sm font-semibold dark:text-gray-500 text-gray-400">You're not following anyone yet</p>
                  <button onClick={() => setActiveTab('discover')} className="mt-1 text-xs font-bold text-brand-pink">Discover people →</button>
                </>
              : activeTab === 'followers'
                ? <><Users className="w-12 h-12 dark:text-gray-700 text-gray-300" />
                    <p className="text-sm font-semibold dark:text-gray-500 text-gray-400">No followers yet</p>
                    <p className="text-xs dark:text-gray-600 text-gray-400 text-center">Share your profile link to grow your following</p>
                  </>
                : <><UserPlus className="w-12 h-12 dark:text-gray-700 text-gray-300" />
                    <p className="text-sm font-semibold dark:text-gray-500 text-gray-400">No people to suggest right now</p>
                    <p className="text-xs dark:text-gray-600 text-gray-400 text-center">Invite friends to join SmartzConnect!</p>
                  </>
            }
          </div>
        ) : (
          <div className="space-y-2">
            {activeTab === 'discover' && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-px dark:bg-white/6 bg-gray-200" />
                <span className="text-[10px] font-black uppercase tracking-widest dark:text-gray-500 text-gray-400">People You May Know</span>
                <div className="flex-1 h-px dark:bg-white/6 bg-gray-200" />
              </div>
            )}
            {getList().map(profile => (
              <ProfileCard key={profile.id} profile={profile} onFollow={handleFollow} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
