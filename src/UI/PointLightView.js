import React, {useState} from "react"
import Manipulator from "./Manipulator.js";
import {colorFromRGB, wavelengthToRGB} from "../colorUtils.js"

const h = React.createElement;

const PointLightView = ({
    objKey, light, updateSceneObject
})=>{
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
            onDrag: (e)=>updateSceneObject(objKey, {
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

export default PointLightView;