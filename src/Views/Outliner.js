import React, {useSyncExternalStore} from "react";
import sceneStore from "../stores/sceneStore.js";
import selectionStore from "../stores/selectionStore.js";

const h = React.createElement;

function Outliner()
{
    const scene = useSyncExternalStore(sceneStore.subscribe, sceneStore.getSnapshot);
    const selectionKeys = useSyncExternalStore(selectionStore.subscribe, selectionStore.getSnapshot);

    return h("ul", null, 
        ...Object.entries(scene).map(([key, sceneObject])=>{
            return h("li", {
                style: {fontStyle: selectionKeys.indexOf(key)>=0?"italic":"normal"}
            }, 
                h("a", {
                    href:"#", 
                    onClick:(e)=>{
                        e.preventDefault();
                        selectionStore.setSelectionKeys([key]);
                    }
                }, 
                    `${key}`
                )
            )
        })
    );
};

export default Outliner;