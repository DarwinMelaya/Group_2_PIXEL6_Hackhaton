import { router, useFocusEffect } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { FAB_CLEARANCE } from '@/components/EmergencyFab'
import { AppText } from '@/components/ui/AppText'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { Icon } from '@/components/ui/Icon'
import { Note, PageHeader } from '@/components/ui/Layout'
import { ListRow } from '@/components/ui/ListRow'
import { Screen } from '@/components/ui/Screen'
import { profileGroups, type ProfileInfo } from '@/data/profile'
import { getProfile } from '@/db/profile'
import { space } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

export default function ProfileScreen() {
  const db = useSQLiteContext()
  const { colors, scale } = useTheme()
  const [profile, setProfile] = useState<ProfileInfo>({})

  useFocusEffect(useCallback(() => {
    getProfile(db).then(setProfile).catch(() => setProfile({}))
  }, [db]))

  const initials = profile.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
  const location = [profile.barangay, profile.municipality].filter(Boolean).join(', ')

  return (
    <Screen bottomSpace={FAB_CLEARANCE}>
      <PageHeader title="Profile" />
      <View style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: colors.tealSoft }]}>
          {initials ? <AppText weight="600" tone="teal" style={{ fontSize: 26 * scale, lineHeight: 32 * scale }}>{initials}</AppText> : <Icon name="profile" size={32} color={colors.teal} />}
        </View>
        <AppText variant="headline" align="center">{profile.name || 'Your profile'}</AppText>
        <AppText variant="caption" tone="soft" align="center">{location || 'Essential information. All in one place.'}</AppText>
        <View style={styles.badge}>
          <Icon name="shield" size={13} color={colors.inkSoft} />
          <AppText variant="small" tone="soft">No account required</AppText>
        </View>
      </View>
      <GroupedCard style={styles.menu}>
        {profileGroups.map((group) => (
          <ListRow key={group.id} title={group.title} leading={group.icon} onPress={() => router.push({ pathname: '/profile/[group]', params: { group: group.id } })} />
        ))}
      </GroupedCard>
      <Note>Stored only on this device in a local database. Nothing is uploaded. You can export a backup from Settings.</Note>
    </Screen>
  )
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', paddingBottom: space[3], gap: space[1] },
  avatar: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: space[2] },
  badge: { flexDirection: 'row', alignItems: 'center', gap: space[1], marginTop: space[2] },
  menu: { marginTop: space[6] },
})
