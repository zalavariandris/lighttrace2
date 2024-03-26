import React, {useState} from "react"
import Manipulator from "../manipulators/Manipulator.js"


const h = React.createElement;

function RectangleItem({
    rectangle,
    onChange,
    className,
    ...props
})
{
    const grabOffset = React.useRef();
    const setPos = (x, y)=>{
        onChange(rectangle.key, {
            x: x,
            y:y
        })
    }

    const materialName = rectangle.material.constructor.name;

    return h(Manipulator, {
        onDragStart: (e)=>grabOffset.current = {x: e.sceneX-rectangle.x, y: e.sceneY-rectangle.y},
        onDrag: (e)=>setPos(e.sceneX-grabOffset.current.x, e.sceneY-grabOffset.current.y),
        className: ["sceneItem shape rectangle", materialName, className].filter(item=>item?true:false).join(" "),
        ...props
    },
        h('rect', {
            x: rectangle.x - rectangle.width / 2,
            y: rectangle.y - rectangle.height / 2,
            width: rectangle.width,
            height: rectangle.height,
            vectorEffect: "non-scaling-stroke",
            className: "handle shape",
            style: {fill: colorFromRGB(wavelengthToRGB(light.wavelength))},
        })
    )
}

export default RectangleItem;