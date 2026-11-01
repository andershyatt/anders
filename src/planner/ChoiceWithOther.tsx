import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

function matchesOption(options: readonly string[], value: string): string | undefined {
  const trimmed = value.trim().toLowerCase()
  return options.find((option) => option.toLowerCase() === trimmed)
}

function choiceAlreadyOn(event: KeyboardEvent<HTMLInputElement>, selected: boolean): boolean {
  if (!selected || (event.key !== ' ' && event.key !== 'Enter')) return false
  event.preventDefault()
  return true
}

interface ChoiceWithOtherProps {
  name: string
  legend: string
  options: readonly string[]
  value: string
  onChange: (next: string) => void
}

/** Single-choice answers that include Other. The typed text is the saved value. */
export default function ChoiceWithOther({ name, legend, options, value, onChange }: ChoiceWithOtherProps) {
  const match = matchesOption(options, value)
  const [otherOn, setOtherOn] = useState(() => value.trim() !== '' && !match)
  const otherRef = useRef<HTMLInputElement>(null)
  const shouldFocus = useRef(false)

  useEffect(() => {
    if (!otherOn || !shouldFocus.current) return
    shouldFocus.current = false
    otherRef.current?.focus()
  }, [otherOn])

  const openOther = () => {
    shouldFocus.current = true
    setOtherOn(true)
    if (match) onChange('')
  }

  const closeOther = () => {
    setOtherOn(false)
    onChange('')
  }

  return (
    <fieldset className="planner-choices planner-choices--stack">
      <legend>{legend}</legend>
      <div className="planner-choices__row" role="radiogroup" aria-label={legend}>
        {options.map((option) => {
          const selected = !otherOn && match === option
          return (
            <label key={option} className={selected ? 'is-selected' : undefined}>
              <input
                type="radio"
                name={name}
                value={option}
                checked={selected}
                onChange={() => {
                  if (!selected) {
                    setOtherOn(false)
                    onChange(option)
                  }
                }}
                onClick={() => {
                  if (selected) {
                    setOtherOn(false)
                    onChange('')
                  }
                }}
                onKeyDown={(event) => {
                  if (choiceAlreadyOn(event, selected)) {
                    setOtherOn(false)
                    onChange('')
                  }
                }}
              />
              <span>{option}</span>
            </label>
          )
        })}
        <label className={otherOn ? 'is-selected' : undefined}>
          <input
            type="radio"
            name={name}
            value="Other"
            checked={otherOn}
            onChange={() => {
              if (!otherOn) openOther()
            }}
            onClick={() => {
              if (otherOn) closeOther()
            }}
            onKeyDown={(event) => {
              if (choiceAlreadyOn(event, otherOn)) closeOther()
            }}
          />
          <span>Other</span>
        </label>
      </div>
      {otherOn && (
        <input
          ref={otherRef}
          className="planner-other"
          type="text"
          aria-label={`${legend} (other)`}
          value={value}
          placeholder="Add your own answer"
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </fieldset>
  )
}
