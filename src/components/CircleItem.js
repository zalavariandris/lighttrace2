import React, {useState} from "react"
import Manipulator from "./Manipulator.js";

const h = React.createElement;

function CircleItem({
    circle,
    onChange,
    className,
    ...props
})
{
    const setPos = (x, y)=>{
        const newCircle = circle.copy()
        newCircle.x = x
        newCircle.y = y
        onChange(circle, newCircle)
    }

    const grabOffset = React.useRef();

    const materialName = circle.material.constructor.name;

    const grabRadiusOffset = React.useRef({x:0, y:0})
    const handleRadiusDragStart = e=>{
        grabRadiusOffset.current = {
            x: e.sceneX-circle.x, 
            y: e.sceneY-circle.y
        };
    }
    const handleRadiusDrag = e=>{
        const dx = e.sceneX-circle.x;
        const dy = e.sceneY-circle.y;
        const d = Math.sqrt(dx**2+dy**2);

        const newCircle = circle.copy()
        newCircle.radius = d;
        onChange(circle, newCircle)
    }

    return h(Manipulator, {
            onMouseDown: (e)=>console.log("native event still works!"),
            onDragStart: (e)=>grabOffset.current = {x: e.sceneX-circle.x, y: e.sceneY-circle.y},
            onDrag: (e)=>setPos(e.sceneX-grabOffset.current.x, e.sceneY-grabOffset.current.y),
            showGuide: false,
            className: ['sceneItem shape circle', materialName, className].filter(item=>item?true:false).join(" "),
            ...props
        },
        h("circle", {
            cx: circle.x,
            cy: circle.y,
            r: circle.radius,
            className: "handle shape"
        }),
        h(Manipulator, {
            onDragStart: e=>handleRadiusDragStart(e),
            onDrag: e=>handleRadiusDrag(e)
        }, h("circle", {
            cx: circle.x,
            cy: circle.y,
            r: circle.radius,
            stroke: "rgba(255,255,255,0)",
            strokeWidth: 10,
            fill: "none",
            style: {cursor: "nwse-resize"},
            vectorEffect: "non-scaling-stroke"
        }))
    )
}

export default CircleItem;