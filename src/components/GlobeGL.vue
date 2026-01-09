<script setup>
import {
  PerspectiveCamera,
  Scene
} from 'three';
import ThreeGlobe from 'three-globe';
import SphereModelVersorControl from '../utils/SphereModelVersorControl.js';
</script>

<template>
  <div ref="glview" class="glview"></div>
</template>

<script>
export default {
  async mounted() {
    await this.init();
    // this.animate();
  },
  methods: {
    async init() {
      const g = new ThreeGlobe()
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png');

      this.scene = new Scene();
      this.scene.add(g);

      const container = this.$refs.glview;
      // this.renderer = g.renderer;
      // const { clientWidth: width, clientHeight: height } = container;

      // this.width = width;
      // this.height = height;

      this.camera = new PerspectiveCamera();
      this.camera.aspect = 1;//width / height;
      this.camera.far = 100000;
      // this.camera.position.y = -10;
      this.camera.position.z = 400;
      this.camera.updateProjectionMatrix();
      this.scene.add(this.camera);

      // this.camControls = new OrbitControls(this.camera, this.renderer.domElement);
      // this.camControls.enablePan = true;
      // this.camControls.enableRotate = false;
      // this.camControls.enableDamping = false;
      // this.camControls.minDistance = 120;
      // this.camControls.maxDistance = 1000;
      // this.camControls.zoomSpeed = 0.25;
      
      this.versorControl = new SphereModelVersorControl(
        container,
        this.scene,
        this.camera,
        this.sphere
      );
      this.versorControl.addListener('start', position => {
        const { x, y, z } = position;
        this.pointerDisplay.position.set(x, y, z);
        this.pointerDisplay.material.opacity = 1;
      });
      this.versorControl.addListener('move', position => {
        const { x, y, z } = position;
        this.pointerDisplay.position.set(x, y, z);
      });
      this.versorControl.addListener('end', () => {
        this.pointerDisplay.material.opacity = 0;
      });
      // this.versorControl.addListener('rotate', r => {
      //   this.clouds.setRotationFromEuler(r);
      // });

      // THIS :
      container.appendChild(this.renderer.domElement);      
    }
  }
};
</script>