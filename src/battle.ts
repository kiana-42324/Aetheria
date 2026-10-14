import type {Game} from './types';
import {encounters} from './data/battles';
export type BattleAction='attack'|'magic'|'guard'|'heal'|'flee';
export interface Battle {usedMagic?:boolean;choice:number;hp:number;wave:number;round:number;mana:number;maxMana:number;potions:number;startHealth:number;log:string[]}
export function beginBattle(g:Game,choice:number){const b=encounters[g.eventId!];const maxMana=Math.round(16+g.stats.마력*.25);g.combat={choice,hp:b.hp,wave:1,round:1,mana:maxMana,maxMana,potions:b.tier===3?3:2,startHealth:g.state.건강,log:['전투 시작. 적의 강타 예고를 보고 방어하세요.']}}
export function magicCost(g:Game){return g.race===4?5:6}
export function battleStep(g:Game,action:BattleAction,rng:()=>number):'ongoing'|'win'|'lose'|'fled'{
 const s=g.combat!,b=encounters[g.eventId!];const messages:string[]=[];
 if(action==='flee'){
  const chance=Math.max(.2,Math.min(.85,.55+g.stats.민첩*.003-b.tier*.08+(g.race===3?.1:0)));
  if(rng()<chance){s.log.push('전투에서 벗어났다. 보상은 받지 못했다.');return 'fled'}messages.push('도주 실패! 적이 퇴로를 막았다.');
 }else if(action==='heal'){s.potions--;g.state.건강=Math.min(100,g.state.건강+30);messages.push('회복약으로 건강 30 회복.');
 }else if(action==='guard'){s.mana=Math.min(s.maxMana,s.mana+7);messages.push('방어 태세. 받는 피해 75% 감소 · 마력 7 회복.');
 }else{
  const magic=action==='magic';if(magic){s.mana-=magicCost(g);s.usedMagic=true;}
  const power=magic?g.stats.마력*.7+g.stats.지능*.3:g.stats.체력*.7+g.stats.민첩*.3;
  const damage=Math.max(4,Math.round(8+power*.25+(magic?8:0)+(g.assets.includes('runeblade')?4:0)+(g.flags.includes('fairy-blessing')?2:0)-(magic?0:b.armor)+(rng()*6-3)));
  s.hp=Math.max(0,s.hp-damage);messages.push(`${magic?'마법':'공격'}으로 ${damage} 피해.`);
 }
 if(s.hp<=0){if(s.wave<(b.waves??1)){s.wave++;s.hp=b.hp;s.round=1;s.mana=Math.min(s.maxMana,s.mana+6);messages.push(`${s.wave}번째 방으로 진입. 마력 6 회복.`);s.log=[...s.log,...messages].slice(-8);return 'ongoing'}s.log=[...s.log,...messages,'적을 쓰러뜨렸다!'].slice(-8);return 'win'}
 const heavy=s.round%3===0;
 const damage=Math.max(1,Math.round((b.attack*(heavy?1.9:1)-g.stats.정신력*.035+rng()*3)*(action==='guard'?.25:1)*(g.race===5?.9:1)));
 g.state.건강=Math.max(0,g.state.건강-damage);messages.push(`${heavy?'강타':'적의 공격'}! 건강 −${damage}.`);s.round++;s.log=[...s.log,...messages].slice(-8);
 return g.state.건강<=0?'lose':'ongoing';
}
