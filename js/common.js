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
    DATANODES.log();

    var RS_DATA = {};

    function RQ_WK(obj) {
        var BASE_URL = obj.BASE_URL || "https://sipu.iptime.org";
        var ADD_URL = obj.ADD_URL || "";
        var rqMethod = obj.rqMethod || "POST";
        var rqContentType = obj.rqContentType || "application/json";
        var rsContentType = obj.rsContentType || "json";
        var rqData = typeof (obj.rqData) === "function" ? obj.rqData() : obj.rqData;
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
            obj.addEventListener("click", func, false);
            obj.addEventListener("touchstart", func, false);
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
            rsFunc: () => {
                //remove modal
            },
            doOnload: false,
            init: () => {
                UI_WK.setEvent(DATANODES.LOGIN.summit, () => {
                    RQ_WK(JOB_WK.LOGIN);
                    $('#login-modal').modal('toggle');
                });
            }
        },
        LOGOUT: {
            //BASE_URL = "https://sipu.iptime.org",
            ADD_URL: "/logout",
            rqMethod: "GET",
            //rqData : function () {}
            rsFunc: () => {
                //log_out effect
            },
            doOnload: false,
            init: () => {
                UI_WK.setEvent(DATANODES.LOGOUT.summit, () => {
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
            //BASE_URL: "/data/app.json",
            ADD_URL: "/stat",
            rqMethod: "GET",
            //rqData :function (data) {}
            rsFunc: function (data) {
                //var statDATA = {
                //    MASTER_URL: "https://sipu.iptime.org/",
                //    IMOJI_LIST: ["status-sad.png", "status-nom.png", "status-hap.png"],
                //    IMOJI_BACK: ["#ef6f45", "#c0c0c0", "#94de59"]
                //};
                //var obj = DATANODES.STAT.setul
                //var format = `<a href="{href}" target="_blank"><li class="Icon" style="background-image : url({imageurl})"><p>{picon}</p></li></a>`;
                //UI_WK.setNodeValue(obj, format, data, true);
            },
            doOnload: false,
            init: () => {
                //RQ_WK(JOB_WK.STAT);
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
            sp.html(startval + Math.floor(addval / 1000));
            sp2.html(getPlace(nowHour));
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

    SIPUCOMMON.run = function () {
        initWK();
        life();
    };
    return SIPUCOMMON;
})(window.SIPUCOMMON || {}, jQuery);
SIPUCOMMON.run();