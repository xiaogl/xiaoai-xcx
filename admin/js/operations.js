/* 工作区以资源注册表组织导航、筛选、列表和对象侧栏。 */
(function () {
  const D = XA.data,
    esc = XA.esc,
    icon = XA.icon;
  const UI_KEY = "xa_admin_workspace_v2";
  let remembered = {};
  try {
    remembered = JSON.parse(localStorage.getItem(UI_KEY)) || {};
  } catch {}
  const resources = new Map();
  const columnPreferences = remembered.columns || {};
  const cellValue = (row, key) =>
    key.split(".").reduce((value, part) => value?.[part], row);
  function availableColumns(resource) {
    return [
      ...resource.columns,
      ...ADM.extensions
        .forType(resource.type)
        .map((field) => ({ key: "meta." + field.key, title: field.label })),
    ];
  }
  function visibleColumns(resource) {
    const preference = columnPreferences[resource.id];
    return availableColumns(resource).filter(
      (column, index) =>
        index === 0 ||
        (preference
          ? preference.includes(column.key)
          : resource.columns.some((c) => c.key === column.key)),
    );
  }
  const groups = [
    ["daily", "工作台"],
    ["shop", "交易与商品"],
    ["content", "内容运营"],
    ["store", "门店服务"],
    ["school", "学校教务"],
    ["user", "会员运营"],
    ["finance", "财务"],
  ];
  let route = location.hash.slice(2) || remembered.route || "overview",
    selected = {},
    selectedRows = new Set(),
    inspectorTab = "summary";
  let groupOpen = remembered.groups || {
    daily: true,
    shop: true,
    content: false,
    store: false,
    user: false,
    finance: false,
  };
  let filters = remembered.filters || {},
    savedViews = remembered.views || {},
    fieldDraft = null;
  const money = (n) => "¥" + XA.money(n || 0);
  const text = (value) => esc(value ?? "—");
  const label = (row) => row.short || row.title || row.name || row.id;
  const listFor = (type) => {
    const def = ADM.recordDefinitions[type];
    const data = D[def.data];
    return Array.isArray(data) ? data : Object.values(data);
  };
  const col = (key, title, format) => ({ key, title, format });
  const productStatus = (p) =>
    p.offShelf ? "已下架" : p.stock <= 0 || p.soldOut ? "已售罄" : "在售";
  ADM.registerGroup = ({ id, title }) => {
    if (!/^[a-z][a-zA-Z0-9]*$/.test(id) || !title)
      throw new Error("业务分组定义不完整");
    const existing = groups.find((group) => group[0] === id);
    if (existing) existing[1] = title;
    else groups.push([id, title]);
  };
  ADM.registerResource = (config) => {
    if (
      !config.id ||
      !config.group ||
      !config.title ||
      (!config.fallback && !config.overview && !config.type && !config.queue)
    )
      throw new Error("业务资源配置不完整");
    if (!groups.some((group) => group[0] === config.group))
      throw new Error("请先注册业务分组");
    if (config.type && !ADM.recordDefinitions[config.type])
      throw new Error("请先注册资料定义");
    resources.set(config.id, config);
  };
  [
    {
      id: "overview",
      group: "daily",
      title: "待办工作台",
      overview: true,
      icon: "home",
    },
    {
      id: "products",
      group: "shop",
      title: "商品",
      type: "product",
      icon: "bag",
      status: productStatus,
      columns: [
        col("short", "商品"),
        col("category", "分类"),
        col("price", "售价", money),
        col("stock", "可售库存"),
        col("sales", "累计销量", (n) => XA.wan(n || 0)),
      ],
    },
    {
      id: "orders",
      group: "shop",
      title: "订单履约",
      fallback: ["shop", "orders"],
      icon: "truck",
    },
    {
      id: "refunds",
      group: "shop",
      title: "售后处理",
      fallback: ["shop", "refunds"],
      icon: "ticket",
    },
    {
      id: "brands",
      group: "shop",
      title: "品牌",
      type: "brand",
      icon: "shield",
      columns: [
        col("name", "品牌"),
        col("city", "所在地"),
        col("origin", "产地"),
        col("certs", "资质记录", (v) => (v || []).length + " 项"),
      ],
    },
    ...[["shopTags","商品标签","shop"],["contentCategories","内容分类","content"],["contentTags","内容标签","content"]].map(([id,title,group]) => ({
      id, title, group, type:id, icon:"list", status:r => r.enabled ? "启用" : "停用",
      columns:[col("name","名称"),col("sort","排序")]
    })),
    {
      id: "categories",
      group: "shop",
      title: "商品分类",
      type: "category",
      icon: "list",
      status: (r) => (r.enabled ? "启用" : "停用"),
      columns: [
        col("name", "一级分类"),
        col("sub", "二级分类", (v) => (v || []).join(" / ")),
        col("sort", "排序"),
      ],
    },
    {
      id: "campaign",
      group: "content",
      title: "首页活动位",
      type: "campaign",
      singleton: true,
      icon: "image",
      status: (r) => (r.enabled ? "已启用" : "未启用"),
      columns: [
        col("title", "活动标题"),
        col("start", "开始日期"),
        col("end", "结束日期"),
        col("heightPercent", "高度", (v) => v + "%"),
      ],
    },
    {
      id: "notice",
      group: "content",
      title: "首页公告",
      type: "notice",
      singleton: true,
      icon: "info",
      status: (r) => (r.enabled ? "已启用" : "未启用"),
      columns: [
        col("title", "公告标题"),
        col("start", "开始日期"),
        col("end", "结束日期"),
      ],
    },
    {
      id: "videos",
      group: "content",
      title: "短视频",
      type: "video",
      icon: "video",
      columns: [
        col("title", "视频标题"),
        col("author", "发布账号"),
        col("binds", "挂载内容", (v) => (v || []).length + " 项"),
        col("likes", "获赞", (v) => XA.wan(v || 0)),
      ],
    },
    {
      id: "courses",
      group: "content",
      title: "付费课程",
      type: "course",
      status: c => c.published === false ? "草稿" : "已发布",
      icon: "book",
      columns: [
        col("title", "课程"),
        col("teacher", "主讲人"),
        col("price", "售价", money),
        col("lessons", "课节", (v) => (v || []).length + " 讲"),
      ],
    },
    {
      id: "articles",
      group: "content",
      title: "养生文章",
      type: "article",
      status: item => item.published === false ? "草稿" : item.workingCopy ? "已发布 · 有草稿" : "已发布",
      icon: "doc",
      columns: [
        col("title", "标题"),
        col("author", "作者"),
        col("read", "阅读量", (v) => XA.wan(v || 0)),
      ],
    },
    {
      id: "notes",
      group: "content",
      title: "社区笔记",
      type: "note",
      status: item => item.published === false ? "草稿" : item.workingCopy ? "已发布 · 有草稿" : "已发布",
      icon: "edit",
      columns: [
        col("title", "笔记"),
        col("author", "账号"),
        col("likes", "获赞", (v) => XA.wan(v || 0)),
      ],
    },
    {
      id: "creators",
      group: "content",
      title: "创作者",
      type: "creator",
      icon: "user",
      columns: [
        col("name", "账号"),
        col("kind", "类型"),
        col("badge", "展示身份"),
        col("fans", "粉丝", (v) => XA.wan(v || 0)),
      ],
    },
    {id:"schoolJobs",group:"store",title:"技师招聘",type:"schoolJob",icon:"store",status:r=>r.closed?"已关闭":"招聘中",
      columns:[col("title","岗位"),col("storeId","招聘门店",id=>D.stores.find(s=>s.id===id)?.name),col("requirements","任职要求")]},
    {id:"classes",group:"school",title:"培训与门店委培",type:"schoolClass",icon:"book",
      columns:[col("title","培训班"),col("start","开班日期"),col("instructorId","讲师",id=>D.creators.find(c=>c.id===id)?.name),
        col("storeId","委培门店",id=>D.stores.find(s=>s.id===id)?.name)]},
    {id:"enrollments",group:"school",title:"学员、发证与就业",type:"enrollment",icon:"user",status:r=>r.placement||"未登记",
      columns:[col("name","学员"),col("classId","培训班",id=>D.schoolClasses.find(c=>c.id===id)?.title),
        col("certificate.number","结业证号"),col("jobId","对接岗位",id=>D.schoolJobs.find(j=>j.id===id)?.title)]},
    {
      id: "stores",
      group: "store",
      title: "门店档案",
      type: "store",
      icon: "store",
      status: (r) => (r.linked ? "已接入" : "待接入"),
      columns: [
        col("name", "门店"),
        col("city", "城市"),
        col("district", "行政区"),
        col("area", "商圈"),
        col("rating", "评分"),
      ],
    },
    {
      id: "partners",
      group: "store",
      title: "合作入驻审核",
      queue: "partners",
      icon: "shield",
    },
    {
      id: "staff", group: "store", title: "技师管理", fallback: ["store", "staff"], icon: "person",
    },
    {
      id: "schedule",
      group: "store",
      title: "时段排班",
      fallback: ["store", "schedule"],
      icon: "calendar",
    },
    {
      id: "services",
      group: "store",
      title: "服务项目",
      type: "service",
      icon: "flame",
      columns: [
        col("name", "服务"),
        col("dur", "时长", (v) => v + " 分钟"),
        col("price", "原价", money),
        col("mprice", "会籍价", money),
      ],
    },
    {
      id: "verify",
      group: "store",
      title: "预约与核销",
      fallback: ["store", "verify"],
      icon: "scan",
    },
    {
      id: "activities",
      group: "store",
      title: "门店活动",
      type: "activity",
      icon: "calendar",
      columns: [
        col("title", "主题"),
        col("store", "举办门店", (id) => D.storeOf(id)?.name || "待设置"),
        col("quota", "总名额"),
        col("left", "剩余名额"),
      ],
    },
    {
      id: "members",
      group: "user",
      title: "会员档案",
      type: "member",
      icon: "users",
      status: (r) => r.status || "正常",
      columns: [
        col("name", "会员"),
        col("phone", "手机号"),
        col("level", "等级"),
        col("points", "积分"),
        col("plusExpire", "Plus 有效期"),
      ],
    },
    {
      id: "claims",
      group: "user",
      title: "积分补登审核",
      queue: "claims",
      icon: "coin",
    },
    {
      id: "coupons",
      group: "user",
      title: "优惠券",
      type: "coupon",
      icon: "ticket",
      status: (r) => (r.enabled ? "启用" : "停用"),
      columns: [
        col("name", "优惠券"),
        col("scope", "适用范围", (v) => (v === "goods" ? "商品" : "到店服务")),
        col("amount", "面额", money),
        col("totalIssued", "已发放"),
        col("totalUsed", "已使用"),
      ],
    },
    {
      id: "plus",
      group: "user",
      title: "Plus 方案",
      type: "plus",
      singleton: true,
      icon: "crown",
      columns: [
        col("price", "年费", money),
        col("days", "有效天数"),
        col("perks", "权益说明", (v) => (v || []).length + " 项"),
      ],
    },
    {
      id: "fission",
      group: "user",
      title: "推广员",
      fallback: ["user", "fission"],
      icon: "share",
    },
    {
      id: "ledger",
      group: "finance",
      title: "资金流水",
      fallback: ["finance", "ledger"],
      icon: "coin",
    },
    {
      id: "settlement",
      group: "finance",
      title: "品牌结算",
      fallback: ["finance", "settle"],
      icon: "wallet",
    },
  ].forEach(ADM.registerResource);
  if (!resources.has(route)) route = "overview";
  function state() {
    return (filters[route] ||= {
      q: "",
      status: "全部",
      category: "全部",
      page: 1,
      size: 10,
      view: "全部",
    });
  }
  function persistUI() {
    try {
      localStorage.setItem(
        UI_KEY,
        JSON.stringify({
          route,
          filters,
          views: savedViews,
          groups: groupOpen,
          columns: columnPreferences,
        }),
      );
    } catch {}
  }
  function rowsFor(resource) {
    return listFor(resource.type);
  }
  const keyOf = (row) => row.id || row.name || "singleton";
  function filtered(resource) {
    const f = state();
    const result = rowsFor(resource).filter((row) => {
      if (f.status !== "全部" && resource.status?.(row) !== f.status)
        return false;
      if (
        f.category !== "全部" &&
        resource.type === "product" &&
        row.category !== f.category
      )
        return false;
      const q = f.q.trim().toLowerCase();
      return (
        !q ||
        [
          label(row),
          row.id,
          row.code,
          row.certificate?.number,
          row.phone,
          row.city,
          row.teacher,
          row.author,
        ].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(q),
        )
      );
    });
    if (f.sort)
      result.sort((a, b) => {
        const x = cellValue(a, f.sort),
          y = cellValue(b, f.sort);
        const comparison =
          typeof x === "number" && typeof y === "number"
            ? x - y
            : String(x ?? "").localeCompare(String(y ?? ""), "zh-CN");
        return f.direction === "desc" ? -comparison : comparison;
      });
    return result;
  }
  function canLeave() {
    if (!ADM.recordIsDirty()) return true;
    ADM.toast("右侧有未保存的修改，请先保存或取消");
    return false;
  }
  function navigate(id) {
    if (!resources.has(id) || !canLeave()) return;
    ADM.closeRecord();
    if (["orders","refunds","products","verify","staff","schedule"].includes(id)) ADM.load();
    route = id;
    groupOpen[resources.get(id).group] = true;
    selectedRows.clear();
    inspectorTab = "summary";
    persistUI();
    history.replaceState(null, "", "#/" + id);
    render();
  }
  function renderRail() {
    document.getElementById("rail").innerHTML =
      `<div class="op-brand"><span class="logo-dot">艾</span><div><b>晓艾</b><small>运营工作台</small></div></div><nav class="op-nav" aria-label="业务目录">${groups
        .map(
          ([id, title]) =>
            `<section><button class="op-nav-group" data-toggle-group="${id}" aria-expanded="${!!groupOpen[id]}"><span>${title}</span>${icon(groupOpen[id] ? "down" : "right")}</button><div ${groupOpen[id] ? "" : "hidden"}>${[
              ...resources.values(),
            ]
              .filter((r) => r.group === id)
              .map(
                (r) =>
                  `<button data-nav="${r.id}" class="${route === r.id ? "on" : ""}" aria-current="${route === r.id ? "page" : "false"}">${icon(r.icon)}<span>${r.title}</span>${r.id === "orders" ? `<em>${XA.state.orders.filter((o) => o.status === "toship").length}</em>` : ""}</button>`,
              )
              .join("")}</div></section>`,
        )
        .join(
          "",
        )}</nav><div class="op-rail-foot"><i class="status-dot"></i>免密演示 · 工作视图自动保存</div>`;
  }
  function renderHeader(resource) {
    document.getElementById("topbar").innerHTML =
      `<div class="op-breadcrumb">晓艾运营<span>/</span>${groups.find((g) => g[0] === resource.group)[1]}<span>/</span><b>${resource.title}</b></div><div class="op-header-actions"><button class="btn-adm outline sm" data-command>${icon("search")}搜索业务 <kbd>⌘K</kbd></button><a class="btn-adm outline sm" href="${esc(XA.demoLink('/merchant/'))}" target="_blank">门店端</a><a class="btn-adm outline sm" href="${esc(XA.demoLink('/'))}" target="_blank">用户端</a><button class="btn-adm outline sm" onclick="navigator.clipboard.writeText(XA.demoLink('/admin')).then(()=>ADM.toast('已复制同一演示空间链接'))">复制协作链接</button></div>`;
  }
  function render() {
    const r = resources.get(route);
    ADM.tab = r.fallback?.[0] || r.group;
    if (r.fallback) ADM.sub[r.fallback[0] + "Sub"] = r.fallback[1];
    renderRail();
    renderHeader(r);
    const ws = document.getElementById("workspace");
    ws.className = "workspace op-workspace";
    ws.innerHTML = `<div class="op-page-head"><div><h1>${r.title}</h1><p>${r.overview ? "从待处理事项开始，处理后返回队列。" : r.fallback ? "选择业务记录，在当前工作区完成处理。" : "查找、查看和维护" + r.title + "，业务记录随保存更新。"}</p></div><div class="op-page-actions">${r.type ? `<button class="btn-adm outline" data-fields>字段设置</button>${r.singleton ? "" : `<button class="btn-adm primary" data-new>${icon("plus")}新增${ADM.recordDefinitions[r.type].title}</button>`}` : ""}</div></div><div id="opContent" class="op-content"></div>`;
    if (r.overview) renderOverview();
    else if (r.queue) renderQueue(r);
    else if (r.fallback) renderFallback(r);
    else renderTable(r);
    persistUI();
  }
  function renderTable(r) {
    const f = state(),
      all = rowsFor(r),
      match = filtered(r),
      pages = Math.max(1, Math.ceil(match.length / f.size));
    f.page = Math.min(pages, f.page);
    const page = match.slice((f.page - 1) * f.size, f.page * f.size);
    const picked = match.find((row) => keyOf(row) === selected[route]);
    document.getElementById("opContent").innerHTML =
      `<div class="op-views"><button class="${f.view === "全部" ? "on" : ""}" data-view="全部">全部 <span>${all.length}</span></button>${(savedViews[route] || []).map((v, i) => `<button data-view-index="${i}" class="${f.view === v.name ? "on" : ""}">${esc(v.name)}</button>`).join("")}<button class="op-save-view" data-save-view>保存当前筛选</button></div>
    <div class="op-filterbar"><label class="op-search">${icon("search")}<input id="opSearch" type="search" placeholder="搜索${r.title}名称、编号${r.type === "member" ? "或手机号" : ""}" aria-label="搜索${r.title}" value="${esc(f.q)}"></label>${r.status ? `<label>状态<select id="opStatus">${["全部", ...new Set(all.map(r.status))].map((v) => `<option ${v === f.status ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>` : ""}${r.type === "product" ? `<label>分类<select id="opCategory">${["全部", ...new Set(all.map((p) => p.category))].map((c) => `<option ${c === f.category ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label>` : ""}<button class="op-clear" data-clear>重置筛选</button><span class="op-result-count">${match.length} 条结果</span><button class="btn-adm outline sm" data-columns>显示列</button></div>
    <div class="op-list-workspace ${picked ? "with-inspector" : ""}"><div class="op-table-panel"><div class="op-batch ${selectedRows.size ? "active" : ""}"><label><input id="opSelectAll" type="checkbox" aria-label="选择本页" ${page.length && page.every((p) => selectedRows.has(keyOf(p))) ? "checked" : ""}>${selectedRows.size ? "已选 " + selectedRows.size + " 项" : "选择本页"}</label>${selectedRows.size && r.type === "product" ? '<button class="btn-adm outline sm" data-batch="on">批量上架</button><button class="btn-adm outline sm" data-batch="off">批量下架</button>' : ""}${selectedRows.size ? '<button class="op-clear" data-clear-selection>取消选择</button>' : ""}</div><div class="op-table-scroll"><table class="op-table"><thead><tr><th class="op-checkbox-col"></th>${visibleColumns(
      r,
    )
      .map(
        (c) =>
          `<th><button class="op-sort" data-sort="${esc(c.key)}">${c.title}${f.sort === c.key ? (f.direction === "desc" ? " ↓" : " ↑") : ""}</button></th>`,
      )
      .join(
        "",
      )}${r.status ? "<th>状态</th>" : ""}<th class="op-action-col">操作</th></tr></thead><tbody>${page
      .map(
        (row) =>
          `<tr class="${selected[route] === keyOf(row) ? "selected" : ""}"><td><input type="checkbox" data-row-check="${esc(keyOf(row))}" aria-label="选择${esc(label(row))}" ${selectedRows.has(keyOf(row)) ? "checked" : ""}></td>${visibleColumns(
            r,
          )
            .map(
              (c, i) =>
                `<td>${i === 0 ? `<button class="op-row-title" data-open="${esc(keyOf(row))}">${text(c.format ? c.format(cellValue(row, c.key)) : cellValue(row, c.key))}</button>${row.code ? `<small>${esc(row.code)}</small>` : ""}` : text(c.format ? c.format(cellValue(row, c.key)) : cellValue(row, c.key))}</td>`,
            )
            .join(
              "",
            )}${r.status ? `<td><span class="op-status ${["在售", "已接入", "启用", "正常"].includes(r.status(row)) ? "green" : ""}">${esc(r.status(row))}</span></td>` : ""}<td><button class="op-edit" data-edit="${esc(keyOf(row))}">编辑</button></td></tr>`,
      )
      .join(
        "",
      )}</tbody></table>${!match.length ? '<div class="op-empty"><h3>没有符合条件的记录</h3><p>修改搜索或重置筛选后再试。</p><button class="btn-adm outline" data-clear>重置筛选</button></div>' : ""}</div><div class="op-pagination"><span>共 ${match.length} 条 · 已选 ${selectedRows.size} 条</span><label>每页<select id="opSize">${[10, 20, 50].map((n) => `<option ${n === f.size ? "selected" : ""}>${n}</option>`).join("")}</select>条</label><div><button class="btn-chip" data-page="-1" ${f.page === 1 ? "disabled" : ""}>上一页</button><span>${f.page} / ${pages}</span><button class="btn-chip" data-page="1" ${f.page === pages ? "disabled" : ""}>下一页</button></div></div></div>${picked ? renderInspector(r, picked) : ""}</div>`;
  }
  ADM.printCertificate = () => {
    const cert = D.schoolEnrollments.find(r => r.id === selected[route])?.certificate;
    if (!cert) return;
    const page = window.open("", "_blank");
    if (!page) return ADM.toast("请允许弹出证书打印窗口");
    page.document.write(`<!doctype html><meta charset="utf-8"><title>结业证书</title><style>
      @page{size:A4 landscape;margin:20mm}body{font:20px serif;text-align:center;border:double 6px #536b56;padding:4em 2em;color:#273e32}h1{letter-spacing:.35em}small{display:block;margin-top:3em}</style>
      <h1>结业证书</h1><p>${esc(cert.name)} 完成《${esc(cert.course)}》培训，考核合格，准予结业。</p>
      <p>${esc(cert.issuer)}</p><p>${esc(cert.date)}</p><small>证书编号 ${esc(cert.number)}</small>`);
    page.document.close();
    page.print();
  };
  function teachingPortfolio(id) {
    const sections = [
      ["付费课程", D.courses.filter(c => c.instructorId === id)],
      ["讲师视频", D.videos.filter(v => v.aid === id)],
      ["授课班次", D.schoolClasses.filter(c => c.instructorId === id)],
    ];
    return sections.filter(([,rows]) => rows.length).map(([title,rows]) =>
      `<section><h3>${title}</h3><ul>${rows.map(r => `<li>${esc(r.title)}</li>`).join("")}</ul></section>`
    ).join("");
  }
  function renderInspector(r, row) {
    const def = ADM.recordDefinitions[r.type],
      logs = ADM.extensions.audits
        .filter((l) => l.entityId === row.id)
        .slice(0, 6);
    return `<aside class="op-inspector"><header><div><small>${r.title}详情</small><h2>${esc(label(row))}</h2></div><button class="icon-btn" data-close-inspector aria-label="关闭详情">✕</button></header><nav><button data-inspector="summary" class="${inspectorTab === "summary" ? "on" : ""}">资料概览</button><button data-inspector="history" class="${inspectorTab === "history" ? "on" : ""}">操作记录 <span>${logs.length}</span></button></nav><div class="op-inspector-body">${
      inspectorTab === "history"
        ? logs.length
          ? logs
              .map(
                (l) =>
                  `<article class="op-history"><p>${esc(l.description)}</p><small>${new Date(l.at).toLocaleString("zh-CN")} · ${esc(l.actor)}</small></article>`,
              )
              .join("")
          : '<div class="op-empty"><p>暂无本对象的操作记录。</p></div>'
        : `<section><h3>运营维护</h3><dl>${visibleColumns(r)
            .filter((c) => !def.system.includes(c.key))
            .map(
              (c) =>
                `<div><dt>${c.title}</dt><dd>${text(c.format ? c.format(cellValue(row, c.key)) : cellValue(row, c.key))}</dd></div>`,
            )
            .join(
              "",
            )}</dl></section>${r.type === "creator" ? teachingPortfolio(row.id) : ""}<section><h3>系统记录</h3><dl><div><dt>系统编号</dt><dd>${text(row.id || "系统配置")}</dd></div>${def.system
            .filter((k) => k !== "id")
            .map(
              (k) =>
                `<div><dt>${esc({ likes: "获赞", fans: "粉丝数", read: "阅读量", learners: "学习人数", sales: "累计销量", reviews: "评价数", rating: "评分", totalIssued: "发放数量", totalUsed: "使用数量", points: "积分余额", growth: "成长值", plus: "Plus 会籍", cardNo: "会员卡号" }[k] || k)}</dt><dd>${text(typeof row[k] === "object" ? "由业务记录带出" : row[k])}</dd></div>`,
            )
            .join("")}</dl></section>`
    }</div><footer><button class="btn-adm primary" data-edit="${esc(keyOf(row))}">编辑资料</button>${r.type === "enrollment" && row.certificate ? '<button class="btn-adm outline" onclick="ADM.printCertificate()">打印结业证书</button>' : ""}${["product", "course", "store"].includes(r.type) ? `<button class="btn-adm outline" data-preview="${r.type === "product" ? "product?id=" + row.id : r.type === "course" ? "course?id=" + row.id : "store-detail?id=" + row.id}">小程序预览</button>` : ""}</footer></aside>`;
  }
  function renderFallback(r) {
    const content = document.getElementById("opContent");
    content.classList.add("op-legacy");
    content.innerHTML = ADM.views[r.fallback[0]]();
    const subnav = content.querySelector(".subnav-bar");
    if (subnav) {
      const actions = document.querySelector(".op-page-actions");
      subnav.querySelectorAll(".row.gap8 > button").forEach((b) => {
        if (!b.textContent.includes("预览")) actions.appendChild(b);
      });
      subnav.remove();
    }
    const segmented = content.querySelector(".seg-pills")?.parentElement;
    if (segmented) segmented.remove();
    content.querySelectorAll("button").forEach((b) => {
      if (b.textContent.includes("导出对账凭证")) b.remove();
    });
    // 较长的业务详情在自己的面板中滚动，页头和页脚固定。
    const first = content.firstElementChild;
    if (
      first &&
      !first.classList.contains("bento-grid") &&
      first.querySelector(".seg-pill")
    )
      first.remove();
  }
  function renderQueue(r) {
    const partner = r.queue === "partners";
    const items = partner
      ? Object.entries(XA.state.partnerApplications || {}).map(
          ([key, value]) => ({ ...value, _key: key }),
        )
      : XA.state.claim.pending;
    const pending = items.filter(
      (item) => !["approved", "rejected"].includes(item.status),
    );
    const pg = ADM.paginate(partner ? [...pending,...items.filter(i=>!pending.includes(i))] : pending, "queue_" + r.queue, 8);
    document.getElementById("opContent").innerHTML =
      `<div class="op-filterbar"><b>${pending.length} 项待审核</b><span class="op-result-count">${partner ? "申请资料由店长提交，处理结果留存" : "核对第三方订单号、实付金额与申请积分"}</span></div><div class="op-table-scroll"><table class="op-table"><thead><tr><th>${partner ? "门店 / 申请人" : "第三方订单"}</th><th>${partner ? "联系人" : "渠道"}</th><th>${partner ? "地址" : "申请积分"}</th><th>操作</th></tr></thead><tbody>${pg.items.map((item) => `<tr><td><b>${esc(partner ? item.store || item.target : item.order)}</b><small>${esc(partner ? item.type : item.title)}</small></td><td>${esc(partner ? item.contact : item.channel)}</td><td>${esc(partner ? item.address : item.points)}</td><td>${partner && ["approved","rejected"].includes(item.status) ? esc((item.status === "approved" ? "已通过" : "已退回") + " · " + item.auditNotes) : `<button class="op-edit" data-queue="${esc(item._key || item.id)}" data-pass="yes">审核通过</button> <button class="op-edit" data-queue="${esc(item._key || item.id)}" data-pass="no">退回</button>`}</td></tr>`).join("")}</tbody></table>${!items.length ? '<div class="op-empty"><h3>当前队列已处理完成</h3><p>新的申请到达后会出现在这里。</p></div>' : ""}</div><div class="op-pagination">${pg.pagerHtml}</div>`;
  }
  function renderOverview() {
    const m = ADM.metrics();
    const tasks = [
      ["orders", "待发货订单", m.toship, "核对收货信息，登记物流"],
      ["refunds", "售后申请", m.torefund, "核对退款原因与支付记录"],
      ["verify", "待到店预约", m.toverify, "查看预约并核销到店"],
      ["partners", "门店合作申请", m.topartner, "核验经营信息与联系人"],
      ["claims", "积分补登", m.toclaim, "核对第三方订单凭证"],
      ["settlement", "待结算账单", m.tosettle, "核对账期与付款记录"],
    ];
    const shortcuts = [
      ["products", "维护商品", "编辑详情、规格与库存"],
      ["campaign", "首页活动投放", "配置投放日期与跳转内容"],
      ["courses", "维护课程", "更新讲师资料与课节目录"],
      ["stores", "完善门店", "维护地址、服务与标签"],
    ];
    document.getElementById("opContent").innerHTML =
      `<div class="op-home"><section class="op-task-panel"><div class="op-section-heading"><h2>需要处理</h2><span>${m.totalPending} 项待办</span></div><div class="op-task-grid">${tasks.map(([id, title, count, desc]) => `<button data-task="${id}" class="op-task"><div><span>${title}</span><strong>${count}</strong></div><p>${desc}</p><small>进入处理 ${icon("right")}</small></button>`).join("")}</div><section class="op-shortcuts"><h2>常用操作</h2><div>${shortcuts.map(([id, title, desc]) => `<button data-nav="${id}"><b>${title}</b><span>${desc}</span>${icon("right")}</button>`).join("")}</div></section></section><aside class="op-today"><h2>近期操作</h2><p class="op-note">只展示当前浏览器保存成功的操作。</p>${
        ADM.extensions.audits
          .slice(0, 5)
          .map(
            (a) =>
              `<article class="op-history"><p>${esc(a.description)}</p><small>${new Date(a.at).toLocaleString("zh-CN")}</small></article>`,
          )
          .join("") ||
        '<div class="op-empty"><p>开始处理一项工作后，记录会出现在这里。</p></div>'
      }<div class="op-home-hint"><h3>工作视图会被记住</h3><p>各业务的搜索、筛选与分页独立保留。可将常用筛选保存为工作视图。</p></div></aside></div>`;
  }
  function openEditor(id, create = false) {
    const r = resources.get(route);
    if (!r.type) return;
    if (!canLeave()) return;
    if (!create) {
      selected[route] = id;
      renderTable(r);
    }
    ADM.editRecord(r.type, id === "singleton" ? undefined : id, create);
  }
  function configureFields() {
    const r = resources.get(route),
      type = r.type;
    fieldDraft = structuredClone(ADM.extensions.fields[type] || []);
    ADM.modal.show({
      title: r.title + " · 扩展字段",
      body: `<p class="op-note">此处配置${r.title}的业务扩展字段。字段停用后保留已有值，系统交易字段继续由业务记录生成。</p><div id="opFieldList"></div><div class="op-field-create"><h3>添加字段</h3><label>显示名称<input id="opFieldLabel" class="field-input" maxlength="30"></label><label>字段标识<input id="opFieldKey" class="field-input" placeholder="例如 erpCode" maxlength="40"></label><label>类型<select id="opFieldType" class="field-select"><option value="text">文本</option><option value="number">数字</option><option value="date">日期</option><option value="select">下拉选项</option></select></label><label>下拉选项（每行一项）<textarea id="opFieldOptions" class="field-textarea"></textarea></label><button class="btn-adm outline" type="button" data-add-field>添加到草稿</button><p id="opFieldError" role="alert"></p></div>`,
      submitText: "保存字段设置",
      onSave: () => {
        const old = ADM.extensions.fields[type];
        ADM.extensions.fields[type] = fieldDraft;
        if (!ADM.extensions.saveFields()) {
          ADM.extensions.fields[type] = old;
          return false;
        }
        ADM.extensions.record({
          module: r.title,
          description: "更新" + r.title + "扩展字段设置",
        });
        ADM.toast("字段设置已保存");
        render();
      },
    });
    renderFieldList();
  }
  function renderFieldList() {
    document.getElementById("opFieldList").innerHTML =
      fieldDraft
        .map(
          (f, i) =>
            `<div class="op-field-row"><div><b>${esc(f.label)}</b><small>${esc(f.key)} · ${esc({ text: "文本", number: "数字", date: "日期", select: "下拉选项" }[f.type] || f.type)}</small></div><label><input type="checkbox" data-field-required="${i}" ${f.required ? "checked" : ""}>必填</label><label><input type="checkbox" data-field-active="${i}" ${f.active !== false ? "checked" : ""}>启用</label></div>`,
        )
        .join("") || '<p class="op-note">暂未配置扩展字段。</p>';
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    if (b.dataset.nav) return navigate(b.dataset.nav);
    if (b.dataset.task) return navigate(b.dataset.task);
    if (b.dataset.toggleGroup) {
      groupOpen[b.dataset.toggleGroup] = !groupOpen[b.dataset.toggleGroup];
      renderRail();
      persistUI();
      return;
    }
    if (b.dataset.queue) {
      const pass = b.dataset.pass === "yes";
      return resources.get(route).queue === "partners"
        ? ADM.act.handlePartner(b.dataset.queue, pass)
        : ADM.act.approveClaim(b.dataset.queue, pass);
    }
    if (b.hasAttribute("data-command")) return ADM.openCmd();
    if (b.hasAttribute("data-new")) return openEditor(null, true);
    if (b.dataset.edit) return openEditor(b.dataset.edit);
    if (b.dataset.open) {
      if (!canLeave()) return;
      ADM.closeRecord();
      selected[route] = b.dataset.open;
      inspectorTab = "summary";
      return renderTable(resources.get(route));
    }
    if (b.hasAttribute("data-close-inspector")) {
      selected[route] = null;
      return renderTable(resources.get(route));
    }
    if (b.dataset.inspector) {
      inspectorTab = b.dataset.inspector;
      return renderTable(resources.get(route));
    }
    if (b.dataset.preview) return ADM.openPreview(b.dataset.preview);
    if (b.hasAttribute("data-clear")) {
      if (!canLeave()) return;
      filters[route] = {
        q: "",
        status: "全部",
        category: "全部",
        page: 1,
        size: 10,
        view: "全部",
      };
      renderTable(resources.get(route));
      persistUI();
      return;
    }
    if (b.hasAttribute("data-sort")) {
      state().direction =
        state().sort === b.dataset.sort && state().direction === "asc"
          ? "desc"
          : "asc";
      state().sort = b.dataset.sort;
      renderTable(resources.get(route));
      persistUI();
      return;
    }
    if (b.hasAttribute("data-columns")) {
      const resource = resources.get(route),
        current = visibleColumns(resource).map((c) => c.key);
      ADM.modal.show({
        title: "显示列 · " + resource.title,
        body: `<p class="op-note">首列固定显示。扩展字段启用后也可加入列表，各业务独立保存列设置。</p>${availableColumns(
          resource,
        )
          .map(
            (column, index) =>
              `<label class="wf-check"><input type="checkbox" data-column-key="${esc(column.key)}" ${current.includes(column.key) ? "checked" : ""} ${index === 0 ? "disabled" : ""}>${esc(column.title)}</label>`,
          )
          .join("")}`,
        submitText: "应用列设置",
        onSave: () => {
          columnPreferences[route] = [
            ...document.querySelectorAll("[data-column-key]:checked"),
          ].map((input) => input.dataset.columnKey);
          persistUI();
          renderTable(resource);
        },
      });
      return;
    }
    if (b.hasAttribute("data-fields")) {
      if (!canLeave()) return;
      return configureFields();
    }
    if (b.hasAttribute("data-page")) {
      state().page += Number(b.dataset.page);
      renderTable(resources.get(route));
      persistUI();
      return;
    }
    if (b.hasAttribute("data-clear-selection")) {
      selectedRows.clear();
      return renderTable(resources.get(route));
    }
    if (b.hasAttribute("data-view")) {
      if (!canLeave()) return;
      selectedRows.clear();
      filters[route] = {
        q: "",
        status: "全部",
        category: "全部",
        page: 1,
        size: state().size,
        view: "全部",
      };
      renderTable(resources.get(route));
      persistUI();
      return;
    }
    if (b.hasAttribute("data-view-index")) {
      if (!canLeave()) return;
      selectedRows.clear();
      const v = savedViews[route][+b.dataset.viewIndex];
      Object.assign(state(), v.filter, { view: v.name, page: 1 });
      renderTable(resources.get(route));
      persistUI();
      return;
    }
    if (b.hasAttribute("data-save-view")) {
      const snapshot = { ...state() };
      ADM.modal.show({
        title: "保存当前工作视图",
        body: '<label class="wf-field">视图名称<input id="opViewName" maxlength="24" placeholder="例如 待补库存"></label>',
        submitText: "保存视图",
        onSave: () => {
          const name = document.getElementById("opViewName").value.trim();
          if (!name || name === "全部") {
            ADM.toast("请填写视图名称");
            return false;
          }
          const views = (savedViews[route] ||= []);
          const found = views.find((v) => v.name === name);
          if (found) found.filter = snapshot;
          else views.push({ name, filter: snapshot });
          state().view = name;
          persistUI();
          renderTable(resources.get(route));
        },
      });
      return;
    }
    if (b.dataset.batch) {
      if (!canLeave()) return;
      const rows = rowsFor(resources.get(route)).filter((p) =>
          selectedRows.has(keyOf(p)),
        ),
        on = b.dataset.batch === "on";
      ADM.confirm(
        `确认${on ? "上架" : "下架"}选中的 ${rows.length} 个商品？现货库存保留。`,
        () => {
          const before = rows.map((p) => ({
            p,
            offShelf: p.offShelf,
            soldOut: p.soldOut,
          }));
          if (on && rows.some((p) => p.stock <= 0)) {
            ADM.toast("选择中有零库存商品，请先维护库存");
            return;
          }
          rows.forEach((p) => {
            p.offShelf = !on;
            p.soldOut = !on;
          });
          if (!ADM.save(`批量${on ? "上架" : "下架"} ${rows.length} 个商品`)) {
            before.forEach(({ p, offShelf, soldOut }) =>
              Object.assign(p, { offShelf, soldOut }),
            );
            return;
          }
          selectedRows.clear();
          renderTable(resources.get(route));
        },
      );
      return;
    }
    if (b.hasAttribute("data-add-field")) {
      const label = document.getElementById("opFieldLabel").value.trim(),
        key = document.getElementById("opFieldKey").value.trim(),
        type = document.getElementById("opFieldType").value;
      const error = document.getElementById("opFieldError"),
        reserved = ["__proto__", "constructor", "prototype"];
      if (
        !label ||
        !/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(key) ||
        reserved.includes(key)
      ) {
        error.textContent =
          "请填写名称和合法标识（英文字母开头，可含数字与下划线）";
        return;
      }
      if (fieldDraft.some((f) => f.key === key)) {
        error.textContent = "字段标识已存在";
        return;
      }
      const options = [
        ...new Set(
          document
            .getElementById("opFieldOptions")
            .value.split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      ];
      if (type === "select" && !options.length) {
        error.textContent = "请填写下拉选项";
        return;
      }
      fieldDraft.push({
        key,
        label,
        type,
        options,
        active: true,
        required: false,
      });
      renderFieldList();
      error.textContent = "";
      document.getElementById("opFieldLabel").value = "";
      document.getElementById("opFieldKey").value = "";
    }
  });
  document.addEventListener("change", (e) => {
    const r = resources.get(route),
      f = state(),
      input = e.target;
    if (
      input.id === "opStatus" ||
      input.id === "opCategory" ||
      input.id === "opSize"
    ) {
      if (!canLeave()) return;
      f[
        input.id === "opStatus"
          ? "status"
          : input.id === "opCategory"
            ? "category"
            : "size"
      ] = input.id === "opSize" ? Number(input.value) : input.value;
      f.page = 1;
      f.view = "自定义";
      selectedRows.clear();
      renderTable(r);
      persistUI();
    }
    if (input.dataset.rowCheck) {
      input.checked
        ? selectedRows.add(input.dataset.rowCheck)
        : selectedRows.delete(input.dataset.rowCheck);
      renderTable(r);
    }
    if (input.id === "opSelectAll") {
      const rows = filtered(r).slice((f.page - 1) * f.size, f.page * f.size);
      rows.forEach((row) =>
        input.checked
          ? selectedRows.add(keyOf(row))
          : selectedRows.delete(keyOf(row)),
      );
      renderTable(r);
    }
    if (input.hasAttribute("data-field-active"))
      fieldDraft[+input.dataset.fieldActive].active = input.checked;
    if (input.hasAttribute("data-field-required"))
      fieldDraft[+input.dataset.fieldRequired].required = input.checked;
  });
  let searchTimer;
  document.addEventListener("input", (e) => {
    if (e.target.id !== "opSearch") return;
    if (ADM.recordIsDirty()) {
      e.target.value = state().q;
      ADM.toast("请先保存或取消右侧草稿");
      return;
    }
    selectedRows.clear();
    state().q = e.target.value;
    state().page = 1;
    state().view = "自定义";
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const input = document.getElementById("opSearch"),
        position = input?.selectionStart;
      renderTable(resources.get(route));
      const next = document.getElementById("opSearch");
      next?.focus();
      if (next && position !== null)
        try {
          next.setSelectionRange(position, position);
        } catch {}
      persistUI();
    }, 180);
  });
  ADM.act.editOrderBuyer = (id) => {
    const order = XA.state.orders.find((o) => o.id === id);
    if (!order) return;
    if (order.status !== "toship")
      return ADM.toast("已进入履约的订单请联系物流处理地址变更");
    const buyer = order.buyer || {};
    ADM.modal.show({
      title: "修改收件信息 · " + esc(id),
      body: `<div class="wf-fields"><label class="wf-field">收件人<input id="buyerName" value="${esc(buyer.name)}"></label><label class="wf-field">联系电话<input id="buyerPhone" value="${esc(buyer.phone)}"></label><label class="wf-field">配送地址<textarea id="buyerAddress">${esc(buyer.address)}</textarea></label></div>`,
      submitText: "保存收件信息",
      onSave: () => {
        const name = document.getElementById("buyerName").value.trim(),
          phone = document.getElementById("buyerPhone").value.trim(),
          address = document.getElementById("buyerAddress").value.trim();
        if (!name || !phone || !address) {
          ADM.toast("请填写完整收件信息");
          return false;
        }
        const before = order.buyer;
        order.buyer = { name, phone, address };
        if (!ADM.save("修改订单 " + id + " 收件信息")) {
          order.buyer = before;
          return false;
        }
        render();
      },
    });
  };
  ADM.act.cancelOrder = (id) => {
    const order = XA.state.orders.find((o) => o.id === id);
    if (!order) return;
    if (!["toship", "shipped"].includes(order.status))
      return ADM.toast("该订单状态已结束");
    if (D.refunds.some((r) => r.orderId === id && r.status === "pending")) {
      ADM.toast("已有售后申请，请进入售后处理");
      return;
    }
    if (order.shared) return XA.changeTrade({action:"request",id,reason:"客服申请退款"});
    ADM.act.quickRefund(id);
  };
  const preview = ADM.openPreview;
  ADM.openPreview = (hash) => {
    if (!canLeave()) return;
    ADM.closeRecord();
    preview(hash);
    renderHeader(resources.get(route));
  };
  const previewClose = document.getElementById("pdCloseBtn");
  previewClose.onclick = () => {
    document.getElementById("previewDock").hidden = true;
    renderHeader(resources.get(route));
  };

  ADM.go = (group, sub) => {
    const r = [...resources.values()].find(
      (r) =>
        (r.fallback?.[0] === group && r.fallback[1] === sub) ||
        (r.type &&
          ADM.recordDefinitions[r.type].route[0] === group &&
          ADM.recordDefinitions[r.type].route[1] === sub),
    );
    if (!canLeave()) return;
    navigate(
      r?.id ||
        {
          overview: "overview",
          shop: "products",
          content: "videos",
          store: "stores",
          user: "members",
          finance: "ledger",
        }[group] ||
        route,
    );
    const current = resources.get(route);
    if (current.type && ADM.sel[current.type]) {
      selected[route] = ADM.sel[current.type];
      renderTable(current);
    }
  };
  ADM.setSub = (key, value) => {
    const group = key.replace("Sub", "");
    if (key === "ovQueue") {
      ADM.sub[key] = value;
      return render();
    }
    ADM.go(group, value);
  };
  ADM.resources = resources;
  ADM.render = render;
  document.addEventListener("admin:record-saved", (event) => {
    const r = resources.get(route);
    if (r.type === event.detail.type) selected[route] = event.detail.id;
  });
  document.addEventListener("admin:record-opened", () => {
    document.getElementById("previewDock").hidden = true;
    document.getElementById("adminShell").classList.remove("with-preview");
  });
  window.addEventListener("hashchange", () => {
    const id = location.hash.slice(2);
    if (resources.has(id) && id !== route) navigate(id);
  });
  document.body.classList.add("op-app");
  render();
})();
