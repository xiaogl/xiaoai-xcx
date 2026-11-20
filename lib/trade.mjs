import {randomUUID} from 'node:crypto';
import pricing from '../js/product-pricing.js';
export class TradeError extends Error {}
function check(ok,message) { if (!ok) throw new TradeError(message); }
const money = value => Math.round(value * 100) / 100;
const now = () => new Date().toISOString();
const text = value => typeof value === 'string' && value.trim() && value.length <= 160 && !/[<>"'&\x00-\x1f]/.test(value);

export function initStock(products) {
  products.forEach((p,index) => {
    p.stock ??= p.soldOut ? 0 : 360 + index * 45;
    if (p.skus) return;
    let rows = [{opts:[],delta:0}];
    for (const spec of p.specs) rows = rows.flatMap(r=>spec.options.map((o,i)=>({opts:[...r.opts,i],delta:r.delta+o.d})));
    p.skus = rows.map((r,i)=>({key:r.opts.join('_') || 'default',delta:r.delta,
      label:r.opts.map((n,j)=>p.specs[j].options[n].t).join(' / ') || '标准规格',
      stock:Math.floor(p.stock/rows.length) + Number(i < p.stock%rows.length)}));
  });
}
function adjust(product,sku,qty) {
  sku.stock += qty;
  product.stock = product.skus.reduce((n,s)=>n+s.stock,0);
  product.soldOut = product.stock === 0 || !!product.offShelf;
}
function pay(state,b) {
  check(/^[0-9a-f-]{36}$/.test(b.key),'订单标识无效');
  const previous = state.orders.find(o=>o.key===b.key);
  if (previous && (previous.status !== 'unpaid' || b.action === 'place')) return previous;
  const buyer = previous?.buyer || b.buyer || {name:'林阿姨',phone:'138****6608',address:'浙江省杭州市西湖区 文三路 ×× 小区 3 幢 502 室（演示地址）'};
  check(text(buyer.name) && buyer.name.length<=32 && text(buyer.address) &&
    typeof buyer.phone==='string' && (buyer.phone==='138****6608' || /^1\d{10}$/.test(buyer.phone)), '收货地址或手机号无效');
  check(Array.isArray(b.items) && b.items.length && b.items.length<=100,'请选择商品');
  check([1,2,3,4].includes(b.level),'会员等级无效');
  const plus = !!b.plus || !!b.bundle;
  const items = b.items.map(it=>{
    const p = state.catalog.products.find(p=>p.id===it.pid);
    check(p && !p.offShelf && Array.isArray(it.opts) && it.opts.length===p.specs.length,'商品已下架或规格已变更');
    const sku = p.skus.find(s=>s.key===(it.opts.join('_')||'default'));
    check(sku && Number.isInteger(it.qty) && it.qty>0 && it.qty<=99 && sku.stock>=it.qty,'该规格库存不足');
    check(pricing.valid(p,[sku.delta]),'商品价格配置无效');
    const {price} = pricing.quote(p,sku.delta,b.level,plus);
    if(b.action==='pay') adjust(p,sku,-it.qty);
    return {pid:p.id,title:p.title,opts:it.opts,skuKey:sku.key,specLabel:sku.label,art:p.art,qty:it.qty,price};
  });
  const goods=money(items.reduce((n,it)=>n+it.price*it.qty,0)),freight=plus || b.level>=3 || goods>=59 ? 0 : 8;
  const coupon=b.coupon;
  if(coupon) check(text(coupon.id) && coupon.scope==='goods' && Number.isFinite(coupon.min) && coupon.min>=0 && goods>=coupon.min && Number.isFinite(coupon.amount) && coupon.amount>=0 && !state.orders.some(o=>o.key!==b.key && o.couponId===coupon.id && !['unpaid','refunded'].includes(o.status)),'优惠券不可用');
  const off=coupon?.amount||0,amount=Math.max(.01,money(goods+freight-off)),plusFee=b.bundle ? (state.catalog.plus?.price ?? 365) : 0;
  check(amount===b.amount && plusFee===b.plusFee,'商品价格已更新，请重新确认');
  const growth=Math.floor(amount),points=growth*(plus || b.level===4 ? 2 : 1);
  const order={shared:true,id:'XA'+randomUUID(),key:b.key,paymentId:'P'+randomUUID(),status:'toship',items,goods,freight,off,amount,plusFee,points,growth,couponId:coupon?.id||null,at:now(),source:'feed',buyer:{name:buyer.name.trim(),phone:buyer.phone,address:buyer.address.trim()},logistics:{},csNotes:[]};
  if(b.action==='place') Object.assign(order,{paymentId:null,status:'unpaid',checkoutItems:b.items.map(({pid,opts,qty})=>({pid,opts,qty})),couponChoice:b.coupon?.id || 'none'});
  if(previous) {
    order.id=previous.id; order.at=previous.at; order.paidAt=now();
    state.orders[state.orders.indexOf(previous)]=order;
  } else state.orders.unshift(order);
  return order;
}
export function trade(state,b) {
  if(['place','pay'].includes(b.action)) return pay(state,b);
  const order=state.orders.find(o=>o.id===b.id);
  check(order,'订单不存在');
  const catalog=state.catalog;
  if(b.action==='ship') {
    check(order.status==='toship' && text(b.company) && text(b.trackNo),'请核对订单状态和物流信息');
    order.logistics={company:b.company,trackNo:b.trackNo,at:now()}; order.status='shipped';
  } else if(b.action==='receive') {
    check(order.status==='shipped','当前订单不能确认收货'); order.status='done';
  } else if(b.action==='request') {
    check(['toship','shipped'].includes(order.status) && text(b.reason),'无法重复申请退款或退款原因无效');
    const refund={id:'RF'+randomUUID(),orderId:order.id,type:'仅退款',status:'pending',from:order.status,amount:order.amount,pointsDeduct:order.points,reason:b.reason,applicant:order.buyer.name,phone:order.buyer.phone,createdAt:now()};
    (catalog.refunds ||= []).unshift(refund);order.status='refunding';order.refund=refund;
  } else if(b.action==='review') {
    const rf=catalog.refunds.find(r=>r.id===b.refundId && r.orderId===order.id);
    check(order.status==='refunding' && rf?.status==='pending' && typeof b.pass==='boolean' && text(b.note),'售后状态已更新或审核说明无效');
    if(b.pass && rf.from==='toship') for(const it of order.items) {
      const p=catalog.products.find(p=>p.id===it.pid), sku=p?.skus.find(s=>s.key===it.skuKey && s.label===it.specLabel);
      check(sku,'原规格已变更，请恢复原规格再处理退款');adjust(p,sku,it.qty);
    }
    rf.status=b.pass?'approved':'rejected';rf.auditNotes=b.note;rf.reviewedAt=now();order.refund=rf;
    order.status=b.pass?'refunded':rf.from;
    if(b.pass) {
      order.refundedAmount=rf.amount;
      (catalog.financeLedger ||= []).unshift({id:'FIN'+randomUUID(),ref:rf.id,type:'售后退款',channel:'模拟退款',amount:-rf.amount,net:-rf.amount,fee:0,status:'已退款',at:now()});
    }
  } else throw new TradeError('未知操作');
  return order;
}
