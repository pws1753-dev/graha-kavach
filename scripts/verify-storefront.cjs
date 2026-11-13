const fs=require('node:fs');const assert=require('node:assert/strict');
const origin='https://grahakavach.in';
(async()=>{
 const assets=new Set();const pages=[];let deploymentId;
 for(const path of ['/book-now','/book-now/details','/checkout']){
  const response=await fetch(origin+path,{signal:AbortSignal.timeout(15000),headers:{'Cache-Control':'no-cache'}});assert.equal(response.status,200,path);
  const html=await response.text();assert.ok(!html.includes('Loading chunk 2606 failed'),path);
  const id=html.match(/data-dpl-id="([^"]+)"/)?.[1];assert.ok(id,'Missing deployment protection on '+path);
  deploymentId ||= id;assert.equal(id,deploymentId,'Mixed deployments');
  for(const match of html.matchAll(/(?:src|href)="([^\"]*\/_next\/static\/[^\"]+\.(?:js|css)(?:\?[^\"]*)?)"/g))assets.add(new URL(match[1].replaceAll('&amp;','&'),origin).href);
  pages.push({path,status:response.status,deploymentId:id});
 }
 const list=[...assets];for(let index=0;index<list.length;index+=4)await Promise.all(list.slice(index,index+4).map(async url=>{const response=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(15000)});assert.equal(response.status,200,'Missing asset '+url);}));
 const methodsResponse=await fetch(origin+'/api/checkout/payment-methods',{signal:AbortSignal.timeout(15000)});assert.equal(methodsResponse.status,200);const methods=await methodsResponse.json();
 const expected=JSON.parse(fs.readFileSync('.next/required-server-files.json','utf8')).config.deploymentId;
 assert.equal(deploymentId,expected,'Live deployment differs from the locally validated source');
 console.log(JSON.stringify({pages,assetsChecked:assets.size,allAssetsAvailable:true,paymentMethodsAvailable:!!methods,expectedDeployment:expected,matchesValidatedBuild:true},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
