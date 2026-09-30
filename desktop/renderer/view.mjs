import { LogView } from './log-view.mjs';
const logView=new LogView(document.getElementById('logs'));
export function bindNavigation() {
 document.querySelectorAll('[data-page]').forEach(button=>button.onclick=()=>{
   document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('selected',b===button));
   document.querySelectorAll('[data-view]').forEach(view=>view.hidden=view.dataset.view!==button.dataset.page);
 });
}
export function notify(message,error=false) {
 const node=document.getElementById('notice');node.hidden=false;node.textContent=message;node.classList.toggle('error',error);
}
export function renderSnapshot({status,config,logs,version},forceLogs=false) {
 const online=status.state==='running';
 const labels={running:'代理已启用',stopped:'代理已停止',starting:'正在启动',stopping:'正在停止',error:'代理启动失败'};
 const label=labels[status.state]||status.state;
 document.getElementById('hero-status').textContent=label;
 document.getElementById('sidebar-state').textContent=label;
 document.getElementById('sidebar-status').classList.toggle('online',online);
 if(status.error) notify(status.error,true);
 document.getElementById('toggle').setAttribute('aria-checked',String(online));
 document.getElementById('endpoint').textContent='127.0.0.1:'+config.port;
 document.getElementById('upstream').textContent=new URL(config.apiBase).host;
 document.getElementById('current-model').textContent=config.model;
 document.getElementById('version').textContent='Desktop '+version+' · Windows';
 const level=document.getElementById('log-filter').value;
 logView.render(logs,level,forceLogs);
}
