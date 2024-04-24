import Shape from "../scene/shapes/Shape.js";
import Circle from "../scene/shapes/Circle.js"
import LineSegment from "../scene/shapes/LineSegment.js"
import Rectangle from "../scene/shapes/Rectangle.js"
import SphericalLens from "../scene/shapes/SphericalLens.js"

import Light from "../scene/lights/Light.js"
import PointLight from "../scene/lights/PointLight.js"
import LaserLight from "../scene/lights/LaserLight.js"
import DirectionalLight from "../scene/lights/DirectionalLight.js"


let scene = {
    "floor line": new LineSegment({
        Ax: 50, 
        Ay: 450, 
        Bx: 462, 
        By: 450, 
        material: "mirror"
    }),
    "concave lens": new SphericalLens({
        Cx: 130, 
        Cy: 280, 
        diameter: 140,
        edgeThickness: 5,
        centerThickness:80,
        material: "glass" 
    }),

    "sun": new LaserLight({
        Cx:50, 
        Cy: 250, 
        angle: 0
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
    },

    removeSceneObject(key){
        scene = Object.fromEntries(Object.entries(scene).filter(([k, v]) =>{
            return k!== key;
        }));
        selectionKeys = [];
    },

    updateSceneObject(key, newAttributes){
        if(!scene.hasOwnProperty(key))
        {
            console.warn("old scene object not in current scene")
            return scene;
        }
        const newSceneObject = scene[key].copy()
        for(let [attr, value] of Object.entries(newAttributes)){
            newSceneObject[attr] = value;
        }
        
        scene = {...scene, [key]: newSceneObject};
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