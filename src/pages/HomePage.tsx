import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Hero from '@/components/Hero'
import {
  Users, Heart, Briefcase, ShoppingBag, GraduationCap, Monitor,
  Eye, Target, CheckCircle, UserPlus, Globe, Shield, Sparkles,
  Star, Zap, Award, TrendingUp, Handshake, ArrowRight,
} from 'lucide-react'

/* ── animation ── */
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as any },
})

/* ── palette tokens ── */
// Pink:   #ec4899  #f472b6
// Purple: #9333ea  #a855f7  #7c3aed
// Black:  #000000  #05000d  #0a0014
// White:  #ffffff  rgba(255,255,255,…)

/* ────────────────────────────────────────────────────────────────────────── */
/*  DATA                                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

const SERVICES = [
  {
    emoji: '❤️', icon: Heart, name: 'Social Networking',
    color: 'from-pink-500 to-rose-600',
    glow: 'shadow-pink-500/25',
    desc: "Share life's moments, connect with friends and family, join communities, create memories, and stay connected through an engaging social experience.",
  },
  {
    emoji: '💕', icon: Heart, name: 'Dating & Relationships',
    color: 'from-fuchsia-500 to-pink-600',
    glow: 'shadow-fuchsia-500/25',
    desc: 'Meet genuine people, discover meaningful relationships, and build lasting connections in a safe and respectful environment designed for authentic interactions.',
  },
  {
    emoji: '💼', icon: Briefcase, name: 'Business & Professional Networking',
    color: 'from-violet-600 to-purple-700',
    glow: 'shadow-violet-500/25',
    desc: 'Connect with entrepreneurs, professionals, employers, clients, and organizations to build valuable business relationships and unlock new opportunities.',
  },
  {
    emoji: '🛍️', icon: ShoppingBag, name: 'Marketplace',
    color: 'from-purple-500 to-violet-600',
    glow: 'shadow-purple-500/25',
    desc: 'Buy, sell, advertise, and discover products and services from trusted individuals and businesses within the SmartzConnect community.',
  },
  {
    emoji: '🔍', icon: TrendingUp, name: 'Jobs & Careers',
    color: 'from-pink-600 to-fuchsia-600',
    glow: 'shadow-pink-600/25',
    desc: 'Discover employment opportunities, recruit talented professionals, and advance your career through a growing professional network.',
  },
  {
    emoji: '🎓', icon: GraduationCap, name: 'Learning & Development',
    color: 'from-fuchsia-600 to-purple-600',
    glow: 'shadow-fuchsia-600/25',
    desc: 'Learn new skills, share knowledge, participate in educational communities, and support personal and professional growth.',
  },
  {
    emoji: '💻', icon: Monitor, name: 'Technology Solutions',
    color: 'from-purple-600 to-pink-600',
    glow: 'shadow-purple-600/25',
    desc: 'Deliver innovative digital solutions, software development, consulting, and technology services that help businesses and organizations succeed.',
  },
]

const VALUES = [
  { icon: Handshake, title: 'Meaningful Connections', desc: 'We believe genuine human relationships have the power to change lives.' },
  { icon: Shield,    title: 'Trust',                  desc: 'We foster a safe, respectful, and transparent environment where people can connect with confidence.' },
  { icon: Globe,     title: 'Community',               desc: 'We celebrate diversity and create spaces where everyone belongs.' },
  { icon: Zap,       title: 'Innovation',              desc: 'We continuously build smarter technologies that strengthen human connection.' },
  { icon: Award,     title: 'Integrity',               desc: 'We act with honesty, accountability, and professionalism in every interaction.' },
  { icon: Users,     title: 'Inclusion',               desc: 'We welcome people from every background, culture, and community.' },
  { icon: Star,      title: 'Excellence',              desc: 'We strive to deliver exceptional experiences in everything we create.' },
  { icon: TrendingUp,title: 'Growth',                  desc: 'We empower individuals, communities, and businesses to reach their full potential.' },
]

const WHY_LIST = [
  'Connect with people who share your interests.',
  'Build genuine friendships and meaningful relationships.',
  'Stay in touch through secure messaging, voice calls, and video calls.',
  'Join communities that inspire and support you.',
  'Grow your business and professional network.',
  'Buy and sell through an integrated marketplace.',
  'Discover jobs, learning opportunities, and valuable resources.',
  'Enjoy a secure, modern, and user-friendly digital experience designed around people.',
]

const SOCIAL_FEATURES = [
  'Personalized News Feed', 'Friend Requests & Connections', 'Private & Group Messaging',
  'Voice & Video Calls', 'Stories, Photos & Videos', 'Groups & Communities',
  'Pages & Public Profiles', 'Events & Meetups', 'Live Streaming',
  'Real-Time Notifications', 'Privacy & Safety Controls', 'Memories & Saved Content',
]
const RELATIONSHIP_FEATURES = [
  'Smart Match Discovery', 'Personalized Match Suggestions', 'Verified Profiles',
  'Relationship Preferences', 'Interest-Based Connections', 'Secure Private Conversations',
  'Audio & Video Dating Calls', 'Icebreaker Prompts', 'Profile Compatibility Insights',
  'Safety Reporting & Blocking Tools',
]
const BUSINESS_FEATURES = [
  'Professional Profiles', 'Business Pages', 'Marketplace Listings',
  'Service Promotion', 'Job Opportunities', 'Business Networking',
  'Advertising Solutions', 'Customer Engagement', 'Technology Services',
]

const STEPS = [
  { n: '01', label: 'Create your free SmartzConnect account.' },
  { n: '02', label: 'Verify your email address or phone number.' },
  { n: '03', label: 'Complete your profile and personalize your interests.' },
  { n: '04', label: 'Connect with friends, meet new people, or discover meaningful relationships.' },
  { n: '05', label: 'Join communities, share your experiences, and engage with others.' },
  { n: '06', label: 'Explore our marketplace, career opportunities, learning resources, and business services.' },
  { n: '07', label: 'Start building meaningful connections that enrich your personal, social, and professional life.' },
]

/* ── shared section shell ── */
function Sec({ id, dark, children }: { id?: string; dark?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`relative overflow-hidden py-16 sm:py-20 lg:py-24 ${dark ? 'bg-black' : 'bg-[#05000d]'} mt-[0px] mb-[0px] pt-[5.6px] pb-[5.6px]`}>
      {children}
    </section>
  )
}

/* ── pill badge ── */
function Badge({ icon: Icon, label, pink, className = 'mb-5' }: { icon: React.ElementType; label: string; pink?: boolean; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${pink ? 'bg-pink-500/10 border-pink-500/25 text-pink-400' : 'bg-purple-500/10 border-purple-500/25 text-purple-400'} ${className}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-bold tracking-wide">{label}</span>
    </div>
  )
}

/* ── section heading ── */
function Heading({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`font-display font-black sm:text-4xl lg:text-5xl text-white mb-4 text-[20px] ${className}`}>
      {children}
    </h2>
  )
}

/* ── feature pill ── */
function Pill({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-white/75">
      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 flex-shrink-0" />
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
        {/* BG glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-purple-600/8 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            {/* Text */}
            <motion.div {...up()}>
              <Badge icon={Globe} label="About Us" className="ml-[12px] mt-[0px] mb-[15px] mr-[0px] text-center" />
              <Heading className="text-center">
                Connecting People.<br />
                <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                  Build Relationships.
                </span>
              </Heading>
              <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-5 text-justify pl-[10px] pr-[10px]">
                SmartzConnect is a next-generation social platform built to help people form meaningful relationships that extend beyond digital interaction.
                <br /><br />
                It connects individuals through shared interests, opportunities, and communities—making it easier to build friendships, grow careers, discover businesses, and create lasting partnerships.
                <br /><br />
                At its core, SmartzConnect is focused on one mission: turning every connection into something valuable, authentic, and life-changing.
              </p>
              <p className="text-white/50 sm:text-base text-[14px] pl-[10px] pr-[10px] text-justify">
                Our platform empowers people to meet new friends, build lasting relationships, connect with family, discover communities, grow professionally, promote businesses, and explore opportunities — all within one secure and engaging digital ecosystem.
              </p>
            </motion.div>

            {/* Stat grid */}
            <motion.div {...up(0.18)} className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { val: 'Social',   sub: 'Networking',            grd: 'from-pink-500 to-fuchsia-600' },
                { val: 'Dating',   sub: 'Relationships',         grd: 'from-fuchsia-500 to-purple-600' },
                { val: 'Business', sub: 'Professional Network',  grd: 'from-purple-600 to-violet-700' },
                { val: 'Market',   sub: 'Place & Jobs',          grd: 'from-violet-600 to-pink-600' },
              ].map(s => (
                <div key={s.sub}
                  className="p-5 sm:p-6 rounded-2xl border border-white/5 text-center relative overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${s.grd}`} />
                  <p className={`font-display font-black text-lg sm:text-xl bg-gradient-to-r ${s.grd} bg-clip-text text-transparent mb-1 relative`}>{s.val}</p>
                  <p className="text-xs sm:text-sm text-white/50 relative">{s.sub}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </Sec>

      {/* ══ 2. VISION ════════════════════════════════════════════════════════ */}
      <Sec id="vision">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full bg-pink-600/6 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div {...up()}>
            <Badge icon={Eye} label="Our Vision" pink />
            <Heading>
              The World's Most{' '}
              <span className="bg-gradient-to-r from-pink-400 to-fuchsia-400 bg-clip-text text-transparent">
                Trusted Platform
              </span>
            </Heading>
          </motion.div>
          <motion.div {...up(0.14)}>
            <div className="relative mx-auto max-w-3xl">
              {/* Glow behind card */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-pink-600/20 via-fuchsia-600/20 to-purple-600/20 blur-xl" />
              <div className="relative rounded-3xl border border-white/8 p-8 sm:p-12"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                {/* Quote marks */}
                <div className="text-6xl font-display font-black text-pink-500/20 leading-none mb-2 select-none">"</div>
                <p className="text-base sm:text-xl text-white/80 leading-relaxed font-medium">
                  To become the world's most trusted platform for building meaningful social connections, lasting relationships, thriving communities, and digital opportunities that positively transform lives.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-pink-500/40" />
                  <span className="text-xs text-pink-400/70 font-bold tracking-widest uppercase">Our Vision</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-pink-500/40" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Sec>

      {/* ══ 3. MISSION ═══════════════════════════════════════════════════════ */}
      <Sec dark id="mission">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-[500px] h-[500px] rounded-full bg-purple-700/8 blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            {/* Pillars */}
            <motion.div {...up(0.1)} className="space-y-3 order-2 lg:order-1">
              {[
                { icon: '🤝', title: 'Connect Beyond Borders',    desc: 'Creating a platform where people reach across geographies to form lasting bonds.' },
                { icon: '🛡️', title: 'Safe & Inclusive Spaces',   desc: 'A respectful environment where friendships flourish and communities unite.' },
                { icon: '💡', title: 'Innovation at the Core',     desc: 'Building smarter technologies that make meaningful human connection effortless.' },
                { icon: '🌱', title: 'Accessible Opportunities',   desc: 'Ensuring every person can access connections, businesses, and careers that improve their life.' },
              ].map((p, i) => (
                <motion.div key={p.title} {...up(0.06 * i)}
                  className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-2xl flex-shrink-0 mt-0.5">{p.icon}</span>
                  <div>
                    <p className="font-bold text-white text-sm sm:text-base mb-1">{p.title}</p>
                    <p className="sm:text-sm text-white/50 text-[12px]">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Text */}
            <motion.div {...up()} className="order-1 lg:order-2">
              <Badge icon={Target} label="Our Mission" className="mb-5 text-center" />
              <Heading>
                Connecting People{' '}
                <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Beyond Borders
                </span>
              </Heading>
              <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-5">
                Our mission is to connect people beyond borders by creating a safe, inclusive, and innovative platform where friendships flourish, relationships grow, communities unite, businesses thrive, and opportunities become accessible to everyone.
              </p>
              <p className="text-white/40 text-sm sm:text-base leading-relaxed border-l-2 border-pink-500/40 pl-4 italic">
                "We are committed to making meaningful human connection the foundation of everything we build."
              </p>
            </motion.div>
          </div>
        </div>
      </Sec>

      {/* ══ 4. SERVICES ══════════════════════════════════════════════════════ */}
      <Sec id="services">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-pink-700/6 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-purple-700/6 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div {...up()} className="text-center mb-12 sm:mb-16">
            <Badge icon={Sparkles} label="Our Services" pink />
            <Heading>
              One Platform,{' '}
              <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                Many Possibilities
              </span>
            </Heading>
            <p className="text-white/50 max-w-2xl mx-auto text-base sm:text-lg">
              SmartzConnect brings together multiple services into one connected platform — built around the most important thing: people.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {SERVICES.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div key={s.name} {...up(i * 0.06)}
                  className="group p-5 sm:p-6 rounded-2xl border border-white/5 hover:border-pink-500/20 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {/* Hover glow */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${s.color} opacity-5`} />
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 shadow-lg ${s.glow} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-lg">{s.emoji}</span>
                    <h3 className="font-display font-black text-sm sm:text-base text-white leading-tight">{s.name}</h3>
                  </div>
                  <p className="sm:text-sm text-white/50 relative text-[12px]">{s.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </Sec>

      {/* ══ 5. CORE VALUES ═══════════════════════════════════════════════════ */}
      <Sec dark id="values">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-purple-800/8 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div {...up()} className="text-center mb-12 sm:mb-16">
            <Badge icon={Award} label="Core Values" className="mb-5 border-t-[#FF1493] border-r-[#FF1493] border-b-[#FF1493] border-l-[#FF1493]" />
            <Heading>
              The Principles That{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Define Us
              </span>
            </Heading>
            <p className="text-white/50 max-w-xl mx-auto text-base sm:text-lg">
              Our values are not aspirations on a wall — they are the decisions we make in everything we build.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {VALUES.map((v, i) => {
              const Icon = v.icon
              return (
                <motion.div key={v.title} {...up(i * 0.06)}
                  className="p-6 rounded-2xl border border-white/5 hover:border-purple-500/25 hover:shadow-lg transition-all group relative overflow-hidden border-t-[#FF1493] border-r-[#FF1493] border-b-[#FF1493] border-l-[#FF1493]"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {/* Accent line top */}
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/15 to-purple-600/15 border border-white/8 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-pink-400" />
                  </div>
                  <h3 className="font-display font-bold text-white text-sm sm:text-base mb-2">{v.title}</h3>
                  <p className="sm:text-sm text-white/50 text-[12px]">{v.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </Sec>

      {/* ══ 6. WHY CHOOSE US ═════════════════════════════════════════════════ */}
      <Sec id="why">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-pink-700/7 blur-3xl" />
          <div className="absolute right-0 bottom-0 w-[400px] h-[400px] rounded-full bg-purple-700/6 blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            {/* Text */}
            <motion.div {...up()}>
              <Badge icon={CheckCircle} label="Why Choose Us?" pink className="mb-5 mt-[1px] mr-[0px] ml-[0px]" />
              <Heading>
                More Than Just{' '}
                <span className="bg-gradient-to-r from-pink-400 to-fuchsia-400 bg-clip-text text-transparent">
                  A Platform
                </span>
              </Heading>
              <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-6">
                SmartzConnect is a place where friendships begin, relationships grow, communities flourish, businesses connect, and opportunities become reality.
              </p>
              <p className="text-white/50 text-sm sm:text-base leading-relaxed mb-8">
                With one account, you unlock everything:
              </p>
              <Link to="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-white shadow-xl hover:opacity-90 hover:scale-105 active:scale-100 transition-all ml-[120px] mr-[120px] pl-[20px] pr-[20px]"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 50%, #9333ea 100%)', boxShadow: '0 6px 30px rgba(236,72,153,0.35)' }}>
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Checklist */}
            <motion.div {...up(0.14)}>
              <ul className="space-y-3">
                {WHY_LIST.map((item, i) => (
                  <motion.li key={i} {...up(0.05 * i)}
                    className="flex items-start gap-3.5 p-4 rounded-xl border border-white/5 hover:border-pink-500/15 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-pink-500/20">
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm text-white/70 leading-relaxed">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </Sec>

      {/* ══ 7. FEATURES ══════════════════════════════════════════════════════ */}
      <Sec dark id="features">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/3 w-[600px] h-[300px] rounded-full bg-purple-700/7 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div {...up()} className="text-center mb-12 sm:mb-16">
            <Badge icon={Sparkles} label="Social & Relationship Features" />
            <Heading>
              Designed to Make Connecting{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                More Meaningful
              </span>
            </Heading>
            <p className="text-white/50 max-w-2xl mx-auto text-base sm:text-lg">
              SmartzConnect is designed to make connecting easier, more meaningful, and more enjoyable — across every dimension of your life.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
            {/* Social */}
            <motion.div {...up(0)} className="p-6 sm:p-7 rounded-2xl border border-white/5 relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-fuchsia-500" />
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-pink-500/25">
                  <Users className="w-4.5 h-4.5 text-white" />
                </div>
                <h3 className="font-display font-black text-base text-white">Social Features</h3>
              </div>
              <ul className="space-y-2.5">
                {SOCIAL_FEATURES.map(f => <Pill key={f} label={f} />)}
              </ul>
            </motion.div>

            {/* Relationship */}
            <motion.div {...up(0.08)} className="p-6 sm:p-7 rounded-2xl border border-white/5 relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-fuchsia-500 to-purple-500" />
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/25">
                  <Heart className="w-4.5 h-4.5 text-white" />
                </div>
                <h3 className="font-display font-black text-base text-white">Relationship Features</h3>
              </div>
              <ul className="space-y-2.5">
                {RELATIONSHIP_FEATURES.map(f => <Pill key={f} label={f} />)}
              </ul>
            </motion.div>

            {/* Business */}
            <motion.div {...up(0.16)} className="p-6 sm:p-7 rounded-2xl border border-white/5 relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Briefcase className="w-4.5 h-4.5 text-white" />
                </div>
                <h3 className="font-display font-black text-base text-white">Business Features</h3>
              </div>
              <ul className="space-y-2.5">
                {BUSINESS_FEATURES.map(f => <Pill key={f} label={f} />)}
              </ul>
            </motion.div>
          </div>
        </div>
      </Sec>

      {/* ══ 8. HOW TO JOIN ═══════════════════════════════════════════════════ */}
      <Sec id="join">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-pink-700/7 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div {...up()} className="text-center mb-12 sm:mb-16">
            <Badge icon={UserPlus} label="How to Join" pink />
            <Heading>
              Start in{' '}
              <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                7 Simple Steps
              </span>
            </Heading>
            <p className="text-white/50 max-w-xl mx-auto text-base sm:text-lg">
              Becoming part of the SmartzConnect community is quick and easy.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="space-y-3 mb-14 sm:mb-16 relative">
            {/* Connector line */}
            <div className="absolute left-[27px] top-12 bottom-12 w-px bg-gradient-to-b from-pink-500/40 via-fuchsia-500/40 to-purple-500/40 hidden sm:block" />

            {STEPS.map((s, i) => (
              <motion.div key={s.n} {...up(i * 0.07)}
                className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl border border-white/5 hover:border-pink-500/20 transition-colors relative"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                {/* Number bubble */}
                <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center font-display font-black text-sm relative z-10 border border-white/8"
                  style={{ background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 50%, #9333ea 100%)', boxShadow: '0 4px 16px rgba(236,72,153,0.25)' }}>
                  <span className="text-white">{s.n}</span>
                </div>
                <div className="flex-1 flex items-center min-h-[56px]">
                  <p className="text-sm sm:text-base text-white/75 leading-relaxed">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Final CTA */}
          <motion.div {...up(0.4)} className="text-center">
            {/* Tagline banner */}
            <div className="inline-block mb-8 px-5 py-3 rounded-2xl border border-white/8 text-center"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-xs sm:text-sm font-bold tracking-wide text-white/60">
                <span className="text-pink-400">SmartzConnect</span>
                <span className="mx-2 text-white/25">—</span>
                Connecting People.
                <span className="text-fuchsia-400 mx-1">Building Relationships.</span>
                Creating Opportunities.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register"
                className="inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl font-black text-base text-white shadow-2xl hover:opacity-90 hover:scale-105 active:scale-100 transition-all"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 50%, #9333ea 100%)', boxShadow: '0 8px 40px rgba(236,72,153,0.4)' }}>
                <UserPlus className="w-5 h-5" />
                Create Your Free Account
              </Link>
              <Link to="/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm text-white/70 border border-white/10 hover:border-white/20 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                Already a member? Sign In
              </Link>
            </div>
            <p className="mt-5 text-xs text-white/30">
              Free to join · No credit card required · Upgrade anytime
            </p>
          </motion.div>
        </div>
      </Sec>
    </main>
  )
}
