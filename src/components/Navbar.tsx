import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Menu, X, ChevronDown, Tv, ShoppingBag, Car, Package, Megaphone, MessageCircle } from 'lucide-react'
const logoImg = '/logo.png'
import { useTheme } from '@/contexts/ThemeContext'
import { useLiveChat } from '@/contexts/LiveChatContext'

const exploreItems = [
  { label: 'SmartzConnect TV', href: '/smartztv',      icon: Tv,          desc: 'Live streams & creator content', color: 'text-violet-500' },
  { label: 'SmartzRide',       href: '/smartzride',    icon: Car,         desc: 'Ride-hailing across Africa',     color: 'text-emerald-500' },
  { label: 'SmartzMarket',     href: '/smartzmarket',  icon: ShoppingBag, desc: 'Buy & sell anything',            color: 'text-amber-500' },
  { label: 'SmartzDelivery',   href: '/smartzdelivery',icon: Package,     desc: 'Fast local delivery',            color: 'text-blue-500' },
  { label: 'SmartzAds',        href: '/smartzads',     icon: Megaphone,   desc: 'Advertise to millions',          color: 'text-pink-500' },
]

const mainLinks = [
  { label: 'Home',         href: '/' },
  { label: 'Our Team',     href: '/team' },
  { label: 'Blog',         href: '/blog' },
  { label: 'World Stage',  href: '/world-stage' },
  { label: 'Subscription', href: '/#pricing' },
]

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { dismissed, setOpen, setDismissed, unreadCount, setUnreadCount } = useLiveChat()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const [mobileExploreOpen, setMobileExploreOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExploreOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'dark:bg-[#0D0A14]/95 bg-white/95 backdrop-blur-xl shadow-lg shadow-black/10 dark:shadow-black/30'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <img src={logoImg} alt="SmartzConnect" className="h-9 w-auto object-contain group-hover:scale-105 transition-transform drop-shadow-lg" />
              <span className="font-display font-black text-lg hidden sm:block">
                <span className="text-gradient-love">Smartz</span>
                <span className={scrolled ? 'dark:text-white text-gray-900' : 'text-white'}>Connect</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              <Link to="/"
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/')
                    ? 'text-brand-pink'
                    : scrolled ? 'dark:text-gray-300 text-gray-700 hover:text-brand-pink' : 'text-white/90 hover:text-white'
                }`}>
                Home
              </Link>

              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setExploreOpen(v => !v)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    exploreOpen
                      ? 'text-brand-pink'
                      : scrolled ? 'dark:text-gray-300 text-gray-700 hover:text-brand-pink' : 'text-white/90 hover:text-white'
                  }`}>
                  Explore
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${exploreOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {exploreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute top-full left-0 mt-2 w-64 dark:bg-[#130E1E] bg-white rounded-2xl shadow-2xl shadow-black/20 border dark:border-white/8 border-gray-100 overflow-hidden p-2"
                    >
                      {exploreItems.map(item => {
                        const Icon = item.icon
                        return (
                          <Link key={item.href} to={item.href}
                            onClick={() => setExploreOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:dark:bg-white/5 hover:bg-pink-50 transition-all group">
                            <div className="w-8 h-8 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Icon className={`w-4 h-4 ${item.color}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold dark:text-white text-gray-900 group-hover:text-brand-pink transition-colors">{item.label}</p>
                              <p className="text-[11px] dark:text-gray-500 text-gray-400">{item.desc}</p>
                            </div>
                          </Link>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {mainLinks.slice(1).map(link => (
                <Link key={link.href} to={link.href}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive(link.href)
                      ? 'text-brand-pink'
                      : scrolled ? 'dark:text-gray-300 text-gray-700 hover:text-brand-pink' : 'text-white/90 hover:text-white'
                  }`}>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Live Chat icon — shown when chat is dismissed to navbar */}
              {dismissed && (
                <button
                  onClick={() => { setDismissed(false); setOpen(true); setUnreadCount(0) }}
                  title="Open support chat"
                  className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    scrolled ? 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}>
                  <MessageCircle className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-pink text-white text-[8px] font-black flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* Theme toggle */}
              <button onClick={toggleTheme}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  scrolled ? 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink' : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Auth buttons — desktop */}
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    scrolled ? 'dark:text-gray-300 text-gray-700 hover:text-brand-pink' : 'text-white/90 hover:text-white'
                  }`}>
                  Sign In
                </Link>
                <Link to="/register"
                  className="px-5 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all">
                  Join Free 💕
                </Link>
              </div>

              {/* Mobile menu button */}
              <button onClick={() => setMobileOpen(v => !v)}
                className={`lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  scrolled ? 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600' : 'bg-white/10 text-white'
                }`}>
                {mobileOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-16 left-4 right-4 z-50 lg:hidden dark:bg-[#130E1E] bg-white rounded-2xl shadow-2xl border dark:border-white/8 border-gray-100 overflow-hidden"
            >
              <div className="p-3 space-y-0.5">
                <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl dark:text-white text-gray-900 font-semibold hover:dark:bg-white/5 hover:bg-pink-50 hover:text-brand-pink transition-all">
                  🏠 Home
                </Link>

                <div>
                  <button onClick={() => setMobileExploreOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl dark:text-white text-gray-900 font-semibold hover:dark:bg-white/5 hover:bg-pink-50 hover:text-brand-pink transition-all">
                    <span>🔍 Explore</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileExploreOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {mobileExploreOpen && (
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden pl-4">
                        {exploreItems.map(item => {
                          const Icon = item.icon
                          return (
                            <Link key={item.href} to={item.href}
                              className="flex items-center gap-3 px-4 py-2.5 rounded-xl dark:text-gray-300 text-gray-600 hover:text-brand-pink transition-all">
                              <Icon className={`w-4 h-4 ${item.color}`} />
                              <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {mainLinks.slice(1).map(link => (
                  <Link key={link.href} to={link.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl dark:text-white text-gray-900 font-semibold hover:dark:bg-white/5 hover:bg-pink-50 hover:text-brand-pink transition-all">
                    {link.label === 'Our Team' ? '👥' : link.label === 'Blog' ? '📝' : link.label === 'World Stage' ? '🌍' : '💎'} {link.label}
                  </Link>
                ))}

                <div className="h-px dark:bg-white/5 bg-gray-100 my-2" />
                {/* Live chat in mobile menu when dismissed */}
                {dismissed && (
                  <button onClick={() => { setDismissed(false); setOpen(true); setMobileOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl dark:text-white text-gray-900 font-semibold hover:dark:bg-white/5 hover:bg-pink-50 hover:text-brand-pink transition-all">
                    <MessageCircle className="w-4 h-4 text-brand-pink" /> Support Chat
                    {unreadCount > 0 && <span className="ml-auto px-1.5 py-0.5 rounded-full bg-brand-pink text-white text-[10px] font-black">{unreadCount}</span>}
                  </button>
                )}
                <div className="flex gap-2 px-2 pb-1">
                  <Link to="/login" className="flex-1 py-2.5 rounded-xl text-center text-sm font-semibold dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 hover:text-brand-pink transition-all">
                    Sign In
                  </Link>
                  <Link to="/register" className="flex-1 py-2.5 rounded-xl text-center text-sm font-bold bg-love-gradient text-white shadow-md shadow-pink-500/20">
                    Join Free 💕
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
