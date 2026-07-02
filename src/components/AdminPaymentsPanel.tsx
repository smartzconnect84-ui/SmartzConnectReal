import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, RefreshCw, Smartphone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MOBILE_MONEY_CONFIG } from '@/lib/mobileMoney'

interface Payment {
  id: string
  user_id: string
  provider: 'mtn' | 'orange'
  amount_usd: number
  plan_id: string
  transaction_id: string
  status: 'pending_verification' | 'verified' | 'rejected' | 'expired'
  expires_at: string
  created_at: string
  profiles?: { full_name: string; email: string; username: string }
}

export default function AdminPaymentsPanel() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending_verification' | 'verified' | 'rejected'>('pending_verification')

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('mobile_money_payments')
        .select('*, profiles(full_name, email, username)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) setPayments(data as Payment[])
    } catch (e) {
      console.warn('Payments fetch error (dev mode):', e)
      // Show mock data in dev
      setPayments([
        {
          id: '1', user_id: 'u1', provider: 'mtn', amount_usd: 9.99, plan_id: 'premium',
          transaction_id: 'TXN123456789', status: 'pending_verification',
          expires_at: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          profiles: { full_name: 'Amara K.', email: 'amara@example.com', username: 'amara_k' }
        },
        {
          id: '2', user_id: 'u2', provider: 'orange', amount_usd: 24.99, plan_id: 'vip',
          transaction_id: 'ORG987654321', status: 'pending_verification',
          expires_at: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
          profiles: { full_name: 'Kofi A.', email: 'kofi@example.com', username: 'kofi_a' }
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPayments() }, [])

  const handleVerify = async (paymentId: string) => {
    setProcessing(paymentId)
    try {
      const { error } = await supabase
        .from('mobile_money_payments')
        .update({ status: 'verified', verified_at: new Date().toISOString() })
        .eq('id', paymentId)
      if (!error) {
        setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'verified' } : p))
      }
    } catch {
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'verified' } : p))
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (paymentId: string) => {
    setProcessing(paymentId)
    try {
      const { error } = await supabase
        .from('mobile_money_payments')
        .update({ status: 'rejected' })
        .eq('id', paymentId)
      if (!error) {
        setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'rejected' } : p))
      }
    } catch {
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'rejected' } : p))
    } finally {
      setProcessing(null)
    }
  }

  const getTimeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    const m = Math.floor(diff / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return `${m}m ${s}s`
  }

  const filtered = payments.filter(p => filter === 'all' || p.status === filter)
  const pendingCount = payments.filter(p => p.status === 'pending_verification').length

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
        {(['pending_verification', 'verified', 'rejected', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold capitalize transition-all ${filter === f ? 'bg-love-gradient text-white' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
            {f === 'pending_verification' ? '⏳ Pending' : f === 'verified' ? '✅ Verified' : f === 'rejected' ? '❌ Rejected' : '📋 All'}
            {f === 'pending_verification' && pendingCount > 0 && (
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
            <CheckCircle2 className="w-10 h-10 dark:text-gray-700 text-gray-300 mx-auto mb-2" />
            <p className="text-sm dark:text-gray-500 text-gray-400">No payments in this category</p>
          </div>
        ) : (
          filtered.map((payment, i) => {
            const cfg = MOBILE_MONEY_CONFIG[payment.provider]
            const isPending = payment.status === 'pending_verification'
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
                          payment.status === 'pending_verification' ? 'bg-amber-500/15 text-amber-400' :
                          payment.status === 'verified' ? 'bg-emerald-500/15 text-emerald-400' :
                          payment.status === 'rejected' ? 'bg-red-500/15 text-red-400' :
                          'dark:bg-white/8 bg-gray-100 dark:text-gray-400 text-gray-500'
                        }`}>
                          {payment.status === 'pending_verification' ? '⏳ Pending' :
                           payment.status === 'verified' ? '✅ Verified' :
                           payment.status === 'rejected' ? '❌ Rejected' : '💀 Expired'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                      <span className="text-[10px] dark:text-gray-500 text-gray-400">
                        <span className="font-medium dark:text-gray-300 text-gray-600">Provider:</span> {cfg.name}
                      </span>
                      <span className="text-[10px] dark:text-gray-500 text-gray-400">
                        <span className="font-medium dark:text-gray-300 text-gray-600">Plan:</span> {payment.plan_id.toUpperCase()}
                      </span>
                      <span className="text-[10px] dark:text-gray-500 text-gray-400">
                        <span className="font-medium dark:text-gray-300 text-gray-600">Submitted:</span> {new Date(payment.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Transaction ID */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 px-3 py-1.5 rounded-lg dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200">
                        <p className="text-[10px] dark:text-gray-500 text-gray-400 mb-0.5">Transaction ID</p>
                        <p className="text-xs font-mono font-bold dark:text-white text-gray-900">{payment.transaction_id}</p>
                      </div>
                      {isPending && (
                        <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span className="text-[10px] font-mono font-bold text-amber-400">{getTimeLeft(payment.expires_at)}</span>
                        </div>
                      )}
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
