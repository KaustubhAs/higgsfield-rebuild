'use client';
import { useId } from 'react';

/** Original vector illustrations authored for this project; not inference outputs. */
export default function ConceptArt({ variant = 'arch', className = '' }) {
  const id = useId().replace(/:/g, '');
  const colors = variant === 'product' ? ['#788168', '#d4d7b3'] : variant === 'orb' ? ['#292b46', '#9590d0'] : ['#b57354', '#edc898'];
  return <svg className={`concept-art ${className}`} viewBox="0 0 800 560" role="img" aria-label={`Original ${variant === 'product' ? 'product still life' : variant === 'orb' ? 'abstract sculpture' : 'desert architecture'} concept illustration; not an AI output`}>
    <defs>
      <linearGradient id={`${id}bg`} x2="1" y2="1"><stop stopColor={colors[0]} /><stop offset="1" stopColor={colors[1]} /></linearGradient>
      <linearGradient id={`${id}metal`}><stop stopColor="#292c24" /><stop offset=".3" stopColor="#aab29c" /><stop offset=".55" stopColor="#e5e8c9" /><stop offset=".75" stopColor="#9ba68e" /><stop offset="1" stopColor="#475243" /></linearGradient>
      <radialGradient id={`${id}orb`} cx=".3" cy=".25"><stop stopColor="#f5edd9" /><stop offset=".27" stopColor="#a6d4d1" /><stop offset=".52" stopColor="#9494c9" /><stop offset=".73" stopColor="#414965" /><stop offset=".88" stopColor="#cc9d85" /><stop offset="1" stopColor="#383046" /></radialGradient>
    </defs>
    <rect width="800" height="560" fill={`url(#${id}bg)`} />
    {variant === 'product' ? <>
      <path d="M0 410 800 300v260H0Z" fill="#a6ab90" /><path d="m389 410 370 135H438l-172-90Z" fill="#69745c" opacity=".6" />
      <ellipse cx="388" cy="433" rx="156" ry="39" fill="#777f68" /><path d="M235 398h305v60c-72 45-220 42-305 0Z" fill="#c1c4a8" /><ellipse cx="388" cy="397" rx="153" ry="37" fill="#e0dfc4" />
      <rect x="315" y="181" width="142" height="214" rx="34" fill={`url(#${id}metal)`} /><rect x="346" y="133" width="79" height="60" rx="8" fill="#252e25" /><path d="M358 142h53" stroke="#67715c" strokeWidth="3" />
      <text x="386" y="275" textAnchor="middle" fill="#253327" fontFamily="Georgia,serif" fontSize="32" letterSpacing="6">FORM</text><text x="386" y="302" textAnchor="middle" fill="#34402d" fontFamily="Arial,sans-serif" fontSize="9" letterSpacing="3">DAILY RITUAL / 01</text>
      <path d="M625 0 480 220M650 0 580 150" stroke="#e4e6cd" strokeWidth="90" opacity=".1" />
    </> : variant === 'orb' ? <>
      <path d="M0 410h800v150H0Z" fill="#22233a" /><ellipse cx="414" cy="458" rx="181" ry="28" fill="#161829" opacity=".65" /><circle cx="400" cy="267" r="166" fill={`url(#${id}orb)`} /><ellipse cx="400" cy="267" rx="202" ry="51" fill="none" stroke="#d9c5d6" strokeWidth="3" transform="rotate(-32 400 267)" opacity=".6" /><circle cx="627" cy="116" r="5" fill="#d0c3dc" />
    </> : <>
      <circle cx="618" cy="145" r="67" fill="#f7ddb2" /><path d="M0 340Q180 220 405 375T800 312V560H0Z" fill="#c18a63" /><path d="M0 412q220-70 448 18t352 9v121H0Z" fill="#dcb184" />
      <path d="M118 444V142h289v302h-75V268a70 70 0 0 0-140 0v176Z" fill="#e6bd92" /><path d="M407 142h39v302h-39Z" fill="#80523e" /><path d="M192 444V268a70 70 0 0 1 140 0v176h-28V275a42 42 0 0 0-84 0v169Z" fill="#ae7656" /><path d="m446 444 261 116H322l-130-116Z" fill="#895e48" opacity=".6" />
      <path d="M515 385V246h103v139h-23v-82a28 28 0 0 0-56 0v82Z" fill="#dfb58a" />
    </>}
    <rect x="18" y="18" width="764" height="524" rx="2" fill="none" stroke="white" opacity=".12" />
  </svg>;
}
