global.rnd=n=>Math.floor(Math.random()*n);global.pick=a=>a[rnd(a.length)];global.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fs=require('fs');
let src='';for(const f of ['data','core','battle','ai','difficulty'])src+=fs.readFileSync(__dirname + '/../js/'+f+'.js','utf8')+'\n';
src=src.replace(/'use strict';/g,'').replace(/^const (\w+)/gm,'var $1').replace(/^let (\w+)/gm,'var $1');
(0,eval)(src);
checkVictory=function(){const w=victor();if(w){G.over=true;G.winner=w;}};
const NG=+process.argv[2]||16, MAXT=+process.argv[3]||160, GOAL=process.argv[4]||'conquest';
const stats={alive40:[],len:[],winners:{},rebels:[],heirs:[],unions:[],deserts:0};
for(let g=0;g<NG;g++){
  newGame('aquitaine'); G.diff='original'; G.goal=GOAL;
  let rebels=0, heirs=0, unions=0;
  while(!G.over && G.turn<MAXT){
    aiTurn(G.player); endTurn(G.player); runAITurns();
    if(G.turn===40) stats.alive40.push(alive().length);
  }
  for(const d of G.fdefs){ if(d.realm==='Rebel')rebels++; if(d.realm==='Union')unions++; }
  for(const f in G.fac) if(G.fac[f].fallen) heirs++;
  stats.len.push(G.turn); stats.rebels.push(rebels); stats.heirs.push(heirs); stats.unions.push(unions);
  const w=G.winner?FAC(G.winner).name:'(none by '+MAXT+', '+alive().length+' alive)'; stats.winners[w]=(stats.winners[w]||0)+1;
  if(G.turn<40) stats.alive40.push(alive().length);
  console.log('game',g+1,'turns',G.turn,'winner',w,'rebels',rebels,'heirs',heirs,'unions',unions, 'top', alive().map(f=>[FAC(f).name,owned(f).length]).sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x.join(':')).join(' '));
}
const avg=a=>(a.reduce((s,x)=>s+x,0)/a.length).toFixed(1), med=a=>{const b=[...a].sort((x,y)=>x-y);return b[Math.floor(b.length/2)]};
console.log('\nalive at t40 avg',avg(stats.alive40),' game length median',med(stats.len),' rebellions/game',avg(stats.rebels),' heirs/game',avg(stats.heirs),' unions/game',avg(stats.unions));
console.log('winners',stats.winners);
