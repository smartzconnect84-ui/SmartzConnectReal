import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Heart, Shield, Star, MapPin, Users, Zap,
  UserPlus, Lock, Globe, Sparkles, MessageCircle, CheckCircle,
} from 'lucide-react'
import { useSiteConfig, SITE_IMAGE_KEYS } from '@/contexts/SiteConfigContext'

const features = [
  {
    icon: Sparkles,   title: 'Smart Matching',
    desc: 'Our AI learns your preferences and surfaces genuinely compatible matches — not just faces.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: MapPin,     title: 'Nearby Connections',
    desc: 'Find people near you across African cities. Distance filters, map views, and local events.',
    color: 'from-red-500 to-pink-600',
  },
  {
    icon: Shield,     title: 'Verified Profiles',
    desc: 'Every profile is verified before matching. No fakes, no bots — only real people.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: MessageCircle, title: 'Safe Messaging',
    desc: "Chat only with people you've matched with. Block, report, and unmatch at any time.",
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Globe,      title: 'Pan-African Reach',
    desc: 'Whether you\'re staying local or open to distance, meet people across 47+ countries.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Lock,       title: 'Private & Secure',
    desc: 'Your personal data is never sold. Control who can see you and what they can see.',
    color: 'from-amber-500 to-orange-600',
  },
]

const stats = [
  { value: '500K+', label: 'Active Members',   icon: Users },
  { value: '47+',   label: 'Countries',         icon: Globe },
  { value: '98%',   label: 'Verified Profiles', icon: CheckCircle },
  { value: '4.8★',  label: 'Match Quality',     icon: Star },
]

export default function SmartzDatingPage() {
  const ref    = useRef(null)
  const heroRef = useRef(null)
  const inView  = useInView(ref,    { once: true, margin: '-80px' })
  const heroIn  = useInView(heroRef, { once: true })
  const siteConfig = useSiteConfig()
  const bgUrl = siteConfig.get(SITE_IMAGE_KEYS.datingPageBg)

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
            src="/hero-date.jpg"
            alt="SmartzDating — Find Your Match"
            className="w-full object-cover object-center relative"
            style={{ maxHeight: '620px', opacity: bgUrl ? 0.75 : undefined }}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={heroIn ? { opacity: bgUrl ? 0.75 : 1, scale: 1 } : {}}
            transition={{ duration: 0.7 }}
          />
        </div>

        {/* CTA buttons */}
        <div className="dark:bg-[#180008]/90 bg-rose-50/70 border-t-2 border-rose-500/25 py-6 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroIn ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
              <Heart className="w-4 h-4" /> Start Dating
            </Link>
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl dark:bg-rose-900/30 bg-white border dark:border-rose-500/20 border-rose-300/50 dark:text-rose-200 text-rose-800 font-semibold text-sm hover:dark:bg-rose-900/50 hover:bg-rose-100 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
              <UserPlus className="w-4 h-4" /> Create Profile
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="py-10 dark:bg-[#0D0A14] bg-white border-y dark:border-white/5 border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((s, i) => {
              const StatIcon = s.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mx-auto mb-2 shadow-md shadow-pink-500/20">
                    <StatIcon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-display font-black text-2xl sm:text-3xl bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent">{s.value}</p>
                  <p className="text-sm dark:text-gray-400 text-gray-500 mt-0.5 font-medium">{s.label}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section ref={ref} className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-12">
            <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-3">
              Designed for <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent">Real Connections</span>
            </h2>
            <p className="text-lg dark:text-gray-400 text-gray-600 max-w-xl mx-auto">
              More than swiping — meaningful matches, safe conversations, and lasting relationships.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-100 hover:shadow-xl hover:border-pink-400/20 transition-all group">
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

      {/* ── Safety CTA ── */}
      <section className="py-16 sm:py-24 dark:bg-[#0D0A14] bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl dark:bg-[#130E1E] bg-rose-50 border dark:border-white/8 border-rose-100 shadow-2xl">
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-radial from-pink-500/12 via-transparent to-transparent pointer-events-none" />
            <div className="relative grid sm:grid-cols-2 gap-10 p-8 sm:p-12 lg:p-14 items-center">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-5 shadow-lg shadow-pink-500/30">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-4">
                  Your Safety<br />Comes First
                </h2>
                <p className="text-base dark:text-gray-400 text-gray-600 mb-6 leading-relaxed">
                  Every profile is verified. Every conversation is protected. SmartzDating is built so you can focus on the connection, not the risks.
                </p>
                <Link to="/register"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-base shadow-xl shadow-pink-500/30 hover:scale-[1.03] transition-all">
                  <Zap className="w-4 h-4" /> Start for Free
                </Link>
              </div>
              <div className="space-y-3.5">
                {[
                  { icon: CheckCircle, text: '100% profile verification before matching' },
                  { icon: Shield,      text: 'AI-powered harassment and scam detection' },
                  { icon: Lock,        text: 'Private mode — browse without being seen' },
                  { icon: Heart,       text: 'Smart match suggestions, not random swipes' },
                  { icon: MapPin,      text: 'Precise distance control and city filters' },
                  { icon: Globe,       text: 'Connect locally or across 47+ countries' },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
                      <p.icon className="w-4 h-4 text-pink-500" />
                    </div>
                    <span className="text-sm dark:text-gray-300 text-gray-700 font-medium">{p.text}</span>
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
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-pink-400 fill-pink-400" />
            ))}
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-4">
            Ready to Find Your Match?
          </h2>
          <p className="text-lg dark:text-gray-400 text-gray-600 mb-8">
            Join half a million people already finding meaningful connections on SmartzDating.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-base shadow-xl shadow-pink-500/25 hover:scale-105 transition-all">
              <Heart className="w-4 h-4" /> Start Dating Free
            </Link>
            <Link to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl dark:bg-white/6 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 font-semibold text-base hover:dark:bg-white/10 transition-all">
              View Premium Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
