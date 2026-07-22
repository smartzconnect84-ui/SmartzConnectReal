import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapPin, Briefcase, GraduationCap, Heart,
  Shield, Crown, MessageCircle, Video, Phone, UserPlus, UserMinus,
  ArrowLeft, Share2, Flag
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useLiveKitCall } from '@/contexts/LiveKitCallContext'
import { streamClient } from '@/lib/stream'
import { notifyUser } from '@/lib/notify'

interface UserProfile {
  id: string
  username: string
  full_name: string
  email: string
  bio?: string
  location?: string
  occupation?: string
  education?: string
  relationship_goal?: string
  interests?: string[]
  avatar_url?: string
  cover_url?: string
  is_verified?: boolean
  is_premium?: boolean
  is_vip?: boolean
  role?: string
}

interface Stats {
  posts: number
  followers: number
  following: number
  likes: number
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { initiateCall } = useLiveKitCall()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [myProfile, setMyProfile] = useState<{ full_name: string; avatar_url?: string } | null>(null)

  // If viewing own profile, redirect
  useEffect(() => {
    if (userId === user?.id) navigate('/app/profile', { replace: true })
  }, [userId, user?.id])

  // Load profile
  const loadProfile = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('profiles')
      .select('id,username,full_name,email,bio,location,occupation,education,relationship_goal,interests,avatar_url,cover_url,is_verified,is_premium,is_vip,role')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
    setLoading(false)
  }, [userId])

  const loadStats = useCallback(async () => {
    if (!userId) return
    const [postsRes, followersRes, followingRes] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userId),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    ])
    setStats({ posts: postsRes.count ?? 0, followers: followersRes.count ?? 0, following: followingRes.count ?? 0, likes: 0 })
  }, [userId])

  const checkFollowing = useCallback(async () => {
    if (!userId || !user?.id) return
    const { data } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).single()
    setIsFollowing(!!data)
  }, [userId, user?.id])

  const loadMyProfile = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase.from('profiles').select('full_name,avatar_url').eq('id', user.id).single()
    if (data) setMyProfile(data)
  }, [user?.id])

  useEffect(() => {
    loadProfile()
    loadStats()
    checkFollowing()
    loadMyProfile()
  }, [loadProfile, loadStats, checkFollowing, loadMyProfile])

  // Track profile view and notify (fire-and-forget, never blocks rendering)
  useEffect(() => {
    if (!profile || !user?.id || profile.id === user.id) return
    const viewerId = user.id
    const viewedUserId = profile.id
    ;(async () => {
      try {
        // Always insert the new view row (for analytics)
        await supabase.from('profile_views').insert({ viewer_id: viewerId, viewed_user_id: viewedUserId })

        // Only notify once per viewer per profile per rolling 24h window
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data: recentViews } = await supabase
          .from('profile_views')
          .select('id')
          .eq('viewer_id', viewerId)
          .eq('viewed_user_id', viewedUserId)
          .gte('created_at', since)
          .limit(2)

        // recentViews will include the row we just inserted; only notify if this is the first (count === 1)
        if (recentViews && recentViews.length <= 1) {
          const viewerName = myProfile?.full_name || 'Someone'
          notifyUser({
            userId: viewedUserId,
            type: 'profile_view',
            title: 'Profile view',
            message: `${viewerName} viewed your profile`,
            actionUrl: '/app/profile',
            emoji: '👀',
          }).catch(() => {})
        }
      } catch {
        // Silently swallow — view tracking must never affect rendering
      }
    })()
  }, [profile, user?.id, myProfile])

  const handleFollow = async () => {
    if (!user?.id || !userId || followLoading) return
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId)
      setIsFollowing(false)
      setStats(s => s ? { ...s, followers: Math.max(0, s.followers - 1) } : s)
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: userId })
      setIsFollowing(true)
      setStats(s => s ? { ...s, followers: s.followers + 1 } : s)
      // Notify the followed user (persists DB row + fires real OS push)
      notifyUser({
        userId,
        type: 'follow',
        title: 'New Follower',
        message: `${myProfile?.full_name || 'Someone'} started following you`,
        actionUrl: `/app/profile/${user.id}`,
        emoji: '👤',
      }).catch(() => {})
    }
    setFollowLoading(false)
  }

  const handleDM = () => {
    if (!userId) return
    // ChatPage uses the other user's ID as the route param and derives the channel itself
    navigate(`/app/chat/${userId}`)
  }

  const handleVideoCall = async () => {
    if (!profile) return
    await initiateCall({
      contactId: profile.id,
      contactName: profile.full_name || profile.username,
      contactAvatar: profile.avatar_url,
      type: 'video',
    })
  }

  const handleAudioCall = async () => {
    if (!profile) return
    await initiateCall({
      contactId: profile.id,
      contactName: profile.full_name || profile.username,
      contactAvatar: profile.avatar_url,
      type: 'audio',
    })
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center dark:bg-[#0D0A14] bg-gray-50">
        <div className="w-8 h-8 border-2 border-pink-500/30 border-t-brand-pink rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="h-full flex flex-col items-center justify-center dark:bg-[#0D0A14] bg-gray-50 gap-3">
        <p className="text-4xl">🔍</p>
        <p className="font-display font-black dark:text-white text-gray-900">User not found</p>
        <button onClick={() => navigate(-1)} className="text-sm text-brand-pink font-semibold">Go back</button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col dark:bg-[#0D0A14] bg-gray-50 overflow-y-auto">
      {/* Back header */}
      <div className="px-4 py-3 dark:bg-[#130E1E] bg-white border-b dark:border-white/6 border-gray-100 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-display text-base font-black dark:text-white text-gray-900 flex-1 truncate">
          {profile.full_name || profile.username}
        </h1>
        <button className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4 pb-6">
        {/* Cover + Avatar */}
        <div className="relative">
          <div className="h-36 sm:h-48 dark:bg-gradient-to-br dark:from-pink-900/40 dark:to-purple-900/40 bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
            {profile.cover_url
              ? <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><span className="text-4xl opacity-20">🌅</span></div>
            }
          </div>
          <div className="px-4 sm:px-6">
            <div className="relative -mt-10 w-20 h-20 rounded-2xl bg-love-gradient flex items-center justify-center text-4xl shadow-lg shadow-pink-500/20 overflow-hidden border-4 dark:border-[#0D0A14] border-white">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                : <span>👤</span>
              }
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 space-y-4">
          {/* Name + badges + action buttons */}
          <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-100">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <h2 className="font-display font-black text-xl dark:text-white text-gray-900">{profile.full_name}</h2>
                <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">@{profile.username}</p>
                {profile.location && (
                  <p className="flex items-center gap-1 text-xs dark:text-gray-400 text-gray-500 mt-1">
                    <MapPin className="w-3 h-3 text-brand-pink" />{profile.location}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                {profile.is_verified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400">
                    <Shield className="w-2.5 h-2.5" /> Verified
                  </span>
                )}
                {profile.is_premium && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400">
                    <Crown className="w-2.5 h-2.5" /> Premium
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleFollow} disabled={followLoading}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isFollowing
                    ? 'dark:bg-white/10 bg-gray-100 dark:text-gray-300 text-gray-700 hover:bg-red-500/10 hover:text-red-400'
                    : 'bg-love-gradient text-white shadow-md shadow-pink-500/20 hover:shadow-pink-500/30'
                } disabled:opacity-60`}>
                {followLoading ? <div className="w-3.5 h-3.5 border border-current/40 border-t-current rounded-full animate-spin" /> : isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isFollowing ? 'Unfollow' : 'Follow'}
              </motion.button>

              <motion.button whileTap={{ scale: 0.95 }} onClick={handleDM}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 border dark:border-white/8 border-gray-200 hover:border-brand-pink/40 transition-all">
                <MessageCircle className="w-4 h-4 text-brand-pink" /> Message
              </motion.button>

              <motion.button whileTap={{ scale: 0.95 }} onClick={handleVideoCall}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold dark:bg-blue-500/10 bg-blue-50 text-blue-500 border dark:border-blue-500/20 border-blue-200 hover:bg-blue-500/20 transition-all">
                <Video className="w-4 h-4" /> Video
              </motion.button>

              <motion.button whileTap={{ scale: 0.95 }} onClick={handleAudioCall}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold dark:bg-emerald-500/10 bg-emerald-50 text-emerald-500 border dark:border-emerald-500/20 border-emerald-200 hover:bg-emerald-500/20 transition-all">
                <Phone className="w-4 h-4" /> Audio
              </motion.button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { emoji: '📝', label: 'Posts',     value: stats ? String(stats.posts)     : '—' },
              { emoji: '👥', label: 'Followers',  value: stats ? String(stats.followers)  : '—' },
              { emoji: '➡️', label: 'Following',  value: stats ? String(stats.following)  : '—' },
            ].map(s => (
              <div key={s.label} className="dark:bg-[#130E1E] bg-white rounded-2xl p-3 text-center border dark:border-white/6 border-gray-100">
                <p className="text-lg mb-0.5">{s.emoji}</p>
                <p className="font-display font-black text-base dark:text-white text-gray-900">{s.value}</p>
                <p className="text-[9px] dark:text-gray-500 text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-100">
              <p className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider mb-2">About</p>
              <p className="text-sm dark:text-gray-300 text-gray-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Details */}
          {(profile.occupation || profile.education || profile.relationship_goal) && (
            <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-100">
              <p className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider mb-3">Details</p>
              <div className="space-y-3">
                {[
                  { icon: Briefcase, label: 'Occupation', value: profile.occupation },
                  { icon: GraduationCap, label: 'Education', value: profile.education },
                  { icon: Heart, label: 'Looking for', value: profile.relationship_goal },
                  { icon: MapPin, label: 'Location', value: profile.location },
                ].filter(d => d.value).map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-brand-pink" />
                    </div>
                    <div>
                      <p className="text-[10px] dark:text-gray-500 text-gray-400">{label}</p>
                      <p className="text-sm dark:text-white text-gray-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 border dark:border-white/6 border-gray-100">
              <p className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider mb-3">Interests</p>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map(interest => (
                  <span key={interest} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-love-soft text-brand-pink border border-pink-500/30">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Report */}
          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl dark:bg-white/5 bg-gray-100 border dark:border-white/6 border-gray-200 text-sm dark:text-gray-500 text-gray-400 hover:text-red-400 transition-colors">
            <Flag className="w-3.5 h-3.5" /> Report this profile
          </button>
        </div>
      </div>
    </div>
  )
}
