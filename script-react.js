console.log("=======================COMPILED======================")

import * as THREE from 'three';
import 'react'
import 'react-dom'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'https://unpkg.com/three@0.125.2/examples/jsm/loaders/FBXLoader.js';
import Stats from 'https://unpkg.com/three@0.125.2/examples/jsm/libs/stats.module.js';

const stats = new Stats();
stats.domElement.style.cssText = "position:fixed; top:0px; right:0px;";
document.body.appendChild(stats.dom);
function update_stats(){
    stats.update();
    requestAnimationFrame(update_stats);
}
update_stats();


function empty(w,h){
    return new ImageData(w, h, { colorSpace: "srgb" });
}

function fill(img, r,g,b,a=255){
    let image = new ImageData(img.data, img.width, img.height);
    for (let i = 0; i < image.data.length; i += 4)
    {
        image.data[i + 0] = r;
        image.data[i + 1] = g;
        image.data[i + 2] = b;
        image.data[i + 3] = a;
    }
    return image;
}

function circle(img, r=1.0){
    let image = new ImageData(img.data, img.width, img.height);
    for (let i = 0; i < image.data.length; i += 4)
    {
        let y = Math.floor((i/4) / image.width);
        let x = (i/4) % image.width;
        const u = x/image.width;
        const v = y/image.height;
        
        const cx = 0.5;
        const cy = 0.5;

        const IsInside = (u-cx)*(u-cx)+(v-cy)*(v-cy) < r*r;
        const brightness = IsInside ? 255 : 0;

        image.data[i + 0] = brightness;
        image.data[i + 1] = 50
        image.data[i + 2] = 50
        image.data[i + 3] = 255; // blue
    }
    return image;
}

function waves(w, h, length=1, speed=10)
{
    const image = new ImageData(w, h, { colorSpace: "srgb" });
    let t = Date.now()*0.001 * speed;
    for (let i = 0; i < image.data.length; i += 4)
    {
        let y = Math.floor((i/4) / image.width);
        let x = (i/4) % image.width;
        const u = x/image.width;
        const v = y/image.height;
        
        image.data[i + 0] = ((Math.sin(t+u*length)/2)+0.5)*255;  // red
        image.data[i + 1] = 1; // green
        image.data[i + 2] = 1;   // blue
        image.data[i + 3] = 255; // blue
    }
    return image;
}

function TwoCanvas(props){
    const canvasRef = React.useRef(null)

    React.useEffect(() => {
        requestAnimationFrame(animate);
    });

    function animate(){
        requestAnimationFrame(animate);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { colorSpace: "display-p3" });

        const t = Date.now()*0.001;
        const image = circle(fill(empty(512,512, 50, 50, 50)), Math.sin(t)*0.3);
        ctx.putImageData(image, 0, 0);
    }

    return React.createElement("canvas", {...props, width:512, height:512, ref:canvasRef});
}

function ThreeCanvas(props){
    const canvasRef = React.useRef(null)

    var camera;
    var renderer;
    var scene
    React.useEffect(() => {
        const canvas = canvasRef.current;
        renderer = new THREE.WebGLRenderer({antialias: false, canvas: canvas, alpha: true});
        renderer.setSize( 512, 512, false );    
        /* init renderer */
        /* init scene */
        scene = new THREE.Scene();
        camera;
        camera = new THREE.PerspectiveCamera( 75, 512/512, 0.01, 10 );
        
        const vertices = new Float32Array(Array.from({ length: 100000*3 }, () => (Math.random()-0.5)*1.0));
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        
        const material = new THREE.PointsMaterial({
            color: "white",
            size: 1,
            sizeAttenuation: false
        });
        const pointCloud = new THREE.Points(geometry, material);
        scene.add(pointCloud);

        requestAnimationFrame(animate);
    });

    function animate(){
        camera.position.x = Math.sin(Date.now() / 1000)*1;
        camera.position.y = .3;
        camera.position.z = Math.cos(Date.now() / 1000)*1;
        camera.lookAt(new THREE.Vector3(0,0,0));
        renderer.render( scene, camera);

        requestAnimationFrame(animate);
    }

    return React.createElement("canvas", {...props, width:512, height:512, ref:canvasRef});
}

const E = React.createElement;
class App extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            camera_type: "Perspective Camera"
        }
    }

    render(){
        return E("div", {}, [
            E(TwoCanvas, {key:"myTwoCanvas"}),
            E(ThreeCanvas, {key:"myThreeCanvas"}),
        ])
    }
}

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(React.createElement(App, {}));