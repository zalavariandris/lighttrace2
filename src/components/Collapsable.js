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

                ...props.style,
            }
        }, 
            h("div", {
                style:{
                    paddingRight: "1rem"
                }
                }, 
                isOpen?"▼":"▶"),
            props.title
        ),
        h("div", {
            style: {}
        }, 
            isOpen?props.children:[]
        )
        
    );
}

export default Collapsable;