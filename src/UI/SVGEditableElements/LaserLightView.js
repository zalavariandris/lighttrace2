import React, {useState} from "react"
import Manipulator from "../Manipulator.js";
import {colorFromRGB, wavelengthToRGB} from "../../scene/colorUtils.js"

const h = React.createElement;

const LaserLightView = ({
    x, 
    y,
    wavelength, 
    intensity,
    angle,
    onChange=(value)=>{},
    className,
    ...props
})=>{
    return h(Manipulator, {           
        referenceX: x,
        referenceY: y,
        onDrag: e=>onChange({wavelength, intensity, angle,
            x: e.sceneX+e.referenceOffsetX, 
            y: e.sceneY+e.referenceOffsetY
        }),
        className: [className].filter(v=>v?true:false).join(" "),
    },
        h('circle', {
            cx: x,
            cy: y,
            r: 2,
            vectorEffect: "non-scaling-stroke",
            className: "shape",
            style: {
                fill: colorFromRGB(wavelengthToRGB(wavelength))
            },
            ...props
        }),
        h(Manipulator, {
            onDrag: e=>{
                onChange({x,y,wavelength, intensity, 
                    angle: Math.atan2(e.sceneY-y, e.sceneX-x)
                });
            },
            className: "manip",
            showGuide: false
        }, h("circle", {
            cx: x+Math.cos(angle)*50,
            cy: y+Math.sin(angle)*50,
            r: 5,
            className: "handle"
        }))
    );
}

export default LaserLightView;