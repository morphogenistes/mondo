import { EventEmitter } from 'events';
import { Vector2, Vector3, Quaternion, Raycaster } from 'three';

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
    this.pointerIsDown = false;
    this.pointerIsOver = false; // pointer can be down but lose focus
    this.raycaster = new Raycaster();
    // this.filter = new Filter(3);
    // this.filter.setAlpha(0.95);
    this.lastPointerPosition = new Vector3(0,0,0);
    this.lastDragDate = 0;
    this.lastUpdateDate = 0;
    this.axis = new Vector3(0,1,0);
    this.angle = 0;
    this.dt = 0;
    this.angularSpeed = 0;

    this.friction = 0.25; // 0 : no friction, 1 : infinite friction

    this.container.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.container.addEventListener('pointerup', this.onPointerUp.bind(this));
  }

  getPointerPosition(e) {
    // const { pointerType, pressure } = e;
    this.pointer.x = e.offsetX / this.width * 2 - 1;
    this.pointer.y = -e.offsetY / this.height * 2 + 1;

    let newPosition = null;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (let i = 0; i < intersects.length; ++i) {
      if (intersects[i].object.uuid === this.sphere.uuid) {
        return intersects[i].point;
      }
    }

    return null;
  }

  // SYNTHETIC EVENT LISTENERS /////////////////////////////////////////////////

  onStartDrag(newPosition) {
    this.lastDragDate = Date.now();
    this.lastPointerPosition = newPosition;
    this.angle = 0;
    this.dt = 0;
    this.emit('start', newPosition);
  }

  onDrag(newPosition) {
    if (newPosition.distanceTo(this.lastPointerPosition) > 0.001) {
      const now = Date.now();
      this.dt = (now - this.lastDragDate) * 0.001;
      this.lastDragDate = now;

      this.axis = new Vector3().crossVectors(
        this.lastPointerPosition,
        newPosition
      ).normalize();
  
      this.angle = this.lastPointerPosition.angleTo(newPosition);

      const q = new Quaternion().setFromAxisAngle(this.axis, this.angle);
      q.multiply(this.sphere.quaternion);
      this.sphere.setRotationFromQuaternion(q);
      this.lastPointerPosition = newPosition;
      this.emit('move', newPosition);
    }
  }

  onEndDrag(updateDate) {
    if (updateDate) {
      const now = Date.now();
      this.dt = (now - this.lastUpdateDate) * 0.001;
      this.lastUpdateDate = now;
    }
    this.angularSpeed = this.angle / this.dt; // we get the angular speed in rad.s-1
    this.emit('end');
  }

  // REAL EVENT LISTENERS //////////////////////////////////////////////////////

  onPointerMove(e) {
    const newPosition = this.getPointerPosition(e);

    if (newPosition !== null) {
      if (!this.pointerIsOver) {
        this.pointerIsOver = true;
        if (this.pointerIsDown) {
          this.onStartDrag(newPosition);
        }
      } else {
        if (this.pointerIsDown) {
          this.onDrag(newPosition);
        }
      }
    } else {
      if (this.pointerIsOver) {
        this.pointerIsOver = false;
        if (this.pointerIsDown) {
          // uncomment to allow inertia when hovering out
          this.onEndDrag(true);
        }
      }
    }
  }

  onPointerDown(e) {
    // use this to forbid more than 1 touch event
    // console.log(e.pointerId);
    this.pointerIsDown = true;
    const newPosition = this.getPointerPosition(e);

    if (newPosition !== null) {
      this.pointerIsOver = true;
      this.onStartDrag(newPosition);
    }
  }

  onPointerUp(e) {
    this.pointerIsDown = false;
    const newPosition = this.getPointerPosition(e);

    if (this.pointerIsOver) {
      this.onEndDrag(false);
    }
  }

  // UPDATE LOGIC //////////////////////////////////////////////////////////////

  update() {
    const now = Date.now();

    if (this.pointerIsDown && this.pointerIsOver) {
      // we're dragging, do nothing here
    } else {
      if (this.angularSpeed > 0.001) {
        this.dt = (now - this.lastUpdateDate) * 0.001;
        this.angularSpeed -= (this.angularSpeed * this.friction);
        const deltaAngle = this.angularSpeed * this.dt;
        const q = new Quaternion().setFromAxisAngle(this.axis, deltaAngle);
        q.multiply(this.sphere.quaternion);
        this.sphere.setRotationFromQuaternion(q);
      } else {
        this.angularSpeed = 0;
      }
    }

    this.lastUpdateDate = now;
  }
};

export default SphereModelVersorControl;