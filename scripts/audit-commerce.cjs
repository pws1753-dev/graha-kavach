// Read-only commerce audit. Logs counts/IDs only, never credentials or customer details.
const base=process.env.WOOCOMMERCE_URL.replace(/\/$/,'');
async function get(url,key,secret){const response=await fetch(url,{headers:{Authorization:'Basic '+Buffer.from(key+':'+secret).toString('base64')}});const data=await response.json();if(!response.ok)throw Error('Audit API '+response.status);return data;}
const woo=path=>get(base+'/wp-json/wc/v3'+path,process.env.WC_CONSUMER_KEY,process.env.WC_CONSUMER_SECRET);
const razor=path=>get('https://api.razorpay.com/v1'+path,process.env.RAZORPAY_KEY_ID,process.env.RAZORPAY_KEY_SECRET);
(async()=>{
 const all=[];for(let page=1;page<=10;page++){const batch=await woo('/orders?per_page=100&page='+page);all.push(...batch);if(batch.length<100)break;}
 const drafts=await woo('/orders?status=checkout-draft&per_page=100');all.push(...drafts);
 const byId=new Map(all.map(x=>[String(x.id),x]));
 const counts={};for(const order of all)counts[order.status]=(counts[order.status]||0)+1;
 const missingContact=all.filter(x=>['processing','completed','delivered'].includes(x.status)&&!(x.shipping?.phone||x.billing?.phone)).map(x=>x.id);
 const gateway=[];const from=Math.floor(Date.parse('2026-11-12T00:00:00+05:30')/1000);
 for(let skip=0;skip<1000;skip+=100){const batch=await razor('/orders?from='+from+'&count=100&skip='+skip);gateway.push(...batch.items);if(batch.items.length<100)break;}
 const gatewayCounts={};for(const order of gateway)gatewayCounts[order.status]=(gatewayCounts[order.status]||0)+1;
 const paid=gateway.filter(x=>x.amount_paid>0).map(x=>({orderId:x.receipt,gatewayStatus:x.status,amountPaid:x.amount_paid,wooStatus:byId.get(x.receipt)?.status||'missing'}));
 const failures=[];for(const order of gateway.filter(x=>x.attempts>0&&!x.amount_paid)){const payments=await razor('/orders/'+order.id+'/payments');for(const p of payments.items)failures.push({orderId:order.receipt,status:p.status,method:p.method,errorCode:p.error_code,reason:p.error_reason,description:p.error_description});}
 console.log(JSON.stringify({orderCounts:counts,confirmedOrdersMissingPhone:missingContact,gatewaySinceNov12IST:gatewayCounts,capturedOrders:paid,paymentMismatches:paid.filter(x=>!['processing','completed','shipped','delivered'].includes(x.wooStatus)),recentUnpaidAttempts:gateway.filter(x=>!x.amount_paid).map(x=>({orderId:x.receipt,status:x.status,attempts:x.attempts})),failures},null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
