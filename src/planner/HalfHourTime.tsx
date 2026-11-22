interface HalfHourTimeProps {
  id: string
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}

import { normalizePlannerTime } from './format'

const HALF_HOURS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2)
  const minutes = index % 2 === 0 ? '00' : '30'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`
})

/** Time answers in 30-minute steps. A saved off-step time stays selectable until it is changed. */
export default function HalfHourTime({ id, value, disabled, onChange }: HalfHourTimeProps) {
  const shown = normalizePlannerTime(value)
  const known = HALF_HOURS.includes(shown)
  return (
    <select id={id} value={shown} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
      <option value="">Select a time</option>
      {shown && !known && <option value={shown}>{shown}</option>}
      {HALF_HOURS.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}
