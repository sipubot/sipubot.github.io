const TAXCOMMON = (() => {
    "use strict";

    // ── DATANODES ───────────────────────────────────────────────────────────────

    const DATANODES = {
        init() {
            for (const node of document.getElementsByTagName("*")) {
                const val = node.getAttribute("data-node");
                if (!val) continue;
                const [ns, key] = val.split("-");
                if (!key) continue;
                if (!DATANODES[ns]) DATANODES[ns] = {};
                DATANODES[ns][key] = node;
            }
        }
    };
    DATANODES.init();

    // ── STATE ────────────────────────────────────────────────────────────────────

    const STATE = {
        accounts   : [],
        allTrades  : [],
        taxRows    : [],
        tickers    : {},
        selSell    : null,
        selBuys    : [],
        splitTarget: null,
        pfLoaded   : false,
    };

    // ── RQ_WK(obj, params?) ──────────────────────────────────────────────────────

    function RQ_WK(obj, params) {
        const url    = "http://sipubot.iptime.org:2790" +(obj.ADD_URL || "") + (params != null ? buildQs(params) : "");
        const method = obj.rqMethod || "POST";
        const data   = typeof obj.rqData === "function" ? obj.rqData() : obj.rqData;
        const rsFunc = obj.rsFunc || (d => console.log(d));
        const init   = { method, credentials: "include", mode: "cors", cache: "default",
                         headers: new Headers({ "Content-Type": "application/json" }) };
        if (method !== "GET" && data !== undefined) init.body = JSON.stringify(data);
        fetch(url, init)
            .then(res => { if (!res.ok) { console.log("fail", url, res.status); return; } res.json().then(rsFunc); })
            .catch(err => console.log("fetch error:", err.message, url));
    }

    // ── UI_WK ────────────────────────────────────────────────────────────────────

    const UI_WK = {
        isHTML: obj => obj instanceof HTMLElement,
        setNodeValue(obj, format, data, reset) {
            try {
                if (!UI_WK.isHTML(obj)) return;
                if (reset) obj.innerHTML = "";
                if (!Array.isArray(data)) data = [data];
                obj.innerHTML += data.reduce((st, item) => {
                    let t = UI_WK.isHTML(format) ? format.cloneNode(true).innerHTML : format;
                    Object.entries(item).forEach(([k, v]) => { t = t.split(`{${k}}`).join(v ?? ""); });
                    return st + t;
                }, "");
            } catch (e) { console.log(e); }
        },
        getNodeValue: obj => (UI_WK.isHTML(obj) && ["INPUT","TEXTAREA","SELECT"].includes(obj.tagName)) ? obj.value : "",
        setEvent(obj, func) {
            if (UI_WK.isHTML(obj) && typeof func === "function") obj.addEventListener("click", func, false);
        },
        preventDoubleClick(obj) {
            if (!UI_WK.isHTML(obj)) return;
            obj.setAttribute("disabled", true);
            setTimeout(() => obj.removeAttribute("disabled"), 1500);
        }
    };

    // ── 포맷 헬퍼 ────────────────────────────────────────────────────────────────

    const fmtMoney = (n, dec) => n == null ? "-" :
        Number(n).toLocaleString("ko-KR", { minimumFractionDigits: dec ?? 2, maximumFractionDigits: dec ?? 2 });
    const fmtQty = n => (n == null || n === 0) ? "-" : Number(n).toLocaleString("ko-KR", { maximumFractionDigits: 4 });
    const pnlClass    = v => Number(v) >= 0 ? "pnl-pos" : "pnl-neg";
    const txTypeLabel = t => ({ deposit: "예수금", interest: "이자", other: "기타" }[t] || t);
    const parsePaste  = text => text.trim().split("\n").map(row => row.split("\t").map(c => c.trim()));
    const parseTradeId = id => id?.length >= 6 ? { account: id.slice(0, 2), ticker: id.slice(2, id.length - 4) } : null;

    // 포트폴리오 손익 td 헬퍼
    const pnlTd  = v => `<td class="text-right ${v != null ? pnlClass(v) : ""}">${v != null ? fmtMoney(v) : "-"}</td>`;
    const pnlTdP = v => `<td class="text-right ${v != null ? pnlClass(v) : ""}">${v != null ? `${fmtMoney(v)}%` : "-"}</td>`;

    // ── 필터 헬퍼 ────────────────────────────────────────────────────────────────

    function buildQs(params) {
        if (!params) return "";
        const parts = Object.entries(params).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
        return parts.length ? `?${parts.join("&")}` : "";
    }
    const dateFilter = monthNode => {
        const val = monthNode && UI_WK.getNodeValue(monthNode);
        return val ? { month: val } : {};
    };
    function setCurrentMonth(monthNode) {
        if (!UI_WK.isHTML(monthNode) || monthNode.value) return;
        const d = new Date();
        monthNode.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }

    function populateTickerSelect(sel, tickers) {
        if (!UI_WK.isHTML(sel)) return;
        const prev = sel.value;
        sel.innerHTML = `<option value="">전체</option>` +
            tickers.map(t => `<option${t === prev ? " selected" : ""}>${t}</option>`).join("");
    }

    // ── 공통 UI 헬퍼 ─────────────────────────────────────────────────────────────

    function populateAccountSelects(accounts) {
        // ACCTX-accselect는 TAXACCOUNTGET.rsFunc에서 별도 관리 (전체 없음)
        [DATANODES.TRADES.accselect, DATANODES.DIV.accselect, DATANODES.MATCH.accselect, DATANODES.TAXOUT.accselect, DATANODES.PF.accselect]
            .filter(sel => UI_WK.isHTML(sel))
            .forEach(sel => {
                const hasAll = sel.options.length > 0 && sel.options[0].value === "";
                sel.innerHTML = hasAll ? sel.options[0].outerHTML : "";
                accounts.forEach(a => { const o = new Option(`${a.name} (${a.code})`, a.code); sel.appendChild(o); });
            });
    }

    function refreshPortfolio() {
        if (!STATE.pfLoaded) return;
        RQ_WK({ ADD_URL: `/tax/portfolio${buildQs({ account: UI_WK.getNodeValue(DATANODES.PF.accselect) })}`,
                rqMethod: "GET", rsFunc: renderPortfolio });
    }

    function reloadTrades() {
        const params = dateFilter(DATANODES.TRADES.month);
        const account = UI_WK.getNodeValue(DATANODES.TRADES.accselect);
        if (account) params.account = account;
        RQ_WK(JOB_WK.TRADESGET, params);
    }


    // ── 이벤트 위임 헬퍼 ─────────────────────────────────────────────────────────

    function onBtn(tbody, selector, handler) {
        tbody.querySelectorAll(selector).forEach(btn => btn.addEventListener("click", handler));
    }

    // ── JOB_WK ───────────────────────────────────────────────────────────────────

    const JOB_WK = {

        // ── 계좌 목록 ──────────────────────────────────────────────────────────
        TAXACCOUNTGET: {
            ADD_URL : "/tax/accounts",
            rqMethod: "GET",
            rsFunc(data) {
                STATE.accounts = data || [];
                // 계좌 설정 테이블
                UI_WK.setNodeValue(DATANODES.ACCOUNT.tbody, DATANODES.ACCOUNT.template,
                    STATE.accounts.map(a => ({ name: a.name, code: a.code })), true);
                DATANODES.ACCOUNT.tbody.querySelectorAll(".account-del")
                    .forEach(btn => btn.addEventListener("click", () => btn.closest("tr").remove()));
                // 공통 계좌 셀렉트 채우기
                populateAccountSelects(STATE.accounts);
                // 이체 전용 (전체 없음)
                const sel = DATANODES.ACCTX.accselect;
                if (UI_WK.isHTML(sel)) {
                    sel.innerHTML = "";
                    STATE.accounts.forEach(a => { const o = new Option(`${a.name} (${a.code})`, a.code); sel.appendChild(o); });
                }
            },
            doOnload: true,
            init() {}
        },

        // ── 종목명 맵 ──────────────────────────────────────────────────────────
        TICKERGET: {
            ADD_URL : "/tax/tickers",
            rqMethod: "GET",
            rsFunc(data) {
                STATE.tickers = {};
                (data || []).forEach(t => { STATE.tickers[t.ticker] = t.name; });
                // 티커 모달 테이블
                const obj = DATANODES.TICKER.tbody;
                if (!obj) return;
                obj.innerHTML = "";
                (data || []).forEach(t => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `<td>${t.ticker}</td><td>${t.name}</td>
                        <td><button class="btn btn-sm btn-outline-danger ticker-del" data-ticker="${t.ticker}">-</button></td>`;
                    obj.appendChild(tr);
                });
                onBtn(obj, ".ticker-del", e => {
                    const ticker = e.currentTarget.dataset.ticker;
                    RQ_WK({ ADD_URL: `/tax/tickers/${ticker}`, rqMethod: "DELETE", rsFunc: () => RQ_WK(JOB_WK.TICKERGET) });
                });
            },
            doOnload: true,
            init() {
                UI_WK.setEvent(DATANODES.TAXOUT.tickerbtn, () => { RQ_WK(JOB_WK.TICKERGET); $("#ticker-modal").modal("show"); });
                UI_WK.setEvent(DATANODES.TICKER.addbtn, () => {
                    const ticker = (DATANODES.TICKER.tickerinput.value || "").trim().toUpperCase();
                    const name   = (DATANODES.TICKER.nameinput.value   || "").trim();
                    DATANODES.TICKER.msg.textContent = "";
                    if (!ticker || !name) { DATANODES.TICKER.msg.textContent = "티커와 종목명을 입력하세요"; return; }
                    RQ_WK({ ADD_URL: "/tax/tickers", rqMethod: "POST", rqData: { ticker, name }, rsFunc: () => {
                        DATANODES.TICKER.tickerinput.value = DATANODES.TICKER.nameinput.value = "";
                        RQ_WK(JOB_WK.TICKERGET);
                    }});
                });
                DATANODES.TICKER.nameinput?.addEventListener("keydown", e => { if (e.key === "Enter") DATANODES.TICKER.addbtn.click(); });
                DATANODES.TICKER.pastezone.addEventListener("paste", e => {
                    e.preventDefault();
                    parsePaste(e.clipboardData.getData("text")).forEach(cols => {
                        if (!cols[0] || !cols[1]) return;
                        RQ_WK({ ADD_URL: "/tax/tickers", rqMethod: "POST",
                                rqData: { ticker: cols[0].toUpperCase(), name: cols[1] },
                                rsFunc: () => RQ_WK(JOB_WK.TICKERGET) });
                    });
                    DATANODES.TICKER.pastezone.textContent = "";
                });
            }
        },

        // ── 환율 조회 ──────────────────────────────────────────────────────────
        RATESGET: {
            ADD_URL : "/tax/exchange-rates",
            rqMethod: "GET",
            rsFunc(data) {
                const obj = DATANODES.RATES.tbody;
                obj.innerHTML = "";
                (data || []).forEach(r => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `<td>${r.date}</td><td class="text-right">${fmtMoney(r.rate)}</td>
                        <td><button class="btn btn-sm btn-outline-danger rates-del" data-date="${r.date}">-</button></td>`;
                    obj.appendChild(tr);
                });
                onBtn(obj, ".rates-del", e => {
                    const mo = DATANODES.RATES.month;
                    RQ_WK({ ADD_URL: `/tax/exchange-rates/${e.currentTarget.dataset.date}`, rqMethod: "DELETE",
                            rsFunc: () => RQ_WK(JOB_WK.RATESGET, dateFilter(mo)) });
                });
            },
            doOnload: false,
            init() {
                const mo = DATANODES.RATES.month;
                setCurrentMonth(mo);
                UI_WK.setEvent(DATANODES.RATES.loadbtn, () => RQ_WK(JOB_WK.RATESGET, dateFilter(mo)));
                UI_WK.setEvent(DATANODES.RATES.addbtn,  () => addRatesRow());
                DATANODES.RATES.pastezone.addEventListener("paste", e => {
                    e.preventDefault();
                    const rows = parsePaste(e.clipboardData.getData("text")).filter(r => r[0]);
                    let done = 0;
                    rows.forEach(cols => {
                        const rate = parseFloat((cols[1] || "").replace(/,/g, ""));
                        if (isNaN(rate)) return;
                        RQ_WK({ ADD_URL: "/tax/exchange-rates", rqMethod: "POST", rqData: { date: cols[0], rate },
                                rsFunc: () => { if (++done >= rows.length) { RQ_WK(JOB_WK.RATESGET, dateFilter(mo)); DATANODES.RATES.pastezone.textContent = ""; } } });
                    });
                });
            }
        },

        // ── 거래내역 조회 (매수/매도 전용) ────────────────────────────────────────
        TRADESGET: {
            ADD_URL : "/tax/trades",
            rqMethod: "GET",
            rsFunc(data) {
                STATE.allTrades = data || [];
                const trObj = DATANODES.TRADE.tbody;
                trObj.innerHTML = "";
                const tickers = new Set();
                STATE.allTrades.filter(t => t.buy_qty > 0 || t.sell_qty > 0).forEach(t => {
                    tickers.add(t.ticker);
                    const isBuy = t.buy_qty > 0;
                    const qty   = isBuy ? t.buy_qty : t.sell_qty;
                    const tr    = document.createElement("tr");
                    tr.className = `${isBuy ? "row-buy" : "row-sell"}${t.match_key ? " row-matched" : ""}`;
                    tr.dataset.ticker = t.ticker;
                    tr.innerHTML = `
                        <td>${t.trade_id}</td><td>${t.account}</td><td>${t.ticker}</td><td>${t.date}</td>
                        <td class="text-right">${isBuy  ? fmtQty(t.buy_qty)  : ""}</td>
                        <td class="text-right">${!isBuy ? fmtQty(t.sell_qty) : ""}</td>
                        <td class="text-right">${fmtMoney(t.buy_amount)}</td>
                        <td class="text-right">${fmtMoney(t.sell_amount)}</td>
                        <td class="text-right">${fmtMoney(t.fee)}</td>
                        <td>${t.match_key ? "✓" : ""}</td>
                        <td>${!t.match_key ? `
                            <button class="btn btn-sm btn-outline-secondary trade-split mr-1"
                                data-id="${t.trade_id}" data-ticker="${t.ticker}" data-account="${t.account}" data-qty="${qty}">쪼개기</button>
                            <button class="btn btn-sm btn-outline-danger trade-del"
                                data-id="${t.trade_id}" data-ticker="${t.ticker}" data-account="${t.account}">-</button>` : ""}</td>`;
                    if (!t.match_key) {
                        tr.title = "더블클릭으로 편집";
                        tr.addEventListener("dblclick", e => { if (e.target.tagName !== "BUTTON") openTradeEdit(tr, t); });
                    }
                    trObj.appendChild(tr);
                });
                onBtn(trObj, ".trade-del", e => {
                    if (!confirm("삭제하시겠습니까?")) return;
                    const { ticker, account, id } = e.currentTarget.dataset;
                    RQ_WK({ ADD_URL: `/tax/trades/${ticker}/${account}/${id}`, rqMethod: "DELETE",
                            rsFunc: () => { reloadTrades(); refreshPortfolio(); } });
                });
                onBtn(trObj, ".trade-split", e => openSplitModal(e.currentTarget.dataset));
                populateTickerSelect(DATANODES.TRADES.ticker, [...tickers].sort());
                updateMatchTickerDropdown();
            },
            doOnload: false,
            init() {
                const mo  = DATANODES.TRADES.month;
                const acc = DATANODES.TRADES.accselect;
                setCurrentMonth(mo);
                const load = () => {
                    const params = dateFilter(mo);
                    const account = UI_WK.getNodeValue(acc);
                    if (account) params.account = account;
                    RQ_WK(JOB_WK.TRADESGET, params);
                };
                UI_WK.setEvent(DATANODES.TRADES.loadbtn, load);
                DATANODES.TRADES.ticker?.addEventListener("change", () => {
                    const val = UI_WK.getNodeValue(DATANODES.TRADES.ticker);
                    DATANODES.TRADE.tbody.querySelectorAll("tr[data-ticker]").forEach(tr => {
                        tr.style.display = val && tr.dataset.ticker !== val ? "none" : "";
                    });
                });
                UI_WK.setEvent(DATANODES.TRADE.addbtn, addTradeRow);
                DATANODES.TRADE.pastezone.addEventListener("paste", e => {
                    e.preventDefault();
                    const items = parsePaste(e.clipboardData.getData("text")).flatMap(cols => {
                        let c = cols;
                        if (/^[A-Z]{2}[A-Z]+\d{4}$/.test(c[0])) c = c.slice(1);
                        if (!c[0] || !c[1] || !c[2]) return [];
                        return [{ ticker: c[1], account: c[0], date: c[2],
                                  buy_qty: parseFloat(c[3]) || 0, sell_qty: parseFloat(c[4]) || 0,
                                  buy_amount:  parseFloat((c[5] || "").replace(/,/g, "")) || 0,
                                  sell_amount: parseFloat((c[6] || "").replace(/,/g, "")) || 0,
                                  fee:         parseFloat((c[7] || "").replace(/,/g, "")) || 0,
                                  dividend: null, dividend_tax: null }];
                    });
                    if (!items.length) return;
                    RQ_WK({ ADD_URL: "/tax/trades/bulk", rqMethod: "POST", rqData: items,
                            rsFunc: () => { reloadTrades(); refreshPortfolio(); DATANODES.TRADE.pastezone.textContent = ""; } });
                });
                load();
            }
        },

        // ── 배당 조회 (배당 탭 독립 필터) ────────────────────────────────────────
        DIVGET: {
            ADD_URL : "/tax/trades",
            rqMethod: "GET",
            rsFunc(data) {
                const divObj = DATANODES.DIV.tbody;
                divObj.innerHTML = "";
                const tickers = new Set();
                (data || []).filter(t => t.dividend > 0).forEach(t => {
                    tickers.add(t.ticker);
                    const tr = document.createElement("tr");
                    tr.className = "row-div";
                    tr.dataset.ticker = t.ticker;
                    tr.innerHTML = `
                        <td>${t.trade_id}</td><td>${t.account}</td><td>${t.ticker}</td><td>${t.date}</td>
                        <td class="text-right">${fmtMoney(t.dividend)}</td>
                        <td class="text-right">${fmtMoney(t.dividend_tax)}</td>
                        <td class="text-right">${fmtMoney((t.dividend || 0) - (t.dividend_tax || 0))}</td>
                        <td><button class="btn btn-sm btn-outline-danger div-del"
                            data-id="${t.trade_id}" data-ticker="${t.ticker}" data-account="${t.account}">-</button></td>`;
                    divObj.appendChild(tr);
                });
                onBtn(divObj, ".div-del", e => {
                    if (!confirm("삭제하시겠습니까?")) return;
                    const { ticker, account, id } = e.currentTarget.dataset;
                    RQ_WK({ ADD_URL: `/tax/trades/${ticker}/${account}/${id}`, rqMethod: "DELETE",
                            rsFunc: () => {
                        const p = dateFilter(DATANODES.DIV.month);
                        const a = UI_WK.getNodeValue(DATANODES.DIV.accselect);
                        if (a) p.account = a;
                        RQ_WK(JOB_WK.DIVGET, p);
                        refreshPortfolio();
                    } });
                });
                populateTickerSelect(DATANODES.DIV.ticker, [...tickers].sort());
            },
            doOnload: false,
            init() {
                const mo  = DATANODES.DIV.month;
                const acc = DATANODES.DIV.accselect;
                setCurrentMonth(mo);
                const load = () => {
                    const params = dateFilter(mo);
                    const account = UI_WK.getNodeValue(acc);
                    if (account) params.account = account;
                    RQ_WK(JOB_WK.DIVGET, params);
                };
                UI_WK.setEvent(DATANODES.DIV.loadbtn, load);
                DATANODES.DIV.ticker?.addEventListener("change", () => {
                    const val = UI_WK.getNodeValue(DATANODES.DIV.ticker);
                    DATANODES.DIV.tbody.querySelectorAll("tr[data-ticker]").forEach(tr => {
                        tr.style.display = val && tr.dataset.ticker !== val ? "none" : "";
                    });
                });
                UI_WK.setEvent(DATANODES.DIV.addbtn, addDivRow);
                DATANODES.DIV.pastezone.addEventListener("paste", e => {
                    e.preventDefault();
                    const items = parsePaste(e.clipboardData.getData("text")).flatMap(cols => {
                        let c = cols;
                        if (/^[A-Z]{2}[A-Z]+\d{4}$/.test(c[0])) c = c.slice(1);
                        if (!c[0] || !c[1] || !c[2]) return [];
                        return [{ ticker: c[1], account: c[0], date: c[2],
                                  buy_qty: 0, sell_qty: 0, buy_amount: 0, sell_amount: 0, fee: 0,
                                  dividend:     parseFloat((c[3] || "").replace(/,/g, "")) || 0,
                                  dividend_tax: parseFloat((c[4] || "").replace(/,/g, "")) || 0 }];
                    });
                    if (!items.length) return;
                    RQ_WK({ ADD_URL: "/tax/trades/bulk", rqMethod: "POST", rqData: items,
                            rsFunc: () => {
                                load();
                                refreshPortfolio();
                                DATANODES.DIV.pastezone.textContent = "";
                            } });
                });
                load();
            }
        },

        // ── 이체 조회 ──────────────────────────────────────────────────────────
        ACCTXGET: {
            ADD_URL : "/tax/account-transactions",
            rqMethod: "GET",
            rsFunc(data) {
                const account = UI_WK.getNodeValue(DATANODES.ACCTX.accselect);
                const obj = DATANODES.ACCTX.tbody;
                obj.innerHTML = "";
                (data || []).forEach(t => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${t.trade_id}</td><td>${t.date}</td><td>${txTypeLabel(t.tx_type)}</td>
                        <td class="text-right ${pnlClass(t.amount)}">${fmtMoney(t.amount)}</td>
                        <td>${t.memo || ""}</td>
                        <td><button class="btn btn-sm btn-outline-danger acctx-del"
                            data-id="${t.trade_id}" data-account="${account || ""}">-</button></td>`;
                    obj.appendChild(tr);
                });
                onBtn(obj, ".acctx-del", e => {
                    if (!confirm("삭제하시겠습니까?")) return;
                    const { account: acc, id } = e.currentTarget.dataset;
                    const mo = DATANODES.ACCTX.month;
                    RQ_WK({ ADD_URL: `/tax/account-transactions/${acc}/${id}`, rqMethod: "DELETE",
                            rsFunc: () => RQ_WK({ ADD_URL: `${JOB_WK.ACCTXGET.ADD_URL}/${acc}`, rqMethod: "GET",
                                                   rsFunc: JOB_WK.ACCTXGET.rsFunc }, dateFilter(mo)) });
                });
            },
            doOnload: false,
            init() {
                const mo  = DATANODES.ACCTX.month;
                const acc = DATANODES.ACCTX.accselect;
                setCurrentMonth(mo);
                const loadAccTx = () => {
                    const account = UI_WK.getNodeValue(acc);
                    if (!account) return;
                    RQ_WK({ ADD_URL: `${JOB_WK.ACCTXGET.ADD_URL}/${account}`, rqMethod: "GET", rsFunc: JOB_WK.ACCTXGET.rsFunc }, dateFilter(mo));
                };
                acc.addEventListener("change", loadAccTx);
                UI_WK.setEvent(DATANODES.ACCTX.loadbtn, loadAccTx);
                UI_WK.setEvent(DATANODES.ACCTX.addbtn, () => {
                    const account = UI_WK.getNodeValue(acc);
                    if (account) addAccTxRow(account, loadAccTx);
                });
                DATANODES.ACCTX.pastezone.addEventListener("paste", e => {
                    e.preventDefault();
                    const account = UI_WK.getNodeValue(acc);
                    if (!account) return;
                    const typeMap = { "예수금": "deposit", "이자": "interest", "기타": "other" };
                    const items = parsePaste(e.clipboardData.getData("text")).flatMap(cols => {
                        let c = cols;
                        if (/^[A-Z]{2}(DEP|INT|ETC)\d{4}$/.test(c[0])) c = c.slice(1);
                        if (!c[0]) return [];
                        return [{ date: c[0], tx_type: typeMap[c[1]] || c[1] || "other",
                                  amount: parseFloat((c[2] || "").replace(/,/g, "")) || 0, memo: c[3] || "" }];
                    });
                    if (!items.length) return;
                    RQ_WK({ ADD_URL: `/tax/account-transactions/${account}/bulk`, rqMethod: "POST", rqData: items,
                            rsFunc: () => { loadAccTx(); DATANODES.ACCTX.pastezone.textContent = ""; } });
                });
            }
        },

        // ── 매칭 워크플로우 ────────────────────────────────────────────────────
        MATCHINIT: {
            doOnload: false,
            init() {
                DATANODES.MATCH.accselect.addEventListener("change", updateMatchTickerDropdown);
                UI_WK.setEvent(DATANODES.MATCH.loadbtn, loadMatchData);
                UI_WK.setEvent(DATANODES.MATCH.dobtn, () => { if (STATE.selSell && STATE.selBuys.length) doMatch(); });
            }
        },

        // ── 세금산출 ───────────────────────────────────────────────────────────
        TAXOUTGET: {
            doOnload: false,
            init() {
                UI_WK.setEvent(DATANODES.TAXOUT.loadbtn, () => {
                    const qs = buildQs({ account: UI_WK.getNodeValue(DATANODES.TAXOUT.accselect), year: UI_WK.getNodeValue(DATANODES.TAXOUT.year) });
                    RQ_WK({ ADD_URL: `/tax/tax-output${qs}`, rqMethod: "GET", rsFunc: rows => {
                        STATE.taxRows = rows || [];
                        const obj = DATANODES.TAXOUT.tbody;
                        obj.innerHTML = "";
                        STATE.taxRows.forEach(r => {
                            const tr = document.createElement("tr");
                            tr.innerHTML = `
                                <td>${r.account}</td><td>${r.ticker}</td>
                                <td class="text-muted">${STATE.tickers[r.ticker] || ""}</td>
                                <td>${r.sell_date}</td>
                                <td class="text-right">${fmtQty(r.qty || 0)}</td>
                                <td class="text-right">${fmtMoney(r.buy_amount_krw,  0)}</td>
                                <td class="text-right">${fmtMoney(r.sell_amount_krw, 0)}</td>
                                <td class="text-right">${fmtMoney(r.expense_krw,     0)}</td>
                                <td class="text-right ${pnlClass(r.profit_krw)}">${fmtMoney(r.profit_krw, 0)}</td>`;
                            obj.appendChild(tr);
                        });
                        const total = STATE.taxRows.reduce((s, r) => s + r.profit_krw, 0);
                        const td = DATANODES.TAXOUT.total.querySelector("td:last-child");
                        if (td) { td.textContent = fmtMoney(total, 0); td.className = `text-right ${pnlClass(total)}`; }
                    }});
                    RQ_WK({ ADD_URL: `/tax/tax-output/validate${qs}`, rqMethod: "GET", rsFunc: v => {
                        if (v && !v.valid && v.missing_dates?.length) {
                            DATANODES.TAXOUT.alert.textContent = `⚠ 환율 누락: ${v.missing_dates.join(", ")}`;
                            DATANODES.TAXOUT.alert.classList.remove("d-none");
                        } else { DATANODES.TAXOUT.alert?.classList.add("d-none"); }
                    }});
                });
                UI_WK.setEvent(DATANODES.TAXOUT.copybtn, () => {
                    const hdrs = ["계좌","티커","종목명","판매일자","취득가액(KRW)","양도가액(KRW)","필요경비(KRW)","양도차익(KRW)"];
                    const rows = STATE.taxRows.map(r =>
                        [r.account, r.ticker, STATE.tickers[r.ticker] || "", r.sell_date,
                         r.buy_amount_krw, r.sell_amount_krw, r.expense_krw, r.profit_krw].join("\t")
                    );
                    const total = STATE.taxRows.reduce((s, r) => s + r.profit_krw, 0);
                    navigator.clipboard?.writeText([hdrs.join("\t"), ...rows, `합계\t\t\t\t\t\t\t${total}`].join("\n"))
                        .then(() => alert("클립보드에 복사됨"));
                });
            }
        },

        // ── 포트폴리오 ─────────────────────────────────────────────────────────
        PFGET: {
            doOnload: false,
            init() {
                UI_WK.setEvent(DATANODES.PF.recalcbtn, () => {
                    UI_WK.preventDoubleClick(DATANODES.PF.recalcbtn);
                    RQ_WK({ ADD_URL: "/tax/portfolio/recalculate", rqMethod: "POST", rsFunc: () => {
                        DATANODES.PF.recalcbtn.textContent = "재계산 완료";
                        setTimeout(() => { DATANODES.PF.recalcbtn.textContent = "재계산"; }, 2000);
                    }});
                });
                UI_WK.setEvent(DATANODES.PF.loadbtn, () => {
                    const qs = buildQs({ account: UI_WK.getNodeValue(DATANODES.PF.accselect) });
                    RQ_WK({ ADD_URL: `/tax/portfolio${qs}`, rqMethod: "GET",
                            rsFunc: data => { STATE.pfLoaded = true; renderPortfolio(data); } });
                    UI_WK.preventDoubleClick(DATANODES.PF.loadbtn);
                });
                UI_WK.setEvent(DATANODES.PF.yearbtn, () => {
                    const qs = buildQs({ account: UI_WK.getNodeValue(DATANODES.PF.accselect), year: UI_WK.getNodeValue(DATANODES.PF.year) });
                    RQ_WK({ ADD_URL: `/tax/portfolio/yearly${qs}`, rqMethod: "GET", rsFunc: data => {
                        if (!data) return;
                        const obj = DATANODES.PF.yeartbody;
                        obj.innerHTML = "";
                        (data.by_account || []).forEach(a => {
                            const tr = document.createElement("tr");
                            tr.innerHTML = `
                                <td>${a.account}</td>
                                <td class="text-right ${pnlClass(a.realized_pnl)}">${fmtMoney(a.realized_pnl)}</td>
                                <td class="text-right">${fmtMoney(a.dividend)}</td>
                                <td class="text-right">${fmtMoney(a.dividend_tax)}</td>
                                <td class="text-right">${fmtMoney(a.net_dividend)}</td>
                                <td class="text-right ${pnlClass(a.total_income)}">${fmtMoney(a.total_income)}</td>
                                <td class="text-right">${fmtMoney(a.cash_balance)}</td>`;
                            obj.appendChild(tr);
                        });
                        const t = data.total || {};
                        const tot = document.createElement("tr");
                        tot.className = "font-weight-bold";
                        tot.innerHTML = `
                            <td>전체</td>
                            <td class="text-right ${pnlClass(t.realized_pnl)}">${fmtMoney(t.realized_pnl)}</td>
                            <td class="text-right">${fmtMoney(t.dividend)}</td>
                            <td class="text-right">${fmtMoney(t.dividend_tax)}</td>
                            <td class="text-right">${fmtMoney(t.net_dividend)}</td>
                            <td class="text-right ${pnlClass(t.total_income)}">${fmtMoney(t.total_income)}</td>
                            <td class="text-right">${fmtMoney(t.cash_balance)}</td>`;
                        obj.appendChild(tot);
                    }});
                });
            }
        },

        // ── 계좌 설정 ──────────────────────────────────────────────────────────
        ACCOUNTSET: {
            doOnload: false,
            init() {
                UI_WK.setEvent(DATANODES.ACCOUNT.savebtn, () => {
                    DATANODES.ACCOUNT.tbody.querySelectorAll("tr").forEach(tr => {
                        const name = tr.querySelector("[data-node='ACCOUNT-name']");
                        const code = tr.querySelector("[data-node='ACCOUNT-code']");
                        if (name?.value && code?.value)
                            RQ_WK({ ADD_URL: "/tax/accounts", rqMethod: "POST",
                                    rqData: { name: name.value.trim(), code: code.value.trim().toUpperCase() },
                                    rsFunc: () => RQ_WK(JOB_WK.TAXACCOUNTGET) });
                    });
                    UI_WK.preventDoubleClick(DATANODES.ACCOUNT.savebtn);
                });
                UI_WK.setEvent(DATANODES.ACCOUNT.addbtn, () => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td><input data-node="ACCOUNT-name" type="text" class="${INP_CLS}" placeholder="계좌명"></td>
                        <td><input data-node="ACCOUNT-code" type="text" class="${INP_CLS}" placeholder="코드(2자)" maxlength="2" style="text-transform:uppercase"></td>
                        <td><button type="button" class="btn btn-sm btn-outline-danger account-del">-</button></td>`;
                    tr.querySelector(".account-del").addEventListener("click", () => tr.remove());
                    DATANODES.ACCOUNT.tbody.appendChild(tr);
                });
            }
        }
    };

    // ── 포트폴리오 렌더 (refreshPortfolio에서 재사용) ────────────────────────────

    function renderPortfolio(data) {
        if (!data) return;
        if (data.last_updated && DATANODES.PF.updated)
            DATANODES.PF.updated.textContent = `업데이트: ${new Date(data.last_updated * 1000).toLocaleString("ko-KR")}`;
        const obj = DATANODES.PF.tbody;
        obj.innerHTML = "";
        const groups = {};
        (data.rows || []).forEach(r => { (groups[r.account] ??= []).push(r); });
        Object.entries(groups).forEach(([acc, rows]) => {
            const hdr = document.createElement("tr");
            hdr.innerHTML = `<td colspan="16" class="font-weight-bold">📁 ${acc}</td>`;
            obj.appendChild(hdr);
            rows.forEach(r => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${r.ticker}</td>
                    <td class="text-right">${fmtQty(r.total_buy_qty)}</td>
                    <td class="text-right">${fmtQty(r.total_sell_qty)}</td>
                    <td class="text-right">${fmtQty(r.remaining_qty)}</td>
                    <td class="text-right">${fmtMoney(r.total_buy_amount)}</td>
                    <td class="text-right">${fmtMoney(r.total_sell_amount)}</td>
                    <td class="text-right">${fmtMoney(r.total_dividend)}</td>
                    <td class="text-right">${fmtMoney(r.total_dividend_tax)}</td>
                    <td class="text-right">${fmtMoney(r.avg_buy_price)}</td>
                    <td class="text-right">${r.current_price != null ? fmtMoney(r.current_price) : "-"}</td>
                    <td class="text-right">${r.market_value  != null ? fmtMoney(r.market_value)  : "-"}</td>
                    ${pnlTd(r.unrealized_pnl)}
                    <td class="text-right ${pnlClass(r.realized_pnl)}">${fmtMoney(r.realized_pnl)}</td>
                    <td class="text-right">${fmtMoney(r.avg_unit_pnl)}</td>
                    ${pnlTd(r.total_pnl)}
                    ${pnlTdP(r.return_pct)}`;
                obj.appendChild(tr);
            });
            const s = (data.by_account || []).find(a => a.account === acc);
            if (s) {
                const sub = document.createElement("tr");
                sub.className = "font-weight-bold text-muted";
                sub.innerHTML = `
                    <td colspan="4">소계 (${acc}) · 현금: ${fmtMoney(s.cash_balance)} · 이자: ${fmtMoney(s.interest || 0)}</td>
                    <td class="text-right">${fmtMoney(s.total_buy_amount)}</td>
                    <td class="text-right">${fmtMoney(s.total_sell_amount)}</td>
                    <td class="text-right">${fmtMoney(s.total_dividend)}</td>
                    <td class="text-right">${fmtMoney(s.total_dividend_tax)}</td>
                    <td colspan="3"></td>
                    ${pnlTd(s.unrealized_pnl)}
                    <td class="text-right ${pnlClass(s.realized_pnl)}">${fmtMoney(s.realized_pnl)}</td>
                    <td></td>
                    ${pnlTd(s.total_pnl)}
                    ${pnlTdP(s.return_pct)}`;
                obj.appendChild(sub);
            }
        });
        const t = data.total || {};
        const tot = document.createElement("tr");
        tot.className = "font-weight-bold";
        tot.innerHTML = `
            <td colspan="4">전체 합계 · 현금: ${fmtMoney(t.cash_balance)} · 이자: ${fmtMoney(t.interest || 0)}</td>
            <td class="text-right">${fmtMoney(t.total_buy_amount)}</td>
            <td class="text-right">${fmtMoney(t.total_sell_amount)}</td>
            <td class="text-right">${fmtMoney(t.total_dividend)}</td>
            <td class="text-right">${fmtMoney(t.total_dividend_tax)}</td>
            <td colspan="3"></td>
            ${pnlTd(t.unrealized_pnl)}
            <td class="text-right ${pnlClass(t.realized_pnl)}">${fmtMoney(t.realized_pnl)}</td>
            <td></td>
            ${pnlTd(t.total_pnl)}
            ${pnlTdP(t.return_pct)}`;
        obj.appendChild(tot);
    }

    // ── 인라인 행 추가 ────────────────────────────────────────────────────────────

    const INP_CLS  = "form-control form-control-sm bg-dark text-light border-secondary";
    const EDIT_CLS = `${INP_CLS} p-0 text-right`;

    function openTradeEdit(tr, t) {
        const isBuy = t.buy_qty > 0;
        const origClass = tr.className;
        tr.innerHTML = `
            <td class="text-muted small">${t.trade_id}</td>
            <td>${t.account}</td><td>${t.ticker}</td>
            <td><input class="${INP_CLS} edit-date" type="text" value="${t.date}" style="min-width:105px"></td>
            <td>${isBuy  ? `<input class="${EDIT_CLS} edit-buyqty"  type="number" step="any" value="${t.buy_qty}"     style="min-width:80px">` : ""}</td>
            <td>${!isBuy ? `<input class="${EDIT_CLS} edit-sellqty" type="number" step="any" value="${t.sell_qty}"    style="min-width:80px">` : ""}</td>
            <td>${isBuy  ? `<input class="${EDIT_CLS} edit-buyamt"  type="number" step="any" value="${t.buy_amount}"  style="min-width:90px">` : "-"}</td>
            <td>${!isBuy ? `<input class="${EDIT_CLS} edit-sellamt" type="number" step="any" value="${t.sell_amount}" style="min-width:90px">` : "-"}</td>
            <td><input class="${EDIT_CLS} edit-fee" type="number" step="any" value="${t.fee}" style="min-width:80px"></td>
            <td></td>
            <td>
                <button class="btn btn-sm btn-primary edit-save mr-1">저장</button>
                <button class="btn btn-sm btn-outline-secondary edit-cancel">취소</button>
            </td>`;
        tr.querySelector(".edit-save").addEventListener("click", () => {
            const g = cls => tr.querySelector(cls);
            const body = { date: g(".edit-date").value.trim(), fee: parseFloat(g(".edit-fee").value) || 0 };
            if (g(".edit-buyqty"))  body.buy_qty     = parseFloat(g(".edit-buyqty").value)  || 0;
            if (g(".edit-sellqty")) body.sell_qty    = parseFloat(g(".edit-sellqty").value) || 0;
            if (g(".edit-buyamt"))  body.buy_amount  = parseFloat(g(".edit-buyamt").value)  || 0;
            if (g(".edit-sellamt")) body.sell_amount = parseFloat(g(".edit-sellamt").value) || 0;
            if (!body.date) return;
            RQ_WK({ ADD_URL: `/tax/trades/${t.ticker}/${t.account}/${t.trade_id}`, rqMethod: "PUT", rqData: body,
                    rsFunc: () => { reloadTrades(); refreshPortfolio(); } });
        });
        tr.querySelector(".edit-cancel").addEventListener("click", () => { tr.className = origClass; reloadTrades(); });
    }

    function addRatesRow() {
        const obj = DATANODES.RATES.tbody;
        const tr  = document.createElement("tr");
        tr.className = "row-new";
        tr.innerHTML = `
            <td><input type="text"   class="${INP_CLS} new-date" placeholder="yyyy-mm-dd"></td>
            <td><input type="number" class="${INP_CLS} new-rate text-right" step="0.01" placeholder="환율"></td>
            <td>
                <button class="btn btn-sm btn-primary new-save mr-1">저장</button>
                <button class="btn btn-sm btn-outline-danger new-cancel">취소</button>
            </td>`;
        tr.querySelector(".new-save").addEventListener("click", () => {
            const date = tr.querySelector(".new-date").value.trim();
            const rate = parseFloat(tr.querySelector(".new-rate").value);
            if (!date || isNaN(rate)) return;
            RQ_WK({ ADD_URL: "/tax/exchange-rates", rqMethod: "POST", rqData: { date, rate },
                    rsFunc: () => RQ_WK(JOB_WK.RATESGET, dateFilter(DATANODES.RATES.month)) });
        });
        tr.querySelector(".new-cancel").addEventListener("click", () => tr.remove());
        obj.insertBefore(tr, obj.firstChild);
    }

    function addTradeRow() {
        const obj = DATANODES.TRADE.tbody;
        const accOpts = STATE.accounts.map(a => `<option value="${a.code}">${a.code} - ${a.name}</option>`).join("");
        const tr = document.createElement("tr");
        tr.className = "row-new";
        tr.innerHTML = `
            <td class="text-muted">-</td>
            <td><select class="${INP_CLS} new-account">${accOpts}</select></td>
            <td><input type="text"   class="${INP_CLS} new-ticker"  placeholder="티커" style="text-transform:uppercase;width:80px"></td>
            <td><input type="text"   class="${INP_CLS} new-date"    placeholder="yyyy-mm-dd"></td>
            <td><input type="number" class="${INP_CLS} new-buyqty   text-right" step="any" placeholder="매수수량"></td>
            <td><input type="number" class="${INP_CLS} new-sellqty  text-right" step="any" placeholder="매도수량"></td>
            <td><input type="number" class="${INP_CLS} new-buyamt   text-right" step="any" placeholder="매수액"></td>
            <td><input type="number" class="${INP_CLS} new-sellamt  text-right" step="any" placeholder="매도액"></td>
            <td><input type="number" class="${INP_CLS} new-fee      text-right" step="any" placeholder="수수료"></td>
            <td></td>
            <td>
                <button class="btn btn-sm btn-primary new-save mr-1">저장</button>
                <button class="btn btn-sm btn-outline-danger new-cancel">취소</button>
            </td>`;
        const g = cls => parseFloat(tr.querySelector(cls)?.value) || 0;
        tr.querySelector(".new-save").addEventListener("click", () => {
            const ticker = tr.querySelector(".new-ticker").value.trim().toUpperCase();
            const date   = tr.querySelector(".new-date").value.trim();
            if (!ticker || !date) return;
            RQ_WK({ ADD_URL: "/tax/trades/bulk", rqMethod: "POST",
                    rqData: [{ ticker, account: tr.querySelector(".new-account").value, date,
                               buy_qty: g(".new-buyqty"), sell_qty: g(".new-sellqty"),
                               buy_amount: g(".new-buyamt"), sell_amount: g(".new-sellamt"),
                               fee: g(".new-fee"), dividend: null, dividend_tax: null }],
                    rsFunc: () => { reloadTrades(); refreshPortfolio(); } });
        });
        tr.querySelector(".new-cancel").addEventListener("click", () => tr.remove());
        obj.insertBefore(tr, obj.firstChild);
    }

    function addDivRow() {
        const obj = DATANODES.DIV.tbody;
        const accOpts = STATE.accounts.map(a => `<option value="${a.code}">${a.code}</option>`).join("");
        const tr = document.createElement("tr");
        tr.className = "row-new row-div";
        tr.innerHTML = `
            <td class="text-muted">-</td>
            <td><select class="${INP_CLS} new-account">${accOpts}</select></td>
            <td><input type="text"   class="${INP_CLS} new-ticker" placeholder="티커" style="text-transform:uppercase;width:80px"></td>
            <td><input type="text"   class="${INP_CLS} new-date"   placeholder="yyyy-mm-dd"></td>
            <td><input type="number" class="${INP_CLS} new-div    text-right" step="any" placeholder="배당금"></td>
            <td><input type="number" class="${INP_CLS} new-divtax text-right" step="any" placeholder="배당세"></td>
            <td class="text-muted">-</td>
            <td>
                <button class="btn btn-sm btn-primary new-save mr-1">저장</button>
                <button class="btn btn-sm btn-outline-danger new-cancel">취소</button>
            </td>`;
        tr.querySelector(".new-save").addEventListener("click", () => {
            const ticker = tr.querySelector(".new-ticker").value.trim().toUpperCase();
            const date   = tr.querySelector(".new-date").value.trim();
            if (!ticker || !date) return;
            RQ_WK({ ADD_URL: "/tax/trades/bulk", rqMethod: "POST",
                    rqData: [{ ticker, account: tr.querySelector(".new-account").value, date,
                               buy_qty: 0, sell_qty: 0, buy_amount: 0, sell_amount: 0, fee: 0,
                               dividend:     parseFloat(tr.querySelector(".new-div").value)    || 0,
                               dividend_tax: parseFloat(tr.querySelector(".new-divtax").value) || 0 }],
                    rsFunc: () => { reloadTrades(); refreshPortfolio(); } });
        });
        tr.querySelector(".new-cancel").addEventListener("click", () => tr.remove());
        obj.insertBefore(tr, obj.firstChild);
    }

    function addAccTxRow(account, onSaved) {
        const obj = DATANODES.ACCTX.tbody;
        const tr  = document.createElement("tr");
        tr.className = "row-new";
        tr.innerHTML = `
            <td class="text-muted">-</td>
            <td><input type="text" class="${INP_CLS} new-date" placeholder="yyyy-mm-dd"></td>
            <td><select class="${INP_CLS} new-type">
                <option value="deposit">예수금</option>
                <option value="interest">이자</option>
                <option value="other">기타</option>
            </select></td>
            <td><input type="number" class="${INP_CLS} new-amount text-right" step="0.01" placeholder="금액"></td>
            <td><input type="text"   class="${INP_CLS} new-memo" placeholder="메모"></td>
            <td>
                <button class="btn btn-sm btn-primary new-save mr-1">저장</button>
                <button class="btn btn-sm btn-outline-danger new-cancel">취소</button>
            </td>`;
        tr.querySelector(".new-save").addEventListener("click", () => {
            const date = tr.querySelector(".new-date").value.trim();
            if (!date) return;
            RQ_WK({ ADD_URL: `/tax/account-transactions/${account}/bulk`, rqMethod: "POST",
                    rqData: [{ date, tx_type: tr.querySelector(".new-type").value,
                               amount: parseFloat(tr.querySelector(".new-amount").value) || 0,
                               memo:   tr.querySelector(".new-memo").value.trim() }],
                    rsFunc: () => { tr.remove(); onSaved?.(); } });
        });
        tr.querySelector(".new-cancel").addEventListener("click", () => tr.remove());
        obj.insertBefore(tr, obj.firstChild);
    }

    // ── 매칭 관련 (loadMatchData에서 상호 참조) ──────────────────────────────────

    function updateMatchTickerDropdown() {
        const account       = DATANODES.MATCH.accselect?.value || "";
        const currentTicker = DATANODES.MATCH.tickerselect?.value || "";
        RQ_WK({ ADD_URL: "/tax/trades/tickers", rqMethod: "GET", rsFunc: pairs => {
            const filtered = account ? (pairs || []).filter(p => p.account === account) : (pairs || []);
            const tickers  = [...new Set(filtered.map(p => p.ticker))].sort();
            if (DATANODES.MATCH.tickerselect)
                DATANODES.MATCH.tickerselect.innerHTML = `<option value="">-- 선택 --</option>` +
                    tickers.map(t => `<option${t === currentTicker ? " selected" : ""}>${t}</option>`).join("");
        }});
    }

    function updateMatchBtn() {
        if (!STATE.selSell || !STATE.selBuys.length) { DATANODES.MATCH.dobtn.disabled = true; return; }
        const totalBuy = STATE.selBuys.reduce((s, b) => s + b.qty, 0);
        const match    = Math.abs(totalBuy - STATE.selSell.qty) < 1e-9;
        DATANODES.MATCH.dobtn.disabled = !match;
        const multi = STATE.selBuys.length > 1 ? ` (${STATE.selBuys.length}건)` : "";
        DATANODES.MATCH.info.textContent = match
            ? `수량 ${fmtQty(totalBuy)}주 일치 → 매칭 가능${multi}`
            : `매수 합계 ${fmtQty(totalBuy)} / 매도 ${fmtQty(STATE.selSell.qty)}`;
    }

    function loadMatchData() {
        const account = UI_WK.getNodeValue(DATANODES.MATCH.accselect);
        const ticker  = UI_WK.getNodeValue(DATANODES.MATCH.tickerselect);
        if (!ticker) { updateMatchTickerDropdown(); return; }
        RQ_WK({ ADD_URL: `/tax/trades/${ticker}/${account}`, rqMethod: "GET", rsFunc: trades => {
            const unmatched = (trades || []).filter(t => !t.match_key);
            renderSellList(unmatched.filter(t => t.sell_qty > 0).sort((a, b) => a.date.localeCompare(b.date)));
            renderBuyList( unmatched.filter(t => t.buy_qty  > 0).sort((a, b) => a.date.localeCompare(b.date)));
            STATE.selSell = null; STATE.selBuys = [];
            DATANODES.MATCH.dobtn.disabled = true;
            DATANODES.MATCH.info.textContent = "";
        }});
        RQ_WK({ ADD_URL: `/tax/matches${buildQs({ ticker, account })}`, rqMethod: "GET",
                rsFunc: d => renderMatchedList(d || []) });
    }

    function doMatch() {
        RQ_WK({ ADD_URL: "/tax/matches", rqMethod: "POST",
                rqData: { buy_ids: STATE.selBuys.map(b => b.id), sell_id: STATE.selSell.id },
                rsFunc: data => {
                    if (data?.result) {
                        DATANODES.MATCH.info.textContent = `⚠ ${data.result}`;
                        DATANODES.MATCH.info.style.color = "#f44336";
                        return;
                    }
                    DATANODES.MATCH.info.textContent = "";
                    DATANODES.MATCH.info.style.color = "";
                    loadMatchData(); reloadTrades(); refreshPortfolio();
                } });
    }

    function renderSellList(sells) {
        const obj = DATANODES.MATCH.selltbody;
        obj.innerHTML = "";
        sells.forEach(t => {
            const tr = document.createElement("tr");
            Object.assign(tr.dataset, { id: t.trade_id, qty: t.sell_qty, date: t.date });
            tr.innerHTML = `
                <td><input type="radio" name="sell-radio" value="${t.trade_id}"></td>
                <td>${t.trade_id}</td><td>${t.date}</td>
                <td class="text-right">${fmtQty(t.sell_qty)}</td>
                <td class="text-right">${fmtMoney(t.sell_amount)}</td>
                <td class="text-right">${fmtMoney(t.fee)}</td>`;
            obj.appendChild(tr);
        });
        obj.querySelectorAll("input[type=radio]").forEach(radio =>
            radio.addEventListener("change", () => {
                const row = radio.closest("tr");
                STATE.selSell  = { id: row.dataset.id, qty: parseFloat(row.dataset.qty), date: row.dataset.date };
                STATE.selBuys  = [];
                obj.querySelectorAll("tr").forEach(r => r.classList.remove("selected-row"));
                row.classList.add("selected-row");
                DATANODES.MATCH.info.textContent = `매도 ${fmtQty(STATE.selSell.qty)}주 선택 — 매수 선택하세요`;
                DATANODES.MATCH.dobtn.disabled = true;
                const account = UI_WK.getNodeValue(DATANODES.MATCH.accselect);
                const ticker  = UI_WK.getNodeValue(DATANODES.MATCH.tickerselect);
                RQ_WK({ ADD_URL: `/tax/trades/${ticker}/${account}`, rqMethod: "GET", rsFunc: trades =>
                    renderBuyList((trades || []).filter(t => !t.match_key && t.buy_qty > 0 && t.date <= STATE.selSell.date))
                });
            })
        );
    }

    function renderBuyList(buys) {
        const obj = DATANODES.MATCH.buytbody;
        obj.innerHTML = "";
        buys.forEach(t => {
            const tr = document.createElement("tr");
            Object.assign(tr.dataset, { id: t.trade_id, qty: t.buy_qty });
            tr.innerHTML = `
                <td><input type="checkbox" class="buy-check" value="${t.trade_id}" data-qty="${t.buy_qty}"></td>
                <td>${t.trade_id}</td><td>${t.date}</td>
                <td class="text-right">${fmtQty(t.buy_qty)}</td>
                <td class="text-right">${fmtMoney(t.buy_amount)}</td>
                <td class="text-right">${fmtMoney(t.fee)}</td>
                <td><button class="btn btn-sm btn-outline-secondary buy-split-btn"
                    data-id="${t.trade_id}" data-qty="${t.buy_qty}">분할</button></td>`;
            obj.appendChild(tr);
        });
        obj.querySelectorAll(".buy-check").forEach(cb =>
            cb.addEventListener("change", () => {
                const row = cb.closest("tr");
                if (cb.checked) { STATE.selBuys.push({ id: cb.value, qty: parseFloat(cb.dataset.qty) }); row.classList.add("selected-row"); }
                else            { STATE.selBuys = STATE.selBuys.filter(b => b.id !== cb.value); row.classList.remove("selected-row"); }
                updateMatchBtn();
            })
        );
        obj.querySelectorAll(".buy-split-btn").forEach(btn =>
            btn.addEventListener("click", () => {
                const info = parseTradeId(btn.dataset.id);
                if (info) openSplitModal({ id: btn.dataset.id, ...info, qty: btn.dataset.qty });
            })
        );
    }

    function renderMatchedList(matches) {
        const obj = DATANODES.MATCH.donetbody;
        obj.innerHTML = "";
        matches.forEach(m => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${m.match_key}</td>
                <td>${(m.buys || []).map(b => b.trade_id).join("<br>")}</td>
                <td>${(m.buys || []).map(b => b.date).join("<br>")}</td>
                <td>${m.sell.trade_id}</td><td>${m.sell.date}</td>
                <td class="text-right">${fmtQty((m.buys || []).reduce((s, b) => s + b.qty, 0))}</td>
                <td><button class="btn btn-sm btn-outline-danger match-cancel" data-key="${m.match_key}">해제</button></td>`;
            obj.appendChild(tr);
        });
        onBtn(obj, ".match-cancel", e => {
            if (!confirm("매칭을 해제하시겠습니까? (TaxRow도 삭제됩니다)")) return;
            RQ_WK({ ADD_URL: `/tax/matches/${e.currentTarget.dataset.key}`, rqMethod: "DELETE",
                    rsFunc: () => { loadMatchData(); reloadTrades(); refreshPortfolio(); } });
        });
    }

    // ── 쪼개기 모달 ──────────────────────────────────────────────────────────────

    function openSplitModal(dataset) {
        STATE.splitTarget = { id: dataset.id, ticker: dataset.ticker, account: dataset.account, origQty: parseFloat(dataset.qty) };
        DATANODES.SPLIT.info.textContent = `원본 수량: ${dataset.qty} | 합계가 ${dataset.qty}이 되도록 입력`;
        DATANODES.SPLIT.inputs.innerHTML = `
            <div><input type="number" class="split-qty ${INP_CLS} mb-1" step="any" placeholder="수량"></div>
            <div><input type="number" class="split-qty ${INP_CLS}"       step="any" placeholder="수량"></div>`;
        DATANODES.SPLIT.error.textContent = "";
        $("#split-modal").modal("show");
    }

    function initSplitModal() {
        UI_WK.setEvent(DATANODES.SPLIT.addbtn, () => {
            const div = document.createElement("div");
            div.innerHTML = `<input type="number" class="split-qty ${INP_CLS} mt-1" step="any" placeholder="수량">`;
            DATANODES.SPLIT.inputs.appendChild(div);
        });
        UI_WK.setEvent(DATANODES.SPLIT.confirmbtn, () => {
            const qtys = [...document.querySelectorAll(".split-qty")].map(i => parseFloat(i.value)).filter(v => v > 0);
            if (qtys.length < 2) { DATANODES.SPLIT.error.textContent = "2개 이상 수량을 입력하세요"; return; }
            const total = qtys.reduce((a, b) => a + b, 0);
            if (Math.abs(total - STATE.splitTarget.origQty) > 1e-9) {
                DATANODES.SPLIT.error.textContent = `합계(${total})가 원본(${STATE.splitTarget.origQty})과 다릅니다`; return;
            }
            const { ticker, account, id } = STATE.splitTarget;
            RQ_WK({ ADD_URL: `/tax/trades/${ticker}/${account}/${id}/split`, rqMethod: "POST", rqData: { quantities: qtys },
                    rsFunc: () => {
                        $("#split-modal").modal("hide");
                        reloadTrades(); refreshPortfolio();
                        if (STATE.selSell) {
                            const acc = UI_WK.getNodeValue(DATANODES.MATCH.accselect);
                            const tkr = UI_WK.getNodeValue(DATANODES.MATCH.tickerselect);
                            if (tkr) {
                                STATE.selBuys = [];
                                RQ_WK({ ADD_URL: `/tax/trades/${tkr}/${acc}`, rqMethod: "GET", rsFunc: trades => {
                                    renderBuyList((trades || []).filter(t => !t.match_key && t.buy_qty > 0 && t.date <= STATE.selSell.date));
                                    updateMatchBtn();
                                }});
                            }
                        }
                    } });
        });
    }

    // ── 서브탭 ───────────────────────────────────────────────────────────────────

    function initSubTabs() {
        const sharedFilter = document.getElementById("trades-shared-filter");
        const TRADES_TABS = new Set(["sub-trade", "sub-div"]);

        function switchTab(sub) {
            document.querySelectorAll(".subtab-link").forEach(b => {
                b.classList.replace("badge-primary", "badge-secondary");
                b.classList.remove("active-subtab");
            });
            document.querySelectorAll(".subtab-link[data-sub='" + sub + "']").forEach(b => {
                b.classList.replace("badge-secondary", "badge-primary");
                b.classList.add("active-subtab");
            });
            document.querySelectorAll(".sub-panel").forEach(p => p.classList.remove("active"));
            document.getElementById(sub)?.classList.add("active");
            if (sharedFilter) sharedFilter.style.display = TRADES_TABS.has(sub) ? "" : "none";
        }

        document.querySelectorAll(".subtab-link").forEach(btn =>
            btn.addEventListener("click", () => switchTab(btn.dataset.sub))
        );

        // 초기 활성 탭 기준으로 공유 필터 설정
        const activeSub = document.querySelector(".subtab-link.active-subtab")?.dataset.sub;
        if (sharedFilter) sharedFilter.style.display = TRADES_TABS.has(activeSub) ? "" : "none";
    }

    // ── initWK / run ─────────────────────────────────────────────────────────────

    function initWK() {
        Object.values(JOB_WK).forEach(job => { if (job.doOnload) RQ_WK(job); job.init?.(); });
        initSubTabs();
        initSplitModal();
    }

    return { run: initWK };
})();

TAXCOMMON.run();
