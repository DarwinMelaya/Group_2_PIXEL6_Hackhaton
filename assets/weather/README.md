# Weather backgrounds

## Active card backgrounds (v2)

Nine new backgrounds were generated using the built-in `image_gen` tool on 2026-10-30. The exact prompt set and filenames are recorded in [generated-v2.json](./generated-v2.json). Each JPEG is 960 × 640 and approximately 65–136 KB. Original assets remain available below; fog and snow continue using their existing generated images.

The card displays the selected image at 50% opacity with a dark overlay and white text. Selection follows Open-Meteo's WMO weather code and `is_day`, independently of the app's appearance setting. Sunny, partly cloudy, overcast, drizzle, rain, thunderstorms, clear night, cloudy night, and rainy night each have a distinct image. No image is shown before data arrives or for an unrecognized weather code. Bundled assets require no additional image requests.

## Original backgrounds (v1)

Generated with the built-in image_gen tool on 2026-10-30. JPEG derivatives are resized to 960 px wide for bundled mobile use. Transparency is applied to the image layer at runtime; text and controls stay opaque. No network image downloads are needed.

## Prompts

### sunny.jpg

Use case: photorealistic-natural. Asset: wide mobile weather-card backdrop. A serene tropical blue sky in sunny weather, warm sun glow near upper right, wispy clouds near lower edge. Sky only, no land, people, objects, text, symbols, borders or watermark. Soft atmospheric photography, gentle contrast, left half quiet negative space for dark UI text. Wide landscape 3:2 framing. Intended to display translucently behind a weather card.

### cloudy.jpg

Use case: photorealistic-natural. Asset: wide mobile weather-card backdrop. An overcast tropical sky with layers of soft blue-grey clouds, gently illuminated cloud edges. Sky only. Soft atmospheric photography matching a minimal premium weather app. Wide landscape 3:2 framing, left half quiet negative space for UI text. No land, people, objects, text, icons, borders or watermark. Intended to display translucently behind a weather card.

### rain.jpg

Use case: photorealistic-natural. Asset: wide mobile weather-card backdrop. A tropical rainy sky, soft slate-blue rain clouds and fine diagonal rain streaks. Sky only. Soft atmospheric photography matching a minimal premium weather app. Wide landscape 3:2 framing, left half quiet negative space for UI text. No land, people, objects, text, icons, borders or watermark. Intended to display translucently behind a weather card.

### storm.jpg

Use case: photorealistic-natural. Asset: wide mobile weather-card backdrop. A dramatic tropical thunderstorm sky, deep indigo storm clouds and one subtle distant lightning streak near the far right edge. Sky only. Soft atmospheric photography matching a minimal premium weather app. Wide landscape 3:2 framing, left half quiet negative space for UI text. No land, people, objects, text, icons, borders or watermark. Intended to display translucently behind a weather card.

### night.jpg

Use case: photorealistic-natural. Asset: wide mobile weather-card backdrop. A calm clear midnight tropical sky, soft navy blue, a small crescent moon near upper right and a sparse scattering of stars. Sky only. Soft atmospheric photography matching a minimal premium weather app. Wide landscape 3:2 framing, left half quiet negative space for UI text. No land, people, objects, text, icons, borders or watermark. Intended to display translucently behind a weather card.

### fog.jpg

Use case: photorealistic-natural. Asset: wide mobile weather-card backdrop. A foggy sky with pale silver-blue mist and soft indistinct cloud layers, very low contrast. Sky only. Soft atmospheric photography matching a minimal premium weather app. Wide landscape 3:2 framing, left half quiet negative space for UI text. No land, people, objects, text, icons, borders or watermark. Intended to display translucently behind a weather card.

### snow.jpg

Use case: photorealistic-natural. Asset: wide mobile weather-card backdrop. A cold pale blue-grey winter sky with soft clouds and a few delicate snowflakes toward the right. Sky only. Soft atmospheric photography matching a minimal premium weather app. Wide landscape 3:2 framing, left half quiet negative space for UI text. No land, people, objects, text, icons, borders or watermark. Intended to display translucently behind a weather card.

