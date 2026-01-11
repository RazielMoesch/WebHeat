import { mat4 } from "gl-matrix";



class CameraControls {


    constructor() {

        this.leftLastDown = { x:0, y:0 };
        this.rightLastDown = {x:0, y:0};
        this.rotation = {x: 0, y: 0};
        this.pan = {x: 0, y: 0};
        this.distance = 1;
        this.leftDragging = false;
        this.rightDragging = false;


        this.mvp = mat4.create();

        this.getMVP();

    }

    rightDown(x, y) {
        this.rightDragging = true;
        this.rightLastDown = { x: x, y: y};
    }

    rightMove(x, y) {
        if (this.rightDragging = false) return;

        const dx = x - this.rightLastDown.x;
        const dy = y - this.rightLastDown.y;

        this.pan.x += dx * this.distance * 0.001;
        this.pan.y += dy * this.distance * 0.001;

        this.rightLastDown = {x, y};

    }

    rightUp() {
        this.rightDragging = false;
    }

    leftDown(x, y) {
        this.leftDragging = true;
        this.leftLastDown = { x: x, y: y };


    }

    leftUp() {
        this.leftDragging = false;
    }

    

    leftMove(x, y) {
        if (this.leftDragging === false) return;


        const dx = x - this.leftLastDown.x; 
        const dy = y - this.leftLastDown.y;


        this.rotation.x += dx * 0.075;
        this.rotation.y -= dy * 0.075; 

        const limit = Math.PI / 2 - 0.01;
        if (this.rotation.y > limit) this.rotation.y = limit;
        if (this.rotation.y < -limit) this.rotation.y = -limit;

        this.leftLastDown = { x, y };
    }

    zoom(delta) {

        this.distance += delta * 0.05;
        this.distance = Math.max(0.1, this.distance);

    }

    getMVP(w, h) {

        const proj = mat4.create();
        const view = mat4.create();
        const eye = [
            this.distance * Math.sin(this.rotation.x) * Math.cos(this.rotation.y),
            this.distance * Math.sin(this.rotation.y),
            this.distance * Math.cos(this.rotation.x) * Math.cos(this.rotation.y),
        ];

        mat4.perspective(proj, Math.PI/4, w/h, 1e-3, 1e5);
        mat4.lookAt(view, eye, [this.pan.x, this.pan.y, 0], [0, 1, 0]);
        mat4.multiply(this.mvp, proj, view);

        return this.mvp;
    }

}

export default CameraControls;