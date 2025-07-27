import React from 'react'

const FileUploadControls = ({ 
  language, 
  setLanguage, 
  groupByContent, 
  setGroupByContent,
  uploadedFiles,
  selectAllSubtitles,
  clearAllSubtitles,
  clearAllFiles,
  downloadAllSelected
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Settings & Controls</h3>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
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
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="group-content"
              checked={groupByContent}
              onChange={(e) => setGroupByContent(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="group-content" className="text-sm font-medium text-gray-700">
              Group by Series/Movies
            </label>
          </div>
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
              onClick={clearAllSubtitles}
              className="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={clearAllFiles}
              className="px-3 py-1 text-xs font-medium text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
            >
              Remove All Files
            </button>
            <button
              onClick={downloadAllSelected}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download Selected</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploadControls