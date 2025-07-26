import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Proxy endpoint for OpenSubtitles API
app.all('/api/v1/*', async (req, res) => {
  try {
    // Extract the OpenSubtitles API path
    const apiPath = req.path.replace('/api/v1', '');
    const targetUrl = `https://api.opensubtitles.com/api/v1${apiPath}`;
    
    // Prepare headers with proper User-Agent
    const headers = {
      'Api-Key': process.env.VITE_OPENSUBTITLES_API_KEY || '0x93ux1uBSNvRN0mc7sEjpsFDOSSa49W',
      'User-Agent': 'OpenSubtitlesDownloader v1.0.0',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Add authorization header if present in original request
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    // Forward the request to OpenSubtitles API
    const response = await fetch(`${targetUrl}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.text();
    
    // Set response headers
    res.status(response.status);
    res.set('Content-Type', response.headers.get('content-type'));
    
    // Send response
    res.send(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy server error' });
  }
});

app.listen(PORT, () => {
  console.log(`OpenSubtitles proxy server running on http://localhost:${PORT}`);
});