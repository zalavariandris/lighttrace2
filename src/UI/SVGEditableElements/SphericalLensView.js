import React, {useState} from "react"
import Manipulator from "../Manipulator.js";
const h = React.createElement;


import Circle from "../../scene/shapes/Circle.js"


const SphericalLensView = ({
    cx, cy, diameter, edgeThickness, centerThickness,
    onChange=(value)=>{}
})=>{
    function arcFromThreePoints({Sx, Sy, Mx, My, Ex, Ey})
    {
        const circle = Circle.fromThreePoints({x:Sx, y:Sy}, {x:Mx, y:My}, {x:Ex, y:Ey})
        const r = circle.radius;
        const [SEx, SEy] = [Ex - Sx, Ey - Sy];
        const [SMx, SMy] = [Mx - Sx, My - Sy];
        const crossProduct = SEx * SMy - SEy * SMx;
        const side = crossProduct>0 ? 0 : 1; // 0: Left, 1:right
        return `M ${Sx} ${Sy} `+
        `a ${Math.abs(r)} ${Math.abs(r)} 0 0 ${side} ${Ex-Sx} ${Ey-Sy} `;
    }

    const makePathFromLens = ({cx,cy,d,edgeThickness, centerThickness})=>{
        return ""+
        arcFromThreePoints({
            Sx: cx-edgeThickness/2, 
            Sy: cy-diameter/2,
            Mx: cx-centerThickness/2,
            My: cy,
            Ex: cx-edgeThickness/2, 
            Ey: cy+diameter/2
        })+
        `L ${cx+edgeThickness/2} ${cy+diameter/2}`+
        arcFromThreePoints({
            Sx: cx+edgeThickness/2, 
            Sy: cy+diameter/2,
            Mx: cx+centerThickness/2,
            My: cy,
            Ex: cx+edgeThickness/2, 
            Ey: cy-diameter/2
        })+
        `L ${cx-edgeThickness/2} ${cy-diameter/2}` // this should work with close path 'Z'
    }

    return h(Manipulator, {           
        referenceX: cx,
        referenceY: cy,
        onDrag: e=>onChange({diameter, edgeThickness, centerThickness,
            cx: e.sceneX+e.referenceOffsetX, 
            cy: e.sceneY+e.referenceOffsetY
        }),
    },
        h("path", {
            d: makePathFromLens({cx, cy, diameter, edgeThickness, centerThickness}),
            className: "shape"
        }),
        h(Manipulator, {
            onDrag: e=>{
                onChange({cx, cy, diameter, edgeThickness,
                    centerThickness: (e.sceneX-cx)*2
                });
            }
        }, h('circle', {
            className: "autohide",
            cx:cx+centerThickness/2, 
            cy:cy,
            r: 5,
            vectorEffect: "non-scaling-stroke",
            style: {cursor: "ew-resize"}
        })),
        h(Manipulator, {
            onDrag: e=>{
                const newEdgeThickness = Math.max(1, (e.sceneX-cx)*2);
                onChange({cx, cy,
                    edgeThickness: newEdgeThickness,
                    centerThickness: Math.max(1, newEdgeThickness-edgeThickness + centerThickness),
                    diameter: Math.max(1, (e.sceneY-cy)*2)       
                });
            }
        }, h('circle', {
            className: "autohide",
            cx:cx+edgeThickness/2, 
            cy:cy+diameter/2,
            r: 5,
            vectorEffect: "non-scaling-stroke",
            style: {cursor: "nwse-resize"}
        })),
    )
}

export default SphericalLensView;