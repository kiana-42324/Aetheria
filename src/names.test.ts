import {createGame,fullName} from './engine';
const assert=(ok:unknown,message:string)=>{if(!ok)throw Error(message)};
for(let seed=1;seed<=1000;seed++){
 const g=createGame(seed),family=g.name.split(' ').at(-1);
 assert(g.npcs.every(n=>n.name.split(' ').at(-1)===family),'Family surname mismatch');
 assert(new Set([g.name,...g.npcs.map(n=>n.name)]).size===g.npcs.length+1,'Duplicate birth name');
}
const g=createGame(42),family=g.name.split(' ').at(-1)!;
for(let i=0;i<300;i++)fullName(g,family);
assert(new Set(g.usedNames).size===g.usedNames?.length,'Name pool exhaustion duplicated names');
const restored=JSON.parse(JSON.stringify(g));
assert(fullName(g)===fullName(restored),'Save/reload changes seeded name');
const legacy=createGame(7);delete legacy.usedNames;
const prior=new Set([legacy.name,...legacy.npcs.map(n=>n.name),...legacy.world.map(w=>w.ruler)]);
assert(!prior.has(fullName(legacy)),'Legacy save existing names not reserved');
console.log('Names: 1,000 families, 300 same-family names, exhausted pool, legacy save and deterministic reload passed.');
