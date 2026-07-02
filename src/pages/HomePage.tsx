import { Link } from 'react-router-dom'
import { Crown } from 'lucide-react'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import SmartzTVPreview from '@/components/SmartzTVPreview'
import MarketplacePreview from '@/components/MarketplacePreview'
import RidePreview from '@/components/RidePreview'
import Testimonials from '@/components/Testimonials'
import FAQ from '@/components/FAQ'

function SubscriptionCTA() {
  return (
    <section className="py-14 sm:py-20 dark:bg-[#080510] bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-love-soft border border-pink-500/25 mb-5">
          <Crown className="w-4 h-4 text-brand-pink" />
          <span className="text-sm font-semibold text-brand-pink">Simple, transparent pricing</span>
        </div>
        <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl dark:text-white text-gray-900 mb-4 leading-tight">
          Choose Your <span className="text-gradient-love">Plan</span>
        </h2>
        <p className="dark:text-gray-400 text-gray-600 mb-8 text-sm sm:text-base max-w-xl mx-auto">
          Start free, upgrade when you're ready. Pay with Mobile Money or card. Cancel anytime — no hidden fees.
        </p>
        <Link
          to="/subscriptions"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-love-gradient text-white font-bold text-base shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 transition-all"
        >
          <Crown className="w-5 h-5" /> View Subscription Plans
        </Link>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <SmartzTVPreview />
      <MarketplacePreview />
      <RidePreview />
      <Testimonials />
      <SubscriptionCTA />
      <FAQ />
    </main>
  )
}
