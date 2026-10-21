(() => {
"use strict";
const canvas = document.querySelector("#game"), ctx = canvas.getContext("2d");
const $ = s => document.querySelector(s);
const overlay = $("#overlay"), titleEl=$("#overlay-title"), copyEl=$("#overlay-copy");
const menuActions=$("#menu-actions"), pauseActions=$("#pause-actions"), shopPanel=$("#shop-panel");
const hud=$("#hud"), touchUI=$("#touch-ui");
const hpFill=$("#hp-fill"), hpText=$("#hp-text"), dashFill=$("#dash-fill");
const stageLabel=$("#stage-label"), coinsLabel=$("#coins-label"), gemsLabel=$("#gems-label");
const bossWrap=$("#boss-wrap"), bossName=$("#boss-name"), bossFill=$("#boss-fill");

const THEMES = [
 {name:"DARK DUNGEON",bg:"#101321",far:"#1d2034",platform:"#34374c",glow:"#9b6cff",dust:"#a9a0ff"},
 {name:"TOXIC SEWERS",bg:"#101b18",far:"#1d3930",platform:"#35594b",glow:"#72ff9c",dust:"#a5ff75"},
 {name:"CRIMSON CAVERN",bg:"#210f1c",far:"#4b1c34",platform:"#70304d",glow:"#ff5279",dust:"#ff8b9b"},
 {name:"CYBER RUINS",bg:"#0b1725",far:"#173b54",platform:"#286078",glow:"#52e5ff",dust:"#85f4ff"},
 {name:"MOLTEN CORE",bg:"#26130d",far:"#532315",platform:"#75402a",glow:"#ff8b32",dust:"#ffc16a"},
 {name:"FROST CRYPT",bg:"#111a2b",far:"#263e59",platform:"#42627c",glow:"#9ee8ff",dust:"#d6f7ff"},
 {name:"HAUNTED WILDS",bg:"#111b15",far:"#273b2c",platform:"#405b3c",glow:"#c3ff6b",dust:"#c6f2a0"},
 {name:"SUNKEN TEMPLE",bg:"#0d2025",far:"#1b4548",platform:"#326a69",glow:"#51f0d4",dust:"#a5ffeb"},
 {name:"VOID REALM",bg:"#100c20",far:"#2a1644",platform:"#492c70",glow:"#d47bff",dust:"#e9aaff"},
 {name:"OBLIVION",bg:"#08090e",far:"#262631",platform:"#494955",glow:"#ff4d63",dust:"#ff8491"}
];
const WEAPONS = [
 {id:"sword",name:"Grave Sword",type:"melee",cost:0,gem:0,damage:24,rate:0.30,range:68,desc:"Fast close slash"},
 {id:"shield",name:"Bulwark Blade",type:"shield",cost:180,gem:0,damage:20,rate:0.42,range:62,desc:"Reduced frontal damage"},
 {id:"bow",name:"Ash Bow",type:"projectile",cost:260,gem:0,damage:31,rate:0.62,speed:480,pierce:1,gravity:190,desc:"Piercing arrows with drop"},
 {id:"crossbow",name:"Iron Crossbow",type:"projectile",cost:520,gem:2,damage:49,rate:0.86,speed:600,pierce:2,gravity:130,desc:"Heavy piercing bolt"},
 {id:"wand",name:"Wisp Wand",type:"magic",cost:420,gem:1,damage:28,rate:0.55,speed:330,homing:true,desc:"Homing arcane bolts"},
 {id:"gun",name:"Rift Pistol",type:"gun",cost:700,gem:2,damage:15,rate:0.12,speed:760,desc:"Rapid ballistic fire"},
 {id:"flame",name:"Cinder Projector",type:"flame",cost:1100,gem:4,damage:7,rate:0.07,range:160,desc:"Short-range burn cone"},
 {id:"storm",name:"Storm Relic",type:"magic",cost:2200,gem:9,damage:44,rate:0.48,speed:400,homing:true,aoe:58,desc:"Homing splash blast"}
];
const ARMORS = [
 {id:"cloth",name:"Ragged Wraps",cost:0,gem:0,hp:0,def:0,speed:0},
 {id:"leather",name:"Gloom Leather",cost:220,gem:0,hp:18,def:.08,speed:8},
 {id:"iron",name:"Crypt Iron",cost:600,gem:2,hp:35,def:.15,speed:2},
 {id:"wraith",name:"Wraithweave",cost:1450,gem:5,hp:24,def:.20,speed:14},
 {id:"abyss",name:"Abyssal Plate",cost:3300,gem:14,hp:55,def:.27,speed:-4}
];
let W=960,H=540,dpr=1,last=0,elapsed=0,mode="menu",paused=false,gameOver=false;
let keys={},touch={},particles=[],shots=[],enemies=[],platforms=[],loot=[],stars=[];
let camera=0,level=1,wave=0,worldWidth=2400,spawnTimer=0,killCount=0,levelCoins=0,boss=null;
let player;
const saveDefault={unlocked:1,coins:0,gems:0,weapon:"sword",armor:"cloth",ownedWeapons:["sword"],ownedArmor:["cloth"],upgrades:{},bestWave:0};
let save=loadSave();
function loadSave(){try{return {...saveDefault,...JSON.parse(localStorage.getItem("shadowfall-save")||"{}")}}catch{return {...saveDefault}}}
function persist(){try{localStorage.setItem("shadowfall-save",JSON.stringify(save))}catch{}}
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=Math.floor(W*dpr);canvas.height=Math.floor(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener("resize",resize);resize();
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function rand(a,b){return a+Math.random()*(b-a)}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
function glow(x,y,r,color){ctx.save();ctx.globalAlpha=.45;ctx.shadowBlur=r;ctx.shadowColor=color;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,Math.max(1,r*.18),0,Math.PI*2);ctx.fill();ctx.restore()}
function theme(){return THEMES[Math.floor((Math.max(1,level)-1)/10)%10]}
function armor(){return ARMORS.find(a=>a.id===save.armor)||ARMORS[0]}
function weapon(){return WEAPONS.find(w=>w.id===save.weapon)||WEAPONS[0]}
function makePlayer(){const a=armor();return {x:100,y:200,vx:0,vy:0,w:25,h:42,hp:100+a.hp,maxHp:100+a.hp,face:1,ground:false,jumps:0,attackCd:0,dashCd:0,dashTime:0,invuln:0,anim:0,burn:0}}
function showOverlay(title,copy,kind="menu"){overlay.classList.remove("hidden");titleEl.innerHTML=title;copyEl.textContent=copy;menuActions.classList.toggle("hidden",kind!=="menu");pauseActions.classList.toggle("hidden",kind!=="pause");shopPanel.classList.add("hidden")}
function hideOverlay(){overlay.classList.add("hidden")}
function setMode(next){mode=next;paused=false;gameOver=false;hideOverlay();hud.classList.remove("hidden");touchUI.classList.remove("hidden");if(next==="campaign"){level=clamp(level,1,100);startLevel(level)}else if(next==="infinite"){level=1;wave=0;startLevel(1,true)}else if(next==="shop"){openShop("menu")} }
function startLevel(n,infinite=false){level=n;worldWidth=infinite?2600:2200+Math.min(n,100)*10;camera=0;particles=[];shots=[];enemies=[];loot=[];boss=null;killCount=0;levelCoins=0;spawnTimer=1.1;player=makePlayer();player.x=90;player.y=H*.52;buildWorld();if(n%5===0&&!infinite)spawnBoss();else if(infinite&&wave>0&&wave%5===0)spawnBoss();updateHud()}
function buildWorld(){platforms=[{x:0,y:H-54,w:worldWidth,h:80,main:true}];let x=190;while(x<worldWidth-180){let pw=rand(110,230),py=H-rand(115,255);platforms.push({x,y:py,w:pw,h:16});x+=pw+rand(75,155)}}
function spawnBoss(){const names=["THE CELLAR KING","MIRE ENGINE","BLOOD MATRIARCH","NULL SENTINEL","THE CINDER TITAN","FROST JUDGE","THORN COLOSSUS","DROWNED ORACLE","VOID REGENT","THE LAST SHADOW"];let hp=340+level*36;boss={x:worldWidth-240,y:H-160,w:94,h:106,hp,maxHp:hp,name:names[Math.floor((level-1)/10)%10],phase:1,attack:1.3,flash:0};bossName.textContent=boss.name;bossWrap.classList.remove("hidden")}
function spawnEnemy(forceType){let types=["rusher","archer","flyer","tank"],t=forceType||types[Math.floor(Math.random()*types.length)];const scale=mode==="infinite"?1+wave*.12:1+Math.max(0,level-1)*.027;let e={type:t,x:camera+W+rand(40,230),y:H-100,w:26,h:34,hp:34*scale,maxHp:34*scale,speed:rand(65,105)*scale,cd:rand(.5,1.8),flash:0,burn:0};if(t==="archer"){e.hp*=.85;e.y=H-rand(120,210);e.w=24;e.h=32;e.speed*=.7}if(t==="flyer"){e.y=rand(H*.22,H*.6);e.w=30;e.h=24;e.speed*=1.15}if(t==="tank"){e.hp*=2.6;e.w=38;e.h=42;e.speed*=.52}enemies.push(e)}
function dropLoot(x,y,big=false){loot.push({x,y,vx:rand(-45,45),vy:-rand(90,170),kind:Math.random()<(big?.7:.12)?"gem":"coin",life:15});let count=big?6:Math.floor(rand(1,3));for(let i=0;i<count;i++)loot.push({x:x+rand(-15,15),y:y+rand(-8,8),vx:rand(-40,40),vy:-rand(70,140),kind:"coin",life:12})}
function hurtEnemy(e,dmg){e.hp-=dmg;e.flash=.1;burst(e.x+e.w/2,e.y+e.h/2,theme().glow,5);if(e.hp<=0){dropLoot(e.x,e.y);killCount++;return true}return false}
function burst(x,y,color,n){for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-150,150),vy:rand(-170,70),life:rand(.18,.65),max:.65,size:rand(2,5),color})}
function attack(){if(player.attackCd>0)return;const w=weapon();player.attackCd=w.rate;const px=player.x+player.w/2,py=player.y+player.h*.52,dir=player.face;
 if(w.type==="melee"||w.type==="shield"){player.anim=.22;for(let e of enemies){let dx=(e.x+e.w/2)-px,dy=(e.y+e.h/2)-py;if(dx*dir>-8&&dx*dir<w.range&&Math.abs(dy)<55)hurtEnemy(e,w.damage)}if(boss&&Math.abs((boss.x+boss.w/2)-px)<w.range+boss.w/2&&Math.abs((boss.y+boss.h/2)-py)<90)bossHit(w.damage)}
 else if(w.type==="flame"){for(let e of enemies){let dx=(e.x+e.w/2)-px,dy=(e.y+e.h/2)-py;if(dx*dir>0&&dx*dir<w.range&&Math.abs(dy)<65){e.burn=1.8;hurtEnemy(e,w.damage)}}if(boss&&((boss.x-px)*dir>0)&&Math.abs(boss.x-px)<w.range+boss.w/2)bossHit(w.damage)}
 else {let sx=px+dir*14;shots.push({x:sx,y:py,vx:dir*w.speed,vy:rand(-12,12),dmg:w.damage,life:2.5,pierce:w.pierce||0,gravity:w.gravity||0,homing:w.homing||false,aoe:w.aoe||0,color:w.type==="magic"?"#b47aff":w.id==="bow"||w.id==="crossbow"?"#ffce7a":"#70eaff"})}
}
function bossHit(d){if(!boss)return;boss.hp-=d;boss.flash=.12;burst(boss.x+boss.w/2,boss.y+boss.h/2,"#ff5577",8);if(boss.hp<=0){dropLoot(boss.x,boss.y,true);save.gems+=3+Math.floor(level/10);save.coins+=100+level*4;boss=null;bossWrap.classList.add("hidden");persist();if(mode==="campaign")setTimeout(()=>finishLevel(),650)}}
function finishLevel(){if(mode!=="campaign")return;save.unlocked=Math.max(save.unlocked,Math.min(100,level+1));persist();showOverlay("FLOOR CLEARED",`Level ${level} cleared. Loot secured: ${levelCoins} coins. Upgrade your gear before the next descent.`,"clear");menuActions.innerHTML=`<button data-action="next" class="primary">${level>=100?"CAMPAIGN COMPLETE":"NEXT LEVEL"}</button><button data-action="shop">SHOP / ARMORY</button><button data-action="menu">MAIN MENU</button>`;menuActions.classList.remove("hidden");}
function openShop(back="menu"){mode="shop";overlay.classList.remove("hidden");hud.classList.add("hidden");touchUI.classList.add("hidden");titleEl.textContent="ARMORY & BLACK MARKET";copyEl.textContent=`Coins: ${save.coins}  ·  Diamonds: ${save.gems}. Gear improves survival, not invulnerability.`;menuActions.classList.add("hidden");pauseActions.classList.add("hidden");shopPanel.classList.remove("hidden");shopPanel.innerHTML="";let head=document.createElement("h3");head.textContent="WEAPONS";shopPanel.append(head);WEAPONS.forEach(w=>{let owned=save.ownedWeapons.includes(w.id),el=document.createElement("button");el.className="shop-item";el.textContent=`${w.name} — ${w.damage} dmg · ${w.cost} coins / ${w.gem} ◆${owned?(save.weapon===w.id?" · EQUIPPED":" · OWNED"):""}`;el.onclick=()=>{if(owned){save.weapon=w.id}else if(save.coins>=w.cost&&save.gems>=w.gem){save.coins-=w.cost;save.gems-=w.gem;save.ownedWeapons.push(w.id);save.weapon=w.id}else{copyEl.textContent="Not enough currency for this item.";return}persist();openShop(back)};shopPanel.append(el)});let h2=document.createElement("h3");h2.textContent="ARMOR";shopPanel.append(h2);ARMORS.forEach(a=>{let owned=save.ownedArmor.includes(a.id),el=document.createElement("button");el.className="shop-item";el.textContent=`${a.name} — +${a.hp} HP · ${Math.round(a.def*100)}% defense · ${a.cost} coins / ${a.gem} ◆${owned?(save.armor===a.id?" · EQUIPPED":" · OWNED"):""}`;el.onclick=()=>{if(owned){save.armor=a.id}else if(save.coins>=a.cost&&save.gems>=a.gem){save.coins-=a.cost;save.gems-=a.gem;save.ownedArmor.push(a.id);save.armor=a.id}else{copyEl.textContent="Not enough currency for this item.";return}persist();openShop(back)};shopPanel.append(el)});let close=document.createElement("button");close.textContent=back==="menu"?"BACK TO MENU":"RETURN TO RUN";close.className="primary";close.style.marginTop="12px";close.onclick=()=>{if(back==="menu"){showOverlay("SHADOWFALL<span>: 100 FLOORS</span>","Fight through shifting biomes. Learn enemy patterns. Never stop moving.","menu");menuActions.innerHTML='<button data-action="campaign" class="primary">PLAY CAMPAIGN</button><button data-action="infinite">INFINITE MODE</button><button data-action="shop">SHOP / ARMORY</button>';menuActions.classList.remove("hidden")}else{mode=back;hideOverlay();hud.classList.remove("hidden");touchUI.classList.remove("hidden");if(!player)startLevel(level,mode==="infinite")}};shopPanel.append(close)}
function finishInfinite(){save.bestWave=Math.max(save.bestWave,wave);persist();gameOver=true;showOverlay("YOU WERE OVERRUN",`Survived to wave ${wave}. Best: ${save.bestWave}. Coins and diamonds are saved.`,"over");menuActions.innerHTML='<button data-action="infinite" class="primary">TRY AGAIN</button><button data-action="shop">SHOP / ARMORY</button><button data-action="menu">MAIN MENU</button>';menuActions.classList.remove("hidden")}
function damagePlayer(d){if(player.invuln>0||player.dashTime>0)return;let reduction=armor().def;if(weapon().type==="shield"&&player.face<0)reduction=Math.min(.55,reduction+.22);player.hp-=d*(1-reduction);player.invuln=.65;burst(player.x+player.w/2,player.y+player.h/2,"#ff4d6a",9);if(player.hp<=0){player.hp=0;gameOver=true;if(mode==="infinite")finishInfinite();else{showOverlay("YOU HAVE FALLEN",`You reached level ${level}. Currency and gear are retained; level progress is unchanged.`,"over");menuActions.innerHTML='<button data-action="restart" class="primary">RETRY LEVEL</button><button data-action="shop">SHOP / ARMORY</button><button data-action="menu">MAIN MENU</button>';menuActions.classList.remove("hidden")}}}
function update(dt){elapsed+=dt;if(mode==="menu"||mode==="shop"||paused||gameOver||!player)return;const t=theme(),a=armor();player.anim=Math.max(0,player.anim-dt);player.attackCd=Math.max(0,player.attackCd-dt);player.dashCd=Math.max(0,player.dashCd-dt);player.dashTime=Math.max(0,player.dashTime-dt);player.invuln=Math.max(0,player.invuln-dt);player.burn=Math.max(0,player.burn-dt);
 let left=keys.ArrowLeft||keys.KeyA||touch.left,right=keys.ArrowRight||keys.KeyD||touch.right,up=keys.ArrowUp||keys.KeyW||touch.up,down=keys.ArrowDown||keys.KeyS||touch.down;
 const crouch=down||touch.crouch;let speed=235+a.speed;if(crouch)speed*=.5;if(left){player.vx=-speed;player.face=-1}else if(right){player.vx=speed;player.face=1}else player.vx*=Math.pow(.001,dt);
 if(up&&player.ground&&touch.up){/* up is directional only */} if(up&&!player.ground&&player.vy>0)player.vy-=40*dt;
 if(touch.jump||keys.Space){if(!player.jumpLatch){if(player.jumps<2){player.vy=player.jumps===0?-440:-390;player.jumps++;player.ground=false}player.jumpLatch=true}}else player.jumpLatch=false;
 if((touch.dash||keys.ShiftLeft||keys.KeyK)&&player.dashCd<=0){player.dashTime=.17;player.dashCd=1.25;player.invuln=.23;player.vx=player.face*700;burst(player.x+player.w/2,player.y+player.h/2,t.glow,8);touch.dash=false}
 if((touch.attack||keys.KeyJ||keys.KeyX||keys.Enter)&&player.attackCd<=0){attack();touch.attack=false}
 if(touch.switch||keys.KeyQ){let idx=WEAPONS.findIndex(w=>w.id===save.weapon);save.weapon=WEAPONS[(idx+1)%WEAPONS.length].id;while(!save.ownedWeapons.includes(save.weapon)){idx=(idx+1)%WEAPONS.length;save.weapon=WEAPONS[idx].id}touch.switch=false;keys.KeyQ=false}
 if(player.dashTime>0)player.vx=player.face*700;
 player.vy+=1250*dt;player.x+=player.vx*dt;player.y+=player.vy*dt;player.x=clamp(player.x,0,worldWidth-player.w);
 player.w=25;player.h=crouch?25:42;
 player.ground=false;
 for(const p of platforms){if(player.vy>=0&&player.x+player.w>p.x&&player.x<p.x+p.w){let oldY=player.y-player.vy*dt;if(oldY+player.h<=p.y+8&&player.y+player.h>=p.y){if(crouch&&p.main===false)continue;player.y=p.y-player.h;player.vy=0;player.ground=true;player.jumps=0}}}
 if(player.y>H+120)damagePlayer(999);
 camera=clamp(player.x-W*.38,0,Math.max(0,worldWidth-W));
 // ambient particles
 if(Math.random()<dt*10)particles.push({x:camera+rand(0,W),y:rand(0,H),vx:rand(-10,10),vy:rand(-24,-4),life:rand(1,3),max:3,size:rand(1,3),color:t.dust,ambient:true});
 // spawn pressure and progression
 spawnTimer-=dt;if(spawnTimer<=0&&!boss){let scale=mode==="infinite"?1+wave*.08:1+level*.035;spawnEnemy();spawnTimer=Math.max(.32,(mode==="infinite"?1.7:2.5)-Math.min(1.1,level*.009)-Math.min(1.0,wave*.035))*rand(.7,1.25)}
 for(let i=enemies.length-1;i>=0;i--){let e=enemies[i];e.flash=Math.max(0,e.flash-dt);e.cd-=dt;if(e.burn>0){e.burn-=dt;if(Math.random()<dt*5)e.hp-=4*dt}
  let dx=(player.x+player.w/2)-(e.x+e.w/2),dy=(player.y+player.h/2)-(e.y+e.h/2);
  if(e.type==="archer"){if(Math.abs(dx)<390&&e.cd<=0){shots.push({x:e.x+e.w/2,y:e.y+e.h/2,vx:Math.sign(dx)*-250,vy:30,dmg:9+level*.18,life:3,enemy:true,color:"#ff7b8f"});e.cd=rand(1.1,2)}e.x+=Math.sign(dx)*e.speed*.22*dt}
  else if(e.type==="flyer"){e.x+=Math.sign(dx)*e.speed*dt;e.y+=Math.sin(elapsed*4+e.x)*35*dt;if(Math.abs(dx)<30&&Math.abs(dy)<35)damagePlayer(10*dt)}
  else {e.x+=Math.sign(dx)*e.speed*dt;if(Math.abs(dx)<player.w+e.w&&Math.abs(dy)<45)damagePlayer((e.type==="tank"?24:13)*dt)}
  if(e.x<camera-150||e.hp<=0){if(e.hp<=0)dropLoot(e.x,e.y);enemies.splice(i,1)}
 }
 if(boss){boss.flash=Math.max(0,boss.flash-dt);boss.attack-=dt;boss.phase=boss.hp<boss.maxHp*.48?2:1;let dx=player.x-boss.x;boss.x+=Math.sign(dx)*Math.min(Math.abs(dx),boss.phase===2?95:45)*dt;boss.y=H-160+Math.sin(elapsed*2)*12;if(boss.attack<=0){if(boss.phase===1){for(let i=-1;i<=1;i++)shots.push({x:boss.x,y:boss.y+40,vx:-260,vy:i*100,dmg:18+level*.2,life:3,enemy:true,color:"#ff446a"}) ;boss.attack=1.65}else{for(let i=-2;i<=2;i++)shots.push({x:boss.x,y:boss.y+45,vx:-300,vy:i*125,dmg:22+level*.25,life:3,enemy:true,color:"#ff446a"});boss.attack=1.05}}if(Math.abs(player.x-boss.x)<boss.w&&Math.abs(player.y-boss.y)<boss.h*.7)damagePlayer(28*dt)}
 for(let i=shots.length-1;i>=0;i--){let s=shots[i];s.life-=dt;if(s.homing&&!s.enemy){let target=enemies.reduce((best,e)=>!best||Math.abs(e.x-s.x)<Math.abs(best.x-s.x)?e:best,null);if(target){let dx=target.x-s.x,dy=target.y-s.y,l=Math.hypot(dx,dy)||1;s.vx+=dx/l*360*dt;s.vy+=dy/l*360*dt;let sp=Math.hypot(s.vx,s.vy)||1;s.vx=s.vx/sp*420;s.vy=s.vy/sp*420}}
 s.vy+=(s.gravity||0)*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;
 if(s.enemy){if(s.x<player.x+player.w&&s.x+6>player.x&&s.y<player.y+player.h&&s.y+6>player.y){damagePlayer(s.dmg);s.life=0}}
 else{let hit=false;for(let j=enemies.length-1;j>=0;j--){let e=enemies[j];if(s.x>e.x&&s.x<e.x+e.w&&s.y>e.y&&s.y<e.y+e.h){if(hurtEnemy(e,s.dmg)){enemies.splice(j,1)}if(s.aoe)for(let other of enemies)if(Math.hypot(other.x-e.x,other.y-e.y)<s.aoe)hurtEnemy(other,s.dmg*.55);if(s.pierce>0)s.pierce--;else{s.life=0;hit=true}break}}if(boss&&s.x>boss.x&&s.x<boss.x+boss.w&&s.y>boss.y&&s.y<boss.y+boss.h){bossHit(s.dmg);if(s.pierce>0)s.pierce--;else s.life=0}}
 if(s.life<=0||s.x<camera-80||s.x>camera+W+100||s.y>H+100||s.y< -100)shots.splice(i,1)}
 for(let i=loot.length-1;i>=0;i--){let l=loot[i];l.life-=dt;l.vy+=420*dt;l.x+=l.vx*dt;l.y+=l.vy*dt;if(l.y>H-65){l.y=H-65;l.vy*=-.3}if(Math.hypot((player.x+12)-l.x,(player.y+20)-l.y)<48){if(l.kind==="gem")save.gems++;else{save.coins++;levelCoins++}loot.splice(i,1);persist()}else if(l.life<=0)loot.splice(i,1)}
 for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(!p.ambient)p.vy+=300*dt;if(p.life<=0)particles.splice(i,1)}
 if(mode==="campaign"&&!boss&&killCount>=Math.min(5+Math.floor(level/8),15))finishLevel();
 if(mode==="infinite"&&!boss&&killCount>=5+Math.floor(wave*.65)){wave++;killCount=0;save.coins+=12+wave*2;if(wave%5===0)spawnBoss();persist();if(!boss)spawnTimer=.1}
 updateHud();
}
function updateHud(){if(!player)return;hpFill.style.width=`${clamp(player.hp/player.maxHp*100,0,100)}%`;hpText.textContent=`${Math.ceil(player.hp)}/${player.maxHp}`;dashFill.style.width=`${(1-player.dashCd/1.25)*100}%`;stageLabel.textContent=mode==="infinite"?`WAVE ${wave}`:`LEVEL ${level} · ${theme().name}`;coinsLabel.textContent=`◈ ${save.coins}`;gemsLabel.textContent=`◆ ${save.gems}`;if(boss){bossWrap.classList.remove("hidden");bossFill.style.width=`${clamp(boss.hp/boss.maxHp*100,0,100)}%`}else bossWrap.classList.add("hidden")}
function draw(){ctx.clearRect(0,0,W,H);let t=theme();rect(0,0,W,H,t.bg);
 // distant silhouettes and parallax moons
 ctx.save();ctx.translate(-camera*.18,0);for(let i=0;i<12;i++){let x=i*180-40;ctx.fillStyle=t.far;ctx.beginPath();ctx.moveTo(x,H-54);ctx.lineTo(x+35,H*.48+Math.sin(i*4)*25);ctx.lineTo(x+85,H*.67);ctx.lineTo(x+125,H*.5);ctx.lineTo(x+170,H-54);ctx.fill()}ctx.restore();
 glow(W*.76,H*.22,55,t.glow);ctx.globalAlpha=.14;ctx.fillStyle=t.glow;ctx.beginPath();ctx.arc(W*.76,H*.22,22,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 for(const p of platforms){let x=p.x-camera;if(x+p.w<0||x>W)continue;rect(x,p.y,p.w,p.h,p.main?t.platform:t.platform);rect(x,p.y,p.w,3,t.glow);for(let k=0;k<p.w;k+=22)rect(x+k,p.y+5,1,p.h-5,"#080a1180")}
 // coins and particles
 for(const l of loot){let x=l.x-camera;glow(x,l.y,15,l.kind==="gem"?"#70faff":"#ffc85c");ctx.fillStyle=l.kind==="gem"?"#8ff7ff":"#ffce64";ctx.beginPath();if(l.kind==="gem"){ctx.moveTo(x,l.y-7);ctx.lineTo(x+6,l.y);ctx.lineTo(x,l.y+7);ctx.lineTo(x-6,l.y);ctx.closePath()}else ctx.arc(x,l.y,4,0,Math.PI*2);ctx.fill()}
 for(const p of particles){ctx.globalAlpha=clamp(p.life/(p.max||.65),0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x-camera,p.y,p.size,p.size)}ctx.globalAlpha=1;
 for(const s of shots){glow(s.x-camera,s.y,14,s.color);rect(s.x-camera-4,s.y-2,8,4,s.color)}
 for(const e of enemies){let x=e.x-camera;ctx.save();ctx.translate(x+e.w/2,e.y+e.h/2);ctx.fillStyle=e.flash>0?"#fff":e.type==="tank"?"#9c5265":e.type==="archer"?"#7a8fa5":e.type==="flyer"?"#a17be0":"#bd3f5b";ctx.beginPath();ctx.ellipse(0,0,e.w/2,e.h/2,0,0,Math.PI*2);ctx.fill();rect(-e.w*.35,-e.h*.4,e.w*.7,5,"#17121d");rect(-e.w*.25,-e.h*.1,4,3,"#ffecf2");rect(e.w*.1,-e.h*.1,4,3,"#ffecf2");ctx.restore();rect(x,e.y-7,e.w,3,"#242536");rect(x,e.y-7,e.w*clamp(e.hp/e.maxHp,0,1),3,"#ff466b")}
 if(boss){let x=boss.x-camera;glow(x+boss.w/2,boss.y+boss.h/2,42,"#ff315f");ctx.fillStyle=boss.flash>0?"#fff":"#521b36";ctx.beginPath();ctx.moveTo(x+boss.w*.5,boss.y);ctx.lineTo(x+boss.w,boss.y+boss.h*.25);ctx.lineTo(x+boss.w*.88,boss.y+boss.h);ctx.lineTo(x+boss.w*.15,boss.y+boss.h);ctx.lineTo(x,boss.y+boss.h*.3);ctx.closePath();ctx.fill();rect(x+18,boss.y+32,12,7,"#ff6b89");rect(x+boss.w-30,boss.y+32,12,7,"#ff6b89");rect(x+10,boss.y-10,boss.w-20,4,"#20131f");rect(x+10,boss.y-10,(boss.w-20)*boss.hp/boss.maxHp,4,"#ff315f")}
 if(player){let x=player.x-camera,y=player.y;ctx.save();if(player.invuln>0&&Math.floor(elapsed*22)%2===0)ctx.globalAlpha=.45;glow(x+player.w/2,y+player.h*.48,18,theme().glow);ctx.fillStyle=armor().id==="abyss"?"#697386":armor().id==="wraith"?"#5a4b78":"#242737";ctx.beginPath();ctx.moveTo(x+3,y+player.h);ctx.lineTo(x+5,y+9);ctx.lineTo(x+player.w/2,y);ctx.lineTo(x+player.w-3,y+9);ctx.lineTo(x+player.w-1,y+player.h);ctx.closePath();ctx.fill();rect(x+player.w*.48,y+12,player.face===1?8:3,4,"#ff6e8a");rect(x+player.w*.15,y+player.h-7,7,7,"#090b12");rect(x+player.w*.65,y+player.h-7,7,7,"#090b12");if(player.anim>0){ctx.strokeStyle=theme().glow;ctx.lineWidth=5;ctx.beginPath();ctx.arc(x+player.w/2+player.face*22,y+player.h/2,25,-1.1,1.1);ctx.stroke()}ctx.restore()}
 // subtle vignette
 const grd=ctx.createRadialGradient(W/2,H/2,H*.18,W/2,H/2,H*.85);grd.addColorStop(0,"#00000000");grd.addColorStop(1,"#020309a8");ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
}
function loop(ts){let dt=Math.min(.033,(ts-last)/1000||0);last=ts;update(dt);draw();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
addEventListener("keydown",e=>{keys[e.code]=true;if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space"].includes(e.code))e.preventDefault();if(e.code==="Escape"&&mode!=="menu"&&mode!=="shop"){paused=!paused;if(paused)showOverlay("PAUSED","The descent can wait. Resume when ready.","pause");else hideOverlay()}});
addEventListener("keyup",e=>keys[e.code]=false);
document.querySelectorAll("[data-hold]").forEach(btn=>{let key=btn.dataset.hold;const on=e=>{e.preventDefault();touch[key]=true};const off=e=>{e.preventDefault();if(key!=="attack"&&key!=="jump"&&key!=="dash")touch[key]=false};btn.addEventListener("pointerdown",on);btn.addEventListener("pointerup",off);btn.addEventListener("pointercancel",off);btn.addEventListener("pointerleave",off)});
$("#pause-btn").addEventListener("click",()=>{paused=true;showOverlay("PAUSED","The descent can wait. Resume when ready.","pause")});
overlay.addEventListener("click",e=>{let b=e.target.closest("[data-action]");if(!b)return;const a=b.dataset.action;
 if(a==="campaign"){mode="campaign";level=clamp(save.unlocked,1,100);setMode("campaign")}
 else if(a==="infinite"){mode="infinite";wave=0;setMode("infinite")}
 else if(a==="shop")openShop(mode==="menu"?"menu":mode)
 else if(a==="resume"){paused=false;hideOverlay()}
 else if(a==="restart"){if(mode==="campaign")startLevel(level);else startLevel(1,true);hideOverlay()}
 else if(a==="next"){if(level>=100){showOverlay("THE ABYSS IS QUIET","You cleared all 100 floors. Infinite mode remains available.","menu");menuActions.innerHTML='<button data-action="infinite" class="primary">INFINITE MODE</button><button data-action="shop">SHOP / ARMORY</button><button data-action="menu">MAIN MENU</button>';menuActions.classList.remove("hidden")}else{mode="campaign";startLevel(level+1);hideOverlay()}}
 else if(a==="menu"){mode="menu";hud.classList.add("hidden");touchUI.classList.add("hidden");menuActions.innerHTML='<button data-action="campaign" class="primary">PLAY CAMPAIGN</button><button data-action="infinite">INFINITE MODE</button><button data-action="shop">SHOP / ARMORY</button>';showOverlay("SHADOWFALL<span>: 100 FLOORS</span>","Fight through shifting biomes. Learn enemy patterns. Never stop moving.","menu")}
});
showOverlay("SHADOWFALL<span>: 100 FLOORS</span>","A procedural dark-fantasy platform shooter. Campaign, endless survival, bosses, loot, and a persistent armory.","menu");
})();
