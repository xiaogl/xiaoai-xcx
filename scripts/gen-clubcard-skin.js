/* 生成「我的」会员卡皮肤：浅底白卡外框 + 局部深绿卡片 + 艾草浮雕（压在深绿卡片角上）
 * 运行：node scripts/gen-clubcard-skin.js  → 输出 css 片段到 scripts/.clubcard.css
 * 产物仅用于贴回 css/app.css，勿在运行时依赖。
 */
const fs = require('fs');
const path = require('path');

/* ---------- 艾草枝：羽状复叶，主脉两侧成对小叶 ---------- */
const LOBE = "M0 0C3.1 -2.6 9.8 -3 13 -0.4C9.8 2.3 3.1 2.3 0 0Z";

// 一片羽状叶：沿 +x 展开，len 为长度，pairs 为小叶对数
function frond(len, pairs) {
  let s = `<path d='M0 0L${len} 0' fill='none' stroke-width='1.1' stroke-linecap='round'/>`;
  for (let i = 0; i < pairs; i++) {
    const t = 0.12 + 0.86 * (i / Math.max(1, pairs - 1));
    const x = len * t;
    const l = len * (0.34 - 0.2 * t); // 小叶长度由根部向尖端递减
    const sc = l / 13;
    const ang = 46 + 16 * t; // 越靠尖端越贴合主脉
    for (const dir of [-1, 1]) {
      s +=
        `<g transform='translate(${x} 0) rotate(${dir * ang}) scale(${sc.toFixed(3)})'>` +
        `<path d='${LOBE}'/></g>`;
    }
  }
  s += `<g transform='translate(${len} 0) scale(${(len * 0.12 / 13).toFixed(3)})'><path d='${LOBE}'/></g>`;
  return s;
}

// 一根枝条：主枝 + 沿枝错位生长的羽叶（由根到梢变小）
function branch(sx, sy, plan) {
  const ang = (Math.atan2(sy, sx) * 180) / Math.PI;
  let s = `<path d='M0 0C${sx * 0.35} ${sy * 0.55} ${sx * 0.72} ${sy * 0.9} ${sx} ${sy}' fill='none' stroke-width='1.4' stroke-linecap='round'/>`;
  for (const [t, side, len, pairs] of plan) {
    s += `<g transform='translate(${sx * t} ${sy * t}) rotate(${ang + side * 58})'>${frond(len, pairs)}</g>`;
  }
  return s;
}
const BODY = branch(160, -30, [
  [0.12, -1, 86, 7],
  [0.3, 1, 92, 7],
  [0.52, -1, 84, 7],
  [0.74, 1, 68, 6],
  [0.92, -1, 50, 5],
]);

const leafSvg = (fill, op) =>
  "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='-40 -150 230 230' " +
  `fill='${fill}' stroke='${fill}'>` +
  `<g fill-opacity='${op}' stroke-opacity='${op * 0.85}'>${BODY}</g></svg>`;

const leaf = leafSvg('#d3ebcb', 0.40);
const leafSoft = leafSvg('#d3ebcb', 0.30);

const url = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}")`;

const css = `/* ===== 我的会员卡：浅底白卡外框 → 局部深绿卡片 → 艾草浮雕 ===== */
.club-card {
  position: relative; overflow: hidden;
  padding: 10px; min-height: 0;
  border-radius: 18px; color: var(--text);
  border: 1px solid rgba(38, 74, 56, .10);
  background: linear-gradient(160deg, #fefefc 0%, #f4f6f1 100%);
  box-shadow: 0 10px 24px rgba(22, 58, 43, .10), inset 0 1px 0 #fff;
}
/* 局部深绿卡片：艾草浮雕直接压在卡片两角，形成浅浮雕层次 */
.club-plate {
  position: relative; overflow: hidden;
  padding: 17px; border-radius: 13px; color: #f0f8f2;
  background: radial-gradient(120% 132% at 90% 0%, #3d7659 0%, #2a5f45 46%, #1f4c37 100%);
  box-shadow: 0 6px 16px rgba(16, 50, 36, .20), inset 0 1px 0 rgba(255, 255, 255, .10);
}
/* 右上角艾草枝 */
.club-plate::before {
  content: ''; position: absolute; right: -54px; top: -60px; width: 152px; height: 152px;
  background: ${url(leaf)} no-repeat center / contain;
  filter: blur(.45px); pointer-events: none;
}
/* 左下角艾草枝（旋转镜像，更淡一档） */
.club-plate::after {
  content: ''; position: absolute; left: -22px; bottom: -46px; width: 150px; height: 150px;
  background: ${url(leafSoft)} no-repeat center / contain;
  transform: rotate(202deg); filter: blur(.45px); pointer-events: none;
}
`;

const out = path.join(__dirname, '.clubcard.css');
fs.writeFileSync(out, css, 'utf8');
console.log('written', out, css.length + ' chars');
