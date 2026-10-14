import {events as activityTestEvents} from './data/events';
import {createGame,start,act as beginActivity,choose,fight} from './engine';
import {growStat,talentMultipliers,type Talents} from './talents';
import {upgrade} from './systems';
import {statNames} from './data/world';
import {storage} from './storage';
const assert=(v:unknown,m:string)=>{if(!v)throw Error(m)};
const levels=(n:1|2|3|4|5)=>Object.fromEntries(statNames.map(s=>[s,n])) as Talents;
const counts=[0,0,0,0,0];
for(let i=1;i<=3000;i++){const g=createGame(Math.imul(i,2654435761)>>>0);for(const stat of statNames){const n=g.talents![stat];assert(Number.isInteger(n)&&n>=1&&n<=5,'Talent out of bounds');counts[n-1]++}}
assert(counts[2]>counts[1]&&counts[1]>counts[0]&&counts[2]>counts[3]&&counts[3]>counts[4],'Talent distribution');
const base=start(createGame(991));base.race=2;base.age=30;base.state.건강=100;base.stats=Object.fromEntries(statNames.map(s=>[s,40])) as typeof base.stats;
for(const n of [1,2,3,4,5] as const){base.talents=levels(n);assert(growStat(base,'체력',4)===Math.round((40+4*talentMultipliers[n])*10)/10,'Growth multiplier wrong');assert(growStat(base,'체력',-4)===36,'Penalty multiplied')}
for(const action of ['train','study']){const slow={...structuredClone(base),talents:levels(1)},fast={...structuredClone(base),talents:levels(5)};const stat=action==='train'?'체력':'지능';assert(act(fast,action).stats[stat]>act(slow,action).stats[stat],'Activity did not apply talent')}
base.race=0;base.talents=levels(3);assert(growStat(base,'체력',4)===44.4,'Human growth lost');base.race=1;assert(growStat(base,'마력',4)===44.6,'Elf growth lost');base.stats.마력=90;assert(growStat(base,'마력',4)<92,'High-stat slowdown lost');base.stats.마력=100;assert(growStat(base,'마력',4)===100,'Stat cap');
const old=structuredClone(base);delete old.talents;delete old.talentOrigin;const snapshot=JSON.stringify(old);const migrated=upgrade(old);assert(statNames.every(s=>migrated.talents![s]===3),'Legacy not neutral');assert(migrated.seed===old.seed&&JSON.stringify(old)===snapshot,'Migration altered source or RNG');assert(upgrade(migrated)===migrated,'Migration not idempotent');
function victory(n:1|5,magic:boolean){let g=structuredClone(base);g.talents=levels(n);g.race=2;g.stats=Object.fromEntries(statNames.map(s=>[s,60])) as typeof g.stats;g.phase='event';g.eventId='forest-spiders';g.state.건강=100;g=choose(g,0);for(let i=0;i<50&&g.combat;i++)g=fight(g,magic&&g.combat.mana>=6?'magic':'attack');assert(g.phase==='result','Fixture failed to win');return g}
assert(victory(5,false).stats.체력>victory(1,false).stats.체력,'Physical battle talent');assert(victory(5,true).stats.마력>victory(1,true).stats.마력,'Magic battle talent');
let saved:Record<string,string>={};(globalThis as any).localStorage={getItem:(k:string)=>saved[k]??null,setItem:(k:string,v:string)=>saved[k]=v};storage.save(migrated);assert(JSON.stringify(storage.load())===JSON.stringify(migrated),'Talent save mismatch');const a=createGame(91),b=createGame(91);assert(JSON.stringify(a.talents)===JSON.stringify(b.talents),'Seeded talents unstable');
console.log('Talents PASS: 18,000 rolls',counts,'training/study/battle, race bonuses, caps, loss preservation, neutral migration and save/reload.');

function act(...args:Parameters<typeof beginActivity>){const g=beginActivity(...args);return g.pendingActivity?choose(g,activityTestEvents.find(e=>e.id===g.eventId)!.choices.length-1):g}
