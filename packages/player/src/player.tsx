import * as THREE from 'three';
import {FTLMSE} from './mse';
import ee, {Emitter} from 'event-emitter';
import {createCircleTexture} from './texture';
import * as rematrix from 'rematrix';

const MAX_POINTS = 100;

class FTLFrameset {
	id: number;
	sources = {};

    constructor(id: number) {
        this.id = id;
    }
}

export interface FTLPlayer extends Emitter {};

export class FTLPlayer {
    framesets = {};
    handlers = {};
    private outer: HTMLElement;
    private element: HTMLVideoElement;
    private camera: THREE.OrthographicCamera;
    private scene: THREE.Scene;
    private mesh: THREE.Mesh;
    private renderer: THREE.WebGLRenderer;
    private mse: FTLMSE;
    private lastRender = 0;
    fps = 30;
    videoWidth = 0;
    videoHeight = 0;
    frameWidth = 0;
    frameHeight = 0;
    enableZoom = false;
    enableSelection = true;
    enableMovement = false;
    private cameraObject = {
      translateX: 0,
      translateY: 0,
      translateZ: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
    };
    private pose: rematrix.Matrix3D;
    private isUserInteracting = false;
    private onPointerDownPointerX = 0;
    private onPointerDownPointerY = 0;
    private onPointerDownLon = 0;
    private onPointerDownLat = 0;

    private pointsBuffer: THREE.BufferGeometry;

    constructor(element: HTMLElement) {
        this.outer = element;
        this.outer.classList.add("ftl");
        this.outer.classList.add("container");
        this.element = document.createElement("VIDEO") as HTMLVideoElement;
        this.element.setAttribute("width", "640");
        this.element.setAttribute("height", "360");
        this.element.setAttribute("controls", "true");
        this.element.style.display = "none";
        this.element.classList.add("ftl");
        this.element.id = "ftl-video-element";
        this.outer.appendChild(this.element);

        this.mse = new FTLMSE(this.element);
        this.mse.reset();
        this.mse.on('reset', () => {
          this.emit('reset');
        });

        const width = element.clientWidth;
        const height = width * (9 / 16);

        if (false) {
            //this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1100 );
        } else {
            this.camera = new THREE.OrthographicCamera(width/-2, width/2, height/2, height/-2, 1, 4);
        }
        //this.camera.target = new THREE.Vector3( 0, 0, 0 );

        window.addEventListener('resize', () => {
            const width = element.clientWidth;
            const height = width * (9 / 16);
            this.renderer.setSize( width, height );
        });
    
        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( width, height );
        this.outer.appendChild( this.renderer.domElement );
        this.renderer.domElement.setAttribute('tabindex', '-1');
        this.renderer.domElement.style.outline = 'none';

        this.renderer.domElement.addEventListener('click', e => {
          this.renderer.domElement.focus();
          if (this.enableSelection) {
            const target = e.target as any;
            const width = target.clientWidth;
            const height = target.clientHeight;
            const offX = ((this.frameWidth - this.videoWidth) / this.frameWidth * width) / 2.0;
            const offY = ((this.frameHeight - this.videoHeight) / this.frameHeight * height) / 2.0;
            const x = Math.max(0, Math.min(1, (e.offsetX - offX) / (width - 2 * offX)));
            const y = Math.max(0, Math.min(1, (e.offsetY - offY) / (height - 2 * offY)));
            this.emit('select', Math.floor(x * this.videoWidth), Math.floor(y * this.videoHeight));
          }
        });

        this.renderer.domElement.addEventListener('wheel', e => {
          if (this.enableZoom) {
            this.camera.zoom -= 0.01 * e.deltaY;
            this.camera.zoom = Math.max(0.2, Math.min(5, this.camera.zoom));
            this.camera.updateProjectionMatrix();
            e.preventDefault();
          }
        });

        this.renderer.domElement.addEventListener('mousedown', (event) => {
          if (this.enableMovement) {
            event.preventDefault();
            this.isUserInteracting = true;
            this.onPointerDownPointerX = event.clientX;
            this.onPointerDownPointerY = event.clientY;
            // this.onPointerDownLon = this.lon;
            // this.onPointerDownLat = this.lat;
          }
        });
      
        this.renderer.domElement.addEventListener('mousemove', (event) => {
          if ( this.isUserInteracting === true ) {
            //this.lon = ( this.onPointerDownPointerX - event.clientX ) * 0.1 + this.onPointerDownLon;
            //this.lat = ( this.onPointerDownPointerY - event.clientY ) * 0.1 + this.onPointerDownLat;
      
            this.cameraObject.rotationX += event.movementY * (1/25) * 5.0;
            this.cameraObject.rotationY -= event.movementX * (1/25) * 5.0;
            this.updatePose();
          }
        });
      
        this.renderer.domElement.addEventListener('mouseup', (event) => {
          this.isUserInteracting = false;
        });

        this.renderer.domElement.addEventListener('keydown', (event) => {
          if (this.enableMovement) {
            console.log(event);
            switch(event.code) {
            case "KeyW"		: this.cameraObject.translateZ += 0.05; this.updatePose(); break;
            case "KeyS"		: this.cameraObject.translateZ -= 0.05; this.updatePose(); break;
            case "KeyA"		: this.cameraObject.translateX -= 0.05; this.updatePose(); break;
            case "KeyD"		: this.cameraObject.translateX += 0.05; this.updatePose(); break;
            }
          }
        });

        this.pointsBuffer = new THREE.BufferGeometry();
        this.pointsBuffer.setDrawRange( 0, 0 );
        const positions = new Float32Array( MAX_POINTS * 3 );
        this.pointsBuffer.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
        const pointMaterial = new THREE.PointsMaterial({
            map: createCircleTexture(new THREE.Color(0xff0000)),
            size: 5,
            sizeAttenuation: false,
            depthTest: false,
            transparent: true,
        });
        const pointCloud = new THREE.Points(this.pointsBuffer, pointMaterial);
        this.scene.add(pointCloud);

        const update = () => {
            /*me.lat = Math.max( - 85, Math.min( 85, me.lat ) );
            let phi = THREE.MathUtils.degToRad( 90 - me.lat );
            let theta = THREE.MathUtils.degToRad( me.lon );*/

            const now = Date.now();
            if (now < this.lastRender + (1000 / this.fps)) {
                return;
            }

            this.lastRender = now;
    
            this.camera.position.x = 0;
            this.camera.position.y = 0;
            this.camera.position.z = -2;
    
            this.camera.lookAt(0, 0, 0);
    
            this.renderer.render( this.scene, this.camera );
        }
    
        function animate() {
            requestAnimationFrame( animate );
            update();
        }
    
        animate();
    }

    setPoints(points: [number, number][]) {
      const positions = this.pointsBuffer.attributes.position.array as number[];

      let ix = 0;
      for (const point of points) {
          positions[ix++] = -(-this.videoWidth / 2 + point[0]);
          positions[ix++] = this.videoHeight / 2 - point[1];
          positions[ix++] = -1;
      }

      this.pointsBuffer.attributes.position.needsUpdate = true;   
      this.pointsBuffer.setDrawRange( 0, points.length );
    }

    play() {
      this.element.play().catch(() => {
        console.error('Play stopped');
      });
    }

    pause() {
      this.element.pause();
    }

    paused(): boolean {
      return this.element.paused;
    }

    isActive() {
      return this.mse.isActive();
    }

    private updateVideoSize() {
      const width = this.element.videoWidth;
      const height = this.element.videoHeight;
      this.videoWidth = width;
      this.videoHeight = height;
      this.mesh.geometry = new THREE.PlaneGeometry(width, height, 32);
      this.mesh.geometry.scale( - 1, 1, 1 );

      const isWide = height / width <= 9 / 16;
      if (isWide) {
          const nWidth = width;
          const nHeight = width * (9 / 16);
          this.frameWidth = nWidth;
          this.frameHeight = nHeight;
          this.camera = new THREE.OrthographicCamera(nWidth/-2, nWidth/2, nHeight/2, nHeight/-2, 1, 4);
      } else {
          const nWidth = height * (16 / 9);
          const nHeight = height;
          this.frameWidth = nWidth;
          this.frameHeight = nHeight;
          this.camera = new THREE.OrthographicCamera(nWidth/-2, nWidth/2, nHeight/2, nHeight/-2, 1, 4);
      }
    }

    private createMesh() {
      let geometry: any;
      const width = this.element.videoWidth;
      const height = this.element.videoHeight;
      this.videoWidth = width;
      this.videoHeight = height;

      if (false) {
          geometry = new THREE.SphereBufferGeometry( 500, 60, 40 );
      } else {
          geometry = new THREE.PlaneGeometry(width, height, 32);
      }
      // invert the geometry on the x-axis so that all of the faces point inward
      geometry.scale( - 1, 1, 1 );

      const texture = new THREE.VideoTexture( this.element );
      const material = new THREE.MeshBasicMaterial( { map: texture } );

      this.mesh = new THREE.Mesh( geometry, material );

      const isWide = height / width <= 9 / 16;
      if (isWide) {
          const nWidth = width;
          const nHeight = width * (9 / 16);
          this.frameWidth = nWidth;
          this.frameHeight = nHeight;
          this.camera = new THREE.OrthographicCamera(nWidth/-2, nWidth/2, nHeight/2, nHeight/-2, 1, 4);
      } else {
          const nWidth = height * (16 / 9);
          const nHeight = height;
          this.frameWidth = nWidth;
          this.frameHeight = nHeight;
          this.camera = new THREE.OrthographicCamera(nWidth/-2, nWidth/2, nHeight/2, nHeight/-2, 1, 4);
      }

      this.scene.add( this.mesh );
    }

    push(spkt, pkt) {
        if (this.paused()) {
            return;
        }
        this.mse.push(spkt, pkt);

        // Video resolution has changed?
        if (this.mesh && this.videoWidth !== this.element.videoWidth) {
            this.updateVideoSize();
        }

        // Has the mesh object being created yet?
        if (!this.mesh && this.element.videoWidth) {
            this.createMesh();
        }
    }

    reset() {
      this.mse.reset();
    }

    hardReset() {
      this.mse.hardReset();
    }

    setPose(pose: rematrix.Matrix3D) {
      this.pose = pose;
    }

    updatePose() {
      // update to rotation
      let poseRX = rematrix.rotateX(this.cameraObject.rotationX);
      let poseRY = rematrix.rotateY(this.cameraObject.rotationY);
      let poseRZ = rematrix.rotateZ(this.cameraObject.rotationZ);
      let poseR = [poseRX, poseRY, poseRZ].reduce(rematrix.multiply);

      // update to translation
      let poseT = rematrix.translate3d(this.cameraObject.translateX, this.cameraObject.translateY, this.cameraObject.translateZ);
      
      // apply and update
      this.pose = [this.pose, poseT, poseR].reduce(rematrix.multiply);

      this.cameraObject.rotationX = 0;
      this.cameraObject.rotationY = 0;
      this.cameraObject.rotationZ = 0;
      this.cameraObject.translateX = 0;
      this.cameraObject.translateY = 0;
      this.cameraObject.translateZ = 0;

      this.emit('pose', this.pose);
    }
}

ee(FTLPlayer.prototype);
