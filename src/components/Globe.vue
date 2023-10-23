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
  Raycaster,
  TextureLoader,
  WebGLRenderer
} from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { ArcballControls } from 'three/examples/jsm/controls/ArcballControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

import ThreeGlobe from 'three-globe';
import * as shapefile from 'shapefile';
import versor from '../utils/versor.js';
import Filter from '../utils/filter.js';
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
    onPointerMove(e) {
      const { pointerType, pressure } = e;
      this.pointer.x = e.offsetX / this.width * 2 - 1;
      this.pointer.y = -e.offsetY / this.height * 2 + 1;
    },
    onPointerDown(e) {
      this.pointerDisplay.material.color.setHex(0xff0000);
      this.pointerDown = true;
      this.firstPointerDown = true;
    },
    onPointerUp(e) {
      this.pointerDisplay.material.color.setHex(0x00ff00);
      this.pointerDown = false;
    },
    init() {
      // read shapefiles from natural earth data

      // shapefile.open(
      //   'src/assets/ne_10m_land/ne_10m_land.shp',
      //   'src/assets/ne_10m_land/ne_10m_land.dbf',
      // )
      // .then(
      //   source => source.read()
      //   .then(function log(result) {
      //     if (result.done) return;
      //     console.log(result.value);
      //     return source.read().then(log);
      //   }))
      // .catch(error => console.error(error.stack));

      const container = this.$refs.glview;
      const { clientWidth: width, clientHeight: height } = container;

      this.width = width;
      this.height = height;
      this.pointer = new Vector2(-1, -1);
      this.pointerDown = false;
      this.firstPointerDown = false;
      this.raycaster = new Raycaster();
      this.filter = new Filter(3);
      this.filter.setAlpha(0.95);
      this.lastPointerPosition = new Vector3(0,0,0);

      const pointerGeo = new SphereGeometry(6, 6, 6);
      const pointerMat = new MeshBasicMaterial({ transparent: true, color: '#f00' });
      this.pointerDisplay = new Mesh(pointerGeo, pointerMat);

      // const lineMat = new LineBasicMaterial( { color: 0x0000ff } );
      // const linePts = [];
      // linePts.push(new Vector3(0,0,0));
      // linePts.push(new Vector3(0,0,0));
      // const lineGeo = new BufferGeometry().setFromPoints(linePts);
      // this.lineMesh = new Line(lineGeo, lineMat);

      container.addEventListener('pointermove', e => {
        this.onPointerMove(e);
      });

      container.addEventListener('pointerdown', e => {
        this.onPointerDown(e);
      });

      container.addEventListener('pointerup', e => {
        this.onPointerUp(e);
      });

      //////////////////////////////////////////////////////////////////////////

      this.renderer = new WebGLRenderer({ antialias: true });
      this.renderer.setClearColor('white');
      this.renderer.setSize(width, height);
      // this.renderer.shadowMap.enabled = true;
      // this.renderer.shadowMap.type = PCFSoftShadowMap;
      // this.renderer.shadowMap.renderSingleSided = false;

      // THE THREE-GLOBE ! /////////////////////////////////////////////////////

      // const N = 20;

      // const arcsData = [...Array(N).keys()].map(() => ({
      //   startLat: (Math.random() - 0.5) * 180,
      //   startLng: (Math.random() - 0.5) * 360,
      //   endLat: (Math.random() - 0.5) * 180,
      //   endLng: (Math.random() - 0.5) * 360,
      //   color: ['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)]
      // }));

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
        opacity: 0.75,
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
      this.sphere.add(this.clouds);
      this.scene.add(this.sphere);

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

      // CAMERAS ///////////////////////////////////////////////////////////////

      this.camera = new PerspectiveCamera();
      this.camera.aspect = width / height;
      this.camera.far = 100000;
      // this.camera.position.y = -10;
      this.camera.position.z = 400;
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
      // this.subScene.add(this.dummyCam);
      
      this.camControls = new OrbitControls(this.camera, this.renderer.domElement);
      this.camControls.enablePan = true;
      this.camControls.enableRotate = false;
      this.camControls.minDistance = 120;
      this.camControls.maxDistance = 1000;
      this.camControls.zoomSpeed = 0.25;

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

      const now = Date.now();
      const dt = now - this.lastFrameDate || 0;
      this.clouds.rotation.y += dt * -0.00001;
      this.lastFrameDate = now;

      // this.camControls.update();

      // this is another piece of the attempt at using TrackballControlls to
      // rotate only the sphere, this will be removed
      // this.sphereControls.update();
      // this.sphere.rotation.x = -this.dummyCam.rotation.z;
      // this.sphere.rotation.y = -this.dummyCam.rotation.y;
      // this.sphere.rotation.z = -this.dummyCam.rotation.z;

      if (this.pointerDown) {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
          for (let i = 0; i < intersects.length; ++i) {
            if (intersects[i].object.uuid == this.sphere.uuid) {
              // console.log(intersects[i]);
              this.pointerDisplay.material.opacity = 1;
              // const { x, y, z } = intersects[i].point;
              const newPosition = intersects[i].point;
              const [ x, y, z ] = newPosition.toArray();
              // const newPosition = new Vector3().fromArray(this.filter.process([x, y, z]));
              // const newPosition = new Vector3().fromArray([x, y, z]);

              if (this.firstPointerDown) {
                //this.dragStarted(newPosition);
                this.firstPointerDown = false;
                this.firstPointerPosition = newPosition;
                this.lastPointerPosition = newPosition;
              } else {
                //this.dragged(newPosition);
                if (newPosition.distanceTo(this.lastPointerPosition) > 0)
                {
                  const axis = new Vector3().crossVectors(
                    this.lastPointerPosition,
                    newPosition
                  ).normalize();

                  const angle = newPosition.angleTo(this.lastPointerPosition);

                  // this.lineMesh.geometry.setFromPoints([
                  //   new Vector3().copy(axis).multiplyScalar(200),
                  //   new Vector3().copy(axis).multiplyScalar(-200),
                  // ]);

                  const q = new Quaternion();
                  q.setFromAxisAngle(axis, angle);

                  q.multiply(this.sphere.quaternion);
                  this.sphere.setRotationFromQuaternion(q);
                }
              }

              this.lastPointerPosition = newPosition;
              this.pointerDisplay.position.set(x, y, z);
              break;
            }
          }
        } else {
          this.pointerDisplay.material.opacity = 0;
        }
      } else {
        this.pointerDisplay.material.opacity = 0;
      }
      // this.helper.update();
      this.renderer.render(this.scene, this.camera);
    },
    dragStarted(newPosition) {
      // this.lastPointerPosition = newPosition;
      // this.v0 = newPosition; // versor.cartesian(projection.invert(d3.mouse(this)));
      // this.r0 = [0,0,0] // ?? // projection.rotate();
      // this.q0 = versor(this.r0);
    },
    dragged(newPosition) {
      // const v1 = newPosition, // versor.cartesian(projection.rotate(r0).invert(d3.mouse(this))),
      //       q1 = versor.multiply(this.q0, versor.delta(this.v0, v1)),
      //       r1 = versor.rotation(q1);
      //       this.r0 = versor.rotation(q1);
      // // projection.rotate(r1);
      // const q = new Quaternion(-q1[2], q1[1], q1[3], q1[0]);
      // this.sphere.setRotationFromQuaternion(q);
      // console.log(q);
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