import test from 'node:test';
import assert from 'node:assert/strict';
import {measureSpeed} from '../main/speed-test.mjs';
const options={port:3050,apiKey:'user_test',model:'test'};
function mock(lines){return async(url,init)=>{assert.equal(JSON.parse(init.body).model,'test');const bytes=new TextEncoder().encode(lines);return new Response(new ReadableStream({start(c){for(let i=0;i<bytes.length;i+=7)c.enqueue(bytes.slice(i,i+7));c.close()}}))}}
const delta='data: '+JSON.stringify({choices:[{delta:{content:'你好'}}]})+'\n\n';
const finish='data: '+JSON.stringify({choices:[{finish_reason:'stop'}],usage:{completion_tokens:12}})+'\n\ndata: [DONE]\n\n';
test('speed uses upstream tokens and handles split UTF8/SSE',async()=>{const r=await measureSpeed({...options,fetchImpl:mock(delta+finish)});assert.equal(r.tokens,12);assert.ok(r.tokensPerSecond>0);assert.ok(r.totalMs>=r.firstTextMs)});
test('missing usage is not estimated as tokens',async()=>{const r=await measureSpeed({...options,fetchImpl:mock(delta+'data: {"choices":[{"finish_reason":"stop"}]}\n\ndata: [DONE]\n')});assert.equal(r.tokensPerSecond,null)});
test('incomplete streams and errors do not produce fake speed',async()=>{await assert.rejects(measureSpeed({...options,fetchImpl:mock(delta)}));await assert.rejects(measureSpeed({...options,fetchImpl:mock('data: {"error":{"message":"failed"}}\n')}),/failed/)});
