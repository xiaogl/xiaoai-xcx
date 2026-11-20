import {randomUUID,createHash} from 'node:crypto';
import {memberForPhone,attachAppointment,ensureShop} from './members.mjs';
import {deskCheckout} from './checkout.mjs';
import {TradeError} from './trade.mjs';
import {storeOperation} from './store.mjs';

const requireValue=(ok,message)=>{if(!ok) throw new TradeError(message)};
const digest=value=>createHash('sha256').update(String(value)).digest('hex');
const text=(value,max=120)=>String(value??'').trim().slice(0,max);
function positive(value,integer=false){
  const n=Number(value);
  requireValue(Number.isFinite(n)&&n>0&&n<=1000000&&(!integer||Number.isInteger(n)),'数量或金额无效');
  return n;
}
const cents=value=>Math.round(positive(value)*100);
const roles={owner:['*'],desk:['customer','visit','finish','pay','card','issue','follow','verify','cancelVisit','reserve','handover','voucherLookup','voucherRedeem','recharge','scan','cashRecharge'],worker:['finish']};
export function deskOperation(state,b){
  const store=state.catalog.stores.find(s=>s.id===b.storeId&&s.linked);
  requireValue(store,'门店不存在');
  const staff=state.catalog.staff.filter(w=>store.staff?.includes(w.id));
  const services=state.catalog.services.filter(s=>store.services?.includes(s.id));
  const db=state.desks??={};
  let d=db[store.id];
  if(b.action==='open'&&!d?.keys.length){
    requireValue(/^[a-f0-9-]{36}$/.test(b.token||''),'工作台凭证无效');
    d=ensureShop(state,store.id);
    d.keys.push({hash:digest(b.token),role:'owner'});
    for(const a of state.appointments.filter(a=>a.storeId===store.id&&a.memberId))attachAppointment(state,a,state.members?.find(m=>m.id===a.memberId));
  }
  const actor=d?.keys.find(k=>k.hash===digest(b.token));
  requireValue(actor,'请使用老板签发的本店工作台入口');
  const {role,worker}=actor;
  requireValue(role!=='worker'||staff.some(w=>w.id===worker&&w.enabled!==false),'该员工已停用');
  const view=()=>{
    const visits=role==='worker'?d.visits.filter(v=>v.staff===worker):d.visits;
    const appointments=state.appointments.filter(a=>a.storeId===store.id&&(role!=='worker'||a.staffId===worker)).map(a=>({...a,customer:d.reservations?.[a.id]}));
    const common={role,worker,store:store.name,staff:role==='worker'?staff.filter(w=>w.id===worker):staff,services,times:state.catalog.TIMES,rooms:d.rooms,visits,appointments,rate:d.rate};
    if(role==='worker')return {...common,customers:d.customers.filter(c=>visits.some(v=>v.customer===c.id)).map(({id,name,preference})=>({id,name,preference}))};
    return {...common,customers:d.customers,cards:d.cards,campaigns:d.campaigns,coupons:d.coupons,entries:role==='owner'?d.entries:d.entries.filter(e=>e.type!=='支出'),stock:d.stock,recharges:d.recharges||[],handovers:d.handovers||[],log:role==='owner'?d.log:[],grants:role==='owner'?d.keys.filter(k=>k.id).map(({id,role,worker})=>({id,role,worker})):[]};
  };
  if(['open','read'].includes(b.action))return view();
  requireValue(role==='owner'||roles[role]?.includes(b.action),'当前角色没有此操作权限');
  function voucher(){
    const code=text(b.code).toUpperCase();
    const g=state.catalog.groupons.find(g=>g.code===code);
    requireValue(g,'未找到团购券，请核对券码');
    requireValue(g.brand===store.brand&&store.groupon?.includes(g.channel)&&store.services?.includes(g.service),'该券不适用于本店');
    const appointment=state.appointments.find(a=>a.gp?.code===code&&['booked','done'].includes(a.status));
    requireValue(!state.redeemedGroupons?.[code]&&appointment?.status!=='done','该券已经核销');
    requireValue(!appointment||appointment.storeId===store.id,'该券已用于其他门店预约');
    return {code,channel:g.channel,title:g.title,amount:g.amount,appointment:appointment?.id};
  }
  if(b.action==='voucherLookup')return voucher();
  requireValue(/^[a-f0-9-]{36}$/.test(b.request||''),'请求编号无效');
  if(d.receipts[b.request])return view();
  const id=randomUUID(),at=new Date().toISOString();
  const need=(arr,key,label)=>{const row=arr.find(x=>x.id===key);requireValue(row,label+'不存在');return row};
  const name=value=>{const n=text(value,60);requireValue(n,'请填写名称');return n};
  const ledger=(type,amount,note,extra={})=>d.entries.unshift({id,at,type,amount,note,...extra});
  if(['recharge','scan','cashRecharge'].includes(b.action)){deskCheckout(d,b);}
  else if(b.action==='voucherRedeem'){
    const g=voucher();
    if(g.appointment)storeOperation(state,{action:'verify',storeId:store.id,id:g.appointment});
    else (state.catalog.financeLedger??=[]).unshift({id:'FIN'+id,type:'门店核销',channel:g.channel,ref:g.code,amount:g.amount,fee:0,net:g.amount,status:'已核销',at,storeId:store.id});
    (state.redeemedGroupons??={})[g.code]={storeId:store.id,at,id};
  }else if(b.action==='grant'){
    requireValue(['desk','worker','owner'].includes(b.role)&&/^[a-f0-9-]{36}$/.test(b.newToken),'权限参数无效');
    if(b.role==='worker')need(staff,b.worker,'员工');
    d.keys.push({id,hash:digest(b.newToken),role:b.role,worker:b.role==='worker'?b.worker:undefined});
  }else if(b.action==='revoke'){
    const key=need(d.keys,b.id,'授权');requireValue(key!==actor,'无法撤销当前入口');d.keys=d.keys.filter(k=>k!==key);
  }else if(b.action==='service'){
    const title=name(b.name),price=cents(b.amount)/100,dur=positive(b.count,true);
    requireValue(!services.some(s=>s.name===title)&&dur<=480,'项目重名或服务时长超限');
    const service={id:'svc'+id,name:title,dur,price,mprice:price,deposit:0,desc:text(b.note),art:['bed','sage']};
    state.catalog.services.push(service);store.services.push(service.id);services.push(service);
  }else if(b.action==='reserve'){
    const c=need(d.customers,b.customer,'客户');
    const result=storeOperation(state,{action:'book',appointment:{id:'YY'+id,storeId:store.id,serviceId:b.service,staffId:b.staff,date:b.date,time:b.time}});
    result.appointment.deposit=0;
    c.memberId??=memberForPhone(state,c.phone,c.name).id;
    attachAppointment(state,result.appointment,state.members.find(m=>m.id===c.memberId));
  }else if(b.action==='customer'){
    const phone=text(b.phone);requireValue(/^1\d{10}$/.test(phone)&&!d.customers.some(c=>c.phone===phone&&c.id!==b.id),'手机号无效或已建档');
    const c=b.id?need(d.customers,b.id,'客户'):{id,at};
    c.memberId??=memberForPhone(state,c.phone||phone,c.name||name(b.name)).id;
    requireValue(!d.customers.some(other=>other!==c&&other.memberId===c.memberId),'该会员在本店已有档案');
    Object.assign(c,{name:name(b.name),phone,preference:text(b.preference),tag:text(b.tag),follow:text(b.follow,10)});
    if(!b.id)d.customers.unshift(c);
  }else if(b.action==='follow'){
    const c=need(d.customers,b.id,'客户');(c.notes??=[]).unshift({at,note:name(b.note)});c.follow=text(b.follow,10);
  }else if(b.action==='visit'){
    const c=need(d.customers,b.customer,'客户'),s=need(services,b.service,'项目'),w=need(staff,b.staff,'员工');
    requireValue(w.enabled!==false&&d.rooms.includes(b.room),'技师或房间不可用');
    requireValue(!d.visits.some(v=>v.status==='服务中'&&(v.staff===w.id||v.room===b.room)),'房间或技师正在服务');
    const appt=state.appointments.find(a=>a.id===b.appointment&&a.storeId===store.id);
    if(b.appointment){const a=appt;requireValue(!d.reservations?.[b.appointment]||d.reservations[b.appointment]===c.id,'预约客户不匹配');requireValue(a&&['booked','done'].includes(a.status)&&a.serviceId===s.id&&a.staffId===w.id&&!d.visits.some(v=>v.appointment===a.id&&v.status!=='已撤单'),'预约信息不匹配或已开单');}
    requireValue(!d.visits.some(v=>v.customer===c.id&&v.status==='服务中'),'此客户已有进行中的服务');
    if(appt?.status==='booked')storeOperation(state,{action:'verify',storeId:store.id,id:appt.id});
    d.visits.unshift({id,at,customer:c.id,staff:w.id,service:s.id,title:s.name,price:Math.round((appt?.price??s.price)*100),deposit:Math.round((appt?.deposit||0)*100),duration:s.dur,room:b.room,grouponCode:appt?.gp?.code,status:'服务中',note:text(b.note),appointment:b.appointment||'',rate:d.rate});
  }else if(['finish','cancelVisit','pay','refund'].includes(b.action)){
    const v=need(d.visits,b.id,'服务单');requireValue(role!=='worker'||v.staff===worker,'只能处理本人服务');
    if(b.action==='finish'||b.action==='cancelVisit'){requireValue(v.status==='服务中','服务单状态已变化');v.status=b.action==='finish'?'待收款':'已撤单';v.end=at;if(b.note)v.note=text(b.note);}
    if(b.action==='finish'&&v.grouponCode){
      Object.assign(v,{status:'已结算',paid:0,paidAt:at,paymentMethod:'团购券',commission:Math.round(v.price*v.rate/100)});
    }
    if(b.action==='pay'){
      requireValue(v.status==='待收款','服务单尚未结束或已经结算');
      let amount=Math.max(0,v.price-(v.deposit||0));
      if(b.coupon){const cp=need(d.coupons,b.coupon,'优惠券');requireValue(cp.customer===v.customer&&!cp.used&&b.method!=='次卡','此券不可用');cp.used=v.id;amount=Math.max(0,amount-cp.value);v.coupon=cp.id;}
      requireValue(['微信','支付宝','现金','次卡'].includes(b.method),'收款方式无效');
      if(b.method==='次卡'){requireValue(!v.deposit,'已付定金的预约请按尾款结算');const card=need(d.cards,b.card,'次卡');requireValue(card.customer===v.customer&&card.service===v.service&&card.left>0,'没有可用次数');card.left--;v.card=card.id;amount=0;}
      if(v.appointment){const a=state.appointments.find(a=>a.id===v.appointment);if(a?.status==='booked')storeOperation(state,{action:'verify',storeId:store.id,id:a.id});}
      Object.assign(v,{status:'已结算',paid:amount,commission:Math.round((v.card?v.price:amount)*v.rate/100),paidAt:at});
      ledger('服务收款',amount,v.title,{method:b.method,visit:v.id});
    }
    if(b.action==='refund'){
      requireValue(v.status==='已结算'&&!v.grouponCode,'此单无法在门店退款');v.status='已退款';v.commission=0;
      if(v.card)need(d.cards,v.card,'次卡').left++;
      if(v.coupon)need(d.coupons,v.coupon,'优惠券').used='';
      if(v.paymentMethod==='门店余额')need(d.customers,v.customer,'客户').balance+=v.paid;
      ledger('服务退款',v.paymentMethod==='门店余额'?0:-v.paid,name(b.note),{visit:v.id,method:d.entries.find(e=>e.visit===v.id&&e.type==='服务收款')?.method});
    }
  }else if(b.action==='card'){
    const c=need(d.customers,b.customer,'客户'),s=need(services,b.service,'项目'),total=positive(b.count,true),amount=cents(b.amount);
    d.cards.unshift({id,customer:c.id,service:s.id,title:s.name,total,left:total});requireValue(['微信','支付宝','现金'].includes(b.method||'微信'),'售卡渠道无效');ledger('售卡收入',amount,c.name+' · '+s.name,{method:b.method||'微信'});
  }else if(b.action==='campaign'){
    d.campaigns.unshift({id,name:name(b.name),value:cents(b.amount),quota:positive(b.count,true),at});
  }else if(b.action==='issue'){
    const cp=need(d.campaigns,b.campaign,'活动'),c=need(d.customers,b.customer,'客户');
    requireValue(d.coupons.filter(x=>x.campaign===cp.id).length<cp.quota&&!d.coupons.some(x=>x.campaign===cp.id&&x.customer===c.id),'名额已满或客户已领券');
    d.coupons.unshift({id,campaign:cp.id,customer:c.id,name:cp.name,value:cp.value});
  }else if(b.action==='handover'){
    const shifts=d.handovers??=[];
    const previous=shifts[0]?.lastEntry;
    const boundary=previous?d.entries.findIndex(e=>e.id===previous):d.entries.length;
    const entries=d.entries.slice(0,boundary);
    requireValue(entries.length,'本班暂无新流水');
    const counted=Number(b.counted);
    requireValue(Number.isFinite(counted)&&Math.abs(counted)<=10000000,'实点现金无效');
    const cash=entries.filter(e=>e.method==='现金').reduce((n,e)=>n+e.amount,0);
    shifts.unshift({id,at,lastEntry:d.entries[0].id,count:entries.length,net:entries.reduce((n,e)=>n+e.amount,0),cash,counted:Math.round(counted*100),note:text(b.note),role});
  }else if(b.action==='expense'){
    requireValue(['微信','支付宝','现金'].includes(b.method||'现金'),'支出渠道无效');
    ledger('支出',-cents(b.amount),name(b.note),{method:b.method||'现金'});
  }
  else if(b.action==='stock'){
    const item=name(b.name),delta=positive(b.count,true)*(b.direction==='领用'?-1:1);
    requireValue(d.stock.filter(x=>x.name===item).reduce((n,x)=>n+x.delta,0)+delta>=0,'可用库存不足');
    d.stock.unshift({id,at,name:item,delta,note:text(b.note)});
  }else if(b.action==='room'){const room=name(b.name);requireValue(!d.rooms.includes(room),'房间已存在');d.rooms.push(room);}
  else if(b.action==='rate'){const rate=Number(b.rate);requireValue(Number.isFinite(rate)&&rate>=0&&rate<=100,'提成比例无效');d.rate=rate;}
  else if(b.action==='verify')storeOperation(state,{action:'verify',id:b.id,storeId:store.id});
  else throw new TradeError('未知操作');
  d.log.unshift({at,role,action:b.action,id:b.id||id});d.receipts[b.request]=true;
  return view();
}
