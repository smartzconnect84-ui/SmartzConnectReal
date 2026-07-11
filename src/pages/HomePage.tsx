import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import Hero from '@/components/Hero'
import {
  Heart, Globe, Users, Car, Package, ShoppingBag, Megaphone, Tv,
  Eye, Target, CheckCircle, UserPlus, Shield, Sparkles,
  Star, Zap, Award, TrendingUp, Handshake, ArrowRight,
} from 'lucide-react'

/* ── animation helpers ── */
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { type: 'spring' as const, stiffness: 160, damping: 22, delay },
})

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { duration: 0.7, delay },
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

const SERVICES = [
  {
    emoji: '❤️', icon: Heart, name: 'SmartzDating',
    color: 'from-[#EC4899] to-[#DC2626]',
    glow: 'shadow-pink-600/30',
    features: ['Smart Matching', 'Swipe & Match', 'Verified Profiles', 'Messaging', 'Voice & Video Calls', 'AI Recommendations'],
    desc: 'Find meaningful relationships with AI-powered matching, verified profiles, and safe communication tools.',
  },
  {
    emoji: '🌍', icon: Globe, name: 'SmartzConnect',
    color: 'from-[#DC2626] to-[#EC4899]',
    glow: 'shadow-red-600/30',
    features: ['Professional Networking', 'Careers', 'Companies', 'Business Connections', 'Communities', 'Events'],
    desc: 'Build your professional network, discover career opportunities, and grow your business across Africa and beyond.',
  },
  {
    emoji: '👥', icon: Users, name: 'SmartzSocial',
    color: 'from-[#EC4899] to-rose-700',
    glow: 'shadow-pink-500/30',
    features: ['Posts', 'Stories', 'Reels', 'Groups', 'Pages', 'Live Streaming', 'Messaging'],
    desc: "Share life's moments, go live, join communities, and stay close to the people who matter.",
  },
  {
    emoji: '🚗', icon: Car, name: 'SmartzRide',
    color: 'from-rose-700 to-[#DC2626]',
    glow: 'shadow-rose-700/30',
    features: ['Ride Booking', 'Driver Platform', 'Live Tracking', 'Scheduled Trips', 'Secure Payments'],
    desc: 'Safe, affordable ride-hailing with verified drivers and real-time tracking across African cities.',
  },
  {
    emoji: '📦', icon: Package, name: 'SmartzDelivery',
    color: 'from-[#DC2626] to-rose-800',
    glow: 'shadow-red-700/30',
    features: ['Food Delivery', 'Grocery Delivery', 'Parcel Delivery', 'Courier Services', 'Live Tracking'],
    desc: 'Fast, reliable local delivery connecting vendors with customers across every neighbourhood.',
  },
  {
    emoji: '🛍', icon: ShoppingBag, name: 'SmartzMarket',
    color: 'from-rose-600 to-[#EC4899]',
    glow: 'shadow-rose-600/30',
    features: ['Buy & Sell', 'Business Stores', 'Digital Products', 'Secure Checkout'],
    desc: "Africa's social marketplace — list products, accept Mobile Money, and reach millions of buyers.",
  },
  {
    emoji: '📢', icon: Megaphone, name: 'SmartzAds',
    color: 'from-[#EC4899] to-[#DC2626]',
    glow: 'shadow-pink-700/30',
    features: ['Sponsored Ads', 'Campaign Management', 'Analytics', 'Audience Targeting'],
    desc: 'Run powerful ad campaigns targeted to Africa\'s most engaged digital community.',
  },
  {
    emoji: '📺', icon: Tv, name: 'SmartzTV',
    color: 'from-[#DC2626] to-[#EC4899]',
    glow: 'shadow-red-600/30',
    features: ['Videos', 'Live Streaming', 'Creator Channels', 'Podcasts', 'Entertainment', 'Education'],
    desc: 'Broadcast to millions, earn virtual gifts, and build your creator empire on SmartzTV.',
  },
]

const VALUES = [
  { icon: Handshake, title: 'Meaningful Connections', titleSize: 'text-[157px]', desc: 'We believe genuine human relationships have the power to change lives.' },
  { icon: Shield,    title: 'Trust & Safety',         titleSize: 'text-[1px]',   desc: 'We foster a safe, respectful, and transparent environment where people connect with confidence.' },
  { icon: Globe,     title: 'Community',               titleSize: 'text-[1px]',   desc: 'We celebrate diversity and create spaces where everyone belongs, from Liberia to the world.' },
  { icon: Zap,       title: 'Innovation',              titleSize: 'text-[17px]',  desc: 'We continuously build smarter technologies that strengthen human connection.' },
  { icon: Award,     title: 'Integrity',               titleSize: 'text-[1px]',   desc: 'We act with honesty, accountability, and professionalism in every interaction.' },
  { icon: Users,     title: 'Inclusion',               titleSize: 'text-[1px]',   desc: 'We welcome people from every background, culture, and community.' },
  { icon: Star,      title: 'Excellence',              titleSize: 'text-[17px]',  desc: 'We strive to deliver world-class experiences in everything we create.' },
  { icon: TrendingUp,title: 'Growth',                  titleSize: 'text-[17px]',  desc: 'We empower individuals, communities, and businesses to reach their full potential.' },
]

const WHY_LIST = [
  'One identity. Access all 8 super-products with a single free account.',
  'Connect with friends, meet meaningful relationships, build lasting communities.',
  'Book rides, order food, and shop — all without leaving the app.',
  'Go live, create content, and earn revenue through SmartzTV.',
  'Grow your business with powerful advertising and marketplace tools.',
  'Stay in touch through secure messaging, voice calls, and video calls.',
  'Verified profiles and AI-powered matching built for authentic connections.',
  'Built in Liberia for Africa and the world — Mobile Money payments accepted.',
]

const DATING_FEATURES = [
  'AI-Powered Smart Matching', 'Swipe & Match Discovery', 'Verified Profile Badges',
  'Icebreaker Prompts', 'Interest-Based Compatibility', 'Secure Private Conversations',
  'Voice & Video Dating Calls', 'Safety Reporting & Blocking', 'Profile Boost',
  'Super Likes & Match Alerts',
]
const SOCIAL_FEATURES = [
  'Personalized News Feed', 'Stories, Reels & Videos', 'Live Streaming on SmartzTV',
  'Groups & Communities', 'Pages & Public Profiles', 'Private & Group Messaging',
  'Creator Channels & Podcasts', 'Real-Time Notifications', 'Events & Meetups',
  'Memories & Saved Content',
]
const BUSINESS_FEATURES = [
  'Professional Profiles & Pages', 'SmartzMarket — Buy & Sell', 'SmartzAds Campaigns',
  'Sponsored Ads & Analytics', 'Business Networking & Leads', 'SmartzRide Driver Platform',
  'SmartzDelivery Courier Services', 'Audience Targeting Tools', 'Secure Mobile Money Checkout',
  'Career & Job Opportunities',
]

const STEPS = [
  { n: '01', label: 'Create your free SmartzConnect account in seconds — no credit card required.' },
  { n: '02', label: 'Verify your email address or phone number to secure your identity.' },
  { n: '03', label: 'Complete your profile, set your interests, and personalize your experience.' },
  { n: '04', label: 'Connect with friends, meet new people, or discover meaningful relationships.' },
  { n: '05', label: 'Join communities, share your experiences, and engage with others.' },
  { n: '06', label: 'Explore the marketplace, ride-hailing, delivery, TV, and advertising tools.' },
  { n: '07', label: 'Upgrade to Plus or Pro to unlock every feature across all 8 super-products.' },
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

/* ── feature pill ── */
function Pill({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2.5 text-[17px] text-white/75">
      <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899] flex-shrink-0" />
      {label}
    </li>
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

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-[9px] pb-[9px]">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            {/* Text */}
            <motion.div {...up()}>
              <div className="flex justify-center">
                <Badge icon={Globe} label="About SmartzConnect" className="mb-5" />
              </div>
              <Heading>
                One Platform.<br />
                <span style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DC2626 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Endless Connections.
                </span>
              </Heading>
              <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-5">
                SmartzConnect is a next-generation super app built in Liberia for the world — bringing together dating, social networking, professional networking, transportation, delivery, marketplace, advertising, and video entertainment into one secure ecosystem.
                <br /><br />
                With a single identity, you unlock eight powerful products designed to connect people, grow businesses, and create opportunities across Africa and beyond.
              </p>
              <p className="text-white/50 sm:text-base text-[14px]">
                Our mission is simple: turn every connection into something valuable, authentic, and life-changing — for individuals, entrepreneurs, and communities everywhere.
              </p>
            </motion.div>

            {/* 8-product grid */}
            <motion.div {...up(0.18)} className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { val: 'SmartzDating',   sub: 'Smart Matching',   grd: 'from-[#EC4899] to-[#DC2626]' },
                { val: 'SmartzSocial',   sub: 'Posts & Stories',  grd: 'from-[#DC2626] to-rose-700'  },
                { val: 'SmartzRide',     sub: 'Ride Booking',     grd: 'from-rose-700 to-[#DC2626]'  },
                { val: 'SmartzMarket',   sub: 'Buy & Sell',       grd: 'from-[#EC4899] to-rose-700'  },
                { val: 'SmartzDelivery', sub: 'Fast Delivery',    grd: 'from-[#DC2626] to-[#EC4899]' },
                { val: 'SmartzAds',      sub: 'Ad Campaigns',     grd: 'from-[#EC4899] to-[#DC2626]' },
                { val: 'SmartzTV',       sub: 'Live & Creator',   grd: 'from-[#DC2626] to-rose-600'  },
                { val: 'Pro Network',    sub: 'Careers & Biz',    grd: 'from-rose-600 to-[#DC2626]'  },
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

      {/* ══ 2. VISION ════════════════════════════════════════════════════════ */}
      <Sec id="vision">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full bg-[#EC4899]/5 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div {...up()}>
            <Badge icon={Eye} label="Our Vision" />
            <Heading>
              The World's Most{' '}
              <span style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DC2626 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Trusted Platform
              </span>
            </Heading>
          </motion.div>
          <motion.div {...up(0.14)}>
            <div className="relative mx-auto max-w-3xl">
              <div className="absolute -inset-1 rounded-3xl blur-xl" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.22) 0%, rgba(220,38,38,0.22) 100%)' }} />
              <div className="relative rounded-3xl p-8 sm:p-12"
                style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-6xl font-display font-black text-[#EC4899]/20 leading-none mb-2 select-none">"</div>
                <p className="text-base sm:text-xl text-white/80 leading-relaxed font-medium text-center">
                  To become the world's most trusted super app — built in Liberia, embraced by Africa, chosen by the world — where every person can connect, build, earn, and thrive through one secure digital identity.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(236,72,153,0.4))' }} />
                  <span className="text-xs text-yellow-400 font-bold tracking-widest uppercase">-CEO, Shedrick K. Nungehn-</span>
                  <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(236,72,153,0.4))' }} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Sec>

      {/* ══ 3. MISSION ═══════════════════════════════════════════════════════ */}
      <Sec dark id="mission">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-[500px] h-[500px] rounded-full bg-[#DC2626]/6 blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-[10px] pb-[10px]">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            {/* Pillars */}
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} className="space-y-3 order-2 lg:order-1">
              {[
                { icon: '🤝', title: 'Connect Beyond Borders',    desc: 'A platform where people reach across geographies to form lasting bonds — from Monrovia to the world.' },
                { icon: '🛡️', title: 'Safe & Inclusive Spaces',   desc: 'A verified, respectful environment where friendships flourish and communities thrive together.' },
                { icon: '💡', title: 'Innovation at the Core',     desc: 'Building smarter technologies that make meaningful human connection and commerce effortless.' },
                { icon: '🌱', title: 'Accessible Opportunities',   desc: 'Ensuring every person can access connections, businesses, jobs, and careers that improve their life.' },
              ].map((p) => (
                <motion.div key={p.title} variants={cardItem}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-2xl flex-shrink-0 mt-0.5">{p.icon}</span>
                  <div>
                    <p className="font-bold text-white text-sm sm:text-base mb-1">{p.title}</p>
                    <p className="sm:text-[17px] text-white/50 text-[14px]">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Text */}
            <motion.div {...up()} className="order-1 lg:order-2">
              <div className="flex justify-center">
                <Badge icon={Target} label="Our Mission" className="mb-5" />
              </div>
              <Heading>
                Built in Liberia.{' '}
                <span style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DC2626 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  For the World.
                </span>
              </Heading>
              <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-5">
                Our mission is to connect people beyond borders — creating a safe, inclusive, and innovative super app where friendships flourish, relationships grow, communities unite, businesses thrive, and opportunities become accessible to everyone.
              </p>
              <p className="text-white/40 text-sm sm:text-base leading-relaxed border-l-2 border-[#EC4899]/40 pl-4 italic">
                "We are committed to making meaningful human connection — and real economic opportunity — the foundation of everything we build."
              </p>
            </motion.div>
          </div>
        </div>
      </Sec>

      {/* ══ 4. SERVICES (8 products) ══════════════════════════════════════════ */}
      <Sec id="services">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#EC4899]/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#DC2626]/5 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div {...up()} className="text-center mb-12 sm:mb-16">
            <Badge icon={Sparkles} label="8 Super-Products" />
            <Heading>
              One Identity.{' '}
              <span style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DC2626 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Endless Possibilities.
              </span>
            </Heading>
            <p className="text-white/50 max-w-2xl mx-auto text-base sm:text-lg">
              SmartzConnect brings together eight powerful products into one connected ecosystem — built around the most important thing: people.
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {SERVICES.map((s) => {
              const Icon = s.icon
              return (
                <motion.div key={s.name} variants={cardItem}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="group p-5 sm:p-6 rounded-2xl relative overflow-hidden cursor-default"
                  style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {/* Hover glow overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500 rounded-2xl`} />
                  {/* Top accent line */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${s.color} opacity-0 group-hover:opacity-60 transition-opacity duration-300`} />
                  <motion.div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 shadow-lg ${s.glow}`}
                    whileHover={{ scale: 1.12, rotate: 5 }} transition={{ type: 'spring', stiffness: 400 }}>
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-lg">{s.emoji}</span>
                    <h3 className="font-display font-black text-sm sm:text-base text-white leading-tight">{s.name}</h3>
                  </div>
                  <p className="text-white/50 text-[14px] sm:text-[17px] mb-3 leading-relaxed">{s.desc}</p>
                  <ul className="space-y-1">
                    {s.features.map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-[13px] text-white/40">
                        <span className="w-1 h-1 rounded-full bg-[#EC4899]/60 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </Sec>

      {/* ══ 5. CORE VALUES ═══════════════════════════════════════════════════ */}
      <Sec dark id="values">
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
            <p className="text-white/50 max-w-xl mx-auto text-base sm:text-lg">
              Our values are not aspirations on a wall — they are the decisions we make in everything we build.
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {VALUES.map((v) => {
              const Icon = v.icon
              return (
                <motion.div key={v.title} variants={cardItem}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="p-6 rounded-2xl group relative overflow-hidden cursor-default"
                  style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="absolute top-0 left-6 right-6 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.4), transparent)' }} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                    style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.04) 0%, rgba(236,72,153,0.04) 100%)' }} />
                  <motion.div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 relative"
                    whileHover={{ scale: 1.15, rotate: 8 }} transition={{ type: 'spring', stiffness: 400 }}
                    style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(212,175,55,0.15) 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Icon className="w-5 h-5 text-[#EC4899]" />
                  </motion.div>
                  <h3 className="font-display font-bold text-white text-sm sm:text-base mb-2 relative">{v.title}</h3>
                  <p className="sm:text-[17px] text-white/50 text-[14px] relative">{v.desc}</p>
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


    </main>
  )
}
