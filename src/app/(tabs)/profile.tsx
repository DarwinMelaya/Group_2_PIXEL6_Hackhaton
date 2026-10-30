import { router, useFocusEffect } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { FAB_CLEARANCE } from '@/components/EmergencyFab'
import { ProfileAvatarPicker } from '@/components/ProfileAvatarPicker'
import { AppText } from '@/components/ui/AppText'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { Banner, Note, PageHeader, TextButton } from '@/components/ui/Layout'
import { ListRow } from '@/components/ui/ListRow'
import { Screen } from '@/components/ui/Screen'
import { profileGroups, type ProfileInfo } from '@/data/profile'
import { getProfile } from '@/db/profile'
import { NICKNAME_MAX_LENGTH, type AvatarPreset, type AvatarTone } from '@/db/settings'
import { useSettings } from '@/providers/SettingsProvider'
import { deletePhotoFile, persistPhoto, resolvePhotoUri } from '@/storage/photos'
import { space } from '@/theme/tokens'

export default function ProfileScreen() {
  const db = useSQLiteContext()
  const { settings, updateSettings } = useSettings()
  const [profile, setProfile] = useState<ProfileInfo>({})
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [error, setError] = useState('')

  useFocusEffect(
    useCallback(() => {
      getProfile(db)
        .then(setProfile)
        .catch(() => setProfile({}))
    }, [db]),
  )

  const fullName = profile.name?.trim() ?? ''
  const nickname = settings.nickname.trim()
  const displayName = fullName || nickname
  const hasDistinctNickname = Boolean(
    fullName && nickname && fullName.toLowerCase() !== nickname.toLowerCase(),
  )
  const photoUri = settings.avatarPhoto ? resolvePhotoUri(settings.avatarPhoto) : ''
  const location = [profile.barangay, profile.municipality].filter(Boolean).join(', ')
  const subtitle = [
    hasDistinctNickname ? nickname : '',
    location || (!hasDistinctNickname ? 'Stored only on this device' : ''),
  ]
    .filter(Boolean)
    .join(' · ')

  const handlePickPhoto = async (sourceUri: string) => {
    setError('')
    try {
      const previous = settings.avatarPhoto
      const fileName = await persistPhoto(sourceUri)
      await updateSettings({ avatarPhoto: fileName })
      if (previous && previous !== fileName) {
        deletePhotoFile(previous)
      }
    } catch {
      setError('Unable to save profile photo. Please try again.')
    }
  }

  const handleRemovePhoto = async () => {
    setError('')
    try {
      const previous = settings.avatarPhoto
      await updateSettings({ avatarPhoto: '' })
      if (previous) {
        deletePhotoFile(previous)
      }
    } catch {
      setError('Unable to remove profile photo. Please try again.')
    }
  }

  const handleSelectTone = (avatarTone: AvatarTone) => {
    setError('')
    updateSettings({ avatarTone }).catch(() => setError('Unable to update profile style.'))
  }

  const handleSelectPreset = async (avatarPreset: AvatarPreset) => {
    setError('')
    try {
      const previous = settings.avatarPhoto
      await updateSettings({
        avatarPreset,
        ...(previous ? { avatarPhoto: '' } : {}),
      })
      if (previous) {
        deletePhotoFile(previous)
      }
    } catch {
      setError('Unable to update profile avatar.')
    }
  }

  const handleSaveNickname = async (nextNickname: string) => {
    setError('')
    const trimmed = nextNickname.trim().slice(0, NICKNAME_MAX_LENGTH)
    if (!trimmed) return
    await updateSettings({ nickname: trimmed })
  }

  return (
    <Screen bottomSpace={FAB_CLEARANCE}>
      <PageHeader
        title="Profile"
        action={<TextButton label="Edit" onPress={() => setCustomizeOpen(true)} />}
      />

      <View style={styles.identity}>
        <View style={styles.avatarWrap}>
          <ProfileAvatarPicker
            name={displayName}
            photoUri={photoUri}
            tone={settings.avatarTone}
            preset={settings.avatarPreset}
            size={92}
            open={customizeOpen}
            onOpenChange={setCustomizeOpen}
            nickname={settings.nickname}
            onChangeNickname={handleSaveNickname}
            onPickPhoto={handlePickPhoto}
            onRemovePhoto={handleRemovePhoto}
            onSelectTone={handleSelectTone}
            onSelectPreset={handleSelectPreset}
          />
        </View>

        <AppText variant="headline" align="center">
          {displayName || 'Your profile'}
        </AppText>

        {subtitle ? (
          <AppText variant="caption" tone="soft" align="center">
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {error ? <Banner text={error} tone="error" /> : null}

      <GroupedCard style={styles.menu}>
        {profileGroups.map((group) => (
          <ListRow
            key={group.id}
            title={group.title}
            leading={group.icon}
            onPress={() =>
              router.push({ pathname: '/profile/[group]', params: { group: group.id } })
            }
          />
        ))}
      </GroupedCard>

      <Note>
        Stored only on this device in a local database. Nothing is uploaded. You can export a backup
        from Settings.
      </Note>
    </Screen>
  )
}

const styles = StyleSheet.create({
  identity: {
    alignItems: 'center',
    paddingVertical: space[2],
    gap: space[1],
  },
  avatarWrap: {
    marginBottom: space[2],
  },
  menu: {
    marginTop: space[6],
  },
})
