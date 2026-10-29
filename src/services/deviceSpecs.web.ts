export type DeviceSpecs = {
  device: string | null
  memoryGb: number | null
  freeGb: number | null
  os: string
  cpu: string | null
  yearClass: number | null
  physical: boolean
}

export const OFFLINE_AI_MIN_RAM_GB = 4
export const OFFLINE_AI_RECOMMENDED_RAM_GB = 6
export const OFFLINE_AI_MIN_FREE_GB = 3.5

export function getDeviceSpecs(): DeviceSpecs {
  return { device: null, memoryGb: null, freeGb: null, os: 'Web', cpu: null, yearClass: null, physical: false }
}

export type LocalAiLevel = 'ready' | 'limited' | 'insufficient' | 'unknown'

export function localAiCapability(): { level: LocalAiLevel; title: string; message: string } {
  return { level: 'unknown', title: 'Not available on web', message: 'On-device AI needs the iOS or Android app.' }
}
