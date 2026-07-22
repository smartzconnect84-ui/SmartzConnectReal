import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  GraduationCap, BookOpen, Video, Award, Search, Clock,
  Zap, ArrowRight, Users, Globe, Star, Bookmark, PlayCircle,
  Podcast as PodcastIcon, FileText, Layers,
} from 'lucide-react'
import { useSiteConfig, SITE_IMAGE_KEYS } from '@/contexts/SiteConfigContext'
import { usePublicStats, fmtCount } from '@/hooks/usePublicStats'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

const features = [
  {
    icon: BookOpen,   title: 'Curated Resources',
    desc: 'Articles, ebooks, courses, videos and podcasts — hand-picked and community-submitted, all in one library.',
    color: 'from-teal-500 to-emerald-600',
  },
  {
    icon: Video,      title: 'Learn Any Format',
    desc: 'Watch, read, or listen — switch between video lessons, articles, and podcasts to match how you learn best.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Bookmark,   title: 'Save & Revisit',
    desc: 'Bookmark resources to your personal library and pick up right where you left off, any time.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Award,      title: 'Skill Categories',
    desc: 'From tech and business to languages and personal growth — find resources organized by category.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: Users,      title: 'Community-Powered',
    desc: 'Members share what they know — submit your own resources and help others grow.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: Globe,      title: 'Free to Explore',
    desc: 'Core learning content is free for every SmartzConnect member — no paywall on knowledge.',
    color: 'from-cyan-500 to-blue-600',
  },
]

const resourceTypeIcons: Record<string, typeof BookOpen> = {
  Article: FileText,
  Video: Video,
  Course: Layers,
  Ebook: BookOpen,
  Podcast: PodcastIcon,
}

interface PreviewResource {
  id: string
  title: string
  category: string | null
  resource_type: string
  cover_url: string | null
}

export default function SmartzLearningPage() {
  const ref     = useRef(null)
  const heroRef = useRef(null)
  const inView  = useInView(ref,    { once: true, margin: '-80px' })
  const heroIn  = useInView(heroRef, { once: true })
  const siteConfig = useSiteConfig()
  const bgUrl = siteConfig.get(SITE_IMAGE_KEYS.learningPageBg)
  const { session } = useAuth()
  const isSignedIn = !!session

  // Live member count from the real users table
  const liveStats    = usePublicStats()
  const memberCount  = fmtCount(liveStats.totalUsers, '—')

  // Live resource count + a small preview feed, straight from the real
  // learning_resources table that powers the in-app Learning page.
  const [resourceCount, setResourceCount] = useState<number | null>(null)
  const [preview, setPreview] = useState<PreviewResource[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [{ count }, { data }] = await Promise.all([
        supabase.from('learning_resources').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('learning_resources')
          .select('id, title, category, resource_type, cover_url')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(4),
      ])
      if (cancelled) return
      setResourceCount(count ?? 0)
      setPreview(data ?? [])
    })()
    return () => { cancelled = true }
  }, [])

  const stats = [
    { value: fmtCount(resourceCount ?? 0, '—'), label: 'Learning Resources', icon: BookOpen },
    { value: memberCount,                        label: 'Platform Members',  icon: Users },
    { value: '5',                                 label: 'Content Formats',  icon: Layers },
    { value: '100%',                              label: 'Free to Start',    icon: Globe },
  ]

  const learnHref = isSignedIn ? '/app/learning' : '/register'

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen pt-[72px] sm:pt-20">

      {/* ── Hero ── */}
      <section ref={heroRef}>
        {/* Hero image */}
        <div className="w-full overflow-hidden relative">
          {bgUrl && (
            <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <motion.img
            src="/smartz-learning-hero.png"
            alt="SmartzLearning — Learn. Grow. Succeed."
            className="w-full h-auto object-contain relative"
            style={{ opacity: bgUrl ? 0.85 : undefined }}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={heroIn ? { opacity: bgUrl ? 0.85 : 1, scale: 1 } : {}}
            transition={{ duration: 0.7 }}
          />
        </div>

        {/* CTA buttons */}
        <div className="dark:bg-[#031c1a]/90 bg-teal-50/70 border-t-2 border-teal-500/25 py-6 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroIn ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to={learnHref}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-teal-500/40 hover:shadow-teal-500/60 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
              <PlayCircle className="w-4 h-4" /> Start Learning
            </Link>
            <Link to={learnHref}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] rounded-xl dark:bg-teal-900/30 bg-white border dark:border-teal-500/20 border-teal-300/50 dark:text-teal-200 text-teal-800 font-semibold text-sm hover:dark:bg-teal-900/50 hover:bg-teal-100 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
              <Zap className="w-4 h-4" /> Submit a Resource
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Live platform stats ── */}
      <section className="py-10 dark:bg-[#0D0A14] bg-white border-y dark:border-white/5 border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {stats.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-md shadow-teal-500/20">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-display font-black text-2xl sm:text-3xl bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">{s.value}</p>
                  <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5 font-medium">{s.label}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Featured resources (real data from learning_resources) ── */}
      {preview.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900 mb-1">
                  Fresh on <span className="bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">SmartzLearning</span>
                </h2>
                <p className="text-sm dark:text-gray-400 text-gray-600">Recently added by the community</p>
              </div>
              <Link to={learnHref} className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-teal-500 hover:text-teal-400 transition-colors">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {preview.map((r, i) => {
                const TypeIcon = resourceTypeIcons[r.resource_type] || BookOpen
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="dark:bg-[#130E1E] bg-white rounded-2xl overflow-hidden border dark:border-white/6 border-gray-100 hover:shadow-xl hover:border-teal-400/30 transition-all group">
                    <div className="h-32 bg-gradient-to-br from-teal-500/20 to-emerald-600/20 flex items-center justify-center relative overflow-hidden">
                      {r.cover_url
                        ? <img src={r.cover_url} alt="" className="w-full h-full object-cover" />
                        : <TypeIcon className="w-10 h-10 text-teal-400/60" />}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-semibold text-white flex items-center gap-1">
                        <TypeIcon className="w-3 h-3" /> {r.resource_type}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-[11px] font-semibold text-teal-500 mb-1">{r.category || 'General'}</p>
                      <h3 className="text-sm font-bold dark:text-white text-gray-900 line-clamp-2">{r.title}</h3>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="sm:hidden text-center mt-6">
              <Link to={learnHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-500">
                View all resources <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Features ── */}
      <section ref={ref} className="py-16 sm:py-24 dark:bg-[#0D0A14] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-12">
            <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-3">
              Everything You Need to <span className="bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">Grow</span>
            </h2>
            <p className="text-lg dark:text-gray-400 text-gray-600 max-w-xl mx-auto">
              A learning hub built into your everyday app — no extra sign-up, no extra app.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                  className="dark:bg-[#080510] bg-gray-50 rounded-2xl p-6 border dark:border-white/6 border-gray-100 hover:shadow-xl hover:border-teal-400/20 transition-all group">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-base dark:text-white text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Contribute CTA ── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl dark:bg-[#130E1E] bg-teal-50 border dark:border-white/8 border-teal-100 shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-radial from-teal-500/12 via-transparent to-transparent pointer-events-none" />

            <div className="relative grid sm:grid-cols-2 gap-10 p-8 sm:p-12 lg:p-14 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/15 border border-teal-500/25 mb-6">
                  <Search className="w-4 h-4 text-teal-500" />
                  <span className="text-sm font-bold text-teal-600 dark:text-teal-400">Share What You Know</span>
                </div>

                <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-4 leading-tight">
                  Teach the<br />Community
                </h2>

                <p className="text-base dark:text-gray-400 text-gray-600 mb-6 leading-relaxed">
                  Submit an article, video, course, ebook, or podcast and help fellow members
                  build new skills — all searchable and saveable inside the app.
                </p>

                <Link to={learnHref}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-base shadow-xl shadow-teal-500/25 hover:scale-[1.03] transition-all">
                  <Zap className="w-4 h-4" /> Submit a Resource
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {[
                  { icon: Search,   text: 'Instant search & filter by content type' },
                  { icon: Bookmark, text: 'Save resources to revisit any time' },
                  { icon: Clock,    text: 'See runtime & views before you dive in' },
                  { icon: Award,    text: 'Organized by category & skill area' },
                  { icon: Users,    text: 'Community-submitted, always growing' },
                  { icon: Star,     text: 'Free to browse for every member' },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                      <b.icon className="w-4 h-4 text-teal-500" />
                    </div>
                    <span className="text-sm dark:text-gray-300 text-gray-700 font-medium">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-teal-500/30">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-4">
            Ready to Learn?
          </h2>
          <p className="text-lg dark:text-gray-400 text-gray-600 mb-8 max-w-lg mx-auto">
            Jump into SmartzLearning today — it's already part of your SmartzConnect account.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={learnHref}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-base shadow-xl shadow-teal-500/25 hover:scale-105 transition-all">
              <PlayCircle className="w-4 h-4" /> Start Learning Free
            </Link>
            <Link to="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl dark:bg-white/6 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 font-semibold text-base hover:dark:bg-white/10 transition-all">
              View Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
