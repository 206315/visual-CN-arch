import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSimilarBuildings, type SimilarityBuilding } from '../utils/buildingSimilarity';

type ShowcaseBuilding = SimilarityBuilding & {
  route: string;
};

const SHOWCASE_BUILDINGS: ShowcaseBuilding[] = [
  {
    id: 10001,
    name: '北京故宫角楼',
    year: 1420,
    dynasty: '明',
    desc: '紫禁城四角的皇家楼阁建筑，形制复杂，屋顶层次与空间构图极具代表性。',
    tech: '皇家木构·重檐复合屋顶',
    category: '楼阁',
    impactFactor: 10,
    route: '/palace',
    features: {
      structureType: '木构',
      roofType: '重檐歇山顶',
      material: ['木', '砖', '瓦'],
      constructionTech: ['榫卯', '斗拱', '重檐'],
    },
  },
  {
    id: 10002,
    name: '赵州桥',
    year: 605,
    dynasty: '隋',
    desc: '世界现存最早的单孔敞肩石拱桥，中国古代桥梁工程巅峰之作。',
    tech: '敞肩拱·单孔圆弧',
    category: '桥梁',
    impactFactor: 10,
    route: '/bridge',
    features: {
      structureType: '砖石',
      material: ['石'],
      constructionTech: ['敞肩拱', '单孔圆弧'],
    },
  },
  {
    id: 10003,
    name: '北京四合院',
    year: 1271,
    dynasty: '元',
    desc: '中国传统民居典范，以中轴对称和围合院落体现礼制与日常生活秩序。',
    tech: '中轴对称·围合院落',
    category: '民居',
    impactFactor: 8,
    route: '/siheyuan',
    features: {
      structureType: '木构',
      roofType: '硬山顶',
      material: ['木', '砖'],
      constructionTech: ['榫卯', '四合院', '院落布局'],
    },
  },
  {
    id: 10004,
    name: '应县木塔',
    year: 1056,
    dynasty: '辽',
    desc: '世界现存最古老、最高大的全木结构塔式建筑，体现高超木构减震智慧。',
    tech: '八角五层·斗拱减震',
    category: '塔',
    impactFactor: 10,
    route: '/timeline',
    features: {
      structureType: '木构',
      roofType: '攒尖顶',
      material: ['木'],
      constructionTech: ['榫卯', '斗拱', '减震'],
    },
  },
  {
    id: 10005,
    name: '五台山佛光寺东大殿',
    year: 857,
    dynasty: '唐',
    desc: '中国现存最大的唐代木构建筑，是研究唐代建筑技术与形制的关键样本。',
    tech: '唐代木构·七铺作斗拱',
    category: '寺庙',
    impactFactor: 10,
    route: '/timeline',
    features: {
      structureType: '木构',
      roofType: '单檐庑殿顶',
      material: ['木'],
      constructionTech: ['榫卯', '斗拱', '七铺作'],
    },
  },
  {
    id: 10006,
    name: '斗拱构架样本',
    year: 1100,
    dynasty: '宋',
    desc: '以斗、拱、昂、枋等构件为核心的中国木结构典型节点，是屋顶出檐与传力的关键。',
    tech: '榫卯节点·斗拱层级',
    category: '构件',
    impactFactor: 9,
    route: '/dougong',
    features: {
      structureType: '木构',
      material: ['木'],
      constructionTech: ['榫卯', '斗拱', '构件层级'],
    },
  },
];

function BuildingSimilarityShowcase() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState(SHOWCASE_BUILDINGS[0].id);

  const activeBuilding = useMemo(
    () => SHOWCASE_BUILDINGS.find((item) => item.id === activeId) ?? SHOWCASE_BUILDINGS[0],
    [activeId]
  );

  const recommendations = useMemo(
    () => getSimilarBuildings(activeBuilding, SHOWCASE_BUILDINGS, 3),
    [activeBuilding]
  );

  return (
    <section id="algorithm-showcase" className="py-20 px-4 ink-bg">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-imperial-gold tracking-wider mb-4">古建筑智能荐览</h2>
          <div className="chinese-divider max-w-xs mx-auto mb-4" />
          <p className="text-gray-500 tracking-wider text-sm">多因子相似度检索算法 · 类别、朝代、结构、屋顶、材料、工艺综合评分</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="gold-border rounded-lg p-5 bg-imperial-deeper/50 lg:col-span-1">
            <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-4">选择研究对象</h3>
            <div className="space-y-2">
              {SHOWCASE_BUILDINGS.map((building) => (
                <button
                  key={building.id}
                  onClick={() => setActiveId(building.id)}
                  className={`w-full rounded-lg px-3 py-3 text-left transition-all ${
                    activeBuilding.id === building.id
                      ? 'bg-imperial-gold/15 border border-imperial-gold/30'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-imperial-gold">{building.name}</span>
                    <span className="text-[10px] text-gray-500">{building.dynasty}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{building.tech}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="gold-border rounded-lg p-5 bg-imperial-deeper/50 lg:col-span-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs tracking-widest text-gray-500">当前研究对象</p>
                <h3 className="mt-1 text-2xl font-bold text-imperial-gold">{activeBuilding.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{activeBuilding.desc}</p>
              </div>
              <button
                onClick={() => navigate(activeBuilding.route)}
                className="rounded-lg border border-imperial-gold/30 px-4 py-2 text-xs font-bold tracking-wider text-imperial-gold transition-all hover:bg-imperial-gold/10"
              >
                前往对应模块
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((item) => {
                const target = item.building as ShowcaseBuilding;
                return (
                  <div key={item.building.id} className="rounded-lg border border-imperial-gold/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-imperial-gold">{item.building.name}</p>
                      <span className="rounded-full bg-imperial-gold/10 px-2 py-1 text-[10px] text-imperial-gold">{item.score}</span>
                    </div>
                    <p className="mt-2 text-[11px] text-gray-500">{item.building.dynasty} · {item.building.category}</p>
                    <div className="mt-3 space-y-1">
                      {item.reasons.map((reason) => (
                        <p key={reason} className="text-xs text-gray-400">{reason}</p>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate(target.route)}
                      className="mt-4 rounded-lg border border-imperial-gold/20 px-3 py-2 text-[11px] font-bold text-imperial-gold transition-all hover:bg-imperial-gold/10"
                    >
                      查看相关模块
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BuildingSimilarityShowcase;
