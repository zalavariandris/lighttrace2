import React, {useState} from "react"
import createREGL from "regl"
import {mat4} from 'gl-matrix'
import GLLightpathRenderer from "../GLLightpathRenderer2.js"
import { raytrace, SamplingMethod, raytracePass, sampleLight } from "../raytracer/raytrace.js";

import Shape from "../scene/shapes/Shape.js";
import Light from "../scene/lights/Light.js"
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
        viewport: {x: 0, y: 0, w: 512, h: 512},
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

function drawQuad(regl, {texture})
{

}

class GLRenderer{
    constructor()
    {

    }

    initGL(regl)
    {
        console.log("initGL")
        regl.clear({color: [0,.1,.1,1]});

        this.sceneTexture = regl.texture({
            width: 512,
            height: 512,
            wrap: 'clamp',
            format: "rgba",
            type: "float"
        });

        this.setupQuad = regl({
            viewport: {x: 0, y: 0, w: 1, h: 1},
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
                projection: mat4.ortho(mat4.identity([]), 0,1,0,1,-1,1)
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

            frag: `
                precision mediump float;
                varying vec2 vUV;
                uniform sampler2D texture;
            
                void main() {
                    vec4 tex = texture2D(texture, vUV).rgba;
                    gl_FragColor = vec4(tex.r, tex.g, tex.b, 1.0);
                }`
        });
    }

    renderGL(regl)
    {
        console.log("renderGL")

        this.setupQuad({}, ()=>{
            regl({
                framebuffer: this.compFbo,
                uniforms: {
                    texture: this.sceneTexture
                },
                frag: `precision mediump float;
                varying vec2 vUV;
                
                vec2 translate(vec2 samplePosition, vec2 offset){
                    return samplePosition - offset;
                }

                float rectangle(vec2 samplePosition, vec2 halfSize){
                    vec2 componentWiseEdgeDistance = abs(samplePosition) - halfSize;
                    float outsideDistance = length(max(componentWiseEdgeDistance, 0.0));
                    float insideDistance = min(max(componentWiseEdgeDistance.x, componentWiseEdgeDistance.y), 0.0);
                    return 0.0;

                    // 
                    // return outsideDistance + insideDistance;
                }

                vec2 rotate(vec2 samplePosition, float rotation){
                    const float PI = 3.14159;
                    float angle = rotation * PI * 2.0 * -1.0;
                    float sine = sin(angle);
                    float cosine = cos(angle);
                    return vec2(cosine * samplePosition.x + sine * samplePosition.y, cosine * samplePosition.y - sine * samplePosition.x);
                }

                float circle(vec2 samplePosition, float radius){
                    return (length(samplePosition)>radius)?1.0:0.0;
                }

                float scene(vec2 coord)
                {
                    float sceneDistance = circle(translate(coord, vec2(50,50)), 10.0);
                    return sceneDistance; 
                }
                
                void main() {
                    float d = scene(gl_FragCoord.xy);
                    gl_FragColor = vec4(d,d,d, 1.0);
                }`
            })()
        });

    }

    resizeGL(regl, {width, height})
    {
        console.log("resizeGL", width, height);
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
    const renderer = React.useRef(null);




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
        renderer.current = new GLRenderer();    
        renderer.current.initGL(reglRef.current);
        // reglRef.current = createREGL(canvasRef.current);


        // onGLRender(reglRef.current)
        // console.assert(reglRef.current!=undefined, "cant create REGL context")

        // // INITIAL
        renderer.current.resizeGL(reglRef.current, {
            width: canvasRef.current.offsetWidth, 
            height: canvasRef.current.offsetHeight
        });

        // onGLRender(reglRef.current);

        
        // const [canvaswidth, canvasheight] = [canvasRef.current.offsetWidth, canvasRef.current.offsetHeight]
        // canvasRef.current.width=canvaswidth;
        // canvasRef.current.height=canvasheight;

        // render on resize
        const resizeHandler = (event)=>{
            const [canvaswidth, canvasheight] = [canvasRef.current.offsetWidth, canvasRef.current.offsetHeight]
            canvasRef.current.width=canvaswidth;
            canvasRef.current.height=canvasheight;

            renderer.current.resizeGL(reglRef.current, {width:canvaswidth, height: canvasheight});
        }
        
        if(resizeHandlerRef.current){
            window.removeEventListener("resize", resizeHandlerRef.current);
        }
        window.addEventListener("resize", resizeHandler);
        resizeHandlerRef.current = resizeHandler;
    }, []);

    React.useEffect( ()=>{
        renderer.current.renderGL(reglRef.current);
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