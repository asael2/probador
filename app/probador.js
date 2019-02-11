"use strict";

// SETTINGS of this demo :
const SETTINGS = {
    cameraFOV: 40
};

// some globalz :f0.5
let THREECAMERA;
const GLASSESOBJ3D = new THREE.Object3D();

const ACTIONS = [];
const MIXERS = [];

let ISANIMATED;

let BEEMESH;
let BEEOBJ3D;
let gafa = './models/glasses/frame.json'

// callback : launched if a face is detected or lost. TODO : add a cool particle effect WoW !
function detect_callback(isDetected) {
    if (isDetected) {
        warn.log("DETECTADO!!")
        console.log('INFO in detect_callback() : DETECTED');
    } else {
        console.log('INFO in detect_callback() : LOSTed');
    }
}

// build the 3D. called once when Jeeliz Face Filter is OK
function init_threeScene(spec) {
    const threeStuffs = THREE.JeelizHelper.init(spec, detect_callback);

    let frameMesh;
    let lensesMesh;
    let branchesMesh;
    let decoMesh;

    const loadingManager = new THREE.LoadingManager();

    // CREATE OUR FRAME
    var loaderFrame = new THREE.BufferGeometryLoader(loadingManager);

    loaderFrame.load(
        gafa,
        (geometry) => {
            const mat = new THREE.MeshPhongMaterial({
                color: 0x000000,
                shininess: 2,
                specular: 0xffffff,
                transparent: true
            });

            frameMesh = new THREE.Mesh(geometry, mat);
            frameMesh.scale.multiplyScalar(0.0065);
            frameMesh.position.set(0, 0, 0);
            frameMesh.frustumCulled = false;
            frameMesh.renderOrder = 10000;
        }
    );

    // CREATE OUR LENSES
    const loaderLenses = new THREE.BufferGeometryLoader(loadingManager);

    loaderLenses.load(
        './models/glasses/lenses.json',
        (geometry) => {
            const mat = new THREE.MeshLambertMaterial({
                map: new THREE.TextureLoader().load('./models/glasses/textureBlack.jpg'),
                transparent: true,
                opacity: 0.78,  
                color:     0x996633, 
                //specular:  0x050505,
                //shininess: 100,
            });

            // var material = new THREE.MeshLambertMaterial({
            //     map: loader.load('https://s3.amazonaws.com/duhaime/blog/tsne-webgl/assets/cat.jpg')
            //   });

            lensesMesh = new THREE.Mesh(geometry, mat);
            lensesMesh.scale.multiplyScalar(0.0065);
            lensesMesh.frustumCulled = false;
            lensesMesh.renderOrder = 10000;
          
        }
    );
    // CREATE OUR BRANCHES
    const loaderBranches = new THREE.BufferGeometryLoader(loadingManager);

    loaderBranches.load(
        './models/glasses/branches.json',
        (geometry) => {
            const mat = new THREE.MeshBasicMaterial({
                alphaMap: new THREE.TextureLoader().load('./models/glasses/alpha_branches.jpg'),
                map: new THREE.TextureLoader().load('./models/glasses/textureBlack.jpg'),
                transparent: true
            });

            branchesMesh = new THREE.Mesh(geometry, mat);
            branchesMesh.scale.multiplyScalar(0.0065);
            branchesMesh.frustumCulled = false;
            branchesMesh.renderOrder = 10000;
        }
    );



    loadingManager.onLoad = () => {
        GLASSESOBJ3D.add(branchesMesh, frameMesh, lensesMesh);
        GLASSESOBJ3D.scale.multiplyScalar(1.1);
        GLASSESOBJ3D.position.setY(0.05); //move glasses a bit up
        GLASSESOBJ3D.position.setZ(0.20);//move glasses a bit forward
        window.zou=GLASSESOBJ3D;

        addDragEventListener(GLASSESOBJ3D);

        threeStuffs.faceObject.add(GLASSESOBJ3D);
    };


    // CREATE THE VIDEO BACKGROUND
    function create_mat2d(threeTexture, isTransparent){ //MT216 : we put the creation of the video material in a func because we will also use it for the frame
        return new THREE.RawShaderMaterial({
            depthWrite: false,
            depthTest: false,
            transparent: isTransparent,
            vertexShader: "attribute vec2 position;\n\
                varying vec2 vUV;\n\
                void main(void){\n\
                    gl_Position=vec4(position, 0., 1.);\n\
                    vUV=0.5+0.5*position;\n\
                }",
            fragmentShader: "precision lowp float;\n\
                uniform sampler2D samplerVideo;\n\
                varying vec2 vUV;\n\
                void main(void){\n\
                    gl_FragColor=texture2D(samplerVideo, vUV);\n\
                }",
             uniforms:{
                samplerVideo: { value: threeTexture }
             }
        });
    }

    // CREATE THE CAMERA
    const aspecRatio = spec.canvasElement.width / spec.canvasElement.height;
    THREECAMERA = new THREE.PerspectiveCamera(SETTINGS.cameraFOV, aspecRatio, 0.1, 100);

    // CREATE A LIGHT
    const ambient = new THREE.AmbientLight(0xffffff, 1);
    threeStuffs.scene.add(ambient)

    var dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(100, 1000, 300);

    threeStuffs.scene.add(dirLight)
} // end init_threeScene()


//launched by body.onload() :
function main() {
    JeelizResizer.size_canvas({
        canvasId: 'jeeFaceFilterCanvas',
        callback: function(isError, bestVideoSettings){
            init_faceFilter(bestVideoSettings);
        }
    })
} //end main()

function init_faceFilter(videoSettings){
    JEEFACEFILTERAPI.init({
        canvasId: 'jeeFaceFilterCanvas',
        NNCpath: '../dist/', // root of NNC.json file
        videoSettings: videoSettings,
        callbackReady: function (errCode, spec) {
            if (errCode) {
                console.log('AN ERROR HAPPENS. SORRY BRO :( . ERR =', errCode);
                return;
            }

            console.log('INFO : FILTERAPI IS READY');
            init_threeScene(spec);
        }, // end callbackReady()

        // called at each render iteration (drawing loop)
        callbackTrack: function (detectState) {
            THREE.JeelizHelper.render(detectState, THREECAMERA);

            TWEEN.update();

            if (MIXERS.length > 1) {
                MIXERS.forEach((m) => {
                    m.update(0.16);
                })
            }
        } // end callbackTrack()
    }); 
} // end main()

