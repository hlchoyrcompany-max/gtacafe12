(function(){
  'use strict';
  const core=window.LandingCore;const blog=window.BlogCore;let catalog=JSON.parse(JSON.stringify(window.BLOG_DATA));let config=catalog.posts[0]||null;
  const $=id=>document.getElementById(id);const draftKey='baeknyeon-blog-draft-v2';let statusTimer;
  const settings=[['author','작성자'],['date','표시 날짜'],['title','게시글 제목'],['description','검색·공유 설명'],['landingUrl','이 글의 URL (배포 후 입력)'],['ga4Id','GA4 측정 ID (선택)']];
  const utm={utm_source:'instagram',utm_medium:'social',utm_campaign:'journal',utm_content:'story_01',utm_term:'',utm_id:''};
  function notify(msg){$('editorStatus').textContent=msg;$('editorStatus').hidden=false;clearTimeout(statusTimer);statusTimer=setTimeout(()=>$('editorStatus').hidden=true,4500);}
  function field(parent,label,value,callback,multiline=false){const wrap=document.createElement('label');wrap.append(document.createTextNode(label));const input=document.createElement(multiline?'textarea':'input');if(multiline)input.rows=4;else input.type='text';input.value=value||'';input.addEventListener('input',()=>callback(input.value));wrap.append(input);parent.append(wrap);return input;}
  function preview(){const f=$('preview');f.contentWindow?.postMessage({type:'landing-preview',config},location.origin==='null'?'*':location.origin);updateUtm();}
  function download(name,text,type='text/javascript;charset=utf-8'){const blob=new Blob([text],{type});downloadBlob(name,blob);}
  function downloadBlob(name,blob){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
  function drawSite(){$('siteSettings').replaceChildren();for(const [key,label] of [['name','블로그 이름'],['author','프로필 이름'],['profileDescription','프로필 소개'],['bannerImage','커버 이미지 경로 또는 URL (선택)'],['homeUrl','블로그 홈 URL (배포 후 입력)']])field($('siteSettings'),label,catalog.site[key],v=>catalog.site[key]=v,['headline','description','profileDescription'].includes(key));}
  function drawPostPicker(){$('postPicker').replaceChildren();catalog.posts.forEach((p,i)=>{const opt=document.createElement('option');opt.value=String(i);opt.textContent=(p.published?'[공개] ':'[초안] ')+(p.title||'제목 없음');opt.selected=p===config;$('postPicker').append(opt);});}
  function drawSettings(){
    drawPostPicker();$('settings').replaceChildren();
    field($('settings'),'글 주소 ID (영문 소문자·숫자·하이픈)',config.id,v=>{config.id=v.trim();preview();});
    const categoryLabel=document.createElement('label');categoryLabel.textContent='게시판';const category=document.createElement('select');for(const name of ['자유게시판','후기','공지']){const option=document.createElement('option');option.value=name;option.textContent=name;option.selected=config.category===name;category.append(option);}category.addEventListener('change',()=>{config.category=category.value;preview();});categoryLabel.append(category);$('settings').append(categoryLabel);
    field($('settings'),'키워드 (쉼표로 구분)',(config.tags||[]).join(', '),v=>{config.tags=v.split(',').map(x=>x.trim()).filter(Boolean);});
    field($('settings'),'목록 썸네일 이미지 경로 (선택)',config.thumbnail,v=>config.thumbnail=v);
    for(const [key,label] of [['likeCount','표시할 공감 수'],['commentCount','표시할 댓글 수'],['shareCount','표시할 공유 수']]){const input=field($('settings'),label,String(config[key]||0),v=>{config[key]=Math.min(Number.MAX_SAFE_INTEGER-1,Math.max(0,Math.floor(Number(v)||0)));preview();});input.type='number';input.min='0';input.step='1';}
    const notice=document.createElement('p');notice.className='hint';notice.textContent='직접 지정한 표시 수치입니다. 서버에서 집계하는 실제 통계와 연동되어 있지 않습니다.';$('settings').append(notice);
    const newLabel=document.createElement('label');newLabel.className='check';const newCheck=document.createElement('input');newCheck.type='checkbox';newCheck.checked=config.commentsNew===true;newCheck.addEventListener('change',()=>{config.commentsNew=newCheck.checked;preview();});newLabel.append(newCheck,document.createTextNode('댓글 옆 NEW 표시'));$('settings').append(newLabel);
    for(const [key,label] of settings)field($('settings'),label,config[key],v=>{config[key]=v;if(key==='title')drawPostPicker();preview();});
    $('published').checked=config.published===true;$('published').disabled=config.reviewRequired===true;$('published').title=config.reviewRequired?'검토가 필요한 원고는 초안으로만 저장합니다.':'';$('featured').checked=config.featured===true;
    if(config.reviewRequired){const review=document.createElement('p');review.className='hint';review.textContent='원문 보존용 초안입니다. 의학적 주장과 출처를 검토하기 전에는 공개 목록에 표시하지 않습니다.';$('settings').append(review);}
  }
  const labels={paragraph:'문단',heading:'소제목',quote:'인용문',image:'이미지',divider:'구분선'};
  function drawBlocks(){
    $('blocks').replaceChildren();
    window.RichEditor.mount($('blocks'),config,()=>preview(),notify);
  }
  function updateUtm(){try{$('utmOutput').value=core.buildUtm(config.landingUrl,utm);$('utmError').textContent='';}catch(e){$('utmOutput').value='';$('utmError').textContent='기본 정보에 배포된 랜딩 URL을 먼저 입력하세요.';}}
  function valid(candidate){return candidate&&typeof candidate==='object'&&Array.isArray(candidate.blocks)&&candidate.blocks.every(b=>b&&Object.hasOwn(labels,b.type));}
  $('preview').addEventListener('load',preview);
  $('openPostPreview')?.addEventListener('click',()=>{
    const opened=window.open('post.html?preview=1&post='+encodeURIComponent(config.id),'_blank');
    if(!opened){notify('팝업 차단을 해제하면 게시글 화면을 새 창에서 볼 수 있습니다.');return;}
    const snapshot=JSON.parse(JSON.stringify(config));
    const receive=e=>{if(e.source!==opened||e.origin!==location.origin||e.data?.type!=='landing-preview-ready')return;opened.postMessage({type:'landing-preview',config:snapshot},location.origin==='null'?'*':location.origin);window.removeEventListener('message',receive);};
    window.addEventListener('message',receive);setTimeout(()=>window.removeEventListener('message',receive),30000);
  });
  $('export').addEventListener('click',()=>{if(!blog.valid(catalog)||!catalog.posts.every(valid)){notify('글 ID는 중복 없이 영문 소문자·숫자·하이픈으로 입력하세요.');return;}download('blog-data.js',blog.serialize(catalog));notify('blog-data.js를 프로젝트 폴더에 덮어쓰고 재배포하세요. 모든 글이 포함됩니다.');});
  $('saveDraft').addEventListener('click',()=>{try{localStorage.setItem(draftKey,JSON.stringify(catalog));notify('블로그 전체 초안을 현재 브라우저에 저장했습니다. 공개 페이지에는 반영되지 않습니다.');}catch{notify('브라우저 저장소를 사용할 수 없습니다. 파일로 다운로드하세요.');}});
  $('loadDraft').addEventListener('click',()=>{try{const value=JSON.parse(localStorage.getItem(draftKey));if(!blog.valid(value)||!value.posts.length||!value.posts.every(valid))throw new Error();catalog=value;config=catalog.posts[0];drawSite();drawSettings();drawBlocks();preview();notify('블로그 초안을 불러왔습니다.');}catch{notify('불러올 블로그 초안이 없습니다.');}});
  $('clearDraft').addEventListener('click',()=>{try{localStorage.removeItem(draftKey);notify('저장한 초안을 삭제했습니다.');}catch{notify('브라우저 저장소에 접근할 수 없습니다.');}});
  $('import').addEventListener('change',async e=>{try{const file=e.target.files[0];if(!file)return;const source=await file.text();const match=source.match(/window\.(BLOG_DATA|LANDING_CONTENT)\s*=\s*([\s\S]*);\s*$/);if(!match)throw new Error();const value=JSON.parse(match[2]);if(match[1]==='BLOG_DATA'){if(!blog.valid(value)||!value.posts.length||!value.posts.every(valid))throw new Error();catalog=value;config=catalog.posts[0];drawSite();}else{if(!valid(value))throw new Error();Object.assign(config,value);}drawSettings();drawBlocks();preview();notify('파일을 불러왔습니다.');}catch{notify('올바른 blog-data.js 또는 기존 content.js 파일인지 확인하세요.');}e.target.value='';});
  for(const key of core.utmKeys)field($('utmFields'),key,utm[key],v=>{utm[key]=v;updateUtm();});
  $('copyUtm').addEventListener('click',async()=>{if(!$('utmOutput').value){notify('랜딩 URL을 먼저 입력하세요.');return;}try{await navigator.clipboard.writeText($('utmOutput').value);notify('유입 링크을 복사했습니다.');}catch{$('utmOutput').focus();$('utmOutput').select();notify('선택된 URL을 Ctrl+C로 복사하세요.');}});
  $('pasteArticle').addEventListener('click',()=>$('pasteDialog').showModal());
  $('applyArticle').addEventListener('click',()=>{const value=$('articleText').value.trim();if(!value){notify('본문을 입력하세요.');return;}if(!confirm('기존 본문과 이미지 블록을 모두 교체할까요?'))return;config.blocks=value.split(/\n\s*\n/).map(text=>({type:'paragraph',text:text.trim()}));drawBlocks();preview();$('pasteDialog').close();});
  function newPost(){const now=new Date();return {...JSON.parse(JSON.stringify(window.LANDING_CONTENT)),id:'post-'+now.getTime(),title:'새로운 이야기',description:'',date:now.toLocaleDateString('ko-KR'),category:'자유게시판',tags:[],published:false,featured:false,landingUrl:'',updatedAt:now.toISOString(),blocks:[{type:'paragraph',text:''}]};}
  if(!config){config=newPost();catalog.posts.push(config);}
  $('postPicker').addEventListener('change',e=>{config=catalog.posts[Number(e.target.value)];drawSettings();drawBlocks();preview();});
  $('newPost').addEventListener('click',()=>{config=newPost();catalog.posts.unshift(config);drawSettings();drawBlocks();preview();notify('새 글을 만들었습니다. 공개 설정을 켜고 파일을 저장하면 목록에 표시됩니다.');});
  $('deletePost').addEventListener('click',()=>{if(!confirm('선택한 글을 편집 데이터에서 삭제할까요? 파일을 다시 배포하기 전에는 공개 사이트에 반영되지 않습니다.'))return;catalog.posts=catalog.posts.filter(p=>p!==config);config=catalog.posts[0]||newPost();if(!catalog.posts.length)catalog.posts.push(config);drawSettings();drawBlocks();preview();});
  for(const key of ['published','featured'])$(key).addEventListener('change',e=>{config[key]=e.target.checked;config.updatedAt=new Date().toISOString();drawPostPicker();preview();});
  drawSite();drawSettings();drawBlocks();preview();
})();
