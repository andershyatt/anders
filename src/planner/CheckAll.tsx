import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { parseChecks, serializeChecks } from './checks'

interface CheckAllProps {
  name: string
  legend: string
  options: readonly string[]
  value: string
  onChange: (next: string) => void
  help?: string
  allowOther?: boolean
}

function onChoiceKey(event: KeyboardEvent<HTMLInputElement>, toggle: () => void) {
  if (event.key !== ' ' && event.key !== 'Enter') return
  event.preventDefault()
  toggle()
}

/** Check-all-that-apply. Other reveals a short text field, and that text is what gets saved. */
export default function CheckAll({ name, legend, options, value, onChange, help, allowOther = true }: CheckAllProps) {
  const initial = parseChecks(value, options)
  const [source, setSource] = useState(value)
  const [selected, setSelected] = useState(initial.selected)
  const [otherOn, setOtherOn] = useState(() => initial.other.trim() !== '')
  const [otherText, setOtherText] = useState(initial.other)
  if (value !== source) {
    const next = parseChecks(value, options)
    setSource(value)
    setSelected(next.selected)
    setOtherText(next.other)
    setOtherOn(next.other.trim() !== '')
  }
  const otherRef = useRef<HTMLInputElement>(null)
  const shouldFocus = useRef(false)

  useEffect(() => {
    if (!otherOn || !shouldFocus.current) return
    shouldFocus.current = false
    otherRef.current?.focus()
  }, [otherOn])

  const commit = (nextSelected: string[], text: string, showOther: boolean) => {
    const extra = allowOther ? (showOther ? text : '') : text
    const saved = serializeChecks(nextSelected, extra)
    setSelected(nextSelected)
    setOtherOn(allowOther && showOther)
    setOtherText(extra)
    setSource(saved)
    onChange(saved)
  }

  return (
    <fieldset className="planner-choices planner-choices--stack">
      <legend>{legend}</legend>
      {help && <p className="planner-field__help">{help}</p>}
      <div className="planner-choices__row" role="group" aria-label={legend}>
        {options.map((option) => {
          const on = selected.includes(option)
          const toggle = () => {
            const nextSelected = on ? selected.filter((item) => item !== option) : [...selected, option]
            commit(nextSelected, otherText, otherOn)
          }
          return (
            <label
              key={option}
              className={on ? 'is-selected' : undefined}
              onClick={(event) => {
                event.preventDefault()
                toggle()
              }}
            >
              <input
                type="checkbox"
                name={name}
                value={option}
                checked={on}
                onChange={() => undefined}
                onKeyDown={(event) => onChoiceKey(event, toggle)}
              />
              <span>{option}</span>
            </label>
          )
        })}
        {allowOther && (
        <label
          className={otherOn ? 'is-selected' : undefined}
          onClick={(event) => {
            event.preventDefault()
            if (otherOn) {
              commit(selected, '', false)
              return
            }
            shouldFocus.current = true
            commit(selected, otherText, true)
          }}
        >
          <input
            type="checkbox"
            name={name}
            value="Other"
            checked={otherOn}
            onChange={() => undefined}
            onKeyDown={(event) =>
              onChoiceKey(event, () => {
                if (otherOn) commit(selected, '', false)
                else {
                  shouldFocus.current = true
                  commit(selected, otherText, true)
                }
              })
            }
          />
          <span>Other</span>
        </label>
        )}
      </div>
      {!allowOther && otherText.trim() !== '' && <p className="planner-legacy">Saved answer: {otherText}</p>}
      {allowOther && otherOn && (
        <input
          ref={otherRef}
          className="planner-other"
          type="text"
          aria-label={`${legend} (other)`}
          value={otherText}
          placeholder="Add your own answer"
          onChange={(event) => commit(selected, event.target.value, true)}
        />
      )}
    </fieldset>
  )
}
