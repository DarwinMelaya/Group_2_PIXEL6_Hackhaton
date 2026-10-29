import { Stack } from 'expo-router'
import { SQLiteProvider } from 'expo-sqlite'
import { StatusBar } from 'expo-status-bar'
import { Suspense } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/migrations'
import { SettingsProvider } from '@/providers/SettingsProvider'
import { palette } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Suspense fallback={<BootScreen />}>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded} useSuspense>
          <SettingsProvider fallback={<BootScreen />}>
            <AppNavigator />
          </SettingsProvider>
        </SQLiteProvider>
      </Suspense>
    </SafeAreaProvider>
  )
}

function AppNavigator() {
  const { colors, scheme } = useTheme()
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="guide/[id]"
          options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.75, 1], contentStyle: { backgroundColor: colors.surface } }}
        />
        <Stack.Screen name="emergency" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="profile/[group]" />
      </Stack>
    </>
  )
}

function BootScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.light.background }}>
      <ActivityIndicator color={palette.light.teal} />
    </View>
  )
}
