import React, {useState} from "react"


const h = React.createElement;

function cursorPoint(svg, {x, y}){
    let pt = svg.createSVGPoint();
    pt.x =x; pt.y = y;
    const scenePoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    return {x:scenePoint.x, y:scenePoint.y};
}

function PointManip({x, y, onChange=(x, y)=>{}}={}){
    const ref = React.useRef(null)
    const [mouseScenePos, setMouseScenePos] = React.useState({x: x, y: y});
    const [startPos, setStartPos] = React.useState({x: x, y: y});

    const handleMouseDown = (e)=>{
        // const svg = e.target.closest("SVG");
        // mouseScenePos.current = {x: scene_x, scene_y}
        e.stopPropagation();
        e.preventDefault();

        setStartPos({x:x, y:y});

        const svg = e.target.closest("SVG")

        const handleMouseMove = (e)=>{
            let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});

            const angle = Math.atan2(loc.y-y, loc.x-x)
            // console.log(angle)
            // const newLight = sceneObject.copy()
            // newLight.angle = angle;
            // onChange(sceneObject, newLight)

            setMouseScenePos({x: loc.x, y:loc.y});
            onChange(loc.x, loc.y)
        }

        const handleMouseUp = (e)=>{
            var svg  = e.target.closest("SVG");
            let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
            setStartPos({x:loc.x, y:loc.y});
            window.removeEventListener("mousemove", handleMouseMove);
            console.log("mouse up", {x:loc.x, y:loc.y})
        }

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", (e)=>handleMouseUp(e), {once: true});
    }

    return h('g', {ref:ref, className: "manip point"}, 
        h("circle", {
            className:"handle",
            cx: x, 
            cy: y,
            r:3,
            onMouseDown: (e)=>handleMouseDown(e)
        }),
        h("line", {
            className:"guide",
            x1: startPos.x, 
            y1: startPos.y,
            x2: mouseScenePos.x, 
            y2: mouseScenePos.y
        })
    )
}

export default PointManip