/* views-domain.js —— 晓艾运营中台核心子系统视图（右侧侧边面板与就地工作台组合，彻底零弹层）
 * 1. content: 内容管理系统（短视频带货挂车、专栏课程大纲、养生图文、社区达人笔记与话题、创作者签约）
 * 2. store:   门店管理系统（认证网点档案、环境服务特色、10:00-21:00时段产能矩阵、前台验券核销、线下雅集）
 * 3. user:    用户与会员系统（会员CRM档案与财务资产调账、Plus会员年费包与发券、优惠券模板中心、分销团长裂变）
 * 4. finance: 财务结算系统（全渠道资金流水与对账平账、供应商进销存月度对账结算）
 */
(function () {
  const D = XA.data, S = () => XA.state, esc = XA.esc, icon = XA.icon;
  const ART_SHAPES = ['moxa', 'box', 'leaf', 'bath', 'patch', 'tea', 'room', 'person', 'book', 'season', 'bed', 'hand', 'calendar'];
  const ART_TONES = ['sage', 'clay', 'sand', 'rose', 'mist', 'ember', 'dusk', 'night'];
  const safeArt = (obj, defShape = 'leaf', defTone = 'sage') => {
    const a = obj?.art || obj?.gallery?.[0] || [defShape, defTone];
    return XA.art(a[0] || defShape, a[1] || defTone);
  };

  /* ============================================================================
   * 1. 内容管理系统 (content)
   * ============================================================================ */
  ADM.views.content = () => {
    const sub = ADM.sub.contentSub || 'videos'; // videos | courses | articles | notes | creators
    const topBar = `
      <div class="subnav-bar">
        <div class="seg-pills">
          <button class="seg-pill ${sub === 'videos' ? 'on' : ''}" onclick="ADM.setSub('contentSub','videos')">短视频选品带货 <em>${D.videos.length}</em></button>
          <button class="seg-pill ${sub === 'courses' ? 'on' : ''}" onclick="ADM.setSub('contentSub','courses')">专栏课程知识付费 <em>${D.courses.length}</em></button>
          <button class="seg-pill ${sub === 'articles' ? 'on' : ''}" onclick="ADM.setSub('contentSub','articles')">养生图文与节气 <em>${D.articles.length}</em></button>
          <button class="seg-pill ${sub === 'notes' ? 'on' : ''}" onclick="ADM.setSub('contentSub','notes')">社区达人笔记与话题 <em>${D.notes.length}</em></button>
          <button class="seg-pill ${sub === 'creators' ? 'on' : ''}" onclick="ADM.setSub('contentSub','creators')">签约创作者与达人 <em>${D.creators.length}</em></button>
        </div>
        <div class="row gap8">
          ${sub === 'videos' ? (ADM.mode.video === 'create' ? `<button class="btn-adm outline sm" onclick="ADM.setMode('video','detail')">返回编辑视频</button>` : `<button class="btn-adm primary sm" onclick="ADM.setMode('video','create')">+ 发布短视频</button>`) :
            sub === 'courses' ? (ADM.mode.course === 'create' ? `<button class="btn-adm outline sm" onclick="ADM.setMode('course','detail')">返回专栏大纲</button>` : `<button class="btn-adm primary sm" onclick="ADM.setMode('course','create')">+ 新建专栏</button>`) :
            sub === 'articles' ? (ADM.mode.article === 'create' ? `<button class="btn-adm outline sm" onclick="ADM.setMode('article','detail')">返回图文编辑</button>` : `<button class="btn-adm primary sm" onclick="ADM.setMode('article','create')">+ 新建养生图文</button>`) :
            sub === 'notes' ? (ADM.mode.note === 'create' ? `<button class="btn-adm outline sm" onclick="ADM.setMode('note','detail')">返回笔记列表</button>` : `<button class="btn-adm primary sm" onclick="ADM.setMode('note','create')">+ 发布达人笔记</button>`) :
            sub === 'creators' ? (ADM.mode.creator === 'create' ? `<button class="btn-adm outline sm" onclick="ADM.setMode('creator','detail')">返回创作者档案</button>` : `<button class="btn-adm primary sm" onclick="ADM.setMode('creator','create')">+ 签约新达人</button>`) : ''}
          <button class="btn-adm tonal sm" onclick="ADM.openPreview('feed')">在小程序预览内容流</button>
        </div>
      </div>
    `;

    // 1.1 短视频选品挂车
    if (sub === 'videos') {
      const kw = (ADM.filter.videoKw || '').trim();
      const list = D.videos.filter((v) => !kw || (v.title + v.author).includes(kw));
      const pg = ADM.paginate(list, 'cnt_videos', 6);
      const curId = ADM.sel.video && D.videos.some((v) => v.id === ADM.sel.video) ? ADM.sel.video : (pg.items[0]?.id || D.videos[0]?.id);
      ADM.sel.video = curId;
      const curVideo = D.videos.find((v) => v.id === curId) || D.videos[0];
      const cr = D.creators.find((c) => c.name === curVideo?.author) || D.creators[0];
      const isCreateVideo = ADM.mode.video === 'create';

      return `${topBar}
        <div class="bento-grid" style="grid-template-columns: 290px minmax(0, 1fr) 330px;">
          <!-- 视频列表 -->
          <section class="pane">
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('video')}<span>短视频库 (${list.length})</span></div>
              <input class="field-input" style="height:26px;width:100px" placeholder="搜标题/作者…" value="${esc(kw)}" oninput="ADM.filter.videoKw=this.value;ADM.page.cnt_videos=1;ADM.render()">
            </div>
            <div class="pane-bd dense">
              <div class="item-deck">
                ${pg.items.map((v) => `
                  <div class="deck-row ${(!isCreateVideo && v.id === curVideo?.id) ? 'on' : ''}" onclick="ADM.mode.video='detail';ADM.sel.video='${v.id}';ADM.render()">
                    <div class="deck-thumb">${safeArt(v, 'leaf', 'sage')}</div>
                    <div class="deck-main">
                      <div class="deck-title">${esc(v.title)}</div>
                      <div class="deck-meta">
                        <span>${esc(v.author)}</span>
                        <span>播 ${XA.wan(v.views || 1200)}</span>
                        <span>赞 ${v.likes}</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="pane-ft">${pg.pagerHtml}</div>
          </section>

          <!-- 中栏：就地发布或编辑短视频 -->
          <section class="pane">
            ${isCreateVideo ? `
              <div class="pane-hd" style="background:#f4f8f5">
                <div class="pane-hd-title">${icon('plus')}<span><b>就地发布短视频</b></span></div>
                <div class="row gap6">
                  <button class="btn-adm outline sm" onclick="ADM.setMode('video','detail')">取消</button>
                  <button class="btn-adm primary sm" onclick="ADM.act.saveNewVideoInline()">确认发布上线</button>
                </div>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="form-grid cols-3">
                  <div class="field col-span-2">
                    <span class="field-label">短视频标题 *</span>
                    <input class="field-input" id="inp_nv_title" placeholder="如：立冬温阳三部曲，这三个穴位艾灸暖全身">
                  </div>
                  <div class="field">
                    <span class="field-label">签约作者</span>
                    <select class="field-select" id="inp_nv_author">${D.creators.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}</select>
                  </div>
                  <div class="field">
                    <span class="field-label">视频时长</span>
                    <input class="field-input" id="inp_nv_dur" value="01:30">
                  </div>
                  <div class="field">
                    <span class="field-label">初始播放量</span>
                    <input type="number" class="field-input" id="inp_nv_views" value="1800">
                  </div>
                  <div class="field">
                    <span class="field-label">初始点赞</span>
                    <input type="number" class="field-input" id="inp_nv_likes" value="120">
                  </div>
                </div>
                <div class="mini-box col gap4">
                  <span class="field-label">初始挂载带货商品（发布后可在右侧继续调整）</span>
                  <select class="field-select" id="inp_nv_prod">${D.products.map(p => `<option value="${p.id}">${p.short} (¥${p.price})</option>`).join('')}</select>
                </div>
              </div>
            ` : curVideo ? `
              <div class="pane-hd">
                <div class="pane-hd-title">${icon('settings')}<span>编辑短视频 · <b>${esc(curVideo.title)}</b></span></div>
                <button class="btn-adm danger sm" onclick="ADM.act.deleteVideo('${curVideo.id}')">删除视频</button>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="form-grid cols-3">
                  <div class="field col-span-2">
                    <span class="field-label">短视频标题</span>
                    <input class="field-input" value="${esc(curVideo.title)}" onchange="curVideo.title=this.value;ADM.save('已修改视频标题');ADM.render()">
                  </div>
                  <div class="field">
                    <span class="field-label">绑定创作者</span>
                    <select class="field-select" onchange="curVideo.author=this.value;ADM.save('已切换创作者');ADM.render()">
                      ${D.creators.map((c) => `<option value="${c.name}" ${curVideo.author === c.name ? 'selected' : ''}>${esc(c.name)} (${esc(c.title)})</option>`).join('')}
                    </select>
                  </div>
                  <div class="field">
                    <span class="field-label">视频时长</span>
                    <input class="field-input" value="${esc(curVideo.duration || '01:45')}" onchange="curVideo.duration=this.value;ADM.save('已更新时长')">
                  </div>
                  <div class="field">
                    <span class="field-label">播放量</span>
                    <input type="number" class="field-input" value="${curVideo.views || 1200}" onchange="curVideo.views=+this.value;ADM.save('已更新播放量');ADM.render()">
                  </div>
                  <div class="field">
                    <span class="field-label">点赞数</span>
                    <input type="number" class="field-input" value="${curVideo.likes}" onchange="curVideo.likes=+this.value;ADM.save('已更新点赞')">
                  </div>
                </div>

                <!-- 挂载带货商品 -->
                <div class="mini-box">
                  <div class="field-label" style="margin-bottom:6px"><span>挂载带货商品 (点击直接切换挂载，视频播放页常驻右下角小黄车)</span></div>
                  <div class="chip-group">
                    ${D.products.map((p) => {
                      const on = (curVideo.attachedProducts || []).includes(p.id) || curVideo.productId === p.id;
                      return `<button class="chip-btn ${on ? 'on' : ''}" onclick="ADM.act.toggleVideoProduct('${curVideo.id}','${p.id}')">🛍️ ${esc(p.short)} (¥${p.price})</button>`;
                    }).join('')}
                  </div>
                </div>

                <div class="mini-box">
                  <div class="field-label" style="margin-bottom:6px"><span>挂载关联专栏课程</span></div>
                  <div class="chip-group">
                    ${D.courses.map((c) => {
                      const on = curVideo.courseId === c.id;
                      return `<button class="chip-btn gold ${on ? 'on' : ''}" onclick="curVideo.courseId=curVideo.courseId==='${c.id}'?'':'${c.id}';ADM.save('已更新挂载专栏');ADM.render()">📖 ${esc(c.title.slice(0, 10))}… (¥${c.price})</button>`;
                    }).join('')}
                  </div>
                </div>

                <div class="mini-box">
                  <div class="field-label" style="margin-bottom:6px"><span>挂载线下门店到店引流</span></div>
                  <div class="chip-group">
                    ${D.stores.slice(0, 6).map((st) => {
                      const on = curVideo.storeId === st.id;
                      return `<button class="chip-btn orange ${on ? 'on' : ''}" onclick="curVideo.storeId=curVideo.storeId==='${st.id}'?'':'${st.id}';ADM.save('已更新到店引流');ADM.render()">🏠 ${esc(st.name)}</button>`;
                    }).join('')}
                  </div>
                </div>
              </div>
            ` : '<div class="pane-bd center muted">暂无视频</div>'}
          </section>

          <!-- 右栏：侧边面板（带货转化效果与达人收益归因） -->
          <section class="pane">
            <div class="pane-hd"><div class="pane-hd-title">${icon('coin')}<span>带货效果实时归因</span></div></div>
            <div class="pane-bd" style="justify-content:space-between">
              <div class="mini-box col gap4">
                <div class="row between"><span class="tiny faint">千次播放带货额 (RPM)</span><b class="c-price">¥${Math.round((curVideo?.views || 1000) * 0.082)}</b></div>
                <div class="row between"><span class="tiny faint">累计带货下单笔数</span><b>${Math.round((curVideo?.likes || 100) * 0.28)} 笔</b></div>
                <div class="row between"><span class="tiny faint">达人佣金预估 (15%)</span><b class="c-gold">¥${Math.round((curVideo?.views || 1000) * 0.082 * 0.15)}</b></div>
              </div>
              <div class="mini-box col gap4">
                <div class="row between"><b>${esc(cr?.name || '签约达人')}</b><span class="adm-tag green">${esc(cr?.level || '签约达人')}</span></div>
                <div class="tiny muted">认证：${esc(cr?.title || '')} ｜ 粉丝：${XA.wan(cr?.followers || 10000)}</div>
                <div class="tiny faint">分销结算比率：${Math.round((cr?.commissionRate || 0.15) * 100)}%</div>
              </div>
            </div>
            <div class="pane-ft">
              <button class="btn-adm tonal sm grow" onclick="ADM.openPreview('feed')">在小程序播放预览</button>
            </div>
          </section>
        </div>
      `;
    }

    // 1.2 专栏课程知识付费（就地大纲维护与新建，零弹层）
    if (sub === 'courses') {
      const kw = (ADM.filter.courseKw || '').trim();
      const list = D.courses.filter((c) => !kw || (c.title + c.teacher).includes(kw));
      const pg = ADM.paginate(list, 'cnt_courses', 6);
      const curId = ADM.sel.course && D.courses.some((c) => c.id === ADM.sel.course) ? ADM.sel.course : (pg.items[0]?.id || D.courses[0]?.id);
      ADM.sel.course = curId;
      const curCourse = D.courses.find((c) => c.id === curId) || D.courses[0];
      const isCreateCourse = ADM.mode.course === 'create';

      return `${topBar}
        <div class="bento-grid" style="grid-template-columns: 310px minmax(0, 1fr);">
          <section class="pane">
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('doc')}<span>专栏课程库 (${list.length})</span></div>
              <input class="field-input" style="height:26px;width:100px" placeholder="搜专栏/讲师…" value="${esc(kw)}" oninput="ADM.filter.courseKw=this.value;ADM.page.cnt_courses=1;ADM.render()">
            </div>
            <div class="pane-bd dense">
              <div class="item-deck">
                ${pg.items.map((c) => `
                  <div class="deck-row ${(!isCreateCourse && c.id === curCourse?.id) ? 'on' : ''}" onclick="ADM.mode.course='detail';ADM.sel.course='${c.id}';ADM.render()">
                    <div class="deck-thumb">${safeArt(c, 'book', 'sage')}</div>
                    <div class="deck-main">
                      <div class="deck-title">${esc(c.title)}</div>
                      <div class="deck-meta">
                        <span class="c-price bold">¥${c.price}</span>
                        <span>${esc(c.author)}</span>
                        <span>${(c.lessons || []).length} 讲</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="pane-ft">${pg.pagerHtml}</div>
          </section>

          <section class="pane">
            ${isCreateCourse ? `
              <div class="pane-hd" style="background:#f4f8f5">
                <div class="pane-hd-title">${icon('plus')}<span><b>新建专栏课程</b></span></div>
                <div class="row gap6">
                  <button class="btn-adm outline sm" onclick="ADM.setMode('course','detail')">取消</button>
                  <button class="btn-adm primary sm" onclick="ADM.act.saveNewCourseInline()">确认创建专栏</button>
                </div>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="form-grid cols-3">
                  <div class="field col-span-2">
                    <span class="field-label">专栏课程标题 *</span>
                    <input class="field-input" id="inp_nc_title" placeholder="如：家庭常见病艾灸自愈百问百答">
                  </div>
                  <div class="field">
                    <span class="field-label">主讲导师 *</span>
                    <input class="field-input" id="inp_nc_author" value="明大妈">
                  </div>
                  <div class="field">
                    <span class="field-label">专栏售价 (¥)</span>
                    <input type="number" class="field-input" id="inp_nc_price" value="99">
                  </div>
                  <div class="field col-span-2">
                    <span class="field-label">课程副标题导语</span>
                    <input class="field-input" id="inp_nc_sub" value="零基础入门，掌握 20 个救急穴位与艾灸实操法">
                  </div>
                </div>
              </div>
            ` : curCourse ? `
              <div class="pane-hd">
                <div class="pane-hd-title">${icon('settings')}<span>编辑专栏课程 · <b>${esc(curCourse.title)}</b></span></div>
                <button class="btn-adm danger sm" onclick="ADM.act.deleteCourse('${curCourse.id}')">删除专栏</button>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="form-grid cols-3">
                  <div class="field col-span-2">
                    <span class="field-label">课程完整标题</span>
                    <input class="field-input" value="${esc(curCourse.title)}" onchange="curCourse.title=this.value;ADM.save('已修改课程标题');ADM.render()">
                  </div>
                  <div class="field">
                    <span class="field-label">主讲导师</span>
                    <input class="field-input" value="${esc(curCourse.teacher)}" onchange="curCourse.teacher=this.value;ADM.save('已修改讲师');ADM.render()">
                  </div>
                  <div class="field">
                    <span class="field-label">专栏售价 (¥)</span>
                    <input type="number" class="field-input" value="${curCourse.price}" onchange="curCourse.price=+this.value;ADM.save('已修改课程价格');ADM.render()">
                  </div>
                  <div class="field col-span-2">
                    <span class="field-label">专栏副标题导语</span>
                    <input class="field-input" value="${esc(curCourse.intro || '')}" onchange="curCourse.intro=this.value;ADM.save('已修改课程副标题')">
                  </div>
                </div>

                <!-- 章节课时大纲增删改 -->
                <div class="mini-box">
                  <div class="row between" style="margin-bottom:6px">
                    <span class="field-label">专栏课时章节大纲 (${(curCourse.lessons || []).length} 讲)</span>
                    <button class="btn-adm outline sm" onclick="ADM.act.addCourseSection('${curCourse.id}')">+ 新增课时</button>
                  </div>
                  <div class="item-deck">
                    ${(curCourse.lessons || []).map((sec, si) => `
                      <div class="mini-box row between gap8 tiny">
                        <div class="row gap6 grow">
                          <b>第 ${si + 1} 讲</b>
                          <input class="field-input grow" style="height:25px" value="${esc(sec.t)}" onchange="curCourse.lessons[${si}].t=this.value;ADM.save('已修改课时标题')">
                          <input class="field-input" style="width:70px;height:25px" value="${esc(sec.m || 8)}" onchange="curCourse.lessons[${si}].dur=this.value;ADM.save('已修改时长')">
                          <button class="chip-btn ${sec.trial ? 'gold on' : ''}" onclick="curCourse.lessons[${si}].free=!curCourse.lessons[${si}].free;ADM.save('已切换试听状态');ADM.render()">${sec.trial ? '免费试听' : '付费解锁'}</button>
                        </div>
                        <button class="icon-btn" onclick="ADM.act.deleteCourseSection('${curCourse.id}', ${si})">✕</button>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            ` : '<div class="pane-bd center muted">暂无专栏</div>'}
          </section>
        </div>
      `;
    }

    // 1.3 养生图文与节气
    if (sub === 'articles') {
      const kw = (ADM.filter.artKw || '').trim();
      const list = D.articles.filter((a) => !kw || (a.title + a.tag).includes(kw));
      const pg = ADM.paginate(list, 'cnt_articles', 6);
      const curId = ADM.sel.article && D.articles.some((a) => a.id === ADM.sel.article) ? ADM.sel.article : (pg.items[0]?.id || D.articles[0]?.id);
      ADM.sel.article = curId;
      const curArt = D.articles.find((a) => a.id === curId) || D.articles[0];
      const isCreateArticle = ADM.mode.article === 'create';

      return `${topBar}
        <div class="bento-grid" style="grid-template-columns: 310px minmax(0, 1fr);">
          <section class="pane">
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('book')}<span>图文库 (${list.length})</span></div>
              <input class="field-input" style="height:26px;width:100px" placeholder="搜标题/节气…" value="${esc(kw)}" oninput="ADM.filter.artKw=this.value;ADM.page.cnt_articles=1;ADM.render()">
            </div>
            <div class="pane-bd dense">
              <div class="item-deck">
                ${pg.items.map((a) => `
                  <div class="deck-row ${(!isCreateArticle && a.id === curArt?.id) ? 'on' : ''}" onclick="ADM.mode.article='detail';ADM.sel.article='${a.id}';ADM.render()">
                    <div class="deck-thumb">${safeArt(a, 'season', 'mist')}</div>
                    <div class="deck-main">
                      <div class="deck-title">${esc(a.title)}</div>
                      <div class="deck-meta">
                        <span class="adm-tag green">${esc(a.tag)}</span>
                        <span>阅 ${XA.wan(a.reads || 890)}</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="pane-ft">${pg.pagerHtml}</div>
          </section>

          <section class="pane">
            ${isCreateArticle ? `
              <div class="pane-hd" style="background:#f4f8f5">
                <div class="pane-hd-title">${icon('plus')}<span><b>新建养生图文</b></span></div>
                <div class="row gap6">
                  <button class="btn-adm outline sm" onclick="ADM.setMode('article','detail')">取消</button>
                  <button class="btn-adm primary sm" onclick="ADM.act.saveNewArticleInline()">确认发布图文</button>
                </div>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="form-grid cols-3">
                  <div class="field col-span-2">
                    <span class="field-label">文章标题 *</span>
                    <input class="field-input" id="inp_na_title" placeholder="如：冬至阳生春又来：一阳初动如何借艾温养">
                  </div>
                  <div class="field">
                    <span class="field-label">节气 / 分类标签</span>
                    <input class="field-input" id="inp_na_tag" value="冬至">
                  </div>
                  <div class="field col-span-3">
                    <span class="field-label">文章摘要</span>
                    <input class="field-input" id="inp_na_sub" value="冬至是一年中阴极阳生之时，借艾草纯阳之气固护根本。">
                  </div>
                  <div class="field col-span-3">
                    <span class="field-label">正文段落（每行一段）</span>
                    <textarea class="field-textarea" id="inp_na_body" style="height:70px">冬至，太阳行至最南，白昼最短。\n古人云：气始于冬至。\n此时宜艾灸关元、神阙二穴，藏精护阳。</textarea>
                  </div>
                </div>
              </div>
            ` : curArt ? `
              <div class="pane-hd">
                <div class="pane-hd-title">${icon('settings')}<span>编辑养生图文 · <b>${esc(curArt.title)}</b></span></div>
                <button class="btn-adm danger sm" onclick="ADM.act.deleteArticle('${curArt.id}')">删除图文</button>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="form-grid cols-3">
                  <div class="field col-span-2">
                    <span class="field-label">文章标题</span>
                    <input class="field-input" value="${esc(curArt.title)}" onchange="curArt.title=this.value;ADM.save('已修改图文标题');ADM.render()">
                  </div>
                  <div class="field">
                    <span class="field-label">节气 / 分类标签</span>
                    <input class="field-input" value="${esc(curArt.tag)}" onchange="curArt.tag=this.value;ADM.save('已修改标签');ADM.render()">
                  </div>
                  <div class="field col-span-3">
                    <span class="field-label">文章导读摘要</span>
                    <input class="field-input" value="${esc(curArt.sub || '')}" onchange="curArt.sub=this.value;ADM.save('已修改摘要')">
                  </div>
                  <div class="field col-span-3">
                    <span class="field-label">正文段落（每行一段）</span>
                    <textarea class="field-textarea" style="height:90px" onchange="curArt.body=this.value.split('\\n').map(s=>s.trim()).filter(Boolean);ADM.save('已更新文章正文')">${esc((curArt.body || []).join('\n'))}</textarea>
                  </div>
                </div>

                <!-- 推荐关联商品 -->
                <div class="mini-box">
                  <span class="field-label">文末推荐商品（点击切换）</span>
                  <div class="chip-group" style="margin-top:6px">
                    ${D.products.map((p) => {
                      const on = (curArt.recommendProducts || []).includes(p.id);
                      return `<button class="chip-btn ${on ? 'on' : ''}" onclick="ADM.act.toggleArticleProd('${curArt.id}','${p.id}')">🛍️ ${esc(p.short)}</button>`;
                    }).join('')}
                  </div>
                </div>
              </div>
            ` : '<div class="pane-bd center muted">暂无图文</div>'}
          </section>
        </div>
      `;
    }

    // 1.4 社区达人笔记与话题（右栏侧边面板维护热门话题，零弹层）
    if (sub === 'notes') {
      const kw = (ADM.filter.noteKw || '').trim();
      const list = D.notes.filter((n) => !kw || (n.title + n.author + n.tag).includes(kw));
      const pg = ADM.paginate(list, 'cnt_notes', 6);
      const curId = ADM.sel.note && D.notes.some((n) => n.id === ADM.sel.note) ? ADM.sel.note : (pg.items[0]?.id || D.notes[0]?.id);
      ADM.sel.note = curId;
      const curNote = D.notes.find((n) => n.id === curId) || D.notes[0];
      const isCreateNote = ADM.mode.note === 'create';

      return `${topBar}
        <div class="bento-grid" style="grid-template-columns: 290px minmax(0, 1fr) 310px;">
          <section class="pane">
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('chat')}<span>种草笔记 (${list.length})</span></div>
              <input class="field-input" style="height:26px;width:100px" placeholder="搜标题/作者…" value="${esc(kw)}" oninput="ADM.filter.noteKw=this.value;ADM.page.cnt_notes=1;ADM.render()">
            </div>
            <div class="pane-bd dense">
              <div class="item-deck">
                ${pg.items.map((n) => `
                  <div class="deck-row ${(!isCreateNote && n.id === curNote?.id) ? 'on' : ''}" onclick="ADM.mode.note='detail';ADM.sel.note='${n.id}';ADM.render()">
                    <div class="deck-thumb">${safeArt(n, 'leaf', 'sand')}</div>
                    <div class="deck-main">
                      <div class="deck-title">${esc(n.title)}</div>
                      <div class="deck-meta">
                        <span>${esc(n.author)}</span>
                        <span>赞 ${n.likes}</span>
                        ${n.hidden ? '<span class="adm-tag red">已屏蔽</span>' : '<span class="adm-tag green">正常</span>'}
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="pane-ft">${pg.pagerHtml}</div>
          </section>

          <!-- 中栏：笔记编辑或发布 -->
          <section class="pane">
            ${isCreateNote ? `
              <div class="pane-hd" style="background:#f4f8f5">
                <div class="pane-hd-title">${icon('plus')}<span><b>发布官方精选达人种草笔记</b></span></div>
                <div class="row gap6">
                  <button class="btn-adm outline sm" onclick="ADM.setMode('note','detail')">取消</button>
                  <button class="btn-adm primary sm" onclick="ADM.act.saveNewNoteInline()">确认发布笔记</button>
                </div>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="form-grid cols-3">
                  <div class="field col-span-2">
                    <span class="field-label">笔记标题 *</span>
                    <input class="field-input" id="inp_nn_title" placeholder="如：坚持艾灸足三里一个月，脾胃真的变好了！">
                  </div>
                  <div class="field">
                    <span class="field-label">发布达人 *</span>
                    <input class="field-input" id="inp_nn_author" value="艾灸女孩小敏">
                  </div>
                  <div class="field col-span-2">
                    <span class="field-label">话题标签</span>
                    <input class="field-input" id="inp_nn_tag" value="#艾灸日常">
                  </div>
                  <div class="field col-span-3">
                    <span class="field-label">笔记正文</span>
                    <textarea class="field-textarea" id="inp_nn_content" style="height:90px">每天晚上睡前点上一支，艾灸足三里20分钟，胃口好多了，手脚也不再冰凉了！</textarea>
                  </div>
                </div>
              </div>
            ` : curNote ? `
              <div class="pane-hd">
                <div class="pane-hd-title">${icon('settings')}<span>编辑社区笔记 · <b>${esc(curNote.title)}</b></span></div>
                <button class="btn-adm danger sm" onclick="ADM.act.deleteNote('${curNote.id}')">删除笔记</button>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="form-grid cols-3">
                  <div class="field col-span-2">
                    <span class="field-label">笔记标题</span>
                    <input class="field-input" value="${esc(curNote.title)}" onchange="curNote.title=this.value;ADM.save('已修改笔记标题');ADM.render()">
                  </div>
                  <div class="field">
                    <span class="field-label">发布达人</span>
                    <input class="field-input" value="${esc(curNote.author)}" onchange="curNote.author=this.value;ADM.save('已修改作者')">
                  </div>
                  <div class="field">
                    <span class="field-label">话题标签</span>
                    <input class="field-input" value="${esc(curNote.tag)}" onchange="curNote.tag=this.value;ADM.save('已修改话题')">
                  </div>
                  <div class="field">
                    <span class="field-label">点赞数</span>
                    <input type="number" class="field-input" value="${curNote.likes}" onchange="curNote.likes=+this.value;ADM.save('已修改点赞')">
                  </div>
                  <div class="field">
                    <span class="field-label">审核状态</span>
                    <button class="chip-btn ${curNote.hidden ? 'red on' : 'green on'}" onclick="curNote.hidden=!curNote.hidden;ADM.save('已切换屏蔽状态');ADM.render()">${curNote.hidden ? '已下架屏蔽' : '已发布正常展示'}</button>
                  </div>
                  <div class="field col-span-3">
                    <span class="field-label">笔记正文</span>
                    <textarea class="field-textarea" style="height:90px" onchange="curNote.content=this.value;ADM.save('已更新笔记正文')">${esc((curNote.body || []).join('\n'))}</textarea>
                  </div>
                </div>
              </div>
            ` : '<div class="pane-bd center muted">请选择笔记</div>'}
          </section>

          <!-- 右栏：侧边面板（热门话题库与新增） -->
          <section class="pane">
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('ticket')}<span>热门话题库 (${(D.topics || []).length})</span></div>
            </div>
            <div class="pane-subbar">
              <input class="field-input" id="in_new_topic" style="height:26px;width:100%" placeholder="+ 输入新话题回车…" onkeydown="if(event.key==='Enter'&&this.value.trim()){D.topics.push({name:this.value.trim()});this.value='';ADM.save('已新增话题');ADM.render()}">
            </div>
            <div class="pane-bd dense">
              <div class="item-deck">
                ${(D.topics || []).map((tp, tpi) => `
                  <div class="mini-box row between gap6 tiny">
                    <b>#${esc(tp.name || tp)}#</b>
                    <button class="icon-btn" onclick="XA.data.topics.splice(${tpi},1);ADM.save('已删除话题');ADM.render()">✕</button>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        </div>
      `;
    }

    // 1.5 签约创作者
    const crList = D.creators;
    const curCrId = ADM.sel.creator && crList.some((c) => c.name === ADM.sel.creator) ? ADM.sel.creator : crList[0]?.name;
    ADM.sel.creator = curCrId;
    const curCr = crList.find((c) => c.name === curCrId) || crList[0];
    const isCreateCreator = ADM.mode.creator === 'create';

    return `${topBar}
      <div class="bento-grid" style="grid-template-columns: 310px minmax(0, 1fr);">
        <section class="pane">
          <div class="pane-hd">
            <div class="pane-hd-title">${icon('crown')}<span>签约博主与达人 (${crList.length})</span></div>
          </div>
          <div class="pane-bd dense">
            <div class="item-deck">
              ${crList.map((c) => `
                <div class="deck-row ${(!isCreateCreator && c.name === curCr?.name) ? 'on' : ''}" onclick="ADM.mode.creator='detail';ADM.sel.creator='${c.name}';ADM.render()">
                  <div class="deck-thumb"><span class="logo-dot sm" style="width:34px;height:34px">${c.name.slice(0, 1)}</span></div>
                  <div class="deck-main">
                    <div class="deck-title">${esc(c.name)}</div>
                    <div class="deck-meta">
                      <span class="adm-tag green">${esc(c.level || '签约达人')}</span>
                      <span>${esc(c.title)}</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </section>

        <section class="pane">
          ${isCreateCreator ? `
            <div class="pane-hd" style="background:#f4f8f5">
              <div class="pane-hd-title">${icon('plus')}<span><b>签约新创作者达人</b></span></div>
              <div class="row gap6">
                <button class="btn-adm outline sm" onclick="ADM.setMode('creator','detail')">取消</button>
                <button class="btn-adm primary sm" onclick="ADM.act.saveNewCreatorInline()">确认签约建档</button>
              </div>
            </div>
            <div class="pane-bd" style="justify-content:space-between">
              <div class="form-grid cols-3">
                <div class="field">
                  <span class="field-label">博主昵称 *</span>
                  <input class="field-input" id="inp_ncr_name" placeholder="如：草木有情">
                </div>
                <div class="field">
                  <span class="field-label">认证头衔 *</span>
                  <input class="field-input" id="inp_ncr_title" value="执业中医师 / 养生博主">
                </div>
                <div class="field">
                  <span class="field-label">签约等级</span>
                  <select class="field-select" id="inp_ncr_level"><option value="核心领衔博主">核心领衔博主</option><option value="专业理疗达人">专业理疗达人</option><option value="种草生活家">种草生活家</option></select>
                </div>
                <div class="field">
                  <span class="field-label">粉丝总量</span>
                  <input type="number" class="field-input" id="inp_ncr_fans" value="35000">
                </div>
                <div class="field">
                  <span class="field-label">带货分销佣金比率</span>
                  <input type="number" step="0.01" class="field-input" id="inp_ncr_rate" value="0.15">
                </div>
              </div>
            </div>
          ` : curCr ? `
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('settings')}<span>编辑创作者档案 · <b>${esc(curCr.name)}</b></span></div>
              <button class="btn-adm danger sm" onclick="ADM.act.deleteCreator('${curCr.name}')">解约删除</button>
            </div>
            <div class="pane-bd" style="justify-content:space-between">
              <div class="form-grid cols-3">
                <div class="field">
                  <span class="field-label">博主昵称</span>
                  <input class="field-input" value="${esc(curCr.name)}" onchange="curCr.name=this.value;ADM.save('已修改博主昵称');ADM.render()">
                </div>
                <div class="field">
                  <span class="field-label">认证头衔</span>
                  <input class="field-input" value="${esc(curCr.badge)}" onchange="curCr.badge=this.value;ADM.save('已修改头衔')">
                </div>
                <div class="field">
                  <span class="field-label">签约等级</span>
                  <select class="field-select" onchange="curCr.level=this.value;ADM.save('已修改等级');ADM.render()">
                    <option value="核心领衔博主" ${curCr.level === '核心领衔博主' ? 'selected' : ''}>核心领衔博主</option>
                    <option value="专业理疗达人" ${curCr.level === '专业理疗达人' ? 'selected' : ''}>专业理疗达人</option>
                    <option value="种草生活家" ${curCr.level === '种草生活家' ? 'selected' : ''}>种草生活家</option>
                  </select>
                </div>
                <div class="field">
                  <span class="field-label">粉丝总量</span>
                  <input type="number" class="field-input" value="${curCr.fans}" onchange="curCr.fans=+this.value;ADM.save('已更新粉丝')">
                </div>
                <div class="field">
                  <span class="field-label">带货分销佣金比率</span>
                  <input type="number" step="0.01" class="field-input" value="${curCr.commissionRate || 0.15}" onchange="curCr.commissionRate=+this.value;ADM.save('已修改佣金率')">
                </div>
                <div class="field">
                  <span class="field-label">累计带货总额 (¥)</span>
                  <input type="number" class="field-input" value="${curCr.totalSales || 36800}" onchange="curCr.totalSales=+this.value;ADM.save('已更新销售额')">
                </div>
              </div>
            </div>
          ` : '<div class="pane-bd center muted">请选择创作者</div>'}
        </section>
      </div>
    `;
  };

  /* ============================================================================
   * 2. 门店管理系统 (store)
   * ============================================================================ */
  ADM.views.store = () => {
    const sub = ADM.sub.storeSub || 'stores'; // stores | schedule | services | verify | activities
    const topBar = `
      <div class="subnav-bar">
        <div class="seg-pills">
          <button class="seg-pill ${sub === 'stores' ? 'on' : ''}" onclick="ADM.setSub('storeSub','stores')">认证门店网络 <em>${D.stores.length}</em></button>
          <button class="seg-pill ${sub === 'schedule' ? 'on' : ''}" onclick="ADM.setSub('storeSub','schedule')">时段产能排班矩阵</button>
          <button class="seg-pill ${sub === 'services' ? 'on' : ''}" onclick="ADM.setSub('storeSub','services')">到店调养项目 <em>${D.services.length}</em></button>
          <button class="seg-pill ${sub === 'verify' ? 'on' : ''}" onclick="ADM.setSub('storeSub','verify')">前台核销与到店预约 <em>${S().appts.length}</em></button>
          <button class="seg-pill ${sub === 'activities' ? 'on' : ''}" onclick="ADM.setSub('storeSub','activities')">线下雅集沙龙 <em>${D.activities.length}</em></button>
        </div>
        <div class="row gap8">
          ${sub === 'stores' ? (ADM.mode.store === 'create' ? `<button class="btn-adm outline sm" onclick="ADM.setMode('store','detail')">返回门店档案</button>` : `<button class="btn-adm primary sm" onclick="ADM.setMode('store','create')">+ 新增门店</button>`) :
            sub === 'services' ? (ADM.mode.service === 'create' ? `<button class="btn-adm outline sm" onclick="ADM.setMode('service','detail')">返回项目列表</button>` : `<button class="btn-adm primary sm" onclick="ADM.setMode('service','create')">+ 新增项目</button>`) :
            sub === 'activities' ? (ADM.mode.activity === 'create' ? `<button class="btn-adm outline sm" onclick="ADM.setMode('activity','detail')">返回沙龙列表</button>` : `<button class="btn-adm primary sm" onclick="ADM.setMode('activity','create')">+ 发布新沙龙</button>`) : ''}
          <button class="btn-adm tonal sm" onclick="ADM.openPreview('stores')">在小程序预览门店</button>
        </div>
      </div>
    `;

    if (sub === "staff") return ADM.staffView();

    // 2.1 门店网络主档（中栏编辑/就地新增 / 右栏侧边面板信息，零弹层）
    if (sub === 'stores') {
      const city = ADM.filter.storeCity || '全部';
      const kw = (ADM.filter.storeKw || '').trim();
      const cities = ['全部', '杭州', '上海', '南京', '南阳'];
      const list = D.stores.filter((st) => (city === '全部' || st.city === city) && (!kw || (st.name + st.address + (st.area || '')).includes(kw)));
      const pg = ADM.paginate(list, 'store_list', 6);
      const curId = ADM.sel.store && D.stores.some((s) => s.id === ADM.sel.store) ? ADM.sel.store : (pg.items[0]?.id || D.stores[0]?.id);
      ADM.sel.store = curId;
      const st = D.storeOf(curId) || D.stores[0];
      const isCreateStore = ADM.mode.store === 'create';

      return `${topBar}
        <div class="bento-grid" style="grid-template-columns: 290px minmax(0, 1fr) 320px;">
          <section class="pane">
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('store')}<span>门店主档 (${list.length})</span></div>
              <input class="field-input" style="height:26px;width:100px" placeholder="搜店名/商圈…" value="${esc(kw)}" oninput="ADM.filter.storeKw=this.value;ADM.page.store_list=1;ADM.render()">
            </div>
            <div class="pane-subbar">
              <div class="chip-group">
                ${cities.map((c) => `<button class="chip-btn ${city === c ? 'on' : ''}" onclick="ADM.filter.storeCity='${c}';ADM.page.store_list=1;ADM.render()">${c}</button>`).join('')}
              </div>
            </div>
            <div class="pane-bd dense">
              <div class="item-deck">
                ${pg.items.map((it) => `
                  <div class="deck-row ${(!isCreateStore && it.id === st.id) ? 'on' : ''}" onclick="ADM.mode.store='detail';ADM.sel.store='${it.id}';ADM.render()">
                    <div class="deck-thumb">${safeArt(it, 'room', 'sage')}</div>
                    <div class="deck-main">
                      <div class="deck-title">${esc(it.name)}</div>
                      <div class="deck-meta">
                        <span class="adm-tag green">${esc(it.city)}</span>
                        <span>${esc(it.area || '')}</span>
                        <span>⭐ ${it.rating}</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="pane-ft">${pg.pagerHtml}</div>
          </section>

          <!-- 中栏：编辑或新增门店 -->
          <section class="pane">
            ${isCreateStore ? `
              <div class="pane-hd" style="background:#f4f8f5">
                <div class="pane-hd-title">${icon('plus')}<span><b>录入新认证门店网络档案</b></span></div>
                <div class="row gap6">
                  <button class="btn-adm outline sm" onclick="ADM.setMode('store','detail')">取消</button>
                  <button class="btn-adm primary sm" onclick="ADM.act.saveNewStoreInline()">确认保存门店</button>
                </div>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="form-grid cols-3">
                  <div class="field col-span-2">
                    <span class="field-label">门店名称 *</span>
                    <input class="field-input" id="inp_nst_name" placeholder="如：晓艾本草生活馆 (西湖旗舰店)">
                  </div>
                  <div class="field">
                    <span class="field-label">所在城市</span>
                    <input class="field-input" id="inp_nst_city" value="杭州">
                  </div>
                  <div class="field">
                    <span class="field-label">行政区 / 商圈</span>
                    <input class="field-input" id="inp_nst_area" value="西湖区黄龙商圈">
                  </div>
                  <div class="field col-span-2">
                    <span class="field-label">详细导航地址 *</span>
                    <input class="field-input" id="inp_nst_addr" placeholder="如：杭州市西湖区曙光路 120 号">
                  </div>
                  <div class="field">
                    <span class="field-label">联系电话</span>
                    <input class="field-input" id="inp_nst_phone" value="0571-88201990">
                  </div>
                </div>
              </div>
            ` : st ? `
              <div class="pane-hd">
                <div class="pane-hd-title">${icon('settings')}<span>编辑门店档案 · <b>${esc(st.name)}</b></span></div>
                <button class="btn-adm danger sm" onclick="ADM.act.deleteStore('${st.id}')">删除门店</button>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="form-grid cols-3">
                  <div class="field">
                    <span class="field-label">门店名称</span>
                    <input class="field-input" value="${esc(st.name)}" onchange="st.name=this.value;ADM.save('已修改店名');ADM.render()">
                  </div>
                  <div class="field">
                    <span class="field-label">所在城市</span>
                    <input class="field-input" value="${esc(st.city)}" onchange="st.city=this.value;ADM.save('已修改城市');ADM.render()">
                  </div>
                  <div class="field">
                    <span class="field-label">行政区 / 商圈</span>
                    <input class="field-input" value="${esc(st.area || '')}" onchange="st.area=this.value;ADM.save('已修改商圈')">
                  </div>
                  <div class="field col-span-2">
                    <span class="field-label">详细导航地址</span>
                    <input class="field-input" value="${esc(st.address)}" onchange="st.address=this.value;ADM.save('已修改地址')">
                  </div>
                  <div class="field">
                    <span class="field-label">联系电话</span>
                    <input class="field-input" value="${esc(st.phone || '0571-88201992')}" onchange="st.phone=this.value;ADM.save('已修改电话')">
                  </div>
                  <div class="field">
                    <span class="field-label">营业时间</span>
                    <input class="field-input" value="${esc(st.hours || '10:00 - 21:30')}" onchange="st.hours=this.value;ADM.save('已修改营业时间')">
                  </div>
                  <div class="field">
                    <span class="field-label">官方认证状态</span>
                    <button class="chip-btn ${st.linked ? 'green on' : ''}" onclick="st.linked=!st.linked;ADM.save('已切换认证状态');ADM.render()">${st.linked ? '✓ 官方认证直营/加盟' : '未认证门店'}</button>
                  </div>
                </div>

                <!-- 特色服务标签多选 -->
                <div class="mini-box">
                  <span class="field-label">环境与特色设施标签（多选）</span>
                  <div class="chip-group" style="margin-top:6px">
                    ${['独立灸室', '茶歇软饮', '无烟净化', '免费停车', '中医师坐堂', '古法手作', '私密泡池'].map((tg) => {
                      const on = (st.tags || []).includes(tg);
                      return `<button class="chip-btn ${on ? 'on' : ''}" onclick="ADM.act.toggleStoreTag('${st.id}','${tg}')">${tg}</button>`;
                    }).join('')}
                  </div>
                </div>
              </div>
            ` : '<div class="pane-bd center muted">暂无门店</div>'}
          </section>

          <!-- 右栏：侧边面板（门店概览与快捷联动） -->
          <section class="pane">
            <div class="pane-hd"><div class="pane-hd-title">${icon('store')}<span>门店履约看板</span></div></div>
            <div class="pane-bd" style="justify-content:space-between">
              <div class="mini-box col gap4">
                <div class="row between"><span class="tiny faint">综合评分</span><b class="c-gold">⭐ ${st?.rating || 4.9} 分</b></div>
                <div class="row between"><span class="tiny faint">累计好评条数</span><b>${st?.reviews || 120} 条</b></div>
                <div class="row between"><span class="tiny faint">支持到店项目</span><b>${(st?.services || []).length} 项</b></div>
              </div>
              <div class="mini-box col gap4">
                <span class="tiny faint">运营快捷跳转：</span>
                <button class="btn-adm tonal sm" onclick="ADM.sel.schedStore='${st?.id}';ADM.setSub('storeSub','schedule')">查看该门店时段排班 ↗</button>
              </div>
            </div>
          </section>
        </div>
      `;
    }

    // 2.2 时段排班矩阵
    if (sub === 'schedule') {
      const curStoreId = ADM.sel.schedStore || D.stores[0].id;
      ADM.sel.schedStore = curStoreId;
      const st = D.storeOf(curStoreId);
      const dateKey = ADM.filter.schedDate || XA.d.key(new Date());

      return `${topBar}
        <div class="bento-grid" style="grid-template-columns: 260px minmax(0, 1fr);">
          <section class="pane">
            <div class="pane-hd"><div class="pane-hd-title">${icon('store')}<span>选择调养门店</span></div></div>
            <div class="pane-bd dense">
              <div class="item-deck">
                ${D.stores.map((s) => `
                  <div class="deck-row ${s.id === curStoreId ? 'on' : ''}" onclick="ADM.sel.schedStore='${s.id}';ADM.render()">
                    <div class="deck-title">${esc(s.name)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>

          <section class="pane">
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('calendar')}<span>时段床位排班矩阵 · <b>${esc(st.name)}</b></span></div>
              <div class="row gap6">
                <span class="tiny faint">日期：</span>
                <input type="date" class="field-input" style="height:26px;width:130px" value="${dateKey}" onchange="ADM.filter.schedDate=this.value;ADM.render()">
              </div>
            </div>
            <div class="pane-bd">
              <div class="slot-matrix" style="grid-template-columns:repeat(3, 1fr)">
                ${D.slots(curStoreId,dateKey).map(slot => {
                  const t = slot.time;
                  const state = configuredSlot(curStoreId,dateKey,slot);
                  const stateLabel = state === 'full' ? '设为满约' : state === 'vip' ? '会员优先' : '开放';
                  const availability = slot.past ? '已截止' : slot.off ? '无技师排班' : slot.full ? '无可约名额' : '可预约';
                  return `
                    <div class="slot-cell ${state}" onclick="ADM.act.cycleSlot('${curStoreId}','${dateKey}','${t}')">
                      <b>${t}</b>
                      <span>${stateLabel} · ${availability}</span>
                    </div>`;
                }).join('')}
              </div>
              <div class="mini-box row between" style="margin-top:auto">
                <span class="tiny faint">状态循环：点击时段卡片在「开放 → 会员优先 → 满约」间切换</span>
                <button class="btn-adm tonal sm" onclick="ADM.act.resetSlots('${curStoreId}','${dateKey}')">恢复本店当天默认</button>
              </div>
            </div>
          </section>
        </div>
      `;
    }

    // 2.3 到店调养项目
    if (sub === 'services') {
      const kw = (ADM.filter.svcKw || '').trim();
      const list = D.services.filter((s) => !kw || (s.name + s.desc).includes(kw));
      const pg = ADM.paginate(list, 'store_services', 6);
      const curId = ADM.sel.service && D.services.some((s) => s.id === ADM.sel.service) ? ADM.sel.service : (pg.items[0]?.id || D.services[0]?.id);
      ADM.sel.service = curId;
      const sv = D.service(curId) || D.services[0];
      const isCreateService = ADM.mode.service === 'create';

      return `${topBar}
        <div class="bento-grid" style="grid-template-columns: 310px minmax(0, 1fr);">
          <section class="pane">
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('bath')}<span>调养项目库 (${list.length})</span></div>
              <input class="field-input" style="height:26px;width:100px" placeholder="搜项目名称…" value="${esc(kw)}" oninput="ADM.filter.svcKw=this.value;ADM.page.store_services=1;ADM.render()">
            </div>
            <div class="pane-bd dense">
              <div class="item-deck">
                ${pg.items.map((s) => `
                  <div class="deck-row ${(!isCreateService && s.id === sv?.id) ? 'on' : ''}" onclick="ADM.mode.service='detail';ADM.sel.service='${s.id}';ADM.render()">
                    <div class="deck-thumb">${safeArt(s, 'bed', 'clay')}</div>
                    <div class="deck-main">
                      <div class="deck-title">${esc(s.name)}</div>
                      <div class="deck-meta">
                        <span class="c-price bold">¥${s.price}</span>
                        <span>${s.dur}分钟</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="pane-ft">${pg.pagerHtml}</div>
          </section>

          <section class="pane">
            ${isCreateService ? `
              <div class="pane-hd" style="background:#f4f8f5">
                <div class="pane-hd-title">${icon('plus')}<span><b>新增到店调养服务项目</b></span></div>
                <div class="row gap6">
                  <button class="btn-adm outline sm" onclick="ADM.setMode('service','detail')">取消</button>
                  <button class="btn-adm primary sm" onclick="ADM.act.saveNewServiceInline()">确认保存项目</button>
                </div>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="form-grid cols-3">
                  <div class="field col-span-2">
                    <span class="field-label">服务项目名称 *</span>
                    <input class="field-input" id="inp_nsv_name" placeholder="如：督脉透灸温阳理疗 (60分钟)">
                  </div>
                  <div class="field">
                    <span class="field-label">服务时长 (分钟)</span>
                    <input type="number" class="field-input" id="inp_nsv_dur" value="60">
                  </div>
                  <div class="field">
                    <span class="field-label">单次单价 (¥)</span>
                    <input type="number" class="field-input" id="inp_nsv_price" value="268">
                  </div>
                  <div class="field col-span-2">
                    <span class="field-label">功效特色简述</span>
                    <input class="field-input" id="inp_nsv_desc" value="温经通络，强健后背阳气，驱寒祛湿">
                  </div>
                </div>
              </div>
            ` : sv ? `
              <div class="pane-hd">
                <div class="pane-hd-title">${icon('settings')}<span>编辑调养项目 · <b>${esc(sv.name)}</b></span></div>
                <button class="btn-adm danger sm" onclick="ADM.act.deleteService('${sv.id}')">删除项目</button>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="form-grid cols-3">
                  <div class="field col-span-2">
                    <span class="field-label">项目名称</span>
                    <input class="field-input" value="${esc(sv.name)}" onchange="sv.name=this.value;ADM.save('已修改项目名');ADM.render()">
                  </div>
                  <div class="field">
                    <span class="field-label">服务时长 (分钟)</span>
                    <input type="number" class="field-input" value="${sv.dur}" onchange="sv.dur=+this.value;ADM.save('已修改时长')">
                  </div>
                  <div class="field">
                    <span class="field-label">单次标价 (¥)</span>
                    <input type="number" class="field-input" value="${sv.price}" onchange="sv.price=+this.value;ADM.save('已修改单价');ADM.render()">
                  </div>
                  <div class="field col-span-2">
                    <span class="field-label">功效特色</span>
                    <input class="field-input" value="${esc(sv.desc || '')}" onchange="sv.desc=this.value;ADM.save('已修改特色')">
                  </div>
                </div>

                <!-- 体质调养标签 -->
                <div class="mini-box">
                  <span class="field-label">适宜体质调养标签（点击切换）</span>
                  <div class="chip-group" style="margin-top:6px">
                    ${['平和质', '气虚质', '阳虚质', '阴虚质', '痰湿质', '湿热质', '血瘀质'].map((t) => {
                      const on = (sv.fit || []).includes(t);
                      return `<button class="chip-btn ${on ? 'on' : ''}" onclick="ADM.act.toggleServiceFit('${sv.id}','${t}')">${t}</button>`;
                    }).join('')}
                  </div>
                </div>
              </div>
            ` : '<div class="pane-bd center muted">暂无项目</div>'}
          </section>
        </div>
      `;
    }

    // 2.4 前台核销与到店预约（右栏侧边面板直接录入预约挂号，零弹层）
    if (sub === 'verify') {
      const apptList = S().appts;
      const bookable = D.stores.filter(s => s.linked && !s.soon && s.services?.length);
      const pg = ADM.paginate(apptList, 'store_appts', 6);

      return `${topBar}
        <div class="bento-grid" style="grid-template-columns: minmax(0, 1.35fr) 360px;">
          <!-- 预约列表 -->
          <section class="pane">
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('scan')}<span>前台到店预约台 (${apptList.length})</span></div>
              <div class="row gap6">
                <input class="field-input" id="v_code_in" style="height:26px;width:150px" placeholder="输入6位核销码…" onkeydown="if(event.key==='Enter')ADM.act.verifyByCode('v_code_in')">
                <button class="btn-adm primary sm" onclick="ADM.act.verifyByCode('v_code_in')">立即核销</button>
              </div>
            </div>
            <div class="pane-bd dense">
              <div class="item-deck">
                ${pg.items.map((a) => {
                  const st = D.storeOf(a.storeId);
                  const sv = D.service(a.serviceId);
                  return `
                    <div class="mini-box row between gap12">
                      <div class="grow ell">
                        <div class="row gap8">
                          <span class="adm-tag ${a.status === 'booked' ? 'green' : a.status === 'done' ? 'blue' : 'gray'}">${a.status === 'booked' ? '待到店' : a.status === 'done' ? '已核销' : a.status === 'cancelled' ? '已取消' : '爽约'}</span>
                          <b>码：${a.code}</b>
                          <span>${esc(a.date)} ${esc(a.time)}</span><span>${esc(a.staffName || D.staffOf(a.staffId)?.name)}</span>
                          <span>${esc(st?.name)}</span>
                          <span class="bold">${esc(sv?.name)}</span>
                          <span>${esc(a.customer?.name || '会员')} (${esc(a.customer?.phone || '')})</span>
                        </div>
                      </div>
                      <div class="row gap4">
                        ${a.status === 'booked' ? `
                          <button class="btn-adm primary sm" onclick="ADM.act.verifyAppt('${a.id}')">核销到店</button>
                          <button class="btn-adm outline sm" onclick="ADM.act.noshowAppt('${a.id}')">爽约</button>
                        ` : ''}
                        ${a.status === 'booked' ? `<button class="btn-adm outline sm" onclick="ADM.act.cancelAppointment('${a.id}')">取消预约</button>` : ''}
                      </div>
                    </div>`;
                }).join('')}
              </div>
            </div>
            <div class="pane-ft">${pg.pagerHtml}</div>
          </section>

          <!-- 右栏：侧边面板（前台快速挂号录单，零弹层） -->
          <section class="pane">
            <div class="pane-hd"><div class="pane-hd-title">${icon('plus')}<span>前台现场预约录单</span></div></div>
            <div class="pane-bd" style="justify-content:space-between">
              <div class="col gap6">
                <div class="field">
                  <span class="field-label">调养门店</span>
                  <select class="field-select" id="sp_appt_store" onchange="ADM.act.updateBookingServices(this.value)">${bookable.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select>
                </div>
                <div class="field">
                  <span class="field-label">服务项目</span>
                  <select class="field-select" id="sp_appt_svc">${bookingServices(bookable[0]?.id)}</select>
                </div>
                <div class="row gap6">
                  <div class="field grow">
                    <span class="field-label">预约日期</span>
                    <input type="date" class="field-input" id="sp_appt_date" value="${XA.d.key(new Date())}">
                  </div>
                  <div class="field" style="width:100px">
                    <span class="field-label">时段</span>
                    <select class="field-select" id="sp_appt_time">${D.TIMES.map(t => `<option>${esc(t)}</option>`).join('')}</select>
                  </div>
                </div>
              </div>
              <button class="btn-adm primary" style="width:100%" onclick="ADM.act.saveNewAppointmentInline()">即时挂号出码</button>
            </div>
          </section>
          <section class="pane"><div class="pane-hd"><b>候补队列</b></div><div class="pane-bd">
          ${S().waitlist.map((w,i) => `<div class="mini-box row between"><span>${esc(D.storeOf(w.storeId)?.name)} · ${esc(w.date)} ${esc(w.time)} · ${esc(D.service(w.serviceId)?.name)}</span>
          ${w.status === 'waiting' ? `<button class="btn-adm outline sm" onclick="ADM.act.releaseWait(XA.state.waitlist[${i}].id)">释放名额</button>` : '已处理'}</div>`).join('') || '暂无候补'}
          </div></section>
        </div>
      `;
    }

    // 2.5 线下雅集沙龙
    const actList = D.activities;
    const curActId = ADM.sel.act && actList.some((a) => a.id === ADM.sel.act) ? ADM.sel.act : actList[0]?.id;
    ADM.sel.act = curActId;
    const curAct = actList.find((a) => a.id === curActId) || actList[0];
    const isCreateActivity = ADM.mode.activity === 'create';

    return `${topBar}
      <div class="bento-grid" style="grid-template-columns: 310px minmax(0, 1fr);">
        <section class="pane">
          <div class="pane-hd"><div class="pane-hd-title">${icon('calendar')}<span>线下雅集活动 (${actList.length})</span></div></div>
          <div class="pane-bd dense">
            <div class="item-deck">
              ${actList.map((a) => `
                <div class="deck-row ${(!isCreateActivity && a.id === curAct?.id) ? 'on' : ''}" onclick="ADM.mode.activity='detail';ADM.sel.act='${a.id}';ADM.render()">
                  <div class="deck-thumb">${safeArt(a, 'tea', 'clay')}</div>
                  <div class="deck-main">
                    <div class="deck-title">${esc(a.title)}</div>
                    <div class="deck-meta">
                      <span class="c-price bold">¥${a.fee ?? 0}</span>
                      <span>已报名 ${a.quota != null ? a.quota-a.left : (a.booked||0)} 人</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </section>

        <section class="pane">
          ${isCreateActivity ? `
            <div class="pane-hd" style="background:#f4f8f5">
              <div class="pane-hd-title">${icon('plus')}<span><b>发布线下雅集沙龙</b></span></div>
              <div class="row gap6">
                <button class="btn-adm outline sm" onclick="ADM.setMode('activity','detail')">取消</button>
                <button class="btn-adm primary sm" onclick="ADM.act.saveNewActivityInline()">确认发布雅集</button>
              </div>
            </div>
            <div class="pane-bd" style="justify-content:space-between">
              <div class="form-grid cols-3">
                <div class="field col-span-2">
                  <span class="field-label">雅集主题 *</span>
                  <input class="field-input" id="inp_nact_title" placeholder="如：冬至艾草香囊手作与经络茶会">
                </div>
                <div class="field">
                  <span class="field-label">茶位费 (¥)</span>
                  <input type="number" class="field-input" id="inp_nact_fee" value="88">
                </div>
                <div class="field">
                  <span class="field-label">时间安排</span>
                  <input class="field-input" id="inp_nact_time" value="每周六 14:30 - 17:00">
                </div>
                <div class="field col-span-3">
                  <span class="field-label">雅集特色与流程</span>
                  <textarea class="field-textarea" id="inp_nact_desc" style="height:60px">亲手缝制五年陈艾香囊，品饮节气草本茶，体验点穴与温灸。</textarea>
                </div>
              </div>
            </div>
          ` : curAct ? `
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('settings')}<span>编辑线下雅集 · <b>${esc(curAct.title)}</b></span></div>
              <button class="btn-adm danger sm" onclick="ADM.act.deleteActivity('${curAct.id}')">取消沙龙</button>
            </div>
            <div class="pane-bd" style="justify-content:space-between">
              <div class="form-grid cols-3">
                <div class="field col-span-2">
                  <span class="field-label">雅集主题</span>
                  <input class="field-input" value="${esc(curAct.title)}" onchange="curAct.title=this.value;ADM.save('已修改雅集主题');ADM.render()">
                </div>
                <div class="field">
                  <span class="field-label">人均茶位费 (¥)</span>
                  <input type="number" class="field-input" value="${curAct.fee || 88}" onchange="curAct.fee=+this.value;ADM.save('已修改费用')">
                </div>
                <div class="field">
                  <span class="field-label">活动日期与时间</span>
                  <input class="field-input" value="${esc(curAct.time || '每周六 14:30')}" onchange="curAct.time=this.value;ADM.save('已修改时间')">
                </div>
                <div class="field">
                  <span class="field-label">成团最低门槛 (人)</span>
                  <input type="number" class="field-input" value="${curAct.minGroup || 4}" onchange="curAct.minGroup=+this.value;ADM.save('已修改成团人数')">
                </div>
                <div class="field">
                  <span class="field-label">名额上限 (人)</span>
                  <input type="number" class="field-input" value="${curAct.quota || 0}" onchange="curAct.maxSlots=+this.value;ADM.save('已修改名额上限')">
                </div>
                <div class="field col-span-3">
                  <span class="field-label">活动特色与雅集流程</span>
                  <textarea class="field-textarea" style="height:60px" onchange="curAct.desc=this.value;ADM.save('已更新活动简介')">${esc(curAct.intro || '')}</textarea>
                </div>
              </div>
            </div>
          ` : '<div class="pane-bd center muted">请选择雅集</div>'}
        </section>
      </div>
    `;
  };

  /* ============================================================================
   * 3. 用户与会员系统 (user)
   * ============================================================================ */
  ADM.views.user = () => {
    const sub = ADM.sub.userSub || 'members';
    const topBar = `
      <div class="subnav-bar">
        <div class="seg-pills">
          <button class="seg-pill ${sub === 'members' ? 'on' : ''}" onclick="ADM.setSub('userSub','members')">会员档案与资产 <em>${D.members.length}</em></button>
          <button class="seg-pill ${sub === 'plus' ? 'on' : ''}" onclick="ADM.setSub('userSub','plus')">Plus 会员年卡与权益 <em>${D.plusBenefits.length}</em></button>
          <button class="seg-pill ${sub === 'coupons' ? 'on' : ''}" onclick="ADM.setSub('userSub','coupons')">优惠券模板中心 <em>${D.couponTemplates.length}</em></button>
          <button class="seg-pill ${sub === 'fission' ? 'on' : ''}" onclick="ADM.setSub('userSub','fission')">增长裂变与分销团长 <em>${D.fissionLeaders.length}</em></button>
        </div>
        <div class="row gap8">
          ${sub === 'members' ? (ADM.mode.member === 'create' ? `<button class="btn-adm outline sm" onclick="ADM.setMode('member','detail')">返回会员列表</button>` : `<button class="btn-adm primary sm" onclick="ADM.setMode('member','create')">+ 新建会员</button>`) : ''}
          <button class="btn-adm tonal sm" onclick="ADM.openPreview('xahui')">在小程序预览会员中心</button>
        </div>
      </div>
    `;

    // 3.1 会员档案（右栏侧边面板为财务调账工作台，零弹层）
    if (sub === 'members') {
      const kw = (ADM.filter.memberKw || '').trim();
      const list = D.members.filter((m) => !kw || (m.name + m.phone + m.cardNo).includes(kw));
      const pg = ADM.paginate(list, 'user_members', 6);
      const curId = ADM.sel.member && D.members.some((m) => m.id === ADM.sel.member) ? ADM.sel.member : (pg.items[0]?.id || D.members[0]?.id);
      ADM.sel.member = curId;
      const curUser = D.members.find((m) => m.id === curId) || D.members[0];
      const isCreateMember = ADM.mode.member === 'create';

      return `${topBar}
        <div class="bento-grid" style="grid-template-columns: 290px minmax(0, 1fr) 340px;">
          <section class="pane">
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('crown')}<span>会员库 (${list.length})</span></div>
              <input class="field-input" style="height:26px;width:100px" placeholder="搜姓名/手机…" value="${esc(kw)}" oninput="ADM.filter.memberKw=this.value;ADM.page.user_members=1;ADM.render()">
            </div>
            <div class="pane-bd dense">
              <div class="item-deck">
                ${pg.items.map((m) => `
                  <div class="deck-row ${(!isCreateMember && m.id === curUser?.id) ? 'on' : ''}" onclick="ADM.mode.member='detail';ADM.sel.member='${m.id}';ADM.render()">
                    <div class="deck-thumb"><span class="logo-dot sm" style="width:34px;height:34px">${m.name.slice(0, 1)}</span></div>
                    <div class="deck-main">
                      <div class="deck-title">${esc(m.name)} <code class="tiny faint">(${m.phone.slice(-4)})</code></div>
                      <div class="deck-meta">
                        <span class="adm-tag ${m.plus ? 'gold' : 'green'}">${esc(m.level)}</span>
                        <span>积 ${m.points}</span>
                        <span>币 ${m.coins}</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="pane-ft">${pg.pagerHtml}</div>
          </section>

          <!-- 中栏：会员主档编辑或建档 -->
          <section class="pane">
            ${isCreateMember ? `
              <div class="pane-hd" style="background:#f4f8f5">
                <div class="pane-hd-title">${icon('plus')}<span><b>录入新会员客户档案</b></span></div>
                <div class="row gap6">
                  <button class="btn-adm outline sm" onclick="ADM.setMode('member','detail')">取消</button>
                  <button class="btn-adm primary sm" onclick="ADM.act.saveNewMemberInline()">确认建档保存</button>
                </div>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="form-grid cols-3">
                  <div class="field">
                    <span class="field-label">会员姓名 *</span>
                    <input class="field-input" id="inp_num_name" placeholder="如：周女士">
                  </div>
                  <div class="field">
                    <span class="field-label">手机号码 *</span>
                    <input class="field-input" id="inp_num_phone" placeholder="如：13958112233">
                  </div>
                  <div class="field">
                    <span class="field-label">会员等级</span>
                    <select class="field-select" id="inp_num_lvl"><option value="普通会员">普通会员</option><option value="银卡会员">银卡会员</option><option value="金卡会员">金卡会员</option><option value="钻卡会员">钻卡会员</option></select>
                  </div>
                  <div class="field">
                    <span class="field-label">测定体质</span>
                    <select class="field-select" id="inp_num_hb">${['平和质', '气虚质', '阳虚质', '阴虚质', '痰湿质', '湿热质', '血瘀质'].map((h) => `<option value="${h}">${h}</option>`).join('')}</select>
                  </div>
                  <div class="field">
                    <span class="field-label">赠送初始积分</span>
                    <input type="number" class="field-input" id="inp_num_pts" value="100">
                  </div>
                </div>
              </div>
            ` : curUser ? `
              <div class="pane-hd">
                <div class="pane-hd-title">${icon('settings')}<span>会员资产档案 · <b>${esc(curUser.name)}</b> <code class="tiny faint">(${curUser.cardNo})</code></span></div>
                <button class="btn-adm danger sm" onclick="ADM.act.deleteUser('${curUser.id}')">注销会员</button>
              </div>
              <div class="pane-bd" style="justify-content:space-between">
                <div class="form-grid cols-3">
                  <div class="field">
                    <span class="field-label">会员姓名</span>
                    <input class="field-input" value="${esc(curUser.name)}" onchange="curUser.name=this.value;ADM.save('已修改姓名');ADM.render()">
                  </div>
                  <div class="field">
                    <span class="field-label">手机号码</span>
                    <input class="field-input" value="${esc(curUser.phone)}" onchange="curUser.phone=this.value;ADM.save('已修改手机号')">
                  </div>
                  <div class="field">
                    <span class="field-label">测定体质类型</span>
                    <select class="field-select" onchange="curUser.habitus=this.value;ADM.save('已修改体质');ADM.render()">
                      ${['平和质', '气虚质', '阳虚质', '阴虚质', '痰湿质', '湿热质', '血瘀质', '气郁质', '特禀质'].map((h) => `<option value="${h}" ${curUser.habitus === h ? 'selected' : ''}>${h}</option>`).join('')}
                    </select>
                  </div>
                  <div class="field">
                    <span class="field-label">可用积分</span>
                    <input type="number" class="field-input" value="${curUser.points}" readonly style="background:#eef1ef">
                  </div>
                  <div class="field">
                    <span class="field-label">可用艾草币</span>
                    <input type="number" class="field-input" value="${curUser.coins}" readonly style="background:#eef1ef">
                  </div>
                  <div class="field">
                    <span class="field-label">Plus 会员年卡</span>
                    <button class="chip-btn ${curUser.plus ? 'gold on' : ''}" onclick="ADM.act.toggleUserPlus('${curUser.id}')">${curUser.plus ? '✓ 已开通 (点击延期)' : '未开通 (点击开通)'}</button>
                  </div>
                </div>

                <!-- 资产统计概览 -->
                <div class="mini-box col gap4">
                  <div class="row between"><span class="tiny faint">累计消费金额</span><b>¥${XA.money(curUser.totalSpent || 2800)}</b></div>
                  <div class="row between"><span class="tiny faint">累计成单数</span><b>${curUser.ordersCount || 8} 笔</b></div>
                  <div class="row between"><span class="tiny faint">注册入会时间</span><span>${curUser.registerAt || '2026-01-01'}</span></div>
                </div>
              </div>
            ` : '<div class="pane-bd center muted">暂无会员</div>'}
          </section>

          <!-- 右栏：侧边面板（常驻财务调账工作台，零弹层） -->
          <section class="pane">
            <div class="pane-hd"><div class="pane-hd-title">${icon('coin')}<span>财务资产调账工作台</span></div></div>
            <div class="pane-bd" style="justify-content:space-between">
              <div class="col gap6">
                <div class="field">
                  <span class="field-label">当前调账会员：<b>${esc(curUser?.name || '无')}</b></span>
                  <select class="field-select" id="sp_adj_type"><option value="points">会员积分 (可用：${curUser?.points || 0})</option><option value="coins">艾草币 (可用：${curUser?.coins || 0})</option></select>
                </div>
                <div class="field">
                  <span class="field-label">调整增减数值 (负数为扣减)</span>
                  <input type="number" class="field-input" id="sp_adj_val" value="100">
                </div>
                <div class="field">
                  <span class="field-label">财务凭证与调账原因留痕 *</span>
                  <input class="field-input" id="sp_adj_reason" placeholder="如：线下雅集补赠/客诉体验补偿">
                </div>
              </div>
              <button class="btn-adm primary" style="width:100%" onclick="ADM.act.saveAdjustBalanceInline('${curUser?.id}')">确认调账并记录流水</button>
            </div>
          </section>
        </div>
      `;
    }

    // 3.2 Plus 权益与年费包（右栏侧边面板直接新增权益，零弹层）
    if (sub === 'plus') {
      return `${topBar}
        <div class="bento-grid" style="grid-template-columns: minmax(0, 1.4fr) 350px;">
          <section class="pane">
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('crown')}<span>Plus 黑金会员特权体系 (${D.plusBenefits.length})</span></div>
              <button class="btn-adm gold sm" onclick="ADM.act.dispatchPlusPack()">一键向全体 Plus 派发月度礼包</button>
            </div>
            <div class="pane-bd dense">
              <div class="item-deck">
                ${D.plusBenefits.map((pb, pbi) => `
                  <div class="mini-box row between gap12">
                    <div class="grow ell">
                      <div class="row gap6">
                        <span class="adm-tag gold">${esc(pb.tag)}</span>
                        <b>${esc(pb.title)}</b>
                        <span class="tiny faint">额度：${esc(pb.quota)}</span>
                      </div>
                      <div class="tiny muted" style="margin-top:2px">${esc(pb.desc)}</div>
                    </div>
                    <button class="icon-btn" onclick="ADM.act.removePlusBenefit(${pbi})">✕</button>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>

          <!-- 右栏侧边面板：直接录入新特权 -->
          <section class="pane">
            <div class="pane-hd"><div class="pane-hd-title">${icon('plus')}<span>新增 Plus 专属特权</span></div></div>
            <div class="pane-bd" style="justify-content:space-between">
              <div class="col gap6">
                <div class="field">
                  <span class="field-label">特权标题 *</span>
                  <input class="field-input" id="sp_pb_title" placeholder="如：生日专属艾灸礼盒">
                </div>
                <div class="field">
                  <span class="field-label">角标标签</span>
                  <input class="field-input" id="sp_pb_tag" value="生日惊喜">
                </div>
                <div class="field">
                  <span class="field-label">权益额度</span>
                  <input class="field-input" id="sp_pb_quota" value="每年 1 次">
                </div>
                <div class="field">
                  <span class="field-label">特权说明</span>
                  <input class="field-input" id="sp_pb_desc" value="Plus 会员生日当月随单赠送专属定制礼包">
                </div>
              </div>
              <button class="btn-adm primary" style="width:100%" onclick="ADM.act.saveNewPlusBenefitInline()">添加特权至体系</button>
            </div>
          </section>
        </div>
      `;
    }

    // 3.3 优惠券模板（右栏侧边面板直接新建模板，零弹层）
    if (sub === 'coupons') {
      const list = D.couponTemplates;
      const pg = ADM.paginate(list, 'user_coupons', 6);

      return `${topBar}
        <div class="bento-grid" style="grid-template-columns: minmax(0, 1.4fr) 350px;">
          <section class="pane">
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('ticket')}<span>优惠券模板中心 (${list.length})</span></div>
            </div>
            <div class="pane-bd dense">
              <div class="item-deck">
                ${pg.items.map((tpl) => `
                  <div class="mini-box row between gap12">
                    <div class="grow ell">
                      <div class="row gap8">
                        <span class="adm-tag ${tpl.scope === 'goods' ? 'green' : 'gold'}">${tpl.scope === 'goods' ? '好物券' : '服务券'}</span>
                        <b>${esc(tpl.name)}</b>
                        <span class="c-price bold">¥${tpl.amount}</span>
                        <span>满 ¥${tpl.min} 可用</span>
                        <span class="tiny faint">${tpl.validityDays}天 ｜ 发 ${tpl.totalIssued} ｜ 核 ${tpl.totalUsed}</span>
                      </div>
                    </div>
                    <div class="row gap4">
                      <button class="btn-adm primary sm" onclick="ADM.act.grantFromTpl('${tpl.id}')">派发</button>
                      <button class="chip-btn ${tpl.enabled ? 'green on' : ''}" onclick="tpl.enabled=!tpl.enabled;ADM.save('已切换券状态');ADM.render()">${tpl.enabled ? '发放中' : '已停发'}</button>
                      <button class="icon-btn" onclick="ADM.act.deleteCouponTpl('${tpl.id}')">✕</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="pane-ft">${pg.pagerHtml}</div>
          </section>

          <!-- 右栏侧边面板：直接创建优惠券模板 -->
          <section class="pane">
            <div class="pane-hd"><div class="pane-hd-title">${icon('plus')}<span>创建新券模板</span></div></div>
            <div class="pane-bd" style="justify-content:space-between">
              <div class="col gap6">
                <div class="field">
                  <span class="field-label">优惠券名称 *</span>
                  <input class="field-input" id="sp_cp_name" placeholder="如：冬至温阳礼券">
                </div>
                <div class="field">
                  <span class="field-label">适用范围</span>
                  <select class="field-select" id="sp_cp_scope"><option value="goods">商城实物商品</option><option value="store">门店到店服务</option></select>
                </div>
                <div class="row gap6">
                  <div class="field grow">
                    <span class="field-label">面额 (¥) *</span>
                    <input type="number" class="field-input" id="sp_cp_amount" value="20">
                  </div>
                  <div class="field grow">
                    <span class="field-label">门槛 (¥)</span>
                    <input type="number" class="field-input" id="sp_cp_min" value="99">
                  </div>
                </div>
                <div class="field">
                  <span class="field-label">有效期天数</span>
                  <input type="number" class="field-input" id="sp_cp_days" value="30">
                </div>
              </div>
              <button class="btn-adm primary" style="width:100%" onclick="ADM.act.saveNewCouponTplInline()">保存并启用模板</button>
            </div>
          </section>
        </div>
      `;
    }

    // 3.4 增长裂变与分销团长（右栏侧边面板直接招募团长，零弹层）
    const flList = D.fissionLeaders;
    const pg = ADM.paginate(flList, 'user_fission', 6);

    return `${topBar}
      <div class="bento-grid" style="grid-template-columns: minmax(0, 1.4fr) 350px;">
        <section class="pane">
          <div class="pane-hd">
            <div class="pane-hd-title">${icon('share')}<span>私域裂变团长池 (${flList.length})</span></div>
          </div>
          <div class="pane-bd dense">
            <div class="item-deck">
              ${pg.items.map((fl) => `
                <div class="mini-box row between gap12">
                  <div class="grow ell">
                    <div class="row gap8">
                      <span class="adm-tag green">${esc(fl.area)}</span>
                      <b>${esc(fl.name)}</b>
                      <span class="tiny faint">(${esc(fl.phone)})</span>
                      <span>佣金率 <b>${Math.round(fl.commissionRate * 100)}%</b></span>
                      <span>邀 ${fl.totalInvited} 人</span>
                      <span>销 ¥${XA.money(fl.totalSales)}</span>
                      <span class="c-price">待提 ¥${XA.money(fl.unwithdrawn)}</span>
                    </div>
                  </div>
                  <div class="row gap4">
                    ${fl.unwithdrawn > 0 ? `
                      <button class="btn-adm primary sm" onclick="ADM.act.handleFissionPayout('${fl.id}', true)">打款</button>
                      <button class="btn-adm outline sm" onclick="ADM.act.handleFissionPayout('${fl.id}', false)">驳回</button>
                    ` : ''}
                    <button class="icon-btn" onclick="ADM.act.deleteFissionLeader('${fl.id}')">✕</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="pane-ft">${pg.pagerHtml}</div>
        </section>

        <!-- 右栏侧边面板：直接招募团长 -->
        <section class="pane">
          <div class="pane-hd"><div class="pane-hd-title">${icon('plus')}<span>招募分销团长</span></div></div>
          <div class="pane-bd" style="justify-content:space-between">
            <div class="col gap6">
              <div class="field">
                <span class="field-label">团长姓名 *</span>
                <input class="field-input" id="sp_fl_name" placeholder="如：李老师">
              </div>
              <div class="field">
                <span class="field-label">联系电话 *</span>
                <input class="field-input" id="sp_fl_phone" placeholder="如：135****8899">
              </div>
              <div class="field">
                <span class="field-label">片区名称</span>
                <input class="field-input" id="sp_fl_area" value="杭州西湖区">
              </div>
              <div class="field">
                <span class="field-label">分销佣金比例 (0.12 = 12%)</span>
                <input type="number" step="0.01" class="field-input" id="sp_fl_rate" value="0.12">
              </div>
            </div>
            <button class="btn-adm primary" style="width:100%" onclick="ADM.act.saveNewFissionLeaderInline()">确认招募入驻</button>
          </div>
        </section>
      </div>
    `;
  };

  /* ============================================================================
   * 4. 财务结算与对账系统 (finance)
   * ============================================================================ */
  ADM.views.finance = () => {
    const sub = ADM.sub.financeSub || 'ledger';
    const topBar = `
      <div class="subnav-bar">
        <div class="seg-pills">
          <button class="seg-pill ${sub === 'ledger' ? 'on' : ''}" onclick="ADM.setSub('financeSub','ledger')">全渠道资金流水 <em>${D.financeLedger.length}</em></button>
          <button class="seg-pill ${sub === 'settlement' ? 'on' : ''}" onclick="ADM.setSub('financeSub','settlement')">供应商月度结算单 <em>${D.brandSettlements.length}</em></button>
        </div>
        <div class="row gap8">
          <button class="btn-adm tonal sm" onclick="ADM.act.exportFinanceCSV()">导出对账凭证报表</button>
        </div>
      </div>
    `;

    // 4.1 全渠道资金流水（右栏侧边面板直接录入记账调账，零弹层）
    if (sub === 'ledger') {
      const typeFilter = ADM.filter.finType || '全部';
      const kw = (ADM.filter.finKw || '').trim();
      const types = ['全部', '线上收款', '门店核销', '售后退款', '会籍费收入', '供应商结算打款', '手工调账'];
      const list = D.financeLedger.filter((it) => (typeFilter === '全部' || it.type === typeFilter) && (!kw || (it.id + it.ref + it.channel).includes(kw)));
      const pg = ADM.paginate(list, 'fin_ledger', 6);

      return `${topBar}
        <div class="bento-grid" style="grid-template-columns: minmax(0, 1.4fr) 350px;">
          <section class="pane">
            <div class="pane-hd">
              <div class="pane-hd-title">${icon('coin')}<span>财务收支明细流水 (${list.length})</span></div>
              <div class="row gap6">
                <div class="chip-group">
                  ${types.map((t) => `<button class="chip-btn ${typeFilter === t ? 'on' : ''}" onclick="ADM.filter.finType='${t}';ADM.page.fin_ledger=1;ADM.render()">${t}</button>`).join('')}
                </div>
                <input class="field-input" style="height:26px;width:95px" placeholder="单号/渠道…" value="${esc(kw)}" oninput="ADM.filter.finKw=this.value;ADM.page.fin_ledger=1;ADM.render()">
              </div>
            </div>
            <div class="pane-bd dense">
              <div class="item-deck">
                ${pg.items.map((it) => `
                  <div class="mini-box row between gap12">
                    <div class="grow ell">
                      <div class="row gap8">
                        <span class="adm-tag ${it.amount >= 0 ? 'green' : 'red'}">${esc(it.type)}</span>
                        <b>${esc(it.id)}</b>
                        <span>${esc(it.channel)}</span>
                        <span>凭证：<code>${esc(it.ref)}</code></span>
                        <span class="bold ${it.amount >= 0 ? 'c-primary' : 'c-price'}">${it.amount >= 0 ? '+' : ''}¥${XA.money(it.amount)}</span>
                        <span class="tiny faint">${esc(it.status)} ｜ ${esc(it.at)}</span>
                      </div>
                    </div>
                    <div class="row gap4">
                      <button class="chip-btn ${it.status === '已平账' ? 'green on' : ''}" onclick="ADM.act.reconcileLedger('${it.id}')">${it.status === '已平账' ? '✓ 已平账' : '标记平账'}</button>
                      <button class="icon-btn" onclick="ADM.act.deleteLedgerEntry('${it.id}')">✕</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="pane-ft">${pg.pagerHtml}</div>
          </section>

          <!-- 右栏侧边面板：直接记一笔手工调账 -->
          <section class="pane">
            <div class="pane-hd"><div class="pane-hd-title">${icon('plus')}<span>录入手工记账 / 对公出入凭证</span></div></div>
            <div class="pane-bd" style="justify-content:space-between">
              <div class="col gap6">
                <div class="field">
                  <span class="field-label">收支类型</span>
                  <select class="field-select" id="sp_lg_type"><option value="线上收款">线上收款 (+)</option><option value="售后退款">售后退款 (-)</option><option value="供应商结算打款">供应商结算打款 (-)</option><option value="手工调账">手工调账 (+/-)</option></select>
                </div>
                <div class="field">
                  <span class="field-label">记账金额 (¥) *</span>
                  <input type="number" class="field-input" id="sp_lg_amount" value="500">
                </div>
                <div class="field">
                  <span class="field-label">收付渠道</span>
                  <input class="field-input" id="sp_lg_channel" value="企业对公银行账户">
                </div>
                <div class="field">
                  <span class="field-label">关联凭证与经办原因 *</span>
                  <input class="field-input" id="sp_lg_ref" placeholder="如：对公租金代扣 / 银行利息入账">
                </div>
              </div>
              <button class="btn-adm primary" style="width:100%" onclick="ADM.act.saveNewLedgerInline()">确认保存并生成流水记录</button>
            </div>
          </section>
        </div>
      `;
    }

    // 4.2 供应商月度结算（右栏侧边面板直接生成账单，零弹层）
    const stList = D.brandSettlements;
    const pg = ADM.paginate(stList, 'fin_settle', 6);

    return `${topBar}
      <div class="bento-grid" style="grid-template-columns: minmax(0, 1.4fr) 350px;">
        <section class="pane">
          <div class="pane-hd">
            <div class="pane-hd-title">${icon('doc')}<span>品牌供应商月度对账结算 (${stList.length})</span></div>
          </div>
          <div class="pane-bd dense">
            <div class="item-deck">
              ${pg.items.map((st) => `
                <div class="mini-box row between gap12">
                  <div class="grow ell">
                    <div class="row gap8">
                      <span class="adm-tag ${st.status === '已打款' ? 'green' : 'orange'}">${esc(st.status)}</span>
                      <b>${esc(st.brandName)}</b>
                      <span>账期：<b>${esc(st.period)}</b></span>
                      <span>当期销售 ¥${XA.money(st.totalSales)}</span>
                      <span>佣金 -¥${XA.money(st.platformFee)}</span>
                      <span>应结打款：<b class="c-price">¥${XA.money(st.payable)}</b></span>
                    </div>
                  </div>
                  <div class="row gap4">
                    ${st.status === '待打款' ? `<button class="btn-adm primary sm" onclick="ADM.act.settlePayout('${st.id}')">确认转账打款</button>` : ''}
                    <button class="icon-btn" onclick="ADM.act.deleteSettlement('${st.id}')">✕</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="pane-ft">${pg.pagerHtml}</div>
        </section>

        <!-- 右栏侧边面板：直接生成月度账单 -->
        <section class="pane">
          <div class="pane-hd"><div class="pane-hd-title">${icon('plus')}<span>生成新月度结算单</span></div></div>
          <div class="pane-bd" style="justify-content:space-between">
            <div class="col gap6">
              <div class="field">
                <span class="field-label">结算供应商</span>
                <select class="field-select" id="sp_st_brand">${Object.values(D.brands).map(b => `<option value="${b.id}">${b.name}</option>`).join('')}</select>
              </div>
              <div class="field">
                <span class="field-label">结算账期</span>
                <input class="field-input" id="sp_st_period" value="2026年11月">
              </div>
              <div class="field">
                <span class="field-label">当期总销售额 (¥)</span>
                <input type="number" class="field-input" id="sp_st_sales" value="38000">
              </div>
              <div class="field">
                <span class="field-label">平台扣除佣金比率 (0.15 = 15%)</span>
                <input type="number" step="0.01" class="field-input" id="sp_st_rate" value="0.15">
              </div>
            </div>
            <button class="btn-adm primary" style="width:100%" onclick="ADM.act.saveNewSettlementInline()">确认核算并生成账单</button>
          </div>
        </section>
      </div>
    `;
  };

  /* ============================================================================
   * 动作实现集合 (无需弹层，就地生效)
   * ============================================================================ */
  ADM.act.saveNewVideoInline = () => {
    const title = (document.getElementById('inp_nv_title')?.value || '').trim();
    if (!title) return ADM.toast('请填写视频标题');
    const author = document.getElementById('inp_nv_author')?.value || D.creators[0].name;
    const duration = document.getElementById('inp_nv_dur')?.value || '01:30';
    const views = +document.getElementById('inp_nv_views')?.value || 1200;
    const likes = +document.getElementById('inp_nv_likes')?.value || 80;
    const prod = document.getElementById('inp_nv_prod')?.value || 'p1';
    const id = 'v' + (D.videos.length + 1);
    D.videos.unshift({
      id, title, author, duration, views, likes,
      art: [ART_SHAPES[D.videos.length % ART_SHAPES.length], ART_TONES[D.videos.length % ART_TONES.length]],
      attachedProducts: [prod],
    });
    ADM.sel.video = id;
    ADM.mode.video = 'detail';
    ADM.save(`已成功发布短视频「${title}」`);
    ADM.render();
  };

  ADM.act.deleteVideo = (vid) => {
    const idx = D.videos.findIndex((x) => x.id === vid);
    if (idx !== -1) {
      D.videos.splice(idx, 1);
      ADM.sel.video = D.videos[0]?.id;
      ADM.save('已删除短视频');
      ADM.render();
    }
  };

  ADM.act.toggleVideoProduct = (vid, pid) => {
    const v = D.videos.find((x) => x.id === vid);
    if (!v) return;
    v.attachedProducts = v.attachedProducts || [];
    const idx = v.attachedProducts.indexOf(pid);
    if (idx !== -1) v.attachedProducts.splice(idx, 1);
    else v.attachedProducts.push(pid);
    ADM.save('已更新挂载带货商品');
    ADM.render();
  };

  ADM.act.saveNewCourseInline = () => {
    const title = (document.getElementById('inp_nc_title')?.value || '').trim();
    if (!title) return ADM.toast('请填写课程标题');
    const author = document.getElementById('inp_nc_author')?.value || '导师';
    const price = +document.getElementById('inp_nc_price')?.value || 99;
    const sub = document.getElementById('inp_nc_sub')?.value || '';
    const id = 'c' + (D.courses.length + 1);
    D.courses.unshift({
      id, title, author, price, sub,
      art: [ART_SHAPES[D.courses.length % ART_SHAPES.length], ART_TONES[D.courses.length % ART_TONES.length]],
      sections: [{ t: '第1讲：认识艾草与人体十四经脉', dur: '15:20', free: true }, { t: '第2讲：常见取穴实操与排烟防烫技巧', dur: '18:10', free: false }],
    });
    ADM.sel.course = id;
    ADM.mode.course = 'detail';
    ADM.save(`已新建专栏「${title}」`);
    ADM.render();
  };

  ADM.act.deleteCourse = (cid) => {
    const idx = D.courses.findIndex((x) => x.id === cid);
    if (idx !== -1) {
      D.courses.splice(idx, 1);
      ADM.sel.course = D.courses[0]?.id;
      ADM.save('已删除专栏');
      ADM.render();
    }
  };

  ADM.act.addCourseSection = (cid) => {
    const c = D.courses.find((x) => x.id === cid);
    if (!c) return;
    c.lessons = c.lessons || [];
    c.lessons.push({ t: `第 ${c.lessons.length + 1} 讲：经络穴位进阶`, dur: '12:00', free: false });
    ADM.save('已新增课时章节');
    ADM.render();
  };

  ADM.act.deleteCourseSection = (cid, si) => {
    const c = D.courses.find((x) => x.id === cid);
    if (!c || !c.lessons) return;
    c.lessons.splice(si, 1);
    ADM.save('已删除课时');
    ADM.render();
  };

  ADM.act.saveNewArticleInline = () => {
    const title = (document.getElementById('inp_na_title')?.value || '').trim();
    if (!title) return ADM.toast('请填写文章标题');
    const tag = document.getElementById('inp_na_tag')?.value || '节气';
    const sub = document.getElementById('inp_na_sub')?.value || '';
    const bodyText = (document.getElementById('inp_na_body')?.value || '').split('\n').map((s) => s.trim()).filter(Boolean);
    const id = 'a' + (D.articles.length + 1);
    D.articles.unshift({
      id, title, tag, sub, body: bodyText, reads: 520,
      art: [ART_SHAPES[D.articles.length % ART_SHAPES.length], ART_TONES[D.articles.length % ART_TONES.length]],
      recommendProducts: ['p1'],
    });
    ADM.sel.article = id;
    ADM.mode.article = 'detail';
    ADM.save(`已发布养生图文「${title}」`);
    ADM.render();
  };

  ADM.act.deleteArticle = (aid) => {
    const idx = D.articles.findIndex((x) => x.id === aid);
    if (idx !== -1) {
      D.articles.splice(idx, 1);
      ADM.sel.article = D.articles[0]?.id;
      ADM.save('已删除图文');
      ADM.render();
    }
  };

  ADM.act.toggleArticleProd = (aid, pid) => {
    const a = D.articles.find((x) => x.id === aid);
    if (!a) return;
    a.recommendProducts = a.recommendProducts || [];
    const idx = a.recommendProducts.indexOf(pid);
    if (idx !== -1) a.recommendProducts.splice(idx, 1);
    else a.recommendProducts.push(pid);
    ADM.save('已更新文末推荐商品');
    ADM.render();
  };

  ADM.act.saveNewNoteInline = () => {
    const title = (document.getElementById('inp_nn_title')?.value || '').trim();
    if (!title) return ADM.toast('请填写笔记标题');
    const author = document.getElementById('inp_nn_author')?.value || '艾灸达人';
    const tag = document.getElementById('inp_nn_tag')?.value || '#养生';
    const content = document.getElementById('inp_nn_content')?.value || '';
    const id = 'note_' + Date.now().toString().slice(-4);
    D.notes.unshift({
      id, title, author, tag, content, likes: 230, hidden: false,
      art: ['leaf', 'sand'],
    });
    ADM.sel.note = id;
    ADM.mode.note = 'detail';
    ADM.save(`已发布种草笔记「${title}」`);
    ADM.render();
  };

  ADM.act.deleteNote = (nid) => {
    const idx = D.notes.findIndex((x) => x.id === nid);
    if (idx !== -1) {
      D.notes.splice(idx, 1);
      ADM.sel.note = D.notes[0]?.id;
      ADM.save('已删除笔记');
      ADM.render();
    }
  };

  ADM.act.saveNewCreatorInline = () => {
    const name = (document.getElementById('inp_ncr_name')?.value || '').trim();
    if (!name) return ADM.toast('请填写博主昵称');
    const title = document.getElementById('inp_ncr_title')?.value || '博主';
    const level = document.getElementById('inp_ncr_level')?.value || '签约达人';
    const followers = +document.getElementById('inp_ncr_fans')?.value || 10000;
    const commissionRate = +document.getElementById('inp_ncr_rate')?.value || 0.15;
    D.creators.push({ name, title, level, followers, commissionRate, totalSales: 0 });
    ADM.sel.creator = name;
    ADM.mode.creator = 'detail';
    ADM.save(`已签约达人「${name}」`);
    ADM.render();
  };

  ADM.act.deleteCreator = (cname) => {
    const idx = D.creators.findIndex((x) => x.name === cname);
    if (idx !== -1) {
      D.creators.splice(idx, 1);
      ADM.sel.creator = D.creators[0]?.name;
      ADM.save(`已解约创作者「${cname}」`);
      ADM.render();
    }
  };

  // 门店动作
  ADM.act.saveNewStoreInline = () => {
    const name = (document.getElementById('inp_nst_name')?.value || '').trim();
    const addr = (document.getElementById('inp_nst_addr')?.value || '').trim();
    if (!name || !addr) return ADM.toast('请填写店名与详细地址');
    const city = document.getElementById('inp_nst_city')?.value || '杭州';
    const area = document.getElementById('inp_nst_area')?.value || '市辖区';
    const phone = document.getElementById('inp_nst_phone')?.value || '0571-88201990';
    const id = 'st_' + Date.now().toString().slice(-4);
    D.stores.push({
      id, name, city, area, address: addr, phone,
      hours: '10:00 - 21:30', rating: 5.0, reviews: 0, linked: true,
      art: ['room', 'sage'], tags: ['独立灸室', '茶歇软饮', '无烟净化'],
      services: ['s1', 's2', 's3'],
    });
    ADM.sel.store = id;
    ADM.mode.store = 'detail';
    ADM.save(`已新增门店「${name}」`);
    ADM.render();
  };

  ADM.act.deleteStore = (sid) => {
    const st = D.storeOf(sid);
    if (!st) return;
    const idx = D.stores.findIndex((x) => x.id === sid);
    if (idx !== -1) {
      D.stores.splice(idx, 1);
      ADM.sel.store = D.stores[0]?.id;
      ADM.save(`已删除门店「${st.name}」`);
      ADM.render();
    }
  };

  ADM.act.toggleStoreTag = (sid, tg) => {
    const st = D.storeOf(sid);
    if (!st) return;
    st.tags = st.tags || [];
    const idx = st.tags.indexOf(tg);
    if (idx !== -1) st.tags.splice(idx, 1);
    else st.tags.push(tg);
    ADM.save('已更新环境特色标签');
    ADM.render();
  };

  const configuredSlot = (sid,date,slot) => D.slotOverrides?.[`${sid}_${date}_${slot.time}`] || (slot.vip ? 'vip' : 'ok');
  const saveSlots = (updated, message) => {
    const previous = D.slotOverrides;
    D.slotOverrides = updated;
    if (!ADM.save(message)) D.slotOverrides = previous;
    ADM.render();
  };
  ADM.act.resetSlots = (sid,date) => {
    const prefix = `${sid}_${date}_`;
    saveSlots(Object.fromEntries(Object.entries(D.slotOverrides || {}).filter(([k]) => !k.startsWith(prefix))), '已恢复本店当天默认排班');
  };
  ADM.act.cycleSlot = (sid,date,time) => {
    const slot = D.slots(sid,date).find(s => s.time === time);
    const cur = configuredSlot(sid,date,slot);
    saveSlots({...D.slotOverrides,[`${sid}_${date}_${time}`]: {ok:'vip',vip:'full',full:'ok'}[cur]}, '已调整时段排班');
  };

  ADM.act.saveNewServiceInline = () => {
    const name = (document.getElementById('inp_nsv_name')?.value || '').trim();
    if (!name) return ADM.toast('请填写项目名称');
    const dur = +document.getElementById('inp_nsv_dur')?.value || 45;
    const price = +document.getElementById('inp_nsv_price')?.value || 198;
    const desc = document.getElementById('inp_nsv_desc')?.value || '';
    const id = 's' + (D.services.length + 1);
    D.services.push({
      id, name, dur, price, desc, fit: ['阳虚质', '气虚质'],
      art: ['bed', 'clay'],
    });
    ADM.sel.service = id;
    ADM.mode.service = 'detail';
    ADM.save(`已新增服务项目「${name}」`);
    ADM.render();
  };

  ADM.act.deleteService = (sid) => {
    const idx = D.services.findIndex((x) => x.id === sid);
    if (idx !== -1) {
      D.services.splice(idx, 1);
      ADM.sel.service = D.services[0]?.id;
      ADM.save('已删除服务项目');
      ADM.render();
    }
  };

  ADM.act.toggleServiceFit = (sid, t) => {
    const sv = D.service(sid);
    if (!sv) return;
    sv.fit = sv.fit || [];
    const idx = sv.fit.indexOf(t);
    if (idx !== -1) sv.fit.splice(idx, 1);
    else sv.fit.push(t);
    ADM.save('已更新适宜体质');
    ADM.render();
  };

  const bookingServices = id => {
    const store = D.stores.find(s => s.id === id);
    return D.services.filter(s => store?.services.includes(s.id)).map(s =>
      `<option value="${esc(s.id)}">${esc(s.name)} (¥${esc(s.mprice)})</option>`).join('');
  };
  ADM.act.updateBookingServices = id => {
    document.getElementById('sp_appt_svc').innerHTML = bookingServices(id);
  };

  ADM.act.saveNewAppointmentInline = () => {
    const storeId = document.getElementById('sp_appt_store')?.value;
    const serviceId = document.getElementById('sp_appt_svc')?.value;
    const date = document.getElementById('sp_appt_date')?.value;
    const time = document.getElementById('sp_appt_time')?.value || '15:00';
    ADM.applyStoreAction('book', {appointment:{id:XA.uid('YY'),storeId,serviceId,staffId:'any',date,time}},
      result => '现场预约成功，核销码 ' + result.appointment.code);
  };

  ADM.act.cancelAppointment = id => ADM.confirm('确认取消该预约？', () => {
    const appointment = S().appts.find(a => a.id === id);
    if (appointment) ADM.applyStoreAction('cancel', {id,storeId:appointment.storeId}, '预约已取消');
  });

  ADM.act.saveNewActivityInline = () => {
    const title = (document.getElementById('inp_nact_title')?.value || '').trim();
    if (!title) return ADM.toast('请填写雅集主题');
    const fee = +document.getElementById('inp_nact_fee')?.value || 88;
    const time = document.getElementById('inp_nact_time')?.value || '周六 14:30';
    const desc = document.getElementById('inp_nact_desc')?.value || '';
    const id = 'act_' + Date.now().toString().slice(-4);
    D.activities.unshift({
      id, title, fee, time, desc, booked: 2, minGroup: 4, maxSlots: 10,
      art: ['tea', 'clay'],
    });
    ADM.sel.act = id;
    ADM.mode.activity = 'detail';
    ADM.save(`已发布雅集「${title}」`);
    ADM.render();
  };

  ADM.act.deleteActivity = (aid) => {
    const idx = D.activities.findIndex((x) => x.id === aid);
    if (idx !== -1) {
      D.activities.splice(idx, 1);
      ADM.sel.act = D.activities[0]?.id;
      ADM.save('已删除雅集');
      ADM.render();
    }
  };

  // 用户与会员动作
  ADM.act.saveNewMemberInline = () => {
    const name = (document.getElementById('inp_num_name')?.value || '').trim();
    const phone = (document.getElementById('inp_num_phone')?.value || '').trim();
    if (!name || !phone) return ADM.toast('请填写姓名与手机号码');
    const level = document.getElementById('inp_num_lvl')?.value || '普通会员';
    const habitus = document.getElementById('inp_num_hb')?.value || '平和质';
    const points = +document.getElementById('inp_num_pts')?.value || 100;
    const id = 'u_' + Date.now().toString().slice(-4);
    D.members.unshift({
      id, name, phone, cardNo: 'XA-' + Math.floor(100000 + Math.random() * 900000),
      level, habitus, points, coins: 20, plus: false, plusExpire: '',
      totalSpent: 0, ordersCount: 0, registerAt: new Date().toISOString().slice(0, 10), status: '正常',
    });
    ADM.sel.member = id;
    ADM.mode.member = 'detail';
    ADM.save(`已成功建立会员档案「${name}」`);
    ADM.render();
  };

  ADM.act.deleteUser = (uid) => {
    const u = D.members.find((x) => x.id === uid);
    if (!u) return;
    const idx = D.members.findIndex((x) => x.id === uid);
    if (idx !== -1) {
      D.members.splice(idx, 1);
      ADM.sel.member = D.members[0]?.id;
      ADM.save(`已注销会员 ${u.name}`);
      ADM.render();
    }
  };

  ADM.act.saveAdjustBalanceInline = (uid) => {
    const u = D.members.find((x) => x.id === uid);
    if (!u) return ADM.toast('请选择要调账的会员');
    const type = document.getElementById('sp_adj_type')?.value;
    const val = +document.getElementById('sp_adj_val')?.value || 0;
    const reason = (document.getElementById('sp_adj_reason')?.value || '').trim();
    if (!reason || val === 0) return ADM.toast('请填写调整数值和财务原因');
    if (type === 'points') {
      u.points = Math.max(0, u.points + val);
      XA.addPoints(val, `运营后台人工调账：${reason}`, val);
    } else {
      u.coins = Math.max(0, u.coins + val);
    }
    document.getElementById('sp_adj_reason').value = '';
    ADM.save(`已在侧边面板为 ${u.name} 调整${type === 'points' ? '积分' : '艾草币'} ${val > 0 ? '+' : ''}${val}`);
    ADM.render();
  };

  ADM.act.toggleUserPlus = (uid) => {
    const u = D.members.find((x) => x.id === uid);
    if (!u) return;
    u.plus = !u.plus;
    u.plusExpire = u.plus ? '2027-11-01' : '';
    ADM.save(`已为 ${u.name} ${u.plus ? '开通' : '取消'} Plus 会员年卡`);
    ADM.render();
  };

  ADM.act.saveNewPlusBenefitInline = () => {
    const title = (document.getElementById('sp_pb_title')?.value || '').trim();
    if (!title) return ADM.toast('请填写特权标题');
    const tag = document.getElementById('sp_pb_tag')?.value || '特权';
    const quota = document.getElementById('sp_pb_quota')?.value || '每月';
    const desc = document.getElementById('sp_pb_desc')?.value || '';
    const id = 'pb_' + Date.now().toString().slice(-4);
    D.plusBenefits.push({ id, title, tag, quota, desc });
    document.getElementById('sp_pb_title').value = '';
    ADM.save(`已在侧边面板新增 Plus 权益「${title}」`);
    ADM.render();
  };

  ADM.act.dispatchPlusPack = () => {
    const plusUsers = D.members.filter((m) => m.plus);
    ADM.save(`已成功向 ${plusUsers.length} 位活跃 Plus 黑金会员批量派送本月专属免运包邮券与服务礼包`);
  };

  ADM.act.saveNewCouponTplInline = () => {
    const name = (document.getElementById('sp_cp_name')?.value || '').trim();
    if (!name) return ADM.toast('请填写优惠券名称');
    const scope = document.getElementById('sp_cp_scope')?.value || 'goods';
    const amount = +document.getElementById('sp_cp_amount')?.value || 10;
    const min = +document.getElementById('sp_cp_min')?.value || 59;
    const validityDays = +document.getElementById('sp_cp_days')?.value || 30;
    const id = 'tpl_' + Date.now().toString().slice(-4);
    D.couponTemplates.push({ id, name, scope, amount, min, validityDays, totalIssued: 0, totalUsed: 0, enabled: true });
    document.getElementById('sp_cp_name').value = '';
    ADM.save(`已在侧边面板创建优惠券模板「${name}」`);
    ADM.render();
  };

  ADM.act.deleteCouponTpl = (tplId) => {
    const idx = D.couponTemplates.findIndex((x) => x.id === tplId);
    if (idx !== -1) {
      D.couponTemplates.splice(idx, 1);
      ADM.save('已删除优惠券模板');
      ADM.render();
    }
  };

  ADM.act.grantFromTpl = (tplId) => {
    const tpl = D.couponTemplates.find((t) => t.id === tplId);
    if (!tpl) return;
    tpl.totalIssued += D.members.length;
    ADM.save(`已向全站 ${D.members.length} 名会员派发优惠券「${tpl.name}」`);
    ADM.render();
  };

  ADM.act.saveNewFissionLeaderInline = () => {
    const name = (document.getElementById('sp_fl_name')?.value || '').trim();
    const phone = (document.getElementById('sp_fl_phone')?.value || '').trim();
    if (!name || !phone) return ADM.toast('请填写团长姓名与手机');
    const area = document.getElementById('sp_fl_area')?.value || '片区';
    const commissionRate = +document.getElementById('sp_fl_rate')?.value || 0.12;
    const id = 'fl_' + Date.now().toString().slice(-4);
    D.fissionLeaders.push({
      id, name, phone, area, commissionRate, totalInvited: 0,
      totalSales: 0, unwithdrawn: 0, totalWithdrawn: 0, status: '正常',
    });
    document.getElementById('sp_fl_name').value = '';
    document.getElementById('sp_fl_phone').value = '';
    ADM.save(`已在侧边面板招募团长「${name}」`);
    ADM.render();
  };

  ADM.act.deleteFissionLeader = (flId) => {
    const idx = D.fissionLeaders.findIndex((x) => x.id === flId);
    if (idx !== -1) {
      D.fissionLeaders.splice(idx, 1);
      ADM.save('已删除团长');
      ADM.render();
    }
  };

  ADM.act.handleFissionPayout = (flId, pass) => {
    const fl = D.fissionLeaders.find((x) => x.id === flId);
    if (!fl) return;
    if (pass) {
      const amt = fl.unwithdrawn;
      fl.totalWithdrawn += amt;
      fl.unwithdrawn = 0;
      D.financeLedger.unshift({
        id: 'FIN' + Date.now().toString().slice(-6), type: '供应商结算打款', channel: '微信零钱提现',
        ref: fl.id, amount: -amt, fee: 0, net: -amt, status: '已打款', at: XA.d.full(new Date().toISOString()),
      });
      ADM.save(`已完成团长「${fl.name}」分销佣金打款 ¥${XA.money(amt)}`);
    } else {
      ADM.save(`已驳回团长「${fl.name}」提现申请`);
    }
    ADM.render();
  };

  // 财务动作
  ADM.act.saveNewLedgerInline = () => {
    const type = document.getElementById('sp_lg_type')?.value;
    const amount = +document.getElementById('sp_lg_amount')?.value || 0;
    const channel = document.getElementById('sp_lg_channel')?.value || '对公银行';
    const ref = (document.getElementById('sp_lg_ref')?.value || '').trim();
    if (!ref || amount === 0) return ADM.toast('请填写记账凭证说明与非零金额');
    const id = 'FIN' + Date.now().toString().slice(-6);
    D.financeLedger.unshift({
      id, type, channel, ref, amount, fee: 0, net: amount,
      status: '已入账', at: XA.d.full(new Date().toISOString()),
    });
    document.getElementById('sp_lg_ref').value = '';
    ADM.save(`已在侧边面板记录财务流水 ${id} ¥${XA.money(amount)}`);
    ADM.render();
  };

  ADM.act.reconcileLedger = (lid) => {
    const it = D.financeLedger.find((x) => x.id === lid);
    if (!it) return;
    it.status = it.status === '已平账' ? '已入账' : '已平账';
    ADM.save(`流水 ${lid} 已标记为「${it.status}」`);
    ADM.render();
  };

  ADM.act.deleteLedgerEntry = (lid) => {
    const idx = D.financeLedger.findIndex((x) => x.id === lid);
    if (idx !== -1) {
      D.financeLedger.splice(idx, 1);
      ADM.save(`已冲销作废流水 ${lid}`);
      ADM.render();
    }
  };

  ADM.act.saveNewSettlementInline = () => {
    const brandId = document.getElementById('sp_st_brand')?.value;
    const brand = D.brands[brandId] || Object.values(D.brands)[0];
    const period = document.getElementById('sp_st_period')?.value || '2026年11月';
    const totalSales = +document.getElementById('sp_st_sales')?.value || 30000;
    const commissionRate = +document.getElementById('sp_st_rate')?.value || 0.15;
    const platformFee = Math.round(totalSales * commissionRate * 100) / 100;
    const payable = Math.round((totalSales - platformFee) * 100) / 100;
    const id = 'ST-' + brand.id.toUpperCase() + '-' + Date.now().toString().slice(-4);
    D.brandSettlements.unshift({
      id, brandId, brandName: brand.name, period,
      totalSales, commissionRate, platformFee, payable, status: '待打款',
    });
    ADM.save(`已在侧边面板为「${brand.name}」生成当期账单 ${id}`);
    ADM.render();
  };

  ADM.act.deleteSettlement = (sid) => {
    const idx = D.brandSettlements.findIndex((x) => x.id === sid);
    if (idx !== -1) {
      D.brandSettlements.splice(idx, 1);
      ADM.save(`已撤销账单 ${sid}`);
      ADM.render();
    }
  };

  ADM.act.exportFinanceCSV = () => {
    let csv = '流水号,收支类型,渠道,关联凭证,发生金额,手续费,净额,状态,记账时间\n';
    D.financeLedger.forEach((it) => {
      csv += `"${it.id}","${it.type}","${it.channel}","${it.ref}",${it.amount},${it.fee},${it.net},"${it.status}","${it.at}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `晓艾运营对账凭证_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    ADM.toast('已成功导出财务对账凭证 CSV 报表');
  };
})();
