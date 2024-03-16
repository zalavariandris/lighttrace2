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

// map paths to gl line primitives
function makeLinesFromPaths(paths)
{
    let lines = []
    for(let path of paths)
    {
        for(let i=0; i<path.length-1; i++){
            lines.push([path[i].x, path[i].y]);
            lines.push([path[i+1].x, path[i+1].y]);
        }
    }
    return lines;
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
        // this.rendererRef.current.render({scene: this.props.scene, tick: this.tick});
        const lines = makeLinesFromPaths(paths);
        const [canvaswidth, canvasheight] = [width, height]
        viewBox = fitViewboxInSize(viewBox, {width: canvaswidth, height: canvasheight})
        const projection = makeProjectionFromViewbox(viewBox)


        // viewBox = {x:0,y:0,w:canvaswidth, h:canvasheight}
        // console.log("renderGL:", viewBox, {width: canvaswidth, height: canvasheight})
        // console.log(viewBox)
        this.sceneFbo.resize(canvaswidth, canvasheight);
        this.bufferFbo.resize(canvaswidth, canvasheight);
        this.compFbo.resize(canvaswidth, canvasheight);
        this.toneFbo.resize(canvaswidth, canvasheight);

        // draw scene to fbo
        this.drawToFbo({framebuffer: this.sceneFbo}, ()=>{
            regl.clear({color: [0,0,0,0]});
            const draw_lines = regl({
                // framebuffer: this.sceneFbo,
                viewport: {x: 0, y:0, width: canvaswidth, height: canvasheight},
                frag: `
                precision mediump float;
                uniform vec4 color;
                void main () {
                    gl_FragColor = color;
                }`,
        
                vert: `
                precision mediump float;
                attribute vec2 position;
                uniform mat4 projection;
                void main () {
                    gl_Position = projection * vec4(position, 0, 1);
                }`,
        
                attributes: {
                    position: lines
                },
        
                uniforms: {
                    color: [1, 1, .9, 1],
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
        
                count: lines.length*2,
                primitive: "lines"
            });
            draw_lines();
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
                    exposure: 1/this.samples
                },

                frag: `
                precision mediump float;
                varying vec2 vUV;
                uniform sampler2D texture;
                uniform float exposure;
            
                void main() {
                    vec4 tex = texture2D(texture, vUV).rgba;
                    gl_FragColor = vec4(tex.rgb*exposure, 1.0);
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

class GLViewportO extends React.Component
{
    // Set default props
    static defaultProps = {
        viewBox: {x:0, y:0, w:512, h:512},
        scene: {shapes: [], rays: [], paths: [], lights: []}
    }

    constructor(props)
    {
        super(props);
        this.canvasRef = React.createRef();
        this.reglRef = React.createRef();
        this.rendererRef = React.createRef();
    }

    componentDidMount()
    {
        console.log("mount GLViewport")
        console.log("canvas size:", this.canvasRef.current.offsetWidth, this.canvasRef.current.offsetHeight)
        // Crate REGL context
        this.reglRef.current = createREGL({
            canvas: this.canvasRef.current,
            // pixelRatio: 2.0,
            attributes: {
                // width: 1024, heigh: 1024,
                alpha: true,
                depth: false,
                stencil :false,
                antialias: false,
                premultipliedAlpha: true,
                preserveDrawingBuffer: false,
                preferLowPowerToHighPerformance: false,
                failIfMajorPerformanceCaveat: false
            },
            extensions: ['OES_texture_float', "OES_texture_half_float"]
        });
        console.assert(this.reglRef.current!=undefined, "cant create REGL context")

        // INITIAL
        this.rendererRef.current = new GLRenderer(this.reglRef.current);
        this.rendererRef.current.renderGL(this.reglRef.current, this.props.scene.paths, this.props.viewBox, this.canvasRef.current.offsetWidth, this.canvasRef.current.offsetHeight);

        // render on resize
        this.resizeHandler = (event)=>{
            const [canvaswidth, canvasheight] = [this.canvasRef.current.offsetWidth, this.canvasRef.current.offsetHeight]
            this.canvasRef.current.width=canvaswidth;
            this.canvasRef.current.height=canvasheight;

            
            this.rendererRef.current.renderGL(this.reglRef.current, this.props.scene.paths, this.props.viewBox, this.canvasRef.current.offsetWidth, this.canvasRef.current.offsetHeight);
        }
        window.addEventListener("resize", this.resizeHandler)
    }

    componentWillUnmount()
    {
        window.removeEventListener("resize", this.resizeHandler)
    }

    render()
    {
        if(this.reglRef.current && this.rendererRef.current)
        {
            this.rendererRef.current.renderGL(this.reglRef.current, this.props.scene.paths, this.props.viewBox, this.canvasRef.current.offsetWidth, this.canvasRef.current.offsetHeight);

        }
        const h = React.createElement
        return h("canvas", {...this.props, ref:this.canvasRef})
    }

}

function GLViewport(props)
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
        rendererRef.current.renderGL(reglRef.current, props.paths, props.viewBox, canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
        
        const [canvaswidth, canvasheight] = [canvasRef.current.offsetWidth, canvasRef.current.offsetHeight]
        canvasRef.current.width=canvaswidth;
        canvasRef.current.height=canvasheight;
        // render on resize
        const resizeHandler = (event)=>{
            const [canvaswidth, canvasheight] = [canvasRef.current.offsetWidth, canvasRef.current.offsetHeight]
            canvasRef.current.width=canvaswidth;
            canvasRef.current.height=canvasheight;
            rendererRef.current.renderGL(reglRef.current, props.paths, props.viewBox, canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
        }
        
        if(resizeHandlerRef.current){
            window.removeEventListener("resize", resizeHandlerRef.current);
        }
        window.addEventListener("resize", resizeHandler);
        resizeHandlerRef.current = resizeHandler
    }, [])

    React.useEffect(()=>{
        rendererRef.current.reset(reglRef.current);
    },[props.lights, props.shapes, props.viewBox])

    if(reglRef.current && rendererRef.current)
    {
        rendererRef.current.renderGL(reglRef.current, props.paths, props.viewBox, canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
    }
    const h = React.createElement
    return h("canvas", {...props, ref:canvasRef})
}

export default GLViewport;