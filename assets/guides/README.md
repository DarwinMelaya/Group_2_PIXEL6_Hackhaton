# Guide illustrations

Generated with the built-in imagegen tool on 2026-10-30, then resized to 720px-wide WebPs (q70, ~20–70KB each) to keep the bundled app lightweight. The active guide images are bundled offline. Additional generated first-aid assets are retained here without bundling them for topics absent from the current guide list. Disaster phase images and one immediate-care image for every first-aid topic are mapped in `src/data/guideArtwork.ts`. Captions describe the action actually depicted; images supplement the written steps.

## Prompt set

Shared prompt:

> Use case: scientific-educational. Asset type: offline mobile safety guide illustration, landscape 3:2. Polished clear flat editorial raster illustration, soft sage background, teal clothing, warm natural Filipino skin tones, simple Philippine home/community setting, restrained coral accents. One coherent scene, large legible subjects with anatomically correct hands and bodies. No text, no letters, no logos, no watermark, no decorative medical crosses, no inset panels. Illustrate only the specified safe action, avoid adding unrequested procedures. Calm practical educational tone. Scene: 

- `typhoon-before.webp`: A Filipino adult indoors packing a sturdy emergency backpack at a table with sealed drinking water, food, flashlight, medicine pouch and waterproof documents. Window closed; calm weather outside. No tape on windows.
- `typhoon-during.webp`: A Filipino family sitting well inside a sturdy living room away from a closed window while heavy wind and rain are visible outside. Battery radio and flashlight nearby; nobody touches electrical sockets or glass.
- `typhoon-after.webp`: After a storm, a Filipino adult staying far behind an official barrier while a helmeted utility worker handles a fallen power line near a damaged tree in the distant background. Clear dry foreground, no one approaches wire.
- `flood-before.webp`: In a dry Philippine home before a flood, an adult placing a waterproof document pouch and unplugged small electrical items on a high shelf, prepared go-bag nearby. No water inside.
- `flood-during.webp`: A Filipino family with a go-bag walking uphill on an entirely dry path toward safe high ground. Floodwater in low area far below and away from the path. Nobody wades, swims or drives in water.
- `flood-after.webp`: A Filipino resident waits on dry elevated ground behind a closed safety barrier beside a uniformed local responder, looking at a flooded street in the background. Both remain well away from water; no wading or cleanup.
- `landslide-before.webp`: From safe stable flat ground, a Filipino adult consults a hazard map with a local responder while a distant hillside shows ground cracks and a leaning tree. Neither person approaches the slope. Map has simple colored zones but no letters.
- `landslide-during.webp`: A Filipino adult carrying a small backpack moving sideways away from the path of a distant landslide toward wide stable flat ground. Sliding soil and rocks on far left slope; person far to the right traveling right, never crossing debris.
- `landslide-after.webp`: A helmeted local rescuer and resident on stable dry ground behind a safety cordon, looking toward a distant debris-blocked road after a landslide. No climbing debris or approaching unstable slope.
- `earthquake-before.webp`: A Filipino adult securing a tall cabinet to a wall with a visible metal bracket at the top, while standing safely on floor. Heavy items stored low, sturdy table nearby. No unstable ladder.
- `earthquake-during.webp`: Accurate Drop Cover Hold On: a Filipino adult down on knees entirely UNDER a sturdy four-leg wooden table, head and neck covered by one forearm, other hand gripping a table leg. Full body sheltered below tabletop, clear side view, away from windows. No running, no doorway, no triangular void theory.
- `earthquake-after.webp`: A Filipino family with go-bag calmly gathered in a spacious open outdoor assembly area after shaking stops, far from buildings, trees and power lines. Distant damaged building only in background. No entering damaged buildings.
- `fire-before.webp`: A Filipino adult standing safely on a small sturdy stepladder pressing the test button on a ceiling-mounted smoke alarm in a home hallway. Clear unobstructed exit, portable fire extinguisher mounted nearby. No fire, no cooking scene.
- `fire-during.webp`: A Filipino adult crawling on hands and knees low along a clear floor toward an open exterior doorway to daylight, beneath a visible high layer of smoke near the ceiling. Exit on left, source of smoke far behind on right. No one walks upright in smoke, no elevators, no fighting fire.
- `fire-after.webp`: Outside a smoke-damaged house, a Filipino family waits at a safe distance with a uniformed firefighter beside a fire engine. Barrier blocks entry to the house. Calm supportive scene; nobody reenters.
- `bleeding.webp`: Close clear view of a seated Filipino adult's injured forearm supported on a table. A helper wearing disposable gloves uses both hands to press a folded clean white cloth directly over a small forearm wound. Tiny contained stain only. Firm direct downward pressure, no tourniquet, no visible severe wound.
- `burns.webp`: A Filipino adult holding a mildly reddened forearm burn under gently flowing cool tap water over a sink. Water visibly falls directly on affected forearm. No ice, no creams, no toothpaste, no blisters, no graphic injury.
- `choking.webp`: An awake Filipino adult with choking symptoms leaning forward, supported at upper chest by a helper standing slightly to the side and behind. Helper's other open hand positioned at the upper back BETWEEN shoulder blades for a back blow. Clear side/back view, one helper and one patient, no fingers in mouth, no infant, no abdominal thrust in this scene.
- `fractures.webp`: A Filipino adult seated with an injured forearm held still in its comfortable bent position, supported from elbow to hand by a broad triangular cloth sling tied at neck. Helper gently supports sling from below. No bone visible, no straightening or manipulation, no ice directly on skin.
- `nosebleed.webp`: Clear side view of a Filipino adult sitting upright on a chair, leaning head and torso slightly FORWARD, thumb and index finger pinching the SOFT lower part of their own nose just above nostrils, mouth open to breathe. Tiny tissue held loosely below chin in other hand. No head tilted back, no squeezing bony bridge.
- `heat-exhaustion.webp`: An awake Filipino adult resting seated in cool shaded veranda, helper cooling their neck with a damp cloth and handheld fan. Cool drinking water within reach for the alert adult. No unconscious person being given water, no direct sun or exertion.
- `seizures.webp`: A Filipino adult during a seizure lying on their back on clear flat floor with a folded soft jacket cushioning head. Kneeling helper stays nearby timing with phone, hands off the person's body. Surroundings cleared of hazards, mouth empty, no restraint, no objects in mouth, no giving drinks.
- `insect-stings.webp`: Close view of a Filipino adult's forearm with a small mildly swollen insect bite, a helper gently holds a cold pack fully wrapped in a soft cloth on the area. Skin intact, no severe swelling, no tweezers, no squeezing, no exposed ice, no home remedies.

## Safety references

Additional prompts for topics added during implementation:

- `sprains-strains.webp`: An awake Filipino adult resting seated indoors, injured ankle elevated on a pillow on a low stool. A cold pack FULLY wrapped in soft cloth rests gently on the swollen ankle, helper beside them. Foot supported, no direct ice on skin, no massage, no walking.
- `cpr-cardiac-arrest.webp`: Accurate adult chest compressions: Filipino adult casualty lying flat on their BACK on a firm clear floor, rescuer kneeling at their side with shoulders directly vertically above straight elbows and interlocked hands, heel of lower hand placed on CENTER of casualty's bare chest on LOWER HALF of sternum between nipples. Arms straight vertical, proper two-hand compression position, chest fully visible, anatomically correct. Smartphone nearby on floor on speaker. No water, no blood, no rescue breaths shown, no electrodes, no one seated, no hand on abdomen, no bent elbows.
- `drowning.webp`: A Filipino adult on a broad dry stable riverbank, well back from the water edge, throwing a bright orange life ring attached to a long rope toward an awake adult in water a few meters away. Rescuer remains entirely on dry ground and does not enter the water. Second adult on dry ground calling emergency help by phone. No children, no flood crossing, no swimming rescuer, no CPR in water.

Additional references: https://www.redcross.org/take-a-class/cpr/performing-cpr/cpr-steps and https://www.nhs.uk/conditions/sprains-and-strains/ and https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/water-safety.html

These are illustrative draft assets, not medical certification. Medical/DRRM review is still required before release, as for the guide text.

- https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/earthquake.html
- https://www.sja.org.uk/first-aid-advice/
- https://www.nhs.uk/conditions/burns-and-scalds/
- https://www.nhs.uk/conditions/nosebleed/
- https://www.nhs.uk/conditions/heat-exhaustion-heatstroke/
- https://www.nhs.uk/symptoms/what-to-do-if-someone-has-a-seizure-fit/
- https://www.nhs.uk/conditions/insect-bites-and-stings/


## Selected typhoon revision

`typhoon-during-v2.webp` is used instead of the first version to show the family in an interior room completely away from windows. Final scene prompt:

> A Filipino family sits on a floor mat against a solid interior wall in a small windowless interior room of a sturdy house during a typhoon. Fully solid walls visible behind them, NO windows or glass anywhere in the frame. A closed solid wooden door, prepared go-bag, battery radio and flashlight nearby. Calm alert family waiting safely indoors. No candles, no electrical appliances in use.

