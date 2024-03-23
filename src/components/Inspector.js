import React, {useState} from "react"

import MirrorMaterial from "../scene/materials/MirrorMaterial.js";
import TransparentMaterial from "../scene/materials/TransparentMaterial.js";
import DiffuseMaterial from "../scene/materials/DiffuseMaterial.js";

const h = React.createElement;


function Inspector({
    sceneObject,
    onChange=(oldSceneObject, newSceneObject)=>{},
    ...props
})
{

    const material = sceneObject.material;
    const onMaterialSelected = (e, v)=>{
        // set scene object material;
        const options = e.target.selectedOptions;
        const idx = e.target.selectedIndex;
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

    return h("div", {
        id: "Inspector", 
        className:"panel"
    },

            h("header", null, 
                h("h2", null, `Inspector ${sceneObject}`),

                h("label", null, 
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


                // h("label", null, 
                //     h("input", {
                //         type:"radio", 
                //         name: "material", 
                //         checked: material instanceof TransparentMaterial,
                //         onChange: (e)=>updateMaterial(new TransparentMaterial),
                //         id:TransparentMaterial.name, 
                //         value:TransparentMaterial.name
                //     }),
                //     TransparentMaterial.name
                // ),
                // h("label", null, 
                //     h("input", {
                //         type:"radio", 
                //         name: "material", 
                //         checked: material instanceof MirrorMaterial,
                //         onChange: (e)=>updateMaterial(new MirrorMaterial),
                //         id:MirrorMaterial.name, 
                //         value:MirrorMaterial.name
                //     }),
                //     MirrorMaterial.name
                // ),
                // h("label", null, 
                //     h("input", {
                //         type:"radio", 
                //         name: "material", 
                //         checked: material instanceof DiffuseMaterial,
                //         onChange: (e)=>updateMaterial(new DiffuseMaterial),
                //         id:DiffuseMaterial.name, 
                //         value:DiffuseMaterial.name
                //     }),
                //     DiffuseMaterial.name
                // )



                // h("input", {
                //     name: "material",
                //     checked: raytraceOptions.samplingMethod == SamplingMethod.Uniform,
                //     onChange: (e)=>updateRaytraceOptions({samplingMethod: e.target.value}),
                //     id: SamplingMethod.Uniform,
                //     type:"material",
                //     value:SamplingMethod.Uniform}),
                // h("label", {for: SamplingMethod.Uniform}, SamplingMethod.Uniform)


                // h("span", null, `material: ${sceneObject.material.constructor.name}`),
                // h("section", null, 
                //     h("header", null, `${sceneObject.material.constructor.name}`),
                //     h("label", null, 
                //         h("input", {type: "range", value: sceneObject.material.ior}),
                //         `ior ${sceneObject.material.ior}`
                //     )
                // )
                
            )
    )
}

export default Inspector;