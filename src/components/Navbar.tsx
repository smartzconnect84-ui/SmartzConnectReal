import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun, Moon, Menu, X, ChevronDown,
  Tv, ShoppingBag, Car, Package, Megaphone,
  Heart, Users, MessageCircle, Zap, ArrowRight,
} from 'lucide-react'
const logoImg = '/logo.png'
import { useTheme } from '@/contexts/ThemeContext'
import { openTawkChat } from '@/lib/tawk'
import { useAuth } from '@/hooks/useAuth'

const businessItems = [
  { label: 'SmartzMarket',   href: '/smartzmarket',   icon: ShoppingBag, desc: 'Buy & sell anything',        color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  { label: 'SmartzRide',     href: '/smartzride',     icon: Car,         desc: 'Ride-hailing across Africa', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'SmartzDelivery', href: '/smartzdelivery', icon: Package,     desc: 'Fast local delivery',        color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
  { label: 'SmartzAds',      href: '/smartzads',      icon: Megaphone,   desc: 'Advertise to millions',      color: 'text-pink-400',    bg: 'bg-pink-500/10'    },
]

const socialItems = [
  { label: 'SmartzSocial',  href: '/app/feed',     icon: Users,  desc: 'Your social feed',           color: 'text-violet-400',  bg: 'bg-violet-500/10' },
  { label: 'SmartzDating',  href: '/app/discover', icon: Heart,  desc: 'Match & connect',            color: 'text-pink-400',    bg: 'bg-pink-500/10'   },
  { label: 'SmartzTV',      href: '/smartztv',     icon: Tv,     desc: 'Live streams & creator hub', color: 'text-purple-400',  bg: 'bg-purple-500/10' },
  { label: 'Spin & Chat',   href: '/app/spin',     icon: Zap,    desc: 'Random instant connections', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10'},
]

const mainLinks = [
  { label: 'World Stage',  href: '/world-stage' },
  { label: 'Our Team',     href: '/team'        },
  { label: 'Pricing',      href: '/pricing'     },
  { label: 'Blog',         href: '/blog'        },
  { label: 'About',        href: '/about'       },
]

/* ── Mega dropdown ─────────────────────────────────────────────────────── */
interface MegaDropProps {
  title: string
  items: typeof businessItems
  onClose: () => void
}
function MegaDrop({ title, items, onClose }: MegaDropProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ type: 'spring', damping: 24, stiffness: 320 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[340px] rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(15,12,30,0.96)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{title}</p>
      </div>

      {/* Items grid — 2 columns */}
      <div className="p-2.5 grid grid-cols-2 gap-1">
        {items.map((item, i) => {
          const Icon = item.icon
          return (
            <motion.div key={item.href} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link
                to={item.href}
                onClick={onClose}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/6 transition-all group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white/90 group-hover:text-white transition-colors leading-tight">{item.label}</p>
                  <p className="text-[11px] text-white/35 mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Footer CTA */}
      <div className="px-3 pb-3">
        <div className="h-px bg-white/6 mb-3" />
        <Link
          to="/app/feed"
          onClick={onClose}
          className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/4 hover:bg-white/8 transition-all group"
        >
          <span className="text-xs font-semibold text-white/50 group-hover:text-white/70 transition-colors">Explore all products</span>
          <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </motion.div>
  )
}

/* ── Nav link with animated underline ─────────────────────────────────── */
function NavLink({ to, children, active }: { to: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link
      to={to}
      className={`relative px-3 py-2 text-[13px] font-semibold transition-colors duration-150 ${
        active ? 'text-white' : 'text-white/55 hover:text-white/90'
      }`}
    >
      {children}
      {active && (
        <motion.span
          layoutId="nav-underline"
          className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
          style={{ background: 'linear-gradient(90deg, #EC4899, #9B5DE5)' }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  )
}

/* ── Dropdown trigger button ───────────────────────────────────────────── */
function DropTrigger({
  label,
  open,
  onClick,
  active,
}: {
  label: string
  open: boolean
  onClick: () => void
  active: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1 px-3 py-2 text-[13px] font-semibold rounded-lg transition-colors duration-150 ${
        open || active ? 'text-white' : 'text-white/55 hover:text-white/90'
      }`}
    >
      {label}
      <motion.span
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="flex-shrink-0"
      >
        <ChevronDown className="w-3 h-3" />
      </motion.span>
      {active && (
        <motion.span
          layoutId="nav-underline"
          className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
          style={{ background: 'linear-gradient(90deg, #EC4899, #9B5DE5)' }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </button>
  )
}

/* ── Main Navbar ───────────────────────────────────────────────────────── */
export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { session, isAdmin } = useAuth()
  const isSignedIn = !!session
  const dashboardHref = isAdmin ? '/admin' : '/app/feed'
  const location = useLocation()

  const [scrolled, setScrolled]         = useState(false)
  const [mobileOpen, setMobileOpen]     = useState(false)
  const [businessOpen, setBusinessOpen] = useState(false)
  const [socialOpen, setSocialOpen]     = useState(false)
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

  const bizActive = businessItems.some(i => location.pathname.startsWith(i.href))
  const socActive = socialItems.some(i => location.pathname.startsWith(i.href))

  return (
    <>
      {/* ── Floating navbar ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-3 sm:pt-4">
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 220, damping: 22 }}
          className="w-full max-w-6xl"
        >
          <div
            className={`flex items-center justify-between h-14 px-3 sm:px-5 rounded-2xl transition-all duration-300 ${
              scrolled ? 'shadow-2xl shadow-black/50' : 'shadow-lg shadow-black/20'
            }`}
            style={{
              background: scrolled
                ? 'rgba(11,9,22,0.94)'
                : 'rgba(11,9,22,0.78)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: scrolled
                ? '1px solid rgba(255,255,255,0.10)'
                : '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <motion.img
                src={logoImg}
                alt="SmartzConnect"
                whileHover={{ scale: 1.07, rotate: -2 }}
                transition={{ type: 'spring', stiffness: 420 }}
                className="h-8 w-auto object-contain"
              />
              <span className="font-display font-black text-[17px] hidden sm:block tracking-tight">
                <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Smartz</span>
                <span className="text-white">Connect</span>
              </span>
            </Link>

            {/* ── Desktop center nav ── */}
            <div className="hidden lg:flex items-center gap-0 absolute left-1/2 -translate-x-1/2">
              {/* Business dropdown */}
              <div ref={bizRef} className="relative">
                <DropTrigger
                  label="Business"
                  open={businessOpen}
                  active={bizActive}
                  onClick={() => { setBusinessOpen(v => !v); setSocialOpen(false) }}
                />
                <AnimatePresence>
                  {businessOpen && (
                    <MegaDrop
                      title="Business & Commerce"
                      items={businessItems}
                      onClose={() => setBusinessOpen(false)}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Social dropdown */}
              <div ref={socRef} className="relative">
                <DropTrigger
                  label="Social"
                  open={socialOpen}
                  active={socActive}
                  onClick={() => { setSocialOpen(v => !v); setBusinessOpen(false) }}
                />
                <AnimatePresence>
                  {socialOpen && (
                    <MegaDrop
                      title="Social & Community"
                      items={socialItems}
                      onClose={() => setSocialOpen(false)}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Static links */}
              {mainLinks.map(link => (
                <NavLink key={link.href} to={link.href} active={isActive(link.href)}>
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-1.5">
              {/* Support chat */}
              <motion.button
                onClick={() => openTawkChat()}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                title="Live support"
                className="hidden sm:flex w-8 h-8 rounded-xl items-center justify-center text-white/40 hover:text-pink-400 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </motion.button>

              {/* Theme toggle */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                className="hidden sm:flex w-8 h-8 rounded-xl items-center justify-center text-white/40 hover:text-white/80 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </motion.button>

              {/* Separator */}
              <div className="hidden sm:block w-px h-5 bg-white/10 mx-1" />

              {/* Auth buttons */}
              <div className="hidden sm:flex items-center gap-1.5">
                {isSignedIn ? (
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 400 }}>
                    <Link
                      to={dashboardHref}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[13px] font-bold text-white transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                        boxShadow: '0 0 0 1px rgba(124,58,237,0.4), 0 4px 16px rgba(124,58,237,0.25)',
                      }}
                    >
                      Dashboard
                    </Link>
                  </motion.div>
                ) : (
                  <>
                    {/* Sign In — ghost */}
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                      <Link
                        to="/login"
                        className="px-4 py-1.5 rounded-xl text-[13px] font-semibold text-white/70 hover:text-white transition-colors"
                        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                      >
                        Sign in
                      </Link>
                    </motion.div>

                    {/* Join Now — gradient pill */}
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400 }}>
                      <Link
                        to="/register"
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[13px] font-bold text-white transition-all"
                        style={{
                          background: 'linear-gradient(135deg, #EC4899 0%, #9B5DE5 100%)',
                          boxShadow: '0 0 0 1px rgba(236,72,153,0.35), 0 4px 16px rgba(236,72,153,0.25)',
                        }}
                      >
                        Get started
                      </Link>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Mobile hamburger */}
              <motion.button
                onClick={() => setMobileOpen(v => !v)}
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}
                className="lg:hidden w-8 h-8 rounded-xl flex items-center justify-center text-white/70 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                <AnimatePresence mode="wait">
                  {mobileOpen
                    ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.14 }}><X className="w-4 h-4" /></motion.span>
                    : <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.14 }}><Menu className="w-4 h-4" /></motion.span>
                  }
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </nav>

      {/* ── Mobile menu drawer ──────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              className="fixed top-[72px] left-4 right-4 z-50 lg:hidden rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(11,9,22,0.97)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
              }}
            >
              <div className="p-2.5 space-y-0.5">

                {/* Business accordion */}
                <div>
                  <button
                    onClick={() => setMobileBizOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <span>Business</span>
                    <motion.span animate={{ rotate: mobileBizOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {mobileBizOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-2 pb-1 grid grid-cols-2 gap-1">
                          {businessItems.map(item => {
                            const Icon = item.icon
                            return (
                              <Link
                                key={item.href} to={item.href}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group"
                              >
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                                </div>
                                <span className="text-[12px] font-medium text-white/60 group-hover:text-white transition-colors leading-tight">{item.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Social accordion */}
                <div>
                  <button
                    onClick={() => setMobileSocOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <span>Social</span>
                    <motion.span animate={{ rotate: mobileSocOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {mobileSocOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-2 pb-1 grid grid-cols-2 gap-1">
                          {socialItems.map(item => {
                            const Icon = item.icon
                            return (
                              <Link
                                key={item.href} to={item.href}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group"
                              >
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                                </div>
                                <span className="text-[12px] font-medium text-white/60 group-hover:text-white transition-colors leading-tight">{item.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/6 mx-2 my-1" />

                {/* Static links */}
                <div className="grid grid-cols-2 gap-0.5">
                  {mainLinks.map(link => (
                    <Link
                      key={link.href} to={link.href}
                      className={`px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                        isActive(link.href) ? 'text-white bg-white/6' : 'text-white/55 hover:text-white hover:bg-white/4'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                {/* Divider */}
                <div className="h-px bg-white/6 mx-2 my-1" />

                {/* Utility buttons */}
                <div className="flex items-center gap-2 px-2 pb-0.5">
                  <button
                    onClick={() => { openTawkChat(); setMobileOpen(false) }}
                    className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white/55 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-pink-400" /> Support
                  </button>
                  <button
                    onClick={() => { toggleTheme(); }}
                    className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white/55 hover:text-white hover:bg-white/5 transition-all"
                  >
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-purple-400" />}
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  </button>
                </div>

                {/* Auth CTA */}
                <div className="px-2 pb-2 pt-0.5 flex gap-2">
                  <Link
                    to={isSignedIn ? dashboardHref : '/login'}
                    className="flex-1 py-2.5 rounded-xl text-center text-[13px] font-semibold text-white/70 transition-all"
                    style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    {isSignedIn ? 'Dashboard' : 'Sign in'}
                  </Link>
                  {!isSignedIn && (
                    <Link
                      to="/register"
                      className="flex-1 py-2.5 rounded-xl text-center text-[13px] font-bold text-white transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #EC4899 0%, #9B5DE5 100%)',
                        boxShadow: '0 4px 16px rgba(236,72,153,0.25)',
                      }}
                    >
                      Get started
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
