import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Star, Quote, Heart } from 'lucide-react'

const testimonials = [
  { name: 'Amara Koroma',   age: 24, emoji: '👩🏾', country: 'Sierra Leone', flag: '🇸🇱', role: 'Matched & Dating',    stars: 5, text: 'I met my boyfriend on SmartzConnect 3 months ago. The AI matching is incredible — it knew we were perfect for each other before we did! 💕', feature: 'Discover' },
  { name: 'Emmanuel Kollie',age: 28, emoji: '👨🏿', country: 'Liberia',      flag: '🇱🇷', role: 'SmartzTV Creator',    stars: 5, text: 'I went from 0 to 50,000 followers in 2 months on SmartzTV. The virtual gifts alone pay my rent. This platform changed my life! 🎉', feature: 'SmartzTV' },
  { name: 'Fatima Diallo',  age: 26, emoji: '👩🏽', country: 'Senegal',      flag: '🇸🇳', role: 'Marketplace Seller',  stars: 5, text: 'My fashion business grew 300% after listing on SmartzMarket. Mobile Money payments make it so easy for my customers across West Africa.', feature: 'Marketplace' },
  { name: 'Kofi Asante',    age: 31, emoji: '👨🏾', country: 'Ghana',        flag: '🇬🇭', role: 'SmartzRide Driver',   stars: 5, text: 'I earn 3x more as a SmartzRide driver than my old job. The app is reliable, payments are instant via MoMo, and the support team is amazing.', feature: 'SmartzRide' },
  { name: 'Grace Kamara',   age: 22, emoji: '👩🏿', country: 'Liberia',      flag: '🇱🇷', role: 'Premium Member',      stars: 5, text: 'The Spin & Chat feature is so fun! I have made friends from 12 different countries. SmartzConnect is truly Africa\'s super-app 🌍', feature: 'Spin & Chat' },
  { name: 'Ibrahim Touré',  age: 29, emoji: '👨🏽', country: 'Côte d\'Ivoire',flag: '🇨🇮', role: 'Group Chat Admin',    stars: 5, text: 'I run a business networking group with 8,000 members on SmartzConnect. The group chat features are better than WhatsApp for communities.', feature: 'Groups' },
  { name: 'Nadia Mensah',   age: 27, emoji: '👩🏾', country: 'Ghana',        flag: '🇬🇭', role: 'VIP Member',          stars: 5, text: 'The VIP badge got me 10x more profile views. I matched with my dream partner within a week of upgrading. Worth every penny! 👑', feature: 'VIP' },
  { name: 'Mariama Bah',    age: 25, emoji: '👩🏿', country: 'Guinea',       flag: '🇬🇳', role: 'Verified Creator',    stars: 5, text: 'SmartzTV live streams are so smooth even on 3G. My viewers from across Africa can watch without buffering. The platform is world-class! 📺', feature: 'SmartzTV' },
  { name: 'Blessing Osei',  age: 30, emoji: '👩🏾', country: 'Nigeria',      flag: '🇳🇬', role: 'Marketplace Buyer',   stars: 5, text: 'I bought authentic Kente cloth from Ghana and Ankara from Nigeria all in one app. Delivery was fast and the buyer protection gave me peace of mind.', feature: 'Marketplace' },
  { name: 'Kadiatou Sow',   age: 21, emoji: '👩🏽', country: 'Senegal',      flag: '🇸🇳', role: 'New Member',          stars: 5, text: 'Just joined last month and already have 200 followers, 5 matches, and sold my first product. SmartzConnect is the future of African social media!', feature: 'All Features' },
]

const featured = testimonials[0]

function TestimonialCard({ t, delay = 0 }: { t: typeof testimonials[0]; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="flex-shrink-0 w-64 sm:w-72 lg:w-80 dark:bg-[#130E1E] bg-white rounded-2xl p-4 sm:p-5 border dark:border-white/6 border-gray-100 hover:shadow-xl hover:border-pink-500/20 transition-all duration-300 cursor-default">
      <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full dark:bg-white/8 bg-pink-50 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">{t.emoji}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-bold dark:text-white text-gray-900 truncate">{t.name}, {t.age}</p>
          <p className="text-[9px] sm:text-[10px] dark:text-gray-500 text-gray-400">{t.flag} {t.country} · {t.role}</p>
        </div>
        <span className="ml-auto text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-love-soft text-brand-pink flex-shrink-0">{t.feature}</span>
      </div>
      <div className="flex gap-0.5 mb-2">
        {Array.from({ length: t.stars }).map((_, i) => <Star key={i} className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-400 fill-amber-400" />)}
      </div>
      <p className="text-xs sm:text-sm dark:text-gray-300 text-gray-700 leading-relaxed">{t.text}</p>
    </motion.div>
  )
}

export default function Testimonials() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="testimonials" className="py-12 sm:py-16 lg:py-24 dark:bg-[#080510] bg-gray-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-pink-500/3 to-purple-500/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }} className="text-center mb-8 sm:mb-10 lg:mb-14">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-love-soft border border-pink-500/25 mb-4 sm:mb-5">
            <Heart className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-brand-pink" />
            <span className="text-xs sm:text-sm font-semibold text-brand-pink">Real stories from real users</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl dark:text-white text-gray-900 mb-3 sm:mb-4 leading-tight">
            Loved Across <span className="text-gradient-love">Africa</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg dark:text-gray-400 text-gray-600 max-w-xl mx-auto px-2">
            Over 2 million people have found love, built businesses, and connected with their culture on SmartzConnect.
          </p>
        </motion.div>

        {/* Featured testimonial */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}
          className="dark:bg-[#130E1E] bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 lg:p-10 border dark:border-white/8 border-gray-100 shadow-xl shadow-pink-500/5 mb-6 sm:mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-500/8 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-brand-pink/20 mb-3 sm:mb-4" />
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
            <div className="flex-1">
              <p className="text-base sm:text-lg lg:text-xl dark:text-gray-100 text-gray-800 leading-relaxed font-medium mb-4 sm:mb-5 italic">
                "{featured.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full dark:bg-white/8 bg-pink-50 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">{featured.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold dark:text-white text-gray-900 text-sm sm:text-base">{featured.name}, {featured.age}</p>
                  <p className="text-xs sm:text-sm dark:text-gray-400 text-gray-500">{featured.flag} {featured.country} · {featured.role}</p>
                </div>
                <div className="flex-shrink-0 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400 fill-amber-400" />)}
                </div>
              </div>
            </div>
            <div className="hidden sm:flex flex-col gap-2 flex-shrink-0">
              <div className="dark:bg-white/5 bg-gray-50 rounded-2xl p-3 sm:p-4 text-center border dark:border-white/6 border-gray-100 w-32 sm:w-36">
                <p className="font-display font-black text-xl sm:text-2xl text-gradient-love">2M+</p>
                <p className="text-[10px] sm:text-xs dark:text-gray-400 text-gray-500">Happy Users</p>
              </div>
              <div className="dark:bg-white/5 bg-gray-50 rounded-2xl p-3 sm:p-4 text-center border dark:border-white/6 border-gray-100 w-32 sm:w-36">
                <p className="font-display font-black text-xl sm:text-2xl text-gradient-love">4.9★</p>
                <p className="text-[10px] sm:text-xs dark:text-gray-400 text-gray-500">App Store Rating</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Marquee row 1 — left to right */}
        <div className="relative overflow-hidden mb-3 sm:mb-4">
          <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-r dark:from-[#080510] from-gray-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-l dark:from-[#080510] from-gray-50 to-transparent z-10 pointer-events-none" />
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            className="flex gap-3 sm:gap-4 w-max">
            {[...testimonials, ...testimonials].map((t, i) => (
              <TestimonialCard key={i} t={t} />
            ))}
          </motion.div>
        </div>

        {/* Marquee row 2 — right to left */}
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-r dark:from-[#080510] from-gray-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-l dark:from-[#080510] from-gray-50 to-transparent z-10 pointer-events-none" />
          <motion.div
            animate={{ x: ['-50%', '0%'] }}
            transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
            className="flex gap-3 sm:gap-4 w-max">
            {[...testimonials.slice(5), ...testimonials.slice(5)].map((t, i) => (
              <TestimonialCard key={i} t={t} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
