import { _electron as electron } from '@playwright/test';
import { mkdtemp, writeFile, readFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import assert from 'node:assert/strict';
import { installModelFixtures } from './smoke-fixtures.mjs';
const root=process.cwd();
const live=process.argv.includes('--live');
const seed={apiKey:live?process.env.CC_SMOKE_API_KEY:'user_smoke_fixture'};
if(!seed.apiKey)throw new Error('真实上游测试需要设置 CC_SMOKE_API_KEY');
const data=await mkdtemp(path.join(os.tmpdir(),'cc-desktop-smoke-'));
let app;
try {
await mkdir('desktop/qa',{recursive:true});
const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
await writeFile(path.join(data,'config.json'),JSON.stringify({port,apiKey:seed.apiKey,autoStart:false}));
app=await electron.launch({
 ...(process.argv.includes('--packaged')?{executablePath:path.join(root,'dist/win-unpacked/CommandCode Proxy.exe'),args:[]}:{args:[root]}),
 env:Object.fromEntries(Object.entries({...process.env,CC_DESKTOP_TEST_DATA:data}).filter(([key])=>!['ELECTRON_RUN_AS_NODE','CC_SMOKE_API_KEY'].includes(key))),
});
 const page=await app.firstWindow();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.locator('#hero-status').filter({hasText:'代理已停止'}).waitFor();
 await app.evaluate(async({clipboard,ClipboardItem})=>{
   const items=await clipboard.read();
   globalThis.smokeClipboard=await Promise.all(items.map(async item=>new ClipboardItem(
     Object.fromEntries(await Promise.all(item.types.map(async type=>[type,await item.getType(type)])))
   )));
 });
 await page.locator('[data-view=overview] [data-action=test]').click();
 await page.locator('#notice').filter({hasText:'本地代理未启动'}).waitFor();
 assert.ok(!(await page.locator('#notice').textContent()).includes('Error invoking'));
 await page.locator('#toggle').click();
 await page.locator('#hero-status').filter({hasText:'代理已启用'}).waitFor({timeout:15000});
 if(!live)await app.evaluate(installModelFixtures);
 await page.locator('[data-page=settings]').click();
 await page.locator('#model').fill('deepseek/deepseek-v4-flash');
 await page.locator('button[type=submit]').click();
 await page.locator('#notice').filter({hasText:'设置已保存'}).waitFor({timeout:15000});
 assert.equal(await page.locator('#apiKey').getAttribute('type'),'password');
 assert.equal(await page.locator('#apiKey').inputValue(),'•'.repeat(32));
 await page.locator('#key-visibility').click();
 await page.waitForFunction(()=>document.getElementById('apiKey').type==='text');
 assert.equal(await page.locator('#apiKey').inputValue()===seed.apiKey,true);
 await page.locator('#key-visibility').click();
 assert.equal(await page.locator('#apiKey').getAttribute('type'),'password');
 assert.equal(await page.locator('#apiKey').inputValue(),'•'.repeat(32));
 assert.equal(await page.locator('.intro,.footnote,#key-hint').count(),0);
 await page.locator('[data-page=diagnostics]').click();
 await page.locator('[data-action=health]').click();
 await page.locator('#notice').filter({hasText:'本地服务响应正常'}).waitFor();
 await page.locator('[data-page=logs]').click();
 await page.locator('#log-filter').selectOption('warn');
 await page.waitForFunction(()=>!document.getElementById('logs').textContent.includes('[info]'));
 const warningText=await page.locator('#logs').textContent();
 assert.ok(!warningText.includes('[info]'),'Warning filter must not include info lines');
 await page.locator('#log-filter').selectOption('all');
 await page.locator('#logs').scrollIntoViewIfNeeded();
 const logBox=await page.locator('#logs').boundingBox();
 await page.mouse.move(logBox.x+25,logBox.y+25);
 await page.mouse.down();
 await page.mouse.move(logBox.x+210,logBox.y+45,{steps:12});
 const selected=await page.evaluate(()=>window.getSelection().toString());
 assert.ok(selected.length>0,'Drag selects actual log text');
 await page.waitForTimeout(1800);
 assert.equal(await page.evaluate(()=>window.getSelection().toString()),selected,'Polling must not interrupt mouse-held selection');
 await page.mouse.up();
 await page.waitForTimeout(1800);
 assert.equal(await page.evaluate(()=>window.getSelection().toString()),selected,'Selection remains after mouse release');
 await page.evaluate(()=>window.getSelection().removeAllRanges());
 await page.locator('#log-filter').focus();
 assert.equal(await page.locator('#log-filter').evaluate(el=>getComputedStyle(el).outlineStyle),'none');
 await page.locator('[data-page=settings]').click();
 await page.locator('#logLevel').focus();
 assert.equal(await page.locator('#logLevel').evaluate(el=>getComputedStyle(el).outlineStyle),'none');
 assert.equal(await page.locator('[data-view=overview] [data-action=test]').textContent(),'测试连接');
 await page.locator('[data-page=diagnostics]').click();
 if(live){
   await page.locator('[data-view=diagnostics] [data-action=test]').click();
   await page.locator('#notice').filter({hasText:'连接成功'}).waitFor({timeout:70000});
   console.log('Live connection test:',await page.locator('#notice').textContent());
   await page.locator('[data-page=models]').click();
   await page.locator('[data-action=models]').click();
   await page.locator('#model-list .model-item').first().waitFor({timeout:30000});
 }
 await page.locator('[data-page=overview]').click();
 await page.locator('[data-page=models]').click();
 await page.locator('[data-action=models]').click();
 await page.locator('#model-list .model-item').first().waitFor({timeout:30000});
 const offset=await page.locator('#model-list .model-item').first().evaluate(row=>row.firstChild.getBoundingClientRect().left-row.getBoundingClientRect().left);
 assert.ok(offset>=16 && offset<=18,'Model names have consistent leading padding');
 const cards=await page.locator('#model-list .model-item').evaluateAll(nodes=>nodes.slice(0,2).map(node=>{const b=node.getBoundingClientRect();return {x:b.x,y:b.y,height:b.height};}));
 assert.equal(cards[0].y,cards[1].y,'Model list uses two columns');
 assert.ok(cards[0].height<=52,'Model rows remain compact');
 await page.locator('#model-notice').filter({hasText:'已读取'}).waitFor();
 assert.ok(!(await page.locator('#notice').textContent()).includes('已读取'));
 assert.ok(!(await page.locator('[data-view=logs]').textContent()).includes('显示级别'));
 const items=page.locator('#model-list .model-item');
 await items.nth(0).click();
 assert.equal(await page.locator('.model-item[aria-selected=true]').count(),1);
 await items.nth(2).click({modifiers:['Shift']});
 assert.equal(await page.locator('.model-item[aria-selected=true]').count(),2);
 const lastName=await items.nth(2).getAttribute('data-model');
 const rightName=await items.nth(1).getAttribute('data-model');
 await items.nth(1).click({button:'right'});
 await page.locator('#model-context-menu button').click();
 assert.equal(await app.evaluate(({clipboard})=>clipboard.readText()),rightName);
 assert.equal(await page.locator('.model-item[aria-selected=true]').count(),2);
 await page.locator('[data-view=models] h1').click({button:'right'});
 await page.locator('#model-context-menu button').click();
 assert.equal(await app.evaluate(({clipboard})=>clipboard.readText()),lastName);
 assert.equal(await page.locator('.model-item[aria-selected=true]').count(),2);
 const a=await items.nth(0).boundingBox(),b=await items.nth(1).boundingBox();
 await page.evaluate(()=>{const range=document.createRange();range.selectNodeContents(document.querySelector('[data-view=models] .actions'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range)});
 await page.mouse.move(a.x-12,a.y+20);await page.mouse.down();
 await page.mouse.move(b.x+20,b.y+20,{steps:25});
 assert.equal(await page.locator('.model-item[aria-selected=true]').count(),2,'Blank margin starts model drag selection');
 assert.equal(await page.evaluate(()=>getSelection().toString()),'','Old native text selection is cleared');
 await page.mouse.up();
 await page.mouse.move(a.x+20,a.y+20);await page.mouse.down();await page.mouse.move(b.x+20,b.y+20,{steps:20});
 assert.equal(await page.locator('.model-item[aria-selected=true]').count(),2);
 await page.mouse.wheel(0,400);await page.waitForTimeout(300);
 assert.ok(await page.evaluate(()=>scrollY)>0);
 await page.mouse.wheel(0,-400);await page.waitForTimeout(300);await page.mouse.up();
 await page.locator('[data-view=models] h1').click();
 const cornerA=await items.nth(0).boundingBox(),cornerB=await items.nth(13).boundingBox();
 await page.mouse.move(cornerA.x+5,cornerA.y+5);await page.mouse.down();await page.mouse.move(cornerB.x+20,cornerB.y+20,{steps:20});assert.equal(await page.locator('.model-marquee').isVisible(),false);await page.mouse.up();
 assert.equal(await page.locator('.model-marquee').isVisible(),false);
 assert.equal(await page.locator('.model-item[aria-selected=true]').count(),14,'Rectangle selects both columns across seven rows');
 await items.nth(1).click();assert.equal(await page.locator('.model-item[aria-selected=true]').count(),13,'Click selected removes only that model');
 await items.nth(1).click();assert.equal(await page.locator('.model-item[aria-selected=true]').count(),14,'Click unselected adds the model');
 await page.locator('[data-view=models] h1').click();assert.equal(await page.locator('.model-item[aria-selected=true]').count(),0);
 const target=items.filter({hasText:'deepseek/deepseek-v4-flash'}).first();await target.click();
 await page.locator('#speed-test').click();
 assert.equal(await page.locator('.model-item[aria-selected=true]').count(),1);
 await page.waitForFunction(()=>document.getElementById('speed-test').textContent==='速度测试',{},{timeout:100000});
 assert.match(await target.locator('.speed-result').textContent(),/tokens\/秒/);
 await page.locator('[data-view=models] h1').click();
 for(let i=0;i<4;i++)await items.nth(i).click();
 await page.locator('#speed-test').click();
 await page.waitForFunction(()=>[...document.querySelectorAll('.speed-result')].filter(e=>e.textContent==='正在测试…').length===3);
 assert.equal(await page.locator('.speed-result').filter({hasText:'等待测试…'}).count(),1);
 await page.locator('#speed-test').click();
 await page.waitForFunction(()=>document.getElementById('speed-test').textContent==='速度测试');
 assert.equal(await page.locator('.speed-result').filter({hasText:'等待测试…'}).count(),0);
 assert.equal(await page.locator('.speed-result').filter({hasText:'正在测试…'}).count(),0);
 assert.equal(await items.nth(3).locator('.speed-result').textContent(),'已取消');
 await page.screenshot({path:'desktop/qa/models.png'});
 await page.locator('[data-page=overview]').click();
 assert.equal(await page.locator('#model-notice').isVisible(),false,'Model status is hidden on other pages');
 await page.locator('#notice').evaluate(el=>el.hidden=true);
 await mkdir('desktop/qa',{recursive:true});
 await page.screenshot({path:'desktop/qa/overview.png'});
 await page.locator('[data-page=settings]').click();
 await page.screenshot({path:'desktop/qa/settings.png'});
 await page.locator('[data-page=overview]').click();
 await page.locator('#toggle').click();
 await page.locator('#hero-status').filter({hasText:'代理已停止'}).waitFor();
 await page.locator('[data-page=settings]').click();
 await page.locator('#apiKey').fill('');
 await page.locator('button[type=submit]').click();
 await page.locator('#notice').filter({hasText:'设置已保存'}).waitFor();
 assert.equal(await page.locator('#apiKey').inputValue(),'');
 assert.equal(JSON.parse(await readFile(path.join(data,'config.json'),'utf8')).apiKey,'');
 await page.locator('#apiKey').fill('user_ui_test');
 await page.locator('#key-visibility').click();
 assert.equal(await page.locator('#apiKey').inputValue(),'user_ui_test');
 assert.equal(await page.locator('#apiKey').getAttribute('type'),'text');
 await page.locator('button[type=submit]').click();
 await page.locator('#notice').filter({hasText:'设置已保存'}).waitFor();
 assert.equal(await page.locator('#apiKey').getAttribute('type'),'password');
 assert.deepEqual(errors,[]);
 const leaked=await page.evaluate(key=>document.body.innerText.includes(key),seed.apiKey);
 assert.equal(leaked,false);
 console.log('PASS: UI, start/stop, save/restart, health, key isolation, no renderer errors');
} catch(error) {
 console.error('界面检查失败：',error);
 throw error;
} finally {
 if(app){
   try {
     await app.evaluate(async({clipboard})=>{
       if(globalThis.smokeClipboard){
         if(globalThis.smokeClipboard.length)await clipboard.write(globalThis.smokeClipboard);
         else clipboard.clear();
       }
     });
   } finally {await app.close();}
 }
 await rm(data,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
