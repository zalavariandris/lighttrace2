
import React, {useState} from "react"
import Manipulator from "../Manipulator.js";
const h = React.createElement;

const DirectionalLightView = ({
    x,
    y,
    angle,
    width,
    style,
    onChange=(value)=>{},
    className,
    ...props
})=>{
    return h(Manipulator, {           
        referenceX: x,
        referenceY: y,
        onDrag: e=>onChange({angle, width,
            x: e.sceneX+e.referenceOffsetX, 
            y: e.sceneY+e.referenceOffsetY
        }),
        className: [className].filter(v=>v?true:false).join(" "),
    },
        h('rect', {
            x: x-6,
            y: y-width/2,
            width: 6,
            height: width,
            vectorEffect: "non-scaling-stroke",
            className: "shape",
            style: {
                transform: `rotate(${angle*180/Math.PI}deg)`,
                transformOrigin: `${x}px ${y}px`,
                fill: style.fill,
                ...style
            },
            ...props
        }),
        h(Manipulator, {
            referenceX: x+Math.cos(angle)*50,
            referenceY: y+Math.sin(angle)*50,
            onDrag: (e)=>{
                onChange({x,y, width, 
                    angle: Math.atan2(e.sceneY+e.referenceOffsetY-y, e.sceneX+e.referenceOffsetX-x)
                });
            },
            className:"manip",
            showGuide: false
        }, h("circle", {
            cx: x+Math.cos(angle)*50,
            cy: y+Math.sin(angle)*50,
            r: 5,
            className: "handle"
        })),
        h(Manipulator, {
            onDragStart: e=>console.log(e),
            onDrag: e=>{
                onChange({x,y, angle,
                    width: Math.hypot(e.sceneX-x, e.sceneY-y)*2
                });
            },
            className:"manip"
        }, h("circle", {
            cx: x+Math.cos(angle)*-3+Math.cos(angle+Math.PI/2)*width/2,
            cy: y+Math.sin(angle)*-3+Math.sin(angle+Math.PI/2)*width/2,
            r:4,
            style: {cursor: "ns-resize"},
            className: "handle"
        }))
    )
};

export default DirectionalLightView;