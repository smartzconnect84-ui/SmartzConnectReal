import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Edit2, Eye, Copy, X, Check, Search,
  ChevronDown, ChevronRight, Upload, Download, ToggleLeft,
  ToggleRight, ClipboardList, ExternalLink, RefreshCw, AlertCircle,
  Grip, Type, Hash, Mail, Phone, Calendar, CheckSquare,
  AlignLeft, List, Star, Image as ImageIcon, Link as LinkIcon, FileText,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

/* ─── Types ──────────────────────────────────────────────────── */
type FieldType = 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' |
  'radio' | 'checkbox' | 'date' | 'file' | 'rating' | 'url' | 'heading' | 'paragraph'

interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  options?: string[]    // for select/radio/checkbox
  validation?: string
  order: number
}

interface Form {
  id: string
  title: string
  slug: string
  category: string
  description: string
  fields: FormField[]
  is_active: boolean
  submit_label: string
  success_message: string
  redirect_url: string
  email_notifications: boolean
  notification_email: string
  created_at: string
  submission_count?: number
}

interface FormSubmission {
  id: string
  form_id: string
  data: Record<string, any>
  created_at: string
  ip_address?: string
}

const CATEGORIES = [
  { value: 'contact',      label: 'Contact'      },
  { value: 'feedback',     label: 'Feedback'     },
  { value: 'registration', label: 'Registration' },
  { value: 'survey',       label: 'Survey'       },
  { value: 'support',      label: 'Support'      },
  { value: 'application',  label: 'Application'  },
  { value: 'newsletter',   label: 'Newsletter'   },
  { value: 'order',        label: 'Order'        },
  { value: 'other',        label: 'Other'        },
]

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ComponentType<any> }[] = [
  { type: 'text',      label: 'Short Text',   icon: Type         },
  { type: 'email',     label: 'Email',        icon: Mail         },
  { type: 'phone',     label: 'Phone',        icon: Phone        },
  { type: 'number',    label: 'Number',       icon: Hash         },
  { type: 'textarea',  label: 'Long Text',    icon: AlignLeft    },
  { type: 'select',    label: 'Dropdown',     icon: List         },
  { type: 'radio',     label: 'Radio',        icon: CheckSquare  },
  { type: 'checkbox',  label: 'Checkbox',     icon: CheckSquare  },
  { type: 'date',      label: 'Date',         icon: Calendar     },
  { type: 'file',      label: 'File Upload',  icon: Upload       },
  { type: 'rating',    label: 'Star Rating',  icon: Star         },
  { type: 'url',       label: 'URL / Link',   icon: LinkIcon     },
  { type: 'heading',   label: 'Heading',      icon: Type         },
  { type: 'paragraph', label: 'Paragraph',    icon: AlignLeft    },
]

const CATEGORY_COLOR: Record<string, string> = {
  contact:      'bg-blue-500/15 text-blue-400',
  feedback:     'bg-purple-500/15 text-purple-400',
  registration: 'bg-green-500/15 text-green-400',
  survey:       'bg-yellow-500/15 text-yellow-400',
  support:      'bg-orange-500/15 text-orange-400',
  application:  'bg-teal-500/15 text-teal-400',
  newsletter:   'bg-pink-500/15 text-pink-400',
  order:        'bg-amber-500/15 text-amber-400',
  other:        'bg-gray-500/15 text-gray-400',
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

/* ─── Field Editor ───────────────────────────────────────────── */
function FieldEditor({ field, onChange, onDelete }: {
  field: FormField
  onChange: (f: FormField) => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const FIcon = FIELD_TYPES.find(t => t.type === field.type)?.icon || Type

  return (
    <div className="border dark:border-white/8 border-gray-200 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 dark:bg-white/3 bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <Grip className="w-4 h-4 dark:text-gray-600 text-gray-300 cursor-grab flex-shrink-0" />
        <div className="w-7 h-7 rounded-lg dark:bg-white/8 bg-gray-100 flex items-center justify-center flex-shrink-0">
          <FIcon className="w-3.5 h-3.5 dark:text-gray-400 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold dark:text-white text-gray-900 truncate">
            {field.label || <span className="italic dark:text-gray-500 text-gray-400">Untitled field</span>}
          </p>
          <p className="text-[11px] dark:text-gray-500 text-gray-400 capitalize">{field.type} {field.required ? '· Required' : ''}</p>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete() }} className="w-7 h-7 rounded-lg hover:bg-red-500/10 hover:text-red-400 dark:text-gray-500 text-gray-400 flex items-center justify-center transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {expanded ? <ChevronDown className="w-4 h-4 dark:text-gray-500 text-gray-400" /> : <ChevronRight className="w-4 h-4 dark:text-gray-500 text-gray-400" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3 border-t dark:border-white/6 border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1 block">Label *</label>
                  <input
                    value={field.label}
                    onChange={e => onChange({ ...field, label: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink"
                    placeholder="Field label"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1 block">Type</label>
                  <select
                    value={field.type}
                    onChange={e => onChange({ ...field, type: e.target.value as FieldType })}
                    className="w-full px-3 py-2 rounded-lg dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink"
                  >
                    {FIELD_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {!['heading', 'paragraph'].includes(field.type) && (
                <div>
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1 block">Placeholder</label>
                  <input
                    value={field.placeholder || ''}
                    onChange={e => onChange({ ...field, placeholder: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink"
                    placeholder="Placeholder text"
                  />
                </div>
              )}

              {['select', 'radio', 'checkbox'].includes(field.type) && (
                <div>
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1 block">Options (one per line)</label>
                  <textarea
                    value={(field.options || []).join('\n')}
                    onChange={e => onChange({ ...field, options: e.target.value.split('\n').filter(Boolean) })}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink resize-none"
                    placeholder={"Option 1\nOption 2\nOption 3"}
                  />
                </div>
              )}

              {!['heading', 'paragraph'].includes(field.type) && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={field.required} onChange={e => onChange({ ...field, required: e.target.checked })} className="rounded" />
                  <span className="text-sm dark:text-gray-300 text-gray-700">Required field</span>
                </label>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Form Builder Modal ─────────────────────────────────────── */
function FormBuilderModal({ form, onClose, onSave }: {
  form: Partial<Form> | null
  onClose: () => void
  onSave: (f: Form) => void
}) {
  const isNew = !form?.id
  const [tab, setTab] = useState<'fields' | 'settings'>('fields')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState(form?.title || '')
  const [slug, setSlug] = useState(form?.slug || '')
  const [category, setCategory] = useState(form?.category || 'contact')
  const [description, setDescription] = useState(form?.description || '')
  const [fields, setFields] = useState<FormField[]>(form?.fields || [])
  const [isActive, setIsActive] = useState(form?.is_active ?? true)
  const [submitLabel, setSubmitLabel] = useState(form?.submit_label || 'Submit')
  const [successMessage, setSuccessMessage] = useState(form?.success_message || 'Thank you! Your submission has been received.')
  const [redirectUrl, setRedirectUrl] = useState(form?.redirect_url || '')
  const [emailNotifs, setEmailNotifs] = useState(form?.email_notifications ?? false)
  const [notifEmail, setNotifEmail] = useState(form?.notification_email || '')

  const [showFieldPicker, setShowFieldPicker] = useState(false)

  const handleTitleChange = (v: string) => {
    setTitle(v)
    if (isNew) setSlug(slugify(v))
  }

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: uid(),
      type,
      label: FIELD_TYPES.find(t => t.type === type)?.label || 'New Field',
      required: false,
      order: fields.length,
    }
    setFields(f => [...f, newField])
    setShowFieldPicker(false)
  }

  const updateField = (id: string, updated: FormField) =>
    setFields(f => f.map(x => x.id === id ? updated : x))

  const deleteField = (id: string) =>
    setFields(f => f.filter(x => x.id !== id))

  const handleSave = async () => {
    if (!title.trim()) { setError('Form title is required'); return }
    if (!slug.trim())  { setError('Form slug is required'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        category,
        description: description.trim(),
        fields: fields.map((f, i) => ({ ...f, order: i })),
        is_active: isActive,
        submit_label: submitLabel,
        success_message: successMessage,
        redirect_url: redirectUrl,
        email_notifications: emailNotifs,
        notification_email: notifEmail,
      }
      if (isNew) {
        const { data, error: err } = await supabase.from('site_forms').insert(payload).select().single()
        if (err) throw err
        onSave(data as Form)
      } else {
        const { data, error: err } = await supabase.from('site_forms').update(payload).eq('id', form!.id!).select().single()
        if (err) throw err
        onSave(data as Form)
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save form')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col dark:bg-[#0F0B1A] bg-white rounded-2xl border dark:border-white/8 border-gray-200 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-white/6 border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold dark:text-white text-gray-900">{isNew ? 'Create New Form' : `Edit: ${form?.title}`}</h2>
            <p className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">Build and configure your form</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 dark:text-gray-400 text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
          {(['fields', 'settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors capitalize ${
                tab === t ? 'bg-brand-pink text-white' : 'dark:text-gray-400 text-gray-600 hover:dark:bg-white/5 hover:bg-gray-100'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Fields Tab */}
          {tab === 'fields' && (
            <>
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1 block">Form Title *</label>
                  <input value={title} onChange={e => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink"
                    placeholder="e.g. Contact Us" />
                </div>
                <div>
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1 block">Slug (URL key)</label>
                  <input value={slug} onChange={e => setSlug(slugify(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm font-mono dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink"
                    placeholder="contact-us" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1 block">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <button onClick={() => setIsActive(v => !v)} className="flex items-center gap-2 text-sm dark:text-gray-300 text-gray-700">
                    {isActive
                      ? <ToggleRight className="w-5 h-5 text-green-500" />
                      : <ToggleLeft className="w-5 h-5 dark:text-gray-500 text-gray-400" />}
                    {isActive ? 'Published' : 'Draft'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1 block">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                  className="w-full px-3 py-2 rounded-lg dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink resize-none"
                  placeholder="Shown above the form on the public site" />
              </div>

              {/* Fields */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold dark:text-white text-gray-900">Form Fields ({fields.length})</p>
                  <button onClick={() => setShowFieldPicker(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-pink text-white text-xs font-semibold hover:opacity-90 transition-opacity">
                    <Plus className="w-3.5 h-3.5" /> Add Field
                  </button>
                </div>

                <AnimatePresence>
                  {showFieldPicker && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="mb-3 p-3 rounded-xl dark:bg-white/3 bg-gray-50 border dark:border-white/8 border-gray-200">
                      <p className="text-[11px] font-bold dark:text-gray-500 text-gray-400 uppercase tracking-wider mb-2">Choose field type</p>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                        {FIELD_TYPES.map(ft => {
                          const Icon = ft.icon
                          return (
                            <button key={ft.type} onClick={() => addField(ft.type)}
                              className="flex flex-col items-center gap-1 p-2 rounded-lg dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 hover:border-brand-pink transition-colors">
                              <Icon className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                              <span className="text-[9px] dark:text-gray-400 text-gray-500 text-center leading-tight">{ft.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {fields.length === 0 ? (
                  <div className="border-2 border-dashed dark:border-white/10 border-gray-200 rounded-xl py-10 text-center">
                    <ClipboardList className="w-8 h-8 mx-auto dark:text-gray-600 text-gray-300 mb-2" />
                    <p className="text-sm dark:text-gray-500 text-gray-400">No fields yet. Click "Add Field" to start building.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fields.map(f => (
                      <FieldEditor key={f.id} field={f}
                        onChange={updated => updateField(f.id, updated)}
                        onDelete={() => deleteField(f.id)} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Settings Tab */}
          {tab === 'settings' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1 block">Submit Button Label</label>
                <input value={submitLabel} onChange={e => setSubmitLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink"
                  placeholder="Submit" />
              </div>
              <div>
                <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1 block">Success Message</label>
                <textarea value={successMessage} onChange={e => setSuccessMessage(e.target.value)} rows={3}
                  className="w-full px-3 py-2 rounded-lg dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink resize-none"
                  placeholder="Thank you! Your submission has been received." />
              </div>
              <div>
                <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1 block">Redirect URL (optional)</label>
                <input value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink"
                  placeholder="https://example.com/thank-you" />
              </div>

              <div className="p-4 rounded-xl dark:bg-white/3 bg-gray-50 border dark:border-white/8 border-gray-200 space-y-3">
                <p className="text-sm font-bold dark:text-white text-gray-900">Email Notifications</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={emailNotifs} onChange={e => setEmailNotifs(e.target.checked)} className="rounded" />
                  <span className="text-sm dark:text-gray-300 text-gray-700">Send email on every submission</span>
                </label>
                {emailNotifs && (
                  <div>
                    <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1 block">Notification Email</label>
                    <input value={notifEmail} onChange={e => setNotifEmail(e.target.value)} type="email"
                      className="w-full px-3 py-2 rounded-lg dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink"
                      placeholder="admin@example.com" />
                  </div>
                )}
              </div>

              {/* Public link preview */}
              {slug && (
                <div className="p-3 rounded-xl dark:bg-blue-500/10 bg-blue-50 border dark:border-blue-500/20 border-blue-100 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <p className="text-xs dark:text-blue-300 text-blue-600 font-mono">/forms/{slug}</p>
                  <a href={`/forms/${slug}`} target="_blank" rel="noopener noreferrer" className="ml-auto">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {error && (
          <div className="mx-6 mb-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t dark:border-white/6 border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold dark:text-gray-400 text-gray-600 hover:dark:bg-white/5 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-xl bg-brand-pink text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
            {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {isNew ? 'Create Form' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Submissions Viewer ─────────────────────────────────────── */
function SubmissionsModal({ form, onClose }: { form: Form; onClose: () => void }) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<FormSubmission | null>(null)

  useEffect(() => {
    supabase.from('form_submissions').select('*').eq('form_id', form.id).order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => { setSubmissions(data as FormSubmission[] || []); setLoading(false) })
  }, [form.id])

  const exportCSV = () => {
    if (!submissions.length) return
    const keys = Object.keys(submissions[0].data || {})
    const rows = [
      ['Submitted At', ...keys],
      ...submissions.map(s => [new Date(s.created_at).toLocaleString(), ...keys.map(k => String(s.data[k] ?? ''))]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `${form.slug}-submissions.csv`
    a.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-4xl max-h-[88vh] flex flex-col dark:bg-[#0F0B1A] bg-white rounded-2xl border dark:border-white/8 border-gray-200 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-white/6 border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold dark:text-white text-gray-900">Submissions — {form.title}</h2>
            <p className="text-xs dark:text-gray-500 text-gray-400">{submissions.length} total</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg dark:bg-white/5 bg-gray-100 text-xs font-semibold dark:text-gray-300 text-gray-700 hover:bg-green-500/10 hover:text-green-500 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 dark:text-gray-400 text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 animate-spin dark:text-gray-500 text-gray-400" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <ClipboardList className="w-10 h-10 dark:text-gray-600 text-gray-300" />
              <p className="text-sm dark:text-gray-500 text-gray-400">No submissions yet</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-white/5 divide-gray-100">
              {submissions.map(sub => (
                <button key={sub.id} onClick={() => setSelected(sub)}
                  className="w-full flex items-start gap-4 px-6 py-3.5 hover:dark:bg-white/3 hover:bg-gray-50 text-left transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-bold dark:text-white text-gray-900">
                        {Object.values(sub.data || {})[0]?.toString().slice(0, 40) || 'Submission'}
                      </p>
                      <span className="text-[10px] dark:text-gray-600 text-gray-400">{new Date(sub.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(sub.data || {}).slice(0, 3).map(([k, v]) => (
                        <span key={k} className="text-[11px] dark:text-gray-500 text-gray-500">
                          <span className="dark:text-gray-600 text-gray-400">{k}:</span> {String(v).slice(0, 30)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Eye className="w-4 h-4 dark:text-gray-600 text-gray-400 flex-shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
            className="fixed right-4 top-4 bottom-4 w-80 dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 shadow-2xl z-[60] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/6 border-gray-100">
              <p className="text-sm font-bold dark:text-white text-gray-900">Submission Detail</p>
              <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-lg hover:bg-red-500/10 hover:text-red-400 dark:text-gray-400 text-gray-600 flex items-center justify-center transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-[10px] dark:text-gray-500 text-gray-400">{new Date(selected.created_at).toLocaleString()}</p>
              {Object.entries(selected.data || {}).map(([k, v]) => (
                <div key={k}>
                  <p className="text-[10px] font-bold dark:text-gray-500 text-gray-400 uppercase tracking-wider mb-0.5">{k}</p>
                  <p className="text-sm dark:text-white text-gray-900 break-words">{String(v) || '—'}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function AdminForms() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingForm, setEditingForm] = useState<Partial<Form> | null>(null)
  const [viewSubmissions, setViewSubmissions] = useState<Form | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const showToast = (msg: string) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3000)
  }

  const load = async () => {
    setLoading(true); setError('')
    const { data, error: err } = await supabase
      .from('site_forms')
      .select('*, form_submissions(count)')
      .order('created_at', { ascending: false })
    if (err) { setError(err.message); setLoading(false); return }
    const rows = (data as any[]).map(r => ({
      ...r,
      submission_count: r.form_submissions?.[0]?.count ?? 0,
    }))
    setForms(rows); setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = (saved: Form) => {
    setForms(prev => {
      const exists = prev.find(f => f.id === saved.id)
      return exists ? prev.map(f => f.id === saved.id ? saved : f) : [saved, ...prev]
    })
    setBuilderOpen(false)
    setEditingForm(null)
    showToast(editingForm?.id ? 'Form updated ✓' : 'Form created ✓')
  }

  const toggleActive = async (form: Form) => {
    const updated = { ...form, is_active: !form.is_active }
    setForms(prev => prev.map(f => f.id === form.id ? updated : f))
    await supabase.from('site_forms').update({ is_active: !form.is_active }).eq('id', form.id)
    showToast(`Form ${!form.is_active ? 'published' : 'unpublished'}`)
  }

  const duplicateForm = async (form: Form) => {
    const { data } = await supabase.from('site_forms').insert({
      ...form,
      id: undefined,
      title: `${form.title} (Copy)`,
      slug: `${form.slug}-copy-${Date.now().toString(36)}`,
      created_at: undefined,
    }).select().single()
    if (data) { setForms(prev => [data as Form, ...prev]); showToast('Form duplicated ✓') }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    await supabase.from('form_submissions').delete().eq('form_id', deleteId)
    await supabase.from('site_forms').delete().eq('id', deleteId)
    setForms(prev => prev.filter(f => f.id !== deleteId))
    setDeleteId(null); setDeleting(false)
    showToast('Form deleted')
  }

  const filtered = forms.filter(f => {
    const q = search.toLowerCase()
    const matchSearch = !q || f.title.toLowerCase().includes(q) || f.slug.includes(q)
    const matchCat = filterCat === 'all' || f.category === filterCat
    return matchSearch && matchCat
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="fixed top-20 right-6 z-[200] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold shadow-xl">
            <Check className="w-4 h-4" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900">Forms Manager</h1>
          <p className="text-sm dark:text-gray-500 text-gray-500 mt-1">Create and manage public-facing forms. All submissions are stored and viewable here.</p>
        </div>
        <button
          onClick={() => { setEditingForm(null); setBuilderOpen(true) }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-pink text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/25"
        >
          <Plus className="w-4 h-4" /> New Form
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search forms..."
            className="w-full pl-9 pr-3 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink">
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button onClick={load} className="w-9 h-9 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 flex items-center justify-center hover:border-brand-pink transition-colors">
          <RefreshCw className={`w-4 h-4 dark:text-gray-400 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={load} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl dark:bg-white/3 bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <ClipboardList className="w-14 h-14 dark:text-gray-700 text-gray-300" />
          <p className="text-base font-bold dark:text-gray-500 text-gray-400">{forms.length === 0 ? 'No forms yet' : 'No forms match your filter'}</p>
          {forms.length === 0 && (
            <button onClick={() => { setEditingForm(null); setBuilderOpen(true) }}
              className="px-5 py-2.5 rounded-xl bg-brand-pink text-white text-sm font-bold hover:opacity-90">
              Create your first form
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(form => (
            <motion.div key={form.id} layout
              className="group relative dark:bg-[#0F0B1A] bg-white rounded-2xl border dark:border-white/8 border-gray-200 p-5 hover:border-brand-pink/40 hover:shadow-lg hover:shadow-pink-500/5 transition-all">

              {/* Status dot */}
              <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${form.is_active ? 'bg-green-500' : 'bg-gray-500'}`} title={form.is_active ? 'Published' : 'Draft'} />

              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-love-soft flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-brand-pink" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm dark:text-white text-gray-900 truncate pr-4">{form.title}</h3>
                  <p className="text-[11px] font-mono dark:text-gray-500 text-gray-400 truncate">/forms/{form.slug}</p>
                </div>
              </div>

              {form.description && (
                <p className="text-xs dark:text-gray-500 text-gray-500 line-clamp-2 mb-3">{form.description}</p>
              )}

              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[form.category] || CATEGORY_COLOR.other}`}>
                  {CATEGORIES.find(c => c.value === form.category)?.label || form.category}
                </span>
                <span className="text-[10px] dark:text-gray-600 text-gray-400">{form.fields?.length || 0} fields</span>
                <span className="text-[10px] dark:text-gray-600 text-gray-400">{form.submission_count || 0} submissions</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 border-t dark:border-white/6 border-gray-100 pt-3">
                <button onClick={() => { setEditingForm(form); setBuilderOpen(true) }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg dark:bg-white/5 bg-gray-50 hover:bg-brand-pink/10 hover:text-brand-pink dark:text-gray-400 text-gray-600 text-xs font-semibold transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => setViewSubmissions(form)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg dark:bg-white/5 bg-gray-50 hover:bg-blue-500/10 hover:text-blue-400 dark:text-gray-400 text-gray-600 text-xs font-semibold transition-colors">
                  <Eye className="w-3.5 h-3.5" /> Responses
                </button>
                <button onClick={() => toggleActive(form)}
                  className="w-8 h-7 rounded-lg dark:bg-white/5 bg-gray-50 hover:bg-green-500/10 hover:text-green-400 dark:text-gray-400 text-gray-600 flex items-center justify-center transition-colors" title={form.is_active ? 'Unpublish' : 'Publish'}>
                  {form.is_active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <a href={`/forms/${form.slug}`} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-7 rounded-lg dark:bg-white/5 bg-gray-50 hover:bg-cyan-500/10 hover:text-cyan-400 dark:text-gray-400 text-gray-600 flex items-center justify-center transition-colors" title="View public form">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => duplicateForm(form)}
                  className="w-8 h-7 rounded-lg dark:bg-white/5 bg-gray-50 hover:bg-purple-500/10 hover:text-purple-400 dark:text-gray-400 text-gray-600 flex items-center justify-center transition-colors" title="Duplicate">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteId(form.id)}
                  className="w-8 h-7 rounded-lg dark:bg-white/5 bg-gray-50 hover:bg-red-500/10 hover:text-red-400 dark:text-gray-400 text-gray-600 flex items-center justify-center transition-colors" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {builderOpen && (
          <FormBuilderModal
            form={editingForm}
            onClose={() => { setBuilderOpen(false); setEditingForm(null) }}
            onSave={handleSave}
          />
        )}
        {viewSubmissions && (
          <SubmissionsModal form={viewSubmissions} onClose={() => setViewSubmissions(null)} />
        )}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-sm dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/8 border-gray-200 shadow-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold dark:text-white text-gray-900 mb-1">Delete Form?</h3>
              <p className="text-sm dark:text-gray-400 text-gray-600 mb-5">This will permanently delete the form and all its submissions. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 text-sm font-semibold dark:text-gray-300 text-gray-700 hover:dark:bg-white/8 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                  {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
