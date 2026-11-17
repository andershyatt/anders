export type TitleOption = 'a' | 'b' | 'c' | 'services' | 'short'

/** Chosen look is B. `?title=` compares the other treatments. */
export function titleOption(value: string | null): TitleOption {
  if (value === 'a' || value === 'b' || value === 'c' || value === 'services' || value === 'short') return value
  return 'b'
}
