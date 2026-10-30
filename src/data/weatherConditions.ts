import type { IconName } from '@/components/ui/Icon'
import type { WeatherArtwork } from '@/data/weatherArtwork'

type WeatherCondition = { label: string; icon: IconName; background: WeatherArtwork | null }

/** Open-Meteo WMO codes: https://open-meteo.com/en/docs#weathervariables */
const labels: Record<number, string> = {
  0: 'Clear skies', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Freezing fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
  61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Light freezing rain', 67: 'Heavy freezing rain',
  71: 'Light snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Light rain showers', 81: 'Moderate rain showers', 82: 'Heavy rain showers',
  85: 'Light snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail',
  97: 'Heavy thunderstorm', 99: 'Thunderstorm with heavy hail',
}

export function conditionFor(code: number, isDay: boolean): WeatherCondition {
  // Unknown codes must not imply a particular sky condition.
  const label = Object.hasOwn(labels, code) ? labels[code] : undefined
  if (!label) return { label: 'Conditions unavailable', icon: 'cloud', background: null }
  if (code === 0) return { label: isDay ? label : 'Clear night', icon: isDay ? 'sun' : 'moon', background: isDay ? 'sunny' : 'night' }
  if (code === 1 || code === 2) return { label, icon: 'cloud', background: isDay ? 'partlyCloudy' : 'cloudyNight' }
  if (code === 3) return { label, icon: 'cloud', background: isDay ? 'cloudy' : 'cloudyNight' }
  if (code === 45 || code === 48) return { label, icon: 'cloud', background: 'fog' }
  if ([51, 53, 55, 56, 57].includes(code)) return { label, icon: 'rain', background: isDay ? 'drizzle' : 'rainNight' }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label, icon: 'rain', background: isDay ? 'rain' : 'rainNight' }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label, icon: 'cloud', background: 'snow' }
  return { label, icon: 'storm', background: 'storm' }
}
