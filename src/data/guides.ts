import type { IconName } from '@/components/ui/Icon'
import type { Tone } from '@/theme/tokens'

export type GuideKind = 'disaster' | 'aid'

export type GuidePhase = { label: string; steps: string[] }

export type Guide = {
  id: string
  kind: GuideKind
  name: string
  detail: string
  icon: IconName
  tone: Tone
  /** English and Filipino terms used for search and offline assistant retrieval. */
  keywords: string[]
  phases: GuidePhase[]
}

export const guides: Guide[] = [
  {
    id: 'typhoon',
    kind: 'disaster',
    name: 'Typhoon',
    detail: 'Strong winds and heavy rain',
    icon: 'storm',
    tone: 'sky',
    keywords: ['typhoon', 'bagyo', 'storm', 'wind', 'hangin', 'signal'],
    phases: [
      { label: 'Before', steps: ['Monitor PAGASA bulletins and local advisories.', 'Secure loose objects, reinforce windows, and trim weak branches.', 'Prepare a go-bag with water, food, medicine, a flashlight, and documents.'] },
      { label: 'During', steps: ['Stay indoors, away from windows and glass doors.', 'Evacuate immediately if authorities order it or your home is unsafe.', 'Unplug appliances and stay off wired phones during lightning.'] },
      { label: 'After', steps: ['Wait for the all-clear before going outside.', 'Stay away from fallen power lines and damaged structures.', 'Boil or treat drinking water until the supply is declared safe.'] },
    ],
  },
  {
    id: 'flood',
    kind: 'disaster',
    name: 'Flood',
    detail: 'Rising water and flash floods',
    icon: 'flood',
    tone: 'blue',
    keywords: ['flood', 'baha', 'water', 'tubig', 'flash flood'],
    phases: [
      { label: 'Before', steps: ['Know your evacuation route and the nearest evacuation center.', 'Move valuables, documents, and electrical items to higher places.', 'Prepare a go-bag and keep your phone charged.'] },
      { label: 'During', steps: ['Move to higher ground as soon as water starts rising.', 'Do not walk or drive through floodwater; fast-moving water can knock you down.', 'Turn off electricity at the main switch only if it is safe to do so.'] },
      { label: 'After', steps: ['Return home only when authorities say it is safe.', 'Avoid floodwater; it may be contaminated or electrically charged.', 'Seek care for fever or muscle pain after wading, as these can be signs of leptospirosis.'] },
    ],
  },
  {
    id: 'landslide',
    kind: 'disaster',
    name: 'Landslide',
    detail: 'Sliding soil and debris',
    icon: 'landslide',
    tone: 'amber',
    keywords: ['landslide', 'guho', 'pagguho', 'mudslide', 'slope'],
    phases: [
      { label: 'Before', steps: ['Find out whether your area is landslide-prone from local hazard maps.', 'Watch for ground cracks, tilting trees, or sudden changes in creek water.', 'Plan an evacuation route away from slopes.'] },
      { label: 'During', steps: ['Evacuate immediately when you hear rumbling or see moving debris.', 'Move away from the path of the slide toward stable ground.', 'If escape is impossible, curl into a tight ball and protect your head.'] },
      { label: 'After', steps: ['Stay away from the slide area; more slides may follow.', 'Look for injured or trapped people from a safe distance and alert rescuers.', 'Report broken utility lines and damaged roads to authorities.'] },
    ],
  },
  {
    id: 'earthquake',
    kind: 'disaster',
    name: 'Earthquake',
    detail: 'Ground shaking and aftershocks',
    icon: 'quake',
    tone: 'violet',
    keywords: ['earthquake', 'lindol', 'quake', 'aftershock', 'tsunami'],
    phases: [
      { label: 'Before', steps: ['Secure heavy furniture and appliances to walls.', 'Identify safe spots under sturdy tables, away from windows.', 'Join earthquake drills and agree on a family meeting place.'] },
      { label: 'During', steps: ['Drop, Cover, and Hold On until the shaking stops.', 'Stay away from windows, shelves, and hanging objects.', 'If outdoors, move to an open area away from buildings, trees, and power lines.'] },
      { label: 'After', steps: ['Expect aftershocks; Drop, Cover, and Hold On again if shaking resumes.', 'Check yourself and others for injuries and give first aid.', 'If you are near the coast, move to high ground in case of a tsunami.'] },
    ],
  },
  {
    id: 'fire',
    kind: 'disaster',
    name: 'Fire',
    detail: 'House and grass fires',
    icon: 'fire',
    tone: 'coral',
    keywords: ['fire', 'sunog', 'smoke', 'usok'],
    phases: [
      { label: 'Before', steps: ['Install smoke alarms and keep a fire extinguisher within reach.', 'Never leave cooking unattended; keep flammables away from heat.', 'Plan and practice two ways out of every room.'] },
      { label: 'During', steps: ['Alert everyone and get out fast; call 911 once you are outside.', 'Stay low under smoke and cover your nose and mouth.', 'Feel doors before opening them; if hot, use another exit.'] },
      { label: 'After', steps: ['Do not go back inside until firefighters say it is safe.', 'Seek medical care for burns or smoke inhalation.', 'Contact your barangay for assistance and temporary shelter.'] },
    ],
  },
  {
    id: 'bleeding',
    kind: 'aid',
    name: 'Bleeding',
    detail: 'Control blood loss',
    icon: 'bleeding',
    tone: 'rose',
    keywords: ['bleeding', 'blood', 'dugo', 'wound', 'sugat', 'cut'],
    phases: [
      { label: 'Immediate care', steps: ['Apply firm, direct pressure on the wound with a clean cloth.', 'Keep pressing for at least 10 minutes without lifting to check.', 'If blood soaks through, add more cloth on top and keep pressing.'] },
      { label: 'Warning signs', steps: ['Blood spurting, or not slowing after 10 minutes of pressure.', 'Pale, cold, clammy skin, confusion, or fainting.', 'Deep wounds, animal bites, or wounds from rusty objects.'] },
      { label: 'Avoid', steps: ['Do not remove embedded objects; pad around them instead.', 'Do not use a tourniquet unless trained and the bleeding is life-threatening.', 'Do not put powders, coffee, or herbs on the wound.'] },
    ],
  },
  {
    id: 'burns',
    kind: 'aid',
    name: 'Burns',
    detail: 'Cool and protect',
    icon: 'burn',
    tone: 'orange',
    keywords: ['burn', 'burns', 'paso', 'napaso', 'scald'],
    phases: [
      { label: 'Immediate care', steps: ['Cool the burn under cool running water for 20 minutes.', 'Remove rings and tight items before swelling starts.', 'Cover loosely with cling film or a clean, non-fluffy cloth.'] },
      { label: 'Warning signs', steps: ["Burns larger than the person's palm, or on the face, hands, feet, or groin.", 'Deep burns that look white, leathery, or charred.', 'Chemical or electrical burns, or any difficulty breathing.'] },
      { label: 'Avoid', steps: ['Do not apply ice, toothpaste, butter, or oil.', 'Do not pop blisters.', 'Do not remove clothing that is stuck to the burn.'] },
    ],
  },
  {
    id: 'choking',
    kind: 'aid',
    name: 'Choking',
    detail: 'Clear the airway',
    icon: 'choking',
    tone: 'teal',
    keywords: ['choking', 'nabulunan', 'airway', 'heimlich'],
    phases: [
      { label: 'Immediate care', steps: ['Ask "Are you choking?" and encourage them to cough if they can.', 'Give up to 5 firm back blows between the shoulder blades.', 'Then give up to 5 abdominal thrusts; alternate until the object comes out.'] },
      { label: 'Warning signs', steps: ['Unable to speak, cough, or breathe.', 'Lips or face turning blue.', 'Loss of consciousness: call 911 and start CPR if trained.'] },
      { label: 'Avoid', steps: ['Do not do blind finger sweeps in the mouth.', 'Do not give abdominal thrusts to infants under 1 year; use back blows and chest thrusts.', 'Do not give food or water until breathing is normal.'] },
    ],
  },
  {
    id: 'fractures',
    kind: 'aid',
    name: 'Fractures',
    detail: 'Stabilize safely',
    icon: 'fracture',
    tone: 'indigo',
    keywords: ['fracture', 'broken bone', 'bali', 'nabalian', 'sprain'],
    phases: [
      { label: 'Immediate care', steps: ['Keep the injured part still, in the position you found it.', 'Support it with padding or a splint above and below the injury.', 'Apply a cold pack wrapped in cloth to reduce swelling.'] },
      { label: 'Warning signs', steps: ['Bone visible through the skin, or severe deformity.', 'Numbness, tingling, or a cold, pale limb below the injury.', 'Suspected head, neck, or back injury: do not move the person.'] },
      { label: 'Avoid', steps: ['Do not try to straighten or push a bone back in.', 'Do not let the person walk on a suspected leg fracture.', 'Do not put ice directly on the skin.'] },
    ],
  },
]

export const disasterGuides = guides.filter((guide) => guide.kind === 'disaster')
export const firstAidGuides = guides.filter((guide) => guide.kind === 'aid')

export const getGuide = (id: string | undefined) => guides.find((guide) => guide.id === id)

export const guideKindLabel: Record<GuideKind, string> = { disaster: 'Disaster guide', aid: 'First aid guide' }
