var SIPUSTOCK = (function (SIPUSTOCK, $, undefined) {
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

    SIPUSTOCK.DETAIL_DATA = null;
    SIPUSTOCK.OPEN_MODAL = (symbol) => {
        fetch(`./stock/data/${symbol}.json`)
        .then(re=>re.json())     
        .then(data=>{
            //console.log(data)
            SIPUSTOCK.DETAIL_DATA = data;
            const s = SIPUSTOCK.DATA.signals.find(s => s.t === symbol);
            document.getElementById('modal-ticker').innerText = s.t;
            document.getElementById('modal-update').innerText = `LAST SYNC: ${new Date().toLocaleTimeString()}`;
            document.getElementById('modal-price').innerText = `$${s.p.toLocaleString()}`;
            document.getElementById('modal-score').innerText = s.sc;
            document.getElementById('link-yahoo').href = `https://finance.yahoo.com/quote/${s.t}`;
            document.getElementById('link-trading').href = `https://www.tradingview.com/symbols/${s.t}`;
            document.getElementById('detail-modal').classList.remove('hidden');

            const feed = document.getElementById('social-feed');
            SIPUSTOCK.DETAIL_DATA.links.news.forEach(link => {
                const div = `
                    <div class="bg-slate-900/60 p-4 border border-slate-800 sharp-card">
                        <span class="text-[9px] font-black text-blue-400 uppercase">${link.platform}</span>
                        <a href="${link.link}" target="_blank"><p class="text-xs font-semibold mt-1 text-slate-300">${link.title}</p></a>
                    </div>
                `;
                feed.insertAdjacentHTML("beforeend", div);
            });

            SIPUSTOCK.changePeriod('hour', document.querySelector('#period-tabs button'));
        });
    }

    SIPUSTOCK.closeModal = function() { document.getElementById('detail-modal').classList.add('hidden'); }
    SIPUSTOCK.CHART_OBJ = null;

    SIPUSTOCK.changePeriod = (period, btn) => {
        document.querySelectorAll('.btn-period').forEach(b => {
            b.classList.remove('active', 'bg-blue-600');
            b.classList.add('text-slate-500');
        });
        btn.classList.add('active', 'bg-blue-600');
        btn.classList.remove('text-slate-500');

        let history = [];
        if (period === 'hour') {
            history = SIPUSTOCK.DETAIL_DATA.history.recent;
        } else if (period === 'day') {
            history = SIPUSTOCK.DETAIL_DATA.history.summary;
        } else if (period === 'month') {
            history = SIPUSTOCK.DETAIL_DATA.history.month_summary;
        }   else if (period === 'year') {
            history = SIPUSTOCK.DETAIL_DATA.history.year_summary;
        }
        // 더미 데이터 생성 (이중 축 테스트용)
        //const history = Array.from({length: 12}, (_, i) => ({
        //    t: (i+9) + ":00",
        //    p: 440 + Math.random()*30,
        //    sc: 40 + Math.random()*50,
        //    b: 10 + Math.random()*70
        //}));
        SIPUSTOCK.renderChart(history);
    }

    //이거 히스토리쪽은 대대적인 수정 필요해
    SIPUSTOCK.renderChart = (history) => {
        const ctx = document.getElementById('historyChart').getContext('2d');
        if (SIPUSTOCK.CHART_OBJ) SIPUSTOCK.CHART_OBJ.destroy();

        SIPUSTOCK.CHART_OBJ = new Chart(ctx, {
            data: {
                labels: history.map(h => h.t),
                datasets: [
                    { type: 'line', label: 'Market Insight', data: history.map(h => h.sc), borderColor: '#3b82f6', borderWidth: 2, tension: 0.1, yAxisID: 'y', pointRadius: 0 },
                    { type: 'line', label: 'Price ($)', data: history.map(h => h.p), borderColor: '#10b981', borderWidth: 1, borderDash: [4, 4], yAxisID: 'y1', pointRadius: 0 },
                    { type: 'bar', label: 'Social Buzz', data: history.map(h => h.b), backgroundColor: 'rgba(255, 255, 255, 0.04)', yAxisID: 'y' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { 
                    legend: { display: true, position: 'bottom', labels: { color: '#64748b', font: { size: 9 }, boxWidth: 8 } } 
                },
                scales: { 
                    x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 8 } } },
                    y: { position: 'left', min: 0, max: 100, ticks: { color: '#3b82f6', font: { size: 8 } }, grid: { color: 'rgba(255,255,255,0.02)' } },
                    y1: { position: 'right', ticks: { color: '#10b981', font: { size: 8 }, callback: v => '$' + v.toFixed(0) }, grid: { display: false } }
                }
            }
        });
    }

    
    SIPUSTOCK.GREENSIGN = "🟢";
    SIPUSTOCK.REDSIGN = "🔴";
    SIPUSTOCK.NEUTRALSIGN = "⚪";
    SIPUSTOCK.DRAWTYPE = function (type) {
        if (!type) {
            type = "ALL";
        } 
        const _node = document.getElementById('list_stock');
        _node.innerHTML = '';

        let filteredData = SIPUSTOCK.DATA.signals;
        if (type !== "ALL") {
            // Implement filtering logic based on type if needed
            filteredData = SIPUSTOCK.DATA.signals.filter(item => item.type === type);
        }
        filteredData.forEach(s => {
            let news_sign = SIPUSTOCK.NEUTRALSIGN;
            if (s.nc == "green") {
                news_sign = SIPUSTOCK.GREENSIGN;
            } else if (s.nc == "red") {
                news_sign = SIPUSTOCK.REDSIGN;
            }
            let social_sign = SIPUSTOCK.NEUTRALSIGN;
            if (s.sc == "green") {
                social_sign = SIPUSTOCK.GREENSIGN;
            } else if (s.sc == "red") {
                social_sign = SIPUSTOCK.REDSIGN;
            }
            const card = document.createElement('tr');
            card.innerHTML = `
                <td>${s.t}</td>
                <td><span style="color: ${s.nc == "green" ? "green" : s.nc == "red" ? "red" : "gray"};">$${s.p}</span></td>
                <td>${news_sign + s.sb ? "📡":""}</td>
                <td>${social_sign + s.ns ? "📰":""}</td>
                <td>${s.score}</td>
                <th scope="row"><button value="${s.seq}" type="button" class="btn btn-secondary" onclick="javascript:SIPUSTOCK.OPEN_MODAL('${s.t}');">${s.status}</button></th>
            `;
            _node.appendChild(card);
        });
        
                
        if (type === "ALL") {

            console.log(SIPUSTOCK.DATA);
        }

    };

    SIPUSTOCK.DATA = {};
    SIPUSTOCK.DATA_LASTUPDATE = 0;
    SIPUSTOCK.HIGH_POINT = 60;
    SIPUSTOCK.LOW_POINT = 30;

    SIPUSTOCK.GETNOW = function () {
        const unixMillis = date.getTime(); // 밀리초 
        return unixSeconds = Math.floor(unixMillis / 1000); // 초
    };
    SIPUSTOCK.LOADDATA = function () {
        fetch("./stock/data/_overview.json")
        .then(re=>re.json())     
        .then(data=>{
            //console.log(data)
            SIPUSTOCK.DATA = data;
            //SIPUSTOCK.DRAWTYPE();
        });
    };

    SIPUSTOCK.run = function () {
        //init();
        SIPUSTOCK.LOADDATA();
		
        //life();
        //Snail.start();
    };
    return SIPUSTOCK;
})(window.SIPUSTOCK || {}, jQuery);
SIPUSTOCK.run();
