const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, globals={}){
 const exports={};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require:name=>name==='@/lib/config/checkout'?{isCodMethod:id=>id==='cod'}:require(name),Date,Promise,AbortSignal,...globals});
 return exports;
}
test('only asset failures trigger recovery, with a reload loop guard',()=>{
 const {isChunkLoadError,claimChunkRecovery}=load('src/lib/chunk-recovery.ts');
 assert.equal(isChunkLoadError({name:'ChunkLoadError',message:'Loading chunk 2606 failed.'}),true);
 assert.equal(isChunkLoadError({name:'Error',message:'Failed to fetch'}),false);
 const values=new Map();const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 assert.equal(claimChunkRecovery(storage,'/book-now/details',1000),true);
 assert.equal(claimChunkRecovery(storage,'/book-now/details',2000),false);
 assert.equal(claimChunkRecovery(storage,'/book-now/details',62000),true);
 assert.equal(claimChunkRecovery({getItem:()=>{throw Error('blocked')}},'/',62000),false);
});
test('a failed payment followed by a successful in-popup retry is accepted',async()=>{
 let options,failed;let settled=false;
 const window={Razorpay:class{constructor(input){options=input;}on(name,handler){failed=handler;}open(){}}};
 const client=load('src/lib/razorpay/client.ts',{window});
 const pending=client.payWithRazorpay({keyId:'key',orderId:'order_test',amount:19900,currency:'INR'}).then(x=>{settled=true;return x;});
 await new Promise(setImmediate);
 assert.equal(options.one_click_checkout,false);
 failed({error:{description:'Bank declined'}});await Promise.resolve();assert.equal(settled,false);
 options.handler({razorpay_payment_id:'pay_success'});
 assert.equal((await pending).status,'paid');
});
test('closing after a failed attempt reports the failure',async()=>{
 let options,failed;
 const window={Razorpay:class{constructor(input){options=input;}on(name,handler){failed=handler;}open(){}}};
 const client=load('src/lib/razorpay/client.ts',{window});
 const pending=client.payWithRazorpay({keyId:'key',orderId:'order_test',amount:19900,currency:'INR'});
 await new Promise(setImmediate);failed({error:{description:'Bank declined'}});options.modal.ondismiss();
 assert.equal((await pending).message,'Bank declined');
});
test('late capture retries only verification, never another charge',async()=>{
 let calls=0;
 const client=load('src/lib/razorpay/client.ts',{window:{setTimeout:fn=>{fn();}},fetch:async(url)=>{
  assert.equal(url,'/api/checkout/razorpay/verify');calls++;
  return calls===1?{ok:false,status:409,json:async()=>({code:'payment_pending_capture'})}:{ok:true,status:200,json:async()=>({success:true})};
 }});
 assert.equal(await client.confirmRazorpayPayment({wooOrderId:1,orderKey:'key'}),true);assert.equal(calls,2);
});
test('invalid confirmations are not retried or treated as purchases',async()=>{
 let calls=0;const client=load('src/lib/razorpay/client.ts',{fetch:async()=>{calls++;return {ok:false,status:400,json:async()=>({error:'invalid signature'})};}});
 assert.equal(await client.confirmRazorpayPayment({wooOrderId:1,orderKey:'key'}),false);assert.equal(calls,1);
});
test('unpaid orders never count; a paid delivery can still report its purchase',()=>{
 const {isPaidOnline}=load('src/lib/analytics/purchase-verify.ts');
 const paid={status:'delivered',payment_method:'cod',meta_data:[{key:'_cod_advance_paid',value:'199'},{key:'razorpay_payment_id',value:'pay_test'}]};
 assert.equal(isPaidOnline(paid),true);
 for(const status of ['checkout-draft','pending','failed','cancelled','on-hold'])assert.equal(isPaidOnline({...paid,status}),false);
 assert.equal(isPaidOnline({...paid,meta_data:[]}),false);
});
