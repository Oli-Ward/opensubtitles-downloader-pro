import React from 'react'
import { useApp } from '../contexts/AppContext'
import { useApi } from '../contexts/ApiContext'
import { useDownloader } from '../hooks/useDownloader'
import { getLanguageName, formatFileSize } from '../utils/helpers'

const SubtitleCard = ({ subtitle, isSelected }) => {
  const { selectSubtitle, deselectSubtitle } = useApp()
  const { isAuthenticated } = useApi()
  const { downloadSubtitle, isDownloading } = useDownloader()
  
  const attrs = subtitle.attributes
  const feature = attrs.feature_details
  const files = attrs.files || []

  const handleSelect = () => {
    if (isSelected) {
      deselectSubtitle(subtitle)
    } else {
      selectSubtitle(subtitle)
    }
  }

  const handleDownload = async () => {
    if (!isAuthenticated) {
      alert('Please login to download subtitles')
      return
    }

    try {
      await downloadSubtitle(subtitle)
    } catch (error) {
      console.error('Download failed:', error)
      alert(`Download failed: ${error.message}`)
    }
  }

  return (
    <div className={`p-4 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
      <div className="flex items-start space-x-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelect}
          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Title */}
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {feature?.movie_name || attrs.release || 'Unknown Title'}
              </h4>
              
              {/* Release info */}
              <p className="text-xs text-gray-600 mt-1 truncate">
                {attrs.release}
              </p>

              {/* Metadata */}
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  <span>{getLanguageName(attrs.language)}</span>
                </span>
                
                <span className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>{attrs.download_count?.toLocaleString() || 0}</span>
                </span>

                {attrs.ratings > 0 && (
                  <span className="flex items-center space-x-1">
                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{attrs.ratings.toFixed(1)}</span>
                  </span>
                )}

                <span className="uppercase font-medium text-blue-600">
                  {attrs.format || 'SRT'}
                </span>

                {attrs.hearing_impaired && (
                  <span className="bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-xs font-medium">
                    HI
                  </span>
                )}

                {attrs.ai_translated && (
                  <span className="bg-orange-100 text-orange-800 px-1 py-0.5 rounded text-xs font-medium">
                    AI
                  </span>
                )}

                {attrs.from_trusted && (
                  <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs font-medium">
                    Trusted
                  </span>
                )}
              </div>

              {/* Comments */}
              {attrs.comments && (
                <p className="text-xs text-gray-600 mt-1 italic">
                  "{attrs.comments}"
                </p>
              )}

              {/* Files info */}
              {files.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  {files.length > 1 ? `${files.length} files` : files[0].file_name}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={handleDownload}
                disabled={isDownloading || !isAuthenticated}
                className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center space-x-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download</span>
              </button>

              {attrs.url && (
                <a
                  href={attrs.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="View on OpenSubtitles"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubtitleCard