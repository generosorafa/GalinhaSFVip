import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {D,createState,normaliseFarm,calculate,historicalFeed,nextFeed,feedMultipliers,woodYield,simulateChickens,simulateCrim,simulateSalt,netSale,priceCost,restockPlan,investment,vipProjection,deliveryValue,recursiveGoldRequirements,levelAt,FEEDS} from '../engine.mjs';
const profile=JSON.parse(fs.readFileSync(new URL('../data/profile.json',import.meta.url)));
const fresh=()=>createState(structuredClone(profile));
const eq=(actual,expected)=>assert.ok(D(actual).minus(expected).abs().lt('0.000000000001'),`${actual} ≠ ${expected}`);
test('setembro: média histórica com e sem Heartwarming',()=>{
 eq(historicalFeed(),'1.634296875');eq(historicalFeed({heartwarming:false}),'2.03953125');eq(historicalFeed().mul(10),'16.34296875');
});
test('outubro: porções inteiras com Fat Chicken e Clucky Grazing',()=>{
 const s=fresh();s.farm.wearables=[];const nf=nextFeed(s.farm,{experience:2720,claimedExperience:2720,state:'idle'});
 assert.equal(nf.portions,2);eq(nf.quantity,'1.92375');eq(nf.quantity.mul(10),'19.2375');
});
test('Pig Onesie do JSON: 168 XP por porção, sem confundir com XP do Bumpkin',()=>{
 const s=fresh();eq(nextFeed(s.farm,{experience:2720,claimedExperience:2720}).xpPerPortion,168);eq(feedMultipliers(s.farm).qty,'.961875');
});
test('outubro: margem líquida com custos e taxa uma única vez',()=>{
 const gross=D(54).mul('.0262').plus(D(31).mul('.0043'));
 eq(gross,'1.5481');eq(netSale(1,gross,12.5),'1.3545875');eq(netSale(1,gross,25),'1.161075');
 eq(netSale(1,gross,12.5).minus(D('19.2375').mul('.0575')),'0.24843125');
 eq(netSale(1,'1.3545875',12.5,true),'1.3545875');
});
test('setembro: faturamento e restock de 4 reposições compartilhadas',()=>{
 const revenue=netSale(1,D(52).mul('.0209').plus(D(31).mul('.0055')),25).mul(28);eq(revenue,'26.4033');
 const feed=historicalFeed().mul(10).mul(28),seed=feed.div('1.3');
 const plan=restockPlan([{Corn:seed,Wheat:seed,Barley:seed}],{Corn:120,Wheat:96,Barley:72},{Corn:120,Wheat:96,Barley:72});assert.equal(plan.paid,4);
});
test('Bale + Double Bale: 54 ovos e 31 penas em 10 maduras',()=>{
 const s=fresh();s.farm.birds=Array.from({length:10},(_,i)=>({id:String(i),experience:2720,claimedExperience:2720,state:'idle'}));s.chicken.loves=0;
 const out=simulateChickens(s.farm,s.chicken,1);eq(out.eggs,54);eq(out.feathers,31);
 s.farm.activeCollectibles=s.farm.activeCollectibles.filter(k=>k!=='Bale');eq(simulateChickens(s.farm,s.chicken,1).eggs,52);
});
test('XP excedente preservado e próxima alimentação considera o resto',()=>{
 const s=fresh();s.farm.birds=[{id:'a',experience:2720,claimedExperience:2720,state:'idle'}];s.chicken.loves=0;
 const out=simulateChickens(s.farm,s.chicken,2);eq(out.finalBirds[0].experience,3392);eq(out.totalFeed['Mixed Grain'],'3.8475');
 const step=nextFeed(s.farm,{experience:3030,claimedExperience:2720,state:'idle'});assert.equal(step.portions,1);
});
test('coleta já disponível não paga outra ração no mesmo ciclo',()=>{
 const s=fresh();assert.equal(nextFeed(s.farm,{experience:499.5,claimedExperience:360,state:'ready'}).portions,0);
});
test('importação respeita interior e não ativa collectible só pelo inventário',()=>{
 const f=normaliseFarm({id:'123',updatedAt:100,farm:{coins:0,balance:'0',inventory:{Squirrel:'1'},bumpkin:{id:123,experience:0,skills:{}},interior:{ground:{collectibles:{Squirrel:[{coordinates:{x:1,y:1}}]}}}}});
 assert.ok(f.activeCollectibles.includes('Squirrel'));assert.ok(!f.activeCollectibles.includes('Fat Chicken'));
});
test('madeira: rank 2, bônus nativo e Squirrel calculados na ordem correta',()=>{eq(woodYield(profile),'34.2');const s=fresh();s.wood.rounds=4;const before=calculate(s).modules.wood.output.Wood;s.wood.treeBlitz=true;eq(calculate(s).modules.wood.output.Wood.minus(before),D('34.2').mul(28));});
test('Crimstone: quinto corte dá 4; ciclo de 5 rende 8 por rocha',()=>{
 const s=fresh();s.farm.snapshotAt=1000000000;s.farm.crimstones=[{minesLeft:5,minedAt:1000000000-86400000,recoveryMs:86400000}];
 const days=simulateCrim(s.farm,s.crim,5);assert.deepEqual(days.map(d=>d.quantity.toNumber()),[1,1,1,1,4]);
});
test('Crimstone: pausa superior a 48h perde o bônus de sequência',()=>{
 const s=fresh();s.farm.snapshotAt=1000000000;s.farm.crimstones=[{minesLeft:1,minedAt:1000000000-259200000,recoveryMs:86400000}];s.crim.rounds=.25;
 const days=simulateCrim(s.farm,s.crim,12);eq(days.reduce((a,b)=>a.plus(b.quantity),D(0)),3);assert.equal(days.reduce((a,b)=>a+b.bonusHits,0),0);
});
test('sal: 4 nós reais, 12 por carga, 6,65h e capacidade 4',()=>{
 const s=fresh(),r=simulateSalt(s.farm,s.salt,28);eq(r.rules.perRake,12);eq(r.rules.interval,6.65);assert.equal(r.rules.maxCharges,4);assert.equal(Object.keys(s.farm.saltNodes).length,4);
});
test('sal: visitas esparsas perdem cargas e respeitam capacidade',()=>{
 const s=fresh();s.farm.snapshotAt=1000000000;s.farm.saltNodes={a:{salt:{storedCharges:0,nextChargeAt:1000000000+23940000}}};s.salt.visits=1;
 const fast=simulateSalt(s.farm,s.salt,7);s.salt.visits=0;eq(simulateSalt(s.farm,s.salt,7).daily.reduce((a,b)=>a.plus(b.quantity),D(0)),0);assert.ok(fast.daily.every(d=>d.tools.lte(4)));
});
test('ferreiro compartilha uma reposição entre ferramentas',()=>{
 const r=restockPlan([{Axe:251,'Gold Pickaxe':6}],{Axe:250,'Gold Pickaxe':5},{Axe:250,'Gold Pickaxe':5});assert.equal(r.paid,1);
});
test('estoque pronto de ferramentas reduz fabricação, não reposição econômica',()=>{
 const r=restockPlan([{Axe:100}],{Axe:0},{Axe:250},{},{Axe:150});assert.equal(r.paid,0);eq(r.crafted.Axe,0);eq(r.finalInventory.Axe,50);
});
test('shipment gratuito pode evitar reposição paga',()=>{
 const r=restockPlan([{Axe:50},{Axe:50}],{Axe:50},{Axe:200},{Axe:50});assert.equal(r.paid,0);
});
test('falta de preço deixa cálculo pendente; preço zero é válido',()=>{
 assert.equal(priceCost({Wood:3},{Wood:{value:null}}).cost,null);eq(priceCost({Wood:3},{Wood:{value:0}}).cost,0);assert.equal(calculate(fresh()).partial,true);
});
test('materiais em ferramentas prontas não são comprados novamente no caixa',()=>{
 const s=fresh();for(const k of Object.keys(s.prices))s.prices[k].value=.01;s.farm.inventory.Axe=100000;s.farm.inventory['Gold Pickaxe']=100000;s.farm.inventory['Salt Rake']=100000;
 s.settings.internalWood=false;const r=calculate(s);assert.ok(!r.cashReq.Wood||r.cashReq.Wood.eq(0));assert.ok(r.cashCoins.eq(0));assert.ok(r.totalCoins.gt(0));
});
test('madeira interna não é vendida e recomprada no consolidado',()=>{
 const s=fresh();for(const k of Object.keys(s.prices))s.prices[k].value=.01;s.settings.internalWood=false;const a=calculate(s);s.settings.internalWood=true;const b=calculate(s);assert.ok(b.internalWood.gt(0));eq(b.recurring.minus(a.recurring),b.internalWood.mul('.01').mul('.125'));
});
test('crescimento de 5 jovens não é tratado como 15 aves maduras desde o início',()=>{
 const s=fresh();const r=calculate(s);assert.ok(r.chickens.eggs.lt(D(15).mul('5.4').mul(28)));assert.ok(r.chickens.finalBirds.every(b=>levelAt(b.experience)===15));
});
test('Gems em estoque e Gems compradas têm impactos de caixa diferentes',()=>{
 const s=fresh();for(const k of Object.keys(s.prices))s.prices[k].value=.01;const a=calculate(s);s.settings.operatingGems=1270;const b=calculate(s);assert.ok(a.gemCash.gt(0));eq(b.gemCash,0);eq(a.recurring,b.recurring);
});
test('cadeia recursiva: 3 Gold requerem picaretas, ferro, pedra e madeira',()=>{
 const r=recursiveGoldRequirements(3,{goldYield:1.2,ironYield:1.4,stoneYield:1.4});eq(r['Iron Pickaxe'],'2.5');assert.ok(r['Stone Pickaxe'].gt(8));assert.ok(r.Pickaxe.gt(31));
});
test('VIP: meta atingida, margem zero, negativa e prazo vencido',()=>{
 assert.equal(vipProjection({goal:77,reserved:77,margin:0,deadline:2000,now:1000}).days,0);
 assert.equal(vipProjection({goal:77,reserved:0,margin:0,deadline:2000,now:1000}).days,null);
 assert.equal(vipProjection({goal:77,reserved:0,margin:-1,deadline:2000,now:1000}).days,null);
 assert.equal(vipProjection({goal:77,reserved:0,margin:1,deadline:1,now:1000}).expired,true);
});
test('ROI usa margem adicional e não retorna payback com delta não positivo',()=>{eq(investment(10,1,28).payback,10);eq(investment(10,1,28).net,18);assert.equal(investment(10,0,28).payback,null);assert.equal(investment(10,-1,28).payback,null);});
test('entrega separa estoque próprio e compra faltante',()=>{
 const s=fresh();s.prices.Egg.value=.02;const r=deliveryValue({items:{Egg:10},flower:.3},s,{Egg:4});eq(r.buyCost,.12);eq(r.opportunity,.07);eq(r.delta,.11);
});
test('pedidos concorrentes não reutilizam os mesmos ovos do inventário',()=>{
 const s=fresh();s.farm.inventory.Egg=6;s.deliveries=[{id:'a',items:{Egg:5},flower:1},{id:'b',items:{Egg:5},flower:1}];const r=calculate(s);eq(r.deliveryResults[0].result.own.Egg,5);eq(r.deliveryResults[1].result.own.Egg,1);eq(r.deliveryResults[1].result.buy.Egg,4);
});
test('Acre Farm e Old Farmer alteram o cultivo atual, sem alterar fixture antiga',()=>{
 const s=fresh();eq(calculate(s).cropYield,'2.4');s.farm.skills['Acre Farm']=0;s.farm.skills['Old Farmer']=0;eq(calculate(s).cropYield,'1.3');eq(historicalFeed(),'1.634296875');
});
test('ração pronta é consumida antes de fabricar ou plantar',()=>{
 const s=fresh();s.chicken.route='grow';for(const feed of Object.keys(FEEDS??{}))s.farm.inventory[feed]=100000;const r=calculate(s);eq(r.seedPlan.paid,0);eq(r.seedPlan.crafted.Corn,0);
});
