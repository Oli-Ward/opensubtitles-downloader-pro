import React from 'react'
import { useApp } from '../contexts/AppContext'
import { formatDuration, getLanguageName } from '../utils/helpers'

const DownloadQueue = ({ downloads }) => {
  const { removeDownload } = useApp()

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'downloading': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'downloading':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  if (downloads.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Downloads</h3>
          <p>Your download queue is empty. Search for subtitles to start downloading.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Download Queue ({downloads.length})
        </h3>
      </div>

      <div className="divide-y divide-gray-200">
        {downloads.map((download) => {
          const subtitle = download.subtitle
          const attrs = subtitle.attributes
          const feature = attrs.feature_details
          const duration = download.endTime 
            ? download.endTime - download.startTime 
            : Date.now() - download.startTime

          return (
            <div key={download.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {feature?.movie_name || attrs.release || 'Unknown Title'}
                  </h4>
                  
                  {/* Subtitle info */}
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <span>{getLanguageName(attrs.language)}</span>
                    <span className="uppercase">{attrs.format || 'SRT'}</span>
                    {download.fileName && (
                      <span className="truncate max-w-xs">{download.fileName}</span>
                    )}
                  </div>

                  {/* Progress */}
                  {download.status === 'downloading' && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Downloading...</span>
                        <span>{download.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${download.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Error message */}
                  {download.error && (
                    <p className="text-xs text-red-600 mt-1">
                      Error: {download.error}
                    </p>
                  )}

                  {/* Duration */}
                  <div className="text-xs text-gray-500 mt-1">
                    {download.status === 'completed' ? 'Downloaded in' : 'Running for'} {formatDuration(duration)}
                  </div>
                </div>

                <div className="flex items-center space-x-3 ml-4">
                  {/* Status */}
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(download.status)}`}>
                    {getStatusIcon(download.status)}
                    <span className="capitalize">{download.status}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    {download.status === 'completed' && download.fileName && (
                      <button
                        onClick={() => {
                          // In a real app, this would open the file location
                          alert(`File saved as: ${download.fileName}`)
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Show in folder"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </button>
                    )}

                    <button
                      onClick={() => removeDownload(download.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Remove from queue"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DownloadQueue