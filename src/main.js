import ReactDOM from "react-dom"
import React, {createContext, useState, useReducer, useSyncExternalStore} from "react"

import SVGViewport from "./Views/SVGViewport.js";
import GLViewport from "./Views/GLViewport.js";
import Collapsable from "./UI/Collapsable.js";




import {raytrace, SamplingMethod} from "./scene/raytrace.js"
import Inspector from "./Views/Inspector.js"


// Global Stores
import displayOptionsStore from "./stores/displayOptionsStore.js"
import raytraceOptionsStore from "./stores/raytraceOptionsStore.js"
import sceneStore from "./stores/sceneStore.js"
import selectionStore from "./stores/selectionStore.js"
import mouseToolsStore from "./stores/mouseToolsStore.js"

// Store Views
import DisplayOptionsForm from "./Views/DisplayOptionsForm.js";
import RaytraceOptionsForm from "./Views/RaytraceOptionsForm.js";
import Outliner from "./Views/Outliner.js"
import {circleTool, rectangleTool, lineTool, lensTool, pointlightTool, directionalLightTool, laserTool} from "./Views/MouseTools.js";

/*MAIN*/ 
const h = React.createElement;

const mouseTools = {
    "circle": circleTool, 
    "rectangle": rectangleTool, 
    "line": lineTool, 
    "lens": lensTool,
    "pointlight": pointlightTool, 
    "directional": directionalLightTool, 
    "laser": laserTool
};


function Toolbar()
{
    const currentToolName = React.useSyncExternalStore(mouseToolsStore.subscribe, mouseToolsStore.getSnapshot);
    const selectionKeys = useSyncExternalStore(selectionStore.subscribe, selectionStore.getSnapshot);

    /*TOOLBAR*/
    return h("div", {
        id: "toolbar", className: "panel"
    },
        h("button", {
            onClick: e=>mouseToolsStore.setCurrentTool(toolName),
            className: currentToolName == null ? "active" : null
        }, h("i", {className: "fa-solid fa-arrow-pointer"})),

        Object.keys(mouseTools).map(toolName=>{
            return h("button", {
                onClick: e=>mouseToolsStore.setCurrentTool(toolName),
                title: toolName,
                className: currentToolName == toolName ? "active" : null
            }, `${toolName}`)
        }),
        h("hr"),
        h("button", {
            onClick: (e)=>{
                if(selectionKeys.length<1){
                    return;
                }
                const selectedObjectKey = selectionKeys[0];
                if(selectedObjectKey)
                {
                    sceneStore.removeSceneObject(selectedObjectKey)
                }
            },
            className: "danger"
        }, "delete")
    )
}

function Sidebar()
{
    const scene = useSyncExternalStore(sceneStore.subscribe, sceneStore.getSnapshot);
    const selectionKeys = useSyncExternalStore(selectionStore.subscribe, selectionStore.getSnapshot);

    return h("div", {
        className: "panel", 
        style: {right: "0px", top:"0px", position: "fixed"}
    }, 
        
        // h(BlackBody, null),
        h(Inspector, {
            sceneObject: selectionKeys.length>0?scene[selectionKeys[0]]:null,
            onChange: (newSceneObject)=>sceneStore.updateSceneObject(selectionKeys[0], newSceneObject)
        }),
        // h(RaytraceStats),
        h(Collapsable, {title: h("h2", null, "Display options"), defaultOpen:false},
            h(DisplayOptionsForm)
        ),
        h(Collapsable, {title: h("h2", null, "Raytrace otions"), defaultOpen:false},
            h(RaytraceOptionsForm)
        ),
        h(Collapsable, {title: h("h2", null, "Outliner"), defaultOpen: false},
            h(Outliner)
        )
    )
}

const App = ()=>{
    /*Settings*/
    const raytraceOptions = useSyncExternalStore(raytraceOptionsStore.subscribe, raytraceOptionsStore.getSnapshot);
    const displayOptions = useSyncExternalStore(displayOptionsStore.subscribe, displayOptionsStore.getSnapshot);

    // SCENE OBJECTS
    const scene = useSyncExternalStore(sceneStore.subscribe, sceneStore.getSnapshot);
    const selectionKeys = useSyncExternalStore(selectionStore.subscribe, selectionStore.getSnapshot);
    

    // sync svg- and glviewport viewbox
    const [viewBox, setViewBox] = React.useState({
        x:0,y:0,w:512,h:512
    });

    // inital raytrace

    /* MOUSE TOOLS */
    const currentToolName = React.useSyncExternalStore(mouseToolsStore.subscribe, mouseToolsStore.getSnapshot);


    const handleMouseDownTools = e =>
    {
        if(currentToolName){
            const handler = mouseTools[currentToolName];
            handler(e);
        }
    }

    return h("div", null,
            /*VIEWPORTS*/
            displayOptions.glPaint?h(GLViewport,  {
                className:"viewport",
                viewBox: viewBox,
                scene: scene
            }):null,
            h(SVGViewport, {
                className:"viewport",
                viewBox: viewBox,
                onViewChange: viewBox=>setViewBox(viewBox),
                onMouseDown: e=>{
                    console.log("handle mousedown")
                    if(currentToolName)
                    {
                        handleMouseDownTools(e);
                        e.preventDefault();
                    }
                },
                onClick:(e)=>{
                    // TODO check the actual element not just the type
                    if(e.target.tagName=="svg")
                    {
                        selectionStore.setSelectionKeys([]);
                    }
                }
            }),

            h(Toolbar),
            h(Sidebar)
        )
}

const rdom = ReactDOM.createRoot(document.getElementById('root'));
rdom.render(React.createElement(App));