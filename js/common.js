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
                        attrValue = node[i].getAttribute(datatag);
                    }
                    tag = node[i].tagName;
                    if (!NODES[tag]) {
                        NODES[tag] = {};
                    }
                    if (!NODES[tag][attrValue]) {
                        NODES[tag][attrValue] = [];
                    }
                    NODES[tag][attrValue].push(node[i]);
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

    function FETCHER() {
        this.RqBASE_URL = "https://sipu.iptime.org";
        this.RqADD_URL = "";
        this.RqADD_HEADER = {};
        this.RqMethod = "POST";
        this.RqContentType = "application/json";
        this.RsType = "json";

        this.triggerNode;
        this.getNode;
        this.setNode;
        this.getDataObj;
        this.getDataStr;
        this.setDataObj;
        this.setPushType = "SET"; // "ADD_"
        this.setHTML; // "{date}This is Dummy{amount}";
    }
    FETCHER.prototype.RequestBodyGetter = function () {};
    FETCHER.prototype.fetch = function () {
        var self = this;
        if (self.RqMethod === "GET" && self.getDataObj !== undefined) {
            return self.ResponseCallback(self.getDataObj);
        }
        self.RqHEADER = new Headers();
        self.RqHEADER.append("Content-Type", self.RqContentType);
        Object.entries(self.RqADD_HEADER).map(a => {
            self.RqHEADER.append(a[0], a[1]);
        });
        self.getDataObj = self.RequestBodyGetter();
        self.getDataStr = JSON.stringify(self.getDataObj);
        self.RqBody = self.getDataStr;
        self.Rqinit = {
            method: self.RqMethod,
            headers: self.RqHEADER,
            body: self.RqBody,
            credentials: 'include',
            mode: 'cors',
            cache: 'default'
        };
        self.RqURL = self.RqBASE_URL + self.RqADD_URL;
        fetch(self.RqURL, self.Rqinit)
            .then(response => {
                if (!response.ok) {
                    console.log("request fail");
                }
                if (self.RqMethod === "POST") {
                    response.text().then(data => {
                        console.log(data);
                        if (Array.isArray(self.getDataObj)) {
                            self.ResponseCallback(self.getDataObj);
                        } else {
                            self.ResponseCallback([self.getDataObj]);
                        }
                    });
                }
                if (self.RsType === "blob") {
                    response.blob().then((data) => {
                        self.setDataObj = data;
                        self.ResponseCallback(self.setDataObj);
                    });
                }
                if (self.RsType === "json") {
                    response.json().then((data) => {
                        self.setDataObj = data;
                        self.ResponseCallback(self.setDataObj);
                    });
                }
                if (self.RsType === "text") {
                    response.text().then((data) => {
                        self.setDataObj = data;
                        self.ResponseCallback(self.setDataObj);
                    });
                }
            })
            .catch(function (error) {
                console.log('There has been a problem with your fetch operation: ' + error.message);
            });
    };
    FETCHER.prototype.nodeDataGet = function () {
        var self = this;
        if (self.RqMethod === "GET") {
            return;
        }
        if (!isinsertNode(self.getNode)) {
            self.getDataObj = null;
            return self.getDataObj;
        }
        self.getDataObj = self.getNode.value || self.getNode.options[self.getNode.selectedIndex].value;
        self.getNode.value = "";
        return self.getDataObj;
    }
    FETCHER.prototype.nodeDataSet = function (data) {
        var self = this;
        self.setDataObj = data;
        if (self.setPushType === "SET") {
            self.setNode.innerHTML = "";
        }
        self.setNode.innerHTML += self.setDataObj.map(item => {
            var t = self.setHTML;
            Object.entries(item).map(a => {
                t = t.split(`{${a[0]}}`).join(a[1]);
            });
            return t;
        }).join('');
    }
    FETCHER.prototype.binder = function () {
        var self = this;
        self.triggerNode.addEventListener("keyup", (e) => {
            if (e.keyCode === 13) self.triggerfunc();
        }, false);
        self.triggerNode.addEventListener("click", (e) => {
            self.triggerfunc();
        }, false);
        self.triggerNode.addEventListener("touchstart", (e) => {
            self.triggerfunc();
        }, false);
    };
    FETCHER.prototype.ResponseCallback = function (data) {
        var self = this;
        self.nodeDataSet(data);
    }
    FETCHER.prototype.triggerfunc = function () {
        var self = this;
        self.fetch();
    };
    var Workers = {};

    function Workerrunner() {
        Object.entries(Workers).map(a => {
            a[1]();
        })
    }

    Workers.qutset = function () {
        var n = new FETCHER();
        n.triggerNode = NODES.BUTTON.Quot[0];
        n.getNode = NODES.INPUT.Quot[0];
        n.nodeDataGet = function () {
            return {
                "message": n.getNode.value
            };
        };
        n.setNode = NODES.UL.Quot[0];
        n.setPushType = "ADD";
        n.setHTML = "";
        n.RqADD_URL = "/qut"
        n.RqMethod = "POST"
        n.RequestBodyGetter = n.nodeDataGet;
        n.nodeDataSet = function (data) {
            n.getNode.value = "";
            data.map(a => {
                var str = a["message"];
                var len = str.length < 10 ? 1 : str.length * 0.1;
                len = Math.floor(len);
                str = chunkString(str, len);
                var s = str.map(c => `<span>${c}</span>`).join('');
                n.setNode.innerHTML += `<li class="list-group-item"><h4>${s}</h4></li>`;
            });
        };
        n.triggerfunc = n.fetch;
        n.binder();
    }

    Workers.qutget = function () {
        var n = new FETCHER();
        //n.triggerNode = NODES.BUTTON.Quot[0];
        //n.getNode = NODES.INPUT.Quot[0];
        //n.nodeDataGet = 
        n.setNode = NODES.UL.Quot[0];
        n.setPushType = "SET";
        n.setHTML = "";
        n.RqADD_URL = "/qut"
        n.RqMethod = "GET"
        n.RequestBodyGetter = () => {};
        n.nodeDataSet = function (data) {
            n.setNode.innerHTML = "";
            data.map(a => {
                var str = a["message"];
                var len = str.length < 10 ? 1 : str.length * 0.1;
                len = Math.floor(len);
                str = chunkString(str, len);
                var s = str.map(c => `<span>${c}</span>`).join('');
                n.setNode.innerHTML += `<li class="list-group-item"><h4>${s}</h4></li>`;
            });
        };
        //n.triggerfunc = n.fetch;
        //n.binder();
        n.fetch();
    }

    Workers.linkget = function () {
        var n = new FETCHER();
        n.RqBASE_URL = "/data/link.json";
        n.setNode = NODES.UL.Link[0];
        n.setPushType = "SET";
        n.setHTML = `<a href="{href}"><li class="Icon" style="background-image : url({imageurl})"><p>{picon}</p></li></a>`;
        n.RqMethod = "GET"
        n.fetch();
    }
    Workers.appget = function () {
        var n = new FETCHER();
        n.RqBASE_URL = "/data/app.json";
        n.setNode = NODES.UL.App[0];
        n.setPushType = "SET";
        n.setHTML = `<a href="{href}"><li class="Icon" style="background-image : url({imageurl})"><p>{picon}</p></li></a>`;
        n.RqMethod = "GET"
        n.fetch();
    }

    function chunkString(str, length) {
        if (length === 1) {
            return str.split('');
        }
        return str.match(new RegExp('.{1,' + length + '}', 'g'));
    }

    function life() {
        var sheep = 0;
        var sp = document.getElementById('lifetime');
        var sp2 = document.getElementById('lifeplace');
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

    var DATA = {
        MASTER_URL: "https://sipu.iptime.org/",
        IMOJI_LIST: ["status-sad.png", "status-nom.png", "status-hap.png"],
        IMOJI_BACK: ["#ef6f45", "#c0c0c0", "#94de59"]
    };

    function init() {}

    SIPUCOMMON.run = function () {
        Workerrunner();
        init();
    };
    return SIPUCOMMON;
})(window.SIPUCOMMON || {}, jQuery);
SIPUCOMMON.run();