import { Alert } from 'react-native'

type ConfirmOptions = { title: string; message: string; confirmLabel: string; destructive?: boolean }

/** Resolves `true` if the user confirms. Native implementation; see `dialogs.web.ts` for web. */
export function confirmAction({ title, message, confirmLabel, destructive }: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    )
  })
}

export function showAlert(title: string, message: string) {
  Alert.alert(title, message)
}
