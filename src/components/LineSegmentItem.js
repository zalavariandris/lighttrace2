import React, {useState} from "react"
import {Point, Vector} from "../geo.js"
import Manipulator from "../manipulators/Manipulator.js";

const h = React.createElement;

function LineSegmentItem({
    lineSegment,
    onChange,
    className,
    ...props
}){
    const grabOffsetP1 = React.useRef();
    const grabOffsetP2 = React.useRef();


    const handleShapeDragStart = (e)=>{
        grabOffsetP1.current = {x: e.sceneX-lineSegment.Ax, y: e.sceneY-lineSegment.Ay};
        grabOffsetP2.current = {x: e.sceneX-lineSegment.Bx, y: e.sceneY-lineSegment.By};
    }

    const handleShapeDrag = (e)=>{
        onChange(lineSegment.key, {
            Ax: e.sceneX-grabOffsetP1.current.x,
            Ay: e.sceneY-grabOffsetP1.current.y,
            Bx: e.sceneX-grabOffsetP2.current.x,
            By: e.sceneY-grabOffsetP2.current.y
        });
    }

    const handleP1DragStart = e=>{
        grabOffsetP1.current = {x: e.sceneX-lineSegment.Ax, y: e.sceneY-lineSegment.Ay};
    }
    const handleP1Drag = e=>{
        onChange(lineSegment.key, {
            Ax: e.sceneX-grabOffsetP1.current.x,
            Ay: e.sceneY-grabOffsetP1.current.y
        });
    }

    const handleP2DragStart = e=>{
        grabOffsetP2.current = {x: e.sceneX-lineSegment.Bx, y: e.sceneY-lineSegment.By};
    }
    const handleP2Drag = e=>{
        onChange(lineSegment.key, {
            Bx: e.sceneX-grabOffsetP2.current.x,
            By: e.sceneY-grabOffsetP2.current.y
        });
    }

    const materialName = lineSegment.material.constructor.name;

    return h(Manipulator, {
        onDragStart: (e)=>handleShapeDragStart(e),
        onDrag: (e)=>handleShapeDrag(e),
        className: ["sceneItem shape lineSegment", materialName, className].filter(item=>item?true:false).join(" "),
        ...props
    }, 
        h('line', {
            x1: lineSegment.Ax,
            y1: lineSegment.Ay,
            x2: lineSegment.Bx,
            y2: lineSegment.By,
            className: 'shape'
            // onMouseDown: ()=>this.selectObject(shape)
        }),
        h(Manipulator, {
            onDragStart: (e)=>handleP1DragStart(e),
            onDrag: (e)=>handleP1Drag(e)
        }, h("circle", {cx: lineSegment.Ax, cy:lineSegment.Ay, r:5})),
        h(Manipulator, {
            onDragStart: (e)=>handleP1DragStart(e),
            onDrag: (e)=>handleP1Drag(e)
        }, h("circle", {
            cx: lineSegment.Ax, 
            cy:lineSegment.Ay, 
            r:5,
            style: {cursor: "move"}
        })),
        h(Manipulator, {
            onDragStart: (e)=>handleP2DragStart(e),
            onDrag: (e)=>handleP2Drag(e)
        }, h("circle", {
            cx: lineSegment.Bx, 
            cy:lineSegment.By, 
            r:5,
            style: {cursor: "move"}
        }))
    )
}

export default LineSegmentItem