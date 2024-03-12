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

function makeProjectionFromViewbox(viewBox)
{
    const projection = mat4.identity([]);
    mat4.ortho(projection, viewBox.x, viewBox.x+viewBox.w, viewBox.h+viewBox.y, viewBox.y,-1,1) //left, right, bottom, top, near, far
    return projection;
}

class GLViewport extends React.Component
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
    }

    componentDidMount()
    {
        // Crate REGL context
        this.reglRef.current = createREGL({
            canvas: this.canvasRef.current,
            extensions: ['OES_texture_float', "OES_texture_half_float"]
        });
        console.assert(this.reglRef.current!=undefined, "cant create REGL context")

        // INITIAL
        this.initGL(this.reglRef.current);
    }

    initGL(regl)
    {
        this.tick = 0;
        // this.rendererRef.current.render({scene: this.props.scene, tick: this.tick});
    }

    renderGL(regl)
    {
        // this.rendererRef.current.render({scene: this.props.scene, tick: this.tick});
        console.log("renderGL", this.props.scene.paths);
        const lines = makeLinesFromPaths(this.props.scene.paths);
        const [canvaswidth, canvasheight] = [this.canvasRef.current.offsetWidth, this.canvasRef.current.offsetHeight]
        const reformatViewBox = fitViewboxInSize(this.props.viewBox, {width: canvaswidth, height: canvasheight})
        console.log("reformatViewBox", reformatViewBox)
        const projection = makeProjectionFromViewbox(reformatViewBox);

        const draw_lines = regl({
            // context:{framebufferWidth: resolution.width, framebufferHeight: resolution.height},
            // viewport: {x: 0, y: 0, w: resolution.width, h: resolution.height},
            // In a draw call, we can pass the shader source code to regl
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
        this.tick+=1;
    }

    render()
    {
        if(this.reglRef.current)
        {
            this.renderGL(this.reglRef.current);
        }
        const h = React.createElement
        return h("canvas", {...this.props, ref:this.canvasRef})
    }

}

export default GLViewport;