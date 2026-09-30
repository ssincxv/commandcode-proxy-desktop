import { chineseError } from '../renderer/errors.mjs';
import { measureSpeed } from './speed-test.mjs';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import { ProxyManager } from './proxy-manager.mjs';

export function redact(text) {
  return String(text).replace(/user_[a-zA-Z0-9_-]+/g,'[REDACTED]');
}
export class Service {
  constructor({store,userData,entry,executable}) {
    Object.assign(this,{store,userData,entry,executable});
    this.speedControllers=new Set();this.logs=[]; this.manager=null; this.queue=Promise.resolve();
  }
  snapshot() { const status=this.manager?.status()??{state:'stopped'};if(status.error)status.error=chineseError(status.error);return {status,logs:this.logs}; }
  log(entry) {
    const line={...entry,message:(entry.level==='error'?chineseError(entry.message):redact(entry.message)).slice(0,4000),time:new Date().toLocaleTimeString()};
    this.logs.push(line); if(this.logs.length>300)this.logs.shift();
  }
  run(action) {
    const next=this.queue.then(()=>this[action]());
    this.queue=next.catch(()=>{});
    return next;
  }
  async start() {
    if(this.manager?.status().state==='running')return this.snapshot();
    const config=this.store.raw();
    await new Promise((resolve,reject)=>{
      const probe=net.createServer();
      probe.once('error',()=>reject(new Error('端口 '+config.port+' 已被占用。请停止旧代理或更换端口。')));
      probe.listen(config.port,'127.0.0.1',()=>probe.close(resolve));
    });
    const runtime=path.join(this.userData,'runtime');
    await mkdir(runtime,{recursive:true});
    await copyFile(this.entry,path.join(runtime,'proxy.mjs'));
    // Upstream reads config next to its entry; keep credentials out of that file.
    const {apiKey, ...runtimeConfig}=config;
    await writeFile(path.join(runtime,'config.json'),JSON.stringify(runtimeConfig,null,2));
    this.manager=new ProxyManager({
      entryPath:this.executable,entryArgs:[path.join(runtime,'proxy.mjs')],cwd:runtime,
      env:{ELECTRON_RUN_AS_NODE:'1',PORT:String(config.port),HOST:'127.0.0.1',CC_API_BASE:config.apiBase,CC_MAX_BODY_MB:'16',CC_MAX_INFLIGHT:'8',CC_SUPPRESS_VERSION_DRIFT_WARNING:'1'},
      healthCheck:()=>this.health(),
    });
    this.manager.on('log',entry=>this.log(entry));
    await this.manager.start();
    return this.snapshot();
  }
  async stop() { this.cancelSpeedTest(); await this.manager?.stop(); return this.snapshot(); }
  async restart() { await this.stop(); return this.start(); }
  async health() {
    try {const r=await fetch('http://127.0.0.1:'+this.store.raw().port+'/health',{signal:AbortSignal.timeout(1500)});return r.ok;}
    catch{return false;}
  }
  async request(route,body) {
    const config=this.store.raw();
    if(!config.apiKey)throw new Error('请先在代理设置中保存 CommandCode API Key');
    let r;
    try{r=await fetch('http://127.0.0.1:'+config.port+route,{
      method:body?'POST':'GET',headers:{Authorization:'Bearer '+config.apiKey,'Content-Type':'application/json'},
      body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000),
    });
    }catch(error){
      if(error.cause?.code==='ECONNREFUSED'||error.cause?.errors?.some(e=>e.code==='ECONNREFUSED'))throw new Error('本地代理未启动，请在概览中启动代理后重试');
      if(error.name==='TimeoutError')throw new Error('连接测试超时，请稍后重试或更换模型');
      throw new Error('本地代理连接中断，请检查运行日志并重启代理');
    }
    const data=await r.json();
    if(!r.ok)throw new Error(redact(data.error?.message||('HTTP '+r.status)));
    return data;
  }
  async speedTest(model) {
    if(this.speedControllers.size>=3)throw new Error('最多同时测试 3 个模型');
    const controller=new AbortController();this.speedControllers.add(controller);
    try{return await measureSpeed({...this.store.raw(),model,signal:AbortSignal.any([controller.signal,AbortSignal.timeout(90000)])});}
    finally{this.speedControllers.delete(controller);}
  }
  cancelSpeedTest(){for(const controller of this.speedControllers)controller.abort();}
  async models() { const data=await this.request('/v1/models');return data.data.map(x=>x.id); }
  async testConnection() {
    const data=await this.request('/v1/chat/completions',{
      model:this.store.raw().model,stream:false,max_tokens:256,
      messages:[{role:'user',content:'This is a connection test. Reply only with OK.'}],
    });
    const content=data.choices?.[0]?.message?.content;
    if(typeof content!=='string' || !content.trim())throw new Error('连接测试失败：上游未返回有效响应');
    return '连接成功，上游模型响应正常。';
  }
}
