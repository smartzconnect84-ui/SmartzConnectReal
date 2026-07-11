import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Shield, Zap, Globe, MessageCircle, ArrowRight, ExternalLink } from 'lucide-react'
import AnimatedStat from '@/components/AnimatedStat'
const logoImg = '/logo.png'

/* ── Wired & live links only ─────────────────────────────────────────── */
const nav = {
  Products: [
    { label: 'SmartzDating',    href: '/app/discover'   },
    { label: 'SmartzSocial',    href: '/app/feed'       },
    { label: 'SmartzTV',        href: '/smartztv'       },
    { label: 'SmartzMarket',    href: '/smartzmarket'   },
    { label: 'SmartzRide',      href: '/smartzride'     },
    { label: 'SmartzDelivery',  href: '/smartzdelivery' },
    { label: 'SmartzAds',       href: '/smartzads'      },
    { label: 'Spin & Chat',     href: '/app/spin'       },
  ],
  Company: [
    { label: 'About Us',        href: '/about'          },
    { label: 'Our Team',        href: '/team'           },
    { label: 'Blog',            href: '/blog'           },
    { label: 'World Stage',     href: '/world-stage'    },
    { label: 'Pricing',         href: '/pricing'        },
  ],
  Support: [
    { label: 'Help Center',     href: '/app/help'       },
    { label: 'Safety Center',   href: '/privacy#safety' },
    { label: 'Community Rules', href: '/terms#community'},
    { label: 'WhatsApp Support',href: 'https://wa.me/231776679963', external: true },
    { label: 'Report a Problem',href: 'https://wa.me/231776679963?text=Report%20a%20Problem%3A', external: true },
  ],
  Legal: [
    { label: 'Privacy Policy',  href: '/privacy'        },
    { label: 'Terms of Service',href: '/terms'          },
  ],
}

const stats = [
  { value: '15K+', label: 'Active Users', delay: 0   },
  { value: '195+', label: 'Countries',    delay: 100 },
  { value: '8K+',  label: 'Connected',    delay: 200 },
  { value: '1K+',  label: 'Matches',      delay: 300 },
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

export default function Footer() {
  return (
    <footer className="relative bg-[#07050F] text-white overflow-hidden">

      {/* Top gradient border */}
      <div className="h-px bg-gradient-to-r from-transparent via-pink-500/35 to-transparent" />

      {/* ── Stats row ─────────────────────────────────────────────── */}
      <div style={{ background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/5">
            {stats.map(s => (
              <AnimatedStat
                key={s.label}
                value={s.value}
                label={s.label}
                delay={s.delay}
                duration={1800}
                className="py-5 px-4 text-center"
                valueClass="font-display font-black text-xl sm:text-2xl bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent tabular-nums"
                labelClass="text-[11px] text-white/35 mt-0.5 font-medium"
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[200px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(236,72,153,0.07) 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-12 sm:py-16">
          <FadeUp>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-pink-500/70 mb-2">
                  Join the movement
                </p>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-white leading-tight mb-1">
                  One account. Eight products.<br />
                  <span style={{ background: 'linear-gradient(135deg, #EC4899 0%, #9B5DE5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    Infinite connections.
                  </span>
                </h2>
                <p className="text-sm text-white/40 mt-2">Free to join · No credit card · Mobile Money accepted</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link to="/login"
                    className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                    Sign in
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #EC4899 0%, #9B5DE5 100%)',
                      boxShadow: '0 4px 20px rgba(236,72,153,0.28)',
                    }}>
                    Get started free <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>

      {/* ── Border ── */}
      <div className="h-px mx-6 bg-white/5" />

      {/* ── Main links ────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-12 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-8 sm:gap-6">

          {/* Brand column */}
          <FadeUp className="sm:col-span-1">
            <div className="sm:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 mb-5 group">
                <img src={logoImg} alt="SmartzConnect" className="h-8 w-auto object-contain group-hover:scale-105 transition-transform" />
                <span className="font-display font-black text-base">
                  <span style={{ background: 'linear-gradient(135deg, #EC4899 0%, #9B5DE5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Smartz</span>
                  <span className="text-white">Connect</span>
                </span>
              </Link>
              <p className="text-[13px] text-white/35 leading-relaxed mb-5 max-w-[200px]">
                Africa's premier super-app — connecting millions across 195+ countries.
              </p>
              {/* WhatsApp — the only real wired social */}
              <a
                href="https://wa.me/231776679963"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-all"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.16)' }}
              >
                <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                +231 776 679 963
              </a>
            </div>
          </FadeUp>

          {/* Link columns */}
          {Object.entries(nav).map(([section, links], i) => (
            <FadeUp key={section} delay={0.06 * (i + 1)}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-pink-500/60 mb-4">{section}</p>
                <ul className="space-y-2.5">
                  {links.map(link => (
                    <li key={link.label}>
                      {'external' in link && link.external ? (
                        <a
                          href={link.href}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[13px] text-white/35 hover:text-white/70 transition-colors group"
                        >
                          {link.label}
                          <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <Link to={link.href}
                          className="text-[13px] text-white/35 hover:text-white/70 transition-colors">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-12 pt-6 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-white/25 text-center sm:text-left">
            © {new Date().getFullYear()} SmartzConnect Inc. All rights reserved.
            {' '}Made with <Heart className="w-3 h-3 text-pink-500/70 inline mx-0.5" /> in Liberia 🇱🇷
          </p>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-[11px] text-white/25">
              <Shield className="w-3 h-3 text-emerald-500/60" /> SSL Secured
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/25">
              <Zap className="w-3 h-3 text-amber-500/60" /> 99.8% Uptime
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/25">
              <Globe className="w-3 h-3 text-blue-400/60" /> GDPR
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
