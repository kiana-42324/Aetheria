import type {Event} from '../types';
export type EnemyKind='slime'|'beast'|'golem'|'ghost'|'dragon';
export interface Encounter {name:string;tier:1|2|3;hp:number;attack:number;armor:number;kind:EnemyKind;waves?:number;achievement?:string;hiddenJob?:string}
export const encounters:Record<string,Encounter>={
 'slime-well':{name:'푸른 슬라임',tier:1,hp:48,attack:7,armor:0,kind:'slime'},
 'goblin-road':{name:'고블린 약탈자',tier:1,hp:65,attack:9,armor:2,kind:'beast'},
 'moon-wolves':{name:'은빛 마수',tier:2,hp:90,attack:12,armor:2,kind:'beast'},
 'mimic-chest':{name:'보물상자 미믹',tier:1,hp:65,attack:10,armor:4,kind:'golem'},
 'restless-crypt':{name:'폐묘지의 망령',tier:2,hp:85,attack:12,armor:7,kind:'ghost'},
 'stone-sentinel':{name:'룬 수호 골렘',tier:2,hp:115,attack:13,armor:7,kind:'golem'},
 'wyvern-cliff':{name:'절벽의 와이번',tier:2,hp:130,attack:14,armor:4,kind:'dragon'},
 'dragon-shadow':{name:'하늘을 가린 고룡',tier:3,hp:190,attack:17,armor:7,kind:'dragon',achievement:'고룡 토벌자',hiddenJob:'용사'},
 'forest-spiders':{name:'숲의 독거미',tier:1,hp:55,attack:8,armor:1,kind:'beast'},
 'bandit-camp':{name:'도적단 두목',tier:1,hp:75,attack:10,armor:3,kind:'beast'},
 'frost-troll':{name:'서리 트롤',tier:2,hp:130,attack:14,armor:4,kind:'golem'},
 'haunted-tower':{name:'탑의 망령 기사',tier:2,hp:100,attack:13,armor:6,kind:'ghost',waves:2},
 'dragon-hunt':{name:'붉은 고룡',tier:3,hp:190,attack:17,armor:7,kind:'dragon',achievement:'고룡 토벌자',hiddenJob:'용사'},
 'ancient-behemoth':{name:'태고의 거수',tier:3,hp:225,attack:16,armor:9,kind:'golem',achievement:'태고의 종결자',hiddenJob:'고대 수호자'},
 'endless-labyrinth':{name:'미궁의 수문장',tier:3,hp:95,attack:12,armor:4,kind:'ghost',waves:3,achievement:'미궁 답파자',hiddenJob:'미궁 정복자'}
};
export const hiddenJobs:Record<string,string>={'용사':'고룡 토벌자','고대 수호자':'태고의 종결자','미궁 정복자':'미궁 답파자'};
const descriptions:Record<string,string>={
 'forest-spiders':'약초꾼의 숲길이 독거미의 둥지에 막혔다. 빠르게 움직이는 다리와 독니를 살펴야 한다.',
 'bandit-camp':'교역로의 도적들이 폐초소를 점거했다. 상인 조합이 두목을 제압한 사람에게 보상을 약속했다.',
 'frost-troll':'빙하의 트롤이 광산 입구를 차지했다. 단단한 피부를 뚫고 육중한 강타를 막아야 한다.',
 'haunted-tower':'폐탑의 두 층에 망령 기사들이 남아 있다. 두 번의 연속 전투를 버텨 정상의 봉인을 해제하자.',
 'dragon-hunt':'왕국과 길드가 공동으로 고룡 토벌대를 모집한다. 준비된 자만이 둥지에서 돌아올 수 있다.',
 'ancient-behemoth':'산맥 아래 잠들었던 태고의 거수가 깨어났다. 두꺼운 갑각과 대지를 흔드는 일격이 탐험대를 기다린다.',
 'endless-labyrinth':'세 개의 봉인실을 통과해야 열리는 고대 미궁. 건강과 마력, 한정된 회복약을 마지막 방까지 아껴야 한다.'
};
export const challengeEvents:Event[]=Object.entries(descriptions).map(([id,description])=>{const b=encounters[id],gold=b.tier===1?75:b.tier===2?210:800,fame=b.tier===1?8:b.tier===2?20:45;return {
 id,title:b.achievement?`${b.name} 도전`:b.name,description,category:b.tier===3?'전설 도전':b.tier===2?'위험 모험':'초급 모험',adventure:true,weight:12,once:false,
 condition:{stage:b.tier===1?['청소년기','성인기','노년기']:['성인기','노년기']},
 choices:[{text:'전투를 시작한다',combat:true,tag:'combat',condition:b.tier===3?{combatPower:65,health:65}:undefined,
 hint:`${b.waves??1}연전 · 승리 ${gold} G / 명성 +${fame} · 건강 0이면 사망${b.achievement?' · 최초 완료 시 업적과 진로 보상':''}`,
 success:{state:{재산:gold,명성:fame},...(id==='dragon-hunt'?{flag:'dragon-slayer',asset:'dragon-trophy'}:{})},failure:{death:`${b.name}에게 패배`},ok:`${b.name} 도전을 완수했다. 길드의 보상과 명성을 얻었다.`,fail:'끝내 상대의 공격을 버티지 못했다.'},
 {text:'준비를 더 하고 돌아온다',success:{state:{스트레스:-2}},ok:'준비의 중요성을 깨닫고 안전한 길로 돌아왔다.'}]
}});
