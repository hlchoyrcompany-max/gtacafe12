/* Article analytics: one event per milestone per page visit. */
(function(){
  'use strict';
  const config=window.ARTICLE_ANALYTICS||{};
  if(new URLSearchParams(location.search).get('preview')==='1'||!config.postId)return;
  const article=document.getElementById('article');
  if(!article)return;
  const measurementId=String(config.measurementId||'').trim();
  if(!/^G-[A-Z0-9]+$/.test(measurementId))return;
  if(typeof window.gtag!=='function'){
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){window.dataLayer.push(arguments);};
    window.gtag('js',new Date());
    window.gtag('config',measurementId);
    const tag=document.createElement('script');
    tag.async=true;tag.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(measurementId);
    document.head.append(tag);
  }
  const sent=new Set(),observed=new Set();
  let activeMs=0,last=performance.now(),maxDepth=0,lastReportedMs=0,ended=false;
  function active(){return document.visibilityState==='visible'&&document.hasFocus();}
  let counting=active();
  function clock(){
    const now=performance.now();
    // A suspended/background timer must not count hours as reading.
    if(counting)activeMs+=Math.min(Math.max(0,now-last),2000);
    last=now;counting=active();
  }
  function emit(name,params){
    window.gtag('event',name,Object.assign({
      send_to:measurementId,article_id:config.postId,page_type:config.pageType,
      active_seconds:Math.floor(activeMs/1000),max_scroll_percent:maxDepth,
      transport_type:'beacon'
    },params||{}));
  }
  function once(key,name,params){if(!sent.has(key)){sent.add(key);emit(name,params);}}
  // Count actually exposed body sections, not comments or a single jump to the footer.
  const markers=[25,50,75,90];
  function depth(){
    if(!active())return;
    const rect=article.getBoundingClientRect(),height=rect.height;
    if(height<=0)return;
    for(const percent of markers){
      const y=rect.top+height*percent/100;
      if(y>=0&&y<=window.innerHeight){
        observed.add(percent);maxDepth=Math.max(maxDepth,percent);
        once('depth'+percent,'article_scroll',{scroll_percent:percent});
      }
    }
  }
  function evaluate(){
    depth();
    const seconds=activeMs/1000;
    for(const threshold of [30,60,120,180,300]){
      if(seconds>=threshold)once('time'+threshold,'article_active_time',{time_threshold_seconds:threshold});
    }
    if(seconds>=60&&[25,50,75].every(p=>observed.has(p)))once('read','article_read');
    if(seconds>=120&&markers.every(p=>observed.has(p)))once('complete','article_complete');
  }
  function flush(){
    const delta=activeMs-lastReportedMs;
    if(delta>=1000){emit('article_engagement',{active_time_delta_seconds:Math.round(delta/1000)});lastReportedMs=activeMs;}
  }
  function tick(){if(ended)return;clock();evaluate();if(activeMs-lastReportedMs>=15000)flush();}
  let timer=setInterval(tick,1000);
  window.addEventListener('scroll',tick,{passive:true});
  window.addEventListener('resize',tick,{passive:true});
  document.addEventListener('visibilitychange',()=>{clock();if(!active())flush();else evaluate();});
  window.addEventListener('blur',()=>{clock();counting=false;flush();});
  window.addEventListener('focus',()=>{clock();counting=active();evaluate();});
  window.addEventListener('pagehide',()=>{clock();evaluate();flush();ended=true;clearInterval(timer);});
  window.addEventListener('pageshow',event=>{if(event.persisted){ended=false;last=performance.now();counting=active();timer=setInterval(tick,1000);evaluate();}});
  document.addEventListener('click',event=>{
    const link=event.target.closest&&event.target.closest('#article a[href]');
    if(!link)return;
    const url=new URL(link.href,location.href);
    if(url.hostname!=='100yearhealth.co.kr'&&!url.hostname.endsWith('.100yearhealth.co.kr'))return;
    clock();evaluate();flush();
    // Never send arbitrary URL query strings or customer information.
    emit('product_click',{product_destination:url.origin+url.pathname,
      utm_source:url.searchParams.get('utm_source')||'',
      utm_medium:url.searchParams.get('utm_medium')||'',
      utm_campaign:url.searchParams.get('utm_campaign')||'',
      utm_content:url.searchParams.get('utm_content')||''});
  },true);
  once('view','article_view');
  evaluate();
})();
