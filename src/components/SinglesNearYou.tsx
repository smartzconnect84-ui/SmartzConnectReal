import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

type FeaturedProfile = {
  name: string
  age: number
  country: string
  flag: string
  intent: string
  image: string
  imagePosition?: string
  contentType: 'illustrative'
}

const FEATURED_PROFILES: FeaturedProfile[] = [
  {
    name: 'Martha',
    age: 28,
    country: 'Liberia',
    flag: '🇱🇷',
    intent: 'Looking for a relationship',
    image: '/singles-near-you/liberia-woman.jpg',
    contentType: 'illustrative',
  },
  {
    name: 'Kwame',
    age: 31,
    country: 'Ghana',
    flag: '🇬🇭',
    intent: 'Open to meaningful connections',
    image: '/singles-near-you/ghana-man.jpg',
    contentType: 'illustrative',
  },
  {
    name: 'Amara',
    age: 27,
    country: 'Nigeria',
    flag: '🇳🇬',
    intent: 'Looking for something genuine',
    image: '/singles-near-you/nigeria-woman.jpg',
    contentType: 'illustrative',
  },
  {
    name: 'Ibrahim',
    age: 29,
    country: 'Sierra Leone',
    flag: '🇸🇱',
    intent: 'Open to meaningful connections',
    image: '/singles-near-you/sierra-leone-man.jpg',
    contentType: 'illustrative',
  },
  {
    name: 'Nia',
    age: 30,
    country: 'Kenya',
    flag: '🇰🇪',
    intent: 'Looking for a relationship',
    image: '/singles-near-you/kenya-woman.jpg',
    contentType: 'illustrative',
  },
  {
    name: 'Thabo',
    age: 32,
    country: 'South Africa',
    flag: '🇿🇦',
    intent: 'Here for real conversation',
    image: '/singles-near-you/south-africa-man.jpg',
    contentType: 'illustrative',
  },
  {
    name: 'Avery',
    age: 28,
    country: 'United States',
    flag: '🇺🇸',
    intent: 'Open to meaningful connections',
    image: '/singles-near-you/us-woman.jpg',
    contentType: 'illustrative',
  },
  {
    name: 'Arjun',
    age: 31,
    country: 'India',
    flag: '🇮🇳',
    intent: 'Looking for a relationship',
    image: '/singles-near-you/india-man.jpg',
    contentType: 'illustrative',
  },
]

function ProfileCard({ profile, index }: { profile: FeaturedProfile; index: number }) {
  return (
    <motion.article
      data-content-type={profile.contentType}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: index * 0.05, duration: 0.45 }}
      whileHover={{ y: -6 }}
      className="group relative min-w-[calc((100vw-3.5rem)/2.1)] overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#110b1c] shadow-[0_16px_45px_rgba(0,0,0,0.24)] sm:min-w-[205px] md:min-w-0"
    >
      <div className="relative aspect-[0.8] overflow-hidden">
        <img
          src={profile.image}
          alt={`${profile.name}, featured profile`}
          loading={index < 2 ? 'eager' : 'lazy'}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          style={{ objectPosition: profile.imagePosition || 'center center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#110b1c] via-[#110b1c]/10 to-transparent" />

        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/35 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/85 backdrop-blur-md">
          <Sparkles className="h-2.5 w-2.5 text-[#f7c84b]" />
          Featured
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/30 px-2 py-1 text-[10px] text-white/80 backdrop-blur-md">
          18+
        </span>

        <div className="absolute inset-x-3 bottom-3">
          <div className="mb-2 flex items-end justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-black leading-none text-white">
                {profile.name}, {profile.age}
              </h3>
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-white/75">
                <span aria-hidden="true">{profile.flag}</span>
                {profile.country}
              </p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md">
              <Heart className="h-4 w-4" />
            </div>
          </div>
          <p className="line-clamp-2 text-[11px] leading-relaxed text-white/60">{profile.intent}</p>
        </div>
      </div>

      <div className="border-t border-white/[0.07] p-3">
        <Link
          to="/register"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ec4899] to-[#9b5de5] px-3 py-2.5 text-[11px] font-extrabold text-white shadow-lg shadow-pink-500/15 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-pink-400/70"
        >
          <Heart className="h-3.5 w-3.5 fill-current" />
          Connect
        </Link>
      </div>
    </motion.article>
  )
}

export default function SinglesNearYou() {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scrollProfiles = (direction: 'left' | 'right') => {
    scrollerRef.current?.scrollBy({
      left: direction === 'right' ? 280 : -280,
      behavior: 'smooth',
    })
  }

  return (
    <section
      id="singles-near-you"
      aria-labelledby="singles-near-you-title"
      className="relative overflow-hidden border-y border-white/[0.06] bg-[#07040d] py-16 sm:py-20 lg:py-24"
    >
      <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-pink-500/10 blur-[110px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          className="mb-8 flex flex-col gap-6 sm:mb-10 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-400/20 bg-pink-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-pink-300">
              <MapPin className="h-3.5 w-3.5" />
              Discover connection
            </div>
            <h2 id="singles-near-you-title" className="font-display text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
              <span aria-hidden="true">📍 </span>
              Singles <span className="bg-gradient-to-r from-pink-400 via-fuchsia-300 to-purple-400 bg-clip-text text-transparent">Near You</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
              Meet interesting singles from your area and around the world.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollProfiles('left')}
              aria-label="Previous singles"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/65 transition hover:border-pink-400/40 hover:bg-pink-500/10 hover:text-white md:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollProfiles('right')}
              aria-label="Next singles"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/65 transition hover:border-pink-400/40 hover:bg-pink-500/10 hover:text-white md:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <Link
              to="/smartzdating"
              className="group inline-flex items-center gap-2 rounded-full border border-pink-400/25 bg-pink-500/10 px-4 py-2.5 text-xs font-bold text-pink-200 transition hover:border-pink-300/50 hover:bg-pink-500/20"
            >
              View All Singles
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>

        <div
          ref={scrollerRef}
          className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:gap-4 sm:px-0 md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4 xl:grid-cols-5"
        >
          {FEATURED_PROFILES.map((profile, index) => (
            <div key={`${profile.name}-${profile.country}`} className="snap-start md:min-w-0">
              <ProfileCard profile={profile} index={index} />
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-[11px] leading-relaxed text-white/40">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400/80" />
            Approximate locations only. Discovery is always opt-in.
          </p>
          <p className="text-[11px] text-white/35">Connect with people who share your interests and goals.</p>
        </div>
      </div>
    </section>
  )
}