import { Image, StyleSheet, View } from 'react-native'

import { getGuideArtwork } from '@/data/guideArtwork'
import type { Guide } from '@/data/guides'

/** Bundled artwork follows the selected disaster phase or the first-aid topic. */
export function GuideIllustration({ guide, phase }: { guide: Guide; phase: string }) {
  const artwork = getGuideArtwork(guide.id, phase)
  if (!artwork) return null

  return (
    <View style={styles.frame}>
      <Image
        source={artwork.source}
        style={styles.image}
        resizeMode="contain"
        accessible
        accessibilityLabel={`${guide.name}: ${artwork.caption}`}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  // Size the frame independently of the bundled image's intrinsic dimensions.
  frame: { width: '100%', aspectRatio: 3 / 2, overflow: 'hidden' },
  // Override the static asset's 1200 × 800 intrinsic size on both axes.
  image: { width: '100%', height: '100%' },
})
