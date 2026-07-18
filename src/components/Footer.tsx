import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Shield, Zap, Globe, MessageCircle, Send, Check } from 'lucide-react'
import { useSiteConfig, SITE_IMAGE_KEYS } from '@/contexts/SiteConfigContext'
import { openTawkChat } from '@/lib/tawk'
import { useServices } from '@/hooks/useServices'
import { supabase } from '@/lib/supabase'
import BrandName from '@/components/BrandName'
const defaultLogoImg = '/logo.png'

/* ── Newsletter signup ─────────────────────────────────────────────── */
function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError('Enter a valid email address')
      return
    }
    setStatus('submitting')
    setError('')
    const { error: insertErr } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: trimmed.toLowerCase(), source: 'footer', is_active: true })
    if (insertErr) {
      if (insertErr.code === '23505') { setStatus('done'); setEmail(''); return }
      setStatus('error')
      setError(insertErr.message || 'Something went wrong. Please try again.')
      return
    }
    setStatus('done')
    setEmail('')
  }

  if (status === 'done') {
    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
        <Check className="w-4 h-4 flex-shrink-0" />
        You're subscribed! Watch your inbox.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="you@email.com"
          disabled={status === 'submitting'}
          className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white/8 border border-white/12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-pink transition-colors"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-love-gradient flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-60"
          title="Subscribe"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      <Link to="/subscribe" className="text-[11px] text-white/40 hover:text-brand-pink transition-colors self-start">
        Manage email preferences →
      </Link>
    </form>
  )
}

/* ── Hardcoded fallback product links ────────────────────────────────── */
const FALLBACK_PRODUCTS: { label: string; href: string }[] = [
  { label: 'SmartzDating',    href: '/app/discover'   },
  { label: 'SmartzSocial',    href: '/smartzsocial'   },
  { label: 'SmartzTV',        href: '/smartztv'       },
  { label: 'SmartzMarket',    href: '/smartzmarket'   },
  { label: 'SmartzRide',      href: '/smartzride'     },
  { label: 'SmartzDelivery',  href: '/smartzdelivery' },
  { label: 'SmartzAds',       href: '/smartzads'      },
]

type NavLink =
  | { label: string; href: string }
  | { label: string; action: 'tawk' }

const COMPANY_LINKS: NavLink[] = [
  { label: 'About Us',         href: '/about'          },
  { label: 'Our Team',         href: '/team'           },
  { label: 'Blog',             href: '/blog'           },
  { label: 'World Stage',      href: '/world-stage'    },
  { label: 'Pricing',          href: '/pricing'        },
]

const SUPPORT_LINKS: NavLink[] = [
  { label: 'Help & Support',   href: '/help'           },
  { label: 'Live Support',     action: 'tawk'          },
  { label: 'Privacy Policy',   href: '/privacy'        },
  { label: 'Terms of Service', href: '/terms'          },
  { label: 'Cookie Policy',    href: '/cookie-policy'  },
]

/* ── AnimateIn wrapper ───────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function LinkList({ links }: { links: NavLink[] }) {
  return (
    <ul className="space-y-2.5">
      {links.map(link => (
        <li key={link.label}>
          {'action' in link && link.action === 'tawk' ? (
            <button onClick={() => openTawkChat()} className="text-[13px] text-white/50 hover:text-white/90 transition-colors text-left">
              {link.label}
            </button>
          ) : (
            <Link to={'href' in link ? link.href : '#'} className="text-[13px] text-white/50 hover:text-white/90 transition-colors">
              {link.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
}

export default function Footer() {
  const siteConfig = useSiteConfig()
  const { services } = useServices()

  const productLinks: NavLink[] = services.length > 0
    ? services
        .filter(s => s.slug !== 'world-stage')
        .map(s => ({ label: s.name, href: s.route || `/${s.slug}` }))
    : FALLBACK_PRODUCTS

  return (
    <footer className="relative text-white overflow-hidden">

      {/* ── Transparent glass layer — sits over whatever section precedes the footer ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(3,0,10,0.55) 0%, rgba(0,0,0,0.82) 55%, rgba(0,0,0,0.96) 100%)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      />

      {/* Top gradient border */}
      <div className="relative h-px bg-gradient-to-r from-transparent via-pink-500/40 to-transparent" />

      {/* ── Ambient pink glow — decorative only ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-48 rounded-full bg-pink-500/6 blur-3xl pointer-events-none" />

      {/* ── Main links ─────────────────────────────────────────────────── */}
      <div className="relative max-w-5xl mx-auto px-6 py-12 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-8 sm:gap-6">

          {/* Brand column */}
          <FadeUp className="sm:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5 group">
              <img
                src={siteConfig.get(SITE_IMAGE_KEYS.logo, defaultLogoImg)}
                alt="SmartzConnect"
                className="h-[38px] w-auto object-contain group-hover:scale-105 transition-transform"
              />
              <span className="font-display font-black text-lg text-white">
                <BrandName />
              </span>
            </Link>
            <p className="text-[13px] text-white/55 leading-relaxed mb-5 max-w-[200px]">
              Africa's premier super-app — connecting communities across the continent and beyond.
            </p>
            {/* WhatsApp */}
            <a
              href="https://wa.me/231776679963"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-all"
              style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)' }}
            >
              <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
              +231 776 679 963
            </a>
          </FadeUp>

          {/* Products column */}
          <FadeUp delay={0.06}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-pink-400/70 mb-4">Products</p>
              <LinkList links={productLinks} />
            </div>
          </FadeUp>

          {/* Company column */}
          <FadeUp delay={0.12}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-pink-400/70 mb-4">Company</p>
              <LinkList links={COMPANY_LINKS} />
            </div>
          </FadeUp>

          {/* Support column */}
          <FadeUp delay={0.18}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-pink-400/70 mb-4">Support</p>
              <LinkList links={SUPPORT_LINKS} />
            </div>
          </FadeUp>
        </div>

        {/* ── Newsletter signup ── */}
        <FadeUp delay={0.22} className="mt-10 pt-8 border-t border-white/8 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
          <div className="sm:max-w-[260px]">
            <p className="text-sm font-bold text-white mb-1">Stay in the loop</p>
            <p className="text-[12px] text-white/45 leading-relaxed">Product news and updates, straight to your inbox. No spam.</p>
          </div>
          <div className="sm:flex-1 sm:max-w-xs">
            <NewsletterSignup />
          </div>
        </FadeUp>

        {/* ── Bottom bar ── */}
        <div className="mt-12 pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-white/35 text-center sm:text-left">
            © {new Date().getFullYear()} SmartzConnect Inc. All rights reserved.
            {' '}Made with <Heart className="w-3 h-3 text-pink-500/80 inline mx-0.5" /> in Liberia 🇱🇷
          </p>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-[11px] text-white/35">
              <Shield className="w-3 h-3 text-emerald-400/70" /> SSL Secured
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/35">
              <Zap className="w-3 h-3 text-amber-400/70" /> 99.8% Uptime
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/35">
              <Globe className="w-3 h-3 text-blue-400/70" /> GDPR
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
