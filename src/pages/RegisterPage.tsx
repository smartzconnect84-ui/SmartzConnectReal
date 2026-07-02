import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, Check, ArrowLeft, Globe } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
const logoImg = '/logo.png'
import TurnstileWidget from '@/components/TurnstileWidget'

const TURNSTILE_ENABLED = !!import.meta.env.VITE_TURNSTILE_SITE_KEY

const steps = ['Account', 'Profile', 'Done']

const ALL_COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia',
  'Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium',
  'Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei',
  'Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada',
  'Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo (Brazzaville)',
  'Congo (DRC)','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti',
  'Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea',
  'Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany',
  'Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras',
  'Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica',
  'Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia',
  'Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar',
  'Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius',
  'Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique',
  'Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria',
  'North Korea','North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama',
  'Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania',
  'Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines',
  'Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles',
  'Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa',
  'South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland',
  'Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga',
  'Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine',
  'United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu',
  'Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
]

const passwordStrength = (pw: string) => {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const pwStrength = passwordStrength(password)
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500']
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    setError('')
    setLoading(true)
    try {
      await signUp(email, password, name)
      navigate('/verify-email', { state: { email }, replace: true })
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen dark:bg-[#080510] bg-gray-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-pink-500/4 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Back to website */}
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to website
          </Link>
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src={logoImg} alt="SmartzConnect" className="w-10 h-10 object-contain" />
          <span className="font-display font-black text-xl">
            <span className="text-gradient-love">Smartz</span>
            <span className="dark:text-white text-gray-900">Connect</span>
          </span>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-black transition-all ${i + 1 < step ? 'bg-emerald-500 text-white' : i + 1 === step ? 'bg-love-gradient text-white shadow-md shadow-pink-500/30' : 'dark:bg-white/8 bg-gray-200 dark:text-gray-500 text-gray-400'}`}>
                {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-semibold ${i + 1 === step ? 'text-brand-pink' : 'dark:text-gray-500 text-gray-400'}`}>{s}</span>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 rounded-full ${i + 1 < step ? 'bg-emerald-500' : 'dark:bg-white/8 bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="dark:bg-[#130E1E] bg-white rounded-3xl border dark:border-white/8 border-gray-100 shadow-2xl shadow-pink-500/5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
              className="p-6 sm:p-8">

              {step === 3 ? (
                <div className="text-center py-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30">
                    <Check className="w-10 h-10 text-white" />
                  </motion.div>
                  <h2 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-2">Account created! 🎉</h2>
                  <p className="dark:text-gray-400 text-gray-600 text-sm">Check your email to verify your account.</p>
                  <div className="mt-4 flex justify-center">
                    <Loader2 className="w-5 h-5 text-brand-pink animate-spin" />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-1">
                    {step === 1 ? 'Create Account' : 'Your Profile'}
                  </h2>
                  <p className="text-sm dark:text-gray-400 text-gray-600 mb-6">
                    {step === 1 ? 'Join the SmartzConnect community' : 'Tell us a bit about yourself'}
                  </p>

                  {error && (
                    <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{error}</div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {step === 1 && (
                      <>
                        <div>
                          <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                              placeholder="you@example.com"
                              className="w-full pl-10 pr-4 py-3 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">Password</label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
                            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                              placeholder="Min. 8 characters"
                              className="w-full pl-10 pr-10 py-3 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors text-sm" />
                            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                              {showPw ? <EyeOff className="w-4 h-4 dark:text-gray-500 text-gray-400" /> : <Eye className="w-4 h-4 dark:text-gray-500 text-gray-400" />}
                            </button>
                          </div>
                          {password && (
                            <div className="mt-2">
                              <div className="flex gap-1 mb-1">
                                {[0, 1, 2, 3].map(i => (
                                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < pwStrength ? strengthColors[pwStrength - 1] : 'dark:bg-white/8 bg-gray-200'}`} />
                                ))}
                              </div>
                              <p className={`text-[10px] font-semibold ${pwStrength >= 3 ? 'text-emerald-500' : pwStrength >= 2 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {strengthLabels[pwStrength - 1] || 'Too short'}
                              </p>
                            </div>
                          )}
                        </div>
                        {/* Turnstile */}
                        {TURNSTILE_ENABLED && (
                          <TurnstileWidget
                            onSuccess={setTurnstileToken}
                            onError={() => setTurnstileToken(null)}
                            onExpire={() => setTurnstileToken(null)}
                          />
                        )}

                        <label className="flex items-start gap-3 cursor-pointer">
                          <div onClick={() => setAgreed(!agreed)}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${agreed ? 'bg-brand-pink border-brand-pink' : 'dark:border-white/20 border-gray-300'}`}>
                            {agreed && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-xs dark:text-gray-400 text-gray-600 leading-relaxed">
                            I agree to the{' '}
                            <Link to="/terms" className="text-brand-pink hover:underline">Terms of Service</Link>
                            {' '}and{' '}
                            <Link to="/privacy" className="text-brand-pink hover:underline">Privacy Policy</Link>
                          </span>
                        </label>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <div>
                          <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400" />
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required
                              placeholder="e.g. Amara Kollie"
                              className="w-full pl-10 pr-4 py-3 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-pink transition-colors text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-1.5 block">Country</label>
                          <div className="relative">
                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400 pointer-events-none" />
                            <select value={country} onChange={e => setCountry(e.target.value)} required
                              className="w-full pl-10 pr-4 py-3 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink transition-colors text-sm appearance-none cursor-pointer">
                              <option value="" disabled>Select your country</option>
                              {ALL_COUNTRIES.map(c => (
                                <option key={c} value={c} className="dark:bg-[#130E1E] bg-white text-gray-900 dark:text-white">{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-love-soft border border-pink-500/20">
                          <p className="text-xs dark:text-gray-300 text-gray-700 leading-relaxed">
                            🎉 Almost there! After signing up, we'll send you a confirmation email. Click the link to activate your account.
                          </p>
                        </div>
                      </>
                    )}

                    <button type="submit" disabled={loading || (step === 1 && (!agreed || (TURNSTILE_ENABLED && !turnstileToken)))}
                      className="w-full py-3.5 rounded-xl bg-love-gradient text-white font-bold text-sm hover:shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : step === 1 ? <><ArrowRight className="w-4 h-4" /> Continue</> : <><Check className="w-4 h-4" /> Create Account</>}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {step < 3 && (
          <p className="text-center mt-5 text-sm dark:text-gray-400 text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-pink font-bold hover:underline">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  )
}
