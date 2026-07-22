import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Globe, Trophy, Users, Zap, Star, Calendar,
  Crown, TrendingUp, Heart, Briefcase, Sparkles,
  CheckCircle, Clock,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

/* ── Spotlight categories ──────────────────────────────────────── */
const spotCategories = [
  {
    icon: Sparkles,
    emoji: '✨',
    tag: 'THE INFLUENCER',
    title: 'Content & Social Creators',
    desc: 'Creators who light up SmartzSocial and SmartzTV — the storytellers, entertainers, and voices our community can\'t stop following.',
    gradient: 'from-violet-600 to-purple-700',
    glow: 'shadow-violet-500/25',
    border: 'border-violet-500/30',
    accent: 'text-violet-400',
    examples: ['SmartzSocial creators', 'SmartzTV streamers', 'Short-form video stars'],
  },
  {
    icon: Heart,
    emoji: '💞',
    tag: 'THE HEART',
    title: 'Relationship Seekers',
    desc: 'Members who build real connections on SmartzDating and Spin & Chat — the people who make our community feel like home.',
    gradient: 'from-pink-600 to-rose-600',
    glow: 'shadow-pink-500/25',
    border: 'border-pink-500/30',
    accent: 'text-pink-400',
    examples: ['Top daters', 'Community builders', 'Spin & Chat connectors'],
  },
  {
    icon: Briefcase,
    emoji: '🚀',
    tag: 'THE HUSTLER',
    title: 'Entrepreneurs & Vendors',
    desc: 'The movers and shakers driving commerce on SmartzMarket, SmartzRide, and SmartzDelivery — turning the platform into their business.',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/25',
    border: 'border-amber-500/30',
    accent: 'text-amber-400',
    examples: ['Top SmartzMarket sellers', 'SmartzRide drivers', 'Delivery champions'],
  },
]

/* ── Stats row ─────────────────────────────────────────────────── */
const stats = [
  { icon: Globe,    value: '3',        label: 'CATEGORIES' },
  { icon: Calendar, value: 'Weekly',   label: 'SUNDAY' },
  { icon: Trophy,   value: 'Yearly',   label: 'AWARDS' },
  { icon: Star,     value: 'Worldwide', label: 'Everyone' },
]

/* ── Recognition tiers ─────────────────────────────────────────── */
const tiers = [
  {
    icon: Calendar,
    name: 'Weekly Spotlight',
    cadence: 'Every Sunday',
    desc: 'Three members — one per category — are highlighted on our homepage, social pages, and in-app banners for the entire week.',
    perks: ['Homepage feature', 'In-app banner', 'Social media shoutout', 'Community badge'],
    color: 'from-violet-500/15 to-purple-500/10',
    border: 'border-violet-500/20',
    iconColor: 'text-violet-400',
  },
  {
    icon: TrendingUp,
    name: 'Monthly Spotlight',
    cadence: 'First day of the month',
    desc: 'The top performer of each month gets a dedicated feature post, interview, and exclusive in-app crown.',
    perks: ['Dedicated feature post', 'Exclusive crown badge', 'Email newsletter feature', '1-month free Elite upgrade'],
    color: 'from-pink-500/15 to-rose-500/10',
    border: 'border-pink-500/20',
    iconColor: 'text-pink-400',
  },
  {
    icon: Crown,
    name: 'Yearly Award',
    cadence: 'Annual ceremony',
    desc: 'Our highest honour — the SmartzConnect World Stage Award goes to the one member who embodied our ecosystem all year long.',
    perks: ['Physical trophy', 'Cash prize', 'Press release', '1-year free Elite subscription'],
    color: 'from-amber-500/15 to-yellow-500/10',
    border: 'border-amber-500/20',
    iconColor: 'text-amber-400',
  },
]

/* ── How it works ──────────────────────────────────────────────── */
const steps = [
  { num: '01', title: 'Be Active', desc: 'Use any SmartzConnect product — post, match, sell, stream, ride — and let your activity speak for itself.' },
  { num: '02', title: 'Get Noticed', desc: 'Our team reviews activity, engagement, and community impact across all seven products every week.' },
  { num: '03', title: 'Get Featured', desc: 'Selected members are notified and featured every Sunday with a profile card across all our platforms.' },
  { num: '04', title: 'Win Awards', desc: 'Top monthly and yearly performers receive exclusive badges, prizes, and once-in-a-lifetime recognition.' },
]

/* ── Spotlight interface ───────────────────────────────────────── */
interface WSSpotlight {
  id: string
  display_name: string
  country: string
  category: string
  followers_label: string
  quote: string
  avatar_emoji: string
  avatar_url: string | null
  wins: number
}

/* ═══════════════════════════════════════════════════════════════ */
export default function WorldStagePage() {
  const heroRef   = useRef(null)
  const statsRef  = useRef(null)
  const catsRef   = useRef(null)
  const tiersRef  = useRef(null)
  const stepsRef  = useRef(null)
  const spotsRef  = useRef(null)

  const heroIn   = useInView(heroRef,  { once: true, margin: '-60px' })
  const statsIn  = useInView(statsRef, { once: true, margin: '-60px' })
  const catsIn   = useInView(catsRef,  { once: true, margin: '-60px' })
  const tiersIn  = useInView(tiersRef, { once: true, margin: '-60px' })
  const stepsIn  = useInView(stepsRef, { once: true, margin: '-60px' })
  const spotsIn  = useInView(spotsRef, { once: true, margin: '-60px' })

  const { session } = useAuth()
  const worldstageHref = session ? '/app/worldstage' : '/register'

  const [spotlights, setSpotlights] = useState<WSSpotlight[]>([])

  useEffect(() => {
    supabase
      .from('worldstage_spotlights')
      .select('*')
      .eq('is_active', true)
      .order('wins', { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data) setSpotlights(data as WSSpotlight[]) })
  }, [])

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen">

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden dark:bg-[#07040F] bg-[#0B0718] min-h-[100svh] md:min-h-[88svh] lg:min-h-[82svh] flex items-center">

        {/* ── Layered atmospheric background ── */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0C0820] via-[#100B1F] to-[#080512]" />
          {/* Violet glow — top-left */}
          <div className="absolute -top-24 -left-16 w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full bg-violet-600/20 blur-[110px]" />
          {/* Pink glow — top-right */}
          <div className="absolute -top-10 right-0 w-[380px] h-[380px] md:w-[520px] md:h-[520px] rounded-full bg-pink-600/16 blur-[90px]" />
          {/* Amber accent — bottom */}
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[320px] rounded-full bg-amber-500/9 blur-[100px]" />
          {/* Mobile centre glow for trophy emblem */}
          <div className="md:hidden absolute top-[18%] left-1/2 -translate-x-1/2 w-[280px] h-[280px] rounded-full bg-violet-600/28 blur-[70px]" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.022]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-28 sm:pb-20 md:py-0 w-full" ref={heroRef}>

          {/* ── Single-col mobile → 2-col md → 55/45 lg ── */}
          <div className="grid md:grid-cols-[1fr_46%] lg:grid-cols-[1fr_42%] gap-10 md:gap-8 xl:gap-16 items-center">

            {/* ─── LEFT COLUMN ─── */}
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={heroIn ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-center md:text-left"
            >

              {/* ── Mobile-only trophy emblem ── */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={heroIn ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="md:hidden flex justify-center mb-8"
              >
                <div className="relative">
                  {/* outer glow ring */}
                  <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-violet-600/35 via-fuchsia-600/20 to-pink-600/25 blur-2xl" />
                  {/* main icon box */}
                  <div className="relative w-28 h-28 rounded-[2rem] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-violet-700/50">
                    <Trophy className="w-14 h-14 text-white drop-shadow-lg" />
                  </div>
                  {/* floating crown badge */}
                  <motion.div
                    animate={{ y: [-5, 4, -5] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-3 -right-3 w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/40"
                  >
                    <Crown className="w-5 h-5 text-white" />
                  </motion.div>
                  {/* floating star badge */}
                  <motion.div
                    animate={{ y: [4, -5, 4] }}
                    transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -bottom-3 -left-3 w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-xl shadow-pink-500/40"
                  >
                    <Star className="w-4 h-4 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              {/* LIVE badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={heroIn ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-pink-500/35 bg-pink-500/12 backdrop-blur-sm mb-5 sm:mb-7"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-400" />
                </span>
                <span className="text-[11px] sm:text-xs font-black tracking-[0.16em] text-pink-300 uppercase">
                  The Spotlight — Weekly · Monthly · Yearly
                </span>
              </motion.div>

              {/* Headline */}
              <h1 className="font-display font-black text-white leading-[1.04] mb-5 sm:mb-6
                text-[2.75rem] sm:text-[3.5rem] md:text-[3rem] lg:text-[4.25rem] xl:text-[4.75rem]">
                <span className="block">The World</span>
                <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-300 to-pink-400 bg-clip-text text-transparent pb-1">
                  Stage
                </span>
                <span className="block text-[0.52em] sm:text-[0.48em] md:text-[0.5em] font-semibold text-white/45 tracking-wide mt-2 leading-snug">
                  for everyone who shines
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-white/58 text-base sm:text-lg md:text-base lg:text-xl leading-relaxed mb-8 sm:mb-10 max-w-xl mx-auto md:mx-0">
                SmartzConnect's recognition programme celebrates the{' '}
                <span className="text-violet-300 font-semibold">influencers</span>,{' '}
                <span className="text-pink-300 font-semibold">relationship builders</span>, and{' '}
                <span className="text-amber-300 font-semibold">entrepreneurs</span>{' '}
                lighting up our ecosystem — spotlighted every week, every month, and honoured every year.
              </p>

              {/* CTA row */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start mb-9 sm:mb-11">
                <Link
                  to={worldstageHref}
                  className="group relative overflow-hidden inline-flex items-center justify-center gap-2.5 px-7 py-4 sm:px-9 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold text-sm sm:text-base shadow-2xl shadow-violet-600/40 hover:shadow-violet-500/60 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                  <Zap className="w-4 h-4 relative" />
                  <span className="relative">Join &amp; Get Spotted</span>
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-4 sm:px-9 rounded-2xl bg-white/6 backdrop-blur-sm border border-white/14 text-white/80 font-semibold text-sm sm:text-base hover:bg-white/10 hover:text-white hover:border-white/22 active:scale-[0.98] transition-all duration-200"
                >
                  <TrendingUp className="w-4 h-4" />
                  How It Works
                </a>
              </div>

              {/* Micro-stats strip */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={heroIn ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-5"
              >
                {[
                  { icon: Globe,    value: '3 Categories',  sub: 'Influencer · Heart · Hustler', color: 'text-violet-400' },
                  { icon: Calendar, value: 'Every Sunday',  sub: 'Weekly spotlight pick',         color: 'text-pink-400' },
                  { icon: Trophy,   value: 'Annual Award',  sub: 'Cash prize + trophy',           color: 'text-amber-400' },
                ].map((s, i) => {
                  const Icon = s.icon
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <Icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs font-black text-white leading-tight">{s.value}</p>
                        <p className="text-[10px] text-white/38">{s.sub}</p>
                      </div>
                    </div>
                  )
                })}
              </motion.div>

              {/* Category pills — mobile only (md+ sees the right-column cards) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={heroIn ? { opacity: 1 } : {}}
                transition={{ delay: 0.45, duration: 0.5 }}
                className="md:hidden flex flex-wrap justify-center gap-2 mt-9"
              >
                {spotCategories.map((cat, i) => {
                  const Icon = cat.icon
                  return (
                    <motion.div
                      key={cat.tag}
                      initial={{ opacity: 0, y: 10 }}
                      animate={heroIn ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.45 + i * 0.08 }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/6 border ${cat.border} backdrop-blur-sm`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${cat.gradient} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span className={`text-[11px] font-black tracking-wide ${cat.accent} uppercase`}>{cat.tag}</span>
                      <span className="text-sm leading-none">{cat.emoji}</span>
                    </motion.div>
                  )
                })}
              </motion.div>
            </motion.div>

            {/* ─── RIGHT COLUMN — md+ visual ─── */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={heroIn ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.75, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="hidden md:flex flex-col gap-2.5 lg:gap-3"
            >
              {/* Trophy emblem — tablet & desktop, above cards */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={heroIn ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.22, duration: 0.5 }}
                className="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600/15 to-pink-600/10 border border-violet-500/25 mb-1"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-600/40">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-white tracking-wide">SmartzConnect World Stage</p>
                  <p className="text-[10px] text-white/45 mt-0.5">Recognising excellence across 8 products · Est. 2026</p>
                </div>
                <div className="ml-auto flex-shrink-0">
                  <span className="text-[9px] font-black tracking-widest text-violet-400 uppercase px-2 py-1 rounded-full bg-violet-500/15 border border-violet-500/25">Live</span>
                </div>
              </motion.div>

              {/* Category cards */}
              {spotCategories.map((cat, i) => {
                const Icon = cat.icon
                return (
                  <motion.div
                    key={cat.tag}
                    initial={{ opacity: 0, x: 30 }}
                    animate={heroIn ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className={`relative rounded-2xl p-4 lg:p-5 border-2 ${cat.border} bg-white/4 backdrop-blur-md overflow-hidden flex items-center gap-3 lg:gap-4 group hover:shadow-2xl ${cat.glow} hover:bg-white/6 transition-all duration-300`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-[0.06] group-hover:opacity-[0.11] transition-opacity`} />
                    <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-xl flex-shrink-0 relative`}>
                      <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[9px] font-black tracking-widest ${cat.accent} uppercase`}>{cat.tag}</span>
                        <span className="text-sm">{cat.emoji}</span>
                      </div>
                      <h3 className="font-bold text-xs lg:text-sm text-white leading-tight">{cat.title}</h3>
                      <p className="text-[10px] text-white/38 leading-snug line-clamp-1 mt-0.5">{cat.desc}</p>
                    </div>
                    <Crown className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${cat.accent} opacity-40 flex-shrink-0 relative group-hover:opacity-70 transition-opacity`} />
                  </motion.div>
                )
              })}

              {/* "Are you in the running?" prompt */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={heroIn ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.62, duration: 0.5 }}
              >
                <Link
                  to={worldstageHref}
                  className="relative rounded-2xl p-4 lg:p-5 border-2 border-dashed border-violet-500/28 flex items-center gap-3 lg:gap-4 group hover:border-violet-500/55 hover:bg-violet-500/6 transition-all duration-300 block"
                >
                  <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-600/30 flex-shrink-0">
                    <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs lg:text-sm text-white leading-tight">Are you in the running?</p>
                    <p className="text-[10px] text-white/38 mt-0.5">Every post, match, and sale counts toward your spotlight.</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-violet-400 opacity-50 flex-shrink-0 group-hover:opacity-80 transition-opacity" />
                </Link>
              </motion.div>
            </motion.div>

          </div>
        </div>

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#080510] to-transparent pointer-events-none" />
      </section>

      {/* ══ STATS ROW ═════════════════════════════════════════════ */}
      <section className="border-y dark:border-white/6 border-gray-100 dark:bg-[#0A0814] bg-white" ref={statsRef}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 dark:divide-white/6 divide-gray-100">
            {stats.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={statsIn ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.08 }}
                  className="flex flex-col items-center gap-2.5 py-8 px-4 text-center"
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500/20 to-violet-500/15 border border-pink-500/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-pink" />
                  </div>
                  <div>
                    <p className="font-display font-black text-xl sm:text-2xl dark:text-white text-gray-900">{s.value}</p>
                    <p className="text-[10px] font-black tracking-widest dark:text-gray-500 text-gray-400 uppercase mt-0.5">{s.label}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ══ WHO WE CELEBRATE ══════════════════════════════════ */}
        <section className="py-20 sm:py-28" ref={catsRef}>
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={catsIn ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500/15 to-violet-500/10 border border-pink-500/25 mb-5">
              <span className="text-xs font-black tracking-widest text-brand-pink uppercase">Who We Celebrate</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl dark:text-white text-gray-900 mb-4 leading-tight">
              Three categories.{' '}
              <span className="bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">One Spotlight.</span>
            </h2>
            <p className="text-base sm:text-lg dark:text-gray-400 text-gray-600 max-w-2xl mx-auto">
              A stage built for the people who make SmartzConnect feel alive.
            </p>
          </motion.div>

          {/* Category cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {spotCategories.map((cat, i) => {
              const Icon = cat.icon
              return (
                <motion.div
                  key={cat.tag}
                  initial={{ opacity: 0, y: 30 }}
                  animate={catsIn ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  className={`relative dark:bg-[#130E1E] bg-white rounded-3xl p-7 border-2 ${cat.border} overflow-hidden hover:shadow-2xl ${cat.glow} transition-all duration-300 group`}
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-5 group-hover:opacity-8 transition-opacity`} />

                  <div className="relative">
                    {/* Icon + tag */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className={`text-[10px] font-black tracking-widest ${cat.accent} uppercase`}>{cat.tag}</span>
                    </div>

                    <h3 className="font-display font-black text-xl dark:text-white text-gray-900 mb-3">{cat.title}</h3>
                    <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed mb-5">{cat.desc}</p>

                    {/* Examples */}
                    <div className="space-y-1.5">
                      {cat.examples.map(ex => (
                        <div key={ex} className="flex items-center gap-2">
                          <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 ${cat.accent}`} />
                          <span className="text-xs dark:text-gray-300 text-gray-700">{ex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* ══ RECOGNITION TIERS ═════════════════════════════════ */}
        <section className="pb-20 sm:pb-28" ref={tiersRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={tiersIn ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/25 mb-5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-black tracking-widest text-amber-400 uppercase">Recognition Tiers</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-5xl dark:text-white text-gray-900 mb-4 leading-tight">
              Weekly. Monthly. <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Yearly.</span>
            </h2>
            <p className="text-base dark:text-gray-400 text-gray-600 max-w-xl mx-auto">
              We celebrate greatness at every cadence — from weekly shoutouts to our annual World Stage Award.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier, i) => {
              const Icon = tier.icon
              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={tiersIn ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.12 }}
                  className={`dark:bg-[#130E1E] bg-white rounded-3xl p-7 border ${tier.border} bg-gradient-to-br ${tier.color} hover:shadow-xl transition-all`}
                >
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${tier.color} border ${tier.border} flex items-center justify-center mb-5`}>
                    <Icon className={`w-5 h-5 ${tier.iconColor}`} />
                  </div>
                  <h3 className="font-display font-black text-lg dark:text-white text-gray-900 mb-1">{tier.name}</h3>
                  <p className={`text-xs font-bold ${tier.iconColor} mb-3`}>{tier.cadence}</p>
                  <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed mb-5">{tier.desc}</p>
                  <div className="space-y-2">
                    {tier.perks.map(perk => (
                      <div key={perk} className="flex items-center gap-2">
                        <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 ${tier.iconColor}`} />
                        <span className="text-xs dark:text-gray-300 text-gray-700">{perk}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* ══ HOW IT WORKS ══════════════════════════════════════ */}
        <section id="how-it-works" className="pb-20 sm:pb-28" ref={stepsRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={stepsIn ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500/15 to-pink-500/10 border border-violet-500/25 mb-5">
              <Clock className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-black tracking-widest text-violet-400 uppercase">How It Works</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-5xl dark:text-white text-gray-900 leading-tight">
              From member to{' '}
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">spotlight.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 25 }}
                animate={stepsIn ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}
                className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-100 relative overflow-hidden group hover:border-pink-500/30 hover:shadow-xl transition-all"
              >
                <div className="absolute -top-3 -right-3 font-display font-black text-7xl dark:text-white/3 text-gray-100 select-none group-hover:dark:text-white/5 transition-colors">
                  {step.num}
                </div>
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-pink-500/25">
                    <span className="text-xs font-black text-white">{step.num}</span>
                  </div>
                  <h3 className="font-bold text-base dark:text-white text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══ CURRENT SPOTLIGHTS (from DB) ══════════════════════ */}
        {spotlights.length > 0 && (
          <section className="pb-20 sm:pb-28" ref={spotsRef}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={spotsIn ? { opacity: 1, y: 0 } : {}}
              className="text-center mb-14"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500/15 to-rose-500/10 border border-pink-500/25 mb-5">
                <Users className="w-3.5 h-3.5 text-brand-pink" />
                <span className="text-xs font-black tracking-widest text-brand-pink uppercase">In the Spotlight</span>
              </div>
              <h2 className="font-display font-black text-3xl sm:text-5xl dark:text-white text-gray-900 leading-tight">
                Meet our{' '}
                <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">featured members.</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {spotlights.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={spotsIn ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.1 }}
                  className="dark:bg-[#130E1E] bg-white rounded-3xl p-7 border dark:border-white/6 border-gray-100 hover:shadow-xl hover:border-pink-500/20 transition-all"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center text-3xl shadow-lg shadow-pink-500/20 overflow-hidden flex-shrink-0">
                      {s.avatar_url
                        ? <img src={s.avatar_url} alt={s.display_name} className="w-full h-full object-cover" />
                        : s.avatar_emoji}
                    </div>
                    <div>
                      <p className="font-bold dark:text-white text-gray-900">{s.display_name}</p>
                      <p className="text-xs text-brand-pink font-semibold">{s.category}</p>
                      <p className="text-[10px] dark:text-gray-500 text-gray-400">{s.country}</p>
                    </div>
                  </div>
                  <blockquote className="text-sm dark:text-gray-300 text-gray-700 italic leading-relaxed mb-5">
                    "{s.quote}"
                  </blockquote>
                  <div className="flex items-center justify-between pt-4 border-t dark:border-white/5 border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-brand-pink" />
                      <span className="text-xs font-bold dark:text-white text-gray-900">{s.followers_label}</span>
                      <span className="text-xs dark:text-gray-500 text-gray-400">followers</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-bold dark:text-white text-gray-900">{s.wins}</span>
                      <span className="text-xs dark:text-gray-500 text-gray-400">spotlights</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ══ FINAL CTA ═════════════════════════════════════════ */}
        <div className="relative rounded-3xl overflow-hidden mb-20 sm:mb-28">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-pink-600 to-rose-600" />
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)' }}
          />
          <div className="relative px-8 sm:px-16 py-16 sm:py-20 text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 mb-6">
              <Star className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-xs font-black tracking-widest uppercase">Your moment awaits</span>
            </div>
            <Crown className="w-14 h-14 mx-auto mb-5 opacity-90" />
            <h2 className="font-display font-black text-3xl sm:text-5xl mb-4 leading-tight">
              Ready to Take the Stage?
            </h2>
            <p className="text-white/80 max-w-xl mx-auto mb-10 text-sm sm:text-lg leading-relaxed">
              Join thousands of African creators, lovers, and hustlers who are already building their
              story on SmartzConnect. Your spotlight is one post away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={worldstageHref}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-white text-violet-700 font-black text-base hover:scale-105 transition-transform shadow-2xl inline-flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" /> {session ? 'Go to World Stage' : 'Create Free Account'}
              </Link>
              <a
                href="https://wa.me/231776679963"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-white/15 backdrop-blur-sm text-white font-bold text-base hover:bg-white/25 transition-colors inline-flex items-center justify-center gap-2 border border-white/20"
              >
                💬 Talk to Us
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
