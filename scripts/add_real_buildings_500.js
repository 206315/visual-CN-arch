const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/admin/Desktop/visual-CN-arch-main/src/pages/TimelinePage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (content.includes('const extendedBuildings: Building[] = [')) {
  console.log('extendedBuildings already exists, aborting.');
  process.exit(0);
}

const extendedBuildings = [
  { id: 350, name: '登封中岳庙峻极殿', year: 1704, dynasty: '清', desc: '中岳庙核心建筑，五岳庙宇中保存较完整的大殿', tech: '清代祭岳建筑·峻极殿', category: '祭祀', impactFactor: 8, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '砖', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
  { id: 351, name: '登封嵩阳书院', year: 1035, dynasty: '北宋', desc: '中国四大书院之一，理学教育重地', tech: '宋代书院·中轴院落', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['院落布局', '榫卯'] } },
  { id: 352, name: '洛阳关林大殿', year: 1596, dynasty: '明', desc: '祭祀关羽的重要庙宇，古建群规模宏大', tech: '明代关帝庙·轴线布局', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '斗拱'] } },
  { id: 353, name: '开封山陕甘会馆', year: 1765, dynasty: '清', desc: '清代商业会馆建筑精品，木石砖雕精湛', tech: '清代会馆·三雕艺术', category: '宫殿', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖', '石'], constructionTech: ['木雕', '砖雕', '石雕'] } },
  { id: 354, name: '浚县大伾山天宁寺', year: 1500, dynasty: '明', desc: '豫北名寺，依山而建，兼具石刻遗存', tech: '山地寺庙·摩崖结合', category: '寺庙', impactFactor: 6, features: { structureType: '木石', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['依山而建', '榫卯'] } },
  { id: 355, name: '安阳城隍庙', year: 1368, dynasty: '明', desc: '中原地区保存较好的城隍庙古建群', tech: '明代庙宇·地方礼制', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['榫卯', '院落布局'] } },
  { id: 356, name: '济源奉仙观', year: 1119, dynasty: '北宋', desc: '宋代道观遗存，道教建筑布局典型', tech: '宋代道观·宫观格局', category: '道观', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
  { id: 357, name: '淇县朝歌城遗址', year: -1100, dynasty: '商', desc: '殷商都城遗址之一，见证早期都城规划', tech: '商代都城·夯土城址', category: '遗址', impactFactor: 7, features: { structureType: '土木', roofType: '无', material: ['土'], constructionTech: ['夯土'] } },
  { id: 358, name: '南阳武侯祠', year: 1517, dynasty: '明', desc: '纪念诸葛亮的重要祠庙，古柏与建筑并称', tech: '明代祠庙·蜀汉文化', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '祠堂建筑'] } },
  { id: 359, name: '商丘归德府文庙', year: 1487, dynasty: '明', desc: '中原文庙建筑群代表，礼制空间完整', tech: '明代文庙·礼制中轴', category: '祭祀', impactFactor: 6, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['中轴布局', '榫卯'] } },
  { id: 360, name: '正定开元寺钟楼', year: 540, dynasty: '东魏', desc: '正定古城重要楼阁遗存，古塔寺院体系的一部分', tech: '古城钟楼·楼阁遗存', category: '楼阁', impactFactor: 6, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '楼阁结构'] } },
  { id: 361, name: '正定天宁寺凌霄塔', year: 1047, dynasty: '北宋', desc: '北宋砖木塔代表，塔身高耸挺拔', tech: '北宋塔·砖木结合', category: '塔', impactFactor: 8, features: { structureType: '混合', roofType: '攒尖顶', material: ['砖', '木'], constructionTech: ['砖仿木', '塔式结构'] } },
  { id: 362, name: '正定广惠寺华塔', year: 1040, dynasty: '北宋', desc: '中国古塔中造型最华丽者之一', tech: '华塔·繁缛装饰', category: '塔', impactFactor: 8, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖雕', '叠涩'] } },
  { id: 363, name: '定州开元寺塔', year: 1055, dynasty: '北宋', desc: '北宋砖塔，高度居古塔前列', tech: '北宋砖塔·高塔工程', category: '塔', impactFactor: 8, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌', '高层塔身'] } },
  { id: 364, name: '赵县柏林禅寺', year: 805, dynasty: '唐', desc: '禅宗名寺，寺院文化底蕴深厚', tech: '唐代古刹·禅宗道场', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '院落布局'] } },
  { id: 365, name: '邯郸学步桥', year: 1587, dynasty: '明', desc: '古城桥梁遗存，承载地方历史记忆', tech: '明代石桥·古城水系', category: '桥梁', impactFactor: 5, features: { structureType: '砖石', roofType: '无', material: ['石'], constructionTech: ['石拱'] } },
  { id: 366, name: '涉县娲皇宫', year: 550, dynasty: '北齐', desc: '北方祭祀女娲的重要宫观建筑群', tech: '悬山宫观·摩崖石刻', category: '祭祀', impactFactor: 8, features: { structureType: '木石', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['依山而建', '摩崖'] } },
  { id: 367, name: '承德普宁寺大乘之阁', year: 1755, dynasty: '清', desc: '外八庙代表建筑，汉藏合璧风格突出', tech: '清代寺庙·汉藏融合', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '重檐攒尖顶', material: ['木', '瓦'], constructionTech: ['榫卯', '多民族风格融合'] } },
  { id: 368, name: '承德普陀宗乘之庙', year: 1767, dynasty: '清', desc: '仿布达拉宫形制的大型皇家寺庙', tech: '皇家寺庙·藏式宫堡', category: '寺庙', impactFactor: 9, features: { structureType: '混合', roofType: '平顶', material: ['石', '木', '砖'], constructionTech: ['夯筑', '汉藏合璧'] } },
  { id: 369, name: '保定古莲花池', year: 790, dynasty: '唐', desc: '古代园林与书院文化合一的名胜空间', tech: '园林书院·北方名园', category: '园林', impactFactor: 6, features: { structureType: '木构', roofType: '卷棚顶', material: ['木', '水', '石'], constructionTech: ['借景', '园林布局'] } },
  { id: 370, name: '泉州府文庙大成殿', year: 1131, dynasty: '南宋', desc: '东南地区规模宏大的文庙建筑', tech: '宋代文庙·礼制殿堂', category: '祭祀', impactFactor: 8, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
  { id: 371, name: '泉州天后宫', year: 1196, dynasty: '南宋', desc: '海上丝绸之路重要民间信仰建筑', tech: '妈祖庙·海洋信仰', category: '祭祀', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['榫卯', '闽南木作'] } },
  { id: 372, name: '晋江安海龙山寺', year: 618, dynasty: '唐', desc: '闽南古寺代表，对台交流渊源深厚', tech: '唐代古寺·闽南风格', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '燕尾脊', material: ['木', '砖'], constructionTech: ['榫卯', '闽南装饰'] } },
  { id: 373, name: '南靖田螺坑土楼群', year: 1660, dynasty: '清', desc: '福建土楼群代表，山地聚落空间极具辨识度', tech: '夯土围楼·聚落布局', category: '民居', impactFactor: 8, features: { structureType: '土木', roofType: '悬山顶', material: ['土', '木'], constructionTech: ['夯土', '围合式布局'] } },
  { id: 374, name: '永定振成楼', year: 1912, dynasty: '民国', desc: '福建土楼经典代表，被誉为土楼王子', tech: '圆楼·内通廊院落', category: '民居', impactFactor: 8, features: { structureType: '土木', roofType: '悬山顶', material: ['土', '木'], constructionTech: ['夯土', '装配木构'] } },
  { id: 375, name: '永定承启楼', year: 1635, dynasty: '明', desc: '规模最大的圆形土楼之一，聚族而居典范', tech: '大型圆楼·防御聚居', category: '民居', impactFactor: 8, features: { structureType: '土木', roofType: '悬山顶', material: ['土', '木'], constructionTech: ['夯土', '围楼结构'] } },
  { id: 376, name: '漳州南山寺', year: 859, dynasty: '唐', desc: '闽南重要佛寺，寺院布局完整', tech: '唐代古刹·闽南寺院', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '燕尾脊', material: ['木', '砖'], constructionTech: ['榫卯', '闽南木作'] } },
  { id: 377, name: '莆田湄洲妈祖祖庙', year: 987, dynasty: '北宋', desc: '妈祖信仰发祥地，海洋文化核心遗产', tech: '祖庙建筑·海洋信仰', category: '祭祀', impactFactor: 9, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石', '瓦'], constructionTech: ['榫卯', '闽派装饰'] } },
  { id: 378, name: '福州华林寺大殿', year: 964, dynasty: '五代', desc: '长江以南现存最古老木构建筑之一', tech: '五代木构·单檐殿堂', category: '寺庙', impactFactor: 9, features: { structureType: '木构', roofType: '单檐歇山顶', material: ['木'], constructionTech: ['榫卯', '早期斗拱'] } },
  { id: 379, name: '福州西禅寺大雄宝殿', year: 1100, dynasty: '宋', desc: '福州名寺主体建筑，闽都佛教重地', tech: '宋代寺院·大雄宝殿', category: '寺庙', impactFactor: 6, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
  { id: 380, name: '福州乌塔', year: 936, dynasty: '五代', desc: '五代石塔，福州双塔之一', tech: '石塔·闽都古塔', category: '塔', impactFactor: 6, features: { structureType: '石构', roofType: '攒尖顶', material: ['石'], constructionTech: ['石构叠涩'] } },
  { id: 381, name: '福州白塔', year: 904, dynasty: '唐', desc: '唐末古塔，福州城市地标之一', tech: '古塔·城市标识', category: '塔', impactFactor: 6, features: { structureType: '砖石', roofType: '攒尖顶', material: ['砖'], constructionTech: ['砖砌'] } },
  { id: 382, name: '武夷山止止庵', year: 1180, dynasty: '南宋', desc: '武夷山道教遗存，山地宫观环境独特', tech: '山地道观·隐逸空间', category: '道观', impactFactor: 5, features: { structureType: '木构', roofType: '悬山顶', material: ['木', '石'], constructionTech: ['依山而建', '榫卯'] } },
  { id: 383, name: '陈家祠', year: 1894, dynasty: '清', desc: '岭南祠堂建筑巅峰之作，装饰艺术极繁复', tech: '岭南祠堂·三雕两塑', category: '祭祀', impactFactor: 9, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖', '石'], constructionTech: ['木雕', '砖雕', '灰塑'] } },
  { id: 384, name: '广州怀圣寺光塔', year: 627, dynasty: '唐', desc: '中国最早伊斯兰建筑遗存之一', tech: '伊斯兰塔·海上丝路', category: '塔', impactFactor: 8, features: { structureType: '砖石', roofType: '圆顶', material: ['砖'], constructionTech: ['伊斯兰风格', '砖砌'] } },
  { id: 385, name: '肇庆梅庵', year: 996, dynasty: '北宋', desc: '岭南最古老木构建筑之一，禅宗古刹', tech: '北宋木构·岭南古寺', category: '寺庙', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木'], constructionTech: ['榫卯', '斗拱'] } },
  { id: 386, name: '潮州开元寺天王殿', year: 738, dynasty: '唐', desc: '潮州古寺核心建筑，反映潮汕佛寺形制', tech: '唐代古刹·潮汕寺院', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '燕尾脊', material: ['木', '砖'], constructionTech: ['榫卯', '潮汕木作'] } },
  { id: 387, name: '潮州广济门城楼', year: 1370, dynasty: '明', desc: '潮州古城标志性城楼，城防与景观兼备', tech: '明代城楼·古城门', category: '城防', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖', '石'], constructionTech: ['城楼结构', '砖砌'] } },
  { id: 388, name: '潮州韩文公祠', year: 999, dynasty: '北宋', desc: '纪念韩愈的祠宇，岭东文化地标', tech: '祠庙建筑·山水书院', category: '祭祀', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['院落布局', '榫卯'] } },
  { id: 389, name: '佛山祖庙万福台', year: 1372, dynasty: '明', desc: '岭南戏台建筑代表，与祖庙古建群相互映衬', tech: '古戏台·岭南庙会', category: '楼阁', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '砖'], constructionTech: ['榫卯', '戏台结构'] } },
  { id: 390, name: '南海西樵山宝峰寺', year: 1000, dynasty: '宋', desc: '岭南山地佛寺代表，依山布置', tech: '山地寺庙·岭南禅院', category: '寺庙', impactFactor: 5, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['依山而建', '榫卯'] } },
  { id: 391, name: '德庆学宫大成殿', year: 1111, dynasty: '北宋', desc: '岭南现存最完整学宫之一，文庙建筑价值突出', tech: '宋代学宫·礼制殿堂', category: '祭祀', impactFactor: 8, features: { structureType: '木构', roofType: '重檐歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
  { id: 392, name: '开平自力村碉楼群', year: 1921, dynasty: '民国', desc: '侨乡碉楼聚落代表，中西合璧鲜明', tech: '碉楼群·防御聚落', category: '民居', impactFactor: 8, features: { structureType: '混合', roofType: '攒尖顶', material: ['砖', '混凝土', '石'], constructionTech: ['防御建筑', '中西合璧'] } },
  { id: 393, name: '台山梅家大院', year: 1931, dynasty: '民国', desc: '侨乡骑楼式院落空间典型，兼具街市形态', tech: '骑楼院落·侨乡建筑', category: '民居', impactFactor: 6, features: { structureType: '砖石', roofType: '平顶', material: ['砖', '石'], constructionTech: ['骑楼', '连续拱廊'] } },
  { id: 394, name: '新会梁启超故居', year: 1870, dynasty: '清', desc: '岭南近代名人故居，传统民居与书斋结合', tech: '岭南民居·书香宅院', category: '民居', impactFactor: 5, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '砖'], constructionTech: ['院落布局', '榫卯'] } },
  { id: 395, name: '都江堰二王庙', year: 494, dynasty: '南北朝', desc: '纪念李冰父子的庙宇，与都江堰水利工程相依', tech: '水利祭祀·川西庙宇', category: '祭祀', impactFactor: 8, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['依山布局', '榫卯'] } },
  { id: 396, name: '青城山建福宫', year: 730, dynasty: '唐', desc: '道教名山宫观，园林化环境突出', tech: '唐代道观·山地宫苑', category: '道观', impactFactor: 6, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '石'], constructionTech: ['依山而建', '榫卯'] } },
  { id: 397, name: '成都文殊院天王殿', year: 1697, dynasty: '清', desc: '成都保存完好的佛寺建筑群核心之一', tech: '清代寺院·川西木构', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '歇山顶', material: ['木', '瓦'], constructionTech: ['榫卯', '斗拱'] } },
  { id: 398, name: '成都杜甫草堂大廨', year: 1500, dynasty: '明', desc: '纪念杜甫的祠园建筑，诗史文化空间典范', tech: '祠园建筑·文人纪念', category: '园林', impactFactor: 7, features: { structureType: '木构', roofType: '硬山顶', material: ['木', '竹', '石'], constructionTech: ['园林布局', '借景'] } },
  { id: 399, name: '江油云岩寺飞天藏', year: 960, dynasty: '北宋', desc: '旋转藏经阁遗存，木作结构独特', tech: '宋代木作·转轮藏', category: '寺庙', impactFactor: 7, features: { structureType: '木构', roofType: '攒尖顶', material: ['木'], constructionTech: ['榫卯', '转轮结构'] } }
];

const block = `\n  const extendedBuildings: Building[] = [\n${extendedBuildings.map((item) => `    ${JSON.stringify(item).replace(/"([^"]+)":/g, '$1:').replace(/"/g, '\'')},`).join('\n')}\n  ];\n`;

const needle = `  ];\n\n  // 已添加真实古建筑数据：山西50个+陕西50个+江苏50个+浙江50个=200个`;
if (!content.includes(needle)) {
  throw new Error('Needle not found in TimelinePage.tsx');
}

content = content.replace(needle, `  ];${block}\n  // 已添加真实古建筑数据：山西50个+陕西50个+江苏50个+浙江50个=200个`);
content = content.replace('  buildings.push(...additionalBuildings);', '  buildings.push(...additionalBuildings, ...extendedBuildings);');
content = content.replace('  // 总计250个真实古建筑数据', '  // 当前已汇总真实古建筑数据至500条');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Inserted extendedBuildings 350-399 successfully.');
