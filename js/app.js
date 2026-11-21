/* app.js —— 桌面端左侧导览面板 + 启动 */
(function () {
  const guide = document.getElementById('guide');
  const paint = (p) => {
    const lv = XA.level();
    guide.innerHTML = `
      <div class="g-brand"><span class="logo-dot">艾</span><div><b>晓艾小程序</b><span>交互原型 · 基于需求文档 V1.4</span></div></div>
      <p class="g-desc">商品、课程与门店资料由运营后台发布；个人体验记录保存在本机。</p>
      <div class="g-title">演示开关</div>
      <div class="g-row"><div><b>长辈模式</b><span>精简核心功能 + 大字</span></div><button class="switch ${XA.state.careMode ? 'on' : ''}" onclick="XA.setCare(!XA.state.careMode)" role="switch" aria-checked="${!!XA.state.careMode}"><i></i></button></div>
      <div class="g-row"><div><b>登录状态</b><span>${XA.state.loggedIn ? '已登录：' + XA.state.user.name : '未登录（游客）'}</span></div><button class="g-btn" onclick="XA.state.loggedIn=!XA.state.loggedIn;XA.save();XA.refresh()">${XA.state.loggedIn ? '切到游客' : '切到已登录'}</button></div>
      <div class="g-row"><div><b>成长等级</b><span>${lv.name} · 成长值 ${XA.state.user.growth}</span></div><button class="g-btn" onclick="XA.state.user.growth+=2000;XA.save();XA.refresh()">成长值 +2000</button></div>
      <div class="g-row"><div><b>演示数据</b><span>订单、预约、积分等</span></div><button class="g-btn" onclick="XA.reset()">重置</button></div>
      <div class="g-foot">当前页面：<code>${p ? p.key : ''}</code></div>`;
  };
  const wechatPreview = new URLSearchParams(location.search).get('embed') === 'wechat';
  if (wechatPreview) {
    document.documentElement.classList.add('wechat-preview');
  } else {
    /* 右侧预览固定模拟真机视口 375×812（19.5:9 全面屏）；窗口放不下时整体等比缩小 */
    const real = window.matchMedia('(max-width: 520px) and (pointer: coarse)');
    const fit = () => {
      const k = real.matches ? 1 : Math.min(1, (window.innerWidth - 64) / 375, (window.innerHeight - 32) / 812);
      document.documentElement.style.setProperty('--k', Math.max(0.3, k).toFixed(4));
    };
    fit();
    window.addEventListener('resize', fit);
    XA.onRoute = paint;
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && XA.current()) XA.loadCatalog().then(() => { XA.act.askLocation(); XA.refresh(); }).catch(() => XA.toast('目录更新失败，请刷新重试'));
  });
  XA.loadCatalog().then(() => {
    /* 后端门店覆盖种子后，重新按真实坐标计算距离，保证「离我最近」等排序生效 */
    XA.act.askLocation();
    XA.start();
  }).catch(() => {
    document.getElementById('view').textContent = '业务目录暂时无法加载，请刷新重试。';
  });
})();
