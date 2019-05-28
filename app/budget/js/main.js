//es5 convert 2018.10.05
var SipuBudget = (function(SipuBudget, $, undefined) {
	//구글 차트 설정(필수)
	google.charts.load('current', {packages: ['corechart']});
	google.charts.setOnLoadCallback(SipuBudget.graphDraw);

	var masterlink = "/Budget";
	var Param = {
		ajaxLink : {
			Select : masterlink + "/Select"
			,Update : masterlink + "/Update"
			,Delete : masterlink + "/Delete"
		}
		,ajaxMode : {
			ListDayIncome : "LIST_INCOME"
			,ListDayExpense : "LIST_EXPENSE"
			,ListSumDay : "LIST_SUMDAY"
			,ListSumMonth : "LIST_SUMMONTH"
			,ListSumYear : "LIST_SUMYEAR"
			,ListStatMonthIncome : "LIST_MONTHINCOME"
			,ListStatMonthIncomeDetail : "LIST_MONTHINCOME_DETAIL"
			,ListStatYearIncome : "LIST_YEARINCOME"
			,ListStatYearIncomeDetail : "LIST_YEARINCOME_DETAIL"
			,ListStatMonthExpense : "LIST_MONTHEXPENSE"
			,ListStatMonthExpenseDetail : "LIST_MONTHEXPENSE_DETAIL"
			,ListStatYearExpense : "LIST_YEAREXPENSE"
			,ListStatYearExpenseDetail : "LIST_YEAREXPENSE_DETAIL"
			,ListSetAccount : "LIST_USERACCOUNT"
			,ListSetTax : "LIST_STATTAX"
			,ListSetTaxDetail : "LIST_STATTAXDETAIL"
			,UpdateDayIncome : "UPDATE_INCOME"
			,UpdateDayExpense : "UPDATE_EXPENSE"
			,UpdateDayTransfer : "UPDATE_TRANSFER"
			,UpdateSetAccount : "UPDATE_ACCOUNT"
			,DeleteDayIncome : "DELETE_INCOME"
			,DeleteDayExpense : "DELETE_EXPENSE"
			,ListModalCategory : "LIST_CATEGORY"
			,ListModalAccount : "LIST_ACCOUNT"
			,ListViewCategory : "LIST_VIEW_CATEGORY"
		}
		,ajaxVal : {
			Day : "DAY"
			,AccountID : "ACCOUNT-ID"
			,CategoryID : "CATEGORY-ID"
			,Value : "QT"
			,Income : "INCOME"
			,Expense : "EXPENSE"
		}
		,DVal : {
			GraphHeight : 900
			,IncomeCategoryLen : 8
			,ExpenseCategoryLen : 12
			,ClickDayButton : ""
			,ClickDayValue : ""
			,ClickSumButton : ""
			,ClickSumValue : ""
			,ClickStatButton : ""
			,ClickStatValue : ""
			,ClickSetButton : ""
			,ClickSetValue : ""
			,StatAllCateValue : "all"
			,StatSelCateValue : "all"
			,StatAJAXkeepValue : ""
		}
		,Button : {
			DayIncomeDelNodeClass : ".delete.button.day.income"
			,DayIncomeDelNodeClassName : "delete button day income"
			,DayExpenseDelNodeClass : ".delete.button.day.expense"
			,DayExpenseDelNodeClassName : "delete button day expense"
			,StatDetailNodeClass : ".list.button.statdetail"
			,StatDetailNodeClassName : "list button statdetail"
			,TaxDetailNodeClass : ".list.button.set.taxdetail"
			,TaxDetailNodeClassName : "list button set taxdetail"
		}
	};
	var Nodes = {
		Div : {
			SetAccount : ".set.account"
			,SetTax : ".set.tax"
		}
		,Modal : {
			ModalSubmitIncome : "#modal-submit-income"
			,ModalSubmitExpense : "#modal-submit-expense"
			,ModalSubmitTransfer : "#modal-submit-transfer"
			,ModalSubmitStatDetail : "#modal-submit-stat-detail"
			,ModalSubmitAccount : "#modal-submit-account"
			,ModalSubmitTax : "#modal-submit-tax"
		}
		,Button : {
			cancel : ".cancel"
		}
		,ButtonDay : {
			Search : "#button-day-search"
			,Income : "#button-day-income"
			,Expense : "#button-day-expense"
			,Transfer : "#button-day-transfer"
		}
		,ButtonSum : {
			Day : "#button-sum-day"
			,Month : "#button-sum-month"
			,Year : "#button-sum-year"
		}
		,ButtonStat : {
			MonthIncome : "#button-stat-month-income"
			,MonthExpense : "#button-stat-month-expense"
			,YearIncome : "#button-stat-year-income"
			,YearExpense : "#button-stat-year-expense"
		}
		,ButtonSet : {
			Account : "#button-set-account"
			//,AccountAdd : "#button-set-account-add"
			,Tax : "#button-set-tax"
			,TaxLet : "#button-set-tax-ret"
		}
		,ButtonModal : {
			SubmitIncome : "#button-submit-income"
			,SubmitExpense : "#button-submit-expense"
			,SubmitTransfer : "#button-submit-transfer"
			,SubmitAccount : "#button-submit-account"
			,SubmitTax : "#button-submit-tax"
		}
		,Input : {
			DayDay : "#input-day-datepicker"
			,ModalIncomeDay : "#input-submit-income-datepicker"
			,ModalIncomeCategory : "#select-submit-income-category"
			,ModalIncomeAccount : "#select-submit-income-account"
			,ModalIncomeQt : "#input-submit-income-qt"
			,ModalExpenseDay : "#input-submit-expense-datepicker"
			,ModalExpenseCategory : "#select-submit-expense-category"
			,ModalExpenseAccount : "#select-submit-expense-account"
			,ModalExpenseQt : "#input-submit-expense-qt"
			,ModalTransferDay : "#input-submit-transfer-datepicker"
			,ModalTransferAccountFrom : "#select-submit-transfer-account-from"
			,ModalTransferAccountTo : "#select-submit-transfer-account-to"
			,ModalTransferQt : "#input-submit-transfer-qt"
			,ModalAccountQt : "#input-submit-account-qt"
			,ModalTaxQt : "#input-submit-tax-qt"
		}
		,Table : {
			DayIncome : "#table-day-income"
			,DayExpense: "#table-day-expense"
			,Sum : "#table-sum"
			,Stat : "#table-stat"
			,SetAccount : "#table-set-account"
			,SetTax : "#table-set-tax"
			,SetTaxdetail : "#table-set-tax-detail"
		}
		,Graph : {
			Sum : "#sum-graph-dayNmonth"
			,Stat : "#stat-graph-stat"
			,Modal : "#modal-graph-stat-detail"
		}
		,Select : {
			ModalIncomeAccount : "#select-submit-income-account"
			,ModalIncomeCategory : "#select-submit-income-category"
			,ModalExpenseAccount : "#select-submit-expense-account"
			,ModalExpenseCategory : "#select-submit-expense-category"
			,ModalTransferAccountFrom : "#select-submit-transfer-account-from"
			,ModalTransferAccountTo : "#select-submit-transfer-account-to"
			,StatCategory : "#select-statview-category"
		}
	};
	//문자 체크용
	var CheckText = {
		OnlyNumber : "1"
		,OnlyChar : "2"
		,OutSpecial : "3"
	};
	function uiWorker() {
		$(Nodes.Button.cancel).click(function(){ window.history.back();});
		$(Nodes.ButtonDay.Income).click(function(){ modalShow(Nodes.Modal.ModalSubmitIncome, Nodes.ButtonDay.Income);});
		$(Nodes.ButtonDay.Expense).click(function(){ modalShow(Nodes.Modal.ModalSubmitExpense, Nodes.ButtonDay.Expense);});
		$(Nodes.ButtonDay.Transfer).click(function(){ modalShow(Nodes.Modal.ModalSubmitTransfer, Nodes.ButtonDay.Transfer);});
		$(Nodes.ButtonSet.Account).click(function(){
			divSetShow(Nodes.Div.SetAccount, Nodes.ButtonSet.Account);
			bindAJAX(Nodes.ButtonSet.Account);
		});
		$(Nodes.ButtonSet.Tax).click(function(){ divSetShow(Nodes.Div.SetTax, Nodes.ButtonSet.Tax);});
		//$(Nodes.ButtonSet.AccountAdd).click(function(){ modalShow(Nodes.Modal.ModalSubmitAccount, Nodes.ButtonSet.AccountAdd);});
		$(Nodes.ButtonSet.TaxLet).click(function(){ modalShow(Nodes.Modal.ModalSubmitTax, Nodes.ButtonSet.TaxLet);});
		$(Nodes.Input.DayDay).datepicker();
		$(Nodes.Input.DayDay).datepicker("option", "dateFormat", "yy-mm-dd");
		$(Nodes.Input.ModalIncomeDay).datepicker();
		$(Nodes.Input.ModalIncomeDay).datepicker( "option", "dateFormat", "yy-mm-dd");
		$(Nodes.Input.ModalExpenseDay).datepicker();
		$(Nodes.Input.ModalExpenseDay).datepicker( "option", "dateFormat", "yy-mm-dd");
		$(Nodes.Input.ModalTransferDay).datepicker();
		$(Nodes.Input.ModalTransferDay).datepicker( "option", "dateFormat", "yy-mm-dd");
		$(Nodes.ButtonDay.Search).click(function(){ bindAJAX(Nodes.ButtonDay.Search); });
		//공통 묶기
		Object.keys(Nodes).map(a=>{
			if (a === 'ButtonSum' || a === 'ButtonStat' || a === 'ButtonModal') {
				Object.keys(Nodes[a]).map(b=>{ $(Nodes[a][b]).click(()=>{ bindAJAX(Nodes[a][b]); }) });
			}
		});
		//
		$(Nodes.Input.DayDay).keydown(function(e){if(e.which == 13){ bindAJAX(Nodes.ButtonDay.Search);}});
		$(Nodes.Input.ModalIncomeQt).keydown(function(e){if(e.which == 13){bindAJAX(Nodes.ButtonModal.SubmitIncome);}});
		$(Nodes.Input.ModalExpenseQt).keydown(function(e){if(e.which == 13){bindAJAX(Nodes.ButtonModal.SubmitExpense);}});
		$(Nodes.Input.ModalTransferQt).keydown(function(e){if(e.which == 13){bindAJAX(Nodes.ButtonModal.SubmitTransfer);}});
		$(Nodes.Input.ModalAccountQt).keydown(function(e){if(e.which == 13){bindAJAX(Nodes.ButtonModal.SubmitAccount);}});
		$(Nodes.Input.ModalTaxQt).keydown(function(e){if(e.which == 13){bindAJAX(Nodes.ButtonModal.SubmitTax);}});
		$(Nodes.Select.StatCategory).change(function() { refetchStatCategory(Param.DVal.ClickStatButton); });
	}
	function divSetShow (div, button) {
		$(Nodes.Div.SetAccount).hide();
		$(Nodes.Div.SetTax).hide();
		$(div).show();
	}
	function modalShow (div, button) {
		switch (button) {
			case  Nodes.ButtonDay.Income :
				bindAJAX(Nodes.ButtonDay.Income);
				break;
			case  Nodes.ButtonDay.Expense :
				bindAJAX(Nodes.ButtonDay.Expense);
				break;
			case  Nodes.ButtonDay.Transfer :
				bindAJAX(Nodes.ButtonDay.Transfer);
				break;
		}
		window.location.href = div;
	}
	function bindAJAX(button) {
		var rqdata;
		switch (button) {
			case  Nodes.ButtonDay.Income :
				Param.DVal.ClickDayButton = Nodes.ButtonDay.Income;
				rqdata = { RQ :  Param.ajaxMode.ListModalCategory, VALUE :  Param.ajaxVal.Income};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListModalCategory, fetchAJAX);
				rqdata = { RQ :  Param.ajaxMode.ListModalAccount};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListModalAccount, fetchAJAX);
				break;
			case  Nodes.ButtonDay.Expense :
				Param.DVal.ClickDayButton = Nodes.ButtonDay.Expense;
				rqdata = { RQ :  Param.ajaxMode.ListModalCategory , VALUE :  Param.ajaxVal.Expense};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListModalCategory, fetchAJAX);
				rqdata = { RQ :  Param.ajaxMode.ListModalAccount};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListModalAccount, fetchAJAX);
				break;
			case  Nodes.ButtonDay.Transfer :
				Param.DVal.ClickDayButton = Nodes.ButtonDay.Transfer;
				rqdata = { RQ :  Param.ajaxMode.ListModalAccount};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListModalAccount, fetchAJAX);
				break;
			case  Nodes.ButtonDay.Search :
				rqdata = { RQ :  Param.ajaxMode.ListDayIncome, DATE : $(Nodes.Input.DayDay).val()};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListDayIncome, fetchAJAX);
				rqdata = { RQ :  Param.ajaxMode.ListDayExpense, DATE : $(Nodes.Input.DayDay).val()};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListDayExpense, fetchAJAX);
				break;
			case  Nodes.ButtonSum.Day :
				Param.DVal.ClickSumButton = Nodes.ButtonSum.Day;
				rqdata = { RQ :  Param.ajaxMode.ListSumDay};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListSumDay, fetchAJAX);
				break;
			case  Nodes.ButtonSum.Month :
				Param.DVal.ClickSumButton = Nodes.ButtonSum.Month;
				rqdata = { RQ :  Param.ajaxMode.ListSumMonth};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListSumMonth, fetchAJAX);
				break;
			case  Nodes.ButtonSum.Year :
				Param.DVal.ClickSumButton = Nodes.ButtonSum.Year;
				rqdata = { RQ :  Param.ajaxMode.ListSumYear};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListSumYear, fetchAJAX);
				break;
			case  Nodes.ButtonStat.MonthIncome :
				Param.DVal.ClickStatButton = Nodes.ButtonStat.MonthIncome;
				Param.DVal.StatSelCateValue = Param.DVal.StatAllCateValue;
				//통계 세분화 카테고리값만 들고 오기 위해 기존 쿼리 재사용
				rqdata = { RQ :  Param.ajaxMode.ListModalCategory, VALUE :  Param.ajaxVal.Income};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListViewCategory, fetchAJAX);
				rqdata = { RQ :  Param.ajaxMode.ListStatMonthIncome};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListStatMonthIncome, fetchAJAX);
				break;
			case  Nodes.ButtonStat.MonthExpense :
				Param.DVal.ClickStatButton = Nodes.ButtonStat.MonthExpense;
				Param.DVal.StatSelCateValue = Param.DVal.StatAllCateValue;
				//통계 세분화 카테고리값만 들고 오기 위해 기존 쿼리 재사용
				rqdata = { RQ :  Param.ajaxMode.ListModalCategory, VALUE :  Param.ajaxVal.Expense};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListViewCategory, fetchAJAX);
				rqdata = { RQ :  Param.ajaxMode.ListStatMonthExpense};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListStatMonthExpense, fetchAJAX);
				break;
			case  Nodes.ButtonStat.YearIncome :
				Param.DVal.ClickStatButton = Nodes.ButtonStat.YearIncome;
				Param.DVal.StatSelCateValue = Param.DVal.StatAllCateValue;
				//통계 세분화 카테고리값만 들고 오기 위해 기존 쿼리 재사용
				rqdata = { RQ :  Param.ajaxMode.ListModalCategory, VALUE :  Param.ajaxVal.Income};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListViewCategory, fetchAJAX);
				rqdata = { RQ :  Param.ajaxMode.ListStatYearIncome};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListStatYearIncome, fetchAJAX);
				break;
			case  Nodes.ButtonStat.YearExpense :
				Param.DVal.ClickStatButton = Nodes.ButtonStat.YearExpense;
				Param.DVal.StatSelCateValue = Param.DVal.StatAllCateValue;
				//통계 세분화 카테고리값만 들고 오기 위해 기존 쿼리 재사용
				rqdata = { RQ :  Param.ajaxMode.ListModalCategory, VALUE :  Param.ajaxVal.Expense};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListViewCategory, fetchAJAX);
				rqdata = { RQ :  Param.ajaxMode.ListStatYearExpense};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListStatYearExpense, fetchAJAX);
				break;
			case  Nodes.ButtonSet.Account:
				rqdata = { RQ :  Param.ajaxMode.ListSetAccount};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListSetAccount, fetchAJAX);
				break;
			case  Nodes.ButtonModal.SubmitIncome :
				if ( checkSubmit(Nodes.ButtonModal.SubmitIncome )) {
					rqdata = { RQ :  Param.ajaxMode.UpdateDayIncome
								, DATE : $(Nodes.Input.ModalIncomeDay).val()
							    , ACCOUNT : $(Nodes.Input.ModalIncomeAccount).val()
								, CATEGORY : $(Nodes.Input.ModalIncomeCategory).val()
								, VALUE : $(Nodes.Input.ModalIncomeQt).val() };
					rqAJAX(Param.ajaxLink.Update, rqdata, Param.ajaxMode.UpdateDayIncome, fetchAJAX);
				}
				break;
			case  Nodes.ButtonModal.SubmitExpense :
				if ( checkSubmit(Nodes.ButtonModal.SubmitExpense )) {
					rqdata = { RQ :  Param.ajaxMode.UpdateDayExpense
								, DATE : $(Nodes.Input.ModalExpenseDay).val()
								, ACCOUNT : $(Nodes.Input.ModalExpenseAccount).val()
								, CATEGORY : $(Nodes.Input.ModalExpenseCategory).val()
								, VALUE : $(Nodes.Input.ModalExpenseQt).val()
								};
					rqAJAX(Param.ajaxLink.Update, rqdata, Param.ajaxMode.UpdateDayExpense, fetchAJAX);
				}
				break;
			case  Nodes.ButtonModal.SubmitTransfer :
				if ( checkSubmit(Nodes.ButtonModal.SubmitTransfer)) {
					rqdata = { RQ :  Param.ajaxMode.UpdateDayTransfer
								, DATE : $(Nodes.Input.ModalTransferDay).val()
								, ACCOUNT_FROM : $(Nodes.Input.ModalTransferAccountFrom).val()
								, ACCOUNT_TO : $(Nodes.Input.ModalTransferAccountTo).val()
								, VALUE : $(Nodes.Input.ModalTransferQt).val()
								};
					rqAJAX(Param.ajaxLink.Update, rqdata, Param.ajaxMode.UpdateDayTransfer, fetchAJAX);
				}
				break;
			case  Nodes.ButtonModal.SubmitAccount :
				if ( checkSubmit(Nodes.ButtonModal.SubmitAccount )) {
					rqdata = { RQ :  Param.ajaxMode.UpdateSetAccount,  VALUE : $(Nodes.Input.ModalAccountQt).val() };
					rqAJAX(Param.ajaxLink.Update, rqdata, Param.ajaxMode.UpdateSetAccount, fetchAJAX);
				}
				break;
			case  Nodes.ButtonModal.SubmitTax :
				if ( checkSubmit(Nodes.ButtonModal.SubmitTax )) {
					rqdata = { RQ :  Param.ajaxMode.ListSetTax, VALUE : $(Nodes.Input.ModalTaxQt).val() };
					rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListSetTax, fetchAJAX);
				}
				break;
		}
	}
	function fetchAJAX(rq, data) {
		var ParamNode;
		//stat 항목을 위한 변수
		var sum = 0, col = 0, row = 0;
		switch (rq) {
			case  Param.ajaxMode.ListModalCategory :
				if (Param.DVal.ClickDayButton === Nodes.ButtonDay.Income) {
					ParamNode =  $(Nodes.Input.ModalIncomeCategory);
					ParamNode.empty();
					data.map(a=> { $(ParamNode).append('<option value="' + a.category_id +'" >' + a.category_name + '</option>'); });
					Param.DVal.IncomeCategoryLen = data.length;
				}
				if (Param.DVal.ClickDayButton === Nodes.ButtonDay.Expense) {
					ParamNode =  $(Nodes.Input.ModalExpenseCategory);
					ParamNode.empty();
					data.map(a=> { $(ParamNode).append('<option value="' + a.category_id +'" >' + a.category_name + '</option>'); });
					Param.DVal.ExpenseCategoryLen = data.length;
				}
				break;
			case  Param.ajaxMode.ListModalAccount :
				if (Param.DVal.ClickDayButton === Nodes.ButtonDay.Income) {
					ParamNode =  $(Nodes.Input.ModalIncomeAccount);
					ParamNode.empty();
					data.map(a=> { $(ParamNode).append('<option value="' + a.account_id +'" >' + a.account_name + '</option>'); });
				}
				if (Param.DVal.ClickDayButton === Nodes.ButtonDay.Expense) {
					ParamNode =  $(Nodes.Input.ModalExpenseAccount);
					ParamNode.empty();
					data.map(a=> { $(ParamNode).append('<option value="' + a.account_id +'" >' + a.account_name + '</option>'); });
				}
				if (Param.DVal.ClickDayButton === Nodes.ButtonDay.Transfer) {
					ParamNode =  $(Nodes.Input.ModalTransferAccountFrom);
					ParamNode.empty();
					data.map(a=> { $(ParamNode).append('<option value="' + a.account_id +'" >' + a.account_name + '</option>'); });
					ParamNode =  $(Nodes.Input.ModalTransferAccountTo);
					ParamNode.empty();
					data.map(a=> { $(ParamNode).append('<option value="' + a.account_id +'" >' + a.account_name + '</option>'); });
				}
				break;
			case  Param.ajaxMode.ListDayIncome :
				ParamNode =  $(Nodes.Table.DayIncome).find("tbody");
				ParamNode.empty();
				$(ParamNode).append('<tr><th>날짜</th><th>계좌</th><th>항목</th><th>수입</th><th>삭제</th></tr>');
				data.map(a=>{ 
					$(ParamNode).append('<tr><td>'+a.budget_date+'</td><td>'+a.account_name+'</td><td>'+a.category_name+'</td><td>'+a.income_value+'</td><td>'+'<button  class="'+Param.Button.DayIncomeDelNodeClassName+'" value="'+a.rowid+'">삭제</button></td></tr>');
				});
				//삭제버튼 설정
				$(Param.Button.DayIncomeDelNodeClass).click(function(){ delItem ($(this)); });
				break;
			case  Param.ajaxMode.ListDayExpense :
				ParamNode =  $(Nodes.Table.DayExpense).find("tbody");
				ParamNode.empty();
				$(ParamNode).append('<tr><th>날짜</th><th>계좌</th><th>항목</th><th>지출</th><th>삭제</th></tr>');
				data.map(a=>{ 
					$(ParamNode).append('<tr><td>'+a.budget_date+'</td><td>'+a.account_name+'</td><td>'+a.category_name+'</td><td>'+a.expense_value+'</td><td>'+'<button  class="'+Param.Button.DayExpenseDelNodeClassName+'" value="'+a.rowid+'">삭제</button></td></tr>');
				});
				//삭제버튼 설정
				$(Param.Button.DayExpenseDelNodeClass).click(function(){ delItem ($(this)); });
				break;
			case  Param.ajaxMode.ListSumDay :
				ParamNode =  $(Nodes.Table.Sum).find("tbody");
				ParamNode.empty();
				$(ParamNode).append('<tr><th>날짜</th><th>수익</th><th>지출</th><th>계</th></tr>');
				data.map(a=>{
					$(ParamNode).append('<tr>	<td>'+a.budget_date+'</td><td>'+a.income_sum+'</td><td>'+a.expense_sum+'</td><td>'+ (Number(a.income_sum) - Number(a.expense_sum))+'</td>	</tr>');
				});
				//summary
				var day = new Date(data[0].budget_date).getDate();
				var inS = data.reduce((a,b)=>a+(+b.income_sum),0);
				var outS = data.reduce((a,b)=>a+(+b.expense_sum),0);
				var inA = Math.round(inS*(1/day));
				var outA = Math.round(outS*(1/day));
				var AS = inS - outS;
				var AV = inA - outA;
				$(ParamNode).append('<tr><th>일계</th><th>총익</th><th>총실</th><th>총계</th></tr>');
				$(ParamNode).append('<tr>	<td>'+day+'일</td><td>'+inS+'</td><td>'+outS+'</td><td>'+AS+'</td></tr>');
				$(ParamNode).append('<tr><th>단위</th><th>+평균</th><th>-평균</th><th>평균</th></tr>');
				$(ParamNode).append('<tr>	<td>일</td><td>'+inA+'</td><td>'+outA+'</td><td>'+AV+'</td></tr>');
				//graph
				SipuBudget.graphDrawBar(data, Nodes.Graph.Sum, Param.DVal.GraphHeight);
				break;
			case  Param.ajaxMode.ListSumMonth :
				ParamNode =  $(Nodes.Table.Sum).find("tbody");
				ParamNode.empty();
				$(ParamNode).append('<tr><th>날짜</th><th>수익</th><th>지출</th><th>계</th></tr>');
				data.map(a=>{
					$(ParamNode).append('<tr>	<td>'+a.budget_month+'</td><td>'+a.income_sum+'</td><td>'+a.expense_sum+'</td><td>'+ (Number(a.income_sum) - Number(a.expense_sum))+'</td>	</tr>');
				});
				//summary
				var inS = data.filter((a,i)=>(i>0&&i<13)).reduce((a,b)=>a+(+b.income_sum),0);
				var outS = data.filter((a,i)=>(i>0&&i<13)).reduce((a,b)=>a+(+b.expense_sum),0);
				var inA = Math.round(inS*(1/12));
				var outA = Math.round(outS*(1/12));
				var AS = inS - outS;
				var AV = inA - outA;
				$(ParamNode).append('<tr><th>월계</th><th>총익</th><th>총실</th><th>총계</th></tr>');
				$(ParamNode).append('<tr>	<td>12개월</td><td>'+inS+'</td><td>'+outS+'</td><td>'+AS+'</td></tr>');
				$(ParamNode).append('<tr><th>단위</th><th>+평균</th><th>-평균</th><th>평균</th></tr>');
				$(ParamNode).append('<tr>	<td>월</td><td>'+inA+'</td><td>'+outA+'</td><td>'+AV+'</td></tr>');
				//graph
				SipuBudget.graphDrawBar(data, Nodes.Graph.Sum, Param.DVal.GraphHeight);
				break;
			case  Param.ajaxMode.ListSumYear :
				ParamNode =  $(Nodes.Table.Sum).find("tbody");
				ParamNode.empty();
				$(ParamNode).append('<tr><th>날짜</th><th>수익</th><th>지출</th><th>계</th></tr>');
				data.map(a=>{
					$(ParamNode).append('<tr>	<td>'+a.budget_year+'</td><td>'+a.income_sum+'</td><td>'+a.expense_sum+'</td><td>'+ (Number(a.income_sum) - Number(a.expense_sum))+'</td>	</tr>');
				});
				//summary
				var inS = data.filter((a,i)=>(i>0&&i<6)).reduce((a,b)=>a+(+b.income_sum),0);
				var outS = data.filter((a,i)=>(i>0&&i<6)).reduce((a,b)=>a+(+b.expense_sum),0);
				var inA = Math.round(inS*(1/5));
				var outA = Math.round(outS*(1/5));
				var AS = inS - outS;
				var AV = inA - outA;
				$(ParamNode).append('<tr><th>년계</th><th>총익</th><th>총실</th><th>총계</th></tr>');
				$(ParamNode).append('<tr>	<td>5개년</td><td>'+inS+'</td><td>'+outS+'</td><td>'+AS+'</td></tr>');
				$(ParamNode).append('<tr><th>단위</th><th>+평균</th><th>-평균</th><th>평균</th></tr>');
				$(ParamNode).append('<tr>	<td>연</td><td>'+inA+'</td><td>'+outA+'</td><td>'+AV+'</td></tr>');
				//graph
				SipuBudget.graphDrawBar(data, Nodes.Graph.Sum, Param.DVal.GraphHeight);
				break;
			case  Param.ajaxMode.ListViewCategory:
				//통계쪽 분화 처리 
				ParamNode =  $(Nodes.Select.StatCategory);
				ParamNode.empty();
				$(ParamNode).append('<option	value="'+ Param.DVal.StatAllCateValue +'" >통합</option>');
				data.map(a=> { $(ParamNode).append('<option value="' + a.category_name +'" >' + a.category_name + '</option>'); });
				if (Param.DVal.ClickStatButton === Nodes.ButtonStat.MonthIncome || Param.DVal.ClickStatButton === Nodes.ButtonStat.YearIncome ) {
					Param.DVal.IncomeCategoryLen = data.length;
				}
				if (Param.DVal.ClickStatButton === Nodes.ButtonStat.MonthExpense || Param.DVal.ClickStatButton === Nodes.ButtonStat.YearExpense ) {
					Param.DVal.ExpenseCategoryLen = data.length;
				}
				break;
			case  Param.ajaxMode.ListStatMonthIncome :
				ParamNode =  $(Nodes.Table.Stat).find("tbody");
				ParamNode.empty();
				Param.DVal.StatAJAXkeepValue = data;
				$(ParamNode).append('<tr><th>연월</th><th>금액</th><th></th></tr>');
				row = data.length / Param.DVal.IncomeCategoryLen;
				for(var i=0; i < row; i++) {
					sum = data.filter(a=>a.budget_month === data[i].budget_month).reduce((s,a)=>s+a.income_sum,0);
					$(ParamNode).append(
						'<tr>	<td>'+data[i].budget_month+'</td><td>'+sum+'</td>'
						+'<td><button  class="'+Param.Button.StatDetailNodeClassName+'" value="'+data[i].budget_month+'">세부</button></td>	</tr>'
					);
				}
				SipuBudget.graphDrawBar2(data, Nodes.Graph.Stat, Param.DVal.GraphHeight);
				$(Param.Button.StatDetailNodeClass).click(function(){ retItem ($(this)); });
				break;
			case  Param.ajaxMode.ListStatMonthExpense :
				ParamNode =  $(Nodes.Table.Stat).find("tbody");
				ParamNode.empty();
				Param.DVal.StatAJAXkeepValue = data;
				$(ParamNode).append('<tr><th>연월</th><th>금액</th><th></th></tr>');
				row = data.length / Param.DVal.ExpenseCategoryLen;
				for(var i=0; i < row; i++) {
					sum = data.filter(a=>a.budget_month === data[i].budget_month).reduce((s,a)=>s+a.expense_sum,0);
					$(ParamNode).append(
						'<tr>	<td>'+data[i].budget_month+'</td><td>'+sum+'</td>'
						+'<td><button  class="'+Param.Button.StatDetailNodeClassName+'" value="'+data[i].budget_month+'">세부</button></td>	</tr>'
					);
				}
				SipuBudget.graphDrawBar2(data, Nodes.Graph.Stat, Param.DVal.GraphHeight);
				$(Param.Button.StatDetailNodeClass).click(function(){ retItem ($(this)); });
				break;
			case  Param.ajaxMode.ListStatYearIncome :
				ParamNode =  $(Nodes.Table.Stat).find("tbody");
				ParamNode.empty();
				Param.DVal.StatAJAXkeepValue = data;
				$(ParamNode).append('<tr><th>연</th><th>금액</th><th></th></tr>');
				row = data.length / Param.DVal.IncomeCategoryLen;
				for(var i=0; i < row; i++) {
					sum = data.filter(a=>a.budget_year === data[i].budget_year).reduce((s,a)=>s+a.income_sum,0);
					$(ParamNode).append(
						'<tr>	<td>'+data[i].budget_year+'</td><td>'+sum+'</td>'
						+'<td><button  class="'+Param.Button.StatDetailNodeClassName+'" value="'+data[i].budget_year+'">세부</button></td>	</tr>'
					);
				}
				SipuBudget.graphDrawBar2(data, Nodes.Graph.Stat, Param.DVal.GraphHeight);
				$(Param.Button.StatDetailNodeClass).click(function(){ retItem ($(this)); });
				break;
			case  Param.ajaxMode.ListStatYearExpense :
				ParamNode =  $(Nodes.Table.Stat).find("tbody");
				ParamNode.empty();
				Param.DVal.StatAJAXkeepValue = data;
				$(ParamNode).append('<tr><th>연</th><th>금액</th><th></th></tr>');
				row = data.length / Param.DVal.ExpenseCategoryLen;
				for(var i=0; i < row; i++) {
					sum = data.filter(a=>a.budget_year === data[i].budget_year).reduce((s,a)=>s+a.expense_sum,0);
					$(ParamNode).append(
						'<tr>	<td>'+data[i].budget_year+'</td><td>'+sum+'</td>'
						+'<td><button  class="'+Param.Button.StatDetailNodeClassName+'" value="'+data[i].budget_year+'">세부</button></td>	</tr>'
					);
				}
				SipuBudget.graphDrawBar2(data, Nodes.Graph.Stat, Param.DVal.GraphHeight);
				$(Param.Button.StatDetailNodeClass).click(function(){ retItem ($(this)); });
				break;
			case  Param.ajaxMode.ListStatMonthIncomeDetail :
				SipuBudget.graphDrawPie(data, Nodes.Graph.Modal, Param.DVal.GraphHeight);
				break;
			case  Param.ajaxMode.ListStatMonthExpenseDetail :
				SipuBudget.graphDrawPie(data, Nodes.Graph.Modal, Param.DVal.GraphHeight);
				break;
			case  Param.ajaxMode.ListStatYearIncomeDetail :
				SipuBudget.graphDrawPie(data, Nodes.Graph.Modal, Param.DVal.GraphHeight);
				break;
			case  Param.ajaxMode.ListStatYearExpenseDetail :
				SipuBudget.graphDrawPie(data, Nodes.Graph.Modal, Param.DVal.GraphHeight);
				break;
			case  Param.ajaxMode.ListSetAccount :
				ParamNode =  $(Nodes.Table.SetAccount).find("tbody");
				ParamNode.empty();
				$(ParamNode).append('<tr><th>코드</th><th>계좌</th><th>잔액</th></tr>');
				$.each(data, function (index) {
					$(ParamNode).append('<tr>	<td>'+data[index].account_id+'</td><td>'+data[index].account_name+'</td><td>'+data[index].account_value+'</td>	</tr>');
				});
				var sum = data.reduce((sum,a)=>sum+a.account_value,0);
				$(ParamNode).append('<tr><th></th><th>계좌 총 합계</th><th>'+sum+'</th></tr>');
				break;
			case  Param.ajaxMode.ListSetTax :
				window.history.back();
				ParamNode =  $(Nodes.Table.SetTax).find("tbody");
				ParamNode.empty();
				$(ParamNode).append('<tr><th>연</th><th>계좌</th><th>금액</th><th>조회</th></tr>');
				$.each(data, function (index) {
					$(ParamNode).append(
						'<tr>	<td>'+data[index].budget_year+'</td><td>'+data[index].account_name+'</td><td>'+data[index].expense_sum+'</td>	'
						+'<td><button  class="'+Param.Button.TaxDetailNodeClassName+'" value="'+data[index].account_id+'" valueyear="'+data[index].budget_year+'">조회</button></td> </tr>'
					);
				});
				$(Param.Button.TaxDetailNodeClass).click(function(){ retItem ($(this)); });
				break;
			case  Param.ajaxMode.ListSetTaxDetail :
				ParamNode =  $(Nodes.Table.SetTaxdetail).find("tbody");
				ParamNode.empty();
				$(ParamNode).append('<tr><th>연</th><th>계좌</th><th>항목</th><th>금액</th></tr>');
				$.each(data, function (index) {
					$(ParamNode).append('<tr>	<td>'+data[index].budget_date+'</td><td>'+data[index].account_name+'</td><td>'+data[index].category_name+'</td><td>'+data[index].expense_value+'</td>	</tr>');
				});
				break;
			case  Param.ajaxMode.UpdateDayIncome :
				window.history.back();
				bindAJAX(Nodes.ButtonDay.Search);
				break;
			case  Param.ajaxMode.UpdateDayExpense :
				window.history.back();
				bindAJAX(Nodes.ButtonDay.Search);
				break;
			case  Param.ajaxMode.UpdateDayTransfer :
				window.history.back();
				bindAJAX(Nodes.ButtonDay.Search);
				break;
			case  Param.ajaxMode.UpdateSetAccount :
				window.history.back();
				bindAJAX(Nodes.ButtonSet.Account);
				break;
		}
	}
	function delItem ( node) {
		var rqdata;
		switch (node.attr("class")) {
			case  Param.Button.DayIncomeDelNodeClassName :
				rqdata = { RQ :  Param.ajaxMode.DeleteDayIncome,  ID : $(node).val() };
				rqAJAX(Param.ajaxLink.Delete, rqdata, Nodes.ButtonDay.Search, bindAJAX);
				break;
			case  Param.Button.DayExpenseDelNodeClassName :
				rqdata = { RQ :  Param.ajaxMode.DeleteDayExpense,  ID : $(node).val() };
				rqAJAX(Param.ajaxLink.Delete, rqdata, Nodes.ButtonDay.Search, bindAJAX);
				break;
		}
	}
	function retItem(node) {
		var rqdata;
		switch (node.attr("class")) {
		case  Param.Button.TaxDetailNodeClassName :
			rqdata = { RQ :  Param.ajaxMode.ListSetTaxDetail,  ACCOUNT : $(node).val(), VALUE : node.attr("valueyear")	};
			rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListSetTaxDetail, fetchAJAX);
			break;
		case  Param.Button.StatDetailNodeClassName :
			//조건별로 분기 4가지
			if  (Param.DVal.ClickStatButton === Nodes.ButtonStat.MonthIncome ) {
				rqdata = { RQ :  Param.ajaxMode.ListStatMonthIncomeDetail, VALUE : $(node).val()};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListStatMonthIncomeDetail, fetchAJAX);
			}
			if  (Param.DVal.ClickStatButton === Nodes.ButtonStat.MonthExpense ) {
				rqdata = { RQ :  Param.ajaxMode.ListStatMonthExpenseDetail, VALUE :  $(node).val()};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListStatMonthExpenseDetail, fetchAJAX);
			}
			if  (Param.DVal.ClickStatButton === Nodes.ButtonStat.YearIncome ) {
				rqdata = { RQ :  Param.ajaxMode.ListStatYearIncomeDetail, VALUE :  $(node).val()};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListStatYearIncomeDetail, fetchAJAX);
			}
			if  (Param.DVal.ClickStatButton === Nodes.ButtonStat.YearExpense ) {
				rqdata = { RQ :  Param.ajaxMode.ListStatYearExpenseDetail, VALUE :  $(node).val()};
				rqAJAX(Param.ajaxLink.Select, rqdata, Param.ajaxMode.ListStatYearExpenseDetail, fetchAJAX);
			}
			modalShow(Nodes.Modal.ModalSubmitStatDetail, node);
			break;

		}
	}
	function refetchStatCategory (statbutton) {
		var rqdata, av, ParamNode, mdata;
		Param.DVal.StatSelCateValue = $(Nodes.Select.StatCategory).val();
		if (Param.DVal.StatSelCateValue !== Param.DVal.StatAllCateValue) {
			mdata = Param.DVal.StatAJAXkeepValue.filter(a=>a.category_name === Param.DVal.StatSelCateValue);
		} else {
			bindAJAX(statbutton)
		}
		ParamNode = $(Nodes.Table.Stat).find("tbody");
		ParamNode.empty();
		switch (statbutton) {
			case  Nodes.ButtonStat.MonthIncome :
				$(ParamNode).append('<tr><th>연월</th><th>금액</th></tr>');
				av = Math.round(mdata.filter((a,i)=> 0<i && 13>i).reduce((sum,a)=> sum+a.income_sum,0)*1/12);
				mdata.map(a=>{ $(ParamNode).append('<tr>	<td>'+a.budget_month+'</td><td>'+a.income_sum+'</td> </tr>'); });
				break;
			case  Nodes.ButtonStat.MonthExpense :
				$(ParamNode).append('<tr><th>연월</th><th>금액</th></tr>');
				av = Math.round(mdata.filter((a,i)=> 0<i && 13>i).reduce((sum,a)=> sum+a.expense_sum,0)*1/12);
				mdata.map(a=>{ $(ParamNode).append('<tr>	<td>'+a.budget_month+'</td><td>'+a.expense_sum+'</td> </tr>'); });
				break;
			case  Nodes.ButtonStat.YearIncome :
				$(ParamNode).append('<tr><th>연</th><th>금액</th></tr>');
				av = Math.round(mdata.filter((a,i)=> 0<i && 13>i).reduce((sum,a)=> sum+a.income_sum,0)*1/12);
				mdata.map(a=>{ $(ParamNode).append('<tr>	<td>'+a.budget_year+'</td><td>'+a.income_sum+'</td> </tr>'); });
				break;
			case  Nodes.ButtonStat.YearExpense :
				$(ParamNode).append('<tr><th>연</th><th>금액</th></tr>');
				av = Math.round(mdata.filter((a,i)=> 0<i && 13>i).reduce((sum,a)=> sum+a.expense_sum,0)*1/12);
				mdata.map(a=>{ $(ParamNode).append('<tr>	<td>'+a.budget_year+'</td><td>'+a.expense_sum+'</td> </tr>'); });
				break;
		}		
		$(ParamNode).append('<tr><th>평균</th><th>'+av+'</th></tr>');
		SipuBudget.graphDrawBar2(mdata, Nodes.Graph.Stat, Param.DVal.GraphHeight);
	}
	function checkSubmit (button) {
		var checkval;
		switch (button) {
			case Nodes.ButtonModal.SubmitIncome :
				if (!$(Nodes.Input.ModalIncomeQt).val() ) {
					$(Nodes.Input.ModalIncomeQt).attr("placeholder","입력해주세요");
					$(Nodes.Input.ModalIncomeQt).focus();
					return false;
				}
				checkval = checkInput($(Nodes.Input.ModalIncomeQt).val(),CheckText.OnlyNumber);
				$(Nodes.Input.ModalIncomeQt).val(checkval);
				return true;
				break;
			case Nodes.ButtonModal.SubmitExpense :
				if (!$(Nodes.Input.ModalExpenseQt).val() ) {
					$(Nodes.Input.ModalExpenseQt).attr("placeholder","입력해주세요");
					$(Nodes.Input.ModalExpenseQt).focus();
					return false;
				}
				checkval = checkInput($(Nodes.Input.ModalExpenseQt).val(),CheckText.OnlyNumber);
				$(Nodes.Input.ModalExpenseQt).val(checkval);
				return true;
				break;
			case Nodes.ButtonModal.SubmitTransfer:
				if (!$(Nodes.Input.ModalTransferQt).val() ) {
					$(Nodes.Input.ModalTransferQt).attr("placeholder","입력해주세요");
					$(Nodes.Input.ModalTransferQt).focus();
					return false;
				}
				checkval = checkInput($(Nodes.Input.ModalTransferQt).val(),CheckText.OnlyNumber);
				$(Nodes.Input.ModalTransferQt).val(checkval);
				return true;
				break;
			case Nodes.ButtonModal.SubmitAccount:
				if (!$(Nodes.Input.ModalAccountQt).val() ) {
					$(Nodes.Input.ModalAccountQt).attr("placeholder","입력해주세요");
					$(Nodes.Input.ModalAccountQt).focus();
					return false;
				}
				checkval = checkInput($(Nodes.Input.ModalAccountQt).val(),CheckText.OnlyChar);
				$(Nodes.Input.ModalAccountQt).val(checkval);
				return true;
				break;
			case Nodes.ButtonModal.SubmitTax:
				if (!$(Nodes.Input.ModalTaxQt).val() ) {
					$(Nodes.Input.ModalTaxQt).attr("placeholder","입력해주세요");
					$(Nodes.Input.ModalTaxQt).focus();
					return false;
				}
				checkval = checkInput($(Nodes.Input.ModalTaxQt).val(),CheckText.OnlyNumber);
				$(Nodes.Input.ModalTaxQt).val(checkval);
				return true;
				break;
		}
	}
	function graphData (node, data) {
		var graphdata = new Array();
		switch (node) {
			case  Nodes.Graph.Sum:
				graphdata = [["기간","변동"]];
				$.each(data, function () {
					switch (Param.DVal.ClickSumButton) {
						case Nodes.ButtonSum.Day:
							item = [this.budget_date, parseInt(this.income_sum) - parseInt(this.expense_sum)];
						break;
						case Nodes.ButtonSum.Month: 
							item = [this.budget_month, parseInt(this.income_sum)- parseInt(this.expense_sum)];
						break;
						case Nodes.ButtonSum.Year: 
							item = [this.budget_year, parseInt(this.income_sum)- parseInt(this.expense_sum)];
						break;
					}
					graphdata.push(item);
				});
				break;
			case Nodes.Graph.Stat :
				switch (Param.DVal.ClickStatButton) {
					case Nodes.ButtonStat.MonthIncome: 
						var cateArr = Array.from(new Set(data.map(a=>a.category_name)));
						var periodArr = Array.from(new Set(data.map(a=>a.budget_month)));
						graphdata.push(['월'].concat(cateArr));
						periodArr.map(p=>{
							graphdata.push([p].concat(data.filter(a=>a.budget_month === p).map(a=>a.income_sum)));
						});
					break;
					case Nodes.ButtonStat.MonthExpense: 
						var cateArr = Array.from(new Set(data.map(a=>a.category_name)));
						var periodArr = Array.from(new Set(data.map(a=>a.budget_month)));
						graphdata.push(['월'].concat(cateArr));
						periodArr.map(p=>{
							graphdata.push([p].concat(data.filter(a=>a.budget_month === p).map(a=>a.expense_sum)));
						});
					break;
					case Nodes.ButtonStat.YearIncome: 
						var cateArr = Array.from(new Set(data.map(a=>a.category_name)));
						var periodArr = Array.from(new Set(data.map(a=>a.budget_year)));
						graphdata.push(['연'].concat(cateArr));
						periodArr.map(p=>{
							graphdata.push([p].concat(data.filter(a=>a.budget_year === p).map(a=>a.income_sum)));
						});
					break;
					case Nodes.ButtonStat.YearExpense: 
						var cateArr = Array.from(new Set(data.map(a=>a.category_name)));
						var periodArr = Array.from(new Set(data.map(a=>a.budget_year)));
						graphdata.push(['연'].concat(cateArr));
						periodArr.map(p=>{
							graphdata.push([p].concat(data.filter(a=>a.budget_year === p).map(a=>a.expense_sum)));
						});
					break;
				}
				break;
			case Nodes.Graph.Modal :
				graphdata = [["항목","금액"]];
				$.each(data, function () {
					var item;
					if (this.hasOwnProperty("income_sum")) {
						item = [this.category_name, parseInt(this.income_sum)];
					}
					if (this.hasOwnProperty("expense_sum")) {
						item = [this.category_name, parseInt(this.expense_sum)];
					}
					graphdata.push(item);
				});
				break;
		}
		return graphdata;
	}
	SipuBudget.graphDrawBar = function (data, node, vHeight) {
		var graphdata = graphData(node, data);
		var Paramdata = google.visualization.arrayToDataTable(graphdata);
		var options = {	title: ""  ,chartArea: {top:20,width:"70%",height:"90%"}	,hAxis: {  minValue: 0}	};
		var chart = new google.visualization.BarChart(document.getElementById(node.replace("#","")));
		chart.draw(Paramdata, options);
	};
	SipuBudget.graphDrawBar2 = function (data, node, vHeight) {
		var graphdata = graphData(node, data);
		var Paramdata = google.visualization.arrayToDataTable(graphdata);
		var options = {	title: ""  ,chartArea: {top:20,width:"70%",height:"90%"}	,hAxis: {  minValue: 0}, isStacked: true	};
		var chart = new google.visualization.BarChart(document.getElementById(node.replace("#","")));
		chart.draw(Paramdata, options);
	};
	SipuBudget.graphDrawPie = function (data, node, vHeight) {
		var graphdata = graphData(node, data);
		var Paramdata = google.visualization.arrayToDataTable(graphdata);
		var options = {	title: "" ,legend: 'none' ,chartArea: { width:"90%",height:"90%"} ,hAxis: {  minValue: 0}};
		var chart = new google.visualization.PieChart(document.getElementById(node.replace("#","")));
		chart.draw(Paramdata, options);
	};
	function rqAJAX (Geturl, rqdata, rq, func) {
		$.ajax({
			url: Geturl
			,type : "POST"
			,data : rqdata
			,beforeSend: function(xhr){
				if (xhr.overrideMimeType) {
					xhr.overrideMimeType("application/json");
				}
			}
			,dataType : 'json'
			,scriptCharParam: "utf-8"
			,error : function (jqXHR, textStatus, errorThrown) {
			}
		})
		.done(function (data) {
			return func(rq, data);
		})
		.fail(function() {
			console.log("송수신 실패");
			window.location = "/Budget/Login";
		});
	}
	function checkInput(obj, type) {
		var pattern;
		switch (type) {
			case CheckText.OnlyChar :
			pattern = /[^(가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9)]/gi;   // 특수문자 제거
				break;
			case CheckText.OutSpecial:
			pattern = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi
				break;
			case CheckText.OnlyNumber:
			pattern = /[^\d\.]/g;   // 숫자이외는 제거
				break;
		}
		if(pattern.test(obj)){
			obj = obj.replace(pattern,"");
		}
		return obj;
	}
	function init() {
		bindAJAX(Nodes.ButtonDay.Income);
		bindAJAX(Nodes.ButtonDay.Expense);
	}
	SipuBudget.run = function () {
		//설정값 가지고 오기위한 실행
		init();
		//기본실행
		uiWorker();
	};
    return SipuBudget;
})(window.SipuBudget || {}, $);
SipuBudget.run();
