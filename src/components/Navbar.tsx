import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun, Moon, Menu, X, ChevronDown,
  Tv, ShoppingBag, Car, Package, Megaphone,
  Heart, Users, MessageCircle, Zap, GraduationCap,
  Globe, Users2, FileText, Info, HelpCircle,
} from 'lucide-react'
const defaultLogoImg = '/logo.png'
import { useTheme } from '@/contexts/ThemeContext'
import { openTawkChat } from '@/lib/tawk'
import { useAuth } from '@/hooks/useAuth'
import { useSiteConfig, SITE_IMAGE_KEYS } from '@/contexts/SiteConfigContext'
import { useServices } from '@/hooks/useServices'
import BrandName from '@/components/BrandName'

/* ─────────────────────── Nav data ─────────────────────────────────────── */
const FALLBACK_PRODUCTS = {
  business: [
    { label: 'SmartzMarket',   href: '/smartzmarket',   icon: ShoppingBag,   color: 'text-amber-400',   bg: 'bg-amber-500/10',   desc: 'Buy & sell anything'         },
    { label: 'SmartzRide',     href: '/smartzride',     icon: Car,           color: 'text-emerald-400', bg: 'bg-emerald-500/10', desc: 'Ride-hailing across Africa'  },
    { label: 'SmartzDelivery', href: '/smartzdelivery', icon: Package,       color: 'text-sky-400',     bg: 'bg-sky-500/10',     desc: 'Fast local delivery'         },
    { label: 'SmartzAds',      href: '/smartzads',      icon: Megaphone,     color: 'text-rose-400',    bg: 'bg-rose-500/10',    desc: 'Advertise to millions'       },
    { label: 'SmartzLearning', href: '/smartzlearning', icon: GraduationCap, color: 'text-teal-400',    bg: 'bg-teal-500/10',    desc: 'Courses & skills'            },
    { label: 'SmartzTV',       href: '/smartztv',       icon: Tv,            color: 'text-purple-400',  bg: 'bg-purple-500/10',  desc: 'Live streams & creators'     },
  ],
  social: [
    { label: 'SmartzSocial',   href: '/smartzsocial',   icon: Users,         color: 'text-violet-400',  bg: 'bg-violet-500/10',  desc: 'Your social feed'            },
    { label: 'SmartzDating',   href: '/app/discover',   icon: Heart,         color: 'text-pink-400',    bg: 'bg-pink-500/10',    desc: 'Match & connect'             },
  ],
}

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

const COMMERCE_SLUGS = ['smartzmarket','smartzride','smartzdelivery','smartzads','smartzlearning','smartztv']

const COMPANY_ITEMS = [
  { label: 'About Us',    href: '/about',       icon: Info,    desc: 'Our story & mission'    },
  { label: 'Our Team',    href: '/team',         icon: Users2,  desc: 'Meet the people behind' },
  { label: 'Blog',        href: '/blog',         icon: FileText,desc: 'Stories & updates'      },
  { label: 'World Stage', href: '/world-stage',  icon: Globe,   desc: 'Global community hub'   },
]

/* ──────────────── Desktop Products mega-menu ──────────────────────────── */
function ProductsDrop({ onClose }: { onClose: () => void }) {
  const { services } = useServices()

  let business = FALLBACK_PRODUCTS.business
  let social    = FALLBACK_PRODUCTS.social

  if (services.length > 0) {
    const bi = services.filter(s => COMMERCE_SLUGS.includes(s.slug)).map(s => {
      const st = SERVICE_ICON_MAP[s.slug] || { icon: ShoppingBag, color: 'text-gray-400', bg: 'bg-gray-500/10' }
      return { label: s.name, href: s.route || `/${s.slug}`, icon: st.icon, color: st.color, bg: st.bg, desc: s.description || '' }
    })
    const si = services.filter(s => !COMMERCE_SLUGS.includes(s.slug) && s.slug !== 'world-stage').map(s => {
      const st = SERVICE_ICON_MAP[s.slug] || { icon: Zap, color: 'text-gray-400', bg: 'bg-gray-500/10' }
      return { label: s.name, href: s.route || `/${s.slug}`, icon: st.icon, color: st.color, bg: st.bg, desc: s.description || '' }
    })
    if (bi.length > 0) business = bi
    if (si.length > 0) social   = si
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ type: 'spring', damping: 28, stiffness: 360 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[min(580px,calc(100vw-2rem))] rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(10,7,22,0.98)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 32px 72px rgba(0,0,0,0.65), 0 0 0 0.5px rgba(255,255,255,0.05)',
      }}
    >
      <div className="grid grid-cols-2 p-3 gap-0">
        {/* Commerce column */}
        <div>
          <p className="px-3 pt-2.5 pb-2 text-[10px] font-black uppercase tracking-[0.15em] text-white/25 select-none">
            Commerce &amp; Growth
          </p>
          {business.map(item => {
            const Icon = item.icon
            return (
              <Link key={item.href} to={item.href} onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150
                  hover:bg-white/6 active:bg-white/10 active:scale-[0.98] group cursor-pointer">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg} transition-transform group-hover:scale-105`}>
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white/80 group-hover:text-white transition-colors leading-none mb-0.5">{item.label}</p>
                  <p className="text-[11px] text-white/30 leading-none truncate">{item.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Social column with divider */}
        <div className="relative">
          <div className="absolute left-0 top-4 bottom-4 w-px bg-white/7" />
          <p className="px-3 pt-2.5 pb-2 text-[10px] font-black uppercase tracking-[0.15em] text-white/25 select-none">
            Social &amp; Love
          </p>
          {social.map(item => {
            const Icon = item.icon
            return (
              <Link key={item.href} to={item.href} onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150
                  hover:bg-white/6 active:bg-white/10 active:scale-[0.98] group cursor-pointer">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg} transition-transform group-hover:scale-105`}>
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white/80 group-hover:text-white transition-colors leading-none mb-0.5">{item.label}</p>
                  <p className="text-[11px] text-white/30 leading-none truncate">{item.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

/* ────────────────── Desktop Company dropdown ──────────────────────────── */
function CompanyDrop({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ type: 'spring', damping: 28, stiffness: 360 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-60 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(10,7,22,0.98)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 32px 72px rgba(0,0,0,0.65), 0 0 0 0.5px rgba(255,255,255,0.05)',
      }}
    >
      <div className="p-2">
        {COMPANY_ITEMS.map(item => {
          const Icon = item.icon
          return (
            <Link key={item.href} to={item.href} onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150
                hover:bg-white/6 active:bg-white/10 active:scale-[0.98] group cursor-pointer">
              <div className="w-7 h-7 rounded-lg bg-white/6 flex items-center justify-center flex-shrink-0
                transition-all group-hover:bg-white/10">
                <Icon className="w-3.5 h-3.5 text-white/45 group-hover:text-white/80 transition-colors" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white/80 group-hover:text-white transition-colors leading-none mb-0.5">{item.label}</p>
                <p className="text-[11px] text-white/30 leading-none">{item.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ────────────────── Desktop nav trigger ──────────────────────────────── */
function DropTrigger({ label, open, active, onClick }: { label: string; open: boolean; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-0.5 px-3.5 py-2 min-h-[44px] text-[13.5px] font-medium
        tracking-[-0.01em] rounded-xl transition-all duration-150 cursor-pointer select-none
        active:bg-white/8 ${open || active ? 'text-white' : 'text-white/50 hover:text-white/85'}`}
    >
      {label}
      <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: 'spring', stiffness: 360, damping: 28 }}>
        <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
      </motion.span>
      {(open || active) && (
        <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-white/6 -z-10"
          transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
      )}
    </button>
  )
}

/* ────────────────── Desktop static nav link ─────────────────────────── */
function NavLink({ to, children, active }: { to: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link
      to={to}
      className={`relative px-3.5 py-2 min-h-[44px] inline-flex items-center text-[13.5px] font-medium
        tracking-[-0.01em] rounded-xl transition-all duration-150 cursor-pointer select-none
        active:bg-white/8 ${active ? 'text-white' : 'text-white/50 hover:text-white/85'}`}
    >
      {children}
      {active && (
        <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-white/6 -z-10"
          transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
      )}
    </Link>
  )
}

/* ══════════════════ Main Navbar ══════════════════════════════════════════ */
export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const siteConfig = useSiteConfig()
  const { session, isAdmin } = useAuth()
  const isSignedIn = !!session
  const dashboardHref = isAdmin ? '/admin' : '/app/feed'
  const location = useLocation()

  const [scrolled, setScrolled]             = useState(false)
  const [mobileOpen, setMobileOpen]         = useState(false)
  const [productsOpen, setProductsOpen]     = useState(false)
  const [companyOpen, setCompanyOpen]       = useState(false)
  const [mobileProdOpen, setMobileProdOpen] = useState(false)
  const [mobileCompOpen, setMobileCompOpen] = useState(false)

  const prodRef    = useRef<HTMLDivElement>(null)
  const companyRef = useRef<HTMLDivElement>(null)

  /* scroll listener */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* close dropdowns on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (prodRef.current    && !prodRef.current.contains(e.target as Node))    setProductsOpen(false)
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) setCompanyOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* close mobile drawer on route change */
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)

  const { services: navServices } = useServices()

  const mobileProducts = (() => {
    if (navServices.length === 0) return FALLBACK_PRODUCTS
    const bi = navServices.filter(s => COMMERCE_SLUGS.includes(s.slug)).map(s => {
      const st = SERVICE_ICON_MAP[s.slug] || { icon: ShoppingBag, color: 'text-gray-400', bg: 'bg-gray-500/10' }
      return { label: s.name, href: s.route || `/${s.slug}`, icon: st.icon, color: st.color, bg: st.bg, desc: s.description || '' }
    })
    const si = navServices.filter(s => !COMMERCE_SLUGS.includes(s.slug) && s.slug !== 'world-stage').map(s => {
      const st = SERVICE_ICON_MAP[s.slug] || { icon: Zap, color: 'text-gray-400', bg: 'bg-gray-500/10' }
      return { label: s.name, href: s.route || `/${s.slug}`, icon: st.icon, color: st.color, bg: st.bg, desc: s.description || '' }
    })
    return {
      business: bi.length > 0 ? bi : FALLBACK_PRODUCTS.business,
      social:   si.length > 0 ? si : FALLBACK_PRODUCTS.social,
    }
  })()

  const allProductLinks = [...mobileProducts.business, ...mobileProducts.social]
  const prodActive = allProductLinks.some(i => isActive(i.href))
  const compActive = COMPANY_ITEMS.some(i => isActive(i.href))

  /* ── Shared bar style ── */
  const barStyle: React.CSSProperties = {
    background:            scrolled ? 'rgba(8,6,18,0.97)' : 'rgba(8,6,18,0.82)',
    backdropFilter:        'blur(32px)',
    WebkitBackdropFilter:  'blur(32px)',
    border:                scrolled ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.08)',
    boxShadow:             scrolled
      ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 56px rgba(0,0,0,0.55)'
      : 'inset 0 1px 0 rgba(255,255,255,0.04)',
    transition:            'background 0.25s, border-color 0.25s, box-shadow 0.25s',
  }

  return (
    <>
      {/* ══════════════ Navbar bar ══════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center px-3 pt-2.5 sm:pt-3 md:px-0 md:pt-0">
        <motion.div
          initial={{ y: -32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 24, delay: 0.05 }}
          className="w-full max-w-6xl md:max-w-none"
        >
          <div
            className="flex items-center justify-between h-[54px] sm:h-[58px] px-3 sm:px-5 md:px-6 rounded-2xl md:rounded-none"
            style={barStyle}
          >
            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 min-h-[44px]
              group active:opacity-80 transition-opacity cursor-pointer">
              <motion.img
                src={siteConfig.get(SITE_IMAGE_KEYS.logo, defaultLogoImg)} alt="SmartzConnect"
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                className="h-7 sm:h-[30px] w-auto object-contain"
              />
              <span className="hidden xs:block font-display font-black text-[15px] tracking-tight leading-none text-white">
                <BrandName />
              </span>
            </Link>

            {/* ── Desktop center nav (lg+) ── */}
            <div className="hidden lg:flex items-center gap-0 absolute left-1/2 -translate-x-1/2">
              <NavLink to="/" active={isActive('/')}>Home</NavLink>

              <div ref={prodRef} className="relative">
                <DropTrigger label="Products" open={productsOpen} active={prodActive}
                  onClick={() => { setProductsOpen(v => !v); setCompanyOpen(false) }} />
                <AnimatePresence>
                  {productsOpen && <ProductsDrop onClose={() => setProductsOpen(false)} />}
                </AnimatePresence>
              </div>

              <div ref={companyRef} className="relative">
                <DropTrigger label="Company" open={companyOpen} active={compActive}
                  onClick={() => { setCompanyOpen(v => !v); setProductsOpen(false) }} />
                <AnimatePresence>
                  {companyOpen && <CompanyDrop onClose={() => setCompanyOpen(false)} />}
                </AnimatePresence>
              </div>

              <NavLink to="/world-stage" active={isActive('/world-stage')}>World Stage</NavLink>
              <NavLink to="/pricing"     active={isActive('/pricing')}>Pricing</NavLink>
              <NavLink to="/blog"        active={isActive('/blog')}>Blog</NavLink>
            </div>

            {/* ── Tablet center links (md–lg) — condensed, no mega-menu ── */}
            <div className="hidden md:flex lg:hidden items-center gap-0 ml-2">
              {[
                { label: 'Home',    href: '/'            },
                { label: 'Pricing', href: '/pricing'     },
                { label: 'Blog',    href: '/blog'        },
              ].map(l => (
                <Link key={l.href} to={l.href}
                  className={`px-3 py-2 min-h-[44px] inline-flex items-center rounded-xl text-[13px] font-medium
                    transition-colors duration-150 cursor-pointer active:bg-white/8 select-none
                    ${isActive(l.href) ? 'text-white bg-white/6' : 'text-white/50 hover:text-white/80'}`}>
                  {l.label}
                </Link>
              ))}
            </div>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-1 sm:gap-1.5">

              {/* Theme toggle */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
                className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center
                  text-white/35 hover:text-white/70 active:bg-white/8 transition-colors duration-150 cursor-pointer"
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-[17px] h-[17px]" /> : <Moon className="w-[17px] h-[17px]" />}
              </motion.button>

              {/* Live support */}
              <motion.button
                onClick={() => openTawkChat()}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
                title="Live support"
                aria-label="Open live support chat"
                className="flex w-9 h-9 rounded-xl items-center justify-center
                  text-white/35 hover:text-white/70 active:bg-white/8 transition-colors duration-150 cursor-pointer"
              >
                <MessageCircle className="w-[18px] h-[18px]" />
              </motion.button>

              {/* Divider */}
              <div className="hidden sm:block w-px h-4 bg-white/10 mx-0.5" />

              {/* Auth — desktop / tablet */}
              <div className="hidden sm:flex items-center gap-1.5">
                {isSignedIn ? (
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                    <Link to={dashboardHref}
                      className="inline-flex items-center px-4 py-[8px] min-h-[40px] rounded-xl text-[13px] font-semibold text-white
                        transition-opacity hover:opacity-90 active:opacity-75 cursor-pointer"
                      style={{ background: 'linear-gradient(135deg,#EAB308,#CA8A04)', boxShadow: '0 0 0 1px rgba(234,179,8,0.35),0 2px 12px rgba(234,179,8,0.20)' }}>
                      Dashboard
                    </Link>
                  </motion.div>
                ) : (
                  <>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                      <Link to="/login"
                        className="inline-flex items-center px-4 py-[8px] min-h-[40px] rounded-xl text-[13px] font-semibold text-white
                          transition-opacity hover:opacity-90 active:opacity-75 cursor-pointer"
                        style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 0 0 1px rgba(22,163,74,0.35),0 2px 12px rgba(22,163,74,0.20)' }}>
                        Sign in
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                      <Link to="/register"
                        className="inline-flex items-center px-4 py-[8px] min-h-[40px] rounded-xl text-[13px] font-semibold text-white
                          transition-opacity hover:opacity-90 active:opacity-75 cursor-pointer"
                        style={{ background: 'linear-gradient(135deg,#EC4899,#9B5DE5)', boxShadow: '0 0 0 1px rgba(236,72,153,0.30),0 2px 12px rgba(236,72,153,0.20)' }}>
                        Get started
                      </Link>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Hamburger — shown below lg (full) and below md on tablet for full menu */}
              <motion.button
                onClick={() => setMobileOpen(v => !v)}
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.90 }}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                className="lg:hidden w-[42px] h-[42px] rounded-xl flex items-center justify-center
                  text-white/60 hover:text-white active:bg-white/8 transition-colors duration-150
                  cursor-pointer ml-0.5"
                style={{ border: '1px solid rgba(255,255,255,0.11)' }}
              >
                <AnimatePresence mode="wait">
                  {mobileOpen
                    ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.14 }}>
                        <X className="w-5 h-5" />
                      </motion.span>
                    : <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.14 }}>
                        <Menu className="w-5 h-5" />
                      </motion.span>
                  }
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </nav>

      {/* ══════════════ Mobile / Tablet drawer (< lg) ══════════════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ opacity: 0, y: -18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed left-3 right-3 z-50 lg:hidden rounded-2xl overflow-hidden"
              style={{
                top: 'calc(54px + 10px)',
                maxHeight: 'calc(100dvh - 80px)',
                overflowY: 'auto',
                background: 'rgba(8,6,18,0.99)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                border: '1px solid rgba(255,255,255,0.11)',
                boxShadow: '0 32px 72px rgba(0,0,0,0.7)',
              }}
            >
              <div className="p-2 space-y-0.5">

                {/* ── Products accordion ── */}
                <div>
                  <button
                    onClick={() => setMobileProdOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 min-h-[52px] rounded-xl
                      text-[14px] font-semibold text-white/65 hover:text-white
                      hover:bg-white/4 active:bg-white/8 transition-all duration-150 cursor-pointer"
                  >
                    <span>Products</span>
                    <motion.span animate={{ rotate: mobileProdOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 340 }}>
                      <ChevronDown className="w-4 h-4 text-white/30" />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {mobileProdOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-1 pb-1.5">
                          {/* Commerce */}
                          <p className="px-3 pt-2 pb-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-white/22 select-none">
                            Commerce &amp; Growth
                          </p>
                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-0.5">
                            {mobileProducts.business.map(item => {
                              const Icon = item.icon
                              return (
                                <Link key={item.href} to={item.href}
                                  className="flex items-center gap-3 px-3 min-h-[52px] rounded-xl
                                    hover:bg-white/4 active:bg-white/8 active:scale-[0.98]
                                    transition-all duration-150 group cursor-pointer">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-white/70 group-hover:text-white transition-colors leading-none mb-0.5 truncate">{item.label}</p>
                                    <p className="text-[11px] text-white/30 leading-none truncate hidden xs:block">{item.desc}</p>
                                  </div>
                                </Link>
                              )
                            })}
                          </div>

                          {/* Social */}
                          <p className="px-3 pt-3 pb-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-white/22 select-none">
                            Social &amp; Love
                          </p>
                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-0.5">
                            {mobileProducts.social.map(item => {
                              const Icon = item.icon
                              return (
                                <Link key={item.href} to={item.href}
                                  className="flex items-center gap-3 px-3 min-h-[52px] rounded-xl
                                    hover:bg-white/4 active:bg-white/8 active:scale-[0.98]
                                    transition-all duration-150 group cursor-pointer">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-white/70 group-hover:text-white transition-colors leading-none mb-0.5 truncate">{item.label}</p>
                                    <p className="text-[11px] text-white/30 leading-none truncate hidden xs:block">{item.desc}</p>
                                  </div>
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Company accordion ── */}
                <div>
                  <button
                    onClick={() => setMobileCompOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 min-h-[52px] rounded-xl
                      text-[14px] font-semibold text-white/65 hover:text-white
                      hover:bg-white/4 active:bg-white/8 transition-all duration-150 cursor-pointer"
                  >
                    <span>Company</span>
                    <motion.span animate={{ rotate: mobileCompOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 340 }}>
                      <ChevronDown className="w-4 h-4 text-white/30" />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {mobileCompOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-1 pb-1.5 grid grid-cols-1 xs:grid-cols-2 gap-0.5">
                          {COMPANY_ITEMS.map(item => {
                            const Icon = item.icon
                            return (
                              <Link key={item.href} to={item.href}
                                className="flex items-center gap-3 px-3 min-h-[52px] rounded-xl
                                  hover:bg-white/4 active:bg-white/8 active:scale-[0.98]
                                  transition-all duration-150 group cursor-pointer">
                                <div className="w-7 h-7 rounded-lg bg-white/6 flex items-center justify-center flex-shrink-0
                                  group-hover:bg-white/10 transition-colors">
                                  <Icon className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70 transition-colors" />
                                </div>
                                <div>
                                  <p className="text-[13px] font-semibold text-white/70 group-hover:text-white transition-colors leading-none mb-0.5">{item.label}</p>
                                  <p className="text-[11px] text-white/30 leading-none">{item.desc}</p>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Standalone links (2-col grid) ── */}
                <div className="grid grid-cols-2 gap-0.5 pt-0.5">
                  {[
                    { label: 'Home',        href: '/',            icon: null },
                    { label: 'World Stage', href: '/world-stage', icon: null },
                    { label: 'Pricing',     href: '/pricing',     icon: null },
                    { label: 'Blog',        href: '/blog',        icon: null },
                    { label: 'Help',        href: '/help',        icon: null },
                  ].map(link => (
                    <Link key={link.href} to={link.href}
                      className={`flex items-center justify-center px-3 min-h-[48px] rounded-xl
                        text-[13px] font-semibold transition-all duration-150 cursor-pointer
                        active:scale-[0.97] select-none
                        ${isActive(link.href)
                          ? 'text-white bg-white/8'
                          : 'text-white/55 hover:text-white hover:bg-white/4 active:bg-white/8'}`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {/* Live support */}
                  <button
                    onClick={() => { openTawkChat(); setMobileOpen(false) }}
                    className="flex items-center justify-center gap-2 px-3 min-h-[48px] rounded-xl
                      text-[13px] font-semibold text-white/55 hover:text-white hover:bg-white/4
                      active:bg-white/8 active:scale-[0.97] transition-all duration-150 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Support
                  </button>
                </div>

                {/* ── Divider ── */}
                <div className="h-px bg-white/7 mx-2 my-1" />

                {/* ── Auth buttons ── */}
                <div className="flex flex-col xs:flex-row gap-2 px-1 pb-1.5 pt-0.5">
                  <Link
                    to={isSignedIn ? dashboardHref : '/login'}
                    className="flex-1 flex items-center justify-center min-h-[50px] rounded-xl
                      text-[14px] font-bold text-white transition-opacity
                      hover:opacity-90 active:opacity-70 active:scale-[0.98] cursor-pointer"
                    style={isSignedIn
                      ? { background: 'linear-gradient(135deg,#EAB308,#CA8A04)', boxShadow: '0 2px 16px rgba(234,179,8,0.25)' }
                      : { background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 2px 16px rgba(22,163,74,0.25)' }}
                  >
                    {isSignedIn ? 'Dashboard' : 'Sign in'}
                  </Link>
                  {!isSignedIn && (
                    <Link to="/register"
                      className="flex-1 flex items-center justify-center min-h-[50px] rounded-xl
                        text-[14px] font-bold text-white transition-opacity
                        hover:opacity-90 active:opacity-70 active:scale-[0.98] cursor-pointer"
                      style={{ background: 'linear-gradient(135deg,#EC4899,#9B5DE5)', boxShadow: '0 2px 16px rgba(236,72,153,0.25)' }}
                    >
                      Get started
                    </Link>
                  )}
                  {/* Theme toggle inline on mobile */}
                  <button
                    onClick={toggleTheme}
                    className="sm:hidden w-[50px] h-[50px] rounded-xl flex items-center justify-center flex-shrink-0
                      text-white/50 bg-white/5 border border-white/8 hover:text-white
                      active:bg-white/10 active:scale-[0.96] transition-all cursor-pointer"
                    aria-label="Toggle theme"
                  >
                    {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
