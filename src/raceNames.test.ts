import {createGame,fullName} from './engine';
import {raceNamePools} from './data/names';
import {names,surnames} from './data/world';
const assert=(v:unknown,m:string)=>{if(!v)throw Error(m)};
assert(raceNamePools[0].given===names&&raceNamePools[0].family===surnames,'Human pools changed');
for(let race=0;race<6;race++){
 const pool=raceNamePools[race];assert(new Set(pool.given).size===pool.given.length,'Duplicate given name');assert(new Set(pool.family).size===pool.family.length,'Duplicate family');
 const g=createGame(50);g.race=race;g.name='';g.npcs=[];g.usedNames=[];
 const generated=new Set<string>();
 for(let i=0;i<100;i++){const n=fullName(g),[given,family]=n.split(' ');assert(pool.given.includes(given)&&pool.family.includes(family),'Wrong race pool');assert(!generated.has(n),'Duplicate full name');generated.add(n)}
 const fixed=pool.family[0];for(let i=0;i<pool.given.length+5;i++)assert(fullName(g,fixed).endsWith(' '+fixed),'Surname changes at pool exhaustion');
 const restored=JSON.parse(JSON.stringify(g));assert(fullName(g)===fullName(restored),'Reload RNG changed');
}
const represented=new Set<number>();
for(let seed=1;seed<2500;seed++){const g=createGame(Math.imul(seed,2654435761)>>>0);represented.add(g.race);const pool=raceNamePools[g.race],[given,family]=g.name.split(' ');assert(pool.given.includes(given)&&pool.family.includes(family),'Wrong birth name');assert(g.npcs.every(n=>n.name.endsWith(' '+family)&&pool.given.includes(n.name.split(' ')[0])),'Wrong family pool');assert(new Set([g.name,...g.npcs.map(n=>n.name)]).size===g.npcs.length+1,'Duplicate birth family')}
assert(represented.size===6,'Missing race coverage');
const legacy=createGame(4);legacy.race=1;legacy.name='에린 벨';delete legacy.usedNames;const old=legacy.name;assert(fullName(legacy,'벨').endsWith(' 벨')&&legacy.name===old,'Legacy family changed');
console.log('Race names: 6 pools, 2,499 birth families, uniqueness, exhaustion, legacy surname and seeded reload PASS.');
