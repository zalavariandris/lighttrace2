import React, {useState} from "react"
import createREGL from "regl"
import {mat4} from 'gl-matrix'

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


function fitViewboxInSize(viewBox, size)
{
    // adjust viewbox width to match resolution aspect "contain"
    let size_aspect = size.width/size.height;
    let view_aspect = viewBox.w/viewBox.h;
    let newViewBox = viewBox;
    if(size_aspect > view_aspect)
    {
        const new_view_width = viewBox.h * size_aspect;
        newViewBox = {
            x: viewBox.x+(viewBox.w-new_view_width)/2,
            w: new_view_width,
            y: viewBox.y,
            h: viewBox.h
        }
    }
    else
    {
        const new_view_height = viewBox.w / size_aspect;
        newViewBox = {
            x: viewBox.x,
            w: viewBox.w,
            y: viewBox.y+(viewBox.h-new_view_height)/2,
            h: new_view_height
        }
    }

    return newViewBox
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

function makeProjectionFromViewbox(viewBox)
{
    const projection = mat4.identity([]);
    mat4.ortho(projection, viewBox.x, viewBox.x+viewBox.w, viewBox.y+viewBox.h, viewBox.y, -1,1) //left, right, bottom, top, near, far
    return projection;
}

class GLRenderer{
    constructor(regl)
    {
        this.initGL(regl)
    }

    initGL(regl)
    {
        this.tick = 0;
        // create fbos
        this.sceneTexture = regl.texture({
            width: 1,
            height: 1,
            wrap: 'clamp',
            format: "rgba",
            type: "float"
        });

        this.sceneFbo = regl.framebuffer({
            color: this.sceneTexture,
            depth: false
        });

        this.bufferTexture = regl.texture({
            width: 1,
            height: 1,
            wrap: 'clamp',
            format: "rgba",
            type: "float"
        });
        this.bufferFbo = regl.framebuffer({
            color: this.bufferTexture,
            depth: false
        });

        this.compTexture = regl.texture({
            width: 1,
            height: 1,
            wrap: 'clamp',
            format: "rgba",
            type: "float"
        });
        this.compFbo = regl.framebuffer({
            color: this.compTexture,
            depth: false
        });

        this.toneTexture = regl.texture({
            width: 1,
            height: 1,
            wrap: 'clamp',
            format: "rgba",
            type: "float"
        });

        this.toneFbo = regl.framebuffer({
            color: this.toneTexture,
            depth: false
        });

        this.samples = 0;

        // draw state setups
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

        this.setupScene = regl({
            viewport: {x: 0, y: 0, w: 512, h: 512},
            vert: `precision mediump float;
                attribute vec2 position;
                uniform mat4 projection;
                uniform mat4 view;
                uniform mat4 model;
                void main () {
                    gl_Position = projection * view * model * vec4(position, 0, 1);
                }`,

            frag: `precision mediump float;
                uniform vec4 color;
                void main () {
                    gl_FragColor = color;
                }`,
            uniforms: {
                view: mat4.identity([]),
                projection: mat4.ortho(mat4.identity([]), 0,512,0,512,-1,1) //left, right, bottom, top, near, far
            }
        });

        this.drawToFbo = regl({
            framebuffer: regl.prop("framebuffer")
        })
    }

    renderGL(regl, paths, viewBox, width, height)
    {
        const [canvaswidth, canvasheight] = [width, height]
        viewBox = fitViewboxInSize(viewBox, {width: canvaswidth, height: canvasheight})
        const projection = makeProjectionFromViewbox(viewBox)

        this.sceneFbo.resize(canvaswidth, canvasheight);
        this.bufferFbo.resize(canvaswidth, canvasheight);
        this.compFbo.resize(canvaswidth, canvasheight);
        this.toneFbo.resize(canvaswidth, canvasheight);

        // Draw Scene to fbo
        function makeAttributesFromPaths(paths)
        {
            const linesPoints = []
            const colors = []
            for(let path of paths)
            {
                const color = [path.intensity,path.intensity,path.intensity,1]
                for(let i=0; i<path.points.length-1; i++)
                {
                    const line = [
                        [path.points[i].x, path.points[i].y],
                        [path.points[i+1].x, path.points[i+1].y]
                    ]
                    linesPoints.push(line);
                }
            }
            return {positions: linesPoints.flat()};
        }
        const {positions} = makeAttributesFromPaths(paths);

        this.drawToFbo({framebuffer: this.sceneFbo}, ()=>{
            regl.clear({color: [0,0,0,0]});

            for(let lightpath of paths){
                const draw_lightpath = regl(({
                    viewport: {x: 0, y:0, width: canvaswidth, height: canvasheight},
                    vert: `
                    precision mediump float;
                    uniform mat4 projection;
                    attribute vec2 position;
                    
                    void main () {
                        gl_Position = projection * vec4(position, 0, 1);
                    }`,
    
                    frag: `
                    precision mediump float;
                    uniform vec4 color;
                    void main () {
                        gl_FragColor = vec4(color.r,color.g,color.b,color.a);
                    }`,
                    attributes: {
                        position: lightpath.points.map(point=>[point.x, point.y]).flat(),
                    },
            
                    uniforms: {
                        color: [1,1,1, lightpath.intensity],
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
            
                    count: lightpath.points.length,
                    primitive: "line strip"
                }));
                draw_lightpath()
            }
        });

        // comp fbo with previous buffer
        this.setupQuad({}, ()=>{
            regl({
                framebuffer: this.compFbo,
                uniforms: {
                    A: this.sceneTexture,
                    B: this.bufferTexture
                },
                frag: `precision mediump float;
                varying vec2 vUV;
                uniform sampler2D A;
                uniform sampler2D B;
            
                void main() {
                    vec4 texA = texture2D(A, vUV).rgba;
                    vec4 texB = texture2D(B, vUV).rgba;
                    gl_FragColor = vec4(texA.rgb+texB.rgb, 1.0);
                }`
            })()
        });
        this.samples+=1;

        // copy comp to buffer
        this.setupQuad({}, ()=>{
            regl({
                framebuffer: this.bufferFbo,
                uniforms: {
                    texture: this.compTexture
                },
                frag: `precision mediump float;
                varying vec2 vUV;
                uniform sampler2D texture;

                void main() {
                    vec4 tex = texture2D(texture, vUV).rgba;
                    gl_FragColor = vec4(tex.rgb, 1.0);
                }`
            })()
        });

        // tone down added light intensities
        this.setupQuad({}, ()=>{
            regl({
                framebuffer: this.toneFbo,
                uniforms: {
                    texture: this.compTexture,
                    exposure: 20/this.samples
                },

                frag: `
                precision mediump float;
                varying vec2 vUV;
                uniform sampler2D texture;
                uniform float exposure;
            
                vec3 filmic(vec3 x) {
                    vec3 X = max(vec3(0.0), x - 0.004);
                    vec3 result = (X * (6.2 * X + 0.5)) / (X * (6.2 * X + 1.7) + 0.06);
                    return pow(result, vec3(2.2));
                }

                void main() {
                    vec4 tex = texture2D(texture, vUV).rgba;
                    vec3 color = tex.rgb*exposure;
                    // color = filmic(color);
                    gl_FragColor = vec4(color, 1.0);
                }`
            })();
        });
        
        // render final comp to screen
        this.setupQuad({}, ()=>{
            regl.clear({color: [0,0,0,0]})
            regl({
                viewport: {x: 0, y:0, width: canvaswidth, height: canvasheight},
                framebuffer: null,
                uniforms: {
                    texture: this.toneTexture
                },
                frag: `precision mediump float;
                varying vec2 vUV;
                uniform sampler2D texture;
            
                void main() {
                    vec4 tex = texture2D(texture, vUV).rgba;
                    gl_FragColor = vec4(tex.rgb, 1.0);
                }`
            })();
        });
        this.tick+=1;
    }

    reset(regl)
    {
        this.samples = 0;
        this.drawToFbo({framebuffer: this.bufferFbo}, ()=>{
            regl.clear({color: [0,0,0,0]})
        })
    }
}


function GLViewport({
    viewBox,
    scene,
    paths,
    ...props
})
{
    const canvasRef = React.useRef(null);
    const reglRef = React.useRef(null);
    const rendererRef = React.useRef(null);
    const resizeHandlerRef = React.useRef(null);

    // component did mount (kinda...)
    React.useEffect(()=>{
        console.log("mount GLViewport")
        console.log("canvas size:", canvasRef.current.offsetWidth, canvasRef.current.offsetHeight)
        // Crate REGL context
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
        console.assert(reglRef.current!=undefined, "cant create REGL context")

        // INITIAL
        rendererRef.current = new GLRenderer(reglRef.current);
        rendererRef.current.renderGL(reglRef.current, paths, viewBox, canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
        
        const [canvaswidth, canvasheight] = [canvasRef.current.offsetWidth, canvasRef.current.offsetHeight]
        canvasRef.current.width=canvaswidth;
        canvasRef.current.height=canvasheight;
        // render on resize
        const resizeHandler = (event)=>{
            const [canvaswidth, canvasheight] = [canvasRef.current.offsetWidth, canvasRef.current.offsetHeight]
            canvasRef.current.width=canvaswidth;
            canvasRef.current.height=canvasheight;
            rendererRef.current.renderGL(reglRef.current, paths, viewBox, canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
        }
        
        if(resizeHandlerRef.current){
            window.removeEventListener("resize", resizeHandlerRef.current);
        }
        window.addEventListener("resize", resizeHandler);
        resizeHandlerRef.current = resizeHandler
    }, [])

    React.useEffect(()=>{
        rendererRef.current.reset(reglRef.current);
    },[scene, viewBox])

    if(reglRef.current && rendererRef.current)
    {
        rendererRef.current.renderGL(reglRef.current, paths, viewBox, canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
    }
    const h = React.createElement
    return h("canvas", {...props, ref:canvasRef})
}

export default GLViewport;