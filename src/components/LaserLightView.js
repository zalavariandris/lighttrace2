import React, {useState} from "react"
import Manipulator from "../manipulators/Manipulator.js";
import {colorFromRGB, wavelengthToRGB} from "../colorUtils.js"

const h = React.createElement;

const LaserLightView = ({
    light, updateSceneObject
})=>{
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

export default LaserLightView;