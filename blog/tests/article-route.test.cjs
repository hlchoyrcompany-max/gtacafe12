const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('random article route retains campaign attribution and old routes',()=>{
 const c={URLSearchParams,window:{BLOG_DATA:{posts:[{id:'final',slug:'JL3jZVy984sIQ2127drz'}]}}};vm.createContext(c);vm.runInContext(fs.readFileSync('js/blog-core.js','utf8'),c);
 assert.equal(c.window.BlogCore.postHref('final'),'JL3jZVy984sIQ2127drz/');
 assert.equal(c.window.BlogCore.postHref('final','?utm_source=naver&secret=no'),'JL3jZVy984sIQ2127drz/?utm_source=naver');
 assert.equal(c.window.BlogCore.postHref('first-post'),'post.html?post=first-post');
});
