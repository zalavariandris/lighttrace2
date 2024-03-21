import React, {useState} from "react"
import {Point, Vector, Ray} from "../geo.js"
import {Circle, DirectonalLight, LaserLight, LineSegment, Rectangle, Lens} from "../scene.js"
import {PointLight} from "../scene.js"

import PointManip from "./PointManip.js"
import AngleManip from "./AngleManip.js"
import CircleItem from "./CircleItem.js"
import RectangleItem from "./RectangleItem.js"
import LensItem from "./LensItem.js"
import DirectionalLightItem from "./DirectionalLightItem.js"

function viewboxString(viewBox){
    return viewBox.x+" "+viewBox.y+" "+viewBox.w+" "+viewBox.h;
}
const h = React.createElement;

class Draggable extends React.Component
{
    constructor({...props})
    {
        super(props);
        this.isDragging= false;
        this.prevX= 0;
        this.prevY= 0;

        this.ref = React.createRef()
    }
    
    handleMouseDown(event)
    {
        this.isDragging = false,
        this.prevX = event.clientX,
        this.prevY = event.clientY

        this.handleMouseMove = (event)=>{
            if(!this.isDragging)
            {
                console.log("add click ignore")
                window.addEventListener("click", (e)=>{
                    e.preventDefault();
                    e.stopPropagation();
                }, {capture: true, once: true});
            }
            this.isDragging = true;
            let svg = event.target.closest("SVG")
            function mapScreenToScene({x, y})
            {
                let mousepos = svg.createSVGPoint();
                mousepos.x = x; 
                mousepos.y = y; 
                const scenePos = mousepos.matrixTransform(svg.getScreenCTM().inverse());
                return scenePos
            }


                let mousepos = svg.createSVGPoint();
                mousepos.x = event.clientX; 
                mousepos.y = event.clientY; 
                mousepos = mousepos.matrixTransform(svg.getScreenCTM().inverse());
    
                let prevmousepos = svg.createSVGPoint();
                prevmousepos.x = this.prevX;
                prevmousepos.y = this.prevY;
                prevmousepos = prevmousepos.matrixTransform(svg.getScreenCTM().inverse());
    
                const dx = mousepos.x-prevmousepos.x;
                const dy = mousepos.y-prevmousepos.y;
                

                this.prevX=event.clientX,
                this.prevY=event.clientY
                this.props.onDrag(event, dx, dy);

            this.prevX = event.clientX
            this.prevY = event.clientY
        }

        this.handleMouseUp = (event)=>{
            event.stopPropagation();
            event.preventDefault(); // prevent text selection when dragging
    
            window.removeEventListener("mousemove", this.handleMouseMove)
            window.removeEventListener("mouseup", this.handleMouseUp)


            this.isDragging = false;
        }

        window.addEventListener("mousemove", this.handleMouseMove, false);
        window.addEventListener("mouseup", this.handleMouseUp, false);
        
        // window.addEventListener("click", this.handleMouseClick, true);
        // window.addEventListener ('click', this.ignore_click, true ); 
        event.preventDefault(); // prevent text selection when dragging
        event.stopPropagation();
        return false;
    }

    render()
    {
        return h('g', { 
            ref: this.ref,
            onMouseDown: (e) => this.handleMouseDown(e),
            ...this.props
        },
            h('g', null,
                this.props.children
            )
        );
    }  
}


function SceneItem({
    sceneObject, 
    onChange=(oldSceneObject, newSceneObject)=>{},
    isSelected, 
    onSelect=(oldSceneObject)=>{}, 
    ...props
})
{
    if(sceneObject instanceof Circle)
    {
        return h(CircleItem, {
            circle:sceneObject, 
            onChange: onChange
        })
    }
    if(sceneObject instanceof Rectangle)
    {
        return RectangleItem({
            rectangle: sceneObject,
            onChange: onChange
        })
    }

    else if(sceneObject instanceof Lens)
    {
        return LensItem({
            lens: sceneObject,
            onChange: onChange
        })
    }

    else if(sceneObject instanceof LineSegment)
    {
        const setP1 = (Px, Py)=>{
            const newSceneObject = sceneObject.copy()
            newSceneObject.p1 = new Point(Px, Py)
            onChange(sceneObject, newSceneObject)
        }
        const setP2 = (Px, Py)=>{
            const newSceneObject = sceneObject.copy()
            newSceneObject.p2 = new Point(Px, Py)
            onChange(sceneObject, newSceneObject)
        }
        return h('g', {
                className: isSelected ? 'selected sceneItem': 'sceneItem',
            }, 
            h('line', {
                x1: sceneObject.p1.x,
                y1: sceneObject.p1.y,
                x2: sceneObject.p2.x,
                y2: sceneObject.p2.y,
                className: 'shape',
                vectorEffect: "non-scaling-stroke",
                // onMouseDown: ()=>this.selectObject(shape)
            }),
            h(PointManip, {
                x: sceneObject.p1.x, 
                y: sceneObject.p1.y,
                onChange: (x, y)=>setP1(x, y)
            }),
            h(PointManip, {
                x: sceneObject.p2.x, 
                y: sceneObject.p2.y,
                onChange: (x, y)=>setP2(x, y)
            })
        )
    }

    else if(sceneObject instanceof PointLight)
    {
        const ref = React.useRef(null)
        const setPos = (Px, Py)=>{
            const newLight = sceneObject.copy()
            newLight.center.x = Px;
            newLight.center.y = Py;
            onChange(sceneObject, newLight)
        }

        return h('g', {
            className: isSelected ? 'selected sceneItem light point': 'sceneItem light point',
            ref:ref
        }, 
            h('circle', {
                cx: sceneObject.center.x,
                cy: sceneObject.center.y,
                r: 6,
                vectorEffect: "non-scaling-stroke",
                className: "shape"
            }),
            h(PointManip, {
                x: sceneObject.center.x,
                y: sceneObject.center.y,
                onChange: (x, y)=>setPos(x, y),
            })
            
        )
    }

    else if(sceneObject instanceof LaserLight)
    {
        const ref = React.useRef(null)
        const setPos = (x, y)=>{
            const newLight = sceneObject.copy()
            newLight.center.x = x;
            newLight.center.y = y;
            onChange(sceneObject, newLight)
        }

        const [mouseScenePos, setMouseScenePos] = React.useState({x:0, y:0});

        const setRadians = (newRadians)=>{
            const newSceneObject = sceneObject.copy()
            newSceneObject.angle = newRadians;
            onChange(sceneObject, newSceneObject)
        }

        return h('g', {
            className: isSelected ? 'selected sceneItem light laser': 'sceneItem light point',
            ref:ref}, 
            h('circle', {
                cx: sceneObject.center.x,
                cy: sceneObject.center.y,
                r: 2,
                vectorEffect: "non-scaling-stroke",
                className: "shape"
            }),
            h(PointManip, {
                x: sceneObject.center.x,
                y: sceneObject.center.y,
                onChange: (x, y)=>setPos(x, y),
            }),
            h(AngleManip, {
                x:sceneObject.center.x, 
                y:sceneObject.center.y,
                radians: sceneObject.angle,
                onChange: (newRadians)=>setRadians(newRadians)
            })
            
        )
    }

    else if(sceneObject instanceof DirectonalLight)
    {
        return DirectionalLightItem({
            light: sceneObject,
            onChange: onChange
        });
    }

    return h("text", {className: "shape", x: sceneObject.center.x, y: sceneObject.center.y, fontSize:12}, `${sceneObject.constructor.name}`)

}

function SVGViewport({
    viewBox={x:0, y:0, w:512, h:512}, 
    onViewChange=()=>{},
    scene=[],
    onSceneObject=()=>{},
    rays=[], 
    hitPoints=[], 
    paths=[], 
    selection=[],
    onSelection=()=>{},
    ...props
}={})
{
    const svgRef = React.useRef()
    const isPanning = React.useRef(false)
    const prevMouse = React.useRef({x:0,y:0});

    const calcScale = ()=>{
        if(svgRef.current){
            const clientSize = {w: svgRef.current.clientWidth, h: svgRef.current.clientHeight}
            return viewBox.w/clientSize.w;
        }else{
            return 1.0;
        }
    }

    // event handling
    const onmousewheel = (e)=>
    {
        const clientSize = {w: svgRef.current.clientWidth, h: svgRef.current.clientHeight}
        var w = viewBox.w;
        var h = viewBox.h;
        var mx = e.clientX;//mouse x  
        var my = e.clientY;
        var dw = w*e.deltaY*0.01*-0.05;
        var dh = h*e.deltaY*0.01*-0.05;
        var dx = dw*mx/clientSize.w;
        var dy = dh*my/clientSize.h;
        const newViewBox = {
            x:viewBox.x+dx,
            y:viewBox.y+dy,
            w:viewBox.w-dw,
            h:viewBox.h-dh
        }

        onViewChange(newViewBox)
    }

    const onmousedown = (e)=>
    {
        isPanning.current = true,
        e.preventDefault();
    }

    const onmousemove = (e)=>
    {
        if (isPanning.current)
        {
            const clientSize = {w: svgRef.current.clientWidth, h: svgRef.current.clientHeight}
            let current_scale = clientSize.w/viewBox.w;
            
            var dx = -e.movementX/current_scale;
            var dy = -e.movementY/current_scale;
            
            var newViewBox = {
                x:viewBox.x+dx,
                y:viewBox.y+dy,
                w:viewBox.w,
                h:viewBox.h
            };

            onViewChange(newViewBox)
        }
    }

    const onmouseup = (e)=>
    {
        if (isPanning.current)
        {
            isPanning.current = false
        }
    }

    const onmouseleave = (e)=>
    {
        isPanning.current = false
    }



    // utils
    const pointsToSvgPath = (points)=> {
        let path = "M" + points.map(p => `${p.x},${p.y}`).join(" L");
        return path;
    }

    // actions


    // const manipulateGeometry = (oldObject, newGeometry)=>{
    //     onSceneObject(oldObject, newGeometry)
    // }

    return h('svg', {
            xmlns:"http://www.w3.org/2000/svg",
            width: props.width,
            height: props.height,
            className: props.className,
            style: {"--zoom": calcScale(), ...props.style},
            ref: svgRef,
            viewBox: viewboxString(viewBox),
            onMouseDown: (e) => onmousedown(e),
            onWheel: (e) => onmousewheel(e),
            onMouseMove: (e) => onmousemove(e),
            onMouseUp: (e) => onmouseup(e),
            onMouseLeave: (e) => onmouseleave(e)
        },
        h('defs', null, 
            h('marker', {
                markerUnits:"strokeWidth",
                id:'head',
                orient:"auto",
                markerWidth:'8',
                markerHeight:'8',
                refX:'0',
                refY:'4'
            },
                h('path', {d:'M0,0 V8 L8,4 Z'})
            )
        ),
        h('g', {className: 'paths'},
            paths.filter(path => path.length > 1).map(points =>
                h('g', null,
                    h('path', {
                        d: pointsToSvgPath(points),
                        fill: 'none',
                        className: 'lightpath',
                        strokeLinejoin:"round",
                        strokeLinecap:"round",
                        vectorEffect: "non-scaling-stroke"
                    })
                )
            )
        ),
        h('g', { className: 'rays'},
            rays==undefined?null:rays.map(ray =>
                h('g', null,
                    h('line', {
                        x1: ray.origin.x,
                        y1: ray.origin.y,
                        x2: ray.origin.x + ray.direction.x * 1000,
                        y2: ray.origin.y + ray.direction.y * 1000,
                        className: 'lightray',
                        vectorEffect: "non-scaling-stroke"
                    })
                )
            )
        ),

        h('g', { className: 'hitPoints'},
            hitPoints==undefined?null:hitPoints.map(hitPoint =>
                h('g', null,
                    h('line', {
                        x1: hitPoint.position.x,
                        y1: hitPoint.position.y,
                        x2: hitPoint.position.x + hitPoint.surfaceNormal.x * 20,
                        y2: hitPoint.position.y + hitPoint.surfaceNormal.y * 20,
                        className: 'hitPoint',
                        // markerEnd:'url(#head)',
                        vectorEffect: "non-scaling-stroke"
                    })
                )
            )
        ),
        h('g', {className: "scene"},
            scene.map((sceneObject, idx)=>{
                // return h('g', {}, )

                return h(SceneItem, {
                    sceneObject: sceneObject,
                    onChange: (oldSceneObject, newSceneObject)=>onSceneObject(sceneObject, newSceneObject),
                    isSelected: selection.indexOf(sceneObject)>=0,
                    onSelect: ()=>onSelection([sceneObject])
                })
            })
        )
    );
}

export default SVGViewport;