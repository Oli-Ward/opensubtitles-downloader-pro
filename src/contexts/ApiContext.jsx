import React, { createContext, useContext, useEffect, useState } from 'react'
import opensubtitlesAPI from '../services/api/opensubtitles'

const ApiContext = createContext()

export const useApi = () => {
  const context = useContext(ApiContext)
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider')
  }
  return context
}

export const ApiProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      const hasToken = opensubtitlesAPI.loadToken()
      if (hasToken) {
        const userInfo = await opensubtitlesAPI.getUserInfo()
        if (userInfo) {
          setUser(userInfo)
          setIsAuthenticated(true)
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await opensubtitlesAPI.login(username, password)
      const userInfo = await opensubtitlesAPI.getUserInfo()
      
      setUser(userInfo)
      setIsAuthenticated(true)
      return response
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await opensubtitlesAPI.logout()
    } finally {
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const clearError = () => setError(null)

  const value = {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    clearError,
    api: opensubtitlesAPI
  }

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  )
}