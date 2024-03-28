import React, {useState} from "react"
import Manipulator from "../Manipulator.js";
import {colorFromRGB, wavelengthToRGB} from "../../scene/colorUtils.js"

const h = React.createElement;

const PointLightView = ({
    cx, cy, angle, style,
    onChange=(value)=>{},
    className,
    ...props
})=>{
    return h(Manipulator, {           
        referenceX: cx,
        referenceY: cy,
        onDrag: e=>onChange({
            cx: e.sceneX+e.referenceOffsetX, 
            cy: e.sceneY+e.referenceOffsetY,
            angle
        }),
        className: [className].filter(v=>v?true:false).join(" "),
    },
        h('circle', {
            cx: cx,
            cy: cy,
            r: 6,
            vectorEffect: "non-scaling-stroke",
            className: "shape",
            style: {
                ...style
            },
            ...props
        }),
        h(Manipulator, {
            onDrag: (e)=>{
                onChange({cx, cy, 
                    angle: Math.atan2(e.sceneY-cy, e.sceneX-cx)
                });
            },
            className:"manip",
            showGuide: false
        }, h("circle", {
            cx: cx+Math.cos(angle)*50,
            cy: cy+Math.sin(angle)*50,
            r: 5,
            className: "handle"
        }))
    )
}

export default PointLightView;