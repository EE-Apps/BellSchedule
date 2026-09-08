class WeatherManager {
    static REFRESH_INTERVAL_MS = 15 * 60 * 1000

    constructor() {
        this.lastRequestAt = 0
        this.forecast = null
        this.elements = {
            card: document.getElementById('weatherCard'),
            description: document.getElementById('weatherDescr'),
            temperature: document.getElementById('weatherTemperature'),
            icon: document.getElementById('weatherIcon'),
        }
        this.refresh()
        setInterval(() => this.refresh(), WeatherManager.REFRESH_INTERVAL_MS)
    }

    getCoordinates() {
        const weather = window.settings?.weather || {}
        const latitude = Number(weather.latitude ?? weather.location?.[0])
        const longitude = Number(weather.longitude ?? weather.location?.[1])
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) return null
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null
        return { latitude, longitude }
    }

    weatherIcon(code) {
        if (code === 0) return 'sunny'
        if ([1, 2].includes(code)) return 'mostly_sunny'
        if (code === 3) return 'cloudy'
        if ([45, 48].includes(code)) return 'haze_fog_dust_smoke'
        if ([51, 53, 55, 56, 57].includes(code)) return 'drizzle'
        if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'showers_rain'
        if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow_showers_snow'
        if ([95, 96, 99].includes(code)) return 'strong_tstorms'
        return 'partly_cloudy'
    }

    async refresh(force = false) {
        const coordinates = this.getCoordinates()
        if (!coordinates) {
            this.elements.description.textContent = 'Укажите координаты в настройках погоды.'
            this.elements.temperature.textContent = '—'
            return
        }
        if (!force && Date.now() - this.lastRequestAt < WeatherManager.REFRESH_INTERVAL_MS) return
        this.lastRequestAt = Date.now()
        const url = new URL('https://api.open-meteo.com/v1/forecast')
        url.search = new URLSearchParams({
            latitude: String(coordinates.latitude), longitude: String(coordinates.longitude),
            hourly: 'temperature_2m,weather_code', timeformat: 'unixtime', timezone: 'auto'
        })
        try {
            const response = await fetch(url, { cache: 'no-store' })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const data = await response.json()
            this.forecast = data
            const hourly = data.hourly
            const now = Math.floor(Date.now() / 1000)
            const index = hourly.time.reduce((best, time, i) => Math.abs(time - now) < Math.abs(hourly.time[best] - now) ? i : best, 0)
            const temp = hourly.temperature_2m[index]
            const code = hourly.weather_code[index]
            this.elements.temperature.textContent = `${Math.round(temp)}°${data.hourly_units?.temperature_2m || 'C'}`
            this.elements.description.textContent = 'Погода обновлена'
            this.elements.icon.src = `img/weather/${this.weatherIcon(code)}.webp`
            this.elements.card?.classList.remove('weatherError')
        } catch (error) {
            console.warn('Не удалось получить погоду:', error)
            this.elements.description.textContent = 'Не удалось обновить погоду.'
            this.elements.temperature.textContent = '—'
            this.elements.card?.classList.add('weatherError')
        }
    }

    forecastAtTime(timestamp) {
        const hourly = this.forecast?.hourly
        if (!hourly?.time?.length) return null
        const target = Math.floor(timestamp / 1000)
        const index = hourly.time.reduce((best, time, i) => Math.abs(time - target) < Math.abs(hourly.time[best] - target) ? i : best, 0)
        return {
            temperature: hourly.temperature_2m[index],
            code: hourly.weather_code[index]
        }
    }
}

document.addEventListener('DOMContentLoaded', () => { window.weatherManager = new WeatherManager() })
