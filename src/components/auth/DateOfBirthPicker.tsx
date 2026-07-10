import { useMemo } from 'react'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface DateOfBirthPickerProps {
  value: string // 'YYYY-MM-DD' or ''
  onChange: (value: string) => void
  maxDate: string // 'YYYY-MM-DD' — latest allowed birthdate (age floor)
  minYear?: number
  id?: string
}

/**
 * A modern, low-friction Day / Month / Year picker used in place of the native
 * <input type="date">, which forces users to fight a tiny calendar widget or
 * type digits in a locale-dependent order. Three plain selects are faster to
 * scan and work identically across every browser/OS.
 */
export function DateOfBirthPicker({ value, onChange, maxDate, minYear = 1940, id }: DateOfBirthPickerProps) {
  const [vYear, vMonth, vDay] = value ? value.split('-') : ['', '', '']
  const maxD = new Date(maxDate)
  const maxYear = maxD.getFullYear()

  const years = useMemo(() => {
    const arr: number[] = []
    for (let y = maxYear; y >= minYear; y--) arr.push(y)
    return arr
  }, [maxYear, minYear])

  const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate()

  const days = useMemo(() => {
    const y = vYear ? Number(vYear) : maxYear
    const m = vMonth ? Number(vMonth) : 1
    const count = daysInMonth(y, m)
    return Array.from({ length: count }, (_, i) => i + 1)
  }, [vYear, vMonth, maxYear])

  const commit = (nextYear: string, nextMonth: string, nextDay: string) => {
    if (!nextYear || !nextMonth || !nextDay) {
      onChange('')
      return
    }
    // Clamp day if the newly selected month/year has fewer days
    const maxDay = daysInMonth(Number(nextYear), Number(nextMonth))
    const day = Math.min(Number(nextDay), maxDay)
    const iso = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onChange(iso > maxDate ? maxDate : iso)
  }

  const selectClass =
    'w-full py-3 px-3 rounded-xl dark:bg-white/[0.04] bg-gray-50/80 border dark:border-white/[0.08] border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink transition-all appearance-none'

  return (
    <div id={id} className="grid grid-cols-3 gap-2">
      <select
        aria-label="Day"
        value={vDay}
        onChange={e => commit(vYear, vMonth, e.target.value)}
        className={selectClass}
      >
        <option value="">Day</option>
        {days.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      <select
        aria-label="Month"
        value={vMonth}
        onChange={e => commit(vYear, e.target.value, vDay || '1')}
        className={selectClass}
      >
        <option value="">Month</option>
        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
      </select>
      <select
        aria-label="Year"
        value={vYear}
        onChange={e => commit(e.target.value, vMonth || '1', vDay || '1')}
        className={selectClass}
      >
        <option value="">Year</option>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  )
}
