'use strict';

class Game {
    
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.frameCount = 0;
        this.delta = 0;
        this.deltaMin = 0;
        this.lastFrameTime = 0;
        this.playing = false;
        this.paused = false;
        this.totalTimePlaying = 0;

        window.addEventListener('resize', this._resizeCanvas.bind(this));
    }

    get currentTime() {
        return this.totalTimePlaying;
    }

    logTimePlaying() {
        this.totalTimePlaying += this.delta;
    }

    animate() {
        /*
         * Changing the tick property allows for rendering
         * of different scenes that can be defined as separate
         * functions in the main file
         */

        // Timing calculations
        const currentTime = performance.now();
        this.delta = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // Rendering
        this.tick(this);

        // Next frame
        this.deltaMin = performance.now() - this.lastFrameTime;
        this.frameCount++;
        requestAnimationFrame(this.animate.bind(this));
    }

    start() {
        this.init();
        this._resizeCanvas();
        this.animate();
    }

    _resizeCanvas() {
        const size = this.resizeCanvas();
        this.canvas.width = size.width;
        this.canvas.height = size.height;
        this.ctx = this.canvas.getContext('2d');
    }


    /* Override in main file */
    
    resizeCanvas() {} // -> { width, height }
    init() {}
    tick() {}

}
