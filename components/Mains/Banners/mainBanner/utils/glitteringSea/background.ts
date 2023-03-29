export const backGround = () => {
  "use strict";

  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  if (!canvas || !canvas.getContext) {
    return false;
  }

  /********************
      Random Number
    ********************/

  function rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  /********************
      Var
    ********************/

  const ctx = canvas.getContext("2d")!;
  let X = (canvas.width = window.innerWidth);
  let Y = (canvas.height = window.innerHeight);
  let mouseX: number | null = null;
  let mouseY: number | null = null;
  const shapeNum = 300;
  const shapes: Shape[] = [];
  const style = {
    black: "black",
    white: "white",
    lineWidth: 4,
  };

  /********************
      Animation
    ********************/

  window.requestAnimationFrame =
    window.requestAnimationFrame ||
    function (cb) {
      setTimeout(cb, 17);
    };

  /********************
      Shape
    ********************/

  class Shape {
    ctx: CanvasRenderingContext2D;
    x: number;
    y: number;
    r: number;
    ga: number;
    v: { x: number; y: number };
    l: number;
    sl: number;

    constructor(ctx: CanvasRenderingContext2D, x: number, y: number) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.r = rand(10, 25);
        this.ga = Math.random() * Math.random() * Math.random() * Math.random();
        this.v = {
          x: Math.random(),
          y: -1,
        };
        this.l = rand(0, 20);
        this.sl = this.l;
      }

    init(x: number, y: number): void {
      this.x = x;
      this.y = y;
      this.r = rand(10, 25);
      this.ga = Math.random() * Math.random() * Math.random() * Math.random();
      this.v = {
        x: Math.random(),
        y: -1,
      };
      this.l = rand(0, 20);
      this.sl = this.l;
    }

    updateParams(): void {
      const ratio = this.l / this.sl;
      //this.r *= ratio;
      this.l -= 1;
      if (this.l < 0) {
        this.init((X * (Math.random() + Math.random())) / 2, rand(0, Y));
      }
    }

    updatePosition(): void {
      this.x += Math.random();
      this.y += -Math.random();
    }

    draw(): void {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = this.ga;
      ctx.fillStyle = 'rgb(123, 252, 100)';
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.restore();
    }

    render(i: number): void {
      this.updatePosition();
      this.updateParams();
      this.draw();
    }
  }

  for (let i = 0; i < shapeNum; i++) {
    const s = new Shape(
      ctx,
      (X * (Math.random() + Math.random())) / 2,
      rand(0, Y)
    );
    shapes.push(s);
  }
  function render() {
    ctx.clearRect(0, 0, X, Y);
    for (var i = 0; i < shapes.length; i++) {
      shapes[i].render(i);
    }
    requestAnimationFrame(render);
  }

  render();

  /********************
        Event
        ********************/

  function onResize() {
    X = canvas.width = window.innerWidth;
    Y = canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", function () {
    onResize();
  });

  window.addEventListener(
    "mousemove",
    function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    },
    false
  );
};
