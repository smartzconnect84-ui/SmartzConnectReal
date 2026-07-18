import { useRef } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Globe2, Heart, Rocket, ShieldCheck, Sparkles, Users, Zap,
  ShoppingBag, Car, Package, Tv, Megaphone, GraduationCap, Users2,
  Globe, Target, Eye, Handshake,
} from 'lucide-react'
import { useSiteConfig, SITE_IMAGE_KEYS } from '@/contexts/SiteConfigContext'

/* ── animation helpers ────────────────────────────────────────────── */
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { type: 'spring' as const, stiffness: 160, damping: 22, delay },
})

const stagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}
const cardItem: Variants = {
  hidden:  { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { type: 'spring', stiffness: 180, damping: 22 } },
}

/* ── data ─────────────────────────────────────────────────────────── */
const values = [
  { icon: Globe2,      title: 'Africa First',       desc: 'Every decision starts with: "Is this right for Africa?" We build for our continent, by our continent.' },
  { icon: Heart,       title: 'Genuine Connection', desc: 'Technology should bring people closer, not replace human connection. Authenticity is our north star.' },
  { icon: ShieldCheck, title: 'Safety Always',      desc: 'We invest more in safety than any other African social platform. Every user deserves to feel safe.' },
  { icon: Rocket,      title: 'Move Fast',          desc: 'We ship fast, learn faster. Moving with startup urgency and scale-up discipline.' },
]

const timeline = [
  { year: '2023', title: 'The idea',       desc: "Founder Shedrick K. Nungehn set out from Liberia to build one app that could replace ten — social, dating, ride-hailing, marketplace, delivery, streaming and ads — for every African." },
  { year: '2024', title: 'First build',    desc: 'SmartzConnect launched its first products — SmartzSocial and SmartzDating — welcoming an early community across Liberia and West Africa.' },
  { year: '2025', title: 'The super-app',  desc: 'SmartzRide, SmartzMarket, SmartzDelivery, SmartzTV and SmartzAds joined the platform, unifying seven products under one login.' },
  { year: '2026', title: 'Going global',   desc: 'SmartzConnect now reaches members in 195+ countries, with World Stage, live streaming, voice & video calling, and a growing creator economy.' },
]

const products = [
  { icon: Users,         label: 'SmartzSocial',   color: 'text-violet-400',  bg: 'bg-violet-500/10'  },
  { icon: Heart,         label: 'SmartzDating',   color: 'text-pink-400',    bg: 'bg-pink-500/10'    },
  { icon: ShoppingBag,   label: 'SmartzMarket',   color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  { icon: Car,           label: 'SmartzRide',     color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: Package,       label: 'SmartzDelivery', color: 'text-sky-400',     bg: 'bg-sky-500/10'     },
  { icon: Tv,            label: 'SmartzTV',       color: 'text-purple-400',  bg: 'bg-purple-500/10'  },
  { icon: Megaphone,     label: 'SmartzAds',      color: 'text-rose-400',    bg: 'bg-rose-500/10'    },
  { icon: GraduationCap, label: 'SmartzLearning', color: 'text-teal-400',    bg: 'bg-teal-500/10'    },
]

const stats = [
  { value: '15K+', label: 'Users',     emoji: '👥' },
  { value: '195+', label: 'Countries', emoji: '🌍' },
  { value: '8',    label: 'Products',  emoji: '🧩' },
  { value: '2023', label: 'Founded',   emoji: '🇱🇷' },
]

/* ── small shared pill badge ─────────────────────────────────────── */
function Pill({ icon: Icon, label, gold }: { icon: React.ElementType; label: string; gold?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
      gold
        ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
        : 'bg-[#EC4899]/10 border-[#EC4899]/25 text-[#EC4899]'
    }`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm tracking-wide font-bold">{label}</span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
export default function AboutPage() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const siteConfig = useSiteConfig()
  const bgUrl = siteConfig.get(SITE_IMAGE_KEYS.teamPageBg)

  return (
    <div className="dark:bg-[#04000a] bg-gray-50 min-h-screen pt-16 sm:pt-20">

      {/* ── Hero banner ── */}
      <section className="relative overflow-hidden">
        <div className="relative h-64 sm:h-80 md:h-96 bg-gradient-to-br from-[#1a0a2e] via-[#0d0518] to-[#1d0a30]">
          {bgUrl && <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
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
              One identity.<br className="sm:hidden" /> Eight products.<br />
              <span className="text-pink-300">A whole continent, connected.</span>
            </h1>
            <p className="text-sm sm:text-base text-white/75 max-w-xl px-4">
              SmartzConnect is Africa's all-in-one super-app — built in Liberia, made for the world.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── ABOUT ── (replaces old simple Mission paragraph)              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden dark:bg-[#030008] bg-white py-16 sm:py-20 lg:py-24">
        {/* ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#DC2626]/6 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div {...up()}>
            {/* Pill badge */}
            <div className="mb-5">
              <Pill icon={Globe} label="About SmartzConnect" />
            </div>

            {/* Heading */}
            <h2 className="font-display font-black text-[clamp(1.6rem,5vw,3.2rem)] leading-tight dark:text-white text-gray-900 mb-5">
              Connecting, Collaborating<br />
              <span style={{
                background: 'linear-gradient(135deg, #EC4899 0%, #9B5DE5 50%, #DC2626 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                and Growing Together
              </span>
            </h2>

            <p className="dark:text-white/65 text-gray-700 text-base sm:text-lg leading-relaxed mb-4 max-w-3xl">
              SmartzConnect is a Liberian Enterprise and Social media that empowers individuals, businesses, organizations,
              and communities through innovative technology.
            </p>
            <p className="dark:text-white/55 text-gray-600 text-sm sm:text-base leading-relaxed mb-7 max-w-3xl">
              SmartzConnect brings multiple essential services together under a single trusted ecosystem — with one account,
              a user can access dating, education, transportation, commerce, marketing, social networking, and professional partnership.
            </p>

            {/* Tag pills */}
            <div className="flex flex-wrap gap-2.5">
              {['Liberian Enterprise', 'Built for the World', '195+ Countries', 'Social Media'].map(t => (
                <span
                  key={t}
                  className="inline-flex items-center px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold tracking-wide dark:text-white/80 text-gray-700 whitespace-nowrap"
                  style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.22)' }}
                >
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── VISION & MISSION ──                                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden dark:bg-[#04000a] bg-gray-50 py-16 sm:py-20 lg:py-24">
        {/* ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] rounded-full bg-[#EC4899]/5 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">

          {/* Section heading */}
          <motion.div {...up()} className="text-center mb-10 sm:mb-14">
            <div className="flex justify-center mb-5">
              <Pill icon={Target} label="Mission & Vision" />
            </div>
            <h2 className="font-display font-black text-[clamp(1.6rem,5vw,3.2rem)] leading-tight dark:text-white text-gray-900">
              Why{' '}
              <span style={{
                background: 'linear-gradient(135deg, #EC4899 0%, #DC2626 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                We Exist
              </span>
            </h2>
          </motion.div>

          {/* Vision + Mission cards */}
          <motion.div
            variants={stagger} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid md:grid-cols-2 gap-5 sm:gap-6 mb-8"
          >
            {/* Vision */}
            <motion.div
              variants={cardItem}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 260 }}
              className="relative rounded-3xl p-7 sm:p-10 overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl" style={{ background: 'rgba(236,72,153,0.18)' }} />
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 relative"
                style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DC2626 100%)' }}
              >
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display font-black dark:text-white text-gray-900 text-xl sm:text-2xl mb-3 relative">Our Vision</h3>
              <p className="dark:text-white/65 text-gray-700 text-base sm:text-lg leading-relaxed relative">
                To become Africa's leading all-in-one social Enterprise and digital ecosystem, connecting millions
                of people and businesses while showcasing Liberian innovation to the world.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 relative">
                {['Africa-Led', 'Liberian Innovation', 'Global Reach'].map(t => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full text-[11px] font-bold dark:text-white/70 text-gray-600"
                    style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.18)' }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Mission */}
            <motion.div
              variants={cardItem}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 260 }}
              className="relative rounded-3xl p-7 sm:p-10 overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-2xl" style={{ background: 'rgba(155,93,229,0.18)' }} />
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 relative"
                style={{ background: 'linear-gradient(135deg, #9B5DE5 0%, #EC4899 100%)' }}
              >
                <Handshake className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display font-black dark:text-white text-gray-900 text-xl sm:text-2xl mb-3 relative">Our Mission</h3>
              <p className="dark:text-white/65 text-gray-700 text-base sm:text-lg leading-relaxed relative">
                To connect and create opportunities through a single platform that makes everyday life easier by
                providing secure, accessible, and affordable digital solutions that empower people, businesses,
                and communities across Liberia and beyond.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 relative">
                {['Secure', 'Accessible', 'Affordable'].map(t => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full text-[11px] font-bold dark:text-white/70 text-gray-600"
                    style={{ background: 'rgba(155,93,229,0.08)', border: '1px solid rgba(155,93,229,0.18)' }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Founder quote */}
          <motion.div
            {...up(0.25)}
            className="relative rounded-3xl p-8 sm:p-10 overflow-hidden text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(236,72,153,0.10) 0%, rgba(155,93,229,0.12) 50%, rgba(220,38,38,0.08) 100%)',
              border: '1px solid rgba(236,72,153,0.20)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-56 h-24 rounded-full blur-3xl" style={{ background: 'rgba(236,72,153,0.15)' }} />
            <div className="text-4xl mb-4 relative opacity-60 font-serif leading-none text-pink-400">"</div>
            <p className="dark:text-white/80 text-gray-800 text-base sm:text-xl leading-relaxed relative italic max-w-3xl mx-auto mb-6">
              Yes! SmartzConnect is an African child's dream. But, was built for the world. Your contribution
              in whatever ways to keep it alive, is acceptable.
            </p>
            <p className="text-sm font-bold tracking-widest text-yellow-400 uppercase relative">
              — Shedrick K. Nungehn
            </p>
            <p className="dark:text-white/45 text-gray-500 text-xs mt-1 tracking-wider relative">
              Founder &amp; CEO, SmartzConnect
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── Remaining sections (Values, Timeline, Products, Stats, CTA) ── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div ref={ref} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">

        {/* ── Values ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.05 }}
          className="mb-14 sm:mb-20"
        >
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
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          className="mb-14 sm:mb-20"
        >
          <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl dark:text-white text-gray-900 text-center mb-8 sm:mb-10">
            Our <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Journey</span>
          </h2>
          <div className="relative pl-8 sm:pl-10">
            <div className="absolute left-[11px] sm:left-[15px] top-1 bottom-1 w-px bg-gradient-to-b from-purple-500/40 via-pink-500/30 to-transparent" />
            <div className="space-y-8 sm:space-y-10">
              {timeline.map((t, i) => (
                <motion.div key={t.year}
                  initial={{ opacity: 0, x: -16 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.1 + i * 0.1 }}
                  className="relative">
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
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15 }}
          className="mb-14 sm:mb-20"
        >
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
                <motion.div key={p.label}
                  initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.15 + i * 0.05 }}
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
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-14 sm:mb-20"
        >
          {stats.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.2 + i * 0.07 }}
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
