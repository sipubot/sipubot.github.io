var SIPUCOMMON = (function (SIPUCOMMON, $, undefined) {
    "use strict";
    //util here
    var VERIFY = {
        OnlyChar: function (obj) {
            obj = obj.replace(/[^(가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9)]/gi, "");
            return obj;
        },
        OutSpecial: function (obj) {
            obj = obj.replace(/[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi, ""); // 특수문자 제거
            return obj;
        },
        OnlyNumber: function (obj) {
            obj = obj.replace(/[^\d\.]/g, "");
            return obj;
        },
        RemoveQuot: function (obj) {
            obj = obj.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
            return obj;
        },
        RemoveJQ: function (obj) {
            obj = obj.replace(".", "").replace("#", "");
            return obj;
        },
        UrlLinker: function (obj) {
            var urlRegex = /(https?:\/\/[^\s]+)/g;
            return obj.replace(urlRegex, function (url) {
                return '<a href="' + url + '" target="_blank">&#128279</a>';
            });
        },
        Length: function (obj) {
            return typeof (obj) === "string" && obj.length > 3;
        }
    };

    var DATANODES = {
        init: function () {
            var node = document.getElementsByTagName("*");
            var datatag = "data-node";
            var attrValue = "None";
            var tag = "";
            for (var i = 0; i < node.length; i++) {
                if (node[i].hasAttribute(datatag) || node[i].getAttribute(datatag) !== null) {
                    if (node[i].getAttribute(datatag).length < 1) return;
                    attrValue = node[i].getAttribute(datatag);
                    if (attrValue.indexOf('-') < 1) {
                        console.log('data node Error');
                        console.log(node[i]);
                        return;
                    }
                    attrValue = attrValue.split("-");
                    if (!DATANODES[attrValue[0]]) {
                        DATANODES[attrValue[0]] = {};
                    }
                    DATANODES[attrValue[0]][attrValue[1]] = node[i];
                }
            }
        },
        log: function () {
            console.log(this);
        }
    };
    //노드맵은 초기 생성필요
    DATANODES.init();
    //DATANODES.log();

    var RS_DATA = {};

    function RQ_WK(obj) {
        var BASE_URL = obj.BASE_URL || "https://sipu.iptime.org";
        var ADD_URL = obj.ADD_URL || "";
        var rqMethod = obj.rqMethod || "POST";
        var rqContentType = obj.rqContentType || "application/json";
        var rsContentType = obj.rsContentType || "json";
        var rqData = obj.rqData === undefined ? "" : typeof (obj.rqData) === "function" ? obj.rqData() : obj.rqData;
        var rsData = "";
        var rsFunc = obj.rsFunc || function (re) {
            console.log(re);
        };
        //ajax
        var rqURL = BASE_URL + ADD_URL;
        var rqHEADER = new Headers();
        rqHEADER.append("Content-Type", rqContentType);
        var rqBody = JSON.stringify(rqData);
        var rqInit = {
            method: rqMethod,
            headers: rqHEADER,
            credentials: 'include',
            mode: 'cors',
            cache: 'default'
        };
        if (rqMethod !== "GET") {
            rqInit.body = rqBody;
        }
        fetch(rqURL, rqInit)
            .then(response => {
                if (!response.ok) {
                    console.log("request fail");
                    console.log(rqData, response.text());
                    return;
                } else if (rqMethod === "POST") {
                    response.json().then(data => {
                        rsFunc([rqData, data]);
                    });
                } else if (rsContentType === "blob") {
                    response.blob().then((data) => {
                        rsData = data;
                        rsFunc(rsData);
                    });
                } else if (rsContentType === "json") {
                    response.json().then((data) => {
                        rsData = data;
                        rsFunc(rsData);
                    });
                } else if (rsContentType === "text") {
                    response.text().then((data) => {
                        rsData = data;
                        rsFunc(rsData);
                    });
                }
            })
            .catch(function (error) {
                console.log(rqData);
                console.log(obj);
                console.log('There has been a problem with your fetch operation: ' + error.message);
            });
    }

    var UI_WK = {
        isHTML: function (obj) {
            try {
                //Using W3 DOM2 (works for FF, Opera and Chrome)
                if (obj instanceof HTMLElement) {
                    return true;
                }
                console.log("not a elements");
            } catch (e) {
                console.log(e);
            }
            return false;
        },
        setNodeValue: function (obj, format, data, reset) {
            try {
                if (!UI_WK.isHTML(obj)) return;
                if (reset) {
                    obj.innerHTML = "";
                }
                var sethtml = "";
                if (typeof (data) !== "object" && !Array.isArray(data)) {
                    data = [];
                }
                if (!Array.isArray(data)) {
                    data = [data];
                }
                sethtml = data.reduce((st, item) => {
                    var t = "";
                    if (UI_WK.isHTML(format)) {
                        t = format.cloneNode(true).innerHTML;
                    } else {
                        t = format;
                    }
                    Object.entries(item).map(a => {
                        t = t.replace(`{${a[0]}}`, a[1]);
                    });
                    return st + t;
                }, "");
                obj.innerHTML += sethtml;
            } catch (e) {
                console.log(obj, format, data, reset, e);
            }
        },
        getNodeValue: function (obj) {
            if (!UI_WK.isHTML(obj)) return;
            if (obj.tagName == "INPUT" || obj.tagName == "TEXTAREA") {
                return obj.value;
            }
            if (obj.tagName == "SELECT") {
                return obj[obj.selectedIndex].value;
            }
            console.log("some thing Wrong");
            return false;
        },
        setEvent: function (obj, func) {
            if (!UI_WK.isHTML(obj) || typeof (func) !== "function") return;
            if(typeof window.ontouchstart === 'undefined'){
                obj.addEventListener("click", func, false);
            } else{
                obj.addEventListener("touchstart", func, false);
            }            
        },
        preventDoubleClick : function (obj) {
            if (!UI_WK.isHTML(obj)) return;
            obj.setAttribute("disabled", "true");
            var set = window.setTimeout(() => {
                obj.removeAttribute("disable");
                window.clearTimeout(set);
            }, 2000);
        }
    }
    var JOB_WK = {
        LOGIN: {
            //BASE_URL = "https://sipu.iptime.org",
            ADD_URL: "/login",
            //rqMethod : "POST",
            rqData: function () {
                return {
                    "email": DATANODES.LOGIN.getemail.value,
                    "password": CryptoJS.SHA3(DATANODES.LOGIN.getpassword.value, {
                        outputLength: 512
                    }).toString()
                }
            },
            rsFunc: (data) => {
                //remove modal
                if (data[1].result && data[1].result === "SUCCESS") {
                    $('#login-modal').modal('toggle');
                }
            },
            doOnload: false,
            init: () => {
                UI_WK.setEvent(DATANODES.LOGIN.summit, () => {
                    RQ_WK(JOB_WK.LOGIN);
                });
            }
        },
        LOGOUT: {
            //BASE_URL = "https://sipu.iptime.org",
            ADD_URL: "/logout",
            rqMethod: "GET",
            rqData : "",
            rsFunc: () => {
                //log_out effect
            },
            doOnload: false,
            init: () => {
                UI_WK.setEvent(DATANODES.LOGOUT.summit, () => {
                    //UI_WK.preventDoubleClick(DATANODES.LOGIN.summit);
                    RQ_WK(JOB_WK.LOGOUT);
                });
            }
        },
        QUTSET: {
            //BASE_URL = "https://sipu.iptime.org",
            ADD_URL: "/qut",
            rqMethod: "POST",
            rqData: function () {
                return {
                    message: UI_WK.getNodeValue(DATANODES.QUT.sendmessage)
                };
            },
            //rsData : "",
            rsFunc: function (data) {
                DATANODES.QUT.sendmessage.value = "";
                var str = DATANODES.QUT.sendmessage;
                var len = str.length < 10 ? 1 : str.length * 0.1;
                len = Math.floor(len);
                str = chunkString(str, len);
                var s = str.map(c => `<span>${c}</span>`).join('');
                DATANODES.QUT.setul.innerHTML += `<li class="list-group-item"><h4>${s}</h4></li>`;
            },
            doOnload: false,
            init: () => {
                UI_WK.setEvent(DATANODES.QUT.summit, () => {
                    RQ_WK(JOB_WK.QUTSET);
                });
            }
        },
        QUTGET: {
            //BASE_URL = "https://sipu.iptime.org",
            ADD_URL: "/qut",
            rqMethod: "GET",
            //rqData : 
            rsFunc: function (data) {
                DATANODES.QUT.sendmessage.value = "";
                data.map(a => {
                    var str = a["message"];
                    var len = str.length < 10 ? 1 : str.length * 0.1;
                    len = Math.floor(len);
                    str = chunkString(str, len);
                    var s = str.map(c => `<span>${c}</span>`).join('');
                    DATANODES.QUT.setul.innerHTML += `<li class="list-group-item"><h4>${s}</h4></li>`;
                });
            },
            doOnload: true,
            init: () => {
                RQ_WK(JOB_WK.QUTGET);
            }
        },
        LINK: {
            BASE_URL: "/data/link.json",
            //ADD_URL: "/data/link.json",
            rqMethod: "GET",
            //rqData :function (data) {}
            rsFunc: function (data) {
                var obj = DATANODES.LINK.setul
                var format = DATANODES.LINK.template;
                UI_WK.setNodeValue(obj, format, data, true);
            },
            doOnload: true,
            init: () => {
                RQ_WK(JOB_WK.LINK);
            }
        },
        APP: {
            BASE_URL: "/data/app.json",
            //ADD_URL: "",
            rqMethod: "GET",
            //rqData :function (data) {}
            rsFunc: function (data) {
                var obj = DATANODES.APP.setul
                var format = DATANODES.APP.template;
                UI_WK.setNodeValue(obj, format, data, true);
            },
            doOnload: true,
            init: () => {
                RQ_WK(JOB_WK.APP);
            }
        },
        STAT: {
            BASE_URL: "/data/persondata.json",
            //ADD_URL: "/stat",
            rqMethod: "GET",
            //rqData :function (data) {}
            rsFunc: function (data) {
                var pdata = statdata(data);
                var obj = DATANODES.STAT.ul;
                var format = DATANODES.STAT.template;
                UI_WK.setNodeValue(obj, format, pdata, true);
            }, 
            doOnload: false,
            init: () => {
                RQ_WK(JOB_WK.STAT);
            }
        }
    }

    function initWK() {
        Object.entries(JOB_WK).map(a => {
            if (a.doOnload) {
                RQ_WK(a[1]);
                return;
            }
            a[1].init();
        });
    }

    function chunkString(str, length) {
        if (length === 1) {
            return str.split('');
        }
        return str.match(new RegExp('.{1,' + length + '}', 'g'));
    }

    function life() {
        var sheep = 0;
        var timenode = $('P[data-custom="LiveTime"]')[0];
        var posinode = $('SPAN[data-custom="LiveOn"]')[0];
        var posipic = $('IMG[data-custom="LiveOn"]')[0];
        var startval = 1089658152;
        var func = function () {
            var now = new Date();
            var addval = now - new Date("2015-01-01");
            var nowHour = (now.getUTCHours() + 9) % 24;
            var nowWeek = now.getDay();
            timenode.innerHTML = startval + Math.floor(addval / 1000);
            posinode.innerHTML = getPlace(nowHour, nowWeek);
            getPic(nowHour, nowWeek);
        };
        setInterval(func, 1000);

        function getPlace(h, w) {
            if (0 < w && 5 >= w) {
                switch (true) {
                    case (7 > h):
                        sheep++;
                        return sheep + " sheep... zzZ";
                    case (18 > h && 7 <= h):
                        sheep = 0;
                        return "Mining Coin";
                    case (18 <= h && 21 > h):
                        return "Exercise";
                    case (21 <= h):
                        return "FreeTime on Week!";
                    default:
                }
            } else {
                switch (true) {
                    case (7 > h):
                        sheep++;
                        return sheep + " sheep... zzZ";
                    case (7 <= h):
                        sheep = 0;
                        return "Weekend Plan!";
                    default:
                }
            }
        }

        var switchpic = "";
        function setPic(url) {
           if (switchpic !== url) {
               switchpic = url;
               posipic.src = switchpic;
           }
        }
        
        function getPic(h, w) {
            if (0 < w && 5 >= w) {
                switch (true) {
                    case (7 > h):
                        setPic("https://66.media.tumblr.com/ee854a927539883c110a228f0fc96052/tumblr_pq26l3Z8aP1s8funmo1_250.jpg");
                        break;
                    case (18 > h && 7 <= h):
                        setPic("https://66.media.tumblr.com/1a877c0362c3101deb313f932bc204f5/tumblr_o5vx68YC6F1s8funmo1_250.jpg");
                        break;
                    case (18 <= h && 21 > h):
                        setPic("https://66.media.tumblr.com/d9c2052ac2d584f3224f28ba059ef9fa/tumblr_moqr0uiQmy1s8funmo1_250.jpg");
                        break;
                    case (21 <= h):
                        setPic("https://66.media.tumblr.com/b7aafe176884b49659af62347d1e4571/tumblr_pskw2aOJMP1s8funmo1_250.jpg");
                        break;
                    default:
                }
            } else {
                switch (true) {
                    case (7 > h):
                        setPic("https://66.media.tumblr.com/93cc981d20d0f95ab0587f339f7156e4/tumblr_pqgwxrwscL1s8funmo1_250.jpg");
                        break;
                    case (7 <= h):
                        setPic("https://66.media.tumblr.com/ee854a927539883c110a228f0fc96052/tumblr_pq26l3Z8aP1s8funmo1_250.jpg");
                        break;
                    default:
                }
            }
        }
    }

    function statdata(data) {
        var IMG_ = ["icon/sipu_sad.png","icon/sipu_nom.png","icon/sipu_hap.png"];
        var COLOR_ = ["orange","grey","yellowgreen"];
        var point_w = [50, 30, 20];
        var b_w = point_w.map((a,i)=>{
            if (data[data.length - i - 1].wa_point - data[data.length - i - 2].wa_point >= 20) {
                return a;
            } else {
                return 0;
            }
        }).reduce((s,a)=>s+a,0);
        var prop_w = {
            image : IMG_[Math.round(b_w / 53)],
            imoji : "💻",
            color : COLOR_[Math.round(b_w / 53)]
        }
        var prop_p = {
            image : IMG_[Math.round(+data[data.length-1].pa_point / 53)],
            imoji : "🎭",
            color : COLOR_[Math.round(+data[data.length-1].pa_point / 53)]
        }
        var prop_g = {
            image : IMG_[1],
            imoji : "🏃",
            color : COLOR_[1]
        }
        return [prop_w,prop_p,prop_g];
    }

    SIPUCOMMON.run = function () {
        initWK();
        life();
        //Snail.start();
    };
    return SIPUCOMMON;
})(window.SIPUCOMMON || {}, jQuery);
SIPUCOMMON.run();
