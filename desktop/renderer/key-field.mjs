export class KeyField {
  constructor(input, button, reveal, onError) {
    Object.assign(this,{input,button,reveal,onError});
    this.revision=0;
    input.addEventListener('input',()=>{this.dirty=true;this.revision++;});
    input.addEventListener('focus',()=>{if(!this.dirty && this.hasKey && input.type==='password')input.select();});
    button.addEventListener('click',()=>this.toggle());
    this.reset(false);
  }
  reset(hasKey) {
    this.revision++;this.hasKey=hasKey;this.dirty=false;
    this.input.value=hasKey?'•'.repeat(32):'';
    this.hide();
  }
  hide() {
    this.input.type='password';
    this.button.setAttribute('aria-pressed','false');
    this.button.setAttribute('aria-label','显示 API Key');
  }
  patch() { return this.dirty?{apiKey:this.input.value.trim()}:{}; }
  async toggle() {
    if(this.input.type==='text') {
      if(!this.dirty)this.input.value=this.hasKey?'•'.repeat(32):'';
      this.hide();return;
    }
    const revision=this.revision;
    this.button.disabled=true;
    try {
      if(!this.dirty && this.hasKey) {
        const key=await this.reveal();
        if(revision!==this.revision)return;
        this.input.value=key;
      }
      this.input.type='text';
      this.button.setAttribute('aria-pressed','true');
      this.button.setAttribute('aria-label','隐藏 API Key');
    } catch(error){this.onError(error);}
    finally{this.button.disabled=false;}
  }
}
