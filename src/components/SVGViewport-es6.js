import React, {useState} from "react"
import Draggable from "./Draggable-es6.js"
import {Point, Vector, Ray} from "../geo.js"
import {Circle, LineSegment, Rectangle} from "../geo.js"
import {PointLight} from "../geo.js"


function viewboxString(viewBox){
    return viewBox.x+" "+viewBox.y+" "+viewBox.w+" "+viewBox.h;
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

    pointsToSvgPath(points) {
        let path = "M" + points.map(p => `${p.x},${p.y}`).join(" L");
        return path;
    }

    moveShape(shape, dx, dy){
        this.props.onShapeDrag(shape, dx, dy);
    }

    moveLight(light, dx, dy){
        this.props.onLightDrag(light, dx, dy);
    }

    render()
    {
        const viewBox = this.props.viewBox;
        
        const h = React.createElement;
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
            h('g', { className: 'circles' },
                this.props.scene.filter(shape => shape instanceof Circle).map(shape =>
                    h(Draggable, { onDrag: (dx, dy) => this.moveShape(shape, dx, dy) },
                        h('circle', {
                            cx: shape.center.x,
                            cy: shape.center.y,
                            r: shape.radius,
                            className: 'shape',
                            vectorEffect: "non-scaling-stroke"
                        })
                    )
                )
            ),
            h('g', { className: 'linesegment' },
                this.props.scene.filter(shape => shape instanceof LineSegment).map(shape =>
                    h(Draggable, { onDrag: (dx, dy) => this.moveShape(shape, dx, dy) },
                        h('line', {
                            x1: shape.p1.x,
                            y1: shape.p1.y,
                            x2: shape.p2.x,
                            y2: shape.p2.y,
                            className: 'shape',
                            vectorEffect: "non-scaling-stroke"
                        })
                    )
                )
            ),
            h('g', { className: 'rectangles' },
                this.props.scene.filter(shape => shape instanceof Rectangle).map(shape =>
                    h(Draggable, { onDrag: (dx, dy) => this.moveShape(shape, dx, dy) },
                        h('rect', {
                            x: shape.center.x - shape.width / 2,
                            y: shape.center.y - shape.height / 2,
                            width: shape.width,
                            height: shape.height,
                            className: 'shape',
                            vectorEffect: "non-scaling-stroke"
                        })
                    )
                )
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

            h('g', { className: 'lights' },
                this.props.scene.filter(obj=>obj instanceof PointLight).map(light =>
                    h(Draggable, { onDrag: (dx, dy) => this.moveLight(light, dx, dy) },
                        h('circle', {
                            cx: light.center.x,
                            cy: light.center.y,
                            r: '10',
                            className: 'lightsource',
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
                            vectorEffect: "non-scaling-stroke"
                        })
                    )
                )
            ),
        );
    }
}

export default SVGViewport;