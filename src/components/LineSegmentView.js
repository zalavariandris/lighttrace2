
import React, {useState} from "react"
import Manipulator from "../manipulators/Manipulator.js";
const h = React.createElement;


const LineSegmentView = ({
    lineSegment, updateSceneObject
})=>{
        return h("g", null, 
            h('line', {
                x1: lineSegment.Ax,
                y1: lineSegment.Ay,
                x2: lineSegment.Bx,
                y2: lineSegment.By,
                className: 'shape'
                // onMouseDown: ()=>this.selectObject(shape)
            }),
            h(Manipulator, {
                onDragStart: (e)=>console.log(e),
                onDrag: (e)=>updateSceneObject(lineSegment.key, {
                    Ax: e.sceneX,
                    Ay: e.sceneY
                })
            }, h("circle", {
                cx: lineSegment.Ax, 
                cy: lineSegment.Ay, 
                r:5,
                style: {cursor: "move"}
            })),
            h(Manipulator, {
                onDragStart: (e)=>console.log(e),
                onDrag: (e)=>updateSceneObject(lineSegment.key, {
                    Bx: e.sceneX,
                    By: e.sceneY
                })
            }, h("circle", {
                cx: lineSegment.Bx, 
                cy: lineSegment.By, 
                r: 5,
                style: {cursor: "move"}
            }))
        )
}

export default LineSegmentView;