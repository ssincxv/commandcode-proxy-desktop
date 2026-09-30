import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { Service, redact } from '../main/service.mjs';
test('occupied port fails before spawning and leaves existing server intact',async()=>{
 const server=net.createServer();
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
 const service=new Service({store:{raw:()=>({port:server.address().port})}});
 await assert.rejects(()=>service.start(),/已被占用/);
 assert.equal(service.manager,null);
 assert.equal(server.listening,true);
 }finally{await new Promise(r=>server.close(r));}
});
test('log output removes API keys and bounds history',()=>{
 const service=new Service({});
 for(let i=0;i<350;i++)service.log({level:'info',message:'Bearer user_secretKey'});
 assert.equal(service.logs.length,300);
 assert.equal(service.logs.some(x=>x.message.includes('user_secretKey')),false);
 assert.equal(redact('user_abc-def'),'[REDACTED]');
});


test('connection test checks a generic model response through the proxy',async()=>{
 const service=new Service({store:{raw:()=>({model:'test-model'})}});
 service.request=async(route,body)=>{
  assert.equal(route,'/v1/chat/completions');
  assert.equal(body.model,'test-model');
  assert.equal(body.stream,false);
  assert.ok(body.messages.some(x=>x.content.includes('connection test')));
  assert.ok(!body.messages.some(x=>/translat/i.test(x.content)));
  return {choices:[{message:{content:'OK'}}]};
 };
 assert.equal(await service.testConnection(),'连接成功，上游模型响应正常。');
 service.request=async()=>({choices:[{message:{content:' '}}]});
 await assert.rejects(()=>service.testConnection(),/未返回有效响应/);
 service.request=async()=>{throw new Error('HTTP 401')};
 await assert.rejects(()=>service.testConnection(),/HTTP 401/);
});

test('speed tests allow three requests, reject overflow, and cancel all',async t=>{
 let started=0;
 t.mock.method(globalThis,'fetch',async(_url,{signal})=>{started++;return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}))});
 const service=new Service({store:{raw:()=>({port:3050,apiKey:'user_test'})}});
 const pending=['a','b','c'].map(model=>service.speedTest(model));
 const settled=Promise.allSettled(pending);
 assert.equal(started,3);
 await assert.rejects(service.speedTest('d'),/3/);
 service.cancelSpeedTest();
 assert.ok((await settled).every(r=>r.status==='rejected'));
 assert.equal(service.speedControllers.size,0);
});

test('connection refused reports that the local proxy must be started',async t=>{
 t.mock.method(globalThis,'fetch',async()=>{throw new TypeError('fetch failed',{cause:{code:'ECONNREFUSED'}})});
 const service=new Service({store:{raw:()=>({port:3050,apiKey:'user_test'})}});
 await assert.rejects(service.testConnection(),/本地代理未启动/);
});
