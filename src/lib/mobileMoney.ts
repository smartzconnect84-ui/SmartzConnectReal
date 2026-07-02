// Mobile Money payment configuration for Liberia
// MTN Mobile Money & Orange Money LR

export const MOBILE_MONEY_CONFIG = {
  mtn: {
    id: 'mtn',
    name: 'MTN Mobile Money',
    shortName: 'MTN MoMo',
    number: '+231888061379',
    displayNumber: '+231 888 061 379',
    accountName: 'Shedrick K. Nungehn',
    color: '#FFCC00',
    bgColor: 'from-yellow-400/20 to-yellow-500/10',
    borderColor: 'border-yellow-400/30',
    textColor: 'text-yellow-400',
    badgeBg: 'bg-yellow-400/15',
    emoji: '📱',
    logo: '🟡',
    instructions: [
      'Dial *165# on your MTN line',
      'Select "Transfer Money"',
      'Enter number: +231888061379',
      'Enter the exact amount',
      'Confirm with your PIN',
      'Copy the Transaction ID sent to you',
    ],
  },
  orange: {
    id: 'orange',
    name: 'Orange Money Liberia',
    shortName: 'Orange Money',
    number: '+231776679963',
    displayNumber: '+231 776 679 963',
    accountName: 'Shedrick K. Nungehn',
    color: '#FF6600',
    bgColor: 'from-orange-500/20 to-orange-600/10',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-400',
    badgeBg: 'bg-orange-500/15',
    emoji: '📲',
    logo: '🟠',
    instructions: [
      'Dial *144# on your Orange line',
      'Select "Send Money"',
      'Enter number: +231776679963',
      'Enter the exact amount',
      'Confirm with your PIN',
      'Copy the Transaction ID sent to you',
    ],
  },
} as const

export type MobileMoneyProvider = keyof typeof MOBILE_MONEY_CONFIG

export const CONFIRMATION_WINDOW_MINUTES = 15
