import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flag, Shield, X, AlertTriangle, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Props {
  open: boolean
  onClose: () => void
  targetUserId?: string
  targetName?: string
}

const REPORT_REASONS = [
  'Fake profile / Impersonation',
  'Harassment or bullying',
  'Inappropriate content',
  'Spam or scam',
  'Underage user',
  'Hate speech',
  'Sexual content',
  'Other',
]

export default function ReportBlockModal({ open, onClose, targetUserId, targetName }: Props) {
  const { user } = useAuth()
  const [tab, setTab] = useState<'report' | 'block'>('report')
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleReport = async () => {
    if (!reason) return
    setLoading(true)
    await supabase.from('user_reports').insert({
      reporter_id: user?.id,
      reported_user_id: targetUserId,
      reason,
      details,
    }).then(() => {})
    setLoading(false)
    setDone(true)
    setTimeout(() => { setDone(false); onClose() }, 2000)
  }

  const handleBlock = async () => {
    setLoading(true)
    await supabase.from('user_blocks').insert({
      blocker_id: user?.id,
      blocked_user_id: targetUserId,
    }).then(() => {})
    setLoading(false)
    setDone(true)
    setTimeout(() => { setDone(false); onClose() }, 2000)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50 dark:bg-[#130E1E] bg-white rounded-3xl border dark:border-white/10 border-gray-200 shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between p-4 border-b dark:border-white/8 border-gray-100">
              <div>
                <h3 className="font-bold text-sm dark:text-white text-gray-900">
                  {targetName ? `Report / Block ${targetName}` : 'Report / Block User'}
                </h3>
                <p className="text-xs dark:text-gray-500 text-gray-400">Help keep SmartzConnect safe</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {done ? (
              <div className="p-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Check className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="font-bold dark:text-white text-gray-900">
                  {tab === 'report' ? 'Report submitted' : 'User blocked'}
                </p>
                <p className="text-xs dark:text-gray-400 text-gray-500 text-center">
                  {tab === 'report'
                    ? 'Our safety team will review your report within 24 hours.'
                    : 'You will no longer see content from this user.'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-1 p-3 dark:bg-white/3 bg-gray-50">
                  {(['report', 'block'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${tab === t ? 'bg-love-gradient text-white shadow-md' : 'dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
                      {t === 'report' ? <><Flag className="w-3.5 h-3.5" /> Report</> : <><Shield className="w-3.5 h-3.5" /> Block</>}
                    </button>
                  ))}
                </div>

                <div className="p-4 space-y-3">
                  {tab === 'report' ? (
                    <>
                      <div>
                        <label className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-2">Reason</label>
                        <div className="grid grid-cols-2 gap-2">
                          {REPORT_REASONS.map(r => (
                            <button key={r} onClick={() => setReason(r)}
                              className={`text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border ${reason === r ? 'bg-love-soft text-brand-pink border-pink-500/30' : 'dark:bg-white/3 bg-gray-50 dark:text-gray-400 text-gray-600 dark:border-white/8 border-gray-200 hover:border-pink-300'}`}>
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold dark:text-gray-400 text-gray-500 uppercase tracking-wider block mb-2">Additional Details (optional)</label>
                        <textarea value={details} onChange={e => setDetails(e.target.value)} rows={3}
                          placeholder="Tell us more about what happened…"
                          className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-brand-pink transition-colors resize-none" />
                      </div>
                      <div className="flex items-start gap-2 p-3 dark:bg-amber-500/8 bg-amber-50 rounded-xl border dark:border-amber-500/15 border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] dark:text-amber-400 text-amber-700">False reports may result in account action. Reports are reviewed by our safety team.</p>
                      </div>
                      <button onClick={handleReport} disabled={!reason || loading}
                        className="w-full py-3 rounded-xl bg-love-gradient text-white text-sm font-bold shadow-md shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><Flag className="w-4 h-4" /> Submit Report</>}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="p-4 dark:bg-white/3 bg-gray-50 rounded-2xl border dark:border-white/6 border-gray-100 text-center">
                        <Shield className="w-10 h-10 text-brand-pink mx-auto mb-2" />
                        <p className="font-bold text-sm dark:text-white text-gray-900 mb-1">Block {targetName || 'this user'}?</p>
                        <p className="text-xs dark:text-gray-400 text-gray-500">They won't be able to message you, see your profile, or interact with your content.</p>
                      </div>
                      <button onClick={handleBlock} disabled={loading}
                        className="w-full py-3 rounded-xl bg-red-500 text-white text-sm font-bold shadow-md shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><Shield className="w-4 h-4" /> Block User</>}
                      </button>
                      <button onClick={onClose} className="w-full py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 text-sm font-semibold hover:text-brand-pink transition-colors">
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
