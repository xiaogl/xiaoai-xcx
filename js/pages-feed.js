/* pages-feed.js —— 视频 feed（挂车）/ 社区浏览态（瀑布流、笔记、话题） */
(function () {
  const D = XA.data, icon = XA.icon, ui = XA.ui, esc = XA.esc;
  const vProfile = () => {
    if (!XA.state.vProfile) XA.state.vProfile = { name: '林阿姨', bio: '在家慢慢灸，记录每一次温热。' };
    return XA.state.vProfile;
  };
  const C_BIO = '分享居家养生的小笔记。\n立冬之后，艾灸盒就放在沙发边，想起来灸一会儿关元。温热就停，不追求烫。';
  const cProfile = () => {
    if (!XA.state.cProfile) XA.state.cProfile = { name: '林阿姨', bio: C_BIO };
    else if (XA.state.cProfile.bio === '分享居家养生的小笔记。') {
      XA.state.cProfile.bio = C_BIO;
      XA.save();
    }
    return XA.state.cProfile;
  };
  const AV_TONES = ['#d7ebe1', '#f3e2c4', '#f6ddd4', '#d9e6f0', '#e6e0f2'];
  const avTone = (p) => AV_TONES[(p && p.av) || 0] || AV_TONES[0];
  const NAME_WINDOW = 30 * 24 * 60 * 60 * 1000;
  const nameChanges = (p) => (p.nameChanges || []).filter((t) => Date.now() - Number(t) < NAME_WINDOW);
  const nameLeft = (p) => Math.max(0, 3 - nameChanges(p).length);
  const ensureFollows = () => {
    if (!XA.state.follows) XA.state.follows = {};
    if (!XA.state.followSeeded) {
      if (!XA.state.follows.lqh) XA.state.follows.lqh = true;
      if (!XA.state.follows.xaj) XA.state.follows.xaj = true;
      XA.state.followSeeded = true;
      XA.save();
    }
  };
  const followedCreators = () => {
    ensureFollows();
    return Object.keys(XA.state.follows).filter((id) => XA.state.follows[id]).map((id) => D.creator(id)).filter(Boolean);
  };
  const graphemes = (s) => {
    const str = String(s == null ? '' : s);
    try {
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        return Array.from(new Intl.Segmenter('zh', { granularity: 'grapheme' }).segment(str), (x) => x.segment);
      }
    } catch (e) { /* 旧环境按码点计 */ }
    return Array.from(str);
  };
  const clipChars = (s, n) => graphemes(s).slice(0, n).join('');
  XA.act.clipField = (el, n) => {
    if (!el || el._composing) return;
    const next = clipChars(el.value, Number(n) || 0);
    if (next !== el.value) el.value = next;
  };
  const fieldHooks = (n) => `oninput="XA.act.clipField(this,${n})" oncompositionstart="this._composing=1" oncompositionend="this._composing=0;XA.act.clipField(this,${n})"`;
  const avHtml = (p) => (p && p.photo ? `<img src="${p.photo}" alt="">` : esc(graphemes(p && p.name || '我')[0] || '我'));
  const askAlbum = (done) => {
    if (XA.tmp.albumOk) { done(); return; }
    const el = XA.sheet({
      closable: false,
      cls: 'sub-sheet',
      html: `<div class="sub">
        <div class="sub-app"><span class="logo-dot">艾</span> 晓艾 <span class="faint">申请</span></div>
        <div class="sub-title">获取您的相册权限</div>
        <div class="muted">用于从手机相册选择视频和头像。同意后才会打开相册。</div>
        <div class="row gap12 mt16">
          <button class="btn btn-gray grow" data-r="0">不允许</button>
          <button class="btn btn-wx grow" data-r="1">允许</button>
        </div>
      </div>`,
    });
    XA.$$('[data-r]', el).forEach((b) => (b.onclick = () => { el._close(); if (b.dataset.r === '1') { XA.tmp.albumOk = true; done(); } }));
  };
  XA.act.pickAlbum = (inputId) => askAlbum(() => { const input = XA.$('#' + inputId); if (input) input.click(); });
  const ownVideo = (v) => v.slot === 'mine' || (XA.state.myVideos || []).some((x) => x.id === v.id);
  const videoAuthor = (v) => (ownVideo(v) ? vProfile().name : v.author);

  /* ================= 视频：竖屏沉浸式，上滑切换，购物袋挂车 ================= */
  const bindLabel = (v) => {
    const b = v.binds.find(b => b.type === 'product' ? D.product(b.id) : b.type === 'course' ? D.course(b.id) : true);
    if (!b) return '暂无关联资源';
    if (b.type === 'store') return `${icon('store', 'ic-s')}<span>晓艾家 · 预约到店体验</span>`;
    if (b.type === 'course') return `${icon('book', 'ic-s')}<span>相关课程</span>`;
    const p = D.product(b.id), n = v.binds.length;
    return `${icon('bag', 'ic-s')}<span>视频同款 · ${p.short}${n > 1 ? ` 等 ${n} 件` : ''}</span><b>¥${XA.money(XA.memberPrice(p, XA.defaultOpts(p)))}</b>`;
  };
  const vitem = (v, i) => {
    const s = XA.state, liked = s.likes['v_' + v.id], faved = s.favs['v_' + v.id], aid = v.aid || '';
    return `<section class="vitem" data-id="${v.id}">
      ${v.media ? `<div class="vbg">${XA.mediaPreview(v.media)}</div>` : `<div class="vbg" onclick="XA.act.vtoggle(this)">${ui.cover(v, 'vart')}<div class="vhint-demo">视频画面示意</div></div>`}
      <div class="vpaused">${icon('play')}</div>
      <div class="vside">
        <button class="vavatar" ${aid ? `data-go="creator?id=${aid}"` : 'type="button"'} aria-label="查看账号">${esc(videoAuthor(v).slice(0, 1))}</button>
        <button class="vact ${liked ? 'on' : ''}" onclick="XA.act.vlike('${v.id}',this)">${icon('heart')}<span>${XA.wan(v.likes + (liked ? 1 : 0))}</span></button>
        <button class="vact ${faved ? 'on gold' : ''}" onclick="XA.act.vfav('${v.id}',this)">${icon('star')}<span>收藏</span></button>
        <button class="vact" onclick="XA.act.shareNeed('${esc(v.title)}')">${icon('share')}<span>转发</span></button>
      </div>
      <div class="vinfo">
        <button class="vcart" onclick="XA.act.vbag('${v.id}')">${bindLabel(v)}${icon('right', 'ic-s')}</button>
        <button class="vauthor" ${aid ? `data-go="creator?id=${aid}"` : 'type="button"'}>@${esc(videoAuthor(v))} <span class="vbadge">${esc(v.badge)}</span></button>
        <div class="vtitle">${esc(v.title)}</div>
        <div class="vnote">养生科普，仅供参考，不能替代医疗诊断</div>
      </div>
      ${i === 0 ? `<div class="vswipe">${icon('down')}<span>上滑看下一条</span></div>` : ''}
      <div class="vprog"><i></i></div>
    </section>`;
  };
  XA.act.vtoggle = (el) => el.closest('.vitem').classList.toggle('paused');
  XA.act.vlike = (id, btn) => XA.needLogin(() => {
    const l = XA.state.likes, k = 'v_' + id, v = D.videoOf(id) || (XA.state.myVideos || []).find((x) => x.id === id);
    if (!v) return;
    l[k] = !l[k]; XA.save();
    btn.classList.toggle('on', l[k]);
    btn.querySelector('span').textContent = XA.wan(v.likes + (l[k] ? 1 : 0));
  });
  XA.act.vfav = (id, btn) => XA.needLogin(() => {
    const f = XA.state.favs, k = 'v_' + id;
    f[k] = !f[k]; XA.save();
    btn.classList.toggle('on', f[k]); btn.classList.toggle('gold', f[k]);
    XA.toast(f[k] ? '已收藏' : '已取消收藏', f[k]);
  });
  const gateTab = (key, tab) => {
    if (tab === 'pick' || XA.state.loggedIn) { XA.tmp[key] = tab; XA.refresh(); return; }
    XA.needLogin(() => { XA.tmp[key] = tab; XA.refresh(); });
  };
  XA.act.vTab = (tab) => gateTab('vTab', tab);
  XA.act.vMinePane = (id) => { XA.tmp.vMinePane = id; XA.refresh(); };
  XA.act.vGender = (g, btn) => {
    XA.tmp.vGender = g;
    const box = btn && btn.parentElement;
    if (box) box.querySelectorAll('.chip').forEach((el) => el.classList.toggle('on', el === btn));
  };
  const videoList = () => {
    const tab = XA.tmp.vTab || 'pick';
    const pub = D.videos.filter((v) => !v.slot);
    if (tab === 'follow') {
      const f = XA.state.follows || {};
      const seen = new Set();
      return D.videos.filter((v) => v.slot === 'follow').concat(pub.filter((v) => f[v.aid])).filter((v) => (seen.has(v.id) ? false : seen.add(v.id)));
    }
    if (tab === 'mine') return D.videos.filter((v) => v.slot === 'mine').concat(XA.state.myVideos || []);
    return pub;
  };
  /* 挂车抽屉：半屏展示挂载清单，可直接加购或进商详（source=video 归因） */
  XA.act.vbag = (vid) => {
    const v = D.videoOf(vid) || (XA.state.myVideos || []).find((x) => x.id === vid);
    if (!v || !v.binds || !v.binds.length) return XA.toast('这条视频还没有关联商品');
    const rows = v.binds.map((b) => {
      if (b.type === 'product') {
        const p = D.product(b.id); if (!p) return ''; const br = D.brands[p.brand], mp = XA.memberPrice(p, XA.defaultOpts(p));
        return `<div class="bagrow ${p.soldOut ? 'soldout' : ''}">
          <div class="bagrow-main" onclick="XA.closeSheet();XA.go('product?id=${p.id}&source=video&ref=${vid}')">
            ${ui.cover(p, 'bag-img')}
            <div class="grow"><div class="fcard-title">${esc(p.short)}</div><div class="fcard-tags">${ui.brandTag(br)}<span class="faint small">${br.name}</span></div><div class="row gap6">${ui.price(mp)}${mp < p.price ? `<span class="tag tag-gold">${XA.priceTag()}</span>` : ''}</div></div>
          </div>
          ${p.soldOut ? `<span class="btn btn-gray btn-sm" disabled>已售罄</span>` : `<button class="btn btn-primary btn-sm" onclick="XA.act.quickAdd('${p.id}','video')">加入购物车</button>`}
        </div>`;
      }
      if (b.type === 'course') {
        const c = D.course(b.id); if (!c) return "";
        return `<div class="bagrow"><div class="bagrow-main" onclick="XA.closeSheet();XA.go('course?id=${c.id}')">${ui.cover(c, 'bag-img')}<div class="grow"><div class="fcard-title">${esc(c.title)}</div><div class="fcard-tags"><span class="tag tag-outline">课程</span><span class="faint small">${c.teacher}</span></div>${ui.price(c.price)}</div></div><button class="btn btn-tonal btn-sm" onclick="XA.closeSheet();XA.go('course?id=${c.id}')">去试看</button></div>`;
      }
      const sv = D.service(b.id);
      return `<div class="bagrow"><div class="bagrow-main" onclick="XA.closeSheet();XA.go('booking?service=${sv.id}')">${ui.art(sv.art, 'bag-img')}<div class="grow"><div class="fcard-title">${sv.name} · ${sv.dur} 分钟</div><div class="fcard-tags"><span class="tag tag-green">晓艾家</span><span class="faint small">${D.located.status === 'granted' ? '离您最近' : '可预约门店'}：${D.nearest('xaj').name.replace('晓艾家 · ', '')} ${D.kmText(D.nearest('xaj'))}</span></div><div class="row gap6">${ui.price(sv.mprice)}<span class="tag tag-gold">会员价</span></div></div></div><button class="btn btn-primary btn-sm" onclick="XA.closeSheet();XA.go('booking?service=${sv.id}')">去预约</button></div>`;
    }).join('');
    const hasGoods = v.binds.some((b) => b.type === 'product');
    XA.sheet({
      title: hasGoods ? `视频同款（${v.binds.length}）` : '视频相关',
      html: rows,
      footer: hasGoods ? `<button class="btn btn-tonal btn-block" onclick="XA.closeSheet();XA.go('cart')">${icon('cart', 'ic-s')} 去购物车结算<span id="bag-cart-count">${XA.cartCount() ? `（${XA.cartCount()} 件）` : ''}</span></button>` : '',
    });
  };

  const findVideo = (id) => D.videoOf(id) || (XA.state.myVideos || []).find((x) => x.id === id);
  const COVERS = [['moxa', '艾灸', ['moxa', 'sage']], ['bath', '泡脚', ['bath', 'clay']], ['leaf', '节气', ['leaf', 'sage']]];
  XA.act.vClose = () => { delete XA.tmp.vPlay; XA.tmp.vTab = 'mine'; XA.refresh(); };
  XA.act.vCover = (id) => { XA.tmp.vCover = id; XA.refresh(); };
  XA.act.playMine = (id) => { XA.tmp.vPlay = id; XA.refresh(); };
  XA.act.pickVAv = (i) => {
    XA.tmp.vAv = i;
    XA.tmp.vPhoto = '';
    XA.$$('#vpAvs .av-pick').forEach((el, n) => el.classList.toggle('on', n === i));
    const box = XA.$('#vpAv');
    if (box) box.innerHTML = esc(((XA.$('#vpName') && XA.$('#vpName').value) || '我').slice(0, 1));
  };
  XA.act.vPhoto = (input) => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 160;
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        const side = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        XA.tmp.vPhoto = '';
        const prev = vProfile();
        XA.state.vProfile = Object.assign({}, prev, { photo: canvas.toDataURL('image/jpeg', 0.72) });
        XA.save();
        XA.refresh();
        XA.toast('头像已更新');
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  XA.act.cPhoto = (input) => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 160;
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        const side = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        XA.state.cProfile = Object.assign({}, cProfile(), { photo: canvas.toDataURL('image/jpeg', 0.72) });
        XA.save();
        XA.refresh();
        XA.toast('头像已更新');
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  XA.act.vFile = (input) => {
    const file = input.files && input.files[0];
    if (!file) return;
    if (XA.tmp.vFileUrl) URL.revokeObjectURL(XA.tmp.vFileUrl);
    XA.tmp.vFileName = file.name;
    XA.tmp.vFileUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
    const title = XA.$('#vTitle');
    XA.tmp.vTitle = title ? title.value : (XA.tmp.vTitle || '');
    XA.refresh();
  };
  XA.act.saveVProfile = () => {
    const prev = vProfile();
    const draft = XA.tmp.vDraft || {};
    const name = (XA.$('#vpName').value || draft.name || '').trim();
    const bio = (XA.$('#vpBio').value || draft.bio || '').trim();
    if (!name) return XA.toast('请先写个昵称');
    let changes = nameChanges(prev);
    if (name !== prev.name) {
      if (changes.length >= 3) return XA.toast('30 天内昵称只能改 3 次');
      changes = changes.concat(Date.now());
    }
    const photo = XA.tmp.vPhoto != null ? XA.tmp.vPhoto : (prev.photo || '');
    const gender = XA.tmp.vGender != null ? XA.tmp.vGender : (draft.gender != null ? draft.gender : (prev.gender || ''));
    XA.state.vProfile = { name, bio, gender, av: XA.tmp.vAv != null ? XA.tmp.vAv : (prev.av || 0), nameChanges: changes, photo, fans: prev.fans || 0 };
    delete XA.tmp.vAv;
    delete XA.tmp.vPhoto;
    delete XA.tmp.vDraft;
    delete XA.tmp.vGender;
    XA.save();
    XA.toast('已保存');
    XA.back();
  };
  const patchVProfile = (patch) => {
    XA.state.vProfile = Object.assign({}, vProfile(), patch);
    XA.save();
  };
  XA.act.vEditName = () => {
    const p = vProfile();
    const left = nameLeft(p);
    XA.sheet({
      title: '修改名字',
      html: `<input id="vpName" class="input" value="${esc(p.name)}" ${fieldHooks(20)}><div class="faint small mt8">${left ? `30 天内还可修改名字 ${left} 次` : '30 天内的 3 次名字修改已用完'} · 最多 20 个字符</div>`,
      footer: `<button class="btn btn-primary btn-block" onclick="XA.act.saveVName()">保存</button>`,
    });
  };
  XA.act.saveVName = () => {
    const prev = vProfile();
    const name = clipChars((XA.$('#vpName') && XA.$('#vpName').value || '').trim(), 20);
    if (!name) return XA.toast('请先写个昵称');
    let changes = nameChanges(prev);
    if (name !== prev.name) {
      if (changes.length >= 3) return XA.toast('30 天内昵称只能改 3 次');
      changes = changes.concat(Date.now());
    }
    patchVProfile({ name, nameChanges: changes });
    XA.closeSheet();
    XA.toast('已保存');
    XA.refresh();
  };
  XA.act.vEditBio = () => {
    const p = vProfile();
    XA.sheet({
      title: '修改简介',
      html: `<textarea id="vpBio" class="input" rows="4" style="height:auto;min-height:6.5rem;padding:12px 14px;line-height:1.6" ${fieldHooks(80)}>${esc(p.bio || '')}</textarea><div class="faint small mt8">最多 80 个字符，可以换行</div>`,
      footer: `<button class="btn btn-primary btn-block" onclick="XA.act.saveVBio()">保存</button>`,
    });
  };
  XA.act.saveVBio = () => {
    const bio = clipChars((XA.$('#vpBio') && XA.$('#vpBio').value || '').trim(), 80);
    patchVProfile({ bio });
    XA.closeSheet();
    XA.toast('已保存');
    XA.refresh();
  };
  XA.act.vGenderPick = (g) => {
    patchVProfile({ gender: g || '' });
    XA.closeSheet();
    XA.refresh();
  };
  XA.act.vGenderSheet = () => {
    const cur = vProfile().gender || '';
    const row = (id, label) => `<button type="button" class="dy-g-row ${cur === id ? 'on' : ''}" onclick="XA.act.vGenderPick('${id}')">${label}</button>`;
    XA.sheet({ title: '选择性别', html: `${row('男', '男')}${row('女', '女')}${row('', '不展示')}` });
  };
  XA.act.publishVideo = () => XA.needLogin(() => {
    const title = (XA.$('#vTitle').value || '').trim();
    if (!title) return XA.toast('请先写个标题');
    const cover = COVERS.find((c) => c[0] === (XA.tmp.vCover || 'moxa')) || COVERS[0];
    const video = { id: XA.uid('v'), aid: '', slot: 'mine', title, author: vProfile().name, badge: '我的', art: cover[2], likes: 0, binds: [], fileName: XA.tmp.vFileName || '' };
    XA.state.myVideos = (XA.state.myVideos || []).concat(video);
    XA.save();
    if (XA.tmp.vFileUrl) URL.revokeObjectURL(XA.tmp.vFileUrl);
    delete XA.tmp.vCover;
    delete XA.tmp.vFileName;
    delete XA.tmp.vFileUrl;
    delete XA.tmp.vTitle;
    XA.tmp.vTab = 'mine';
    XA.toast('已发布');
    XA.go('video', true);
  });
  let io = null;
  XA.page('video', {
    nav: 'none',
    dark: true,
    render() {
      const tab = XA.tmp.vTab || 'pick';
      const tabBtn = (id, name) => `<button type="button" class="${tab === id ? 'on' : ''}" onclick="XA.act.vTab('${id}')">${name}</button>`;
      const mineLight = tab === 'mine' && !XA.tmp.vPlay;
      const searchBtn = `<button type="button" class="tab-search" data-go="vsearch" aria-label="搜索">${icon('search')}</button>`;
      const tabs = `<div class="vtop ${mineLight ? 'vtop-mine' : ''}">${tabBtn('follow', '关注')}${tabBtn('pick', '精选')}${tabBtn('mine', '我的')}${searchBtn}</div>`;
      if (XA.tmp.vPlay) {
        const v = findVideo(XA.tmp.vPlay);
        if (v) return `<div class="vfeed" id="vfeed">${vitem(v, 1)}</div><button class="vback" onclick="XA.act.vClose()">${icon('left')}返回</button>`;
        delete XA.tmp.vPlay;
      }
      if (tab === 'mine') {
        const p = vProfile();
        const pane = XA.tmp.vMinePane === 'fav' || XA.tmp.vMinePane === 'like' ? XA.tmp.vMinePane : 'work';
        const works = videoList();
        const pool = D.videos.concat(XA.state.myVideos || []);
        const uniq = (list) => list.filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i);
        const saved = uniq(pool.filter((v) => XA.state.favs['v_' + v.id]));
        const liked = uniq(pool.filter((v) => XA.state.likes['v_' + v.id]));
        const shown = pane === 'fav' ? saved : pane === 'like' ? liked : works;
        const likedSum = works.reduce((sum, v) => sum + (v.likes || 0), 0);
        const follows = followedCreators().length;
        const emptyText = pane === 'fav' ? '您还没有收藏的视频' : pane === 'like' ? '您还没有喜欢的视频' : '您还没有发布视频';
        const cell = (v) => `<button type="button" class="dy-cell" onclick="XA.act.${pane !== 'work' && !ownVideo(v) ? `openFoundVideo('${v.id}')` : `playMine('${v.id}')`}">${ui.cover(v, 'dy-art')}<span class="dy-like">${icon('heart', 'ic-xs')}${XA.wan(v.likes || 0)}</span></button>`;
        const grid = shown.length ? `<div class="dy-grid">${shown.map(cell).join('')}</div>` : `<div class="dy-empty">${emptyText}</div>`;
        return `${tabs}<div class="vmine">
          <div class="dy-cover">${XA.art('season', 'dusk', 'dy-cover-art')}</div>
          <div class="dy-hd">
            <div class="social-av dy-av" style="background:${avTone(p)}">${avHtml(p)}</div>
            <div class="dy-name">${esc(p.name)}</div>
          </div>
          <div class="dy-bar">
            <div class="dy-stats">
              <div class="dy-stat"><b>${XA.wan(likedSum)}</b><span>获赞</span></div>
              <button type="button" class="dy-stat" data-go="vfollows"><b>${follows}</b><span>关注</span></button>
              <div class="dy-stat"><b>${XA.wan(p.fans || 0)}</b><span>粉丝</span></div>
            </div>
            <div class="dy-actions">
              <button type="button" class="dy-edit-inline" data-go="vprofile">编辑资料</button>
              <button type="button" class="dy-post" data-go="vpost">发视频</button>
            </div>
          </div>
          <div class="dy-bio">${esc(p.bio || '写一句介绍')}</div>
          <div class="dy-tabs">
            <button type="button" class="${pane === 'work' ? 'on' : ''}" onclick="XA.act.vMinePane('work')">作品</button>
            <button type="button" class="${pane === 'fav' ? 'on' : ''}" onclick="XA.act.vMinePane('fav')">收藏</button>
            <button type="button" class="${pane === 'like' ? 'on' : ''}" onclick="XA.act.vMinePane('like')">喜欢</button>
          </div>
          ${grid}
        </div>`;
      }
      const list = videoList();
      const empty = tab === 'follow'
        ? '关注账号后，这里会显示他们的视频'
        : '您还没有发布视频';
      const body = list.length
        ? list.map(vitem).join('')
        : `<section class="vitem vempty"><div class="vempty-in">${empty}</div></section>`;
      return `<div class="vfeed" id="vfeed">${body}</div>${tabs}`;
    },
    mounted() {
      const mine = (XA.tmp.vTab || 'pick') === 'mine' && !XA.tmp.vPlay;
      XA.$('#app').classList.toggle('dark', !mine);
      const feed = XA.$('#vfeed');
      if (!feed) return;
      if (XA.tmp.vFocus) {
        const el = feed.querySelector(`.vitem[data-id="${XA.tmp.vFocus}"]`);
        if (el) feed.scrollTop = el.offsetTop;
        delete XA.tmp.vFocus;
      } else if (XA.tmp.vScroll) feed.scrollTop = XA.tmp.vScroll;
      io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('playing', e.intersectionRatio > 0.6)), { root: feed, threshold: [0, 0.6, 1] });
      XA.$$('.vitem', feed).forEach((el) => {
        io.observe(el);
        /* 完播奖励：+1 积分，每日上限 5 次 */
        const bar = el.querySelector('.vprog i');
        if (!bar) return;
        bar.addEventListener('animationiteration', () => {
          const s = XA.state, today = XA.d.key(new Date()), id = el.dataset.id;
          if (!s.watch || s.watch.day !== today) s.watch = { day: today, ids: [] };
          if (s.watch.ids.includes(id) || s.watch.ids.length >= 5 || !s.loggedIn) return;
          s.watch.ids.push(id);
          XA.addPoints(1, '视频完播', 1);
          XA.toast('看完视频 +1 积分');
        });
      });
      feed.addEventListener('scroll', () => { XA.tmp.vScroll = feed.scrollTop; const h = XA.$('.vswipe'); if (h && feed.scrollTop > 40) h.remove(); }, { passive: true });
    },
    unmount() { if (io) { io.disconnect(); io = null; } },
  });
  XA.page('vprofile', {
    title: '编辑资料',
    render() {
      const p = vProfile();
      const genderLabel = p.gender === '男' || p.gender === '女' ? p.gender : '不展示';
      return `<div class="dy-ep">
        <div class="dy-cover">${XA.art('season', 'dusk', 'dy-cover-art')}</div>
        <button type="button" class="dy-ep-av" id="vpAv" style="background:${avTone(p)}" onclick="XA.act.pickAlbum('vpPhoto')">${avHtml(p)}<i>${icon('image', 'ic-s')}</i></button>
        <input id="vpPhoto" type="file" accept="image/*" hidden onchange="XA.act.vPhoto(this)">
        <div class="cells dy-ep-list">
          <button type="button" class="cell" onclick="XA.act.vEditName()"><span class="dy-ep-k">名字</span><span class="dy-ep-v ell">${esc(p.name)}</span>${icon('right', 'faint')}</button>
          <button type="button" class="cell" onclick="XA.act.vEditBio()"><span class="dy-ep-k">简介</span><span class="dy-ep-v ell">${esc(p.bio || '介绍一下自己')}</span>${icon('right', 'faint')}</button>
          <button type="button" class="cell" onclick="XA.act.vGenderSheet()"><span class="dy-ep-k">性别</span><span class="dy-ep-v">${genderLabel}</span>${icon('right', 'faint')}</button>
        </div>
      </div>`;
    },
  });
  XA.page('vpost', {
    title: '发视频',
    render() {
      const cover = XA.tmp.vCover || 'moxa';
      const picked = XA.tmp.vFileName ? `<div class="muted small mt8">已从相册选择：${esc(XA.tmp.vFileName)}</div>` : '';
      const preview = XA.tmp.vFileUrl ? `<img class="album-preview" src="${XA.tmp.vFileUrl}" alt="">` : '';
      return `<div class="sec card">
        <input id="vTitle" class="input" maxlength="40" placeholder="写个标题" value="${esc(XA.tmp.vTitle || '')}">
        <div class="field-label">视频</div>
        <button type="button" class="btn btn-tonal btn-block" onclick="XA.act.pickAlbum('vFile')">从相册选择</button>
        <input id="vFile" type="file" accept="video/*,image/*" hidden onchange="XA.act.vFile(this)">
        ${picked}${preview}
        <div class="field-label">封面</div>
        <div class="chips wrap">${COVERS.map((c) => `<button type="button" class="chip ${cover === c[0] ? 'on' : ''}" onclick="XA.act.vCover('${c[0]}')">${c[1]}</button>`).join('')}</div>
      </div>
      <div class="sec faint small">选择时会先询问相册权限。发布后出现在视频「我的」里，仅保存在本机。</div>`;
    },
    footer() { return `<button class="btn btn-primary btn-block" onclick="XA.act.publishVideo()">发布</button>`; },
  });
  XA.page('vfollows', {
    title: '我的关注',
    render() {
      const list = followedCreators();
      if (!list.length) return '<div class="empty">您还没有关注</div>';
      return `<div class="cells sec">${list.map((c) => `<div class="cell" data-go="creator?id=${c.id}">${ui.avatar(c.name)}<div class="cell-bd"><div class="bold">${esc(c.name)}</div><div class="faint small">${esc(c.badge || '')}</div></div><button type="button" class="btn btn-tonal btn-sm" onclick="event.stopPropagation();XA.act.follow('${c.id}')">已关注</button></div>`).join('')}</div>`;
    },
  });
  const vResult = (v) => `<button type="button" class="vgrid-item" onclick="XA.act.openFoundVideo('${v.id}')">${ui.cover(v, 'vgrid-art')}<span class="vgrid-title">${esc(v.title)}</span><span class="vgrid-who faint small ell">${esc(videoAuthor(v))}</span></button>`;
  const hotVideos = () => D.videos.filter((v) => !v.slot).slice().sort((a, b) => (b.likes || 0) - (a.likes || 0));
  XA.act.openFoundVideo = (id) => {
    const v = findVideo(id);
    if (!v) return;
    if (ownVideo(v)) { XA.tmp.vTab = 'mine'; XA.tmp.vPlay = id; delete XA.tmp.vFocus; }
    else if (v.slot === 'follow') { XA.tmp.vTab = 'follow'; XA.tmp.vFocus = id; delete XA.tmp.vPlay; }
    else { XA.tmp.vTab = 'pick'; XA.tmp.vFocus = id; delete XA.tmp.vPlay; }
    XA.go('video');
  };
  XA.act.vSearch = (kw) => {
    kw = String(kw || '').trim();
    if (kw) {
      const h = XA.state.vSearchHistory || [];
      XA.state.vSearchHistory = [kw].concat(h.filter((x) => x !== kw)).slice(0, 8);
      XA.save();
    }
    XA.tmp.vSearchTab = 'all';
    XA.go('vsearch' + (kw ? '?q=' + encodeURIComponent(kw) : ''), XA.current().name === 'vsearch');
  };
  XA.act.vClearHist = () => { XA.state.vSearchHistory = []; XA.save(); XA.refresh(); };
  XA.act.vSearchTab = (id) => { XA.tmp.vSearchTab = id === 'video' || id === 'user' ? id : 'all'; XA.refresh(); };
  XA.act.vGuess = () => { XA.tmp.vGuess = ((XA.tmp.vGuess || 0) + 6) % 12; XA.refresh(); };
  const DY_GUESS = ['足三里怎么找', '睡前泡脚', '肩颈放松', '关元艾灸', '艾灸多久', '手脚冰凉', '三阴交', '到店艾灸', '泡脚水温', '灸后能洗澡吗', '腰酸', '热敷贴'];
  const dyCard = (v) => `<button type="button" class="dy-scard" onclick="XA.act.openFoundVideo('${v.id}')">${ui.cover(v, 'dy-scard-art')}<span class="dy-scard-cap"><span>${esc(v.title)}</span><span class="dy-scard-meta"><i class="ell">${esc(videoAuthor(v))}</i>${icon('heart', 'ic-xs')}${XA.wan(v.likes || 0)}</span></span></button>`;
  /* 抖音热榜：双列瀑布流卡片，封面高度交错形成错落，封面下方标题 + 作者头像/昵称 + 点赞 */
  const dyHotCard = (v, i) => `<button type="button" class="dy-scard dy-hotcard" onclick="XA.act.openFoundVideo('${v.id}')">${ui.cover(v, `dy-scard-art dy-hf${i % 4}`)}<span class="dy-hotcap"><span class="dy-hot-title">${esc(v.title)}</span><span class="dy-hot-meta">${ui.avatar(videoAuthor(v), 'xs')}<i class="ell">${esc(videoAuthor(v))}</i><span class="dy-hot-like">${icon('heart', 'ic-xs')}${XA.wan(v.likes || 0)}</span></span></span></button>`;
  /* 抖音热榜风格：排名 + 缩略封面 + 标题/作者 + 热度 */
  const dyRankItem = (v, i) => `<button type="button" class="dy-rank" onclick="XA.act.openFoundVideo('${v.id}')">
    <span class="dy-rank-no ${i < 3 ? 'top' : ''}">${i + 1}</span>
    <span class="dy-rank-cover">${ui.cover(v, '')}<i class="dy-rank-play">${icon('play', 'ic-xs')}${XA.wan(v.views || v.likes || 0)}</i></span>
    <span class="dy-rank-info"><span class="dy-rank-title">${esc(v.title)}</span><span class="dy-rank-by">${esc(videoAuthor(v))}${v.rankTag ? `<em>${esc(v.rankTag)}</em>` : ''}</span></span>
    <span class="dy-rank-hot">${icon('flame', 'ic-xs')}${XA.wan(v.likes || 0)}</span>
  </button>`;
  XA.page('vsearch', {
    title: '',
    render(q) {
      const kw = (q.q || '').trim();
      const box = `<div class="search-top">
        <div class="searchbar input">${icon('search')}<input id="vkw" type="search" placeholder="搜视频、用户" value="${esc(kw)}" onkeydown="if(event.key==='Enter')XA.act.vSearch(this.value)"></div>
        <button type="button" class="dy-go" onclick="XA.act.vSearch(document.getElementById('vkw').value)">搜索</button>
      </div>`;
      const pool = D.videos.filter((v) => v.slot !== 'mine').concat(XA.state.myVideos || []);
      const hit = (v) => v.title.includes(kw) || videoAuthor(v).includes(kw) || (v.author || '').includes(kw);
      const hot = hotVideos();
      /* 抖音瀑布流：按奇偶拆成两列，各自错落堆叠 */
      const hotCards = hot.slice(0, 10).map(dyHotCard);
      const hotCols = [hotCards.filter((_, i) => i % 2 === 0), hotCards.filter((_, i) => i % 2 === 1)];
      const off = XA.tmp.vGuess || 0;
      const guesses = DY_GUESS.slice(off, off + 6).concat(DY_GUESS.slice(0, Math.max(0, off + 6 - DY_GUESS.length)));
      const his = XA.state.vSearchHistory || [];
      const discover = `${his.length ? `<div class="xhs-block"><div class="xhs-hd"><b>历史记录</b><button type="button" aria-label="清空" onclick="XA.act.vClearHist()">${icon('trash', 'ic-s')}</button></div><div class="xhs-his">${his.map((h) => `<button type="button" onclick="XA.act.vSearch('${esc(h)}')">${esc(h)}</button>`).join('')}</div></div>` : ''}
        <div class="xhs-block"><div class="xhs-hd"><b>猜你想搜</b><button type="button" onclick="XA.act.vGuess()">${icon('refresh', 'ic-s')}</button></div><div class="xhs-guess">${guesses.map((t) => `<button type="button" onclick="XA.act.vSearch('${esc(t)}')">${esc(t)}</button>`).join('')}</div></div>
        <div class="xhs-block xhs-block-flush"><div class="xhs-hd"><b>热门榜单</b><span class="dy-rank-tag">抖音热榜</span></div><div class="dy-hotgrid">${hotCols.map((col) => `<div class="dy-hotcol">${col.join('')}</div>`).join('')}</div></div>`;
      if (!kw) return `${box}${discover}`;
      const tab = XA.tmp.vSearchTab === 'video' || XA.tmp.vSearchTab === 'user' ? XA.tmp.vSearchTab : 'all';
      const tabs = `<div class="dy-result-tabs">${[['all', '综合'], ['video', '视频'], ['user', '用户']].map(([id, name]) => `<button type="button" class="${tab === id ? 'on' : ''}" onclick="XA.act.vSearchTab('${id}')">${name}</button>`).join('')}</div>`;
      const videos = pool.filter(hit);
      const users = D.creators.filter((c) => c.name.includes(kw) || (c.bio || '').includes(kw) || (c.badge || '').includes(kw));
      const userList = (list) => list.length ? list.map((c) => {
        const on = !!(XA.state.follows && XA.state.follows[c.id]);
        const n = D.videos.filter((v) => v.aid === c.id && !v.slot).length;
        return `<div class="xhs-user" data-go="creator?id=${c.id}">${ui.avatar(c.name)}<div class="grow"><div class="bold ell">${esc(c.name)}</div><div class="faint small ell">${esc(c.badge || '')} · 粉丝 ${XA.wan(c.fans)} · 视频 ${n}</div></div><button type="button" class="dy-follow ${on ? 'on' : ''}" onclick="event.stopPropagation();XA.act.follow('${c.id}')">${on ? '已关注' : '关注'}</button></div>`;
      }).join('') : `<div class="sec card center muted">没有找到「${esc(kw)}」</div>`;
      const grid = videos.length ? `<div class="dy-sgrid">${videos.map(dyCard).join('')}</div>` : `<div class="sec card center muted">没有找到「${esc(kw)}」</div>`;
      if (tab === 'user') return `${box}${tabs}${userList(users)}`;
      if (tab === 'video') return `${box}${tabs}${grid}`;
      const head = users.length ? userList(users.slice(0, 3)) : '';
      return `${box}${tabs}${head}${videos.length ? `<div class="dy-sgrid">${videos.map(dyCard).join('')}</div>` : (users.length ? '' : grid)}`;
    },
    mounted(q) { if (!q.q) { const i = XA.$('#vkw'); i && i.focus(); } },
  });

  /* ================= 内容账号页 ================= */
  XA.act.follow = (id) => XA.needLogin(() => {
    const f = XA.state.follows;
    f[id] = !f[id]; XA.save();
    XA.toast(f[id] ? '已关注' : '已取消关注', !!f[id]);
    XA.refresh();
  });
  XA.act.openVideo = (id) => { XA.tmp.vFocus = id; XA.go('video'); };
  XA.act.creatorTab = (t) => { XA.tmp.creatorTab = t; XA.refresh(); };
  XA.page('creator', {
    title: (q) => (D.creator(q.id) || D.creators[0]).name,
    render(q) {
      const c = D.creator(q.id) || D.creators[0];
      const vids = D.videosOf(c.id), notes = D.notesOf(c.id);
      const likes = vids.reduce((a, v) => a + v.likes, 0) + notes.reduce((a, n) => a + n.likes, 0);
      if (!XA.state.follows) XA.state.follows = {};
      const on = !!XA.state.follows[c.id];
      const tab = XA.tmp.creatorTab || (vids.length ? 'video' : 'note');
      return `
      <div class="creator-cover">${ui.art(c.cover || c.art, 'creator-cover-art')}</div>
      <div class="creator-hd">
        <div class="creator-avatar">${ui.cover(c, 'creator-av')}</div>
        <div class="creator-meta">
          <div class="creator-name ell">${esc(c.name)}</div>
          <div class="row gap6 mt4"><span class="tag ${c.badge === '官方' ? 'tag-green' : 'tag-outline'}">${esc(c.badge)}</span><span class="faint small ell">${esc(c.kind)}</span></div>
        </div>
        <button class="btn btn-sm ${on ? 'btn-tonal' : 'btn-primary'}" onclick="XA.act.follow('${c.id}')">${on ? '已关注' : '关注'}</button>
      </div>
      <div class="creator-stats">
        <div><b>${XA.wan(likes)}</b><span>获赞</span></div>
        <div><b>${XA.wan(c.follows)}</b><span>关注</span></div>
        <div><b>${XA.wan(c.fans + (on ? 1 : 0))}</b><span>粉丝</span></div>
      </div>
      <div class="creator-bio">${esc(c.bio)}</div>
      <div class="tabs inset creator-tabs">
        <button class="${tab === 'video' ? 'on' : ''}" onclick="XA.act.creatorTab('video')">视频 ${vids.length}</button>
        <button class="${tab === 'note' ? 'on' : ''}" onclick="XA.act.creatorTab('note')">笔记 ${notes.length}</button>
      </div>
      ${tab === 'video' ? (vids.length
        ? `<div class="vgrid">${vids.map((v) => `<button class="vgrid-item" onclick="XA.act.openVideo('${v.id}')">${ui.cover(v, 'vgrid-art')}<span class="vgrid-likes">${icon('heart', 'ic-xs')}${XA.wan(v.likes)}</span><span class="vgrid-title ell">${esc(v.title)}</span></button>`).join('')}</div>`
        : `<div class="empty">还没有发布视频</div>`)
        : (notes.length
          ? `<div class="feed sec">${notes.map((n) => `<div class="fcard" data-go="note?id=${n.id}">${ui.cover(n, 'fcard-img')}<div class="fcard-bd"><div class="fcard-title">${esc(n.title)}</div><div class="fcard-tags"><span class="tag tag-outline">笔记</span><span class="faint small">${XA.wan(n.likes)} 赞</span></div></div></div>`).join('')}</div>`
          : `<div class="empty">还没有发布笔记</div>`)}
      <div class="end">账号内容经平台审核后发布</div>`;
    },
  });

  /* ================= 社区：关注 / 推荐 / 我的；话题横滑筛选；铅笔发帖 ================= */
  const mineNotes = () => XA.state.myNotes || [];
  const findNote = (id) => D.note(id) || mineNotes().find((n) => n.id === id);
  const ncard = (n) => `<div class="ncard" data-go="note?id=${n.id}">
      <div class="ncard-img" style="aspect-ratio:1/${Number(n.r) || 1}">${ui.cover(n)}</div>
      <div class="ncard-bd">
        <div class="ncard-title">${esc(n.title)}</div>
        <div class="ncard-ft">${ui.avatar(n.author, 'xs')}<span class="ell grow">${esc(n.author)}</span><span class="row gap4 faint">${icon('heart', 'ic-xs')}${XA.wan(n.likes || 0)}</span></div>
      </div>
    </div>`;
  const waterfall = (list) => `<div class="wf"><div class="wf-col">${list.filter((_, i) => i % 2 === 0).map(ncard).join('')}</div><div class="wf-col">${list.filter((_, i) => i % 2 === 1).map(ncard).join('')}</div></div>`;
  XA.act.cTab = (tab) => gateTab('cTab', tab);
  XA.act.cTopic = (id) => { XA.tmp.cTopic = id || ''; XA.refresh(); };
  XA.act.cMinePane = (id) => { XA.tmp.cMinePane = id; XA.refresh(); };
  const communityNotes = () => {
    const tab = XA.tmp.cTab || 'pick';
    const topic = XA.tmp.cTopic || '';
    const follows = XA.state.follows || {};
    const pub = D.notes.filter((n) => !n.slot);
    const seen = new Set();
    let list = tab === 'follow'
      ? D.notes.filter((n) => n.slot === 'follow').concat(pub.filter((n) => follows[n.aid]))
      : tab === 'mine'
        ? D.notes.filter((n) => n.slot === 'mine').concat(mineNotes())
        : pub.slice();
    list = list.filter((n) => (seen.has(n.id) ? false : seen.add(n.id)));
    if (topic && tab !== 'mine') list = list.filter((n) => n.topic === topic);
    if (tab === 'pick') list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    return list;
  };

  XA.page('community', {
    title: '',
    nav: 'none',
    render() {
      const tab = XA.tmp.cTab || 'pick';
      const topic = XA.tmp.cTopic || '';
      const hot = D.topics.slice().sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 5);
      const list = communityNotes();
      const tabBtn = (id, name) => `<button type="button" class="${tab === id ? 'on' : ''}" onclick="XA.act.cTab('${id}')">${name}</button>`;
      const pills = `<button type="button" class="topic-chip ${topic ? '' : 'on'}" onclick="XA.act.cTopic('')">热门</button>`
        + hot.map((t) => `<button type="button" class="topic-chip ${topic === t.id ? 'on' : ''}" onclick="XA.act.cTopic('${t.id}')"># ${esc(t.name)}</button>`).join('');
      const pane = XA.tmp.cMinePane === 'fav' || XA.tmp.cMinePane === 'like' ? XA.tmp.cMinePane : 'note';
      let shown = list;
      let empty = tab === 'follow' ? '关注账号后，这里会显示他们的笔记' : '这个话题下还没有笔记';
      let me = '';
      if (tab === 'mine') {
        const p = cProfile();
        const follows = followedCreators().length;
        const mineList = list;
        const got = mineList.reduce((sum, n) => sum + (n.likes || 0), 0);
        const seen = new Set();
        const all = D.notes.concat(mineNotes()).filter((n) => (seen.has(n.id) ? false : seen.add(n.id)));
        if (pane === 'note') {
          shown = mineList.map((n) => ({ ...n, author: p.name }));
          empty = '您还没有发布笔记';
        } else if (pane === 'fav') {
          shown = all.filter((n) => XA.state.favs['n_' + n.id]);
          empty = '您还没有收藏的笔记';
        } else {
          shown = all.filter((n) => XA.state.likes['n_' + n.id]);
          empty = '您还没有赞过的笔记';
        }
        me = `<div class="c-mine">
          <div class="dy-cover">${XA.art('leaf', 'dusk', 'dy-cover-art')}</div>
          <div class="dy-hd">
            <div class="social-av dy-av" style="background:${avTone(p)}">${avHtml(p)}</div>
            <div class="dy-name">${esc(p.name)}</div>
          </div>
          <div class="dy-bar">
            <div class="dy-stats">
              <div class="dy-stat"><b>${XA.wan(got)}</b><span>获赞</span></div>
              <button type="button" class="dy-stat" data-go="vfollows"><b>${follows}</b><span>关注</span></button>
              <div class="dy-stat"><b>${XA.wan(p.fans || 0)}</b><span>粉丝</span></div>
            </div>
            <div class="dy-actions">
              <button type="button" class="dy-edit-inline" data-go="cprofile">编辑资料</button>
              <button type="button" class="dy-post" onclick="XA.needLogin(function(){XA.go('compose')})">发笔记</button>
            </div>
          </div>
          ${bioBlock(p.bio)}
          <div class="xhs-tabs">
            <button type="button" class="${pane === 'note' ? 'on' : ''}" onclick="XA.act.cMinePane('note')">笔记</button>
            <button type="button" class="${pane === 'fav' ? 'on' : ''}" onclick="XA.act.cMinePane('fav')">收藏</button>
            <button type="button" class="${pane === 'like' ? 'on' : ''}" onclick="XA.act.cMinePane('like')">赞过</button>
          </div>
        </div>`;
      }
      return `
      <div class="fab-anchor"><button type="button" class="fab-pen" aria-label="发笔记" onclick="XA.needLogin(function(){XA.go('compose')})">${icon('pencil')}</button></div>
      <div class="csub">${tabBtn('follow', '关注')}${tabBtn('pick', '推荐')}${tabBtn('mine', '我的')}<button type="button" class="tab-search" data-go="csearch" aria-label="搜索">${icon('search')}</button></div>
      ${me}
      ${tab === 'mine' ? '' : `<div class="topic-row">${pills}</div>`}
      ${shown.length ? waterfall(shown) : `<div class="sec card center muted">${empty}</div>`}
      ${tab === 'mine' ? '' : '<div class="end">点标签看这个话题下的热门帖子</div>'}
      <div class="wf-pad"></div>`;
    },
  });

  const pubNotes = () => D.notes.filter((n) => !n.slot);
  const hotNotes = () => pubNotes().slice().sort((a, b) => (b.likes || 0) - (a.likes || 0));
  XA.act.cBioOpen = () => { XA.tmp.cBioOpen = !XA.tmp.cBioOpen; XA.refresh(); };
  const bioBlock = (text) => {
    const raw = text || '';
    const lines = raw.split('\n').reduce((n, line) => n + Math.max(1, Math.ceil(graphemes(line).length / 18)), 0);
    const long = !!raw && lines > 2;
    const open = !!XA.tmp.cBioOpen;
    return `<div class="dy-bio dy-bio-pre ${long && !open ? 'fold' : ''}">${esc(raw || '写一句介绍')}</div>${long ? `<button type="button" class="dy-bio-more" onclick="XA.act.cBioOpen()">${open ? '收起' : '展开'}</button>` : ''}`;
  };
  XA.act.openTopic = (id) => { XA.tmp.cTab = 'pick'; XA.tmp.cTopic = id || ''; XA.go('community'); };
  XA.act.cSearch = (kw) => {
    kw = String(kw || '').trim();
    if (kw) {
      const h = XA.state.cSearchHistory || [];
      XA.state.cSearchHistory = [kw].concat(h.filter((x) => x !== kw)).slice(0, 8);
      XA.save();
    }
    XA.tmp.cSearchTab = 'all';
    XA.go('csearch' + (kw ? '?q=' + encodeURIComponent(kw) : ''), XA.current().name === 'csearch');
  };
  XA.act.cClearHist = () => { XA.state.cSearchHistory = []; XA.save(); XA.refresh(); };
  XA.act.cSearchTab = (id) => { XA.tmp.cSearchTab = id === 'user' ? 'user' : 'all'; XA.refresh(); };
  XA.act.cSort = (id) => { XA.tmp.cSort = id === 'new' || id === 'hot' ? id : 'mix'; XA.refresh(); };
  XA.act.cGuess = () => { XA.tmp.cGuess = ((XA.tmp.cGuess || 0) + 6) % 12; XA.refresh(); };
  const XHS_GUESS = ['立冬养藏', '新手艾灸', '泡脚这件小事', '办公室养生', '冬日进补', '足三里', '关元怎么找', '肩颈放松', '睡前泡脚', '艾灸多久', '手脚冰凉', '三阴交'];
  XA.page('csearch', {
    title: '',
    render(q) {
      const kw = (q.q || '').trim();
      const box = `<div class="search-top">
        <div class="searchbar input">${icon('search')}<input id="ckw" type="search" placeholder="搜索笔记，用户" value="${esc(kw)}" onkeydown="if(event.key==='Enter')XA.act.cSearch(this.value)"></div>
        <button type="button" class="xhs-go" style="color:#111" onclick="XA.act.cSearch(document.getElementById('ckw').value)">搜索</button>
      </div>`;
      const notes = pubNotes().concat(mineNotes());
      const hot = hotNotes();
      const off = XA.tmp.cGuess || 0;
      const guesses = XHS_GUESS.slice(off, off + 6).concat(XHS_GUESS.slice(0, Math.max(0, off + 6 - XHS_GUESS.length)));
      const his = XA.state.cSearchHistory || [];
      const discover = `${his.length ? `<div class="xhs-block"><div class="xhs-hd"><b>历史记录</b><button type="button" aria-label="清空" onclick="XA.act.cClearHist()">${icon('trash', 'ic-s')}</button></div><div class="xhs-his">${his.map((h) => `<button type="button" onclick="XA.act.cSearch('${esc(h)}')">${esc(h)}</button>`).join('')}</div></div>` : ''}
        <div class="xhs-block"><div class="xhs-hd"><b>猜你想搜</b><button type="button" aria-label="换一换" onclick="XA.act.cGuess()">${icon('refresh', 'ic-s')}</button></div><div class="xhs-guess">${guesses.map((t) => `<button type="button" onclick="XA.act.cSearch('${esc(t)}')">${esc(t)}</button>`).join('')}</div></div>
        <div class="xhs-block"><div class="xhs-hd"><b>热门帖子</b></div><div class="xhs-hot">${hot.slice(0, 10).map((n, i) => `<button type="button" data-go="note?id=${n.id}"><i>${i + 1}</i><span class="ell">${esc(n.title)}</span>${i < 5 ? `<em class="${i < 3 ? '' : 'new'}">${i < 3 ? '热' : '新'}</em>` : ''}</button>`).join('')}</div></div>`;
      if (!kw) return `${box}${discover}`;
      const tab = XA.tmp.cSearchTab === 'user' ? 'user' : 'all';
      const tabs = `<div class="xhs-tabs xhs-result-tabs"><button type="button" class="${tab === 'all' ? 'on' : ''}" onclick="XA.act.cSearchTab('all')">全部</button><button type="button" class="${tab === 'user' ? 'on' : ''}" onclick="XA.act.cSearchTab('user')">用户</button></div>`;
      const names = [...new Set(notes.map((n) => n.author).concat(D.creators.map((c) => c.name)))].filter((name) => name.includes(kw));
      const sort = XA.tmp.cSort === 'new' || XA.tmp.cSort === 'hot' ? XA.tmp.cSort : 'mix';
      const order = new Map(D.notes.map((n, i) => [n.id, i]));
      let posts = notes.filter((n) => n.title.includes(kw) || n.author.includes(kw) || (n.body || []).join('').includes(kw) || ((D.topic(n.topic) || {}).name || '').includes(kw));
      posts = posts.slice().sort((a, b) => sort === 'new' ? (order.get(b.id) || 0) - (order.get(a.id) || 0) : (b.likes || 0) - (a.likes || 0));
      const tags = D.topics.filter((t) => t.name.includes(kw));
      const userList = names.length ? names.map((name) => {
        const c = D.creatorByName(name);
        const count = notes.filter((n) => n.author === name).length;
        const sub = c ? `粉丝 ${XA.wan(c.fans)} · 笔记 ${count}` : `笔记 ${count}`;
        const on = c && XA.state.follows && XA.state.follows[c.id];
        return `<div class="xhs-user" ${c ? `data-go="creator?id=${c.id}"` : ''}>${ui.avatar(name)}<div class="grow"><div class="bold ell">${esc(name)}</div><div class="faint small">${sub}</div></div>${c ? `<button type="button" class="xhs-follow ${on ? 'on' : ''}" onclick="event.stopPropagation();XA.act.follow('${c.id}')">${on ? '已关注' : '关注'}</button>` : ''}</div>`;
      }).join('') : `<div class="sec card center muted">没有找到「${esc(kw)}」</div>`;
      if (tab === 'user') return `${box}${tabs}${userList}`;
      const sorts = `<div class="xhs-sort">${[['mix', '综合'], ['new', '最新'], ['hot', '最多点赞']].map(([id, name]) => `<button type="button" class="${sort === id ? 'on' : ''}" onclick="XA.act.cSort('${id}')">${name}</button>`).join('')}</div>`;
      const tagRow = tags.length ? `<div class="topic-row">${tags.map((t) => `<button type="button" class="topic-chip" onclick="XA.act.openTopic('${t.id}')"># ${esc(t.name)}</button>`).join('')}</div>` : '';
      if (!posts.length && !tags.length) return `${box}${tabs}${sorts}<div class="sec card center muted">没有找到「${esc(kw)}」</div>`;
      return `${box}${tabs}${sorts}${tagRow}${posts.length ? waterfall(posts) : ''}`;
    },
    mounted(q) { if (!q.q) { const i = XA.$('#ckw'); i && i.focus(); } },
  });

  const saveNoteDraft = (patch) => {
    const title = XA.$('#noteTitle'), body = XA.$('#noteBody');
    XA.tmp.draft = Object.assign({}, XA.tmp.draft, {
      title: title ? title.value : '',
      body: body ? body.value : '',
      topic: (XA.tmp.draft && XA.tmp.draft.topic) || D.topics[0].id,
    }, patch || {});
  };
  XA.act.draftTopic = (id) => { saveNoteDraft({ topic: id }); XA.refresh(); };
  XA.act.noteFile = (input) => {
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { XA.toast('请选择图片'); return; }
    saveNoteDraft();
    XA.tmp.noteUploading = true;
    XA.refresh();
    XA.importMedia(file, 'image').then((media) => {
      XA.tmp.noteMedia = media;
      XA.tmp.noteMediaName = file.name;
      XA.tmp.noteUploading = false;
      XA.refresh();
      XA.toast('图片已选择');
    }).catch((e) => {
      XA.tmp.noteUploading = false;
      XA.refresh();
      XA.toast(e && e.message || '图片读取失败，请重试');
    });
  };
  XA.act.noteFileClear = () => { saveNoteDraft(); delete XA.tmp.noteMedia; delete XA.tmp.noteMediaName; XA.refresh(); };
  XA.act.publishNote = () => XA.needLogin(() => {
    const titleEl = XA.$('#noteTitle'), bodyEl = XA.$('#noteBody');
    const title = (titleEl && titleEl.value || '').trim();
    const body = (bodyEl && bodyEl.value || '').trim();
    if (!title || !body) return XA.toast('请先写下标题和正文');
    const topic = (XA.tmp.draft && XA.tmp.draft.topic) || D.topics[0].id;
    const note = {
      id: XA.uid('n'), aid: 'me', title, author: cProfile().name, source: 'mine',
      art: ['leaf', 'sage'], r: 1.15, likes: 0, topic,
      body: body.split(/\n+/).map((t) => t.trim()).filter(Boolean),
      imgs: [['leaf', 'sage']],
    };
    /* 选了相册图片：封面与首图都用这张真实图片；未选则用默认插画封面 */
    if (XA.tmp.noteMedia) {
      note.coverMedia = XA.tmp.noteMedia;
      note.imgs = [XA.tmp.noteMedia];
    }
    XA.state.myNotes = mineNotes().concat(note);
    XA.save();
    XA.tmp.draft = null;
    delete XA.tmp.noteMedia;
    delete XA.tmp.noteMediaName;
    delete XA.tmp.noteUploading;
    XA.tmp.cTab = 'mine';
    XA.tmp.cTopic = '';
    XA.toast('已发布', true);
    XA.go('community', true);
  });
  XA.page('compose', {
    title: '发笔记',
    render() {
      const d = XA.tmp.draft || { title: '', body: '', topic: D.topics[0].id };
      const media = XA.tmp.noteMedia;
      const imgBox = media
        ? `<div class="note-img-preview">${XA.mediaPreview(media)}<button type="button" class="note-img-del" onclick="XA.act.noteFileClear()">移除图片</button></div><div class="faint small mt8">已选封面图片${XA.tmp.noteMediaName ? '：' + esc(XA.tmp.noteMediaName) : ''}</div>`
        : `<div class="faint small mt8">不选图片则使用默认封面</div>`;
      return `<div class="sec card">
        <input id="noteTitle" class="input" maxlength="40" placeholder="写个标题" value="${esc(d.title || '')}">
        <textarea id="noteBody" class="input mt12" rows="6" maxlength="500" placeholder="分享您的养生体会" style="height:auto;padding:12px 14px;line-height:1.6">${esc(d.body || '')}</textarea>
        <div class="field-label">封面图片（可选）</div>
        <button type="button" class="btn btn-tonal btn-block" onclick="XA.act.pickAlbum('noteFile')">${icon('image', 'ic-s')} 从相册选择图片</button>
        <input id="noteFile" type="file" accept="image/*" hidden onchange="XA.act.noteFile(this)">
        ${XA.tmp.noteUploading ? `<div class="faint small mt8">图片处理中…</div>` : ''}
        ${imgBox}
      </div>
      ${ui.sec('选择话题')}
      <div class="topic-row">${D.topics.map((t) => `<button type="button" class="topic-chip ${d.topic === t.id ? 'on' : ''}" onclick="XA.act.draftTopic('${t.id}')"># ${esc(t.name)}</button>`).join('')}</div>
      <div class="sec faint small">发布前请确认内容适合公开展示。演示笔记只保存在本机。</div>`;
    },
    footer() { return `<button class="btn btn-primary btn-block" onclick="XA.act.publishNote()">发布</button>`; },
  });
  const patchCProfile = (patch) => {
    XA.state.cProfile = Object.assign({}, cProfile(), patch);
    XA.save();
  };
  XA.act.cEditName = () => {
    const p = cProfile();
    XA.sheet({
      title: '修改名字',
      html: `<input id="cpName" class="input" value="${esc(p.name)}" ${fieldHooks(20)}><div class="faint small mt8">最多 20 个字符，汉字、字母、表情各算 1 个</div>`,
      footer: `<button class="btn btn-primary btn-block" onclick="XA.act.saveCName()">保存</button>`,
    });
  };
  XA.act.saveCName = () => {
    const name = clipChars((XA.$('#cpName') && XA.$('#cpName').value || '').trim(), 20);
    if (!name) return XA.toast('请先写个名字');
    patchCProfile({ name });
    XA.closeSheet();
    XA.toast('已保存');
    XA.refresh();
  };
  XA.act.cEditBio = () => {
    const p = cProfile();
    XA.sheet({
      title: '修改签名',
      html: `<textarea id="cpBio" class="input" rows="4" style="height:auto;min-height:6.5rem;padding:12px 14px;line-height:1.6" ${fieldHooks(80)}>${esc(p.bio || '')}</textarea><div class="faint small mt8">最多 80 个字符，可以换行。主页默认收起，点展开看全文</div>`,
      footer: `<button class="btn btn-primary btn-block" onclick="XA.act.saveCBio()">保存</button>`,
    });
  };
  XA.act.saveCBio = () => {
    const bio = clipChars((XA.$('#cpBio') && XA.$('#cpBio').value || '').trim(), 80);
    patchCProfile({ bio });
    XA.closeSheet();
    XA.tmp.cBioOpen = false;
    XA.toast('已保存');
    XA.refresh();
  };
  XA.act.cGenderPick = (g) => {
    patchCProfile({ gender: g || '' });
    XA.closeSheet();
    XA.refresh();
  };
  XA.act.cGenderSheet = () => {
    const cur = cProfile().gender || '';
    const row = (id, label) => `<button type="button" class="dy-g-row ${cur === id ? 'on' : ''}" onclick="XA.act.cGenderPick('${id}')">${label}</button>`;
    XA.sheet({ title: '选择性别', html: `${row('男', '男')}${row('女', '女')}${row('', '不展示')}` });
  };
  XA.page('cprofile', {
    title: '编辑资料',
    render() {
      const p = cProfile();
      const genderLabel = p.gender === '男' || p.gender === '女' ? p.gender : '不展示';
      const sign = (p.bio || '介绍一下自己').replace(/\s+/g, ' ');
      return `<div class="dy-ep">
        <div class="dy-cover">${XA.art('leaf', 'dusk', 'dy-cover-art')}</div>
        <button type="button" class="dy-ep-av" id="cpAv" style="background:${avTone(p)}" onclick="XA.act.pickAlbum('cpPhoto')">${avHtml(p)}<i>${icon('image', 'ic-s')}</i></button>
        <input id="cpPhoto" type="file" accept="image/*" hidden onchange="XA.act.cPhoto(this)">
        <div class="cells dy-ep-list">
          <button type="button" class="cell" onclick="XA.act.cEditName()"><span class="dy-ep-k">名字</span><span class="dy-ep-v ell">${esc(p.name)}</span>${icon('right', 'faint')}</button>
          <button type="button" class="cell" onclick="XA.act.cEditBio()"><span class="dy-ep-k">签名</span><span class="dy-ep-v ell">${esc(sign)}</span>${icon('right', 'faint')}</button>
          <button type="button" class="cell" onclick="XA.act.cGenderSheet()"><span class="dy-ep-k">性别</span><span class="dy-ep-v">${genderLabel}</span>${icon('right', 'faint')}</button>
        </div>
      </div>`;
    },
  });

  XA.page('topic', {
    title: '话题',
    render(q) {
      const t = D.topic(q.id) || D.topics[0];
      const list = D.notes.filter((n) => n.topic === t.id && !n.slot);
      return `<div class="topic-hd">${ui.art(t.art, 'topic-hd-art')}
        <div class="topic-hd-in"><h1># ${t.name}</h1><div>${esc(t.desc)}</div><div class="small mt4">${t.official ? '官方话题 · ' : ''}${list.length} 篇笔记</div></div>
      </div>
      ${list.length ? ui.sec('本话题笔记') + waterfall(list) : `<div class="sec card center muted">本话题暂无笔记</div>`}
      <div class="end">已经到底了</div>`;
    },
  });

  XA.page('note', {
    title: '笔记',
    render(q) {
      const n = q.id ? findNote(q.id) : D.notes[0];
      if (!n) return '<div class="end">这篇笔记暂未发布</div>';
      const t = D.topic(n.topic), p = n.product && D.product(n.product);
      const images = n.imgs?.length ? n.imgs : [n.art];
      const store = n.store === true ? D.nearest('xaj') : D.stores.find(item => item.id === n.store);
      return `
      <div class="carousel" id="car">${images.map((a,i) => `<div class="slide">${i ? ui.art(a) : ui.cover(n, "", a)}</div>`).join('')}</div>
      ${images.length > 1 ? `<div class="car-dots" id="carDots">${images.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div>` : ''}
      <article class="article note">
        <div class="byline" ${n.aid ? `data-go="creator?id=${n.aid}"` : ''}>${ui.avatar(n.author)}<div class="grow"><div class="bold">${esc(n.author)}</div><div class="faint small">${n.source === 'official' ? '官方账号' : '签约达人'} · 内容已审核</div></div>${n.aid ? icon('right', 'faint') : ''}</div>
        <h1>${esc(n.title)}</h1>
        ${[n.category,n.subcategory,...(n.tags || [])].filter(Boolean).map(t => `<button class="tag tag-outline" data-go="search?q=${encodeURIComponent(t)}">${esc(t)}</button>`).join(" ")}
        ${ui.richBody(n, "body")}
        ${t ? `<button class="chip mt8" data-go="topic?id=${t.id}"># ${esc(t.name)}</button>` : ''}
      </article>
      ${p ? ui.sec('笔记中的好物') + `<div class="feed">${ui.productCard(p, 'post')}</div>` : ''}
      ${store ? ui.sec('笔记中的门店', '全部门店', 'store') + `<div class="feed">${ui.storeCard(store)}</div>` : ''}
      <div class="sec">${ui.groupCard()}</div>
      <div class="sec">${ui.disclaimer()}</div>`;
    },
    mounted() {
      const car = XA.$('#car'), dots = XA.$$('#carDots i');
      if (car && dots.length) car.addEventListener('scroll', () => {
        const i = Math.round(car.scrollLeft / car.clientWidth);
        dots.forEach((d, k) => d.classList.toggle('on', k === i));
      }, { passive: true });
    },
    footer(q) { const n = q.id ? findNote(q.id) : D.notes[0]; if (!n) return ""; return ui.readBar('n_' + n.id, n.likes, n.title); },
  });
})();
