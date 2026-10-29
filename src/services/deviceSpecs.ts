import * as Device from 'expo-device'
import { Paths } from 'expo-file-system'
import { Platform } from 'react-native'

export type DeviceSpecs = {
  /** Human-friendly device name, e.g. "Pixel 8". */
  device: string | null
  /** Total RAM in GB, rounded to one decimal. */
  memoryGb: number | null
  /** Free disk space in GB, rounded to one decimal. */
  freeGb: number | null
  /** e.g. "Android 14" or "iOS 17.4". */
  os: string
  /** Primary CPU architecture, e.g. "arm64-v8a". */
  cpu: string | null
  /** Facebook device-year-class estimate of the hardware generation. */
  yearClass: number | null
  /** False when running in a simulator/emulator. */
  physical: boolean
}

export const OFFLINE_AI_MIN_RAM_GB = 4
export const OFFLINE_AI_RECOMMENDED_RAM_GB = 6
export const OFFLINE_AI_MIN_FREE_GB = 3.5

const gb = (bytes: number) => Math.round((bytes / 1e9) * 10) / 10

export function getDeviceSpecs(): DeviceSpecs {
  return {
    device: Device.modelName ?? Device.deviceName,
    memoryGb: Device.totalMemory ? gb(Device.totalMemory) : null,
    freeGb: gb(Paths.availableDiskSpace),
    os: `${Platform.OS === 'ios' ? 'iOS' : 'Android'} ${Device.osVersion ?? ''}`.trim(),
    cpu: Device.supportedCpuArchitectures?.[0] ?? null,
    yearClass: Device.deviceYearClass,
    physical: Device.isDevice,
  }
}

export type LocalAiLevel = 'ready' | 'limited' | 'insufficient' | 'unknown'

export function localAiCapability(specs: DeviceSpecs): { level: LocalAiLevel; title: string; message: string } {
  if (!specs.physical) {
    return { level: 'limited', title: 'Emulator detected', message: 'On-device AI can run here but will be much slower than on a real phone.' }
  }
  if (specs.freeGb !== null && specs.freeGb < OFFLINE_AI_MIN_FREE_GB) {
    return { level: 'insufficient', title: 'Not enough free storage', message: `Only ${specs.freeGb} GB free. GabAI needs about ${OFFLINE_AI_MIN_FREE_GB} GB to download and run the model.` }
  }
  if (specs.memoryGb === null) {
    return { level: 'unknown', title: 'Memory unknown', message: `Could not read this device's RAM. ${OFFLINE_AI_RECOMMENDED_RAM_GB} GB or more is recommended.` }
  }
  if (specs.memoryGb < OFFLINE_AI_MIN_RAM_GB) {
    return { level: 'insufficient', title: 'Not enough memory', message: `This device has ${specs.memoryGb} GB RAM. At least ${OFFLINE_AI_MIN_RAM_GB} GB is needed; replies may fail or be very slow.` }
  }
  if (specs.memoryGb < OFFLINE_AI_RECOMMENDED_RAM_GB) {
    return { level: 'limited', title: 'Should work, slowly', message: `This device has ${specs.memoryGb} GB RAM. ${OFFLINE_AI_RECOMMENDED_RAM_GB} GB or more is recommended for smooth replies.` }
  }
  return { level: 'ready', title: 'Ready for offline AI', message: `${specs.memoryGb} GB RAM meets the recommendation. Replies stay on this device.` }
}
