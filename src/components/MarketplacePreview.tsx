import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ShoppingBag, Star, MapPin, ArrowRight } from 'lucide-react'

const products = [
  { name: 'Kente Fabric Set', price: '$45', seller: 'GhanaFabrics', rating: 4.9, reviews: 128, category: 'Fashion', emoji: '🧵' },
  { name: 'Wireless Earbuds Pro', price: '$89', seller: 'TechMart LR', rating: 4.7, reviews: 89, category: 'Electronics', emoji: '🎧' },
  { name: 'Shea Butter Collection', price: '$28', seller: 'NaturalGlow', rating: 5.0, reviews: 234, category: 'Beauty', emoji: '🧴' },
  { name: 'African Art Print', price: '$120', seller: 'ArtByKofi', rating: 4.8, reviews: 56, category: 'Art', emoji: '🎨' },
  { name: 'Handmade Leather Bag', price: '$75', seller: 'LeatherCraft', rating: 4.9, reviews: 167, category: 'Fashion', emoji: '👜' },
  { name: 'Organic Coffee Blend', price: '$22', seller: 'EthiopiaRoast', rating: 4.6, reviews: 312, category: 'Food', emoji: '☕' },
]

export default function MarketplacePreview() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-24 dark:bg-[#07070E] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-pink/10 border border-brand-pink/20 mb-6">
            <ShoppingBag className="w-4 h-4 text-brand-pink" />
            <span className="text-sm font-medium text-brand-pink">SmartzMarket</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold dark:text-white text-gray-900 mb-4">
            Shop Africa.{' '}
            <span className="text-gradient-love">Ship Worldwide.</span>
          </h2>
          <p className="text-lg dark:text-gray-400 text-gray-600 max-w-2xl mx-auto">
            Discover authentic African products from verified sellers. From fashion to electronics, art to food — all in one marketplace.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {products.map((product, i) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="group dark:bg-[#111118] bg-white rounded-2xl overflow-hidden border dark:border-white/6 border-gray-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-500/5 hover:border-brand-pink/30 transition-all duration-300 cursor-pointer"
            >
              <div className="aspect-square bg-gradient-to-br from-pink-500/10 to-amber-500/5 flex items-center justify-center text-4xl">
                {product.emoji}
              </div>
              <div className="p-3">
                <span className="text-[10px] font-medium text-brand-pink bg-brand-pink/10 px-2 py-0.5 rounded-full">
                  {product.category}
                </span>
                <p className="text-xs font-semibold dark:text-white text-gray-900 mt-2 leading-tight line-clamp-2">
                  {product.name}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-brand-pink fill-brand-pink" />
                  <span className="text-[10px] dark:text-gray-400 text-gray-500">{product.rating} ({product.reviews})</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-brand-pink">{product.price}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-2.5 h-2.5 dark:text-gray-500 text-gray-400" />
                  <span className="text-[10px] dark:text-gray-500 text-gray-400">{product.seller}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <button className="group inline-flex items-center gap-2 btn-love">
            Browse Marketplace
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  )
}
