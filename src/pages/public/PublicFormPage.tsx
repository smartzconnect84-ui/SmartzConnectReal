import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, RefreshCw, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type FieldType = 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' |
  'radio' | 'checkbox' | 'date' | 'file' | 'rating' | 'url' | 'heading' | 'paragraph'

interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  order: number
}

interface Form {
  id: string
  title: string
  slug: string
  description: string
  fields: FormField[]
  is_active: boolean
  submit_label: string
  success_message: string
  redirect_url: string
}

/* ─── Individual field renderers ────────────────────────────── */
function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`w-7 h-7 ${(hovered || value) >= n ? 'text-yellow-400 fill-yellow-400' : 'dark:text-gray-600 text-gray-300'}`} />
        </button>
      ))}
    </div>
  )
}

function FormFieldRenderer({
  field,
  value,
  onChange,
  error,
}: {
  field: FormField
  value: any
  onChange: (v: any) => void
  error?: string
}) {
  const baseInput = `w-full px-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none ${
    error
      ? 'border-red-400 dark:bg-red-500/5 bg-red-50'
      : 'dark:bg-white/5 bg-gray-50 dark:border-white/10 border-gray-200 focus:border-brand-pink'
  } dark:text-white text-gray-900 placeholder:dark:text-gray-500 placeholder:text-gray-400`

  if (field.type === 'heading') {
    return <h3 className="text-xl font-bold dark:text-white text-gray-900 mt-2">{field.label}</h3>
  }
  if (field.type === 'paragraph') {
    return <p className="text-sm dark:text-gray-400 text-gray-500">{field.label}</p>
  }

  return (
    <div>
      <label className="block text-sm font-semibold dark:text-gray-300 text-gray-700 mb-1.5">
        {field.label}
        {field.required && <span className="text-brand-pink ml-1">*</span>}
      </label>

      {field.type === 'textarea' && (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder}
          rows={4} className={`${baseInput} resize-none`} />
      )}

      {(field.type === 'text' || field.type === 'email' || field.type === 'phone' ||
        field.type === 'number' || field.type === 'url' || field.type === 'date') && (
        <input
          type={field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : field.type === 'date' ? 'date' : field.type}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseInput}
        />
      )}

      {field.type === 'select' && (
        <select value={value || ''} onChange={e => onChange(e.target.value)} className={baseInput}>
          <option value="">{field.placeholder || 'Select an option...'}</option>
          {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )}

      {field.type === 'radio' && (
        <div className="space-y-2">
          {(field.options || []).map(opt => (
            <label key={opt} className="flex items-center gap-3 cursor-pointer group">
              <input type="radio" name={field.id} value={opt} checked={value === opt} onChange={() => onChange(opt)}
                className="accent-brand-pink w-4 h-4 flex-shrink-0" />
              <span className="text-sm dark:text-gray-300 text-gray-700 group-hover:dark:text-white group-hover:text-gray-900 transition-colors">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === 'checkbox' && (
        <div className="space-y-2">
          {(field.options || []).map(opt => {
            const checked = Array.isArray(value) ? value.includes(opt) : false
            return (
              <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={checked}
                  onChange={e => {
                    const arr = Array.isArray(value) ? [...value] : []
                    onChange(e.target.checked ? [...arr, opt] : arr.filter(v => v !== opt))
                  }}
                  className="accent-brand-pink w-4 h-4 flex-shrink-0 rounded" />
                <span className="text-sm dark:text-gray-300 text-gray-700 group-hover:dark:text-white group-hover:text-gray-900 transition-colors">{opt}</span>
              </label>
            )
          })}
        </div>
      )}

      {field.type === 'rating' && (
        <RatingInput value={Number(value) || 0} onChange={onChange} />
      )}

      {field.type === 'file' && (
        <input type="file" onChange={e => onChange(e.target.files?.[0]?.name || '')}
          className="w-full text-sm dark:text-gray-300 text-gray-700 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-pink file:text-white hover:file:opacity-90" />
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {error}
        </p>
      )}
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────────── */
export default function PublicFormPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [values, setValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!slug) return
    supabase.from('site_forms').select('*').eq('slug', slug).eq('is_active', true).single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true) }
        else { setForm(data as Form) }
        setLoading(false)
      })
  }, [slug])

  const validate = () => {
    const errs: Record<string, string> = {}
    for (const field of form?.fields || []) {
      if (!field.required) continue
      if (['heading', 'paragraph'].includes(field.type)) continue
      const val = values[field.id]
      if (!val || (Array.isArray(val) && val.length === 0) || String(val).trim() === '') {
        errs[field.id] = 'This field is required'
      }
      if (field.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        errs[field.id] = 'Please enter a valid email address'
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    if (!validate()) return

    setSubmitting(true); setSubmitError('')
    try {
      const { error } = await supabase.from('form_submissions').insert({
        form_id: form.id,
        data: values,
      })
      if (error) throw error
      setSubmitted(true)
      if (form.redirect_url) {
        setTimeout(() => window.location.assign(form.redirect_url), 1800)
      }
    } catch (e: any) {
      setSubmitError(e.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-[#0A0710] bg-gray-50">
        <RefreshCw className="w-7 h-7 animate-spin dark:text-gray-500 text-gray-400" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center dark:bg-[#0A0710] bg-gray-50 px-4 gap-4">
        <AlertCircle className="w-14 h-14 dark:text-gray-600 text-gray-300" />
        <h1 className="text-2xl font-black dark:text-white text-gray-900">Form not found</h1>
        <p className="text-sm dark:text-gray-500 text-gray-400">This form doesn't exist or is no longer accepting submissions.</p>
        <button onClick={() => navigate('/')} className="px-5 py-2.5 rounded-xl bg-brand-pink text-white text-sm font-bold hover:opacity-90 mt-2">
          Go Home
        </button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center dark:bg-[#0A0710] bg-gray-50 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="flex flex-col items-center gap-5 text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-black dark:text-white text-gray-900">
            {form?.success_message || 'Thank you! Your submission has been received.'}
          </h2>
          <p className="text-sm dark:text-gray-500 text-gray-400">
            We'll be in touch soon.
          </p>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 rounded-xl bg-brand-pink text-white text-sm font-bold hover:opacity-90">
            Back to Home
          </button>
        </motion.div>
      </div>
    )
  }

  const sortedFields = [...(form?.fields || [])].sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen dark:bg-[#0A0710] bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header card */}
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="dark:bg-[#0F0B1A] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-6 sm:p-8 shadow-xl mb-4"
        >
          <div className="w-12 h-12 rounded-xl bg-love-gradient flex items-center justify-center mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 mb-2">{form?.title}</h1>
          {form?.description && (
            <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{form.description}</p>
          )}
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08 }}
          onSubmit={handleSubmit}
          className="dark:bg-[#0F0B1A] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-6 sm:p-8 shadow-xl space-y-5"
        >
          {sortedFields.map(field => (
            <FormFieldRenderer
              key={field.id}
              field={field}
              value={values[field.id]}
              onChange={v => { setValues(prev => ({ ...prev, [field.id]: v })); setErrors(prev => ({ ...prev, [field.id]: '' })) }}
              error={errors[field.id]}
            />
          ))}

          {submitError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-love-gradient text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25"
          >
            {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
            {form?.submit_label || 'Submit'}
          </button>
        </motion.form>

        <p className="text-center text-[11px] dark:text-gray-600 text-gray-400 mt-4">
          Powered by <span className="font-bold dark:text-gray-500 text-gray-500">SmartzConnect</span>
        </p>
      </div>
    </div>
  )
}
