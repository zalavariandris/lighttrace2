import React from "react";

import createREGL from "regl"
import Manipulator from "../UI/Manipulator.js"
import {vec2} from "gl-matrix"
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
        this.LightSamples = 4*4; //Math.pow(4,4);
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
                stencil :false,
                antialias: true,
                premultipliedAlpha: true,
                preserveDrawingBuffer: false,
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

    renderGL(scene)
    {
        const regl = this.regl;

        regl.clear({color: [0.03,0.03,0.03,1.0]});

        const circleData = Object.entries(scene)
            .filter(([key, entity])=>entity.hasOwnProperty("pos") && entity.hasOwnProperty("shape") && entity.shape.type=="circle")
            .map( ([key, entity])=>[entity.pos.x, entity.pos.y, entity.shape.radius] )
        // const circleData = [
        //     [scene["ball"].pos.x, scene["ball"].pos.y, scene["ball"].shape.radius]
        // ];

        drawCSGToSDF(regl, {
            framebuffer: this.sdfFbo,
            CSG: circleData,
            outputResolution: [512,512]
        });
        
        drawTexture(regl, {
            framebuffer: null,
            texture: this.sdfTexture, 
            outputResolution: [512,512],
            exposure: 0.001
        });

        /*
        Cast Rays from lightsources
        */
        // Create packed lightraydata for each light [[Cx,Cy,Dx,Dy]...]
        const LightSamples = this.LightSamples;
        console.log(LightSamples)

        const lightsCount =  Object.entries(scene)
            .filter( ([key, entity])=>entity.hasOwnProperty("light") ).length;

        const RayCount = LightSamples*lightsCount;
        const [dataWidth, dataHeight] = [Math.ceil(Math.sqrt(RayCount)),Math.ceil(Math.sqrt(RayCount))];

        let rayData = Object.entries(scene)
            .filter( ([key, entity])=>entity.hasOwnProperty("light") )
            .map( ([key, entity])=>{
            return Array.from({length: LightSamples}).map((_, k)=>{
                const angle = k/LightSamples*Math.PI*2+Math.PI/8.0;
                return [entity.pos.x, entity.pos.y, Math.cos(angle), Math.sin(angle)];
            })
        }).flat(1);
        
        // upload data to an RGBA float texture
        this.rayDataTexture({
            width: dataWidth,
            height: dataHeight,
            format: "rgba",
            type: "float",
            data: rayData
        });

        /* 
        Intersect Rays with SDF 
        */
        // reformat hitpoints to match the rays count
        this.hitDataTexture({
            width: dataWidth,
            height: dataHeight,
            format: "rgba",
            type: "float"
        });

        intersectRaysWithSDF(regl, {
            framebuffer: this.hitDataFbo, 
            outputResolution: [512,512],
            rayDataTexture: this.rayDataTexture,
            sdfTexture:this.sdfTexture
        });        

        intersectRaysWithCSG(regl, {
            framebuffer: this.hitDataFbo,
            incidentRayDataTexture: this.rayDataTexture,
            CSG: circleData
        });


        
        /* 
        Draw initial rays
        */
        drawLines(regl, {
            linesCount: RayCount,
            startpoints: this.rayDataTexture,
            endpoints: this.hitDataTexture,
            outputResolution: [512,512],
            linesColor: [1,1,1,100.0/this.LightSamples]
        });

        // draw hitPoints
        drawRays(regl, {
            raysCount: RayCount,
            raysTexture: this.hitDataFbo,
            raysLength: 30.0,
            outputResolution: [512,512],
            raysColor: [0,1,0,1]
        });
        /*
         * RAYTRACE Bounces 
         */
        // const MAX_BOUNCE = 1 ;
        // for(let i=0; i<MAX_BOUNCE; i++)
        // {
        bounceRays(regl, {
            outputFramebuffer: this.secondaryRayDataFbo,
            outputResolution: [dataWidth, dataHeight],
            incidentRaysTexture: this.rayDataFbo, 
            hitDataTexture: this.hitDataFbo
        });

        // draw secondary rays
        drawRays(regl, {
            raysCount: RayCount,
            raysTexture: this.secondaryRayDataTexture,
            raysLength: 100.0,
            outputResolution: [512,512],
            raysColor: [1,1,1,100.0/this.LightSamples]
        });

        // // reformat hitpoints to match the rays count
        // this.secondaryHitDataTexture({
        //     width: dataWidth,
        //     height: dataHeight,
        //     format: "rgba",
        //     type: "float"
        // });

        // // intrsect secondary rays with sdf
        // intersectRaysWithSDF(regl, {
        //     framebuffer: this.secondaryHitDataFbo, 
        //     outputResolution: [512,512],
        //     rayDataTexture: this.secondaryRayDataFbo,
        //     sdfTexture:this.sdfTexture
        // });

        // // draw secondary rays
        // drawLines(regl, {
        //     linesCount: RayCount,
        //     startpoints: this.secondaryRayDataFbo,
        //     endpoints: this.secondaryHitDataFbo,
        //     outputResolution: [512,512],
        //     linesColor: [1,1,1,100.0/this.LightSamples]
        // });


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
        h("div", {className: "viewports"},
            h(GLViewport, {width: 512, height: 512}),
            h(SVGViewport, {width: 512, height: 512})
        )
    );
}

export default App;

