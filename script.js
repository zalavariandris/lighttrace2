
// import createREGL from "https://cdnjs.cloudflare.com/ajax/libs/regl/2.1.0/regl.js"
const regl = createREGL(document.body)
console.log("COMPID")

// This clears the color buffer to black and the depth buffer to 1

// In regl, draw operations are specified declaratively using. Each JSON
// command is a complete description of all state. This removes the need to
// .bind() things like buffers or shaders. All the boilerplate of setting up
// and tearing down state is automated.
const drawBunny = regl({
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

    attributes: {
        position: ({tick})=>{
            const speed = 100;
            let x = Math.sin(tick*0.001*speed);
            x = Math.sin(x*0.5)*0.5;
            return [
                [x, 0],
                [0, -1],
                [1, 1]
            ]
        }
    },

    uniforms: {
        color: ({tick})=>{
            let t = tick;
            t = Date.now()*0.001;
            return [Math.sin(t), 0,0, 1]
        }
    },

    count: 3
})

regl.frame(() => {
    regl.clear({
        depth: 1,
        color: [0.1, 0.1, 0, 1]
    })

    drawBunny()
})