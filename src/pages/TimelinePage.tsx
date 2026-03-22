import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

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

// 生成100个真实中国古建筑数据
function generateTestBuildings(): Building[] {
  const buildings: Building[] = [
    // 一、宫殿与皇家建筑（10个）
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

    // 二、寺庙与道观（20个）
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

    // 三、园林建筑（15个）
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

    // 四、楼阁与亭台（15个）
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

    // 五、塔窟与石窟（10个）
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

    // 六、桥梁与水利（10个）
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

    // 七、民居与村落建筑（10个）
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

    // 八、其他经典建筑（10个）
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
  ];

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

// 生成螺旋星系布局
function generateSpiralGalaxyLayout(buildings: Building[]) {
  const nodes: any[] = [];
  const centerX = 0, centerY = 0, centerZ = 0;
  const sortedBuildings = [...buildings].sort((a, b) => b.impactFactor - a.impactFactor);
  const basePositions: Map<number, { x: number; y: number; z: number }> = new Map();

  sortedBuildings.forEach((building, index) => {
    let x, y, z;
    if (index === 0) {
      x = centerX;
      y = centerY;
      z = centerZ;
    } else {
      const impactRatio = (10 - building.impactFactor) / 10;
      const maxDistance = 140;
      const minDistance = 8;
      const distanceFromCenter = minDistance + impactRatio * (maxDistance - minDistance);
      const armCount = 3;
      const armIndex = building.id % armCount;
      const angleOffset = (armIndex * Math.PI * 2) / armCount;
      const spiralAngle = distanceFromCenter * 0.15 + angleOffset + (index * 0.1);
      x = Math.cos(spiralAngle) * distanceFromCenter;
      z = Math.sin(spiralAngle) * distanceFromCenter;
      const heightSpread = distanceFromCenter * 0.6;
      y = (Math.random() - 0.5) * heightSpread;
      const jitter = distanceFromCenter * 0.05;
      x += (Math.random() - 0.5) * jitter;
      z += (Math.random() - 0.5) * jitter;
      y += (Math.random() - 0.5) * jitter * 2;
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

export default function TimelinePage() {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const fgRef = useRef<any>(null);
  const nodeMeshesRef = useRef<Map<number, THREE.Group>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const graphData = useMemo(() => generateSpiralGalaxyLayout(BUILDINGS), []);

  // 滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, aiLoading]);

  // 设置控制器限制
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fgRef.current) {
        const controls = fgRef.current.controls();
        if (controls) {
          controls.minDistance = 120;
          controls.maxDistance = 800;
          controls.update();
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // 节点点击处理
  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    setShowAIPrompt(true);
    setChatMessages([]);
    setShowAIDialog(false);
    setInputMessage('');
    if (fgRef.current && node) {
      fgRef.current.cameraPosition(
        { x: node.x + 40, y: node.y + 40, z: node.z + 40 },
        node,
        2000
      );
    }
  }, []);

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

    // 构建完整对话历史
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
    const maxDistance = controls?.maxDistance || 800;

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
      <div className="absolute top-16 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <h1 className="text-3xl md:text-4xl font-bold text-center tracking-wider pointer-events-auto"
            style={{ color: '#00D9FF', textShadow: '0 0 20px #00D9FF' }}>
          中国建筑史星图
        </h1>
        <p className="text-center text-gray-400 text-sm mt-2 tracking-widest pointer-events-auto">
          每颗恒星代表一座建筑 · 颜色表示历史影响因子 · 共100座中国经典古建筑
        </p>
      </div>

      {/* 3D 星图 */}
      <div className="w-full h-full">
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          nodeThreeObject={nodeThreeObject}
          linkColor={() => '#444444'}
          linkOpacity={0}
          linkWidth={0}
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

      {/* 影响因子图例 */}
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

      {/* 选中节点信息面板 */}
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

          <div className="bg-gray-900/50 px-3 py-2 rounded text-xs mb-2">
            <span className="text-gray-500">建筑类别：</span>
            <span style={{ color: selectedNode.color }}>{selectedNode.category}</span>
          </div>
          
          <div className="bg-gray-900/50 px-3 py-2 rounded text-xs mb-4">
            <span className="text-gray-500">核心技术：</span>
            <span style={{ color: selectedNode.color }}>{selectedNode.tech}</span>
          </div>

          {/* AI提问选项 */}
          {showAIPrompt && (
            <div className="border-t border-gray-700 pt-4">
              <p className="text-sm text-gray-400 mb-3">💡 想要深入了解这座建筑？</p>
              <button
                onClick={handleAskAI}
                className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${selectedNode.color}33, ${selectedNode.color}11)`,
                  border: `1px solid ${selectedNode.color}66`,
                  color: selectedNode.color,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${selectedNode.color}55, ${selectedNode.color}22)`;
                  e.currentTarget.style.boxShadow = `0 0 20px ${selectedNode.color}44`;
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

      {/* AI对话框 - 支持多轮对话 */}
      {showAIDialog && (
        <div 
          className="absolute top-28 left-6 w-[550px] max-w-[calc(100vw-100px)] bg-black/95 border rounded-lg backdrop-blur-sm overflow-hidden flex flex-col"
          style={{ 
            borderColor: selectedNode?.color || '#00D9FF',
            boxShadow: `0 0 30px ${selectedNode?.color || '#00D9FF'}33, 0 0 60px ${selectedNode?.color || '#00D9FF'}11`,
            maxHeight: 'calc(100vh - 150px)',
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
              <span className="font-bold" style={{ color: selectedNode?.color || '#00D9FF' }}>
                🤖 AI建筑导师
              </span>
              <span className="text-xs text-gray-500">· DeepSeek</span>
              <span className="text-xs text-gray-600 ml-2">
                正在讨论：{selectedNode?.name}
              </span>
            </div>
            <button
              onClick={closeAIDialog}
              className="text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* AI对话内容 - 可滚动区域 */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ maxHeight: 'calc(100vh - 280px)', minHeight: '300px' }}
          >
            {/* 欢迎提示 */}
            {chatMessages.length === 0 && !aiLoading && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="text-4xl mb-3">🏛️</div>
                <p className="text-sm">点击"向AI提问"开始了解这座建筑</p>
              </div>
            )}

            {/* 对话消息列表 */}
            {chatMessages.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* 头像 */}
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                    msg.role === 'user' 
                      ? 'bg-gray-700 text-white' 
                      : ''
                  }`}
                  style={msg.role === 'assistant' ? { 
                    backgroundColor: `${selectedNode?.color || '#00D9FF'}33`,
                    color: selectedNode?.color || '#00D9FF'
                  } : {}}
                >
                  {msg.role === 'user' ? '我' : 'AI'}
                </div>
                
                {/* 消息内容 */}
                <div 
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'rounded-tr-sm' 
                      : 'rounded-tl-sm'
                  }`}
                  style={msg.role === 'user' 
                    ? { 
                        backgroundColor: `${selectedNode?.color || '#00D9FF'}44`,
                        color: '#fff',
                      }
                    : { 
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: '#e5e5e5',
                      }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* 加载动画 */}
            {aiLoading && (
              <div className="flex gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                  style={{ 
                    backgroundColor: `${selectedNode?.color || '#00D9FF'}33`,
                    color: selectedNode?.color || '#00D9FF'
                  }}
                >
                  AI
                </div>
                <div 
                  className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                >
                  <div 
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: selectedNode?.color || '#00D9FF', animationDelay: '0ms' }}
                  />
                  <div 
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: selectedNode?.color || '#00D9FF', animationDelay: '150ms' }}
                  />
                  <div 
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: selectedNode?.color || '#00D9FF', animationDelay: '300ms' }}
                  />
                </div>
              </div>
            )}

            {/* 滚动锚点 */}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div 
            className="border-t p-4 flex-shrink-0"
            style={{ 
              borderColor: `${selectedNode?.color || '#00D9FF'}22`,
              background: 'rgba(0,0,0,0.8)' 
            }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="继续提问..."
                className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: `1px solid ${inputMessage.trim() ? (selectedNode?.color || '#00D9FF') + '66' : 'rgba(255,255,255,0.1)'}`,
                  color: '#fff',
                }}
                disabled={aiLoading}
              />
              <button
                onClick={handleFollowUpQuestion}
                disabled={!inputMessage.trim() || aiLoading}
                className="px-4 py-2.5 rounded-lg font-medium transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: selectedNode?.color || '#00D9FF',
                  color: '#000',
                }}
                onMouseEnter={(e) => {
                  if (inputMessage.trim() && !aiLoading) {
                    e.currentTarget.style.boxShadow = `0 0 20px ${selectedNode?.color || '#00D9FF'}66`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-600">
                按 Enter 发送，Shift + Enter 换行
              </span>
              <button
                onClick={() => {
                  setChatMessages([]);
                  setInputMessage('');
                }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                清空对话
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 悬停提示 */}
      {hoverNode && !selectedNode && (
        <div className="absolute bottom-16 right-6 bg-black/80 border border-gray-700 rounded-lg px-4 py-2 backdrop-blur-sm">
          <span className="text-sm" style={{ color: hoverNode.color }}>
            {hoverNode.name} · 影响因子: {hoverNode.impactFactor}
          </span>
        </div>
      )}

      {/* 操作说明 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 border border-gray-700 rounded-lg px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-6 text-xs text-gray-400">
          <span>🖱️ 左键拖拽旋转</span>
          <span>🖱️ 滚轮缩放</span>
          <span>👆 点击节点查看详情</span>
          <span>✨ 共 100 座中国经典古建筑</span>
        </div>
      </div>
    </div>
  );
}
