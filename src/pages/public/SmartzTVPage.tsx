import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Tv, Play, Users, Gift, TrendingUp, Mic, Video, Crown, Zap, Globe } from 'lucide-react'

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
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative h-72 sm:h-96 lg:h-[500px] bg-gradient-to-br from-[#0e0720] via-[#120828] to-[#160a2e]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/25 blur-3xl" />
            <div className="absolute top-8 right-16 w-56 h-56 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="absolute bottom-8 left-16 w-44 h-44 rounded-full bg-pink-500/15 blur-2xl" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 backdrop-blur-sm border border-violet-400/35 mb-5">
              <Tv className="w-4 h-4 text-violet-300" />
              <span className="text-sm font-semibold text-violet-200">SmartzConnect TV</span>
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-4">
              Africa's Live<br /><span className="text-pink-300">Streaming</span><br />Platform
            </h1>
            <p className="text-lg text-white/80 mb-7 max-w-lg">
              Go live, build your audience, and earn real money from your passion. SmartzTV is where African creators become stars.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/register" className="btn-love px-7 py-3.5 rounded-2xl text-sm font-bold inline-flex items-center gap-2">
                <Play className="w-4 h-4" fill="white" /> Start Streaming Free
              </Link>
              <Link to="/register" className="px-7 py-3.5 rounded-2xl bg-white/12 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold hover:bg-white/22 transition-all inline-flex items-center gap-2">
                <Globe className="w-4 h-4" /> Watch Live Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Coming soon notice */}
      <section className="py-10 dark:bg-[#0D0A14] bg-white border-y dark:border-white/5 border-gray-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-bold dark:text-white text-gray-900">Live streams will appear here once SmartzTV launches</span>
          </div>
          <p className="text-sm dark:text-gray-400 text-gray-500">
            SmartzTV is coming to SmartzConnect on <strong>June 26, 2026</strong> during our Birthday Bash &amp; App Launch at Bash Pool, Marshall Road, Liberia.
          </p>
        </div>
      </section>

      {/* Features */}
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

      {/* CTA banner with flyer */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl overflow-hidden relative shadow-2xl">
            <img src="/flyer.png" alt="SmartzConnect" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-violet-900/70" />
            <div className="relative p-10 text-center">
              <div className="text-5xl mb-4">🎬</div>
              <h2 className="font-display font-black text-3xl text-white mb-3">Ready to Go Live?</h2>
              <p className="text-white/80 mb-6">Join creators already earning on SmartzTV. It's free to start.</p>
              <Link to="/register" className="btn-love px-8 py-4 rounded-2xl font-bold inline-flex items-center gap-2">
                <Zap className="w-4 h-4" /> Become a Creator
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
