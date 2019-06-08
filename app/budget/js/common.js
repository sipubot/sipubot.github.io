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
    FETCHER.prototype.RequestBodyGetter = function () {};
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

    var DATA = {};
    DATA.AccountHash = {};
    DATA.CategoryHash = {};
    DATA.data = [];
    DATA.delData = -1;

    Workers.accountset = function () {
        var n = new FETCHER();
        n.triggerNode = NODES.BUTTON.AccountSave[0];
        n.getNode = NODES.TBODY.AccountTable[0];
        n.nodeDataGet = function () {
            var data = [];
            $(n.getNode).find("TR").each((i, tr) => {
                var a = {};
                a.id = $(tr).find("INPUT[data-node='AccountId']").val();
                a.name = $(tr).find("INPUT[data-node='AccountName']").val();
                data.push(a);
            });
            n.getDataObj = data;
            return n.getDataObj;
        };
        n.setNode = NODES.TBODY.AccountTable[0];
        n.nodeDataSet = function (data) {
            var self = this;
            self.setDataObj = data;
            self.setNode.innerHTML = "";
            self.setNode.innerHTML += self.setDataObj.map(item => {
                var t = `<tr>
                    <td><input data-node="AccountId" type="text" class="form-control" placeholder="code" value="${item.id}"></td>
                    <td><input data-node="AccountName" type="text" class="form-control" placeholder="Name" value="${item.name}"></td>
                    <td><button data-node="AccountDel" type="button" class="btn btn-secondary" onclick="javascript:SIPUCOMMON.delRow.setPage(this);">삭제</button></td>
                </tr>`;
                return t;
            }).join('');
        }
        n.RqADD_URL = "/budget/account";
        n.setPushType = "SET";
        n.setHTML = "";
        n.RqMethod = "POST";
        n.RequestBodyGetter = n.nodeDataGet;
        n.triggerfunc = n.fetch;
        n.binder();
    }

    //pub ttype: bool,
    //pub show: bool,
    //pub id: String,
    //pub name: String,
    Workers.catergoryset = function () {
        var n = new FETCHER();
        n.triggerNode = NODES.BUTTON.CategorySave[0];
        n.getNode = NODES.TBODY.CategoryTable[0];
        n.nodeDataGet = function () {
            var data = [];
            $(n.getNode).find("TR").each((i, tr) => {
                var a = {};
                a.show = $(tr).find("INPUT[data-node='CategoryShow']").is(":checked");
                a.ttype = $(tr).find("SELECT[data-node='CategoryType'] option:selected").val() === "false" ? false : true;
                a.id = $(tr).find("INPUT[data-node='CategoryId']").val();
                a.name = $(tr).find("INPUT[data-node='CategoryName']").val();
                data.push(a);
            });
            n.getDataObj = data;
            return n.getDataObj;
        };
        n.setNode = NODES.TBODY.CategoryTable[0];
        n.nodeDataSet = function (data) {
            var self = this;
            self.setDataObj = data;
            self.setNode.innerHTML = "";
            self.setNode.innerHTML += self.setDataObj.map(item => {
                var t = `<tr>
                <td><input data-node="CategoryShow" type="checkbox" ${item.show?"checked":""}></td>
                <td><select data-node="CategoryType" class="custom-select">
                        <option value="false" ${item.ttype?"":"selected"}>지출</option>
                        <option value="true" ${!item.ttype?"":"selected"}>수입</option>
                    </select></td>
                <td><input data-node="CategoryId" type="text" class="form-control" placeholder="code" value="${item.id}"></td>
                <td><input data-node="CategoryName" type="text" class="form-control" placeholder="Name" value="${item.name}"></td>
                <td><button data-node="CategoryDel" type="button" class="btn btn-secondary" onclick="javascript:SIPUCOMMON.delRow.setPage(this);">삭제</button></td>
                </tr>`;
                return t;
            }).join('');
        }
        n.RqADD_URL = "/budget/category";
        n.setPushType = "SET";
        n.setHTML = "";
        n.RqMethod = "POST";
        n.RequestBodyGetter = n.nodeDataGet;
        n.triggerfunc = n.fetch;
        n.binder();
    }

    Workers.accountget = function () {
        var n = new FETCHER();
        n.triggerNode = NODES.BUTTON.AccountSave[0];
        n.getNode = NODES.TBODY.AccountTable[0];
        //n.nodeDataGet;
        n.setNode = NODES.TBODY.AccountTable[0];
        n.nodeDataSet = function (data) {
            var self = this;
            self.setDataObj = data;
            self.setNode.innerHTML = "";
            self.setNode.innerHTML += self.setDataObj.map(item => {
                var t = `<tr>
                    <td><input data-node="AccountId" type="text" class="form-control" placeholder="code" value="${item.id}"></td>
                    <td><input data-node="AccountName" type="text" class="form-control" placeholder="Name" value="${item.name}"></td>
                    <td><button data-node="AccountDel" type="button" class="btn btn-secondary" onclick="javascript:SIPUCOMMON.delRow.setPage(this);">삭제</button></td>
                </tr>`;
                return t;
            }).join('');
            $('SELECT[data-node="NewAccount"]').html(self.setDataObj.map((item, i) => `<option value="${item.id}" ${i===0?"selected":""}>${item.name}</option>`).join(''));
            self.setDataObj.map(a => {
                DATA.AccountHash[a.id] = a.name;
            });
        }
        n.RqADD_URL = "/budget/data/account";
        n.RqMethod = "GET";
        n.RequestBodyGetter = n.nodeDataGet;
        n.triggerfunc = n.fetch;
        n.fetch();
        //this.get = n.fetch();
    }

    Workers.categoryget = function () {
        var n = new FETCHER();
        n.getNode = NODES.TBODY.CategoryTable[0];
        n.setNode = NODES.TBODY.CategoryTable[0];
        n.nodeDataSet = function (data) {
            var self = this;
            self.setDataObj = data;
            self.setNode.innerHTML = "";
            self.setNode.innerHTML += self.setDataObj.map(item => {
                var t = `<tr>
                <td><input data-node="CategoryShow" type="checkbox" ${item.show?"checked":""}></td>
                <td><select data-node="CategoryType" class="custom-select">
                        <option value="false" ${item.ttype?"":"selected"}>지출</option>
                        <option value="true" ${!item.ttype?"":"selected"}>수입</option>
                    </select></td>
                <td><input data-node="CategoryId" type="text" class="form-control" placeholder="code" value="${item.id}"></td>
                <td><input data-node="CategoryName" type="text" class="form-control" placeholder="Name" value="${item.name}"></td>
                <td><button data-node="CategoryDel" type="button" class="btn btn-secondary" onclick="javascript:SIPUCOMMON.delRow.setPage(this);">삭제</button></td>
                </tr>`;
                return t;
            }).join('');
            $('SELECT[data-node="NewCategoryEx"]').html(self.setDataObj.filter(a => !a.ttype).map((item, i) => `<option value="${item.id}" ${i===0?"selected":""}>${item.name}</option>`).join(''));
            $('SELECT[data-node="NewCategoryIn"]').html(self.setDataObj.filter(a => a.ttype).map((item, i) => `<option value="${item.id}" ${i===0?"selected":""}>${item.name}</option>`).join(''));
            self.setDataObj.map(a => {
                DATA.CategoryHash[a.id] = [a.ttype, a.name];
            });
        }
        n.RqADD_URL = "/budget/data/category";
        n.setPushType = "SET";
        n.RqMethod = "GET";
        n.RequestBodyGetter = n.nodeDataGet;
        n.fetch();
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
            var self = this;
            var a = {};
            a.seq = 0;
            a.date = $("INPUT[data-node='NewDatePick']").val();
            a.ttype = $("SELECT[data-node='NewType'] option:selected").val() === "false" ? false : true;
            a.category_id = a.ttype ? $("SELECT[data-node='NewCategoryIn'] option:selected").val() : $("SELECT[data-node='NewCategoryEx'] option:selected").val();
            a.account_id = $("SELECT[data-node='NewAccount'] option:selected").val();
            a.amount = +$("INPUT[data-node='NewAmount']").val();
            self.getDataObj = a;
            return a;
        };
        n.nodeDataSet = function (data) {
            var self = this;
            if (!self.getDataObj.ttype) {
                self.setNode = $("INPUT[data-node='DataTableExpense']");
            } else {
                self.setNode = $("INPUT[data-node='DataTableIncome']");
            }
            $(self.setNode).append(`<TR>
            <td>${self.getDataObj.date}</td>
            <td>${DATA.AccountHash[self.getDataObj.account_id]}</td>
            <td>${DATA.CategoryHash[self.getDataObj.category_id]}</td>
            <td>${self.amount}</td>
            <th scope="row"><button type="button" class="btn btn-secondary" >-</button></th>
            </TR>`);
        }
        n.setPushType = "ADD";
        n.RqADD_URL = "/budget/data/insert";
        n.RqMethod = "POST";
        n.RequestBodyGetter = n.nodeDataGet;
        n.triggerfunc = n.fetch;
        n.binder();
    }

    //    pub seq: u64,
    //    pub date: String,
    //    pub ttype: bool,
    //    pub category_id: String,
    //    pub account_id: String,
    //    pub amount: f64,
    Workers.datadel = function () {
        var n = new FETCHER();
        n.triggerNode = NODES.BUTTON.NewData[0];
        n.getNode = NODES.INPUT.NewAmount[0];
        n.nodeDataGet = function () {
            return DATA.data.filter(a => a.seq === DATA.delData)[0];
        };
        n.setPushType = "ADD";
        n.RqADD_URL = "/budget/data/delete";
        n.RqMethod = "POST";
        n.RequestBodyGetter = n.nodeDataGet;
        n.triggerfunc = n.fetch;
        DATA.datadeleter = n;
    }

    Workers.dataget = function () {
        var n = new FETCHER();
        n.triggerNode = NODES.BUTTON.DataSearch[0];
        n.getNode = NODES.INPUT.DatePick[0];
        n.nodeDataGet = function () {
            if (n.getNode.value.length > 0) {
                n.RqADD_URL = "/budget/data/" + (n.getNode.value).slice(0, 7);
            }
        };
        n.setPushType = "ADD";
        n.setHTML = "";
        n.nodeDataSet = function (data) {
            $("TBODY[data-node='DataTableExpense']").html("");
            $("TBODY[data-node='DataTableIncome']").html("");
            DATA.data = data;
            data.map(item => {
                if (!item.ttype) {
                    self.setNode = $("TBODY[data-node='DataTableExpense']");
                } else {
                    self.setNode = $("TBODY[data-node='DataTableIncome']");
                }
                $(self.setNode).append(`<TR>
                <td>${item.date}</td>
                <td>${DATA.AccountHash[item.account_id]}</td>
                <td>${DATA.CategoryHash[item.category_id][1]}</td>
                <td>${item.amount}</td>
                <th scope="row"><button value="${item.seq}" type="button" class="btn btn-secondary" onclick="javascript:SIPUCOMMON.delRow.dataPage(this);">-</button></th>
                </TR>`);
            });
        }
        n.RqMethod = "GET"
        n.RequestBodyGetter = n.nodeDataGet;
        n.setHTML = ``
        n.triggerfunc = n.fetch;
        n.binder();
    }

    Workers.statget = function () {
        var n = new FETCHER();
        n.triggerNode = NODES.BUTTON.StatAll[0];
        n.getNode = NODES.INPUT.DatePick[1];
        n.setNode = NODES.INPUT.StatTable[1];
        n.RqADD_URL = "/budget/stat/account/0000"
        n.setPushType = "SET";
        n.nodeDataSet = function (data) {
            DATA.data = data;
            data.map(item => {
                $(self.setNode).append(`<TR>
                <td>${DATA.AccountHash[item.account_id]}</td>
                <td>${item.amount}</td>
                </TR>`);
            });
        }
        n.RqMethod = "GET"
        n.RequestBodyGetter = n.nodeDataGet;
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
        var tempAccount = `<tr>
        <td><input data-node="AccountId" type="text" class="form-control" placeholder="code" value="0001"></td>
        <td><input data-node="AccountName" type="text" class="form-control" placeholder="Name" value="신한"></td>
        <td><button data-node="AccountDel" type="button" class="btn btn-secondary" onclick="javascript:SIPUCOMMON.delRow.setPage(this);">삭제</button></td>
        </tr>`;
        var tempCategory = `<tr>
        <td><input data-node="CategoryShow" type="checkbox" checked></td>
        <td><select data-node="CategoryType" class="custom-select">
                <option value="false" selected>지출</option>
                <option value="true">수입</option>
            </select></td>
        <td><input data-node="CategoryId" type="text" class="form-control" placeholder="code" value="0001"></td>
        <td><input data-node="CategoryName" type="text" class="form-control" placeholder="Name" value="이체"></td>
        <td><button data-node="CategoryDel" type="button" class="btn btn-secondary" onclick="javascript:SIPUCOMMON.delRow.setPage(this);">삭제</button></td>
        </tr>`;
        $("BUTTON[data-node='AccountNew']").click(function () {
            $("TBODY[data-node='AccountTable']").append(tempAccount);
        });
        $("BUTTON[data-node='CategoryNew']").click(function () {
            $("TBODY[data-node='CategoryTable']").append(tempCategory);
        });
    }

    SIPUCOMMON.delRow = {
        setPage: function (node) {
            $(node).parent().parent().remove();
        },
        dataPage: function (node) {
            console.log(node);
            DATA.delData = +$(node).val();
            console.log(DATA.delData);
            DATA.datadeleter.fetch();
            console.log(DATA.datadeleter);
            $(node).parent().parent().remove();
        }

    }

    SIPUCOMMON.run = function () {
        Workerrunner();
        initCal();
        setPageButton();
    };
    return SIPUCOMMON;
})(window.SIPUCOMMON || {}, jQuery);
SIPUCOMMON.run();