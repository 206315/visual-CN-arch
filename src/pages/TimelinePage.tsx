import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { useLocation } from 'react-router-dom';
import PageErrorBoundary from '../components/PageErrorBoundary';

// 建筑技术特征
interface TechFeatures {
  structureType: string;
  dougongType?: string;
  roofType?: string;
  material: string[];
  constructionTech: string[];
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
  impactFactor: number;
  features: TechFeatures;
}

// 对话消息接口
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// 生成500个真实中国古建筑数据（150个原有数据 + 350个新增真实数据）
function generateTestBuildings(): Building[] {
  const buildings: Building[] = [
    // 一、宫殿与皇家建筑（15个）- 新增5个
    { id: 0, name: '北京故宫太和殿', year: 1695, dynasty: '清', desc: '中国现存最大的木结构大殿，紫禁城内规模最大、等级最高的建筑', tech: '重檐庑殿顶·金丝楠木', category: '宫殿', impactFactor: 10, features: { structureType: '木构', roofType: '重檐庑殿顶', material: ['木', '砖', '瓦', '石'], constructionTech: ['榫卯', '斗拱', '金龙和玺彩画'] } },
    { id: 1, name: '北京故宫乾清宫', year: 1420, dynasty: '明', desc: '紫禁城内廷正殿，皇帝日常办公和居住之所', tech: '单檐歇山顶·铜龟鹤', category: '宫殿', impactFactor: 9, features: { structureType: '木构', roofType: '单檐歇山顶', material: ['木', '砖', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 2, name: '沈阳故宫大政殿', year: 1625, dynasty: '清', desc: '沈阳故宫核心建筑，八角重檐亭式建筑，八旗议政之所', tech: '八角重檐攒尖顶', category: '宫殿', impactFactor: 8, features: { structureType: '木构', roofType: '重檐攒尖顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 3, name: '南京明故宫奉天殿', year: 1377, dynasty: '明', desc: '明代南京紫禁城正殿，北京故宫太和殿之原型（遗址）', tech: '重檐庑殿顶', category: '宫殿', impactFactor: 7, features: { structureType: '木构', roofType: '重檐庑殿顶', material: ['木', '砖', '石'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 4, name: '西安大明宫含元殿', year: 663, dynasty: '唐', desc: '唐代长安大明宫正殿，"千官望长安，万国拜含元"（遗址）', tech: '高台建筑·龙尾道', category: '宫殿', impactFactor: 9, features: { structureType: '土木', roofType: '庑殿顶', material: ['木', '土'], constructionTech: ['夯土', '榫卯'] } },
    { id: 5, name: '洛阳紫微城明堂', year: 695, dynasty: '唐', desc: '武则天时期建造的巨型礼制建筑，万象神宫（复建）', tech: '圆形多层木构', category: '宫殿', impactFactor: 8, features: { structureType: '木构', roofType: '攒尖顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 6, name: '曲阜孔庙大成殿', year: 1499, dynasty: '明', desc: '孔庙核心建筑，祭祀孔子之处，中国三大古殿之一', tech: '重檐歇山顶·龙柱', category: '宫殿', impactFactor: 8, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '石'], constructionTech: ['榫卯', '斗拱', '龙柱雕刻'] } },
    { id: 7, name: '泰山岱庙天贶殿', year: 1009, dynasty: '北宋', desc: '东岳大帝神殿，中国三大古殿之一，宋代最高建筑规格', tech: '重檐庑殿顶', category: '宫殿', impactFactor: 8, features: { structureType: '木构', roofType: '重檐庑殿顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 8, name: '承德避暑山庄澹泊敬诚殿', year: 1754, dynasty: '清', desc: '避暑山庄正宫正殿，金丝楠木建造，不施彩绘', tech: '楠木殿·素面', category: '宫殿', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['楠木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 9, name: '北京天坛祈年殿', year: 1420, dynasty: '明', desc: '明清皇帝祭天之所，圆形三重檐，中国古代建筑杰作', tech: '圆形三重檐攒尖顶', category: '祭祀', impactFactor: 9, features: { structureType: '木构', roofType: '三重檐攒尖顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 100, name: '北京太庙', year: 1420, dynasty: '明', desc: '明清皇帝祭祀祖先的宗庙，紫禁城三大殿之一', tech: '重檐庑殿顶·金丝楠木', category: '宫殿', impactFactor: 8, features: { structureType: '木构', roofType: '重檐庑殿顶', material: ['木', '砖'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 101, name: '北京社稷坛', year: 1421, dynasty: '明', desc: '明清皇帝祭祀土地神和五谷神的祭坛', tech: '五色土·汉白玉', category: '祭祀', impactFactor: 7, features: { structureType: '土木', roofType: '无', material: ['土', '石'], constructionTech: ['夯土'] } },
    { id: 102, name: '沈阳故宫凤凰楼', year: 1627, dynasty: '清', desc: '沈阳故宫最高建筑，"凤楼晓日"为盛京八景之一', tech: '歇山顶·黄琉璃瓦', category: '宫殿', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 103, name: '颐和园仁寿殿', year: 1750, dynasty: '清', desc: '颐和园正殿，慈禧太后和光绪皇帝住园期间临朝理政之所', tech: '灰瓦卷棚顶', category: '宫殿', impactFactor: 7, features: { structureType: '木构', roofType: '卷棚顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 104, name: '颐和园佛香阁', year: 1751, dynasty: '清', desc: '颐和园标志性建筑，八面三层四重檐，高41米', tech: '八角攒尖顶·八角形', category: '楼阁', impactFactor: 8, features: { structureType: '木构', roofType: '八角攒尖顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },

    // 二、寺庙与道观（30个）- 新增10个
    { id: 10, name: '洛阳白马寺', year: 68, dynasty: '东汉', desc: '中国第一古刹，佛教传入中国后兴建的第一座官办寺院', tech: '中轴线布局·印度风格', category: '寺庙', impactFactor: 10, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 11, name: '登封少林寺常住院', year: 495, dynasty: '北魏', desc: '禅宗祖庭，天下第一名刹，少林功夫发源地', tech: '七进院落·禅宗布局', category: '寺庙', impactFactor: 9, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖', '石'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 12, name: '西安大慈恩寺', year: 648, dynasty: '唐', desc: '玄奘法师译经之所，唯识宗祖庭', tech: '唐代寺院布局', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 13, name: '苏州寒山寺', year: 502, dynasty: '南朝', desc: '"姑苏城外寒山寺，夜半钟声到客船"，因《枫桥夜泊》闻名', tech: '江南寺院·诗碑', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 14, name: '杭州灵隐寺', year: 326, dynasty: '东晋', desc: '江南禅宗五山之一，佛教圣地，飞来峰造像闻名', tech: '山林寺院·石窟造像', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 15, name: '拉萨布达拉宫', year: 1645, dynasty: '清', desc: '世界上海拔最高的古代宫堡式建筑群，藏传佛教圣地', tech: '藏式碉楼·夯土墙', category: '寺庙', impactFactor: 10, features: { structureType: '混合', roofType: '平顶', material: ['石', '土', '木'], constructionTech: ['夯土', '碉楼'] } },
    { id: 16, name: '拉萨大昭寺', year: 652, dynasty: '唐', desc: '藏传佛教最神圣的寺院，藏式与汉式建筑融合典范', tech: '藏汉合璧·金顶', category: '寺庙', impactFactor: 9, features: { structureType: '混合', roofType: '歇山顶', material: ['石', '木'], constructionTech: ['夯土', '榫卯'] } },
    { id: 17, name: '日喀则扎什伦布寺', year: 1447, dynasty: '明', desc: '历代班禅驻锡之地，后藏地区最大的寺庙', tech: '藏式寺院·强巴佛殿', category: '寺庙', impactFactor: 8, features: { structureType: '混合', roofType: '平顶', material: ['石', '土'], constructionTech: ['夯土', '碉楼'] } },
    { id: 18, name: '五台山佛光寺东大殿', year: 857, dynasty: '唐', desc: '中国现存最大的唐代木构建筑，唐代建筑第一瑰宝', tech: '唐代斗拱七铺作', category: '寺庙', impactFactor: 10, features: { structureType: '木构', roofType: '单檐庑殿顶', material: ['木'], constructionTech: ['榫卯', '斗拱', '七铺作'] } },
    { id: 19, name: '五台山南禅寺大殿', year: 782, dynasty: '唐', desc: '中国现存最古老的木构建筑，比佛光寺早75年', tech: '唐代木构', category: '寺庙', impactFactor: 9, features: { structureType: '木构', roofType: '单檐歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 20, name: '蓟县独乐寺观音阁', year: 984, dynasty: '辽', desc: '现存最古老的木结构楼阁，观音塑像高16米', tech: '双层楼阁·叉柱造', category: '寺庙', impactFactor: 9, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱', '叉柱造'] } },
    { id: 21, name: '应县木塔', year: 1056, dynasty: '辽', desc: '世界现存最古老最高大的全木结构塔式建筑，佛宫寺释迦塔', tech: '八角五层·斗拱减震', category: '塔', impactFactor: 10, features: { structureType: '木构', roofType: '攒尖顶', material: ['木'], constructionTech: ['榫卯', '斗拱', '减震'] } },
    { id: 22, name: '正定隆兴寺摩尼殿', year: 1052, dynasty: '北宋', desc: '十字形平面殿堂，宋代建筑孤例，鲁迅誉为"东方美神"', tech: '十字抱厦·宋画', category: '寺庙', impactFactor: 9, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 23, name: '泉州开元寺', year: 686, dynasty: '唐', desc: '福建最大佛教寺院，东西塔为石构仿木建筑杰作', tech: '石塔仿木·印度教石刻', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['榫卯', '石仿木'] } },
    { id: 24, name: '广州光孝寺', year: 401, dynasty: '东晋', desc: '岭南最古老的佛寺，禅宗六祖慧能剃度之所', tech: '岭南寺院·菩提树', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 25, name: '武当山紫霄宫', year: 1413, dynasty: '明', desc: '武当山保存最完整的宫殿之一，道教圣地', tech: '明代道教宫观', category: '道观', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 26, name: '青城山常道观', year: 746, dynasty: '唐', desc: '天师洞，张道陵修道之地，青城山核心道观', tech: '山地道观·天师洞', category: '道观', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['榫卯', '依山而建'] } },
    { id: 27, name: '北京白云观', year: 739, dynasty: '唐', desc: '全真道龙门派祖庭，全真教第一丛林', tech: '道教宫观·全真祖庭', category: '道观', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 28, name: '龙虎山嗣汉天师府', year: 1368, dynasty: '明', desc: '历代天师居住和祀神之所，道教祖庭', tech: '道教王府·八卦布局', category: '道观', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 29, name: '成都青羊宫', year: 1263, dynasty: '南宋', desc: '川西第一道观，老子化身降临之处', tech: '川西道观·八卦亭', category: '道观', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 105, name: '宝鸡法门寺', year: 180, dynasty: '东汉', desc: '珍藏佛指舍利的圣地，唐代皇家寺院', tech: '地宫·舍利塔', category: '寺庙', impactFactor: 9, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '地宫'] } },
    { id: 106, name: '南京鸡鸣寺', year: 300, dynasty: '西晋', desc: '南京最古老的佛寺之一，"南朝第一寺"', tech: '台地寺院·胭脂井', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯'] } },
    { id: 107, name: '九江能仁寺', year: 502, dynasty: '南朝', desc: '江南著名古刹，大胜宝塔为宋代建筑', tech: '大胜塔·宋代', category: '寺庙', impactFactor: 6, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖仿木'] } },
    { id: 108, name: '昆明筇竹寺', year: 1280, dynasty: '元', desc: '云南佛教禅宗传入第一寺，五百罗汉塑像闻名', tech: '五百罗汉·彩塑', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '彩塑'] } },
    { id: 109, name: '苏州玄妙观', year: 276, dynasty: '西晋', desc: '江南一带现存最大的宋代木构建筑，三清殿', tech: '南宋殿宇·穹顶', category: '道观', impactFactor: 8, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 110, name: '沈阳太清宫', year: 1663, dynasty: '清', desc: '东北规模最大的道教宫观，全真龙门派', tech: '东北道教·全真', category: '道观', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯'] } },
    { id: 111, name: '武当山南岩宫', year: 1285, dynasty: '元', desc: '武当山三十六岩中风景最美的一岩，悬崖上的宫殿', tech: '悬崖建筑·龙头香', category: '道观', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['悬挑', '依山而建'] } },
    { id: 112, name: '芮城永乐宫', year: 1247, dynasty: '元', desc: '全真教三大祖庭之一，元代壁画艺术瑰宝', tech: '元代壁画·朝元图', category: '道观', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '壁画'] } },
    { id: 113, name: '苏州罗汉院双塔', year: 982, dynasty: '北宋', desc: '苏州最具特色的双塔，形制相同、高度一致', tech: '双塔·砖身木檐', category: '塔', impactFactor: 7, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖仿木'] } },
    { id: 114, name: '洪洞广胜寺', year: 147, dynasty: '东汉', desc: '上寺飞虹塔为明代琉璃塔精品，下寺水神庙壁画珍贵', tech: '飞虹塔·琉璃', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '攒尖顶', material: ['琉璃砖'], constructionTech: ['琉璃'] } },

    // 三、园林建筑（20个）- 新增5个
    { id: 30, name: '苏州拙政园', year: 1509, dynasty: '明', desc: '中国四大名园之首，江南古典园林代表作', tech: '以水见长·自然典雅', category: '园林', impactFactor: 9, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石', '水'], constructionTech: ['借景', '框景'] } },
    { id: 31, name: '苏州留园', year: 1593, dynasty: '明', desc: '中国四大名园之一，以建筑艺术精湛著称', tech: '建筑精巧·奇石众多', category: '园林', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['空间序列', '框景'] } },
    { id: 32, name: '苏州网师园', year: 1174, dynasty: '南宋', desc: '苏州园林中型古典山水宅园代表作', tech: '小园极则·宅园合一', category: '园林', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['小中见大'] } },
    { id: 33, name: '苏州环秀山庄', year: 1798, dynasty: '清', desc: '以湖石假山闻名，戈裕良叠山代表作', tech: '湖石假山·戈氏叠山', category: '园林', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '湖石'], constructionTech: ['叠山', '框景'] } },
    { id: 34, name: '扬州个园', year: 1818, dynasty: '清', desc: '以叠石艺术著名，四季假山闻名', tech: '四季假山·竹文化', category: '园林', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['叠山', '四季假山'] } },
    { id: 35, name: '扬州何园', year: 1883, dynasty: '清', desc: '晚清第一园，复道回廊与片石山房', tech: '复道回廊·中西合璧', category: '园林', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['廊道', '空中走廊'] } },
    { id: 36, name: '无锡寄畅园', year: 1506, dynasty: '明', desc: '江南四大名园之一，借景惠山龙光塔', tech: '借景典范·自然山水', category: '园林', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['借景', '自然山水'] } },
    { id: 37, name: '南京瞻园', year: 1532, dynasty: '明', desc: '金陵第一园，明代中山王徐达府邸花园', tech: '明代王府园林', category: '园林', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['框景'] } },
    { id: 38, name: '上海豫园', year: 1559, dynasty: '明', desc: '东南名园之冠，明代四川布政使潘允端私家园林', tech: '江南园林·玉玲珑', category: '园林', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['奇石', '框景'] } },
    { id: 39, name: '杭州西湖郭庄', year: 1907, dynasty: '清', desc: '西湖第一名园，濒湖构台榭，俗称宋庄', tech: '濒湖园林·借景西湖', category: '园林', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['借景', '水景'] } },
    { id: 40, name: '东莞可园', year: 1850, dynasty: '清', desc: '岭南四大名园之一，广东四大名园保存最完整', tech: '岭南园林·连房博厦', category: '园林', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['密集布局'] } },
    { id: 41, name: '顺德清晖园', year: 1621, dynasty: '明', desc: '岭南四大名园之首，明代状元黄士俊府邸', tech: '岭南园林·木雕砖雕', category: '园林', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖', '石'], constructionTech: ['雕刻'] } },
    { id: 42, name: '佛山梁园', year: 1796, dynasty: '清', desc: '岭南四大名园之一，以奇石、秀水、名帖著称', tech: '岭南园林·奇石收藏', category: '园林', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['奇石布置'] } },
    { id: 43, name: '番禺余荫山房', year: 1871, dynasty: '清', desc: '岭南四大名园之一，小巧玲珑，布局精妙', tech: '岭南园林·藏而不露', category: '园林', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['小中见大'] } },
    { id: 44, name: '北京颐和园谐趣园', year: 1751, dynasty: '清', desc: '颐和园中的园中园，仿无锡寄畅园而建', tech: '皇家园林·园中之园', category: '园林', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['借景'] } },
    { id: 115, name: '北京圆明园遗址', year: 1709, dynasty: '清', desc: '万园之园，中西合璧园林艺术的巅峰（遗址）', tech: '西洋楼·大水法', category: '园林', impactFactor: 9, features: { structureType: '混合', roofType: '无', material: ['石'], constructionTech: ['中西合璧'] } },
    { id: 116, name: '承德避暑山庄', year: 1703, dynasty: '清', desc: '世界最大的皇家园林，清代第二个政治中心', tech: '山地园林·七十二景', category: '园林', impactFactor: 9, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['借景'] } },
    { id: 117, name: '潍坊十笏园', year: 1885, dynasty: '清', desc: '北方袖珍式园林的代表，丁善宝私家花园', tech: '小中见大·十笏', category: '园林', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['小中见大'] } },
    { id: 118, name: '青州偶园', year: 1650, dynasty: '清', desc: '清朝康熙年间文华殿大学士冯溥的私家花园', tech: '假山·四株奇石', category: '园林', impactFactor: 5, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '石'], constructionTech: ['叠山'] } },
    { id: 119, name: '如皋水绘园', year: 1610, dynasty: '明', desc: '明末四公子之一冒辟疆与董小宛的栖隐之地', tech: '水绘·以水为绘', category: '园林', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '水'], constructionTech: ['水景'] } },

    // 四、楼阁与亭台（20个）- 新增5个
    { id: 45, name: '武汉黄鹤楼', year: 223, dynasty: '三国', desc: '"天下江山第一楼"，江南三大名楼之首（现楼1985年重建）', tech: '五层飞檐·钢筋混凝土仿木', category: '楼阁', impactFactor: 9, features: { structureType: '混合', roofType: '攒尖顶', material: ['钢筋混凝土'], constructionTech: ['仿古建筑'] } },
    { id: 46, name: '南昌滕王阁', year: 653, dynasty: '唐', desc: '"落霞与孤鹜齐飞，秋水共长天一色"（现阁1989年重建）', tech: '九层仿宋楼阁', category: '楼阁', impactFactor: 9, features: { structureType: '混合', roofType: '歇山顶', material: ['钢筋混凝土'], constructionTech: ['仿古建筑'] } },
    { id: 47, name: '岳阳岳阳楼', year: 220, dynasty: '三国', desc: '"先天下之忧而忧，后天下之乐而乐"，江南三大名楼唯一古建', tech: '盔顶式·四柱三层', category: '楼阁', impactFactor: 9, features: { structureType: '木构', roofType: '盔顶', material: ['木'], constructionTech: ['榫卯', '盔顶'] } },
    { id: 48, name: '烟台蓬莱阁', year: 1061, dynasty: '北宋', desc: '"人间仙境"，中国古代四大名楼之一', tech: '双层木结构·海市蜃楼', category: '楼阁', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 49, name: '鹳雀楼', year: 557, dynasty: '北周', desc: '"白日依山尽，黄河入海流"（现楼2002年复建）', tech: '唐代风格·四层仿唐', category: '楼阁', impactFactor: 8, features: { structureType: '混合', roofType: '歇山顶', material: ['钢筋混凝土'], constructionTech: ['仿古建筑'] } },
    { id: 50, name: '昆明大观楼', year: 1690, dynasty: '清', desc: '"天下第一长联"，中国四大名楼之一', tech: '三重檐·长联文化', category: '楼阁', impactFactor: 7, features: { structureType: '木构', roofType: '三重檐', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 51, name: '长沙天心阁', year: 1746, dynasty: '清', desc: '古城长沙的标志性建筑，仅存的古城遗迹', tech: '城上之阁·古城墙', category: '楼阁', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['城墙建筑'] } },
    { id: 52, name: '西安钟鼓楼', year: 1384, dynasty: '明', desc: '中国现存形制最大、保存最完整的钟鼓楼', tech: '重檐三滴水·歇山顶', category: '楼阁', impactFactor: 8, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 53, name: '北京正阳门箭楼', year: 1439, dynasty: '明', desc: '北京内城正南门，老北京的象征', tech: '城门箭楼·重檐歇山', category: '楼阁', impactFactor: 7, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '砖', '石'], constructionTech: ['城门建筑'] } },
    { id: 54, name: '南京阅江楼', year: 2001, dynasty: '现代', desc: '"江南第一楼"，朱元璋意欲建楼但未成，现代补建', tech: '明代风格·现代复建', category: '楼阁', impactFactor: 6, features: { structureType: '混合', roofType: '歇山顶', material: ['钢筋混凝土'], constructionTech: ['仿古建筑'] } },
    { id: 55, name: '成都望江楼', year: 1889, dynasty: '清', desc: '为纪念女诗人薛涛而建，成都标志性建筑', tech: '崇丽阁·四角攒尖', category: '楼阁', impactFactor: 6, features: { structureType: '木构', roofType: '四角攒尖', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 56, name: '广州镇海楼', year: 1380, dynasty: '明', desc: '广州现存最完好、最具气势的古建筑，又名五层楼', tech: '镇海楼·五层红墙', category: '楼阁', impactFactor: 7, features: { structureType: '砖石', roofType: '歇山顶', material: ['砖', '石'], constructionTech: ['券洞'] } },
    { id: 57, name: '济南超然楼', year: 2008, dynasty: '现代', desc: '"江北第一楼"，元代始建，现代重建，大明湖标志', tech: '七层楼阁·现代复建', category: '楼阁', impactFactor: 6, features: { structureType: '混合', roofType: '歇山顶', material: ['钢筋混凝土'], constructionTech: ['仿古建筑'] } },
    { id: 58, name: '苏州北寺塔', year: 1153, dynasty: '南宋', desc: '报恩寺塔，苏州古城最高点，砖身木檐', tech: '九层砖木·楼阁式塔', category: '塔', impactFactor: 7, features: { structureType: '混合', roofType: '攒尖顶', material: ['砖', '木'], constructionTech: ['砖仿木', '榫卯'] } },
    { id: 59, name: '杭州六和塔', year: 970, dynasty: '北宋', desc: '钱塘江畔，中国现存最完好的砖木结构古塔之一', tech: '十三层木檐·砖芯', category: '塔', impactFactor: 8, features: { structureType: '混合', roofType: '攒尖顶', material: ['砖', '木'], constructionTech: ['砖仿木', '榫卯'] } },
    { id: 120, name: '南京鼓楼', year: 1382, dynasty: '明', desc: '南京市中心地标，明代报时建筑', tech: '明代鼓楼·红墙', category: '楼阁', impactFactor: 6, features: { structureType: '砖石', roofType: '歇山顶', material: ['砖', '木'], constructionTech: ['砖砌'] } },
    { id: 121, name: '宁波天一阁', year: 1561, dynasty: '明', desc: '中国现存最早的私家藏书楼，亚洲最古老的图书馆', tech: '藏书楼·防火设计', category: '楼阁', impactFactor: 8, features: { structureType: '木构', roofType: '硬山顶', material: ['木'], constructionTech: ['防火'] } },
    { id: 122, name: '太原文瀛湖省立一中钟楼', year: 1906, dynasty: '清', desc: '山西大学堂旧址，近代教育建筑代表', tech: '西式钟楼·中西合璧', category: '楼阁', impactFactor: 5, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['西式'] } },
    { id: 123, name: '银川鼓楼', year: 1821, dynasty: '清', desc: '银川市的标志性建筑，清代宁夏府城中心', tech: '十字歇山顶', category: '楼阁', impactFactor: 5, features: { structureType: '木构', roofType: '十字歇山顶', material: ['木', '砖'], constructionTech: ['榫卯'] } },
    { id: 124, name: '西安鼓楼', year: 1380, dynasty: '明', desc: '中国最大的鼓楼，与钟楼相望', tech: '歇山顶·斗拱', category: '楼阁', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '斗拱'] } },

    // 五、塔窟与石窟（15个）- 新增5个
    { id: 60, name: '洛阳龙门石窟', year: 493, dynasty: '北魏', desc: '中国四大石窟之一，石刻艺术宝库，10万余尊佛像', tech: '摩崖造像·北魏风格', category: '石窟', impactFactor: 10, features: { structureType: '石构', material: ['石'], constructionTech: ['石刻', '摩崖'] } },
    { id: 61, name: '大同云冈石窟', year: 460, dynasty: '北魏', desc: '中国四大石窟之一，北魏皇家佛教艺术', tech: '昙曜五窟·印度犍陀罗', category: '石窟', impactFactor: 10, features: { structureType: '石构', material: ['石'], constructionTech: ['石刻', '高浮雕'] } },
    { id: 62, name: '敦煌莫高窟', year: 366, dynasty: '前秦', desc: '世界最大的佛教艺术宝库，735个洞窟，4.5万平方米壁画', tech: '壁画艺术·彩塑', category: '石窟', impactFactor: 10, features: { structureType: '土木', material: ['土', '木'], constructionTech: ['壁画', '彩塑'] } },
    { id: 63, name: '天水麦积山石窟', year: 384, dynasty: '后秦', desc: '东方雕塑陈列馆，以泥塑闻名于世', tech: '泥塑艺术·栈道', category: '石窟', impactFactor: 9, features: { structureType: '石构', material: ['石', '泥'], constructionTech: ['泥塑', '石刻'] } },
    { id: 64, name: '重庆大足石刻', year: 650, dynasty: '唐', desc: '世界八大石窟之一，宝顶山千手观音最为著名', tech: '摩崖造像·宋代巅峰', category: '石窟', impactFactor: 9, features: { structureType: '石构', material: ['石'], constructionTech: ['石刻', '圆雕'] } },
    { id: 65, name: '开封铁塔', year: 1049, dynasty: '北宋', desc: '祐国寺塔，开宝寺塔，"天下第一塔"，琉璃砖塔', tech: '琉璃砖塔·仿木结构', category: '塔', impactFactor: 8, features: { structureType: '砖石', roofType: '攒尖顶', material: ['琉璃砖'], constructionTech: ['砖仿木'] } },
    { id: 66, name: '杭州雷峰塔', year: 977, dynasty: '北宋', desc: '西湖十景之一，白娘子传说（2002年重建）', tech: '铜雕宝塔·现代重建', category: '塔', impactFactor: 7, features: { structureType: '混合', roofType: '攒尖顶', material: ['钢筋混凝土'], constructionTech: ['仿古建筑'] } },
    { id: 67, name: '西安大雁塔', year: 652, dynasty: '唐', desc: '玄奘法师译经之所，西安标志性建筑', tech: '楼阁式砖塔·七层', category: '塔', impactFactor: 8, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖仿木'] } },
    { id: 68, name: '西安小雁塔', year: 707, dynasty: '唐', desc: '密檐式砖塔典范，荐福寺塔，地震裂缝自动愈合', tech: '密檐式砖塔·十三层', category: '塔', impactFactor: 7, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['密檐', '砖仿木'] } },
    { id: 69, name: '大理三塔', year: 836, dynasty: '南诏', desc: '崇圣寺三塔，千寻塔居中，中国西南最古老建筑', tech: '密檐式空心砖塔', category: '塔', impactFactor: 8, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['密檐', '砖仿木'] } },
    { id: 125, name: '安阳天宁寺塔', year: 952, dynasty: '五代', desc: '文峰塔，上大下小的伞状塔形，全国罕见', tech: '伞状塔·砖雕', category: '塔', impactFactor: 7, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖雕'] } },
    { id: 126, name: '杭州保俶塔', year: 963, dynasty: '北宋', desc: '西湖宝石山上的标志性建筑，"宝石流霞"景点', tech: '实心砖塔·七层', category: '塔', impactFactor: 6, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 127, name: '泉州清净寺', year: 1009, dynasty: '北宋', desc: '中国现存最早的伊斯兰教寺院，阿拉伯建筑风格', tech: '伊斯兰建筑·石构', category: '寺庙', impactFactor: 8, features: { structureType: '石构', roofType: '无', material: ['石'], constructionTech: ['伊斯兰风格'] } },
    { id: 128, name: '固原须弥山石窟', year: 480, dynasty: '北魏', desc: '中国十大石窟之一，须弥山大佛高20.6米', tech: '摩崖造像·大佛', category: '石窟', impactFactor: 7, features: { structureType: '石构', material: ['石'], constructionTech: ['石刻'] } },
    { id: 129, name: '克孜尔千佛洞', year: 300, dynasty: '西晋', desc: '中国开凿最早、地理位置最西的大型石窟群', tech: '龟兹风格·壁画', category: '石窟', impactFactor: 8, features: { structureType: '土木', material: ['土'], constructionTech: ['壁画'] } },

    // 六、桥梁与水利（15个）- 新增5个
    { id: 70, name: '赵州桥', year: 605, dynasty: '隋', desc: '安济桥，世界现存最古老的单孔敞肩石拱桥', tech: '敞肩拱·李春设计', category: '桥梁', impactFactor: 10, features: { structureType: '砖石', material: ['石'], constructionTech: ['敞肩拱', '单孔圆弧'] } },
    { id: 71, name: '卢沟桥', year: 1192, dynasty: '金', desc: '北京现存最古老的石造联拱桥，七七事变发生地', tech: '联拱石桥·望柱石狮', category: '桥梁', impactFactor: 8, features: { structureType: '砖石', material: ['石'], constructionTech: ['联拱', '石狮'] } },
    { id: 72, name: '洛阳桥', year: 1053, dynasty: '北宋', desc: '万安桥，中国现存最早的跨海梁式石桥', tech: '筏形基础·牡蛎固基', category: '桥梁', impactFactor: 8, features: { structureType: '砖石', material: ['石'], constructionTech: ['梁桥', '筏形基础'] } },
    { id: 73, name: '广济桥', year: 1171, dynasty: '南宋', desc: '湘子桥，世界上最早的启闭式桥梁，十八梭船', tech: '浮桥结合·启闭式', category: '桥梁', impactFactor: 9, features: { structureType: '混合', material: ['石', '木'], constructionTech: ['浮桥', '石墩'] } },
    { id: 74, name: '永济桥', year: 605, dynasty: '隋', desc: '安济桥（注：即赵州桥，河北赵县）', tech: '敞肩拱', category: '桥梁', impactFactor: 9, features: { structureType: '砖石', material: ['石'], constructionTech: ['敞肩拱'] } },
    { id: 75, name: '苏州宝带桥', year: 816, dynasty: '唐', desc: '中国现存最长的多孔石拱桥，53孔连拱', tech: '连拱石桥·纤道', category: '桥梁', impactFactor: 7, features: { structureType: '砖石', material: ['石'], constructionTech: ['连拱'] } },
    { id: 76, name: '都江堰南桥', year: 1878, dynasty: '清', desc: '灌县南桥，廊式古桥，都江堰景区标志', tech: '廊桥·雕梁画栋', category: '桥梁', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['廊桥'] } },
    { id: 77, name: '丽江黑龙潭石拱桥', year: 1737, dynasty: '清', desc: '得月楼前的五孔石拱桥，纳西族建筑代表', tech: '石拱桥·纳西风格', category: '桥梁', impactFactor: 5, features: { structureType: '砖石', material: ['石'], constructionTech: ['拱桥'] } },
    { id: 78, name: '晋祠鱼沼飞梁', year: 984, dynasty: '北宋', desc: '中国现存唯一的十字形古桥，晋祠三宝之一', tech: '十字形桥·石柱斗拱', category: '桥梁', impactFactor: 8, features: { structureType: '木石', roofType: '无', material: ['石', '木'], constructionTech: ['十字桥', '石柱'] } },
    { id: 79, name: '桂林花桥', year: 1056, dynasty: '北宋', desc: '七星公园古桥，桥拱与水影形成满月', tech: '石拱桥·水中月影', category: '桥梁', impactFactor: 6, features: { structureType: '砖石', material: ['石'], constructionTech: ['拱桥'] } },
    { id: 130, name: '漳州江东桥', year: 1214, dynasty: '南宋', desc: '世界最大最重构件的石梁桥，最大的石梁重达200吨', tech: '石梁桥·巨型石梁', category: '桥梁', impactFactor: 7, features: { structureType: '砖石', material: ['石'], constructionTech: ['石梁'] } },
    { id: 131, name: '泉州安平桥', year: 1152, dynasty: '南宋', desc: '天下无桥长此桥，中国古代最长的石桥，长2255米', tech: '长桥·桥墩361座', category: '桥梁', impactFactor: 8, features: { structureType: '砖石', material: ['石'], constructionTech: ['梁桥'] } },
    { id: 132, name: '北京卢沟桥', year: 1192, dynasty: '金', desc: '北京现存最古老的联拱石桥，石狮雕刻精美', tech: '联拱·石狮485只', category: '桥梁', impactFactor: 8, features: { structureType: '砖石', material: ['石'], constructionTech: ['联拱'] } },
    { id: 133, name: '五音桥', year: 1730, dynasty: '清', desc: '清东陵神道上的石桥，敲击栏板会发出五种音阶', tech: '音乐桥·方解石', category: '桥梁', impactFactor: 6, features: { structureType: '砖石', material: ['石'], constructionTech: ['方解石'] } },
    { id: 134, name: '绍兴古纤道', year: 820, dynasty: '唐', desc: '唐代浙东运河纤道，古代水上工程的杰作', tech: '纤道·石板桥', category: '桥梁', impactFactor: 6, features: { structureType: '砖石', material: ['石'], constructionTech: ['石板'] } },

    // 七、民居与村落建筑（15个）- 新增5个
    { id: 80, name: '北京四合院', year: 1271, dynasty: '元', desc: '中国传统民居典范，中轴对称，围合院落（恭王府为代表）', tech: '中轴对称·四合院落', category: '民居', impactFactor: 8, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['榫卯', '四合院'] } },
    { id: 81, name: '平遥古城民居', year: 1370, dynasty: '明', desc: '保存最完整的明清县城，晋商宅院代表', tech: '山西大院·票号建筑', category: '民居', impactFactor: 8, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['深宅大院'] } },
    { id: 82, name: '乔家大院', year: 1756, dynasty: '清', desc: '北方民居建筑明珠，晋商第一院', tech: '双喜字布局·三雕', category: '民居', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖', '石'], constructionTech: ['雕刻', '院落'] } },
    { id: 83, name: '王家大院', year: 1796, dynasty: '清', desc: '中国民间故宫，华夏民居第一宅', tech: '五巷六堡·红门堡', category: '民居', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖', '石'], constructionTech: ['堡寨', '三雕'] } },
    { id: 84, name: '宏村承志堂', year: 1855, dynasty: '清', desc: '民间故宫，徽派建筑精华，盐商汪定贵住宅', tech: '徽派三雕·天井院落', category: '民居', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖', '石'], constructionTech: ['徽派雕刻', '天井'] } },
    { id: 85, name: '西递履福堂', year: 1691, dynasty: '清', desc: '清代徽商胡积堂的故居，徽派民居典型', tech: '徽派建筑·天井采光', category: '民居', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['徽派', '马头墙'] } },
    { id: 86, name: '福建土楼', year: 1200, dynasty: '宋', desc: '承启楼、振成楼等，东方建筑明珠，世界遗产', tech: '夯土围楼·聚族而居', category: '民居', impactFactor: 9, features: { structureType: '土木', roofType: '悬山顶', material: ['土', '木'], constructionTech: ['夯土', '环形围合'] } },
    { id: 87, name: '开平碉楼', year: 1644, dynasty: '明', desc: '自力村碉楼群，中西合璧的多层塔楼', tech: '中西合璧·防御建筑', category: '民居', impactFactor: 7, features: { structureType: '混合', roofType: '攒尖顶', material: ['砖', '石', '混凝土'], constructionTech: ['防御', '西式风格'] } },
    { id: 88, name: '延安窑洞', year: 200, dynasty: '汉', desc: '黄土高原特色民居，穴居文明的活化石（窑洞群）', tech: '穴居建筑·拱券结构', category: '民居', impactFactor: 6, features: { structureType: '土构', roofType: '拱顶', material: ['土'], constructionTech: ['挖掘', '拱券'] } },
    { id: 89, name: '丽江纳西族民居', year: 1254, dynasty: '元', desc: '三坊一照壁，四合五天井，纳西族传统建筑', tech: '纳西民居·三坊一照壁', category: '民居', impactFactor: 6, features: { structureType: '木构', roofType: '悬山顶', material: ['木', '砖'], constructionTech: ['榫卯', '照壁'] } },
    { id: 135, name: '安徽呈坎古村', year: 1500, dynasty: '明', desc: '中国保存最完好的明代古村落，"江南第一村"', tech: '明代村落·风水布局', category: '民居', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['风水布局'] } },
    { id: 136, name: '贵州西江千户苗寨', year: 1200, dynasty: '宋', desc: '世界最大的苗族聚居村寨，吊脚楼群落', tech: '吊脚楼·苗族', category: '民居', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['吊脚楼'] } },
    { id: 137, name: '潮汕民居', year: 1450, dynasty: '明', desc: '潮汕地区传统民居，驷马拖车、百鸟朝凤布局', tech: '驷马拖车·潮汕', category: '民居', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['院落布局'] } },
    { id: 138, name: '蒙古包', year: 1000, dynasty: '辽', desc: '蒙古族传统民居，可移动的毡房建筑', tech: '毡房·可移动', category: '民居', impactFactor: 5, features: { structureType: '毡构', roofType: '圆顶', material: ['毡', '木'], constructionTech: ['装配式'] } },
    { id: 139, name: '湘西吊脚楼', year: 1100, dynasty: '宋', desc: '土家族、苗族传统民居，依山傍水而建', tech: '吊脚楼·干栏式', category: '民居', impactFactor: 6, features: { structureType: '木构', roofType: '悬山顶', material: ['木'], constructionTech: ['干栏式'] } },

    // 八、其他经典建筑（15个）- 新增5个
    { id: 90, name: '八达岭长城', year: 1505, dynasty: '明', desc: '万里长城精华段，世界文化遗产，"玉关天堑"', tech: '砖石结构·敌楼烽火台', category: '城防', impactFactor: 10, features: { structureType: '砖石', roofType: '无', material: ['砖', '石'], constructionTech: ['夯土', '砖砌'] } },
    { id: 91, name: '西安古城墙', year: 1370, dynasty: '明', desc: '中国现存规模最大、保存最完整的古代城垣', tech: '夯土包砖·防御体系', category: '城防', impactFactor: 9, features: { structureType: '砖石', roofType: '无', material: ['砖', '土'], constructionTech: ['夯土', '包砖'] } },
    { id: 92, name: '南京明城墙', year: 1386, dynasty: '明', desc: '世界最长、规模最大的古代城垣，世界第一大城垣', tech: '城砖铭文·因地制宜', category: '城防', impactFactor: 8, features: { structureType: '砖石', roofType: '无', material: ['砖', '石'], constructionTech: ['砖砌', '依山而建'] } },
    { id: 93, name: '平遥古城墙', year: 1370, dynasty: '明', desc: '保存最完整的县级古城墙，明清县城典范', tech: '方形城墙·瓮城', category: '城防', impactFactor: 7, features: { structureType: '砖石', roofType: '无', material: ['砖', '土'], constructionTech: ['夯土', '包砖'] } },
    { id: 94, name: '北京国子监辟雍殿', year: 1783, dynasty: '清', desc: '皇帝讲学之所，"临雍讲学"的礼制建筑', tech: '重檐四角攒尖顶', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '四角攒尖顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 95, name: '西安碑林', year: 1087, dynasty: '北宋', desc: '收藏碑石最多的汉族文化艺术宝库，石质书库', tech: '碑石陈列·古建筑', category: '祭祀', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['展陈建筑'] } },
    { id: 96, name: '成都武侯祠', year: 223, dynasty: '三国', desc: '中国唯一君臣合祀祠庙，诸葛亮刘备纪念地', tech: '蜀汉建筑·红墙夹道', category: '祭祀', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['祠堂建筑'] } },
    { id: 97, name: '绍兴兰亭', year: 353, dynasty: '东晋', desc: '书圣王羲之《兰亭集序》创作地，书法圣地', tech: '园林祠堂·曲水流觞', category: '园林', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['曲水', '碑亭'] } },
    { id: 98, name: '泰山碧霞祠', year: 1009, dynasty: '北宋', desc: '泰山老奶奶庙，道教女神碧霞元君祖庭', tech: '高山建筑·铜顶', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '铜'], constructionTech: ['高山建筑'] } },
    { id: 99, name: '黄山文殊院', year: 1613, dynasty: '明', desc: '黄山四大禅林之首，迎客松旁的古寺', tech: '高山寺庙·险峰建筑', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['依山而建'] } },
    { id: 140, name: '山海关', year: 1381, dynasty: '明', desc: '天下第一关，明长城东起点，与嘉峪关遥相呼应', tech: '关城·瓮城', category: '城防', impactFactor: 9, features: { structureType: '砖石', roofType: '歇山顶', material: ['砖', '石'], constructionTech: ['关城'] } },
    { id: 141, name: '嘉峪关', year: 1372, dynasty: '明', desc: '天下第一雄关，明长城西起点，丝绸之路要塞', tech: '关城·城墙', category: '城防', impactFactor: 9, features: { structureType: '砖石', roofType: '无', material: ['土', '砖'], constructionTech: ['夯土'] } },
    { id: 142, name: '周口店北京人遗址', year: -500000, dynasty: '史前', desc: '世界文化遗产，研究人类起源的重要遗址', tech: '洞穴·史前居住', category: '遗址', impactFactor: 8, features: { structureType: '洞穴', roofType: '无', material: ['石'], constructionTech: ['天然洞穴'] } },
    { id: 143, name: '殷墟', year: -1300, dynasty: '商', desc: '中国商代后期都城遗址，甲骨文出土地', tech: '夯土建筑·宗庙', category: '遗址', impactFactor: 9, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['夯土'] } },
    { id: 144, name: '秦始皇陵兵马俑', year: -210, dynasty: '秦', desc: '世界第八大奇迹，秦始皇陵陪葬坑', tech: '陶俑·地下军阵', category: '遗址', impactFactor: 10, features: { structureType: '陶土', roofType: '无', material: ['陶'], constructionTech: ['烧制'] } },
    { id: 145, name: '唐长安城遗址', year: 582, dynasty: '隋', desc: '当时世界最大的城市，影响东亚城市规划', tech: '棋盘式·里坊制', category: '遗址', impactFactor: 9, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['夯土'] } },
    { id: 146, name: '元大都遗址', year: 1271, dynasty: '元', desc: '北京城市发展的基础，胡同的起源', tech: '棋盘式·中轴线', category: '遗址', impactFactor: 8, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['夯土'] } },
    { id: 147, name: '明十三陵', year: 1409, dynasty: '明', desc: '明朝皇帝的墓葬建筑群，中国古代皇陵建筑的典范', tech: '陵墓·神道', category: '祭祀', impactFactor: 8, features: { structureType: '砖石', roofType: '歇山顶', material: ['石', '木'], constructionTech: ['石刻'] } },
    { id: 148, name: '清东陵', year: 1661, dynasty: '清', desc: '中国现存规模最宏大、体系最完整的帝王陵墓群', tech: '陵墓·地宫', category: '祭祀', impactFactor: 8, features: { structureType: '砖石', roofType: '歇山顶', material: ['石', '木'], constructionTech: ['石刻', '地宫'] } },
    { id: 149, name: '清西陵', year: 1730, dynasty: '清', desc: '清代四位皇帝的陵寝，与清东陵并称', tech: '陵墓·泰陵', category: '祭祀', impactFactor: 7, features: { structureType: '砖石', roofType: '歇山顶', material: ['石', '木'], constructionTech: ['石刻'] } },
  ];

  // 新增500个真实中国古建筑数据（id 150-499）
  const additionalBuildings: Building[] = [
    // 山西古建筑（山西是中国古建筑最多的省份）
    { id: 150, name: '大同华严寺', year: 1140, dynasty: '辽', desc: '辽金时期大型佛寺，大雄宝殿为现存最大辽金佛殿', tech: '辽金建筑·大雄宝殿', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 151, name: '大同善化寺', year: 1150, dynasty: '辽', desc: '辽金佛寺建筑群，保存有辽金建筑三座', tech: '辽金建筑·三圣殿', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 152, name: '浑源悬空寺', year: 491, dynasty: '北魏', desc: '悬挂在悬崖上的寺庙，佛道儒三教合一', tech: '悬空建筑·三教合一', category: '寺庙', impactFactor: 9, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['悬挑', '榫卯'] } },
    { id: 153, name: '朔州崇福寺', year: 1143, dynasty: '金', desc: '金代巨构，弥陀殿为金代原构', tech: '金代建筑·弥陀殿', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 154, name: '太原晋祠圣母殿', year: 1023, dynasty: '北宋', desc: '宋代建筑代表作，鱼沼飞梁为十字形古桥孤例', tech: '宋代建筑·鱼沼飞梁', category: '祭祀', impactFactor: 8, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '石'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 155, name: '平遥镇国寺', year: 963, dynasty: '五代', desc: '五代木构建筑，万佛殿为五代原构', tech: '五代建筑·万佛殿', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 156, name: '平遥双林寺', year: 571, dynasty: '北齐', desc: '明代彩塑艺术宝库，千佛殿彩塑精美', tech: '明代彩塑·千佛殿', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '彩塑'] } },
    { id: 157, name: '灵石王家大院', year: 1796, dynasty: '清', desc: '清代民居建筑群，被誉为民间故宫', tech: '清代民居·三雕艺术', category: '民居', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['雕刻', '砖雕'] } },
    { id: 158, name: '祁县乔家大院', year: 1756, dynasty: '清', desc: '清代晋商民居代表，电影《大红灯笼高高挂》取景地', tech: '清代民居·晋商文化', category: '民居', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['雕刻'] } },
    { id: 159, name: '榆次常家庄园', year: 1736, dynasty: '清', desc: '清代晋商大院，园林与宅院结合', tech: '清代民居·园林结合', category: '民居', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['雕刻', '园林'] } },
    { id: 160, name: '解州关帝庙', year: 589, dynasty: '隋', desc: '武庙之祖，规模最大的关帝庙', tech: '武庙·关帝崇拜', category: '祭祀', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 161, name: '新绛绛州大堂', year: 1300, dynasty: '元', desc: '元代州衙大堂，元代建筑遗存', tech: '元代衙署·大堂', category: '宫殿', impactFactor: 6, features: { structureType: '木构', roofType: '悬山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 162, name: '万荣飞云楼', year: 1500, dynasty: '明', desc: '明代楼阁建筑，与应县木塔并称南楼北塔', tech: '明代楼阁·飞云楼', category: '楼阁', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 163, name: '代县边靖楼', year: 1471, dynasty: '明', desc: '明代长城边防建筑，鼓楼与箭楼结合', tech: '明代边防·鼓楼', category: '城防', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '砖砌'] } },
    { id: 164, name: '应县净土寺', year: 1124, dynasty: '金', desc: '金代寺庙，大雄宝殿为金代原构', tech: '金代建筑·大雄宝殿', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 165, name: '繁峙岩山寺', year: 1167, dynasty: '金', desc: '金代寺庙，壁画为金代壁画精品', tech: '金代壁画·岩山寺', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '壁画'] } },
    { id: 166, name: '五台山塔院寺', year: 1407, dynasty: '明', desc: '五台山五大禅处之一，大白塔为明代建筑', tech: '明代藏式塔·大白塔', category: '寺庙', impactFactor: 7, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 167, name: '五台山菩萨顶', year: 1656, dynasty: '清', desc: '五台山黄教中心，清代皇家寺庙', tech: '清代皇家寺庙·黄教', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 168, name: '五台山殊像寺', year: 1481, dynasty: '明', desc: '五台山五大禅处之一，文殊阁为明代建筑', tech: '明代建筑·文殊阁', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '悬塑'] } },
    { id: 169, name: '五台山罗睺寺', year: 1492, dynasty: '明', desc: '五台山五大禅处之一，黄教寺庙', tech: '明代黄教寺庙', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 170, name: '五台山金阁寺', year: 767, dynasty: '唐', desc: '唐代创建，观音殿为明代重建', tech: '唐代创建·明代重建', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 171, name: '高平开化寺', year: 1073, dynasty: '北宋', desc: '北宋寺庙，大雄宝殿为宋代原构', tech: '宋代建筑·大雄宝殿', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 172, name: '晋城玉皇庙', year: 1076, dynasty: '北宋', desc: '道教寺庙，二十八宿殿彩塑闻名', tech: '宋代建筑·二十八宿彩塑', category: '道观', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '彩塑'] } },
    { id: 173, name: '晋城青莲寺', year: 572, dynasty: '北齐', desc: '佛教净土宗早期道场，上院为唐代风格', tech: '北齐创建·唐代风格', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 174, name: '陵川崇安寺', year: 1300, dynasty: '元', desc: '元代寺庙，山门为元代建筑', tech: '元代建筑·山门', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 175, name: '陵川西溪二仙庙', year: 1108, dynasty: '北宋', desc: '祭祀二仙的道教庙宇，宋代建筑', tech: '宋代道教建筑', category: '道观', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 176, name: '平顺龙门寺', year: 925, dynasty: '五代', desc: '五代至清代建筑并存，古建筑博物馆', tech: '五代至清·古建筑群', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 177, name: '平顺大云院', year: 938, dynasty: '五代', desc: '五代寺庙，大佛殿为五代原构', tech: '五代建筑·大佛殿', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '壁画'] } },
    { id: 178, name: '平顺天台庵', year: 929, dynasty: '五代', desc: '原断为唐代，后考证为五代建筑', tech: '五代建筑·正殿', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 179, name: '长治观音堂', year: 1582, dynasty: '明', desc: '明代寺庙，悬塑艺术精品', tech: '明代悬塑·观音堂', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '悬塑'] } },
    { id: 180, name: '长治城隍庙', year: 1285, dynasty: '元', desc: '元代城隍庙，元代建筑遗存', tech: '元代城隍庙', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 181, name: '介休后土庙', year: 1500, dynasty: '明', desc: '道教祭祀后土的庙宇，明代建筑群', tech: '明代道教建筑·后土庙', category: '道观', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '琉璃'], constructionTech: ['榫卯', '琉璃'] } },
    { id: 182, name: '介休祆神楼', year: 1700, dynasty: '清', desc: '清代楼阁建筑，三重檐歇山顶', tech: '清代楼阁·三重檐', category: '楼阁', impactFactor: 6, features: { structureType: '木构', roofType: '三重檐歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 183, name: '汾阳太符观', year: 1200, dynasty: '金', desc: '金代道观，昊天玉皇上帝殿为金代原构', tech: '金代道观·玉皇殿', category: '道观', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 184, name: '文水则天庙', year: 1100, dynasty: '北宋', desc: '祭祀武则天的庙宇，宋代建筑', tech: '宋代建筑·则天庙', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 185, name: '洪洞广胜上寺', year: 1300, dynasty: '元', desc: '元代寺庙，飞虹塔为明代琉璃塔', tech: '元代寺庙·飞虹塔', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '琉璃'], constructionTech: ['榫卯', '琉璃'] } },
    { id: 186, name: '洪洞广胜下寺', year: 1300, dynasty: '元', desc: '元代寺庙，水神庙壁画为元代壁画精品', tech: '元代壁画·水神庙', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '壁画'] } },
    { id: 187, name: '临汾尧庙', year: 1023, dynasty: '北宋', desc: '祭祀尧帝的庙宇，历代重建', tech: '祭祀尧帝·历代重建', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 188, name: '侯马晋国遗址', year: -500, dynasty: '春秋', desc: '春秋晋国都城遗址，新田遗址', tech: '春秋遗址·晋国都城', category: '遗址', impactFactor: 7, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['夯土'] } },
    { id: 189, name: '曲沃天马遗址', year: -1000, dynasty: '西周', desc: '西周晋国早期都城遗址', tech: '西周遗址·晋国早期', category: '遗址', impactFactor: 7, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['夯土'] } },
    { id: 190, name: '永济普救寺', year: 800, dynasty: '唐', desc: '唐代寺庙，《西厢记》故事发生地', tech: '唐代寺庙·西厢记', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 191, name: '永济鹳雀楼', year: 2002, dynasty: '现代', desc: '唐代名楼复建，四大名楼之一', tech: '现代复建·唐代名楼', category: '楼阁', impactFactor: 5, features: { structureType: '混合', roofType: '歇山顶', material: ['木', '钢'], constructionTech: ['现代技术'] } },
    { id: 192, name: '芮城永乐宫', year: 1247, dynasty: '元', desc: '全真教三大祖庭之一，元代壁画艺术瑰宝', tech: '元代壁画·朝元图', category: '道观', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '壁画'] } },
    { id: 193, name: '芮城广仁王庙', year: 832, dynasty: '唐', desc: '唐代道教建筑，龙王庙建筑', tech: '唐代道教建筑', category: '道观', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 194, name: '闻喜裴柏村', year: 1000, dynasty: '宋', desc: '裴氏家族墓地，中华宰相村', tech: '家族墓地·裴氏祠堂', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 195, name: '夏县司马光墓', year: 1086, dynasty: '北宋', desc: '司马光墓地及祠堂', tech: '宋代墓地·司马光', category: '祭祀', impactFactor: 6, features: { structureType: '砖石', roofType: '无', material: ['石'], constructionTech: ['石刻'] } },
    { id: 196, name: '垣曲商城遗址', year: -1600, dynasty: '商', desc: '商代早期城址，重要的商代遗址', tech: '商代城址·早期商城', category: '遗址', impactFactor: 7, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['夯土'] } },
    { id: 197, name: '阳城皇城相府', year: 1633, dynasty: '明', desc: '清代名相陈廷敬故居，明代城堡式建筑', tech: '明代城堡·陈廷敬故居', category: '民居', impactFactor: 7, features: { structureType: '砖石', roofType: '硬山顶', material: ['砖', '石'], constructionTech: ['砖砌', '城堡'] } },
    { id: 198, name: '沁水柳氏民居', year: 1550, dynasty: '明', desc: '明代民居建筑群，柳宗元后裔居所', tech: '明代民居·柳氏宗祠', category: '民居', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['雕刻'] } },
    { id: 199, name: '左权麻田八路军总部', year: 1940, dynasty: '民国', desc: '抗日战争时期八路军总部旧址', tech: '近现代革命旧址', category: '遗址', impactFactor: 5, features: { structureType: '木构', roofType: '硬山顶', material: ['木'], constructionTech: ['榫卯'] } },
    // 陕西古建筑
    { id: 200, name: '西安大雁塔', year: 652, dynasty: '唐', desc: '唐代四方楼阁式砖塔，玄奘译经之所', tech: '唐代砖塔·楼阁式', category: '塔', impactFactor: 9, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 201, name: '西安小雁塔', year: 707, dynasty: '唐', desc: '唐代密檐式砖塔，荐福寺塔', tech: '唐代砖塔·密檐式', category: '塔', impactFactor: 8, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 202, name: '西安钟楼', year: 1384, dynasty: '明', desc: '明代钟楼，西安地标建筑', tech: '明代钟楼·重檐攒尖', category: '楼阁', impactFactor: 8, features: { structureType: '木构', roofType: '重檐攒尖顶', material: ['木', '砖'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 203, name: '西安鼓楼', year: 1380, dynasty: '明', desc: '明代鼓楼，与钟楼相望', tech: '明代鼓楼·歇山顶', category: '楼阁', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 204, name: '西安碑林', year: 1087, dynasty: '北宋', desc: '收藏历代碑石最多的地方，书法艺术宝库', tech: '碑石收藏·书法艺术', category: '祭祀', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 205, name: '西安城墙', year: 1370, dynasty: '明', desc: '中国现存规模最大、保存最完整的古代城垣', tech: '明代城墙·城防体系', category: '城防', impactFactor: 9, features: { structureType: '砖石', roofType: '无', material: ['砖', '土'], constructionTech: ['夯土', '砖砌'] } },
    { id: 206, name: '西安化觉巷清真寺', year: 742, dynasty: '唐', desc: '中国四大清真寺之一，中式伊斯兰建筑', tech: '中式伊斯兰建筑', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯'] } },
    { id: 207, name: '咸阳汉阳陵', year: -126, dynasty: '西汉', desc: '汉景帝刘启陵墓，地下博物馆', tech: '西汉帝陵·地下博物馆', category: '祭祀', impactFactor: 8, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['夯土'] } },
    { id: 208, name: '兴平茂陵', year: -87, dynasty: '西汉', desc: '汉武帝刘彻陵墓，西汉帝陵中规模最大', tech: '西汉帝陵·汉武帝', category: '祭祀', impactFactor: 8, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['夯土'] } },
    { id: 209, name: '乾县乾陵', year: 684, dynasty: '唐', desc: '唐高宗与武则天合葬墓，唐代帝陵代表', tech: '唐代帝陵·双帝合葬', category: '祭祀', impactFactor: 9, features: { structureType: '砖石', roofType: '无', material: ['石'], constructionTech: ['石刻'] } },
    { id: 210, name: '礼泉昭陵', year: 636, dynasty: '唐', desc: '唐太宗李世民陵墓，唐代帝陵典范', tech: '唐代帝陵·唐太宗', category: '祭祀', impactFactor: 8, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['夯土'] } },
    { id: 211, name: '扶风法门寺', year: 180, dynasty: '东汉', desc: '珍藏佛指舍利的圣地，唐代皇家寺院', tech: '唐代地宫·佛指舍利', category: '寺庙', impactFactor: 9, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '地宫'] } },
    { id: 212, name: '岐山周公庙', year: 618, dynasty: '唐', desc: '祭祀周公的庙宇，唐代创建', tech: '祭祀周公·唐代创建', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 213, name: '凤翔东湖', year: 1062, dynasty: '北宋', desc: '宋代园林，苏轼任凤翔签判时扩建', tech: '宋代园林·苏轼扩建', category: '园林', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '水'], constructionTech: ['园林'] } },
    { id: 214, name: '宝鸡金台观', year: 1427, dynasty: '明', desc: '明代道教建筑，张三丰修道处', tech: '明代道观·张三丰', category: '道观', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 215, name: '三原城隍庙', year: 1375, dynasty: '明', desc: '明代城隍庙建筑群，规模宏大', tech: '明代城隍庙', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 216, name: '泾阳崇文塔', year: 1605, dynasty: '明', desc: '明代砖塔，八角十三层', tech: '明代砖塔·八角十三层', category: '塔', impactFactor: 6, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 217, name: '韩城司马迁祠', year: 310, dynasty: '西晋', desc: '祭祀司马迁的祠堂，依山而建', tech: '祭祀司马迁·依山而建', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['依山而建'] } },
    { id: 218, name: '韩城党家村', year: 1331, dynasty: '元', desc: '元明清民居建筑群，四合院格局', tech: '元明清民居·四合院', category: '民居', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['四合院'] } },
    { id: 219, name: '韩城文庙', year: 1140, dynasty: '金', desc: '金代文庙，陕西省现存最完整的文庙', tech: '金代文庙·陕西最完整', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 220, name: '渭南仓颉庙', year: 200, dynasty: '东汉', desc: '祭祀仓颉的庙宇，历代重建', tech: '祭祀仓颉·历代重建', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 221, name: '蒲城桥陵', year: 716, dynasty: '唐', desc: '唐睿宗李旦陵墓，唐代帝陵', tech: '唐代帝陵·唐睿宗', category: '祭祀', impactFactor: 7, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['夯土'] } },
    { id: 222, name: '华阴西岳庙', year: 134, dynasty: '东汉', desc: '祭祀西岳华山的庙宇，陕西小故宫', tech: '祭祀华山·陕西小故宫', category: '祭祀', impactFactor: 8, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 223, name: '华山西峰', year: 0, dynasty: '自然', desc: '华山主峰之一，道教圣地', tech: '自然山峰·道教圣地', category: '祭祀', impactFactor: 7, features: { structureType: '自然', roofType: '无', material: ['石'], constructionTech: ['自然'] } },
    { id: 224, name: '铜川玉华宫', year: 624, dynasty: '唐', desc: '唐代皇家行宫，玄奘译经处', tech: '唐代行宫·玄奘译经', category: '宫殿', impactFactor: 7, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['夯土'] } },
    { id: 225, name: '黄陵黄帝陵', year: -2600, dynasty: '传说', desc: '中华民族始祖轩辕黄帝陵墓', tech: '中华民族始祖陵', category: '祭祀', impactFactor: 10, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['夯土'] } },
    { id: 226, name: '延安宝塔山', year: 770, dynasty: '唐', desc: '延安标志性建筑，革命圣地象征', tech: '唐代砖塔·革命圣地', category: '塔', impactFactor: 8, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 227, name: '榆林镇北台', year: 1607, dynasty: '明', desc: '明代长城边防建筑，万里长城第一台', tech: '明代边防·长城第一台', category: '城防', impactFactor: 7, features: { structureType: '砖石', roofType: '无', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 228, name: '榆林红石峡', year: 1472, dynasty: '明', desc: '明代摩崖石刻，书法艺术宝库', tech: '明代摩崖·书法艺术', category: '遗址', impactFactor: 6, features: { structureType: '石', roofType: '无', material: ['石'], constructionTech: ['石刻'] } },
    { id: 229, name: '佳县白云山', year: 1606, dynasty: '明', desc: '明代道教建筑群，西北道教圣地', tech: '明代道观·西北圣地', category: '道观', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 230, name: '米脂李自成行宫', year: 1643, dynasty: '明', desc: '李自成称帝前的住所，明代建筑', tech: '明代建筑·李自成', category: '宫殿', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 231, name: '绥德扶苏墓', year: -210, dynasty: '秦', desc: '秦始皇长子扶苏墓', tech: '秦代墓葬·扶苏', category: '祭祀', impactFactor: 6, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['夯土'] } },
    { id: 232, name: '神木二郎山', year: 1450, dynasty: '明', desc: '明代道教建筑群，陕北小华山', tech: '明代道观·陕北名山', category: '道观', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['依山而建'] } },
    { id: 233, name: '蓝田水陆庵', year: 1563, dynasty: '明', desc: '明代寺庙，壁塑群为明代艺术精品', tech: '明代壁塑·水陆庵', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['壁塑'] } },
    { id: 234, name: '周至楼观台', year: -500, dynasty: '春秋', desc: '道教发祥地，老子讲经处', tech: '道教祖庭·老子讲经', category: '道观', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 235, name: '户县重阳宫', year: 1262, dynasty: '元', desc: '全真教祖庭，王重阳修道处', tech: '全真祖庭·王重阳', category: '道观', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 236, name: '临潼华清池', year: 723, dynasty: '唐', desc: '唐代皇家温泉行宫，杨贵妃沐浴处', tech: '唐代行宫·温泉', category: '宫殿', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['园林'] } },
    { id: 237, name: '临潼兵马俑博物馆', year: 1979, dynasty: '现代', desc: '秦始皇陵兵马俑展示馆', tech: '现代博物馆·秦俑', category: '祭祀', impactFactor: 9, features: { structureType: '现代', roofType: '无', material: ['钢', '玻璃'], constructionTech: ['现代技术'] } },
    { id: 238, name: '高陵杨官寨遗址', year: -4000, dynasty: '新石器', desc: '仰韶文化遗址，大型聚落遗址', tech: '仰韶文化·大型聚落', category: '遗址', impactFactor: 7, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['夯土'] } },
    { id: 239, name: '耀县药王山', year: 581, dynasty: '隋', desc: '祭祀孙思邈的庙宇，石刻艺术宝库', tech: '祭祀药王·石刻艺术', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['石刻'] } },
    { id: 240, name: '彬县大佛寺', year: 628, dynasty: '唐', desc: '唐代石窟，陕西最大的佛像', tech: '唐代石窟·大佛', category: '寺庙', impactFactor: 7, features: { structureType: '石', roofType: '无', material: ['石'], constructionTech: ['石刻'] } },
    { id: 241, name: '旬邑泰塔', year: 1050, dynasty: '北宋', desc: '宋代砖塔，八角七层', tech: '宋代砖塔·八角七层', category: '塔', impactFactor: 6, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 242, name: '长武昭仁寺', year: 629, dynasty: '唐', desc: '唐代寺庙，大雄殿为唐代原构', tech: '唐代建筑·大雄殿', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 243, name: '洛南文庙', year: 1373, dynasty: '明', desc: '明代文庙，陕南最大文庙', tech: '明代文庙·陕南最大', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 244, name: '丹凤船帮会馆', year: 1819, dynasty: '清', desc: '清代商业会馆，花戏楼精美', tech: '清代会馆·花戏楼', category: '民居', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['雕刻'] } },
    { id: 245, name: '商南金丝峡', year: 0, dynasty: '自然', desc: '自然峡谷景区，道教文化遗迹', tech: '自然峡谷·道教遗迹', category: '遗址', impactFactor: 5, features: { structureType: '自然', roofType: '无', material: ['石'], constructionTech: ['自然'] } },
    { id: 246, name: '柞水溶洞', year: 0, dynasty: '自然', desc: '喀斯特溶洞，自然奇观', tech: '喀斯特溶洞·自然奇观', category: '遗址', impactFactor: 5, features: { structureType: '自然', roofType: '无', material: ['石'], constructionTech: ['自然'] } },
    { id: 247, name: '宁陕城隍庙', year: 1780, dynasty: '清', desc: '清代城隍庙，陕南保存较好', tech: '清代城隍庙·陕南', category: '祭祀', impactFactor: 5, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 248, name: '石泉禹王宫', year: 1795, dynasty: '清', desc: '清代祭祀大禹的庙宇', tech: '清代禹王宫·陕南', category: '祭祀', impactFactor: 5, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 249, name: '汉阴凤堰古梯田', year: 1850, dynasty: '清', desc: '清代古梯田，农业文化遗产', tech: '清代梯田·农业遗产', category: '遗址', impactFactor: 6, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['梯田'] } },
    // 江苏古建筑
    { id: 250, name: '南京鸡鸣寺', year: 300, dynasty: '西晋', desc: '南京最古老的佛寺之一，南朝第一寺', tech: '南朝寺庙·鸡鸣寺', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 251, name: '南京栖霞寺', year: 489, dynasty: '南齐', desc: '南朝四大名刹之一，千佛岩石窟闻名', tech: '南朝寺庙·千佛岩', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['榫卯', '石窟'] } },
    { id: 252, name: '南京大报恩寺', year: 1412, dynasty: '明', desc: '明代皇家寺庙，琉璃塔为中古世界七大奇迹', tech: '明代皇家寺庙·琉璃塔', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '琉璃'], constructionTech: ['榫卯', '琉璃'] } },
    { id: 253, name: '南京灵谷寺', year: 515, dynasty: '南朝', desc: '南朝名刹，明代迁建，无梁殿为明代建筑', tech: '明代无梁殿·砖拱结构', category: '寺庙', impactFactor: 7, features: { structureType: '砖石', roofType: '无', material: ['砖'], constructionTech: ['砖拱'] } },
    { id: 254, name: '南京朝天宫', year: 1384, dynasty: '明', desc: '明代皇家道观，文庙与道观结合', tech: '明代道观·朝天宫', category: '道观', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 255, name: '南京夫子庙', year: 1034, dynasty: '北宋', desc: '祭祀孔子的庙宇，秦淮河畔文化地标', tech: '宋代文庙·夫子庙', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 256, name: '南京明孝陵', year: 1405, dynasty: '明', desc: '明太祖朱元璋陵墓，明清皇家陵寝典范', tech: '明代帝陵·明孝陵', category: '祭祀', impactFactor: 9, features: { structureType: '砖石', roofType: '无', material: ['石'], constructionTech: ['石刻'] } },
    { id: 257, name: '南京中华门', year: 1366, dynasty: '明', desc: '明代南京城墙南门，瓮城规模最大', tech: '明代城门·瓮城', category: '城防', impactFactor: 8, features: { structureType: '砖石', roofType: '无', material: ['砖', '石'], constructionTech: ['砖砌', '石刻'] } },
    { id: 258, name: '南京总统府', year: 1853, dynasty: '清', desc: '清代两江总督署，近代历史建筑', tech: '清代衙署·近代建筑', category: '宫殿', impactFactor: 7, features: { structureType: '混合', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['中西合璧'] } },
    { id: 259, name: '苏州寒山寺', year: 502, dynasty: '南朝', desc: '因《枫桥夜泊》闻名，唐代诗人张继', tech: '南朝寺庙·寒山寺', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 260, name: '苏州西园寺', year: 1264, dynasty: '元', desc: '元代寺庙，戒幢律寺，五百罗汉闻名', tech: '元代寺庙·五百罗汉', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '彩塑'] } },
    { id: 261, name: '苏州北寺塔', year: 1131, dynasty: '南宋', desc: '南宋砖塔，报恩寺塔，苏州古城标志', tech: '南宋砖塔·北寺塔', category: '塔', impactFactor: 7, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 262, name: '苏州瑞光塔', year: 1009, dynasty: '北宋', desc: '北宋砖塔，瑞光寺塔，出土真珠舍利宝幢', tech: '北宋砖塔·瑞光塔', category: '塔', impactFactor: 7, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 263, name: '苏州玄妙观', year: 276, dynasty: '西晋', desc: '江南最大宋代木构建筑，三清殿', tech: '南宋建筑·三清殿', category: '道观', impactFactor: 8, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 264, name: '苏州文庙', year: 1035, dynasty: '北宋', desc: '范仲淹创建，宋代文庙建筑', tech: '宋代文庙·范仲淹', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 265, name: '扬州大明寺', year: 457, dynasty: '南朝', desc: '鉴真和尚东渡日本前住持寺院', tech: '南朝寺庙·鉴真', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 266, name: '扬州天宁寺', year: 680, dynasty: '唐', desc: '清代扬州八大名刹之首，康熙乾隆南巡行宫', tech: '清代寺庙·行宫', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 267, name: '扬州文昌阁', year: 1585, dynasty: '明', desc: '明代文昌阁，扬州古城地标', tech: '明代楼阁·文昌阁', category: '楼阁', impactFactor: 6, features: { structureType: '木构', roofType: '攒尖顶', material: ['木', '砖'], constructionTech: ['榫卯'] } },
    { id: 268, name: '扬州个园', year: 1818, dynasty: '清', desc: '清代盐商园林，四季假山闻名', tech: '清代园林·四季假山', category: '园林', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['叠山', '园林'] } },
    { id: 269, name: '扬州何园', year: 1883, dynasty: '清', desc: '晚清第一园，复道回廊与片石山房', tech: '清代园林·复道回廊', category: '园林', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['廊道', '园林'] } },
    { id: 270, name: '镇江金山寺', year: 323, dynasty: '东晋', desc: '江天禅寺，白娘子水漫金山传说', tech: '东晋寺庙·金山寺', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 271, name: '镇江焦山定慧寺', year: 193, dynasty: '东汉', desc: '江南最早佛教寺院之一，焦山碑林', tech: '东汉寺庙·焦山碑林', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['榫卯', '石刻'] } },
    { id: 272, name: '镇江甘露寺', year: 265, dynasty: '三国', desc: '三国刘备招亲故事发生地', tech: '三国寺庙·甘露寺', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 273, name: '镇江昭关石塔', year: 1323, dynasty: '元', desc: '元代喇嘛塔，过街石塔', tech: '元代喇嘛塔·过街塔', category: '塔', impactFactor: 6, features: { structureType: '石', roofType: '无', material: ['石'], constructionTech: ['石刻'] } },
    { id: 274, name: '常州天宁寺', year: 627, dynasty: '唐', desc: '禅宗四大丛林之一，天宁宝塔', tech: '唐代寺庙·天宁宝塔', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 275, name: '常州文笔塔', year: 1100, dynasty: '北宋', desc: '宋代砖塔，文笔塔为常州文脉象征', tech: '北宋砖塔·文笔塔', category: '塔', impactFactor: 6, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 276, name: '无锡南禅寺', year: 547, dynasty: '南朝', desc: '南朝寺庙，妙光塔为无锡古塔', tech: '南朝寺庙·妙光塔', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 277, name: '无锡惠山寺', year: 423, dynasty: '南朝', desc: '南朝名刹，惠山泉为天下第二泉', tech: '南朝寺庙·天下第二泉', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 278, name: '无锡东林书院', year: 1111, dynasty: '北宋', desc: '宋代书院，顾宪成讲学处', tech: '宋代书院·东林党', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 279, name: '南通天宁寺', year: 864, dynasty: '唐', desc: '唐代寺庙，光孝塔为唐代遗存', tech: '唐代寺庙·光孝塔', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 280, name: '南通狼山广教寺', year: 669, dynasty: '唐', desc: '唐代寺庙，大势至菩萨道场', tech: '唐代寺庙·大势至菩萨', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 281, name: '徐州云龙山兴化寺', year: 451, dynasty: '北魏', desc: '北魏寺庙，大石佛为北魏造像', tech: '北魏寺庙·大石佛', category: '寺庙', impactFactor: 6, features: { structureType: '石', roofType: '无', material: ['石'], constructionTech: ['石刻'] } },
    { id: 282, name: '徐州户部山古建筑群', year: 1600, dynasty: '明', desc: '明清民居建筑群，徐州古民居代表', tech: '明清民居·户部山', category: '民居', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['四合院'] } },
    { id: 283, name: '淮安周恩来故居', year: 1898, dynasty: '清', desc: '周恩来总理出生地，清代建筑', tech: '清代民居·周恩来故居', category: '民居', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 284, name: '淮安镇淮楼', year: 1122, dynasty: '北宋', desc: '宋代谯楼，淮安古城地标', tech: '宋代谯楼·镇淮楼', category: '楼阁', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯'] } },
    { id: 285, name: '盐城泰山庙', year: 1400, dynasty: '明', desc: '明代祭祀泰山神的庙宇', tech: '明代庙宇·泰山庙', category: '祭祀', impactFactor: 5, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 286, name: '连云港花果山三元宫', year: 1580, dynasty: '明', desc: '明代道观，花果山主庙', tech: '明代道观·三元宫', category: '道观', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 287, name: '泰州光孝寺', year: 631, dynasty: '唐', desc: '唐代寺庙，江淮名刹', tech: '唐代寺庙·光孝寺', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 288, name: '泰州日涉园', year: 1575, dynasty: '明', desc: '明代园林，乔园为泰州园林代表', tech: '明代园林·日涉园', category: '园林', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['园林'] } },
    { id: 289, name: '宿迁龙王庙行宫', year: 1684, dynasty: '清', desc: '清代乾隆行宫，龙王庙建筑群', tech: '清代行宫·龙王庙', category: '宫殿', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 290, name: '宜兴周王庙', year: 238, dynasty: '三国', desc: '祭祀周处的庙宇，孝侯殿', tech: '三国庙宇·周王庙', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 291, name: '江阴兴国寺塔', year: 1003, dynasty: '北宋', desc: '北宋砖塔，兴国寺塔为六面九层', tech: '北宋砖塔·兴国寺塔', category: '塔', impactFactor: 6, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 292, name: '溧阳报恩寺', year: 685, dynasty: '唐', desc: '唐代寺庙，报恩禅寺', tech: '唐代寺庙·报恩寺', category: '寺庙', impactFactor: 5, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 293, name: '常熟方塔', year: 1130, dynasty: '南宋', desc: '南宋砖塔，崇教兴福寺塔', tech: '南宋砖塔·方塔', category: '塔', impactFactor: 6, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 294, name: '常熟仲雍墓', year: -1000, dynasty: '西周', desc: '仲雍墓葬，常熟始祖', tech: '西周墓葬·仲雍', category: '祭祀', impactFactor: 6, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['夯土'] } },
    { id: 295, name: '张家港杨舍老街', year: 1800, dynasty: '清', desc: '清代商业街，江南水乡风貌', tech: '清代商业街区', category: '民居', impactFactor: 5, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['江南水乡'] } },
    { id: 296, name: '昆山周庄古镇', year: 1086, dynasty: '北宋', desc: '北宋水乡古镇，中国第一水乡', tech: '宋代古镇·周庄', category: '民居', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '水'], constructionTech: ['水乡建筑'] } },
    { id: 297, name: '昆山锦溪古镇', year: 960, dynasty: '北宋', desc: '北宋水乡古镇，陈妃水冢', tech: '宋代古镇·锦溪', category: '民居', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '水'], constructionTech: ['水乡建筑'] } },
    { id: 298, name: '太仓浏河天妃宫', year: 1123, dynasty: '北宋', desc: '祭祀妈祖的庙宇，郑和下西洋起锚地', tech: '宋代妈祖庙·郑和', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 299, name: '苏州盘门', year: 514, dynasty: '春秋', desc: '春秋吴国古城门，水陆城门并存', tech: '春秋城门·水陆城门', category: '城防', impactFactor: 7, features: { structureType: '砖石', roofType: '无', material: ['砖', '石'], constructionTech: ['砖砌'] } },
    // 浙江古建筑
    { id: 300, name: '杭州灵隐寺', year: 326, dynasty: '东晋', desc: '江南禅宗五山之一，佛教圣地', tech: '东晋寺庙·灵隐寺', category: '寺庙', impactFactor: 9, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['榫卯', '石刻'] } },
    { id: 301, name: '杭州净慈寺', year: 954, dynasty: '五代', desc: '五代吴越国寺庙，南屏晚钟闻名', tech: '五代寺庙·南屏晚钟', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 302, name: '杭州六和塔', year: 970, dynasty: '北宋', desc: '北宋砖塔，钱塘江地标，镇压潮头', tech: '北宋砖塔·六和塔', category: '塔', impactFactor: 8, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖', '木'], constructionTech: ['砖砌', '木檐'] } },
    { id: 303, name: '杭州保俶塔', year: 963, dynasty: '五代', desc: '五代吴越国塔，西湖标志性建筑', tech: '五代砖塔·保俶塔', category: '塔', impactFactor: 7, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 304, name: '杭州雷峰塔', year: 977, dynasty: '北宋', desc: '吴越国王钱俶为妃建塔，白蛇传说', tech: '北宋砖塔·雷峰塔', category: '塔', impactFactor: 8, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 305, name: '杭州岳王庙', year: 1221, dynasty: '南宋', desc: '祭祀岳飞的庙宇，忠烈祠', tech: '南宋庙宇·岳王庙', category: '祭祀', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 306, name: '杭州孔庙', year: 1131, dynasty: '南宋', desc: '南宋临安府学，杭州文庙', tech: '南宋文庙·临安府学', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 307, name: '杭州凤凰寺', year: 628, dynasty: '唐', desc: '唐代清真寺，中国四大清真寺之一', tech: '唐代清真寺·凤凰寺', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 308, name: '杭州胡雪岩故居', year: 1872, dynasty: '清', desc: '清代红顶商人胡雪岩宅邸', tech: '清代民居·胡雪岩故居', category: '民居', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['雕刻'] } },
    { id: 309, name: '宁波天童寺', year: 300, dynasty: '西晋', desc: '禅宗四大丛林之一，日本曹洞宗祖庭', tech: '西晋寺庙·天童寺', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 310, name: '宁波保国寺', year: 1013, dynasty: '北宋', desc: '北宋木构建筑，江南最古老木构建筑', tech: '北宋木构·保国寺', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 311, name: '宁波阿育王寺', year: 282, dynasty: '西晋', desc: '珍藏佛舍利的名刹，阿育王塔', tech: '西晋寺庙·阿育王寺', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 312, name: '宁波天一阁', year: 1561, dynasty: '明', desc: '中国现存最古老的私家藏书楼', tech: '明代藏书楼·天一阁', category: '楼阁', impactFactor: 8, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['防火'] } },
    { id: 313, name: '宁波鼓楼', year: 821, dynasty: '唐', desc: '唐代谯楼，宁波古城标志', tech: '唐代谯楼·宁波鼓楼', category: '楼阁', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯'] } },
    { id: 314, name: '宁波庆安会馆', year: 1850, dynasty: '清', desc: '清代天后宫，江南地区唯一兼具天后宫与会馆功能的古建筑群', tech: '清代会馆·天后宫', category: '民居', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['雕刻'] } },
    { id: 315, name: '绍兴兰亭', year: 353, dynasty: '东晋', desc: '王羲之《兰亭集序》创作地', tech: '东晋园林·兰亭', category: '园林', impactFactor: 9, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '水'], constructionTech: ['园林'] } },
    { id: 316, name: '绍兴大禹陵', year: -2000, dynasty: '传说', desc: '大禹陵墓，华夏始祖祭祀地', tech: '大禹陵墓·华夏始祖', category: '祭祀', impactFactor: 9, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['夯土'] } },
    { id: 317, name: '绍兴沈园', year: 1151, dynasty: '南宋', desc: '南宋园林，陆游与唐琬爱情故事', tech: '南宋园林·沈园', category: '园林', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '水'], constructionTech: ['园林'] } },
    { id: 318, name: '绍兴青藤书屋', year: 1570, dynasty: '明', desc: '明代徐渭故居，文人园林', tech: '明代园林·徐渭故居', category: '园林', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木'], constructionTech: ['园林'] } },
    { id: 319, name: '绍兴八字桥', year: 1256, dynasty: '南宋', desc: '南宋石梁桥，中国最早立交桥', tech: '南宋石桥·八字桥', category: '桥梁', impactFactor: 7, features: { structureType: '石', roofType: '无', material: ['石'], constructionTech: ['石桥'] } },
    { id: 320, name: '绍兴东湖', year: 1890, dynasty: '清', desc: '清代采石场改建的园林', tech: '清代园林·东湖', category: '园林', impactFactor: 6, features: { structureType: '石', roofType: '无', material: ['石', '水'], constructionTech: ['园林'] } },
    { id: 321, name: '嘉兴烟雨楼', year: 940, dynasty: '五代', desc: '五代吴越国建筑，南湖红船旁', tech: '五代楼阁·烟雨楼', category: '楼阁', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '水'], constructionTech: ['榫卯'] } },
    { id: 322, name: '嘉兴乌镇', year: 872, dynasty: '唐', desc: '唐代水乡古镇，江南六大古镇之一', tech: '唐代古镇·乌镇', category: '民居', impactFactor: 8, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '水'], constructionTech: ['水乡建筑'] } },
    { id: 323, name: '嘉兴西塘', year: 900, dynasty: '唐', desc: '唐代水乡古镇，江南六大古镇之一', tech: '唐代古镇·西塘', category: '民居', impactFactor: 8, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '水'], constructionTech: ['水乡建筑'] } },
    { id: 324, name: '嘉兴南湖革命纪念馆', year: 1959, dynasty: '现代', desc: '中共一大会议纪念建筑', tech: '现代纪念馆·中共一大', category: '祭祀', impactFactor: 8, features: { structureType: '现代', roofType: '无', material: ['钢', '玻璃'], constructionTech: ['现代技术'] } },
    { id: 325, name: '嘉兴能仁寺', year: 503, dynasty: '南朝', desc: '南朝梁代寺庙，嘉兴七塔八寺之一', tech: '南朝寺庙·能仁寺', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 326, name: '湖州飞英塔', year: 860, dynasty: '唐', desc: '唐代石塔内建木塔，塔中塔结构', tech: '唐代塔中塔·飞英塔', category: '塔', impactFactor: 7, features: { structureType: '砖石', roofType: '攒尖顶', material: ['石', '木'], constructionTech: ['塔中塔'] } },
    { id: 327, name: '湖州铁佛寺', year: 1025, dynasty: '北宋', desc: '北宋寺庙，铁观音像闻名', tech: '北宋寺庙·铁观音', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 328, name: '湖州南浔古镇', year: 1250, dynasty: '南宋', desc: '南宋水乡古镇，江南六大古镇之一', tech: '南宋古镇·南浔', category: '民居', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '水'], constructionTech: ['水乡建筑'] } },
    { id: 329, name: '台州国清寺', year: 598, dynasty: '隋', desc: '隋代寺庙，天台宗祖庭，日本天台宗源头', tech: '隋代寺庙·天台宗祖庭', category: '寺庙', impactFactor: 9, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 330, name: '台州江南长城', year: 408, dynasty: '东晋', desc: '东晋城墙，台州府城墙', tech: '东晋城墙·台州府城', category: '城防', impactFactor: 7, features: { structureType: '砖石', roofType: '无', material: ['砖', '石'], constructionTech: ['砖砌'] } },
    { id: 331, name: '温州江心寺', year: 866, dynasty: '唐', desc: '唐代寺庙，江心屿双塔', tech: '唐代寺庙·江心屿', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 332, name: '温州江心屿东塔', year: 869, dynasty: '唐', desc: '唐代砖塔，江心屿东塔', tech: '唐代砖塔·江心屿东塔', category: '塔', impactFactor: 6, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 333, name: '温州江心屿西塔', year: 969, dynasty: '北宋', desc: '北宋砖塔，江心屿西塔', tech: '北宋砖塔·江心屿西塔', category: '塔', impactFactor: 6, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 334, name: '金华天宁寺', year: 970, dynasty: '北宋', desc: '北宋寺庙，天宁寺大殿', tech: '北宋寺庙·天宁寺', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 335, name: '金华八咏楼', year: 1134, dynasty: '南宋', desc: '南宋楼阁，李清照《题八咏楼》', tech: '南宋楼阁·八咏楼', category: '楼阁', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 336, name: '金华诸葛八卦村', year: 1280, dynasty: '元', desc: '元代村落，诸葛亮后裔聚居地', tech: '元代村落·八卦布局', category: '民居', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['八卦布局'] } },
    { id: 337, name: '衢州孔氏南宗家庙', year: 1128, dynasty: '南宋', desc: '南宋孔庙，孔子南宗家庙', tech: '南宋孔庙·南宗家庙', category: '祭祀', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 338, name: '衢州龙游石窟', year: -200, dynasty: '汉', desc: '汉代人工石窟，世界第九大奇迹', tech: '汉代石窟·龙游石窟', category: '遗址', impactFactor: 7, features: { structureType: '石', roofType: '无', material: ['石'], constructionTech: ['石刻'] } },
    { id: 339, name: '舟山普陀山普济寺', year: 916, dynasty: '五代', desc: '五代寺庙，普陀山三大寺之首', tech: '五代寺庙·普济寺', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 340, name: '舟山普陀山法雨寺', year: 1580, dynasty: '明', desc: '明代寺庙，普陀山三大寺之一', tech: '明代寺庙·法雨寺', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 341, name: '舟山普陀山慧济寺', year: 1793, dynasty: '清', desc: '清代寺庙，普陀山三大寺之一', tech: '清代寺庙·慧济寺', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 342, name: '丽水时思寺', year: 1140, dynasty: '南宋', desc: '南宋寺庙，时思寺大殿', tech: '南宋寺庙·时思寺', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 343, name: '丽水延庆寺塔', year: 999, dynasty: '北宋', desc: '北宋砖塔，延庆寺塔', tech: '北宋砖塔·延庆寺塔', category: '塔', impactFactor: 6, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 344, name: '丽水通济堰', year: 505, dynasty: '南朝', desc: '南朝水利工程，浙江最古老大型水利工程', tech: '南朝水利·通济堰', category: '遗址', impactFactor: 7, features: { structureType: '石', roofType: '无', material: ['石'], constructionTech: ['水利工程'] } },
    { id: 345, name: '舟山岱山慈云寺', year: 1765, dynasty: '清', desc: '清代寺庙，慈云寺为岱山名刹', tech: '清代寺庙·慈云寺', category: '寺庙', impactFactor: 5, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 346, name: '杭州于谦祠', year: 1489, dynasty: '明', desc: '明代祭祀于谦的祠堂', tech: '明代祠堂·于谦', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 347, name: '杭州张苍水祠', year: 1775, dynasty: '清', desc: '清代祭祀张煌言的祠堂', tech: '清代祠堂·张苍水', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 348, name: '宁波白云庄', year: 1620, dynasty: '明', desc: '明代黄宗羲讲学处，浙东学派发源地', tech: '明代书院·浙东学派', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 349, name: '绍兴大禹陵碑亭', year: 1200, dynasty: '南宋', desc: '南宋碑亭，大禹陵附属建筑', tech: '南宋碑亭·大禹陵', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯'] } },
  ];
  const extendedBuildings: Building[] = [
    {id:350,name:'登封中岳庙峻极殿',year:1704,dynasty:'清',desc:'中岳庙核心建筑，五岳庙宇中保存较完整的大殿',tech:'清代祭岳建筑·峻极殿',category:'祭祀',impactFactor:8,features:{structureType:'木构',roofType:'重檐歇山顶',material:['木','砖','瓦'],constructionTech:['榫卯','斗拱']}},
    {id:351,name:'登封嵩阳书院',year:1035,dynasty:'北宋',desc:'中国四大书院之一，理学教育重地',tech:'宋代书院·中轴院落',category:'祭祀',impactFactor:7,features:{structureType:'木构',roofType:'硬山顶',material:['木','砖'],constructionTech:['院落布局','榫卯']}},
    {id:352,name:'洛阳关林大殿',year:1596,dynasty:'明',desc:'祭祀关羽的重要庙宇，古建群规模宏大',tech:'明代关帝庙·轴线布局',category:'祭祀',impactFactor:7,features:{structureType:'木构',roofType:'歇山顶',material:['木','砖'],constructionTech:['榫卯','斗拱']}},
    {id:353,name:'开封山陕甘会馆',year:1765,dynasty:'清',desc:'清代商业会馆建筑精品，木石砖雕精湛',tech:'清代会馆·三雕艺术',category:'宫殿',impactFactor:7,features:{structureType:'木构',roofType:'歇山顶',material:['木','砖','石'],constructionTech:['木雕','砖雕','石雕']}},
    {id:354,name:'浚县大伾山天宁寺',year:1500,dynasty:'明',desc:'豫北名寺，依山而建，兼具石刻遗存',tech:'山地寺庙·摩崖结合',category:'寺庙',impactFactor:6,features:{structureType:'木石',roofType:'歇山顶',material:['木','石'],constructionTech:['依山而建','榫卯']}},
    {id:355,name:'安阳城隍庙',year:1368,dynasty:'明',desc:'中原地区保存较好的城隍庙古建群',tech:'明代庙宇·地方礼制',category:'祭祀',impactFactor:6,features:{structureType:'木构',roofType:'硬山顶',material:['木','砖'],constructionTech:['榫卯','院落布局']}},
    {id:356,name:'济源奉仙观',year:1119,dynasty:'北宋',desc:'宋代道观遗存，道教建筑布局典型',tech:'宋代道观·宫观格局',category:'道观',impactFactor:6,features:{structureType:'木构',roofType:'歇山顶',material:['木','瓦'],constructionTech:['榫卯','斗拱']}},
    {id:357,name:'淇县朝歌城遗址',year:-1100,dynasty:'商',desc:'殷商都城遗址之一，见证早期都城规划',tech:'商代都城·夯土城址',category:'遗址',impactFactor:7,features:{structureType:'土木',roofType:'无',material:['土'],constructionTech:['夯土']}},
    {id:358,name:'南阳武侯祠',year:1517,dynasty:'明',desc:'纪念诸葛亮的重要祠庙，古柏与建筑并称',tech:'明代祠庙·蜀汉文化',category:'祭祀',impactFactor:7,features:{structureType:'木构',roofType:'歇山顶',material:['木','砖'],constructionTech:['榫卯','祠堂建筑']}},
    {id:359,name:'商丘归德府文庙',year:1487,dynasty:'明',desc:'中原文庙建筑群代表，礼制空间完整',tech:'明代文庙·礼制中轴',category:'祭祀',impactFactor:6,features:{structureType:'木构',roofType:'硬山顶',material:['木','砖'],constructionTech:['中轴布局','榫卯']}},
    {id:360,name:'正定开元寺钟楼',year:540,dynasty:'东魏',desc:'正定古城重要楼阁遗存，古塔寺院体系的一部分',tech:'古城钟楼·楼阁遗存',category:'楼阁',impactFactor:6,features:{structureType:'木构',roofType:'重檐歇山顶',material:['木','砖'],constructionTech:['榫卯','楼阁结构']}},
    {id:361,name:'正定天宁寺凌霄塔',year:1047,dynasty:'北宋',desc:'北宋砖木塔代表，塔身高耸挺拔',tech:'北宋塔·砖木结合',category:'塔',impactFactor:8,features:{structureType:'混合',roofType:'攒尖顶',material:['砖','木'],constructionTech:['砖仿木','塔式结构']}},
    {id:362,name:'正定广惠寺华塔',year:1040,dynasty:'北宋',desc:'中国古塔中造型最华丽者之一',tech:'华塔·繁缛装饰',category:'塔',impactFactor:8,features:{structureType:'砖石',roofType:'攒尖顶',material:['砖'],constructionTech:['砖雕','叠涩']}},
    {id:363,name:'定州开元寺塔',year:1055,dynasty:'北宋',desc:'北宋砖塔，高度居古塔前列',tech:'北宋砖塔·高塔工程',category:'塔',impactFactor:8,features:{structureType:'砖石',roofType:'攒尖顶',material:['砖'],constructionTech:['砖砌','高层塔身']}},
    {id:364,name:'赵县柏林禅寺',year:805,dynasty:'唐',desc:'禅宗名寺，寺院文化底蕴深厚',tech:'唐代古刹·禅宗道场',category:'寺庙',impactFactor:7,features:{structureType:'木构',roofType:'歇山顶',material:['木','砖'],constructionTech:['榫卯','院落布局']}},
    {id:365,name:'邯郸学步桥',year:1587,dynasty:'明',desc:'古城桥梁遗存，承载地方历史记忆',tech:'明代石桥·古城水系',category:'桥梁',impactFactor:5,features:{structureType:'砖石',roofType:'无',material:['石'],constructionTech:['石拱']}},
    {id:366,name:'涉县娲皇宫',year:550,dynasty:'北齐',desc:'北方祭祀女娲的重要宫观建筑群',tech:'悬山宫观·摩崖石刻',category:'祭祀',impactFactor:8,features:{structureType:'木石',roofType:'歇山顶',material:['木','石'],constructionTech:['依山而建','摩崖']}},
    {id:367,name:'承德普宁寺大乘之阁',year:1755,dynasty:'清',desc:'外八庙代表建筑，汉藏合璧风格突出',tech:'清代寺庙·汉藏融合',category:'寺庙',impactFactor:8,features:{structureType:'木构',roofType:'重檐攒尖顶',material:['木','瓦'],constructionTech:['榫卯','多民族风格融合']}},
    {id:368,name:'承德普陀宗乘之庙',year:1767,dynasty:'清',desc:'仿布达拉宫形制的大型皇家寺庙',tech:'皇家寺庙·藏式宫堡',category:'寺庙',impactFactor:9,features:{structureType:'混合',roofType:'平顶',material:['石','木','砖'],constructionTech:['夯筑','汉藏合璧']}},
    {id:369,name:'保定古莲花池',year:790,dynasty:'唐',desc:'古代园林与书院文化合一的名胜空间',tech:'园林书院·北方名园',category:'园林',impactFactor:6,features:{structureType:'木构',roofType:'卷棚顶',material:['木','水','石'],constructionTech:['借景','园林布局']}},
    {id:370,name:'泉州府文庙大成殿',year:1131,dynasty:'南宋',desc:'东南地区规模宏大的文庙建筑',tech:'宋代文庙·礼制殿堂',category:'祭祀',impactFactor:8,features:{structureType:'木构',roofType:'重檐歇山顶',material:['木','瓦'],constructionTech:['榫卯','斗拱']}},
    {id:371,name:'泉州天后宫',year:1196,dynasty:'南宋',desc:'海上丝绸之路重要民间信仰建筑',tech:'妈祖庙·海洋信仰',category:'祭祀',impactFactor:8,features:{structureType:'木构',roofType:'歇山顶',material:['木','石'],constructionTech:['榫卯','闽南木作']}},
    {id:372,name:'晋江安海龙山寺',year:618,dynasty:'唐',desc:'闽南古寺代表，对台交流渊源深厚',tech:'唐代古寺·闽南风格',category:'寺庙',impactFactor:6,features:{structureType:'木构',roofType:'燕尾脊',material:['木','砖'],constructionTech:['榫卯','闽南装饰']}},
    {id:373,name:'南靖田螺坑土楼群',year:1660,dynasty:'清',desc:'福建土楼群代表，山地聚落空间极具辨识度',tech:'夯土围楼·聚落布局',category:'民居',impactFactor:8,features:{structureType:'土木',roofType:'悬山顶',material:['土','木'],constructionTech:['夯土','围合式布局']}},
    {id:374,name:'永定振成楼',year:1912,dynasty:'民国',desc:'福建土楼经典代表，被誉为土楼王子',tech:'圆楼·内通廊院落',category:'民居',impactFactor:8,features:{structureType:'土木',roofType:'悬山顶',material:['土','木'],constructionTech:['夯土','装配木构']}},
    {id:375,name:'永定承启楼',year:1635,dynasty:'明',desc:'规模最大的圆形土楼之一，聚族而居典范',tech:'大型圆楼·防御聚居',category:'民居',impactFactor:8,features:{structureType:'土木',roofType:'悬山顶',material:['土','木'],constructionTech:['夯土','围楼结构']}},
    {id:376,name:'漳州南山寺',year:859,dynasty:'唐',desc:'闽南重要佛寺，寺院布局完整',tech:'唐代古刹·闽南寺院',category:'寺庙',impactFactor:6,features:{structureType:'木构',roofType:'燕尾脊',material:['木','砖'],constructionTech:['榫卯','闽南木作']}},
    {id:377,name:'莆田湄洲妈祖祖庙',year:987,dynasty:'北宋',desc:'妈祖信仰发祥地，海洋文化核心遗产',tech:'祖庙建筑·海洋信仰',category:'祭祀',impactFactor:9,features:{structureType:'木构',roofType:'歇山顶',material:['木','石','瓦'],constructionTech:['榫卯','闽派装饰']}},
    {id:378,name:'福州华林寺大殿',year:964,dynasty:'五代',desc:'长江以南现存最古老木构建筑之一',tech:'五代木构·单檐殿堂',category:'寺庙',impactFactor:9,features:{structureType:'木构',roofType:'单檐歇山顶',material:['木'],constructionTech:['榫卯','早期斗拱']}},
    {id:379,name:'福州西禅寺大雄宝殿',year:1100,dynasty:'宋',desc:'福州名寺主体建筑，闽都佛教重地',tech:'宋代寺院·大雄宝殿',category:'寺庙',impactFactor:6,features:{structureType:'木构',roofType:'重檐歇山顶',material:['木','瓦'],constructionTech:['榫卯','斗拱']}},
    {id:380,name:'福州乌塔',year:936,dynasty:'五代',desc:'五代石塔，福州双塔之一',tech:'石塔·闽都古塔',category:'塔',impactFactor:6,features:{structureType:'石构',roofType:'攒尖顶',material:['石'],constructionTech:['石构叠涩']}},
    {id:381,name:'福州白塔',year:904,dynasty:'唐',desc:'唐末古塔，福州城市地标之一',tech:'古塔·城市标识',category:'塔',impactFactor:6,features:{structureType:'砖石',roofType:'攒尖顶',material:['砖'],constructionTech:['砖砌']}},
    {id:382,name:'武夷山止止庵',year:1180,dynasty:'南宋',desc:'武夷山道教遗存，山地宫观环境独特',tech:'山地道观·隐逸空间',category:'道观',impactFactor:5,features:{structureType:'木构',roofType:'悬山顶',material:['木','石'],constructionTech:['依山而建','榫卯']}},
    {id:383,name:'陈家祠',year:1894,dynasty:'清',desc:'岭南祠堂建筑巅峰之作，装饰艺术极繁复',tech:'岭南祠堂·三雕两塑',category:'祭祀',impactFactor:9,features:{structureType:'木构',roofType:'硬山顶',material:['木','砖','石'],constructionTech:['木雕','砖雕','灰塑']}},
    {id:384,name:'广州怀圣寺光塔',year:627,dynasty:'唐',desc:'中国最早伊斯兰建筑遗存之一',tech:'伊斯兰塔·海上丝路',category:'塔',impactFactor:8,features:{structureType:'砖石',roofType:'圆顶',material:['砖'],constructionTech:['伊斯兰风格','砖砌']}},
    {id:385,name:'肇庆梅庵',year:996,dynasty:'北宋',desc:'岭南最古老木构建筑之一，禅宗古刹',tech:'北宋木构·岭南古寺',category:'寺庙',impactFactor:8,features:{structureType:'木构',roofType:'歇山顶',material:['木'],constructionTech:['榫卯','斗拱']}},
    {id:386,name:'潮州开元寺天王殿',year:738,dynasty:'唐',desc:'潮州古寺核心建筑，反映潮汕佛寺形制',tech:'唐代古刹·潮汕寺院',category:'寺庙',impactFactor:7,features:{structureType:'木构',roofType:'燕尾脊',material:['木','砖'],constructionTech:['榫卯','潮汕木作']}},
    {id:387,name:'潮州广济门城楼',year:1370,dynasty:'明',desc:'潮州古城标志性城楼，城防与景观兼备',tech:'明代城楼·古城门',category:'城防',impactFactor:7,features:{structureType:'木构',roofType:'歇山顶',material:['木','砖','石'],constructionTech:['城楼结构','砖砌']}},
    {id:388,name:'潮州韩文公祠',year:999,dynasty:'北宋',desc:'纪念韩愈的祠宇，岭东文化地标',tech:'祠庙建筑·山水书院',category:'祭祀',impactFactor:7,features:{structureType:'木构',roofType:'硬山顶',material:['木','砖'],constructionTech:['院落布局','榫卯']}},
    {id:389,name:'佛山祖庙万福台',year:1372,dynasty:'明',desc:'岭南戏台建筑代表，与祖庙古建群相互映衬',tech:'古戏台·岭南庙会',category:'楼阁',impactFactor:7,features:{structureType:'木构',roofType:'歇山顶',material:['木','砖'],constructionTech:['榫卯','戏台结构']}},
    {id:390,name:'南海西樵山宝峰寺',year:1000,dynasty:'宋',desc:'岭南山地佛寺代表，依山布置',tech:'山地寺庙·岭南禅院',category:'寺庙',impactFactor:5,features:{structureType:'木构',roofType:'歇山顶',material:['木','石'],constructionTech:['依山而建','榫卯']}},
    {id:391,name:'德庆学宫大成殿',year:1111,dynasty:'北宋',desc:'岭南现存最完整学宫之一，文庙建筑价值突出',tech:'宋代学宫·礼制殿堂',category:'祭祀',impactFactor:8,features:{structureType:'木构',roofType:'重檐歇山顶',material:['木','瓦'],constructionTech:['榫卯','斗拱']}},
    {id:392,name:'开平自力村碉楼群',year:1921,dynasty:'民国',desc:'侨乡碉楼聚落代表，中西合璧鲜明',tech:'碉楼群·防御聚落',category:'民居',impactFactor:8,features:{structureType:'混合',roofType:'攒尖顶',material:['砖','混凝土','石'],constructionTech:['防御建筑','中西合璧']}},
    {id:393,name:'台山梅家大院',year:1931,dynasty:'民国',desc:'侨乡骑楼式院落空间典型，兼具街市形态',tech:'骑楼院落·侨乡建筑',category:'民居',impactFactor:6,features:{structureType:'砖石',roofType:'平顶',material:['砖','石'],constructionTech:['骑楼','连续拱廊']}},
    {id:394,name:'新会梁启超故居',year:1870,dynasty:'清',desc:'岭南近代名人故居，传统民居与书斋结合',tech:'岭南民居·书香宅院',category:'民居',impactFactor:5,features:{structureType:'木构',roofType:'硬山顶',material:['木','砖'],constructionTech:['院落布局','榫卯']}},
    {id:395,name:'都江堰二王庙',year:494,dynasty:'南北朝',desc:'纪念李冰父子的庙宇，与都江堰水利工程相依',tech:'水利祭祀·川西庙宇',category:'祭祀',impactFactor:8,features:{structureType:'木构',roofType:'歇山顶',material:['木','石'],constructionTech:['依山布局','榫卯']}},
    {id:396,name:'青城山建福宫',year:730,dynasty:'唐',desc:'道教名山宫观，园林化环境突出',tech:'唐代道观·山地宫苑',category:'道观',impactFactor:6,features:{structureType:'木构',roofType:'歇山顶',material:['木','石'],constructionTech:['依山而建','榫卯']}},
    {id:397,name:'成都文殊院天王殿',year:1697,dynasty:'清',desc:'成都保存完好的佛寺建筑群核心之一',tech:'清代寺院·川西木构',category:'寺庙',impactFactor:7,features:{structureType:'木构',roofType:'歇山顶',material:['木','瓦'],constructionTech:['榫卯','斗拱']}},
    {id:398,name:'成都杜甫草堂大廨',year:1500,dynasty:'明',desc:'纪念杜甫的祠园建筑，诗史文化空间典范',tech:'祠园建筑·文人纪念',category:'园林',impactFactor:7,features:{structureType:'木构',roofType:'硬山顶',material:['木','竹','石'],constructionTech:['园林布局','借景']}},
    {id:399,name:'江油云岩寺飞天藏',year:960,dynasty:'北宋',desc:'旋转藏经阁遗存，木作结构独特',tech:'宋代木作·转轮藏',category:'寺庙',impactFactor:7,features:{structureType:'木构',roofType:'攒尖顶',material:['木'],constructionTech:['榫卯','转轮结构']}},


    { id: 400, name: '安岳毗卢洞石刻', year: 907, dynasty: '五代', desc: '川中石刻艺术代表，造像精美', tech: '石窟艺术·密宗题材', category: '石窟', impactFactor: 7, features: { structureType: '石构', roofType: '无', material: ['石'], constructionTech: ['石刻', '摩崖'] } },
    { id: 401, name: '乐山乌尤寺', year: 742, dynasty: '唐', desc: '凌云山寺院群的一部分，与大佛景观相伴', tech: '山地寺庙·江岸格局', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['依山而建', '榫卯'] } },
    { id: 402, name: '峨眉山万年寺无梁砖殿', year: 1600, dynasty: '明', desc: '砖石拱券技术建成的佛殿，结构特殊', tech: '无梁砖殿·拱券结构', category: '寺庙', impactFactor: 8, features: { structureType: '砖石', roofType: '拱顶', material: ['砖'], constructionTech: ['拱券', '无梁结构'] } },
    { id: 403, name: '阆中古城华光楼', year: 1370, dynasty: '明', desc: '阆中古城标志性楼阁，嘉陵江景观节点', tech: '古城楼阁·临江构景', category: '楼阁', impactFactor: 7, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '楼阁结构'] } },
    { id: 404, name: '三苏祠飨殿', year: 1300, dynasty: '元', desc: '纪念苏洵苏轼苏辙的祠园建筑群核心', tech: '祠园建筑·文脉传承', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['院落布局', '榫卯'] } },
    { id: 405, name: '雅安上里韩家大院', year: 1800, dynasty: '清', desc: '川西传统民居，兼有院落与商业空间', tech: '川西民居·木石结合', category: '民居', impactFactor: 5, features: { structureType: '木石', roofType: '悬山顶', material: ['木', '石'], constructionTech: ['穿斗式', '院落布局'] } },
    { id: 406, name: '宜宾真武山古建筑群', year: 1500, dynasty: '明', desc: '川南道教与寺庙建筑群，山地布局明显', tech: '山地古建群·真武信仰', category: '道观', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['依山而建', '榫卯'] } },
    { id: 407, name: '昆明金殿', year: 1602, dynasty: '明', desc: '中国现存最大铜殿，金属构件建筑罕见', tech: '铜殿·金属构造', category: '道观', impactFactor: 8, features: { structureType: '金属', roofType: '歇山顶', material: ['铜'], constructionTech: ['金属铸造', '榫接'] } },
    { id: 408, name: '昆明圆通寺', year: 765, dynasty: '唐', desc: '云南著名古寺，地势下沉式布局独特', tech: '唐代古寺·下沉院落', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['院落布局', '榫卯'] } },
    { id: 409, name: '大理弘圣寺塔', year: 877, dynasty: '南诏', desc: '大理地区著名古塔，南诏佛教建筑代表', tech: '南诏古塔·密檐塔', category: '塔', impactFactor: 7, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['密檐塔', '砖砌'] } },
    { id: 410, name: '巍山文庙大成殿', year: 1410, dynasty: '明', desc: '云南文庙建筑代表，地方礼制建筑保存较好', tech: '明代文庙·边疆礼制', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 411, name: '建水朝阳楼', year: 1389, dynasty: '明', desc: '滇南古城标志性城楼，尺度宏大', tech: '明代城楼·滇南重镇', category: '城防', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['城楼结构', '榫卯'] } },
    { id: 412, name: '建水双龙桥', year: 1795, dynasty: '清', desc: '云南大型多孔石拱桥，桥亭结合鲜明', tech: '多孔石桥·桥亭组合', category: '桥梁', impactFactor: 7, features: { structureType: '砖石', roofType: '亭顶', material: ['石'], constructionTech: ['石拱', '桥亭结合'] } },
    { id: 413, name: '石屏文庙', year: 1285, dynasty: '元', desc: '西南地区保存较完整的文庙建筑群', tech: '元代文庙·礼制建筑', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['院落布局', '榫卯'] } },
    { id: 414, name: '丽江木府议事厅', year: 1600, dynasty: '明', desc: '纳西土司官署建筑群核心空间', tech: '土司官署·纳西木构', category: '宫殿', impactFactor: 7, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '院落布局'] } },
    { id: 415, name: '丽江黑龙潭得月楼', year: 1737, dynasty: '清', desc: '玉龙雪山倒影景观中的楼阁建筑', tech: '园林楼阁·借景雪山', category: '楼阁', impactFactor: 6, features: { structureType: '木构', roofType: '攒尖顶', material: ['木', '石'], constructionTech: ['借景', '榫卯'] } },
    { id: 416, name: '大理喜洲严家大院', year: 1907, dynasty: '清', desc: '白族民居代表，三坊一照壁格局鲜明', tech: '白族民居·三坊一照壁', category: '民居', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖', '石'], constructionTech: ['院落布局', '雕刻'] } },
    { id: 417, name: '腾冲和顺图书馆', year: 1928, dynasty: '民国', desc: '侨乡公共建筑代表，融合传统与近代空间形制', tech: '近代公共建筑·侨乡风格', category: '楼阁', impactFactor: 5, features: { structureType: '砖木', roofType: '歇山顶', material: ['砖', '木'], constructionTech: ['中西合璧'] } },
    { id: 418, name: '歙县许国石坊', year: 1584, dynasty: '明', desc: '明代著名石坊，牌坊建筑杰作', tech: '石坊·坊表制度', category: '祭祀', impactFactor: 7, features: { structureType: '石构', roofType: '牌坊顶', material: ['石'], constructionTech: ['石雕', '牌坊结构'] } },
    { id: 419, name: '歙县棠樾牌坊群', year: 1520, dynasty: '明', desc: '徽州牌坊群代表，集中体现宗法礼制', tech: '牌坊群·宗法礼制', category: '祭祀', impactFactor: 8, features: { structureType: '石构', roofType: '牌坊顶', material: ['石'], constructionTech: ['石雕', '坊表制度'] } },
    { id: 420, name: '黟县西递敬爱堂', year: 1680, dynasty: '清', desc: '徽州宗祠空间代表，木雕艺术突出', tech: '徽派宗祠·木雕', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['徽派木雕', '天井'] } },
    { id: 421, name: '黟县宏村南湖书院', year: 1814, dynasty: '清', desc: '徽派书院建筑，与水系村落空间一体化', tech: '徽派书院·水院结合', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖', '水'], constructionTech: ['天井', '借景'] } },
    { id: 422, name: '绩溪龙川胡氏宗祠', year: 1560, dynasty: '明', desc: '徽州宗祠代表，石雕木雕精美', tech: '宗祠建筑·徽派三雕', category: '祭祀', impactFactor: 8, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '石', '砖'], constructionTech: ['木雕', '砖雕', '石雕'] } },
    { id: 423, name: '休宁齐云山月华街古建筑群', year: 1400, dynasty: '明', desc: '道教名山街巷与宫观并存的山地聚落', tech: '山地道观·街庙结合', category: '道观', impactFactor: 6, features: { structureType: '木构', roofType: '悬山顶', material: ['木', '石'], constructionTech: ['依山而建', '街巷布局'] } },
    { id: 424, name: '寿县孔庙大成殿', year: 1312, dynasty: '元', desc: '安徽重要文庙建筑，保存元代形制特点', tech: '元代文庙·大成殿', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 425, name: '凤阳明中都皇城遗址', year: 1369, dynasty: '明', desc: '明代都城遗址，宫城格局规模宏大', tech: '都城遗址·皇城规划', category: '遗址', impactFactor: 8, features: { structureType: '土木', roofType: '无', material: ['砖', '土', '石'], constructionTech: ['夯土', '城址规划'] } },
    { id: 426, name: '天长护国寺塔', year: 1120, dynasty: '北宋', desc: '皖东古塔代表，砖构塔身保存较好', tech: '北宋砖塔·地方佛塔', category: '塔', impactFactor: 6, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 427, name: '亳州花戏楼', year: 1678, dynasty: '清', desc: '会馆戏楼建筑代表，木雕彩绘绚丽', tech: '戏楼建筑·彩绘木雕', category: '楼阁', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['戏台结构', '木雕彩绘'] } },
    { id: 428, name: '安庆振风塔', year: 1570, dynasty: '明', desc: '长江沿岸地标古塔，七层八角', tech: '明代砖塔·江岸地标', category: '塔', impactFactor: 6, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌', '塔式结构'] } },
    { id: 429, name: '九江浔阳楼', year: 1574, dynasty: '明', desc: '临江楼阁，因文学叙事而闻名', tech: '临江楼阁·江城标识', category: '楼阁', impactFactor: 6, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '楼阁结构'] } },
    { id: 430, name: '南昌佑民寺大雄宝殿', year: 1630, dynasty: '明', desc: '南昌著名佛寺核心建筑', tech: '明代寺院·大雄宝殿', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 431, name: '吉安白鹭洲书院', year: 1241, dynasty: '南宋', desc: '江西书院文化代表，洲岛空间布局独特', tech: '宋代书院·洲岛布局', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖', '水'], constructionTech: ['书院布局', '借景'] } },
    { id: 432, name: '庐山东林寺', year: 386, dynasty: '东晋', desc: '净土宗祖庭，佛教山林寺院代表', tech: '山林寺院·净土祖庭', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['依山而建', '榫卯'] } },
    { id: 433, name: '南丰曾巩读书岩', year: 1050, dynasty: '北宋', desc: '书院与摩崖环境相结合的文化遗存', tech: '书院遗迹·文人空间', category: '遗址', impactFactor: 5, features: { structureType: '石木', roofType: '无', material: ['石', '木'], constructionTech: ['摩崖', '园林布置'] } },
    { id: 434, name: '景德镇浮梁古县衙', year: 1280, dynasty: '元', desc: '保存较完整的古代县衙建筑群', tech: '衙署建筑·行政空间', category: '宫殿', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['衙署布局', '榫卯'] } },
    { id: 435, name: '婺源汪口俞氏宗祠', year: 1736, dynasty: '清', desc: '徽派宗祠在赣东北的代表作品', tech: '宗祠建筑·徽派影响', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['木雕', '天井'] } },
    { id: 436, name: '龙虎山上清宫', year: 1060, dynasty: '北宋', desc: '正一道祖庭建筑群的重要组成', tech: '道教祖庭·宫观体系', category: '道观', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['榫卯', '宫观布局'] } },
    { id: 437, name: '抚州文昌里古建筑群', year: 1500, dynasty: '明', desc: '临川古城传统街巷与民居群代表', tech: '古街区·临川文脉', category: '民居', impactFactor: 5, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['街巷布局', '院落组合'] } },
    { id: 438, name: '武汉古琴台', year: 1473, dynasty: '明', desc: '纪念伯牙子期知音文化的古建园林', tech: '纪念园林·琴台建筑', category: '园林', impactFactor: 6, features: { structureType: '木构', roofType: '卷棚顶', material: ['木', '石', '水'], constructionTech: ['借景', '园林布局'] } },
    { id: 439, name: '武当山太和宫', year: 1416, dynasty: '明', desc: '武当山顶峰道教宫观，皇家敕建', tech: '明代道宫·高山宫殿', category: '道观', impactFactor: 9, features: { structureType: '木构', roofType: '重檐庑殿顶', material: ['木', '石', '铜'], constructionTech: ['依山而建', '榫卯', '皇家营造'] } },
    { id: 440, name: '武当山玉虚宫遗址', year: 1413, dynasty: '明', desc: '武当山山下最大道教宫殿遗址群', tech: '皇家道宫·遗址群', category: '遗址', impactFactor: 8, features: { structureType: '土木', roofType: '无', material: ['砖', '石', '土'], constructionTech: ['宫殿规划', '夯筑'] } },
    { id: 441, name: '襄阳古城昭明台', year: 1258, dynasty: '宋', desc: '襄阳古城高台楼阁，兼具历史纪念与瞭望功能', tech: '城内高台·楼阁纪念', category: '楼阁', impactFactor: 6, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '砖'], constructionTech: ['楼阁结构', '高台建筑'] } },
    { id: 442, name: '荆州玄妙观三清殿', year: 1349, dynasty: '元', desc: '江汉平原道教建筑代表，木构价值突出', tech: '元代道观·三清殿', category: '道观', impactFactor: 8, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 443, name: '洪湖瞿家湾古建筑群', year: 1800, dynasty: '清', desc: '江汉民居与街巷空间保存较好的水乡聚落', tech: '水乡古镇·街巷民居', category: '民居', impactFactor: 5, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['沿街布局', '院落组合'] } },
    { id: 444, name: '黄梅五祖寺大雄宝殿', year: 1100, dynasty: '宋', desc: '禅宗五祖道场核心殿宇', tech: '禅宗祖庭·宋代殿宇', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 445, name: '长沙开福寺', year: 927, dynasty: '五代', desc: '长沙名刹，湖湘佛教建筑代表', tech: '五代古寺·湖湘佛教', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '院落布局'] } },
    { id: 446, name: '岳麓书院讲堂', year: 1167, dynasty: '南宋', desc: '千年学府核心建筑，湖湘文化地标', tech: '书院建筑·讲堂空间', category: '祭祀', impactFactor: 9, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['书院布局', '榫卯'] } },
    { id: 447, name: '衡山南岳大庙正殿', year: 1882, dynasty: '清', desc: '南岳衡山祭祀建筑群核心，礼制规模宏大', tech: '岳庙建筑·礼制中轴', category: '祭祀', impactFactor: 8, features: { structureType: '木构', roofType: '重檐庑殿顶', material: ['木', '砖', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 448, name: '永州柳子庙', year: 1056, dynasty: '北宋', desc: '纪念柳宗元的重要祠庙，文人祠庙代表', tech: '文人祠庙·宋代创建', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['祠堂布局', '榫卯'] } },
    { id: 449, name: '凤凰古城万寿宫', year: 1736, dynasty: '清', desc: '湘西会馆式建筑代表，装饰华丽', tech: '会馆建筑·湘西装饰', category: '宫殿', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖', '石'], constructionTech: ['木雕', '会馆布局'] } },
    { id: 450, name: '芷江天后宫', year: 1767, dynasty: '清', desc: '内河航运背景下形成的妈祖信仰建筑', tech: '妈祖宫庙·航运文化', category: '祭祀', impactFactor: 5, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '会馆式布局'] } },
    { id: 451, name: '洪江古商城窨子屋群', year: 1700, dynasty: '清', desc: '湘西商业建筑与民居结合的传统街区', tech: '窨子屋·商居合一', category: '民居', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['商居合一', '街巷布局'] } },
    { id: 452, name: '郴州苏仙观', year: 1200, dynasty: '宋', desc: '湘南道教建筑遗存，山地景观条件突出', tech: '山地道观·湘南文化', category: '道观', impactFactor: 5, features: { structureType: '木构', roofType: '悬山顶', material: ['木', '石'], constructionTech: ['依山而建', '榫卯'] } },
    { id: 453, name: '张家界普光禅寺', year: 1500, dynasty: '明', desc: '湘西北佛寺代表，山门与殿宇层次明确', tech: '山地寺庙·湘西禅寺', category: '寺庙', impactFactor: 5, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '瓦'], constructionTech: ['依山布局', '榫卯'] } },
    { id: 454, name: '临海江南长城揽胜门', year: 997, dynasty: '北宋', desc: '台州府城城墙核心城门，山海防御体系代表', tech: '城防体系·山地城墙', category: '城防', impactFactor: 7, features: { structureType: '砖石', roofType: '城门楼', material: ['砖', '石', '木'], constructionTech: ['夯土', '包砖', '城门楼'] } },
    { id: 455, name: '宁海前童古镇职思其居', year: 1800, dynasty: '清', desc: '浙东大户民居代表，聚落肌理完整', tech: '浙东民居·宗族聚落', category: '民居', impactFactor: 5, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['宗族聚落', '院落布局'] } },
    { id: 456, name: '兰溪诸葛八卦村大公堂', year: 1700, dynasty: '清', desc: '八卦形聚落中心祠堂建筑，布局独特', tech: '八卦聚落·中心祠堂', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['八卦布局', '祠堂建筑'] } },
    { id: 457, name: '温州江心寺', year: 869, dynasty: '唐', desc: '瓯江江心岛古寺，水域环境鲜明', tech: '江心古寺·水陆景观', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖', '水'], constructionTech: ['榫卯', '园林布局'] } },
    { id: 458, name: '绍兴仓桥直街古建筑群', year: 1600, dynasty: '明', desc: '水乡街巷与民居店铺并存的历史街区', tech: '水乡街区·街宅合一', category: '民居', impactFactor: 5, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖', '水'], constructionTech: ['沿河布局', '街宅结合'] } },
    { id: 459, name: '嘉兴烟雨楼', year: 1518, dynasty: '明', desc: '南湖湖心岛楼阁建筑，江南园林意境突出', tech: '湖心楼阁·借景南湖', category: '楼阁', impactFactor: 6, features: { structureType: '木构', roofType: '卷棚顶', material: ['木', '水', '石'], constructionTech: ['借景', '园林布局'] } },
    { id: 460, name: '常熟方塔园方塔', year: 1148, dynasty: '南宋', desc: '江南古塔与园林结合的代表', tech: '方塔·园林整合', category: '塔', impactFactor: 6, features: { structureType: '砖木', roofType: '攒尖顶', material: ['砖', '木'], constructionTech: ['砖仿木', '塔院布局'] } },
    { id: 461, name: '苏州双塔寺遗址', year: 982, dynasty: '北宋', desc: '双塔与寺院遗址组合，古城格局的重要坐标', tech: '双塔格局·寺院遗址', category: '遗址', impactFactor: 7, features: { structureType: '砖石', roofType: '无', material: ['砖', '石'], constructionTech: ['遗址展示', '塔群布局'] } },
    { id: 462, name: '昆山千灯延福寺塔', year: 1160, dynasty: '南宋', desc: '江南古镇砖塔代表，塔街关系清晰', tech: '南宋砖塔·古镇地标', category: '塔', impactFactor: 5, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 463, name: '扬州文昌阁', year: 1585, dynasty: '明', desc: '扬州城市地标性楼阁，交通节点鲜明', tech: '城市楼阁·交通枢纽', category: '楼阁', impactFactor: 6, features: { structureType: '木构', roofType: '攒尖顶', material: ['木', '砖'], constructionTech: ['楼阁结构', '榫卯'] } },
    { id: 464, name: '镇江金山寺慈寿塔', year: 1068, dynasty: '北宋', desc: '江上寺院古塔，山水佛寺组合典型', tech: '江上古寺·塔院结合', category: '塔', impactFactor: 6, features: { structureType: '砖木', roofType: '攒尖顶', material: ['砖', '木'], constructionTech: ['砖仿木', '山地布局'] } },
    { id: 465, name: '无锡惠山寄畅园知鱼槛', year: 1527, dynasty: '明', desc: '寄畅园景观建筑之一，江南园林空间精巧', tech: '园林亭榭·借景山水', category: '园林', impactFactor: 5, features: { structureType: '木构', roofType: '卷棚顶', material: ['木', '石', '水'], constructionTech: ['借景', '框景'] } },
    { id: 466, name: '南通狼山广教寺', year: 958, dynasty: '五代', desc: '沿江山地寺院，城市景观地标', tech: '山地寺庙·沿江景观', category: '寺庙', impactFactor: 5, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['依山而建', '榫卯'] } },
    { id: 467, name: '北京天宁寺塔', year: 1120, dynasty: '辽', desc: '辽代密檐砖塔，燕京古塔代表', tech: '辽代砖塔·密檐形制', category: '塔', impactFactor: 8, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['密檐塔', '砖砌'] } },
    { id: 468, name: '北京妙应寺白塔', year: 1271, dynasty: '元', desc: '元代覆钵式白塔，北京城重要地标', tech: '覆钵式塔·元代佛塔', category: '塔', impactFactor: 8, features: { structureType: '砖石', roofType: '覆钵顶', material: ['砖', '石'], constructionTech: ['藏式塔', '砖石结构'] } },
    { id: 469, name: '北京智化寺万佛阁', year: 1444, dynasty: '明', desc: '明代寺院木构精品，京音乐文化著名', tech: '明代木构·佛阁建筑', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 470, name: '北京正觉寺五塔', year: 1473, dynasty: '明', desc: '金刚宝座塔代表，北京真觉寺标志', tech: '金刚宝座塔·藏式影响', category: '塔', impactFactor: 7, features: { structureType: '砖石', roofType: '塔式组合', material: ['砖', '石'], constructionTech: ['石雕', '塔式组合'] } },
    { id: 471, name: '北京先农坛太岁殿', year: 1420, dynasty: '明', desc: '皇家祭农建筑群中的重要殿宇', tech: '坛庙建筑·皇家礼制', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['中轴布局', '榫卯'] } },
    { id: 472, name: '天津蓟州白塔', year: 1058, dynasty: '辽', desc: '辽代砖塔，蓟州古城重要标识', tech: '辽代古塔·砖塔遗存', category: '塔', impactFactor: 6, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
    { id: 473, name: '天津广东会馆戏楼', year: 1907, dynasty: '清', desc: '近代会馆戏楼建筑代表，南北风格兼具', tech: '会馆戏楼·近代营造', category: '楼阁', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['戏楼结构', '会馆布局'] } },
    { id: 474, name: '大同九龙壁', year: 1392, dynasty: '明', desc: '现存规模最大的琉璃九龙壁之一', tech: '琉璃影壁·皇家装饰', category: '宫殿', impactFactor: 7, features: { structureType: '砖石', roofType: '无', material: ['琉璃砖', '砖'], constructionTech: ['琉璃烧造', '影壁构筑'] } },
    { id: 475, name: '浑源永安寺传法正宗殿', year: 1318, dynasty: '元', desc: '元代木构与壁画并重的珍贵寺院建筑', tech: '元代木构·壁画遗存', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '壁画'] } },
    { id: 476, name: '朔州应县净土寺藻井', year: 1124, dynasty: '金', desc: '净土寺殿内藻井木作艺术精绝', tech: '金代木作·藻井艺术', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['藻井', '榫卯'] } },
    { id: 477, name: '高平游仙寺', year: 929, dynasty: '五代', desc: '五代寺庙遗存，地方木构价值较高', tech: '五代木构·地方寺院', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '悬山顶', material: ['木'], constructionTech: ['榫卯'] } },
    { id: 478, name: '太谷曹家大院', year: 1700, dynasty: '清', desc: '晋商宅院代表，民居与商业功能结合', tech: '晋商大院·商宅合一', category: '民居', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['院落布局', '砖雕'] } },
    { id: 479, name: '祁县渠家大院', year: 1760, dynasty: '清', desc: '晋商宅院群之一，空间尺度宏大', tech: '晋商宅院·雕刻装饰', category: '民居', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖', '石'], constructionTech: ['院落布局', '木雕'] } },
    { id: 480, name: '临汾东岳庙', year: 1300, dynasty: '元', desc: '地方岳庙建筑遗存，礼制格局清晰', tech: '岳庙建筑·元代遗存', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['院落布局', '榫卯'] } },
    { id: 481, name: '西安兴教寺玄奘塔', year: 669, dynasty: '唐', desc: '玄奘法师安葬塔，唐代佛教遗存重要节点', tech: '唐代砖塔·玄奘纪念', category: '塔', impactFactor: 8, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌', '塔式结构'] } },
    { id: 482, name: '西安卧龙寺', year: 710, dynasty: '唐', desc: '长安古寺之一，佛寺布局延续性强', tech: '唐代古寺·长安佛教', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '院落布局'] } },
    { id: 483, name: '耀州药王山石刻', year: 618, dynasty: '唐', desc: '摩崖造像与碑刻并存的医药文化遗存', tech: '摩崖石刻·医药文化', category: '石窟', impactFactor: 6, features: { structureType: '石构', roofType: '无', material: ['石'], constructionTech: ['石刻', '摩崖'] } },
    { id: 484, name: '韩城城隍庙', year: 1455, dynasty: '明', desc: '韩城古城礼制建筑代表，戏台与庙宇并存', tech: '明代城隍庙·戏台组合', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['戏台结构', '榫卯'] } },
    { id: 485, name: '合阳福山景区古建群', year: 1500, dynasty: '明', desc: '关中地区山地祭祀建筑群，层级丰富', tech: '山地祭祀·古建群', category: '祭祀', impactFactor: 5, features: { structureType: '木构', roofType: '悬山顶', material: ['木', '石'], constructionTech: ['依山而建', '院落组合'] } },
    { id: 486, name: '临潼华清宫遗址', year: 747, dynasty: '唐', desc: '唐代离宫遗址，皇家园林与温泉建筑并重', tech: '皇家离宫·温泉建筑', category: '遗址', impactFactor: 8, features: { structureType: '土木', roofType: '无', material: ['砖', '石', '土'], constructionTech: ['宫苑规划', '遗址展示'] } },
    { id: 487, name: '洛阳丽景门城楼', year: 1217, dynasty: '金', desc: '古城门楼，延续洛阳城市轴线记忆', tech: '城门楼·古都门户', category: '城防', impactFactor: 6, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '砖'], constructionTech: ['城楼结构', '砖砌'] } },
    { id: 488, name: '安阳岳飞庙', year: 1450, dynasty: '明', desc: '纪念岳飞的重要祠庙建筑', tech: '忠烈祠庙·纪念建筑', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['祠堂布局', '榫卯'] } },
    { id: 489, name: '郑州城隍庙', year: 1368, dynasty: '明', desc: '中原城市宗教建筑与商业空间结合的代表', tech: '城隍庙·市井空间', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['院落布局', '榫卯'] } },
    { id: 490, name: '新乡潞王陵神道石刻', year: 1578, dynasty: '明', desc: '明代藩王陵寝石刻遗存，礼制意味浓厚', tech: '王陵石刻·礼制空间', category: '祭祀', impactFactor: 6, features: { structureType: '石构', roofType: '无', material: ['石'], constructionTech: ['石刻', '神道布局'] } },
    { id: 491, name: '曲阜颜庙复圣殿', year: 1442, dynasty: '明', desc: '祭祀颜回的重要殿堂，孔孟文化建筑群组成部分', tech: '儒家祠庙·复圣殿', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 492, name: '济宁太白楼', year: 1388, dynasty: '明', desc: '纪念李白的名楼，运河文化地标', tech: '纪念楼阁·运河地标', category: '楼阁', impactFactor: 6, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '砖'], constructionTech: ['楼阁结构', '榫卯'] } },
    { id: 493, name: '青州真教寺', year: 1292, dynasty: '元', desc: '元代伊斯兰建筑遗存，地方文化交汇代表', tech: '伊斯兰建筑·元代遗存', category: '寺庙', impactFactor: 6, features: { structureType: '砖石', roofType: '穹顶', material: ['砖', '石'], constructionTech: ['拱券', '伊斯兰风格'] } },
    { id: 494, name: '曲阜周公庙元圣殿', year: 1119, dynasty: '北宋', desc: '祭祀周公的古建筑群核心殿宇', tech: '宋代礼制殿宇·周公庙', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
    { id: 495, name: '泰安王母池古建筑群', year: 1545, dynasty: '明', desc: '泰山脚下道教建筑群，山岳祭祀体系的一部分', tech: '山岳道观·泰山信仰', category: '道观', impactFactor: 5, features: { structureType: '木构', roofType: '悬山顶', material: ['木', '石'], constructionTech: ['依山布局', '榫卯'] } },
    { id: 496, name: '福州鼓山涌泉寺大雄宝殿', year: 908, dynasty: '后梁', desc: '闽都名寺核心建筑，山林佛寺空间典型', tech: '山林佛寺·大雄宝殿', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '瓦'], constructionTech: ['依山而建', '榫卯'] } },
    { id: 497, name: '泉州六胜塔', year: 1128, dynasty: '北宋', desc: '海上丝路航标塔代表，临海而立', tech: '航标古塔·海丝遗存', category: '塔', impactFactor: 7, features: { structureType: '石构', roofType: '攒尖顶', material: ['石'], constructionTech: ['石塔', '航标功能'] } },
    { id: 498, name: '南平和平古镇谯楼', year: 1450, dynasty: '明', desc: '闽北古镇公共楼阁建筑，街巷节点鲜明', tech: '古镇谯楼·公共空间', category: '楼阁', impactFactor: 5, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '砖'], constructionTech: ['楼阁结构', '街巷节点'] } },
    { id: 499, name: '漳州东山关帝庙', year: 1387, dynasty: '明', desc: '闽南关帝信仰建筑代表，装饰与礼制并重', tech: '关帝庙·闽南装饰', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '燕尾脊', material: ['木', '砖', '石'], constructionTech: ['榫卯', '闽南木作', '石雕'] } },
  ];

  // 已添加真实古建筑数据：山西50个+陕西50个+江苏50个+浙江50个=200个
  // 当前已汇总真实古建筑数据至500条
  buildings.push(...additionalBuildings, ...extendedBuildings);

  return buildings;
}

const BUILDINGS: Building[] = generateTestBuildings();

// 影响因子到颜色的映射
function getImpactColor(factor: number): string {
  if (factor >= 10) return '#00D9FF';
  if (factor >= 9) return '#4488FF';
  if (factor >= 8) return '#9966FF';
  if (factor >= 7) return '#FF66CC';
  if (factor >= 6) return '#FFCC00';
  if (factor >= 5) return '#FF8833';
  if (factor >= 3) return '#FF4444';
  return '#888888';
}

// 影响因子到节点大小的映射
function getNodeSize(factor: number): number {
  return 0.8 + factor * 0.15;
}

// 生成螺旋星系布局 - 每个半径上的密度均匀，不同半径密度不同
function generateSpiralGalaxyLayout(buildings: Building[]) {
  const nodes: any[] = [];
  const centerX = 0, centerY = 0, centerZ = 0;
  const sortedBuildings = [...buildings].sort((a, b) => b.impactFactor - a.impactFactor);
  const basePositions: Map<number, { x: number; y: number; z: number }> = new Map();

  // 星系参数
  const armCount = 4; // 4条主要旋臂
  const maxRadius = 250; // 最大半径
  const minRadius = 8; // 最小半径
  const armBlurFactor = 0.45; // 旋臂模糊因子，越大越弥散

  // 密度函数：根据半径返回该半径上的星体密度（单位弧长上的星体数）
  // 内圈密度高，外圈密度低
  function getDensityAtRadius(r: number): number {
    // 例如：半径10处密度100，半径100处密度30，半径250处密度10
    return 100 * Math.pow(10 / r, 0.5);
  }

  sortedBuildings.forEach((building, index) => {
    let x, y, z;
    if (index === 0) {
      // 核心星体放在中心
      x = centerX;
      y = centerY;
      z = centerZ;
    } else {
      // 根据影响因子确定大致半径范围
      // 高影响因子建筑更靠近中心
      const impactRatio = (10 - building.impactFactor) / 10; // 0 ~ 0.9
      const targetRadius = minRadius + impactRatio * (maxRadius - minRadius);
      
      // 在该半径附近随机选择，但保持该半径上的密度均匀
      const radiusVariation = 15; // 半径浮动范围
      const radius = Math.max(minRadius, targetRadius + (Math.random() - 0.5) * radiusVariation);
      
      // 获取该半径的密度，决定角度分布
      const density = getDensityAtRadius(radius);
      
      // 确定在哪条旋臂上（主旋臂）
      const armIndex = Math.floor(Math.random() * armCount);
      const armBaseAngle = (armIndex * Math.PI * 2) / armCount;
      
      // 螺旋角度：基础角度 + 随半径增加的螺旋偏移
      const spiralOffset = radius * 0.02; // 每单位半径旋转的角度
      const angleAlongArm = armBaseAngle + spiralOffset;
      
      // 旋臂模糊：星体不完全在主旋臂上，可以在旋臂之间过渡
      // 计算到相邻旋臂的过渡
      const armSeparation = (Math.PI * 2) / armCount; // 两条旋臂之间的角度
      const blurRange = armSeparation * armBlurFactor; // 模糊范围
      
      // 在旋臂附近添加高斯分布的随机偏移
      const angleNoise = (Math.random() - 0.5) * blurRange * 2;
      
      // 25%的星体完全随机分布（弥散星体），不在任何旋臂上
       const isDiffuse = Math.random() < 0.25;
      let finalAngle;
      
      if (isDiffuse) {
        // 弥散星体：完全随机角度
        finalAngle = Math.random() * Math.PI * 2;
      } else {
        // 旋臂星体：在主旋臂附近，但有过渡效果
        finalAngle = angleAlongArm + angleNoise;
      }
      
      // 径向扰动（让星体不完全在精确的圆上）
      const radialNoise = (Math.random() - 0.5) * 12;
      const finalRadius = radius + radialNoise;

      // 计算平面坐标
      x = Math.cos(finalAngle) * finalRadius;
      z = Math.sin(finalAngle) * finalRadius;

      // 高度分布
      const heightScale = 10 + finalRadius * 0.1;
      y = (Math.random() - 0.5) * heightScale;

      // 添加随机扰动
      const jitter = 5;
      x += (Math.random() - 0.5) * jitter;
      z += (Math.random() - 0.5) * jitter;
      y += (Math.random() - 0.5) * jitter * 0.5;
    }
    basePositions.set(building.id, { x, y, z });
  });

  sortedBuildings.forEach((building) => {
    const pos = basePositions.get(building.id)!;
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

  return { nodes, links: [] };
}

// DeepSeek API 调用函数 - 支持多轮对话
async function callDeepSeekAPI(
  buildingName: string, 
  messages: ChatMessage[],
  isFirstQuestion: boolean = false
): Promise<string> {
  const API_KEY = 'sk-5733acc3f3e748efb2e91e4bad881a18';
  const API_URL = 'https://api.deepseek.com/v1/chat/completions';

  const apiMessages = [
    {
      role: 'system',
      content: '你是一位中国古代建筑专家，擅长用生动专业的语言介绍中国传统建筑的历史、文化和技艺。请根据用户的问题提供专业、详细但易懂的回答。'
    }
  ];

  // 添加历史消息
  messages.forEach(msg => {
    apiMessages.push({
      role: msg.role,
      content: msg.content
    });
  });

  // 如果是第一个问题，添加建筑上下文
  if (isFirstQuestion) {
    apiMessages.push({
      role: 'user',
      content: `请详细介绍中国古代建筑"${buildingName}"，包括以下方面：
1. 建筑的历史背景和文化意义
2. 建筑的结构特点和技术亮点
3. 建筑的历史变迁和保护现状
4. 该建筑在中国建筑史上的地位和影响

请以专业、生动、易懂的方式介绍，字数控制在500-800字左右。`
    });
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '暂无AI介绍内容';
  } catch (error) {
    console.error('DeepSeek API调用失败:', error);
    return '抱歉，AI服务暂时不可用，请稍后重试。';
  }
}

function TimelinePageContent() {
  const location = useLocation();
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [showDirectory, setShowDirectory] = useState(false);
  const [directoryFilter, setDirectoryFilter] = useState('全部');
  const fgRef = useRef<any>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const nodeMeshesRef = useRef<Map<number, THREE.Group>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoRotateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [graphViewport, setGraphViewport] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const DISPLAY_BUILDING_COUNT = 500;
  const GRAPH_TOP_OFFSET = 88;
  const DEFAULT_CAMERA_POSITION = { x: 0, y: 20, z: 320 };
  const DEFAULT_CAMERA_TARGET = { x: 0, y: 0, z: 0 };

  const graphData = useMemo(() => generateSpiralGalaxyLayout(BUILDINGS), []);
  const focusBuildingName = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('focus')?.trim() ?? '';
  }, [location.search]);

  // 建筑分类
  const categories = useMemo(() => {
    const cats = [...new Set(BUILDINGS.map(b => b.category))];
    return ['全部', ...cats];
  }, []);

  // 过滤后的建筑列表
  const filteredBuildings = useMemo(() => {
    if (directoryFilter === '全部') return BUILDINGS;
    return BUILDINGS.filter(b => b.category === directoryFilter);
  }, [directoryFilter]);

  // 滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, aiLoading]);

  // 自动旋转功能
  useEffect(() => {
    if (isAutoRotating && fgRef.current) {
      const controls = fgRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5; // 缓慢旋转
      }
    } else if (fgRef.current) {
      const controls = fgRef.current.controls();
      if (controls) {
        controls.autoRotate = false;
      }
    }
  }, [isAutoRotating]);

  useEffect(() => {
    const updateViewport = () => {
      const container = graphContainerRef.current;
      if (!container) {
        return;
      }

      const nextWidth = Math.floor(container.clientWidth);
      const nextHeight = Math.floor(container.clientHeight);

      setGraphViewport((prev) => {
        if (prev.width === nextWidth && prev.height === nextHeight) {
          return prev;
        }
        return { width: nextWidth, height: nextHeight };
      });
    };

    updateViewport();

    const container = graphContainerRef.current;
    if (!container) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      updateViewport();
    });

    resizeObserver.observe(container);
    window.addEventListener('resize', updateViewport);

    const timer = window.setTimeout(updateViewport, 200);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', updateViewport);
      resizeObserver.disconnect();
    };
  }, []);

  // 设置控制器限制并将相机居中对准星团
  useEffect(() => {
    if (!fgRef.current || graphViewport.width <= 0 || graphViewport.height <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (!fgRef.current) {
        return;
      }

      const controls = fgRef.current.controls();
      if (controls) {
        controls.minDistance = 120;
        controls.maxDistance = 500;
        controls.autoRotate = isAutoRotating;
        controls.autoRotateSpeed = 0.5;
        controls.update();
      }

      fgRef.current.cameraPosition(
        DEFAULT_CAMERA_POSITION,
        DEFAULT_CAMERA_TARGET,
        0
      );
    }, 80);

    return () => window.clearTimeout(timer);
  }, [graphViewport, isAutoRotating]);

  // 聚焦到指定节点，效果与直接点击星点一致
  const focusNode = useCallback((node: any) => {
    setSelectedNode(node);
    setShowAIPrompt(true);
    setChatMessages([]);
    setShowAIDialog(false);
    setInputMessage('');
    setIsAutoRotating(false);
    if (fgRef.current && node) {
      fgRef.current.cameraPosition(
        { x: node.x + 40, y: node.y + 40, z: node.z + 40 },
        node,
        1500
      );
    }
  }, []);

  // 节点点击处理
  const handleNodeClick = useCallback((node: any) => {
    focusNode(node);
  }, [focusNode]);

  // 从目录点击定位到节点
  const handleDirectoryClick = useCallback((building: Building) => {
    const node = graphData.nodes.find((n: any) => n.id === building.id);
    if (node) {
      focusNode(node);
    }
  }, [focusNode, graphData]);

  // 从外部模块跳转到星图页时，自动聚焦到对应建筑节点
  useEffect(() => {
    if (!focusBuildingName) {
      return;
    }

    const targetNode = graphData.nodes.find((node: any) => node.name === focusBuildingName);
    if (!targetNode) {
      return;
    }

    const timer = window.setTimeout(() => {
      focusNode(targetNode);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [focusBuildingName, focusNode, graphData]);

  // 处理首次AI提问
  const handleAskAI = async () => {
    if (!selectedNode) return;
    setShowAIPrompt(false);
    setShowAIDialog(true);
    setAiLoading(true);

    const userMessage: ChatMessage = {
      role: 'user',
      content: `请详细介绍一下「${selectedNode.name}」`,
      timestamp: Date.now(),
    };

    setChatMessages([userMessage]);

    const response = await callDeepSeekAPI(selectedNode.name, [userMessage], true);

    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
    };

    setChatMessages(prev => [...prev, aiMessage]);
    setAiLoading(false);
  };

  // 处理追加提问
  const handleFollowUpQuestion = async () => {
    if (!inputMessage.trim() || !selectedNode || aiLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setAiLoading(true);

    const conversationHistory = [...chatMessages, userMessage];
    const response = await callDeepSeekAPI(selectedNode.name, conversationHistory, false);

    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
    };

    setChatMessages(prev => [...prev, aiMessage]);
    setAiLoading(false);
  };

  // 回车发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFollowUpQuestion();
    }
  };

  // 关闭AI对话框
  const closeAIDialog = () => {
    setShowAIDialog(false);
    setChatMessages([]);
    setInputMessage('');
    setShowAIPrompt(true);
  };

  // 点击空白处恢复全局视角并恢复星团旋转
  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
    setShowAIPrompt(false);
    setShowAIDialog(false);
    setChatMessages([]);
    setInputMessage('');
    setIsAutoRotating(true);
    // 相机回到全局俯瞰位置，并保持星团整体下移，避开顶部文字区域
    if (fgRef.current) {
      fgRef.current.cameraPosition(
        DEFAULT_CAMERA_POSITION,
        DEFAULT_CAMERA_TARGET,
        1500
      );
    }
  }, [DEFAULT_CAMERA_POSITION, DEFAULT_CAMERA_TARGET]);

  // 更新所有节点大小
  const updateNodeScales = useCallback(() => {
    if (!fgRef.current) return;
    const camera = fgRef.current.camera();
    if (!camera) return;
    const targetScreenSize = 3;
    const fov = camera.fov * (Math.PI / 180);
    const tanFov = Math.tan(fov / 2);
    const controls = fgRef.current.controls();
    const minDistance = controls?.minDistance || 120;
    const maxDistance = controls?.maxDistance || 500;

    nodeMeshesRef.current.forEach((mesh, nodeId) => {
      const node = graphData.nodes.find((n: any) => n.id === nodeId);
      if (!node) return;
      const nodePosition = new THREE.Vector3(node.x, node.y, node.z);
      let nodeDistance = camera.position.distanceTo(nodePosition);
      nodeDistance = Math.max(minDistance, Math.min(maxDistance, nodeDistance));
      const targetWorldSize = (targetScreenSize * 2 * nodeDistance * tanFov) / window.innerHeight;
      const baseSize = 0.15 + (node.impactFactor / 10) * 0.25;
      const scale = targetWorldSize / baseSize;
      mesh.scale.setScalar(scale);
    });
  }, [graphData]);

  useEffect(() => {
    let animationId: number;
    const animate = () => {
      updateNodeScales();
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [updateNodeScales]);

  const handleNodeHover = useCallback((node: any) => {
    setHoverNode(node);
    document.body.style.cursor = node ? 'pointer' : 'default';
  }, []);

  const createStarMesh = (node: any, targetScale: number = 1) => {
    const group = new THREE.Group();
    const baseSize = (0.15 + (node.impactFactor / 10) * 0.25) * targetScale;
    const hitAreaGeometry = new THREE.SphereGeometry(baseSize * 4.5, 16, 16);
    const hitAreaMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const hitArea = new THREE.Mesh(hitAreaGeometry, hitAreaMaterial);
    group.add(hitArea);
    const coreGeometry = new THREE.SphereGeometry(baseSize * 0.3, 12, 12);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    const glowSizes = [0.8, 1.5, 2.5];
    const glowOpacities = [0.6, 0.3, 0.12];
    for (let i = 0; i < 3; i++) {
      const size = baseSize * glowSizes[i];
      const opacity = glowOpacities[i];
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

  const nodeThreeObject = useCallback((node: any) => {
    const group = createStarMesh(node, 1);
    nodeMeshesRef.current.set(node.id, group);
    return group;
  }, []);

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
      {/* 标题 */}
      <div className="absolute top-4 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <h1 className="text-2xl md:text-3xl font-bold text-center tracking-wider pointer-events-auto"
            style={{ color: '#00D9FF', textShadow: '0 0 20px #00D9FF' }}>
          中国建筑史星图
        </h1>
        <p className="text-center text-gray-400 text-xs mt-1 tracking-widest pointer-events-auto">
          每颗恒星代表一座建筑 · 共{DISPLAY_BUILDING_COUNT}座中国经典古建筑
        </p>
      </div>

      {/* 建筑目录按钮 */}
      <button
        onClick={() => setShowDirectory(!showDirectory)}
        className="absolute top-4 left-4 z-30 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 hover:scale-105"
        style={{
          background: 'rgba(0, 217, 255, 0.15)',
          border: '1px solid rgba(0, 217, 255, 0.4)',
          color: '#00D9FF',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 217, 255, 0.25)';
          e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 217, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 217, 255, 0.15)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        📋 建筑目录
      </button>

      {/* 自动旋转开关 */}
      <button
        onClick={() => setIsAutoRotating(!isAutoRotating)}
        className="absolute top-4 right-4 z-30 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 hover:scale-105"
        style={{
          background: isAutoRotating ? 'rgba(0, 217, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
          border: `1px solid ${isAutoRotating ? 'rgba(0, 217, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
          color: isAutoRotating ? '#00D9FF' : '#888888',
        }}
      >
        {isAutoRotating ? '⏸ 暂停旋转' : '▶ 自动旋转'}
      </button>

      {/* 建筑目录侧边栏 */}
      {showDirectory && (
        <div 
          className="absolute top-16 left-4 z-25 w-72 max-h-[calc(100vh-120px)] bg-black/90 border rounded-lg backdrop-blur-sm overflow-hidden flex flex-col"
          style={{ 
            borderColor: 'rgba(0, 217, 255, 0.3)',
            boxShadow: '0 0 30px rgba(0, 217, 255, 0.15)',
          }}
        >
          {/* 目录标题 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <h3 className="font-bold text-sm" style={{ color: '#00D9FF' }}>
              🏛️ 建筑目录
            </h3>
            <button
              onClick={() => setShowDirectory(false)}
              className="text-gray-500 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>

          {/* 分类筛选 */}
          <div className="px-3 py-2 border-b border-gray-700">
            <select
              value={directoryFilter}
              onChange={(e) => setDirectoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded text-sm bg-gray-800 border border-gray-600 text-white outline-none focus:border-cyan-400"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 建筑列表 */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredBuildings.map((building) => (
              <button
                key={building.id}
                onClick={() => handleDirectoryClick(building)}
                className="w-full text-left px-3 py-2 rounded text-xs transition-all duration-200 hover:bg-white/10 group"
                style={{
                  background: selectedNode?.id === building.id ? 'rgba(0, 217, 255, 0.2)' : 'transparent',
                  borderLeft: `3px solid ${getImpactColor(building.impactFactor)}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-200 group-hover:text-white truncate flex-1">
                    {building.name}
                  </span>
                  <span 
                    className="text-xs ml-2"
                    style={{ color: getImpactColor(building.impactFactor) }}
                  >
                    {building.impactFactor}
                  </span>
                </div>
                <div className="text-gray-500 text-[10px] mt-0.5">
                  {building.dynasty} · {building.category}
                </div>
              </button>
            ))}
          </div>

          {/* 底部统计 */}
          <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
            显示 {filteredBuildings.length} / {BUILDINGS.length} 座建筑
          </div>
        </div>
      )}

      {/* 3D 星图 */}
      <div
        ref={graphContainerRef}
        className="absolute left-0 right-0 bottom-0"
        style={{ top: `${GRAPH_TOP_OFFSET}px` }}
      >
        {graphViewport.width > 0 && graphViewport.height > 0 && (
          <ForceGraph3D
            ref={fgRef}
            width={graphViewport.width}
            height={graphViewport.height}
            graphData={graphData}
            nodeThreeObject={nodeThreeObject}
            linkColor={() => '#444444'}
            linkOpacity={0}
            linkWidth={0}
            backgroundColor="#000000"
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            onBackgroundClick={handleBackgroundClick}
            nodeLabel={(node: any) => `${node.name} (影响因子: ${node.impactFactor})`}
            warmupTicks={0}
            cooldownTicks={0}
            enableNodeDrag={false}
            enableNavigationControls={true}
            controlType="orbit"
            showNavInfo={false}
          />
        )}
      </div>

      {/* 影响因子图例 */}
      <div className="absolute bottom-4 left-4 bg-black/80 border border-gray-700 rounded-lg p-3 backdrop-blur-sm z-10">
        <h3 className="text-xs font-bold mb-2" style={{ color: '#00D9FF' }}>影响因子</h3>
        <div className="space-y-1">
          {impactLegend.map(item => (
            <div key={item.factor} className="flex items-center gap-2 text-[10px]">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: item.color,
                  boxShadow: `0 0 6px ${item.color}`,
                }}
              />
              <span className="text-gray-300">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 选中节点信息面板 */}
      {selectedNode && (
        <div className="absolute top-20 right-4 w-72 bg-black/90 border border-gray-700 rounded-lg p-4 backdrop-blur-sm animate-fade-in z-20">
          <button
            onClick={() => setSelectedNode(null)}
            className="absolute top-2 right-2 text-gray-500 hover:text-white"
          >
            ✕
          </button>

          <div className="mb-3">
            <h2 className="text-lg font-bold" style={{ color: selectedNode.color }}>
              {selectedNode.name}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
              <span>{selectedNode.year > 0 ? `${selectedNode.year}年` : `公元前${Math.abs(selectedNode.year)}年`}</span>
              <span>·</span>
              <span>{selectedNode.dynasty}</span>
              <span>·</span>
              <span style={{ color: selectedNode.color }}>{selectedNode.category}</span>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-500">影响因子</span>
              <span className="text-base font-bold" style={{ color: selectedNode.color }}>
                {selectedNode.impactFactor}/10
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${selectedNode.impactFactor * 10}%`,
                  backgroundColor: selectedNode.color,
                  boxShadow: `0 0 8px ${selectedNode.color}`,
                }}
              />
            </div>
          </div>

          <p className="text-gray-300 text-xs leading-relaxed mb-3">{selectedNode.desc}</p>

          <div className="bg-gray-900/50 px-2 py-1.5 rounded text-[10px] mb-2">
            <span className="text-gray-500">建筑类别：</span>
            <span style={{ color: selectedNode.color }}>{selectedNode.category}</span>
          </div>
          
          <div className="bg-gray-900/50 px-2 py-1.5 rounded text-[10px] mb-3">
            <span className="text-gray-500">核心技术：</span>
            <span style={{ color: selectedNode.color }}>{selectedNode.tech}</span>
          </div>

          {/* AI提问选项 */}
          {showAIPrompt && (
            <div className="border-t border-gray-700 pt-3">
              <p className="text-xs text-gray-400 mb-2">💡 想要深入了解？</p>
              <button
                onClick={handleAskAI}
                className="w-full py-2 px-3 rounded-lg font-medium text-xs transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${selectedNode.color}33, ${selectedNode.color}11)`,
                  border: `1px solid ${selectedNode.color}66`,
                  color: selectedNode.color,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${selectedNode.color}55, ${selectedNode.color}22)`;
                  e.currentTarget.style.boxShadow = `0 0 15px ${selectedNode.color}44`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${selectedNode.color}33, ${selectedNode.color}11)`;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                🤖 向AI提问获取详细介绍
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI对话框 */}
      {showAIDialog && (
        <div 
          className="absolute top-20 left-4 w-[480px] max-w-[calc(100vw-80px)] bg-black/95 border rounded-lg backdrop-blur-sm overflow-hidden flex flex-col z-20"
          style={{ 
            borderColor: selectedNode?.color || '#00D9FF',
            boxShadow: `0 0 30px ${selectedNode?.color || '#00D9FF'}33`,
            maxHeight: 'calc(100vh - 120px)',
          }}
        >
          {/* AI对话框标题栏 */}
          <div 
            className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
            style={{ 
              borderColor: `${selectedNode?.color || '#00D9FF'}33`,
              background: `linear-gradient(135deg, ${selectedNode?.color || '#00D9FF'}22, transparent)` 
            }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: selectedNode?.color || '#00D9FF' }}
              />
              <span className="font-bold text-sm" style={{ color: selectedNode?.color || '#00D9FF' }}>
                🤖 AI建筑导师
              </span>
              <span className="text-xs text-gray-600 ml-2">
                {selectedNode?.name}
              </span>
            </div>
            <button
              onClick={closeAIDialog}
              className="text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* AI对话内容 */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ maxHeight: 'calc(100vh - 280px)', minHeight: '250px' }}
          >
            {chatMessages.length === 0 && !aiLoading && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="text-3xl mb-2">🏛️</div>
                <p className="text-sm">点击"向AI提问"开始了解</p>
              </div>
            )}

            {chatMessages.map((msg, index) => (
              <div key={index} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div 
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-gray-700 text-white' : ''
                  }`}
                  style={msg.role === 'assistant' ? { 
                    backgroundColor: `${selectedNode?.color || '#00D9FF'}33`,
                    color: selectedNode?.color || '#00D9FF'
                  } : {}}
                >
                  {msg.role === 'user' ? '我' : 'AI'}
                </div>
                <div 
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
                  }`}
                  style={msg.role === 'user' ? { 
                    backgroundColor: `${selectedNode?.color || '#00D9FF'}44`,
                    color: '#fff',
                  } : { 
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: '#e5e5e5',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {aiLoading && (
              <div className="flex gap-2">
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                  style={{ 
                    backgroundColor: `${selectedNode?.color || '#00D9FF'}33`,
                    color: selectedNode?.color || '#00D9FF'
                  }}
                >
                  AI
                </div>
                <div 
                  className="px-3 py-2 rounded-xl rounded-tl-sm flex items-center gap-1.5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: selectedNode?.color || '#00D9FF', animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: selectedNode?.color || '#00D9FF', animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: selectedNode?.color || '#00D9FF', animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="border-t p-3 flex-shrink-0" style={{ borderColor: `${selectedNode?.color || '#00D9FF'}22` }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="继续提问..."
                className="flex-1 px-3 py-2 rounded-lg text-xs outline-none bg-white/5 border border-white/10 text-white focus:border-cyan-400"
                disabled={aiLoading}
              />
              <button
                onClick={handleFollowUpQuestion}
                disabled={!inputMessage.trim() || aiLoading}
                className="px-3 py-2 rounded-lg font-medium text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: selectedNode?.color || '#00D9FF', color: '#000' }}
              >
                发送
              </button>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] text-gray-600">按 Enter 发送</span>
              <button
                onClick={() => { setChatMessages([]); setInputMessage(''); }}
                className="text-[10px] text-gray-500 hover:text-gray-300"
              >
                清空对话
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 悬停提示 */}
      {hoverNode && !selectedNode && (
        <div className="absolute bottom-4 right-4 bg-black/80 border border-gray-700 rounded-lg px-3 py-2 backdrop-blur-sm z-10">
          <span className="text-xs" style={{ color: hoverNode.color }}>
            {hoverNode.name} · 影响因子: {hoverNode.impactFactor}
          </span>
        </div>
      )}

      {/* 操作说明 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 border border-gray-700 rounded-lg px-4 py-2 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4 text-[10px] text-gray-400">
          <span>🖱️ 拖拽旋转</span>
          <span>👆 点击节点查看</span>
          <span>📋 目录快速定位</span>
          <span>✨ 共 {DISPLAY_BUILDING_COUNT} 座建筑</span>
        </div>
      </div>
    </div>
  );
}

export default function TimelinePage() {
  return (
    <PageErrorBoundary
      title="建筑演化页面加载异常"
      description="当前建筑史星图页面在运行时发生异常。为了保证项目可继续演示，系统已切换到安全回退界面。您可以刷新重试，或先返回首页继续查看其他模块。"
    >
      <TimelinePageContent />
    </PageErrorBoundary>
  );
}
