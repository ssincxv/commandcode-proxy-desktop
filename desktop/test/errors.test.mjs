import test from 'node:test';
import assert from 'node:assert/strict';
import {chineseError} from '../renderer/errors.mjs';
test('localizes timeout, IPC, HTTP, system and unknown errors',()=>{
 assert.match(chineseError(new Error('The operation was aborted due to timeout')),/超时/);
 assert.match(chineseError("Error invoking remote method 'speed-test': Error: HTTP 401"),/身份验证失败/);
 assert.match(chineseError(new TypeError('fetch failed',{cause:{code:'ECONNREFUSED'}})),/代理是否已启动/);
 assert.match(chineseError('HTTP 503'),/繁忙/);
 assert.match(chineseError('unexpected provider failure'),/操作失败/);
 assert.equal(chineseError('请先启动代理'),'请先启动代理');
 assert.ok(!chineseError('无效密钥 user_secret').includes('user_secret'));
});
