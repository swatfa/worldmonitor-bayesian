import { defineConfig, loadEnv, Plugin } from 'vite';
import { resolve } from 'path';

function apiProxyPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'api-proxy',
    configureServer(server) {
      // Add middleware at the BEGINNING (before Vite's internal middleware)
      server.middlewares.use(async (req, res, next) => {
        const url = req.url;
        
        // Handle Finnhub
        if (url?.startsWith('/api/finnhub')) {
          const urlObj = new URL(url, `http://${req.headers.host}`);
          const symbols = urlObj.searchParams.get('symbols');
          
          if (!symbols) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing symbols parameter' }));
            return;
          }

          const apiKey = env.FINNHUB_API_KEY;
          if (!apiKey) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Finnhub API key not configured' }));
            return;
          }

          try {
            const symbolList = symbols.split(',').slice(0, 20);
            
            const quotes = await Promise.all(
              symbolList.map(async (symbol) => {
                try {
                  const finnhubUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol.trim())}&token=${apiKey}`;
                  const response = await fetch(finnhubUrl);
                  
                  if (!response.ok) {
                    return { symbol, error: `HTTP ${response.status}` };
                  }
                  
                  const data = await response.json();
                  
                  if (data.c === 0 && data.h === 0 && data.l === 0) {
                    return { symbol, error: 'No data available' };
                  }
                  
                  return {
                    symbol,
                    price: data.c,
                    change: data.d,
                    changePercent: data.dp,
                    high: data.h,
                    low: data.l,
                    open: data.o,
                    previousClose: data.pc,
                    timestamp: data.t,
                  };
                } catch (error) {
                  return { symbol, error: 'Fetch failed' };
                }
              })
            );

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ quotes }));
            return;
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch data' }));
            return;
          }
        }

        // Handle GDELT Doc API
        if (url?.startsWith('/api/gdelt-doc')) {
          const urlObj = new URL(url, `http://${req.headers.host}`);
          const query = urlObj.searchParams.get('query');
          const maxrecords = urlObj.searchParams.get('maxrecords') || '10';
          const timespan = urlObj.searchParams.get('timespan') || '72h';

          if (!query || query.length < 2) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Query parameter required' }));
            return;
          }

          try {
            const gdeltUrl = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
            gdeltUrl.searchParams.set('query', query);
            gdeltUrl.searchParams.set('mode', 'artlist');
            gdeltUrl.searchParams.set('maxrecords', Math.min(parseInt(maxrecords, 10), 20).toString());
            gdeltUrl.searchParams.set('format', 'json');
            gdeltUrl.searchParams.set('sort', 'date');
            gdeltUrl.searchParams.set('timespan', timespan);

            const response = await fetch(gdeltUrl.toString());

            if (!response.ok) {
              throw new Error(`GDELT returned ${response.status}`);
            }

            const data = await response.json();

            const articles = (data.articles || []).map((article: any) => ({
              title: article.title,
              url: article.url,
              source: article.domain || article.source?.domain,
              date: article.seendate,
              image: article.socialimage,
              language: article.language,
              tone: article.tone,
            }));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ articles, query }));
            return;
          } catch (error: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message, articles: [] }));
            return;
          }
        }

        // Handle ACLED (cookie-based auth per ACLED docs)
        if (url?.startsWith('/api/acled')) {
          const email = env.ACLED_EMAIL;
          const password = env.ACLED_PASSWORD;

          if (!email || !password) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'ACLED not configured', data: [], configured: false }));
            return;
          }

          try {
            // Step 1: Login with cookie-based auth (bypasses Cloudflare OAuth blocking)
            const loginResponse = await fetch('https://acleddata.com/user/login?_format=json', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                name: email,
                pass: password,
              }),
            });

            if (!loginResponse.ok) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'ACLED login failed', data: [], configured: false }));
              return;
            }

            // Extract session cookies
            const cookies = loginResponse.headers.get('set-cookie') || '';

            // Step 2: Make API request with session cookie
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const params = new URLSearchParams({
              event_type: 'Protests',
              event_date: `${startDate}|${endDate}`,
              event_date_where: 'BETWEEN',
              limit: '500',
              _format: 'json',
            });

            const response = await fetch(`https://acleddata.com/api/acled/read?${params}`, {
              headers: {
                'Accept': 'application/json',
                'Cookie': cookies,
              },
            });

            if (!response.ok) {
              const text = await response.text();
              res.writeHead(response.status, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `ACLED API error: ${response.status}`, details: text.substring(0, 200), data: [] }));
              return;
            }

            const rawData: any = await response.json();
            const events = rawData.data || [];

            const sanitizedEvents = events.map((e: any) => ({
              event_id_cnty: e.event_id_cnty,
              event_date: e.event_date,
              event_type: e.event_type,
              sub_event_type: e.sub_event_type,
              actor1: e.actor1,
              actor2: e.actor2,
              country: e.country,
              admin1: e.admin1,
              location: e.location,
              latitude: e.latitude,
              longitude: e.longitude,
              fatalities: e.fatalities,
              notes: e.notes?.substring(0, 500),
              source: e.source,
              tags: e.tags,
            }));

            const result = {
              success: true,
              count: sanitizedEvents.length,
              data: sanitizedEvents,
              cached_at: new Date().toISOString(),
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
            return;
          } catch (error: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Fetch failed: ${error.message}`, data: [] }));
            return;
          }
        }

        // Handle RSS Proxy (for CORS bypass)
        if (url?.startsWith('/api/rss-proxy')) {
          const urlObj = new URL(url, `http://${req.headers.host}`);
          const targetUrl = urlObj.searchParams.get('url');

          if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing url parameter' }));
            return;
          }

          try {
            const response = await fetch(targetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Referer': 'https://www.google.com/',
              },
            });

            if (!response.ok) {
              res.writeHead(response.status, { 'Content-Type': 'text/plain' });
              res.end(`Failed to fetch RSS feed: ${response.status}`);
              return;
            }

            const xml = await response.text();
            res.writeHead(200, { 
              'Content-Type': 'application/xml',
              'Cache-Control': 'public, max-age=300',
            });
            res.end(xml);
            return;
          } catch (error: any) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end(`RSS proxy error: ${error.message}`);
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [apiProxyPlugin(env)],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'd3': ['d3'],
            'topojson': ['topojson-client'],
          },
        },
      },
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api/yahoo-finance': {
          target: 'https://query1.finance.yahoo.com',
          changeOrigin: true,
          rewrite: (path) => {
            const url = new URL(path, 'http://localhost');
            const symbol = url.searchParams.get('symbol');
            return `/v8/finance/chart/${encodeURIComponent(symbol || '')}`;
          },
        },
        '/api/earthquakes': {
          target: 'https://earthquake.usgs.gov',
          changeOrigin: true,
          rewrite: () => '/earthquakes/feed/v1.0/summary/4.5_day.geojson',
        },
        '/api/cloudflare-outages': {
          target: 'https://api.cloudflare.com',
          changeOrigin: true,
          rewrite: (path) => {
            const url = new URL(path, 'http://localhost');
            const dateRange = url.searchParams.get('dateRange') || '7d';
            const limit = url.searchParams.get('limit') || '50';
            return `/client/v4/radar/annotations/outages?dateRange=${dateRange}&limit=${limit}`;
          },
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const token = env.CLOUDFLARE_API_TOKEN;
              if (token) {
                proxyReq.setHeader('Authorization', `Bearer ${token}`);
              }
            });
          },
        },
        '/api/coingecko': {
          target: 'https://api.coingecko.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/coingecko/, '/api/v3/simple/price'),
        },
        '/api/polymarket': {
          target: 'https://gamma-api.polymarket.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/polymarket/, '/markets'),
        },
        '/api/fred-data': {
          target: 'https://api.stlouisfed.org',
          changeOrigin: true,
          rewrite: (path) => {
            const url = new URL(path, 'http://localhost');
            const seriesId = url.searchParams.get('series_id');
            const start = url.searchParams.get('observation_start');
            const end = url.searchParams.get('observation_end');
            const apiKey = env.FRED_API_KEY || '';
            return `/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=10${start ? `&observation_start=${start}` : ''}${end ? `&observation_end=${end}` : ''}`;
          },
        },
        // GDELT GEO 2.0 API - Geolocation endpoint (MUST come before /api/gdelt)
        '/api/gdelt-geo': {
          target: 'https://api.gdeltproject.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/gdelt-geo/, '/api/v2/geo/geo'),
        },
        // GDELT 2.0 API - Global event data (other GDELT endpoints)
        '/api/gdelt': {
          target: 'https://api.gdeltproject.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/gdelt/, ''),
        },
        // PizzINT - Pentagon Pizza Index
        '/api/pizzint': {
          target: 'https://www.pizzint.watch',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/pizzint/, '/api'),
        },
        // NGA Maritime Safety Information - Navigation Warnings (for undersea cable activity)
        '/api/nga-msi': {
          target: 'https://msi.nga.mil',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/nga-msi/, ''),
        },
        '/api/nga-warnings': {
          target: 'https://msi.nga.mil',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/nga-warnings/, ''),
        },
        // FAA NASSTATUS - Airport delays and closures
        '/api/faa': {
          target: 'https://nasstatus.faa.gov',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/faa/, ''),
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('FAA NASSTATUS proxy error:', err.message);
            });
          },
        },
        // OpenSky Network - Aircraft tracking (military flight detection)
        '/api/opensky': {
          target: 'https://opensky-network.org/api',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/opensky/, ''),
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('OpenSky proxy error:', err.message);
            });
          },
        },
        // ADS-B Exchange - Military aircraft tracking (backup/supplement)
        '/api/adsb-exchange': {
          target: 'https://adsbexchange.com/api',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/adsb-exchange/, ''),
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('ADS-B Exchange proxy error:', err.message);
            });
          },
        },
      },
    },
  };
});
