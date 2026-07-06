import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, X, Send, Minimize2, Maximize2,
  Bot, User, ChevronDown, Sparkles, Headphones,
  Copy, ThumbsUp, ThumbsDown,
} from 'lucide-react'
const logoImg = '/logo.png'
import { useLiveChat } from '@/contexts/LiveChatContext'

interface ChatMessage {
  id: string
  text: string
  isBot: boolean
  time: string
  options?: string[]
  liked?: boolean | null
}

const SUPPORT_EMAIL = 'support@smartzconnect.com'

/* ─── Knowledge base ─── */
const botKnowledge: Record<string, string> = {
  'hello|hi|hey|hola|howdy|sup':
    `Hi there! 👋 Welcome to **SmartzConnect** — Africa's #1 social, dating & community platform!\n\nI'm your 24/7 AI assistant. How can I help you today?`,

  'pricing|plans|cost|price|subscription|free|premium|vip|upgrade|tier':
    `💎 **Our Plans:**\n\n🆓 **Free Forever** — Browse profiles, basic chat, social feed, 10 swipes/day\n💕 **Premium ($5/mo)** — Unlimited swipes, see who liked you, SmartzTV, priority matching\n👑 **VIP ($10/mo)** — All Premium + verified badge, creator tools, live streaming, ride priority\n\nPay via MTN MoMo or Orange Money — no card needed! Want to upgrade?`,

  'payment|pay|mtn|orange|mobile money|momo|transaction':
    `📱 **How to Pay (Mobile Money):**\n\n1. Choose your plan in the app → Subscriptions\n2. Send payment to:\n   • 🟡 **MTN MoMo:** +231 888 061 379\n   • 🟠 **Orange Money:** +231 776 679 963\n   • *Account:* Shedrick K. Nungehn\n3. Submit your Transaction ID in the app\n4. Admin confirms within 15 mins ✅\n\nNeed the exact amount in local currency?`,

  'dating|match|swipe|discover|like|crush|love':
    `💕 **Dating on SmartzConnect:**\n\nSwipe right to like, left to pass. Match when both like each other! 🎉\n\n• Tinder-style swipe cards\n• Super Like & Profile Boost\n• Distance, age & interest filters\n• See who liked you (Premium+)\n\nReady to find love? Sign up free!`,

  'chat|message|dm|private|messaging|inbox':
    `💬 **Chat & Messaging:**\n\n• Real-time 1-on-1 messaging via Stream\n• Group community rooms (50+ categories)\n• Spin & Chat — random matching\n• Typing indicators & read receipts\n• Voice notes, images, GIFs & reactions\n• End-to-end message privacy`,

  'marketplace|sell|buy|shop|product|listing|store':
    `🛍️ **SmartzConnect Marketplace:**\n\n• List & sell products globally\n• Categories: Fashion, Electronics, Food & more\n• Seller profiles with ratings\n• Admin-verified listings for trust\n• Pay with Mobile Money\n\nBasic listings are free — start selling today!`,

  'smartztv|stream|video|reel|watch|creator|content':
    `📺 **SmartzTV:**\n\nLike TikTok Live — but built for Africa!\n• Upload & watch short videos\n• Go Live to your audience\n• Creator profiles & subscriber counts\n• Live reactions, comments & tips\n• Revenue share for VIP creators`,

  'ride|uber|driver|car|transport|delivery|smartzride':
    `🚗 **SmartzRide:**\n\nUber-style ride-hailing for Africa!\n• Book rides in seconds\n• Live GPS driver tracking\n• Upfront fare estimates\n• Cash or MoMo payment\n• Become a driver & earn!`,

  'safety|report|block|trust|scam|fake|verify|verified':
    `🛡️ **Safety & Trust:**\n\n• ✅ Profile verification badges\n• 🚨 One-tap report & block\n• 👮 Real-time content moderation\n• 🔒 Private data — never sold\n• 24/7 safety team on standby\n\nReport abuse: safety@smartzconnect.com`,

  'contact|support|help|email|phone|team|human|agent':
    `📞 **Reach Our Team:**\n\n• 📧 **Support:** support@smartzconnect.com\n• 💼 **Business:** business@smartzconnect.com\n• 📞 **Phone:** +231 776 679 963\n• 🕐 **Hours:** 24/7 AI + Human agents Mon–Sat`,

  'register|signup|join|account|create|start|begin|new':
    `🎉 **Join SmartzConnect Free!**\n\nSign up in under 60 seconds:\n1. Click **"Join Free"** on the homepage\n2. Enter your name, email & password\n3. Verify your email\n4. Complete your profile & start connecting! 💕`,

  'africa|liberia|worldwide|global|country|countries':
    `🌍 **We're Global:**\n\nSmartzConnect connects people across:\n• 🇱🇷 Liberia (our home!)\n• All 54 African countries\n• 195+ countries worldwide\n\nWherever you are, we connect you!`,

  'pwa|app|install|mobile|download|browser|android|ios':
    `📱 **Install SmartzConnect:**\n\nWe're a **Progressive Web App (PWA)** — no app store needed!\n• Open in Chrome or Safari\n• Tap the install / Add to Home Screen prompt\n• Works offline with push notifications\n• Always up-to-date automatically`,

  'delete|cancel|deactivate|close|account':
    `⚠️ **Manage Your Account:**\n\nYou can cancel your subscription anytime from **App → Subscriptions** with no penalty.\n\nTo delete your account, go to **Profile → Settings → Delete Account**.\n\nNeed help? Email us at support@smartzconnect.com.`,
}

function getBotResponse(input: string): { text: string; options?: string[] } {
  const lower = input.toLowerCase()
  for (const [keys, response] of Object.entries(botKnowledge)) {
    if (keys.split('|').some(k => lower.includes(k))) {
      return { text: response }
    }
  }
  return {
    text: `I appreciate your message! 😊 I didn't catch that specific topic, but I'm here to help.\n\nYou can also reach us directly:\n📧 **Email:** support@smartzconnect.com\n📞 **Phone:** +231 776 679 963\n\nOr choose a topic below:`,
    options: ['💰 Pricing', '💕 Dating', '🛍️ Marketplace', '📺 SmartzTV', '🚗 Rides', '📞 Contact'],
  }
}

const quickReplies = ['💰 Pricing', '💕 Dating', '🛍️ Marketplace', '📺 SmartzTV', '🚗 Rides', '📞 Contact']

/* ─── Message bubble component ─── */
function Bubble({ msg, onCopy, onFeedback, onOption }: {
  msg: ChatMessage
  onCopy: (text: string) => void
  onFeedback: (id: string, liked: boolean) => void
  onOption: (text: string) => void
}) {
  const [showActions, setShowActions] = useState(false)

  const formatText = (text: string) =>
    text.split('\n').map((line, i, arr) => (
      <span key={i}>
        {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
            : part
        )}
        {i < arr.length - 1 && <br />}
      </span>
    ))

  return (
    <div className={`flex group pt-[0px] pb-[0px] mt-[0px] mb-[0px] gap-[5px] flex-row justify-center items-center pl-[0px] pr-[0px] ${msg.isBot ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      {msg.isBot
        ? <div className="w-7 h-7 rounded-full bg-love-gradient flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-pink-500/20">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
        : <div className="w-7 h-7 rounded-full dark:bg-white/10 bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
            <User className="w-3.5 h-3.5 dark:text-gray-300 text-gray-600" />
          </div>
      }

      <div className={`max-w-[85%] ${msg.isBot ? '' : 'items-end flex flex-col'}`}>
        {/* Bubble */}
        <div
          onClick={() => msg.isBot && setShowActions(s => !s)}
          className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed cursor-default ${
            msg.isBot
              ? 'dark:bg-white/8 bg-white border dark:border-white/8 border-gray-100 dark:text-gray-100 rounded-tl-sm shadow-sm text-[#000]'
              : 'bg-love-gradient text-white rounded-tr-sm shadow-md shadow-pink-500/20'
          }`}
        >
          {formatText(msg.text)}
        </div>

        {/* Bot actions row */}
        {msg.isBot && (
          <div className={`flex items-center gap-2 mt-1.5 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <button onClick={() => onCopy(msg.text.replace(/\*\*/g, ''))}
              className="flex items-center gap-1 text-[10px] dark:text-gray-600 text-gray-400 hover:text-brand-pink transition-colors">
              <Copy className="w-3 h-3" /> Copy
            </button>
            <button onClick={() => onFeedback(msg.id, true)}
              className={`flex items-center gap-1 text-[10px] transition-colors ${msg.liked === true ? 'text-emerald-500' : 'dark:text-gray-600 text-gray-400 hover:text-emerald-500'}`}>
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button onClick={() => onFeedback(msg.id, false)}
              className={`flex items-center gap-1 text-[10px] transition-colors ${msg.liked === false ? 'text-red-400' : 'dark:text-gray-600 text-gray-400 hover:text-red-400'}`}>
              <ThumbsDown className="w-3 h-3" />
            </button>
            <span className="text-[9px] dark:text-gray-700 text-gray-300">{msg.time}</span>
          </div>
        )}

        {/* User timestamp */}
        {!msg.isBot && <span className="text-[9px] dark:text-gray-600 text-gray-400 mt-1">{msg.time}</span>}

        {/* Quick reply chips */}
        {msg.options && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {msg.options.map(opt => (
              <button key={opt} onClick={() => onOption(opt)}
                className="px-2.5 py-1 rounded-full text-[10px] font-semibold border dark:border-pink-500/30 border-pink-200 dark:text-pink-300 text-pink-600 hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-all">
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Typing indicator ─── */
function TypingDots() {
  return (
    <div className="flex gap-2">
      <div className="w-7 h-7 rounded-full bg-love-gradient flex items-center justify-center flex-shrink-0 shadow-md shadow-pink-500/20">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm dark:bg-white/8 bg-white border dark:border-white/8 border-gray-100 flex items-center gap-1.5 shadow-sm">
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.7, delay: i * 0.15, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-brand-pink"
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Main LiveChat component ─── */
export default function LiveChat() {
  const { open, dismissed, setOpen, setDismissed, unreadCount, setUnreadCount } = useLiveChat()
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '0', isBot: true,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    text: `👋 Hi! Welcome to **SmartzConnect** — Africa's #1 social & dating platform!\n\nI'm your 24/7 AI assistant. Ask me anything about features, pricing, or how to get started! 💕`,
    options: quickReplies,
  }])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [teaserVisible, setTeaserVisible] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [copied, setCopied] = useState(false)

  // Bubble drag state — stores the bubble's top-left corner in viewport coords
  const BUBBLE_SIZE = 52
  const defaultBubblePos = () => ({
    x: window.innerWidth - BUBBLE_SIZE - 16,
    y: window.innerHeight - BUBBLE_SIZE - (window.innerWidth < 768 ? 88 : 24),
  })
  const [bubblePos, setBubblePos] = useState({ x: -1, y: -1 }) // -1 = lazy init
  const bubbleDrag = useRef({ active: false, didDrag: false, sx: 0, sy: 0, spx: 0, spy: 0 })

  const [dragging, setDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Init + keep bubble in bounds on resize
  useEffect(() => {
    const init = () => {
      setBubblePos(prev => {
        const def = defaultBubblePos()
        if (prev.x === -1) return def
        return {
          x: Math.max(0, Math.min(window.innerWidth  - BUBBLE_SIZE, prev.x)),
          y: Math.max(0, Math.min(window.innerHeight - BUBBLE_SIZE, prev.y)),
        }
      })
    }
    init()
    window.addEventListener('resize', init, { passive: true })
    return () => window.removeEventListener('resize', init)
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check, { passive: true })
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  useEffect(() => {
    if (open) { setTeaserVisible(false); setUnreadCount(0); setTimeout(() => inputRef.current?.focus(), 400) }
  }, [open])

  // ── Bubble drag: mouse ──
  const onBubbleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const d = bubbleDrag.current
    d.active = true; d.didDrag = false
    d.sx = e.clientX; d.sy = e.clientY
    d.spx = bubblePos.x; d.spy = bubblePos.y
  }
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = bubbleDrag.current
      if (!d.active) return
      const dx = e.clientX - d.sx, dy = e.clientY - d.sy
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.didDrag = true
      setBubblePos({
        x: Math.max(0, Math.min(window.innerWidth  - BUBBLE_SIZE, d.spx + dx)),
        y: Math.max(0, Math.min(window.innerHeight - BUBBLE_SIZE, d.spy + dy)),
      })
    }
    const onUp = () => {
      const d = bubbleDrag.current
      if (d.active && !d.didDrag) {
        setOpen(!open); setTeaserVisible(false); setUnreadCount(0)
      }
      d.active = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  // ── Bubble drag: touch ──
  const onBubbleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    const d = bubbleDrag.current
    d.active = true; d.didDrag = false
    d.sx = t.clientX; d.sy = t.clientY
    d.spx = bubblePos.x; d.spy = bubblePos.y
  }
  useEffect(() => {
    const onMove = (e: TouchEvent) => {
      const d = bubbleDrag.current
      if (!d.active) return
      e.preventDefault()
      const t = e.touches[0]
      const dx = t.clientX - d.sx, dy = t.clientY - d.sy
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) d.didDrag = true
      setBubblePos({
        x: Math.max(0, Math.min(window.innerWidth  - BUBBLE_SIZE, d.spx + dx)),
        y: Math.max(0, Math.min(window.innerHeight - BUBBLE_SIZE, d.spy + dy)),
      })
    }
    const onEnd = () => {
      const d = bubbleDrag.current
      if (d.active && !d.didDrag) {
        setOpen(!open); setTeaserVisible(false); setUnreadCount(0)
      }
      d.active = false
    }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    return () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd) }
  }, [])

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { id: Date.now().toString(), text: text.trim(), isBot: false, time: now }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      const { text: botText, options } = getBotResponse(text)
      setTyping(false)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), text: botText, isBot: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options, liked: null,
      }])
      if (!open) setUnreadCount(unreadCount + 1)
    }, 700 + Math.random() * 800)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  const handleFeedback = (id: string, liked: boolean) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, liked } : m))
  }

  // Drag (desktop only)
  const onMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, px: position.x, py: position.y }
  }
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging) return
      setPosition({ x: dragStart.current.px + (e.clientX - dragStart.current.x), y: dragStart.current.py + (e.clientY - dragStart.current.y) })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging])

  if (dismissed) return null

  const windowStyle = isMobile
    ? { bottom: 0, left: 0, right: 0, width: '100%' }
    : { bottom: `${88 - position.y}px`, right: `${24 - position.x}px`, width: '368px', maxWidth: 'calc(100vw - 32px)' }
  const windowHeight = isMobile ? '85dvh' : (minimized ? 'auto' : '540px')

  return (
    <>
      {/* ── Chat Window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.88, y: 24 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed z-[9999] shadow-2xl shadow-black/30"
            style={windowStyle}
          >
            <div
              className={`dark:bg-[#0F0A1A] bg-gray-50 border dark:border-white/8 border-gray-200 overflow-hidden flex flex-col ${isMobile ? 'rounded-t-3xl' : 'rounded-3xl'}`}
              style={{ height: windowHeight }}
            >
              {/* Mobile drag handle */}
              {isMobile && <div className="w-10 h-1 rounded-full dark:bg-white/15 bg-gray-300 mx-auto mt-3 mb-1 flex-shrink-0" />}

              {/* ── Header ── */}
              <div
                onMouseDown={onMouseDown}
                className={`flex items-center justify-between px-4 py-3 bg-love-gradient flex-shrink-0 ${!isMobile ? 'cursor-grab active:cursor-grabbing' : ''} select-none`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <img src={logoImg} alt="SmartzConnect" className="w-9 h-9 rounded-xl object-contain bg-white/20 p-0.5 shadow-md" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">SmartzConnect AI</p>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-2.5 h-2.5 text-white/80" />
                      <p className="text-white/80 text-[10px] font-medium">24/7 · AI + Human Support</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!isMobile && (
                    <button onClick={() => setMinimized(!minimized)}
                      className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
                      title={minimized ? 'Expand' : 'Minimize'}>
                      {minimized ? <Maximize2 className="w-3.5 h-3.5 text-white" /> : <Minimize2 className="w-3.5 h-3.5 text-white" />}
                    </button>
                  )}
                  <button onClick={() => setOpen(false)}
                    className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors" title="Close">
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button onClick={() => { setOpen(false); setDismissed(true) }}
                    className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center hover:bg-red-400/40 transition-colors" title="Move to menu bar">
                    <ChevronDown className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>

              {(!minimized || isMobile) && (
                <>
                  {/* ── Status bar ── */}
                  <div className="flex items-center justify-between px-4 py-2 dark:bg-white/3 bg-white border-b dark:border-white/5 border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] dark:text-gray-400 text-gray-500 font-medium">Typically replies in &lt;1 min</span>
                    </div>
                    <a href={`mailto:${SUPPORT_EMAIL}`}
                      className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold hover:underline">
                      <Headphones className="w-3 h-3" /> Human agent
                    </a>
                  </div>

                  {/* ── Messages ── */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 dark:bg-[#0F0A1A] pt-[12px] pb-[12px] mt-[1px] mb-[1px] pl-[16px] pr-[16px] bg-[#0f0a1a]">
                    {messages.map(msg => (
                      <Bubble key={msg.id} msg={msg} onCopy={handleCopy} onFeedback={handleFeedback} onOption={sendMessage} />
                    ))}
                    {typing && <TypingDots />}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* ── Copy toast ── */}
                  <AnimatePresence>
                    {copied && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="absolute top-24 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg dark:bg-white/10 bg-gray-800 text-white text-xs font-semibold shadow-lg z-10">
                        Copied!
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Input ── */}
                  <div className="p-3 border-t dark:border-white/6 border-gray-200 dark:bg-[#0F0A1A] bg-white flex-shrink-0"
                    style={{ paddingBottom: isMobile ? 'max(12px, env(safe-area-inset-bottom))' : '12px' }}>
                    <div className="flex items-center gap-2 dark:bg-white/6 bg-gray-50 rounded-2xl border dark:border-white/8 border-gray-200 px-4 py-2.5 focus-within:border-pink-400 transition-colors">
                      <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                        placeholder="Ask anything about SmartzConnect…"
                        className="flex-1 text-xs dark:text-white text-gray-900 placeholder:dark:text-gray-500 placeholder:text-gray-400 focus:outline-none bg-[transparent]"
                      />
                      <motion.button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim()}
                        whileTap={{ scale: 0.9 }}
                        className="w-7 h-7 rounded-xl bg-love-gradient flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition-all flex-shrink-0 shadow-md shadow-pink-500/20">
                        <Send className="w-3.5 h-3.5 text-white" />
                      </motion.button>
                    </div>
                    <p className="text-[9px] dark:text-gray-700 text-gray-400 text-center mt-1.5 select-none">
                      AI responses · Tap <ChevronDown className="inline w-2.5 h-2.5 mx-0.5" /> to move to menu bar
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile backdrop ── */}
      <AnimatePresence>
        {open && isMobile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] md:hidden" />
        )}
      </AnimatePresence>

      {/* ── Teaser bubble ── */}
      <AnimatePresence>
        {!open && teaserVisible && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ delay: 2.5, type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-[148px] right-4 md:bottom-24 md:right-6 z-[9997] max-w-[230px]"
          >
            <div className="dark:bg-[#130E1E] bg-white rounded-2xl rounded-br-sm p-3.5 shadow-xl shadow-pink-500/15 border dark:border-white/8 border-gray-100 relative">
              <button onClick={() => setTeaserVisible(false)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full dark:bg-[#130E1E] bg-white border dark:border-white/10 border-gray-200 flex items-center justify-center hover:text-brand-pink transition-colors shadow-sm">
                <X className="w-2.5 h-2.5 dark:text-gray-400 text-gray-500" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] dark:text-gray-400 text-gray-500 font-medium">AI Support · Online now</p>
              </div>
              <p className="text-xs dark:text-white text-gray-900 font-semibold mb-2">👋 Need help? Ask me anything!</p>
              <div className="flex flex-wrap gap-1.5">
                {['💰 Pricing', '💕 Dating', '🚗 Rides'].map(q => (
                  <button key={q}
                    onClick={() => { setOpen(true); setTeaserVisible(false); setTimeout(() => sendMessage(q), 350) }}
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-love-soft text-brand-pink border border-pink-500/20 hover:bg-love-gradient hover:text-white transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-3 h-3 dark:bg-[#130E1E] bg-white border-r border-b dark:border-white/8 border-gray-100 rotate-45 ml-auto mr-5 -mt-1.5 shadow-sm" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Float Button ── */}
      <motion.button
        onClick={() => { setOpen(!open); setTeaserVisible(false); setUnreadCount(0) }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[9997] w-[45px] h-[45px] rounded-full bg-love-gradient shadow-2xl shadow-pink-500/40 flex items-center justify-center"
        title="Open support chat"
      >
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-md animate-bounce">
            {unreadCount}
          </span>
        )}
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="w-5 h-5 text-white" />
              </motion.div>
            : <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <MessageCircle className="w-5 h-5 text-white" />
              </motion.div>
          }
        </AnimatePresence>
      </motion.button>
    </>
  )
}
