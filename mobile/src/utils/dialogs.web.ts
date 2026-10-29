type ConfirmOptions = { title: string; message: string; confirmLabel: string; destructive?: boolean }

/** Web implementation of `dialogs.ts`. React Native Web's `Alert` is a no-op, so use browser dialogs. */
export async function confirmAction({ title, message }: ConfirmOptions): Promise<boolean> {
  return window.confirm(`${title}\n\n${message}`)
}

export function showAlert(title: string, message: string) {
  window.alert(`${title}\n\n${message}`)
}
