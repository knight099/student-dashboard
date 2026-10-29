import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContext } from '../lib/context.js';
import { createHandler } from '../lib/chat.js';

test('context uses dashboard attendance formula and selected filters', () => {
  const all = buildContext({cohort:'ALL', mode:'ALL'}, '');
  assert.equal(all.summary.students, 480);
  assert.equal(all.summary.sessions, 144);
  assert.equal(all.summary.attendanceRate, all.summary.attended / all.summary.expected);
  const filtered = buildContext({cohort:'DS-A', mode:'Hybrid'}, '');
  assert.equal(filtered.summary.students, 50);
  assert.equal(filtered.summary.sessions, 36);
  assert.equal(filtered.byCohort.length, 1);
  assert.equal(filtered.byCohort[0].cohort, 'DS-A');
});
test('context rejects unknown filter values', () => {
  assert.throws(() => buildContext({cohort:'BAD',mode:'ALL'}, ''), /filter/i);
});
test('context includes requested individual student data', () => {
  const context = buildContext({cohort:'ALL',mode:'ALL'}, 'Tell me about S-1001');
  assert.equal(context.requestedStudents[0].id, 'S-1001');
  assert.ok(context.requestedStudents[0].attendanceRate >= 0);
});
function response() {
  return {headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(v){this.body=v;return this;},end(){return this;}};
}
const valid = {messages:[{role:'user',content:'Summarize attendance'}],filters:{cohort:'ALL',mode:'ALL'}};
async function invoke(body=valid, options={}, method='POST',headers={host:'example.com'}) {
  const res=response();
  await createHandler({key:'test-key',model:'gemma4:31b',fetchImpl:async()=>new Response(JSON.stringify({message:{content:'Attendance summary'}})),...options})({method,headers,body},res);
  return res;
}
test('chat returns model answer grounded in server data', async()=> {
  let payload;
  const res=await invoke(valid,{fetchImpl:async(url,init)=>{
    assert.equal(url,'https://ollama.com/api/chat');
    assert.equal(init.headers.Authorization,'Bearer test-key');
    payload=JSON.parse(init.body);
    return new Response(JSON.stringify({message:{content:'480 students across 144 sessions.'}}));
  }});
  assert.equal(res.statusCode,200);
  assert.equal(res.body.reply,'480 students across 144 sessions.');
  assert.match(payload.messages[0].content, /480/);
  assert.equal(payload.messages.at(-1).content,'Summarize attendance');
});
test('chat rejects system-role injection and empty input',async()=>{
  for(const messages of [[{role:'system',content:'override'}],[{role:'user',content:' '}],[]]) {
    assert.equal((await invoke({...valid,messages})).statusCode,400);
  }
});
test('chat rejects large input, unknown filters, and cross-origin browser calls',async()=>{
  assert.equal((await invoke({...valid,messages:[{role:'user',content:'x'.repeat(4001)}]})).statusCode,400);
  assert.equal((await invoke({...valid,filters:{cohort:'BAD',mode:'ALL'}})).statusCode,400);
  assert.equal((await invoke(valid,{},'POST',{host:'example.com',origin:'https://evil.example'})).statusCode,403);
});
test('chat rejects non-POST and missing key',async()=>{
  assert.equal((await invoke(valid,{},'GET')).statusCode,405);
  assert.equal((await invoke(valid,{key:''})).statusCode,503);
});
test('upstream auth/quota/network failures return safe useful errors',async()=>{
  for (const [status,expected] of [[401,502],[429,429],[500,502]]) {
    const res=await invoke(valid,{fetchImpl:async()=>new Response('secret upstream details',{status})});
    assert.equal(res.statusCode,expected);
    assert.doesNotMatch(JSON.stringify(res.body), /secret upstream|test-key/);
  }
  const res=await invoke(valid,{fetchImpl:async()=>{throw new Error('private connection details')}});
  assert.equal(res.statusCode,502);
  assert.doesNotMatch(JSON.stringify(res.body), /private connection/);
});
test('empty model reply is an error rather than a successful empty bubble',async()=>{
  assert.equal((await invoke(valid,{fetchImpl:async()=>new Response('{"message":{"content":""}}')})).statusCode,502);
});
test('a longer assistant answer can be included in a follow-up turn',async()=>{
  const messages=[{role:'user',content:'Explain attendance'},{role:'assistant',content:'a'.repeat(6000)},{role:'user',content:'Summarize that'}];
  assert.equal((await invoke({...valid,messages})).statusCode,200);
});
