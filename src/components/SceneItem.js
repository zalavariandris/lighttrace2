import React, {useState} from "react"

/*scene*/
import Shape from "../scene/shapes/Shape.js";
import Circle from "../scene/shapes/Circle.js"
import LineSegment from "../scene/shapes/LineSegment.js"
import Rectangle from "../scene/shapes/Rectangle.js"
import SphericalLens from "../scene/shapes/SphericalLens.js"

import Light from "../scene/lights/Light.js"
import PointLight from "../scene/lights/PointLight.js"
import LaserLight from "../scene/lights/LaserLight.js"
import DirectionalLight from "../scene/lights/DirectionalLight.js"

/* viewport items */
import CircleItem from "./CircleItem.js"
import LineSegmentItem from "./LineSegmentItem.js"
import RectangleItem from "./RectangleItem.js"
import SphericalLensItem from "./SphericalLensItem.js"

import DirectionalLightItem from "./DirectionalLightItem.js"
import PointLightItem from "./PointLightItem.js"
import LaserLightItem from "./LaserLightItem.js"

const h = React.createElement;

function SceneItem({
    sceneObject, 
    onChange=(oldSceneObject, newSceneObject)=>{},
    ...props
})
{
    if(sceneObject instanceof Circle)
    {
        return h(CircleItem, {
            circle:sceneObject, 
            onChange: onChange,
            ...props
        })
    }
    if(sceneObject instanceof Rectangle)
    {
        return RectangleItem({
            rectangle: sceneObject,
            onChange: onChange,
            ...props
        })
    }

    else if(sceneObject instanceof SphericalLens)
    {
        return SphericalLensItem({
            lens: sceneObject,
            onChange: onChange,
            ...props
        })
    }

    else if(sceneObject instanceof LineSegment)
    {
        return LineSegmentItem({
            lineSegment: sceneObject,
            onChange: onChange,
            ...props
        })
    }

    else if(sceneObject instanceof PointLight)
    {
        return PointLightItem({
            light: sceneObject,
            onChange: onChange,
            ...props
        })
    }

    else if(sceneObject instanceof LaserLight)
    {
        return LaserLightItem({
            light: sceneObject,
            onChange: onChange,
            ...props
        })
    }

    else if(sceneObject instanceof DirectionalLight)
    {
        return DirectionalLightItem({
            light: sceneObject,
            onChange: onChange,
            ...props
        });
    }

    return h("text", {className: "shape", x: sceneObject.center.x, y: sceneObject.center.y, fontSize:12}, `${sceneObject.constructor.name}`)

}

export default SceneItem;