var SipuViewer = (function (SipuViewer, undefined) {
    "use strict";
    /***
     * Import Ext function
     */
    function loadJSON(path, success, error) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    if (success)
                        success(JSON.parse(xhr.responseText));
                } else {
                    if (error)
                        error(xhr);
                }
            }
        };
        xhr.open("GET", path, true);
        xhr.send();
    }
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function rgbToHex(rgb) {
        var hex = rgb.map(a => a.toString(16).length == 1 ?
            "0" + a.toString(16) : a.toString(16));
        return "#" + hex.join('');
    }
    function nowTime() {
        var date = new Date()
        return [date.getHours(), date.getMinutes()];
    }
    function getBezierXY(t, sx, sy, cp1x, cp1y, cp2x, cp2y, ex, ey) {
        return [
            Math.pow(1 - t, 3) * sx + 3 * t * Math.pow(1 - t, 2) * cp1x + 3 * t * t * (1 - t) * cp2x + t * t * t * ex,
            Math.pow(1 - t, 3) * sy + 3 * t * Math.pow(1 - t, 2) * cp1y + 3 * t * t * (1 - t) * cp2y + t * t * t * ey
        ];
    }
    /***
     * Init Enviroment
     */
    SipuViewer.init = {
        VER: "1.0",
        canvasID: "main_canvas",
        timefps: 60,
        fps: 30
    };
    /***
     * init Canvas
     */
    var Canvas = {
        obj: document.getElementById(SipuViewer.init.canvasID)
    };
    /***
     * view setting
     */
    var dpi = window.devicePixelRatio || 1
    Canvas.obj.width = window.innerWidth;
    Canvas.obj.height = window.innerHeight;
    Canvas.obj.setAttribute('width', Canvas.obj.width * dpi);
    Canvas.obj.setAttribute('height', Canvas.obj.height * dpi);
    var CAN = {
        WIDTH: Canvas.obj.width,
        HEIGHT: Canvas.obj.height,
        MIDDLE: Canvas.obj.width * 0.5,
        HORIZONS: Canvas.obj.height * 0.5,
        DPI: dpi
    }
    Canvas.init = function () {
        //init canvas
        Canvas.ctx = Canvas.obj.getContext("2d");
        Canvas.bound = Canvas.obj.getBoundingClientRect();
        Canvas.ctx.scale(CAN.DPI, CAN.DPI);
        //init event
        var rc = clickEvent;
        Canvas.obj.addEventListener("click", rc, false);
    };
    Canvas.update = function (dt) {
        fetchTime(dt);
        fetchBgPicPath(dt);
        fetchPath(dt);
        fetchBgObj(dt);
        fetchTarget(USER.Target);
        fetchItem(dt);
        fetchButterFly(dt);
        fetchUser(dt);
    };
    Canvas.draw = function () {
        drawBg();
        drawPath();
        drawBgObj();
        drawAllTimeColor();
        drawBgfrontObj();
        drawBgPic();
        drawBgPicOut();
        drawItem();
        drawButterFly();
        drawUser();
    };
    /***
     * Init Object 
     */
    var BGSTATE = {
        DAY: 1,
        NIGHT: 2,
        MORNING: 3,
        EVENING: 4
    };
    var COLOR = {
        AIR: [
            [11, 3, 32, 0.7],
            [11, 3, 32, 0.7],
            [11, 3, 32, 0.7],
            [11, 3, 32, 0.6],
            [11, 3, 32, 0.5],
            [98, 12, 116, 0.4],
            [158, 40, 160, 0.3],
            [226, 88, 153, 0.2],
            [219, 179, 120, 0.1],
            [232, 226, 187, 0],
            [232, 226, 187, 0],
            [232, 226, 187, 0],
            [232, 226, 187, 0],
            [232, 226, 187, 0],
            [232, 226, 187, 0],
            [232, 226, 187, 0],
            [239, 217, 172, 0.2],
            [242, 170, 104, 0.3],
            [219, 78, 123, 0.4],
            [68, 18, 91, 0.5],
            [11, 3, 32, 0.6],
            [11, 3, 32, 0.7],
            [11, 3, 32, 0.7],
            [11, 3, 32, 0.7],
            [11, 3, 32, 0.7]
        ],
        NOWAIR: [],
        SKY: { TOP: rgbToHex([89, 166, 224]), BOTTOM: rgbToHex([167, 208, 239]) },
        PATH: { TOP: rgbToHex([191, 181, 168]), BOTTOM: rgbToHex([91, 55, 20]) },
        LAND: { TOP: rgbToHex([179, 211, 160]), BOTTOM: rgbToHex([121, 186, 83]) }
    };
    var OBJMOD = {
        PATHPOINT: {
            P1TX: CAN.MIDDLE - (CAN.MIDDLE * 0.5),
            P1TY: CAN.HORIZONS + CAN.HORIZONS * 0.2,
            P1BX: CAN.MIDDLE - (CAN.MIDDLE * 0.1),
            P1BY: CAN.HORIZONS + CAN.HORIZONS * 0.8,
            P2TX: CAN.MIDDLE - (CAN.MIDDLE * 0.3),
            P2TY: CAN.HORIZONS + CAN.HORIZONS * 0.2,
            P2BX: CAN.MIDDLE + (CAN.MIDDLE * 0.6),
            P2BY: CAN.HORIZONS + CAN.HORIZONS * 0.8
        },
        Path: { x: CAN.MIDDLE, y: CAN.HORIZONS },
        PathSet: { x: CAN.MIDDLE, y: CAN.HORIZONS },
        Pic: [],
        PicKey: [],
        PicLarge: "",
        Pos: [],
        PicSize: 18,
        PicHarfSize: 9,
        PicChangeSize: 500,
        PicOut: []
    };
    OBJMOD.SetBgPic = function () {
        var len = OBJMOD.Pic.length;
        OBJMOD.Pos = Array.apply(null, Array(len))
            .map(a => [getRandomInt(0, CAN.WIDTH), getRandomInt(CAN.HORIZONS - CAN.HORIZONS * 0.3, CAN.HORIZONS - CAN.HORIZONS * 0.1), OBJMOD.PicSize]);
    };
    var OBJBG = {
        OBJLIST: ["MOUNTAIN2", "CLOUD", "MOON", "STAR", "STONE_A", "STONE_B"],
        AIRTIMER: 0,
        CPT: {},
        PIC: {},
        POS: {}
    };
    OBJBG.SetBgObjPos = function () {
        OBJBG.POS["MOUNTAIN2"] = [CAN.WIDTH * 0.5, CAN.HORIZONS - CAN.WIDTH * 0.40];
        OBJBG.CPT["CLOUD"] = 10;
        OBJBG.POS["CLOUD"] = Array.apply(null, Array(OBJBG.CPT["CLOUD"]))
            .map(a => [getRandomInt(0, CAN.WIDTH), getRandomInt(CAN.HORIZONS * 0.1, CAN.HORIZONS * 0.35), getRandomInt(30, 50)]);
        OBJBG.CPT["STAR"] = 30;
        OBJBG.POS["STAR"] = Array.apply(null, Array(OBJBG.CPT["STAR"]))
            .map(a => [getRandomInt(0, CAN.WIDTH), getRandomInt(0, CAN.HORIZONS * 0.35), getRandomInt(2, 5)]);
    };
    var OBJITEM = {
        ITEMTIMER: 0,
        OBJLIST: ["APPLE", "CARROT", "STRAWBERRY", "LIKE", "BUTTERFLY"],
        PATH: {},
        LIFE: {},
        LIFEADDPOS: [],
        POS: {},
        TARGET: {},
        PIC: {}
    };
    OBJITEM.SetPos = function () {
        OBJITEM.PATH["APPLE"] = [];
        OBJITEM.PATH["CARROT"] = [];
        OBJITEM.PATH["STRAWBERRY"] = [];
        OBJITEM.LIFE["APPLE"] = [];
        OBJITEM.LIFE["CARROT"] = [];
        OBJITEM.LIFE["STRAWBERRY"] = [];
        OBJITEM.POS["APPLE"] = [];
        OBJITEM.POS["CARROT"] = [];
        OBJITEM.POS["STRAWBERRY"] = [];
        OBJITEM.POS["LIKE"] = [CAN.WIDTH - 30, 10, 16];
        OBJITEM.POS["BUTTERFLY"] = [CAN.WIDTH * 0.5, CAN.HORIZONS * 0.5, 20, 20];
        OBJITEM.TARGET["BUTTERFLY"] = [];
        OBJITEM.TARGET.BUTTERFLYWING = true;
        OBJITEM.TARGET.BUTTERFLYSPEED = 30;
    };
    var USERSTATE = {
        Walk: 1,
        Rest: 2,
        Turn: 3
    };
    var USER = {
        PIC: {},
        Pos: [CAN.MIDDLE - 20, CAN.HEIGHT - 80, 50],
        MovIdx: 0,
        Target: -1,
        TimeSet: new Date(),
        State: USERSTATE.Walk,
        EnergyMax: 100,
        Energy: 100
    };
    USER.SetPos = function () {
        USER.RestPostYOri = [20, -12, 2];
        USER.PosYAdd = [0, 0, 0];
        USER.Mov = [
            [0, 0, 0],
            [0.05, -0.05, 0.02],
            [0.25, -0.25, 0.03],
            [0.50, -0.50, 0.07],
            [1.00, -1.00, 0.12],
            [1.70, -1.70, 0.17],
            [2.00, -2.00, 0.22],
            [2.00, -2.00, 0.30],
            [1.90, -1.90, 0.35],
            [1.80, -1.80, 0.40],
            [1.70, -1.70, 0.50],
            [1.60, -1.60, 0.65],
            [1.50, -1.50, 0.75],
            [1.40, -1.40, 1.00],
            [1.30, -1.30, 0.92],
            [1.20, -1.20, 0.95],
            [1.10, -1.10, 0.92],
            [1.00, -1.00, 0.85],
            [0.90, -0.90, 0.70],
            [0.80, -0.80, 0.67],
            [0.70, -0.70, 0.50],
            [0.60, -0.60, 0.37],
            [0.50, -0.50, 0.32],
            [0.50, -0.50, 0.27],
            [0.40, -0.40, 0.20],
            [0.30, -0.30, 0.15],
            [0.25, -0.25, 0.10],
            [0.15, -0.15, 0.07],
            [0.10, -0.10, 0.05],
            [0.05, -0.05, 0.02]
        ];
    }
    /***
     *  Sub Function obj draw & obj fetch 
     */
    function CanvasLoop(drawobj) {
        var dt = 1 / SipuViewer.init.fps;
        Canvas.update(dt);
        Canvas.draw();
    }
    function clickEvent(e) {
        var clk_X = e.clientX - Canvas.bound.left;
        var clk_Y = e.clientY - Canvas.bound.top;
        userChangeTarget(clk_X, clk_Y);
        userEatItem(clk_X, clk_Y);
    }
    function userChangeTarget(x, y) {
        var idx = -1;
        OBJMOD.Pos.map((a, i) => {
            if (a[0] - OBJMOD.PicHarfSize < x
                && a[0] + OBJMOD.PicHarfSize > x
                && a[1] - OBJMOD.PicSize < y
                && a[1] > y
            ) {
                idx = i;
            }
        });
        if (idx !== -1) {
            if (USER.State !== USERSTATE.Walk) { return; }
            if (idx === -1) { USER.Target = -1; return; }
            if (USER.Target !== idx) {
                USER.State = USERSTATE.Turn;
                USER.Target = idx;
                OBJMOD.PathSet.x = x;
                OBJMOD.PathSet.y = y;
                loadBigPic("");
                console.log(USER.TimeSet, idx);
            }
        }
    }
    function userEatItem(x, y) {
        Object.keys(OBJITEM.POS).map(key => {
            if ((key === "APPLE" || key === "CARROT" || key === "STRAWBERRY") === false) { return; }
            OBJITEM.POS[key].map((a, i) => {
                if (
                    a[0] < x
                    && a[0] + a[2] > x
                    && a[1] < y
                    && a[1] + a[2] > y
                ) {
                    if (USER.State !== USERSTATE.Walk) { return; }
                    console.log(OBJITEM.POS[key], x, y);
                    USER.Energy = USER.Energy + (OBJITEM.LIFE[key][i] * 0.1) > USER.EnergyMax ?
                        USER.EnergyMax : USER.Energy + (OBJITEM.LIFE[key][i] * 0.1);
                    OBJITEM.LIFEADDPOS = [x - 12, y - 12, 20, 1];
                    OBJITEM.LIFE[key][i] = 0;
                }
            });
        })
    }
    function fetchUser(dt) {
        if (USER.State === USERSTATE.Rest) {
            if (USER.Energy > USER.EnergyMax * 0.5) {
                USER.PosYAdd[0] = USER.PosYAdd[0] > 0 ? USER.PosYAdd[0] - dt : 0;
                USER.PosYAdd[1] = USER.PosYAdd[1] < 0 ? USER.PosYAdd[1] + dt : 0;
                USER.PosYAdd[2] = USER.PosYAdd[2] > 0 ? USER.PosYAdd[2] - dt : 0;
                if (USER.PosYAdd.every(a => a === 0)) {
                    USER.State = USERSTATE.Walk;
                    console.log(USER.Pos, "Go again");
                }
            } else {
                if (USER.PosYAdd[0] < USER.RestPostYOri[0]) {
                    USER.PosYAdd[0] += dt;
                } else {
                    USER.PosYAdd[0] = USER.RestPostYOri[0];
                }
                if (USER.PosYAdd[1] > USER.RestPostYOri[1]) {
                    USER.PosYAdd[1] -= dt;
                } else {
                    USER.PosYAdd[1] = USER.RestPostYOri[1];
                }
                if (USER.PosYAdd[2] > USER.RestPostYOri[2]) {
                    USER.PosYAdd[2] -= dt;
                } else {
                    USER.PosYAdd[2] = USER.RestPostYOri[2];
                }
                USER.Energy += dt * 0.5;
            }
        }
        if (USER.State === USERSTATE.Walk) {
            if (USER.Energy === 0) {
                USER.State = USERSTATE.Rest;
                return;
            }
            USER.Energy -= dt * 0.1;
            USER.Energy = USER.Energy < 0 ? 0 : USER.Energy;
            USER.MovIdx = (USER.MovIdx + 1) % USER.Mov.length;
        }
        if (USER.State === USERSTATE.Turn) {
        }
    }
    function drawUser() {
        var a = USER.Pos;
        var i = USER.MovIdx;
        Canvas.ctx.drawImage(USER.PIC["HEAD"]
            , a[0] + 12
            , a[1] - 10 + USER.Mov[i][0] + USER.PosYAdd[0]
            , a[2] - 12
            , a[2] - 12
        );
        Canvas.ctx.drawImage(USER.PIC["TAIL"]
            , a[0] + 14
            , a[1] + 20 + USER.Mov[i][1] + USER.PosYAdd[1]
            , a[2] - 16
            , a[2] - 16
        );
        Canvas.ctx.drawImage(USER.PIC["BODY"]
            , a[0]
            , a[1] + USER.Mov[i][2] + USER.PosYAdd[2]
            , a[2]
            , a[2]
        );
        Canvas.ctx.drawImage(OBJITEM.PIC["LIKE"],
            OBJITEM.POS["LIKE"][0],
            OBJITEM.POS["LIKE"][1],
            OBJITEM.POS["LIKE"][2],
            OBJITEM.POS["LIKE"][2]
        );
        Canvas.ctx.fillStyle = '#FD0';
        Canvas.ctx.fillRect(CAN.WIDTH - 140, 13, 104, 8);
        Canvas.ctx.fillStyle = '#e44';
        Canvas.ctx.fillRect(CAN.WIDTH - 38 - USER.Energy, 14, USER.Energy, 6);
    }
    function fetchButterFly(dt) {
        if (0 < OBJITEM.TARGET["BUTTERFLY"].length) {
            var flydisx = getRandomInt(2, 4) * dt * 2;
            var flydisy = getRandomInt(2, 4) * dt * 2;
            OBJITEM.POS["BUTTERFLY"][0] = OBJITEM.POS["BUTTERFLY"][0] > OBJITEM.TARGET["BUTTERFLY"][0][0] ?
                OBJITEM.POS["BUTTERFLY"][0] - flydisx : OBJITEM.POS["BUTTERFLY"][0] + flydisx;
            OBJITEM.POS["BUTTERFLY"][1] = OBJITEM.POS["BUTTERFLY"][1] > OBJITEM.TARGET["BUTTERFLY"][0][1] ?
                OBJITEM.POS["BUTTERFLY"][1] - flydisy : OBJITEM.POS["BUTTERFLY"][1] + flydisy;
            if (2 > Math.abs(OBJITEM.TARGET["BUTTERFLY"][0][0] - OBJITEM.POS["BUTTERFLY"][0])
                && 2 > Math.abs(OBJITEM.TARGET["BUTTERFLY"][0][1] - OBJITEM.POS["BUTTERFLY"][1])) {
                OBJITEM.TARGET["BUTTERFLY"].shift();
            }
            //Wing Effect
            if (OBJITEM.TARGET.BUTTERFLYWING) {
                OBJITEM.POS["BUTTERFLY"][2] -= dt * OBJITEM.TARGET.BUTTERFLYSPEED;
                if (OBJITEM.POS["BUTTERFLY"][2] <= 1) { OBJITEM.TARGET.BUTTERFLYWING = false; }
            } else {
                OBJITEM.POS["BUTTERFLY"][2] += dt * OBJITEM.TARGET.BUTTERFLYSPEED;
                if (OBJITEM.POS["BUTTERFLY"][2] >= 20) { OBJITEM.TARGET.BUTTERFLYWING = true; }
            }
        }
        if (1 === getRandomInt(0, 50) && OBJITEM.TARGET["BUTTERFLY"].length === 0) {
            var x = getRandomInt(100, CAN.WIDTH - 100);
            var y = getRandomInt(80, CAN.HEIGHT - 80);
            var lx = x - OBJITEM.POS["BUTTERFLY"][0] > 0 ?
                OBJITEM.POS["BUTTERFLY"][0] : x;
            var rx = x - OBJITEM.POS["BUTTERFLY"][0] > 0 ?
                x : OBJITEM.POS["BUTTERFLY"][0];
            var ty = y - OBJITEM.POS["BUTTERFLY"][1] > 0 ?
                OBJITEM.POS["BUTTERFLY"][1] : y;
            var by = y - OBJITEM.POS["BUTTERFLY"][1] > 0 ?
                y : OBJITEM.POS["BUTTERFLY"][1];
            var add = Array.apply(null, Array(5))
                .map(a => [getRandomInt(lx, rx), getRandomInt(ty, by)]);
            OBJITEM.TARGET["BUTTERFLY"] = add;
        }
    }
    function drawButterFly() {
        Canvas.ctx.drawImage(OBJITEM.PIC["BUTTERFLY"],
            OBJITEM.POS["BUTTERFLY"][0] - OBJITEM.POS["BUTTERFLY"][2] * 0.5,
            OBJITEM.POS["BUTTERFLY"][1],
            OBJITEM.POS["BUTTERFLY"][2],
            OBJITEM.POS["BUTTERFLY"][3]
        );

    }
    function fetchItem(dt) {
        if (USERSTATE.Walk !== USER.State) { return; }
        if (0 < OBJITEM.LIFEADDPOS.length) {
            OBJITEM.LIFEADDPOS[3] -= dt * 0.5;
            OBJITEM.LIFEADDPOS[1] -= 0.5;
            OBJITEM.LIFEADDPOS[2] += 0.1;
            if (OBJITEM.LIFEADDPOS[3] <= 0.05) {
                OBJITEM.LIFEADDPOS = [];
            }
        }
        /***
         * 기존 아이템 페치
         */
        var speed = dt * 3;
        OBJITEM.LIFE["APPLE"] = OBJITEM.LIFE["APPLE"].map(a => a - speed);
        OBJITEM.LIFE["CARROT"] = OBJITEM.LIFE["CARROT"].map(a => a - speed);
        OBJITEM.LIFE["STRAWBERRY"] = OBJITEM.LIFE["STRAWBERRY"].map(a => a - speed);
        OBJITEM.LIFE["APPLE"] = OBJITEM.LIFE["APPLE"].filter(a => a > 0);
        OBJITEM.LIFE["CARROT"] = OBJITEM.LIFE["CARROT"].filter(a => a > 0);
        OBJITEM.LIFE["STRAWBERRY"] = OBJITEM.LIFE["STRAWBERRY"].filter(a => a > 0);
        OBJITEM.POS["APPLE"] = OBJITEM.LIFE["APPLE"].map((a, i) => {
            var idx = Math.floor((1000 - a) * 0.02);
            var oripos = OBJITEM.POS["APPLE"][i];
            var pos = OBJITEM.PATH["APPLE"][i][idx];
            var x = oripos[0] > pos[0] ? oripos[0] - 0.1 * speed : oripos[0] + 0.1 * speed;
            var y = oripos[1] + 0.1 * speed;
            return [x, y, 20 + idx];
        });
        OBJITEM.POS["CARROT"] = OBJITEM.LIFE["CARROT"].map((a, i) => {
            var idx = Math.floor((1000 - a) * 0.02);
            var oripos = OBJITEM.POS["CARROT"][i];
            var pos = OBJITEM.PATH["CARROT"][i][idx];
            var x = oripos[0] > pos[0] ? oripos[0] - 0.1 * speed : oripos[0] + 0.1 * speed;
            var y = oripos[1] + 0.1 * speed;
            return [x, y, 20 + idx];
        });
        OBJITEM.POS["STRAWBERRY"] = OBJITEM.LIFE["STRAWBERRY"].map((a, i) => {
            var idx = Math.floor((1000 - a) * 0.02);
            var oripos = OBJITEM.POS["STRAWBERRY"][i];
            var pos = OBJITEM.PATH["STRAWBERRY"][i][idx];
            var x = oripos[0] > pos[0] ? oripos[0] - 0.1 * speed : oripos[0] + 0.1 * speed;
            var y = oripos[1] + 0.1 * speed;
            return [x, y, 20 + idx];
        });
        /***
         * 신규 아이템 생성
         */
        OBJITEM.ITEMTIMER -= dt;
        if (OBJITEM.ITEMTIMER > 0) {
            return;
        }
        var allitems = 0;
        allitems += OBJITEM.PATH["APPLE"].length;
        allitems += OBJITEM.PATH["CARROT"].length;
        allitems += OBJITEM.PATH["STRAWBERRY"].length;
        if (allitems > 0) { return; }
        OBJITEM.ITEMTIMER = SipuViewer.init.timefps * 10;
        if (Math.round(Math.random()) === 0) {
            return;
        }
        var il = { "0": "APPLE", "1": "CARROT", "2": "STRAWBERRY" };
        var item = il[getRandomInt(0, 2) + ''];
        var randEndX = getRandomInt(200, 600);
        var path = Array.apply(null, Array(20)).map((a, i) =>
            getBezierXY(
                0.2 + (0.04 * i),
                OBJMOD.Path.x,
                CAN.WIDTH,
                OBJMOD.PATHPOINT.P1TX,
                OBJMOD.PATHPOINT.P1TY,
                OBJMOD.PATHPOINT.P1BX,
                OBJMOD.PATHPOINT.P1BY,
                randEndX,
                CAN.HEIGHT
            )
        );
        OBJITEM.PATH[item].push(path);
        OBJITEM.LIFE[item].push(999);
        OBJITEM.POS[item].push([path[0][0], path[0][1], 20]);
        console.log(item, OBJITEM.LIFE[item]);
    }
    function drawItem() {
        OBJITEM.POS["APPLE"].map(a => {
            Canvas.ctx.drawImage(OBJITEM.PIC["APPLE"], a[0], a[1], a[2], a[2]);
        });
        OBJITEM.POS["CARROT"].map(a => {
            Canvas.ctx.drawImage(OBJITEM.PIC["CARROT"], a[0], a[1], a[2], a[2]);
        });
        OBJITEM.POS["STRAWBERRY"].map(a => {
            Canvas.ctx.drawImage(OBJITEM.PIC["STRAWBERRY"], a[0], a[1], a[2], a[2]);
        });
        //Eat Item event
        if (4 === OBJITEM.LIFEADDPOS.length) {
            Canvas.ctx.globalAlpha = OBJITEM.LIFEADDPOS[3];
            Canvas.ctx.drawImage(OBJITEM.PIC["LIKE"],
                OBJITEM.LIFEADDPOS[0],
                OBJITEM.LIFEADDPOS[1],
                OBJITEM.LIFEADDPOS[2],
                OBJITEM.LIFEADDPOS[2]
            );
            Canvas.ctx.globalAlpha = 1;
        }
    }
    function fetchBgPicPath(dt) {
        if (USER.State !== USERSTATE.Walk) { return; }
        var oneStep = dt * 1;
        if ((CAN.WIDTH * 0.5) - 1 > OBJMOD.Path.x) {
            OBJMOD.Pos = OBJMOD.Pos.map(a => {
                a[0] += oneStep;
                if (a[0] > CAN.WIDTH) {
                    a[0] -= CAN.WIDTH;
                }
                return a;
            });
            OBJMOD.Path.x += oneStep;
            OBJMOD.PathSet.x += oneStep;
        }
        if (CAN.WIDTH * 0.5 < OBJMOD.Path.x) {
            OBJMOD.Pos.map(a => {
                a[0] -= oneStep;
                if (a[0] < 0) {
                    a[0] += CAN.WIDTH;
                }
            });
            OBJMOD.Path.x -= oneStep;
            OBJMOD.PathSet.x -= oneStep;
        }
    }
    function drawBg() {
        var grdSky = Canvas.ctx.createLinearGradient(0, 0, 0, CAN.HORIZONS);
        grdSky.addColorStop(0, COLOR.SKY.TOP);
        grdSky.addColorStop(1, COLOR.SKY.BOTTOM);
        Canvas.ctx.fillStyle = grdSky;
        Canvas.ctx.fillRect(0, 0, CAN.WIDTH, CAN.HORIZONS);
        var grdLand = Canvas.ctx.createLinearGradient(0, CAN.HORIZONS, 0, CAN.HEIGHT);
        grdLand.addColorStop(0, COLOR.LAND.TOP);
        grdLand.addColorStop(1, COLOR.LAND.BOTTOM);
        Canvas.ctx.fillStyle = grdLand;
        Canvas.ctx.fillRect(0, CAN.HORIZONS, CAN.WIDTH, CAN.HEIGHT);
    }
    function fetchTarget(idx) {
        if (idx === -1 || idx == undefined) { return; }
        if (USER.State !== USERSTATE.Walk) { return; }
        var timespan = new Date().getTime() - USER.TimeSet.getTime();
        if (OBJMOD.Pos[idx][2] > OBJMOD.PicChangeSize * 0.5) {
            if (OBJMOD.PicLargekey === "") {
                //loadkey
                OBJMOD.PicLargekey = OBJMOD.PicKey[idx];
                loadBigPic(OBJMOD.PicLargekey);
            }
        }
        OBJMOD.Pos[idx][2] = OBJMOD.PicSize + (timespan / 10000);
        if (OBJMOD.Pos[idx][1] - OBJMOD.Pos[idx][2] * 0.33 < 0) {
            OBJMOD.Pos[idx][1] += 0.7;
        }
        OBJMOD.Pos.map((a, i) => {
            if (a[2] > OBJMOD.PicSize && i < OBJMOD.Pos.length - 1) {
                OBJMOD.Pos[i][2] -= 0.7;
                if (OBJMOD.Pos[i][2] < OBJMOD.PicSize) { OBJMOD.Pos[i][2] = OBJMOD.PicSize; }
            }
        });
        if (OBJMOD.Pos[idx][2] > OBJMOD.PicChangeSize) {
            var outP = OBJMOD.Pic.splice(idx, 1)[0];
            var outPos = OBJMOD.Pos.splice(idx, 1)[0];
            OBJMOD.PicKey.splice(idx, 1);
            OBJMOD.PicOut = [outP, outPos];
            USER.Target = -1;
            loadBigPic("");
        }
    }
    function drawBgPic() {
        OBJMOD.Pos.map((a, i) => {
            if (i === USER.Target) { return; }
            Canvas.ctx.drawImage(OBJMOD.Pic[i]
                , (a[0] - (a[2] * 0.5)), (a[1] - (a[2] * 0.33)), a[2], a[2] * 0.67);
        });
        if (USER.Target === -1) { return; }
        var idx = USER.Target;
        var pos = OBJMOD.Pos[idx];
        if (OBJMOD.PicLarge !== "") {
            Canvas.ctx.drawImage(OBJMOD.PicLarge
                , (pos[0] - (pos[2] * 0.5)), (pos[1] - pos[2] * 0.33), pos[2], pos[2] * 0.67);
        } else {
            Canvas.ctx.drawImage(OBJMOD.Pic[idx]
                , (pos[0] - (pos[2] * 0.5)), (pos[1] - pos[2] * 0.33), pos[2], pos[2] * 0.67);
        }
    }
    function loadBigPic(key) {
        if (key === "") {
            OBJMOD.PicLarge = "";
            OBJMOD.PicLargekey = "";
        } else {
            loadJSON("imgdata/" + key + ".json", function (data) {
                console.log(data);
                OBJMOD.PicLarge = new Image();
                OBJMOD.PicLarge.src = "data:image/png;base64," + data.data;
            });
        }
    }
    function drawBgPicOut() {
        if (OBJMOD.PicOut.length === 0) { return; }
        if (OBJMOD.PicOut[1][1] + OBJMOD.PicOut[1][2] * 0.67 < 1) { OBJMOD.PicOut = []; return; }
        Canvas.ctx.drawImage(
            OBJMOD.PicOut[0],
            (OBJMOD.PicOut[1][0] - (OBJMOD.PicOut[1][2] * 0.5)),
            (OBJMOD.PicOut[1][1] - OBJMOD.PicOut[1][2] * 0.33),
            OBJMOD.PicOut[1][2], OBJMOD.PicOut[1][2] * 0.67
        );
        OBJMOD.PicOut[1][1] -= 1;
    }
    function fetchPath(dt) {
        if (USER.State === USERSTATE.Rest) { return; }
        var oneStep = dt * 20;
        var onside = OBJMOD.Path.x || 0;
        var goal = OBJMOD.PathSet.x || 0;
        var gap = Math.abs(onside - goal);
        if (gap > 1) {
            if (USER.State !== USERSTATE.Turn) { USER.State = USERSTATE.Turn; }
            if (oneStep < gap) {
                OBJMOD.Path.x = onside > goal ? onside - oneStep : onside + oneStep;
            } else {
                OBJMOD.Path.x = onside > goal ? onside - gap : onside + gap;
            }
        } else {
            if (USER.State !== USERSTATE.Walk) {
                USER.State = USERSTATE.Walk;
                USER.TimeSet = new Date();
            }
        }
    }
    function drawPath() {
        var grd = Canvas.ctx.createLinearGradient(0, CAN.HORIZONS, 0, CAN.HEIGHT);
        grd.addColorStop(0, COLOR.PATH.TOP);
        grd.addColorStop(1, COLOR.PATH.BOTTOM);
        Canvas.ctx.beginPath();
        Canvas.ctx.strokeStyle = COLOR.PATH.BOTTOM;
        Canvas.ctx.moveTo(OBJMOD.Path.x, CAN.HORIZONS);
        Canvas.ctx.bezierCurveTo(
            OBJMOD.PATHPOINT.P1TX,
            OBJMOD.PATHPOINT.P1TY,
            OBJMOD.PATHPOINT.P1BX,
            OBJMOD.PATHPOINT.P1BY,
            (CAN.WIDTH * 0.5) - CAN.MIDDLE * 0.5,
            CAN.HEIGHT
        );
        Canvas.ctx.lineTo((CAN.WIDTH * 0.5) + CAN.MIDDLE * 0.5, CAN.HEIGHT);
        Canvas.ctx.bezierCurveTo(
            OBJMOD.PATHPOINT.P2BX,
            OBJMOD.PATHPOINT.P2BY,
            OBJMOD.PATHPOINT.P2TX,
            OBJMOD.PATHPOINT.P2TY,
            OBJMOD.Path.x,
            CAN.HORIZONS
        );
        Canvas.ctx.closePath();
        Canvas.ctx.fillStyle = grd;
        Canvas.ctx.fill();
    }
    function fetchBgObj(dt) {
        if (USER.State !== USERSTATE.Walk) { return; }
        var oneStep = dt * 1;
        if ((CAN.WIDTH * 0.5) - 1 > OBJMOD.Path.x) {
            OBJBG.POS["MOUNTAIN2"][0] += oneStep;
            OBJBG.POS["CLOUD"].map((a, i) => {
                OBJBG.POS["CLOUD"][i][0] += oneStep;
            });
        }
        if (CAN.WIDTH * 0.5 < OBJMOD.Path.x) {
            OBJBG.POS["MOUNTAIN2"][0] -= oneStep;
            OBJBG.POS["CLOUD"].map((a, i) => {
                OBJBG.POS["CLOUD"][i][0] -= oneStep;
            });
        }
        OBJBG.POS["MOUNTAIN2"][0] = OBJBG.POS["MOUNTAIN2"][0] > CAN.WIDTH
            ? OBJBG.POS["MOUNTAIN2"][0] % CAN.WIDTH : OBJBG.POS["MOUNTAIN2"][0];
        OBJBG.POS["MOUNTAIN2"][0] = OBJBG.POS["MOUNTAIN2"][0] < 0
            ? OBJBG.POS["MOUNTAIN2"][0] + CAN.WIDTH : OBJBG.POS["MOUNTAIN2"][0];
        OBJBG.POS["CLOUD"].map((a, i) => {
            OBJBG.POS["CLOUD"][i][0] -= oneStep * 0.02 * OBJBG.POS["CLOUD"][i][2];
        });
        OBJBG.POS["CLOUD"] = OBJBG.POS["CLOUD"].filter(a => a[0] + a[2] > 0);
        if (OBJBG.POS["CLOUD"].length < OBJBG.CPT["CLOUD"]) {
            OBJBG.POS["CLOUD"].push([CAN.WIDTH, getRandomInt(20, 150), getRandomInt(30, 50)]);
        }
    }
    function drawBgObj() {
        Canvas.ctx.globalAlpha = 1 - COLOR.NOWAIR[3];
        OBJBG.POS["CLOUD"].map(a => {
            Canvas.ctx.drawImage(OBJBG.PIC["CLOUD"], a[0], a[1], a[2], a[2]);
        });
        Canvas.ctx.globalAlpha = 1;
        var mp = OBJBG.POS["MOUNTAIN2"];

        Canvas.ctx.drawImage(OBJBG.PIC["MOUNTAIN2"], mp[0] - CAN.WIDTH, mp[1], CAN.WIDTH, CAN.MIDDLE);
        Canvas.ctx.drawImage(OBJBG.PIC["MOUNTAIN2"], mp[0], mp[1], CAN.WIDTH, CAN.MIDDLE);
        //돌 부딫힘 이벤트 고려 하기
        //Canvas.ctx.drawImage(OBJBG.PIC["STONE_A"], 0, 200, 800, 400);
        //Canvas.ctx.drawImage(OBJBG.PIC["STONE_B"], 0, 200, 800, 400);
    }
    function drawBgfrontObj() {
        Canvas.ctx.globalAlpha = COLOR.NOWAIR[3];
        OBJBG.POS["STAR"].map(a => {
            Canvas.ctx.drawImage(OBJBG.PIC["STAR"], a[0], a[1], a[2], a[2]);
        });
        Canvas.ctx.globalAlpha = 1;
    }
    function fetchTime(dt) {
        OBJBG.AIRTIMER -= dt;
        if (OBJBG.AIRTIMER > 0) {
            return;
        }
        OBJBG.AIRTIMER = SipuViewer.init.timefps;
        //console.log(buffer);
        //t[0] = hour, t[1] = min
        var t = nowTime();
        //t = [20, 20];
        var now = COLOR.AIR[t[0]];
        var next = COLOR.AIR[t[0] % 24];
        var p = t[1] * 0.167;
        var c = [
            now[0] + Math.floor((next[0] - now[0]) * p),
            now[1] + Math.floor((next[1] - now[1]) * p),
            now[2] + Math.floor((next[2] - now[2]) * p),
            now[3]
        ];
        COLOR.NOWAIR = c;
    }
    function drawAllTimeColor() {
        //console.log()
        Canvas.ctx.globalAlpha = COLOR.NOWAIR[3];
        Canvas.ctx.fillStyle = rgbToHex(COLOR.NOWAIR.slice(0, 3));
        Canvas.ctx.fillRect(0, 0, CAN.WIDTH, CAN.HEIGHT);
        Canvas.ctx.globalAlpha = 1;
    }
    function LoadData(f) {
        var pngaddcode = "data:image/png;base64,";
        var svgaddcode = "data:image/svg+xml;base64,";
        var count = 0;
        var counter = function () {
            count++;
            if (count + 1 === f.length) {
                return loadComplete();
            }
        };
        f.map(a => {
            loadJSON("data/" + a, function (data) {
                if (a === "data.json") {
                    data.pic.map((a, i) => {
                        OBJMOD.Pic.push(new Image());
                        OBJMOD.PicKey.push(a.slice(60, 90).split("/").join(""));
                        OBJMOD.Pic[i].src = pngaddcode + a;
                    });
                    OBJMOD.SetBgPic();
                }
                if (a === "bgobj.json") {
                    Object.entries(data).map(a => {
                        OBJBG.PIC[a[0]] = new Image();
                        OBJBG.PIC[a[0]].src = svgaddcode + a[1];
                    });
                    OBJBG.SetBgObjPos();
                }
                if (a === "itemobj.json") {
                    Object.entries(data).map(a => {
                        OBJITEM.PIC[a[0]] = new Image();
                        OBJITEM.PIC[a[0]].src = svgaddcode + a[1];
                    });
                    OBJITEM.SetPos();
                }
                if (a === "snail.json") {
                    Object.entries(data).map(a => {
                        USER.PIC[a[0]] = new Image();
                        USER.PIC[a[0]].src = svgaddcode + a[1];
                    });
                    USER.SetPos();
                }
                counter();
            }, function (xhr) { console.error(xhr); });
        });
    }
    function loadComplete() {
        Canvas.init();
        SipuViewer.intervalId = setInterval(function () {
            CanvasLoop(Canvas);
        }, 1000 / SipuViewer.init.fps);
    }
    SipuViewer.main = function () {
        var files = ["bgobj.json", "itemobj.json", "data.json", "snail.json"];
        LoadData(files);
    };
    return SipuViewer;
})(window.SipuViewer || {});
SipuViewer.main();
