import React, {useState} from "react"

import Shape from "../scene/shapes/Shape.js"
import Light from "../scene/lights/Light.js"

import MirrorMaterial from "../scene/materials/MirrorMaterial.js";
import TransparentMaterial from "../scene/materials/TransparentMaterial.js";
import DiffuseMaterial from "../scene/materials/DiffuseMaterial.js";

import {wavelengthToRGB} from "../colorUtils.js"

const h = React.createElement;


function ShapeInspector({
    sceneObject, 
    onChange=(oldSceneObject, newSceneObject)=>{},
    ...props
})
{
    const material = sceneObject.material;
    const onMaterialSelected = (e, v)=>{
        // set scene object material;
        const newMaterialName = e.target.value
        if(newMaterialName == TransparentMaterial.name){
            let newSceneObject = sceneObject.copy()
            newSceneObject.material = new TransparentMaterial()
            onChange(sceneObject, newSceneObject)
        }
        else if(newMaterialName == MirrorMaterial.name)
        {
            let newSceneObject = sceneObject.copy()
            newSceneObject.material = new MirrorMaterial()
            onChange(sceneObject, newSceneObject)
        }
        else if(newMaterialName == DiffuseMaterial.name)
        {
            let newSceneObject = sceneObject.copy()
            newSceneObject.material = new DiffuseMaterial()
            onChange(sceneObject, newSceneObject)
        }
        else
        {

        }
    }

    return h("label", null, 
        h("select", {
            name: "material", 
            onChange: onMaterialSelected
        },
            h("option", {
                value: TransparentMaterial.name, 
                selected:material instanceof MirrorMaterial
            }, 
                `${TransparentMaterial.name}`
            ),
            h("option", {
                value: MirrorMaterial.name, 
                selected:material instanceof MirrorMaterial
            }, 
                `${MirrorMaterial.name}`
            ),
            h("option", {
                value: DiffuseMaterial.name, 
                selected:material instanceof DiffuseMaterial
            }, 
                `${DiffuseMaterial.name}`
            )
        ),
        "Material"
    )
}

function LightInspector({
    sceneObject, 
    onChange=(oldSceneObject, newSceneObject)=>{},
    ...props
})
{
    function handleWavelengthChange(e)
    {   
        e.stopPropagation();
        e.preventDefault();
        const newSceneObject = sceneObject.copy();
        newSceneObject.wavelength = e.target.value;
        onChange(sceneObject, newSceneObject)
    }

    function colorFromWavelength(wavelength)
    {
        const [R,G,B] = wavelengthToRGB(wavelength);
        console.log(R,G,B)
        return `rgb(${R.toFixed(0)}, ${G.toFixed()}, ${B.toFixed(0)})`
    }

    return h("label", null, 
        h("input", {
            type: "range", 
            value:sceneObject.wavelength, 
            min: 380, 
            max: 780,
            onChange: e=>handleWavelengthChange(e)
        }),
        `${sceneObject.wavelength}nm`,h("br"),
        
        h("svg", {width: 32, height: 32},
            h("rect", {
                x: 0, 
                y: 0, 
                width: 32, 
                height: 32,
                fill: colorFromWavelength(sceneObject.wavelength)
            })
        ),
        `${wavelengthToRGB(sceneObject.wavelength)}`,
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
                h("h2", null, `Inspector ${sceneObject}`),
                getObjectInspector(sceneObject)
            )
        )
}

export default Inspector;