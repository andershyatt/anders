export type TitleOption = 'a' | 'b' | 'c' | 'services' | 'short' | 'plus'

/** Chosen look is B. `?title=` compares the other treatments. */
export function titleOption(value: string | null): TitleOption {
  if (value === 'a' || value === 'b' || value === 'c' || value === 'services' || value === 'short' || value === 'plus') {
    return value
  }
  return 'b'
}
