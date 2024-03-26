import React, {useState} from "react"
import {Point, Vector} from "../geo.js"
import {P, V} from "../geo.js"
import Circle from "../scene/shapes/Circle.js"
import SphericalLens from "../scene/shapes/SphericalLens.js"
import Manipulator from "../manipulators/Manipulator.js";
const h = React.createElement;




function arcFromThreePoints({Sx, Sy, Mx, My, Ex, Ey})
{
    const circle = Circle.fromThreePoints("temp", {x:Sx, y:Sy}, {x:Mx, y:My}, {x:Ex, y:Ey})
    const r = circle.radius;
    const SE = V(Ex - Sx, Ey - Sy);
    const SM = V(Mx - Sx, My - Sy);
    const crossProduct = SE.x * SM.y - SE.y * SM.x;
    const side = crossProduct>0 ? 0 : 1; // 0: Left, 1:right
    return `M ${Sx} ${Sy} `+
    `a ${Math.abs(r)} ${Math.abs(r)} 0 0 ${side} ${Ex-Sx} ${Ey-Sy} `;
}

function BBox({bbox, ...props}){
    return h("rect", {
        x: bbox.left,
        y: bbox.bottom,
        width: bbox.right-bbox.left,
        height: bbox.top-bbox.bottom,
        className: "guide"
    })
}

function SphericalLensItem({
    lens,
    onChange,
    className,
    ...props
})
{
    const grabOffset = React.useRef();
    const setPos = (x, y)=>{
        onChange(lens.key, {
            x:x, y:y
        })
    }

    const handleCenterManip = (e)=>{
        const newCenterThickness = Math.max(1, (e.sceneX - lens.x)*2);
        onChange(lens.key, {
            centerThickness: newCenterThickness
        });
    }

    const handleCornerManip = (e)=>{

        const newEdgeThickness = Math.max(1, (e.sceneX-lens.x)*2);
        const newDiameter = Math.max(1, (e.sceneY-lens.y)*2);


        // update centerThickness to scale respectively
        const newCenterThickness = Math.max(1, newEdgeThickness-lens.edgeThickness + lens.centerThickness);

        onChange(lens.key, {
            edgeThickness: newEdgeThickness,
            centerThickness: newCenterThickness,
            diameter: newDiameter
        })
    }

    const leftCirlce = lens.getLeftCircle();
    const rightCircle = lens.getRightCircle();
    const materialName = lens.material.constructor.name;

    const makeLensPath = ()=>{
        return ""+
        arcFromThreePoints({
            Sx: lens.x-lens.edgeThickness/2, 
            Sy: lens.y-lens.diameter/2,
            Mx: lens.x-lens.centerThickness/2,
            My: lens.y,
            Ex: lens.x-lens.edgeThickness/2, 
            Ey: lens.y+lens.diameter/2
        })+
        `L ${lens.x+lens.edgeThickness/2} ${lens.y+lens.diameter/2}`+
        arcFromThreePoints({
            Sx: lens.x+lens.edgeThickness/2, 
            Sy: lens.y+lens.diameter/2,
            Mx: lens.x+lens.centerThickness/2,
            My: lens.y,
            Ex: lens.x+lens.edgeThickness/2, 
            Ey: lens.y-lens.diameter/2
        })+
        `L ${lens.x-lens.edgeThickness/2} ${lens.y-lens.diameter/2}` // this should wotk with close path 'Z'
    }

    const bbox = lens.bbox()

    return h(Manipulator, {
        onDragStart: (e)=>grabOffset.current = {x: e.sceneX-lens.x, y: e.sceneY-lens.y},
        onDrag: (e)=>setPos(e.sceneX-grabOffset.current.x, e.sceneY-grabOffset.current.y),
        className: ['sceneItem shape lens', materialName, className].filter(item=>item?true:false).join(" "),
        ...props
    },
        h("path", {
            d: makeLensPath(),
            className: "shape"
        }),
        h(Manipulator, {
            onDrag: (e)=>handleCenterManip(e)
        }, h('circle', {
            className: "autohide",
            cx:lens.x+lens.centerThickness/2, 
            cy:lens.y,
            r: 5,
            vectorEffect: "non-scaling-stroke",
            style: {cursor: "ew-resize"}
        })),
        h(Manipulator, {
            onDrag: (e)=>handleCornerManip(e)
        }, h('circle', {
            className: "autohide",
            cx:lens.x+lens.edgeThickness/2, 
            cy:lens.y+lens.diameter/2,
            r: 5,
            vectorEffect: "non-scaling-stroke",
            style: {cursor: "nwse-resize"}
        })),
        // h(BBox, {bbox: lens.bbox()}),
        // h("line", {
        //     x1: lens.center.x, 
        //     x2: lens.center.x, 
        //     y1: lens.center.y+lens.diameter/2,
        //     y2: lens.center.y-lens.diameter/2,
        //     className: "guide",
        //     strokeWidth: 1,
        //     vectorEffect: "non-scaling-stroke"
        // }),
        // h("line", {
        //     x1: lens.center.x-lens.centerThickness/2, 
        //     x2: lens.center.x+lens.centerThickness/2, 
        //     y1: lens.center.y,
        //     y2: lens.center.y,
        //     className: "guide",
        //     vectorEffect: "non-scaling-stroke",
        //     strokeWidth: 1
        // }),
        // h("line", {
        //     x1: lens.center.x-lens.edgeThickness/2, 
        //     x2: lens.center.x+lens.edgeThickness/2, 
        //     y1: lens.center.y+lens.diameter/2,
        //     y2: lens.center.y+lens.diameter/2,
        //     className: "guide",
        //     vectorEffect: "non-scaling-stroke",
        //     strokeWidth: 1
        // }),
        // h("circle", {
        //     cx: leftCirlce.center.x,
        //     cy: leftCirlce.center.y,
        //     r:  leftCirlce.radius,
        //     className: "guide",
        //     vectorEffect: "non-scaling-stroke",
        //     strokeWidth: 1
        // }),
        // h("circle", {
        //     cx: rightCircle.center.x,
        //     cy: rightCircle.center.y,
        //     r:  rightCircle.radius,
        //     className: "guide",
        //     vectorEffect: "non-scaling-stroke",
        //     strokeWidth: 1
        // })
    )
}

export default SphericalLensItem;