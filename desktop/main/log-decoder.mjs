import { StringDecoder } from 'node:string_decoder';

// stdout chunks are transport fragments, not individual log records.
export class LogDecoder {
  constructor(fallback, emit) {
    this.decoder=new StringDecoder('utf8');
    this.pending='';this.fallback=fallback;this.emit=emit;
  }
  write(chunk) {
    this.pending+=this.decoder.write(chunk);
    this.drain();
  }
  drain() {
    let index;
    while((index=this.pending.indexOf('\n'))>=0) {
      const line=this.pending.slice(0,index).replace(/\r$/,'');
      this.pending=this.pending.slice(index+1);
      this.line(line);
    }
    // Bound unterminated output without splitting UTF-8 bytes.
    if(this.pending.length>16384) {
      this.line(this.pending.slice(0,16384));
      this.pending=this.pending.slice(16384);
    }
  }
  line(message) {
    if(!message.trim())return;
    const level=message.match(/^(?:\[[^\]]+\]\s*)?\[(debug|info|warn|error)\]/i)?.[1].toLowerCase()||this.fallback;
    this.emit({level,message});
  }
  end() {
    this.pending+=this.decoder.end();this.drain();
    this.line(this.pending);this.pending='';
  }
}
