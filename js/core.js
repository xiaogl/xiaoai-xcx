/* 晓艾小程序 · 交互原型
 * core.js —— 图标 / 占位插画 / 工具函数 / 本地状态 / 通用弹层 / 路由
 * 无后端：所有数据为演示内容，状态保存在 localStorage。
 */
(function () {
  const XA = (window.XA = { data: {}, act: {}, tmp: {} });

  /* ============ 图标（线性、统一 24 网格） ============ */
  const I = {
    home: '<path d="M3.5 10.5 12 3.5l8.5 7V19a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-5v6H5A1.5 1.5 0 0 1 3.5 19z"/>',
    video: '<rect x="3" y="4.5" width="18" height="15" rx="3.5"/><path d="m10 9 5 3-5 3z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    store: '<path d="M4.5 10.5V20h15v-9.5"/><path d="M3 9.5 5 4h14l2 5.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M10 20v-5h4v5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20.5a8 8 0 0 1 16 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    heart: '<path d="M12 20.5s-8-4.6-8-10.5a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.9-8 10.5-8 10.5z"/>',
    star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/>',
    share: '<path d="M13 5l7.5 6.5L13 18v-4c-5 0-8 1.5-9.5 5C3.5 13 6.5 9 13 9z"/>',
    bag: '<path d="M5 8h14l-1 12.5H6z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
    cart: '<circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/><path d="M3 4.5h2.5l2.2 10.5h10.2L20 8H6.5"/>',
    right: '<path d="m9 5 7 7-7 7"/>',
    left: '<path d="m15 5-7 7 7 7"/>',
    down: '<path d="m5 9 7 7 7-7"/>',
    up: '<path d="m5 15 7-7 7 7"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A15 15 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
    nav: '<path d="m12 3.5 7 16.5-7-4-7 4z"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    gift: '<rect x="4" y="10" width="16" height="10.5" rx="1.5"/><path d="M3 7h18v3H3zM12 7v13.5M12 7c-1.5-3.5-6-3.5-5 0M12 7c1.5-3.5 6-3.5 5 0"/>',
    scan: '<path d="M4 8.5V6a2 2 0 0 1 2-2h2.5M15.5 4H18a2 2 0 0 1 2 2v2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5M8.5 20H6a2 2 0 0 1-2-2v-2.5M3.5 12h17"/>',
    qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM20 14v1M14 19.5v.5"/>',
    settings: '<path d="M4 7h9M18 7h2M4 17h3M12 17h8"/><circle cx="15.5" cy="7" r="2.2"/><circle cx="9.5" cy="17" r="2.2"/>',
    ticket: '<path d="M4 7h16v3.5a1.5 1.5 0 0 0 0 3V17H4v-3.5a1.5 1.5 0 0 0 0-3z"/><path d="M14.5 7.5v9" stroke-dasharray="1.5 2.5"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="m12 7.5 1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z"/>',
    doc: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"/>',
    body: '<circle cx="12" cy="5" r="2.3"/><path d="M6 10h12M12 10v5.5M12 15.5 9 21M12 15.5l3 5.5"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    quiz: '<rect x="5" y="4.5" width="14" height="16" rx="2.5"/><path d="M9 4.5v-1h6v1M8.5 12.5l2.5 2.5 4.5-5"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5v-4M9.5 3h5M12 3v3"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.5a6 6 0 0 1 3.5 5.5"/>',
    headset: '<path d="M4.5 13.5V12a7.5 7.5 0 0 1 15 0v1.5"/><rect x="3.5" y="13" width="4" height="6" rx="1.5"/><rect x="16.5" y="13" width="4" height="6" rx="1.5"/><path d="M18.5 19c0 1.5-2 2.5-5 2.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13.5h9l1-13.5"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    shield: '<path d="M12 3l7.5 3v5.5c0 4.5-3 8-7.5 9.5-4.5-1.5-7.5-5-7.5-9.5V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 4v5h-5"/>',
    crown: '<path d="M3.5 8.5 7.5 12 12 5.5l4.5 6.5 4-3.5-1.8 10H5.3z"/>',
    receipt: '<path d="M6 3.5h12v17l-2.5-1.5-2 1.5-1.5-1.5-1.5 1.5-2-1.5L6 20.5z"/><path d="M9 8.5h6M9 12h6"/>',
    megaphone: '<path d="M4 10v4h3l8 4.5v-13L7 10z"/><path d="M18 9.5a4 4 0 0 1 0 5"/>',
    book: '<path d="M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/>',
    flame: '<path d="M12 3c1 3.5 5 5.5 5 10.5a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.5 1 2.3 2 2.5-.5-3 .2-6 1-8.5z"/>',
    play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    package: '<path d="M3.5 8 12 3.5 20.5 8v8.5L12 21l-8.5-4.5z"/><path d="M3.5 8 12 12.5 20.5 8M12 12.5V21"/>',
    truck: '<path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3.5v3h-7z"/><circle cx="7" cy="17.5" r="1.9"/><circle cx="16.5" cy="17.5" r="1.9"/>',
    wallet: '<rect x="3.5" y="6" width="17" height="13" rx="2.5"/><path d="M3.5 10h17M16 14.5h1.5"/>',
    image: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m5 17 5-4.5 3.5 3 2.5-2 3.5 3.5"/>',
    text: '<path d="M5 6.5h14M12 6.5V19M9 19h6"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    leaf: '<path d="M5 19C5 10 10 5 20 5c0 10-5 15-14 15"/><path d="M5 19c3-5 6-8 10-10"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  };
  XA.icon = (n, cls) =>
    `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ''}</svg>`;

  /* ============ 占位插画（代替真实图片，原型阶段用简笔示意） ============ */
  const G = {
    moxa: '<rect x="26" y="64" width="62" height="16" rx="8" transform="rotate(-18 57 72)"/><circle cx="88" cy="61" r="4" fill="currentColor"/><path d="M93 50c-6-7 5-10 0-17s5-10 1-16"/>',
    box: '<rect x="28" y="58" width="64" height="36" rx="9"/><circle cx="48" cy="76" r="5"/><circle cx="72" cy="76" r="5"/><path d="M60 48c-5-7 5-10 0-17s5-9 1-14"/>',
    leaf: '<path d="M60 102V30"/><path d="M60 82c-14-2-22-10-24-22 12 0 22 8 24 22zM60 82c14-2 22-10 24-22-12 0-22 8-24 22zM60 58c-10-2-16-9-17-18 9 0 16 7 17 18zM60 58c10-2 16-9 17-18-9 0-16 7-17 18zM60 34c-4-5-4-11 0-16 4 5 4 11 0 16z"/>',
    bath: '<path d="M24 62h72l-6 26a8 8 0 0 1-8 6H38a8 8 0 0 1-8-6z"/><path d="M44 48c-4-6 4-8 0-14M60 48c-4-6 4-8 0-14M76 48c-4-6 4-8 0-14"/>',
    patch: '<rect x="26" y="38" width="68" height="46" rx="13"/><path d="M40 55c4-4 8 4 12 0s8 4 12 0 8 4 12 0M40 68c4-4 8 4 12 0s8 4 12 0 8 4 12 0"/>',
    tea: '<path d="M30 52h48v14a22 22 0 0 1-22 22h-4a22 22 0 0 1-22-22z"/><path d="M78 56h6a9 9 0 0 1 0 18h-7"/><path d="M26 97h56"/><path d="M46 40c-4-6 4-8 0-14M62 40c-4-6 4-8 0-14"/>',
    room: '<path d="M34 98V56a26 26 0 0 1 52 0v42"/><path d="M20 98h80"/><path d="M60 30v13"/><circle cx="60" cy="50" r="7"/><path d="M46 98V84h28v14"/>',
    person: '<circle cx="60" cy="44" r="15"/><path d="M28 100a32 32 0 0 1 64 0"/>',
    book: '<path d="M60 40c-8-6-18-8-30-8v52c12 0 22 2 30 8 8-6 18-8 30-8V32c-12 0-22 2-30 8zM60 40v52"/>',
    season: '<circle cx="80" cy="38" r="10"/><path d="M16 94l28-38 16 20 10-12 34 30z"/>',
    bed: '<path d="M20 88V58M20 76h80v12M100 88V70a8 8 0 0 0-8-8H50v14"/><circle cx="35" cy="66" r="6"/><path d="M72 46c-4-6 4-8 0-14"/>',
    hand: '<path d="M44 96V52a6 6 0 0 1 12 0v20-34a6 6 0 0 1 12 0v32-26a6 6 0 0 1 12 0v40c0 14-8 22-20 22h-2c-8 0-13-4-18-12L30 78a6 6 0 0 1 10-6z"/>',
    calendar: '<rect x="26" y="34" width="68" height="60" rx="10"/><path d="M26 52h68M44 26v14M76 26v14M46 68l9 9 18-18"/>',
  };
  /* art(图形, 色调, 额外class) */
  XA.art = (g, tone, cls) =>
    `<div class="art tone-${tone || 'sage'} ${cls || ''}"><svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${G[g] || G.leaf}</svg></div>`;

  /* ============ 小工具 ============ */
  const pad = (n) => String(n).padStart(2, '0');
  const WK = ['日', '一', '二', '三', '四', '五', '六'];
  XA.$ = (s, r) => (r || document).querySelector(s);
  XA.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  XA.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  XA.money = (n) => String(Number(Number(n).toFixed(2)));
  XA.wan = (n) => (n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, '') + '万' : String(n));
  XA.hash = (str) => {
    let h = 7;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0x7fffffff;
    return h;
  };
  XA.uid = (p) => (p || '') + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10);
  XA.d = {
    add: (n, base) => { const d = new Date(base || Date.now()); d.setDate(d.getDate() + n); return d; },
    key: (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    fromKey: (k) => { const a = k.split('-').map(Number); return new Date(a[0], a[1] - 1, a[2]); },
    md: (d) => `${d.getMonth() + 1}月${d.getDate()}日`,
    ymd: (d) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`,
    wk: (d) => '周' + WK[d.getDay()],
    full: (iso) => { const d = new Date(iso); return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`; },
    stamp: (iso) => { const d = new Date(iso); if (Number.isNaN(d.getTime())) return ''; return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`; },
    nice: (k) => {
      const d = XA.d.fromKey(k), t = XA.d.key(new Date());
      const rel = k === t ? '今天' : k === XA.d.key(XA.d.add(1)) ? '明天' : k === XA.d.key(XA.d.add(2)) ? '后天' : XA.d.wk(d);
      return `${XA.d.ymd(d)}（${rel}）`;
    },
  };

  /* 仿二维码 / 条形码（仅视觉示意） */
  XA.qr = (seed) => {
    const N = 25;
    let s = XA.hash(String(seed)) || 1;
    const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
    let r = '';
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if ((x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8)) continue;
      if (rnd() > 0.52) r += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    return `<svg class="qr" viewBox="-1 -1 ${N + 2} ${N + 2}" shape-rendering="crispEdges" fill="#111">${r}${finder(0, 0)}${finder(N - 7, 0)}${finder(0, N - 7)}</svg>`;
  };
  XA.barcode = (seed) => {
    let s = XA.hash(String(seed)) || 1, x = 0, r = '';
    const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    while (x < 196) { const w = 1 + Math.floor(rnd() * 3); r += `<rect x="${x}" y="0" width="${w}" height="40"/>`; x += w + 1 + Math.floor(rnd() * 3); }
    return `<svg class="barcode" viewBox="0 0 200 40" preserveAspectRatio="none" fill="#111">${r}</svg>`;
  };

  /* ============ 本地状态 ============ */
  const KEY = 'xa_proto_v17';
  const iso = (dayOffset, h) => { const d = XA.d.add(dayOffset); d.setHours(h || 10, 12, 0, 0); return d.toISOString(); };
  const defaults = () => ({
    loggedIn: false,
    careMode: false,
    user: { name: '林阿姨', phone: '138****6608', growth: 1280 },
    points: 860,
    ledger: [
      { change: 5, note: '每日签到', at: iso(-1, 8) },
      { change: 59, note: '购物实付积分', at: iso(-2, 15) },
      { change: 50, note: '到店核销完成（抖音团购券）', at: iso(-3, 16) },
      { change: 1, note: '阅读内容', at: iso(-2, 9) },
      { change: 50, note: '到店核销完成', at: iso(-9, 16) },
      { change: 129, note: '微信小店订单补登', at: iso(-16, 20) },
      { change: 68, note: '购物实付积分', at: iso(-20, 11) },
    ],
    sign: { last: XA.d.key(XA.d.add(-1)), streak: 2 },
    constitution: null,
    test: { started: false, answers: [] },
    cart: [],
    orders: [
      { id: 'XA2611080017', status: 'shipped', items: [{ pid: 'p3', opts: [0], qty: 1, price: 59 }], goods: 59, freight: 0, off: 0, amount: 59, points: 59, source: 'video', at: iso(-2, 15) },
      { id: 'XA2610210042', status: 'done', items: [{ pid: 'p1', opts: [1, 0], qty: 1, price: 68 }], goods: 68, freight: 0, off: 0, amount: 68, points: 68, source: 'feed', at: iso(-20, 11) },
    ],
    appts: [],
    waitlist: [],
    signups: [],
    claim: { claimed: ['q0'], pending: [] }, // 第三方电商订单：已扫积分码补登的订单 / 用订单号提交待审核的订单
    gpUsed: [], // 已在门店核销的团购券码
    wish: [], // "希望接入"的未接入门店
    onboarding: { wecom: false, pack: false },
    coupons: [
      { id: 'c1', name: '新人专享券', amount: 10, min: 59, scope: 'goods', used: false, expire: XA.d.key(XA.d.add(20)) },
      { id: 'c2', name: '晓艾家到店服务券', amount: 30, min: 198, scope: 'store', used: false, expire: XA.d.key(XA.d.add(45)) },
    ],
    likes: {},
    favs: {},
    myPlans: [], // 我的配穴：用户从穴位收藏保存的艾灸组合 [{id,name,ids,at}]
    follows: {}, // 已关注的内容账号 id
    courses: [],
    membership: null, // 晓艾家会籍（门店自己的付费会籍）
    plus: null, // 晓艾会 Plus：{ since, expire }
    plusPack: '',
    plusGifts: 0,
    perks: [], // 已匹配领取的门店会籍 / 增值权益：{ id, via: 'plus' | 'lv', at }
    invite: { records: [], tiers: [] }, // 邀请有礼：好友记录 / 已领阶梯
    groups: [], // 我发起或参与的拼团
    ogJoined: [], // 已参加过的公开拼团 id
    redpack: {}, // 下单红包进度 { [orderId]: { n, done } }
    promoter: { status: 'none', invited: 0, total: 0, balance: 0, records: [] },
    searchHistory: ['足三里', '艾条'],
  });
  const load = () => {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.user) return Object.assign(defaults(), s); } catch (e) {}
    return defaults();
  };
  XA.state = load();
  if (!XA.state.follows) XA.state.follows = {};
  XA.save = () => { try { localStorage.setItem(KEY, JSON.stringify(XA.state)); } catch (e) {} };
  XA.reset = () => { try { localStorage.removeItem(KEY); } catch (e) {} location.hash = '#/home'; location.reload(); };

  /* 晓艾会 = 会员价值总称
   * ① 成长会员（免费）：消费/活跃攒成长值 → 普通 / 白银 / 黄金 / 钻石
   * ② Plus（付费权益包）：花钱直接拿到最大化权益；目标是发展更多 Plus
   */
  XA.LEVELS = [
    { lv: 1, short: '普通', name: '普通会员', min: 0 },
    { lv: 2, short: '白银', name: '白银会员', min: 1000 },
    { lv: 3, short: '黄金', name: '黄金会员', min: 3000 },
    { lv: 4, short: '钻石', name: '钻石会员', min: 8000 },
  ];
  XA.level = () => { const g = XA.state.user.growth; return XA.LEVELS.filter((l) => g >= l.min).pop(); };
  XA.levelOf = (n) => XA.LEVELS[(n || 1) - 1];
  XA.isPlus = () => { const p = XA.state.plus; return !!(XA.state.loggedIn && p && p.expire >= XA.d.key(new Date())); };
  XA.freeShip = () => XA.state.loggedIn && (XA.isPlus() || XA.level().lv >= 3);
  XA.ptsMult = () => (XA.state.loggedIn && (XA.isPlus() || XA.level().lv >= 4) ? 2 : 1);
  XA.addPoints = (change, note, growth) => {
    const s = XA.state;
    s.points += change;
    s.ledger.unshift({ change, note, at: new Date().toISOString() });
    if (growth) s.user.growth += growth;
    XA.save();
  };

  /* ============ 通用弹层 ============ */
  const overlay = () => XA.$('#overlay');
  let toastTimer;
  XA.toast = (msg, ok) => {
    XA.$$('.toast').forEach((t) => t.remove());
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = (ok ? `<div class="toast-ic">${XA.icon('check')}</div>` : '') + `<div>${msg}</div>`;
    overlay().appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), ok ? 1800 : 2200);
  };

  const mount = (inner, opt) => {
    const el = document.createElement('div');
    el.className = 'ov';
    el.innerHTML = `<div class="scrim"></div>${inner}`;
    overlay().appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
    const close = () => {
      if (el._closed) return;
      el._closed = true;
      el.classList.remove('show');
      setTimeout(() => el.remove(), 260);
      opt && opt.onClose && opt.onClose();
    };
    el._close = close;
    el.querySelector('.scrim').onclick = () => { if (!opt || opt.closable !== false) close(); };
    const x = el.querySelector('.sheet-x');
    if (x) x.onclick = close;
    return el;
  };

  /* 底部抽屉（半屏） */
  XA.sheet = (opt) => {
    const close = opt.hideClose ? '' : `<button class="sheet-x" aria-label="关闭">${XA.icon('x')}</button>`;
    const hd = opt.title != null ? `<div class="sheet-hd ${opt.titleCls || ''}"><span>${opt.title}</span>${close}</div>` : '';
    const el = mount(`<div class="sheet ${opt.cls || ''}">${hd}<div class="sheet-bd">${opt.html || ''}</div>${opt.footer ? `<div class="sheet-ft">${opt.footer}</div>` : ''}</div>`, opt);
    return el;
  };
  XA.closeSheet = () => { const els = XA.$$('.ov'); const last = els[els.length - 1]; if (last) last._close(); };
  XA.closeAll = () => XA.$$('.ov').forEach((e) => e._close());

  /* 确认对话框（微信风格：左取消、右确认） */
  XA.modal = (opt) => {
    const el = mount(
      `<div class="dialog">
        ${opt.title ? `<div class="dialog-title">${opt.title}</div>` : ''}
        ${opt.content ? `<div class="dialog-content">${opt.content}</div>` : ''}
        <div class="dialog-btns">
          ${opt.cancelText === false ? '' : `<button class="dialog-btn" data-r="0">${opt.cancelText || '取消'}</button>`}
          <button class="dialog-btn ${opt.danger ? 'danger' : 'primary'}" data-r="1">${opt.confirmText || '确定'}</button>
        </div>
      </div>`,
      { closable: false }
    );
    XA.$$('.dialog-btn', el).forEach((b) => (b.onclick = () => {
      el._close();
      if (b.dataset.r === '1') opt.onConfirm && opt.onConfirm();
      else opt.onCancel && opt.onCancel();
    }));
  };

  /* 微信支付（模拟） */
  const PAYMENT_ENABLED = false;
  XA.pay = (opt) => {
    if (!PAYMENT_ENABLED) return XA.toast('本程序暂不支持付款');
    const el = XA.sheet({
      title: `<span class="row gap8"><span class="logo-dot">艾</span>晓艾</span>`,
      cls: 'pay-sheet',
      html: `<div class="pay">
        <div class="pay-title">${opt.title || '订单支付'}</div>
        <div class="pay-amt"><small>¥</small>${Number(opt.amount).toFixed(2)}</div>
        <div class="pay-row"><span>支付方式</span><span class="row gap6">零钱 ${XA.icon('right', 'ic-s')}</span></div>
        <button class="btn btn-wx btn-block" id="payGo">确认支付</button>
        <div class="tiny faint center mt8">演示环境，不会产生真实扣款</div>
      </div>`,
    });
    XA.$('#payGo', el).onclick = function () {
      this.disabled = true;
      this.textContent = '支付中…';
      setTimeout(() => { el._close(); opt.onSuccess && opt.onSuccess(); }, 800);
    };
  };

  XA.recordPlus = (renew, paymentId) => {
    const s = XA.state, today = XA.d.key(new Date());
    s.plus = { since: renew ? s.plus.since : today, expire: XA.d.key(XA.d.add(XA.data.plus.days, renew ? XA.d.fromKey(s.plus.expire) : new Date())) };
    s.orders.unshift({ id: XA.uid('XA'), paymentId, kind:'plus', title:'晓艾会 Plus 会员（1 年）', art:['leaf','night'], amount:XA.data.plus.price, points:0, status:'done', at:new Date().toISOString() });
  };
  XA.purchase = ({title, quote, success, deferPlus = false}) => {
    if (!PAYMENT_ENABLED) return XA.toast('本程序暂不支持付款');
    const pay = (bundle) => {
      const pricing = quote(bundle);
      const fee = bundle ? XA.data.plus.price : 0;
      XA.pay({title: title + (bundle ? ' + 一年 Plus' : ''), amount: pricing.amount + fee, onSuccess: () => {
        const paymentId = XA.uid('P');
        if (bundle && !deferPlus) XA.recordPlus(false, paymentId);
        success(pricing, {paymentId, plusFee:fee});
      }});
    };
    if (XA.isPlus()) return pay(false);
    const direct = quote(false), member = quote(true), fee = XA.data.plus.price;
    const diff = Math.round((direct.amount-member.amount)*100)/100;
    const difference = diff > 0 ? `本单省 ¥${XA.money(diff)}` : diff < 0 ? `用券后比直接购买多 ¥${XA.money(-diff)}` : '本单价格相同';
    const el = XA.sheet({title:'选择购买方式', html:`<div class="purchase-options">
      <button data-bundle="no"><span><b>直接购买</b><small>${direct.detail}</small></span><strong>¥${XA.money(direct.amount)}</strong></button>
      <button data-bundle="yes"><span><b>开通一年 Plus 一起买</b><small>${member.detail}</small><small>年费 ¥${fee} · ${difference}</small></span><strong>¥${XA.money(member.amount+fee)}</strong></button>
      </div>`});
    el.querySelectorAll('[data-bundle]').forEach(b => b.onclick = () => {
      if (el._closed) return;
      el._close(); pay(b.dataset.bundle==='yes');
    });
  };

  /* 订阅消息授权（模拟微信一次性订阅弹窗） */
  XA.subscribe = (items, done) => {
    const el = XA.sheet({
      closable: false,
      cls: 'sub-sheet',
      html: `<div class="sub">
        <div class="sub-app"><span class="logo-dot">艾</span> 晓艾 <span class="faint">申请</span></div>
        <div class="sub-title">发送一次以下消息</div>
        ${items.map((t) => `<div class="sub-item">${XA.icon('check')}<span>${t}</span></div>`).join('')}
        <div class="row gap12 mt16">
          <button class="btn btn-gray grow" data-r="0">取消</button>
          <button class="btn btn-wx grow" data-r="1">允许</button>
        </div>
      </div>`,
    });
    XA.$$('[data-r]', el).forEach((b) => (b.onclick = () => { el._close(); done && done(b.dataset.r === '1'); }));
  };

  /* 登录（微信手机号快捷登录，模拟） */
  XA.login = (done, reason) => {
    const el = XA.sheet({
      title: '',
      html: `<div class="login">
        <div class="logo-lg">艾</div>
        <div class="login-title">登录晓艾</div>
        <div class="muted center">${XA.esc(reason || '登录后可预约门店、查看订单、享晓艾会会员权益')}</div>
        <button class="btn btn-wx btn-block mt20" id="loginGo">微信手机号注册 / 登录</button>
        <button class="btn btn-ghost btn-block mt8" onclick="XA.closeSheet()">暂不登录</button>
        <div class="tiny faint center mt12">登录即表示同意《用户协议》《隐私政策》</div>
      </div>`,
    });
    XA.$('#loginGo', el).onclick = () => {
      el._close();
      XA.phoneAuth(() => {
        try { XA.memberSession?.(); }
        catch (e) { XA.tmp.memberSessionError = e.message; }
        XA.state.loggedIn = true;
        XA.save();
        XA.toast('登录成功', true);
        done ? done() : XA.refresh();
      });
    };
  };
  /* 微信手机号授权弹窗（模拟） */
  XA.phoneAuth = (done) => {
    const el = XA.sheet({
      closable: false,
      cls: 'sub-sheet',
      html: `<div class="sub">
        <div class="sub-app"><span class="logo-dot">艾</span> 晓艾 <span class="faint">申请</span></div>
        <div class="sub-title">获取并验证你的手机号</div>
        <div class="phone-opt"><div><div class="bold" style="font-size:1.25rem">138****6608</div><div class="tiny faint">微信绑定号码</div></div>${XA.icon('check')}</div>
        <div class="row gap12 mt16">
          <button class="btn btn-gray grow" data-r="0">不允许</button>
          <button class="btn btn-wx grow" data-r="1">允许</button>
        </div>
      </div>`,
    });
    XA.$$('[data-r]', el).forEach((b) => (b.onclick = () => { el._close(); if (b.dataset.r === '1') done && done(); }));
  };
  XA.needLogin = (fn, reason) => { if (XA.state.loggedIn) fn(); else XA.login(fn, reason); };
  const LOOK_PAGES = new Set(['home', 'video', 'community', 'store', 'me', 'search', 'catalog', 'goods', 'formula', 'article', 'note', 'course', 'lesson', 'product', 'brand', 'creator', 'topic', 'acupoints', 'acupoint', 'symptoms', 'symptom', 'store-detail', 'solar', 'profile', 'settings', 'notfound', 'journal', 'journal-history', 'review', 'pointfav', 'ask', 'timer', 'timer-run', 'moxa-origin', 'moxa-guide', 'moxa-ban', 'vsearch', 'csearch', 'vfollows']);
  const pageOf = (path) => {
    const h = String(path || '').replace(/^#\/?/, '');
    const i = h.indexOf('?');
    return (i < 0 ? h : h.slice(0, i)) || 'home';
  };
  XA.pageNeedsLogin = (path) => !LOOK_PAGES.has(pageOf(path));
  const LOGIN_REASON = '登录后即可使用';

  /* 转发（模拟微信分享面板） */
  XA.share = (title) => {
    XA.sheet({
      title: '分享给朋友',
      html: `<div class="share-grid">
        <button onclick="XA.closeSheet();XA.toast('已转发给微信好友（演示）',true)"><span class="share-ic wx">${XA.icon('share')}</span>微信好友</button>
        <button onclick="XA.closeSheet();XA.toast('已分享到朋友圈（演示）',true)"><span class="share-ic pyq">${XA.icon('compass')}</span>朋友圈</button>
        <button onclick="XA.closeSheet();XA.toast('海报已保存到相册（演示）',true)"><span class="share-ic">${XA.icon('image')}</span>保存海报</button>
      </div>
      <div class="tiny faint center" style="padding:4px 0 8px">${XA.esc(title || '')}</div>`,
    });
  };

  /* 企微二维码（私域连接） */
  XA.wecom = (title, onDone) => {
    XA.sheet({
      title: title || '添加养生顾问',
      onClose: onDone,
      html: `<div class="center" style="padding:8px 0 16px">
        <div class="qr-box">${XA.qr('wecom-xiaoai')}</div>
        <div class="bold mt12">长按识别二维码，添加企业微信</div>
        <div class="muted small mt4">顾问一对一答疑，还能加入晓艾养生交流群</div>
        <button class="btn btn-primary btn-block mt16" onclick="XA.closeSheet();XA.toast('已添加（演示）',true)">我已添加</button>
      </div>`,
    });
  };

  /* ============ 路由 ============ */
  const routes = {};
  XA.TABS_FULL = [
    { name: 'home', label: '首页', icon: 'home' },
    { name: 'video', label: '视频', icon: 'video' },
    { name: 'community', label: '社区', icon: 'compass' },
    { name: 'store', label: '门店', icon: 'store' },
    { name: 'me', label: '我的', icon: 'user' },
  ];
  /* 长辈模式：只留核心 Tab，避免信息过载 */
  XA.TABS_CARE = [
    { name: 'home', label: '首页', icon: 'home' },
    { name: 'store', label: '门店', icon: 'store' },
    { name: 'timer', label: '计时', icon: 'timer' },
    { name: 'me', label: '我的', icon: 'user' },
  ];
  XA.isCare = () => !!XA.state.careMode;
  XA.tabs = () => (XA.isCare() ? XA.TABS_CARE : XA.TABS_FULL);
  const isTab = (n) => XA.tabs().some((t) => t.name === n);
  XA.page = (name, def) => { routes[name] = def; };

  let stack = [];
  const scrolls = {};
  let cur = null;
  let replacing = false;

  const parse = (hash) => {
    const h = (hash || '').replace(/^#\/?/, '') || 'home';
    const i = h.indexOf('?');
    const name = i < 0 ? h : h.slice(0, i);
    const q = {};
    if (i >= 0) new URLSearchParams(h.slice(i + 1)).forEach((v, k) => (q[k] = v));
    return { name, q, key: '#/' + h };
  };
  XA.go = (path, replace) => {
    if (['course', 'lesson', 'my-courses'].includes(pageOf(path))) return XA.toast('课程暂不可用');
    if (!XA.state.loggedIn && XA.pageNeedsLogin(path)) return XA.login(() => XA.go(path, replace), LOGIN_REASON);
    const h = path.charAt(0) === '#' ? path : '#/' + path;
    if (h === location.hash) return XA.refresh();
    if (replace) { replacing = true; location.replace(h); } else location.hash = h;
  };
  XA.back = () => { if (cur && cur.name === 'catalog') XA.go('home'); else if (stack.length > 1) history.back(); else XA.go('home'); };
  XA.current = () => cur;

  const render = (dir) => {
    const p = parse(location.hash);
    /* 艾灸计时是独立工具：从入口进入（非页内刷新）且无预置穴位时重置为空方案，不沿用上次的症状方案 */
    if (p.name === 'timer' && dir !== 'none' && !p.q.ids && !p.q.sym) XA.tmp.tm = null;
    let def = routes[p.name] || routes.notfound;
    const course = p.name === 'lesson' ? XA.data.course(p.q.c) : null;
    if (['course', 'lesson', 'my-courses'].includes(p.name) || (p.name === 'product' && !XA.data.product(p.q.id)) ||
        (p.name === 'course' && !XA.data.course(p.q.id)) ||
        (p.name === 'lesson' && (!course?.lessons[p.q.i] || (!course.lessons[p.q.i].trial && !XA.state.courses.includes(course.id))))) {
      def = {title:'内容暂不可用',render:()=>'<div class="sec card">该内容暂不可访问。</div>'};
    }
    if (cur && cur.def.unmount) cur.def.unmount();
    cur = { name: p.name, q: p.q, key: p.key, def };
    const tab = isTab(p.name);
    const app = XA.$('#app'), view = XA.$('#view');
    app.className = 'app nav-' + (def.nav || 'bar') + (def.dark ? ' dark' : '') + (tab ? ' has-tab' : '');
    const title = typeof def.title === 'function' ? def.title(p.q) : def.title || '';
    XA.$('#nav').innerHTML = def.nav === 'none' ? '' :
      `<div class="nav-in">${tab ? '' : `<button class="nav-back" data-back aria-label="返回">${XA.icon('left')}</button>`}<div class="nav-title">${title}</div></div>`;
    view.innerHTML = `<div class="page ${dir === 'push' ? 'in-push' : dir === 'back' ? 'in-back' : dir === 'tab' ? 'in-fade' : ''}">${def.render(p.q)}</div>`;
    XA.$('#footer').innerHTML = def.footer ? def.footer(p.q) || '' : '';
    XA.$('#tabbar').innerHTML = XA.tabs().map((t) => `<button class="tab ${t.name === p.name ? 'on' : ''}" data-go="${t.name}">${XA.icon(t.icon)}<span>${t.label}</span></button>`).join('');
    XA.updateCartReminder(p.name);
    view.scrollTop = dir === 'back' || dir === 'tab' ? scrolls[p.key] || 0 : 0;
    if (def.mounted) def.mounted(p.q, view);
    XA.onRoute && XA.onRoute(p);
  };
  /* 原地刷新当前页（保持滚动位置） */
  XA.refresh = () => { const v = XA.$('#view'); const st = v.scrollTop; render('none'); v.scrollTop = st; };

  window.addEventListener('hashchange', () => {
    if (!document.getElementById('view')) return;
    const p = parse(location.hash);
    if (!XA.state.loggedIn && XA.pageNeedsLogin(p.name)) {
      const backTo = stack.length ? stack[stack.length - 1] : '#/home';
      replacing = true;
      location.replace(backTo === p.key ? '#/home' : backTo);
      XA.login(() => XA.go(p.key.replace(/^#\/?/, '')), LOGIN_REASON);
      return;
    }
    if (cur) scrolls[cur.key] = XA.$('#view').scrollTop;
    let dir = 'push';
    const isBack = stack.length > 1 && stack[stack.length - 2] === p.key && !replacing;
    if (isTab(p.name)) { stack = [p.key]; dir = isBack ? 'back' : 'tab'; }
    else if (replacing) { stack[stack.length - 1] = p.key; dir = 'none'; }
    else if (isBack) { stack.pop(); dir = 'back'; }
    else stack.push(p.key);
    replacing = false;
    XA.closeAll();
    render(dir);
  });

  document.addEventListener('click', (e) => {
    if (!XA.state.loggedIn && !e.target.closest('#guide, .login, .sub')) {
      const goEl = e.target.closest('[data-go]');
      if (goEl && XA.pageNeedsLogin(goEl.getAttribute('data-go'))) {
        e.preventDefault();
        e.stopPropagation();
        XA.login(() => XA.go(goEl.getAttribute('data-go')), LOGIN_REASON);
        return;
      }
      if (!goEl && !e.target.closest('[data-back], [data-model], [data-view], .home-dots, .home-loc, .home-loc-toggle, .chips.pad, .sheet-x, .scrim')) {
        const clickable = e.target.closest('#view button, #view [onclick], #footer button, #footer [onclick]');
        const code = clickable ? (clickable.getAttribute('onclick') || '') : '';
        const looking = /XA\.act\.(homeTab|askLocation|locToggle|browseCity|sfSet|sfReset|sfCity|acuPart|nearestStores|search|ptSheet|claimWelcome|profileCare|reviewSpan|vTab|cTab|cTopic|draftTopic|vlike|vfav|follow|like|fav|shareNeed|openVideo|openFoundVideo|cSearch|cSearchTab|cClearHist|cGuess|cSort|cBioOpen|vSearch|vSearchTab|vClearHist|vGuess|openTopic|goMeituan|navTo|call|buyExternal)\(|XA\.login\(|XA\.needLogin\(/.test(code);
        const openTool = cur && ['journal', 'review', 'pointfav', 'ask', 'timer', 'timer-run'].includes(cur.name);
        if (clickable && !openTool && !looking && !(clickable.matches('input, textarea, select') && !XA.pageNeedsLogin(cur && cur.name))) {
          e.preventDefault();
          e.stopPropagation();
          XA.login(null, LOGIN_REASON);
          return;
        }
      }
    }
    const b = e.target.closest('[data-back]');
    if (b) return XA.back();
    const g = e.target.closest('[data-go]');
    if (g) {
      const inner = e.target.closest('button, a');
      if (inner && inner !== g) return;
      e.preventDefault();
      XA.go(g.getAttribute('data-go'));
    }
  }, true);

  XA.start = () => {
    const p = parse(location.hash);
    if (!XA.state.loggedIn && XA.pageNeedsLogin(p.name)) {
      replacing = true;
      location.replace('#/home');
      stack = ['#/home'];
      document.documentElement.classList.toggle('care', !!XA.state.careMode);
      render('none');
      XA.login(() => XA.go(p.key.replace(/^#\/?/, '')), LOGIN_REASON);
      return;
    }
    stack = [p.key];
    document.documentElement.classList.toggle('care', !!XA.state.careMode);
    render('none');
  };
  XA.setCare = (on) => {
    XA.state.careMode = !!on;
    XA.save();
    document.documentElement.classList.toggle('care', !!on);
    /* 切到长辈模式时，离开非核心页，避免迷路 */
    const keep = XA.tabs().map((t) => t.name).concat(['settings', 'product', 'cart', 'checkout', 'orders', 'appts', 'appt', 'booking', 'store-detail', 'member-code', 'points', 'coupons', 'xahui', 'plus', 'perks', 'test', 'profile', 'acupoints', 'symptoms', 'timer-run', 'pay-result', 'creator', 'note', 'topic']);
    if (on && cur && !keep.includes(cur.name)) XA.go('home');
    else {
      XA.refresh();
      XA.onRoute && XA.onRoute(cur);
    }
  };

  XA.page('notfound', { title: '页面走丢了', render: () => `<div class="empty"><div class="empty-t">页面不存在</div><button class="btn btn-primary mt16" data-go="home">回到首页</button></div>` });
})();
