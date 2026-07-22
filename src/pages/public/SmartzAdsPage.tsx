import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Megaphone, BarChart3, Target, Globe, Users, TrendingUp,
  CheckCircle, ArrowRight, Mail, Play, Layers, Zap,
} from 'lucide-react'
import { useSiteConfig, SITE_IMAGE_KEYS } from '@/contexts/SiteConfigContext'
import { usePublicStats, fmtCount } from '@/hooks/usePublicStats'

const adFormats = [
  {
    icon: Layers, title: 'Banner Ads',
    description: 'Eye-catching display banners placed throughout feeds, discovery pages, and marketplace.',
    placements: ['Feed', 'Discover', 'Marketplace'],
    color: 'from-pink-500 to-rose-600', bg: 'dark:bg-pink-500/10 bg-pink-50', border: 'dark:border-pink-500/20 border-pink-200',
  },
  {
    icon: Play, title: 'Video Ads',
    description: 'Immersive video campaigns on SmartzTV reaching users during their streaming sessions.',
    placements: ['SmartzTV', 'Live Streams'],
    color: 'from-purple-500 to-violet-600', bg: 'dark:bg-purple-500/10 bg-purple-50', border: 'dark:border-purple-500/20 border-purple-200',
  },
  {
    icon: Target, title: 'Sponsored Content',
    description: 'Native content integrations that blend seamlessly with organic posts and stories.',
    placements: ['Feed', 'Stories', 'Profile'],
    color: 'from-fuchsia-500 to-pink-600', bg: 'dark:bg-fuchsia-500/10 bg-fuchsia-50', border: 'dark:border-fuchsia-500/20 border-fuchsia-200',
  },
]

const faqs = [
  { q: 'What is the minimum budget?', a: 'We support campaigns starting from any budget. Contact our team to discuss a plan that works for you.' },
  { q: 'How do I track my campaign?', a: 'Once live, your campaign has a real-time dashboard accessible through the SmartzAds portal.' },
  { q: 'How long does approval take?', a: 'All campaigns are reviewed within 24–48 hours of submission.' },
  { q: 'What ad formats are supported?', a: 'We support banner images, video ads, and sponsored native content placements.' },
]

export default function SmartzAdsPage() {
  const siteConfig = useSiteConfig()
  const bgUrl = siteConfig.get(SITE_IMAGE_KEYS.adsPageBg)

  // Live audience reach from real users table
  const liveStats   = usePublicStats()
  const memberCount = fmtCount(liveStats.totalUsers, '—')

  const benefits = [
    { icon: Globe,      title: 'Pan-African Reach',   desc: `Access a real, growing audience across 47+ countries in Africa.` },
    { icon: Users,      title: 'Precise Targeting',    desc: 'Target by country, age, interests, and behaviour.' },
    { icon: BarChart3,  title: 'Real-Time Analytics', desc: 'Live dashboards showing impressions, clicks, and ROI.' },
    { icon: TrendingUp, title: 'Performance-Based',    desc: 'Pay for actual results — clicks, views, conversions.' },
  ]

  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50 pt-[72px] sm:pt-20">

      {/* ── Hero ── */}
      <section>
        {/* Hero image */}
        <div className="w-full overflow-hidden relative">
          {bgUrl && (
            <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <motion.img
            src="/smartz-ads-hero.png"
            alt="SmartzAds — Advertise Smarter. Grow Faster."
            className="w-full object-cover object-center relative"
            style={{ opacity: bgUrl ? 0.75 : undefined }}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: bgUrl ? 0.75 : 1, scale: 1 }}
            transition={{ duration: 0.7 }}
          />
        </div>

        {/* CTA buttons — routed to /register so advertisers create an account first */}
        <div className="dark:bg-[#1a0014]/90 bg-pink-50/70 border-t-2 border-pink-500/25 py-6 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-love-gradient text-white font-semibold text-sm shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
              <Megaphone className="w-4 h-4" /> Create Ad Account
            </Link>
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl dark:bg-pink-900/30 bg-white border dark:border-pink-500/20 border-pink-300/50 dark:text-pink-200 text-pink-800 font-semibold text-sm hover:dark:bg-pink-900/50 hover:bg-pink-100 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
              <TrendingUp className="w-4 h-4" /> Promote Your Business
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Audience size stat ── */}
      <section className="py-8 dark:bg-[#0D0A14] bg-white border-b dark:border-white/5 border-gray-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm dark:text-gray-400 text-gray-500 mb-1 uppercase tracking-wider font-semibold">Reach a real audience</p>
          <p className="font-display font-black text-4xl sm:text-5xl bg-love-gradient bg-clip-text text-transparent">{memberCount}</p>
          <p className="text-base dark:text-gray-400 text-gray-600 mt-1">registered members across Africa</p>
        </div>
      </section>

      {/* ── Ad Formats ── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-3xl dark:text-white text-gray-900 mb-3">Ad Formats</h2>
            <p className="dark:text-gray-400 text-gray-600">Choose the format that best fits your campaign goals</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {adFormats.map((fmt, i) => {
              const Icon = fmt.icon
              return (
                <motion.div key={fmt.title}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className={`rounded-2xl p-6 border ${fmt.bg} ${fmt.border}`}>
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${fmt.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-lg dark:text-white text-gray-900 mb-2">{fmt.title}</h3>
                  <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed mb-4">{fmt.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {fmt.placements.map(p => (
                      <span key={p} className="px-2.5 py-1 rounded-lg dark:bg-white/8 bg-white border dark:border-white/10 border-gray-200 text-xs dark:text-gray-300 text-gray-700 font-medium">{p}</span>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="py-16 px-4 dark:bg-[#0D0A14] bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-3xl dark:text-white text-gray-900 mb-3">Why SmartzAds?</h2>
            <p className="dark:text-gray-400 text-gray-600">Built for brands that want to make a real impact across Africa</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => {
              const Icon = b.icon
              return (
                <motion.div key={b.title}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="dark:bg-[#130E1E] bg-gray-50 rounded-2xl p-5 border dark:border-white/6 border-gray-200 text-center">
                  <div className="w-12 h-12 rounded-xl bg-love-gradient flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold dark:text-white text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{b.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-3xl dark:text-white text-gray-900 mb-3">How It Works</h2>
          </div>
          <div className="space-y-6">
            {[
              { step: '01', title: 'Create Your Account', desc: 'Sign up at SmartzConnect and navigate to the SmartzAds portal to get started.' },
              { step: '02', title: 'Submit Your Campaign', desc: 'Set your campaign goals, budget, target audience, and upload your creative materials.' },
              { step: '03', title: 'Campaign Review',       desc: 'Our team reviews your creative materials and campaign setup within 24–48 hours.' },
              { step: '04', title: 'Track & Optimise',      desc: 'Monitor real-time performance and work with our team to optimise for better results.' },
            ].map((item, i) => (
              <motion.div key={item.step}
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex items-start gap-5 dark:bg-[#130E1E] bg-white rounded-2xl p-5 border dark:border-white/6 border-gray-200">
                <div className="w-12 h-12 rounded-xl bg-love-gradient flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/20">
                  <span className="font-display font-black text-white text-sm">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-bold dark:text-white text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4 dark:bg-[#0D0A14] bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display font-black text-3xl dark:text-white text-gray-900 mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="dark:bg-[#130E1E] bg-gray-50 rounded-2xl p-5 border dark:border-white/6 border-gray-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold dark:text-white text-gray-900 mb-1">{faq.q}</p>
                    <p className="text-sm dark:text-gray-400 text-gray-600">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl overflow-hidden relative shadow-2xl bg-gradient-to-br from-[#1f0818] via-[#150510] to-[#220a1e] border border-pink-500/20">
            {/* Decorative icons inside CTA */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-6 left-8 opacity-10"><Megaphone className="w-20 h-20 text-pink-300" /></div>
              <div className="absolute bottom-6 right-8 opacity-10"><TrendingUp className="w-20 h-20 text-rose-300" /></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-pink-600/20 blur-3xl" />
            </div>
            <div className="relative p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-love-gradient flex items-center justify-center mx-auto mb-5 shadow-lg shadow-pink-500/40">
                <Megaphone className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display font-black text-3xl text-white mb-4">Ready to Advertise?</h2>
              <p className="text-white/80 mb-7 max-w-lg mx-auto">
                Create your account and launch your first campaign on Africa's fastest growing social platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-love-gradient text-white font-bold shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 transition-all text-sm">
                  <Zap className="w-4 h-4" /> Get Started Free
                </Link>
                <a href="mailto:ads@smartzconnect.com"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/12 backdrop-blur-sm border border-white/25 text-white font-semibold hover:bg-white/22 transition-all text-sm">
                  <Mail className="w-4 h-4" /> Contact Ads Team <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
