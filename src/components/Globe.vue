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

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { ArcballControls } from "three/examples/jsm/controls/ArcballControls";
import ThreeGlobe from 'three-globe';
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
    init() {
      const container = this.$refs.glview;
      const { clientWidth: width, clientHeight: height } = container;

      this.pointer = new Vector2(-1, -1);
      this.pointerDown = false;
      this.firstPointerDown = false;
      this.raycaster = new Raycaster();
      this.filter = new Filter(3);
      this.filter.setAlpha(0.95);
      this.lastPointerPosition = new Vector3(0,0,0);
      this.v0 = [0,0,0];    // Mouse position in Cartesian coordinates at start of drag gesture.
      this.r0 = [0,0,0];    // Projection rotation as Euler angles at start.
      this.q0 = [0,0,0,0];  // Projection rotation as versor at start.

      const pointerGeo = new SphereGeometry(6, 6, 6);
      const pointerMat = new MeshBasicMaterial({ transparent: true, color: '#f00' });
      this.pointerDisplay = new Mesh(pointerGeo, pointerMat);

      const lineMat = new LineBasicMaterial( { color: 0x0000ff } );
      const linePts = [];
      linePts.push(new Vector3(0,0,0));
      linePts.push(new Vector3(0,0,0));
      const lineGeo = new BufferGeometry().setFromPoints(linePts);
      this.lineMesh = new Line(lineGeo, lineMat);

      container.addEventListener('pointermove', e => {
        const { pointerType, pressure } = e;
        this.pointer.x = e.offsetX / width * 2 - 1;
        this.pointer.y = -e.offsetY / height * 2 + 1;
        // console.log(this.pointer);
      });

      container.addEventListener('pointerdown', e => {
        this.pointerDisplay.material.color.setHex(0xff0000);
        this.pointerDown = true;
        this.firstPointerDown = true;
      });

      container.addEventListener('pointerup', e => {
        this.pointerDisplay.material.color.setHex(0x00ff00);
        this.pointerDown = false;
      });

      this.renderer = new WebGLRenderer({ antialias: true });
      // this.renderer.setClearColor('#000');
      this.renderer.setClearColor('white');
      this.renderer.setSize(width, height);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = PCFSoftShadowMap;
      // this.renderer.shadowMap.renderSingleSided = false;

      // THE THREE-GLOBE ! /////////////////////////////////////////////////////

      const N = 20;

      const arcsData = [...Array(N).keys()].map(() => ({
        startLat: (Math.random() - 0.5) * 180,
        startLng: (Math.random() - 0.5) * 360,
        endLat: (Math.random() - 0.5) * 180,
        endLng: (Math.random() - 0.5) * 360,
        color: ['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)]
      }));

      this.myGlobe = new ThreeGlobe()
        .globeImageUrl('src/assets/textures/lroc_color_poles_1k.jpg')
        .showAtmosphere(false)
        // .globeImageUrl('src/assets/textures/mercurymap.jpg')
        // .bumpImageUrl('src/assets/textures/mercurybump.jpg')
        // .globeImageUrl('src/assets/textures/venusmap.jpg')
        // .bumpImageUrl('src/assets/textures/venusbump.jpg')
        // .globeImageUrl('src/assets/textures/mars_1k_color.jpg')
        // .bumpImageUrl('src/assets/textures/mars_1k_topo.jpg')
        // .globeImageUrl('src/assets/textures/jupitermap.jpg');
        // .globeImageUrl('src/assets/textures/neptunemap.jpg');
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

      this.scene.add(this.pointerDisplay);
      this.scene.add(this.lineMesh);

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

      light.position.set(0, 1000, 0);
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
      this.shadowMesh.position.y = 0.001 - 150;  // so we're above the ground slightly
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

      const sphereTexture = new TextureLoader().load(
        'src/assets/textures/lroc_color_poles_1k.jpg'
        // 'src/assets/textures/planetpixelemporium/earthmap1k.jpg'
      );
      const sphereBump = new TextureLoader().load(
        'src/assets/textures/planetpixelemporium/earthbump1k.jpg'
      );
      const sphereGeometry = new SphereGeometry(99, 30, 30);
      const sphereMaterial = new MeshPhongMaterial({
        map: sphereTexture,
        // bumpMap: sphereBump,
        // bumpScale: 0.15,
        side: FrontSide,
        color: '#fff',
        wireframe: false
      });
      this.sphere = new Mesh(sphereGeometry, sphereMaterial);
      this.sphere.castShadow = true;
      this.sphere.receiveShadow = true;
      this.scene.add(this.sphere);

      const planeGeometry = new PlaneGeometry(1500, 1500, 10);
      const planeMaterial = new MeshStandardMaterial({ side: DoubleSide, color: 'transparent', wireframe: false });
      const plane = new Mesh(planeGeometry, planeMaterial);
      // plane.castShadow = true; 
      // plane.receiveShadow = true;
      plane.position.set(0, -200, 0);
      plane.rotateX(Math.PI * 0.5);
      // this.scene.add(plane);

      // CAMERAS ///////////////////////////////////////////////////////////////

      this.camera = new PerspectiveCamera();
      this.camera.aspect = width / height;
      this.camera.far = 100000;
      this.camera.position.y = -30;
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

      if (this.pointerDown) {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
          for (let i = 0; i < intersects.length; ++i) {
            if (intersects[i].object.uuid == this.sphere.uuid) {
              // console.log(intersects[i]);
              this.pointerDisplay.material.opacity = 1;
              const { x, y, z } = intersects[i].point;
              // const newPosition = new Vector3().fromArray(this.filter.process([x, y, z]));
              const newPosition = new Vector3().fromArray([x, y, z]);

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
                    // this.firstPointerPosition,
                    this.lastPointerPosition,
                    newPosition
                  ).normalize();

                  // const angle = newPosition.angleTo(this.firstPointerPosition);
                  // const angle = newPosition.angleTo(this.lastPointerPosition);
                  const angle = this.lastPointerPosition.angleTo(newPosition);

                  // this.lineMesh.geometry.setFromPoints([
                  //   new Vector3().copy(axis).multiplyScalar(200),
                  //   new Vector3().copy(axis).multiplyScalar(-200),
                  // ]);

                  const q = new Quaternion();
                  q.setFromAxisAngle(axis, angle);

                  // q.multiply(this.sphere.quaternion);
                  // this.sphere.setRotationFromQuaternion(q);
                  this.sphere.quaternion.multiply(q);
                }
              }

              this.lastPointerPosition = newPosition;
              this.pointerDisplay.position.set(x, y, z);
              // this.pointerDisplay.position.x = newPosition.x;
              // this.pointerDisplay.position.y = newPosition.y;
              // this.pointerDisplay.position.z = newPosition.z;
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
      this.v0 = newPosition; // versor.cartesian(projection.invert(d3.mouse(this)));
      // this.r0 = [0,0,0] // ?? // projection.rotate();
      this.q0 = versor(this.r0);
    },
    dragged(newPosition) {
      const v1 = newPosition, // versor.cartesian(projection.rotate(r0).invert(d3.mouse(this))),
            q1 = versor.multiply(this.q0, versor.delta(this.v0, v1)),
            r1 = versor.rotation(q1);
            this.r0 = versor.rotation(q1);
      // projection.rotate(r1);
      const q = new Quaternion(-q1[2], q1[1], q1[3], q1[0]);
      this.sphere.setRotationFromQuaternion(q);
      console.log(q);
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