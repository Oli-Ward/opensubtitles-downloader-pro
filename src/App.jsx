import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ApiProvider } from './contexts/ApiContext'
import { AppProvider } from './contexts/AppContext'
import MainDownloader from './components/MainDownloader'

function App() {
  return (
    <ApiProvider>
      <AppProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<MainDownloader />} />
          </Routes>
        </div>
      </AppProvider>
    </ApiProvider>
  )
}

export default App