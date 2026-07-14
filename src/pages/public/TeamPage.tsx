import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ExternalLink, Users, Zap, Shield, Star, MapPin, Calendar } from 'lucide-react'
import { LinkedinIcon, TwitterIcon } from '@/components/icons/SocialIcons'
import { useSiteConfig, SITE_IMAGE_KEYS } from '@/contexts/SiteConfigContext'
import { supabase } from '@/lib/supabase'

const values = [
  { emoji: '🌍', title: 'Africa First',       desc: 'Every decision starts with: "Is this right for Africa?" We build for our continent, by our continent.' },
  { emoji: '💕', title: 'Genuine Connection', desc: 'Technology should bring people closer, not replace human connection. Authenticity is our north star.' },
  { emoji: '🛡️', title: 'Safety Always',      desc: 'We invest more in safety than any other African social platform. Every user deserves to feel safe.' },
  { emoji: '🚀', title: 'Move Fast',           desc: 'We ship fast, learn faster. Moving with startup urgency and scale-up discipline.' },
]

const CEO = {
  full_name: 'Shedrick K. Nungehn',
  role: 'Founder & CEO',
  photo_url: '/ceo-shedrick.jpg',
  country: 'Liberia 🇱🇷',
  joined_year: '2023',
  bio: "Visionary entrepreneur and founder of SmartzConnect — Africa's leading all-in-one digital super-app. Born and raised in Liberia, Shedrick built SmartzConnect to empower Africans across the world through technology, connection, and community.",
  skills: ['Leadership', 'Product Vision', 'Strategy', 'Technology', 'African Markets'],
  contact_url: 'https://wa.me/231776679963',
}

type TeamMember = {
  id: string
  full_name: string
  role: string
  photo_url: string | null
  bio: string | null
  country: string | null
  linkedin_url: string | null
  twitter_url: string | null
  is_advisor: boolean
  display_order: number
}

function TeamCardSkeleton() {
  return (
    <div className="dark:bg-[#130E1E] bg-white rounded-3xl border dark:border-white/8 border-gray-100 shadow-xl overflow-hidden animate-pulse">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-80 lg:w-96 flex-shrink-0 h-72 md:h-80 bg-gray-200 dark:bg-white/10" />
        <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col justify-center gap-4">
          <div className="h-4 w-32 rounded-full bg-gray-200 dark:bg-white/10" />
          <div className="h-7 w-56 rounded-full bg-gray-200 dark:bg-white/10" />
          <div className="h-4 w-28 rounded-full bg-gray-200 dark:bg-white/10" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-white/10" />
            <div className="h-3 w-5/6 rounded-full bg-gray-200 dark:bg-white/10" />
            <div className="h-3 w-4/6 rounded-full bg-gray-200 dark:bg-white/10" />
          </div>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3].map(k => (
              <div key={k} className="h-6 w-20 rounded-full bg-gray-200 dark:bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MemberCard({ member, inView, delay }: { member: TeamMember; inView: boolean; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay }}
      className="dark:bg-[#130E1E] bg-white rounded-3xl border dark:border-white/8 border-gray-100 shadow-2xl overflow-hidden"
    >
      <div className="flex flex-col md:flex-row">
        {/* Photo */}
        <div className="relative md:w-80 lg:w-96 flex-shrink-0 h-72 md:h-auto min-h-[320px]">
          {member.photo_url ? (
            <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center">
              <Users className="w-20 h-20 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent md:bg-gradient-to-r md:from-transparent md:to-transparent" />
          {/* Mobile name overlay */}
          <div className="absolute bottom-4 left-5 md:hidden">
            <p className="font-black text-white text-xl leading-tight">{member.full_name}</p>
            <p className="text-pink-300 text-sm font-semibold">{member.role}</p>
          </div>
          {/* Country badge */}
          {member.country && (
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {member.country}
            </div>
          )}
          {/* Advisor badge */}
          {member.is_advisor && (
            <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-amber-500/80 backdrop-blur-sm text-white text-xs font-bold">
              Advisor
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
          {/* Desktop name */}
          <div className="hidden md:block mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/20 mb-3">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-purple-300">{member.is_advisor ? 'Advisor' : 'Team Member'}</span>
            </div>
            <h3 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900 mb-1">{member.full_name}</h3>
            <p className="text-base text-pink-400 font-semibold">{member.role}</p>
          </div>

          {/* Bio */}
          {member.bio && (
            <p className="text-sm sm:text-base dark:text-gray-300 text-gray-700 leading-relaxed mb-6">
              {member.bio}
            </p>
          )}

          {/* Social links */}
          {(member.linkedin_url || member.twitter_url) && (
            <div className="flex flex-wrap gap-3 pt-4 border-t dark:border-white/8 border-gray-100">
              {member.linkedin_url && (
                <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl dark:bg-white/6 bg-gray-100 dark:text-white text-gray-700 text-sm font-semibold hover:dark:bg-white/10 hover:bg-gray-200 transition-colors border dark:border-white/8 border-gray-200">
                  <LinkedinIcon className="w-4 h-4" /> LinkedIn
                </a>
              )}
              {member.twitter_url && (
                <a href={member.twitter_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl dark:bg-white/6 bg-gray-100 dark:text-white text-gray-700 text-sm font-semibold hover:dark:bg-white/10 hover:bg-gray-200 transition-colors border dark:border-white/8 border-gray-200">
                  <TwitterIcon className="w-4 h-4" /> Twitter
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function TeamPage() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const siteConfig = useSiteConfig()
  const bgUrl = siteConfig.get(SITE_IMAGE_KEYS.teamPageBg)

  const [members, setMembers] = useState<TeamMember[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase
      .from('team_members')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return
        if (!error && data && data.length > 0) {
          setMembers(data as TeamMember[])
        } else {
          setMembers(null)
        }
        setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  // Determine first member (CEO equivalent) for feature card, rest as grid
  const featureMember = members?.[0] ?? null
  const restMembers = members && members.length > 1 ? members.slice(1) : []

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen pt-16 sm:pt-20">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Container uses natural image ratio so every team member is fully visible */}
        <div className="relative w-full bg-[#1a100d]" style={{ aspectRatio: '16/9', maxHeight: '90vh' }}>
          <img
            src={bgUrl || '/team-hero.png'}
            alt="The SmartzConnect Team"
            className="w-full h-full object-contain object-center"
          />
          {/* Subtle dark gradient at top only — doesn't obscure bodies */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />
          {/* Label pinned just above the bottom edge */}
          <div className="absolute bottom-[5%] inset-x-0 flex justify-center px-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-lg">
              <Users className="w-4 h-4 text-pink-300 flex-shrink-0" />
              <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                The people behind SmartzConnect
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">

        {/* ── Values ── */}
        <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="mb-14 sm:mb-20">
          <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl dark:text-white text-gray-900 text-center mb-6 sm:mb-8">
            Our <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Values</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {values.map((v, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                className="dark:bg-[#130E1E] bg-white rounded-2xl p-5 sm:p-6 border dark:border-white/6 border-gray-100 text-center hover:shadow-lg hover:border-purple-500/20 transition-all">
                <div className="text-3xl sm:text-4xl mb-3">{v.emoji}</div>
                <h3 className="font-bold dark:text-white text-gray-900 mb-2 text-sm sm:text-base">{v.title}</h3>
                <p className="text-xs sm:text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Leadership Team ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }}
          className="mb-14 sm:mb-20"
        >
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl dark:text-white text-gray-900">
              Leadership <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Team</span>
            </h2>
            <p className="dark:text-gray-400 text-gray-600 mt-2 text-xs sm:text-sm">Driving SmartzConnect's mission across Africa and beyond.</p>
          </div>

          {loading ? (
            /* Loading skeletons */
            <div className="space-y-6">
              {[1, 2, 3].map(k => <TeamCardSkeleton key={k} />)}
            </div>
          ) : featureMember ? (
            /* Dynamic from DB */
            <div className="space-y-6">
              {members!.map((member, i) => (
                <MemberCard key={member.id} member={member} inView={inView} delay={0.1 + i * 0.08} />
              ))}
            </div>
          ) : (
            /* Fallback: hardcoded CEO block */
            <div className="dark:bg-[#130E1E] bg-white rounded-3xl border dark:border-white/8 border-gray-100 shadow-2xl overflow-hidden">
              <div className="flex flex-col md:flex-row">

                {/* Photo */}
                <div className="relative md:w-80 lg:w-96 flex-shrink-0 h-72 md:h-auto min-h-[320px]">
                  <img
                    src={CEO.photo_url}
                    alt={CEO.full_name}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent md:bg-gradient-to-r md:from-transparent md:to-transparent" />
                  {/* Mobile name overlay */}
                  <div className="absolute bottom-4 left-5 md:hidden">
                    <p className="font-black text-white text-xl leading-tight">{CEO.full_name}</p>
                    <p className="text-pink-300 text-sm font-semibold">{CEO.role}</p>
                  </div>
                  {/* Country badge */}
                  <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {CEO.country}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">

                  {/* Desktop name */}
                  <div className="hidden md:block mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/20 mb-3">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-bold text-purple-300">Founder & Visionary</span>
                    </div>
                    <h3 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900 mb-1">{CEO.full_name}</h3>
                    <p className="text-base text-pink-400 font-semibold">{CEO.role}</p>
                  </div>

                  {/* Joined */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <Calendar className="w-3.5 h-3.5 dark:text-gray-500 text-gray-400" />
                    <span className="text-xs dark:text-gray-500 text-gray-400">Building since {CEO.joined_year}</span>
                  </div>

                  {/* Bio */}
                  <p className="text-sm sm:text-base dark:text-gray-300 text-gray-700 leading-relaxed mb-6">
                    {CEO.bio}
                  </p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {CEO.skills.map(s => (
                      <span key={s} className="text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-purple-600/15 to-pink-600/15 dark:text-purple-300 text-purple-700 border dark:border-purple-500/20 border-purple-200">
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t dark:border-white/8 border-gray-100">
                    <a href={CEO.contact_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold shadow-lg shadow-purple-600/25 hover:opacity-90 transition-opacity">
                      <Shield className="w-4 h-4" /> Contact CEO
                    </a>
                    <Link to="/register"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl dark:bg-white/6 bg-gray-100 dark:text-white text-gray-700 text-sm font-semibold hover:dark:bg-white/10 hover:bg-gray-200 transition-colors border dark:border-white/8 border-gray-200">
                      <ExternalLink className="w-4 h-4" /> Join the Platform
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Mission Stats ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-14 sm:mb-20"
        >
          {[
            { value: 'Growing',  label: 'Community',   emoji: '👥' },
            { value: 'Africa',   label: '& Beyond',    emoji: '🌍' },
            { value: 'Real',     label: 'Businesses',  emoji: '🏢' },
            { value: 'Daily',    label: 'Connections', emoji: '💕' },
          ].map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.2 + i * 0.07 }}
              className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 sm:p-5 border dark:border-white/6 border-gray-100 text-center hover:border-purple-500/20 transition-all">
              <div className="text-2xl mb-1">{s.emoji}</div>
              <p className="font-black text-xl sm:text-2xl dark:text-white text-gray-900">{s.value}</p>
              <p className="text-xs dark:text-gray-500 text-gray-500 font-medium mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Join CTA ── */}
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-2xl bg-gradient-to-br from-[#1f0d38] via-[#2d1060] to-[#1a0a2e]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-48 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-violet-500/15 blur-2xl" />
          </div>
          <div className="relative p-6 sm:p-10 md:p-12 text-center">
            <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl text-white mb-2 sm:mb-3">Join Our Movement</h2>
            <p className="text-white/70 mb-5 sm:mb-6 max-w-lg mx-auto text-xs sm:text-sm md:text-base">
              Be part of Africa's fastest-growing super-app. Connect, create, and thrive with a community built for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register"
                className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold inline-flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-600/30">
                <Zap className="w-4 h-4" /> Get Started
              </Link>
              <a href="https://wa.me/231776679963" target="_blank" rel="noopener noreferrer"
                className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold hover:bg-white/20 transition-colors inline-flex items-center justify-center gap-2 border border-white/20 text-sm">
                💬 WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
