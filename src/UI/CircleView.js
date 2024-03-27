import React, {useState} from "react"
import Manipulator from "./Manipulator.js";
const h = React.createElement;

const CircleView = ({
    objKey,
    circle,
    updateSceneObject
})=>{
    return h("g", null, 
        h("circle", {
            className: "shape ",
            cx: circle.x, 
            cy: circle.y, 
            r: circle.radius
        }),
        h(Manipulator, {
            onDrag: e=>updateSceneObject(objKey, {
                radius: Math.hypot(e.sceneX-circle.x, e.sceneY-circle.y)
            })
        }, 
            h("circle", {
                className: "shape ",
                cx: circle.x, 
                cy: circle.y, 
                r:circle.radius,
                style: {fill: "none", cursor: "nw-resize"}
            })
        )
    )
};

export default CircleView;