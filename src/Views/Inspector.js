import React, {useState} from "react"

import Shape from "../scene/shapes/Shape.js"
import Light from "../scene/lights/Light.js"

import MirrorMaterial from "../scene/materials/MirrorMaterial.js";
import TransparentMaterial from "../scene/materials/TransparentMaterial.js";
import DiffuseMaterial from "../scene/materials/DiffuseMaterial.js";

import {RGBToCSS, temperatureToRGB, wavelengthToRGB} from "../scene/colorUtils.js"

const h = React.createElement;


function ShapeInspector({
    sceneObject, 
    onChange=(newSceneObject)=>{},
    ...props
})
{
    const material = sceneObject.material;
    const onMaterialSelected = (e, v)=>{
        // set scene object material;
        const newMaterialName = e.target.value
        onChange({...sceneObject,
            material: newMaterialName
        })
    }

    return h("label", null, 
        h("select", {
            name: "material", 
            onChange: onMaterialSelected
        },
            h("option", {
                value: "glass", 
                selected:material=="glass"
            }, 
                "glass"
            ),
            h("option", {
                value: "mirror", 
                selected:material=="mirror"
            }, 
            "mirror"
            ),
            h("option", {
                value: "diffuse", 
                selected:material=="diffuse"
            }, 
            "diffuse"
            )
        ),
        "Material"
    )
}

function LightInspector({
    sceneObject, 
    onChange=(newSceneObject)=>{},
    ...props
})
{
    function handleWavelengthChange(e)
    {   
        e.stopPropagation();
        e.preventDefault();
        onChange({...sceneObject, 
            color: e.target.value
        })
    }

    function handleIntensityChange(e)
    {
        e.stopPropagation();
        e.preventDefault();
        onChange({...sceneObject, 
            intensity: e.target.value
        })
    }

    return h("form", null, 
        h("label", null, 
            h("input", {
                type: "range", 
                value:sceneObject.temperature, 
                min: 1000, 
                max: 10000,
                step:10,
                onChange: e=>onChange({...sceneObject, temperature: e.target.value})
            }),
            
            h("svg", {width: 32, height: 32},
                h("rect", {
                    x: 0, 
                    y: 0, 
                    width: 32, 
                    height: 32,
                    style: {fill: RGBToCSS(temperatureToRGB(sceneObject.temperature))}
                })
            ),
            `${sceneObject.temperature}K`,
        ),
        h("label", null, 
            `intensity ${sceneObject.intensity}`,
            h("input", {
                type: "range", 
                value: sceneObject.intensity,
                min: 0,
                max: 10.0,
                step: 0.01,
                onChange: (e)=>handleIntensityChange(e)
            })
        )
    );
}

function Inspector({
    sceneObject,
    onChange=(oldSceneObject, newSceneObject)=>{},
    ...props
})
{
    function getObjectInspector(sceneObject)
    {
        if(!sceneObject)
        {
            return null;
        }
        
        if(sceneObject instanceof Shape){
            return ShapeInspector({sceneObject, onChange, ...props})
        }
        else if(sceneObject instanceof Light)
        {
            return LightInspector({sceneObject, onChange, ...props})
        }
        else
        {
            return "OBJECT SPECIFIC INSPECTOR"
        }
    }

        return h("div", {
            id: "Inspector", 
            className:"panel"
        },
            
            h("header", null, 
                h("h2", null, `Inspector`),
                h("div", null, sceneObject?`${sceneObject.constructor.name} ${sceneObject.key}`:""),
                getObjectInspector(sceneObject)
            )
        )
}

export default Inspector;