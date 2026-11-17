import Decimal from './vendor/decimal.mjs';
Decimal.set({ precision: 32, rounding: Decimal.ROUND_HALF_UP });
export const D = value => new Decimal(value ?? 0);
const n = value => D(value).toNumber();
const sum = list => list.reduce((a, b) => a.plus(b), D(0));
export const RULE_VERSION = 'sfl-main-2026-11-17';
export const THRESHOLDS = [0,60,120,240,360,480,660,840,1020,1200,1440,1680,1920,2160,2400,2720];
const DROPS = [[0,0],[1,0],[1,0],[1,1],[2,1],[2,1],[2,1],[2,1],[3,1],[3,2],[3,2],[3,2],[3,2],[4,2],[4,2],[5,3]];
export const FEEDS = { 'Kernel Blend': ['Corn'], Hay: ['Wheat'], NutriBarley: ['Barley'], 'Mixed Grain': ['Corn','Wheat','Barley'] };
export const TOOLS = {
  Axe: { coins:20, ingredients:{}, capacity:250, shipment:50 },
  Pickaxe: { coins:20, ingredients:{Wood:3}, capacity:60, shipment:15 },
  'Stone Pickaxe': { coins:20, ingredients:{Wood:3,Stone:5}, capacity:20, shipment:5 },
  'Iron Pickaxe': { coins:80, ingredients:{Wood:3,Iron:5}, capacity:5, shipment:1 },
  'Gold Pickaxe': { coins:100, ingredients:{Wood:3,Gold:3}, capacity:5, shipment:0 },
  'Salt Rake': { coins:20, ingredients:{Wood:3}, capacity:50, shipment:0 },
};
export const ITEMS = ['Egg','Feather','Corn','Wheat','Barley','Wood','Stone','Iron','Gold','Crimstone','Salt'];
export const LABELS = {Egg:'Ovo',Feather:'Pena',Corn:'Milho',Wheat:'Trigo',Barley:'Cevada',Wood:'Madeira',Stone:'Pedra',Iron:'Ferro',Gold:'Ouro',Crimstone:'Crimstone',Salt:'Sal'};
export const rank = (f, skill) => Math.max(0, Math.min(3, Number(f.skills?.[skill]) || 0));
const effect = (f, skill, values, fallback=0) => values[rank(f,skill)-1] ?? fallback;
export const active = (f, name) => (f.activeCollectibles ?? []).includes(name);
export const worn = (f, name) => (f.wearables ?? []).includes(name);
export function levelAt(xp) { let level=0; THRESHOLDS.forEach((v,i)=>{if(D(xp).gte(v))level=i;}); return level; }
const markAt = xp => D(xp).lt(2720) ? levelAt(xp) : 15 + D(xp).minus(2720).div(320).floor().toNumber();
const markXp = count => count <=15 ? THRESHOLDS[count] : 2720 + (count-15)*320;
const claimedXp = bird => bird.claimedExperience ?? markXp(Math.max(0,markAt(bird.experience)-(bird.state==='ready'?1:0)));
export const pendingClaims = bird => Math.max(0,markAt(bird.experience)-markAt(claimedXp(bird)));
export const shownLevel = bird => pendingClaims(bird)>0 ? Math.min(15,markAt(bird.claimedExperience ?? 0)) : levelAt(bird.experience);
export function xpUntilReady(xp) { return D(xp).lt(2720) ? n(D(THRESHOLDS[levelAt(xp)+1]).minus(xp)) : n(D(320).minus(D(xp).minus(2720).mod(320))); }
export function favourite(xp) { const l=levelAt(xp); return l<3?'Kernel Blend':l<6?'Hay':l<10?'NutriBarley':'Mixed Grain'; }
export function normaliseFarm(raw, now=Date.now()) {
  const f=raw?.farm ?? raw;
  if(!f?.bumpkin || !f.inventory || typeof f.bumpkin.skills!=='object') throw new Error('JSON sem farm.bumpkin, inventory ou skills. Copie o Response body de Get a farm.');
  const placed=[f.collectibles,f.home?.collectibles,f.interior?.ground?.collectibles,f.interior?.level_one?.collectibles].filter(Boolean);
  const activeCollectibles=[...new Set(placed.flatMap(location=>Object.entries(location).filter(([,arr])=>Array.isArray(arr)&&arr.some(p=>p.coordinates&&!p.used&&(p.readyAt??0)<=now)).map(([name])=>name)))];
  const birds=Object.values(f.henHouse?.animals??{}).filter(a=>a.type==='Chicken').map(a=>({id:String(a.id),experience:Number(a.experience??0),claimedExperience:a.claimedExperience===undefined?claimedXp(a):Number(a.claimedExperience),state:a.state,item:a.item,lovesThisSleep:a.lovesThisSleep??0,awakeAt:a.awakeAt??0}));
  if(birds.some(a=>!Number.isFinite(a.experience)||a.experience<0))throw new Error('XP de galinha inválido no JSON.');
  const inv=Object.fromEntries([...ITEMS,...Object.keys(FEEDS),...Object.keys(TOOLS),'Gem','Corn Seed','Wheat Seed','Barley Seed'].map(k=>[k,Number(f.inventory[k]??0)]));
  if(Object.values(inv).some(v=>!Number.isFinite(v)||v<0))throw new Error('Inventário contém quantidade inválida.');
  return {id:String(raw.id??f.bumpkin.id??''),snapshotAt:Number(raw.updatedAt??now),island:f.island?.type??'desert',xp:Number(f.bumpkin.experience??0),coins:Number(f.coins??0),flower:Number(f.balance??0),gems:inv.Gem,
    vipExpires:Number(f.vip?.expiresAt??0),skills:{...f.bumpkin.skills},activeCollectibles,wearables:[...Object.values(f.bumpkin.equipped??{}),...Object.values(f.farmHands?.bumpkins??{}).flatMap(b=>Object.values(b.equipped??{}))],
    inventory:inv,stock:Object.fromEntries(Object.entries(f.stock??{}).filter(([k])=>k in TOOLS||/^(Corn|Wheat|Barley) Seed$/.test(k)).map(([k,v])=>[k,Number(v)])),
    birds,henLevel:f.henHouse?.level??1,trees:Object.values(f.trees??{}).filter(t=>t.x!==undefined&&t.y!==undefined).map(t=>({tier:t.tier??1,multiplier:t.multiplier??1,recoveryMs:t.wood?.baseDurationMs??7200000})),
    crimstones:Object.values(f.crimstones??{}).filter(t=>t.x!==undefined&&t.y!==undefined).map(t=>({minesLeft:t.minesLeft??5,minedAt:t.stone?.minedAt??0,recoveryMs:t.stone?.baseDurationMs??86400000})),
    saltNodes:structuredClone(f.saltFarm?.nodes??{}),saltLevel:f.saltFarm?.level??0,sculptureLevel:f.sculptures?.['Salt Sculpture']?.level??0,
    plots:Object.values(f.crops??{}).filter(p=>p.x!==undefined&&p.y!==undefined).length,shipmentsAt:f.shipments?.restockedAt??0,
    hasWarehouse:Object.values(f.buildings?.Warehouse??{}).some(p=>p.coordinates),
  };
}
export function createState(farm) {
  const historic={Egg:.0262,Feather:.0043,Corn:.0156,Wheat:.0159,Barley:.026};
  return {version:3,rules:RULE_VERSION,farm,prices:Object.fromEntries(ITEMS.map(k=>[k,{value:historic[k]??null,source:historic[k]===undefined?'não informado':'referência histórica de Rafael',at:historic[k]===undefined?null:'2026-10-27T12:00:00-03:00',type:'compra/venda de cenário'}])),
    settings:{days:28,tax:12.5,gemBundleQty:75,gemBundleFlower:4.82,coinsPer1000:null,operatingGems:0,toolRestockGems:10,seedRestockGems:15,freeShipments:true,internalWood:true,autoSave:true},
    chicken:{cycles:1,loves:2,loveMode:'last',observedEggs:null,observedFeathers:null,observedFeed:null,observedPeriod:'',observedBasis:'mature10',route:'buy',laurieCoverage:100,plots: farm.plots||54},
    wood:{rounds:4,treeBlitz:rank(farm,'Tree Blitz')>0,extraYield:0,buyQuantity:100},crim:{rounds:1,route:'buy',extraYield:0,goldYield:1.2,ironYield:1.4,stoneYield:1.4},salt:{visits:3,extraYield:0},
    vip:{goal:77,reserved:0,gemGoal:1500,gemReserved:0,otherDaily:0},roi:{name:'Collectible',price:0,deltaDaily:0},deliveries:[],sales:[]};
}
export function feedMultipliers(f) {
  let qty=D(effect(f,'Efficient Feeding',[.95,.94,.925],1)).mul(effect(f,'Chonky Feed',[1.5,1.75,2],1));
  if(active(f,'Fat Chicken'))qty=qty.mul(.9);
  if(active(f,'Cluckulator'))qty=qty.mul(.75);
  qty=qty.mul(effect(f,'Clucky Grazing',[.75,.65,.5],1));
  for(const skill of ['Sheepwise Diet','Cow-Smart Nutrition','Swill Savvy'])qty=qty.mul(effect(f,skill,[1.5,1.55,1.65],1));
  let xp=D(effect(f,'Chonky Feed',[2,2.5,3],1)); if(worn(f,'Pig Onesie'))xp=xp.mul(1.05);
  return {qty,xp};
}
export function nextFeed(f,bird) {
  const feed=favourite(bird.experience), missing=xpUntilReady(bird.experience), m=feedMultipliers(f), xp=D(feed==='Mixed Grain'?80:60).mul(m.xp);
  const portions=pendingClaims(bird)>0?0:Math.max(1,D(missing).div(xp).ceil().toNumber());
  return {feed,missing,portions,quantity:m.qty.mul(portions),xpPerPortion:xp};
}
export function historicalFeed({heartwarming=true,fat=false,clucky=false,pig=false,loves=2}={}) {
  const love=D(45.5).mul(loves).mul(heartwarming?1.5:1);
  const qty=D(1.5).mul(.95).mul(fat?.9:1).mul(clucky?.75:1);
  return D(320).minus(love).div(D(160).mul(pig?1.05:1)).mul(qty);
}
function birdOutput(f,level) {
  let egg=D(DROPS[level]?.[0]??0).plus(effect(f,'Abundant Harvest',[.2,.35,.5]));
  for(const [name,v] of [['Chicken Coop',1],['Rich Chicken',.1],['Undead Rooster',.1],['Ayam Cemani',.2],['Squid Chicken',.1],['Ascended Chicken',.1]])if(active(f,name))egg=egg.plus(v);
  if(active(f,'Bale'))egg=egg.plus(D(.1).mul(effect(f,'Double Bale',[2,2.5,3],1)));
  let feather=D(DROPS[level]?.[1]??0).plus(effect(f,'Fine Fibers',[.1,.15,.2]));
  if(worn(f,'Chicken Suit'))feather=feather.plus(1); if(active(f,'Alien Chicken'))feather=feather.plus(.1);
  return {egg,feather};
}
export function simulateChickens(f,config,days) {
  const birds=structuredClone(f.birds), byDay=[], totalFeed=Object.fromEntries(Object.keys(FEEDS).map(k=>[k,D(0)]));
  const sleepHours=24*effect(f,'Restless Animals',[.9,.85,.8],1)*(active(f,'Flamingo Chicken')?.975:1);
  const cycles=Math.min(Math.max(0,config.cycles),24/sleepHours), m=feedMultipliers(f);
  for(let day=0;day<days;day++) {
    let eggs=D(0),feathers=D(0);const feeds=Object.fromEntries(Object.keys(FEEDS).map(k=>[k,D(0)]));
    const today=Math.floor((day+1)*cycles+1e-9)-Math.floor(day*cycles+1e-9);
    for(let c=0;c<today;c++)for(const bird of birds) {
      if(pendingClaims(bird)===0) {
        if(day>0||c>0) {
          const love=config.loveMode==='last'?({ 'Petting Hand':25,Brush:40,'Music Box':50 }[bird.item]??45.5):45.5;
          bird.experience=n(D(bird.experience).plus(D(love).mul(config.loves).mul(1+effect(f,'Heartwarming Instruments',[.5,.6,.7]))));
        }
        if(pendingClaims(bird)===0) {
          const step=nextFeed(f,bird); feeds[step.feed]=feeds[step.feed].plus(step.quantity);
          // Preserve XP overflow exactly; a pending produce mark is banked.
          const before=bird.experience;
          bird.claimedExperience=bird.claimedExperience??markXp(markAt(before));
          bird.experience=n(D(before).plus(step.xpPerPortion.mul(step.portions)));
        }
      }
      const next=Math.min(15,markAt(bird.claimedExperience??0)+1),out=birdOutput(f,next);
      eggs=eggs.plus(out.egg);feathers=feathers.plus(out.feather);
      bird.claimedExperience=markXp(markAt(bird.claimedExperience??0)+1);
    }
    if(config.observedEggs!==null&&config.observedFeathers!==null) {eggs=D(config.observedEggs).mul(today);feathers=D(config.observedFeathers).mul(today);}
    if(config.observedFeed!==null) {for(const k of Object.keys(feeds))feeds[k]=D(0);feeds['Mixed Grain']=D(config.observedFeed).mul(today);}
    for(const k of Object.keys(feeds))totalFeed[k]=totalFeed[k].plus(feeds[k]);
    byDay.push({eggs,feathers,feeds});
  }
  return {byDay,totalFeed,eggs:sum(byDay.map(d=>d.eggs)),feathers:sum(byDay.map(d=>d.feathers)),sleepHours,cycles,finalBirds:birds,multipliers:m};
}
export function woodYield(f,extra=0) {
  const beaver=['Woody the Beaver','Apprentice Beaver','Foreman Beaver'].some(k=>active(f,k))?1.2:1;
  const tough=effect(f,'Tough Tree',[.1,.2,.3]);
  const base=D(beaver).mul(1+2*tough).plus(effect(f,"Lumberjack's Extra",[.1,.15,.2])).plus(active(f,'Squirrel')?.1:0).plus(active(f,'Tiki Totem')?.1:0).plus(active(f,'Wood Nymph Wendy')?.2:0).plus(.2).plus(extra);
  return sum(f.trees.map(t=>base.mul(t.multiplier).plus(t.tier===2?.5:t.tier===3?2.5:0)));
}
export function simulateCrim(f,config,days) {
  const daily=Array.from({length:days},()=>({quantity:D(0),tools:D(0),bonusHits:0}));
  const every=config.rounds>0?86400000/config.rounds:Infinity;
  const base=D(1).plus(config.extraYield).plus(active(f,'Crimson Carp')?.05:0).plus(active(f,'Crim Peckster')?.1:0).plus(worn(f,'Crimstone Armor')?.1:0);
  const bonus=D(2).plus(effect(f,'Fire Kissed',[1,1.35,1.75])).plus(worn(f,'Crimstone Hammer')?2:0).plus(active(f,'Mushroom Chicken')?.5:0);
  for(const rock0 of f.crimstones) {
    const rock={...rock0};let at=Math.max(f.snapshotAt,rock.minedAt+rock.recoveryMs)+1;
    for(;at<f.snapshotAt+days*86400000;at+=Math.max(every,rock.recoveryMs)) {
      const day=Math.floor((at-f.snapshotAt)/86400000); if(at-rock.minedAt>172800000)rock.minesLeft=5;
      const final=rock.minesLeft===1;daily[day].quantity=daily[day].quantity.plus(base).plus(final?bonus:0);daily[day].tools=daily[day].tools.plus(worn(f,'Crimstone Spikes Hair')?0:1);
      if(final)daily[day].bonusHits++;rock.minesLeft=final?5:rock.minesLeft-1;rock.minedAt=at;
      if(!Number.isFinite(every))break;
    }
  }
  // Zero configured rounds means the activity is disabled.
  if(config.rounds<=0)return daily.map(()=>({quantity:D(0),tools:D(0),bonusHits:0}));
  return daily;
}
export function saltRules(f,extra=0) {
  const interval=7*effect(f,'Salty Seas',[.95,.9,.85],1)*(f.sculptureLevel>=1?.95:1)*(active(f,'Salt Worker Gnome')?.7:1);
  const perRake=D(10).plus(effect(f,'Wide Rakes',[2,3,4])).plus(worn(f,'Deep Sea Salt Cave Background')?5:0).plus(active(f,'Salt Worker Gnome')?2:0).plus(extra);
  return {interval,maxCharges:3+(f.sculptureLevel>=3?1:0)+(f.sculptureLevel>=6?1:0),perRake};
}
export function simulateSalt(f,config,days) {
  const rules=saltRules(f,config.extraYield),daily=Array.from({length:days},()=>({quantity:D(0),tools:D(0),lostCharges:0}));
  if(config.visits<=0)return{rules,daily};
  const nodes=Object.values(structuredClone(f.saltNodes)).map(node=>({...node.salt}));
  const step=86400000/config.visits,interval=rules.interval*3600000;
  for(let at=f.snapshotAt+step;at<=f.snapshotAt+days*86400000;at+=step) {
    const day=Math.min(days-1,Math.max(0,Math.ceil((at-f.snapshotAt)/86400000)-1));
    for(const node of nodes) {
      let charges=Math.min(rules.maxCharges,node.storedCharges??0),next=node.nextChargeAt??f.snapshotAt+interval;
      if(next<=at) {const generated=Math.floor((at-next)/interval)+1;daily[day].lostCharges+=Math.max(0,charges+generated-rules.maxCharges);charges=Math.min(rules.maxCharges,charges+generated);next+=generated*interval;}
      if(charges===rules.maxCharges)next=at+interval;
      daily[day].quantity=daily[day].quantity.plus(rules.perRake.mul(charges));daily[day].tools=daily[day].tools.plus(active(f,'Ascended Idol')?0:charges);
      node.storedCharges=0;node.nextChargeAt=next;
    }
  }
  return{rules,daily};
}
export function toolCoins(f,tool) {
  let v=D(TOOLS[tool].coins);
  if(tool==='Axe')v=v.mul(effect(f,"Feller's Discount",[.8,.75,.7],1));
  else if(/Pickaxe/.test(tool))v=v.mul(effect(f,'Frugal Miner',[.8,.7,.6],1));
  else if(tool==='Salt Rake') {v=v.mul(effect(f,'Cheap Rakes',[.8,.75,.7],1));if(f.sculptureLevel>=4)v=v.mul(.9);}
  return v;
}
export function restockPlan(dailyNeeds,initial={},capacities={},shipments={},owned={}) {
  const keys=Object.keys(capacities),stock=Object.fromEntries(keys.map(k=>[k,D(initial[k]??0)])),inventory=Object.fromEntries(keys.map(k=>[k,D(owned[k]??0)]));
  let paid=0;const events=[],crafted=Object.fromEntries(keys.map(k=>[k,D(0)]));
  dailyNeeds.forEach((d,day)=>{
    if(day>0)for(const k of keys)stock[k]=Decimal.max(stock[k],Decimal.min(capacities[k],stock[k].plus(shipments[k]??0)));
    const need={};for(const k of keys) {
      const demand=D(d[k]??0),fromInventory=Decimal.min(inventory[k],demand);inventory[k]=inventory[k].minus(fromInventory);
      const make=Decimal.max(0,demand.minus(fromInventory)).ceil();need[k]=make;crafted[k]=crafted[k].plus(make);inventory[k]=inventory[k].plus(make).minus(demand.minus(fromInventory));
    }
    let guard=0;
    while(keys.some(k=>need[k].gt(0))) {
      for(const k of keys){const use=Decimal.min(stock[k],need[k]);need[k]=need[k].minus(use);stock[k]=stock[k].minus(use);}
      if(keys.some(k=>need[k].gt(0))) {
        if(keys.some(k=>need[k].gt(0)&&!(capacities[k]>0)))throw new Error('Capacidade de loja deve ser positiva.');
        paid++;events.push(day+1);for(const k of keys)stock[k]=D(capacities[k]);
      }
      if(++guard>10000)throw new Error('Cenário excede o limite de restocks. Reduza a projeção.');
    }
  });
  return{paid,events,crafted,finalStock:stock,finalInventory:inventory};
}
export function netSale(quantity,price,tax=12.5,alreadyNet=false) { return price===null||price===undefined?null:D(quantity).mul(price).mul(alreadyNet?1:D(1).minus(D(tax).div(100))); }
export function priceCost(requirements,prices) {let cost=D(0);const missing=[];for(const [item,qty] of Object.entries(requirements)){if(D(qty).lte(0))continue;const p=prices[item]?.value;if(p===null||p===undefined)missing.push(item);else cost=cost.plus(D(qty).mul(p));}return{cost:missing.length?null:cost,missing};}
const addReq=(req,k,v)=>{req[k]=(req[k]??D(0)).plus(v);};
export function recursiveGoldRequirements(gold,config) {
  const hitsGold=D(gold).div(config.goldYield),hitsIron=hitsGold.mul(5).div(config.ironYield),hitsStone=hitsIron.mul(5).div(config.stoneYield);
  return {'Iron Pickaxe':hitsGold,'Stone Pickaxe':hitsIron,Pickaxe:hitsStone};
}
export function vipProjection({goal,reserved,margin,dailyOther=0,deadline,now=Date.now()}) {
  const remaining=Decimal.max(0,D(goal).minus(reserved)),daily=D(margin??0).plus(dailyOther),days=remaining.eq(0)?0:daily.gt(0)?remaining.div(daily).ceil().toNumber():null;
  const daysLeft=Math.max(0,Math.ceil((deadline-now)/86400000));return{remaining,daily,days,daysLeft,neededDaily:remaining.eq(0)?D(0):daysLeft>0?remaining.div(daysLeft):null,onTime:days!==null&&days<=daysLeft,expired:deadline<=now};
}
export function investment(price,delta,days) {return{payback:D(delta).gt(0)?D(price).div(delta):null,net:D(delta).mul(days).minus(price)};}
export function deliveryValue(order,state,inventory={}) {
  const req=order.items??{},own={},buy={};for(const[k,v]of Object.entries(req)){own[k]=Decimal.min(v,inventory[k]??0);buy[k]=D(v).minus(own[k]);}
  const missingBuy=priceCost(buy,state.prices),ownValue=priceCost(own,state.prices),reward=D(order.flower??0);
  const opportunity=ownValue.cost===null?null:netSale(1,ownValue.cost,state.settings.tax);
  return{buyCost:missingBuy.cost,opportunity,margin:missingBuy.cost===null?null:reward.minus(missingBuy.cost),delta:missingBuy.cost===null||opportunity===null?null:reward.minus(missingBuy.cost).minus(opportunity),missing:[...new Set([...missingBuy.missing,...ownValue.missing])],own,buy};
}
export function calculate(state) {
  const {farm:f,settings:s}=state,days=Math.max(1,Math.min(365,Math.floor(s.days))),tax=Math.max(0,Math.min(100,s.tax)),gemValue=D(s.gemBundleFlower).div(s.gemBundleQty||1);
  const chickens=simulateChickens(f,state.chicken,days),woodPerRound=woodYield(f,state.wood.extraYield),crim=simulateCrim(f,state.crim,days),salt=simulateSalt(f,state.salt,days);
  const recovery=f.trees.length?Math.max(...f.trees.map(t=>t.recoveryMs))/3600000:2;
  const rounds=Math.min(Math.max(0,state.wood.rounds),24/recovery)+(state.wood.treeBlitz?1:0);
  const woodDaily=woodPerRound.mul(rounds),woodTools=D(f.trees.reduce((a,t)=>a+t.multiplier,0)).mul(rounds).mul(active(f,'Foreman Beaver')?0:1);
  const modules={
    chicken:{name:'Galinheiro',output:{Egg:chickens.eggs,Feather:chickens.feathers},requirements:{},tools:{},coins:D(0),daily:chickens.byDay.map(d=>netSale(d.eggs,state.prices.Egg.value,tax)?.plus(netSale(d.feathers,state.prices.Feather.value,tax)??0)??null)},
    wood:{name:'Madeira',output:{Wood:woodDaily.mul(days)},requirements:{},tools:{Axe:woodTools.mul(days)},coins:toolCoins(f,'Axe').mul(woodTools).mul(days)},
    crim:{name:'Crimstone',output:{Crimstone:sum(crim.map(d=>d.quantity))},requirements:{},tools:{'Gold Pickaxe':sum(crim.map(d=>d.tools))},coins:D(0)},
    salt:{name:'Sal',output:{Salt:sum(salt.daily.map(d=>d.quantity))},requirements:{},tools:{'Salt Rake':sum(salt.daily.map(d=>d.tools))},coins:D(0)},
  };
  const allTools=Array.from({length:days},()=>({})),seedNeeds=Array.from({length:days},()=>({}));
  for(let day=0;day<days;day++) {
    allTools[day].Axe=woodTools;allTools[day]['Gold Pickaxe']=crim[day].tools;allTools[day]['Salt Rake']=salt.daily[day].tools;
    if(state.crim.route==='self')Object.assign(allTools[day],recursiveGoldRequirements(crim[day].tools.mul(3),state.crim));
  }
  for(const [tool,quantity]of Object.entries(modules.crim.tools)) {
    modules.crim.coins=modules.crim.coins.plus(toolCoins(f,tool).mul(quantity));addReq(modules.crim.requirements,'Wood',D(quantity).mul(3));
    if(state.crim.route==='buy')addReq(modules.crim.requirements,'Gold',D(quantity).mul(3));
    else for(const[t,q]of Object.entries(recursiveGoldRequirements(D(quantity).mul(3),state.crim))){modules.crim.tools[t]=q;modules.crim.coins=modules.crim.coins.plus(toolCoins(f,t).mul(q));addReq(modules.crim.requirements,'Wood',q.mul(3));}
  }
  modules.salt.coins=toolCoins(f,'Salt Rake').mul(modules.salt.tools['Salt Rake']);addReq(modules.salt.requirements,'Wood',modules.salt.tools['Salt Rake'].mul(3));
  for(const[feed,qty]of Object.entries(chickens.totalFeed))for(const item of FEEDS[feed])addReq(modules.chicken.requirements,item,qty);
  const available={...f.inventory},orders=state.deliveries.filter(o=>o.status!=='done'),deliveryResults=[];
  for(const order of orders){const result=deliveryValue(order,state,available);deliveryResults.push({...order,result});for(const[k,q]of Object.entries(result.own))available[k]=n(D(available[k]??0).minus(q));}
  const seedCaps={Corn:f.hasWarehouse?120:100,Wheat:f.hasWarehouse?96:80,Barley:f.hasWarehouse?72:60};
  const cropYield=1+effect(f,'Old Farmer',[.1,.125,.15])+effect(f,'Acre Farm',[1,1.4,1.8])-effect(f,'Hectare Farm',[.5,.6,.7])+(active(f,'Laurie the Chuckle Crow')?(.2+effect(f,"Laurie's Gains",[.1,.15,.2]))*state.chicken.laurieCoverage/100:0);
  if(state.chicken.route==='grow') {
    const reserves={...available};
    chickens.byDay.forEach((d,day)=>{for(const[feed,qty]of Object.entries(d.feeds)) {
      const held=Decimal.min(qty,reserves[feed]??0);reserves[feed]=n(D(reserves[feed]??0).minus(held));
      const make=qty.minus(held);
      for(const crop of FEEDS[feed]) {const own=Decimal.min(make,reserves[crop]??0);reserves[crop]=n(D(reserves[crop]??0).minus(own));addReq(seedNeeds[day],crop,make.minus(own).div(cropYield));}
    }});
  }
  const seedOwned=Object.fromEntries(Object.keys(seedCaps).map(k=>[k,f.inventory[k+' Seed']??0]));
  const seedPlan=restockPlan(seedNeeds,Object.fromEntries(Object.keys(seedCaps).map(k=>[k,f.stock[k+' Seed']??0])),seedCaps,{},seedOwned);
  const seedCoins=sum(Object.entries(modules.chicken.requirements).map(([k,v])=>v.div(cropYield).mul({Corn:7,Wheat:5,Barley:10}[k])));
  const toolsCap=Object.fromEntries(Object.entries(TOOLS).map(([k,v])=>[k,k==='Axe'?200+effect(f,'More Axes',[50,100,150]):v.capacity]));
  const free=Object.fromEntries(Object.entries(TOOLS).map(([k,v])=>[k,s.freeShipments?v.shipment:0]));
  const firstShipment=s.freeShipments&&new Date(f.snapshotAt).toISOString().slice(0,10)!==new Date(f.shipmentsAt||0).toISOString().slice(0,10);
  const initialTools=Object.fromEntries(Object.keys(TOOLS).map(k=>[k,firstShipment?Math.max(f.stock[k]??0,Math.min(toolsCap[k],(f.stock[k]??0)+free[k])):f.stock[k]??0]));
  const toolPlan=restockPlan(allTools,initialTools,toolsCap,free,f.inventory);
  const totalToolDemand=Object.fromEntries(Object.keys(TOOLS).map(k=>[k,sum(allTools.map(d=>d[k]??0))]));
  const equivRestocks=Math.max(0,...Object.keys(TOOLS).map(k=>Math.max(0,n(totalToolDemand[k].div(days))-free[k])/toolsCap[k]))*days;
  const seedEquiv=state.chicken.route==='grow'?Math.max(...Object.entries(modules.chicken.requirements).map(([k,q])=>n(q.div(cropYield).div(seedCaps[k]))),0):0;
  const sustainableGems=D(equivRestocks).mul(s.toolRestockGems).plus(D(seedEquiv).mul(s.seedRestockGems));
  const paidGems=D(toolPlan.paid).mul(s.toolRestockGems).plus(D(seedPlan.paid).mul(s.seedRestockGems));
  const buyGems=Decimal.max(0,paidGems.minus(s.operatingGems)),gemPacks=buyGems.eq(0)?D(0):buyGems.div(s.gemBundleQty||1).ceil(),gemCash=gemPacks.mul(s.gemBundleFlower);
  let totalNet=D(0),totalReplacement=D(0),totalCoins=D(0),valid=0;const requirements={};
  const restockWeights=Object.fromEntries(Object.entries(modules).map(([key,m])=>[key,sum(Object.entries(m.tools).map(([t,q])=>q.div(toolsCap[t])))]));
  const weights=sum(Object.values(restockWeights));
  for(const[key,m]of Object.entries(modules)) {
    let revenue=D(0);const absent=[];for(const[item,qty]of Object.entries(m.output)){const sale=netSale(qty,state.prices[item]?.value,tax);if(sale===null&&D(qty).gt(0))absent.push(item);else revenue=revenue.plus(sale??0);}
    const cost=priceCost(m.requirements,state.prices);
    m.cropOpportunity=cost.cost===null?null:cost.cost.mul(D(1).minus(D(tax).div(100)));
    m.cropCost=cost.cost;
    m.coins=key==='chicken'&&state.chicken.route==='grow'?seedCoins:m.coins;
    const toolGems=weights.gt(0)?D(equivRestocks).mul(s.toolRestockGems).mul(restockWeights[key]).div(weights):D(0);
    m.gems=toolGems.plus(key==='chicken'?D(seedEquiv).mul(s.seedRestockGems):0);m.restockCost=m.gems.mul(gemValue);
    m.replacement=key==='chicken'&&state.chicken.route==='grow'?D(0):cost.cost;
    m.missing=[...new Set([...absent,...(key==='chicken'&&state.chicken.route==='grow'?[]:cost.missing)])];
    m.revenue=absent.length?null:revenue;
    m.margin=m.missing.length?null:revenue.minus(m.replacement??0).minus(m.restockCost);
    m.economic=m.margin===null||s.coinsPer1000===null?null:m.margin.minus(m.coins.div(1000).mul(s.coinsPer1000));
    m.opportunity=m.revenue===null||m.cropOpportunity===null?null:m.revenue.minus(m.cropOpportunity).minus(m.restockCost);
    if(m.margin!==null){totalNet=totalNet.plus(m.revenue);totalReplacement=totalReplacement.plus(m.replacement);valid++;}
    totalCoins=totalCoins.plus(m.coins);
    for(const[k,q]of Object.entries(m.requirements))if(!(key==='chicken'&&state.chicken.route==='grow'))addReq(requirements,k,q);
  }
  // Allocate shared starting inventory once, after reserving items for deliveries.
  const feedInventory=structuredClone(available);
  for(const[feed,q]of Object.entries(chickens.totalFeed)) {
    const used=Decimal.min(q,feedInventory[feed]??0);for(const crop of FEEDS[feed])if(requirements[crop])requirements[crop]=Decimal.max(0,requirements[crop].minus(used));
  }
  // Cash materials follow tools actually fabricated, not tools already held.
  const cashMaterials={};
  for(const[feed,q]of Object.entries(chickens.totalFeed))if(state.chicken.route!=='grow') {
    const make=Decimal.max(0,q.minus(feedInventory[feed]??0));for(const crop of FEEDS[feed])addReq(cashMaterials,crop,make);
  }
  for(const[tool,q]of Object.entries(toolPlan.crafted))for(const[item,amount]of Object.entries(TOOLS[tool].ingredients)) {
    if(item==='Gold'&&state.crim.route==='self')continue;
    if((item==='Iron'||item==='Stone')&&state.crim.route==='self')continue;
    addReq(cashMaterials,item,q.mul(amount));
  }
  const internalWood=s.internalWood?Decimal.min(modules.wood.output.Wood,requirements.Wood??0):D(0);
  const internalCashWood=s.internalWood?Decimal.min(modules.wood.output.Wood,cashMaterials.Wood??0):D(0);
  if(cashMaterials.Wood)cashMaterials.Wood=Decimal.max(0,cashMaterials.Wood.minus(internalCashWood));
  const cashReq=Object.fromEntries(Object.entries(cashMaterials).map(([k,q])=>[k,Decimal.max(0,q.minus(available[k]??0))]));
  const cashCost=priceCost(cashReq,state.prices);
  const allKnown=valid===4;
  const consolidation=allKnown&&state.prices.Wood.value!==null?internalWood.mul(state.prices.Wood.value).mul(D(tax).div(100)):D(0);
  const recurring=totalNet.minus(totalReplacement).minus(sum(Object.entries(modules).filter(([,m])=>m.margin!==null).map(([,m])=>m.restockCost))).plus(consolidation);
  const partial=valid<4;
  const internalSale=netSale(internalCashWood,state.prices.Wood.value,tax)??D(0);
  const cash=allKnown&&cashCost.cost!==null?totalNet.minus(internalSale).minus(cashCost.cost).minus(gemCash):null;
  const cashCoins=sum(Object.entries(toolPlan.crafted).map(([k,q])=>q.mul(toolCoins(f,k)))).plus(state.chicken.route==='grow'?sum(Object.entries(seedPlan.crafted).map(([k,q])=>q.mul({Corn:7,Wheat:5,Barley:10}[k]))):0);
  const economic=allKnown&&s.coinsPer1000!==null?recurring.minus(totalCoins.div(1000).mul(s.coinsPer1000)):null;
  const vip=vipProjection({goal:state.vip.goal,reserved:state.vip.reserved,margin:allKnown?n(recurring.div(days)):null,dailyOther:state.vip.otherDaily,deadline:f.vipExpires});
  const plots=sum(Object.entries(modules.chicken.requirements).map(([k,q])=>q.div(cropYield).div(days).mul({Corn:20,Wheat:24,Barley:48}[k]).mul(effect(f,'Green Thumb',[.95,.925,.9],1)).div(24)));
  const dailyChart=Array.from({length:days+1},(_,i)=>({day:i,value:n(recurring.div(days).mul(i))}));
  return{days,tax,chickens,modules,woodPerRound,woodDaily,recovery,rounds,crim,salt,toolPlan,seedPlan,totalToolDemand,toolsCap,seedCaps,cropYield,plots,totalCoins,cashCoins,sustainableGems,paidGems,gemCash,gemPacks,cashCost,cashReq,partial,valid,recurring,cash,economic,vip,dailyChart,deliveryResults,remainingInventory:available,internalWood,internalCashWood,consolidation};
}
