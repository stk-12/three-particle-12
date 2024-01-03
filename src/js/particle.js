import { random } from './utils';
import { imagePixel } from './imagePixel';
// import { createParticleTexture } from './createParticleTexture';
import * as THREE from "three";
import GUI from "lil-gui";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
// import vertexSource from "./shader/vertexShader.glsl";
// import fragmentSource from "./shader/fragmentShader.glsl";
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
      sizeParticle: {
        kv: 2.8,
        explosion: 5.0,
        earth: 5.0,
        earthLine: 2.8,
        ring: 5.0,
        random: 6.0,
        logo: 3.0,
      },
      maxDistance: {
        kv: 2400.0,
        explosion: 2400.0,
        earth: 3000.0,
        earthLine: 2000.0,
        ring: 2000.0,
        random: 1600.0,
        logo: 2000.0,
      },
    }

    this.promiseList = [];
    this.modelPathList = [
      // {
      //   name: 'explosion',
      //   path: 'model/explosion_7_6.glb',
      //   // scale: 180.0
      //   scale: this.baseParams.scaleModel.explosion
      // },
      // {
      //   name: 'explosion_small',
      //   path: 'model/explosion_small.glb',
      //   // scale: 280.0
      //   scale: this.baseParams.scaleModel.explosion_small
      // },
      // {
      //   name: 'logo',
      //   path: 'model/logo.glb',
      //   // scale: 300.0
      //   scale: this.baseParams.scaleModel.logo
      // },
    ];
    this.loader = new GLTFLoader();

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

    // this.ringsList = [];

    // this.earthGroup = new THREE.Group();
    // this.scene.add(this.earthGroup);

    this.countParticle = 0;

    // explosionで追加するパーティクルの数
    this.countAddParticle = 10000;
    // 追加を加えたパーティクルの数
    this.countCurrentParticle = 0;

    // this.currentShape = null;
    
    this.targetPositions = {};
    this.geometries = {};

    this.clock = new THREE.Clock();

    // this.params = {
    //   maxDistance: 2000.0,
    // }


    
    this.color1 = new THREE.Color(0xf88dc5); // 濃ピンク
    this.color2 = new THREE.Color(0xfd79ff); // 薄ピンク

    this.color3 = new THREE.Color(0xf88dc5); // 濃ピンク
    this.color4 = new THREE.Color(0xfd79ff); // 薄ピンク




    // this.uniforms = {
    //   uTime: {
    //     value: 0.0,
    //   },
    //   uColor1: {
    //     value: this.color1
    //   },
    //   uColor2: {
    //     value: this.color2
    //   },
    //   uSize: {
    //     value: this.baseParams.sizeParticle.kv * this.baseParams.ratio
    //   },
    //   uTexture: {
    //     value: createParticleTexture()
    //   },
    //   uAlpha: {
    //     value: 0.0
    //     // value: 1.0
    //   },
    //   uResolution: {
    //     value: new THREE.Vector2(window.innerWidth, window.innerHeight)
    //   },
    //   // グラデーションの向き
    //   uGradientDirection: {
    //     value: 0.0
    //   },
    //   // 
    //   uMinDistance: {
    //     value: 200.0
    //   },
    //   uMaxDistance: {
    //     value: this.baseParams.maxDistance.kv * this.baseParams.ratio
    //   },
    //   // 振幅度
    //   uAmplitudeX: {
    //     // value: 6.0
    //     value: 8.0
    //   },
    //   uAmplitudeY: {
    //     // value: 10.0
    //     value: 14.0
    //   },
    //   uAmplitudeZ: {
    //     value: 4.0
    //   },
    //   // explosion表示中かどうか
    //   uIsExplosion: {
    //     value: 0.0
    //   },
    // }



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

          // this._initParticleMesh(imageInfo.name);

          resolve();
        });
      });
    });

    // 最初にimagePromisesを解決する
    await Promise.all(imagePromises);

    const modelPromises = this.modelPathList.map((modelInfo, index) => {
      return new Promise((resolve) => {
        this.loader.load(modelInfo.path, (gltf) => {
          const model = gltf.scene;
          const modelMesh = model.children[0];
          const newScale = modelInfo.scale * this.baseParams.ratio;

          // メッシュを拡大
          modelMesh.scale.set(newScale, newScale, newScale);
          // メッシュのスケールに合わせて座標データを拡大
          const positions = modelMesh.geometry.attributes.position.array;
          for (let i = 0; i < positions.length; i += 3) {
            positions[i] *= newScale;
            positions[i + 1] *= newScale;
            positions[i + 2] *= newScale;
          }
          // 座標データを更新
          modelMesh.geometry.attributes.position.needsUpdate = true;

          this._addParticlesSurface(modelMesh, modelInfo.name);

          resolve();
        })
      })
    });

    // 次にmodelPromisesを解決する
    await Promise.all(modelPromises);

    // Promise後の初期化処理を行う
    this._initParticleMesh();

    this._setAnimation();



    // 検証用
    this._setGUI();

    // this._addRingParticles();
    // console.log(this.geometries);
    // console.log(this.targetPositions);

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


  _addParticlesSurface(mesh, shapeName) {
    // shapaNameが 'explosion_small' だった場合、パーティクルの数を変更
    let countParticle = this.countParticle;
    if (shapeName === 'explosion_small') {
      countParticle = 20000;
    }
    if (shapeName === 'explosion') {
      countParticle += this.countAddParticle;
      this.countCurrentParticle = countParticle;
    }


    // オブジェクトの中心からの距離を計算して、中心に近いほどサンプリング確率を高くする
    const sampler = new MeshSurfaceSampler(mesh).build();
    // const sampler = new MeshSurfaceSampler(mesh).setWeightAttribute('uv').build();
    const particleSurfaceGeometry = new THREE.BufferGeometry();
    const particlesPosition = new Float32Array(countParticle * 3);


    // ---------------------------------------------------------
    // 配置1 通常配置　ランダム
    // ---------------------------------------------------------
    for(let i = 0; i < countParticle; i++) {
      const newPosition = new THREE.Vector3()
      sampler.sample(newPosition)
      particlesPosition.set([
        newPosition.x, // 0 - 3
        newPosition.y, // 1 - 4
        newPosition.z // 2 - 5
      ], i * 3)
    }

    // ---------------------------------------------------------
    // ジオメトリにposition属性を追加 
    // ---------------------------------------------------------
    particleSurfaceGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPosition, 3));

    

    // ---------------------------------------------------------
    // 頂点に情報を追加
    // ---------------------------------------------------------

    // 頂点に透過情報追加 0.3〜1のランダムな値
    // ---------------------------------------------------------
    const alphas = [];
    for (let i = 0; i < countParticle; i++) {
      alphas.push(random(0.3, 1.0));
    }
    particleSurfaceGeometry.setAttribute('aAlpha', new THREE.Float32BufferAttribute(alphas, 1));


    // 頂点にランダム情報追加
    // ---------------------------------------------------------
    const randoms = [];
    // const vertices = filteredPositions.length / 3;
    for (let i = 0; i < countParticle; i++) {
      randoms.push(random(-2.0, 2.0), random(-2.0, 2.0), random(-2.0, 2.0));
    }
    particleSurfaceGeometry.setAttribute('aRandom', new THREE.Float32BufferAttribute(randoms, 3));

    // 頂点に超過頂点分のフラグ情報追加
    // ---------------------------------------------------------
    const displayFlags = [];
    for (let i = 0; i < countParticle; i++) {
      if (i <= this.countParticle) {
        displayFlags.push(1.0);
      } else {
        displayFlags.push(0.0);
      }
    }
    particleSurfaceGeometry.setAttribute('aDisplayFlag', new THREE.Float32BufferAttribute(displayFlags, 1));




    this.targetPositions[shapeName] = [...particleSurfaceGeometry.attributes.position.array];

    // this.geometries[shapeName] = mesh.geometry;
    this.geometries[shapeName] = particleSurfaceGeometry;
  }


  // 頂点にパーティクルを配置
  _initParticleMesh() {
    // this.particleGeometry = this.geometries.hello;

    // this.particleMaterial = new THREE.ShaderMaterial({
    //   vertexShader: vertexSource,
    //   fragmentShader: fragmentSource,
    //   uniforms: this.uniforms,
    //   transparent: true,
    //   depthWrite: false, // 透過オブジェクトの重なりを正しく描画するため
    //   blending: THREE.AdditiveBlending // 加算合成
    // });
    // this.particlesMesh = new THREE.Points(
    //   this.particleGeometry,
    //   this.particleMaterial
    // );

    // this.scene.add(this.particlesMesh);

    const geometry = new THREE.TetrahedronGeometry(10, 0);
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
      this.meshList.push(mesh);

      this.scene.add(mesh);
    }
  }


  _animateParticles(targetPositions, shapeName, duration = 1.3, delay = 0.3, easing = "expo.out") {

    // const targetPositions = this.targetPositions[shapeName];

    console.log(this.meshList.length);
    console.log(targetPositions.length);

    for(let i = 0; i < this.meshList.length; i++) {
      const mesh = this.meshList[i];

      gsap.to(mesh.position, {
        duration: duration + Math.random() * delay, // delay：ランダムな遅延
        ease: easing,
        x: targetPositions[i * 3],
        y: targetPositions[i * 3 + 1],
        z: targetPositions[i * 3 + 2],
      });
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
      mesh.rotation.y += 0.01;
      mesh.rotation.z += 0.01;
    });
  }

  // -----------------------------------------------------------------
  // 検証用
  // -----------------------------------------------------------------
  _setGUI() {

    // const guiBtnObj = {
    //   pauseFunc: () => {
    //     this.ANIMATION.loading.pause();
    //   },
    //   startFunc: () => {
    //     this.ANIMATION.loading.play();
    //   }
    // }
    
    // // 爆発粒子設定
    // const folderExplosionParticle = this.gui.addFolder('爆発時 粒子の設定');
    // // folderExplosionParticle.close();
    // folderExplosionParticle.add(guiBtnObj, 'pauseFunc').name('アニメーション一時停止');
    // folderExplosionParticle.add(guiBtnObj, 'startFunc').name('アニメーション再開');

    // folderExplosionParticle.add({Preset: this.currentPreset}, 'Preset', Object.keys(this.explosionPresets))
    // .name('爆発パターン')
    // .onChange(newPreset => {
    //     // 新しいプリセットを適用
    //     this._applyPreset(newPreset);
    // });

    // folderExplosionParticle.addColor(this.explotionParticleUniforms.uColor1, 'value').name('爆発時 粒子の色1').listen();
    // folderExplosionParticle.addColor(this.explotionParticleUniforms.uColor2, 'value').name('爆発時 粒子の色2').listen();
    // folderExplosionParticle.add(this.explotionParticleUniforms.uSize, 'value').min(0).max(10).step(0.1).name('爆発時 粒子のサイズ').listen();

    // const folderParticle = this.gui.addFolder('粒子の設定');
    // folderParticle.addColor(this.uniforms.uColor1, 'value').name('粒子の色1').listen();
    // folderParticle.addColor(this.uniforms.uColor2, 'value').name('粒子の色2').listen();
    // // パーティクルの数
    // folderParticle.add(this, 'countCurrentParticle', 0, 50000).name('粒子の数 ※確認用 操作不可').listen();
    // // パーティクルのサイズ
    // folderParticle.add(this.uniforms.uSize, "value").min(0).max(20).step(0.1).name('粒子のサイズ').listen();
    // // パーティクルの透明度
    // folderParticle.add(this.uniforms.uAlpha, "value").min(0).max(1).step(0.1).name('粒子の透明度').listen();
    // // パーティクルの描画距離
    // folderParticle.add(this.uniforms.uMaxDistance, "value").min(0).max(5000).step(1).name('粒子の描画範囲').listen();


  }


}