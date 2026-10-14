import type {Game,Stat} from './types';
import {statNames} from './data/world';
export type TalentLevel=1|2|3|4|5;
export type Talents=Record<Stat,TalentLevel>;
export const talentWeights=[10,20,40,20,10];
export const talentMultipliers:Record<TalentLevel,number>={1:.6,2:.8,3:1,4:1.25,5:1.5};
export const talentLabels:Record<TalentLevel,string>={1:'더딘 성장',2:'꾸준한 노력',3:'보통',4:'뛰어난 재능',5:'천부적 재능'};
export function talentLevel(g:Pick<Game,'talents'>,s:Stat):TalentLevel {const n=g.talents?.[s];return n&&Number.isInteger(n)&&n>=1&&n<=5?n:3}
export function growStat(g:Game,s:Stat,base:number):number {
 const value=g.stats[s];
 const multiplier=base>0?talentMultipliers[talentLevel(g,s)]*(g.race===0?1.1:1)*(g.race===1&&s==='마력'?1.15:1)*(value>=85?.35:value>=70?.65:1):1;
 return Math.max(0,Math.min(100,Math.round((value+base*multiplier)*10)/10));
}
// Existing lives retain neutral growth; never consume RNG or rewrite history.
export function ensureTalents(source:Game):Game {
 if(source.talents&&statNames.every(s=>Number.isInteger(source.talents![s])&&source.talents![s]>=1&&source.talents![s]<=5))return source;
 const g=structuredClone(source);g.talents=Object.fromEntries(statNames.map(s=>[s,talentLevel(source,s)])) as Talents;g.talentOrigin='legacy';return g;
}
