import React, {useState} from "react"
import {Point, Vector, Ray} from "../geo.js"
import {Circle, DirectonalLight, LaserLight, LineSegment, Rectangle} from "../scene.js"
import {PointLight} from "../scene.js"


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
            // className: 'draggable',
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


function cursorPoint(svg, {x, y}){
    let pt = svg.createSVGPoint();
    pt.x =x; pt.y = y;
    const scenePoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    return {x:scenePoint.x, y:scenePoint.y};
}

function PointManip({x, y, onChange=({x, y})=>{}, ...props})
{
    const ref = React.useRef();

    return h(Draggable, {
        ref: ref,
        onDrag:(e, dx, dy)=>onChange({x:x+dx, y:y+dy}),
        fill:'yellow', strokeWidth:4,
        style: {
            transform: `scale(var(--zoom))`,
            transformOrigin: `${x}px ${y}px`
        },
        ...props
    }, 
        h('circle', {cx:x, cy:y, r:5, })
    )
}

function SceneItem({
    sceneObject, 
    onChange=(oldSceneObject, newSceneObject)=>{},
    isSelected, 
    onSelect=(oldSceneObject)=>{}, 
    ...props
})
{
    const moveSceneObject = (oldObject, dx, dy)=>{
        // this.props.onShapeDrag(shape, dx, dy);
        const newObject = oldObject.copy()

        if(newObject instanceof LineSegment){
            newObject.p1.x+=dx;
            newObject.p1.y+=dy;
            newObject.p2.x+=dx;
            newObject.p2.y+=dy;
        }else{
            newObject.center.x+=dx
            newObject.center.y+=dy;
        }

        onChange(oldObject, newObject)
    }

    if(sceneObject instanceof Circle)
    {
        return h(Draggable, {
            className: "shape " + (isSelected ? 'selected': ''),
            onDrag: (e, dx, dy)=>moveSceneObject(sceneObject, dx, dy),
            onClick: (e)=>onSelect(sceneObject)
        },
            h("circle", {
                cx: sceneObject.center.x,
                cy: sceneObject.center.y,
                r: sceneObject.radius
            }),
            h('text', {
                x: sceneObject.center.x,
                y: sceneObject.center.y,
                stroke: "1px",
            }, `${sceneObject.constructor.name}`)
        )
    }
    if(sceneObject instanceof Rectangle)
    {
        return h(Draggable, {
            className: "shape " + (isSelected ? 'selected': ''),
            onDrag: (e, dx, dy)=>moveSceneObject(sceneObject, dx, dy),
            onClick: (e)=>onSelect(sceneObject)
        },
            h('rect', {
                x: sceneObject.center.x - sceneObject.width / 2,
                y: sceneObject.center.y - sceneObject.height / 2,
                width: sceneObject.width,
                height: sceneObject.height,
                vectorEffect: "non-scaling-stroke",
            })
        )
    }

    else if(sceneObject instanceof LineSegment)
    {
        const setP1 = (x, y)=>{
            const newSceneObject = sceneObject.copy()
            newSceneObject.p1 = new Point(x, y)
            onChange(sceneObject, newSceneObject)
        }
        const setP2 = (x, y)=>{
            const newSceneObject = sceneObject.copy()
            newSceneObject.p2 = new Point(x, y)
            onChange(sceneObject, newSceneObject)
        }
        return h('g', {
                className: "shape " + (isSelected ? 'selected': ''),
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
                onChange: ({x, y})=>setP1(x, y)
            }),
            h(PointManip, {
                x: sceneObject.p2.x, 
                y: sceneObject.p2.y,
                onChange: ({x, y})=>setP2(x, y)
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

        const handleMouseDown = (e)=>{
            // const svg = e.target.closest("SVG");
            // mouseScenePos.current = {x: scene_x, scene_y}
            e.stopPropagation();
            e.preventDefault();

            const prevAngle = sceneObject.angle;

            const handleMouseMove = (e)=>{
                var svg  = e.target.closest("SVG");
                let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});

                const angle = Math.atan2(loc.y-sceneObject.center.y, loc.x-sceneObject.center.x)
                console.log(angle)
                const newLight = sceneObject.copy()
                newLight.angle = angle;
                onChange(sceneObject, newLight)

                setMouseScenePos({x: loc.x, y:loc.y});
            }

            const handleMouseUp = (e)=>{
                window.removeEventListener("mousemove", handleMouseMove);
                console.log("mouse up")
            }

            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", (e)=>handleMouseUp(e), {once: true});
        }


        return h('g', {ref:ref, className: "shape"}, 
            h('circle', {
                cx: sceneObject.center.x,
                cy: sceneObject.center.y,
                r: 3,
                vectorEffect: "non-scaling-stroke",
            }),
            h(PointManip, {
                x: sceneObject.center.x,
                y: sceneObject.center.y,
                onChange: ({x, y})=>setPos(x, y),
            }),
            h('g', null, 
                h("circle", {
                    cx: sceneObject.center.x+Math.cos(sceneObject.angle)*30, 
                    cy: sceneObject.center.y+Math.sin(sceneObject.angle)*30,
                    r:3,
                    fill: "green",
                    onMouseDown: handleMouseDown
                }),
                h("line", {
                    x1: sceneObject.center.x, 
                    y1: sceneObject.center.y,
                    x2: mouseScenePos.x, 
                    y2: mouseScenePos.y,
                    strokeWidth: 1,
                    strokeDasharray: "0 10 0"
                })
            )
            
        )
    }

    return h("text", {x: sceneObject.center.x, y: sceneObject.center.y, fontSize:12}, `${sceneObject.constructor.name}`)

}

function GeometryComponent({sceneObject, onManipulate, ...props})
{
    const children = []
    if(sceneObject instanceof Circle)
    {
        children.push(h('circle', {
            cx: sceneObject.center.x,
            cy: sceneObject.center.y,
            r: sceneObject.radius,
            className: "shape"
        }))
    }
    if(sceneObject instanceof LineSegment)
    {
        children.push(h('line', {
            x1: sceneObject.p1.x,
            y1: sceneObject.p1.y,
            x2: sceneObject.p2.x,
            y2: sceneObject.p2.y,
            className: 'shape',
            vectorEffect: "non-scaling-stroke",
            // onMouseDown: ()=>this.selectObject(shape)
        }))
    }
    if(sceneObject instanceof Rectangle)
    {
        children.push(h('rect', {
            x: sceneObject.center.x - sceneObject.width / 2,
            y: sceneObject.center.y - sceneObject.height / 2,
            width: sceneObject.width,
            height: sceneObject.height,
            className: 'shape',
            vectorEffect: "non-scaling-stroke",
        }))
    }
    if(sceneObject instanceof LaserLight)
    {
        children.push(h('circle', {
            cx: sceneObject.center.x,
            cy: sceneObject.center.y,
            r: '3',
            className: 'lightsource',
            vectorEffect: "non-scaling-stroke",
        }))

        function rotateLaser(light, e, dx, dy)
        {
            const svg = e.target.closest("SVG")
            function screenToScene(svg, screenpos)
            {
                
                let scenepos = svg.createSVGPoint();
                scenepos.x = screenpos.x; 
                scenepos.y = screenpos.y; 
                return scenepos.matrixTransform(svg.getScreenCTM().inverse());
            }
    
            // const svg = this.svgRef.current
            const scenePos = screenToScene(svg, {x: e.offsetX, y: e.offsetY})
    
    
            const newLight = light.copy()
            
            newLight.angle = Math.atan2(scenePos.y-light.center.y, scenePos.x-light.center.x)
            console.log("rotate laser", newLight)
            onManipulate(newLight)
        }

        children.push(h(Draggable, { onDrag: (e, dx, dy) => rotateLaser(sceneObject, e, dx, dy), ...props },
                h('circle', {
                    cx: sceneObject.center.x+Math.cos(sceneObject.angle)*30,
                    cy: sceneObject.center.y+Math.sin(sceneObject.angle)*30,
                    r: '3',
                    className: 'manip'
                })
            )
        )
    }

    if(sceneObject instanceof PointLight)
    {
        children.push(h('circle', {
            cx: sceneObject.center.x,
            cy: sceneObject.center.y,
            r: '10',
            className: 'lightsource',
            vectorEffect: "non-scaling-stroke",
        }))
    }

    if(sceneObject instanceof DirectonalLight)
    {
        children.push(h('rect', {
            x: sceneObject.center.x-2,
            y: sceneObject.center.y-10,
            width: 2,
            height: sceneObject.width,
            style: {transform: `rotate(${sceneObject.angle}rad)`, transformOrigin: `${sceneObject.center.x}px ${sceneObject.center.y}px`},
            className: 'lightsource',
            vectorEffect: "non-scaling-stroke",
            
        }))

        // children.push(h(Draggable, { onDrag: (e, dx, dy) => rotateLaser(sceneObject, e, dx, dy) },
        //     h('circle', {
        //         cx: sceneObject.center.x+Math.cos(sceneObject.angle)*30,
        //         cy: sceneObject.center.y+Math.sin(sceneObject.angle)*30,
        //         r: '3',
        //         className: 'manip'
        //     })
        // ))
    }
    
    return h("g", {...props}, ...children)
}

function SVGViewport({
    viewBox={x:0, y:0, w:512, h:512}, 
    onViewChange=()=>{},
    scene=[],
    onSceneObject=()=>{},
    rays=[], 
    intersections=[], 
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

        h('g', { className: 'intersections'},
            intersections==undefined?null:intersections.map(intersection =>
                h('g', null,
                    h('line', {
                        x1: intersection.origin.x,
                        y1: intersection.origin.y,
                        x2: intersection.origin.x + intersection.direction.x * 20,
                        y2: intersection.origin.y + intersection.direction.y * 20,
                        className: 'intersection',
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