import React, {useState} from "react"
const h = React.createElement;

const Collapsable = ({...props})=>{
    const [isOpen, setOpen] = React.useState(false);
    return h("section", {
        ...props,
        className: ["collapsable", props.className].join(" "),
    }, 
        h("header", {
            onClick: (e)=>setOpen(!isOpen),
            
            style: {
                cursor: "pointer",
                ...props.style,
                position: "relative"
            }
        }, 
            isOpen?"▶":"▼",
            props.title
        ),
        isOpen?props.children:[]
    );
}

export default Collapsable;