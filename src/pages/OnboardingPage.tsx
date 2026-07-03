import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Heart, Camera, MapPin, Sparkles, ChevronRight, ChevronLeft, Check } from 'lucide-react'

const logoImg = '/logo.png'

const INTERESTS = [
  '🎵 Music', '💃 Dancing', '🎬 Movies', '📚 Reading', '✈️ Travel',
  '🍳 Cooking', '💪 Fitness', '🎮 Gaming', '📸 Photography', '🎨 Art',
  '⚽ Football', '🏀 Basketball', '🌿 Nature', '💻 Tech', '🎭 Theatre',
  '🧘 Yoga', '🎸 Guitar', '🌍 Culture', '💼 Business', '🎤 Singing',
]

const GOALS = [
  { id: 'dating',  emoji: '💕', label: 'Dating & Romance'    },
  { id: 'friends', emoji: '🤝', label: 'Make Friends'        },
  { id: 'network', emoji: '💼', label: 'Professional Network' },
  { id: 'fun',     emoji: '🎉', label: 'Just Have Fun'       },
]

const steps = [
  { id: 1, title: 'Welcome!',       subtitle: 'Let\'s set up your profile'      },
  { id: 2, title: 'Your Photo',     subtitle: 'Add a profile picture'            },
  { id: 3, title: 'Your Interests', subtitle: 'Pick up to 10 things you love'   },
  { id: 4, title: 'Your Location',  subtitle: 'Help us find people near you'     },
  { id: 5, title: 'Your Goal',      subtitle: 'What are you here for?'           },
]

const INPUT_CLS = 'w-full px-4 py-3 rounded-xl dark:bg-white/[0.04] bg-gray-50/80 border dark:border-white/[0.08] border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink transition-all text-sm'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep]                             = useState(1)
  const [selectedInterests, setSelectedInterests]   = useState<string[]>([])
  const [selectedGoal, setSelectedGoal]             = useState('')
  const [location, setLocation]                     = useState('')
  const [name, setName]                             = useState('')
  const [age, setAge]                               = useState('')
  const [gender, setGender]                         = useState('')

  const progress = ((step - 1) / (steps.length - 1)) * 100

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : prev.length < 10 ? [...prev, interest] : prev
    )
  }

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0 && age.trim().length > 0 && gender !== ''
    if (step === 2) return true
    if (step === 3) return selectedInterests.length >= 3
    if (step === 4) return location.trim().length > 0
    if (step === 5) return selectedGoal !== ''
    return true
  }

  const handleNext = () => {
    if (step < steps.length) setStep(s => s + 1)
    else navigate('/app/discover')
  }

  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50 flex flex-col items-center justify-center p-4 py-10 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/4 w-[600px] h-[450px] rounded-full bg-pink-500/8 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[350px] rounded-full bg-purple-500/8 blur-[80px]" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-7">
          <div className="relative">
            <img src={logoImg} alt="SmartzConnect" className="w-9 h-9 object-contain relative z-10" />
            <div className="absolute inset-0 rounded-xl bg-brand-pink/20 blur-md" />
          </div>
          <span className="font-display font-black text-xl tracking-tight">
            <span className="bg-love-gradient bg-clip-text text-transparent">Smartz</span>
            <span className="dark:text-white text-gray-900">Connect</span>
          </span>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold dark:text-gray-400 text-gray-500">
              Step {step} of {steps.length}
            </span>
            <span className="text-xs font-bold text-brand-pink">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 dark:bg-white/[0.07] bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-love-gradient rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="flex justify-between mt-2.5 px-0.5">
            {steps.map(s => (
              <motion.div
                key={s.id}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${s.id <= step ? 'bg-brand-pink' : 'dark:bg-white/10 bg-gray-200'}`}
                animate={{ scale: s.id === step ? 1.3 : 1 }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="dark:bg-[#110D1B] bg-white rounded-3xl border dark:border-white/[0.07] border-gray-100/80 shadow-2xl dark:shadow-black/40 shadow-gray-200/60 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 sm:p-8"
            >
              <div className="mb-6">
                <h2 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-1 leading-tight">
                  {steps[step - 1].title}
                </h2>
                <p className="text-sm dark:text-gray-400 text-gray-500">{steps[step - 1].subtitle}</p>
              </div>

              {/* ── Step 1: Basic info ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5">Your Name</label>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Amara Kollie"
                      className={INPUT_CLS}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5">Age</label>
                      <input
                        value={age}
                        onChange={e => setAge(e.target.value)}
                        type="number"
                        min="18"
                        max="99"
                        placeholder="25"
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5">Gender</label>
                      <select value={gender} onChange={e => setGender(e.target.value)} className={INPUT_CLS}>
                        <option value="">Select</option>
                        <option value="man">Man</option>
                        <option value="woman">Woman</option>
                        <option value="nonbinary">Non-binary</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-pink-500/[0.06] border border-pink-500/[0.12]">
                    <p className="text-xs dark:text-gray-300 text-gray-700 leading-relaxed">
                      🔒 Your information is private and secure. We never share your personal data.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Step 2: Photo ── */}
              {step === 2 && (
                <div className="text-center space-y-5">
                  <div className="w-32 h-32 rounded-3xl bg-pink-500/[0.06] border-2 border-dashed border-pink-500/30 flex flex-col items-center justify-center mx-auto cursor-pointer hover:border-brand-pink hover:bg-pink-500/[0.08] transition-all group">
                    <Camera className="w-8 h-8 text-brand-pink mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-brand-pink">Add Photo</span>
                  </div>
                  <p className="text-sm dark:text-gray-400 text-gray-600">
                    Profiles with photos get{' '}
                    <span className="font-bold text-brand-pink">10x more matches</span>
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="aspect-square rounded-2xl dark:bg-white/[0.04] bg-gray-100 border-2 border-dashed dark:border-white/[0.08] border-gray-200 flex items-center justify-center">
                        <span className="text-2xl dark:text-white/20 text-gray-300">+</span>
                      </div>
                    ))}
                  </div>
                  <button className="text-xs dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors">
                    Skip for now →
                  </button>
                </div>
              )}

              {/* ── Step 3: Interests ── */}
              {step === 3 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs dark:text-gray-400 text-gray-600">Select at least 3</span>
                    <span className={`text-xs font-bold transition-colors ${selectedInterests.length >= 3 ? 'text-emerald-500' : 'text-brand-pink'}`}>
                      {selectedInterests.length}/10
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto scrollbar-hide">
                    {INTERESTS.map(interest => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                          selectedInterests.includes(interest)
                            ? 'bg-love-gradient text-white shadow-md shadow-pink-500/20 scale-105'
                            : 'dark:bg-white/[0.05] bg-gray-100 dark:text-gray-300 text-gray-700 hover:dark:bg-white/[0.08] hover:text-brand-pink'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 4: Location ── */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-pink" />
                    <input
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. Monrovia, Liberia"
                      className={`${INPUT_CLS} pl-10`}
                    />
                  </div>
                  <button className="w-full py-3 rounded-xl dark:bg-white/[0.05] bg-gray-100 dark:text-gray-300 text-gray-700 text-sm font-semibold hover:text-brand-pink hover:dark:bg-white/[0.08] hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4" /> Use My Current Location
                  </button>
                  <p className="text-xs dark:text-gray-500 text-gray-400 text-center">
                    We only show your city, never your exact address.
                  </p>
                </div>
              )}

              {/* ── Step 5: Goal ── */}
              {step === 5 && (
                <div className="space-y-3">
                  {GOALS.map(goal => (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                        selectedGoal === goal.id
                          ? 'border-brand-pink bg-pink-500/[0.06] dark:bg-pink-500/[0.08]'
                          : 'dark:border-white/[0.08] border-gray-200 dark:bg-white/[0.02] bg-gray-50 hover:border-pink-500/30 hover:dark:bg-white/[0.04]'
                      }`}
                    >
                      <span className="text-3xl">{goal.emoji}</span>
                      <span className={`font-semibold text-sm transition-colors ${
                        selectedGoal === goal.id ? 'text-brand-pink' : 'dark:text-white text-gray-900'
                      }`}>
                        {goal.label}
                      </span>
                      {selectedGoal === goal.id && (
                        <div className="ml-auto w-6 h-6 rounded-full bg-love-gradient flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="w-12 h-12 rounded-xl dark:bg-white/[0.05] bg-gray-100 flex items-center justify-center hover:text-brand-pink dark:hover:bg-white/[0.08] hover:bg-gray-200 transition-all flex-shrink-0"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5 dark:text-gray-400 text-gray-600" />
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 py-3.5 rounded-xl bg-love-gradient text-white font-bold text-sm disabled:opacity-40 hover:shadow-lg hover:shadow-pink-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:hover:scale-100 disabled:shadow-none"
            >
              {step === steps.length
                ? <><Sparkles className="w-4 h-4" /> Find My Matches!</>
                : <>Continue <ChevronRight className="w-4 h-4" /></>
              }
            </button>
          </div>
        </div>

        {/* Skip link */}
        <p className="text-center mt-4">
          <button
            onClick={() => navigate('/app/discover')}
            className="text-xs dark:text-gray-600 text-gray-400 hover:text-brand-pink transition-colors"
          >
            Skip setup for now
          </button>
        </p>
      </div>
    </div>
  )
}
