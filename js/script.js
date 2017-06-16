var globalInterTimer;
var language = "slo";

var InactivityTimer = function() {
    this.active = true;
    this.blinkerActive = true;
    this.timeForTick = 10000;
    this.timeoutCount = 0;
    this.timeoutMaxCount = 3;
    this.timeOut = undefined;
    var hasIntersected = false;
    var self = this;
    var orderOfMeshesIndex = [6, 10, 1, 4, 9, 7, 0, 8, 2, 3, 5];
    var orderOfParentMeshesIndex = [5, 5, 10, 6, 6, 10, 6, 10, 10, 2, -1];
    var orderOfMeshesObjects = [];

    this.initOrderMeshes = function(bane) {
        for (i = 0; i < orderOfMeshesIndex.length; i++) {
            orderOfMeshesObjects[i] = bane.loadedMeshes[orderOfMeshesIndex[i]];
        }

    }

    this.timeoutTick = function(cb) {
        self.timeoutCount++;
        var childMesh;
        var parentMesh;
        var meshes = exportedBane.loadedMeshes;

        var indexChild;

        for (var i = 0; i < meshes.length; i++) {
            //console.log(intersectedMeshes.indexOf(i));
            if (intersectedMeshes.indexOf(orderOfMeshesIndex[i]) == -1) {

                if (orderOfParentMeshesIndex[i] == -1)
                    continue;

                childMesh = meshes[orderOfMeshesIndex[i]];
                parentMesh = meshes[orderOfParentMeshesIndex[i]];
                indexChild = i + 1;

                break;
            }
        }

        if (self.timeoutCount == 2) {
            clearBlinkTimer();
            resetMeshes();
            self.blinkerActive = false;
            $("#helpModal").modal({
                backdrop: false,
                keyboard: true,
                focus: true,
                position: {
                    my: "right top",
                    at: "left top",
                    of: window
                }
            }).draggable({
                handle: ".modal-content"
            });
            $("#helpModal").on('hide.bs.modal', function() {
                prepareNextTick();
            });

            var options = { "controls": false };

            var player = videojs('help_animation', options, function onPlayerReady() {
                videojs.log('Your player is ready!');
                //console.log("index = " + indexChild);
                this.src({ type: 'video/mp4', src: 'animation/HelpAnimation_' + indexChild + '.mp4' });
                this.userActive(false);
                // In this context, `this` is the player that was created by Video.js.
                this.play();

                // How about an event listener?
                this.on('ended', function() {
                    videojs.log('Awww...over so soon?!');
                });
            });

            if (cb)
                cb();

        } else if (self.timeoutCount == 1) {

            blink([childMesh, parentMesh]);

            if (cb)
                cb();
            prepareNextTick();
        } else if (self.timeoutCount > 2) {

            animateIntersection(childMesh, parentMesh);

            self.timeoutCount = 0;
            prepareNextTick();
        }


    }
    this.setIntersected = function(bool) {

        hasIntersected = bool;
        if (typeof self.blinkInterval != 'undefined' || self.blinkTimeout != 'undefined')
            clearBlinkTimer();
        resetMeshes();
        prepareNextTick();
        self.timeoutCount = 0;
    }
    this.resetTimerOnMove = function() {
        clearBlinkTimer();
        resetMeshes();
        self.timeoutCount = 0;
        prepareNextTick();
    }
    prepareNextTick = function() {
        clearInterval(self.timeOut);
        if (self.active == true) {
            self.timeOut = setTimeout(self.timeoutTick, 10000);
        }

    }
    clearBlinkTimer = function() {
        clearInterval(self.blinkInterval);
        clearInterval(self.blinkTimeout);
        self.blinkInterval = undefined;
        self.blinkTimeout = undefined;
    }
    this.destroyTimer = function() {
        self.active = false;
        clearInterval(self.timeOut);
        clearInterval(self.blinkInterval);

        self.timeOut = undefined;
        self.blinkInterval = undefined;
        self.blinkTimeout = undefined;
    }
    blink = function(meshes) {

        self.blinkingMeshes = meshes;
        self.blinkInterval =
            setInterval(function() {
                self.blinkingMeshes[0].outlineWidth = self.blinkingMeshes[1].outlineWidth = 0.2;
                self.blinkingMeshes[0].renderOutline = self.blinkingMeshes[1].renderOutline = true;
                self.blinkingMeshes[0].renderOverlay = self.blinkingMeshes[1].renderOverlay = true;
                self.blinkTimeout = setTimeout(function() {
                    self.blinkingMeshes[0].outlineWidth = self.blinkingMeshes[1].outlineWidth = 0;
                    self.blinkingMeshes[0].renderOutline = self.blinkingMeshes[1].renderOutline = false;
                    self.blinkingMeshes[0].renderOverlay = self.blinkingMeshes[1].renderOverlay = false;
                }, 300);
            }, 500);
    };

    animateIntersection = function(currentMesh, parentMesh) {

        if (typeof currentMesh.parent == 'undefined') {
            intersectedMeshes.push(currentMesh.uniqueId);

            currentMesh.parent = parentMesh;

            currentMesh.position.x -= parentMesh.position.x;
            currentMesh.position.y -= parentMesh.position.y;
            currentMesh.position.z -= parentMesh.position.z;

            if (timer.blinkerActive)
                timer.setIntersected(true);

            var frameRate = 20;

            var xSlide = new BABYLON.Animation("xSlide", "position.x", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            var ySlide = new BABYLON.Animation("ySlide", "position.y", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            var zSlide = new BABYLON.Animation("zSlide", "position.z", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

            var xKeyFrames = [];
            var ykeyFrames = [];
            var zkeyFrames = [];

            xKeyFrames.push({
                frame: 0,
                value: currentMesh.position.x,
            });
            xKeyFrames.push({
                frame: frameRate,
                value: currentMesh.parent._geometry.extend.maximum.x + positionRegParent[currentMesh.uniqueId][0],
            });

            ykeyFrames.push({
                frame: 0,
                value: currentMesh.position.y
            });
            ykeyFrames.push({
                frame: frameRate,
                value: currentMesh.position.y + positionRegParent[currentMesh.uniqueId][1],
            });


            zkeyFrames.push({
                frame: 0,
                value: currentMesh.position.z
            });
            zkeyFrames.push({
                frame: frameRate,
                value: currentMesh.parent._geometry.extend.minimum.z + positionRegParent[currentMesh.uniqueId][2],
            });

            xSlide.setKeys(xKeyFrames);
            ySlide.setKeys(ykeyFrames);
            zSlide.setKeys(zkeyFrames);

            var animation = exportedScene.beginDirectAnimation(currentMesh, [xSlide, ySlide, zSlide], 0, frameRate, false);
            animation.onAnimationEnd = function() {
                currentMesh.parent = parentMesh;
            };
        }
    };

    resetMeshes = function(mesh) {

        if (typeof self.blinkingMeshes != 'undefined') {
            self.blinkingMeshes[0].outlineWidth = self.blinkingMeshes[1].outlineWidth = 0;
            self.blinkingMeshes[0].renderOutline = self.blinkingMeshes[1].renderOutline = false;
            self.blinkingMeshes[0].renderOverlay = self.blinkingMeshes[1].renderOverlay = false;
            self.blinkingMeshes = undefined;
        }
    }



};


var timer = new InactivityTimer();

$(document).ready(function() {



    $(this).on("click mousemove mousedown keypress touchstart", resetTimer);


    $("#firstmodal").click(function() {
        $(".modal-backdrop show").remove();

    });

    $(".btn-en").click(function() {
        var lang = $(this).data("lang");
        console.log(lang);
        localStorage.setItem("lang", lang);
        $("body").removeClass("lang-en lang-slo").addClass("lang-" + lang);
        $("#reset-btn-label").html("Reset");
        $("#title-main").html("Compose the cannon");
        $(".modal-title").html("Help");
        $("#close-btn").html("Close");
        language = "en";
        $(this).parents(".dropdown").children("button").text($(this).text());

    });

    $(".btn-slo").click(function() {
        var lang = $(this).data("lang");
        console.log(lang);
        localStorage.setItem("lang", lang);
        $("body").removeClass("lang-en lang-slo").addClass("lang-" + lang);
        $("#reset-btn-label").html("Ponastavi");
        $("#title-main").html("Sestavi Top");
        $(".modal-title").html("Pomoč");
        $("#close-btn").html("Zapri");
        language = "slo";
        $(this).parents(".dropdown").children("button").text($(this).text());

    });

    $(".start-game-btn").click(function() {
        $(".canvas_wrapper").css({
            'height': '750px',
            'width': '100%',
        });
        $("nav.fixed-top,div.center_content_wrapper").addClass('hidden');
        $('nav.fixed-bottom').addClass('position-relative');
        $(".canvas_wrapper").removeClass('hidden');


        CreateScene();

    });

    if (localStorage.getItem("lang")) {
        $(".btn-" + localStorage.getItem("lang")).click();
    } else {
        $(".btn-en").click();
    }

});



var exportedBane = undefined;
var exportedScene = undefined;
var intersectedMeshes = [];
var orderObjectsPosition = [0, 1, 2, 5, 3, 10, 5, 1, 9, 4, 3, 11]; //change here depending on the object
var parents = [6, 10, 10, 2, 6, -1, 5, 10, 10, 6, 5];
var positionRegParent = [
    [-0.7, -0.73, -7.5],
    [-0.6, 0, 107],
    [-0.6, 0, 112],
    [-1.2, 0, 119],
    [0, -1.7, -3],
    [0, 0, 0],
    [0.3, 0.7, 30],
    [0.3, -1.0, 109],
    [-0.6, 0, 101.5],
    [0, -1.7, -6.0],
    [0.33, 0, 62.5]
];

var meshesStartPositions = [
    [62, 4.263256414560601e-14, -45],
    [16, 0, 73],
    [30, 0, 97],
    [48, 0, 106],
    [62, 0, -51],
    [0, 0, 0],
    [0, 0, 0],
    [48, 0, 51],
    [30, -5.684341886080802e-14, 56],
    [62, 1.4210854715202004e-14, -49],
    [16, 0, 28]
];

var cameraMoving = false;
var merged = [];

var audio_attach = new Audio('animation/attach_sound.mp3');
var audio_tada = new Audio('animation/tada-sound.mp3');
var mergedFinal = false;
var audio_firesound;



function CreateScene() {
    timer.timeOut = setTimeout(timer.timeoutTick, 10000);
    var debug = true;

    //change here depending on the object
    //console.log(parents.test2[0]);
    var mergePosition = 0;
    var firstMeshPosition = orderObjectsPosition[0];
    var mergedObjects = [];
    var mergedObjectsIds = [];


    var canvas = document.getElementById('game');

    // load the 3D engine
    var engine = new BABYLON.Engine(canvas, true);

    // createScene function that creates and return the scene
    var createScene = function(canvas) {
        var scene = new BABYLON.Scene(engine);
        exportedScene = scene;
        scene.collisionsEnabled = true;
        var camera = new BABYLON.ArcRotateCamera("Camera", 30, 0, 0, new BABYLON.Vector3(0, 0, 0), scene);

        camera.setPosition(new BABYLON.Vector3(106, 77, -53));

        camera.upperRadiusLimit = 150;

        scene.activeCamera = camera;
        scene.activeCamera.attachControl(canvas, true);

        scene.clearColor = new BABYLON.Color3(1, 1, 1);

        var light0 = new BABYLON.HemisphericLight("Hemi0", new BABYLON.Vector3(0, 1, 0), scene);
        light0.diffuse = new BABYLON.Color3(1, 1, 1);
        light0.specular = new BABYLON.Color3(1, 1, 1);
        light0.groundColor = new BABYLON.Color3(0, 0, 0);

        // Ground
        var ground = BABYLON.Mesh.CreateGround("ground", 1000, 1000, 1, scene, false);
        var groundMaterial = new BABYLON.StandardMaterial("ground", scene);
        groundMaterial.specularColor = BABYLON.Color3.Black();
        ground.material = groundMaterial;



        // Events
        var canvas = engine.getRenderingCanvas();
        var startingPoint;
        var currentMesh;


        var loader = new BABYLON.AssetsManager(scene);

        var bane = loader.addMeshTask("bane", "", "models/top_3d/", "untitled.obj");

        bane.onSuccess = 50;


        var cannonMeshes = [];


        loader.onFinish = function() {

            var unid = bane.loadedMeshes.length;

            var counter = 0;

            var meshXpos = 0;
            var meshZpos = 0;

            for (i = 0; i < bane.loadedMeshes.length; i++) {

                bane.loadedMeshes[i].uniqueId = i;

                bane.loadedMeshes[i].position.x = meshesStartPositions[bane.loadedMeshes[i].uniqueId][0];
                bane.loadedMeshes[i].position.z = meshesStartPositions[bane.loadedMeshes[i].uniqueId][2];
                bane.loadedMeshes[i].position.y = meshesStartPositions[bane.loadedMeshes[i].uniqueId][1];

                if (i == 9 || i == 4 || i == 7) {

                    bane.loadedMeshes[i].scaling.x = bane.loadedMeshes[i].scaling.x + 0.04;
                    bane.loadedMeshes[i].scaling.y = bane.loadedMeshes[i].scaling.y + 0.04;
                    bane.loadedMeshes[i].scaling.z = bane.loadedMeshes[i].scaling.z + 0.04;


                }

                if (debug == true) {
                    //bane.loadedMeshes[i].showBoundingBox = true;
                }

            }



            var firstMeshX = bane.loadedMeshes[firstMeshPosition].position.x;
            var firstMeshY = bane.loadedMeshes[firstMeshPosition].position.y;
            var firstMeshZ = bane.loadedMeshes[firstMeshPosition].position.z;



            engine.runRenderLoop(function() {
                scene.render();

            });
            exportedBane = bane;
            timer.initOrderMeshes(exportedBane);

        };

        loader.load();




        var getGroundPosition = function(evt) {
            // Use a predicate to get position on the ground

            var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function(mesh) { return mesh == ground; });
            if (pickinfo.hit) {
                return pickinfo.pickedPoint;
            }

            return null;
        }

        var onPointerDown = function(evt) {
            if (evt.button !== 0) {
                return;
            }

            // check if we are under a mesh
            var pickInfo = scene.pick(scene.pointerX, scene.pointerY, function(mesh) { return mesh !== ground; });
            if (pickInfo.hit) {
                cameraMoving = false;
                currentMesh = pickInfo.pickedMesh;


                if (debug == true) {

                    //console.log("You got object with ID: " + currentMesh.uniqueId);

                    for (i = 0; i < bane.loadedMeshes.length; i++) {
                        if (currentMesh.uniqueId == bane.loadedMeshes[i].uniqueId) {
                            //console.log("You got object with position in array: " + i);
                        }
                    }

                    //console.log("You got object with position in : " + currentMesh.uniqueId);
                    //console.log(currentMesh);

                }

                startingPoint = getGroundPosition(evt);




                if (startingPoint) { // we need to disconnect camera from canvas
                    setTimeout(function() {

                        camera.detachControl(canvas);
                    }, 0);
                }
            } else {
                cameraMoving = true;
            }
        }

        var onPointerUp = function() {
            if (startingPoint) {

                camera.attachControl(canvas);
                startingPoint = null;
                //console.log(camera);
                return;
            }


            //console.log(camera);
            cameraMoving = false;
            //console.log(camera.position);

        }

        var onPointerMove = function(evt) {
            if (cameraMoving) {
                if (timer.active == true) {
                    timer.resetTimerOnMove();
                }
            }
            if (!startingPoint) {
                return;
            }

            var current = getGroundPosition(evt);

            if (!current) {
                return;
            }


            if (currentMesh.parent) {


                if (!merged.includes(currentMesh.uniqueId)) {
                    currentMesh.position.z = currentMesh.parent._geometry.extend.minimum.z + positionRegParent[currentMesh.uniqueId][2];
                    currentMesh.position.y = 0;
                    currentMesh.position.y = currentMesh.position.y + positionRegParent[currentMesh.uniqueId][1];
                    currentMesh.position.x = currentMesh.parent._geometry.extend.maximum.x + positionRegParent[currentMesh.uniqueId][0];
                    if (currentMesh.uniqueId == "9" || currentMesh.uniqueId == "4") {

                        currentMesh.position.x = 0;
                    }

                    if (currentMesh.uniqueId == "7") {

                        currentMesh.position.x = 0.2;
                    }

                    merged.push(currentMesh.uniqueId);

                } else {

                    currentMesh.position.z = currentMesh.parent._geometry.extend.minimum.z + positionRegParent[currentMesh.uniqueId][2];
                    currentMesh.position.x = currentMesh.parent._geometry.extend.maximum.x + positionRegParent[currentMesh.uniqueId][0];

                }
                currentMesh = currentMesh.parent;

            }

            var diff = current.subtract(startingPoint);
            currentMesh.position.addInPlace(diff);

            startingPoint = current;

            var currentMeshId = currentMesh.uniqueId;
            if (parents[currentMesh.uniqueId] != -1) {
                if (currentMesh.intersectsMesh(bane.loadedMeshes[parents[currentMesh.uniqueId]], true)) {


                    var positionCurrentMesh = currentMesh.getAbsolutePosition();

                    if (typeof currentMesh.parent == 'undefined') {
                        //console.log("intersect with parent");
                        intersectedMeshes.push(currentMesh.uniqueId);

                        timer.setIntersected(true);
                        currentMesh.parent = bane.loadedMeshes[parents[currentMesh.uniqueId]];

                        //console.log('setPosition');

                        audio_attach.play();

                        //console.log(currentMesh._geometry.extend.maximum);

                    }
                }
            }
            if (timer.active) { timer.resetTimerOnMove(); }

            var fireButtonLabel = "";

            if (language == "slo") {
                fireButtonLabel = "Poženi!";
            } else {
                fireButtonLabel = "Fire up the cannon!";

            }

            if (merged.length == bane.loadedMeshes.length - 1 && mergedFinal == false) {
                mergedFinal = true;
                timer.destroyTimer();
                $(".modal-body").html(' <button  type="button" class="btn" id="fire-button">' + fireButtonLabel + '</button>')
                $("#helpModal").modal({
                    backdrop: false,
                    keyboard: true,
                    focus: true,
                    position: {
                        my: "right top",
                        at: "left top",
                        of: window
                    }
                }).draggable({
                    handle: ".modal-content"
                });

                if (language == "slo") {
                    $(".modal-title").html("Poženite topa");
                } else {
                    $(".modal-title").html("Fire up!");

                }


                $("#fire-button").click(function() {

                    audio_tada.play();


                    $("#firevideo").css("display", "block");
                    $("#game").hide();

                    var options1 = { "controls": false };

                    var playerFireup = videojs('fire_animation', options1, function onPlayerReady() {
                        videojs.log('Your player is ready!');
                        this.src({ type: 'video/mp4', src: 'animation/EndAnimation.mp4' });
                        this.userActive(false);
                        // In this context, `this` is the player that was created by Video.js.
                        this.play();
                        $("#helpModal").remove();

                        this.on('ended', function() {
                            videojs.log('Awww...over so soon?!');
                        });
                    });
                });




            }


        }

        canvas.addEventListener("pointerdown", onPointerDown, false);
        canvas.addEventListener("pointerup", onPointerUp, false);
        canvas.addEventListener("pointermove", onPointerMove, false);

        scene.onDispose = function() {
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("pointerup", onPointerUp);
            canvas.removeEventListener("pointermove", onPointerMove);
        }

        return scene;
    }

    // call the createScene function
    var scene = createScene(canvas);

    // run the render loop
    engine.runRenderLoop(function() {
        scene.render();
    });

    window.addEventListener('resize', function() {
        engine.resize();
    });


}

function fireTimer(currentTime) {
    if (currentTime > 6) {
        audio_firesound.play();
    }
}

function resetTimer() {
    if (globalInterTimer) clearTimeout(globalInterTimer);
    globalInterTimer = setTimeout(inactivity, 1000 * 60 * 3);
}



function inactivity() {
    window.location.href = "index.html";
}