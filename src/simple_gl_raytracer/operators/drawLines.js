import _ from "lodash"
/**
* Draw rays based on rayDataTexture and hitDataTexture
* 
* @param {int} params.linesCount - umber of lines to draw
* @param {Texture} params.startpoints - Texture containing startpoints XY data in RedGreen channels
* @param {Texture} params.endpoints - exture containing endpoints XY data in RedGreen channels
* @param {[Array]} params.outputResolution - Resolution of the output [width, height].
*/
function drawLines(regl, {
    linesCount,
    startpoints,
    endpoints,
    outputResolution,
    linesColor=[0.9,0.5,0.0,0.3]
}={})
{
    regl({
        // viewport: {x: 0, y: 0, w: 1, h: 1},
        depth: { enable: false },
        primitive: "lines",
        attributes: {
            vertexIdx: _.range(linesCount*2),
        },
        count: linesCount*2,
        uniforms:{
            startpointsTexture: startpoints,
            startpointsResolution: [startpoints.width, startpoints.height],
            endpointsTexture: endpoints,
            endpointsResolution: [endpoints.width, endpoints.height],
            outputResolution: outputResolution,
            lineColor: linesColor
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
            uniform sampler2D startpointsTexture;
            uniform vec2 startpointsResolution;
            uniform sampler2D endpointsTexture;
            uniform vec2 endpointsResolution;
            
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

                bool IsLineStartPoint = modI(vertexIdx, 2.0) < 1.0;
                if(IsLineStartPoint)
                {
                    // Unpack startpoint
                    float pixelX = mod(lineIdx, startpointsResolution.x);
                    float pixelY = floor(lineIdx / startpointsResolution.x);
                    vec2 texCoords = (vec2(pixelX, pixelY) + 0.5) / startpointsResolution;
                    vec2 startPoint = texture2D(startpointsTexture, texCoords).xy;

                    // map world position to screen
                    vec2 screenPos = mapToScreen(startPoint);
                    gl_Position = vec4(screenPos, 0, 1);
                }
                else
                {
                    // Unpack endpoint
                    float pixelX = mod(lineIdx, endpointsResolution.x);
                    float pixelY = floor(lineIdx / endpointsResolution.x);
                    vec2 texCoords = (vec2(pixelX, pixelY) + 0.5) / endpointsResolution;
                    vec2 endPoint = texture2D(endpointsTexture, texCoords).xy;

                    vec2 screenPos = mapToScreen(endPoint);
                    gl_Position = vec4(screenPos, 0, 1);
                }
            }`,

        frag:`precision mediump float;
        uniform vec4 lineColor;
        void main()
        {
            gl_FragColor = vec4(lineColor);
        }`
    })();
}

export {drawLines}