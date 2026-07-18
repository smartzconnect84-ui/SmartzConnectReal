import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun, Moon, Menu, X, ChevronDown,
  Tv, ShoppingBag, Car, Package, Megaphone,
  Heart, Users, MessageCircle, Zap, GraduationCap,
  Globe, Users2, FileText, Info,
} from 'lucide-react'
const defaultLogoImg = '/logo.png'
import { useTheme } from '@/contexts/ThemeContext'
import { openTawkChat } from '@/lib/tawk'
import { useAuth } from '@/hooks/useAuth'
import { useSiteConfig, SITE_IMAGE_KEYS } from '@/contexts/SiteConfigContext'
import { useServices } from '@/hooks/useServices'
import BrandName from '@/components/BrandName'

/* ── Nav data (hardcoded fallback) ────────────────────────────────────── */
const FALLBACK_PRODUCTS = {
  business: [
    { label: 'SmartzMarket',   href: '/smartzmarket',   icon: ShoppingBag,  color: 'text-amber-400',    bg: 'bg-amber-500/10',    desc: 'Buy & sell anything'        },
    { label: 'SmartzRide',     href: '/smartzride',     icon: Car,          color: 'text-emerald-400',  bg: 'bg-emerald-500/10',  desc: 'Ride-hailing across Africa' },
    { label: 'SmartzDelivery', href: '/smartzdelivery', icon: Package,      color: 'text-sky-400',      bg: 'bg-sky-500/10',      desc: 'Fast local delivery'        },
    { label: 'SmartzAds',      href: '/smartzads',      icon: Megaphone,    color: 'text-rose-400',     bg: 'bg-rose-500/10',     desc: 'Advertise to millions'      },
    { label: 'SmartzLearning', href: '/smartzlearning', icon: GraduationCap,color: 'text-teal-400',     bg: 'bg-teal-500/10',     desc: 'Courses & skills'           },
    { label: 'SmartzTV',       href: '/smartztv',       icon: Tv,           color: 'text-purple-400',   bg: 'bg-purple-500/10',   desc: 'Live streams & creators'    },
  ],
  social: [
    { label: 'SmartzSocial',   href: '/smartzsocial',   icon: Users,       color: 'text-violet-400',   bg: 'bg-violet-500/10',   desc: 'Your social feed'           },
    { label: 'SmartzDating',   href: '/app/discover',   icon: Heart,       color: 'text-pink-400',     bg: 'bg-pink-500/10',     desc: 'Match & connect'            },
  ],
}

// Hardcoded icon/style mapping for known service slugs
const SERVICE_ICON_MAP: Record<string, { icon: typeof ShoppingBag; color: string; bg: string }> = {
  'smartzmarket':   { icon: ShoppingBag,   color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  'smartzride':     { icon: Car,           color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'smartzdelivery': { icon: Package,       color: 'text-sky-400',     bg: 'bg-sky-500/10'     },
  'smartzads':      { icon: Megaphone,     color: 'text-rose-400',    bg: 'bg-rose-500/10'    },
  'smartzlearning': { icon: GraduationCap, color: 'text-teal-400',    bg: 'bg-teal-500/10'    },
  'smartzsocial':   { icon: Users,         color: 'text-violet-400',  bg: 'bg-violet-500/10'  },
  'smartzdating':   { icon: Heart,         color: 'text-pink-400',    bg: 'bg-pink-500/10'    },
  'smartztv':       { icon: Tv,            color: 'text-purple-400',  bg: 'bg-purple-500/10'  },
  'world-stage':    { icon: Globe,         color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
}

// Slugs that belong in the "Commerce & Growth" group. Everything else (except
// world-stage, which has its own standalone nav link) falls into "Social & Love".
const COMMERCE_SLUGS = ['smartzmarket','smartzride','smartzdelivery','smartzads','smartzlearning','smartztv']

const company = [
  { label: 'About Us',      href: '/about',        icon: Info,       desc: 'Our story & mission'     },
  { label: 'Our Team',      href: '/team',         icon: Users2,     desc: 'Meet the people behind'  },
  { label: 'Blog',          href: '/blog',         icon: FileText,   desc: 'Stories & updates'       },
  { label: 'World Stage',   href: '/world-stage',  icon: Globe,      desc: 'Global community hub'    },
]

/* ── Dropdown: Products (mega, 2-col) ─────────────────────────────────── */
function ProductsDrop({ onClose }: { onClose: () => void }) {
  const { services } = useServices()

  // Build business/social lists from DB, fall back to hardcoded if empty
  let business = FALLBACK_PRODUCTS.business
  let social = FALLBACK_PRODUCTS.social

  if (services.length > 0) {
    const commerceItems = services
      .filter(s => COMMERCE_SLUGS.includes(s.slug))
      .map(s => {
        const style = SERVICE_ICON_MAP[s.slug] || { icon: ShoppingBag, color: 'text-gray-400', bg: 'bg-gray-500/10' }
        return { label: s.name, href: s.route || `/${s.slug}`, icon: style.icon, color: style.color, bg: style.bg, desc: s.description || '' }
      })
    const socialItems = services
      .filter(s => !COMMERCE_SLUGS.includes(s.slug) && s.slug !== 'world-stage')
      .map(s => {
        const style = SERVICE_ICON_MAP[s.slug] || { icon: Zap, color: 'text-gray-400', bg: 'bg-gray-500/10' }
        return { label: s.name, href: s.route || `/${s.slug}`, icon: style.icon, color: style.color, bg: style.bg, desc: s.description || '' }
      })
    if (commerceItems.length > 0) business = commerceItems
    if (socialItems.length > 0) social = socialItems
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ type: 'spring', damping: 26, stiffness: 340 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-[min(560px,calc(100vw-2rem))] rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(12, 9, 26, 0.98)',
        backdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 28px 64px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.05)',
      }}
    >
      <div className="grid grid-cols-2 gap-0 p-3">
        {/* Business */}
        <div>
          <p className="px-3 pt-2 pb-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/25">Commerce &amp; Growth</p>
          {business.map(item => {
            const Icon = item.icon
            return (
              <Link key={item.href} to={item.href} onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white/80 group-hover:text-white transition-colors">{item.label}</p>
                  <p className="text-[11px] text-white/30">{item.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute left-0 top-4 bottom-4 w-px bg-white/6" />
          <p className="px-3 pt-2 pb-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/25">Social &amp; Love</p>
          {social.map(item => {
            const Icon = item.icon
            return (
              <Link key={item.href} to={item.href} onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white/80 group-hover:text-white transition-colors">{item.label}</p>
                  <p className="text-[11px] text-white/30">{item.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

/* ── Dropdown: Company (single col) ───────────────────────────────────── */
function CompanyDrop({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ type: 'spring', damping: 26, stiffness: 340 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-[240px] rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(12, 9, 26, 0.98)',
        backdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 28px 64px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.05)',
      }}
    >
      <div className="p-2">
        {company.map(item => {
          const Icon = item.icon
          return (
            <Link key={item.href} to={item.href} onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all group">
              <div className="w-7 h-7 rounded-lg bg-white/6 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-white/50 group-hover:text-white/80 transition-colors" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white/80 group-hover:text-white transition-colors">{item.label}</p>
                <p className="text-[11px] text-white/30">{item.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ── Trigger button ───────────────────────────────────────────────────── */
function Trigger({ label, open, active, onClick }: { label: string; open: boolean; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-0.5 px-3.5 py-2 text-[13.5px] font-medium tracking-[-0.01em] rounded-lg transition-all duration-150 ${
        open || active ? 'text-white' : 'text-white/50 hover:text-white/85'
      }`}
    >
      {label}
      <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: 'spring', stiffness: 340, damping: 28 }}>
        <ChevronDown className="w-3 h-3 ml-0.5" />
      </motion.span>
      {active && (
        <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-lg bg-white/6 -z-10"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
      )}
    </button>
  )
}

/* ── Static nav link ──────────────────────────────────────────────────── */
function NavLink({ to, children, active }: { to: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link
      to={to}
      className={`relative px-3.5 py-2 text-[13.5px] font-medium tracking-[-0.01em] rounded-lg transition-all duration-150 ${
        active ? 'text-white' : 'text-white/50 hover:text-white/85'
      }`}
    >
      {children}
      {active && (
        <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-lg bg-white/6 -z-10"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
      )}
    </Link>
  )
}

/* ── Main component ───────────────────────────────────────────────────── */
export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const siteConfig = useSiteConfig()
  const { session, isAdmin } = useAuth()
  const isSignedIn = !!session
  const dashboardHref = isAdmin ? '/admin' : '/app/feed'
  const location = useLocation()

  const [scrolled, setScrolled]         = useState(false)
  const [mobileOpen, setMobileOpen]     = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const [companyOpen, setCompanyOpen]   = useState(false)
  const [mobileProdOpen, setMobileProdOpen] = useState(false)
  const [mobileCompOpen, setMobileCompOpen] = useState(false)

  const prodRef    = useRef<HTMLDivElement>(null)
  const companyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (prodRef.current    && !prodRef.current.contains(e.target as Node))    setProductsOpen(false)
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) setCompanyOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)

  const { services: navServices } = useServices()

  // Derive product lists from DB, falling back to hardcoded if the table is empty/missing
  const mobileProducts = (() => {
    if (navServices.length === 0) return FALLBACK_PRODUCTS
    const commerceItems = navServices
      .filter(s => COMMERCE_SLUGS.includes(s.slug))
      .map(s => {
        const style = SERVICE_ICON_MAP[s.slug] || { icon: ShoppingBag, color: 'text-gray-400', bg: 'bg-gray-500/10' }
        return { label: s.name, href: s.route || `/${s.slug}`, icon: style.icon, color: style.color, bg: style.bg, desc: s.description || '' }
      })
    const socialItems = navServices
      .filter(s => !COMMERCE_SLUGS.includes(s.slug) && s.slug !== 'world-stage')
      .map(s => {
        const style = SERVICE_ICON_MAP[s.slug] || { icon: Zap, color: 'text-gray-400', bg: 'bg-gray-500/10' }
        return { label: s.name, href: s.route || `/${s.slug}`, icon: style.icon, color: style.color, bg: style.bg, desc: s.description || '' }
      })
    return {
      business: commerceItems.length > 0 ? commerceItems : FALLBACK_PRODUCTS.business,
      social:   socialItems.length > 0   ? socialItems   : FALLBACK_PRODUCTS.social,
    }
  })()

  const allProductLinks = [...mobileProducts.business, ...mobileProducts.social]
  const prodActive = allProductLinks.some(i => location.pathname.startsWith(i.href))
  const compActive = company.some(i => location.pathname.startsWith(i.href))

  return (
    <>
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-3 sm:pt-4 md:px-0 md:pt-0">
        <motion.div
          initial={{ y: -28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 24, duration: 0.6 }}
          className="w-full max-w-6xl md:max-w-none"
        >
          <div
            className={`flex items-center justify-between h-[52px] sm:h-[56px] px-3 sm:px-4 md:px-6 rounded-2xl md:rounded-none transition-all duration-300 ${
              scrolled ? 'shadow-2xl shadow-black/50' : 'shadow-md shadow-black/20'
            }`}
            style={{
              background: scrolled ? 'rgba(9,7,20,0.96)' : 'rgba(9,7,20,0.80)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: scrolled ? '1px solid rgba(255,255,255,0.11)' : '1px solid rgba(255,255,255,0.07)',
              // Subtle inner top highlight — the "classic" touch
              boxShadow: scrolled
                ? 'inset 0 1px 0 rgba(255,255,255,0.05), 0 24px 56px rgba(0,0,0,0.5)'
                : 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >

            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <motion.img
                src={siteConfig.get(SITE_IMAGE_KEYS.logo, defaultLogoImg)} alt="SmartzConnect"
                whileHover={{ scale: 1.06 }}
                transition={{ type: 'spring', stiffness: 440 }}
                className="h-7 w-auto object-contain"
              />
              <span className="font-display font-black text-base tracking-tight leading-none">
                <BrandName />
              </span>
            </Link>

            {/* ── Desktop center nav ── */}
            <div className="hidden lg:flex items-center gap-0 absolute left-1/2 -translate-x-1/2">
              {/* Home */}
              <NavLink to="/" active={isActive('/')}>Home</NavLink>

              {/* Products */}
              <div ref={prodRef} className="relative">
                <Trigger label="Products" open={productsOpen} active={prodActive}
                  onClick={() => { setProductsOpen(v => !v); setCompanyOpen(false) }} />
                <AnimatePresence>
                  {productsOpen && <ProductsDrop onClose={() => setProductsOpen(false)} />}
                </AnimatePresence>
              </div>

              {/* Company */}
              <div ref={companyRef} className="relative">
                <Trigger label="Company" open={companyOpen} active={compActive}
                  onClick={() => { setCompanyOpen(v => !v); setProductsOpen(false) }} />
                <AnimatePresence>
                  {companyOpen && <CompanyDrop onClose={() => setCompanyOpen(false)} />}
                </AnimatePresence>
              </div>

              {/* Standalone links */}
              <NavLink to="/world-stage" active={isActive('/world-stage')}>World Stage</NavLink>
              <NavLink to="/pricing"     active={isActive('/pricing')}>Pricing</NavLink>
              <NavLink to="/blog"        active={isActive('/blog')}>Blog</NavLink>
            </div>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-1">
              {/* Support */}
              <motion.button
                onClick={() => openTawkChat()}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.91 }}
                title="Live support"
                className="flex w-8 h-8 rounded-xl items-center justify-center text-white/35 hover:text-white/75 transition-colors duration-150"
              >
                <MessageCircle className="w-[18px] h-[18px]" />
              </motion.button>

              {/* Divider */}
              <div className="hidden sm:block w-px h-4 bg-white/10 mx-1.5" />

              {/* Auth */}
              <div className="hidden sm:flex items-center gap-1.5">
                {isSignedIn ? (
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link to={dashboardHref}
                      className="inline-flex items-center px-4 py-[7px] rounded-xl text-[13px] font-semibold text-white transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)',
                        boxShadow: '0 0 0 1px rgba(234,179,8,0.35), 0 2px 12px rgba(234,179,8,0.20)',
                      }}>
                      Dashboard
                    </Link>
                  </motion.div>
                ) : (
                  <>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Link to="/login"
                        className="inline-flex items-center px-4 py-[7px] rounded-xl text-[13px] font-semibold text-white transition-all"
                        style={{
                          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                          boxShadow: '0 0 0 1px rgba(22,163,74,0.35), 0 2px 12px rgba(22,163,74,0.20)',
                        }}>
                        Sign in
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                      <Link to="/register"
                        className="inline-flex items-center px-4 py-[7px] rounded-xl text-[13px] font-semibold text-white transition-all"
                        style={{
                          background: 'linear-gradient(135deg, #EC4899 0%, #9B5DE5 100%)',
                          boxShadow: '0 0 0 1px rgba(236,72,153,0.30), 0 2px 12px rgba(236,72,153,0.20)',
                        }}>
                        Get started
                      </Link>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <motion.button
                onClick={() => setMobileOpen(v => !v)}
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}
                className="lg:hidden w-8 h-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white transition-colors ml-1.5"
                style={{ border: '1px solid rgba(255,255,255,0.10)' }}
              >
                <AnimatePresence mode="wait">
                  {mobileOpen
                    ? <motion.span key="x"  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.13 }}><X    className="w-[19px] h-[19px]" /></motion.span>
                    : <motion.span key="m"  initial={{ rotate: 90, opacity: 0 }}  animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.13 }}><Menu className="w-[19px] h-[19px]" /></motion.span>
                  }
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </nav>

      {/* ── Mobile drawer ──────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.98 }}
              transition={{ type: 'spring', damping: 26, stiffness: 310 }}
              className="fixed top-[64px] sm:top-[72px] left-4 right-4 z-50 lg:hidden rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(9,7,20,0.98)',
                backdropFilter: 'blur(28px)',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 28px 64px rgba(0,0,0,0.65)',
              }}
            >
              <div className="p-3 space-y-0.5">

                {/* Products accordion */}
                <div>
                  <button
                    onClick={() => setMobileProdOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/4 transition-all"
                  >
                    Products
                    <motion.span animate={{ rotate: mobileProdOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 320 }}>
                      <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {mobileProdOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="mx-2 mb-1">
                          <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/20">Commerce &amp; Growth</p>
                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-0.5">
                            {mobileProducts.business.map(item => {
                              const Icon = item.icon
                              return (
                                <Link key={item.href} to={item.href}
                                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/4 transition-all group">
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                                    <Icon className={`w-3 h-3 ${item.color}`} />
                                  </div>
                                  <span className="text-[12px] font-medium text-white/55 group-hover:text-white transition-colors truncate">{item.label}</span>
                                </Link>
                              )
                            })}
                          </div>
                          <p className="px-3 py-1.5 mt-1 text-[10px] font-black uppercase tracking-widest text-white/20">Social &amp; Love</p>
                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-0.5">
                            {mobileProducts.social.map(item => {
                              const Icon = item.icon
                              return (
                                <Link key={item.href} to={item.href}
                                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/4 transition-all group">
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                                    <Icon className={`w-3 h-3 ${item.color}`} />
                                  </div>
                                  <span className="text-[12px] font-medium text-white/55 group-hover:text-white transition-colors truncate">{item.label}</span>
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Company accordion */}
                <div>
                  <button
                    onClick={() => setMobileCompOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/4 transition-all"
                  >
                    Company
                    <motion.span animate={{ rotate: mobileCompOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 320 }}>
                      <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {mobileCompOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-0.5 mx-2 mb-1">
                          {company.map(item => {
                            const Icon = item.icon
                            return (
                              <Link key={item.href} to={item.href}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/4 transition-all group">
                                <Icon className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 flex-shrink-0" />
                                <span className="text-[12px] font-medium text-white/55 group-hover:text-white transition-colors truncate">{item.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Standalone links */}
                <div className="grid grid-cols-2 gap-0.5">
                  {[
                    { label: 'Home',        href: '/'            },
                    { label: 'World Stage', href: '/world-stage' },
                    { label: 'Pricing',     href: '/pricing'     },
                    { label: 'Blog',        href: '/blog'        },
                  ].map(link => (
                    <Link key={link.href} to={link.href}
                      className={`px-3 py-2.5 rounded-xl text-center text-[12px] font-medium transition-all ${
                        isActive(link.href) ? 'text-white bg-white/6' : 'text-white/50 hover:text-white hover:bg-white/4'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="h-px bg-white/6 mx-2 my-1" />

                {/* Auth */}
                <div className="flex gap-2 px-1 pb-1 pt-0.5">
                  <Link to={isSignedIn ? dashboardHref : '/login'}
                    className="flex-1 py-2.5 rounded-xl text-center text-[13px] font-semibold text-white transition-all"
                    style={isSignedIn
                      ? { background: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)', boxShadow: '0 0 0 1px rgba(234,179,8,0.35), 0 2px 12px rgba(234,179,8,0.20)' }
                      : { background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', border: '1px solid #EC4899', boxShadow: '0 0 0 1px rgba(236,72,153,0.25), 0 2px 12px rgba(22,163,74,0.20)' }}>
                    {isSignedIn ? 'Dashboard' : 'Sign in'}
                  </Link>
                  {!isSignedIn && (
                    <Link to="/register"
                      className="flex-1 py-2.5 rounded-xl text-center text-[13px] font-semibold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, #EC4899 0%, #9B5DE5 100%)' }}>
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
