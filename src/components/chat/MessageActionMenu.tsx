import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Forward, Reply, Smile } from 'lucide-react'

interface MessageActionMenuProps {
  open: boolean
  isMine: boolean
  onClose: () => void
  onDelete?: () => void
  onForward: () => void
  onReply: () => void
  onReact: () => void
  align?: 'left' | 'right'
}

export default function MessageActionMenu({
  open,
  isMine,
  onClose,
  onDelete,
  onForward,
  onReply,
  onReact,
  align = 'right',
}: MessageActionMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.88, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: -4 }}
          transition={{ duration: 0.12 }}
          onClick={e => e.stopPropagation()}
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} -top-2 -translate-y-full z-30
            dark:bg-white bg-white rounded-2xl shadow-xl border dark:border-pink-200 border-gray-100
            min-w-[148px] overflow-hidden`}
        >
          <button
            onClick={() => { onReact(); onClose() }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm dark:text-gray-700 text-gray-700 hover:dark:bg-pink-50 hover:bg-gray-50 transition-colors"
          >
            <Smile className="w-4 h-4 text-pink-400" /> React
          </button>
          <button
            onClick={() => { onReply(); onClose() }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm dark:text-gray-700 text-gray-700 hover:dark:bg-pink-50 hover:bg-gray-50 transition-colors"
          >
            <Reply className="w-4 h-4 text-blue-400" /> Reply
          </button>
          <button
            onClick={() => { onForward(); onClose() }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm dark:text-gray-700 text-gray-700 hover:dark:bg-pink-50 hover:bg-gray-50 transition-colors"
          >
            <Forward className="w-4 h-4 text-green-400" /> Forward
          </button>
          {isMine && onDelete && (
            <button
              onClick={() => { onDelete(); onClose() }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t dark:border-pink-100 border-gray-100"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
