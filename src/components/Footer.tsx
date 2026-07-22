import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Shield, Zap, Globe, MessageCircle, Send, Check, ArrowRight } from 'lucide-react'
import { useSiteConfig, SITE_IMAGE_KEYS } from '@/contexts/SiteConfigContext'
import { openTawkChat } from '@/lib/tawk'
import { useServices } from '@/hooks/useServices'
import { supabase } from '@/lib/supabase'
import BrandName from '@/components/BrandName'
const defaultLogoImg = '/logo.png'

/* ─────────────────── Newsletter ──────────────────────────────────────── */
function NewsletterSignup() {
  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [error,  setError]  = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) { setError('Enter a valid email address'); return }
    setStatus('submitting'); setError('')
    const { error: err } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: trimmed.toLowerCase(), source: 'footer', is_active: true })
    if (err) {
      if (err.code === '23505') { setStatus('done'); setEmail(''); return }
      setStatus('error'); setError(err.message || 'Something went wrong. Please try again.'); return
    }
    setStatus('done'); setEmail('')
  }

  if (status === 'done') {
    return (
      <div className="flex items-center gap-2.5 text-sm font-semibold text-emerald-400 py-2">
        <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
          <Check className="w-3.5 h-3.5" />
        </div>
        You're subscribed — watch your inbox!
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <div className="flex gap-2">
        <input
          type="email" value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="your@email.com"
          disabled={status === 'submitting'}
          className="flex-1 min-w-0 px-4 h-11 rounded-xl bg-white/8 border border-white/12
            text-sm text-white placeholder:text-white/30 focus:outline-none
            focus:border-brand-pink transition-colors disabled:opacity-50"
        />
        <button
          type="submit" disabled={status === 'submitting'}
          className="flex-shrink-0 w-11 h-11 rounded-xl bg-love-gradient flex items-center justify-center
            text-white transition-all hover:opacity-90 active:opacity-70 active:scale-95
            disabled:opacity-50 cursor-pointer shadow-lg shadow-pink-500/20"
          title="Subscribe"
        >
          {status === 'submitting'
            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Send className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400 leading-none">{error}</p>}
      <Link to="/subscribe"
        className="inline-flex items-center gap-1 text-[11px] text-white/35 hover:text-brand-pink
          active:text-pink-300 transition-colors min-h-[28px] leading-none">
        Manage preferences <ArrowRight className="w-3 h-3" />
      </Link>
    </form>
  )
}

/* ─────────────────── Fallback product links ──────────────────────────── */
const FALLBACK_PRODUCTS: { label: string; href: string }[] = [
  { label: 'SmartzDating',   href: '/app/discover'   },
  { label: 'SmartzSocial',   href: '/smartzsocial'   },
  { label: 'SmartzTV',       href: '/smartztv'       },
  { label: 'SmartzMarket',   href: '/smartzmarket'   },
  { label: 'SmartzRide',     href: '/smartzride'     },
  { label: 'SmartzDelivery', href: '/smartzdelivery' },
  { label: 'SmartzAds',      href: '/smartzads'      },
  { label: 'SmartzLearning', href: '/smartzlearning' },
]

type FooterLink =
  | { label: string; href: string }
  | { label: string; action: 'tawk' }

const COMPANY_LINKS: FooterLink[] = [
  { label: 'About Us',    href: '/about'       },
  { label: 'Our Team',    href: '/team'        },
  { label: 'Blog',        href: '/blog'        },
  { label: 'World Stage', href: '/world-stage' },
  { label: 'Pricing',     href: '/pricing'     },
]

const SUPPORT_LINKS: FooterLink[] = [
  { label: 'Help & Support',   href: '/help'          },
  { label: 'Live Support',     action: 'tawk'         },
  { label: 'Privacy Policy',   href: '/privacy'       },
  { label: 'Terms of Service', href: '/terms'         },
  { label: 'Cookie Policy',    href: '/cookie-policy' },
]

/* ─────────────────── Scroll-triggered fade-up ────────────────────────── */
function FadeUp({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-48px' }}
      transition={{ duration: 0.52, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─────────────────── Link list with proper touch targets ─────────────── */
function LinkList({ links, title }: { links: FooterLink[]; title: string }) {
  return (
    <div>
      {/* Column heading */}
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-pink-400/60 mb-1 select-none">
        {title}
      </p>
      <ul className="-ml-2">
        {links.map(link => (
          <li key={link.label}>
            {'action' in link && link.action === 'tawk' ? (
              /* Tawk live support — button */
              <button
                onClick={() => openTawkChat()}
                className="w-full text-left flex items-center gap-1 pl-2 pr-1 py-2.5 min-h-[44px]
                  rounded-lg text-[13px] text-white/45 hover:text-white/90
                  active:text-brand-pink active:bg-white/4
                  transition-all duration-150 cursor-pointer leading-none"
              >
                {link.label}
              </button>
            ) : (
              /* Internal link */
              <Link
                to={'href' in link ? link.href : '#'}
                className="flex items-center gap-1 pl-2 pr-1 py-2.5 min-h-[44px]
                  rounded-lg text-[13px] text-white/45 hover:text-white/90
                  active:text-brand-pink active:bg-white/4
                  transition-all duration-150 leading-none"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ══════════════════ Footer ════════════════════════════════════════════════ */
export default function Footer() {
  const siteConfig  = useSiteConfig()
  const { services } = useServices()

  const productLinks: FooterLink[] = services.length > 0
    ? services
        .filter(s => s.slug !== 'world-stage')
        .map(s => ({ label: s.name, href: s.route || `/${s.slug}` }))
    : FALLBACK_PRODUCTS

  return (
    <footer className="relative bg-[#060411] text-white overflow-hidden">

      {/* Top gradient border */}
      <div className="h-px bg-gradient-to-r from-transparent via-pink-500/35 to-transparent" />

      {/* Ambient glow — decorative */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-56 rounded-full
        bg-pink-500/6 blur-3xl pointer-events-none select-none" />

      {/* ══ Main grid ══════════════════════════════════════════════════════ */}
      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 pt-14 pb-10">

        {/*
          Responsive grid:
          Mobile  (< sm  640px): 1 col — brand full-width, then 2-col links below
          Tablet  (sm-lg 640–1024px): 2 + 3 split → brand+products | company+support+newsletter
          Desktop (lg+  1024px+): 5 equal cols
        */}

        {/* ── Brand + WhatsApp ── */}
        <FadeUp className="mb-10 sm:mb-0">
          {/* Desktop: top-left in 5-col grid. Mobile: stacked above link grid */}
          <div className="lg:hidden flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8 mb-10">
            <BrandBlock siteConfig={siteConfig} />
            {/* Tablet newsletter right of brand */}
            <div className="sm:max-w-xs sm:flex-1">
              <p className="text-sm font-bold text-white mb-1">Stay in the loop</p>
              <p className="text-[12px] text-white/40 leading-relaxed mb-3">News & updates, no spam.</p>
              <NewsletterSignup />
            </div>
          </div>
        </FadeUp>

        {/* ── Desktop 5-col grid ── */}
        <div className="hidden lg:grid grid-cols-5 gap-8 xl:gap-10">
          <FadeUp className="col-span-2">
            <BrandBlock siteConfig={siteConfig} />
            {/* Desktop newsletter below brand */}
            <div className="mt-8">
              <p className="text-sm font-bold text-white mb-1">Stay in the loop</p>
              <p className="text-[12px] text-white/40 leading-relaxed mb-3">All news &amp; updates, no spam.</p>
              <NewsletterSignup />
            </div>
          </FadeUp>

          <FadeUp delay={0.07}>
            <LinkList links={productLinks} title="Products" />
          </FadeUp>

          <FadeUp delay={0.13}>
            <LinkList links={COMPANY_LINKS} title="Company" />
          </FadeUp>

          <FadeUp delay={0.19}>
            <LinkList links={SUPPORT_LINKS} title="Support" />
          </FadeUp>
        </div>

        {/* ── Mobile / Tablet 2-col link grid ── */}
        <div className="lg:hidden grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-8">
          <FadeUp delay={0.05}>
            <LinkList links={productLinks} title="Products" />
          </FadeUp>
          <FadeUp delay={0.10}>
            <LinkList links={COMPANY_LINKS} title="Company" />
          </FadeUp>
          <FadeUp delay={0.15} className="col-span-2 sm:col-span-1">
            <LinkList links={SUPPORT_LINKS} title="Support" />
          </FadeUp>
        </div>

        {/* ── Bottom bar ── */}
        <FadeUp delay={0.22}>
          <div className="mt-12 pt-6 border-t border-white/7 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11.5px] text-white/28 text-center sm:text-left leading-relaxed">
              © 2026 SmartzConnect Inc. All rights reserved.{' '}
              <span className="opacity-70">West Africa, Liberia.</span>
            </p>
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex items-center gap-1.5 text-[11px] text-white/28">
                <Shield className="w-3 h-3 text-emerald-400/60 flex-shrink-0" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-white/28">
                <Zap className="w-3 h-3 text-amber-400/60 flex-shrink-0" />
                <span>99.8% Uptime</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-white/28">
                <Globe className="w-3 h-3 text-blue-400/60 flex-shrink-0" />
                <span>GDPR</span>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </footer>
  )
}

/* ─────────────────── Brand block (extracted to avoid duplication) ──────── */
function BrandBlock({ siteConfig }: { siteConfig: ReturnType<typeof useSiteConfig> }) {
  return (
    <div>
      {/* Logo + name */}
      <Link to="/"
        className="inline-flex items-center gap-2.5 mb-5 group min-h-[44px]
          active:opacity-75 transition-opacity cursor-pointer">
        <motion.img
          src={siteConfig.get(SITE_IMAGE_KEYS.logo, defaultLogoImg)}
          alt="SmartzConnect"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 440, damping: 20 }}
          className="h-9 w-auto object-contain"
        />
        <span className="font-display font-black text-lg text-white leading-none">
          <BrandName />
        </span>
      </Link>

      <p className="text-[13px] text-white/48 leading-relaxed mb-6 max-w-[220px]">
        Africa's premier one-stop social platform connecting communities across the continent and beyond.
      </p>

      {/* Contact row */}
      <div className="flex flex-wrap gap-2">
        {/* WhatsApp */}
        <a
          href="https://wa.me/231776679963"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl
            text-xs font-semibold text-emerald-400 hover:text-emerald-300
            active:opacity-70 active:scale-[0.97] transition-all duration-150 cursor-pointer"
          style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)' }}
        >
          <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
          +231 776 679 963
        </a>

        {/* Live support */}
        <button
          onClick={() => openTawkChat()}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl
            text-xs font-semibold text-white/50 hover:text-white/80
            active:opacity-60 active:scale-[0.97] transition-all duration-150 cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          <Heart className="w-3.5 h-3.5 flex-shrink-0 text-pink-400" />
          Live Chat
        </button>
      </div>
    </div>
  )
}
