/** @jsxRuntime automatic */
/** @jsxImportSource @oai/artifact-tool/presentation-jsx */

import {
  Presentation,
  PresentationFile,
  row,
  column,
  grid,
  layers,
  panel,
  text,
  shape,
  rule,
  fill,
  hug,
  fixed,
  wrap,
  grow,
  fr,
} from '@oai/artifact-tool';
import { writeFile } from 'node:fs/promises';

const W = 1920;
const H = 1080;

const C = {
  ink: '#070A0D',
  ink2: '#10161C',
  charcoal: '#1A2026',
  gold: '#D8A84E',
  gold2: '#F2D28C',
  cinnabar: '#B84631',
  jade: '#5FB3A5',
  mist: '#EAE2D4',
  quiet: '#AFA79A',
  line: '#54452D',
};

const font = 'Microsoft YaHei';
const deck = Presentation.create({ slideSize: { width: W, height: H } });

function bg(children = []) {
  return layers({ name: 'root', width: fill, height: fill }, [
    shape({ name: 'bg', width: fill, height: fill, fill: C.ink, line: { width: 0 } }),
    shape({ name: 'top-band', width: fill, height: fixed(120), fill: '#0E151A', line: { width: 0 } }),
    ...children,
  ]);
}

function pageMarker(n) {
  return text(String(n).padStart(2, '0'), {
    name: `page-${n}`,
    width: fixed(80),
    height: hug,
    style: { fontFamily: font, fontSize: 18, color: '#6F6659', bold: true },
  });
}

function titleBlock(title, subtitle, n) {
  return row({ name: 'title-row', width: fill, height: hug, align: 'center', justify: 'between' }, [
    column({ name: 'title-stack', width: fill, height: hug, gap: 14 }, [
      text(title, {
        name: 'slide-title',
        width: wrap(1380),
        height: hug,
        style: { fontFamily: font, fontSize: 54, bold: true, color: C.mist },
      }),
      subtitle
        ? text(subtitle, {
            name: 'slide-subtitle',
            width: wrap(1180),
            height: hug,
            style: { fontFamily: font, fontSize: 24, color: C.quiet },
          })
        : rule({ name: 'title-rule', width: fixed(240), stroke: C.gold, weight: 4 }),
    ]),
    pageMarker(n),
  ]);
}

function composeSlide(slide, content) {
  slide.compose(content, {
    frame: { left: 0, top: 0, width: W, height: H },
    baseUnit: 8,
  });
}

function addSlide(content) {
  const slide = deck.slides.add();
  composeSlide(slide, content);
  return slide;
}

const chipStyle = { fontFamily: font, fontSize: 24, color: C.ink, bold: true };
function openChip(label, color = C.gold) {
  return panel(
    {
      name: `chip-${label}`,
      fill: color,
      line: { width: 0 },
      borderRadius: 'rounded-full',
      padding: { x: 26, y: 13 },
      width: hug,
      height: hug,
    },
    text(label, { width: hug, height: hug, style: chipStyle }),
  );
}

function metric(label, value, accent = C.gold) {
  return column({ name: `metric-${label}`, width: fill, height: hug, gap: 8 }, [
    text(value, {
      name: `metric-value-${label}`,
      width: fill,
      height: hug,
      style: { fontFamily: font, fontSize: 56, bold: true, color: accent },
    }),
    text(label, {
      name: `metric-label-${label}`,
      width: fill,
      height: hug,
      style: { fontFamily: font, fontSize: 21, color: C.quiet },
    }),
  ]);
}

// 01 Cover
addSlide(
  bg([
    grid(
      {
        name: 'cover-grid',
        width: fill,
        height: fill,
        columns: [fr(1.04), fr(0.96)],
        rows: [fr(1)],
        padding: { x: 112, y: 88 },
        columnGap: 60,
      },
      [
        column({ name: 'cover-copy', width: fill, height: fill, justify: 'center', gap: 34 }, [
          text('匠心永驻', {
            name: 'cover-title',
            width: fill,
            height: hug,
            style: { fontFamily: font, fontSize: 122, bold: true, color: C.mist },
          }),
          text('中国古代建筑成就互动叙事可视化系统', {
            name: 'cover-subtitle',
            width: wrap(760),
            height: hug,
            style: { fontFamily: font, fontSize: 34, color: C.gold2 },
          }),
          rule({ name: 'cover-rule', width: fixed(360), stroke: C.cinnabar, weight: 7 }),
          row({ name: 'cover-chips', width: hug, height: hug, gap: 16 }, [
            openChip('三维可视化'),
            openChip('AI 导览', C.jade),
            openChip('AR 沉浸', C.cinnabar),
          ]),
          text('计算机设计大赛省赛答辩', {
            name: 'cover-context',
            width: hug,
            height: hug,
            style: { fontFamily: font, fontSize: 24, color: C.quiet },
          }),
        ]),
        layers({ name: 'cover-mark', width: fill, height: fill }, [
          shape({ name: 'cover-mark-field', width: fill, height: fill, fill: '#0D1216', line: { width: 0 } }),
          grid(
            {
              name: 'cover-mark-grid',
              width: fill,
              height: fill,
              rows: [fr(1), fr(1), fr(1), fr(1), fr(1)],
              columns: [fr(1), fr(1), fr(1), fr(1), fr(1)],
              rowGap: 16,
              columnGap: 16,
              padding: 44,
            },
            Array.from({ length: 25 }).map((_, i) =>
              shape({
                name: `cover-cell-${i}`,
                width: fill,
                height: fill,
                fill: i % 6 === 0 ? C.gold : i % 5 === 0 ? C.cinnabar : '#151E24',
                line: { width: 1, fill: '#2A2A24' },
              }),
            ),
          ),
          column({ name: 'cover-claim', width: fill, height: fill, justify: 'end', padding: 56, gap: 12 }, [
            text('让古建筑从“被观看”走向“被理解”', {
              name: 'cover-thesis',
              width: wrap(640),
              height: hug,
              style: { fontFamily: font, fontSize: 44, bold: true, color: C.mist },
            }),
          ]),
        ]),
      ],
    ),
  ]),
);

// 02 Problem
addSlide(
  bg([
    column({ name: 's2', width: fill, height: fill, padding: { x: 104, y: 72 }, gap: 64 }, [
      titleBlock('我们解决的是古建筑理解门槛', '古建筑知识抽象、结构复杂、传播方式静态，是现场答辩的切入点。', 2),
      grid({ name: 'problem-shift', width: fill, height: fill, columns: [fr(1), fixed(170), fr(1)], columnGap: 44 }, [
        column({ name: 'old-world', width: fill, height: fill, justify: 'center', gap: 28 }, [
          text('传统传播', { name: 'old-title', width: fill, height: hug, style: { fontFamily: font, fontSize: 44, bold: true, color: C.quiet } }),
          text('图文静态\n结构难懂\n体验割裂', { name: 'old-list', width: fill, height: hug, style: { fontFamily: font, fontSize: 40, color: '#756F66' } }),
        ]),
        column({ name: 'arrow-core', width: fill, height: fill, justify: 'center', align: 'center', gap: 18 }, [
          rule({ name: 'arrow-line-1', width: fixed(120), stroke: C.gold, weight: 5 }),
          text('转译', { name: 'arrow-word', width: hug, height: hug, style: { fontFamily: font, fontSize: 30, color: C.gold2, bold: true } }),
          rule({ name: 'arrow-line-2', width: fixed(120), stroke: C.gold, weight: 5 }),
        ]),
        column({ name: 'new-world', width: fill, height: fill, justify: 'center', gap: 30 }, [
          text('项目表达', { name: 'new-title', width: fill, height: hug, style: { fontFamily: font, fontSize: 44, bold: true, color: C.gold2 } }),
          row({ name: 'new-chips-1', width: hug, height: hug, gap: 18 }, [openChip('看得见'), openChip('拆得开', C.jade)]),
          row({ name: 'new-chips-2', width: hug, height: hug, gap: 18 }, [openChip('讲得清', C.cinnabar), openChip('可传播')]),
        ]),
      ]),
    ]),
  ]),
);

// 03 System Map
addSlide(
  bg([
    column({ name: 's3', width: fill, height: fill, padding: { x: 104, y: 72 }, gap: 50 }, [
      titleBlock('一套面向答辩现场的数字古建展馆', '从结构认知到智能导览，再到多端交付，形成完整体验链。', 3),
      grid({ name: 'system-map', width: fill, height: fill, columns: [fr(1), fr(1), fr(1)], rows: [fr(1), fr(1)], columnGap: 32, rowGap: 32 }, [
        metric('斗拱 / 角楼 / 四合院 / 赵州桥', '3D 交互', C.gold),
        metric('500 个古建筑样本组织', '星图叙事', C.jade),
        metric('上下文问答与联动推荐', 'AI 导师', C.cinnabar),
        metric('多因子相似度检索', '智能荐览', C.gold2),
        metric('移动端真实空间投放', 'Web AR', C.jade),
        metric('Windows 安装包交付', 'Electron', C.cinnabar),
      ]),
    ]),
  ]),
);

// 04 Architecture
addSlide(
  bg([
    column({ name: 's4', width: fill, height: fill, padding: { x: 104, y: 72 }, gap: 52 }, [
      titleBlock('技术架构：内容、交互、智能、交付四层闭环', '所有技术点围绕“让古建知识更容易被理解”组织，而不是堆栈罗列。', 4),
      grid({ name: 'arch-grid', width: fill, height: fill, columns: [fr(1)], rows: [fr(1), fixed(18), fr(1), fixed(18), fr(1), fixed(18), fr(1)], rowGap: 16 }, [
        row({ name: 'layer-1', width: fill, height: fill, gap: 28, align: 'center' }, [openChip('内容层'), text('斗拱、桥梁、宫殿、民居、建筑史、AR 体验', { name: 'layer1-text', width: fill, height: hug, style: { fontFamily: font, fontSize: 34, color: C.mist } })]),
        rule({ name: 'arch-rule-1', width: fill, stroke: C.line, weight: 2 }),
        row({ name: 'layer-2', width: fill, height: fill, gap: 28, align: 'center' }, [openChip('交互层', C.jade), text('旋转、拆解、聚焦、筛选、跳转、错误边界保护', { name: 'layer2-text', width: fill, height: hug, style: { fontFamily: font, fontSize: 34, color: C.mist } })]),
        rule({ name: 'arch-rule-2', width: fill, stroke: C.line, weight: 2 }),
        row({ name: 'layer-3', width: fill, height: fill, gap: 28, align: 'center' }, [openChip('智能层', C.cinnabar), text('AI 问答、多因子相似度、页面上下文、推荐解释', { name: 'layer3-text', width: fill, height: hug, style: { fontFamily: font, fontSize: 34, color: C.mist } })]),
        rule({ name: 'arch-rule-3', width: fill, stroke: C.line, weight: 2 }),
        row({ name: 'layer-4', width: fill, height: fill, gap: 28, align: 'center' }, [openChip('交付层'), text('Vite Web、移动端 AR、Electron 桌面安装包', { name: 'layer4-text', width: fill, height: hug, style: { fontFamily: font, fontSize: 34, color: C.mist } })]),
      ]),
    ]),
  ]),
);

// 05 Demo Route
addSlide(
  bg([
    column({ name: 's5', width: fill, height: fill, padding: { x: 104, y: 72 }, gap: 52 }, [
      titleBlock('现场演示建议：三分钟抓住评委注意力', '先展示最直观的三维，再展示系统深度，最后落到可交付。', 5),
      grid({ name: 'demo-steps', width: fill, height: fill, columns: [fr(1), fr(1), fr(1)], columnGap: 42 }, [
        column({ name: 'demo-1', width: fill, height: fill, justify: 'center', gap: 18 }, [
          text('01', { name: 'demo-no-1', width: hug, height: hug, style: { fontFamily: font, fontSize: 76, bold: true, color: C.gold } }),
          text('斗拱拆解', { name: 'demo-title-1', width: fill, height: hug, style: { fontFamily: font, fontSize: 46, bold: true, color: C.mist } }),
          text('用分层、环形、复原展示结构认知价值', { name: 'demo-copy-1', width: wrap(440), height: hug, style: { fontFamily: font, fontSize: 25, color: C.quiet } }),
        ]),
        column({ name: 'demo-2', width: fill, height: fill, justify: 'center', gap: 18 }, [
          text('02', { name: 'demo-no-2', width: hug, height: hug, style: { fontFamily: font, fontSize: 76, bold: true, color: C.jade } }),
          text('星图 + AI', { name: 'demo-title-2', width: fill, height: hug, style: { fontFamily: font, fontSize: 46, bold: true, color: C.mist } }),
          text('从建筑史节点进入智能讲解与模块联动', { name: 'demo-copy-2', width: wrap(440), height: hug, style: { fontFamily: font, fontSize: 25, color: C.quiet } }),
        ]),
        column({ name: 'demo-3', width: fill, height: fill, justify: 'center', gap: 18 }, [
          text('03', { name: 'demo-no-3', width: hug, height: hug, style: { fontFamily: font, fontSize: 76, bold: true, color: C.cinnabar } }),
          text('AR / 桌面端', { name: 'demo-title-3', width: fill, height: hug, style: { fontFamily: font, fontSize: 46, bold: true, color: C.mist } }),
          text('说明作品不是网页样机，而是可部署成果', { name: 'demo-copy-3', width: wrap(440), height: hug, style: { fontFamily: font, fontSize: 25, color: C.quiet } }),
        ]),
      ]),
    ]),
  ]),
);

// 06 Innovation
addSlide(
  bg([
    column({ name: 's6', width: fill, height: fill, padding: { x: 104, y: 72 }, gap: 48 }, [
      titleBlock('创新点不是“用了很多技术”，而是形成合力', '每个技术点都对应一个清晰的认知目标。', 6),
      grid({ name: 'innovation-grid', width: fill, height: fill, columns: [fr(1), fr(1), fr(1)], rows: [fr(1), fr(1)], columnGap: 34, rowGap: 34 }, [
        metric('把结构知识变成可操作过程', '三维拆解', C.gold),
        metric('把历史脉络变成可探索空间', '建筑星图', C.jade),
        metric('把资料检索变成智能讲解', 'AI 导师', C.cinnabar),
        metric('把相似关系变成可解释推荐', '多因子算法', C.gold2),
        metric('把屏幕内容延伸到真实空间', 'AR 沉浸', C.jade),
        metric('把作品从演示变成可安装应用', '桌面交付', C.cinnabar),
      ]),
    ]),
  ]),
);

// 07 Algorithm
addSlide(
  bg([
    column({ name: 's7', width: fill, height: fill, padding: { x: 104, y: 72 }, gap: 48 }, [
      titleBlock('智能荐览：把古建筑变成可计算对象', '相似度不是关键词命中，而是多维特征的结构化比较。', 7),
      grid({ name: 'algo-grid', width: fill, height: fill, columns: [fr(0.95), fr(1.05)], columnGap: 62 }, [
        column({ name: 'algo-factors', width: fill, height: fill, justify: 'center', gap: 22 }, [
          row({ name: 'factor-row-1', width: fill, height: hug, gap: 18 }, [openChip('类别'), openChip('朝代', C.jade), openChip('屋顶')]),
          row({ name: 'factor-row-2', width: fill, height: hug, gap: 18 }, [openChip('结构', C.cinnabar), openChip('材料'), openChip('工艺', C.jade)]),
          row({ name: 'factor-row-3', width: fill, height: hug, gap: 18 }, [openChip('影响因子', C.gold2), openChip('文化地位', C.cinnabar)]),
        ]),
        column({ name: 'algo-output', width: fill, height: fill, justify: 'center', gap: 24 }, [
          text('输出的不只是分数', { name: 'algo-claim', width: fill, height: hug, style: { fontFamily: font, fontSize: 54, bold: true, color: C.mist } }),
          text('系统同时给出推荐对象、匹配维度与跳转路径，评委能看到算法如何服务学习体验。', { name: 'algo-copy', width: wrap(720), height: hug, style: { fontFamily: font, fontSize: 30, color: C.quiet } }),
          rule({ name: 'algo-rule', width: fixed(420), stroke: C.gold, weight: 5 }),
          text('“找得到相似建筑，也讲得清为什么相似。”', { name: 'algo-quote', width: wrap(720), height: hug, style: { fontFamily: font, fontSize: 34, color: C.gold2, bold: true } }),
        ]),
      ]),
    ]),
  ]),
);

// 08 AI
addSlide(
  bg([
    column({ name: 's8', width: fill, height: fill, padding: { x: 104, y: 72 }, gap: 48 }, [
      titleBlock('AI 古建筑导师：不是聊天框，是认知导航', 'AI 回答会结合当前页面语境，并推荐继续探索的模块。', 8),
      grid({ name: 'ai-flow', width: fill, height: fill, columns: [fr(1), fixed(90), fr(1), fixed(90), fr(1)], columnGap: 22 }, [
        column({ name: 'ai-1', width: fill, height: fill, justify: 'center', gap: 14 }, [
          text('页面语境', { name: 'ai-title-1', width: fill, height: hug, style: { fontFamily: font, fontSize: 44, bold: true, color: C.gold2 } }),
          text('斗拱、星图、桥梁、院落等不同模块拥有不同提示词背景', { name: 'ai-copy-1', width: wrap(420), height: hug, style: { fontFamily: font, fontSize: 25, color: C.quiet } }),
        ]),
        text('→', { name: 'ai-arrow-1', width: hug, height: hug, style: { fontFamily: font, fontSize: 76, color: C.line, bold: true } }),
        column({ name: 'ai-2', width: fill, height: fill, justify: 'center', gap: 14 }, [
          text('智能问答', { name: 'ai-title-2', width: fill, height: hug, style: { fontFamily: font, fontSize: 44, bold: true, color: C.jade } }),
          text('回答不脱离当前对象，适合现场追问和专业解释', { name: 'ai-copy-2', width: wrap(420), height: hug, style: { fontFamily: font, fontSize: 25, color: C.quiet } }),
        ]),
        text('→', { name: 'ai-arrow-2', width: hug, height: hug, style: { fontFamily: font, fontSize: 76, color: C.line, bold: true } }),
        column({ name: 'ai-3', width: fill, height: fill, justify: 'center', gap: 14 }, [
          text('联动推荐', { name: 'ai-title-3', width: fill, height: hug, style: { fontFamily: font, fontSize: 44, bold: true, color: C.cinnabar } }),
          text('从回答直接进入更适合深入查看的页面或对象', { name: 'ai-copy-3', width: wrap(420), height: hug, style: { fontFamily: font, fontSize: 25, color: C.quiet } }),
        ]),
      ]),
    ]),
  ]),
);

// 09 Delivery
addSlide(
  bg([
    column({ name: 's9', width: fill, height: fill, padding: { x: 104, y: 72 }, gap: 52 }, [
      titleBlock('工程完成度：面向真实展示环境做交付', '答辩现场最重要的是稳定、可演示、可解释。', 9),
      grid({ name: 'delivery-grid', width: fill, height: fill, columns: [fr(1), fr(1), fr(1)], columnGap: 42 }, [
        metric('浏览器零安装访问', 'Web', C.gold),
        metric('手机端空间沉浸展示', 'AR', C.jade),
        metric('Windows 安装包运行', 'Desktop', C.cinnabar),
      ]),
      row({ name: 'stability-row', width: fill, height: hug, gap: 20, justify: 'center' }, [
        openChip('页面级错误边界'),
        openChip('模块化路由组织', C.jade),
        openChip('演示链路可控', C.cinnabar),
      ]),
    ]),
  ]),
);

// 10 Closing
addSlide(
  bg([
    grid(
      {
        name: 'closing',
        width: fill,
        height: fill,
        columns: [fr(1.1), fr(0.9)],
        columnGap: 72,
        padding: { x: 112, y: 92 },
      },
      [
        column({ name: 'closing-copy', width: fill, height: fill, justify: 'center', gap: 26 }, [
          text('我们的核心表达', { name: 'closing-kicker', width: fill, height: hug, style: { fontFamily: font, fontSize: 30, color: C.gold2, bold: true } }),
          text('用现代计算技术，重构古建筑知识的观看、理解与传播方式。', {
            name: 'closing-title',
            width: wrap(860),
            height: hug,
            style: { fontFamily: font, fontSize: 70, bold: true, color: C.mist },
          }),
          text('省赛答辩重点：文化价值清晰、技术链路完整、创新点可演示、作品可交付。', {
            name: 'closing-sub',
            width: wrap(760),
            height: hug,
            style: { fontFamily: font, fontSize: 30, color: C.quiet },
          }),
        ]),
        column({ name: 'closing-sequence', width: fill, height: fill, justify: 'center', gap: 22 }, [
          openChip('1. 先讲问题'),
          openChip('2. 再演示系统', C.jade),
          openChip('3. 强调创新', C.cinnabar),
          openChip('4. 落到交付'),
        ]),
      ],
    ),
  ]),
);

await PresentationFile.exportPptx(deck).then((blob) => blob.save('output/output.pptx'));

for (let i = 0; i < deck.slides.count; i += 1) {
  const slide = deck.slides.items[i];
  const blob = await deck.export({ slide, format: 'png' });
  await writeFile(`scratch/preview-${String(i + 1).padStart(2, '0')}.png`, Buffer.from(await blob.arrayBuffer()));
}

const layoutBlob = await deck.inspect({ format: 'json' });
await writeFile('scratch/deck-inspect.json', JSON.stringify(layoutBlob, null, 2));
