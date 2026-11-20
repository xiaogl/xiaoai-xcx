(() => {
  const esc=XA.esc;
  const money=n=>'¥'+(n/100).toFixed(2);
  let selected,codeView,timer;
  function request(action,fields={}){
    return XA.opsRequest('customerCheckout','POST',{action,storeId:selected,...fields});
  }
  // Interleaved 2 of 5 encodes each digit pair as five bars and five spaces.
  function barcode(code){
    const patterns=['00110','10001','01001','11000','00101','10100','01100','00011','10010','01010'];
    let bars='',x=12;
    function add(width,black){if(black)bars+='<rect x="'+x+'" y="1" width="'+width+'" height="48"/>';x+=width;}
    [1,1,1,1].forEach((w,i)=>add(w,i%2===0));
    for(let i=0;i<code.length;i+=2){for(let j=0;j<5;j++){add(patterns[code[i]][j]==='1'?3:1,true);add(patterns[code[i+1]][j]==='1'?3:1,false);}}
    add(3,true);add(1,false);add(1,true);
    return '<svg role="img" aria-label="晓艾付款条码" viewBox="0 0 '+(x+12)+' 50" style="display:block;width:100%;background:white;fill:black;shape-rendering:crispEdges">'+bars+'</svg>';
  }
  XA.page('service-bills',{title:'到店账单与余额',render(q={}){
    if(!XA.state.loggedIn)return '<div class="sec card"><h2>到店账单与余额</h2><p class="muted small mt8">登录后，您可查看门店余额、服务进度和账单。</p><button class="btn btn-primary mt12" onclick="XA.login()">登录晓艾查看</button></div>';
    selected=q.store||undefined;
    let data;
    try{
      XA.memberSession();data=request('read');
      if(!data.storeId&&data.stores.length){selected=data.stores[0].id;data=request('read');}
    }catch(e){return '<div class="sec card">'+esc(e.message)+'</div>';}
    if(!data.storeId)return '<div class="sec card"><h2>您还没有到店记录</h2><p class="muted small mt8">预约或到店消费后，服务进度、账单和余额会自动出现在这里。</p><button class="btn btn-tonal mt12" data-go="store">去预约</button></div>';
    selected=data.storeId;
    const switcher=data.stores.length>1?'<select onchange="XA.go(\'service-bills?store=\'+encodeURIComponent(this.value),true)">'+data.stores.map(s=>'<option value="'+esc(s.id)+'" '+(s.id===selected?'selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select>':'';
    return '<div class="sec card">'+switcher+'<div class="muted">'+esc(data.store)+' · '+esc(data.name)+'</div><h2>门店余额 '+money(data.balance)+'</h2><label>自助充值 <select id="bill-topup"><option value="100">¥100</option><option value="300">¥300</option><option value="500">¥500</option></select></label> <button class="btn btn-tonal btn-sm" onclick="XA.act.billTopup()">演示充值</button> <button class="link" onclick="XA.refresh()">刷新账单</button></div>'+data.bills.map(b=>{
      const choices=b.payment==='待支付'?'<div class="mt12">'+(b.service&&data.balance>=b.amount?buttons(b,'balance','余额'):'')+buttons(b,'demo','演示')+'</div>':'';
      const display=codeView?.id===b.id&&codeView.store===selected&&codeView.until>Date.now()&&b.payment==='待支付'?'<div class="mt12">'+barcode(codeView.code)+'<div class="center">'+codeView.code+'</div><small>仅限本单 · 90 秒内有效</small></div>':'';
      return '<div class="sec card"><strong>'+esc(b.title)+'</strong><span class="fr">'+money(b.amount)+'</span><div>'+esc([b.state,b.payment].filter(Boolean).join(' · '))+'</div>'+choices+display+'</div>';
    }).join('')+(data.bills.length?'':'<div class="sec card muted">您暂时还没有到店账单</div>');
  }});
  function buttons(b,method,title){
    return ['pay','code'].map(a=>'<button class="btn btn-tonal btn-sm" onclick="XA.act.billAction(\''+a+'\',\''+b.id+'\',\''+method+'\')">'+title+(a==='pay'?'支付':'付款码')+'</button>').join(' ');
  }
  XA.act.billTopup=()=>{
    const amount=Number(document.getElementById('bill-topup').value),id=crypto.randomUUID();
    XA.modal({title:'充值到门店余额',content:'本地演示充值 '+money(amount*100)+'，不会扣取真实资金。',confirmText:'确认充值',onConfirm:()=>{
      try{request('topup',{amount,request:id});XA.refresh();}catch(e){XA.toast(e.message);}
    }});
  };
  XA.act.billAction=(action,id,method)=>{
    let b;try{b=request('read').bills.find(b=>b.id===id);}catch(e){XA.toast(e.message);return;}
    if(!b||b.payment!=='待支付'){XA.refresh();return;}
    XA.modal({title:action==='code'?'出示本单付款码':'确认支付',content:(method==='demo'?'本地演示，不会扣取真实资金。':'使用门店余额。')+'本单金额 '+money(b.amount),confirmText:'确认',onConfirm:()=>{
      try{const result=request(action,{id,method});codeView=action==='code'?{...result,id,store:selected}:null;XA.refresh();
        clearInterval(timer);if(codeView)timer=setInterval(()=>{if(!location.hash.startsWith('#/service-bills')||Date.now()>result.until){clearInterval(timer);if(!location.hash.startsWith('#/service-bills'))return;}XA.refresh();},4000);
      }catch(e){XA.toast(e.message);XA.refresh();}
    }});
  };
})();
