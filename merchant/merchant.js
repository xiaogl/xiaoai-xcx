(() => {
  const el = id => document.getElementById(id);
  const selector = el('stores');
  const dialog = el('editor');
  let data, editing;
  const current = new URL(location.href);
  current.searchParams.set('demo', XA.demoSpace);
  history.replaceState(null, '', current);
  for (const [id, path] of [['customer','../index.html'], ['apply','../manager.html']]) {
    const url = new URL(path, current);
    url.searchParams.set('demo', XA.demoSpace);
    el(id).href = url;
  }

  function element(tag, text) {
    const node = document.createElement(tag);
    node.textContent = text;
    return node;
  }
  function action(label, handler) {
    const button = element('button', label);
    button.type = 'button';
    button.onclick = handler;
    return button;
  }
  function row(title, detail, button) {
    const wrap = element('div', '');
    wrap.className = 'row';
    const label = element('div', title);
    label.append(element('small', detail));
    wrap.append(label);
    if (button) wrap.append(button);
    return wrap;
  }
  function load(message = '') {
    el('workspace').hidden = true;
    try {
      data = XA.storeAction('list', {storeId:selector.value});
      const status = {booked:'待到店', done:'已核销', cancelled:'已取消', noshow:'未到店'};
      const appointments = data.appointments.map(a => {
        const verify = a.status === 'booked' && action('核销', () => {
          if (!confirm('确认核销预约 ' + a.id + '？')) return;
          try {
            XA.storeAction('verify', {storeId:selector.value, id:a.id});
            load('预约已核销');
          } catch (err) { load(err.message); }
        });
        const service = a.serviceName || data.services.find(s => s.id === a.serviceId)?.name || a.serviceId;
        const worker = a.staffName || data.staff.find(s => s.id === a.staffId)?.name || '到店安排';
        return row(a.date + ' ' + a.time + ' · ' + service, [worker,status[a.status] || a.status,a.id,a.code && '核销码 ' + a.code].filter(Boolean).join(' · '), verify);
      });
      el('appointments').replaceChildren(...(appointments.length ? appointments : ['本店暂无预约']));
      el('count').textContent = data.appointments.filter(a => a.status === 'booked').length + ' 笔待到店';
      const staff = data.staff.map(w => row(w.name + ' · ' + w.title, w.enabled === false ? '已停用' : '已启用', action('编辑', () => edit(w))));
      el('staff').replaceChildren(...(staff.length ? staff : ['本店暂无技师']));
      const waiting = (data.waitlist || []).map(w => {
        const service = data.services.find(s => s.id === w.serviceId)?.name || w.serviceId;
        const offer = w.status === 'waiting' && action('通知有空位', () => {
          try {
            XA.storeAction('waitOffer', {storeId:selector.value, id:w.id});
            load('已更新候补状态，顾客可确认预约');
          } catch (err) { load(err.message); }
        });
        return row(w.date + ' ' + w.time + ' · ' + service, offer ? '等待空位' : '已通知有空位', offer);
      });
      el('waiting').replaceChildren(...(waiting.length ? waiting : ['本店暂无候补']));
      const events = (data.activities || []).map(e => row(e.title, e.time + ' · 剩余 ' + e.left + ' / ' + e.quota + ' 席'));
      el('activities').replaceChildren(...(events.length ? events : ['本店暂无活动']));
      el('workspace').hidden = false;
      el('message').textContent = message;
    } catch (err) { el('message').textContent = err.message; }
  }

  function edit(worker = {}) {
    editing = worker.id;
    el('editorTitle').textContent = editing ? '编辑技师' : '新增技师';
    el('staffName').value = worker.name || '';
    el('title').value = worker.title || '';
    el('enabled').checked = worker.enabled !== false;
    el('error').textContent = '';
    el('days').replaceChildren();
    for (const day of [1,2,3,4,5,6,0]) {
      const field = element('fieldset', '');
      field.dataset.day = day;
      field.append(element('legend', '星期' + '日一二三四五六'[day]));
      const mode = element('input', '');
      mode.type = 'checkbox';
      const selected = worker.shifts?.[day];
      mode.checked = selected == null;
      const label = element('label', '');
      label.append(mode, ' 使用默认时段');
      const slots = element('div', '');
      slots.className = 'slots';
      slots.hidden = mode.checked;
      mode.onchange = () => { slots.hidden = mode.checked; };
      for (const time of data.TIMES || XA.data.TIMES) {
        const check = element('input', '');
        check.type = 'checkbox';
        check.value = time;
        check.checked = selected == null || selected.includes(time);
        const slot = element('label', '');
        slot.append(check, time);
        slots.append(slot);
      }
      field.append(label, slots);
      el('days').append(field);
    }
    dialog.showModal();
  }
  el('form').onsubmit = event => {
    event.preventDefault();
    const shifts = {};
    for (const day of el('days').children) {
      if (!day.querySelector('input').checked) {
        shifts[day.dataset.day] = Array.from(day.querySelectorAll('.slots input:checked'), box => box.value);
      }
    }
    const staff = {name:el('staffName').value.trim(), title:el('title').value.trim(), enabled:el('enabled').checked, shifts};
    if (editing) staff.id = editing;
    try {
      XA.storeAction('staffSave', {storeId:selector.value, staff});
      dialog.close();
      load('技师资料与排班已保存');
    } catch (err) { el('error').textContent = err.message; }
  };
  async function start() {
    el('refresh').disabled = selector.disabled = true;
    el('workspace').hidden = true;
    el('message').textContent = '正在读取门店…';
    try {
      await XA.loadCatalog();
      const previous = selector.value || current.searchParams.get('storeId');
      const stores = XA.data.stores.filter(s => s.linked && !s.soon);
      selector.replaceChildren(...stores.map(s => new Option(s.name,s.id)));
      if (stores.some(s => s.id === previous)) selector.value = previous;
      if (stores.length) load();
      else el('message').textContent = '暂无已开通的门店';
    } catch (err) { el('message').textContent = err.message; }
    finally { el('refresh').disabled = selector.disabled = false; }
  }
  selector.onchange = () => load();
  el('refresh').onclick = start;
  el('add').onclick = () => edit();
  el('close').onclick = () => dialog.close();
  start();
})();
