import type { ReactNode } from 'react'
import Svg, { Circle, G, Path, Rect } from 'react-native-svg'

import type { Guide } from '@/data/guides'

function Person({ x, y, walking = false }: { x: number; y: number; walking?: boolean }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Circle cy="-31" r="8" fill="#c28d69" />
      <Path d="M-9-18q9-6 18 0l3 27h-24Z" fill="#16897c" />
      <Path d={walking ? 'm-5 8-12 22m23-22 13 19M-8-14-21-2m29-12 16 9' : 'M-5 8v23M5 8v23M-10-14-15 5m25-19 5 19'} stroke="#345565" strokeWidth="6" strokeLinecap="round" />
    </G>
  )
}

function House({ damaged = false }: { damaged?: boolean }) {
  return (
    <G>
      <Rect x="110" y="74" width="112" height="80" rx="4" fill="#fffdf6" />
      <Path d="m99 78 67-49 67 49" fill="#75aaa2" stroke="#528e87" strokeWidth="5" strokeLinejoin="round" />
      <Rect x="153" y="110" width="25" height="44" rx="3" fill="#9ac6c4" />
      <Rect x="122" y="94" width="20" height="20" rx="3" fill="#c7e4eb" />
      <Rect x="190" y="94" width="20" height="20" rx="3" fill="#c7e4eb" />
      {damaged && <Path d="m206 119-11 9 8 10-13 16" stroke="#9a7970" strokeWidth="3" />}
    </G>
  )
}

function Kit({ x = 244, y = 109 }: { x?: number; y?: number }) {
  return <G transform={`translate(${x} ${y})`}><Rect width="45" height="39" rx="8" fill="#df866e" /><Path d="M13 0v-6h19v6" stroke="#bf6b59" strokeWidth="4" /><Path d="M16 20h14m-7-7v14" stroke="#fff6ef" strokeWidth="4" strokeLinecap="round" /></G>
}

function Check({ x = 285, y = 58 }: { x?: number; y?: number }) {
  return <G transform={`translate(${x} ${y})`}><Circle r="19" fill="#e5f4eb" stroke="#95c9b4" strokeWidth="2" /><Path d="m-8 0 6 6L9-7" fill="none" stroke="#238b74" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></G>
}

function Rain() {
  return <G stroke="#67a9c7" strokeWidth="3" strokeLinecap="round"><Path d="m48 41-9 16m39-28-9 16m218-9-9 16m36 12-9 16m-247 3-9 16m230-5-9 16" /><Path d="M245 26h57q19 0 19 14M245 48h34" /></G>
}

function Arrow({ x, y, left = false }: { x: number; y: number; left?: boolean }) {
  return <Path d={left ? `M${x + 32} ${y}h-32m12-11-12 11 12 11` : `M${x} ${y}h32m-12-11 12 11-12 11`} fill="none" stroke="#398d7c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
}

function DisasterScene({ guide, phase }: { guide: Guide; phase: string }): ReactNode {
  const before = phase === 'before'
  const during = phase === 'during'
  if (guide.id === 'typhoon') return <>
    <House />
    {before ? <><Path d="m120 94 23 21m-23 0 23-21m46 0 23 21m-23 0 23-21" stroke="#b28a61" strokeWidth="4" /><Kit /><Check /></>
      : during ? <><Rain /><Path d="M35 119h49m-35 12h35m168-5h52" stroke="#8cb7bd" strokeWidth="3" strokeLinecap="round" /><Circle cx="166" cy="122" r="7" fill="#c28d69" /><Path d="M156 139q0-13 10-13t10 13" fill="#16897c" /></>
        : <><Path d="m251 155 48-20m-26 10-9-13m17 9 7 12" stroke="#987b66" strokeWidth="6" strokeLinecap="round" /><Person x={76} y={123} /><Check /><Path d="m305 103 15 27h-30Z" fill="#edc576" /><Path d="M305 111v8m0 5v1" stroke="#836733" strokeWidth="2" /></>}
  </>
  if (guide.id === 'flood') return <>
    {during ? <><Path d="m182 160 63-75 96 75" fill="#a6c7a2" /><Path d="M22 142q12-9 24 0t24 0 24 0 24 0 24 0 24 0v35H22Z" fill="#8bc7e0" /><Person x={263} y={100} /><Arrow x={188} y={105} /><Path d="M283 60V29h29l-7 10 7 10h-29" fill="#5d9a80" stroke="#5d9a80" strokeWidth="3" /></>
      : <><House />{before ? <><Kit x={249} y={86} /><Path d="M241 128h63m-57 0v25m51-25v25" stroke="#9b8567" strokeWidth="5" /><Arrow x={59} y={63} /><Check /></>
        : <><Path d="M43 155q15-7 30 0t30 0 30 0m92 0q15-7 30 0t30 0 30 0" stroke="#87b9d0" strokeWidth="5" fill="none" /><Path d="m264 120-7 34h23m-3-34 7 34h18" stroke="#4f7e79" strokeWidth="8" strokeLinecap="round" /><Check /></>}</>}
  </>
  if (guide.id === 'landslide') return <>
    <Path d="M24 159 119 40l88 119Z" fill="#bfd1ad" /><Path d="m75 96 35-43 33 42-31-15Z" fill="#95b58d" />
    {before ? <><Path d="m124 66-12 23 16 12-12 20" fill="none" stroke="#8c7961" strokeWidth="3" /><Path d="M215 149V75h51v33h-51" fill="#f0cc8d" stroke="#b39159" strokeWidth="3" /><Path d="M240 82v13m0 5v1" stroke="#836733" strokeWidth="3" /><Person x={291} y={123} /></>
      : during ? <><Path d="m151 84 13 19-22 6Zm22 32 17 16-24 3Zm-47-40 10 13-18 4Z" fill="#927a64" /><Path d="m155 62 21 23m-9 9 23 26" stroke="#a9947b" strokeWidth="3" /><Person x={276} y={123} walking /><Arrow x={235} y={72} /></>
        : <><Path d="m115 148 23-19 24 27 16-15 22 18" fill="#a9947b" /><Path d="M219 114h81v22h-81Z" fill="#f2d59f" /><Path d="m223 114 17 22m9-22 17 22m9-22 17 22M225 136v21m69-21v21" stroke="#ba9154" strokeWidth="4" /><Check x={273} y={64} /></>}
  </>
  if (guide.id === 'earthquake') return during
    ? <><Path d="M79 103h197v13H79Zm15 13v45m167-45v45" fill="#bda184" stroke="#9e866c" strokeWidth="7" strokeLinejoin="round" /><Circle cx="153" cy="135" r="9" fill="#c28d69" /><Path d="m166 139 35 8 10 15m-45-23-10 18h37m-32-20-15-13-12 9m65 13 48-15" stroke="#218b80" strokeWidth="8" strokeLinecap="round" fill="none" /><Path d="m47 119-8 12 8 12m266-24 8 12-8 12" stroke="#ab9cbd" strokeWidth="3" fill="none" /></>
    : before ? <><Rect x="102" y="39" width="105" height="116" rx="5" fill="#d3dfd9" stroke="#88a99d" strokeWidth="3" /><Path d="M106 78h97m-97 38h97M104 37V25h22m79 12V25h-22" stroke="#648f83" strokeWidth="4" /><Rect x="118" y="50" width="21" height="25" rx="3" fill="#e2b994" /><Rect x="157" y="52" width="31" height="23" rx="3" fill="#a3c8d6" /><Rect x="117" y="91" width="67" height="22" rx="3" fill="#a1c1af" /><Kit /><Check /></>
      : <><House damaged /><Person x={281} y={122} walking /><Arrow x={240} y={76} /><Path d="m89 146-19 10 12 8m125 1 18-8" stroke="#9988ac" strokeWidth="3" fill="none" /><Check x={70} y={59} /></>
  if (guide.id === 'fire') return before
    ? <><House /><Circle cx="165" cy="89" r="8" fill="#f5e4cb" stroke="#d7ae77" strokeWidth="2" /><Circle cx="165" cy="89" r="2" fill="#b8905e" /><Rect x="251" y="108" width="21" height="43" rx="6" fill="#cc7666" /><Path d="M258 108V99h14m-3 1h8v18" stroke="#597778" strokeWidth="4" /><Arrow x={54} y={115} left /><Check /></>
    : during ? <><Path d="M96 155V53h100v102" stroke="#7caaa4" strokeWidth="7" fill="#def0e9" /><Path d="M167 61v86" stroke="#a8c9bd" strokeWidth="3" /><Person x={75} y={123} walking /><Arrow x={32} y={65} left /><Path d="M229 155c-24-27 10-42 7-66 24 17 8 29 24 32 5-8 7-16 6-24 25 27 29 44 7 58" fill="#e9a36b" /><Path d="M247 155c-13-15 8-23 10-38 10 14 19 23 9 38" fill="#f6d293" /><Path d="M236 73q-20-10-11-24m29 31q18-10 12-26" stroke="#b8bec0" strokeWidth="6" strokeLinecap="round" fill="none" /></>
      : <><House damaged /><Rect x="250" y="115" width="67" height="32" rx="5" fill="#cd7e70" /><Path d="M293 115v-13h16l12 20" fill="#d89587" /><Path d="M256 108h31m-24 7v-14m18 14v-14" stroke="#8ca2a9" strokeWidth="4" /><Circle cx="265" cy="149" r="9" fill="#496777" /><Circle cx="306" cy="149" r="9" fill="#496777" /><Check x={72} y={65} /></>
  return null
}

function AidScene({ guide }: { guide: Guide }): ReactNode {
  return <>
    <Kit x={56} y={106} />
    {guide.id === 'burns' ? <><Path d="M153 78h53v16h-31v20" stroke="#8fadb4" strokeWidth="10" fill="none" strokeLinejoin="round" /><Path d="M174 118v24m9-24v19m-18-19v19" stroke="#6fbcda" strokeWidth="3" strokeLinecap="round" /><Path d="M143 155h65m-49 7h31" stroke="#8ec9d8" strokeWidth="5" strokeLinecap="round" /></>
      : guide.id === 'bleeding' ? <><Rect x="139" y="71" width="99" height="69" rx="14" transform="rotate(-20 188 105)" fill="#edc8b0" /><Rect x="170" y="67" width="38" height="76" rx="6" transform="rotate(-20 189 105)" fill="#fffdf7" /><Path d="M181 94h15m-15 8h15m-15 8h15" stroke="#d6dacf" strokeWidth="3" strokeLinecap="round" /></>
        : guide.id === 'fractures' ? <><Path d="m148 80 26 59 57-15" stroke="#dfb392" strokeWidth="23" strokeLinecap="round" strokeLinejoin="round" fill="none" /><Path d="m141 84 91 40-58 20Z" fill="#bed8e7" /><Path d="m141 84 91 40-58 20Z" stroke="#85acbf" strokeWidth="2" fill="none" /></>
          : <><Person x={183} y={116} /><Rect x="245" y="85" width="41" height="66" rx="8" fill="#577f82" /><Rect x="250" y="94" width="31" height="41" rx="3" fill="#e8f3eb" /><Path d="M260 108h12m-6-6v12" stroke="#48917d" strokeWidth="3" strokeLinecap="round" /></>}
    <Check x={290} y={58} />
  </>
}

/** Stage artwork adapted from project/src/GuideIllustration.tsx. */
export function GuideIllustration({ guide, phase, caption }: { guide: Guide; phase: string; caption: string }) {
  const during = phase.toLowerCase() === 'during'
  return (
    <Svg width="100%" height={196} viewBox="0 0 360 196" accessible accessibilityLabel={`${guide.name}: ${caption}`}>
      <Rect width="360" height="196" rx="18" fill={during ? '#e5edf2' : '#eaf3ee'} />
      <Circle cx="285" cy="43" r="24" fill={during ? '#d7e3e9' : '#f6e7bd'} />
      <Path d="M28 162h304" stroke="#b8cfca" strokeWidth="2" strokeLinecap="round" />
      <Path d="M36 45h46m-35 10h18" stroke="#c7ded9" strokeWidth="5" strokeLinecap="round" />
      {guide.kind === 'disaster' ? <DisasterScene guide={guide} phase={phase.toLowerCase()} /> : <AidScene guide={guide} />}
    </Svg>
  )
}
