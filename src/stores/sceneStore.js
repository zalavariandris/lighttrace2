import Shape from "../scene/shapes/Shape.js";
import Circle from "../scene/shapes/Circle.js"
import LineSegment from "../scene/shapes/LineSegment.js"
import Rectangle from "../scene/shapes/Rectangle.js"
import SphericalLens from "../scene/shapes/SphericalLens.js"

import Light from "../scene/lights/Light.js"
import PointLight from "../scene/lights/PointLight.js"
import LaserLight from "../scene/lights/LaserLight.js"
import DirectionalLight from "../scene/lights/DirectionalLight.js"

import {produce} from "immer";



let scene = {
    // "ball": new Circle({
    //     Cx: 200, Cy:250, radius:50, material: "mirror"
    // }),
    // "box": new Rectangle({
    //     Cx: 500, Cy: 250, 
    //     width: 200, 
    //     height: 200, 
    //     material: "mirror"
    // }),
    "floor line": new LineSegment({
        Ax: 50, 
        Ay: 450, 
        Bx: 462, 
        By: 450, 
        material: "mirror"
    }),
    // "concave lens": new SphericalLens({
    //     Cx: 130, 
    //     Cy: 290, 
    //     diameter: 140,
    //     edgeThickness: 5,
    //     centerThickness:80,
    //     material: "glass" 
    // }),

    // "laser": new LaserLight({
    //     Cx:50, 
    //     Cy: 250, 
    //     angle: 0
    // }),
    "lamp": new PointLight({
        Cx: 50,
        Cy: 250,
        intensity: 8,
        temperature: 6300
    })
};

let selectionKeys = [];


let listeners = [];

function emitChange() {
    for (let listener of listeners) {
        listener();
    }
}

export default {

    addSceneObject(key, newSceneObject)
    {
        scene = {...scene, [key]: newSceneObject};
        emitChange();
    },

    removeSceneObject(key)
    {
        
        scene = Object.fromEntries(Object.entries(scene).filter(([k, v]) =>{
            return k!== key;
        }));
        selectionKeys = [];
        emitChange();
    },

    updateSceneObject(key, newAttributes)
    {

        if(!scene.hasOwnProperty(key))
        {
            console.warn("old scene object not in current scene")
            return scene;
        }

        const updatedScene = produce(scene, draft=>{
            for(let [attr, value] of Object.entries(newAttributes))
            {
                draft[key][attr] = value;
            }
        });

        if(updatedScene!=scene)

            scene = updatedScene;
            emitChange()
        }
        // scene = {...updatedScene};
        // // scene = {...scene, [key]: newSceneObject};
        // emitChange();
    },

    setSelectionKeys(newSelectionKeys)
    {
        selectionKeys = newSelectionKeys;
    },

    getSelectedSceneObject(){
        const key = selectionKeys[0];
        if(key && scene.hasOwnProperty(key)){
            return scene[key]
        }
        return null;
    },

    subscribe(listener) {
        listeners = [...listeners, listener];
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },

    getSnapshot() {
        return scene;
    }
};