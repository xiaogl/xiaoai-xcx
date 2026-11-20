/* pages-store.js —— 门店 Tab（连接所有门店的列表：定位 / 距离排序 / 门店类型 / 结构化标签筛选）
 * 门店类型：晓艾家（自营旗舰店）/ 元气地带（品牌连锁，内部称云连锁）/ 其他商家门店
 * 已接入门店：可预约、可核销美团/抖音团购券；未接入门店：仅展示基础信息与信息来源
 * 门店详情 / 团购券验券 / 预约下单 / 预约详情（核销码、改期、取消）/ 候补 / 活动日历 / 晓艾家会籍
 */
(function () {
  const D = XA.data, icon = XA.icon, ui = XA.ui, esc = XA.esc;
  const STORE_BOOKING_ENABLED = false;
  const short = (s) => s.name.replace('晓艾家 · ', '');
  const minPrice = (s) => (s.linked ? Math.min.apply(null, s.services.map((id) => D.service(id).mprice)) : 99999);
  const isOpen = (s) => {
    if (!s.hours) return false;
    const m = s.hours.match(/(\d+):(\d+)\D+(\d+):(\d+)/), n = new Date(), cur = n.getHours() * 60 + n.getMinutes();
    return m && cur >= +m[1] * 60 + +m[2] && cur < +m[3] * 60 + +m[4];
  };
  const chTag = (c) => `<span class="ch ch-${D.chClass(c)}">${c}</span>`;

  /* ================= 门店列表（门店 Tab） ================= */
  const defaults = () => ({ city: D.located.city, brand: '', area: '', sort: 'smart', kw: '', project: 'rec' });
  const F = () => (XA.tmp.sf ||= defaults());
  /* 门店顶部可选项目（圆形彩色图标，仿分类金刚区；推荐为默认选中）—— 结合本店艾灸项目 */
  const PROJECTS = [
    { id: 'rec', name: '推荐', art: 'hand', tone: 'sand' },
    { id: 's1', name: '经典艾灸', art: 'moxa', tone: 'clay' },
    { id: 's2', name: '肩颈舒缓', art: 'person', tone: 'sage' },
    { id: 's3', name: '节气养生', art: 'season', tone: 'sand' },
    { id: 's4', name: '新客体验', art: 'box', tone: 'rose' },
    { id: 'fit', name: '体质配穴', art: 'leaf', tone: 'mist' },
  ];
  XA.act.sfProject = (id) => { F().project = id; XA.refresh(); };
  const SORTS = { smart: '智能排序', distance: '离我最近' };
  /* 门店类型：自营旗舰 / 品牌连锁 / 加盟店（未接入门店无门店类型，不参与此筛选） */
  const STORE_TYPE = { xaj: '自营旗舰', yq: '品牌连锁', biz: '加盟店' };
  const radii = { '500米': 0.5, '1km': 1, '2km': 2, '5km': 5 };
  const normArea = (a) => String(a || '').replace(/商圈|步行街|地铁站|站/g, '');
  const areaHit = (storeArea, fArea) => {
    if (!fArea) return true;
    const n = normArea(fArea), s = normArea(storeArea);
    return n === s || n.includes(s) || s.includes(n);
  };
  /* 附近商圈目录（仿图片的两级：热门商圈 + 各行政区商圈）*/
  const AREA_CATALOG = {
    武汉: {
      hot: ['西北湖', '江汉路步行街', '腰路堤/建港', '蔡甸周边', '后湖商圈', '水果湖商圈', '卓刀泉/虎泉', '唐家墩/菱角湖', '中南路/洪山广场'],
      districts: {
        '洪山区': ['光谷广场', '街道口', '卓刀泉/虎泉', '中南路/洪山广场'],
        '汉阳区': ['钟家村', '王家湾', '腰路堤/建港'],
        '江汉区': ['江汉路步行街', '西北湖', '唐家墩/菱角湖'],
        '武昌区': ['水果湖商圈', '中南路/洪山广场', '楚河汉街'],
        '硚口区': ['宗关', '汉西'],
        '青山区': ['红钢城', '建二'],
        '江岸区': ['后湖商圈', '二七', '黎黄陂路'],
        '东西湖区': ['金银潭', '常青花园'],
        '江夏区': ['藏龙岛', '流芳'],
      },
    },
  };
  function filterStores(f) {
    const list = D.stores.filter((s) => {
      if (s.city !== f.city || (f.brand && s.brand !== f.brand)) return false;
      if (f.kw && !(s.name + s.district + s.area + s.address).includes(f.kw)) return false;
      if (f.area in radii) return D.withinRadius(s, radii[f.area]);
      if (f.areaType === 'metro') return s.metro === f.area;
      if (f.areaType === 'district') {
        if (f.areaGroup === '热门商圈') return areaHit(s.area, f.area);
        if (s.district !== f.areaGroup) return false;
        return f.wholeDistrict || !f.area || areaHit(s.area, f.area);
      }
      if (f.area === '近地铁') return !!s.metro || s.tags.includes(f.area);
      return !f.area || s.district === f.area || s.metro === f.area;
    });
    const dist = (s) => s.km ?? Infinity;
    const by = {
      smart: (a, b) => Number(!!b.rec) - Number(!!a.rec) || dist(a) - dist(b),
      distance: (a, b) => dist(a) - dist(b),
      popular: (a, b) => (b.reviews || 0) - (a.reviews || 0) || (b.rating || 0) - (a.rating || 0),
      rating: (a, b) => (b.rating || 0) - (a.rating || 0),
      low: (a, b) => minPrice(a) - minPrice(b),
      high: (a, b) => Number(b.linked) - Number(a.linked) || minPrice(b) - minPrice(a),
    };
    return list.sort((a, b) => Number(!!a.soon) - Number(!!b.soon) || by[f.sort](a, b));
  }
  /* 门店卡片（列表、笔记挂载等处复用）。已接入：可预约；未接入：只有基础信息 + 来源 */
  ui.storeCard = (s, hl) => {
    if (!STORE_BOOKING_ENABLED || !s.linked) {
      return `<div class="scard scard-un" data-go="store-detail?id=${s.id}">
        <div class="scard-img un">${icon('store')}</div>
        <div class="scard-bd">
          <div class="scard-name">${s.name}</div>
          <div class="scard-meta"><span class="sb sb-un">未入驻</span><span class="faint store-brand">${esc(s.brand === 'biz' ? (s.cat || '艾灸养生') : (D.storeBrands[s.brand]?.name || s.cat || '艾灸养生'))}</span><span class="grow"></span>${s.km != null ? `<span class="dist">${icon('pin', 'ic-xs')}${D.kmText(s)}</span>` : ''}</div>
          <div class="scard-sub ell">${s.district} · ${s.area} · 营业 ${s.hours || '待维护'}</div>
          <div class="scard-sub">可查看官方团购套餐与到店服务</div>
          <div class="scard-foot">
            <span></span>
            <span class="row gap6"><button class="btn btn-primary btn-sm" onclick="event.stopPropagation();XA.act.goMeituan('${s.id}')">查看团购 ${icon('right','ic-xs')}</button><button class="btn btn-outline btn-sm" onclick="event.stopPropagation();XA.act.navTo('${s.id}')">导航</button></span>
          </div>
        </div>
      </div>`;
    }
    const next = D.nextSlot(s), open = isOpen(s);
    const tags = (hl || []).filter((t) => s.tags.includes(t)).concat(s.tags.filter((t) => !(hl || []).includes(t))).slice(0, 2);
    const badges = D.storeBadges(s);
    const meta = s.soon ? `<span class="muted">${s.soon}</span>`
      : `<span class="rate">${icon('star', 'ic-xs')}${(s.rating || 0).toFixed(1)}</span><span class="faint">${s.reviews} 条评价</span>`;
    return `<div class="scard" data-go="store-detail?id=${s.id}">
      <div class="scard-img">${ui.cover(s,"",s.gallery[0])}${s.soon ? `<em>即将开业</em>` : `<em class="sb-${s.brand}">${D.storeBrands[s.brand].label}</em>`}</div>
      <div class="scard-bd">
        <div class="scard-name">${s.name}</div>
        <div class="scard-meta">${meta}<span class="grow"></span>${s.km != null ? `<span class="dist">${icon('pin', 'ic-xs')}${D.kmText(s)}</span>` : ''}</div>
        ${s.soon ? '' : `<div class="scard-badges">${badges.map((b) => `<span class="sb ${b.cls}">${b.t}</span>`).join('')}</div>`}
        <div class="scard-sub ell">${s.district} · ${s.area}${s.soon ? '' : ` · <span class="${open ? 'c-primary' : 'faint'}">${open ? '营业中' : '休息中'}</span><span class="faint"> · ${next.text}</span>`}</div>
        ${s.soon || !tags.length ? '' : `<div class="scard-tags">${tags.map((t) => `<span class="tag ${(hl || []).includes(t) ? 'tag-green' : 'tag-gray'}">${t}</span>`).join('')}</div>`}
        <div class="scard-foot">
          ${s.services.length ? `<span class="price"><small>¥</small>${minPrice(s)} 起</span>` : `<span></span>`}
          ${s.soon ? `<button class="btn btn-tonal btn-sm" onclick="event.stopPropagation();XA.act.openRemind('${s.id}')">开业提醒我</button>` : s.services.length ? `<button class="btn btn-primary btn-sm" data-go="booking?store=${s.id}">预约</button>` : `<span></span>`}
        </div>
      </div>
    </div>`;
  };
  XA.act.openRemind = (id) => XA.subscribe(['门店开业通知'], (ok) => ok && XA.toast('开业时会通知您', true));

  const pickSheet = (title, opts, cur, fn) => XA.sheet({
    title,
    html: `<div class="radios">${opts.map((o) => `<button class="radio ${o[0] === cur ? 'on' : ''}" onclick="XA.act.${fn}('${o[0]}')"><div><div class="bold">${o[1]}</div>${o[2] ? `<div class="faint small">${o[2]}</div>` : ''}</div><span class="check ${o[0] === cur ? 'on' : ''}">${icon('check')}</span></button>`).join('')}</div>`,
  });
  XA.act.sfCity = () => pickSheet('选择城市', D.cities.map((c) => [c, c, D.located.status === 'granted' && c === D.located.city ? '当前定位城市' : `${D.stores.filter((s) => s.city === c).length} 家门店`]), F().city, 'sfSetCity');
  XA.act.sfSetCity = (city) => { XA.tmp.sf = { ...defaults(), city }; XA.closeSheet(); XA.refresh(); };
  XA.act.sfSet = (key, value) => {
    if (key === 'area') Object.assign(F(), { areaGroup: '', areaType: '', wholeDistrict: false });
    F()[key] = value; XA.refresh(); XA.$('#view').scrollTop = 0;
  };
  XA.act.sfSearch = (v) => XA.act.sfSet('kw', v.trim());
  XA.act.sfReset = () => { XA.tmp.sf = { ...defaults(), city: F().city }; XA.refresh(); };
  XA.act.nearestStores = () => {
    const matches = D.stores.some((s) => s.city === D.located.city && D.withinRadius(s, D.nearbyRadius));
    XA.tmp.sf = { ...defaults(), area: matches ? D.nearbyRadius + 'km' : '', sort: 'distance' };
    XA.go('store?near=1');
  };
  const option = (key, value, label) => `<button class="chip ${F()[key] === value ? 'on' : ''}" aria-pressed="${F()[key] === value}" onclick="XA.act.sfSet('${key}','${value}')">${label}</button>`;
  const group = (title, options) => `<div class="filter-group"><b>${title}</b><div class="chips wrap">${options.join('')}</div></div>`;
  const menu = (label, content) => `<details name="store-menu"><summary>${label}${icon('down', 'ic-xs')}</summary><div class="store-options">${content}</div></details>`;
  function areaGroups(mode) {
    const city = F().city;
    if (mode === 'metro') return (D.metroLines[city] || []).map((line) => ({ name: line.name, items: line.stations }));
    const cat = AREA_CATALOG[city];
    if (cat) {
      const groups = [{ name: '热门商圈', items: cat.hot }];
      Object.entries(cat.districts).forEach(([name, items]) => groups.push({ name, items }));
      return groups;
    }
    const districts = new Map();
    D.stores.filter((s) => s.city === city).forEach((s) => {
      if (!districts.has(s.district)) districts.set(s.district, new Set());
      districts.get(s.district).add(s.area);
    });
    const groups = Array.from(districts, ([name, areas]) => ({ name, items: [...areas] }));
    return [{ name: '热门商圈', items: groups.flatMap((g) => g.items) }, ...groups];
  }
  function bindAreaPanel() {
    const panel = XA.$('.near-panel'), f = F();
    const groups = { district: areaGroups('district'), metro: areaGroups('metro') };
    let mode = groups[f.areaType] && groups[f.areaType].length ? f.areaType : 'district';
    let index = Math.max(0, groups[mode].findIndex((g) => g.name === f.areaGroup));
    const rail = panel.querySelector('.near-groups'), pane = panel.querySelector('.near-items');
    function paint() {
      panel.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.mode === mode));
      rail.innerHTML = groups[mode].map((g, i) => `<button type="button" data-index="${i}" aria-pressed="${i === index}">${esc(g.name)}</button>`).join('');
      const g = groups[mode][index];
      const selected = f.areaType === mode && f.areaGroup === g.name;
      const item = (j, label, active) => `<button type="button" data-group="${index}" data-item="${j}" aria-pressed="${active}">${esc(label)}</button>`;
      const isMetro = mode === 'metro';
      const allLabel = isMetro ? '全部' : (g.name === '热门商圈' ? '全部热门商圈' : `全部${esc(g.name)}`);
      const items = [item(-1, allLabel, selected && f.wholeDistrict)];
      g.items.forEach((name, j) => {
        const value = isMetro ? name + '站' : name;
        items.push(item(j, name, selected && !f.wholeDistrict && f.area === value));
      });
      pane.innerHTML = `${isMetro ? '' : `<div class="near-items-hd">${esc(g.name)}</div>`}${items.join('')}`;
      pane.scrollTop = 0;
    }
    panel.onclick = (e) => {
      const button = e.target.closest('button');
      if (!button) return;
      if (button.dataset.mode) {
        mode = button.dataset.mode; index = 0; rail.scrollTop = 0;
      } else if (button.hasAttribute('data-index')) {
        index = +button.dataset.index;
      } else if (button.hasAttribute('data-item')) {
        const g = groups[mode][+button.dataset.group], j = +button.dataset.item;
        const area = j < 0 ? (g.name === '热门商圈' ? '' : g.name) : g.items[j] + (mode === 'metro' ? '站' : '');
        Object.assign(f, { area, areaType: mode, areaGroup: g.name, wholeDistrict: j < 0 });
        XA.refresh(); XA.$('#view').scrollTop = 0; return;
      } else return;
      paint();
    };
    paint();
    rail.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest' });
  }
  const menuOn = (label, content, on) => `<details name="store-menu" class="${on ? 'filter-on' : ''}"><summary>${esc(label)}${icon('down', 'ic-xs')}</summary><div class="store-options">${content}</div></details>`;
  function menus(f) {
    const cityStores = D.stores.filter((s) => s.city === f.city);
    const here = D.located.status === 'granted' && f.city === D.located.city;
    const lines = D.metroLines[f.city] || [];
    const areaLabel = f.area || (here ? '附近' : '全城');
    const nearby = `<button class="near-scrim" aria-label="收起附近筛选" onclick="this.closest('details').open=false"></button>
      <div class="near-panel">
        <div class="near-location">${icon('pin','ic-s')}${D.located.status==='granted' ? '您在 · '+esc(D.located.city)+' '+esc(D.located.spot) : `正在查看${esc(f.city)} · <button class="link" onclick="XA.act.askLocation()">获取定位</button>`}</div>
        <div class="near-radius">${[option('area', '', here ? '智能范围' : '全城'), ...(here ? Object.keys(radii).map((r) => option('area', r, r.replace('米', 'm').replace('km', '000m'))) : [])].join('')}</div>
        <div class="near-columns"><div class="near-modes"><button type="button" data-mode="district">商圈</button>${lines.length ? '<button type="button" data-mode="metro">地铁</button>' : ''}</div><div class="near-groups"></div><div class="near-items"></div></div>
      </div>`;
    /* 门店类型选项只统计已接入门店，未接入门店不归入任何类型 */
    const typeIds = [...new Set(cityStores.map((s) => s.brand))].filter((id) => STORE_TYPE[id]);
    return menuOn(areaLabel, nearby, !!f.area)
      + menuOn(SORTS[f.sort], group('排序方式', Object.entries(SORTS).map(([id, label]) => option('sort', id, label))), f.sort !== 'smart')
      + menuOn(f.brand ? STORE_TYPE[f.brand] : '门店类型', group('门店类型', [option('brand', '', '全部类型'), ...typeIds.map((id) => option('brand', id, STORE_TYPE[id]))]), !!f.brand);
  }

  XA.page('store', {
    title: '门店',
    mounted: bindAreaPanel,
    render() {
      const f = F(), list = filterStores(f);
      return `
      <div class="store-top">
        ${XA.locationChip ? XA.locationChip() : ''}
        <div class="row gap8">
          <button class="city-btn" onclick="XA.act.sfCity()">${f.city}${icon('down', 'ic-s')}</button>
          <div class="searchbar input grow">${icon('search')}<input id="storeKw" type="search" placeholder="搜门店、商圈、地址" value="${esc(f.kw)}" onkeydown="if(event.key==='Enter')XA.act.sfSearch(this.value)"></div>
          <button type="button" class="btn btn-primary search-btn" onclick="XA.act.sfSearch(document.getElementById('storeKw').value)">搜索</button>
        </div>
        <div class="store-menus">${menus(f)}</div>
      </div>
      <div class="proj-rail">${PROJECTS.map((p) => `<button type="button" class="proj ${f.project === p.id ? 'on' : ''}" onclick="XA.act.sfProject('${p.id}')"><span class="proj-art ${f.project === p.id ? 'proj-on' : ''}">${XA.art(p.art, p.tone)}</span><span class="proj-name">${p.name}</span></button>`).join('')}</div>
      ${list.length ? `<div class="slist">${list.map((s) => ui.storeCard(s)).join('')}</div>
        <div class="end">没有更多门店了<br>门店信息仅供参考，请以实际情况为准</div>` :
        `<div class="empty">${XA.art('room', 'sage', 'empty-art')}<div class="empty-t">没有符合条件的门店</div><div class="muted small">您可以减少几个筛选条件再试</div></div>`}`;
    },
  });

  /* ================= 团购券验券（美团 / 抖音）：验券 → 选门店 → 预约 → 到店一并核销 ================= */
  XA.act.gpOpen = (storeId) => {
    XA.tmp.gpStore = storeId || '';
    XA.sheet({
      title: '团购券验券',
      html: `<div class="muted small">在美团、抖音买的团购券，验券后就能预约。到店出示核销码，券会一并核销，积分自动到账。</div>
        <div class="row gap8 mt12"><input class="input grow" id="gpCode" placeholder="输入券码" autocomplete="off"><button class="btn btn-tonal scan-btn" onclick="XA.act.gpScan()">${icon('scan')}扫码</button></div>
        <div class="err mt8" id="gpErr"></div>
        <button class="btn btn-primary btn-block" onclick="XA.act.gpCheck()">验券</button>
        <div class="demo-box mt16"><b>演示可用券码（点击填入）</b>${D.groupons.map((g) => `<div><button class="link" onclick="document.getElementById('gpCode').value='${g.code}'">${g.channel} · ${D.storeBrands[g.brand].name}：${g.code}</button></div>`).join('')}</div>`,
    });
  };
  XA.act.gpScan = () => { XA.$('#gpCode').value = D.groupons[0].code; XA.toast('已识别券码（演示）'); };
  XA.act.gpCheck = () => {
    const v = XA.$('#gpCode').value.trim().toUpperCase(), err = XA.$('#gpErr'), g = D.grouponOf(v), sid = XA.tmp.gpStore;
    if (!v) return (err.textContent = '请输入券码');
    if (!g) return (err.textContent = '没有查到这张券。请核对券码，或确认是否在美团、抖音购买。');
    if (XA.state.appts.some(a => a.status === 'done' && a.gp?.code === v)) return (err.textContent = '这张券已经核销过了，一张券只能使用一次。');
    const bound = XA.state.appts.find((a) => a.status === 'booked' && a.gp && a.gp.code === v);
    XA.closeSheet();
    if (bound) return XA.modal({ title: '这张券已用于预约', content: `${D.storeOf(bound.storeId).name}　${XA.d.nice(bound.date)} ${bound.time}`, confirmText: '查看预约', cancelText: '知道了', onConfirm: () => XA.go('appt?id=' + bound.id) });
    const stores = D.grouponStores(g), here = sid && stores.some((s) => s.id === sid);
    const exp = XA.d.md(XA.d.add(g.expire));
    XA.sheet({
      title: '验券成功',
      html: `<div class="gp-card">
          <div class="row gap6">${chTag(g.channel)}<span class="faint small">团购券 ${D.maskCode(g.code)}</span></div>
          <div class="gp-title">${g.title}</div>
          <div class="muted small">团购价 ¥${g.amount} · 有效期至 ${exp} · 适用于${D.storeBrands[g.brand].name}门店</div>
        </div>
        ${here ? `<button class="btn btn-primary btn-block mt16" onclick="XA.closeSheet();XA.go('booking?store=${sid}&gp=${g.code}')">在${short(D.storeOf(sid))}预约</button><div class="faint small center mt8">也可以换到其他适用门店使用</div>` :
          `${sid ? `<div class="tipbox warn mt12">${icon('info')}<span>这张券不适用于${D.storeOf(sid).name}，可在下面的门店使用。</span></div>` : ''}
          <div class="bold mt16">选择门店预约</div>`}
        <div class="radios ${here ? 'mt8' : ''}">${stores.filter((s) => !here || s.id !== sid).map((s) => `<button class="radio" onclick="XA.closeSheet();XA.go('booking?store=${s.id}&gp=${g.code}')"><div><div class="bold">${s.name}</div><div class="faint small">${s.km != null ? '距您 ' + D.kmText(s) + ' · ' : s.city + ' · '}${s.district} ${s.area}</div></div>${icon('right', 'faint')}</button>`).join('')}</div>`,
    });
  };

  /* ================= 门店详情 ================= */
  XA.act.navTo = (id) => {
    const s = D.storeOf(id);
    XA.sheet({ title: '导航到门店', html: `<div class="muted small">${s.address}</div><div class="radios mt12">${['微信内置地图', '腾讯地图', '高德地图'].map((m) => `<button class="radio" onclick="XA.closeSheet();XA.toast('已打开${m}（演示）',true)"><span class="bold">${m}</span>${icon('right', 'faint')}</button>`).join('')}</div>` });
  };
  XA.act.call = (id) => { const s = D.storeOf(id); XA.modal({ title: s.phone, content: `${s.name}　营业时间 ${s.hours || '营业时间待维护'}`, confirmText: '呼叫', onConfirm: () => XA.toast('正在拨号（演示）') }); };
  XA.act.goMeituan = () => XA.modal({ title: '查看美团团购', content: '美团跳转入口为演示，暂未接入实际跳转。', confirmText: '知道了' });
  /* 未接入门店：用户可以表达"希望接入"，商家可以申请接入 */
  XA.act.wish = (id) => { const w = XA.state.wish; if (!w.includes(id)) w.push(id); XA.save(); XA.toast('已记录。这家店接入后会通知您', true); XA.refresh(); };
  const applications = { new: '门店入驻', claim: '认领我的门店', dealer: '成为经销商', franchise: '成为加盟商' };
  XA.act.partner = (type, id) => {
    if (type === 'new' || type === 'claim') {
      const url = new URL('manager.html', location.href);
      url.searchParams.set('action', type);
      if (id) url.searchParams.set('store', id);
      XA.modal({ title: '打开晓艾店长端', content: type === 'claim' ? '前往店长端认领这家门店。' : '前往店长端申请新店入驻。', confirmText: '打开', onConfirm: () => location.assign(url.href) });
      return;
    }
    const target = type === 'claim' ? D.storeOf(id).name : type === 'dealer' ? D.brands[id].name : type === 'franchise' ? D.storeBrands[id].name : '';
    const key = type + ':' + (id || '');
    const el = XA.sheet({ title: applications[type], html: `<form class="partner-form">
      ${target ? `<strong>${esc(target)}</strong>` : '<label>门店名称<input class="input" name="store" required maxlength="60"></label><label>门店地址<input class="input" name="address" required maxlength="120"></label>'}
      <label>联系人<input class="input" name="contact" required maxlength="32"></label>
      <label>联系电话<input class="input" name="phone" type="tel" required pattern="1[0-9]{10}" placeholder="11 位手机号"></label>
      <small class="muted">原型演示，申请仅保存在当前设备。</small>
      <button class="btn btn-primary btn-block">保存申请</button></form>` });
    el.querySelector('form').onsubmit = (event) => {
      event.preventDefault();
      const fields = Object.fromEntries(new FormData(event.target));
      if (Object.values(fields).some((v) => !v.trim())) return XA.toast('请填写完整信息');
      const records = XA.state.partnerApplications ||= {};
      const recordKey = type === 'new' ? key + fields.store.trim() + ':' + fields.address.trim() : key;
      records[recordKey] = { type, target, ...fields };
      XA.save(); XA.closeSheet(); XA.toast('申请已保存在本机', true);
    };
  };
  XA.page('chain-brand', {
    title: '连锁品牌',
    render(q) {
      const id = q.id === 'xaj' ? 'xaj' : 'yq', brand = D.storeBrands[id];
      return `<div class="sec card"><div class="brand-mark">${brand.name[0]}</div><h1 class="h2">${brand.name}</h1><p class="muted">${brand.desc}</p>
        <button class="btn btn-tonal" onclick="XA.act.partner('franchise','${id}')">成为加盟商</button></div>
        ${ui.sec('品牌门店')}<div class="slist">${D.stores.filter((s) => s.brand === id).map((s) => ui.storeCard(s)).join('')}</div>`;
    },
  });
  const REVIEWS = [
    { who: '陈女士', lv: '黄金', star: 5, text: '带妈妈一起来的，艾灸师很耐心，会先问身体情况再灸。环境安静，妈妈说下次还来。', tags: ['服务耐心', '环境安静'] },
    { who: '周先生', lv: '白银', star: 5, text: '肩颈舒缓做完松快很多，烟味比想象中小。停车方便。', tags: ['烟味小', '停车方便'] },
  ];
  const unlinkedDetail = (s) => {
    const wished = XA.state.wish.includes(s.id);
    return `
      <div class="un-hd"><span>门店信息</span></div>
      <div class="sec card">
        <h1 class="h2">${s.name}</h1>
        <div class="scard-meta mt4"><span class="sb sb-un">未入驻</span><span class="faint store-brand">${esc(s.brand === 'biz' ? (s.cat || '艾灸养生') : (D.storeBrands[s.brand]?.name || s.cat || '艾灸养生'))} · ${esc(s.district)} ${esc(s.area)}</span></div>
      </div>
      <div class="sec card addr">
        <div class="grow" onclick="XA.act.navTo('${s.id}')"><div class="bold">${s.address}</div><div class="muted small">${s.km != null ? `距您 ${D.kmText(s)}` : s.city}</div></div>
        <button class="rbtn" onclick="XA.act.navTo('${s.id}')">${icon('nav')}<span>导航</span></button>
        <button class="rbtn" onclick="XA.act.call('${s.id}')">${icon('phone')}<span>电话</span></button>
      </div>
      <div class="sec card">
        <div class="kv"><b>营业时间</b><span>${s.hours || '营业时间待维护'}</span></div>
        <div class="kv"><b>联系电话</b><span>${s.phone || '待维护'}</span></div>
      </div>
      <div class="sec tipbox">${icon('info')}<span>这家门店暂未入驻晓艾，可查看美团团购套餐与到店服务。</span></div>
      <div class="sec">
        <button class="btn btn-primary btn-block" onclick="XA.act.goMeituan('${s.id}')">${icon('store','ic-s')} 查看官方团购 ${icon('right','ic-xs')}</button>
        <button class="btn ${wished ? 'btn-gray' : 'btn-tonal'} btn-block mt8" ${wished ? '' : `onclick="XA.act.wish('${s.id}')"`}>${wished ? '已记录，接入后通知您' : '希望这家店接入晓艾'}</button>
      </div>`;
  };
  XA.page('store-detail', {
    title: '门店详情',
    render(q) {
      const s = D.storeOf(q.id);
      if (!STORE_BOOKING_ENABLED || !s.linked) return unlinkedDetail(s);
      const next = D.nextSlot(s), open = isOpen(s), B = D.storeBrands[s.brand];
      const acts = D.activities.filter((a) => a.store === s.id);
      return `
      <div class="carousel scar" id="car">${s.gallery.map((a,i) => `<div class="slide">${i ? ui.art(a) : ui.cover(s,"",a)}</div>`).join('')}</div>
      <div class="car-dots" id="carDots">${s.gallery.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div>
      <div class="sec card">
        <h1 class="h2">${s.name}</h1>
        <div class="scard-meta mt4">${s.soon ? `<span class="tag tag-orange">即将开业 · ${s.soon}</span>` : `<span class="rate">${icon('star', 'ic-xs')}${s.rating.toFixed(1)}</span><span class="faint">${s.reviews} 条评价</span><span class="faint">· ${s.district} ${s.area}</span>`}</div>
        ${s.soon ? '' : `<div class="mt8"><span class="${open ? 'c-primary' : 'muted'} bold">${open ? '营业中' : '休息中'}</span><span class="muted">　${s.hours || '营业时间待维护'}　</span><span class="${next.day === 0 ? 'c-primary' : 'muted'}">${next.text}</span></div>`}
        <div class="brand-line mt12"><div class="scard-badges">${D.storeBadges(s, { withBrand: true }).map((b) => `<span class="sb ${b.cls}">${b.t}</span>`).join('')}</div></div>
        <div class="muted small mt8">${B.desc}</div>
        ${s.brand !== 'biz' ? `<button class="link mt8" data-go="chain-brand?id=${s.brand}">进入${B.name}品牌页 ${icon('right', 'ic-xs')}</button>` : ''}
        <div class="scard-tags mt12">${s.tags.map((t) => `<span class="tag tag-gray">${t}</span>`).join('')}</div>
      </div>
      <div class="sec card addr">
        <div class="grow" onclick="XA.act.navTo('${s.id}')"><div class="bold">${s.address}</div><div class="muted small">${s.km != null ? `距您 ${D.kmText(s)} · ` : ''}${s.tags.includes('近地铁') ? '地铁步行约 5 分钟' : s.tags.includes('免费停车') ? '到店可免费停车' : s.city}</div></div>
        <button class="rbtn" onclick="XA.act.navTo('${s.id}')">${icon('nav')}<span>导航</span></button>
        <button class="rbtn" onclick="XA.act.call('${s.id}')">${icon('phone')}<span>电话</span></button>
      </div>
      ${s.groupon.length && !s.soon ? `<div class="sec card group">
        <span class="group-ic gold">${icon('ticket')}</span>
        <div class="grow"><div class="bold">支持团购券核销</div><div class="muted small">验券后即可预约，到店一并核销</div><div class="row gap6 mt4">${s.groupon.map(chTag).join('')}</div></div>
        <button class="btn btn-tonal btn-sm" onclick="XA.act.gpOpen('${s.id}')">去验券</button>
      </div>` : ''}
      ${(() => {
        const ps = D.perksFor(s), got = ps.filter((x) => XA.hasPerk(x.id)).length;
        return ps.length && !s.soon ? `<div class="sec card group" data-go="perks">
          <span class="group-ic gold">${icon('crown')}</span>
          <div class="grow"><div class="bold">晓艾会会员可领本店权益</div><div class="muted small">${ps.map((x) => x.name).join('、')}</div></div>
          ${got ? `<span class="tag tag-green">已领 ${got} 项</span>` : `<span class="btn btn-tonal btn-sm">去领取</span>`}
        </div>` : '';
      })()}
      ${ui.sec('服务项目')}
      <div class="sec svc-list">
        ${s.services.map(D.service).map((sv) => `<div class="card svc" ${s.soon ? '' : `data-go="booking?store=${s.id}&service=${sv.id}"`}>
          ${ui.art(sv.art, 'svc-img')}
          <div class="grow">
            <div class="bold">${sv.name} ${sv.hot ? `<span class="tag tag-orange">人气</span>` : ''}${sv.tag ? `<span class="tag tag-orange">${sv.tag}</span>` : ''}</div>
            <div class="muted small">${sv.dur} 分钟 · ${sv.desc}</div>
            <div class="row gap6 mt8">${ui.price(sv.mprice)}${sv.mprice < sv.price ? `<span class="tag tag-gold">会员价</span><span class="del faint small">¥${sv.price}</span>` : ''}<span class="grow"></span>${s.soon ? '' : `<span class="btn btn-primary btn-sm">预约</span>`}</div>
          </div>
        </div>`).join('')}
      </div>
      ${ui.sec('艾灸师')}
      <div class="staff-row pad">${D.staffFor(s).slice(1).map((w) => `<div class="staff-card">${ui.avatar(w.name, 'lg')}<div class="bold">${w.name}</div><div class="faint small">${w.title}</div></div>`).join('')}</div>
      ${acts.length ? ui.sec('门店活动', '全部活动', 'activities') + `<div class="sec">${acts.map(actCard).join('')}</div>` : ''}
      ${s.reviews ? ui.sec(`顾客评价（${s.reviews}）`) + `<div class="sec card">${REVIEWS.map((r) => `<div class="review"><div class="row gap8">${ui.avatar(r.who)}<div><div class="bold">${r.who} <span class="tag tag-gold">${r.lv}</span></div><div class="stars">${icon('star', 'ic-xs').repeat(r.star)}</div></div></div><p>${r.text}</p><div class="scard-tags">${r.tags.map((t) => `<span class="tag tag-gray">${t}</span>`).join('')}</div></div>`).join('')}<div class="faint small center">评价均来自到店核销的真实顾客，审核后展示</div></div>` : ''}
      <div class="sec">${ui.disclaimer('门店提供养生保健服务，不属于医疗行为。')}</div>`;
    },
    mounted() {
      const car = XA.$('#car'), dots = XA.$$('#carDots i');
      if (car) car.addEventListener('scroll', () => { const i = Math.round(car.scrollLeft / car.clientWidth); dots.forEach((d, k) => d.classList.toggle('on', k === i)); }, { passive: true });
    },
    footer(q) {
      const s = D.storeOf(q.id);
      return `<button class="fbtn" onclick="XA.act.call('${s.id}')">${icon('phone')}<span>电话</span></button><button class="btn btn-primary grow" onclick="XA.act.goMeituan('${s.id}')">${icon('store','ic-s')} 查看团购</button>`;
    },
  });

  /* ================= 预约下单：项目 → 艾灸师 → 日期 → 时间 → 支付 ================= */
  const apptTime = (a) => { const d = XA.d.fromKey(a.date), t = a.time.split(':'); d.setHours(+t[0], +t[1], 0, 0); return d; };
  const hoursLeft = (a) => (apptTime(a) - Date.now()) / 3600000;
  const svcPrice = (sv) => (XA.state.loggedIn ? sv.mprice : sv.price);
  /* 会员优先时段：晓艾家会籍、Plus、黄金及以上，或已领取本店会籍 / 礼遇 */
  const canVip = () => !!XA.state.membership || XA.isPlus() || XA.level().lv >= 3 || XA.hasPerk('sp1') || XA.hasPerk('sp2');

  const dateStrip = (cur, fn) => `<div class="dates">${Array.from({ length: 7 }, (_, i) => {
    const d = XA.d.add(i), k = XA.d.key(d);
    return `<button class="date ${k === cur ? 'on' : ''}" onclick="${fn}('${k}')"><span>${i === 0 ? '今天' : i === 1 ? '明天' : XA.d.wk(d)}</span><b>${d.getDate()}</b><span>${d.getMonth() + 1}月</span></button>`;
  }).join('')}</div>`;
  const slotGrid = (o, fn, wait) => {
    return `<div class="slots">${D.slots(o.store, o.date, o.staff, o.service, o.exclude).map((s) => {
      if (s.off) return `<button class="slot off" disabled><b>${s.time}</b><span>未排班</span></button>`;
      if (s.past) return `<button class="slot off" disabled><b>${s.time}</b><span>已过</span></button>`;
      if (s.full) return wait ? `<button class="slot full" onclick="XA.act.waitJoin('${s.time}')"><b>${s.time}</b><span>约满 · 可候补</span></button>` : `<button class="slot off" disabled><b>${s.time}</b><span>约满</span></button>`;
      return `<button class="slot ${o.time === s.time ? 'on' : ''} ${s.vip ? 'vip' : ''}" onclick="${fn}('${s.time}',${s.vip ? 1 : 0})"><b>${s.time}</b><span>${s.vip ? '会员优先' : '可约'}</span></button>`;
    }).join('')}</div>`;
  };

  const BK = (q) => {
    if (!STORE_BOOKING_ENABLED) return null;
    const key = [q.store, q.service, q.wait, q.gp].join('|');
    let bk = XA.tmp.bk;
    if (!bk || bk.key !== key) {
      const w = q.wait && XA.state.waitlist.find((x) => x.id === q.wait);
      const storeId = w?.storeId || q.store || D.nearest('xaj')?.id;
      const store = D.stores.find(s => s.id === storeId);
      if ((q.wait && w?.status !== 'offered') || !store?.linked || store.soon || !store.services?.length) return null;
      const g = q.gp && D.grouponOf(q.gp);
      bk = XA.tmp.bk = { key, store: store.id, service: store.services.includes(q.service) ? q.service : store.services[0], staff: 'any', date: XA.d.key(new Date()), time: null };
      if (g) Object.assign(bk, { gp: g.code, service: g.service }); // 团购券预约：项目由券决定
      if (w) Object.assign(bk, { service: w.serviceId, staff: w.staffId, date: w.date, time: w.time, wait: w.id });
      else if (!D.slots(store.id, bk.date, 'any', bk.service).some((s) => !s.past && !s.full)) bk.date = XA.d.key(XA.d.add(1)); // 今天没有可约时段时默认看明天
    }
    const activeStore = D.stores.find(s => s.id === bk.store);
    if (!activeStore?.linked || activeStore.soon || !activeStore.services?.includes(bk.service)) return null;
    if (!D.staffFor(activeStore).some(w => w.id === bk.staff)) {
      bk.staff = 'any';
      bk.time = null;
    }
    if (bk.time && !D.slots(bk.store, bk.date, bk.staff, bk.service).some(s => s.time === bk.time && !s.full && !s.past)) bk.time = null;
    return bk;
  };
  XA.act.bkSet = (k, v) => { const bk = XA.tmp.bk; bk[k] = v; bk.time = null; bk.requestId = null; XA.refresh(); };
  XA.act.bkTime = (t, vip) => {
    if (vip && !canVip()) return XA.modal({ title: '19:00 是会员优先时段', content: 'Plus、黄金及以上，或已领取晓艾家会籍，可优先预约；当天 12:00 后剩余名额向所有人开放。', confirmText: '看看怎么领取', cancelText: '选其他时间', onConfirm: () => XA.go('perks') });
    if (XA.tmp.bk.time !== t) XA.tmp.bk.requestId = null;
    XA.tmp.bk.time = t; XA.refresh();
  };
  function storeAction(action, fields) {
    try {
      return XA.storeAction(action, fields);
    } catch (error) {
      XA.toast(error.message || '预约更新失败');
      XA.loadCatalog().then(() => XA.refresh()).catch(() => {});
      return null;
    }
  }
  XA.act.bkSubmit = () => {
    if (!STORE_BOOKING_ENABLED) return XA.toast('门店暂不支持预约');
    const bk = XA.tmp.bk;
    if (!bk.time) return XA.toast('请先选择到店时间');
    XA.needLogin(() => {
      const sv = D.service(bk.service), g = bk.gp && D.grouponOf(bk.gp), price = g ? g.amount : svcPrice(sv), deposit = g ? 0 : sv.deposit;
      const create = () => {
        const a = { id: (bk.requestId ||= XA.uid('YY')), storeId: bk.store, serviceId: bk.service, staffId: bk.staff, date: bk.date, time: bk.time, status: 'booked', price, deposit, gp: g ? { code: g.code, channel: g.channel, title: g.title, amount: g.amount } : null, code: String(100000 + (XA.hash(Date.now() + bk.time) % 900000)), reschedule: 0, at: new Date().toISOString() };
        const saved = storeAction('book', {appointment: a, waitId: bk.wait})?.appointment;
        if (!saved) return;
        XA.save();
        XA.tmp.bk = null;
        XA.subscribe(['预约成功通知', '到店前 2 小时提醒'], () => XA.go('appt?id=' + saved.id + '&new=1', true));
      };
      if (deposit > 0) XA.pay({ title: '预约定金 · ' + sv.name, amount: deposit, onSuccess: create }); else create();
    }, '登录后继续预约，已选门店、技师和时段会保留。');
  };
  /* 候补登记（P1）：约满时段可登记，释放后订阅消息通知，30 分钟内确认 */
  XA.act.waitJoin = (t) => {
    const bk = XA.tmp.bk;
    if (XA.state.waitlist.some((w) => w.storeId === bk.store && w.serviceId === bk.service && w.staffId === bk.staff && w.date === bk.date && w.time === t)) return XA.toast('您已登记过这个时段的候补');
    XA.modal({
      title: `${t} 已约满`, content: '可以登记候补：有名额后可在我的预约中查看并确认。', confirmText: '登记候补', cancelText: '选其他时间',
      onConfirm: () => XA.needLogin(() => XA.subscribe(['候补成功通知'], (ok) => {
        if (!ok) return XA.toast('需要允许通知，才能在有名额时告诉您');
        const entry = {id: XA.uid('HB'), storeId: bk.store, serviceId: bk.service, staffId: bk.staff, date: bk.date, time: t};
        if (!storeAction('waitJoin', {entry})) return;
        XA.modal({ title: '候补登记成功', content: '可在我的预约中查看候补进度。', confirmText: '查看我的预约', cancelText: '继续选时间', onConfirm: () => XA.go('appts') });
      })),
    });
  };
  const policyHtml = (ch) => ch ? `<ul class="policy">
      <li>到店前可随时取消，团购券不会被核销，可以重新预约</li>
      <li>到店前 ${D.policy.rescheduleHours} 小时以上可免费改期 ${D.policy.rescheduleTimes} 次</li>
      <li>到店出示核销码，${ch}团购券一并核销，无需再付款</li>
      <li>如需退券，请在${ch}内申请</li>
    </ul>` : `<ul class="policy">
      <li>到店前 ${D.policy.freeCancelHours} 小时以上取消，定金全额原路退回</li>
      <li>不足 ${D.policy.freeCancelHours} 小时取消或未到店，扣除 ${D.policy.lateRate * 100}% 定金</li>
      <li>到店前 ${D.policy.rescheduleHours} 小时以上可免费改期 ${D.policy.rescheduleTimes} 次</li>
      <li>到店出示核销码，尾款到店支付，可用到店服务券</li>
    </ul>`;
  XA.page('booking', {
    title: '预约到店',
    render(q) {
      const bk = BK(q);
      if (!bk) return ui.empty('门店暂未入驻，请前往美团购买套餐', '查看门店', 'store');
      const store = D.storeOf(bk.store), staff = D.staffFor(store), g = bk.gp && D.grouponOf(bk.gp);
      return `
      <div class="sec card addr" data-go="store">
        <span class="addr-ic">${icon('store')}</span>
        <div class="grow"><div class="bold">${store.name}</div><div class="muted small">${store.km != null ? `距您 ${D.kmText(store)} · ` : ''}${store.address}</div></div>
        <span class="more">换门店${icon('right', 'ic-s')}</span>
      </div>
      ${bk.wait ? `<div class="sec banner-ok">${icon('bell')}<span>候补时段已有名额，请确认预约。</span></div>` : ''}
      ${g ? `<div class="sec banner-ok">${icon('ticket')}<span>正在使用<b>${g.channel}团购券</b>预约。到店出示核销码，券会一并核销。</span><button class="link" onclick="XA.go('booking?store=${store.id}',true)">不用券</button></div>` :
        store.groupon.length ? `<div class="sec tipbox" onclick="XA.act.gpOpen('${store.id}')">${icon('ticket')}<span>有${store.groupon.join('、')}团购券？先验券再预约</span>${icon('right', 'ic-s')}</div>` : ''}
      <div class="step-title"><em>1</em>${g ? '预约项目' : '选择项目'}</div>
      <div class="sec radios card">
        ${g ? `<div class="radio on"><div><div class="bold">${g.title}</div><div class="row gap6 mt4">${chTag(g.channel)}<span class="muted small">团购券抵扣，到店无需再付</span></div></div><span class="check on">${icon('check')}</span></div>` : store.services.map(D.service).map((sv) => `<button class="radio ${bk.service === sv.id ? 'on' : ''}" onclick="XA.act.bkSet('service','${sv.id}')">
          <div><div class="bold">${sv.name} <span class="faint small">${sv.dur} 分钟</span></div><div class="row gap6 mt4">${ui.price(svcPrice(sv))}${svcPrice(sv) < sv.price ? `<span class="tag tag-gold">会员价</span><span class="del faint small">¥${sv.price}</span>` : ''}</div></div>
          <span class="check ${bk.service === sv.id ? 'on' : ''}">${icon('check')}</span></button>`).join('')}
      </div>
      <div class="step-title"><em>2</em>选择艾灸师<span class="faint small">（可不选）</span></div>
      <div class="staff-row pad">${staff.map((w) => `<button class="staff-card pick ${bk.staff === w.id ? 'on' : ''}" onclick="XA.act.bkSet('staff','${w.id}')">${w.id === 'any' ? `<span class="avatar lg any">${icon('users')}</span>` : ui.avatar(w.name, 'lg')}<div class="bold">${w.name}</div><div class="faint small">${w.title}</div></button>`).join('')}</div>
      <div class="step-title"><em>3</em>选择到店时间</div>
      <div class="sec card">
        ${dateStrip(bk.date, "XA.act.bkSet.bind(null,'date')")}
        ${slotGrid(bk, 'XA.act.bkTime', true)}
        <div class="faint small mt8">灰色为已约满，点击可登记候补；有人取消时会通知您</div>
      </div>
      <div class="step-title">预约须知</div>
      <div class="sec card">${policyHtml(g && g.channel)}</div>`;
    },
    footer(q) {
      const bk = BK(q);
      if (!bk) return '';
      const sv = D.service(bk.service), price = svcPrice(sv);
      const sum = bk.time ? `<div class="small muted">${XA.d.nice(bk.date).replace(/（|）/g, ' ')}${bk.time}</div>` : `<div class="small faint">请选择到店时间</div>`;
      if (bk.gp) return `<div class="grow"><div class="bold">团购券抵扣 <span class="faint small">到店无需再付</span></div>${sum}</div>
        <button class="btn btn-primary ${bk.time ? '' : 'is-disabled'}" style="min-width:8.5rem" onclick="XA.act.bkSubmit()">确认预约</button>`;
      return `<div class="grow">${sv.deposit > 0 ? `<div>定金 ${ui.price(sv.deposit, 'lg')} <span class="faint small">到店再付 ¥${price - sv.deposit}</span></div>` : `<div>${ui.price(price, 'lg')} <span class="faint small">到店付款，免定金</span></div>`}${sum}</div>
        <button class="btn btn-primary ${bk.time ? '' : 'is-disabled'}" style="min-width:8.5rem" onclick="XA.act.bkSubmit()">${sv.deposit > 0 ? '付定金预约' : '确认预约'}</button>`;
    },
  });

  /* ================= 预约详情：核销码 / 改期 / 取消 / 提醒 ================= */
  const AST = { booked: ['待到店', '请按时到店，出示下方核销码'], done: ['已完成', '感谢到店，期待下次见面'], cancelled: ['已取消', ''], noshow: ['未到店', '本次预约已失效'] };
  /* 取消：分档政策，自动原路退款 */
  XA.act.apptCancel = (id) => {
    const a = XA.state.appts.find((x) => x.id === id), free = hoursLeft(a) >= D.policy.freeCancelHours;
    const refund = free ? a.deposit : Math.round(a.deposit * (1 - D.policy.lateRate) * 100) / 100;
    const msg = a.gp ? `本次预约使用${a.gp.channel}团购券，取消后券仍可重新预约，时段将释放给其他顾客。` : a.deposit === 0 ? '本次预约未收定金，取消后时段将释放给其他顾客。' :
      free ? `现在取消，定金 ¥${a.deposit} 将<b>全额原路退回</b>。` : `距到店已不足 ${D.policy.freeCancelHours} 小时，取消将扣除 ${D.policy.lateRate * 100}% 定金。<br>退回 <b>¥${refund}</b>，扣除 ¥${a.deposit - refund}。<br><span class="faint">如只是时间不合适，可以先试试改期。</span>`;
    XA.modal({
      title: '确定取消预约吗？', content: msg, confirmText: '确定取消', cancelText: '再想想', danger: true,
      onConfirm: () => { const saved = storeAction('cancel', {id}); if (!saved) return; XA.toast('预约已取消', true); XA.refresh(); },
    });
  };
  /* 改期：到店前 T 小时可自助改期一次，不重复收定金 */
  let rs = null;
  const paintRs = () => {
    XA.$('#rsBody').innerHTML = `${dateStrip(rs.date, 'XA.act.rsDate')}${slotGrid(rs, 'XA.act.rsTime', false)}
      <div class="faint small mt8">改期不重复收取定金，每个预约可改期 ${D.policy.rescheduleTimes} 次</div>`;
    const b = XA.$('#rsOk');
    b.classList.toggle('is-disabled', !rs.time);
    b.textContent = rs.time ? `改到 ${XA.d.nice(rs.date)} ${rs.time}` : '请选择新的时间';
  };
  XA.act.apptResched = (id) => {
    const a = XA.state.appts.find((x) => x.id === id);
    if (a.reschedule >= D.policy.rescheduleTimes) return XA.modal({ title: '已改期过一次', content: '每个预约只能自助改期一次。如需再次调整，请致电门店协助处理。', confirmText: '联系门店', onConfirm: () => XA.act.call(a.storeId) });
    if (hoursLeft(a) < D.policy.rescheduleHours) return XA.modal({ title: '已不能自助改期', content: `距到店不足 ${D.policy.rescheduleHours} 小时，无法在线改期。请致电门店协助处理。`, confirmText: '联系门店', onConfirm: () => XA.act.call(a.storeId) });
    rs = { id, store: a.storeId, staff: a.staffId, service: a.serviceId, date: a.date, time: null, exclude: id };
    XA.sheet({ title: '改到什么时候？', html: `<div id="rsBody"></div>`, footer: `<button class="btn btn-primary btn-block" id="rsOk" onclick="XA.act.rsOk()"></button>` });
    paintRs();
  };
  XA.act.rsDate = (k) => { rs.date = k; rs.time = null; paintRs(); };
  XA.act.rsTime = (t, vip) => { if (vip && !canVip()) return XA.toast('19:00 为会员优先时段'); rs.time = t; paintRs(); };
  XA.act.rsOk = () => {
    if (!rs.time) return XA.toast('请选择新的时间');
    if (!storeAction('reschedule', {id: rs.id, date: rs.date, time: rs.time})) return;
    XA.closeSheet(); XA.toast('改期成功', true); XA.refresh();
  };
  XA.act.apptVerify = (id) => {
    const a = XA.state.appts.find((x) => x.id === id);
    if (!a || !storeAction('verify', {id, storeId: a.storeId, code: a.code})) return;
    XA.toast('核销成功', true); XA.refresh();
  };
  XA.act.apptRemind = (id) => {
    const a = XA.state.appts.find((x) => x.id === id), s = D.storeOf(a.storeId), sv = D.service(a.serviceId);
    XA.sheet({
      title: '到店前 2 小时，您会收到',
      html: `<div class="wxmsg"><div class="wxmsg-hd"><span class="logo-dot">艾</span>晓艾 · 服务通知</div>
        <div class="wxmsg-t">预约到店提醒</div>
        <div class="kv"><b>预约项目</b><span>${sv.name}</span></div>
        <div class="kv"><b>到店时间</b><span>${XA.d.nice(a.date)} ${a.time}</span></div>
        <div class="kv"><b>门店地址</b><span>${s.name}　${s.address}</span></div>
        <div class="kv"><b>温馨提示</b><span>请提前 10 分钟到店，点击可一键导航</span></div>
        <div class="wxmsg-ft">进入小程序查看${icon('right', 'ic-xs')}</div></div>`,
    });
  };
  XA.page('appt', {
    title: '预约详情',
    render(q) {
      const a = XA.state.appts.find((x) => x.id === q.id);
      if (!a) return ui.empty('预约不存在', '查看全部门店', 'store');
      const s = D.storeOf(a.storeId), sv = D.service(a.serviceId), w = D.staffOf(a.staffId);
      const sub = a.status === 'cancelled' ? (a.deposit ? `定金已退回 ¥${a.refund}${a.refund < a.deposit ? `（按政策扣除 ¥${a.deposit - a.refund}）` : ''}` : '时段已释放') : a.status === 'noshow' ? `未到店，按政策扣除 ${D.policy.lateRate * 100}% 定金` : AST[a.status][1];
      return `
      <div class="status-hd ast-${a.status}"><h1>${q.new && a.status === 'booked' ? '预约成功' : AST[a.status][0]}</h1><div>${sub}</div></div>
      ${a.status === 'booked' ? `<div class="sec card code-card">
        <div class="muted small">${a.gp ? `到店出示给前台，${a.gp.channel}团购券一并核销` : '到店出示给前台，一码一次有效'}</div>
        <div class="qr-box">${XA.qr(a.code)}</div>
        <div class="verify-code">${a.code.replace(/(\d{3})(\d{3})/, '$1 $2')}</div>
        <div class="faint small">核销码</div>
      </div>` : ''}
      <div class="sec card">
        <div class="kv"><b>到店时间</b><span class="bold">${XA.d.nice(a.date)} ${a.time}</span></div>
        <div class="kv"><b>预约项目</b><span>${sv.name}（${sv.dur} 分钟）</span></div>
        <div class="kv"><b>艾灸师</b><span>${esc(a.staffName || w.name)}</span></div>
        <div class="kv"><b>费用</b><span>${a.gp ? `${a.gp.channel}团购券抵扣（券码 ${D.maskCode(a.gp.code)}），到店无需再付` : `会员价 ¥${a.price}${a.deposit ? `，已付定金 ¥${a.deposit}，到店再付 ¥${a.price - a.deposit}` : '，到店付款'}`}</span></div>
      </div>
      <div class="sec card addr">
        <div class="grow" data-go="store-detail?id=${s.id}"><div class="bold">${s.name}</div><div class="muted small">${s.address}</div></div>
        <button class="rbtn" onclick="XA.act.navTo('${s.id}')">${icon('nav')}<span>导航</span></button>
        <button class="rbtn" onclick="XA.act.call('${s.id}')">${icon('phone')}<span>电话</span></button></div>
      ${a.status === 'booked' ? `
      <div class="sec tipbox" onclick="XA.act.apptRemind('${a.id}')">${icon('bell')}<span>已开启提醒：到店前 2 小时微信通知您，附带导航</span>${icon('right', 'ic-s')}</div>
      <div class="step-title">取消与改期规则</div>
      <div class="sec card">${policyHtml(a.gp && a.gp.channel)}${a.reschedule ? `<div class="faint small mt8">本预约已改期 ${a.reschedule} 次</div>` : ''}</div>
      <div class="sec demo-box"><b>演示说明</b><div>以下按钮用于模拟店端操作，正式版不会出现。</div>
        <div class="row gap8 mt8"><button class="btn btn-sm btn-outline" onclick="XA.act.apptVerify('${a.id}')">模拟到店扫码核销</button></div>
      </div>` : ''}`;
    },
    footer(q) {
      const a = XA.state.appts.find((x) => x.id === q.id);
      if (!a) return '';
      if (a.status === 'booked') return `<button class="btn btn-outline grow" onclick="XA.act.apptCancel('${a.id}')">取消预约</button><button class="btn btn-primary grow" onclick="XA.act.apptResched('${a.id}')">改期</button>`;
      return `<button class="btn btn-primary btn-block" data-go="booking?store=${a.storeId}&service=${a.serviceId}">再约一次</button>`;
    },
  });

  /* ================= 我的预约（含候补） ================= */
  XA.act.waitOffer = (id) => { if (!storeAction('waitOffer', {id})) return; XA.toast('模拟：有人取消，名额已释放'); XA.refresh(); };
  XA.act.waitCancel = (id) => XA.modal({ title: '取消候补？', confirmText: '取消候补', cancelText: '再等等', danger: true, onConfirm: () => { if (!storeAction('waitCancel', {id})) return; XA.refresh(); } });
  XA.page('appts', {
    title: '我的预约',
    render(q) {
      const tab = q.tab || 'booked';
      const tabs = [['booked', '待到店'], ['done', '已完成'], ['cancelled', '已取消']];
      const list = XA.state.appts.filter((a) => (tab === 'cancelled' ? a.status === 'cancelled' || a.status === 'noshow' : a.status === tab));
      const waits = tab === 'booked' ? XA.state.waitlist : [];
      return `<div class="tabs">${tabs.map((t) => `<button class="${t[0] === tab ? 'on' : ''}" onclick="XA.go('appts?tab=${t[0]}',true)">${t[1]}</button>`).join('')}</div>
      ${waits.map((w) => {
        const s = D.storeOf(w.storeId), sv = D.service(w.serviceId), off = w.status === 'offered';
        return `<div class="sec card order">
          <div class="row between"><span class="bold">${s.name}</span><span class="st ${off ? 'st-toship' : 'st-wait'}">${off ? '有名额了' : `候补中 · 第 ${w.rank} 位`}</span></div>
          <div class="muted mt4">${sv.name}　${XA.d.nice(w.date)} ${w.time}</div>
          ${off ? `<div class="banner-ok mt8">${icon('bell')}<span>当前时段可尝试预约，名额以提交结果为准。</span></div>` : ''}
          <div class="order-btns">${off ? '' : `<button class="btn btn-sm btn-ghost" onclick="XA.act.waitOffer('${w.id}')">演示：模拟名额释放</button>`}<button class="btn btn-sm btn-outline" onclick="XA.act.waitCancel('${w.id}')">取消候补</button>${off ? `<button class="btn btn-sm btn-primary" data-go="booking?wait=${w.id}">立即确认预约</button>` : ''}</div>
        </div>`;
      }).join('')}
      ${list.map((a) => {
        const s = D.storeOf(a.storeId), sv = D.service(a.serviceId);
        return `<div class="sec card order" data-go="appt?id=${a.id}">
          <div class="row between"><span class="bold">${s.name}</span><span class="st ast-${a.status}">${AST[a.status][0]}</span></div>
          <div class="appt-time">${XA.d.nice(a.date)} ${a.time}</div>
          <div class="muted">${sv.name} · ${esc(a.staffName || D.staffOf(a.staffId).name)}</div>
          <div class="order-btns">${a.status === 'booked' ? `<span class="btn btn-sm btn-primary">查看核销码</span>` : `<span class="btn btn-sm btn-outline">查看详情</span>`}</div>
        </div>`;
      }).join('')}
      ${!list.length && !waits.length ? ui.empty(tab === 'booked' ? '您还没有待到店的预约' : '您还没有相关记录', '找附近的门店', 'store') : ''}`;
    },
  });

  /* ================= 门店活动 ================= */
  const actDate = (a) => a.date ? XA.d.fromKey(a.date) : XA.d.add(a.day);
  const actCard = (a) => {
    const d = actDate(a), s = D.storeOf(a.store), joined = XA.state.signups.includes(a.id);
    return `<div class="card act-card" data-go="activity?id=${a.id}">
      <div class="act-date"><b>${d.getDate()}</b><span>${d.getMonth() + 1}月 ${XA.d.wk(d)}</span></div>
      <div class="grow"><div class="bold">${a.title} ${a.memberOnly ? `<span class="tag tag-gold">会员专享</span>` : ''}</div><div class="muted small">${a.time} · ${short(s)}</div><div class="faint small">${joined ? '' : `剩余 ${a.left} 席`}</div></div>
      ${joined ? `<span class="tag tag-green">已报名</span>` : `<span class="btn btn-tonal btn-sm">报名</span>`}
    </div>`;
  };
  XA.page('activities', {
    title: '门店活动',
    render() {
      return `<div class="sec"><h2 class="h2">近期活动</h2><div class="muted small mt4">节气养生会、手工课、会员日，欢迎您带家人朋友一起来</div></div>
      <div class="sec">${D.activities.map(actCard).join('')}</div><div class="end">更多活动筹备中</div>`;
    },
  });
  XA.act.signup = (id) => XA.needLogin(() => {
    const a = D.activity(id);
    if (a.memberOnly && XA.level().lv < 2 && !XA.isPlus()) return XA.modal({ title: '会员专享活动', content: '白银及以上或 Plus 可报名。多消费可升级，也可直接开通 Plus。', confirmText: '看看晓艾会', onConfirm: () => XA.go('xahui') });
    XA.subscribe(['活动开始提醒'], () => { if (!storeAction('signup', {id, eligible: XA.level().lv >= 2 || XA.isPlus()})) return; XA.toast('报名成功', true); XA.refresh(); });
  });
  XA.act.signupCancel = (id) => XA.modal({ title: '取消报名？', content: '名额将释放给其他会员。', confirmText: '取消报名', cancelText: '保留', danger: true, onConfirm: () => { if (!storeAction('signupCancel', {id, eligible: XA.level().lv >= 2 || XA.isPlus()})) return; XA.refresh(); } });
  XA.page('activity', {
    title: '活动详情',
    render(q) {
      const a = D.activity(q.id) || D.activities[0], d = actDate(a), s = D.storeOf(a.store), joined = XA.state.signups.includes(a.id);
      return `${ui.cover(a, 'hero-art')}
      <div class="sec card"><h1 class="h2">${a.title}</h1>
        <div class="row gap6 mt8">${a.memberOnly ? `<span class="tag tag-gold">会员专享</span>` : `<span class="tag tag-green">所有人可报名</span>`}<span class="tag tag-gray">免费</span></div>
        <p class="muted mt12">${a.intro}</p></div>
      <div class="sec card">
        <div class="kv"><b>时间</b><span>${XA.d.md(d)} ${XA.d.wk(d)}　${a.time}</span></div>
        <div class="kv"><b>地点</b><span>${s.name}<br><span class="muted small">${s.address}</span></span></div>
        <div class="kv"><b>名额</b><span>共 ${a.quota} 席，剩余 ${a.left} 席</span></div>
      </div>
      ${joined ? `<div class="sec banner-ok">${icon('check')}<span>您已报名。活动当天到店出示<b>会员码</b>签到即可。</span></div>` : ''}`;
    },
    footer(q) {
      const a = D.activity(q.id) || D.activities[0];
      return XA.state.signups.includes(a.id) ? `<button class="btn btn-outline" onclick="XA.act.signupCancel('${a.id}')">取消报名</button><button class="btn btn-primary grow" data-go="member-code">查看会员码</button>` : `<button class="btn btn-primary btn-block" onclick="XA.act.signup('${a.id}')" ${a.left <= 0 ? 'disabled' : ''}>${a.left <= 0 ? '名额已满' : '立即报名'}</button>`;
    },
  });

  /* ================= 晓艾家会籍（P1；定价与权益为示例，待确认 B2） ================= */
  XA.act.planPick = (id) => { XA.tmp.plan = id; XA.refresh(); };
  XA.act.planBuy = () => XA.needLogin(() => {
    const p = D.plans.find((x) => x.id === (XA.tmp.plan || 'm2'));
    XA.pay({ title: '晓艾家会籍 · ' + p.name, amount: p.price, onSuccess: () => {
      XA.state.membership = { plan: p.id, name: p.name, expire: XA.d.key(XA.d.add(parseInt(p.period, 10))) };
      XA.state.orders.unshift({ id: XA.uid('XA'), kind: 'membership', title: '晓艾家会籍 · ' + p.name + '（' + p.period + '）', art: ['room', 'sand'], amount: p.price, points: p.price, status: 'done', at: new Date().toISOString() });
      XA.addPoints(p.price, '会籍购买实付积分', p.price);
      XA.toast('会籍已生效', true); XA.refresh();
    } });
  });
  XA.page('membership', {
    title: '晓艾家会籍',
    render() {
      const m = XA.state.membership, cur = XA.tmp.plan || 'm2';
      return `<div class="xj-hd">${XA.art('room', 'night', 'xj-art')}<div class="xj-in"><h1>晓艾家</h1><div>${D.xajiaIntro}</div></div></div>
      ${m ? `<div class="sec banner-ok">${icon('crown')}<span>您是晓艾家<b>${m.name}</b>会员，有效期至 ${m.expire}。全部门店通用。</span></div>` : ''}
      ${m ? '' : `<div class="sec tipbox" data-go="perks">${icon('crown')}<span>若您是 Plus 或钻石会员，可免费匹配领取「晓艾家体验会籍」</span>${icon('right', 'ic-s')}</div>`}
      ${ui.sec(m ? '续费或升级' : '选择会籍')}
      <div class="sec">
        ${D.plans.map((p) => `<button class="card plan ${cur === p.id ? 'on' : ''}" onclick="XA.act.planPick('${p.id}')">
          <div class="row between"><div><span class="plan-name">${p.name}</span> <span class="faint small">${p.period}</span> ${p.hot ? `<span class="tag tag-orange">多数人选择</span>` : ''}</div>${ui.price(p.price, 'lg')}</div>
          <ul class="ppoints">${p.perks.map((t) => `<li>${icon('check', 'ic-s')}<span>${t}</span></li>`).join('')}</ul>
        </button>`).join('')}
      </div>
      <div class="sec tipbox">${icon('info')}<span>会籍是晓艾会的加购权益，全国晓艾家门店通用；您的晓艾会等级与积分照常累计。</span></div>`;
    },
    footer() {
      const p = D.plans.find((x) => x.id === (XA.tmp.plan || 'm2'));
      return `<div class="grow">${p.name} ${ui.price(p.price, 'lg')}<div class="small faint ell">${XA.state.membership ? '续费后立即生效' : '开通后立即生效'}</div></div><button class="btn btn-primary" style="min-width:8.5rem" onclick="XA.act.planBuy()">${XA.state.membership ? '立即续费' : '立即开通'}</button>`;
    },
  });
  XA.act.planBuy = () => XA.toast('会员暂不支持购买');
  XA.page('membership', { title: '积分会员', render: () => `<div class="sec card">会员暂不支持购买。<button class="btn btn-tonal btn-block mt12" data-go="xahui">查看积分会员</button></div>` });
})();
