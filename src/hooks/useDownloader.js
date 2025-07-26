import { useState, useCallback } from 'react'
import { useApi } from '../contexts/ApiContext'
import { useApp } from '../contexts/AppContext'
import { generateId } from '../utils/helpers'

export const useDownloader = () => {
  const { api } = useApi()
  const { addDownload, updateDownload } = useApp()
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadSubtitle = useCallback(async (subtitle, options = {}) => {
    const downloadId = generateId()
    
    // Create download entry
    const download = {
      id: downloadId,
      subtitle,
      status: 'pending',
      progress: 0,
      fileName: '',
      error: null,
      startTime: Date.now(),
      ...options
    }

    addDownload(download)
    setIsDownloading(true)

    try {
      // Update status to downloading
      updateDownload(downloadId, { status: 'downloading', progress: 10 })

      // Get download link from API
      const fileId = subtitle.attributes.files[0].file_id
      const downloadResponse = await api.downloadSubtitle(fileId, {
        sub_format: options.format || 'srt',
        file_name: options.fileName,
        ...options
      })

      updateDownload(downloadId, { progress: 50 })

      // Download the actual subtitle content
      const content = await api.getSubtitleContent(downloadResponse.link)
      
      updateDownload(downloadId, { progress: 80 })

      // Generate filename if not provided
      const fileName = options.fileName || generateFileName(subtitle, options.format || 'srt')
      
      // Save or return content based on environment
      await saveSubtitleFile(content, fileName, downloadId)

      // Mark as completed
      updateDownload(downloadId, {
        status: 'completed',
        progress: 100,
        fileName,
        endTime: Date.now()
      })

      return {
        id: downloadId,
        content,
        fileName,
        downloadResponse
      }

    } catch (error) {
      updateDownload(downloadId, {
        status: 'error',
        error: error.message,
        endTime: Date.now()
      })
      throw error
    } finally {
      setIsDownloading(false)
    }
  }, [api, addDownload, updateDownload])

  const downloadMultiple = useCallback(async (subtitles, options = {}) => {
    const downloads = []
    
    for (const subtitle of subtitles) {
      try {
        const result = await downloadSubtitle(subtitle, options)
        downloads.push(result)
        
        // Add delay between downloads to respect rate limits
        if (subtitles.indexOf(subtitle) < subtitles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`Failed to download subtitle ${subtitle.id}:`, error)
        downloads.push({ error: error.message, subtitle })
      }
    }

    return downloads
  }, [downloadSubtitle])

  return {
    downloadSubtitle,
    downloadMultiple,
    isDownloading
  }
}

// Helper function to generate filename
function generateFileName(subtitle, format) {
  const attributes = subtitle.attributes
  const feature = attributes.feature_details
  
  let fileName = ''
  
  if (feature) {
    fileName = `${feature.title} (${feature.year})`
    if (feature.feature_type === 'episode') {
      fileName += ` S${feature.season_number?.toString().padStart(2, '0')}E${feature.episode_number?.toString().padStart(2, '0')}`
    }
  } else {
    fileName = attributes.release || `subtitle_${subtitle.id}`
  }

  // Add language
  fileName += `.${attributes.language}`
  
  // Add format
  fileName += `.${format}`

  // Clean filename
  return fileName.replace(/[<>:"/\\|?*]/g, '_')
}

// Save subtitle file (platform-specific)
async function saveSubtitleFile(content, fileName, downloadId) {
  // Check if we're in Tauri (desktop) environment
  if (window.__TAURI__) {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog')
      const { writeTextFile } = await import('@tauri-apps/plugin-fs')
      
      // Show save dialog
      const filePath = await save({
        defaultPath: fileName,
        filters: [{
          name: 'Subtitle files',
          extensions: ['srt', 'vtt', 'ass', 'sub']
        }]
      })

      if (filePath) {
        await writeTextFile(filePath, content)
        return filePath
      }
    } catch (error) {
      console.error('Failed to save with Tauri:', error)
      // Fall back to browser download
    }
  }

  // Browser environment - trigger download
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
  return fileName
}