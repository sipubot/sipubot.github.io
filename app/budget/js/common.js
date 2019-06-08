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
    Workers.getcateacc = function () {

    }
    //pub ttype: bool,
    //pub show: bool,
    //pub id: String,
    //pub name: String,
    //

    //pub id: String,
    //pub name: String,
    //Workers.accountset = function () {
    //    var n = FETCHER();
//
    //}

    Workers.dataget = function () {
        var n = new FETCHER();
        n.triggerNode = NODES.BUTTON.DataSearch[0];
        n.getNode = NODES.INPUT.DatePick[0];
        n.nodeDataGet = function () {
            if (n.getNode.value.length > 0) {
                n.RqADD_URL = "/budget/data/" + (n.getNode.value).slice(0, 7);
            }
        };
        n.setNode = NODES.TBODY.DataTable[0];
        n.setPushType = "ADD";
        n.setHTML = "";
        n.RqMethod = "GET"
        n.RequestBodyGetter = n.nodeDataGet;
        n.setHTML = ``
        n.triggerfunc = n.fetch;
        n.binder();
    }

    //    pub seq: u64,
    //    pub date: String,
    //    pub ttype: bool,
    //    pub category_id: String,
    //    pub account_id: String,
    //    pub amount: f64,


    Workers.dataset = function () {
        var n = new FETCHER();
        n.triggerNode = NODES.BUTTON.NewData[0];
        n.getNode = NODES.INPUT.NewAmount[0];
        n.nodeDataGet = function () {
            if (n.getNode.value.length > 0) {
                n.RqADD_URL = "/budget/data/" + (n.getNode.value).slice(0, 7);
            }
        };
        n.setNode = NODES.TBODY.DataTable[0];
        n.setPushType = "ADD";
        n.setHTML = "";
        n.RqMethod = "GET"
        n.RequestBodyGetter = n.nodeDataGet;
        n.setHTML = ``
        n.triggerfunc = n.fetch;
        n.binder();
    }

    function initCal() {
        var fp = flatpickr(".date-picker", {
            dateFormat: "Y-m-d",
            defaultDate: ["today"]
        });
    }

    function setPageButton() {
        var tempAccount = `<tr><td><input type="text" class="form-control" placeholder="code" value="0001"></td><td><input type="text" class="form-control" placeholder="Name" value="신한"></td><td><button data-node="AccountDel" type="button" class="btn btn-secondary">삭제</button></td></tr>`;
        var tempCategory = `<tr><td><input type="checkbox" checked></td><select class="custom-select"><option value="false" selected>지출</option><option value="true">수입</option></select></td><td><input type="text" class="form-control" placeholder="code" value="0001"></td><td><input type="text" class="form-control" placeholder="Name" value="이체"></td><td><button data-node="CategoryDel" type="button" class="btn btn-secondary">삭제</button></td></tr>`;
        $("BUTTON[data-node='CategoryNew']").click(function(){
            $("TBODY[data-node='CategoryTable']").append(tempCategory);
        });
        $("BUTTON[data-node='AccountNew']").click(function (){
            $("TBODY[data-node='AccountTable']").append(tempAccount);
        });
        $("BUTTON[data-node='AccountDel']").click(function (){
            $(this).parent().parent().remove();
        });
        $("BUTTON[data-node='CategoryDel']").click(function (){
            $(this).parent().parent().remove();
        });
    }

    SIPUCOMMON.run = function () {
        Workerrunner();
        initCal();
        setPageButton();
    };
    return SIPUCOMMON;
})(window.SIPUCOMMON || {}, jQuery);
SIPUCOMMON.run();