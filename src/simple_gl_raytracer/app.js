import React from "react";

import createREGL from "regl"
import Manipulator from "../UI/Manipulator.js"

import _ from "lodash"


import sceneStore from "./entityStore.js"

/*
 * GL Renderer
 */

import QUAD from "./QUAD.js"
import PASS_THROUGH_VERTEX_SHADER from "./shaders/PASS_THROUGH_VERTEX_SHADER.js"


import { drawTexture } from "./operators/drawTexture.js";
import { drawCSGToSDF } from "./operators/drawCSGToSDF.js";
import { intersectRaysWithCSG } from "./operators/intersectRaysWithCSG.js"
import { intersectRaysWithSDF } from "./operators/intersectRaysWithSDF.js";
import { drawLines} from "./operators/drawLines.js";
import { drawRays} from "./operators/drawRays.js"
import { bounceRays } from "./operators/bounceRays.js";


class GLRenderer{
    constructor(canvas)
    {
        this.canvas = canvas;
        this.LightSamples = Math.pow(4,6);//128*128; //Math.pow(4,4);
        this.outputResolution = [512, 512]
    }

    initGL()
    {
        this.regl = createREGL({
            canvas: this.canvas,
            // pixelRatio: 2.0,
            attributes: {
                // width: 1024, heigh: 1024,
                alpha: true,
                depth: true,
                stencil: false,
                antialias: true,
                premultipliedAlpha: false,
                preserveDrawingBuffer: true,
                preferLowPowerToHighPerformance: false,
                failIfMajorPerformanceCaveat: false
            },
            extensions: ['OES_texture_float', "OES_texture_half_float"]
        });
        const regl = this.regl;

        this.sdfTexture = regl.texture({
            width: 512, 
            height: 512,
            wrap: 'clamp',
            format: "rgba",
            type: "float"
        });

        this.sdfFbo = regl.framebuffer({
            color: this.sdfTexture,
            depth: false
        });

        this.rayDataTexture = regl.texture({
            width: Math.sqrt(this.LightSamples),
            height: Math.sqrt(this.LightSamples),
            wrap: 'clamp',
            min: "nearest", 
            mag: "nearest",
            format: "rgba",
            type: "float",
        });

        this.rayDataFbo = regl.framebuffer({
            color: this.rayDataTexture,
            depth: false
        });

        this.hitDataTexture = regl.texture({
            width: Math.sqrt(this.LightSamples), 
            height: Math.sqrt(this.LightSamples),
            wrap: 'clamp',
            format: "rgba",
            type: "float"
        });

        this.hitDataFbo = regl.framebuffer({
            color: this.hitDataTexture,
            depth: false
        });

        this.secondaryRayDataTexture = regl.texture({
            width: Math.sqrt(this.LightSamples),
            height: Math.sqrt(this.LightSamples),
            wrap: 'clamp',
            min: "nearest", 
            mag: "nearest",
            format: "rgba",
            type: "float",
        });

        this.secondaryRayDataFbo = regl.framebuffer({
            color: this.secondaryRayDataTexture,
            depth: false
        });

        this.secondaryHitDataTexture = regl.texture({
            width: Math.sqrt(this.LightSamples),
            height: Math.sqrt(this.LightSamples),
            wrap: 'clamp',
            min: "nearest", 
            mag: "nearest",
            format: "rgba",
            type: "float",
        });

        this.secondaryHitDataFbo = regl.framebuffer({
            color: this.secondaryHitDataTexture,
            depth: false
        });

        this.lineDataTexture = regl.texture({
            width: Math.sqrt(this.LightSamples),
            height: Math.sqrt(this.LightSamples),
            wrap: 'clamp',
            min: "nearest", 
            mag: "nearest",
            format: "rgba",
            type: "float",
        });

        this.lineDataFbo = regl.framebuffer({
            color: this.linesDataTexture,
            depth: false
        });
    }

    resizeGL()
    {
        const [width, height] = [this.canvas.clientWidth, this.canvas.clientHeight];
        this.canvas.width = width;
        this.canvas.height = height;
        console.log("resizeGL", width, height);
        this.outputResolution = [width, height]
        // this.outputResolution = [width, height]
    }

    renderGL(scene)
    {
        const regl = this.regl;

        regl.clear({color: [0.03,0.03,0.03,1.0]});

        const circleData = Object.entries(scene)
            .filter(([key, entity])=>entity.hasOwnProperty("pos") && entity.hasOwnProperty("shape") && entity.shape.type=="circle")
            .map( ([key, entity])=>[entity.pos.x, entity.pos.y, entity.shape.radius] )



        // this.sdfTexture = regl.texture({
        //     width: this.canvas.width, 
        //     height: this.canvas.height,
        //     wrap: 'clamp',
        //     format: "rgba",
        //     type: "float"
        // });

        // drawCSGToSDF(regl, {
        //     framebuffer: this.sdfFbo,
        //     CSG: circleData,
        //     outputResolution: [this.canvas.width, this.canvas.height]
        // });
        
        // drawTexture(regl, {
        //     framebuffer: null,
        //     texture: this.sdfTexture, 
        //     outputResolution: [this.canvas.width, this.canvas.height],
        //     exposure: 0.001
        // });

        /*
        Cast Rays from lightsources
        */
        // Create packed lightraydata for each light [[Cx,Cy,Dx,Dy]...]
        function castRaysFromLights({
            lightSamples,
            lightEntities,
            outputRayDataTexture
        })
        {   
            const lightsCount =  lightEntities.length;
            const RaysCount = lightSamples*lightsCount;
    
            // calc output texture resolution to hold rays data
            const [dataWidth, dataHeight] = [Math.ceil(Math.sqrt(RaysCount)),Math.ceil(Math.sqrt(RaysCount))];
    
            let rayData = lightEntities.map( ([key, entity])=>{
                return Array.from({length: lightSamples}).map((_, k)=>{
                    const angle = k/lightSamples*Math.PI*2+Math.PI/8.0;
                    return [entity.pos.x, entity.pos.y, Math.cos(angle), Math.sin(angle)];
                })
            }).flat(1);
            
            // upload data to an RGBA float texture
            outputRayDataTexture({
                width: dataWidth,
                height: dataHeight,
                format: "rgba",
                type: "float",
                data: rayData
            });

            return RaysCount;
        }

        const lightEntities = Object.entries(scene)
            .filter( ([key, entity])=>entity.hasOwnProperty("light") )

        const RaysCount = castRaysFromLights({
            lightSamples: this.LightSamples,
            lightEntities: lightEntities,
            outputRayDataTexture: this.rayDataTexture
        });



        // reformat hitpoints to match the rays count
        this.hitDataTexture({
            width: this.rayDataTexture.width,
            height: this.rayDataTexture.height,
            format: "rgba",
            type: "float"
        });

        const MAX_BOUNCE = 3;
        for(let i=0; i<MAX_BOUNCE; i++)
        {
            // draw initial Rays
            // drawRays(regl, {
            //     raysCount: RaysCount,
            //     raysTexture: this.rayDataTexture,
            //     raysLength: 10.0,
            //     outputResolution: [512,512],
            //     raysColor: [1,1,0,1]
            // });

            intersectRaysWithCSG(regl, {
                framebuffer: this.hitDataFbo,
                incidentRayDataTexture: this.rayDataTexture,
                CSG: circleData
            });

            /* Draw RAYS to hitPoints*/
            drawLines(regl, {
                linesCount: RaysCount,
                startpoints: this.rayDataTexture,
                endpoints: this.hitDataTexture,
                outputResolution: this.outputResolution,
                linesColor: [0.1,0.1,0.1,700.0/this.LightSamples]
            });

            // // draw hitPoints
            // drawRays(regl, {
            //     raysCount: RaysCount,
            //     raysTexture: this.hitDataFbo,
            //     raysLength: 30.0,
            //     outputResolution: [512,512],
            //     raysColor: [0,1,0,1]
            // });

            // Bounce rays with hitPoints
            bounceRays(regl, {
                outputFramebuffer: this.secondaryRayDataFbo,
                outputResolution: [this.rayDataTexture.width, this.rayDataTexture.height],
                incidentRaysTexture: this.rayDataFbo, 
                hitDataTexture: this.hitDataFbo
            });

            // Swap Buffers
            [this.rayDataFbo, this.secondaryRayDataFbo] = [this.secondaryRayDataFbo, this.rayDataFbo];
            [this.rayDataTexture, this.secondaryRayDataTexture] = [this.secondaryRayDataTexture, this.rayDataTexture];
        }
    }
}

/*
 * VIEWS
 */
const h = React.createElement;

function Outliner({})
{
    const scene = React.useSyncExternalStore(sceneStore.subscribe, sceneStore.getSnapshot);
    return h("ul", {}, 
        Object.entries(scene)
            .filter(([key, entity])=>entity.hasOwnProperty("pos"))
            .map( ([key, entity])=>{
            return h("li", null, 
                `${key}: (${entity.pos.x},${entity.pos.y})`
            )
        })
    );
}

function SVGViewport({width, height, className})
{
    const scene = React.useSyncExternalStore(sceneStore.subscribe, sceneStore.getSnapshot);

    return h("svg", {width, height, className}, 
        Object.entries(scene).filter(([key, entity])=>entity.hasOwnProperty("shape")).map( ([key, entity])=>{
            return h(Manipulator, {
                referenceX: entity.pos.x,
                referenceY: entity.pos.y,
                onDrag: e=>sceneStore.updateComponent(key, "pos", {
                    x: e.sceneX+e.referenceOffsetX, 
                    y: e.sceneY+e.referenceOffsetY
                }),
            }, 
                h("circle", {cx: entity.pos.x, cy: entity.pos.y, r:entity.shape.radius})
            )
        }),
        Object.entries(scene)
            .filter(([key, entity])=>entity.hasOwnProperty("pos") && entity.hasOwnProperty("light"))
            .map( ([key, entity])=>{
            return h(Manipulator, {
                referenceX: entity.pos.x,
                referenceY: entity.pos.y,
                onDrag: e=>sceneStore.updateComponent(key, "pos", {
                    x: e.sceneX+e.referenceOffsetX, 
                    y: e.sceneY+e.referenceOffsetY
                }),
            }, 
                h("circle", {cx: entity.pos.x, cy: entity.pos.y, r:10, style:{fill:"orange"}})
            )
        })
    );
}

function GLViewport({width, height, className})
{
    const scene = React.useSyncExternalStore(sceneStore.subscribe, sceneStore.getSnapshot);
    const canvasRef = React.useRef(null);
    const renderer = React.useRef(null)
    React.useEffect(()=>{
        renderer.current = new GLRenderer(canvasRef.current);
        renderer.current.initGL();
        renderer.current.resizeGL();


        function onResize(e)
        {
            renderer.current.resizeGL();
            renderer.current.renderGL(scene);
        }
        window.addEventListener("resize", onResize);
        return ()=>{
            window.removeEventListener("resize", onResize);
        }
    }, []);

    React.useEffect(()=>{
        renderer.current.renderGL(scene);
    }, [scene])

    return h("canvas", {width, height, className, ref: canvasRef});
}

function App({})
{
    function handleChange(e)
    {
        console.log(e.key)
        if(e.key === 'Enter')
        {
            sceneStore.addEntity(e.target.value, {shape: {type: "rectangle", size: 10.0}});
            e.target.value = ""
        }
    }

    const scene = React.useSyncExternalStore(sceneStore.subscribe, sceneStore.getSnapshot);
    return h("div", {}, 
        h(Outliner),
        h("div", {
            className: "viewports", 
            style: {

            }
        },
            h(GLViewport, {width: 512, height: 512}),
            h(SVGViewport, {width: 512, height: 512})
        )
    );
}

export default App;

