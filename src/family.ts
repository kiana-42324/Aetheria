import type {Game,NPC} from './types';
import {races,jobs} from './data/world';
export const weddingCost=20;
export const childPreparationCost=15;
export const spouse=(g:Game)=>g.npcs.find(n=>n.alive&&n.relation==='배우자');
export const adult=(n:{age:number;race:number})=>n.age/races[n.race].life>=.25;
export function spouseIncome(g:Game){const n=spouse(g);if(!n||g.pregnancy?.motherId===n.id)return 0;const j=jobs.find(j=>j.name===n.job);return j?Math.max(1,Math.round(j.income*(.55+g.world[g.country].economy/100)*.8)):0}
export function playerOnLeave(g:Game){return g.pregnancy?.motherId==='player'}
export function marriageReason(g:Game,id:number,checkPhase=true){const n=g.npcs.find(n=>n.id===id);if(checkPhase&&g.phase!=='activity')return '활동 선택 단계에서 가능';if(!n?.alive||n.relation!=='연인')return '살아 있는 연인과 가능';if(spouse(g))return '이미 배우자가 있습니다';if(!adult(g)||!adult(n))return '두 사람 모두 성년부터 가능';if(n.affection<70)return '호감도 70 이상 필요';if(g.state.재산<weddingCost)return `혼례 비용 ${weddingCost} G 필요`;return ''}
export function pregnancyReason(g:Game,checkPhase=true){if(checkPhase&&g.phase!=='activity')return '활동 선택 단계에서 가능';const n=spouse(g);if(!n)return '배우자가 있어야 합니다';if(g.pregnancy)return '이미 임신 중입니다';if(!adult(g)||!adult(n))return '두 사람 모두 성년부터 가능';if(g.sex===n.sex)return '여성과 남성 배우자 사이에서 임신 가능';if(g.state.재산<childPreparationCost)return `출산 준비금 ${childPreparationCost} G 필요`;if(g.npcs.filter(n=>n.alive).length>=20)return '주요 인물 20명 제한';return ''}
export function independenceChance(g:Game,n:NPC){return Math.min(100,Math.max(0,g.turns-(n.adultSinceTurn??g.turns))*3+30)}
// Migration is deterministic and never changes past names, logs, RNG or outcomes.
export function ensureFamily(source:Game):Game{if(source.familyVersion===1)return source;const g=structuredClone(source);g.familyVersion=1;g.familyDebtTurns=0;g.socialUses??={};for(const [i,n] of g.npcs.entries()){
 n.sex??=['연인','배우자','옛연인','옛배우자'].includes(n.relation)?(g.sex==='여성'?'남성':'여성'):(i%2?'여성':'남성');
 n.lastTalkTurn??=g.turns;
 if(n.relation==='자녀'){n.independent??=adult(n)&&n.job!=='성장 중';if(adult(n))n.adultSinceTurn??=g.turns}
 }return g}
