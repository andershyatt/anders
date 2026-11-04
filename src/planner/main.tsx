import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/global.css'
import '../standalone.css'
import { registerInstalledApp } from '../standalone'
import PlannerApp from './PlannerApp.tsx'

registerInstalledApp()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlannerApp />
  </StrictMode>,
)
