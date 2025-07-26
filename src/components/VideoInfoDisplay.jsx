import React, { useState, useEffect } from 'react'
import { getLanguageName } from '../utils/helpers'
import omdbApi from '../services/api/omdb'

const VideoInfoDisplay = ({ fileData, selectedSubtitle = null }) => {
  const [movieDetails, setMovieDetails] = useState(null)
  const [loading, setLoading] = useState(false)

  // Fetch detailed movie information from OMDB API
  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (!fileData.movieInfo?.title) return

      setLoading(true)
      try {
        const details = await omdbApi.getMovieDetails(
          fileData.movieInfo.title, 
          fileData.movieInfo.year
        )
        setMovieDetails(details)
      } catch (error) {
        console.error('Error fetching movie details:', error)
        // Fallback to basic info
        setMovieDetails({
          title: fileData.movieInfo.title,
          year: fileData.movieInfo.year || 'Unknown',
          yearRange: fileData.movieInfo.year || 'Unknown',
          duration: 'Unknown',
          genre: 'Unknown',
          imdbRating: 'N/A',
          plot: 'Plot information not available',
          actors: 'Cast information not available',
          country: 'Unknown',
          awards: 'Awards information not available',
          imdbID: 'Unknown',
          type: 'movie',
          poster: null,
          error: error.message
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMovieDetails()
  }, [fileData.movieInfo])

  const getSubtitleSaveAs = () => {
    if (!fileData.name) return ''
    return fileData.name.replace(/\.[^/.]+$/, '.srt')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-gray-600">Loading movie information...</span>
        </div>
      </div>
    )
  }

  if (!movieDetails) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Video Information Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
          Video Information
        </h3>
        
        <div className="space-y-4">
          {/* Movie Poster and Basic Info */}
          {movieDetails.poster && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-shrink-0">
                <img 
                  src={movieDetails.poster} 
                  alt={`${movieDetails.title} poster`}
                  className="w-32 h-48 object-cover rounded-lg shadow-sm border border-gray-200"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="text-xl font-bold text-gray-900">{movieDetails.title}</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{movieDetails.type === 'series' ? movieDetails.yearRange : movieDetails.year}</span>
                  <span>•</span>
                  <span>{movieDetails.duration}</span>
                  <span>•</span>
                  <span>{movieDetails.rated}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">{movieDetails.imdbRating}</span>
                  <span className="text-sm text-gray-500">({movieDetails.imdbVotes} votes)</span>
                </div>
                <p className="text-sm text-gray-600">{movieDetails.genre}</p>
              </div>
            </div>
          )}

          {/* Additional Details Grid - only if no poster or as supplementary info */}
          {!movieDetails.poster && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">{movieDetails.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {movieDetails.type === 'series' ? 'Year Range' : 'Year'}
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">
                  {movieDetails.type === 'series' ? movieDetails.yearRange : movieDetails.year}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Director</label>
              <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">{movieDetails.director}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">{movieDetails.country}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plot</label>
            <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2 min-h-[60px]">{movieDetails.plot}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cast</label>
            <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">{movieDetails.actors}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Awards</label>
            <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">{movieDetails.awards}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IMDb ID</label>
              <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2 font-mono">{movieDetails.imdbID}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Released</label>
              <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">{movieDetails.released}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
            <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2 truncate font-mono" title={fileData.name}>
              {fileData.name}
            </p>
          </div>
        </div>
      </div>

      {/* Subtitle Information Section */}
      {selectedSubtitle && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            Subtitle Information
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle File Name</label>
              <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">
                {selectedSubtitle.attributes.files[0]?.file_name || 'Unknown'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">
                  {getLanguageName(selectedSubtitle.attributes.language)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Save As</label>
                <p className="text-sm text-gray-900 bg-blue-50 rounded px-3 py-2 font-mono">
                  {getSubtitleSaveAs()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hearing Impaired</label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">
                  {selectedSubtitle.attributes.hearing_impaired ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uploader Rank</label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2 flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    selectedSubtitle.attributes.author?.rank === 'trusted' ? 'bg-green-500' :
                    selectedSubtitle.attributes.author?.rank === 'gold' ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`}></span>
                  {selectedSubtitle.attributes.author?.rank || 'Unknown'}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="text-sm text-blue-800">
                <strong>Downloads:</strong> {selectedSubtitle.attributes.download_count || 0} • 
                <strong> Rating:</strong> {selectedSubtitle.attributes.rating || 'N/A'} • 
                <strong> Comments:</strong> {selectedSubtitle.attributes.comments?.length || 0}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoInfoDisplay