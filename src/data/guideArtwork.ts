import type { ImageSourcePropType } from 'react-native'

export type GuideArtwork = { source: ImageSourcePropType; caption: string }

/** Static requires keep all safety illustrations available offline on every platform. */
const artwork: Record<string, GuideArtwork> = {
  'sprains-strains': { source: require('../../assets/guides/sprains-strains.webp'), caption: "Rest the injured ankle, elevate it, and use a cloth-wrapped cold pack." },
  'cpr-cardiac-arrest': { source: require('../../assets/guides/cpr-cardiac-arrest.webp'), caption: "For an unresponsive adult not breathing normally, call 911 and begin CPR." },
  'drowning': { source: require('../../assets/guides/drowning.webp'), caption: "Call for help and throw flotation from a safe place; do not enter dangerous water." },
  'typhoon-before': { source: require('../../assets/guides/typhoon-before.webp'), caption: "Pack water, food, medicine, a flashlight, and protected documents." },
  'typhoon-during': { source: require('../../assets/guides/typhoon-during-v2.webp'), caption: "Stay inside a sturdy home, away from windows." },
  'typhoon-after': { source: require('../../assets/guides/typhoon-after.webp'), caption: "Keep clear of fallen power lines and wait for authorized responders." },
  'flood-before': { source: require('../../assets/guides/flood-before.webp'), caption: "Store documents and electrical items above possible flood levels." },
  'flood-during': { source: require('../../assets/guides/flood-during.webp'), caption: "Move uphill on a dry route; never cross floodwater." },
  'flood-after': { source: require('../../assets/guides/flood-after.webp'), caption: "Wait on safe, dry ground until authorities allow you to return." },
  'landslide-before': { source: require('../../assets/guides/landslide-before.webp'), caption: "Check hazard maps and watch for warning signs from a safe location." },
  'landslide-during': { source: require('../../assets/guides/landslide-during.webp'), caption: "Move away from the slide path toward stable ground." },
  'landslide-after': { source: require('../../assets/guides/landslide-after.webp'), caption: "Stay behind safety barriers and alert rescuers to hazards." },
  'earthquake-before': { source: require('../../assets/guides/earthquake-before.webp'), caption: "Anchor heavy furniture and store heavy objects on lower shelves." },
  'earthquake-during': { source: require('../../assets/guides/earthquake-during.webp'), caption: "Drop under a sturdy table, cover your head and neck, and hold on." },
  'earthquake-after': { source: require('../../assets/guides/earthquake-after.webp'), caption: "After shaking stops, gather in a safe open area away from hazards." },
  'fire-before': { source: require('../../assets/guides/fire-before.webp'), caption: "Test smoke alarms and keep escape routes clear." },
  'fire-during': { source: require('../../assets/guides/fire-during.webp'), caption: "Crawl low beneath smoke toward a safe exit." },
  'fire-after': { source: require('../../assets/guides/fire-after.webp'), caption: "Stay outside until firefighters say it is safe to return." },
  'bleeding': { source: require('../../assets/guides/bleeding.webp'), caption: "Press a clean cloth firmly and directly over the wound." },
  'burns': { source: require('../../assets/guides/burns.webp'), caption: "Cool the affected skin under cool running water for 20 minutes." },
  'fractures': { source: require('../../assets/guides/fractures.webp'), caption: "Keep the injured arm still and support it in a comfortable position." },
}

export function getGuideArtwork(guideId: string, phase: string): GuideArtwork | undefined {
  return artwork[`${guideId}-${phase.toLowerCase()}`] ?? artwork[guideId]
}

