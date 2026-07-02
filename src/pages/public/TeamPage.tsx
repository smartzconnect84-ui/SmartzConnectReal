import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ExternalLink, Link2, Users, Zap, Shield, Star, MapPin, Calendar, RefreshCw, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface TeamMember {
  id: string
  full_name: string
  role: string
  photo_url?: string
  country?: string
  bio?: string
  skills?: string[]
  linkedin_url?: string
  twitter_url?: string
  joined_year?: string
  is_advisor?: boolean
  organization?: string
}

const values = [
  { emoji: '🌍', title: 'Africa First',          desc: 'Every decision starts with: "Is this right for Africa?" We build for our continent, by our continent.' },
  { emoji: '💕', title: 'Genuine Connection',    desc: 'Technology should bring people closer, not replace human connection. Authenticity is our north star.' },
  { emoji: '🛡️', title: 'Safety Always',         desc: 'We invest more in safety than any other African social platform. Every user deserves to feel safe.' },
  { emoji: '🚀', title: 'Move Fast',              desc: 'We ship fast, learn faster. Moving with startup urgency and scale-up discipline.' },
]

const CEO_STATIC: TeamMember = {
  id: 'ceo-static',
  full_name: 'Shedrick K. Nungehn',
  role: 'Founder & CEO',
  photo_url: '/ceo-shedrick.jpg',
  country: 'Liberia 🇱🇷',
  bio: "Visionary entrepreneur and founder of SmartzConnect — Africa's #1 social and dating platform. Born and raised in Liberia, Shedrick built SmartzConnect to connect Africans across the world through technology, love, and community.",
  skills: ['Leadership', 'Product Vision', 'Strategy', 'Technology', 'African Markets'],
  linkedin_url: 'https://wa.me/231776679963',
  is_advisor: false,
}

export default function TeamPage() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)

  const fetchTeam = async () => {
    setLoading(true)
    setDbError(null)
    const { data, error } = await supabase
      .from('team_members')
      .select('id, full_name, role, photo_url, country, bio, skills, linkedin_url, twitter_url, joined_year, is_advisor, organization')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      setDbConnected(false)
      setDbError(error.message)
      setTeam([])
    } else {
      setDbConnected(true)
      const mapped: TeamMember[] = (data || []).map((m: any) => ({
        id: String(m.id),
        full_name: m.full_name,
        role: m.role,
        photo_url: m.photo_url,
        country: m.country,
        bio: m.bio,
        skills: m.skills
          ? (Array.isArray(m.skills) ? m.skills : String(m.skills).split(',').map((s: string) => s.trim()))
          : [],
        linkedin_url: m.linkedin_url,
        twitter_url: m.twitter_url,
        joined_year: m.joined_year,
        is_advisor: m.is_advisor,
        organization: m.organization,
      }))
      setTeam(mapped)
    }
    setLoading(false)
  }

  useEffect(() => { fetchTeam() }, [])

  const leadership = [CEO_STATIC, ...team.filter(m => !m.is_advisor)]
  const advisors   = team.filter(m => m.is_advisor)

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen pt-16 sm:pt-20">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="relative h-56 sm:h-72 md:h-80 bg-gradient-to-br from-[#1a0a2e] via-[#0d0518] to-[#1d0a30]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-pink-500/20 blur-3xl" />
            <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-purple-500/15 blur-2xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-violet-500/15 blur-3xl" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/12 backdrop-blur-sm border border-white/20 mb-3 sm:mb-4">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-300" />
              <span className="text-xs sm:text-sm font-semibold text-white">The people behind SmartzConnect</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-white mb-2 sm:mb-3">
              Built by Africans,<br />
              <span className="text-pink-300">For Africa</span>
            </h1>
            <p className="text-sm sm:text-base text-white/75 max-w-xl px-4">
              A passionate team from across Africa, united by a mission to connect our continent through technology.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">

        {/* ── Values ── */}
        <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="mb-14 sm:mb-20">
          <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl dark:text-white text-gray-900 text-center mb-6 sm:mb-8">
            Our <span className="text-gradient-love">Values</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {values.map((v, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                className="dark:bg-[#130E1E] bg-white rounded-2xl p-5 sm:p-6 border dark:border-white/6 border-gray-100 text-center hover:shadow-lg hover:border-pink-500/20 transition-all">
                <div className="text-3xl sm:text-4xl mb-3">{v.emoji}</div>
                <h3 className="font-bold dark:text-white text-gray-900 mb-2 text-sm sm:text-base">{v.title}</h3>
                <p className="text-xs sm:text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-brand-pink/30 border-t-brand-pink animate-spin" />
            <p className="text-sm dark:text-gray-400 text-gray-500">Loading team…</p>
          </div>
        )}

        {/* ── DB error ── */}
        {!loading && dbError && (
          <div className="flex flex-col items-center gap-3 py-8 mb-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold dark:text-white text-gray-900 text-sm mb-1">Database not configured yet</p>
              <p className="text-xs dark:text-gray-500 text-gray-400 max-w-sm">Run the SQL schema in Supabase to enable live team profiles.</p>
            </div>
            <button onClick={fetchTeam} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-gradient text-white text-xs font-bold">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* ── No members yet ── */}
        {!loading && dbConnected && team.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-10 text-center mb-12">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden shadow-2xl">
              <img src="/flyer.png" alt="SmartzConnect" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-bold text-lg dark:text-white text-gray-900 mb-1">Meet Our Team Soon</p>
              <p className="text-sm dark:text-gray-400 text-gray-500">Team profiles will appear here once added to the database.</p>
            </div>
          </div>
        )}

        {/* ── Leadership Team ── */}
        {!loading && leadership.length > 0 && (
          <div className="mb-14 sm:mb-20">
            <div className="flex items-end justify-between mb-6 sm:mb-8">
              <div>
                <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl dark:text-white text-gray-900">
                  Leadership <span className="text-gradient-love">Team</span>
                </h2>
                <p className="dark:text-gray-400 text-gray-600 mt-1 text-xs sm:text-sm">The people driving SmartzConnect's mission forward.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={fetchTeam} title="Refresh" className="w-8 h-8 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
                  <RefreshCw className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
                </button>
                <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold dark:text-gray-500 text-gray-400">
                  <Star className="w-3.5 h-3.5 text-brand-pink" /> {leadership.length} leaders
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {leadership.map((member, i) => (
                <motion.div key={member.id}
                  initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.06 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-100 hover:shadow-xl hover:border-pink-500/20 transition-all group overflow-hidden">

                  <div className="relative h-44 sm:h-52 overflow-hidden bg-gradient-to-br from-pink-500/10 to-purple-500/10">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.full_name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <img src="/flyer.png" alt="SmartzConnect"
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {member.country && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-[10px] sm:text-xs font-semibold flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {member.country}
                      </div>
                    )}
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="font-bold text-white text-sm sm:text-base leading-tight">{member.full_name}</p>
                      <p className="text-[11px] sm:text-xs text-pink-300 font-semibold">{member.role}</p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    {member.joined_year && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <Calendar className="w-3 h-3 dark:text-gray-500 text-gray-400" />
                        <span className="text-[10px] dark:text-gray-500 text-gray-400">Since {member.joined_year}</span>
                      </div>
                    )}
                    {member.bio && (
                      <p className="text-xs sm:text-sm dark:text-gray-400 text-gray-600 leading-relaxed mb-3 sm:mb-4 line-clamp-3">{member.bio}</p>
                    )}
                    {(member.skills || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3 sm:mb-4">
                        {(member.skills || []).slice(0, 4).map(s => (
                          <span key={s} className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 border dark:border-white/5 border-gray-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-3 border-t dark:border-white/5 border-gray-100">
                      {member.linkedin_url && (
                        <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                          <Link2 className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" />
                        </a>
                      )}
                      {member.twitter_url && (
                        <a href={member.twitter_url} target="_blank" rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-sky-500/10 hover:text-sky-500 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" />
                        </a>
                      )}
                      <a href="https://wa.me/231776679963" target="_blank" rel="noopener noreferrer"
                        className="ml-auto text-xs font-semibold text-brand-pink hover:underline flex items-center gap-1">
                        Contact <Shield className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Advisors ── */}
        {!loading && dbConnected && advisors.length > 0 && (
          <div className="mb-14 sm:mb-20">
            <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl dark:text-white text-gray-900 mb-6 sm:mb-8">
              Our <span className="text-gradient-love">Advisors</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {advisors.map((a, i) => (
                <motion.div key={a.id}
                  initial={{ opacity: 0, scale: 0.95 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: i * 0.08 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-100 hover:shadow-lg hover:border-pink-500/20 transition-all overflow-hidden group">
                  <div className="h-28 sm:h-36 md:h-40 overflow-hidden bg-gradient-to-br from-pink-500/10 to-purple-500/10">
                    {a.photo_url
                      ? <img src={a.photo_url} alt={a.full_name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                      : <img src="/flyer.png" alt="SmartzConnect" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                    }
                  </div>
                  <div className="p-3 sm:p-4 text-center">
                    <p className="font-bold text-xs sm:text-sm dark:text-white text-gray-900 leading-tight">{a.full_name}</p>
                    <p className="text-[10px] sm:text-xs text-brand-pink font-semibold mt-0.5">{a.role}</p>
                    {(a.country || a.organization) && (
                      <p className="text-[9px] sm:text-[10px] dark:text-gray-500 text-gray-400 mt-1">
                        {[a.country, a.organization].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Join CTA ── */}
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-2xl bg-gradient-to-br from-[#1f0d38] via-[#2d1060] to-[#1a0a2e]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-48 rounded-full bg-pink-500/20 blur-3xl" />
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-violet-500/15 blur-2xl" />
          </div>
          <div className="relative p-6 sm:p-10 md:p-12 text-center">
            <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl text-white mb-2 sm:mb-3">Join Our Team</h2>
            <p className="text-white/80 mb-5 sm:mb-6 max-w-lg mx-auto text-xs sm:text-sm md:text-base">
              We're always looking for passionate builders who want to shape the future of African technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/about" className="btn-love px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold inline-flex items-center justify-center gap-2 text-sm">
                <Zap className="w-4 h-4" /> Learn More
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
