import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, FileText, Image, Play, Radio, Users, Calendar, ShoppingBag, BookOpen } from 'lucide-react'

const createOptions = [
  { icon: FileText,    label: 'Post',     description: 'Share thoughts with your network',    color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  { icon: Image,       label: 'Story',    description: 'A moment that disappears in 24h',     color: 'text-pink-400',   bg: 'bg-pink-500/10' },
  { icon: Play,        label: 'Reel',     description: 'Create a short video reel',            color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { icon: Radio,       label: 'Go Live',  description: 'Broadcast live to your community',     color: 'text-red-400',    bg: 'bg-red-500/10' },
  { icon: Users,       label: 'Group',    description: 'Create a new community group',         color: 'text-teal-400',   bg: 'bg-teal-500/10' },
  { icon: BookOpen,    label: 'Page',     description: 'Create a business or creator page',    color: 'text-sky-400',    bg: 'bg-sky-500/10' },
  { icon: Calendar,    label: 'Event',    description: 'Organize an event for your community', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { icon: ShoppingBag, label: 'Listing',  description: 'Post a marketplace listing',           color: 'text-amber-400',  bg: 'bg-amber-500/10' },
]

export default function CreateModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-30 w-14 h-14 rounded-2xl bg-love-gradient text-white shadow-xl shadow-pink-500/30 flex items-center justify-center"
        aria-label="Open create menu"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Plus className="w-6 h-6" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="fixed inset-x-4 bottom-24 md:inset-auto md:bottom-24 md:right-6 md:w-80 z-50 dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 shadow-2xl shadow-black/40 overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Create new content"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/6 border-gray-100">
                <div>
                  <p className="font-bold text-sm dark:text-white text-gray-900">Create</p>
                  <p className="text-[11px] dark:text-gray-500 text-gray-400">What would you like to share?</p>
                </div>
                <button onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-pink-500/10 transition-colors">
                  <X className="w-3.5 h-3.5 dark:text-gray-400 text-gray-600" />
                </button>
              </div>

              <div className="p-2 grid grid-cols-2 gap-1">
                {createOptions.map(option => {
                  const Icon = option.icon
                  return (
                    <motion.button
                      key={option.label}
                      onClick={() => setOpen(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-start gap-2.5 p-3 rounded-xl dark:hover:bg-white/5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className={`w-8 h-8 rounded-xl ${option.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className={`w-4 h-4 ${option.color}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold dark:text-white text-gray-900">{option.label}</p>
                        <p className="text-[10px] dark:text-gray-500 text-gray-400 leading-snug mt-0.5">{option.description}</p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
