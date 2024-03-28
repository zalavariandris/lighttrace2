import React, {useState} from "react"
import Manipulator from "../Manipulator.js";
const h = React.createElement;

const CircleView = ({
    cx,
    cy,
    r,
    onChange=(value)=>{},
    className,
    ...props
})=>{
    return h(Manipulator, {           
        referenceX: cx,
        referenceY: cy,
        onDrag: e=>onChange({r,
            cx: e.sceneX+e.referenceOffsetX, 
            cy: e.sceneY+e.referenceOffsetY
        }),
        className: [className].filter(v=>v?true:false).join(" "),
    },
        h("circle", {
            className: "shape",
            cx: cx, 
            cy: cy, 
            r: r,
            vectorEffect: "non-scaling-stroke",
            ...props

        }),
        h(Manipulator, {
            onDrag: e=>onChange({cx,cy, 
                r: Math.hypot(e.sceneX-cx, e.sceneY-cy)
            })
        }, 
            h("circle", {
                cx, 
                cy, 
                r,
                vectorEffect: "non-scaling-stroke",
                style: {
                    stroke: "transparent",
                    strokeWidth: 10,
                    fill: "none", 
                    cursor: "nw-resize"
                }
            })
        )
    )
};

export default CircleView;