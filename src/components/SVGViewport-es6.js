import React, {useState} from "react"
import {Point, Vector, Ray} from "../geo.js"
import {Circle, DirectonalLight, LaserLight, LineSegment, Rectangle, Lens} from "../scene.js"
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

function PointManip({x, y, onChange=(x, y)=>{}}={}){
    const [mouseScenePos, setMouseScenePos] = React.useState({x: x, y: y});
    const [startPos, setStartPos] = React.useState({x: x, y: y});

    const handleMouseDown = (e)=>{
        // const svg = e.target.closest("SVG");
        // mouseScenePos.current = {x: scene_x, scene_y}
        e.stopPropagation();
        e.preventDefault();

        setStartPos({x:x, y:y});

        const handleMouseMove = (e)=>{
            var svg  = e.target.closest("SVG");
            let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});

            const angle = Math.atan2(loc.y-y, loc.x-x)
            // console.log(angle)
            // const newLight = sceneObject.copy()
            // newLight.angle = angle;
            // onChange(sceneObject, newLight)

            setMouseScenePos({x: loc.x, y:loc.y});
            onChange({x:loc.x, y:loc.y})
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

    return h('g', {className: "manip point"}, 
        h("circle", {
            className:"handle",
            cx: x, 
            cy: y,
            r:3,
            onMouseDown: handleMouseDown
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
        var svg  = e.target.closest("SVG");
        let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
        setMouseScenePos({x: loc.x, y:loc.y});

        const handleMouseMove = (e)=>{
            var svg  = e.target.closest("SVG");
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
            onMouseDown: handleMouseDown
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
            className: isSelected ? 'selected sceneItem': 'sceneItem',
            onDrag: (e, dx, dy)=>moveSceneObject(sceneObject, dx, dy),
            onClick: (e)=>onSelect(sceneObject)
        },
            h("circle", {
                cx: sceneObject.center.x,
                cy: sceneObject.center.y,
                r: sceneObject.radius,
                className: "handle shape"
            })
        )
    }
    if(sceneObject instanceof Rectangle)
    {
        return h(Draggable, {
            className: isSelected ? 'selected sceneItem': 'sceneItem',
            onDrag: (e, dx, dy)=>moveSceneObject(sceneObject, dx, dy),
            onClick: (e)=>onSelect(sceneObject)
        },
            h('rect', {
                x: sceneObject.center.x - sceneObject.width / 2,
                y: sceneObject.center.y - sceneObject.height / 2,
                width: sceneObject.width,
                height: sceneObject.height,
                vectorEffect: "non-scaling-stroke",
                className: "handle shape"
            })
        )
    }

    else if(sceneObject instanceof Lens)
    {
        const makeLensPath = (width, height, leftRadius, rightRadius)=>{
            return `M ${-width/2} ${-height/2} `+
            `a ${Math.abs(leftRadius)} ${Math.abs(leftRadius)} 0 0 ${leftRadius<0?1:0} 0 ${height} `+
            `L ${width/2} ${height/2} `+
            `a ${Math.abs(rightRadius)} ${Math.abs(rightRadius)} 0 0 ${rightRadius<0?1:0} 0 ${-height}`
        }

        const onSizeManip = (loc)=>
        {
            const newLens = sceneObject.copy()
            newLens.width = Math.max(0, (loc.x - sceneObject.center.x)*2)
            newLens.height = Math.max((loc.y - sceneObject.center.y)*2)
            onChange(sceneObject, newLens)
        }

        const onRightLensManip = (loc)=>{
            const newLens = sceneObject.copy()

            const topRight = new Point(0, sceneObject.height/2)

            let V = new Vector(loc.x-(sceneObject.center.x+sceneObject.width/2), loc.y-(sceneObject.center.y))
            if(V.magnitude()>sceneObject.height/2){
                V = V.normalized(sceneObject.height/2)
                console.log(V)
            }
            const middle = new Point(V.x, V.y );
            const bottomRight = new Point(0, -sceneObject.height/2)
            const lensCircle = Circle.fromThreePoints(topRight, middle, bottomRight)

            newLens.rightRadius = Math.sign(V.x)*lensCircle.radius
            onChange(sceneObject, newLens)
        }

        const onLeftLensManip = (loc)=>{
            const newLens = sceneObject.copy()

            const topRight = new Point(0, sceneObject.height/2)

            let V = new Vector(+loc.x-(sceneObject.center.x-sceneObject.width/2), loc.y-(sceneObject.center.y))
            if(V.magnitude()>sceneObject.height/2){
                V = V.normalized(sceneObject.height/2)
                console.log(V)
            }
            const middle = new Point(V.x, V.y );
            const bottomRight = new Point(0, -sceneObject.height/2)
            const lensCircle = Circle.fromThreePoints(topRight, middle, bottomRight)

            newLens.leftRadius = -Math.sign(V.x)*lensCircle.radius
            onChange(sceneObject, newLens)
        }

        const getLeftLensWidth = (sceneObject)=>{
            const topLeft = new Point(sceneObject.center.x-sceneObject.width/2, sceneObject.center.y+sceneObject.height/2)
            const bottomLeft =  new Point(sceneObject.center.x-sceneObject.width/2, sceneObject.center.y-sceneObject.height/2)
            const lensCircle = Circle.fromRadiusAndTwoPoints(Math.abs(sceneObject.leftRadius), topLeft, bottomLeft)
            // console.log("lensCircle", lensCircle.center.x, lensCircle.radius)
            return Math.sign(sceneObject.leftRadius)*(lensCircle.radius - lensCircle.center.x)
        }

        const getRightLensWidth = (sceneObject)=>{
            const topLeft = new Point(sceneObject.center.x+sceneObject.width/2, sceneObject.center.y+sceneObject.height/2)
            const bottomLeft =  new Point(sceneObject.center.x+sceneObject.width/2, sceneObject.center.y-sceneObject.height/2)
            const lensCircle = Circle.fromRadiusAndTwoPoints(Math.abs(sceneObject.rightRadius), topLeft, bottomLeft)
            // console.log("lensCircle", lensCircle.center.x, lensCircle.radius)
            return Math.sign(sceneObject.rightRadius)*(lensCircle.radius - lensCircle.center.x)
        }

        return h(Draggable, {
            className: isSelected ? 'selected sceneItem': 'sceneItem',
            onDrag: (e, dx, dy)=>moveSceneObject(sceneObject, dx, dy),
            onClick: (e)=>onSelect(sceneObject)
        },
            h('rect', {
                x: sceneObject.center.x - sceneObject.width / 2,
                y: sceneObject.center.y - sceneObject.height / 2,
                width: sceneObject.width,
                height: sceneObject.height,
                vectorEffect: "non-scaling-stroke",
                fill: "transparent"
            }),
            h('path', {
                d: makeLensPath(sceneObject.width, sceneObject.height, sceneObject.leftRadius, sceneObject.rightRadius),
                style: {
                    transform: `translate(${sceneObject.center.x}px, ${sceneObject.center.y}px)`,
                    fill: "white",
                    opacity: 0.1,
                    className: "handle shape",
                }
            }),
            h(PointManip, {
                x: sceneObject.center.x+sceneObject.width/2,
                y: sceneObject.center.y+sceneObject.height/2,
                onChange: ({x, y})=>onSizeManip({x, y})
            }),
            h(PointManip, {
                x: sceneObject.center.x-sceneObject.width/2-getLeftLensWidth(sceneObject),
                y: sceneObject.center.y,
                onChange: ({x, y})=>onLeftLensManip({x, y})
            }),
            h(PointManip, {
                x: sceneObject.center.x+sceneObject.width/2+getRightLensWidth(sceneObject),
                y: sceneObject.center.y,
                onChange: ({x, y})=>onRightLensManip({x, y})
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
                onChange: ({x, y})=>setP1(x, y)
            }),
            h(PointManip, {
                x: sceneObject.p2.x, 
                y: sceneObject.p2.y,
                onChange: ({x, y})=>setP2(x, y)
            })
        )
    }

    else if(sceneObject instanceof PointLight)
    {
        const ref = React.useRef(null)
        const setPos = (x, y)=>{
            const newLight = sceneObject.copy()
            newLight.center.x = x;
            newLight.center.y = y;
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
                onChange: ({x, y})=>setPos(x, y),
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
                onChange: ({x, y})=>setPos(x, y),
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
            className: isSelected ? 'selected sceneItem light directional': 'sceneItem light directional',
            ref:ref}, 
            h('rect', {
                x: sceneObject.center.x-6,
                y: sceneObject.center.y-sceneObject.width/2,
                width: 6,
                height: sceneObject.width,
                vectorEffect: "non-scaling-stroke",
                className: "shape",
                style: {transform: `rotate(${sceneObject.angle*180/Math.PI}deg)`, transformOrigin: `${sceneObject.center.x}px ${sceneObject.center.y}px`}
            }),
            h(PointManip, {
                x: sceneObject.center.x,
                y: sceneObject.center.y,
                onChange: ({x, y})=>setPos(x, y),
            }),
            h(AngleManip, {
                x:sceneObject.center.x, 
                y:sceneObject.center.y,
                radians: sceneObject.angle,
                onChange: (newRadians)=>setRadians(newRadians)
            })
            
        )
    }

    return h("text", {className: "shape", x: sceneObject.center.x, y: sceneObject.center.y, fontSize:12}, `${sceneObject.constructor.name}`)

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