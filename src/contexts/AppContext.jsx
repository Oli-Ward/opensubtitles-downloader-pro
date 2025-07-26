import React, { createContext, useContext, useReducer } from 'react'

const AppContext = createContext()

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

// App state management
const initialState = {
  searchResults: [],
  selectedSubtitles: [],
  downloads: [],
  searchHistory: [],
  preferences: {
    defaultLanguage: 'en',
    downloadPath: '',
    autoDownload: false,
    preferredFormats: ['srt', 'vtt'],
    hearingImpaired: 'include'
  },
  ui: {
    showLoginDialog: false,
    showPreferences: false,
    showProgress: false,
    currentView: 'search'
  }
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        searchResults: action.payload,
        searchHistory: state.searchHistory.includes(action.query) 
          ? state.searchHistory
          : [action.query, ...state.searchHistory.slice(0, 9)]
      }
    
    case 'SELECT_SUBTITLE':
      return {
        ...state,
        selectedSubtitles: [...state.selectedSubtitles, action.payload]
      }
    
    case 'DESELECT_SUBTITLE':
      return {
        ...state,
        selectedSubtitles: state.selectedSubtitles.filter(
          sub => sub.id !== action.payload.id
        )
      }
    
    case 'CLEAR_SELECTED':
      return {
        ...state,
        selectedSubtitles: []
      }
    
    case 'ADD_DOWNLOAD':
      return {
        ...state,
        downloads: [action.payload, ...state.downloads]
      }
    
    case 'UPDATE_DOWNLOAD':
      return {
        ...state,
        downloads: state.downloads.map(download =>
          download.id === action.payload.id
            ? { ...download, ...action.payload.updates }
            : download
        )
      }
    
    case 'REMOVE_DOWNLOAD':
      return {
        ...state,
        downloads: state.downloads.filter(download => download.id !== action.payload)
      }
    
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload }
      }
    
    case 'UPDATE_UI':
      return {
        ...state,
        ui: { ...state.ui, ...action.payload }
      }
    
    case 'CLEAR_SEARCH':
      return {
        ...state,
        searchResults: [],
        selectedSubtitles: []
      }

    default:
      return state
  }
}

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Action creators
  const setSearchResults = (results, query) => {
    dispatch({ type: 'SET_SEARCH_RESULTS', payload: results, query })
  }

  const selectSubtitle = (subtitle) => {
    dispatch({ type: 'SELECT_SUBTITLE', payload: subtitle })
  }

  const deselectSubtitle = (subtitle) => {
    dispatch({ type: 'DESELECT_SUBTITLE', payload: subtitle })
  }

  const clearSelected = () => {
    dispatch({ type: 'CLEAR_SELECTED' })
  }

  const addDownload = (download) => {
    dispatch({ type: 'ADD_DOWNLOAD', payload: download })
  }

  const updateDownload = (id, updates) => {
    dispatch({ type: 'UPDATE_DOWNLOAD', payload: { id, updates } })
  }

  const removeDownload = (id) => {
    dispatch({ type: 'REMOVE_DOWNLOAD', payload: id })
  }

  const updatePreferences = (preferences) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences })
  }

  const updateUI = (updates) => {
    dispatch({ type: 'UPDATE_UI', payload: updates })
  }

  const clearSearch = () => {
    dispatch({ type: 'CLEAR_SEARCH' })
  }

  const value = {
    ...state,
    // Actions
    setSearchResults,
    selectSubtitle,
    deselectSubtitle,
    clearSelected,
    addDownload,
    updateDownload,
    removeDownload,
    updatePreferences,
    updateUI,
    clearSearch
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}