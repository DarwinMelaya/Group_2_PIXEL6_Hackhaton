import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg'

import type { TonePalette } from '@/components/avatarPalettes'
import type { IllustratedAvatar } from '@/db/settings'

/** Friendly eyes + rosy cheeks + smile shared by human portrait presets. */
function FriendlyFace({
  skin = '#f7c59f',
  skinShadow = '#eab086',
  smile = 'grin',
}: {
  skin?: string
  skinShadow?: string
  smile?: 'grin' | 'soft' | 'open'
}) {
  return (
    <G>
      {/* Neck */}
      <Rect x="43" y="67" width="14" height="12" rx="6" fill={skinShadow} />
      {/* Ears */}
      <Circle cx="28" cy="54" r="5.5" fill={skinShadow} />
      <Circle cx="72" cy="54" r="5.5" fill={skinShadow} />
      {/* Head */}
      <Rect x="29" y="34" width="42" height="37" rx="19" fill={skin} />
      {/* Cheek blushes */}
      <Ellipse cx="36.5" cy="58.5" rx="4.2" ry="2.5" fill="#f28b82" opacity={0.48} />
      <Ellipse cx="63.5" cy="58.5" rx="4.2" ry="2.5" fill="#f28b82" opacity={0.48} />
      {/* Eyes + catchlights */}
      <Circle cx="41" cy="52" r="3.1" fill="#232528" />
      <Circle cx="59" cy="52" r="3.1" fill="#232528" />
      <Circle cx="42.1" cy="50.9" r="1.1" fill="#ffffff" />
      <Circle cx="60.1" cy="50.9" r="1.1" fill="#ffffff" />
      {/* Nose */}
      <Path d="M49 55.5 Q50 57.5 51.5 55.5" stroke="#c98a63" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Mouth */}
      {smile === 'open' ? (
        <G>
          <Path d="M44.5 61 Q50 67.5 55.5 61 Z" fill="#a83846" />
          <Path d="M46.5 64.2 Q50 66.5 53.5 64.2" fill="#f4899e" />
        </G>
      ) : smile === 'grin' ? (
        <Path
          d="M44.5 61.2 Q50 66 55.5 61.2"
          stroke="#5c3624"
          strokeWidth="2.3"
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <Path
          d="M45.5 61.5 Q50 64.8 54.5 61.5"
          stroke="#5c3624"
          strokeWidth="2.1"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </G>
  )
}

export function IllustratedAvatarSvg({
  variant,
  palette,
  size,
}: {
  variant: IllustratedAvatar
  palette: TonePalette
  size: number
}) {
  const accent = palette.swatch

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Subtle inner depth halo */}
      <Circle cx="50" cy="54" r="35" fill={palette.halo} opacity={0.65} />

      {variant === 'morion' && (
        <G>
          {/* Festive Marinduque Morion feather crest */}
          <Path d="M50 8 C44 10 42 20 45 28 L55 28 C58 20 56 10 50 8 Z" fill="#f5b83d" />
          <Path d="M38 11 C32 14 33 23 39 30 L47 28 C44 20 43 13 38 11 Z" fill="#e24c4c" />
          <Path d="M62 11 C68 14 67 23 61 30 L53 28 C56 20 57 13 62 11 Z" fill="#e24c4c" />
          <Path d="M28 18 C24 22 27 30 34 34 L40 30 C35 24 33 19 28 18 Z" fill={accent} />
          <Path d="M72 18 C76 22 73 30 66 34 L60 30 C65 24 67 19 72 18 Z" fill={accent} />
          {/* Crest gold base */}
          <Rect x="39" y="25" width="22" height="6" rx="3" fill="#d99621" />

          {/* Tunic shoulders */}
          <Path d="M20 102 C22 80 34 74 50 74 C66 74 78 80 80 102 Z" fill={accent} />
          <Path d="M38 75 L50 85 L62 75" stroke="#f5c451" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          <FriendlyFace smile="open" />

          {/* Silver Morion helmet dome & golden visor */}
          <Path d="M27 46 C27 31 37 26 50 26 C63 26 73 31 73 46 Z" fill="#8d99a6" />
          <Path d="M33 44 C34 33 41 29 50 29 C59 29 66 33 67 44 Z" fill="#aeb8c4" />
          {/* Cheek armor plates */}
          <Path d="M26 44 L31 44 L31 61 C27.5 59 26 54 26 49 Z" fill="#f0b43c" />
          <Path d="M74 44 L69 44 L69 61 C72.5 59 74 54 74 49 Z" fill="#f0b43c" />
          {/* Iconic peaked golden Morion visor */}
          <Path d="M24 46 L50 35 L76 46 L73 51 L50 41.5 L27 51 Z" fill="#f5c148" />
          <Circle cx="28" cy="47" r="2.2" fill="#c98518" />
          <Circle cx="72" cy="47" r="2.2" fill="#c98518" />
        </G>
      )}

      {variant === 'responder' && (
        <G>
          {/* Rescue vest shoulders */}
          <Path d="M19 102 C21 80 34 74 50 74 C66 74 79 80 81 102 Z" fill={accent} />
          {/* High-vis reflective stripes */}
          <Rect x="31" y="77" width="6" height="25" fill="#ffe380" rx="2" />
          <Rect x="63" y="77" width="6" height="25" fill="#ffe380" rx="2" />

          <FriendlyFace smile="grin" />

          {/* Safety rescue helmet */}
          <Path d="M26 45 C26 29 36 22 50 22 C64 22 74 29 74 45 Z" fill={accent} />
          <Path d="M35 24 C40 21 60 21 65 24 L62 39 L38 39 Z" fill="#ffffff" opacity={0.18} />
          {/* Front safety emblem */}
          <Rect x="43" y="27" width="14" height="12" rx="4" fill="#ffffff" />
          <Path d="M50 30 V36 M47 33 H53" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
          {/* Helmet brim */}
          <Rect x="23" y="42" width="54" height="5.5" rx="2.75" fill="#f5c148" />
        </G>
      )}

      {variant === 'gabai' && (
        <G>
          {/* Robot body shoulders */}
          <Path d="M22 102 C24 81 35 75 50 75 C65 75 76 81 78 102 Z" fill={accent} />
          <Circle cx="50" cy="88" r="6" fill="#ffffff" opacity={0.9} />
          <Path d="M47.8 88 L49.5 89.8 L52.8 86.2" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Antenna */}
          <Rect x="48" y="18" width="4" height="11" rx="2" fill={accent} />
          <Circle cx="50" cy="16" r="5" fill="#f5c148" />
          <Circle cx="48.5" cy="14.5" r="1.5" fill="#ffffff" />

          {/* Side audio pods */}
          <Rect x="19" y="43" width="7" height="16" rx="3.5" fill={accent} />
          <Rect x="74" y="43" width="7" height="16" rx="3.5" fill={accent} />

          {/* Robot squircle head */}
          <Rect x="24" y="28" width="52" height="43" rx="17" fill="#ffffff" />
          <Rect x="24" y="28" width="52" height="43" rx="17" stroke={accent} strokeWidth="2.2" strokeOpacity={0.35} />

          {/* Expressive dark glass visor */}
          <Rect x="30" y="37" width="40" height="25" rx="11" fill="#1b262c" />
          {/* Happy glowing LED eyes */}
          <Path d="M37 49 C38.5 45.5 42.5 45.5 44 49" stroke="#5ef2e2" strokeWidth="3" strokeLinecap="round" />
          <Path d="M56 49 C57.5 45.5 61.5 45.5 63 49" stroke="#5ef2e2" strokeWidth="3" strokeLinecap="round" />
          {/* Cute LED smile & cheek dots */}
          <Path d="M46.5 55 Q50 58 53.5 55" stroke="#5ef2e2" strokeWidth="2.2" strokeLinecap="round" />
          <Circle cx="35.5" cy="54" r="1.8" fill="#ff8da1" opacity={0.85} />
          <Circle cx="64.5" cy="54" r="1.8" fill="#ff8da1" opacity={0.85} />
        </G>
      )}

      {variant === 'explorer' && (
        <G>
          {/* Back hair */}
          <Circle cx="31" cy="51" r="7" fill="#4a3228" />
          <Circle cx="69" cy="51" r="7" fill="#4a3228" />

          {/* Explorer shirt & neckerchief */}
          <Path d="M20 102 C22 80 34 74 50 74 C66 74 78 80 80 102 Z" fill="#f3ead8" />
          <Path d="M36 74 L50 90 L64 74 Z" fill={accent} />
          <Circle cx="50" cy="83" r="2.6" fill="#f5c148" />

          <FriendlyFace skin="#f2bc94" skinShadow="#e2a77d" smile="grin" />

          {/* Front hair tufts */}
          <Path d="M29 44 Q38 37 50 40 Q62 37 71 44" fill="#4a3228" />

          {/* Sun / Island scout hat */}
          <Ellipse cx="50" cy="39" rx="30" ry="6.5" fill="#d9ad6b" />
          <Path d="M31 39 C32 24 39 20 50 20 C61 20 68 24 69 39 Z" fill="#e8c184" />
          {/* Accent hatband */}
          <Path d="M31.5 35.5 Q50 38.5 68.5 35.5 L69 39 Q50 42 31 39 Z" fill={accent} />
        </G>
      )}

      {variant === 'medic' && (
        <G>
          {/* Scrubs shoulders */}
          <Path d="M20 102 C22 80 34 74 50 74 C66 74 78 80 80 102 Z" fill={accent} />
          <Path d="M43 74 L50 84 L57 74" fill="#ffffff" opacity={0.35} />
          {/* Subtle stethoscope drape */}
          <Path d="M37 75 C36 86 41 91 45 91 M63 75 C64 86 59 91 55 91" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity={0.85} />
          <Circle cx="55" cy="91" r="3" fill="#f5c148" />

          <FriendlyFace skin="#f8cba8" skinShadow="#e8b691" smile="soft" />

          {/* Neat hair & medic cap */}
          <Path d="M28 48 C27 31 37 24 50 24 C63 24 73 31 72 48 C68 40 60 37 50 37 C40 37 32 40 28 48 Z" fill="#2f2933" />
          <Rect x="36" y="21" width="28" height="13" rx="6.5" fill="#ffffff" />
          <Path d="M50 24.5 V30.5 M47 27.5 H53" stroke="#e24c4c" strokeWidth="2.4" strokeLinecap="round" />

          {/* Friendly round eyeglasses */}
          <Circle cx="41" cy="52" r="6.8" stroke={accent} strokeWidth="2" fill="none" />
          <Circle cx="59" cy="52" r="6.8" stroke={accent} strokeWidth="2" fill="none" />
          <Path d="M47.8 52 H52.2" stroke={accent} strokeWidth="2" strokeLinecap="round" />
        </G>
      )}

      {variant === 'islander' && (
        <G>
          {/* Flowing wavy dark hair */}
          <Path
            d="M23 66 C20 50 24 22 50 22 C76 22 80 50 77 66 C73 71 27 71 23 66 Z"
            fill="#2b2129"
          />

          {/* Breezy island top */}
          <Path d="M21 102 C23 80 35 74 50 74 C65 74 77 80 79 102 Z" fill={accent} />
          <Path d="M39 75 Q50 83 61 75" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" opacity={0.75} />

          <FriendlyFace skin="#f3be96" skinShadow="#e2aa80" smile="open" />

          {/* Side-swept bangs */}
          <Path
            d="M28 46 C31 33 43 31 54 34 C62 36 68 40 71 46 C69 32 61 24 50 24 C36 24 28 33 28 46 Z"
            fill="#2b2129"
          />

          {/* Tropical plumeria / hibiscus flower tucked by ear */}
          <G transform="translate(69, 37)">
            <Circle cx="0" cy="-5" r="4.2" fill="#ffffff" />
            <Circle cx="4.8" cy="-1.5" r="4.2" fill="#ffffff" />
            <Circle cx="3" cy="4.2" r="4.2" fill="#ffffff" />
            <Circle cx="-3" cy="4.2" r="4.2" fill="#ffffff" />
            <Circle cx="-4.8" cy="-1.5" r="4.2" fill="#ffffff" />
            <Circle cx="0" cy="0" r="3.2" fill="#f5b83d" />
          </G>
        </G>
      )}

      {variant === 'bantay' && (
        <G>
          {/* Pup body & rescue bandana */}
          <Path d="M24 102 C26 80 36 73 50 73 C64 73 74 80 76 102 Z" fill="#e6ad6c" />
          <Path d="M33 74 L67 74 L50 91 Z" fill={accent} />
          <Circle cx="50" cy="86" r="3.2" fill="#f5c148" />

          {/* Floppy cocoa puppy ears */}
          <Path d="M29 31 C19 32 16 47 21 57 C24 61 29 57 31 48 Z" fill="#7d4c32" />
          <Path d="M71 31 C81 32 84 47 79 57 C76 61 71 57 69 48 Z" fill="#7d4c32" />

          {/* Puppy head */}
          <Rect x="27" y="27" width="46" height="46" rx="22" fill="#edb777" />
          {/* Forehead spot */}
          <Path d="M43 27 Q50 37 57 27 Z" fill="#7d4c32" />

          {/* Cream muzzle */}
          <Ellipse cx="50" cy="58" rx="14" ry="10.5" fill="#fff6e8" />
          {/* Cheek blushes */}
          <Ellipse cx="34.5" cy="56" rx="3.8" ry="2.3" fill="#f28b82" opacity={0.45} />
          <Ellipse cx="65.5" cy="56" rx="3.8" ry="2.3" fill="#f28b82" opacity={0.45} />

          {/* Shiny puppy eyes */}
          <Circle cx="39.5" cy="47.5" r="3.6" fill="#232020" />
          <Circle cx="60.5" cy="47.5" r="3.6" fill="#232020" />
          <Circle cx="40.8" cy="46.2" r="1.3" fill="#ffffff" />
          <Circle cx="61.8" cy="46.2" r="1.3" fill="#ffffff" />

          {/* Happy tongue & w-mouth */}
          <Path d="M47 61.5 Q50 68.5 53 61.5 Z" fill="#f27d8e" />
          <Path
            d="M44 59.5 Q47 63 50 59.5 Q53 63 56 59.5"
            stroke="#4a2e1f"
            strokeWidth="2.1"
            strokeLinecap="round"
            fill="none"
          />
          {/* Boopable nose */}
          <Ellipse cx="50" cy="54.5" rx="4.8" ry="3.4" fill="#3a2318" />
          <Ellipse cx="48.8" cy="53.5" rx="1.4" ry="0.8" fill="#ffffff" opacity={0.55} />
        </G>
      )}

      {variant === 'ming' && (
        <G>
          {/* Cat body */}
          <Path d="M26 102 C28 81 37 74 50 74 C63 74 72 81 74 102 Z" fill="#fff4e4" />

          {/* Pointed cat ears */}
          <Path d="M27 44 L23 19 L43 30 Z" fill="#f4a261" />
          <Path d="M29 41 L26.5 24.5 L40 32 Z" fill="#f7b2bd" />
          <Path d="M73 44 L77 19 L57 30 Z" fill="#fff4e4" />
          <Path d="M71 41 L73.5 24.5 L60 32 Z" fill="#f7b2bd" />

          {/* Cat head */}
          <Rect x="26" y="28" width="48" height="45" rx="22" fill="#fff4e4" />
          {/* Calico ginger patch */}
          <Path d="M26 45 C26 33 35 28 47 28 C45 37 37 44 26 45 Z" fill="#f4a261" />

          {/* Collar & golden bell */}
          <Rect x="34" y="71" width="32" height="6" rx="3" fill={accent} />
          <Circle cx="50" cy="77.5" r="4.4" fill="#f5c148" />
          <Circle cx="50" cy="78.5" r="1.1" fill="#8c5811" />

          {/* Curious round cat eyes */}
          <Circle cx="39.5" cy="49" r="3.8" fill="#232528" />
          <Circle cx="60.5" cy="49" r="3.8" fill="#232528" />
          <Circle cx="40.8" cy="47.6" r="1.4" fill="#ffffff" />
          <Circle cx="61.8" cy="47.6" r="1.4" fill="#ffffff" />

          {/* Pink nose & cat mouth */}
          <Path d="M47.5 54.5 H52.5 L50 57.5 Z" fill="#f08294" />
          <Path
            d="M44.8 59.5 Q47.5 62.5 50 59.2 Q52.5 62.5 55.2 59.5"
            stroke="#594136"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Whiskers */}
          <Path d="M22 52 L31 53.5 M22 57 L31 57" stroke="#c8b6a6" strokeWidth="1.7" strokeLinecap="round" />
          <Path d="M78 52 L69 53.5 M78 57 L69 57" stroke="#c8b6a6" strokeWidth="1.7" strokeLinecap="round" />
        </G>
      )}
    </Svg>
  )
}
