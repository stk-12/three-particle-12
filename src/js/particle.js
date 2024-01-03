import { random } from './utils';
import { imagePixel } from './imagePixel';
import * as THREE from "three";
import GUI from "lil-gui";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
gsap.registerPlugin(CustomEase);

export class Particle {
  constructor(scene, viewport) {
    this.scene = scene;
    this.viewport = viewport;

    this.baseParams = {
      ratio: 1.0, // 画面サイズによって変わる倍率
      scaleModel: {
        explosion: 180.0,
        explosion_small: 280.0,
        logo: 300.0,
      },
      sizeImage: {
        width: 1400,
        height: 400
      },
    }

    this.promiseList = [];

    this.imagePathList = [
      {
        name: 'hello',
        path: 'images/hello.png',
        resolution: 15.0,
      },
      {
        name: 'goodbye',
        path: 'images/goodbye.png',
        resolution: 15.0,
      },
    ]
    this.imageList = [];

    this.meshList = [];


    this.countParticle = 0;

    // explosionで追加するパーティクルの数
    this.countAddParticle = 10000;
    // 追加を加えたパーティクルの数
    this.countCurrentParticle = 0;

    // this.currentShape = null;
    
    this.targetPositions = {};
    this.geometries = {};

    this.clock = new THREE.Clock();

    
    this.color1 = new THREE.Color(0xf88dc5); // 濃ピンク
    this.color2 = new THREE.Color(0xfd79ff); // 薄ピンク

    this.color3 = new THREE.Color(0xf88dc5); // 濃ピンク
    this.color4 = new THREE.Color(0xfd79ff); // 薄ピンク





    // 検証用
    this.gui = new GUI();
    // this._setGUI();

  }

  async init() {

    const imagePromises = this.imagePathList.map((imageInfo, index) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = imageInfo.path;
        img.crossOrigin = "anonymous";

        // 画像サイズを更新
        const scaledWidth = this.baseParams.sizeImage.width * this.baseParams.ratio;
        const scaledHeight = this.baseParams.sizeImage.height * this.baseParams.ratio;
        img.width = scaledWidth;
        img.height = scaledHeight;
  
        img.addEventListener('load', () => {
          const imagePixels = imagePixel(img, img.width, img.height, imageInfo.resolution);
          this.imageList[index] = {
            name: imageInfo.name,
            data: imagePixels
          };
          this._setImageGeometries(imagePixels, index, imageInfo.name);

          resolve();
        });
      });
    });

    // 最初にimagePromisesを解決する
    await Promise.all(imagePromises);

    // Promise後の初期化処理を行う
    this._initParticleMesh();

    this._setAnimation();



    // 検証用
    this._setGUI();

  }

  _setImageGeometries(imagePixels, index, imageName) {
    const filteredPositions = [];
    const filteredColors = [];

    const positions = imagePixels.position;
    const colors = imagePixels.color;

    for (let i = 0; i < colors.length; i += 3) {
      // R成分を元にデータをフィルタリング
      if (colors[i] >= 0.4) {
        filteredPositions.push(positions[i] + random(-0.2, 0.2), positions[i + 1] + random(-0.2, 0.2), positions[i + 2]);
        filteredColors.push(colors[i], colors[i + 1], colors[i + 2]);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(filteredPositions, 3));

    // パーティクル数を設定
    if(imageName === 'goodbye') {
      this.countParticle = filteredPositions.length / 3;
      console.log('パーティクル数', filteredPositions.length / 3);
    }

    this.targetPositions[imageName] = [...geometry.attributes.position.array];

    this.geometries[imageName] = geometry;
  }


  // 頂点にパーティクルを配置
  _initParticleMesh() {

    const geometry = new THREE.TetrahedronGeometry(12, 0);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    for(let i = 0; i < this.countParticle; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        this.targetPositions.goodbye[i * 3],
        this.targetPositions.goodbye[i * 3 + 1],
        this.targetPositions.goodbye[i * 3 + 2]
      );
      mesh.rotation.set(random(0, 2 * Math.PI), random(0, 2 * Math.PI), random(0, 2 * Math.PI));

      this.meshList.push(mesh);

      this.scene.add(mesh);
    }
  }


  _animateParticles(targetPositions, shapeName, duration = 1.3, delay = 0.3, easing = "expo.out") {

    for(let i = 0; i < this.meshList.length; i++) {
      const mesh = this.meshList[i];

      if (i < targetPositions.length / 3) {
        // 通常の処理
        gsap.to(mesh.position, {
          duration: duration + Math.random() * delay, // delay：ランダムな遅延
          ease: easing,
          x: targetPositions[i * 3],
          y: targetPositions[i * 3 + 1],
          z: targetPositions[i * 3 + 2],
        });

      } else {
        // 余ったメッシュの処理
        // gsap.to(mesh.position, {
        //   duration: duration + Math.random() * delay,
        //   ease: easing,
        //   x: random(-1000, 1000),
        //   y: random(-1000, 1000),
        //   z: random(-1000, -500),
        // });

        const randomIndex = Math.floor(random(0, targetPositions.length / 3));
        gsap.to(mesh.position, {
          duration: duration + Math.random() * delay,
          ease: easing,
          x: targetPositions[randomIndex * 3],
          y: targetPositions[randomIndex * 3 + 1],
          z: targetPositions[randomIndex * 3 + 2],
        });


      }

    }

  }

  // ---------------------------------------------------------
  // アニメーション設定
  // ---------------------------------------------------------  
  _setAnimation() {
    const easeExplosion = CustomEase.create("custom", "M0,0 C0.018,0.516 0.008,0.755 0.123,0.861 0.232,0.963 0.374,1 1,1 ");
    const easeExplosion2 = CustomEase.create("custom", "M0,0 C0.105,0 0.169,0.013 0.2,0.1 0.238,0.209 0.25,0.382 0.25,0.504 0.25,0.636 0.235,0.825 0.3,0.9 0.386,1 0.771,1 1,1 ");


    const tl = gsap.timeline({ repeat: -1 });
    tl.to(this.meshList, {
      duration: 3.0,
      onStart: () => {
        this._animateParticles(this.targetPositions.hello, 'hello', 1.8, 0.3, easeExplosion2);
      }
    })
    .to(this.meshList, {
      duration: 3.0,
      onStart: () => {
        this._animateParticles(this.targetPositions.goodbye, 'goodbye', 1.8, 0.3, easeExplosion2);
      }
    })
  }


  onUpdate() {
    const elapsedTime = this.clock.getElapsedTime();

    this.meshList.forEach((mesh, index) => {
      mesh.rotation.y += 0.02;
      mesh.rotation.z += 0.02;
    });
  }

  // -----------------------------------------------------------------
  // 検証用
  // -----------------------------------------------------------------
  _setGUI() {


  }


}