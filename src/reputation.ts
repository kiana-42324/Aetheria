import type {Game,Event} from './types';
import {jobs} from './data/world';
import {reputationEvents} from './data/reputation';
export function reputationCooldown(g:Game){const last=Math.max(-100,...reputationEvents.map(e=>g.flagTurns[e.id]??-100));return Math.max(0,5-(g.turns-last))}
export function reputationChance(g:Game){return g.state.명성<40?0:Math.min(14,2+(g.state.명성-40)*.2)}
export function reputationEligible(g:Game,e:Event){const r=e.reputation;if(!r)return true;
 if(g.state.명성<r.fame||reputationCooldown(g)>0)return false;
 if(r.rank!==undefined)return g.rank<r.rank&&(r.rank===2||g.rank===r.rank-1);
 const target=jobs.find(j=>j.name===r.job),current=jobs.find(j=>j.name===g.job);
 return !!target&&!g.retired&&g.job!==r.job&&!g.flags.includes(`recruited-${r.job}`)&&g.education>=target.education-1&&(current?.income??0)<target.income;
}
