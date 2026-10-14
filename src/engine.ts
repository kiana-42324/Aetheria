import {spouse,marriageReason,pregnancyReason,weddingCost,childPreparationCost,independenceChance,adult} from './family';
import {growStat,talentWeights,type Talents} from './talents';
import {raceNamePools} from './data/names';
import {encounters,hiddenJobs} from './data/battles';
import {beginBattle,battleStep,magicCost,type BattleAction} from './battle';
import {reputationEligible,reputationChance} from './reputation';
import type {Game,Condition,Effect,Choice,Event,Stage,NPC,Stat,RelationAction} from './types';
import {countries,races,jobs,statNames} from './data/world';
import {events} from './data/events';
import {freshFinance,freshMetrics,money,annualBudget,experience,recordWork,endingDetails} from './systems';
export const clamp=(v:number,min=0,max=100)=>Math.min(max,Math.max(min,v));
export function random(g:{seed:number}) {g.seed=(Math.imul(1664525,g.seed)+1013904223)>>>0;return g.seed/4294967296}
export function integer(g:{seed:number},a:number,b:number){return a+Math.floor(random(g)*(b-a+1))}
export function weighted(g:{seed:number},weights:number[]){let t=random(g)*weights.reduce((a,b)=>a+b,0);for(let i=0;i<weights.length;i++){t-=weights[i];if(t<0)return i}return weights.length-1}
const pick=<T,>(g:{seed:number},a:T[])=>a[integer(g,0,a.length-1)];
export const stage=(g:Game):Stage=>g.age/races[g.race].life<.15?'유년기':g.age/races[g.race].life<.25?'청소년기':g.age/races[g.race].life<.75?'성인기':'노년기';
export const years=(g:Game)=>stage(g)==='노년기'?Math.min(3,Math.max(1,Math.floor(races[g.race].life/80))):clamp(Math.round(races[g.race].life/(stage(g)==='유년기'?35:25)),1,5);
export const log=(g:Game,title:string,text:string,kind='life')=>{g.log.push({year:g.year,age:g.age,title,text,kind})};
export function fullName(g:Game,familyName?:string,race=g.race):string {
 const pool=raceNamePools[race]??raceNamePools[0];
 const used=new Set([...(g.usedNames??[]),g.name,...g.npcs.map(n=>n.name),...g.world.map(w=>w.ruler)].filter(Boolean));
 const families=familyName?[familyName]:pool.family;
 let candidates=families.flatMap(f=>pool.given.map(n=>`${n} ${f}`)).filter(n=>!used.has(n));
 // Exhaustion is finite and deterministic, even with many children in long lives.
 let serial=2;
 while(!candidates.length){candidates=families.flatMap(f=>pool.given.map(n=>`${n}·${serial} ${f}`)).filter(n=>!used.has(n));serial++}
 const name=pick(g,candidates);used.add(name);g.usedNames=[...used];return name;
}
function npc(g:Game,relation:string):NPC {const life=races[g.race].life;return {sex:relation==='부모'?(g.npcs.filter(n=>n.relation==='부모').length%2?'남성':'여성'):['연인','배우자'].includes(relation)?(g.sex==='여성'?'남성':'여성'):(random(g)<.5?'여성':'남성'),lastTalkTurn:g.turns,independent:relation==='자녀'?false:undefined,id:g.npcs.reduce((m,n)=>Math.max(m,n.id),0)+1,name:fullName(g,['부모','형제자매','자녀'].includes(relation)?g.name.split(' ').at(-1):undefined),race:g.race,age:relation==='자녀'?0:relation==='부모'?Math.round(life*.28)+integer(g,0,Math.round(life*.1)):Math.max(0,g.age+integer(g,-2,3)),relation,job:relation==='자녀'?'성장 중':pick(g,jobs).name,affection:relation==='부모'?75:55,alive:true,lastContact:g.year,history:[`${g.year}년 · ${relation} 관계가 시작되었다.`]}}
export function createGame(seed=crypto.getRandomValues(new Uint32Array(1))[0]):Game {const rng={seed};const country=weighted(rng,countries.map(c=>c.population)),race=weighted(rng,countries[country].races),rank=weighted(rng,countries[country].classes);const g:Game={familyVersion:1,familyDebtTurns:0,socialUses:{},version:1,revision:2,eventNpcId:null,debt:0,careers:{},flagTurns:{},assets:[],streak:0,lastActivityId:'',finance:freshFinance(),metrics:freshMetrics(country),epitaph:'',endingReasons:[],id:`life-${seed}-${Date.now()}`,seed:rng.seed,name:'',race,sex:random(rng)<.5?'여성':'남성',country,birthCountry:country,region:'',rank,birthRank:rank,birthYear:500,year:500,age:0,stats:{} as Game['stats'],state:{건강:95,행복:70,재산:[3,18,65,150,350][rank],명성:rank*5,스트레스:5},job:'성장 중',education:0,org:'없음',retired:false,npcs:[],world:countries.map(c=>({economy:c.values[0],security:c.values[1],education:c.values[2],military:c.values[3],stability:c.values[4],event:'평온',ruler:c.ruler,relations:countries.map(()=>50)})),flags:[],seen:[],log:[],phase:'birth',eventId:null,result:'',delta:[],cause:'',ending:'',turns:0,lastActivity:''};g.seed=rng.seed;g.name=fullName(g);g.region=pick(g,countries[country].places);for(const s of statNames)g.stats[s]=clamp(40+integer(g,-20,20)+(races[race].bonus[s]??0));g.npcs.push(npc(g,'부모'));g.npcs.push(npc(g,'부모'));if(random(g)<.4)g.npcs.push(npc(g,'형제자매'));g.talents=Object.fromEntries(statNames.map(s=>[s,weighted(g,talentWeights)+1])) as Talents;g.talentOrigin='birth';log(g,'세상에 첫 숨을 내쉬다',`${countries[country].name}의 ${g.region}. ${countries[country].titles[rank]} 가정에 ${races[race].name} ${g.sex}로 태어났다.`,'birth');return g}
export function allowed(g:Game,c?:Condition):boolean {if(!c)return true;return (!c.canMarry||g.npcs.some(n=>!marriageReason(g,n.id,false)))&&(!c.canConceive||!pregnancyReason(g,false))&&(!c.stage||c.stage.includes(stage(g)))&&(c.race===undefined||c.race===g.race)&&(c.country===undefined||c.country===g.country)&&(!c.job||c.job.includes(g.job))&&(c.rank===undefined||g.rank>=c.rank)&&(!c.flag||g.flags.includes(c.flag))&&(!c.notFlag||!g.flags.includes(c.notFlag))&&(!c.stat||g.stats[c.stat[0]]>=c.stat[1])&&(c.wealth===undefined||g.state.재산>=c.wealth)&&(c.education===undefined||g.education>=c.education)&&(!c.world||g.world[g.country].event===c.world)&&(!c.relation||g.npcs.some(n=>n.alive&&n.relation===c.relation&&n.affection>=(c.affection??0)))&&(!c.flags||c.flags.every(f=>g.flags.includes(f)))&&(!c.since||(g.flagTurns[c.since[0]]!==undefined&&g.turns-g.flagTurns[c.since[0]]>=c.since[1]))&&(c.experience===undefined||experience(g)>=c.experience)&&(c.debt===undefined||g.debt>=c.debt)&&(c.maxDebt===undefined||g.debt<=c.maxDebt)&&(c.combatPower===undefined||combatPower(g)>=c.combatPower)&&(c.health===undefined||g.state.건강>=c.health)}
export function requirement(c?:Condition){if(!c)return '';return [c.canMarry?'성년 연인·호감도 70·혼례 비용 20 G 필요':'',c.canConceive?'배우자·출산 준비금 15 G·임신 가능 상태 필요':'',c.combatPower!==undefined?`전투력 ${c.combatPower} 이상`:'',c.health!==undefined?`건강 ${c.health} 이상`:'',c.wealth!==undefined?`${c.wealth} G 필요`:'',c.stat?`${c.stat[0]} ${c.stat[1]} 이상`:'',c.education!==undefined?`교육 ${c.education}단계`:'',c.rank!==undefined?`신분 ${c.rank} 이상`:'',c.affection!==undefined?`호감도 ${c.affection} 이상`:'',c.maxDebt!==undefined?`부채 ${c.maxDebt} G 이하`:'',c.experience!==undefined?`환산 경력 ${c.experience}년 이상`:'',c.flag?(c.flag==='trade-trust'?'이전 계약에서 약속을 지킨 기록 필요':'선행 선택 기록 필요'):''].filter(Boolean).join(' · ')}
export function combatPower(g:Game){const physical=g.stats.체력*.6+g.stats.민첩*.25+g.stats.정신력*.15;const magical=g.stats.마력*.6+g.stats.지능*.25+g.stats.정신력*.15;return Math.round(clamp(Math.max(physical,magical)*(.6+g.state.건강*.004)+(g.assets.includes('runeblade')?6:0)+(g.flags.includes('fairy-blessing')?3:0)))}
export function probability(g:Game,c:Choice){if(!c.stat&&!c.combat)return 100;let bonus=c.bonus??0;if(c.tag==='craft'&&g.race===2)bonus+=10;if(c.tag==='hunt'&&g.race===3)bonus+=10;return clamp(50+(c.combat?combatPower(g):g.stats[c.stat!])-(c.difficulty??50)+bonus,5,95)}
export function eligible(g:Game,e:Event){return reputationEligible(g,e)&&allowed(g,e.condition)&&(!e.once||!g.seen.includes(e.id))&&e.choices.some(c=>allowed(g,c.condition))}
function apply(g:Game,e:Effect,tag?:Choice['tag'],targetId?:number|null){if(e.marry){const n=g.npcs.find(n=>n.id===targetId)??g.npcs.find(n=>n.alive&&n.relation==='연인'&&n.affection>=70);if(n&&!marriageReason(g,n.id,false))performMarriage(g,n.id)}if(e.pregnant&&!pregnancyReason(g,false))beginPregnancy(g);if(e.stats)for(const s of statNames){const v=e.stats[s];if(v){g.stats[s]=growStat(g,s,v)}}if(e.state)for(const [s,v] of Object.entries(e.state)){const key=s as keyof Game['state'];let n=v!;if(key==='건강'&&n<0&&tag==='combat'&&g.race===5)n*=.9;if(key==='스트레스'&&n>0&&tag==='magic'&&g.race===4)n*=.9;if(key==='재산')money(g,n);else g.state[key]=Math.round(clamp(g.state[key]+n))}if(e.flag&&!g.flags.includes(e.flag)){g.flags.push(e.flag);g.flagTurns[e.flag]=g.turns}if(e.debt){g.debt+=e.debt;g.metrics.maxDebt=Math.max(g.metrics.maxDebt,g.debt)}if(e.asset&&!g.assets.includes(e.asset))g.assets.push(e.asset);if(e.flag==='house'&&!g.assets.includes('house'))g.assets.push('house');if(e.path||e.milestone){const c=g.careers[g.job]??{years:0,path:'아직 정하지 않음',milestones:[]};if(e.path)c.path=e.path;if(e.milestone)c.milestones.push(e.milestone);g.careers[g.job]=c}if(e.job){g.job=e.job;g.retired=false}if(e.rankSet!==undefined)g.rank=clamp(e.rankSet,0,4);if(e.rank)g.rank=clamp(g.rank+e.rank,0,4);if(e.education)g.education=Math.max(g.education,e.education);if(e.org)g.org=e.org;if(e.retire){g.retired=true;g.flags.push('retired')}if(e.travel){const next=pick(g,countries.map((_,i)=>i).filter(i=>i!==g.country));g.country=next;g.region=pick(g,countries[next].places);if(!g.metrics.visited.includes(next))g.metrics.visited.push(next)}if(e.relation){if(e.relation==='배우자'){const n=g.npcs.find(n=>n.alive&&n.relation==='연인');if(n){n.relation='배우자';n.lastTalkTurn=g.turns;n.affection=clamp(n.affection+20);n.history.push(`${g.year}년 · 혼인`)}else g.npcs.push(npc(g,'배우자'))}else if(e.relation==='연인'&&g.npcs.some(n=>n.alive&&['연인','배우자'].includes(n.relation))){const n=g.npcs.find(n=>n.alive&&['연인','배우자'].includes(n.relation))!;n.affection=clamp(n.affection+8)}else if(g.npcs.filter(n=>n.alive).length<20)g.npcs.push(npc(g,e.relation))}if(e.affection){const targets=targetId?g.npcs.filter(n=>n.id===targetId&&n.alive):g.npcs.filter(n=>n.alive&&['부모','형제자매','배우자','자녀'].includes(n.relation));targets.forEach(n=>{n.affection=clamp(n.affection+e.affection!);n.lastContact=g.year;n.history.push(`${g.year}년 · 함께한 선택으로 호감도 ${e.affection!>0?'+':''}${e.affection}`)})}if(e.bond&&targetId){const target=g.npcs.find(n=>n.id===targetId&&n.alive);if(target){if(e.bond==='separate'){if(target.relation==='배우자')g.flags=g.flags.filter(f=>f!=='married');target.relation=target.relation==='배우자'?'옛배우자':'옛연인';target.history.push(`${g.year}년 · 서로의 길을 가기로 했다.`)}else{target.affection=Math.max(55,target.affection);target.lastContact=g.year;target.history.push(`${g.year}년 · 화해하고 약속을 새로 했다.`)}}}}
function diff(before:Game,g:Game){const a:string[]=[];for(const s of statNames){const v=Math.round((g.stats[s]-before.stats[s])*10)/10;if(v)a.push(`${s} ${v>0?'+':''}${v}`)}for(const s of Object.keys(g.state) as (keyof Game['state'])[]){const v=g.state[s]-before.state[s];if(v)a.push(`${s} ${v>0?'+':''}${v}${s==='재산'?' G':''}`)}if(before.debt!==g.debt)a.push(`부채 ${g.debt-before.debt>0?'+':''}${g.debt-before.debt} G`);if(before.country!==g.country)a.push(`${countries[g.country].short}로 이주`);if(before.job!==g.job)a.push(`직업 → ${g.job}`);if(before.rank!==g.rank)a.push(`신분 → ${countries[g.country].titles[g.rank]}`);if(before.education!==g.education)a.push(`교육 ${g.education}단계`);if(before.npcs.length<g.npcs.length)a.push('새 인연');return a}
const worldTypes=['전쟁','흉년','역병','경제 성장','경기 침체','반란','정치 변화','마법 기술 발전'];
function worldYear(g:Game){for(let i=0;i<g.world.length;i++){const w=g.world[i];for(const k of ['economy','security','education','military','stability'] as const)w[k]=clamp(w[k]+integer(g,-2,2));if(random(g)<.13){const t=weighted(g,[4+(100-w.stability)/20,7,4,6+w.economy/20,7,2+(100-w.stability)/12,5,2+w.education/20]);w.event=worldTypes[t];if(t===0){w.security=clamp(w.security-12);w.military=clamp(w.military-5);const other=(i+integer(g,1,5))%6;w.relations[other]=clamp(w.relations[other]-20);g.world[other].relations[i]=w.relations[other]}if(t===1)w.economy=clamp(w.economy-12);if(t===2)w.stability=clamp(w.stability-8);if(t===3)w.economy=clamp(w.economy+12);if(t===4)w.economy=clamp(w.economy-10);if(t===5){w.stability=clamp(w.stability-15);w.security=clamp(w.security-8)}if(t===6){w.ruler=fullName(g,undefined,weighted(g,countries[i].races));w.stability=clamp(w.stability+10)}if(t===7)w.education=clamp(w.education+10);if(i===g.country)log(g,`${countries[i].short} · ${w.event}`,`${g.year}년, 거주 국가에 ${w.event} 소식이 전해졌다.`,'world')}else if(random(g)<.3)w.event='평온'}const w=g.world[g.country];if(w.event==='흉년')apply(g,{state:{재산:g.job==='농부'?(g.flags.includes('farm-coop')||g.flags.includes('farm-irrigation')?-2:-4):-2,건강:-1}});if(w.event==='역병'&&random(g)<.08)apply(g,{state:{건강:-6}});if(w.event==='전쟁'){apply(g,{state:{스트레스:1}});if(['병사','기사','용병'].includes(g.job)&&random(g)<.1)apply(g,{state:{건강:-6}},'combat')};if(w.event==='경제 성장')apply(g,{state:{재산:['상인','대장장이','목수'].includes(g.job)?3:1}});if(w.event==='경기 침체')apply(g,{state:{재산:-1}})}
function die(g:Game,cause:string){g.phase='dead';g.cause=cause;const ending=endingDetails(g);g.ending=ending.title;g.epitaph=ending.epitaph;g.endingReasons=ending.reasons;log(g,'마지막 페이지',`${cause}. ${g.age}년의 삶을 마쳤다.`,'death')}
function advance(g:Game,n:number,working=false){for(let i=0;i<n;i++){g.age++;g.year++;if(g.job==='성장 중'&&stage(g)!=='유년기'){g.job='무직';log(g,'자신의 길을 찾을 때','교육과 직업을 선택할 수 있는 나이가 되었다.','growth')}worldYear(g);annualBudget(g,working);for(const p of g.npcs.filter(n=>n.alive)){p.age++;if(p.job==='성장 중'&&adult(p)){p.job=pick(g,jobs.filter(j=>!hiddenJobs[j.name])).name;if(p.relation==='자녀')p.adultSinceTurn=g.turns;p.history.push(`${g.year}년 · 성년이 되어 ${p.job} 일을 배웠다.`);log(g,`${p.name}의 성년`,`${p.relation}가 성년이 되었다. 자녀는 독립할 때까지 함께 생활한다.`,'family')}if(p.relation!=='배우자'&&g.year-(p.lastContact??g.year)>Math.max(2,races[g.race].life/20)){p.affection=clamp(Math.round((p.affection-.6*80/races[g.race].life)*100)/100)}const r=p.age/races[p.race].life;if(random(g)<(r>.6?Math.pow(r-.6,3)*80/races[p.race].life:.0003)){p.alive=false;p.history.push(`${g.year}년 · 사망`);apply(g,{state:{행복:-6,스트레스:4}});if(p.relation==='배우자')g.flags=g.flags.filter(f=>f!=='married');log(g,`${p.name}와의 이별`,`${p.relation}가 ${p.age}세로 세상을 떠났다.`,'family')}}if(g.debt>40&&random(g)<.25)apply(g,{state:{스트레스:2,행복:-1}});if(g.npcs.some(p=>p.alive&&p.affection>=80&&['배우자','자녀','친구'].includes(p.relation))&&random(g)<.2)apply(g,{state:{행복:1,스트레스:-1}});g.metrics.joyTotal+=g.state.행복;g.metrics.stressTotal+=g.state.스트레스;g.metrics.observations++;const ratio=g.age/races[g.race].life;if(ratio>.65)apply(g,{state:{건강:-Math.max(.5,(ratio-.65)*8/(races[g.race].life/80))}});if(g.state.스트레스>75&&random(g)<.3)apply(g,{state:{건강:-2}});if(g.state.재산===0&&stage(g)!=='유년기'&&random(g)<.2)apply(g,{state:{건강:-2}});const hazard=(ratio>.6?Math.pow(ratio-.6,3)*80/races[g.race].life:0)+.00015+(g.state.건강<25?(25-g.state.건강)*.0008:0);if(g.state.건강<=0){die(g,'병과 쇠약');return}if(random(g)<hazard){die(g,ratio>.75?'노환':g.state.건강<30?'질병':'뜻밖의 사고');return}}}
export const activities=[{id:'study',name:'공부',icon:'book',hint:'지식과 마력을 쌓습니다.'},{id:'work',name:'일하기',icon:'hammer',hint:'수입을 얻고 숙련됩니다.'},{id:'rest',name:'휴식',icon:'leaf',hint:'건강 회복 · 스트레스 감소'},{id:'train',name:'훈련',icon:'sword',hint:'신체·마법·정신을 단련합니다.'},{id:'social',name:'교류',icon:'users',hint:'인연과 마음을 돌봅니다.'},{id:'travel',name:'여행',icon:'compass',hint:'다른 나라로 거처를 옮깁니다.'},{id:'adventure',name:'모험',icon:'sword',hint:'유적과 몬스터를 찾아 탐험합니다.'}];
export function activityReason(g:Game,id:string){if(id==='adventure'){if(stage(g)==='유년기')return '청소년기부터 가능';if(g.state.건강<30)return '건강 30 이상 필요';if(g.state.재산<8)return '탐험 준비금 8 G 필요'}if(id==='work'&&(stage(g)==='유년기'||g.retired))return g.retired?'은퇴 상태':'청소년기부터 가능';if(id==='travel'&&(stage(g)==='유년기'||g.state.재산<12))return stage(g)==='유년기'?'청소년기부터 가능':'12 G 필요';return ''}
function performActivity(source:Game,id:string,destination?:number,person?:{id:number;action:RelationAction}):Game {if(source.phase!=='activity'||!activities.some(a=>a.id===id))return source;if(person&&(id!=='social'||relationReason(source,person.id,person.action)))return source;if(person&&(person.action==='talk'||person.action==='help'))return quickRelation(source,person.id,person.action);const g=structuredClone(source),n=years(g);g.streak=g.lastActivityId===id?g.streak+1:1;g.lastActivityId=id;g.finance=freshFinance();g.metrics.activities[id]=(g.metrics.activities[id]??0)+1;g.turns++;g.lastActivity=activities.find(a=>a.id===id)!.name;g.delta=[];if(id==='study'){if(g.age/races[g.race].life>=.25)money(g,-2*n);apply(g,{stats:{지능:3,마력:2},state:{스트레스:3}},'magic');if(g.stats.지능>=48&&g.education<1)g.education=1;if(g.stats.지능>=62&&g.world[g.country].education>=50)g.education=Math.max(2,g.education);if(g.stats.지능>=78&&g.education===2)g.education=3}if(id==='work'){const j=jobs.find(j=>j.name===g.job);apply(g,{state:{스트레스:7+Math.min(12,(g.streak-1)*3),건강:-2-Math.min(4,g.streak-1)},stats:j?{[j.stat]:2}:{체력:1}});if(j&&random(g)<j.risk/100)apply(g,{state:{건강:-integer(g,3,10)}},['기사','병사','용병','모험가'].includes(g.job)?'combat':undefined)}if(id==='rest')apply(g,{state:{건강:13,행복:g.state.건강>=85&&g.state.스트레스<15?1:5,스트레스:-15}});if(id==='train')apply(g,{stats:g.eventId==='activity-magic'?{마력:4,정신력:2}:g.eventId==='activity-meditation'?{정신력:4,마력:1}:{체력:4,민첩:3},state:{스트레스:4,건강:1}});if(id==='social'){apply(g,{stats:{매력:2},state:{행복:6,스트레스:-4}});if(person)interact(g,person.id,person.action);else{g.npcs.filter(n=>n.alive).sort((a,b)=>a.affection-b.affection).slice(0,3).forEach(p=>{p.affection=clamp(p.affection+4);p.lastContact=g.year;p.lastTalkTurn=g.turns;p.history.push(`${g.year}년 · 함께 시간을 보냈다.`)});if(random(g)<.2)apply(g,{relation:'친구'})}}if(id==='adventure')apply(g,{state:{재산:-8,스트레스:6},stats:{민첩:2,정신력:2}});if(id==='travel'){apply(g,{state:{재산:-12,행복:7},stats:{정신력:2}});if(destination!==undefined&&destination>=0&&destination<6&&destination!==g.country){g.country=destination;g.region=pick(g,countries[destination].places);if(!g.metrics.visited.includes(destination))g.metrics.visited.push(destination)}else apply(g,{travel:true})}log(g,`${g.lastActivity}에 시간을 보내다`,`${n}년 동안 ${g.lastActivity}에 집중했다.`,'activity');advance(g,n,id==='work');if(g.phase!=='dead')familyTurn(g);g.delta=diff(source,g);return g}

function presentEvent(g:Game,e:Event){g.eventId=e.id;g.eventNpcId=e.condition?.relation?g.npcs.filter(n=>n.alive&&n.relation===e.condition!.relation&&n.affection>=(e.condition?.affection??0)).sort((a,b)=>b.affection-a.affection)[0]?.id??null:null;g.phase='event';g.delta=[];}
export function selectActivityEvent(g:Game,id:string){
 const candidates=events.filter(e=>eligible(g,e));
 const chains=id==='work'?candidates.filter(e=>e.chain):[];
 const adventures=id==='adventure'?candidates.filter(e=>e.adventure&&!e.rareChance&&(encounters[e.id]?.tier??1)===(g.adventureTier??1)):[];
 const pool=chains.length?chains:adventures.length?adventures:candidates.filter(e=>e.activity===id);
 return pool[weighted(g,pool.map(e=>e.weight*(g.seen.includes(e.id)?.35:1)))];
}
export function act(source:Game,id:string,destination?:number,person?:{id:number;action:RelationAction}):Game {
 if(source.phase!=='activity'||activityReason(source,id)||!activities.some(a=>a.id===id))return source;
 if(person&&(id!=='social'||relationReason(source,person.id,person.action)))return source;
 if(person&&(person.action==='talk'||person.action==='help'))return quickRelation(source,person.id,person.action);
 const g=structuredClone(source),e=selectActivityEvent(g,id);if(!e)return source;
 g.pendingActivity={id,...(destination!==undefined?{destination}:{}),...(person?{person}:{})};g.eventFlow='primary';presentEvent(g,e);return g;
}
function finishActivity(source:Game):Game {
 const pending=source.pendingActivity;if(!pending)return structuredClone(source);
 const base=structuredClone(source);delete base.pendingActivity;base.phase='activity';
 return performActivity(base,pending.id,pending.destination,pending.person);
}

function resolveChoice(source:Game,index:number,battleWon?:boolean):Game {if(source.phase!=='event')return source;const e=events.find(e=>e.id===source.eventId);const c=e?.choices[index];if(!e||!c||(battleWon===undefined&&!allowed(source,c.condition)))return source;if(c.success.pregnant&&pregnancyReason(source,false))return source;if(c.success.marry){const n=source.npcs.find(n=>n.id===source.eventNpcId)??source.npcs.find(n=>n.alive&&n.relation==='연인');if(!n||marriageReason(source,n.id,false))return source;}let g=structuredClone(source);if(!g.eventNpcId&&e.condition?.relation)g.eventNpcId=g.npcs.find(n=>n.alive&&n.relation===e.condition!.relation)?.id??null;const p=probability(g,c);const success=battleWon??((!c.stat&&!c.combat)||random(g)*100<p);if(battleWon===false&&g.state.건강<=0)delete g.pendingActivity;else g=finishActivity(g);if(g.phase==='dead')return g;const outcome=structuredClone(success?c.success:(c.failure??{}));if(battleWon!==undefined&&outcome.state)delete outcome.state.건강;apply(g,outcome,c.tag,g.eventNpcId);if(source.pendingActivity?.id==='study'){if(g.stats.지능>=48)g.education=Math.max(1,g.education);if(g.stats.지능>=62&&g.world[g.country].education>=50)g.education=Math.max(2,g.education);if(g.stats.지능>=78&&g.education===2)g.education=3}if(c.stat||c.combat){if(success)g.metrics.successes++;else g.metrics.failures++}g.flagTurns[e.id]=g.turns;if(!g.flags.includes(e.id))g.flags.push(e.id);g.result=(success?c.ok:c.fail??'예상과 다른 결과가 남았다.');g.delta=diff(source,g);g.seen.push(e.id);log(g,e.title,`${c.text} → ${g.result}${g.delta.length?' ['+g.delta.join(', ')+']':''}`,e.reputation?'reputation':e.chain?'career':'choice');if(g.eventNpcId){const target=g.npcs.find(n=>n.id===g.eventNpcId);if(target){target.history.push(`${g.year}년 · ${e.title}: ${c.text}`);target.lastContact=g.year}};if(outcome.death){die(g,outcome.death);return g}if(g.state.건강<=0){die(g,c.tag==='combat'?'전투 중 입은 부상':'질병과 부상');return g}g.phase='result';return g}
export function jobReason(g:Game,name:string){const j=jobs.find(j=>j.name===name);if(!j)return '알 수 없는 직업';if(hiddenJobs[name]&&!g.flags.includes('hidden-'+name))return hiddenJobs[name]+' 완료 후 히든 직업 보상 선택 필요';if(['유년기'].includes(stage(g)))return '청소년기부터 가능';if(g.stats[j.stat]<j.min)return `${j.stat} ${j.min} 필요`;if(g.education<j.education)return `교육 ${j.education}단계 필요`;if(g.state.재산<j.wealth)return `${j.wealth} G 필요`;if(name==='기사'&&g.rank<2&&g.state.명성<30)return '신분 2 또는 명성 30 필요';return ''}
export function setJob(source:Game,name:string){if(source.phase!=='activity'||jobReason(source,name))return source;const g=structuredClone(source);g.job=name;g.retired=false;g.org=['학자','마법사'].includes(name)?'학술·마법회':['목수','대장장이'].includes(name)?'장인 조합':['기사','병사'].includes(name)?'국가 군단':'없음';log(g,'새로운 일',`${name}의 길을 걷기 시작했다.`,'job');return g}
export const start=(source:Game):Game=>source.phase==='birth'?{...source,phase:'activity'}:source;
export function next(source:Game):Game {
 if(source.phase!=='result'||source.battleReward)return source;
 const g=structuredClone(source);
 if(g.eventFlow==='primary'){
  g.eventFlow='random';
  if(random(g)<.5){const e=selectEvent(g,'random');if(e){presentEvent(g,e);return g}}
  log(g,'평온하게 지나간 시간','활동 뒤에는 별다른 돌발 사건이 없었다.','daily');
 }
 delete g.eventFlow;delete g.pendingActivity;g.phase='activity';g.eventId=null;g.eventNpcId=null;return g;
}

export function relationReason(g:Game,id:number,action:RelationAction){const n=g.npcs.find(n=>n.id===id);if(!n)return '인물을 찾을 수 없음';if(g.phase!=='activity')return '활동 선택 단계에서 가능';if(action==='remember')return n.alive?'살아 있는 인연입니다.':'';if(!n.alive)return '고인이 된 인연입니다.';if((action==='talk'||action==='help')&&g.socialUses?.[action]===g.turns)return '이번 턴에 이미 사용했습니다';if(action==='help'&&g.state.재산<10)return '10 G 필요';if(action==='learn'&&!['스승','부모','친구','배우자','형제자매'].includes(n.relation))return '부모·친구·배우자·형제자매·스승에게 배울 수 있습니다.';return ''}
function interact(g:Game,id:number,action:RelationAction){const n=g.npcs.find(n=>n.id===id)!;g.metrics.interactions++;n.lastContact=g.year;const labels={talk:'마음을 나누다',help:'선물을 건네다',learn:'경험을 배우다',remember:'추억을 돌아보다'};if(action==='talk'){n.lastTalkTurn=g.turns;n.affection=clamp(n.affection+14);apply(g,{state:{행복:4,스트레스:-3}})}if(action==='help'){money(g,-10);n.affection=clamp(n.affection+22);apply(g,{state:{명성:2}})}if(action==='learn'){const stat=jobs.find(j=>j.name===n.job)?.stat??'지능';apply(g,{stats:{[stat]:4},state:{스트레스:2}});n.affection=clamp(n.affection+8)}if(action==='remember'){apply(g,{state:{행복:5,스트레스:-6},stats:{정신력:2}});if(!g.metrics.memories.includes(n.name))g.metrics.memories.push(n.name)}n.history.push(`${g.year}년 · ${labels[action]}`);log(g,`${n.name}와의 시간`,`${n.relation}와 ${labels[action]}.`, 'relationship')}

export function selectEvent(g:Game,activity=g.lastActivityId){const available=events.filter(e=>!e.activity&&!e.chain&&eligible(g,e));const rare=available.filter(e=>e.rareChance);for(const event of rare)if(random(g)<event.rareChance!)return event;const offers=available.filter(e=>e.reputation);if(offers.length&&random(g)*100<reputationChance(g))return pick(g,offers);const normal=available.filter(e=>!e.rareChance&&!e.reputation);const adventures=normal.filter(e=>e.adventure&&(encounters[e.id]?.tier??1)===(g.adventureTier??1));const pool=activity==='adventure'&&adventures.length?adventures:normal;return pool[weighted(g,pool.map(e=>e.weight*(g.seen.includes(e.id)?.25:1)*(e.adventure?(activity==='travel'?1.8:.25):1)))]}

export function choose(source:Game,index:number):Game {
 if(source.phase!=='event'||source.combat)return source;
 const e=events.find(e=>e.id===source.eventId),c=e?.choices[index];
 if(!e||!c||!allowed(source,c.condition))return source;
 if(c.combat&&encounters[e.id]){const g=structuredClone(source);beginBattle(g,index);return g}
 return resolveChoice(source,index);
}
export function fight(source:Game,action:BattleAction):Game {
 if(source.phase!=='event'||!source.combat||!encounters[source.eventId!]||!['attack','magic','guard','heal','flee'].includes(action))return source;
 if(action==='magic'&&source.combat.mana<magicCost(source)||action==='heal'&&(!source.combat.potions||source.state.건강>=100))return source;
 let g=structuredClone(source);const battle=g.combat!,encounter=encounters[g.eventId!];
 const outcome=battleStep(g,action,()=>random(g));
 if(outcome==='ongoing')return g;
 delete g.combat;
 if(outcome==='fled'){
  g=finishActivity(g);if(g.phase==='dead')return g;
  g.phase='result';g.result=`${encounter.name}에게서 도주했다. 건강 ${g.state.건강}으로 살아 돌아왔으며 보상은 받지 못했다.`;
  g.delta=diff({...source,state:{...source.state,건강:battle.startHealth}},g);g.seen.push(g.eventId!);g.flagTurns[g.eventId!]=g.turns;
  log(g,'모험에서 귀환',g.result,'choice');return g;
 }
 const result=resolveChoice(g,battle.choice,outcome==='win');
 result.delta.push(`전투 중 건강 변화 ${g.state.건강-battle.startHealth}`);
 if(outcome==='win'&&result.phase!=='dead'){const before=structuredClone(result);apply(result,{stats:battle.usedMagic?{마력:2,지능:1,정신력:1}:{체력:2,민첩:1,정신력:1}});const growth=diff(before,result);result.delta.push(...growth);log(result,'전투를 통해 성장하다',(battle.usedMagic?'마법 전투':'무기 전투')+' 경험 · '+growth.join(', '),'growth');}

 if(outcome==='win'&&encounter.achievement&&!result.flags.includes('achievement-'+encounter.achievement)){
  result.flags.push('achievement-'+encounter.achievement);
  result.battleReward={achievement:encounter.achievement,job:encounter.hiddenJob!};
  result.result+=` 업적 「${encounter.achievement}」 해금! 진로 보상을 선택하세요.`;
  log(result,'업적 해금 · '+encounter.achievement,'최초 도전을 완수했다.','achievement');
 }
 return result;
}
export function claimBattleReward(source:Game,reward:'rank'|'job'):Game {
 if(source.phase!=='result'||!source.battleReward||!['rank','job'].includes(reward))return source;
 const g=structuredClone(source),offer=g.battleReward!;
 if(reward==='rank'){
  if(g.rank<4){g.rank++;g.result=`공로를 인정받아 ${countries[g.country].titles[g.rank]}의 지위를 얻었다.`}
  else {money(g,200);g.result='이미 최고 지위에 올라 특별 포상금 200 G를 받았다.'}
 }else{
  g.flags.push('hidden-'+offer.job);g.job=offer.job;g.retired=false;g.org='전설의 모험가 연맹';
  g.result=`히든 직업 「${offer.job}」을 선택했다. 이후 일하기 수입과 위험도가 새 직업에 맞게 바뀐다.`;
 }
 delete g.battleReward;g.delta=[...source.delta,...diff(source,g)];log(g,'전설의 보상',g.result,'achievement');return g;
}

export function quickRelation(source:Game,id:number,action:'talk'|'help'):Game {
 if(relationReason(source,id,action))return source;
 const g=structuredClone(source);g.socialUses??={};g.socialUses[action]=g.turns;
 interact(g,id,action);g.delta=diff(source,g);return g;
}
function performMarriage(g:Game,id:number){const n=g.npcs.find(n=>n.id===id)!;money(g,-weddingCost);n.relation='배우자';n.lastTalkTurn=g.turns;n.lastContact=g.year;g.familyDebtTurns=0;g.state.행복=clamp(g.state.행복+15);if(!g.flags.includes('married'))g.flags.push('married');n.history.push(`${g.year}년 · 혼례 비용 ${weddingCost} G로 결혼했다.`)}
export function marry(source:Game,id:number):Game{if(marriageReason(source,id))return source;const g=structuredClone(source);performMarriage(g,id);log(g,'함께할 내일',`${g.npcs.find(n=>n.id===id)!.name}와 결혼했다. 혼례 비용 ${weddingCost} G. 부부 소득과 생활비를 합산한다.`,'family');g.delta=diff(source,g);return g}
function beginPregnancy(g:Game){const n=spouse(g)!;money(g,-childPreparationCost);g.pregnancy={motherId:g.sex==='여성'?'player':n.id,partnerId:n.id,dueTurn:g.turns+1};log(g,'새 생명의 소식',`임신했다. 출산 준비금 ${childPreparationCost} G. 다음 활동 1턴 동안 여성 측 소득이 중단되며, 다음 턴에 아이가 태어난다.`,'family')}
export function planChild(source:Game):Game{if(pregnancyReason(source))return source;const g=structuredClone(source);beginPregnancy(g);g.delta=diff(source,g);return g}
export function familyTurn(g:Game){
 // Once per completed activity, never once per simulated year or free interaction.
 if(g.pregnancy&&g.turns>=g.pregnancy.dueTurn){
  const motherAlive=g.pregnancy.motherId==='player'||g.npcs.some(n=>n.id===g.pregnancy!.motherId&&n.alive);
  if(motherAlive){const child=npc(g,'자녀');g.npcs.push(child);g.state.행복=clamp(g.state.행복+12);g.state.스트레스=clamp(g.state.스트레스+5);log(g,`${child.name}의 탄생`,'아이가 태어났다. 여성 측 소득이 재개되고, 독립 전까지 연 생활비가 2 G 증가한다.','family')}
  else log(g,'임신 기록의 끝','배우자와의 사별로 출산을 진행하지 못했다.','family');
  delete g.pregnancy;
 }
 const n=spouse(g);
 if(n){g.familyDebtTurns=g.debt>=20?(g.familyDebtTurns??0)+1:0;const silent=g.turns-(n.lastTalkTurn??g.turns),before=n.affection;
  const debtLoss=g.familyDebtTurns>=3?Math.min(12,5+2*(g.familyDebtTurns-3)):0;
  const silenceLoss=silent>=3?Math.min(12,5+2*(silent-3)):0;
  if(debtLoss||silenceLoss){n.affection=clamp(n.affection-debtLoss-silenceLoss);const note=`빚 부담 −${debtLoss}, 대화 단절 −${silenceLoss} · 호감도 ${n.affection}`;n.history.push(`${g.year}년 · ${note}`);log(g,'부부 사이의 거리',note,'relationship')}
  if(n.affection<50&&before>=50)log(g,'결혼 생활의 경고','배우자의 호감도가 50 미만이다. 대화와 선물, 빚 상환이 필요하다.','family');
  if(n.affection<30&&random(g)*100<Math.min(60,Math.max(5,(30-n.affection)*2))){n.relation='옛배우자';g.flags=g.flags.filter(f=>f!=='married');g.familyDebtTurns=0;g.state.행복=clamp(g.state.행복-15);n.history.push(`${g.year}년 · 이혼했다.`);log(g,'서로 다른 길',`${n.name}와 이혼했다. 배우자 소득과 생활비 합산을 종료한다. 자녀의 양육은 이어진다.`,'family')}
 }else g.familyDebtTurns=0;
 for(const child of g.npcs.filter(n=>n.alive&&n.relation==='자녀'&&!n.independent&&adult(n))){child.adultSinceTurn??=g.turns;const chance=independenceChance(g,child);if(random(g)*100<chance){child.independent=true;child.history.push(`${g.year}년 · 가정을 떠나 독립했다.`);log(g,`${child.name}의 독립`,`${child.job}의 길을 따라 독립했다. 이제 이 자녀의 생활비를 부담하지 않는다.`,'family')}}
}
