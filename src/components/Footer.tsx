import { Link } from 'react-router-dom'
import { Heart, Globe, Shield, Zap, MessageCircle, ExternalLink } from 'lucide-react'
const logoImg = '/logo.png'

const footerLinks = {
  Platform: [
    { label: 'Discover & Match',  href: '/app/discover' },
    { label: 'Spin & Chat',       href: '/app/spin' },
    { label: 'Group Chats',       href: '/app/groups' },
    { label: 'Social Feed',       href: '/app/feed' },
    { label: 'SmartzTV',          href: '/smartztv' },
    { label: 'Marketplace',       href: '/smartzmarket' },
    { label: 'SmartzRide',        href: '/smartzride' },
    { label: 'SmartzDelivery',    href: '/smartzdelivery' },
  ],
  Company: [
    { label: 'About Us',          href: '/about' },
    { label: 'Our Team',          href: '/team' },
    { label: 'Blog',              href: '/blog' },
    { label: 'World Stage',       href: '/world-stage' },
    { label: 'Careers',           href: '/about#careers' },
    { label: 'Press Kit',         href: '/about#press' },
    { label: 'Investors',         href: '/about#investors' },
  ],
  Support: [
    { label: 'Help Center',       href: '#' },
    { label: 'Safety Center',     href: '#' },
    { label: 'Community Rules',   href: '#' },
    { label: 'Report a Problem',  href: '#' },
    { label: 'WhatsApp Support',  href: 'https://wa.me/231776679963', external: true },
    { label: 'Contact Us',        href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy',    href: '/privacy' },
    { label: 'Terms of Service',  href: '/terms' },
    { label: 'Cookie Policy',     href: '/cookie-policy' },
    { label: 'GDPR',              href: '/privacy#gdpr' },
    { label: 'Accessibility',     href: '/about#accessibility' },
  ],
}

const stats = [
  { value: '2M+',   label: 'Active Users' },
  { value: '47',    label: 'Countries' },
  { value: '500K+', label: 'Matches Made' },
  { value: '4.9★',  label: 'App Rating' },
]

const socials = [
  { label: 'WhatsApp', emoji: '💬', href: 'https://wa.me/231776679963' },
  { label: 'TikTok',   emoji: '🎵', href: '#' },
  { label: 'Instagram',emoji: '📸', href: '#' },
  { label: 'Twitter',  emoji: '🐦', href: '#' },
  { label: 'YouTube',  emoji: '▶️', href: '#' },
  { label: 'Facebook', emoji: '👥', href: '#' },
]

const countries = ['🇱🇷 Liberia', '🇸🇱 Sierra Leone', '🇬🇭 Ghana', '🇳🇬 Nigeria', '🇸🇳 Senegal', '🇨🇮 Côte d\'Ivoire', '🇬🇳 Guinea', '🇰🇪 Kenya', '🇿🇦 South Africa', '🇪🇹 Ethiopia']

export default function Footer() {
  return (
    <footer className="dark:bg-[#080510] bg-gray-900 text-white relative overflow-hidden">
      <div className="h-px bg-gradient-to-r from-transparent via-pink-500/40 to-transparent" />

      {/* Stats bar */}
      <div className="dark:bg-[#0D0A14] bg-gray-800 border-b dark:border-white/5 border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
            {stats.map(s => (
              <div key={s.label}>
                <p className="font-display font-black text-lg sm:text-2xl text-gradient-love">{s.value}</p>
                <p className="text-[11px] sm:text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        {/* Responsive grid: 2-col mobile → 4-col tablet → 6-col desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8 lg:gap-8">

          {/* Brand column — full width on mobile/tablet */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2 mb-2 lg:mb-0">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <img src={logoImg} alt="SmartzConnect" className="h-9 w-auto object-contain group-hover:scale-105 transition-transform drop-shadow-lg" />
              <span className="font-display font-bold text-lg sm:text-xl">
                <span className="text-gradient-love">Smartz</span>
                <span className="text-white">Connect</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-4 max-w-xs">
              Africa's #1 super-app for love, live streaming, marketplace, and ride-hailing. Connecting millions of people across 47 countries.
            </p>

            {/* Social links */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5">
              {socials.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] sm:text-xs font-semibold text-gray-300 hover:text-white transition-all border border-white/5 hover:border-white/15">
                  <span>{s.emoji}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </a>
              ))}
            </div>

            {/* WhatsApp CTA */}
            <a href="https://wa.me/231776679963" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs sm:text-sm font-semibold hover:bg-emerald-500/25 transition-all">
              <MessageCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
              +231 776 679 963 · 24/7 Support
            </a>
          </div>

          {/* Link columns — 2-col on mobile, 4-col on tablet, each 1 col on desktop */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-brand-pink mb-3 sm:mb-4">{section}</h4>
              <ul className="space-y-2 sm:space-y-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    {'external' in link && link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 group">
                        {link.label} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      <Link to={link.href} className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Countries */}
        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-white/5">
          <p className="text-[10px] sm:text-xs font-bold text-gray-500 mb-2 sm:mb-3 flex items-center gap-2">
            <Globe className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Available in
          </p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {countries.map(c => (
              <span key={c} className="text-[10px] sm:text-xs text-gray-500 bg-white/3 px-2 py-0.5 sm:py-1 rounded-lg border border-white/5">{c}</span>
            ))}
            <span className="text-[10px] sm:text-xs text-gray-500 bg-white/3 px-2 py-0.5 sm:py-1 rounded-lg border border-white/5">+37 more</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-[10px] sm:text-xs text-gray-500 text-center sm:text-left">
            © {new Date().getFullYear()} SmartzConnect Inc. All rights reserved. Made with <Heart className="w-3 h-3 text-brand-pink inline" /> in Liberia 🇱🇷
          </p>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-gray-500">
              <Shield className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-500" /> SSL Secured
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-gray-500">
              <Zap className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-500" /> 99.8% Uptime
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-gray-500">
              <Globe className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-blue-400" /> GDPR
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
