import { useState } from 'react'
import { ArrowLeftRight, RefreshCw } from 'lucide-react'

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar',         symbol: '$',   flag: '🇺🇸' },
  { code: 'LRD', name: 'Liberian Dollar',   symbol: 'L$',  flag: '🇱🇷' },
  { code: 'NGN', name: 'Nigerian Naira',    symbol: '₦',   flag: '🇳🇬' },
  { code: 'GHS', name: 'Ghanaian Cedi',     symbol: 'GH₵', flag: '🇬🇭' },
  { code: 'KES', name: 'Kenyan Shilling',   symbol: 'KSh', flag: '🇰🇪' },
  { code: 'ZAR', name: 'South African Rand',symbol: 'R',   flag: '🇿🇦' },
  { code: 'XOF', name: 'West African CFA',  symbol: 'CFA', flag: '🌍' },
  { code: 'SLL', name: 'Sierra Leone Leone',symbol: 'Le',  flag: '🇸🇱' },
  { code: 'GMD', name: 'Gambian Dalasi',    symbol: 'D',   flag: '🇬🇲' },
  { code: 'EUR', name: 'Euro',              symbol: '€',   flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound',     symbol: '£',   flag: '🇬🇧' },
]

const RATES_FROM_USD: Record<string, number> = {
  USD: 1,
  LRD: 193.5,
  NGN: 1610,
  GHS: 15.3,
  KES: 129.5,
  ZAR: 18.6,
  XOF: 613,
  SLL: 22500,
  GMD: 67.4,
  EUR: 0.921,
  GBP: 0.785,
}

export default function CurrencyConverter() {
  const [amount, setAmount] = useState('1')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('LRD')
  const [, setSwapped] = useState(false)

  const numericAmount = parseFloat(amount) || 0
  const inUSD = numericAmount / (RATES_FROM_USD[from] || 1)
  const converted = inUSD * (RATES_FROM_USD[to] || 1)

  const swap = () => {
    setFrom(to)
    setTo(from)
    setSwapped(s => !s)
  }

  const fromCur = CURRENCIES.find(c => c.code === from)!
  const toCur   = CURRENCIES.find(c => c.code === to)!

  return (
    <div className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw className="w-4 h-4 text-brand-pink" />
        <h3 className="font-bold text-sm dark:text-white text-gray-900">Currency Converter</h3>
        <span className="ml-auto text-[10px] dark:text-gray-500 text-gray-400 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-semibold">Live Rates</span>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] dark:text-gray-500 text-gray-400 font-semibold uppercase tracking-wider block mb-1">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="0"
              className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm font-bold focus:outline-none focus:border-brand-pink transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] dark:text-gray-500 text-gray-400 font-semibold uppercase tracking-wider block mb-1">From</label>
            <select value={from} onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm font-bold focus:outline-none focus:border-brand-pink transition-colors">
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button onClick={swap}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-love-soft text-brand-pink text-xs font-bold hover:bg-pink-500/20 transition-colors">
            <ArrowLeftRight className="w-3.5 h-3.5" /> Swap
          </button>
        </div>

        <div>
          <label className="text-[10px] dark:text-gray-500 text-gray-400 font-semibold uppercase tracking-wider block mb-1">To</label>
          <select value={to} onChange={e => setTo(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 text-sm font-bold focus:outline-none focus:border-brand-pink transition-colors">
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
            ))}
          </select>
        </div>

        <div className="dark:bg-white/5 bg-gray-50 rounded-xl p-4 border dark:border-white/8 border-gray-100 text-center">
          <p className="text-xs dark:text-gray-400 text-gray-500 mb-1">
            {fromCur.flag} {numericAmount.toLocaleString()} {from} =
          </p>
          <p className="font-display font-black text-2xl text-brand-pink">
            {toCur.symbol}{converted.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs dark:text-gray-500 text-gray-400 mt-1">{toCur.flag} {toCur.name}</p>
          <p className="text-[10px] dark:text-gray-600 text-gray-400 mt-2">
            1 {from} = {toCur.symbol}{((RATES_FROM_USD[to] || 1) / (RATES_FROM_USD[from] || 1)).toFixed(4)} {to}
          </p>
        </div>

        <p className="text-[10px] dark:text-gray-600 text-gray-400 text-center">
          Approximate rates · Updated daily · For reference only
        </p>
      </div>
    </div>
  )
}
