import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ExternalLink, Users, Zap, Shield, Star, MapPin, Calendar } from 'lucide-react'
import { useSiteConfig, SITE_IMAGE_KEYS } from '@/contexts/SiteConfigContext'

const values = [
  { emoji: '🌍', title: 'Africa First',       desc: 'Every decision starts with: "Is this right for Africa?" We build for our continent, by our continent.' },
  { emoji: '💕', title: 'Genuine Connection', desc: 'Technology should bring people closer, not replace human connection. Authenticity is our north star.' },
  { emoji: '🛡️', title: 'Safety Always',      desc: 'We invest more in safety than any other African social platform. Every user deserves to feel safe.' },
  { emoji: '🚀', title: 'Move Fast',           desc: 'We ship fast, learn faster. Moving with startup urgency and scale-up discipline.' },
]

const CEO = {
  full_name: 'Shedrick K. Nungehn',
  role: 'Founder & CEO',
  photo_url: '/ceo-shedrick.jpg',
  country: 'Liberia 🇱🇷',
  joined_year: '2023',
  bio: "Visionary entrepreneur and founder of SmartzConnect — Africa's leading all-in-one digital super-app. Born and raised in Liberia, Shedrick built SmartzConnect to empower Africans across the world through technology, connection, and community.",
  skills: ['Leadership', 'Product Vision', 'Strategy', 'Technology', 'African Markets'],
  contact_url: 'https://wa.me/231776679963',
}

export default function TeamPage() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const siteConfig = useSiteConfig()
  const bgUrl = siteConfig.get(SITE_IMAGE_KEYS.teamPageBg)

  return (
    <div className="dark:bg-[#080510] bg-gray-50 min-h-screen pt-16 sm:pt-20">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="relative h-56 sm:h-72 md:h-80 bg-gradient-to-br from-[#1a0a2e] via-[#0d0518] to-[#1d0a30]">
          {bgUrl && (
            <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 pointer-events-none" style={bgUrl ? { opacity: 0.7 } : undefined}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-pink-500/20 blur-3xl" />
            <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-purple-500/15 blur-2xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-violet-500/15 blur-3xl" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/12 backdrop-blur-sm border border-white/20 mb-3 sm:mb-4">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-300" />
              <span className="text-xs sm:text-sm font-semibold text-white">The people behind SmartzConnect</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-white mb-2 sm:mb-3">
              Built by Africans,<br />
              <span className="text-pink-300">For Africa</span>
            </h1>
            <p className="text-sm sm:text-base text-white/75 max-w-xl px-4">
              A passionate team united by a mission to connect our continent through innovative technology.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">

        {/* ── Values ── */}
        <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="mb-14 sm:mb-20">
          <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl dark:text-white text-gray-900 text-center mb-6 sm:mb-8">
            Our <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Values</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {values.map((v, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                className="dark:bg-[#130E1E] bg-white rounded-2xl p-5 sm:p-6 border dark:border-white/6 border-gray-100 text-center hover:shadow-lg hover:border-purple-500/20 transition-all">
                <div className="text-3xl sm:text-4xl mb-3">{v.emoji}</div>
                <h3 className="font-bold dark:text-white text-gray-900 mb-2 text-sm sm:text-base">{v.title}</h3>
                <p className="text-xs sm:text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Founder Spotlight ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }}
          className="mb-14 sm:mb-20"
        >
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl dark:text-white text-gray-900">
              Leadership <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Team</span>
            </h2>
            <p className="dark:text-gray-400 text-gray-600 mt-2 text-xs sm:text-sm">Driving SmartzConnect's mission across Africa and beyond.</p>
          </div>

          {/* CEO Card — full-width feature layout */}
          <div className="dark:bg-[#130E1E] bg-white rounded-3xl border dark:border-white/8 border-gray-100 shadow-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row">

              {/* Photo */}
              <div className="relative md:w-80 lg:w-96 flex-shrink-0 h-72 md:h-auto min-h-[320px]">
                <img
                  src={CEO.photo_url}
                  alt={CEO.full_name}
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent md:bg-gradient-to-r md:from-transparent md:to-transparent" />
                {/* Mobile name overlay */}
                <div className="absolute bottom-4 left-5 md:hidden">
                  <p className="font-black text-white text-xl leading-tight">{CEO.full_name}</p>
                  <p className="text-pink-300 text-sm font-semibold">{CEO.role}</p>
                </div>
                {/* Country badge */}
                <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {CEO.country}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">

                {/* Desktop name */}
                <div className="hidden md:block mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/20 mb-3">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-purple-300">Founder & Visionary</span>
                  </div>
                  <h3 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900 mb-1">{CEO.full_name}</h3>
                  <p className="text-base text-pink-400 font-semibold">{CEO.role}</p>
                </div>

                {/* Joined */}
                <div className="flex items-center gap-1.5 mb-4">
                  <Calendar className="w-3.5 h-3.5 dark:text-gray-500 text-gray-400" />
                  <span className="text-xs dark:text-gray-500 text-gray-400">Building since {CEO.joined_year}</span>
                </div>

                {/* Bio */}
                <p className="text-sm sm:text-base dark:text-gray-300 text-gray-700 leading-relaxed mb-6">
                  {CEO.bio}
                </p>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {CEO.skills.map(s => (
                    <span key={s} className="text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-purple-600/15 to-pink-600/15 dark:text-purple-300 text-purple-700 border dark:border-purple-500/20 border-purple-200">
                      {s}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t dark:border-white/8 border-gray-100">
                  <a href={CEO.contact_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold shadow-lg shadow-purple-600/25 hover:opacity-90 transition-opacity">
                    <Shield className="w-4 h-4" /> Contact CEO
                  </a>
                  <Link to="/register"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl dark:bg-white/6 bg-gray-100 dark:text-white text-gray-700 text-sm font-semibold hover:dark:bg-white/10 hover:bg-gray-200 transition-colors border dark:border-white/8 border-gray-200">
                    <ExternalLink className="w-4 h-4" /> Join the Platform
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Mission Stats ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-14 sm:mb-20"
        >
          {[
            { value: '15K+', label: 'Users',       emoji: '👥' },
            { value: '195+', label: 'Countries',   emoji: '🌍' },
            { value: '1K+',  label: 'Businesses',  emoji: '🏢' },
            { value: '8K+',  label: 'Connections', emoji: '💕' },
          ].map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.2 + i * 0.07 }}
              className="dark:bg-[#130E1E] bg-white rounded-2xl p-4 sm:p-5 border dark:border-white/6 border-gray-100 text-center hover:border-purple-500/20 transition-all">
              <div className="text-2xl mb-1">{s.emoji}</div>
              <p className="font-black text-xl sm:text-2xl dark:text-white text-gray-900">{s.value}</p>
              <p className="text-xs dark:text-gray-500 text-gray-500 font-medium mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Join CTA ── */}
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-2xl bg-gradient-to-br from-[#1f0d38] via-[#2d1060] to-[#1a0a2e]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-48 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-violet-500/15 blur-2xl" />
          </div>
          <div className="relative p-6 sm:p-10 md:p-12 text-center">
            <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl text-white mb-2 sm:mb-3">Join Our Movement</h2>
            <p className="text-white/70 mb-5 sm:mb-6 max-w-lg mx-auto text-xs sm:text-sm md:text-base">
              Be part of Africa's fastest-growing super-app. Connect, create, and thrive with a community built for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register"
                className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold inline-flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-600/30">
                <Zap className="w-4 h-4" /> Get Started
              </Link>
              <a href="https://wa.me/231776679963" target="_blank" rel="noopener noreferrer"
                className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold hover:bg-white/20 transition-colors inline-flex items-center justify-center gap-2 border border-white/20 text-sm">
                💬 WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
