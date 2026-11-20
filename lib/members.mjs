import {randomUUID,createHash} from 'node:crypto';
import {TradeError} from './trade.mjs';

const demoUser={phone:'13800006608',name:'林阿姨'};
const digest=value=>createHash('sha256').update(value).digest('hex');
export function memberForPhone(state,phone,name){
  const members=state.members??=[];
  let member=members.find(m=>m.phone===phone);
  if(!member){member={id:randomUUID(),phone,name};members.push(member);}
  return member;
}
export function startSession(state){
  const member=memberForPhone(state,demoUser.phone,demoUser.name);
  const token=randomUUID();
  state.memberSessions=(state.memberSessions||[]).filter(s=>s.expires>Date.now());
  state.memberSessions.push({hash:digest(token),member:member.id,expires:Date.now()+30*86400000});
  // Migrate existing shop profiles without replacing their local IDs or balances.
  for(const d of Object.values(state.desks||{})){
    const c=d.customers.find(c=>!c.memberId&&c.phone===member.phone);
    if(c)c.memberId=member.id;
    const profile=c||d.customers.find(c=>c.memberId===member.id);
    if(profile)for(const a of state.appointments)if(!a.memberId&&d.reservations?.[a.id]===profile.id)a.memberId=member.id;
  }
  return {token,memberId:member.id};
}
export function currentMember(state,token){
  const session=typeof token==='string'&&state.memberSessions?.find(s=>s.expires>Date.now()&&s.hash===digest(token));
  return state.members?.find(m=>m.id===session?.member);
}
export function requireMember(state,token){
  const member=currentMember(state,token);
  if(!member)throw new TradeError('请先登录晓艾');
  return member;
}
export function ensureShop(state,storeId){
  const shops=state.desks??={};
  return shops[storeId]??={keys:[],customers:[],visits:[],entries:[],cards:[],campaigns:[],coupons:[],stock:[],rooms:['调理一室','艾灸二室','推拿三室'],rate:20,log:[],receipts:{}};
}
export function attachAppointment(state,a,member){
  if(!member)return;
  if(a.memberId&&a.memberId!==member.id)throw new TradeError('预约不属于当前会员');
  a.memberId=member.id;
  const d=ensureShop(state,a.storeId);
  let c=d.customers.find(c=>c.memberId===member.id||(!c.memberId&&c.phone===member.phone));
  if(!c){c={id:randomUUID(),name:member.name,phone:member.phone,at:new Date().toISOString()};d.customers.unshift(c);}
  c.memberId=member.id;
  (d.reservations??={})[a.id]=c.id;
}
