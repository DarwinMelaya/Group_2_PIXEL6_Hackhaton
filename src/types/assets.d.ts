import type { ImageSourcePropType } from 'react-native'

declare module '*.jpg' {
  const value: ImageSourcePropType
  export default value
}
