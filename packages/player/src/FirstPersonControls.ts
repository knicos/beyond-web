import THREE, {
	MathUtils,
	Spherical,
	Vector3
} from 'three';

const _lookDirection = new Vector3();
const _spherical = new Spherical();
const _target = new Vector3();

class FirstPersonControls {

  domElement: HTMLElement;
  object: any;
  enabled: boolean;
  movementSpeed = 1.0;
	lookSpeed = 0.005;

	lookVertical = true;
	autoForward = false;

	activeLook = true;

	heightSpeed = false;
	heightCoef = 1.0;
	heightMin = 0.0;
  heightMax = 1.0;

	constrainVertical = false;
	verticalMin = 0;
	verticalMax = Math.PI;

	mouseDragOn = false;

	// internals

	autoSpeedFactor = 0.0;

	mouseX = 0;
	mouseY = 0;

	moveForward = false;
	moveBackward = false;
	moveLeft = false;
	moveRight = false;
  moveUp = false;
  moveDown = false;

	viewHalfX = 0;
	viewHalfY = 0;

  dispose: () => void;

  private lat = 0;
  private lon = 0;

	constructor( object, domElement: HTMLElement ) {

		if ( domElement === undefined ) {

			console.warn( 'THREE.FirstPersonControls: The second parameter "domElement" is now mandatory.' );
			//domElement = document;

		}

		this.object = object;
		this.domElement = domElement;

		// API

		this.enabled = true;

		//

		this.update();

		this.dispose = function () {

			this.domElement.removeEventListener( 'contextmenu', contextmenu );
			this.domElement.removeEventListener( 'mousedown', _onMouseDown );
			this.domElement.removeEventListener( 'mousemove', _onMouseMove );
			this.domElement.removeEventListener( 'mouseup', _onMouseUp );

			window.removeEventListener( 'keydown', _onKeyDown );
			window.removeEventListener( 'keyup', _onKeyUp );

		};

		const _onMouseMove = this.onMouseMove.bind( this );
		const _onMouseDown = this.onMouseDown.bind( this );
		const _onMouseUp = this.onMouseUp.bind( this );
		const _onKeyDown = this.onKeyDown.bind( this );
		const _onKeyUp = this.onKeyUp.bind( this );

		this.domElement.addEventListener( 'contextmenu', contextmenu );
		this.domElement.addEventListener( 'mousemove', _onMouseMove );
		this.domElement.addEventListener( 'mousedown', _onMouseDown );
		this.domElement.addEventListener( 'mouseup', _onMouseUp );

		window.addEventListener( 'keydown', _onKeyDown );
		window.addEventListener( 'keyup', _onKeyUp );

		this.handleResize();

		this.setOrientation( this );

	}

  private setOrientation( controls ) {

    const quaternion = controls.object.quaternion;

    _lookDirection.set( 0, 0, - 1 ).applyQuaternion( quaternion );
    _spherical.setFromVector3( _lookDirection );

    this.lat = 90 - MathUtils.radToDeg( _spherical.phi );
    this.lon = MathUtils.radToDeg( _spherical.theta );

  }

  handleResize() {
    this.viewHalfX = this.domElement.offsetWidth / 2;
     this.viewHalfY = this.domElement.offsetHeight / 2;
  };

  onMouseDown( event ) {
    if ( this.activeLook ) {

      switch ( event.button ) {

        case 0: this.moveForward = true; break;
        case 2: this.moveBackward = true; break;

      }

    }

    this.mouseDragOn = true;

  };

  onMouseUp( event ) {

    if ( this.activeLook ) {

      switch ( event.button ) {

        case 0: this.moveForward = false; break;
        case 2: this.moveBackward = false; break;

      }

    }

    this.mouseDragOn = false;

  };

  onMouseMove( event ) {
    this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
    this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;
  };

  onKeyDown( event ) {

    switch ( event.code ) {

      case 'ArrowUp':
      case 'KeyW': this.moveForward = true; break;

      case 'ArrowLeft':
      case 'KeyA': this.moveLeft = true; break;

      case 'ArrowDown':
      case 'KeyS': this.moveBackward = true; break;

      case 'ArrowRight':
      case 'KeyD': this.moveRight = true; break;

      case 'KeyR': this.moveUp = true; break;
      case 'KeyF': this.moveDown = true; break;

    }

  };

  onKeyUp( event ) {

    switch ( event.code ) {

      case 'ArrowUp':
      case 'KeyW': this.moveForward = false; break;

      case 'ArrowLeft':
      case 'KeyA': this.moveLeft = false; break;

      case 'ArrowDown':
      case 'KeyS': this.moveBackward = false; break;

      case 'ArrowRight':
      case 'KeyD': this.moveRight = false; break;

      case 'KeyR': this.moveUp = false; break;
      case 'KeyF': this.moveDown = false; break;

    }
  };

  lookAt( x, y, z ) {

    if ( x.isVector3 ) {

      _target.copy( x );

    } else {

      _target.set( x, y, z );

    }

    this.object.lookAt( _target );

    this.setOrientation( this );

    return this;

  };

  update() {

    const targetPosition = new Vector3();

    return function update( delta ) {

      if ( this.enabled === false ) return;

      if ( this.heightSpeed ) {

        const y = MathUtils.clamp( this.object.position.y, this.heightMin, this.heightMax );
        const heightDelta = y - this.heightMin;

        this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

      } else {

        this.autoSpeedFactor = 0.0;

      }

      const actualMoveSpeed = delta * this.movementSpeed;

      if ( this.moveForward || ( this.autoForward && ! this.moveBackward ) ) this.object.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
      if ( this.moveBackward ) this.object.translateZ( actualMoveSpeed );

      if ( this.moveLeft ) this.object.translateX( - actualMoveSpeed );
      if ( this.moveRight ) this.object.translateX( actualMoveSpeed );

      if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
      if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );

      let actualLookSpeed = delta * this.lookSpeed;

      if ( ! this.activeLook ) {

        actualLookSpeed = 0;

      }

      let verticalLookRatio = 1;

      if ( this.constrainVertical ) {

        verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );

      }

      this.lon -= this.mouseX * actualLookSpeed;
      if ( this.lookVertical ) this.lat -= this.mouseY * actualLookSpeed * verticalLookRatio;

      this.lat = Math.max( - 85, Math.min( 85, this.lat ) );

      let phi = MathUtils.degToRad( 90 - this.lat );
      const theta = MathUtils.degToRad( this.lon );

      if ( this.constrainVertical ) {

        phi = MathUtils.mapLinear( phi, 0, Math.PI, this.verticalMin, this.verticalMax );

      }

      const position = this.object.position;

      targetPosition.setFromSphericalCoords( 1, phi, theta ).add( position );

      this.object.lookAt( targetPosition );

    };

  };

}

function contextmenu( event ) {

	event.preventDefault();

}

export { FirstPersonControls };
