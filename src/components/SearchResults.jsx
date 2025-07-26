import React, { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { useDownloader } from '../hooks/useDownloader'
import { getLanguageName, formatFileSize } from '../utils/helpers'
import SubtitleCard from './SubtitleCard'

const SearchResults = () => {
  const { searchResults, selectedSubtitles } = useApp()
  const { downloadSubtitle, downloadMultiple, isDownloading } = useDownloader()
  const [sortBy, setSortBy] = useState('download_count')
  const [filterLanguage, setFilterLanguage] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Get unique languages from results
  const availableLanguages = [
    ...new Set(searchResults.map(sub => sub.attributes.language))
  ].sort()

  // Filter and sort results
  const filteredResults = searchResults
    .filter(subtitle => {
      if (filterLanguage === 'all') return true
      return subtitle.attributes.language === filterLanguage
    })
    .sort((a, b) => {
      const aVal = a.attributes[sortBy] || 0
      const bVal = b.attributes[sortBy] || 0
      
      if (sortBy === 'upload_date') {
        return new Date(bVal) - new Date(aVal)
      }
      
      return bVal - aVal
    })

  const handleDownloadSelected = async () => {
    if (selectedSubtitles.length === 0) return
    
    try {
      await downloadMultiple(selectedSubtitles)
    } catch (error) {
      console.error('Failed to download selected subtitles:', error)
    }
  }

  if (searchResults.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Search Results ({filteredResults.length})
          </h3>
          
          <div className="flex items-center space-x-3">
            {selectedSubtitles.length > 0 && (
              <button
                onClick={handleDownloadSelected}
                disabled={isDownloading}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download Selected ({selectedSubtitles.length})</span>
              </button>
            )}
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-600 hover:text-gray-900 p-2 rounded-md border border-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-md">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="download_count">Downloads</option>
                <option value="upload_date">Upload Date</option>
                <option value="ratings">Rating</option>
                <option value="points">Points</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Language
              </label>
              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Languages</option>
                {availableLanguages.map(lang => (
                  <option key={lang} value={lang}>
                    {getLanguageName(lang)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="divide-y divide-gray-200">
        {filteredResults.map((subtitle) => (
          <SubtitleCard
            key={subtitle.id}
            subtitle={subtitle}
            isSelected={selectedSubtitles.some(s => s.id === subtitle.id)}
          />
        ))}
      </div>

      {filteredResults.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>No subtitles match your filters.</p>
        </div>
      )}
    </div>
  )
}

export default SearchResults