import React, {useState} from "react"

import Circle from "../scene/shapes/Circle.js"
import LineSegment from "../scene/shapes/LineSegment.js"
import Rectangle from "../scene/shapes/Rectangle.js"
import SphericalLens from "../scene/shapes/SphericalLens.js"

import Light from "../scene/lights/Light.js"
import PointLight from "../scene/lights/PointLight.js"
import LaserLight from "../scene/lights/LaserLight.js"
import DirectionalLight from "../scene/lights/DirectionalLight.js"

import CircleView from "../UI/SVGEditableElements/CircleView.js";
import DirectionalLightView from "../UI/SVGEditableElements/DirectionalLightView.js"
import LaserLightView from "../UI/SVGEditableElements/LaserLightView.js"
import PointLightView from "../UI/SVGEditableElements/PointLightView.js";
import RectView from "../UI/SVGEditableElements/RectView.js"
import LineView from "../UI/SVGEditableElements/LineView.js"
import SphericalLensView from "../UI/SVGEditableElements/SphericalLensView.js"

import {colorFromRGB, wavelengthToRGB} from "../scene/colorUtils.js"

const h = React.createElement;

const ShapeModelView = ({
    sceneObject,
    onChange=(value)=>{},
    ...props
})=>
{
    if(sceneObject instanceof Circle)
    {
        return h(CircleView, {
            cx:sceneObject.Cx, 
            cy:sceneObject.Cy, 
            r:sceneObject.radius,  
            onChange:(svgElement)=>onChange({
                Cx:svgElement.cx, 
                Cy:svgElement.cy, 
                radius:svgElement.r
            }),
            ...props
        });
    }
    else if(sceneObject instanceof Rectangle)
    {
        return h(RectView, {
            x:sceneObject.Cx-sceneObject.width/2, 
            y:sceneObject.Cy-sceneObject.height/2, 
            width:sceneObject.width, 
            height:sceneObject.height, 
            onChange:value=>onChange({
                Cx: value.x+value.width/2, 
                Cy: value.y+value.height/2, 
                width: value.width, 
                height: value.height
            }),
            ...props
        });
    }
    else if(sceneObject instanceof LineSegment)
    {
        return h(LineView, {
            x1:sceneObject.Ax, 
            y1:sceneObject.Ay, 
            x2:sceneObject.Bx, 
            y2:sceneObject.By, 
            onChange:(svgElement)=>onChange({...sceneObject,
                Ax:svgElement.x1, 
                Ay:svgElement.y1, 
                Bx:svgElement.x2, 
                By:svgElement.y2
            }),
            ...props
        });
    }
    else if(sceneObject instanceof SphericalLens)
    {
        return h(SphericalLensView, {
            cx: sceneObject.Cx, 
            cy: sceneObject.Cy,
            diameter: sceneObject.diameter,
            edgeThickness: sceneObject.edgeThickness,
            centerThickness: sceneObject.centerThickness,
            onChange:(value)=>onChange({...sceneObject,
                Cx: value.cx,
                Cy: value.cy,
                diameter: value.diameter,
                edgeThickness: value.edgeThickness,
                centerThickness: value.centerThickness
            }),
            ...props
        });
    }
    else if(sceneObject instanceof DirectionalLight)
    {
        return h(DirectionalLightView, {
            x: sceneObject.Cx, 
            y: sceneObject.Cy,
            angle: sceneObject.angle,
            width: sceneObject.width,
            onChange:(value)=>onChange({
                Cx: value.x,
                Cy: value.y,
                angle: value.angle,
                width: value.width
            }),
            style: {fill: colorFromRGB(wavelengthToRGB(sceneObject.wavelength))},
            ...props
        });
    }

    else if(sceneObject instanceof LaserLight)
    {
        return h(LaserLightView, {
            x: sceneObject.Cx, 
            y: sceneObject.Cy,
            intensity: sceneObject.intensity,
            wavelength: sceneObject.wavelength,
            angle: sceneObject.angle,
            onChange:(value)=>onChange({
                Cx: value.x,
                Cy: value.y,
                angle: value.angle,
                wavelength: value.wavelength,
                intensity: value.intensity
            })
        });

    }
    else if(sceneObject instanceof PointLight)
    {
        return h(PointLightView, {
            cx: sceneObject.Cx,
            cy: sceneObject.Cy,
            angle: sceneObject.angle,
            style: {
                fill: colorFromRGB(wavelengthToRGB(sceneObject.wavelength))
            },
            onChange:(value)=>onChange({...sceneObject,
                Cx: value.cx,
                Cy: value.cy,
                angle: value.angle
            }),
            ...props
        });
    }

    else
    {
        return h("text", {
            className: "shape",
            x: sceneObject.Cx,
            y: sceneObject.Cy,
            ...props
        }, `shape`)
    }
};

export default ShapeModelView;