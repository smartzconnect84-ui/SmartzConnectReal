import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Play, Eye, Heart, Radio } from 'lucide-react'

const videos = [
  { title: 'Liberia Street Food Tour', creator: 'FoodieKofi', views: '124K', likes: '8.2K', live: false, category: 'Food' },
  { title: 'Afrobeats Dance Challenge', creator: 'DanceQueenAmara', views: '89K', likes: '12K', live: true, category: 'Music' },
  { title: 'Monrovia City Vlog', creator: 'TravelWithJames', views: '45K', likes: '3.1K', live: false, category: 'Travel' },
  { title: 'African Fashion Week 2025', creator: 'StyleByFatima', views: '201K', likes: '18K', live: true, category: 'Fashion' },
  { title: 'Tech Startup Stories', creator: 'AfriTechHub', views: '67K', likes: '5.4K', live: false, category: 'Tech' },
  { title: 'Cooking with Grandma', creator: 'MamaRecipes', views: '156K', likes: '22K', live: false, category: 'Food' },
]

const gradients = [
  'from-purple-600/40 to-pink-600/40',
  'from-pink-500/40 to-orange-600/40',
  'from-blue-600/40 to-cyan-600/40',
  'from-emerald-600/40 to-teal-600/40',
  'from-red-600/40 to-rose-600/40',
  'from-indigo-600/40 to-violet-600/40',
]

export default function SmartzTVPreview() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-24 dark:bg-[#0A0A12] bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-sm font-medium text-red-400">SmartzTV — Live Now</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold dark:text-white text-gray-900 mb-6 leading-tight">
              Africa&apos;s biggest{' '}
              <span className="text-gradient-love">live streaming</span>{' '}
              platform
            </h2>
            <p className="text-lg dark:text-gray-400 text-gray-600 mb-8 leading-relaxed">
              Watch live streams, upload videos, and build your creator audience. From Monrovia to Lagos to London — your content reaches the world.
            </p>
            <ul className="space-y-3 mb-8">
              {['Go live in seconds from your phone', 'Earn from your content with creator monetization', 'Discover trending African creators', 'React, comment, and share in real-time'].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm dark:text-gray-300 text-gray-700">
                  <div className="w-5 h-5 rounded-full bg-brand-pink/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-brand-pink" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <button className="btn-love flex items-center gap-2">
              <Play className="w-4 h-4 fill-current" />
              Explore SmartzTV
            </button>
          </motion.div>

          {/* Right — video grid */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          >
            {videos.map((video, i) => (
              <motion.div
                key={video.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="group relative rounded-2xl overflow-hidden cursor-pointer card-hover"
              >
                <div className={`aspect-[9/16] bg-gradient-to-br ${gradients[i]} dark:bg-[#1C1530] bg-gray-100 flex items-end p-3`}>
                  {video.live && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="relative z-10 w-full">
                    <p className="text-white text-xs font-semibold leading-tight line-clamp-2 mb-1">{video.title}</p>
                    <p className="text-white/70 text-[10px]">{video.creator}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-0.5 text-white/60 text-[10px]">
                        <Eye className="w-2.5 h-2.5" />{video.views}
                      </span>
                      <span className="flex items-center gap-0.5 text-white/60 text-[10px]">
                        <Heart className="w-2.5 h-2.5" />{video.likes}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
