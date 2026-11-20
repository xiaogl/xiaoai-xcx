/* pages-growth.js —— 用户增长 · 营销裂变体系（演示）
 * 拉新：邀请有礼（双向奖励 + 阶梯奖励）
 * 转化：新人礼包（被邀请好友的落地页）、拼团
 * 传播：下单红包；商品 / 内容 / 拼团的每一次分享都带邀请码
 * 沉淀：企微社群、晓艾会
 * 合伙：推广员（现金佣金，见 pages-me.js 推广中心）
 * 合规：所有奖励只对"直接邀请关系"发放（单层），按有效行为计，不做多级计酬
 */
(function () {
  const D = XA.data, icon = XA.icon, ui = XA.ui, esc = XA.esc;
  const IV = D.invite, CODE = 'XA8866';
  const inv = () => XA.state.invite;
  const okCount = () => inv().records.filter((r) => r.stage === 'first').length;
  const mask = (n) => String(n).slice(0, 1) + '**';
  const who = (n) => (n === XA.state.user.name ? '我' : mask(n));
  const giveCoupon = (c, days) => XA.state.coupons.unshift(Object.assign({ id: XA.uid('c'), used: false, expire: XA.d.key(XA.d.add(days || 30)) }, c));
  const nextName = (used) => D.inviteNames.find((n) => !used.includes(n)) || '新朋友';
  const invPoints = () => inv().records.reduce((a, r) => a + IV.join + (r.stage === 'first' ? IV.first.pts : 0), 0);

  /* ================= 分享面板：所有分享都带邀请码，好友由此进入即与分享人绑定（首触归因） ================= */
  const shareSheet = (opt) => XA.sheet({
    title: opt.title || '邀请好友',
    html: `<div class="sh-card"><span class="logo-dot">艾</span><div class="grow"><div class="bold">${opt.card}</div><div class="muted small">${opt.sub}</div></div></div>
      <div class="share-grid">
        <button onclick="XA.act.shareDone('已发给微信好友（演示）')"><span class="share-ic wx">${icon('share')}</span>微信好友</button>
        <button onclick="XA.act.shareDone('已发到微信群（演示）')"><span class="share-ic pyq">${icon('users')}</span>微信群</button>
        <button onclick="XA.act.invitePoster()"><span class="share-ic">${icon('image')}</span>生成海报</button>
        <button onclick="XA.act.inviteFace()"><span class="share-ic">${icon('qr')}</span>面对面</button>
      </div>
      <div class="faint small center">分享带有您的邀请码 ${CODE}，新朋友由此入会后与您绑定 ${IV.bindDays} 天</div>
      ${opt.preview ? `<button class="btn btn-ghost btn-block mt8" data-go="welcome">预览好友看到的页面</button>` : ''}`,
  });
  XA.act.shareDone = (msg) => { XA.closeAll(); XA.toast(msg, true); const f = XA.tmp.afterShare; XA.tmp.afterShare = null; if (f) f(); };
  XA.act.invitePoster = () => {
    XA.closeAll();
    XA.sheet({
      title: '邀请海报',
      html: `<div class="poster">${XA.art('moxa', 'night', 'poster-art')}<div class="poster-bd"><div><div class="bold" style="font-size:1.125rem">${esc(XA.state.user.name)}邀您加入晓艾会</div><div class="muted small">长按识别小程序码，领 ${IV.friendTotal} 元新人礼包</div></div><div class="qr-box sm">${XA.qr('invite-' + CODE)}</div></div></div>
        <div class="row gap12 mt16"><button class="btn btn-tonal grow" onclick="XA.act.shareDone('海报已保存到相册（演示）')">保存海报</button><button class="btn btn-wx grow" onclick="XA.act.shareDone('已发给微信好友（演示）')">发给好友</button></div>
        <div class="faint small center mt8">邀请码 ${CODE} · 好友通过海报入会后与您绑定 ${IV.bindDays} 天</div>`,
    });
  };
  XA.act.inviteFace = () => {
    XA.closeAll();
    XA.sheet({
      title: '面对面邀请',
      html: `<div class="center" style="padding:8px 0 16px"><div class="qr-box">${XA.qr('invite-' + CODE)}</div><div class="bold mt12">请好友用微信扫一扫</div><div class="muted small mt4">在家里、在门店当面邀请最方便，扫码就能领新人礼包</div></div>`,
    });
  };

  /* ================= 邀请有礼（老带新，双向奖励） ================= */
  XA.act.inviteGo = () => XA.needLogin(() => shareSheet({ card: `${esc(XA.state.user.name)}邀您加入晓艾会`, sub: `${IV.friendTotal} 元新人礼包待领取 · 艾灸好物与附近门店`, preview: true }));
  /* 演示：模拟好友的行为（正式版由好友真实操作触发） */
  XA.act.inviteSim = (kind) => XA.needLogin(() => {
    const s = inv();
    if (kind === 'first') {
      const r = s.records.slice().reverse().find((x) => x.stage === 'joined');
      if (!r) return XA.toast('还没有待首单的好友，先模拟一位好友入会');
      r.stage = 'first';
      giveCoupon(IV.first.coupon);
      XA.addPoints(IV.first.pts, `好友首单奖励 · ${mask(r.name)}`, IV.first.pts);
      XA.toast(`${mask(r.name)} 完成首单：+${IV.first.pts} 积分、¥${IV.first.coupon.amount} 券`, true);
    } else {
      const name = nextName(s.records.map((x) => x.name));
      s.records.unshift({ id: XA.uid('iv'), name, stage: 'joined', at: new Date().toISOString() });
      XA.addPoints(IV.join, `邀请好友入会 · ${mask(name)}`, IV.join);
      XA.toast(`${mask(name)} 已入会：+${IV.join} 积分`, true);
    }
    XA.save(); XA.refresh();
  });
  XA.act.inviteTier = (n) => {
    const s = inv(), t = IV.tiers.find((x) => x.n === n), ok = okCount();
    if (s.tiers.includes(n)) return;
    if (ok < n) return XA.toast(`再成功邀请 ${n - ok} 人即可领取`);
    s.tiers.push(n);
    if (t.coupon) giveCoupon(t.coupon, 60);
    if (t.growth) XA.state.user.growth += t.growth;
    XA.save(); XA.toast(t.done, true); XA.refresh();
  };
  const inviteRules = () => `<ul class="policy">
      <li>只奖励<b>您直接邀请</b>的好友；好友再邀请的人与您无关</li>
      <li>好友须是没有注册过晓艾的新用户，通过您的分享、海报或小程序码进入后，与您绑定 ${IV.bindDays} 天</li>
      <li>奖励按有效行为发放：好友入会；好友首单确认收货，或首次到店核销</li>
      <li>同一设备、同一支付账户、已退款的订单不计入；异常邀请的奖励会被冻结</li>
    </ul>`;
  XA.page('invite', {
    title: '邀请有礼',
    render() {
      const s = inv(), ok = okCount(), nx = IV.tiers.find((t) => t.n > ok), prev = IV.tiers.filter((t) => t.n <= ok).pop();
      const base = prev ? prev.n : 0, pct = nx ? Math.round(((ok - base) / (nx.n - base)) * 100) : 100;
      const step = (n, t, d) => `<div class="s3"><em>${n}</em><div><b>${t}</b><span>${d}</span></div></div>`;
      return `
      <div class="iv-hd">
        <div class="iv-k">晓艾会 · 邀请有礼</div>
        <h1>邀请好友，一起领好礼</h1>
        <div class="iv-two">
          <div><span>好友得</span><b>¥${IV.friendTotal}</b><span>新人礼包</span></div>
          <i>+</i>
          <div><span>您得</span><b>${IV.join + IV.first.pts} 积分</b><span>和 ¥${IV.first.coupon.amount} 好物券 / 每位</span></div>
        </div>
        <button class="btn btn-white btn-block" onclick="XA.act.inviteGo()">${icon('share', 'ic-s')}邀请微信好友</button>
        <div class="iv-sub"><button onclick="XA.needLogin(XA.act.invitePoster)">${icon('image', 'ic-s')}生成海报</button><button onclick="XA.needLogin(XA.act.inviteFace)">${icon('qr', 'ic-s')}面对面邀请</button></div>
      </div>
      ${ui.sec('邀请越多，奖励越多')}
      <div class="sec card">
        <div class="row between"><span>已成功邀请 <b class="c-price" style="font-size:1.25rem">${ok}</b> 人</span><span class="faint small">${nx ? `再邀 ${nx.n - ok} 人得「${nx.t}」` : '全部奖励已达成'}</span></div>
        <div class="iv-bar"><i style="width:${pct}%"></i></div>
        ${IV.tiers.map((t) => {
          const got = s.tiers.includes(t.n), reach = ok >= t.n;
          return `<div class="tier ${reach ? 'on' : ''}"><em>${t.n} 人</em><div class="grow"><b>${t.t}</b><span>${got ? '已领取' : reach ? '已达成，可以领取' : `还差 ${t.n - ok} 人`}</span></div>${got ? `<span class="tag tag-green">${icon('check', 'ic-xs')}已领取</span>` : reach ? `<button class="btn btn-sm btn-warm" onclick="XA.act.inviteTier(${t.n})">领取</button>` : ''}</div>`;
        }).join('')}
        <div class="faint small mt8">好友完成首单或首次到店，才算成功邀请 1 人</div>
      </div>
      ${ui.sec(`我的邀请（${s.records.length}）`)}
      ${s.records.length ? `<div class="cells sec">${s.records.map((r) => {
        const first = r.stage === 'first';
        return `<div class="cell">${ui.avatar(r.name)}<div class="cell-bd"><div>${mask(r.name)} <span class="tag ${first ? 'tag-green' : 'tag-orange'}">${first ? '已首单' : '已入会 · 待首单'}</span></div><div class="faint tiny">${XA.d.full(r.at)} 通过您的邀请入会</div></div>
          <div class="right"><div class="bold c-primary">+${IV.join + (first ? IV.first.pts : 0)} 积分</div>${first ? `<div class="tiny c-price">+¥${IV.first.coupon.amount} 券</div>` : `<button class="link tiny" onclick="XA.toast('已通过服务通知提醒 TA（演示）',true)">提醒 TA</button>`}</div></div>`;
      }).join('')}</div>` : `<div class="sec card center muted">还没有邀请记录，先邀请一位好友吧</div>`}
      ${ui.sec('怎么算邀请成功')}
      <div class="sec card">
        ${step(1, '把晓艾分享给好友', '微信好友、微信群、海报、面对面扫码都可以')}
        ${step(2, '好友领新人礼包并入会', `好友得 ${IV.friendTotal} 元新人礼包，您得 ${IV.join} 积分`)}
        ${step(3, '好友首单或首次到店', `您再得 ${IV.first.pts} 积分和 ¥${IV.first.coupon.amount} 好物券，并计入阶梯奖励`)}
      </div>
      ${ui.sec('活动规则')}
      <div class="sec card">${inviteRules()}</div>
      <div class="sec tipbox" data-go="promoter">${icon('megaphone')}<span>想赚现金佣金？申请成为推广员，好友下单您有佣金</span>${icon('right', 'ic-s')}</div>
      <div class="sec demo-box"><b>演示说明</b><div>正式版由好友的真实行为触发。这里可以模拟：</div>
        <div class="row gap8 mt8" style="flex-wrap:wrap"><button class="btn btn-sm btn-outline" onclick="XA.act.inviteSim('join')">模拟一位好友入会</button><button class="btn btn-sm btn-outline" onclick="XA.act.inviteSim('first')">模拟好友完成首单</button></div>
      </div>
      <div class="end">奖励内容与门槛为示例，以正式活动规则为准</div>`;
    },
  });

  /* 被邀请好友看到的落地页（承接：领礼包 → 入会 → 绑定关系） */
  XA.page('welcome', {
    title: '好友邀请',
    render() {
      const s = XA.state, n = s.loggedIn ? s.user.name : '您的好友';
      return `
      <div class="sec demo-box"><b>演示说明</b><div>这是被邀请的好友点开分享后看到的页面。</div></div>
      <div class="wl-hero">${ui.avatar(n, 'xl')}<div class="wl-from">${esc(n)} 邀您加入晓艾会</div><h1>送您 ${IV.friendTotal} 元新人礼包</h1><div class="wl-sub">艾灸养生好物 · 附近门店 · 养生课程</div></div>
      <div class="sec">${IV.friend.map((c) => `<div class="coupon"><div class="coupon-l"><span><small>¥</small>${c.amount}</span><em>满 ${c.min} 可用</em></div><div class="coupon-r"><div class="bold">${c.name}</div><div class="faint small">${c.scope === 'store' ? '认证门店到店付款时使用' : '线上购物可用'} · 领取后 30 天内有效</div></div></div>`).join('')}</div>
      <div class="sec card"><div class="bold">加入晓艾会，还可以</div><ul class="ppoints">
        <li>${icon('check', 'ic-s')}<span>3 分钟测体质，推荐适合自己的养生方法</span></li>
        <li>${icon('check', 'ic-s')}<span>就近找认证门店，新客体验艾灸 ¥99</span></li>
        <li>${icon('check', 'ic-s')}<span>线上线下消费都攒积分，等级越高权益越多</span></li>
      </ul></div>
      <div class="sec faint small center">领取即成为晓艾会会员，并与邀请人建立 ${IV.bindDays} 天的邀请关系</div>`;
    },
    footer() {
      return `<button class="btn btn-wx btn-block" onclick="XA.modal({title:'演示说明',content:'好友点这里，用微信手机号一键入会并领取礼包，同时与邀请人绑定。回到“邀请有礼”，可以模拟好友入会后的效果。',confirmText:'回到邀请有礼',cancelText:'留在这里',onConfirm:function(){XA.go('invite')}})">微信一键领取</button>`;
    },
  });

  /* ================= 拼团（交易裂变）：发起 → 邀请好友参团 → 成团发货；超时未成团自动退款 ================= */
  const GB = D.groupBuys, DAY = 24 * 3600 * 1000;
  const pad = (n) => String(n).padStart(2, '0');
  const hms = (ms) => { const t = Math.max(0, Math.floor(ms / 1000)); return `${pad(Math.floor(t / 3600))}:${pad(Math.floor((t % 3600) / 60))}:${pad(t % 60)}`; };
  const gLeft = (g) => new Date(g.at).getTime() + DAY - Date.now();
  const openList = () => D.openGroups.filter((g) => !XA.state.ogJoined.includes(g.id));
  XA.groupOf = (pid) => GB[pid];
  /* 超时未成团：自动退款 */
  const settle = () => {
    XA.state.groups.forEach((g) => {
      if (g.status !== 'open' || gLeft(g) > 0) return;
      g.status = 'fail';
      const o = XA.state.orders.find((x) => x.id === g.order);
      if (o && o.status === 'grouping') { o.status = 'refunded'; XA.addPoints(-o.points, '拼团未成功，退款扣回积分', -(o.growth || 0)); }
      XA.save();
    });
  };
  XA.act.groupStart = (pid, join) => XA.needLogin(() => {
    const p = D.product(pid), g = GB[pid], og = join && D.openGroups.find((x) => x.id === join);
    const mine = XA.state.groups.find((x) => x.pid === pid && x.status === 'open');
    if (mine && !og) return XA.go('group?id=' + mine.id);
    XA.sheet({
      title: og ? '参加拼团' : '发起拼团',
      html: `<div class="oitem">${ui.art(p.art, 'oitem-img')}<div class="grow"><div class="fcard-title">${esc(p.title)}</div><div class="faint small">${XA.specLabel(p, XA.defaultOpts(p))} · 1 件</div><div class="mt4">${ui.price(g.price)} <span class="tag tag-warm">${g.size} 人拼团价</span> <span class="del faint small">¥${p.price}</span></div></div></div>
        <div class="kv mt8"><b>成团人数</b><span>${g.size} 人成团${og ? `，${mask(og.leader)}的团还差 ${g.size - og.members.length} 人` : '，支付后邀请好友参团'}</span></div>
        <div class="kv"><b>收货地址</b><span>${esc(XA.state.user.name)}　${XA.state.user.phone}<br><span class="muted small">浙江省杭州市西湖区 文三路（演示地址）</span></span></div>
        <div class="kv"><b>拼团说明</b><span class="muted small">24 小时内未成团，自动全额退款；拼团价不与会员价、优惠券叠加；拼团商品包邮</span></div>`,
      footer: `<div class="row gap12"><div class="grow">拼团价 ${ui.price(g.price, 'lg')}</div><button class="btn btn-wx" style="min-width:8.5rem" onclick="XA.act.groupPay('${pid}','${join || ''}')">微信支付</button></div>`,
    });
  });
  XA.act.groupPay = (pid, join) => {
    XA.closeSheet();
    const p = D.product(pid), g = GB[pid], og = join && D.openGroups.find((x) => x.id === join);
    XA.purchase({ title:'拼团 · ' + p.short, quote: () => ({amount:g.price, detail:'拼团专享价 · 已包邮，会员价不叠加'}), success: (_, payment) => {
      const s = XA.state, oid = XA.uid('XA'), gid = XA.uid('G'), now = new Date().toISOString();
      const base = Math.floor(g.price), pts = base * XA.ptsMult(), me = s.user.name;
      const full = !!og && og.members.length + 1 >= g.size;
      s.orders.unshift({ id: oid, ...payment, status: full ? 'toship' : 'grouping', group: gid, items: [{ pid, opts: XA.defaultOpts(p), qty: 1, price: g.price }], goods: g.price, freight: 0, off: 0, amount: g.price, points: pts, growth: base, source: 'group', at: now });
      s.groups.unshift({ id: gid, pid, price: g.price, size: g.size, order: oid, leader: og ? og.leader : me, members: og ? og.members.concat(me) : [me], status: full ? 'done' : 'open', at: now });
      if (og) s.ogJoined.push(og.id);
      XA.addPoints(pts, XA.ptsMult() > 1 ? (XA.isPlus() ? '拼团实付积分（Plus 双倍）' : '拼团实付积分（钻石双倍）') : '拼团实付积分', base);
      XA.toast(full ? '拼团成功' : '开团成功，邀请好友来拼', true);
      XA.go('group?id=' + gid);
    } });
  };
  XA.act.groupShare = (id) => {
    const g = XA.state.groups.find((x) => x.id === id), p = D.product(g.pid);
    shareSheet({ title: '邀请好友参团', card: `我在拼「${p.short}」，还差 ${g.size - g.members.length} 人`, sub: `${g.size} 人拼团价 ¥${g.price}，单买 ¥${p.price}` });
  };
  /* 演示：模拟一位好友参团。好友是新用户时，同时计入邀请有礼 */
  XA.act.groupSim = (id) => {
    const s = XA.state, g = s.groups.find((x) => x.id === id);
    if (!g || g.status !== 'open') return;
    const name = nextName(g.members.concat(inv().records.map((x) => x.name)));
    g.members.push(name);
    inv().records.unshift({ id: XA.uid('iv'), name, stage: 'first', at: new Date().toISOString(), via: 'group' });
    giveCoupon(IV.first.coupon);
    XA.addPoints(IV.join + IV.first.pts, `邀请奖励 · ${mask(name)}（参团新用户）`, IV.join + IV.first.pts);
    if (g.members.length >= g.size) {
      g.status = 'done';
      const o = s.orders.find((x) => x.id === g.order);
      if (o && o.status === 'grouping') o.status = 'toship';
    }
    XA.save();
    XA.toast(`${mask(name)} 已参团${g.status === 'done' ? '，拼团成功' : ''}<br>TA 是新用户，已计入您的邀请`, true);
    XA.refresh();
  };
  const groupRules = () => `<ul class="policy">
      <li>发起或参加拼团都需先支付；人数凑齐即成团，商家按订单发货</li>
      <li>开团后 24 小时内未成团，系统自动全额退款，原路退回</li>
      <li>新老用户都可以参团；参团的好友如果是新用户，同时算作您的成功邀请</li>
      <li>拼团价不与会员价、优惠券叠加，实付金额照常累计积分和成长值</li>
    </ul>`;
  let gTimer = null;
  XA.page('group', {
    title: '拼团详情',
    render(q) {
      settle();
      const s = XA.state, g = s.groups.find((x) => x.id === q.id);
      if (!g) return ui.empty('没有找到这个拼团', '去看看拼团', 'groups');
      const p = D.product(g.pid), need = g.size - g.members.length;
      const seats = Array.from({ length: g.size }, (_, i) => g.members[i]);
      const hd = { open: `<h1>还差 ${need} 人成团</h1><div>剩余 <b id="gLeft" data-id="${g.id}">${hms(gLeft(g))}</b>，超时未成团自动退款</div>`, done: `<h1>拼团成功</h1><div>商家正在备货，48 小时内发出</div>`, fail: `<h1>拼团未成功</h1><div>款项已原路退回微信支付账户</div>` }[g.status];
      return `<div class="status-hd g-${g.status}">${hd}</div>
      <div class="sec card"><div class="oitem" data-go="product?id=${p.id}">${ui.art(p.art, 'oitem-img')}<div class="grow"><div class="fcard-title">${esc(p.title)}</div><div class="mt4">${ui.price(g.price)} <span class="tag tag-warm">${g.size} 人拼团价</span> <span class="del faint small">¥${p.price}</span></div></div></div></div>
      <div class="sec card center">
        <div class="g-seats">${seats.map((m) => (m ? `<div class="g-seat">${ui.avatar(m, 'lg')}${m === g.leader ? '<em>团长</em>' : ''}<span>${who(m)}</span></div>` : `<div class="g-seat empty"><span class="avatar lg">?</span><span>待加入</span></div>`)).join('')}</div>
        ${g.status === 'open' ? `<button class="btn btn-warm btn-block mt16" onclick="XA.act.groupShare('${g.id}')">${icon('share', 'ic-s')}邀请好友参团</button><div class="faint small mt8">好友是新用户时，同时算作您的成功邀请，另有邀请奖励</div>` :
          g.status === 'done' ? `<button class="btn btn-primary btn-block mt16" data-go="order?id=${g.order}">查看订单</button>` :
          `<button class="btn btn-tonal btn-block mt16" onclick="XA.act.groupStart('${g.pid}')">重新发起拼团</button>`}
      </div>
      ${ui.sec('拼团规则')}
      <div class="sec card">${groupRules()}</div>
      ${g.status === 'open' ? `<div class="sec demo-box"><b>演示说明</b><div>正式版由好友点开分享后支付参团。</div><button class="btn btn-sm btn-outline mt8" onclick="XA.act.groupSim('${g.id}')">模拟一位好友参团</button></div>` : ''}`;
    },
    mounted() {
      gTimer = setInterval(() => {
        const el = XA.$('#gLeft');
        if (!el) return;
        const g = XA.state.groups.find((x) => x.id === el.dataset.id);
        if (g) { el.textContent = hms(gLeft(g)); if (gLeft(g) <= 0) XA.refresh(); }
      }, 1000);
    },
    unmount() { clearInterval(gTimer); },
  });
  XA.page('groups', {
    title: '拼团',
    render() {
      settle();
      const s = XA.state, mine = s.groups, open = openList();
      const ST = { open: ['拼团中', 'st-toship'], done: ['已成团', 'st-done'], fail: ['未成团', ''] };
      return `
      <div class="iv-hd gb"><div class="iv-k">晓艾 · 拼团</div><h1>拼着买，更划算</h1><div class="small" style="opacity:.92">2～3 人成团，邀请家人朋友一起拼；24 小时未成团自动退款</div></div>
      ${mine.length ? `${ui.sec('我的拼团')}<div class="sec">${mine.map((g) => {
        const p = D.product(g.pid), need = g.size - g.members.length;
        return `<div class="card g-row" data-go="group?id=${g.id}">${ui.art(p.art, 'oitem-img')}<div class="grow"><div class="row between"><b class="ell">${p.short}</b><span class="st ${ST[g.status][1]}">${ST[g.status][0]}</span></div><div class="muted small">${g.status === 'open' ? `还差 ${need} 人 · 剩余 ${hms(gLeft(g)).slice(0, 5).replace(':', ' 小时 ')} 分` : g.status === 'done' ? `${g.size} 人已成团` : '已自动退款'}</div><div class="row between mt4">${ui.price(g.price)}<span class="btn btn-sm ${g.status === 'open' ? 'btn-warm' : 'btn-outline'}">${g.status === 'open' ? '邀请好友' : '查看'}</span></div></div></div>`;
      }).join('')}</div>` : ''}
      ${open.length ? `${ui.sec('快要成团，直接参团')}<div class="sec">${open.map((og) => {
        const p = D.product(og.pid), g = GB[og.pid];
        return `<div class="card g-row">${ui.avatar(og.leader, 'lg')}<div class="grow"><b>${mask(og.leader)}的团 <span class="tag tag-warm">还差 ${g.size - og.members.length} 人</span></b><div class="muted small ell">${p.short} · 拼团价 ¥${g.price} · 剩 ${og.hours} 小时</div></div><button class="btn btn-sm btn-warm" onclick="XA.act.groupStart('${og.pid}','${og.id}')">去参团</button></div>`;
      }).join('')}</div>` : ''}
      ${ui.sec('拼团好物')}
      <div class="sec">${Object.keys(GB).map((pid) => {
        const p = D.product(pid), g = GB[pid];
        return `<div class="card g-row" data-go="product?id=${pid}&source=group">${ui.art(p.art, 'oitem-img')}<div class="grow"><div class="fcard-title">${esc(p.title)}</div><div class="row gap6 mt4">${ui.price(g.price)}<span class="tag tag-warm">${g.size} 人团</span><span class="del faint small">¥${p.price}</span></div></div><button class="btn btn-sm btn-warm" onclick="event.stopPropagation();XA.act.groupStart('${pid}')">发起拼团</button></div>`;
      }).join('')}</div>
      ${ui.sec('拼团规则')}
      <div class="sec card">${groupRules()}</div>
      <div class="end">拼团商品与价格为示例</div>`;
    },
  });

  /* ================= 下单红包（传播）：每笔商品订单送一组红包，分享给好友领取，自己也得券 ================= */
  const RP = D.redpack;
  const rpOrders = () => XA.state.orders.filter((o) => o.items && o.status !== 'refunded' && o.status !== 'grouping');
  XA.rpOrder = () => rpOrders().find((o) => !(XA.state.redpack[o.id] || {}).done) || null;
  const rpHtml = (oid) => {
    const r = XA.state.redpack[oid] || { n: 0, done: false };
    return `<div class="rp"><div class="small">本单送您</div><b>${RP.count} 个好物红包</b><div class="small">分享给好友，每人最高得 ¥${RP.max} 好物券</div></div>
      <div class="center mt12"><div class="bold">${r.done ? `您的 ¥${RP.coupon.amount} 好物券已到账` : `已有 ${r.n} 位好友领取，再有 ${RP.need - r.n} 位您得 ¥${RP.coupon.amount} 券`}</div>
        <div class="rp-dots">${Array.from({ length: RP.need }, (_, i) => `<i class="${i < r.n ? 'on' : ''}">${i < r.n ? icon('check') : i + 1}</i>`).join('')}</div></div>
      <div class="row gap12 mt12"><button class="btn btn-warm grow" onclick="XA.toast('已发给微信好友（演示）',true)">${icon('share', 'ic-s')}发给好友</button><button class="btn btn-tonal grow" onclick="XA.toast('已发到微信群（演示）',true)">发到微信群</button></div>
      <div class="faint small center mt8">红包带有您的邀请码；领红包的新朋友入会后算作您的邀请</div>
      ${r.done ? '' : `<div class="demo-box mt12"><b>演示说明</b><button class="btn btn-sm btn-outline mt8" onclick="XA.act.redpackSim('${oid}')">模拟一位好友领取</button></div>`}`;
  };
  XA.act.redpack = (oid) => XA.sheet({ title: '下单红包', html: `<div id="rpBody">${rpHtml(oid)}</div>` });
  XA.act.redpackSim = (oid) => {
    const m = XA.state.redpack, r = (m[oid] = m[oid] || { n: 0, done: false });
    if (r.done) return;
    r.n += 1;
    if (r.n >= RP.need) { r.done = true; giveCoupon(RP.coupon); XA.toast(`${RP.need} 位好友已领取，¥${RP.coupon.amount} 券已到账`, true); }
    XA.save();
    const b = XA.$('#rpBody');
    if (b) b.innerHTML = rpHtml(oid);
  };
  /* 订单页 / 支付成功页上的红包入口 */
  ui.redpackEntry = (o) => {
    if (!o || !o.items || o.status === 'refunded' || o.status === 'grouping') return '';
    const r = XA.state.redpack[o.id] || { n: 0, done: false };
    return `<div class="sec card group" onclick="XA.act.redpack('${o.id}')"><span class="group-ic warm">${icon('gift')}</span><div class="grow"><div class="bold">本单送您 ${RP.count} 个红包</div><div class="muted small">${r.done ? '奖励已到账，还可以继续分享给好友' : `分享给好友，${RP.need} 位领取后您得 ¥${RP.coupon.amount} 券`}</div></div><span class="btn btn-sm ${r.done ? 'btn-outline' : 'btn-warm'}">${r.done ? '再分享' : '去分享'}</span></div>`;
  };

  /* ================= 分享有礼（增长裂变总入口） ================= */
  XA.page('growth', {
    title: '分享有礼',
    render() {
      const s = XA.state, iv = inv(), ok = okCount(), nx = IV.tiers.find((t) => t.n > ok);
      const reach = IV.tiers.filter((t) => t.n <= ok && !iv.tiers.includes(t.n)).length;
      const openG = s.groups.filter((g) => g.status === 'open'), rpo = XA.rpOrder();
      const row = (cls, ic, title, desc, sub, btn, attr) => `<div class="sec card group gr-card" ${attr}><span class="group-ic ${cls}">${icon(ic)}</span><div class="grow"><div class="bold">${title}</div><div class="muted small">${desc}</div>${sub ? `<div class="gr-sub">${sub}</div>` : ''}</div><span class="btn btn-sm ${cls === 'warm' ? 'btn-warm' : 'btn-tonal'}">${btn}</span></div>`;
      return `
      <div class="iv-hd">
        <div class="iv-k">晓艾会 · 分享有礼</div>
        <h1>把好东西带给身边人</h1>
        <div class="gr-stats"><div><b>${iv.records.length}</b><span>已邀请好友</span></div><div><b>${ok}</b><span>成功邀请</span></div><div><b>${invPoints()}</b><span>累计得积分</span></div></div>
      </div>
      ${ui.sec('邀请好友')}
      ${row('warm', 'gift', '邀请有礼', `好友得 ${IV.friendTotal} 元新人礼包，您得积分和好物券`, reach ? `有 ${reach} 份阶梯奖励可以领取` : nx ? `再邀 ${nx.n - ok} 人得「${nx.t}」` : '', '去邀请', 'data-go="invite"')}
      ${ui.sec('一起买更划算')}
      ${row('warm', 'users', '拼团', '2～3 人成团，好物低至 ¥' + Math.min.apply(null, Object.keys(GB).map((k) => GB[k].price)), openG.length ? `您有 ${openG.length} 个团正在拼，还差 ${openG[0].size - openG[0].members.length} 人` : '', openG.length ? '去邀请' : '去拼团', `data-go="${openG.length ? 'group?id=' + openG[0].id : 'groups'}"`)}
      ${row('warm', 'ticket', '下单红包', `每笔订单送 ${RP.count} 个红包，分享给好友，您也得券`, rpo ? `最近一单已有 ${(s.redpack[rpo.id] || { n: 0 }).n} / ${RP.need} 位好友领取` : '', rpo ? '去分享' : '去逛逛', rpo ? `onclick="XA.act.redpack('${rpo.id}')"` : 'data-go="home"')}
      ${ui.sec('长期一起做')}
      ${row('', 'headset', '加入养生交流群', '企业微信社群：顾问答疑、群内专享活动', '', '去加入', `onclick="XA.wecom('加入养生交流群')"`)}
      ${row('gold', 'megaphone', '成为推广员', '好友通过您的分享下单，您获得现金佣金', s.promoter.status === 'active' ? `可提现 ¥${XA.money(s.promoter.balance)}` : '需申请开通', '推广中心', 'data-go="promoter"')}
      ${ui.sec('规则说明')}
      <div class="sec card">${inviteRules()}</div>
      <div class="sec demo-box"><b>体系说明（演示）</b>
        <div>拉新：邀请有礼、面对面扫码　→　转化：新人礼包、拼团　→　传播：下单红包、商品与内容分享（都带邀请码）　→　沉淀：企微社群、晓艾会等级　→　合伙：推广员现金佣金。</div>
        <div class="mt8">所有奖励只对直接邀请关系发放（单层），按有效行为计；关系链只用于归因、看板和风控。</div>
      </div>
      <div class="end">活动内容与奖励为示例，以正式运营规则为准</div>`;
    },
  });
})();
