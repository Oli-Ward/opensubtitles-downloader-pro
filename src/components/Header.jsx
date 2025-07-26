import React from 'react'
import { useApi } from '../contexts/ApiContext'
import { useApp } from '../contexts/AppContext'

const Header = () => {
  const { isAuthenticated, user, logout } = useApi()
  const { updateUI } = useApp()

  const handleLogin = () => {
    updateUI({ showLoginDialog: true })
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            OpenSubtitles Downloader Pro
          </h1>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            v1.0.0
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <span className="text-gray-600">Welcome, </span>
                <span className="font-medium text-gray-900">
                  {user?.base_info?.nickname || 'User'}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Downloads: {user?.base_info?.downloads_count || 0}
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header