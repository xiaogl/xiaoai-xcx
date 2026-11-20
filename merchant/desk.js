(() => {
  const $=id=>document.getElementById(id), url=new URL(location.href);
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>'¥'+((n||0)/100).toLocaleString('zh-CN',{minimumFractionDigits:2});
  const day=s=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date(s));
  const now=day(Date.now()), stamp=s=>s?new Date(s).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Shanghai'}):'—';
  const roles={owner:'老板',desk:'前台',worker:'技师'};
  const groups=[['门店运营',[['概览','◈','经营概览'],['接待','▤','前台接待'],['预约','◷','预约核销'],['房态','▦','房间与床位']]],['会员经营',[['客户','♧','客户档案'],['次卡','▣','疗程次卡'],['营销','◇','营销中心']]],['经营管理',[['财务','▥','财务流水'],['交班','◴','交班对账'],['员工','♙','员工与提成'],['项目','✧','服务项目'],['库存','▧','耗材库存'],['权限','⚙','角色与终端']]]];
  const visible={desk:['概览','接待','预约','房态','客户','次卡','营销','交班'],worker:['概览','接待','预约','员工']};
  let d,token,page=url.searchParams.get('view')==='checkout'?'接待':'概览',filter='',submit;
  const store=()=>$('stores').value;
  const invoke=(action,fields={})=>XA.opsRequest('desk','POST',{storeId:store(),action,token,...fields});
  function mutation(action,fields){d=invoke(action,{...fields,request:crypto.randomUUID()});render();}
  const label=(rows,id)=>rows.find(x=>x.id===id)?.name||'—';
  const button=(title,cmd,id='')=>'<button data-cmd="'+esc(cmd)+'" data-id="'+esc(id)+'">'+esc(title)+'</button>';
  const panel=(title,content)=>'<section class="panel"><h2>'+esc(title)+'</h2>'+content+'</section>';
  const badge=s=>'<span class="pill">'+esc(s)+'</span>';
  const metric=(title,value,hint)=>'<div class="metric">'+esc(title)+'<strong>'+esc(value)+'</strong><small>'+esc(hint)+'</small></div>';
  const metrics=(...values)=>'<div class="metrics">'+values.join('')+'</div>';
  function table(headers,rows,empty='暂无记录'){
    return '<table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')+'</tbody></table>'+(!rows.length?'<div class="empty">'+esc(empty)+'</div>':'');
  }
  const cust=id=>esc(label(d.customers,id)), worker=id=>esc(label(d.staff,id));
  const service=id=>esc(label(d.services,id));
  const total=(rows,key)=>rows.reduce((n,x)=>n+(x[key]||0),0);
  const actions=(...items)=>items.filter(Boolean).join(' ');
  function visits(rows){
    return table(['客户 / 房间','服务项目','技师','开单时间','状态','操作'],rows.map(v=>[cust(v.customer)+' · '+esc(v.room),esc(v.title),worker(v.staff),stamp(v.at),badge(v.status),actions(v.status==='服务中'&&button('结束服务','finish',v.id),v.status==='服务中'&&d.role!=='worker'&&button('撤单','cancelVisit',v.id),v.status==='待收款'&&d.role!=='worker'&&button('扫码收款','scan',v.id),v.status==='待收款'&&d.role!=='worker'&&button('其他收款','pay',v.id),v.status==='已结算'&&!v.grouponCode&&d.role==='owner'&&button('退款','refund',v.id),button('详情','detail',v.id))]),'暂无服务单');
  }
  function rooms(){return '<div class="rooms">'+d.rooms.map(r=>{const v=d.visits.find(v=>v.room===r&&v.status==='服务中');return '<div class="room">'+badge(v?'服务中':'空闲')+'<b>'+esc(r)+'</b><small>'+(v?esc(v.title)+' · '+worker(v.staff):'可安排服务')+'</small></div>';}).join('')+'</div>';}
  function appointments(){
    return table(['预约时间','服务项目','技师','预约号','状态','操作'],d.appointments.map(a=>[esc(a.date+' '+a.time),esc(a.serviceName),esc(a.staffName),esc(a.id),badge(({booked:'待到店',done:'已核销',cancelled:'已取消',noshow:'未到店'})[a.status]||a.status),d.role!=='worker'?actions(a.status==='booked'&&button('核销','verify',a.id),['booked','done'].includes(a.status)&&!d.visits.some(v=>v.appointment===a.id&&v.status!=='已撤单')&&button('接待开单','visit',a.id)):'—']));
  }
  let customerQuery='';
  function customerRows(){
    const query=customerQuery.trim();
    const rows=d.customers.filter(c=>!query||(c.name+' '+c.phone).includes(query));
    return rows.map(c=>{
      const pending=d.visits.find(v=>v.customer===c.id&&v.status==='待收款');
      return line(esc(c.name),esc(c.phone),actions(pending&&button('结账','pay',pending.id),button('开单','customerVisit',c.id),button('预约','customerReserve',c.id),button('充值','customerRecharge',c.id),button('档案','profile',c.id)));
    }).join('')||emptyRow(query?'没有匹配的顾客':'暂无顾客档案');
  }
  function line(title,detail,tools){
    return '<div class="rx-line"><div><b>'+title+'</b><small>'+detail+'</small></div><div class="rx-tools">'+tools+'</div></div>';
  }
  const emptyRow=message=>'<p class="rx-empty">'+message+'</p>';
  function board(title,meta,content,extra=''){
    return '<section class="rx-board"><div class="rx-head"><h2>'+title+'</h2>'+meta+'</div>'+extra+'<div class="rx-list">'+content+'</div></section>';
  }
  function reception(active){
    const date=day(Date.now());
    const appts=d.appointments.filter(a=>a.date===date).sort((a,b)=>a.time.localeCompare(b.time));
    const appointments=appts.map(a=>{
      const visit=d.visits.find(v=>v.appointment===a.id&&v.status!=='已撤单');
      const status=visit?.status||({booked:'待到店',done:'已核销',cancelled:'已取消',noshow:'未到店'})[a.status];
      const accept=!visit&&['booked','done'].includes(a.status);
      return line('<time>'+esc(a.time)+'</time> '+(a.customer?cust(a.customer):'预约顾客'),esc(a.serviceName)+' · '+esc(a.staffName),actions(badge(status),accept&&button('接待开单','visit',a.id)));
    }).join('');
    const available=d.staff.filter(w=>w.enabled!==false&&!active.some(v=>v.staff===w.id));
    const spaces=d.rooms.map(room=>{
      const v=active.find(v=>v.room===room);
      return line(esc(room),v?cust(v.customer)+' · '+worker(v.staff)+' · '+esc(v.title):'可接待',v?button('结束服务','finish',v.id):button('开单','roomVisit',room));
    }).join('');
    const people=d.staff.map(w=>{
      const v=active.find(v=>v.staff===w.id);
      return line(esc(w.name),v?esc(v.room)+' · '+cust(v.customer):esc(w.title),v?badge('服务中'):w.enabled===false?badge('停用'):button('安排','staffVisit',w.id));
    }).join('');
    const pending=d.visits.filter(v=>v.status==='待收款');
    const charges=(d.recharges||[]).filter(r=>r.status==='待支付');
    const bills=[...pending.map(v=>({id:v.id,customer:v.customer,title:v.title,amount:Math.max(0,v.price-(v.deposit||0)),at:v.end||v.at})),...charges.map(r=>({...r,title:'余额充值',recharge:true}))].sort((a,b)=>a.at.localeCompare(b.at));
    const queue=bills.map(b=>line(cust(b.customer)+'　<strong>'+money(b.amount)+'</strong>',esc(b.title),actions(button('扫码收款','scan',b.id),b.recharge?button('现金到账','cashRecharge',b.id):button('其他收款','pay',b.id)))).join('');
    const coupon='<form id="rx-voucher"><label for="rx-code">团购核销</label><input id="rx-code" autocomplete="off" placeholder="扫描或输入团购券码" required maxlength="64"><button>验券</button></form>';
    const search='<div class="rx-search"><input id="rx-search" aria-label="查找顾客" placeholder="输入姓名或手机号，支持尾号" value="'+esc(customerQuery)+'">'+button('新建顾客','customer')+'</div>';
    return coupon+'<div class="rx-grid">'+board('今日预约',appts.length+' 笔',appointments||emptyRow('今日暂无预约'), '')+
      '<section class="rx-board"><div class="rx-head"><h2>现场占用</h2><small>'+available.length+' 位技师空闲 · '+(d.rooms.length-new Set(active.map(v=>v.room)).size)+' 间空房</small></div><div class="rx-resources"><div><h3>房间 / 床位</h3><div>'+spaces+'</div></div><div><h3>技师</h3><div>'+people+'</div></div></div></section>'+
      board('待结账',bills.length+' 笔 · '+money(total(bills,'amount')),queue||emptyRow('当前没有待收款账单'))+
      board('顾客速查',button('预约','reserve'),'<div id="rx-customers">'+customerRows()+'</div>',search)+'</div>';
  }
  function render(){
    const owner=d.role==='owner',employee=d.role==='worker', entries=d.entries||[], active=d.visits.filter(v=>v.status==='服务中'),today=d.visits.filter(v=>day(v.at)===now);
    const permitted=k=>owner||visible[d.role].includes(k);
    if(!permitted(page))page='概览';
    $('nav').innerHTML=groups.map(([g,items])=>{const list=items.filter(i=>permitted(i[0]));return list.length?'<small>'+g+'</small>'+list.map(([key,icon,title])=>'<button data-page="'+key+'" class="'+(page===key?'active':'')+'"><span>'+icon+'</span>'+title+'</button>').join(''):'';}).join('');
    const title=groups.flatMap(g=>g[1]).find(i=>i[0]===page)[2];$('heading').textContent=$('crumb').textContent=title;$('today').textContent=now+'　/　'+d.store;$('role').textContent=roles[d.role];
    let html='',buttons='';
    if(page==='概览'){
      buttons=employee?'':button('＋ 接待开单','visit');
      const daily=entries.filter(e=>day(e.at)===now);
      html=metrics(employee?metric('本人今日服务',today.length,'笔服务单'):metric('今日实收',money(total(daily.filter(e=>e.type!=='支出'),'amount')),'服务收款、售卡及退款'),metric('今日预约',d.appointments.filter(a=>a.date===now&&a.status==='booked').length,'待到店'),metric('正在服务',active.length,'单'),employee?metric('累计提成',money(total(d.visits,'commission')),'已结算服务'):metric('待收款',d.visits.filter(v=>v.status==='待收款').length,'笔服务单'));
      if(!employee)html+='<div class="grid">'+panel('实时房态',rooms())+panel('前台待办',['待结账服务','今日应回访','可用技师'].map((s,i)=>'<div class="flow"><i></i>'+s+'<b>'+[d.visits.filter(v=>v.status==='待收款').length,d.customers.filter(c=>c.follow&&c.follow<=now).length,d.staff.filter(w=>w.enabled!==false&&!active.some(v=>v.staff===w.id)).length][i]+'</b></div>').join(''))+'</div>';
      html+=panel(employee?'我的服务':'最近服务',visits(d.visits.slice(0,6)));
    }
    document.body.classList.toggle('reception',page==='接待'&&!employee);
    if(page==='接待'){
      buttons=employee?'':actions(button('＋ 接待开单','visit'),button('会员充值','recharge'),button('全部账单','allBills'),button(document.fullscreenElement?'退出全屏':'全屏','fullscreen'));
      html=employee?panel('本人服务记录',visits(d.visits)):reception(active);
    }
    if(page==='预约'){buttons=(employee?'':button('＋ 代客预约','reserve'))+'<a class="link" href="'+esc(XA.demoLink('/index.html')+'#/store-detail?id='+store())+'">顾客预约入口</a>';html=panel('到店预约',appointments());}
    if(page==='房态'){buttons=owner?button('＋ 新增房间','room'):'';html=panel('房态看板',rooms());}
    if(page==='客户'){
      buttons=button('＋ 新建客户','customer');
      html=panel('会员档案','<input class="search" id="search" placeholder="搜索姓名或手机号" value="'+esc(filter)+'">'+table(['姓名','手机号码','客户标签','服务偏好','下次回访','操作'],d.customers.filter(c=>(c.name+c.phone).includes(filter)).map(c=>[esc(c.name),esc(c.phone),esc(c.tag),esc(c.preference),esc(c.follow||'—'),actions(button('档案','profile',c.id),button('编辑','customer',c.id),button('回访','follow',c.id))])));
    }
    if(page==='次卡'){buttons=button('＋ 售疗程卡','card');html=panel('客户次卡',table(['客户','适用服务','剩余次数','购买次数'],d.cards.map(c=>[cust(c.customer),esc(c.title),c.left,c.total])));}
    if(page==='营销'){buttons=actions(owner&&button('＋ 创建券活动','campaign'),button('向客户发券','issue'));html=panel('优惠活动',table(['活动','抵扣金额','总名额','已发券','已使用'],d.campaigns.map(c=>{const issued=d.coupons.filter(x=>x.campaign===c.id);return [esc(c.name),money(c.value),c.quota,issued.length,issued.filter(x=>x.used).length];})))+panel('发券明细',table(['客户','券名','状态'],d.coupons.map(c=>[cust(c.customer),esc(c.name),badge(c.used?'已使用':'可用')])));}
    if(page==='财务'){buttons=actions(button('导出流水','export'),button('＋ 登记支出','expense'));html=metrics(...['服务收款','售卡收入','服务退款','支出'].map(t=>metric(t,money(total(entries.filter(e=>e.type===t),'amount')),'累计发生额')))+panel('收支明细',table(['时间','类型','说明','渠道','金额'],entries.map(e=>[stamp(e.at),badge(e.type),esc(e.note),esc(e.method||'—'),money(e.amount)])));}
    if(page==='交班'){buttons=button('办理交班','handover');html=panel('交班记录',table(['交班时间','角色','流水笔数','净收支','现金净收支','实点本班现金净额','差异','备注'],d.handovers.map(h=>[stamp(h.at),roles[h.role],h.count,money(h.net),money(h.cash),money(h.counted),money(h.counted-h.cash),esc(h.note)])));}
    if(page==='员工'){
      buttons=owner?actions('<a class="link" href="scheduling.html?demo='+XA.demoSpace+'&amp;storeId='+esc(store())+'">员工档案与周排班</a>',button('设置提成','rate')):'';
      html=panel(employee?'我的业绩':'员工绩效',table(['技师','职称','在岗状态','已结算单','服务提成'],d.staff.map(w=>{const done=d.visits.filter(v=>v.status==='已结算'&&v.staff===w.id);return [esc(w.name),esc(w.title),badge(w.enabled===false?'停用':'启用'),done.length,money(total(done,'commission'))];})));
      if(employee)html+=panel('我的周排班',table(['星期','可约时间'],[1,2,3,4,5,6,0].map(n=>['日一二三四五六'[n],esc(d.staff[0].shifts?.[n]?.join('、')??'默认时段')])));
    }
    if(page==='项目'){buttons=button('＋ 新增服务项目','service');html=panel('门店项目价目表',table(['项目名称','时长','标准价','会员价','服务说明'],d.services.map(s=>[esc(s.name),esc(s.dur)+' 分钟',money(s.price*100),money(s.mprice*100),esc(s.desc)])));}
    if(page==='库存'){buttons=button('＋ 入库 / 领用','stock');html=panel('库存余额',table(['耗材','结存数量'],[...new Set(d.stock.map(x=>x.name))].map(n=>[esc(n),total(d.stock.filter(x=>x.name===n),'delta')])) )+panel('出入库记录',table(['时间','耗材','数量变化','用途 / 批次'],d.stock.map(x=>[stamp(x.at),esc(x.name),x.delta,esc(x.note)])));}
    if(page==='权限'){buttons=button('签发角色入口','grant');html=panel('终端权限',table(['角色','终端','可办理业务'],[['老板','电脑 / 小程序','全店经营、财务、员工、授权'],['前台','电脑','接待、客户、次卡、收款、发券'],['技师','小程序 / 手机','本人预约、服务记录、排班和提成']]))+panel('已授权入口',table(['角色','绑定员工','操作'],d.grants.map(g=>[roles[g.role],worker(g.worker),button('撤销授权','revoke',g.id)])))+panel('操作记录',table(['时间','角色','操作'],d.log.map(x=>[stamp(x.at),roles[x.role],esc(names[x.action]||x.action)])));}
    $('actions').innerHTML=buttons;$('body').innerHTML=html;
  }
  const names={voucherRedeem:'团购核销',scan:'扫码收款',recharge:'创建充值账单',cashRecharge:'确认现金到账',handover:'办理交班',reserve:'代客预约',service:'新增服务项目',revoke:'撤销授权',customer:'客户档案',visit:'接待开单',finish:'结束服务',pay:'收款结算',refund:'服务退款',card:'销售疗程卡',campaign:'创建券活动',issue:'发放优惠券',follow:'客户回访',room:'新增房间',expense:'登记支出',stock:'耗材出入库',grant:'签发角色入口',rate:'设置服务提成',cancelVisit:'撤销服务单',verify:'到店核销'};
  function show(title,fields,handler){
    $('formTitle').textContent=title;$('fields').innerHTML=fields;$('error').textContent='';$('submit').hidden=!handler;submit=handler;
    $('submit').textContent=title==='确认团购核销'?'确认核销':'保存';
    if(!$('dialog').open)$('dialog').showModal();
  }
  function field(key,title,value='',opts){
    const attr=' name="'+key+'" '+(key==='worker'||key==='note'||['tag','follow','preference','coupon','card'].includes(key)?'':'required');
    const control=opts?'<select'+attr+'>'+opts.map(([v,n])=>'<option value="'+esc(v)+'" '+(String(v)===String(value)?'selected':'')+'>'+esc(n)+'</option>').join('')+'</select>':'<input'+attr+' type="'+(['follow','date'].includes(key)?'date':['amount','count','rate'].includes(key)?'number':'text')+'" '+(key==='amount'?'min="0.01" step="0.01"':key==='count'?'min="1" step="1"':key==='rate'?'min="0" max="100"':'')+' value="'+esc(value)+'">';
    return '<label>'+title+control+'</label>';
  }
  function command(cmd,id){
    const shortcut=cmd,context=id;
    if(['customerVisit','roomVisit','staffVisit'].includes(cmd)){cmd='visit';id='';}
    if(cmd==='customerReserve'){cmd='reserve';id='';}
    if(cmd==='customerRecharge'){cmd='recharge';id='';}
    if(cmd==='fullscreen'){
      const change=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();
      change?.catch(()=>{$('message').textContent='当前窗口未开放全屏，可使用浏览器全屏功能';});return;
    }
    if(cmd==='allBills')return show('全部账单',panel('服务单',visits(d.visits))+panel('充值单',table(['客户','金额','状态'],(d.recharges||[]).map(r=>[cust(r.customer),money(r.amount),badge(r.status)]))),null);
    const c=d.customers.find(x=>x.id===id)||{},v=d.visits.find(x=>x.id===id)||{},a=d.appointments.find(x=>x.id===id);
    const choices=rows=>rows.map(x=>[x.id,x.name]), strings=rows=>rows.map(x=>[x,x]);
    const client=()=>field('customer','客户',shortcut.startsWith('customer')?context:a?.customer,choices(d.customers));
    const svc=()=>field('service','服务项目',a?.serviceId,choices(d.services));
    let fields='';
    if(cmd==='export'){
      const csv=[['时间','业务','说明','渠道','金额（元）'],...d.entries.map(e=>[e.at,e.type,e.note,e.method||'',(e.amount/100).toFixed(2)])];
      const quote=v=>'"'+String(v).replace(/^[=+@-]/,"'    if(cmd==='detail')").replaceAll('"','""')+'"';
      const blob=new Blob(['\uFEFF'+csv.map(row=>row.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
      const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=d.store+'-财务流水-'+now+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);return;
    }
    if(cmd==='scan'){
      const r=d.recharges?.find(x=>x.id===id);
      const amount=r?r.amount:Math.max(0,v.price-(v.deposit||0));
      show('扫码收款 · '+money(amount),'<p>请顾客在晓艾打开本单并出示付款码。扫描后按回车确认。</p><label>晓艾付款码<input name="code" type="text" inputmode="numeric" autocomplete="off" pattern="98[0-9]{16}" required maxlength="18"></label>',values=>{mutation('scan',{id,code:values.code});return true;});$('fields').querySelector('input').focus();return;
    }
    if(cmd==='recharge')fields=client()+field('amount','充值金额（元）');
    if(cmd==='cashRecharge')fields='<p>确认已收到现金 '+money(d.recharges.find(r=>r.id===id).amount)+'？确认后将计入客户余额。</p>';
    if(cmd==='handover')fields=field('counted','本班实点现金净额（元）','0')+field('note','交班备注');
    if(cmd==='detail')return show('服务记录',panel(v.title,esc(v.room)+' · '+worker(v.staff)+'<p>'+esc(v.note||'暂无服务备注')+'</p>'+badge(v.status)),null);
    if(cmd==='profile')return show(c.name+' · 客户档案',panel('服务偏好',esc(c.preference||'未填写'))+panel('历史服务',d.visits.filter(x=>x.customer===id).map(x=>esc(x.title)+' · '+stamp(x.at)+' · '+esc(x.status)).join('<br>')||'暂无服务')+panel('回访记录',(c.notes||[]).map(n=>stamp(n.at)+' · '+esc(n.note)).join('<br>')||'暂无回访'),null);
    if(cmd==='customer')fields=field('name','客户姓名',c.name)+field('phone','手机号',c.phone)+field('tag','客户标签',c.tag)+field('preference','推拿力度、艾灸温度及服务偏好',c.preference)+field('follow','下次回访',c.follow);
    if(cmd==='follow')fields=field('note','回访记录')+field('follow','下次回访日期');
    if(cmd==='reserve')fields=client()+svc()+field('staff','技师','any',[['any','到店安排'],...choices(d.staff.filter(w=>w.enabled!==false))])+field('date','预约日期',now)+field('time','预约时段','',strings(d.times));
    if(cmd==='service')fields=field('name','推拿 / 艾灸项目名称')+field('count','时长（分钟）')+field('amount','服务价格（元）')+field('note','部位、手法与服务说明');
    if(cmd==='visit')fields=client()+svc()+field('staff','服务技师',shortcut==='staffVisit'?context:a?.staffId,choices(d.staff.filter(w=>w.enabled!==false&&!d.visits.some(v=>v.staff===w.id&&v.status==='服务中'))))+field('room','房间 / 床位',shortcut==='roomVisit'?context:'',strings(d.rooms.filter(r=>!d.visits.some(v=>v.room===r&&v.status==='服务中'))))+field('note','部位、手法与服务注意事项');
    if(cmd==='finish')fields=field('note','服务完成记录',v.note);
    if(cmd==='pay')fields='<p>'+esc(v.title)+' · 项目金额 '+money(v.price)+' · 已付定金 '+money(v.deposit)+'</p>'+field('method','收款方式','',strings(['微信','支付宝','现金','次卡']))+field('card','次卡（选择次卡收款时必选）','',[['','请选择'],...d.cards.filter(x=>x.customer===v.customer&&x.service===v.service&&x.left>0).map(x=>[x.id,x.title+' · 剩余 '+x.left+' 次'])])+field('coupon','抵扣券','',[['','不使用'],...d.coupons.filter(x=>x.customer===v.customer&&!x.used).map(x=>[x.id,x.name+' '+money(x.value)])]);
    if(cmd==='refund'||cmd==='expense')fields=field('note',cmd==='refund'?'退款原因':'支出用途')+(cmd==='expense'?field('amount','支出金额（元）'):'');
    if(cmd==='expense')fields+=field('method','支付渠道','现金',strings(['现金','微信','支付宝']));
    if(cmd==='card')fields=field('method','收款渠道','微信',strings(['微信','支付宝','现金']))+client()+svc()+field('count','疗程次数')+field('amount','收款金额（元）');
    if(cmd==='campaign')fields=field('name','券活动名称')+field('count','发放名额')+field('amount','单券抵扣金额（元）');
    if(cmd==='issue')fields=client()+field('campaign','券活动','',choices(d.campaigns));
    if(cmd==='stock')fields=field('name','耗材名称及规格')+field('direction','操作','',strings(['入库','领用']))+field('count','数量')+field('note','用途 / 批次');
    if(cmd==='room')fields=field('name','房间或床位名称');
    if(cmd==='rate')fields=field('rate','新服务单提成比例（%）',d.rate);
    if(cmd==='grant')fields=field('role','授权角色','desk',Object.entries(roles))+field('worker','技师端绑定员工','',[['','请选择'],...choices(d.staff)]);
    if(cmd==='verify'||cmd==='cancelVisit'||cmd==='revoke')fields='<p>确认'+names[cmd]+'？</p>';
    if(['visit','card','issue','reserve','recharge'].includes(cmd)&&!d.customers.length)return show('请先建立客户档案',button('新建客户','customer'),null);
    show(names[cmd],fields,values=>{
      if(cmd==='grant'){
        const newToken=crypto.randomUUID();mutation(cmd,{...values,newToken});
        const link=new URL('/merchant/',location.origin);link.search=new URLSearchParams({demo:XA.demoSpace,storeId:store()});link.hash='access='+newToken;
        show('专属角色入口','<p>持有入口即可使用授权角色。仅分享给对应员工。</p><input readonly value="'+esc(link.href)+'"><p>微信开发者工具启动参数</p><textarea readonly>'+esc(new URLSearchParams({demo:XA.demoSpace,storeId:store(),token:newToken}).toString())+'</textarea>',null);return false;
      }
      mutation(cmd,{...values,id,appointment:cmd==='visit'?id:undefined});return true;
    });
  }
  document.addEventListener('click',e=>{const target=e.target.closest('[data-page],[data-cmd]');if(!target)return;e.preventDefault();if(target.dataset.page){page=target.dataset.page;filter='';render();}else command(target.dataset.cmd,target.dataset.id);});
  document.addEventListener('fullscreenchange',()=>{if(d)render();});
  $('body').onsubmit=e=>{
    if(e.target.id!=='rx-voucher')return;e.preventDefault();
    const input=$('rx-code');const code=input.value.trim().toUpperCase();
    try{
      const g=invoke('voucherLookup',{code});
      show('确认团购核销','<p>'+esc(g.channel)+' · '+esc(g.title)+'</p><b>'+money(g.amount*100)+'</b><p>券码 '+esc(code)+'</p>',()=>{
        mutation('voucherRedeem',{code});$('message').textContent=g.title+' · 已核销';return true;
      });
    }catch(err){$('message').textContent=err.message;input.select();}
  };
  $('body').oninput=e=>{if(e.target.id==='rx-search'){customerQuery=e.target.value;$('rx-customers').innerHTML=customerRows();return;}if(e.target.id==='search'){filter=e.target.value;render();$('search').focus();}};
  $('form').onsubmit=e=>{e.preventDefault();try{if(submit?.(Object.fromEntries(new FormData(e.target))))$('dialog').close();}catch(err){$('error').textContent=err.message;}};
  $('cancel').onclick=()=>$('dialog').close();
  const supplied=new URLSearchParams(location.hash.slice(1)).get('access');
  const accessKey='desk-access:'+XA.demoSpace+':'+url.searchParams.get('storeId');
  if(supplied){sessionStorage.setItem(accessKey,supplied);history.replaceState(null,'',location.pathname+location.search);}
  const restricted=sessionStorage.getItem(accessKey);
  function load(){
    $('message').textContent='';
    try{
      const key='desk-owner:'+XA.demoSpace+':'+store();
      token=restricted||localStorage.getItem(key)||crypto.randomUUID();
      if(!restricted)localStorage.setItem(key,token);
      try{d=invoke('read');}catch(err){if(restricted||err.status!==422)throw err;d=invoke('open');}
      if(d.role==='desk'&&!$('nav').children.length)page='接待';
      render();
    }catch(err){$('message').textContent=err.message;$('body').replaceChildren();$('actions').replaceChildren();$('nav').replaceChildren();}
  }
  async function start(){try{
    if(restricted){$('stores').add(new Option('当前门店',url.searchParams.get('storeId')));$('stores').disabled=true;}
    else{await XA.loadCatalog();for(const s of XA.data.stores.filter(s=>s.linked&&!s.soon))$('stores').add(new Option(s.name,s.id));if([...$('stores').options].some(o=>o.value===url.searchParams.get('storeId')))$('stores').value=url.searchParams.get('storeId');}
    load();if(restricted&&d)$('stores').selectedOptions[0].text=d.store;
  }catch(err){$('message').textContent=err.message;}}
  setInterval(()=>{
    if(page!=='接待'||!d||document.hidden||$('dialog').open||document.activeElement?.matches('input,select,textarea'))return;
    try{const next=invoke('read');if(next.revision!==d.revision){d=next;render();}}
    catch(e){$('message').textContent=e.message;}
  },20000);
  $('stores').onchange=load;$('refresh').onclick=load;start();
})();
