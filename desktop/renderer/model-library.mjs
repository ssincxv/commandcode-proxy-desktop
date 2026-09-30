import { chineseError } from './errors.mjs';
import { ModelContextMenu } from './model-context-menu.mjs';
export class ModelLibrary {
 constructor(api,notice){
  this.api=api;this.notice=notice;this.list=document.getElementById('model-list');this.button=document.getElementById('speed-test');this.selected=new Set();this.running=false;
  this.contextMenu=new ModelContextMenu(document.querySelector('[data-view=models]'),card=>card?.dataset.model??[...this.selected].at(-1),model=>api['copy-model'](model),notice);
  const inModelPage=target=>!document.querySelector('[data-view=models]').hidden&&Boolean(target.closest('main'));
  for(const type of ['dragstart','selectstart'])document.addEventListener(type,e=>{if(inModelPage(e.target))e.preventDefault()});
  this.marquee=document.createElement('div');this.marquee.className='model-marquee';this.marquee.hidden=true;document.body.append(this.marquee);
  document.addEventListener('pointerdown',e=>{
   if(e.button!==0)return;
   if(inModelPage(e.target))window.getSelection()?.removeAllRanges();
   if(e.target.closest('#speed-test, #model-context-menu'))return;
   const card=e.target.closest('.model-item');
   if(!inModelPage(e.target)||e.target.closest('button,input,select,a')){this.clear();return}
   e.preventDefault();this.end();
   const base=new Set(this.selected);
   if(card)this.toggle(card);else this.clear();
   this.drag={x:e.clientX,y:e.clientY,startX:e.clientX+scrollX,startY:e.clientY+scrollY,base:e.shiftKey?base:new Set(),active:false};
   this.frame=requestAnimationFrame(()=>this.tick());
  });
  document.addEventListener('pointermove',e=>{if(!this.drag)return;if(!(e.buttons&1)){this.end();return}this.drag.x=e.clientX;this.drag.y=e.clientY;this.updateRectangle()});
  document.addEventListener('pointerup',()=>this.end());document.addEventListener('pointercancel',()=>this.end());window.addEventListener('blur',()=>this.end());
  document.addEventListener('scroll',()=>this.updateRectangle(),true);
  this.list.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const card=e.target.closest('.model-item');if(card){e.preventDefault();this.toggle(card)}}});
  this.button.onclick=()=>this.run();
 }
 clear(){this.selected.clear();this.list.querySelectorAll('.model-item').forEach(c=>c.setAttribute('aria-selected','false'));this.count()}
 count(){document.getElementById('model-selection-count').textContent=this.selected.size?'已选 '+this.selected.size+' 个模型':''}
 add(card){this.selected.add(card.dataset.model);card.setAttribute('aria-selected','true');this.count()}
 toggle(card){const model=card.dataset.model;if(this.selected.has(model)){this.selected.delete(model);card.setAttribute('aria-selected','false');this.count()}else this.add(card)}
 updateRectangle(){
  const d=this.drag;if(!d)return;
  const x=d.x+scrollX,y=d.y+scrollY;
  if(!d.active&&Math.hypot(x-d.startX,y-d.startY)<5)return;
  d.active=true;
  const left=Math.min(d.startX,x),right=Math.max(d.startX,x),top=Math.min(d.startY,y),bottom=Math.max(d.startY,y);
  Object.assign(this.marquee.style,{left:(left-scrollX)+'px',top:(top-scrollY)+'px',width:(right-left)+'px',height:(bottom-top)+'px'});this.marquee.hidden=false;
  const next=new Set(d.base);
  for(const card of this.list.children){const r=card.getBoundingClientRect();if(r.right+scrollX>=left&&r.left+scrollX<=right&&r.bottom+scrollY>=top&&r.top+scrollY<=bottom)next.add(card.dataset.model)}
  this.selected=next;
  for(const card of this.list.children)card.setAttribute('aria-selected',String(next.has(card.dataset.model)));
  this.count();
 }
 tick(){if(!this.drag)return;const {y,active}=this.drag;const delta=active?(y>innerHeight-45?12:y<45?-12:0):0;if(delta)window.scrollBy(0,delta);this.updateRectangle();this.frame=requestAnimationFrame(()=>this.tick())}
 end(){this.drag=null;cancelAnimationFrame(this.frame);if(this.marquee)this.marquee.hidden=true}
 render(models){this.end();this.list.classList.remove('empty');this.list.replaceChildren();this.clear();for(const model of models){const card=document.createElement('div');card.className='model-item';card.dataset.model=model;card.tabIndex=0;card.setAttribute('role','option');card.setAttribute('aria-selected','false');const label=document.createElement('code');label.textContent=model;const result=document.createElement('small');result.className='speed-result';card.append(label,result);this.list.append(card)}this.list.setAttribute('role','listbox');this.list.setAttribute('aria-multiselectable','true')}
 async run(){
  if(this.running){this.cancelled=true;this.button.disabled=true;await this.api['cancel-speed-test']();return}
  const models=[...this.selected];if(!models.length){this.notice('请先选择模型');return}
  this.running=true;this.cancelled=false;this.button.textContent='停止测试';const refresh=document.querySelector('[data-action=models]');refresh.disabled=true;
  let completed=0,failed=0,index=0;
  const results=new Map(models.map(model=>[model,[...this.list.children].find(c=>c.dataset.model===model).querySelector('.speed-result')]));
  for(const result of results.values())result.textContent='等待测试…';
  const worker=async()=>{
   while(!this.cancelled&&index<models.length){
    const model=models[index++],result=results.get(model);result.textContent='正在测试…';
    try{const data=await this.api['speed-test'](model);result.textContent=(data.tokensPerSecond===null?'未返回 token 用量':data.tokensPerSecond.toFixed(1)+' tokens/秒')+' · 首字 '+(data.firstTextMs/1000).toFixed(2)+' 秒 · 总耗时 '+(data.totalMs/1000).toFixed(2)+' 秒';}
    catch(error){result.textContent=this.cancelled?'已停止':chineseError(error);failed++;}
    completed++;this.notice('并发测速 · 已处理 '+completed+' / '+models.length+' 个模型');
   }
  };
  try{await Promise.all(Array.from({length:Math.min(3,models.length)},worker));}
  finally{
   for(const result of results.values())if(result.textContent==='等待测试…')result.textContent='已取消';
   this.running=false;this.button.disabled=false;this.button.textContent='速度测试';refresh.disabled=false;
   this.notice(this.cancelled?'速度测试已停止':'速度测试完成 · 成功 '+(completed-failed)+' · 失败 '+failed);
  }
 }
}
