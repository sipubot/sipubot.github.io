var SipuDiet = (function(SipuDiet, $, undefined) {
	//구글 차트 설정(필수)
	google.charts.load('current', {packages: ['corechart']});
	google.charts.setOnLoadCallback($(function(){SipuDiet.graphDraw}));
	
    var masterlink = "/Diet";
    var Param = {
        ajaxLink: {
            Food: masterlink + "/Select"
            ,Exec: masterlink + "/Select"
            ,Weight: masterlink + "/Select"
            ,Day: masterlink + "/Select"
            ,Month: masterlink + "/Select"
            ,FoodList: masterlink + "/Select"
            ,ExecList: masterlink + "/Select"
            ,SubmitFoodExec: masterlink + "/Update"
            ,SubmitWeight: masterlink + "/Update"
            ,DelFoodExec: masterlink + "/Delete"
            ,DelWeight: ""
        },
        ajaxVal: {
            Food: "LIST_FOOD"
            ,Exec: "LIST_EXEC"
            ,Weight: "LIST_WEIGHT"
            ,Day: "LIST_STATDAY"
            ,Month: "LIST_STATMONTH"
            ,FoodList: "LIST_CATEGORY"
            ,ExecList: "LIST_CATEGORY"
            ,FoodListVal: "FOOD"
            ,ExecListVal: "EXEC"
            ,SubmitFoodExec: "UPDATE_FOODEXEC"
            ,SubmitWeight: "UPDATE_WEIGHT"
            ,DelFoodExec: "DELETE_FOODEXEC"
            ,DelmitWeight: "DELETE_WEIGHT"
            ,SubmitFoodCategory: "UPDATE_CATEGORYFOOD"
            ,SubmitExecCategory: "UPDATE_CATEGORYEXEC"
        },
        TextVal: {
            SubmitFood: "음식"
            ,SubmitExec: "운동"
            ,GraphHeight: 900
        },
        Button: {
            FoodDelNodeClass: ".delete.button.food"
            ,FoodDelNodeClassName: "delete button food"
            ,ExecDelNodeClass: ".delete.button.exec"
            ,ExecDelNodeClassName: "delete button exec"
            ,WeigthDelNodeClass: ".delete.button.weight"
            ,WeigthDelNodeClassName: "delete button weight"
            ,FoodExecSelNodeClass: ".select.button.foodexec"
            ,FoodExecSelNodeClassName: "select button foodexec"
            ,FoodExecDelNodeClass: ".delete.button.foodexec"
            ,FoodExecDelNodeClassName: "delete button foodexec"
        }
    };
    var Nodes = {
        Div: {
            ModalFoodExec: "#modal-submit-foodexec"
            ,ModalWeight: "#modal-submit-weight"
            ,ModalCategory: "#modal-submit-category"
            ,TableHeadName: "table-head"
        },
        Button: {
            MainFood: "#button-food"
            ,MainWeight: "#button-weight"
            ,MainDay: "#button-day"
            ,MainMonth: "#button-month"
            ,SubFoodSearch: "#button-food-search"
            ,SubExecSearch: "#button-exec-search" //실제론 없지만 ajax를 위해 임의로 둔 변수
            ,SubWeightSearch: "#button-weight-search"
            ,SubmitFoodExec: "#button-submit-foodexec"
            ,SubmitFoodExecSearch: "#button-submit-foodexec-search"
            ,SubmitWeight: "#button-submit-weight"
            ,SubmitCategoryFood: "#button-submit-food-category"
            ,SubmitCategoryExec: "#button-submit-exec-category"
            ,cancel: ".cancel"
        },
		ButtonModal: {
            SubFoodFood: "#button-food-food"
            ,SubFoodExec: "#button-food-exec"
            ,SubWeightWeight: "#button-weight-weight"
            ,SubCategory: "#button-category"
		},
        Input: {
            SubFoodDay: "#food-datepicker"
            ,SubWeightDay: "#weight-datepicker"
            ,SubmitFoodExecDay: "#input-submit-foodexec-day"
            ,SubmitFoodExecSearch: "#input-submit-foodexec-search"
            ,SubmitWeight: "#input-submit-weight"
            ,SubmitWeightDay: "#input-submit-weight-day"
            ,SubmitCategoryFoodName: "#input-submit-category-food-name"
            ,SubmitCategoryFoodValue: "#input-submit-category-food-qt"
            ,SubmitCategoryExecName: "#input-submit-category-exec-name"
            ,SubmitCategoryExecValue: "#input-submit-category-exec-qt"
        },
        Table: {
            FoodFood: "#food-food"
            ,FoodExec: "#food-exec"
            ,Weight: "#weight-weight"
            ,Day: "#day-cal"
            ,Month: "#month-cal"
            ,SubmitFoodExec: "#submit-foodexec-table"
			,SubmitSetFoodExec: "#submit-foodexec-set-table"
        },
        Graph: {
            Month: "#month-graph-weight"
            ,DayCal: "#day-graph-cal"
            ,DayFat: "#day-graph-fat"
        }
    };
    //문자 체크용
    var CheckText = {
        OnlyNumber: "1",
        OnlyChar: "2",
        OutSpecial: "3"
    };
    function uiWorker() {
        $(Nodes.Button.cancel).click(function() {
            window.history.back();
        });
		Object.keys(Nodes.ButtonModal).map(a=>{
			$(Nodes.ButtonModal[a]).click(()=>{
				switch(a) {
					case "SubFoodFood": modalShow(Nodes.Div.ModalFoodExec, Nodes.ButtonModal[a]);
					break;
					case "SubFoodExec": modalShow(Nodes.Div.ModalFoodExec, Nodes.ButtonModal[a]);
					break;
					case "SubWeightWeight": modalShow(Nodes.Div.ModalWeight, Nodes.ButtonModal[a]);
					break;
					case "SubCategory": modalShow(Nodes.Div.ModalCategory, Nodes.ButtonModal[a]);
					break;
				}
			});
		});
		Object.keys(Nodes.Button).map(a=>{
			if (a !== 'cancel') {
				$(Nodes.Button[a]).click(()=>{ bindAJAX(Nodes.Button[a])});
			}
		});
		Object.keys(Nodes.Input).filter(a=>a.indexOf('Day') === -1).map(a=>{
			$(Nodes.Input[a]).keydown((e)=>{
				if(e.which == 13) {
					switch(a) {
						case "SubmitFoodExecSearch": bindAJAX(Nodes.Button.SubmitFoodExecSearch);
						break;
						case "SubmitFoodExecQt": bindAJAX(Nodes.Button.SubmitFoodExec);
						break;
						case "SubmitFoodExecQt": bindAJAX(Nodes.Button.SubmitWeight);
						break;
						case "SubmitCategoryExecValue": bindAJAX(Nodes.Button.SubmitCategoryExec);
						break;
						case "SubmitCategoryFoodValue": bindAJAX(Nodes.Button.SubmitCategoryFood);
						break;
					}
				}
			});
		});
        $(Nodes.Input.SubFoodDay).datepicker();
        $(Nodes.Input.SubFoodDay).datepicker("option", "dateFormat", "yy-mm-dd");
        $(Nodes.Input.SubWeightDay).datepicker();
        $(Nodes.Input.SubWeightDay).datepicker("option", "dateFormat", "yy-mm-dd");
        $(Nodes.Input.SubmitFoodExecDay).datepicker();
        $(Nodes.Input.SubmitFoodExecDay).datepicker("option", "dateFormat", "yy-mm-dd");
        $(Nodes.Input.SubmitWeightDay).datepicker();
        $(Nodes.Input.SubmitWeightDay).datepicker("option", "dateFormat", "yy-mm-dd");
    }
    function modalShow(div, button) { 
		var setNode;
        if (button === Nodes.ButtonModal.SubFoodExec) {
            $(Nodes.Div.ModalFoodExec).find("p").text(Param.TextVal.SubmitExec);
            setNode = $(Nodes.Table.SubmitFoodExec).find("tbody");
            setNode.empty();
            $(setNode).append('<tr><th>선택</th><th>효율(kcal/~)</th>');
            $(Nodes.Input.SubmitFoodExecQt).attr("placeholder", "~ km");
        }
        if (button === Nodes.ButtonModal.SubFoodFood) {
            $(Nodes.Div.ModalFoodExec).find("p").text(Param.TextVal.SubmitFood);
            setNode = $(Nodes.Table.SubmitFoodExec).find("tbody");
            setNode.empty();
            $(setNode).append('<tr><th>선택</th><th>효율(kcal/~)</th>');
            $(Nodes.Input.SubmitFoodExecQt).attr("placeholder", "~ x 100g");
        }
        window.location.href = div;
    }
    function bindAJAX(node) {
        var rqdata;
        switch (node) {
            case Nodes.Button.SubFoodSearch:
                rqdata = {
                    RQ: Param.ajaxVal.Food,
                    DATE: $(Nodes.Input.SubFoodDay).val()
                };
                rqAJAX(Param.ajaxLink.Food, rqdata, Nodes.Button.SubFoodSearch, fetchAJAX);
                rqdata = {
                    RQ: Param.ajaxVal.Exec,
                    DATE: $(Nodes.Input.SubFoodDay).val()
                };
                rqAJAX(Param.ajaxLink.Exec, rqdata, Nodes.Button.SubExecSearch, fetchAJAX);
                break;
            case Nodes.Button.SubWeightSearch:
                rqdata = {
                    RQ: Param.ajaxVal.Weight,
                    DATE: $(Nodes.Input.SubWeightDay).val()
                };
                rqAJAX(Param.ajaxLink.Weight, rqdata, Nodes.Button.SubWeightSearch, fetchAJAX);
                break;
            case Nodes.Button.MainFood:
                rqdata = {
                    RQ: Param.ajaxVal.Food,
                    DATE: $(Nodes.Input.SubFoodDay).val()
                };
                rqAJAX(Param.ajaxLink.Food, rqdata, Nodes.Button.SubFoodSearch, fetchAJAX);
                rqdata = {
                    RQ: Param.ajaxVal.Exec,
                    DATE: $(Nodes.Input.SubFoodDay).val()
                };
                rqAJAX(Param.ajaxLink.Exec, rqdata, Nodes.Button.SubExecSearch, fetchAJAX);
                break;
            case Nodes.Button.MainWeight:
                rqdata = {
                    RQ: Param.ajaxVal.Weight,
                    DATE: $(Nodes.Input.SubWeightDay).val()
                };
                rqAJAX(Param.ajaxLink.Weight, rqdata, Nodes.Button.SubWeightSearch, fetchAJAX);
                break;
            case Nodes.Button.MainDay:
                rqdata = {
                    RQ: Param.ajaxVal.Day
                };
                rqAJAX(Param.ajaxLink.Day, rqdata, Nodes.Button.MainDay, fetchAJAX);
                break;
            case Nodes.Button.MainMonth:
                rqdata = {
                    RQ: Param.ajaxVal.Month
                };
                rqAJAX(Param.ajaxLink.Month, rqdata, Nodes.Button.MainMonth, fetchAJAX);
                break;
            case Nodes.Button.SubmitFoodExecSearch:
                if ($(Nodes.Div.ModalFoodExec).find("p").text() === Param.TextVal.SubmitExec) {
                    rqdata = {
                        RQ: Param.ajaxVal.ExecList,
                        MODE: Param.ajaxVal.ExecListVal,
                        VALUE: $(Nodes.Input.SubmitFoodExecSearch).val()
                    };
                    rqAJAX(Param.ajaxLink.ExecList, rqdata, Nodes.Button.SubmitFoodExecSearch, fetchAJAX);
                } else {
                    rqdata = {
                        RQ: Param.ajaxVal.FoodList,
                        MODE: Param.ajaxVal.FoodListVal,
                        VALUE: $(Nodes.Input.SubmitFoodExecSearch).val()
                    };
                    rqAJAX(Param.ajaxLink.FoodList, rqdata, Nodes.Button.SubmitFoodExecSearch, fetchAJAX);
                }
                break;
            case Nodes.Button.SubmitFoodExec:
				//멀티 작업을 위해 별도함수로 처리
				multiSubmitFoodExec();
                break;
            case Nodes.Button.SubmitWeight:
                if (checkSubmit(Nodes.Button.SubmitWeight)) {
                    rqdata = {
                        RQ: Param.ajaxVal.SubmitWeight,
                        DATE: $(Nodes.Input.SubmitWeightDay).val(),
                        VALUE: $(Nodes.Input.SubmitWeight).val()
                    };
                    rqAJAX(Param.ajaxLink.SubmitWeight, rqdata, Nodes.Button.SubmitWeight, fetchAJAX);
                }
                break;
            case Nodes.Button.SubmitCategoryFood:
                if (checkSubmit(Nodes.Button.SubmitCategoryFood)) {
                    rqdata = {
                        RQ: Param.ajaxVal.SubmitFoodCategory,
                        FOOD: $(Nodes.Input.SubmitCategoryFoodName).val(),
                        VALUE: $(Nodes.Input.SubmitCategoryFoodValue).val()
                    };
                    rqAJAX(Param.ajaxLink.SubmitFoodExec, rqdata, Nodes.Button.SubmitCategoryFood, fetchAJAX);
                }
                break;
            case Nodes.Button.SubmitCategoryExec:
                if (checkSubmit(Nodes.Button.SubmitCategoryExec)) {
                    rqdata = {
                        RQ: Param.ajaxVal.SubmitExecCategory,
                        EXEC: $(Nodes.Input.SubmitCategoryExecName).val(),
                        VALUE: $(Nodes.Input.SubmitCategoryExecValue).val()
                    };
                    rqAJAX(Param.ajaxLink.SubmitFoodExec, rqdata, Nodes.Button.SubmitCategoryExec, fetchAJAX);
                }
                break;
        }
    }
    function fetchAJAX(node, data) {
        var setNode;
        switch (node) {
            case Nodes.Button.SubFoodSearch:
                setNode = $(Nodes.Table.FoodFood).find("tbody");
                setNode.empty();
                $(setNode).append('<tr><th>날짜</th><th>음식명</th><th>인분</th><th>삭제</th></tr>');
				data.map(a=>{
					$(setNode).append('<tr>	<td>' + a.diet_date + '</td><td>' + a.category_name + '</td><td>' + a.value 
					+ '</td><td><button  class="' + Param.Button.FoodDelNodeClassName + '" value="' + a.rowid + '">삭제</button></td>	</tr>');
				});
                //삭제버튼 설정
                $(Param.Button.FoodDelNodeClass).click(function() {
                    delItem($(this));
                });
                break;
            case Nodes.Button.SubExecSearch:
                setNode = $(Nodes.Table.FoodExec).find("tbody");
                setNode.empty();
                $(setNode).append('<tr><th>날짜</th><th>운동명</th><th>시간</th><th>삭제</th></tr>');
				data.map(a=>{
				    $(setNode).append('<tr>	<td>' + a.diet_date + '</td><td>' + a.category_name + '</td><td>' + a.value 
					+ '</td><td><button  class="' + Param.Button.ExecDelNodeClassName + '" value="' + a.rowid + '">삭제</button></td>	</tr>');
                });
                //삭제버튼 설정
                $(Param.Button.ExecDelNodeClass).click(function() {
                    delItem($(this));
                });
                break;
            case Nodes.Button.SubWeightSearch:
				//증감 처리를 위해 수정함 
                setNode = $(Nodes.Table.Weight).find("tbody");
                setNode.empty();
                $(setNode).append('<tr><th>날짜</th><th>몸무게</th><th>증감</th></tr>');
				data.map((a,i)=>{
					$(setNode).append('<tr>	<td>' + a.diet_date + '</td><td>' + a.value + '</td><td>' 
					+ (a.value - (data[i+1]? data[i+1].value:a.value)).toFixed(1) + '</td>	</tr>');
				});
                //삭제버튼 설정
                $(Param.Button.WeigthDelNodeClass).click(function() {
                    delItem($(this));
                });
                break;
            case Nodes.Button.MainDay:
                setNode = $(Nodes.Table.Day).find("tbody");
                setNode.empty();
                $(setNode).append('<tr><th>날짜</th><th>+kcal</th><th>-kcal</th><th>지방</th></tr>');
				data.map(a=>{
					$(setNode).append('<tr><td>'+a.diet_date+'</td><td>'+a.food_sum+'</td><td>'+a.exec_sum+'</td><td>'+a.sum_gram+'</td> </tr>');
				});
                SipuDiet.graphDraw(data, Nodes.Graph.DayCal, Param.TextVal.GraphHeight);
                SipuDiet.graphDraw(data, Nodes.Graph.DayFat, Param.TextVal.GraphHeight);
                break;
            case Nodes.Button.MainMonth:
                setNode = $(Nodes.Table.Month).find("tbody");
                setNode.empty();
                $(setNode).append('<tr><th>년월</th><th>무게</th>');
				data.map(a=>{
					$(setNode).append('<tr>	<td>' + a.diet_mon + '</td><td>' + a.avg_val + '</td></tr>');
				});
                SipuDiet.graphDraw2(data, Nodes.Graph.Month, Param.TextVal.GraphHeight);
                break;
            case Nodes.Button.SubmitFoodExecSearch:
                setNode = $(Nodes.Table.SubmitFoodExec).find("tbody");
                setNode.empty();
                $(setNode).append('<tr><th>선택</th><th>효율</th>');
				data.map(a=>{
					$(setNode).append('<tr>	<td><button  class="' + Param.Button.FoodExecSelNodeClassName + '" value="' 
					+ a.category_id + '">' + a.category_name + '</button></td><td>' + a.category_value + '</td>	</tr>');
				});
                //선택버튼 설정
                $(Param.Button.FoodExecSelNodeClass).click(function() {
                    selItemSubmitSetFoodExec($(this));
                });
                break;
            case Nodes.Button.SubmitFoodExec:
                window.history.back();
                bindAJAX(Nodes.Button.MainFood);
                break;
            case Nodes.Button.SubmitWeight:
                window.history.back();
                bindAJAX(Nodes.Button.SubWeightSearch);
                break;
            case Nodes.Button.SubmitCategoryFood:
                window.history.back();
                break;
            case Nodes.Button.SubmitCategoryExec:
                window.history.back();
                break;
        }
    }
    function delItem(node) {
        var rqdata;
        switch (node.attr("class")) {
            case Param.Button.FoodDelNodeClassName:
                rqdata = {
                    RQ: Param.ajaxVal.DelFoodExec,
                    ID: $(node).val()
                };
                rqAJAX(Param.ajaxLink.DelFoodExec, rqdata, Nodes.Button.SubFoodSearch, bindAJAX);
                break;
            case Param.Button.ExecDelNodeClassName:
                rqdata = {
                    RQ: Param.ajaxVal.DelFoodExec,
                    ID: $(node).val()
                };
                rqAJAX(Param.ajaxLink.DelFoodExec, rqdata, Nodes.Button.SubExecSearch, bindAJAX);
                break;
            case Param.Button.WeigthDelNodeClassName:
                rqdata = {
                    RQ: Param.ajaxVal.Weight,
                    ID: $(node).val()
                };
                rqAJAX(Param.ajaxLink.DelWeight, rqdata, Nodes.Button.SubWeightSearch, fetchAJAX);
                break;
        }
    }
    function selItemSubmitSetFoodExec(node) {
		var cateId = node.val();
		var cateName = node.text();
		var seltrs = Array.from($(Nodes.Table.SubmitSetFoodExec).find("tr"));
		if (seltrs.some(a=> $(a).find("button").val() === cateId) === false) {
			var b = $(Nodes.Table.SubmitSetFoodExec).find("tbody");
			var add = $('<tr>	<td><button  class="' + Param.Button.FoodExecDelNodeClassName + '" value="' 
					+ cateId + '">' + cateName + '</button></td><td contenteditable="true">1</td>	</tr>');
			$(b).append(add);
			add.find("button").click(()=>{
				$(add).remove();
			});
		}
    }
	function multiSubmitFoodExec() {
		//오류 체크
		var allQ = Array.from($(Nodes.Table.SubmitSetFoodExec).find("tr"));
		allQ.shift(); //헤더 제거
		if (allQ.length > 0 ) { 
			if (allQ.every(a=> checkInput($(a).find("td:eq(1)").text(),CheckText.OnlyNumber))
			&& allQ.every(a=> $(a).find("button:eq(0)").val().length > 0)) {
				//모든조건 충족
				var date = $(Nodes.Input.SubmitFoodExecDay).val();
				allQ.map((a,i)=>{
					rqdata = {
						RQ: Param.ajaxVal.SubmitFoodExec,
						DATE: date,
						CATEGORY: $(a).find("button:eq(0)").val(),
						VALUE: $(a).find("td:eq(1)").text()
					};
					//마지막 큐 실행후 조회
					if (i === allQ.length-1) {
						rqAJAX(Param.ajaxLink.SubmitFoodExec, rqdata, Nodes.Button.SubmitFoodExec, fetchAJAX);
					} else {
						rqAJAX(Param.ajaxLink.SubmitFoodExec, rqdata, Nodes.Button.SubmitFoodExec, null);
					}
				});
				$(Nodes.Table.SubmitSetFoodExec).find("tr:gt(0)").remove();
			} else { console.log('오류 발생'); }
		} else { console.log('선택되지 않음'); }
	}
    function rqAJAX(Geturl, rqdata, node, func) {
        $.ajax({
                url: Geturl,
                type: "POST",
                data: rqdata,
                beforeSend: function(xhr) {
                    if (xhr.overrideMimeType) {
                        xhr.overrideMimeType("application/json");
                    }
                },
                dataType: 'json',
                scriptCharset: "utf-8",
                error: function(jqXHR, textStatus, errorThrown) {

                }
            })
            .done(function(data) {
				if (func !== null) {
					return func(node, data);
				}
            })
            .fail(function() {
                //alert("송수신 실패");
                console.log("송수신 실패");
                window.location = "/Diet/Login";
            });
    }
    function checkSubmit(button) {
        var checkval;
        switch (button) {
            case Nodes.Button.SubmitWeight:
                if (!$(Nodes.Input.SubmitWeight).val()) {
                    $(Nodes.Input.SubmitWeight).attr("placeholder", "입력해주세요");
                    $(Nodes.Input.SubmitWeight).focus();
                    return false;
                }
                checkval = checkInput($(Nodes.Input.SubmitWeight).val(), CheckText.OnlyNumber);
                $(Nodes.Input.SubmitWeight).val(checkval);
                return true;
            case Nodes.Button.SubmitCategoryFood:
                if (!$(Nodes.Input.SubmitCategoryFoodName).val()) {
                    $(Nodes.Input.SubmitCategoryFoodName).attr("placeholder", "입력해주세요");
                    $(Nodes.Input.SubmitCategoryFoodName).focus();
                    return false;
                }
                checkval = checkInput($(Nodes.Input.SubmitCategoryFoodValue).val(), CheckText.OnlyNumber);
                $(Nodes.Input.SubmitCategoryFoodValue).val(checkval);
                if (!$(Nodes.Input.SubmitCategoryFoodValue).val()) {
                    $(Nodes.Input.SubmitCategoryFoodValue).attr("placeholder", "입력해주세요");
                    $(Nodes.Input.SubmitCategoryFoodValue).focus();
                    return false;
                }
                return true;
            case Nodes.Button.SubmitCategoryExec:
                if (!$(Nodes.Input.SubmitCategoryExecName).val()) {
                    $(Nodes.Input.SubmitCategoryExecName).attr("placeholder", "입력해주세요");
                    $(Nodes.Input.SubmitCategoryExecName).focus();
                    return false;
                }
                checkval = checkInput($(Nodes.Input.SubmitCategoryExecValue).val(), CheckText.OnlyNumber);
                $(Nodes.Input.SubmitCategoryExecValue).val(checkval);
                if (!$(Nodes.Input.SubmitCategoryExecValue).val()) {
                    $(Nodes.Input.SubmitCategoryExecValue).attr("placeholder", "입력해주세요");
                    $(Nodes.Input.SubmitCategoryExecValue).focus();
                    return false;
                }
            return true;
        }
    }
    function graphData(node, data) {
        var graphdata = [];
        switch (node) {
            case Nodes.Graph.Month:
                graphdata = [
                    ["", "체중"]
                ];
                $.each(data, function() {
                    var item = [this.diet_mon, parseInt(this.avg_val)];
                    graphdata.push(item);
                });
                break;
            case Nodes.Graph.DayCal:
                graphdata = [
                    ["", "섭취칼로리", "소모칼로리"]
                ];
                $.each(data, function() {
                    var item = [this.diet_date, parseInt(this.food_sum), parseInt(this.exec_sum)];
                    graphdata.push(item);
                });
                break;
            case Nodes.Graph.DayFat:
                graphdata = [
                    ["", "지방증감량"]
                ];
                $.each(data, function() {
                    var item = [this.diet_date, parseInt(this.sum_gram)];
                    graphdata.push(item);
                });
                break;
        }
        return graphdata;
    }
    SipuDiet.graphDraw = function(data, node, vHeight) {
        var graphdata = graphData(node, data);
        var setdata = google.visualization.arrayToDataTable(graphdata);
        var options = {};
        var chart = new google.visualization.BarChart(document.getElementById(node.replace("#", "")));
        chart.draw(setdata, options);
    };
    SipuDiet.graphDraw2 = function(data, node, vHeight) {
        var graphdata = graphData(node, data);
        var setdata = google.visualization.arrayToDataTable(graphdata);
        var options = {
            title: "",
            chartArea: {
            	top:20,width:"70%",height:"90%"
            },
            hAxis: {
                minValue: 0
            },
            orientation: 'vertical',
            curveType: 'function'
        };
        var chart = new google.visualization.LineChart(document.getElementById(node.replace("#", "")));
        chart.draw(setdata, options);
    };
    function checkInput(obj, type) {
        var pattern;
        switch (type) {
            case CheckText.OnlyChar:
                pattern = /[^(가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9)]/gi; // 특수문자 제거
                break;
            case CheckText.OutSpecial:
                pattern = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
                break;
            case CheckText.OnlyNumber:
                pattern = /[^\d\.]/g; // 숫자이외는 제거
                break;
        }
        if (pattern.test(obj)) {
            obj = obj.replace(pattern, "");
        }
        return obj;
    }
    SipuDiet.run = function() {
        //기본실행
        uiWorker();
    };
    return SipuDiet;
})(window.SipuDiet || {}, $);
SipuDiet.run();
