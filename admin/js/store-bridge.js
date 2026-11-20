/* store-bridge.js —— 晓艾运营中台全业务数据驱动与持久化引擎
 * 全面支持电商、内容、门店、会员CRM、财务结算五大专业子系统完整 CRUD
 */
(function () {
  const ADM_KEY = 'xa_admin_data_v4';
  const XCX_KEY = 'xa_proto_v17';

  const ADM = (window.ADM = {
    tab: 'overview',
    sub: {},
    sel: {},
    page: {},
    filter: {},
    mode: {}, // 侧边面板/工作台模式：'detail' | 'create' 等，彻底消除弹层
    views: {},
    act: {},
  });

  ADM.setMode = (key, m) => {
    ADM.mode[key] = m;
    ADM.render();
  };

  /* 通用居中对话框 Modal 引擎 */
  ADM.modal = {
    show({ title, body, submitText = '确认保存', submitClass = 'primary', onSave }) {
      const m = document.getElementById('admModal');
      if (!m) return;
      document.getElementById('admModalTitle').innerHTML = title;
      document.getElementById('admModalBody').innerHTML = body;
      const btn = document.getElementById('admModalSubmit');
      btn.textContent = submitText;
      btn.className = `btn-adm ${submitClass}`;
      btn.onclick = () => {
        if (onSave) {
          const ok = onSave();
          if (ok !== false) ADM.modal.close();
        } else {
          ADM.modal.close();
        }
      };
      if (m.hidden) this.trigger = document.activeElement;
      m.hidden = false;
      document.getElementById('adminShell').inert = true;
      (m.querySelector('#admModalBody input:not([type=checkbox]), #admModalBody textarea, #admModalBody select') || m.querySelector('.adm-modal-hd button')).focus();
    },
    close() {
      const m = document.getElementById('admModal');
      if (m && !m.hidden) {
        m.hidden = true;
        document.getElementById('adminShell').inert = false;
        if (this.trigger?.isConnected) this.trigger.focus();
      }
    },
  };

  /* 通用二次确认框 */
  ADM.confirm = (msg, onOk) => {
    ADM.modal.show({
      title: '确认执行操作',
      body: `<div style="padding:14px 4px;font-size:13.5px;color:var(--text);line-height:1.6">${msg}</div>`,
      submitText: '确认执行',
      submitClass: 'danger',
      onSave: () => {
        if (onOk) onOk();
        return true;
      },
    });
  };

  /* 补齐真实管理所需的企业级全维度业务数据 */
  function syncTaxonomy(data) {
    const seedShopTags = !Array.isArray(data.shopTags);
    data.shopTags ??= [];
    data.contentTags ??= [];
    data.contentCategories ??= [];
    function ensure(terms, name) {
      let term = terms.find(t => t.name === name);
      if (!term) {
        term = {id: 'term-' + crypto.randomUUID(), name, enabled:true, sort:terms.length + 1};
        terms.push(term);
      }
      return term.id;
    }
    if (seedShopTags) {
      for (const group of data.shopTagGroups || [])
        for (const name of group.tags) ensure(data.shopTags, name);
    }
    function project(row, product) {
      const tags = product ? data.shopTags : data.contentTags;
      const categories = product ? data.shopCategories : data.contentCategories;
      if (!Array.isArray(row.tagIds)) row.tagIds = (row.tags || []).map(name => ensure(tags, name));
      if (row.categoryId === undefined)
        row.categoryId = row.category ? ensure(categories,row.category) : '';
      const category = categories.find(c => c.id === row.categoryId);
      row.category = category?.enabled ? category.name : '';
      if (row.subcategory && !category?.sub?.includes(row.subcategory)) row.subcategory = '';
      row.tags = row.tagIds.map(id => tags.find(t => t.id === id)).filter(t => t?.enabled).map(t => t.name);
      if (row.workingCopy) project(row.workingCopy,product);
    }
    for (const row of data.products) project(row,true);
    for (const row of [...data.articles,...data.notes]) project(row,false);
  }
  const initEnterpriseData = () => {
    const s = XA.state;
    const D = XA.data;

    // 1. 电商多级分类体系与标签组
    if (!D.shopCategories) {
      D.shopCategories = [
        { id: 'cat_moxa', name: '艾灸用品', sub: ['艾条', '艾柱', '随身灸盒', '艾绒布套'], sort: 1, enabled: true },
        { id: 'cat_bath', name: '足浴热敷', sub: ['足浴包', '肩颈发热贴', '腰部热敷包', '艾草皂'], sort: 2, enabled: true },
        { id: 'cat_tea',  name: '茶饮食养', sub: ['节气茶饮', '红枣桂圆茶', '陈皮普洱', '养生膏滋'], sort: 3, enabled: true },
        { id: 'cat_tool', name: '理疗器具', sub: ['点穴棒', '刮痧板', '拔罐器具', '经络拍'], sort: 4, enabled: true },
      ];
    }
    if (!D.shopTagGroups) {
      D.shopTagGroups = [
        { group: '营销标签', tags: ['晓艾精选', '新品上架', '热销爆款', '限时特惠', '包邮专区'] },
        { group: '体质调养标签', tags: ['平和质', '气虚质', '阳虚质', '阴虚质', '痰湿质', '湿热质', '血瘀质', '气郁质', '特禀质'] },
        { group: '适用人群标签', tags: ['久坐办公', '长辈孝敬', '畏寒怕冷', '经常熬夜', '初学入门'] },
        { group: '核心功效标签', tags: ['温经通络', '驱寒暖身', '舒缓肩颈', '安神助眠', '健脾和胃'] },
      ];
    }

    // 2. 完善商品库（库存、SKU编码、多规格差价库存）
    D.products.forEach((p, idx) => {
      p.code = p.code || `SKU-2026-${String(idx + 1).padStart(3, '0')}`;
      p.stock = p.stock !== undefined ? p.stock : (p.soldOut ? 0 : 360 + idx * 45);
      p.tags = p.tags || (p.curated ? ['晓艾精选'] : ['常规商品']);
      p.points = p.points || ['纯手工揉制五年陈艾', '烟微柔和不呛人', '温通经络直透穴位'];
      p.detail = p.detail || ['精选伏牛山深处陈艾，经传统工艺陈化。', '适宜居家常备，温阳散寒。'];
      p.specStock = p.specStock || {};
      p.specs = p.specs || [{ name: '规格', options: [{ t: '标准盒装 (10支)', d: 0 }, { t: '家庭实惠装 (30支)', d: 60 }] }];
      p.specs.forEach((sp, si) => {
        sp.options.forEach((opt, oi) => {
          const key = `${si}_${oi}`;
          p.specStock[key] = p.specStock[key] !== undefined ? p.specStock[key] : (p.soldOut ? 0 : 80 + oi * 40);
        });
      });
    });

    // 3. 完善品牌主档与资质
    Object.values(D.brands).forEach((b) => {
      b.certs = b.certs || [
        { name: '中药材有机农残无检出报告', org: '华测检测认证', at: '2026-06-12', no: 'CTI-2026-091823' },
        { name: '生产许可与ISO9001质检认证', org: '中国质量认证中心', at: '2026-03-20', no: 'CQC-2026-QA8810' },
      ];
      b.origin = b.origin || '河南南阳伏牛山生态种植示范基地，北纬33°黄金艾草带';
      b.factory = b.factory || '10万级GMP净化车间，全封闭灭菌包装与逐支红外探伤测重';
      b.story = b.story || '传承百年古法炮制工艺，坚持非遗手作，只选五年陈纯艾绒。';
      b.slogan = b.slogan || '端午采艾，伏阳陈化，以本草守候人间温度。';
    });

    // 4. 完善订单体系
    if (!localStorage.getItem(ADM_KEY) && !s.orders.some((o) => o.status === 'toship')) {
      s.orders.unshift(
        {
          id: 'XA2611100901', status: 'toship',
          items: [{ pid: 'p1', opts: [1, 0], qty: 2, price: 68 }, { pid: 'p2', opts: [0], qty: 1, price: 129 }],
          goods: 265, freight: 0, off: 10, amount: 255, points: 255, growth: 255, source: 'video',
          buyer: { name: '林阿姨', phone: '138****6608', address: '浙江省杭州市西湖区文三路 108 号 3 幢 502 室' },
          logistics: { company: '顺丰速运', trackNo: '' },
          csNotes: [{ at: '2026-11-10 16:30', user: '客服小张', text: '顾客来电确认是否五年陈艾，已核实说明。' }],
          at: new Date(Date.now() - 3600 * 1000 * 2.5).toISOString(),
        },
        {
          id: 'XA2611100854', status: 'toship',
          items: [{ pid: 'p3', opts: [0], qty: 2, price: 59 }],
          goods: 118, freight: 0, off: 0, amount: 118, points: 118, growth: 118, source: 'feed',
          buyer: { name: '陈先生', phone: '137****8901', address: '浙江省杭州市拱墅区延安路 530 号银泰百货' },
          logistics: { company: '顺丰速运', trackNo: '' },
          csNotes: [],
          at: new Date(Date.now() - 3600 * 1000 * 4.2).toISOString(),
        }
      );
    }
    s.orders.forEach((o) => {
      o.buyer = o.buyer || { name: '林阿姨', phone: '138****6608', address: '浙江省杭州市西湖区文三路 108 号 3 幢 502 室' };
      o.logistics = o.logistics || { company: '顺丰速运', trackNo: o.status === 'shipped' ? 'SF108820467731' : '' };
      o.csNotes = o.csNotes || [];
    });

    // 5. 售后退款单
    if (!D.refunds) {
      D.refunds = [
        {
          id: 'RF261110001', orderId: 'XA2611080017', type: '仅退款', reason: '拍错了 / 多拍了',
          amount: 59, pointsDeduct: 59, status: 'pending', applicant: '林阿姨', phone: '138****6608',
          createdAt: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString(), auditNotes: '',
        },
        {
          id: 'RF261107002', orderId: 'XA2610210042', type: '仅退款', reason: '不想要了',
          amount: 68, pointsDeduct: 68, status: 'approved', applicant: '林阿姨', phone: '138****6608',
          createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(), auditNotes: '未拆封拦截，已原路退回微信账户。',
        },
      ];
    }

    // 6. 会员 CRM 档案体系
    if (!D.members) {
      D.members = [
        { id: 'u_lin', name: '林阿姨', phone: '13858016608', cardNo: 'XA-880291', level: '钻卡会员', habitus: '阳虚质', points: 1280, coins: 460, plus: true, plusExpire: '2027-11-01', totalSpent: 4860, ordersCount: 16, registerAt: '2025-08-15', status: '正常' },
        { id: 'u_chen', name: '陈先生', phone: '13788901234', cardNo: 'XA-661023', level: '金卡会员', habitus: '湿热质', points: 640, coins: 180, plus: false, plusExpire: '', totalSpent: 2190, ordersCount: 7, registerAt: '2026-01-10', status: '正常' },
        { id: 'u_zhou', name: '周女士', phone: '13958112233', cardNo: 'XA-771920', level: '银卡会员', habitus: '气虚质', points: 380, coins: 90, plus: true, plusExpire: '2027-05-20', totalSpent: 1350, ordersCount: 4, registerAt: '2026-03-22', status: '正常' },
        { id: 'u_wang', name: '王先生', phone: '13500114455', cardNo: 'XA-552019', level: '普通会员', habitus: '平和质', points: 150, coins: 30, plus: false, plusExpire: '', totalSpent: 420, ordersCount: 2, registerAt: '2026-06-08', status: '正常' },
        { id: 'u_zhao', name: '赵店长', phone: '13957188201', cardNo: 'XA-990012', level: '钻卡会员', habitus: '血瘀质', points: 3400, coins: 1200, plus: true, plusExpire: '2028-01-01', totalSpent: 12800, ordersCount: 38, registerAt: '2025-03-01', status: '正常' },
      ];
    }

    // 7. Plus 权益列表
    if (!D.plusBenefits) {
      D.plusBenefits = [
        { id: 'pb1', title: '全场商城 9 折折上折', tag: '折上折', desc: '购买自营商城所有实物商品享专享 9 折优享', quota: '无限制' },
        { id: 'pb2', title: '每月 1 张顺丰包邮券', tag: '免邮特权', desc: '每月 1 日自动派发无门槛顺丰包邮免运券', quota: '每月 1 张' },
        { id: 'pb3', title: '到店服务专属 8 折预约', tag: '线下尊享', desc: '预约线下合作门店艾灸调养项目享受 8 折结算', quota: '每月 2 次' },
        { id: 'pb4', title: '节气定制草本礼盒', tag: '节气好礼', desc: '立春、夏至、立秋、冬至四季节气随单附赠本草体验装', quota: '每年 4 次' },
      ];
    }

    // 8. 优惠券模板
    if (!D.couponTemplates) {
      D.couponTemplates = [
        { id: 'tpl_goods_10', name: '新人专享好物券', scope: 'goods', amount: 10, min: 59, validityDays: 30, totalIssued: 1200, totalUsed: 840, enabled: true },
        { id: 'tpl_goods_20', name: '运营关怀好物券', scope: 'goods', amount: 20, min: 99, validityDays: 30, totalIssued: 350,  totalUsed: 210, enabled: true },
        { id: 'tpl_store_30', name: '到店服务体验券', scope: 'store', amount: 30, min: 198, validityDays: 45, totalIssued: 600,  totalUsed: 420, enabled: true },
        { id: 'tpl_plus_40',  name: 'Plus月度专属券包', scope: 'goods', amount: 15, min: 59, validityDays: 30, totalIssued: 800,  totalUsed: 690, enabled: true },
      ];
    }

    // 9. 裂变推广团长
    if (!D.fissionLeaders) {
      D.fissionLeaders = [
        { id: 'fl_01', name: '林阿姨', phone: '13858016608', area: '杭州西湖区', commissionRate: 0.12, totalInvited: 28, totalSales: 8940, unwithdrawn: 486.0, totalWithdrawn: 586.8, status: '正常' },
        { id: 'fl_02', name: '周女士', phone: '13958112233', area: '杭州滨江区', commissionRate: 0.10, totalInvited: 15, totalSales: 4320, unwithdrawn: 190.0, totalWithdrawn: 242.0, status: '正常' },
        { id: 'fl_03', name: '沈经理', phone: '13602199382', area: '上海静安区', commissionRate: 0.15, totalInvited: 42, totalSales: 16800, unwithdrawn: 920.0, totalWithdrawn: 1600.0, status: '正常' },
      ];
    }

    // 10. 财务全渠道资金流水
    if (!D.financeLedger) {
      D.financeLedger = [
        { id: 'FIN26111001', type: '线上收款', channel: '微信支付', ref: 'XA2611100901', amount: 255.0, fee: 1.53, net: 253.47, status: '已入账', at: '2026-11-10 18:20' },
        { id: 'FIN26111002', type: '线上收款', channel: '微信支付', ref: 'XA2611100854', amount: 118.0, fee: 0.71, net: 117.29, status: '已入账', at: '2026-11-10 17:10' },
        { id: 'FIN26111003', type: '门店核销', channel: '到店收银', ref: 'MD2611070313', amount: 128.0, fee: 0.0, net: 128.0, status: '已核销', at: '2026-11-10 16:30' },
        { id: 'FIN26111004', type: '售后退款', channel: '原路退回', ref: 'RF261107002', amount: -68.0, fee: -0.41, net: -67.59, status: '已退款', at: '2026-11-09 11:20' },
        { id: 'FIN26111005', type: '会籍费收入', channel: '微信支付', ref: 'PLUS-261101', amount: 365.0, fee: 2.19, net: 362.81, status: '已入账', at: '2026-11-01 09:15' },
      ];
    }

    // 11. 品牌对账单
    if (!D.brandSettlements) {
      D.brandSettlements = [
        { id: 'ST-YQ-202610', brandId: 'yqdd', brandName: '元气地带', period: '2026年10月', totalSales: 48620.0, commissionRate: 0.15, platformFee: 7293.0, payable: 41327.0, status: '待打款' },
        { id: 'ST-MD-202610', brandId: 'mdm',  brandName: '明大妈',   period: '2026年10月', totalSales: 32180.0, commissionRate: 0.15, platformFee: 4827.0, payable: 27353.0, status: '已打款' },
        { id: 'ST-SY-202610', brandId: 'syb',  brandName: '山野本草', period: '2026年10月', totalSales: 16400.0, commissionRate: 0.15, platformFee: 2460.0, payable: 13940.0, status: '已打款' },
      ];
    }

    // 13. 三方补登与门店合作申请
    if (!localStorage.getItem(ADM_KEY) && !s.claim.pending.length) {
      s.claim.pending.push(
        { id: 'PD26111001', channel: '京东', order: 'JD998120348712', points: 128, amount: 128, title: '五年陈艾条 ×2（人工核单）', applicant: '林阿姨', phone: '138****6608', at: new Date(Date.now() - 1800 * 1000).toISOString() },
        { id: 'PD26111002', channel: '淘宝', order: 'TB776512098341', points: 79, amount: 79, title: '艾草热敷肩颈贴 10贴', applicant: '陈女士', phone: '136****9922', at: new Date(Date.now() - 5400 * 1000).toISOString() }
      );
    }

  };

  /* 加载与合并本地配置 */
  ADM.load = () => {
    try {
      const state = XA.opsRequest('admin');
      ADM.revision = state.revision;
      Object.assign(XA.data, state.catalog);
      for (const key of ['schoolClasses','schoolJobs','schoolEnrollments']) XA.data[key] = state.catalog[key] || [];
      XA.state.appts = state.appointments || [];
      XA.state.signups = state.signups || [];
      XA.state.waitlist = state.waitlist || [];
      XA.mergeOrders(state.orders);
      XA.state.partnerApplications = state.applications;
    } catch {
      document.body.innerHTML = '<main style="padding:3rem"><h1>晓艾运营中台</h1><a href="/api/operations?mode=login">重新连接演示空间</a></main>';
      throw new Error('运营后台未连接');
    }
    initEnterpriseData();
    syncTaxonomy(XA.data);
  };

  /* 保存配置并同步至右侧小程序 iframe */
  ADM.save = (msg) => {
    const oldConfig=localStorage.getItem(ADM_KEY),oldState=localStorage.getItem(XCX_KEY);
    try {
      const cfg = {
        homeResources: XA.data.homeResources,
        plus: XA.data.plus,
        hotKeywords: XA.data.hotKeywords,
        brands: XA.data.brands,
        products: XA.data.products,
        shopCategories: XA.data.shopCategories,
        shopTags: XA.data.shopTags,
        contentTags: XA.data.contentTags,
        contentCategories: XA.data.contentCategories,
        shopTagGroups: XA.data.shopTagGroups,
        refunds: XA.data.refunds,
        members: XA.data.members,
        plusBenefits: XA.data.plusBenefits,
        fissionLeaders: XA.data.fissionLeaders,
        financeLedger: XA.data.financeLedger,
        brandSettlements: XA.data.brandSettlements,
        couponTemplates: XA.data.couponTemplates,
        schoolClasses: XA.data.schoolClasses,
        schoolJobs: XA.data.schoolJobs,
        schoolEnrollments: XA.data.schoolEnrollments,
        courses: XA.data.courses,
        articles: XA.data.articles,
        creators: XA.data.creators,
        videos: XA.data.videos,
        topics: XA.data.topics,
        notes: XA.data.notes,
        stores: XA.data.stores,
        staff: XA.data.staff,
        offlineOrders: XA.data.offlineOrders,
        services: XA.data.services,
        activities: XA.data.activities,
        TIMES: XA.data.TIMES,
        slotOverrides: XA.data.slotOverrides,
        groupons: XA.data.groupons,
      };
      const catalog = structuredClone(cfg);
      syncTaxonomy(catalog);
      const response = XA.opsRequest('admin','PUT',{revision:ADM.revision,catalog,applications:XA.state.partnerApplications});
      ADM.revision = response.revision;
      syncTaxonomy(XA.data);
      try { localStorage.setItem(ADM_KEY, '1');
      localStorage.setItem(XCX_KEY, JSON.stringify(XA.state)); } catch {}
      ADM.syncPreview();
    } catch (e) {
      try { if(oldConfig===null)localStorage.removeItem(ADM_KEY);else localStorage.setItem(ADM_KEY,oldConfig);if(oldState===null)localStorage.removeItem(XCX_KEY);else localStorage.setItem(XCX_KEY,oldState); } catch (_) {}
      ADM.toast(e.status === 409 ? '其他操作已更新资料，请刷新后重试' : '业务数据保存失败，请重试'); return false;
    }
    if (msg) ADM.toast(msg);
    return true;
  };

  /* 联动预览同步 */
  ADM.syncPreview = (routeHash) => {
    const iframe = document.getElementById('xcxFrame');
    if (!iframe || !iframe.contentWindow) return;
    try {
      const win = iframe.contentWindow;
      if (win.XA && win.XA.data) {
        win.XA.loadCatalog().then(() => routeHash ? win.XA.go(routeHash) : win.XA.refresh()).catch(() => ADM.toast('预览刷新失败'));

      }
    } catch (e) {}
  };

  /* Toast 提示 */
  ADM.toast = (msg) => {
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'adm-toast';
    el.innerHTML = `${XA.icon('check')}<span>${msg}</span>`;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  };

  /* 分页控制器（单屏无滚动核心组件） */
  ADM.paginate = (list, key, pageSize = 5) => {
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    let cur = ADM.page[key] || 1;
    if (cur > pages) cur = pages;
    if (cur < 1) cur = 1;
    ADM.page[key] = cur;
    const items = list.slice((cur - 1) * pageSize, cur * pageSize);
    const html = `
      <div class="pager">
        <span>共 ${total} 项</span>
        <button class="pager-btn" ${cur <= 1 ? 'disabled' : ''} onclick="ADM.setPage('${key}', ${cur - 1})" aria-label="上一页">‹</button>
        <b>${cur} / ${pages}</b>
        <button class="pager-btn" ${cur >= pages ? 'disabled' : ''} onclick="ADM.setPage('${key}', ${cur + 1})" aria-label="下一页">›</button>
      </div>`;
    return { items, cur, pages, total, pagerHtml: html };
  };

  ADM.setPage = (key, p) => {
    ADM.page[key] = p;
    ADM.render();
  };

  /* 全局经营核心指标 */
  ADM.metrics = () => {
    const s = XA.state;
    const D = XA.data;
    const onlineGMV = s.orders.filter((o) => !['refunded','unpaid'].includes(o.status)).reduce((a, o) => a + (o.amount || 0), 0);
    const offlineGMV = s.appts.filter((a) => a.status === 'done').reduce((a, o) => a + (o.price || 0), 0) +
      D.offlineOrders.reduce((a, o) => a + (o.amount || 0), 0);
    const contentGMV = s.orders.filter((o) => !['refunded','unpaid'].includes(o.status) && ['video', 'post', 'group'].includes(o.source)).reduce((a, o) => a + (o.amount || 0), 0);

    const toship = s.orders.filter((o) => o.status === 'toship').length;
    const torefund = (D.refunds || []).filter((r) => r.status === 'pending').length;
    const toverify = s.appts.filter((a) => a.status === 'booked').length;
    const toclaim = s.claim.pending.length;
    const topartner = Object.values(s.partnerApplications || {}).filter((x) => x.status !== 'approved' && x.status !== 'rejected').length;
    const tosettle = (D.brandSettlements || []).filter((b) => b.status === '待打款').length;

    return {
      totalGMV: Math.round((onlineGMV + offlineGMV) * 100) / 100,
      onlineGMV: Math.round(onlineGMV * 100) / 100,
      offlineGMV: Math.round(offlineGMV * 100) / 100,
      contentGMV: Math.round(contentGMV * 100) / 100,
      toship,
      torefund,
      toverify,
      toclaim,
      topartner,
      tosettle,
      totalPending: toship + torefund + toverify + toclaim + topartner + tosettle,
    };
  };

  ADM.load();
})();
