import { useEffect, useState } from 'react'
import { Gift, Copy, Check, Users, Phone, MessageCircle, Zap, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
  buildReferralLink, fetchMyReferralCode, fetchMyReferrals, fetchMyActivePerks,
  sumCallCreditMinutes, hasPerk, type ReferralRow, type ReferralPerk,
} from '@/lib/referral'

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'expired'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

export default function ReferralsPage() {
  const { user } = useAuth()
  const [code, setCode] = useState<string | null>(null)
  const [referrals, setReferrals] = useState<ReferralRow[]>([])
  const [perks, setPerks] = useState<ReferralPerk[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    let isMounted = true
    Promise.all([
      fetchMyReferralCode(user.id),
      fetchMyReferrals(user.id),
      fetchMyActivePerks(user.id),
    ]).then(([c, r, p]) => {
      if (!isMounted) return
      setCode(c)
      setReferrals(r)
      setPerks(p)
    }).catch(err => {
      console.error('ReferralsPage: failed to load data', err)
    }).finally(() => {
      if (isMounted) setLoading(false)
    })
    return () => { isMounted = false }
  }, [user?.id])

  const link = code ? buildReferralLink(code) : ''
  const confirmedCount = referrals.filter(r => r.status === 'confirmed').length
  const callMinutes = sumCallCreditMinutes(perks)
  const unlimitedMsg = perks.find(p => p.perk_type === 'unlimited_messaging')
  const unlimitedSpin = perks.find(p => p.perk_type === 'unlimited_spins')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20">
          <Gift className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl dark:text-white text-gray-900 mb-2">Invite friends, earn together</h1>
        <p className="text-sm dark:text-gray-400 text-gray-600 max-w-lg mx-auto">
          Every friend who joins with your link gets you both 2 minutes of free calls, plus unlimited spins
          and messaging for 24 hours — automatically, every time.
        </p>
      </div>

      {/* Referral link */}
      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-5 mb-6">
        <p className="text-xs font-bold uppercase tracking-widest dark:text-gray-500 text-gray-400 mb-2">Your referral link</p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={loading ? 'Loading…' : link}
            className="flex-1 px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 text-sm truncate border dark:border-white/8 border-gray-200"
          />
          <button
            onClick={handleCopy}
            disabled={!link}
            className="px-4 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold flex items-center gap-1.5 hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Active perks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-4">
          <Phone className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-2xl font-black dark:text-white text-gray-900">{callMinutes}<span className="text-sm font-semibold"> min</span></p>
          <p className="text-xs dark:text-gray-400 text-gray-500">Free call credit banked</p>
        </div>
        <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-4">
          <MessageCircle className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-sm font-black dark:text-white text-gray-900">{unlimitedMsg ? 'Unlimited' : 'Standard'}</p>
          <p className="text-xs dark:text-gray-400 text-gray-500">
            {unlimitedMsg ? `Messaging — ${timeLeft(unlimitedMsg.expires_at)}` : 'Messaging'}
          </p>
        </div>
        <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-4">
          <Zap className="w-5 h-5 text-fuchsia-400 mb-2" />
          <p className="text-sm font-black dark:text-white text-gray-900">{unlimitedSpin ? 'Unlimited' : 'Standard'}</p>
          <p className="text-xs dark:text-gray-400 text-gray-500">
            {unlimitedSpin ? `Spin & Chat — ${timeLeft(unlimitedSpin.expires_at)}` : 'Spin & Chat'}
          </p>
        </div>
      </div>

      {/* Referral history */}
      <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-sm dark:text-white text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-pink" /> Your referrals
          </p>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500">
            {confirmedCount} confirmed
          </span>
        </div>
        {referrals.length === 0 ? (
          <p className="text-sm dark:text-gray-500 text-gray-400 text-center py-6">
            No referrals yet — share your link above to start earning.
          </p>
        ) : (
          <div className="space-y-2">
            {referrals.map(r => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 dark:text-gray-500 text-gray-400" />
                  <span className="text-xs dark:text-gray-400 text-gray-600">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  r.status === 'confirmed'
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : 'bg-amber-500/15 text-amber-500'
                }`}>
                  {r.status === 'confirmed' ? 'Confirmed' : 'Pending verification'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { hasPerk }
