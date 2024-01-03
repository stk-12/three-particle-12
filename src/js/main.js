import * as THREE from "three";
import { Particle } from './particle';

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

  _init() {
    this._setCamera();
  }

  _update() {

    if(this.partcle) {
      this.partcle.onUpdate();
    }

    const parallaxX = this.cursor.x;
    const parallaxY = - this.cursor.y;


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

  _onMousemove(e) {
    this.cursor.x = e.clientX / this.viewport.width - 0.5;
    this.cursor.y = e.clientY / this.viewport.height - 0.5;
  }

  _addEvent() {
    window.addEventListener("resize", this._onResize.bind(this));
    window.addEventListener("mousemove", this._onMousemove.bind(this));
  }
}

new Main();