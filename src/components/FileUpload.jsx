import React, { useState, useCallback } from 'react'
import { useApi } from '../contexts/ApiContext'
import { useApp } from '../contexts/AppContext'
import { extractMovieInfo } from '../utils/helpers'
import VideoInfoDisplay from './VideoInfoDisplay'

const FileUpload = () => {
  const { api } = useApi()
  const { 
    uploadedFiles, 
    selectedSubtitlesForFiles, 
    preferences, 
    addDownload, 
    addUploadedFiles, 
    removeUploadedFile, 
    clearUploadedFiles, 
    setSelectedSubtitlesForFiles, 
    updateUploadedFile 
  } = useApp()
  const [isDragOver, setIsDragOver] = useState(false)
  const [processingFiles, setProcessingFiles] = useState(new Set())
  const [language, setLanguage] = useState(preferences.defaultLanguage)

  const processVideoFile = useCallback(async (fileData) => {
    const fileId = fileData.id
    setProcessingFiles(prev => new Set(prev).add(fileId))

    try {
      // Use the already extracted movie information
      const movieInfo = fileData.movieInfo
      
      // Search for subtitles using the extracted information
      const searchParams = {
        query: movieInfo.title,
        languages: language
      }
      
      if (movieInfo.year) {
        searchParams.year = movieInfo.year
      }

      const results = await api.searchSubtitles(searchParams)
      const searchResults = results.data || []

      // Extract feature details from best match (first result)
      let omdbTitle = movieInfo.title
      let omdbYear = movieInfo.year
      let omdbType = 'movie'
      let imdbId = null
      let seasonNumber = null
      let episodeNumber = null
      let episodeImdbId = null
      let episodeTitle = null
      
      if (searchResults.length > 0 && searchResults[0].attributes) {
        const attrs = searchResults[0].attributes
        
        // Debug: Log the full attributes structure
        console.log('OpenSubtitles API Response attributes:', JSON.stringify(attrs, null, 2))
        
        // Extract title and year from feature_details
        if (attrs.feature_details) {
          if (attrs.feature_details.feature_type === 'Episode') {
            omdbTitle = attrs.feature_details.parent_title || omdbTitle
            // Clean up episode title by removing series name prefix
            let rawEpisodeTitle = attrs.feature_details.title || episodeTitle
            if (rawEpisodeTitle && omdbTitle) {
              // Remove series name and quotes from episode title
              episodeTitle = rawEpisodeTitle
                .replace(new RegExp(`^"?${omdbTitle}"?\\s*`, 'i'), '')
                .replace(/^"/, '')
                .replace(/"$/, '')
                .trim()
            }
            omdbType = 'episode'
          } else {
            omdbTitle = attrs.feature_details.title || omdbTitle
            omdbType = attrs.feature_details.feature_type?.toLowerCase() || omdbType
          }
          omdbYear = attrs.feature_details.year || omdbYear
        }
        
        // Extract season and episode info for TV shows
        if (omdbType === 'episode' || omdbType === 'tvshow') {
          seasonNumber = attrs.season_number || movieInfo.season
          episodeNumber = attrs.episode_number || movieInfo.episode
        }
        
        // Extract IMDB IDs from feature details - check multiple possible locations
        if (attrs.feature_details) {
          console.log('Feature details:', JSON.stringify(attrs.feature_details, null, 2))
          
          // For episodes, use parent_imdb_id for series info and imdb_id for episode
          if (omdbType === 'Episode' || omdbType === 'episode') {
            // Episode-specific IMDB ID
            episodeImdbId = attrs.feature_details.imdb_id
            // Series IMDB ID  
            imdbId = attrs.feature_details.parent_imdb_id
            
            // Extract season and episode numbers from feature_details
            seasonNumber = attrs.feature_details.season_number || seasonNumber
            episodeNumber = attrs.feature_details.episode_number || episodeNumber
          } else {
            // For movies, use the main imdb_id
            imdbId = attrs.feature_details.imdb_id || 
                     attrs.feature_details.parent_imdb_id
          }
        }
        
        // Also check if IMDB ID is directly in attributes
        if (!imdbId) {
          imdbId = attrs.imdb_id || attrs.imdbid || attrs.imdb || attrs.parent_id
        }
        
        // Validate and format IMDB ID
        if (imdbId) {
          // Ensure IMDB ID starts with 'tt' and is properly formatted
          if (typeof imdbId === 'number') {
            imdbId = `tt${String(imdbId).padStart(7, '0')}`
          } else if (typeof imdbId === 'string' && !imdbId.startsWith('tt')) {
            // If it's just a number as string, add 'tt' prefix
            if (/^\d+$/.test(imdbId)) {
              imdbId = `tt${imdbId.padStart(7, '0')}`
            }
          }
        }
        
        // Same validation for episode IMDB ID
        if (episodeImdbId) {
          if (typeof episodeImdbId === 'number') {
            episodeImdbId = `tt${String(episodeImdbId).padStart(7, '0')}`
          } else if (typeof episodeImdbId === 'string' && !episodeImdbId.startsWith('tt')) {
            if (/^\d+$/.test(episodeImdbId)) {
              episodeImdbId = `tt${episodeImdbId.padStart(7, '0')}`
            }
          }
        }
        
        console.log('Extracted IMDB IDs - Main:', imdbId, 'Episode:', episodeImdbId, 'Type:', omdbType)
      }

      // Search OMDB using IMDB ID first, fallback to title search
      let omdbInfo = null
      if (api.omdbApi && typeof api.omdbApi.getMovieDetails === 'function') {
        try {
          if (omdbType === 'episode' && seasonNumber && episodeNumber) {
            // For TV episodes, prioritize getting series info (which has poster) rather than episode-specific data
            if (imdbId) {
              // Use series IMDB ID to get series info with poster
              omdbInfo = await api.omdbApi.getMovieByImdbId(imdbId)
              // Add episode-specific information
              omdbInfo.episodeNumber = episodeNumber
              omdbInfo.seasonNumber = seasonNumber
              omdbInfo.seriesTitle = omdbTitle
              omdbInfo.type = 'episode'
              if (episodeTitle) omdbInfo.episodeName = episodeTitle
            } else {
              // Fallback to title search for episode
              omdbInfo = await api.omdbApi.getMovieDetails(omdbTitle, omdbYear)
              omdbInfo.episodeNumber = episodeNumber
              omdbInfo.seasonNumber = seasonNumber
              omdbInfo.type = 'episode'
              if (episodeTitle) omdbInfo.episodeName = episodeTitle
            }
          } else if (imdbId) {
            // For movies or series, use IMDB ID
            omdbInfo = await api.omdbApi.getMovieByImdbId(imdbId)
          } else {
            // Fallback to title search
            omdbInfo = await api.omdbApi.getMovieDetails(omdbTitle, omdbYear)
          }
          
          // Add type and episode info to the result
          omdbInfo.featureType = omdbType
          if (seasonNumber) omdbInfo.seasonNumber = seasonNumber
          if (episodeNumber) omdbInfo.episodeNumber = episodeNumber
          if (episodeTitle) omdbInfo.episodeName = episodeTitle
          if (omdbType === 'episode' && omdbTitle) omdbInfo.seriesTitle = omdbTitle
          
        } catch (omdbError) {
          console.warn('OMDB API error:', omdbError.message)
          console.warn('Failed IMDB IDs - Main:', imdbId, 'Episode:', episodeImdbId)
          
          // If IMDB ID search fails, try title search as fallback
          if (imdbId || episodeImdbId) {
            try {
              console.log('Falling back to title search:', omdbTitle, omdbYear)
              omdbInfo = await api.omdbApi.getMovieDetails(omdbTitle, omdbYear)
              omdbInfo.featureType = omdbType
              if (seasonNumber) omdbInfo.seasonNumber = seasonNumber
              if (episodeNumber) omdbInfo.episodeNumber = episodeNumber
              if (episodeTitle) omdbInfo.episodeName = episodeTitle
              if (omdbType === 'episode' && omdbTitle) omdbInfo.seriesTitle = omdbTitle
            } catch (fallbackError) {
              console.error('Title search also failed:', fallbackError.message)
              omdbInfo = { 
                error: `IMDB ID lookup failed: ${omdbError.message}. Title search failed: ${fallbackError.message}`, 
                featureType: omdbType,
                seasonNumber: seasonNumber,
                episodeNumber: episodeNumber,
                episodeName: episodeTitle,
                seriesTitle: omdbType === 'episode' ? omdbTitle : null
              }
            }
          } else {
            omdbInfo = { 
              error: omdbError.message, 
              featureType: omdbType,
              seasonNumber: seasonNumber,
              episodeNumber: episodeNumber,
              episodeName: episodeTitle,
              seriesTitle: omdbType === 'episode' ? omdbTitle : null
            }
          }
        }
      }

      // Update the file with search results and OMDB info
      updateUploadedFile(fileId, {
        searchResults,
        omdbInfo,
        processed: true
      })

    } catch (error) {
      console.error('Error processing file:', error)
      updateUploadedFile(fileId, {
        error: error.message, 
        processed: true
      })
    } finally {
      setProcessingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(fileId)
        return newSet
      })
    }
  }, [api, language, updateUploadedFile])

  const handleFiles = useCallback((files) => {
    const videoFiles = Array.from(files).filter(file => {
      const extension = file.name.split('.').pop().toLowerCase()
      return ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'm4v', 'webm', 'ogv', 'ts', 'mts', 'm2ts'].includes(extension)
    })

    const newFiles = videoFiles.map(file => {
      const movieInfo = extractMovieInfo(file.name)
      const fileId = `${file.name}_${file.size}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      return {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        movieInfo,
        searchResults: [],
        processed: false,
        error: null
      }
    })

    addUploadedFiles(newFiles)

    // Process each file automatically
    newFiles.forEach(fileData => {
      processVideoFile(fileData)
    })
  }, [processVideoFile])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    handleFiles(files)
  }, [handleFiles])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInput = useCallback((e) => {
    const files = e.target.files
    if (files) {
      handleFiles(files)
    }
  }, [handleFiles])

  const downloadSubtitle = useCallback(async (subtitle, fileName) => {
    try {
      const downloadResponse = await api.downloadSubtitle(subtitle.attributes.files[0].file_id)
      
      addDownload({
        id: Date.now(),
        fileName: fileName,
        subtitleName: subtitle.attributes.files[0].file_name,
        downloadUrl: downloadResponse.link,
        status: 'downloading',
        language: subtitle.attributes.language
      })

      // Get the actual subtitle content
      const content = await api.getSubtitleContent(downloadResponse.link)
      
      // In a real Tauri app, you would save this to a file
      console.log('Subtitle content received:', content.substring(0, 200) + '...')
      
    } catch (error) {
      console.error('Error downloading subtitle:', error)
    }
  }, [api, addDownload])

  const removeFile = useCallback((fileId) => {
    removeUploadedFile(fileId)
    setProcessingFiles(prev => {
      const newSet = new Set(prev)
      newSet.delete(fileId)
      return newSet
    })
  }, [removeUploadedFile])

  const clearAllFiles = useCallback(() => {
    clearUploadedFiles()
    setProcessingFiles(new Set())
  }, [clearUploadedFiles])

  const toggleSubtitleSelection = useCallback((fileId, subtitleIndex) => {
    const selectionId = `${fileId}_${subtitleIndex}`
    const newSelections = new Set(selectedSubtitlesForFiles)
    if (newSelections.has(selectionId)) {
      newSelections.delete(selectionId)
    } else {
      newSelections.add(selectionId)
    }
    setSelectedSubtitlesForFiles(newSelections)
  }, [selectedSubtitlesForFiles, setSelectedSubtitlesForFiles])

  const selectAllSubtitles = useCallback(() => {
    const allSelections = new Set()
    uploadedFiles.forEach(file => {
      if (file.searchResults && file.searchResults.length > 0) {
        file.searchResults.forEach((_, index) => {
          allSelections.add(`${file.id}_${index}`)
        })
      }
    })
    setSelectedSubtitlesForFiles(allSelections)
  }, [uploadedFiles, setSelectedSubtitlesForFiles])

  const selectNoneSubtitles = useCallback(() => {
    setSelectedSubtitlesForFiles(new Set())
  }, [setSelectedSubtitlesForFiles])

  const selectOnePerVideo = useCallback(() => {
    const onePerVideo = new Set()
    uploadedFiles.forEach(file => {
      if (file.searchResults && file.searchResults.length > 0) {
        // Select the first subtitle for each video
        onePerVideo.add(`${file.id}_0`)
      }
    })
    setSelectedSubtitlesForFiles(onePerVideo)
  }, [uploadedFiles, setSelectedSubtitlesForFiles])

  const toggleFileSelection = useCallback((fileId) => {
    const file = uploadedFiles.find(f => f.id === fileId)
    if (!file || !file.searchResults) return

    const fileSubtitles = file.searchResults.map((_, index) => `${fileId}_${index}`)
    const allSelected = fileSubtitles.every(id => selectedSubtitlesForFiles.has(id))
    
    const newSet = new Set(selectedSubtitlesForFiles)
    if (allSelected) {
      // Deselect all subtitles for this file
      fileSubtitles.forEach(id => newSet.delete(id))
    } else {
      // Select all subtitles for this file
      fileSubtitles.forEach(id => newSet.add(id))
    }
    setSelectedSubtitlesForFiles(newSet)
  }, [uploadedFiles, selectedSubtitlesForFiles, setSelectedSubtitlesForFiles])

  const getFileSelectionState = useCallback((fileId) => {
    const file = uploadedFiles.find(f => f.id === fileId)
    if (!file || !file.searchResults || file.searchResults.length === 0) {
      return { selected: 0, total: 0, state: 'none' }
    }

    const fileSubtitles = file.searchResults.map((_, index) => `${fileId}_${index}`)
    const selectedCount = fileSubtitles.filter(id => selectedSubtitlesForFiles.has(id)).length
    const total = fileSubtitles.length

    if (selectedCount === 0) return { selected: 0, total, state: 'none' }
    if (selectedCount === total) return { selected: selectedCount, total, state: 'all' }
    return { selected: selectedCount, total, state: 'partial' }
  }, [uploadedFiles, selectedSubtitlesForFiles])

  const downloadAllSelected = useCallback(async () => {
    const downloads = []
    
    for (const selectionId of selectedSubtitlesForFiles) {
      const [fileId, subtitleIndex] = selectionId.split('_')
      const file = uploadedFiles.find(f => f.id === fileId)
      const subtitle = file?.searchResults[parseInt(subtitleIndex)]
      
      if (file && subtitle) {
        try {
          const downloadResponse = await api.downloadSubtitle(subtitle.attributes.files[0].file_id)
          
          addDownload({
            id: Date.now() + Math.random(),
            fileName: file.name,
            subtitleName: subtitle.attributes.files[0].file_name,
            downloadUrl: downloadResponse.link,
            status: 'downloading',
            language: subtitle.attributes.language
          })

          downloads.push({
            file: file.name,
            subtitle: subtitle.attributes.files[0].file_name
          })
        } catch (error) {
          console.error(`Error downloading subtitle for ${file.name}:`, error)
        }
      }
    }
    
    if (downloads.length > 0) {
      alert(`Started downloading ${downloads.length} subtitle(s)`)
    }
  }, [selectedSubtitlesForFiles, uploadedFiles, api, addDownload])

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Controls Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Settings & Controls</h3>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Bulk Operations */}
        {uploadedFiles.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-sm font-medium text-gray-700">Bulk Operations:</span>
              <button
                onClick={selectAllSubtitles}
                className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={selectOnePerVideo}
                className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
              >
                First Per Video
              </button>
              <button
                onClick={selectNoneSubtitles}
                className="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Select None
              </button>
              <button
                onClick={clearAllFiles}
                className="px-3 py-1 text-xs font-medium text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
              >
                Clear All Files
              </button>
            </div>
            
            {selectedSubtitlesForFiles.size > 0 && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md p-3">
                <span className="text-sm text-blue-800">
                  {selectedSubtitlesForFiles.size} subtitle(s) selected
                </span>
                <button
                  onClick={downloadAllSelected}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Selected</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload Video Files
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your movie or TV show files here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: MP4, MKV, AVI, MOV, WMV, FLV, M4V, WebM, OGV, TS, MTS, M2TS
            </p>
          </div>

          <div>
            <input
              type="file"
              multiple
              accept=".mp4,.mkv,.avi,.mov,.wmv,.flv,.m4v,.webm,.ogv,.ts,.mts,.m2ts"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Choose Files
            </label>
          </div>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Uploaded Files ({uploadedFiles.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {uploadedFiles.map((fileData) => (
              <div key={fileData.id} className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">
                  {/* Left Column - File Info and Subtitles */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        {fileData.processed && fileData.searchResults.length > 0 && (
                          <div className="flex flex-col items-center space-y-1 mt-1">
                            <input
                              type="checkbox"
                              checked={getFileSelectionState(fileData.id).state === 'all'}
                              ref={el => {
                                if (el) {
                                  const state = getFileSelectionState(fileData.id).state
                                  el.indeterminate = state === 'partial'
                                }
                              }}
                              onChange={() => toggleFileSelection(fileData.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              title={`Select/deselect all subtitles for this file`}
                            />
                            <span className="text-xs text-gray-500 text-center leading-tight">
                              {(() => {
                                const state = getFileSelectionState(fileData.id)
                                return `${state.selected}/${state.total}`
                              })()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900 truncate flex-1">
                              {fileData.name}
                            </h4>
                            {fileData.processed && fileData.searchResults.length > 0 && (
                              <button
                                onClick={downloadAllSelected}
                                className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors flex items-center space-x-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Download</span>
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(fileData.size)} • {fileData.movieInfo.title}
                            {fileData.movieInfo.year && ` (${fileData.movieInfo.year})`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {processingFiles.has(fileData.id) && (
                          <div className="flex items-center text-blue-600">
                            <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm">Processing...</span>
                          </div>
                        )}
                        
                        <button
                          onClick={() => removeFile(fileData.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {fileData.error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{fileData.error}</p>
                      </div>
                    )}

                    {fileData.processed && fileData.searchResults.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">
                          Available Subtitles ({fileData.searchResults.length})
                        </h5>
                        <div className="space-y-2">
                          {/* Subtitle list */}
                          <div className="space-y-2">
                            {fileData.searchResults.slice(0, 10).map((subtitle, index) => {
                              const selectionId = `${fileData.id}_${index}`
                              const isSelected = selectedSubtitlesForFiles.has(selectionId)
                              const subtitleKey = subtitle.attributes?.files?.[0]?.file_id || `${fileData.id}_${index}`
                              
                              return (
                                <div key={subtitleKey} className={`flex items-center space-x-3 p-3 rounded border transition-colors ${
                                  isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSubtitleSelection(fileData.id, index)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <p 
                                          className="text-sm font-medium text-gray-900 truncate cursor-help"
                                          title={subtitle.attributes.files[0]?.file_name || 'Unknown'}
                                        >
                                          {subtitle.attributes.files[0]?.file_name || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {subtitle.attributes.language} • Downloads: {subtitle.attributes.download_count}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => downloadSubtitle(subtitle, fileData.name)}
                                        className="ml-3 px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors flex-shrink-0"
                                      >
                                        Download
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {fileData.processed && fileData.searchResults.length === 0 && !fileData.error && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-700">No subtitles found for this file.</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Video Information Display */}
                  {fileData.processed && (
                    <div>
                      <VideoInfoDisplay 
                        fileData={fileData}
                        selectedSubtitle={
                          fileData.searchResults.length > 0 ? 
                          fileData.searchResults.find((_, index) => 
                            selectedSubtitlesForFiles.has(`${fileData.id}_${index}`)
                          ) : null
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload