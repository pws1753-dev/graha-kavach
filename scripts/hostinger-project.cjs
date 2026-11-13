// Uses the project's existing Hostinger MCP configuration, without copying its token.
const fs=require('node:fs');const path=require('node:path');const {spawn}=require('node:child_process');
const config=JSON.parse(fs.readFileSync('.cursor/mcp.json','utf8').replace(/^\uFEFF/,''));
const connection=config.mcpServers['hostinger-hosting'];
const cache=path.join(process.env.LOCALAPPDATA,'npm-cache','_npx');
const packages=fs.globSync('*/node_modules/hostinger-api-mcp/package.json',{cwd:cache});
if(!packages.length)throw new Error('The configured Hostinger MCP package is not installed');
const packagePath=path.join(cache,packages.sort((a,b)=>fs.statSync(path.join(cache,b)).mtimeMs-fs.statSync(path.join(cache,a)).mtimeMs)[0]);
const pkg=JSON.parse(fs.readFileSync(packagePath,'utf8'));
const server=spawn(process.execPath,[path.resolve(path.dirname(packagePath),pkg.bin['hostinger-hosting-mcp'])],{env:{...process.env,...connection.env},stdio:['pipe','pipe','pipe'],windowsHide:true});
let buffer='',id=0;const pending=new Map();
server.stdout.on('data',chunk=>{buffer+=chunk.toString();let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);try{const data=JSON.parse(line);if(data.id&&pending.has(data.id)){const callback=pending.get(data.id);pending.delete(data.id);if(data.error){callback.reject(new Error(JSON.stringify(data.error)));}else{callback.resolve(data.result);}}}catch{}}});
server.on('exit',()=>{for(const callback of pending.values())callback.reject(new Error('Hostinger MCP exited'));});
function rpc(method,params,notification=false){const request={jsonrpc:'2.0',method,params};if(notification){server.stdin.write(JSON.stringify(request)+'\n');return Promise.resolve();}request.id=++id;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});server.stdin.write(JSON.stringify(request)+'\n');});}
(async()=>{
 await rpc('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'grahakavach-maintenance',version:'1.0'}});await rpc('notifications/initialized',{},true);
 const calls=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
 for(const call of calls){const result=await rpc('tools/call',{name:call.name,arguments:call.arguments});if(call.output)fs.writeFileSync(call.output,JSON.stringify(result,null,2));else console.log(JSON.stringify(result));}
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>server.kill());
