import React, { useState, useEffect, useCallback } from 'react';
import './WeatherWidget.css';

// Helper to translate WMO weather codes into conditions, icons, and task advice
const getWeatherInterpretation = (code, isDay = 1) => {
  switch (code) {
    case 0:
      return {
        text: 'Clear Sky',
        icon: isDay ? '☀️' : '🌙',
        advice: 'Clear skies! Perfect time for outdoor errands or high-energy task execution.',
      };
    case 1:
    case 2:
      return {
        text: 'Partly Cloudy',
        icon: isDay ? '🌤️' : '☁️',
        advice: 'Mild weather outside. Excellent balance for both focused work and meetings.',
      };
    case 3:
      return {
        text: 'Overcast',
        icon: '☁️',
        advice: 'Calm, overcast sky. Great lighting and ambiance for uninterrupted deep work.',
      };
    case 45:
    case 48:
      return {
        text: 'Foggy',
        icon: '🌫️',
        advice: 'Foggy conditions. Stay cozy indoors and knock out your task backlog.',
      };
    case 51:
    case 53:
    case 55:
      return {
        text: 'Light Drizzle',
        icon: '🌦️',
        advice: 'Light drizzle outside. Grab a hot beverage and conquer your high-priority tasks!',
      };
    case 61:
    case 63:
    case 65:
      return {
        text: 'Rain',
        icon: '🌧️',
        advice: 'Rainy day! Ideal setting for heads-down coding and finishing pending tasks.',
      };
    case 71:
    case 73:
    case 75:
    case 77:
      return {
        text: 'Snowy',
        icon: '❄️',
        advice: 'Cold and snowy. Stay warm indoors and power through your project milestones.',
      };
    case 80:
    case 81:
    case 82:
      return {
        text: 'Rain Showers',
        icon: '🌧️',
        advice: 'Showers in the area. Stay inside and turn off notifications for deep focus.',
      };
    case 95:
    case 96:
    case 99:
      return {
        text: 'Thunderstorm',
        icon: '⛈️',
        advice: 'Stormy weather outside. Channel the electric energy into shipping great code!',
      };
    default:
      return {
        text: 'Fair Weather',
        icon: '⛅',
        advice: 'Good weather conditions to plan your schedule and hit today’s targets.',
      };
  }
};

const PRESET_CITIES = ['London', 'New York', 'Tokyo', 'Paris', 'Karachi'];

function WeatherWidget() {
  const [city, setCity] = useState('London');
  const [searchInput, setSearchInput] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async (cityName) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Geocoding API: resolve city name to latitude and longitude
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        cityName
      )}&count=1&language=en&format=json`;

      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) throw new Error('Geocoding service unavailable');
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`Location "${cityName}" not found`);
      }

      const location = geoData.results[0];
      const { latitude, longitude, name, country } = location;

      // 2. Weather Forecast API: fetch live weather conditions
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto`;

      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) throw new Error('Weather forecast service unavailable');
      const weatherJson = await weatherRes.json();

      setWeatherData({
        city: name,
        country: country || '',
        current: weatherJson.current,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setCity(name);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError(err.message || 'Unable to fetch weather data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(city);
  }, [fetchWeather, city]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchWeather(searchInput.trim());
      setSearchInput('');
    }
  };

  const handlePresetClick = (presetCity) => {
    if (presetCity !== city) {
      fetchWeather(presetCity);
    }
  };

  const current = weatherData?.current;
  const interp = current ? getWeatherInterpretation(current.weather_code, current.is_day) : null;

  return (
    <div className="weather-card">
      {/* Header */}
      <div className="weather-header">
        <div className="weather-location-box">
          <span style={{ fontSize: '1.2rem' }}>📍</span>
          <h3 className="weather-city-name">{weatherData?.city || city}</h3>
          {weatherData?.country && (
            <span className="weather-country">{weatherData.country}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="weather-api-tag">
            <span className="api-live-dot"></span> Open-Meteo Public API
          </span>
          <button
            className="btn-refresh"
            onClick={() => fetchWeather(city)}
            title="Refresh weather"
          >
            ↻ {weatherData?.timestamp || 'Refresh'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="weather-loading-box">
          <span>Fetching live weather data...</span>
        </div>
      ) : error ? (
        <div className="weather-error-box">
          <span>⚠️ {error}</span>
          <div style={{ marginTop: '8px' }}>
            <button
              className="btn-weather-search"
              onClick={() => fetchWeather('London')}
            >
              Reset to London
            </button>
          </div>
        </div>
      ) : current && interp ? (
        <>
          {/* Main Weather Display */}
          <div className="weather-main-row">
            <div className="weather-temp-block">
              <span className="weather-icon-large" role="img" aria-label={interp.text}>
                {interp.icon}
              </span>
              <div>
                <span className="weather-temp-num">
                  {Math.round(current.temperature_2m)}
                  <span className="weather-temp-unit">°C</span>
                </span>
                <div className="weather-condition-text">{interp.text}</div>
              </div>
            </div>

            {/* Weather Details Grid */}
            <div className="weather-details-grid">
              <div className="weather-detail-item">
                <span className="weather-detail-label">Feels Like</span>
                <span className="weather-detail-value">
                  {Math.round(current.apparent_temperature)}°C
                </span>
              </div>
              <div className="weather-detail-item">
                <span className="weather-detail-label">Humidity</span>
                <span className="weather-detail-value">
                  {current.relative_humidity_2m}%
                </span>
              </div>
              <div className="weather-detail-item">
                <span className="weather-detail-label">Wind</span>
                <span className="weather-detail-value">
                  {current.wind_speed_10m} km/h
                </span>
              </div>
            </div>
          </div>

          {/* Productivity Tip Banner */}
          <div className="productivity-tip-box">
            <span className="tip-icon">💡</span>
            <p className="tip-text">
              <strong>Weather-Powered Planning:</strong> {interp.advice}
            </p>
          </div>
        </>
      ) : null}

      {/* City Switcher & Search Controls */}
      <div className="weather-controls-row">
        <form className="weather-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="weather-search-input"
            placeholder="Search city (e.g. Dubai, Berlin)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn-weather-search">
            Search
          </button>
        </form>

        <div className="quick-cities">
          {PRESET_CITIES.map((c) => (
            <button
              key={c}
              className={`btn-city-pill ${city === c ? 'active' : ''}`}
              onClick={() => handlePresetClick(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WeatherWidget;

