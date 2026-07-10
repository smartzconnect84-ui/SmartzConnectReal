import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, Video } from 'lucide-react'
import { useLiveKitCall } from '@/contexts/LiveKitCallContext'
import { startRinging, stopRinging } from '@/lib/callSounds'

export default function IncomingCall() {
  const { incomingCall, acceptCall, declineCall } = useLiveKitCall()
  const [timeLeft, setTimeLeft] = useState(60)
  const [avatarFailed, setAvatarFailed] = useState(false)

  useEffect(() => { if (incomingCall) setAvatarFailed(false) }, [incomingCall?.notificationId])

  // Ring while an incoming call is waiting
  useEffect(() => {
    if (incomingCall) {
      startRinging()
    } else {
      stopRinging()
    }
    return () => stopRinging()
  }, [!!incomingCall])

  useEffect(() => {
    if (!incomingCall) { setTimeLeft(60); return }
    const remaining = Math.max(0, Math.floor(
      (new Date(incomingCall.expiresAt).getTime() - Date.now()) / 1000
    ))
    setTimeLeft(remaining)
    const iv = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(iv)
  }, [incomingCall])

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div
          key="incoming"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.85, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 50 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative z-10 flex flex-col items-center gap-8 px-8 py-12 rounded-3xl
                       bg-gradient-to-b from-[#1a1028] to-[#0D0A14]
                       border border-white/10 shadow-2xl w-80 max-w-[90vw]"
          >
            {/* Call type badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/8 border border-white/10">
              {incomingCall.type === 'video'
                ? <Video className="w-3.5 h-3.5 text-blue-400" />
                : <Phone className="w-3.5 h-3.5 text-emerald-400" />
              }
              <span className="text-xs font-semibold text-white/70">
                Incoming {incomingCall.type === 'video' ? 'Video' : 'Audio'} Call
              </span>
            </div>

            {/* Pulsing avatar */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-32 h-32 rounded-full bg-brand-pink/15 animate-ping" style={{ animationDuration: '1.6s' }} />
              <div className="absolute w-40 h-40 rounded-full bg-brand-pink/8 animate-pulse" style={{ animationDuration: '2s' }} />
              <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-brand-pink/50 bg-love-gradient flex items-center justify-center shadow-2xl shadow-brand-pink/30">
                {incomingCall.fromAvatar && !avatarFailed
                  ? <img src={incomingCall.fromAvatar} alt="" onError={() => setAvatarFailed(true)} className="w-full h-full object-cover" />
                  : <span className="text-4xl">👤</span>
                }
              </div>
            </div>

            {/* Caller info */}
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{incomingCall.fromName}</p>
              <p className="text-sm text-white/40 mt-1">
                {timeLeft > 0 ? `Ringing… ${timeLeft}s` : 'Missed'}
              </p>
            </div>

            {/* Accept / Decline */}
            <div className="flex items-center gap-14">
              {/* Decline */}
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={declineCall}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center
                             shadow-xl shadow-red-500/40 transition-colors"
                >
                  <PhoneOff className="w-7 h-7 text-white" />
                </motion.button>
                <span className="text-xs font-semibold text-white/50">Decline</span>
              </div>

              {/* Accept */}
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={acceptCall}
                  className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center
                             shadow-xl shadow-emerald-500/40 transition-colors"
                >
                  {incomingCall.type === 'video'
                    ? <Video className="w-7 h-7 text-white" />
                    : <Phone className="w-7 h-7 text-white" />
                  }
                </motion.button>
                <span className="text-xs font-semibold text-white/50">Answer</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
