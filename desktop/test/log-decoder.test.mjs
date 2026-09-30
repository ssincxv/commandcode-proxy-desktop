import test from 'node:test';
import assert from 'node:assert/strict';
import { LogDecoder } from '../main/log-decoder.mjs';
test('decodes chunks into distinct levels including split UTF8 and partial lines',()=>{
 const lines=[];const decoder=new LogDecoder('info',entry=>lines.push(entry));
 const data=Buffer.from('[2026-09-28T12:26:15Z] [warn] 警告\n[2026-09-28T12:26:15Z] [info] Key in header\n');
 const split=data.indexOf(Buffer.from('警'))+1;
 decoder.write(data.subarray(0,split));assert.equal(lines.length,0);
 decoder.write(data.subarray(split,split+5));
 decoder.write(data.subarray(split+5));decoder.end();
 assert.deepEqual(lines.map(x=>x.level),['warn','info']);
 assert.match(lines[0].message,/警告/);
 assert.equal(lines[0].message.includes('Key'),false);
});
test('flushes final unterminated line and uses stderr fallback level',()=>{
 const lines=[];const decoder=new LogDecoder('error',entry=>lines.push(entry));
 decoder.write(Buffer.from('unexpected exit'));decoder.end();
 assert.deepEqual(lines,[{level:'error',message:'unexpected exit'}]);
});
