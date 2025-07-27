import omdbApi from './omdb'

const BASE_URL = import.meta.env.DEV ? 'http://localhost:3001/api/v1' : 'https://api.opensubtitles.com/api/v1'
const API_KEY = import.meta.env.VITE_OPENSUBTITLES_API_KEY || ''

// Check if we're in a Tauri environment
const isTauri = typeof window !== 'undefined' && window.__TAURI__

class OpenSubtitlesAPI {
  constructor() {
    this.token = null
    this.cache = new Map()
    this.requestQueue = new Map()
    this.omdbApi = omdbApi
  }

  // Get base headers for all requests
  getHeaders(includeAuth = false) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    // Only add API key when not using proxy
    if (!import.meta.env.DEV) {
      headers['Api-Key'] = API_KEY
      headers['User-Agent'] = 'OpenSubtitlesDownloader v1.0.0'
    }

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers
  }

  // Rate limiting and request deduplication
  async makeRequest(url, options = {}) {
    const requestKey = `${options.method || 'GET'}_${url}`
    
    // Check if same request is already in progress
    if (this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey)
    }

    const requestPromise = this._executeRequest(url, options)
    this.requestQueue.set(requestKey, requestPromise)

    try {
      const result = await requestPromise
      return result
    } finally {
      this.requestQueue.delete(requestKey)
    }
  }

  async _executeRequest(url, options = {}) {
    let fetchFunction = fetch
    const headers = {
      ...this.getHeaders(options.requireAuth),
      ...options.headers
    }
    
    // In development, the proxy will handle User-Agent
    // In production, we need to handle this differently
    
    const response = await fetchFunction(url, {
      ...options,
      headers
    })

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '10')
      await this.delay(retryAfter * 1000)
      return this._executeRequest(url, options)
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(`API Error ${response.status}: ${error.message}`)
    }

    return response.json()
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Authentication
  async login(username, password) {
    const response = await this.makeRequest(`${BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })

    this.token = response.token
    localStorage.setItem('opensubtitles_token', this.token)
    return response
  }

  async logout() {
    if (!this.token) return

    try {
      await this.makeRequest(`${BASE_URL}/logout`, {
        method: 'DELETE',
        requireAuth: true
      })
    } finally {
      this.token = null
      localStorage.removeItem('opensubtitles_token')
    }
  }

  // Load token from storage
  loadToken() {
    this.token = localStorage.getItem('opensubtitles_token')
    return !!this.token
  }

  // Search for subtitles
  async searchSubtitles(params) {
    const cacheKey = `search_${JSON.stringify(params)}`
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < 300000) { // 5 minute cache
        return cached.data
      }
    }

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value)
      }
    })

    const url = `${BASE_URL}/subtitles?${searchParams.toString()}`
    const data = await this.makeRequest(url)

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })

    return data
  }

  // Download subtitle
  async downloadSubtitle(fileId, options = {}) {
    const body = {
      file_id: fileId,
      ...options
    }

    const response = await this.makeRequest(`${BASE_URL}/download`, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(body)
    })

    return response
  }

  // Get subtitle file content
  async getSubtitleContent(downloadLink) {
    let fetchFunction = fetch
    
    // Try to use Tauri fetch if available
    if (isTauri) {
      try {
        const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http')
        fetchFunction = tauriFetch
      } catch (e) {
        // Fall back to browser fetch
      }
    }
    
    const response = await fetchFunction(downloadLink)
    if (!response.ok) {
      throw new Error(`Failed to download subtitle: ${response.status}`)
    }
    return response.text()
  }

  // Get user info
  async getUserInfo() {
    if (!this.token) return null

    try {
      return await this.makeRequest(`${BASE_URL}/infos/user`, {
        requireAuth: true
      })
    } catch (error) {
      console.error('Failed to get user info:', error)
      return null
    }
  }

  // Language support
  async getSupportedLanguages() {
    const cacheKey = 'supported_languages'
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < 86400000) { // 24 hour cache
        return cached.data
      }
    }

    const data = await this.makeRequest(`${BASE_URL}/infos/languages`)
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })

    return data
  }

  // Detect language from text
  async detectLanguage(text) {
    return await this.makeRequest(`${BASE_URL}/utilities/guessit`, {
      method: 'POST',
      body: JSON.stringify({ filename: text })
    })
  }

  // Clear cache
  clearCache() {
    this.cache.clear()
  }
}

export default new OpenSubtitlesAPI()