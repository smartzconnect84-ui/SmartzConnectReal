import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun, Moon, Menu, X, ChevronDown,
  Tv, ShoppingBag, Car, Package, Megaphone,
  Heart, Users, MessageCircle, Zap,
} from 'lucide-react'
const logoImg = '/logo.png'
import { useTheme } from '@/contexts/ThemeContext'
import { useLiveChat } from '@/contexts/LiveChatContext'
import { useAuth } from '@/hooks/useAuth'

const businessItems = [
  { label: 'SmartzMarket',    href: '/smartzmarket',   icon: ShoppingBag, desc: 'Buy & sell anything',         color: 'text-amber-400' },
  { label: 'SmartzRide',      href: '/smartzride',     icon: Car,         desc: 'Ride-hailing across Africa',  color: 'text-emerald-400' },
  { label: 'SmartzDelivery',  href: '/smartzdelivery', icon: Package,     desc: 'Fast local delivery',         color: 'text-blue-400' },
  { label: 'SmartzAds',       href: '/smartzads',      icon: Megaphone,   desc: 'Advertise to millions',       color: 'text-pink-400' },
]

const socialItems = [
  { label: 'SmartzSocial',  href: '/app/feed',      icon: Users,   desc: 'Your social feed',            color: 'text-violet-400' },
  { label: 'SmartzDating',  href: '/app/discover',  icon: Heart,   desc: 'Match & connect',             color: 'text-pink-400' },
  { label: 'SmartzTV',      href: '/smartztv',      icon: Tv,      desc: 'Live streams & creator hub',  color: 'text-purple-400' },
  { label: 'Spin & Chat',   href: '/app/spin',      icon: Zap,     desc: 'Random instant connections',  color: 'text-fuchsia-400' },
]

const mainLinks = [
  { label: 'World Stage',    href: '/world-stage' },
  { label: 'Our Team',       href: '/team' },
  { label: 'Subscription',   href: '/pricing' },
  { label: 'Blog',           href: '/blog' },
  { label: 'About',          href: '/about' },
]

interface DropdownMenuProps {
  items: { label: string; href: string; icon: React.ElementType; desc: string; color: string }[]
  onClose: () => void
}
function DropdownMenu({ items, onClose }: DropdownMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ type: 'spring', damping: 22, stiffness: 300 }}
      className="absolute top-full left-0 mt-2 w-64 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden p-2"
      style={{ background: 'rgba(19,16,58,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <motion.div key={item.href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
            <Link
              to={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0">
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">{item.label}</p>
                <p className="text-[11px] text-white/40">{item.desc}</p>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { dismissed, setOpen, setDismissed, unreadCount, setUnreadCount } = useLiveChat()
  const { session, isAdmin } = useAuth()
  const isSignedIn = !!session
  const dashboardHref = isAdmin ? '/admin' : '/app/feed'
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [businessOpen, setBusinessOpen] = useState(false)
  const [socialOpen, setSocialOpen] = useState(false)
  const [mobileBizOpen, setMobileBizOpen] = useState(false)
  const [mobileSocOpen, setMobileSocOpen] = useState(false)
  const bizRef = useRef<HTMLDivElement>(null)
  const socRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bizRef.current && !bizRef.current.contains(e.target as Node)) setBusinessOpen(false)
      if (socRef.current && !socRef.current.contains(e.target as Node)) setSocialOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)

  return (
    <>
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 sm:pt-4 px-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
          className={`w-full max-w-6xl transition-all duration-300 rounded-2xl ${
            scrolled
              ? 'shadow-2xl shadow-black/40'
              : ''
          }`}
          style={{
            background: scrolled ? 'rgba(13,11,26,0.92)' : 'rgba(13,11,26,0.75)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <motion.img
                src={logoImg}
                alt="SmartzConnect"
                whileHover={{ scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="h-8 w-auto object-contain drop-shadow-lg"
              />
              <span className="font-display font-black text-lg hidden sm:block">
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Smartz</span>
                <span className="text-white">Connect</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-0.5">
              {/* Business dropdown */}
              <div ref={bizRef} className="relative">
                <button
                  onClick={() => { setBusinessOpen(v => !v); setSocialOpen(false) }}
                  className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    businessOpen ? 'text-purple-300 bg-white/5' : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Business
                  <motion.span animate={{ rotate: businessOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {businessOpen && <DropdownMenu items={businessItems} onClose={() => setBusinessOpen(false)} />}
                </AnimatePresence>
              </div>

              {/* Social dropdown */}
              <div ref={socRef} className="relative">
                <button
                  onClick={() => { setSocialOpen(v => !v); setBusinessOpen(false) }}
                  className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    socialOpen ? 'text-purple-300 bg-white/5' : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Social
                  <motion.span animate={{ rotate: socialOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {socialOpen && <DropdownMenu items={socialItems} onClose={() => setSocialOpen(false)} />}
                </AnimatePresence>
              </div>

              {/* Static links */}
              {mainLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive(link.href) ? 'text-purple-300 bg-white/5' : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Live Chat icon */}
              {dismissed && (
                <motion.button
                  onClick={() => { setDismissed(false); setOpen(true); setUnreadCount(0) }}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
                  title="Open support chat"
                  className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[#FF1493]"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-pink-500 text-white text-[8px] font-black flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </motion.button>
              )}

              {/* Theme toggle */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </motion.button>

              {/* Auth buttons — desktop */}
              <div className="hidden sm:flex items-center gap-2">
                {/* Sign In (Purple) — auto-switches to Dashboard (Blue) once signed in */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 400 }}>
                  <Link
                    to={isSignedIn ? dashboardHref : '/login'}
                    className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
                    style={isSignedIn
                      ? { background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }
                      : { background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }
                    }
                  >
                    {isSignedIn ? 'Dashboard' : 'Sign in'}
                  </Link>
                </motion.div>

                {/* Join Now — Pink (hidden once already signed in) */}
                {!isSignedIn && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 400 }}>
                  <Link
                    to="/register"
                    className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
                      boxShadow: '0 4px 16px rgba(236,72,153,0.38)',
                    }}
                  >
                    Join Now!
                  </Link>
                </motion.div>
                )}
              </div>

              {/* Mobile menu button */}
              <motion.button
                onClick={() => setMobileOpen(v => !v)}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <AnimatePresence mode="wait">
                  {mobileOpen
                    ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-4.5 h-4.5" /></motion.span>
                    : <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-4.5 h-4.5" /></motion.span>
                  }
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </nav>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="fixed top-20 left-4 right-4 z-50 lg:hidden rounded-2xl shadow-2xl overflow-hidden"
              style={{ background: 'rgba(13,11,26,0.96)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="p-3 space-y-0.5">
                {/* Business */}
                <div>
                  <button
                    onClick={() => setMobileBizOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white font-semibold hover:bg-white/8 hover:text-purple-300 transition-all"
                  >
                    <span>Business</span>
                    <motion.span animate={{ rotate: mobileBizOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <ChevronDown className="w-4 h-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {mobileBizOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-4">
                        {businessItems.map(item => {
                          const Icon = item.icon
                          return (
                            <Link key={item.href} to={item.href}
                              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/70 hover:text-purple-300 transition-all">
                              <Icon className={`w-4 h-4 ${item.color}`} />
                              <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Social */}
                <div>
                  <button
                    onClick={() => setMobileSocOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white font-semibold hover:bg-white/8 hover:text-purple-300 transition-all"
                  >
                    <span>Social</span>
                    <motion.span animate={{ rotate: mobileSocOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <ChevronDown className="w-4 h-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {mobileSocOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-4">
                        {socialItems.map(item => {
                          const Icon = item.icon
                          return (
                            <Link key={item.href} to={item.href}
                              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/70 hover:text-purple-300 transition-all">
                              <Icon className={`w-4 h-4 ${item.color}`} />
                              <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Static links */}
                {mainLinks.map(link => (
                  <Link key={link.href} to={link.href}
                    className="flex items-center px-4 py-3 rounded-xl text-white font-semibold hover:bg-white/8 hover:text-purple-300 transition-all">
                    {link.label}
                  </Link>
                ))}

                <div className="h-px bg-white/8 my-2" />

                {/* Live chat in mobile */}
                {dismissed && (
                  <button
                    onClick={() => { setDismissed(false); setOpen(true); setMobileOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white font-semibold hover:bg-white/8 hover:text-purple-300 transition-all"
                  >
                    <MessageCircle className="w-4 h-4 text-pink-400" /> Support Chat
                    {unreadCount > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-black">{unreadCount}</span>
                    )}
                  </button>
                )}

                <div className="flex gap-2 px-2 pb-1">
                  {/* Sign In (Purple) — auto-switches to Dashboard (Blue) once signed in */}
                  <Link to={isSignedIn ? dashboardHref : '/login'} className="flex-1 py-2.5 rounded-xl text-center text-sm font-bold text-white transition-all"
                    style={isSignedIn
                      ? { background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 4px 12px rgba(37,99,235,0.30)' }
                      : { background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', boxShadow: '0 4px 12px rgba(124,58,237,0.30)' }
                    }>
                    {isSignedIn ? 'Dashboard' : 'Sign in'}
                  </Link>
                  {/* Join Now — Pink (hidden once already signed in) */}
                  {!isSignedIn && (
                  <Link to="/register" className="flex-1 py-2.5 rounded-xl text-center text-sm font-bold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)', boxShadow: '0 4px 12px rgba(236,72,153,0.30)' }}>
                    Join Now!
                  </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
