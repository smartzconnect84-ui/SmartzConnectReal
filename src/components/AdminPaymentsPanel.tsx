import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, RefreshCw, Smartphone, InboxIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MOBILE_MONEY_CONFIG } from '@/lib/mobileMoney'

type PaymentStatus = 'pending' | 'confirmed' | 'rejected' | 'refunded'
type FilterType = 'all' | 'pending' | 'confirmed' | 'rejected' | 'refunded'

interface Payment {
  id: string
  user_id: string
  provider: 'mtn' | 'orange' | 'other'
  amount_usd: number
  plan_id: string
  transaction_id: string
  status: PaymentStatus
  created_at: string
  verified_at: string | null
  profiles?: { full_name: string; email: string; username: string }
}

export default function AdminPaymentsPanel() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('pending')

  const fetchPayments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('mobile_money_payments')
      .select('*, profiles(full_name, email, username)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      setPayments(data as Payment[])
    } else if (error) {
      console.warn('Payments fetch error:', error.message)
    }
    setLoading(false)
  }

  useEffect(() => { fetchPayments() }, [])

  const handleVerify = async (paymentId: string) => {
    setProcessing(paymentId)
    const { error } = await supabase
      .from('mobile_money_payments')
      .update({ status: 'confirmed', verified_at: new Date().toISOString() })
      .eq('id', paymentId)

    if (!error) {
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'confirmed' as PaymentStatus, verified_at: new Date().toISOString() } : p))
    }
    setProcessing(null)
  }

  const handleReject = async (paymentId: string) => {
    setProcessing(paymentId)
    const { error } = await supabase
      .from('mobile_money_payments')
      .update({ status: 'rejected' })
      .eq('id', paymentId)

    if (!error) {
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'rejected' as PaymentStatus } : p))
    }
    setProcessing(null)
  }

  const filtered = payments.filter(p => filter === 'all' || p.status === filter)
  const pendingCount = payments.filter(p => p.status === 'pending').length

  return (
    <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-pink-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/6 border-pink-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-love-gradient flex items-center justify-center">
            <Smartphone className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold dark:text-white text-gray-900">Mobile Money Payments</h3>
            {pendingCount > 0 && (
              <p className="text-xs text-amber-400 font-medium">{pendingCount} pending verification</p>
            )}
          </div>
        </div>
        <button onClick={fetchPayments} className="w-8 h-8 rounded-lg dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-pink-500/10 transition-colors">
          <RefreshCw className={`w-4 h-4 dark:text-gray-400 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-3 border-b dark:border-white/5 border-gray-100">
        {(['pending', 'confirmed', 'rejected', 'refunded', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold capitalize transition-all ${filter === f ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
            {f === 'pending'   ? '⏳ Pending'
            : f === 'confirmed' ? '✅ Verified'
            : f === 'rejected'  ? '❌ Rejected'
            : f === 'refunded'  ? '↩️ Refunded'
            :                    '📋 All'}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-black inline-flex items-center justify-center">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Payments list */}
      <div className="divide-y dark:divide-white/4 divide-gray-50">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-pink-500/30 border-t-brand-pink rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <InboxIcon className="w-10 h-10 dark:text-gray-700 text-gray-300 mx-auto mb-2" />
            <p className="text-sm dark:text-gray-500 text-gray-400">No payments in this category</p>
          </div>
        ) : (
          filtered.map((payment, i) => {
            const cfg = MOBILE_MONEY_CONFIG[payment.provider as keyof typeof MOBILE_MONEY_CONFIG] ?? MOBILE_MONEY_CONFIG['mtn']
            const isPending = payment.status === 'pending'
            const isProcessing = processing === payment.id

            return (
              <motion.div key={payment.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="p-4 hover:dark:bg-white/2 hover:bg-pink-50/20 transition-colors">
                <div className="flex items-start gap-3">
                  {/* Provider icon */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.bgColor} border ${cfg.borderColor} flex items-center justify-center text-xl flex-shrink-0`}>
                    {cfg.logo}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-sm font-semibold dark:text-white text-gray-900">
                          {payment.profiles?.full_name || 'Unknown User'}
                        </p>
                        <p className="text-[10px] dark:text-gray-500 text-gray-400">
                          @{payment.profiles?.username || '—'} · {payment.profiles?.email || '—'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black text-brand-pink">${payment.amount_usd}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          payment.status === 'pending'   ? 'bg-amber-500/15 text-amber-400' :
                          payment.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-400' :
                          payment.status === 'rejected'  ? 'bg-red-500/15 text-red-400' :
                                                           'dark:bg-white/8 bg-gray-100 dark:text-gray-400 text-gray-500'
                        }`}>
                          {payment.status === 'pending'   ? '⏳ Pending' :
                           payment.status === 'confirmed' ? '✅ Verified' :
                           payment.status === 'rejected'  ? '❌ Rejected' : '↩️ Refunded'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                      <span className="text-[10px] dark:text-gray-500 text-gray-400">
                        <span className="font-medium dark:text-gray-300 text-gray-600">Provider:</span> {cfg.name}
                      </span>
                      <span className="text-[10px] dark:text-gray-500 text-gray-400">
                        <span className="font-medium dark:text-gray-300 text-gray-600">Plan:</span> {(payment.plan_id || '').toUpperCase()}
                      </span>
                      <span className="text-[10px] dark:text-gray-500 text-gray-400">
                        <span className="font-medium dark:text-gray-300 text-gray-600">Submitted:</span> {new Date(payment.created_at).toLocaleString()}
                      </span>
                      {payment.verified_at && (
                        <span className="text-[10px] dark:text-gray-500 text-gray-400">
                          <span className="font-medium dark:text-gray-300 text-gray-600">Verified:</span> {new Date(payment.verified_at).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Transaction ID */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 px-3 py-1.5 rounded-lg dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200">
                        <p className="text-[10px] dark:text-gray-500 text-gray-400 mb-0.5">Transaction ID</p>
                        <p className="text-xs font-mono font-bold dark:text-white text-gray-900">{payment.transaction_id || '—'}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {isPending && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerify(payment.id)}
                          disabled={isProcessing}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-all disabled:opacity-50"
                        >
                          {isProcessing ? <div className="w-3.5 h-3.5 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Verify & Activate
                        </button>
                        <button
                          onClick={() => handleReject(payment.id)}
                          disabled={isProcessing}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
