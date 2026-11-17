export const Mark=({s=48})=><svg width={s} height={s} viewBox="0 0 64 64" aria-hidden="true"><polygon points="32,3 58,18 58,46 32,61 6,46 6,18" fill="#F5A400" stroke="#3B2208" strokeWidth="3" strokeLinejoin="round"/><circle cx="25" cy="26" r="8" fill="#3B2208"/><polygon points="25,21 29,23.5 29,28.5 25,31 21,28.5 21,23.5" fill="#FFD25A"/><rect x="30" y="24.5" width="22" height="4.5" rx="2" fill="#3B2208"/><rect x="44" y="29" width="4" height="7" fill="#3B2208"/><rect x="50" y="29" width="4" height="5" fill="#3B2208"/></svg>;
export const Pack=({c='#F5A400',className=''})=><svg className={'pack '+className} viewBox="0 0 120 240" aria-hidden="true">
<rect x="14" y="8" width="92" height="224" rx="6" fill="#fff" fillOpacity=".55" stroke="#3B2208" strokeWidth="3"/>
<rect x="14" y="8" width="92" height="16" fill="#E6D3A3" stroke="#3B2208" strokeWidth="2"/><rect x="14" y="216" width="92" height="16" fill="#E6D3A3" stroke="#3B2208" strokeWidth="2"/>
<rect x="54" y="95" width="12" height="105" rx="6" fill="#FFF3D1" stroke="#3B2208" strokeWidth="2"/>
<ellipse cx="60" cy="68" rx="28" ry="36" fill="#FFF3D1" stroke="#3B2208" strokeWidth="2"/>
<ellipse cx="60" cy="72" rx="22" ry="29" fill={c}/><ellipse cx="52" cy="58" rx="6" ry="10" fill="#fff" fillOpacity=".45"/>
<rect x="26" y="125" width="68" height="58" rx="8" fill="#3B2208"/>
<text x="60" y="150" textAnchor="middle" fontFamily="Georgia,serif" fontSize="14" fontWeight="700" fill="#FFD25A">HoneyKey</text>
<text x="60" y="170" textAnchor="middle" fontFamily="Georgia,serif" fontSize="12" fill="#FFF6E0">7 g · Pure</text>
<rect x="14" y="8" width="30" height="224" fill="#fff" fillOpacity=".25"/></svg>;
export const Drip=()=><svg className="drip" viewBox="0 0 1200 80" preserveAspectRatio="none" aria-hidden="true"><path fill="#F5A400" d="M0 0H1200V28 Q1170 28 1160 50 T1120 28 T1060 60 T1000 28 T940 50 T880 28 T820 70 T760 28 T700 50 T640 28 T580 64 T520 28 T460 50 T400 28 T340 60 T280 28 T220 50 T160 28 T100 66 T40 28 L0 28Z"/></svg>;
