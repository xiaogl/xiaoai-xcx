/* pages-me.js —— 我的 / 晓艾会（成长会员 + Plus）/ 会员码 / 积分 / 优惠券 / 第三方补登 / 推广 / 课程 / 收藏 / 设置 */
(function () {
  const D = XA.data, icon = XA.icon, ui = XA.ui, esc = XA.esc;

  const nextLevel = () => XA.LEVELS.find((l) => l.min > XA.state.user.growth);
  const growthBar = () => {
    const lv = XA.level(), nx = nextLevel(), g = XA.state.user.growth;
    if (!nx) return `<div class="lv-tip ell">已是钻石会员，感谢一路相伴</div>`;
    return `<div class="lv-bar"><i style="width:${Math.round(((g - lv.min) / (nx.min - lv.min)) * 100)}%"></i></div><div class="lv-tip ell">成长值 ${g} · 再攒 ${nx.min - g} 升${nx.short}</div>`;
  };
  const plusBadge = () => (XA.isPlus() ? `<span class="plus-badge">PLUS</span>` : '');

  /* ================= 我的 ================= */
  const careMe = (s) => {
    const cups = s.coupons.filter((c) => !c.used).length;
    const notifyBind = `XA.subscribe(['活动开始提醒','会员活动提醒'],function(ok){XA.toast(ok?'已开启通知':'未开启',ok)})`;
    return `
      <div class="me-hd care-me">
        <div class="care-banner">${icon('users', 'ic-s')}<span class="grow ell">长辈模式 · 常用入口</span><button class="link" onclick="XA.setCare(false)">退出</button></div>
        <div class="me-card club-card">
          <div class="club-plate">
            <div class="me-top" style="flex-direction:row;align-items:center">
              <div class="me-user">
                ${ui.avatar(s.user.name, 'xl')}
                <div class="grow"><div class="me-name ell" style="color:#fff">${s.user.name}</div><div class="me-member-tag">普通会员</div></div>
              </div>
              <button class="vip-code" data-go="member-code">${icon('qr')}<span>会员码</span></button>
            </div>
          </div>
        </div>
        <div class="me-assets care-assets">
          <button data-go="points"><b>${s.points}</b><span>积分兑换</span></button>
          <button data-go="goods"><b class="ic">${icon('bag')}</b><span>艾品甄选</span></button>
          <button data-go="invite"><b class="ic">${icon('gift')}</b><span>邀请好友</span></button>
        </div>
      </div>
      <div class="cells sec"><button class="cell" data-go="service-bills">到店账单与余额</button>
        <div class="cell" onclick="${notifyBind}"><span class="cell-ic">${icon('bell')}</span><div class="cell-bd">消息通知</div>${icon('right', 'faint')}</div>
        <div class="cell" data-go="chat"><span class="cell-ic">${icon('headset')}</span><div class="cell-bd">在线客服</div>${icon('right', 'faint')}</div>
        <div class="cell" data-go="settings"><span class="cell-ic gray">${icon('settings')}</span><div class="cell-bd">设置</div>${icon('right', 'faint')}</div>
      </div>`;
  };

  XA.page('me', {
    nav: 'none',
    render() {
      const s = XA.state;
      if (!s.loggedIn) {
        return `<div class="me-hd"><div class="row gap12" onclick="XA.login()"><span class="avatar xl guest">${icon('user')}</span><div class="grow"><div class="me-name">点击登录</div><div class="muted small">登录后可查看订单、预约和晓艾会权益</div></div></div></div>
        <div class="sec"><button class="btn btn-wx btn-block" onclick="XA.login()">微信手机号快捷登录</button></div>
        <div class="cells sec"><button class="cell" data-go="service-bills">到店账单与余额</button>
          <div class="cell" data-go="chat"><span class="cell-ic">${icon('headset')}</span><div class="cell-bd">在线客服</div>${icon('right', 'faint')}</div>
          <div class="cell" data-go="settings"><span class="cell-ic gray">${icon('settings')}</span><div class="cell-bd">设置</div>${icon('right', 'faint')}</div>
        </div>`;
      }
      if (XA.isCare()) return careMe(s);
      const lv = XA.level(), nx = nextLevel(), plus = XA.isPlus(), cnt = (st) => s.orders.filter((o) => o.status === st).length;
      const next = s.appts.filter((a) => a.status === 'booked').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
      const oi = [
        ['online', 'bag', '线上订单', '历史订单', cnt('toship') + cnt('shipped')],
        ['offline', 'store', '线下订单', '门店消费', 0],
        ['third', 'receipt', '第三方订单', '京东·淘宝等', 0],
      ];
      const cups = s.coupons.filter((c) => !c.used).length;
      const notifyBind = `XA.subscribe(['活动开始提醒','会员活动提醒'],function(ok){XA.toast(ok?'已开启通知':'未开启',ok)})`;
      return `
      <div class="me-hd">
        <div class="me-card club-card">
          <div class="club-plate">
            <div class="me-top" style="flex-direction:row;align-items:center">
              <div class="me-user">
                ${ui.avatar(s.user.name, 'xl')}
                <div class="grow"><div class="me-name ell" style="color:#fff">${s.user.name}</div><div class="me-member-tag">普通会员</div></div>
              </div>
              <button class="vip-code" data-go="member-code">${icon('qr')}<span>会员码</span></button>
            </div>
          </div>
        </div>
        <div class="me-assets">
          <button data-go="points"><b>${s.points}</b><span>积分兑换</span></button>
          <button data-go="goods"><b class="ic">${icon('bag')}</b><span>艾品甄选</span></button>
          <button data-go="invite"><b class="ic">${icon('gift')}</b><span>邀请好友</span></button>
        </div>
      </div>
      ${ui.sec('更多')}
      <div class="cells sec">
        <div class="cell" data-go="invite"><span class="cell-ic warm">${icon('gift')}</span><div class="cell-bd">邀请好友<div class="faint small">好友入会，双方都得积分</div></div>${icon('right', 'faint')}</div>
        <div class="cell" onclick="${notifyBind}"><span class="cell-ic">${icon('bell')}</span><div class="cell-bd">消息通知<div class="faint small">活动提醒</div></div>${icon('right', 'faint')}</div>
        <div class="cell" data-go="chat"><span class="cell-ic">${icon('headset')}</span><div class="cell-bd">在线客服<div class="faint small">在线时间 09:00 - 21:00</div></div>${icon('right', 'faint')}</div>
        <div class="cell" data-go="settings"><span class="cell-ic gray">${icon('settings')}</span><div class="cell-bd">设置</div>${icon('right', 'faint')}</div>
      </div>
      <div class="end">晓艾 · 关注人的状态，而不是人的数据</div>`;
    },
  });

  /* ================= 晓艾会：成长会员 + Plus ================= */
  XA.act.lvTab = (n) => { XA.tmp.lvTab = n; XA.refresh(); };
  XA.act.xhTab = (t) => { XA.tmp.xhTab = t; XA.refresh(); };
  XA.page('xahui', {
    title: '晓艾会',
    render() {
      const s = XA.state, lv = XA.level(), plus = XA.isPlus(), tab = XA.tmp.lvTab || lv.lv, sys = XA.tmp.xhTab || (plus ? 'plus' : 'lv');
      const mine = D.storePerks.filter((x) => XA.hasPerk(x.id)).length;
      const can = D.storePerks.filter((x) => !XA.hasPerk(x.id) && D.perkVia(x)).length;
      return `
      <div class="sec">
        <div class="vipcard big">
          <div class="row between"><div class="grow"><div class="vip-brand">晓艾会</div><div class="vip-lv ell">${lv.short}<small> ${lv.name}</small>${plusBadge()}</div></div><span class="avatar lg">${esc(s.user.name.slice(0, 1))}</span></div>
          ${growthBar()}
          <div class="vip-ft"><span data-go="points"><b>${s.points}</b> 积分</span><span class="grow"></span><button class="vip-code" data-go="member-code">${icon('qr')}<span>会员码</span></button></div>
        </div>
      </div>
      <div class="sec dual">
        <button class="dual-c ${sys === 'lv' ? 'on' : ''}" onclick="XA.act.xhTab('lv')"><span class="dual-k">成长会员</span><b class="ell">${lv.short}</b><span class="ell">消费攒成长值升级</span></button>
        <button class="dual-c plus ${sys === 'plus' ? 'on' : ''}" onclick="XA.act.xhTab('plus')"><span class="dual-k">Plus</span><b class="ell">${plus ? '已开通' : '365 元/年'}</b><span class="ell">${plus ? '权益最大化' : '付费权益包'}</span></button>
      </div>
      <div class="sec tipbox">${icon('info')}<span>晓艾会是会员价值总称。您可靠消费积累成长值；Plus 是付费权益包，权益最大化覆盖。</span></div>
      ${sys === 'lv' ? `
      ${ui.sec('成长等级权益')}
      <div class="tabs inset">${XA.LEVELS.map((l) => `<button class="${tab === l.lv ? 'on' : ''}" onclick="XA.act.lvTab(${l.lv})">${l.short}${l.lv === lv.lv ? '<i>当前</i>' : ''}</button>`).join('')}</div>
      <div class="cells sec">
        <div class="cell"><span class="cell-label">等级</span><div class="cell-bd bold ell">${XA.LEVELS[tab - 1].name}</div><span class="faint small ell">${XA.LEVELS[tab - 1].min ? '满 ' + XA.LEVELS[tab - 1].min : '注册即是'}</span></div>
        ${D.benefits[tab].map((b) => `<div class="cell"><span class="cell-label">${b[0]}</span><div class="cell-bd">${b[1]}</div>${tab <= lv.lv ? `<span class="tag tag-green">已享</span>` : ''}</div>`).join('')}
      </div>
      ${ui.sec('怎么攒成长值')}
      <div class="cells sec">${D.earn.map((e) => `<div class="cell" ${e.act ? `onclick="XA.act.${e.act}()"` : `data-go="${e.go}"`}><div class="cell-bd">${e.name}</div><span class="c-primary bold">${e.g}</span>${icon('right', 'faint')}</div>`).join('')}</div>
      <div class="sec faint small">成长值只用于升级；积分另计，可兑换抵扣。想一步到位，您可开通 Plus。</div>` : `
      ${ui.sec('Plus 权益包')}
      <div class="cells sec">${D.plus.perks.map((x) => `<div class="cell"><span class="cell-ic gold">${icon(x.ic)}</span><div class="cell-bd"><div class="bold ell">${x.t}</div><div class="faint small">${x.d}</div></div>${plus ? `<span class="tag tag-gold">已享</span>` : ''}</div>`).join('')}</div>
      <div class="sec"><button class="btn btn-plus btn-block" data-go="plus">${plus ? '查看我的 Plus' : '开通 Plus · 365 元/年'}</button></div>`}
      ${ui.sec('门店权益匹配')}
      <div class="sec card group" data-go="perks"><span class="group-ic gold">${icon('store')}</span><div class="grow"><div class="bold">领取门店会员卡</div><div class="muted small">您可凭 Plus 或高等级匹配领取</div></div>${can ? `<span class="tag tag-orange">${can} 项可领</span>` : mine ? `<span class="tag tag-green">已领 ${mine}</span>` : icon('right', 'faint')}</div>
      ${s.membership ? `<div class="sec banner-ok" data-go="membership">${icon('crown')}<span class="ell">晓艾家<b>${s.membership.name}</b>会籍生效中</span></div>` : ''}
      <div class="end">门槛与权益为示例，以正式规则为准</div>`;
    },
  });

  /* ================= Plus ================= */
  XA.act.plusBuy = () => XA.needLogin(() => {
    const renew = XA.isPlus();
    XA.pay({ title: '晓艾会 Plus · 1 年', amount: D.plus.price, onSuccess: () => {
      XA.recordPlus(renew, XA.uid('P'));
      XA.save();
      XA.toast(renew ? '续费成功' : 'Plus 已开通，权益已全开', true);
      XA.refresh();
    } });
  });
  XA.act.plusPack = () => {
    const s = XA.state, ym = XA.d.key(new Date()).slice(0, 7);
    if (s.plusPack === ym) return XA.toast('本月券包已领取');
    s.plusPack = ym;
    const exp = XA.d.key(XA.d.add(30));
    s.coupons.unshift({ id: XA.uid('c'), name: 'Plus 月度券 · 好物券', amount: 15, min: 59, scope: 'goods', used: false, expire: exp }, { id: XA.uid('c'), name: 'Plus 月度券 · 到店服务券', amount: 25, min: 99, scope: 'store', used: false, expire: exp });
    XA.save(); XA.toast('2 张券已放入优惠券', true); XA.refresh();
  };
  XA.act.plusManage = () => XA.sheet({
    title: '管理 Plus 会籍',
    html: `<div class="kv"><b>有效期至</b><span>${XA.state.plus.expire}</span></div>
      <button class="btn btn-tonal btn-block mt16" onclick="XA.closeSheet();XA.act.plusBuy()">续费一年 · ¥${D.plus.price}</button>`,
  });
  XA.page('plus', {
    title: 'Plus 会员',
    render() {
      const s = XA.state, plus = XA.isPlus(), lv = XA.level(), got = s.plusPack === XA.d.key(new Date()).slice(0, 7);
      return `
      <div class="plus-hd">
        <div class="plus-k">晓艾会</div>
        <h1>Plus 会员</h1>
        <div class="plus-sub">${plus ? `已开通 · 至 ${s.plus.expire}` : '付费权益包 · 权益最大化覆盖'}</div>
      </div>
      ${plus ? `<div class="sec card group plus-pack"><span class="group-ic gold">${icon('ticket')}</span><div class="grow"><div class="bold">${new Date().getMonth() + 1} 月券包</div><div class="muted small">好物券 ¥15 + 到店券 ¥25</div></div><button class="btn btn-sm ${got ? 'btn-gray' : 'btn-plus'}" onclick="XA.act.plusPack()">${got ? '已领取' : '领取'}</button></div>` : ''}
      ${ui.sec(`${D.plus.perks.length} 项 Plus 权益`)}
      <div class="sec card plus-grid">${D.plus.perks.map((x) => `<div class="pp"><span class="pp-ic">${icon(x.ic)}</span><b class="ell">${x.t}</b><span class="faint small">${x.d}</span></div>`).join('')}</div>
      ${ui.sec('可匹配的门店会员卡', plus ? '去领取' : '', 'perks')}
      <div class="sec wslide">${D.storePerks.filter((x) => x.plus).map((x) => (typeof ui.cardMini === 'function' ? ui.cardMini(x, XA.hasPerk(x.id) ? 'got' : '', `data-go="perks?card=${x.id}"`) : '')).join('')}</div>
      ${ui.sec('和成长会员的关系')}
      <div class="sec card"><ul class="policy">
        <li>晓艾会是总称；您靠消费攒成长值，从普通升到白银、黄金、钻石</li>
        <li>Plus 是付费权益包，开通后权益最大化覆盖，不改变您的成长等级（当前 ${lv.short}）</li>
        <li>同类优惠同时具备时，按更优一项计算，不叠加</li>
        <li>Plus 到期后，您的成长等级与积分保留；凭 Plus 领取的门店会籍随之失效</li>
      </ul></div>
      ${plus ? `<div class="sec"><button class="link" onclick="XA.act.plusManage()">管理 Plus 会籍</button></div>` : ''}
      <div class="end">Plus 权益为示例，以正式规则为准</div>`;
    },
    footer() {
      if (XA.isPlus()) return '';
      return `<div class="grow">${ui.price(D.plus.price, 'lg')} <span class="faint small">/ 年</span><div class="small faint ell">支付后立即生效</div></div><button class="btn btn-plus" style="min-width:8.5rem" onclick="XA.act.plusBuy()">立即开通</button>`;
    },
  });

  /* 门店会员卡领取与卡包叠放见 pages-wallet.js（覆盖同名 perks 页） */

  /* 会员码：动态码，短时效自动刷新，防截图冒用 */
  let codeTimer = null;
  const paintCode = () => {
    const box = XA.$('#mcode');
    if (!box) return;
    const seed = 'XA' + Math.floor(Date.now() / 30000);
    const num = String(XA.hash(seed)).padStart(12, '0').slice(0, 12);
    box.innerHTML = `${XA.barcode(seed)}<div class="mcode-num">${num.replace(/(\d{4})(?=\d)/g, '$1 ')}</div><div class="qr-box">${XA.qr(seed)}</div>`;
  };
  XA.page('member-code', {
    title: '会员码',
    render() {
      const s = XA.state, lv = XA.level();
      return `<div class="mcode-page">
        <div class="card mcode-card">
          <div class="row gap12">${ui.avatar(s.user.name, 'lg')}<div><div class="bold" style="font-size:1.125rem">${s.user.name}</div><div class="row gap6 mt4"><span class="tag tag-gold">积分会员</span></div></div></div>
          <div id="mcode"></div>
          <div class="muted small center">积分会员码</div>
          <div class="faint small center mt4 row gap4" style="justify-content:center">${icon('refresh', 'ic-xs')}<span id="mcodeT">30 秒后自动刷新</span></div>
        </div>
        <div class="small center" style="color:rgba(255,255,255,.75)">会员码仅供您到店识别，请勿截图发给他人</div>
      </div>`;
    },
    mounted() {
      paintCode();
      codeTimer = setInterval(() => {
        const left = 30 - (Math.floor(Date.now() / 1000) % 30);
        const t = XA.$('#mcodeT');
        if (t) t.textContent = `${left} 秒后自动刷新`;
        if (left === 30) paintCode();
      }, 1000);
    },
    unmount() { clearInterval(codeTimer); },
  });

  /* ================= 积分 ================= */
  XA.act.sign = () => {
    const s = XA.state, today = XA.d.key(new Date());
    if (s.sign.last === today) return XA.toast('今天已经签到过了');
    s.sign.streak = s.sign.last === XA.d.key(XA.d.add(-1)) ? s.sign.streak + 1 : 1;
    s.sign.last = today;
    XA.addPoints(5, '每日签到', 5);
    XA.toast(`签到成功 +5 积分，已连续 ${s.sign.streak} 天`, true);
    XA.refresh();
  };
  /* ================= 积分兑换 =================
   * 只做兑换：展示可用积分 + 每件「N 积分 + ¥X」，不放赚积分/签到/明细。
   */
  XA.act.exchange = (id) => XA.needLogin(() => {
    const it = D.exchangeOf(id), p = D.product(it.pid), s = XA.state;
    if (s.points < it.pts) return XA.toast(`积分不足，还差 ${it.pts - s.points} 分`);
    XA.modal({
      title: '确认兑换',
      content: `<div class="xch-confirm"><b>${esc(p.short)}</b><span class="xch-confirm-pt">${it.pts} 积分 + ¥${XA.money(it.cash)}</span><span class="faint small">兑换后剩余 ${s.points - it.pts} 积分</span></div>`,
      confirmText: '确认兑换',
      onConfirm: () => {
        XA.addPoints(-it.pts, `积分兑换 · ${p.short}`, 0);
        s.exchanges = s.exchanges || [];
        s.exchanges.unshift({ id, at: new Date().toISOString() });
        XA.save();
        XA.toast('兑换成功，3 个工作日内发出', true);
        XA.refresh();
      },
    });
  });
  XA.page('points', {
    title: '积分兑换',
    render() {
      const s = XA.state;
      const done = new Set((s.exchanges || []).map((x) => x.id));
      return `<div class="sec card xch-hd">
        <div class="row between gap12">
          <div class="xch-hd-l"><div class="faint small">可用积分</div><div class="xch-num">${s.points}</div></div>
          <div class="xch-rate"><b>${D.exchangeRate} 积分 = ¥1</b><span>积分抵现，差额补现金</span></div>
        </div>
      </div>
      ${ui.sec('可兑换')}
      <div class="sec xch-list">${D.exchange.map((it) => {
        const p = D.product(it.pid) || {};
        const lack = it.pts - s.points;
        return `<div class="xch-item">
          ${ui.cover(p, 'xch-img')}
          <div class="xch-bd">
            <div class="xch-title">${esc(p.title || '')}</div>
            <div class="xch-market faint small">市场价<span class="xch-was">¥${XA.money(p.price)}</span></div>
            <div class="xch-price"><b>${it.pts}</b><span>积分</span><i>+</i><b>¥${XA.money(it.cash)}</b></div>
          </div>
          ${done.has(it.id) ? `<span class="xch-btn is-done">已兑换</span>`
            : lack > 0 ? `<span class="xch-btn is-off">差 ${lack} 分</span>`
            : `<button class="xch-btn" onclick="XA.act.exchange('${it.id}')">兑换</button>`}
        </div>`;
      }).join('')}</div>
      <div class="sec faint small">兑换后 3 个工作日内发出，售出不支持退换；积分抵扣部分不开具发票。</div>
      <div class="end">积分只在兑换时抵扣，不兑现金</div>`;
    },
  });

  /* ================= 优惠券 ================= */
  XA.page('coupons', {
    title: '优惠券',
    render() {
      const list = XA.state.coupons;
      if (!list.length) return ui.empty('您还没有优惠券', '去首页看看好物', 'home');
      return `<div class="sec">${list.map((c) => `<div class="coupon ${c.used ? 'used' : ''}">
        <div class="coupon-l"><span><small>¥</small>${c.amount}</span><em>满 ${c.min} 可用</em></div>
        <div class="coupon-r"><div class="bold">${c.name}</div><div class="faint small">${c.scope === 'store' ? '晓艾家门店到店付款时使用' : '线上购物可用'} · ${c.expire} 到期</div></div>
        ${c.used ? `<span class="faint small">已使用</span>` : `<button class="btn btn-tonal btn-sm" data-go="${c.scope === 'store' ? 'store' : 'home'}">去使用</button>`}
      </div>`).join('')}</div>`;
    },
  });

  /* ================= 第三方订单补登（P0）=================
   * 第三方订单 = 京东、淘宝、小店等第三方电商平台的订单。
   * 每个包裹内附一张"积分卡"，卡上的积分二维码对应这笔订单；用户扫码 → 积分到账 → 入会引导。
   * 没有积分卡时，可用订单号提交人工审核。
   */
  const chTag = (ch) => `<span class="ch ch-${D.chClass(ch)}">${ch}</span>`;
  const doClaim = (id) => {
    const e = D.pointCard(id);
    XA.state.claim.claimed.unshift(id);
    XA.addPoints(e.points, `${e.channel}订单补登`, e.points);
    XA.save();
    XA.go('claim-result?id=' + id);
  };
  /* 扫一扫（原型不调用摄像头，用"点一张积分卡"模拟扫到） */
  XA.act.scanPoints = () => {
    const used = XA.state.claim.claimed;
    XA.sheet({
      title: '扫积分码',
      html: `<div class="scanner"><div class="scan-frame"><i></i></div><div class="scan-tip">对准包裹内积分卡上的二维码</div></div>
        <div class="demo-box mt12"><b>演示说明</b><div>原型不调用摄像头。点下面任意一张积分卡，模拟"扫到了"。</div></div>
        <div class="qcards">${D.pointCards.map((e) => `<button class="qcard" onclick="XA.act.scanHit('${e.id}')">
          <span class="qcard-qr">${XA.qr('pc-' + e.id)}</span>
          <span class="grow"><span class="row gap6">${chTag(e.channel)}${used.includes(e.id) ? `<span class="faint small">已用过的码</span>` : ''}</span><b>${e.title}</b><span class="faint small">本单可得 ${e.points} 积分</span></span>
        </button>`).join('')}</div>`,
    });
  };
  XA.act.scanHit = (id) => {
    XA.closeSheet();
    XA.needLogin(() => {
      if (XA.state.claim.claimed.includes(id)) {
        return XA.modal({ title: '这张积分码已经用过了', content: '一个积分码对应一笔订单，只能补登一次。已补登的订单可以在"第三方订单"里查看。', confirmText: '查看第三方订单', cancelText: '知道了', onConfirm: () => XA.go('orders?type=third') });
      }
      doClaim(id);
    });
  };
  /* 没有积分卡：选择平台 + 订单号，提交人工审核 */
  XA.act.claimManual = () => {
    XA.tmp.mch = XA.tmp.mch || D.thirdChannels[0];
    XA.sheet({
      title: '用订单号补登',
      html: `<div class="muted small">如果您找不到积分卡也没关系。选择购买平台、填写订单号，审核通过后积分自动到账。</div>
        <div class="bold mt16">在哪里买的</div>
        <div class="chips wrap mt8" id="mchs">${D.thirdChannels.map((c) => `<button class="chip lg ${c === XA.tmp.mch ? 'on' : ''}" data-c="${c}" onclick="XA.act.mch('${c}')">${c}</button>`).join('')}</div>
        <div class="bold mt16">订单号</div>
        <input class="input mt8" id="claimCode" placeholder="请输入订单号" autocomplete="off">
        <div class="faint small mt8">订单号可在购买平台的"我的订单 - 订单详情"里复制</div>
        <div class="err mt8" id="claimErr"></div>
        <button class="btn btn-primary btn-block" onclick="XA.act.claimCode()">提交审核</button>`,
    });
  };
  XA.act.mch = (c) => { XA.tmp.mch = c; XA.$$('#mchs .chip').forEach((b) => b.classList.toggle('on', b.dataset.c === c)); };
  XA.act.claimCode = () => {
    const v = XA.$('#claimCode').value.trim().toUpperCase(), err = XA.$('#claimErr'), c = XA.state.claim;
    if (!v) return (err.textContent = '请输入订单号');
    if (v.length < 8) return (err.textContent = '订单号看起来不完整，请核对后再提交');
    if (c.pending.some((x) => x.order === v) || c.claimed.some((id) => D.pointCard(id).order === v)) return (err.textContent = '这笔订单已经提交或补登过了，一笔订单只能补登一次。');
    XA.closeSheet();
    XA.needLogin(() => {
      c.pending.unshift({ id: XA.uid('PD'), channel: XA.tmp.mch, order: v, at: new Date().toISOString() });
      XA.save();
      XA.toast('已提交，审核通过后积分自动到账', true);
      const cur = XA.current();
      if (cur && cur.name === 'orders') XA.refresh(); else XA.go('orders?type=third');
    });
  };
  const claimRow = (e) => `<div class="card ext">
      <div class="row between"><span class="row gap6">${chTag(e.channel)}<span class="faint small">${e.shop}</span></span><span class="tag tag-green">${icon('check', 'ic-xs')}已补登</span></div>
      <div class="bold mt8">${e.title}</div>
      <div class="row between mt4"><span class="muted small">实付 ¥${e.amount} · 订单号 ${D.maskCode(e.order)}</span><span class="c-primary bold">+${e.points} 积分</span></div>
    </div>`;
  XA.page('claim', {
    title: '第三方订单补登',
    render() {
      const c = XA.state.claim, done = c.claimed.map(D.pointCard).filter(Boolean);
      const step = (n, t, d) => `<div class="s3"><em>${n}</em><div><b>${t}</b><span>${d}</span></div></div>`;
      return `<div class="claim-hd">${XA.art('calendar', 'sage', 'claim-art')}<div><h1>在别处买的，也能攒积分</h1><div class="muted">您在京东、淘宝、小店等平台买的晓艾商品，扫包裹里的积分码，积分计入晓艾会。</div></div></div>
      <div class="sec card">
        <div class="pm"><div class="grow"><div class="pm-brand">晓艾会 · 积分卡</div><div class="pm-t">扫码领取本单积分</div><div class="pm-s">随包裹附送 · 一单一码</div></div><span class="pm-qr">${XA.qr('points-card')}</span></div>
        <button class="btn btn-primary btn-block mt16" onclick="XA.act.scanPoints()">${icon('scan')}<span>扫积分码</span></button>
        <div class="faint small center mt8">直接用微信"扫一扫"扫积分卡，也会打开这里</div>
      </div>
      ${ui.sec('三步完成')}
      <div class="sec card">
        ${step(1, '收到包裹，找到积分卡', '卡片和商品一起放在包裹里')}
        ${step(2, '扫卡上的二维码', '点上面的"扫积分码"，或用微信扫一扫')}
        ${step(3, '积分马上到账', '计入晓艾会，线上线下通用')}
      </div>
      <div class="sec"><button class="btn btn-tonal btn-block" onclick="XA.act.claimManual()">没有积分卡？您可用订单号补登</button></div>
      ${c.pending.length ? `<div class="sec tipbox" data-go="orders?type=third">${icon('clock')}<span>有 ${c.pending.length} 笔订单正在审核，通过后积分自动到账</span>${icon('right', 'ic-s')}</div>` : ''}
      ${done.length ? ui.sec(`已补登（${done.length}）`, '第三方订单', 'orders?type=third') + `<div class="sec">${done.map(claimRow).join('')}</div>` : ''}
      ${ui.sec('补登说明')}
      <div class="sec card"><ul class="policy">
        <li>一个积分码对应一笔订单，只能补登一次，补登后不可转给他人</li>
        <li>按订单实付金额计积分，1 元 = 1 积分（示例比例）</li>
        <li>订单发生退款时，对应的积分会相应扣回</li>
        <li>门店暂未入驻，团购消费暂不累计晓艾会积分</li>
      </ul></div>`;
    },
  });
  /* 补登成功页：承接入会引导漏斗（入会 → 体质测试 → 企微 → 券包） */
  XA.act.obWecom = () => XA.wecom('添加养生顾问', () => { XA.state.onboarding.wecom = true; XA.save(); XA.refresh(); });
  XA.act.obPack = () => {
    const s = XA.state;
    if (s.onboarding.pack) return XA.toast('已经领过了');
    s.onboarding.pack = true;
    s.coupons.unshift({ id: XA.uid('c'), name: '复购礼 · 到店服务券', amount: 50, min: 198, scope: 'store', used: false, expire: XA.d.key(XA.d.add(30)) }, { id: XA.uid('c'), name: '复购礼 · 好物券', amount: 15, min: 99, scope: 'goods', used: false, expire: XA.d.key(XA.d.add(30)) });
    XA.save(); XA.toast('2 张券已放入"优惠券"', true); XA.refresh();
  };
  XA.page('claim-result', {
    title: '补登成功',
    render(q) {
      const s = XA.state, ob = s.onboarding, e = D.pointCard(q.id);
      const step = (done, title, desc, btn, act) => `<div class="ob ${done ? 'done' : ''}"><span class="ob-ic">${icon(done ? 'check' : 'right')}</span><div class="grow"><div class="bold">${title}</div><div class="muted small">${desc}</div></div>${done ? `<span class="faint small">已完成</span>` : `<button class="btn btn-primary btn-sm" ${act}>${btn}</button>`}</div>`;
      return `<div class="result compact">
        <div class="result-ic">${icon('check')}</div>
        <h1>补登成功</h1>
        <div class="result-pts">${icon('coin')} <span><b>+${e ? e.points : 0} 积分</b>已到账，当前共 ${s.points} 积分</span></div>
      </div>
      ${e ? `<div class="sec">${claimRow(e)}</div>` : ''}
      ${ui.sec('再做三件小事，会员权益用起来')}
      <div class="sec card obs">
        ${step(true, '已加入晓艾会', `您现在是 ${XA.level().name}${XA.isPlus() ? ' · Plus' : ''}，线上线下通用`, '', '')}
        ${step(!!s.constitution, '测一测体质', '3 分钟，再得 20 积分，推荐更合适的养生方法', '去测试', 'data-go="test"')}
        ${step(ob.wecom, '添加养生顾问', '企业微信一对一答疑，可加入养生交流群', '去添加', 'onclick="XA.act.obWecom()"')}
        ${step(ob.pack, '领取复购券包', '到店服务券 ¥50 + 好物券 ¥15', '领取', 'onclick="XA.act.obPack()"')}
      </div>
      <div class="sec"><button class="btn btn-tonal btn-block" onclick="XA.act.scanPoints()">继续扫下一张</button><button class="btn btn-ghost btn-block mt8" data-go="orders?type=third">查看第三方订单</button></div>`;
    },
  });

  /* ================= 推广中心（P1）：仅单层 CPS ================= */
  XA.act.promoApply = () => {
    if (!XA.$('#promoAgree').classList.contains('on')) return XA.toast('请先阅读并同意推广协议');
    XA.needLogin(() => { XA.state.promoter.status = 'pending'; XA.save(); XA.toast('申请已提交', true); XA.refresh(); });
  };
  XA.act.promoPass = () => {
    const p = XA.state.promoter;
    Object.assign(p, { status: 'active', invited: 3, total: 34.14, balance: 12.7 });
    XA.save(); XA.toast('审核通过（演示）', true); XA.refresh();
  };
  XA.act.promoPoster = () => XA.sheet({
    title: '我的专属海报',
    html: `<div class="poster">${XA.art('moxa', 'night', 'poster-art')}<div class="poster-bd"><div><div class="bold" style="font-size:1.125rem">${XA.state.user.name}邀您一起艾灸养生</div><div class="muted small">长按识别小程序码，领新人礼</div></div><div class="qr-box sm">${XA.qr('promoter-XA8866')}</div></div></div>
      <div class="row gap12 mt16"><button class="btn btn-tonal grow" onclick="XA.closeSheet();XA.toast('海报已保存到相册（演示）',true)">保存海报</button><button class="btn btn-wx grow" onclick="XA.closeSheet();XA.toast('已转发给微信好友（演示）',true)">发给好友</button></div>
      <div class="faint small center mt8">推广码 XA8866 · 好友通过海报进入后与您绑定 180 天</div>`,
  });
  XA.act.promoWithdraw = () => {
    const p = XA.state.promoter;
    if (p.balance <= 0) return XA.toast('暂无可提现金额');
    XA.modal({ title: `提现 ¥${XA.money(p.balance)} 到微信零钱？`, content: '首次提现需完成实名认证；平台将依法代扣个人所得税（演示）。', confirmText: '确认提现', onConfirm: () => { p.balance = 0; XA.save(); XA.toast('提现申请已提交，1-3 个工作日到账', true); XA.refresh(); } });
  };
  const promoRules = () => `<ul class="policy">
      <li>只有<b>您直接邀请</b>的好友下单，您才有佣金；好友再邀请的人与您无关</li>
      <li>好友确认收货或到店核销后计入佣金，7 天后可提现</li>
      <li>商品佣金 10%，到店服务 8%（示例比例，以协议公示为准）</li>
      <li>自己买自己推、刷单等行为，佣金将被冻结</li>
    </ul>`;
  XA.page('promoter', {
    title: '推广中心',
    render() {
      const p = XA.state.promoter;
      if (p.status === 'none') {
        return `<div class="intro">${XA.art('hand', 'sand', 'intro-art')}<h1>把好东西分享给朋友</h1><p class="muted">成为晓艾推广员，朋友通过您的分享下单，您获得佣金。</p></div>
        ${ui.sec('佣金规则')}<div class="sec card">${promoRules()}</div>
        <div class="sec"><button class="agree" id="promoAgree" onclick="this.classList.toggle('on')"><span class="check">${icon('check')}</span><span>我已阅读并同意《晓艾推广员协议》</span></button></div>`;
      }
      if (p.status === 'pending') {
        return `<div class="result"><div class="result-ic wait">${icon('clock')}</div><h1>申请审核中</h1><div class="muted">一般 1 个工作日内完成，结果会通过微信通知您</div></div>
        <div class="sec demo-box"><b>演示说明</b><div>正式版由运营后台审核。</div><button class="btn btn-sm btn-outline mt8" onclick="XA.act.promoPass()">模拟审核通过</button></div>`;
      }
      return `<div class="pts-hd gold"><div class="small">可提现佣金（元）</div><div class="pts-num">${XA.money(p.balance)}</div>
        <div class="row gap12 mt12" style="justify-content:center"><span>累计佣金 ¥${XA.money(p.total)}</span><span>已邀请 ${p.invited} 人</span></div>
        <button class="btn btn-white mt12" onclick="XA.act.promoWithdraw()">提现到微信零钱</button></div>
      <div class="sec row gap12"><button class="btn btn-primary grow" onclick="XA.act.promoPoster()">${icon('image', 'ic-s')} 生成邀请海报</button><button class="btn btn-tonal grow" onclick="XA.share('邀请好友来晓艾')">${icon('share', 'ic-s')} 发给好友</button></div>
      ${ui.sec('佣金明细')}
      <div class="cells sec">${D.promoRecords.map((r) => `<div class="cell"><div class="cell-bd"><div>${r.who} 购买 ${r.item}</div><div class="faint small">${XA.d.md(XA.d.add(r.day))} · 实付 ¥${r.amount} × ${r.rate * 100}%</div></div><div class="right"><div class="bold c-price">+¥${XA.money(r.amount * r.rate)}</div><div class="small ${r.status === '已结算' ? 'c-primary' : 'faint'}">${r.status}</div></div></div>`).join('')}</div>
      ${ui.sec('佣金规则')}<div class="sec card">${promoRules()}</div>`;
    },
    footer() { return XA.state.promoter.status === 'none' ? `<button class="btn btn-primary btn-block" onclick="XA.act.promoApply()">申请成为推广员</button>` : ''; },
  });

  /* ================= 我的课程 / 收藏 ================= */
  XA.page('my-courses', {
    title: '我的课程',
    render() {
      const list = XA.state.courses.map(D.course);
      return list.length ? `<div class="feed mt12">${list.map((c) => ui.courseCard(c)).join('')}</div>` : ui.empty('您还没有订阅课程', '看看入门课', 'course?id=c1');
    },
  });
  XA.page('favs', {
    title: '我的收藏',
    render() {
      const keys = Object.keys(XA.state.favs).filter((k) => XA.state.favs[k]);
      const rows = keys.map((k) => {
        const id = k.slice(2);
        if (k[0] === 'n' && D.note(id)) return ui.noteRow(D.note(id));
        if (k[0] === 'a' && D.article(id)) return ui.articleCard(D.article(id));
        const v = k[0] === 'v' && D.videoOf(id);
        return v ? `<div class="fcard" data-go="video">${ui.art(v.art, 'fcard-img')}<div class="fcard-bd"><div class="fcard-title">${v.title}</div><div class="fcard-tags"><span class="tag tag-outline">视频</span><span class="faint small">${v.author}</span></div></div></div>` : '';
      }).join('');
      return rows ? `<div class="feed mt12">${rows}</div>` : ui.empty('您还没有收藏内容', '去社区看看', 'community');
    },
  });

  /* ================= 在线客服（演示对话，非企微；回复延时模拟真人） ================= */
  const chatMsgs = () => (XA.tmp.chatMsgs || (XA.tmp.chatMsgs = [
    { from: 'cs', text: '您好，这里是晓艾在线客服，很高兴为您服务～', at: '09:02' },
    { from: 'cs', text: '客服在线时间 09:00 - 21:00，非在线时段留言我们会在上线后回复。', at: '09:02' },
  ]));
  const chatTime = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  XA.act.csSend = () => {
    const input = XA.$('#csInput');
    if (!input) return;
    const text = (input.value || '').trim();
    if (!text) return XA.toast('请输入您想咨询的内容');
    input.value = '';
    const msgs = chatMsgs();
    msgs.push({ from: 'me', text, at: chatTime() });
    XA.refresh();
    const typing = XA.$('#csTyping');
    if (typing) typing.hidden = false;
    setTimeout(() => {
      const m = chatMsgs();
      m.push({ from: 'cs', text: '已收到您的消息，客服正在为您查询，请稍候片刻。', at: chatTime() });
      const t = XA.$('#csTyping'); if (t) t.hidden = true;
      XA.refresh();
      const box = XA.$('#csBox'); if (box) box.scrollTop = box.scrollHeight;
    }, 1800);
  };
  XA.page('chat', {
    title: '在线客服',
    render() {
      const msgs = chatMsgs();
      const bubbles = msgs.map((m) => `<div class="cs-msg ${m.from === 'me' ? 'me' : ''}"><div class="cs-bubble">${esc(m.text)}</div><div class="cs-time">${esc(m.at)}</div></div>`).join('');
      return `<div class="cs-wrap">
        <div class="cs-info">${icon('headset')}<div class="grow"><div class="bold">晓艾在线客服</div><div class="faint small">在线时间 09:00 - 21:00 · 当前在线</div></div><span class="cs-online"></span></div>
        <div class="cs-box" id="csBox">${bubbles}<div class="cs-msg" id="csTyping" hidden><div class="cs-bubble cs-typing">客服正在输入…</div></div></div>
        <div class="cs-input"><input id="csInput" class="input" type="text" placeholder="请输入您想咨询的内容" onkeydown="if(event.key==='Enter')XA.act.csSend()"><button class="btn btn-primary" onclick="XA.act.csSend()">发送</button></div>
      </div>`;
    },
    mounted() { const box = XA.$('#csBox'); if (box) box.scrollTop = box.scrollHeight; },
  });

  /* ================= 设置 ================= */
  XA.act.toggle = (k) => { XA.state[k] = !XA.state[k]; XA.save(); XA.refresh(); };
  XA.act.logout = () => XA.modal({ title: '退出登录？', confirmText: '退出', danger: true, onConfirm: () => { localStorage.removeItem('xa-member:'+XA.demoSpace); XA.state.loggedIn = false; XA.save(); XA.go('me'); } });
  XA.page('settings', {
    title: '设置',
    render() {
      const s = XA.state, sw = (on, fn) => `<button class="switch ${on ? 'on' : ''}" onclick="${fn}" role="switch" aria-checked="${!!on}"><i></i></button>`;
      return `
      <div class="cells sec">
          <div class="cell"><div class="cell-bd"><div class="bold">长辈模式</div><div class="muted small">精简为首页、门店、计时、我的；在全局大字基础上再放大，版面仍保持协调</div></div>${sw(s.careMode, 'XA.setCare(!XA.state.careMode)')}</div>
      </div>
      <div class="cells sec">
        <div class="cell"><div class="cell-bd"><div>用流量时自动播放视频</div><div class="muted small">关闭后，仅在 Wi-Fi 下自动播放</div></div>${sw(s.autoPlayCell, "XA.act.toggle('autoPlayCell')")}</div>
      </div>
      <div class="cells sec">
        <div class="cell" data-go="profile"><div class="cell-bd">体质档案与隐私</div><span class="faint small">可查看、删除</span>${icon('right', 'faint')}</div>
        <div class="cell" onclick="XA.toast('用户协议（演示）')"><div class="cell-bd">用户协议</div>${icon('right', 'faint')}</div>
        <div class="cell" onclick="XA.toast('隐私政策（演示）')"><div class="cell-bd">隐私政策</div>${icon('right', 'faint')}</div>
        <div class="cell"><div class="cell-bd">关于晓艾</div><span class="faint small">原型 V1.4</span></div>
      </div>
      <div class="sec demo-box"><b>演示说明</b><div class="muted small mt4">原型数据保存在本机浏览器，您可一键恢复到初始状态。</div><button class="btn btn-sm btn-outline mt8" onclick="XA.modal({title:'重置演示数据？',content:'订单、预约、积分等将恢复初始状态。',confirmText:'重置',danger:true,onConfirm:XA.reset})">重置演示数据</button></div>
      ${s.loggedIn ? `<div class="sec"><button class="btn btn-gray btn-block" onclick="XA.act.logout()">退出登录</button></div>` : ''}`;
    },
  });
  XA.act.plusBuy = () => XA.toast('会员暂不支持购买');
  XA.page('xahui', {
    title: '积分会员',
    render() {
      const s = XA.state;
      return `<div class="sec"><div class="vipcard big">
        <div class="row between"><div class="grow"><div class="vip-brand">晓艾会</div><div class="vip-lv">积分会员</div></div><span class="avatar lg">${esc(s.user.name.slice(0, 1))}</span></div>
        <div class="vip-ft"><span data-go="points"><b>${s.points}</b> 积分</span><span class="grow"></span><button class="vip-code" data-go="member-code">${icon('qr')}<span>会员码</span></button></div>
      </div></div>
      <div class="cells sec"><div class="cell" data-go="points"><span class="cell-label">积分</span><div class="cell-bd">积分兑换</div>${icon('right', 'faint')}</div><div class="cell" data-go="coupons"><span class="cell-label">优惠券</span><div class="cell-bd">查看优惠券</div>${icon('right', 'faint')}</div></div>`;
    },
  });
  XA.page('plus', { title: '积分会员', render: () => `<div class="sec card">会员暂不支持购买。<button class="btn btn-tonal btn-block mt12" data-go="xahui">查看积分会员</button></div>` });
})();
