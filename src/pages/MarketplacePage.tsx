import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Heart, Star, ShoppingCart, MapPin, Shield, X, Plus, Minus, Package, Database, RefreshCw, Upload, Loader2, Link2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { uploadToSufy } from '@/lib/sufy'
import { useOfflineDraft } from '@/lib/offlineDraft'

const categories = ['All', 'Fashion', 'Electronics', 'Food', 'Art', 'Beauty', 'Home', 'Services', 'Digital']

interface Product {
  id: number | string
  name: string
  price: number
  originalPrice?: number | null
  rating?: number
  reviews?: number
  seller?: string
  seller_id?: string
  location?: string
  emoji?: string
  category?: string
  verified?: boolean
  badge?: string | null
  sold?: number
  inStock?: boolean
  description?: string
  image_url?: string
}

function ProductDrawer({ product, onClose, cart, onAddToCart }: {
  product: Product
  onClose: () => void
  cart: Record<string | number, number>
  onAddToCart: (id: string | number, qty: number) => void
}) {
  const [qty, setQty] = useState(1)
  const inCart = cart[product.id] || 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="dark:bg-[#130E1E] bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">

        <div className="w-10 h-1 rounded-full dark:bg-white/20 bg-gray-300 mx-auto mt-4 mb-2 sm:hidden" />

        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-white/6 border-gray-100">
          <h3 className="font-bold dark:text-white text-gray-900">Product Details</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="h-48 dark:bg-gradient-to-br dark:from-pink-500/10 dark:to-purple-600/10 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl flex items-center justify-center text-8xl mb-5 border dark:border-white/5 border-gray-100">
            {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-2xl" /> : (product.emoji || '📦')}
          </div>

          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-lg dark:text-white text-gray-900">{product.name}</h3>
              {product.category && <p className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">{product.category}</p>}
            </div>
            {product.badge && (
              <span className="ml-2 px-2.5 py-1 rounded-full bg-love-soft text-brand-pink text-[10px] font-bold flex-shrink-0">{product.badge}</span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl font-black text-brand-pink">${product.price}</span>
            {product.originalPrice && (
              <span className="text-sm line-through dark:text-gray-600 text-gray-400">${product.originalPrice}</span>
            )}
            {product.inStock === false && (
              <span className="px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500 text-[10px] font-bold">Out of stock</span>
            )}
          </div>

          {product.description && (
            <p className="text-sm dark:text-gray-300 text-gray-600 mb-4 leading-relaxed">{product.description}</p>
          )}

          <div className="flex items-center justify-between text-xs dark:text-gray-400 text-gray-500 mb-5">
            {product.seller && <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> By {product.seller}</span>}
            {product.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {product.location}</span>}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 dark:bg-white/5 bg-gray-100 rounded-xl p-1">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg dark:bg-white/5 bg-white flex items-center justify-center hover:text-brand-pink transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold text-sm dark:text-white text-gray-900">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 rounded-lg dark:bg-white/5 bg-white flex items-center justify-center hover:text-brand-pink transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => { onAddToCart(product.id, qty); onClose() }}
              disabled={product.inStock === false}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-love-gradient text-white font-bold text-sm shadow-lg shadow-pink-500/20 hover:opacity-90 transition-opacity disabled:opacity-50">
              <ShoppingCart className="w-4 h-4" />
              {inCart > 0 ? `Update Cart (${inCart})` : 'Add to Cart'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface NewListing {
  name: string
  price: string
  category: string
  description: string
  location: string
  image_url: string
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selected, setSelected] = useState<Product | null>(null)
  const [cart, setCart] = useState<Record<string | number, number>>({})
  const [wishlist, setWishlist] = useState<Set<string | number>>(new Set())
  const [showUpload, setShowUpload] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newListing, setNewListing] = useState<NewListing>({ name: '', price: '', category: 'Fashion', description: '', location: '', image_url: '' })
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  useOfflineDraft('marketplace-listing', newListing, setNewListing, {
    isEmpty: (d: any) => !d?.name?.trim(),
  })

  const fetchProducts = async () => {
    setLoading(true)
    let query = supabase
      .from('marketplace_items')
      .select('id, title, price, original_price, description, category, location, seller_id, image_url, is_verified, badge, sold_count, stock_qty, profiles:seller_id(full_name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (activeCategory !== 'All') {
      query = query.eq('category', activeCategory)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      if (error.message?.includes('does not exist')) {
        setDbConnected(false)
      } else {
        setDbConnected(true)
      }
      setProducts([])
    } else {
      setDbConnected(true)
      const mapped: Product[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.title,                            // schema column: title
        price: p.price,
        originalPrice: p.original_price,
        description: p.description,
        category: p.category,
        location: p.location,
        seller: (p.profiles as any)?.full_name || 'Seller',
        seller_id: p.seller_id,
        image_url: p.image_url,
        verified: p.is_verified,
        badge: p.badge,
        sold: p.sold_count,
        inStock: (p.stock_qty ?? 1) > 0,          // schema column: stock_qty
      }))
      setProducts(mapped)
    }
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [activeCategory])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.seller || '').toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = (id: string | number, qty: number) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + qty }))
  }

  const toggleWishlist = (id: string | number) => {
    setWishlist(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleListingImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const url = await uploadToSufy(file, 'marketplace')
      setNewListing(l => ({ ...l, image_url: url }))
    } catch { /* ignore */ }
    setUploadingImage(false)
  }

  const submitListing = async () => {
    if (!user || !newListing.name.trim() || !newListing.price) return
    setSubmitting(true)
    const { error } = await supabase.from('marketplace_items').insert({
      seller_id: user.id,
      title: newListing.name.trim(),              // schema column: title
      price: parseFloat(newListing.price),
      category: newListing.category,
      description: newListing.description.trim() || null,
      location: newListing.location.trim() || null,
      image_url: newListing.image_url.trim() || null,
      is_active: true,                            // schema column: is_active
      stock_qty: 1,                               // schema column: stock_qty
    })
    setSubmitting(false)
    if (!error) {
      setNewListing({ name: '', price: '', category: 'Fashion', description: '', location: '', image_url: '' })
      setShowUpload(false)
      fetchProducts()
    }
  }

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)

  return (
    <div className="h-full flex flex-col dark:bg-[#0A0710] bg-gray-50 overflow-hidden">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0 dark:bg-[#0D0A14] bg-white border-b dark:border-white/6 border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display font-black text-xl dark:text-white text-gray-900">Marketplace 🛍️</h1>
            <p className="text-xs dark:text-gray-400 text-gray-500">{dbConnected ? `${filtered.length} listings` : 'Connect database'}</p>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button onClick={() => setShowUpload(!showUpload)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-love-soft border border-pink-500/20 text-brand-pink text-xs font-bold hover:bg-pink-500/10 transition-colors">
                <Upload className="w-3.5 h-3.5" /> Sell
              </button>
            )}
            <button onClick={fetchProducts} className="w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
              <RefreshCw className="w-4 h-4 dark:text-gray-400 text-gray-600" />
            </button>
            {cartCount > 0 && (
              <button className="relative w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
                <ShoppingCart className="w-4 h-4 dark:text-gray-400 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-pink text-white text-[8px] font-black flex items-center justify-center">{cartCount}</span>
              </button>
            )}
          </div>
        </div>

        {/* Upload form */}
        <AnimatePresence>
          {showUpload && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="mb-3 overflow-hidden">
              <div className="dark:bg-white/5 bg-gray-50 rounded-2xl border dark:border-white/8 border-gray-200 p-4">
                <p className="text-sm font-bold dark:text-white text-gray-900 mb-3">List a Product</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    placeholder="Product name *"
                    value={newListing.name}
                    onChange={e => setNewListing(l => ({ ...l, name: e.target.value }))}
                    className="col-span-2 px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink" />
                  <input
                    placeholder="Price (USD) *"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newListing.price}
                    onChange={e => setNewListing(l => ({ ...l, price: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink" />
                  <select
                    value={newListing.category}
                    onChange={e => setNewListing(l => ({ ...l, category: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink">
                    {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    placeholder="Location (optional)"
                    value={newListing.location}
                    onChange={e => setNewListing(l => ({ ...l, location: e.target.value }))}
                    className="col-span-2 px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink" />
                  <textarea
                    placeholder="Description (optional)"
                    rows={2}
                    value={newListing.description}
                    onChange={e => setNewListing(l => ({ ...l, description: e.target.value }))}
                    className="col-span-2 px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink resize-none" />
                  {/* Product image upload */}
                  <div className="col-span-2 space-y-1.5">
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleListingImageUpload} />
                    <div className="flex items-center gap-2">
                      {newListing.image_url && (
                        <img src={newListing.image_url} alt="preview" className="w-9 h-9 rounded-lg object-cover border dark:border-white/8 border-gray-200 flex-shrink-0" />
                      )}
                      <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-[10px] font-semibold dark:text-gray-300 text-gray-700 hover:border-brand-pink/40 transition-colors disabled:opacity-50 whitespace-nowrap">
                        {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                        {uploadingImage ? 'Uploading…' : 'Upload Image'}
                      </button>
                    </div>
                    <input
                      placeholder="Image URL (or upload above)"
                      value={newListing.image_url}
                      onChange={e => setNewListing(l => ({ ...l, image_url: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowUpload(false)} className="flex-1 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-sm dark:text-gray-400 text-gray-600">Cancel</button>
                  <button
                    onClick={submitListing}
                    disabled={submitting || !newListing.name.trim() || !newListing.price}
                    className="flex-1 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold disabled:opacity-50">
                    {submitting ? 'Listing…' : 'List Product'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products, sellers..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === cat ? 'bg-love-gradient text-white shadow-sm' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products grid */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="dark:bg-[#130E1E] bg-white rounded-2xl overflow-hidden border dark:border-white/6 border-gray-200 animate-pulse">
                <div className="h-40 dark:bg-white/5 bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 dark:bg-white/10 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 dark:bg-white/10 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !dbConnected ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl dark:bg-white/5 bg-gray-100 flex items-center justify-center">
              <Database className="w-8 h-8 dark:text-gray-600 text-gray-400" />
            </div>
            <div>
              <p className="font-bold dark:text-white text-gray-900 mb-1">Marketplace not connected</p>
              <p className="text-sm dark:text-gray-400 text-gray-500">Configure Supabase to display real product listings</p>
            </div>
            <button onClick={fetchProducts} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="text-5xl mb-2">🛍️</div>
            <div>
              <p className="font-bold dark:text-white text-gray-900 mb-1">{search ? 'No results found' : 'No listings yet'}</p>
              <p className="text-sm dark:text-gray-400 text-gray-500">
                {search ? 'Try a different search term' : 'Be the first to list a product!'}
              </p>
            </div>
            {user && !search && (
              <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold">
                <Upload className="w-4 h-4" /> List a Product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((product, i) => (
              <motion.div key={product.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => setSelected(product)}
                className="dark:bg-[#130E1E] bg-white rounded-2xl overflow-hidden border dark:border-white/6 border-gray-200 cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:shadow-pink-500/10 transition-all group">

                {/* Product image */}
                <div className="relative h-40 dark:bg-gradient-to-br dark:from-pink-500/10 dark:to-purple-600/10 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center overflow-hidden">
                  {product.image_url
                    ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    : <span className="text-5xl">{product.emoji || '📦'}</span>
                  }
                  {product.badge && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-love-gradient text-white text-[9px] font-bold shadow-md">{product.badge}</span>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); toggleWishlist(product.id) }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full dark:bg-black/30 bg-white/80 flex items-center justify-center shadow-md">
                    <Heart className={`w-3.5 h-3.5 transition-colors ${wishlist.has(product.id) ? 'fill-brand-pink text-brand-pink' : 'dark:text-gray-400 text-gray-500'}`} />
                  </button>
                </div>

                {/* Product info */}
                <div className="p-3">
                  <p className="font-bold text-sm dark:text-white text-gray-900 mb-1 line-clamp-1 group-hover:text-brand-pink transition-colors">{product.name}</p>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-black text-brand-pink">${product.price}</span>
                      {product.originalPrice && (
                        <span className="ml-1.5 text-xs line-through dark:text-gray-600 text-gray-400">${product.originalPrice}</span>
                      )}
                    </div>
                    {product.rating && (
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-[10px] dark:text-gray-400 text-gray-500">{product.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {product.verified && <Shield className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                    <p className="text-[10px] dark:text-gray-500 text-gray-400 truncate">{product.seller || 'Seller'}</p>
                    {product.inStock === false && <span className="ml-auto text-[9px] text-gray-500">Out of stock</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Product Drawer */}
      <AnimatePresence>
        {selected && (
          <ProductDrawer
            product={selected}
            onClose={() => setSelected(null)}
            cart={cart}
            onAddToCart={addToCart}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
