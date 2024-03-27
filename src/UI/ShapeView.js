import React, {useState} from "react"

import Shape from "../scene/shapes/Shape.js";
import Circle from "../scene/shapes/Circle.js"
import LineSegment from "../scene/shapes/LineSegment.js"
import Rectangle from "../scene/shapes/Rectangle.js"
import SphericalLens from "../scene/shapes/SphericalLens.js"

import Light from "../scene/lights/Light.js"
import PointLight from "../scene/lights/PointLight.js"
import LaserLight from "../scene/lights/LaserLight.js"
import DirectionalLight from "../scene/lights/DirectionalLight.js"

import Manipulator from "./Manipulator.js";

import {colorFromRGB, wavelengthToRGB} from "../colorUtils.js"

const h = React.createElement;

import CircleView from "./CircleView.js";
import DirectionalLightView from "./DirectionalLightView.js"
import LaserLightView from "./LaserLightView.js"
import PointLightView from "./PointLightView.js";
import RectangleView from "./RectangleView.js"
import LineSegmentView from "./LineSegmentView.js"
import SphericalLensView from "./SphericalLensView.js"


const ShapeView = ({
    objKey, 
    sceneObject,
    updateSceneObject
})=>{
    if(sceneObject instanceof Circle)
    {
        return h(CircleView, {objKey, circle: sceneObject, updateSceneObject});
    }
    else if(sceneObject instanceof DirectionalLight)
    {
        return h(DirectionalLightView, {objKey, light: sceneObject, updateSceneObject});
    }
    else if(sceneObject instanceof LaserLight)
    {
        return h(LaserLightView, {objKey, light: sceneObject, updateSceneObject});

    }
    else if(sceneObject instanceof PointLight)
    {
        return h(PointLightView, {objKey, light: sceneObject, updateSceneObject});
    }
    else if(sceneObject instanceof Rectangle)
    {
        return h(RectangleView, {objKey, rectangle: sceneObject, updateSceneObject});
    }
    else if(sceneObject instanceof LineSegment)
    {
        return h(LineSegmentView, {objKey, lineSegment:sceneObject, updateSceneObject});
    }
    else if(sceneObject instanceof SphericalLens)
    {
        return h(SphericalLensView, {objKey, lens: sceneObject, updateSceneObject});
    }
    else
    {
        return h("text", {
            className: "shape",
            x: sceneObject.x,
            y: sceneObject.y
        }, `${objKey}`)
    }
};

export default ShapeView;