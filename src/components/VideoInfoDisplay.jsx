import React, { useState, useEffect } from 'react'
import { getLanguageName } from '../utils/helpers'
import omdbApi from '../services/api/omdb'

const VideoInfoDisplay = ({ fileData, selectedSubtitle = null }) => {
  const [movieDetails, setMovieDetails] = useState(null)
  const [loading, setLoading] = useState(false)

  // Use OMDB data that was already fetched in FileUpload component
  useEffect(() => {
    setLoading(true)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('VideoInfoDisplay - fileData.omdbInfo:', fileData.omdbInfo)
      console.log('VideoInfoDisplay - fileData.movieInfo:', fileData.movieInfo)
    }
    
    if (fileData.omdbInfo && !fileData.omdbInfo.error) {
      // Use the OMDB data fetched from FileUpload
      setMovieDetails(fileData.omdbInfo)
    } else {
      // Fallback to basic info extracted from filename
      setMovieDetails({
        title: fileData.movieInfo?.title || 'Unknown',
        year: fileData.movieInfo?.year || 'Unknown',
        yearRange: fileData.movieInfo?.year || 'Unknown',
        duration: 'Unknown',
        genre: 'Unknown',
        imdbRating: 'N/A',
        plot: 'Plot information not available',
        actors: 'Cast information not available',
        country: 'Unknown',
        awards: 'Awards information not available',
        imdbID: 'Unknown',
        type: fileData.movieInfo?.type || 'movie',
        poster: null,
        seasonNumber: fileData.movieInfo?.season,
        episodeNumber: fileData.movieInfo?.episode,
        error: fileData.omdbInfo?.error || 'No movie information available'
      })
    }
    
    setLoading(false)
  }, [fileData.omdbInfo, fileData.movieInfo])

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
          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            <div className="flex-shrink-0">
              {movieDetails.poster ? (
                <img 
                  src={movieDetails.poster} 
                  alt={`${movieDetails.title} poster`}
                  className="w-36 h-54 object-cover rounded-lg shadow-md border border-gray-200"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-36 h-54 bg-gray-100 rounded-lg shadow-md border border-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <svg className="w-10 h-10 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs">No Image</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              {/* Show series title for episodes, regular title for movies */}
              {movieDetails.type === 'episode' && movieDetails.seriesTitle ? (
                <div className="space-y-1">
                  <h4 className="text-2xl font-bold text-gray-900">{movieDetails.seriesTitle}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                      S{movieDetails.seasonNumber}E{movieDetails.episodeNumber}
                    </span>
                    <h5 
                      className="text-lg font-medium text-gray-700 cursor-help overflow-hidden"
                      title={movieDetails.episodeName || movieDetails.title}
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.5'
                      }}
                    >
                      {movieDetails.episodeName || movieDetails.title}
                    </h5>
                  </div>
                </div>
              ) : (
                <h4 className="text-2xl font-bold text-gray-900">{movieDetails.title}</h4>
              )}
              
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
                {movieDetails.type === 'episode' ? (
                  <>
                    <span className="whitespace-nowrap">{movieDetails.released}</span>
                    <span className="text-gray-400 hidden sm:inline">•</span>
                    <span className="whitespace-nowrap">{movieDetails.duration}</span>
                    <span className="text-gray-400 hidden sm:inline">•</span>
                    <span className="whitespace-nowrap">{movieDetails.rated}</span>
                    <span className="text-gray-400 hidden sm:inline">•</span>
                    <span className="whitespace-nowrap bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">Episode</span>
                  </>
                ) : (
                  <>
                    <span className="whitespace-nowrap">{movieDetails.type === 'series' ? movieDetails.yearRange : movieDetails.year}</span>
                    <span className="text-gray-400 hidden sm:inline">•</span>
                    <span className="whitespace-nowrap">{movieDetails.duration}</span>
                    <span className="text-gray-400 hidden sm:inline">•</span>
                    <span className="whitespace-nowrap">{movieDetails.rated}</span>
                  </>
                )}
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


          {/* For episodes, show episode-specific details; for movies/series show general details */}
          {movieDetails.type !== 'episode' && (
            <>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Cast</label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">{movieDetails.actors}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Awards</label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">{movieDetails.awards}</p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {movieDetails.type === 'episode' ? 'Episode Plot' : 'Plot'}
            </label>
            <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2 min-h-[60px]">{movieDetails.plot}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IMDb ID</label>
              <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2 font-mono">
                {movieDetails.imdbID && movieDetails.imdbID !== 'Unknown' ? (
                  <a 
                    href={`https://www.imdb.com/title/${movieDetails.imdbID}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {movieDetails.imdbID}
                  </a>
                ) : 'Unknown'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Released</label>
              <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">{movieDetails.released}</p>
            </div>
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