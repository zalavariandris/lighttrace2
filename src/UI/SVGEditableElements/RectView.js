import React, {useState} from "react"
import Manipulator from "../Manipulator.js";
const h = React.createElement;

const RectView = ({
    x,y, width, height, 
    onChange=()=>{}
})=>{
    return h(Manipulator, {           
        referenceX: x,
        referenceY: y,
        onDrag: e=>onChange({width, height,
            x: e.sceneX+e.referenceOffsetX, 
            y: e.sceneY+e.referenceOffsetY
        }),
    },
        h('rect', {
            x: x,
            y: y,
            width: width,
            height: height,
            vectorEffect: "non-scaling-stroke",
            className: "handle shape"
        }),
        h(Manipulator, {
            referenceX: x+width/2,
            referenceY: y+height/2,
            showReference:true,
            onDrag: e=>onChange({
                x:e.referenceX-Math.abs(e.sceneX-e.referenceX),
                y:e.referenceY-Math.abs(e.sceneY-e.referenceY), 
                width: Math.abs(e.sceneX-e.referenceX)*2,
                height: Math.abs(e.sceneY-e.referenceY)*2
            })
        }, 
            h('rect', {
                x: x,
                y: y,
                width: width,
                height: height,
                vectorEffect: "non-scaling-stroke",
                style: {
                    stroke: "transparent",
                    strokeWidth: 10,
                    fill: "none", 
                    cursor: "nw-resize"
                }
            }),
        )
    )
}

export default RectView;