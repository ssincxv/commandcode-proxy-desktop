// Keep text nodes stable while the user selects or copies log output.
export class LogView {
  constructor(node) {
    this.node=node;this.pending='';this.dragging=false;
    node.addEventListener('pointerdown',()=>{this.dragging=true;});
    const release=()=>{this.dragging=false;this.flush();};
    document.addEventListener('pointerup',release);
    document.addEventListener('pointercancel',release);
    window.addEventListener('blur',release);
    document.addEventListener('selectionchange',()=>this.flush());
  }
  hasSelection() {
    const selection=window.getSelection();
    if(!selection || selection.isCollapsed)return false;
    for(let i=0;i<selection.rangeCount;i++)
      if(selection.getRangeAt(i).intersectsNode(this.node))return true;
    return false;
  }
  render(logs,level,force=false) {
    this.pending=logs.filter(x=>level==='all'||x.level===level)
      .map(x=>x.time+'  '+x.message).join('\n')||'暂无日志';
    if(force){this.dragging=false;this.commit();}
    else this.flush();
  }
  flush() {
    if(this.dragging || this.hasSelection())return;
    this.commit();
  }
  commit() {
    if(this.node.textContent===this.pending)return;
    const top=this.node.scrollTop;
    this.node.textContent=this.pending;
    this.node.scrollTop=top;
  }
}
