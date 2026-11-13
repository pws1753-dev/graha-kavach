const fs=require('node:fs');const assert=require('node:assert/strict');
const base=process.env.WOOCOMMERCE_URL.replace(/\/$/,'');
const auth=process.env.GK_MCP_AUTH;if(!auth)throw Error('GK_MCP_AUTH required');
async function get(path,authorization=auth){const response=await fetch(base+path,{headers:authorization?{Authorization:authorization}:{}});return {status:response.status,data:await response.json()};}
(async()=>{
 const path='/wp-json/gk-sales/v1/orders/424/packing-slip';
 const anonymous=await get(path,'');assert.ok([401,403].includes(anonymous.status));
 const cancelled=await get('/wp-json/gk-sales/v1/orders/459/packing-slip');assert.equal(cancelled.status,409);
 const pdf=await get(path);assert.equal(pdf.status,200,JSON.stringify(pdf.data));
 const bytes=Buffer.from(pdf.data.content_base64,'base64');assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
 fs.mkdirSync('.local/audit',{recursive:true});fs.writeFileSync('.local/audit/packing-slip-424.pdf',bytes);
 const order=await get('/wp-json/wc/v3/orders/424');assert.equal(order.status,200);
 fs.writeFileSync('.local/audit/pdf-expectations.json',JSON.stringify({phone:order.data.shipping.phone||order.data.billing.phone,advance:'199.00',balance:'2,300.00'}));
 console.log(JSON.stringify({packingSlip:'valid PDF',size:bytes.length,anonymousAccess:'blocked',cancelledOrder:'blocked',file:'.local/audit/packing-slip-424.pdf'}));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
