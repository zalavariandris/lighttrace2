import React, {useState} from "react"
import {Point, Vector, Ray} from "../geo.js"

const h = React.createElement;

function cursorPoint(svg, {x, y}){
    let pt = svg.createSVGPoint();
    pt.x =x; pt.y = y;
    const scenePoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    return {x:scenePoint.x, y:scenePoint.y};
}

function AngleManip({x, y, radians=0, length=30, onChange=(radians)=>{}, ...props}={}){
    const [mouseScenePos, setMouseScenePos] = React.useState({x: x, y: y});
    const [startPos, setStartPos] = React.useState({x:x, y:y});
    const [startRadians, setStartRadians] = React.useState(radians);
    const [active, setActive] = React.useState(false);

    function getCirclePath(points, radius, clockWise) {
        return ['L', points[0].x, points[0].y,
                'A', radius, radius, 0, 0, clockWise, points[1].x, points[1].y,
                'A', radius, radius, 0, 0, clockWise, points[2].x, points[2].y,
                'A', radius, radius, 0, 0, clockWise, points[3].x, points[3].y
               ].join(' ');
      }

    function getLocationFromAngle(degree, radius, center) {
        var radian = degree * Math.PI / 180;
        return {
          x : Math.cos(radian) * radius + center.x,
          y : Math.sin(radian) * radius + center.y
        }
      }

    function getPathArc(center, start, end, radius) {
        if (end == start) end += 360;
        var degree = end - start;
        // degree = degree < 0 ? (degree + 360) : degree;
        var points = [];
        points.push( getLocationFromAngle(start, radius, center) );
        points.push( getLocationFromAngle(start+degree/3, radius, center) );
        points.push( getLocationFromAngle(start+degree*2/3, radius, center) );
        points.push( getLocationFromAngle(end, radius, center) );
        return getCirclePath(points, radius, degree < 0 ? 0:1);
      }

    const handleMouseDown = (e)=>{
        // const svg = e.target.closest("SVG");
        // mouseScenePos.current = {x: scene_x, scene_y}
        e.stopPropagation();
        e.preventDefault();
        setStartRadians(radians);
        setActive(true)
        const svg  = e.target.closest("SVG");
        let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
        setMouseScenePos({x: loc.x, y:loc.y});

        const handleMouseMove = (e)=>{
            let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});

            const newRadians = Math.atan2(loc.y-y, loc.x-x)
            // console.log(angle)
            // const newLight = sceneObject.copy()
            // newLight.angle = angle;
            // onChange(sceneObject, newLight)

            setMouseScenePos({x: loc.x, y:loc.y});
            onChange(newRadians)
        }

        const handleMouseUp = (e)=>{
            window.removeEventListener("mousemove", handleMouseMove);
            console.log("mouse up")
            setActive(false)
        }

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", (e)=>handleMouseUp(e), {once: true});
    }


    const r=40;
    const dx = x-mouseScenePos.x;
    const dy = y-mouseScenePos.y;
    const mouseDistance = Math.sqrt(dx**2 + dy**2);
    return h('g', {className: "manip point"}, 
        (active&&Math.abs(startRadians-radians)>1e-6)?h('path', {
            className:"guide",
            d:`M${x} ${y} ` + getPathArc({x:x, y:y}, startRadians*180/Math.PI+0, radians*180/Math.PI+0, mouseDistance)
        }):"",
        h("circle", {
            cx: x+Math.cos(radians)*(active?mouseDistance:length), 
            cy: y+Math.sin(radians)*(active?mouseDistance:length),
            r:3,
            className:"handle",
            onMouseDown: (e)=>handleMouseDown(e)
        }),
        active?h("line", {
            className:"guide",
            x1: x, 
            y1: y,
            x2: mouseScenePos.x, 
            y2: mouseScenePos.y,
        }):"",
        active?h("text", {
            className:"guide",
            x: x, 
            y: y,
        }, `${(radians*180/Math.PI).toFixed(0)}`):""
    )
}

export default AngleManip;