import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Minimize2, Maximize2, Phone, ExternalLink, Bot, User, ChevronDown } from 'lucide-react'
const logoImg = '/logo.png'
import { useLiveChat } from '@/contexts/LiveChatContext'

interface ChatMessage {
  id: string
  text: string
  isBot: boolean
  time: string
  options?: string[]
}

const WHATSAPP_NUMBER = '231776679963'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`

const botKnowledge: Record<string, string> = {
  'hello|hi|hey|hola': `Hi there! 👋 Welcome to **SmartzConnect** — Africa's #1 social, dating & community platform! I'm your 24/7 assistant. How can I help you today?`,
  'pricing|plans|cost|price|subscription|free|premium|vip': `💎 **Our Plans:**\n\n🆓 **Free** — Browse profiles, basic chat, social feed\n💕 **Premium ($9.99/mo)** — Unlimited swipes, see who liked you, priority matching\n👑 **VIP ($24.99/mo)** — All Premium + live streaming, marketplace seller, ride priority\n\nPay via MTN MoMo or Orange Money! Want to upgrade?`,
  'payment|pay|mtn|orange|mobile money': `📱 **Payment Methods:**\n\nWe accept:\n• 🟡 **MTN Mobile Money** — +231 888 061 379\n• 🟠 **Orange Money LR** — +231 776 679 963\n\nAccount name: **Shedrick K. Nungehn**\n\nAfter sending, submit your Transaction ID in the app within 15 minutes. Need help?`,
  'dating|match|swipe|discover': `💕 **Dating on SmartzConnect:**\n\nSwipe right to like, left to pass. When both people like each other — it's a match! 🎉\n\nFeatures:\n• Tinder-style swipe cards\n• Super Like & Boost\n• Distance, age & interest filters\n\nReady to find love? Sign up free!`,
  'chat|message|whatsapp': `💬 **Chat Features:**\n\n• Private 1-on-1 messaging\n• Group rooms\n• Spin & Chat (random matching)\n• Voice notes, images, GIFs\n• Read receipts & typing indicators`,
  'marketplace|sell|buy|shop': `🛍️ **SmartzConnect Marketplace:**\n\n• List & sell products globally\n• Secure payments\n• Seller profiles & reviews\n• Admin-verified listings\n\nStart selling today — it's free for basic listings!`,
  'smartztv|live|stream|video': `📺 **SmartzTV:**\n\nLike TikTok Live but for Africa!\n• Watch & go live\n• Creator profiles\n• Video uploads\n• Live reactions & comments`,
  'ride|uber|driver|car|transport': `🚗 **SmartzRide:**\n\nUber-style ride-hailing!\n• Book rides instantly\n• Live driver tracking\n• Fare estimates\n• Become a driver & earn!`,
  'safety|safe|report|block|trust': `🛡️ **Safety & Trust:**\n\n• Profile verification badges\n• Report & block users\n• Content moderation\n• 24/7 safety team\n\nReport any issue: safety@smartzconnect.com`,
  'contact|support|help|email|phone': `📞 **Contact Us:**\n\n• 💬 **Support:** support@smartzconnect.com\n• 💼 **Business:** business@smartzconnect.com\n• 📱 **Phone/WhatsApp:** +231 776 679 963\n• 🕐 **Available:** 24/7 Online`,
  'register|signup|join|account|create': `🎉 **Join SmartzConnect Free!**\n\nSign up in 30 seconds:\n1. Click "Join Free" on the homepage\n2. Enter your name, email & password\n3. Verify your email\n4. Start connecting! 💕`,
  'countries|global|africa|liberia|worldwide': `🌍 **Global Reach:**\n\nSmartzConnect connects people across:\n• 🇱🇷 Liberia (our home!)\n• All 54 African countries\n• 195+ countries worldwide\n\nWherever you are, we connect you!`,
  'pwa|app|install|mobile|download': `📱 **Install SmartzConnect:**\n\nWe're a Progressive Web App (PWA)!\n• No app store needed\n• Install directly from your browser\n• Works offline\n• Push notifications`,
}

function getBotResponse(input: string): { text: string; options?: string[] } {
  const lower = input.toLowerCase()
  for (const [keys, response] of Object.entries(botKnowledge)) {
    if (keys.split('|').some(k => lower.includes(k))) {
      return { text: response }
    }
  }
  return {
    text: `Thanks for your message! 😊 I'm not sure about that specific topic, but I'm here to help!\n\nYou can also reach us directly:\n📱 **WhatsApp:** +231 776 679 963\n📧 **Email:** support@smartzconnect.com\n\nOr choose a topic below:`,
    options: ['💰 Pricing', '💕 Dating', '🛍️ Marketplace', '📺 SmartzTV', '🚗 Rides', '📞 Contact'],
  }
}

const quickReplies = ['💰 Pricing', '💕 Dating', '🛍️ Marketplace', '📺 SmartzTV', '🚗 Rides', '📞 Contact']

export default function LiveChat() {
  const { open, dismissed, setOpen, setDismissed, unreadCount, setUnreadCount } = useLiveChat()
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      isBot: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `👋 Hi! Welcome to **SmartzConnect** — Africa's #1 social & dating platform!\n\nI'm your 24/7 AI assistant. Ask me anything about our features, pricing, or how to get started! 💕`,
      options: quickReplies,
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [teaserVisible, setTeaserVisible] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check, { passive: true })
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  useEffect(() => {
    if (open) {
      setTeaserVisible(false)
      setUnreadCount(0)
    }
  }, [open])

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      isBot: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    setTimeout(() => {
      const { text: botText, options } = getBotResponse(text)
      setTyping(false)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: botText,
        isBot: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options,
      }])
    }, 800 + Math.random() * 600)
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, px: position.x, py: position.y }
  }
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging) return
      setPosition({
        x: dragStart.current.px + (e.clientX - dragStart.current.x),
        y: dragStart.current.py + (e.clientY - dragStart.current.y),
      })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging])

  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>
            : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  if (dismissed) return null

  // Mobile: bottom-sheet style. Desktop: floating.
  const windowStyle = isMobile
    ? { bottom: 0, left: 0, right: 0, width: '100%' }
    : { bottom: `${88 - position.y}px`, right: `${24 - position.x}px`, width: '360px', maxWidth: 'calc(100vw - 32px)' }

  const windowHeight = isMobile ? '82dvh' : (minimized ? 'auto' : '520px')

  return (
    <>
      {/* ── Chat Window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.85, y: 20 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed z-[9999] shadow-2xl shadow-pink-500/20"
            style={windowStyle}
          >
            <div
              className={`dark:bg-[#130E1E] bg-white border dark:border-white/8 border-pink-100 overflow-hidden flex flex-col ${isMobile ? 'rounded-t-3xl' : 'rounded-3xl'}`}
              style={{ height: windowHeight }}
            >
              {/* Drag handle on mobile */}
              {isMobile && (
                <div className="w-10 h-1 rounded-full dark:bg-white/20 bg-gray-300 mx-auto mt-3 mb-1 flex-shrink-0" />
              )}

              {/* Header */}
              <div
                onMouseDown={onMouseDown}
                className={`flex items-center justify-between px-4 py-3 bg-love-gradient flex-shrink-0 ${!isMobile ? 'cursor-grab active:cursor-grabbing' : ''} select-none`}
              >
                <div className="flex items-center gap-2.5">
                  <img src={logoImg} alt="SmartzConnect" className="w-8 h-8 rounded-xl object-contain bg-white/20 p-0.5" />
                  <div>
                    <p className="text-white font-bold text-sm">SmartzConnect Support</p>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      <p className="text-white/80 text-[10px]">24/7 Online · AI + Human</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!isMobile && (
                    <button onClick={() => setMinimized(!minimized)} className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors" title={minimized ? 'Expand' : 'Minimize'}>
                      {minimized ? <Maximize2 className="w-3.5 h-3.5 text-white" /> : <Minimize2 className="w-3.5 h-3.5 text-white" />}
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors" title="Close">
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button
                    onClick={() => { setOpen(false); setDismissed(true) }}
                    className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center hover:bg-red-400/40 transition-colors"
                    title="Move to menu bar"
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>

              {(!minimized || isMobile) && (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex gap-2 ${msg.isBot ? '' : 'flex-row-reverse'}`}>
                        {msg.isBot && (
                          <div className="w-7 h-7 rounded-full bg-love-gradient flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <div className={`max-w-[85%] ${msg.isBot ? '' : 'items-end flex flex-col'}`}>
                          <div className={`px-3 py-2.5 rounded-2xl text-xs leading-relaxed ${
                            msg.isBot
                              ? 'dark:bg-white/8 bg-gray-100 dark:text-white text-gray-900 rounded-tl-sm'
                              : 'bg-love-gradient text-white rounded-tr-sm'
                          }`}>
                            {formatText(msg.text)}
                          </div>
                          {msg.options && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {msg.options.map(opt => (
                                <button key={opt} onClick={() => sendMessage(opt)}
                                  className="px-2.5 py-1 rounded-full text-[10px] font-semibold border dark:border-pink-500/30 border-pink-200 dark:text-pink-300 text-pink-600 hover:bg-pink-500/10 transition-colors">
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                          <span className="text-[9px] dark:text-gray-600 text-gray-400 mt-1">{msg.time}</span>
                        </div>
                        {!msg.isBot && (
                          <div className="w-7 h-7 rounded-full dark:bg-white/8 bg-gray-100 flex items-center justify-center flex-shrink-0 mt-1">
                            <User className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))}
                    {typing && (
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-love-gradient flex items-center justify-center flex-shrink-0">
                          <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm dark:bg-white/8 bg-gray-100 flex items-center gap-1">
                          {[0, 1, 2].map(i => (
                            <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, delay: i * 0.15, repeat: Infinity }}
                              className="w-1.5 h-1.5 rounded-full bg-brand-pink" />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* WhatsApp CTA */}
                  <div className="px-4 py-2 border-t dark:border-white/5 border-gray-100 flex-shrink-0">
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold hover:bg-emerald-500/20 transition-colors">
                      <Phone className="w-3.5 h-3.5" />
                      Chat on WhatsApp · +231 776 679 963
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t dark:border-white/6 border-pink-100 flex-shrink-0" style={{ paddingBottom: isMobile ? 'max(12px, env(safe-area-inset-bottom))' : '12px' }}>
                    <div className="flex items-center gap-2 dark:bg-white/5 bg-gray-50 rounded-xl border dark:border-white/8 border-gray-200 px-3 py-2">
                      <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                        placeholder="Ask anything..."
                        className="flex-1 bg-transparent text-xs dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none"
                      />
                      <button onClick={() => sendMessage(input)} disabled={!input.trim()}
                        className="w-7 h-7 rounded-lg bg-love-gradient flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-all">
                        <Send className="w-3 h-3 text-white" />
                      </button>
                    </div>
                    <p className="text-[9px] dark:text-gray-600 text-gray-400 text-center mt-1.5">
                      Tap <ChevronDown className="inline w-2.5 h-2.5 mx-0.5" /> to move chat to menu bar
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Backdrop on mobile ── */}
      <AnimatePresence>
        {open && isMobile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] md:hidden"
          />
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
            className="fixed bottom-[148px] right-4 md:bottom-24 md:right-6 z-[9997] max-w-[220px]"
          >
            <div className="dark:bg-[#130E1E] bg-white rounded-2xl rounded-br-sm p-3.5 shadow-xl shadow-pink-500/15 border dark:border-white/8 border-gray-100 relative">
              <button onClick={() => setTeaserVisible(false)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full dark:bg-[#130E1E] bg-white border dark:border-white/10 border-gray-200 flex items-center justify-center hover:text-brand-pink transition-colors shadow-sm">
                <X className="w-2.5 h-2.5 dark:text-gray-400 text-gray-500" />
              </button>
              <p className="text-xs dark:text-white text-gray-900 font-semibold mb-2">👋 Need help? Ask me anything!</p>
              <div className="flex flex-wrap gap-1.5">
                {['💰 Pricing', '💕 Dating', '🚗 Rides'].map(q => (
                  <button key={q} onClick={() => { setOpen(true); setTeaserVisible(false); setTimeout(() => sendMessage(q), 300) }}
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

      {/* ── Floating Button ── above bottom-nav on mobile (bottom-20=80px), normal on desktop ── */}
      <motion.button
        onClick={() => { setOpen(!open); setTeaserVisible(false); setUnreadCount(0) }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[9997] w-14 h-14 rounded-full bg-love-gradient shadow-2xl shadow-pink-500/40 flex items-center justify-center"
        title="Open support chat"
      >
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-md animate-bounce">
            {unreadCount}
          </span>
        )}
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  )
}
