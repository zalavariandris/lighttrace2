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

// draw Texture to screen
function drawTexture(regl, {
    texture, 
    outputResolution, 
    exposure=1.0,
    framebuffer=null
}={})
{
    regl({...QUAD,
        framebuffer: framebuffer,
        vert: PASS_THROUGH_VERTEX_SHADER,
        depth: { enable: false },
        uniforms:{
            texture: texture,
            outputResolution: outputResolution,
            exposure: exposure
        },
        frag:`precision mediump float;
        uniform sampler2D texture;
        uniform vec2 outputResolution;
        uniform float exposure;
        void main()
        {   
            vec2 UV = gl_FragCoord.xy/outputResolution;
            vec4 color = texture2D(texture, UV);
            gl_FragColor = color*vec4(exposure, exposure, exposure, 1.0);
        }`
    })();
}

import { drawSceneToSDF } from "./operators/drawSceneToSDF.js";

/**
 * Intersect rays with an sdf
 * @param {FBO} framebuffer - The OUTPUT framebuffer to render HitPoint as data vec4(pos, normal)
 * @param {Texture} rayDataTexture - Rays encoded into a texture as data vec4(pos.xy, dir.xy)
 * @param {Texture} sdfTexture - The scene encoded to a signed distance field.
 */
function intersectRaysWithSDF(regl, {
    framebuffer, 
    outputResolution,
    rayDataTexture, 
    sdfTexture,
})
{
    regl({...QUAD, vert:PASS_THROUGH_VERTEX_SHADER,
        framebuffer: framebuffer,
        uniforms:{
            outputResolution: outputResolution,
            rayDataTexture: rayDataTexture,
            rayDataResolution: [rayDataTexture.width, rayDataTexture.height],
            sdfTexture: sdfTexture,
            sdfResolution: [sdfTexture.width, sdfTexture.height]
        },
        frag:`precision mediump float;
        uniform sampler2D rayDataTexture;
        uniform vec2 rayDataResolution;
        uniform sampler2D sdfTexture;
        uniform vec2 sdfResolution;
        uniform vec2 outputResolution;

        #define MAX_RAYMARCH_STEPS 30
        #define MIN_HIT_DISTANCE 1.0
        #define MAX_TRACE_DISTANCE 2048.0

        vec2 sdfNormalAtPoint(vec2 P, sampler2D sdfTexture)
        {
            // Sample distance field texture and neighboring texels
            vec2 texelSize = vec2(1.0/sdfResolution.x, 1.0/sdfResolution.y); 
            vec2 UV = P/sdfResolution;
            float distance = texture2D(sdfTexture, UV).r;
            float distanceRight = texture2D(sdfTexture, UV + vec2(texelSize.x, 0.0)).r;
            float distanceUp = texture2D(sdfTexture, UV + vec2(0.0, texelSize.y)).r;
        
            // Calculate gradients in x and y directions
            float dx = distanceRight - distance;
            float dy = distanceUp - distance;
        
            // Calculate normal vector
            return normalize(vec3(dx, dy, 1.0)).xy; // Negate the gradient and normalize
        }

        vec2 rayMarch(vec2 rayPos, vec2 rayDir, sampler2D sdfTexture)
        {
            vec2 pos = rayPos;
            float totalDistanceTraveled = 0.0;
            for(int i=0; i<MAX_RAYMARCH_STEPS; i++)
            {
                vec2 texCoord = pos/outputResolution;
                float currentDistance = texture2D(sdfTexture, texCoord).r;
                totalDistanceTraveled+=currentDistance;

                // ray did not hit anything within distance threshold
                if(totalDistanceTraveled>MAX_TRACE_DISTANCE)
                {
                    rayDir = normalize(rayDir) * MAX_TRACE_DISTANCE;
                    return rayPos+rayDir;
                }

                // ray hit surface
                if(currentDistance<1.0)
                {
                    rayDir = normalize(rayDir)*distance(pos, rayPos);
                    return rayPos+rayDir;
                }
                pos+=normalize(rayDir)*currentDistance;
            }

            // ray did not hit anythin while raymarching.
            rayDir = normalize(rayDir) * MAX_TRACE_DISTANCE;
            vec2 hitPos = rayPos+rayDir;
            return vec2(hitPos);
        }

        void main()
        {
            // float rayIdx = gl_FragCoord.y*rayDataResolution.x+gl_FragCoord.y;

            // unpack ray from data texture
            vec2 texCoord = gl_FragCoord.xy / rayDataResolution;
            vec4 rayData = texture2D(rayDataTexture, texCoord);
            vec2 rayPos = rayData.xy;
            vec2 rayDir = rayData.zw;

            // intersect ray with signed distance field
            vec2 hitPos = rayMarch(rayPos+normalize(rayDir)*MIN_HIT_DISTANCE*2.0, rayDir, sdfTexture);

            // calculate normal at intersection point
            vec2 hitNormal = sdfNormalAtPoint(hitPos, sdfTexture);

            // output hitData
            gl_FragColor = vec4(hitPos, hitNormal);
        }`
    })();
}

function intersectRaysWithCSG(regl, {
    framebuffer, 
    incidentRayDataTexture,
    csg
})
{
    regl({...QUAD, vert:PASS_THROUGH_VERTEX_SHADER,
        framebuffer: framebuffer,
        uniforms: {
            rayDataTexture: incidentRayDataTexture,
            rayDataResolution: [incidentRayDataTexture.width, incidentRayDataTexture.height],
        },
        frag: `precision mediump float;
        
        uniform sampler2D rayDataTexture;
        uniform vec2 rayDataResolution;

        struct Ray{
            vec2 origin;
            vec2 direction;
        };

        struct HitPoint{
            vec2 position;
            vec2 normal;
        };

        Ray sampleCurrentRay()
        {
            vec2 texCoord = gl_FragCoord.xy / rayDataResolution;
            vec4 rayData = texture2D(rayDataTexture, texCoord);
            vec2 rayPos = rayData.xy;
            vec2 rayDir = rayData.zw;

            return Ray(rayPos, rayDir);
        }

        /*return closest intersection along the ray*/
        float intersectCircle(Ray ray, vec2 center, float radius)
        {
            vec2 p = ray.origin - center;
            float A = dot(ray.direction, ray.direction);
            float B = dot(p, ray.direction);
            float C = dot(p, p) - radius*radius;
            float detSq = B*B - C;

            if(detSq<0.0)
            {
                return -1.0;
            }
            else
            {
                float det = sqrt(detSq);
                float tNear = (-B - det) / (2.0*A);
                float tFar  = (-B + det) / (2.0*A);

                if(tNear<=0.0 && tFar<=0.0){
                    return -1.0;
                }
                else if(tNear<0.0){
                    return tFar;
                }
                else
                {
                    return min(tNear, tFar);
                }
            }
        }

        vec2 circleNormal(vec2 P, vec2 center, float radius)
        {
            return normalize(P-center);
        }
        
        HitPoint intersectScene(Ray ray)
        {

            float t = intersectCircle(ray, vec2(256,256), 150.0);
            if(t>0.0)
            {
                vec2 hitPos = ray.origin+ray.direction*t;
                vec2 N = circleNormal(gl_FragCoord.xy, vec2(256,256), 150.0);
                return HitPoint(hitPos, N);
            }
            return HitPoint(vec2(0.0,0.0), vec2(1.0,1.0));
        }

        void main()
        {
            // unpack ray from data texture

            Ray incidentRay = sampleCurrentRay();
            HitPoint hitPoint = intersectScene(incidentRay);
            gl_FragColor = vec4(hitPoint.position, vec2(0.0,1.0));
        }
        `
    })();
};

/**
* Draw rays based on rayDataTexture and hitDataTexture
* 
* @param {Texture} params.rayDataTexture - Texture containing ray data in vec4(pos, dir).
* @param {Texture} params.hitDataTexture - Texture containing hit data in vec4(pos, normal).
* @param {[Array]} params.outputResolution - Resolution of the output [width, height].
*/
function drawRays(regl, {
    rayCount,
    rayDataTexture,
    hitDataTexture,
    outputResolution,
    rayColor=[0.9,0.5,0.0,0.3]
}={}){
    regl({
        // viewport: {x: 0, y: 0, w: 1, h: 1},
        depth: { enable: false },
        primitive: "lines",
        attributes: {
            vertexIdx: _.range(rayCount*2),
        },
        count: rayCount*2,
        uniforms:{
            rayDataTexture: rayDataTexture,
            rayDataResolution: [rayDataTexture.width, rayDataTexture.height],
            hitDataTexture: hitDataTexture,
            hitDataResolution: [hitDataTexture.width, hitDataTexture.height],
            outputResolution: outputResolution,
            rayColor: rayColor
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
        vert: `precision mediump float;
            #define MAX_RAYMARCH_STEPS 9
            #define MIN_HIT_DISTANCE 1.0
            #define MAX_TRACE_DISTANCE 250.0

            attribute float vertexIdx;
            uniform sampler2D rayDataTexture;
            uniform vec2 rayDataResolution;
            uniform sampler2D hitDataTexture;
            uniform vec2 hitDataResolution;
            
            uniform vec2 outputResolution;

            float modI(float a,float b)
            {
                float m = a-floor((a+0.5)/b)*b;
                return floor(m+0.5);
            }

            vec2 mapToScreen(vec2 P)
            {
                return (P / outputResolution.xy * 2.0 - 1.0);
            }

            void main()
            {
                float lineIdx = floor(vertexIdx/2.0);

                // Sample rayData
                float pixelX = mod(lineIdx, rayDataResolution.x);
                float pixelY = floor(lineIdx / rayDataResolution.x);
                // Calculate the texture coordinates for the center of the texel corresponding to vertexIdx
                vec2 texCoords = (vec2(pixelX, pixelY) + 0.5) / rayDataResolution;
                // Sample the rayData texture at the calculated UV coordinates
                vec4 rayData = texture2D(rayDataTexture, texCoords);

                vec4 hitData = texture2D(hitDataTexture, texCoords);

                // Extract the position and direction from the sampled data
                vec2 rayPos = rayData.xy;
                vec2 hitPos = hitData.xy;

                bool IsLineStartPoint = modI(vertexIdx, 2.0) < 1.0;
                if(IsLineStartPoint){
                    vec2 screenPos = mapToScreen(rayPos);
                    gl_Position = vec4(screenPos, 0, 1);
                }
                else
                {
                    vec2 screenPos = mapToScreen(hitPos);
                    gl_Position = vec4(screenPos, 0, 1);
                }
            }`,

        frag:`precision mediump float;
        uniform vec4 rayColor;
        void main()
        {
            gl_FragColor = vec4(rayColor);
        }`
    })();
}

/**
* Draw rays based on rayDataTexture and hitDataTexture
* 
* @param {Texture} linesTexture - Texture containing Lines data in vec4(startPos, endPos).
*/
function drawLines(regl, {
    lineCount,
    lineDataTexture,
    outputResolution,
    lineColor=[0.9,0.5,0.0,0.3]
}={}){
    regl({
        // viewport: {x: 0, y: 0, w: 1, h: 1},
        depth: { enable: false },
        primitive: "lines",
        attributes: {
            vertexIdx: _.range(lineCount*2),
        },
        count: rayCount*2,
        uniforms:{
            lineDataTexture: lineDataTexture,
            lineDataResolution: [lineDataTexture.width, lineDataTexture.height],
            outputResolution: outputResolution,
            lineColor: lineColor
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
        vert: `precision mediump float;

            attribute float vertexIdx;
            uniform sampler2D lineDataTexture;
            uniform vec2 lineDataResolution;
            
            uniform vec2 outputResolution;

            float modI(float a,float b)
            {
                float m = a-floor((a+0.5)/b)*b;
                return floor(m+0.5);
            }

            vec2 mapToScreen(vec2 P)
            {
                return (P / outputResolution.xy * 2.0 - 1.0);
            }

            struct Line{
                vec2 start;
                vec2 end;
            };

            void main()
            {
                float lineIdx = floor(vertexIdx/2.0);

                // Sample lineData
                float pixelX = mod(lineIdx, lineDataResolution.x);
                float pixelY = floor(lineIdx / lineDataResolution.x);
                // Calculate the texture coordinates for the center of the texel corresponding to vertexIdx
                vec2 texCoords = (vec2(pixelX, pixelY) + 0.5) / rayDataResolution;
                // Sample the rayData texture at the calculated UV coordinates
                vec4 lineData = texture2D(lineDataTexture, texCoords);

                // Extract the start and End pos from the sampled data
                vec2 lineStart = lineData.xy;
                vec2 lineEnd = lineData.wz;

                bool IsLineStartPoint = modI(vertexIdx, 2.0) < 1.0;
                if(IsLineStartPoint){
                    vec2 screenPos = mapToScreen(lineStart);
                    gl_Position = vec4(screenPos, 0, 1);
                }
                else
                {
                    vec2 screenPos = mapToScreen(lineEnd);
                    gl_Position = vec4(screenPos, 0, 1);
                }
            }`,

        frag:`precision mediump float;
        uniform vec4 rayColor;
        void main()
        {
            gl_FragColor = vec4(rayColor);
        }`
    })();
}

/**
* Create secondary rays 
* 
* @param {Framebuffer} params.outputFramebuffer - Trget framebuffer to render secondary rays in vec4(pos, dir).
* @param {[Array]} params.outputResolution - Resolution of the output [width, height].
* @param {Texture} params.incidentRaysTexture - Texture containing ray data in vec4(pos, dir).
* @param {Texture} params.hitDataTexture - Texture containing hit data in vec4(pos, normal).
*/
function raytraceSecondaryRays(regl, {
    outputFramebuffer,
    outputResolution,
    incidentRaysTexture,
    hitDataTexture
}){
    regl({...QUAD, vert:PASS_THROUGH_VERTEX_SHADER,
        framebuffer: outputFramebuffer,
        uniforms:{
            outputResolution: outputResolution,
            incidentRaysTexture: incidentRaysTexture,
            rayDataResolution: [incidentRaysTexture.width, incidentRaysTexture.height],
            hitDataTexture: hitDataTexture,
            hitDataResolution: [hitDataTexture.width, hitDataTexture.height]
        },
        frag:`precision mediump float;
        uniform vec2 outputResolution;
        uniform sampler2D incidentRaysTexture;
        uniform vec2 rayDataResolution;
        uniform sampler2D hitDataTexture;
        uniform vec2 hitDataResolution;
        void main()
        {

            vec2 rayDir = texture2D(incidentRaysTexture, gl_FragCoord.xy/outputResolution.xy).zw;

            vec4 hitData = texture2D(hitDataTexture, gl_FragCoord.xy/outputResolution.xy);
            vec2 hitNormal = hitData.zw;
            vec2 hitPos = hitData.xy;

            vec2 secondaryDir = reflect(normalize(rayDir), normalize(hitNormal));
            vec2 secondaryPos = hitPos;
            gl_FragColor = vec4(secondaryPos, secondaryDir);
        }`
    })()
}

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

        drawSceneToSDF(regl, {
            framebuffer: this.sdfFbo,
            circleData: circleData,
            outputResolution: [512,512]
        });
        
        drawTexture(regl, {
            framebuffer: null,
            texture: this.sdfTexture, 
            outputResolution: [512,512],
            exposure: 0.001
        });

        /*
        Upload initial lightrays to texture
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

        // intersectRaysWithSDF(regl, {
        //     framebuffer: this.hitDataFbo, 
        //     outputResolution: [512,512],
        //     rayDataTexture: this.rayDataTexture,
        //     sdfTexture:this.sdfTexture
        // });

        

        intersectRaysWithCSG(regl, {
            framebuffer: this.hitDataFbo,
            incidentRayDataTexture: this.rayDataTexture,
            csg: [[50,50,150]], //Circle[centerX,centerY,radius]
        });
        
        /* 
        Draw rays stored on texture 
        */
        drawRays(regl, {
            rayCount: RayCount,
            rayDataTexture: this.rayDataTexture,
            hitDataTexture: this.hitDataTexture,
            outputResolution: [512,512],
            rayColor: [1,1,1,100.0/this.LightSamples]
        });

        /*
         * RAYTRACE Bounces 
         */
        const MAX_BOUNCE = 2 ;
        for(let i=0; i<MAX_BOUNCE; i++)
        {
            raytraceSecondaryRays(regl, {
                outputFramebuffer: this.secondaryRayDataFbo,
                outputResolution: [dataWidth, dataHeight],
                incidentRaysTexture: this.rayDataFbo, 
                hitDataTexture: this.hitDataFbo
            });

            // reformat hitpoints to match the rays count
            this.secondaryHitDataTexture({
                width: dataWidth,
                height: dataHeight,
                format: "rgba",
                type: "float"
            });

            // intrsect secondary rays with sdf
            intersectRaysWithSDF(regl, {
                framebuffer: this.secondaryHitDataFbo, 
                outputResolution: [512,512],
                rayDataTexture: this.secondaryRayDataFbo,
                sdfTexture:this.sdfTexture
            });

            // draw secondary rays
            drawRays(regl, {
                rayCount: RayCount,
                rayDataTexture: this.secondaryRayDataFbo,
                hitDataTexture: this.secondaryHitDataFbo,
                outputResolution: [512,512],
                rayColor: [1,1,1,100.0/this.LightSamples]
            });

            // swap buffers
            [this.rayDataFbo, this.secondaryRayDataFbo] = [this.secondaryRayDataFbo, this.rayDataFbo]
            // [this.rayDataTexture, this.secondaryRayDataTexture] = [this.secondaryRayDataTexture, this.rayDataTexture];
            [this.hitDataFbo, this.secondaryHitDataFbo] = [this.secondaryHitDataFbo, this.hitDataFbo]
            // [this.hitDataTexture, this.secondaryHitDataTexture] = [this.secondaryHitDataTexture, this.hitDataTexture]
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

