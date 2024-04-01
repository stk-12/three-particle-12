import { radian } from './utils';
import * as THREE from "three";
import { gsap } from "gsap";
import { Particle } from './particle';

// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
class Main {
  constructor() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    this.cursor = {
      x: 0,
      y: 0
    };

    this.canvas = document.querySelector("#canvas");

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.viewport.width, this.viewport.height);

    this.scene = new THREE.Scene();
    this.camera = null;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Raycasterの初期化
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this._init();
    this._update();
    this._addEvent();

    this.partcle = new Particle(this.group, this.viewport);
    this.partcle.init();

  }

  _setCamera() {
    //ウインドウとWebGL座標を一致させる
    const fov = 45;
    const fovRadian = (fov / 2) * (Math.PI / 180); //視野角をラジアンに変換
    const distance = this.viewport.height / 2 / Math.tan(fovRadian); //ウインドウぴったりのカメラ距離
    this.camera = new THREE.PerspectiveCamera(
      fov,
      this.viewport.width / this.viewport.height,
      1,
      distance * 2
    );
    this.camera.position.z = distance;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
  }

  _setLight() {
    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.9);
    dirLight.position.set(1, 10, 1);
    this.scene.add(dirLight);

    const ambLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
    this.scene.add(ambLight);
  }

  _init() {
    this._setCamera();
    this._setLight();
    // this._setControlls();
  }

  _scaleAnimation(mesh) {
    if(mesh.scale.x > 1) return;
    const tl = gsap.timeline();
    tl.to(mesh.scale, {
      duration: 0.3,
      x: 2.5,
      y: 2.5,
      z: 2.5,
      ease: "expo.out"
    })
    // .to(mesh.position, {
    //   duration: 0.3,
    //   z: "+=20",
    //   // y: 3,
    //   // z: 3,
    //   ease: "expo.out"
    // }, "<")
    .to(mesh.scale, {
      duration: 0.2,
      x: 1,
      y: 1,
      z: 1,
      ease: "expo.out"
    }, "+=0.2")
  }

  _update() {

    if(this.partcle) {
      this.partcle.onUpdate();
    }

    // const parallaxX = this.cursor.x;
    // const parallaxY = - this.cursor.y;

    // Raycasterを更新
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 交差しているオブジェクトを検出
    const intersects = this.raycaster.intersectObjects(this.scene.children);

    if (intersects.length) {
      this._scaleAnimation(intersects[0].object);   

    }

    //レンダリング
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this._update.bind(this));
  }

  _onResize() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    // レンダラーのサイズを修正
    this.renderer.setSize(this.viewport.width, this.viewport.height);
    // カメラのアスペクト比を修正
    this.camera.aspect = this.viewport.width / this.viewport.height;
    this.camera.updateProjectionMatrix();
  }

  // _onMousemove(e) {
  //   this.cursor.x = e.clientX / this.viewport.width - 0.5;
  //   this.cursor.y = e.clientY / this.viewport.height - 0.5;
  // }

  _onMousemove(e) {
    // 画面上のマウスの位置を正規化した値に変換
    this.mouse.x = ( e.clientX / this.viewport.width ) * 2 - 1;
    this.mouse.y = - ( e.clientY / this.viewport.height ) * 2 + 1;
  }

  _addEvent() {
    window.addEventListener("resize", this._onResize.bind(this));
    window.addEventListener("mousemove", this._onMousemove.bind(this));
  }

  // _setControlls() {
  //   this.controls = new OrbitControls(this.camera, this.canvas);
  //   this.controls.enableDamping = true;
  // }
}

new Main();