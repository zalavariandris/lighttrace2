import React, {useState} from "react"
import createREGL from "regl"
import {mat4} from 'gl-matrix'
import GLLightpathRenderer from "../GLLightpathRenderer2.js"
import { raytrace, SamplingMethod, raytracePass, sampleLight } from "../raytracer/raytrace.js";

import Shape from "../scene/shapes/Shape.js";
import Light from "../scene/lights/Light.js"

import displayOptionsStore from "../stores/displayOptionsStore.js"
import _ from "lodash";


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

function Wave(min, max, speed=1.0)
{
    const sec = Date.now()*0.001*speed
    const val = (Math.sin(sec)/2.0+0.5)*(max-min)+min;
    return val;
    return Math.sin(Date.now()*speed)/2.0+0.5*(max-min)+min;
}

const glctx = {
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
}

function drawLines(regl, {points, colors}={})
{
    const draw = regl({
        ...glctx,
        // viewport: {x: 0, y: 0, w: 512, h: 512},
        uniforms: {
            view: mat4.identity([]),
            projection: mat4.ortho(mat4.identity([]), 0,512,0,512,-1,1) //left, right, bottom, top, near, far
        },
        attributes: {
            position: points,
            color: colors,
        },
        count: points.length+1,
        primitive: "line strip",

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
        void main ()
        {
            gl_FragColor = vec4(vColor.rgb,1);
        }`,
    });
    draw();
}

function drawTextureToScreen(regl, {texture, screenWidth, screenHeight}){
    regl({
        viewport: {x: 0, y: 0, width: screenWidth, height: screenHeight},
        depth: { enable: false },
        primitive: "triangle fan",
        attributes: {
        position: [
            [ 0, 0],
            [ 1, 0],
            [ 1, 1],
            [ 0, 1]
        ],
        uv:[
            [ 0, 0],
            [ 1, 0],
            [ 1, 1],
            [ 0, 1]
            ]
        },
        count: 6,
        uniforms:{
            texture: texture,
            projection: mat4.ortho(mat4.identity([]), 0,1,0,1,-1,1),
            iResolution: [screenWidth, screenHeight, 0],
        },
        vert: `
            precision mediump float;
            uniform mat4 projection;
            attribute vec2 position;
            attribute vec2 uv;
            varying vec2 vUV;
            void main() {
                vUV = uv;
                gl_Position = projection * vec4(position, 0, 1);
            }`,
        frag: `precision mediump float;
            uniform vec3 iResolution; // viewport resolution in pixels
            uniform sampler2D texture;

            vec4 mainImage(vec2 fragCoord)
            {
                vec2 UV = fragCoord/iResolution.xy;

                vec3 tex = texture2D(texture, UV).rgb;
                return vec4(tex.rgb, 1.0);
            }
            
            void main()
            {
                gl_FragColor = mainImage(gl_FragCoord.xy);
            }`
    })();
}

function drawSDFToFBO(regl, {targetFbo, mouse, width, height})
{
    const circleData = new Float32Array([
        Wave(0, width), 500.0, 100.0, Wave(0, height, 1.66)
    ]);
    regl({
        framebuffer: targetFbo,
        viewport: {x: 0, y: 0, width: width, height: height},
        depth: { enable: false },
        primitive: "triangle fan",
        attributes: {
            position: [
                [ 0, 0],
                [ 1, 0],
                [ 1, 1],
                [ 0, 1]
            ],
            uv:[
                [ 0, 0],
                [ 1, 0],
                [ 1, 1],
                [ 0, 1]
                ]
        },
        count: 6,
        uniforms:{
            projection: mat4.ortho(mat4.identity([]), 0,1,0,1,-1,1),
            iResolution: [width, height, 0],
            iMouse: [mouse.x, mouse.y,0,0],
            circleData: circleData,
        },
        vert: `
            precision mediump float;
            uniform mat4 projection;
            attribute vec2 position;
            attribute vec2 uv;
            varying vec2 vUV;
            void main() {
                vUV = uv;
                gl_Position = projection * vec4(position, 0, 1);
            }`,
        frag: `precision mediump float;

            #define e 2.71828
            #define PI 3.14159

            uniform vec3 iResolution; // viewport resolution in pixels
            uniform float iTime; // shade plazback time (in seconds)
            uniform float iTimeDelta; // render time (in seconds)
            uniform float iFrameRate; // shader frme rate
            uniform int iFrame; // shader plazback frame
            uniform vec4 iMouse; // mouse pixel coords. xy: current(if MLB down) zw: click
            uniform vec4 iDate; // (year, month, day, time in seconds)
            varying vec2 vUV;

            // Declare the uniform block to store circle data
            uniform vec2 circleData[2];

            float cosh(float x) {
                return (exp(x) + exp(-x)) / 2.0;
            }
            
            float sinh(float x) {
                return (exp(x) - exp(-x)) / 2.0;
            }

            float tanh(float x) {
                return (exp(x) - exp(-x)) / (exp(x) + exp(-x));
            }

            float atanh(float x) {
                return 0.5 * log((1.0 + x) / (1.0 - x));
            }

            vec2 translate(vec2 samplePosition, vec2 offset){
                return samplePosition - offset;
            }

            float rectangle(vec2 samplePosition, vec2 halfSize){
                vec2 componentWiseEdgeDistance = abs(samplePosition) - halfSize;
                float outsideDistance = length(max(componentWiseEdgeDistance, 0.0));
                float insideDistance = min(max(componentWiseEdgeDistance.x, componentWiseEdgeDistance.y), 0.0);
                return outsideDistance + insideDistance;
            }


            float circle(vec2 samplePosition, float radius){
                return length(samplePosition)-radius;
            }

            vec2 rotate(vec2 samplePosition, float angle_in_degrees){
                float angle_in_radians = angle_in_degrees/180.0 * PI * -1.0;
                float sine = sin(angle_in_radians);
                float cosine = cos(angle_in_radians);
                return vec2(cosine * samplePosition.x + sine * samplePosition.y, cosine * samplePosition.y - sine * samplePosition.x);
            }

            float intersectSDF(float A, float B)
            {
                return max(A, B);
            }

            float unionSDF(float A, float B)
            {
                return min(A, B); 
            }

            float scene(vec2 coord)
            {
                // collect all circles
                float sceneDistance = 9999.0;
                // for(int i=0; i<2; i++){
                //     vec2 center = circleData[i];
                //     float circleDistance = circle(translate(coord, vec2(center.x, center.y)), 55.0);
                //     sceneDistance = unionSDF(sceneDistance, circleDistance);
                // }
                
                // add mouse circle
                float mouseCircleDistance = circle(translate(coord, vec2(iMouse.x,iResolution.y-iMouse.y)), 55.0);
                sceneDistance = unionSDF(sceneDistance, mouseCircleDistance);

                // collect all rectangles
                float rectangleDistance = rectangle(rotate(translate(coord, vec2(iMouse.x,iResolution.y-iMouse.y+0.0)), iMouse.x/iResolution.x*180.0), vec2(50.0,50.0));
                sceneDistance = unionSDF(sceneDistance, rectangleDistance);
                
                return sceneDistance; 
            }

            vec4 mainImage(vec2 fragCoord)
            {
                float d = scene(fragCoord)/max(iResolution.x, iResolution.y);
                float c = smoothstep(0.0, 0.0, d*1.0);
                return vec4(d,d,d, 1.0);
            }
            
            void main()
            {
                gl_FragColor = mainImage(gl_FragCoord.xy);
            }`
    })();
};

function renderNormalsToTexture(regl, {signedDistanceFieldTexture, targetFbo, width, height}){
    regl({
        framebuffer: targetFbo,
        viewport: {x: 0, y: 0, width: width, height: height},
        depth: { enable: false },
        primitive: "triangle fan",
        attributes: {
            position: [
                [ 0, 0],
                [ 1, 0],
                [ 1, 1],
                [ 0, 1]
            ],
            uv:[
                [ 0, 0],
                [ 1, 0],
                [ 1, 1],
                [ 0, 1]
                ]
        },
        count: 6,
        uniforms: {
            sdf: signedDistanceFieldTexture,
            projection: mat4.ortho(mat4.identity([]), 0,1,0,1,-1,1),
            iResolution: [width, height, 0],
        },
        vert: `
            precision mediump float;
            uniform mat4 projection;
            attribute vec2 position;
            attribute vec2 uv;
            varying vec2 vUV;
            void main() {
                vUV = uv;
                gl_Position = projection * vec4(position, 0, 1);
            }`,
        frag: `precision mediump float;

        #define e 2.71828
        #define PI 3.14159
        uniform sampler2D sdf;

        vec4 mainImage(vec2 fragCoord)
        {
            return vec4(1.0,0.0,1.0, 1.0);
        }

        void main()
        {
            gl_FragColor = mainImage(gl_FragCoord.xy);
        }`
    })();
}

class GLRenderer{
    constructor()
    {
        this.mouse = {x: 0, y: 0};
    }

    initGL(regl, {width, height})
    {
        console.log("initGL", width, height)
        regl.clear({color: [0.1,.1,.1,1]});

        this.sdfTexture = regl.texture({
            width: width, 
            height: height,
            wrap: 'clamp',
            format: "rgba",
            type: "float"
        });

        this.sdfFbo = regl.framebuffer({
            color: this.sdfTexture,
            depth: false
        });

        this.normalTexture = regl.texture({
            width: width, 
            height: height,
            wrap: 'clamp',
            format: "rgba",
            type: "float"
        });

        this.normalFbo = regl.framebuffer({
            color: this.normalTexture,
            depth: false
        });
    }

    resizeGL(regl, {width, height})
    {
        this.sdfFbo.resize(width, height);
        this.normalFbo.resize(width, height);
        console.log("resizeGL", width, height);
    }

    renderGL(regl, {width, height})
    {


        regl.clear({color: [0.0,0.1,0.1,1]})


        
        
        

        drawSDFToFBO(regl, {
            targetFbo: this.sdfFbo,
            mouse: this.mouse,
            width, height
        });

        renderNormalsToTexture(regl, {
            signedDistanceFieldTexture: this.sdfTexture, 
            targetFbo: this.normalFbo, 
            width, 
            height
        });
        
        drawTextureToScreen(regl, {
            texture: this.sdfTexture, 
            screenWidth: width, 
            screenHeight: height
        });
    }
}

function GLViewport({
    viewBox,
    scene,
    style,
    ...props
}={})
{
    // render callbacks
    
    const canvasRef = React.useRef(null);
    const reglRef = React.useRef(null);
    const renderer = React.useRef(null);

    const displayOptions = React.useSyncExternalStore(displayOptionsStore.subscribe, displayOptionsStore.getSnapshot);
    // component did mount (kinda...)
    React.useEffect(()=>{
        // // Crate REGL context
        const [canvaswidth, canvasheight] = [canvasRef.current.offsetWidth, canvasRef.current.offsetHeight]
        canvasRef.current.width = canvaswidth;
        canvasRef.current.height = canvasheight;
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
        renderer.current = new GLRenderer();    
        renderer.current.initGL(reglRef.current, {width: canvaswidth, height:canvasheight});

        // render on resize
        const handleResize = (event)=>{
            console.log("resize canvas: ", canvasRef.current)
            const [canvaswidth, canvasheight] = [canvasRef.current.offsetWidth, canvasRef.current.offsetHeight]
            canvasRef.current.width=canvaswidth;
            canvasRef.current.height=canvasheight;
            
            renderer.current.resizeGL(reglRef.current, {width:canvaswidth, height: canvasheight});
        }

        function handleMouseMove(){
            renderer.current.mouse = {x: event.clientX, y: event.clientY};
        }
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("resize", handleResize);
        function animate()
        {
            window.requestAnimationFrame(animate);
            const width =  canvasRef.current.width;
            const height = canvasRef.current.height;
            renderer.current.renderGL(reglRef.current, {width, height});

        }
        animate()
        return ()=>{
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove)
        }
    }, []);

    React.useEffect( ()=>{
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;
        renderer.current.renderGL(reglRef.current, {width, height});
    }, [scene, viewBox]);


    const h = React.createElement

    return h("canvas", {
        ref:canvasRef,
        style: {
            ...style
        },
        ...props
    });
}

export default GLViewport;