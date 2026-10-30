import type { ImageSourcePropType } from 'react-native'

/** Bundled images keep weather decoration available without additional network requests. */
export const weatherArtwork = {
  sunny: require('../../assets/weather/sunny-v2.jpg'),
  partlyCloudy: require('../../assets/weather/partly-cloudy-v2.jpg'),
  cloudy: require('../../assets/weather/overcast-v2.jpg'),
  cloudyNight: require('../../assets/weather/cloudy-night-v2.jpg'),
  drizzle: require('../../assets/weather/drizzle-v2.jpg'),
  rain: require('../../assets/weather/rain-v2.jpg'),
  rainNight: require('../../assets/weather/rain-night-v2.jpg'),
  storm: require('../../assets/weather/storm-v2.jpg'),
  night: require('../../assets/weather/night-v2.jpg'),
  fog: require('../../assets/weather/fog.jpg'),
  snow: require('../../assets/weather/snow.jpg'),
} satisfies Record<string, ImageSourcePropType>

export type WeatherArtwork = keyof typeof weatherArtwork
