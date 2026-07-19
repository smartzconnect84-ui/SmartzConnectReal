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
  { year: '2023', title: 'The Idea',       desc: "Founder Shedrick K. Nungehn set out from Liberia to build one app that could replace ten — social, dating, ride-hailing, marketplace, delivery, streaming and ads — for every African." },
  { year: '2024', title: 'First Build',    desc: 'SmartzConnect launched its first products — SmartzSocial and SmartzDating — welcoming an early community across Liberia and West Africa.' },
  { year: '2025', title: 'The Super-App',  desc: 'SmartzRide, SmartzMarket, SmartzDelivery, SmartzTV and SmartzAds joined the platform, unifying seven products under one login.' },
  { year: '2026', title: 'Going Global',   desc: 'SmartzConnect now reaches members in 195+ countries, with World Stage, live streaming, voice & video calling, and a growing creator economy.' },
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
  { value: '15K+', label: 'Active Users',  emoji: '👥', accent: 'from-pink-500 to-rose-500' },
  { value: '195+', label: 'Countries',     emoji: '🌍', accent: 'from-violet-500 to-purple-500' },
  { value: '8',    label: 'Products',      emoji: '🧩', accent: 'from-amber-500 to-orange-500' },
  { value: '2023', label: 'Founded',       emoji: '🇱🇷', accent: 'from-emerald-500 to-teal-500' },
]

/* ── small shared pill badge ─────────────────────────────────────── */
function Pill({ icon: Icon, label, gold }: { icon: React.ElementType; label: string; gold?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
      gold
        ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
        : 'dark:bg-[#EC4899]/10 dark:border-[#EC4899]/25 dark:text-[#EC4899] bg-pink-50 border-pink-200 text-pink-600'
    }`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm tracking-wide font-bold">{label}</span>
    </div>
  )
}

/* ── Section wrapper for consistent spacing ───────────────────────── */
function Section({ children, className = '', dark = false }: {
  children: React.ReactNode
  className?: string
  dark?: boolean
}) {
  return (
    <section className={`relative overflow-hidden py-16 sm:py-20 lg:py-24 ${
      dark
        ? 'dark:bg-[#030008] bg-white'
        : 'dark:bg-[#04000a] bg-gray-50'
    } ${className}`}>
      {children}
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
export default function AboutPage() {
  const ref         = useRef(null)
  const timelineRef = useRef(null)
  const inView      = useInView(ref,         { once: true, margin: '-60px' })
  const tlInView    = useInView(timelineRef, { once: true, margin: '-60px' })

  const siteConfig = useSiteConfig()
  const bgUrl = siteConfig.get(SITE_IMAGE_KEYS.teamPageBg)

  return (
    <div className="dark:bg-[#04000a] bg-gray-50 min-h-screen pt-16 sm:pt-20">

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* HERO                                                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="relative h-64 sm:h-80 md:h-[420px] bg-gradient-to-br from-[#1a0a2e] via-[#0d0518] to-[#1d0a30]">
          {bgUrl && (
            <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          )}
          {/* Ambient glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-pink-500/20 blur-3xl" />
            <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-purple-500/15 blur-2xl" />
            <div className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full bg-violet-500/15 blur-3xl" />
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <motion.div {...up()} className="flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/12 backdrop-blur-sm border border-white/20 mb-4">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-300" />
                <span className="text-xs sm:text-sm font-semibold text-white tracking-wide">Our Story</span>
              </div>

              <p className="text-sm sm:text-base text-white/70 max-w-xl">
                SmartzConnect is Africa's all-in-one social media and commerce app, built in Liberia, made for the world.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* STATS STRIP — key numbers at a glance                        */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="dark:bg-[#070010] bg-white border-y dark:border-white/6 border-gray-100">
        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-4 divide-x dark:divide-white/6 divide-gray-100"
        >
          {stats.map(s => (
            <motion.div key={s.label} variants={cardItem} className="py-7 px-4 sm:px-6 text-center">
              <div className="text-2xl mb-1">{s.emoji}</div>
              <p className={`font-black text-2xl sm:text-3xl bg-gradient-to-r ${s.accent} bg-clip-text text-transparent`}>
                {s.value}
              </p>
              <p className="text-xs sm:text-sm dark:text-gray-500 text-gray-500 font-medium mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ABOUT SMARTZCONNECT                                           */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Section dark>
        {/* ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] rounded-full bg-[#EC4899]/5 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left — text */}
            <motion.div {...up()}>
              <div className="mb-5 text-left">
                <Pill icon={Globe} label="About SmartzConnect" />
              </div>
              <h2 className="font-display font-black dark:text-white text-gray-900 mb-5 text-center text-[23px]">
                Connecting, Collaborating<br />
                <span style={{
                  background: 'linear-gradient(135deg, #EC4899 0%, #9B5DE5 50%, #DC2626 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  and Growing Together.
                </span>
              </h2>
              <p className="dark:text-white/65 text-gray-700 text-base sm:text-lg leading-relaxed mb-4">
                SmartzConnect is a Liberian Enterprise and Social platform that empowers individuals,
                businesses, organizations, and communities through innovative technology.
              </p>
              <p className="dark:text-white/50 text-gray-600 text-sm sm:text-base leading-relaxed mb-7">
                With one account, a user accesses dating, education, transportation, commerce,
                marketing, social networking, streaming, and professional partnership — all under a single
                trusted ecosystem.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {['Liberian Enterprise', 'Built for the World', '195+ Countries', 'Social Media'].map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-wide dark:text-white/80 text-gray-700 whitespace-nowrap"
                    style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.22)' }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right — founder quote card */}
            <motion.div {...up(0.15)}>
              <div
                className="relative rounded-3xl p-8 sm:p-10 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(236,72,153,0.10) 0%, rgba(155,93,229,0.12) 50%, rgba(220,38,38,0.08) 100%)',
                  border: '1px solid rgba(236,72,153,0.20)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl bg-pink-500/15 pointer-events-none" />
                <div className="text-5xl mb-5 leading-none text-pink-400/50 font-serif relative">"</div>
                <p className="dark:text-white/80 text-gray-800 text-base sm:text-lg leading-relaxed italic mb-6 relative">
                  Yes! SmartzConnect is an African child's dream. But it was built for the world.
                  Your contribution in whatever ways to keep it alive, is acceptable.
                </p>
                <div className="flex items-center gap-3 relative pt-5 border-t border-white/10">
                  <img
                    src="/ceo-shedrick.jpg"
                    alt="Shedrick K. Nungehn"
                    className="w-11 h-11 rounded-full object-cover object-top ring-2 ring-pink-500/40"
                  />
                  <div>
                    <p className="text-sm font-bold dark:text-white text-gray-900">- Shedrick K. Nungehn -</p>
                    <p className="text-xs dark:text-white/45 text-gray-500">Founder &amp; CEO, SmartzConnect</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VISION & MISSION                                              */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Section className="!pt-0 !pb-0">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full bg-[#EC4899]/4 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">

          {/* Heading */}
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
                do we exist?
              </span>
            </h2>
            <p className="dark:text-gray-400 text-gray-600 mt-3 text-sm sm:text-base max-w-xl mx-auto">
              Two guiding principles shape everything we build at SmartzConnect.
            </p>
          </motion.div>

          {/* Vision + Mission cards */}
          <motion.div
            variants={stagger} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid md:grid-cols-2 gap-5 sm:gap-6"
          >
            {/* Vision */}
            <motion.div
              variants={cardItem}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 260 }}
              className="relative rounded-3xl p-7 sm:p-10 overflow-hidden dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-100 shadow-sm"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl bg-pink-500/10 pointer-events-none" />
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 relative flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DC2626 100%)' }}
              >
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display font-black dark:text-white text-gray-900 text-xl sm:text-2xl mb-3 relative">
                Our Vision
              </h3>
              <p className="dark:text-gray-300 text-gray-700 text-base leading-relaxed relative">
                To become world's leading all-in-one social Enterprise and digital media, connecting
                millions of people and businesses while showcasing Liberian arts and culture's Globally.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 relative">
                {['Africa-Led', 'Liberian Innovation', 'Global Reach'].map(t => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full text-[11px] font-bold dark:text-pink-300 text-pink-700"
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
              className="relative rounded-3xl p-7 sm:p-10 overflow-hidden dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-100 shadow-sm"
            >
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-2xl bg-purple-500/10 pointer-events-none" />
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 relative flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #9B5DE5 0%, #EC4899 100%)' }}
              >
                <Handshake className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display font-black dark:text-white text-gray-900 text-xl sm:text-2xl mb-3 relative">
                Our Mission
              </h3>
              <p className="dark:text-gray-300 text-gray-700 text-base leading-relaxed relative">
                To connect and create opportunities through a single platform that makes everyday life
                easier through a secure, accessible, and affordable digital solutions that empower
                people, businesses, and communities across Liberia and beyond.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 relative">
                {['Secure', 'Accessible', 'Affordable'].map(t => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full text-[11px] font-bold dark:text-purple-300 text-purple-700"
                    style={{ background: 'rgba(155,93,229,0.08)', border: '1px solid rgba(155,93,229,0.18)' }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VALUES                                                        */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Section dark>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...up()} className="text-center mb-10 sm:mb-12">
            <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl dark:text-white text-gray-900">
              Our{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Core Values
              </span>
            </h2>
            <p className="dark:text-gray-400 text-gray-600 mt-2 text-sm max-w-md mx-auto">
              The principles that guide every product decision we make.
            </p>
          </motion.div>

          <motion.div
            ref={ref}
            variants={stagger} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {values.map(v => {
              const Icon = v.icon
              return (
                <motion.div
                  key={v.title}
                  variants={cardItem}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-100 text-center hover:shadow-lg hover:border-purple-500/20 transition-all group"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 flex items-center justify-center group-hover:from-purple-500/25 group-hover:to-pink-500/25 transition-all">
                    <Icon className="w-6 h-6 text-pink-400" />
                  </div>
                  <h3 className="font-bold dark:text-white text-gray-900 mb-2 text-sm sm:text-base">{v.title}</h3>
                  <p className="text-xs sm:text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{v.desc}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* JOURNEY / TIMELINE                                            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Section>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...up()} className="text-center mb-10 sm:mb-14">
            <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl dark:text-white text-gray-900">
              Our{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Journey
              </span>
            </h2>
            <p className="dark:text-gray-400 text-gray-600 mt-2 text-sm max-w-md mx-auto">
              From a single idea in Liberia to a platform serving 195+ countries.
            </p>
          </motion.div>

          <div ref={timelineRef} className="relative pl-8 sm:pl-12">
            {/* Vertical line */}
            <div className="absolute left-[11px] sm:left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-purple-500/50 via-pink-500/30 to-transparent" />
            <div className="space-y-10 sm:space-y-12">
              {timeline.map((t, i) => (
                <motion.div
                  key={t.year}
                  initial={{ opacity: 0, x: -16 }}
                  animate={tlInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.1 + i * 0.12 }}
                  className="relative"
                >
                  {/* Dot */}
                  <div className="absolute -left-8 sm:-left-12 top-0.5 w-[22px] h-[22px] sm:w-[30px] sm:h-[30px] rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <span className="text-[11px] font-black tracking-widest text-pink-400 uppercase">{t.year}</span>
                  <h3 className="font-bold dark:text-white text-gray-900 text-sm sm:text-base mt-0.5 mb-1">{t.title}</h3>
                  <p className="text-xs sm:text-sm dark:text-gray-400 text-gray-600 leading-relaxed max-w-2xl">{t.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* PRODUCTS GRID                                                 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Section dark>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...up()} className="text-center mb-8 sm:mb-10">
            <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl dark:text-white text-gray-900">
              One Login,{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Eight Products
              </span>
            </h2>
            <p className="dark:text-gray-400 text-gray-600 mt-2 text-sm max-w-md mx-auto">
              Everything you need, everywhere you go — under a single identity.
            </p>
          </motion.div>

          <motion.div
            variants={stagger} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
          >
            {products.map(p => {
              const Icon = p.icon
              return (
                <motion.div
                  key={p.label}
                  variants={cardItem}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl p-5 sm:p-6 border dark:border-white/6 border-gray-100 text-center hover:border-purple-500/20 hover:shadow-md transition-all"
                >
                  <div className={`w-11 h-11 mx-auto mb-3 rounded-xl flex items-center justify-center ${p.bg}`}>
                    <Icon className={`w-5 h-5 ${p.color}`} />
                  </div>
                  <p className="text-xs sm:text-sm font-bold dark:text-white text-gray-900">{p.label}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* CTA                                                           */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Section>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-2xl bg-gradient-to-br from-[#1f0d38] via-[#2d1060] to-[#1a0a2e]">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-48 rounded-full bg-purple-500/20 blur-3xl" />
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-violet-500/15 blur-2xl" />
            </div>
            <div className="relative p-8 sm:p-12 text-center">
              <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl text-white mb-3">
                Built by a Team That Gets It
              </h2>
              <p className="text-white/70 mb-6 sm:mb-8 max-w-lg mx-auto text-sm sm:text-base">
                Meet the people behind SmartzConnect — or jump straight in and become part of the story.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/team"
                  className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold hover:bg-white/20 transition-colors inline-flex items-center justify-center gap-2 border border-white/20 text-sm"
                >
                  <Users2 className="w-4 h-4" /> Meet the Team
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold inline-flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-600/30 hover:opacity-90 transition-opacity"
                >
                  <Zap className="w-4 h-4" /> Get Started Free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>

    </div>
  )
}
