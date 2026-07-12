import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Download, FileText, Building2, User, Percent, DollarSign } from 'lucide-react'

/**
 * General-purpose financial invoice generator — not tied to any SmartzConnect
 * payment/entity record. Company + client info, arbitrary line items, tax and
 * discount, multi-currency, downloadable as a print-ready HTML file (opens
 * as a PDF via the browser's "Print → Save as PDF").
 */

interface LineItem {
  id: string
  description: string
  qty: number
  price: number
}

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'LRD', symbol: 'L$' },
  { code: 'NGN', symbol: '₦' },
  { code: 'GHS', symbol: '₵' },
  { code: 'KES', symbol: 'KSh' },
  { code: 'ZAR', symbol: 'R' },
]

const inp = 'w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-pink transition-colors'
const label = 'text-xs font-bold text-white/50 mb-1.5 block'

function newLineItem(): LineItem {
  return { id: Math.random().toString(36).slice(2), description: '', qty: 1, price: 0 }
}

export default function InvoiceGeneratorPage() {
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`)
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [currency, setCurrency] = useState('USD')

  const [fromName, setFromName] = useState('')
  const [fromAddress, setFromAddress] = useState('')
  const [fromEmail, setFromEmail] = useState('')

  const [toName, setToName] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [toEmail, setToEmail] = useState('')

  const [items, setItems] = useState<LineItem[]>([newLineItem()])
  const [taxPercent, setTaxPercent] = useState(0)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [notes, setNotes] = useState('Thank you for your business.')

  const symbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$'

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.qty * i.price, 0), [items])
  const discountAmount = useMemo(() => subtotal * (discountPercent / 100), [subtotal, discountPercent])
  const taxAmount = useMemo(() => (subtotal - discountAmount) * (taxPercent / 100), [subtotal, discountAmount, taxPercent])
  const total = subtotal - discountAmount + taxAmount

  const fmt = (n: number) => `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)))
  const removeItem = (id: string) => setItems(prev => (prev.length > 1 ? prev.filter(i => i.id !== id) : prev))
  const addItem = () => setItems(prev => [...prev, newLineItem()])

  const handleDownload = () => {
    const rowsHtml = items.map(i => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #eee">${i.description || '—'}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center">${i.qty}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right">${fmt(i.price)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right">${fmt(i.qty * i.price)}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${invoiceNumber}</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; max-width: 720px; margin: 40px auto; padding: 0 20px; }
        h1 { font-size: 28px; margin: 0 0 4px; background: linear-gradient(135deg,#ec4899,#a855f7); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .muted { color: #888; font-size: 13px; }
        .row { display: flex; justify-content: space-between; margin: 28px 0; gap: 24px; flex-wrap: wrap; }
        .block { flex: 1; min-width: 220px; }
        .block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #a855f7; margin: 0 0 6px; }
        .block p { margin: 2px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { text-align: left; font-size: 11px; text-transform: uppercase; color: #888; padding: 8px; border-bottom: 2px solid #eee; }
        th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
        th:nth-child(2) { text-align: center; }
        .totals { margin-top: 16px; width: 280px; margin-left: auto; }
        .totals div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
        .totals .grand { font-size: 18px; font-weight: bold; border-top: 2px solid #1a1a1a; margin-top: 6px; padding-top: 10px; }
        .notes { margin-top: 32px; font-size: 13px; color: #555; border-top: 1px solid #eee; padding-top: 16px; }
        @media print { body { margin: 0; padding: 24px; } }
      </style></head>
      <body>
        <h1>INVOICE</h1>
        <p class="muted">${invoiceNumber} &middot; Issued ${issueDate || '—'}${dueDate ? ` &middot; Due ${dueDate}` : ''}</p>
        <div class="row">
          <div class="block"><h3>From</h3><p><strong>${fromName || '—'}</strong></p><p>${(fromAddress || '').replace(/\n/g, '<br/>')}</p><p>${fromEmail || ''}</p></div>
          <div class="block"><h3>Bill To</h3><p><strong>${toName || '—'}</strong></p><p>${(toAddress || '').replace(/\n/g, '<br/>')}</p><p>${toEmail || ''}</p></div>
        </div>
        <table>
          <thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="totals">
          <div><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
          ${discountPercent ? `<div><span>Discount (${discountPercent}%)</span><span>-${fmt(discountAmount)}</span></div>` : ''}
          ${taxPercent ? `<div><span>Tax (${taxPercent}%)</span><span>${fmt(taxAmount)}</span></div>` : ''}
          <div class="grand"><span>Total</span><span>${fmt(total)}</span></div>
        </div>
        ${notes ? `<div class="notes">${notes.replace(/\n/g, '<br/>')}</div>` : ''}
      </body></html>`

    const blob = new Blob([html], { type: 'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${invoiceNumber}.html`
    a.click()
  }

  return (
    <div className="min-h-screen bg-[#0D0A14] text-white px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-love-gradient flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl">Invoice Generator</h1>
            <p className="text-sm text-white/40">Create and download a professional invoice for any business or client.</p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {/* Invoice meta */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className={label}>Invoice #</label>
              <input className={inp} value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
            </div>
            <div>
              <label className={label}>Issue Date</label>
              <input type="date" className={inp} value={issueDate} onChange={e => setIssueDate(e.target.value)} />
            </div>
            <div>
              <label className={label}>Due Date</label>
              <input type="date" className={inp} value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className={label}>Currency</label>
              <select className={inp} value={currency} onChange={e => setCurrency(e.target.value)}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
              </select>
            </div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 space-y-3">
              <div className="flex items-center gap-2 text-brand-pink"><Building2 className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-wide">From (your business)</span></div>
              <input className={inp} placeholder="Business or your name" value={fromName} onChange={e => setFromName(e.target.value)} />
              <textarea className={inp} rows={2} placeholder="Address" value={fromAddress} onChange={e => setFromAddress(e.target.value)} />
              <input className={inp} placeholder="Email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} />
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 space-y-3">
              <div className="flex items-center gap-2 text-brand-pink"><User className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-wide">Bill To (client)</span></div>
              <input className={inp} placeholder="Client name" value={toName} onChange={e => setToName(e.target.value)} />
              <textarea className={inp} rows={2} placeholder="Address" value={toAddress} onChange={e => setToAddress(e.target.value)} />
              <input className={inp} placeholder="Email" value={toEmail} onChange={e => setToEmail(e.target.value)} />
            </div>
          </div>

          {/* Line items */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wide text-brand-pink">Line Items</span>
              <button onClick={addItem} className="flex items-center gap-1.5 text-xs font-semibold text-brand-pink hover:text-pink-400">
                <Plus className="w-3.5 h-3.5" /> Add item
              </button>
            </div>
            <div className="space-y-2">
              {items.map(item => (
                <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <input className={`${inp} flex-1`} placeholder="Description" value={item.description}
                    onChange={e => updateItem(item.id, { description: e.target.value })} />
                  <input type="number" min={0} className={`${inp} w-20`} placeholder="Qty" value={item.qty}
                    onChange={e => updateItem(item.id, { qty: Number(e.target.value) || 0 })} />
                  <input type="number" min={0} className={`${inp} w-28`} placeholder="Price" value={item.price}
                    onChange={e => updateItem(item.id, { price: Number(e.target.value) || 0 })} />
                  <span className="w-24 text-right text-sm font-semibold text-white/70 flex-shrink-0">{fmt(item.qty * item.price)}</span>
                  <button onClick={() => removeItem(item.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Tax / discount / totals */}
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-1 space-y-3">
              <div>
                <label className={label}><Percent className="w-3 h-3 inline mr-1" />Discount %</label>
                <input type="number" min={0} max={100} className={inp} value={discountPercent}
                  onChange={e => setDiscountPercent(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className={label}><Percent className="w-3 h-3 inline mr-1" />Tax %</label>
                <input type="number" min={0} max={100} className={inp} value={taxPercent}
                  onChange={e => setTaxPercent(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className={label}>Notes / Payment terms</label>
                <textarea className={inp} rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="w-full sm:w-64 p-4 rounded-2xl bg-white/[0.03] border border-white/8 space-y-2 self-start">
              <div className="flex items-center gap-2 text-brand-pink mb-1"><DollarSign className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-wide">Summary</span></div>
              <div className="flex justify-between text-sm text-white/60"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              {discountPercent > 0 && <div className="flex justify-between text-sm text-white/60"><span>Discount ({discountPercent}%)</span><span>-{fmt(discountAmount)}</span></div>}
              {taxPercent > 0 && <div className="flex justify-between text-sm text-white/60"><span>Tax ({taxPercent}%)</span><span>{fmt(taxAmount)}</span></div>}
              <div className="flex justify-between text-lg font-black pt-2 border-t border-white/10"><span>Total</span><span>{fmt(total)}</span></div>
            </div>
          </div>

          <button onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-love-gradient text-white font-bold shadow-lg shadow-pink-500/20 hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" /> Download Invoice
          </button>
          <p className="text-center text-[11px] text-white/30">Downloads as an HTML file — open it and use your browser's Print → Save as PDF for a PDF copy.</p>
        </div>
      </div>
    </div>
  )
}
