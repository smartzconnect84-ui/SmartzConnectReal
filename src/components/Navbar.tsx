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
  { label: 'World Stage', href: '/world-stage' },
  { label: 'Our Team',    href: '/team' },
  { label: 'Pricing',     href: '/subscriptions' },
  { label: 'Blog',        href: '/blog' },
  { label: 'About',       href: '/about' },
]

interface DropdownMenuProps {
  items: { label: string; href: string; icon: React.ElementType; desc: string; color: string }[]
  onClose: () => void
}
function DropdownMenu({ items, onClose }: DropdownMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.16 }}
      className="absolute top-full left-0 mt-2 w-64 bg-[#13103A]/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 border border-white/10 overflow-hidden p-2"
    >
      {items.map(item => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
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
        )
      })}
    </motion.div>
  )
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { dismissed, setOpen, setDismissed, unreadCount, setUnreadCount } = useLiveChat()
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
        <div className={`w-full max-w-6xl transition-all duration-300 rounded-2xl ${
          scrolled
            ? 'bg-[#0D0B1A]/90 backdrop-blur-xl shadow-2xl shadow-black/40 border border-white/8'
            : 'bg-[#0D0B1A]/75 backdrop-blur-md border border-white/8'
        }`}>
          <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <img
                src={logoImg}
                alt="SmartzConnect"
                className="h-8 w-auto object-contain group-hover:scale-105 transition-transform drop-shadow-lg"
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
                    businessOpen ? 'text-purple-300' : 'text-white/80 hover:text-white'
                  }`}
                >
                  Business
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${businessOpen ? 'rotate-180' : ''}`} />
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
                    socialOpen ? 'text-purple-300' : 'text-white/80 hover:text-white'
                  }`}
                >
                  Social
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${socialOpen ? 'rotate-180' : ''}`} />
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
                    isActive(link.href) ? 'text-purple-300' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Live Chat icon when dismissed */}
              {dismissed && (
                <button
                  onClick={() => { setDismissed(false); setOpen(true); setUnreadCount(0) }}
                  title="Open support chat"
                  className="relative w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white bg-white/8 hover:bg-white/12 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-pink-500 text-white text-[8px] font-black flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white bg-white/8 hover:bg-white/12 transition-all"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Auth buttons — desktop */}
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white border border-white/20 hover:bg-white/8 transition-all"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-bold shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:from-purple-500 hover:to-purple-400 transition-all"
                >
                  Join Now!
                </Link>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(v => !v)}
                className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center bg-white/8 text-white hover:bg-white/12 transition-all"
              >
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 left-4 right-4 z-50 lg:hidden bg-[#0D0B1A]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
            >
              <div className="p-3 space-y-0.5">
                {/* Business */}
                <div>
                  <button
                    onClick={() => setMobileBizOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white font-semibold hover:bg-white/8 hover:text-purple-300 transition-all"
                  >
                    <span>Business</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileBizOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {mobileBizOpen && (
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden pl-4"
                      >
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
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileSocOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {mobileSocOpen && (
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden pl-4"
                      >
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
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center px-4 py-3 rounded-xl text-white font-semibold hover:bg-white/8 hover:text-purple-300 transition-all"
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="h-px bg-white/8 my-2" />

                {/* Live chat in mobile when dismissed */}
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
                  <Link
                    to="/login"
                    className="flex-1 py-2.5 rounded-xl text-center text-sm font-semibold border border-white/20 text-white hover:bg-white/8 transition-all"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 py-2.5 rounded-xl text-center text-sm font-bold bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md shadow-purple-600/30"
                  >
                    Join Now!
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
