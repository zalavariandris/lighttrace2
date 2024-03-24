import React, {useState} from "react"
import {Point, Vector} from "../geo.js"
import Manipulator from "./Manipulator.js";

const h = React.createElement;

function LineSegmentItem({
    lineSegment,
    onChange,
    className,
    ...props
}){
    const grabOffsetP1 = React.useRef();
    const grabOffsetP2 = React.useRef();

    
    const setP1 = (Px, Py)=>{
        const newLineSegment = lineSegment.copy()
        newLineSegment.p1 = new Point(Px, Py)
        onChange(lineSegment, newLineSegment)
    }
    const setP2 = (Px, Py)=>{
        const newLineSegment = lineSegment.copy()
        newLineSegment.p2 = new Point(Px, Py)
        onChange(lineSegment, newLineSegment)
    }

    const handleShapeDragStart = (e)=>{
        grabOffsetP1.current = {x: e.sceneX-lineSegment.p1.x, y: e.sceneY-lineSegment.p1.y};
        grabOffsetP2.current = {x: e.sceneX-lineSegment.p2.x, y: e.sceneY-lineSegment.p2.y};
    }

    const handleShapeDrag = (e)=>{
        const newLineSegment = lineSegment.copy()
        newLineSegment.p1.x = e.sceneX-grabOffsetP1.current.x;
        newLineSegment.p1.y = e.sceneY-grabOffsetP1.current.y;
        newLineSegment.p2.x = e.sceneX-grabOffsetP2.current.x;
        newLineSegment.p2.y = e.sceneY-grabOffsetP2.current.y;
        onChange(lineSegment, newLineSegment)
    }

    const handleP1DragStart = e=>{
        grabOffsetP1.current = {x: e.sceneX-lineSegment.p1.x, y: e.sceneY-lineSegment.p1.y};
    }
    const handleP1Drag = e=>{
        const newLineSegment = lineSegment.copy()
        newLineSegment.p1.x = e.sceneX-grabOffsetP1.current.x;
        newLineSegment.p1.y = e.sceneY-grabOffsetP1.current.y;
        onChange(lineSegment, newLineSegment)
    }

    const handleP2DragStart = e=>{
        grabOffsetP2.current = {x: e.sceneX-lineSegment.p2.x, y: e.sceneY-lineSegment.p2.y};
    }
    const handleP2Drag = e=>{
        const newLineSegment = lineSegment.copy()
        newLineSegment.p2.x = e.sceneX-grabOffsetP2.current.x;
        newLineSegment.p2.y = e.sceneY-grabOffsetP2.current.y;
        onChange(lineSegment, newLineSegment)
    }

    const materialName = lineSegment.material.constructor.name;

    return h(Manipulator, {
        onDragStart: (e)=>handleShapeDragStart(e),
        onDrag: (e)=>handleShapeDrag(e),
        className: ["sceneItem shape lineSegment", materialName, className].filter(item=>item?true:false).join(" "),
        ...props
    }, 
        h('line', {
            x1: lineSegment.p1.x,
            y1: lineSegment.p1.y,
            x2: lineSegment.p2.x,
            y2: lineSegment.p2.y,
            className: 'shape'
            // onMouseDown: ()=>this.selectObject(shape)
        }),
        h(Manipulator, {
            onDragStart: (e)=>handleP1DragStart(e),
            onDrag: (e)=>handleP1Drag(e)
        }, h("circle", {cx: lineSegment.p1.x, cy:lineSegment.p1.y, r:5})),
        h(Manipulator, {
            onDragStart: (e)=>handleP1DragStart(e),
            onDrag: (e)=>handleP1Drag(e)
        }, h("circle", {
            cx: lineSegment.p1.x, 
            cy:lineSegment.p1.y, 
            r:5,
            style: {cursor: "move"}
        })),
        h(Manipulator, {
            onDragStart: (e)=>handleP2DragStart(e),
            onDrag: (e)=>handleP2Drag(e)
        }, h("circle", {
            cx: lineSegment.p2.x, 
            cy:lineSegment.p2.y, 
            r:5,
            style: {cursor: "move"}
        }))
    )
}

export default LineSegmentItem