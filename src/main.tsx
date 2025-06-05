import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Debug fonksiyonlarını import et
import './debug/checkAdmin.ts'
import './debug/testSave.ts'
import './debug/checkRLS.ts'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
