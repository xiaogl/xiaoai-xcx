// The prototype keeps file bytes in this browser. Catalog records carry only the reference and metadata.
(function () {
  let database;
  function openDatabase() {
    if (!database) database = new Promise((resolve, reject) => {
      const request = indexedDB.open('xa-prototype-media', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('files');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => { database = null; reject(request.error); };
    });
    return database;
  }
  async function fileInfo(file, kind) {
    const element = document.createElement(kind === 'video' ? 'video' : 'img');
    const url = URL.createObjectURL(file);
    let timer;
    try {
      await new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(Error('读取素材超时')), 15000);
        element[kind === 'video' ? 'onloadedmetadata' : 'onload'] = resolve;
        element.onerror = () => reject(Error('浏览器无法读取该素材'));
        element.preload = 'metadata';
        element.src = url;
      });
      if (kind === 'video' && !(Number.isFinite(element.duration) && element.duration > 0 && element.videoWidth))
        throw Error('无法识别视频画面或时长');
      return {width:element.videoWidth || element.naturalWidth, height:element.videoHeight || element.naturalHeight,
        ...(kind === 'video' ? {seconds:element.duration} : {})};
    } finally { clearTimeout(timer); URL.revokeObjectURL(url); }
  }
  XA.importMedia = async (file, kind) => {
    const info = await fileInfo(file, kind);
    const db = await openDatabase(), key = crypto.randomUUID();
    await new Promise((resolve,reject) => {
      const tx = db.transaction('files','readwrite');
      tx.oncomplete = resolve;
      tx.onabort = () => reject(Error('本机存储不足或不可用'));
      tx.objectStore('files').put(file,key);
    });
    return {key,kind,name:file.name,size:file.size,...info};
  };
  const sharedTypes = new Set(["image/jpeg","image/png","image/gif","image/webp","image/avif","video/mp4","video/webm","video/quicktime"]);
  const partUrl = (key,part) => "/api/operations?mode=mediaPart&demo="+encodeURIComponent(XA.demoSpace)+"&key="+encodeURIComponent(key)+"&part="+part;
  XA.importSharedMedia = async file => {
    if (!sharedTypes.has(file.type)) throw Error("请选择 JPG、PNG、GIF、WebP、AVIF 图片或 MP4、WebM、MOV 视频");
    if (file.size > 64*1024*1024 || !file.size) throw Error("每个素材须大于 0 且不超过 64 MB");
    const kind = file.type.startsWith("video/") ? "video" : "image";
    const info = await fileInfo(file,kind), key = crypto.randomUUID(), chunk = 1024*1024;
    const parts = Math.ceil(file.size/chunk);
    for (let i=0;i<parts;i++) {
      const encoded = await new Promise((resolve,reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file.slice(i*chunk,(i+1)*chunk));
      });
      const result = await fetch(partUrl(key,i),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:encoded})});
      if (!result.ok) throw Error("素材上传失败，请重试");
    }
    return {key,kind,name:file.name,size:file.size,type:file.type,parts,...info};
  };
  async function loadShared(key,parts,type) {
    if (!sharedTypes.has(type) || !Number.isInteger(parts) || parts<1 || parts>64) throw Error();
    const chunks = [];
    for (let index=0;index<parts;index++) {
      const res=await fetch(partUrl(key,index));
      if (!res.ok) throw Error();
      const {data}=await res.json();
      chunks.push(Uint8Array.from(atob(data),c=>c.charCodeAt(0)));
    }
    return new Blob(chunks,{type});
  }
  XA.mediaPreview = asset => asset.parts && asset.kind === "video" ? `<video controls playsinline preload="metadata" style="width:100%;height:100%;object-fit:contain" src="/api/operations?mode=mediaVideo&amp;demo=${encodeURIComponent(XA.demoSpace)}&amp;key=${encodeURIComponent(asset.key)}&amp;size=${Number(asset.size)}&amp;type=${encodeURIComponent(asset.type)}"></video>` : `<xa-local-media data-key="${XA.esc(asset.key)}" data-parts="${XA.esc(asset.parts || "")}" data-type="${XA.esc(asset.type || "")}" data-kind="${asset.kind === 'video' ? 'video' : 'image'}" style="display:block;width:100%;height:100%"></xa-local-media>`;
  customElements.define('xa-local-media', class extends HTMLElement {
    async connectedCallback() {
      try {
        const db = this.dataset.parts ? null : await openDatabase();
        const file = this.dataset.parts ? await loadShared(this.dataset.key,Number(this.dataset.parts),this.dataset.type) : await new Promise((resolve,reject) => {
          const request = db.transaction('files').objectStore('files').get(this.dataset.key);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        if (!this.isConnected || this.url) return;
        if (!file) throw Error();
        const el = document.createElement(this.dataset.kind === 'video' ? 'video' : 'img');
        el.controls = true; el.playsInline = true; el.preload = 'metadata';
        el.style.cssText = 'display:block;width:100%;height:100%;max-height:inherit;object-fit:contain';
        this.url = URL.createObjectURL(file);
        el.src = this.url;
        this.replaceChildren(el);
      } catch { this.textContent = this.dataset.parts ? '素材读取失败' : '当前浏览器没有此素材'; }
    }
    disconnectedCallback() { if (this.url) URL.revokeObjectURL(this.url); this.url = null; }
  });
})();
