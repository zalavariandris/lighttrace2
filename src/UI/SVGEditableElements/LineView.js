
import React, {useState} from "react"
import Manipulator from "../Manipulator.js";
const h = React.createElement;


const LineView = ({
    x1,y1,x2,y2,
    onChange=(value)=>{},
    className,
    ...props
})=>{
        return h(Manipulator, {           
            referenceX: x1,
            referenceY: y1,
            onDrag: e=>onChange({
                x1: e.sceneX+e.referenceOffsetX, 
                y1: e.sceneY+e.referenceOffsetY,
                x2: e.sceneX+e.referenceOffsetX+x2-x1, 
                y2: e.sceneY+e.referenceOffsetY+y2-y1, 
            }),
            className: [className].filter(v=>v?true:false).join(" "),
        },
            h('line', {
                x1,
                y1,
                x2,
                y2,
                className: 'shape',
                ...props
            }),
            h(Manipulator, {
                className: "manip",
                onDragStart: (e)=>console.log(e),
                onDrag: (e)=>{
                    onChange({x2, y2,
                        x1: e.sceneX,
                        y1: e.sceneY
                    });
                },
            }, h("circle", {
                className: "handle",
                cx: x1, 
                cy: y1, 
                r:5,
                style: {cursor: "move"}
            })),
            h(Manipulator, {
                onDragStart: (e)=>console.log(e),
                onDrag: (e)=>{
                    onChange({x1,y1,
                        x2: e.sceneX,
                        y2: e.sceneY
                    });
                },
                className: "manip",
            }, h("circle", {
                className: "handle",
                cx: x2, 
                cy: y2, 
                r: 5,
                style: {cursor: "move"}
            }))
        )
}

export default LineView;