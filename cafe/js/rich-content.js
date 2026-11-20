(function(){
  'use strict';
  const tags=new Set(['P','DIV','BR','STRONG','B','EM','I','U','S','SPAN','FONT','MARK','H2','H3','BLOCKQUOTE','CITE','UL','OL','LI','HR','IMG','A']);
  const colors=/^(#[0-9a-f]{3,8}|rgba?\([\d.,%\s]+\)|[a-z]{1,20})$/i;
  function imageSource(value){
    const s=String(value||'');
    return /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(s)?s:window.LandingCore.imageUrl(s);
  }
  function normalizeUnderlines(root){
    const selection=window.getSelection();const anchor=selection?.anchorNode,focus=selection?.focusNode,ao=selection?.anchorOffset,fo=selection?.focusOffset;
    for(const span of root.querySelectorAll('.underline-run')){let p=span.parentElement,active=false;while(p&&p!==root){if(p.tagName==='U'||p.style.textDecorationLine.includes('underline')){active=true;break;}p=p.parentElement;}if(!active)span.classList.remove('underline-run');}
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      if(!node.textContent||node.parentElement?.closest('.underline-run'))continue;
      let parent=node.parentElement,underlined=false;
      while(parent&&parent!==root){if(parent.tagName==='U'||parent.style.textDecorationLine.includes('underline')){underlined=true;break;}parent=parent.parentElement;}
      if(underlined){const span=document.createElement('span');span.className='underline-run';node.replaceWith(span);span.append(node);}
    }
    if(anchor&&focus&&root.contains(anchor)&&root.contains(focus))selection.setBaseAndExtent(anchor,ao,focus,fo);
  }
  function sanitize(html){
    const template=document.createElement('template');template.innerHTML=String(html||'');
    const result=document.createDocumentFragment();
    function copy(node,parent){
      if(node.nodeType===3){parent.append(document.createTextNode(node.textContent));return;}
      if(node.nodeType!==1)return;
      if(['SCRIPT','STYLE','IFRAME','OBJECT','SVG','MATH','TEMPLATE'].includes(node.tagName))return;
      if(!tags.has(node.tagName)){for(const child of node.childNodes)copy(child,parent);return;}
      const el=document.createElement(node.tagName.toLowerCase());
      if(node.tagName==='BLOCKQUOTE'&&['quote-large','quote-line','quote-box'].includes(node.className))el.className=node.className;
      if(node.tagName==='DIV'&&node.className==='quote-text')el.className='quote-text';
      if(node.tagName==='CITE')el.className='quote-source';
      if(node.tagName==='SPAN'&&['underline-run','link-card-icon','link-card-copy','link-card-title','link-card-description','link-card-domain'].includes(node.className))el.className=node.className;
      if(node.tagName==='A'&&node.classList.contains('link-card'))el.className=node.classList.contains('product-card')?'link-card product-card':'link-card';
      for(const prop of ['color','backgroundColor'])if(colors.test(node.style[prop]))el.style[prop]=node.style[prop];
      if(['left','center','right'].includes(node.style.textAlign))el.style.textAlign=node.style.textAlign;
      if(/^(bold|normal|[1-9]00)$/.test(node.style.fontWeight))el.style.fontWeight=node.style.fontWeight;
      if(['italic','normal'].includes(node.style.fontStyle))el.style.fontStyle=node.style.fontStyle;
      if(/^(underline|line-through|none)$/.test(node.style.textDecorationLine))el.style.textDecorationLine=node.style.textDecorationLine;
      if(/^(1[0-9]|[2-6][0-9]|72)px$/.test(node.style.fontSize))el.style.fontSize=node.style.fontSize;
      if(node.tagName==='FONT'){
        if(colors.test(node.getAttribute('color')||''))el.style.color=node.getAttribute('color');
        const sizes={1:12,2:14,3:16,4:18,5:24,6:32,7:48};if(sizes[node.getAttribute('size')])el.style.fontSize=sizes[node.getAttribute('size')]+'px';
      }
      if(node.tagName==='IMG'){
        const src=imageSource(node.getAttribute('src'));if(!src)return;el.src=src;el.alt=node.getAttribute('alt')||'';
        if(/^(25|50|75|100)%$/.test(node.style.width))el.style.width=node.style.width;
        el.style.maxWidth='100%';el.style.height='auto';
      }
      if(node.tagName==='A'){
        const url=window.LandingCore.httpUrl(node.getAttribute('href'));if(url){el.href=url.href;el.target='_blank';el.rel='noopener noreferrer';}
      }
      for(const child of node.childNodes)copy(child,el);parent.append(el);
    }
    for(const child of template.content.childNodes)copy(child,result);normalizeUnderlines(result);return result;
  }
  function fromBlocks(blocks){
    const root=document.createElement('div');
    for(const block of blocks||[]){
      if(typeof block.html==='string'){root.append(sanitize(block.html));continue;}
      const el=document.createElement(({heading:'h2',quote:'blockquote',image:'p',divider:'hr'})[block.type]||'p');
      if(block.type==='quote')el.className='quote-large';
      if(block.type==='image'){
        const src=imageSource(block.src);if(src){const img=document.createElement('img');img.src=src;img.alt=block.alt||'';el.append(img);}
        if(block.caption){el.append(document.createElement('br'),document.createTextNode(block.caption));}
      }else if(block.type!=='divider'){
        for(const part of window.LandingCore.textSegments(block.text,block.boldRanges)){
          if(part.bold){const strong=document.createElement('strong');strong.textContent=part.text;el.append(strong);}else el.append(document.createTextNode(part.text));
        }
        if(block.bold)el.style.fontWeight='700';if(block.color==='red')el.style.color='#e53935';
        if(block.highlight){const mark=document.createElement('mark');while(el.firstChild)mark.append(el.firstChild);el.append(mark);}
      }
      if(['left','center','right'].includes(block.align))el.style.textAlign=block.align;
      root.append(el);
    }
    return root;
  }
  window.RichContent={sanitize,imageSource,fromBlocks,normalizeUnderlines};
})();
