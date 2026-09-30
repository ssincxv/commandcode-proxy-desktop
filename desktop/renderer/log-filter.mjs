export class LogFilter {
 constructor(trigger,menu) {
  this.trigger=trigger;
  this.menu=menu;
  this.root=trigger.parentElement;
  this.options=[...menu.querySelectorAll('[role=option]')];
  trigger.addEventListener('click',()=>menu.hidden?this.open():this.close());
  trigger.addEventListener('keydown',event=>{
   if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
    event.preventDefault();
    this.open();
    if(event.key==='Home')this.options[0].focus();
    if(event.key==='End')this.options.at(-1).focus();
   }
  });
  menu.addEventListener('click',event=>{
   const option=event.target.closest('[role=option]');
   if(option&&menu.contains(option))this.select(option);
  });
  menu.addEventListener('keydown',event=>{
   const index=this.options.indexOf(document.activeElement);
   if(event.key==='Escape'){
    event.preventDefault();this.close();trigger.focus();
   }else if(event.key==='ArrowDown'||event.key==='ArrowUp'){
    event.preventDefault();
    this.options[(index+this.options.length+(event.key==='ArrowDown'?1:-1))%this.options.length].focus();
   }else if(event.key==='Home'||event.key==='End'){
    event.preventDefault();this.options[event.key==='Home'?0:this.options.length-1].focus();
   }else if((event.key==='Enter'||event.key===' ')&&index>=0){
    event.preventDefault();this.select(this.options[index]);
   }
  });
  document.addEventListener('pointerdown',event=>{
   if(!this.root.contains(event.target))this.close();
  });
  document.addEventListener('focusin',event=>{
   if(!this.root.contains(event.target))this.close();
  });
 }
 open() {
  this.menu.hidden=false;
  this.trigger.setAttribute('aria-expanded','true');
  this.options.find(option=>option.dataset.value===this.trigger.value)?.focus();
 }
 close() {
  this.menu.hidden=true;
  this.trigger.setAttribute('aria-expanded','false');
 }
 select(option) {
  const changed=this.trigger.value!==option.dataset.value;
  this.trigger.value=option.dataset.value;
  this.trigger.querySelector('span').textContent=option.textContent;
  this.trigger.setAttribute('aria-label','日志级别：'+option.textContent);
  for(const item of this.options)item.setAttribute('aria-selected',String(item===option));
  this.close();
  this.trigger.focus();
  if(changed)this.trigger.dispatchEvent(new Event('change',{bubbles:true}));
 }
}
