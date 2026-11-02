interface HalfHourTimeProps {
  id: string
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}

const HALF_HOURS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2)
  const minutes = index % 2 === 0 ? '00' : '30'
  const value = `${String(hours).padStart(2, '0')}:${minutes}`
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  const label = `${hour12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`
  return { value, label }
})

/** Time answers in 30-minute steps. A saved off-step time stays selectable until it is changed. */
export default function HalfHourTime({ id, value, disabled, onChange }: HalfHourTimeProps) {
  const known = HALF_HOURS.some((option) => option.value === value)
  return (
    <select id={id} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
      <option value="">Select a time</option>
      {value && !known && <option value={value}>{value}</option>}
      {HALF_HOURS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
