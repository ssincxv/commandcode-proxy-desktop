// Loaded only by Playwright's smoke runner; excluded from packaged app files.
// Keep process lifecycle, settings, health and renderer interactions real.
export function installModelFixtures({ipcMain}) {
  const pending=new Set();
  for(const channel of ['models','speed-test','cancel-speed-test'])ipcMain.removeHandler(channel);
  ipcMain.handle('models',()=>[
    'deepseek/deepseek-v4-flash',
    ...Array.from({length:39},(_,i)=>`fixture/model-${String(i+1).padStart(2,'0')}`),
  ]);
  ipcMain.handle('speed-test',(_event,model)=>new Promise((resolve,reject)=>{
    const request={reject,timer:null};
    request.timer=setTimeout(()=>{
      pending.delete(request);
      resolve({model,tokens:100,tokensPerSecond:100,firstTextMs:100,totalMs:1100});
    },2000);
    pending.add(request);
  }));
  ipcMain.handle('cancel-speed-test',()=>{
    for(const request of pending){clearTimeout(request.timer);request.reject(new Error('已取消'));}
    pending.clear();
  });
}
