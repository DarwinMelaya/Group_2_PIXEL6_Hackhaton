import { StyleSheet, View } from 'react-native'

import {
  onboardingStyles,
  StageFooter,
} from '@/components/onboarding/OnboardingChrome'
import {
  OnboardingIllustration,
  type OnboardingScene,
} from '@/components/OnboardingIllustration'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { TextButton } from '@/components/ui/Layout'
import { space } from '@/theme/tokens'

export type FeatureSlide = {
  scene: OnboardingScene
  category: string
  title: string
  subtitle: string
  imageLabel: string
}

export function FeatureStep({
  slide,
  current,
  total,
  onSkip,
  onBack,
  onNext,
}: {
  slide: FeatureSlide
  current: number
  total: number
  onSkip: () => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <View style={onboardingStyles.fullStage}>
      <View style={onboardingStyles.topRow}>
        <TextButton label="Skip" onPress={onSkip} />
      </View>

      <View style={onboardingStyles.centeredStage}>
        <View style={styles.featureCard}>
          <OnboardingIllustration
            variant={slide.scene}
            accessibilityLabel={slide.imageLabel}
          />

          <View style={styles.featureCopy}>
            <AppText
              variant="caption"
              tone="teal"
              weight="600"
              align="center"
              style={styles.featureCategory}
            >
              {slide.category}
            </AppText>
            <AppText
              variant="heroTitle"
              align="center"
              accessibilityRole="header"
              style={styles.featureTitle}
            >
              {slide.title}
            </AppText>
            <AppText tone="soft" align="center" style={styles.featureSubtitle}>
              {slide.subtitle}
            </AppText>
          </View>
        </View>
      </View>

      <StageFooter current={current} total={total}>
        <Button label="Back" variant="secondary" onPress={onBack} />
        <Button label="Next" onPress={onNext} />
      </StageFooter>
    </View>
  )
}

const styles = StyleSheet.create({
  featureCard: {
    width: '100%',
    maxWidth: 356,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCopy: {
    alignItems: 'center',
    marginTop: space[6],
    maxWidth: 320,
  },
  featureCategory: {
    letterSpacing: 0.4,
  },
  featureTitle: {
    marginTop: space[1],
  },
  featureSubtitle: {
    marginTop: space[2],
    maxWidth: 300,
  },
})
