const {contextBridge,ipcRenderer}=require('electron');
const channels=['copy-model','speed-test','cancel-speed-test','state','save','start','stop','restart','models','test','health','copy-url','copy-key','reveal-key','import','docs','folder'];
const api={};
for(const channel of channels)api[channel]=async(...args)=>{try{return await ipcRenderer.invoke(channel,...args)}catch(error){throw new Error(error.message.replace(/^Error invoking remote method '[^']+': (?:Error: )?/,''))}};
contextBridge.exposeInMainWorld('commandcode',api);
