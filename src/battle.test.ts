import {createGame,start,choose,fight,next,claimBattleReward,jobReason,selectEvent} from './engine';
import {encounters} from './data/battles';
import {events} from './data/events';
import {magicCost} from './battle';
import {storage} from './storage';
import type {Game} from './types';
const assert=(v:unknown,m:string)=>{if(!v)throw Error(m)};
export function prepared(id:string,seed=99){const g=start(createGame(seed));g.race=0;g.age=30;g.year=530;g.phase='event';g.eventId=id;g.state.건강=100;g.state.재산=100;g.debt=0;for(const k of Object.keys(g.stats) as (keyof Game['stats'])[])g.stats[k]=85;return g}
export function finish(g:Game):Game{for(let i=0;i<150&&g.combat;i++){const b=g.combat;g=fight(g,g.state.건강<60&&b.potions?'heal':b.round%3===0?'guard':b.mana>=magicCost(g)?'magic':'attack')}return g}
for(const id of Object.keys(encounters)){
 let wins=0;for(let seed=1;seed<=20;seed++){
  const g=prepared(id,seed),e=events.find(e=>e.id===id)!,index=e.choices.findIndex(c=>c.combat);const begun=choose(g,index);
  assert(!!begun.combat&&begun.phase==='event','Combat did not start '+id);assert(begun.state.재산===g.state.재산,'Premature loot');assert(choose(begun,index)===begun,'Combat restarted');
  const snapshot=JSON.stringify(begun);const out=finish(begun);assert(JSON.stringify(begun)===snapshot,'Mutates source');assert(!out.combat&&['result','dead'].includes(out.phase),'Combat stuck '+id);
  if(out.phase==='result'){wins++;assert(out.state.재산>g.state.재산,'Missing reward '+id);if(encounters[id].achievement){assert(!!out.battleReward,'No choice reward');assert(next(out)===out,'Reward bypass');const rank=claimBattleReward(out,'rank');assert(!rank.battleReward&&rank.rank===Math.min(4,out.rank+1),'Rank reward');const job=claimBattleReward(out,'job');assert(job.job===encounters[id].hiddenJob&&job.flags.includes('hidden-'+job.job),'Hidden unlock');assert(!jobReason(job,job.job),'Unlocked job unavailable');assert(claimBattleReward(job,'job')===job,'Reward twice');}}
 }
 assert(wins>=15,'Prepared adventurer cannot win reliably '+id+': '+wins);
}
let g=choose(prepared('dragon-hunt'),0);g.combat!.mana=0;assert(fight(g,'magic')===g,'Insufficient mana');g.combat!.potions=0;assert(fight(g,'heal')===g,'No potions');g.state.건강=1;g=fight(g,'attack');assert(g.phase==='dead'&&!g.battleReward&&g.log.at(-1)?.kind==='death','Death not finalized');
g=choose(prepared('endless-labyrinth'),0);g=fight(g,'magic');const restored=JSON.parse(JSON.stringify(g));assert(JSON.stringify(fight(g,'attack'))===JSON.stringify(fight(restored,'attack')),'Reload rerolls combat');
let data:Record<string,string>={};(globalThis as any).localStorage={getItem:(k:string)=>data[k]??null,setItem:(k:string,v:string)=>data[k]=v};storage.save(g);assert(JSON.stringify(storage.load())===JSON.stringify(g),'Battle not saved');
let fled=false;for(let seed=1;seed<30&&!fled;seed++){let a=choose(prepared('slime-well',seed),0);a=fight(a,'flee');if(!a.combat){fled=true;assert(a.phase==='result'&&a.state.재산===100&&!a.battleReward,'Flee gives rewards')}}assert(fled,'Flee unreachable');
for(const tier of [1,2,3] as const){const a=prepared('slime-well');a.adventureTier=tier;a.seen.push('dragon-shadow');for(let i=0;i<100;i++){const e=selectEvent(a,'adventure');assert((encounters[e.id]?.tier??1)===tier,'Wrong adventure tier')}}
assert(!!jobReason(prepared('slime-well'),'용사'),'Hidden job available before unlock');
console.log('Battle PASS: 15 encounters × 20 seeds, real damage/loot, 3-wave dungeon, death/flee, reward exclusivity, hidden careers, tiers and save/reload.');
