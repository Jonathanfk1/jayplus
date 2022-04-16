import {Mesh, Scene, ShadowGenerator, TransformNode, UniversalCamera} from "@babylonjs/core"
import {Vector3} from "@babylonjs/core/Maths/math.vector"

export class Player extends TransformNode {
    public camera: UniversalCamera
    public scene: Scene
    private _input

    //Player
    public mesh: Mesh //outer collisionbox of player
    private _camRoot: TransformNode
    private _yTilt: TransformNode
    private _moveDirection: Vector3
    private _h: number
    private _v: any
    private _inputAmt: number

    //const values
    private static readonly PLAYER_SPEED: number = 0.45
    private static readonly JUMP_FORCE: number = 0.80
    private static readonly GRAVITY: number = -2.8
    private static readonly DASH_FACTOR: number = 2.5
    private static readonly DASH_TIME: number = 10 //how many frames the dash lasts
    private static readonly DOWN_TILT: Vector3 = new Vector3(0.8290313946973066, 0, 0)
    private static readonly ORIGINAL_TILT: Vector3 = new Vector3(0.5934119456780721, 0, 0)
    public dashTime = 0

    constructor(assets: any, scene: Scene, shadowGenerator: ShadowGenerator, input?: any) {
        super("player", scene)
        this.scene = scene


        this.mesh = assets.mesh
        this.mesh.parent = this

        shadowGenerator.addShadowCaster(assets.mesh) //the player mesh will cast shadows

        this._input = input //inputs we will get from inputController.ts

        this._setupPlayerCamera()
    }

    private _setupPlayerCamera(): UniversalCamera {
        //root camera parent that handles positioning of the camera to follow the player
        this._camRoot = new TransformNode("root")
        this._camRoot.position = new Vector3(0, 0, 0) //initialized at (0,0,0)
        //to face the player from behind (180 degrees)
        this._camRoot.rotation = new Vector3(0, Math.PI, 0)

        //rotations along the x-axis (up/down tilting)
        const yTilt = new TransformNode("ytilt")
        //adjustments to camera view to point down at our player
        yTilt.rotation = Player.ORIGINAL_TILT
        this._yTilt = yTilt
        yTilt.parent = this._camRoot

        //our actual camera that's pointing at our root's position
        this.camera = new UniversalCamera("cam", new Vector3(0, 0, -30), this.scene)
        this.camera.lockedTarget = this._camRoot.position
        this.camera.fov = 0.47350045992678597
        this.camera.parent = yTilt

        this.scene.activeCamera = this.camera

        return this.camera
    }

    public activatePlayerCamera(): UniversalCamera {
        this.scene.registerBeforeRender(() => {

            this._beforeRenderUpdate()
            this._updateCamera()

        })
        return this.camera
    }

    //--GAME UPDATES--
    private _beforeRenderUpdate(): void {
        this._updateFromControls()
        this.mesh.moveWithCollisions(this._moveDirection)
        // this._updateGroundDetection();
        // this._animatePlayer();
    }

    private _updateCamera(): void {
        const centerPlayer = this.mesh.position.y + 2
        this._camRoot.position = Vector3.Lerp(this._camRoot.position, new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z), 0.4)
    }

    private _updateFromControls(): void {
        this._moveDirection = Vector3.Zero() // vector that holds movement information
        this._h = this._input.horizontal //x-axis
        this._v = this._input.vertical //z-axis

        //--MOVEMENTS BASED ON CAMERA (as it rotates)--
        const fwd = this._camRoot.forward
        const right = this._camRoot.right
        const correctedVertical = fwd.scaleInPlace(this._v)
        const correctedHorizontal = right.scaleInPlace(this._h)

//movement based off of camera's view
        const move = correctedHorizontal.addInPlace(correctedVertical)

        //clear y so that the character doesnt fly up, normalize for next step
        this._moveDirection = new Vector3((move).normalize().x, 0, (move).normalize().z)

        //clamp the input value so that diagonal movement isn't twice as fast
        const inputMag = Math.abs(this._h) + Math.abs(this._v)
        if (inputMag < 0)
            this._inputAmt = 0
         else if (inputMag > 1)
            this._inputAmt = 1
         else
            this._inputAmt = inputMag

        //final movement that takes into consideration the inputs
        this._moveDirection = this._moveDirection.scaleInPlace(this._inputAmt * Player.PLAYER_SPEED)

    }

}
