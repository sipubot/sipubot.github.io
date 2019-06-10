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
                    }
                    if (!DATANODES[attrValue[0]]) {
                        DATANODES[attrValue[0]] = {};
                        DATANODES[attrValue[0]][attrValue[1]] = node[i];
                    }
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
                    response.blob().then(data => {
                        rsFunc([rqData, data]);
                    });
                    response.json().then(data => {
                        rsFunc([rqData, data]);
                    });
                    response.text().then(data => {
                        rsFunc([rqData, data]);
                    });
                } else if (rsContentType === "blob") {
                    response.blob().then((data) => {
                        rsData = data;
                        RS_DATA[obj.id] = rsData;
                        rsFunc(rsData);
                    });
                } else if (rsContentType === "json") {
                    response.json().then((data) => {
                        rsData = data;
                        RS_DATA[obj.id] = rsData;
                        rsFunc(rsData);
                    });
                } else if (rsContentType === "text") {
                    response.text().then((data) => {
                        rsData = data;
                        RS_DATA[obj.id] = rsData;
                        rsFunc(rsData);
                    });
                }
            })
            .catch(function (error) {
                console.log(rqData);
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
            if (!UI_WK.isHTML(obj)) return;
            if (reset) {
                obj.innerHTML = "";
            }
            var sethtml = "";
            if (typeof (data) !== "object" && !Array.isArray(data)) {
                console.log(data);
                data = [];
            }
            if (!Array.isArray(data)) {
                data = [data];
            }
            sethtml = data.reduce((st, item) => {
                var t = format;
                if (UI_WK.isHTML(format)) {
                    t = format.cloneNode(true).innerHTML;
                }
                return st + Object.entries(item).map(a => {
                    t = t.replace(`{${a[0]}}`, a[1]);
                    return t;
                });
            }, "");
            obj.innerHTML += sethtml;
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
        ACCOUNTADD: {
            doOnload: false,
            init: () => {
                var evobj = DATANODES.ACCOUNT.add;
                var obj = DATANODES.ACCOUNT.settbody
                var format = DATANODES.ACCOUNT.template;
                UI_WK.setEvent(evobj, UI_WK.setNodeValue(obj, format, [], false));
            }
        },
        ACCOUNTSET: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/account",
            //rqMethod: "POST",
            rqData: function () {
                var data = [];
                $(DATANODES.ACCOUNT.settbody).find("TR").each((i, tr) => {
                    var a = {};
                    a.id = $(tr).find("INPUT[data-node='ACCOUNT-id']").val();
                    a.name = $(tr).find("INPUT[data-node='ACCOUNT-name']").val();
                    data.push(a);
                });
                return data;
            },
            //rsFunc : function (data) {},
            doOnload: false,
            init: () => {
                UI_WK.setEvent(DATANODES.ACCOUNT.summit, RQ_WK(JOB_WK.ACCOUNTSET));
                RQ_WK(JOB_WK.ACCOUNTGET);
            }
        },
        ACCOUNTGET: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/data/account",
            rqMethod: "GET",
            //rqData :function () {},
            rsFunc: function (data) {
                var obj = DATANODES.ACCOUNT.settbody;
                var format = DATANODES.ACCOUNT.template;
                UI_WK(obj, format, data, true);
                //modal select defalut
                var data2 = data.map(a => {
                    a.select = ""
                    return a;
                });
                if (data[0]) {
                    data[0].select == "selected";
                }
                var obj2 = DATANODES.ACCOUNT.selectnew;
                var format2 = DATANODES.ACCOUNT.templatenew;
                UI_WK.setNodeValue(obj2, format2, data2, true);
                var obj3 = DATANODES.ACCOUNT.account_from;
                UI_WK.setNodeValue(obj3, format2, data2, true);
                var obj4 = DATANODES.ACCOUNT.account_to;
                UI_WK.setNodeValue(obj4, format2, data2, true);
                RS_DATA.ACCOUNTHASH = {}
                data.map(a => {
                    RS_DATA.ACCOUNTHASH[a.id] = a.name;
                });
            },
            //rsFunc : function (data) {},
            doOnload: true,
            init: () => {
                RQ_WK(JOB_WK.ACCOUNTGET);
            }
        },
        CATEGORYADD: {
            doOnload: false,
            init: () => {
                var evobj = DATANODES.CATEGORY.add;
                var obj = DATANODES.CATEGORY.settbody
                var format = DATANODES.CATEGORY.template;
                UI_WK.setEvent(evobj, UI_WK.setNodeValue(obj, format, [], false));
            }
        },
        CATEGORYSET: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/category",
            //rqMethod: "POST",
            rqData: function () {
                var data = [];
                $(DATANODES.CATEGORY.settbody).find("TR").each((i, tr) => {
                    var a = {};
                    a.show = $(tr).find("INPUT[data-node='CATEGORY-show']").is(":checked");
                    a.ttype = $(tr).find("SELECT[data-node='CATEGORY-ttype'] option:selected").val() === "false" ? false : true;
                    a.id = $(tr).find("INPUT[data-node='CATEGORY-id']").val();
                    a.name = $(tr).find("INPUT[data-node='CATEGORY-name']").val();
                    data.push(a);
                });
                return data;
            },
            //rsFunc : function (data) {},
            doOnload: false,
            init: () => {
                UI_WK.setEvent(DATANODES.CATEGORY.submit, RQ_WK(JOB_WK.CATEGORYSET));
                RQ_WK(JOB_WK.CATEGORYGET);
            }
        },
        CATEGORYGET: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/data/category",
            rqMethod: "GET",
            //rqData :function () {},
            rsFunc: function (data) {
                var obj = DATANODES.CATEGORY.settbody;
                var format = DATANODES.CATEGORY.template;
                var data1 = data.map(item => {
                    item.show = item.show ? "checked" : "";
                    item.ttypefalse = !item.ttype ? "selected" : "";
                    item.ttypetrue = item.ttype ? "selected" : "";
                });
                UI_WK.setNodeValue(obj, format, data1, true);
                var obj2 = DATANODES.CATEGORY.select_expense;
                var obj3 = DATANODES.CATEGORY.select_income;
                var format2 = DATANODES.CATEGORY.templatenew;
                var data2 = data.filter(a => a.ttype === false).map(a => {
                    a.select = "";
                    return a;
                });
                var data3 = data.filter(a => a.ttype === true).map(a => {
                    a.select = "";
                    return a;
                });
                if (data2.length > 0 && data3.length > 0) {
                    data2[0].select = "selected";
                    data3[0].select = "selected";
                }
                UI_WK.setNodeValue(obj2, format2, data2, true);
                UI_WK.setNodeValue(obj3, format2, data3, true);
                DATANODES.CATEGORYHASH = {};
                data.map(a => {
                    DATANODES.CATEGORYHASH[a.id] = [a.ttype, a.name];
                });
            },
            doOnload: false,
            init: () => {
                RQ_WK(JOB_WK.CATEGORYGET);
            }
        },
        DATANEW: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/data/insert",
            rqMethod: "POST",
            rqData: function () {
                var a = {};
                a.seq = 0;
                a.date = UI_WK.getNodeValue(DATANODES.DATANEW.date);
                a.ttype = UI_WK.getNodeValue(DATANODES.DATANEW.ttype) === "false" ? false : true;
                a.category_id = a.ttype ? UI_WK.getNodeValue(DATANODES.DATANEW.select_income) : UI_WK.getNodeValue(DATANODES.DATANEW.select_expense);
                a.account_id = UI_WK.getNodeValue(DATANODES.DATANEW.selectnew);
                a.amount = +UI_WK.getNodeValue(DATANODES.DATANEW.amount);
                return a;
            },
            rsFunc: function (data) {
                JOB_WK.DATAGET.date.value = UI_WK.getNodeValue(DATANODES.DATANEW.date);
                RQ_WK(JOB_WK.DATAGET);
            },
            doOnload: false,
            init: () => {
                UI_WK.setEvent(DATANODES.DATANEW.submit, RQ_WK(JOB_WK.DATANEW));
            }
        },
        TRANSFROM: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/data/insert",
            rqMethod: "POST",
            rqData: function () {
                var a = {};
                a.seq = 0;
                a.date = UI_WK.getNodeValue(DATANODES.DATATRANS.date);
                a.ttype = false;
                a.category_id = "0000";
                a.account_id = UI_WK.getNodeValue(DATANODES.TRANS.account_from);
                a.amount = UI_WK.getNodeValue(DATATRANS.TRANS.amount);
                return a;
            },
            rsFunc: function (data) {
                RQ_WK(JOB_WK.DATATRANSTO);
            },
            doOnload: false,
            init: () => {
                UI_WK.setEvent(DATANODES.TRANS.submit, RQ_WK(JOB_WK.TRANSFROM));
            }
        },
        TRANSTO: {
            initSKIP: true,
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/data/insert",
            rqMethod: "POST",
            //rqContentType : "application/json",
            //rsContentType : "json",
            rqData: function () {
                var a = {};
                a.seq = 0;
                a.date = UI_WK.getNodeValue(DATANODES.DATATRANS.date);
                a.ttype = true;
                a.category_id = "5000";
                a.account_id = UI_WK.getNodeValue(DATANODES.TRANS.account_to);
                a.amount = UI_WK.getNodeValue(DATATRANS.TRANS.amount);
                return a;
            },
            //rsFunc : function (data) {},
            doOnload: false,
            init: () => {
                UI_WK.setEvent(DATANODES.TRANS.submit, RQ_WK(JOB_WK.TRANSFROM));
            }
        },
        DATAGET: {
            BASE_URL: "https://sipu.iptime.org/budget/data/",
            ADD_URL: "",
            rqMethod: "GET",
            //rqData :function () {},
            //setHTML: ``,
            setPushType: "SET",
            //rsData : "",
            rsFunc: function (data) {
                var obj1 = DATANODES.DATAGET.tbody_in;
                var obj2 = DATANODES.DATAGET.tbody_ex;
                var format = DATANODES.DATAGET.template;
                data = data.sort((a, b) => a.date < b.date);
                var data1 = data.filter(a => a.ttype === true).map(a => {
                    a.category_id = RS_DATA.CATEGORYHASH[a.account_id];
                    a.account_id = RS_DATA.ACCOUNTHASH[a.account_id];
                    return a;
                });
                var data2 = data.filter(a => a.ttype === true).map(a => {
                    a.category_id = RS_DATA.CATEGORYHASH[a.account_id];
                    a.account_id = RS_DATA.ACCOUNTHASH[a.account_id];
                    return a;
                });
                UI_WK.setNodeValue(obj1, format, data1, true);
                UI_WK.setNodeValue(obj2, format, data2, true);
            },
            doOnload: false,
            init: () => {
                function getdata() {
                    JOB_WK.DATAGET.ADD_URL = UI_WK.getNodeValue(DATANODES.DATAGET.date).slice(0, 7);
                    RQ_WK(JOB_WK.DATAGET);
                }
                UI_WK.setEvent(DATANODES.DATAGET.submit, getdata);
            }
        },
        STATGET: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/stat/account/0000",
            rqMethod: "GET",
            //rqData :function () {},
            rsFunc: function (data) {
                var obj = DATANODES.STATGET.tbody;
                var format = DATANODES.STATGET.template;
                data = data.map(a => {
                    a.account_id = RS_DATA.ACCOUNTHASH[a.account_id];
                });
                UI_WK.setNodeValue(obj, format, data, true);
            },
            doOnload: false,
            init: () => {
                UI_WK.setEvent(DATANODES.STATGET.submit, RQ_WK(JOB_WK.STATGET));
            }
        },
        CHARTGET: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/budget/stat/category/",
            rqMethod: "GET",
            //rqData :function () {},
            rsFunc: function (data) {
                //drawchart
                console.log(data);
            },
            doOnload: false,
            init: () => {
                var monthGet = DATANODES.CHARTGET.submit_month;
                var yearGet = DATANODES.CHARTGET.submit_year;
                UI_WK.setEvent(DATANODES.CHARTGET.submit_month, UI_WK.getNodeValue(monthGet).slice(0, 7));
                UI_WK.setEvent(DATANODES.CHARTGET.submit_year, UI_WK.getNodeValue(yearGet).slice(0, 4));
            }
        },
        MODALNEW: {
            doOnload: false,
            init: () => {
                $(DATANODES.DATANEW.ttype).change(function () {
                    if (UI_WK.getNodeValue(DATANODES.DATANEW.ttype) === "false") {
                        $(DATANODES.CATEGORY.select_expense).show();
                        $(DATANODES.CATEGORY.select_income).hide();
                    } else {
                        $(DATANODES.CATEGORY.select_expense).hide();
                        $(DATANODES.CATEGORY.select_income).show();
                    }
                });
                var monthGet = DATANODES.CHARTGET.submit_month;
                var yearGet = DATANODES.CHARTGET.submit_year;
                UI_WK.setEvent(DATANODES.CHARTGET.submit_month, UI_WK.getNodeValue(monthGet).slice(0, 7));
                UI_WK.setEvent(DATANODES.CHARTGET.submit_year, UI_WK.getNodeValue(yearGet).slice(0, 4));
            }
        },
        SETPAGE: {
            doOnload: false,
            init: () => {
                var acct = DATANODES.SET.account_button;
                var cate = DATANODES.SET.category_button;
                UI_WK.setEvent(acct, function () {
                    $('TABLE[data-node="account-table"]').show();
                    $('TABLE[data-node="category-table"]').hide();
                });
                UI_WK.setEvent(cate, function () {
                    $('TABLE[data-node="account-table"]').hide();
                    $('TABLE[data-node="category-table"]').show();
                });
            }
        }
    }

    function initWK() {
        Object.entries(JOB_WK).map(a => {
            if (a.doOnload) {
                WORKER(a[1]);
                return;
            }
            a.init();
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
                rqData: function () {
                    return DATA.data.filter(a => a.seq == $(node).val())[0];
                },
                //rsFunc: () => {},
                doOnload: false,
                init: () => {
                }
            }
            RQ_WK(delobj);
            $(node).parent().parent().remove();
        }
    }

    SIPUCOMMON.run = function () {
        //달력 대체 하기
        $(".date-picker").each(function (i, node) {
            $(node).val(new Date().toISOString().slice(0, 10));
        });
        initWK();
        life();
    };
    return SIPUCOMMON;
})(window.SIPUCOMMON || {}, jQuery);
SIPUCOMMON.run();