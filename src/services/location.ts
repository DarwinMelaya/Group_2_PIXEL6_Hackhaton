import * as Location from 'expo-location'

import { BARANGAY_CENTROIDS, type BarangayCentroid } from '@/data/barangayCentroids'

/** Farther than this and the user is off Marinduque — no local hotlines apply. */
const MAX_MATCH_DISTANCE_KM = 12
const LAST_KNOWN_MAX_AGE_MS = 10 * 60 * 1000

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = Math.PI / 180
  const dLat = (bLat - aLat) * rad
  const dLng = (bLng - aLng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

/** Nearest barangay centroid to the given coordinates, or null when off the island (> 12 km away). */
export function nearestBarangay(lat: number, lng: number): BarangayCentroid | null {
  let best: BarangayCentroid | null = null
  let bestDistance = MAX_MATCH_DISTANCE_KM
  for (const centroid of BARANGAY_CENTROIDS) {
    const distance = distanceKm(lat, lng, centroid.lat, centroid.lng)
    if (distance < bestDistance) {
      best = centroid
      bestDistance = distance
    }
  }
  return best
}

/**
 * Barangay the device is currently in, or null when permission is denied,
 * location services are off, or the position is outside Marinduque.
 * Never throws — the emergency screen must keep working without GPS.
 */
export async function getCurrentBarangay(): Promise<BarangayCentroid | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== Location.PermissionStatus.GRANTED) return null
    let position = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }).catch(() => null)
    if (!position) {
      position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    }
    if (!position) return null
    return nearestBarangay(position.coords.latitude, position.coords.longitude)
  } catch {
    return null
  }
}
