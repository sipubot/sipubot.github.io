var SIPUCOMMON = (function (SIPUCOMMON, $, undefined) {
    "use strict";
    google.charts.load("current", {
        packages: ["corechart", "bar"]
    });
    google.charts.setOnLoadCallback(SIPUCOMMON.drawGraph);
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
                console.log("not a elements", obj);
            } catch (e) {
                console.log(e);
            }
            return false;
        },
        setNodeValue: function (obj, format, data, reset) {
            try {
                if (!UI_WK.isHTML(obj)) {
                    console.log(obj, format, data, reset);
                    return;
                }
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
        CATEGORYADD: {
            doOnload: false,
            init: () => {
                var evobj = DATANODES.CATEGORY.add;
                var obj = DATANODES.CATEGORY.settbody
                var format = DATANODES.CATEGORY.template;
                UI_WK.setEvent(evobj, () => {
                    var dummy = [{
                        id: "",
                        name: "",
                        calorie:0
                    }];
                    UI_WK.setNodeValue(obj, format, dummy, false);
                });
            }
        },
        CATEGORYSET: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/diet/category",
            //rqMethod: "POST",
            rqData: function () {
                var data = [];
                $(DATANODES.CATEGORY.settbody).find("TR").each((i, tr) => {
                    var a = {};
                    a.ttype = $(tr).find("SELECT[data-node='CATEGORY-ttype'] option:selected").val() === "false" ? false : true;
                    a.id = $(tr).find("INPUT[data-node='CATEGORY-id']").val();
                    a.name = $(tr).find("INPUT[data-node='CATEGORY-name']").val();
                    a.calorie = +$(tr).find("INPUT[data-node='CATEGORY-cal']").val();
                    data.push(a);
                });
                return data;
            },
            rsFunc : function (data) {
                RQ_WK(JOB_WK.CATEGORYGET);
            },
            doOnload: false,
            init: () => {
                UI_WK.setEvent(DATANODES.CATEGORY.submit, () => {
                    RQ_WK(JOB_WK.CATEGORYSET);
                });
            }
        },
        CATEGORYGET: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/diet/category",
            rqMethod: "GET",
            //rqData :function () {},
            rsFunc: function (data) {
                var obj = DATANODES.CATEGORY.settbody;
                var format = DATANODES.CATEGORY.template;
                var data1 = data.map(item => {
                    item.show = item.show ? "checked" : "";
                    item.ttypefalse = !item.ttype ? "selected" : "";
                    item.ttypetrue = item.ttype ? "selected" : "";
                    return item;
                });
                UI_WK.setNodeValue(obj, format, data1, true);
                var obj2 = DATANODES.DATANEW.category_food;
                var obj3 = DATANODES.DATANEW.category_gym;
                var format2 = DATANODES.DATANEW.template_category;
                var data2 = data.filter(a => a.ttype === true).map(a => {
                    a.select = "";
                    return a;
                });
                var data3 = data.filter(a => a.ttype === false).map(a => {
                    a.select = "";
                    return a;
                });
                if (data2.length > 0 && data3.length > 0) {
                    data2[0].select = "selected";
                    data3[0].select = "selected";
                }
                UI_WK.setNodeValue(obj2, format2, data2, true);
                UI_WK.setNodeValue(obj3, format2, data3, true);
                RS_DATA.CATEGORYHASH = {};
                data.map(a => {
                    RS_DATA.CATEGORYHASH[a.id] = [a.ttype, a.name, a.calorie];
                });
            },
            doOnload: false,
            init: () => {
                RQ_WK(JOB_WK.CATEGORYGET);
            }
        },
        DATANEW: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/diet/foodgym/insert",
            rqMethod: "POST",
            rqData: function () {
                var a = {};
                a.seq = 0;
                a.date = UI_WK.getNodeValue(DATANODES.DATANEW.date);
                a.ttype = UI_WK.getNodeValue(DATANODES.DATANEW.ttype) === "false" ? false : true;
                a.category_id = a.ttype ? UI_WK.getNodeValue(DATANODES.DATANEW.category_food) : UI_WK.getNodeValue(DATANODES.DATANEW.category_gym);
                a.amount = +UI_WK.getNodeValue(DATANODES.DATANEW.amount);
                return a;
            },
            rsFunc: function (data) {
                DATANODES.DATAGET.date.value = UI_WK.getNodeValue(DATANODES.DATANEW.date);
                RQ_WK(JOB_WK.DATAGET);
            },
            doOnload: false,
            init: () => {
                UI_WK.setEvent(DATANODES.DATANEW.submit, () => {
                    RQ_WK(JOB_WK.DATANEW);
                });
            }
        },
        WEIGHTNEW: {
            //BASE_URL: "/data/app.json",
            ADD_URL: "/diet/weight/ins",
            rqMethod: "POST",
            rqData: function () {
                var a = {};
                a.date = UI_WK.getNodeValue(DATANODES.WEIGHT.date);
                a.weight = +(UI_WK.getNodeValue(DATANODES.WEIGHT.amount));
                a.base_cal = 0;
                a.gain_cal = 0;
                a.loss_cal = 0;
                return a;
            },
            rsFunc: function (data) {
                JOB_WK.WEIGHTGET.ADD_URL = "day";
                RQ_WK(JOB_WK.WEIGHTGET);
            },
            doOnload: false,
            init: () => {
                UI_WK.setEvent(DATANODES.WEIGHT.submit, () => {
                    RQ_WK(JOB_WK.WEIGHTNEW);
                });
            }
        },
        DATAGET: {
            BASE_URL: "https://sipu.iptime.org/diet/foodgym/",
            ADD_URL: "",
            rqMethod: "GET",
            //rqData :function () {},
            //setHTML: ``,
            setPushType: "SET",
            //rsData : "",
            rsFunc: function (data) {
                RS_DATA.DATA = JSON.parse(JSON.stringify(data));
                var obj1 = DATANODES.DATAGET.tbody_food;
                var obj2 = DATANODES.DATAGET.tbody_gym;
                var format = DATANODES.DATAGET.template_foodgym;
                data = data.sort((a, b) => a.date < b.date);
                console.log(data, RS_DATA.CATEGORYHASH);
                var data1 = data.filter(a => RS_DATA.CATEGORYHASH[a.category_id][0] === true).map(a => {
                    a.category_name = RS_DATA.CATEGORYHASH[a.category_id][1];
                    return a;
                });
                var data2 = data.filter(a => RS_DATA.CATEGORYHASH[a.category_id][0] === false).map(a => {
                    a.category_name = RS_DATA.CATEGORYHASH[a.category_id][1];
                    return a;
                });
                UI_WK.setNodeValue(obj1, format, data1, true);
                UI_WK.setNodeValue(obj2, format, data2, true);
            },
            doOnload: false,
            init: () => {
                UI_WK.setEvent(DATANODES.DATAGET.submit, () => {
                    JOB_WK.DATAGET.ADD_URL = UI_WK.getNodeValue(DATANODES.DATAGET.date).slice(0, 7);
                    RQ_WK(JOB_WK.DATAGET);
                    JOB_WK.WEIGHTGET.ADD_URL = "day";
                    RQ_WK(JOB_WK.WEIGHTGET);
                });
            }
        },
        WEIGHTGET: {
            BASE_URL: "https://sipu.iptime.org/diet/weight/",
            ADD_URL: "",
            rqMethod: "GET",
            //rqData :function () {},
            //setHTML: ``,
            setPushType: "SET",
            //rsData : "",
            rsFunc: function (data) {
                RS_DATA.DATA = JSON.parse(JSON.stringify(data));
                var obj = DATANODES.DATAGET.tbody_weight;
                var format = DATANODES.DATAGET.template_weight;
                data = data.sort((a, b) => a.date < b.date);
                UI_WK.setNodeValue(obj, format, data, true);
            },
            doOnload: false,
            init: () => {}
        },
        CHARTGET: {
            BASE_URL: "https://sipu.iptime.org/diet/weight/",
            ADD_URL: "",
            rqMethod: "GET",
            //rqData :function () {},
            rsFunc: function (data) {
                //drawsumchart
                var obj = DATANODES.CHART.weight;
                var obj2 = DATANODES.CHART.calorie;
                data = dataChart(data);
                if (JOB_WK.CHARTGET.ADD_URL === "day") {
                    var data2 = dataDayChart(data);
                    SIPUCOMMON.drawGraph(obj2, "BarChart", data2);
                } 
                SIPUCOMMON.drawGraph(obj, "BarChart", data);
            },
            doOnload: false,
            init: () => {
                UI_WK.setEvent(DATANODES.CHARTGET.submit_day, () => {
                    JOB_WK.CHARTGET.ADD_URL = "day";
                    RQ_WK(JOB_WK.CHARTGET);
                });
                UI_WK.setEvent(DATANODES.CHARTGET.submit_month, () => {
                    JOB_WK.CHARTGET.ADD_URL = "month";
                    RQ_WK(JOB_WK.CHARTGET);
                });
                UI_WK.setEvent(DATANODES.CHARTGET.submit_year, () => {
                    JOB_WK.CHARTGET.ADD_URL = "year";
                    RQ_WK(JOB_WK.CHARTGET);
                });
            }
        },
        MODALNEW: {
            doOnload: false,
            init: () => {
                $(DATANODES.DATANEW.ttype).change(function () {
                    if (UI_WK.getNodeValue(DATANODES.DATANEW.ttype) === "false") {
                        $(DATANODES.DATANEW.category_gym).show();
                        $(DATANODES.DATANEW.category_food).hide();
                    } else {
                        $(DATANODES.DATANEW.category_gym).hide();
                        $(DATANODES.DATANEW.category_food).show();
                    }
                });
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

    function dataDayChart (data) {
        var hd = ["DATE","GAIN","LOSS","SUM"];
        data = data.sort((a,b)=> a.date < b.date);
        var d = data.map(a=>{
            var t = [
                a.date,
                a.gain_cal,
                a.loss_cal + a.base_cal,
                a.gain_cal - (a.loss_cal + a.base_cal)
            ];
            return t;
        });
        console.log([hd].concat(d));
        return [hd].concat(d);
    }

    function dataChart (data) {
        var hd = ["DATE", "WEIGHT"];
        data = data.sort((a,b)=> a.date < b.date);
        var d = data.map(a=>{
            var t = [
                a.date,
                a.weight
            ];
            return t;
        });
        console.log([hd].concat(d));
        return [hd].concat(d);
    }

    SIPUCOMMON.drawGraph = function (node, chartKind, data) {
        var graphdata = data;
        var Paramdata = google.visualization.arrayToDataTable(graphdata);
        var options, chart;
        if (chartKind === "BarChart") {
            options = {
                title: "",
                hAxis: {
                    minValue: 0
                },
                chartArea: {
                    top: 20,
                    width: "70%"
                }
            };
            chart = new google.visualization.BarChart(node);
        }
        if (chartKind === "BarChartStacked") {
            options = {
                title: "",
                chartArea: {
                    top: 20,
                    width: "70%"
                },
                isStacked: true
            };
            chart = new google.visualization.BarChart(node);
        }
        if (chartKind === "PieChart") {
            options = {
                title: "",
                chartArea: {
                    top: 20,
                    width: "95%",
                    height: "95%"
                }
            }
            chart = new google.visualization.PieChart(node);
        }
        if (options === undefined) return;
        chart.draw(Paramdata, options);
        if (chartKind === "BarChartStacked") {
            google.visualization.events.addListener(chart, 'select', function (a) {
                console.log(a);
                console.log(this);
            });
        }
    }

    SIPUCOMMON.delRow = {
        setPage: function (node) {
            $(node).parent().parent().remove();
        },
        dataPage: function (node) {
            var delobj = {
                //BASE_URL: "/data/app.json",
                ADD_URL: "/diet/foodgym/delete",
                rqMethod: "POST",
                rqData: function () {
                    return RS_DATA.DATA.filter(a => a.seq == $(node).val())[0];
                },
                //rsFunc: () => {},
                doOnload: false,
                init: () => {}
            }
            console.log(RS_DATA);
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
    };
    return SIPUCOMMON;
})(window.SIPUCOMMON || {}, jQuery);
SIPUCOMMON.run();