import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from './server.mjs';

// HTTP/security contract tests use a minimal store double; PostgreSQL persistence is tested separately.
function memoryStore() {
  const users = new Map(); const sessions = new Map();
  return {
    async register(body) { if (!body.email || !body.password) throw Object.assign(Error('Invalid input'), {statusCode:400,code:'VALIDATION_ERROR'}); const user = {id:'test-user',name:body.name,email:body.email,createdAt:new Date().toISOString()}; users.set(body.email,{user,password:body.password});return user; },
    async authenticate(body) { const item=users.get(body.email);return item?.password===body.password?item.user:null; },
    async createSession(userId) { const token='a'.repeat(43);const user=[...users.values()].find(item=>item.user.id===userId).user;const expiresAt=Date.now()+3600000;sessions.set(token,{user,expiresAt});return {token,expiresAt}; },
    async getSession(token) {return sessions.get(token)||null;},
    async deleteSession(token) {sessions.delete(token);},
  };
}

test('HTTP auth, CSRF, CORS, logout and authenticated demo routes', async t => {
  const {server}=createApp({store:memoryStore(),onError:error=>{throw error.error;}});
  server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const origin='http://localhost:3000';
  const request=(path,options={})=>fetch(base+path,options);
  assert.equal((await request('/api/auth/me')).status,401);
  assert.equal((await request('/api/dashboard/accounts')).status,401);
  assert.equal((await request('/api/auth/csrf',{headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal((await request('/api/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'})).status,403);
  const csrf=await request('/api/auth/csrf',{headers:{Origin:origin}});
  const {csrfToken}=await csrf.json();
  let cookie=csrf.headers.getSetCookie()[0].split(';')[0];
  const headers={Origin:origin,'Content-Type':'application/json','X-CSRF-Token':csrfToken};
  const register=await request('/api/auth/register',{method:'POST',headers:{...headers,Cookie:cookie},body:JSON.stringify({name:'Jamie Davis',email:'jamie@example.com',password:'long-test-password'})});
  assert.equal(register.status,201);
  assert.match(register.headers.getSetCookie()[0],/HttpOnly/);
  assert.match(register.headers.getSetCookie()[0],/SameSite=Lax/);
  cookie+='; '+register.headers.getSetCookie()[0].split(';')[0];
  assert.equal((await request('/api/auth/me',{headers:{Cookie:cookie}})).status,200);
  const accounts=await (await request('/api/dashboard/accounts',{headers:{Cookie:cookie}})).json();
  assert.equal(accounts.demo,true);assert.equal(accounts.items.length,2);
  const overview=await request('/api/dashboard/overview?range=1W',{headers:{Cookie:cookie}});
  assert.equal(overview.status,200);assert.equal((await overview.json()).demo,true);
  assert.equal((await request('/api/dashboard/overview?range=bad',{headers:{Cookie:cookie}})).status,400);
  assert.equal((await request('/api/dashboard/overview?accountId=unknown',{headers:{Cookie:cookie}})).status,404);
  const trades=await (await request('/api/dashboard/trades?query=BTC&side=Long&pageSize=1',{headers:{Cookie:cookie}})).json();
  assert.equal(trades.items.length,1);assert.equal(trades.items[0].side,'Long');
  assert.equal((await request('/api/dashboard/payouts',{headers:{Cookie:cookie}})).status,200);
  const validLogin=await request('/api/auth/login',{method:'POST',headers:{...headers,Cookie:cookie},body:JSON.stringify({email:'jamie@example.com',password:'long-test-password'})});
  assert.equal(validLogin.status,200);
  const badJson=await request('/api/auth/login',{method:'POST',headers:{...headers,Cookie:cookie},body:'{'});
  assert.equal(badJson.status,400);
  const nonJson=await request('/api/auth/login',{method:'POST',headers:{...headers,'Content-Type':'text/plain',Cookie:cookie},body:'hello'});
  assert.equal(nonJson.status,415);
  const logout=await request('/api/auth/logout',{method:'POST',headers:{...headers,Cookie:cookie}});
  assert.equal(logout.status,200);
  assert.equal((await request('/api/auth/me',{headers:{Cookie:cookie}})).status,401);
  const login=await request('/api/auth/login',{method:'POST',headers:{...headers,Cookie:cookie},body:JSON.stringify({email:'jamie@example.com',password:'wrong'})});
  assert.equal(login.status,401);assert.equal((await login.json()).error.code,'INVALID_CREDENTIALS');
});

test('auth endpoints rate-limit expensive authentication requests',async t=>{
  const {server}=createApp({store:memoryStore(),rateLimit:1});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const csrf=await fetch(base+'/api/auth/csrf');const {csrfToken}=await csrf.json();
  const headers={Origin:'http://localhost:3000','Content-Type':'application/json','X-CSRF-Token':csrfToken,Cookie:csrf.headers.getSetCookie()[0].split(';')[0]};
  const options={method:'POST',headers,body:JSON.stringify({email:'unknown@example.com',password:'wrong'})};
  assert.equal((await fetch(base+'/api/auth/login',options)).status,401);
  const limited=await fetch(base+'/api/auth/login',options);assert.equal(limited.status,429);assert.ok(limited.headers.get('Retry-After'));
});
