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
    //NODES.log();

    var DATA = {};
    DATA.AccountHash = {};
    DATA.CategoryHash = {};
    DATA.data = [];
    DATA.delData = -1;

    function WORKER(obj) {
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
        ACCOUNTSET: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/account",
            rqMethod: "POST",
            //rqContentType : "application/json",
            //rsContentType : "json",
            rqData :function () {
                var data = [];
                $(NODES.ACCOUNTSET.SET.tbody).find("TR").each((i, tr) => {
                    var a = {};
                    a.id = $(tr).find("INPUT[data-node='ACCOUNTSET-GET-id']").val();
                    a.name = $(tr).find("INPUT[data-node='ACCOUNTSET-GET-name']").val();
                    data.push(a);
                });
                return data;
            },
            setHTML: ``,
            setPushType : "ADD",
            //rsData : "",
            //rsFunc : function (data) {},
            id: "ACCOUNTSET"
        },
        CATEGORYSET: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/category",
            rqMethod: "POST",
            //rqContentType : "application/json",
            //rsContentType : "json",
            rqData :function () {
                var data = []; console.log(NODES.CATEGORYSET.SET.tbody);
                $(NODES.CATEGORYSET.SET.tbody).find("TR").each((i, tr) => {
                    var a = {};
                    a.show = $(tr).find("INPUT[data-node='CATEGORYSET-GET-show']").is(":checked");
                    a.ttype = $(tr).find("SELECT[data-node='CATEGORYSET-GET-ttype'] option:selected").val() === "false" ? false : true;
                    a.id = $(tr).find("INPUT[data-node='CATEGORYSET-GET-id']").val();
                    a.name = $(tr).find("INPUT[data-node='CATEGORYSET-GET-name']").val();
                    data.push(a);
                });
                return data;
            },
            setHTML: ``,
            setPushType : "ADD.",
            //rsData : "",
            rsFunc : function (data) {
                
            },
            id: "CATEGORYSET"
        },
        ACCOUNTGET: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/data/account",
            rqMethod: "GET",
            //rqContentType : "application/json",
            //rsContentType : "json",
            //rqData :function () {},
            //setHTML: ``,
            //setPushType : "SET",
            //rsData : "",
            rsFunc : function (data) {
                NODES.ACCOUNTSET.SET.tbody.innerHTML = "";
                NODES.ACCOUNTSET.SET.tbody.innerHTML += data.map(item => {
                    var t = `<tr>
                        <td><input data-node="ACCOUNTSET-GET-id" type="text" class="form-control" placeholder="code" value="${item.id}"></td>
                        <td><input data-node="ACCOUNTSET-GET-name" type="text" class="form-control" placeholder="Name" value="${item.name}"></td>
                        <td><button data-node="AccountDel" type="button" class="btn btn-secondary" onclick="javascript:SIPUCOMMON.delRow.setPage(this);">삭제</button></td>
                    </tr>`;
                    return t;
                }).join('');
                $('SELECT[data-node="DATANEW-GET-account_id"]').html(data.map((item, i) => `<option value="${item.id}" ${i===0?"selected":""}>${item.name}</option>`).join(''));
                $('SELECT[data-node="DATATRANS-GET-account_id_from"]').html(data.map((item, i) => `<option value="${item.id}" ${i===0?"selected":""}>${item.name}</option>`).join(''));
                $('SELECT[data-node="DATATRANS-GET-account_id_to"]').html(data.map((item, i) => `<option value="${item.id}" ${i===0?"selected":""}>${item.name}</option>`).join(''));
                data.map(a => {
                    DATA.AccountHash[a.id] = a.name;
                });
            },
            id: "ACCOUNTGET"
        },
        CATEGORYGET: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/data/category",
            rqMethod: "GET",
            //rqContentType : "application/json",
            //rsContentType : "json",
            //rqData :function () {},
            //setHTML: ``,
            //setPushType : "SET",
            //rsData : "",
            rsFunc : function (data) {
                NODES.CATEGORYSET.SET.tbody.innerHTML = "";
                NODES.CATEGORYSET.SET.tbody.innerHTML += data.map(item => {
                    var t = `<tr>
                    <td><input data-node="CATEGORYSET-GET-show" type="checkbox" ${item.show?"checked":""}></td>
                    <td><select data-node="CATEGORYSET-GET-ttype" class="custom-select">
                            <option value="false" ${item.ttype?"":"selected"}>지출</option>
                            <option value="true" ${!item.ttype?"":"selected"}>수입</option>
                        </select></td>
                    <td><input data-node="CATEGORYSET-GET-id" type="text" class="form-control" placeholder="code" value="${item.id}"></td>
                    <td><input data-node="CATEGORYSET-GET-name" type="text" class="form-control" placeholder="Name" value="${item.name}"></td>
                    <td><button data-node="CategoryDel" type="button" class="btn btn-secondary" onclick="javascript:SIPUCOMMON.delRow.setPage(this);">삭제</button></td>
                    </tr>`;
                    return t;
                }).join('');
                $('SELECT[data-node="DATANEW-GET-category_id_ex"]').html(data.filter(a => !a.ttype).map((item, i) => `<option value="${item.id}" ${i===0?"selected":""}>${item.name}</option>`).join(''));
                $('SELECT[data-node="DATANEW-GET-category_id_in"]').html(data.filter(a => a.ttype).map((item, i) => `<option value="${item.id}" ${i===0?"selected":""}>${item.name}</option>`).join(''));
                data.map(a => {
                    DATA.CategoryHash[a.id] = [a.ttype, a.name];
                });
            },
            id: "CATEGORYGET"
        },
        DATANEW: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/data/insert",
            rqMethod: "POST",
            //rqContentType : "application/json",
            //rsContentType : "json",
            rqData :function () {
                var a = {};
                a.seq = 0;
                a.date = $("INPUT[data-node='DATANEW-GET-date']").val();
                a.ttype = $("SELECT[data-node='DATANEW-GET-ttype'] option:selected").val() === "false" ? false : true;
                a.category_id = a.ttype ? $("SELECT[data-node='DATANEW-GET-category_id_in'] option:selected").val() : $("SELECT[data-node='DATANEW-GET-category_id_ex'] option:selected").val();
                a.account_id = $("SELECT[data-node='DATANEW-GET-account_id'] option:selected").val();
                a.amount = +$("INPUT[data-node='DATANEW-GET-amount']").val();
                return a;
            },
            //setHTML: ``,
            setPushType : "ADD",
            //rsData : "",
            rsFunc : function (data) {
                $(NODES.DATAGET.EVT.button).click();
            },
            id: "DATANEW"
        },
        DATATRANSFROM: {
            initSKIP : true,
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/data/insert",
            rqMethod: "POST",
            //rqContentType : "application/json",
            //rsContentType : "json",
            rqData :function () {
                var a = {};
                a.seq = 0;
                a.date = $("INPUT[data-node='DATATRANS-GET-date']").val();
                a.ttype = false;
                a.category_id = "0000";
                a.account_id = $("SELECT[data-node='DATATRANS-GET-account_id_from'] option:selected").val();
                a.amount = +$("INPUT[data-node='DATATRANS-GET-amount']").val();
                return a;
            },
            //setHTML: ``,
            setPushType : "ADD",
            //rsData : "",
            rsFunc : function (data) {
                WORKER(FEEDER.DATATRANSTO);
            },
            id: "DATATRANSFROM"
        },
        DATATRANSTO: {
            initSKIP : true,
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/data/insert",
            rqMethod: "POST",
            //rqContentType : "application/json",
            //rsContentType : "json",
            rqData :function () {
                var a = {};
                a.seq = 0;
                a.date = $("INPUT[data-node='DATATRANS-GET-date']").val();
                a.ttype = true;
                a.category_id = "5000";
                a.account_id = $("SELECT[data-node='DATATRANS-GET-account_id_to'] option:selected").val();
                a.amount = +$("INPUT[data-node='DATATRANS-GET-amount']").val();
                return a;
            },
            //setHTML: ``,
            setPushType : "ADD",
            //rsData : "",
            rsFunc : function (data) {
                $(NODES.DATAGET.EVT.button).click();
            },
            id: "DATATRANSTO"
        },
        DATAGET: {
            BASE_URL: "https://sipu.iptime.org/budget/data/",
            ADD_URL: "",
            rqMethod: "GET",
            //rqContentType : "application/json",
            //rsContentType : "json",
            //rqData :function () {},
            //setHTML: ``,
            setPushType : "SET",
            //rsData : "",
            rsFunc : function (data) {
                $("TBODY[data-node='DATAGET-SET-tbody_ex']").html("");
                $("TBODY[data-node='DATAGET-SET-tbody_in']").html("");
                DATA.data = data;
                data = data.sort((a,b)=>a.date<b.date);
                var node;
                data.map(item => {
                    if (!item.ttype) {
                        node = $("TBODY[data-node='DATAGET-SET-tbody_ex']");
                    } else {
                        node = $("TBODY[data-node='DATAGET-SET-tbody_in']");
                    }
                    $(node).append(`<TR>
                    <td>${item.date}</td>
                    <td>${DATA.AccountHash[item.account_id]}</td>
                    <td>${DATA.CategoryHash[item.category_id][1]}</td>
                    <td>${item.amount}</td>
                    <th scope="row"><button value="${item.seq}" type="button" class="btn btn-secondary" onclick="javascript:SIPUCOMMON.delRow.dataPage(this);">-</button></th>
                    </TR>`);
                });
            },
            id: "DATAGET"
        },
        STATGET: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/stat/account/0000",
            rqMethod: "GET",
            //rqContentType : "application/json",
            //rsContentType : "json",
            //rqData :function () {},
            //setHTML: ``,
            setPushType : "SET",
            //rsData : "",
            rsFunc : function (data) {
                $("TBODY[data-node='STATGET-SET-tbody']").html("");
                data.map(item => {
                    $("TBODY[data-node='STATGET-SET-tbody']").append(`<TR>
                    <td>${DATA.AccountHash[item.account_id]}</td>
                    <td>${item.amount}</td>
                    </TR>`);
                });
            },
            id: "STATGET"
        },
        CHARTGETMONTH: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/stat/category/"+ $('INPUT[data-node="CHARTGET-GET-date"]').val().slice(0,7),
            rqMethod: "GET",
            //rqContentType : "application/json",
            //rsContentType : "json",
            //rqData :function () {},
            //setHTML: ``,
            setPushType : "SET",
            //rsData : "",
            rsFunc : function (data) {
                console.log(data);
            },
            id: "CHARTGETMONTH"
        },
        CHARTGETYEAR: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/stat/category/"+ $('INPUT[data-node="CHARTGET-GET-date"]').val().slice(0,4),
            rqMethod: "GET",
            //rqContentType : "application/json",
            //rsContentType : "json",
            //rqData :function () {},
            //setHTML: ``,
            setPushType : "SET",
            //rsData : "",
            rsFunc : function (data) {
                console.log(data);
            },
            id: "CHARTGETYEAR"
        },
    }
/* 
    function initCal() {
        var fp = flatpickr(".date-picker", {
            dateFormat: "Y-m-d",
            defaultDate: ["today"]
        });
    }

 */  
 function setPageButton() {
        var tempAccount = `<tr>
        <td><input data-node="ACCOUNTSET-GET-id" type="text" class="form-control" placeholder="code" value="0001"></td>
        <td><input data-node="ACCOUNTSET-GET-name" type="text" class="form-control" placeholder="Name" value="신한"></td>
        <td><button data-node="AccountDel" type="button" class="btn btn-secondary" onclick="javascript:SIPUCOMMON.delRow.setPage(this);">삭제</button></td>
        </tr>`;
        var tempCategory = `<tr>
        <td><input data-node="CATEGORYSET-GET-show" type="checkbox" checked></td>
        <td><select data-node="CATEGORYSET-GET-ttype" class="custom-select">
                <option value="false" selected>지출</option>
                <option value="true">수입</option>
            </select></td>
        <td><input data-node="CATEGORYSET-GET-id" type="text" class="form-control" placeholder="code" value="0001"></td>
        <td><input data-node="CATEGORYSET-GET-name" type="text" class="form-control" placeholder="Name" value="이체"></td>
        <td><button data-node="CategoryDel" type="button" class="btn btn-secondary" onclick="javascript:SIPUCOMMON.delRow.setPage(this);">삭제</button></td>
        </tr>`;
        $("BUTTON[data-node='AccountNew']").click(function () {
            $("TBODY[data-node='ACCOUNTSET-SET-tbody']").append(tempAccount);
        });
        $("BUTTON[data-node='CategoryNew']").click(function () {
            $("TBODY[data-node='CATEGORYSET-SET-tbody']").append(tempCategory);
        });
        $("SELECT[data-node='DATANEW-GET-ttype']").change(function () {
            if ($("SELECT[data-node='DATANEW-GET-ttype'] option:selected").val() === "false") {
                $("SELECT[data-node='DATANEW-GET-category_id_ex']").show();
                $("SELECT[data-node='DATANEW-GET-category_id_in']").hide();
            } else {
                $("SELECT[data-node='DATANEW-GET-category_id_ex']").hide();
                $("SELECT[data-node='DATANEW-GET-category_id_in']").show();
            }
        });
        $("BUTTON[data-node='DATATRANS-EVT-button']").click(function () {
            WORKER(FEEDER.DATATRANSFROM);
        });
        $("BUTTON[data-node='DATAGET-EVT-button']").click(function () {
            FEEDER.DATAGET.ADD_URL = $('INPUT[data-node="DATAGET-GET-date"]').val().slice(0,7);
            WORKER(FEEDER.DATAGET);
        });
    }

    function initWORKER() {
        Object.entries(FEEDER).map(a => {
            if (a.initSKIP !== undefined && a.initSKIP === true) {
                return;
            }
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
                },false);
            });
        });
    }

    SIPUCOMMON.delRow = {
        setPage: function (node) {
            $(node).parent().parent().remove();
        },
        dataPage: function (node) {
            var delobj = {
                    //BASE_URL: "/data/app.json",
                    ADD_URL: "/budget/data/delete",
                    rqMethod: "POST",
                    //rqContentType : "application/json",
                    //rsContentType : "json",
                    rqData :function () {
                        return DATA.data.filter(a=>a.seq === $(node).val())[0];
                    },
                    //setHTML: ``,
                    setPushType : "SET",
                    //rsData : "",
                    rsFunc : function (data) {
                        console.log(data);
                    },
                    id: "DATADEL"
                }
            WORKER(delobj);
            $(node).parent().parent().remove();
        }
    }

    SIPUCOMMON.run = function () {
        initWORKER();
        //initCal();
        setPageButton();
    };
    return SIPUCOMMON;
})(window.SIPUCOMMON || {}, jQuery);
SIPUCOMMON.run();