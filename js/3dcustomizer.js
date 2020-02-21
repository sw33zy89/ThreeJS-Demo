const LOADER = document.getElementById('js-loader');
const DRAG_NOTICE = document.getElementById('js-drag-notice');

const TRAY = document.getElementById('js-tray-slide');

var theModel;

const MODEL_PATH = "assets/audi-r8.glb";

var loaded = false;
var cameraFar = 5;
var activeOption = 'primary_panel';

const colors = [
	{
        texture: 'assets/textures/jetstreamblue_flake.png',
        size: [100,100,100],
		shininess: 60
    },
	{
        texture: 'assets/textures/friction_orange_flake.png',
        size: [100,100,100],
        shininess: 60
    },
    {
        color: '000000',
		shininess: 100,
		metal: true
    },
    {
        color: 'e1a80d',
		shininess: 90
    },
    {
        color: '93050b',
		metal: true
    },
    {
        color: '0255b2',
		shininess: 90
    },
    {
        color: '454848',
		shininess: 90
    },
    {
        color: 'ffffff',
		shininess: 90
    }

]

const BACKGROUND_COLOR = 0xdddddd;

// Init the scene
const scene = new THREE.Scene();
// Set background
scene.background = new THREE.Color(BACKGROUND_COLOR );
scene.fog = new THREE.Fog(BACKGROUND_COLOR, 20, 100);

const canvas = document.querySelector('#c');

// Init the renderer
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});

renderer.shadowMap.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio); 

document.body.appendChild(renderer.domElement);

// Add a camera
var camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = cameraFar;
camera.position.x = 0;

// Initial material
const INITIAL_MTL = new THREE.MeshPhongMaterial( { color: 0xf1f1f1, shininess: 10} );

const GLASS_MTL = new THREE.MeshPhysicalMaterial({
        color: 0x444444, 
       // envMap: refractionCube, 
        refractionRatio: 0.8,
        opacity: 0.6,
		reflectivity: 0.6, 
        transparent: true
    });

const INITIAL_MAP = [
	{childID: "primary_panel", mtl: INITIAL_MTL},
	{childID: "accent_panel", mtl: INITIAL_MTL},
	{childID: "brakes", mtl: INITIAL_MTL},
	{childID: "glass", mtl: GLASS_MTL}
];

// Init the object loader
var loader = new THREE.GLTFLoader();


loader.load(MODEL_PATH, function(object) {
  theModel = object.scene;

  theModel.traverse((o) => {
     if (o.isMesh) {
       o.castShadow = true;
	   
     }
   });

// Set the models initial scale   
  theModel.scale.set(1,1,1);
  theModel.rotation.y = Math.PI;
 

  // Add the model to the scene
  theModel.position.y = -1;
  
  // Set initial textures
  for (let object of INITIAL_MAP) {
    initColor(theModel, object.childID, object.mtl);
  }
  
  scene.add(theModel);

  // Remove the loader
  LOADER.remove();

}, undefined, function(error) {
  console.error(error)
});

// Function - Add the textures to the models
function initColor(parent, type, mtl) {
  parent.traverse((o) => {
   if (o.isMesh) {
     if (o.name.includes(type)) {
          o.material = mtl;
          o.nameID = type; // Set a new property to identify this object
       }
   }
 });
}


// Add lights
var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.61 );
    hemiLight.position.set( 0, 50, 0 );
// Add hemisphere light to scene   
scene.add( hemiLight );

var dirLight = new THREE.DirectionalLight( 0xffffff, 0.54 );
    dirLight.position.set( -8, 12, 8 );
    dirLight.castShadow = true;
    dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
// Add directional Light to scene    
scene.add( dirLight );
	
// Floor
var floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
var floorMaterial = new THREE.MeshPhongMaterial({
  color: 0xdddddd, // This color is manually dialed in to match the background color
  shininess: 0
});

var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -0.5 * Math.PI;
floor.receiveShadow = true;
floor.position.y = -1;
scene.add(floor);

// Add controls
var controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.maxPolarAngle = Math.PI / 2;
controls.minPolarAngle = Math.PI / 3;
controls.enableDamping = true;
controls.enablePan = false;
controls.dampingFactor = 0.1;
controls.autoRotate = false; // Toggle this if you'd like the chair to automatically rotate
controls.autoRotateSpeed = 0.2; // 30


function animate() {

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
  
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  
  if (theModel != null && loaded == false) {
    initialRotation();
    DRAG_NOTICE.classList.add('start');
  }
}

animate();

// Function - New resizing method
function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  var width = window.innerWidth;
  var height = window.innerHeight;
  var canvasPixelWidth = canvas.width / window.devicePixelRatio;
  var canvasPixelHeight = canvas.height / window.devicePixelRatio;

  const needResize = canvasPixelWidth !== width || canvasPixelHeight !== height;
  if (needResize) {
    
    renderer.setSize(width, height, false);
  }
  return needResize;
}

// Disable scrolling .. (??)
window.onscroll = function () { window.scrollTo(0, 0); };

// Function - Build Colors

function buildColors(colors) {
  for (let [i, color] of colors.entries()) {
    let swatch = document.createElement('div');
    swatch.classList.add('tray__swatch');
    
    if (color.texture)
    {
      swatch.style.backgroundImage = "url(" + color.texture + ")";   
    } else
    {
      swatch.style.background = "#" + color.color;
    }

    swatch.setAttribute('data-key', i);
    TRAY.append(swatch);
  }
}

buildColors(colors);

// Select Option
const options = document.querySelectorAll(".option");

for (const option of options) {
  option.addEventListener('click',selectOption);
}

function selectOption(e) {
  let option = e.target;
  activeOption = e.target.dataset.option;
  for (const otherOption of options) {
    otherOption.classList.remove('--is-active');
  }
  option.classList.add('--is-active');
}

// Swatches
const swatches = document.querySelectorAll(".tray__swatch");

for (const swatch of swatches) {
  swatch.addEventListener('click', selectSwatch);
}

function selectSwatch(e) {
     let color = colors[parseInt(e.target.dataset.key)];
     let new_mtl;

    if (color.texture) {
      
	  let maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
      let txt = new THREE.TextureLoader().load(color.texture);
      
      txt.repeat.set( color.size[0], color.size[1], color.size[2]);
      txt.wrapS = THREE.RepeatWrapping;
      txt.wrapT = THREE.RepeatWrapping;
	  txt.anisotropy = maxAnisotropy;
      
	  if (color.metal && color.metal === true){
		  new_mtl = new THREE.MeshStandardMaterial( {
			map: txt,
			metal: color.metal ? true : false
		  });
	  }
	  else{
		new_mtl = new THREE.MeshPhongMaterial( {
			map: txt,
			shininess: color.shininess ? color.shininess : 10,
		  });
	  }
          
    } 
    else
    {
		if (color.metal && color.metal === true){
			new_mtl = new THREE.MeshStandardMaterial({
			  color: parseInt('0x' + color.color),
			  metal: color.metal ? true : false
			});
		}
		else{
			new_mtl = new THREE.MeshPhongMaterial({
			  color: parseInt('0x' + color.color),
			  shininess: color.shininess ? color.shininess : 10
			  
			});
		}
      
    }
    
    setMaterial(theModel, activeOption, new_mtl);
}

function setMaterial(parent, type, mtl) {
  parent.traverse((o) => {
   if (o.isMesh && o.nameID != null) {
     if (o.nameID == type) {
          o.material = mtl;
       }
   }
 });
}

function hideOption(option){
    theModel.traverse((o) => {
        if (o.isMesh && o.nameID != null) {
          if (o.nameID == option) {
               o.visible = false;
            }
        }
    });
    animate();
}

function showOption(option){
    theModel.traverse((o) => {
        if (o.isMesh && o.nameID != null) {
          if (o.nameID == option) {
               o.visible = true;
            }
        }
    });
    animate();
}

// Function - Opening rotate
let initRotate = 0;

function initialRotation() {
  initRotate++;
if (initRotate <= 120) {
    theModel.rotation.y += Math.PI / 60;
  } else {
    loaded = true;
  }
}

var slider = document.getElementById('js-tray'), sliderItems = document.getElementById('js-tray-slide'), difference;

function slide(wrapper, items) {
  var posX1 = 0,
      posX2 = 0,
      posInitial,
      threshold = 20,
      posFinal,
      slides = items.getElementsByClassName('tray__swatch');
  
  // Mouse events
  items.onmousedown = dragStart;
  
  // Touch events
  items.addEventListener('touchstart', dragStart);
  items.addEventListener('touchend', dragEnd);
  items.addEventListener('touchmove', dragAction);


  function dragStart (e) {
    e = e || window.event;
     posInitial = items.offsetLeft;
     difference = sliderItems.offsetWidth - slider.offsetWidth;
     difference = difference * -1;
    
    if (e.type == 'touchstart') {
      posX1 = e.touches[0].clientX;
    } else {
      posX1 = e.clientX;
      document.onmouseup = dragEnd;
      document.onmousemove = dragAction;
    }
  }

  function dragAction (e) {
    e = e || window.event;
    
    if (e.type == 'touchmove') {
      posX2 = posX1 - e.touches[0].clientX;
      posX1 = e.touches[0].clientX;
    } else {
      posX2 = posX1 - e.clientX;
      posX1 = e.clientX;
    }
    
    if (items.offsetLeft - posX2 <= 0 && items.offsetLeft - posX2 >= difference) {
        items.style.left = (items.offsetLeft - posX2) + "px";
    }
  }
  
  function dragEnd (e) {
    posFinal = items.offsetLeft;
    if (posFinal - posInitial < -threshold) {
      
    } else if (posFinal - posInitial > threshold) {

    } else {
      items.style.left = (posInitial) + "px";
    }

    document.onmouseup = null;
    document.onmousemove = null;
  }

}

slide(slider, sliderItems);