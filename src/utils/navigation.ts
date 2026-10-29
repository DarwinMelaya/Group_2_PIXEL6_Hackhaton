import { router, type Href } from 'expo-router'

/** `router.back()` dispatches GO_BACK, which throws when there is no history (web reload, deep link). */
export function goBack(fallback: Href = '/') {
  if (router.canGoBack()) router.back()
  else router.replace(fallback)
}
