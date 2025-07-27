import React, { useState, useEffect } from 'react'
import omdbApi from '../services/api/omdb'

const SeriesInfoDisplay = ({ seriesTitle, seriesFiles }) => {
  const [seriesDetails, setSeriesDetails] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchSeriesInfo = async () => {
      if (!seriesTitle) return
      
      setLoading(true)
      try {
        // Try to get series information from OMDB
        const seriesData = await omdbApi.getSeriesInfo(seriesTitle)
        
        if (seriesData && !seriesData.error) {
          // Calculate series statistics from episodes
          const seasons = new Set()
          const episodes = new Set()
          
          seriesFiles.forEach(file => {
            if (file.omdbInfo && file.omdbInfo.seasonNumber) {
              seasons.add(file.omdbInfo.seasonNumber)
            }
            if (file.omdbInfo && file.omdbInfo.episodeNumber) {
              episodes.add(`${file.omdbInfo.seasonNumber}-${file.omdbInfo.episodeNumber}`)
            }
          })
          
          setSeriesDetails({
            ...seriesData,
            totalSeasons: seasons.size,
            totalEpisodes: episodes.size,
            availableEpisodes: seriesFiles.length
          })
        } else {
          // Fallback with basic info
          setSeriesDetails({
            title: seriesTitle,
            plot: 'Series information not available',
            genre: 'Unknown',
            actors: 'Cast information not available',
            country: 'Unknown',
            awards: 'Awards information not available',
            imdbRating: 'N/A',
            imdbVotes: 'N/A',
            poster: null,
            totalSeasons: 'Unknown',
            totalEpisodes: 'Unknown',
            availableEpisodes: seriesFiles.length,
            error: 'No series information available'
          })
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching series info:', error)
        }
        setSeriesDetails({
          title: seriesTitle,
          plot: 'Series information not available',
          genre: 'Unknown',
          actors: 'Cast information not available',
          country: 'Unknown',
          awards: 'Awards information not available',
          imdbRating: 'N/A',
          imdbVotes: 'N/A',
          poster: null,
          totalSeasons: 'Unknown',
          totalEpisodes: 'Unknown',
          availableEpisodes: seriesFiles.length,
          error: 'Failed to fetch series information'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSeriesInfo()
  }, [seriesTitle, seriesFiles])

  if (loading) {
    return (
      <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4 mb-6">
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-blue-600 font-medium">Loading series information...</span>
        </div>
      </div>
    )
  }

  if (!seriesDetails) {
    return null
  }

  return (
    <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4 border-b border-blue-200 pb-2 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2zm5 6v4m0 0l-2-2m2 2l2-2" />
        </svg>
        Series Information
      </h3>
      
      <div className="space-y-4">
        {/* Series Poster and Basic Info */}
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          <div className="flex-shrink-0">
            {seriesDetails.poster ? (
              <img 
                src={seriesDetails.poster} 
                alt={`${seriesDetails.title} poster`}
                className="w-36 h-54 object-cover rounded-lg shadow-md border border-blue-200"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <div className="w-36 h-54 bg-blue-100 rounded-lg shadow-md border border-blue-200 flex items-center justify-center">
                <div className="text-center text-blue-400">
                  <svg className="w-10 h-10 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs">No Image</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            <h4 className="text-2xl font-bold text-blue-900">{seriesDetails.title}</h4>
            
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-blue-700">
              <span className="whitespace-nowrap">{seriesDetails.year}</span>
              <span className="text-blue-400 hidden sm:inline">•</span>
              <span className="whitespace-nowrap">{seriesDetails.totalSeasons} seasons</span>
              <span className="text-blue-400 hidden sm:inline">•</span>
              <span className="whitespace-nowrap">{seriesDetails.totalEpisodes} episodes</span>
              <span className="text-blue-400 hidden sm:inline">•</span>
              <span className="whitespace-nowrap bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                {seriesDetails.availableEpisodes} available
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium text-blue-900">{seriesDetails.imdbRating}</span>
              <span className="text-sm text-blue-600">({seriesDetails.imdbVotes} votes)</span>
            </div>
            
            <p className="text-sm text-blue-700">{seriesDetails.genre}</p>
          </div>
        </div>

        {/* Series Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-1">Director</label>
            <p className="text-sm text-blue-900 bg-blue-100 rounded px-3 py-2">{seriesDetails.director}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-1">Country</label>
            <p className="text-sm text-blue-900 bg-blue-100 rounded px-3 py-2">{seriesDetails.country}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Plot</label>
          <p className="text-sm text-blue-900 bg-blue-100 rounded px-3 py-2 min-h-[60px]">{seriesDetails.plot}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Cast</label>
          <p className="text-sm text-blue-900 bg-blue-100 rounded px-3 py-2">{seriesDetails.actors}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Awards</label>
          <p className="text-sm text-blue-900 bg-blue-100 rounded px-3 py-2">{seriesDetails.awards}</p>
        </div>

        {seriesDetails.imdbID && seriesDetails.imdbID !== 'Unknown' && (
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-1">IMDb ID</label>
            <p className="text-sm text-blue-900 bg-blue-100 rounded px-3 py-2 font-mono">
              <a 
                href={`https://www.imdb.com/title/${seriesDetails.imdbID}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                {seriesDetails.imdbID}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SeriesInfoDisplay