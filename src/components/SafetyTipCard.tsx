import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { AppState, StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui/AppText'
import { Icon } from '@/components/ui/Icon'
import { safetyTips } from '@/data/safetyTips'
import { radius, space } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

const TIP_INTERVAL_MS = 3000

export function SafetyTipCard() {
  const { colors } = useTheme()
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * safetyTips.length))
  const tip = safetyTips[tipIndex]

  useFocusEffect(useCallback(() => {
    let timer: ReturnType<typeof setInterval> | undefined

    const updateTimer = (isActive: boolean) => {
      clearInterval(timer)
      if (!isActive) return

      timer = setInterval(() => {
        // A nonzero random offset guarantees a different tip on each tick.
        setTipIndex((current) => (current + 1 + Math.floor(Math.random() * (safetyTips.length - 1))) % safetyTips.length)
      }, TIP_INTERVAL_MS)
    }

    updateTimer(AppState.currentState === 'active')
    const subscription = AppState.addEventListener('change', (state) => updateTimer(state === 'active'))
    return () => {
      clearInterval(timer)
      subscription.remove()
    }
  }, []))

  return (
    <View style={[styles.card, { backgroundColor: colors.tipBackground }]}>
      <View style={[styles.icon, { backgroundColor: colors.tealSoft }]}>
        <Icon name="shield" size={23} color={colors.teal} />
      </View>
      <View style={styles.text}>
        <AppText variant="bodyStrong">{tip.title}</AppText>
        <AppText variant="caption" style={[styles.copy, { color: colors.tipText }]}>{tip.body}</AppText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3], padding: space[4], borderRadius: radius.group },
  icon: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  copy: { marginTop: space[1] },
})
