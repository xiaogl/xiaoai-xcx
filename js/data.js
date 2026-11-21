/* data.js —— 全部为演示内容（品牌、商品、视频、笔记、课程、穴位、体质、门店、外部订单） */
(function () {
  const D = XA.data;

  // 首页资源按本地日期投放，起止日均包含当天。heightPercent 相对小程序内容区。
  D.homeResources = {
    campaign: { enabled: false, start: '', end: '', title: '立冬养藏', image: '', art: ['moxa', 'sage'], route: 'article?id=a1', heightPercent: 50 },
    notice: { enabled: false, start: '', end: '', title: '立冬养藏指南', route: 'article?id=a1' },
  };

  /* ---------- 品牌池：入驻平台的独立品牌（晓艾不做自有品牌）；商详必挂，品牌页用事实与做法建立信任感 ---------- */
  D.brands = {
    yqdd: {
      id: 'yqdd', name: '元气地带', mark: '元', art: ['leaf', 'sage'], slogan: '陈艾好物，日日元气',
      since: 2019, fans: 128000, rating: 4.9, sold: '36 万+', city: '杭州',
      origin: '湖北蕲春固定合作产地',
      factory: '陈化仓自管 · 代工厂驻场质检',
      story: '元气地带专注陈年艾绒与艾灸用品。原料来自湖北蕲春固定合作产地，端午前后采收，自然陈放三年以上；陈化仓自管温湿度，每批出厂附质检报告。晓艾买手走访产地与仓后，将其代表好物带到平台。',
      promise: ['原料可追溯', '批次必检', '正品包退'],
      highlights: [
        { ic: 'leaf', t: '固定产地', d: '端午采收，陈放三年以上' },
        { ic: 'shield', t: '批次检测', d: '每批出厂附质检报告' },
        { ic: 'package', t: '陈化仓自管', d: '温湿度可追溯记录' },
        { ic: 'headset', t: '平台售后', d: '退换由晓艾客服接待' },
      ],
      process: ['走访产地与陈化仓', '样品燃烧与绒质复核', '核对证照与批次报告', '小批量上架后再扩品'],
      certs: [
        { name: '营业执照', org: '杭州市市监局', at: '2024-03', no: '91330100MA2XXXX' },
        { name: '产品质检报告', org: '第三方检测机构', at: '2026-09', no: 'QA-2026-0918' },
        { name: '艾草产地证明', org: '产地合作方', at: '2026-06', no: 'HB-QC-0612' },
      ],
    },
    mdm: {
      id: 'mdm', name: '明大妈', mark: '明', art: ['bath', 'clay'], slogan: '家里常备的养生日用',
      since: 2020, fans: 86000, rating: 4.8, sold: '52 万+', city: '杭州',
      origin: '配方公开 · 原料可见',
      factory: '合作食品级代工厂 · 批次抽检',
      story: '明大妈做家里长辈用得惯的养生日用：泡脚包、热敷贴、艾草皂。配方简单，用料看得见，包装字大、用法清楚。晓艾买手核对配方与代工厂后，把适合居家的代表款带到平台。',
      promise: ['配方简单', '原料可见', '适合长辈'],
      highlights: [
        { ic: 'users', t: '为家里人做', d: '包装字大、用法清楚' },
        { ic: 'leaf', t: '配方看得见', d: '不加复杂添加剂' },
        { ic: 'shield', t: '批次抽检', d: '定期复检原料与成品' },
        { ic: 'headset', t: '平台售后', d: '退换由晓艾客服接待' },
      ],
      process: ['核对配方与原料清单', '样品试用与气味复核', '核对证照与抽检报告', '小批量上架后再扩品'],
      certs: [
        { name: '营业执照', org: '杭州市市监局', at: '2024-05', no: '91330100MA2YYYY' },
        { name: '产品质检报告', org: '第三方检测机构', at: '2026-08', no: 'QA-2026-0821' },
      ],
    },
    syb: {
      id: 'syb', name: '山野本草', mark: '山', art: ['tea', 'sand'], slogan: '一杯看得见原料的养生茶',
      since: 2016, fans: 42000, rating: 4.8, sold: '18 万+', city: '云南昆明',
      origin: '云南高原原料产区',
      factory: '食品生产许可厂房',
      story: '山野本草扎根云南高原，专注原料型养生茶。晓艾买手走访过昆明厂房与原料仓，确认配比简单、证照齐全后，才把代表产品带到平台。',
      promise: ['产区原料', '不加香精', '批次有检'],
      process: ['走访产区与厂房', '样品冲泡与检测', '核对生产许可与证照', '小批量试卖后再扩品'],
      highlights: [
        { ic: 'target', t: '产区走访', d: '买手到过厂房与原料仓' },
        { ic: 'leaf', t: '原料型茶饮', d: '不加糖、不加香精' },
        { ic: 'shield', t: '生产许可', d: '食品生产许可证可查' },
        { ic: 'headset', t: '平台售后', d: '退换由晓艾客服接待' },
      ],
      certs: [
        { name: '营业执照', org: '昆明市市监局', at: '2025-11', no: '91530100MA6ZZZZ' },
        { name: '食品生产许可证', org: '云南省市监局', at: '2025-08', no: 'SC1275301XXXX' },
        { name: '产品质检报告', org: '第三方检测机构', at: '2026-07', no: 'QA-2026-0714' },
      ],
    },
  };
  /* 从产地到上架的共同步骤（用做法呈现，不写口号） */
  D.brandProcess = ['走访产地与厂房', '样品试用与检测', '核对证照与批次报告', '小批量上架后再扩品'];

  /* ---------- 商品（每个商品必挂品牌） ---------- */
  D.products = structuredClone(window.XA_PRODUCT_SEED);
  D.product = (id) => D.products.find((p) => p.id === id);

  /* ---------- 课程 / 图文 ---------- */
  D.courses = [
    {
      id: 'c1', title: '艾灸入门 6 讲：在家就能学会', teacher: '李青禾', teaching: '从辨认艾条、艾柱和艾灸盒开始，再用足三里、关元与气海举例讲解定位，最后讲解使用后的注意事项。', teacherTitle: '中医针灸主治医师 · 从业 15 年', price: 99, art: ['book', 'sage'], learners: 3200,
      intro: '从"艾条怎么拿"讲起，每讲 8 分钟左右，带您认识最常用的保健穴位，学会安全地在家艾灸。',
      fit: ['阳虚质', '气虚质'],
      lessons: [
        { t: '第 1 讲 艾灸是什么？哪些人适合', m: 8, trial: true },
        { t: '第 2 讲 艾条、艾柱、艾灸盒怎么选', m: 9, trial: true },
        { t: '第 3 讲 找准足三里：一个手掌就够', m: 8 },
        { t: '第 4 讲 关元与气海：小腹的温暖', m: 10 },
        { t: '第 5 讲 艾灸后的注意事项', m: 7 },
        { t: '第 6 讲 一周艾灸计划怎么排', m: 9 },
      ],
    },
    {
      id: 'c2', title: '二十四节气养生课：跟着时令过日子', teacher: '周若兰', teaching: '按节气安排课程，从立冬的作息、小雪的饮食，讲到大雪时腰膝的日常养护。', teacherTitle: '中医养生讲师', price: 199, art: ['season', 'mist'], learners: 1800,
      intro: '每个节气一讲：吃什么、怎么睡、灸哪里。当季更新，一年 24 讲。', fit: ['平和质', '气郁质'],
      lessons: [
        { t: '立冬 · 养藏之始，早睡晚起', m: 12, trial: true },
        { t: '小雪 · 温补不上火的吃法', m: 11 },
        { t: '大雪 · 护好腰与膝', m: 12 },
        { t: '冬至 · 一年里最适合艾灸的日子', m: 13 },
      ],
    },
  ];
  D.course = (id) => D.courses.find((c) => c.id === id);

  D.articles = [
    {
      id: 'a1', title: '立冬养藏：三件小事做对了，冬天少受累', author: '晓艾编辑部', badge: '官方', art: ['season', 'mist'], read: 12000, product: 'p3',
      fit: ['阳虚质', '平和质'],
      body: ['立冬是冬季的第一个节气。"冬"有终了、收藏之意，养生重点从"动"转向"藏"。', '一、早睡晚起，等太阳出来再出门。冬天不必和年轻人比早起，睡够了，精神才足。', '二、睡前泡脚，泡到微微出汗。水温 40℃ 左右，泡 15～20 分钟，后背微热就可以了，不要大汗淋漓。', '三、温和艾灸，护住小腹和腰。每周 2～3 次，灸关元、足三里各 10～15 分钟，以温热舒适为度。'],
    },
    {
      id: 'a2', title: '新手艾灸最常问的 6 个问题', author: '李青禾', badge: '中医针灸主治医师', art: ['moxa', 'sand'], read: 8600, product: 'p1',
      fit: ['气虚质', '阳虚质'],
      body: ['Q1：艾灸每次多久合适？—— 新手每个穴位 10～15 分钟，每次 2～3 个穴位即可，贵在坚持而非时间长。', 'Q2：艾灸后可以马上洗澡吗？—— 建议间隔 2 小时以上，先喝一杯温水。', 'Q3：艾灸时感觉很烫怎么办？—— 把艾条拿远一点，温热舒适最好，"烫"并不等于效果好。', 'Q4：哪些情况不适合艾灸？—— 孕期、发热、皮肤破损处、饭后或空腹时不建议艾灸，有基础疾病请先咨询医生。'],
    },
  ];
  D.article = (id) => D.articles.find((a) => a.id === id);

  /* ---------- 短视频（PGC：官方 + 签约达人） ---------- */
  /* ---------- 视频 / 内容账号（PGC：官方 + 品牌号 + 签约达人） ---------- */
  D.creators = [
    { id: 'xa', name: '晓艾官方', badge: '官方', kind: '官方账号', art: ['leaf', 'sage'], cover: ['season', 'mist'], fans: 128000, follows: 26, bio: '晓艾平台官方号。分享节气养生、艾灸科普与精选好物，内容均经平台审核。' },
    { id: 'mmd', name: '明大妈养生', badge: '品牌号', kind: '品牌账号', art: ['bath', 'dusk'], cover: ['bath', 'clay'], fans: 46200, follows: 18, bio: '晓艾精选品牌。专注居家泡脚与暖身好物，用家常话把方法讲清楚。' },
    { id: 'lqh', name: '李青禾', badge: '中医针灸主治医师', kind: '签约达人', art: ['person', 'night'], cover: ['moxa', 'sand'], fans: 89600, follows: 41, bio: '中医针灸主治医师，签约入驻晓艾。讲解常用穴位与日常调理，偏实操、好上手。' },
    { id: 'sybc', name: '山野本草', badge: '品牌号', kind: '品牌账号', art: ['tea', 'ember'], cover: ['tea', 'sand'], fans: 23100, follows: 12, bio: '晓艾精选茶饮品牌。做一杯能在家煮的暖身茶，配方简单、说法清楚。' },
    { id: 'xaj', name: '晓艾家', badge: '官方', kind: '官方账号', art: ['room', 'dusk'], cover: ['room', 'sand'], fans: 67300, follows: 9, bio: '晓艾家门店官方号。带您看看一次到店艾灸是怎样的体验，附近门店可预约。' },
    { id: 'xmb', name: '小满的日常', badge: '签约达人', kind: '签约达人', art: ['moxa', 'sage'], cover: ['leaf', 'sage'], fans: 12400, follows: 88, bio: '记录和妈妈一起养生的小日子，内容由平台代发布并审核。' },
    { id: 'an', name: '阿宁养生笔记', badge: '签约达人', kind: '签约达人', art: ['patch', 'rose'], cover: ['patch', 'rose'], fans: 9800, follows: 56, bio: '办公室党的肩颈自救笔记，签约达人内容，经平台审核。' },
    { id: 'nf', name: '南方有嘉木', badge: '签约达人', kind: '签约达人', art: ['room', 'sand'], cover: ['bed', 'sage'], fans: 15600, follows: 33, bio: '爱逛门店、爱写真实体验，内容经晓艾审核后发布。' },
    { id: 'za', name: '慢慢来的周阿姨', badge: '签约达人', kind: '签约达人', art: ['calendar', 'mist'], cover: ['calendar', 'mist'], fans: 7200, follows: 20, bio: '退休后的养生打卡号，坚持泡脚、艾灸的小目标。' },
  ];
  D.creator = (id) => D.creators.find((c) => c.id === id) || D.creators.find((c) => c.name === id);
  D.creatorByName = (name) => D.creators.find((c) => c.name === name);

  D.videos = [
    { id: 'v1', aid: 'xa', title: '每天 10 分钟灸足三里，新手也能学会', author: '晓艾官方', badge: '官方', art: ['moxa', 'ember'], likes: 12000, binds: [{ type: 'product', id: 'p1' }, { type: 'product', id: 'p2' }, { type: 'product', id: 'p6' }] },
    { id: 'v2', aid: 'mmd', title: '立冬后手脚冰凉？试试这样泡脚，水温和时间是关键', author: '明大妈养生', badge: '品牌号', art: ['bath', 'dusk'], likes: 8400, binds: [{ type: 'product', id: 'p3' }] },
    { id: 'v3', aid: 'lqh', title: '久坐肩颈僵硬，办公室就能做的 3 个放松动作', author: '李青禾', badge: '中医针灸主治医师', art: ['person', 'night'], likes: 15000, binds: [{ type: 'product', id: 'p4' }, { type: 'course', id: 'c1' }] },
    { id: 'v4', aid: 'sybc', title: '一杯暖身茶的做法：红枣、桂圆、枸杞的比例', author: '山野本草', badge: '品牌号', art: ['tea', 'ember'], likes: 5600, binds: [{ type: 'product', id: 'p5' }] },
    { id: 'v5', aid: 'xaj', title: '走进晓艾家：一次 60 分钟的艾灸调理是怎样的体验', author: '晓艾家', badge: '官方', art: ['room', 'dusk'], likes: 9300, binds: [{ type: 'store', id: 's1' }] },
    { id: 'v6', aid: 'xmb', title: '跟着妈妈找关元：肚脐往下四指', author: '小满的日常', badge: '签约达人', art: ['leaf', 'sage'], likes: 4300, binds: [{ type: 'product', id: 'p2' }] },
    { id: 'v7', aid: 'an', title: '肩井按两分钟，肩膀当场松一点', author: '阿宁养生笔记', badge: '签约达人', art: ['person', 'sand'], likes: 6100, binds: [{ type: 'product', id: 'p4' }] },
    { id: 'v8', aid: 'za', title: '泡脚第 30 天：水温我用手试过再下脚', author: '慢慢来的周阿姨', badge: '签约达人', art: ['bath', 'clay'], likes: 2900, binds: [{ type: 'product', id: 'p3' }] },
    { id: 'v9', aid: 'nf', title: '到店艾灸前，我问了老师这三个问题', author: '南方有嘉木', badge: '签约达人', art: ['room', 'sand'], likes: 3700, binds: [{ type: 'store', id: 's1' }] },
    { id: 'v10', aid: 'xa', title: '艾灸后两小时先别洗澡，这三件事先做', author: '晓艾官方', badge: '官方', art: ['moxa', 'sand'], likes: 7800, binds: [{ type: 'product', id: 'p1' }] },
    { id: 'v11', aid: 'lqh', title: '三阴交别找错：内踝往上四横指', author: '李青禾', badge: '中医针灸主治医师', art: ['moxa', 'ember'], likes: 11200, binds: [{ type: 'course', id: 'c1' }] },
    { id: 'v12', aid: 'mmd', title: '睡前泡脚加一片生姜，后背微热就起来', author: '明大妈养生', badge: '品牌号', art: ['bath', 'dusk'], likes: 4500, binds: [{ type: 'product', id: 'p3' }] },
    { id: 'vf1', slot: 'follow', aid: 'lqh', title: '睡前灸三阴交：先找内踝，再量四横指', author: '李青禾', badge: '中医针灸主治医师', art: ['moxa', 'sage'], likes: 2680, binds: [{ type: 'course', id: 'c1' }] },
    { id: 'vf2', slot: 'follow', aid: 'xaj', title: '到店前先在家找准足三里，对照图看一遍', author: '晓艾家', badge: '官方', art: ['room', 'sand'], likes: 1540, binds: [{ type: 'store', id: 's1' }] },
    { id: 'vf3', slot: 'follow', aid: 'lqh', title: '关元灸 15 分钟，温热就停，不要追求烫', author: '李青禾', badge: '中医针灸主治医师', art: ['leaf', 'sand'], likes: 980, binds: [{ type: 'course', id: 'c1' }] },
    { id: 'vf4', slot: 'follow', aid: 'xaj', title: '门店里这一角，是大家最常坐的位置', author: '晓艾家', badge: '官方', art: ['bed', 'sage'], likes: 760, binds: [{ type: 'store', id: 's1' }] },
    { id: 'vf5', slot: 'follow', aid: 'lqh', title: '找不准穴位时，先按到酸胀再放下艾条', author: '李青禾', badge: '中医针灸主治医师', art: ['hand', 'sand'], likes: 1320, binds: [{ type: 'course', id: 'c1' }] },
    { id: 'vm1', slot: 'mine', aid: '', title: '今天给自己灸了关元，温热就停', author: '林阿姨', badge: '我的', art: ['leaf', 'sage'], likes: 12, binds: [{ type: 'product', id: 'p1' }] },
    { id: 'vm2', slot: 'mine', aid: '', title: '泡脚 20 分钟，脚暖了就擦干穿袜', author: '林阿姨', badge: '我的', art: ['bath', 'clay'], likes: 8, binds: [{ type: 'product', id: 'p3' }] },
    { id: 'vm3', slot: 'mine', aid: '', title: '今晚只灸了足三里，一边 10 分钟', author: '林阿姨', badge: '我的', art: ['moxa', 'sage'], likes: 5, binds: [{ type: 'product', id: 'p1' }] },
    { id: 'vm4', slot: 'mine', aid: '', title: '老伴说肩井按完，抬手轻一点', author: '林阿姨', badge: '我的', art: ['person', 'sand'], likes: 3, binds: [{ type: 'product', id: 'p4' }] },
    { id: 'vm5', slot: 'mine', aid: '', title: '周日去门店之前，先在家看了一遍穴位', author: '林阿姨', badge: '我的', art: ['room', 'dusk'], likes: 9, binds: [{ type: 'store', id: 's1' }] },
  ];
  D.videoOf = (id) => D.videos.find((v) => v.id === id);
  D.videosOf = (aid) => D.videos.filter((v) => v.aid === aid && !v.slot);

  /* ---------- 社区（浏览态：官方 + 达人内容，无发布、无评论） ---------- */
  D.topics = [
    { id: 't1', name: '立冬养藏', desc: '立冬到，万物收藏。来看看大家怎么过这个冬天。', count: 126, official: true, art: ['season', 'mist'] },
    { id: 't2', name: '新手艾灸', desc: '第一次艾灸不用慌，从这里开始。', count: 208, official: true, art: ['moxa', 'sage'] },
    { id: 't3', name: '泡脚这件小事', desc: '每晚 20 分钟，睡个好觉。', count: 94, art: ['bath', 'clay'] },
    { id: 't4', name: '办公室养生', desc: '久坐族的自救指南。', count: 73, art: ['person', 'sand'] },
    { id: 't5', name: '冬日进补', desc: '冬天怎么吃，暖而不燥。', count: 61, art: ['tea', 'sand'] },
  ];
  D.topic = (id) => D.topics.find((t) => t.id === id);
  D.notes = [
    { id: 'n1', aid: 'xmb', title: '妈妈艾灸一个月的变化，我也跟着学起来了', author: '小满的日常', source: 'creator', art: ['moxa', 'sage'], r: 1.25, likes: 2300, topic: 't2', product: 'p1', imgs: [['moxa', 'sage'], ['box', 'sand'], ['leaf', 'sage']], body: ['妈妈一到冬天就手脚冰凉，上个月开始每周灸三次足三里和关元。', '一开始她嫌麻烦，后来我给她买了随身灸盒，绑上就能看电视，现在不用催自己就灸上了。', '她说最明显的感觉是晚上脚暖得快了，睡得也踏实一些。我也准备跟着一起坚持。'] },
    { id: 'n2', aid: 'xa', title: '立冬泡脚指南｜水温、时间、加什么，一张图说清', author: '晓艾官方', source: 'official', art: ['bath', 'clay'], r: 1, likes: 5100, topic: 't1', product: 'p3', imgs: [['bath', 'clay'], ['season', 'mist']], body: ['水温：40℃ 左右，手摸着温热不烫。', '时间：15～20 分钟，后背微微发热就好。', '加什么：艾叶 + 生姜最家常，怕麻烦可以直接用足浴包。', '注意：饭后半小时内不泡，泡完及时擦干穿袜。'] },
    { id: 'n3', aid: 'an', title: '办公室肩颈自救：我的抽屉里常备这三样', author: '阿宁养生笔记', source: 'creator', art: ['patch', 'rose'], r: 1.35, likes: 1800, topic: 't4', product: 'p4', imgs: [['patch', 'rose'], ['person', 'sand']], body: ['每天对着电脑八小时，肩膀硬得像石头。', '我的办法：每小时起来活动两分钟；下午贴一片热敷贴；下班前按一按肩井穴。', '坚持了两周，肩颈确实松快了不少。'] },
    { id: 'n4', aid: 'nf', title: '第一次去晓艾家，说说真实感受', author: '南方有嘉木', source: 'creator', art: ['room', 'sand'], r: 1.1, likes: 3200, topic: 't2', store: true, imgs: [['room', 'sand'], ['bed', 'sage'], ['tea', 'clay']], body: ['朋友推荐的，周末约了一次 60 分钟的经典艾灸调理。', '环境很安静，进门先喝一杯姜枣茶。艾灸师会先问最近的睡眠和身体感受，再决定灸哪些位置。', '整个过程很舒服，中途差点睡着。结束后还有茶歇，可以坐着缓一缓再走。'] },
    { id: 'n5', aid: 'sybc', title: '冬天的第一杯暖身茶，在家五分钟搞定', author: '山野本草', source: 'official', art: ['tea', 'sand'], r: 1.3, likes: 960, topic: 't1', product: 'p5', imgs: [['tea', 'sand']], body: ['红枣三颗、桂圆五颗、枸杞一小把，沸水焖五分钟。', '不想自己配的话，也可以用独立小包装，出门带着方便。'] },
    { id: 'n6', aid: 'lqh', title: '艾灸前后要注意什么？收藏这 5 条就够了', author: '李青禾', source: 'creator', art: ['leaf', 'sage'], r: 1, likes: 4200, topic: 't2', imgs: [['leaf', 'sage'], ['moxa', 'sand']], body: ['一、灸前喝一杯温水，不要空腹或刚吃饱。', '二、室内通风但避免直吹。', '三、温热为度，不追求"越烫越好"。', '四、灸后 2 小时内不洗澡、不碰冷水。', '五、身体不适或有基础疾病，请先咨询医生。'] },
    { id: 'n7', aid: 'xa', title: '给爸妈的冬日养生清单，照着买不出错', author: '晓艾官方', source: 'official', art: ['box', 'clay'], r: 1.2, likes: 2700, topic: 't1', product: 'p2', imgs: [['box', 'clay'], ['bath', 'sage']], body: ['艾灸盒：解放双手，长辈也能自己操作。', '足浴包：睡前泡一泡，简单好坚持。', '热敷贴：肩颈、腰部随时暖一暖。'] },
    { id: 'n8', aid: 'za', title: '坚持泡脚 30 天打卡记录', author: '慢慢来的周阿姨', source: 'creator', art: ['calendar', 'mist'], r: 1.15, likes: 1500, topic: 't3', product: 'p3', imgs: [['calendar', 'mist'], ['bath', 'clay']], body: ['退休后给自己定的第一个小目标：每晚泡脚 20 分钟。', '现在第 30 天，已经成了习惯，不泡反而睡不着。'] },
    { id: 'n9', aid: 'sybc', title: '冬天进补不必猛，一碗热汤就够暖', author: '山野本草', source: 'official', art: ['tea', 'sand'], r: 1.1, likes: 880, topic: 't5', product: 'p5', imgs: [['tea', 'sand']], body: ['冬天进补宜缓，先喝一碗热汤。', '萝卜、牛腩小火煮软，配一点姜片，暖而不燥。'] },
    { id: 'n10', aid: 'lqh', title: '找足三里：外膝眼向下四指，再旁开一指', author: '李青禾', source: 'creator', art: ['moxa', 'sand'], r: 1.32, likes: 3600, topic: 't2', imgs: [['moxa', 'sand'], ['hand', 'sage']], body: ['坐下屈膝，先摸到膝盖外侧的小坑。', '向下量四横指，再向小腿骨外侧移一横指，按着酸胀就是足三里。'] },
    { id: 'n11', aid: 'za', title: '灸完喝温水，这两小时我不出门吹风', author: '慢慢来的周阿姨', source: 'creator', art: ['tea', 'clay'], r: 1.05, likes: 640, topic: 't2', imgs: [['tea', 'clay']], body: ['灸完先坐一会儿，喝一杯温水。', '两小时内不洗澡，也不对着窗户吹。'] },
    { id: 'n12', aid: 'an', title: '午休十分钟，我只做这一套肩颈', author: '阿宁养生笔记', source: 'creator', art: ['person', 'sand'], r: 1.4, likes: 2100, topic: 't4', imgs: [['person', 'sand']], body: ['低头含胸转一转，再按肩井两分钟。', '不求一次见效，下午不那么僵就行。'] },
    { id: 'n13', aid: 'xaj', title: '第一次到店，前台会先问您这三句', author: '晓艾家', source: 'official', art: ['room', 'dusk'], r: 1.18, likes: 1540, topic: 't2', store: true, imgs: [['room', 'dusk'], ['bed', 'sage']], body: ['最近睡眠怎么样，怕不怕冷，有没有不适合艾灸的情况。', '问完再安排房间，不用自己挑穴位。'] },
    { id: 'n14', aid: 'mmd', title: '泡脚水凉了就加一点，不要一次倒太烫', author: '明大妈养生', source: 'official', art: ['bath', 'dusk'], r: 1.22, likes: 1280, topic: 't3', product: 'p3', imgs: [['bath', 'dusk']], body: ['先倒温水，手试过再下脚。', '中途凉了，沿盆边加一点热水，不要直接浇在脚上。'] },
    { id: 'n15', aid: 'xa', title: '给爸妈准备的艾灸盒，我放在沙发扶手上', author: '晓艾官方', source: 'official', art: ['box', 'sand'], r: 1.08, likes: 2460, topic: 't1', product: 'p2', imgs: [['box', 'sand']], body: ['盒子就放在伸手能拿到的地方。', '想起来就灸一会儿，比规定每天几点更容易坚持。'] },
    { id: 'n16', aid: 'nf', title: '门店茶歇那一杯姜枣茶，我回家也煮了', author: '南方有嘉木', source: 'creator', art: ['tea', 'ember'], r: 1.26, likes: 990, topic: 't5', imgs: [['tea', 'ember']], body: ['姜三片、红枣两颗，煮开转小火。', '不放糖，温热喝完就睡。'] },
    { id: 'n17', aid: 'xmb', title: '妈妈说不烫才算会灸，我把时间改短了', author: '小满的日常', source: 'creator', art: ['leaf', 'sage'], r: 1.16, likes: 760, topic: 't2', imgs: [['leaf', 'sage']], body: ['以前总想一次灸久一点。', '现在一边穴位十分钟，温热就拿开。'] },
    { id: 'nf1', slot: 'follow', aid: 'xmb', title: '跟着妈妈打卡第七天，今晚灸的是足三里', author: '小满的日常', source: 'creator', art: ['moxa', 'sage'], r: 1.2, likes: 326, topic: 't2', imgs: [['moxa', 'sage']], body: ['妈妈说不用追求时间长，温热舒适就好。', '我把艾灸盒放在沙发扶手上，看电视的时候顺手灸一会儿。'] },
    { id: 'nf2', slot: 'follow', aid: 'an', title: '午休按了按肩井，下午肩膀没那么僵', author: '阿宁养生笔记', source: 'creator', art: ['person', 'sand'], r: 1.28, likes: 214, topic: 't4', imgs: [['person', 'sand']], body: ['对着电脑坐到中午，肩膀会发紧。', '午休时低头找到肩部最高处，轻轻按两分钟，下午会松一点。'] },
    { id: 'nf3', slot: 'follow', aid: 'xmb', title: '妈妈今晚改灸关元，盒子就搁在毯子上', author: '小满的日常', source: 'creator', art: ['box', 'sand'], r: 1.12, likes: 188, topic: 't1', imgs: [['box', 'sand']], body: ['她自己把盒子摆好，我只帮忙看时间。', '十五分钟到了就收，不贪多。'] },
    { id: 'nf4', slot: 'follow', aid: 'an', title: '抽屉里的热敷贴，下午贴一片就够', author: '阿宁养生笔记', source: 'creator', art: ['patch', 'rose'], r: 1.34, likes: 256, topic: 't4', product: 'p4', imgs: [['patch', 'rose']], body: ['贴在肩井附近，不贴到脖子。', '下班前揭掉，回家再泡脚。'] },
    { id: 'nf5', slot: 'follow', aid: 'xaj', title: '这周到店的人，大多先问睡眠', author: '晓艾家', source: 'official', art: ['bed', 'sage'], r: 1.1, likes: 402, topic: 't2', store: true, imgs: [['bed', 'sage']], body: ['睡不踏实的，老师会先看能不能安排温和的一组。', '预约时把最近的感觉说一下就好。'] },
    { id: 'nm1', slot: 'mine', aid: '', title: '立冬后我把艾灸盒放在沙发边', author: '林阿姨', source: 'mine', art: ['box', 'sand'], r: 1.15, likes: 6, topic: 't1', imgs: [['box', 'sand'], ['leaf', 'sage']], body: ['艾灸盒就放在沙发边，想起来就灸一灸关元。', '不烫就行，灸完喝一杯温水。'] },
    { id: 'nm2', slot: 'mine', aid: '', title: '给老伴也安排了睡前泡脚', author: '林阿姨', source: 'mine', art: ['bath', 'dusk'], r: 1.05, likes: 4, topic: 't3', product: 'p3', imgs: [['bath', 'dusk']], body: ['水温用手试过，温热不烫。', '泡到后背微微发热就起来，擦干再穿袜子。'] },
    { id: 'nm3', slot: 'mine', aid: '', title: '今天只按了肩井，没上艾条', author: '林阿姨', source: 'mine', art: ['person', 'sand'], r: 1.24, likes: 2, topic: 't4', imgs: [['person', 'sand']], body: ['肩膀发紧，就按了两分钟。', '酸胀就停，没有硬按。'] },
    { id: 'nm4', slot: 'mine', aid: '', title: '周日的到店，我提前一天看了穴位图', author: '林阿姨', source: 'mine', art: ['room', 'sand'], r: 1.18, likes: 7, topic: 't2', imgs: [['room', 'sand']], body: ['先把足三里和关元在图上对了一遍。', '到店让老师再确认，自己心里有数。'] },
    { id: 'nm5', slot: 'mine', aid: '', title: '晚上这杯姜枣茶，比点心暖', author: '林阿姨', source: 'mine', art: ['tea', 'ember'], r: 1.3, likes: 3, topic: 't5', imgs: [['tea', 'ember']], body: ['姜片少放，红枣两颗。', '温的时候喝完，不留到凉。'] },
  ];
  D.notesOf = (aid) => D.notes.filter((n) => n.aid === aid && !n.slot);
  D.note = (id) => D.notes.find((n) => n.id === id);

  /* ---------- 穴位（坐标对应人体示意图 200×440） ---------- */
  D.points = [
    { id: 'zusanli', name: '足三里', py: 'Zú sān lǐ', meridian: '足阳明胃经', part: '下肢', view: 'front', x: 75, y: 352, min: 15, locate: '膝盖外侧凹陷（外膝眼）向下四横指，小腿骨外侧一横指处。', benefit: '常用保健要穴。日常艾灸有助于调理脾胃、补益气血，适合容易疲乏、消化不好的人。', caution: '饭后一小时内不宜艾灸此穴。', steps: ['坐下，屈起一边膝盖', '在外膝眼（膝盖外侧凹陷）向下量四横指', '再向小腿骨外侧移一横指，按压有酸胀感处'] },
    { id: 'guanyuan', name: '关元', py: 'Guān yuán', meridian: '任脉', part: '胸腹', view: 'front', x: 100, y: 218, min: 15, locate: '肚脐正下方四横指（约 3 寸）处。', benefit: '温养下焦的常用穴位，适合怕冷、手脚冰凉人群的日常保健。', caution: '孕期请勿艾灸腹部穴位。', steps: ['躺平或坐好，露出小腹', '先找到肚脐正中', '从肚脐正中向下量四横指（约 3 寸），正中线上'] },
    { id: 'qihai', name: '气海', py: 'Qì hǎi', meridian: '任脉', part: '胸腹', view: 'front', x: 100, y: 197, min: 10, locate: '肚脐正下方两横指（约 1.5 寸）处。', benefit: '有"元气之海"之称，日常艾灸有助于补益元气、缓解疲劳。', caution: '孕期请勿艾灸腹部穴位。' },
    { id: 'shenque', name: '神阙', py: 'Shén què', meridian: '任脉', part: '胸腹', view: 'front', x: 100, y: 176, min: 10, locate: '肚脐正中。', benefit: '温暖腹部的常用保健穴，建议使用艾灸盒隔物温灸。', caution: '不可直接灸，注意防烫。' },
    { id: 'zhongwan', name: '中脘', py: 'Zhōng wǎn', meridian: '任脉', part: '胸腹', view: 'front', x: 100, y: 144, min: 10, locate: '肚脐正上方约一掌（4 寸）处，胸骨下端与肚脐连线的中点。', benefit: '调理脾胃的常用穴位，适合胃口不佳、饭后腹胀时的日常保健。', caution: '饭后一小时内不宜艾灸。' },
    { id: 'neiguan', name: '内关', py: 'Nèi guān', meridian: '手厥阴心包经', part: '上肢', view: 'front', x: 157, y: 204, min: 10, locate: '手腕横纹向上三横指，两条筋之间。', benefit: '宁心安神的常用穴位，适合睡前按揉或温灸。', caution: '温灸时注意距离，手腕皮肤较薄。', steps: ['伸出前臂，掌心向上', '从手腕横纹向上量三横指', '两条筋腱正中间，按压有酸胀感'] },
    { id: 'hegu', name: '合谷', py: 'Hé gǔ', meridian: '手阳明大肠经', part: '上肢', view: 'front', x: 165, y: 240, min: 10, locate: '手背，拇指与食指并拢时肌肉隆起的最高点。', benefit: '头面部不适时常用的保健穴位，可按揉或温灸。', caution: '孕期请勿刺激此穴。' },
    { id: 'sanyinjiao', name: '三阴交', py: 'Sān yīn jiāo', meridian: '足太阴脾经', part: '下肢', view: 'front', x: 117, y: 396, min: 10, locate: '内踝尖向上四横指，小腿骨后缘。', benefit: '女性保健常用穴位，日常温灸有助于调和气血、改善睡眠。', caution: '孕期请勿刺激此穴。' },
    { id: 'baihui', name: '百会', py: 'Bǎi huì', meridian: '督脉', part: '头颈', view: 'front', x: 100, y: 16, min: 5, locate: '头顶正中，两耳尖连线与头部正中线的交点。', benefit: '提神醒脑、安神助眠的常用穴位，以按揉为主。', caution: '头部艾灸请由专业人员操作。' },
    { id: 'dazhui', name: '大椎', py: 'Dà zhuī', meridian: '督脉', part: '头颈', view: 'back', x: 100, y: 74, min: 10, locate: '低头时颈后最突出的骨头（第七颈椎）下方凹陷处。', benefit: '受凉怕冷、肩颈僵硬时常用的保健穴位。', caution: '发热时不宜艾灸。' },
    { id: 'jianjing', name: '肩井', py: 'Jiān jǐng', meridian: '足少阳胆经', part: '头颈', view: 'back', x: 74, y: 84, min: 10, locate: '大椎与肩峰连线的中点，肩部最高处。', benefit: '久坐低头族放松肩颈的常用穴位，可按揉或温灸。', caution: '孕期请勿刺激此穴。', steps: ['低头，找到颈后最突出的骨头（大椎）', '从大椎水平摸到肩头最高点', '两者连线正中、肩部最高处'] },
    { id: 'shenshu', name: '肾俞', py: 'Shèn shū', meridian: '足太阳膀胱经', part: '腰背', view: 'back', x: 86, y: 188, min: 15, locate: '与肚脐同高的后腰处，脊柱旁开两横指。', benefit: '腰部保健常用穴位，适合久坐腰酸、怕冷人群。', caution: '建议使用艾灸盒，注意防烫。', steps: ['站立或俯卧，先摸肚脐高度', '转到后腰，脊柱旁开两横指', '与肚脐同高的位置，两侧各一'] },
    { id: 'mingmen', name: '命门', py: 'Mìng mén', meridian: '督脉', part: '腰背', view: 'back', x: 100, y: 188, min: 15, locate: '后腰正中，与肚脐相对的位置。', benefit: '温养腰部的常用保健穴位，冬季艾灸尤为适合。', caution: '建议使用艾灸盒，注意防烫。' },
    { id: 'weizhong', name: '委中', py: 'Wěi zhōng', meridian: '足太阳膀胱经', part: '下肢', view: 'back', x: 80, y: 334, min: 10, locate: '膝盖后方腘窝横纹的中点。', benefit: '有"腰背委中求"之说，腰背不适时常用的保健穴位。', caution: '此处皮肤薄，温灸距离宜稍远。' },
    { id: 'yongquan', name: '涌泉', py: 'Yǒng quán', meridian: '足少阴肾经', part: '下肢', view: 'back', x: 122, y: 424, min: 10, locate: '脚底前三分之一处，卷足时的凹陷中。', benefit: '睡前温灸或泡脚后按揉，有助于引火下行、安神助眠。', caution: '糖尿病足人群请遵医嘱。' },
  ];
  // 图谱扩展条目仅提供定位资料，不自动生成施灸时长和方案。
  // 定位资料参考 WHO 标准穴位定位、GB/T 40997—2021 和中国医药信息查询平台失眠穴条目。
  D.atlasExtras = [
    ['qianding','前顶','头颈','head','GV21','头顶正中线上，百会向前 1.5 骨度分寸。'],
    ['houding','后顶','头颈','head','GV19','头顶正中线上，百会向后 1.5 骨度分寸。'],
    ['xinhui','囟会','头颈','head','GV22','头部正中线上，前发际中点向后 2 骨度分寸。'],
    ['shangxing','上星','头颈','head','GV23','头部正中线上，前发际中点向后 1 骨度分寸。'],
    ['sishencong','四神聪','头颈','head','经外奇穴','围绕百会，前、后、左、右各旁开 1 寸，共四处。'],
    ['lineiting','里内庭','下肢','sole','经外奇穴','足底前掌，第二、三跖趾关节前方的凹陷处。'],
    ['duyin','独阴','下肢','sole','EX-LE11','第二趾底面，靠近趾尖的趾间关节横纹中央。'],
    ['shimian','失眠穴','下肢','sole','经外奇穴','位于足跟底面中央，左右脚各一处。'],
    ['quchi','曲池','上肢','front','LI11','屈肘时，位于肘部外侧，肘横纹外侧端附近。'],
    ['danzhong','膻中','胸腹','front','CV17','胸部前正中线，平第四肋间隙。'],
    ['dazhu','大杼','腰背','back','BL11','上背部，第一胸椎棘突下缘水平，后正中线旁开 1.5 骨度分寸。'],
  ].map(([id,name,part,view,code,locate]) => ({ id,name,part,view,code,locate }));
  D.atlasPoints = D.points.concat(D.atlasExtras);
  D.point = (id) => D.points.find((p) => p.id === id);
  /* 人体示意图上的对照标志，帮用户把穴位和身体部位对应起来 */
  D.landmarks = {
    front: [
      { x: 100, y: 176, t: '肚脐' },
      { x: 100, y: 118, t: '胸口' },
      { x: 72, y: 300, t: '膝' },
      { x: 128, y: 300, t: '膝' },
      { x: 158, y: 248, t: '腕' },
    ],
    back: [
      { x: 100, y: 70, t: '颈底' },
      { x: 100, y: 188, t: '腰正中' },
      { x: 80, y: 300, t: '膝后' },
      { x: 120, y: 418, t: '脚底' },
    ],
  };
  /* 聚焦某个穴位时，裁出附近区域，方便看准位置 */
  D.pointZoom = (p) => {
    const pad = p.part === '下肢' ? 70 : p.part === '上肢' ? 60 : 58;
    return { x: Math.max(0, p.x - pad), y: Math.max(0, p.y - pad), w: Math.min(200, pad * 2), h: Math.min(440, pad * 2.2) };
  };
  D.locateSteps = (p) => {
    const viewName = { front: '正面', back: '背面', head: '头顶', sole: '足底' }[p.view] || '身体';
    return p.steps || [
      `先对照${viewName}示意图，找到「${p.part}」区域`,
      p.locate,
      '用指腹轻轻按压，酸胀感最明显的地方就是穴位点',
    ];
  };
  /* 艾灸计时：按要解决的问题 / 总时长，生成穴位方案 */
  D.timerPlans = [
    { id: 'quick', name: '轻量保健', mins: 20, desc: '时间紧也能完成' },
    { id: 'std', name: '日常调理', mins: 30, desc: '最常用', hot: true },
    { id: 'deep', name: '深度温养', mins: 45, desc: '穴位更从容' },
  ];
  D.timerTracks = [
    { id: 'mist', name: '晨雾', desc: '轻柔氛围', freqs: [174.61, 220, 261.63], type: 'sine', gain: 0.045 },
    { id: 'bamboo', name: '竹林', desc: '清透舒缓', freqs: [196, 246.94, 311.13], type: 'triangle', gain: 0.032 },
    { id: 'tea', name: '暖茶', desc: '低频温暖', freqs: [110, 164.81, 220], type: 'sine', gain: 0.05 },
  ];
  /* 按穴位建议时长比例，把总分钟数分给各个穴位（最短 5 分钟） */
  D.allocMins = (ids, total) => {
    const pts = ids.map(D.point).filter(Boolean);
    if (!pts.length) return [];
    const sum = pts.reduce((a, p) => a + p.min, 0) || 1;
    let left = total;
    const out = pts.map((p, i) => {
      const m = i === pts.length - 1 ? left : Math.max(5, Math.round(total * p.min / sum));
      left -= m;
      return { id: p.id, min: m };
    });
    if (left !== 0 && out.length) out[out.length - 1].min = Math.max(5, out[out.length - 1].min + left);
    return out;
  };

  D.symptoms = [
    { id: 'sleep', name: '睡不踏实', icon: 'clock', pts: ['baihui', 'neiguan', 'sanyinjiao', 'yongquan'], tip: '睡前一小时进行，灸后喝少量温水，放下手机。', product: 'p3' },
    { id: 'neck', name: '肩颈僵硬', icon: 'user', pts: ['dazhui', 'jianjing', 'hegu'], tip: '配合每小时起身活动两分钟，效果更好。', product: 'p4' },
    { id: 'cold', name: '手脚冰凉', icon: 'flame', pts: ['guanyuan', 'mingmen', 'zusanli', 'yongquan'], tip: '建议每周 3 次，冬季坚持更明显。', product: 'p1' },
    { id: 'stomach', name: '胃口不好', icon: 'leaf', pts: ['zhongwan', 'zusanli', 'neiguan'], tip: '饭后一小时再进行，饮食宜温软。', product: 'p2' },
    { id: 'period', name: '经期不适', icon: 'heart', pts: ['guanyuan', 'qihai', 'sanyinjiao'], tip: '经期前一周开始温灸，经期量多时暂停。', product: 'p2' },
    { id: 'tired', name: '容易疲劳', icon: 'body', pts: ['qihai', 'zusanli', 'guanyuan'], tip: '上午或午后进行，避免睡前过度艾灸。', product: 'p1' },
    { id: 'waist', name: '腰膝酸软', icon: 'target', pts: ['shenshu', 'mingmen', 'weizhong'], tip: '使用艾灸盒更方便，注意腰部保暖。', product: 'p2' },
    { id: 'chill', name: '受凉怕冷', icon: 'bell', pts: ['dazhui', 'shenque', 'zusanli'], tip: '灸后注意避风保暖。', product: 'p1' },
  ];
  D.symptom = (id) => D.symptoms.find((s) => s.id === id);

  /* ---------- 体质测试（演示题目；正式量表待确认 A5） ---------- */
  D.quiz = [
    { q: '您容易感到疲乏，说话没力气吗？', type: '气虚质' },
    { q: '您手脚发凉，比别人更怕冷吗？', type: '阳虚质' },
    { q: '您常感到手心脚心发热、口干咽燥吗？', type: '阴虚质' },
    { q: '您感到身体沉重、腹部松软肥满吗？', type: '痰湿质' },
    { q: '您面部容易出油、口苦或长痘吗？', type: '湿热质' },
    { q: '您的皮肤容易出现青紫瘀斑、面色偏暗吗？', type: '血瘀质' },
    { q: '您常感到闷闷不乐、情绪低沉吗？', type: '气郁质' },
    { q: '您容易过敏（打喷嚏、皮肤起疹）吗？', type: '特禀质' },
    { q: '您精力充沛、睡眠良好吗？', type: '平和质' },
  ];
  D.quizOpts = ['没有', '很少', '有时', '经常', '总是'];
  D.types = {
    平和质: { desc: '精力充沛、睡眠良好，身体状态比较均衡。', life: '保持规律作息，顺应节气调整起居。', lifeMore: '作息尽量固定。换季时衣着随气温加减，运动量维持现在觉得轻松的程度即可。', food: '饮食多样、不偏食，七分饱。', foodMore: '三餐定时，荤素都有一点。口味清淡些，吃到七分饱就停，不必额外进补。', pts: ['zusanli', 'guanyuan'] },
    气虚质: { desc: '容易疲乏、气短，说话声音偏低，稍一活动就出汗。', life: '避免熬夜和过度劳累，适合散步、八段锦等和缓运动。', lifeMore: '走路、八段锦这类不喘的活动更合适。一次不要太久，觉得累就歇，白天也可以小憩一会儿。', food: '宜吃山药、红枣、小米等温和补气的食物。', foodMore: '饭菜温软、好消化。山药、红枣、小米可以常备，生冷和过于油腻的少吃。', pts: ['qihai', 'zusanli', 'guanyuan'] },
    阳虚质: { desc: '平时比较怕冷，手脚容易凉，温热的饮食会觉得舒服些。', life: '注意腰腹和脚部保暖，多晒太阳，睡前泡脚。', lifeMore: '腰、腹和脚先保暖。上午晒一会儿太阳。晚上用温水泡脚，后背微微发热就可以，不必泡到出很多汗。', food: '宜吃生姜、羊肉、桂圆等温性食物，少吃生冷。', foodMore: '日常饮食以温热为主。生姜、羊肉、桂圆可以适量。冰饮和刚从冰箱拿出的水果少碰。', pts: ['guanyuan', 'mingmen', 'zusanli'] },
    阴虚质: { desc: '手心脚心发热，口干咽燥，睡眠偏浅。', life: '早睡不熬夜，避免大汗淋漓的剧烈运动。', lifeMore: '尽量早点睡。白天活动到微微出汗就停，不要追求大汗。房间不必过暖，口干时小口喝温水。', food: '宜吃银耳、百合、梨等滋润食物，少吃辛辣。', foodMore: '银耳、百合、梨可以换着吃。少吃辛辣煎炸，浓茶和酒也少一些。', pts: ['sanyinjiao', 'yongquan'] },
    痰湿质: { desc: '身体沉重、容易困倦，腹部松软，口中黏腻。', life: '坚持适量运动，居住环境保持干爽。', lifeMore: '每天留出走路或活动的时间。久坐时起来动一动。住的地方尽量干爽、通通风。', food: '饮食清淡，少甜少油，宜吃薏米、冬瓜。', foodMore: '少甜、少油、少夜宵。薏米、冬瓜可以经常吃。一餐吃到七分饱就够。', pts: ['zhongwan', 'zusanli'] },
    湿热质: { desc: '面部易出油、易长痘，口苦，容易烦躁。', life: '避免熬夜，保持皮肤清洁与情绪平稳。', lifeMore: '少熬夜。皮肤出油时先清洁、勤换枕巾。觉得烦躁时先停下来走一走，不急着继续做事。', food: '少吃辛辣油腻和甜食，宜吃绿豆、苦瓜。', foodMore: '辛辣、油炸和甜食少吃。绿豆、苦瓜可以换着吃。酒尽量少喝。', pts: ['hegu', 'sanyinjiao'] },
    血瘀质: { desc: '面色偏暗，皮肤容易出现瘀斑，肩颈易僵硬。', life: '多活动、少久坐，注意保暖促进循环。', lifeMore: '少久坐，隔一会儿起来走一走、转一转肩颈。腰和肩颈注意保暖，衣服别勒得太紧。', food: '宜吃山楂、黑木耳、玫瑰花茶。', foodMore: '山楂、黑木耳、玫瑰花茶可以常备。少吃生冷，饭菜软一些、温一些。', pts: ['sanyinjiao', 'hegu', 'dazhui'] },
    气郁质: { desc: '容易闷闷不乐、多思多虑，常叹气。', life: '多出门走走、与朋友聊天，培养兴趣爱好。', lifeMore: '每天出门走一走，和人说几句话。有喜欢的事就留一点时间做，一天不必排得太满。', food: '宜喝玫瑰花茶、陈皮水，少饮浓茶咖啡。', foodMore: '玫瑰花茶、陈皮水可以当日常喝的。浓茶和咖啡少喝，晚饭不要太晚。', pts: ['neiguan', 'baihui'] },
    特禀质: { desc: '容易过敏，换季时打喷嚏、皮肤起疹。', life: '注意避开过敏原，换季做好防护。', lifeMore: '换季时留意花粉、尘螨这些容易不适的东西。出门可以带一件薄外套，回家先洗手、换衣服。', food: '饮食清淡均衡，避免已知的致敏食物。', foodMore: '饮食清淡，新的食物一次别加太多。已经知道会不舒服的食物就避开。', pts: ['zusanli', 'shenque'] },
  };

  /* ---------- 门店（门店 Tab = 连接所有门店的列表：定位 + 距离排序 + 结构化标签筛选；数据均为演示） ----------
   * brand:  xaj = 晓艾家（自营旗舰店） / yq = 元气地带（云连锁店） / biz = 其他商家门店
   * linked: true = 已接入晓艾（可在线预约、可核销美团/抖音团购券、消费攒积分）
   *         false = 未接入，只展示基础信息与信息来源（src，如高德地图）
   * groupon: 该门店支持核销的团购券平台
   */
  D.located = { city:'武汉', spot:'江汉路', status:'granted' };
  D.nearbyRadius = 1;
  D.withinRadius = (store, km) => store.km != null && store.km <= km;
  D.cities = ['杭州', '上海', '武汉'];
  D.xajiaIntro = '晓艾家是晓艾自营的会员制养生空间。一间安静的屋子，一杯热茶，一次不赶时间的艾灸。';
  /* 对外不出现「云连锁」术语：yq 对客户显示为「品牌连锁」；已接入门店另打「晓艾会认证」「推荐」等 icon */
  D.storeBrands = {
    xaj: { name: '晓艾家', label: '自营旗舰', full: '晓艾家 · 自营旗舰店', desc: '晓艾自营旗舰店，可在线预约，晓艾家会籍与晓艾会权益通用。' },
    yq: { name: '元气地带', label: '品牌连锁', full: '元气地带 · 品牌连锁', desc: '元气地带品牌连锁门店，已通过晓艾会认证：可在线预约，到店消费攒晓艾会积分。' },
    biz: { name: '合作商家', label: '合作商家', full: '合作商家 · 晓艾会认证', desc: '合作商家门店，已通过晓艾会认证：可在线预约，到店消费攒晓艾会积分。' },
  };
  D.storeKinds = [['all', '全部门店'], ['xaj', '晓艾家', '自营旗舰店'], ['yq', '元气地带', '品牌连锁'], ['other', '其他门店', '合作商家与周边门店']];
  /* 门店卡片/详情上的对外标识：品牌类型 + 晓艾会认证 + 推荐（rec） */
  D.storeBadges = (s, opt) => {
    /* opt.withBrand：详情页需要带上品牌类型；列表卡片图上已有品牌角标，这里只补认证/推荐 */
    if (!s.linked) return [{ cls: 'sb-un', t: '未接入' }];
    const list = [];
    if (opt && opt.withBrand) list.push({ cls: 'sb-' + s.brand, t: D.storeBrands[s.brand].label });
    list.push({ cls: 'sb-cert', t: '晓艾会认证' });
    if (s.rec) list.push({ cls: 'sb-rec', t: '推荐' });
    return list;
  };
  D.inKind = (s, k) => k === 'all' || (k === 'other' ? s.brand === 'biz' : s.brand === k);
  /* 结构化标签：运营后台按分组维护，前端用于筛选与卡片展示 */
  D.storeTagGroups = [
    { group: '到店方便', tags: ['近地铁', '免费停车', '无障碍通道'] },
    { group: '空间环境', tags: ['独立单间', '双人间', '低烟环境', '茶歇区'] },
    { group: '服务特色', tags: ['女艾灸师', '夜间营业', '新客体验价'] },
    { group: '支付与权益', tags: ['团购券可核销', '会员优先时段'] },
  ];
  D.storeQuickTags = ['团购券可核销', '近地铁', '免费停车', '独立单间'];
  D.stores = [
    { id: 'st8', metro: '文三路站', brand: 'yq', linked: true, rec: true, groupon: ['美团', '抖音'], name: '元气地带 · 文三路店', city: '杭州', district: '西湖区', area: '文三路', km: 0.6, rating: 4.7, reviews: 86, hours: '09:30 – 21:30', phone: '0571-8666 1001',
      address: '西湖区文三路 数码大厦旁 1 层', tags: ['团购券可核销', '近地铁', '女艾灸师', '新客体验价'],
      services: ['s1', 's2', 's4'], staff: ['w7', 'w8'], gallery: [['bed', 'mist'], ['moxa', 'sand']] },
    { id: 'u1', brand: 'biz', linked: false, src: '高德地图', cat: '艾灸馆', name: '艾草堂艾灸养生馆', city: '杭州', district: '西湖区', area: '学院路', km: 0.9, hours: '09:30 – 21:00', phone: '0571-8765 4321',
      address: '西湖区学院路 108 号 2 层', tags: [] },
    { id: 'st1', brand: 'xaj', linked: true, rec: true, groupon: ['美团', '抖音'], name: '晓艾家 · 西溪店', city: '杭州', district: '西湖区', area: '西溪', km: 1.2, rating: 4.9, reviews: 326, hours: '10:00 – 21:30', phone: '0571-8888 0001',
      address: '西湖区文二西路 西溪天堂商街 2 层', tags: ['近地铁', '免费停车', '独立单间', '茶歇区', '女艾灸师', '团购券可核销', '会员优先时段', '新客体验价'],
      services: ['s1', 's2', 's3', 's4'], staff: ['w1', 'w2', 'w3'], gallery: [['room', 'sand'], ['bed', 'sage'], ['tea', 'clay']] },
    { id: 'st9', brand: 'biz', linked: true, rec: true, groupon: ['美团'], name: '颐和堂中医养生馆', city: '杭州', district: '西湖区', area: '黄龙', km: 2.1, rating: 4.6, reviews: 58, hours: '09:00 – 21:00', phone: '0571-8799 2206',
      address: '西湖区黄龙路 黄龙世纪广场 B 座 3 层', tags: ['团购券可核销', '免费停车', '独立单间'],
      services: ['s1', 's2'], staff: ['w9'], gallery: [['tea', 'sand'], ['bed', 'clay']] },
    { id: 'u2', brand: 'biz', linked: false, src: '高德地图', cat: '艾灸 · 推拿', name: '仁和艾灸推拿', city: '杭州', district: '拱墅区', area: '湖墅南路', km: 2.6, hours: '10:00 – 22:00', phone: '0571-8532 0098',
      address: '拱墅区湖墅南路 266 号', tags: [] },
    { id: 'st2', metro: '武林广场站', brand: 'xaj', linked: true, groupon: ['美团', '抖音'], name: '晓艾家 · 武林店', city: '杭州', district: '拱墅区', area: '武林广场', km: 3.8, rating: 4.8, reviews: 512, hours: '10:00 – 22:30', phone: '0571-8888 0002',
      address: '拱墅区延安路 武林银泰旁 写字楼 3 层', tags: ['近地铁', '无障碍通道', '独立单间', '女艾灸师', '夜间营业', '团购券可核销'],
      services: ['s1', 's2', 's4'], staff: ['w2', 'w4'], gallery: [['bed', 'clay'], ['room', 'mist'], ['moxa', 'sage']] },
    { id: 'st10', brand: 'yq', linked: true, groupon: ['美团', '抖音'], name: '元气地带 · 城西银泰店', city: '杭州', district: '拱墅区', area: '城西银泰', km: 4.5, rating: 4.8, reviews: 131, hours: '10:00 – 22:00', phone: '0571-8666 1002',
      address: '拱墅区丰潭路 城西银泰城 4 层', tags: ['团购券可核销', '免费停车', '夜间营业', '双人间'],
      services: ['s1', 's2', 's4'], staff: ['w8', 'w7'], gallery: [['room', 'clay'], ['bed', 'sand']] },
    { id: 'st3', brand: 'xaj', linked: true, groupon: [], name: '晓艾家 · 钱江新城店', city: '杭州', district: '上城区', area: '钱江新城', km: 7.5, rating: 4.9, reviews: 208, hours: '10:00 – 21:30', phone: '0571-8888 0003',
      address: '上城区富春路 来福士中心 5 层', tags: ['免费停车', '独立单间', '双人间', '低烟环境', '茶歇区', '会员优先时段'],
      services: ['s1', 's2', 's3'], staff: ['w1', 'w5'], gallery: [['room', 'mist'], ['tea', 'sand'], ['bed', 'sage']] },
    { id: 'u3', brand: 'biz', linked: false, src: '腾讯地图', cat: '养生会所', name: '悦舒堂养生会所', city: '杭州', district: '上城区', area: '近江', km: 8.2, hours: '11:00 – 23:00', phone: '0571-8600 7712',
      address: '上城区钱江路 近江时代大厦 1 层', tags: [] },
    { id: 'st4', brand: 'xaj', linked: true, groupon: ['美团', '抖音'], name: '晓艾家 · 滨江星光店', city: '杭州', district: '滨江区', area: '星光大道', km: 9.6, rating: 4.7, reviews: 143, hours: '10:00 – 22:00', phone: '0571-8888 0004', busy: true,
      address: '滨江区江南大道 星光国际广场 2 期 4 层', tags: ['近地铁', '免费停车', '夜间营业', '新客体验价', '团购券可核销'],
      services: ['s1', 's2', 's4'], staff: ['w3', 'w6'], gallery: [['bed', 'sand'], ['room', 'clay']] },
    { id: 'st5', brand: 'xaj', linked: true, groupon: [], name: '晓艾家 · 良渚店', city: '杭州', district: '余杭区', area: '良渚文化村', km: 16.3, rating: 0, reviews: 0, hours: '10:00 – 21:00', phone: '0571-8888 0005', soon: '12 月开业',
      address: '余杭区良渚文化村 玉鸟集 1 层', tags: ['免费停车', '无障碍通道', '双人间', '茶歇区'],
      services: ['s1', 's3'], staff: ['w5'], gallery: [['room', 'sage'], ['leaf', 'sand']] },
    { id: 'st6', metro: '静安寺站', brand: 'xaj', linked: true, groupon: ['美团', '抖音'], name: '晓艾家 · 静安寺店', city: '上海', district: '静安区', area: '静安寺', km: null, rating: 4.8, reviews: 268, hours: '10:00 – 22:00', phone: '021-6666 0001',
      address: '静安区愚园路 静安嘉里中心旁 2 层', tags: ['近地铁', '独立单间', '女艾灸师', '夜间营业', '团购券可核销', '会员优先时段'],
      services: ['s1', 's2', 's3', 's4'], staff: ['w4', 'w6'], gallery: [['room', 'clay'], ['bed', 'mist']] },
    { id: 'st7', metro: '东方体育中心站', brand: 'xaj', linked: true, groupon: [], name: '晓艾家 · 前滩店', city: '上海', district: '浦东新区', area: '前滩', km: null, rating: 4.9, reviews: 97, hours: '10:00 – 21:30', phone: '021-6666 0002',
      address: '浦东新区东育路 前滩太古里 北区 3 层', tags: ['近地铁', '免费停车', '双人间', '低烟环境', '茶歇区', '新客体验价'],
      services: ['s1', 's2', 's4'], staff: ['w1', 'w3'], gallery: [['room', 'sand'], ['tea', 'sage']] },
    { id: 'st11', metro: '徐家汇站', brand: 'yq', linked: true, groupon: ['美团', '抖音'], name: '元气地带 · 徐家汇店', city: '上海', district: '徐汇区', area: '徐家汇', km: null, rating: 4.7, reviews: 74, hours: '10:00 – 22:00', phone: '021-6400 1003',
      address: '徐汇区漕溪北路 汇金广场 5 层', tags: ['团购券可核销', '近地铁', '女艾灸师'],
      services: ['s1', 's2', 's4'], staff: ['w7', 'w9'], gallery: [['bed', 'sage'], ['room', 'sand']] },
    { id: 'u4', brand: 'biz', linked: false, src: '高德地图', cat: '艾灸馆', name: '艾悦艾灸馆（长宁店）', city: '上海', district: '长宁区', area: '中山公园', km: null, hours: '10:00 – 21:30', phone: '021-5238 6610',
      address: '长宁区长宁路 1018 号 龙之梦旁', tags: [] },
    { id: 'st12', metro: '江汉路站', brand: 'xaj', linked: true, rec: true, groupon: ['美团', '抖音'], name: '晓艾家 · 江汉路店', city: '武汉', district: '江汉区', area: '江汉路', km: null, rating: 4.8, reviews: 176, hours: '10:00 – 22:00', phone: '027-8288 0012',
      address: '江汉区江汉路 步行街中心百货 5 层', tags: ['近地铁', '独立单间', '女艾灸师', '团购券可核销', '会员优先时段'],
      services: ['s1', 's2', 's3', 's4'], staff: ['w1', 'w2', 'w4'], gallery: [['room', 'sand'], ['bed', 'mist'], ['tea', 'clay']] },
    { id: 'st13', metro: '楚河汉街站', brand: 'yq', linked: true, groupon: ['美团', '抖音'], name: '元气地带 · 楚河汉街店', city: '武汉', district: '武昌区', area: '楚河汉街', km: null, rating: 4.7, reviews: 92, hours: '10:00 – 22:00', phone: '027-8666 0013',
      address: '武昌区中北路 楚河汉街 3 街区 2 层', tags: ['团购券可核销', '近地铁', '夜间营业', '双人间'],
      services: ['s1', 's2', 's4'], staff: ['w7', 'w8'], gallery: [['bed', 'sage'], ['room', 'clay']] },
    { id: 'st14', brand: 'xaj', linked: true, groupon: [], name: '晓艾家 · 光谷店', city: '武汉', district: '洪山区', area: '光谷广场', km: null, rating: 4.9, reviews: 128, hours: '10:00 – 21:30', phone: '027-8888 0014',
      address: '洪山区珞喻路 光谷广场 大洋百货 4 层', tags: ['免费停车', '独立单间', '低烟环境', '茶歇区', '新客体验价'],
      services: ['s1', 's2', 's3'], staff: ['w3', 'w5'], gallery: [['room', 'mist'], ['tea', 'sand']] },
    { id: 'u5', brand: 'biz', linked: false, src: '高德地图', cat: '艾灸馆', name: '蕲艾堂养生馆（武汉店）', city: '武汉', district: '武昌区', area: '水果湖', km: null, hours: '09:30 – 21:00', phone: '027-8765 0015',
      address: '武昌区水果湖 东湖路 66 号 1 层', tags: [] },
  ];
  D.storeOf = (id) => D.stores.find((s) => s.id === id) || D.stores[0];
  // 原型门店坐标按示例商圈设置，仅用于估算直线距离。用户坐标不写入本地存储。
  const storeCoords = {
    st8:[30.277,120.131],u1:[30.283,120.129],st1:[30.269,120.086],st9:[30.269,120.126],u2:[30.287,120.153],
    st2:[30.274,120.163],st10:[30.306,120.103],st3:[30.242,120.216],u3:[30.228,120.194],st4:[30.208,120.209],st5:[30.381,120.036],
    st6:[31.223,121.446],st7:[31.152,121.485],st11:[31.195,121.437],u4:[31.219,121.416],
    st12:[30.585,114.285],st13:[30.549,114.330],st14:[30.508,114.402],u5:[30.541,114.321],
  };
  D.clearLocation = status => {
    D.located.status=status; D.located.spot='';
    D.stores.forEach(s=>{s.km=null;});
  };
  D.clearLocation('prompt');
  D.applyLocation = (lat,lon) => {
    const rad=Math.PI/180;
    for (const s of D.stores) {
      const coord=storeCoords[s.id]; if(!coord){s.km=null;continue;}
      const [y,x]=coord;
      const h=Math.sin((y-lat)*rad/2)**2+Math.cos(lat*rad)*Math.cos(y*rad)*Math.sin((x-lon)*rad/2)**2;
      s.km=6371*2*Math.asin(Math.sqrt(Math.min(1,h)));
    }
    const nearest=D.stores.filter(s=>s.km!=null).sort((a,b)=>a.km-b.km)[0];
    if (!nearest || nearest.km>60) return D.clearLocation('outside');
    D.located={ city:nearest.city,spot:'按设备位置估算',status:'granted' };
  };
  /* 真实定位坐标：武汉市江汉路步行街（用户在武汉）。走真实经纬度算各门店直线距离 */
  D.WUHAN = { lat: 30.5852, lon: 114.2845, spot: '江汉路步行街' };
  D.applyRealLocation = () => {
    D.applyLocation(D.WUHAN.lat, D.WUHAN.lon);
    if (D.located.status === 'granted') D.located.spot = D.WUHAN.spot;
  };
  D.nearest = (brand) => {
    const candidates=D.stores.filter(s=>s.linked && !s.soon && (!brand||s.brand===brand));
    return candidates.filter(s=>s.city===D.located.city).sort((a,b)=>(a.km??Infinity)-(b.km??Infinity))[0] || candidates[0];
  };
  D.kmText = (s) => (s.km == null ? '' : s.km < 1 ? Math.round(s.km * 1000) + 'm' : s.km.toFixed(1) + 'km');
  D.services = [
    { id: 's1', name: '经典艾灸调理', dur: 60, price: 298, mprice: 268, deposit: 50, desc: '艾灸师根据当日状态选取 4～6 个部位，全程温和悬灸与温灸盒结合。', art: ['moxa', 'sage'], hot: true },
    { id: 's2', name: '肩颈舒缓艾灸', dur: 45, price: 198, mprice: 178, deposit: 50, desc: '针对久坐低头人群，重点放松肩颈与上背。', art: ['person', 'sand'] },
    { id: 's3', name: '节气养生套餐', dur: 90, price: 458, mprice: 398, deposit: 100, desc: '当季节气方案：艾灸 + 泡脚 + 节气茶饮，适合想好好休息一次的您。', art: ['season', 'mist'] },
    { id: 's4', name: '新客体验艾灸', dur: 30, price: 99, mprice: 99, deposit: 0, desc: '第一次来？先体验 30 分钟，认识空间和艾灸师。', art: ['bed', 'clay'], tag: '新客' },
  ];
  D.service = (id) => D.services.find((s) => s.id === id);
  D.staff = [
    { id: 'any', name: '到店安排', title: '推荐，可约时段更多' },
    { id: 'w1', name: '王静', title: '高级艾灸师 · 8 年', female: true },
    { id: 'w2', name: '陈悦', title: '艾灸师 · 5 年', female: true },
    { id: 'w3', name: '周明', title: '调理师 · 6 年' },
    { id: 'w4', name: '林晓云', title: '高级艾灸师 · 10 年', female: true },
    { id: 'w5', name: '赵安', title: '艾灸师 · 4 年' },
    { id: 'w6', name: '孙婉', title: '艾灸师 · 6 年', female: true },
    { id: 'w7', name: '何琳', title: '艾灸师 · 5 年', female: true },
    { id: 'w8', name: '吴峰', title: '调理师 · 7 年' },
    { id: 'w9', name: '郑秀兰', title: '中医理疗师 · 12 年', female: true },
  ];
  const anyStaff = D.staff[0];
  D.staffOf = id => D.staff.find(w => w.id === id) || (id === 'any' ? anyStaff : {id, name: '原技师', title: ''});
  D.staffFor = store => [anyStaff, ...D.staff.filter(w => w.id !== 'any' && w.enabled !== false && store.staff?.includes(w.id))];
  D.TIMES = ['10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:30', '19:00', '20:00'];
  D.slots = (storeId, date, staffId = 'any', serviceId, exclude) => {
    const store = D.storeOf(storeId);
    const workers = D.staffFor(store).slice(1).filter(w => staffId === 'any' || w.id === staffId);
    const weekday = new Date(date + 'T12:00:00Z').getUTCDay();
    const duration = D.services.find(s => s.id === serviceId)?.dur || 60;
    const clock = time => Date.parse(date + 'T' + time + ':00+08:00');
    const booked = (XA.state?.appts || []).filter(a => a.date === date && a.status === 'booked' && a.id !== exclude);
    return D.TIMES.map(time => {
      const start = clock(time);
      const override = D.slotOverrides?.[storeId + '_' + date + '_' + time];
      const onDuty = workers.filter(w => !w.shifts?.[weekday] || w.shifts[weekday].includes(time));
      const free = onDuty.some(w => !booked.some(a => {
        const other = clock(a.time);
        return a.staffId === w.id && start < other + (a.duration || 60) * 60000 && other < start + duration * 60000;
      }));
      return {time, past: start <= Date.now() + 3600000, off: !onDuty.length, full: !free || override === 'full',
        vip: override ? override === 'vip' : time === '19:00' && store.tags?.includes('会员优先时段')};
    });
  };
  /* 最近可约时段（用于门店列表"今天 14:00 可约"） */
  D.nextSlot = (store) => {
    if (store.soon || !store.linked) return null;
    if (!store.services?.length) return {day:3,text:'暂无可预约服务'};
    for (let i = 0; i < 3; i++) {
      const k = XA.d.key(XA.d.add(i));
      const s = D.slots(store.id, k, 'any').find((x) => !x.past && !x.full);
      if (s) return { day: i, text: `${['今天', '明天', '后天'][i]} ${s.time} 可约` };
    }
    return { day: 3, text: '近三天已约满' };
  };
  /* 取消/改期政策（演示配置，待确认 C2） */
  D.policy = { freeCancelHours: 4, lateRate: 0.5, rescheduleHours: 2, rescheduleTimes: 1 };

  D.activities = [
    { id: 'ac1', store: 'st1', title: '立冬节气养生会', day: 4, time: '14:30 – 16:30', quota: 12, left: 5, memberOnly: false, art: ['season', 'mist'], intro: '艾灸师带大家认识冬季常用的三个保健穴位，现场体验温灸，并一起煮一壶节气茶。' },
    { id: 'ac2', store: 'st2', title: '手工艾条体验课', day: 11, time: '10:30 – 12:00', quota: 8, left: 3, memberOnly: false, art: ['moxa', 'sand'], intro: '从一把陈艾绒开始，亲手卷一支属于自己的艾条，可带回家使用。' },
    { id: 'ac3', store: 'st1', title: '晓艾会会员日 · 茶叙', day: 18, time: '15:00 – 17:00', quota: 20, left: 9, memberOnly: true, art: ['tea', 'clay'], intro: '每月一次的会员小聚：新品试用、养生问答、茶点交流。白银及以上会员可报名。' },
  ];
  D.activity = (id) => D.activities.find((a) => a.id === id);

  /* 晓艾家会籍（P1，示例定价待确认 B2） */
  D.plans = [
    { id: 'm1', name: '体验卡', period: '30 天', price: 399, perks: ['经典艾灸调理 2 次', '到店茶歇', '会员价预约'] },
    { id: 'm2', name: '季卡', period: '90 天', price: 1680, perks: ['经典艾灸调理 8 次', '节气养生会 1 席', '优先预约时段', '到店茶歇'], hot: true },
    { id: 'm3', name: '年卡', period: '365 天', price: 5800, perks: ['经典艾灸调理 36 次', '全年节气活动席位', '优先预约时段', '专属顾问'] },
  ];

  /* ---------- 晓艾会 · 成长会员权益（示例）：普通 / 白银 / 黄金 / 钻石 ---------- */
  D.benefits = {
    1: [['线上购物', '消费、学习都能攒积分和成长值'], ['课程', '付费课程免费试听'], ['推广', '可申请成为推广员']],
    2: [['线上购物', '会员价商品 95 折、生日券'], ['线下门店', '已接入门店消费攒积分、可报名会员活动'], ['课程', '专栏 95 折'], ['推广', '佣金 +1%']],
    3: [['线上购物', '全年包邮、优先客服'], ['线下门店', '可匹配领取门店会籍与增值权益'], ['课程', '专栏 95 折、直播课优先席位'], ['推广', '佣金 +2%、新品试用']],
    4: [['线上购物', '好物 9 折、积分 2 倍、专属顾问'], ['线下门店', '匹配更高一档的门店会籍、活动席位'], ['课程', '专栏 8 折、赠课 / 线下席位'], ['推广', '佣金 +3%、活动共创']],
  };
  /* 成长值与积分的来源：成长值只决定等级，积分可用于兑换与抵扣 */
  D.earn = [
    { name: '每日签到', pts: '+5', g: '+5', act: 'sign' },
    { name: '看完一条视频', pts: '+1', g: '+1', go: 'video' },
    { name: '完成体质测试', pts: '+20', g: '+20', go: 'test' },
    { name: '购物实付', pts: '1 元 = 1 分', g: '1 元 = 1', go: 'home' },
    { name: '到店完成服务', pts: '+50', g: '+50 及实付金额', go: 'store' },
    { name: '第三方订单扫码补登', pts: '1 元 = 1 分', g: '1 元 = 1', go: 'claim' },
  ];

  /* ---------- 积分兑换（演示）：积分抵现 + 少量现金 ----------
   * 100 积分 = ¥1；每件商品标「N 积分 + ¥X」，兑换时积分抵现、差额补现金。
   */
  D.exchangeRate = 100;
  D.exchange = [
    { id: 'x1', pid: 'p1', pts: 800, cash: 9.9 },
    { id: 'x2', pid: 'p3', pts: 600, cash: 9.9 },
    { id: 'x3', pid: 'p4', pts: 900, cash: 12 },
    { id: 'x4', pid: 'p5', pts: 500, cash: 9.9 },
    { id: 'x5', pid: 'p2', pts: 1500, cash: 19 },
    { id: 'x6', pid: 'p6', pts: 400, cash: 6.6 },
  ];
  D.exchangeOf = (id) => D.exchange.find((x) => x.id === id);

  /* ---------- 晓艾会 · Plus 付费权益包（权益最大化覆盖） ---------- */
  D.plus = {
    price: 365, days: 365, gifts: 3,
    perks: [
      { ic: 'coin', t: '好物 9 折', d: '会员价商品自动按 Plus 价结算' },
      { ic: 'truck', t: '全年包邮', d: '线上订单不限金额包邮' },
      { ic: 'star', t: '积分 2 倍', d: '购物实付积分翻倍入账' },
      { ic: 'ticket', t: '每月券包', d: '每月 ¥40：好物券 + 到店券' },
      { ic: 'book', t: '课程 8 折', d: '全部付费专栏享 Plus 价' },
      { ic: 'store', t: '门店会籍匹配', d: '可领取合作门店对应会籍' },
      { ic: 'headset', t: '专属顾问', d: '养生顾问优先响应' },
      { ic: 'gift', t: '生日礼', d: '生日月赠节气养生礼' },
    ],
  };

  /* ---------- 门店权益匹配：Plus 或达到对应成长等级可领 ---------- */
  D.storePerks = [
    { id: 'sp1', brand: 'xaj', kind: '会籍', name: '晓艾家体验会籍', tone: 'xaj', mark: '家', plus: true, lv: 4, items: ['到店服务享会籍价', '19:00 会员优先时段可约', '每次到店赠茶歇'] },
    { id: 'sp2', brand: 'xaj', kind: '增值权益', name: '晓艾家到店礼遇', tone: 'gift', mark: '礼', plus: true, lv: 3, items: ['19:00 会员优先时段可约', '到店赠当季节气茶饮'] },
    { id: 'sp3', brand: 'yq', kind: '会籍', name: '元气地带 · 元气卡', tone: 'yq', mark: '元', plus: true, lv: 3, items: ['全部项目 9 折', '每月 1 次肩颈放松 15 分钟', '全国元气地带门店通用'] },
    { id: 'sp4', brand: 'biz', storeId: 'st9', kind: '会籍', name: '颐和堂 · 贵宾卡', tone: 'biz', mark: '颐', plus: true, lv: 4, items: ['服务项目 88 折', '每年 1 次体质辨识', '到店免费停车 2 小时'] },
  ];
  D.perkStore = (p) => (p.storeId ? D.storeOf(p.storeId).name : D.storeBrands[p.brand].full);
  D.perkNeed = (p) => {
    const name = XA.levelOf(p.lv).short;
    if (p.plus && p.lv) return `Plus 或${name}及以上`;
    if (p.plus) return 'Plus 专属';
    return `${name}及以上`;
  };
  D.perkVia = (p) => (p.plus && XA.isPlus() ? 'plus' : p.lv && XA.state.loggedIn && XA.level().lv >= p.lv ? 'lv' : '');
  D.perksFor = (store) => D.storePerks.filter((p) => (p.storeId ? p.storeId === store.id : p.brand === store.brand));
  XA.hasPerk = (id) => { const p = D.storePerks.find((x) => x.id === id); return !!p && XA.state.perks.some((x) => x.id === id) && !!D.perkVia(p); };

  /* ---------- 团购券（美团 / 抖音）：在已接入门店验券 → 预约 → 到店核销，核销后计入"线下订单"，积分自动到账 ---------- */
  D.groupons = [
    { code: 'MT8830217765', channel: '美团', brand: 'xaj', service: 's1', title: '经典艾灸调理 60 分钟', amount: 198, expire: 25 },
    { code: 'DY5521900348', channel: '抖音', brand: 'yq', service: 's2', title: '肩颈舒缓艾灸 45 分钟', amount: 128, expire: 12 },
  ];
  D.grouponOf = (code) => D.groupons.find((g) => g.code === code);
  /* 团购券的适用门店：同品牌、已接入、支持该平台核销、提供对应项目 */
  D.grouponStores = (g) => D.stores.filter((s) => s.linked && !s.soon && s.brand === g.brand && s.groupon.includes(g.channel) && s.services.includes(g.service))
    .sort((a, b) => (a.city === D.located.city ? a.km : 99) - (b.city === D.located.city ? b.km : 99));
  D.maskCode = (c) => c.slice(0, 4) + '****' + c.slice(-3);

  /* ---------- 第三方订单：京东 / 淘宝 / 小店等第三方电商平台的订单 ----------
   * 包裹内附"积分卡"，每张卡上的积分二维码对应一笔订单；用户扫码即可把这笔订单的积分补登到晓艾会。
   */
  D.thirdChannels = ['京东', '淘宝', '抖音小店', '微信小店'];
  D.pointCards = [
    { id: 'q1', channel: '京东', shop: '晓艾京东自营旗舰店', title: '五年陈艾条 手工蕲艾 18mm×10支 ×2', amount: 136, points: 136, day: -2, order: 'JD298810447652', art: ['moxa', 'sand'] },
    { id: 'q2', channel: '淘宝', shop: '晓艾官方旗舰店', title: '艾草生姜足浴包 30包 家庭装', amount: 59, points: 59, day: -4, order: 'TB339012774508', art: ['bath', 'clay'] },
    { id: 'q3', channel: '抖音小店', shop: '明大妈官方小店', title: '艾草热敷肩颈贴 自发热 10贴', amount: 79, points: 79, day: -6, order: 'DD692003881245', art: ['patch', 'rose'] },
    { id: 'q0', channel: '微信小店', shop: '元气地带小店', title: '随身灸艾灸盒 纯铜加厚 配布套', amount: 129, points: 129, day: -16, order: 'WX512003770916', art: ['box', 'sage'] },
  ];
  D.pointCard = (id) => D.pointCards.find((c) => c.id === id);
  D.chClass = (ch) => ({ 京东: 'jd', 淘宝: 'tb', 抖音小店: 'dy', 微信小店: 'wx', 美团: 'mt', 抖音: 'dy' }[ch] || 'wx');

  /* ---------- 线下订单：门店消费记录（到店服务核销、团购券核销、门店购买），由店端收银/核销产生 ---------- */
  D.offlineOrders = [
    { id: 'MD2611070313', store: 'st8', kind: 'service', service: 's2', title: '肩颈舒缓艾灸 45 分钟', sub: '艾灸师 何琳', gp: '抖音', pay: '抖音团购券核销', amount: 128, points: 50, day: -3, art: ['person', 'sand'] },
    { id: 'MD2611010021', store: 'st1', kind: 'service', service: 's1', title: '经典艾灸调理 60 分钟', sub: '艾灸师 王静', pay: '门店收银', amount: 268, points: 50, day: -9, art: ['moxa', 'sage'] },
    { id: 'MD2611010022', store: 'st1', kind: 'retail', title: '五年陈艾条 10支装 ×2', sub: '门店购买，当场带走', pay: '门店收银', amount: 136, points: 136, day: -9, art: ['moxa', 'sand'] },
  ];

  /* ---------- 用户增长 · 营销裂变（演示数据；对外活动名，不出现「裂变」字样） ---------- */
  D.invite = {
    bindDays: 180,
    join: 50, // 好友入会，邀请人得积分
    first: { pts: 80, coupon: { name: '邀请首单奖励券', amount: 15, min: 59, scope: 'goods' } },
    friend: [
      { name: '新人专享券', amount: 20, min: 59, scope: 'goods' },
      { name: '到店体验券', amount: 30, min: 99, scope: 'store' },
    ],
    friendTotal: 50,
    tiers: [
      { n: 1, t: '入门礼', coupon: { name: '邀请阶梯 · 好物券', amount: 10, min: 39, scope: 'goods' }, done: '入门礼已到账' },
      { n: 3, t: '心意礼', coupon: { name: '邀请阶梯 · 好物券', amount: 30, min: 99, scope: 'goods' }, done: '心意礼已到账' },
      { n: 5, t: '成长礼', coupon: { name: '邀请阶梯 · 成长礼券', amount: 50, min: 99, scope: 'goods' }, growth: 500, done: '成长礼已到账：¥50 券 + 500 成长值' },
    ],
  };
  D.inviteNames = ['王姐', '陈阿姨', '刘老师', '周姨', '张叔', '何琳', '赵姐', '孙阿姨'];
  D.groupBuys = {
    p1: { size: 2, price: 49 },
    p3: { size: 3, price: 89 },
    p5: { size: 2, price: 39 },
  };
  D.openGroups = [
    { id: 'og1', pid: 'p1', leader: '王姐', members: ['王姐'], hours: 8 },
    { id: 'og2', pid: 'p5', leader: '陈阿姨', members: ['陈阿姨'], hours: 3 },
  ];
  D.redpack = { count: 5, need: 3, max: 8, coupon: { name: '下单红包奖励券', amount: 8, min: 39, scope: 'goods' } };

  /* ---------- 推广中心（P1，演示数据） ---------- */
  D.promoRecords = [
    { who: '王**', item: '五年陈艾条', amount: 68, rate: 0.1, status: '已结算', day: -6 },
    { who: '张**', item: '经典艾灸调理（到店）', amount: 268, rate: 0.08, status: '待结算', day: -2 },
    { who: '刘**', item: '艾草足浴包', amount: 59, rate: 0.1, status: '已结算', day: -9 },
  ];

  /* ---------- 价格与文案工具 ---------- */
  XA.productQuote = (p, opts, plus = XA.isPlus()) => {
    const delta = (opts || []).reduce((sum,oi,si)=>sum+(p.specs[si]?.options[oi]?.d || 0),0);
    return XA.productPricing.quote(p,delta,XA.state.loggedIn ? XA.level().lv : 0,plus);
  };
  XA.unitPrice = (p,opts) => XA.productQuote(p,opts).sale;
  XA.memberPrice = (p,opts,plus) => XA.productQuote(p,opts,plus).price;
  XA.priceTag = () => (XA.isPlus() ? 'Plus 价' : '会员价');
  XA.defaultOpts = (p) => p.specs.map((s) => Math.max(0, s.options.findIndex((o) => o.d === 0)));
  XA.specLabel = (p, opts) => p.specs.map((s, i) => s.options[opts[i] || 0].t.replace(/（.*）/, '')).join(' / ');
  XA.DISCLAIMER = '以上内容为养生保健科普，仅供参考，不能替代医疗诊断与治疗。如有不适请及时就医。';
})();
