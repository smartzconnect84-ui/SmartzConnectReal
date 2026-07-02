import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Megaphone, BarChart3, Target, Zap, Globe, Users, TrendingUp, CheckCircle, ArrowRight, Mail } from 'lucide-react'

const adFormats = [
  {
    icon: Megaphone, title: 'Banner Ads',
    description: 'Eye-catching display banners placed throughout feeds, discovery pages, and marketplace.',
    placements: ['Feed', 'Discover', 'Marketplace'],
    color: 'from-pink-500 to-rose-600', bg: 'dark:bg-pink-500/10 bg-pink-50', border: 'dark:border-pink-500/20 border-pink-200',
  },
  {
    icon: Zap, title: 'Video Ads',
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

const benefits = [
  { icon: Globe,      title: 'Pan-African Reach',   desc: 'Access audiences across 47+ countries in Africa.' },
  { icon: Users,      title: 'Precise Targeting',    desc: 'Target by country, age, interests, and behaviour.' },
  { icon: BarChart3,  title: 'Real-Time Analytics', desc: 'Live dashboards showing impressions, clicks, and ROI.' },
  { icon: TrendingUp, title: 'Performance-Based',    desc: 'Pay for actual results — clicks, views, conversions.' },
]

const faqs = [
  { q: 'What is the minimum budget?', a: 'We support campaigns starting from any budget. Contact our team to discuss a plan that works for you.' },
  { q: 'How do I track my campaign?', a: 'Once live, your campaign has a real-time dashboard accessible through the SmartzAds portal.' },
  { q: 'How long does approval take?', a: 'All campaigns are reviewed within 24–48 hours of submission.' },
  { q: 'What ad formats are supported?', a: 'We support banner images, video ads, and sponsored native content placements.' },
]

export default function SmartzAdsPage() {
  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative h-72 sm:h-96 lg:h-[460px] bg-gradient-to-br from-[#1f0818] via-[#0d0512] to-[#220a1e]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-pink-600/25 blur-3xl" />
            <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-rose-500/15 blur-3xl" />
            <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-fuchsia-500/15 blur-2xl" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/20 backdrop-blur-sm border border-pink-400/35 text-pink-200 text-sm font-bold mb-6">
                <Megaphone className="w-4 h-4" /> SmartzAds Platform
              </div>
              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-5">
                Reach Africa's Most<br />
                <span className="text-pink-300">Engaged Audience</span>
              </h1>
              <p className="text-lg text-white/80 max-w-2xl mx-auto mb-7">
                Advertise on SmartzConnect and connect your brand with millions of active users across Africa.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <a href="mailto:ads@smartzconnect.com"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-love-gradient text-white font-bold shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 transition-all">
                  <Mail className="w-4 h-4" /> Start Advertising
                </a>
                <Link to="/about"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white/12 backdrop-blur-sm border border-white/20 text-white font-semibold hover:bg-white/22 transition-all">
                  Learn More <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ad Formats */}
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

      {/* Benefits */}
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

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-3xl dark:text-white text-gray-900 mb-3">How It Works</h2>
          </div>
          <div className="space-y-6">
            {[
              { step: '01', title: 'Submit Your Campaign', desc: 'Contact our ads team with your campaign goals, budget, and target audience details.' },
              { step: '02', title: 'Campaign Review',       desc: 'Our team reviews your creative materials and campaign setup within 24–48 hours.' },
              { step: '03', title: 'Go Live',               desc: "Your campaign goes live across SmartzConnect's platform reaching your target audience." },
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

      {/* FAQ */}
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

      {/* CTA with flyer */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl overflow-hidden relative shadow-2xl">
            <img src="/flyer.png" alt="SmartzConnect" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 to-pink-900/75" />
            <div className="relative p-10 text-center">
              <h2 className="font-display font-black text-3xl text-white mb-4">Ready to Advertise?</h2>
              <p className="text-white/80 mb-7">
                Get in touch with our advertising team today and launch your first campaign on Africa's fastest growing social platform.
              </p>
              <a href="mailto:ads@smartzconnect.com"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-love-gradient text-white font-bold shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 transition-all text-sm">
                <Mail className="w-4 h-4" /> Contact Our Ads Team
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
