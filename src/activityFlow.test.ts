import {act,choose,next,start,createGame,selectActivityEvent,selectEvent,allowed,fight} from './engine';
import {activityEvents} from './data/activities';
import {events} from './data/events';
import {jobs} from './data/world';
import {storage} from './storage';
const assert=(v:unknown,m:string)=>{if(!v)throw Error(m)};
function fixture(seed=7653){const g=start(createGame(seed));g.race=0;g.age=25;g.year=525;g.job='병사';g.state={건강:100,행복:60,재산:500,명성:10,스트레스:10};g.stats={체력:55,지능:55,민첩:55,마력:55,정신력:55,매력:55};return g}
for(const job of jobs){const authored=activityEvents.filter(e=>e.activity==='work'&&e.condition?.job?.includes(job.name));assert(authored.length===5,`${job.name}: five authored tasks`);const g=fixture();g.job=job.name;for(let i=0;i<30;i++){const e=selectActivityEvent(g,'work');assert(e.chain===job.name||e.condition?.job?.includes(job.name),`${job.name}: matching task only`)}}
let saved:Record<string,string>={};(globalThis as any).localStorage={getItem:(k:string)=>saved[k]??null,setItem:(k:string,v:string)=>saved[k]=v};
for(const id of ['study','train','work','rest','social','travel']){
 const source=fixture();const before=JSON.stringify(source);const selected=act(source,id,4);const e=events.find(e=>e.id===selected.eventId)!;
 assert(JSON.stringify(source)===before,'Selection immutable');assert(e.activity===id||id==='work'&&!!e.chain,'Action matched');
 assert(selected.turns===source.turns&&selected.age===source.age&&JSON.stringify(selected.stats)===JSON.stringify(source.stats),'No time/growth before decision');
 assert(act(selected,id)===selected,'No double activity while pending');storage.save(selected);const restored=storage.load()!;
 const index=e.choices.length-1;const result=choose(selected,index);
 assert(JSON.stringify(result)===JSON.stringify(choose(restored,index)),'Pending choice reload deterministic');
 assert(result.phase==='result'&&result.eventFlow==='primary'&&!result.pendingActivity,'Primary result stage');
 assert(result.turns===source.turns+1&&result.age>source.age,'Exactly one activity committed');assert(result.delta.length>0,'Real changes in popup');assert(choose(result,index)===result,'Cannot repeat rewards');
 storage.save(result);assert(JSON.stringify(next(result))===JSON.stringify(next(storage.load()!)),'Follow-up roll survives reload');
 let follow=next(result);if(follow.phase==='event'){
  const re=events.find(e=>e.id===follow.eventId)!;assert(!re.activity&&!re.chain,'Random pool excludes activity tasks');assert(follow.eventFlow==='random','Marked extra event');
  follow=choose(follow,re.choices.findIndex(c=>!c.combat&&allowed(follow,c.condition)));
  assert(follow.turns===result.turns&&follow.age===result.age,'Random event spends no extra turn');
  if(follow.phase==='result')assert(next(follow).phase==='activity','No recursive extra events');
 }
}
let extras=0;for(let i=1;i<=10000;i++){const g=fixture(Math.imul(i,2654435761)>>>0);g.seed=Math.imul(i,2654435761)>>>0;g.phase='result';g.eventFlow='primary';const n=next(g);if(n.phase==='event')extras++}assert(extras>4800&&extras<5200,'50% extra-event rate');
const g=fixture();for(let i=0;i<1000;i++){const e=selectEvent(g,'random');assert(!e.activity&&!e.chain,'Random cannot select action or career-chain events')}
const old=fixture();old.phase='result';old.eventId='quiet';assert(next(old).phase==='activity','Legacy results do not replay activity');old.phase='event';assert(!choose(old,0).pendingActivity,'Legacy choices have no deferred action');
// Correct answer deterministically gives more learning than a wrong answer, regardless of RNG.
const quiz=act(fixture(),'study');quiz.eventId='activity-arithmetic';const correct=choose(quiz,0),wrong=choose(quiz,1);assert(correct.stats.지능>wrong.stats.지능,'Quiz answers affect actual growth');
const magic=act(fixture(),'train');magic.eventId='activity-magic';const trained=choose(magic,1);assert(trained.stats.마력>magic.stats.마력&&trained.stats.체력===magic.stats.체력,'Magic training has correct growth focus');
// A fatal hit must never be healed by the pending activity or charge a second turn.
const doomed=act(fixture(),'adventure');doomed.eventId='forest-spiders';let combat=choose(doomed,0);combat.state.건강=1;if(combat.combat){combat.combat.hp=999;combat=fight(combat,'attack');assert(combat.phase==='dead'&&!combat.pendingActivity,'Fatal combat stays fatal')}
console.log(`Activity flow PASS: 18 x 5 job tasks; six actions; deferred growth/time; deterministic saves; no double gains; legacy saves; quiz; magic; combat. Extra events ${extras}/10000.`);

let escaped=false;for(let seed=1;seed<30&&!escaped;seed++){let g=act(fixture(),'adventure');g.eventId='forest-spiders';g=choose(g,0);g.state.건강=20;g.seed=seed;const result=fight(g,'flee');if(result.phase==='result'){escaped=true;assert(result.turns===g.turns+1&&!result.pendingActivity&&result.metrics.activities.adventure===1,'Injured escape still commits activity exactly once')}}assert(escaped,'Injured escape fixture');
