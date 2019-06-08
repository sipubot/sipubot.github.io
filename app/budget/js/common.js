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
                    return;
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
                } else if (rsContentType === "blob") {
                    response.blob().then((data) => {
                        rsData = data;
                        DATA[obj.id] = rsData;
                        rsFunc(rsData);
                    });
                } else if (rsContentType === "json") {
                    response.json().then((data) => {
                        rsData = data;
                        DATA[obj.id] = rsData;
                        rsFunc(rsData);
                    });
                } else if (rsContentType === "text") {
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
        n.setNode = NODES.TBODY.StatTable[0];
        n.RqADD_URL = "/budget/stat/account/0000"
        n.setPushType = "SET";
        n.nodeDataSet = function (data) {
            DATA.data = data;
            n.setNode.innerHTML = "";
            data.map(item => {
                $(n.setNode).append(`<TR>
                <td>${DATA.AccountHash[item.account_id]}</td>
                <td>${item.amount}</td>
                </TR>`);
            });
        }
        n.RqMethod = "GET"
        n.RequestBodyGetter = n.nodeDataGet;
        n.triggerfunc = n.fetch;
        n.binder();
        n.fetch();
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
        $("SELECT[data-node='NewType']").change(function () {
            if ($("SELECT[data-node='NewType'] option:selected").val() === "false") {
                $("SELECT[data-node='NewCategoryEx']").show();
                $("SELECT[data-node='NewCategoryIn']").hide();
            } else {
                $("SELECT[data-node='NewCategoryEx']").hide();
                $("SELECT[data-node='NewCategoryIn']").show();
            }
        });
    }

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

    SIPUCOMMON.delRow = {
        setPage: function (node) {
            $(node).parent().parent().remove();
        },
        dataPage: function (node) {
            DATA.delData = +$(node).val();
            DATA.datadeleter.fetch();
            $(node).parent().parent().remove();
        }

    }

    SIPUCOMMON.run = function () {
        initWORKER();
        initCal();
        setPageButton();
    };
    return SIPUCOMMON;
})(window.SIPUCOMMON || {}, jQuery);
SIPUCOMMON.run();