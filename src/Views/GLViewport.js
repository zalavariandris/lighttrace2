import React, {useState} from "react"
import createREGL from "regl"
import {mat4} from 'gl-matrix'
import GLLightpathRenderer from "../GLLightpathRenderer2.js"
import { raytrace, SamplingMethod } from "../scene/raytrace.js";

import Shape from "../scene/shapes/Shape.js";
import Light from "../scene/lights/Light.js"

/* Utilities */
function makeCircle (N=36)
{
    return Array(N).fill().map((_, i) => {
        var phi = 2 * Math.PI * (i / N)
        return [Math.cos(phi), Math.sin(phi)]
    })
}

function makeQuad()
{
    return [
        [-1, -1],
        [ 1, -1],
        [ 1,  1],
        [-1,  1]
    ]
}

function makeTransform({position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]}={}){
    let model = mat4.fromTranslation(mat4.identity([]), [
        position[0], position[1], position[2]
    ])
    mat4.scale(model, model, [scale[0], scale[1], scale[2]]);
    return model;
}

function makeProjectionFromViewbox(viewBox)
{
    const projection = mat4.identity([]);
    mat4.ortho(projection, viewBox.x, viewBox.x+viewBox.w, viewBox.y+viewBox.h, viewBox.y, -1,1) //left, right, bottom, top, near, far
    return projection;
}

function matchProjectionToSVGViewbox(svg_viewbox, win)
{

    // Calculate the aspect ratio of the SVG viewbox and the window
    const svg_aspect_ratio = svg_viewbox.w / svg_viewbox.h;
    const win_aspect_ratio = win.width / win.height;

    // Define the orthographic projection matrix

    let projection = mat4.identity([]);   
    if (win_aspect_ratio > svg_aspect_ratio) {
        // If the window is wider than the SVG viewbox, scale the width to fit the window
        const scaled_width = svg_viewbox.h * win_aspect_ratio;
        const offset_x = (svg_viewbox.w - scaled_width) / 2.0;

        projection = mat4.ortho(projection, svg_viewbox.x - offset_x, svg_viewbox.x + scaled_width - offset_x, svg_viewbox.y, svg_viewbox.y + svg_viewbox.h, -1.0, 1.0) //left, right, bottom, top, near, far
        return projection
    } else {
        // If the window is taller than the SVG viewbox, scale the height to fit the window
        const scaled_height = svg_viewbox.w / win_aspect_ratio;

        const offset_y = (svg_viewbox.h - scaled_height) / 2.0;

        projection = mat4.ortho(projection, svg_viewbox.x, svg_viewbox.x + svg_viewbox.w, svg_viewbox.y - offset_y, svg_viewbox.y + scaled_height - offset_y, -1.0, 1.0, -1.0, 1.0) //left, right, bottom, top, near, far
        return projection
    }
}

function drawLines({regl, points, colors, viewport, projection}={})
{
    const draw = regl(({
        viewport: viewport,
        vert: `
        precision mediump float;
        uniform mat4 projection;
        attribute vec2 position;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main () {
            vColor = color;
            gl_Position = projection * vec4(position, 0, 1);
        }`,

        frag: `
        precision mediump float;
        uniform vec3 baseColor;
        varying vec3 vColor;
        void main () {
            float rasterizationBias = 1.0;
            gl_FragColor = vec4(vColor.rgb,1);
        }`,
        attributes: {
            position: points,
            color: colors,
        },

        uniforms: {
            baseColor: [1,1,1],
            projection: projection
        },

        blend: {
            enable: true,
            func: {
                srcRGB: 'src alpha',
                srcAlpha: 1,
                dstRGB: 'one minus src alpha',
                dstAlpha: 1
            },
            equation: {
                rgb: 'add',
                alpha: 'add'
            },
            color: [0, 0, 0, 0]
        },
        lineWidth:1,
        count: points.length+1,
        primitive: "line strip"
    }));
    draw();
}

// render callbacks
const onGLRender = (regl)=>{
    console.log("clear GL")
    regl.clear({color: [0,.1,.1,1]});
        
    
    // console.log("gl render");
}

const onGLResize = (regl)=>{
    console.log("gl resize");
}

function GLViewport({
    viewBox,
    scene,
    style, 
    onReset=()=>{},
    onDidRender=(sample)=>{},
    ...props
}={})
{
    const canvasRef = React.useRef(null);
    const reglRef = React.useRef(null);

    // const rendererRef = React.useRef(null);
    const resizeHandlerRef = React.useRef(null);

    // const lights = Object.values(scene).filter(obj=>obj instanceof Light);
    // const shapes = Object.values(scene).filter(obj=>obj instanceof Shape);
    // const newRaytraceResults = raytrace(lights, [shapes, shapes.map(shape=>shape.material)], {
    //     maxBounce: 9, 
    //     samplingMethod: SamplingMethod.Random,
    //     lightSamples: 9
    // });

    const positions = [0,0,20,20];
    const colors = [[0,0,1],[1,1,1]];



    // component did mount (kinda...)
    React.useEffect(()=>{
        // console.log("mount GLViewport")
        // console.log("canvas size:", canvasRef.current.offsetWidth, canvasRef.current.offsetHeight)
        // // Crate REGL context
        reglRef.current = createREGL({
            canvas: canvasRef.current,
            // pixelRatio: 2.0,
            attributes: {
                // width: 1024, heigh: 1024,
                alpha: true,
                depth: true,
                stencil :false,
                antialias: true,
                premultipliedAlpha: true,
                preserveDrawingBuffer: false,
                preferLowPowerToHighPerformance: false,
                failIfMajorPerformanceCaveat: false
            },
            extensions: ['OES_texture_float', "OES_texture_half_float"]
        });

        onGLRender(reglRef.current)
        // console.assert(reglRef.current!=undefined, "cant create REGL context")

        // // INITIAL
        // // rendererRef.current = new GLLightpathRenderer(reglRef.current);
        // // rendererRef.current.resizeGL(reglRef.current, {
        // //     width: canvasRef.current.offsetWidth, 
        // //     height: canvasRef.current.offsetHeight
        // // });

        // onGLRender(reglRef.current);

        
        // const [canvaswidth, canvasheight] = [canvasRef.current.offsetWidth, canvasRef.current.offsetHeight]
        // canvasRef.current.width=canvaswidth;
        // canvasRef.current.height=canvasheight;

        // // render on resize
        // const resizeHandler = (event)=>{
        //     const [canvaswidth, canvasheight] = [canvasRef.current.offsetWidth, canvasRef.current.offsetHeight]
        //     canvasRef.current.width=canvaswidth;
        //     canvasRef.current.height=canvasheight;

        //     onGLResize(reglRef.current);
        // }
        
        // if(resizeHandlerRef.current){
        //     window.removeEventListener("resize", resizeHandlerRef.current);
        // }
        // window.addEventListener("resize", resizeHandler);
        // resizeHandlerRef.current = resizeHandler
    }, []);

    React.useEffect( ()=>{
        onGLRender(reglRef.current);
    }, [scene, viewBox]);


    const h = React.createElement
    return h("canvas", {
        style: {
            ...style
        },
        ...props, 
        ref:canvasRef
    });
}

export default GLViewport;