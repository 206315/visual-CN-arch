/**
 * 斗拱动画工具类
 * 基于 threejs-3dmodel-edit 项目的核心功能改造
 * 提供模型拆解、旋转、位置调整等动画效果
 */

import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

export interface AnimationConfig {
  duration?: number;
  easing?: typeof TWEEN.Easing.Quadratic.InOut;
}

export class DougongAnimationController {
  private tweenGroup: typeof TWEEN;
  
  constructor() {
    this.tweenGroup = TWEEN;
  }

  /**
   * 模型爆炸拆解动画
   * @param parts - 构件组数组
   * @param explodeDistance - 拆解距离
   * @param config - 动画配置
   */
  explodeModel(
    parts: THREE.Group[],
    explodeDistance: number = 2,
    config: AnimationConfig = {}
  ): void {
    const { duration = 800, easing = TWEEN.Easing.Quadratic.InOut } = config;
    
    parts.forEach((part, index) => {
      if (!part.userData.originalPosition) {
        part.userData.originalPosition = part.position.clone();
      }

      const layer = part.userData.layer || 0;
      const offset = layer * explodeDistance * 0.5;
      
      // 垂直方向拆解
      const targetY = part.userData.originalPosition.y + offset;
      
      new TWEEN.Tween(part.position)
        .to({ y: targetY }, duration)
        .easing(easing)
        .start();
    });
  }

  /**
   * 模型组装复原动画
   * @param parts - 构件组数组
   * @param config - 动画配置
   */
  assembleModel(
    parts: THREE.Group[],
    config: AnimationConfig = {}
  ): void {
    const { duration = 800, easing = TWEEN.Easing.Quadratic.InOut } = config;
    
    parts.forEach((part) => {
      if (part.userData.originalPosition) {
        new TWEEN.Tween(part.position)
          .to({
            x: part.userData.originalPosition.x,
            y: part.userData.originalPosition.y,
            z: part.userData.originalPosition.z,
          }, duration)
          .easing(easing)
          .start();
      }
    });
  }

  /**
   * 圆形爆炸拆解（环形分布）
   * @param parts - 构件组数组
   * @param radius - 拆解半径
   * @param config - 动画配置
   */
  explodeCircular(
    parts: THREE.Group[],
    radius: number = 3,
    config: AnimationConfig = {}
  ): void {
    const { duration = 1000, easing = TWEEN.Easing.Quadratic.InOut } = config;
    const angleStep = (2 * Math.PI) / parts.length;
    
    parts.forEach((part, index) => {
      if (!part.userData.originalPosition) {
        part.userData.originalPosition = part.position.clone();
      }

      const angle = index * angleStep;
      const targetX = part.userData.originalPosition.x + radius * Math.cos(angle);
      const targetZ = part.userData.originalPosition.z + radius * Math.sin(angle);
      const targetY = part.userData.originalPosition.y + (part.userData.layer || 0) * 0.3;
      
      new TWEEN.Tween(part.position)
        .to({ x: targetX, y: targetY, z: targetZ }, duration)
        .easing(easing)
        .start();
    });
  }

  /**
   * 旋转动画
   * @param object - 要旋转的对象
   * @param axis - 旋转轴 ('x' | 'y' | 'z')
   * @param angle - 旋转角度（弧度）
   * @param config - 动画配置
   */
  rotateOnAxis(
    object: THREE.Object3D,
    axis: 'x' | 'y' | 'z',
    angle: number,
    config: AnimationConfig = {}
  ): void {
    const { duration = 500, easing = TWEEN.Easing.Quadratic.InOut } = config;
    
    const currentRotation = { [axis]: object.rotation[axis] };
    const targetRotation = { [axis]: object.rotation[axis] + angle };
    
    new TWEEN.Tween(currentRotation)
      .to(targetRotation, duration)
      .easing(easing)
      .onUpdate(() => {
        object.rotation[axis] = currentRotation[axis];
      })
      .start();
  }

  /**
   * 位置移动动画
   * @param object - 要移动的对象
   * @param targetPosition - 目标位置
   * @param config - 动画配置
   */
  moveTo(
    object: THREE.Object3D,
    targetPosition: { x?: number; y?: number; z?: number },
    config: AnimationConfig = {}
  ): void {
    const { duration = 500, easing = TWEEN.Easing.Quadratic.InOut } = config;
    
    new TWEEN.Tween(object.position)
      .to(targetPosition, duration)
      .easing(easing)
      .start();
  }

  /**
   * 高亮闪烁动画
   * @param material - 材质对象
   * @param config - 动画配置
   */
  highlightPulse(
    material: THREE.MeshStandardMaterial,
    config: AnimationConfig = {}
  ): void {
    const { duration = 1000 } = config;
    
    const originalEmissive = material.emissive.clone();
    const originalIntensity = material.emissiveIntensity;
    
    const pulse = { intensity: originalIntensity };
    
    new TWEEN.Tween(pulse)
      .to({ intensity: 0.5 }, duration / 2)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .yoyo(true)
      .repeat(1)
      .onUpdate(() => {
        material.emissiveIntensity = pulse.intensity;
      })
      .onComplete(() => {
        material.emissive.copy(originalEmissive);
        material.emissiveIntensity = originalIntensity;
      })
      .start();
  }

  /**
   * 顺序展示动画（逐个显示构件）
   * @param parts - 构件组数组
   * @param config - 动画配置
   */
  sequentialReveal(
    parts: THREE.Group[],
    config: AnimationConfig = {}
  ): void {
    const { duration = 300 } = config;
    
    parts.forEach((part, index) => {
      part.visible = false;
      
      setTimeout(() => {
        part.visible = true;
        const scale = { value: 0 };
        part.scale.set(0, 0, 0);
        
        new TWEEN.Tween(scale)
          .to({ value: 1 }, duration)
          .easing(TWEEN.Easing.Back.Out)
          .onUpdate(() => {
            part.scale.set(scale.value, scale.value, scale.value);
          })
          .start();
      }, index * 150);
    });
  }

  /**
   * 更新所有动画（需要在渲染循环中调用）
   */
  update(): void {
    TWEEN.update();
  }

  /**
   * 停止所有动画
   */
  stopAll(): void {
    TWEEN.removeAll();
  }
}

/**
 * 创建辉光材质
 */
export function createGlowMaterial(
  baseColor: string,
  glowColor: string = '#FFD700',
  glowIntensity: number = 0.3
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: baseColor,
    emissive: glowColor,
    emissiveIntensity: glowIntensity,
    roughness: 0.7,
    metalness: 0.1,
  });
}

/**
 * 力学应力可视化颜色映射
 */
export function getStressColor(stressValue: number): string {
  // stressValue: 0-100
  if (stressValue > 70) {
    return '#DC3545'; // 高应力 - 红色
  } else if (stressValue > 40) {
    return '#FFC107'; // 中应力 - 黄色
  } else {
    return '#28A745'; // 低应力 - 绿色
  }
}
