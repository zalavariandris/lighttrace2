
// Define an epsilon value
const EPSILON = 1e-6;
// ANCHOR hello
class Circle{
    constructor(center,radius){
        this.center = center, this.radius=radius;
    }
    
    copy(other){
        return new Circle(this.center.copy(), this.radius)
    }
}

class Rectangle {
    constructor(center, width, height) {
        this.center = center;
        this.width = width;
        this.height = height;
    }
    
    copy(other){
        return new Rectangle(this.center.copy(), this.width, this.height)
    }
}

class LineSegment {
    constructor(p1, p2) { 
        this.p1 = p1;
        this.p2 = p2;
    }
    copy(other){
        return new LineSegment(this.p1.copy(), this.p2.copy())
    }
}

class Point{
    constructor(x,y){this.x=x; this.y=y;}
    copy(other){
        return new Point(this.x, this.y)
    }
    distance(p){
        const dx = this.x-p.x;
        const dy = this.y-p.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

class Vector{
    constructor(x,y){this.x=x; this.y=y;}
    copy(other){
        return new Point(this.x, this.y)
    }
    dotProduct(vector) {
        return this.x * vector.x + this.y * vector.y;
    }
    
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    multiply(value){
        return new Vector(this.x * value, this.y * value);
    }
    
    normalize(value=1.0) {
        const magnitude = this.magnitude();
        this.x = this.x / magnitude * value
        this.y = this.y / magnitude*value;
    }
    
    normalized(value=1.0) {
        const magnitude = this.magnitude();
        return new Vector(this.x / magnitude * value, this.y / magnitude*value);
    }
    
    reflect(normal) {
        const ray = this.normalized()
        // Normalize the normal vector
        const normalLength = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        const normalizedNormal = normal.normalized();
        
        // Calculate the dot product
        const dotProduct = ray.dotProduct(normalizedNormal);
        
        // Handle edge case: Zero-length normal vector
        if (Math.abs(dotProduct) < EPSILON) {
            return ray;
        }
        
        // Handle edge case: Parallel vector and normal
        if (Math.abs(dotProduct-1) < EPSILON || Math.abs(dotProduct+1) < EPSILON) {
            return new Vector(-ray.x, -ray.y);
        }
        
        // Calculate the reflected vector
        const reflectedX = ray.x - 2 * dotProduct * normalizedNormal.x;
        const reflectedY = ray.y - 2 * dotProduct * normalizedNormal.y;
        
        return new Vector(reflectedX, reflectedY);
    }
}

class Ray{
    constructor(origin, direction)
    {
        console.assert(origin instanceof Point, `origin must be a Point, got: ${origin}`)
        console.assert(direction instanceof Vector, `direction must be a vector, got: ${direction}`)
        this.origin=origin; this.direction=direction;
    }
    
    copy(other){
        return new Ray(this.origin.copy(), this.direction.copy())
    }
    
    intersectCircle(circle)
    {
        // 
        const d = new Vector(this.origin.x - circle.center.x, this.origin.y - circle.center.y); // to circle

        const dotProduct = this.direction.dotProduct(d.normalized());
        const a = this.direction.dotProduct(this.direction);
        const b = 2 * this.direction.dotProduct(d);
        const c = d.dotProduct(d) - circle.radius * circle.radius;
        const discriminant = b * b - 4 * a * c;
        
        // console.log(discriminant)
        if (discriminant < 0) {
            return [];
        }
        
        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);


        // const insideCircle = new Vector(this.origin.x-circle.center.x, this.origin.y-circle.center.y).magnitude()<(circle.radius+EPSILON);
        const outsideCircle = new Vector(this.origin.x-circle.center.x, this.origin.y-circle.center.y).magnitude()>(circle.radius+EPSILON);

        if(outsideCircle){
            // return []
            const t = Math.min(t1, t2);
            // console.log("outside", t)
            if (t < EPSILON)
            {
                return [];
            }
            const origin = P(this.origin.x + t * this.direction.x, this.origin.y + t * this.direction.y);
            const direction = V(origin.x - circle.center.x, origin.y - circle.center.y).normalized();
            
            return [new Ray(origin, direction.multiply(1))];

            return []
        }else{
            
            const t = Math.max(t1, t2);
            // console.log("inside", t)
            if (t < EPSILON)
            {
                return [];
            }
            const origin = P(this.origin.x + t * this.direction.x, this.origin.y + t * this.direction.y);
            // origin = P(10,10)

            const direction = V(origin.x - circle.center.x, origin.y - circle.center.y).normalized();
            
            return [new Ray(origin, direction.multiply(1))];
        }



        return []

    }

    intersectLineSegment(lineSegment) {
        const ray = this;
        const rayOrigin = ray.origin;
        const rayDirection = ray.direction.normalized();
        const lineSegmentP1 = lineSegment.p1;
        const lineSegmentP2 = lineSegment.p2;
        
        // Calculate the direction vector of the line segment
        const lineSegmentDirection = new Vector(
        lineSegmentP2.x - lineSegmentP1.x,
        lineSegmentP2.y - lineSegmentP1.y,
        );
        
        // Calculate the determinant
        const determinant = rayDirection.x * lineSegmentDirection.y - rayDirection.y * lineSegmentDirection.x;
        
        
        
        // If the determinant is close to zero, the lines are parallel
        if (Math.abs(determinant) < EPSILON) {
            return [];
        }
        
        // Calculate the intersection point
        const t1 = ((lineSegmentP1.x - rayOrigin.x) * lineSegmentDirection.y - (lineSegmentP1.y - rayOrigin.y) * lineSegmentDirection.x) / determinant;
        const t2 = ((lineSegmentP1.x - rayOrigin.x) * rayDirection.y - (lineSegmentP1.y - rayOrigin.y) * rayDirection.x) / determinant;
        
        // Check if the intersection point is within the line segment and the ray
        if (t1 >= -EPSILON && t2 >= -EPSILON && t2 <= 1 + EPSILON) {
            const intersectionPoint = P(
            rayOrigin.x + t1 * rayDirection.x,
            rayOrigin.y + t1 * rayDirection.y,
            );
            
            // Check if the intersection point is at the ray origin
            if (Math.abs(t1) < EPSILON) {
                return rayOrigin;
            }
            
            // Check if the intersection point is at one of the line segment endpoints
            if (Math.abs(t2) < EPSILON) {
                return lineSegmentP1;
            }
            if (Math.abs(t2 - 1) < EPSILON) {
                return lineSegmentP2;
            }
            
            // Calculate the line normal
            const V = new Vector(lineSegmentP1.x - lineSegmentP2.x, lineSegmentP1.y - lineSegmentP2.y);
            const N = new Vector(V.y, -V.x).normalized(); // perpendicular to V
            
            return [new Ray(intersectionPoint, N)];
        }
        
        // No intersection
        return [];
    }
    
    
    intersectRectangle(rectangle) {
        
        const top = rectangle.center.y+rectangle.height/2
        const left = rectangle.center.x-rectangle.width/2
        const bottom = rectangle.center.y-rectangle.height/2
        const right = rectangle.center.x+rectangle.width/2
        
        const topLeft = new Point(left, top)
        const bottomRight = new Point(right, bottom)
        const topRight = new Point(right, top)
        const bottomLeft = new Point(left, bottom)
        
        const sides = [
        new LineSegment(topLeft, topRight),
        new LineSegment(topRight, bottomRight),
        new LineSegment(bottomRight, bottomLeft),
        new LineSegment(bottomLeft, topLeft)
        ];
        
        let intersections = []
        for (const side of sides) {
            const side_intersections = this.intersectLineSegment(side);
            intersections = [...intersections, ...side_intersections]
        }
        return intersections;
    }
}
function P(x,y){return new Point(x,y)}
function V(x,y){return new Vector(x,y)}

class Draggable extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            isDragging: false,
            prevX: 0,
            prevY: 0
        }
    }
    
    handleMouseDown(event){
        this.setState({
            isDragging: true,
            prevX: event.clientX,
            prevY: event.clientY
        })
        
        window.addEventListener("mousemove", (e)=>this.handleMouseMove(e));
        window.addEventListener("mouseup", (e)=>this.handleMouseUp(e));
        event.preventDefault(); // prevent text selection when dragging
        event.stopPropagation();
    }
    
    handleMouseUp(event){
        this.setState({"isDragging": false})
        // event.stopPropagation();
    }
    
    handleMouseMove(event){
        let svg = event.target.closest("SVG")
        

        // Get point in global SVG space
        function cursorPoint(evt){
            pt.x = evt.clientX; pt.y = evt.clientY;
            return 
        }


        if (this.state.isDragging) {
            let mousepos = svg.createSVGPoint();
            mousepos.x = event.clientX; 
            mousepos.y = event.clientY; 
            mousepos = mousepos.matrixTransform(svg.getScreenCTM().inverse());

            let prevmousepos = svg.createSVGPoint();
            prevmousepos.x = this.state.prevX;
            prevmousepos.y = this.state.prevY;
            prevmousepos = prevmousepos.matrixTransform(svg.getScreenCTM().inverse());

            const dx = mousepos.x-prevmousepos.x;
            const dy = mousepos.y-prevmousepos.y;
            this.setState({
                prevX: event.clientX,
                prevY: event.clientY,
                // x: this.state.x+dx,
                // y: this.state.y+dy
            })
            this.props.onDrag(dx, dy);
        }
        // event.stopPropagation();
    }
    
    render(){
        // Create an SVGPoint for future math

        // const svg = svgRef.current;

        
        return (
            <g className="draggable" onMouseDown={(e)=>this.handleMouseDown(e)}>
                <g>
                    {this.props.children}
                </g>
            </g>
        )
    }  
}

class SVGViewport extends React.Component{
    constructor({...props}){
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

    viewboxString(viewBox){
        return viewBox.x+" "+viewBox.y+" "+viewBox.w+" "+viewBox.h;
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
        const scene = this.props.scene;
        const viewBox = this.props.viewBox;
        return (
            <svg width={this.props.width} height={this.props.height} className={this.props.className}
                ref={this.svgRef} 
                viewBox={this.viewboxString(viewBox)}
                onMouseDown={(e)=>this.onmousedown(e)}
                onWheel={(e)=>this.onmousewheel(e)}
                onMouseMove={(e)=>this.onmousemove(e)}
                onMouseUp={(e)=>this.onmouseup(e)}
                onMouseLeave={(e)=>this.onmouseleave(e)}>

                <g className="circles">
                    {scene.shapes.filter(shape=>shape instanceof Circle).map(shape => (
                        <Draggable onDrag={(dx, dy)=>this.moveShape(shape, dx, dy)}>
                            <circle cx={shape.center.x} cy={shape.center.y} r={shape.radius} className="shape"></circle>
                        </Draggable>
                    ))}
                </g>
                    
                <g className="linesegment">
                    {scene.shapes.filter(shape=>shape instanceof LineSegment).map(shape => (
                        <Draggable onDrag={(dx, dy)=>this.moveShape(shape, dx, dy)}>
                            <line x1={shape.p1.x} y1={shape.p1.y} x2={shape.p2.x} y2={shape.p2.y}  className="shape"></line>
                        </Draggable>
                    ))}
                </g>
                        
                <g className="rectangles">
                    {scene.shapes.filter(shape=>shape instanceof Rectangle).map(shape => (
                        <Draggable onDrag={(dx, dy)=>this.moveShape(shape, dx, dy)}>
                            <rect x={shape.center.x-shape.width/2}
                                y={shape.center.y-shape.height/2}
                                width={shape.width}
                                height={shape.height}
                                className="shape">
                            </rect>
                        </Draggable>
                    ))}
                </g>
                        
                <g className="rays" style={{display: "none"}}>
                    {scene.rays.map(ray => (
                        <g>
                            <line x1={ray.origin.x} 
                                y1={ray.origin.y} 
                                x2={ray.origin.x+ray.direction.x*1}
                                y2={ray.origin.y+ray.direction.y*1}
                                className="lightray">
                            </line>
                        </g>
                    ))}
                </g>
                        
                <g className="paths">
                    {scene.paths.filter(path=>path.length>1).map((points) => (
                        <g>
                            <path d={this.pointsToSvgPath(points)}
                                fill="none"
                                className="lightpath">
                            </path>
                        </g>
                    ))}
                </g>
                        
                <g className="lights"> 
                    {scene.lights.map(light => (
                        <Draggable onDrag={(dx, dy)=>this.moveLight(light, dx, dy)}>
                            <circle cx={light.x} 
                                cy={light.y} 
                                r="10" 
                                className="lightsource">
                            </circle>
                        </Draggable>
                    ))}
                </g>
            </svg>
        )
    }
}

function makeCircle (N)
{
    return Array(N).fill().map((_, i) => {
        var phi = 2 * Math.PI * (i / N)
        return [Math.cos(phi), Math.sin(phi)]
    })
}

function makeQuad()
{
    return [
        [-1, -1],
        [ 1, -1],
        [ 1,  1],
        [-1,  1]
    ]
}

function drawShape(regl, shape, view, projection, resolution)
{
    var m = mat4.identity([]);
    let N = 1;
    let position = []
    if(shape instanceof Circle)
    {
        N=36;
        mat4.translate(m, m, [shape.center.x, shape.center.y, 0])
        mat4.scale(m, m, [shape.radius, shape.radius, shape.radius])
        position = makeCircle(N);
    }
    if(shape instanceof Rectangle)
    {
        N=4;
        mat4.translate(m, m, [shape.center.x, shape.center.y, 0])
        mat4.scale(m, m, [shape.width/2, shape.height/2, 1])
        position = makeQuad();
    }
    if(shape instanceof LineSegment)
    {
        N=4;
        const rad = Math.atan2(shape.p2.y-shape.p1.y, shape.p2.x-shape.p1.x);
        const length = shape.p1.distance(shape.p2);
        const center = [shape.p1.x/2 + shape.p2.x/2, shape.p1.y/2 + shape.p2.y/2];
        mat4.translate(m, m, [center[0], center[1], 0])
        mat4.rotateZ(m,m, rad);
        mat4.scale(m, m, [length/2, 2, 1])
        position = makeQuad();
    }

    regl({
        context:{framebufferWidth: resolution.width, framebufferHeight: resolution.height},
        viewport: {x: 0, y: 0, w: resolution.width, h: resolution.height},
        // In a draw call, we can pass the shader source code to regl
        frag: `
        precision mediump float;
        uniform vec4 color;
        void main () {
            gl_FragColor = color;
        }`,

        vert: `
        precision mediump float;
        attribute vec2 position;
        uniform mat4 projection;
        uniform mat4 view;
        uniform mat4 model;
        void main () {
            gl_Position = projection * view * model * vec4(position, 0, 1);
        }`,

        attributes: {
            position: ()=>{
                if(shape instanceof Circle){
                    return makeCircle(36);
                }
                else if(shape instanceof Rectangle){
                    return makeQuad();
                }else{
                    return []
                }
            }
        },

        uniforms: {
            color: [.3, .1, .7, 1.0],
            // projection: mat4.ortho(-1,1,-1,1,-1,1,1),
            model: m,
            view: mat4.identity([]),
            projection: projection
        },
        primitive: 'triangle fan',
        count: N
    })()
}



function drawPaths(regl, paths, view, projection, resolution)
{
    let lines = []
    for(let path of paths)
    {
        for(let i=0; i<path.length-1; i++){
            lines.push([path[i].x, path[i].y]);
            lines.push([path[i+1].x, path[i+1].y]);
        }
    }

    const draw_lines = regl({
        context:{framebufferWidth: resolution.width, framebufferHeight: resolution.height},
        viewport: {x: 0, y: 0, w: resolution.width, h: resolution.height},
        // In a draw call, we can pass the shader source code to regl
        frag: `
        precision mediump float;
        uniform vec4 color;
        void main () {
            gl_FragColor = color;
        }`,

        vert: `
        precision mediump float;
        attribute vec2 position;
        uniform mat4 projection;
        void main () {
            gl_Position = projection * vec4(position, 0, 1);
        }`,

        attributes: {
            position: lines
        },

        uniforms: {
            color: [1, 1, .9, 1],
            projection: projection
        },

        blend: {
            enable: true,
            func: {
                srcRGB: 'src alpha',
                srcAlpha: 1,
                dstRGB: 'one minus src alpha',
                dstAlpha: 1
            },
            equation: {
                rgb: 'add',
                alpha: 'add'
            },
            color: [0, 0, 0, 0]
        },

        count: lines.length*2,
        primitive: "lines"
    })

    draw_lines()
}

function fit_viewbox_in_resolution(viewBox, resolution)
{
    // adjust viewbox width to match resolution aspect "contain"
    let resolution_aspect = resolution.width/resolution.height;
    let view_aspect = viewBox.w/viewBox.h;
    let newViewBox = viewBox;
    if(resolution_aspect > view_aspect)
    {
        const new_view_width = viewBox.h * resolution_aspect;
        newViewBox = {
            x: viewBox.x+(viewBox.w-new_view_width)/2,
            w: new_view_width,
            y: viewBox.y,
            h: viewBox.h
        }
    }
    else
    {
        const new_view_height = viewBox.w / resolution_aspect;
        newViewBox = {
            x: viewBox.x,
            w: viewBox.w,
            y: viewBox.y+(viewBox.h-new_view_height)/2,
            h: new_view_height
        }
    }

    return newViewBox
}

const GLViewport = React.forwardRef(({...props}, ref)=>{
    const refCanvas = React.useRef(null);
    const reglRef = React.useRef(null)
    const [resolution, setResolution] = React.useState({width: 512, height: 512})

    React.useImperativeHandle(ref, () => {
        return refCanvas.current;
    });


    // Function to handle window resize
    const handleResize = () => {
        setResolution({
            width: refCanvas.current.offsetWidth,
            height: refCanvas.current.offsetHeight
        });
    };

    React.useLayoutEffect(() => {
        // Set initial resolution
        handleResize();

        // Listen for window resize event
        window.addEventListener('resize', handleResize);

        return () => {
            // Remove event listener on component unmount
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Create REGL on component init
    React.useEffect(()=>{
        if(refCanvas.current)
        {
            console.log("create REGL")
            console.log("refcanvas:", refCanvas.current)
            reglRef.current = createREGL(refCanvas.current,{
                extensions: ['OES_texture_float', "OES_texture_half_float"]
            })
            console.log(reglRef.current)
            renderGL(reglRef.current, props.scene, props.viewBox);
        }
    }, []);

    // Rerender on change
    React.useEffect(()=>{
        if(reglRef.current){
            renderGL(reglRef.current, props.scene, props.viewBox);
        }
    });

    // The GL render function
    function renderGL(regl, scene, viewBox={x:0, y:0, w:512, h:512})
    {
        // console.log("rendergl", resolution.width, "x", resolution.height)
        const setupScene = regl({
            context:{framebufferWidth: resolution.width, framebufferHeight: resolution.height},
            viewport: {x: 0, y: 0, w: 512, h: 512},
            vert: `precision mediump float;
                attribute vec2 position;
                uniform mat4 projection;
                uniform mat4 view;
                uniform mat4 model;
                void main () {
                    gl_Position = projection * view * model * vec4(position, 0, 1);
                }`,

            frag: `precision mediump float;
                uniform vec4 color;
                void main () {
                    gl_FragColor = color;
                }`,
            uniforms: {
                view: mat4.identity([]),
                projection: mat4.ortho(mat4.identity([]), viewBox.x,viewBox.x+viewBox.w,viewBox.y+viewBox.h,viewBox.y,-1,1) //left, right, bottom, top, near, far
            }
        });

        const newViewBox = fit_viewbox_in_resolution(viewBox, resolution);
        const projection = mat4.identity([]);
        mat4.ortho(projection, newViewBox.x,newViewBox.x+newViewBox.w,newViewBox.h+newViewBox.y,newViewBox.y,-1,1) //left, right, bottom, top, near, far
        const view = mat4.identity([]);
    
        regl.clear({
            color: [0, 0, 0, 1],
            depth: 1
        })
    
        drawPaths(regl, scene.paths, view, projection, resolution);
    
        const drawSceneLight = regl({
            attributes: {
                position: makeCircle(36)
            },
    
            uniforms: {
                color: [1,1,0.3, 1.0],
                model: regl.prop("model"),
            },
            primitive: 'triangle fan',
            count: 36,
        });

        setupScene({}, ()=>{
            for(let light of scene.lights){
                var model = mat4.identity([]);
                mat4.translate(model, model, [light.x, light.y, 0])
                mat4.scale(model, model, [10,10, 1])
                drawSceneLight({model: model})
            }
        })
    
        for(let shape of scene.shapes){
            drawShape(regl, shape, view, projection, resolution);
        }
    }

    return (
        <canvas ref={refCanvas} width={resolution.width} height={resolution.height} className={props.className}></canvas>
    )
})

function raytrace(rays, shapes){
    // find intersections
    let intersections = []
    let secondaries = []
    for(let primary of rays)
    {
        if(primary == null){
            secondaries = [...secondaries, ...[null]]
            continue;
        }
        
        let ray_intersections = [];
        for(let shape of shapes)
        {
            let shape_intersections = []
            
            if(shape instanceof Circle){
                shape_intersections = [...shape_intersections, ...primary.intersectCircle(shape)];
            } 
            else if(shape instanceof Rectangle){
                shape_intersections = [...shape_intersections, ...primary.intersectRectangle(shape)];
            } else if(shape instanceof LineSegment){
                shape_intersections = [...shape_intersections, ...primary.intersectLineSegment(shape)];
            } 
            ray_intersections = [...ray_intersections, ...shape_intersections];
            
        }
        
        if(ray_intersections.length>0)
        {
            // find closest interseciont
            let closest = ray_intersections.reduce((a, b) => primary.origin.distance(a.origin) < primary.origin.distance(b.origin) ? a : b);
            ray_intersections.push(closest)
            
            // reflect ray on intersection
            const reflected_rays = [closest].map((i)=>{
                const secondary_dir = primary.direction.reflect(i.direction)
                return new Ray(i.origin, secondary_dir.normalized(100));
            });
            
            secondaries = [...secondaries, ...reflected_rays]
        }else[
            secondaries = [...secondaries, ...[null]]
        ]
    }
    
    // intersections
    return [secondaries, intersections];
}



function App()
{
    const [shapes, setShapes] = React.useState([
        new Circle(P(200, 120), 50),
        // new Circle(P(520, 550), 100),
        // new Circle(P(120, 380), 80),
        new Rectangle(P(700,700), 200,200),
        new LineSegment(P(200, 200), P(300, 130)),
    ]);
    
    const [lights, setLights] = React.useState([
        P(20,110)
    ])

    const [maxBounce, setMaxBounce] = React.useState(3)

    const svgRef = React.useRef();
    const glRef = React.useRef();

    const [viewBox, setViewBox] = React.useState({x:0,y:0,w:512,h:512});

    function move_light(light, dx, dy){
        const i = lights.indexOf(light);
        let new_lights = lights.map((l)=>light.copy());
        new_lights[i].x+=dx
        new_lights[i].y+=dy;
        setLights(new_lights);
    }
    
    function move_shape(shape, dx, dy)
    {
        const i = shapes.indexOf(shape);
        // dont mutate shapes state
        let new_shapes = shapes.map((s)=>s.copy());
        let new_shape = new_shapes[i];
        
        if(new_shape instanceof LineSegment){
            new_shape.p1.x+=dx;
            new_shape.p1.y+=dy;
            new_shape.p2.x+=dx;
            new_shape.p2.y+=dy;
        }else{
            new_shape.center.x+=dx
            new_shape.center.y+=dy;
        }
        setShapes(new_shapes);
    }
    
    function pointsToSvgPath(points) {
        let path = "M" + points.map(p => `${p.x},${p.y}`).join(" L");
        return path;
    }
    
    // shot rays from light sources
    const count = 100;
    const angles = Array.from({length:count},(v,k)=>k/count*Math.PI*2)
    const rays = lights.map((light_pos)=>{
        return angles.map((a)=>{
            const x = Math.cos(a);
            const y = Math.sin(a);
            const dir = V(x,y);
            return new Ray(light_pos, dir.normalized(1000))
        })
    }).flat(1)

    // const intesections = intersect(rays, shapes)
    let paths = rays.map((ray)=>[ray.origin])
    let current_rays = [...rays];
    let all_rays = [...current_rays]
    const path_count = rays.length
    for(let i=0; i<maxBounce; i++){
        let [secondary, intersections] = raytrace(current_rays, shapes);
        
        
        const zipped = current_rays.map((ray, index)=>[rays[ index], secondary[index], paths[index]]);
        for(let [ray, reflection, path] of zipped)
        {
            
        }
        
        for(let ray_index=0; ray_index<path_count; ray_index++)
        {
            const ray = current_rays[ray_index];
            const reflection = secondary[ray_index]
            const path = paths[ray_index]
            
            if(reflection != null){
                let p = reflection.origin
                path.push(p)
            }else if(ray != null){
                let dir = ray.direction.normalized(1000)
                let p = new Point(ray.origin.x+dir.x, ray.origin.y+dir.y)
                path.push(p)
            }
        }
        current_rays = secondary;
        all_rays = [...all_rays, ...secondary]
    }
    all_rays = all_rays.filter((ray)=>ray != null);
    
    return (
        <div>
            <div id="info">
                <section>
                    <h3>Lights</h3>
                    <ul>
                    {lights.map(light => (
                        <li>{light.x}, {light.y}</li>
                        ))}
                    </ul>

                </section>
                <section>
                    <h3>Shapes</h3>
                    <ul>
                    {shapes.map(shape => (
                        <li>{shape.constructor.name}</li>
                        ))}
                    </ul>
                </section>
            </div>
            <div id="controls">
                <section>
                    <h3>Raytrace</h3>
                    <input type="range" min="1" max="10" value={maxBounce} onInput={(e)=>setMaxBounce(e.target.value)}></input><span>{maxBounce}</span>
                </section>
            </div>

            <GLViewport
                ref={glRef}
                width="256" height="256" className="viewport"
                scene={{shapes: shapes, lights:lights, rays:rays, paths: paths}}
                viewBox={viewBox}>
            </GLViewport>		
            <SVGViewport
                ref={svgRef}
                width="256" height="256" className="viewport"
                scene={{shapes: shapes, lights:lights, rays:rays, paths: paths}}
                viewBox={viewBox} 
                onViewChange={(value)=>setViewBox(value)}
                onShapeDrag={(shape, dx, dy)=>move_shape(shape, dx, dy)}
                onLightDrag={(light, dx, dy)=>move_light(light, dx, dy)}>
            </SVGViewport>

        </div>
    );
}

const rdom = ReactDOM.createRoot(document.getElementById('root'))
rdom.render(React.createElement(App));