import {produce} from "immer";

/*
 * STORE
 */
let scene = {
    "ball": {
        pos: {x: 265.0, y:260.0},
        shape: {type: "circle", radius: 50},
        material: "mirror"
    },
    "ball2": {
        pos: {x: 128.0, y:350.0},
        shape: {type: "circle", radius: 70},
        material: "mirror"
    },
    "ball3": {
        pos: {x: 18.0, y:350.0},
        shape: {type: "circle", radius: 70},
        material: "mirror"
    },
    "light": {
        pos: {x: 216, y: 110},
        light: {type: "point"}
    }
};

let listeners = [];

function emitChange() {
    for (let listener of listeners) {
        listener();
    }
};

export default {


    addEntity (key, entity)
    {
        const updatedScene = produce(scene, draft=>{
            draft[key]=entity;
        });

        if(scene!=updatedScene){
            scene=updatedScene;
            emitChange();
        }
    },

    updateComponent(key, component, newAttributes)
    {
        const updatedScene = produce(scene, draft=>{
            Object.assign(draft[key][component], newAttributes);
        });

        if(scene!=updatedScene){
            scene=updatedScene;
            emitChange();
        }
    },

    nudgeShape(key)
    {
        console.log("toggle shape", key)

        const updatedScene = produce(scene, draft=>{
            draft[key]["shape"]["Cx"]+=Math.random()*10-5;
            draft[key]["shape"]["Cy"]+=Math.random()*10-5;
        });
        
        if(scene!=updatedScene){
            scene=updatedScene;
            emitChange();
        }
    },

    removeEntity(key)
    {

    },

    subscribe(listener) 
    {
        listeners = [...listeners, listener];
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },

    getSnapshot() {
        return scene;
    }
}