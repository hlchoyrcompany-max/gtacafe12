(function(root){
  'use strict';
  const utmKeys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id'];
  function httpUrl(value){try{const u=new URL(String(value||''));return ['https:','http:'].includes(u.protocol)?u:null;}catch{return null;}}
  function imageUrl(value){const v=String(value||'').trim();if(!v||/[\u0000-\u001f]/.test(v))return '';if(httpUrl(v))return v;if(/^(assets\/images\/|\.\/assets\/images\/)[a-zA-Z0-9_./%\-]+$/.test(v)&&!v.includes('..'))return v;return '';}
  function buildUtm(base,values){const u=httpUrl(base);if(!u)throw new Error('http:// 또는 https://로 시작하는 주소를 입력해 주세요.');for(const key of utmKeys){const value=String(values[key]||'').trim();if(value)u.searchParams.set(key,value);else u.searchParams.delete(key);}return u.href;}
  function attributedUrl(base,search,forward){const u=httpUrl(base);if(!u)return '';if(forward){const incoming=new URLSearchParams(search);for(const key of utmKeys){const v=incoming.get(key);if(v&&!u.searchParams.has(key))u.searchParams.set(key,v);}}return u.href;}
  function serialize(config){return '/* 오늘의 기록 랜딩 설정 */\nwindow.LANDING_CONTENT = '+JSON.stringify(config,null,2).replace(/</g,'\\u003c')+';\n';}
  function normalizeRanges(text,ranges){
    const length=String(text||'').length;
    const sorted=(Array.isArray(ranges)?ranges:[]).filter(r=>r&&Number.isFinite(r.start)&&Number.isFinite(r.end)).map(r=>({start:Math.max(0,Math.min(length,Math.floor(r.start))),end:Math.max(0,Math.min(length,Math.floor(r.end)))})).filter(r=>r.end>r.start).sort((a,b)=>a.start-b.start||a.end-b.end);
    const result=[];for(const range of sorted){const last=result[result.length-1];if(last&&range.start<=last.end)last.end=Math.max(last.end,range.end);else result.push({...range});}return result;
  }
  function toggleBold(text,ranges,start,end){
    const normalized=normalizeRanges(text,ranges);start=Math.max(0,Math.min(String(text||'').length,start));end=Math.max(start,Math.min(String(text||'').length,end));if(start===end)return normalized;
    const covered=normalized.some(r=>r.start<=start&&r.end>=end);
    if(!covered)return normalizeRanges(text,[...normalized,{start,end}]);
    return normalized.flatMap(r=>{if(r.end<=start||r.start>=end)return [r];const pieces=[];if(r.start<start)pieces.push({start:r.start,end:start});if(r.end>end)pieces.push({start:end,end:r.end});return pieces;});
  }
  function updateBoldRanges(oldText,newText,ranges){
    oldText=String(oldText||'');newText=String(newText||'');const normalized=normalizeRanges(oldText,ranges);if(oldText===newText)return normalized;
    let start=0;while(start<oldText.length&&start<newText.length&&oldText[start]===newText[start])start++;
    let suffix=0;while(suffix<oldText.length-start&&suffix<newText.length-start&&oldText[oldText.length-1-suffix]===newText[newText.length-1-suffix])suffix++;
    const oldEnd=oldText.length-suffix,newEnd=newText.length-suffix,delta=newText.length-oldText.length;const result=[];
    for(const r of normalized){
      if(r.end<=start){result.push(r);continue;}
      if(r.start>=oldEnd){result.push({start:r.start+delta,end:r.end+delta});continue;}
      if(r.start<start)result.push({start:r.start,end:Math.min(r.end,start)});
      if(r.end>oldEnd)result.push({start:Math.max(r.start,oldEnd)+delta,end:r.end+delta});
      if(newEnd>start&&r.start<=start&&r.end>=oldEnd)result.push({start,end:newEnd});
    }
    return normalizeRanges(newText,result);
  }
  function textSegments(text,ranges){
    text=String(text||'');const result=[];let cursor=0;for(const r of normalizeRanges(text,ranges)){if(r.start>cursor)result.push({text:text.slice(cursor,r.start),bold:false});result.push({text:text.slice(r.start,r.end),bold:true});cursor=r.end;}if(cursor<text.length)result.push({text:text.slice(cursor),bold:false});return result;
  }
  const api={utmKeys,httpUrl,imageUrl,buildUtm,attributedUrl,serialize,normalizeRanges,toggleBold,updateBoldRanges,textSegments};
  root.LandingCore=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
