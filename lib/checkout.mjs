import {createHash,randomInt,randomUUID} from 'node:crypto';
import {TradeError} from './trade.mjs';
const check=(ok,message)=>{if(!ok)throw new TradeError(message)};
const hash=s=>createHash('sha256').update(String(s)).digest('hex');
const due=v=>Math.max(0,v.price-(v.deposit||0));
function findBill(d,id){
  const v=d.visits.find(x=>x.id===id);
  if(v)return {row:v,amount:due(v),service:true,open:v.status==='待收款'};
  const row=d.recharges?.find(x=>x.id===id);
  check(row,'账单不存在');return {row,amount:row.amount,service:false,open:row.status==='待支付'};
}
function settle(d,bill,method){
  check(bill.open,'账单状态已变化，请刷新');
  const {row,amount,service}=bill,c=d.customers.find(c=>c.id===row.customer),wallet=method==='门店余额';
  check(c,'客户不存在');
  if(wallet){check(service&&(c.balance||0)>=amount,'可用余额不足');c.balance-=amount;}
  const at=new Date().toISOString(),id=randomUUID();
  if(service)Object.assign(row,{status:'已结算',paid:amount,paidAt:at,commission:Math.round(amount*row.rate/100)});
  else {c.balance=(c.balance||0)+amount;Object.assign(row,{status:'已支付',paidAt:at});}
  row.paymentMethod=method;
  d.entries.unshift({id,at,type:service?'服务收款':'余额充值',amount:wallet?0:amount,applied:amount,method,note:service?row.title:c.name+' · 余额充值',customer:c.id,...(service?{visit:row.id}:{recharge:row.id})});
}
export function deskCheckout(d,b){
  if(b.action==='recharge'){
    const amount=Math.round(Number(b.amount)*100);
    check(d.customers.some(c=>c.id===b.customer)&&Number.isSafeInteger(amount)&&amount>=1&&amount<=10000000,'客户或充值金额无效');
    (d.recharges??=[]).unshift({id:b.request,customer:b.customer,amount,status:'待支付',at:new Date().toISOString()});
  }else if(b.action==='scan'){
    const bill=findBill(d,b.id),code=d.scanCodes?.[bill.row.customer];
    check(/^98\d{16}$/.test(b.code)&&code&&code.hash===hash(b.code)&&code.bill===b.id&&code.amount===bill.amount&&code.until>Date.now(),'请扫描该账单对应的有效晓艾付款码');
    settle(d,bill,code.method);delete d.scanCodes[bill.row.customer];
  }else if(b.action==='cashRecharge'){const bill=findBill(d,b.id);check(!bill.service,'请选择充值单');settle(d,bill,'现金');}
}
export function customerCheckout(state,b,member){
  const stores=Object.entries(state.desks||{}).filter(([,d])=>d.customers.some(c=>c.memberId===member.id)).map(([id])=>({id,name:state.catalog.stores.find(s=>s.id===id)?.name}));
  const storeId=b.storeId||stores[0]?.id;
  const d=state.desks?.[storeId],c=d?.customers.find(c=>c.memberId===member.id);
  if(!c&&b.action==='read')return {stores,name:member.name,balance:0,bills:[]};
  check(c,'本店暂无会员档案');
  const customer=c.id;
  const snapshot=()=>({stores,storeId,name:c.name,store:stores.find(s=>s.id===storeId)?.name,balance:c.balance||0,
    bills:[...d.visits.filter(v=>v.customer===customer).map(v=>({id:v.id,title:v.title,service:true,at:v.at,amount:v.status==='已结算'||v.status==='已退款'?v.paid:due(v),state:v.status==='服务中'?'服务中':v.status==='已撤单'?'已撤单':'已结束',payment:({'待收款':'待支付','服务中':'待结单','已结算':'已支付','已退款':'已退款','已撤单':'已取消'})[v.status]})),...(d.recharges||[]).filter(r=>r.customer===customer).map(r=>({id:r.id,title:'门店余额充值',service:false,at:r.at,amount:r.amount,payment:r.status}))].sort((a,b)=>b.at.localeCompare(a.at))});
  if(b.action==='read')return snapshot();
  if(b.action==='topup'){
    check(/^[a-f0-9-]{36}$/.test(b.request)&&[100,300,500].includes(b.amount),'充值参数无效');
    const existing=d.recharges?.find(r=>r.id===b.request);
    if(existing){check(existing.customer===customer&&existing.amount===b.amount*100,'充值单不匹配');return snapshot();}
    deskCheckout(d,{action:'recharge',customer,request:b.request,amount:b.amount});
    settle(d,findBill(d,b.request),'演示支付');return snapshot();
  }
  const bill=findBill(d,b.id);check(bill.row.customer===customer,'账单不属于当前客户');
  check(bill.open,'账单状态已变化，请刷新');
  const method=b.method==='balance'?'门店余额':'演示支付';
  check(['balance','demo'].includes(b.method),'支付方式无效');
  if(method==='门店余额')check(bill.service&&(c.balance||0)>=bill.amount,'可用余额不足');
  if(b.action==='pay'){settle(d,bill,method);return snapshot();}
  check(b.action==='code','操作无效');
  const code='98'+[0,1].map(()=>String(randomInt(100000000)).padStart(8,'0')).join(''),until=Date.now()+90000;
  (d.scanCodes??={})[customer]={hash:hash(code),until,bill:b.id,amount:bill.amount,method};
  return {code,until};
}
