/* app.js —— 晓艾运营中台主控制器与全局路由
 * 架构：
 * 1. 运营大盘指挥部 (`overview` · ⌥1) —— 核心经营业绩看板 + 待办速办秒级闭环 + 首页投放控制
 * 2. 电商管理中心   (`shop` · ⌥2)     —— 商品SKU + 多级分类标签 + 订单客服履约 + 售后仅退款 + 品牌供应链
 * 3. 内容管理中心   (`content` · ⌥3)  —— 短视频带货挂车 + 专栏知识付费 + 养生图文 + 社区笔记话题 + 创作者
 * 4. 门店管理中心   (`store` · ⌥4)    —— 认证门店档案 + 服务特色标签 + 产能排班时段 + 预约核销验券 + 线下沙龙
 * 5. 会员与CRM系统  (`user` · ⌥5)     —— 会员档案调账 + Plus年卡权益 + 优惠券模板派发 + 裂变推广团长
 * 6. 财务与对账中心 (`finance` · ⌥6)  —— 全渠道资金流水 + 供应商对账结算 + 报表导出
 *
 * 核心交互：
 * - 严格锁定 100vw × 100vh 单视口（overflow: hidden），消灭网页上下滚动条
 * - 快捷键：Alt + 1~6 快速切换各大业务管理中心，⌘K / Ctrl+K 全局模糊搜索直达业务对象
 * - 随时点击右上角「同屏小程序预览」即时验证修改成果
 */
(function () {
  const D = XA.data, esc = XA.esc, icon = XA.icon;

  const NAV_ITEMS = [
    { id: 'overview', group: '大盘指挥', label: '运营综合大盘',   icon: 'home',  kbd: '1', sub: '经营业绩看板 ｜ 运营待办速办 ｜ 首页流量投放' },
    { id: 'shop',     group: '核心业务', label: '电商管理中心',   icon: 'bag',   kbd: '2', sub: '商品与SKU ｜ 多级分类标签 ｜ 订单客服履约 ｜ 售后退款 ｜ 品牌供应链' },
    { id: 'content',  group: '核心业务', label: '内容管理中心',   icon: 'video', kbd: '3', sub: '短视频带货挂车 ｜ 专栏知识付费 ｜ 科普文章 ｜ 社区达人种草' },
    { id: 'store',    group: '核心业务', label: '门店管理中心',   icon: 'store', kbd: '4', sub: '认证门店档案 ｜ 服务特色标签 ｜ 产能时段排班 ｜ 核销验券 ｜ 线下沙龙' },
    { id: 'user',     group: '增长与CRM',label: '会员与用户中心', icon: 'crown', kbd: '5', sub: '会员档案调账 ｜ Plus年费包 ｜ 优惠券模板 ｜ 裂变与单层CPS' },
    { id: 'finance',  group: '财务结算', label: '财务与结算中心', icon: 'coin',  kbd: '6', sub: '全渠道资金流水 ｜ 供应商对账结算 ｜ 报表导出' },
  ];

  /* 渲染左侧导航栏 */
  const renderRail = () => {
    const rail = document.getElementById('rail');
    if (!rail) return;
    const m = ADM.metrics();
    let curGroup = '';
    const navHtml = NAV_ITEMS.map((it) => {
      const grp = it.group !== curGroup ? `<div class="rail-group-label">${it.group}</div>` : '';
      curGroup = it.group;
      const badge = it.id === 'overview' && m.totalPending
        ? `<span class="rail-badge">${m.totalPending}</span>`
        : it.id === 'shop' && (m.toship + m.torefund)
        ? `<span class="rail-badge">${m.toship + m.torefund}</span>`
        : it.id === 'store' && m.toverify
        ? `<span class="rail-badge soft">${m.toverify}</span>`
        : it.id === 'finance' && m.tosettle
        ? `<span class="rail-badge gold">${m.tosettle}</span>`
        : `<span class="rail-kbd">⌥${it.kbd}</span>`;
      return `${grp}
        <button class="rail-item ${ADM.tab === it.id ? 'on' : ''}" onclick="ADM.go('${it.id}')">
          ${icon(it.icon)}
          <span>${it.label}</span>
          ${badge}
        </button>`;
    }).join('');

    rail.innerHTML = `
      <div class="rail-brand">
        <span class="logo-dot">艾</span>
        <div class="rail-brand-text">
          <b>晓艾运营中台</b>
          <span>运营工作台</span>
        </div>
      </div>
      <nav class="rail-nav" aria-label="主导航">${navHtml}</nav>
      <div class="rail-foot">
        <div class="rail-status-card">
          <b><i class="status-dot"></i>本机演示数据</b>
          <div class="tiny muted" style="margin-top:3px">本地保存 · 同源小程序预览</div>
        </div>
        <button class="btn-adm outline sm" style="width:100%" onclick="ADM.resetAll()">${icon('refresh')} 恢复标准业务数据</button>
      </div>
    `;
  };

  /* 渲染顶部全局指令栏 */
  const renderTopbar = () => {
    const topbar = document.getElementById('topbar');
    if (!topbar) return;
    const curNav = NAV_ITEMS.find((x) => x.id === ADM.tab) || NAV_ITEMS[0];
    const previewDock = document.getElementById('previewDock');
    const dockOpen = previewDock && !previewDock.hidden;
    topbar.innerHTML = `
      <div class="tb-left">
        <h1 class="tb-title">${curNav.label}</h1>
        <span class="tb-sub">${curNav.sub}</span>

      </div>
      <button class="tb-cmd-trigger" onclick="ADM.openCmd()">
        ${icon('search')}
        <span>搜索商品、订单号、会员手机号、门店或操作指令…</span>
        <kbd>⌘K</kbd>
      </button>
      <div class="tb-right">
        <button class="btn-adm ${dockOpen ? 'primary' : 'tonal'}" onclick="ADM.togglePreview()">
          ${icon('phone')}
          <span>${dockOpen ? '收起小程序预览' : '同屏小程序预览'}</span>
        </button>
        <a class="btn-adm outline" href="../index.html" target="_blank" rel="noopener">新窗口打开 xcx ↗</a>
      </div>
    `;
  };

  /* 主渲染入口 */
  ADM.render = () => {
    renderRail();
    renderTopbar();
    const ws = document.getElementById('workspace');
    if (!ws) return;
    const fn = ADM.views[ADM.tab] || ADM.views.overview;
    ws.innerHTML = fn();
  };

  ADM.go = (tab, subVal) => {
    ADM.tab = tab;
    if (subVal) {
      if (tab === 'shop') ADM.sub.shopSub = subVal;
      if (tab === 'content') ADM.sub.contentSub = subVal;
      if (tab === 'store') ADM.sub.storeSub = subVal;
      if (tab === 'user') ADM.sub.userSub = subVal;
      if (tab === 'finance') ADM.sub.financeSub = subVal;
      if (tab === 'overview') ADM.sub.ovQueue = subVal;
    }
    ADM.render();
  };

  ADM.setSub = (key, val) => {
    ADM.sub[key] = val;
    ADM.render();
  };

  /* 小程序预览抽屉控制 */
  const PREVIEW_ROUTES = [
    ['home', '首页'],
    ['catalog', '商品分类'],
    ['video', '短视频挂车'],
    ['store', '门店列表'],
    ['orders', '订单中心'],
    ['xahui', '晓艾会'],
    ['perks', 'iOS卡包'],
    ['growth', '分享有礼'],
    ['groups', '拼团'],
  ];

  const renderPreviewRoutes = () => {
    const bar = document.getElementById('pdRouteBar');
    if (!bar) return;
    bar.innerHTML = PREVIEW_ROUTES.map(([r, l]) => `<button class="chip-btn" onclick="ADM.openPreview('${r}')">${l}</button>`).join('');
  };

  ADM.togglePreview = () => {
    const dock = document.getElementById('previewDock');
    if (!dock) return;
    dock.hidden = !dock.hidden;
    if (!dock.hidden) {
      renderPreviewRoutes();
      ADM.syncPreview();
    }
    renderTopbar();
  };

  ADM.openPreview = (routeHash) => {
    const dock = document.getElementById('previewDock');
    if (!dock) return;
    dock.hidden = false;
    renderPreviewRoutes();
    renderTopbar();
    const iframe = document.getElementById('xcxFrame');
    if (iframe) {
      ADM.syncPreview(routeHash);
    }
  };

  const initPreviewEvents = () => {
    const closeBtn = document.getElementById('pdCloseBtn');
    if (closeBtn) {
      closeBtn.onclick = () => {
        const dock = document.getElementById('previewDock');
        if (dock) dock.hidden = true;
        renderTopbar();
      };
    }
    const reloadBtn = document.getElementById('pdReloadBtn');
    if (reloadBtn) {
      reloadBtn.onclick = () => {
        const iframe = document.getElementById('xcxFrame');
        if (iframe && iframe.contentWindow) iframe.contentWindow.location.reload();
        setTimeout(() => ADM.syncPreview(), 250);
      };
    }
    const xcxFrame = document.getElementById('xcxFrame');
    if (xcxFrame) {
      xcxFrame.addEventListener('load', () => ADM.syncPreview());
    }
  };

  /* 全局快捷指令面板 (⌘K / Ctrl+K) */
  const buildSearchPool = () => {
    const list = [];
    (D.products || []).forEach((p) => list.push({ tag: '商品', cls: 'green', title: p.title, sub: `¥${p.price} ｜ 编码 ${p.code || p.id} ｜ 销 ${XA.wan(p.sales)}`, go: () => { ADM.sel.product = p.id; ADM.go('shop', 'products'); } }));
    (D.stores || []).forEach((s) => list.push({ tag: '门店', cls: 'blue', title: s.name, sub: `${s.city} ${s.area || ''} ｜ ${s.linked ? '已认证' : '未接入'}`, go: () => { ADM.sel.store = s.id; ADM.go('store', 'stores'); } }));
    (XA.state.orders || []).forEach((o) => list.push({ tag: '订单', cls: 'red', title: `订单 ${o.id}`, sub: `买家：${o.buyer?.name} ｜ 实付 ¥${o.amount} ｜ ${o.status}`, go: () => { ADM.sel.order = o.id; ADM.go('shop', 'orders'); } }));
    (D.refunds || []).forEach((rf) => list.push({ tag: '退款', cls: 'red', title: `售后单 ${rf.id}`, sub: `退款 ¥${rf.amount} ｜ 原因：${rf.reason}`, go: () => { ADM.go('shop', 'refunds'); } }));
    (D.members || []).forEach((m) => list.push({ tag: '会员', cls: 'gold', title: `${m.name} (${m.phone})`, sub: `${m.level} ｜ 积分 ${m.points} ｜ ${m.habitus}`, go: () => { ADM.sel.member = m.id; ADM.go('user', 'members'); } }));
    (D.courses || []).forEach((c) => list.push({ tag: '课程', cls: 'gold', title: c.title, sub: `讲师：${c.author || ''} ｜ ¥${c.price}`, go: () => { ADM.sel.course = c.id; ADM.go('content', 'courses'); } }));
    (D.videos || []).forEach((v) => list.push({ tag: '视频', cls: 'green', title: v.title, sub: `@${v.author} ｜ 播放 ${XA.wan(v.views || 0)}`, go: () => { ADM.sel.video = v.id; ADM.go('content', 'videos'); } }));
    (D.groupons || []).forEach((g) => list.push({ tag: '团购券', cls: 'gold', title: `${g.channel}：${g.code}`, sub: `${g.title} ｜ ¥${g.amount}`, go: () => { ADM.go('store', 'verify'); } }));
    return list;
  };

  const paintCmd = (q) => {
    const cmdResults = document.getElementById('cmdResults');
    const cmdModal = document.getElementById('cmdModal');
    if (!cmdResults) return;
    const kw = (q || '').trim().toLowerCase();
    const pool = buildSearchPool();
    const hits = kw ? pool.filter((x) => (x.title + x.sub + x.tag).toLowerCase().includes(kw)).slice(0, 8) : pool.slice(0, 8);
    cmdResults.innerHTML = hits.length ? hits.map((h, i) => `
      <button class="cmd-item" data-idx="${i}">
        <span class="adm-tag ${h.cls}">${h.tag}</span>
        <div class="grow ell">
          <div class="bold ell">${esc(h.title)}</div>
          <div class="tiny faint ell">${esc(h.sub)}</div>
        </div>
      </button>
    `).join('') : `<div class="center muted col-span-2" style="padding:20px">未找到匹配项</div>`;
    cmdResults.querySelectorAll('.cmd-item').forEach((btn, i) => {
      btn.onclick = () => {
        if (cmdModal) cmdModal.hidden = true;
        hits[i].go();
      };
    });
  };

  ADM.openCmd = () => {
    const cmdModal = document.getElementById('cmdModal');
    const cmdInput = document.getElementById('cmdInput');
    if (!cmdModal || !cmdInput) return;
    cmdModal.hidden = false;
    cmdInput.value = '';
    paintCmd('');
    setTimeout(() => cmdInput.focus(), 20);
  };

  const initCmdEvents = () => {
    const cmdModal = document.getElementById('cmdModal');
    const cmdInput = document.getElementById('cmdInput');
    const cmdResults = document.getElementById('cmdResults');
    const searchIcon = document.getElementById('cmdSearchIcon');
    if (searchIcon) searchIcon.innerHTML = icon('search');
    if (cmdInput) {
      cmdInput.oninput = () => paintCmd(cmdInput.value);
      cmdInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          const first = cmdResults?.querySelector('.cmd-item');
          if (first) first.click();
        } else if (e.key === 'Escape') {
          if (cmdModal) cmdModal.hidden = true;
        }
      };
    }
    if (cmdModal) {
      cmdModal.onclick = (e) => {
        if (e.target === cmdModal) cmdModal.hidden = true;
      };
    }
  };

  /* 全局键盘快捷键：⌘K 搜索，Alt+1~6 切换系统 */
  window.addEventListener('keydown', (e) => {
    const cmdModal = document.getElementById('cmdModal');
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      ADM.openCmd();
    } else if (e.key === 'Escape' && cmdModal && !cmdModal.hidden) {
      cmdModal.hidden = true;
    } else if (e.altKey && e.key >= '1' && e.key <= '6') {
      const idx = Number(e.key) - 1;
      if (NAV_ITEMS[idx]) {
        e.preventDefault();
        ADM.go(NAV_ITEMS[idx].id);
      }
    }
  });

  initPreviewEvents();
  initCmdEvents();
  ADM.render();
})();
