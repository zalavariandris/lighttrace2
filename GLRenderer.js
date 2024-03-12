import {mat4} from 'gl-matrix'

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

class GLRenderer{

    constructor(regl)
    {
        this.regl = regl;
        // utilities   
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
                projection: mat4.ortho(mat4.identity([]), 0,1,0,1,-1,1),
                texture: regl.prop("texture")
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
    }

    reset(){
        this.drawToFbo({framebuffer: this.bufferFbo}, ()=>{
            this.regl.clear({color: [0,0,0,1]});
        });
        this.samples = 0;
    }

    render({scene=null, tick=0}={})
    {
        console.log(`GLRenderer->render(scene: ${scene}, tick: ${tick})`)
        this.sceneFbo.resize(64,64);
        this.bufferFbo.resize(64,64);
        this.compFbo.resize(64,64);
        this.toneFbo.resize(64,64);

        const regl = this.regl;

        // /* ==================== *
        // * Main render commands *
        // * ==================== */
        // // draw scene to scene_texture
        this.drawToFbo({framebuffer: this.sceneFbo}, ()=>{
            this.regl.clear({color: [0,0,0,1]});
            this.setupScene({}, ()=>{
                // draw 1st circle
                this.regl({
                    uniforms: {
                        color: [1, 1, .9, 1.0],
                        model: makeTransform({
                            position: [Math.sin(tick*0.1)*128+256, 256, 0],
                            scale: [50,50,50]
                        }),
                    },
                    attributes: {
                        position: makeCircle(36)
                    },
                    primitive: 'triangle fan',
                    count: 36
                })();

                // draw 2nd circle
                this.regl({
                    uniforms: {
                        color: [1, 1, .9, 1.0],
                        model: makeTransform({
                            position: [Math.sin(tick*0.1)*128+256, Math.cos(tick*0.1)*128+256, 0],
                            scale: [50,50,50]
                        }),
                    },
                    attributes: {
                        position: makeCircle(36)
                    },
                    primitive: 'triangle fan',
                    count: 36
                })();
            });
        });

        // render scene+buffer to comp
        this.setupQuad({}, ()=>{
            this.regl({
                framebuffer: this.compFbo,
                uniforms: {
                    textureA: this.sceneTexture,
                    textureB: this.bufferTexture
                },
                frag: `precision mediump float;
                varying vec2 vUV;
                uniform sampler2D textureA;
                uniform sampler2D textureB;
            
                void main() {
                    vec4 texA = texture2D(textureA, vUV).rgba;
                    vec4 texB = texture2D(textureB, vUV).rgba;
                    gl_FragColor = vec4(texA.rgb+texB.rgb, 1.0);
                }`
            })();
        });
        this.samples+=1;
        
    
        // copy comp to buffer
        this.setupQuad({}, ()=>{
            this.regl({
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
            this.regl({
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


        // render texture to screen
        this.setupQuad({}, ()=>{
            this.regl({
                uniforms:{
                    texture: this.toneTexture
                }
            })();
        });
    }
}

export default GLRenderer;