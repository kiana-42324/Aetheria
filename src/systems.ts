import {ensureFamily,spouse,spouseIncome,playerOnLeave} from './family';
import {ensureTalents} from './talents';
import type {Game,Finance,LifeMetrics,Career} from './types';
import {races,jobs,countries} from './data/world';
export const freshFinance=():Finance=>({income:0,expenses:0,interest:0,repaid:0,years:0});
export const freshMetrics=(country:number):LifeMetrics=>({activities:{},income:0,expenses:0,repaid:0,maxDebt:0,workYears:0,joyTotal:0,stressTotal:0,observations:0,interactions:0,successes:0,failures:0,visited:[country],memories:[],legacyBaseline:false});
export function upgrade(source:Game):Game {return ensureFamily(ensureTalents(upgradeBase(source)))}
function upgradeBase(source:Game):Game {if(source.revision===2)return source;const g=structuredClone(source);g.revision=2;g.eventNpcId=null;g.debt=0;g.careers={};g.flagTurns={};g.assets=g.flags.includes('house')?['house']:[];g.streak=0;g.lastActivityId='';g.finance=freshFinance();g.metrics=freshMetrics(g.country);g.metrics.legacyBaseline=true;g.epitaph='';g.endingReasons=[];for(const n of g.npcs)n.lastContact=g.year;return g}
export function career(g:Game,job=g.job):Career{return g.careers[job]??{years:0,path:'아직 정하지 않음',milestones:[]}}
export function experience(g:Game,job=g.job){return career(g,job).years*80/races[g.race].life}
export function careerLevel(g:Game,job=g.job){const e=experience(g,job);return e>=25?'원숙':e>=12?'숙련':e>=4?'정착':'입문'}
export function recordWork(g:Game){const c=g.careers[g.job]??{years:0,path:'아직 정하지 않음',milestones:[]};c.years++;g.careers[g.job]=c;g.metrics.workYears++}
export function money(g:Game,amount:number){amount=Math.round(amount);if(amount<0){const cost=-amount;g.finance.expenses+=cost;g.metrics.expenses+=cost;const short=Math.max(0,cost-g.state.재산);g.state.재산=Math.max(0,g.state.재산-cost);g.debt+=short;g.metrics.maxDebt=Math.max(g.metrics.maxDebt,g.debt)}else{const repay=Math.min(g.debt,Math.floor(amount*.25));g.debt-=repay;g.finance.repaid+=repay;g.metrics.repaid+=repay;g.finance.income+=amount;g.metrics.income+=amount;g.state.재산+=amount-repay}}
export function livingCost(g:Game){if(g.age/races[g.race].life<.25)return 0;const kids=g.npcs.filter(n=>n.alive&&n.relation==='자녀'&&!n.independent).length;return Math.max(2,(g.retired?3:5)+(spouse(g)?3:0)+kids*2-(g.assets.includes('house')?1:0))}
export function annualIncome(g:Game){if(playerOnLeave(g))return 0;const j=jobs.find(j=>j.name===g.job);let pay=(j?.income??7)*(.55+g.world[g.country].economy/100)*(.8+Math.min(.4,experience(g)/60));if(g.job==='농부'&&g.assets.includes('farmland'))pay*=1.2;if(g.job==='상인'&&g.assets.includes('shop'))pay*=1.2;if(g.job==='마법사'&&g.assets.includes('laboratory'))pay*=1.15;return Math.max(1,Math.round(pay))}
export function pension(g:Game){return !playerOnLeave(g)&&g.retired&&Object.keys(g.careers).some(j=>experience(g,j)>=12)?3:0}
export function annualBudget(g:Game,working:boolean){g.finance.years++;if(working&&!playerOnLeave(g)){recordWork(g);money(g,annualIncome(g))}else if(pension(g))money(g,pension(g));if(spouseIncome(g))money(g,spouseIncome(g));money(g,-livingCost(g));if(g.debt>0){const interest=Math.max(1,Math.round(g.debt*.01));g.debt+=interest;g.finance.interest+=interest;g.metrics.maxDebt=Math.max(g.metrics.maxDebt,g.debt)}}
export function repayDebt(source:Game){if(source.phase!=='activity'||source.debt<=0||source.state.재산<=0)return source;const g=structuredClone(source);const amount=Math.min(g.state.재산,g.debt);g.state.재산-=amount;g.debt-=amount;g.metrics.repaid+=amount;g.finance.repaid+=amount;g.log.push({year:g.year,age:g.age,title:'빚을 갚다',text:`${amount} G 상환. 남은 빚 ${g.debt} G.`,kind:'finance'});return g}
export function activityPreview(g:Game,id:string,n:number){const cost=livingCost(g)*n;const fee=id==='study'&&g.age/races[g.race].life>=.25?2*n:id==='travel'?12:0;const income=((id==='work'?annualIncome(g):pension(g))+spouseIncome(g))*n;return `예상 수입 ${income} G · 생활비 ${cost} G${fee?` · 활동비 ${fee} G`:''}${g.debt?' · 수입 25% 자동 상환':''}`}
export function averageJoy(g:Game){return g.metrics.observations?Math.round(g.metrics.joyTotal/g.metrics.observations):g.state.행복}
export function endingDetails(g:Game){const m=g.metrics;const top=Object.entries(g.careers).sort((a,b)=>b[1].years-a[1].years)[0];const close=g.npcs.filter(n=>n.affection>=70&&['배우자','자녀','친구','부모'].includes(n.relation));const joy=averageJoy(g);const candidates:{title:string;epitaph:string;reason:string;score:number}[]=[];
const add=(ok:boolean,title:string,epitaph:string,reason:string,score:number)=>{if(ok)candidates.push({title,epitaph,reason,score})};
add(g.flags.includes('dragon-slayer'),'하늘의 공포를 꺾은 이','그날 하늘을 가린 그림자는, 그의 이름 앞에서 마지막으로 날개를 접었다.','희귀 고룡과의 전투에서 승리했습니다.',150);
add(g.flags.includes('farmer-legacy'),'땅에 남은 계절','그가 돌보던 땅에서는, 여전히 누군가의 내일이 자란다.','농부의 경력을 마치고 농지 또는 기술을 다음 세대에 남겼습니다.',110);
add(g.flags.includes('merchant-legacy'),'사람과 길을 이은 상인','장부가 닫힌 뒤에도, 그가 쌓은 신뢰는 길 위에 남았다.','상인의 연속 사건을 마치고 거래망의 미래를 선택했습니다.',110);
add(g.flags.includes('mage-legacy'),'불빛을 나눈 마법사','하나의 등불이 꺼졌지만, 그에게 배운 손들이 빛을 이어 갔다.','마법사의 연속 사건을 마치고 연구 또는 가르침을 남겼습니다.',110);
add(m.maxDebt>=30&&g.debt===0&&m.repaid>=30,'다시 일어선 생활','무너진 날들도 있었지만, 다시 지은 하루가 더 많았다.',`최대 ${m.maxDebt} G의 빚을 겪고 모두 갚았습니다.`,100);
add(close.length>=3&&m.interactions>=5,'누군가의 따뜻한 고향','돌아갈 곳을 묻는 이들에게, 그는 한 사람의 이름이었다.',`깊은 인연 ${close.length}명과 직접 교류 ${m.interactions}회를 남겼습니다.`,95);
add(g.flags.includes('discovery'),'미지에 이름을 남긴 이','그가 남긴 질문은, 다음 사람의 출발점이 되었다.','연구 또는 유적 해독에서 발견을 기록했습니다.',90);
add(!!top&&experience(g,top[0])>=18,'익숙한 일을 깊이 사랑한 사람','커다란 칭호 대신, 매일 쌓인 손의 기억을 남겼다.',top?`${top[0]}으로 ${top[1].years}년 일하며 오랜 숙련을 쌓았습니다.`:'',85);
add(m.visited.length>=5,'국경 너머의 이웃','그에게 세상은 지도가 아니라, 만났던 얼굴들의 이름이었다.',`${m.visited.length}개 국가에서 생활했습니다.`,80);
add(g.flags.includes('legacy')||g.npcs.some(n=>n.relation==='제자'),'다음 계절의 스승','배움은 그의 생보다 오래 살아남았다.','기술을 전수하거나 다음 세대를 위한 유산을 남겼습니다.',75);
add(g.rank>=3&&g.flags.includes('civic'),'마을의 목소리를 지킨 이','높아진 자리에서도, 처음 들었던 작은 목소리를 잊지 않았다.','공적인 활동에 참여하고 유력한 지위에 올랐습니다.',72);
add(g.state.재산-g.debt>=400,'결실을 모은 손','자신의 몫을 일구고, 내일을 위한 여유를 남겼다.',`최종 순재산 ${g.state.재산-g.debt} G를 남겼습니다.`,65);
add(g.age<races[g.race].life*.3,'짧게 머문 별','짧았기에 작았던 삶은 아니었다.',`${g.age}년의 생애에 ${g.log.filter(l=>l.kind==='choice').length}개의 선택을 남겼습니다.`,120);
add(joy>=65,'자신의 계절을 사랑한 사람','대단하지 않은 날들에도, 충분히 사랑할 이유가 있었다.',`기록된 시간의 평균 행복이 ${joy}였습니다.`,60);
add(g.debt>0,'어려운 계절을 걸은 사람','남겨진 빚보다, 버텨 낸 하루의 무게가 컸다.',`어려움 속에서 ${g.age}년의 삶을 이어 갔습니다.`,35);
add(true,'한 생을 온전히 걸은 사람','그는 살았고, 그 하루들은 한 권의 이야기가 되었다.',`${g.turns}번의 활동과 ${g.npcs.length}명의 인연이 한 삶을 이루었습니다.`,10);
candidates.sort((a,b)=>b.score-a.score);return {title:candidates[0].title,epitaph:candidates[0].epitaph,reasons:candidates.slice(0,3).map(c=>c.reason),joy,topJob:top?.[0]??g.job,topYears:top?.[1].years??0}}
export function memoryHighlights(g:Game){const important=['achievement','reputation','career','family','relationship','job','death','birth'];return g.log.filter(l=>important.includes(l.kind)).filter((l,i,a)=>a.findIndex(k=>k.title===l.title&&k.text===l.text)===i).slice(-10)}
