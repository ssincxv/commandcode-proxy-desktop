export async function measureSpeed({port,apiKey,model,signal,fetchImpl=fetch}) {
 if(typeof model!=='string'||!model.trim()||model.length>256)throw new Error('请选择有效模型');
 if(!apiKey)throw new Error('请先保存 API Key');
 const start=performance.now();let first=null,firstText=null,tokens=null,finish=false,done=false,buffer='';
 const response=await fetchImpl(`http://127.0.0.1:${port}/v1/chat/completions`,{
  method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},signal,
  body:JSON.stringify({model,stream:true,max_tokens:2048,messages:[{role:'user',content:'Translate this text into Simplified Chinese. Output only the translation: Rain forms when water evaporates from oceans, lakes, and rivers. Warm air rises and cools, allowing water vapor to condense into tiny droplets around dust particles. These droplets gather into clouds. As more moisture collects, droplets collide and combine. When they become heavy enough, gravity pulls them toward the ground. Some rain returns to rivers and oceans, while some soaks into the soil and provides water for plants. This continuous movement of water supports life and helps regulate the climate.'}]})
 });
 if(!response.ok){await response.body?.cancel();throw new Error('速度测试失败：HTTP '+response.status)}
 const consume=line=>{
  if(!line.startsWith('data:'))return;
  const value=line.slice(5).trim();if(value==='[DONE]'){done=true;return}if(!value)return;
  const data=JSON.parse(value);if(data.error)throw new Error(data.error.message||'上游请求失败');
  const choice=data.choices?.[0],delta=choice?.delta;
  if(delta?.content||delta?.reasoning_content)first??=performance.now();
  if(delta?.content)firstText??=performance.now();
  if(choice?.finish_reason)finish=true;
  if(Number.isFinite(data.usage?.completion_tokens)&&data.usage.completion_tokens>0)tokens=data.usage.completion_tokens;
 };
 const reader=response.body.getReader(),decoder=new TextDecoder();
 try{while(true){const {value,done:end}=await reader.read();if(end)break;buffer+=decoder.decode(value,{stream:true});let index;while((index=buffer.indexOf('\n'))>=0){consume(buffer.slice(0,index).trimEnd());buffer=buffer.slice(index+1)}}buffer+=decoder.decode();if(buffer.trim())consume(buffer.trimEnd());}
 finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
 const end=performance.now();
 if(!done||!finish||firstText===null)throw new Error('上游响应不完整或没有正文，无法测速');
 return {model,tokens,tokensPerSecond:tokens&&first!==null&&end>first?tokens/((end-first)/1000):null,firstTextMs:firstText-start,totalMs:end-start};
}
