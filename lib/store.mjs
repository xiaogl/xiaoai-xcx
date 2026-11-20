import {randomUUID, randomInt} from 'node:crypto';
import {TradeError} from './trade.mjs';
import {defaults} from './store-defaults.mjs';

const check = (condition,message) => { if (!condition) throw new TradeError(message); };
const safeText = (v,max) => typeof v === 'string' && v.trim().length && v.length<=max && !/[<>\x00-\x1f]/.test(v);
const clock = (date,time) => Date.parse(date+'T'+time+':00+08:00');
const hoursLeft = a => (clock(a.date,a.time)-Date.now())/3600000;
export function initStore(state) {
  for(const [key,value] of Object.entries(defaults)) state.catalog[key] ??= structuredClone(value);
  state.appointments ??= [];
  state.waitlist ??= [];
  state.signups ??= [];
}
export function validateStaff(catalog) {
  if (!catalog.staff) return;
  check(Array.isArray(catalog.staff) && catalog.staff.every(w=>w && /^[\w-]+$/.test(w.id) && safeText(w.name,40) && safeText(w.title,100)), '技师姓名、职称或编号无效');
}
function storeById(c,id) {
  const store=c.stores.find(s=>s.id===id);
  check(store,'门店不存在');return store;
}
function selectStaff(state,a,exclude) {
  const c=state.catalog,store=storeById(c,a.storeId);
  check(store.linked && !store.soon && store.services.includes(a.serviceId),'门店暂未提供该服务');
  const stamp=clock(a.date,a.time);
  check(/^\d{4}-\d{2}-\d{2}$/.test(a.date) && c.TIMES.includes(a.time) && Number.isFinite(stamp) && stamp>Date.now()+3600000,'预约时间无效或已过预约截止时间');
  const day=new Date(a.date+'T12:00:00Z').getUTCDay();
  check(c.slotOverrides?.[a.storeId+'_'+a.date+'_'+a.time]!=='full','门店时段已约满');
  const duration=c.services.find(s=>s.id===a.serviceId)?.dur || 60;
  const candidates=c.staff.filter(w=>w.id!=='any' && w.enabled!==false && store.staff.includes(w.id) && (a.staffId==='any' || w.id===a.staffId) && (!w.shifts?.[day] || w.shifts[day].includes(a.time)));
  const available=candidates.find(w=>!state.appointments.some(row=>{
    if(row.id===exclude || row.status!=='booked' || row.staffId!==w.id || row.date!==a.date) return false;
    const start=clock(row.date,row.time);
    return stamp<start+(row.duration||60)*60000 && start<stamp+duration*60000;
  }));
  check(available,'技师已停用、未排班或已被预约，请重新选择');return available;
}
export function storeOperation(state,body) {
  const {action,storeId}=body,c=state.catalog;
  if(action==='signup' || action==='signupCancel') {
    const event=c.activities.find(e=>e.id===body.id);
    check(event,'活动不存在');
    const joined=state.signups.includes(event.id);
    if(action==='signup' && !joined) {
      check(!event.memberOnly || body.eligible,'请先满足活动会员条件');
      check(event.left>0,'活动名额已满');
      event.left--;state.signups.push(event.id);
    } else if(action==='signupCancel' && joined) {
      event.left=Math.min(event.quota,event.left+1);
      state.signups=state.signups.filter(id=>id!==event.id);
    }
    return {signups:state.signups,activities:c.activities};
  }
  if(action==='waitJoin') {
    const e=body.entry,store=storeById(c,e?.storeId);
    check(e && /^[\w-]{1,90}$/.test(e.id) && store.linked && store.services.includes(e.serviceId) && (e.staffId==='any'||store.staff.includes(e.staffId)) && c.TIMES.includes(e.time) && hoursLeft(e)>1,'候补资料或时段无效');
    const same=state.waitlist.filter(w=>w.storeId===e.storeId && w.serviceId===e.serviceId && w.date===e.date && w.time===e.time && w.staffId===e.staffId);
    if(!same.length) state.waitlist.unshift({id:e.id,storeId:store.id,serviceId:e.serviceId,staffId:e.staffId,date:e.date,time:e.time,rank:1,status:'waiting'});
    return {waitlist:state.waitlist};
  }
  if(action==='waitCancel' || action==='waitOffer') {
    const row=state.waitlist.find(w=>w.id===body.id);
    check(row && (!storeId || row.storeId===storeId),'候补记录不存在');
    if(action==='waitOffer') {
      selectStaff(state,row);row.status='offered';
    } else state.waitlist=state.waitlist.filter(w=>w!==row);
    return {waitlist:state.waitlist};
  }
  if(action==='list' || action==='staffSave') {
    const store=storeById(c,storeId);
    if(action==='staffSave') {
      const input=body.staff;
      check(store.linked && input && safeText(input.name,40) && safeText(input.title,100),'请填写技师姓名与职称');
      let worker;
      if(input.id) {
        worker=c.staff.find(w=>w.id===input.id);
        check(worker && worker.id!=='any' && store.staff.includes(worker.id),'该技师不属于当前门店');
      } else {
        worker={id:'w'+randomUUID()};c.staff.push(worker);(store.staff ||= []).push(worker.id);
      }
      if(input.shifts!=null) {
        check(typeof input.shifts==='object' && !Array.isArray(input.shifts) && Object.entries(input.shifts).every(([day,times])=>/^[0-6]$/.test(day) && Array.isArray(times) && times.every(t=>c.TIMES.includes(t))),'排班包含无效时段');
      }
      Object.assign(worker,{name:input.name.trim(),title:input.title.trim(),enabled:input.enabled!==false,shifts:input.shifts||{}});
    }
    return {store,activities:c.activities.filter(e=>e.store===storeId),waitlist:state.waitlist.filter(w=>w.storeId===storeId),staff:c.staff.filter(w=>w.id!=='any' && store.staff?.includes(w.id)),services:c.services.filter(s=>store.services?.includes(s.id)),appointments:state.appointments.filter(a=>a.storeId===storeId),TIMES:c.TIMES};
  }
  if(action==='book') {
    const a=body.appointment;
    check(a && typeof a.id==='string' && /^[\w-]{1,90}$/.test(a.id),'预约编号无效');
    const existing=state.appointments.find(v=>v.id===a.id);
    if(existing) {
      check(existing.storeId===a.storeId && existing.serviceId===a.serviceId && existing.date===a.date && existing.time===a.time,'预约编号已存在'); return {appointment:existing};
    }
    const worker=selectStaff(state,a),store=storeById(c,a.storeId),service=c.services.find(s=>s.id===a.serviceId);
    check(service,'服务不存在');
    const coupon=a.gp && c.groupons.find(g=>g.code===a.gp.code);
    if(a.gp) check(coupon && !state.redeemedGroupons?.[coupon.code] && coupon.brand===store.brand && coupon.service===service.id && store.groupon.includes(coupon.channel) && !state.appointments.some(r=>r.gp?.code===coupon.code && ['done','booked'].includes(r.status)),'团购券不可用');
    const record={id:a.id,shared:true,storeId:store.id,serviceId:service.id,staffId:worker.id,staffName:worker.name,serviceName:service.name,duration:service.dur,date:a.date,time:a.time,status:'booked',price:coupon?coupon.amount:service.mprice,deposit:coupon?0:service.deposit,gp:coupon||null,code:String(randomInt(100000,1000000)),reschedule:0,at:new Date().toISOString()};
    if(body.waitId) {
      const w=state.waitlist.find(w=>w.id===body.waitId);
      check(w && w.status==='offered' && w.storeId===store.id && w.serviceId===service.id && w.date===record.date && w.time===record.time,'候补信息已更新');
      state.waitlist=state.waitlist.filter(v=>v!==w);
    }
    state.appointments.unshift(record);return {appointment:record,waitlist:state.waitlist};
  }
  const a=state.appointments.find(v=>v.id===body.id);
  check(a && (!storeId || a.storeId===storeId),'预约不存在或不属于当前门店');
  check(a.status==='booked','该预约已处理，请刷新查看');
  if(action==='verify') {
    check(storeId===a.storeId && (!body.code || body.code===a.code),'门店或核销码错误');
    a.status='done';a.doneAt=new Date().toISOString();
    (c.financeLedger ||= []).unshift({id:'FIN'+randomUUID(),type:'门店核销',channel:a.gp?.channel || '到店服务',ref:a.id,amount:a.price,fee:0,net:a.price,status:'已核销',at:a.doneAt});
  } else if(action==='cancel') {
    a.status='cancelled';a.refund=hoursLeft(a)>=4?a.deposit:Math.round(a.deposit*50)/100;
  } else if(action==='reschedule') {
    check(a.reschedule<1 && hoursLeft(a)>=2,'已超过自助改期次数或截止时间');
    const next={...a,date:body.date,time:body.time};selectStaff(state,next,a.id);
    a.date=next.date;a.time=next.time;a.reschedule++;
  } else if(action==='noshow') {
    check(hoursLeft(a)<=0,'尚未到预约时间');a.status='noshow';
  } else throw new TradeError('未知门店操作');
  return {appointment:a};
}
