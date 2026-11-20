/* views-ops.js —— 晓艾运营中台核心子系统视图（右侧侧边面板与就地编辑组合，彻底零弹层）
 * 1. overview: 经营大盘（待办事务中心全闭环、前台到店核销调度、首页流量投放）
 * 2. shop:     电商管理系统（商品SKU主档增删改查、多级分类标签增删改查、订单客服履约与代客录单、售后审核拦截、品牌供应链与证照）
 */
(function () {
  const D = XA.data, S = () => XA.state, esc = XA.esc, icon = XA.icon;
  const ART_SHAPES = ['moxa', 'box', 'leaf', 'bath', 'patch', 'tea', 'room', 'person', 'book', 'season', 'bed', 'hand', 'calendar'];
  const ART_TONES = ['sage', 'clay', 'sand', 'rose', 'mist', 'ember', 'dusk', 'night'];
  const safeArt = (obj, defShape = 'moxa', defTone = 'sage') => {
    const a = obj?.art || obj?.gallery?.[0] || [defShape, defTone];
    return XA.art(a[0] || defShape, a[1] || defTone);
  };

  /* ============================================================================
   * 1. 经营大盘指挥部 (overview)
   * ============================================================================ */
  ADM.views.overview = () => {
    const m = ADM.metrics();
    const s = S();
    const qTab = ADM.sub.ovQueue || 'ship';
    const res = D.homeResources;

    const shipList = s.orders.filter((o) => o.status === 'toship');
    const refundList = (D.refunds || []).filter((r) => r.status === 'pending');
    const claimList = s.claim.pending;
    const partnerList = Object.entries(s.partnerApplications || {}).filter(([, v]) => v.status !== 'approved' && v.status !== 'rejected');
    const settleList = (D.brandSettlements || []).filter((b) => b.status === '待打款');

    let queueBody = '';
    if (qTab === 'ship') {
      const pg = ADM.paginate(shipList, 'ov_ship', 4);
      queueBody = pg.items.length ? pg.items.map((o) => `
        <div class="mini-box row between gap8">
          <div class="grow ell">
            <div class="row gap6"><span class="adm-tag orange">待发货</span><b>${esc(o.id)}</b><span class="tiny faint">实付 ¥${XA.money(o.amount)} ｜ 收件人：${esc(o.buyer?.name)} (${esc(o.buyer?.phone)})</span></div>
            <div class="tiny muted ell" style="margin-top:2px">${(o.items || []).map((it) => `${D.product(it.pid)?.short || it.pid} ×${it.qty}`).join('、')} ｜ 地址：${esc(o.buyer?.address)}</div>
          </div>
          <button class="btn-adm primary sm" onclick="ADM.act.quickShip('${o.id}')">${icon('truck')} 登记物流发货</button>
        </div>
      `).join('') + `<div class="row between" style="margin-top:auto">${pg.pagerHtml}<button class="btn-adm tonal sm" onclick="ADM.act.shipAll()">一键全部发货</button></div>`
      : `<div class="center muted" style="margin:auto">暂无待发货订单</div>`;
    } else if (qTab === 'refund') {
      const pg = ADM.paginate(refundList, 'ov_refund', 4);
      queueBody = pg.items.length ? pg.items.map((rf) => `
        <div class="mini-box row between gap8">
          <div class="grow ell">
            <div class="row gap6"><span class="adm-tag red">退款待审</span><b>${esc(rf.id)}</b><span class="tiny c-price">退款金额 ¥${XA.money(rf.amount)}</span></div>
            <div class="tiny muted ell" style="margin-top:2px">关联订单：${esc(rf.orderId)} ｜ 申请人：${esc(rf.applicant)} ｜ 原因：${esc(rf.reason)}</div>
          </div>
          <div class="row gap4">
            <button class="btn-adm danger sm" onclick="ADM.act.approveRefund('${rf.id}', true)">同意退款</button>
            <button class="btn-adm outline sm" onclick="ADM.act.approveRefund('${rf.id}', false)">驳回</button>
          </div>
        </div>
      `).join('') + `<div class="row between" style="margin-top:auto">${pg.pagerHtml}</div>`
      : `<div class="center muted" style="margin:auto">暂无待审核售后退款单</div>`;
    } else if (qTab === 'claim') {
      const pg = ADM.paginate(claimList, 'ov_claim', 4);
      queueBody = pg.items.length ? pg.items.map((pd) => `
        <div class="mini-box row between gap8">
          <div class="grow ell">
            <div class="row gap6"><span class="adm-tag blue">${esc(pd.channel)}</span><b>${esc(pd.order)}</b><span class="tiny faint">申请人：${esc(pd.applicant || '会员')} (${esc(pd.phone || '')})</span></div>
            <div class="tiny muted ell" style="margin-top:2px">${esc(pd.title || '包裹订单补登')} ｜ 拟发放 <b>+${pd.points || 68}</b> 积分</div>
          </div>
          <div class="row gap4">
            <button class="btn-adm primary sm" onclick="ADM.act.approveClaim('${pd.id}', true)">通过发分</button>
            <button class="btn-adm danger sm" onclick="ADM.act.approveClaim('${pd.id}', false)">驳回</button>
          </div>
        </div>
      `).join('') + `<div class="row between" style="margin-top:auto">${pg.pagerHtml}</div>`
      : `<div class="center muted" style="margin:auto">暂无待审核三方补登单</div>`;
    } else if (qTab === 'partner') {
      const pg = ADM.paginate(partnerList, 'ov_partner', 4);
      const typeName = { claim: '认领门店', new: '新店入驻', franchise: '品牌加盟', dealer: '品牌经销' };
      queueBody = pg.items.length ? pg.items.map(([k, v]) => `
        <div class="mini-box row between gap8">
          <div class="grow ell">
            <div class="row gap6"><span class="adm-tag gold">${typeName[v.type] || v.type}</span><b>${esc(v.store || v.target)}</b><span class="tiny faint">${esc(v.submittedAt || '')}</span></div>
            <div class="tiny muted ell" style="margin-top:2px">联系人：${esc(v.contact)} (${esc(v.phone)}) ｜ 地址：${esc(v.address || '意向合作')}</div>
          </div>
          <div class="row gap4">
            <button class="btn-adm primary sm" onclick="ADM.act.handlePartner('${esc(k)}', true)">审核通过</button>
            <button class="btn-adm outline sm" onclick="ADM.act.handlePartner('${esc(k)}', false)">驳回</button>
          </div>
        </div>
      `).join('') + `<div class="row between" style="margin-top:auto">${pg.pagerHtml}</div>`
      : `<div class="center muted" style="margin:auto">暂无待审批入驻申请</div>`;
    } else {
      const pg = ADM.paginate(settleList, 'ov_settle', 4);
      queueBody = pg.items.length ? pg.items.map((st) => `
        <div class="mini-box row between gap8">
          <div class="grow ell">
            <div class="row gap6"><span class="adm-tag green">${esc(st.brandName)}</span><b>账单 ${esc(st.id)}</b><span class="tiny faint">${esc(st.period)}</span></div>
            <div class="tiny muted ell" style="margin-top:2px">当期销售 ¥${XA.money(st.totalSales)} ｜ 扣除佣金 ¥${XA.money(st.platformFee)} ｜ 应打款 <b class="c-price">¥${XA.money(st.payable)}</b></div>
          </div>
          <button class="btn-adm primary sm" onclick="ADM.act.settlePayout('${st.id}')">确认转账打款</button>
        </div>
      `).join('') + `<div class="row between" style="margin-top:auto">${pg.pagerHtml}</div>`
      : `<div class="center muted" style="margin:auto">当期供应商账单已全部打款结清</div>`;
    }

    const bookedAppts = s.appts.filter((a) => a.status === 'booked');
    const waitItems = s.waitlist;

    return `
      <div class="kpi-strip">
        <div class="kpi-card" onclick="ADM.go('finance')">
          <div><div class="kpi-val">¥${XA.money(m.totalGMV)}</div><div class="kpi-lbl">全平台累计 GMV 流水</div></div>
          <span class="kpi-ic">${icon('coin')}</span>
        </div>
        <div class="kpi-card" onclick="ADM.go('shop', 'orders')">
          <div><div class="kpi-val">¥${XA.money(m.onlineGMV)}</div><div class="kpi-lbl">线上电商自营流水</div></div>
          <span class="kpi-ic warn">${icon('bag')}</span>
        </div>
        <div class="kpi-card" onclick="ADM.go('store', 'verify')">
          <div><div class="kpi-val">¥${XA.money(m.offlineGMV)}</div><div class="kpi-lbl">门店核销到店产值</div></div>
          <span class="kpi-ic gold">${icon('store')}</span>
        </div>
        <div class="kpi-card" onclick="ADM.go('content', 'videos')">
          <div><div class="kpi-val">¥${XA.money(m.contentGMV)}</div><div class="kpi-lbl">内容挂车载荷带货 GMV</div></div>
          <span class="kpi-ic blue">${icon('video')}</span>
        </div>
        <div class="kpi-card" onclick="ADM.go('user', 'members')">
          <div><div class="kpi-val">${s.points}</div><div class="kpi-lbl">会员积分总池</div></div>
          <span class="kpi-ic">${icon('crown')}</span>
        </div>
        <div class="kpi-card" onclick="ADM.setSub('ovQueue','ship')">
          <div><div class="kpi-val ${m.totalPending ? 'c-price' : ''}">${m.totalPending}</div><div class="kpi-lbl">全站待处理事务</div></div>
          <span class="kpi-ic ${m.totalPending ? 'warn' : ''}">${icon('bell')}</span>
        </div>
      </div>

      <div class="bento-grid" style="grid-template-columns: 1.18fr 1fr 1.15fr;">
        <!-- 待办速办 -->
        <section class="pane">
          <div class="pane-hd">
            <div class="pane-hd-title">${icon('check')}<span>全域运营待办事务中心</span></div>
            <span class="adm-tag ${m.totalPending ? 'red' : 'green'}">${m.totalPending} 项待处理</span>
          </div>
          <div class="pane-subbar">
            <div class="seg-pills" style="width:100%">
              <button class="seg-pill grow ${qTab === 'ship' ? 'on' : ''}" onclick="ADM.setSub('ovQueue','ship')">待发货 <em>${m.toship}</em></button>
              <button class="seg-pill grow ${qTab === 'refund' ? 'on' : ''}" onclick="ADM.setSub('ovQueue','refund')">售后退款 <em>${m.torefund}</em></button>
              <button class="seg-pill grow ${qTab === 'claim' ? 'on' : ''}" onclick="ADM.setSub('ovQueue','claim')">三方补登 <em>${m.toclaim}</em></button>
              <button class="seg-pill grow ${qTab === 'partner' ? 'on' : ''}" onclick="ADM.setSub('ovQueue','partner')">合作入驻 <em>${m.topartner}</em></button>
              <button class="seg-pill grow ${qTab === 'settle' ? 'on' : ''}" onclick="ADM.setSub('ovQueue','settle')">财务对账 <em>${m.tosettle}</em></button>
            </div>
          </div>
          <div class="pane-bd">
            ${queueBody}
          </div>
        </section>

        <!-- 到店履约与前台核销 -->
        <section class="pane">
          <div class="pane-hd">
            <div class="pane-hd-title">${icon('scan')}<span>前台到店核销与候补调度</span></div>
            <button class="btn-adm tonal sm" onclick="ADM.go('store', 'verify')">进入完整核销台 ↗</button>
          </div>
          <div class="pane-bd">
            <div class="row gap6">
              <input class="field-input grow" id="ovVerifyInput" placeholder="输入 6 位预约核销码或美团抖音团购券码…" onkeydown="if(event.key==='Enter')ADM.act.verifyByCode('ovVerifyInput')">
              <button class="btn-adm primary" onclick="ADM.act.verifyByCode('ovVerifyInput')">立即核销</button>
            </div>
            <div class="row gap6" style="flex-wrap:wrap">
              <span class="tiny faint">快捷填入：</span>
              ${bookedAppts.map((a) => `<button class="chip-btn" onclick="document.getElementById('ovVerifyInput').value='${a.code}'">预约码 ${a.code}</button>`).join('')}
              ${D.groupons.map((g) => `<button class="chip-btn" onclick="document.getElementById('ovVerifyInput').value='${g.code}'">${g.channel}：${g.code.slice(0, 6)}…</button>`).join('')}
            </div>

            <div class="field-label" style="margin-top:2px"><span>今日待到店预约 (${bookedAppts.length})</span></div>
            <div class="item-deck">
              ${bookedAppts.length ? bookedAppts.slice(0, 3).map((a) => {
                const st = D.storeOf(a.storeId), sv = D.service(a.serviceId);
                return `<div class="mini-box row between gap8">
                  <div class="grow ell">
                    <div class="row gap6"><b>${a.time} · ${esc(sv.name)}</b><span class="adm-tag green">码 ${a.code}</span>${a.gp ? `<span class="adm-tag gold">${a.gp.channel}券</span>` : ''}</div>
                    <div class="tiny muted ell">${esc(st.name)} ｜ 顾客：${esc(a.customer?.name || '会员')} (${esc(a.customer?.phone || '')}) ｜ 技师：${esc(D.staffOf(a.staffId).name)}</div>
                  </div>
                  <div class="row gap4">
                    <button class="btn-adm primary sm" onclick="ADM.act.verifyAppt('${a.id}')">核销到店</button>
                    <button class="btn-adm outline sm" onclick="ADM.act.noshowAppt('${a.id}')">爽约</button>
                  </div>
                </div>`;
              }).join('') : `<div class="mini-box center muted">今日预约已全部核销完成</div>`}
            </div>

            <div class="field-label"><span>候补队列调度 (${waitItems.length})</span></div>
            ${waitItems.length ? waitItems.slice(0, 2).map((w) => `
              <div class="mini-box row between gap8">
                <div class="grow ell">
                  <div class="row gap6"><b>${esc(D.storeOf(w.storeId).name)}</b><span class="adm-tag ${w.status === 'offered' ? 'green' : 'orange'}">${w.status === 'offered' ? '已通知客户' : `排位 ${w.rank}`}</span></div>
                  <div class="tiny muted">${w.date} ${w.time} ｜ 顾客：${esc(w.customer?.name || '会员')} ｜ 项目：${esc(D.service(w.serviceId).name)}</div>
                </div>
                ${w.status === 'waiting'
                  ? `<button class="btn-adm warm sm" onclick="ADM.act.releaseWait('${w.id}')">释放名额</button>`
                  : `<span class="tiny c-primary bold">待客户确认</span>`}
              </div>
            `).join('') : `<div class="mini-box center muted">暂无候补</div>`}
          </div>
        </section>

        <!-- 首页资源位控制台 -->
        <section class="pane">
          <div class="pane-hd">
            <div class="pane-hd-title">${icon('home')}<span>首页资源位投放控制台</span></div>
            <button class="btn-adm tonal sm" onclick="ADM.openPreview('home')">在小程序预览</button>
          </div>
          <div class="pane-bd">
            <div class="mini-box">
              <div class="row between">
                <div><b>主视觉海报 (Campaign Banner)</b><div class="tiny faint">开启后替换体质卡，支持高度无级调节</div></div>
                <button class="adm-switch ${res.campaign.enabled ? 'on' : ''}" onclick="ADM.act.toggleCampaign()" aria-label="切换海报"><i></i></button>
              </div>
              <div class="form-grid" style="margin-top:6px">
                <div class="field">
                  <span class="field-label">海报标题文案</span>
                  <input class="field-input" value="${esc(res.campaign.title)}" onchange="XA.data.homeResources.campaign.title=this.value;ADM.save('已更新海报标题')">
                </div>
                <div class="field">
                  <span class="field-label">跳转目标路由</span>
                  <select class="field-select" onchange="XA.data.homeResources.campaign.route=this.value;ADM.save('已更新跳转目标')">
                    <option value="article?id=a1" ${res.campaign.route === 'article?id=a1' ? 'selected' : ''}>文章：立冬养藏</option>
                    <option value="course?id=c1" ${res.campaign.route === 'course?id=c1' ? 'selected' : ''}>课程：艾灸入门 6 讲</option>
                    <option value="product?id=p1" ${res.campaign.route === 'product?id=p1' ? 'selected' : ''}>商品：五年陈艾条</option>
                    <option value="activities" ${res.campaign.route === 'activities' ? 'selected' : ''}>活动：门店近期活动</option>
                  </select>
                </div>
                <div class="field col-span-2">
                  <span class="field-label"><span>视口高度占比</span><b>${res.campaign.heightPercent}%</b></span>
                  <input type="range" min="20" max="80" step="5" value="${res.campaign.heightPercent}" oninput="XA.data.homeResources.campaign.heightPercent=+this.value;ADM.save();ADM.render()">
                </div>
              </div>
            </div>

            <div class="mini-box">
              <div class="row between">
                <div><b>横幅通知公告 (Notice Bar)</b><div class="tiny faint">常驻首页工具区下方</div></div>
                <button class="adm-switch ${res.notice.enabled ? 'on' : ''}" onclick="ADM.act.toggleNotice()" aria-label="切换公告"><i></i></button>
              </div>
              <div class="row gap6" style="margin-top:6px">
                <input class="field-input grow" value="${esc(res.notice.title)}" onchange="XA.data.homeResources.notice.title=this.value;ADM.save('已更新公告文案')">
                <input class="field-input" style="width:110px" value="${esc(res.notice.route)}" onchange="XA.data.homeResources.notice.route=this.value;ADM.save('已更新公告路由')">
              </div>
            </div>

            <div class="mini-box">
              <div class="field-label"><span>搜索热搜榜单词条（点击 ✕ 删除，回车新增）</span></div>
              <div class="chip-group" style="margin-top:4px">
                ${(D.hotKeywords || []).map((kw, i) => `<button class="chip-btn on" onclick="XA.data.hotKeywords.splice(${i},1);ADM.save('已移除热搜词');ADM.render()">${esc(kw)} ✕</button>`).join('')}
                <input class="field-input" style="width:100px;height:24px;font-size:11px" placeholder="+ 热搜回车" onkeydown="if(event.key==='Enter'&&this.value.trim()){D.hotKeywords.push(this.value.trim());this.value='';ADM.save('已添加热搜词');ADM.render()}">
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
  };

  /* ============================================================================
   * 2. 电商管理系统 (shop)
   * ============================================================================ */
  ADM.views.shop = () => {
    const sub = ADM.sub.shopSub || 'products';
    const s = S();

    const topBar = `
      <div class="subnav-bar">
        <div class="seg-pills">
          <button class="seg-pill ${sub === 'products' ? 'on' : ''}" onclick="ADM.setSub('shopSub','products')">商品主档与多规格SKU <em>${D.products.length}</em></button>
          <button class="seg-pill ${sub === 'categories' ? 'on' : ''}" onclick="ADM.setSub('shopSub','categories')">多级分类与多维标签 <em>${D.shopCategories.length}</em></button>
          <button class="seg-pill ${sub === 'orders' ? 'on' : ''}" onclick="ADM.setSub('shopSub','orders')">订单履约与客服处置 <em>${s.orders.length}</em></button>
          <button class="seg-pill ${sub === 'refunds' ? 'on' : ''}" onclick="ADM.setSub('shopSub','refunds')">售后仅退款审核 <em>${(D.refunds || []).filter((r) => r.status === 'pending').length}</em></button>
          <button class="seg-pill ${sub === 'brands' ? 'on' : ''}" onclick="ADM.setSub('shopSub','brands')">入驻品牌供应链 <em>${Object.keys(D.brands).length}</em></button>
        </div>
        <div class="row gap8">
          ${sub === 'products' ? (ADM.mode.product === 'create' ? `<button class="btn-adm outline sm" onclick="ADM.setMode('product','detail')">返回编辑商品</button>` : `<button class="btn-adm primary sm" onclick="ADM.setMode('product','create')">+ 新增商品</button>`) :
            sub === 'orders' ? (ADM.mode.order === 'create' ? `<button class="btn-adm outline sm" onclick="ADM.setMode('order','detail')">返回订单详情</button>` : `<button class="btn-adm primary sm" onclick="ADM.setMode('order','create')">+ 代客录单</button>`) :
            sub === 'refunds' ? (ADM.mode.refund === 'create' ? `<button class="btn-adm outline sm" onclick="ADM.setMode('refund','detail')">返回审核列表</button>` : `<button class="btn-adm primary sm" onclick="ADM.setMode('refund','create')">+ 代客发起售后</button>`) :
            sub === 'brands' ? (ADM.mode.brand === 'create' ? `<button class="btn-adm outline sm" onclick="ADM.setMode('brand','detail')">返回品牌主档</button>` : `<button class="btn-adm primary sm" onclick="ADM.setMode('brand','create')">+ 新增品牌</button>`) : ''}
          <button class="btn-adm tonal sm" onclick="ADM.openPreview('catalog')">在小程序预览商城</button>
        </div>
      </div>
    `;

    // 2.1 商品与多规格 SKU 主档（中栏编辑 / 右栏侧边面板联动）
    if (sub === 'products') {
      const cat = ADM.filter.shopCat || '全部';
      const statusFilter = ADM.filter.shopSt || 'all';
      const kw = (ADM.filter.shopKw || '').trim();
      const cats = ['全部', ...D.shopCategories.map((c) => c.name)];
      const filtered = D.products.filter((p) => {
        if (cat !== '全部' && p.category !== cat) return false;
        if (statusFilter === 'onsale' && p.soldOut) return false;
        if (statusFilter === 'soldout' && !p.soldOut) return false;
        if (kw && !(p.title + p.short + (p.code || '')).includes(kw)) return false;
        return true;
      });
      const pg = ADM.paginate(filtered, 'shop_prods', 6);
      const curId = ADM.sel.product && D.product(ADM.sel.product) ? ADM.sel.product : (pg.items[0]?.id || D.products[0]?.id);
      ADM.sel.product = curId;
      const p = D.product(curId) || D.products[0];
      const b = D.brands[p?.brand] || Object.values(D.brands)[0];
      const isCreateMode = ADM.mode.product === 'create';

      return `${topBar}
        <div class="bento-grid" style="grid-template-columns: 290px minmax(0, 1fr) 330px;">
          <!-- 左栏：商品列表检索 -->
          <section class="pane">
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('bag')}<span>商品主档 (${filtered.length})</span></div>
              <input class="field-input" style="height:26px;width:95px" placeholder="搜商品/SKU…" value="${esc(kw)}" oninput="ADM.filter.shopKw=this.value;ADM.page.shop_prods=1;ADM.render()">
            </div>
            <div class="pane-subbar">
              <div class="chip-group">
                ${cats.map((c) => `<button class="chip-btn ${cat === c ? 'on' : ''}" onclick="ADM.filter.shopCat='${c}';ADM.page.shop_prods=1;ADM.render()">${esc(c)}</button>`).join('')}
              </div>
            </div>
            <div class="pane-bd dense">
              <div class="item-deck">
                ${pg.items.map((it) => `
                  <div class="deck-row ${(!isCreateMode && it.id === p.id) ? 'on' : ''}" onclick="ADM.mode.product='detail';ADM.sel.product='${it.id}';ADM.render()">
                    <div class="deck-thumb">${safeArt(it, 'moxa', 'sage')}</div>
                    <div class="deck-main">
                      <div class="deck-title">${esc(it.short || it.title)}</div>
                      <div class="deck-meta">
                        <span class="c-price bold">¥${it.price}</span>
                        <span>库存 ${it.stock}</span>
                        <span>售 ${XA.wan(it.sales)}</span>
                      </div>
                    </div>
                    <button class="adm-tag ${it.soldOut ? 'red' : 'green'}" onclick="event.stopPropagation();ADM.act.toggleSoldOut('${it.id}')">${it.soldOut ? '售罄' : '在售'}</button>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="pane-ft">${pg.pagerHtml}</div>
          </section>

          <!-- 中栏：主画布（就地展示新建表单或编辑表单，零弹层遮挡） -->
          <section class="pane">
            ${isCreateMode ? `
              <!-- 新增商品就地表单 -->
              <div class="pane-hd" style="background:#f4f8f5">
                <div class="pane-hd-title">${icon('plus')}<span><b>录入新自营商品主档</b></span></div>
                <div class="row gap6">
                  <button class="btn-adm outline sm" onclick="ADM.setMode('product','detail')">取消</button>
                  <button class="btn-adm primary sm" onclick="ADM.act.saveNewProductInline()">确认保存上架</button>
                </div>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="form-grid cols-4">
                  <div class="field col-span-2">
                    <span class="field-label">商品完整标题 *</span>
                    <input class="field-input" id="inp_np_title" placeholder="如：南阳五年陈古法手作纯艾条 (10支装)">
                  </div>
                  <div class="field">
                    <span class="field-label">商品简称 *</span>
                    <input class="field-input" id="inp_np_short" placeholder="如：五年陈艾条">
                  </div>
                  <div class="field">
                    <span class="field-label">商品分类</span>
                    <select class="field-select" id="inp_np_cat">${cats.filter(c => c !== '全部').map(c => `<option value="${c}">${c}</option>`).join('')}</select>
                  </div>
                  <div class="field">
                    <span class="field-label">零售基准价 (¥) *</span>
                    <input type="number" class="field-input" id="inp_np_price" value="68">
                  </div>
                  <div class="field">
                    <span class="field-label">初始现货库存</span>
                    <input type="number" class="field-input" id="inp_np_stock" value="200">
                  </div>
                  <div class="field">
                    <span class="field-label">所属供应链品牌</span>
                    <select class="field-select" id="inp_np_brand">${Object.values(D.brands).map(b => `<option value="${b.id}">${b.name}</option>`).join('')}</select>
                  </div>
                  <div class="field">
                    <span class="field-label">SKU编码</span>
                    <input class="field-input" id="inp_np_code" value="SKU-2026-${String(D.products.length + 1).padStart(3, '0')}">
                  </div>
                </div>

                <div class="mini-box">
                  <span class="field-label">核心卖点（逗号隔开）</span>
                  <input class="field-input" id="inp_np_points" style="margin-top:4px" value="纯手工揉制五年陈艾, 烟微温和不呛, 直透穴位深层温通">
                </div>

                <div class="mini-box">
                  <span class="field-label">商详正文介绍段落</span>
                  <textarea class="field-textarea" id="inp_np_detail" style="height:60px;margin-top:4px">伏牛山传统手作五年陈艾，温经散寒，调养身心。适宜居家常备，穴位温灸渗透力佳。</textarea>
                </div>
              </div>
            ` : `
              <!-- 编辑商品主档 -->
              <div class="pane-hd">
                <div class="pane-hd-title">${icon('settings')}<span>编辑商品 · <b>${esc(p.short)}</b> <code class="tiny faint">(${p.code || p.id})</code></span></div>
                <div class="row gap6">
                  <button class="chip-btn ${p.curated ? 'on' : ''}" onclick="XA.data.product('${p.id}').curated=!XA.data.product('${p.id}').curated;ADM.save('已切换精选标识');ADM.render()">晓艾精选</button>
                  <button class="chip-btn gold ${p.member ? 'on' : ''}" onclick="XA.data.product('${p.id}').member=!XA.data.product('${p.id}').member;ADM.save('已切换会员折');ADM.render()">会员折 (95折/Plus9折)</button>
                  <button class="btn-adm danger sm" onclick="ADM.act.deleteProduct('${p.id}')">删除商品</button>
                </div>
              </div>

              <div class="pane-bd" style="justify-content:space-between">
                <div class="form-grid cols-4">
                  <div class="field col-span-2">
                    <span class="field-label">完整商品标题</span>
                    <input class="field-input" value="${esc(p.title)}" onchange="XA.data.product('${p.id}').title=this.value;ADM.save('已更新标题');ADM.render()">
                  </div>
                  <div class="field">
                    <span class="field-label">商品简称 (卡片/挂车)</span>
                    <input class="field-input" value="${esc(p.short)}" onchange="XA.data.product('${p.id}').short=this.value;ADM.save('已更新简称');ADM.render()">
                  </div>
                  <div class="field">
                    <span class="field-label">商品分类</span>
                    <select class="field-select" onchange="XA.data.product('${p.id}').category=this.value;ADM.save('已更新分类');ADM.render()">
                      ${D.shopCategories.map((c) => `<option value="${c.name}" ${p.category === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                  </div>
                  <div class="field">
                    <span class="field-label">基准零售价 (¥)</span>
                    <input type="number" class="field-input" value="${p.price}" onchange="XA.data.product('${p.id}').price=+this.value;ADM.save('已更新价格');ADM.render()">
                  </div>
                  <div class="field">
                    <span class="field-label">总现货库存量</span>
                    <input type="number" class="field-input" value="${p.stock}" onchange="XA.data.product('${p.id}').stock=+this.value;if(XA.data.product('${p.id}').stock<=0)XA.data.product('${p.id}').soldOut=true;ADM.save('已更新库存');ADM.render()">
                  </div>
                  <div class="field">
                    <span class="field-label">所属入驻品牌</span>
                    <select class="field-select" onchange="XA.data.product('${p.id}').brand=this.value;ADM.save('已切换品牌');ADM.render()">
                      ${Object.values(D.brands).map((br) => `<option value="${br.id}" ${p.brand === br.id ? 'selected' : ''}>${esc(br.name)}</option>`).join('')}
                    </select>
                  </div>
                  <div class="field">
                    <span class="field-label">商品编码 (SKU Code)</span>
                    <input class="field-input" value="${esc(p.code || '')}" onchange="XA.data.product('${p.id}').code=this.value;ADM.save('已更新商品编码')">
                  </div>
                </div>

                <!-- 多规格 SKU 矩阵 -->
                <div class="mini-box">
                  <div class="row between" style="margin-bottom:4px">
                    <span class="field-label">多规格 SKU 与库存矩阵 (基准价 ¥${p.price} + 规格差价 d)</span>
                    <button class="btn-adm outline sm" onclick="ADM.act.addSkuGroup('${p.id}')">+ 新增规格组</button>
                  </div>
                  ${p.specs.map((sp, si) => `
                    <div class="sku-row">
                      <input class="field-input" style="width:68px;height:25px;font-weight:600" value="${esc(sp.name)}" onchange="XA.data.product('${p.id}').specs[${si}].name=this.value;ADM.save('已修改规格名称')">
                      <div class="row gap4 grow" style="flex-wrap:wrap">
                        ${sp.options.map((opt, oi) => `
                          <span class="chip-btn on" style="height:24px;padding:0 6px">
                            <input value="${esc(opt.t)}" style="width:${Math.max(40, opt.t.length * 12)}px;font-size:11px" onchange="XA.data.product('${p.id}').specs[${si}].options[${oi}].t=this.value;ADM.save('已修改规格项');ADM.render()">
                            <small class="c-price">d:</small>
                            <input type="number" value="${opt.d}" style="width:34px;font-size:11px;color:var(--price);font-weight:700" onchange="XA.data.product('${p.id}').specs[${si}].options[${oi}].d=+this.value;ADM.save('已修改差价');ADM.render()">
                            <small class="muted">存:</small>
                            <input type="number" value="${p.specStock?.[`${si}_${oi}`] || 100}" style="width:38px;font-size:11px" onchange="XA.data.product('${p.id}').specStock['${si}_${oi}']=+this.value;ADM.save('已修改SKU库存')">
                            <i onclick="XA.data.product('${p.id}').specs[${si}].options.splice(${oi},1);ADM.save('已删除规格项');ADM.render()" style="cursor:pointer;font-style:normal;margin-left:2px">✕</i>
                          </span>
                        `).join('')}
                        <button class="chip-btn" onclick="ADM.act.addSkuOpt('${p.id}', ${si})">+ 选项</button>
                      </div>
                    </div>
                  `).join('')}
                </div>

                <!-- 体质加权标签 -->
                <div class="mini-box">
                  <span class="field-label">体质调养加权标签（当用户测出对应体质时，首页优先曝光并打上「适合你的体质」）</span>
                  <div class="chip-group" style="margin-top:4px">
                    ${(D.shopTagGroups[1]?.tags || []).map((t) => {
                      const on = p.fit.includes(t);
                      return `<button class="chip-btn ${on ? 'on' : ''}" onclick="ADM.act.toggleProdFit('${p.id}','${t}')">${t}</button>`;
                    }).join('')}
                  </div>
                </div>

                <div class="form-grid">
                  <div class="field">
                    <span class="field-label">核心卖点（每行一条）</span>
                    <textarea class="field-textarea" style="height:50px" onchange="XA.data.product('${p.id}').points=this.value.split('\\n').map(s=>s.trim()).filter(Boolean);ADM.save('已更新卖点')">${esc((p.points || []).join('\n'))}</textarea>
                  </div>
                  <div class="field">
                    <span class="field-label">商详正文段落（每行一段）</span>
                    <textarea class="field-textarea" style="height:50px" onchange="XA.data.product('${p.id}').detail=this.value.split('\\n').map(s=>s.trim()).filter(Boolean);ADM.save('已更新正文')">${esc((p.detail || []).join('\n'))}</textarea>
                  </div>
                </div>
              </div>
            `}
          </section>

          <!-- 右栏：侧边操作与预览面板 (Side Panel) -->
          <section class="pane">
            <div class="pane-hd"><div class="pane-hd-title">${icon('image')}<span>货架卡片实时预览</span></div></div>
            <div class="pane-bd" style="justify-content:center;align-items:center;background:#f2f4f2">
              <div style="width:230px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:var(--shadow-md)">
                <div style="height:150px;position:relative">${safeArt(p, 'moxa', 'sage')}</div>
                <div style="padding:10px">
                  <div class="row gap6"><span class="c-price bold" style="font-size:17px">¥${XA.memberPrice(p, XA.defaultOpts(p))}</span><span class="adm-tag gold">会员价</span></div>
                  <div class="bold" style="margin-top:4px;font-size:12.5px;line-height:1.4">${esc(p.title)}</div>
                  <div class="tiny muted" style="margin-top:4px">${(p.points || []).slice(0, 2).map((pt) => `✓ ${esc(pt)}`).join('<br>')}</div>
                  <div class="row between" style="margin-top:8px;padding-top:6px;border-top:1px solid var(--line-soft)">
                    <span class="adm-tag orange">晓艾精选</span>
                    <span class="tiny faint">${esc(b.name)} ｜ 销 ${XA.wan(p.sales)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="pane-ft">
              <button class="btn-adm ${p.soldOut ? 'warm' : 'danger'} sm grow" onclick="ADM.act.toggleSoldOut('${p.id}')">${p.soldOut ? '一键恢复现货上架' : '紧急下架（设为已售罄）'}</button>
            </div>
          </section>
        </div>
      `;
    }

    // 2.2 多级分类与多维标签管理（左右双侧边面板就地组合，零弹层）
    if (sub === 'categories') {
      return `${topBar}
        <div class="bento-grid" style="grid-template-columns: 1.15fr 1fr;">
          <!-- 一级与二级分类管理 -->
          <section class="pane">
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('doc')}<span>商城商品多级分类配置 (${D.shopCategories.length})</span></div>
            </div>
            <div class="pane-subbar">
              <div class="row gap6" style="width:100%">
                <input class="field-input grow" id="in_new_cat_name" placeholder="输入新一级分类名称（如：本草养生洗护）…">
                <button class="btn-adm primary sm" onclick="ADM.act.addCategoryInline()">+ 添加一级分类</button>
              </div>
            </div>
            <div class="pane-bd dense">
              <div class="item-deck">
                ${D.shopCategories.map((c, ci) => `
                  <div class="mini-box col gap6">
                    <div class="row between">
                      <div class="row gap6">
                        <span class="adm-tag green">类目 ${ci + 1}</span>
                        <input class="field-input bold" style="height:26px;width:120px" value="${esc(c.name)}" onchange="XA.data.shopCategories[${ci}].name=this.value;ADM.save('已修改类目名称');ADM.render()">
                      </div>
                      <div class="row gap4">
                        <button class="chip-btn ${c.enabled ? 'on' : ''}" onclick="XA.data.shopCategories[${ci}].enabled=!XA.data.shopCategories[${ci}].enabled;ADM.save('已切换分类状态');ADM.render()">${c.enabled ? '前台展示' : '已隐藏'}</button>
                        <button class="icon-btn" onclick="ADM.act.deleteCategory(${ci})">✕</button>
                      </div>
                    </div>
                    <div class="row gap4" style="flex-wrap:wrap">
                      <span class="tiny faint">包含二级子类：</span>
                      ${(c.sub || []).map((sb, sbi) => `
                        <span class="chip-btn">
                          <input value="${esc(sb)}" style="width:${Math.max(30, sb.length * 12)}px;font-size:11px" onchange="XA.data.shopCategories[${ci}].sub[${sbi}]=this.value;ADM.save('已更新子分类')">
                          <i onclick="XA.data.shopCategories[${ci}].sub.splice(${sbi},1);ADM.save('已删除子类');ADM.render()" style="cursor:pointer;font-style:normal;margin-left:2px">✕</i>
                        </span>
                      `).join('')}
                      <span class="row gap2">
                        <input class="field-input" id="in_sub_${ci}" style="height:24px;width:80px;font-size:11px" placeholder="+ 子类回车" onkeydown="if(event.key==='Enter'&&this.value.trim()){D.shopCategories[${ci}].sub.push(this.value.trim());this.value='';ADM.save('已新增子类');ADM.render()}">
                      </span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>

          <!-- 4 大多维标签管理组 -->
          <section class="pane">
            <div class="pane-hd"><div class="pane-hd-title">${icon('ticket')}<span>4 大商品标签组与属性维护</span></div></div>
            <div class="pane-bd dense">
              <div class="col gap8">
                ${D.shopTagGroups.map((tg, tgi) => `
                  <div class="mini-box col gap4">
                    <div class="row between">
                      <b>${esc(tg.group)}</b>
                      <div class="row gap4">
                        <input class="field-input" id="in_tag_${tgi}" style="height:24px;width:95px;font-size:11px" placeholder="+ 标签回车" onkeydown="if(event.key==='Enter'&&this.value.trim()){D.shopTagGroups[${tgi}].tags.push(this.value.trim());this.value='';ADM.save('已新增标签');ADM.render()}">
                      </div>
                    </div>
                    <div class="chip-group">
                      ${tg.tags.map((t, ti) => `
                        <span class="chip-btn on">
                          ${esc(t)}
                          <i onclick="XA.data.shopTagGroups[${tgi}].tags.splice(${ti},1);ADM.save('已删除标签');ADM.render()" style="cursor:pointer;font-style:normal;margin-left:3px">✕</i>
                        </span>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        </div>
      `;
    }

    // 2.3 订单履约与客服处置（右侧侧边面板承载客服录单与备忘，零弹层）
    if (sub === 'orders') {
      const stFilter = ADM.filter.orderSt || 'all';
      const kw = (ADM.filter.orderKw || '').trim();
      const list = s.orders.filter((o) => (stFilter === 'all' || o.status === stFilter) && (!kw || (o.id + (o.buyer?.name || '') + (o.buyer?.phone || '')).includes(kw)));
      const pg = ADM.paginate(list, 'shop_orders', 6);
      const curOid = ADM.sel.order && s.orders.some((o) => o.id === ADM.sel.order) ? ADM.sel.order : (pg.items[0]?.id || s.orders[0]?.id);
      ADM.sel.order = curOid;
      const curOrder = s.orders.find((o) => o.id === curOid) || s.orders[0];
      const isCreateOrder = ADM.mode.order === 'create';

      return `${topBar}
        <div class="bento-grid" style="grid-template-columns: 300px minmax(0, 1fr) 340px;">
          <!-- 订单列表 -->
          <section class="pane">
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('receipt')}<span>订单列表 (${list.length})</span></div>
              <input class="field-input" style="height:26px;width:100px" placeholder="单号/买家…" value="${esc(kw)}" oninput="ADM.filter.orderKw=this.value;ADM.page.shop_orders=1;ADM.render()">
            </div>
            <div class="pane-subbar">
              <div class="chip-group">
                ${[['all', '全部'], ['unpaid','待付款'], ['toship', '待发货'], ['shipped', '已发货'], ['done', '已完成'], ['refunding','退款审核中'], ['refunded', '已退款']].map(([k, l]) => `<button class="chip-btn ${stFilter === k ? 'on' : ''}" onclick="ADM.filter.orderSt='${k}';ADM.page.shop_orders=1;ADM.render()">${l}</button>`).join('')}
              </div>
            </div>
            <div class="pane-bd dense">
              <div class="item-deck">
                ${pg.items.map((o) => `
                  <div class="deck-row ${(!isCreateOrder && o.id === curOrder?.id) ? 'on' : ''}" onclick="ADM.mode.order='detail';ADM.sel.order='${o.id}';ADM.render()">
                    <div class="deck-main">
                      <div class="row between">
                        <b>${esc(o.id)}</b>
                        <span class="adm-tag ${o.status === 'toship' ? 'orange' : o.status === 'shipped' ? 'blue' : o.status === 'done' ? 'green' : 'gray'}">${o.status === 'toship' ? '待发货' : o.status === 'shipped' ? '已发货' : o.status === 'done' ? '已完成' : o.status === 'refunding' ? '退款审核中' : o.status === 'unpaid' ? '待付款' : '已退款'}</span>
                      </div>
                      <div class="deck-meta">
                        <span class="c-price bold">¥${XA.money(o.amount)}</span>
                        <span>买家：${esc(o.buyer?.name)}</span>
                        <span>${XA.d.md(new Date(o.at))}</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="pane-ft">${pg.pagerHtml}</div>
          </section>

          <!-- 订单客服详情与履约改单 -->
          <section class="pane">
            ${curOrder ? `
              <div class="pane-hd">
                <div class="pane-hd-title">${icon('settings')}<span>订单详情 · <b>${esc(curOrder.id)}</b></span></div>
                <div class="row gap4">
                  <span class="tiny faint">下单时间：${XA.d.full(curOrder.at)}</span>
                  <button class="btn-adm danger sm" onclick="ADM.act.cancelOrder('${curOrder.id}')">发起售后</button>
                </div>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <!-- 收件人信息 -->
                <div class="mini-box">
                  <div class="row between"><span class="field-label">买家收件信息</span><button class="btn-adm outline sm" onclick="ADM.act.editOrderBuyer('${curOrder.id}')">修改收件信息</button></div>
                  <div class="form-grid cols-3" style="margin-top:6px">
                    <div class="field">
                      <span class="field-label">收货人姓名</span>
                      <input class="field-input" value="${esc(curOrder.buyer?.name)}" readonly>
                    </div>
                    <div class="field">
                      <span class="field-label">联系电话</span>
                      <input class="field-input" value="${esc(curOrder.buyer?.phone)}" readonly>
                    </div>
                    <div class="field col-span-2">
                      <span class="field-label">详细配送地址</span>
                      <input class="field-input" value="${esc(curOrder.buyer?.address)}" readonly>
                    </div>
                  </div>
                </div>

                <!-- 商品清单 -->
                <div class="mini-box">
                  <span class="field-label">订购商品清单 (${(curOrder.items || []).length} 项)</span>
                  <div class="col gap4" style="margin-top:4px">
                    ${(curOrder.items || []).map((it) => {
                      const prod = D.product(it.pid);
                      return `<div class="row between tiny">
                        <span><b>${esc(it.title || prod?.short || it.pid)}</b> <span class="faint">(${esc(it.specLabel ?? (prod ? XA.specLabel(prod,it.opts) : ""))})</span></span>
                        <span>¥${XA.money(it.price)} × ${it.qty} ＝ <b>¥${XA.money(it.price * it.qty)}</b></span>
                      </div>`;
                    }).join('')}
                    <div class="row between tiny" style="border-top:1px dashed var(--line);padding-top:4px;margin-top:2px">
                      <span class="faint">商品 ¥${XA.money(curOrder.goods)} ｜ 运费 ¥${curOrder.freight} ｜ 优惠 -¥${curOrder.off}</span>
                      <span>${curOrder.status==="unpaid"?"待付总额":"实付总额"}：<b class="c-price" style="font-size:13px">¥${XA.money(curOrder.amount)}</b> ｜ 赠送积分：${curOrder.points}</span>
                    </div>
                  </div>
                </div>

                <!-- 物流打单 -->
                <div class="mini-box">
                  <span class="field-label">物流配送与运单号</span>
                  <div class="row gap8" style="margin-top:6px">
                    <input class="field-input" style="width:110px" value="${esc(curOrder.logistics?.company || '顺丰速运')}" readonly>
                    <input class="field-input grow" placeholder="输入快递运单号…" value="${esc(curOrder.logistics?.trackNo || '')}" readonly>
                    ${curOrder.status === 'toship' ? `<button class="btn-adm primary sm" onclick="ADM.act.quickShip('${curOrder.id}')">填写物流并发货</button>` : ''}
                  </div>
                </div>
              </div>
            ` : '<div class="pane-bd center muted">暂无订单</div>'}
          </section>

          <!-- 右栏：侧边面板（支持代客快速录单或客服跟单工作台，零弹层） -->
          <section class="pane">
            ${isCreateOrder ? `
              <!-- 侧边面板：代客录单模式 -->
              <div class="pane-hd" style="background:#f4f8f5">
                <div class="pane-hd-title">${icon('plus')}<span><b>代客快速录单</b></span></div>
                <button class="btn-adm outline sm" onclick="ADM.setMode('order','detail')">返回</button>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="col gap6">
                  <div class="field">
                    <span class="field-label">选择购买商品</span>
                    <select class="field-select" id="sp_o_pid">${D.products.map(p => `<option value="${p.id}">${p.short} (¥${p.price})</option>`).join('')}</select>
                  </div>
                  <div class="field">
                    <span class="field-label">订购数量</span>
                    <input type="number" class="field-input" id="sp_o_qty" value="1" min="1">
                  </div>
                  <div class="field">
                    <span class="field-label">买家姓名 *</span>
                    <input class="field-input" id="sp_o_name" placeholder="如：张阿姨">
                  </div>
                  <div class="field">
                    <span class="field-label">联系电话 *</span>
                    <input class="field-input" id="sp_o_phone" placeholder="如：138****0001">
                  </div>
                  <div class="field">
                    <span class="field-label">详细配送地址 *</span>
                    <input class="field-input" id="sp_o_addr" placeholder="如：浙江省杭州市西湖区文三路 108 号">
                  </div>
                </div>
                <button class="btn-adm primary" style="width:100%" onclick="ADM.act.saveNewOrderInline()">确认创建并生成订单</button>
              </div>
            ` : `
              <!-- 侧边面板：客服工作备忘与处置动作 -->
              <div class="pane-hd"><div class="pane-hd-title">${icon('headset')}<span>客服跟单备忘 (${(curOrder?.csNotes || []).length})</span></div></div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="item-deck">
                  ${(curOrder?.csNotes || []).map((n, ni) => `
                    <div class="mini-box col gap2 tiny">
                      <div class="row between">
                        <b>${esc(n.user)}</b>
                        <div class="row gap4">
                          <span class="faint">${esc(n.at)}</span>
                          <i  style="cursor:pointer;font-style:normal">✕</i>
                        </div>
                      </div>
                      <div class="muted">${esc(n.text)}</div>
                    </div>
                  `).join('')}
                </div>
                <div class="mini-box">
                  <span class="field-label">新增客服备忘记录</span>
                  <div class="row gap4" style="margin-top:4px">
                    <input class="field-input grow" id="csNoteInput" placeholder="输入客户沟通备忘…" onkeydown="if(event.key==='Enter')ADM.act.addCsNote('${curOrder?.id}')">
                    <button class="btn-adm primary sm" onclick="ADM.act.addCsNote('${curOrder?.id}')">保存</button>
                  </div>
                </div>
              </div>
              <div class="pane-ft">
                ${(curOrder?.status === 'toship' || curOrder?.status === 'shipped')
                  ? `<button class="btn-adm danger sm grow" onclick="ADM.act.quickRefund('${curOrder?.id}')">客服发起仅退款并拦截</button>`
                  : `<span class="tiny faint">该订单状态已闭环</span>`}
              </div>
            `}
          </section>
        </div>
      `;
    }

    // 2.4 售后仅退款审核与拦截（右侧侧边面板集成售后建单与审核处置，零弹层）
    if (sub === 'refunds') {
      const stFilter = ADM.filter.refundSt || 'all';
      const kw = (ADM.filter.refundKw || '').trim();
      const list = (D.refunds || []).filter((rf) => (stFilter === 'all' || rf.status === stFilter) && (!kw || (rf.id + rf.orderId + rf.applicant).includes(kw)));
      const pg = ADM.paginate(list, 'shop_refunds', 6);
      const isCreateRefund = ADM.mode.refund === 'create';
      const orders = S().orders.filter((o) => o.status !== 'refunded');

      return `${topBar}
        <div class="bento-grid" style="grid-template-columns: minmax(0, 1.3fr) 380px;">
          <!-- 售后单列表 -->
          <section class="pane">
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('shield')}<span>售后退款单中心 (${list.length})</span></div>
              <div class="row gap6">
                <div class="chip-group">
                  ${[['all', '全部'], ['pending', '待审核'], ['approved', '已退款'], ['rejected', '已驳回']].map(([k, l]) => `<button class="chip-btn ${stFilter === k ? 'on' : ''}" onclick="ADM.filter.refundSt='${k}';ADM.page.shop_refunds=1;ADM.render()">${l}</button>`).join('')}
                </div>
                <input class="field-input" style="height:26px;width:110px" placeholder="单号/申请人…" value="${esc(kw)}" oninput="ADM.filter.refundKw=this.value;ADM.page.shop_refunds=1;ADM.render()">
              </div>
            </div>
            <div class="pane-bd dense">
              <div class="item-deck">
                ${pg.items.map((rf) => `
                  <div class="mini-box row between gap12">
                    <div class="grow ell">
                      <div class="row gap8">
                        <span class="adm-tag ${rf.status === 'pending' ? 'orange' : rf.status === 'approved' ? 'green' : 'red'}">${rf.status === 'pending' ? '待审核' : rf.status === 'approved' ? '已退款' : '已驳回'}</span>
                        <b>${esc(rf.id)}</b>
                        <span>关联订单：<code>${esc(rf.orderId)}</code></span>
                        <span class="c-price bold">¥${XA.money(rf.amount)}</span>
                        <span>扣回积分：${rf.pointsDeduct}</span>
                      </div>
                      <div class="tiny muted" style="margin-top:3px">申请人：${esc(rf.applicant)} (${esc(rf.phone)}) ｜ 原因：<b>${esc(rf.reason)}</b> ｜ ${XA.d.full(rf.createdAt)}</div>
                    </div>
                    <div class="row gap4">
                      ${rf.status === 'pending' ? `
                        <button class="btn-adm danger sm" onclick="ADM.act.approveRefund('${rf.id}', true)">同意退款</button>
                        <button class="btn-adm outline sm" onclick="ADM.act.approveRefund('${rf.id}', false)">驳回</button>
                      ` : `<span class="tiny faint">${esc(rf.auditNotes || '已处理')}</span>`}
                      <button class="icon-btn" onclick="ADM.act.deleteRefund('${rf.id}')">✕</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="pane-ft">${pg.pagerHtml}</div>
          </section>

          <!-- 右侧面板：代客新建售后单 或 处置指引（零弹层） -->
          <section class="pane">
            ${isCreateRefund ? `
              <div class="pane-hd" style="background:#f4f8f5">
                <div class="pane-hd-title">${icon('plus')}<span><b>代客发起售后退款</b></span></div>
                <button class="btn-adm outline sm" onclick="ADM.setMode('refund','detail')">返回</button>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="col gap6">
                  <div class="field">
                    <span class="field-label">关联订单</span>
                    <select class="field-select" id="sp_rf_oid">${orders.map((o) => `<option value="${o.id}">${o.id} - ${o.buyer?.name} (¥${XA.money(o.amount)})</option>`).join('')}</select>
                  </div>
                  <div class="field">
                    <span class="field-label">退款金额 (¥)</span>
                    <input type="number" class="field-input" id="sp_rf_amount" value="59">
                  </div>
                  <div class="field">
                    <span class="field-label">退款类型</span>
                    <select class="field-select" id="sp_rf_type"><option value="仅退款">仅退款 (未发货/拦截)</option><option value="退货退款">退货退款 (已签收)</option></select>
                  </div>
                  <div class="field">
                    <span class="field-label">退款原因说明 *</span>
                    <input class="field-input" id="sp_rf_reason" placeholder="如：买家多拍/协商一致退款">
                  </div>
                </div>
                <button class="btn-adm primary" style="width:100%" onclick="ADM.act.saveNewRefundInline()">确认生成售后工单</button>
              </div>
            ` : `
              <div class="pane-hd"><div class="pane-hd-title">${icon('shield')}<span>售后退款规程指南</span></div></div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="mini-box col gap4 tiny">
                  <b>原路退回规则</b>
                  <div class="muted">1. 未发货订单：客服同意后资金立即原路退回微信账户，订单自动标记为已退款。</div>
                  <div class="muted">2. 积分与成长值：同意退款时自动从申请人账户扣回发货赠送的等额积分。</div>
                  <div class="muted">3. 财务出账：自动在财务流水中写入一笔负向出账记录，对账清晰。</div>
                </div>
                <button class="btn-adm tonal" style="width:100%" onclick="ADM.setMode('refund','create')">+ 代客发起新售后单</button>
              </div>
            `}
          </section>
        </div>
      `;
    }

    // 2.5 入驻品牌供应链准入（右侧面板承载质检证照添加与资质管控，零弹层）
    const brandList = Object.values(D.brands);
    const curBrandId = ADM.sel.brand && D.brands[ADM.sel.brand] ? ADM.sel.brand : brandList[0]?.id;
    ADM.sel.brand = curBrandId;
    const br = D.brands[curBrandId] || brandList[0];
    const isCreateBrand = ADM.mode.brand === 'create';

    return `${topBar}
      <div class="bento-grid" style="grid-template-columns: 280px minmax(0, 1fr) 350px;">
        <section class="pane">
          <div class="pane-hd">
            <div class="pane-hd-title">${icon('shield')}<span>入驻品牌池 (${brandList.length})</span></div>
          </div>
          <div class="pane-bd dense">
            <div class="item-deck">
              ${brandList.map((it) => `
                <div class="deck-row ${(!isCreateBrand && it.id === br.id) ? 'on' : ''}" onclick="ADM.mode.brand='detail';ADM.sel.brand='${it.id}';ADM.render()">
                  <div class="deck-thumb">${safeArt(it, 'leaf', 'sage')}</div>
                  <div class="deck-main">
                    <div class="deck-title">${esc(it.name)}</div>
                    <div class="deck-meta"><span>${esc(it.city)}</span><span>评分 ${it.rating}</span><span>商品 ${D.products.filter((p) => p.brand === it.id).length}</span></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </section>

        <!-- 中栏：品牌编辑或新建主档 -->
        <section class="pane">
          ${isCreateBrand ? `
            <div class="pane-hd" style="background:#f4f8f5">
              <div class="pane-hd-title">${icon('plus')}<span><b>录入新合作品牌主档</b></span></div>
              <div class="row gap6">
                <button class="btn-adm outline sm" onclick="ADM.setMode('brand','detail')">取消</button>
                <button class="btn-adm primary sm" onclick="ADM.act.saveNewBrandInline()">确认保存品牌</button>
              </div>
            </div>
            <div class="pane-bd" style="justify-content:space-between">
              <div class="form-grid cols-3">
                <div class="field">
                  <span class="field-label">品牌名称 *</span>
                  <input class="field-input" id="inp_nb_name" placeholder="如：伏牛艾草堂">
                </div>
                <div class="field">
                  <span class="field-label">所在地</span>
                  <input class="field-input" id="inp_nb_city" value="河南南阳">
                </div>
                <div class="field">
                  <span class="field-label">创立年份</span>
                  <input type="number" class="field-input" id="inp_nb_since" value="2020">
                </div>
                <div class="field col-span-3">
                  <span class="field-label">品牌主张 (Slogan)</span>
                  <input class="field-input" id="inp_nb_slogan" value="伏牛纯艾，守候常温">
                </div>
                <div class="field col-span-3">
                  <span class="field-label">原料产地说明</span>
                  <input class="field-input" id="inp_nb_origin" value="河南南阳伏牛山脉野生陈艾种植带">
                </div>
                <div class="field col-span-3">
                  <span class="field-label">生产厂房与质检流程</span>
                  <input class="field-input" id="inp_nb_factory" value="标准十万级净化车间，农残重金属无检出">
                </div>
                <div class="field col-span-3">
                  <span class="field-label">品牌故事正文</span>
                  <textarea class="field-textarea" id="inp_nb_story" style="height:60px">传承传统非遗古法陈化工艺，只选五年陈纯艾绒。</textarea>
                </div>
              </div>
            </div>
          ` : `
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('settings')}<span>编辑品牌主档 · <b>${esc(br.name)}</b></span></div>
              <button class="btn-adm danger sm" onclick="ADM.act.deleteBrand('${br.id}')">删除品牌</button>
            </div>
            <div class="pane-bd" style="justify-content:space-between">
              <div class="form-grid cols-3">
                <div class="field">
                  <span class="field-label">品牌名称</span>
                  <input class="field-input" value="${esc(br.name)}" onchange="XA.data.brands['${br.id}'].name=this.value;ADM.save('已更新品牌名');ADM.render()">
                </div>
                <div class="field">
                  <span class="field-label">所在地</span>
                  <input class="field-input" value="${esc(br.city)}" onchange="XA.data.brands['${br.id}'].city=this.value;ADM.save('已更新城市')">
                </div>
                <div class="field">
                  <span class="field-label">创立年份</span>
                  <input type="number" class="field-input" value="${br.since}" onchange="XA.data.brands['${br.id}'].since=+this.value;ADM.save('已更新年份')">
                </div>
                <div class="field col-span-3">
                  <span class="field-label">品牌主张 (Slogan)</span>
                  <input class="field-input" value="${esc(br.slogan)}" onchange="XA.data.brands['${br.id}'].slogan=this.value;ADM.save('已更新Slogan')">
                </div>
                <div class="field col-span-3">
                  <span class="field-label">原料产地与供应链源头说明</span>
                  <input class="field-input" value="${esc(br.origin)}" onchange="XA.data.brands['${br.id}'].origin=this.value;ADM.save('已更新原料产地')">
                </div>
                <div class="field col-span-3">
                  <span class="field-label">生产厂房与驻场质检流程</span>
                  <input class="field-input" value="${esc(br.factory)}" onchange="XA.data.brands['${br.id}'].factory=this.value;ADM.save('已更新工厂质检')">
                </div>
                <div class="field col-span-3">
                  <span class="field-label">品牌故事正文</span>
                  <textarea class="field-textarea" style="height:50px" onchange="XA.data.brands['${br.id}'].story=this.value;ADM.save('已更新品牌故事')">${esc(br.story)}</textarea>
                </div>
              </div>
            </div>
          `}
        </section>

        <!-- 右栏：侧边面板（资质证照与质检添加，零弹层） -->
        <section class="pane">
          <div class="pane-hd">
            <div class="pane-hd-title">${icon('doc')}<span>营业资质与质检报告 (${br.certs.length})</span></div>
          </div>
          <div class="pane-bd dense" style="justify-content:space-between">
            <div class="item-deck">
              ${br.certs.map((c, ci) => `
                <div class="mini-box col gap2 tiny">
                  <div class="row between"><b>${esc(c.name)}</b><button class="icon-btn" onclick="XA.data.brands['${br.id}'].certs.splice(${ci},1);ADM.save('已删除证照');ADM.render()">✕</button></div>
                  <div class="muted">机构：${esc(c.org)} ｜ 检验时间：${esc(c.at)}</div>
                  <div class="faint">编号：${esc(c.no)}</div>
                </div>
              `).join('')}
            </div>

            <!-- 侧边面板内联新增质检单 -->
            <div class="mini-box col gap4">
              <span class="field-label">直接录入新质检单</span>
              <input class="field-input" id="sp_cert_name" style="height:26px" placeholder="证书名称 (如：有机农残质检报告)">
              <div class="row gap4">
                <input class="field-input grow" id="sp_cert_org" style="height:26px" placeholder="机构 (华测/CQC)">
                <input class="field-input" id="sp_cert_no" style="height:26px;width:100px" placeholder="编号">
              </div>
              <button class="btn-adm outline sm" onclick="ADM.act.addCertInline('${br.id}')">+ 添加质检单至该品牌</button>
            </div>

            <div class="mini-box row between">
              <span class="tiny c-price">质量问题一键熔断</span>
              <button class="btn-adm danger sm" onclick="ADM.act.pauseBrandProds('${br.id}')">一键下架该品牌商品</button>
            </div>
          </div>
        </section>
      </div>
    `;
  };

  /* ============================================================================
   * 业务动作执行 (无需弹层，就地保存生效)
   * ============================================================================ */
  ADM.act.saveNewProductInline = () => {
    const title = (document.getElementById('inp_np_title')?.value || '').trim();
    const short = (document.getElementById('inp_np_short')?.value || '').trim();
    if (!title || !short) return ADM.toast('请填写完整商品标题与简称');
    const price = +document.getElementById('inp_np_price')?.value || 68;
    const stock = +document.getElementById('inp_np_stock')?.value || 100;
    const cat = document.getElementById('inp_np_cat')?.value || '艾灸用品';
    const brand = document.getElementById('inp_np_brand')?.value || Object.keys(D.brands)[0];
    const code = document.getElementById('inp_np_code')?.value || '';
    const points = (document.getElementById('inp_np_points')?.value || '').split(/[,，]/).map(s => s.trim()).filter(Boolean);
    const detail = (document.getElementById('inp_np_detail')?.value || '').split('\n').map(s => s.trim()).filter(Boolean);
    const id = 'p' + (D.products.length + 1);
    D.products.unshift({
      id, title, short, kw: short + ' ' + title, category: cat, brand,
      price, unit: '盒', sales: 0, stock, soldOut: false, curated: true, member: true, code,
      points, detail, fit: ['阳虚质', '气虚质', '血瘀质'],
      art: [ART_SHAPES[D.products.length % ART_SHAPES.length], ART_TONES[D.products.length % ART_TONES.length]],
      specs: [{ name: '规格', options: [{ t: '标准盒装 (10支)', d: 0 }, { t: '实惠疗程装 (30支)', d: 70 }] }],
      specStock: { '0_0': stock, '0_1': Math.floor(stock / 2) },
    });
    ADM.sel.product = id;
    ADM.mode.product = 'detail';
    ADM.save(`已成功新增商品「${short}」`);
    ADM.render();
  };

  ADM.act.deleteProduct = (pid) => {
    const p = D.product(pid);
    if (!p) return;
    const idx = D.products.findIndex((x) => x.id === pid);
    if (idx !== -1) {
      D.products.splice(idx, 1);
      ADM.sel.product = D.products[0]?.id;
      ADM.save(`已删除商品「${p.short}」`);
      ADM.render();
    }
  };

  ADM.act.toggleSoldOut = (pid) => {
    const p = D.product(pid);
    if (!p) return;
    p.soldOut = !p.soldOut;
    if (p.soldOut) p.stock = 0;
    else if (p.stock <= 0) p.stock = 100;
    ADM.save(p.soldOut ? `已将「${p.short}」设为售罄下架` : `已恢复「${p.short}」现货在售`);
    ADM.render();
  };

  ADM.act.addSkuGroup = (pid) => {
    const p = D.product(pid);
    if (!p) return;
    p.specs = p.specs || [];
    p.specs.push({ name: '疗程装', options: [{ t: '单盒装', d: 0 }, { t: '3盒疗程装', d: 100 }] });
    ADM.save('已添加规格组');
    ADM.render();
  };

  ADM.act.addSkuOpt = (pid, si) => {
    const p = D.product(pid);
    if (!p || !p.specs[si]) return;
    p.specs[si].options.push({ t: '5盒囤货装', d: 150 });
    ADM.save('已添加规格选项');
    ADM.render();
  };

  ADM.act.toggleProdFit = (pid, t) => {
    const p = D.product(pid);
    if (!p) return;
    p.fit = p.fit || [];
    const idx = p.fit.indexOf(t);
    if (idx !== -1) p.fit.splice(idx, 1);
    else p.fit.push(t);
    ADM.save('已更新适宜体质标签');
    ADM.render();
  };

  ADM.act.addCategoryInline = () => {
    const inp = document.getElementById('in_new_cat_name');
    const val = (inp?.value || '').trim();
    if (!val) return ADM.toast('请输入分类名称');
    const id = 'cat_' + Date.now().toString().slice(-4);
    D.shopCategories.push({ id, name: val, sub: ['常规热敷', '理疗精油'], sort: D.shopCategories.length + 1, enabled: true });
    inp.value = '';
    ADM.save(`已新增一级分类「${val}」`);
    ADM.render();
  };

  ADM.act.deleteCategory = (ci) => {
    const cat = D.shopCategories[ci];
    if (!cat) return;
    D.shopCategories.splice(ci, 1);
    ADM.save(`已删除一级分类「${cat.name}」`);
    ADM.render();
  };

  ADM.act.saveNewOrderInline = () => {
    const pid = document.getElementById('sp_o_pid')?.value;
    const qty = +document.getElementById('sp_o_qty')?.value || 1;
    const name = (document.getElementById('sp_o_name')?.value || '').trim();
    const phone = (document.getElementById('sp_o_phone')?.value || '').trim();
    const addr = (document.getElementById('sp_o_addr')?.value || '').trim();
    if (!name || !phone || !addr) return ADM.toast('请填写完整的收件人姓名、电话和地址');
    const p = D.product(pid);
    const amount = (p?.price || 68) * qty;
    const oid = 'XA' + Date.now().toString().slice(-8);
    const newOrder = {
      id: oid, status: 'toship',
      items: [{ pid, opts: [0], qty, price: p?.price || 68 }],
      goods: amount, freight: 0, off: 0, amount, points: amount, growth: amount, source: 'manual',
      buyer: { name, phone, address: addr },
      logistics: { company: '顺丰速运', trackNo: '' },
      csNotes: [{ at: XA.d.full(new Date().toISOString()), user: '客服专员', text: '客服侧边面板代客手工录单。' }],
      at: new Date().toISOString(),
    };
    S().orders.unshift(newOrder);
    ADM.sel.order = oid;
    ADM.mode.order = 'detail';
    ADM.save(`已成功代客录单 ${oid}`);
    ADM.render();
  };

  ADM.act.cancelOrder = (oid) => {
    const o = S().orders.find((x) => x.id === oid);
    if (!o) return;
    o.status = 'closed';
    ADM.save(`已关闭订单 ${oid}`);
    ADM.render();
  };

  ADM.act.quickShip = (oid) => {
    const o = S().orders.find((x) => x.id === oid);
    if (!o) return;
    o.status = 'shipped';
    o.logistics = o.logistics || {};
    o.logistics.company = '顺丰速运';
    o.logistics.trackNo = 'SF' + Date.now().toString().slice(-10);
    ADM.save(`订单 ${oid} 已登记物流发货，单号：${o.logistics.trackNo}`);
    ADM.render();
  };

  ADM.act.shipAll = () => {
    const toship = S().orders.filter((o) => o.status === 'toship');
    if (!toship.length) return ADM.toast('暂无待发货订单');
    toship.forEach((o, i) => {
      o.status = 'shipped';
      o.logistics = { company: '顺丰速运', trackNo: 'SF' + (Date.now() + i).toString().slice(-10) };
    });
    ADM.save(`已批量为 ${toship.length} 笔订单生成顺丰单号并标记发货`);
    ADM.render();
  };

  ADM.act.addCsNote = (oid) => {
    const inp = document.getElementById('csNoteInput');
    const val = (inp?.value || '').trim();
    if (!val) return ADM.toast('请输入备忘内容');
    const o = S().orders.find((x) => x.id === oid);
    if (!o) return;
    o.csNotes = o.csNotes || [];
    o.csNotes.push({ at: XA.d.full(new Date().toISOString()), user: '客服专员', text: val });
    ADM.save('已记录客服备忘');
    ADM.render();
  };

  ADM.act.quickRefund = (oid) => {
    const o = S().orders.find((x) => x.id === oid);
    if (!o) return;
    o.status = 'refunded';
    const rfid = 'RF' + Date.now().toString().slice(-8);
    D.refunds = D.refunds || [];
    D.refunds.unshift({
      id: rfid, orderId: o.id, type: '仅退款', reason: '客服拦截取消',
      amount: o.amount, pointsDeduct: o.points || 0, status: 'approved',
      applicant: o.buyer?.name || '顾客', phone: o.buyer?.phone || '',
      createdAt: new Date().toISOString(), auditNotes: '客服工作台一键拦截发起并原路退回。',
    });
    D.financeLedger = D.financeLedger || [];
    D.financeLedger.unshift({
      id: 'FIN' + Date.now().toString().slice(-6), type: '售后退款', channel: '微信支付原路退回',
      ref: rfid, amount: -o.amount, fee: 0, net: -o.amount, status: '已退款', at: XA.d.full(new Date().toISOString()),
    });
    ADM.save(`已拦截订单 ${oid} 并完成原路退款`);
    ADM.render();
  };

  ADM.act.saveNewRefundInline = () => {
    const orderId = document.getElementById('sp_rf_oid')?.value;
    const amount = +document.getElementById('sp_rf_amount')?.value || 59;
    const type = document.getElementById('sp_rf_type')?.value;
    const reason = (document.getElementById('sp_rf_reason')?.value || '').trim();
    if (!reason) return ADM.toast('请填写退款原因');
    const o = S().orders.find((x) => x.id === orderId);
    const rfid = 'RF' + Date.now().toString().slice(-8);
    D.refunds = D.refunds || [];
    D.refunds.unshift({
      id: rfid, orderId, type, reason, amount,
      pointsDeduct: Math.round(amount), status: 'pending',
      applicant: o?.buyer?.name || '顾客', phone: o?.buyer?.phone || '',
      createdAt: new Date().toISOString(), auditNotes: '',
    });
    ADM.mode.refund = 'detail';
    ADM.save(`已在侧边面板生成售后工单 ${rfid}`);
    ADM.render();
  };

  ADM.act.approveRefund = (rfId, pass) => {
    const rf = D.refunds.find((r) => r.id === rfId);
    if (!rf) return;
    rf.status = pass ? 'approved' : 'rejected';
    rf.auditNotes = pass ? '客服审核通过，款项已原路退回微信支付，积分已扣除。' : '审核驳回：商品已正常揽收进入干线。';
    const o = S().orders.find((x) => x.id === rf.orderId);
    if (o && pass) {
      o.status = 'refunded';
      XA.addPoints(-rf.pointsDeduct, `订单 ${o.id} 售后退款扣除积分`, -rf.pointsDeduct);
      D.financeLedger = D.financeLedger || [];
      D.financeLedger.unshift({
        id: 'FIN' + Date.now().toString().slice(-6), type: '售后退款', channel: '微信支付原路退回',
        ref: rf.id, amount: -rf.amount, fee: 0, net: -rf.amount, status: '已退款', at: XA.d.full(new Date().toISOString()),
      });
    }
    ADM.save(pass ? `售后单 ${rf.id} 已审核通过并原路打款` : `已驳回售后单 ${rf.id}`);
    ADM.render();
  };

  ADM.act.deleteRefund = (rfId) => {
    const idx = D.refunds.findIndex((x) => x.id === rfId);
    if (idx !== -1) {
      D.refunds.splice(idx, 1);
      ADM.save(`已删除售后单 ${rfId}`);
      ADM.render();
    }
  };

  ADM.act.saveNewBrandInline = () => {
    const name = (document.getElementById('inp_nb_name')?.value || '').trim();
    if (!name) return ADM.toast('请填写品牌名称');
    const city = document.getElementById('inp_nb_city')?.value || '河南南阳';
    const since = +document.getElementById('inp_nb_since')?.value || 2020;
    const slogan = document.getElementById('inp_nb_slogan')?.value || '';
    const origin = document.getElementById('inp_nb_origin')?.value || '';
    const factory = document.getElementById('inp_nb_factory')?.value || '';
    const story = document.getElementById('inp_nb_story')?.value || '';
    const id = 'br_' + Date.now().toString().slice(-4);
    D.brands[id] = {
      id, name, city, since, rating: 4.9, slogan, origin, factory, story,
      art: ['leaf', 'sage'],
      certs: [{ name: '中药材有机农残无检出报告', org: '华测检测认证', at: '2026-06-12', no: 'CTI-2026-091823' }],
    };
    ADM.sel.brand = id;
    ADM.mode.brand = 'detail';
    ADM.save(`已成功新增入驻品牌「${name}」`);
    ADM.render();
  };

  ADM.act.deleteBrand = (bid) => {
    const br = D.brands[bid];
    if (!br) return;
    delete D.brands[bid];
    const nextId = Object.keys(D.brands)[0];
    ADM.sel.brand = nextId;
    D.products.forEach((p) => { if (p.brand === bid) p.brand = nextId; });
    ADM.save(`已删除品牌「${br.name}」`);
    ADM.render();
  };

  ADM.act.addCertInline = (bid) => {
    const br = D.brands[bid];
    if (!br) return;
    const name = (document.getElementById('sp_cert_name')?.value || '').trim();
    if (!name) return ADM.toast('请填写证书名称');
    const org = (document.getElementById('sp_cert_org')?.value || '中国质量认证中心 (CQC)').trim();
    const no = (document.getElementById('sp_cert_no')?.value || 'QC-' + Date.now().toString().slice(-6)).trim();
    br.certs = br.certs || [];
    br.certs.push({ name, org, at: new Date().toISOString().slice(0, 7), no });
    document.getElementById('sp_cert_name').value = '';
    ADM.save(`已在侧边面板为品牌添加质检单「${name}」`);
    ADM.render();
  };

  ADM.act.pauseBrandProds = (bid) => {
    const br = D.brands[bid];
    if (!br) return;
    let cnt = 0;
    D.products.forEach((p) => {
      if (p.brand === bid) { p.soldOut = true; cnt++; }
    });
    ADM.save(`已熔断下架「${br.name}」旗下全部 ${cnt} 款商品`);
    ADM.render();
  };

  ADM.act.approveClaim = (pdId, pass) => {
    const list = S().claim.pending;
    const idx = list.findIndex((x) => x.id === pdId);
    if (idx === -1) return;
    const item = list[idx];
    if (pass) {
      XA.addPoints(item.points || 68, `补登 ${item.channel} 订单 ${item.order}`, item.points || 68);
    }
    list.splice(idx, 1);
    ADM.save(pass ? `已通过三方补登单 ${item.order} 并为客户发放 +${item.points} 积分` : `已驳回补登单 ${item.order}`);
    ADM.render();
  };

  ADM.act.handlePartner = (key, pass) => {
    const apps = S().partnerApplications || {};
    const item = apps[key];
    if (!item) return;
    item.status = pass ? 'approved' : 'rejected';
    if (pass && item.type === 'new') {
      const newStoreId = 'st_' + Date.now().toString().slice(-4);
      D.stores.push({
        id: newStoreId, name: item.store, city: '上海', area: '静安区',
        address: item.address, hours: '10:00 - 21:30', phone: item.phone,
        rating: 5.0, reviews: 1, linked: true, art: ['room', 'sage'],
        tags: ['新店开业', '环境雅致', '专业艾灸'], services: ['s1', 's2'],
      });
    }
    ADM.save(pass ? `已审批通过「${item.store || item.target}」的合作入驻申请` : `已驳回合作入驻申请`);
    ADM.render();
  };

  ADM.act.settlePayout = (stId) => {
    const st = (D.brandSettlements || []).find((b) => b.id === stId);
    if (!st) return;
    st.status = '已打款';
    D.financeLedger = D.financeLedger || [];
    D.financeLedger.unshift({
      id: 'FIN' + Date.now().toString().slice(-6), type: '供应商结算打款', channel: '企业对公转账',
      ref: st.id, amount: -st.payable, fee: 0, net: -st.payable, status: '已结算', at: XA.d.full(new Date().toISOString()),
    });
    ADM.save(`已完成「${st.brandName}」当期账单打款 ¥${XA.money(st.payable)}`);
    ADM.render();
  };

  ADM.act.verifyByCode = (inputId) => {
    const inp = document.getElementById(inputId);
    const code = (inp?.value || '').trim();
    if (!code) return ADM.toast('请输入 6 位核销码或美团团购券码');
    const s = S();
    const appt = s.appts.find((a) => a.code === code && a.status === 'booked');
    if (appt) {
      ADM.act.verifyAppt(appt.id);
      return;
    }
    const gp = D.groupons.find((g) => g.code === code);
    if (gp) {
      if (gp.status === '已核销') return ADM.toast(`券码 ${code} 之前已核销过`);
      gp.status = '已核销';
      D.offlineOrders = D.offlineOrders || [];
      D.offlineOrders.unshift({ id: 'OFF' + Date.now().toString().slice(-6), title: gp.title, amount: gp.amount, at: XA.d.full(new Date().toISOString()) });
      if (inp) inp.value = '';
      ADM.save(`美团/抖音券码 ${code} 核销成功！¥${gp.amount}`);
      ADM.render();
      return;
    }
    ADM.toast('未找到该核销码或已核销完成');
  };

  ADM.applyStoreAction = (action, fields, message) => {
    try {
      const result = XA.storeAction(action, fields);
      ADM.load();
      ADM.render();
      ADM.syncPreview();
      ADM.toast(typeof message === 'function' ? message(result) : message);
    } catch (e) { ADM.toast(esc(e.message)); }
  };
  const appointmentAction = (action, id, message) => {
    const appointment = S().appts.find(a => a.id === id);
    if (appointment) ADM.applyStoreAction(action, {id, storeId:appointment.storeId}, message);
  };
  ADM.act.verifyAppt = id => appointmentAction('verify', id, '预约已核销到店');
  ADM.act.noshowAppt = id => appointmentAction('noshow', id, '预约已标记为爽约');
  ADM.act.releaseWait = id => ADM.applyStoreAction('waitOffer', {id}, '候补名额已释放');

  ADM.act.toggleCampaign = () => {
    D.homeResources.campaign.enabled = !D.homeResources.campaign.enabled;
    ADM.save(`已${D.homeResources.campaign.enabled ? '开启' : '关闭'}首页主视觉海报`);
    ADM.render();
  };

  ADM.act.toggleNotice = () => {
    D.homeResources.notice.enabled = !D.homeResources.notice.enabled;
    ADM.save(`已${D.homeResources.notice.enabled ? '开启' : '关闭'}首页横幅公告`);
    ADM.render();
  };
})();
