
// import createREGL from "https://cdnjs.cloudflare.com/ajax/libs/regl/2.1.0/regl.js"
// extract object creators
import {point, circle, segment} from "https://unpkg.com/@flatten-js/core?module";

/*
Flatten JS
*/
// make some construction
let s1 = segment(10,10,200,200);
let s2 = segment(10,160,200,30);
let c = circle(point(200, 110), 50);
let ip = s1.intersect(s2);

/*
Flatten to D3js
*/

/*
reGL
*/
const regl = createREGL(document.getElementById("regl"))
console.log("COMPILED")



function intersect_circle(ray, circle){

}

function intersect_rectangle(ray, rectangle){

}

const drawRectangle = function({cx=0.0, cy=0.0, w=0.5,h=0.5,color=[1,1,1,1]}={}){
    const draw = regl({
        // In a draw call, we can pass the shader source code to regl
        frag: `
        precision mediump float;
        uniform vec4 color;

        uniform float time;
        void main () {
            gl_FragColor = color;
        }`,

        vert: `
        precision mediump float;
        attribute vec2 position;
        void main () {
            gl_Position = vec4(position, 0, 1);
        }`,

        uniforms: {
            color: color
        },

        attributes:{
            position:(ctx)=>{
                return [[-w/2, +h/2], [+w/2, +h/2], [+w/2, -h/2], [-w/2, -h/2]]
            }
        },
        elements:[[2, 1, 0], [2, 0, 3]],
    })
    draw();
}

const drawCircle = function({cx=0.0, cy=0.0, r=0.5, segs=64,color=[1,1,1,1]}={}){
    let positions = [[0,0]]
    for(let i=0;i<segs;i++){
        const a = i/segs*Math.PI*2;
        const [x, y] = [Math.cos(a), Math.sin(a)];
        positions.push([x*r,y*r])
    }
    positions.push([r,0])

    // positions = [[-0.5, +0.5], [+0.5, +0.5], [+0.5, -0.5], [-0.5, -0.5]]

    const draw = regl({
        // In a draw call, we can pass the shader source code to regl
        frag: `
        precision mediump float;
        uniform vec4 color;

        uniform float time;
        void main () {
            gl_FragColor = color;
        }`,

        vert: `
        precision mediump float;
        attribute vec2 position;
        void main () {
            gl_Position = vec4(position, 0, 1);
        }`,

        uniforms: {
            color: color
        },

        attributes:{
            position: positions
        },
        count:positions.length-0,
        primitive: 'triangle fan',
    })
    draw();
}

function drawRays(){

}

regl.frame(() => {
    regl.clear({
        depth: 1,
        color: [0.1, 0.1, 0, 1]
    })

    drawRectangle({w:0.5, h:0.5, color: [0.8,0.2,0.2,1.0]})
    drawCircle({r:0.5, color: [0.0,0.1,0.2,1.0]})
})