import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';

export const defaults = {
  port: 3050, host: '127.0.0.1', apiBase: 'https://api.commandcode.ai',
  projectSlug: 'cc-proxy', logLevel: 'info', useProviderModels: true,
  emptySystemPlaceholder: true, apiKey: '', model: 'deepseek/deepseek-v4-flash',
  autoStart: true, launchAtLogin: false, closeToTray: true,
};

function validate(data) {
  if (!Number.isInteger(data.port) || data.port < 1024 || data.port > 65535)
    throw new Error('端口须为 1024–65535 的整数');
  if (data.host !== '127.0.0.1') throw new Error('桌面版仅监听本机 127.0.0.1');
  const url = new URL(data.apiBase);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('上游须为 HTTPS 地址');
  if (!['info','debug','warn','error'].includes(data.logLevel)) throw new Error('日志级别无效');
  if (data.apiKey && !/^user_[a-zA-Z0-9_-]+$/.test(data.apiKey)) throw new Error('API Key 须以 user_ 开头');
  for (const key of ['autoStart','launchAtLogin','closeToTray','useProviderModels','emptySystemPlaceholder'])
    if (typeof data[key] !== 'boolean') throw new Error(key + ' 必须为布尔值');
  if (typeof data.model !== 'string' || !data.model.trim()) throw new Error('请输入模型 ID');
}

export class ConfigStore {
  constructor({ userDataPath }) {
    this.filePath = path.join(userDataPath,'config.json');
    this.data = { ...defaults };
  }
  async load() {
    await mkdir(path.dirname(this.filePath), {recursive:true});
    try { this.data = {...defaults, ...JSON.parse(await readFile(this.filePath,'utf8'))}; }
    catch (error) { if (error.code !== 'ENOENT') throw new Error('配置文件无法读取，请保留文件并检查 JSON 格式'); }
    validate(this.data);
    return this.publicData();
  }
  publicData() {
    const {apiKey, ...rest} = this.data;
    return {...rest, hasApiKey: Boolean(apiKey)};
  }
  raw() { return {...this.data}; }
  async update(patch) {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('无效配置');
    for (const key of Object.keys(patch))
      if (!(key in defaults)) throw new Error('未知配置项：' + key);
    const next = {...this.data, ...patch};
    validate(next);
    await writeFile(this.filePath+'.tmp', JSON.stringify(next,null,2), 'utf8');
    await rename(this.filePath+'.tmp', this.filePath);
    this.data = next;
    return this.publicData();
  }
}
