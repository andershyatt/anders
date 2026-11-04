import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/global.css'
import '../standalone.css'
import { registerInstalledApp } from '../standalone'
import PipelineApp from './PipelineApp.tsx'
import './pipeline.css'

registerInstalledApp()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PipelineApp />
  </StrictMode>,
)
