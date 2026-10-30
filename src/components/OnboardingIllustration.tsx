import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native'

const disasterImage: ImageSourcePropType = require('../../assets/1.webp')
const firstAidImage: ImageSourcePropType = require('../../assets/2.webp')
const assistantImage: ImageSourcePropType = require('../../assets/3.webp')

export type OnboardingScene = 'disaster' | 'firstAid' | 'assistant'

const SCENE_SOURCES: Record<OnboardingScene, ImageSourcePropType> = {
  disaster: disasterImage,
  firstAid: firstAidImage,
  assistant: assistantImage,
}

const SCENE_ORDER: readonly OnboardingScene[] = ['disaster', 'firstAid', 'assistant']

/**
 * Transparent, centered static illustration stage for the three onboarding feature screens.
 * Keeps all three cropped transparent PNGs mounted during intro steps for instant, flicker-free switching.
 */
export function OnboardingIllustration({
  variant,
  accessibilityLabel,
}: {
  variant: OnboardingScene
  accessibilityLabel: string
}) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={styles.stage}
    >
      {SCENE_ORDER.map((scene) => (
        <Image
          key={scene}
          source={SCENE_SOURCES[scene]}
          resizeMode="contain"
          resizeMethod="resize"
          fadeDuration={0}
          accessibilityIgnoresInvertColors
          style={[styles.image, { opacity: scene === variant ? 1 : 0 }]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  stage: {
    width: 276,
    height: 236,
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundColor: 'transparent',
  },
})
