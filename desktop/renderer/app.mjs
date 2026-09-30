import { chineseError } from './errors.mjs';
import { ModelLibrary } from './model-library.mjs';
import { KeyField } from './key-field.mjs';
import { bindNavigation, notify, renderSnapshot } from './view.mjs';
const api=window.commandcode;
const keyField=new KeyField(document.getElementById('apiKey'),document.getElementById('key-visibility'),()=>api['reveal-key'](),error=>notify(chineseError(error),true));
let snapshot, busy=false;
bindNavigation();
async function refresh() {
 snapshot=await api.state();
 renderSnapshot(snapshot);
}
function notifyModel(message,error=false) {
 const node=document.getElementById("model-notice");
 node.hidden=false;node.textContent=message;node.classList.toggle("error",error);
}
const modelLibrary=new ModelLibrary(api,notifyModel);
async function act(fn,onError=error=>notify(chineseError(error),true)) {
 if(busy)return;
 busy=true;
 document.querySelectorAll('button').forEach(b=>b.disabled=true);
 try {await fn();await refresh();}
 catch(error){onError(error);}
 finally{busy=false;document.querySelectorAll('button').forEach(b=>b.disabled=false);}
}
function fillSettings(c) {
 for(const key of ['port','apiBase','model','logLevel'])document.getElementById(key).value=c[key];
 for(const key of ['autoStart','launchAtLogin','closeToTray'])document.getElementById(key).checked=c[key];
 keyField.reset(c.hasApiKey);

}
document.getElementById('toggle').onclick=()=>act(()=>api[snapshot.status.state==='running'?'stop':'start']());
document.getElementById('settings-form').onsubmit=event=>{
 event.preventDefault();act(async()=>{
 const patch={port:Number(document.getElementById('port').value)};
 for(const key of ['apiBase','model','logLevel'])patch[key]=document.getElementById(key).value.trim();
 for(const key of ['autoStart','launchAtLogin','closeToTray'])patch[key]=document.getElementById(key).checked;
 Object.assign(patch,keyField.patch());
 fillSettings(await api.save(patch));notify('设置已保存。');
 });
};
document.querySelectorAll('[data-action]').forEach(button=>button.onclick=()=>act(async()=>{
 const name=button.dataset.action;
 if(name==='models')notifyModel('正在读取模型…');
 else notify(name==='test'?'正在测试连接，请稍候…':'正在处理…');
 const result=await api[name]();
 if(name==='models'){
 modelLibrary.render(result);
 notifyModel('已读取 '+result.length+' 个模型。');
 }else if(name==='import'){if(result)fillSettings(result);notify(result?'已导入配置。':'已取消导入。');}
 else if(name==='test')notify(result);
 else if(name==='health')notify(result?'本地服务响应正常。':'本地服务未响应。',!result);
 else if(name.startsWith('copy-'))notify('已复制到剪贴板。');
 else notify('操作完成。');
},error=>button.dataset.action==='models'?notifyModel(chineseError(error),true):notify(chineseError(error),true)));
document.getElementById('log-filter').onchange=()=>renderSnapshot(snapshot,true);
try {await refresh();fillSettings(snapshot.config);setInterval(()=>{if(!busy)refresh().catch(()=>{});},1500);}
catch(error){notify('界面初始化失败：'+chineseError(error),true);}
