import React, {useState} from "react"


const h = React.createElement;

class ManipEvent{
    constructor({sceneX, sceneY, sceneStartX, sceneStartY, nativeEvent})
    {
        this.sceneX = sceneX;
        this.sceneY = sceneY;
        this.sceneStartX = sceneStartX;
        this.sceneStartY = sceneStartY
        this.nativeEvent = nativeEvent;

    }
}

function cursorPoint(svg, {x, y}){
    let pt = svg.createSVGPoint();
    pt.x =x; pt.y = y;
    const scenePoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    return {x:scenePoint.x, y:scenePoint.y};
}

function Manipulator({
    onDragStart=(manipEvent)=>{},
    onDrag=(manipEvent)=>{},
    onDragEnd=(manipEvent)=>{},
    showGuide=true,
    ...props
}={})
{
    const ref = React.useRef(null)
    const [active, setActive] = React.useState(false);
    const [sceneStart, setSceneStart] = React.useState({x:0, y:0})
    const [sceneMouse, setSceneMouse] = React.useState({x:0, y:0})
    // const [mouseScenePos, setMouseScenePos] = React.useState({x: x, y: y});
    // const [startPos, setStartPos] = React.useState({x: x, y: y});

    const handleMouseDown = (e)=>{
        if(props.onMouseDown){
            // call native event
            props.onMouseDown(e)
        }
        // const svg = e.target.closest("SVG");
        // mouseScenePos.current = {x: scene_x, scene_y}
        e.stopPropagation();
        e.preventDefault();


        const svg = e.target.closest("SVG");
        let startLoc = cursorPoint(svg, {x: e.clientX, y:e.clientY});

        setSceneMouse({x: startLoc.x, y: startLoc.y})
        setSceneStart({x: startLoc.x, y: startLoc.y})
        setActive(true)

        onDragStart(new ManipEvent({
            sceneX: startLoc.x, 
            sceneY: startLoc.y,
            sceneStartX: startLoc.x,
            sceneStartY: startLoc.y, 
            nativeEvent: e
        }));

        const handleMouseMove = (e)=>{
            let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});

            onDrag(new ManipEvent({
                sceneX: loc.x, 
                sceneY: loc.y,
                sceneStartX: startLoc.x,
                sceneStartY: startLoc.y, 
                nativeEvent: e
            }))
            setSceneMouse({x: loc.x, y: loc.y})
        }

        const handleMouseUp = (e)=>{
            var svg  = e.target.closest("SVG");
            let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
            window.removeEventListener("mousemove", handleMouseMove);
            onDragEnd(new ManipEvent({
                sceneX: loc.x, 
                sceneY: loc.y,
                sceneStartX: startLoc.x,
                sceneStartY: startLoc.y, 
                nativeEvent: e
            }))
            setActive(false)
        }

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", (e)=>handleMouseUp(e), {once: true});
    }

    return h("g", {
        ref:ref,
        style: {cursor: active?"grabbing":"grab"},
        ...props,
        onMouseDown: (e)=>handleMouseDown(e),
    }, 
        (active&&showGuide)?h("line", {
            className: "guide",
            x1: sceneStart.x,
            y1: sceneStart.y,
            x2: sceneMouse.x,
            y2: sceneMouse.y,
            vectorEffect: "non-scaling-stroke",
        }):null,
        props.children
    )
}

export default Manipulator;