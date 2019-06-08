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
        }
    };

    function isinsertNode(node) {
        return (node.tagName == "INPUT" || node.tagName == "SELECT" || node.tagName == "TEXTAREA")
    }

    var NODES = {
        init: function () {
            var node = document.getElementsByTagName("*");
            var datatag = "data-node";
            var attrValue = "None";
            var tag = "";
            for (var i = 0; i < node.length; i++) {
                if (node[i].hasAttribute(datatag) || node[i].getAttribute(datatag) !== null) {
                    if (node[i].getAttribute(datatag).length > 0) {
                        attrValue = node[i].getAttribute(datatag).split('-');
                        if (!NODES[attrValue[0]]) {
                            NODES[attrValue[0]] = {};
                            NODES[attrValue[0]]["GET"] = {};
                            NODES[attrValue[0]]["SET"] = {};
                            NODES[attrValue[0]]["EVT"] = {};
                        }
                    }
                    if (attrValue[1] === "GET") {
                        NODES[attrValue[0]]["GET"][attrValue[2]] = node[i];
                    }
                    if (attrValue[1] === "SET") {
                        NODES[attrValue[0]]["SET"][attrValue[2]] = node[i];
                    }
                    if (attrValue[1] === "EVT") {
                        NODES[attrValue[0]]["EVT"][attrValue[2]] = node[i];
                    }
                }
            }
        },
        log: function () {
            console.log(this);
        }
    };
    //노드맵은 초기 생성필요
    NODES.init();
    NODES.log();

    var DATA = {};

    function WORKER(obj) {
        console.log(obj);
        var BASE_URL = obj.BASE_URL || "https://sipu.iptime.org";
        var ADD_URL = obj.ADD_URL || "";
        var rqMethod = obj.rqMethod || "POST";
        var rqContentType = obj.rqContentType || "application/json";
        var rsContentType = obj.rsContentType || "json";
        var rqData = typeof(obj.rqData) === "function" ? obj.rqData() : getrqData(NODES[obj.id]);
        var setHTML = obj.setHTML || "";
        var setPushType = obj.setPushType || "SET"; // "ADD_"
        var rsData = "";
        var rsFunc = obj.rsFunc || setrsData;

        function getrqData(nodes) {
            if (nodes === undefined) {
                return;
            }
            nodes = nodes["GET"];
            if (rqMethod === "GET") {
                return;
            }
            var re = {};
            Object.entries(nodes).map(a => {
                if (a[1].tagName === "INPUT") {
                    re[a[0]] = $(a[1]).val();
                }
                if (a[1].tagName === "SELECT") {
                    re[a[0]] = $(a[1]).find(":selected").val();
                }
                if (a[1].tagName === "TEXTAREA") {
                    re[a[0]] = $(a[1]).val();
                }
            });
            return re;
        }

        function setrsData(data) {
            if (Object.entries(NODES[obj.id]["SET"]).length < 1 || setHTML == undefined) {
                return;
            }
            if (!Array.isArray(data)) {
                data = [data];
            }
            if (setPushType !== "ADD") {
                Object.entries(NODES[obj.id]["SET"]).map(a => {
                    a[1].innerHTML = "";
                });
            }
            data.map(item => {
                var t = setHTML;
                Object.entries(item).map(a => {
                    t = t.replace(`{${a[0]}}`, a[1]);
                });
                Object.entries(NODES[obj.id]["SET"]).map(a => {
                    a[1].innerHTML += t;
                });
            })
        };
        //ajax
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
        var rqURL = BASE_URL + ADD_URL;
        console.log(rqInit,rqURL);
        fetch(rqURL, rqInit)
            .then(response => {
                if (!response.ok) {
                    console.log("request fail");
                }
                if (rqMethod === "POST") {
                    response.text().then(data => {
                        console.log(data);
                        if (Array.isArray(rqData)) {
                            rsFunc(rqData);
                        } else {
                            rsFunc([rqData]);
                        }
                    });
                }
                if (rsContentType === "blob") {
                    response.blob().then((data) => {
                        rsData = data;
                        DATA[obj.id] = rsData;
                        rsFunc(rsData);
                    });
                }
                if (rsContentType === "json") {
                    response.json().then((data) => {
                        rsData = data;
                        DATA[obj.id] = rsData;
                        rsFunc(rsData);
                    });
                }
                if (rsContentType === "text") {
                    response.text().then((data) => {
                        rsData = data;
                        DATA[obj.id] = rsData;
                        rsFunc(rsData);
                    });
                }
            })
            .catch(function (error) {
                console.log('There has been a problem with your fetch operation: ' + error.message);
            });
    }

    var FEEDER = {
        LOGIN: {
            id: "LOGIN",
            //BASE_URL = "https://sipu.iptime.org",
            ADD_URL: "/login",
            //rqMethod : "POST",
            //rqContentType : "application/json",
            //rsContentType : "json",
            rqData: function () {
                return {
                    "email": NODES.LOGIN.GET.email.value,
                    "password": CryptoJS.SHA3(NODES.LOGIN.GET.password.value, {
                        outputLength: 512
                    }).toString()
                }
            },
            //setHTML : NODES[obj.id].setHTML,
            //setPushType : "SET",
            //rsData : "",
            //rsFunc : setrsData,
        },
        LOGOUT: {
            id: "LOGOUT",
            //BASE_URL = "https://sipu.iptime.org",
            ADD_URL: "/logout",
            rqMethod: "GET",
            //rqContentType : "application/json",
            //rsContentType : "json",
            //rqData :
            //setHTML : NODES[obj.id].setHTML,
            //setPushType : "SET",
            //rsData : "",
            //rsFunc : setrsData,
        },
        QUTSET: {
            id: "QUTSET",
            //BASE_URL = "https://sipu.iptime.org",
            ADD_URL: "/qut",
            rqMethod: "POST",
            //rqContentType : "application/json",
            //rsContentType : "json",
            //rqData :
            //setHTML : NODES[obj.id].setHTML,
            setPushType: "ADD",
            //rsData : "",
            rsFunc: function (data) {
                console.log(data);
                NODES.QUTSET.SET.message.value = "";
                data.map(a => {
                    var str = a["message"];
                    var len = str.length < 10 ? 1 : str.length * 0.1;
                    len = Math.floor(len);
                    str = chunkString(str, len);
                    var s = str.map(c => `<span>${c}</span>`).join('');
                    NODES.QUT.SET.ul += `<li class="list-group-item"><h4>${s}</h4></li>`;
                });
            }
        },
        QUTGET: {
            id: "QUTGET",
            //BASE_URL = "https://sipu.iptime.org",
            ADD_URL: "/qut",
            rqMethod: "GET",
            //rqContentType : "application/json",
            //rsContentType : "json",
            //rqData :
            //setHTML : NODES[obj.id].setHTML,
            //setPushType : "SET",
            //rsData : "",
            rsFunc: function (data) {
                NODES.QUTSET.GET.message.value = "";
                console.log(NODES.QUT);
                data.map(a => {
                    var str = a["message"];
                    var len = str.length < 10 ? 1 : str.length * 0.1;
                    len = Math.floor(len);
                    str = chunkString(str, len);
                    var s = str.map(c => `<span>${c}</span>`).join('');
                    NODES.QUT.SET.ul.innerHTML += `<li class="list-group-item"><h4>${s}</h4></li>`;
                });
            }
        },
        LINK: {
            id: "LINK",
            BASE_URL: "/data/link.json",
            //ADD_URL: "/data/link.json",
            rqMethod: "GET",
            //rqContentType : "application/json",
            //rsContentType : "json",
            //rqData :function (data) {}
            setHTML: `<a href="{href}"><li class="Icon" style="background-image : url({imageurl})"><p>{picon}</p></li></a>`
            //setPushType : "SET",
            //rsData : "",
            //rsFunc : function (data) {}
        },
        APP: {
            id: "APP",
            BASE_URL: "/data/app.json",
            //ADD_URL: "",
            rqMethod: "GET",
            //rqContentType : "application/json",
            //rsContentType : "json",
            //rqData :function (data) {}
            setHTML: `<a href="{href}"><li class="Icon" style="background-image : url({imageurl})"><p>{picon}</p></li></a>`
            //setPushType : "SET",
            //rsData : "",
            //rsFunc : function (data) {}
        }
    }

    function chunkString(str, length) {
        if (length === 1) {
            return str.split('');
        }
        return str.match(new RegExp('.{1,' + length + '}', 'g'));
    }

    function life() {
        var sheep = 0;
        var sp = $('P[data-custom="LiveTime"]');
        var sp2 = $('SPAN[data-custom="LiveOn"]');
        $('IMG[data-custom="LiveOn"]').src = getPic(new Date().getUTCHours());
        var startval = 1089658152;
        var func = function () {
            var addval = new Date() - new Date("2015-01-01");
            var nowHour = new Date().getUTCHours();
            if (nowHour > -1 && nowHour < 14) {
                nowHour = nowHour + 9;
            } else {
                nowHour = nowHour - 15;
            }
            sp.innerHTML = startval + Math.floor(addval / 1000);
            sp2.innerHTML = getPlace(nowHour);
        };

        function getPlace(h) {
            var weekNumber = (new Date()).getDay();
            if (0 < weekNumber && 5 >= weekNumber) {
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

        function getPic(h) {
            var weekNumber = (new Date()).getDay();
            if (0 < weekNumber && 5 >= weekNumber) {
                switch (true) {
                    case (7 > h):
                        return "https://66.media.tumblr.com/b7aafe176884b49659af62347d1e4571/tumblr_pskw2aOJMP1s8funmo1_250.jpg";
                    case (18 > h && 7 <= h):
                        return "https://66.media.tumblr.com/b7aafe176884b49659af62347d1e4571/tumblr_pskw2aOJMP1s8funmo1_250.jpg";
                    case (18 <= h && 21 > h):
                        return "https://66.media.tumblr.com/b7aafe176884b49659af62347d1e4571/tumblr_pskw2aOJMP1s8funmo1_250.jpg";
                    case (21 <= h):
                        return "https://66.media.tumblr.com/b7aafe176884b49659af62347d1e4571/tumblr_pskw2aOJMP1s8funmo1_250.jpg";
                    default:
                }
            } else {
                switch (true) {
                    case (7 > h):
                        return "https://66.media.tumblr.com/b7aafe176884b49659af62347d1e4571/tumblr_pskw2aOJMP1s8funmo1_250.jpg";
                    case (7 <= h):
                        return "https://66.media.tumblr.com/b7aafe176884b49659af62347d1e4571/tumblr_pskw2aOJMP1s8funmo1_250.jpg";
                    default:
                }
            }
        }
        setInterval(func, 1000);
    }

    function SetStat() {
        $.getJSON(DATA.MASTER_URL + "json/dataperson.json", Rfunc);

        function Rfunc(v) {
            var passpoint = 10;
            var wa = v.map(function (a) {
                return +a["WAdata"];
            }).slice(0, 7);
            var point = [50, 20, 10, 5, 3, 2];
            var rp = Array.apply(null, Array(6)).map(function (a, i) {
                return wa[i] - wa[i + 1] >= passpoint ? point[i] : 0;
            }).reduce(function (s, a) {
                return s + a;
            }, 0);
            var picidx = [Math.round((+v[0]["PAdata"]) / 53), Math.round((+v[0]["GAdata"]) / 53), Math.round(rp / 53)];
            var node = $(".Status > li");
            $.each(node, function (i, n) {
                $(n).css("background-image", "url(/icon/" + DATA.IMOJI_LIST[picidx[i]] + ")");
                $(n).css("background-color", DATA.IMOJI_BACK[picidx[i]]);
            });
        }
    }

    var statDATA = {
        MASTER_URL: "https://sipu.iptime.org/",
        IMOJI_LIST: ["status-sad.png", "status-nom.png", "status-hap.png"],
        IMOJI_BACK: ["#ef6f45", "#c0c0c0", "#94de59"]
    };

    function initWORKER() {
        Object.entries(FEEDER).map(a => {
            if (!NODES[a[0]]) {
                WORKER(a[1]);
                return;
            }
            var e = Object.entries(NODES[a[0]]["EVT"]);
            if (e.length === 0) {
                WORKER(a[1]);
                return;
            }
            e.map(n => {
                $(n[1]).click(function () {
                    WORKER(a[1]);
                });
            });
        });
    }

    SIPUCOMMON.run = function () {
        initWORKER();
        life();
    };
    return SIPUCOMMON;
})(window.SIPUCOMMON || {}, jQuery);
SIPUCOMMON.run();