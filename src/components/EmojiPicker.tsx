import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose?: () => void
}

const CATEGORIES: { label: string; icon: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    icon: '😊',
    emojis: [
      '😊','😍','🥰','😘','😂','🤣','😭','😢','😅','😆','😁','😀','🤩','😎','🥳',
      '🤗','😏','😒','😤','😠','😡','🤬','😈','🥺','😔','😟','😞','😕','🙁','☹️',
      '😳','🤯','😱','😨','😰','😥','😓','🤔','🤭','🤫','🤥','😶','😐','😑','😬',
    ],
  },
  {
    label: 'People',
    icon: '👋',
    emojis: [
      '👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉',
      '👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','🤲','🤝','🙏',
      '💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️',
    ],
  },
  {
    label: 'Hearts',
    icon: '❤️',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕',
      '💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎',
      '☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒',
    ],
  },
  {
    label: 'Nature',
    icon: '🌸',
    emojis: [
      '🌸','🌺','🌻','🌹','🌷','🌼','💐','🍀','🌿','🌱','🌲','🌳','🌴','🌵','🎋',
      '🎍','🍃','🍂','🍁','🌾','🌐','🌍','🌎','🌏','🌑','🌒','🌓','🌔','🌕','🌖',
      '🌊','🌬','🌀','🌈','⚡','🔥','💧','🌙','⭐','🌟','💫','✨','☄️','☀️','🌤️',
    ],
  },
  {
    label: 'Food',
    icon: '🍕',
    emojis: [
      '🍕','🍔','🌮','🌯','🥙','🧆','🥚','🍳','🥘','🍲','🥣','🥗','🍿','🧂','🥫',
      '🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🍣','🍤','🍥','🥮','🍡','🥟',
      '🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍼',
    ],
  },
  {
    label: 'Activity',
    icon: '⚽',
    emojis: [
      '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🥊',
      '🥋','🎯','🎳','🏹','🎣','🤿','🎽','🎿','🛷','🥌','🪂','🏋️','🤸','⛹️','🤺',
      '🏇','⛷️','🏂','🪁','🏄','🚣','🧗','🚴','🏊','🤽','🏌️','🏇','🧘','🛹','🛼',
    ],
  },
  {
    label: 'Travel',
    icon: '✈️',
    emojis: [
      '✈️','🚀','🛸','🚁','🛶','⛵','🚤','🛥️','🛳️','⛴️','🚢','🚂','🚃','🚄','🚅',
      '🚆','🚇','🚈','🚉','🚊','🚝','🚞','🚋','🚌','🚍','🚎','🏎️','🚐','🚑','🚒',
      '🚓','🚔','🚕','🚖','🚗','🚘','🚙','🛻','🚚','🚛','🚜','🏍️','🛵','🚲','🛴',
    ],
  },
  {
    label: 'Objects',
    icon: '💡',
    emojis: [
      '💡','🔦','🕯️','💰','💴','💵','💶','💷','💸','💳','🪙','💎','⚖️','🔑','🗝️',
      '🔐','🔒','🔓','🔏','🗄️','🗃️','📁','📂','🗂️','📋','📊','📈','📉','📆','📅',
      '📞','☎️','📟','📠','📺','📻','🧭','⏱️','⏲️','⏰','⌛','⏳','📡','🔋','🪫',
    ],
  },
  {
    label: 'Symbols',
    icon: '💯',
    emojis: [
      '💯','✅','❌','❓','❗','‼️','⁉️','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪',
      '🟤','🔶','🔷','🔸','🔹','🔺','🔻','💠','🔘','🔲','🔳','⬛','⬜','◼️','◻️',
      '🆕','🆙','🆒','🆓','🆖','🆗','🆙','🆚','🉐','🈹','🈲','🅰️','🅱️','🅾️','🆎',
    ],
  },
]

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0)
  const [search, setSearch] = useState('')

  // Flat list of { emoji, keywords } for search
  const EMOJI_KEYWORDS: Record<string, string> = {
    '😊': 'smile happy', '😍': 'love heart eyes', '🥰': 'love adore', '😘': 'kiss', '😂': 'laugh cry funny',
    '🤣': 'rofl laugh', '😭': 'cry sad sob', '😢': 'cry tear sad', '😅': 'sweat smile awkward',
    '😆': 'laugh grin', '😁': 'beam grin', '😀': 'grinning happy', '🤩': 'star eyes excited',
    '😎': 'cool sunglasses', '🥳': 'party celebrate', '🤗': 'hug', '😏': 'smirk', '😒': 'unamused',
    '😤': 'triumph snort', '😠': 'angry', '😡': 'rage angry', '🤬': 'cursing angry', '😈': 'devil evil',
    '🥺': 'pleading puppy eyes', '😔': 'pensive sad', '😟': 'worried', '😞': 'disappointed',
    '❤️': 'heart love red', '🧡': 'heart orange', '💛': 'heart yellow', '💚': 'heart green',
    '💙': 'heart blue', '💜': 'heart purple', '🖤': 'heart black', '💕': 'two hearts love',
    '💞': 'revolving hearts', '💓': 'beating heart', '💗': 'growing heart', '💖': 'sparkling heart',
    '💘': 'heart arrow love', '💝': 'heart ribbon', '💔': 'broken heart', '❤️‍🔥': 'heart fire passion',
    '👍': 'thumbs up good ok', '👎': 'thumbs down bad', '👋': 'wave hello hi', '✌️': 'peace victory',
    '🤞': 'crossed fingers luck', '👌': 'ok perfect', '🤝': 'handshake deal', '🙏': 'pray thanks please',
    '👏': 'clap applause', '🙌': 'hands up celebrate', '💪': 'muscle strong flex',
    '🔥': 'fire hot', '⭐': 'star', '✨': 'sparkles shine', '💫': 'dizzy star',
    '🌸': 'cherry blossom flower', '🌺': 'hibiscus flower', '🌻': 'sunflower', '🌹': 'rose flower',
    '🍕': 'pizza food', '🍔': 'burger food', '🎉': 'party celebrate tada', '🎊': 'confetti party',
    '🚀': 'rocket launch', '✈️': 'plane travel fly', '🎵': 'music note', '🎶': 'musical notes',
    '💯': 'hundred percent perfect ok', '✅': 'check done yes', '❌': 'cross no wrong',
    '😱': 'scream shocked', '🤔': 'thinking hmm',
  }

  const q = search.trim().toLowerCase()
  const filteredEmojis = q
    ? (() => {
        const all = CATEGORIES.flatMap(c => c.emojis)
        // Priority 1: keyword match, Priority 2: category name match
        const catMatches = CATEGORIES.filter(c => c.label.toLowerCase().includes(q)).flatMap(c => c.emojis)
        const kwMatches  = all.filter(e => (EMOJI_KEYWORDS[e] || '').includes(q))
        const combined   = [...new Set([...kwMatches, ...catMatches])]
        return combined.length ? combined.slice(0, 60) : all.slice(0, 60)
      })()
    : CATEGORIES[activeCategory].emojis

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full mb-2 left-0 z-50 w-72 rounded-2xl shadow-xl border border-gray-100 dark:border-pink-200 bg-white dark:bg-white overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search emoji…"
          className="w-full text-xs px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-pink-50 focus:outline-none dark:text-gray-800 text-gray-800 placeholder:text-gray-400"
          autoFocus
        />
      </div>

      {/* Category tabs */}
      {!search.trim() && (
        <div className="flex gap-0.5 px-2 pb-1 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(i)}
              title={cat.label}
              className={`flex-shrink-0 w-8 h-8 rounded-lg text-base flex items-center justify-center transition-colors
                ${activeCategory === i ? 'bg-pink-100 dark:bg-pink-100' : 'hover:bg-gray-100 dark:hover:bg-pink-50'}`}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-0.5 px-2 pb-3 max-h-48 overflow-y-auto">
        {filteredEmojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            onClick={() => { onSelect(emoji); onClose?.() }}
            className="w-8 h-8 text-lg flex items-center justify-center rounded-lg hover:bg-pink-100 dark:hover:bg-pink-100 transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
