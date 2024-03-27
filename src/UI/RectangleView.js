import React, {useState} from "react"
import Manipulator from "./Manipulator.js";
const h = React.createElement;

const RectangleView = ({
    rectangle, updateSceneObject
})=>{
    return h("g", null, 
        h('rect', {
            x: rectangle.x - rectangle.width / 2,
            y: rectangle.y - rectangle.height / 2,
            width: rectangle.width,
            height: rectangle.height,
            vectorEffect: "non-scaling-stroke",
            className: "handle shape"
        })
    )
}

export default RectangleView;