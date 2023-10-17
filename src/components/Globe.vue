<script setup>
import {
  Color,
  BackSide,
  DoubleSide,
  FrontSide,
  AmbientLight,
  DirectionalLight,
  DirectionalLightHelper,
  SpotLight,
  PointLight,
  CameraHelper,
  PerspectiveCamera,
  Scene,
  BoxGeometry,
  PlaneGeometry,
  SphereGeometry,
  Matrix4,
  Vector2,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  Mesh,
  PCFSoftShadowMap,
  Raycaster,
  TextureLoader,
  WebGLRenderer
} from 'three';

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { ArcballControls } from "three/examples/jsm/controls/ArcballControls";
import ThreeGlobe from 'three-globe';
</script>

<template>
  <div ref="glview" class="glview"></div>
</template>

<script>
export default {
  data() {
    return {
      // camera: null,
      // controls: null,
      // mesh: null,
      // renderer: null,
      // scene: null,
    }
  },
  mounted() {
    this.init();
    this.animate();
  },
  methods: {
    init() {
      const container = this.$refs.glview;
      const { clientWidth: width, clientHeight: height } = container;

      this.pointer = new Vector2();
      this.raycaster = new Raycaster();

      container.addEventListener('pointermove', e => {
        const { pointerType, pressure } = e;
        this.pointer.x = e.offsetX / width * 2 - 1;
        this.pointer.y = -e.offsetY / height * 2 + 1;
        // console.log(this.pointer);
      });

      this.renderer = new WebGLRenderer({ antialias: true });
      // this.renderer.setClearColor('#000');
      this.renderer.setClearColor('white');
      this.renderer.setSize(width, height);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = PCFSoftShadowMap;
      // this.renderer.shadowMap.renderSingleSided = false;

      const N = 20;

      const arcsData = [...Array(N).keys()].map(() => ({
        startLat: (Math.random() - 0.5) * 180,
        startLng: (Math.random() - 0.5) * 360,
        endLat: (Math.random() - 0.5) * 180,
        endLng: (Math.random() - 0.5) * 360,
        color: ['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)]
      }));

      this.myGlobe = new ThreeGlobe()
        .globeImageUrl('src/assets/lroc_color_poles_1k.jpg')
        .showAtmosphere(false)
        // .globeImageUrl('src/assets/mercurymap.jpg')
        // .bumpImageUrl('src/assets/mercurybump.jpg')
        // .globeImageUrl('src/assets/venusmap.jpg')
        // .bumpImageUrl('src/assets/venusbump.jpg')
        // .globeImageUrl('src/assets/mars_1k_color.jpg')
        // .bumpImageUrl('src/assets/mars_1k_topo.jpg')
        // .globeImageUrl('src/assets/jupitermap.jpg');
        // .globeImageUrl('src/assets/neptunemap.jpg');
        // .arcsData(arcsData)
        // .arcColor('color')
        // .arcDashLength(0.4)
        // .arcDashGap(4)
        // .arcDashInitialGap(() => Math.random() * 5)
        // .arcDashAnimateTime(1000);

      // const myGlobe = new ThreeGlobe()
        // .backgroundColor('#000')
        // .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
        // .globeImageUrl('src/assets/lroc_color_poles_1k.jpg')
        // .globeImageUrl('src/assets/land_ocean_ice_cloud_2048.jpg')
        // .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        // .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
        // .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png');

      this.scene = new Scene();
      // this.scene.background = new Color('white');
      this.subScene = new Scene();
      // this.subScene.add(this.myGlobe);
      this.scene.add(this.subScene);

      // LIGHTING //////////////////////////////////////////////////////////////

      this.scene.add(new AmbientLight(0x999999, Math.PI));

      const light = new DirectionalLight(0xffffff, 3);
      // const light = new SpotLight(0xffffff, 3, 1000, Math.PI, 1, 0);
      // light.map = new TextureLoader().load('src/assets/mars_1k_color.jpg');
      // const light = new PointLight(0xffffff, 1, 500, 2);
      light.castShadow = true;
      light.angle = 5;
      light.penumbra = 1.15;
      light.distance = 0;

      light.position.set(0, 2000, 0);
      light.target.position.set(0, -100, 0);
      this.scene.add(light);
      this.scene.add(light.target);

      // for directional light -------------------------------------------------
      // light.shadow.camera.left = light.shadow.camera.bottom = -250;
      // light.shadow.camera.top = light.shadow.camera.right = 250;
      light.shadow.mapSize.width = 1024;
      light.shadow.mapSize.height = 1024;
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 3000;
      light.shadow.camera.fov = 20;
      // light.shadow.darkness = 0.5;
      // light.shadow.camera.visible = true;

      this.helper = new DirectionalLightHelper(light, 1);
      // this.scene.add(this.helper);

      const cameraHelper = new CameraHelper(light.shadow.camera);
      // this.scene.add(cameraHelper);

      // ACTUAL OBJECTS ////////////////////////////////////////////////////////

      const shadowTexture = new TextureLoader().load('src/assets/roundshadow.png');
      const planeSize = 200;
      const shadowGeo = new PlaneGeometry(planeSize, planeSize);
      const shadowMat = new MeshBasicMaterial({
        map: shadowTexture,
        side: DoubleSide,
        transparent: true,
        depthWrite: false,
        opacity: 0.75,
      });

      this.shadowMesh = new Mesh(shadowGeo, shadowMat);
      this.shadowMesh.position.y = 0.001 - 150;  // so we're above the ground slightly
      this.shadowMesh.rotation.x = Math.PI * -0.5;
      const shadowSize = 1; // 200; // sphereRadius * 4;
      this.shadowMesh.scale.set(shadowSize, shadowSize, shadowSize);
      this.scene.add(this.shadowMesh);

      const texture = new TextureLoader().load('src/assets/starmap_2020_4k_print.jpg');
      // const texture = new TextureLoader().load('src/assets/night-sky.png');
      const skyBoxGeometry = new SphereGeometry(10000, 6, 6);
      // const material = new MeshBasicMaterial({ map: texture, side: BackSide });
      const skyBoxMaterial = new MeshStandardMaterial({ map: texture, side: BackSide, color: '#fff' });
      this.skyBox = new Mesh(skyBoxGeometry, skyBoxMaterial);
      // this.scene.add(this.mesh);

      const sphereTexture = new TextureLoader().load('src/assets/lroc_color_poles_1k.jpg');
      const sphereGeometry = new SphereGeometry(99, 30, 30);
      const sphereMaterial = new MeshStandardMaterial({
        map: sphereTexture,
        side: FrontSide,
        color: '#fff',
        wireframe: false
      });
      this.sphere = new Mesh(sphereGeometry, sphereMaterial);
      // mesh.castShadow = true;
      // mesh.receiveShadow = true;
      this.scene.add(this.sphere);

      const planeGeometry = new PlaneGeometry(1500, 1500, 10);
      const planeMaterial = new MeshStandardMaterial({ side: DoubleSide, color: 'transparent', wireframe: false });
      const plane = new Mesh(planeGeometry, planeMaterial);
      // plane.castShadow = true; 
      // plane.receiveShadow = true;
      plane.position.set(0, -200, 0);
      plane.rotateX(Math.PI * 0.5);
      // this.scene.add(plane);

      // Setup camera
      this.camera = new PerspectiveCamera();
      this.camera.aspect = width / height;
      this.camera.far = 100000;
      this.camera.position.z = 500;
      this.camera.updateProjectionMatrix();
      this.scene.add(this.camera);

      container.appendChild(this.renderer.domElement);

      // Add camera controls

      // this is an attempt to use a dummy cam to attach the trackball controls
      // to and get the rotation back to apply to the globe
      // but (expectedly) it gives weird results and the interaction should be
      // coded from scratch instead, using a pointer interaction and quaternion
      // accumulation like https://www.jasondavies.com/maps/rotate/
      
      // instead see work in progress above using a Raycaster to get the point
      // of the globe which is currently being pointed at by the mouse
      
      this.dummyCam = new PerspectiveCamera();
      this.dummyCam.aspect = width / height;
      this.dummyCam.far = 100000;
      this.dummyCam.position.z = 500;
      this.dummyCam.updateProjectionMatrix();
      this.subScene.add(this.dummyCam);
      
      // this.camControls = new TrackballControls(this.camera, this.renderer.domElement);
      // this.camControls.minDistance = 101;
      // this.camControls.rotateSpeed = 2;
      // this.camControls.zoomSpeed = 0.8;

      this.sphereControls = new TrackballControls(this.dummyCam, this.renderer.domElement);
      // this.sphereControls.activateGizmos(false);
      // this.sphereControls.addEventListener('change', () => {
      //   // console.log(this.dummyCam.quaternion);
      //   // this.myGlobe.quaternion.set(this.dummyCam.quaternion);
      //   this.myGlobe.rotation.x = -this.dummyCam.rotation.x;
      //   this.myGlobe.rotation.y = -this.dummyCam.rotation.y;
      //   this.myGlobe.rotation.z = this.dummyCam.rotation.z;
      // });

      // this.camControls = new OrbitControls(this.camera, this.renderer.domElement);
      // this.camControls.enableDamping = true;

    },
    animate() {
      requestAnimationFrame(this.animate);
      // this.camControls.update();

      // this is another piece of the attempt at using TrackballControlls to
      // rotate only the sphere, this will be removed
      // this.sphereControls.update();
      // this.sphere.rotation.x = -this.dummyCam.rotation.z;
      // this.sphere.rotation.y = -this.dummyCam.rotation.y;
      // this.sphere.rotation.z = -this.dummyCam.rotation.z;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children);

      if (intersects.length > 0) {
        console.log(intersects[0]);
      }

      // this.helper.update();
      this.renderer.render(this.scene, this.camera);
    },
  },
};
</script>

<style scoped>
.glview {
  width: 100%;
  height: 400px;
  display: flex;
  flex-direction: column;
}

.glview > canvas {
  flex: 1 1 auto;
}
</style>