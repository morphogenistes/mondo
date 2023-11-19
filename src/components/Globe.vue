<script setup>
/*
 * helpful resources :
 * https://discourse.threejs.org/t/how-to-use-quaternions-in-three-js/17257
 * https://hofk.de/main/threejs/quaternion/quaternion_axisangle.html
 * https://dustinpfister.github.io/2023/03/24/threejs-quaternion/
 * https://stackoverflow.com/a/26220451
 * https://stackoverflow.com/a/1171995
 * https://github.com/d3/d3-geo/issues/74#issuecomment-273702580
 * https://gist.github.com/Fil/9ed0567b68501ee3c3fef6fbe3c81564
 * https://stackoverflow.com/a/67083743
 */

import {
  MaterialLoader,
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
  BufferGeometry,
  BufferAttribute,
  BoxGeometry,
  PlaneGeometry,
  SphereGeometry,
  Vector2,
  Vector3,
  Matrix4,
  Quaternion,
  LineBasicMaterial,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  Line,
  Mesh,
  PCFSoftShadowMap,
  TextureLoader,
  WebGLRenderer
} from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

// import ThreeGlobe from 'three-globe';
import * as shapefile from 'shapefile';
import SphereModelVersorControl from '../utils/SphereModelVersorControl.js';
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
  async mounted() {
    await this.init();
    this.animate();
  },
  methods: {
    async init() {
      // this + buffergeometries should be enough to draw the polygons
      const longLatToVector = (long, lat) => {
        const theta = long * Math.PI / 180;
        const phi = lat * Math.PI / 180;
        const x = -Math.sin(theta) * Math.cos(phi);
        const z = -Math.sin(theta) * Math.sin(phi);
        const y = -Math.cos(theta);
        return [ x, y, z ];
      };

      // read shapefiles from natural earth data
      const source = await shapefile.open(
        'src/assets/ne_10m_land/ne_10m_land.shp',
        'src/assets/ne_10m_land/ne_10m_land.dbf',
      );

      let geometry = [];
      // let subPoly = [];

      while (true) {
        const result = await source.read();
        if (result.done) break;
        if (result.value.properties.scalerank === 3) {
          console.log(result.value);
          geometry = result.value.geometry.coordinates;
          // subPoly = result.value.geometry.coordinates[0][0];
          // console.log(geometry);
          break;
        }
      }

      const positions = [];
      const normals = [];
      const uvs = [];

      const points = [];
      const zeMeshes = [];

      geometry.forEach(poly => {
        poly.forEach(subPoly => {
          subPoly.forEach(pair => {
            const [ long, lat ] = pair;
            const [ x, y, z ] = longLatToVector(long, lat);
            // console.log(long, lat);

            positions.push(x * 100);
            positions.push(y * 100);
            positions.push(z * 100);

            const borderGeo = new SphereGeometry(2, 2, 2);
            const borderMat = new MeshBasicMaterial({ transparent: false, color: '#f00' });
            const borderMesh = new Mesh(borderGeo, borderMat);
            borderMesh.position.set(x * 100, y * 100, z * 100);
            points.push(borderMesh);

            normals.push(x);
            normals.push(y);
            normals.push(z);

            uvs.push(1);
            uvs.push(1);
          });

          const zeGeo = new BufferGeometry();
          zeGeo.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
          zeGeo.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
          // can use color instead of uv ?
          zeGeo.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));

          const zeMat = new MeshBasicMaterial({ color: '#f00' });
          const zeMesh = new Mesh(zeGeo, zeMat);
          zeMeshes.push(zeMesh);
        });
      });

      // shapefile.open(
      //   'src/assets/ne_10m_land/ne_10m_land.shp',
      //   'src/assets/ne_10m_land/ne_10m_land.dbf',
      // )
      // .then(
      //   source => source.read()
      //   .then(function log(result) {
      //     console.log(result);
      //     if (result.done) return;
      //     if (result.value.properties.scalerank === 0) {
      //       return
      //     }
      //     return source.read().then(log);
      //   }))
      // .catch(error => console.error(error.stack));

      const container = this.$refs.glview;
      const { clientWidth: width, clientHeight: height } = container;

      this.width = width;
      this.height = height;

      const pointerGeo = new SphereGeometry(3, 6, 6);
      const pointerMat = new MeshBasicMaterial({ transparent: true, color: '#f00' });
      this.pointerDisplay = new Mesh(pointerGeo, pointerMat);

      // const lineMat = new LineBasicMaterial( { color: 0x0000ff } );
      // const linePts = [];
      // linePts.push(new Vector3(0,0,0));
      // linePts.push(new Vector3(0,0,0));
      // const lineGeo = new BufferGeometry().setFromPoints(linePts);
      // this.lineMesh = new Line(lineGeo, lineMat);

      // container.addEventListener('pointermove', e => {
      //   this.onPointerMove(e);
      // });

      // container.addEventListener('pointerdown', e => {
      //   this.onPointerDown(e);
      // });

      // container.addEventListener('pointerup', e => {
      //   this.onPointerUp(e);
      // });

      //////////////////////////////////////////////////////////////////////////

      this.renderer = new WebGLRenderer({ antialias: true });
      this.renderer.setClearColor('white');
      this.renderer.setSize(width, height);
      // this.renderer.shadowMap.enabled = true;
      // this.renderer.shadowMap.type = PCFSoftShadowMap;
      // this.renderer.shadowMap.renderSingleSided = false;

      // THE THREE-GLOBE ! /////////////////////////////////////////////////////

      this.scene = new Scene();
      // this.scene.background = new Color('white');
      this.scene.add(this.pointerDisplay);
      // this.scene.add(this.lineMesh);

      // LIGHTING //////////////////////////////////////////////////////////////

      this.scene.add(new AmbientLight(0x999999, Math.PI));

      const light = new DirectionalLight(0xffffff, 3);
      // const light = new SpotLight(0xffffff, 3, 1000, Math.PI, 1, 0);
      // light.map = new TextureLoader().load('src/assets/textures/mars_1k_color.jpg');
      // const light = new PointLight(0xffffff, 1, 500, 2);
      light.castShadow = true;
      light.angle = 5;
      light.penumbra = 1.15;
      light.distance = 0;

      light.position.set(1000, 1000, 1000);
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

      // this.helper = new DirectionalLightHelper(light, 1);
      // this.scene.add(this.helper);

      // const cameraHelper = new CameraHelper(light.shadow.camera);
      // this.scene.add(cameraHelper);

      // ACTUAL OBJECTS ////////////////////////////////////////////////////////

      const shadowTexture = new TextureLoader().load('src/assets/textures/roundshadow.png');
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
      this.shadowMesh.position.y = -125; //0.001 - 150;  // so we're above the ground slightly
      this.shadowMesh.rotation.x = Math.PI * -0.5;
      const shadowSize = 1; // 200; // sphereRadius * 4;
      this.shadowMesh.scale.set(shadowSize, shadowSize, shadowSize);
      this.scene.add(this.shadowMesh);

      const texture = new TextureLoader().load('src/assets/textures/starmap_2020_4k_print.jpg');
      // const texture = new TextureLoader().load('src/assets/textures/night-sky.png');
      const skyBoxGeometry = new SphereGeometry(10000, 6, 6);
      // const material = new MeshBasicMaterial({ map: texture, side: BackSide });
      const skyBoxMaterial = new MeshStandardMaterial({ map: texture, side: BackSide, color: '#fff' });
      this.skyBox = new Mesh(skyBoxGeometry, skyBoxMaterial);
      // this.scene.add(this.mesh);

      const cloudTex = new TextureLoader().load(
        'src/assets/textures/planetpixelemporium/earthcloudmap.jpg'
      );
      const cloudTransTex = new TextureLoader().load(
        'src/assets/textures/planetpixelemporium/earthcloudmaptrans-inverted.jpg'
      );
      const cloudGeo = new SphereGeometry(102, 50, 50);
      const cloudMat = new MeshPhongMaterial({
        map: cloudTex,
        alphaMap: cloudTransTex,
        // normalScale: [ -1, -1, -1 ],
        transparent: true,
        opacity: 0.85,
        color: '#fff',
        // alphaTest: 0.5,
      });
      // cloudMat.normalScale.set(1, -1);
      // cloudMat.needsUpdate = true;
      this.clouds = new Mesh(cloudGeo, cloudMat);
      // this.scene.add(this.clouds);

      const sphereTexture = new TextureLoader().load(
        'src/assets/textures/planetpixelemporium/earthmap1k.jpg'
        // 'src/assets/textures/planetpixelemporium/moonmap1k.jpg'
        // 'src/assets/textures/lroc_color_poles_1k.jpg'
      );
      const sphereBump = new TextureLoader().load(
        'src/assets/textures/planetpixelemporium/earthbump1k.jpg'
        // 'src/assets/textures/planetpixelemporium/moonbump1k.jpg'
        // 'src/assets/textures/ldem_3_8bit.jpg'
      );
      const sphereGeo = new SphereGeometry(99, 50, 50);
      const sphereMat = new MeshPhongMaterial({
        map: sphereTexture,
        bumpMap: sphereBump,
        bumpScale: 2,
        side: FrontSide,
        color: '#def', // for earth
        // color: '#fff',
        wireframe: false,
      });
      this.sphere = new Mesh(sphereGeo, sphereMat);
      this.sphere.castShadow = true;
      this.sphere.receiveShadow = true;
      // this.sphere.add(this.clouds);
      this.scene.add(this.sphere);

      // this.sphere.add(zeMesh);
      points.forEach(p => {
        // console.log(p);
        this.sphere.add(p);
      });

      zeMeshes.forEach(mesh => {
        // this.sphere.add(mesh);
      })

      // this one is way too heavy !
      // => use some low-poly resources

      // const balloonMtlLoader = new MTLLoader();
      // balloonMtlLoader.load(
      //   'src/assets/models/Hot_air_balloon/11809_Hot_air_balloon_l2.mtl',
      //   materials => {
      //     materials.preload();
      //     const balloonLoader = new OBJLoader();
      //     balloonLoader.setMaterials(materials);
      //     balloonLoader.load(
      //       'src/assets/models/Hot_air_balloon/11809_Hot_air_balloon_l2.obj',
      //       object => {
      //         const s = 0.005;
      //         object.scale.set(s, s, s);
      //         object.rotation.x = -Math.PI * 0.5;
      //         object.position.y = 105;
      //         this.sphere.add(object);
      //       }
      //     );
      //   }
      // );

      // const planeGeo = new PlaneGeometry(1500, 1500, 10);
      // const planeMat = new MeshStandardMaterial({
      //   side: DoubleSide,
      //   color: 'transparent',
      //   wireframe: false
      // });
      // const plane = new Mesh(planeGeo, planeMat);
      // // plane.castShadow = true; 
      // // plane.receiveShadow = true;
      // plane.position.set(0, -200, 0);
      // plane.rotateX(Math.PI * 0.5);
      // // this.scene.add(plane);

      // this.sphere.add(zeMesh);

      // CAMERAS ///////////////////////////////////////////////////////////////

      this.camera = new PerspectiveCamera();
      this.camera.aspect = width / height;
      this.camera.far = 100000;
      // this.camera.position.y = -10;
      this.camera.position.z = 400;
      this.camera.updateProjectionMatrix();
      this.scene.add(this.camera);

      this.camControls = new OrbitControls(this.camera, this.renderer.domElement);
      this.camControls.enablePan = true;
      this.camControls.enableRotate = false;
      this.camControls.enableDamping = false;
      this.camControls.minDistance = 120;
      this.camControls.maxDistance = 1000;
      this.camControls.zoomSpeed = 0.25;
      
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
      })

      // THIS :
      container.appendChild(this.renderer.domElement);      
    },
    animate() {
      requestAnimationFrame(this.animate);

      const now = Date.now();
      const dt = now - this.lastFrameDate || 0;
      this.clouds.rotation.y += dt * -0.00001;
      this.lastFrameDate = now;

      // needed for inertia update, otherwise it is only updated via pointer events
      this.versorControl.update();
      this.renderer.render(this.scene, this.camera);
    },
  },
};
</script>

<style scoped>
.glview {
  width: 70vh;
  height: 70vh;
  /* height: 400px; */
  display: flex;
  flex-direction: column;
}

.glview > canvas {
  flex: 1 1 auto;
}
</style>