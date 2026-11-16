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

function bookingScreen(){
 const React=require('react');const states=[],refs=[],requests=[],payments=[],saved=new Map();let stateIndex=0,refIndex=0;
 const hooks={...React,useState:initial=>{
  const index=stateIndex++;
  if(!(index in states))states[index]=initial==='details'?'pay':initial&&typeof initial==='object'&&'pin' in initial?{name:'Booking QA',phone:'9999999999',email:'',pin:'313001',city:'Udaipur',address:'QA address',state:'RJ'}:initial;
  return [states[index],value=>{states[index]=typeof value==='function'?value(states[index]):value;}];
 },useRef:initial=>refs[refIndex++]??(refs[refIndex-1]={current:initial}),useEffect:()=>{},useCallback:fn=>fn};
 const mocks={
  react:hooks,'react/jsx-runtime':require('react/jsx-runtime'),
  'next/link':{default:({children})=>children},
  '@/lib/analytics/meta-pixel':{trackInitiateCheckout:()=>{},trackPurchase:()=>{}},
  '@/lib/analytics/google-purchase':{reportVerifiedPurchase:()=>{}},
  '@/lib/landing/routes':{isFullCodLanding:slug=>slug==='book-now'},
  '@/lib/razorpay/client':{payWithRazorpay:async input=>{payments.push(input);return {status:'paid',payment:{razorpay_payment_id:'pay_test'}};},confirmRazorpayPayment:async()=>true},
  '@/components/commerce/payment-logos':{CARD_LOGOS:[],UPI_LOGOS:[],PaymentLogos:()=>null},
  '@/lib/validation/checkout':{INDIAN_STATES:[]},
  './countdown':{CountdownProvider:({children})=>children,Timer:()=>null,useCountdown:()=>null},
  './rich':{ArrowIcon:()=>null},
 };
 const exports={};const code=ts.transpileModule(fs.readFileSync('src/components/landing/booking-flow.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{exports,require:name=>{if(!(name in mocks))throw Error('Unexpected import: '+name);return mocks[name];},crypto:require('node:crypto').webcrypto,Math,Date,JSON,sessionStorage:{setItem:(key,value)=>saved.set(key,value)},fetch:async(url,options)=>{
  const body=JSON.parse(options.body);requests.push(body);return {ok:true,text:async()=>JSON.stringify({success:true,orderId:123,orderKey:'key',orderNumber:'123',razorpay:body.paymentMethod==='razorpay'?{keyId:'key',orderId:'rzp_order',amount:249900,currency:'INR'}:null})};
 }});
 function render(){stateIndex=0;refIndex=0;return exports.BookingFlow({slug:'book-now',landingHref:'/book-now',hideTimer:true,countdown:{},content:{logoUrl:'/logo.png',logoAlt:'Logo',lockLabel:'',detailsTitle:'Details',detailsSub:'',detailsNote:'',payTitle:'Confirm',paySecure:'COD',doneTitle:'Booking confirmed',doneText:'Pay on delivery',doneSteps:['डिलीवरी पर पूरी क़ीमत दें।'],doneWhatsappLabel:'',whatsappKeyword:'',doneHomeLabel:'Home',phone:''},money:{productId:32,priceMinor:249900,advanceMinor:0,currency:'INR',price:'₹2,499',advance:'₹0',balance:'₹2,499',discount:'₹500'}});}
 function nodes(tree){if(!tree||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(nodes);return [tree,...nodes(tree.props?.children)];}
 function text(node){if(typeof node==='string'||typeof node==='number')return String(node);if(Array.isArray(node))return node.map(text).join('');return text(node?.props?.children??'');}
 return {render,nodes,text,requests,payments,saved};
}
test('booking screen offers full COD and confirms without opening online payment',async()=>{
 const screen=bookingScreen();const tree=screen.render();
 const choices=screen.nodes(tree).filter(x=>x.type==='input'&&x.props.name==='payment-choice');
 assert.deepEqual(choices.map(x=>x.props.value),['cod','online']);
 const button=screen.nodes(tree).find(x=>x.type==='button'&&screen.text(x).includes('Cash on Delivery पर Book'));
 await button.props.onClick();assert.equal(screen.requests[0].paymentMethod,'cod');assert.equal(screen.payments.length,0);
 assert.ok(screen.text(screen.render()).includes('Booking confirmed'));
});
test('choosing Pay Online requests full payment and displays a paid confirmation',async()=>{
 const screen=bookingScreen();let tree=screen.render();
 screen.nodes(tree).find(x=>x.type==='input'&&x.props.value==='online').props.onChange();tree=screen.render();
 assert.ok(screen.text(tree).includes('₹2,499 Pay करें'));
 const button=screen.nodes(tree).find(x=>x.type==='button'&&screen.text(x).includes('Pay करें और Book'));
 await button.props.onClick();assert.equal(screen.requests[0].paymentMethod,'razorpay');assert.equal(screen.payments[0].amount,249900);
 assert.ok(screen.text(screen.render()).includes('डिलीवरी पर कोई भुगतान नहीं देना है'));
 assert.equal(JSON.parse(screen.saved.get('gk_booking_done:book-now')).online,true);
});
