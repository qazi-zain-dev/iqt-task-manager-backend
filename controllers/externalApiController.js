const CITY_COORDINATES = {
  'new york': { lat: 40.7128, lon: -74.006, city: 'New York', country: 'United States' },
  'london': { lat: 51.5074, lon: -0.1278, city: 'London', country: 'United Kingdom' },
  'san francisco': { lat: 37.7749, lon: -122.4194, city: 'San Francisco', country: 'United States' },
  'tokyo': { lat: 35.6762, lon: 139.6503, city: 'Tokyo', country: 'Japan' },
  'paris': { lat: 48.8566, lon: 2.3522, city: 'Paris', country: 'France' },
  'lahore': { lat: 31.5497, lon: 74.3436, city: 'Lahore', country: 'Pakistan' },
  'berlin': { lat: 52.52, lon: 13.405, city: 'Berlin', country: 'Germany' },
  'toronto': { lat: 43.6532, lon: -79.3832, city: 'Toronto', country: 'Canada' },
  'sydney': { lat: -33.8688, lon: 151.2093, city: 'Sydney', country: 'Australia' },
  'dubai': { lat: 25.2048, lon: 55.2708, city: 'Dubai', country: 'United Arab Emirates' },
};

const getWeatherDescription = (code) => {
  if (code === 0) return { label: 'Clear sky', icon: 'Sun' };
  if (code === 1 || code === 2) return { label: 'Partly cloudy', icon: 'CloudSun' };
  if (code === 3) return { label: 'Overcast', icon: 'Cloud' };
  if (code >= 45 && code <= 48) return { label: 'Foggy', icon: 'CloudFog' };
  if (code >= 51 && code <= 55) return { label: 'Light Drizzle', icon: 'CloudDrizzle' };
  if (code >= 61 && code <= 65) return { label: 'Rain', icon: 'CloudRain' };
  if (code >= 71 && code <= 77) return { label: 'Snowfall', icon: 'Snowflake' };
  if (code >= 80 && code <= 82) return { label: 'Rain Showers', icon: 'CloudRain' };
  if (code >= 95) return { label: 'Thunderstorm', icon: 'CloudLightning' };
  return { label: 'Clear', icon: 'Sun' };
};

exports.getLiveWeather = async (req, res) => {
  try {
    const cityName = (req.query.city || 'San Francisco').toLowerCase().trim();
    let lat, lon, resolvedCity, resolvedCountry;

    if (CITY_COORDINATES[cityName]) {
      const match = CITY_COORDINATES[cityName];
      lat = match.lat;
      lon = match.lon;
      resolvedCity = match.city;
      resolvedCountry = match.country;
    } else {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        cityName
      )}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (geoData.results && geoData.results.length > 0) {
        const top = geoData.results[0];
        lat = top.latitude;
        lon = top.longitude;
        resolvedCity = top.name;
        resolvedCountry = top.country || '';
      } else {
        lat = 37.7749;
        lon = -122.4194;
        resolvedCity = 'San Francisco';
        resolvedCountry = 'United States';
      }
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    const current = weatherData.current || {};
    const weatherInfo = getWeatherDescription(current.weather_code || 0);

    let recommendation = 'Great conditions for focused work today.';
    const tempC = current.temperature_2m;
    if (current.weather_code >= 61) {
      recommendation = 'Rainy day ahead. Perfect for deep focus indoor tasks.';
    } else if (tempC >= 30) {
      recommendation = 'Warm weather today. Stay hydrated and prioritize core items.';
    } else if (tempC <= 5) {
      recommendation = 'Cold conditions outside. Great day for reviewing project plans.';
    }

    return res.status(200).json({
      success: true,
      apiUsed: 'Open-Meteo Weather API',
      location: {
        city: resolvedCity,
        country: resolvedCountry,
        latitude: lat,
        longitude: lon,
      },
      current: {
        temperature: current.temperature_2m,
        unit: '°C',
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        weatherCode: current.weather_code,
        condition: weatherInfo.label,
        icon: weatherInfo.icon,
        isDay: current.is_day === 1,
      },
      recommendation,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch weather data',
      error: error.message,
    });
  }
};

exports.getGitHubIssues = async (req, res) => {
  try {
    const repo = req.query.repo || 'facebook/react';
    const url = `https://api.github.com/repos/${repo}/issues?state=open&per_page=5`;

    const ghRes = await fetch(url, {
      headers: {
        'User-Agent': 'TaskMaster-App',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!ghRes.ok) {
      return res.status(ghRes.status).json({
        success: false,
        message: `GitHub API error: ${ghRes.statusText}`,
      });
    }

    const issues = await ghRes.json();
    const formatted = issues.map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body ? issue.body.slice(0, 200) + '...' : '',
      html_url: issue.html_url,
      labels: issue.labels.map((l) => l.name),
      user: issue.user ? issue.user.login : 'unknown',
    }));

    return res.status(200).json({
      success: true,
      apiUsed: 'GitHub REST API v3',
      repo,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch GitHub issues',
      error: error.message,
    });
  }
};
