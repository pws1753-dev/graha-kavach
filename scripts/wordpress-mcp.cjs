// Direct access to the user-supplied WordPress MCP endpoint. Credentials stay in process env.
const fs = require('node:fs');
const endpoint = 'https://admin.grahakavach.in/wp-json/mcp/emcp-tools-server';
const authorization = process.env.GK_MCP_AUTH;
if (!authorization) throw new Error('GK_MCP_AUTH is required');
let session;
let nextId=1;
async function rpc(method,params,notification=false) {
  const response=await fetch(endpoint,{method:'POST',headers:{Authorization:authorization,'Content-Type':'application/json',Accept:'application/json, text/event-stream',...(session?{'Mcp-Session-Id':session}:{})},body:JSON.stringify({jsonrpc:'2.0',...(notification?{}:{id:nextId++}),method,params})});
  session=response.headers.get('mcp-session-id')||session;
  const raw=await response.text();
  if(!response.ok)throw new Error('MCP HTTP '+response.status+': '+raw.slice(0,400));
  if(!raw)return null;
  const message=raw.startsWith('event:')||raw.startsWith('data:')?JSON.parse(raw.split('\n').find(x=>x.startsWith('data:')).slice(5)):JSON.parse(raw);
  if(message.error)throw new Error(JSON.stringify(message.error));
  return message.result;
}
(async()=>{
  const initialized=await rpc('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'grahakavach-maintenance',version:'1.0'}});
  await rpc('notifications/initialized',{},true);
  if(process.argv[2]==='--list'){
    const result=await rpc('tools/list',{});
    fs.mkdirSync('.local/mcp',{recursive:true});
    fs.writeFileSync('.local/mcp/tools.json',JSON.stringify(result,null,2));
    console.log(JSON.stringify({server:initialized.serverInfo,tools:result.tools.map(x=>({name:x.name,description:x.description?.slice(0,220)}))}));
  }else if(process.argv[2]==='--batch'){
    for(const call of JSON.parse(fs.readFileSync(process.argv[3],'utf8'))){
      const result=await rpc('tools/call',{name:call.name,arguments:call.arguments});
      if(call.output)fs.writeFileSync(call.output,JSON.stringify(result,null,2));
      else console.log(JSON.stringify({name:call.name,result}));
    }
  }else{
    const args=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
    const result=await rpc('tools/call',{name:process.argv[2],arguments:args});
    if(process.argv[4])fs.writeFileSync(process.argv[4],JSON.stringify(result,null,2));
    else console.log(JSON.stringify(result));
  }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
