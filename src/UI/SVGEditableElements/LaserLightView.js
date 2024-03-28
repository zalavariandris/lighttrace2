import React, {useState} from "react"
import Manipulator from "../Manipulator.js";
import {colorFromRGB, wavelengthToRGB} from "../../scene/colorUtils.js"

const h = React.createElement;

const LaserLightView = ({
    light,
    onChange=(value)=>{},
    className,
    ...props
})=>{
    return h(Manipulator, {           
        referenceX: light.x,
        referenceY: light.y,
        onDrag: e=>onChange({...light,
            x: e.sceneX+e.referenceOffsetX, 
            y: e.sceneY+e.referenceOffsetY
        }),
        className: [className].filter(v=>v?true:false).join(" "),
    },
        h('circle', {
            cx: light.x,
            cy: light.y,
            r: 2,
            vectorEffect: "non-scaling-stroke",
            className: "shape",
            style: {
                fill: colorFromRGB(wavelengthToRGB(light.wavelength))
            },
            ...props
        }),
        h(Manipulator, {
            onDrag: e=>{
                onChange({...light, 
                    angle: Math.atan2(e.sceneY-light.y, e.sceneX-light.x)
                });
            },
            className: "manip",
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