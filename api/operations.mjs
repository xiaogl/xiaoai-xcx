import { get, head, put, BlobNotFoundError, BlobPreconditionFailedError } from '@vercel/blob';
import { randomUUID } from 'node:crypto';
import '../js/product-seed.js';
import pricing from '../js/product-pricing.js';
import { initStock, trade, TradeError } from '../lib/trade.mjs';

import {initStore,storeOperation,validateStaff} from '../lib/store.mjs';

import {customerCheckout} from '../lib/checkout.mjs';
import {startSession,currentMember,requireMember,attachAppointment} from '../lib/members.mjs';
import {deskOperation} from '../lib/desk.mjs';

function empty() {
  const products=structuredClone(globalThis.XA_PRODUCT_SEED);
  initStock(products);
  return {revision:0,catalog:{products},applications:{},orders:[]};
}
function publicCatalog(catalog) {
  const output = {};
  for (const key of ['brands','products','courses','stores','services','shopCategories','staff','TIMES','slotOverrides','articles','videos','topics','notes','creators','activities','hotKeywords','homeResources','plus','groupons']) {
    if (catalog[key]) output[key] = catalog[key];
  }
  if (output.products) output.products = output.products.filter(p => !p.offShelf);
  for (const key of ['articles','notes']) {
    if (output[key]) output[key] = output[key].filter(row => row.published !== false).map(({workingCopy, ...live}) => live);
  }
  if (output.courses) output.courses = output.courses.filter(c => c.published !== false);
  if (output.stores) output.stores = output.stores.map(({manager, auditNotes, ...store}) => store);
  return output;
}
const clean = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max && !/[<>&"'\\`\x00-\x1f]/.test(v);
export default async function handler(req,res) {
  res.setHeader('Cache-Control','private, no-store');
  const mode = req.query.mode;
  if (mode === 'login') return res.redirect(302,'/admin');
  const existing = /(?:^|; )xa_demo=([a-f0-9-]{36})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
  const valid = value => typeof value === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value);
  const join = req.query.demo;
  if (join && !valid(join)) return res.status(400).end();
  const space = valid(join) ? join : valid(existing) ? existing : randomUUID();
  if (space !== existing) res.setHeader('Set-Cookie','xa_demo='+space+'; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000');
  const path = 'demo/v2/'+space+'.json';
  if (req.method !== 'GET' && (!req.headers['content-type']?.startsWith('application/json') || req.headers['sec-fetch-site'] === 'cross-site')) return res.status(403).end();
  try {
    if (mode === 'mediaVideo' && req.method === 'GET') {
      const {key,type} = req.query, size = Number(req.query.size);
      if (!valid(key) || !['video/mp4','video/webm','video/quicktime'].includes(type) || !Number.isSafeInteger(size) || size<=0 || size>64*1048576) return res.status(400).end();
      const requested = req.headers.range;
      const match = /^bytes=(\d+)-(\d*)$/.exec(requested || '');
      const start = match ? Number(match[1]) : 0;
      const end = match && match[2] ? Math.min(Number(match[2]),size-1) : size-1;
      if ((requested && !match) || start>end || start>=size) {
        res.setHeader('Content-Range','bytes */'+size);
        return res.status(416).end();
      }
      res.setHeader('X-Content-Type-Options','nosniff');
      res.setHeader('Accept-Ranges','bytes');
      res.setHeader('Content-Type',type);
      res.setHeader('Content-Length',end-start+1);
      if (match) { res.status(206); res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`); }
      for (let i=Math.floor(start/1048576); i<=Math.floor(end/1048576); i++) {
        const item=await get('demo/media/'+space+'/'+key+'-'+i+'.json',{access:'private'});
        if (!item) { if(res.headersSent) return res.destroy();res.removeHeader('Content-Length');return res.status(404).end(); }
        const {data}=await new Response(item.stream).json();
        const chunk=Buffer.from(data,'base64');
        res.write(chunk.subarray(Math.max(0,start-i*1048576),Math.min(chunk.length,end-i*1048576+1)));
      }
      return res.end();
    }
    if (mode === 'mediaPart') {
      const {key,part} = req.query;
      if (!valid(key) || !/^(?:0|[1-9]\d?)$/.test(part) || Number(part) >= 64) return res.status(400).end();
      const location = 'demo/media/'+space+'/'+key+'-'+part+'.json';
      if (req.method === 'POST') {
        const data = req.body?.data;
        if (typeof data !== 'string' || !data.length || data.length > 1398104 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return res.status(400).end();
        if (Buffer.from(data,'base64').length > 1048576) return res.status(413).end();
        await put(location,JSON.stringify({data}),{access:'private',addRandomSuffix:false,contentType:'application/json'});
        return res.json({ok:true});
      }
      if (req.method !== 'GET') return res.status(405).end();
      const item = await get(location,{access:'private'});
      if (!item) return res.status(404).end();
      res.setHeader('Cache-Control','private, max-age=2592000, immutable');
      return res.json(await new Response(item.stream).json());
    }
    // Capture the write precondition before reading the content. A later
    // concurrent write then invalidates our commit, even if the read raced.
    const writing = (mode==='memberSession'&&req.method==='POST') || (['desk','customerCheckout'].includes(mode) && req.method==='POST' && !['read','voucherLookup'].includes(req.body?.action)) || req.method === 'PUT' || (['apply','trade'].includes(mode) || (mode==='store' && req.body?.action!=='list'));
    let etag;
    if (writing) {
      try { etag = (await head(path)).etag; }
      catch (e) { if (!(e instanceof BlobNotFoundError)) throw e; }
    }
    const file = await get(path,{access:'private',useCache:false});
    const state = file ? await new Response(file.stream).json() : empty();
    initStore(state);
    if (req.method === 'GET' && mode === 'admin') {const {desks,members,memberSessions,...admin}=state;return res.json({...admin,space});}
    if (req.method === 'GET' && mode === 'catalog') {
      const member=currentMember(state,req.headers['x-xa-member']);
      return res.json({...publicCatalog(state.catalog),demoOrders:state.orders,appointments:state.appointments.filter(a=>member&&a.memberId===member.id),signups:state.signups,waitlist:state.waitlist,space});
    }
    const body = req.body || {};
    if (req.method === 'POST' && mode === 'receipt') {
      const item = Object.values(state.applications).find(a => a.receipt && a.receipt === body.receipt);
      return item ? res.json({status:item.status, note:item.auditNotes,storeId:item.storeId}) : res.status(404).end();
    }
    let reply = {};
    if(req.method==='POST' && mode==='memberSession'){
      reply=startSession(state);
    } else if(req.method==='POST' && mode==='customerCheckout'){
      reply=customerCheckout(state,body,requireMember(state,req.headers['x-xa-member']));if(body.action==='read')return res.json(reply);
    } else if (req.method === 'POST' && mode === 'desk') {
      reply=deskOperation(state,body);
      if(['read','voucherLookup'].includes(body.action))return res.json({...reply,revision:state.revision});
    } else if (req.method === 'POST' && mode === 'store') {
      const member=currentMember(state,req.headers['x-xa-member']);
      if(body.action==='book'&&!member)requireMember(state,null);
      const prior=state.appointments.find(a=>a.id===(body.id||body.appointment?.id));
      if(prior?.memberId&&['book','cancel','reschedule'].includes(body.action)&&prior.memberId!==member?.id)throw new TradeError('预约不属于当前会员');
      reply=storeOperation(state,body);
      if(body.action==='book')attachAppointment(state,reply.appointment,member);
      if(body.action==='list') return res.json({...reply,revision:state.revision});
    } else if (req.method === 'POST' && mode === 'trade') {
      reply.order = trade(state,body);
    } else if (req.method === 'PUT' && mode === 'admin') {
      if (body.revision !== state.revision) return res.status(409).json({error:'revision'});
      if (!body.catalog || !body.applications) return res.status(400).end();
      validateStaff(body.catalog);
      if (body.catalog.products && (!Array.isArray(body.catalog.products) || !body.catalog.products.every(p=>p && pricing.valid(p,(p.skus || []).map(s=>s.delta))))) {
        return res.status(400).json({error:'商品或规格价格配置无效'});
      }
      state.catalog = body.catalog;
      state.applications = body.applications;
    } else if (req.method === 'POST' && mode === 'apply') {
      const {type,store,address,city,district,contact,phone,storeId,receipt} = body;
      if (!['new','claim'].includes(type) || !clean(store,60) || !clean(address,120) || !clean(contact,32) || !/^1\d{10}$/.test(phone) || !clean(city,30) || !clean(district,30) || (type==='claim' && !/^[\w-]{1,80}$/.test(storeId))) return res.status(400).end();
      const key = type==='claim' ? 'claim:'+storeId : 'new:'+store+':'+address;
      const old = state.applications[key];
      if (old && (old.status!=='rejected' || !receipt || old.receipt!==receipt)) return res.status(409).end();
      const ticket = randomUUID();
      state.applications[key] = {type,store,address,city,district,contact,phone,storeId:type==='claim'?storeId:null,receipt:ticket,status:'pending',submittedAt:new Date().toISOString()};
      reply = {receipt:ticket};
    } else return res.status(405).end();
    state.revision++;
    await put(path,JSON.stringify(state),{access:'private',addRandomSuffix:false,allowOverwrite:!!etag,ifMatch:etag,contentType:'application/json'});
    return res.json({...reply,revision:state.revision});
  } catch(error) {
    if (res.headersSent) return res.destroy();
    if (error instanceof TradeError) return res.status(422).json({error:error.message});
    if (error instanceof BlobPreconditionFailedError) return res.status(409).json({error:'concurrent-write'});
    console.error('operations storage', error.name);
    return res.status(503).json({error:'业务存储暂不可用'});
  }
}
