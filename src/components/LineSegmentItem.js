import React, {useState} from "react"
import {Point, Vector} from "../geo.js"
import PointManip from "./PointManip.js";
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

    const handleDragStart = (e)=>{
        grabOffsetP1.current = {x: e.sceneX-lineSegment.p1.x, y: e.sceneY-lineSegment.p1.y};
        grabOffsetP2.current = {x: e.sceneX-lineSegment.p2.x, y: e.sceneY-lineSegment.p2.y};
    }

    const handleDrag = (e)=>{

        const newLineSegment = lineSegment.copy()
        newLineSegment.p1.x = e.sceneX-grabOffsetP1.current.x;
        newLineSegment.p1.y = e.sceneY-grabOffsetP1.current.y;
        newLineSegment.p2.x = e.sceneX-grabOffsetP2.current.x;
        newLineSegment.p2.y = e.sceneY-grabOffsetP2.current.y;
        onChange(lineSegment, newLineSegment)
    }

    const materialName = lineSegment.material.constructor.name;

    return h(Manipulator, {
        onDragStart: (e)=>handleDragStart(e),
        onDrag: (e)=>handleDrag(e),
        className: ["sceneItem shape lineSegment", materialName, className].filter(item=>item?true:false).join(" "),
        ...props
    }, 
        h('line', {
            x1: lineSegment.p1.x,
            y1: lineSegment.p1.y,
            x2: lineSegment.p2.x,
            y2: lineSegment.p2.y,
            className: 'shape',
            vectorEffect: "non-scaling-stroke",
            strokeWidth: "5px"
            // onMouseDown: ()=>this.selectObject(shape)
        }),
        h(PointManip, {
            x: lineSegment.p1.x, 
            y: lineSegment.p1.y,
            onChange: (x, y)=>setP1(x, y)
        }),
        h(PointManip, {
            x: lineSegment.p2.x, 
            y: lineSegment.p2.y,
            onChange: (x, y)=>setP2(x, y)
        })
    )
}

export default LineSegmentItem