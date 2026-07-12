import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, CheckCircle, XCircle, Timer, Award,
  BookOpen, Video, ChevronRight, Loader2, AlertCircle, Mail,
  Send, Trophy, RotateCcw, Play, GraduationCap, Lock, Crown, Clock
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Course {
  id: string; title: string; description: string | null; cover_url: string | null
  category: string; level: string; duration_mins: number; pass_score: number; quiz_timer_secs: number
}
interface Lesson {
  id: string; title: string; content: string | null; video_url: string | null
  order_index: number; duration_mins: number
}
interface Question {
  id: string; question: string; options: string[]; correct_index: number; explanation: string | null; order_index: number
}

type Stage = 'overview' | 'lesson' | 'quiz' | 'result' | 'cert' | 'pending_ceo' | 'ceo_approved'

function fmtTime(s: number) {
  const m = Math.floor(s / 60), sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CoursePlayerPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [stage, setStage] = useState<Stage>('overview')
  const [lessonIdx, setLessonIdx] = useState(0)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())

  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [showExplanation, setShowExplanation] = useState(false)
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; correct: number } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Certificate state
  const [certEmail, setCertEmail] = useState('')
  const [certName, setCertName] = useState('')
  const [certSending, setCertSending] = useState(false)
  const [certSent, setCertSent] = useState(false)
  const [certCode, setCertCode] = useState('')
  const [certError, setCertError] = useState('')
  const [certId, setCertId] = useState<string | null>(null)

  // Load course data
  useEffect(() => {
    if (!courseId) return
    ;(async () => {
      setLoading(true)
      const [courseRes, lessonRes, qRes] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).eq('is_published', true).single(),
        supabase.from('lessons').select('*').eq('course_id', courseId).order('order_index'),
        supabase.from('quiz_questions').select('*').eq('course_id', courseId).order('order_index'),
      ])
      if (courseRes.error || !courseRes.data) { setError('Course not found or not published'); setLoading(false); return }
      setCourse(courseRes.data)
      setLessons(lessonRes.data || [])
      setQuestions(qRes.data || [])
      setTimeLeft(courseRes.data.quiz_timer_secs)
      setLoading(false)
    })()
  }, [courseId])

  // Pre-fill email/name from profile
  useEffect(() => {
    if (!user?.id) return
    supabase.from('profiles').select('full_name, email').eq('id', user.id).single().then(({ data }) => {
      if (data) { setCertName(data.full_name || ''); setCertEmail(data.email || '') }
    })
  }, [user?.id])

  // Quiz timer countdown
  useEffect(() => {
    if (stage !== 'quiz' || !quizStarted || timeLeft <= 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); submitQuiz(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [stage, quizStarted])

  const startQuiz = () => {
    setQuizStarted(true)
    setCurrentQ(0)
    setAnswers([])
    setShowExplanation(false)
    setStage('quiz')
    if (course) setTimeLeft(course.quiz_timer_secs)
  }

  const chooseAnswer = (optIdx: number) => {
    if (answers[currentQ] !== undefined) return // already answered
    const next = [...answers]
    next[currentQ] = optIdx
    setAnswers(next)
    setShowExplanation(true)
  }

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1)
      setShowExplanation(false)
    } else {
      submitQuiz()
    }
  }

  const submitQuiz = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const correct = answers.filter((a, i) => a === questions[i]?.correct_index).length
    const score = questions.length ? Math.round((correct / questions.length) * 100) : 0
    const passed = score >= (course?.pass_score || 70)
    setQuizResult({ score, passed, correct })
    setStage('result')
    // Save attempt
    if (user?.id && courseId) {
      supabase.from('quiz_attempts').insert({
        user_id: user.id, course_id: courseId,
        score, total_questions: questions.length,
        answers: answers.map((a, i) => ({ question_id: questions[i]?.id, chosen_index: a, correct: a === questions[i]?.correct_index })),
        time_taken_secs: (course?.quiz_timer_secs || 0) - timeLeft,
        passed, certificate_sent: false,
      })
    }
  }, [answers, questions, course, user, courseId, timeLeft])

  // Subscribe to certificate CEO-approval realtime updates
  useEffect(() => {
    if (!user?.id || !courseId) return
    const ch = supabase
      .channel(`cert-approval-${user.id}-${courseId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'certificates',
        filter: `user_id=eq.${user.id}`,
      }, (payload: any) => {
        if (payload.new?.course_id === courseId && payload.new?.ceo_approved === true) {
          setCertCode(payload.new.certificate_code || '')
          setStage('ceo_approved')
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'certificates',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        if (stage === 'pending_ceo') {
          setCertError('Your certificate was not approved. Please contact support.')
          setStage('cert')
        }
      })
      .subscribe()
    return () => { ch.unsubscribe() }
  }, [user?.id, courseId, stage])

  // Check for existing pending/approved cert on load (if returning)
  useEffect(() => {
    if (!user?.id || !courseId) return
    ;(async () => {
      const { data } = await supabase
        .from('certificates')
        .select('id, certificate_code, ceo_approved')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .order('issued_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!data) return
      setCertId(data.id)
      setCertCode(data.certificate_code || '')
      if (data.ceo_approved) {
        setStage('ceo_approved')
      } else {
        setStage('pending_ceo')
      }
    })()
  }, [user?.id, courseId])

  const sendCertificate = async () => {
    if (!certEmail.trim() || !certName.trim() || !course || !quizResult) return
    setCertSending(true); setCertError('')
    try {
      const code = `SC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      setCertCode(code)

      // Save cert with ceo_approved: false — CEO must approve before email is sent
      const { data: certData, error: dbErr } = await supabase
        .from('certificates')
        .insert({
          user_id: user?.id || null,
          course_id: course.id,
          recipient_name: certName,
          email: certEmail,
          score: quizResult.score,
          certificate_code: code,
          ceo_approved: false,
          // sent_at is NOT set yet — will be set when CEO approves
        })
        .select('id')
        .single()
      if (dbErr) throw new Error(dbErr.message)
      setCertId(certData?.id || null)

      // Notify learner their request is pending
      setStage('pending_ceo')
    } catch (e: any) {
      setCertError(e.message || 'Failed to submit certificate request')
    }
    setCertSending(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full dark:bg-[#0A0710] bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-brand-pink" />
    </div>
  )

  if (error || !course) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 dark:bg-[#0A0710] bg-gray-50">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <p className="dark:text-white text-gray-900 font-semibold">{error || 'Course not found'}</p>
      <Link to="/app/learning" className="px-4 py-2 rounded-xl bg-love-gradient text-white text-sm font-bold">Back to Learning</Link>
    </div>
  )

  const currentLesson = lessons[lessonIdx]
  const progress = lessons.length ? Math.round((completedLessons.size / lessons.length) * 100) : 0

  return (
    <div className="h-full flex flex-col dark:bg-[#0A0710] bg-gray-50 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 dark:bg-[#0D0A14] bg-white border-b dark:border-white/6 border-gray-100 flex-shrink-0">
        <button onClick={() => navigate('/app/learning')} className="w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center hover:text-brand-pink transition-colors">
          <ArrowLeft className="w-4 h-4 dark:text-gray-400 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm dark:text-white text-gray-900 truncate">{course.title}</p>
          <p className="text-[11px] dark:text-gray-500 text-gray-400">{course.level} · {course.category}</p>
        </div>
        {lessons.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full dark:bg-white/10 bg-gray-200 overflow-hidden">
              <div className="h-full bg-love-gradient rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[11px] dark:text-gray-500 text-gray-400">{progress}%</span>
          </div>
        )}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {stage === 'overview' && (
        <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
          {course.cover_url && <img src={course.cover_url} alt={course.title} className="w-full h-40 object-cover rounded-2xl mb-4" />}
          <h2 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-2">{course.title}</h2>
          {course.description && <p className="text-sm dark:text-gray-400 text-gray-600 mb-6 leading-relaxed">{course.description}</p>}

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Lessons', value: lessons.length },
              { label: 'Questions', value: questions.length },
              { label: 'Pass score', value: `${course.pass_score}%` },
            ].map(stat => (
              <div key={stat.label} className="dark:bg-white/5 bg-white border dark:border-white/8 border-gray-200 rounded-xl p-3 text-center">
                <div className="font-black text-xl dark:text-white text-gray-900">{stat.value}</div>
                <div className="text-xs dark:text-gray-500 text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Lessons list */}
          {lessons.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold dark:text-white text-gray-900 mb-3">Lessons</h3>
              <div className="space-y-2">
                {lessons.map((l, i) => (
                  <button key={l.id} onClick={() => { setLessonIdx(i); setStage('lesson') }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl dark:bg-white/[0.03] bg-white border dark:border-white/8 border-gray-200 hover:border-brand-pink/30 transition-all text-left group">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${completedLessons.has(l.id) ? 'bg-emerald-500' : 'bg-love-gradient'}`}>
                      {completedLessons.has(l.id) ? <CheckCircle className="w-4 h-4 text-white" /> : <span className="text-xs font-bold text-white">{i + 1}</span>}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm dark:text-white text-gray-900 group-hover:text-brand-pink transition-colors">{l.title}</p>
                      <div className="flex items-center gap-2 text-[11px] dark:text-gray-500 text-gray-400">
                        {l.video_url && <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Video</span>}
                        {l.content && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> Text</span>}
                        <span>{l.duration_mins}m</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 dark:text-gray-600 text-gray-400 group-hover:text-brand-pink transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quiz start */}
          {questions.length > 0 && (
            <div className="dark:bg-white/[0.03] bg-white border dark:border-white/8 border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-love-gradient flex items-center justify-center"><Timer className="w-5 h-5 text-white" /></div>
                <div>
                  <p className="font-bold dark:text-white text-gray-900">Final Quiz</p>
                  <p className="text-xs dark:text-gray-500 text-gray-500">{questions.length} questions · {fmtTime(course.quiz_timer_secs)} timer · Pass at {course.pass_score}%</p>
                </div>
              </div>
              <button onClick={startQuiz}
                className="w-full py-3 rounded-xl bg-love-gradient text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <Play className="w-4 h-4" /> Start Quiz
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── LESSON VIEWER ──────────────────────────────────────────────── */}
      {stage === 'lesson' && currentLesson && (
        <div className="flex-1 overflow-y-auto p-4 pb-4">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-2 text-xs dark:text-gray-500 text-gray-400">
              <button onClick={() => setStage('overview')} className="hover:text-brand-pink transition-colors">Course</button>
              <ChevronRight className="w-3 h-3" />
              <span className="dark:text-white text-gray-900 font-semibold">Lesson {lessonIdx + 1}</span>
            </div>

            <h2 className="font-display font-black text-2xl dark:text-white text-gray-900">{currentLesson.title}</h2>

            {currentLesson.video_url && (
              <div className="aspect-video rounded-2xl overflow-hidden bg-black">
                <iframe src={currentLesson.video_url} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
              </div>
            )}

            {currentLesson.content && (
              <div className="dark:bg-white/[0.03] bg-white border dark:border-white/8 border-gray-200 rounded-2xl p-5">
                <div className="prose prose-sm dark:prose-invert max-w-none dark:text-gray-300 text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                  {currentLesson.content}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => { if (lessonIdx > 0) { setLessonIdx(i => i - 1); } else setStage('overview') }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 text-sm font-semibold hover:text-brand-pink transition-colors">
                <ArrowLeft className="w-4 h-4" /> {lessonIdx === 0 ? 'Overview' : 'Previous'}
              </button>
              <button
                onClick={() => {
                  setCompletedLessons(s => new Set([...s, currentLesson.id]))
                  if (lessonIdx < lessons.length - 1) setLessonIdx(i => i + 1)
                  else setStage('overview')
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-love-gradient text-white text-sm font-bold">
                {lessonIdx < lessons.length - 1 ? (
                  <><CheckCircle className="w-4 h-4" /> Complete & Next</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Finish Lessons</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QUIZ ───────────────────────────────────────────────────────── */}
      {stage === 'quiz' && questions.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 pb-4">
          <div className="max-w-xl mx-auto space-y-4">
            {/* Timer bar */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs dark:text-gray-500 text-gray-400 font-semibold">Question {currentQ + 1} / {questions.length}</p>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${timeLeft <= 60 ? 'bg-red-500/20 text-red-400' : 'dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900'}`}>
                <Timer className="w-4 h-4" /> {fmtTime(timeLeft)}
              </div>
            </div>

            {/* Progress */}
            <div className="w-full h-1.5 dark:bg-white/10 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-love-gradient rounded-full transition-all" style={{ width: `${((currentQ) / questions.length) * 100}%` }} />
            </div>

            <div className="dark:bg-white/[0.03] bg-white border dark:border-white/8 border-gray-200 rounded-2xl p-5 space-y-4">
              <p className="font-bold dark:text-white text-gray-900 text-base leading-relaxed">{questions[currentQ]?.question}</p>

              <div className="space-y-2">
                {questions[currentQ]?.options.map((opt, i) => {
                  const chosen = answers[currentQ]
                  const isCorrect = i === questions[currentQ]?.correct_index
                  const isChosen = i === chosen
                  let style = 'dark:bg-white/5 bg-gray-50 dark:border-white/10 border-gray-200 dark:text-gray-300 text-gray-700 hover:border-brand-pink/40'
                  if (showExplanation) {
                    if (isCorrect) style = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    else if (isChosen && !isCorrect) style = 'bg-red-500/15 border-red-500/40 text-red-400'
                  }
                  return (
                    <button key={i} onClick={() => chooseAnswer(i)} disabled={showExplanation}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-sm text-left transition-all ${style} disabled:cursor-default`}>
                      <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 border-current">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                      {showExplanation && isCorrect && <CheckCircle className="w-4 h-4 ml-auto flex-shrink-0 text-emerald-400" />}
                      {showExplanation && isChosen && !isCorrect && <XCircle className="w-4 h-4 ml-auto flex-shrink-0 text-red-400" />}
                    </button>
                  )
                })}
              </div>

              {showExplanation && questions[currentQ]?.explanation && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="px-4 py-3 rounded-xl dark:bg-amber-500/10 bg-amber-50 border dark:border-amber-500/20 border-amber-200 text-sm dark:text-amber-300 text-amber-700">
                  💡 {questions[currentQ].explanation}
                </motion.div>
              )}

              {showExplanation && (
                <button onClick={nextQuestion} className="w-full py-3 rounded-xl bg-love-gradient text-white font-bold flex items-center justify-center gap-2">
                  {currentQ < questions.length - 1 ? <><ArrowRight className="w-4 h-4" /> Next Question</> : <><CheckCircle className="w-4 h-4" /> Submit Quiz</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── RESULT ─────────────────────────────────────────────────────── */}
      {stage === 'result' && quizResult && (
        <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4 flex items-center justify-center">
          <div className="max-w-md w-full space-y-5">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 15 }}
              className="text-center dark:bg-white/[0.03] bg-white border dark:border-white/8 border-gray-200 rounded-3xl p-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${quizResult.passed ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                {quizResult.passed ? <Trophy className="w-10 h-10 text-emerald-400" /> : <XCircle className="w-10 h-10 text-red-400" />}
              </div>
              <h2 className="font-display font-black text-3xl dark:text-white text-gray-900 mb-1">
                {quizResult.passed ? '🎉 Passed!' : 'Not quite'}
              </h2>
              <p className="text-sm dark:text-gray-400 text-gray-600 mb-5">
                You scored {quizResult.score}% ({quizResult.correct}/{questions.length} correct). Pass: {course.pass_score}%
              </p>
              {/* Score ring */}
              <div className="relative w-28 h-28 mx-auto mb-5">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3"
                    stroke={quizResult.passed ? '#10b981' : '#ef4444'}
                    strokeDasharray={`${quizResult.score} ${100 - quizResult.score}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`font-black text-2xl ${quizResult.passed ? 'text-emerald-400' : 'text-red-400'}`}>{quizResult.score}%</span>
                </div>
              </div>
              <div className="flex gap-3">
                {quizResult.passed ? (
                  <button onClick={() => setStage('cert')} className="flex-1 py-3 rounded-xl bg-love-gradient text-white font-bold flex items-center justify-center gap-2">
                    <Award className="w-4 h-4" /> Get Certificate
                  </button>
                ) : (
                  <button onClick={startQuiz} className="flex-1 py-3 rounded-xl bg-love-gradient text-white font-bold flex items-center justify-center gap-2">
                    <RotateCcw className="w-4 h-4" /> Retry Quiz
                  </button>
                )}
                <button onClick={() => setStage('overview')} className="px-4 py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 font-semibold">
                  Overview
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* ── PENDING CEO APPROVAL ───────────────────────────────────────── */}
      {stage === 'pending_ceo' && (
        <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4 flex items-center justify-center">
          <div className="max-w-md w-full">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
              className="dark:bg-white/[0.03] bg-white border dark:border-white/8 border-gray-200 rounded-3xl p-8 text-center space-y-5">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Crown className="w-10 h-10 text-amber-400" />
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 border-2 dark:border-[#0A0710] border-white flex items-center justify-center">
                  <Clock className="w-3 h-3 text-white" />
                </span>
              </div>
              <div>
                <h2 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-2">Pending CEO Approval 👑</h2>
                <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">
                  Your certificate for <strong className="dark:text-white text-gray-900">{course?.title}</strong> has been submitted and is awaiting CEO review.
                </p>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl dark:bg-amber-500/8 bg-amber-50 border dark:border-amber-500/15 border-amber-200 text-left">
                <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs dark:text-amber-400/80 text-amber-700">
                  <strong>Stay on this page</strong> to receive an instant notification when your certificate is approved — or check your email inbox.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStage('overview')} className="flex-1 py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 text-sm font-semibold">
                  Back to Course
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* ── CEO APPROVED — CONGRATULATIONS ─────────────────────────────── */}
      {stage === 'ceo_approved' && (
        <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4 flex items-center justify-center">
          <div className="max-w-md w-full">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 12 }}
              className="dark:bg-white/[0.03] bg-white border dark:border-white/8 border-gray-200 rounded-3xl p-8 text-center space-y-5">
              <div className="relative">
                <motion.div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/30"
                  animate={{ rotate: [0, -5, 5, -3, 3, 0] }} transition={{ duration: 0.6, delay: 0.3 }}>
                  <GraduationCap className="w-12 h-12 text-white" />
                </motion.div>
                <motion.div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}>
                  <Crown className="w-5 h-5 text-white" />
                </motion.div>
              </div>
              <div>
                <h2 className="font-display font-black text-3xl dark:text-white text-gray-900 mb-2">🎉 Congratulations!</h2>
                <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">
                  Your certificate for <strong className="dark:text-white text-gray-900">{course?.title}</strong> has been approved by the CEO and sent to your email!
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl dark:bg-amber-500/8 bg-amber-50 border dark:border-amber-500/15 border-amber-200">
                <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs dark:text-amber-400 text-amber-700 font-semibold">CEO-approved & verified ✓</p>
              </div>
              {certCode && (
                <div className="px-4 py-3 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200">
                  <p className="text-xs dark:text-gray-500 text-gray-500 mb-1">Certificate Code</p>
                  <p className="font-mono font-bold text-lg text-brand-pink">{certCode}</p>
                </div>
              )}
              <Link to="/app/learning"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-love-gradient text-white font-bold">
                <BookOpen className="w-4 h-4" /> Explore More Courses
              </Link>
            </motion.div>
          </div>
        </div>
      )}

      {/* ── CERTIFICATE EMAIL ──────────────────────────────────────────── */}
      {stage === 'cert' && quizResult && (
        <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4 flex items-center justify-center">
          <div className="max-w-md w-full space-y-5">
            {!certSent ? (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="dark:bg-white/[0.03] bg-white border dark:border-white/8 border-gray-200 rounded-3xl p-8 space-y-5">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-love-gradient flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-1">Get Your Certificate</h2>
                  <p className="text-sm dark:text-gray-400 text-gray-600">
                    Enter your name and email — your certificate will be sent instantly.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs dark:text-gray-500 text-gray-500 font-semibold mb-1 block">Full Name (on certificate)</label>
                    <input
                      className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 text-sm dark:text-white text-gray-900 placeholder:dark:text-gray-600 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors"
                      placeholder="Your full name"
                      value={certName} onChange={e => setCertName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs dark:text-gray-500 text-gray-500 font-semibold mb-1 block">Email Address</label>
                    <input type="email"
                      className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 text-sm dark:text-white text-gray-900 placeholder:dark:text-gray-600 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors"
                      placeholder="you@example.com"
                      value={certEmail} onChange={e => setCertEmail(e.target.value)}
                    />
                  </div>
                </div>

                {certError && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {certError}
                  </div>
                )}

                <button onClick={sendCertificate} disabled={certSending || !certEmail.trim() || !certName.trim()}
                  className="w-full py-3.5 rounded-xl bg-love-gradient text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity">
                  {certSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {certSending ? 'Sending…' : 'Send My Certificate'}
                </button>
                <p className="text-center text-[11px] dark:text-gray-600 text-gray-400">Your certificate request will be reviewed and approved by the CEO before being emailed to you.</p>
              </motion.div>
            ) : (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
                className="dark:bg-white/[0.03] bg-white border dark:border-white/8 border-gray-200 rounded-3xl p-8 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="font-display font-black text-2xl dark:text-white text-gray-900">Certificate Sent! 🎓</h2>
                <p className="text-sm dark:text-gray-400 text-gray-600">
                  Your certificate for <strong className="dark:text-white text-gray-900">{course.title}</strong> has been sent to <strong className="dark:text-white text-gray-900">{certEmail}</strong>.
                </p>
                {certCode && (
                  <div className="px-4 py-3 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200">
                    <p className="text-xs dark:text-gray-500 text-gray-500 mb-1">Certificate Code</p>
                    <p className="font-mono font-bold text-lg text-brand-pink">{certCode}</p>
                  </div>
                )}
                <Link to="/app/learning"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-love-gradient text-white font-bold">
                  <BookOpen className="w-4 h-4" /> Explore More Courses
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
