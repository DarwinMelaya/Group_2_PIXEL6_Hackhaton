import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui/AppText'
import { Icon } from '@/components/ui/Icon'
import { space } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

/** Layout styles shared by the onboarding step screens. */
export const onboardingStyles = StyleSheet.create({
  fullStage: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  topRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  centeredStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: space[4],
  },
  bottomFooter: {
    width: '100%',
    maxWidth: 356,
    alignSelf: 'center',
    alignItems: 'center',
    gap: space[5],
    paddingTop: space[3],
  },
  bottomActions: {
    width: '100%',
    flexDirection: 'row',
    gap: space[3],
  },
  detailsStage: {
    flex: 1,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  detailsFooter: {
    marginTop: space[6],
    gap: space[4],
  },
  actions: {
    flexDirection: 'row',
    gap: space[3],
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[1],
  },
})

export function StepDots({ current, total }: { current: number; total: number }) {
  const { colors } = useTheme()
  return (
    <View style={styles.dots} accessible accessibilityLabel={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }, (_, index) => {
        const active = index === current
        const completed = index < current
        return (
          <View
            key={index}
            style={[
              styles.dot,
              active && styles.dotActive,
              {
                backgroundColor: active || completed ? colors.teal : colors.line,
                opacity: completed ? 0.45 : 1,
              },
            ]}
          />
        )
      })}
    </View>
  )
}

/** Footer with step dots and action buttons; `variant` selects the layout used by each stage. */
export function StageFooter({
  current,
  total,
  variant = 'centered',
  showPrivacy = false,
  children,
}: {
  current: number
  total: number
  variant?: 'centered' | 'details'
  showPrivacy?: boolean
  children: ReactNode
}) {
  const { colors } = useTheme()
  const details = variant === 'details'
  return (
    <View style={details ? onboardingStyles.detailsFooter : onboardingStyles.bottomFooter}>
      <StepDots current={current} total={total} />
      <View style={details ? onboardingStyles.actions : onboardingStyles.bottomActions}>
        {children}
      </View>
      {showPrivacy && (
        <View style={onboardingStyles.privacyRow}>
          <Icon name="shield" size={14} color={colors.inkSoft} />
          <AppText variant="small" tone="soft">
            Stored only on this device
          </AppText>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 22,
  },
})
