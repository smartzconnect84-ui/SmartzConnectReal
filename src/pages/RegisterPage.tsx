import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, Check, Globe } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { AuthLayout, AuthCard, AuthInput, AuthError, AuthLabel } from '@/components/auth/AuthLayout'

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

const STRENGTH_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-400', 'bg-emerald-500']
const STRENGTH_LABELS = ['Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_TEXT   = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-emerald-500']

export default function RegisterPage() {
  const navigate    = useNavigate()
  const { signUp }  = useAuth()
  const [step, setStep]         = useState(1)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [country, setCountry]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [agreed, setAgreed]     = useState(false)

  const pwStrength = passwordStrength(password)

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
    <AuthLayout>
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1.5 mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-black transition-all duration-300 ${
              i + 1 < step
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/40'
                : i + 1 === step
                ? 'bg-love-gradient text-white shadow-md shadow-pink-500/30'
                : 'dark:bg-white/8 bg-gray-200 dark:text-gray-500 text-gray-400'
            }`}>
              {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-semibold transition-colors ${
              i + 1 === step ? 'text-brand-pink' : 'dark:text-gray-600 text-gray-400'
            }`}>
              {s}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-6 h-0.5 rounded-full mx-0.5 transition-colors ${
                i + 1 < step ? 'bg-emerald-500' : 'dark:bg-white/8 bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      <AuthCard>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 sm:p-8"
          >
            {step === 3 ? (
              /* ── Done state ── */
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/30"
                >
                  <Check className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-2">
                  Account created! 🎉
                </h2>
                <p className="dark:text-gray-400 text-gray-600 text-sm">
                  Check your email to verify your account.
                </p>
                <div className="mt-5 flex justify-center">
                  <Loader2 className="w-5 h-5 text-brand-pink animate-spin" />
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="font-display font-black text-2xl dark:text-white text-gray-900 mb-1 leading-tight">
                    {step === 1 ? 'Create Account' : 'Your Profile'}
                  </h2>
                  <p className="text-sm dark:text-gray-400 text-gray-500">
                    {step === 1 ? 'Join the SmartzConnect community' : 'Tell us a bit about yourself'}
                  </p>
                </div>

                {error && <div className="mb-5"><AuthError message={error} /></div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {step === 1 && (
                    <>
                      {/* Email */}
                      <div>
                        <AuthLabel htmlFor="reg-email">Email Address</AuthLabel>
                        <AuthInput
                          id="reg-email"
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          placeholder="you@example.com"
                          autoComplete="email"
                          icon={<Mail className="w-4 h-4" />}
                        />
                      </div>

                      {/* Password */}
                      <div>
                        <AuthLabel htmlFor="reg-pw">Password</AuthLabel>
                        <AuthInput
                          id="reg-pw"
                          type={showPw ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                          minLength={8}
                          placeholder="Min. 8 characters"
                          autoComplete="new-password"
                          icon={<Lock className="w-4 h-4" />}
                          rightEl={
                            <button
                              type="button"
                              onClick={() => setShowPw(!showPw)}
                              className="dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors p-0.5"
                              aria-label={showPw ? 'Hide password' : 'Show password'}
                            >
                              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          }
                        />
                        {/* Strength meter */}
                        {password && (
                          <div className="mt-2.5">
                            <div className="flex gap-1 mb-1">
                              {[0, 1, 2, 3].map(i => (
                                <div
                                  key={i}
                                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                    i < pwStrength ? STRENGTH_COLORS[pwStrength - 1] : 'dark:bg-white/8 bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className={`text-[10px] font-semibold ${STRENGTH_TEXT[pwStrength - 1] || 'text-gray-400'}`}>
                              {STRENGTH_LABELS[pwStrength - 1] || 'Too short'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Terms */}
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={agreed}
                          onClick={() => setAgreed(!agreed)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-brand-pink/30 ${
                            agreed ? 'bg-brand-pink border-brand-pink' : 'dark:border-white/20 border-gray-300 group-hover:border-brand-pink/50'
                          }`}
                        >
                          {agreed && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <span className="text-xs dark:text-gray-400 text-gray-600 leading-relaxed">
                          I agree to the{' '}
                          <Link to="/terms" className="text-brand-pink hover:underline font-medium">Terms of Service</Link>
                          {' '}and{' '}
                          <Link to="/privacy" className="text-brand-pink hover:underline font-medium">Privacy Policy</Link>
                        </span>
                      </label>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      {/* Full name */}
                      <div>
                        <AuthLabel htmlFor="reg-name">Full Name</AuthLabel>
                        <AuthInput
                          id="reg-name"
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required
                          placeholder="e.g. Amara Kollie"
                          autoComplete="name"
                          icon={<User className="w-4 h-4" />}
                        />
                      </div>

                      {/* Country */}
                      <div>
                        <AuthLabel htmlFor="reg-country">Country</AuthLabel>
                        <div className="relative">
                          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400 pointer-events-none" />
                          <select
                            id="reg-country"
                            value={country}
                            onChange={e => setCountry(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-xl dark:bg-white/[0.04] bg-gray-50/80 border dark:border-white/[0.08] border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink transition-all text-sm appearance-none cursor-pointer"
                          >
                            <option value="" disabled>Select your country</option>
                            {ALL_COUNTRIES.map(c => (
                              <option key={c} value={c} className="dark:bg-[#130E1E] bg-white">{c}</option>
                            ))}
                          </select>
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 dark:text-gray-500 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Info banner */}
                      <div className="p-4 rounded-2xl bg-pink-500/[0.06] border border-pink-500/[0.15]">
                        <p className="text-xs dark:text-gray-300 text-gray-700 leading-relaxed">
                          🎉 Almost there! After signing up, we'll send you a confirmation email. Click the link to activate your account.
                        </p>
                      </div>
                    </>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || (step === 1 && !agreed)}
                    className="w-full py-3.5 rounded-xl bg-love-gradient text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none mt-1"
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                      : step === 1
                      ? <><span>Continue</span> <ArrowRight className="w-4 h-4" /></>
                      : <><Check className="w-4 h-4" /> <span>Create Account</span></>
                    }
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </AuthCard>

      {step < 3 && (
        <p className="text-center mt-5 text-sm dark:text-gray-400 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-pink font-bold hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </AuthLayout>
  )
}
