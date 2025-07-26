import React, { useState, useCallback } from 'react'
import { useApi } from '../contexts/ApiContext'
import { useApp } from '../contexts/AppContext'
import { debounce, cleanSearchQuery, extractMovieInfo } from '../utils/helpers'

const SearchForm = () => {
  const { api } = useApi()
  const { setSearchResults, preferences } = useApp()
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('title')
  const [language, setLanguage] = useState(preferences.defaultLanguage)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const performSearch = useCallback(async (searchParams) => {
    setIsLoading(true)
    setError(null)

    try {
      const results = await api.searchSubtitles(searchParams)
      setSearchResults(results.data || [], query)
    } catch (err) {
      setError(err.message)
      console.error('Search failed:', err)
    } finally {
      setIsLoading(false)
    }
  }, [api, setSearchResults, query])

  const debouncedSearch = useCallback(
    debounce(performSearch, 500),
    [performSearch]
  )

  const handleSearch = (e) => {
    e.preventDefault()
    
    if (!query.trim()) return

    const searchParams = {
      languages: language
    }

    const cleanQuery = cleanSearchQuery(query)

    switch (searchType) {
      case 'title':
        searchParams.query = cleanQuery
        break
      case 'imdb':
        // Extract IMDB ID from URL or direct ID
        const imdbMatch = query.match(/(?:imdb\.com\/title\/)?tt(\d+)/)
        if (imdbMatch) {
          searchParams.imdb_id = parseInt(imdbMatch[1])
        } else {
          setError('Invalid IMDB ID format')
          return
        }
        break
      case 'filename':
        const movieInfo = extractMovieInfo(query)
        searchParams.query = movieInfo.title
        if (movieInfo.year) {
          searchParams.year = movieInfo.year
        }
        break
      default:
        searchParams.query = cleanQuery
    }

    performSearch(searchParams)
  }

  const handleQueryChange = (e) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    
    // Auto-search for title queries
    if (searchType === 'title' && newQuery.trim().length > 2) {
      const searchParams = {
        query: cleanSearchQuery(newQuery),
        languages: language
      }
      debouncedSearch(searchParams)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Search Subtitles
      </h2>

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
              Search Query
            </label>
            <input
              type="text"
              id="query"
              value={query}
              onChange={handleQueryChange}
              placeholder={
                searchType === 'title' ? 'Enter movie or TV show title...' :
                searchType === 'imdb' ? 'Enter IMDB ID or URL...' :
                'Enter video filename...'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ru">Russian</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="zh">Chinese</option>
              <option value="ar">Arabic</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Search by:</span>
          {['title', 'imdb', 'filename'].map((type) => (
            <label key={type} className="flex items-center">
              <input
                type="radio"
                name="searchType"
                value={type}
                checked={searchType === type}
                onChange={(e) => setSearchType(e.target.value)}
                className="mr-2"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-600 capitalize">{type}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </>
            )}
          </button>

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setError(null)
                setSearchResults([], '')
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}

export default SearchForm