/* pages-tools.js —— 工具集：体质测试 / 体质档案 / 穴位图谱 / 对症找穴 / 艾灸计时 */
(function () {
  const D = XA.data, icon = XA.icon, ui = XA.ui, esc = XA.esc;

  /* ================= 体质测试 ================= */
  XA.act.testStart = () => {
    XA.tmp.testReturnTo = '';
    XA.state.test = { started: true, answers: [] };
    XA.save();
    XA.refresh();
  };
  XA.act.testPrev = () => { XA.state.test.answers.pop(); XA.save(); XA.refresh(); };
  XA.act.answer = (v, el) => {
    if (XA.tmp.answering) return;
    XA.tmp.answering = true;
    el.classList.add('on');
    setTimeout(() => {
      XA.tmp.answering = false;
      const t = XA.state.test;
      t.answers.push(v);
      if (t.answers.length < D.quiz.length) { XA.save(); return XA.refresh(); }
      /* 计分：取倾向最高的偏颇体质；都不明显则为平和质 */
      const scores = {};
      D.quiz.forEach((q, i) => (scores[q.type] = t.answers[i]));
      let type = '平和质', max = 2;
      D.quiz.forEach((q) => { if (q.type !== '平和质' && scores[q.type] > max) { max = scores[q.type]; type = q.type; } });
      const first = !XA.state.constitution && !XA.state.testRewarded;
      if (XA.state.constitution) {
        const past = Array.isArray(XA.state.constitutionLog) ? XA.state.constitutionLog : [];
        past.unshift({ type: XA.state.constitution.type, scores: XA.state.constitution.scores, at: XA.state.constitution.at });
        XA.state.constitutionLog = past.slice(0, 8);
      }
      XA.state.constitution = { type, scores, at: new Date().toISOString() };
      XA.state.test = { started: false, answers: [] };
      if (first) { XA.state.testRewarded = true; XA.addPoints(20, '完成体质测试', 20); }
      XA.save();
      const back = XA.tmp.testReturnTo;
      XA.tmp.testReturnTo = '';
      if (back === 'review') XA.go('review', true);
      else XA.go('profile?done=1' + (first ? '&first=1' : ''), true);
    }, 220);
  };

  XA.page('test', {
    title: '体质测试',
    render() {
      const t = XA.state.test, n = D.quiz.length;
      if (!t.started) {
        return `<div class="intro">
          ${XA.art('person', 'sage', 'intro-art')}
          <h1>测一测我的体质</h1>
          <p class="muted">参考中医九种体质，了解自己当下的身体状态，获得更适合您的养生建议。</p>
          <div class="intro-list">
            <div>${icon('clock')}<span>共 ${n} 题，约 3 分钟</span></div>
            <div>${icon('check')}<span>一题一页，点选即可，可随时退出续答</span></div>
            <div>${icon('coin')}<span>首次完成奖励 20 积分</span></div>
            <div>${icon('lock')}<span>结果仅自己可见，可随时删除</span></div>
          </div>
          ${ui.disclaimer('测试结果为养生参考，非医疗诊断。演示版为精简题目，正式量表以上线版本为准。')}
        </div>`;
      }
      const i = Math.min(t.answers.length, n - 1), q = D.quiz[i];
      return `<div class="quiz">
        <div class="quiz-prog"><div class="bar"><i style="width:${Math.round(((i + 1) / n) * 100)}%"></i></div><span>第 <b>${i + 1}</b> 题 / 共 ${n} 题</span></div>
        <h2 class="quiz-q">${q.q}</h2>
        <div class="muted small">请您根据近一年的感受选择</div>
        <div class="quiz-opts">
          ${D.quizOpts.map((o, k) => `<button class="quiz-opt" onclick="XA.act.answer(${k + 1},this)"><span>${o}</span>${icon('check')}</button>`).join('')}
        </div>
        ${i > 0 ? `<button class="btn btn-ghost btn-block mt12" onclick="XA.act.testPrev()">${icon('left', 'ic-s')} 上一题</button>` : ''}
        <div class="faint small center mt12">中途退出会自动保存进度</div>
      </div>`;
    },
    footer() {
      if (XA.state.test.started) return '';
      const done = !!XA.state.constitution;
      return `<button class="btn btn-primary btn-block" onclick="XA.act.testStart()">${done ? '重新测试' : '开始测试'}</button>`;
    },
  });

  const profileFile = (c) => {
    const t = D.types[c.type];
    const tops = c.scores ? Object.keys(c.scores).filter((k) => k !== '平和质').sort((a, b) => c.scores[b] - c.scores[a]).slice(0, 3) : [];
    const pts = t.pts.map((id) => D.point(id)).filter(Boolean);
    const care = ['life', 'food', 'pts'].includes(XA.tmp.profileCare) ? XA.tmp.profileCare : 'life';
    const tabs = [['life', '起居'], ['food', '饮食'], ['pts', '穴位']];
    const panels = {
      life: `<div class="care-block"><div class="bold">日常</div><p>${esc(t.life)}</p></div><div class="care-block"><div class="bold">可以怎么做</div><p>${esc(t.lifeMore || '')}</p></div><p class="faint small mt8">感到累、发烫或不适时就停，不必一次做很多。</p>`,
      food: `<div class="care-block"><div class="bold">日常</div><p>${esc(t.food)}</p></div><div class="care-block"><div class="bold">可以怎么吃</div><p>${esc(t.foodMore || '')}</p></div><p class="faint small mt8">每餐七分饱即可，以自己吃完舒服为准。</p>`,
      pts: `<div class="profile-pts">${pts.map((p) => `<button type="button" class="profile-pt" data-go="acupoint?id=${p.id}"><b>${esc(p.name)}</b><span>${esc(p.locate || '')}</span><span>${esc(p.benefit || '')}</span><em>建议 ${p.min || 10} 分钟 · 温热舒适即可</em></button>`).join('')}</div><p class="faint small mt8">每周看自己的状态做 2～3 次。每穴以温热舒服为度，皮肤发烫就拿远一点。</p>`,
    };
    return `<div class="sec card profile-file">
      <div class="small muted">我的体质</div>
      <div class="result-type">${esc(c.type)}</div>
      <p class="profile-desc">${esc(t.desc)}</p>
      ${tops.length ? `<div class="bars">${tops.map((k) => `<div class="bar-row"><span>${k}</span><div class="bar"><i style="width:${c.scores[k] * 20}%"></i></div><span class="faint small">${['', '不明显', '轻微', '有倾向', '较明显', '明显'][c.scores[k]] || ''}</span></div>`).join('')}</div>` : ''}
    </div>
    ${ui.sec('调养参考')}
    <div class="sec card" id="profileCare">
      <div class="chips ref-tags">${tabs.map(([id, name]) => `<button type="button" class="chip ${care === id ? 'on' : ''}" data-care="${id}" onclick="XA.act.profileCare('${id}')">${name}</button>`).join('')}</div>
      ${tabs.map(([id]) => `<div class="profile-panel" data-panel="${id}" ${care === id ? '' : 'hidden'}>${panels[id]}</div>`).join('')}
    </div>
    <div class="sec profile-foot">
      <div class="faint small">测试时间：${XA.d.full(c.at)}</div>
      <div class="profile-actions">
        <button class="btn btn-primary" onclick="XA.act.testStart();XA.go('test',true)">重新测试</button>
        <button class="btn btn-danger" onclick="XA.act.delProfile()">删除体质档案</button>
      </div>
    </div>
    <div class="sec">${ui.disclaimer('体质结果为养生参考，非医疗诊断。如有身体不适，请及时就医。')}</div>`;
  };
  const profilePage = (q) => {
    const c = XA.state.constitution;
    if (!c || !D.types[c.type]) return ui.empty('您还没有做过体质测试', '3 分钟测一测', 'test');
    const banner = q && q.first ? `<div class="sec banner-ok">${icon('coin')}<span>测试完成，<b>20 积分</b>已到账。首页推荐已按您的体质更新。</span></div>` : '';
    return banner + profileFile(c);
  };
  XA.page('test-result', {
    title: '体质档案',
    render: profilePage,
    footer() {
      if (!XA.state.constitution) return '';
      return `<button class="btn btn-primary btn-block" data-go="home">回首页</button>`;
    },
  });
  XA.act.profileCare = (id) => {
    XA.tmp.profileCare = id;
    const root = XA.$('#profileCare');
    if (!root) return XA.refresh();
    root.querySelectorAll('[data-care]').forEach((el) => el.classList.toggle('on', el.dataset.care === id));
    root.querySelectorAll('[data-panel]').forEach((el) => { el.hidden = el.dataset.panel !== id; });
  };
  XA.act.delProfile = () => XA.modal({
    title: '删除体质档案？', content: '删除后，首页将不再按体质推荐内容。此操作不可恢复，您可以随时重新测试。', confirmText: '删除', danger: true,
    onConfirm: () => { XA.state.constitution = null; XA.save(); XA.toast('体质档案已删除'); XA.refresh(); },
  });
  XA.page('profile', {
    title: '体质档案',
    render: profilePage,
    footer(q) {
      if (!q || (!q.done && !q.first) || !XA.state.constitution) return '';
      return `<button class="btn btn-primary btn-block" data-go="home">回首页</button>`;
    },
  });

  /* ================= 穴位图谱（字典 + 直观定位） ================= */
  /* 人体示意图：极简圆润人形；可聚焦放大、显示身体对照标志、高亮当前穴 */
  const figure = (view, opt = {}) => {
    const { activeIds, focusId, clickable, landmarks = true, labels = true } = opt;
    const pts = D.points.filter((p) => p.view === view);
    const focus = focusId && D.point(focusId);
    const z = focus && focus.view === view ? D.pointZoom(focus) : null;
    const vb = z ? `${z.x} ${z.y} ${z.w} ${z.h}` : '0 0 200 440';
    const c = '#DDEAE2', mk = D.landmarks[view] || [];
    return `<svg class="figure ${z ? 'zoomed' : ''}" viewBox="${vb}" aria-label="${view === 'front' ? '正面' : '背面'}人体示意图">
      <g fill="none" stroke="${c}" stroke-linecap="round" stroke-linejoin="round">
        <path d="M100 56v22" stroke-width="20"/>
        <path d="M63 96 L47 170 L36 238" stroke-width="21"/>
        <path d="M137 96 L153 170 L164 238" stroke-width="21"/>
        <path d="M84 236 L80 330 L78 420" stroke-width="31"/>
        <path d="M116 236 L120 330 L122 420" stroke-width="31"/>
      </g>
      <circle cx="100" cy="36" r="23" fill="${c}"/>
      <path d="M60 86 Q100 70 140 86 L131 178 Q129 212 135 244 L65 244 Q71 212 69 178 Z" fill="${c}"/>
      ${view === 'back' ? `<path d="M100 70V236" stroke="#C3D8CB" stroke-width="2" stroke-dasharray="3 5" stroke-linecap="round"/>` : ''}
      ${landmarks ? mk.map((m) => `<g class="lm"><circle cx="${m.x}" cy="${m.y}" r="2.2" fill="#9bb5a6"/><text class="lm-t" x="${m.x + 6}" y="${m.y + (pts.some((p) => Math.hypot(m.x-p.x,m.y-p.y)<12) ? -10 : 3.5)}">${m.t}</text></g>`).join('') : ''}
      ${pts.map((p) => {
        const on = !activeIds || activeIds.includes(p.id);
        const cur = focusId === p.id;
        const left = p.x < 100;
        return `<g class="pt ${on ? 'on' : 'off'} ${cur ? 'cur' : ''}" ${clickable ? `onclick="XA.act.ptSheet('${p.id}')"` : ''}>
          <circle cx="${p.x}" cy="${p.y}" r="${cur ? 22 : 15}" fill="transparent"/>
          <circle class="pt-halo" cx="${p.x}" cy="${p.y}" r="${cur ? 12 : 8.5}"/>
          <circle class="pt-dot" cx="${p.x}" cy="${p.y}" r="${cur ? 5.5 : 4}"/>
          ${labels || cur ? `<text x="${left ? p.x - 13 : p.x + 13}" y="${p.y + 4.5}" text-anchor="${left ? 'end' : 'start'}">${p.name}</text>` : ''}
        </g>`;
      }).join('')}
    </svg>`;
  };

  const viewNameOf = (view) => ({ front: '正面', back: '背面', head: '头顶', sole: '足底' }[view] || '示意图');
  const locateCard = (p, compact) => {
    const fig = p.x != null
      ? figure(p.view === 'back' ? 'back' : 'front', { focusId: p.id, activeIds: [p.id], clickable: false, labels: true })
      : `<div class="locate-ph">${viewNameOf(p.view)}</div>`;
    const gray = p.meridian || p.code || p.locate || '';
    return `
    <div class="locate ${compact ? 'sm' : ''}">
      <div class="locate-top">
        <div class="locate-fig">${fig}</div>
        <div class="locate-side">
          <span class="tag tag-gray">${esc(p.part || '穴位')}</span>
          ${gray ? `<div class="faint small">${esc(gray)}</div>` : ''}
        </div>
      </div>
      <ol class="locate-steps">${D.locateSteps(p).map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
      <div class="faint small">对照图上灰色小字是身体标志（如肚脐、膝盖），先找标志再量距离，更容易找准。</div>
    </div>`;
  };

  XA.act.ptSheet = (id) => {
    const entry = D.atlasExtras.find(p => p.id === id);
    if (entry) {
      XA.sheet({ title: entry.name, html: `${locateCard(entry, true)}` });
      return;
    }
    const p = D.point(id);
    XA.sheet({
      title: `${p.name} <span class="faint small">${p.py}</span>`,
      html: `${locateCard(p, true)}
        <div class="kv mt12"><b>保健作用</b><span>${p.benefit}</span></div>
        <div class="kv warn"><b>注意</b><span>${p.caution}</span></div>`,
    });
  };
  let releaseAtlas;
  XA.act.acuPart = (part) => {
    XA.tmp.acuPart = part; XA.tmp.atlasPitch = 0;
    const views = new Set(D.points.filter((p) => p.part === part).map((p) => p.view));
    if (views.size === 1) XA.tmp.atlasAngle = views.has('front') ? 0 : Math.PI;
    XA.refresh();
  };
  XA.page('acupoints', {
    title: '穴位图谱',
    render(q) {
      const focus = D.atlasPoints.find(p => p.id === q.focus);
      const part = XA.tmp.acuPart || '全部';
      const parts = ['全部', '头颈', '胸腹', '腰背', '上肢', '下肢'];
      const list = D.atlasPoints.filter((p) => part === '全部' || p.part === part);
      return `
      <div class="sec card atlas-card" id="bodyAtlas">
        <div class="atlas-head"><b class="atlas-orientation">正面</b><div class="atlas-views"><button data-model="male">男体</button><button data-model="female">女体</button></div></div>
        <div class="atlas-angle-bar atlas-views"><button data-view="front">正面</button><button data-view="back">背面</button><button data-view="head">头顶</button><button data-view="sole">足底</button></div>
        <div class="atlas-stage"><canvas aria-hidden="true"></canvas><svg class="atlas-labels" viewBox="0 0 320 460" aria-label="穴位名称与位置"></svg></div>
        <div class="atlas-caption">${focus ? '当前穴位 · ' + focus.name + '　' : ''}左右转身，上下查看头顶和足底</div>
      </div>
      ${focus ? `<div class="sec"><button class="btn btn-tonal btn-block" onclick="XA.go('acupoints',true)">查看全部穴位</button></div>` : ''}
      ${ui.sec('按部位查找')}
      <div class="chips pad acu-parts">${parts.map((p) => `<button class="chip ${p === part ? 'on' : ''}" onclick="XA.act.acuPart('${p}')">${p}</button>`).join('')}</div>
      <div class="cells sec acu-rows">
        ${list.map((p) => `<div class="cell" data-go="acupoint?id=${p.id}"><span class="cell-ic">${icon('target')}</span><div class="cell-bd"><div class="acu-name"><b>${esc(p.name)}</b><span>${esc(p.part)}</span></div><div class="muted small">${esc(p.locate)}</div></div>${icon('right', 'faint')}</div>`).join('')}
      </div>
      <div class="sec"><button class="btn btn-tonal btn-block" data-go="symptoms">不知道灸哪里？试试对症找穴</button></div>
      <div class="sec">${ui.disclaimer()}</div>`;
    },
    mounted(q) {
      releaseAtlas = XA.mountAtlas(XA.$('#bodyAtlas'), q.focus, XA.tmp.acuPart || '全部');
    },
    unmount() { if (releaseAtlas) releaseAtlas(); },
  });
  const atlasPoint = (id) => D.atlasPoints.find((p) => p.id === id) || D.points[0];
  XA.page('acupoint', {
    title: (q) => atlasPoint(q.id).name,
    render(q) {
      const p = atlasPoint(q.id);
      const rel = D.videos[0];
      const minutes = p.min || 10;
      return `
      <div class="sec card">
        <div class="row between"><div><div class="h1">${p.name}</div><div class="faint">${p.py || p.code || ''}</div></div>
          <button class="btn btn-tonal btn-sm" data-go="acupoints?focus=${p.id}">在图谱中看</button></div>
        <div class="chips wrap mt12"><span class="tag tag-green">${p.meridian || p.code || '穴位'}</span><span class="tag tag-gray">${p.part} · ${viewNameOf(p.view)}</span></div>
        <div class="point-min">${icon('timer', 'ic-s')} 建议温灸 <b>${minutes}</b> 分钟</div>
      </div>
      ${ui.sec('怎么找准这个穴位')}
      <div class="sec card">${locateCard(p)}</div>
      ${p.benefit || p.caution ? `<div class="sec card">
        ${p.benefit ? `<div class="kv"><b>保健作用</b><span>${p.benefit}</span></div>` : ''}
        <div class="kv"><b>艾灸方法</b><span>艾条点燃后距皮肤 3～5 厘米悬灸，或使用艾灸盒温灸；以温热舒适、不烫为度。</span></div>
        ${p.caution ? `<div class="kv warn"><b>注意</b><span>${p.caution}</span></div>` : ''}
      </div>` : `<div class="sec card"><div class="kv"><b>艾灸方法</b><span>艾条点燃后距皮肤 3～5 厘米悬灸，或使用艾灸盒温灸；以温热舒适、不烫为度。</span></div></div>`}
      ${ui.sec('相关视频')}
      <div class="feed"><div class="fcard" data-go="video">${ui.art(rel.art, 'fcard-img')}<div class="fcard-bd"><div class="fcard-title">${rel.title}</div><div class="fcard-tags"><span class="tag tag-outline">视频</span><span class="faint small">${rel.author}</span></div></div></div></div>
      <div class="sec">${ui.disclaimer()}</div>`;
    },
    footer(q) {
      const p = atlasPoint(q.id);
      return `<button class="btn btn-primary btn-block" data-go="timer?ids=${p.id}&title=${encodeURIComponent(p.name)}&force=1">${icon('play', 'ic-s')}开始艾灸</button>`;
    },
  });

  /* ================= 对症找穴 ================= */
  XA.page('symptoms', {
    title: '对症找穴',
    render() {
      return `<div class="sec"><h2 class="h2">最近哪里不太舒服？</h2><div class="muted mt4">选一个最接近的，为您推荐日常保健穴位组合</div></div>
      <div class="sym-grid">
        ${D.symptoms.map((s) => `<button class="sym" data-go="symptom?id=${s.id}"><span class="sym-ic">${icon(s.icon)}</span><span>${s.name}</span></button>`).join('')}
      </div>
      <div class="sec">${ui.disclaimer('穴位保健仅用于日常养生参考，不能替代诊疗。症状持续或加重请及时就医。')}</div>`;
    },
  });
  XA.page('symptom', {
    title: (q) => (D.symptom(q.id) || D.symptoms[0]).name,
    render(q) {
      const s = D.symptom(q.id) || D.symptoms[0];
      const pts = s.pts.map(D.point), total = pts.reduce((a, p) => a + p.min, 0);
      const p = D.product(s.product);
      const views = ['front', 'back'].filter((v) => pts.some((x) => x.view === v));
      return `
      <div class="sec card">
        <div class="small muted">方案结果</div>
        <div class="h2 mt4">${esc(s.name)}・推荐配穴</div>
        <div class="muted mt4">${pts.map((x) => x.name).join('、')}</div>
        <div class="muted mt4">共 ${pts.length} 个穴位，建议约 ${total} 分钟 · 可在计时里改总时长</div>
        <div class="fig-pair">${views.map((v) => `<div>${figure(v, { activeIds: s.pts, clickable: true, labels: false })}<span class="faint small">${v === 'front' ? '正面' : '背面'} · 点圆点查看</span></div>`).join('')}</div>
      </div>
      <div class="cells sec">
        ${pts.map((x, i) => `<div class="cell" data-go="acupoint?id=${x.id}"><span class="num">${i + 1}</span><div class="cell-bd"><div class="bold">${x.name} <span class="faint small">温灸 ${x.min} 分钟</span></div><div class="muted small ell">${x.locate}</div></div>${icon('right', 'faint')}</div>`).join('')}
      </div>
      <div class="sec tipbox">${icon('info')}<span>${s.tip}</span></div>
      ${ui.sec('搭配好物')}
      <div class="feed">${ui.productCard(p, 'feed')}</div>
      <div class="sec">${ui.disclaimer('穴位保健仅用于日常养生参考，不能替代诊疗。症状持续或加重请及时就医。')}</div>`;
    },
    footer(q) {
      const s = D.symptom(q.id) || D.symptoms[0];
      return `<div class="row gap8 footer-duo"><button class="btn btn-tonal" onclick="XA.act.saveSymPlan('${s.id}')">${icon('leaf', 'ic-s')}保存方案</button><button class="btn btn-primary grow" data-go="timer?sym=${s.id}&title=${encodeURIComponent(s.name + '方案')}&force=1">${icon('play', 'ic-s')}一键开始艾灸</button></div>`;
    },
  });
  XA.act.saveSymPlan = (id) => {
    const s = D.symptom(id); if (!s) return;
    const plans = XA.state.myPlans || (XA.state.myPlans = []);
    plans.unshift({ id: XA.uid('fp'), name: s.name, ids: s.pts.slice(), at: Date.now(), from: 'sym' });
    XA.save();
    XA.toast('已保存到「我的配穴」', true);
  };

  /* ================= 轻音乐（Web Audio 合成氛围音，无需外链资源） ================= */
  const Ambient = (() => {
    let ctx, master, nodes = [], playing = false, idx = 0, fadeTimer;
    const tracks = () => D.timerTracks;
    const ensure = () => {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    };
    const clear = () => { nodes.forEach((n) => { try { n.stop(); n.disconnect(); } catch (e) {} }); nodes = []; if (master) try { master.disconnect(); } catch (e) {} master = null; };
    const start = (i) => {
      if (!window.AudioContext && !window.webkitAudioContext) return;
      clearTimeout(fadeTimer);
      ensure();
      if (i != null) idx = i;
      clear();
      const t = tracks()[idx] || tracks()[0];
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      master.gain.linearRampToValueAtTime(t.gain, ctx.currentTime + 1.2);
      t.freqs.forEach((f, k) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
        o.type = t.type; o.frequency.value = f;
        g.gain.value = 0.22 - k * 0.04;
        lfo.frequency.value = 0.08 + k * 0.03; lg.gain.value = 0.08;
        lfo.connect(lg); lg.connect(g.gain);
        o.connect(g); g.connect(master);
        o.start(); lfo.start();
        nodes.push(o, lfo);
      });
      playing = true;
      paintMusic();
    };
    const stop = () => {
      if (master && ctx) {
        try { master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4); } catch (e) {}
        clearTimeout(fadeTimer); fadeTimer = setTimeout(clear, 450);
      } else clear();
      playing = false;
      paintMusic();
    };
    const paintMusic = () => {
      const on = XA.$('#tmMusic');
      if (!on) return;
      on.classList.toggle('on', playing);
      on.setAttribute('aria-pressed', tm().music !== false);
      on.textContent = tm().music === false ? '伴奏已关闭' : playing ? '伴奏播放中 · 静音' : '自动伴奏已开启';
    };
    return { start, stop, paint: paintMusic };
  })();

  /* ================= 艾灸计时器：选问题 → 选时长 → 内置/手选穴位 → 轻音乐伴随计时 ================= */
  const SPEED = 30; // 演示加速：1 秒 ≈ 30 秒
  let T = null;
  const mmss = (s) => `${String(Math.max(0, Math.floor(s / 60))).padStart(2, '0')}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, '0')}`;
  const tm = () => (XA.tmp.tm || (XA.tmp.tm = {}));
  const tmTotal = () => (tm().items || []).reduce((a, x) => a + x.min, 0);

  /* 图谱穴位都可进入计时；扩展穴没有单独建议时长时按 10 分钟 */
  const timerPoint = (id) => {
    const p = D.atlasPoints.find((x) => x.id === id);
    if (!p) return null;
    return Object.assign({}, p, { min: p.min || 10, locate: p.locate || '对照穴位图谱定位' });
  };
  const allocTimerMins = (ids, total) => {
    const pts = ids.map(timerPoint).filter(Boolean);
    if (!pts.length) return [];
    const sum = pts.reduce((a, p) => a + p.min, 0) || 1;
    let left = total;
    const out = pts.map((p, i) => {
      const m = i === pts.length - 1 ? left : Math.max(5, Math.round(total * p.min / sum));
      left -= m;
      return { id: p.id, min: Math.max(5, m) };
    });
    if (left !== 0 && out.length) out[out.length - 1].min = Math.max(5, out[out.length - 1].min + left);
    return out;
  };
  /* 默认用每个穴位自己的建议时长；只有点了 20/30/45 才按总时长重分 */
  const suggestedItems = (ids) => ids.map(timerPoint).filter(Boolean).map((p) => ({ id: p.id, min: p.min }));
  const planForItems = (items) => {
    const total = (items || []).reduce((a, x) => a + x.min, 0);
    const hit = D.timerPlans.find((p) => p.mins === total);
    return hit ? hit.id : '';
  };
  const applySuggested = (s, ids) => {
    s.items = suggestedItems(ids);
    s.plan = planForItems(s.items);
    s.planTouched = false;
  };

  const initSetup = (q) => {
    const s = tm();
    const src = q.sym ? 'sym:' + q.sym : q.ids ? 'ids:' + q.ids + '|' + (q.title || '') : '';
    /* force 只消费一次：同一来源首次进入重建，之后页内刷新（改时长/加穴位）保留编辑 */
    const forceNew = !!q.force && s._forceKey !== src;
    if (s.ready && !forceNew && ((src && s._src === src) || !src)) return s;
    const c = XA.state.constitution;
    let ids, title, from;
    if (q.sym && D.symptom(q.sym)) {
      const sy = D.symptom(q.sym); ids = sy.pts.slice(); title = sy.name; from = 'sym';
    } else if (q.ids) {
      ids = q.ids.split(',').map((id) => id.trim()).filter(timerPoint); title = ids.length === 1 ? timerPoint(ids[0]).name : '临时配穴'; from = 'ids';
    } else {
      /* 独立工具：不带任何推荐，从空方案开始，由用户自主添加穴位 */
      ids = []; title = '临时配穴'; from = 'default';
    }
    /* 入口可显式指定方案名（如"睡不踏实方案"/"足三里"/我的配穴名）；URLSearchParams 已解码 */
    if (q.title) title = q.title;
    s.sym = q.sym || '';
    s.title = title;
    s.from = from;
    applySuggested(s, ids);
    s.music = true;
    s._src = src || from;
    if (q.force) s._forceKey = src;
    s.ready = true;
    return s;
  };

  XA.act.tmPlan = (id) => {
    const s = tm();
    const ids = (s.items || []).map((x) => x.id);
    if (s.plan === id) {
      s.items = suggestedItems(ids);
      s.plan = '';
      s.planTouched = false;
      XA.refresh();
      return;
    }
    const p = D.timerPlans.find((x) => x.id === id);
    if (!p) return;
    s.plan = id;
    s.planTouched = true;
    s.items = allocTimerMins(ids, p.mins);
    XA.refresh();
  };
  XA.act.tmSym = (id) => {
    const s = tm(), sy = D.symptom(id);
    if (!sy) return;
    s.sym = id; s.title = sy.name; s.from = 'sym';
    if (s.planTouched && s.plan) {
      const p = D.timerPlans.find((x) => x.id === s.plan) || D.timerPlans[1];
      s.items = allocTimerMins(sy.pts, p.mins);
    } else applySuggested(s, sy.pts);
    XA.refresh();
  };
  XA.act.tmMin = (i, d) => {
    const s = tm(), it = s.items[i];
    if (!it) return;
    it.min = Math.max(5, Math.min(30, it.min + d));
    s.planTouched = false;
    s.plan = planForItems(s.items);
    XA.refresh();
  };
  XA.act.tmDel = (i) => {
    const s = tm();
    if (s.items.length <= 1) return XA.toast('至少保留一个穴位');
    s.items.splice(i, 1);
    XA.refresh();
  };
  XA.act.tmMove = (i, d) => {
    const s = tm(), j = i + d;
    if (j < 0 || j >= s.items.length) return;
    const t = s.items[i]; s.items[i] = s.items[j]; s.items[j] = t;
    XA.refresh();
  };
  XA.act.tmPick = () => {
    const s = tm(), chosen = new Set(s.items.map((x) => x.id));
    const groups = ['头颈', '胸腹', '腰背', '上肢', '下肢'];
    XA.tmp.tmPickQ = '';
    const paint = () => {
      const q = (XA.tmp.tmPickQ || '').trim();
      const bodyEl = XA.$('#tmPickBody');
      if (!bodyEl) return;
      const html = groups.map((name) => {
        const list = D.atlasPoints.filter((p) => p.part === name && (!q || p.name.includes(q)));
        if (!list.length) return '';
        return `<div class="point-part">${name}</div><div class="point-picks">${list.map((p) => `<button type="button" class="chip ${chosen.has(p.id) ? 'on' : ''}" onclick="XA.act.tmPickToggle('${p.id}')">${p.name}</button>`).join('')}</div>`;
      }).join('');
      bodyEl.innerHTML = html || '<div class="faint small">没有匹配的穴位</div>';
      const n = XA.$('#tmPickN'); if (n) n.textContent = chosen.size;
    };
    XA.act.tmPickToggle = (id) => {
      if (chosen.has(id)) { if (chosen.size <= 1) return XA.toast('至少保留一个穴位'); chosen.delete(id); }
      else chosen.add(id);
      paint();
    };
    XA.sheet({
      title: '选择穴位',
      titleCls: 'sheet-title',
      hideClose: true,
      html: `<div class="searchbar input mb8">${icon('search')}<input id="tmPickQ" type="search" placeholder="搜穴位名，快速点选"></div><div id="tmPickBody"></div>`,
      footer: `<button class="btn btn-primary btn-block" onclick="XA.act.tmPickOk()">完成（已选 <span id="tmPickN">${chosen.size}</span>）</button>`,
    });
    paint();
    const input = XA.$('#tmPickQ');
    if (input) input.oninput = () => { XA.tmp.tmPickQ = input.value; paint(); };
    XA.act.tmPickOk = () => {
      const ids = [...chosen];
      if (s.planTouched && s.plan) {
        const p = D.timerPlans.find((x) => x.id === s.plan) || D.timerPlans[1];
        s.items = allocTimerMins(ids, Math.max(p.mins, ids.length * 5));
      } else applySuggested(s, ids);
      s.title = '自选穴位'; s.from = 'custom'; s.sym = '';
      XA.closeSheet(); XA.refresh();
    };
  };
  /* 拖拽排序：把 from 位置的穴位移动到 to 位置 */
  XA.act.tmReorder = (from, to) => {
    const s = tm();
    if (from == null || to == null || from === to || !s.items[from]) return;
    const [it] = s.items.splice(from, 1);
    s.items.splice(to, 0, it);
    XA.refresh();
  };
  /* 从全部穴位里多选追加到本次方案 */
  XA.act.tmAddFav = () => {
    const s = tm();
    const parts = ['头颈', '胸腹', '腰背', '上肢', '下肢'];
    const groups = parts.map((part) => ({ part, pts: D.points.filter((p) => p.part === part) })).filter((g) => g.pts.length);
    const other = D.points.filter((p) => !parts.includes(p.part));
    if (other.length) groups.push({ part: '其他', pts: other });
    const chosen = new Set();
    const paint = () => {
      const body = XA.$('#tmAddFavBody');
      if (!body) return;
      body.innerHTML = groups.map((g) => `<div class="pick-group"><div class="pick-group-hd">${esc(g.part)}</div><div class="point-picks">${g.pts.map((p) => `<button type="button" class="chip ${chosen.has(p.id) ? 'on' : ''}" onclick="XA.act.tmAddFavToggle('${p.id}')">${esc(p.name)}</button>`).join('')}</div></div>`).join('');
      const n = XA.$('#tmAddFavN'); if (n) n.textContent = chosen.size;
    };
    XA.act.tmAddFavToggle = (id) => { if (chosen.has(id)) chosen.delete(id); else chosen.add(id); paint(); };
    XA.sheet({
      title: '添加穴位',
      titleCls: 'sheet-title',
      hideClose: true,
      html: `<div class="faint small mb8">从全部穴位中选择，追加到本次艾灸；已选中的会自动跳过。</div><div id="tmAddFavBody"></div>`,
      footer: `<button class="btn btn-primary btn-block" onclick="XA.act.tmAddFavOk()">添加（已选 <span id="tmAddFavN">0</span>）</button>`,
    });
    paint();
    XA.act.tmAddFavOk = () => {
      const exist = new Set((s.items || []).map((x) => x.id));
      let added = 0;
      chosen.forEach((id) => { if (!exist.has(id)) { s.items.push({ id, min: timerPoint(id).min }); added++; } });
      XA.closeSheet();
      if (added) { s.plan = planForItems(s.items); XA.refresh(); XA.toast('已添加 ' + added + ' 个穴位', true); }
      else XA.toast('所选穴位已在本次方案中');
    };
  };
  XA.act.tmGo = () => XA.needLogin(() => {
    const s = tm();
    if (!s.items || !s.items.length) return XA.toast('请先选择穴位');
    s.track = Math.floor(Math.random() * D.timerTracks.length);
    XA.tmp.tmAutoStart = true; /* 进入即自动开始计时 */
    XA.go('timer-run');
  }, '登录后才能开始计时');

  /* ---------- 计时进行中 ---------- */
  const paintRun = () => {
    if (!T) return;
    const it = T.items[T.idx], p = timerPoint(it.id), total = it.min * 60, C = 2 * Math.PI * 88;
    const $ = XA.$;
    if (!$('#tmTime') || !p) return;
    $('#tmTime').textContent = mmss(T.left);
    $('#tmName').textContent = p.name;
    $('#tmRing').setAttribute('stroke-dashoffset', String(C * (1 - T.left / total)));
    $('#tmBtn').innerHTML = T.running ? `${icon('pause', 'ic-s')} 暂停` : `${icon('play', 'ic-s')} ${T.left < total ? '继续' : '开始'}`;
    $('#tmStep').textContent = `第 ${T.idx + 1} / ${T.items.length} 个 · 本穴 ${it.min} 分钟`;
    const tip = $('#tmTip'); if (tip) tip.textContent = D.locateSteps(p)[1] || p.locate;
    XA.$$('.tm-item').forEach((el, i) => { el.className = 'cell tm-item ' + (i < T.idx ? 'done' : i === T.idx ? 'cur' : ''); });
    const map = $('#tmMap');
    if (map && map.dataset.point !== p.id) {
      map.dataset.point = p.id;
      map.innerHTML = p.x != null ? figure(p.view === 'back' ? 'back' : 'front', { focusId: p.id, activeIds: [p.id], clickable: false }) : `<div class="faint small center" style="padding:28px 16px">${esc(p.locate)}</div>`;
    }
    const remaining = T.items.slice(T.idx + 1);
    $('#tmRemaining').textContent = mmss(T.left + remaining.reduce((a,x) => a + x.min * 60, 0));
    $('#tmUpcoming').textContent = remaining.length ? '下一穴 · ' + (timerPoint(remaining[0].id) || {}).name : '当前为最后一穴';
    $('#tmNext').textContent = remaining.length ? '下一个' : '完成';
    Ambient.paint();
  };
  const stopRun = () => { if (T && T.iv) { clearInterval(T.iv); T.iv = null; } if (T) T.running = false; };
  const finishAll = () => {
    stopRun(); Ambient.stop(); paintRun();
    const totalMin = T.items.reduce((a, x) => a + x.min, 0);
    const planName = (tm().title) || '艾灸';
    /* 结束自动写入养生日志 */
    if (XA.state.loggedIn) {
      const list = Array.isArray(XA.state.journal) ? XA.state.journal : (XA.state.journal = []);
      list.unshift({
        id: Date.now(), at: new Date().toISOString(), savedAt: new Date().toISOString(),
        slot: '', mins: `${totalMin} 分钟`, feel: [], sleep: [], after: [],
        points: T.items.map((x) => x.id), source: 'timer', title: planName,
      });
      XA.save();
    }
    XA.modal({
      title: '本次艾灸完成',
      content: `「${esc(planName)}」共温灸 ${T.items.length} 个穴位，约 ${totalMin} 分钟，已记入养生日志。记得喝一杯温水、注意保暖；结束后确认艾条完全熄灭。`,
      confirmText: '好的', cancelText: false,
      onConfirm: () => XA.go('timer', true),
    });
  };
  XA.act.tmNext = () => {
    if (!T) return;
    if (T.idx >= T.items.length - 1) return finishAll();
    T.idx++; T.left = T.items[T.idx].min * 60;
    XA.toast(`下一个：${(timerPoint(T.items[T.idx].id) || {}).name}`);
    paintRun();
  };
  XA.act.tmToggle = () => XA.needLogin(() => {
    if (!T) return;
    if (T.running) { stopRun(); Ambient.stop(); return paintRun(); }
    T.running = true;
    if (tm().music !== false) Ambient.start(tm().track);
    T.iv = setInterval(() => {
      T.left -= SPEED / 4;
      if (T.left <= 0) { T.left = 0; paintRun(); XA.act.tmNext(); return; }
      paintRun();
    }, 250);
    paintRun();
  }, '登录后才能开始计时');
  XA.act.tmMusic = () => {
    if (!T) return;
    tm().music = tm().music === false;
    if (tm().music && T.running) Ambient.start(tm().track);
    else Ambient.stop();
    Ambient.paint();
  };
  XA.act.tmShowPoint = () => {
    if (!T) return;
    const id = T.items[T.idx].id;
    if (!D.point(id)) return XA.act.ptSheet(id);
    const p = timerPoint(id);
    XA.sheet({
      title: `找准 ${p.name}`,
      html: `${locateCard(p)}
        <button class="btn btn-tonal btn-block mt12" onclick="XA.closeSheet();XA.go('acupoints?focus=${p.id}')">打开穴位图谱对照</button>`,
    });
  };

  XA.page('timer', {
    title: '艾灸计时',
    render(q) {
      const s = initSetup(q || {});
      const drawn = s.items.map((x) => D.point(x.id)).filter((p) => p && p.x != null);
      const views = ['front', 'back'].filter((v) => drawn.some((p) => p.view === v));
      return `
      <div class="sec timer-plan-head"><div><span>本次艾灸方案</span><h2>${esc(s.title)}</h2><small>${s.items.length} 个穴位 · ${s.planTouched ? '按所选时长' : '按建议时长'} · 拖动可排序</small></div><div class="plan-duration"><b>${tmTotal()}</b> 分钟</div></div>
      ${ui.sec('本次穴位与时长')}
      <div class="sec row between" style="margin-top:-4px"><span class="faint small">长按拖动排序，可调整每穴时长</span>${s.from === 'sym' ? '' : `<button class="btn btn-tonal btn-sm" onclick="XA.act.tmAddFav()">${icon('plus', 'ic-s')}添加穴位</button>`}</div>
      <div class="cells sec" id="tmSortList">
        ${!s.items.length ? `<div class="cell"><div class="cell-bd muted small">还没有穴位，点右上角「添加穴位」从全部穴位中选取，开始自主搭配。</div></div>` : ''}
        ${s.items.map((it, i) => {
          const p = timerPoint(it.id);
          if (!p) return '';
          return `<div class="cell tm-edit" draggable="true" data-idx="${i}">
            <span class="tm-grip" aria-label="拖动排序">≡</span>
            <div class="cell-bd" onclick="XA.act.ptSheet('${p.id}')"><div class="bold">${p.name}</div><div class="muted small ell">${p.locate}</div><div class="faint small">建议 ${p.min} 分钟</div></div>
            <div class="tm-ops">
              <div class="stepper sm"><button onclick="XA.act.tmMin(${i},-5)" ${it.min <= 5 ? 'disabled' : ''}>${icon('minus')}</button><span>${it.min}′</span><button onclick="XA.act.tmMin(${i},5)">${icon('plus')}</button></div>
              <div class="tm-ops-row">
                <button class="icon-btn" onclick="XA.act.tmMove(${i},-1)" aria-label="上移">${icon('up')}</button>
                <button class="icon-btn" onclick="XA.act.tmDel(${i})" aria-label="删除">${icon('trash')}</button>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
      ${ui.sec('快捷时长')}
      <div class="sec tm-plans">${D.timerPlans.map((p) => `<button class="tm-plan ${s.plan === p.id ? 'on' : ''}" onclick="XA.act.tmPlan('${p.id}')"><b>${p.name}</b><em>${p.mins} 分钟</em><span>${p.desc}${p.hot ? ' · 常用' : ''}</span></button>`).join('')}</div>
      ${views.length ? `<div class="sec card figure-card">
        <div class="fig-pair">${views.map((v) => `<div>${figure(v, { activeIds: s.items.map((x) => x.id), clickable: true, labels: false })}<span class="faint small">${v === 'front' ? '正面' : '背面'}</span></div>`).join('')}</div>
        <div class="faint small center mt8">点圆点可预览取穴方法。图谱扩展穴请在列表里点开查看。</div>
      </div>` : ''}
      <div class="sec">${ui.disclaimer('艾灸时请保持通风、远离易燃物；结束后确认艾条完全熄灭。穴位保健不能替代诊疗。')}</div>`;
    },
    mounted() {
      /* HTML5 拖拽排序（桌面/支持拖动的 WebView；触屏用上移按钮兜底） */
      const list = XA.$('#tmSortList');
      if (list) {
        let dragIdx = null;
        list.querySelectorAll('.tm-edit[draggable]').forEach((el) => {
          el.addEventListener('dragstart', (e) => { dragIdx = Number(el.dataset.idx); el.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
          el.addEventListener('dragend', () => { el.classList.remove('dragging'); dragIdx = null; });
          el.addEventListener('dragenter', () => { if (dragIdx != null) el.classList.add('drag-over'); });
          el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
          el.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
          el.addEventListener('drop', (e) => {
            e.preventDefault(); el.classList.remove('drag-over');
            const to = Number(el.dataset.idx);
            if (dragIdx != null && to !== dragIdx) XA.act.tmReorder(dragIdx, to);
          });
        });
      }
    },
    footer() {
      return `<div class="grow"><div class="bold">约 ${tmTotal()} 分钟 · ${tm().items.length} 个穴位</div><div class="small faint">计时开始后自动播放伴奏</div></div><button class="btn btn-primary" style="min-width:8.5rem" onclick="XA.act.tmGo()">${icon('play', 'ic-s')}进入计时</button>`;
    },
  });

  XA.page('timer-run', {
    title: '艾灸中',
    render() {
      const s = tm();
      if (!s.items || !s.items.length) return `<div class="empty">${XA.art('moxa', 'sage', 'empty-art')}<div class="empty-t">您还没有艾灸方案</div><button class="btn btn-primary mt16" data-go="timer">去设置</button></div>`;
      T = { items: s.items.map((x) => ({ ...x })), idx: 0, left: s.items[0].min * 60, running: false, iv: null };
      const C = 2 * Math.PI * 88;
      return `<div class="timer">
        <div class="faint" id="tmStep"></div><div class="timer-summary"><span>全程剩余 <b id="tmRemaining"></b></span><span id="tmUpcoming"></span></div>
        <button class="tm-map card" id="tmMap" onclick="XA.act.tmShowPoint()" aria-label="查看取穴方法"></button>
        <div class="faint small center" id="tmTip" style="margin:-4px 20px 8px"></div>
        <div class="timer-ring">
          <svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" class="ring-bg"/><circle id="tmRing" cx="100" cy="100" r="88" class="ring-fg" stroke-dasharray="${C}" stroke-dashoffset="0" transform="rotate(-90 100 100)"/></svg>
          <div class="timer-in"><div class="timer-name" id="tmName"></div><div class="timer-time" id="tmTime"></div><div class="faint small">温热舒适，不烫为度</div></div>
        </div>
        <button class="tm-music" id="tmMusic" onclick="XA.act.tmMusic()"></button>
        <div class="row gap8 center mb8"><button class="btn btn-ghost btn-sm" onclick="XA.act.tmShowPoint()">找不准？看图谱</button></div>
        <div class="row gap12 timer-btns">
          <button class="btn btn-primary grow" id="tmBtn" onclick="XA.act.tmToggle()"></button>
          <button class="btn btn-tonal" id="tmNext" onclick="XA.act.tmNext()">${s.items.length > 1 ? '下一个' : '完成'}</button>
        </div>
        <div class="faint small center">演示模式已加速（1 秒 ≈ 30 秒）</div>
      </div>
      ${ui.sec('本次顺序')}
      <div class="cells sec">
        ${s.items.map((it, i) => {
          const p = timerPoint(it.id);
          if (!p) return '';
          return `<div class="cell tm-item" onclick="XA.tmp.tmPeek=${i};XA.act.ptSheet('${p.id}')"><span class="num">${i + 1}</span><div class="cell-bd"><div class="bold">${p.name}</div><div class="muted small ell">${p.locate}</div></div><span class="faint small">${it.min} 分钟</span></div>`;
        }).join('')}
      </div>
      <div class="sec">${ui.disclaimer('艾灸时请保持通风、远离易燃物，结束后确认艾条完全熄灭。')}</div>`;
    },
    mounted() {
      paintRun();
      /* 从「进入计时」进入时直接开始，无需再点一次开始 */
      if (XA.tmp.tmAutoStart) { XA.tmp.tmAutoStart = false; if (T && !T.running) XA.act.tmToggle(); }
    },
    unmount() { stopRun(); Ambient.stop(); },
  });
})();
