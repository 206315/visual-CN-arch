export interface AncientArchitectureChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ArchitecturePageContext {
  path: string;
  name: string;
  summary: string;
  prompts: string[];
  keywords: string[];
}

export const ARCHITECTURE_PAGE_CONTEXTS: ArchitecturePageContext[] = [
  {
    path: '/',
    name: '首页总览',
    summary: '首页用于总览中国古建筑互动可视化系统的核心模块，包括斗拱、桥梁、皇宫、四合院、时间演化与AR体验。',
    prompts: ['这个系统的核心亮点是什么？', '推荐我先看哪个模块最适合比赛展示？', '古建筑数字化保护有哪些现实意义？'],
    keywords: ['首页', '系统', '总览', '比赛', '展示'],
  },
  {
    path: '/dougong',
    name: '斗拱解析',
    summary: '斗拱解析模块重点展示中国古建筑斗拱的构件构成、层级关系、拆解方式与受力逻辑。',
    prompts: ['斗拱为什么能起到承重与抗震作用？', '七铺作斗拱的核心构件有哪些？', '垂直拆解和环形拆解各适合说明什么知识点？'],
    keywords: ['斗拱', '榫卯', '拱', '昂', '枋', '构件'],
  },
  {
    path: '/bridge',
    name: '桥梁抗震',
    summary: '桥梁抗震模块以赵州桥为核心，展示敞肩拱结构、受力分布与古代桥梁工程智慧。',
    prompts: ['赵州桥为什么能屹立千年？', '敞肩拱相比普通拱桥有什么优势？', '这个页面里的应力分布说明了什么？'],
    keywords: ['赵州桥', '桥梁', '抗震', '受力', '拱桥'],
  },
  {
    path: '/palace',
    name: '皇宫游览',
    summary: '皇宫游览模块围绕故宫角楼，展示皇家建筑的复杂木构形制、层级结构与空间观赏。',
    prompts: ['故宫角楼为什么被称为复杂木构建筑巅峰？', '角楼的九梁十八柱七十二脊是什么意思？', '如何从结构分析视图理解角楼层次？'],
    keywords: ['故宫', '角楼', '皇宫', '皇家建筑', '屋檐'],
  },
  {
    path: '/siheyuan',
    name: '四合院展示',
    summary: '四合院展示模块突出中国传统居住建筑的院落围合、中轴礼序、门庭空间与宜居智慧。',
    prompts: ['四合院为什么强调中轴对称？', '四合院有哪些典型空间构成？', '四合院体现了怎样的家庭礼制与居住智慧？'],
    keywords: ['四合院', '院落', '中轴', '门庭', '居住'],
  },
  {
    path: '/timeline',
    name: '建筑演化',
    summary: '建筑演化模块通过建筑史星图串联中国古建筑发展脉络，并提供 AI 建筑导师问答。',
    prompts: ['中国古建筑的发展脉络可以怎么理解？', '唐宋元明清建筑风格有什么差异？', '请推荐几座最有代表性的中国古建筑。'],
    keywords: ['建筑史', '演化', '时间线', '朝代', '星图'],
  },
  {
    path: '/ar',
    name: 'AR体验',
    summary: 'AR 模块强调古建筑数字内容与现实空间融合，适合教学展示、沉浸传播与文旅互动。',
    prompts: ['AR 展示古建筑有什么优势？', '这个项目的 AR 场景适合哪些教学应用？', 'AR 模块在比赛中如何突出创新性？'],
    keywords: ['AR', '现实融合', '沉浸', '移动端'],
  },
];

const LINKABLE_ROUTES = [
  { path: '/dougong', label: '斗拱解析', keywords: ['斗拱', '榫卯', '拱', '昂', '枋'] },
  { path: '/bridge', label: '桥梁抗震', keywords: ['桥', '桥梁', '赵州桥', '抗震', '受力', '应力'] },
  { path: '/palace', label: '皇宫游览', keywords: ['故宫', '角楼', '皇宫', '皇家', '屋檐'] },
  { path: '/siheyuan', label: '四合院', keywords: ['四合院', '院落', '门庭', '中轴', '居住'] },
  { path: '/timeline', label: '建筑演化', keywords: ['建筑史', '演化', '朝代', '历史', '星图'] },
  { path: '/ar', label: 'AR体验', keywords: ['AR', '现实', '沉浸', '手机'] },
];

export function getArchitectureContextByPath(pathname: string) {
  return ARCHITECTURE_PAGE_CONTEXTS.find((item) => item.path === pathname) ?? ARCHITECTURE_PAGE_CONTEXTS[0];
}

export function inferLinkedRoutes(text: string, pathname: string) {
  const normalized = text.toLowerCase();
  const routeScores = LINKABLE_ROUTES.map((route) => {
    const score = route.keywords.reduce((sum, keyword) => sum + (normalized.includes(keyword.toLowerCase()) ? 1 : 0), 0);
    return { ...route, score: route.path === pathname ? score + 1 : score };
  })
    .filter((route) => route.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ path, label }) => ({ path, label }));

  if (routeScores.length > 0) {
    return routeScores;
  }

  const currentContext = getArchitectureContextByPath(pathname);
  return LINKABLE_ROUTES.filter((route) => route.path !== pathname)
    .slice(0, currentContext.path === '/' ? 3 : 2)
    .map(({ path, label }) => ({ path, label }));
}

export async function callAncientArchitectureAI(params: {
  pathname: string;
  question: string;
  messages: AncientArchitectureChatMessage[];
}) {
  const context = getArchitectureContextByPath(params.pathname);
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-5733acc3f3e748efb2e91e4bad881a18';
  const apiUrl = import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
  const systemPrompt = [
    '你是一位中国古代建筑专家兼竞赛辅导助手。',
    '你的任务是回答用户关于中国古建筑、结构、历史、工艺、空间、文化和项目展示的问题。',
    '回答要专业、准确、通俗，优先结合当前页面上下文。',
    '如果问题和当前模块相关，要尽量引用该模块中的知识点。',
    '如果适合跳转到其他模块深入了解，请在回答中自然提到相关模块，例如斗拱解析、桥梁抗震、皇宫游览、四合院、建筑演化、AR体验。',
    `当前页面：${context.name}。`,
    `当前页面摘要：${context.summary}`,
  ].join('');

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      temperature: 0.7,
      max_tokens: 1400,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...params.messages.map((message) => ({ role: message.role, content: message.content })),
        {
          role: 'user',
          content: params.question,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI请求失败: ${response.status}`);
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content || '暂时没有获取到有效回答。';
  const linkedRoutes = inferLinkedRoutes(`${params.question}\n${answer}`, params.pathname);

  return {
    answer,
    linkedRoutes,
    context,
  };
}
