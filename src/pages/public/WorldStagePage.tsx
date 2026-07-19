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
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden dark:bg-[#0D0A14] bg-white">
        {/* Background glows */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 via-pink-500/5 to-amber-500/4 pointer-events-none" />
        <div className="absolute top-16 left-1/4 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative" ref={heroRef}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroIn ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/15 to-violet-500/10 border border-pink-500/30 mb-6">
              <Star className="w-3.5 h-3.5 text-brand-pink" />
              <span className="text-xs font-black tracking-widest text-brand-pink uppercase">The Spotlight</span>
            </div>

            {/* Headline */}
            <h1 className="font-display font-black dark:text-white text-gray-900 mb-6 text-[26px]">
              The World Stage{' '}
              <span className="block">
                <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                  for everyone
                </span>
              </span>
              <span className="block bg-gradient-to-r from-pink-400 to-amber-400 bg-clip-text text-transparent">
                who shines.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl dark:text-gray-400 text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              SmartzConnect's Spotlight celebrates the influencers, relationship seekers and entrepreneurs
              lighting up our ecosystem — recognized weekly, monthly and yearly.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to={worldstageHref}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold text-base shadow-xl shadow-violet-500/30 hover:scale-105 transition-all inline-flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" /> Join & Get Spotted
              </Link>
              <a
                href="#how-it-works"
                className="px-8 py-4 rounded-2xl dark:bg-white/8 bg-gray-100 dark:text-white text-gray-900 font-bold text-base hover:text-brand-pink transition-colors inline-flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-5 h-5" /> How It Works
              </a>
            </div>
          </motion.div>
        </div>
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
            <h2 className="font-display font-black sm:text-5xl dark:text-white text-gray-900 mb-4 text-[26px]">
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
                className="px-10 py-4 rounded-2xl bg-white text-violet-700 font-black text-base hover:scale-105 transition-transform shadow-2xl inline-flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" /> {session ? 'Go to World Stage' : 'Create Free Account'}
              </Link>
              <a
                href="https://wa.me/231776679963"
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-4 rounded-2xl bg-white/15 backdrop-blur-sm text-white font-bold text-base hover:bg-white/25 transition-colors inline-flex items-center justify-center gap-2 border border-white/20"
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
