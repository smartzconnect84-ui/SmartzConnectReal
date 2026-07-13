import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import Hero from '@/components/Hero'
import DownloadAppButton from '@/components/DownloadAppButton'
import {
  Heart, Globe, Users, Car, Package, ShoppingBag, Megaphone, Tv,
  Eye, Target, CheckCircle, UserPlus, Shield, Sparkles,
  Star, Zap, Award, TrendingUp, Handshake, GraduationCap,
  Wifi, Smartphone, BadgeCheck,
} from 'lucide-react'
import { useServices } from '@/hooks/useServices'

/* ── animation helpers ── */
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { type: 'spring' as const, stiffness: 160, damping: 22, delay },
})

const stagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
const cardItem: Variants = {
  hidden:  { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { type: 'spring', stiffness: 180, damping: 22 } },
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  BRAND PALETTE                                                              */
/* ────────────────────────────────────────────────────────────────────────── */
// Pink:  #EC4899
// Red:   #DC2626
// Gold:  #D4AF37
// Black: #000000 / #05000d
// White: #ffffff

/* ────────────────────────────────────────────────────────────────────────── */
/*  DATA                                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

// Colors match each product's own dedicated sub-page brand identity (src/pages/public/*)
const SERVICES = [
  {
    emoji: '❤️', icon: Heart, name: 'SmartzDating', route: '/smartzdating',
    hero: '/hero-images/dating-hero.png',
    color: 'from-pink-500 to-rose-500',
    glow: 'shadow-pink-500/30',
  },
  {
    emoji: '🎓', icon: GraduationCap, name: 'SmartzLearning', route: '/smartzlearning',
    hero: '/smartz-learning-hero.png',
    color: 'from-[#9B5DE5] to-[#EC4899]',
    glow: 'shadow-purple-600/30',
  },
  {
    emoji: '👥', icon: Users, name: 'SmartzSocial', route: '/smartzsocial',
    hero: '/hero-images/social-hero.png',
    color: 'from-blue-500 to-violet-600',
    glow: 'shadow-blue-500/30',
  },
  {
    emoji: '🚗', icon: Car, name: 'SmartzRide', route: '/smartzride',
    hero: '/hero-images/ride-hero.png',
    color: 'from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/30',
  },
  {
    emoji: '📦', icon: Package, name: 'SmartzDelivery', route: '/smartzdelivery',
    hero: '/hero-images/delivery-hero.png',
    color: 'from-blue-500 to-indigo-600',
    glow: 'shadow-blue-500/30',
  },
  {
    emoji: '🛍', icon: ShoppingBag, name: 'SmartzMarket', route: '/smartzmarket',
    hero: '/smartz-market-hero.png',
    color: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/30',
  },
  {
    emoji: '📢', icon: Megaphone, name: 'SmartzAds', route: '/smartzads',
    hero: '/smartz-ads-hero.png',
    color: 'from-fuchsia-500 to-pink-600',
    glow: 'shadow-fuchsia-500/30',
  },
  {
    emoji: '📺', icon: Tv, name: 'SmartzTV', route: '/smartztv',
    hero: '/smartz-tv-hero.png',
    color: 'from-violet-600 to-purple-600',
    glow: 'shadow-violet-600/30',
  },
]

const VALUES = [
  { icon: Handshake, title: 'Connection',   desc: 'Genuine relationships that change lives.' },
  { icon: Shield,    title: 'Trust & Safety', desc: 'Safe, verified, and transparent by design.' },
  { icon: Globe,     title: 'Community',    desc: 'Everyone belongs — Liberia to the world.' },
  { icon: Zap,       title: 'Innovation',   desc: 'Smarter technology, stronger connection.' },
  { icon: Award,     title: 'Integrity',    desc: 'Honest, accountable, professional.' },
  { icon: Users,     title: 'Inclusion',    desc: 'Every background, culture, community.' },
  { icon: Star,      title: 'Excellence',   desc: 'World-class in everything we build.' },
  { icon: TrendingUp,title: 'Growth',       desc: 'Empowering people to reach their potential.' },
]

const TRUST_BADGES = [
  { icon: BadgeCheck, label: 'Verified Profiles' },
  { icon: Shield,      label: 'SSL Secured' },
  { icon: Wifi,        label: '195+ Countries' },
  { icon: Smartphone,  label: 'Free to Join' },
]

const WHY_LIST = [
  'One identity. Access all 8 super-products with a single free account.',
  'Connect with friends, meet meaningful relationships, build lasting communities.',
  'Book rides, order food, and shop — all without leaving the app.',
  'Go live, create content, and earn revenue through SmartzTV.',
  'Grow your business with powerful advertising and marketplace tools.',
  'Stay in touch through secure messaging, voice calls, and video calls.',
  'Verified profiles and AI-powered matching built for authentic connections.',
  'Built in Liberia for Africa and the world.',
]

/* ── shared section shell ── */
function Sec({ id, dark, children }: { id?: string; dark?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`relative overflow-hidden py-16 sm:py-20 lg:py-24 pt-[9px] pb-[9px] ${dark ? 'bg-[#030008]' : 'bg-[#04000a]'}`}>
      {children}
    </section>
  )
}

/* ── pill badge ── */
function Badge({ icon: Icon, label, gold, className = 'mb-5' }: { icon: React.ElementType; label: string; gold?: boolean; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
      gold
        ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
        : 'bg-[#EC4899]/10 border-[#EC4899]/25 text-[#EC4899]'
    } ${className}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm tracking-wide font-bold">{label}</span>
    </div>
  )
}

/* ── section heading ── */
function Heading({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`font-display font-black sm:text-[2.6rem] lg:text-[3.45rem] text-white mb-4 text-[23px] text-center ${className}`}>
      {children}
    </h2>
  )
}

/* ════════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <main className="bg-black">
      <Hero />

      {/* ══ 1. ABOUT US ══════════════════════════════════════════════════════ */}
      <Sec dark id="about">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#DC2626]/6 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            {/* Text */}
            <motion.div {...up()}>
              <Badge icon={Globe} label="About SmartzConnect" className="mb-5" />
              <Heading className="text-left">
                Connecting, Collaborating<br />
                <span style={{ background: 'linear-gradient(135deg, #EC4899 0%, #9B5DE5 50%, #DC2626 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  and Growing Together
                </span>
              </Heading>
              <p className="text-white/65 text-base sm:text-lg leading-relaxed mb-4">
                SmartzConnect is a Liberian Enterprise and Social media that empowers individuals, businesses, organizations, and communities through innovative technology.
              </p>
              <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-6">
                SmartzConnect brings multiple essential services together under a single trusted ecosystem — with one account, a user can access dating, education, transportation, commerce, marketing, social networking, and professional partnership.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {['Liberian Enterprise', 'Built for the World', '195+ Countries'].map(t => (
                  <span key={t} className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white/70"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>{t}</span>
                ))}
              </div>
            </motion.div>

            {/* 8-product grid */}
            <motion.div {...up(0.18)} className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { val: 'SmartzDating',   sub: 'Smart Matching',   grd: 'from-[#EC4899] to-[#DC2626]' },
                { val: 'SmartzSocial',   sub: 'Posts & Stories',  grd: 'from-[#DC2626] to-rose-700'  },
                { val: 'SmartzTV',       sub: 'Live & Creator',   grd: 'from-[#9B5DE5] to-[#DC2626]' },
                { val: 'SmartzRide',     sub: 'Ride Booking',     grd: 'from-rose-700 to-[#DC2626]'  },
                { val: 'SmartzMarket',   sub: 'Buy & Sell',       grd: 'from-[#EC4899] to-rose-700'  },
                { val: 'SmartzDelivery', sub: 'Fast Delivery',    grd: 'from-[#DC2626] to-[#EC4899]' },
                { val: 'SmartzLearning', sub: 'Courses & Skills', grd: 'from-[#9B5DE5] to-[#EC4899]' },
                { val: 'SmartzAds',      sub: 'Ad Campaigns',     grd: 'from-[#EC4899] to-[#DC2626]' },
              ].map((s, i) => (
                <motion.div key={s.sub}
                  initial={{ opacity: 0, scale: 0.94 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  className="p-4 sm:p-5 rounded-2xl text-center relative overflow-hidden cursor-default"
                  style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  <div className={`absolute inset-0 opacity-[0.08] bg-gradient-to-br ${s.grd}`} />
                  <p className={`font-display font-black text-sm sm:text-base bg-gradient-to-r ${s.grd} bg-clip-text text-transparent mb-1 relative`}>{s.val}</p>
                  <p className="text-sm text-white/50 relative">{s.sub}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </Sec>

      {/* ══ 2. MISSION & VISION ═════════════════════════════════════════════ */}
      <Sec id="mission">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] rounded-full bg-[#EC4899]/5 blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div {...up()} className="text-center mb-10 sm:mb-14">
            <Badge icon={Target} label="Mission & Vision" />
            <Heading>
              Why{' '}
              <span style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DC2626 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                We Exist
              </span>
            </Heading>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            className="grid md:grid-cols-2 gap-5 sm:gap-6 mb-8">

            {/* Vision card */}
            <motion.div variants={cardItem} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 260 }}
              className="relative rounded-3xl p-7 sm:p-10 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl" style={{ background: 'rgba(236,72,153,0.18)' }} />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 relative"
                style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DC2626 100%)' }}>
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display font-black text-white text-xl sm:text-2xl mb-3 relative">Our Vision</h3>
              <p className="text-white/65 text-base sm:text-lg leading-relaxed relative">
                To become Africa's leading all-in-one social Enterprise and digital ecosystem, connecting millions of people and businesses while showcasing Liberian innovation to the world.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 relative">
                {['Africa-Led', 'Liberian Innovation', 'Global Reach'].map(t => (
                  <span key={t} className="px-3 py-1 rounded-full text-[11px] font-bold text-white/70"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>{t}</span>
                ))}
              </div>
            </motion.div>

            {/* Mission card */}
            <motion.div variants={cardItem} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 260 }}
              className="relative rounded-3xl p-7 sm:p-10 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-2xl" style={{ background: 'rgba(155,93,229,0.18)' }} />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 relative"
                style={{ background: 'linear-gradient(135deg, #9B5DE5 0%, #EC4899 100%)' }}>
                <Handshake className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display font-black text-white text-xl sm:text-2xl mb-3 relative">Our Mission</h3>
              <p className="text-white/65 text-base sm:text-lg leading-relaxed relative">
                To connect and create opportunities through a single platform that makes everyday life easier by providing secure, accessible, and affordable digital solutions that empower people, businesses, and communities across Liberia and beyond.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 relative">
                {['Secure', 'Accessible', 'Affordable'].map(t => (
                  <span key={t} className="px-3 py-1 rounded-full text-[11px] font-bold text-white/70"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>{t}</span>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Founder quote */}
          <motion.div {...up(0.25)}
            className="relative rounded-3xl p-8 sm:p-10 overflow-hidden text-center"
            style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(155,93,229,0.12) 50%, rgba(220,38,38,0.08) 100%)', border: '1px solid rgba(236,72,153,0.2)', backdropFilter: 'blur(16px)' }}>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-56 h-24 rounded-full blur-3xl" style={{ background: 'rgba(236,72,153,0.15)' }} />
            <div className="text-4xl mb-4 relative opacity-60 font-serif leading-none text-pink-400">"</div>
            <p className="text-white/80 text-base sm:text-xl leading-relaxed relative italic max-w-3xl mx-auto mb-6">
              Yes! SmartzConnect is an African child's dream. But, was built for the world. Your contribution in whatever ways to keep it alive, is acceptable.
            </p>
            <div className="flex items-center justify-center gap-3 relative">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-pink-400/60" />
              <span className="text-sm font-bold tracking-widest text-yellow-400 uppercase">— Shedrick K. Nungehn</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-pink-400/60" />
            </div>
            <p className="text-white/35 text-xs mt-1 tracking-wider">Founder & CEO, SmartzConnect</p>
          </motion.div>
        </div>
      </Sec>

      {/* ══ 3. ECOSYSTEM (8 products) ════════════════════════════════════════ */}
      <Sec dark id="services">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#EC4899]/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#DC2626]/5 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div {...up()} className="text-center mb-12 sm:mb-16">
            <Badge icon={Sparkles} label="The Ecosystem" />
            <Heading>
              One Identity.{' '}
              <span style={{ background: 'linear-gradient(135deg, #EC4899 0%, #9B5DE5 50%, #DC2626 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Eight Worlds.
              </span>
            </Heading>
            <p className="text-white/50 max-w-2xl mx-auto text-base sm:text-lg">
              Every product, one app, one account.
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            {SERVICES.map((s) => (
              <motion.div key={s.name} variants={cardItem}
                whileHover={{ y: -6, scale: 1.015 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* Service name label */}
                <div className="flex items-center gap-2.5 mb-3 px-0.5">
                  <div className={`h-5 w-[3px] rounded-full bg-gradient-to-b ${s.color} flex-shrink-0`} />
                  <span className="font-display font-black text-white text-sm sm:text-base tracking-tight">{s.name}</span>
                </div>
                <Link
                  to={s.route}
                  className="group block rounded-2xl relative overflow-hidden aspect-[16/10]"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <img
                    src={s.hero}
                    alt={s.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Hover glow overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-[0.12] transition-opacity duration-500`} />
                  {/* Top accent line */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${s.color} opacity-0 group-hover:opacity-80 transition-opacity duration-300`} />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Sec>

      {/* ══ 4. CORE VALUES ═══════════════════════════════════════════════════ */}
      <Sec id="values">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[#DC2626]/5 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-[10px] pb-[10px]">
          <motion.div {...up()} className="text-center mb-12 sm:mb-16">
            <Badge icon={Award} label="Core Values" gold />
            <Heading>
              The Principles That{' '}
              <span style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #EC4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Define Us
              </span>
            </Heading>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {VALUES.map((v) => {
              const Icon = v.icon
              return (
                <motion.div key={v.title} variants={cardItem}
                  whileHover={{ y: -5, scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="p-5 sm:p-6 rounded-2xl group relative overflow-hidden cursor-default text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="absolute top-0 left-6 right-6 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.4), transparent)' }} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                    style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.05) 0%, rgba(236,72,153,0.05) 100%)' }} />
                  <motion.div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3.5 relative mx-auto"
                    whileHover={{ scale: 1.15, rotate: 8 }} transition={{ type: 'spring', stiffness: 400 }}
                    style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(212,175,55,0.15) 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Icon className="w-5 h-5 text-[#EC4899]" />
                  </motion.div>
                  <h3 className="font-display font-bold text-white text-sm sm:text-base mb-1.5 relative">{v.title}</h3>
                  <p className="text-white/45 text-[13px] sm:text-sm relative">{v.desc}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </Sec>

      {/* ══ 6. WHY CHOOSE US ═════════════════════════════════════════════════ */}
      <Sec id="why">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#EC4899]/6 blur-3xl" />
          <div className="absolute right-0 bottom-0 w-[400px] h-[400px] rounded-full bg-[#DC2626]/5 blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            {/* Text */}
            <motion.div {...up()}>
              <div className="flex justify-center">
                <Badge icon={CheckCircle} label="Why Choose Us?" className="mb-5" />
              </div>
              <Heading>
                More Than Just{' '}
                <span style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DC2626 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  An App
                </span>
              </Heading>
              <p className="text-white/60 sm:text-lg text-[14px] mb-5">
                SmartzConnect is where friendships begin, relationships grow, businesses connect, creators earn, and communities flourish — all in one place.
              </p>
              <p className="text-white/50 text-sm sm:text-base leading-relaxed mb-8">
                With one free account, you unlock all eight products:
              </p>
            </motion.div>

            {/* Checklist */}
            <motion.div {...up(0.14)}>
              <motion.ul variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} className="space-y-3">
                {WHY_LIST.map((item, i) => (
                  <motion.li key={i} variants={cardItem}
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="flex items-start gap-3.5 p-4 rounded-xl transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md"
                      style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DC2626 100%)', boxShadow: '0 4px 12px rgba(236,72,153,0.25)' }}>
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[17px] text-white/70 leading-relaxed">{item}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </div>
        </div>
      </Sec>

      {/* ══ 7. FINAL CTA ═════════════════════════════════════════════════════ */}
      <Sec dark id="join">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-[#EC4899]/8 blur-3xl" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#9B5DE5]/10 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <motion.div {...up()}>
            <div className="relative mx-auto max-w-3xl">
              <div className="absolute -inset-1 rounded-[2rem] blur-xl" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.25) 0%, rgba(155,93,229,0.2) 50%, rgba(220,38,38,0.25) 100%)' }} />
              <div className="relative rounded-[2rem] p-8 sm:p-14"
                style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Badge icon={Sparkles} label="Join SmartzConnect" className="mb-5 mx-auto" />
                <Heading className="mb-4">
                  Your Super App{' '}
                  <span style={{ background: 'linear-gradient(135deg, #EC4899 0%, #9B5DE5 50%, #DC2626 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    Starts Here.
                  </span>
                </Heading>
                <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
                  One free account. Eight worlds. Join millions already connecting, earning, and growing on SmartzConnect.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-9">
                  <DownloadAppButton variant="yellow" />
                  <Link to="/register">
                    <motion.div
                      className="relative"
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                    >
                      <motion.span
                        className="absolute inset-0 rounded-xl pointer-events-none"
                        animate={{ boxShadow: ['0 0 0 0px rgba(220,38,38,0.5)', '0 0 0 10px rgba(220,38,38,0)', '0 0 0 0px rgba(220,38,38,0)'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', repeatDelay: 0.4 }}
                      />
                      <motion.span
                        whileHover={{ scale: 1.1, y: -3 }}
                        whileTap={{ scale: 0.9, y: 0 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 15 }}
                        className="relative inline-flex items-center gap-2 font-bold text-sm sm:text-[15px] rounded-xl px-5 sm:px-7 py-2.5 sm:py-3 text-white cursor-pointer overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #DC2626 0%, #EC4899 100%)', boxShadow: '0 6px 24px rgba(220,38,38,0.35)' }}
                      >
                        <motion.span
                          className="absolute inset-0 pointer-events-none"
                          style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)' }}
                          initial={{ x: '-120%' }}
                          whileHover={{ x: '120%' }}
                          transition={{ duration: 0.7, ease: 'easeInOut' }}
                        />
                        <motion.span className="relative flex" whileHover={{ rotate: [0, -12, 12, 0] }} transition={{ duration: 0.5 }}>
                          <UserPlus className="w-4 h-4" />
                        </motion.span>
                        <span className="relative">Create Account</span>
                      </motion.span>
                    </motion.div>
                  </Link>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                  {TRUST_BADGES.map(t => {
                    const Icon = t.icon
                    return (
                      <div key={t.label} className="flex items-center gap-1.5 text-[12px] sm:text-[13px] text-white/45 font-medium">
                        <Icon className="w-3.5 h-3.5 text-emerald-500/70" />
                        {t.label}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Sec>

    </main>
  )
}
