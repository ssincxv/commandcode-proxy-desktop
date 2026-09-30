import { LogDecoder } from './log-decoder.mjs';
import { spawn } from 'node:child_process';
import { EventEmitter, once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

export class ProxyManager extends EventEmitter {
  constructor({entryPath,entryArgs=[],cwd,env={},healthCheck=async()=>true,readyTimeout=6000}) {
    super();
    Object.assign(this,{entryPath,entryArgs,cwd,env,healthCheck,readyTimeout});
    this.child=null; this.state='stopped'; this.lastError=null;
  }
  status() { return {state:this.state,pid:this.child?.pid??null,error:this.lastError}; }
  changed(state) { this.state=state; this.emit('status',this.status()); }
  async start() {
    if (this.state==='running') return this.status();
    if (this.state==='starting') return this.pending;
    this.pending=this.launch();
    return this.pending;
  }
  async launch() {
    this.lastError=null; this.changed('starting');
    const child=spawn(this.entryPath,this.entryArgs,{
      cwd:this.cwd,env:{...process.env,...this.env},windowsHide:true,stdio:['ignore','pipe','pipe'],
    });
    this.child=child;
    const stdout=new LogDecoder('info',entry=>this.emit('log',entry));
    child.stdout?.on('data',d=>stdout.write(d));
    child.stdout?.once('end',()=>stdout.end());
    const stderr=new LogDecoder('error',entry=>this.emit('log',entry));
    child.stderr?.on('data',d=>stderr.write(d));
    child.stderr?.once('end',()=>stderr.end());
    child.once('exit',(code)=>{
      if(this.child===child) this.child=null;
      if(this.state!=='stopping') {
        this.lastError='代理进程已退出（'+code+'），请检查端口是否占用';
        this.changed('error');
      }
    });
    try {
      await once(child,'spawn');
      const until=Date.now()+this.readyTimeout;
      while(Date.now()<until) {
        await delay(100);
        if(!this.child || child.exitCode!==null) throw new Error(this.lastError||'代理启动失败');
        if(await this.healthCheck()) { this.changed('running'); return this.status(); }
      }
      throw new Error('代理启动超时');
    } catch(error) {
      await this.stop();
      this.lastError=error.message; this.changed('error');
      throw error;
    }
  }
  async stop() {
    const child=this.child;
    this.changed('stopping');
    if(child && child.exitCode===null && child.pid) {
      await new Promise(resolve=>{
        const timer=setTimeout(()=>{child.kill('SIGKILL');},2000);
        child.once('exit',()=>{clearTimeout(timer);resolve();});
        child.kill();
      });
    }
    this.child=null; this.changed('stopped');
    return this.status();
  }
  async restart() { await this.stop(); return this.start(); }
}
