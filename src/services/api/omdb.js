// OMDB API integration for movie/TV show information
// You'll need to get a free API key from: https://www.omdbapi.com/apikey.aspx

const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY || 'demo' // Replace with your actual API key
const OMDB_BASE_URL = 'https://www.omdbapi.com/'

class OMDBApi {
  constructor() {
    this.cache = new Map()
  }

  // Get movie/show details by title and year
  async getMovieDetails(title, year = null) {
    const cacheKey = `${title}_${year || 'no_year'}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        return cached.data
      }
    }

    try {
      const params = new URLSearchParams({
        apikey: OMDB_API_KEY,
        t: title,
        plot: 'full',
        r: 'json'
      })

      if (year) {
        params.append('y', year)
      }

      const response = await fetch(`${OMDB_BASE_URL}?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`OMDB API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.Response === 'False') {
        throw new Error(data.Error || 'Movie not found')
      }

      // Transform OMDB data to our format
      const movieDetails = this.transformOMDBData(data)

      // Cache the result
      this.cache.set(cacheKey, {
        data: movieDetails,
        timestamp: Date.now()
      })

      return movieDetails
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching from OMDB:', error)
      }
      
      // Return fallback data on error
      return {
        title: title,
        year: year || 'Unknown',
        yearRange: year || 'Unknown',
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
      }
    }
  }

  // Transform OMDB response to our format
  transformOMDBData(omdbData) {
    // Debug: Log the raw OMDB response
    if (process.env.NODE_ENV === 'development') {
      console.log('Raw OMDB Data:', JSON.stringify(omdbData, null, 2))
    }
    
    const transformed = {
      title: omdbData.Title || 'Unknown',
      year: omdbData.Year || 'Unknown',
      yearRange: omdbData.Type === 'series' ? omdbData.Year : omdbData.Year,
      duration: omdbData.Runtime || 'Unknown',
      genre: omdbData.Genre || 'Unknown',
      imdbRating: (omdbData.imdbRating || omdbData.ImdbRating) && (omdbData.imdbRating || omdbData.ImdbRating) !== 'N/A' ? (omdbData.imdbRating || omdbData.ImdbRating) : 'N/A',
      plot: omdbData.Plot || 'Plot information not available',
      actors: omdbData.Actors || 'Cast information not available',
      country: omdbData.Country || 'Unknown',
      awards: omdbData.Awards && omdbData.Awards !== 'N/A' ? omdbData.Awards : 'No awards information',
      imdbID: omdbData.imdbID || 'Unknown',
      type: omdbData.Type || 'movie',
      poster: omdbData.Poster && omdbData.Poster !== 'N/A' && omdbData.Poster !== 'undefined' ? omdbData.Poster : null,
      director: omdbData.Director && omdbData.Director !== 'N/A' ? omdbData.Director : 'Unknown',
      writer: omdbData.Writer || 'Unknown',
      language: omdbData.Language || 'Unknown',
      rated: omdbData.Rated || 'Not Rated',
      released: omdbData.Released || 'Unknown',
      metascore: omdbData.Metascore || 'N/A',
      imdbVotes: omdbData.imdbVotes || omdbData.ImdbVotes || 'N/A',
      boxOffice: omdbData.BoxOffice || 'N/A'
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Transformed OMDB Data:', JSON.stringify(transformed, null, 2))
    }
    return transformed
  }

  // Search for movies/shows
  async searchMovies(query, year = null, type = null) {
    try {
      const params = new URLSearchParams({
        apikey: OMDB_API_KEY,
        s: query,
        r: 'json'
      })

      if (year) {
        params.append('y', year)
      }

      if (type) {
        params.append('type', type) // movie, series, episode
      }

      const response = await fetch(`${OMDB_BASE_URL}?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`OMDB API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.Response === 'False') {
        return []
      }

      return data.Search || []
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error searching OMDB:', error)
      }
      return []
    }
  }

  // Get movie details by IMDb ID
  async getMovieByImdbId(imdbId) {
    const cacheKey = `imdb_${imdbId}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        return cached.data
      }
    }

    try {
      const params = new URLSearchParams({
        apikey: OMDB_API_KEY,
        i: imdbId,
        plot: 'full',
        r: 'json'
      })

      const response = await fetch(`${OMDB_BASE_URL}?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`OMDB API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.Response === 'False') {
        throw new Error(data.Error || 'Movie not found')
      }

      const movieDetails = this.transformOMDBData(data)

      // Cache the result
      this.cache.set(cacheKey, {
        data: movieDetails,
        timestamp: Date.now()
      })

      return movieDetails
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching from OMDB by IMDb ID:', error)
      }
      throw error
    }
  }

  // Get episode details using series IMDb ID and season/episode numbers
  async getEpisodeBySeriesId(seriesImdbId, season, episode) {
    const cacheKey = `episode_${seriesImdbId}_S${season}E${episode}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        return cached.data
      }
    }

    try {
      const params = new URLSearchParams({
        apikey: OMDB_API_KEY,
        i: seriesImdbId,
        Season: season.toString(),
        Episode: episode.toString(),
        plot: 'full',
        r: 'json'
      })

      const response = await fetch(`${OMDB_BASE_URL}?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`OMDB API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.Response === 'False') {
        // If episode not found, try to get series info instead
        const seriesData = await this.getMovieByImdbId(seriesImdbId)
        return {
          ...seriesData,
          episodeNumber: episode,
          seasonNumber: season,
          episodeName: `Season ${season}, Episode ${episode}`,
          type: 'episode',
          plot: `Episode ${episode} of ${seriesData.title}`,
          isSeriesFallback: true
        }
      }

      const episodeDetails = this.transformEpisodeData(data, season, episode)

      // Cache the result
      this.cache.set(cacheKey, {
        data: episodeDetails,
        timestamp: Date.now()
      })

      return episodeDetails
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching episode from OMDB:', error)
      }
      throw error
    }
  }

  // Get series information by title
  async getSeriesInfo(title) {
    const cacheKey = `series_${title}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        return cached.data
      }
    }

    try {
      const params = new URLSearchParams({
        apikey: OMDB_API_KEY,
        t: title,
        type: 'series',
        plot: 'full',
        r: 'json'
      })

      const response = await fetch(`${OMDB_BASE_URL}?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`OMDB API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.Response === 'False') {
        throw new Error(data.Error || 'Series not found')
      }

      const seriesDetails = this.transformOMDBData(data)

      // Cache the result
      this.cache.set(cacheKey, {
        data: seriesDetails,
        timestamp: Date.now()
      })

      return seriesDetails
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching series from OMDB:', error)
      }
      throw error
    }
  }

  // Transform episode-specific OMDB data
  transformEpisodeData(omdbData, season, episode) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Transforming episode data - Season:', season, 'Episode:', episode)
      console.log('Episode OMDB Data:', JSON.stringify(omdbData, null, 2))
    }
    
    const baseData = this.transformOMDBData(omdbData)
    
    const episodeData = {
      ...baseData,
      episodeNumber: episode,
      seasonNumber: season,
      episodeName: omdbData.Title || `Episode ${episode}`,
      seriesTitle: omdbData.SeriesTitle || baseData.title,
      type: 'episode',
      // Episode-specific fields
      episodeImdbID: omdbData.imdbID,
      seriesImdbID: omdbData.seriesID || 'Unknown'
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Final episode data:', JSON.stringify(episodeData, null, 2))
    }
    return episodeData
  }

  // Clear cache
  clearCache() {
    this.cache.clear()
  }

  // Check if API key is configured
  isConfigured() {
    return OMDB_API_KEY && OMDB_API_KEY !== 'demo'
  }
}

export default new OMDBApi()