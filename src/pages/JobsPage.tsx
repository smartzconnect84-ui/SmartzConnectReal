import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, MapPin, Plus, Loader2, Link2, RefreshCw, Database, Search, DollarSign, ExternalLink, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { uploadToSufy } from '@/lib/sufy'
import { useOfflineDraft } from '@/lib/offlineDraft'

const jobTypes = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Remote']

interface JobRow {
  id: string
  title: string
  company: string
  description: string | null
  job_type: string
  location: string | null
  salary_range: string | null
  apply_url: string | null
  contact_email: string | null
  logo_url: string | null
  applicants_count: number
  poster_id: string
  applied: boolean
}

interface NewJob {
  title: string; company: string; description: string; job_type: string
  location: string; salary_range: string; apply_url: string; contact_email: string; logo_url: string
}

const emptyForm: NewJob = { title: '', company: '', description: '', job_type: 'Full-time', location: '', salary_range: '', apply_url: '', contact_email: '', logo_url: '' }

export default function JobsPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<NewJob>(emptyForm)
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useOfflineDraft('job-composer', form, setForm, { isEmpty: (d: any) => !d?.title?.trim() })

  const fetchJobs = async () => {
    setLoading(true)
    let query = supabase
      .from('jobs')
      .select('id, title, company, description, job_type, location, salary_range, apply_url, contact_email, logo_url, applicants_count, poster_id')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (activeType !== 'All') query = query.eq('job_type', activeType)

    const { data, error } = await query.limit(50)
    if (error) {
      setDbConnected(!error.message?.includes('does not exist'))
      setJobs([])
      setLoading(false)
      return
    }
    setDbConnected(true)

    let appliedIds = new Set<string>()
    if (user && data?.length) {
      const { data: apps } = await supabase.from('job_applications').select('job_id').eq('user_id', user.id)
      appliedIds = new Set((apps || []).map((a: any) => a.job_id))
    }

    setJobs((data || []).map((j: any) => ({ ...j, applied: appliedIds.has(j.id) })))
    setLoading(false)
  }

  useEffect(() => { fetchJobs() }, [activeType, user?.id])

  const filtered = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.toLowerCase().includes(search.toLowerCase()) ||
    (j.location || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const url = await uploadToSufy(file, 'jobs')
      setForm(f => ({ ...f, logo_url: url }))
    } catch { /* ignore */ }
    setUploadingImage(false)
  }

  const submitJob = async () => {
    if (!user || !form.title.trim() || !form.company.trim()) return
    setSubmitting(true)
    const { error } = await supabase.from('jobs').insert({
      poster_id: user.id,
      title: form.title.trim(),
      company: form.company.trim(),
      description: form.description.trim() || null,
      job_type: form.job_type,
      location: form.location.trim() || null,
      salary_range: form.salary_range.trim() || null,
      apply_url: form.apply_url.trim() || null,
      contact_email: form.contact_email.trim() || null,
      logo_url: form.logo_url.trim() || null,
      is_active: true,
    })
    setSubmitting(false)
    if (!error) {
      setForm(emptyForm)
      setShowCreate(false)
      fetchJobs()
    }
  }

  const applyToJob = async (job: JobRow) => {
    if (!user || job.applied) return
    const { error } = await supabase.from('job_applications').insert({ job_id: job.id, user_id: user.id })
    if (!error) {
      await supabase.from('jobs').update({ applicants_count: job.applicants_count + 1 }).eq('id', job.id)
      if (job.apply_url) window.open(job.apply_url, '_blank', 'noopener')
      fetchJobs()
    }
  }

  return (
    <div className="h-full flex flex-col dark:bg-[#0A0710] bg-gray-50 overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex-shrink-0 dark:bg-[#0D0A14] bg-white border-b dark:border-white/6 border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display font-black text-xl dark:text-white text-gray-900">Jobs 💼</h1>
            <p className="text-xs dark:text-gray-400 text-gray-500">{dbConnected ? `${filtered.length} openings` : 'Connect database'}</p>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button onClick={() => setShowCreate(!showCreate)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-love-soft border border-pink-500/20 text-brand-pink text-xs font-bold hover:bg-pink-500/10 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Post Job
              </button>
            )}
            <button onClick={fetchJobs} className="w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
              <RefreshCw className="w-4 h-4 dark:text-gray-400 text-gray-600" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-3 overflow-hidden">
              <div className="dark:bg-white/5 bg-gray-50 rounded-2xl border dark:border-white/8 border-gray-200 p-4">
                <p className="text-sm font-bold dark:text-white text-gray-900 mb-3">Post a Job</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input placeholder="Job title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink" />
                  <input placeholder="Company *" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink" />
                  <select value={form.job_type} onChange={e => setForm(f => ({ ...f, job_type: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink">
                    {jobTypes.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink" />
                  <input placeholder="Salary range (optional)" value={form.salary_range} onChange={e => setForm(f => ({ ...f, salary_range: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink" />
                  <input placeholder="Apply URL (optional)" value={form.apply_url} onChange={e => setForm(f => ({ ...f, apply_url: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink" />
                  <input placeholder="Contact email (optional)" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                    className="col-span-2 px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink" />
                  <textarea placeholder="Description (optional)" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="col-span-2 px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink resize-none" />
                  <div className="col-span-2 flex items-center gap-2">
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    {form.logo_url && <img src={form.logo_url} alt="logo preview" className="w-9 h-9 rounded-lg object-cover border dark:border-white/8 border-gray-200 flex-shrink-0" />}
                    <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-[10px] font-semibold dark:text-gray-300 text-gray-700 hover:border-brand-pink/40 transition-colors disabled:opacity-50 whitespace-nowrap">
                      {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                      {uploadingImage ? 'Uploading…' : 'Upload Logo'}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 text-sm dark:text-gray-400 text-gray-600">Cancel</button>
                  <button onClick={submitJob} disabled={submitting || !form.title.trim() || !form.company.trim()}
                    className="flex-1 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold disabled:opacity-50">
                    {submitting ? 'Posting…' : 'Post Job'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs, companies, locations..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 border dark:border-white/8 border-gray-200 text-sm dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {jobTypes.map(t => (
            <button key={t} onClick={() => setActiveType(t)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeType === t ? 'bg-love-gradient text-white shadow-sm' : 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-brand-pink'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4 animate-pulse h-24" />
            ))}
          </div>
        ) : !dbConnected ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl dark:bg-white/5 bg-gray-100 flex items-center justify-center"><Database className="w-8 h-8 dark:text-gray-600 text-gray-400" /></div>
            <div><p className="font-bold dark:text-white text-gray-900 mb-1">Jobs not connected</p><p className="text-sm dark:text-gray-400 text-gray-500">Configure Supabase to display job listings</p></div>
            <button onClick={fetchJobs} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold"><RefreshCw className="w-4 h-4" /> Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="text-5xl mb-2">💼</div>
            <div><p className="font-bold dark:text-white text-gray-900 mb-1">{search ? 'No results found' : 'No jobs posted yet'}</p><p className="text-sm dark:text-gray-400 text-gray-500">{search ? 'Try a different search term' : 'Be the first to post an opening!'}</p></div>
            {user && !search && <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold"><Plus className="w-4 h-4" /> Post a Job</button>}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((job, i) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="dark:bg-[#130E1E] bg-white rounded-2xl border dark:border-white/6 border-gray-200 p-4 hover:shadow-lg hover:shadow-pink-500/5 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl dark:bg-gradient-to-br dark:from-pink-500/10 dark:to-purple-600/10 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {job.logo_url ? <img src={job.logo_url} alt={job.company} className="w-full h-full object-cover" /> : <Briefcase className="w-5 h-5 dark:text-pink-400/50 text-pink-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm dark:text-white text-gray-900 truncate">{job.title}</p>
                        <p className="text-xs dark:text-gray-400 text-gray-500 truncate">{job.company}</p>
                      </div>
                      <span className="flex-shrink-0 px-2 py-0.5 rounded-full dark:bg-white/5 bg-gray-100 text-[10px] font-bold dark:text-gray-300 text-gray-600">{job.job_type}</span>
                    </div>
                    {job.description && <p className="text-xs dark:text-gray-400 text-gray-500 mt-1.5 line-clamp-2">{job.description}</p>}
                    <div className="flex items-center gap-3 text-[10px] dark:text-gray-500 text-gray-400 mt-2 flex-wrap">
                      {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>}
                      {job.salary_range && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {job.salary_range}</span>}
                      <span>{job.applicants_count} applicant{job.applicants_count === 1 ? '' : 's'}</span>
                    </div>
                    {user ? (
                      <button onClick={() => applyToJob(job)} disabled={job.applied}
                        className={`mt-3 flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-colors ${job.applied ? 'dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-500' : 'bg-love-gradient text-white'}`}>
                        {job.applied ? <><CheckCircle2 className="w-3.5 h-3.5" /> Applied</> : job.apply_url ? <><ExternalLink className="w-3.5 h-3.5" /> Apply Now</> : 'Apply Now'}
                      </button>
                    ) : (
                      <p className="text-[10px] dark:text-gray-500 text-gray-400 mt-2">Sign in to apply</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
