(function(){
  'use strict';
  const core=window.LandingCore;
  const byId=id=>document.getElementById(id);
  const preview=new URLSearchParams(location.search).get('preview')==='1';
  let current;let toastTimer;
  function text(id,value){const el=byId(id);if(el)el.textContent=value||'';}
  function toast(message){text('toast',message);byId('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>byId('toast').hidden=true,3200);}
  function render(config){
    current=config||{};document.title=(current.title||'새로운 기록')+' — '+(window.BLOG_DATA?.site?.name||'오늘의 기록');
    text('postTitle',current.title);text('author',current.author);text('avatar',(current.author||'기').slice(0,1));text('date',current.date);text('footerBrand',window.BLOG_DATA?.site?.name||'오늘의 기록');
    document.querySelector('meta[name=description]').content=current.description||'';
    document.querySelector('meta[property="og:title"]').content=current.title||'';
    document.querySelector('meta[property="og:description"]').content=current.description||'';
    const fragment=document.createDocumentFragment();
    for(const block of (Array.isArray(current.blocks)?current.blocks:[])){
      let el;
      if(typeof block.html==='string'){el=document.createElement('div');el.append(window.RichContent.sanitize(block.html));}
      else if(block.type==='divider')el=document.createElement('hr');
      else if(block.type==='image'){
        el=document.createElement('figure');const src=core.imageUrl(block.src);const img=document.createElement('img');img.alt=block.alt||'';img.loading='lazy';img.decoding='async';
        if(src)img.src=src;img.addEventListener('error',()=>{img.hidden=true;const warning=document.createElement('p');warning.textContent='이미지를 불러오지 못했습니다. 파일 경로를 확인해 주세요.';el.prepend(warning);},{once:true});el.append(img);
        if(block.caption){const caption=document.createElement('figcaption');caption.textContent=block.caption;el.append(caption);}
      }else if(['paragraph','heading','quote'].includes(block.type)){
        el=document.createElement(block.type==='heading'?'h2':block.type==='quote'?'blockquote':'p');
        for(const segment of core.textSegments(block.text,block.boldRanges)){if(segment.bold){const strong=document.createElement('strong');strong.textContent=segment.text;el.append(strong);}else el.append(document.createTextNode(segment.text));}
      }else continue;
      el.className='content-block '+block.type+(typeof block.html==='string'?' rich-document':'');
      if(['left','center','right'].includes(block.align))el.style.textAlign=block.align;
      if(block.bold===true)el.classList.add('text-bold');
      if(block.color==='red')el.classList.add('text-red');
      if(block.highlight===true&&['paragraph','heading','quote'].includes(block.type)){el.classList.add('text-highlight');const mark=document.createElement('mark');while(el.firstChild)mark.append(el.firstChild);el.append(mark);}
      if(['compact','wide'].includes(block.spacing))el.classList.add('spacing-'+block.spacing);
      fragment.append(el);
    }
    byId('article').replaceChildren(fragment);
    byId('reviewNotice').hidden=current.reviewRequired!==true;
    renderComments();
    renderCounts();

  }
  function count(value){return Math.min(Number.MAX_SAFE_INTEGER-1,Math.max(0,Math.floor(Number(value)||0)));}
  function commentTotal(){return (Array.isArray(current.comments)?current.comments:[]).reduce((n,c)=>n+1+(Array.isArray(c.replies)?c.replies.length:0),0);}
  function renderComments(){
    const root=byId('commentThreads');root.replaceChildren();
    const comments=Array.isArray(current.comments)?current.comments:[];
    function makeComment(comment,isReply=false){
      const article=document.createElement('article');article.className='reader-comment'+(isReply?' reader-comment-reply':'');
      const header=document.createElement('div');header.className='reader-comment-header';const avatar=document.createElement('span');avatar.className='reader-avatar';avatar.textContent=(comment.author||'?').slice(0,1);avatar.setAttribute('aria-hidden','true');const author=document.createElement('strong');author.textContent=comment.author||'작성자';header.append(avatar,author);
      if(comment.isAuthor){const badge=document.createElement('span');badge.className='comment-author-badge';badge.textContent='작성자';header.append(badge);}
      if(comment.isExample||current.commentsAreExamples){const badge=document.createElement('span');badge.className='comment-example-badge';badge.textContent='예시';header.append(badge);}
      const body=document.createElement('p');body.className='reader-comment-text';body.textContent=comment.text||'';article.append(header,body);
      if(comment.date){const date=document.createElement('div');date.className='reader-comment-date';date.textContent=comment.date;article.append(date);}
      const actions=document.createElement('div');actions.className='reader-comment-actions';const likes=document.createElement('span');likes.className='reader-comment-like';likes.textContent='♡ '+count(comment.likes);likes.setAttribute('aria-label','공감 '+count(comment.likes));
      if(!isReply&&Array.isArray(comment.replies)&&comment.replies.length){const replies=document.createElement('div');replies.className='reader-replies';const replyButton=document.createElement('button');replyButton.type='button';replyButton.className='reader-reply-button';replyButton.textContent='답글 '+comment.replies.length;replyButton.setAttribute('aria-expanded','true');replyButton.addEventListener('click',()=>{replies.hidden=!replies.hidden;replyButton.setAttribute('aria-expanded',String(!replies.hidden));});actions.append(replyButton);comment.replies.forEach(reply=>replies.append(makeComment(reply,true)));actions.append(likes);article.append(actions,replies);}else{actions.append(likes);article.append(actions);}
      return article;
    }
    comments.forEach(comment=>root.append(makeComment(comment)));
  }
  function renderCounts(){
    const total=commentTotal();const shownCount=total||count(current.commentCount);
    byId('likeCount').textContent=count(current.likeCount).toLocaleString();
    byId('commentCount').textContent=shownCount.toLocaleString();
    text('cafeHeaderComments',shownCount.toLocaleString());
    byId('shareCount').textContent=count(current.shareCount).toLocaleString();
    byId('commentsTitle').querySelector('span').textContent=shownCount.toLocaleString();
    byId('commentsStatus').hidden=total>0;
    byId('commentsStatus').textContent=shownCount>0?'댓글 내용은 아직 연결되지 않았습니다.':'아직 등록된 댓글이 없습니다.';
    byId('commentsNotice').textContent=current.commentsAreExamples?'아래 '+total+'개는 작성자 답글을 포함한 화면 확인용 예시입니다. 실제 독자 후기나 치료 경험이 아닙니다.':'';
    byId('commentsNotice').hidden=current.commentsAreExamples!==true;
    byId('commentNew').hidden=current.commentsNew!==true;
  }
  async function share(){
    const shareUrl=new URL(location.href);shareUrl.searchParams.delete('preview');
    const url=shareUrl.href;
    try{if(navigator.share){await navigator.share({title:current.title,url});return;}}catch(e){if(e.name==='AbortError')return;}
    try{await navigator.clipboard.writeText(url);toast('링크를 복사했습니다.');}catch{window.prompt('링크를 복사해 주세요.',url);}
  }
  byId('shareBottom').addEventListener('click',share);
  const menuSheet=byId('menuSheet');
  function closeMenu(){menuSheet.close();}
  function menuLink(label,board){const a=document.createElement('a');a.textContent=label;a.href='index.html?board='+encodeURIComponent(board)+'#latest';return a;}
  function openMenu(kind){
    const body=byId('menuSheetBody');body.replaceChildren();
    if(kind==='topics'){
      text('menuSheetTitle','주제 보기');
      text('menuSheetDescription','관심 있는 게시판으로 바로 이동하세요.');
      for(const board of ['전체글','인기글','자유게시판'])body.append(menuLink(board,board));
    }else{
      text('menuSheetTitle','소식');text('menuSheetDescription','공지와 최신 후기를 확인하세요.');
      for(const [label,board] of [['공지사항','공지'],['최신 후기','후기']])body.append(menuLink(label,board));
    }
    if(!menuSheet.open)menuSheet.showModal();
  }
  byId('topicsNav').addEventListener('click',()=>openMenu('topics'));
  byId('newsNav').addEventListener('click',()=>openMenu('news'));
  byId('closeMenuSheet').addEventListener('click',closeMenu);
  menuSheet.addEventListener('click',event=>{if(event.target===menuSheet){const rect=menuSheet.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeMenu();}});
  const requestedPost=document.querySelector('meta[name=post-id]')?.content||new URLSearchParams(location.search).get('post');
  const blogPosts=window.BLOG_DATA?.posts||[];
  text('cafePostCount',window.BlogCore.visible(blogPosts).length.toLocaleString());
  const localPreview=preview&&(location.protocol==='file:'||['127.0.0.1','localhost','[::1]'].includes(location.hostname));
  const post=requestedPost?(localPreview?blogPosts.find(p=>p.id===requestedPost):window.BlogCore.getPost(blogPosts,requestedPost)):window.BlogCore.visible(blogPosts)[0];
  render(post||{author:'',title:'글을 찾을 수 없습니다.',blocks:[{type:'paragraph',text:'삭제되었거나 공개되지 않은 글입니다. 하단 홈 메뉴를 눌러 돌아가세요.'}]});
  if(preview){
    window.addEventListener('message',e=>{if(!((parent!==window&&e.source===parent)||(window.opener&&e.source===window.opener))||e.origin!==location.origin||e.data?.type!=='landing-preview')return;render(e.data.config);});
    if(window.opener)window.opener.postMessage({type:'landing-preview-ready'},location.origin==='null'?'*':location.origin);
  }
  // 선택 설정: 본인 GA4 ID를 넣은 경우에만 통계를 시작합니다.
  const gaId=String(current.ga4Id||'').trim();
  if(!preview&&/^G-[A-Z0-9]+$/.test(gaId)){
    window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments);};
    window.gtag('js',new Date());window.gtag('config',gaId);
    const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(gaId);document.head.append(script);
  }
})();

