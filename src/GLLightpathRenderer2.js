import {mat4} from 'gl-matrix'
import {RGBToCSS, wavelengthToRGB} from "./scene/colorUtils.js"
import _ from "lodash"

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

function makeProjectionFromViewbox(viewBox)
{
    const projection = mat4.identity([]);
    mat4.ortho(projection, viewBox.x, viewBox.x+viewBox.w, viewBox.y+viewBox.h, viewBox.y, -1,1) //left, right, bottom, top, near, far
    return projection;
}


class GLLightpathRenderer{
    constructor(regl)
    {
        this.initGL(regl);
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

    resizeGL(regl, {width, height}){
        const [canvaswidth, canvasheight] = [width, height]
        this.sceneFbo.resize(canvaswidth, canvasheight);
        this.bufferFbo.resize(canvaswidth, canvasheight);
        this.compFbo.resize(canvaswidth, canvasheight);
        this.toneFbo.resize(canvaswidth, canvasheight);
    }

    renderGL(regl, {lightpaths, viewBox, width, height})
    {
        const [canvaswidth, canvasheight] = [width, height]
        viewBox = fitViewboxInSize(viewBox, {width: canvaswidth, height: canvasheight})
        const projection = makeProjectionFromViewbox(viewBox)

        // Draw Scene to fbo
        this.drawToFbo({framebuffer: this.sceneFbo}, ()=>{
            regl.clear({color: [0,0,0,0]});
            

            for(let lightpath of lightpaths)
            {
                
                
                const vColors = lightpath.rays.map((ray, idx)=>{
                    const [R,G,B] = wavelengthToRGB(ray.wavelength);
                    
                    // correct rasterization bias, instead antialization 
                    // (ref: https://benedikt-bitterli.me/tantalum/)
                    let biasCorrection = ray.direction.magnitude()/Math.max(Math.abs(ray.direction.x), Math.abs(ray.direction.y));
                    biasCorrection = _.clamp(biasCorrection, 1.0, 1.414214);

                    return [
                        R*ray.intensity*biasCorrection,
                        G*ray.intensity*biasCorrection,
                        B*ray.intensity*biasCorrection
                    ];
                });

                const lastRay = lightpath.rays[lightpath.rays.length-1];
                const [R,G,B] = wavelengthToRGB(lastRay.wavelength);
                vColors.push([R*lastRay.intensity,G*lastRay.intensity,B*lastRay.intensity]);

                const vPositions = lightpath.rays.map(r=>[r.origin.x, r.origin.y]);
                vPositions.push([lastRay.origin.x+lastRay.direction.x*1000, lastRay.origin.y+lastRay.direction.y*1000]);
                

                const draw_lightpath = regl(({
                    viewport: {x: 0, y:0, width: canvaswidth, height: canvasheight},
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
                        position: vPositions,
                        color: vColors,
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
                    count: lightpath.rays.length+1,
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
                    exposure: 20/this.samples//*Math.min(this.samples/30-0.1, 1.0)
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

export default GLLightpathRenderer;