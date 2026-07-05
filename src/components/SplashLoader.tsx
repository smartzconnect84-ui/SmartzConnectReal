export default function SplashLoader({ message = 'Loading SmartzConnect…' }: { message?: string }) {
  return (
    <div className="min-h-screen dark:bg-[#0D0A14] bg-gray-50 flex flex-col items-center justify-center gap-6">
      <div className="relative flex items-center justify-center">
        {/* Outer spinning arc — conic gradient ring */}
        <svg
          className="absolute animate-spin"
          style={{ animationDuration: '1.4s' }}
          width="120" height="120" viewBox="0 0 120 120"
          fill="none"
        >
          <defs>
            <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#EC4899" stopOpacity="0" />
              <stop offset="40%"  stopColor="#EC4899" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="1" />
            </linearGradient>
          </defs>
          <circle
            cx="60" cy="60" r="54"
            stroke="url(#spinGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="220 120"
          />
        </svg>

        {/* Inner slower counter-spinning accent arc */}
        <svg
          className="absolute animate-spin"
          style={{ animationDuration: '2.2s', animationDirection: 'reverse' }}
          width="136" height="136" viewBox="0 0 136 136"
          fill="none"
        >
          <circle
            cx="68" cy="68" r="62"
            stroke="#EC489930"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="60 330"
          />
        </svg>

        {/* Logo */}
        <img
          src="/pwa-logo.png"
          alt="SmartzConnect"
          className="w-20 h-20 object-contain rounded-2xl"
          style={{ filter: 'drop-shadow(0 0 16px rgba(236,72,153,0.45))' }}
        />
      </div>

      <p className="text-sm dark:text-gray-500 text-gray-400 tracking-wide">{message}</p>
    </div>
  )
}
