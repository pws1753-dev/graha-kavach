const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadRoute(file, mocks) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports = {};
  vm.runInNewContext(code, {exports,require:name=>{
    if(name==='next/server')return {NextResponse:{json:(body,options)=>({body,status:options?.status??200})}};
    if(name==='zod')return require('zod');
    if(name in mocks)return mocks[name];
    throw new Error('Unexpected import: '+name);
  },Request,Response,Date,Map,Number,String,Math,JSON,console});
  return exports;
}
const config = {computeAdvanceMinor:()=>19900,isCodMethod:id=>id==='cod'};
const analytics = {extractClientContext:()=>({}),sendMetaCapiEvent:async()=>{}};
const landingRoutes = loadRoute('src/lib/landing/routes.ts',{});

function checkout({total='2499.00',configured=true,source='landing',landing='',advanceMinor=19900}={}) {
  const calls=[];
  const body={source,landing,address:{firstName:'Test',lastName:'User',email:'test@example.com',phone:'9999999999',country:'IN'},paymentMethod:'cod',items:[{productId:32,quantity:1}],idempotencyKey:'a-unique-test-key'};
  const validation={safeParse:raw=>({success:true,data:raw})};
  const route=loadRoute('src/app/api/checkout/order/route.ts',{
    '@/lib/validation/checkout':{checkoutSubmissionSchema:validation,landingSubmissionSchema:validation},
    '@/lib/woocommerce/cart-server':{validateCartServer:async()=>({hasErrors:false,totalMinor:249900,items:[{productId:32,quantity:1,unitPriceMinor:249900}]})},
    '@/lib/woocommerce/client':{getWooCommerceUrls:()=>({checkout:'https://example.com/checkout/'}),wooRequest:async input=>{calls.push(input);return {id:123,number:'123',order_key:'secret',status:'checkout-draft',total,currency:'INR'};}},
    '@/lib/woocommerce/payment-gateways':{getActivePaymentGateways:async()=>[{id:'cod',title:'Cash on delivery'}]},
    '@/lib/config/checkout':{...config,computeAdvanceMinor:()=>advanceMinor},
    '@/lib/landing/routes':landingRoutes,
    '@/lib/woocommerce/checkout-settings':{getCodAdvanceConfig:async()=>({})},
    '@/lib/razorpay/server':{isRazorpayConfigured:()=>configured,razorpayKeyId:()=> 'public-key',createRazorpayOrder:async input=>{calls.push({gateway:input});return {id:'order_test',amount:input.amountMinor,currency:'INR'};}},
    '@/lib/analytics/meta-capi':analytics,
  });
  return {calls,run:()=>route.POST({json:async()=>body})};
}
test('unpaid COD advance is a draft; only the advance is requested',async()=>{
  const c=checkout();const result=await c.run();
  assert.equal(result.status,200);
  assert.equal(c.calls[0].body.status,'checkout-draft');
  assert.equal(c.calls.find(x=>x.gateway).gateway.amountMinor,19900);
  assert.equal(result.body.status,'checkout-draft');
});
test('extra GST is blocked before creating a gateway payment',async()=>{
  const c=checkout({total:'2948.82'});const result=await c.run();
  assert.equal(result.status,502);assert.equal(c.calls.some(x=>x.gateway),false);
  assert.equal(c.calls.at(-1).body.status,'cancelled');
});
test('invalid total cannot reach the gateway',async()=>{
  const c=checkout({total:'invalid'});assert.equal((await c.run()).status,502);
  assert.equal(c.calls.some(x=>x.gateway),false);
});
test('landing cannot silently create plain COD when payment is unavailable',async()=>{
  const c=checkout({configured:false});assert.equal((await c.run()).status,503);assert.equal(c.calls.length,0);
});
test('intentional plain COD confirms after its total passes validation',async()=>{
  const full=checkout({configured:false,source:'checkout',advanceMinor:0});const result=await full.run();
  assert.equal(result.status,200);assert.equal(full.calls[0].body.status,'checkout-draft');
  assert.equal(full.calls[1].body.status,'processing');assert.equal(result.body.status,'processing');
});
test('full checkout also blocks required advances when the gateway is unavailable',async()=>{
  const full=checkout({configured:false,source:'checkout'});assert.equal((await full.run()).status,503);assert.equal(full.calls.length,0);
});

test('book-now confirms unpaid full COD with no advance, with or without Razorpay',async()=>{
  for(const configured of [true,false]){
    const c=checkout({landing:'book-now',configured});const result=await c.run();
    assert.equal(result.status,200);assert.equal(result.body.status,'processing');
    assert.equal(result.body.razorpay,null);assert.equal(result.body.paymentUrl,null);
    assert.equal(c.calls.some(x=>x.gateway),false);
    assert.equal(c.calls[0].body.payment_method,'cod');assert.equal(c.calls[0].body.set_paid,false);
    assert.equal(c.calls[0].body.meta_data.some(x=>x.key==='_cod_advance_minor'),false);
    assert.equal(c.calls[1].body.status,'processing');
  }
});
test('book-now still rejects incorrect totals before confirming COD',async()=>{
  const c=checkout({landing:'book-now',total:'2948.82'});
  assert.equal((await c.run()).status,502);assert.equal(c.calls.at(-1).body.status,'cancelled');
  assert.equal(c.calls.some(x=>x.body?.status==='processing'),false);
});
test('other campaigns and the main checkout retain their COD advance',async()=>{
  for(const input of [{landing:'other-campaign'},{source:'checkout',landing:'book-now'}]){
    const c=checkout(input);const result=await c.run();
    assert.equal(result.status,200);assert.equal(result.body.status,'checkout-draft');
    assert.equal(c.calls.find(x=>x.gateway).gateway.amountMinor,19900);
  }
});

test('campaign pricing matches the amount collected by checkout',async()=>{
  const {getLandingPricing}=loadRoute('src/lib/landing/pricing.ts',{
    'server-only':{},
    '@/lib/config/checkout':config,
    '@/lib/woocommerce/checkout-settings':{getCodAdvanceConfig:async()=>({})},
    '@/lib/woocommerce/products':{getProductBySlug:async()=>({id:32,price:'2499',regular_price:'2999'})},
    './routes':landingRoutes,
  });
  assert.equal((await getLandingPricing('', 'book-now')).advanceMinor,0);
  assert.equal((await getLandingPricing('', 'another-campaign')).advanceMinor,19900);
});
test('payment copy removes advance instructions only for book-now',()=>{
  const {withLandingPaymentCopy}=loadRoute('src/lib/landing/full-cod.ts',{'./routes':landingRoutes});
  const cms={heroText:'Offer {price}। Booking सिर्फ़ {advance} से।',ticker:[{text:'Booking सिर्फ़ {advance}'}],offerPoints:[{text:'{advance} Booking'}],steps:[{title:'{advance} Book',text:'Pay {advance}'}],faqs:[{q:'{advance} के बाद?',a:'बाक़ी {balance}'}],doneSteps:[{text:'डिलीवरी पर बाक़ी {balance} दें।'}],heroTitleBefore:'Original heading'};
  const adapted=withLandingPaymentCopy(cms,'book-now');
  assert.equal(JSON.stringify(adapted).includes('{advance}'),false);
  assert.equal(JSON.stringify(adapted).includes('Razorpay'),false);
  assert.equal(adapted.heroTitleBefore,cms.heroTitleBefore);
  assert.equal(withLandingPaymentCopy(cms,'another-campaign'),cms);
  assert.ok(cms.heroText.includes('{advance}'));
});

function verify({status='checkout-draft',paymentStatus='captured',paymentAmount=19900,currency='INR',paymentMethod='cod',refunded=0}={}) {
  const calls=[];
  const amount=paymentMethod==='cod'?paymentAmount:249900;
  const route=loadRoute('src/app/api/checkout/razorpay/verify/route.ts',{
    '@/lib/config/checkout':config,
    '@/lib/woocommerce/checkout-settings':{getCodAdvanceConfig:async()=>({})},
    '@/lib/woocommerce/client':{wooRequest:async input=>{calls.push(input);return {id:123,number:'123',order_key:'secret',status,total:'2499.00',currency:'INR',payment_method:paymentMethod,meta_data:[{key:'_cod_advance_minor',value:'19900'}]};}},
    '@/lib/razorpay/server':{isRazorpayConfigured:()=>true,verifyPaymentSignature:()=>true,fetchRazorpayOrder:async()=>({receipt:'123',amount:paymentMethod==='cod'?19900:249900,currency:'INR'}),fetchRazorpayPayment:async()=>({order_id:'order_test',amount,currency,status:paymentStatus,amount_refunded:refunded})},
    '@/lib/analytics/meta-capi':analytics,
  });
  return {calls,run:()=>route.POST({json:async()=>({wooOrderId:123,orderKey:'secret',razorpay_order_id:'order_test',razorpay_payment_id:'pay_test',razorpay_signature:'signature'})})};
}
test('captured advance confirms a draft with the received amount',async()=>{
  const v=verify();assert.equal((await v.run()).status,200);
  assert.equal(v.calls[1].body.status,'processing');
  assert.equal(v.calls[1].body.meta_data.find(m=>m.key==='_cod_advance_paid').value,'199.00');
  assert.equal(v.calls[1].body.set_paid,undefined);
});
test('authorized payment is not treated as captured',async()=>{
  const v=verify({paymentStatus:'authorized'});assert.equal((await v.run()).status,409);assert.equal(v.calls.length,1);
});
test('wrong payment amount or currency does not confirm an order',async()=>{
  for(const input of [{paymentAmount:1},{currency:'USD'}]){
    const v=verify(input);assert.equal((await v.run()).status,400);assert.equal(v.calls.length,1);
  }
});
test('cancelled order requires reconciliation instead of a false success',async()=>{
  const v=verify({status:'cancelled'});assert.equal((await v.run()).status,409);assert.equal(v.calls.length,1);
});
test('captured full payment can confirm a draft',async()=>{
  const v=verify({paymentMethod:'razorpay'});assert.equal((await v.run()).status,200);assert.equal(v.calls[1].body.set_paid,true);
});
test('partially refunded payments cannot confirm an unpaid draft',async()=>{
  const v=verify({refunded:100});assert.equal((await v.run()).status,409);assert.equal(v.calls.length,1);
});
