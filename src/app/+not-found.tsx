import { router } from 'expo-router'

import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/Layout'
import { Screen } from '@/components/ui/Screen'

export default function NotFoundScreen() {
  return (
    <Screen topInset>
      <PageHeader title="Page not found" subtitle="This screen doesn't exist." />
      <Button label="Go to Home" onPress={() => router.replace('/')} style={{ flex: 0 }} />
    </Screen>
  )
}
