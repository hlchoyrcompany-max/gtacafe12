(function(){
  'use strict';
  function mount(parent,config,onChange,notify){
    const toolbar=document.createElement('div');toolbar.className='rich-toolbar';toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label','본문 서식');
    const editor=document.createElement('div');editor.className='rich-editor';editor.contentEditable='true';editor.setAttribute('role','textbox');editor.setAttribute('aria-label','게시글 본문 편집');editor.setAttribute('aria-multiline','true');editor.spellcheck=false;
    editor.append(...window.RichContent.fromBlocks(config.blocks).childNodes);
    let savedRange=null,selectedImage=null;
    function remember(){const s=window.getSelection();if(s.rangeCount&&editor.contains(s.anchorNode)&&editor.contains(s.focusNode))savedRange=s.getRangeAt(0).cloneRange();}
    function restore(){editor.focus();const s=window.getSelection();s.removeAllRanges();if(savedRange&&editor.contains(savedRange.commonAncestorContainer))s.addRange(savedRange);else{const r=document.createRange();r.selectNodeContents(editor);r.collapse(false);s.addRange(r);}}
    function sync(){window.RichContent.normalizeUnderlines(editor);const safe=document.createElement('div');safe.append(window.RichContent.sanitize(editor.innerHTML));config.blocks=[{type:'paragraph',html:safe.innerHTML,text:editor.innerText}];onChange();}
    function command(name,value){restore();document.execCommand(name,false,value);remember();sync();}
    function button(label,action){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('mousedown',e=>{remember();e.preventDefault();});b.addEventListener('click',action);toolbar.append(b);return b;}
    button('굵게',()=>command('bold'));button('기울임',()=>command('italic'));button('밑줄',()=>command('underline'));button('취소선',()=>command('strikeThrough'));
    function color(label,value,cmd){const wrap=document.createElement('label');wrap.textContent=label;const input=document.createElement('input');input.type='color';input.value=value;input.setAttribute('aria-label',label);input.addEventListener('mousedown',remember);input.addEventListener('input',()=>command(cmd,input.value));wrap.append(input);toolbar.append(wrap);return input;}
    const ink=color('글자색','#e53935','foreColor');button('글자색 적용',()=>command('foreColor',ink.value));
    const marker=color('형광펜','#fff176','hiliteColor');button('형광펜 적용',()=>command('hiliteColor',marker.value));
    const size=document.createElement('select');size.setAttribute('aria-label','글자 크기');
    for(const [value,label] of [['','글자 크기'],...['14','16','18','20','21','23','24','32','48'].map(px=>[px,px+'px'])]){const o=document.createElement('option');o.value=value;o.textContent=label;size.append(o);}
    size.addEventListener('mousedown',remember);size.addEventListener('change',()=>{if(size.value){restore();document.execCommand('fontSize',false,'7');editor.querySelectorAll('font[size="7"]').forEach(font=>{font.style.fontSize=size.value+'px';font.removeAttribute('size');});remember();sync();}size.value='';});toolbar.append(size);
    for(const [label,cmd] of [['왼쪽','justifyLeft'],['가운데','justifyCenter'],['오른쪽','justifyRight'],['글머리표','insertUnorderedList'],['번호 목록','insertOrderedList']])button(label,()=>command(cmd));
    function insertQuote(kind){
      restore();const selection=window.getSelection();const quote=document.createElement('blockquote');quote.className='quote-'+kind;
      const body=document.createElement('div');body.className='quote-text';
      if(selection.rangeCount&&!selection.isCollapsed)body.append(selection.getRangeAt(0).cloneContents());
      else body.textContent='인용구를 입력하세요.';
      quote.append(body);const holder=document.createElement('div');holder.append(quote);holder.append(document.createElement('p'));holder.lastChild.append(document.createElement('br'));
      command('insertHTML',holder.innerHTML);
    }
    button('❝ 큰따옴표 인용구',()=>insertQuote('large'));
    button('인용구 · 세로선',()=>insertQuote('line'));
    button('인용구 · 상자',()=>insertQuote('box'));
    const sourcePanel=document.createElement('div');sourcePanel.className='quote-source-panel';sourcePanel.hidden=true;
    const sourceLabel=document.createElement('label');sourceLabel.textContent='인용구 출처';const sourceInput=document.createElement('input');sourceInput.type='text';sourceInput.setAttribute('aria-label','인용구 출처 내용');sourceLabel.append(sourceInput);sourcePanel.append(sourceLabel);
    let sourceQuote=null;
    const saveSource=document.createElement('button');saveSource.type='button';saveSource.textContent='출처 적용';sourcePanel.append(saveSource);
    saveSource.addEventListener('click',()=>{if(!sourceQuote||!editor.contains(sourceQuote))return;const existing=sourceQuote.querySelector('.quote-source');if(!sourceInput.value.trim()){existing?.remove();}else{const source=existing||document.createElement('cite');source.className='quote-source';source.textContent=sourceInput.value.trim();if(!existing)sourceQuote.append(source);}sourcePanel.hidden=true;sync();});
    button('인용구 출처',()=>{
      restore();const node=window.getSelection().anchorNode;const quote=(node?.nodeType===1?node:node?.parentElement)?.closest('blockquote');
      if(!quote||!editor.contains(quote)){notify('출처를 넣을 인용구 안을 먼저 클릭하세요.');return;}
      sourceQuote=quote;sourceInput.value=quote.querySelector('.quote-source')?.textContent||'';sourcePanel.hidden=false;sourceInput.focus();
    });
    for(const [label,tag] of [['일반 본문','p'],['제목 1','h2'],['제목 2','h3']])button(label,()=>command('formatBlock',tag));
    button('구분선',()=>command('insertHorizontalRule'));
    const linkPanel=document.createElement('div');linkPanel.className='link-panel';linkPanel.hidden=true;
    const linkFields={};
    for(const [key,label] of [['url','랜딩 URL'],['title','링크 제목'],['description','링크 설명']]){const wrap=document.createElement('label');wrap.textContent=label;const input=document.createElement('input');input.type=key==='url'?'url':'text';input.setAttribute('aria-label',label);wrap.append(input);linkPanel.append(wrap);linkFields[key]=input;}
    const linkApply=document.createElement('button');linkApply.type='button';linkApply.textContent='링크 카드 넣기';linkPanel.append(linkApply);
    linkApply.addEventListener('click',()=>{const url=window.LandingCore.httpUrl(linkFields.url.value);if(!url){notify('http 또는 https 랜딩 URL을 입력하세요.');linkFields.url.focus();return;}
      const card=document.createElement('a');card.className='link-card';card.href=url.href;card.target='_blank';card.rel='noopener noreferrer';
      const icon=document.createElement('span');icon.className='link-card-icon';icon.textContent=url.hostname.endsWith('.naver.com')||url.hostname==='naver.com'?'N':'↗';
      const copy=document.createElement('span');copy.className='link-card-copy';
      for(const [kind,text] of [['title',linkFields.title.value.trim()||url.hostname],['description',linkFields.description.value.trim()],['domain',url.hostname]]){const el=document.createElement('span');el.className='link-card-'+kind;el.textContent=text;copy.append(el);}
      card.append(icon,copy);const holder=document.createElement('div');holder.append(card);const next=document.createElement('p');next.append(document.createElement('br'));holder.append(next);command('insertHTML',holder.innerHTML);linkPanel.hidden=true;
    });
    button('링크 카드',()=>{remember();linkPanel.hidden=false;linkFields.url.focus();});
    button('선택 글자에 링크',()=>{remember();linkPanel.hidden=false;linkFields.url.focus();notify('주소 입력 후 아래 글자 링크 적용을 누르세요.');});
    const textLinkApply=document.createElement('button');textLinkApply.type='button';textLinkApply.textContent='글자 링크 적용';linkPanel.append(textLinkApply);textLinkApply.addEventListener('click',()=>{const url=window.LandingCore.httpUrl(linkFields.url.value);if(!url){notify('http 또는 https 주소를 입력하세요.');return;}restore();if(window.getSelection().isCollapsed){const a=document.createElement('a');a.href=url.href;a.textContent=url.href;command('insertHTML',a.outerHTML);}else command('createLink',url.href);linkPanel.hidden=true;});
    const linkCancel=document.createElement('button');linkCancel.type='button';linkCancel.textContent='링크 입력 닫기';linkCancel.addEventListener('click',()=>linkPanel.hidden=true);linkPanel.append(linkCancel);
    button('링크 해제',()=>command('unlink'));
    button('서식 지우기',()=>command('removeFormat'));button('실행 취소',()=>command('undo'));button('다시 실행',()=>command('redo'));
    const file=document.createElement('input');file.type='file';file.accept='image/jpeg,image/png,image/webp,image/gif';file.hidden=true;file.setAttribute('aria-label','본문 사진 파일');
    button('사진 넣기',()=>{remember();file.click();});
    button('사진 URL',()=>{const url=prompt('이미지 URL 또는 assets/images/파일명을 입력하세요.');if(!url)return;const src=window.RichContent.imageSource(url);if(!src){notify('올바른 이미지 주소를 입력하세요.');return;}command('insertImage',src);});
    for(const width of [25,50,75,100])button('사진 '+width+'%',()=>{if(!selectedImage||!editor.contains(selectedImage)){notify('본문의 사진을 먼저 클릭하세요.');return;}selectedImage.style.width=width+'%';selectedImage.style.height='auto';sync();});
    button('사진 삭제',()=>{if(!selectedImage||!editor.contains(selectedImage)){notify('삭제할 사진을 먼저 클릭하세요.');return;}selectedImage.remove();selectedImage=null;sync();});
    file.addEventListener('change',async()=>{
      const picked=file.files[0];if(!picked)return;
      try{
        if(!['image/jpeg','image/png','image/webp','image/gif'].includes(picked.type)||picked.size>10*1024*1024)throw new Error('10MB 이하의 JPG, PNG, WEBP, GIF 사진을 선택하세요.');
        const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(picked);});
        command('insertImage',data);notify('사진을 본문에 넣었습니다. 파일 다운로드 시 사진도 함께 저장됩니다.');
      }catch(e){notify(e.message||'사진을 읽지 못했습니다.');}finally{file.value='';}
    });
    editor.addEventListener('input',()=>{remember();sync();});
    for(const event of ['keyup','mouseup','focusout'])editor.addEventListener(event,remember);
    editor.addEventListener('click',e=>{if(selectedImage)selectedImage.classList.remove('selected-photo');selectedImage=e.target.tagName==='IMG'?e.target:null;if(selectedImage)selectedImage.classList.add('selected-photo');remember();});
    editor.addEventListener('paste',e=>{
      e.preventDefault();remember();const html=e.clipboardData.getData('text/html');const plain=e.clipboardData.getData('text/plain');
      if(html){const holder=document.createElement('div');holder.append(window.RichContent.sanitize(html));command('insertHTML',holder.innerHTML);}else command('insertText',plain);
    });
    editor.addEventListener('drop',e=>{e.preventDefault();notify('사진은 커서를 놓고 사진 넣기 버튼으로 선택하세요.');});
    const hint=document.createElement('p');hint.className='hint';hint.textContent='Ctrl+B 굵게 · Ctrl+I 기울임 · Ctrl+U 밑줄 · Enter 줄바꿈. 사진을 클릭하면 크기 변경·삭제가 가능합니다. 사진은 데이터 파일에 포함되어 용량이 커질 수 있습니다.';
    parent.append(toolbar,sourcePanel,linkPanel,editor,file,hint);
  }
  window.RichEditor={mount};
})();
