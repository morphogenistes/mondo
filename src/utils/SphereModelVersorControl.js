import { EventEmitter } from 'events';
import { Vector2, Vector3, Raycaster } from 'three';

class SphereModelVersorControl extends EventEmitter {

  // INITIALIZATION ////////////////////////////////////////////////////////////
  
  constructor(container, scene, camera, sphere) {
    super();

    this.container = container;
    const { clientWidth: width, clientHeight: height } = this.container;
    this.width = width;
    this.height = height;

    this.scene = scene;
    this.camera = camera;
    this.sphere = sphere;

    this.pointer = new Vector2(-1, -1);
    this.pointerDown = false;
    // this.firstPointerDown = false;
    this.startedDragging = false;
    this.raycaster = new Raycaster();
    // this.filter = new Filter(3);
    // this.filter.setAlpha(0.95);
    this.lastPointerPosition = new Vector3(0,0,0);

    this.friction = 0; // 0 : no friction, 1 : infinite friction


    // this.registerEventListeners();
    this.container.addEventListener('pointermove', this.onPointerMove);
    this.container.addEventListener('pointerdown', this.onPointerDown);
    this.container.addEventListener('pointerUp', this.onPointerUp);
  }

  // registerEventListeners() {
  //   container.addEventListener('pointermove', e => {
  //     this.onPointerMove(e);
  //   });

  //   container.addEventListener('pointerdown', e => {
  //     this.onPointerDown(e);
  //   });

  //   container.addEventListener('pointerup', e => {
  //     this.onPointerUp(e);
  //   });
  // }

  // EVENT LISTENERS ///////////////////////////////////////////////////////////

  onPointerMove(e) {
    const { pointerType, pressure } = e;
    this.pointer.x = e.offsetX / this.width * 2 - 1;
    this.pointer.y = -e.offsetY / this.height * 2 + 1;
    
    if (this.pointerIsDown) {
      let newPosition = null;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);
      
      for (let i = 0; i < intersects.length; ++i) {
        if (intersects[i].object.uuid == this.sphere.uuid) {
          // WE ARE OVER THE SPHERE
          newPosition = intersects[i].point;
          break;
        }
      }

      if (newPosition !== null) {
        // newPosition is a Vector3, do the regular drag stuff
      } else {
        // we must determine if we let the inertia roll
        // or if we use a vector perpendicular to z, with an angle determined
        // by the polar coordinates on x,y and a norm of the sphere's radius
        // we could this.emit('leave', clippedVector);
      }

      if (!this.startedDragging) {
        this.startedDragging = true;
      }  
    }
  }

  onPointerDown(e) {
    // this.pointerDisplay.material.color.setHex(0xff0000);
    this.pointerIsDown = true;
    this.startedDragging = false;
  }

  onPointerUp(e) {
    // this.pointerDisplay.material.color.setHex(0x00ff00);
    this.pointerIsDown = false;
    this.startedDragging = false;
  }

  // UPDATE LOGIC //////////////////////////////////////////////////////////////

  update() {

  }
};

export default SphereModelVersorControl;