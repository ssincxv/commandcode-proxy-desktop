import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ConfigStore } from '../main/config-store.mjs';
test('settings validate, persist, and never return the stored key to renderer', async () => {
 const dir=await mkdtemp(path.join(tmpdir(),'cc-settings-'));
 try {
 const store=new ConfigStore({userDataPath:dir}); await store.load();
 await store.update({apiKey:'user_testsecret',port:3065});
 assert.equal(store.publicData().apiKey, undefined);
 assert.equal(store.publicData().hasApiKey,true);
 await assert.rejects(()=>store.update({port:0}));
 assert.equal(store.raw().port,3065);
 await store.update({logLevel:'debug'});
 const next=new ConfigStore({userDataPath:dir}); await next.load();
 assert.equal(next.raw().apiKey,'user_testsecret');
 assert.equal(next.raw().port,3065);
 } finally {await rm(dir,{recursive:true,force:true});}
});
