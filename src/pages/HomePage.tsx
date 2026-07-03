import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import Hero from '@/components/Hero'
import {
  Globe, Heart, Shield, Award, Zap, Users, Target, Eye,
  ShoppingBag, Car, Package, Megaphone, Tv, MessageCircle,
  CheckCircle, ArrowRight, Star, Lock, Smartphone, Wallet,
  UserPlus, Settings, Compass, TrendingUp, Sparkles,
} from 'lucide-react'

/* ─── animation helper ─── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, delay },
})

/* ─── data ─── */
const services = [
  {
    icon: Users, emoji: '🌐', name: 'SmartzSocial',
    color: 'from-violet-500 to-purple-600',
    desc: 'A vibrant social feed to share moments, follow friends, join communities, and stay connected with people who matter to you — anywhere in the world.',
  },
  {
    icon: Heart, emoji: '💕', name: 'SmartzDating',
    color: 'from-pink-500 to-rose-600',
    desc: 'AI-powered matchmaking that goes beyond swipes. Our smart compatibility engine helps you find meaningful connections across Africa and beyond.',
  },
  {
    icon: Tv, emoji: '📺', name: 'SmartzTV',
    color: 'from-purple-500 to-violet-600',
    desc: 'Africa\'s live streaming and creator platform. Broadcast your world, grow your audience, receive virtual gifts, and turn your passion into income.',
  },
  {
    icon: ShoppingBag, emoji: '🛒', name: 'SmartzMarket',
    color: 'from-amber-500 to-orange-600',
    desc: 'A trusted pan-African marketplace where individuals and businesses buy, sell, and discover authentic products — with Mobile Money payments built in.',
  },
  {
    icon: Car, emoji: '🚗', name: 'SmartzRide',
    color: 'from-emerald-500 to-teal-600',
    desc: 'Safe, affordable ride-hailing with verified drivers and live GPS tracking. Connecting commuters and drivers across African cities.',
  },
  {
    icon: Package, emoji: '📦', name: 'SmartzDelivery',
    color: 'from-blue-500 to-cyan-600',
    desc: 'Fast, reliable same-day delivery connecting businesses and individuals. From parcels to meals — delivered on your schedule.',
  },
  {
    icon: Megaphone, emoji: '📣', name: 'SmartzAds',
    color: 'from-fuchsia-500 to-pink-600',
    desc: 'Precision-targeted advertising to reach Africa\'s most engaged digital audience. Grow your brand visibility and drive measurable business results.',
  },
]

const coreValues = [
  {
    icon: Zap, title: 'Innovation First',
    desc: 'We pioneer technology solutions tailored for Africa\'s unique landscape — mobile-first, offline-resilient, and culturally intelligent.',
  },
  {
    icon: Heart, title: 'Community at Heart',
    desc: 'Every feature we build is designed to bring people genuinely closer — not just digitally connected, but meaningfully engaged.',
  },
  {
    icon: Shield, title: 'Safety Always',
    desc: 'Trust and safety are non-negotiable. We invest in end-to-end encryption, identity verification, and 24/7 moderation so every user feels secure.',
  },
  {
    icon: Award, title: 'African Excellence',
    desc: 'We celebrate African culture, talent, creativity, and enterprise on a global stage — because Africa\'s story deserves to be told by Africans.',
  },
  {
    icon: Globe, title: 'Inclusive Growth',
    desc: 'We build economic pathways that create real opportunity for individuals, creators, drivers, vendors, and businesses across 195+ countries.',
  },
  {
    icon: Star, title: 'Relentless Quality',
    desc: 'We hold ourselves to the highest standards in design, performance, and user experience — because our users deserve nothing less.',
  },
]

const whyChooseUs = [
  {
    icon: Smartphone, title: 'One Identity, Everything Unlocked',
    desc: 'A single SmartzConnect account gives you seamless access to all seven super-products — social, dating, streaming, marketplace, rides, delivery, and ads.',
  },
  {
    icon: Wallet, title: 'Mobile Money Payments Built In',
    desc: 'Pay and earn via MTN Mobile Money, Orange Money, and all major payment methods — no bank account required, no friction.',
  },
  {
    icon: Lock, title: 'Privacy & Security by Default',
    desc: 'End-to-end encrypted messaging, AES-256 data storage, and strict privacy controls ensure your personal information is always protected.',
  },
  {
    icon: Globe, title: 'Built for Africa, Open to the World',
    desc: 'Engineered for low-bandwidth environments across 195+ countries, with multilingual support and locally relevant features.',
  },
  {
    icon: TrendingUp, title: 'Earn While You Connect',
    desc: 'From creator gifts on SmartzTV to driver earnings on SmartzRide and vendor sales on SmartzMarket — the platform pays you back.',
  },
  {
    icon: Sparkles, title: 'Free to Join, Powerful to Use',
    desc: 'Start with zero cost and access a rich set of features. Unlock the full ecosystem with our affordable Plus or Pro plans whenever you\'re ready.',
  },
]

const socialFeatures = [
  { emoji: '📰', title: 'Social Feed', desc: 'Share posts, photos, videos, and stories with your network in a scrollable feed tailored to your interests.' },
  { emoji: '💬', title: 'Private Messaging', desc: 'Encrypted one-on-one and group chats with voice notes, media sharing, and real-time presence.' },
  { emoji: '🎡', title: 'Spin & Chat', desc: 'Random matching roulette — spin and instantly connect with someone new from anywhere in the world.' },
  { emoji: '🎭', title: 'Stories & Reels', desc: 'Share 24-hour stories and short-form video content to keep your followers engaged and entertained.' },
  { emoji: '👥', title: 'Community Groups', desc: 'Create or join interest-based groups — from professional networks to hobby clubs and local communities.' },
  { emoji: '🌍', title: 'World Stage', desc: 'A global broadcast space where top creators, thought leaders, and brands reach audiences at scale.' },
  { emoji: '🛍️', title: 'Business Profiles', desc: 'Dedicated storefront pages for vendors, brands, and service providers to showcase and sell their offerings.' },
  { emoji: '🔔', title: 'Smart Notifications', desc: 'Stay informed with intelligent, real-time alerts for matches, messages, orders, rides, and platform activity.' },
]

const steps = [
  {
    num: '01', icon: UserPlus, title: 'Create Your Free Account',
    desc: 'Sign up in under two minutes with your email address. No credit card required — your SmartzConnect journey begins immediately.',
  },
  {
    num: '02', icon: Settings, title: 'Set Up Your Profile',
    desc: 'Add your photo, interests, location, and preferences. A complete profile gets you better matches, more visibility, and stronger connections.',
  },
  {
    num: '03', icon: Compass, title: 'Choose Your Experience',
    desc: 'Explore the social feed, browse the marketplace, go live on SmartzTV, request a ride, or activate your dating profile — all from one dashboard.',
  },
  {
    num: '04', icon: Users, title: 'Connect & Collaborate',
    desc: 'Message people, join communities, follow creators, partner with businesses, and grow your personal and professional network.',
  },
  {
    num: '05', icon: TrendingUp, title: 'Unlock Your Full Potential',
    desc: 'Upgrade to Plus or Pro for unlimited access, priority placement, creator monetisation, advanced analytics, and exclusive platform benefits.',
  },
]

/* ─── section wrapper ─── */
function Section({ children, bg = 'dark:bg-[#0D0A14] bg-white', id }: { children: React.ReactNode; bg?: string; id?: string }) {
  return (
    <section id={id} className={`py-14 sm:py-20 lg:py-24 ${bg} relative overflow-hidden`}>
      {children}
    </section>
  )
}

function SectionBadge({ icon: Icon, label, color = 'text-purple-400', bg = 'bg-purple-500/10 border-purple-500/20' }: { icon: React.ElementType; label: string; color?: string; bg?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${bg} mb-5`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-sm font-semibold ${color}`}>{label}</span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <main>
      <Hero />

      {/* ══ 1. ABOUT US ══════════════════════════════════════════════════════ */}
      <Section id="about" bg="dark:bg-[#0D0A14] bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div {...fadeUp()}>
              <SectionBadge icon={Globe} label="About Us" color="text-purple-400" bg="bg-purple-500/10 border-purple-500/20" />
              <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl dark:text-white text-gray-900 mb-5 leading-tight">
                Built in Africa.<br />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Built for the World.</span>
              </h2>
              <p className="dark:text-gray-300 text-gray-700 text-base sm:text-lg leading-relaxed mb-5">
                SmartzConnect is Africa's first all-in-one digital super-app — born in Monrovia, Liberia and designed to serve a global community. We unify seven powerful products under a single account: social networking, smart dating, live streaming, a trusted marketplace, ride-hailing, last-mile delivery, and precision advertising.
              </p>
              <p className="dark:text-gray-400 text-gray-600 text-sm sm:text-base leading-relaxed">
                We believe that Africans and the African diaspora deserve world-class technology that speaks their language, accepts their payment methods, and reflects their culture. SmartzConnect is that platform — and it is free to join.
              </p>
            </motion.div>
            <motion.div {...fadeUp(0.18)} className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { value: '2M+',   label: 'Active Users',       color: 'text-purple-400' },
                { value: '195+',  label: 'Countries Reached',  color: 'text-pink-400' },
                { value: '7',     label: 'Super-Products',     color: 'text-amber-400' },
                { value: '8K+',   label: 'Daily Connections',  color: 'text-emerald-400' },
              ].map(s => (
                <div key={s.label} className="p-5 sm:p-6 rounded-2xl dark:bg-[#130E1E] bg-gray-50 border dark:border-white/6 border-gray-100 text-center">
                  <p className={`font-display font-black text-2xl sm:text-3xl ${s.color} mb-1`}>{s.value}</p>
                  <p className="text-xs sm:text-sm dark:text-gray-400 text-gray-600">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ══ 2. OUR VISION ════════════════════════════════════════════════════ */}
      <Section bg="dark:bg-[#080510] bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUp()}>
            <SectionBadge icon={Eye} label="Our Vision" color="text-pink-400" bg="bg-pink-500/10 border-pink-500/20" />
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl dark:text-white text-gray-900 mb-6 leading-tight">
              Africa's Most Trusted<br />
              <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">Digital Ecosystem</span>
            </h2>
          </motion.div>
          <motion.div {...fadeUp(0.15)} className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/8 to-pink-500/8 blur-xl" />
            <div className="relative p-7 sm:p-10 rounded-3xl dark:bg-[#130E1E] bg-white border dark:border-white/8 border-gray-100 shadow-2xl shadow-purple-500/5">
              <p className="text-base sm:text-lg lg:text-xl dark:text-gray-200 text-gray-700 leading-relaxed">
                To become the world's most trusted African-born digital ecosystem — a place where every person, creator, entrepreneur, and community has the tools to connect deeply, grow sustainably, earn fairly, and thrive without limits. We envision a future where African technology sets the standard for the world, and SmartzConnect leads that charge.
              </p>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ══ 3. OUR MISSION ═══════════════════════════════════════════════════ */}
      <Section bg="dark:bg-[#0D0A14] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div {...fadeUp(0.12)}>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: '🤝', title: 'Connect Meaningfully',  desc: 'Enabling authentic human connections — friendships, relationships, and professional networks that last.' },
                  { icon: '💼', title: 'Power African Business', desc: 'Providing every entrepreneur, vendor, and creator with professional-grade tools to reach customers and grow revenue.' },
                  { icon: '🛡️', title: 'Protect Every User',     desc: 'Delivering a safe, private, and trustworthy environment where every person can engage with full confidence.' },
                  { icon: '🌍', title: 'Bridge the Digital Divide', desc: 'Making world-class technology accessible to everyone in Africa — regardless of device, location, or bandwidth.' },
                ].map((item, i) => (
                  <motion.div key={item.title} {...fadeUp(i * 0.07)}
                    className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl dark:bg-[#130E1E] bg-gray-50 border dark:border-white/6 border-gray-100">
                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="font-bold dark:text-white text-gray-900 text-sm sm:text-base mb-1">{item.title}</p>
                      <p className="text-xs sm:text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div {...fadeUp()}>
              <SectionBadge icon={Target} label="Our Mission" color="text-emerald-400" bg="bg-emerald-500/10 border-emerald-500/20" />
              <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl dark:text-white text-gray-900 mb-5 leading-tight">
                Empowering People
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"> & Business</span>
              </h2>
              <p className="dark:text-gray-300 text-gray-700 text-base sm:text-lg leading-relaxed mb-5">
                Our mission is to empower individuals and businesses by providing a secure, inclusive, and innovative platform where meaningful relationships are built, professional networks flourish, and economic opportunity is created for everyone.
              </p>
              <p className="dark:text-gray-400 text-gray-600 text-sm sm:text-base leading-relaxed">
                Born in Liberia. Serving 195+ countries. Guided by a single belief: that technology should lift every person it touches.
              </p>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ══ 4. OUR SERVICES ══════════════════════════════════════════════════ */}
      <Section id="services" bg="dark:bg-[#080510] bg-gray-50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} className="text-center mb-12 sm:mb-16">
            <SectionBadge icon={Sparkles} label="Our Services" color="text-amber-400" bg="bg-amber-500/10 border-amber-500/20" />
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl dark:text-white text-gray-900 mb-4 leading-tight">
              Seven Products.<br />
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">One Powerful Platform.</span>
            </h2>
            <p className="dark:text-gray-400 text-gray-600 max-w-2xl mx-auto text-base sm:text-lg">
              Every SmartzConnect service is designed to work better together — because your social life, business, and daily needs are all connected.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {services.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div key={s.name} {...fadeUp(i * 0.06)}
                  className="group p-5 sm:p-6 rounded-2xl dark:bg-[#130E1E] bg-white border dark:border-white/6 border-gray-100 hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{s.emoji}</span>
                    <h3 className="font-display font-black text-sm sm:text-base dark:text-white text-gray-900">{s.name}</h3>
                  </div>
                  <p className="text-xs sm:text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{s.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </Section>

      {/* ══ 5. CORE VALUES ═══════════════════════════════════════════════════ */}
      <Section bg="dark:bg-[#0D0A14] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} className="text-center mb-12 sm:mb-16">
            <SectionBadge icon={Award} label="Core Values" color="text-pink-400" bg="bg-pink-500/10 border-pink-500/20" />
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl dark:text-white text-gray-900 mb-4 leading-tight">
              The Principles That
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent"> Guide Everything</span>
            </h2>
            <p className="dark:text-gray-400 text-gray-600 max-w-2xl mx-auto text-base sm:text-lg">
              Our values are not aspirations on a wall — they are the decisions we make every day in what we build and how we serve our community.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {coreValues.map((v, i) => {
              const Icon = v.icon
              return (
                <motion.div key={v.title} {...fadeUp(i * 0.08)}
                  className="p-6 sm:p-7 rounded-2xl dark:bg-[#130E1E] bg-gray-50 border dark:border-white/6 border-gray-100 hover:border-pink-500/20 hover:shadow-lg transition-all">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 border dark:border-white/8 border-purple-100">
                    <Icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="font-display font-bold text-base sm:text-lg dark:text-white text-gray-900 mb-2">{v.title}</h3>
                  <p className="text-xs sm:text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{v.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </Section>

      {/* ══ 6. WHY CHOOSE US ═════════════════════════════════════════════════ */}
      <Section bg="dark:bg-[#080510] bg-gray-50">
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-emerald-500/4 blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <motion.div {...fadeUp()}>
              <SectionBadge icon={CheckCircle} label="Why Choose Us" color="text-emerald-400" bg="bg-emerald-500/10 border-emerald-500/20" />
              <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl dark:text-white text-gray-900 mb-5 leading-tight">
                One Platform.<br />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Endless Possibilities.</span>
              </h2>
              <p className="dark:text-gray-300 text-gray-700 text-base sm:text-lg leading-relaxed mb-5">
                SmartzConnect is not just another social app. It is a complete digital ecosystem built from the ground up to solve real African challenges — with a product suite, payment infrastructure, and community depth that no competitor offers.
              </p>
              <Link to="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/25 hover:shadow-purple-600/40 hover:scale-105 transition-all">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div {...fadeUp(0.15)} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {whyChooseUs.map((item, i) => {
                const Icon = item.icon
                return (
                  <motion.div key={item.title} {...fadeUp(i * 0.06)}
                    className="p-4 sm:p-5 rounded-2xl dark:bg-[#130E1E] bg-white border dark:border-white/6 border-gray-100 hover:border-emerald-500/20 transition-all">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h3 className="font-bold dark:text-white text-gray-900 text-xs sm:text-sm mb-1.5 leading-snug">{item.title}</h3>
                    <p className="text-xs dark:text-gray-400 text-gray-600 leading-relaxed">{item.desc}</p>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ══ 7. SOCIAL & BUSINESS FEATURES ════════════════════════════════════ */}
      <Section id="features" bg="dark:bg-[#0D0A14] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} className="text-center mb-12 sm:mb-16">
            <SectionBadge icon={MessageCircle} label="Social & Business Features" color="text-violet-400" bg="bg-violet-500/10 border-violet-500/20" />
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl dark:text-white text-gray-900 mb-4 leading-tight">
              Everything You Need<br />
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">In One Place</span>
            </h2>
            <p className="dark:text-gray-400 text-gray-600 max-w-2xl mx-auto text-base sm:text-lg">
              From personal social experiences to professional business tools — SmartzConnect has built every feature our community asked for, all under one roof.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {socialFeatures.map((f, i) => (
              <motion.div key={f.title} {...fadeUp(i * 0.07)}
                className="group p-5 sm:p-6 rounded-2xl dark:bg-[#130E1E] bg-gray-50 border dark:border-white/6 border-gray-100 hover:border-violet-500/25 hover:shadow-lg transition-all">
                <span className="text-3xl block mb-3">{f.emoji}</span>
                <h3 className="font-display font-bold text-sm sm:text-base dark:text-white text-gray-900 mb-2">{f.title}</h3>
                <p className="text-xs sm:text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA strip */}
          <motion.div {...fadeUp(0.3)} className="mt-10 sm:mt-14 p-7 sm:p-10 rounded-3xl bg-gradient-to-br from-[#1a0a2e] via-[#200d40] to-[#1a0a2e] border border-purple-500/20 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-40 rounded-full bg-purple-600/20 blur-3xl" />
            </div>
            <div className="relative">
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white mb-3">Ready to experience it all?</h3>
              <p className="text-white/60 mb-6 max-w-lg mx-auto text-sm sm:text-base">
                Join millions of users already connecting, creating, selling, and thriving on SmartzConnect.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-105 transition-all">
                  Join Free Today <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/app/subscriptions"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-all">
                  View Pricing
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ══ 8. HOW TO JOIN ═══════════════════════════════════════════════════ */}
      <Section bg="dark:bg-[#080510] bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} className="text-center mb-12 sm:mb-16">
            <SectionBadge icon={UserPlus} label="How to Join" color="text-orange-400" bg="bg-orange-500/10 border-orange-500/20" />
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl dark:text-white text-gray-900 mb-4 leading-tight">
              Join in
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent"> 5 Simple Steps</span>
            </h2>
            <p className="dark:text-gray-400 text-gray-600 max-w-xl mx-auto text-base sm:text-lg">
              Getting started with SmartzConnect takes less than two minutes. Your complete digital life — one tap away.
            </p>
          </motion.div>

          <div className="space-y-3 sm:space-y-4 mb-10 sm:mb-14">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div key={step.num} {...fadeUp(i * 0.08)}
                  className="flex items-start gap-5 p-5 sm:p-6 rounded-2xl dark:bg-[#130E1E] bg-white border dark:border-white/6 border-gray-100 hover:border-orange-500/20 hover:shadow-lg transition-all group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-600/20 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-purple-400 tracking-widest">{step.num}</span>
                      <h3 className="font-display font-bold text-sm sm:text-base dark:text-white text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-xs sm:text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Final CTA */}
          <motion.div {...fadeUp(0.4)} className="text-center">
            <Link to="/register"
              className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black text-base shadow-2xl shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-105 transition-all">
              <UserPlus className="w-5 h-5" />
              Create Your Free Account
            </Link>
            <p className="mt-4 text-xs dark:text-gray-500 text-gray-400">
              No credit card required · Free forever · Upgrade anytime
            </p>
          </motion.div>
        </div>
      </Section>
    </main>
  )
}
