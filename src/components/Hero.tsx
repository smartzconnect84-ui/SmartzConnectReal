import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  ArrowRight, ChevronDown, X,
  ShoppingBag, Car, Package, Megaphone,
  Tv, Heart, Users, Zap,
} from 'lucide-react'
import { cmsList } from '@/lib/contentSync'
import DownloadAppButton from '@/components/DownloadAppButton'

/* ── Data for Explore panel ───────────────────────────────────────────── */
const businessFeatures = [
  { label: 'SmartzMarket',   href: '/smartzmarket',    icon: ShoppingBag, desc: 'Buy & sell anything',        color: 'text-amber-400',  bg: 'bg-amber-400/10' },
  { label: 'SmartzRide',     href: '/smartzride',      icon: Car,         desc: 'Ride-hailing across Africa', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { label: 'SmartzDelivery', href: '/smartzdelivery',  icon: Package,     desc: 'Fast local delivery',        color: 'text-blue-400',    bg: 'bg-blue-400/10' },
  { label: 'SmartzAds',      href: '/smartzads',       icon: Megaphone,   desc: 'Advertise to millions',      color: 'text-orange-400',  bg: 'bg-orange-400/10' },
]
const socialFeatures = [
  { label: 'SmartzSocial',  href: '/app/feed',      icon: Users,  desc: 'Your social feed',            color: 'text-violet-400',  bg: 'bg-violet-400/10' },
  { label: 'SmartzDating',  href: '/app/discover',  icon: Heart,  desc: 'Match & connect',             color: 'text-pink-400',    bg: 'bg-pink-400/10' },
  { label: 'SmartzTV',      href: '/smartztv',      icon: Tv,     desc: 'Live streams & creator hub',  color: 'text-purple-400',  bg: 'bg-purple-400/10' },
  { label: 'Spin & Chat',   href: '/app/spin',      icon: Zap,    desc: 'Random instant connections',  color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10' },
]

const panelVariants: Variants = {
  hidden: { opacity: 0, y: -12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 22, stiffness: 300 } },
  exit:    { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.18 } },
}
const itemVariants: Variants = {
  hidden:  { opacity: 0, x: -10 },
  visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, type: 'spring' as const, stiffness: 280 } }),
}

/* ── Slide types ──────────────────────────────────────────────────────── */
interface Slide {
  badge: string; badgeColor: string
  headlineWhite: string; headlinePurple: string; headlineOrange: string
  sub: string; image: string; objectPosition: string
}
interface HeroSlideRow {
  id: string; title: string; subtitle: string | null; image_url: string | null
  badge_text: string | null; gradient: string | null; is_active: boolean
}

function splitHeadline(title: string) {
  const words = title.trim().split(/\s+/)
  if (words.length <= 1) return { headlineWhite: title, headlinePurple: '', headlineOrange: '' }
  if (words.length === 2) return { headlineWhite: words[0], headlinePurple: '', headlineOrange: words[1] }
  return { headlineWhite: words.slice(0, -2).join(' '), headlinePurple: words[words.length - 2], headlineOrange: words[words.length - 1] }
}
function toDefaultSlide(row: HeroSlideRow): Slide {
  return {
    badge: row.badge_text || 'SMARTZCONNECT',
    badgeColor: row.gradient || 'from-[#EC4899] to-[#DC2626]',
    ...splitHeadline(row.title),
    sub: row.subtitle || '',
    image: row.image_url || '/hero-scroll.jpg',
    objectPosition: 'center 30%',
  }
}

const slides: Slide[] = [
  { badge: 'SMARTZSOCIAL',   badgeColor: 'from-[#EC4899] to-[#DC2626]',      headlineWhite: 'One feed.',   headlinePurple: 'Every', headlineOrange: 'friend.',  sub: 'Share laughs, livestream the moment, and stay close to the people that make your day.', image: '/hero-scroll.jpg', objectPosition: 'center 30%' },
  { badge: 'SMARTZDATING',   badgeColor: 'from-[#DC2626] to-[#EC4899]',      headlineWhite: 'One match.',  headlinePurple: 'Every', headlineOrange: 'feeling.', sub: 'AI-powered compatibility that connects you with someone truly special across Africa and beyond.', image: '/hero-date.jpg', objectPosition: 'center 20%' },
  { badge: 'SMARTZTV',       badgeColor: 'from-[#EC4899] to-rose-700',       headlineWhite: 'Go live.',    headlinePurple: 'Get',   headlineOrange: 'paid.',    sub: 'Broadcast to millions, earn virtual gifts, and build your creator empire on SmartzTV.', image: '/hero-networking.jpg', objectPosition: 'center 25%' },
  { badge: 'SMARTZRIDE',     badgeColor: 'from-rose-700 to-[#DC2626]',       headlineWhite: 'Book a ride.',headlinePurple: 'In',    headlineOrange: 'seconds.', sub: 'Safe, affordable ride-hailing with verified drivers and real-time tracking across Africa.', image: '/hero-friends.jpg', objectPosition: 'center 25%' },
  { badge: 'SMARTZMARKET',   badgeColor: 'from-[#DC2626] to-[#EC4899]',      headlineWhite: 'Buy & sell.', headlinePurple: 'Every', headlineOrange: 'thing.',   sub: "Africa's social marketplace — list products, accept Mobile Money, and reach millions of buyers.", image: '/hero-couple.jpg', objectPosition: 'center 20%' },
  { badge: 'SMARTZDELIVERY', badgeColor: 'from-[#EC4899] to-[#DC2626]',      headlineWhite: 'Deliver fast.',headlinePurple: 'Earn', headlineOrange: 'more.',    sub: 'Fast, reliable local delivery connecting vendors with customers across every neighbourhood.', image: '/hero-scroll.jpg', objectPosition: 'center 35%' },
  { badge: 'SMARTZADS',      badgeColor: 'from-[#DC2626] to-[#EC4899]',      headlineWhite: 'Reach millions.',headlinePurple: 'In', headlineOrange: 'stantly.', sub: "Run powerful ad campaigns targeted to Africa's most engaged digital community.", image: '/hero-networking.jpg', objectPosition: 'center 30%' },
  { badge: 'ONE PLATFORM',   badgeColor: 'from-[#D4AF37] to-[#EC4899]',      headlineWhite: 'Endless',     headlinePurple: 'Connections.', headlineOrange: 'Built for the World.', sub: 'One identity. Eight super-products. Built in Liberia — for Africa and the world.', image: '/hero-date.jpg', objectPosition: 'center 25%' },
]

const stats = [
  { value: '15K+', label: 'USERS' }, { value: '195+', label: 'STATES' },
  { value: '1K+',  label: 'STORES' }, { value: '20+',  label: 'DRIVERS' },
  { value: '1K+',  label: 'VENDORS' }, { value: '8K+',  label: 'CONNECTED' },
]

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [activeSlides, setActiveSlides] = useState<Slide[]>(slides)
  const [exploreOpen, setExploreOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    cmsList<HeroSlideRow>('hero_slides', { orderBy: 'display_order' }).then(rows => {
      if (cancelled) return
      const active = rows.filter(r => r.is_active)
      if (active.length > 0) setActiveSlides(active.map(toDefaultSlide))
    })
    return () => { cancelled = true }
  }, [])

  const next = useCallback(() => setCurrent(c => (c + 1) % activeSlides.length), [activeSlides.length])

  useEffect(() => { if (current >= activeSlides.length) setCurrent(0) }, [activeSlides, current])

  useEffect(() => {
    if (!isPlaying) return
    const t = setInterval(next, 5500)
    return () => clearInterval(t)
  }, [isPlaying, next])

  const slide = activeSlides[current]

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-[#080614]" style={{ paddingTop: '80px' }}>

      {/* ── Background ── */}
      <AnimatePresence mode="sync">
        <motion.div key={current} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.0 }} className="absolute inset-0">
          <motion.img key={`img-${current}`} src={slide.image} alt="" initial={{ scale: 1.08 }} animate={{ scale: 1.0 }} transition={{ duration: 7, ease: 'linear' }} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: slide.objectPosition }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080614]/95 via-[#080614]/75 to-[#080614]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080614]/80 via-transparent to-[#080614]/30" />
        </motion.div>
      </AnimatePresence>

      {/* ── Glow orbs ── */}
      <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.08, 0.13, 0.08] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.06, 0.1, 0.06] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }} className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-pink-600/8 blur-[100px] pointer-events-none" />

      {/* ── Main content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 flex flex-col justify-center min-h-[calc(100vh-80px)] pb-28">
        <div className="max-w-2xl">

          {/* Badge */}
          <AnimatePresence mode="wait">
            <motion.div key={`badge-${current}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.45, delay: 0.1 }} className="mb-5 sm:mb-6">
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${slide.badgeColor} text-white text-xs font-black tracking-widest`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                {slide.badge}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Headline */}
          <AnimatePresence mode="wait">
            <motion.h1 key={`h1-${current}`} initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.6, delay: 0.15, type: 'spring', stiffness: 160 }} className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.04] mb-4 sm:mb-5">
              <span className="text-white">{slide.headlineWhite} </span>
              <span className="text-purple-400">{slide.headlinePurple}</span>
              <br />
              <span className="text-orange-400">{slide.headlineOrange}</span>
            </motion.h1>
          </AnimatePresence>

          {/* Sub */}
          <AnimatePresence mode="wait">
            <motion.p key={`sub-${current}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, delay: 0.25 }} className="text-sm sm:text-base lg:text-lg text-white/70 leading-relaxed mb-7 sm:mb-8 max-w-xl">
              {slide.sub}
            </motion.p>
          </AnimatePresence>

          {/* ── CTA buttons ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="flex flex-wrap items-center gap-3 mb-4 sm:mb-5">

            {/* Join Now — Pink */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-white font-bold text-sm sm:text-base transition-all"
                style={{ background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)', boxShadow: '0 8px 28px rgba(236,72,153,0.45)' }}
              >
                Join Now! <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Explore — Red */}
            <div className="relative">
              <motion.button
                onClick={() => setExploreOpen(v => !v)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-white font-semibold text-sm sm:text-base transition-all"
                style={{ background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)', boxShadow: '0 8px 28px rgba(220,38,38,0.38)' }}
              >
                Explore
                <motion.span animate={{ rotate: exploreOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <ChevronDown className="w-4 h-4" />
                </motion.span>
              </motion.button>

              {/* ── Explore mega-panel ── */}
              <AnimatePresence>
                {exploreOpen && (
                  <>
                    {/* backdrop */}
                    <div className="fixed inset-0 z-20" onClick={() => setExploreOpen(false)} />
                    <motion.div
                      variants={panelVariants} initial="hidden" animate="visible" exit="exit"
                      className="absolute left-0 top-[calc(100%+10px)] z-30 w-[min(480px,90vw)] rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
                      style={{ background: 'rgba(13,11,26,0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                        <p className="text-xs font-black tracking-widest text-white/50 uppercase">Explore Features</p>
                        <button onClick={() => setExploreOpen(false)} className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                          <X className="w-3 h-3 text-white/50" />
                        </button>
                      </div>

                      <div className="p-3 grid grid-cols-2 gap-3">
                        {/* Business column */}
                        <div>
                          <p className="text-[10px] font-black tracking-widest text-amber-400/80 uppercase px-2 mb-2">Business</p>
                          {businessFeatures.map((item, i) => {
                            const Icon = item.icon
                            return (
                              <motion.div key={item.href} custom={i} variants={itemVariants} initial="hidden" animate="visible">
                                <Link
                                  to={item.href} onClick={() => setExploreOpen(false)}
                                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/8 transition-all group"
                                >
                                  <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">{item.label}</p>
                                    <p className="text-[10px] text-white/40">{item.desc}</p>
                                  </div>
                                </Link>
                              </motion.div>
                            )
                          })}
                        </div>

                        {/* Social column */}
                        <div>
                          <p className="text-[10px] font-black tracking-widest text-purple-400/80 uppercase px-2 mb-2">Social</p>
                          {socialFeatures.map((item, i) => {
                            const Icon = item.icon
                            return (
                              <motion.div key={item.href} custom={i + 4} variants={itemVariants} initial="hidden" animate="visible">
                                <Link
                                  to={item.href} onClick={() => setExploreOpen(false)}
                                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/8 transition-all group"
                                >
                                  <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">{item.label}</p>
                                    <p className="text-[10px] text-white/40">{item.desc}</p>
                                  </div>
                                </Link>
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="px-3 pb-3">
                        <Link to="/#services" onClick={() => setExploreOpen(false)}
                          className="block w-full py-2.5 rounded-xl text-center text-xs font-bold text-white/60 hover:text-white border border-white/8 hover:border-white/20 transition-all">
                          View All 8 Products →
                        </Link>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Download App — Green */}
            <DownloadAppButton variant="green" />
          </motion.div>

          {/* Trust badges */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.5 }} className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/60 text-xs sm:text-sm">
            {['Free to join', '195+ countries', 'One identity'].map(t => (
              <motion.span key={t} whileHover={{ color: 'rgba(255,255,255,0.9)' }} className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Slide dots ── */}
      <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {activeSlides.map((_, i) => (
          <motion.button key={i} onClick={() => { setCurrent(i); setIsPlaying(false) }}
            whileHover={{ scale: 1.3 }} transition={{ type: 'spring', stiffness: 400 }}
            className={`transition-all duration-300 rounded-full ${i === current ? 'w-7 h-2 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/60'}`} />
        ))}
      </div>

      {/* ── Stats bar ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20" style={{ background: 'rgba(13,11,26,0.70)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-white/8">
            {stats.map((s, i) => (
              <motion.div key={i} whileHover={{ background: 'rgba(255,255,255,0.04)' }} transition={{ duration: 0.2 }} className="py-3.5 sm:py-4 px-3 sm:px-5 text-center">
                <p className="font-display font-black sm:text-xl text-white text-[17px]">{s.value}</p>
                <p className="sm:text-[10px] text-white/40 font-semibold tracking-wider mt-0.5 text-[15px]">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
