import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Globe2, Heart, Rocket, ShieldCheck, Sparkles, Users, Zap,
  ShoppingBag, Car, Package, Tv, Megaphone, GraduationCap, Users2,
} from 'lucide-react'
import { useSiteConfig, SITE_IMAGE_KEYS } from '@/contexts/SiteConfigContext'

const values = [
  { icon: Globe2,      title: 'Africa First',       desc: 'Every decision starts with: "Is this right for Africa?" We build for our continent, by our continent.' },
  { icon: Heart,        title: 'Genuine Connection', desc: 'Technology should bring people closer, not replace human connection. Authenticity is our north star.' },
  { icon: ShieldCheck,  title: 'Safety Always',      desc: 'We invest more in safety than any other African social platform. Every user deserves to feel safe.' },
  { icon: Rocket,       title: 'Move Fast',          desc: 'We ship fast, learn faster. Moving with startup urgency and scale-up discipline.' },
]

const timeline = [
  { year: '2023', title: 'The idea', desc: "Founder Shedrick K. Nungehn set out from Liberia to build one app that could replace ten — social, dating, ride-hailing, marketplace, delivery, streaming and ads — for every African." },
  { year: '2024', title: 'First build', desc: 'SmartzConnect launched its first products — SmartzSocial and SmartzDating — welcoming an early community across Liberia and West Africa.' },
  { year: '2025', title: 'The super-app', desc: 'SmartzRide, SmartzMarket, SmartzDelivery, SmartzTV and SmartzAds joined the platform, unifying seven products under one login.' },
  { year: '2026', title: 'Going global', desc: 'SmartzConnect now reaches members in 195+ countries, with World Stage, live streaming, voice & video calling, and a growing creator economy.' },
]

const products = [
  { icon: Users,          label: 'SmartzSocial',    color: 'text-violet-400',  bg: 'bg-violet-500/10'  },
  { icon: Heart,          label: 'SmartzDating',    color: 'text-pink-400',    bg: 'bg-pink-500/10'    },
  { icon: ShoppingBag,    label: 'SmartzMarket',    color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  { icon: Car,            label: 'SmartzRide',      color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: Package,        label: 'SmartzDelivery',  color: 'text-sky-400',     bg: 'bg-sky-500/10'     },
  { icon: Tv,             label: 'SmartzTV',        color: 'text-purple-400',  bg: 'bg-purple-500/10'  },
  { icon: Megaphone,      label: 'SmartzAds',       color: 'text-rose-400',    bg: 'bg-rose-500/10'    },
  { icon: GraduationCap,  label: 'SmartzLearning',  color: 'text-teal-400',    bg: 'bg-teal-500/10'    },
]

const stats = [
  { value: '15K+',  label: 'Users',       emoji: '👥' },
  { value: '195+',  label: 'Countries',   emoji: '🌍' },
  { value: '8',     label: 'Products',    emoji: '🧩' },
  { value: '2023',  label: 'Founded',     emoji: '🇱🇷' },
]

export default function AboutPage() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const siteConfig = useSiteConfig()
  const bgUrl = siteConfig.get(SITE_IMAGE_KEYS.teamPageBg)

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen pt-16 sm:pt-20">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="relative h-64 sm:h-80 md:h-96 bg-gradient-to-br from-[#1a0a2e] via-[#0d0518] to-[#1d0a30]">
          {bgUrl && (
            <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 pointer-events-none" style={bgUrl ? { opacity: 0.7 } : undefined}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full bg-pink-500/20 blur-3xl" />
            <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-purple-500/15 blur-2xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-violet-500/15 blur-3xl" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/12 backdrop-blur-sm border border-white/20 mb-3 sm:mb-4">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-300" />
              <span className="text-xs sm:text-sm font-semibold text-white">Our story</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-white mb-2 sm:mb-3 max-w-3xl">
              One identity.<br className="sm:hidden" /> Seven products.<br />
              <span className="text-pink-300">A whole continent, connected.</span>
            </h1>
            <p className="text-sm sm:text-base text-white/75 max-w-xl px-4">
              SmartzConnect is Africa's all-in-one super-app — built in Liberia, made for the world.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">

        {/* ── Mission ── */}
        <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="mb-14 sm:mb-20 text-center max-w-3xl mx-auto">
          <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl dark:text-white text-gray-900 mb-4">
            Our <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Mission</span>
          </h2>
          <p className="dark:text-gray-300 text-gray-700 text-sm sm:text-base leading-relaxed">
            Most Africans juggle a dozen apps to date, chat, shop, travel and get paid — most of them built elsewhere,
            for someone else's context. SmartzConnect replaces that clutter with a single identity that unlocks social
            media, dating, ride-hailing, a marketplace, delivery, live streaming and advertising — priced in local
            currency, verified by real humans, and designed for how Africa actually connects.
          </p>
        </motion.div>

        {/* ── Values ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.05 }} className="mb-14 sm:mb-20">
          <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl dark:text-white text-gray-900 text-center mb-6 sm:mb-8">
            Our <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Values</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {values.map((v, i) => {
              const Icon = v.icon
              return (
                <motion.div key={v.title}
                  initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl p-5 sm:p-6 border dark:border-white/6 border-gray-100 text-center hover:shadow-lg hover:border-purple-500/20 transition-all">
                  <div className="w-11 h-11 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-pink-400" />
                  </div>
                  <h3 className="font-bold dark:text-white text-gray-900 mb-2 text-sm sm:text-base">{v.title}</h3>
                  <p className="text-xs sm:text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{v.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* ── Timeline ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }} className="mb-14 sm:mb-20">
          <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl dark:text-white text-gray-900 text-center mb-8 sm:mb-10">
            Our <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Journey</span>
          </h2>
          <div className="relative pl-8 sm:pl-10">
            <div className="absolute left-[11px] sm:left-[15px] top-1 bottom-1 w-px bg-gradient-to-b from-purple-500/40 via-pink-500/30 to-transparent" />
            <div className="space-y-8 sm:space-y-10">
              {timeline.map((t, i) => (
                <motion.div key={t.year} initial={{ opacity: 0, x: -16 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.1 + i * 0.1 }} className="relative">
                  <div className="absolute -left-8 sm:-left-10 top-0.5 w-[22px] h-[22px] sm:w-[30px] sm:h-[30px] rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <p className="text-xs font-black tracking-widest text-pink-400 mb-1">{t.year}</p>
                  <h3 className="font-bold dark:text-white text-gray-900 text-sm sm:text-base mb-1">{t.title}</h3>
                  <p className="text-xs sm:text-sm dark:text-gray-400 text-gray-600 leading-relaxed max-w-2xl">{t.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Products grid ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.15 }} className="mb-14 sm:mb-20">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl dark:text-white text-gray-900">
              One login, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">eight products</span>
            </h2>
            <p className="dark:text-gray-400 text-gray-600 mt-2 text-xs sm:text-sm">Everything you need, everywhere you go.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {products.map((p, i) => {
              const Icon = p.icon
              return (
                <motion.div key={p.label} initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.15 + i * 0.05 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 sm:p-5 border dark:border-white/6 border-gray-100 text-center hover:border-purple-500/20 transition-all">
                  <div className={`w-10 h-10 mx-auto mb-2.5 rounded-xl flex items-center justify-center ${p.bg}`}>
                    <Icon className={`w-5 h-5 ${p.color}`} />
                  </div>
                  <p className="text-xs sm:text-sm font-bold dark:text-white text-gray-900">{p.label}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-14 sm:mb-20">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.2 + i * 0.07 }}
              className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 sm:p-5 border dark:border-white/6 border-gray-100 text-center hover:border-purple-500/20 transition-all">
              <div className="text-2xl mb-1">{s.emoji}</div>
              <p className="font-black text-xl sm:text-2xl dark:text-white text-gray-900">{s.value}</p>
              <p className="text-xs dark:text-gray-500 text-gray-500 font-medium mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Team teaser + CTA ── */}
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-2xl bg-gradient-to-br from-[#1f0d38] via-[#2d1060] to-[#1a0a2e]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-48 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-violet-500/15 blur-2xl" />
          </div>
          <div className="relative p-6 sm:p-10 md:p-12 text-center">
            <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl text-white mb-2 sm:mb-3">Built by a team that gets it</h2>
            <p className="text-white/70 mb-5 sm:mb-6 max-w-lg mx-auto text-xs sm:text-sm md:text-base">
              Meet the people behind SmartzConnect, or jump straight in and become part of the story.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/team"
                className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold hover:bg-white/20 transition-colors inline-flex items-center justify-center gap-2 border border-white/20 text-sm">
                <Users2 className="w-4 h-4" /> Meet the Team
              </Link>
              <Link to="/register"
                className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold inline-flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-600/30">
                <Zap className="w-4 h-4" /> Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
