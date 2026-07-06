import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Tv, Play, Users, Gift, TrendingUp, Mic, Video, Crown, Zap, Globe,
  Radio, Star, Signal, Clapperboard,
} from 'lucide-react'

const features = [
  { icon: Video,      title: 'Go Live Instantly',     desc: 'Stream to thousands of viewers across Africa with one tap. No equipment needed — just your phone.',  color: 'from-violet-500 to-purple-600' },
  { icon: Gift,       title: 'Earn from Gifts',        desc: 'Fans send virtual gifts during your streams. Convert them to real cash via Mobile Money.',             color: 'from-pink-500 to-rose-600' },
  { icon: Users,      title: 'Build Your Fanbase',     desc: 'Grow a loyal community of followers who tune in for your content every day.',                         color: 'from-blue-500 to-indigo-600' },
  { icon: TrendingUp, title: 'Trending Discovery',     desc: 'Get featured on the Trending page and reach millions of new viewers organically.',                     color: 'from-amber-500 to-orange-600' },
  { icon: Mic,        title: 'Audio Rooms',            desc: 'Host live audio conversations, debates, and Q&As with your community.',                               color: 'from-emerald-500 to-teal-600' },
  { icon: Crown,      title: 'Creator Monetisation',   desc: 'Subscriptions, tips, brand deals, and exclusive content — multiple income streams in one place.',     color: 'from-yellow-500 to-amber-600' },
]

export default function SmartzTVPage() {
  const ref = useRef(null)
  const heroRef = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const heroIn = useInView(heroRef, { once: true })

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" ref={heroRef}>
        <div className="relative h-[460px] sm:h-[540px] lg:h-[620px] bg-gradient-to-br from-[#0e0720] via-[#120828] to-[#160a2e]">
          {/* Decorative blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/25 blur-3xl" />
            <div className="absolute top-8 right-16 w-56 h-56 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="absolute bottom-8 left-16 w-44 h-44 rounded-full bg-pink-500/15 blur-2xl" />
          </div>

          {/* Floating icon decorations */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-12 left-[8%] opacity-20 rotate-[-12deg]">
              <Tv className="w-16 h-16 text-violet-300" />
            </div>
            <div className="absolute top-20 right-[9%] opacity-15 rotate-[10deg]">
              <Radio className="w-12 h-12 text-purple-300" />
            </div>
            <div className="absolute bottom-16 left-[14%] opacity-15 rotate-[6deg]">
              <Clapperboard className="w-14 h-14 text-violet-200" />
            </div>
            <div className="absolute bottom-20 right-[7%] opacity-20 rotate-[-8deg]">
              <Signal className="w-10 h-10 text-pink-200" />
            </div>
            <div className="absolute top-1/2 right-[22%] opacity-10">
              <Star className="w-20 h-20 text-purple-300" />
            </div>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 backdrop-blur-sm border border-violet-400/35 mb-6">
                <Tv className="w-4 h-4 text-violet-300" />
                <span className="text-sm font-semibold text-violet-200">SmartzConnect TV</span>
              </div>
              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-8">
                Africa's Live<br /><span className="text-pink-300">Streaming</span>{' '}Platform
              </h1>

              {/* Two main CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register"
                  className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-2xl btn-love font-bold text-lg shadow-2xl shadow-pink-500/40 hover:scale-[1.04] transition-all">
                  <Play className="w-5 h-5" fill="white" /> Start Streaming Free
                </Link>
                <Link to="/register"
                  className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/30 text-white font-bold text-lg hover:bg-white/25 transition-all">
                  <Globe className="w-5 h-5" /> Watch Live Now
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Coming soon notice ── */}
      <section className="py-10 dark:bg-[#0D0A14] bg-white border-y dark:border-white/5 border-gray-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-bold dark:text-white text-gray-900">Live streams will appear here once SmartzTV launches</span>
          </div>
          <p className="text-sm dark:text-gray-400 text-gray-500">
            SmartzTV is coming soon to SmartzConnect. Live streams, creator channels, and exclusive content — all in one place. Sign up now to be first in line.
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section ref={ref} className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-12">
            <h2 className="font-display font-black text-3xl sm:text-4xl dark:text-white text-gray-900 mb-3">
              Everything You Need to <span className="text-gradient-love">Create &amp; Earn</span>
            </h2>
            <p className="dark:text-gray-400 text-gray-600 max-w-xl mx-auto">Professional streaming tools built for African creators.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                  className="dark:bg-[#130E1E] bg-white rounded-2xl p-6 border dark:border-white/6 border-gray-100 hover:shadow-xl transition-all group">
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

      {/* ── CTA banner ── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl overflow-hidden relative shadow-2xl bg-gradient-to-br from-[#0e0720] via-[#160830] to-[#200a40] border border-violet-500/20">
            {/* Decorative icons */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-6 left-8 opacity-10"><Tv className="w-20 h-20 text-violet-300" /></div>
              <div className="absolute bottom-6 right-8 opacity-10"><Crown className="w-20 h-20 text-pink-300" /></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl" />
            </div>
            <div className="relative p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-500/40">
                <Clapperboard className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display font-black text-3xl text-white mb-3">Ready to Go Live?</h2>
              <p className="text-white/80 mb-7 max-w-lg mx-auto">Join creators already earning on SmartzTV. It's free to start.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl btn-love font-bold text-sm shadow-xl hover:scale-105 transition-all">
                  <Zap className="w-4 h-4" /> Become a Creator
                </Link>
                <Link to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/12 backdrop-blur-sm border border-white/25 text-white font-semibold hover:bg-white/22 transition-all text-sm">
                  <Play className="w-4 h-4" fill="white" /> Watch Live Streams
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
