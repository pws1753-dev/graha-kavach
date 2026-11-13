// Preview by default. Requires .env; never prints credentials or customer details.
const fs = require('node:fs');
const apply = process.argv.includes('--apply');
const base = process.env.WOOCOMMERCE_URL.replace(/\/$/, '');
const wooHeaders = {Authorization:'Basic '+Buffer.from(process.env.WC_CONSUMER_KEY+':'+process.env.WC_CONSUMER_SECRET).toString('base64')};
const razorHeaders = {Authorization:'Basic '+Buffer.from(process.env.RAZORPAY_KEY_ID+':'+process.env.RAZORPAY_KEY_SECRET).toString('base64')};
async function api(url, headers, body) {
  const response = await fetch(url, {headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},method:body?'PUT':'GET',body:body?JSON.stringify(body):undefined});
  const data = await response.json();
  if (!response.ok) throw new Error(`API ${response.status}: ${data.code || data.error?.description || 'request failed'}`);
  return data;
}
const woo = (path,body) => api(base+'/wp-json/wc/v3'+path,wooHeaders,body);
const razor = path => api('https://api.razorpay.com/v1'+path,razorHeaders);
(async()=>{
  const orders = await woo('/orders?status=pending&per_page=100');
  for (const order of orders) {
    const meta = key => order.meta_data.find(m=>m.key===key)?.value;
    if (!String(meta('_source')).startsWith('nextjs') || !(Number(meta('_cod_advance_minor'))>0) || Number(meta('_cod_advance_paid'))>0 || order.transaction_id || order.date_paid || Date.now()-Date.parse(order.date_created_gmt+'Z')<30*60*1000) continue;
    const result = await razor('/orders?receipt='+order.id+'&count=100');
    if (!Array.isArray(result.items) || result.items.length===0 || result.items.length>=100 || result.items.some(x=>x.receipt!==String(order.id))) {
      console.log(JSON.stringify({id:order.id,action:'skip: cannot establish complete gateway history'})); continue;
    }
    let paid = false;
    for (const ro of result.items) {
      const payments = await razor('/orders/'+ro.id+'/payments');
      if (!Array.isArray(payments.items)) throw new Error('Missing payment history');
      if (ro.amount_paid>0 || ro.status==='paid' || payments.items.some(p=>['captured','authorized','refunded'].includes(p.status))) paid=true;
    }
    if (paid) { console.log(JSON.stringify({id:order.id,action:'skip: payment exists; needs reconciliation'})); continue; }
    const update = {status:'cancelled',meta_data:[{key:'_gk_cleanup_reason',value:'Abandoned checkout: Razorpay checked, no captured or authorized payment.'}]};
    // Repair only the known extra-GST pattern, without repricing old paid orders.
    if (!order.coupon_lines.length && !order.fee_lines.length && Number(order.shipping_total)===0 && Number(order.total_tax)>0) {
      const lines=[];
      for (const line of order.line_items) {
        const product = await woo('/products/'+(line.variation_id ? line.product_id+'/variations/'+line.variation_id : line.product_id));
        const gross = Number(product.price)*line.quantity;
        if (Math.abs(Number(line.subtotal)-gross)>0.01 || Number(line.subtotal)<=0) throw new Error('Unexpected historical line amount for '+order.id);
        const net = gross/(1+Number(line.subtotal_tax)/Number(line.subtotal));
        lines.push({id:line.id,subtotal:net.toFixed(6),total:net.toFixed(6)});
      }
      update.line_items=lines;
    }
    console.log(JSON.stringify({id:order.id,from:order.status,to:update.status,oldTotal:order.total,repairTax:!!update.line_items,apply}));
    if (apply) {
      const latest = await woo('/orders/'+order.id);
      if(latest.status!=='pending'||latest.transaction_id||latest.date_paid) throw new Error('Order changed during audit');
      fs.mkdirSync('.local/order-repair',{recursive:true});
      fs.writeFileSync('.local/order-repair/'+order.id+'.json',JSON.stringify({id:order.id,status:order.status,total:order.total,line_items:order.line_items.map(x=>({id:x.id,subtotal:x.subtotal,total:x.total,taxes:x.taxes}))},null,2),{flag:'wx'});
      const saved=await woo('/orders/'+order.id,update);
      console.log(JSON.stringify({id:saved.id,status:saved.status,total:saved.total,tax:saved.total_tax}));
    }
  }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
