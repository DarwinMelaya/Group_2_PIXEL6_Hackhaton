import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import {
  onboardingStyles,
  StageFooter,
} from '@/components/onboarding/OnboardingChrome'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { TextButton } from '@/components/ui/Layout'
import { space } from '@/theme/tokens'

/** Shared scaffold for the skippable profile-details stages (personal, health). */
export function DetailsStep({
  title,
  current,
  total,
  onSkip,
  onBack,
  action,
  children,
}: {
  title: string
  current: number
  total: number
  onSkip: () => void
  onBack: () => void
  /** Trailing footer action (Next / Finish). */
  action: ReactNode
  children: ReactNode
}) {
  return (
    <View style={onboardingStyles.detailsStage}>
      <View>
        <View style={onboardingStyles.topRow}>
          <TextButton label="Skip" onPress={onSkip} />
        </View>

        <View style={styles.detailsTitleWrap}>
          <AppText variant="heroTitle" align="center" accessibilityRole="header">
            {title}
          </AppText>
        </View>

        {children}
      </View>

      <StageFooter current={current} total={total} variant="details" showPrivacy>
        <Button label="Back" variant="secondary" onPress={onBack} />
        {action}
      </StageFooter>
    </View>
  )
}

const styles = StyleSheet.create({
  detailsTitleWrap: {
    alignItems: 'center',
    marginTop: space[3],
    marginBottom: space[6],
  },
})
