(function(){
  var $=function(s){return document.querySelector(s)};
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS='http://www.w3.org/2000/svg';
  document.documentElement.classList.add('js');
  var main=$('#main'),cover=$('#cover'),opened=false;

  /* ---------- cover ambience ---------- */
  for(var s=0;s<28;s++){var st0=document.createElement('i');st0.className='star';st0.style.left=(Math.random()*100)+'%';st0.style.top=(Math.random()*100)+'%';st0.style.animationDelay=(Math.random()*3)+'s';st0.style.animationDuration=(2+Math.random()*3)+'s';cover.appendChild(st0)}

  /* ---------- sound (synthesised temple bell + ambient wedding music) ---------- */
  var ac=null,muted=false,snd=$('#snd');
  function bell(f,t,v){
    if(!ac)return;
    [[1,.22],[2.76,.09],[5.4,.04]].forEach(function(p){
      var o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f*p[0];
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(p[1]*v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+3.2);
      o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+3.3);
    });
  }
  function chime(){
    if(muted||!ac)return;
    try{
      var t=ac.currentTime+.05;
      [[523.25,0],[659.25,.22],[783.99,.44],[1046.5,.7],[1318.5,1.05]].forEach(function(n){bell(n[0],t+n[1],1)});
    }catch(e){}
  }

  /* gentle generative background music: a soft sustained pad plus a slow
     wandering music-box melody, built from oscillators so no audio file
     needs to be hosted. volume is intentionally low and sits under the
     bell/scratch/confetti sound effects rather than competing with them. */
  var musicGain=null,musicOn=false,padTimer=null,melTimer=null,melIdx=0,melDir=1;
  var MUSIC_VOL=.13;
  var padChord=[261.63,329.63,392.00];              // C4 E4 G4 - soft sustained pad
  var melScale=[392.00,440.00,523.25,587.33,659.25,783.99]; // G4 A4 C5 D5 E5 G5 - pentatonic wander

  function padNote(f,t,dur){
    var o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.5,t+dur*.4);g.gain.linearRampToValueAtTime(0,t+dur);
    o.connect(g);g.connect(musicGain);o.start(t);o.stop(t+dur+.1);
  }
  function padLoop(){
    if(!musicOn)return;
    var t=ac.currentTime+.05;
    padChord.forEach(function(f){padNote(f,t,9)});
    padTimer=setTimeout(padLoop,8000);
  }
  function melNote(f,t){
    [[1,.5],[2,.16],[3,.07]].forEach(function(p){
      var o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f*p[0];
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(p[1],t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+1.6);
      o.connect(g);g.connect(musicGain);o.start(t);o.stop(t+1.7);
    });
  }
  function melodyLoop(){
    if(!musicOn)return;
    var t=ac.currentTime+.05;
    melNote(melScale[melIdx],t);
    melIdx+=melDir;
    if(melIdx>=melScale.length-1||melIdx<=0)melDir*=-1;
    else if(Math.random()<.3)melDir*=-1;
    melTimer=setTimeout(melodyLoop,1100+Math.random()*500);
  }
  function startMusic(){
    if(!ac||musicOn)return;
    musicOn=true;
    musicGain=ac.createGain();
    musicGain.gain.value=0;
    musicGain.connect(ac.destination);
    musicGain.gain.linearRampToValueAtTime(muted?0:MUSIC_VOL,ac.currentTime+3);
    padLoop();
    melodyLoop();
  }
  snd.addEventListener('click',function(){
    muted=!muted;
    snd.classList.toggle('mute',muted);
    snd.setAttribute('aria-pressed',String(!muted));
    snd.setAttribute('aria-label',muted?'Unmute wedding music':'Mute wedding music');
    if(musicGain)musicGain.gain.linearRampToValueAtTime(muted?0:MUSIC_VOL,ac.currentTime+.8);
    if(!muted){
      try{
        if(ac&&ac.state==='suspended'){
          ac.resume().then(function(){chime();startMusic()});
        }else{
          chime();startMusic();
        }
      }catch(e){}
    }
  });

  /* ---------- particle engine ---------- */
  var fx=$('#fx'),fctx=fx.getContext('2d'),P=[],run=false;
  function sizeFx(){fx.width=innerWidth;fx.height=innerHeight}sizeFx();addEventListener('resize',sizeFx);
  var pal=['#b98a3c','#dcc283','#e9b9bd','#fffaf0','#4c7a4f','#f2a31b'];
  function loop(){
    fctx.clearRect(0,0,fx.width,fx.height);var alive=0;
    P.forEach(function(p){
      p.vy+=p.g;p.vx*=p.fr;p.vy*=p.fr;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.l-=p.dl;
      if(p.l>0){alive++;fctx.save();fctx.globalAlpha=Math.max(p.l,0);fctx.translate(p.x,p.y);fctx.rotate(p.r);fctx.fillStyle=p.c;
        if(p.k==='s'){fctx.shadowColor=p.c;fctx.shadowBlur=8;fctx.beginPath();fctx.arc(0,0,p.w,0,6.283);fctx.fill()}else{fctx.fillRect(-p.w/2,-p.h/2,p.w,p.h)}
        fctx.restore()}
    });
    P=P.filter(function(p){return p.l>0});
    if(P.length)requestAnimationFrame(loop);else{run=false;fctx.clearRect(0,0,fx.width,fx.height)}
  }
  function go(){if(!run){run=true;requestAnimationFrame(loop)}}
  function sparkBurst(ox,oy,n){
    for(var i=0;i<n;i++){var a=Math.random()*6.283,s=2+Math.random()*9;
      P.push({k:'s',x:ox,y:oy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:.05,fr:.975,w:1+Math.random()*2.4,c:['#ffe9a3','#f1c45a','#fff6d6','#e9b9bd'][i%4],r:0,vr:0,l:1,dl:.008+Math.random()*.01})}
    go();
  }
  function confetti(ox,oy){
    for(var i=0;i<120;i++){var a=Math.random()*6.283,s=3+Math.random()*8;
      P.push({k:'r',x:ox,y:oy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-4,g:.22,fr:.99,w:4+Math.random()*5,h:3+Math.random()*4,c:pal[i%pal.length],r:Math.random()*6,vr:Math.random()*.4-.2,l:1,dl:.008})}
    go();
  }

  /* ---------- toran, jasmine strands, halo, mandala ---------- */
  var tor=$('#toran'),N=17;
  for(var i=0;i<N;i++){
    var t=i/(N-1),w=document.createElement('div');w.className='tw';
    w.style.left=(t*100)+'%';w.style.top=(5+13*Math.sin(Math.PI*t))+'px';w.style.setProperty('--d',(.3+i*.05)+'s');
    w.style.animationDuration=(3+(i%4)*.6)+'s';w.innerHTML='<i class="mg"></i><i class="lf" style="height:'+(i%2?30:40)+'px"></i>';
    tor.appendChild(w);
  }
  var sb=$('#strands'),n=20;
  for(var j=0;j<n;j++){
    var d=document.createElement('div');d.className='strand';d.style.left=(j/(n-1)*96+1)+'%';
    var len=3+Math.round(Math.abs(Math.sin(j*1.7))*5)+(j%3===0?2:0),h='';
    for(var k=0;k<len;k++){h+=k%4===2?'<i class="lf2"></i>':(k%7===5?'<i class="pk"></i>':'<i></i>')}
    d.innerHTML=h;d.style.setProperty('--d',(.6+j*.05)+'s');d.style.animationDuration=(4+(j%5)*.7)+'s';sb.appendChild(d);
  }
  function el(tag,attrs){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);return e}
  var halo=$('#halo');
  halo.appendChild(el('circle',{cx:180,cy:200,r:168,fill:'none',stroke:'#dcc283','stroke-width':1,'stroke-dasharray':'2 6'}));
  halo.appendChild(el('circle',{cx:180,cy:200,r:150,fill:'rgba(233,185,189,.10)',stroke:'#b98a3c','stroke-width':.8}));
  for(var q=0;q<18;q++){halo.appendChild(el('ellipse',{cx:180,cy:63,rx:9,ry:28,fill:'rgba(185,138,60,.10)',stroke:'#c9a049','stroke-width':.8,transform:'rotate('+(q*20)+' 180 200)'}))}
  var md=$('#mandala');
  [[12,38,'#b98a3c'],[12,64,'#b98a3c'],[24,88,'#dcc283']].forEach(function(r){
    for(var m=0;m<r[0];m++){md.appendChild(el('ellipse',{cx:0,cy:-r[1],rx:r[1]*.12,ry:r[1]*.34,fill:'none',stroke:r[2],'stroke-width':.9,transform:'rotate('+(m*360/r[0])+')'}))}
  });
  md.appendChild(el('circle',{r:98,fill:'none',stroke:'#dcc283','stroke-width':.8,'stroke-dasharray':'1 3'}));

  /* arch outline, drawn on reveal */
  function arch(){
    var a=$('#arch');if(!a)return;
    var w=a.offsetWidth,h=a.offsetHeight;if(!w||!h)return;
    function P(i){var r=(w-2*i)/2,x0=i,x1=w-i,yb=h-i;return 'M'+x0+','+yb+' L'+x0+','+(r+i)+' A'+r+','+r+' 0 0 1 '+x1+','+(r+i)+' L'+x1+','+yb+' Z'}
    $('#ap1').setAttribute('d',P(0));$('#ap2').setAttribute('d',P(6));
    var sv=$('#archsvg');sv.setAttribute('viewBox','0 0 '+w+' '+h);
  }
  arch();addEventListener('resize',arch);
  if(document.fonts&&document.fonts.ready){document.fonts.ready.then(arch)}

  /* split titles into letters preserving spaces */
  [].forEach.call(document.querySelectorAll('[data-split]'),function(e){
    var tx=e.textContent;e.textContent='';e.setAttribute('aria-label',tx);
    tx.split('').forEach(function(c,i){
      var s=document.createElement('span');
      s.className='ltr';
      if(c===' '){s.innerHTML='&nbsp;'}else{s.textContent=c}
      s.style.transitionDelay=(i*60)+'ms';
      s.setAttribute('aria-hidden','true');
      e.appendChild(s);
    });
  });

  /* floating hearts around couple */
  var cw=$('#cwrap'),hearts=null;
  function startHearts(){
    if(hearts||reduce)return;
    hearts=setInterval(function(){
      if(document.hidden)return;
      var h=document.createElement('i');h.className='heart';h.style.left=(42+Math.random()*16)+'%';h.style.setProperty('--hx',(Math.random()*120-60)+'px');
      var du=3.2+Math.random()*2;h.style.animation='rise '+du+'s ease-out forwards';cw.appendChild(h);setTimeout(function(){h.remove()},du*1000);
    },900);
  }

  /* ---------- reveal on scroll ---------- */
  var rvs=[].slice.call(document.querySelectorAll('.rv'));
  var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.15}):null;
  function watch(){rvs.forEach(function(el){io?io.observe(el):el.classList.add('in')})}
  setTimeout(function(){rvs.forEach(function(el){el.classList.add('in')})},20000);

  /* petals */
  var pcols=['#e9b9bd','#f4d3d5','#fffaf0','#dcc283','#f1c7c9','#f2a31b'];
  function petals(cnt){
    for(var i=0;i<cnt;i++){
      var p=document.createElement('div');p.className='petal';
      p.style.left=(Math.random()*100)+'vw';p.style.background=pcols[i%pcols.length];
      p.style.setProperty('--dx',(Math.random()*160-80)+'px');p.style.setProperty('--rot',(Math.random()*720-360)+'deg');
      var t=7+Math.random()*7;p.style.animationDuration=t+'s';p.style.animationDelay=(Math.random()*3)+'s';
      p.style.transform='scale('+(.6+Math.random()*.8)+')';document.body.appendChild(p);
      setTimeout(function(e){e.remove()}.bind(null,p),(t+3.5)*1000);
    }
  }

  /* ---------- opening sequence ---------- */
  function begin(){
    cover.classList.add('gone');
    document.body.classList.remove('locked');
  }
  function open(){
    if(opened)return;opened=true;
    try{
      var AC=window.AudioContext||window.webkitAudioContext;
      if(AC){
        ac=new AC();
        if(ac.state==='suspended'){
          ac.resume().then(function(){chime();startMusic()});
        }else{
          chime();startMusic();
        }
      }
    }catch(e){}
    cover.classList.add('open');
    var r=$('#openBtn').getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    if(!reduce){
      sparkBurst(cx,cy,140);
      setTimeout(function(){sparkBurst(cx,cy,110)},500);
      setTimeout(function(){sparkBurst(innerWidth/2,innerHeight*.45,90)},2100);
    }
    // Synchronize content reveal with parting of curtains
    setTimeout(function(){
      main.classList.add('go');
      snd.classList.add('on');
      watch();
      startHearts();
      arch();
      if(!reduce){
        petals(24);
        setInterval(function(){if(!document.hidden&&document.querySelectorAll('.petal').length<20)petals(3)},2500);
      }
    }, reduce ? 150 : 1400);

    // Complete curtain opening and dismiss cover
    setTimeout(begin, reduce ? 300 : 3800);
  }
  $('#openBtn').addEventListener('click',function(e){e.stopPropagation();open()});
  cover.addEventListener('click',open);

  /* ---------- scratch card with smooth stroke interpolation ---------- */
  var foil=$('#foil'),box=$('#scratch'),ctx,heart,rw=0,rh=0,moves=0,done=false,started=false,down=false,lastPt=null;
  heart=new Path2D('M50 88C20 62 2 44 2 26C2 12 13 2 27 2C37 2 46 8 50 16C54 8 63 2 73 2C87 2 98 12 98 26C98 44 80 62 50 88Z');
  function paintFoil(){
    var r=box.getBoundingClientRect();if(!r.width)return;
    var dpr=Math.min(devicePixelRatio||1,2);rw=Math.round(r.width*dpr);rh=Math.round(r.height*dpr);foil.width=rw;foil.height=rh;
    ctx=foil.getContext('2d');ctx.globalCompositeOperation='source-over';
    ctx.save();ctx.scale(rw/100,rh/90);ctx.clip(heart);ctx.setTransform(1,0,0,1,0,0);
    var g=ctx.createLinearGradient(0,0,rw,rh);
    g.addColorStop(0,'#e8d194');g.addColorStop(.3,'#b98a3c');g.addColorStop(.55,'#f0dca4');g.addColorStop(.8,'#b58535');g.addColorStop(1,'#d9bc6e');
    ctx.fillStyle=g;ctx.fillRect(0,0,rw,rh);ctx.fillStyle='rgba(255,255,255,.18)';
    for(var i=0;i<260;i++){ctx.fillRect(Math.random()*rw,Math.random()*rh,1.5*dpr,1.5*dpr)}
    ctx.restore();
    ctx.save();ctx.scale(rw/100,rh/90);ctx.lineWidth=1.2;ctx.strokeStyle='rgba(110,79,26,.55)';ctx.stroke(heart);ctx.restore();
  }
  function scratchLine(x1,y1,x2,y2){
    ctx.globalCompositeOperation='destination-out';
    ctx.lineWidth=rw*0.13;
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
  }
  function scratchAt(x,y){
    var r=foil.getBoundingClientRect(),cx=(x-r.left)/r.width*rw,cy=(y-r.top)/r.height*rh;
    if(lastPt){
      scratchLine(lastPt.x,lastPt.y,cx,cy);
    }else{
      ctx.globalCompositeOperation='destination-out';
      ctx.beginPath();
      ctx.arc(cx,cy,rw*.065,0,6.283);
      ctx.fill();
    }
    lastPt={x:cx,y:cy};
    if(!started){started=true;box.classList.add('started')}
    if(!reduce&&moves%3===0)sparkBurst(x,y,2);
    if(++moves%6===0)check();
  }
  var testCanvas=document.createElement('canvas'),tctx=null;
  testCanvas.width=40;testCanvas.height=36;
  try{tctx=testCanvas.getContext('2d',{willReadFrequently:true})}catch(_){tctx=testCanvas.getContext('2d')}
  // precompute which of the 40x36 sample pixels actually fall inside the heart,
  // so completion % is measured against the heart's own area, not the transparent
  // corners around it (those corners were already "clear" at 0% scratched, which
  // made the old whole-rectangle check reveal almost instantly)
  var heartMask=null,heartTotal=0;
  if(tctx){
    var maskCanvas=document.createElement('canvas');maskCanvas.width=40;maskCanvas.height=36;
    var mctx=maskCanvas.getContext('2d');mctx.scale(40/100,36/90);mctx.fillStyle='#000';mctx.fill(heart);
    var md=mctx.getImageData(0,0,40,36).data;
    heartMask=new Uint8Array(40*36);
    for(var mi=0,mp=0;mi<md.length;mi+=4,mp++){if(md[mi+3]>10){heartMask[mp]=1;heartTotal++}}
  }
  function check(){
    if(done||!tctx||!heartMask||!heartTotal)return;
    tctx.clearRect(0,0,40,36);
    tctx.drawImage(foil,0,0,40,36);
    var d=tctx.getImageData(0,0,40,36).data,clear=0;
    for(var i=0,p=0;i<d.length;i+=4,p++){
      if(!heartMask[p])continue;
      if(d[i+3]<40)clear++;
    }
    if(clear/heartTotal>.45)reveal();
  }
  function reveal(){
    if(done)return;done=true;foil.classList.add('done');box.classList.add('started');
    $('#saveRow').hidden=false;
    var r=box.getBoundingClientRect();if(!reduce){confetti(r.left+r.width/2,r.top+r.height*.45);petals(14);chime()}
  }
  foil.addEventListener('pointerdown',function(e){down=true;lastPt=null;try{foil.setPointerCapture(e.pointerId)}catch(_){}scratchAt(e.clientX,e.clientY)});
  foil.addEventListener('pointermove',function(e){if(down)scratchAt(e.clientX,e.clientY)});
  foil.addEventListener('pointerup',function(){down=false;lastPt=null;check()});
  foil.addEventListener('pointercancel',function(){down=false;lastPt=null});
  paintFoil();addEventListener('resize',function(){if(!done&&!started)paintFoil()});
  document.fonts&&document.fonts.ready.then(function(){if(!started&&!done)paintFoil();arch();});

  /* ---------- countdown with flip & tabular padding ---------- */
  var T=new Date('2026-11-18T11:30:00+05:30').getTime();
  function pad(n){return n<10?'0'+n:String(n)}
  function setv(id,v){var e=$(id);v=String(v);if(e.textContent!==v){e.textContent=v;e.classList.remove('flip');void e.offsetWidth;e.classList.add('flip')}}
  function tick(){
    var s=Math.floor((T-Date.now())/1000);
    if(s<=0){
      $('#count').style.display='none';
      var todayEl=$('#today');
      todayEl.style.display='block';
      if(s<-86400){todayEl.textContent='Happily Married! Thank you for your blessings.'}
      return;
    }
    setv('#cd',Math.floor(s/86400));
    setv('#ch',pad(Math.floor(s%86400/3600)));
    setv('#cm',pad(Math.floor(s%3600/60)));
    setv('#cs',pad(s%60));
  }
  tick();setInterval(tick,1000);

  /* ---------- scroll progress + sparkle trail (desktop only for 60fps mobile scroll) ---------- */
  var prog=$('#prog');
  addEventListener('scroll',function(){var h=document.documentElement.scrollHeight-innerHeight;prog.style.width=(h>0?Math.min(100,scrollY/h*100):0)+'%'},{passive:true});
  var lastSp=0;
  addEventListener('pointermove',function(e){
    if(reduce||!main.classList.contains('go')||e.pointerType==='touch')return;
    var n=Date.now();if(n-lastSp<85)return;lastSp=n;
    var s=document.createElement('i');s.className='spark';s.style.left=e.clientX+'px';s.style.top=e.clientY+'px';
    s.style.background=['#b98a3c','#dcc283','#e9b9bd'][n%3];document.body.appendChild(s);setTimeout(function(){s.remove()},850);
  },{passive:true});

  /* ---------- share functionality ---------- */
  var shareUrl=window.location.href.split('#')[0];
  var shareMsg='With immense joy, happiness, and heartfelt warmth, we cordially invite you and your family to grace the wedding ceremony of our beloved brother\n\n✨ Chi. Sai Teja Reddy ✨\nwith\n✨ Chi. La. Sow. Nishma Reddy ✨\n\n📅 Date: 18th November 2026\n⏰ Muhurtam: 11:30 A.M.\n📍 Venue: Nimmala Convention, Medchal, Hyderabad\n🗺️ Google Maps: https://maps.app.goo.gl/zjrMrKS5AR9WCLuP6?g_st=aw\n\n🌐 View Digital Invitation:\n'+shareUrl+'\n\nYour presence and blessings will add great joy to this special occasion.\n\nWith love and regards,\nArutla Sri Manish Reddy\nOn behalf of Arutla Lakshmi – Anji Reddy & Family ❤️';

  var waBtn=$('#waBtn');
  if(waBtn){waBtn.href='https://wa.me/?text='+encodeURIComponent(shareMsg);}

  var nativeShareBtn=$('#nativeShareBtn');
  if(navigator.share && nativeShareBtn){
    nativeShareBtn.style.display='inline-flex';
    nativeShareBtn.addEventListener('click',function(e){
      e.preventDefault();
      navigator.share({
        title:'Sai Teja & Nishma Wedding Invitation',
        text:shareMsg,
        url:shareUrl
      }).catch(function(){});
    });
  }

  var copyLinkBtn=$('#copyLinkBtn');
  if(copyLinkBtn){
    copyLinkBtn.addEventListener('click',function(){
      function notify(){
        var orig=copyLinkBtn.textContent;
        copyLinkBtn.textContent='Copied! ✓';
        setTimeout(function(){copyLinkBtn.textContent=orig},2200);
      }
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(shareUrl).then(notify).catch(function(){fallbackCopy(notify)});
      }else{
        fallbackCopy(notify);
      }
      function fallbackCopy(cb){
        var ta=document.createElement('textarea');ta.value=shareUrl;ta.style.position='fixed';ta.style.opacity='0';
        document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(_){}
        document.body.removeChild(ta);
        cb();
      }
    });
  }
})();
