import React, {useState} from "react"
import Manipulator from "../manipulators/Manipulator.js";
const h = React.createElement;


import Circle from "../scene/shapes/Circle.js"


const SphericalLensView = ({
    lens, updateSceneObject
})=>{
    function arcFromThreePoints({Sx, Sy, Mx, My, Ex, Ey})
    {
        const circle = Circle.fromThreePoints("temp", {x:Sx, y:Sy}, {x:Mx, y:My}, {x:Ex, y:Ey})
        const r = circle.radius;
        const [SEx, SEy] = [Ex - Sx, Ey - Sy];
        const [SMx, SMy] = [Mx - Sx, My - Sy];
        const crossProduct = SEx * SMy - SEy * SMx;
        const side = crossProduct>0 ? 0 : 1; // 0: Left, 1:right
        return `M ${Sx} ${Sy} `+
        `a ${Math.abs(r)} ${Math.abs(r)} 0 0 ${side} ${Ex-Sx} ${Ey-Sy} `;
    }

    const makePathFromLens = (lens)=>{
        return ""+
        arcFromThreePoints({
            Sx: lens.x-lens.edgeThickness/2, 
            Sy: lens.y-lens.diameter/2,
            Mx: lens.x-lens.centerThickness/2,
            My: lens.y,
            Ex: lens.x-lens.edgeThickness/2, 
            Ey: lens.y+lens.diameter/2
        })+
        `L ${lens.x+lens.edgeThickness/2} ${lens.y+lens.diameter/2}`+
        arcFromThreePoints({
            Sx: lens.x+lens.edgeThickness/2, 
            Sy: lens.y+lens.diameter/2,
            Mx: lens.x+lens.centerThickness/2,
            My: lens.y,
            Ex: lens.x+lens.edgeThickness/2, 
            Ey: lens.y-lens.diameter/2
        })+
        `L ${lens.x-lens.edgeThickness/2} ${lens.y-lens.diameter/2}` // this should work with close path 'Z'
    }

    return h("g", null, 
        h("path", {
            d: makePathFromLens(lens),
            className: "shape"
        }),
        h(Manipulator, {
            onDrag: e=>{
                updateSceneObject(lens.key, {
                    centerThickness: (e.sceneX-lens.x)*2
                })
            }
        }, h('circle', {
            className: "autohide",
            cx:lens.x+lens.centerThickness/2, 
            cy:lens.y,
            r: 5,
            vectorEffect: "non-scaling-stroke",
            style: {cursor: "ew-resize"}
        })),
        h(Manipulator, {
            onDrag: e=>{
                const newEdgeThickness = Math.max(1, (e.sceneX-lens.x)*2);
                updateSceneObject(lens.key, {
                    edgeThickness: newEdgeThickness,
                    centerThickness: Math.max(1, newEdgeThickness-lens.edgeThickness + lens.centerThickness),
                    diameter: Math.max(1, (e.sceneY-lens.y)*2),
                })
            }
        }, h('circle', {
            className: "autohide",
            cx:lens.x+lens.edgeThickness/2, 
            cy:lens.y+lens.diameter/2,
            r: 5,
            vectorEffect: "non-scaling-stroke",
            style: {cursor: "nwse-resize"}
        })),
    )
}

export default SphericalLensView;