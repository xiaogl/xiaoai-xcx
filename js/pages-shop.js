/* pages-shop.js —— 电商：商详（品牌模块）/ 品牌专区 / 购物车 / 结算 / 支付结果 / 订单 / 仅退款 */
(function () {
  const D = XA.data, icon = XA.icon, ui = XA.ui, esc = XA.esc;
  const SRC = { feed: '首页聚合流', video: '视频挂车', post: '社区好物', search: '搜索', order: '订单复购', promoter: '推广链路', group: '拼团' };
  const ADDRESS = { name: '林阿姨', phone: '138****6608', address: '浙江省杭州市西湖区 文三路 ×× 小区 3 幢 502 室（演示地址）' };
  const deliveryAddress = () => XA.state.shippingAddress || ADDRESS;
  const addressText = buyer => `<div class="bold">${esc(buyer.name)}　${esc(buyer.phone)}</div><div class="muted small">${esc(buyer.address)}</div>`;
  XA.act.editDelivery = () => {
    const buyer = deliveryAddress();
    const panel = XA.sheet({title:'收货地址',html:`<form class="partner-form">
      <label>收件人<input name="name" class="input" maxlength="32" required value="${esc(buyer.name)}"></label>
      <label>手机号码<input name="phone" class="input" type="tel" maxlength="11" required value="${esc(buyer.phone)}"></label>
      <label>详细地址<input name="address" class="input" maxlength="160" required value="${esc(buyer.address)}"></label>
      <button class="btn btn-primary btn-block">保存收货地址</button></form>`});
    panel.querySelector('form').onsubmit = event => {
      event.preventDefault();
      const form = new FormData(event.target);
      const value = Object.fromEntries(['name','phone','address'].map(k=>[k,String(form.get(k)).trim()]));
      if (!value.name || !value.address || /[<>"'&\x00-\x1f]/.test(value.name+value.address) ||
          !(value.phone===ADDRESS.phone || /^1\d{10}$/.test(value.phone))) return XA.toast('请填写有效的收件人、手机号和详细地址');
      XA.state.shippingAddress = value;
      XA.save(); XA.closeSheet(); XA.refresh();
    };
  };

  XA.page('catalog', {
    title: '商品分类',
    render(q) {
      const categories = ['全部', ...(D.shopCategories ? D.shopCategories.filter(c=>c.enabled).sort((a,b)=>a.sort-b.sort).map(c=>c.name) : [...new Set(D.products.map(p => p.category).filter(Boolean))])];
      const current = categories.includes(q.category) ? q.category : '全部';
      const children = D.shopCategories?.find(c => c.enabled && c.name === current)?.sub || [];
      const child = children.includes(q.sub) ? q.sub : '';
      const list = D.products.filter(p => (current === '全部' || p.category === current) && (!child || p.subcategory === child));
      return `<div class="sec chips wrap">${categories.map(c => `<button class="chip ${current===c?'on':''}" data-go="catalog?category=${encodeURIComponent(c)}">${esc(c)}</button>`).join('')}</div>
        ${children.length ? `<div class="sec chips wrap">${['',...children].map(c => `<button class="chip ${child===c?'on':''}" data-go="catalog?category=${encodeURIComponent(current)}&amp;sub=${encodeURIComponent(c)}">${esc(c || '全部子类')}</button>`).join('')}</div>` : ''}
        ${ui.sec(esc(child || (current === '全部' ? '全部商品' : current)))}<div class="feed">${list.map(p=>ui.productCard(p,'feed')).join('')}</div>`;
    },
  });
  /* ---------- 购物车数据 ---------- */
  XA.cartCount = () => XA.state.cart.reduce((a, c) => a + c.qty, 0);
  const cartReminderPages = new Set(['home', 'search', 'article', 'lesson', 'course', 'video', 'creator', 'community', 'topic', 'note', 'brand', 'catalog', 'favs', 'me', 'test-result', 'symptom']);
  XA.updateCartReminder = page => {
    const count = XA.cartCount();
    const reminder = XA.$('#cart-reminder');
    reminder.hidden = !count || !cartReminderPages.has(page);
    if (!reminder.hidden) {
      reminder.innerHTML = `${icon('cart', 'ic-s')}<b>购物车</b><span>${count} 件商品</span><strong>去购物车 ${icon('right', 'ic-s')}</strong>`;
    }
    const sheetCount = XA.$('#bag-cart-count');
    if (sheetCount) sheetCount.textContent = count ? `（${count} 件）` : '';
  };
  const available = (p, opts) => {
    if (!p || p.offShelf || p.soldOut || p.specs.some((s,i)=>!s.options[opts[i]])) return 0;
    return p.skus ? (p.skus.find(s=>s.key === (opts.join('_') || 'default'))?.stock || 0) : (p.stock ?? 99);
  };
  const canFulfill = c => available(D.product(c.pid),c.opts) >= c.qty;
  const addCart = (pid, opts, qty, source) => {
    const cart = XA.state.cart, key = pid + '|' + opts.join(',');
    const hit = cart.find((c) => c.key === key);
    if (available(D.product(pid),opts) < qty + (hit?.qty || 0)) { XA.toast('该规格库存不足'); return false; }
    if (hit) hit.qty += qty; else cart.unshift({ key, pid, opts, qty, checked: true, source: source || 'feed' });
    XA.save(); return true;
  };
  XA.act.quickAdd = (pid, source) => {
    const p = D.product(pid);
    if (!p || !addCart(pid, XA.defaultOpts(p), 1, source)) return;
    XA.updateCartReminder(XA.current()?.name);
    XA.toast('已加入购物车', true);
  };

  /* ---------- 规格选择抽屉（主流电商交互：选规格 → 数量 → 确认） ---------- */
  const priceLabels = (p,opts) => {
    const q=XA.productQuote(p,opts);
    return (q.price<q.sale ? `<span class="tag tag-gold">${XA.priceTag()}</span>` : '') +
      (q.strike>q.price ? `<del class="faint small">¥${XA.money(q.strike)}</del>` : '') +
      (q.list!=null ? `<span class="muted small">挂牌价 ¥${XA.money(q.list)}</span>` : '');
  };
  let sku = null;
  const paintSku = () => {
    const p = D.product(sku.pid), mp = XA.memberPrice(p, sku.opts);
    XA.$('#skuBody').innerHTML = `
      <div class="sku-hd">${ui.cover(p, 'sku-img')}<div><div class="row gap6">${ui.price(mp, 'lg')}${priceLabels(p,sku.opts)}</div><div class="muted small mt4">已选：${esc(XA.specLabel(p, sku.opts) || '标准规格')} · 可售库存 ${available(p,sku.opts)} 件</div></div></div>
      ${p.specs.map((s, si) => `<div class="sku-group"><div class="bold">${s.name}</div><div class="chips wrap mt8">${s.options.map((o, oi) => `<button class="chip lg ${sku.opts[si] === oi ? 'on' : ''}" onclick="XA.act.skuPick(${si},${oi})">${o.t}</button>`).join('')}</div></div>`).join('')}
      <div class="sku-group row between"><div class="bold">数量</div>
        <div class="stepper"><button onclick="XA.act.skuQty(-1)" ${sku.qty <= 1 ? 'disabled' : ''} aria-label="减少">${icon('minus')}</button><span>${sku.qty}</span><button onclick="XA.act.skuQty(1)" ${sku.qty >= available(p,sku.opts) ? "disabled" : ""} aria-label="增加">${icon('plus')}</button></div>
      </div>
      <div class="row gap12 mt20">
        ${sku.mode !== 'buy' ? `<button class="btn btn-tonal grow" onclick="XA.act.skuOk('cart')">加入购物车</button>` : ''}
        ${sku.mode !== 'cart' ? `<button class="btn btn-primary grow" onclick="XA.act.skuOk('buy')">立即购买</button>` : ''}
      </div>`;
  };
  XA.act.sku = (pid, mode) => {
    const p = D.product(pid);
    XA.tmp.sel = XA.tmp.sel || {};
    sku = { pid, mode: mode || 'both', opts: (XA.tmp.sel[pid] || XA.defaultOpts(p)).slice(), qty: 1 };
    XA.sheet({ title: '选择规格', html: `<div id="skuBody"></div>` });
    paintSku();
  };
  XA.act.skuPick = (si, oi) => { sku.opts[si] = oi; XA.tmp.sel[sku.pid] = sku.opts.slice(); paintSku(); };
  XA.act.skuQty = (d) => { sku.qty = Math.max(1, Math.min(99, sku.qty + d)); paintSku(); };
  XA.act.skuOk = (mode) => {
    const source = (XA.tmp.source && XA.tmp.source[sku.pid]) || 'feed';
    if (available(D.product(sku.pid),sku.opts) < sku.qty) return XA.toast('该规格库存不足');
    XA.closeSheet();
    if (mode === 'cart') {
      if (!addCart(sku.pid, sku.opts.slice(), sku.qty, source)) return;
      XA.toast('已加入购物车', true);
      return XA.refresh();
    }
    XA.needLogin(() => {
      XA.tmp.checkout = { items: [{ pid: sku.pid, opts: sku.opts.slice(), qty: sku.qty, source }], fromCart: false };
      XA.go('checkout');
    }, '登录后继续购买，已选规格和数量会保留。');
  };

  /* ---------- 商品详情 ---------- */
  XA.page('product', {
    title: '商品详情',
    render(q) {
      const p = D.product(q.id) || D.products[0], b = D.brands[p.brand];
      XA.tmp.source = XA.tmp.source || {};
      if (q.source) XA.tmp.source[p.id] = q.source;
      const opts = (XA.tmp.sel && XA.tmp.sel[p.id]) || XA.defaultOpts(p);
      const mp = XA.memberPrice(p, opts);
      const assets = p.gallery?.some(a=>a?.key) ? p.gallery.filter(a=>a?.key) : p.coverMedia ? [p.coverMedia] : [];
      const imgs = assets.length ? assets : [p.art];
      return `
      <div class="carousel pcar" id="car">${imgs.map((a,i) => `<div class="slide">${assets.length ? XA.mediaPreview(a) : ui.cover(p)}</div>`).join('')}</div>
      <div class="car-dots" id="carDots">${imgs.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div>
      <div class="sec card">
        <div class="row gap8">${ui.price(mp, 'xl')}${priceLabels(p,opts)}<span class="grow"></span><span class="faint small">已售 ${XA.wan(p.sales)}</span></div>
        <h1 class="ptitle">${p.curated ? `<span class="tag tag-solid">晓艾精选</span>` : ''}${esc(p.title)}</h1>
        ${p.points?.length ? `<ul class="ppoints">${p.points.map((t) => `<li>${icon('check', 'ic-s')}<span>${esc(t)}</span></li>`).join('')}</ul>` : ''}
        <div class="trust-bar" data-go="brand?id=${b.id}">
          <span>${icon('leaf', 'ic-xs')}${b.origin.split(/[·，]/)[0].trim()}</span><i></i>
          <span>${icon('doc', 'ic-xs')}证照可查</span><i></i>
          <span>${icon('headset', 'ic-xs')}统一售后</span>
          <em>看品牌${icon('right', 'ic-xs')}</em>
        </div>
      </div>
      ${XA.groupOf && XA.groupOf(p.id) ? (() => { const g = XA.groupOf(p.id); return `<div class="sec card group" data-go="groups"><span class="group-ic warm">${icon('users')}</span><div class="grow"><div class="bold">${g.size} 人拼团价 ¥${g.price}</div><div class="muted small">单买 ¥${p.price} · 24 小时未成团自动退款</div></div><button class="btn btn-sm btn-warm" onclick="event.stopPropagation();XA.act.groupStart('${p.id}')">去拼团</button></div>`; })() : ''}
      <div class="sec card brand-entry" data-go="brand?id=${b.id}">
        <div class="brand-entry-hd">
          <span class="brand-mark">${b.mark || b.name.slice(0, 1)}</span>
          <div class="grow">
            <div class="row gap6"><b class="brand-entry-name">${b.name}</b>${ui.brandTag(b)}</div>
            <div class="muted small ell">${b.slogan}</div>
          </div>
          <span class="btn btn-tonal btn-sm">进品牌</span>
        </div>
        <div class="brand-entry-stats">
          <div><b>${b.since} 年</b><span>创立</span></div>
          <div><b>${b.rating}</b><span>综合评分</span></div>
          <div><b>${b.sold}</b><span>累计售出</span></div>
          <div><b>${XA.wan(b.fans)}</b><span>关注</span></div>
        </div>
        <div class="brand-entry-promise">${(b.promise || []).map((t) => `<span>${icon('check', 'ic-xs')}${t}</span>`).join('')}</div>
        <div class="brand-entry-ft"><span class="muted small">晓艾精选 · ${b.city}</span><b>走进品牌${icon('right', 'ic-xs')}</b></div>
      </div>
      <div class="cells sec">
        <div class="cell" onclick="XA.act.sku('${p.id}')"><span class="cell-label">规格</span><div class="cell-bd">${p.soldOut ? '暂时无货' : '已选：' + XA.specLabel(p, opts)}</div>${icon('right', 'faint')}</div>
        <div class="cell"><span class="cell-label">配送</span><div class="cell-bd">现货 · 48 小时内发货 · ${XA.freeShip() ? (XA.isPlus() ? 'Plus 全年包邮' : '黄金起包邮') : '满 59 元包邮'}</div></div>
        <div class="cell"><span class="cell-label">服务</span><div class="cell-bd">未发货时您可申请退款 · <button class="link" data-go="brand?id=${b.id}">证照与检测</button></div></div>
      </div>
      ${ui.sec('商品详情')}
        ${[p.category,p.subcategory,...(p.tags || [])].filter(Boolean).map(t => `<button class="tag tag-outline" data-go="search?q=${encodeURIComponent(t)}">${esc(t)}</button>`).join(" ")}
      <div class="sec card pdetail">
        ${ui.richBody(p, "detail", p.detailDelta ? "" : ui.cover(p, "pdetail-img"))}
      </div>
      <div class="sec">${ui.disclaimer('本品为养生保健用品，不能替代药品与医疗器械，不具有疾病治疗功能。')}</div>`;
    },
    mounted() {
      const car = XA.$('#car'), dots = XA.$$('#carDots i');
      if (car) car.addEventListener('scroll', () => { const i = Math.round(car.scrollLeft / car.clientWidth); dots.forEach((d, k) => d.classList.toggle('on', k === i)); }, { passive: true });
    },
    footer(q) {
      const p = D.product(q.id) || D.products[0], n = XA.cartCount();
      return `<button class="fbtn" onclick="XA.wecom('联系客服')">${icon('headset')}<span>客服</span></button>
        <button class="fbtn" data-go="cart">${icon('cart')}<span>购物车</span>${n ? `<em class="badge">${n}</em>` : ''}</button>
        ${p.soldOut ? `<button class="btn btn-gray grow" onclick="XA.toast('到货后会通知您（演示）',true)">已售罄 · 到货提醒我</button>` :
          `<button class="btn btn-tonal grow" onclick="XA.act.sku('${p.id}','cart')">加入购物车</button><button class="btn btn-primary grow" onclick="XA.act.sku('${p.id}','buy')">立即购买</button>`}`;
    },
  });

  /* ---------- 品牌页：用故事、做法与可查证照传递实力感（避免直白口号） ---------- */
  XA.act.certView = (bid, i) => {
    const b = D.brands[bid], c = b.certs[i];
    const name = typeof c === 'string' ? c : c.name;
    const meta = typeof c === 'string' ? '' : `<div class="kv mt12"><b>核发机构</b><span>${c.org}</span></div><div class="kv"><b>核验时间</b><span>${c.at}</span></div><div class="kv"><b>编号</b><span class="muted">${c.no}</span></div>`;
    XA.sheet({
      title: name,
      html: `<div class="cert-preview">${icon('doc')}<div class="bold mt12">${name}</div><div class="muted small mt4">原件已存档 · 演示示意</div></div>
        ${meta}
        <div class="sec tipbox mt12">${icon('info')}<span>正式环境可查看扫描件；到期或抽检异常时，相关商品会暂停销售。</span></div>`,
    });
  };
  XA.page('brand', {
    title: '品牌',
    render(q) {
      const b = D.brands[q.id] || D.brands.yqdd;
      const prods = D.products.filter((p) => p.brand === b.id);
      const notes = D.notes.filter((n) => n.product && D.product(n.product) && D.product(n.product).brand === b.id).slice(0, 2);
      const videos = D.videos.filter((v) => (v.binds || []).some((x) => x.type === 'product' && D.product(x.id) && D.product(x.id).brand === b.id)).slice(0, 2);
      const process = b.process || D.brandProcess;
      return `
      <div class="brand-hero">
        <div class="brand-hero-bg">${ui.art(b.art, 'brand-hd-art')}</div>
        <div class="brand-hero-in">
          <span class="brand-mark xl">${b.mark || b.name.slice(0, 1)}</span>
          <div class="grow">
            <h1>${b.name}</h1>
            <div class="muted small">${b.slogan}</div>
            <div class="row gap6 mt8 flex-wrap"><span class="tag tag-orange">晓艾精选</span><span class="tag tag-gray">${b.city}</span></div>
          </div>
        </div>
      </div>
      <div class="sec"><button class="btn btn-tonal btn-block" onclick="XA.act.partner('dealer','${b.id}')">成为经销商</button></div>
      <div class="sec card brand-metrics">
        <div><b>${b.since}</b><span>创立年份</span></div>
        <div><b>${b.rating}</b><span>综合评分</span></div>
        <div><b>${b.sold}</b><span>累计售出</span></div>
        <div><b>${XA.wan(b.fans)}</b><span>关注人数</span></div>
      </div>
      ${ui.sec('品牌故事')}
      <div class="sec card"><p class="muted" style="line-height:1.7">${b.story}</p></div>
      ${ui.sec('怎么做货')}
      <div class="sec card brand-grid">${(b.highlights || []).map((h) => `<div class="bh"><span class="bh-ic">${icon(h.ic)}</span><b>${h.t}</b><span>${h.d}</span></div>`).join('')}</div>
      <div class="sec card">
        <div class="kv"><b>原料 / 产地</b><span>${b.origin}</span></div>
        <div class="kv"><b>生产与质控</b><span>${b.factory}</span></div>
        <div class="kv"><b>服务说明</b><span>${(b.promise || []).join(' · ')}</span></div>
      </div>
      ${ui.sec('从产地到上架')}
      <div class="sec card">
        <div class="admit">${process.map((t, i) => `<div class="admit-i"><em>${i + 1}</em><span>${t}</span></div>`).join('')}</div>
        <div class="faint small mt12">证照到期或抽检异常时，相关商品会暂停销售。</div>
      </div>
      ${ui.sec('证照与检测')}
      <div class="sec card">
        <div class="certs">${b.certs.map((c, i) => {
          const name = typeof c === 'string' ? c : c.name;
          const sub = typeof c === 'string' ? '可查' : `${c.org} · ${c.at}`;
          return `<button class="cert" onclick="XA.act.certView('${b.id}',${i})">${icon('doc')}<div class="grow"><div class="bold">${name}</div><div class="faint tiny">${sub}</div></div><em>可查</em>${icon('right', 'faint')}</button>`;
        }).join('')}</div>
      </div>
      ${ui.sec(`在售好物（${prods.length}）`)}
      <div class="feed">${prods.map((p) => ui.productCard(p, 'feed')).join('')}</div>
      ${videos.length ? ui.sec('相关视频') + `<div class="cells sec">${videos.map((v) => `<div class="cell" data-go="video"><span class="cell-ic">${icon('play')}</span><div class="cell-bd"><div class="bold">${esc(v.title)}</div><div class="faint tiny">${v.author} · ${XA.wan(v.likes)} 赞</div></div>${icon('right', 'faint')}</div>`).join('')}</div>` : ''}
      ${notes.length ? ui.sec('相关笔记') + `<div class="feed">${notes.map(ui.noteRow).join('')}</div>` : ''}
      <div class="end">品牌信息为演示示例</div>`;
    },
    footer(q) {
      const b = D.brands[q.id] || D.brands.yqdd;
      const first = D.products.find((p) => p.brand === b.id && !p.soldOut) || D.products.find((p) => p.brand === b.id);
      return first ? `<button class="btn btn-primary btn-block" data-go="product?id=${first.id}&source=brand">看看代表好物</button>` : '';
    },
  });

  /* ---------- 购物车 ---------- */
  XA.act.cartCheck = (i) => { const c = XA.state.cart[i]; c.checked = !c.checked; XA.save(); XA.refresh(); };
  XA.act.cartAll = () => { const cart = XA.state.cart.filter((c) => canFulfill(c)); const all = cart.every((c) => c.checked); cart.forEach((c) => (c.checked = !all)); XA.save(); XA.refresh(); };
  XA.act.cartQty = (i, d) => { const c = XA.state.cart[i]; c.qty = Math.max(1, Math.min(99, c.qty + d)); XA.save(); XA.refresh(); };
  XA.act.cartDel = (i) => XA.modal({ title: '删除这件商品？', confirmText: '删除', danger: true, onConfirm: () => { XA.state.cart.splice(i, 1); XA.save(); XA.refresh(); } });
  XA.act.cartGo = () => {
    const items = XA.state.cart.filter((c) => c.checked);
    if (!items.every(canFulfill)) return XA.toast('所选商品已下架或库存不足');
    if (!items.length) return XA.toast('请先勾选要结算的商品');
    XA.needLogin(() => { XA.tmp.checkout = { items: items.map((c) => ({ pid: c.pid, opts: c.opts, qty: c.qty, source: c.source, key: c.key })), fromCart: true }; XA.go('checkout'); }, '登录后继续结算，已勾选的商品会保留。');
  };
  XA.page('cart', {
    title: '购物车',
    render() {
      const cart = XA.state.cart;
      if (!cart.length) return ui.empty('购物车还是空的', '去首页看看好物', 'home');
      return `<div class="sec cart">
        ${cart.map((c, i) => {
          const p = D.product(c.pid);
          if (!canFulfill(c)) return `<div class="card cart-item">${esc(p?.title || '已下架商品')} · 库存不足或已下架 <button onclick="XA.act.cartDel(${i})">移除</button></div>`;
          const mp = XA.memberPrice(p, c.opts);
          return `<div class="card cart-item">
            <button class="check ${c.checked ? 'on' : ''}" onclick="XA.act.cartCheck(${i})" aria-label="选择">${icon('check')}</button>
            <div data-go="product?id=${p.id}&source=${c.source}">${ui.cover(p, 'cart-img')}</div>
            <div class="grow">
              <div class="fcard-title">${esc(p.title)}</div>
              <div class="faint small">${XA.specLabel(p, c.opts)}</div>
              <div class="row between mt8">${ui.price(mp)}
                <div class="stepper sm"><button onclick="XA.act.cartQty(${i},-1)" ${c.qty <= 1 ? 'disabled' : ''} aria-label="减少">${icon('minus')}</button><span>${c.qty}</span><button onclick="XA.act.cartQty(${i},1)" aria-label="增加">${icon('plus')}</button></div>
              </div>
            </div>
            <button class="cart-del" onclick="XA.act.cartDel(${i})" aria-label="删除">${icon('trash')}</button>
          </div>`;
        }).join('')}
      </div>
      <div class="center faint small mt12">${XA.freeShip() ? (XA.isPlus() ? 'Plus 全年包邮' : '黄金起包邮') : '满 59 元包邮'} · 未发货时可退款</div>`;
    },
    footer() {
      const cart = XA.state.cart;
      if (!cart.length) return '';
      const sel = cart.filter((c) => c.checked && canFulfill(c)), all = sel.length === cart.length;
      const sum = sel.reduce((a, c) => a + XA.memberPrice(D.product(c.pid), c.opts) * c.qty, 0);
      return `<button class="row gap8" onclick="XA.act.cartAll()"><span class="check ${all ? 'on' : ''}">${icon('check')}</span>全选</button>
        <div class="grow right">合计 ${ui.price(sum, 'lg')}</div>
        <button class="btn btn-primary" onclick="XA.act.cartGo()">${XA.state.loggedIn ? '去结算' : '登录并结算'}${sel.length ? `（${sel.reduce((a, c) => a + c.qty, 0)}）` : ''}</button>`;
    },
  });

  /* ---------- 结算（金额应由服务端计算，这里前端演示） ---------- */
  const calc = (bundle = false) => {
    const ck = XA.tmp.checkout;
    const goods = ck.items.reduce((a, it) => a + XA.memberPrice(D.product(it.pid), it.opts, bundle || XA.isPlus()) * it.qty, 0);
    const freight = bundle || XA.freeShip() || goods >= 59 ? 0 : 8;
    const usable = XA.state.coupons.filter((c) => !c.used && c.scope === 'goods' && goods >= c.min).sort((a, b) => b.amount - a.amount);
    let coupon = null;
    if (ck.coupon !== 'none') coupon = usable.find((c) => c.id === ck.coupon) || usable[0] || null;
    const off = coupon ? coupon.amount : 0;
    const amount = Math.max(0.01, Math.round((goods + freight - off) * 100) / 100);
    return { goods, freight, usable, coupon, off, amount, detail:`商品 ¥${XA.money(goods)} · 运费 ¥${freight}${off ? ' · 券减 ¥'+off : ''}` };
  };
  XA.act.pickCoupon = () => {
    const r = calc();
    if (!r.usable.length) return XA.toast('暂无可用优惠券');
    XA.sheet({
      title: '选择优惠券',
      html: `<div class="radios">
        ${r.usable.map((c) => `<button class="radio ${r.coupon && r.coupon.id === c.id ? 'on' : ''}" onclick="XA.tmp.checkout.coupon='${c.id}';XA.closeSheet();XA.refresh()"><div><div class="bold">${c.name}　减 ¥${c.amount}</div><div class="faint small">满 ${c.min} 元可用 · ${c.expire} 到期</div></div><span class="check ${r.coupon && r.coupon.id === c.id ? 'on' : ''}">${icon('check')}</span></button>`).join('')}
        <button class="radio ${!r.coupon ? 'on' : ''}" onclick="XA.tmp.checkout.coupon='none';XA.closeSheet();XA.refresh()"><div class="bold">不使用优惠券</div><span class="check ${!r.coupon ? 'on' : ''}">${icon('check')}</span></button>
      </div>`,
    });
  };
  XA.act.payOrder = () => {
    if (!XA.state.loggedIn) return XA.login(XA.act.payOrder, '登录后可提交这笔订单。');
    const ck = XA.tmp.checkout;
    if (!ck?.items.every(canFulfill)) return XA.toast('商品已下架或库存不足');
    ck.paymentKey ||= crypto.randomUUID();
    const quote=calc();
    const buyer=ck.buyer || deliveryAddress();
    const placed=XA.changeTrade({action:'place',buyer,key:ck.paymentKey,items:ck.items,amount:quote.amount,plusFee:0,bundle:false,plus:XA.isPlus(),level:XA.level().lv,coupon:quote.coupon});
    if(!placed) return;
    ck.buyer = placed.buyer;
    XA.purchase({title:'晓艾 · 商品订单',quote:calc,deferPlus:true,success:(r,payment)=>{
      const order=XA.changeTrade({action:'pay',buyer:placed.buyer,key:ck.paymentKey,items:ck.items,amount:r.amount,plusFee:payment.plusFee,
        bundle:payment.plusFee>0,plus:XA.isPlus(),level:XA.level().lv,coupon:r.coupon});
      if (!order) { XA.loadCatalog().then(()=>XA.refresh()); return; }
      const s=XA.state,base=order.growth,pts=order.points;
      if (s.tradeCredits?.[order.id]) return XA.go('order?id='+order.id,true);
      (s.tradeCredits ||= {})[order.id]='paid';
      if (order.plusFee) XA.recordPlus(false,order.paymentId);
      for(const item of order.items) {
        const p=D.product(item.pid),sku=p?.skus?.find(s=>s.key===item.skuKey);
        if(sku){sku.stock-=item.qty;p.stock-=item.qty;p.soldOut=p.stock===0;}
      }
      if (r.coupon) r.coupon.used = true;
      if (ck.fromCart) s.cart = s.cart.filter((c) => !ck.items.some((it) => it.key === c.key));
      XA.addPoints(pts, XA.ptsMult() > 1 ? (XA.isPlus() ? '购物实付积分（Plus 双倍）' : '购物实付积分（钻石双倍）') : '购物实付积分', base);
      XA.tmp.checkout = null;
      XA.subscribe(['订单发货通知', '订单签收提醒'], () => XA.go('pay-result?id=' + order.id, true));
    } });
  };
  const itemRow = (it) => {
    if (it.specLabel) return `<div class="oitem">${ui.art(it.art,'oitem-img')}<div class="grow">${esc(it.title)}<div class="muted small">${esc(it.specLabel)}</div></div><span>¥${XA.money(it.price)} ×${it.qty}</span></div>`;
    const p = D.product(it.pid);
    if (!p) return `<div class="oitem"><span>已下架商品 · ${esc(it.title || it.pid)}</span><span>¥${XA.money(it.price)} ×${it.qty}</span></div>`;
    return `<div class="oitem">${ui.cover(p, 'oitem-img')}<div class="grow"><div class="fcard-title">${esc(p.title)}</div><div class="faint small">${XA.specLabel(p, it.opts)}</div></div><div class="right"><div>¥${XA.money(it.price != null ? it.price : XA.memberPrice(p, it.opts))}</div><div class="faint small">×${it.qty}</div></div></div>`;
  };
  XA.page('checkout', {
    title: '确认订单',
    render() {
      const ck = XA.tmp.checkout;
      if (!ck) return ui.empty('没有待结算的商品', '去首页看看好物', 'home');
      const r = calc();
      return `
      ${ui.sec('收货信息')}
      <div class="sec card addr" ${ck.buyer ? '' : 'onclick="XA.act.editDelivery()"'}>
        <span class="addr-ic">${icon('pin')}</span>
        <div class="grow">${addressText(ck.buyer || deliveryAddress())}</div>${icon('right', 'faint')}
      </div>
      ${ui.sec('商品清单')}
      <div class="sec card">${ck.items.map(itemRow).join('')}</div>
      ${ui.sec('费用明细')}
      <div class="cells sec">
        <div class="cell"><div class="cell-bd">商品金额</div><span>¥${XA.money(r.goods)}</span></div>
        <div class="cell"><div class="cell-bd">运费</div><span>${r.freight ? '¥' + r.freight : XA.freeShip() ? '会员包邮' : '包邮'}</span></div>
        <div class="cell" onclick="XA.act.pickCoupon()"><div class="cell-bd">优惠券</div><span class="${r.coupon ? 'c-price' : 'faint'}">${r.coupon ? `-¥${r.off}　${r.coupon.name}` : r.usable.length ? '不使用' : '暂无可用'}</span>${icon('right', 'faint')}</div>
        <div class="cell"><div class="cell-bd">晓艾会积分</div><span class="muted">本单可得 <b class="c-primary">${Math.floor(r.amount) * XA.ptsMult()}</b> 积分${XA.ptsMult() > 1 ? ` <span class="tag tag-gold">${XA.isPlus() ? 'Plus' : '钻石'}双倍</span>` : ''}</span></div>
      </div>
      <div class="center faint small mt12">未发货时您可申请退款，款项原路退回</div>`;
    },
    footer() {
      if (!XA.tmp.checkout) return '';
      const r = calc();
      return `<div class="grow">合计 ${ui.price(r.amount, 'lg')}</div><button class="btn btn-wx" style="min-width:9rem" onclick="XA.act.payOrder()">${XA.isPlus() ? '微信支付' : '选择购买方式'}</button>`;
    },
  });
  XA.page('pay-result', {
    title: '支付结果',
    render(q) {
      const o = XA.state.orders.find((x) => x.id === q.id) || XA.state.orders[0];
      return `<div class="result">
        <div class="result-ic">${icon('check')}</div>
        <h1>支付成功</h1>
        <div class="muted">支付 ¥${XA.money(o.amount+(o.plusFee||0))}${o.plusFee ? `（含 Plus 年费 ¥${o.plusFee}）` : ''}，我们会尽快为您发货</div>
        <div class="result-pts">${icon('coin')} <span><b>${o.points} 积分</b>已到账晓艾会账户</span></div>
        ${o.refund ? `<div class="sec card">退款金额 ¥${XA.money(o.refund.amount)} · ${esc(({pending:'待审核',approved:'已通过',rejected:'已驳回'})[o.refund.status])}<div>${esc(o.refund.auditNotes || o.refund.reason)}</div></div>` : ''}
      ${typeof ui.redpackEntry === 'function' ? ui.redpackEntry(o) : ''}
        <button class="btn btn-primary btn-block mt20" onclick="XA.go('order?id=${o.id}',true)">查看订单</button>
        <button class="btn btn-ghost btn-block mt8" data-go="home">回到首页</button>
      </div>`;
    },
  });

  /* ---------- 订单列表 / 详情 ---------- */
  const ST = { unpaid:['待付款','确认模拟付款后扣减库存'], refunding:['退款审核中','退款申请已提交，等待运营审核'], grouping: ['拼团中', '邀请好友参团，成团后发货；超时未成团自动退款'], toship: ['待发货', '商家正在备货，48 小时内发出'], shipped: ['待收货', '包裹正在路上，请留意签收'], done: ['已完成', '感谢您的信任，期待再次相遇'], refunded: ['已退款', '模拟款项已退回'] };
  XA.act.resumePay = id => {
    const order=XA.state.orders.find(o=>o.id===id);
    if(!order || order.status!=='unpaid') return;
    XA.tmp.checkout={items:order.checkoutItems,paymentKey:order.key,buyer:order.buyer,coupon:order.couponChoice};
    if(!order.checkoutItems.every(canFulfill)) return XA.toast('库存或规格已变更，请重新选购');
    XA.go('checkout');
  };
  XA.act.confirmReceive = (id) => XA.modal({ title: '确认已收到货？', content: '确认后订单完成。', confirmText: '确认收货', onConfirm: () => { const order=XA.state.orders.find(o=>o.id===id); if(order.shared && !XA.changeTrade({action:'receive',id})) return; order.status='done'; XA.save(); XA.toast('已确认收货', true); XA.refresh(); } });
  XA.act.demoShip = (id) => { XA.state.orders.find((o) => o.id === id).status = 'shipped'; XA.save(); XA.toast('商家已发货（演示）', true); XA.refresh(); };
  XA.act.logistics = id => {
    const shipment = XA.state.orders.find(o=>o.id===id)?.logistics;
    if (shipment?.trackNo) return XA.sheet({title:'物流信息',html:`<p>${esc(shipment.company)} · ${esc(shipment.trackNo)}</p><p>商家已发货</p>`});
    return XA.sheet({
    title: '物流信息',
    html: `<div class="muted small">顺丰速运 · SF1088 2046 7731</div>
      <div class="timeline mt12">
        <div class="tl on"><b>运输中</b><span>快件已到达【杭州西湖集散点】，正在派送途中</span><em>今天 08:26</em></div>
        <div class="tl"><b>已揽收</b><span>顺丰速运已收取快件</span><em>昨天 17:40</em></div>
        <div class="tl"><b>已发货</b><span>商家已发货，等待快递揽收</span><em>昨天 15:02</em></div>
      </div>`,
  });
  };
  XA.act.rebuy = (id) => { const o = XA.state.orders.find((x) => x.id === id); XA.go(`product?id=${o.items[0].pid}&source=order`); };
  const orderBtns = (o, big) => {
    const c = big ? 'btn' : 'btn btn-sm';
    if (o.status === 'unpaid') return `<button class="${c} btn-primary" onclick="XA.act.resumePay('${o.id}')">继续付款</button>`;
    if (o.status === 'refunding') return '<span>等待退款审核</span>';
    if (o.status === 'grouping') return `<button class="${c} btn-warm" data-go="group?id=${o.group}">邀请好友参团</button>`;
    if (o.status === 'toship') return `<button class="${c} btn-outline" data-go="refund?id=${o.id}">申请退款</button>`;
    if (o.status === 'shipped') return `<button class="${c} btn-outline" data-go="refund?id=${o.id}">申请退款</button><button class="${c} btn-outline" onclick="XA.act.logistics('${o.id}')">查看物流</button><button class="${c} btn-primary" onclick="XA.act.confirmReceive('${o.id}')">确认收货</button>`;
    return `<button class="${c} btn-outline" onclick="XA.act.rebuy('${o.id}')">再次购买</button>`;
  };
  /* 我的订单：按来源分三类
   * 线上订单   = 晓艾小程序内成交（商品 / 课程 / 会籍）
   * 线下订单   = 门店消费（到店服务核销、美团/抖音团购券核销、门店购买）
   * 第三方订单 = 京东、淘宝、小店等第三方电商平台的订单，扫包裹内积分码补登后出现在这里
   */
  const OT = { online: '线上', offline: '线下', third: '第三方' };
  const otag = (type) => `<span class="ot ot-${type}">${OT[type]}</span>`;
  const chTag = (c) => `<span class="ch ch-${D.chClass(c)}">${c}</span>`;
  const simpleRow = (art, title, sub) => `<div class="oitem">${ui.art(art, 'oitem-img')}<div class="grow"><div class="fcard-title">${esc(title)}</div><div class="faint small">${sub}</div></div></div>`;
  /* 汇总三类订单，按时间倒序 */
  XA.allOrders = () => {
    const s = XA.state, list = [];
    s.orders.forEach((o) => list.push({ type: 'online', t: new Date(o.at).getTime(), o }));
    s.appts.filter((a) => a.status === 'done').forEach((a) => list.push({ type: 'offline', t: new Date(a.doneAt || a.at).getTime(), a }));
    D.offlineOrders.forEach((f) => list.push({ type: 'offline', t: XA.d.add(f.day).getTime(), f }));
    s.claim.pending.forEach((pd) => list.push({ type: 'third', t: new Date(pd.at).getTime(), pd }));
    s.claim.claimed.forEach((id) => { const e = D.pointCard(id); if (e) list.push({ type: 'third', t: XA.d.add(e.day).getTime(), e }); });
    return list.sort((a, b) => b.t - a.t);
  };
  const onlineCard = (o) => {
    if (o.kind === 'course' || o.kind === 'membership' || o.kind === 'plus') {
      const V = { course: [`course?id=${o.ref}`, '课程订阅', '去学习'], membership: ['membership', '晓艾家会籍', '查看会籍'], plus: ['plus', '晓艾会 Plus', '查看 Plus'] }[o.kind];
      return `<div class="sec card order" data-go="${V[0]}">
        <div class="row between"><span class="row gap6">${otag('online')}<span class="faint small">${V[1]}</span></span><span class="st st-done">已生效</span></div>
        ${simpleRow(o.art, o.title, '虚拟商品 · 购买后立即生效，无需发货')}
        <div class="right muted small">${o.status==='unpaid'?'待付':'实付'} <b class="c-text">¥${XA.money(o.amount)}</b></div>
        <div class="order-btns"><span class="btn btn-sm btn-outline">${V[2]}</span></div>
      </div>`;
    }
    return `<div class="sec card order">
      <div class="row between" data-go="order?id=${o.id}"><span class="row gap6">${otag('online')}<span class="faint small">晓艾小程序</span></span><span class="st st-${o.status}">${ST[o.status][0]}</span></div>
      <div data-go="order?id=${o.id}">${o.items.map(itemRow).join('')}</div>
      <div class="right muted small">共 ${o.items.reduce((a, i) => a + i.qty, 0)} 件　${o.status==='unpaid'?'待付':'实付'} <b class="c-text">¥${XA.money(o.amount)}</b></div>
      <div class="order-btns">${orderBtns(o)}</div>
    </div>`;
  };
  const offlineCard = (x) => {
    if (x.a) {
      const a = x.a, s = D.storeOf(a.storeId), sv = D.service(a.serviceId);
      return `<div class="sec card order" data-go="appt?id=${a.id}">
        <div class="row between"><span class="row gap6">${otag('offline')}<span class="faint small ell">${s.name}</span></span><span class="st st-done">已完成</span></div>
        ${simpleRow(sv.art, `${sv.name} ${sv.dur} 分钟`, `到店服务 · ${XA.d.nice(a.date)} ${a.time}`)}
        <div class="right muted small">${a.gp ? chTag(a.gp.channel) + ' 团购券核销　' : ''}积分 +50　${a.gp ? '团购价' : '实付'} <b class="c-text">¥${XA.money(a.price)}</b></div>
        <div class="order-btns"><button class="btn btn-sm btn-outline" data-go="booking?store=${a.storeId}&service=${a.serviceId}">再约一次</button></div>
      </div>`;
    }
    const f = x.f, s = D.storeOf(f.store);
    return `<div class="sec card order" onclick="XA.act.offlineDetail('${f.id}')">
      <div class="row between"><span class="row gap6">${otag('offline')}<span class="faint small ell">${s.name}</span></span><span class="st st-done">已完成</span></div>
      ${simpleRow(f.art, f.title, `${f.kind === 'service' ? '到店服务' : '门店购买'} · ${XA.d.ymd(XA.d.add(f.day))}`)}
      <div class="right muted small">${f.gp ? chTag(f.gp) + ' 团购券核销　' : ''}积分 +${f.points}　${f.gp ? '团购价' : '实付'} <b class="c-text">¥${XA.money(f.amount)}</b></div>
      <div class="order-btns">${f.kind === 'service' ? `<button class="btn btn-sm btn-outline" data-go="booking?store=${f.store}&service=${f.service}">再约一次</button>` : `<button class="btn btn-sm btn-outline" data-go="product?id=p1&source=order">线上再买</button>`}</div>
    </div>`;
  };
  const thirdCard = (x) => {
    if (x.pd) {
      const pd = x.pd;
      return `<div class="sec card order">
        <div class="row between"><span class="row gap6">${otag('third')}${chTag(pd.channel)}</span><span class="st st-toship">审核中</span></div>
        <div class="bold mt8">订单号 ${esc(pd.order)}</div>
        <div class="faint small">${XA.d.full(pd.at)} 提交 · 预计 1～2 个工作日内审核，通过后积分自动到账</div>
      </div>`;
    }
    const e = x.e;
    return `<div class="sec card order">
      <div class="row between"><span class="row gap6">${otag('third')}${chTag(e.channel)}<span class="faint small ell">${e.shop}</span></span><span class="st st-done">已补登</span></div>
      ${simpleRow(e.art, e.title, `${XA.d.ymd(XA.d.add(e.day))}下单 · 订单号 ${D.maskCode(e.order)}`)}
      <div class="right muted small">积分 +${e.points}　实付 <b class="c-text">¥${XA.money(e.amount)}</b></div>
      <div class="faint small mt8">物流与售后请在${e.channel}内处理</div>
    </div>`;
  };
  XA.act.offlineDetail = (id) => {
    const f = D.offlineOrders.find((x) => x.id === id), s = D.storeOf(f.store);
    XA.sheet({
      title: '线下订单详情',
      html: `<div class="kv"><b>消费门店</b><span>${s.name}</span></div>
        <div class="kv"><b>消费内容</b><span>${f.title}<br><span class="muted small">${f.sub}</span></span></div>
        <div class="kv"><b>消费时间</b><span>${XA.d.ymd(XA.d.add(f.day))}</span></div>
        <div class="kv"><b>支付方式</b><span>${f.pay}</span></div>
        <div class="kv"><b>${f.gp ? '团购价' : '实付金额'}</b><span class="bold">¥${XA.money(f.amount)}</span></div>
        <div class="kv"><b>获得积分</b><span class="c-primary bold">+${f.points}</span></div>
        <div class="kv"><b>订单编号</b><span class="muted">${f.id}</span></div>
        <div class="faint small mt8">线下订单由门店收银或核销后自动同步，积分自动到账。如有疑问请联系门店。</div>
        <button class="btn btn-tonal btn-block mt16" onclick="XA.closeSheet();XA.act.call('${f.store}')">联系门店</button>`,
    });
  };
  XA.page('orders', {
    title: '我的订单',
    render(q) {
      const type = q.type || 'all', st = q.st || 'all';
      const types = [['all', '全部'], ['online', '线上订单'], ['offline', '线下订单'], ['third', '第三方订单']];
      const sts = [['all', '全部'], ['unpaid','待付款'], ['toship', '待发货'], ['shipped', '待收货'], ['done', '已完成'], ['refunding','退款审核中'], ['refunded', '已退款']];
      let list = XA.allOrders().filter((x) => type === 'all' || x.type === type);
      if (type === 'online' && st !== 'all') list = list.filter((x) => x.o.status === st);
      const hint = { all: '', online: '在晓艾小程序里购买的商品、课程和会籍', offline: '在门店的到店服务、团购券核销和门店购买', third: '在京东、淘宝、小店等第三方电商平台购买的订单' }[type];
      const cards = list.map((x) => (x.type === 'online' ? onlineCard(x.o) : x.type === 'offline' ? offlineCard(x) : thirdCard(x))).join('');
      /* 第三方订单：扫包裹里的积分码补登后才会出现 */
      const scanCard = `<div class="sec card group scan-entry"><span class="group-ic">${icon('scan')}</span><div class="grow"><div class="bold">扫积分码，补登订单</div><div class="muted small">包裹里有一张积分卡，扫上面的二维码，积分马上到账</div></div><button class="btn btn-primary btn-sm" onclick="XA.act.scanPoints()">扫码</button></div>`;
      return `<div class="tabs">${types.map((t) => `<button class="${t[0] === type ? 'on' : ''}" onclick="XA.go('orders?type=${t[0]}',true)">${t[1]}</button>`).join('')}</div>
      ${hint ? `<div class="result-line">${hint}</div>` : ''}
      ${type === 'online' ? `<div class="chips pad mt12">${sts.map((t) => `<button class="chip ${t[0] === st ? 'on' : ''}" onclick="XA.go('orders?type=online&st=${t[0]}',true)">${t[1]}</button>`).join('')}</div>` : ''}
      ${type === 'third' ? scanCard : ''}
      ${cards}
      ${!cards ? (type === 'third' ? `<div class="sec card center muted">您还没有补登过第三方订单</div>` : ui.empty('您还没有相关订单', type === 'offline' ? '找附近的门店' : '去首页看看好物', type === 'offline' ? 'store' : 'home')) : ''}
      ${type === 'third' ? `<div class="sec"><button class="btn btn-tonal btn-block" onclick="XA.act.claimManual()">没有积分卡？用订单号补登</button></div>` : ''}
      ${cards ? `<div class="end">没有更多订单了</div>` : ''}`;
    },
  });
  XA.page('order', {
    title: '订单详情',
    render(q) {
      const o = XA.state.orders.find((x) => x.id === q.id);
      if (!o) return ui.empty('订单不存在', '返回首页', 'home');
      return `<div class="status-hd st-${o.status}"><h1>${ST[o.status][0]}</h1><div>${ST[o.status][1]}</div></div>
      ${o.refund ? `${ui.sec('退款进度')}<div class="sec card">退款金额 ¥${XA.money(o.refund.amount)} · ${esc(({pending:'待审核',approved:'已通过',rejected:'已驳回'})[o.refund.status])}<div>${esc(o.refund.auditNotes || o.refund.reason)}</div></div>` : ''}
      ${typeof ui.redpackEntry === 'function' ? ui.redpackEntry(o) : ''}
      ${o.status === 'shipped' ? `${ui.sec('物流信息')}<div class="sec card addr" onclick="XA.act.logistics('${o.id}')"><span class="addr-ic">${icon('nav')}</span><div class="grow"><div class="bold">运输中</div><div class="muted small">${esc(o.logistics?.company || "商家已发货")} ${esc(o.logistics?.trackNo || "")}</div></div>${icon('right', 'faint')}</div>` : ''}
      ${o.status === 'grouping' && o.group ? `<div class="sec card group" data-go="group?id=${o.group}"><span class="group-ic warm">${icon('users')}</span><div class="grow"><div class="bold">拼团进行中</div><div class="muted small">邀请好友参团，成团后为您发货</div></div><span class="btn btn-sm btn-warm">去邀请</span></div>` : ''}
      ${ui.sec('收货信息')}
      <div class="sec card addr"><span class="addr-ic">${icon('pin')}</span><div class="grow">${addressText(o.buyer || ADDRESS)}</div></div>
      ${ui.sec('商品清单')}
      <div class="sec card">${o.items.map(itemRow).join('')}</div>
      ${ui.sec('费用明细')}
      <div class="cells sec">
        <div class="cell"><div class="cell-bd">商品金额</div><span>¥${XA.money(o.goods)}</span></div>
        <div class="cell"><div class="cell-bd">运费</div><span>${o.freight ? '¥' + o.freight : '包邮'}</span></div>
        ${o.off ? `<div class="cell"><div class="cell-bd">优惠券</div><span class="c-price">-¥${o.off}</span></div>` : ''}
        <div class="cell"><div class="cell-bd bold">${o.status==="unpaid"?"待付金额":"实付金额"}</div><span class="bold">¥${XA.money(o.amount)}</span></div>
        <div class="cell"><div class="cell-bd">获得积分</div><span class="muted">${o.status === 'refunded' ? '已扣回' : o.status==='unpaid' ? '付款后获得' : '+' + o.points}</span></div>
      </div>
      ${ui.sec('订单信息')}
      <div class="cells sec">
        <div class="cell"><div class="cell-bd">订单类型</div><span class="muted">线上订单 · 晓艾小程序</span></div>
        <div class="cell"><div class="cell-bd">订单编号</div><span class="muted">${o.id}</span></div>
        <div class="cell"><div class="cell-bd">下单时间</div><span class="muted">${XA.d.full(o.at)}</span></div>
      </div>
      <div class="sec demo-box"><b>演示说明</b>
        <div>来源归因 source=${o.source}（${SRC[o.source] || o.source}），计入对应渠道 GMV。</div>
        ${!o.shared && o.status === 'toship' ? `<button class="btn btn-sm btn-outline mt8" onclick="XA.act.demoShip('${o.id}')">模拟商家发货</button>` : ''}
      </div>`;
    },
    footer(q) {
      const o = XA.state.orders.find((x) => x.id === q.id);
      return o ? `<div class="grow"></div>${orderBtns(o)}` : '';
    },
  });

  /* ---------- 售后：仅退款（P0） ---------- */
  const REASONS = ['不想要了', '拍错了 / 多拍了', '发货太慢', '其他原因'];
  XA.act.refundReason = (i) => { XA.tmp.refundReason = i; XA.refresh(); };
  XA.act.refundSubmit = (id) => {
    if (XA.tmp.refundReason == null) return XA.toast('请选择退款原因');
    const o = XA.state.orders.find((x) => x.id === id);
    XA.modal({
      title: '确认申请退款？', content: `退款 ¥${XA.money(o.amount)} 将在审核通过后退回模拟支付账户，本单获得的 ${o.points} 积分会同步扣回。`, confirmText: '确认退款',
      onConfirm: () => {
        if (o.shared) {
          if (!XA.changeTrade({action:'request',id,reason:REASONS[XA.tmp.refundReason]})) return;
          XA.tmp.refundReason=null; XA.toast('退款申请已提交',true);return XA.go('order?id='+id,true);
        }
        o.status = 'refunded';
        XA.addPoints(-o.points, '订单退款扣回积分', -(o.growth != null ? o.growth : o.points));
        XA.tmp.refundReason = null;
        XA.toast('退款成功，款项原路退回', true);
        XA.go('order?id=' + id, true);
      },
    });
  };
  XA.page('refund', {
    title: '申请退款',
    render(q) {
      const o = XA.state.orders.find((x) => x.id === q.id);
      if (!o) return ui.empty('订单不存在', '返回首页', 'home');
      const r = XA.tmp.refundReason;
      return `<div class="sec card">${o.items.map(itemRow).join('')}</div>
      ${ui.sec('退款原因')}
      <div class="sec radios card">${REASONS.map((t, i) => `<button class="radio ${r === i ? 'on' : ''}" onclick="XA.act.refundReason(${i})"><span>${t}</span><span class="check ${r === i ? 'on' : ''}">${icon('check')}</span></button>`).join('')}</div>
      <div class="cells sec">
        <div class="cell"><div class="cell-bd">退款方式</div><span class="muted">仅退款（无需退货）</span></div>
        <div class="cell"><div class="cell-bd">退款金额</div><span class="c-price bold">¥${XA.money(o.amount)}</span></div>
        <div class="cell"><div class="cell-bd">退回至</div><span class="muted">模拟支付账户</span></div>
      </div>
      <div class="center faint small mt12">已收到货需要退货？请联系客服处理</div>`;
    },
    footer(q) { return `<button class="btn btn-primary btn-block" onclick="XA.act.refundSubmit('${q.id}')">提交申请</button>`; },
  });
})();
