import { chineseError } from './errors.mjs';
export class ModelContextMenu {
 constructor(section,resolve,copy,notice){
  this.node=document.createElement('div');this.node.id='model-context-menu';this.node.className='model-context-menu';this.node.setAttribute('role','menu');this.node.hidden=true;
  this.button=document.createElement('button');this.button.type='button';this.button.textContent='复制';this.button.setAttribute('role','menuitem');this.node.append(this.button);document.body.append(this.node);
  section.addEventListener('contextmenu',event=>{
   event.preventDefault();this.target=resolve(event.target.closest('.model-item'));this.button.disabled=!this.target;this.node.hidden=false;
   this.node.style.left=Math.max(4,Math.min(event.clientX,innerWidth-this.node.offsetWidth-4))+'px';this.node.style.top=Math.max(4,Math.min(event.clientY,innerHeight-this.node.offsetHeight-4))+'px';
   this.button.focus();
  });
  this.button.onclick=async()=>{const target=this.target;this.close();if(!target)return;try{await copy(target);notice('已复制模型名称。')}catch(error){notice(chineseError(error),true)}};
  document.addEventListener('pointerdown',event=>{if(!this.node.contains(event.target))this.close()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')this.close()});
  document.addEventListener('scroll',()=>this.close(),true);window.addEventListener('blur',()=>this.close());window.addEventListener('resize',()=>this.close());
 }
 close(){this.node.hidden=true}
}
