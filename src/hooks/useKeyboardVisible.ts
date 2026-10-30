import { useEffect, useState } from 'react'
import { Keyboard, Platform } from 'react-native'

/** Custom navigation chrome must hide itself when the keyboard is open. */
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(() => Keyboard.isVisible())

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setVisible(true))
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setVisible(false))
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  return visible
}
