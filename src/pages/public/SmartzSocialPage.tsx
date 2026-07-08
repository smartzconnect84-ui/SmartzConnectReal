import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Users, Heart, Globe, Shield, BarChart3, MessageCircle,
  Star, Zap, Share2, TrendingUp, Lock, UserPlus,
} from 'lucide-react'

const features = [
  {
    icon: Globe,        title: 'Connect Globally',
    desc: 'Meet people from 47+ African countries. Build friendships and communities that span the continent.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Heart,        title: 'Engage Meaningfully',
    desc: 'React, comment, and share content that matters. Real interactions with real people.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: Share2,       title: 'Share Content',
    desc: 'Post photos, videos, stories and updates. Your voice, your audience, your reach.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Users,        title: 'Build Communities',
    desc: 'Create or join groups around shared interests, professions, and passions.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: BarChart3,    title: 'Analytics & Insights',
    desc: 'Track your audience growth, engagement rates, and content performance.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: Shield,       title: 'Safe & Secure',
    desc: 'Your data, your control. End-to-end privacy tools and content moderation built in.',
    color: 'from-cyan-500 to-blue-600',
  },
]

const stats = [
  { value: '10M+',  label: 'Active Users',      icon: Users },
  { value: '47+',   label: 'Countries',          icon: Globe },
  { value: '32.5%', label: 'Avg. Audience Growth', icon: TrendingUp },
  { value: '4.9★',  label: 'User Satisfaction', icon: Star },
]

export default function SmartzSocialPage() {
  const ref    = useRef(null)
  const heroRef = useRef(null)
  const inView  = useInView(ref,    { once: true, margin: '-80px' })
  const heroIn  = useInView(heroRef, { once: true })

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen">

      {/* ── Hero ── */}
      <section ref={heroRef}>
        {/* Hero image */}
        <div className="w-full overflow-hidden">
          <motion.img
            src="/smartz-social-hero.png"
            alt="SmartzSocial — Connect. Engage. Grow Together."
            className="w-full object-cover object-center"
            style={{ maxHeight: '620px' }}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={heroIn ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7 }}
          />
        </div>

        {/* CTA buttons */}
        <div className="dark:bg-[#04081e]/90 bg-blue-50/70 border-t-2 border-blue-500/25 py-6 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroIn ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
              <Zap className="w-4 h-4" /> Join Now
            </Link>
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl dark:bg-blue-900/30 bg-white border dark:border-blue-500/20 border-blue-300/50 dark:text-blue-200 text-blue-800 font-semibold text-sm hover:dark:bg-blue-900/50 hover:bg-blue-100 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto mb-2 shadow-md shadow-blue-500/20">
                    <StatIcon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-display font-black text-2xl sm:text-3xl bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">{s.value}</p>
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
              Your <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">All-in-One</span> Social Platform
            </h2>
            <p className="text-lg dark:text-gray-400 text-gray-600 max-w-xl mx-auto">
              Share. Engage. Collaborate. Grow your world.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-100 hover:shadow-xl hover:border-blue-400/20 transition-all group">
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

      {/* ── Privacy CTA ── */}
      <section className="py-16 sm:py-24 dark:bg-[#0D0A14] bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl dark:bg-[#130E1E] bg-gray-50 border dark:border-white/8 border-gray-200 shadow-2xl">
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-radial from-blue-500/12 via-transparent to-transparent pointer-events-none" />
            <div className="relative grid sm:grid-cols-2 gap-10 p-8 sm:p-12 lg:p-14 items-center">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-4">
                  Privacy First.<br />Always.
                </h2>
                <p className="text-base dark:text-gray-400 text-gray-600 mb-6 leading-relaxed">
                  Your data is yours. SmartzSocial never sells your information. Control exactly what you share and with whom.
                </p>
                <Link to="/register"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 text-white font-bold text-base shadow-xl shadow-blue-500/30 hover:scale-[1.03] transition-all">
                  <UserPlus className="w-4 h-4" /> Create Your Profile
                </Link>
              </div>
              <div className="space-y-3.5">
                {[
                  { icon: Shield,         text: 'Privacy-first design — your data stays yours' },
                  { icon: Lock,           text: 'End-to-end encrypted private messages' },
                  { icon: Users,          text: 'Real connections with real people' },
                  { icon: BarChart3,      text: 'Analytics that help you grow organically' },
                  { icon: MessageCircle,  text: 'Community tools built for collaboration' },
                  { icon: Globe,          text: 'Reach across 47+ African countries' },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <p.icon className="w-4 h-4 text-blue-500" />
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
          <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-4">
            Be Social. Be SmartzSocial.
          </h2>
          <p className="text-lg dark:text-gray-400 text-gray-600 mb-8">
            Join 10 million+ users already connecting, sharing, and growing on Africa's premier social platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 text-white font-bold text-base shadow-xl shadow-blue-500/25 hover:scale-105 transition-all">
              <Zap className="w-4 h-4" /> Join Now — It's Free
            </Link>
            <Link to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl dark:bg-white/6 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 font-semibold text-base hover:dark:bg-white/10 transition-all">
              View Plans &amp; Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
