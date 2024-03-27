import React, {useState} from "react"
import Manipulator from "../Manipulator.js";
const h = React.createElement;

const RectView = ({
    x,y,width, height, 
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
        })
    )
}

export default RectView;