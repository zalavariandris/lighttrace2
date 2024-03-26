import React, {useState} from "react"

import Shape from "../scene/shapes/Shape.js";
import Circle from "../scene/shapes/Circle.js"
import LineSegment from "../scene/shapes/LineSegment.js"
import Rectangle from "../scene/shapes/Rectangle.js"
import SphericalLens from "../scene/shapes/SphericalLens.js"

import Light from "../scene/lights/Light.js"
import PointLight from "../scene/lights/PointLight.js"
import LaserLight from "../scene/lights/LaserLight.js"
import DirectionalLight from "../scene/lights/DirectionalLight.js"

import Manipulator from "../manipulators/Manipulator.js";

import {colorFromRGB, wavelengthToRGB} from "../colorUtils.js"

const h = React.createElement;

const ShapeView = ({
    sceneObject,
    updateSceneObject
})=>{
    if(sceneObject instanceof Circle)
    {
        return h("g", null, 
            h("circle", {
                className: "shape ",
                cx: sceneObject.x, 
                cy: sceneObject.y, 
                r: sceneObject.radius
            }),
            h(Manipulator, {
                onDrag: e=>updateSceneObject(sceneObject.key, {
                    radius: Math.hypot(e.sceneX-sceneObject.x, e.sceneY-sceneObject.y)
                })
            }, 
                h("circle", {
                    className: "shape ",
                    cx: sceneObject.x, 
                    cy: sceneObject.y, 
                    r:sceneObject.radius,
                    style: {fill: "none", cursor: "nw-resize"}
                })
            )
        )
    }
    else if(sceneObject instanceof DirectionalLight)
    {
        const light = sceneObject;
        return h("g", null, 
            h('rect', {
                x: light.x-6,
                y: light.y-light.width/2,
                width: 6,
                height: light.width,
                vectorEffect: "non-scaling-stroke",
                className: "shape",
                style: {
                    transform: `rotate(${light.angle*180/Math.PI}deg)`,
                    transformOrigin: `${light.x}px ${light.y}px`,
                    fill: colorFromRGB(wavelengthToRGB(light.wavelength))
                }
            }),
            h(Manipulator, {
                onDrag: (e)=>updateSceneObject(light.key, {
                    angle: Math.atan2(e.sceneY-light.y, e.sceneX-light.x)
                }),
                className:"manip",
                showGuide: false
            }, h("circle", {
                cx: light.x+Math.cos(light.angle)*50,
                cy: light.y+Math.sin(light.angle)*50,
                r: 5,
                className: "handle"
            })),
            h(Manipulator, {
                onDragStart: e=>console.log(e),
                onDrag: e=>updateSceneObject(light.key, {
                    width: Math.hypot(e.sceneX-light.x, e.sceneY-light.y)*2
                }),
                className:"manip"
            }, h("circle", {
                cx: light.x+Math.cos(light.angle)*-3+Math.cos(light.angle+Math.PI/2)*light.width/2,
                cy: light.y+Math.sin(light.angle)*-3+Math.sin(light.angle+Math.PI/2)*light.width/2,
                r:4,
                style: {cursor: "ns-resize"},
                className: "handle"
            }))
        )
    }
    else if(sceneObject instanceof LaserLight)
    {
        const light = sceneObject;
        return h("g", null, 
            h('circle', {
                cx: light.x,
                cy: light.y,
                r: 2,
                vectorEffect: "non-scaling-stroke",
                className: "shape",
                style: {
                    fill: colorFromRGB(wavelengthToRGB(light.wavelength))
                }
            }),
            h(Manipulator, {
                onDrag: (e)=>updateSceneObject(light.key, {
                    angle: Math.atan2(e.sceneY-light.y, e.sceneX-light.x)
                }),
                className:"manip",
                showGuide: false
            }, h("circle", {
                cx: light.x+Math.cos(light.angle)*50,
                cy: light.y+Math.sin(light.angle)*50,
                r: 5,
                className: "handle"
            }))
        );
    }
    else if(sceneObject instanceof PointLight)
    {
        const light = sceneObject;
        return h("g", null, 
            h('circle', {
                cx: light.x,
                cy: light.y,
                r: 6,
                vectorEffect: "non-scaling-stroke",
                className: "shape",
                style: {
                    fill: colorFromRGB(wavelengthToRGB(light.wavelength))
                }
            }),
            h(Manipulator, {
                onDrag: (e)=>updateSceneObject(light.key, {
                    angle: Math.atan2(e.sceneY-light.y, e.sceneX-light.x)
                }),
                className:"manip",
                showGuide: false
            }, h("circle", {
                cx: light.x+Math.cos(light.angle)*50,
                cy: light.y+Math.sin(light.angle)*50,
                r: 5,
                className: "handle"
            }))
        )
    }
    else if(sceneObject instanceof Rectangle)
    {
        const rectangle = sceneObject;
        return h("g", null, 
            h('rect', {
                x: rectangle.x - rectangle.width / 2,
                y: rectangle.y - rectangle.height / 2,
                width: rectangle.width,
                height: rectangle.height,
                vectorEffect: "non-scaling-stroke",
                className: "handle shape"
            })
        )
    }
    else if(sceneObject instanceof LineSegment)
    {
        const lineSegment = sceneObject;
        return h("g", null, 
            h('line', {
                x1: lineSegment.Ax,
                y1: lineSegment.Ay,
                x2: lineSegment.Bx,
                y2: lineSegment.By,
                className: 'shape'
                // onMouseDown: ()=>this.selectObject(shape)
            }),
            h(Manipulator, {
                onDragStart: (e)=>console.log(e),
                onDrag: (e)=>updateSceneObject(lineSegment.key, {
                    Ax: e.sceneX,
                    Ay: e.sceneY
                })
            }, h("circle", {
                cx: lineSegment.Ax, 
                cy: lineSegment.Ay, 
                r:5,
                style: {cursor: "move"}
            })),
            h(Manipulator, {
                onDragStart: (e)=>console.log(e),
                onDrag: (e)=>updateSceneObject(lineSegment.key, {
                    Bx: e.sceneX,
                    By: e.sceneY
                })
            }, h("circle", {
                cx: lineSegment.Bx, 
                cy: lineSegment.By, 
                r: 5,
                style: {cursor: "move"}
            }))
        )
    }
    else if(sceneObject instanceof SphericalLens)
    {
        function arcFromThreePoints({Sx, Sy, Mx, My, Ex, Ey})
        {
            const circle = Circle.fromThreePoints("temp", {x:Sx, y:Sy}, {x:Mx, y:My}, {x:Ex, y:Ey})
            const r = circle.radius;
            const [SEx, SEy] = [Ex - Sx, Ey - Sy];
            const [SMx, SMy] = [Mx - Sx, My - Sy];
            const crossProduct = SEx * SMy - SEy * SMx;
            const side = crossProduct>0 ? 0 : 1; // 0: Left, 1:right
            return `M ${Sx} ${Sy} `+
            `a ${Math.abs(r)} ${Math.abs(r)} 0 0 ${side} ${Ex-Sx} ${Ey-Sy} `;
        }

        const makePathFromLens = (lens)=>{
            return ""+
            arcFromThreePoints({
                Sx: lens.x-lens.edgeThickness/2, 
                Sy: lens.y-lens.diameter/2,
                Mx: lens.x-lens.centerThickness/2,
                My: lens.y,
                Ex: lens.x-lens.edgeThickness/2, 
                Ey: lens.y+lens.diameter/2
            })+
            `L ${lens.x+lens.edgeThickness/2} ${lens.y+lens.diameter/2}`+
            arcFromThreePoints({
                Sx: lens.x+lens.edgeThickness/2, 
                Sy: lens.y+lens.diameter/2,
                Mx: lens.x+lens.centerThickness/2,
                My: lens.y,
                Ex: lens.x+lens.edgeThickness/2, 
                Ey: lens.y-lens.diameter/2
            })+
            `L ${lens.x-lens.edgeThickness/2} ${lens.y-lens.diameter/2}` // this should wotk with close path 'Z'
        }

        const lens = sceneObject;
        return h("g", null, 
            h("path", {
                d: makePathFromLens(lens),
                className: "shape"
            }),
            h(Manipulator, {
                onDrag: e=>{
                    updateSceneObject(lens.key, {
                        centerThickness: (e.sceneX-lens.x)*2
                    })
                }
            }, h('circle', {
                className: "autohide",
                cx:lens.x+lens.centerThickness/2, 
                cy:lens.y,
                r: 5,
                vectorEffect: "non-scaling-stroke",
                style: {cursor: "ew-resize"}
            })),
            h(Manipulator, {
                onDrag: e=>{
                    const newEdgeThickness = Math.max(1, (e.sceneX-lens.x)*2);
                    updateSceneObject(lens.key, {
                        edgeThickness: newEdgeThickness,
                        centerThickness: Math.max(1, newEdgeThickness-lens.edgeThickness + lens.centerThickness),
                        diameter: Math.max(1, (e.sceneY-lens.y)*2),
                    })
                }
            }, h('circle', {
                className: "autohide",
                cx:lens.x+lens.edgeThickness/2, 
                cy:lens.y+lens.diameter/2,
                r: 5,
                vectorEffect: "non-scaling-stroke",
                style: {cursor: "nwse-resize"}
            })),
        )
    }
    else
    {
        return h("text", {
            className: "shape",
            x: sceneObject.x,
            y: sceneObject.y
        }, `${sceneObject.key}`)
    }
};

export default ShapeView;