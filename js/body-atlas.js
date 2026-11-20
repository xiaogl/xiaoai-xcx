/* 旋转人体示意模型。每个水平截面由中心位置和椭圆半径定义，单位与穴位图一致。 */
(function () {
  const width = 320, height = 460, sides = 36;
  const vertices = [], faces = [];
  function loft(rows) {
    const start = vertices.length;
    for (let k = 0; k <= (rows.length - 1) * 3; k++) {
      const i = Math.min(Math.floor(k / 3), rows.length - 2), t = k / 3 - i;
      const row = rows[i].map((v, j) => {
        const a = rows[Math.max(0, i - 1)][j], b = rows[i + 1][j], c = rows[Math.min(rows.length - 1, i + 2)][j];
        return v + 0.5 * t * ((b-a) + t*((2*a-5*v+4*b-c) + t*(-a+3*v-3*b+c)));
      });
      const [y,x,z,rx,rz] = row;
      for (let n = 0; n < sides; n++) {
        const ang = n * 2 * Math.PI / sides;
        vertices.push([x+Math.max(.15,rx)*Math.cos(ang),y,z+Math.max(.15,rz)*Math.sin(ang)]);
        if (k) {
          const p = start+k*sides+n, q = start+k*sides+(n+1)%sides;
          faces.push([p-sides,p,q], [p-sides,q,q-sides]);
        }
      }
    }
  }
  loft([[65,0,0,8,9],[73,0,0,13,12],[82,0,0,34,16],[91,0,0,41,18],[106,0,1,38,22],[125,0,0,35,22],[146,0,0,29,19],[165,0,0,26,17],[184,0,1,29,20],[201,0,0,32,21],[216,0,-1,30,19],[228,0,-1,23,14],[235,0,0,6,6]]);
  loft([[52,0,-1,9,9],[62,0,-1,9,10],[73,0,-1,10,11],[83,0,-1,17,14]]);
  loft([[10,0,-1,2,3],[13,0,-1,11,12],[20,0,-1,17,17],[31,0,0,18,19],[41,0,1,17,17],[48,0,3,15,15],[55,0,5,11,12],[60,0,6,5,6]]);
  loft([[28,0,17,1,1],[36,0,18,2,3],[41,0,20,3.5,4],[44,0,18,3,1]]);
  for (const side of [-1,1]) {
    const mirror = (rows) => loft(rows.map(([y,x,z,rx,rz])=>[y,side*x,z,rx,rz]));
    mirror([[30,17,0,1,2],[35,17,0,3,4],[43,17,0,2,3],[46,16,0,1,1]]);
    mirror([[82,34,0,3,5],[90,37,0,12,13],[103,40,0,12,13],[126,46,1,10,11],[150,51,1,8,8],[161,53,1,8,9],[175,55,2,9,9],[196,59,3,7,7],[214,63,5,5,5],[222,65,6,6,4],[232,68,7,6,4],[242,69,7,3,2],[245,69,7,1,1]]);
    mirror([[218,61,7,1,1],[224,60,9,2.6,3],[231,60,10,2,2],[235,60,10,.6,.6]]);
    mirror([[195,17,-1,10,12],[212,18,-1,16,18],[231,18,0,16,18],[254,19,0,15,16],[285,20,1,12,13],[310,20,1,10,10],[322,20,2,10,11],[332,21,0,10,10],[348,22,-2,12,12],[365,23,-3,11,12],[387,23,-2,7,8],[407,23,0,5,6],[419,23,0,6,7]]);
    for (let toe=0;toe<5;toe++) {
      const x=18.8+toe*2.1, z=20-toe*.8, r=1.55-toe*.12;
      mirror([[425,x,z,r,2],[427,x,z+1,r,3],[429,x,z+1,r*.85,2.5],[430,x,z,r*.5,1]]);
    }
    mirror([[412,23,0,4,4],[418,23,3,6,8],[424,23,8,7,14],[428,23,8,7,14],[430,23,7,4,9]]);
  }
  const normals = vertices.map(()=>[0,0,0]);
  for (const [a,b,c] of faces) {
    const u=vertices[b].map((v,j)=>v-vertices[a][j]), v=vertices[c].map((n,j)=>n-vertices[a][j]);
    const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    for (const i of [a,b,c]) for (let j=0;j<3;j++) normals[i][j]+=normal[j];
  }
  normals.forEach(n=>{const l=Math.hypot(...n)||1;for(let j=0;j<3;j++)n[j]/=l;});

  // 表面锚点只用于这个模型的交互示意。
  const anchors = {
    zusanli:[-26,348,9], guanyuan:[0,202,21], qihai:[0,188,21], shenque:[0,174,19],
    zhongwan:[0,145,19], neiguan:[-60,202,9], hegu:[65,224,10], sanyinjiao:[18,387,3],
    baihui:[0,11,2], dazhui:[0,74,-12], jianjing:[-32,85,-11], shenshu:[-12,181,-17],
    mingmen:[0,181,-19], weizhong:[-20,322,-9], yongquan:[23,430,13],
  };
  const locations = {
    qianding:[[0,13,8]], houding:[[0,13,-8]], xinhui:[[0,15,12]], shangxing:[[0,17,15]],
    sishencong:[[0,11,6],[0,11,-4],[5,11,1],[-5,11,1]],
    lineiting:[[-22,429,17],[22,429,17]], duyin:[[-21,430,22],[21,430,22]],
    shimian:[[-23,428,-3],[23,428,-3]], yongquan:[[-23,430,13],[23,430,13]],
    quchi:[[-54,155,5]], danzhong:[[0,116,22]], dazhu:[[-9,86,-15]],
  };
  XA.mountAtlas = (root, focusId, part) => {
    const canvas=root.querySelector('canvas'), ctx=canvas.getContext('2d'), overlay=root.querySelector('.atlas-labels');
    const scale=2, w=canvas.width=width*scale, h=canvas.height=height*scale;
    const pixels=ctx.createImageData(w,h), depth=new Float32Array(w*h);
    const focus=XA.data.atlasPoints.find(p=>p.id===focusId);
    let angle=focus ? (focus.view==='back'?Math.PI:0) : XA.tmp.atlasAngle || 0;
    let pitch = focus ? (focus.view==='head'?Math.PI/2:focus.view==='sole'?-Math.PI/2:0) : XA.tmp.atlasPitch || 0;
    let model = XA.tmp.atlasModel || 'male';
    let frame=0, drag=null;
    function draw() {
      frame=0;
      const cos=Math.cos(angle),sin=Math.sin(angle);
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const approach = Math.max(0, Math.min(1, (Math.abs(pitch) - 0.48) / 0.98));
      const blend = approach * approach * (3 - 2 * approach);
      const zoom = 1 + 2.35 * blend;
      const centerY = 222 + blend * ((pitch > 0 ? 20 : 425) - 222);
      const project = ([x,y,z]) => {
        if (model === 'female') {
          const shoulder = Math.exp(-Math.pow((y-96)/36,2)), hip = Math.exp(-Math.pow((y-210)/34,2));
          x *= 1 - .15 * shoulder + .15 * hip;
        }
        const depthZ = z*cos-x*sin, dy = y-centerY;
        return [width/2 + zoom*(x*cos+z*sin), height/2 + zoom*(dy*cp+depthZ*sp), depthZ*cp-dy*sp];
      };
      const projected=vertices.map((v,i)=>{
        const [x,y,z]=project(v), [nx,ny,nz]=normals[i];
        const horizontal = nx*cos+nz*sin, deep = nz*cos-nx*sin;
        const light=Math.max(0, -.48*horizontal-.42*(ny*cp+deep*sp)+.76*(deep*cp-ny*sp));
        return [x*scale,y*scale,z,light];
      });
      depth.fill(-Infinity);pixels.data.fill(0);
      for(const face of faces){
        const [a,b,c]=face.map(i=>projected[i]);
        const det=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
        if(det<.001)continue;
        const left=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),right=Math.min(w-1,Math.ceil(Math.max(a[0],b[0],c[0])));
        const top=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),bottom=Math.min(h-1,Math.ceil(Math.max(a[1],b[1],c[1])));
        for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
          const dx=x+.5-a[0],dy=y+.5-a[1];
          const u=(dx*(c[1]-a[1])-dy*(c[0]-a[0]))/det, v=((b[0]-a[0])*dy-(b[1]-a[1])*dx)/det;
          if(u<0||v<0||u+v>1)continue;
          const z=a[2]+u*(b[2]-a[2])+v*(c[2]-a[2]),i=y*w+x;
          if(z<=depth[i])continue;
          depth[i]=z;
          const l=a[3]+u*(b[3]-a[3])+v*(c[3]-a[3]),j=i*4;
          pixels.data[j]=117+113*l;pixels.data[j+1]=147+89*l;pixels.data[j+2]=137+82*l;pixels.data[j+3]=255;
        }
      }
      ctx.putImageData(pixels,0,0);
      const side=cos>=0?'front':'back';
      const pole = Math.abs(pitch) > 0.94 ? (pitch > 0 ? 'head' : 'sole') : '';
      const viewLabel = { head:'头顶 · 局部放大', sole:'足底 · 局部放大', front:'正面', back:'背面' };
      root.querySelector('.atlas-orientation').textContent=viewLabel[pole || side];
      root.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===(pole || side)));
      root.querySelectorAll('[data-model]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.model===model));
      const visible=XA.data.atlasPoints.filter(p=>{
        if (pole) return p.view===pole || p.id===(pole==='head'?'baihui':'yongquan');
        return p.view===side && (part==='全部'||p.part===part||p.id===focusId);
      });
      const points=visible.flatMap((p,i)=>{
        const markers = locations[p.id] || [anchors[p.id]];
        return markers.map((anchor,j)=>{
          const [x,y,z]=project(anchor);
          const surface=depth[Math.floor(y*scale)*w+Math.floor(x*scale)];
          const left=x<width/2-3 || (Math.abs(x-width/2)<=3 && (i+j)%2===0);
          return {p,x,y,z,surface,left,labelY:y,label:p.id==='sishencong'?['前神聪','后神聪','左神聪','右神聪'][j]:p.name};
        });
      }).filter(p=>p.x>=0 && p.x<width && p.y>=0 && p.y<height && p.z>=p.surface-14);
      for(const left of [true,false]){
        const col=points.filter(p=>p.left===left).sort((a,b)=>a.y-b.y);
        let last=6;for(const p of col){p.labelY=Math.max(p.y,last+26);last=p.labelY;}
        let next=height+12;for(const p of col.reverse()){p.labelY=Math.min(p.labelY,next-26);next=p.labelY;}
      }
      overlay.innerHTML=points.map(({p,x,y,left,labelY,label})=>{
        const end=left?67:253, edge=left?12:255;
        return `<g class="atlas-pin ${p.id===focusId?'selected':''}" data-id="${p.id}" role="button" tabindex="0" aria-label="${p.name}">
        <path d="M${x} ${y} L${end+(left?16:-16)} ${labelY} H${end}"/><circle cx="${x}" cy="${y}" r="3.5"/>
        <rect x="${edge}" y="${labelY-11}" width="53" height="22" rx="7"/><text x="${edge+26.5}" y="${labelY+4}">${label}</text></g>`;
      }).join('');
    }
    function rotate(yaw, tilt) {
      angle=yaw; pitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,tilt));
      XA.tmp.atlasAngle=angle; XA.tmp.atlasPitch=pitch;
      if(!frame)frame=requestAnimationFrame(draw);
    }
    const stage=root.querySelector('.atlas-stage');
    stage.onpointerdown=e=>{
      if(e.target.closest('[data-id]') || !e.isPrimary)return;
      drag={x:e.clientX,y:e.clientY,angle,pitch};
      stage.setPointerCapture(e.pointerId);
    };
    stage.onpointermove=e=>{
      if(!drag || !e.isPrimary)return;
      const rect=stage.getBoundingClientRect();
      rotate(drag.angle+(e.clientX-drag.x)*Math.PI*2/rect.width,drag.pitch+(e.clientY-drag.y)*Math.PI/rect.height);
    };
    stage.onpointerup=stage.onpointercancel=()=>{drag=null;};
    root.onclick=e=>{
      const hit=e.target.closest('[data-id]'), view=e.target.closest('[data-view]'), body=e.target.closest('[data-model]');
      if(hit)XA.act.ptSheet(hit.dataset.id);
      if(body){model=body.dataset.model;XA.tmp.atlasModel=model;rotate(angle,pitch);}
      if(view){
        const v=view.dataset.view;
        rotate(v==='back'?Math.PI:0,v==='head'?Math.PI/2:v==='sole'?-Math.PI/2:0);
      }
    };
    overlay.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){const hit=e.target.closest('[data-id]');if(hit){e.preventDefault();XA.act.ptSheet(hit.dataset.id);}}};
    draw();
    return ()=>cancelAnimationFrame(frame);
  };
})();
