import type {Event} from '../types';
import {countries,jobs} from './world';
const authorities=['왕실','제국 궁정','삼림 의회','조합 의회','공화국 의회','영주 회의'];
export const reputationEvents:Event[]=[
 ...countries.flatMap((country,countryId)=>[2,3,4].map((rank):Event=>({
  id:`honor-${countryId}-${rank}`,title:`${authorities[countryId]}의 ${rank===2?'공로 인정':rank===3?([0,1,5].includes(countryId)?'작위 하사':'지위 수여'):'최고 예우'}`,
  category:'명성의 기회',weight:1,reputation:{fame:rank===2?40:rank===3?65:90,rank},
  condition:{country:countryId,stage:['성인기','노년기']},
  description:`당신의 이름과 공적이 ${authorities[countryId]}에 알려졌다. ${country.name}에서 ‘${country.titles[rank]}’에 해당하는 사회적 대우를 제안한다. 혈통이나 왕위 계승권을 얻는 것은 아니지만, 새로운 책임과 공적인 지위가 따른다.`,
  choices:[{text:'공적인 책임과 함께 지위를 받아들인다',hint:`신분 → ${country.titles[rank]} · 포상 ${rank*30} G · 스트레스 +${rank*3}`,success:{rankSet:rank,state:{재산:rank*30,스트레스:rank*3},flag:`honor-rank-${rank}`},ok:`공로를 인정받아 ${country.titles[rank]}의 대우를 받게 되었다. 새 지위에 따르는 책임도 받아들였다.`},
  {text:'지위를 사양하고 지금의 삶을 이어간다',hint:'신분 유지 · 행복 +3 · 이후 다시 제안받을 수 있음',success:{state:{행복:3}},ok:'명예는 고맙지만, 익숙한 삶을 선택했다.'}]
 }))),
 ...['기사','학자','마법사'].map((name):Event=>{const job=jobs.find(j=>j.name===name)!;const org=name==='기사'?'국가 기사단':name==='학자'?'왕립·공립 학술원':'마법 연구회';return {
  id:`recruit-${name}`,title:`${org}의 특별 초빙`,category:'명성의 기회',weight:1,
  reputation:{fame:50,job:name},condition:{stage:['성인기'],stat:[job.stat,job.min]},
  description:`${org}에서 당신의 명성을 듣고 ${name} 자리를 제안했다. 능력은 이미 검증되었다. 부족한 정규 교육 한 단계는 기관의 특별 연수로 보완할 수 있다. 새로운 일에는 더 높은 수입과 그만큼의 책임이 따른다.`,
  choices:[{text:`초빙을 받아 ${name}로 전직한다`,hint:`${job.stat} ${job.min} 이상 · 교육 ${Math.max(0,job.education-1)}단계 이상 · 기본 연수입 ${job.income} G · 계약금 40 G · 스트레스 +8`,success:{job:name,education:job.education,org,state:{재산:40,스트레스:8},flag:`recruited-${name}`},ok:`${org}의 연수를 마치고 ${name}로 일하기 시작했다. 계약금을 받았으며 이후 일하기 수입과 위험도가 새 직업에 맞게 바뀐다.`},
  {text:'현재의 일을 계속한다',hint:'직업 유지 · 행복 +2',success:{state:{행복:2}},ok:'당신은 지금의 일을 계속하기로 했다.'}]
 }})
];
