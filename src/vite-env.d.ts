interface ImportMetaEnv {
  readonly VITE_GOOGLE_PLACES_API_KEY?: string
}

declare module '*.docx?url' {
  const src: string
  export default src
}
