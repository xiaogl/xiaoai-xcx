/* 运营维护抽屉。字段组绑定真实数据，提交前只修改独立草稿。 */
(function () {
  const D = XA.data,
    S = XA.state,
    esc = XA.esc;
  const f = (key, label, type = "text", options) => ({
    key,
    label,
    type,
    options,
  });
  const group = (label, fields) => ({ label, fields });
  const lines = (key, label) => f(key, label, "lines");
  const refs = (key, label, collection) => f(key, label, "refs", collection);
  const definitions = {
    product: {
      data: "products",
      title: "商品",
      route: ["shop", "products"],
      groups: [
        group("基本信息", [
          f("gallery","商品图片与视频","gallery"),
          f("title", "完整标题"),
          f("short", "商品简称"),
          f("code", "商家编码"),
          refs("brand", "所属品牌", "brands"),
          refs("categoryId", "商品分类", "shopCategories"),
          f("subcategory","二级分类","select",[]),

          f("curated", "晓艾精选", "bool"),
          f("offShelf", "暂不上架", "bool"),
        ]),
        group("价格设置", [
          f("price","销售价（必填）","money"),
          f("listPrice","挂牌价（选填）","optionalMoney"),
          f("strikePrice","展示划线价（选填）","optionalMoney"),
          f("member","启用会员价格","bool"),
          f("pricingMode","会员计价方式","select",["自动等级折扣","自定义会员价"]),
          ...[["memberPrice","通用会员"],["ordinaryPrice","普通会员"],["silverPrice","白银会员"],["goldPrice","黄金会员"],["diamondPrice","钻石会员"],["plusPrice","Plus 会员"]].map(([key,label]) => f(key,label,"tierPrice")),
        ]),
        group("商品详情", [
          lines("points", "商品摘要（选填）"),
          f("detail", "商品详情", "richText"),
        ]),
        group("人群与标签", [
          lines("fit", "适合体质"),
          f("tagIds","商品标签","productTags"),
          f("kw", "搜索关键词"),
        ]),
        group("规格与库存", [
          f("specs", "规格组", "specs"),
          f("skus", "组合库存", "inventory"),
        ]),
      ],
      system: ["id", "sales"],
    },
    brand: {
      data: "brands",
      title: "品牌",
      route: ["shop", "brands"],
      groups: [
        group("品牌档案", [
          f("name", "品牌名称"),
          f("mark", "品牌标记"),
          f("slogan", "品牌主张"),
          f("city", "所在地"),
          f("origin", "产地"),
          f("factory", "生产信息"),
          f("since", "创立年份", "integer"),
          f("story", "品牌介绍", "long"),
          lines("promise", "服务承诺"),
        ]),
        group("资质资料", [
          f("certs", "资质记录", "records", [
            f("name", "名称"),
            f("org", "出具机构"),
            f("at", "日期", "date"),
            f("no", "证书编号"),
          ]),
        ]),
      ],
      system: ["id", "fans", "rating"],
    },
    schoolClass: {
      data: "schoolClasses", title: "培训班", route: ["school","classes"], system: ["id"],
      groups: [group("开班资料", [f("title","班次名称"), refs("storeId","委培门店（选填）","stores"),
        refs("instructorId","授课讲师","creators"), f("start","开班日期","date"), f("syllabus","培训内容","long")])],
    },
    schoolJob: {
      data: "schoolJobs", title: "招聘岗位", route: ["store","schoolJobs"], system: ["id"],
      groups: [group("门店招聘", [f("title","岗位名称"), refs("storeId","招聘门店","stores"),
        f("requirements","任职要求","long"), f("closed","停止招聘","bool")])],
    },
    enrollment: {
      data: "schoolEnrollments", title: "学员培训记录", route: ["school","enrollments"], system: ["id"],
      groups: [group("参训资料", [f("name","学员姓名"), refs("classId","培训班","schoolClasses"),
        f("passed","考核合格","bool")]),
        group("学校结业证书", [f("issue","签发结业证书","bool"), f("issuer","发证学校名称")]),
        group("就业对接", [f("placement","就业进度","select",["暂不求职","待推荐","已推荐","面试中","已入职"]),
          refs("jobId","对接岗位","schoolJobs")])],
    },
    course: {
      data: "courses",
      title: "专栏课程",
      route: ["content", "courses"],
      groups: [
        group("课程资料", [
          f("coverMedia","课程封面","imageFile"),
          f("title", "标题"),
          f("intro", "课程简介", "long"),
          f("published", "发布课程", "bool"),
          f("price", "售价", "money"),
          lines("fit", "适合体质"),
        ]),
        group("主讲资料", [
          refs("instructorId","关联讲师账号（选填）","creators"),
          f("teacher", "主讲姓名"),
          f("teacherTitle", "专业背景"),
          f("teaching", "授课介绍", "long"),
        ]),
        group("课节目录", [
          f("lessons", "课节", "records", [
            f("t", "名称"),
            f("media","课节视频","videoFile"),
            f("m","课节时长（分钟）","derived"),
            f("trial", "免费试看", "bool"),
          ]),
        ]),
      ],
      system: ["id", "learners"],
    },
    video: {
      data: "videos",
      title: "短视频",
      route: ["content", "videos"],
      groups: [
        group("视频信息", [
          f("coverMedia","视频封面","imageFile"),
          f("title", "标题"),
          refs("aid", "作者账号", "creators"),
          f("desc", "简介", "long"),
          f("media", "视频文件", "videoFile"),
          f("duration", "视频时长", "derived"),
          refs("product", "主推商品", "products"),
        ]),
        group("挂载资源", [
          f("binds", "挂载项", "records", [
            f("type", "资源类型", "select", ["product", "course", "store"]),
            f("id", "挂载内容", "binding"),
          ]),
        ]),
      ],
      system: ["id", "likes", "comments", "shares"],
    },
    article: {
      data: "articles",
      title: "养生图文",
      route: ["content", "articles"],
      groups: [
        group("文章", [
          f("coverMedia","文章封面","imageFile"),
          f("title", "标题"),
          f("author", "作者"),
          f("summary", "摘要", "long"),
          f("body", "正文", "richText"),
        ]),
      ],
      system: ["id", "views"],
    },
    note: {
      data: "notes",
      title: "社区笔记",
      route: ["content", "notes"],
      groups: [
        group("笔记", [
          f("coverMedia","笔记封面","imageFile"),
          f("title", "标题"),
          refs("aid", "作者账号", "creators"),
          refs("topic", "社区话题", "topics"),
          f("body", "正文", "richText"),
          refs("product", "关联商品", "products"),
          refs("store", "关联门店", "stores"),

        ]),
      ],
      system: ["id", "likes", "comments", "source"],
    },
    creator: {
      data: "creators",
      title: "创作者",
      route: ["content", "creators"],
      groups: [
        group("账号档案", [
          f("coverMedia","账号头像","imageFile"),
          f("name", "昵称"),
          f("bio", "简介", "long"),
          f("badge", "身份标识"),
          f("kind", "账号类型"),
          f("contact", "联系信息"),
        ]),
      ],
      system: ["id", "fans", "follows"],
    },
    store: {
      data: "stores",
      title: "门店",
      route: ["store", "stores"],
      groups: [
        group("基本档案", [
          f("coverMedia","门店首图","imageFile"),
          f("name", "门店名称"),
          f("city", "城市"),
          f("district", "行政区"),
          f("area", "商圈"),
          f("address", "详细地址"),
          f("phone", "联系电话"),
          f("hours", "营业时间"),
          f("metro", "附近地铁站"),
          f("brand", "门店品牌", "select", ["xaj", "yq", "biz"]),
        ]),
        group("接入与服务", [
          f("linked", "已接入", "bool"),
          f("rec", "推荐", "bool"),
          f("soon", "开业说明"),
          f("services", "可预约服务", "multiRef", "services"),
          f("staff", "服务技师", "multiRef", "staff"),
          lines("tags", "门店标签"),
          lines("groupon", "支持团购渠道"),
        ]),
      ],
      system: ["id", "rating", "reviews", "km", "src"],
    },
    service: {
      data: "services",
      title: "到店服务",
      route: ["store", "services"],
      groups: [
        group("服务内容", [
          f("name", "项目名称"),
          f("desc", "介绍", "long"),
          f("price", "原价", "money"),
          f("mprice", "会籍价", "money"),
          f("dur", "服务时长（分钟）", "positive"),
          f("deposit", "预约定金", "money"),
          lines("fit", "适合体质"),
          lines("points", "服务特点"),
        ]),
      ],
      system: ["id"],
    },
    activity: {
      data: "activities",
      title: "门店活动",
      route: ["store", "activities"],
      groups: [
        group("活动设置", [
          f("coverMedia","活动封面","imageFile"),
          f("title", "活动名称"),
          refs("store", "举办门店", "stores"),
          f("date", "举办日期", "date"),
          f("time", "开始时间"),
          f("quota", "活动名额", "integer"),
          f("memberOnly", "仅限会员", "bool"),
          f("intro", "活动说明", "long"),
        ]),
      ],
      system: ["id", "left"],
    },
    member: {
      data: "members",
      title: "会员档案",
      route: ["user", "members"],
      groups: [
        group("联系档案", [
          f("name", "会员姓名"),
          f("phone", "手机号"),
          f("birthday", "生日", "date"),
          f("note", "服务备注", "long"),
        ]),
      ],
      system: [
        "id",
        "cardNo",
        "points",
        "growth",
        "plus",
        "balance",
        "totalSpent",
      ],
    },
  };
  definitions.coupon = {
    data: "couponTemplates",
    title: "优惠券模板",
    route: ["user", "coupons"],
    groups: [
      group("发放规则", [
        f("name", "券名称"),
        f("scope", "适用范围", "select", ["goods", "store"]),
        f("amount", "减免金额", "money"),
        f("min", "使用门槛", "money"),
        f("validityDays", "领取后有效天数", "positive"),
        f("enabled", "启用模板", "bool"),
      ]),
    ],
    system: ["id", "totalIssued", "totalUsed"],
  };
  definitions.category = {
    data: "shopCategories",
    title: "商品分类",
    route: ["shop", "categories"],
    groups: [
      group("分类设置", [
        f("name", "一级分类名称"),
        lines("sub", "二级分类（每行一项）"),
        f("sort", "排序", "integer"),
        f("enabled", "启用分类", "bool"),
      ]),
    ],
    system: ["id"],
  };
  for (const type of ["article","note"]) {
    definitions[type].groups[0].fields.push(refs("categoryId","内容分类","contentCategories"),f("tagIds","内容标签","multiRef","contentTags"));
  }
  for (const [type,title,groupId] of [["shopTags","商品标签","shop"],["contentTags","内容标签","content"],["contentCategories","内容分类","content"]]) {
    definitions[type] = {data:type,title,route:[groupId,type],groups:[group("基本信息",[
      f("name","名称"),f("sort","排序","integer"),f("enabled","启用","bool")
    ])],system:["id"]};
  }
  definitions.campaign = {
    data: "_campaign",
    title: "首页活动",
    route: ["overview", "campaign"],
    groups: [
      group("投放内容", [
        f("title", "活动标题"),
        f("route", "站内目标", "select", [
          "catalog",
          "store",
          "test",
          "home",
          "course?id=c1",
        ]),
        f("bannerMedia", "活动图片", "imageFile"),
        f("heightPercent", "内容区高度（15–100%）", "positive"),
      ]),
      group("有效期", [
        f("enabled", "启用活动", "bool"),
        f("start", "开始日期", "date"),
        f("end", "结束日期", "date"),
      ]),
    ],
    system: [],
  };
  definitions.notice = {
    data: "_notice",
    title: "强公告",
    route: ["overview", "notice"],
    groups: [
      group("公告内容", [
        f("title", "公告标题"),
        f("route", "站内目标", "select", ["catalog", "store", "test", "home"]),
        f("enabled", "启用公告", "bool"),
        f("start", "开始日期", "date"),
        f("end", "结束日期", "date"),
      ]),
    ],
    system: [],
  };
  Object.defineProperty(D,"_campaign",{get: () => [D.homeResources.campaign]});
  Object.defineProperty(D,"_notice",{get: () => [D.homeResources.notice]});
  definitions.plus = {
    data: "_plus",
    title: "Plus 方案",
    route: ["user", "plus"],
    groups: [
      group("会员方案", [
        f("price", "年费", "money"),
        f("days", "有效天数", "positive"),
      ]),
      group("权益说明", [
        f("perks", "权益文案", "records", [
          f("t", "名称"),
          f("d", "说明"),
          f("ic", "图标名称"),
        ]),
      ]),
    ],
    system: [],
  };
  Object.defineProperty(D,"_plus",{get: () => [D.plus]});
  let session, lastFocus;
  const shell = document.createElement("aside");
  shell.id = "recordDrawer";
  shell.hidden = true;
  shell.setAttribute("aria-label", "业务资料维护");
  shell.setAttribute("role", "dialog");
  shell.setAttribute("aria-modal", "true");
  document.getElementById("adminShell").appendChild(shell);
  const dataList = (def) =>
    Array.isArray(D[def.data]) ? D[def.data] : Object.values(D[def.data]);
  const valueAt = (o, key) =>
    key.split(".").reduce((value, part) => value?.[part], o);
  function productTagOptions(query = "") {
    const selected = session.draft.tagIds || [];
    return D.shopTags.filter(t => t.enabled && !selected.includes(t.id) && t.name.includes(query.trim()))
      .sort((a,b) => a.sort - b.sort).slice(0,12)
      .map(t => `<button type="button" class="btn-adm outline sm" data-pick-tag="${esc(t.id)}">${esc(t.name)}</button>`).join(" ");
  }
  function productTagControl() {
    const terms = [...D.shopTags,...session.newTags];
    const selected = (session.draft.tagIds || []).map(id => terms.find(t => t.id === id)).filter(Boolean);
    return `<legend>商品标签</legend><div class="wf-tags-selected">${selected.map(t =>
      `<button type="button" class="btn-adm tonal sm" data-remove-tag="${esc(t.id)}" aria-label="移除${esc(t.name)}">${esc(t.name)} ×</button>`).join(" ")}</div>
      <label class="wf-field"><span>输入标签，回车选用或新建</span><input data-tag-entry maxlength="60" autocomplete="off"></label>
      <small>常用标签</small><div data-tag-options>${productTagOptions()}</div><small data-tag-message role="status"></small>`;
  }
  function changeProductTag(id,remove) {
    const ids = session.draft.tagIds || [];
    session.draft.tagIds = remove ? ids.filter(t => t !== id) : [...new Set([...ids,id])];
    session.dirty = true;
    shell.querySelector("[data-product-tags]").innerHTML = productTagControl();
    shell.querySelector("[data-tag-entry]").focus();
    shell.querySelector(".wf-footer span").textContent = "有未保存的修改";
  }
  const galleryOf = row => row.gallery?.some(a => a?.key) ? row.gallery.filter(a => a?.key) : (row.coverMedia ? [row.coverMedia] : []);
  class DetailPicture extends Quill.import("blots/block/embed") {
    static blotName = "detailPicture";
    static tagName = "figure";
    static className = "xa-detail-picture";
    static create(asset) {
      const node = super.create();
      node.dataset.asset = JSON.stringify(asset);
      node.innerHTML = XA.mediaPreview(asset);
      return node;
    }
    static value(node) { return JSON.parse(node.dataset.asset); }
  }
  Quill.register(DetailPicture);
  function readField(field, value, path) {
    const common = `data-path="${esc(path)}" data-type="${field.type}"`;
    if (field.type === "tierPrice") {
      const draft=session.draft;
      if (!draft.member || draft.pricingMode !== "自定义会员价") return "";
      const mode=draft[path+"Mode"] || (value!=null ? "fixed" : draft[path+"Discount"]!=null ? "discount" : "inherit");
      const inputKey=mode==="discount" ? path+"Discount" : path;
      const options=[["inherit",path==="memberPrice" ? "沿用销售价" : "继承"],["fixed","固定价"],["discount","按折数"]];
      return `<div class="wf-price-rule"><label class="wf-field"><span>${esc(field.label)}</span><select data-price-mode="${esc(path)}">${options.map(([key,label])=>`<option value="${key}" ${mode===key ? "selected" : ""}>${label}</option>`).join("")}</select></label>${mode==="inherit" ? "" : readField(f(inputKey,mode==="fixed"?"金额（元）":"折数（如 8.5）","optionalMoney"),draft[inputKey],inputKey)}</div>`;
    }
    if (session.type === "enrollment" && session.original?.certificate && ["name","classId","passed","issue","issuer"].includes(path)) {
      const display = path === "classId" ? session.original.certificate.course : typeof value === "boolean" ? "是" : value;
      return `<label class="wf-field"><span>${field.label}</span><output>${esc(display)}</output></label>`;
    }
    if (field.type === "derived" || (path === "teacher" && session.draft.instructorId)) {
      const display = path === "teacher" ? D.creators.find(c=>c.id===session.draft.instructorId)?.name : value;
      return `<label class="wf-field"><span>${field.label}</span><output>${esc(display ?? "选择文件后自动读取")}</output></label>`;
    }
    if (field.type === "videoFile" || field.type === "imageFile") {
      const kind = field.type === "videoFile" ? "video" : "image";
      return `<div class="wf-field"><label>${field.label}<input type="file" data-media-path="${esc(path)}" data-kind="${kind}" accept="${kind}/*"></label>
        <small>本机素材 · 仅当前浏览器可预览</small>${value ? `<div style="height:130px">${XA.mediaPreview(value)}</div><small>${esc(value.name)} · ${value.width} × ${value.height} · ${Math.ceil(value.size/1024)} KB</small>` : ""}</div>`;
    }
    if (field.type === "gallery") {
      const items = galleryOf(session.draft);
      return `<div class="wf-rich"><label>商品图库 · 首项为主图<input type="file" multiple data-gallery accept="image/*,video/*"></label><div class="wf-gallery">${items.map((asset,i)=>`<div><div class="wf-thumb">${XA.mediaPreview(asset)}</div><span>${esc(asset.name)}</span><div><button type="button" data-gallery-index="${i}" value="-1" ${i===0?"disabled":""}>前移</button><button type="button" data-gallery-index="${i}" value="1" ${i+1===items.length?"disabled":""}>后移</button><button type="button" data-gallery-index="${i}" value="remove">移除</button></div></div>`).join("")}</div><output data-upload-state></output></div>`;
    }
    if (field.type === "richText") return `<div class="wf-rich"><span>${esc(field.label)}</span><div data-editor="${esc(path)}"></div></div>`;
    if (field.type === "productTags") return `<fieldset class="wf-repeat" data-product-tags>${productTagControl()}</fieldset>`;
    if (field.type === "multiRef") {
      const choices = D[field.options].filter(r => r.id !== "any" && (field.key !== "tagIds" || r.enabled || value?.includes(r.id))).sort((a,b) => (a.sort || 0) - (b.sort || 0));
      return `<fieldset class="wf-repeat"><legend>${field.label}</legend>${choices.map(r => `<label class="wf-check"><input type="checkbox" ${common} value="${esc(r.id)}" ${value?.includes(r.id) ? "checked" : ""}>${esc(r.name)}</label>`).join("")}</fieldset>`;
    }
    if (field.type === "binding") {
      const row = getPath(session.draft,path.slice(0,path.lastIndexOf(".")));
      const collection = {course:"courses",product:"products",store:"services",service:"services"}[row.type];
      return collection ? readField(refs("id","挂载内容",collection),value,path) : '<small>先选择资源类型</small>';
    }
    if (field.type === "inventory") {
      const draft = session.draft;
      let combinations = [{ key: "", label: [], delta: 0 }];
      for (const spec of draft.specs || [])
        combinations = combinations.flatMap((row) =>
          (spec.options || []).map((o, i) => ({
            key: row.key + (row.key ? "_" : "") + i,
            label: [...row.label, o.t],
            delta: row.delta + Number(o.d || 0),
          })),
        );
      if (!combinations.length)
        combinations = [{ key: "default", label: ["标准规格"], delta: 0 }];
      const old = draft.skus || [];
      const total = draft.stock || 0;
      draft.skus = combinations.map((row, i) => ({
        key: row.key || "default",
        label: row.label.join(" / ") || "标准规格",
        stock:
          old.find((s) => s.key === (row.key || "default"))?.stock ??
          Math.floor(total / combinations.length) +
            (i < total % combinations.length ? 1 : 0),
        delta: row.delta,
      }));
      return `<fieldset class="wf-repeat"><legend>规格组合 · 固定价加规格差价，等级折扣按规格销售价计算</legend>${draft.skus.map((sku, i) => `<div class="wf-inventory"><span>${esc(sku.label)}<small>¥${XA.money(draft.price + sku.delta)}</small></span>${readField(f("stock", "可售库存", "integer"), sku.stock, "skus." + i + ".stock")}</div>`).join("")}</fieldset>`;
    }
    if (field.type === "bool")
      return `<label class="wf-check"><input type="checkbox" ${common} ${value ? "checked" : ""}>${field.label}</label>`;
    if (field.type === "records" || field.type === "specs") {
      const rows = value || [];
      const children =
        field.type === "specs"
          ? [
              f("name", "规格名称"),
              f("options", "选项", "records", [
                f("t", "选项名称"),
                f("d", "差价", "number"),
              ]),
            ]
          : field.options;
      return `<fieldset class="wf-repeat"><legend>${field.label}</legend>${rows.map((row, i) => `<div class="wf-repeat-row"><div class="wf-fields">${children.map((c) => readField(c, row[c.key], path + "." + i + "." + c.key)).join("")}</div><button type="button" class="btn-adm outline sm" data-remove="${path}" data-index="${i}">移除</button></div>`).join("")}<button type="button" class="btn-adm tonal sm" data-add="${path}">添加${field.type === "specs" ? "规格组" : "一项"}</button></fieldset>`;
    }
    let control;
    if (field.type === "refs" || field.type === "select") {
      let choices = path === "subcategory" ? (D.shopCategories.find(c=>c.id===session.draft.categoryId)?.sub || []) : field.options;
      if (field.type === "refs")
        choices = (
          Array.isArray(D[choices])
            ? D[choices]
            : Object.values(D[choices] || {})
        ).filter(i => path !== "categoryId" || i.enabled || i.id === value).sort((a,b) => (a.sort || 0) - (b.sort || 0)).map((i) => [
          field.key === "category" ? i.name : i.id,
          i.name || i.title || i.short,
        ]);
      else {
        const labels = {product:"商品",course:"付费课程",store:"到店服务",goods:"商品",catalog:"商品目录",test:"体质自测",home:"首页","course?id=c1":"课程详情",biz:"合作门店",xaj:"晓艾家",yq:"元气地带"};
        choices = choices.map(v => [v,field.key === "route" && v === "store" ? "门店列表" : labels[v] || v]);
      }
      if (value && !choices.some(([v]) => v === value))
        choices.unshift([value, value + "（现有值）"]);
      control = `<select ${common}><option value="">请选择</option>${choices.map(([v, t]) => `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
    } else if (["long", "lines"].includes(field.type)) {
      control = `<textarea ${common} rows="4">${esc(field.type === "lines" ? (value || []).map((v) => (typeof v === "string" ? v : JSON.stringify(v))).join("\n") : value || "")}</textarea>`;
    } else
      control = `<input ${common} type="${["optionalMoney", "money", "integer", "positive", "number"].includes(field.type) ? "number" : field.type === "date" ? "date" : "text"}" step="${field.type === "integer" || field.type === "positive" ? "1" : "0.01"}" value="${esc(value)}">`;
    return `<label class="wf-field"><span>${field.label}</span>${control}</label>`;
  }
  const editorial = type => type === "article" || type === "note";
  const taxonomyTypes = ["category","shopTags","contentTags","contentCategories"];
  function termUses(type,id) {
    const rows = ["category","shopTags"].includes(type) ? D.products : [...D.articles,...D.notes];
    const linked = r => r && (r.categoryId === id || r.tagIds?.includes(id));
    return rows.filter(r => linked(r) || linked(r.workingCopy)).length;
  }
  function paint() {
    const { def, draft, section } = session;
    const groups = def.groups;
    shell.innerHTML = `<header class="wf-head"><div><span class="tiny muted">${session.create ? "新增" : "维护"}${def.title} · 独立草稿</span><h2>${esc(draft.name || draft.title || draft.short || def.title)}</h2></div><button class="icon-btn" data-close aria-label="关闭资料面板">✕</button></header>
      ${
        !session.create && dataList(def).length > 1
          ? `<div class="wf-record-picker"><label>当前${def.title}<select id="wfRecordPicker">${dataList(
              def,
            )
              .map(
                (v) =>
                  `<option value="${esc(v.id || v.name)}" ${(v.id || v.name) === (draft.id || draft.name) ? "selected" : ""}>${esc(v.short || v.title || v.name)}</option>`,
              )
              .join("")}</select></label></div>`
          : ""
      }
      <nav class="wf-tabs">${groups.map((g, i) => `<button data-section="${i}" class="${i === section ? "on" : ""}">${g.label}</button>`).join("")}<button data-section="${groups.length}" class="${section === groups.length ? "on" : ""}">系统信息</button></nav>
      <form id="recordForm" class="wf-body">${section < groups.length ? `<p class="wf-hint">运营维护 · 保存后更新资料与同屏预览</p><div class="wf-fields">${groups[section].fields.map((field) => readField(field, valueAt(draft, field.key), field.key)).join("")}</div>` : `<p class="wf-hint">系统编号、用户行为与交易记录带出，随业务操作更新。</p><dl class="wf-facts">${def.system.map((k) => `<div><dt>${esc({ id: "系统编号", sales: "历史销量", km: "设备位置估算距离", rating: "用户评分", reviews: "评价数", learners: "学习人数", points: "积分余额", growth: "成长值", plus: "Plus 会籍", cardNo: "会员卡号", src: "收录来源", followers: "粉丝数", likes: "获赞", views: "阅读量", totalSpent: "累计消费", balance: "储值余额" }[k] || k)}</dt><dd>${esc(typeof draft[k] === "object" ? JSON.stringify(draft[k]) : (draft[k] ?? "暂无记录"))}</dd></div>`).join("")}</dl>`}</form>
      <div id="recordError" role="alert"></div><div class="wf-footer"><span class="tiny muted">${session.dirty ? "有未保存的修改" : "资料已载入"}</span>${!session.create && taxonomyTypes.includes(session.type) ? `<button class="btn-adm outline" data-delete-term>删除（引用 ${termUses(session.type,draft.id)}）</button>` : ""}${editorial(session.type) && session.original && session.original.published !== false ? '<button class="btn-adm outline" data-withdraw>撤下内容</button>' : ''}<button class="btn-adm outline" data-close>取消</button>${editorial(session.type) ? '<button class="btn-adm tonal" data-save data-draft>保存草稿</button><button class="btn-adm primary" data-save>发布内容</button>' : '<button class="btn-adm primary" data-save>保存资料</button>'}</div>`;
    for (const node of shell.querySelectorAll("[data-editor]")) {
      const key = node.dataset.editor;
      const editor = new Quill(node, {
        theme: "snow",
        formats: ["bold", "italic", "underline", "header", "blockquote", "list", ...(key === "detail" ? ["detailPicture"] : [])],
        modules: { toolbar: [[{header: [2, 3, false]}], ["bold", "italic", "underline"], ["blockquote", {list: "ordered"}, {list: "bullet"}], ["clean"]] },
      });
      const toolbar = editor.getModule("toolbar").container;
      if (key === "detail") {
        const label = document.createElement("label");
        label.className = "wf-detail-upload";
        label.innerHTML = '插入详情长图<input type="file" multiple accept="image/*"><output data-upload-state></output>';
        toolbar.after(label);
        let insertion;
        label.onpointerdown = () => { insertion = editor.getSelection()?.index ?? editor.getLength()-1; };
        label.querySelector("input").onchange = event => uploadBatch(event.target, true, images => {
          let index = Math.min(insertion ?? editor.getLength()-1,editor.getLength()-1);
          for (const asset of images) editor.insertEmbed(index++,"detailPicture",asset,"user");
          editor.setSelection(index,0);
        });
      }
      const labels = {bold: "加粗", italic: "斜体", underline: "下划线", blockquote: "引用", ordered: "编号列表", bullet: "项目列表", clean: "清除格式"};
      toolbar.querySelectorAll("button").forEach(button => {
        const action = button.value || button.className.replace("ql-", "");
        if (labels[action]) {
          button.title = labels[action];
          button.setAttribute("aria-label", labels[action]);
        }
      });
      editor.root.setAttribute("aria-label", key === "detail" ? "商品详情" : "正文");
      if (draft[key + "Delta"]?.ops) editor.setContents(draft[key + "Delta"]);
      else editor.setText((draft[key] || []).join("\n"));
      editor.on("text-change", () => {
        draft[key + "Delta"] = {ops: editor.getContents().ops};
        draft[key] = editor.getText().trimEnd().split("\n");
        session.dirty = true;
        shell.querySelector(".wf-footer span").textContent = "有未保存的修改";
      });
    }
  }
  function setPath(obj, path, value) {
    const bits = path.split(".");
    const key = bits.pop();
    const parent = bits.reduce((v, k) => v[k], obj);
    parent[key] = value;
  }
  function getPath(obj, path) {
    return path.split(".").reduce((v, k) => v?.[k], obj);
  }
  ADM.editRecord = (type, id, create = false) => {
    if (session?.dirty) {
      shell.querySelector("#recordError").textContent =
        "请先保存或取消当前草稿";
      return;
    }
    const def = definitions[type];
    if (def && ADM.extensions) {
      def.groups = def.groups.filter((group) => !group.custom);
      const custom = ADM.extensions.forType(type);
      if (custom.length)
        def.groups.push({
          label: "业务扩展",
          custom: true,
          fields: custom.map((field) => ({
            ...field,
            key: "meta." + field.key,
          })),
        });
    }
    if (!def) return;
    const original =
      dataList(def).find((v) => v.id === id || v.name === id) ||
      (!create && dataList(def).length === 1 ? dataList(def)[0] : null);
    if (!original && !create) return ADM.toast("未找到业务资料");
    const draft = structuredClone(
      original?.workingCopy || original || {
        id: XA.uid(type),
        art: ["leaf", "sage"],
        gallery: type === "product" ? [] : [["room", "sage"]],
        tags: [],
        staff: [],
        services: [],
        groupon: [],
        rating: 0,
        reviews: 0,
        price: 0,
        stock: 0,
        specs: [],
        points: [],
        detail: [],
        fit: [],
        lessons: [],
        body: [],
        certs: [],
        binds: [],
        linked: false,
        brand: "biz",
      },
    );
    if (type === "product") draft.pricingMode ||= "自动等级折扣";
    if (editorial(type)) {
      delete draft.workingCopy;
      if (type === "article") draft.read ??= 0;
      if (type === "note") {
        draft.likes ??= 0;
        draft.imgs ||= [draft.art];
      }
    }
    if (create && ["category","shopTags","contentCategories","contentTags"].includes(type)) Object.assign(draft,{enabled:true,sort:dataList(def).length+1});
    if (type === "activity") draft.date ||= XA.d.key(XA.d.add(draft.day || 0));
    if (type === "video" && create) Object.assign(draft,{likes:0,comments:0,shares:0});
    if (type === "product" && create) Object.assign(draft,{offShelf:true,brand:"",sales:0});
    if (type === "course") {
      draft.published ??= !create;
      draft.learners ??= 0;
    }
    draft.meta ||= {};
    lastFocus = document.activeElement;
    session = { type, def, original, draft, create, section: 0, dirty: false, newTags: [] };
    shell.hidden = false;
    for (const node of shell.parentElement.children) if (node !== shell) node.inert = true;
    document.getElementById("adminShell").classList.add("has-record-drawer");
    document.dispatchEvent(new CustomEvent("admin:record-opened"));
    paint();
    shell.querySelector("[data-close]").focus();
  };
  function close() {
    shell.hidden = true;
    for (const node of shell.parentElement.children) if (node !== shell) node.inert = false;
    session = null;
    document.dispatchEvent(new CustomEvent("admin:record-closed"));
    document.getElementById("adminShell").classList.remove("has-record-drawer");
    lastFocus?.focus();
  }
  shell.addEventListener("submit", (event) => event.preventDefault());
  async function uploadBatch(input, imagesOnly, apply) {
    const current = session, files = Array.from(input.files);
    if (!files.length || current.uploading) return;
    const status = input.closest("label").parentElement.querySelector("[data-upload-state]");
    current.uploading = true;
    const locks = shell.querySelectorAll("[data-save],[data-section],#wfRecordPicker");
    locks.forEach(el => el.disabled = true);
    try {
      const assets = [];
      for (const file of files) {
        if (current !== session) return;
        if (imagesOnly && !file.type.startsWith("image/")) throw Error("请选择图片");
        status.textContent = `正在上传 ${assets.length+1}/${files.length} · ${file.name}`;
        assets.push(await XA.importSharedMedia(file));
      }
      if (current === session) { apply(assets); current.dirty = true; status.textContent = "上传完成"; }
    } catch (error) { if (current === session) shell.querySelector("#recordError").textContent = error.message || "上传失败"; }
    finally { current.uploading = false; input.value = ""; locks.forEach(el => el.disabled = false); }
  }
  shell.addEventListener("change", event => {
    if (!event.target.matches("[data-gallery]")) return;
    uploadBatch(event.target,false,assets=>{
      session.draft.gallery = [...galleryOf(session.draft),...assets];
      session.draft.coverMedia = session.draft.gallery[0];
      session.dirty = true;
      paint();
    });
  });
  shell.addEventListener("change", async event => {
    const input = event.target, path = input.dataset.mediaPath, file = input.files?.[0];
    if (!path || !file) return;
    const current = session;
    shell.inert = true;
    try {
      const media = await XA.importMedia(file,input.dataset.kind);
      if (session !== current) return;
      setPath(current.draft,path,media);
      if (media.kind === "video") {
        const seconds = Math.max(1,Math.round(media.seconds));
        if (path === "media") current.draft.duration = Math.floor(seconds/60) + ":" + String(seconds%60).padStart(2,"0");
        else setPath(current.draft,path.replace(/media$/, "m"),Math.ceil(media.seconds/60));
      }
      current.dirty = true;
      paint();
    } catch (error) {
      shell.querySelector("#recordError").textContent = error.message || "素材读取失败，请重新选择";
      input.value = "";
    } finally { shell.inert = false; }
  });
  shell.addEventListener("keydown", event => {
    if (!event.target.matches("[data-tag-entry]") || event.key !== "Enter" || event.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    const name = event.target.value.trim();
    if (!name) return;
    let tag = [...D.shopTags,...session.newTags].find(t => t.name === name);
    if (tag && !tag.enabled) {
      shell.querySelector("[data-tag-message]").textContent = "此标签已停用，可在商品标签管理中重新启用";
      return;
    }
    if (!tag) {
      tag = {id:"term-" + crypto.randomUUID(),name,enabled:true,sort:D.shopTags.length + session.newTags.length + 1};
      session.newTags.push(tag);
    }
    changeProductTag(tag.id,false);
  });
  shell.addEventListener("input", (e) => {
    if (e.target.matches("[data-tag-entry]")) {
      shell.querySelector("[data-tag-options]").innerHTML = productTagOptions(e.target.value);
      shell.querySelector("[data-tag-message]").textContent = "";
      return;
    }
    if (e.target.dataset.priceMode) {
      const key=e.target.dataset.priceMode;
      session.draft[key+"Mode"]=e.target.value;
      delete session.draft[key];
      delete session.draft[key+"Discount"];
      session.dirty=true; paint();
      return;
    }
    if (e.target.id === "wfRecordPicker") {
      if (session.dirty) {
        e.target.value = session.draft.id || session.draft.name;
        shell.querySelector("#recordError").textContent =
          "请先保存或取消当前修改";
        return;
      }
      ADM.editRecord(session.type, e.target.value);
      return;
    }
    if (!e.target.dataset.path) return;
    const { path, type } = e.target.dataset;
    let value = e.target.value;
    if (type === "multiRef") {
      const previous = getPath(session.draft,path) || [];
      value = e.target.checked ? [...new Set([...previous,value])] : previous.filter(id=>id!==value);
    }
    if (type === "bool") value = e.target.checked;
    if (type === "lines")
      value = value
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);
    if (["optionalMoney","money", "integer", "positive", "number"].includes(type))
      value = value === "" ? null : Number(value);
    setPath(session.draft, path, value);
    if (session.type === "product" && ["pricingMode","member"].includes(path)) { session.dirty=true; paint(); }
    if (path === "categoryId" && session.type === "product") { session.draft.subcategory = ""; session.dirty = true; paint(); }
    if (/^binds\.\d+\.type$/.test(path)) {
      setPath(session.draft,path.replace(/type$/,"id"),"");
      paint();
    }
    if (path === "instructorId" && session.type === "course") paint();
    session.dirty = true;
    shell.querySelector(".wf-footer span").textContent = "有未保存的修改";
  });
  function validate() {
    const { draft, def } = session;
    for (const field of ADM.extensions?.forType(session.type) || []) {
      const value = draft.meta?.[field.key];
      if (
        field.required &&
        (value === undefined || value === null || value === "")
      )
        return "请填写" + field.label;
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        field.type === "number" &&
        !Number.isFinite(value)
      )
        return field.label + "应为有效数字";
    }
    for (const g of def.groups)
      for (const field of g.fields) {
        if (g.custom) continue;
        const value = draft[field.key];
        if (
          ["money", "integer", "positive", "number"].includes(field.type) &&
          (value == null ||
            !Number.isFinite(value) ||
            (field.type !== "number" && value < 0) ||
            (["integer", "positive"].includes(field.type) &&
              !Number.isInteger(value)) ||
            (field.type === "positive" && value === 0))
        )
          return field.label + "必须填写有效数值";
      }
    if (["campaign", "notice"].includes(session.type)) {
      if (
        draft.enabled &&
        (!draft.start || !draft.end || draft.end < draft.start)
      )
        return "启用前请设置完整且正确的有效期";
      if (
        session.type === "campaign" &&
        (draft.heightPercent < 15 || draft.heightPercent > 100)
      )
        return "活动高度须在 15–100% 之间";
      if (
        draft.image &&
        (/^[a-z]+:/i.test(draft.image) || draft.image.startsWith("//"))
      )
        return "请使用站内图片路径";
    }
    if (session.type !== "plus" && !(draft.title || draft.name || "").trim())
      return "请填写名称或标题";
    if (["category","shopTags","contentTags","contentCategories"].includes(session.type)) {
      draft.name = draft.name.trim();
      if (session.type === "category") {
        const children = draft.sub || [];
        if (new Set(children).size !== children.length) return "二级分类不能重名";
        if (D.products.some(p => p.categoryId === draft.id && p.subcategory && !children.includes(p.subcategory)))
          return "要移除或更名的二级分类仍有关联商品，请先调整商品分类";
      }
      if (dataList(def).some(t => t.id !== draft.id && t.name === draft.name)) return "同名分类或标签已存在";
    }
    if (session.type === "schoolClass" && (!draft.instructorId || !draft.start)) return "请选择授课讲师和开班日期";
    if (session.type === "schoolJob" && !draft.storeId) return "请选择招聘门店";
    if (session.type === "enrollment") {
      if (!D.schoolClasses.some(c => c.id === draft.classId)) return "请选择培训班";
      if (draft.issue && (!draft.passed || !draft.issuer?.trim())) return "签发证书前请确认考核合格并填写发证学校名称";
      const old = session.original;
      if (old?.certificate && (!draft.issue || draft.name !== old.name || draft.classId !== old.classId || draft.issuer !== old.issuer))
        return "已签发证书的学员、班次和发证学校已锁定";
      const job = D.schoolJobs.find(j => j.id === draft.jobId);
      if (["已推荐","面试中","已入职"].includes(draft.placement) && !job) return "请选择对接岗位";
      if (job?.closed && draft.jobId !== old?.jobId) return "该岗位已停止招聘";
    }
    if (session.type === "video" && session.create && !draft.media) return "请选择视频文件";
    if (session.type === "video" && draft.binds?.some(b => !b.type || !b.id)) return "请选择完整的挂载内容";
    if (session.type === "activity" && !draft.date) return "请选择举办日期";
    if (session.type === "coupon" && draft.amount > draft.min && draft.min > 0)
      return "券减免金额不能大于使用门槛";
    if (session.type === "product") {
      readField(f("skus","组合库存","inventory"),draft.skus,"skus");
      if (!draft.offShelf && (!draft.code?.trim() || !D.shopCategories.some(c => c.enabled && c.id === draft.categoryId)))
        return "上架前请填写商品编码并选择启用的分类";
      if (draft.code && D.products.some(p => p.id !== draft.id && p.code === draft.code))
        return "商品编码已被使用";
      if (!draft.offShelf && (session.create || session.original?.offShelf) && !draft.skus.some(s => s.stock > 0))
        return "上架前请填写可售库存";
      if (!draft.short?.trim() || !D.brands[draft.brand])
        return "请填写简称并选择品牌";
      if (draft.member && draft.pricingMode === "自定义会员价") {
        for (const field of definitions.product.groups.flatMap(g=>g.fields).filter(f=>f.type==="tierPrice")) {
          const mode=draft[field.key+"Mode"];
          if ((mode==="fixed" && draft[field.key]==null) || (mode==="discount" && draft[field.key+"Discount"]==null)) return "请填写"+field.label+"的金额或折数";
        }
      }
      if (!XA.productPricing.valid(draft,draft.skus.map(s=>s.delta))) return "请检查价格和折扣：金额最多两位小数，划线价不得低于销售价，规格金额不得为负；各档固定价与折扣二选一，折扣须大于 0 且不超过 10";
      if (draft.skus?.some((s) => draft.price + s.delta < 0))
        return "规格组合价格不能为负数";
      if (draft.skus?.some((s) => !Number.isInteger(s.stock) || s.stock < 0))
        return "组合库存必须是非负整数";
      if (
        draft.specs.some(
          (s) =>
            !s.name?.trim() ||
            !s.options?.length ||
            s.options.some(
              (o) =>
                !o.t?.trim() || !Number.isFinite(o.d) || draft.price + o.d < 0,
            ),
        )
      )
        return "规格名称、选项及差价不完整";
    }
    if (
      session.type === "course" && draft.published &&
      (!draft.intro?.trim() || !draft.teacher?.trim() ||
        !draft.lessons.length ||
        draft.lessons.some(
          (l) => !l.t?.trim() || !Number.isFinite(l.m) || l.m <= 0,
        ))
    )
      return "发布前请填写简介、主讲人以及完整课节名称和时长";
    if (
      session.type === "activity" &&
      draft.quota <
        (session.original?.quota || 0) - (session.original?.left || 0)
    )
      return "名额不能低于已报名人数";
    if (
      session.type === "store" &&
      (!draft.city || !draft.district || !draft.address || !draft.phone)
    )
      return "请补充城市、行政区、地址和联系电话";
    return "";
  }
  shell.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b || b.closest(".ql-toolbar")) return;
    e.preventDefault();
    if (b.hasAttribute("data-withdraw")) {
      if (!window.confirm("撤下后，用户将无法浏览此内容。当前修改将保留为草稿。")) return;
      const {original, draft} = session;
      const before = structuredClone(original);
      Object.assign(original, draft, {published:false});
      delete original.workingCopy;
      if (ADM.save() === false) {
        Object.keys(original).forEach(key => delete original[key]);
        Object.assign(original, before);
        shell.querySelector("#recordError").textContent = "撤下失败，请刷新后重试";
        return;
      }
      close();
      ADM.render();
      ADM.toast("已撤下，内容保留为草稿");
      return;
    }
    if (b.dataset.pickTag) return changeProductTag(b.dataset.pickTag,false);
    if (b.dataset.removeTag) return changeProductTag(b.dataset.removeTag,true);
    if (b.hasAttribute("data-delete-term")) {
      const {def,original,type} = session;
      if (termUses(type,original.id)) {
        shell.querySelector("#recordError").textContent = "仍有资料引用，可先停用或移除关联。";
        return;
      }
      if (!window.confirm("确认删除“" + original.name + "”？")) return;
      const rows = D[def.data], index = rows.indexOf(original);
      rows.splice(index,1);
      if (ADM.save() === false) return rows.splice(index,0,original);
      close();
      ADM.render();
      return;
    }
    if (b.hasAttribute("data-gallery-index")) {
      const items = [...galleryOf(session.draft)], i = Number(b.dataset.galleryIndex);
      const [asset] = items.splice(i,1);
      if (b.value !== "remove") items.splice(i+Number(b.value),0,asset);
      session.draft.gallery = items;
      session.draft.coverMedia = items[0] || null;
      session.dirty = true;
      paint();
      return;
    }
    if (b.hasAttribute("data-close")) return close();
    if (b.hasAttribute("data-section")) {
      session.section = +b.dataset.section;
      paint();
      return;
    }
    if (b.hasAttribute("data-remove")) {
      getPath(session.draft, b.dataset.remove).splice(+b.dataset.index, 1);
      session.dirty = true;
      paint();
      return;
    }
    if (b.hasAttribute("data-add")) {
      const path = b.dataset.add;
      let arr = getPath(session.draft, path);
      if (!arr) {
        arr = [];
        setPath(session.draft, path, arr);
      }
      arr.push(
        path === "specs"
          ? { name: "", options: [{ t: "", d: 0 }] }
          : path.endsWith("options")
            ? { t: "", d: 0 }
            : path === "lessons"
              ? { t: "", trial: false }
              : {},
      );
      session.dirty = true;
      paint();
      return;
    }
    if (b.hasAttribute("data-save")) {
      if (session.type === "course" && session.draft.instructorId) {
        const teacher = D.creators.find(c => c.id === session.draft.instructorId);
        if (teacher) session.draft.teacher = teacher.name;
      }
      const savingDraft = editorial(session.type) && b.hasAttribute("data-draft");
      let error = savingDraft ? (session.draft.title?.trim() ? "" : "请填写草稿标题") : validate();
      if (!savingDraft && editorial(session.type) && !session.draft.body?.some(line => line.trim())) error = "发布前请填写正文";
      if (!savingDraft && session.type === "article" && !session.draft.author?.trim()) error = "发布前请填写作者";
      if (error) {
        const section = session.def.groups.findIndex((group) =>
          group.fields.some((field) => error.includes(field.label)),
        );
        shell.querySelector("#recordError").innerHTML =
          esc(error) +
          (section >= 0
            ? ` <button class="btn-adm outline sm" data-section="${section}">前往修改</button>`
            : "");
        return;
      }
      const { def, draft, original, type } = session;
      if (type === "enrollment" && draft.issue && !draft.certificate) {
        draft.certificate = {number: "JY-" + crypto.randomUUID().toUpperCase(), date: XA.d.key(new Date()),
          name: draft.name, issuer: draft.issuer, course: D.schoolClasses.find(c => c.id === draft.classId).title};
      }
      if (["video", "note"].includes(type) && !savingDraft) {
        const creator = D.creators.find((c) => c.id === draft.aid);
        if (!creator) {
          shell.querySelector("#recordError").textContent = "请选择作者账号";
          return;
        }
        draft.author = creator.name;
        draft.badge = creator.badge;
        if (type === "note") draft.source = ["官方账号","品牌号"].includes(creator.kind) ? "official" : "creator";
      }
      if (type === "service" && draft.mprice > draft.price) {
        shell.querySelector("#recordError").textContent = "会籍价不能高于原价";
        return;
      }
      if (type === "activity")
        draft.left =
          draft.quota - ((original?.quota || 0) - (original?.left || 0));
      if (type === "product") {
        if (draft.skus)
          draft.stock = draft.skus.reduce((sum, sku) => sum + sku.stock, 0);
        draft.soldOut = Boolean(draft.offShelf) || draft.stock === 0;
      }
      const before = original ? structuredClone(original) : null;
      if (editorial(type)) draft.published = !savingDraft;
      if (savingDraft && original && original.published !== false) {
        original.workingCopy = draft;
      } else if (original) {
        delete original.workingCopy;
        Object.assign(original, draft);
      }
      else if (Array.isArray(D[def.data])) D[def.data].push(draft);
      else D[def.data][draft.id] = draft;
      const addedTags = session.newTags.filter(tag => draft.tagIds?.includes(tag.id));
      D.shopTags.push(...addedTags);
      if (ADM.save() === false) {
        if (addedTags.length) D.shopTags.splice(-addedTags.length);
        if (original) {
          Object.keys(original).forEach((k) => delete original[k]);
          Object.assign(original, before);
        } else if (Array.isArray(D[def.data])) D[def.data].pop();
        else delete D[def.data][draft.id];
        shell.querySelector("#recordError").textContent = "保存失败，请重试";
        return;
      }
      ADM.extensions?.record({
        module: def.title,
        entityId: draft.id,
        description:
          (session.create ? "新增" : "保存") +
          (draft.title || draft.name || def.title),
      });
      ADM.sel[type] = draft.id;
      document.dispatchEvent(
        new CustomEvent("admin:record-saved", {
          detail: { type, id: draft.id },
        }),
      );
      close();
      ADM.render();
      ADM.toast(savingDraft ? "草稿已保存" : editorial(type) ? "内容已发布" : "资料已保存");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (shell.hidden || !document.getElementById("admModal").hidden) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
    if (e.key === "Tab") {
      const nodes = [
        ...shell.querySelectorAll("button,input,textarea,select"),
      ].filter((n) => !n.disabled && n.offsetParent);
      if (!nodes.length) return;
      const first = nodes[0],
        last = nodes.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  // 状态流转只能由业务动作推进，重复操作不重复记账。
  ADM.act.quickShip = (id) => {
    const order = S.orders.find((o) => o.id === id);
    if (!order || order.status !== "toship")
      return ADM.toast("仅待发货订单可执行发货");
    ADM.modal.show({
      title: "订单发货 · " + esc(id),
      body: `<label class="wf-field">物流公司<input id="shipCarrier" value="${esc(order.logistics?.company || "")}"></label><label class="wf-field">实际运单号<input id="shipTracking" value="${esc(order.logistics?.trackNo || "")}"></label><p class="tiny muted">填写实际物流信息，确认后更新订单状态。</p>`,
      submitText: "确认发货",
      onSave: () => {
        const company = document.getElementById("shipCarrier").value.trim(),
          trackNo = document.getElementById("shipTracking").value.trim();
        if (!company || !trackNo) {
          ADM.toast("请填写物流公司和实际运单号");
          return false;
        }
        if (order.status !== "toship") return false;
        if (order.shared) return !!XA.changeTrade({action:"ship",id,company,trackNo});
        order.logistics = { company, trackNo };
        order.status = "shipped";
        ADM.save("物流已保存，订单已标记发货");
        ADM.render();
      },
    });
  };
  ADM.act.shipAll = () => ADM.toast("请逐单核对实际运单号后发货");
  ADM.act.approveRefund = (id, pass) => {
    const refund = D.refunds.find((r) => r.id === id),
      order = S.orders.find((o) => o.id === refund?.orderId);
    if (!refund || refund.status !== "pending")
      return ADM.toast("该售后已处理");
    ADM.modal.show({
      title: pass ? "审核商品退款" : "驳回退款申请",
      body: `<p>关联订单 ${esc(refund.orderId)} · 退款 ¥${XA.money(refund.amount)}</p><label class="wf-field">处理说明<textarea id="refundReason"></textarea></label>`,
      submitText: "确认处理",
      onSave: () => {
        const reason = document.getElementById("refundReason").value.trim();
        if (!reason) {
          ADM.toast("请填写审核说明");
          return false;
        }
        if (refund.status !== "pending") return false;
        if (order?.shared) return !!XA.changeTrade({action:"review",id:order.id,refundId:id,pass,note:reason});
        if (
          pass &&
          (!order ||
            order.status === "refunded" ||
            refund.amount <= 0 ||
            refund.amount >
              Math.round((order.amount - (order.refundedAmount || 0)) * 100) /
                100)
        ) {
          ADM.toast("订单状态或退款金额不符合要求");
          return false;
        }
        refund.status = pass ? "approved" : "rejected";
        refund.auditNotes = reason;
        if (pass) {
          const previous = order.refundedAmount || 0;
          order.refundedAmount =
            Math.round((previous + refund.amount) * 100) / 100;
          const fraction = order.refundedAmount / order.amount;
          const points =
              Math.floor((order.points || 0) * fraction) -
              (order.refundedPoints || 0),
            growth =
              Math.floor((order.growth ?? order.points ?? 0) * fraction) -
              (order.refundedGrowth || 0);
          order.refundedPoints = (order.refundedPoints || 0) + points;
          order.refundedGrowth = (order.refundedGrowth || 0) + growth;
          if (order.refundedAmount >= order.amount) order.status = "refunded";
          XA.addPoints(-points, "商品订单退款 " + order.id, -growth);
          D.financeLedger.unshift({
            id: XA.uid("FIN"),
            type: "售后退款",
            channel: "模拟退款",
            ref: refund.id,
            amount: -refund.amount,
            fee: 0,
            net: -refund.amount,
            status: "已退款",
            at: new Date().toISOString(),
          });
        }
        ADM.save("售后处理已保存（演示）");
        ADM.render();
      },
    });
  };
  const settle = ADM.act.settlePayout;
  ADM.act.settlePayout = (id) => {
    if (D.brandSettlements.find((s) => s.id === id)?.status !== "待打款")
      return ADM.toast("该账单已处理");
    ADM.confirm("确认已核对线下转账凭证并登记本账单？", () => settle(id));
  };
  const verify = ADM.act.verifyAppt;
  ADM.act.verifyAppt = (id) => {
    if (S.appts.find((a) => a.id === id)?.status !== "booked")
      return ADM.toast("预约已处理或已取消");
    verify(id);
  };
  const claim = ADM.act.approveClaim;
  ADM.act.approveClaim = (id, pass) => {
    const item = S.claim.pending.find((p) => p.id === id);
    if (!item) return;
    ADM.confirm(`${pass ? "通过" : "驳回"}补登申请 ${esc(item.order)}？`, () =>
      claim(id, pass),
    );
  };
  ADM.act.exportFinanceCSV = () =>
    ADM.toast("请在财务工作区筛选并查看对账记录");
  ADM.act.handlePartner = (key, pass) => {
    const item = S.partnerApplications?.[key];
    if (!item || ["approved", "rejected"].includes(item.status))
      return ADM.toast("该申请已处理");
    ADM.modal.show({
      title: "处理门店申请",
      body: `<p>${esc(item.store || item.target)} · ${esc(item.contact)}</p><label class="wf-field">审核说明<textarea id="partnerReason"></textarea></label>`,
      submitText: pass ? "审核通过" : "退回补充",
      onSave: () => {
        const note = document.getElementById("partnerReason").value.trim();
        if (!note) {
          ADM.toast("请填写审核说明");
          return false;
        }
        if (["approved", "rejected"].includes(item.status)) return false;
        let store;
        const oldItem = structuredClone(item);
        let oldStore;
        if (pass && ["new","claim"].includes(item.type)) {
          if (item.type === "claim") {
            store = D.stores.find(s => s.id === (item.storeId || key.slice(6)));
            if (!store || store.claimed || store.linked) { ADM.toast("门店不存在或已接入"); return false; }
            oldStore = structuredClone(store);
          } else {
            if (D.stores.some(s => s.name === item.store && s.address === item.address)) {
              ADM.toast("该地址已有同名门店，请核对申请"); return false;
            }
            store = {id:XA.uid("store"), name:item.store,address:item.address, city:item.city,district:item.district,area:"",brand:"biz",phone:item.phone};
            D.stores.push(store);
          }
          Object.assign(store,{linked:true,claimed:true,manager:{name:item.contact,phone:item.phone}});
          store.services ||= []; store.staff ||= []; store.tags ||= []; store.groupon ||= [];
          store.gallery ||= [["room","sage"]]; store.reviews ??= 0; store.rating ??= 0;
          item.storeId = store.id;
        }
        Object.assign(item,{status:pass?"approved":"rejected",auditNotes:note,reviewedAt:new Date().toISOString()});
        if (!ADM.save()) {
          if (oldStore) { Object.keys(store).forEach(k=>delete store[k]); Object.assign(store,oldStore); }
          else if (store) D.stores.splice(D.stores.indexOf(store),1);
          Object.keys(item).forEach(k=>delete item[k]); Object.assign(item,oldItem);
          return false;
        }
        ADM.render();
        ADM.toast(pass ? "审核通过，关联资料已保存" : "已退回并保存原因");
      },
    });
  };
  ADM.act.saveAdjustBalanceInline = (id) => {
    const member = D.members.find((m) => m.id === id),
      type = document.getElementById("sp_adj_type")?.value;
    const amount = Number(document.getElementById("sp_adj_val")?.value),
      reason = document.getElementById("sp_adj_reason")?.value.trim();
    const key = type === "points" ? "points" : "coins";
    if (!member || !reason || !Number.isInteger(amount) || amount === 0)
      return ADM.toast("请输入整数调整值和原因");
    if (member[key] + amount < 0) return ADM.toast("调整后余额不能为负数");
    member[key] += amount;
    (member.adjustments ||= []).unshift({
      id: XA.uid("ADJ"),
      type: key,
      amount,
      reason,
      at: new Date().toISOString(),
    });
    ADM.save("会员调账及记录已保存");
    ADM.render();
  };
  ADM.act.toggleUserPlus = (id) => {
    const member = D.members.find((m) => m.id === id);
    if (!member) return;
    ADM.modal.show({
      title: "登记会员会籍 · " + esc(member.name),
      body: `<label class="wf-field">有效期至<input id="memberPlusDate" type="date" value="${esc(member.plusExpire || "")}"></label><label class="wf-field">业务凭证 / 调整原因<textarea id="memberPlusReason"></textarea></label>`,
      submitText: "登记会籍",
      onSave: () => {
        const expiry = document.getElementById("memberPlusDate").value,
          reason = document.getElementById("memberPlusReason").value.trim();
        if (!expiry || expiry < XA.d.key(new Date()) || !reason) {
          ADM.toast("请填写有效日期与业务原因");
          return false;
        }
        member.plus = true;
        member.plusExpire = expiry;
        (member.adjustments ||= []).unshift({
          type: "plus",
          expiry,
          reason,
          at: new Date().toISOString(),
        });
        ADM.save("会籍登记已保存");
        ADM.render();
      },
    });
  };
  function issueCoupon(template, member, batch) {
    member.coupons ||= [];
    if (member.coupons.some((c) => c.batch === batch)) return false;
    member.coupons.push({
      id: XA.uid("C"),
      batch,
      templateId: template.id,
      name: template.name,
      amount: template.amount,
      min: template.min,
      scope: template.scope,
      expire: XA.d.key(XA.d.add(template.validityDays)),
      used: false,
    });
    template.totalIssued = (template.totalIssued || 0) + 1;
    return true;
  }
  ADM.act.grantFromTpl = (id) => {
    const tpl = D.couponTemplates.find((t) => t.id === id);
    if (!tpl || !tpl.enabled) return ADM.toast("券模板已停用");
    ADM.modal.show({
      title: "派发优惠券 · " + esc(tpl.name),
      body: `<label class="wf-field">发放给<select id="couponMember">${D.members.map((m) => `<option value="${m.id}">${esc(m.name)} · ${esc(m.phone)}</option>`).join("")}</select></label><p class="tiny muted">本次发放会写入该会员卡券记录。</p>`,
      submitText: "确认派发",
      onSave: () => {
        const member = D.members.find(
          (m) => m.id === document.getElementById("couponMember").value,
        );
        if (!member) return false;
        issueCoupon(tpl, member, XA.uid("BATCH"));
        ADM.save("已写入会员卡券记录");
        ADM.render();
      },
    });
  };
  ADM.act.dispatchPlusPack = () => {
    const month = XA.d.key(new Date()).slice(0, 7),
      tpl = D.couponTemplates.find((t) => t.id === "tpl_plus_40" && t.enabled);
    if (!tpl) return ADM.toast("请启用 Plus 月度券模板");
    let count = 0;
    for (const member of D.members.filter(
      (m) => m.plus && m.plusExpire >= XA.d.key(new Date()),
    ))
      if (issueCoupon(tpl, member, "plus:" + month)) count++;
    ADM.save(
      count
        ? "本月券包已发放 " + count + " 人"
        : "本月券包已发放，无新增领取人",
    );
    ADM.render();
  };
  for (const name of ["deleteLedgerEntry", "deleteSettlement"])
    ADM.act[name] = () => ADM.toast("账务记录保留追溯，请通过业务调整记录更正");
  for (const [name, referenced] of Object.entries({
    deleteProduct: (id) =>
      S.orders.some((o) => o.items?.some((i) => i.pid === id)) ||
      D.videos.some((v) => v.binds?.some((b) => b.id === id)),
    deleteBrand: (id) => D.products.some((p) => p.brand === id),
    deleteService: (id) =>
      D.stores.some((s) => s.services?.includes(id)) ||
      S.appts.some((a) => a.serviceId === id),
    deleteStore: (id) => S.appts.some((a) => a.storeId === id),
    deleteCourse: (id) =>
      S.orders.some((o) => o.ref === id) || S.courses.includes(id),
  })) {
    const old = ADM.act[name];
    if (old)
      ADM.act[name] = (id) =>
        referenced(id)
          ? ADM.toast("该资料存在业务关联，请先处理关联或停用")
          : ADM.confirm("确认删除未被业务引用的资料？", () => old(id));
  }
  ADM.act.saveNewPlusBenefitInline = () => {
    const title = document.getElementById("sp_pb_title")?.value.trim();
    const desc = document.getElementById("sp_pb_desc")?.value.trim();
    if (!title || !desc) return ADM.toast("请填写权益名称及说明");
    D.plus.perks.push({ ic: "gift", t: title, d: desc });
    ADM.save("权益文案已更新");
    ADM.render();
  };
  ADM.act.removePlusBenefit = (index) => {
    ADM.confirm("确认移除此项权益说明？", () => {
      D.plus.perks.splice(index, 1);
      ADM.save("权益说明已更新");
      ADM.render();
    });
  };
  ADM.act.addCourseSection = (id) => {
    ADM.editRecord("course", id);
    session.section = 2;
    paint();
  };
  ADM.act.deleteCourseSection = (id, index) => {
    ADM.editRecord("course", id);
    session.section = 2;
    paint();
  };
  document.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest("#workspace button[onclick]");
      if (
        !button ||
        !/^\s*(curVideo|curNote|curCourse|curCr)\./.test(
          button.getAttribute("onclick"),
        )
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const type = {
        curVideo: "video",
        curNote: "note",
        curCourse: "course",
        curCr: "creator",
      }[button.getAttribute("onclick").match(/^\s*(\w+)\./)[1]];
      ADM.editRecord(type, ADM.sel[type]);
    },
    true,
  );
  ADM.registerRecordDefinition = (type, definition) => {
    if (
      !/^[a-z][a-zA-Z0-9]*$/.test(type) ||
      !definition.data ||
      !definition.groups
    )
      throw new Error("资料定义不完整");
    definitions[type] = definition;
  };
  ADM.recordDefinitions = definitions;
  ADM.recordIsDirty = () => Boolean(session?.dirty);
  ADM.recordIsOpen = () => !shell.hidden;
  ADM.closeRecord = () => close();
  ADM.refreshRecord = () => {
    if (session) paint();
  };
  const oldMode = ADM.setMode;
  ADM.setMode = (key, mode) =>
    definitions[key] && mode === "create"
      ? ADM.editRecord(key, null, true)
      : oldMode(key, mode);
  window.addEventListener("beforeunload", (event) => {
    if (session?.dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  // 现有确认与小型操作表单统一从右侧展开。
  document.getElementById("admModal").classList.add("as-side-panel");
  ADM.render();
})();
