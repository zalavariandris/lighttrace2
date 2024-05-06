import sceneStore from "../stores/sceneStore.js";
import Circle from "../scene/shapes/Circle.js"
import Rectangle from "../scene/shapes/Rectangle.js"
import SphericalLens from "../scene/shapes/SphericalLens.js"
import LineSegment from "../scene/shapes/LineSegment.js"
import PointLight from "../scene/lights/PointLight.js";
import DirectionalLight from "../scene/lights/DirectionalLight.js";
import LaserLight from "../scene/lights/LaserLight.js";

function cursorPoint(svg, {x, y}){
    let pt = svg.createSVGPoint();
    pt.x =x; pt.y = y;
    const scenePoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    return {x:scenePoint.x, y:scenePoint.y};
}

const generateId = ()=>{
    return Math.random().toString(32).substring(2, 9);
};

const selectAndMoveTool = e => {

}

const circleTool = e => {
    e.preventDefault();
    var svg  = e.target.closest("SVG");
    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});

    const [beginSceneX, beginSceneY] = [loc.x, loc.y];

    // create circle
    const key = generateId();
    sceneStore.addSceneObject(key, new Circle({
        Cx: beginSceneX, 
        Cy: beginSceneY, 
        radius:5, 
        material: "glass"
    }));

    const handleDrag = e=>{
        // var svg  = e.target.closest("SVG");
        let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
        const [sceneX, sceneY] = [loc.x, loc.y]
        const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];

        sceneStore.updateSceneObject(key, {
            radius: Math.hypot(dx, dy)
        });
    }

    window.addEventListener("mousemove", handleDrag);
    window.addEventListener("mouseup", e=>{
        window.removeEventListener("mousemove", handleDrag);
        mouseToolsStore.setCurrentTool(null)
    }, {once: true});
};

const rectangleTool = e => {
    e.preventDefault();
    var svg  = e.target.closest("SVG");
    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
    const [beginSceneX, beginSceneY] = [loc.x, loc.y];

    const key = generateId();

    sceneStore.addSceneObject(key, new Rectangle({
        Cx: beginSceneX, 
        Cy: beginSceneY, 
        width: 5,
        height: 5,
        material: "diffuse"
    }));

    const handleDrag = e=>{
        // var svg  = e.target.closest("SVG");
        let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
        const [sceneX, sceneY] = [loc.x, loc.y]
        const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];

        sceneStore.updateSceneObject(key, {
            width: Math.abs(dx)*2,
            height: Math.abs(dy)*2
        });
    }

    window.addEventListener("mousemove", handleDrag);
    window.addEventListener("mouseup", e=>{
        window.removeEventListener("mousemove", handleDrag);
        mouseToolsStore.setCurrentTool(null)
    }, {once: true});
}

const lineTool = e => {
    e.preventDefault();
    var svg  = e.target.closest("SVG");
    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
    const [beginSceneX, beginSceneY] = [loc.x, loc.y];

    const key = generateId();
    sceneStore.addSceneObject(key, new LineSegment({
        Ax: beginSceneX, 
        Ay: beginSceneY, 
        Bx: beginSceneX+5,
        By: beginSceneY,
        material: "diffuse"
    }));

    const handleDrag = e=>{
        // var svg  = e.target.closest("SVG");
        let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
        const [sceneX, sceneY] = [loc.x, loc.y];

        sceneStore.updateSceneObject(key, {
            Bx: sceneX, 
            By: sceneY
        });
    }

    window.addEventListener("mousemove", handleDrag);
    window.addEventListener("mouseup", e=>{
        window.removeEventListener("mousemove", handleDrag);
        mouseToolsStore.setCurrentTool(null)
    }, {once: true});
}

const lensTool = e => {
    e.preventDefault();
    var svg  = e.target.closest("SVG");
    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
    const [beginSceneX, beginSceneY] = [loc.x, loc.y];

    const key = generateId();
    sceneStore.addSceneObject(key, new SphericalLens({
        Cx: beginSceneX, 
        Cy: beginSceneY, 
        centerThickness: 5,
        edgeThickness: 0,
        material: "glass"
    }));

    const handleDrag = e=>{
        // var svg  = e.target.closest("SVG");
        let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
        const [sceneX, sceneY] = [loc.x, loc.y]
        const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];

        sceneStore.updateSceneObject(key, {
            diameter: Math.abs(dy*2),
            edgeThickness:   dx>0 ?    1 : dx*2,
            centerThickness: dx>0 ? dx*2 : 0
        });
    }

    window.addEventListener("mousemove", handleDrag);
    window.addEventListener("mouseup", e=>{
        window.removeEventListener("mousemove", handleDrag);
        mouseToolsStore.setCurrentTool(null)
    }, {once: true});
}

const pointlightTool = e => {
    e.preventDefault();
    var svg  = e.target.closest("SVG");
    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
    const [beginSceneX, beginSceneY] = [loc.x, loc.y];

    const key = generateId();
    sceneStore.addSceneObject(key, new PointLight({
        Cx: beginSceneX, 
        Cy: beginSceneY, 
        angle: 0
    }));

    const handleDrag = e=>{
        // var svg  = e.target.closest("SVG");
        let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
        const [sceneX, sceneY] = [loc.x, loc.y]
        const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];

        sceneStore.updateSceneObject(key, {
            angle: Math.atan2(dy, dx)
        });
    }

    window.addEventListener("mousemove", handleDrag);
    window.addEventListener("mouseup", e=>{
        window.removeEventListener("mousemove", handleDrag);
        mouseToolsStore.setCurrentTool(null);
    }, {once: true});
}

const directionalLightTool = e => {
    e.preventDefault();
    var svg  = e.target.closest("SVG");
    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
    const [beginSceneX, beginSceneY] = [loc.x, loc.y];
    
    const key = generateId();
    sceneStore.addSceneObject(key, new DirectionalLight({
        Cx: beginSceneX, 
        Cy: beginSceneY, 
        angle: 0
    }));

    const handleDrag = e=>{
        // var svg  = e.target.closest("SVG");
        let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
        const [sceneX, sceneY] = [loc.x, loc.y]
        const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];

        sceneStore.updateSceneObject(key, {
            angle: Math.atan2(dy, dx),
            width: Math.hypot(dx, dy)/2
        });
    }

    window.addEventListener("mousemove", handleDrag);
    window.addEventListener("mouseup", e=>{
        window.removeEventListener("mousemove", handleDrag);
        mouseToolsStore.setCurrentTool(null);
    }, {once: true});
}

const laserTool = e => {
    e.preventDefault();
    var svg  = e.target.closest("SVG");
    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
    const [beginSceneX, beginSceneY] = [loc.x, loc.y];

    const key = generateId();
    sceneStore.addSceneObject(key, new LaserLight({
        Cx: beginSceneX, 
        Cy: beginSceneY, 
        angle: 0
    }));

    const handleDrag = e=>{
        // var svg  = e.target.closest("SVG");
        let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
        const [sceneX, sceneY] = [loc.x, loc.y]
        const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];
        
        sceneStore.updateSceneObject(key, {
            angle: Math.atan2(dy, dx)
        });
    }

    window.addEventListener("mousemove", handleDrag);
    window.addEventListener("mouseup", e=>{
        window.removeEventListener("mousemove", handleDrag);
        mouseToolsStore.setCurrentTool(null);
    }, {once: true});
}



export {selectAndMoveTool, circleTool, rectangleTool, lineTool, lensTool, pointlightTool, directionalLightTool, laserTool};