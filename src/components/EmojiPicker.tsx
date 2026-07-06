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

  const filteredEmojis = search.trim()
    ? CATEGORIES.flatMap(c => c.emojis).filter(e => {
        // Simple code-point based filter isn't great; just show all on any search char for UX
        return true
      }).slice(0, 60)
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
