import React, {useState} from "react"
import {Point, Vector, Ray} from "../geo.js"
import PointManip from "./PointManip.js";
import AngleManip from "./AngleManip.js";
import {Circle, DirectonalLight, LaserLight, LineSegment, Rectangle, Lens} from "../scene.js"
import Manipulator from "./Manipulator.js";

const h = React.createElement;

function DirectionalLightItem({
    light,
    onChange,
    ...props
})
{
    const grabOffset = React.useRef();
    const setPos = (x, y)=>{
        const newLight = light.copy()
        newLight.center.x = x;
        newLight.center.y = y;
        onChange(light, newLight)
    }

    const setRadians = (newRadians)=>{
        const newSceneObject = light.copy()
        newSceneObject.angle = newRadians;
        onChange(light, newSceneObject)
    }

    return h(Manipulator, {
        className: 'sceneItem light directional',
        onDragStart: (e)=>grabOffset.current = {x: e.sceneX-light.center.x, y: e.sceneY-light.center.y},
        onDrag: (e)=>setPos(e.sceneX-grabOffset.current.x, e.sceneY-grabOffset.current.y),
        ...props

    }, 
        h('rect', {
            x: light.center.x-6,
            y: light.center.y-light.width/2,
            width: 6,
            height: light.width,
            vectorEffect: "non-scaling-stroke",
            className: "shape",
            style: {transform: `rotate(${light.angle*180/Math.PI}deg)`, transformOrigin: `${light.center.x}px ${light.center.y}px`}
        }),
        h(AngleManip, {
            x:light.center.x, 
            y:light.center.y,
            radians: light.angle,
            onChange: (newRadians)=>setRadians(newRadians)
        })
        
    )
}

export default DirectionalLightItem;