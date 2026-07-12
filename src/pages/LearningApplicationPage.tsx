import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, Clock, DollarSign, User, Mail, Phone, FileText,
  CheckCircle, AlertCircle, Loader2, ArrowLeft, Bell, Calendar, ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Course {
  id: string
  title: string
  description: string | null
  cover_url: string | null
  category: string
  level: string
  duration_mins: number
  application_cost: number
  currency: string
  application_enabled: boolean
}

const DURATION_OPTIONS = [
  { days: 3, label: '3 Days', subtitle: 'Intensive sprint — core topics fast' },
  { days: 5, label: '5 Days', subtitle: 'Balanced pace — recommended' },
  { days: 7, label: '7 Days', subtitle: 'Deep dive — full mastery track' },
]

const inp = 'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-brand-pink transition-colors'

export default function LearningApplicationPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusAlert, setStatusAlert] = useState<{ status: string; notes: string } | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    motivation: '',
    duration_days: 5,
  })

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Fetch course
  useEffect(() => {
    if (!courseId) return
    ;(async () => {
      const { data } = await supabase
        .from('courses')
        .select('id, title, description, cover_url, category, level, duration_mins, application_cost, currency, application_enabled')
        .eq('id', courseId)
        .eq('is_published', true)
        .single()
      setCourse(data)
      setLoading(false)
    })()
  }, [courseId])

  // Pre-fill from profile if logged in
  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()
      if (data) {
        setForm(f => ({
          ...f,
          full_name: data.full_name || f.full_name,
          email: data.email || user.email || f.email,
        }))
      }
    })()
  }, [user])

  // Subscribe to application status changes (after submit)
  useEffect(() => {
    if (!applicationId) return
    const ch = supabase
      .channel(`application-${applicationId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'learning_applications',
        filter: `id=eq.${applicationId}`,
      }, (payload: any) => {
        const newStatus = payload.new?.status
        const notes = payload.new?.admin_notes || ''
        if (newStatus && newStatus !== 'pending') {
          setStatusAlert({ status: newStatus, notes })
        }
      })
      .subscribe()
    channelRef.current = ch
    return () => {
      ch.unsubscribe()
    }
  }, [applicationId])

  // Cleanup
  useEffect(() => {
    return () => { channelRef.current?.unsubscribe() }
  }, [])

  const handleSubmit = async () => {
    if (!course) return
    if (!form.full_name.trim() || !form.email.trim()) {
      setError('Full name and email are required.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const { data, error: dbErr } = await supabase
        .from('learning_applications')
        .insert({
          user_id: user?.id || null,
          course_id: course.id,
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          motivation: form.motivation.trim() || null,
          duration_days: form.duration_days,
          cost: course.application_cost || 0,
          currency: course.currency || 'USD',
          status: 'pending',
        })
        .select('id')
        .single()

      if (dbErr) throw new Error(dbErr.message)
      setApplicationId(data?.id || null)
      setSubmitted(true)
    } catch (e: any) {
      setError(e.message || 'Submission failed. Please try again.')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0710] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-pink" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0A0710] flex flex-col items-center justify-center gap-4 text-center p-6">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <h2 className="text-xl font-bold text-white">Course not found</h2>
        <p className="text-gray-400 text-sm">This course may not be available for applications.</p>
        <Link to="/" className="px-6 py-3 rounded-xl bg-love-gradient text-white font-bold text-sm">
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0710] text-white">
      {/* Header */}
      <div className="border-b border-white/8 px-4 py-4 flex items-center gap-3 max-w-2xl mx-auto">
        <Link to="/" className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:text-brand-pink transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-love-gradient flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm">SmartzConnect Academy</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Live status alert (realtime) */}
        <AnimatePresence>
          {statusAlert && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`flex items-start gap-3 p-4 rounded-2xl border ${
                statusAlert.status === 'admin_approved'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
              {statusAlert.status === 'admin_approved'
                ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
              <div>
                <p className="font-bold text-sm">
                  {statusAlert.status === 'admin_approved'
                    ? '🎉 Application Approved!'
                    : 'Application Not Approved'}
                </p>
                <p className="text-xs opacity-80 mt-1">
                  {statusAlert.status === 'admin_approved'
                    ? 'Your enrolment has been approved. Check your email for next steps.'
                    : statusAlert.notes || 'Unfortunately your application was not approved at this time.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Course card */}
        <div className="relative rounded-2xl overflow-hidden border border-white/8">
          {course.cover_url && (
            <img src={course.cover_url} alt={course.title}
              className="absolute inset-0 w-full h-full object-cover opacity-20" />
          )}
          <div className="relative p-5 bg-gradient-to-br from-pink-500/20 to-purple-600/20 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-xs font-bold text-brand-pink uppercase tracking-wide">{course.category}</span>
                <h1 className="font-display font-black text-2xl text-white mt-1 mb-2">{course.title}</h1>
                {course.description && (
                  <p className="text-sm text-white/70 line-clamp-2">{course.description}</p>
                )}
              </div>
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-love-gradient flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Clock className="w-3.5 h-3.5" />
                <span>{course.duration_mins} mins</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Calendar className="w-3.5 h-3.5" />
                <span>{course.level}</span>
              </div>
              {(course.application_cost ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-pink">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{course.application_cost} {course.currency || 'USD'}</span>
                </div>
              )}
              {(course.application_cost ?? 0) === 0 && (
                <span className="text-xs font-bold text-emerald-400">Free</span>
              )}
            </div>
          </div>
        </div>

        {!submitted ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 space-y-6">
            <div>
              <h2 className="font-display font-black text-xl text-white mb-1">Apply for this Course</h2>
              <p className="text-sm text-white/50">Fill in your details below. Your application will be reviewed and you'll receive a live notification on approval.</p>
            </div>

            {/* Personal details */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Personal Details</p>
              <div>
                <label className="text-xs text-white/40 font-semibold mb-1.5 block flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Full Name *
                </label>
                <input className={inp} placeholder="Your full name"
                  value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-white/40 font-semibold mb-1.5 block flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Email Address *
                </label>
                <input type="email" className={inp} placeholder="you@example.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-white/40 font-semibold mb-1.5 block flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Phone Number <span className="text-white/20">(optional)</span>
                </label>
                <input type="tel" className={inp} placeholder="+1 234 567 8900"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>

            {/* Duration selection */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Study Duration</p>
              <div className="space-y-2">
                {DURATION_OPTIONS.map(opt => (
                  <button key={opt.days} onClick={() => setForm(f => ({ ...f, duration_days: opt.days }))}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                      form.duration_days === opt.days
                        ? 'border-brand-pink bg-brand-pink/10'
                        : 'border-white/8 bg-white/[0.02] hover:border-white/20'
                    }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                      form.duration_days === opt.days ? 'bg-love-gradient text-white' : 'bg-white/5 text-white/40'
                    }`}>{opt.days}d</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white">{opt.label}</p>
                      <p className="text-xs text-white/40 mt-0.5">{opt.subtitle}</p>
                    </div>
                    {form.duration_days === opt.days && (
                      <CheckCircle className="w-5 h-5 text-brand-pink flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Motivation */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Why this course?</p>
              <label className="text-xs text-white/40 font-semibold mb-1.5 block flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Motivation <span className="text-white/20">(optional)</span>
              </label>
              <textarea rows={4} className={inp + ' resize-none'} placeholder="Tell us why you want to take this course and what you hope to achieve..."
                value={form.motivation} onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))} />
            </div>

            {/* Cost summary */}
            {(course.application_cost ?? 0) > 0 && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-pink/8 border border-brand-pink/20">
                <div>
                  <p className="text-xs text-white/50 font-semibold">Application Fee</p>
                  <p className="text-xs text-white/30 mt-0.5">Payable upon approval</p>
                </div>
                <p className="font-black text-xl text-brand-pink">{course.application_cost} <span className="text-sm font-bold">{course.currency}</span></p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting || !form.full_name.trim() || !form.email.trim()}
              className="w-full py-4 rounded-2xl bg-love-gradient text-white font-black text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
            <p className="text-center text-[11px] text-white/25">
              By submitting, you agree to our Terms of Service. Your application will be reviewed within 24–48 hours.
            </p>
          </motion.div>
        ) : (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
            className="bg-white/[0.03] border border-white/8 rounded-3xl p-8 text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <Bell className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-display font-black text-2xl text-white mb-2">Application Submitted! 🎉</h2>
              <p className="text-sm text-white/50">
                Your application for <strong className="text-white">{course.title}</strong> has been received.
              </p>
            </div>
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Applicant</span>
                <span className="text-white font-semibold">{form.full_name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Email</span>
                <span className="text-white">{form.email}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Duration</span>
                <span className="text-white font-semibold">{form.duration_days} Days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Status</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400">Pending Review</span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/8 border border-blue-500/20 text-left">
              <Bell className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300">
                <strong>Stay on this page</strong> to receive a live notification when your application is reviewed — or check your email inbox. We typically respond within 24–48 hours.
              </p>
            </div>
            <Link to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
