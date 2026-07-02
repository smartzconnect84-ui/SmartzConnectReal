import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Heart, Play, Star, Users, MapPin } from 'lucide-react'

interface Slide {
  image: string
  imgClass: string
  objectPosition: string
  badge: string
  headline: string
  sub: string
  cta: string
  ctaLink: string
  stat: { icon: React.ElementType; value: string; label: string }
}

const slides: Slide[] = [
  {
    image: '/flyer.png',
    // Portrait poster — always contain so every character & text is visible
    imgClass: 'object-contain',
    objectPosition: 'center top',
    badge: '🎉 Birthday Bash & App Launch — June 26, 2026',
    headline: 'SmartzConnect\nLaunches in Liberia',
    sub: "Join us at Bash Pool, Marshall Road on June 26 as we officially launch Africa's #1 social platform. Be part of history.",
    cta: 'Join Free Today',
    ctaLink: '/register',
    stat: { icon: Star, value: 'Launch', label: 'June 26, 2026' },
  },
  {
    image: '/hero-friends.jpg',
    imgClass: 'object-cover',
    objectPosition: 'center 25%',   // keep faces in frame
    badge: "🌍 Africa's #1 Social Platform",
    headline: 'Where Friendships\nBecome Forever',
    sub: 'Join Africans building real connections, sharing moments, and creating memories that last a lifetime.',
    cta: 'Find Your People',
    ctaLink: '/register',
    stat: { icon: Users, value: 'Growing', label: 'Community' },
  },
  {
    image: '/hero-date.jpg',
    imgClass: 'object-cover',
    objectPosition: 'center 20%',
    badge: '💕 Smart Matching Technology',
    headline: 'Your Perfect Match\nIs Waiting',
    sub: 'Our AI-powered matching engine analyses compatibility factors to connect you with someone truly special.',
    cta: 'Start Matching',
    ctaLink: '/register',
    stat: { icon: Heart, value: 'Daily', label: 'New Matches' },
  },
  {
    image: '/hero-couple.jpg',
    imgClass: 'object-cover',
    objectPosition: 'center 20%',
    badge: '👑 Love Stories Across Africa',
    headline: 'Real Love,\nReal Connections',
    sub: 'From Monrovia to Lagos, Nairobi to Accra — SmartzConnect is where African love stories begin and flourish.',
    cta: 'Join Free Today',
    ctaLink: '/register',
    stat: { icon: Star, value: '4.9★', label: 'App Rating' },
  },
  {
    image: '/hero-scroll.jpg',
    imgClass: 'object-cover',
    objectPosition: 'center 30%',
    badge: '📱 Scroll, Connect, Vibe',
    headline: 'Your Social Feed,\nYour World',
    sub: 'Share your life, discover trending content, go live on SmartzTV, and stay connected with your community 24/7.',
    cta: 'Explore the Feed',
    ctaLink: '/register',
    stat: { icon: Play, value: 'Live', label: 'Streaming Now' },
  },
  {
    image: '/hero-networking.jpg',
    imgClass: 'object-cover',
    objectPosition: 'center 25%',
    badge: '🤝 Professional Networking',
    headline: 'Connect, Grow &\nThrive Together',
    sub: "Build your professional network, discover opportunities, and collaborate with Africa's brightest minds on one platform.",
    cta: 'Build Your Network',
    ctaLink: '/register',
    stat: { icon: MapPin, value: '47+', label: 'Countries' },
  },
]

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [])
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), [])

  useEffect(() => {
    if (!isPlaying) return
    const t = setInterval(next, 5500)
    return () => clearInterval(t)
  }, [isPlaying, next])

  const slide = slides[current]
  const StatIcon = slide.stat.icon

  return (
    <section className="relative w-full h-[90vh] sm:h-screen min-h-[580px] max-h-[960px] overflow-hidden bg-[#0A0710]">

      {/* ── Slides ── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0 bg-[#0A0710]"
        >
          <img
            src={slide.image}
            alt=""
            className={`absolute inset-0 w-full h-full transition-transform duration-700 ${slide.imgClass}`}
            style={{ objectPosition: slide.objectPosition }}
          />
          {/* Gradient overlay — stronger on mobile so text stays readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10 sm:from-black/70 sm:via-black/35 sm:to-black/10" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* ── Content ── */}
      <div className="relative z-10 h-full flex flex-col justify-center px-5 sm:px-10 lg:px-20 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs sm:text-sm font-semibold mb-4 sm:mb-6"
            >
              {slide.badge}
            </motion.div>

            {/* Headline */}
            <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.05] mb-4 sm:mb-5 whitespace-pre-line drop-shadow-2xl">
              {slide.headline}
            </h1>

            {/* Sub */}
            <p className="text-sm sm:text-base lg:text-lg text-white/85 leading-relaxed mb-6 sm:mb-8 max-w-lg drop-shadow-lg">
              {slide.sub}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              <Link to={slide.ctaLink}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-love-gradient text-white font-bold text-xs sm:text-sm shadow-2xl shadow-pink-500/40 hover:shadow-pink-500/60 hover:scale-105 transition-all">
                <Heart className="w-3.5 sm:w-4 h-3.5 sm:h-4" fill="white" />
                {slide.cta}
              </Link>
              <Link to="/about"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 text-white font-semibold text-xs sm:text-sm hover:bg-white/25 transition-all">
                Learn More
              </Link>
            </div>

            {/* Stat pill */}
            <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-love-gradient flex items-center justify-center">
                <StatIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-base sm:text-lg leading-none">{slide.stat.value}</p>
                <p className="text-white/70 text-[10px] sm:text-xs">{slide.stat.label}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Navigation arrows ── */}
      <button onClick={() => { prev(); setIsPlaying(false) }}
        className="absolute left-2 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:bg-white/30 transition-all group">
        <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5 group-hover:-translate-x-0.5 transition-transform" />
      </button>
      <button onClick={() => { next(); setIsPlaying(false) }}
        className="absolute right-2 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:bg-white/30 transition-all group">
        <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* ── Dot indicators ── */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
        {slides.map((_, i) => (
          <button key={i} onClick={() => { setCurrent(i); setIsPlaying(false) }}
            className={`transition-all duration-300 rounded-full ${i === current ? 'w-6 sm:w-8 h-2 sm:h-2.5 bg-white' : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/40 hover:bg-white/70'}`}
          />
        ))}
      </div>

      {/* ── Slide counter ── */}
      <div className="absolute bottom-6 sm:bottom-8 right-4 sm:right-6 z-20 text-white/60 text-[10px] sm:text-xs font-mono hidden sm:block">
        {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
      </div>
    </section>
  )
}
