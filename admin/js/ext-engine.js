/* 可扩展业务元数据与成功操作记录。只保存定义和真实提交结果。 */
(function () {
  const FIELDS_KEY = "xa_admin_fields_v2";
  const AUDIT_KEY = "xa_admin_audit_v2";
  function load(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  }
  const fields = load(FIELDS_KEY, {});
  const legacy = load("xa_adm_schemas_v7", {});
  const legacyTypes = {
    shop: "product",
    content: "video",
    store: "store",
    user: "member",
  };
  for (const [domain, type] of Object.entries(legacyTypes)) {
    if (!fields[type] && legacy[domain])
      fields[type] = legacy[domain].map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        options: f.options,
        active: true,
      }));
  }
  ADM.extensions = {
    fields,
    audits: load(AUDIT_KEY, []),
    forType(type) {
      return (fields[type] || []).filter((f) => f.active !== false);
    },
    saveFields() {
      try {
        localStorage.setItem(FIELDS_KEY, JSON.stringify(fields));
        return true;
      } catch {
        ADM.toast("扩展字段保存失败，请检查浏览器存储空间");
        return false;
      }
    },
    record(entry) {
      const record = {
        id: XA.uid("AUD"),
        at: new Date().toISOString(),
        actor: "演示运营员",
        ...entry,
      };
      this.audits.unshift(record);
      this.audits = this.audits.slice(0, 300);
      try {
        localStorage.setItem(AUDIT_KEY, JSON.stringify(this.audits));
      } catch {
        ADM.toast("业务已保存，操作记录写入失败");
      }
    },
  };
  const save = ADM.save;
  ADM.save = (msg) => {
    const ok = save(msg);
    if (ok && msg) ADM.extensions.record({ module: ADM.tab, description: msg });
    return ok;
  };
})();
