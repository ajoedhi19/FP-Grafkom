import * as THREE from "https://cdn.skypack.dev/three@0.134.0";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.134.0/examples/jsm/loaders/GLTFLoader.js";
import { RoughnessMipmapper } from "https://cdn.skypack.dev/three@0.134.0/examples/jsm/utils/RoughnessMipmapper.js";

const canvas = document.querySelector("canvas.webgl");
const counterDOM = document.getElementById("counter");
const endDOM = document.getElementById("end");
const score = document.getElementById("score")
const scene = new THREE.Scene();

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const distance = 500;
const camera = new THREE.OrthographicCamera(sizes.width / -2, sizes.width / 2, sizes.height / 2, sizes.height / -2, 0.1, 10000);

camera.rotation.x = (50 * Math.PI) / 180;
camera.rotation.y = (20 * Math.PI) / 180;
camera.rotation.z = (10 * Math.PI) / 180;

const initialCameraPositionY = -Math.tan(camera.rotation.x) * distance;
const initialCameraPositionX = Math.tan(camera.rotation.y) * Math.sqrt(distance ** 2 + initialCameraPositionY ** 2);
camera.position.y = initialCameraPositionY;
camera.position.x = initialCameraPositionX;
camera.position.z = distance;
camera.zoom = 2;
camera.updateProjectionMatrix();

const zoom = 2;

// const chickenSize = 15;

const positionWidth = 42;
const columns = 17;
const boardWidth = positionWidth * columns;

let lanes;
let currentLane;
let currentColumn;
let previousTimestamp;

let startMoving = false;
let moves = [];
let stepStartTimestamp;
// const stepTime = 200;

const generateLanes = () =>
  [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((index) => {
      const lane = new Lane(index);
      lane.mesh.position.y = index * positionWidth * zoom;
      scene.add(lane.mesh);
      return lane;
    })
    .filter((lane) => lane.index >= 0);

const addLane = () => {
  const index = lanes.length;
  const lane = new Lane(index);
  lane.mesh.position.y = index * positionWidth * zoom;
  scene.add(lane.mesh);
  lanes.push(lane);
};

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);

const roughnessMipmapper = new RoughnessMipmapper(renderer);

// const chicken = new Chicken();
// scene.add( chicken );

const objects = ["./Asset/chicken/Chicken.gltf", "./Asset/cow/scene.gltf", "./Asset/goat/scene.gltf", "./Asset/pig/scene.gltf", "./Asset/fence/scene.gltf", "./Asset/tree/scene.gltf"];
let loaded_models = [];
let num_of_objects = objects.length;
let obj_loaded = 0;

let chicken, cow, goat, pig, fence, tree;
const loader = new GLTFLoader();
for (let i = 0; i < objects.length; i++) {
  loader.load(
    objects[i],
    function (gltf) {
      // const obj = gltf.scene;
      const obj = gltf.scene;
      // console.log(obj);
      obj.traverse(function (child) {
        if (child.isMesh) {
          roughnessMipmapper.generateMipmaps(child.material);
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      switch (i) {
        case 0:
          chicken = obj;
          loaded_models[0] = chicken;
          break;
        case 1:
          cow = obj;
          loaded_models[1] = cow;
          break;
        case 2:
          goat = obj;
          loaded_models[2] = obj;
          break;
        case 3:
          pig = obj;
          loaded_models[3] = obj;
          break;
        case 4:
          fence = obj;
          loaded_models[4] = obj;
          break;
        case 5:
          tree = obj;
          loaded_models[5] = obj;
          break;
      }
      checkComplete();
    },

    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },

    // called when loading has errors
    function (error) {
      console.log("An error happened");
    }
  );
}

function checkComplete() {
  obj_loaded++;
  if (obj_loaded === num_of_objects) {
    // chicken = cow;
    initValues();
    requestAnimationFrame(animate);
  }
}

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
scene.add(hemiLight);

const initialDirLightPositionX = -100;
const initialDirLightPositionY = -100;
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(initialDirLightPositionX, initialDirLightPositionY, 200);
dirLight.castShadow = true;
// dirLight.target = chicken;
scene.add(dirLight);

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
var d = 500;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;

// var helper = new THREE.CameraHelper( dirLight.shadow.camera );
// var helper = new THREE.CameraHelper( camera );
// scene.add(helper)

const backLight = new THREE.DirectionalLight(0x000000, 0.4);
backLight.position.set(200, 200, 50);
backLight.castShadow = true;
scene.add(backLight);

const laneTypes = ["cow", "goat", "tree", "fence"];
const laneSpeeds = [2, 2.5, 3];

let firstTime = true;

const initValues = () => {
  lanes = generateLanes();
  // chicken = fence;

  previousTimestamp = null;
  chicken.rotation.x = (60 * Math.PI) / 180;
  chicken.rotation.y = (-85 * Math.PI) / 180;
  chicken.rotation.z = (-40 * Math.PI) / 180;
  // chicken.rotation.x = 95*Math.PI/180;
  // chicken.rotation.y = 3*Math.PI/180;
  // chicken.rotation.z = -5*Math.PI/180;
  if(firstTime){
      chicken.scale.multiplyScalar(60);
      firstTime = false;
  }
  // chicken.scale.multiplyScalar(1/10);
  chicken.position.x = 0;
  chicken.position.y = 0;
  // chicken.position.x -= 10;
  // chicken.position.z += 22.5;
//   console.log("player", chicken);
  scene.add(chicken);

  currentLane = 0;
  counterDOM.innerHTML = currentLane;
  currentColumn = Math.floor(columns / 2);

  camera.position.y = initialCameraPositionY;
  camera.position.x = initialCameraPositionX;

  dirLight.target = chicken;
  dirLight.position.x = initialDirLightPositionX;
  dirLight.position.y = initialDirLightPositionY;
};

function Road() {
  const road = new THREE.Group();

  const createSection = (color) => new THREE.Mesh(new THREE.PlaneBufferGeometry(boardWidth * zoom, positionWidth * zoom), new THREE.MeshPhongMaterial({ color }));

  const middle = createSection(0x454a59);
  middle.receiveShadow = true;
  road.add(middle);

  const left = createSection(0x393d49);
  left.position.x = -boardWidth * zoom;
  road.add(left);

  const right = createSection(0x393d49);
  right.position.x = boardWidth * zoom;
  road.add(right);

  return road;
}

function Grass() {
  const grass = new THREE.Group();

  const createSection = (color) => new THREE.Mesh(new THREE.BoxBufferGeometry(boardWidth * zoom, positionWidth * zoom, 3 * zoom), new THREE.MeshPhongMaterial({ color }));

  const middle = createSection(0xbaf455);
  middle.receiveShadow = true;
  grass.add(middle);

  const left = createSection(0x99c846);
  left.position.x = -boardWidth * zoom;
  grass.add(left);

  const right = createSection(0x99c846);
  right.position.x = boardWidth * zoom;
  grass.add(right);

  grass.position.z = 1.5 * zoom;
  return grass;
}

function Lane(index) {
  this.index = index;
  this.type = index <= 0 ? "grass" : laneTypes[Math.floor(Math.random() * laneTypes.length)];

  switch (this.type) {
    case "grass": {
      this.type = "grass";
      this.mesh = new Grass();
      break;
    }
    case "road": {
      this.mesh = new Road();
      break;
    }
    case "cow": {
      this.mesh = new Road();
      this.direction = Math.random() >= 0.5;

      const occupiedPositions = new Set();
      this.animals = [1, 2, 3].map(() => {
        const animal = cow.clone();
        // console.log("cow", cow);
        animal.rotation.x = (60 * Math.PI) / 180;
        animal.rotation.y = (-85 * Math.PI) / 180;
        animal.rotation.z = (-40 * Math.PI) / 180;
        animal.scale.multiplyScalar(60);
        let position;
        do {
          position = Math.floor((Math.random() * columns) / 2);
        } while (occupiedPositions.has(position));
        occupiedPositions.add(position);
        animal.position.x = (position * positionWidth * 2 + positionWidth / 2) * zoom - (boardWidth * zoom) / 2;
        if (this.direction) {
          animal.rotation.x = (50 * Math.PI) / 180;
          animal.rotation.y = (95 * Math.PI) / 180;
          animal.rotation.z = (50 * Math.PI) / 180;
        }

        animal.position.z = 40;
        scene.add(animal);
        this.mesh.add(animal);
        return animal;
      });

      this.speed = laneSpeeds[Math.floor(Math.random() * laneSpeeds.length)];
      break;
    }
    case "goat": {
      this.mesh = new Road();
      this.direction = Math.random() >= 0.5;

      const occupiedPositions = new Set();
      this.animals = [1, 2, 3].map(() => {
        const animal = goat.clone();
        animal.rotation.x = (50 * Math.PI) / 180;
        animal.rotation.y = (95 * Math.PI) / 180;
        animal.rotation.z = (50 * Math.PI) / 180;
        animal.scale.multiplyScalar(1 / 1.5);
        let position;
        do {
          position = Math.floor((Math.random() * columns) / 2);
        } while (occupiedPositions.has(position));
        occupiedPositions.add(position);
        animal.position.x = (position * positionWidth * 2 + positionWidth / 2) * zoom - (boardWidth * zoom) / 2;
        if (this.direction) {
          animal.rotation.x = (60 * Math.PI) / 180;
          animal.rotation.y = (-85 * Math.PI) / 180;
          animal.rotation.z = (-40 * Math.PI) / 180;
          //   animal.rotation.x = 50*Math.PI/180;
          //   animal.rotation.y = 95*Math.PI/180;
          //   animal.rotation.z = 50*Math.PI/180;
        }

        animal.position.z = 0;
        scene.add(animal);
        this.mesh.add(animal);
        return animal;
      });

      this.speed = laneSpeeds[Math.floor(Math.random() * laneSpeeds.length)];
      break;
    }
    case "tree": {
      this.mesh = new Grass();

      this.occupiedPositions = new Set();
      this.trees = [1, 2, 3, 4].map(() => {
        const trees = tree.clone();
        trees.rotation.x = (60 * Math.PI) / 180;
        trees.rotation.y = (-85 * Math.PI) / 180;
        trees.rotation.z = (-40 * Math.PI) / 180;
        trees.scale.multiplyScalar(1 / 2);
        let position;
        do {
          position = Math.floor(Math.random() * columns);
        } while (this.occupiedPositions.has(position));
        this.occupiedPositions.add(position);
        trees.position.x = (position * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2 + 90;
        scene.add(trees);
        this.mesh.add(trees);
        return trees;
      });
      break;
    }
    case "fence": {
      this.mesh = new Grass();

      this.occupiedPositions = new Set();
      this.fences = [1, 2, 3, 4].map(() => {
        const fences = fence.clone();
        fences.rotation.x = (95 * Math.PI) / 180;
        fences.rotation.y = (5 * Math.PI) / 180;
        fences.rotation.z = (-3 * Math.PI) / 180;
        fences.scale.multiplyScalar(1 / 10);
        let position;
        do {
          position = Math.floor(Math.random() * columns);
        } while (this.occupiedPositions.has(position));
        this.occupiedPositions.add(position);
        fences.position.x = (position * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2 + 160;
        fences.position.y = 0;
        // fence.position.x -= 10;
        fences.position.z += 10;
        scene.add(fences);
        this.mesh.add(fences);
        return fences;
      });
      break;
    }
  }
}

document.querySelector("#retry").addEventListener("click", () => {
  lanes.forEach((lane) => scene.remove(lane.mesh));
  initValues();
  endDOM.style.visibility = "hidden";
  score.style.visibility = "hidden";
});

// requestAnimationFrame( animate );

function onKeyDown(e) {
  if (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40) {
    
    const moveDeltaDistance = positionWidth * zoom;
    
    switch (e.keyCode) {
      // left
      case 37: {
        if (currentColumn === 0) return;
        chicken.rotation.x = (100 * Math.PI) / 180;
        chicken.rotation.y = (10 * Math.PI) / 180;
        chicken.rotation.z = (0 * Math.PI) / 180;

        const finalPositions = {lane: currentLane, column: currentColumn - 1};
        if((lanes[finalPositions.lane].type === 'tree' || lanes[finalPositions.lane].type === 'fence') && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column-1)) return;
        const positionX = (currentColumn * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2 - moveDeltaDistance;

        camera.position.x = initialCameraPositionX + positionX;
        dirLight.position.x = initialDirLightPositionX + positionX;
        chicken.position.x = positionX; // initial chicken position is 0
        chicken.rotation.x = (100 * Math.PI) / 180;
        chicken.rotation.y = (10 * Math.PI) / 180;
        chicken.rotation.z = (0 * Math.PI) / 180;
        currentColumn--;

        break;
      }
      // up
      case 38: {
        chicken.rotation.x = (60 * Math.PI) / 180;
        chicken.rotation.y = (-85 * Math.PI) / 180;
        chicken.rotation.z = (-40 * Math.PI) / 180;
        const finalPositions = {lane: currentLane + 1, column: currentColumn};
        if((lanes[finalPositions.lane].type === 'tree' || lanes[finalPositions.lane].type === 'fence') && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column-1)) return;
        const positionY = currentLane * positionWidth * zoom + moveDeltaDistance;
        camera.position.y = initialCameraPositionY + positionY;
        dirLight.position.y = initialDirLightPositionY + positionY;
        chicken.position.y = positionY; // initial chicken position is 0

        currentLane++;
        addLane();
        counterDOM.innerHTML = currentLane;
        break;
      }

      // right
      case 39: {
        chicken.rotation.x = (100 * Math.PI) / 180;
        chicken.rotation.y = (185 * Math.PI) / 180;
        chicken.rotation.z = (0 * Math.PI) / 180;
        if (currentColumn === columns - 1) break;
        const finalPositions = {lane: currentLane, column: currentColumn + 1};
        if((lanes[finalPositions.lane].type === 'tree' || lanes[finalPositions.lane].type === 'fence') && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column-1)) return;
        const positionX = (currentColumn * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2 + moveDeltaDistance;
        camera.position.x = initialCameraPositionX + positionX;
        dirLight.position.x = initialDirLightPositionX + positionX;
        chicken.position.x = positionX;
        
        currentColumn++;
        break;
      }

      // down
      case 40: {
        chicken.rotation.x = (100 * Math.PI) / 180;
        chicken.rotation.y = (80 * Math.PI) / 180;
        chicken.rotation.z = (-10 * Math.PI) / 180;
        if (currentLane === 0) break;
        const finalPositions = {lane: currentLane - 1, column: currentColumn};
        if((lanes[finalPositions.lane].type === 'tree' || lanes[finalPositions.lane].type === 'fence') && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column-1)) return;
        const positionY = currentLane * positionWidth * zoom - moveDeltaDistance;
        camera.position.y = initialCameraPositionY + positionY;
        dirLight.position.y = initialDirLightPositionY + positionY;
        chicken.position.y = positionY;
        // chicken.position.z = jumpDeltaDistance;
        currentLane--;
        counterDOM.innerHTML = currentLane;
        break;
      }
    }
    score.innerHTML ="your score : " + currentLane;
  }
}

window.addEventListener("keydown", onKeyDown, false);

// Collision
function isCollide(box1, box2){
    if(box1 && box2){
        var bbox1 = new THREE.Box3().setFromObject(box1);
        var bbox2 = new THREE.Box3().setFromObject(box2);
        return bbox1.intersectsBox(bbox2);
    }

    return false;
}


function animate(timestamp) {
  requestAnimationFrame(animate);

  if (!previousTimestamp) previousTimestamp = timestamp;
  const delta = timestamp - previousTimestamp;
  previousTimestamp = timestamp;

  lanes.forEach((lane) => {
    if (lane.type === "cow" || lane.type === "goat") {
      const aBitBeforeTheBeginingOfLane = (-boardWidth * zoom) / 2 - positionWidth * 2 * zoom;
      const aBitAfterTheEndOFLane = (boardWidth * zoom) / 2 + positionWidth * 2 * zoom;
      lane.animals.forEach((animal) => {
        if (lane.direction) {
          animal.position.x = animal.position.x < aBitBeforeTheBeginingOfLane ? aBitAfterTheEndOFLane : (animal.position.x -= (lane.speed / 16) * delta);
        } else {
          animal.position.x = animal.position.x > aBitAfterTheEndOFLane ? aBitBeforeTheBeginingOfLane : (animal.position.x += (lane.speed / 16) * delta);
        }
      });
    }
  });

  if (startMoving) {
    stepStartTimestamp = timestamp;
    startMoving = false;
  }
  // const moveDeltaTime = timestamp - stepStartTimestamp;
  // const jumpDeltaDistance = Math.sin(Math.min(moveDeltaTime/stepTime,1)*Math.PI)*8*zoom;
  if (lanes[currentLane].type === "cow" || lanes[currentLane].type === "goat") {

    lanes[currentLane].animals.forEach((animal) => {
        animal.updateMatrix();
        animal.updateMatrixWorld(true);

        if (isCollide(chicken, animal)) {
            console.log("true");
            endDOM.style.visibility = "visible";
            score.style.visibility = "visible";
        }
    });
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
