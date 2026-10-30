import { StyleSheet, Text, View } from 'react-native'

import {
  AVATAR_PALETTES,
  ILLUSTRATED_AVATAR_META,
  IllustratedAvatarSvg,
  type TonePalette,
} from '@/components/AvatarArt'
import { AppText } from '@/components/ui/AppText'
import { Icon } from '@/components/ui/Icon'
import { Touchable } from '@/components/ui/Touchable'
import { AVATAR_PRESETS, AVATAR_TONES, type AvatarPreset, type AvatarTone } from '@/db/settings'
import { radius, space, touchTarget } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

/** "Avatar" section: randomize button plus the 2x5 preset grid. */
export function AvatarPresetSection({
  preset,
  hasPhoto,
  initials,
  tilePalette,
  onRandomize,
  onSelectPreset,
}: {
  preset: AvatarPreset
  hasPhoto: boolean
  initials: string
  tilePalette: TonePalette
  onRandomize: () => void
  onSelectPreset: (preset: AvatarPreset) => void
}) {
  const { colors } = useTheme()

  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionRow}>
        <AppText variant="small" tone="soft" weight="600">
          Avatar
        </AppText>
        <Touchable
          onPress={onRandomize}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Pick a random avatar and color"
          style={styles.randomizeBtn}
        >
          <Icon name="shuffle" size={13} color={colors.teal} />
          <AppText variant="small" tone="teal" weight="600">
            Randomize
          </AppText>
        </Touchable>
      </View>

      <View
        style={[styles.presetGridCard, { backgroundColor: colors.surface }]}
        accessibilityRole="radiogroup"
        accessibilityLabel="Avatar style"
      >
        {AVATAR_PRESETS.map((item) => {
          const selected = !hasPhoto && preset === item
          const label =
            item === 'auto'
              ? 'Auto'
              : item === 'initials'
                ? 'Initials'
                : ILLUSTRATED_AVATAR_META[item].label

          return (
            <Touchable
              key={item}
              onPress={() => onSelectPreset(item)}
              pressedScale={0.93}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={
                item === 'auto'
                  ? 'Auto-changing random avatar'
                  : item === 'initials'
                    ? 'Initials monogram avatar'
                    : `${ILLUSTRATED_AVATAR_META[item].label} avatar`
              }
              style={styles.presetTile}
            >
              <View
                style={[
                  styles.presetRing,
                  { borderColor: selected ? colors.teal : 'transparent' },
                ]}
              >
                <View
                  style={[
                    styles.presetCircle,
                    {
                      backgroundColor:
                        item === 'auto' ? colors.tealSoft : tilePalette.bg,
                      borderColor: selected ? colors.teal : tilePalette.ring,
                    },
                  ]}
                >
                  {item === 'auto' ? (
                    <Icon name="shuffle" size={19} color={colors.teal} />
                  ) : item === 'initials' ? (
                    <Text
                      allowFontScaling={false}
                      style={[styles.tileMonogram, { color: tilePalette.fg }]}
                    >
                      {initials || 'Aa'}
                    </Text>
                  ) : (
                    <IllustratedAvatarSvg
                      variant={item}
                      palette={tilePalette}
                      size={44}
                    />
                  )}
                </View>
              </View>
              <AppText
                variant="tab"
                tone={selected ? 'teal' : 'soft'}
                weight={selected ? '700' : '500'}
                numberOfLines={1}
              >
                {label}
              </AppText>
            </Touchable>
          )
        })}
      </View>
    </View>
  )
}

/** "Color" section: the adaptive tone swatches. */
export function AvatarToneSection({
  activeTone,
  onSelectTone,
}: {
  activeTone: AvatarTone
  onSelectTone: (tone: AvatarTone) => void
}) {
  const { colors, scheme } = useTheme()

  return (
    <View style={styles.sectionBlock}>
      <AppText variant="small" tone="soft" weight="600" style={styles.sectionLabel}>
        Color
      </AppText>
      <View
        style={[styles.swatchCard, { backgroundColor: colors.surface }]}
        accessibilityRole="radiogroup"
        accessibilityLabel="Avatar color"
      >
        {AVATAR_TONES.map((item) => {
          const selected = item === activeTone
          const itemPalette = AVATAR_PALETTES[item][scheme]
          return (
            <Touchable
              key={item}
              onPress={() => onSelectTone(item)}
              pressedScale={0.92}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${AVATAR_PALETTES[item].label} color`}
              style={styles.swatchTouch}
            >
              <View
                style={[
                  styles.swatchOuter,
                  { borderColor: selected ? itemPalette.swatch : 'transparent' },
                ]}
              >
                <View style={[styles.swatchDot, { backgroundColor: itemPalette.swatch }]}>
                  {selected && (
                    <Icon
                      name="check"
                      size={14}
                      color={scheme === 'dark' ? '#000000' : '#ffffff'}
                    />
                  )}
                </View>
              </View>
            </Touchable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  sectionBlock: {
    gap: space[2],
  },
  sectionLabel: {
    marginHorizontal: space[1],
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: space[1],
  },
  randomizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  presetGridCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: space[3],
    paddingHorizontal: space[3],
    paddingVertical: space[3],
    borderRadius: radius.group,
  },
  presetTile: {
    width: '18.8%',
    alignItems: 'center',
    gap: 5,
  },
  presetRing: {
    padding: 2,
    borderRadius: 28,
    borderWidth: 2,
  },
  presetCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileMonogram: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  swatchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: space[1],
    paddingHorizontal: space[2],
    borderRadius: radius.group,
  },
  swatchTouch: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
