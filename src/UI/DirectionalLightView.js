
import React, {useState} from "react"
import Manipulator from "./Manipulator.js";
const h = React.createElement;

import {colorFromRGB, wavelengthToRGB} from "../colorUtils.js"

const DirectionalLightView = ({
    objKey,
    light,
    updateSceneObject
})=>{
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
            referenceX: light.x+Math.cos(light.angle)*50,
            referenceY: light.y+Math.sin(light.angle)*50,
            onDrag: (e)=>updateSceneObject(objKey, {
                angle: Math.atan2(e.sceneY+e.referenceOffsetY-light.y, e.sceneX+e.referenceOffsetX-light.x)
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
            onDrag: e=>updateSceneObject(objKey, {
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
};

export default DirectionalLightView;