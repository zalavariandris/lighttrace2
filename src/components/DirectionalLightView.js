
import React, {useState} from "react"
import Manipulator from "../manipulators/Manipulator.js";
const h = React.createElement;

import {colorFromRGB, wavelengthToRGB} from "../colorUtils.js"

const DirectionalLightView = ({
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
};

export default DirectionalLightView;