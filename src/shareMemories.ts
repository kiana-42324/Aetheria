import type {Entry,Game} from './types';
import {events} from './data/events';

const byTitle=new Map(events.map(e=>[e.title,e]));
function importance(entry:Entry):number {
  const e=byTitle.get(entry.title);
  if(e?.rareChance||e?.category==='보스')return 100;
  if(entry.kind==='achievement')return 110;
  if(entry.kind==='reputation')return 85;
  if(entry.kind==='career')return 75;
  if(entry.kind==='family')return 70;
  if(entry.kind==='job')return 65;
  if(e?.once)return 60;
  if(e?.adventure)return 55;
  if(entry.kind==='growth')return 50;
  if(entry.kind==='choice')return 45;
  if(entry.kind==='relationship')return 35;
  return 25;
}

/** One most-important memory, then coverage of each third of the actual life.
 * Read the full log, never the recent-only UI highlights. Preserve chronological
 * order in the card and stable earliest tie-breaking; never change game state.
 */
export function shareMemories(g:Pick<Game,'log'|'age'>):Entry[]{
  const seen=new Set<string>();
  const candidates=g.log.flatMap((entry,index)=>{
    if(['birth','death','world','activity'].includes(entry.kind))return [];
    const key=`${entry.title}\n${entry.text}`;
    if(seen.has(key))return [];seen.add(key);
    return [{entry,index,score:importance(entry),period:Math.min(2,Math.floor(entry.age/Math.max(1,g.age)*3))}];
  }).sort((a,b)=>b.score-a.score||a.entry.age-b.entry.age||a.index-b.index);
  const selected:typeof candidates=[];
  if(candidates[0])selected.push(candidates[0]);
  for(let period=0;period<3;period++){
    if(selected.some(c=>c.period===period))continue;
    const next=candidates.find(c=>c.period===period);
    if(next)selected.push(next);
  }
  for(const candidate of candidates){
    if(selected.length===4)break;
    if(!selected.includes(candidate))selected.push(candidate);
  }
  return selected.sort((a,b)=>a.entry.age-b.entry.age||a.entry.year-b.entry.year||a.index-b.index).map(c=>c.entry);
}
