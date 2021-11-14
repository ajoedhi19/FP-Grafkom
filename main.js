import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';

const canvas = document.querySelector('canvas.webgl')

const scene = new THREE.Scene();

/**
 * Sizes
 */
 const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
        // Update sizes
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight

        // Update camera
        camera.aspect = sizes.width / sizes.height
        camera.updateProjectionMatrix()

        // Update renderer
        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

const distance = 500;
const camera = new THREE.OrthographicCamera( sizes.width/-2, sizes.width/2, sizes.height / 2, sizes.height / -2, 0.1, 10000 );

camera.rotation.x = 50*Math.PI/180;
camera.rotation.y = 20*Math.PI/180;
camera.rotation.z = 10*Math.PI/180;

const initialCameraPositionY = -Math.tan(camera.rotation.x)*distance;
const initialCameraPositionX = Math.tan(camera.rotation.y)*Math.sqrt(distance**2 + initialCameraPositionY**2);
camera.position.y = initialCameraPositionY;
camera.position.x = initialCameraPositionX;
camera.position.z = distance;
camera.zoom = 2;
camera.updateProjectionMatrix();

const zoom = 2;

const chickenSize = 15;

const positionWidth = 42;
const columns = 17;
const boardWidth = positionWidth*columns;

let lanes;
let currentLane;
let currentColumn;

const generateLanes = () => [-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9].map((index) => {
    const lane = new Lane(index);
    lane.mesh.position.y = index*positionWidth*zoom;
    scene.add( lane.mesh );
    return lane;
}).filter((lane) => lane.index >= 0);
  
const addLane = () => {
    const index = lanes.length;
    const lane = new Lane(index);
    lane.mesh.position.y = index*positionWidth*zoom;
    scene.add(lane.mesh);
    lanes.push(lane);
}

const chicken = new Chicken();
scene.add( chicken );

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
scene.add(hemiLight)

const initialDirLightPositionX = -100;
const initialDirLightPositionY = -100;
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(initialDirLightPositionX, initialDirLightPositionY, 200);
dirLight.castShadow = true;
dirLight.target = chicken;
scene.add(dirLight);

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
var d = 500;
dirLight.shadow.camera.left = - d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = - d;

// var helper = new THREE.CameraHelper( dirLight.shadow.camera );
// var helper = new THREE.CameraHelper( camera );
// scene.add(helper)

const backLight = new THREE.DirectionalLight(0x000000, .4);
backLight.position.set(200, 200, 50);
backLight.castShadow = true;
scene.add(backLight)

const laneTypes = ['grass', 'road'];

const initValues = () => {
    lanes = generateLanes()

    chicken.position.x = 0;
    chicken.position.y = 0;

    currentLane = 0;
    currentColumn = Math.floor(columns/2);

    camera.position.y = initialCameraPositionY;
    camera.position.x = initialCameraPositionX;

    dirLight.position.x = initialDirLightPositionX;
    dirLight.position.y = initialDirLightPositionY;
}
  
initValues();

const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: canvas
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize( sizes.width, sizes.height );

function Chicken() {
    const chicken = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxBufferGeometry( chickenSize*zoom, chickenSize*zoom, 20*zoom ), 
        new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } )
    );
    body.position.z = 10*zoom;
    body.castShadow = true;
    body.receiveShadow = true;
    chicken.add(body);

    return chicken;  
}

function Road() {
    const road = new THREE.Group();

    const createSection = color => new THREE.Mesh(
        new THREE.PlaneBufferGeometry( boardWidth*zoom, positionWidth*zoom ), 
        new THREE.MeshPhongMaterial( { color } )
    );

    const middle = createSection(0x454A59);
    middle.receiveShadow = true;
    road.add(middle);

    const left = createSection(0x393D49);
    left.position.x = - boardWidth*zoom;
    road.add(left);

    const right = createSection(0x393D49);
    right.position.x = boardWidth*zoom;
    road.add(right);

    return road;
}
  
function Grass() {
    const grass = new THREE.Group();

    const createSection = color => new THREE.Mesh(
        new THREE.BoxBufferGeometry( boardWidth*zoom, positionWidth*zoom, 3*zoom ), 
        new THREE.MeshPhongMaterial( { color } )
    );

    const middle = createSection(0xbaf455);
    middle.receiveShadow = true;
    grass.add(middle);

    const left = createSection(0x99C846);
    left.position.x = - boardWidth*zoom;
    grass.add(left);

    const right = createSection(0x99C846);
    right.position.x = boardWidth*zoom;
    grass.add(right);

    grass.position.z = 1.5*zoom;
    return grass;
}
  
function Lane(index) {
    this.index = index;
    this.type = index <= 0 ? 'grass' : laneTypes[Math.floor(Math.random()*laneTypes.length)];

    switch(this.type) {
        case 'grass': {
            this.type = 'grass';
            this.mesh = new Grass();
            break;
        }
        case 'road' : {
            this.mesh = new Road();
            break;
        }
    }
}

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );	
}
  
requestAnimationFrame( animate );

function onKeyDown(e){
    if(e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40){
        const moveDeltaDistance = positionWidth*zoom;
        switch(e.keyCode){
            // left
            case 37: {
                if(currentColumn === 0) break;
                const positionX = (currentColumn*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 - moveDeltaDistance;
                camera.position.x = initialCameraPositionX + positionX;     
                dirLight.position.x = initialDirLightPositionX + positionX; 
                chicken.position.x = positionX; // initial chicken position is 0
                
                currentColumn--;
                break;
            }
            // up
            case 38: {
                const positionY = currentLane*positionWidth*zoom + moveDeltaDistance;
                camera.position.y = initialCameraPositionY + positionY; 
                dirLight.position.y = initialDirLightPositionY + positionY; 
                chicken.position.y = positionY; // initial chicken position is 0
                
                currentLane++;
                addLane();
                break;
            }
            
            // right
            case 39: {
                if(currentColumn === columns - 1) break;
                const positionX = (currentColumn*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 + moveDeltaDistance;
                camera.position.x = initialCameraPositionX + positionX;       
                dirLight.position.x = initialDirLightPositionX + positionX;
                chicken.position.x = positionX; 
                
                currentColumn++;
                break;
            }
            
            // down
            case 40: {
                if(currentLane === 0) break;
                const positionY = currentLane*positionWidth*zoom - moveDeltaDistance
                camera.position.y = initialCameraPositionY + positionY;
                dirLight.position.y = initialDirLightPositionY + positionY; 
                chicken.position.y = positionY;
                
                currentLane--;
                break;
            }
        }
    }
}

window.addEventListener('keydown', onKeyDown, false);