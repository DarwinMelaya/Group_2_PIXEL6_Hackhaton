import * as Location from 'expo-location'

import { BARANGAY_CENTROIDS, type BarangayCentroid } from '@/data/barangayCentroids'

/**
 * Dev-only coordinate override, for testing the local-hotline flow from off the island.
 * Set to e.g. `{ latitude: 13.4463, longitude: 121.84 }` (Boac town) while developing.
 * Ignored in release builds, so it can never ship.
 */
const DEV_COORDS: { latitude: number; longitude: number } | null = null

/** Farther than this and the user is off Marinduque — no local hotlines apply. */
const MAX_MATCH_DISTANCE_KM = 12
const LAST_KNOWN_MAX_AGE_MS = 10 * 60 * 1000
/** `getCurrentPositionAsync` has no timeout of its own and can hang indoors. */
const POSITION_TIMEOUT_MS = 12 * 1000

/**
 * Why a barangay lookup produced no match. The emergency screen shows a different
 * message for each — "off island" with a valid fix is not the same as "GPS is off".
 */
export type BarangayLookup =
  | { status: 'ok'; barangay: BarangayCentroid; distanceKm: number }
  | { status: 'off-island'; distanceKm: number }
  | { status: 'denied' | 'services-off' | 'timeout' | 'unavailable' }

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = Math.PI / 180
  const dLat = (bLat - aLat) * rad
  const dLng = (bLng - aLng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

/** Closest barangay centroid at any distance, so callers can tell how far off the island a fix is. */
function nearestCentroid(lat: number, lng: number): { centroid: BarangayCentroid; km: number } | null {
  let best: { centroid: BarangayCentroid; km: number } | null = null
  for (const centroid of BARANGAY_CENTROIDS) {
    const km = distanceKm(lat, lng, centroid.lat, centroid.lng)
    if (!best || km < best.km) best = { centroid, km }
  }
  return best
}

/** Nearest barangay centroid to the given coordinates, or null when off the island (> 12 km away). */
export function nearestBarangay(lat: number, lng: number): BarangayCentroid | null {
  const best = nearestCentroid(lat, lng)
  return best && best.km < MAX_MATCH_DISTANCE_KM ? best.centroid : null
}

/** Matches raw coordinates against the barangay centroids, keeping the distance for the caller. */
function resolve(latitude: number, longitude: number): BarangayLookup {
  const best = nearestCentroid(latitude, longitude)
  if (__DEV__) console.log('[location] fix', { latitude, longitude, nearest: best?.centroid.barangay, km: best?.km.toFixed(1) })
  if (!best) return { status: 'unavailable' }
  return best.km < MAX_MATCH_DISTANCE_KM
    ? { status: 'ok', barangay: best.centroid, distanceKm: best.km }
    : { status: 'off-island', distanceKm: best.km }
}

/** Resolves `'timeout'` instead of hanging, and `null` when the platform rejects the request. */
async function requestPosition(): Promise<Location.LocationObject | 'timeout' | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, mayShowUserSettingsDialog: true }),
      new Promise<'timeout'>((resolve) => { timer = setTimeout(() => resolve('timeout'), POSITION_TIMEOUT_MS) }),
    ])
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Barangay the device is currently in, with the reason when there is no match.
 * Never throws — the emergency screen must keep working without GPS.
 */
export async function getCurrentBarangay(): Promise<BarangayLookup> {
  try {
    if (__DEV__ && DEV_COORDS) {
      console.log('[location] using DEV_COORDS override', DEV_COORDS)
      return resolve(DEV_COORDS.latitude, DEV_COORDS.longitude)
    }
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (__DEV__) console.log('[location] permission', status)
    if (status !== Location.PermissionStatus.GRANTED) return { status: 'denied' }
    // Not every platform implements this (web throws); assume enabled and let the fix fail instead.
    const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => true)
    if (!servicesEnabled) return { status: 'services-off' }

    let position = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }).catch(() => null)
    let timedOut = false
    if (!position) {
      const fix = await requestPosition()
      timedOut = fix === 'timeout'
      position = fix === 'timeout' ? null : fix
      // A stale fix of any age still pins the right barangay far more often than nothing.
      position ??= await Location.getLastKnownPositionAsync().catch(() => null)
    }
    if (!position) return { status: timedOut ? 'timeout' : 'unavailable' }

    return resolve(position.coords.latitude, position.coords.longitude)
  } catch (error) {
    if (__DEV__) console.log('[location] failed', error)
    return { status: 'unavailable' }
  }
}
