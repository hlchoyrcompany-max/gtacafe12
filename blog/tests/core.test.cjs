const test=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const core=require('../js/core.js');
test('UTM builder preserves query and hash without duplicate campaign keys',()=>{
 const u=new URL(core.buildUtm('https://brand.example/story/?sku=12&utm_source=old#buy',{utm_source:'instagram',utm_medium:'paid_social',utm_campaign:'일상 11월'}));
 assert.equal(u.searchParams.get('sku'),'12');assert.equal(u.hash,'#buy');assert.deepEqual(u.searchParams.getAll('utm_source'),['instagram']);assert.equal(u.searchParams.get('utm_campaign'),'일상 11월');
});
test('outbound UTM preserves existing campaign and excludes arbitrary params',()=>{
 const u=new URL(core.attributedUrl('https://shop.example/p?id=3&utm_source=store#order','?utm_source=instagram&utm_campaign=cabbage&fbclid=secret',true));
 assert.equal(u.searchParams.get('utm_source'),'store');assert.equal(u.searchParams.get('utm_campaign'),'cabbage');assert.equal(u.searchParams.get('fbclid'),null);assert.equal(u.hash,'#order');assert.equal(u.searchParams.get('id'),'3');
});
test('forwarding can be disabled; unsafe outbound schemes are blocked',()=>{
 assert.equal(core.attributedUrl('https://shop.example/p','?utm_source=ad',false),'https://shop.example/p');
 for(const value of ['javascript:alert(1)','data:text/html,test','file:///C:/test',''])assert.equal(core.attributedUrl(value,'',true),'');
});
test('image paths allow project assets and public http URLs only',()=>{
 assert.equal(core.imageUrl('assets/images/product-01.webp'),'assets/images/product-01.webp');
 for(const value of ['javascript:alert(1)','assets/images/../../secret','C:\\image.jpg','data:text/html,hi','//other.example/x'])assert.equal(core.imageUrl(value),'');
});
test('export round trips Korean multiline text and script-like user input',()=>{
 const value={title:'일상\n한 줄 더',blocks:[{type:'paragraph',text:'</script><script>alert(1)</script>'}]};
 const output=core.serialize(value);assert.equal(output.includes('</script>'),false);const ctx={window:{}};vm.runInNewContext(output,ctx);assert.deepEqual(JSON.parse(JSON.stringify(ctx.window.LANDING_CONTENT)),value);
});
