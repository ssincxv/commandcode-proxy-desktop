import test from 'node:test';
import assert from 'node:assert/strict';
import { ProxyManager } from '../main/proxy-manager.mjs';
test('start and stop owns exactly one child',async()=>{
 const m=new ProxyManager({entryPath:process.execPath,entryArgs:['-e','setInterval(()=>{},1000)'],healthCheck:async()=>true});
 try {await m.start(); const pid=m.status().pid; await m.start();assert.equal(m.status().pid,pid);assert.equal(m.status().state,'running');}
 finally{await m.stop();} assert.equal(m.status().state,'stopped');assert.equal(m.status().pid,null);
});
test('spawn failure rejects without falsely reporting running',async()=>{
 const m=new ProxyManager({entryPath:'Z:/nonexistent-cc-node.exe',healthCheck:async()=>true});
 await assert.rejects(()=>m.start()); await m.stop(); assert.equal(m.status().pid,null);
});
test('failed health check terminates the owned child',async()=>{
 const m=new ProxyManager({entryPath:process.execPath,entryArgs:['-e','setInterval(()=>{},1000)'],healthCheck:async()=>false,readyTimeout:100});
 await assert.rejects(()=>m.start()); assert.equal(m.status().pid,null);
});
