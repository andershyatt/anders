export type TitleOption = 'a' | 'b' | 'c'

/** Chosen look is B. `?title=a|b|c` compares the other treatments. */
export function titleOption(value: string | null): TitleOption {
  if (value === 'a' || value === 'b' || value === 'c') return value
  return 'b'
}
