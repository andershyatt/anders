import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/global.css'
import PlannerApp from './PlannerApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlannerApp />
  </StrictMode>,
)
