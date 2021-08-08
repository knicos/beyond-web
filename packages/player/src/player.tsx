import * as THREE from 'three';
import {FTLStream} from '@ftl/stream';
import {FTLMSE} from './mse';

class FTLFrameset {
	id: number;
	sources = {};

    constructor(id: number) {
        this.id = id;
    }
}

export class FTLPlayer {
    current = "";
    current_fs = 0;
    current_source = 0;
    current_channel = 0;
    framesets = {};
    handlers = {};
    outer: HTMLElement;
    element: HTMLVideoElement;
    camera: THREE.Camera;
    scene: THREE.Scene;
    mesh: THREE.Mesh;
    renderer: THREE.WebGLRenderer;
    mse: FTLMSE;
    lastRender = 0;
    fps = 30;

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
        this.mse.select(0, 0, 0);

        const width = element.clientWidth;
        const height = element.clientHeight;

        if (false) {
            this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1100 );
        } else {
            this.camera = new THREE.OrthographicCamera(width/-2, width/2, height/2, height/-2, 1, 4);
        }
        //this.camera.target = new THREE.Vector3( 0, 0, 0 );
    
        this.scene = new THREE.Scene();

        let geometry: any;
	
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

        this.scene.add( this.mesh );

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( width, height );
        this.outer.appendChild( this.renderer.domElement );

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

    play() {
        this.element.play();
    }

    push(spkt, pkt) {
        this.mse.push(spkt, pkt);
    }

	//this.elements_ = {};
	//this.converters_ = {};

	//const element = document.getElementById('ftlab-stream-video');
	
	//this.player = videojs('ftl-video-element');
	//this.player.vr({projection: '360'});

	/*this.isUserInteracting = false;
	this.onPointerDownPointerX = 0;
	this.onPointerDownPointerY = 0;
	this.onPointerDownLon = 0;
	this.onPointerDownLat = 0;
	this.lon = 0;
	this.lat = 0;
	this.distance = 2.0;*/

	/*this.overlay = document.createElement("DIV");
	this.overlay.classList.add("ftl");
	this.overlay.classList.add("overlay");
	this.overlay.setAttribute("tabindex","0");
	this.outer.appendChild(this.overlay);

	this.overlay.addEventListener('mousedown', (event) => {
		event.preventDefault();

		this.isUserInteracting = true;

		this.onPointerDownPointerX = event.clientX;
		this.onPointerDownPointerY = event.clientY;

		this.onPointerDownLon = this.lon;
		this.onPointerDownLat = this.lat;
	});

	this.overlay.addEventListener('mousemove', (event) => {
		if ( this.isUserInteracting === true ) {
			//this.lon = ( this.onPointerDownPointerX - event.clientX ) * 0.1 + this.onPointerDownLon;
			//this.lat = ( this.onPointerDownPointerY - event.clientY ) * 0.1 + this.onPointerDownLat;

			this.rotationX += event.movementY * (1/25) * 5.0;
			this.rotationY -= event.movementX * (1/25) * 5.0;
			this.updatePose();
		}
	});

	this.overlay.addEventListener('mouseup', (event) => {
		this.isUserInteracting = false;
	});

	this.overlay.addEventListener('wheel', (event) => {
		event.preventDefault();
		this.distance += event.deltaY * 0.05;
		this.distance = THREE.MathUtils.clamp( this.distance, 1, 50 );
	});*/

	/*this.overlay.addEventListener('keydown', (event) => {
		console.log(event);
		switch(event.code) {
		case "KeyW"		: this.translateZ += 0.05; this.updatePose(); break;
		case "KeyS"		: this.translateZ -= 0.05; this.updatePose(); break;
		case "KeyA"		: this.translateX -= 0.05; this.updatePose(); break;
		case "KeyD"		: this.translateX += 0.05; this.updatePose(); break;
		}
	});*/

	/*this.rotationX = 0;
	this.rotationY = 0;
	this.rotationZ = 0;
	this.translateX = 0;
	this.translateY = 0;
	this.translateZ = 0;*/

    /*let rxcount = 0;

	this.mse = new FTLMSE(this.element);

    this.peer.bind(uri, (latency, streampckg, pckg) => {
		if (this.paused || !this.active) {
			return;
		}

		if (pckg[0] == 33) {
			this.mse.push(streampckg, pckg);
        } else if(pckg[0] === 2){  // H264 packet.
			let id = "id-"+streampckg[1]+"-"+streampckg[2]+"-"+streampckg[3];

			if (this.current == id) {
				rxcount++;
				if (rxcount >= 25) {
					rxcount = 0;
					peer.send(uri, 0, [1,0,255,0],[255,7,35,0,0,Buffer.alloc(0)]);
					//peer.send(current_data.uri, 0, [255,7,35,0,0,Buffer.alloc(0)], [1,0,255,0]);
				}

				this.mse.push(streampckg, pckg);
			}
        } else if (pckg[0] === 103) {
			//console.log(msgpack.decode(pckg[5]));
		}
	});
	
	//this.start();
	if (this.peer.status == 2) {
		this.start(0,0,0);
	} else {
		this.peer.on("connect", (p)=> {
			this.start(0,0,0);
		});
	}*/
}

/*FTLStream.prototype.on = function(name, cb) {
	if (!this.handlers.hasOwnProperty(name)) {
		this.handlers[name] = [];
	}
	this.handlers[name].push(cb);
}

FTLStream.prototype.notify = function (name, ...args) {
	if (this.handlers.hasOwnProperty(name)) {
		let a = this.handlers[name];
		for (let i=0; i<a.length; ++i) {
			a[i].apply(this, args);
		}
	}
}

FTLStream.prototype.pause = function() {
	this.paused = !this.paused;
	if (!this.paused) {
		this.start(0,0,0);
		this.element.play();
	} else {
		this.element.pause();
	}
}

FTLStream.prototype.updatePose = function() {
	let poseRX = rematrix.rotateX(this.rotationX);
	let poseRY = rematrix.rotateY(this.rotationY);
	let poseRZ = rematrix.rotateZ(this.rotationZ);
	let poseT = rematrix.translate3d(this.translateX, this.translateY, this.translateZ);
	let pose = [poseT,poseRX,poseRY,poseRZ].reduce(rematrix.multiply);
	this.setPose(pose);
}

FTLStream.prototype.setPose = function(pose) {
	if (pose.length != 16) {
		console.error("Invalid pose");
		return;
	}
	this.peer.send(this.uri, 0, [1, this.current_fs, this.current_source, 66],
		[103, 7, 1, 0, 0, msgpack.encode(pose)]);
}

FTLStream.prototype.start = function(fs, source, channel) {
	let id = "id-"+fs+"-"+source+"-"+channel;
	this.current = id;
	this.current_fs = fs;
	this.current_source = source;
	this.current_channel = channel;

	this.mse.select(fs, source, channel);

	if (this.found) {
		this.peer.send(this.uri, 0, [1,fs,255,channel],[255,7,35,0,0,Buffer.alloc(0)]);
	} else {
		this.peer.rpc("find_stream", (res) => {
			this.found = true;
			this.peer.send(this.uri, 0, [1,fs,255,channel],[255,7,35,0,0,Buffer.alloc(0)]);
		}, this.uri);
	}
}*/