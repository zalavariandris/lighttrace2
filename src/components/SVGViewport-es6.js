import React, {useState} from "react"
import Draggable from "./Draggable-es6.js"
import {Point, Vector, Ray} from "../geo.js"
import {Circle, DirectonalLight, LaserLight, LineSegment, Rectangle} from "../scene.js"
import {PointLight} from "../scene.js"


function viewboxString(viewBox){
    return viewBox.x+" "+viewBox.y+" "+viewBox.w+" "+viewBox.h;
}
const h = React.createElement;


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

class SVGViewport extends React.Component{
    // Set default props
    static defaultProps = {
        viewBox: {x:0, y:0, w:512, h:512},
        scene: [],
        rays: [],
        intersections: [], 
        paths: []
    }

    constructor({...props})
    {
        super(props);
        this.svgRef = React.createRef();
        this.isPanning = false;
        this.startPoint = {x:0,y:0};
        this.endPoint = {x:0,y:0};
        this.scale = 1;
    }

    // event handling
    onmousewheel(e)
    {
        let viewBox = this.props.viewBox;
        const clientSize = {w: this.svgRef.current.clientWidth, h: this.svgRef.current.clientHeight}
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

        this.props.onViewChange(viewBox)
        this.scale = clientSize.w/viewBox.w


        this.props.onViewChange(newViewBox)
    }

    onmousedown(e)
    {
        this.isPanning = true,
        this.startPoint = {x:e.clientX,y:e.clientY},
        this.endPoint = {x:e.clientX,y:e.clientY}

        e.preventDefault();
    }

    onmousemove(e)
    {
        if (this.isPanning)
        {
            const viewBox = this.props.viewBox;
            const clientSize = {w: this.svgRef.current.clientWidth, h: this.svgRef.current.clientHeight}
            let scale = clientSize.w/viewBox.w;
            
            var dx = (this.startPoint.x - e.clientX)/this.scale;
            var dy = (this.startPoint.y - e.clientY)/this.scale;
            
            var newViewBox = {
                x:viewBox.x+dx,
                y:viewBox.y+dy,
                w:viewBox.w,
                h:viewBox.h};


            this.endPoint = {x:e.clientX,y:e.clientY},
            this.startPoint = {x:e.clientX,y:e.clientY}


            this.props.onViewChange(newViewBox)
        }
    }

    onmouseup(e)
    {
        if (this.isPanning)
        {
            const viewBox = this.props.viewBox;
            const clientSize = {w: this.svgRef.current.clientWidth, h: this.svgRef.current.clientHeight}
            let scale = clientSize.w/viewBox.w;
            
            var dx = (this.startPoint.x - this.endPoint.x)/this.scale;
            var dy = (this.startPoint.y - this.endPoint.y)/this.scale;
            const newViewBox = {
                x:viewBox.x+dx,
                y:viewBox.y+dy,
                w:viewBox.w,
                h:viewBox.h
            };


            this.endPoint = {x:e.clientX,y:e.clientY},
            this.isPanning = false


            this.props.onViewChange(newViewBox)
        }
    }

    onmouseleave(e)
    {
        this.isPanning = false

    }

    // utils
    pointsToSvgPath(points) {
        let path = "M" + points.map(p => `${p.x},${p.y}`).join(" L");
        return path;
    }

    moveSceneObject(sceneObject, dx, dy){
        // this.props.onShapeDrag(shape, dx, dy);
        const newObject = sceneObject.copy()
        if(newObject instanceof LineSegment){
            newObject.p1.x+=dx;
            newObject.p1.y+=dy;
            newObject.p2.x+=dx;
            newObject.p2.y+=dy;
        }else{
            newObject.center.x+=dx
            newObject.center.y+=dy;
        }

        this.props.onSceneObject(sceneObject, newObject)
    }

    manipulateGeometry(sceneObject, newGeometry)
    {
        console.log("manipulateGeometry", newGeometry)
        this.props.onSceneObject(sceneObject, newGeometry)
    }

    selectObject(obj)
    {
        this.props.onSelection([obj])
    }

    render()
    {
        const viewBox = this.props.viewBox;
        
        
        return h('svg', {
                width: this.props.width,
                height: this.props.height,
                className: this.props.className,
                style: this.props.style,
                ref: this.svgRef,
                viewBox: viewboxString(viewBox),
                onMouseDown: (e) => this.onmousedown(e),
                onWheel: (e) => this.onmousewheel(e),
                onMouseMove: (e) => this.onmousemove(e),
                onMouseUp: (e) => this.onmouseup(e),
                onMouseLeave: (e) => this.onmouseleave(e)
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
            h('g', {className: "scene"},
                this.props.scene.map((sceneObject, idx)=>{
                    // return h('g', {}, )
                    
                    return h(Draggable, {
                        onDrag: (e, dx, dy) => this.moveSceneObject(sceneObject, dx, dy),
                        onClick: (e)=>this.selectObject(sceneObject),
                        className: this.props.selection.indexOf(sceneObject)>=0?"selected":"",
                        sceneObject
                    },
                        h(GeometryComponent, {
                            sceneObject, 
                            onManipulate:(newGeometry)=>this.manipulateGeometry(sceneObject, newGeometry),
                        })
                    );
                })
            ),
            h('g', { className: 'paths' },
                this.props.paths.filter(path => path.length > 1).map(points =>
                    h('g', null,
                        h('path', {
                            d: this.pointsToSvgPath(points),
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
                this.props.rays==undefined?null:this.props.rays.map(ray =>
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
                this.props.intersections==undefined?null:this.props.intersections.map(intersection =>
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
        );
    }
}

export default SVGViewport;