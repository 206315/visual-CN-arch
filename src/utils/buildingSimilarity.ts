export interface SimilarityTechFeatures {
  structureType: string;
  dougongType?: string;
  roofType?: string;
  material: string[];
  constructionTech: string[];
}

export interface SimilarityBuilding {
  id: number;
  name: string;
  year: number;
  dynasty: string;
  desc: string;
  tech: string;
  category: string;
  impactFactor: number;
  features: SimilarityTechFeatures;
}

export interface BuildingSimilarityResult {
  building: SimilarityBuilding;
  score: number;
  reasons: string[];
}

function getSetOverlapScore(base: string[], target: string[]) {
  if (base.length === 0 || target.length === 0) {
    return 0;
  }

  const baseSet = new Set(base);
  const targetSet = new Set(target);
  let intersection = 0;

  baseSet.forEach((item) => {
    if (targetSet.has(item)) {
      intersection += 1;
    }
  });

  const union = new Set([...baseSet, ...targetSet]).size;
  return union === 0 ? 0 : intersection / union;
}

function getDynastyDistanceScore(baseYear: number, targetYear: number) {
  const distance = Math.abs(baseYear - targetYear);
  if (distance <= 80) {
    return 1;
  }
  if (distance <= 200) {
    return 0.75;
  }
  if (distance <= 400) {
    return 0.45;
  }
  if (distance <= 800) {
    return 0.2;
  }
  return 0;
}

export function getSimilarBuildings(baseBuilding: SimilarityBuilding, buildings: SimilarityBuilding[], limit = 3) {
  const results = buildings
    .filter((building) => building.id !== baseBuilding.id)
    .map((building) => {
      let score = 0;
      const reasons: string[] = [];

      if (building.category === baseBuilding.category) {
        score += 30;
        reasons.push(`同属${baseBuilding.category}类建筑`);
      }

      if (building.features.structureType === baseBuilding.features.structureType) {
        score += 16;
        reasons.push(`结构类型同为${baseBuilding.features.structureType}`);
      }

      if (building.features.roofType && baseBuilding.features.roofType && building.features.roofType === baseBuilding.features.roofType) {
        score += 16;
        reasons.push(`屋顶形制同为${baseBuilding.features.roofType}`);
      }

      if (building.dynasty === baseBuilding.dynasty) {
        score += 12;
        reasons.push(`同处${baseBuilding.dynasty}`);
      } else {
        const dynastyScore = getDynastyDistanceScore(baseBuilding.year, building.year) * 12;
        score += dynastyScore;
        if (dynastyScore >= 7) {
          reasons.push('时代接近');
        }
      }

      const materialScore = getSetOverlapScore(baseBuilding.features.material, building.features.material) * 12;
      score += materialScore;
      if (materialScore >= 4) {
        reasons.push('材料体系相近');
      }

      const constructionScore = getSetOverlapScore(baseBuilding.features.constructionTech, building.features.constructionTech) * 12;
      score += constructionScore;
      if (constructionScore >= 4) {
        reasons.push('营造技术相近');
      }

      const impactGap = Math.abs(baseBuilding.impactFactor - building.impactFactor);
      const impactScore = Math.max(0, 8 - impactGap * 1.6);
      score += impactScore;
      if (impactScore >= 5) {
        reasons.push('历史影响力接近');
      }

      if (baseBuilding.features.dougongType && building.features.dougongType && baseBuilding.features.dougongType === building.features.dougongType) {
        score += 6;
        reasons.push(`斗拱特征同为${baseBuilding.features.dougongType}`);
      }

      return {
        building,
        score: Number(score.toFixed(1)),
        reasons: reasons.slice(0, 3),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return results;
}
