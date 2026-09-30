export function chineseError(error){
 const text=String(error?.message??error??'').replace(/^Error invoking remote method '[^']+': (?:Error: )?/,'').replace(/user_[a-zA-Z0-9_-]+/g,'[已隐藏密钥]');
 const code=String(error?.cause?.code??error?.code??'');
 const status=text.match(/(?:HTTP|status(?:Code)?["\s:=]*|状态码)\s*[:=]?\s*(\d{3})/i)?.[1];
 const statuses={'400':'请求参数不受支持，请检查模型和配置','401':'身份验证失败，请检查密钥及该模型的访问权限','402':'上游额度不足，请检查账户余额','403':'访问被拒绝，请检查账户权限','404':'模型或接口不存在，请刷新模型目录','408':'请求超时，请稍后重试','429':'请求过于频繁或额度受限，请稍后重试','500':'上游服务内部错误，请稍后重试','502':'上游网关异常，请稍后重试','503':'服务繁忙或并发已满，请稍后重试','504':'上游响应超时，请稍后重试'};
 if(status&&statuses[status])return statuses[status]+'（状态码 '+status+'）';
 if(/timeout|timed out/i.test(text)||error?.name==='TimeoutError')return '请求超时，请稍后重试或更换模型';
 if(/abort/i.test(text)||error?.name==='AbortError')return '请求已取消';
 if(/ECONNREFUSED/.test(text+code))return '无法连接服务，请检查本地代理是否已启动及接口地址';
 if(/fetch failed|ECONNRESET|ENOTFOUND|EAI_AGAIN|socket|network/i.test(text+code))return '网络连接失败，请检查代理状态、网络和上游服务';
 if(/EACCES|EPERM|permission denied/i.test(text+code))return '访问被拒绝，请检查文件或目录权限';
 if(/ENOENT/i.test(text+code))return '所需文件不存在，请重新安装或检查配置路径';
 if(/ENOSPC/i.test(text+code))return '磁盘空间不足，请清理空间后重试';
 if(/invalid url/i.test(text))return '接口地址格式无效，请检查配置';
 if(/JSON|unexpected token/i.test(text)&&!/[\u3400-\u9fff]/.test(text))return '数据格式无效，请检查配置文件或上游响应';
 if(/unauthorized|authentication|invalid.*key/i.test(text))return '身份验证失败，请检查密钥及账户权限';
 if(/rate.limit|too many requests/i.test(text))return '请求过于频繁或额度受限，请稍后重试';
 if(/model.*(?:not found|not supported|unavailable)/i.test(text))return '模型不存在或暂不可用，请刷新模型目录或更换模型';
 if(/[\u3400-\u9fff]/.test(text))return text;
 return '操作失败，请稍后重试；若持续发生，请检查代理配置和上游服务';
}
