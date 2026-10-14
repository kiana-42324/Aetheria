import {createGame,eligible,choose,selectEvent} from './engine';
import {reputationEvents} from './data/reputation';
import {reputationCooldown,reputationChance} from './reputation';
const assert=(v:unknown,m:string)=>{if(!v)throw Error(m)};
function adult(){const g=createGame(321);g.age=40;g.race=0;g.turns=20;g.phase='event';return g}
for(let country=0;country<6;country++)for(const target of [2,3,4]){
 const g=adult();g.country=country;g.rank=target-1;g.state.명성=target===2?40:target===3?65:90;
 const e=reputationEvents.find(e=>e.id===`honor-${country}-${target}`)!;
 assert(eligible(g,e),'Eligible honor missing');g.eventId=e.id;
 const accepted=choose(g,0);assert(accepted.rank===target,'Honor rank not applied');assert(accepted.log.at(-1)?.kind==='reputation','Chronicle missing');
 assert(reputationCooldown(accepted)===5,'Missing cooldown');assert(!eligible(accepted,e),'Offer repeats immediately');
 const declined=choose(g,1);assert(declined.rank===g.rank,'Decline changes rank');declined.turns+=5;assert(eligible(declined,e),'Declined offer never returns');
 g.state.명성--;assert(!eligible(g,e),'Low fame accepted');
}
for(const job of ['기사','학자','마법사']){
 const g=adult();g.job='농부';g.education=3;g.state.명성=60;for(const k of Object.keys(g.stats) as (keyof typeof g.stats)[])g.stats[k]=80;
 const e=reputationEvents.find(e=>e.id===`recruit-${job}`)!;assert(eligible(g,e),'Scout missing');g.eventId=e.id;
 const accepted=choose(g,0);assert(accepted.job===job&&!accepted.retired,'Scout did not change job');accepted.turns+=5;assert(!eligible(accepted,e),'Repeated signing bonus');
 g.retired=true;assert(!eligible(g,e),'Retiree recruited');g.retired=false;g.education=0;assert(!eligible(g,e)||job==='기사','Education gate failed');
}
const g=adult();g.country=0;g.rank=0;g.state.명성=90;
const clone=JSON.parse(JSON.stringify(g));assert(selectEvent(g).id===selectEvent(clone).id,'RNG restore differs');
let low=0,high=0;for(let i=1;i<=2000;i++){const base=adult();base.country=0;base.rank=0;base.seed=Math.imul(i,2654435761)>>>0;base.state.명성=40;if(selectEvent(base).reputation)low++;base.seed=Math.imul(i,2654435761)>>>0;base.state.명성=100;if(selectEvent(base).reputation)high++}
assert(high>low*2&&low>0,'Fame does not raise opportunity frequency');assert(reputationChance({...g,state:{...g.state,명성:39}})===0,'Low fame chance');
console.log(`Reputation: 18 honors, 3 careers, decline/cooldown, gates, persistence passed; offers ${low}/2000 at 40 fame, ${high}/2000 at 100 fame.`);
