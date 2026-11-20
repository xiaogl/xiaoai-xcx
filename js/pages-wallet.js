/* pages-wallet.js —— 卡包：晓艾会主卡 + 门店会员卡（会籍卡 / 权益卡）
 * 卡片按"会员卡"的样子设计，多张卡像 iOS 钱包那样叠放：只露出卡头，点一张展开，其余收到下方。
 * Plus 或高等级会员可按身份免费匹配领取门店的对应会员卡，领取后放入卡包。
 */
(function () {
  const D = XA.data, icon = XA.icon, ui = XA.ui, esc = XA.esc;

  const cardNo = (id) => String(XA.hash('card-' + id) % 100000000).padStart(8, '0').replace(/(\d{4})(\d{4})/, '$1 $2');
  const brandOf = (x) => (x.storeId ? D.storeOf(x.storeId).name : D.storeBrands[x.brand].name);
  const scopeOf = (x) => (x.storeId ? `仅限 ${D.storeOf(x.storeId).name}` : `全国${D.storeBrands[x.brand].name}门店通用`);
  const storeFor = (x) => (x.storeId ? D.storeOf(x.storeId) : D.nearest(x.brand));
  const canGet = () => D.storePerks.filter((x) => !XA.hasPerk(x.id) && D.perkVia(x)).length;
  XA.perkCanGet = canGet;

  /* 卡包里的全部卡片：晓艾会主卡 + 已购买的晓艾家会籍 + 已领取的门店会员卡 */
  XA.walletCards = () => {
    const s = XA.state;
    if (!s.loggedIn) return [];
    const lv = XA.level(), plus = XA.isPlus();
    const list = [{ id: 'xa', tone: 'xa', mark: '艾', brand: '晓艾会', kind: '积分会员', name: lv.name, valid: '长期有效' }];
    if (s.membership) list.push({ id: 'mb', tone: 'mb', mark: '家', brand: '晓艾家', kind: '付费会籍', name: `晓艾家 · ${s.membership.name}`, valid: `至 ${s.membership.expire}` });
    D.storePerks.filter((x) => XA.hasPerk(x.id)).forEach((x) => {
      const via = D.perkVia(x);
      list.push({ id: x.id, perk: x, tone: x.tone, mark: x.mark, brand: brandOf(x), kind: x.kind, name: x.name, valid: via === 'plus' ? `随 Plus · 至 ${s.plus.expire}` : `${lv.short}期间有效` });
    });
    return list;
  };

  /* 卡面 */
  ui.cardFace = (c, cls, attrs) => `<div class="wc wc-${c.tone} ${cls || ''}" ${attrs || ''}>
      <div class="wc-hd"><span class="wc-logo">${c.mark}</span><b class="grow ell">${c.brand}</b><span class="wc-kind">${c.kind}</span></div>
      <div class="wc-name">${c.name}</div>
      <div class="wc-ft"><span>${c.sub || `${esc(XA.state.user.name)}　No. ${cardNo(c.id)}`}</span><span>${c.valid || ''}</span></div>
    </div>`;
  /* 小卡面（可领取列表） */
  ui.cardMini = (x, cls, attrs) => ui.cardFace({ id: x.id, tone: x.tone, mark: x.mark, brand: brandOf(x), kind: x.kind, name: x.name, sub: `<span class="ell">${x.items.slice(0, 2).join(' · ')}</span>` }, 'mini ' + (cls || ''), attrs);
  /* "我的"页里的卡包缩略：只露出卡头的一叠 */
  ui.walletPeek = () => {
    const cards = XA.walletCards(), can = canGet();
    return `<div class="sec card" data-go="perks">
      <div class="row between"><span class="bold">卡包</span><span class="more">${cards.length} 张会员卡${can ? `<b class="c-price">　${can} 张可领</b>` : ''}${icon('right', 'ic-s')}</span></div>
      <div class="wpeek">${cards.slice(-3).map((c) => `<div class="wpeek-c wc-${c.tone}"><span class="wc-logo">${c.mark}</span><b class="grow ell">${c.id === 'xa' ? `晓艾会 · ${c.name}` : c.name}</b><span class="wc-kind">${c.kind}</span></div>`).join('')}</div>
    </div>`;
  };

  /* ---------- 领取：按身份匹配 ---------- */
  XA.act.perkGet = (id) => XA.needLogin(() => {
    const x = D.storePerks.find((k) => k.id === id), via = D.perkVia(x);
    if (!via) {
      const gap = x.lv ? XA.LEVELS[x.lv - 1].min - XA.state.user.growth : 0;
      const need = XA.levelOf(x.lv).short;
      return XA.modal({
        title: '还不能领取',
        content: `升到${need}后您即可领取，还差 ${gap} 成长值。`,
        confirmText: '查看积分会员', cancelText: '知道了', onConfirm: () => XA.go('xahui'),
      });
    }
    const ps = XA.state.perks;
    XA.state.perks = ps.filter((k) => k.id !== id).concat({ id, via, at: XA.d.key(new Date()) });
    XA.save();
    XA.toast('已放入您的卡包，到店出示会员码即可使用', true);
    const cur = XA.current();
    if (cur && cur.name === 'perks') { XA.refresh(); XA.act.wPick(id, true); } else XA.refresh();
  });

  /* ---------- 叠放布局（仿 iOS 钱包） ---------- */
  const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 17;
  const wLayout = (instant) => {
    const box = XA.$('#wallet');
    if (!box) return;
    const cards = XA.$$('.wc', box), n = cards.length, sel = XA.tmp.wsel;
    if (!n) return;
    if (instant) box.classList.add('no-anim');
    const H = cards[0].offsetHeight, OFF = Math.round(rem() * 3.5), EDGE = Math.round(rem() * 0.6);
    if (!sel || !cards.some((c) => c.dataset.id === sel)) {
      /* 叠放：每张露出卡头，最后一张完整露出 */
      cards.forEach((c, i) => { c.style.transform = `translateY(${i * OFF}px)`; c.style.zIndex = i + 1; c.classList.remove('sel', 'piled'); });
      box.style.height = H + (n - 1) * OFF + 'px';
    } else {
      /* 展开一张：选中的卡移到最上面，其余收成一叠压在下方 */
      let k = 0;
      cards.forEach((c) => {
        if (c.dataset.id === sel) { c.style.transform = 'translateY(0)'; c.style.zIndex = 1; c.classList.add('sel'); c.classList.remove('piled'); }
        else { c.style.transform = `translateY(${H + 12 + k * EDGE}px)`; c.style.zIndex = 2 + k; c.classList.add('piled'); c.classList.remove('sel'); k++; }
      });
      box.style.height = (n > 1 ? H + 12 + (n - 2) * EDGE + Math.round(rem() * 2.6) : H) + 'px';
    }
    if (instant) { void box.offsetHeight; box.classList.remove('no-anim'); }
  };

  const R = () => icon('right', 'faint');
  const detailHtml = (c) => {
    const s = XA.state, lv = XA.level(), plus = XA.isPlus();
    const back = `<div class="sec"><button class="btn btn-ghost btn-block" onclick="XA.act.wPick('')">${icon('left', 'ic-s')}返回全部卡片</button></div>`;
    if (c.id === 'xa') {
      return `<div class="cells sec">
          <div class="cell" data-go="xahui"><span class="cell-label">成长</span><div class="cell-bd bold ell">${lv.name}</div><span class="faint small ell">成长值 ${s.user.growth}</span>${R()}</div>
          <div class="cell" data-go="points"><span class="cell-label">积分</span><div class="cell-bd bold">${s.points}</div>${R()}</div>
        </div>
        <div class="sec tipbox">${icon('info')}<span>晓艾会主卡是您在所有认证门店的通用身份；门店会员卡都挂在这张卡下面，一个会员码全部识别。</span></div>
        <div class="sec"><button class="btn btn-primary btn-block" data-go="member-code">${icon('qr')}出示会员码</button></div>${back}`;
    }
    if (c.id === 'mb') {
      const plan = D.plans.find((p) => p.id === s.membership.plan) || D.plans[0];
      return `<div class="sec card"><div class="bold">卡片权益</div><ul class="ppoints">${plan.perks.map((t) => `<li>${icon('check', 'ic-s')}<span>${t}</span></li>`).join('')}</ul></div>
        <div class="cells sec">
          <div class="cell"><span class="cell-label">适用门店</span><div class="cell-bd">全国晓艾家门店通用</div></div>
          <div class="cell"><span class="cell-label">有效期</span><div class="cell-bd">至 ${s.membership.expire}</div></div>
          <div class="cell"><span class="cell-label">来源</span><div class="cell-bd">历史会籍 · ${plan.name}</div></div>
        </div>
        <div class="sec row gap12"><button class="btn btn-primary grow" data-go="member-code">${icon('qr', 'ic-s')}出示会员码</button><button class="btn btn-tonal grow" data-go="store-detail?id=${D.nearest('xaj').id}">查看门店</button></div>${back}`;
    }
    const x = c.perk, via = D.perkVia(x), st = storeFor(x);
    return `<div class="sec card"><div class="bold">卡片权益</div><ul class="ppoints">${x.items.map((t) => `<li>${icon('check', 'ic-s')}<span>${t}</span></li>`).join('')}</ul></div>
      <div class="cells sec">
        <div class="cell" ${st ? `data-go="store-detail?id=${st.id}"` : ''}><span class="cell-label">适用门店</span><div class="cell-bd">${scopeOf(x)}</div>${st ? `<span class="faint small">${st.km != null ? '最近 ' + D.kmText(st) : '查看'}</span>${R()}` : ''}</div>
        <div class="cell"><span class="cell-label">有效期</span><div class="cell-bd">${c.valid}</div></div>
        <div class="cell"><span class="cell-label">领取方式</span><div class="cell-bd">${via === 'plus' ? '凭 Plus 领取' : `凭${lv.short}领取`}</div></div>
      </div>
      <div class="sec row gap12"><button class="btn btn-primary grow" data-go="member-code">${icon('qr', 'ic-s')}到店出示会员码</button>${st ? `<button class="btn btn-tonal grow" data-go="store-detail?id=${st.id}">查看门店</button>` : ''}</div>
      <div class="sec faint small center">这张卡由${brandOf(x)}提供，无需另外办卡；到店报手机号或出示会员码即可识别</div>${back}`;
  };
  const paintDetail = () => {
    const page = XA.$('#wpage'), box = XA.$('#wdetail');
    if (!page || !box) return;
    const c = XA.walletCards().find((k) => k.id === XA.tmp.wsel);
    page.classList.toggle('has-sel', !!c);
    box.innerHTML = c ? detailHtml(c) : '';
  };
  /* 点卡片：叠放时展开这张；已展开时再点（或点下方那一叠）收回 */
  XA.act.wPick = (id, force) => {
    const el = id && XA.$(`#wallet .wc[data-id="${id}"]`);
    XA.tmp.wsel = force ? id : !id || XA.tmp.wsel === id || (el && el.classList.contains('piled')) ? '' : id;
    paintDetail();
    wLayout();
    const v = XA.$('#view');
    if (XA.tmp.wsel && v.scrollTo) v.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCard = (x) => {
    const via = D.perkVia(x);
    return `<div class="wget">
      ${ui.cardMini(x, via ? '' : 'lock')}
      <div class="wget-ft"><span class="grow small ${via ? 'c-primary bold' : 'muted'}">${via ? '' : icon('lock', 'ic-xs') + ' '}${D.perkNeed(x)}${via ? ' · 您已满足' : ''}</span><button class="btn btn-sm ${via ? 'btn-primary' : 'btn-outline'}" onclick="XA.act.perkGet('${x.id}')">${via ? '免费领取' : '去解锁'}</button></div>
    </div>`;
  };

  XA.page('perks', {
    title: '卡包',
    render() {
      const s = XA.state;
      if (!s.loggedIn) return `<div class="empty">${XA.art('leaf', 'sage', 'empty-art')}<div class="empty-t">登录后查看您的会员卡</div><button class="btn btn-primary mt16" onclick="XA.login()">微信手机号快捷登录</button></div>`;
      const cards = XA.walletCards(), rest = D.storePerks.filter((x) => !XA.hasPerk(x.id)), lv = XA.level(), plus = XA.isPlus();
      return `<div id="wpage">
        <div class="w-hd"><div class="grow"><b>${cards.length} 张会员卡</b><span class="ell">到店出示会员码，一码识别</span></div><button class="btn btn-tonal btn-sm" data-go="member-code">${icon('qr', 'ic-s')}会员码</button></div>
        <div class="wallet" id="wallet">${cards.map((c) => ui.cardFace(c, '', `data-id="${c.id}" onclick="XA.act.wPick('${c.id}')"`)).join('')}</div>
        <div class="w-tip">${cards.length > 1 ? '点一张卡片，查看权益和使用方式' : '点卡片查看详情'}</div>
        <div id="wdetail"></div>
        <div class="wrest">
          ${rest.length ? `${ui.sec('可领取的门店会员卡')}
          <div class="sec row gap6" style="margin-top:-4px;flex-wrap:nowrap"><span class="faint small ell">身份</span><span class="tag tag-gold">积分会员</span></div>
          <div class="sec">${rest.map(getCard).join('')}</div>` : ''}
          ${ui.sec('领卡说明')}
          <div class="sec card"><ul class="policy">
            <li>门店会员卡由门店提供，晓艾会按 Plus 或成长等级匹配档位，免费领取</li>
            <li>领取后到店出示会员码即可识别，无需另外办卡</li>
            <li>凭 Plus 领取的卡随 Plus 有效；凭成长等级领取的卡在保有该等级期间有效</li>
            <li>更多门店陆续加入，可领取的会员卡会持续增加</li>
          </ul></div>
          <div class="end">可领取的门店与权益为示例，以正式运营规则为准</div>
        </div>
      </div>`;
    },
    mounted(q) {
      XA.tmp.wsel = '';
      paintDetail();
      wLayout(true);
      if (q.card && XA.walletCards().some((c) => c.id === q.card)) setTimeout(() => XA.act.wPick(q.card, true), 30);
    },
  });
})();
