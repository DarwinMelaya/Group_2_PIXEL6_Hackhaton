import type { ImageSourcePropType } from 'react-native'

declare module '*.webp' {
  const value: ImageSourcePropType
  export default value
}
