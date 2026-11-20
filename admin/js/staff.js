(function () {
  const D = XA.data, esc = XA.esc;
  const weekdays = ['日','一','二','三','四','五','六'];

  ADM.staffView = () => {
    const rows = D.staff.flatMap((worker, index) => worker.id === 'any' ? [] : [
      `<tr><td><b>${esc(worker.name)}</b><small>${esc(worker.title)}</small></td>
      <td>${D.stores.filter(s => s.staff?.includes(worker.id)).map(s => esc(s.name)).join('、') || '未分配'}</td>
      <td>${worker.enabled === false ? '停用' : '启用'}</td>
      <td><button class="op-edit" onclick="ADM.editStaff(${index})">编辑与排班</button></td></tr>`
    ]);
    return `<div class="op-filterbar"><b>技师档案</b><button class="btn-adm primary" onclick="ADM.editStaff()">新增技师</button></div>
      <table class="op-table"><thead><tr><th>技师</th><th>归属门店</th><th>预约状态</th><th>操作</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
  };

  ADM.editStaff = index => {
    const worker = D.staff[index] || {id:XA.uid('w'), name:'', title:''};
    if (worker.id === 'any') return;
    const checked = value => value ? 'checked' : '';
    ADM.modal.show({
      title:index == null ? '新增技师' : '编辑技师与排班',
      body:`<form id="workerForm" onsubmit="return false" class="col gap12">
        <label>姓名<input class="field-input" name="name" required maxlength="40" value="${esc(worker.name)}"></label>
        <label>职称<input class="field-input" name="title" required maxlength="100" value="${esc(worker.title)}"></label>
        <label><input type="checkbox" name="enabled" ${checked(worker.enabled !== false)}> 启用预约</label>
        <fieldset><legend>归属门店（可多选）</legend>${D.stores.map(s => `<label><input type="checkbox" name="store" value="${esc(s.id)}" ${checked(s.staff?.includes(worker.id))}> ${esc(s.name)}</label>`).join(' ')}</fieldset>
        <fieldset><legend>每周可约时段</legend>${weekdays.map((day,i) => `<details><summary>周${day}</summary>${D.TIMES.map(t => `<label><input type="checkbox" name="day${i}" value="${esc(t)}" ${checked(!Array.isArray(worker.shifts?.[i]) || worker.shifts[i].includes(t))}> ${esc(t)}</label>`).join(' ')}</details>`).join('')}</fieldset></form>`,
      onSave() {
        const form = document.getElementById('workerForm');
        if (!form.reportValidity()) return false;
        const data = new FormData(form);
        const name = data.get('name').trim(), title = data.get('title').trim();
        if (!name || !title) { ADM.toast('请填写姓名和职称'); return false; }
        const shifts = {};
        weekdays.forEach((_, i) => {
          const times = data.getAll('day' + i);
          if (times.length !== D.TIMES.length) shifts[i] = times;
        });
        const next = {...worker,name,title,enabled:data.has('enabled'),shifts};
        const previous = D.staff;
        const memberships = D.stores.map(s => s.staff);
        D.staff = index == null ? [...previous,next] : previous.map(w => w.id === worker.id ? next : w);
        const selected = new Set(data.getAll('store'));
        D.stores.forEach(s => {
          if (selected.has(s.id) && !s.staff?.includes(worker.id)) s.staff = [...(s.staff || []),worker.id];
          if (!selected.has(s.id) && s.staff?.includes(worker.id)) s.staff = s.staff.filter(id => id !== worker.id);
        });
        if (!ADM.save('技师资料与排班已保存')) {
          D.staff = previous;
          D.stores.forEach((s,i) => s.staff = memberships[i]);
          return false;
        }
        ADM.render();
        return true;
      }
    });
  };
})();
