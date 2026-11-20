/* pages-home.js —— 首页聚合流 / 全局搜索 / 图文详情 / 专栏课程 */
(function () {
  const D = XA.data, icon = XA.icon, esc = XA.esc;
  const ui = (XA.ui = {});

  // Quill stores inline styles on text and block styles on terminating newlines.
  ui.richBody = (record, key, firstBlockSuffix = "") => {
    const ops = record[key + "Delta"]?.ops;
    if (!Array.isArray(ops)) return (record[key] || []).map((t,i) => `<p>${esc(t)}</p>${i === 0 ? firstBlockSuffix : ""}`).join("");
    const blocks = [];
    let line = "", list = "";
    function closeList() {
      if (list) blocks.push(`</${list}>`);
      list = "";
    }
    for (const op of ops) {
      if (op?.insert?.detailPicture?.kind === "image") {
        closeList();
        if (line) blocks.push(`<p>${line}</p>`);
        line = "";
        blocks.push(`<figure class="xa-detail-picture">${XA.mediaPreview(op.insert.detailPicture)}</figure>`);
        continue;
      }
      if (typeof op?.insert !== "string") continue;
      const attrs = op.attributes || {};
      const parts = op.insert.split("\n");
      parts.forEach((part, index) => {
        let html = esc(part);
        if (html && attrs.bold) html = `<strong>${html}</strong>`;
        if (html && attrs.italic) html = `<em>${html}</em>`;
        if (html && attrs.underline) html = `<u>${html}</u>`;
        line += html;
        if (index === parts.length - 1) return;
        const next = attrs.list === "bullet" ? "ul" : attrs.list === "ordered" ? "ol" : "";
        if (next !== list) { closeList(); if (next) blocks.push(`<${next}>`); list = next; }
        const tag = next ? "li" : attrs.header === 2 ? "h2" : attrs.header === 3 ? "h3" : attrs.blockquote ? "blockquote" : "p";
        blocks.push(`<${tag}>${line || "<br>"}</${tag}>`);
        line = "";
      });
    }
    closeList();
    if (line) blocks.push(`<p>${line}</p>`);
    return blocks.join("") + firstBlockSuffix;
  };
  /* ---------- 通用小组件 ---------- */
  ui.art = (a, cls) => XA.art(a[0], a[1], cls);
  ui.cover = (record, cls, fallback = record.art) => record.coverMedia ? `<div class="art ${cls || ''}">${XA.mediaPreview(record.coverMedia)}</div>` : ui.art(fallback,cls);
  ui.price = (v, cls) => `<span class="price ${cls || ''}"><small>¥</small>${XA.money(v)}</span>`;
  ui.disclaimer = (text) => `<div class="disclaimer">${icon('info')}<span>${text || XA.DISCLAIMER}</span></div>`;
  ui.sec = (title, more, go) => `<div class="sec-title"><h3>${title}</h3>${more ? `<button class="more" data-go="${go}">${more}${icon('right', 'ic-s')}</button>` : ''}</div>`;
  ui.brandTag = () => `<span class="tag tag-orange">晓艾精选</span>`;
  ui.empty = (text, btn, go) => `<div class="empty">${XA.art('leaf', 'sage', 'empty-art')}<div class="empty-t">${text}</div>${btn ? `<button class="btn btn-primary mt16" data-go="${go}">${btn}</button>` : ''}</div>`;
  ui.avatar = (name, cls) => `<span class="avatar ${cls || ''}">${esc(String(name).slice(0, 1))}</span>`;

  /* 横向内容卡（首页聚合流、搜索结果通用） */
  ui.productCard = (p, source, fit) => {
    const b = D.brands[p.brand], mp = XA.memberPrice(p, XA.defaultOpts(p));
    return `<div class="fcard" data-go="product?id=${p.id}&source=${source || 'feed'}">
      ${ui.cover(p, 'fcard-img')}
      <div class="fcard-bd">
        <div class="fcard-title">${esc(p.title)}</div>
        <div class="fcard-tags"><span class="tag tag-outline">好物</span>${ui.brandTag(b)}<span class="faint small">${b.name}</span>${fit ? `<span class="tag tag-orange">适合您的体质</span>` : ''}</div>
        <div class="fcard-ft">${ui.price(mp)}${mp < p.price ? `<span class="tag tag-gold">${XA.priceTag()}</span>` : ''}<span class="grow"></span><span class="faint small">${p.soldOut ? '已售罄' : '已售 ' + XA.wan(p.sales)}</span></div>
      </div>
    </div>`;
  };
  /* 商品卡（货架样式）：双列网格、方图在上、红色价格、加购按钮 —— 与课程卡明显区分 */
  ui.productGrid = (p, source, fit) => {
    const b = D.brands[p.brand], mp = XA.memberPrice(p, XA.defaultOpts(p));
    return `<div class="pcard ${p.soldOut ? 'soldout' : ''}" data-go="product?id=${p.id}&source=${source || 'feed'}">
      <div class="pcard-img">${ui.cover(p)}${fit ? `<em class="pcard-fit">适合您的体质</em>` : ''}${p.soldOut ? `<em class="pcard-out">已售罄</em>` : ''}</div>
      <div class="pcard-bd">
        <div class="pcard-title">${esc(p.title)}</div>
        <div class="pcard-brand">${ui.brandTag(b)}<span class="faint small ell">${b.name}</span></div>
        <div class="pcard-ft">
          <div class="grow">${ui.price(mp)}<div class="faint small ell">${mp < p.price ? `<span class="c-gold">${XA.priceTag()}</span> · ` : ''}已售 ${XA.wan(p.sales)}</div></div>
          ${p.soldOut ? '' : `<button class="pcard-add" aria-label="加入购物车" onclick="event.stopPropagation();XA.act.quickAdd('${p.id}','${source || 'feed'}')">${icon('cart')}</button>`}
        </div>
      </div>
    </div>`;
  };
  /* 课程卡（学习样式）：通栏深色横幅封面 + 播放键 + 讲数、讲师信息、试看按钮 */
  ui.courseCard = (c, fit) => {
    const own = XA.state.courses.includes(c.id), trial = c.lessons.filter((l) => l.trial).length;
    return `<div class="kcard" data-go="course?id=${c.id}">
      <div class="kcard-cover">${ui.cover(c,'',[c.art[0],'night'])}
        <span class="kcard-label">${icon('book', 'ic-xs')}课程</span>
        <span class="kcard-play">${icon('play')}</span>
        <span class="kcard-count">共 ${c.lessons.length} 讲 · ${XA.wan(c.learners)} 人在学${own ? '' : ` · 共 ${trial} 讲免费`}</span>
      </div>
      <div class="kcard-bd">
        <div class="kcard-title">${esc(c.title)}</div>
        <div class="kcard-teacher">${ui.avatar(c.teacher, 'xs')}<span>${c.teacher} · ${c.teacherTitle}</span></div>
        <div class="kcard-ft">
          ${own ? `<span class="tag tag-green">已订阅</span>` : `<span class="kcard-price">¥${c.price}<small> / 全 ${c.lessons.length} 讲</small></span>`}
          <span class="grow"></span>
          <span class="btn btn-sm kcard-btn">${own ? '继续学习' : '免费试看'}</span>
        </div>
      </div>
    </div>`;
  };
  ui.articleCard = (a, fit) => `<div class="fcard" data-go="article?id=${a.id}">
      ${ui.cover(a, 'fcard-img')}
      <div class="fcard-bd">
        <div class="fcard-title">${esc(a.title)}</div>
        <div class="fcard-tags"><span class="tag tag-outline">文章</span><span class="faint small">${esc(a.author)}</span>${fit ? `<span class="tag tag-orange">适合您的体质</span>` : ''}</div>
        <div class="fcard-ft"><span class="faint small">${XA.wan(a.read)} 人读过 · 免费</span></div>
      </div>
    </div>`;
  ui.noteRow = (n) => `<div class="fcard" data-go="note?id=${n.id}">
      ${ui.cover(n, 'fcard-img')}
      <div class="fcard-bd">
        <div class="fcard-title">${esc(n.title)}</div>
        <div class="fcard-tags"><span class="tag tag-outline">笔记</span><span class="faint small">${esc(n.author)}</span></div>
        <div class="fcard-ft"><span class="faint small row gap4">${icon('heart', 'ic-s')} ${XA.wan(n.likes)}</span></div>
      </div>
    </div>`;

  /* ---------- 首页 ---------- */
  const FEED = [['p', 'p1'], ['p', 'p3'], ['c', 'c1'], ['n', 'n2'], ['a', 'a1'], ['p', 'p2'], ['p', 'p4'], ['c', 'c2'], ['n', 'n1'], ['n', 'n4'], ['p', 'p5'], ['p', 'p6'], ['a', 'a2'], ['n', 'n3']];
  const getItem = (k, id) => (k === 'p' ? D.product(id) : k === 'c' ? D.course(id) : k === 'a' ? D.article(id) : D.note(id));
  const feedHtml = () => {
    const tab = XA.tmp.homeTab || 'intro';
    const type = XA.state.constitution && XA.state.constitution.type;
    let list = FEED.map(([k, id]) => ({ k, it: getItem(k, id) }));
    list = list.filter(x=>x.it);
    for (const [k,rows] of [['p',D.products],['c',D.courses],['a',D.articles],['n',D.notes]]) {
      const existing = new Set(list.filter(x=>x.k===k).map(x=>x.it.id));
      list.unshift(...rows.filter(row=>!existing.has(row.id)).map(it=>({k,it})));
    }
    if (tab === 'all') list = list.filter((x) => x.k === 'n');
    else if (tab === 'c' || tab === 'p') list = list.filter((x) => x.k === tab);
    else list = [];
    list.forEach((x) => (x.fit = !!(type && x.it.fit && x.it.fit.includes(type))));
    if (type) list = list.filter((x) => x.fit).concat(list.filter((x) => !x.fit)); // 体质标签加权：匹配项前置
    list = list.slice(0, 6);
    /* 商品走双列货架（混排时两两成行），课程走通栏课程卡，文章/笔记走图文行 */
    let out = '', buf = [];
    const flush = () => { if (buf.length) { out += `<div class="pgrid">${buf.map((x) => ui.productGrid(x.it, 'feed', x.fit)).join('')}</div>`; buf = []; } };
    list.forEach((x) => {
      if (x.k === 'p') { buf.push(x); if (tab !== 'p' && buf.length === 2) flush(); return; }
      out += x.k === 'c' ? ui.courseCard(x.it, x.fit) : x.k === 'a' ? ui.articleCard(x.it, x.fit) : ui.noteRow(x.it);
    });
    flush();
    return out;
  };
  XA.act.homeTab = (t) => { XA.tmp.homeTab = t; XA.refresh(); };

  const constitutionCard = () => {
    const s = XA.state, c = s.constitution;
    if (c) {
      const t = D.types[c.type];
      return `<div class="card ccard done" data-go="profile">
        <div class="row between"><div><div class="small muted">我的体质</div><div class="ccard-type">${c.type}</div></div><span class="more">体质档案${icon('right', 'ic-s')}</span></div>
        <div class="muted small mt4">${t.desc}</div>
      </div>`;
    }
    const n = s.test.answers.length, going = s.test.started && n > 0;
    return `<div class="card ccard" data-go="test">
      <div class="grow">
        <div class="ccard-h">${going ? '体质测试还没做完' : '3 分钟，测一测我的体质'}</div>
        <div class="muted small mt4">${going ? `已答 ${n} / ${D.quiz.length} 题，接着答完吧` : '了解自己的状态，推荐更合适的养生方法'}</div>
        <div class="row gap8 mt12"><span class="btn btn-primary btn-sm">${going ? '继续测试' : '开始测试'}</span><span class="tag tag-orange">完成得 20 积分</span></div>
      </div>
    </div>`;
  };

  function homePlacements() {
    const today = XA.d.key(new Date());
    const live = (slot) => slot.enabled && (!slot.start || slot.start <= today) && (!slot.end || slot.end >= today);
    const { notice } = D.homeResources;
    return `<div class="sec">${constitutionCard()}</div>${live(notice) ? `<div class="sec"><button class="home-notice" data-go="${esc(notice.route)}">
      <strong>公告</strong><span>${esc(notice.title)}</span>${icon('right','ic-s')}</button></div>` : ''}`;
  }

  let geoRequest = 0;
  const refreshLocation = () => {
    const f=XA.tmp.sf;
    if (f && D.located.status !== 'granted') {
      if (['500米','1km','2km'].includes(f.area)) f.area='';
      if (f.sort==='distance') f.sort='smart';
    }
    if (['home','store'].includes(XA.current()?.name)) XA.refresh();
  };
  XA.act.locToggle = () => {
    const turnOn = XA.state.locOn === false;
    XA.modal({
      title: turnOn ? '开启定位' : '关闭定位',
      content: turnOn ? '开启后，将按您的位置推荐附近门店。' : '关闭后，首页不再使用当前位置。需要时可以再打开。',
      confirmText: turnOn ? '开启' : '关闭',
      onConfirm() {
        XA.state.locOn = turnOn;
        XA.save();
        if (!turnOn) {
          geoRequest++;
          XA.tmp.homeGeo = null;
          D.clearLocation('off');
          refreshLocation();
          return;
        }
        XA.act.askLocation();
      },
    });
  };
  XA.act.askLocation = () => {
    if (XA.state.locOn === false) return;
    geoRequest++;
    /* 真实定位：预览环境无法读取设备 GPS，使用用户实际所在城市（武汉）江汉路的真实经纬度，
       按真实 Haversine 距离算法计算到各门店的距离，因此武汉门店能按「离我最近」正确排序 */
    XA.tmp.homeGeo = { lat: D.WUHAN.lat, lon: D.WUHAN.lon };
    D.applyRealLocation();
    if (XA.tmp.sf && XA.tmp.sf.city !== D.located.city) XA.tmp.sf = null;
    refreshLocation();
  };
  /* 定位开关：关闭时清空；开启时用真实坐标定位。不依赖浏览器授权状态，保证预览中定位稳定生效 */
  const syncLoc = () => {
    if (XA.state.locOn === false) { geoRequest++; XA.tmp.homeGeo = null; D.clearLocation('off'); refreshLocation(); return; }
    XA.act.askLocation();
  };
  syncLoc();
  XA.act.browseCity = () => {
    const el=XA.sheet({title:'按城市找门店',html:`<div class="radios">${D.cities.map(city=>`<button class="radio" data-city="${city}">${city}${icon('right','ic-s')}</button>`).join('')}</div>`});
    el.querySelectorAll('[data-city]').forEach(b=>b.onclick=()=>{
      XA.act.sfSetCity(b.dataset.city); XA.go('store');
    });
  };
  const homeLogin = () => XA.state.loggedIn ? '' : `<button class="home-login" onclick="XA.login()">登录晓艾 ${icon('right','ic-xs')}</button>`;
  const CITY_POINTS = [['北京',39.9,116.41],['天津',39.13,117.2],['上海',31.23,121.47],['杭州',30.27,120.15],['宁波',29.87,121.55],['南京',32.06,118.8],['苏州',31.3,120.58],['无锡',31.49,120.31],['合肥',31.82,117.23],['武汉',30.59,114.3],['长沙',28.23,112.94],['郑州',34.75,113.62],['广州',23.13,113.26],['深圳',22.54,114.06],['成都',30.57,104.07],['重庆',29.56,106.55],['西安',34.34,108.94],['济南',36.65,117.12],['青岛',36.07,120.38],['福州',26.07,119.3],['厦门',24.48,118.09],['南昌',28.68,115.86],['昆明',25.04,102.71],['贵阳',26.65,106.63],['南宁',22.82,108.37],['海口',20.04,110.2],['沈阳',41.8,123.43],['大连',38.91,121.61],['哈尔滨',45.8,126.53],['长春',43.82,125.32],['石家庄',38.04,114.51],['太原',37.87,112.55],['兰州',36.06,103.83],['乌鲁木齐',43.83,87.62]];
  const geoKm = (a, b, c, d) => {
    const rad = Math.PI / 180, h = Math.sin((c - a) * rad / 2) ** 2 + Math.cos(a * rad) * Math.cos(c * rad) * Math.sin((d - b) * rad / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
  };
  const cityFromGeo = (geo) => {
    if (!geo) return '';
    let name = '', best = Infinity;
    CITY_POINTS.forEach(([city, lat, lon]) => { const km = geoKm(geo.lat, geo.lon, lat, lon); if (km < best) { best = km; name = city; } });
    return best <= 180 ? name : '';
  };
  const concretePlace = () => {
    const located = XA.state.locOn !== false && D.located.status === 'granted';
    if (located) {
      const city = cityFromGeo(XA.tmp.homeGeo) || D.located.city || '杭州';
      const near = D.stores.filter((s) => s.city === city && s.address).sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9))[0];
      if (near) return `${near.city}市${String(near.address).split(/\s+/)[0]}`;
    }
    return '杭州市西湖区文二西路';
  };
  const locationChip = () => {
    const off = XA.state.locOn === false;
    const text = off ? '未开启定位' : (D.located.status === 'loading' ? '定位中…' : concretePlace());
    return `<div class="home-loc-row"><button class="home-loc" onclick="${off ? 'XA.act.locToggle()' : 'XA.act.askLocation()'}" ${!off && D.located.status === 'loading' ? 'disabled' : ''}>${icon('pin', 'ic-s')}<span>${esc(text)}</span></button><button type="button" class="home-loc-toggle" onclick="XA.act.locToggle()" aria-pressed="${off ? 'false' : 'true'}">${off ? '开启' : '关闭'}</button></div>`;
  };
  XA.locationChip = locationChip;
  const activityBanner = () => {
    const campaign = D.homeResources.campaign;
    const guest = XA.state.loggedIn ? '' : `<div class="home-guest"><span>登录解锁专属养生档案，记录每一次调理</span><button type="button" onclick="XA.login(XA.act.afterHomeLogin, '登录解锁专属养生档案，记录每一次调理')">登录</button></div>`;
    const claimed = !!XA.state.welcomePoints;
    const season = currentSolar();
    const slides = [
      { tone: 'gift', title: claimed ? '新人积分已到账' : '新人注册送 100 积分', sub: claimed ? '可在积分页查看明细' : (XA.state.loggedIn ? '点击领取 100 积分' : '登录即可领取'), art: ['box', 'sand'], go: claimed ? 'points' : '', act: claimed ? '' : 'claimWelcome' },
      { tone: 'season', title: campaign.title || '立冬养藏', sub: '当季活动', art: campaign.art || ['season', 'mist'], media: campaign.bannerMedia, image: campaign.image, go: campaign.route || 'article?id=a1' },
      { tone: 'point', title: '按体质配穴', sub: '测完自动推荐艾灸组合', art: ['moxa', 'sage'], go: 'formula' },
      { tone: 'solar', title: season.name + '养生', sub: '看看这个节气可以做的小事', art: ['leaf', 'mist'], go: 'solar' },
    ];
    const slide = (item) => {
      const artwork = item.media ? XA.mediaPreview(item.media) : item.image ? `<img src="${esc(item.image)}" alt="">` : ui.art(item.art, 'campaign-art');
      const action = item.act ? `onclick="XA.act.${item.act}()"` : `data-go="${esc(item.go)}"`;
      return `<button class="home-slide home-slide-${item.tone}" ${action}>${artwork}<span><b>${esc(item.title)}</b><small>${esc(item.sub)}</small></span></button>`;
    };
    return `<div class="sec home-activity-slot">${guest}<div class="home-banners" id="homeBanners">${slides.map(slide).join('')}</div><div class="home-dots" id="homeDots">${slides.map((_, i) => `<button type="button" aria-label="第 ${i + 1} 张"></button>`).join('')}</div></div>`;
  };
  const claimWelcomePoints = () => {
    if (XA.state.welcomePoints) return false;
    XA.state.welcomePoints = true;
    XA.addPoints(100, '新人注册礼', 100);
    return true;
  };
  XA.act.afterHomeLogin = () => {
    const claimed = claimWelcomePoints();
    if (claimed) XA.toast('100 积分已到账', true);
    const refresh = () => XA.refresh();
    XA.loadCatalog().then(refresh).catch(refresh);
  };
  XA.act.claimWelcome = () => XA.needLogin(() => {
    if (!claimWelcomePoints()) return XA.toast('新人积分已领取');
    XA.toast('100 积分已到账', true);
    XA.refresh();
  }, '登录解锁专属养生档案，记录每一次调理');
  const SOLAR = [
    { name: '小寒', month: 1, day: 5, tip: '早睡晚起，饮食温热。可温和艾灸关元、足三里，每穴 10 分钟。' },
    { name: '大寒', month: 1, day: 20, tip: '注意防寒，护住腰膝。睡前温水泡脚至微微发热即可，不宜大汗。' },
    { name: '立春', month: 2, day: 4, tip: '起居可逐渐提早。饮食清淡，助生发；艾灸时间宜短，以温热舒适为度。' },
    { name: '雨水', month: 2, day: 18, tip: '留意湿气。少食生冷油腻，可灸足三里，帮助日常运化。' },
    { name: '惊蛰', month: 3, day: 5, tip: '早睡早起，适度走动。春寒未尽时下半身仍宜保暖。' },
    { name: '春分', month: 3, day: 20, tip: '昼夜渐平，饮食寒热适中。保持心情舒展，作息尽量规律。' },
    { name: '清明', month: 4, day: 5, tip: '适合轻量外出。风大时护住颈肩，回来后可温水泡脚。' },
    { name: '谷雨', month: 4, day: 20, tip: '湿气偏重。少甜腻，饮食清淡，可灸足三里、阴陵泉。' },
    { name: '立夏', month: 5, day: 5, tip: '白天可稍长，中午宜小憩。饮食清补，避免过食辛辣。' },
    { name: '小满', month: 5, day: 21, tip: '暑湿渐起。出汗后及时擦干、补充温水，少立刻吹冷风。' },
    { name: '芒种', month: 6, day: 5, tip: '午间休息养心。饮食宜淡，晚上温水泡脚即可，不必久灸。' },
    { name: '夏至', month: 6, day: 21, tip: '昼长夜短，保证午休。少贪冰饮，艾灸每次宜短。' },
    { name: '小暑', month: 7, day: 7, tip: '避开酷热时段活动。及时补水，出汗后换干衣，保护脾胃。' },
    { name: '大暑', month: 7, day: 23, tip: '以清补为主，不建议空腹或过饱时艾灸。室内注意通风。' },
    { name: '立秋', month: 8, day: 7, tip: '早睡早起，开始收敛。少贪凉，晚间可护住腹部。' },
    { name: '处暑', month: 8, day: 23, tip: '暑气未尽，早晚温差变大。适时添衣，泡脚水温宜温和。' },
    { name: '白露', month: 9, day: 7, tip: '夜凉明显，注意润燥。可短时间温灸足三里，以舒适为度。' },
    { name: '秋分', month: 9, day: 23, tip: '昼夜再趋平衡。饮食平补，早点休息，帮助身体收敛。' },
    { name: '寒露', month: 10, day: 8, tip: '足部宜保暖。可温灸涌泉、关元，每次 10 分钟左右。' },
    { name: '霜降', month: 10, day: 23, tip: '进补宜缓，先护胃。泡脚时可暖到膝部，避免大汗。' },
    { name: '立冬', month: 11, day: 7, tip: '养藏之始，早睡晚起。每周 2～3 次温灸关元、足三里。' },
    { name: '小雪', month: 11, day: 22, tip: '温补但不上火。黑豆、萝卜可作家常，注意护住腰膝。' },
    { name: '大雪', month: 12, day: 7, tip: '重点护腰与膝。外出添衣，艾灸宜温不宜烫。' },
    { name: '冬至', month: 12, day: 22, tip: '适合温和进补。早睡，可灸关元，时间仍以舒适为准。' },
  ];
  const solarAt = (year, term) => new Date(year, term.month - 1, term.day);
  const currentSolar = (now = new Date()) => {
    const y = now.getFullYear();
    const all = [];
    for (const year of [y - 1, y, y + 1]) SOLAR.forEach((term) => all.push({ ...term, year, time: solarAt(year, term).getTime() }));
    all.sort((a, b) => a.time - b.time);
    let current = all[0];
    for (const term of all) {
      if (term.time <= now.getTime()) current = term;
      else break;
    }
    return current;
  };
  const solarCard = (term, now) => {
    const current = currentSolar(now);
    const time = solarAt(term.year, term).getTime();
    const mark = term.name === current.name && term.year === current.year ? '<span class="tag tag-green">当前</span>' : time > now.getTime() ? '<span class="tag tag-outline">未到</span>' : '';
    return `<div class="card season solar-card"><div class="season-day"><b>${term.month}</b><span>${term.day}日</span></div><div class="grow"><div class="row gap6"><b>${term.name}</b>${mark}</div><div class="muted small mt4">养生点：${term.tip}</div></div></div>`;
  };
  const termsInMonth = (year, month) => SOLAR.filter((term) => term.month === month).map((term) => ({ ...term, year }));
  const solarMonths = (now = new Date()) => {
    const month = now.getMonth() + 1;
    const nextMonth = month === 12 ? 1 : month + 1;
    return [
      { year: now.getFullYear(), month, terms: termsInMonth(now.getFullYear(), month) },
      { year: month === 12 ? now.getFullYear() + 1 : now.getFullYear(), month: nextMonth, terms: termsInMonth(month === 12 ? now.getFullYear() + 1 : now.getFullYear(), nextMonth) },
    ];
  };
  const solarHome = () => {
    const now = new Date();
    return `${ui.sec('节气养生', '查看更多', 'solar')}<div class="solar-list">${solarMonths(now).map((group) => `<div class="solar-month">${group.month}月</div>${group.terms.map((term) => solarCard(term, now)).join('')}`).join('')}</div>`;
  };
  const introHome = () => `<div class="feed home-intro">
      <div class="card"><div class="bold">认识晓艾</div><div class="muted small mt4">晓艾是您的养生小助手：帮您自测体质，定制专属艾灸调理方案；顺应节气顺势养护，学习穴位与艾灸知识，在家安心艾灸；也可查找周边门店，预约专业调理服务。</div></div>
      <div class="card"><div class="bold">调养参考</div><div class="cells mt8">
        <div class="cell" data-go="moxa-origin"><span class="cell-ic">${icon('leaf')}</span><div class="cell-bd"><div class="bold">艾材溯源品鉴</div><div class="muted small">挑选艾材时，先了解成色与年份的分辨要点。</div></div>${icon('right','faint')}</div>
        <div class="cell" data-go="moxa-guide"><span class="cell-ic">${icon('package')}</span><div class="cell-bd"><div class="bold">艾材选用指南</div><div class="muted small">不同形态适合不同场景，按使用习惯选择更顺手。</div></div>${icon('right','faint')}</div>
        <div class="cell" data-go="store"><span class="cell-ic">${icon('store')}</span><div class="cell-bd"><div class="bold">线下专业调理</div><div class="muted small">可前往附近门店，体验专业艾灸。</div></div>${icon('right','faint')}</div>
        <div class="cell" data-go="moxa-ban"><span class="cell-ic">${icon('shield')}</span><div class="cell-bd"><div class="bold">艾灸禁忌</div><div class="muted small">孕期、身体不适或皮肤破损时，先看这些注意。</div></div>${icon('right','faint')}</div>
      </div></div>
    </div>`;
  XA.page('moxa-ban', { title: '艾灸禁忌', render() { return banHome(); } });
  const banHome = () => `<div class="feed home-intro">
      <div class="card"><div class="bold">艾灸禁忌</div><div class="muted small mt4">下面这些情况，请您先不要自行艾灸。感到不舒服时，请停止并及时就医。</div></div>
      <div class="card"><div class="cells">
        <div class="cell"><span class="cell-ic">${icon('shield')}</span><div class="cell-bd"><div class="bold">孕期与经期</div><div class="muted small">孕期不宜自行艾灸。经期量多时，请暂停小腹和腰骶。</div></div></div>
        <div class="cell"><span class="cell-ic">${icon('bell')}</span><div class="cell-bd"><div class="bold">当下状态不适合</div><div class="muted small">过饥、过饱、醉酒、大汗、大怒、极度疲劳时请先休息，不要施灸。</div></div></div>
        <div class="cell"><span class="cell-ic">${icon('info')}</span><div class="cell-bd"><div class="bold">皮肤和局部</div><div class="muted small">破损、感染、瘢痕，以及原因不明的肿块处，请不要艾灸。</div></div></div>
        <div class="cell"><span class="cell-ic">${icon('heart')}</span><div class="cell-bd"><div class="bold">身体状况</div><div class="muted small">高热、有出血倾向，或血压、血糖明显不稳时，请先处理病情，不自行艾灸。</div></div></div>
        <div class="cell"><span class="cell-ic">${icon('flame')}</span><div class="cell-bd"><div class="bold">感觉不灵敏的部位</div><div class="muted small">皮肤感觉减退时更容易烫伤。温热即可，出现灼痛请马上拿开。</div></div></div>
      </div></div>
      <div class="card"><div class="bold">灸后注意</div><div class="muted small mt4">两小时内请不要洗澡、不吹冷风。确认艾条完全熄灭后再离开。</div></div>
      <div class="sec">${ui.disclaimer('以上供日常保健参考，不是诊疗意见。')}</div>
    </div>`;
  const nearestEntry = () => {
    const status=D.located.status;
    if(status!=='granted'){
      const copy={prompt:'开启定位，查看您身边的养生门店',off:'您已关闭定位，可手动开启后再看附近门店',denied:'位置权限已关闭，您可在浏览器设置中开启',loading:'正在获取您的当前位置…',unavailable:'暂时无法定位，您可重试或按城市找店',outside:'您当前位置附近暂无已收录门店'};
      const openAct = status === 'off' ? 'XA.act.locToggle()' : 'XA.act.askLocation()';
      return `<div class="sec nearest-entry geo-entry"><span class="nearest-pin">${icon('pin')}</span><div class="grow"><b>附近门店</b><small>${copy[status]||copy.prompt}</small><div class="row gap12">
        ${status!=='outside'?`<button class="link" onclick="${openAct}" ${status==='loading'?'disabled':''}>${status==='unavailable'?'重试定位':'开启定位'}</button>`:''}
        <button class="link" onclick="XA.act.browseCity()">按城市找店</button></div></div></div>`;
    }
    const count = D.stores.filter((s) => s.city === D.located.city && D.withinRadius(s, D.nearbyRadius)).length;
    return `<div class="sec"><button class="nearest-entry" onclick="XA.act.nearestStores()">
      <span class="nearest-pin">${icon('pin')}</span><span class="grow"><small>附近门店 · ${esc(D.located.spot)}</small><b>${count ? `方圆 ${D.nearbyRadius} 公里有 ${count} 家养生门店` : '附近暂无收录门店'}</b></span>
      <span class="small">${count ? '去看看' : '查看全城'}</span>${icon('right','ic-s')}</button></div>`;
  };

  const careHome = () => {
    const goods = D.products.filter((p) => !p.soldOut).slice(0, 3);
    const entries = [
      ['store', 'store', '找门店', '预约到店艾灸', 'a'],
      ['timer', 'timer', '艾灸计时', '在家按穴位温灸', 'd'],
      ['acupoints', 'body', '穴位图谱', '帮您找准位置', 'b'],
      [XA.state.constitution ? 'profile' : 'test', 'quiz', XA.state.constitution ? '体质档案' : '体质测试', XA.state.constitution ? XA.state.constitution.type : '约 3 分钟了解自己', 'c'],
    ];
    return `
      <div class="home-hd care-hd">
        <div class="home-brand"><span class="logo-dot">艾</span><span class="wordmark">晓艾</span>${homeLogin()}</div>
        <div class="care-banner">${icon('users', 'ic-s')}<span>长辈模式 · 只保留常用功能</span><button class="link" onclick="XA.setCare(false)">退出</button></div>
      </div>
      ${nearestEntry()}
      <div class="care-entries">
        ${entries.map((t) => `<button class="care-entry" data-go="${t[0]}"><span class="tool-ic tool-${t[4]}">${icon(t[1])}</span><div class="grow"><b>${t[2]}</b><span>${t[3]}</span></div>${icon('right', 'faint')}</button>`).join('')}
      </div>
      ${homePlacements()}
      ${ui.sec('常用好物')}
      <div class="feed care-goods">${goods.map((p) => ui.productCard(p, 'feed')).join('')}</div>
      <div class="sec"><button class="btn btn-primary btn-block" onclick="XA.wecom('联系养生顾问')">${icon('headset')}联系养生顾问</button></div>
      <div class="end">需要更多功能时，您可在设置里关闭长辈模式</div>`;
  };

  XA.page('home', {
    nav: 'none',
    render() {
      if (XA.isCare()) return careHome();
      const tabs = ['intro', 'all', 'p', 'solar', 'c'];
      const tab = tabs.includes(XA.tmp.homeTab) ? XA.tmp.homeTab : 'intro';
      const tools = [['test', 'quiz', '体质测试', 'a'], ['acupoints', 'body', '穴位图谱', 'b'], ['symptoms', 'target', '对症找穴', 'c'], ['timer', 'timer', '艾灸计时', 'd']];
      const plays = [['formula', 'leaf', '配穴方案', 'a'], ['journal', 'calendar', '养生日志', 'b'], ['pointfav', 'star', '穴位收藏', 'c'], ['ask', 'info', '养生问答', 'd']];
      const chips = [['intro', '介绍'], ['all', '笔记'], ['p', '好物'], ['solar', '节气'], ['c', '课程']];
      const feed = tab === 'intro' ? introHome() : tab === 'solar' ? solarHome() : `<div class="feed">${feedHtml()}</div><div class="end">已经到底了</div>`;
      return `
      <div class="home-hd">
        <div class="home-brand"><span class="logo-dot">艾</span><span class="wordmark">晓艾</span></div>
        ${locationChip()}
        <button class="searchbar" data-go="search">${icon('search')}<span>搜穴位、商品、课程</span></button>
      </div>
      ${activityBanner()}
      <div class="tools-board">
        <div class="tools">${tools.map((t) => `<button class="tool" data-go="${t[0]}"><span class="tool-ic tool-${t[3]}">${icon(t[1])}</span><span>${t[2]}</span></button>`).join('')}</div>
        <div class="tools">${plays.map((t) => `<button class="tool" data-go="${t[0]}"><span class="tool-ic tool-${t[3]}">${icon(t[1])}</span><span>${t[2]}</span></button>`).join('')}</div>
      </div>
      ${homePlacements()}
      ${ui.sec(XA.state.constitution ? '调养参考' : '为您推荐')}
      <div class="chips pad ref-tags">${chips.map((c) => `<button class="chip ${tab === c[0] ? 'on' : ''}" onclick="XA.act.homeTab('${c[0]}')">${c[1]}</button>`).join('')}</div>
      ${tab === 'p' ? `<div class="sec"><button class="btn btn-tonal btn-block" data-go="catalog">按分类找商品 ${icon('right','ic-s')}</button></div>` : ''}
      ${feed}`;
    },
    mounted() {
      if (XA.isCare()) return;
      const onTag = XA.$('.ref-tags .chip.on');
      if (onTag && onTag.scrollIntoView) onTag.scrollIntoView({ inline: 'nearest', block: 'nearest' });
      const tagRow = XA.$('.ref-tags');
      if (tagRow && !tagRow.dataset.drag) {
        tagRow.dataset.drag = '1';
        let active = false, moved = false, x = 0, left = 0, pointer = 0;
        tagRow.addEventListener('pointerdown', (e) => {
          if (e.pointerType !== 'mouse' || e.button !== 0) return;
          active = true;
          moved = false;
          x = e.clientX;
          left = tagRow.scrollLeft;
          pointer = e.pointerId;
        });
        tagRow.addEventListener('pointermove', (e) => {
          if (!active || e.pointerId !== pointer) return;
          const dx = e.clientX - x;
          if (Math.abs(dx) < 4) return;
          if (!moved) {
            moved = true;
            tagRow.classList.add('is-drag');
            try { tagRow.setPointerCapture(pointer); } catch (err) { /* 旧浏览器不支持时仍可滚动 */ }
          }
          tagRow.scrollLeft = left - dx;
          e.preventDefault();
        });
        const endDrag = (e) => {
          if (!active || (e && e.pointerId !== pointer)) return;
          active = false;
          tagRow.classList.remove('is-drag');
        };
        tagRow.addEventListener('pointerup', endDrag);
        tagRow.addEventListener('pointercancel', endDrag);
        tagRow.addEventListener('click', (e) => {
          if (!moved) return;
          e.preventDefault();
          e.stopPropagation();
          moved = false;
        }, true);
      }
      const scroller = XA.$('#homeBanners');
      if (!scroller) return;
      const slides = [...scroller.querySelectorAll('.home-slide')];
      const dots = [...XA.$$('#homeDots button')];
      if (slides.length < 2) return;
      let index = Math.min(XA.tmp.homeBanner || 0, slides.length - 1);
      let timer = 0;
      let drag = false;
      let x0 = 0;
      let touching = false;
      let followUntil = 0;
      const width = () => slides[0].offsetWidth || scroller.clientWidth || 1;
      const paint = () => dots.forEach((dot, i) => dot.classList.toggle('on', i === index));
      const go = (i, smooth) => {
        const w = width();
        if (w < 20) return;
        index = (i + slides.length) % slides.length;
        XA.tmp.homeBanner = index;
        scroller.scrollTo({ left: index * w, behavior: smooth ? 'smooth' : 'auto' });
        paint();
      };
      const start = () => {
        clearInterval(timer);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        timer = setInterval(() => go(index + 1, true), 4000);
      };
      const boot = () => {
        if (width() < 20) { requestAnimationFrame(boot); return; }
        go(index, false);
        start();
      };
      boot();
      let lastW = width();
      if (window.ResizeObserver) new ResizeObserver(() => {
        const w = width();
        if (touching || Math.abs(w - lastW) < 1) return;
        lastW = w;
        go(index, false);
      }).observe(scroller);
      const follow = () => {
        if (!touching && Date.now() > followUntil) return;
        const i = Math.round(scroller.scrollLeft / width());
        if (i !== index && i >= 0 && i < slides.length) { index = i; XA.tmp.homeBanner = i; paint(); }
      };
      scroller.addEventListener('pointerdown', (e) => { drag = false; touching = true; x0 = e.clientX; clearInterval(timer); });
      scroller.addEventListener('pointermove', (e) => { if (Math.abs(e.clientX - x0) > 8) drag = true; });
      scroller.addEventListener('pointerup', () => { touching = false; followUntil = Date.now() + 500; setTimeout(start, 500); });
      scroller.addEventListener('pointercancel', () => { touching = false; followUntil = Date.now() + 500; setTimeout(start, 500); });
      scroller.addEventListener('scroll', follow);
      scroller.addEventListener('click', (e) => { if (drag) { e.preventDefault(); e.stopPropagation(); drag = false; } }, true);
      dots.forEach((dot, i) => { dot.onclick = () => { go(i, true); start(); }; });
      XA.tmp.stopHomeBanner = () => clearInterval(timer);
    },
    unmount() { if (XA.tmp.stopHomeBanner) XA.tmp.stopHomeBanner(); },
  });

  XA.page('solar', {
    title: '二十四节气',
    render() {
      const now = new Date();
      const groups = [['春', [2, 3, 4]], ['夏', [5, 6, 7]], ['秋', [8, 9, 10]], ['冬', [11, 12, 1]]];
      const yearFor = (month) => (month === 1 && now.getMonth() !== 0 ? now.getFullYear() + 1 : now.getFullYear());
      return groups.map(([name, months]) => `${ui.sec(name)}<div class="solar-list">${months.flatMap((month) => termsInMonth(yearFor(month), month)).map((term) => solarCard(term, now)).join('')}</div>`).join('') + '<div class="end">养生点供日常参考，身体不适时请您咨询医生</div>';
    },
  });

  const journalAt = (y, m, d, h) => { const t = new Date(y, m - 1, d, h || 15, 0, 0, 0); return t.toISOString(); };
  const DEMO_JOURNAL = [
    { id: 26031901, at: journalAt(2026, 3, 19, 20), savedAt: journalAt(2026, 3, 19, 20), slot: '晚上', mins: '20 分钟', feel: ['畏寒怕冷', '容易疲乏'], sleep: ['睡得安稳'], after: ['局部温热'], points: ['zusanli', 'guanyuan'] },
    { id: 26031002, at: journalAt(2026, 3, 10, 15), savedAt: journalAt(2026, 3, 10, 15), slot: '下午', mins: '15 分钟', feel: ['肩颈酸紧'], sleep: ['睡眠浅'], after: ['紧张减轻'], points: ['dazhui'] },
    { id: 26020103, at: journalAt(2026, 2, 1, 10), savedAt: journalAt(2026, 2, 1, 10), slot: '上午', mins: '10 分钟', feel: ['状态平稳'], sleep: ['睡得安稳'], after: ['今日未灸'], points: [] },
    { id: 25122804, at: journalAt(2025, 12, 28, 20), savedAt: journalAt(2025, 12, 28, 20), slot: '晚上', mins: '30 分钟', feel: ['腰膝酸软', '身体困重'], sleep: ['入睡难'], after: ['微微出汗'], points: ['shenshu', 'yongquan'] },
    { id: 25111505, at: journalAt(2025, 11, 15, 15), savedAt: journalAt(2025, 11, 15, 15), slot: '下午', mins: '20 分钟', feel: ['畏寒怕冷'], sleep: ['容易醒'], after: ['局部温热'], points: ['guanyuan'] },
    { id: 25090806, at: journalAt(2025, 9, 8, 10), savedAt: journalAt(2025, 9, 8, 10), slot: '上午', mins: '15 分钟', feel: ['少气懒言'], sleep: ['睡得安稳'], after: ['热感扩散'], points: ['zusanli'] },
    { id: 25060107, at: journalAt(2025, 6, 1, 20), savedAt: journalAt(2025, 6, 1, 20), slot: '晚上', mins: '10 分钟', feel: ['情绪不畅'], sleep: ['醒后难眠'], after: ['今日未灸'], points: ['neiguan'] },
    { id: 24123008, at: journalAt(2024, 12, 30, 15), savedAt: journalAt(2024, 12, 30, 15), slot: '下午', mins: '25 分钟', feel: ['畏寒怕冷', '腰膝酸软'], sleep: ['睡得安稳'], after: ['局部温热'], points: ['mingmen', 'zusanli'] },
    { id: 24111009, at: journalAt(2024, 11, 10, 20), savedAt: journalAt(2024, 11, 10, 20), slot: '晚上', mins: '20 分钟', feel: ['容易疲乏'], sleep: ['睡眠浅'], after: ['酸胀得气'], points: ['guanyuan'] },
    { id: 24081510, at: journalAt(2024, 8, 15, 10), savedAt: journalAt(2024, 8, 15, 10), slot: '上午', mins: '15 分钟', feel: ['口干口苦'], sleep: ['早醒'], after: ['皮肤潮红'], points: ['sanyinjiao'] },
    { id: 24032011, at: journalAt(2024, 3, 20, 15), savedAt: journalAt(2024, 3, 20, 15), slot: '下午', mins: '10 分钟', feel: ['状态平稳'], sleep: ['睡得安稳'], after: ['局部温热'], points: ['zusanli'] },
  ];
  const ensureJournalDemo = () => {
    const cur = Array.isArray(XA.state.journal) ? XA.state.journal : [];
    const ids = new Set(cur.map((item) => String(item.id)));
    const missing = DEMO_JOURNAL.filter((item) => !ids.has(String(item.id)));
    if (!missing.length) { XA.state.journalDemo = true; return; }
    XA.state.journal = missing.concat(cur).sort((a, b) => new Date(b.at) - new Date(a.at));
    XA.state.journalDemo = true;
    XA.save();
  };
  const journalList = () => {
    ensureJournalDemo();
    return Array.isArray(XA.state.journal) ? XA.state.journal : (XA.state.journal = []);
  };
  const pointKey = (id) => 'pt_' + id;
  const REVIEW_DAYS = 30;
  const reviewList = () => Array.isArray(XA.state.journalReviews) ? XA.state.journalReviews : (XA.state.journalReviews = []);
  const tagList = (logs, key) => {
    const bag = {};
    logs.forEach((item) => {
      const value = item[key];
      const list = Array.isArray(value) ? value : (typeof value === 'string' && value.trim() ? [value.trim()] : []);
      list.forEach((tag) => { if (tag) bag[tag] = (bag[tag] || 0) + 1; });
    });
    const names = Object.entries(bag).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([tag, n]) => (n > 1 ? `${tag} ×${n}` : tag));
    return names.length ? names.join('、') : '还没记下';
  };
  const pointTextOf = (logs) => {
    const bag = {};
    logs.forEach((item) => (item.points || []).forEach((id) => { if (D.atlasPoints.some((p) => p.id === id)) bag[id] = (bag[id] || 0) + 1; }));
    const names = Object.entries(bag).sort((a, b) => b[1] - a[1]).map(([id, n]) => { const name = D.atlasPoints.find((p) => p.id === id).name; return n > 1 ? `${name} ×${n}` : name; });
    return names.length ? names.join('、') : '还没记下穴位';
  };
  const buildReview = (logs, start, end, prevType) => {
    const c = XA.state.constitution;
    const earlier = (XA.state.constitutionLog || [])[0];
    const when = c && c.at ? XA.d.full(c.at) : '';
    let change = '还没有体质测评。';
    if (c && D.types[c.type]) {
      if (prevType && prevType !== c.type) change = `相比上一份，体质倾向从${prevType}变为${c.type}（${when}）。`;
      else if (prevType) change = `体质倾向仍是${c.type}（${when}）。`;
      else if (earlier && earlier.type !== c.type) change = `最新测评是${c.type}（${when}），上次是${earlier.type}。`;
      else change = `最新测评是${c.type}（${when}）。`;
    }
    const type = c && D.types[c.type];
    return {
      id: end,
      at: new Date(end).toISOString(),
      from: new Date(start).toISOString(),
      to: new Date(end).toISOString(),
      type: c ? c.type : '',
      summary: logs.length ? `这 30 天记下 ${logs.length} 次。${change}` : `这 30 天没有新的随手记。${change}`,
      constitutionText: type ? `${change}${type.desc}` : change,
      feelText: tagList(logs.map((item) => ({ feel: item.feel || item.text || '' })), 'feel'),
      sleepText: tagList(logs, 'sleep'),
      afterText: tagList(logs, 'after'),
      pointText: pointTextOf(logs),
    };
  };
  const syncJournalReview = () => {
    const logs = journalList();
    const reviews = reviewList();
    if (!logs.length) return reviews;
    let anchor = XA.state.journalCycleAt ? new Date(XA.state.journalCycleAt).getTime() : 0;
    if (!anchor || Number.isNaN(anchor)) {
      anchor = new Date(logs[logs.length - 1].at).getTime();
      XA.state.journalCycleAt = new Date(anchor).toISOString();
      XA.save();
    }
    const oldest = logs.reduce((min, item) => {
      const t = new Date(item.at).getTime();
      return Number.isNaN(t) ? min : Math.min(min, t);
    }, anchor);
    if (!reviews.length && oldest < anchor) {
      anchor = oldest;
      XA.state.journalCycleAt = new Date(anchor).toISOString();
      XA.save();
    }
    const span = REVIEW_DAYS * 86400000;
    let made = 0;
    let prevType = reviews[0] && reviews[0].type;
    while (Date.now() - anchor >= span && made < 8) {
      const end = anchor + span;
      const slice = logs.filter((item) => {
        const t = new Date(item.at).getTime();
        return t >= anchor && t < end;
      });
      const report = buildReview(slice, anchor, end, prevType);
      reviews.unshift(report);
      prevType = report.type;
      anchor = end;
      made += 1;
    }
    if (made) {
      XA.state.journalCycleAt = new Date(anchor).toISOString();
      XA.save();
    }
    return reviews;
  };
  const JOURNAL_SLOTS = ['上午', '下午', '晚上'];
  const JOURNAL_FEEL = ['畏寒怕冷', '容易疲乏', '少气懒言', '肩颈酸紧', '腰膝酸软', '头晕头重', '胃脘胀满', '食欲不振', '口干口苦', '身体困重', '情绪不畅', '状态平稳'];
  const JOURNAL_SLEEP = ['入睡难', '睡眠浅', '容易醒', '醒后难眠', '早醒', '睡得安稳'];
  const JOURNAL_AFTER = ['局部温热', '热感扩散', '酸胀得气', '紧张减轻', '微微出汗', '皮肤潮红', '灼痛不适', '今日未灸'];
  const JOURNAL_MINS = [10, 15, 20, 30, 45, 60];
  const journalForm = () => {
    if (!XA.tmp.journalForm) {
      const hour = new Date().getHours();
      const slot = hour < 12 ? '上午' : hour < 18 ? '下午' : '晚上';
      XA.tmp.journalForm = { day: '0', slot, mins: '', feel: {}, sleep: {}, after: {}, points: {} };
    }
    const form = XA.tmp.journalForm;
    if (!JOURNAL_SLOTS.includes(form.slot)) form.slot = '下午';
    if (form.day !== '0' && form.day !== '-1') form.day = '0';
    const mins = Number(form.mins);
    if (form.mins && (!Number.isFinite(mins) || mins < 0 || mins > 120)) form.mins = '';
    return form;
  };
  const journalFolds = () => {
    if (!XA.tmp.journalFolds) XA.tmp.journalFolds = { mins: true, feel: true, sleep: false, after: false, points: false };
    return XA.tmp.journalFolds;
  };
  XA.act.journalFold = (key) => {
    const folds = journalFolds();
    folds[key] = !folds[key];
    XA.refresh();
  };
  const pickedTags = (bag) => Object.keys(bag || {}).filter((key) => bag[key]);
  XA.act.journalPick = (group, value, btn, single) => {
    const form = journalForm();
    if (single) {
      form[group] = form[group] === value ? '' : value;
      if (group === 'day' || group === 'slot') form[group] = value;
      if (group === 'day') { XA.refresh(); return; }
      if (btn && btn.parentElement) btn.parentElement.querySelectorAll('.chip').forEach((el) => el.classList.toggle('on', el === btn && !!form[group]));
      return;
    }
    const bag = form[group] || (form[group] = {});
    bag[value] = !bag[value];
    if (!bag[value]) delete bag[value];
    if (btn) btn.classList.toggle('on', !!bag[value]);
  };
  XA.act.journalMin = (n, keep) => {
    n = Math.max(0, Math.min(120, Math.round(Number(n) || 0)));
    const form = journalForm();
    if (!keep && form.mins === String(n)) n = 0;
    form.mins = n ? String(n) : '';
    const range = XA.$('#journalMins');
    if (range && String(range.value) !== String(n)) range.value = String(n);
    const label = XA.$('#journalMinLabel');
    if (label) label.textContent = n ? `${n} 分钟` : '';
    XA.$$('#journalMinChips .chip').forEach((el) => el.classList.toggle('on', el.dataset.min === form.mins));
  };
  const REVIEW_SPANS = [
    { id: '7', name: '近7天', days: 7 },
    { id: '30', name: '近30天', days: 30 },
    { id: 'all', name: '全部', days: 0 },
  ];
  XA.act.reviewSpan = (id) => { XA.tmp.reviewSpan = id; XA.refresh(); };
  XA.act.journalSave = () => XA.needLogin(() => {
    const form = journalForm();
    const feel = pickedTags(form.feel);
    const sleep = pickedTags(form.sleep);
    const after = pickedTags(form.after);
    const points = pickedTags(form.points).filter((id) => D.atlasPoints.some((p) => p.id === id));
    const mins = form.mins === '' ? '' : `${Number(form.mins)} 分钟`;
    if (!feel.length && !sleep.length && !after.length && !points.length && !mins) return XA.toast('先选体感、睡眠、灸后或穴位');
    const at = XA.d.add(Number(form.day) || 0);
    at.setHours({ 上午: 10, 下午: 15, 晚上: 20 }[form.slot] || 15, 0, 0, 0);
    journalList().unshift({ id: Date.now(), at: at.toISOString(), savedAt: new Date().toISOString(), slot: form.slot || '', mins, feel, sleep, after, points });
    form.feel = {}; form.sleep = {}; form.after = {}; form.points = {}; form.mins = '';
    XA.save();
    XA.toast('已记入养生日志', true);
    XA.refresh();
  }, '登录后才能保存养生日志');
  XA.act.journalDel = (id) => XA.needLogin(() => XA.modal({
    title: '删除这条记录？',
    content: '删除后，这条记录不会再出现在列表和复盘里。',
    confirmText: '删除',
    danger: true,
    onConfirm: () => {
      XA.state.journal = journalList().filter((item) => String(item.id) !== String(id));
      XA.save();
      XA.toast('已删除');
      XA.refresh();
    },
  }), '登录后才能删除养生日志');
  XA.act.pointFav = (id) => XA.needLogin(() => {
    const key = pointKey(id);
    const on = !XA.state.favs[key];
    if (on) XA.state.favs[key] = true;
    else delete XA.state.favs[key];
    XA.save();
    XA.toast(on ? '已收藏' : '已取消收藏');
    XA.refresh();
  }, '登录后才能收藏穴位');
  XA.page('formula', {
    title: '配穴方案',
    render() {
      const c = XA.state.constitution;
      if (!c || !D.types[c.type]) return `${ui.empty('完成体质测试后，会按结果为您推荐艾灸穴位组合', '去测试', 'test')}<div class="sec">${ui.disclaimer('未测试前不生成个人方案。')}</div>`;
      const type = D.types[c.type];
      const pts = type.pts.map((id) => D.point(id)).filter(Boolean);
      const videoIds = {
        平和质: ['v1', 'v5', 'v3'],
        气虚质: ['v1', 'v4', 'v5'],
        阳虚质: ['v2', 'v1', 'v4'],
        阴虚质: ['v1', 'v3', 'v5'],
        痰湿质: ['v3', 'v2', 'v1'],
        湿热质: ['v3', 'v4', 'v1'],
        血瘀质: ['v3', 'v1', 'v5'],
        气郁质: ['v3', 'v5', 'v1'],
        特禀质: ['v1', 'v2', 'v5'],
      }[c.type] || D.videos.map((v) => v.id);
      const videos = videoIds.map((id) => D.videoOf(id)).filter(Boolean);
      return `<div class="sec card">
        <div class="small muted">根据体质测试</div>
        <div class="ccard-type">${esc(c.type)}</div>
        <div class="muted small mt4">${esc(type.desc)}</div>
      </div>
      ${ui.sec('推荐穴位组合')}
      <div class="cells sec">${pts.map((p) => `<div class="cell" data-go="acupoint?id=${p.id}"><span class="cell-ic">${icon('target')}</span><div class="cell-bd"><div class="bold">${esc(p.name)}</div><div class="muted small">${esc(p.locate)}</div><div class="faint small mt4">建议温灸 ${p.min} 分钟 · ${esc(p.benefit)}</div></div>${icon('right','faint')}</div>`).join('')}</div>
      <div class="sec"><button class="btn btn-primary btn-block" data-go="timer?ids=${pts.map((p) => p.id).join(',')}&force=1">按这个组合开始艾灸</button></div>
      ${ui.sec('调养参考')}
      <div class="feed">${videos.map((v) => `<button type="button" class="fcard" onclick="XA.act.openVideo('${v.id}')">${ui.art(v.art, 'fcard-img')}<div class="fcard-bd"><div class="fcard-title">${esc(v.title)}</div><div class="fcard-tags"><span class="tag tag-outline">视频</span><span class="faint small">${esc(v.author)}</span></div><div class="fcard-ft"><span class="faint small">${XA.wan(v.likes)} 赞</span></div></div></button>`).join('')}</div>
      <div class="sec">${ui.disclaimer()}</div>`;
    },
  });
  const showTags = (value) => Array.isArray(value) ? value.filter(Boolean).join('、') : String(value || '').trim();
  const journalDateLine = (item) => {
    const d = new Date(item.at);
    if (Number.isNaN(d.getTime())) return '';
    const day = dayLabel(d);
    if (item.slot) return `${day} · ${item.slot}`;
    return `${day} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const journalTabs = (name) => `<div class="tabs"><button type="button" class="${name === 'journal' ? 'on' : ''}" onclick="XA.go('journal',true)">养生日志</button><button type="button" class="${name === 'review' ? 'on' : ''}" onclick="XA.go('review',true)">体质复盘</button></div>`;
  const journalChips = (group, items, single, grid) => {
    const form = journalForm();
    return `<div class="chips wrap ${grid || ''}">${items.map((item) => {
      const value = String(item.id != null ? item.id : item);
      const label = item.name || item;
      const on = single ? String(form[group] || '') === value : !!(form[group] && form[group][value]);
      return `<button type="button" class="chip ${on ? 'on' : ''}" onclick="XA.act.journalPick('${group}','${value}',this,${single ? 'true' : 'false'})">${esc(String(label))}</button>`;
    }).join('')}</div>`;
  };
  const journalDetailBits = (item) => {
    const bits = [];
    const feel = showTags(item.feel);
    const sleep = showTags(item.sleep);
    const after = showTags(item.after);
    if (feel) bits.push(`<div><b>体感</b> ${esc(feel)}</div>`);
    else if (item.text) bits.push(`<div>${esc(item.text)}</div>`);
    if (sleep) bits.push(`<div><b>睡眠</b> ${esc(sleep)}</div>`);
    if (after) bits.push(`<div><b>灸后</b> ${esc(after)}</div>`);
    return bits;
  };
  const journalItem = (item, opt = {}) => {
    const compact = !!opt.compact;
    const open = compact && String(XA.tmp.histOpenId) === String(item.id);
    const bits = [];
    if (item.mins) bits.push(`<div><b>时长</b> ${esc(item.mins)}</div>`);
    const names = (item.points || []).map((id) => D.atlasPoints.find((p) => p.id === id)).filter(Boolean).map((p) => p.name).join('、');
    if (names) bits.push(`<div><b>穴位</b> ${esc(names)}</div>`);
    if (!compact) bits.unshift(...journalDetailBits(item));
    else if (open) bits.push(...journalDetailBits(item));
    const when = journalDateLine(item);
    const more = compact
      ? `<button type="button" class="link journal-detail-toggle" onclick="XA.act.histToggle('${item.id}')">${open ? '收起详情' : '查看详情'}</button>`
      : '';
    return `<div class="cell journal-item"><div class="cell-bd">${when ? `<div class="faint small">${esc(when)}</div>` : ''}${bits.join('') || '<div class="muted small">未记时长与穴位</div>'}${more}</div><button type="button" class="icon-btn" aria-label="删除这条记录" onclick="XA.act.journalDel(${Number(item.id)})">${icon('trash')}</button></div>`;
  };
  XA.act.histToggle = (id) => {
    XA.tmp.histOpenId = String(XA.tmp.histOpenId) === String(id) ? '' : String(id);
    XA.refresh();
  };
  const pointNames = (ids) => (ids || []).map((id) => D.atlasPoints.find((p) => p.id === id)).filter(Boolean).map((p) => p.name);
  const minsNum = (item) => {
    const n = parseInt(String(item.mins || ''), 10);
    return Number.isFinite(n) ? n : 0;
  };
  const cycleSlice = (logs) => {
    let anchor = XA.state.journalCycleAt ? new Date(XA.state.journalCycleAt).getTime() : 0;
    if (!anchor || Number.isNaN(anchor)) {
      if (!logs.length) return null;
      anchor = Math.min(...logs.map((item) => new Date(item.at).getTime()));
    }
    const end = anchor + REVIEW_DAYS * 86400000;
    const slice = logs.filter((item) => {
      const t = new Date(item.at).getTime();
      return t >= anchor && t < end;
    });
    const day = Math.min(REVIEW_DAYS, Math.max(1, Math.floor((Date.now() - anchor) / 86400000) + 1));
    return { anchor, end, logs: slice, day };
  };
  const reviewFacts = (logs, typeName) => {
    const type = typeName && D.types[typeName];
    const moxa = logs.filter((item) => (item.points || []).length || (Array.isArray(item.after) && item.after.some((tag) => tag && tag !== '今日未灸' && tag !== '今日未施灸')));
    return {
      type,
      suggest: type ? pointNames(type.pts).join('、') : '',
      feel: tagList(logs.map((item) => ({ feel: item.feel || item.text || '' })), 'feel'),
      sleep: tagList(logs, 'sleep'),
      after: tagList(logs, 'after'),
      points: pointTextOf(logs),
      count: logs.length,
      moxa: moxa.length,
      minutes: logs.reduce((sum, item) => sum + minsNum(item), 0),
    };
  };
  const itemDate = (item) => {
    const d = new Date(item.savedAt || item.at);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const yearsOf = (logs) => {
    const years = new Set();
    logs.forEach((item) => { const d = itemDate(item); if (d) years.add(d.getFullYear()); });
    return [...years].sort((a, b) => b - a);
  };
  const scopeOf = () => {
    const id = String(XA.tmp.reviewSpan || '7');
    if (id === '30') return { id, days: 30, year: 0, name: '近30天' };
    if (id.startsWith('y')) {
      const year = Number(id.slice(1));
      return { id, days: 0, year, name: `${year}年` };
    }
    return { id: '7', days: 7, year: 0, name: '近7天' };
  };
  const scopeLogs = (logs, scope) => {
    if (scope.year) return logs.filter((item) => { const d = itemDate(item); return d && d.getFullYear() === scope.year; });
    const since = Date.now() - scope.days * 86400000;
    return logs.filter((item) => { const d = itemDate(item); return d && d.getTime() >= since; });
  };
  XA.act.journalScope = (id) => { XA.tmp.reviewSpan = id; XA.tmp.journalMonth = ''; XA.refresh(); };
  XA.act.journalMonth = (key) => { XA.tmp.journalMonth = XA.tmp.journalMonth === key ? 'off' : key; XA.refresh(); };
  const groupByDate = (items, keyOf) => {
    const groups = [];
    items.forEach((item) => {
      const d = itemDate(item);
      const key = d ? keyOf(d) : '';
      const last = groups[groups.length - 1];
      if (!last || last.key !== key) groups.push({ key, date: d, items: [item] });
      else last.items.push(item);
    });
    return groups;
  };
  const dayLabel = (d) => {
    if (!d || Number.isNaN(d.getTime())) return '更早';
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };
  const dayBlocks = (items) => groupByDate(items, (d) => XA.d.key(d)).map((group) => `<div class="journal-day">${esc(dayLabel(group.date))}</div><div class="cells">${group.items.map((item) => journalItem(item)).join('')}</div>`).join('');
  const rangeText = (items) => {
    const dates = items.map(itemDate).filter(Boolean);
    if (!dates.length) return '';
    const from = new Date(Math.min(...dates.map((d) => d.getTime())));
    const to = new Date(Math.max(...dates.map((d) => d.getTime())));
    const sameYear = from.getFullYear() === to.getFullYear() && from.getFullYear() === new Date().getFullYear();
    const fmt = (d) => (sameYear ? `${d.getMonth() + 1}.${d.getDate()}` : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`);
    return fmt(from) === fmt(to) ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
  };
  const summaryCard = (slice, scope) => {
    if (!slice.length) return `<div class="sec card journal-report"><div class="bold">这段复盘</div><p>${esc(scope.name)}您还没有记录。可以换上面的时间看看。</p></div>`;
    const c = XA.state.constitution;
    const facts = reviewFacts(slice, c && c.type);
    const type = facts.type;
    const past = Array.isArray(XA.state.constitutionLog) ? XA.state.constitutionLog : [];
    const origin = past.length ? past[past.length - 1].type : (c ? c.type : '');
    const advice = type ? `可继续看${pointNames(type.pts).slice(0, 2).join('、')}。${type.life}` : '测完体质后，这里会对照测评给出建议。';
    const lines = [
      ['初始体质', origin || '还没有测评'],
      ['当前体质', c ? c.type : '还没有测评'],
      ['这段体感', briefTags(facts.feel, 2) || '这段还没记下体感'],
      ['常灸穴位', briefTags(facts.points, 3) || '这段还没记下穴位'],
      ['调理建议', advice],
    ];
    return `<div class="sec card journal-report">
      <div class="small muted">这段复盘 · ${esc(scope.name)}</div>
      <div class="review-range">${esc(rangeText(slice))}</div>
      <div class="review-stats"><div><b>${facts.count}</b><span>记录</span></div><div><b>${facts.moxa}</b><span>施灸</span></div><div><b>${facts.minutes}</b><span>分钟</span></div></div>
      <div class="review-lines">${lines.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>
      <button class="btn btn-primary btn-block mt12" type="button" onclick="XA.act.testStart();XA.go('test')">去复测体质</button>
    </div>`;
  };
  const recordTree = (slice, scope) => {
    if (!slice.length) return '';
    if (scope.days === 7) return `<div class="sec journal-board">${dayBlocks(slice)}</div>`;
    const months = groupByDate(slice, (d) => `${d.getFullYear()}-${d.getMonth() + 1}`);
    const picked = XA.tmp.journalMonth;
    const openKey = picked === 'off' ? '' : (picked || (months[0] && months[0].key) || '');
    return months.map((month) => {
      const shown = month.key === openKey;
      const title = month.date ? `${month.date.getFullYear()}年${month.date.getMonth() + 1}月` : '更早';
      return `<div class="sec journal-month"><button type="button" class="month-fold" onclick="XA.act.journalMonth('${shown ? 'off' : month.key}')"><b>${esc(title)}</b><span>${month.items.length} 条${shown ? ' · 收起' : ''}</span></button>${shown ? `<div class="journal-board">${dayBlocks(month.items)}</div>` : ''}</div>`;
    }).join('');
  };
  const journalArchive = (logs) => {
    const years = yearsOf(logs);
    const scope = scopeOf();
    const slice = scopeLogs(logs, scope);
    const chips = [['7', '近7天'], ['30', '近30天']].concat(years.map((year) => [`y${year}`, `${year}年`]));
    const bar = `<div class="chips pad ref-tags journal-scopes">${chips.map(([id, name]) => `<button type="button" class="chip ${scope.id === id ? 'on' : ''}" onclick="XA.act.journalScope('${id}')">${name}</button>`).join('')}</div>`;
    if (!logs.length) return `${ui.sec('记录汇总')}<div class="end">您还没有记录。记一条之后，这里按时间和体质放在一起看。</div>`;
    return `${ui.sec('记录汇总')}${bar}${summaryCard(slice, scope)}${recordTree(slice, scope)}`;
  };
  const reviewSpan = () => REVIEW_SPANS.find((s) => s.id === (XA.tmp.reviewSpan || '7')) || REVIEW_SPANS[0];
  const spanLogs = (logs, span) => {
    if (!span.days) return logs;
    const since = Date.now() - span.days * 86400000;
    return logs.filter((item) => {
      const t = new Date(item.at).getTime();
      return !Number.isNaN(t) && t >= since;
    });
  };
  const briefTags = (text, n) => {
    const parts = String(text || '').split('、').filter((part) => part && part !== '还没记下' && part !== '还没记下穴位');
    return parts.slice(0, n).join('、');
  };
  const reviewWhen = (item) => {
    const d = new Date(item.savedAt || item.at);
    if (Number.isNaN(d.getTime())) return '';
    return dayLabel(d);
  };
  const reviewNote = (item) => {
    const feel = showTags(item.feel);
    const names = (item.points || []).map((id) => D.atlasPoints.find((p) => p.id === id)).filter(Boolean).map((p) => p.name).slice(0, 2);
    return [feel, names.join('、')].filter(Boolean).join(' · ') || (item.mins ? item.mins : '记了一笔');
  };
  const reviewCard = (logs) => {
    const span = reviewSpan();
    const slice = spanLogs(logs, span);
    const c = XA.state.constitution;
    const facts = reviewFacts(slice, c && c.type);
    const type = facts.type;
    const past = Array.isArray(XA.state.constitutionLog) ? XA.state.constitutionLog : [];
    const origin = past.length ? past[past.length - 1].type : (c ? c.type : '');
    const seg = `<div class="sec"><div class="seg">${REVIEW_SPANS.map((s) => `<button type="button" class="${s.id === span.id ? 'on' : ''}" onclick="XA.act.reviewSpan('${s.id}')">${s.name}</button>`).join('')}</div></div>`;
    if (!slice.length) {
      const older = span.days && logs.length;
      return `${seg}<div class="sec card journal-report">
        <div class="bold">本次复盘</div>
        <p>${older ? `${esc(span.name)}您还没有记录，更早的还在。` : '记一条之后，这里按您选的时间整理这次复盘。'}</p>
        ${older ? '<button class="btn btn-tonal btn-block mt12" type="button" onclick="XA.act.reviewSpan(\'all\')">看全部记录</button>' : ''}
      </div>`;
    }
    const times = slice.map((item) => new Date(item.at).getTime()).filter((t) => !Number.isNaN(t));
    const from = new Date(Math.min(...times));
    const to = new Date(Math.max(...times));
    const range = `${from.getMonth() + 1}.${from.getDate()}${from.toDateString() === to.toDateString() ? '' : ` – ${to.getMonth() + 1}.${to.getDate()}`}`;
    const points = briefTags(facts.points, 3);
    const feel = briefTags(facts.feel, 2);
    const advice = type
      ? `可继续看${pointNames(type.pts).slice(0, 2).join('、')}。${type.life}`
      : '测完体质后，这里会对照测评给出建议。';
    const open = !!XA.tmp.reviewMore;
    const shown = open ? slice.slice(0, 12) : slice.slice(0, 3);
    const hidden = slice.length - shown.length;
    const lines = [
      ['初始体质', origin || '还没有测评'],
      ['当前体质', c ? c.type : '还没有测评'],
      ['这段体感', feel || '这段还没记下体感'],
      ['常灸穴位', points || '这段还没记下穴位'],
      ['调理建议', advice],
    ];
    return `${seg}<div class="sec card journal-report">
      <div class="small muted">本次复盘 · ${esc(span.name)}</div>
      <div class="review-range">${esc(range)}</div>
      <div class="review-stats"><div><b>${facts.count}</b><span>记录</span></div><div><b>${facts.moxa}</b><span>施灸</span></div><div><b>${facts.minutes}</b><span>分钟</span></div></div>
      <div class="review-lines">${lines.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>
      <button class="btn btn-primary btn-block mt12" type="button" onclick="XA.act.testStart();XA.go('test')">去复测体质</button>
    </div>
    ${ui.sec('这段记录')}
    <div class="sec card">${shown.map((item) => `<div class="review-time"><b>${esc(reviewWhen(item))}</b><span>${esc(reviewNote(item))}</span></div>`).join('')}</div>
    ${hidden ? `<div class="sec"><button type="button" class="btn btn-tonal btn-block" onclick="XA.act.reviewMore()">展开更早的 ${hidden} 条</button></div>` : ''}
    ${open && slice.length > 3 ? '<div class="sec"><button type="button" class="btn btn-ghost btn-block" onclick="XA.act.reviewMore()">收起</button></div>' : ''}`;
  };
  XA.act.reviewMore = () => { XA.tmp.reviewMore = !XA.tmp.reviewMore; XA.refresh(); };
  const JOURNAL_FOLD = 3;
  const dayGroups = (items) => {
    const groups = [];
    items.forEach((item) => {
      const d = new Date(item.savedAt || item.at);
      const key = Number.isNaN(d.getTime()) ? '' : XA.d.key(d);
      const last = groups[groups.length - 1];
      if (!last || last.key !== key) groups.push({ key, items: [item] });
      else last.items.push(item);
    });
    return groups;
  };
  const dayLabelOf = (key) => (key ? dayLabel(XA.d.fromKey(key)) : '更早');
  const recentDaySlice = (list) => {
    if (!list.length) return null;
    const today = XA.d.key(new Date());
    const yesterday = XA.d.key(XA.d.add(-1));
    const byDay = (key) => list.filter((item) => { const d = itemDate(item); return d && XA.d.key(d) === key; });
    const todays = byDay(today);
    if (todays.length) return { key: today, label: dayLabelOf(today), items: todays };
    const ydays = byDay(yesterday);
    if (ydays.length) return { key: yesterday, label: dayLabelOf(yesterday), items: ydays };
    const last = itemDate(list[0]);
    const key = last ? XA.d.key(last) : '';
    return { key, label: dayLabelOf(key), items: byDay(key) };
  };
  const journalBoard = (list) => {
    if (!list.length) return '<div class="end">暂无记录。您记一条之后，会安静地留在这里。</div>';
    const slice = recentDaySlice(list);
    const body = `<div class="journal-day">${esc(slice.label)}</div><div class="cells">${slice.items.map((item) => journalItem(item)).join('')}</div>`;
    return `${ui.sec('最近记录')}<div class="sec journal-board">${body}</div>
      <div class="sec"><button type="button" class="btn btn-tonal btn-block" data-go="journal-history">查看历史记录</button></div>`;
  };
  const SCORE_LABEL = ['', '不明显', '轻微', '有倾向', '较明显', '明显'];
  const testPair = () => {
    const now = XA.state.constitution;
    const prev = Array.isArray(XA.state.constitutionLog) && XA.state.constitutionLog[0] ? XA.state.constitutionLog[0] : null;
    return { now, prev };
  };
  const reviewShareText = (now, prev) => {
    if (!now) return '我在晓艾了解自己的体质，慢慢养、慢慢好。';
    if (!prev) return `我的体质测评是${now.type}。来晓艾一起看看适合自己的养护方式。`;
    if (prev.type === now.type) return `我复测后体质仍偏向${now.type}。两次问卷对比，仅供日常参考。`;
    return `两次测评对比：体质倾向由「${prev.type}」调整为「${now.type}」。`;
  };
  XA.act.reviewShare = () => {
    const { now, prev } = testPair();
    XA.share(reviewShareText(now, prev));
  };
  XA.act.reviewRetest = () => {
    XA.act.testStart();
    XA.tmp.testReturnTo = 'review';
    XA.go('test');
  };
  const foldBlock = (key, title, hint, body, extra) => {
    const open = !!journalFolds()[key];
    const label = hint ? `${esc(title)}（${esc(hint)}）` : esc(title);
    return `<div class="journal-fold ${open ? 'open' : ''}">
      <button type="button" class="journal-fold-hd" onclick="XA.act.journalFold('${key}')">
        <span><b>${label}</b>${extra || ''}</span>
        <i>${open ? '收起' : '展开'}</i>
      </button>
      ${open ? `<div class="journal-fold-bd">${body}</div>` : ''}
    </div>`;
  };
  const scoreKeys = (a, b) => {
    const keys = new Set([...(a ? Object.keys(a) : []), ...(b ? Object.keys(b) : [])]);
    keys.delete('平和质');
    return [...keys].sort((x, y) => {
      const diff = Math.abs((b?.[y] || 0) - (a?.[y] || 0)) - Math.abs((b?.[x] || 0) - (a?.[x] || 0));
      if (diff) return diff;
      return Math.max(b?.[y] || 0, a?.[y] || 0) - Math.max(b?.[x] || 0, a?.[x] || 0);
    });
  };
  const trendTag = (a, b) => {
    if (b < a) return ['down', '减少'];
    if (b > a) return ['up', '增加'];
    return ['same', '稳定'];
  };
  const compareNoteHtml = (prev, now) => {
    const main = prev.type !== now.type
      ? `两次测评对比：体质倾向由「${esc(prev.type)}」调整为「${esc(now.type)}」。`
      : `两次测评对比：体质倾向仍为「${esc(now.type)}」。`;
    return `${main}<span class="compare-note-sub">说明：体质判定仅基于问卷得分，养生日志记录不参与体质运算。</span>`;
  };
  const overviewRows = (prev, now) => {
    const keys = scoreKeys(prev.scores, now.scores).filter((k) => (prev.scores?.[k] || 0) !== (now.scores?.[k] || 0));
    if (!keys.length) {
      return `<div class="sec card review-card">
        <div class="bold">变化概览</div>
        <p class="muted small mt8">各体质倾向分值暂无明显变化。</p>
      </div>`;
    }
    return `<div class="sec card review-card">
      <div class="bold">变化概览</div>
      <div class="overview-list">${keys.map((k) => {
        const a = prev.scores?.[k] || 0;
        const b = now.scores?.[k] || 0;
        const [tone, label] = trendTag(a, b);
        return `<div class="overview-row">
          <div class="grow"><b>${esc(k)}</b><span>${esc(SCORE_LABEL[a] || '—')} → ${esc(SCORE_LABEL[b] || '—')}</span></div>
          <em class="trend-${tone}">${label}</em>
        </div>`;
      }).join('')}</div>
    </div>`;
  };
  const careTips = (typeName) => {
    const t = D.types[typeName];
    if (!t) return ['请您保持规律作息', '活动宜温和，量力而行', '情绪放松，循序渐进'];
    const bits = `${t.life}。${t.lifeMore || ''}`.split(/[。；]/).map((s) => s.trim()).filter(Boolean);
    const tips = bits.slice(0, 3);
    while (tips.length < 3) tips.push(['请您保持规律作息', '活动宜温和，量力而行', '情绪放松，循序渐进'][tips.length]);
    return tips;
  };
  const reviewActions = () => `<div class="sec review-actions">
      <button class="btn btn-tonal btn-block" type="button" onclick="XA.act.reviewRetest()">再测一次</button>
      <button class="btn btn-primary btn-block" type="button" onclick="XA.act.reviewShare()">${icon('share','ic-s')} 分享体质变化</button>
    </div>`;
  const reviewHero = () => {
    const { now, prev } = testPair();
    if (!now) {
      return `<div class="sec card review-card">
        <div class="bold">核心变化</div>
        <p class="muted small mt8">您还没有完成体质测评。请先填写一次问卷；之后再测时，这里会为您对照两次结果。</p>
        <button class="btn btn-primary btn-block mt12" type="button" onclick="XA.act.reviewRetest()">去测体质</button>
      </div>`;
    }
    if (!prev || !prev.scores || !now.scores) {
      return `<div class="sec card review-card">
        <div class="bold">核心变化</div>
        <div class="core-single mt12">
          <span>本次测评</span>
          <b>${esc(now.type)}</b>
          <small>${esc(XA.d.stamp(now.at))}</small>
        </div>
        <p class="compare-note">再测一次后，这里会为您对照「上次」与「这次」的问卷结果。<span class="compare-note-sub">说明：体质判定仅基于问卷得分，养生日志记录不参与体质运算。</span></p>
      </div>
      <div class="sec card review-card">
        <div class="bold">养护建议</div>
        <div class="care-list mt8">${careTips(now.type).map((tip) => `<div>${icon('check')}<span>${esc(tip)}</span></div>`).join('')}</div>
      </div>${reviewActions()}`;
    }
    const changed = prev.type !== now.type;
    return `<div class="sec card review-card">
      <div class="bold">核心变化</div>
      <div class="core-change mt12">
        <div class="core-box core-prev"><span>上次</span><b>${esc(prev.type)}</b></div>
        <div class="core-mid"><small class="${changed ? 'state-change' : 'state-stable'}">${changed ? '有变化' : '较稳定'}</small><i></i></div>
        <div class="core-box core-now"><span>这次</span><b>${esc(now.type)}</b></div>
      </div>
      <div class="core-dates"><span>上次 ${esc(XA.d.stamp(prev.at))}</span><span>这次 ${esc(XA.d.stamp(now.at))}</span></div>
      <p class="compare-note">${compareNoteHtml(prev, now)}</p>
    </div>
    ${overviewRows(prev, now)}
    <div class="sec card review-card">
      <div class="bold">养护建议</div>
      <div class="care-list mt8">${careTips(now.type).map((tip) => `<div>${icon('check')}<span>${esc(tip)}</span></div>`).join('')}</div>
    </div>${reviewActions()}`;
  };
  XA.page('journal', {
    title: '养生日志',
    render() {
      const list = journalList();
      const form = journalForm();
      const days = [{ id: '0', name: '今天' }, { id: '-1', name: '昨天' }];
      const parts = ['头颈', '胸腹', '腰背', '上肢', '下肢'];
      const pointPicks = parts.map((part) => `<div class="point-part">${esc(part)}</div><div class="point-picks">${D.atlasPoints.filter((p) => p.part === part).map((p) => `<button type="button" class="chip ${form.points && form.points[p.id] ? 'on' : ''}" onclick="XA.act.journalPick('points','${p.id}',this,false)">${esc(p.name)}</button>`).join('')}</div>`).join('');
      const minChips = JOURNAL_MINS.map((n) => `<button type="button" class="chip ${form.mins === String(n) ? 'on' : ''}" data-min="${n}" onclick="XA.act.journalMin(${n})">${n}</button>`).join('');
      const pickedMin = form.mins === '' ? 0 : Math.max(0, Math.min(120, Number(form.mins) || 0));
      return `${journalTabs('journal')}
      <div class="sec card journal-write">
        <div class="bold">记一条</div>
        <div class="muted small mt4">请您选择时间和标签即可，不必打字。如需记细一些，可展开下面的模块。</div>
        <div class="journal-field"><span>时间</span>${journalChips('day', days, true)}${journalChips('slot', JOURNAL_SLOTS, true)}</div>
        ${foldBlock('mins', '时长', '滑动或点选', `
          <div class="journal-mins">
            <input id="journalMins" class="min-range" type="range" min="0" max="120" step="1" value="${pickedMin}" oninput="XA.act.journalMin(this.value, true)" aria-label="时长">
            <div class="min-scale"><span>0</span><span>60</span><span>120 分钟</span></div>
            <div class="min-row" id="journalMinChips">${minChips}</div>
          </div>`, `<em id="journalMinLabel">${pickedMin ? `${pickedMin} 分钟` : ''}</em>`)}
        ${foldBlock('feel', '体感', Object.keys(form.feel || {}).length ? `已选 ${Object.keys(form.feel).length} 项` : '可选', journalChips('feel', JOURNAL_FEEL, false, 'chips-3'))}
        ${foldBlock('sleep', '睡眠', Object.keys(form.sleep || {}).length ? `已选 ${Object.keys(form.sleep).length} 项` : '可选', journalChips('sleep', JOURNAL_SLEEP, false))}
        ${foldBlock('after', '灸后感受', Object.keys(form.after || {}).length ? `已选 ${Object.keys(form.after).length} 项` : '可选', journalChips('after', JOURNAL_AFTER, false, 'chips-3'))}
        ${foldBlock('points', '穴位', Object.keys(form.points || {}).length ? `已选 ${Object.keys(form.points).length} 个` : '可选', `<div class="journal-points">${pointPicks}</div>`)}
        <button class="btn btn-primary btn-block mt12" onclick="XA.act.journalSave()">记一笔</button>
      </div>
      ${journalBoard(list)}`;
    },
  });
  XA.page('review', {
    title: '体质复盘',
    render() {
      return `${journalTabs('review')}${reviewHero()}<div class="sec">${ui.disclaimer('结果供日常参考，不能替代专业诊疗。如有身体不适，请及时就医。')}</div>`;
    },
  });
  XA.act.histYear = (year) => { XA.tmp.histYear = Number(year); XA.tmp.histMonth = ''; XA.tmp.histMonths = null; XA.refresh(); };
  XA.act.histMonth = (key) => {
    let open;
    if (Array.isArray(XA.tmp.histMonths)) open = XA.tmp.histMonths.slice();
    else if (XA.tmp.histMonth === 'off') open = [];
    else open = [XA.tmp.histMonth || XA.tmp.histDefault].filter(Boolean);
    const at = open.indexOf(key);
    if (at >= 0) open.splice(at, 1);
    else open.push(key);
    XA.tmp.histMonths = open;
    XA.refresh();
  };
  XA.page('journal-history', {
    title: '历史记录',
    render() {
      const list = journalList();
      if (!list.length) return `${ui.empty('暂无历史记录', '回去记一笔', 'journal')}<div class="sec">${ui.disclaimer('记录仅保存在本机，供您自行查阅。')}</div>`;
      const years = yearsOf(list);
      const year = years.includes(Number(XA.tmp.histYear)) ? Number(XA.tmp.histYear) : years[0];
      const yearLogs = list.filter((item) => { const d = itemDate(item); return d && d.getFullYear() === year; });
      const months = groupByDate(yearLogs, (d) => `${d.getFullYear()}-${d.getMonth() + 1}`);
      const open = Array.isArray(XA.tmp.histMonths)
        ? new Set(XA.tmp.histMonths)
        : new Set(XA.tmp.histMonth === 'off' ? [] : [XA.tmp.histMonth || (months[0] && months[0].key)].filter(Boolean));
      XA.tmp.histDefault = (months[0] && months[0].key) || '';
      const yearBar = `<div class="chips pad ref-tags hist-years">${years.map((y) => `<button type="button" class="chip ${y === year ? 'on' : ''}" onclick="XA.act.histYear(${y})">${y}年</button>`).join('')}</div>`;
      const body = months.map((month) => {
        const shown = open.has(month.key);
        const title = month.date ? `${month.date.getFullYear()}年${month.date.getMonth() + 1}月` : '更早';
        return `<div class="sec hist-month"><button type="button" class="month-fold" onclick="XA.act.histMonth('${month.key}')"><b>${esc(title)}</b><span>${month.items.length} 条${shown ? ' · 收起' : ''}</span></button>${shown ? `<div class="journal-board"><div class="cells">${month.items.map((item) => journalItem(item, { compact: true })).join('')}</div></div>` : ''}</div>`;
      }).join('');
      return `${yearBar}${body || '<div class="end">这一年暂无记录</div>'}`;
    },
  });
  const guideBlock = (title, text, art) => `<div class="guide-block">${art ? `<div class="guide-art">${art}</div>` : ''}<b>${esc(title)}</b><p>${esc(text)}</p></div>`;
  XA.page('moxa-origin', {
    title: '艾材溯源品鉴',
    render() {
      return `<div class="sec card guide-hero">
        <div class="guide-hero-title">学会自己辨别艾材</div>
        <p>挑选艾材时，可以先了解几个辨别要点。这里仅分享成色与年份的分辨方式，仅您自行参考。</p>
      </div>
      <div class="sec card">
        ${guideBlock('先看产地与年份', '蕲艾、汉艾等常见产区各有特点，关键是「陈放」够不够。一般说三年、五年陈，艾性更温和，火力也更稳。包装上若只写新品名、不写陈放年数，不妨多问一句。', XA.art('season', 'mist', 'guide-thumb'))}
        ${guideBlock('再看艾绒成色', '好艾绒多呈自然黄绿色或陈年后的棕黄，绒丝细软、杂质少。若颜色发灰发黑、夹杂硬梗碎末较多，说明加工偏粗，燃烧时也更容易呛人。', XA.art('leaf', 'sage', 'guide-thumb'))}
        ${guideBlock('闻气味、看燃烧', '点燃后，气味宜清香带草气，不宜刺鼻发呛。燃烧时灰白均匀、不易掉火星，通常更省心。若烟雾极重、味道发苦发闷，可以换一批再试。', XA.art('moxa', 'sand', 'guide-thumb'))}
        ${guideBlock('常见误区', '「越烫越好」「年份越大一定越好」「贵就是好」都不尽然。家里日常调养，温和、好燃、气味清爽，往往就够用。身体不适时，仍以医嘱为准。', XA.art('hand', 'clay', 'guide-thumb'))}
      </div>
      <div class="sec">${ui.disclaimer('以上为日常辨识参考，帮助您自己看懂艾材，不构成商品推荐或疗效承诺。')}</div>`;
    },
  });
  XA.page('moxa-guide', {
    title: '艾材选用指南',
    render() {
      return `<div class="sec card guide-hero">
        <div class="guide-hero-title">艾条、艾柱、器具怎么分</div>
        <p>不同形态适合不同场景，按使用习惯选择更顺手。</p>
      </div>
      <div class="sec card">
        ${guideBlock('艾条：适合悬灸、灵活找穴', '点燃后手持或借助简易支架，距离皮肤约三到五厘米，以温热舒适为准。家用更常选直径适中、燃烧稳定的款式；新手不必追求特粗特长，先把距离和时长拿稳更重要。', XA.art('moxa', 'sage', 'guide-thumb'))}
        ${guideBlock('艾柱：适合盒灸、腾出手来', '艾柱体积小，多放进随身灸盒或温灸器使用。适合肩颈、腰腹等需要固定一段时间的部位。家用时留意盒体是否隔热、风口能否调节，感觉偏烫就及时调远或暂停。', XA.art('box', 'sand', 'guide-thumb'))}
        ${guideBlock('艾灸器具：让居家更省心', '随身灸盒、家用支架、简易温灸器，主要是帮您固定位置、减少手酸。选家用款时，优先看是否稳妥、是否好熄灭、是否便于清洁。明火器具请远离易燃物，用完确认完全熄灭。', XA.art('room', 'dusk', 'guide-thumb'))}
        ${guideBlock('怎么搭配更省事', '偶尔点穴、想灵活一点，可用艾条；经常固定部位、想解放双手，可用艾柱配灸盒。先从一两种顺手的组合开始，不必一次备齐。感到不适就停一停，慢慢来就好。', XA.art('leaf', 'mist', 'guide-thumb'))}
      </div>
      <div class="sec">${ui.disclaimer('本指南只介绍形态与使用场景差异，帮助居家选择思路，不指向具体商品，也不能替代专业指导。')}</div>`;
    },
  });
  XA.page('pointfav', {
    title: '穴位收藏',
    render() {
      const saved = D.points.filter((p) => XA.state.favs[pointKey(p.id)]);
      const rest = D.points.filter((p) => !XA.state.favs[pointKey(p.id)]);
      const star = (p) => `<button class="point-star ${XA.state.favs[pointKey(p.id)] ? 'on' : ''}" aria-label="${XA.state.favs[pointKey(p.id)] ? '取消收藏' : '收藏'}${esc(p.name)}" onclick="event.stopPropagation();XA.act.pointFav('${p.id}')">${icon('star')}</button>`;
      const row = (p) => `<div class="cell" data-go="acupoint?id=${p.id}"><span class="cell-ic">${icon('target')}</span><div class="cell-bd"><div class="acu-name"><b>${esc(p.name)}</b><span>${esc(p.part)}</span></div><div class="muted small">${esc(p.locate)}</div></div>${star(p)}</div>`;
      return `${ui.sec(saved.length ? `已收藏 ${saved.length} 个` : '您还没有收藏')}<div class="cells sec acu-rows">${saved.map(row).join('') || '<div class="cell"><div class="cell-bd muted small">点下方星标，把常用穴位留在这里。</div></div>'}</div>${ui.sec('全部穴位')}<div class="cells sec acu-rows">${rest.map(row).join('') || '<div class="cell"><div class="cell-bd muted small">常用穴位都已收藏。</div></div>'}</div>`;
    },
  });
  const QUIZ_LIMIT = 10;
  const QUIZ_PTS = 5;
  const QUIZ = [
    { id: 'q1', pts: 5, q: '新手每个穴位艾灸多久比较合适？', opts: ['1～2 分钟', '10～15 分钟', '40 分钟以上'], ok: 1, why: '温热舒适即可。新手每个穴位 10～15 分钟，每次 2～3 个穴位。' },
    { id: 'q2', pts: 5, q: '艾灸后多久可以洗澡？', opts: ['马上就可以', '间隔 2 小时以上', '第二天再洗'], ok: 1, why: '灸后先喝一杯温水，建议间隔 2 小时以上再洗澡。' },
    { id: 'q3', pts: 5, q: '艾灸时觉得发烫，怎么处理？', opts: ['越烫越好，坚持一下', '拿远一点，温热即可', '把火加大'], ok: 1, why: '烫不等于效果好。发烫就把艾条拿远一点。' },
    { id: 'q4', pts: 2, q: '饭后多久再艾灸足三里更合适？', opts: ['马上就灸', '一小时以后', '不用间隔'], ok: 1, why: '饭后一小时内不宜艾灸足三里。' },
    { id: 'q5', pts: 8, q: '孕期应避免刺激哪个穴位？', opts: ['合谷', '足三里', '涌泉'], ok: 0, why: '合谷、三阴交等穴位孕期不宜刺激。' },
    { id: 'q6', pts: 2, q: '还没测体质时，配穴方案会怎么做？', opts: ['随便配一组', '先完成体质测试', '按昨天的节气配'], ok: 1, why: '测完体质后，配穴方案才会按结果列出穴位。' },
    { id: 'q7', pts: 5, q: '百会在日常保健里更适合？', opts: ['长时间明火直灸', '以按揉为主', '空腹猛灸'], ok: 1, why: '百会以按揉为主，头部艾灸请由专业人员操作。' },
    { id: 'q8', pts: 5, q: '艾灸结束后最先要确认什么？', opts: ['艾条完全熄灭', '立刻对着风吹', '马上洗澡'], ok: 0, why: '结束后确认艾条完全熄灭，并注意保暖。' },
    { id: 'q9', pts: 2, q: '睡前想安神，更常温灸哪里？', opts: ['涌泉', '肩井', '大椎'], ok: 0, why: '涌泉适合睡前温灸或泡脚后按揉。' },
    { id: 'q10', pts: 8, q: '神阙穴施灸时要注意什么？', opts: ['可以直接灸', '用艾灸盒隔物温灸', '越烫越好'], ok: 1, why: '神阙在肚脐上，不可直接灸，建议用艾灸盒隔物温灸。' },
  ];
  const quizState = () => {
    const today = XA.d.key(new Date());
    const s = XA.state.dailyQuiz || (XA.state.dailyQuiz = { day: today, used: 0, gained: 0, streak: 0, bonus: false, correct: [], todayIds: [] });
    if (s.day !== today) {
      s.day = today; s.used = 0; s.gained = 0; s.streak = 0; s.bonus = false; s.todayIds = [];
      XA.save();
    }
    s.correct = s.correct || [];
    s.todayIds = s.todayIds || [];
    return s;
  };
  const currentQuiz = (s) => {
    if (XA.tmp.quizId && XA.tmp.quizPick != null) return QUIZ.find((item) => item.id === XA.tmp.quizId) || null;
    if (s.used >= QUIZ_LIMIT) return null;
    const done = new Set([...s.correct, ...s.todayIds]);
    const left = QUIZ.filter((item) => !done.has(item.id));
    if (!left.length) return null;
    if (XA.tmp.quizId && left.some((item) => item.id === XA.tmp.quizId)) return left.find((item) => item.id === XA.tmp.quizId);
    const item = left[new Date().getDate() % left.length];
    XA.tmp.quizId = item.id;
    return item;
  };
  XA.act.quizPick = (id, idx) => XA.needLogin(() => {
    const s = quizState();
    const item = QUIZ.find((q) => q.id === id);
    if (!item || XA.tmp.quizPick != null) return;
    if (s.used >= QUIZ_LIMIT || s.todayIds.includes(id) || s.correct.includes(id)) return XA.toast('这题今天不能再答');
    const ok = idx === item.ok;
    s.used += 1;
    s.todayIds.push(id);
    if (ok) {
      s.correct.push(id);
      XA.addPoints(QUIZ_PTS, '养生问答答对', QUIZ_PTS);
      s.gained += QUIZ_PTS;
    }
    XA.tmp.quizPick = idx;
    XA.save();
    XA.refresh();
    XA.toast(ok ? `答对了 +${QUIZ_PTS} 积分` : '答错啦', !!ok);
  }, '登录后答题可领积分');
  XA.act.quizNext = () => { XA.tmp.quizPick = null; XA.tmp.quizId = null; XA.refresh(); };
  XA.page('ask', {
    title: '养生问答',
    render() {
      const s = quizState();
      const item = currentQuiz(s);
      const picked = item && XA.tmp.quizId === item.id ? XA.tmp.quizPick : null;
      const head = `<div class="sec card quiz-meta"><div><div class="bold">今日答题 ${s.used}/${QUIZ_LIMIT}</div><div class="muted small mt4">答对 +5 积分，答错不扣，连对不加分。</div></div><div class="quiz-gain"><b>${s.gained || 0}</b><span>今日积分</span></div></div>`;
      if (!item) {
        const doneAll = QUIZ.every((q) => s.correct.includes(q.id));
        return `${head}<div class="sec card"><div class="bold">${s.used >= QUIZ_LIMIT ? '今日答题已完成，欢迎您明天再来参与养生问答。' : '这些题都答对过了'}</div>${s.used >= QUIZ_LIMIT ? '' : `<div class="muted small mt8">${doneAll ? '题库会继续更新，您可以先去看看养生日志。' : '明天还可以再来。答错的题还会出现。'}</div>`}</div><div class="sec">${ui.disclaimer('题目用于日常保健参考，不是诊疗。')}</div>`;
      }
      return `${head}
      <div class="sec quiz">
        <div class="faint small">答对 +${QUIZ_PTS} 积分</div>
        <h2 class="quiz-q">${esc(item.q)}</h2>
        <div class="quiz-opts">
          ${item.opts.map((text, i) => {
            const cls = picked == null ? '' : i === item.ok ? ' ok' : picked === i ? ' bad' : '';
            return `<button type="button" class="quiz-opt${cls}" ${picked == null ? `onclick="XA.act.quizPick('${item.id}',${i})"` : 'disabled'}><span>${esc(text)}</span>${picked != null && i === item.ok ? icon('check') : ''}</button>`;
          }).join('')}
        </div>
        ${picked == null ? '' : `<div class="quiz-why ${picked === item.ok ? 'ok' : 'bad'}"><b>${picked === item.ok ? '答对了' : '答错了'}</b><p>${esc(item.why)}</p></div><button class="btn btn-primary btn-block mt12" onclick="XA.act.quizNext()">${s.used >= QUIZ_LIMIT ? '看今日结果' : '下一题'}</button>`}
      </div>
      <div class="sec">${ui.disclaimer('题目用于日常保健参考，不是诊疗。')}</div>`;
    },
  });

  /* ---------- 全局搜索（内容 / 商品 / 笔记 / 穴位 / 品牌） ---------- */
  XA.act.search = (kw) => {
    kw = String(kw || '').trim();
    if (!kw) return XA.toast('请输入要搜索的内容');
    const h = XA.state.searchHistory;
    XA.state.searchHistory = [kw].concat(h.filter((x) => x !== kw)).slice(0, 6);
    XA.save();
    XA.go('search?q=' + encodeURIComponent(kw), XA.current().name === 'search');
  };
  XA.act.clearHistory = () => { XA.state.searchHistory = []; XA.save(); XA.refresh(); };
  XA.page('search', {
    title: '搜索',
    render(q) {
      const kw = (q.q || '').trim();
      const box = `<div class="search-top">
        <div class="searchbar input">${icon('search')}<input id="kw" type="search" placeholder="搜穴位、商品、课程" value="${esc(kw)}" onkeydown="if(event.key==='Enter')XA.act.search(this.value)"></div>
        <button class="btn btn-primary btn-sm" onclick="XA.act.search(document.getElementById('kw').value)">搜索</button>
      </div>`;
      if (!kw) {
        const hot = ['足三里', '艾条', '泡脚', '肩颈', '立冬', '睡不踏实', '元气地带'];
        const his = XA.state.searchHistory;
        return `${box}
        ${his.length ? `${ui.sec('最近搜过')}<div class="chips wrap pad">${his.map((h) => `<button class="chip" onclick="XA.act.search('${esc(h)}')">${esc(h)}</button>`).join('')}<button class="chip ghost" onclick="XA.act.clearHistory()">${icon('trash', 'ic-s')} 清空</button></div>` : ''}
        ${ui.sec('大家都在搜')}
        <div class="chips wrap pad">${hot.map((h) => `<button class="chip" onclick="XA.act.search('${h}')">${h}</button>`).join('')}</div>`;
      }
      const has = (...t) => t.join(' ').includes(kw);
      const pts = D.points.filter((p) => has(p.name, p.part, p.benefit));
      const sym = D.symptoms.filter((s) => has(s.name));
      const prods = D.products.filter((p) => has(p.title, p.kw, p.category, p.subcategory, p.tags, D.brands[p.brand].name));
      const cours = D.courses.filter((c) => has(c.title, c.intro, c.lessons.map((l) => l.t).join(' ')));
      const arts = D.articles.filter((a) => has(a.title, a.category, a.tags, a.body.join(' ')));
      const notes = D.notes.filter((n) => has(n.title, n.category, n.tags, n.body.join(' ')));
      const brands = Object.values(D.brands).filter((b) => has(b.name));
      const total = pts.length + sym.length + prods.length + cours.length + arts.length + notes.length + brands.length;
      if (!total) return `${box}${ui.empty(`没有找到「${esc(kw)}」相关内容`, '', '')}<div class="center muted small">可以换个词试试，比如「艾条」「泡脚」</div>`;
      return `${box}
        ${brands.length ? ui.sec('品牌') + `<div class="cells sec">${brands.map((b) => `<div class="cell" data-go="brand?id=${b.id}">${ui.art(b.art, 'cell-art')}<div class="cell-bd"><div class="bold">${b.name} ${ui.brandTag(b)}</div><div class="muted small">${b.slogan}</div></div>${icon('right', 'faint')}</div>`).join('')}</div>` : ''}
        ${pts.length || sym.length ? ui.sec('穴位') + `<div class="cells sec acu-rows">
          ${sym.map((s) => `<div class="cell" data-go="symptom?id=${s.id}"><span class="cell-ic">${icon('target')}</span><div class="cell-bd"><div class="bold">对症找穴 · ${s.name}</div><div class="muted small">${s.pts.map((id) => D.point(id).name).join('、')}</div></div>${icon('right', 'faint')}</div>`).join('')}
          ${pts.slice(0, 4).map((p) => `<div class="cell" data-go="acupoint?id=${p.id}"><span class="cell-ic">${icon('body')}</span><div class="cell-bd"><div class="acu-name"><b>${esc(p.name)}</b><span>${esc(p.part)}</span></div><div class="muted small">${esc(p.locate)}</div></div>${icon('right', 'faint')}</div>`).join('')}
        </div>` : ''}
        ${prods.length ? ui.sec('好物') + `<div class="feed">${prods.map((p) => ui.productCard(p, 'search')).join('')}</div>` : ''}
        ${cours.length || arts.length ? ui.sec('课程与文章') + `<div class="feed">${cours.map((c) => ui.courseCard(c)).join('')}${arts.map((a) => ui.articleCard(a)).join('')}</div>` : ''}
        ${notes.length ? ui.sec('笔记') + `<div class="feed">${notes.map((n) => ui.noteRow(n)).join('')}</div>` : ''}
        <div class="end">已经到底了</div>`;
    },
    mounted(q) { if (!q.q) { const i = XA.$('#kw'); i && i.focus(); } },
  });

  /* ---------- 点赞 / 收藏（通用） ---------- */
  XA.act.like = (key) => XA.needLogin(() => { const l = XA.state.likes; l[key] = !l[key]; XA.save(); XA.refresh(); });
  XA.act.fav = (key) => XA.needLogin(() => { const f = XA.state.favs; f[key] = !f[key]; XA.save(); XA.toast(f[key] ? '已收藏' : '已取消收藏', f[key]); XA.refresh(); });
  XA.act.shareNeed = (title) => XA.needLogin(() => XA.share(title));
  /* 浏览态底栏：未登录不可点赞、收藏、转发 */
  ui.readBar = (key, likes, title) => {
    const s = XA.state;
    return `<div class="readbar">
      <button class="rb ${s.likes[key] ? 'on' : ''}" onclick="XA.act.like('${key}')">${icon('heart')}<span>${s.likes[key] ? '已赞' : '点赞'} ${XA.wan(likes + (s.likes[key] ? 1 : 0))}</span></button>
      <button class="rb ${s.favs[key] ? 'on gold' : ''}" onclick="XA.act.fav('${key}')">${icon('star')}<span>${s.favs[key] ? '已收藏' : '收藏'}</span></button>
      <button class="rb" onclick="XA.act.shareNeed('${esc(title)}')">${icon('share')}<span>转发</span></button>
    </div>`;
  };
  /* 私域引导：评论未开放时，把讨论导向社群 */
  ui.groupCard = () => `<div class="card group" onclick="XA.wecom('加入晓艾养生交流群')">
      <span class="group-ic">${icon('users')}</span>
      <div class="grow"><div class="bold">想和大家聊聊？</div><div class="muted small">加入晓艾养生交流群，顾问在线答疑</div></div>
      <span class="btn btn-tonal btn-sm">加入</span>
    </div>`;

  /* ---------- 图文详情 ---------- */
  XA.page('article', {
    title: '文章',
    render(q) {
      const a = q.id ? D.article(q.id) : D.articles[0];
      if (!a) return '<div class="end">这篇文章暂未发布</div>';
      const p = a.product && D.product(a.product);
      return `<article class="article">
        <h1>${esc(a.title)}</h1>
        ${[a.category,a.subcategory,...(a.tags || [])].filter(Boolean).map(t => `<button class="tag tag-outline" data-go="search?q=${encodeURIComponent(t)}">${esc(t)}</button>`).join(" ")}
        <div class="byline">${ui.avatar(a.author)}<div><div class="bold">${esc(a.author)} <span class="tag tag-green">${icon('shield', 'ic-xs')}${esc(a.badge || "")}</span></div><div class="faint small">${XA.wan(a.read)} 人读过</div></div></div>
        ${ui.cover(a, 'article-cover')}
        ${ui.richBody(a, "body")}
        ${ui.disclaimer()}
      </article>
      ${p ? ui.sec('文中提到的好物') + `<div class="feed">${ui.productCard(p, 'feed')}</div>` : ''}
      <div class="sec">${ui.groupCard()}</div>`;
    },
    footer(q) { const a = q.id ? D.article(q.id) : D.articles[0]; if (!a) return ""; return ui.readBar('a_' + a.id, Math.round(a.read / 20), a.title); },
  });

  /* ---------- 专栏课程（P1：试看 + 购买引导） ---------- */
  /* 课程：Plus / 钻石 八折；白银～黄金 九五折 */
  const coursePrice = (c, plus = XA.isPlus()) => {
    if (!XA.state.loggedIn) return c.price;
    const lv = XA.level().lv;
    if (plus || lv >= 4) return Math.round(c.price * 0.8 * 100) / 100;
    if (lv >= 2) return Math.round(c.price * 0.95 * 100) / 100;
    return c.price;
  };
  XA.act.lesson = (cid, i) => {
    const c = D.course(cid), l = c.lessons[i];
    if (l.trial || XA.state.courses.includes(cid)) return XA.go(`lesson?c=${cid}&i=${i}`);
    XA.modal({ title: '订阅后可学习', content: `本讲为付费内容。订阅专栏后可学习全部 ${c.lessons.length} 讲，共 ${c.lessons.filter((x) => x.trial).length} 讲可免费试看。`, confirmText: '去订阅', cancelText: '再看看', onConfirm: () => XA.act.buyCourse(cid) });
  };
  XA.act.buyCourse = (cid) => XA.needLogin(() => {
    if (XA.state.courses.includes(cid)) return XA.toast('已订阅该课程');
    const c = D.course(cid);
    XA.purchase({ title:'专栏订阅 · ' + c.title, quote: bundle => {
      const amount = coursePrice(c, bundle || XA.isPlus());
      return {amount, detail:'课程实付 ¥' + XA.money(amount)};
    }, success: ({amount:amt}, payment) => {
      XA.state.courses.push(cid);
      XA.state.orders.unshift({ id: XA.uid('XA'), kind: 'course', ...payment, ref: cid, title: c.title, art: c.art, amount: amt, points: Math.floor(amt), status: 'done', at: new Date().toISOString() });
      XA.addPoints(Math.floor(amt), '课程订阅实付积分', Math.floor(amt));
      XA.toast('订阅成功，开始学习吧', true);
      XA.refresh();
    } });
  });
  XA.page('course', {
    title: '专栏课程',
    render(q) {
      const c = D.course(q.id) || D.courses[0], own = XA.state.courses.includes(c.id);
      return `${ui.cover(c, 'hero-art')}
      <div class="sec card">
        <h2 class="h2">${esc(c.title)}</h2>
        <div class="muted mt4">${c.intro}</div>
        <div class="byline mt12">${ui.avatar(c.teacher)}<div><div class="bold">${c.teacher} <span class="tag tag-green">本课主讲</span></div><div class="faint small">${c.teacherTitle}</div></div></div>
      </div>
      ${ui.sec(`课程目录（共 ${c.lessons.length} 讲）`)}
      <div class="cells sec">
        ${c.lessons.map((l, i) => `<div class="cell" onclick="XA.act.lesson('${c.id}',${i})">
          <span class="cell-ic ${own || l.trial ? '' : 'gray'}">${icon(own || l.trial ? 'play' : 'lock')}</span>
          <div class="cell-bd"><div>${esc(l.t)}</div><div class="faint small">${l.m} 分钟</div></div>
          ${own ? '' : l.trial ? `<span class="tag tag-green">免费试看</span>` : ''}
        </div>`).join('')}
      </div>
      <div class="sec">${ui.disclaimer()}</div>`;
    },
    footer(q) {
      const c = D.course(q.id) || D.courses[0], own = XA.state.courses.includes(c.id), amt = coursePrice(c);
      if (own) return `<button class="btn btn-primary btn-block" onclick="XA.act.lesson('${c.id}',0)">继续学习</button>`;
      return `<div class="foot-price">${ui.price(amt, 'lg')}${amt < c.price ? `<div class="small"><span class="tag tag-gold">${XA.isPlus() || XA.level().lv >= 4 ? (XA.isPlus() ? 'Plus 8 折' : '钻石 8 折') : '会员 95 折'}</span> <span class="del faint">¥${c.price}</span></div>` : ''}</div>
        ${c.lessons.some(l=>l.trial) ? `<button class="btn btn-tonal" onclick="XA.act.lesson('${c.id}',${c.lessons.findIndex(l=>l.trial)})">免费试看</button>` : ''}
        <button class="btn btn-primary grow" onclick="XA.act.buyCourse('${c.id}')">订阅专栏</button>`;
    },
  });
  XA.page('lesson', {
    title: '课程学习',
    render(q) {
      const c = D.course(q.c) || D.courses[0], i = Number(q.i) || 0, l = c.lessons[i], own = XA.state.courses.includes(c.id);
      const next = c.lessons[i + 1];
      return `<div class="player">${l.media && (own || l.trial) ? XA.mediaPreview(l.media) : `${XA.art(c.art[0], 'night', 'player-art')}<button class="player-btn" onclick="XA.toast('视频播放（演示）')">${icon('play')}</button><div class="player-bar"><i></i></div>`}</div>
      <div class="sec card">
        <h2 class="h2">${esc(l.t)}</h2>
        <div class="faint small mt4">${c.teacher} · ${l.m} 分钟 ${l.trial && !own ? '· <span class="tag tag-green">试看中</span>' : ''}</div>
        </div>
      <div class="sec card lesson-instructor">
        <div class="row between"><h3>本课主讲</h3><span class="faint small">讲师资料示例</span></div>
        <div class="byline mt12">${ui.avatar(c.teacher)}<div><b>${esc(c.teacher)}</b><div class="small muted">${esc(c.teacherTitle)}</div></div></div>
        <p class="mt12 small">${esc(c.teaching)}</p>
        <button class="link mt12" data-go="course?id=${c.id}">查看本专栏 · 已收录 ${c.lessons.length} 讲 ${icon('right','ic-xs')}</button>
      </div>
      <div class="sec">
        ${next ? `<button class="btn btn-tonal btn-block" onclick="XA.act.lesson('${c.id}',${i + 1})">下一讲：${esc(next.t.replace(/^第 \d+ 讲 /, ''))}</button>` : `<div class="center muted">已是最后一讲</div>`}
        ${own ? '' : `<button class="btn btn-primary btn-block mt12" onclick="XA.act.buyCourse('${c.id}')">订阅专栏，学习全部 ${c.lessons.length} 讲</button>`}
      </div>
      <div class="sec">${ui.disclaimer()}</div>`;
    },
  });
})();
