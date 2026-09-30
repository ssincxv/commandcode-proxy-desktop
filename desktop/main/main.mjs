import { chineseError } from '../renderer/errors.mjs';
import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, clipboard, shell, dialog } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import { ConfigStore } from './config-store.mjs';
import { Service, redact } from './service.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const page=path.join(here,'../renderer/index.html');
let win,tray,store,service,quitting=false;
if(process.env.CC_DESKTOP_TEST_DATA) app.setPath('userData',process.env.CC_DESKTOP_TEST_DATA);
if(!app.requestSingleInstanceLock())app.quit();
else {
 app.on('second-instance',()=>{win?.show();win?.focus();});
 app.whenReady().then(boot).catch(error=>{dialog.showErrorBox('启动失败',chineseError(error));quitting=true;app.quit();});
}
function handle(name,fn) {
 ipcMain.handle(name,async(event,...args)=>{
   if(event.sender!==win.webContents || event.senderFrame!==win.webContents.mainFrame)
     throw new Error('无效调用来源');
   try{return await fn(...args);}catch(error){throw new Error(chineseError(error));}
 });
}
async function boot() {
 store=new ConfigStore({userDataPath:app.getPath('userData')});
 await store.load();
 service=new Service({store,userData:app.getPath('userData'),
   entry:app.isPackaged?path.join(process.resourcesPath,'proxy/proxy.mjs'):path.join(root,'proxy.mjs'),
   executable:process.execPath});
 handle('state',()=>({...service.snapshot(),config:store.publicData(),version:app.getVersion()}));
 handle('reveal-key',()=>store.raw().apiKey);
 handle('save',async patch=>{
   const config=await store.update(patch);
   if(app.isPackaged&&!process.env.CC_DESKTOP_TEST_DATA)app.setLoginItemSettings({openAtLogin:config.launchAtLogin,args:['--hidden']});
   if(service.manager?.state==='running')await service.run('restart');
   return config;
 });
 handle('start',()=>service.run('start'));handle('stop',()=>service.run('stop'));
 handle('restart',()=>service.run('restart'));handle('models',()=>service.models());
 handle('speed-test',model=>service.speedTest(model));handle('cancel-speed-test',()=>service.cancelSpeedTest());
 handle('test',()=>service.testConnection());handle('health',()=>service.health());
 handle('copy-model',model=>{if(typeof model!=='string'||!model.trim()||model.length>256)throw new Error('无效模型名称');return clipboard.writeText(model);});
 handle('copy-url',()=>clipboard.writeText('http://127.0.0.1:'+store.raw().port+'/v1/chat/completions'));
 handle('copy-key',()=>{if(!store.raw().apiKey)throw new Error('尚未配置密钥');return clipboard.writeText(store.raw().apiKey);});
 handle('import',async()=>{
   const result=await dialog.showOpenDialog(win,{title:'导入原代理的 config.json',properties:['openFile'],filters:[{name:'JSON 配置',extensions:['json']}]});
   if(result.canceled)return null;
   const source=JSON.parse((await readFile(result.filePaths[0],'utf8')).replace(/^\uFEFF/,''));
   const patch={};
   for(const key of ['port','apiBase','projectSlug','logLevel','useProviderModels','emptySystemPlaceholder','apiKey'])
     if(key in source)patch[key]=source[key];
   await store.update(patch);
   if(service.manager?.state==='running')await service.run('restart');
   return store.publicData();
 });
 handle('docs',()=>shell.openExternal('https://github.com/MAXeaglet/commandcode-proxy'));
 handle('folder',()=>shell.openPath(app.getPath('userData')));
 Menu.setApplicationMenu(null);
 win=new BrowserWindow({width:1120,height:780,minWidth:860,minHeight:640,title:'CommandCode Proxy',
   backgroundColor:'#f6f7f9',show:false,
   webPreferences:{preload:path.join(here,'../preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',event=>event.preventDefault());
 win.webContents.session.setPermissionRequestHandler((_w,_p,callback)=>callback(false));
 win.on('close',event=>{
   if(!quitting && tray && store.raw().closeToTray){event.preventDefault();win.hide();}
   else if(!quitting){event.preventDefault();app.quit();}
 });
 const icon=nativeImage.createFromPath(path.join(here,'../assets/icon.png'));
 if(!icon.isEmpty()) {
   tray=new Tray(icon);tray.setToolTip('CommandCode Proxy');
   tray.setContextMenu(Menu.buildFromTemplate([{label:'打开控制台',click:()=>win.show()},{type:'separator'},{label:'退出',click:()=>app.quit()}]));
   tray.on('double-click',()=>win.show());
   win.setIcon(icon);
 }
 const pageLoad=win.loadFile(page);
 if(!process.argv.includes('--hidden'))win.show();
 await pageLoad;
 setImmediate(async()=>{
   if(store.raw().autoStart)try{await service.run('start');}catch(error){service.log({level:'error',message:error.message});}
 });
}
app.on('before-quit',event=>{
 if(quitting)return;
 event.preventDefault();quitting=true;
 (async()=>{await service?.queue;await service?.stop();})().finally(()=>app.quit());
});
app.on('window-all-closed',()=>{if(!tray)app.quit();});
