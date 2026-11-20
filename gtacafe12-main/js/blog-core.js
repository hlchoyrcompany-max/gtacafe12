(function(root){
  'use strict';
  const boards=['전체글','인기글','자유게시판','후기','공지'];
  function visible(posts){return (Array.isArray(posts)?posts:[]).filter(p=>p&&p.published===true&&p.reviewRequired!==true);}
  function filterPosts(posts,board='전체글',query=''){
    const q=String(query).trim().toLocaleLowerCase();
    return visible(posts).filter(p=>(board==='전체글'||(board==='인기글'?p.featured===true:p.category===board))&&(!q||[p.title,p.description,p.author,...(Array.isArray(p.tags)?p.tags:[])].join(' ').toLocaleLowerCase().includes(q))).sort((a,b)=>(Date.parse(b.updatedAt)||0)-(Date.parse(a.updatedAt)||0));
  }
  function getPost(posts,id){return visible(posts).find(p=>p.id===id)||null;}
  function serialize(data){return '/* 오늘의 기록 블로그 데이터 — editor.html에서 편집 */\nwindow.BLOG_DATA = '+JSON.stringify(data,null,2).replace(/</g,'\\u003c')+';\n';}
  function valid(data){return !!data&&typeof data.site==='object'&&data.site!==null&&Array.isArray(data.posts)&&data.posts.every(p=>p&&/^[a-z0-9][a-z0-9-]*$/.test(p.id)&&typeof p.title==='string'&&Array.isArray(p.blocks))&&new Set(data.posts.map(p=>p.id)).size===data.posts.length;}
  function postHref(id,search=''){const post=(root.BLOG_DATA?.posts||[]).find(p=>p.id===id);const slug=/^[A-Za-z0-9]{12,40}$/.test(post?.slug||'')?post.slug:null;const params=new URLSearchParams();if(!slug)params.set('post',id);const incoming=new URLSearchParams(search);for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id']){const value=incoming.get(key);if(value)params.set(key,value);}return slug?slug+'/'+(params.size?'?'+params.toString():''):'post.html?'+params.toString();}
  const api={boards,visible,filterPosts,getPost,serialize,valid,postHref};root.BlogCore=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
