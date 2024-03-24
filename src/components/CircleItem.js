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
        newCircle.center.x = x
        newCircle.center.y = y
        onChange(circle, newCircle)
    }

    const grabOffset = React.useRef();

    const materialName = circle.material.constructor.name;

    const grabRadiusOffset = React.useRef({x:0, y:0})
    const handleRadiusDragStart = e=>{
        grabRadiusOffset.current = {
            x: e.sceneX-circle.center.x, 
            y: e.sceneY-circle.center.y
        };
    }
    const handleRadiusDrag = e=>{
        const dx = e.sceneX-circle.center.x;
        const dy = e.sceneY-circle.center.y;
        const d = Math.sqrt(dx**2+dy**2);

        const newCircle = circle.copy()
        newCircle.radius = d;
        onChange(circle, newCircle)
    }

    return h(Manipulator, {
            onMouseDown: (e)=>console.log("native event still works!"),
            onDragStart: (e)=>grabOffset.current = {x: e.sceneX-circle.center.x, y: e.sceneY-circle.center.y},
            onDrag: (e)=>setPos(e.sceneX-grabOffset.current.x, e.sceneY-grabOffset.current.y),
            showGuide: false,
            className: ['sceneItem shape circle', materialName, className].filter(item=>item?true:false).join(" "),
            ...props
        },
        h("circle", {
            cx: circle.center.x,
            cy: circle.center.y,
            r: circle.radius,
            className: "handle shape"
        }),
        h(Manipulator, {
            onDragStart: e=>handleRadiusDragStart(e),
            onDrag: e=>handleRadiusDrag(e)
        }, h("circle", {
            cx: circle.center.x,
            cy: circle.center.y,
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