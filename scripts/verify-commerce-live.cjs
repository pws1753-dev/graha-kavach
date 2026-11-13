// Creates only unpaid checkout drafts, then moves every test draft to Trash.
// Uses existing WooCommerce credentials from environment; never opens a payment.
const assert = require('node:assert/strict');
const base=process.env.WOOCOMMERCE_URL.replace(/\/$/,'')+'/wp-json/wc/v3';
const headers={Authorization:'Basic '+Buffer.from(process.env.WC_CONSUMER_KEY+':'+process.env.WC_CONSUMER_SECRET).toString('base64'),'Content-Type':'application/json'};
async function api(path,method='GET',body){
 const response=await fetch(base+path,{method,headers,body:body?JSON.stringify(body):undefined});
 const data=await response.json();
 if(!response.ok)throw Error(`${method} ${path}: ${response.status} ${data.code||''} ${data.message||''}`);
 return data;
}
(async()=>{
 async function cleanup(ids){
  const errors=[];
  for(const id of ids){
   try{
    const before=await api('/orders/'+id);
    if(before.status!=='trash')await api('/orders/'+id+'?force=false','DELETE');
    const after=await api('/orders/'+id);
    assert.equal(after.status,'trash');
    console.log(JSON.stringify({testOrder:id,cleanup:'trashed'}));
   }catch(error){errors.push(error.message);}
  }
  if(errors.length)throw new Error(errors.join('\n'));
 }
 if(process.argv[2]==='--cleanup'){await cleanup(process.argv.slice(3).map(Number));return;}
 const product=await api('/products/32');
 const coupons=await api('/coupons?per_page=30');
 const eligible=coupons.find(c=>c.discount_type==='percent'&&Number(c.amount)>0&&Number(c.amount)<100&&!c.date_expires&&!c.usage_limit&&!c.minimum_amount?.match(/[1-9]/)&&!c.email_restrictions?.length&&(!c.product_ids?.length||c.product_ids.includes(32))&&!c.exclude_product_ids?.includes(32)&&!c.exclude_sale_items);
 const cases=[{state:'RJ',city:'Udaipur',postcode:'313001',quantity:1,status:'checkout-draft'},{state:'RJ',city:'Udaipur',postcode:'313001',quantity:2,status:'pending'},{state:'MH',city:'Mumbai',postcode:'400001',quantity:1,status:'pending'}];
 if(eligible)cases.push({state:'RJ',city:'Udaipur',postcode:'313001',quantity:1,status:'checkout-draft',coupon:eligible});
 const testIds=[];
 try{
  for(const scenario of cases){
   const address={first_name:'Checkout QA',last_name:'Unpaid test',country:'IN',state:scenario.state,city:scenario.city,postcode:scenario.postcode};
   const order=await api('/orders','POST',{status:scenario.status,payment_method:'cod',set_paid:false,billing:address,shipping:address,line_items:[{product_id:32,quantity:scenario.quantity}],...(scenario.coupon?{coupon_lines:[{code:scenario.coupon.code}]}:{}),meta_data:[{key:'_source',value:'nextjs-headless'},{key:'_cod_advance_minor',value:'19900'},{key:'_gk_qa_test',value:'tax-and-draft-verification'}]});
   testIds.push(order.id);
   const gross=Number(product.price)*scenario.quantity;
   const expected=scenario.coupon?gross*(1-Number(scenario.coupon.amount)/100):gross;
   assert.equal(order.status,'checkout-draft');
   assert.ok(Math.abs(Number(order.total)-expected)<=0.01,`Expected ${expected}, got ${order.total}`);
   const ordinary=await api('/orders?per_page=100');
   assert.equal(ordinary.some(x=>x.id===order.id),false,'Draft leaked into ordinary order list');
   const drafts=await api('/orders?status=checkout-draft&per_page=100');
   assert.equal(drafts.some(x=>x.id===order.id),true);
   const read=await api('/orders/'+order.id);
   assert.equal(read.status,'pending','Old storefront payment verifier compatibility');
   console.log(JSON.stringify({id:order.id,inputStatus:scenario.status,storedStatus:order.status,quantity:scenario.quantity,state:scenario.state,coupon:!!scenario.coupon,total:order.total,includedTax:order.total_tax,hiddenFromOrders:true}));
  }
 }finally{
  await cleanup(testIds);
 }
 const remaining=await api('/orders?status=pending&per_page=100');
 console.log(JSON.stringify({remainingPending:remaining.map(x=>({id:x.id,status:x.status,total:x.total}))}));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
