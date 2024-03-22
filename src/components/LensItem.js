import React, {useState} from "react"
import {Point, Vector} from "../geo.js"
import PointManip from "./PointManip.js";
import Circle from "../scene/shapes/Circle.js"
import Lens from "../scene/shapes/Lens.js"
import Manipulator from "./Manipulator.js";
const h = React.createElement;


const makeLensPath = (width, height, leftRadius, rightRadius)=>{
    return `M ${-width/2} ${-height/2} `+
    `a ${Math.abs(leftRadius)} ${Math.abs(leftRadius)} 0 0 ${leftRadius<0?1:0} 0 ${height} `+
    `L ${width/2} ${height/2} `+
    `a ${Math.abs(rightRadius)} ${Math.abs(rightRadius)} 0 0 ${rightRadius<0?1:0} 0 ${-height}`
}

function LensItem({
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

    const onSizeManip = (Px, Py)=>
    {
        const newLens = lens.copy()
        newLens.width = Math.max(0, (Px - lens.center.x)*2)
        newLens.height = Math.max((Py - lens.center.y)*2)
        onChange(lens, newLens)
    }
    
    const onRightLensManip = (Px, Py)=>{
        const newLens = lens.copy()
    
        const topRight = new Point(0, lens.height/2)
    
        let V = new Vector(Px-(lens.center.x+lens.width/2), Py-(lens.center.y))
        if(V.magnitude()>lens.height/2){
            V = V.normalized(lens.height/2)
            console.log(V)
        }
        const middle = new Point(V.x, V.y );
        const bottomRight = new Point(0, -lens.height/2)
        const lensCircle = Circle.fromThreePoints(topRight, middle, bottomRight)
    
        newLens.rightRadius = Math.sign(V.x)*lensCircle.radius
        onChange(lens, newLens)
    }
    
    const onLeftLensManip = (Px, Py)=>{
        const newLens = lens.copy()
    
        const topRight = new Point(0, lens.height/2)
    
        let V = new Vector(+Px-(lens.center.x-lens.width/2), Py-(lens.center.y))
        if(V.magnitude()>lens.height/2){
            V = V.normalized(lens.height/2)
            console.log(V)
        }
        const middle = new Point(V.x, V.y );
        const bottomRight = new Point(0, -lens.height/2)
        const lensCircle = Circle.fromThreePoints(topRight, middle, bottomRight)
    
        newLens.leftRadius = -Math.sign(V.x)*lensCircle.radius
        onChange(lens, newLens)
    }
    
    const getLeftLensWidth = ()=>{
        const topLeft = new Point(0, lens.center.y+lens.height/2)
        const bottomLeft =  new Point(0, lens.center.y-lens.height/2)
        const lensCircle = Circle.fromRadiusAndTwoPoints(Math.abs(lens.leftRadius), topLeft, bottomLeft)
        // console.log("lensCircle", lensCircle.center.x, lensCircle.radius)
        return Math.sign(lens.leftRadius)*(lensCircle.radius - lensCircle.center.x)
    }
    
    const getRightLensWidth = ()=>{
        const topLeft = new Point(0, lens.center.y+lens.height/2)
        const bottomLeft =  new Point(0, lens.center.y-lens.height/2)
        const lensCircle = Circle.fromRadiusAndTwoPoints(Math.abs(lens.rightRadius), topLeft, bottomLeft)
        // console.log("lensCircle", lensCircle.center.x, lensCircle.radius)
        return Math.sign(lens.rightRadius)*(lensCircle.radius - lensCircle.center.x)
    }

    const top = new Point(0, lens.center.y+lens.height/2)
    const bottom =  new Point(0, lens.center.y-lens.height/2)
    const rightCircle = Circle.fromRadiusAndTwoPoints(Math.abs(lens.rightRadius), top, bottom)
    const leftCircle = Circle.fromRadiusAndTwoPoints(Math.abs(lens.leftRadius), top, bottom)

    return h(Manipulator, {
        className: 'sceneItem shape lens',
        onDragStart: (e)=>grabOffset.current = {x: e.sceneX-lens.center.x, y: e.sceneY-lens.center.y},
        onDrag: (e)=>setPos(e.sceneX-grabOffset.current.x, e.sceneY-grabOffset.current.y),
        ...props
    },
        h('rect', {
            x: lens.center.x - lens.width / 2,
            y: lens.center.y - lens.height / 2,
            width: lens.width,
            height: lens.height,
            vectorEffect: "non-scaling-stroke",
            fill: "transparent"
        }),
        h('path', {
            d: makeLensPath(lens.width, lens.height, lens.leftRadius, lens.rightRadius),
            style: {
                transform: `translate(${lens.center.x}px, ${lens.center.y}px)`,
                fill: "white",
                opacity: 0.1,
                className: "handle shape",
            }
        }),
        h(PointManip, {
            x: lens.center.x+lens.width/2,
            y: lens.center.y+lens.height/2,
            onChange: (x, y)=>onSizeManip(x, y)
        }),
        h(PointManip, {
            x: lens.center.x-lens.width/2-getLeftLensWidth(),
            y: lens.center.y,
            onChange: (x, y)=>onLeftLensManip(x, y)
        }),
        h(PointManip, {
            x: lens.center.x+lens.width/2+getRightLensWidth(),
            y: lens.center.y,
            onChange: (x, y)=>onRightLensManip(x, y)
        }),
        h('circle', {
            className: "guide",
            cx: lens.center.x+leftCircle.center.x-lens.width/2, 
            cy: lens.center.y, 
            r:leftCircle.radius,
            vectorEffect: "non-scaling-stroke",
        }),
        h('circle', {
            className: "guide",
            cx: lens.center.x-rightCircle.center.x+lens.width/2, 
            cy: lens.center.y, 
            r:rightCircle.radius,
            vectorEffect: "non-scaling-stroke",
        })
        
    )
}

export default LensItem;