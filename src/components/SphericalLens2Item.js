import React, {useState} from "react"
import {Point, Vector} from "../geo.js"
import {P, V} from "../geo.js"
import PointManip from "./PointManip.js";
import Circle from "../scene/shapes/Circle.js"
import SphericalLens2 from "../scene/shapes/SphericalLens2.js"
import Manipulator from "./Manipulator.js";
const h = React.createElement;




function arcFromThreePoints({Sx, Sy, Mx, My, Ex, Ey})
{
    const circle = Circle.fromThreePoints({x:Sx, y:Sy}, {x:Mx, y:My}, {x:Ex, y:Ey})
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

function SphericalLens2Item({
    lens,
    onChange,
    ...props
})
{
    const grabOffset = React.useRef();
    const setPos = (x, y)=>{
        const newLens = lens.copy()
        newLens.center.x = x
        newLens.center.y = y
        onChange(lens, newLens)
    }

    const handleCenterManip = (e)=>{
        const newLens = lens.copy()

        const newCenterThickness = Math.max(1, (e.sceneX - lens.center.x)*2);
        newLens.centerThickness = newCenterThickness;
        onChange(lens, newLens)
    }

    const handleCornerManip = (e)=>{
        const newLens = lens.copy()
        const newEdgeThickness = Math.max(1, (e.sceneX-lens.center.x)*2);
        const newDiameter = Math.max(1, (e.sceneY-lens.center.y)*2);


        newLens.edgeThickness = newEdgeThickness;
        newLens.diameter = newDiameter;

        // update centerThickness to scale respectively
        const newCenterThickness = Math.max(1, newEdgeThickness-lens.edgeThickness + lens.centerThickness);
        newLens.centerThickness = newCenterThickness

        onChange(lens, newLens)
    }

    const leftCirlce = lens.getLeftCircle()
    const rightCircle = lens.getRightCircle()

    const makeLensPath = ()=>{
        return ""+
        arcFromThreePoints({
            Sx: lens.center.x-lens.edgeThickness/2, 
            Sy: lens.center.y-lens.diameter/2,
            Mx: lens.center.x-lens.centerThickness/2,
            My: lens.center.y,
            Ex: lens.center.x-lens.edgeThickness/2, 
            Ey: lens.center.y+lens.diameter/2
        })+
        `L ${lens.center.x+lens.edgeThickness/2} ${lens.center.y+lens.diameter/2}`+
        arcFromThreePoints({
            Sx: lens.center.x+lens.edgeThickness/2, 
            Sy: lens.center.y+lens.diameter/2,
            Mx: lens.center.x+lens.centerThickness/2,
            My: lens.center.y,
            Ex: lens.center.x+lens.edgeThickness/2, 
            Ey: lens.center.y-lens.diameter/2
        })+
        `L ${lens.center.x-lens.edgeThickness/2} ${lens.center.y-lens.diameter/2}` // this should wotk with close path 'Z'
    }

    const bbox = lens.bbox()

    return h(Manipulator, {
        className: 'sceneItem shape lens',
        onDragStart: (e)=>grabOffset.current = {x: e.sceneX-lens.center.x, y: e.sceneY-lens.center.y},
        onDrag: (e)=>setPos(e.sceneX-grabOffset.current.x, e.sceneY-grabOffset.current.y),
        ...props
    },
        h("path", {
            d: makeLensPath()
        }),
        h(Manipulator, {
            onDrag: (e)=>handleCenterManip(e)
        }, h('circle', {
            cx:lens.center.x+lens.centerThickness/2, 
            cy:lens.center.y,
            r: 5,
            vectorEffect: "non-scaling-stroke",
            style: {cursor: "ew-resize"}
        })),
        h(Manipulator, {
            onDrag: (e)=>handleCornerManip(e)
        }, h('circle', {
            cx:lens.center.x+lens.edgeThickness/2, 
            cy:lens.center.y+lens.diameter/2,
            r: 5,
            vectorEffect: "non-scaling-stroke",
            style: {cursor: "nwse-resize"}
        })),
        h(BBox, {bbox: lens.bbox()}),
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
        h("circle", {
            cx: leftCirlce.center.x,
            cy: leftCirlce.center.y,
            r:  leftCirlce.radius,
            className: "guide",
            vectorEffect: "non-scaling-stroke",
            strokeWidth: 1
        }),
        h("circle", {
            cx: rightCircle.center.x,
            cy: rightCircle.center.y,
            r:  rightCircle.radius,
            className: "guide",
            vectorEffect: "non-scaling-stroke",
            strokeWidth: 1
        })
    )
}

export default SphericalLens2Item;