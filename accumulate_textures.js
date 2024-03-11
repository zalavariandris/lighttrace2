const regl = createREGL({extensions: ['OES_texture_float', "OES_texture_half_float"]})

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

const sceneTexture = regl.texture({
    width: 1,
    height: 1,
    wrap: 'clamp',
    format: "rgba",
    type: "float"
});
const sceneFbo = regl.framebuffer({
    color: sceneTexture,
    depth: false
});

let bufferTexture = regl.texture({
    width: 1,
    height: 1,
    wrap: 'clamp',
    format: "rgba",
    type: "float"
});
let bufferFbo = regl.framebuffer({
    color: bufferTexture,
    depth: false
});

const compTexture = regl.texture({
    width: 1,
    height: 1,
    wrap: 'clamp',
    format: "rgba",
    type: "float"
});
const compFbo = regl.framebuffer({
    color: compTexture,
    depth: false
});

const toneTexture = regl.texture({
    width: 1,
    height: 1,
    wrap: 'clamp',
    format: "rgba",
    type: "float"
});
const toneFbo = regl.framebuffer({
    color: toneTexture,
    depth: false
});

let k=0
regl.frame(({tick, viewportWidth, viewportHeight}) => {
    sceneFbo.resize(64,64);
    bufferFbo.resize(64,64);
    compFbo.resize(64,64);
    toneFbo.resize(64,64);

    // create matrices
    const projection = mat4.ortho(mat4.identity([]), 0,512,0,512,-1,1) //left, right, bottom, top, near, far
    const view = mat4.identity([]);
    let model = mat4.fromTranslation(mat4.identity([]), [Math.sin(tick*0.1)*128+256, 256, 0])
    mat4.scale(model, model, [50,50,50])

    // draw circle command
    const drawCircle = regl({
        viewport: {x: 0, y: 0, w: 512, h: 512},

        vert: `
        precision mediump float;
        attribute vec2 position;
        uniform mat4 projection;
        uniform mat4 view;
        uniform mat4 model;
        void main () {
            gl_Position = projection * view * model * vec4(position, 0, 1);
        }`,

        frag: `
        precision mediump float;
        uniform vec4 color;
        void main () {
            gl_FragColor = color;
        }`,
        
        attributes: {
            position: makeCircle(36)
        },
    
        uniforms: {
            color: [1, 1, .3, 1.0],
            model: model,
            view: view,
            projection: projection
        },
        primitive: 'triangle fan',
        count: 36
    });

    const setupQuad = regl({
        
    });

    const drawTexture = regl({
        viewport: {x: 0, y: 0, w: 1, h: 1},
        depth: { enable: false },
        primitive: "triangle fan",
        attributes: {
          position: [
            [   0,    0],
            [ 1,    0],
            [ 1,  1],
            [   0,  1]
          ],
          uv:[
            [ 0, 0],
            [ 1, 0],
            [ 1,  1],
            [0,  1]
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

    const drawToFbo = regl({
        framebuffer: regl.prop("framebuffer")
    })

    /* ==================== *
     * Main render commands *
     * ==================== */

    // draw scene to scene_texture
    drawToFbo({framebuffer: sceneFbo}, ()=>{
        regl.clear({color: [0,0,0,1]});
        drawCircle();
    });

    // render scene+buffer to comp
    drawToFbo({framebuffer: compFbo}, ()=>{
        regl({
            // viewport: {x: 0, y: 0, w: 64, h: 64},
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
                textureA: sceneTexture,
                textureB: bufferTexture
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
            uniform sampler2D textureA;
            uniform sampler2D textureB;
        
            void main() {
                vec4 texA = texture2D(textureA, vUV).rgba;
                vec4 texB = texture2D(textureB, vUV).rgba;
                gl_FragColor = vec4(texA.rgb+texB.rgb, 1.0);
            }`
        })()
    })

    // copy comp to buffer
    drawToFbo({framebuffer: bufferFbo}, ()=>{
        drawTexture({texture: compTexture})
    })

    // tone down added light intensities
    k++;
    drawToFbo({framebuffer: toneFbo}, ()=>{
        regl({
            viewport: {x: 0, y: 0, w: 1, h: 1},
            depth: { enable: false },
            primitive: "triangle fan",
            attributes: {
                position: [
                    [   0,    0],
                    [ 1,    0],
                    [ 1,  1],
                    [   0,  1]
                ],
                uv:[
                    [ 0, 0],
                    [ 1, 0],
                    [ 1,  1],
                    [0,  1]
                    ]
            },
            count: 6,
            uniforms: {
                projection: mat4.ortho(mat4.identity([]), 0,1,0,1,-1,1),
                texture: compTexture,
                exposure: 1/k
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
            uniform float exposure;
        
            void main() {
                vec4 tex = texture2D(texture, vUV).rgba;
                gl_FragColor = vec4(tex.rgb*exposure, 1.0);
            }`
        })()
    })

    // render texture to screen
    drawTexture({texture: toneTexture})


    // regl.clear({color: [0,0,1,1]});
    // drawCircle();
})
