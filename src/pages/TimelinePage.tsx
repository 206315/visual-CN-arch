import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

// 建筑技术特征
interface TechFeatures {
  structureType: string;      // 结构类型：木构、砖石、土木、混合
  dougongType?: string;       // 斗拱类型：七踩、五踩、偷心造、计心造等
  roofType?: string;          // 屋顶形式：庑殿顶、歇山顶、悬山顶、硬山顶、攒尖顶
  material: string[];         // 主要材料：木、砖、石、瓦、土
  constructionTech: string[]; // 建造技术：榫卯、斗拱、拱券、悬挑、叠涩
}

// 建筑数据接口
interface Building {
  id: number;
  name: string;
  year: number;
  dynasty: string;
  desc: string;
  tech: string;
  category: string;
  impactFactor: number; // 影响因子 0-10
  features: TechFeatures; // 技术特征，用于计算相似度
}

// 生成测试建筑数据
function generateTestBuildings(): Building[] {
  const buildings: Building[] = [
    // 原始30个真实建筑 - 添加技术特征
    { id: 0, name: '紫禁城', year: 1420, dynasty: '明', desc: '世界最大宫殿建筑群，980座建筑，8707间房', tech: '宫殿群布局', category: '宫殿', impactFactor: 10, features: { structureType: '木构', roofType: '庑殿顶', material: ['木', '砖', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 1, name: '故宫角楼', year: 1420, dynasty: '明', desc: '九梁十八柱七十二脊，220攒斗拱', tech: '榫卯精密', category: '宫殿', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 2, name: '太和殿', year: 1695, dynasty: '清', desc: '中国最大木构殿堂，面阔11间，进深5间', tech: '重檐庑殿顶', category: '宫殿', impactFactor: 8, features: { structureType: '木构', roofType: '重檐庑殿顶', material: ['木', '砖', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 3, name: '天安门', year: 1651, dynasty: '清', desc: '明清皇城正门，重檐歇山顶，通高33.7米', tech: '城门建筑', category: '城门', impactFactor: 7, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '砖', '石'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 4, name: '蒯祥', year: 1398, dynasty: '明', desc: '明代建筑大师，紫禁城营造', tech: '木构技术', category: '人物', impactFactor: 6, features: { structureType: '木构', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 5, name: '营造法式', year: 1103, dynasty: '北宋', desc: '李诫编撰，中国古代建筑规范，3555条', tech: '标准化体系', category: '典籍', impactFactor: 10, features: { structureType: '木构', material: ['木', '砖'], constructionTech: ['榫卯', '斗拱', '标准化'] } },
    { id: 6, name: '天坛祈年殿', year: 1420, dynasty: '明', desc: '三层圆形殿堂，直径32.72米，28根金柱', tech: '圆形木构', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '攒尖顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 7, name: '应县木塔', year: 1056, dynasty: '辽', desc: '现存最高木塔，高67.31米，54种斗拱', tech: '斗拱减震', category: '塔', impactFactor: 9, features: { structureType: '木构', roofType: '攒尖顶', material: ['木'], constructionTech: ['榫卯', '斗拱', '减震'] } },
    { id: 8, name: '赵州桥', year: 605, dynasty: '隋', desc: '世界最古老敞肩拱石桥，跨度37.02米，李春设计', tech: '敞肩拱技术', category: '桥梁', impactFactor: 9, features: { structureType: '砖石', material: ['石'], constructionTech: ['拱券', '敞肩拱'] } },
    { id: 9, name: '颐和园', year: 1750, dynasty: '清', desc: '皇家园林，290公顷，3000余间建筑', tech: '园林建筑', category: '园林', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖', '石'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 10, name: '李诫', year: 1065, dynasty: '北宋', desc: '营造法式编撰者', tech: '建筑理论', category: '人物', impactFactor: 8, features: { structureType: '木构', material: ['木'], constructionTech: ['榫卯', '斗拱', '标准化'] } },
    { id: 11, name: '承德避暑山庄', year: 1703, dynasty: '清', desc: '世界最大皇家园林，564万平方米', tech: '山地园林', category: '园林', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖', '石'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 12, name: '独乐寺观音阁', year: 984, dynasty: '辽', desc: '现存最古老木结构高层建筑，23米高', tech: '木构抗震', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱', '暗层'] } },
    { id: 13, name: '卢沟桥', year: 1192, dynasty: '金', desc: '11孔联拱石桥，长266.5米，485只石狮', tech: '联拱技术', category: '桥梁', impactFactor: 6, features: { structureType: '砖石', material: ['石'], constructionTech: ['拱券', '联拱'] } },
    { id: 14, name: '佛光寺东大殿', year: 857, dynasty: '唐', desc: '中国现存最大唐代木构建筑，面阔7间', tech: '唐代斗拱', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '庑殿顶', material: ['木'], constructionTech: ['榫卯', '斗拱', '七铺作'] } },
    { id: 15, name: '南禅寺大殿', year: 782, dynasty: '唐', desc: '中国现存最古老木构建筑，面阔3间', tech: '唐代木构', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 16, name: '黄庭坚', year: 1045, dynasty: '北宋', desc: '书法家，建筑美学理论家', tech: '美学理论', category: '人物', impactFactor: 4, features: { structureType: '木构', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 17, name: '王安石', year: 1021, dynasty: '北宋', desc: '政治家，推动建筑改革', tech: '制度创新', category: '人物', impactFactor: 5, features: { structureType: '木构', material: ['木', '砖'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 18, name: '五台山南山寺', year: 1285, dynasty: '元', desc: '元代木构建筑群，7座殿堂', tech: '元代斗拱', category: '寺庙', impactFactor: 5, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 19, name: '广济桥', year: 1171, dynasty: '南宋', desc: '世界首座开合桥，长518米，24墩18梭船', tech: '浮桥技术', category: '桥梁', impactFactor: 6, features: { structureType: '混合', material: ['石', '木'], constructionTech: ['拱券', '浮桥'] } },
    { id: 20, name: '大雁塔', year: 652, dynasty: '唐', desc: '西安标志，7层方形砖塔，高64.5米', tech: '砖塔结构', category: '塔', impactFactor: 7, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['叠涩'] } },
    { id: 21, name: '圆明园', year: 1709, dynasty: '清', desc: '万园之园，350公顷，中西合璧', tech: '园林艺术', category: '园林', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖', '石'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 22, name: '苏州', year: -514, dynasty: '春秋', desc: '吴国都城，中国最早的城市规划典范', tech: '城市规划', category: '城市', impactFactor: 8, features: { structureType: '土木', material: ['土', '木'], constructionTech: ['夯土'] } },
    { id: 23, name: '悬空寺', year: 491, dynasty: '北魏', desc: '建于悬崖峭壁，40座殿阁，距地50米', tech: '悬挑技术', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '悬挑', '插梁'] } },
    { id: 24, name: '风雨桥', year: 1412, dynasty: '明', desc: '侗族特色桥梁，长64.4米，5座塔楼', tech: '廊桥技术', category: '桥梁', impactFactor: 5, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['榫卯', '廊桥'] } },
    { id: 25, name: '小雁塔', year: 707, dynasty: '唐', desc: '密檐式砖塔，原15层，现13层，高43米', tech: '密檐塔', category: '塔', impactFactor: 5, features: { structureType: '砖石', material: ['砖'], constructionTech: ['叠涩', '密檐'] } },
    { id: 26, name: '拙政园', year: 1509, dynasty: '明', desc: '江南园林代表，5.2公顷，假山池沼', tech: '江南园林', category: '园林', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖', '石'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 27, name: '程阳风雨桥', year: 1916, dynasty: '民国', desc: '侗族廊桥，长77.76米，5座塔楼', tech: '民族建筑', category: '桥梁', impactFactor: 4, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['榫卯', '廊桥'] } },
    { id: 28, name: '布达拉宫', year: 1645, dynasty: '清', desc: '藏式宫堡建筑，高117米，13层', tech: '藏式建筑', category: '宫殿', impactFactor: 7, features: { structureType: '混合', roofType: '平顶', material: ['石', '土', '木'], constructionTech: ['夯土', '碉楼'] } },
    { id: 29, name: '永乐宫', year: 1247, dynasty: '元', desc: '道教宫观，壁画1000平方米', tech: '壁画艺术', category: '道观', impactFactor: 5, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '斗拱'] } },
  ];

  // 生成91个测试建筑 (id 30-120) - 添加技术特征
  const categories = ['宫殿', '寺庙', '桥梁', '塔', '园林', '城门', '人物', '典籍', '祭祀', '城市', '道观'];
  const dynasties = ['春秋', '隋', '唐', '辽', '金', '北宋', '南宋', '元', '明', '清', '北魏', '民国'];
  const structureTypes = ['木构', '砖石', '土木', '混合'];
  const roofTypes = ['庑殿顶', '歇山顶', '悬山顶', '硬山顶', '攒尖顶', '平顶'];
  const materials = ['木', '砖', '石', '瓦', '土'];
  const constructionTechs = ['榫卯', '斗拱', '拱券', '悬挑', '叠涩', '夯土', '廊桥'];
  
  for (let i = 30; i <= 120; i++) {
    const impactFactor = Math.floor(Math.random() * 8) + 2; // 2-9
    const category = categories[Math.floor(Math.random() * categories.length)];
    const dynasty = dynasties[Math.floor(Math.random() * dynasties.length)];
    const year = Math.floor(Math.random() * 2500) - 500; // -500到2000年
    
    // 根据类别确定结构类型
    let structureType = structureTypes[Math.floor(Math.random() * structureTypes.length)];
    if (category === '桥梁') structureType = Math.random() > 0.5 ? '砖石' : '混合';
    if (category === '塔') structureType = Math.random() > 0.5 ? '木构' : '砖石';
    
    // 生成技术特征
    const roofType = roofTypes[Math.floor(Math.random() * roofTypes.length)];
    const materialCount = Math.floor(Math.random() * 3) + 1;
    const material: string[] = [];
    for (let m = 0; m < materialCount; m++) {
      const mat = materials[Math.floor(Math.random() * materials.length)];
      if (!material.includes(mat)) material.push(mat);
    }
    
    const techCount = Math.floor(Math.random() * 3) + 1;
    const constructionTech: string[] = [];
    for (let t = 0; t < techCount; t++) {
      const tech = constructionTechs[Math.floor(Math.random() * constructionTechs.length)];
      if (!constructionTech.includes(tech)) constructionTech.push(tech);
    }

    buildings.push({
      id: i,
      name: `测试建筑${i - 29}`,
      year,
      dynasty,
      desc: `测试建筑描述信息 - 第${i - 29}号测试案例`,
      tech: `测试技术${Math.floor(Math.random() * 20) + 1}`,
      category,
      impactFactor,
      features: {
        structureType,
        roofType,
        material,
        constructionTech,
      },
    });
  }

  return buildings;
}

const BUILDINGS: Building[] = generateTestBuildings();

// 建筑关联性计算参数权重配置
const CORRELATION_WEIGHTS = {
  region: 0.15,        // 地域
  time: 0.15,          // 时间
  designer: 0.20,      // 设计师/营造者
  structure: 0.15,     // 结构类型
  form: 0.15,          // 构型/形式
  cultural: 0.10,      // 文化意义
  category: 0.10,      // 建筑类型
};

// 计算两个建筑的地域关联度 (0-1)
function calculateRegionCorrelation(b1: Building, b2: Building): number {
  // 简化处理：同朝代建筑认为地域关联度较高
  // 实际应用中应该使用真实的地域数据（省/城市）
  const dynastyGroups: { [key: string]: string[] } = {
    '北方': ['辽', '金', '元', '明', '清'],
    '南方': ['南宋', '明', '清'],
    '中原': ['春秋', '隋', '唐', '北宋'],
    '西南': ['明', '清', '民国'],
    '西北': ['北魏', '唐', '清'],
  };
  
  for (const region in dynastyGroups) {
    const hasB1 = dynastyGroups[region].includes(b1.dynasty);
    const hasB2 = dynastyGroups[region].includes(b2.dynasty);
    if (hasB1 && hasB2) return 1.0;
  }
  return 0.3; // 不同区域但有微弱关联
}

// 计算时间关联度 (0-1)
function calculateTimeCorrelation(b1: Building, b2: Building): number {
  const yearDiff = Math.abs(b1.year - b2.year);
  // 时间越近关联度越高，使用指数衰减
  // 100年内关联度 > 0.9, 500年内 > 0.6, 1000年内 > 0.36
  return Math.exp(-yearDiff / 1000);
}

// 计算设计师关联度 (0-1)
function calculateDesignerCorrelation(b1: Building, b2: Building): number {
  // 简化：人物类别与相关建筑有强关联
  if (b1.category === '人物' && b2.tech.includes(b1.name)) return 1.0;
  if (b2.category === '人物' && b1.tech.includes(b2.name)) return 1.0;
  
  // 同朝代同类型建筑可能有相同营造传统
  if (b1.dynasty === b2.dynasty && b1.category === b2.category) return 0.6;
  
  return 0.0;
}

// 计算结构关联度 (0-1)
function calculateStructureCorrelation(b1: Building, b2: Building): number {
  const f1 = b1.features;
  const f2 = b2.features;
  
  let score = 0;
  // 结构类型相同
  if (f1.structureType === f2.structureType) score += 0.5;
  // 屋顶形式相同
  if (f1.roofType && f2.roofType && f1.roofType === f2.roofType) score += 0.3;
  // 材料相似度
  const commonMaterials = f1.material.filter(m => f2.material.includes(m));
  const allMaterials = [...new Set([...f1.material, ...f2.material])];
  if (allMaterials.length > 0) {
    score += 0.2 * (commonMaterials.length / allMaterials.length);
  }
  
  return score;
}

// 计算构型关联度 (0-1)
function calculateFormCorrelation(b1: Building, b2: Building): number {
  // 基于建造技术和建筑形式的相似度
  const f1 = b1.features;
  const f2 = b2.features;
  
  const commonTechs = f1.constructionTech.filter(t => f2.constructionTech.includes(t));
  const allTechs = [...new Set([...f1.constructionTech, ...f2.constructionTech])];
  
  if (allTechs.length === 0) return 0;
  return commonTechs.length / allTechs.length;
}

// 计算文化意义关联度 (0-1)
function calculateCulturalCorrelation(b1: Building, b2: Building): number {
  // 高影响因子建筑之间有文化关联
  const impactDiff = Math.abs(b1.impactFactor - b2.impactFactor);
  if (b1.impactFactor >= 8 && b2.impactFactor >= 8) return 0.8; // 都是顶级建筑
  if (b1.category === b2.category) return 0.5; // 同类型建筑
  return Math.max(0, 1 - impactDiff / 10) * 0.3;
}

// 计算类型关联度 (0-1)
function calculateCategoryCorrelation(b1: Building, b2: Building): number {
  return b1.category === b2.category ? 1.0 : 0.0;
}

// 综合关联性计算 - 使用指数加权
// 公式: correlation = exp(k * (weightedScore - 1))
// 这样高度相关的建筑分数会急剧上升，低相关的快速下降
function calculateCorrelation(b1: Building, b2: Building): number {
  const w = CORRELATION_WEIGHTS;
  
  // 计算各项得分
  const regionScore = calculateRegionCorrelation(b1, b2) * w.region;
  const timeScore = calculateTimeCorrelation(b1, b2) * w.time;
  const designerScore = calculateDesignerCorrelation(b1, b2) * w.designer;
  const structureScore = calculateStructureCorrelation(b1, b2) * w.structure;
  const formScore = calculateFormCorrelation(b1, b2) * w.form;
  const culturalScore = calculateCulturalCorrelation(b1, b2) * w.cultural;
  const categoryScore = calculateCategoryCorrelation(b1, b2) * w.category;
  
  // 加权总分 (0-1)
  const weightedScore = regionScore + timeScore + designerScore + 
                       structureScore + formScore + culturalScore + categoryScore;
  
  // 使用指数函数：correlation = exp(3 * (score - 0.7))
  // 这样 score = 0.9 → correlation ≈ 1.8
  // score = 0.7 → correlation = 1.0
  // score = 0.5 → correlation ≈ 0.55
  // score = 0.3 → correlation ≈ 0.30
  const k = 4; // 指数系数，越大区分度越高
  const baseThreshold = 0.6; // 基准阈值
  
  const correlation = Math.exp(k * (weightedScore - baseThreshold));
  
  return Math.min(correlation, 3.0); // 上限为3.0
}

// 根据关联性生成连线 - 只保留高关联度的连线
function generateLinksByCorrelation(
  buildings: Building[], 
  threshold: number = 1.0
): { source: number; target: number; value: number }[] {
  const links: { source: number; target: number; value: number }[] = [];
  
  for (let i = 0; i < buildings.length; i++) {
    for (let j = i + 1; j < buildings.length; j++) {
      const correlation = calculateCorrelation(buildings[i], buildings[j]);
      
      // 只保留超过阈值的强关联
      if (correlation >= threshold) {
        links.push({
          source: buildings[i].id,
          target: buildings[j].id,
          value: correlation,
        });
      }
    }
  }
  
  return links;
}

// 影响因子到颜色的映射 - 真实恒星颜色（哈佛光谱分类）
// 影响因子越高 = 恒星越亮越蓝（温度越高）
// 影响因子越低 = 恒星越暗越红（温度越低）
function getImpactColor(factor: number): string {
  // 高对比度颜色映射，让不同影响因子更容易区分
  if (factor >= 10) return '#00D9FF'; // 最高影响 - 青色（最醒目）
  if (factor >= 9) return '#4488FF';  // 极高影响 - 蓝色
  if (factor >= 8) return '#9966FF';  // 很高影响 - 紫色
  if (factor >= 7) return '#FF66CC';  // 高影响 - 粉色
  if (factor >= 6) return '#FFCC00';  // 中高影响 - 金色
  if (factor >= 5) return '#FF8833';  // 中等影响 - 橙色
  if (factor >= 3) return '#FF4444';  // 较低影响 - 红色
  return '#888888';                   // 低影响 - 灰色
}

// 影响因子到节点大小的映射 - 星星光点大小
function getNodeSize(factor: number): number {
  // 星星大小：影响大的稍微大一点，但都是小光点
  return 0.8 + factor * 0.15;
}

// 生成螺旋星系布局 - 高影响因子建筑靠近中心，有关联的建筑位置更近
function generateSpiralGalaxyLayout(buildings: Building[]) {
  const nodes: any[] = [];
  const centerX = 0, centerY = 0, centerZ = 0;

  // 第一步：计算所有建筑之间的关联性
  const correlationMatrix: Map<string, number> = new Map();
  for (let i = 0; i < buildings.length; i++) {
    for (let j = i + 1; j < buildings.length; j++) {
      const correlation = calculateCorrelation(buildings[i], buildings[j]);
      // 只保留强关联 - 阈值设为 0.9
      if (correlation >= 0.9) {
        correlationMatrix.set(`${buildings[i].id}-${buildings[j].id}`, correlation);
        correlationMatrix.set(`${buildings[j].id}-${buildings[i].id}`, correlation);
      }
    }
  }

  // 第二步：按影响因子排序（高到低）
  const sortedBuildings = [...buildings].sort((a, b) => b.impactFactor - a.impactFactor);

  // 第三步：生成基础位置
  const basePositions: Map<number, { x: number; y: number; z: number }> = new Map();

  sortedBuildings.forEach((building, index) => {
    let x, y, z;

    if (index === 0) {
      // 影响因子最高的建筑放在正中心
      x = centerX;
      y = centerY;
      z = centerZ;
    } else {
      // 根据影响因子决定距离中心的距离
      const impactRatio = (10 - building.impactFactor) / 10;
      const maxDistance = 140;
      const minDistance = 8;
      const distanceFromCenter = minDistance + impactRatio * (maxDistance - minDistance);

      // 螺旋臂布局
      const armCount = 3;
      const armIndex = building.id % armCount;
      const angleOffset = (armIndex * Math.PI * 2) / armCount;
      const spiralAngle = distanceFromCenter * 0.15 + angleOffset + (index * 0.1);

      x = Math.cos(spiralAngle) * distanceFromCenter;
      z = Math.sin(spiralAngle) * distanceFromCenter;
      const heightSpread = distanceFromCenter * 0.6;
      y = (Math.random() - 0.5) * heightSpread;

      // 添加少量随机扰动
      const jitter = distanceFromCenter * 0.05;
      x += (Math.random() - 0.5) * jitter;
      z += (Math.random() - 0.5) * jitter;
      y += (Math.random() - 0.5) * jitter * 2;
    }

    basePositions.set(building.id, { x, y, z });
  });

  // 第四步：根据关联性调整位置 - 让有关联的建筑靠近
  const finalPositions: Map<number, { x: number; y: number; z: number }> = new Map(basePositions);
  const pullDistance = 50; // 关联建筑拉近的目标距离

  // 迭代几次让位置收敛
  for (let iteration = 0; iteration < 3; iteration++) {
    correlationMatrix.forEach((correlation, key) => {
      const [id1, id2] = key.split('-').map(Number);
      const pos1 = finalPositions.get(id1)!;
      const pos2 = finalPositions.get(id2)!;

      // 计算当前距离
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const dz = pos2.z - pos1.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // 如果距离太远，将两个节点向中间拉近
      if (distance > pullDistance && distance > 0) {
        const pullStrength = 0.3 * (correlation / 3.0);
        const targetDistance = pullDistance * 0.8;
        const moveDistance = (distance - targetDistance) * pullStrength;

        const ratio = moveDistance / distance / 2;
        const moveX = dx * ratio;
        const moveY = dy * ratio;
        const moveZ = dz * ratio;

        // 影响因子高的建筑移动较少（保持中心地位）
        const b1 = buildings.find(b => b.id === id1)!;
        const b2 = buildings.find(b => b.id === id2)!;
        const weight1 = b1.impactFactor / 10;
        const weight2 = b2.impactFactor / 10;

        pos1.x += moveX * (1 - weight1);
        pos1.y += moveY * (1 - weight1);
        pos1.z += moveZ * (1 - weight1);

        pos2.x -= moveX * (1 - weight2);
        pos2.y -= moveY * (1 - weight2);
        pos2.z -= moveZ * (1 - weight2);
      }
    });
  }

  // 第五步：创建节点
  sortedBuildings.forEach((building) => {
    const pos = finalPositions.get(building.id)!;

    nodes.push({
      id: building.id,
      name: building.name,
      year: building.year,
      dynasty: building.dynasty,
      desc: building.desc,
      tech: building.tech,
      category: building.category,
      impactFactor: building.impactFactor,
      val: building.impactFactor,
      color: getImpactColor(building.impactFactor),
      size: getNodeSize(building.impactFactor),
      fx: pos.x,
      fy: pos.y,
      fz: pos.z,
      x: pos.x,
      y: pos.y,
      z: pos.z,
    });
  });

  // 第六步：生成连线 - 简化逻辑，只基于关联度和距离
  const links: { source: number; target: number; value: number }[] = [];
  const maxLinkDistance = 50; // 进一步缩短最大连线距离

  // 只生成强关联且距离合理的连线
  correlationMatrix.forEach((correlation, key) => {
    const [id1, id2] = key.split('-').map(Number);
    if (id1 < id2) {
      const pos1 = finalPositions.get(id1)!;
      const pos2 = finalPositions.get(id2)!;
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const dz = pos2.z - pos1.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // 只有距离足够近才连线
      if (distance <= maxLinkDistance) {
        links.push({
          source: id1,
          target: id2,
          value: correlation,
        });
      }
    }
  });

  return { nodes, links };
}

export default function TimelinePage() {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [hoverNode, setHoverNode] = useState<any>(null);
  const fgRef = useRef<any>(null);
  const nodeMeshesRef = useRef<Map<number, THREE.Group>>(new Map());

  const graphData = useMemo(() => generateSpiralGalaxyLayout(BUILDINGS), []);

  // 设置控制器限制
  useEffect(() => {
    // 延迟执行，确保 ForceGraph3D 已经初始化
    const timer = setTimeout(() => {
      if (fgRef.current) {
        const controls = fgRef.current.controls();
        if (controls) {
          controls.minDistance = 120;  // 最小距离（调大后最近时能看到星系全貌）
          controls.maxDistance = 800;  // 最大距离（防止拉得太远）
          controls.update();
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 节点点击处理
  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    // 聚焦到选中节点
    if (fgRef.current && node) {
      fgRef.current.cameraPosition(
        { x: node.x + 40, y: node.y + 40, z: node.z + 40 },
        node,
        2000
      );
    }
  }, []);

  // 更新所有节点大小以保持屏幕固定大小
  const updateNodeScales = useCallback(() => {
    if (!fgRef.current) return;

    const camera = fgRef.current.camera();
    if (!camera) return;

    // 目标屏幕大小（像素）- 更小的固定大小
    const targetScreenSize = 3; // 3像素左右，更小的恒星

    // 计算透视缩放因子
    const fov = camera.fov * (Math.PI / 180);
    const tanFov = Math.tan(fov / 2);

    // 获取控制器限制（如果已设置）
    const controls = fgRef.current.controls();
    const minDistance = controls?.minDistance || 120;
    const maxDistance = controls?.maxDistance || 800;

    // 遍历所有节点 mesh，调整大小
    nodeMeshesRef.current.forEach((mesh, nodeId) => {
      const node = graphData.nodes.find((n: any) => n.id === nodeId);
      if (!node) return;

      // 计算相机到节点的距离
      const nodePosition = new THREE.Vector3(node.x, node.y, node.z);
      let nodeDistance = camera.position.distanceTo(nodePosition);

      // 限制距离在有效范围内，防止缩放失真
      nodeDistance = Math.max(minDistance, Math.min(maxDistance, nodeDistance));

      // 计算需要的缩放比例，使节点在屏幕上保持固定大小
      const targetWorldSize = (targetScreenSize * 2 * nodeDistance * tanFov) / window.innerHeight;

      // 基础大小（影响因子决定）
      const baseSize = 0.15 + (node.impactFactor / 10) * 0.25;

      // 应用缩放，保持屏幕大小固定
      const scale = targetWorldSize / baseSize;
      mesh.scale.setScalar(scale);
    });
  }, [graphData]);

  // 使用 requestAnimationFrame 确保每帧都更新大小
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      updateNodeScales();
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [updateNodeScales]);

  // 节点悬停处理
  const handleNodeHover = useCallback((node: any) => {
    setHoverNode(node);
    document.body.style.cursor = node ? 'pointer' : 'default';
  }, []);

  // 创建星星的函数
  const createStarMesh = (node: any, targetScale: number = 1) => {
    const group = new THREE.Group();

    // 根据影响因子决定星星大小 - 更小的基础大小
    const baseSize = (0.15 + (node.impactFactor / 10) * 0.25) * targetScale;

    // 核心 - 高亮白点
    const coreGeometry = new THREE.SphereGeometry(baseSize * 0.3, 12, 12);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    // 简化光晕 - 只有3层
    const glowSizes = [0.8, 1.5, 2.5];
    const glowOpacities = [0.6, 0.3, 0.12];

    for (let i = 0; i < 3; i++) {
      const size = baseSize * glowSizes[i];
      const opacity = glowOpacities[i];

      // 颜色从白色渐变到恒星本色
      const color = new THREE.Color(node.color);
      const white = new THREE.Color(0xffffff);
      const finalColor = white.lerp(color, (i + 1) * 0.3);

      const glowGeometry = new THREE.SphereGeometry(size, 12, 12);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: finalColor,
        transparent: true,
        opacity: opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      group.add(glow);
    }

    return group;
  };

  // 自定义节点材质 - 使用球体实现真实星星效果
  const nodeThreeObject = useCallback((node: any) => {
    const group = createStarMesh(node, 1);

    // 存储节点 mesh 引用，用于后续调整大小
    nodeMeshesRef.current.set(node.id, group);

    return group;
  }, []);

  // 连线颜色 - 根据源节点的影响因子
  const linkColor = useCallback((link: any) => {
    const sourceNode = graphData.nodes.find(n => n.id === link.source.id || n.id === link.source);
    if (sourceNode) {
      return sourceNode.color;
    }
    return '#444444';
  }, [graphData]);

  // 影响因子说明 - 真实恒星光谱分类
  const impactLegend = [
    { factor: 10, color: '#00D9FF', label: '最高影响 (10)' },
    { factor: 9, color: '#4488FF', label: '极高影响 (9)' },
    { factor: 8, color: '#9966FF', label: '很高影响 (8)' },
    { factor: 7, color: '#FF66CC', label: '高影响 (7)' },
    { factor: 6, color: '#FFCC00', label: '中高影响 (6)' },
    { factor: 5, color: '#FF8833', label: '中等影响 (5)' },
    { factor: 3, color: '#FF4444', label: '较低影响 (3-4)' },
    { factor: 1, color: '#888888', label: '低影响 (0-2)' },
  ];

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {/* 标题 - 悬浮在星图上方 */}
      <div className="absolute top-16 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <h1 className="text-3xl md:text-4xl font-bold text-center tracking-wider pointer-events-auto"
            style={{ color: '#00D9FF', textShadow: '0 0 20px #00D9FF' }}>
          中国建筑史星图
        </h1>
        <p className="text-center text-gray-400 text-sm mt-2 tracking-widest pointer-events-auto">
          每颗恒星代表一座建筑 · 颜色表示历史影响因子 · 共{BUILDINGS.length}座
        </p>
      </div>

      {/* 3D 星图 - 全屏 */}
      <div className="w-full h-full">
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          nodeThreeObject={nodeThreeObject}
          linkColor={linkColor}
          linkOpacity={0.4}
          linkWidth={0.3}
          backgroundColor="#000000"
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          nodeLabel={(node: any) => `${node.name} (影响因子: ${node.impactFactor})`}
          warmupTicks={0}
          cooldownTicks={0}
          enableNodeDrag={false}
          enableNavigationControls={true}
          controlType="orbit"
          showNavInfo={false}
        />
      </div>

      {/* 影响因子图例 - 调整到底部左侧，避开操作说明 */}
      <div className="absolute bottom-16 left-6 bg-black/80 border border-gray-700 rounded-lg p-4 backdrop-blur-sm">
        <h3 className="text-sm font-bold mb-3" style={{ color: '#00D9FF' }}>影响因子</h3>
        <div className="space-y-2">
          {impactLegend.map(item => (
            <div key={item.factor} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: item.color,
                  boxShadow: `0 0 8px ${item.color}`,
                }}
              />
              <span className="text-gray-300">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 选中节点信息面板 - 调整位置避开顶部标题 */}
      {selectedNode && (
        <div className="absolute top-28 right-6 w-80 bg-black/90 border border-gray-700 rounded-lg p-5 backdrop-blur-sm animate-fade-in">
          <button
            onClick={() => setSelectedNode(null)}
            className="absolute top-2 right-2 text-gray-500 hover:text-white"
          >
            ✕
          </button>

          <div className="mb-4">
            <h2 className="text-xl font-bold" style={{ color: selectedNode.color }}>
              {selectedNode.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
              <span>{selectedNode.year > 0 ? `${selectedNode.year}年` : `公元前${Math.abs(selectedNode.year)}年`}</span>
              <span>·</span>
              <span>{selectedNode.dynasty}</span>
              <span>·</span>
              <span style={{ color: selectedNode.color }}>{selectedNode.category}</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">影响因子</span>
              <span className="text-lg font-bold" style={{ color: selectedNode.color }}>
                {selectedNode.impactFactor}/10
              </span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${selectedNode.impactFactor * 10}%`,
                  backgroundColor: selectedNode.color,
                  boxShadow: `0 0 10px ${selectedNode.color}`,
                }}
              />
            </div>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed mb-3">{selectedNode.desc}</p>

          <div className="bg-gray-900/50 px-3 py-2 rounded text-xs">
            <span className="text-gray-500">核心技术：</span>
            <span style={{ color: selectedNode.color }}>{selectedNode.tech}</span>
          </div>
        </div>
      )}

      {/* 悬停提示 - 调整位置 */}
      {hoverNode && !selectedNode && (
        <div className="absolute bottom-16 right-6 bg-black/80 border border-gray-700 rounded-lg px-4 py-2 backdrop-blur-sm">
          <span className="text-sm" style={{ color: hoverNode.color }}>
            {hoverNode.name} · 影响因子: {hoverNode.impactFactor}
          </span>
        </div>
      )}

      {/* 操作说明 - 固定在底部中央 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 border border-gray-700 rounded-lg px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-6 text-xs text-gray-400">
          <span>🖱️ 左键拖拽旋转</span>
          <span>🖱️ 滚轮缩放</span>
          <span>👆 点击节点查看详情</span>
          <span>✨ 共 {BUILDINGS.length} 座建筑</span>
        </div>
      </div>
    </div>
  );
}
