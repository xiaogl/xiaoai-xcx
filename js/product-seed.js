// Shared initial product catalog for demo workspaces.
globalThis.XA_PRODUCT_SEED = [
    {
      id: 'p1', category: '艾灸用品', brand: 'yqdd', title: '五年陈艾条 手工蕲艾 18mm×10支', short: '五年陈艾条', price: 68, member: true, sales: 23000, curated: true,
      art: ['moxa', 'sage'], fit: ['阳虚质', '气虚质', '平和质'], kw: '艾条 艾灸 陈艾 蕲艾',
      specs: [{ name: '年份', options: [{ t: '三年陈', d: -20 }, { t: '五年陈', d: 0 }] }, { name: '规格', options: [{ t: '10支装', d: 0 }, { t: '30支装（更划算）', d: 110 }] }],
      points: ['自然陈放五年，艾烟柔和不呛', '绒细无杂质，燃烧均匀', '每批次附检测报告'],
      detail: ['艾条好不好，主要看两点：陈放年份和艾绒纯度。五年陈艾火力温和、渗透感好，适合在家日常艾灸。', '使用方法：点燃后距离皮肤 3～5 厘米悬灸，以温热舒适、不烫为度，每个穴位 10～15 分钟。', '温馨提示：艾灸时注意通风，灸后及时熄灭艾条；孕妇、皮肤破损处请勿使用。'],
    },
    {
      id: 'p2', category: '艾灸用品', brand: 'yqdd', title: '随身灸艾灸盒 纯铜加厚 配布套', short: '随身灸艾灸盒', price: 129, member: true, sales: 8600, curated: true,
      art: ['box', 'sand'], fit: ['阳虚质', '血瘀质', '痰湿质'], kw: '艾灸盒 随身灸 铜',
      specs: [{ name: '款式', options: [{ t: '单孔', d: 0 }, { t: '双孔', d: 60 }] }],
      points: ['解放双手，绑在身上就能灸', '可调风口，温度好控制', '加厚纯铜，耐用不烫手'],
      detail: ['新手自己拿艾条容易手酸、对不准位置，用随身灸盒会省心很多：放入艾柱、扣好盖子、套上布套绑在穴位处即可。', '可通过旋转风口调节温度，感觉烫了就关小一点。'],
    },
    {
      id: 'p3', category: '足浴热敷', brand: 'mdm', title: '艾草生姜足浴包 30包 家庭装', short: '艾草足浴包', price: 59, sales: 51000, curated: true,
      art: ['bath', 'clay'], fit: ['阳虚质', '痰湿质', '气虚质'], kw: '泡脚 足浴 艾草 生姜',
      specs: [{ name: '规格', options: [{ t: '30包', d: 0 }, { t: '60包（两个月量）', d: 49 }] }],
      points: ['艾叶、生姜、红花，原料看得见', '独立小包，一次一包不浪费', '睡前泡一泡，暖脚好入睡'],
      detail: ['每晚睡前用 40℃ 左右温水泡脚 15～20 分钟，水没过脚踝，泡到身体微微发热即可。', '温馨提示：饭后半小时内不宜泡脚；糖尿病足、皮肤破损者请遵医嘱。'],
    },
    {
      id: 'p4', category: '足浴热敷', brand: 'mdm', title: '艾草热敷肩颈贴 自发热 10贴', short: '艾草肩颈贴', price: 79, sales: 12000, curated: true,
      art: ['patch', 'rose'], fit: ['血瘀质', '气郁质', '阳虚质'], kw: '肩颈 热敷 艾草贴',
      specs: [{ name: '规格', options: [{ t: '10贴', d: 0 }, { t: '20贴', d: 60 }] }],
      points: ['撕开即热，持续温热约 8 小时', '贴合肩颈弧度，不易掉', '久坐、低头族的随身好物'],
      detail: ['撕开包装后贴于衣物内层或隔一层薄衣使用，请勿直接长时间接触皮肤，避免低温烫伤。'],
    },
    {
      id: 'p5', category: '茶饮食养', brand: 'syb', title: '红枣桂圆枸杞茶 独立小包 20袋', short: '红枣桂圆枸杞茶', price: 49, sales: 6700, curated: true,
      art: ['tea', 'sand'], fit: ['气虚质', '阳虚质', '平和质'], kw: '养生茶 红枣 桂圆 枸杞',
      specs: [{ name: '规格', options: [{ t: '20袋', d: 0 }, { t: '40袋', d: 40 }] }],
      points: ['只有红枣、桂圆、枸杞三样', '不加糖、不加香精', '一袋一杯，热水冲泡即可'],
      detail: ['每次一袋，沸水冲泡焖 5 分钟后饮用，可反复冲泡 2～3 次。'],
    },
    {
      id: 'p6', category: '艾灸用品', brand: 'yqdd', title: '微烟艾柱 54粒 适配随身灸盒', short: '微烟艾柱', price: 45, sales: 9800, curated: true, soldOut: true,
      art: ['moxa', 'mist'], fit: ['阳虚质'], kw: '艾柱 艾灸',
      specs: [{ name: '规格', options: [{ t: '54粒', d: 0 }] }],
      points: ['烟更少，适合室内使用'], detail: ['适配元气地带随身灸艾灸盒。'],
    },
  ];
