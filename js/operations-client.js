const requestedSpace = new URLSearchParams(location.search).get('demo');
const validSpace = s => /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(s || '');
XA.demoSpace = validSpace(requestedSpace) ? requestedSpace : localStorage.getItem('xa_demo_space') || crypto.randomUUID();
localStorage.setItem('xa_demo_space',XA.demoSpace);
const opsUrl = mode => '/api/operations?mode='+mode+'&demo='+encodeURIComponent(XA.demoSpace);
XA.demoLink = target => location.origin+target+'?demo='+XA.demoSpace;
XA.opsRequest = (mode, method = 'GET', body) => {
  const request = new XMLHttpRequest();
  request.open(method, opsUrl(mode), false);
  const session=XA.state.loggedIn&&localStorage.getItem('xa-member:'+XA.demoSpace);
  if(session)request.setRequestHeader('X-XA-Member',session);
  if (body) request.setRequestHeader('Content-Type','application/json');
  request.send(body ? JSON.stringify(body) : null);
  if (request.status !== 200) {
    let message = request.status === 409 ? '资料已更新，请刷新后重试' : '业务请求失败，请刷新重试';
    if (request.status === 422) message = JSON.parse(request.responseText).error;
    throw Object.assign(new Error(message), {status:request.status});
  }
  return JSON.parse(request.responseText);
};
XA.memberSession = () => {
  const key='xa-member:'+XA.demoSpace;
  if(!localStorage.getItem(key)||Number(localStorage.getItem(key+':until'))<=Date.now()){
    let token;
    try { token=XA.opsRequest('memberSession','POST',{}).token; }
    catch(error){ if(error.status!==409) throw error; token=XA.opsRequest('memberSession','POST',{}).token; }
    localStorage.setItem(key,token);
    localStorage.setItem(key+':until',String(Date.now()+29*86400000));
  }
  return localStorage.getItem(key);
};
XA.mergeOrders = orders => {
  XA.state.orders = [...orders,...XA.state.orders.filter(o=>!o.shared)];
};
function creditVisits(appointments) {
  const credited=XA.state.visitCredits ||= {};
  for (const a of appointments) {
    if(a.status!=='done' || !a.doneAt || credited[a.id]) continue;
    credited[a.id]=true;
    if(a.gp && !XA.state.gpUsed.includes(a.gp.code)) XA.state.gpUsed.push(a.gp.code);
    XA.addPoints(50,'到店核销完成 · '+a.id,50+a.price);
  }
}
XA.loadCatalog = async () => {
  const headers=XA.state.loggedIn&&document.getElementById('app')?{'X-XA-Member':XA.memberSession()}:{};
  const response = await fetch(opsUrl('catalog'),{cache:'no-store',headers});
  if (!response.ok) throw new Error('目录加载失败');
  const {demoOrders,appointments,waitlist,signups,space,...catalog} = await response.json();
  /* 兼容已保存的旧演示空间：把本地种子里存在、但后端快照缺失的门店补齐（含新增城市门店） */
  if (Array.isArray(catalog.stores)) {
    const have = new Set(catalog.stores.map((s) => s.id));
    const seed = (XA.data.stores || []).filter((s) => !have.has(s.id));
    if (seed.length) catalog.stores = catalog.stores.concat(seed.map((s) => ({ ...s })));
  }
  Object.assign(XA.data,catalog);
  XA.mergeOrders(demoOrders);
  const legacyVisits = XA.state.appts.filter(a => !a.shared && !appointments.some(row => row.id === a.id));
  XA.state.appts = [...appointments, ...legacyVisits];
  if(document.getElementById("app")) creditVisits(appointments);
  XA.state.waitlist=waitlist; XA.state.signups=signups;
  for (const order of demoOrders) {
    const credits = XA.state.tradeCredits ||= {};
    if (credits[order.id] && order.status==='refunded' && credits[order.id]!=='refunded') {
      credits[order.id]='refunded';
      const c=XA.state.coupons.find(c=>c.id===order.couponId);
      if(c) c.used=false;
      XA.addPoints(-order.points,'订单退款 '+order.id,-order.growth);
    }
  }
  XA.data.cities = [...new Set(XA.data.stores.map(s => s.city))];
};
XA.changeTrade = body => {
  try {
    const {order,revision}=XA.opsRequest('trade','POST',body);
    if(window.ADM) { ADM.load(); ADM.render(); }
    else {
      XA.state.orders=[order,...XA.state.orders.filter(o=>o.id!==order.id)];
      XA.save();
    }
    return order;
  } catch(e) { (window.ADM ? ADM.toast : XA.toast)(e.message); return null; }
};

XA.storeAction = (action, fields = {}) => {
  if(action==='book'&&XA.state.loggedIn)XA.memberSession();
  const result = XA.opsRequest('store','POST',{...fields,action});
  if(result.appointment) {
    const appt=result.appointment;
    if(document.getElementById("app")) creditVisits([appt]);
    XA.state.appts=[appt,...XA.state.appts.filter(a=>a.id!==appt.id)];
  }
  if(action!=='list' && action!=='staffSave') {
    if(result.waitlist) XA.state.waitlist=result.waitlist;
    if(result.activities) XA.data.activities=result.activities;
    if(result.signups) XA.state.signups=result.signups;
  }
  return result;
};
