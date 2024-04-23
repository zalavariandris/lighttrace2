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
    "mirror ball" :new Circle({
        Cx:360, 
        Cy:200, 
        radius: 50, 
        material: "mirror",
    }),
    "rect prism": new Rectangle({
        Cx: 500,
        Cy: 250,
        width: 150,
        height: 150,
        material: "glass"
    }),
    "floor line": new LineSegment({
        Ax: 50, 
        Ay: 450, 
        Bx: 462, 
        By: 450, 
        material: "mirror"
    }),
    "concave lens": new SphericalLens({
        Cx: 150, 
        Cy:250, 
        diameter: 140,
        edgeThickness: 60,
        centerThickness:5,
        material: "glass" 
    }),
    "convex lens": new SphericalLens({
        Cx: 230, 
        Cy: 250,
        diameter: 100,
        edgeThickness: 5,
        centerThickness: 50, 
        material: "glass", 
    }),
    "sun": new DirectionalLight({
        Cx:50, 
        Cy: 250, 
        width: 80, 
        angle: 0
    }),
    "lamp": new PointLight({
        Cx: 50, 
        Cy: 150, 
        angle:0
    }),
    "laser": new LaserLight({
        Cx:150, 
        Cy: 150, 
        angle: 0.5
    }),
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