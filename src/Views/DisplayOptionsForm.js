import React from "react";
import displayOptionsStore from "../stores/displayOptionsStore.js";
const h = React.createElement;

function DisplayOptionsForm()
{
    const displayOptions = React.useSyncExternalStore(displayOptionsStore.subscribe, displayOptionsStore.getSnapshot);    
    return h("form", {
        onSubmit: (e)=>{
            //TODO: use form submission istead of each input change to update settings
            e.preventDefault();
            // const formData = new FormData(e.target)
            // const newData = Object.fromEntries(myFormData.entries());
            // setDisplayOptions(newData);
            // return false;
        }
    }, 
        h("label", null,
            h("input", {
                name:"rays",
                checked: displayOptions.lightrays, 
                onChange: (e)=>displayOptionsStore.updateVisibility({lightrays: e.target.checked}),
                type: "checkbox"
            }),
            "show lightrays"
        ),
        h("br"),
        h("label", null,
            h("input", {
                name:"hitPoints",
                checked: displayOptions.hitpoints, 
                onChange: (e)=>displayOptionsStore.updateVisibility({hitpoints: e.target.checked}),
                type: "checkbox"
            }),
            "show hitpoints"
        ),
        h("br"),
        h("label", null,
        h("input", {
            name:"glPaint",
            checked: displayOptions.glPaint, 
            onChange: (e)=>displayOptionsStore.updateVisibility({glPaint: e.target.checked}),
            type: "checkbox"
        }),
        "show gl paint"
    )
    
    )
}

export default DisplayOptionsForm;