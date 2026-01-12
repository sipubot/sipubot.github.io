var SIPUSTOCK = (function (SIPUSTOCK, $, undefined) {
    "use strict";

    SIPUSTOCK.DATA = {}; 
    SIPUSTOCK.DETAIL_DATA = null;
    SIPUSTOCK.CHART_OBJ = null;

    // 1. 데이터 로드
    SIPUSTOCK.LOADDATA = function () {
        fetch("./stock/data/_overview.json")
            .then(re => re.json())
            .then(data => {
                SIPUSTOCK.DATA = data.signals || data;
                // 초기 실행 시 ALL 버튼 활성화
                const allBtn = document.querySelector('.filter-btn');
                SIPUSTOCK.FILTER("ALL", allBtn);
            })
            .catch(err => console.error("Data Load Error:", err));
    };

    // 2. 필터 제어 (클래스 선택자 점(.) 수정 완료)
    SIPUSTOCK.FILTER = function (type, element) {
        document.querySelectorAll('.filter-btn').forEach(el => {
            el.classList.remove('active');
        });
        if (element) element.classList.add('active');
        SIPUSTOCK.DRAWTYPE(type);
    };

    // 3. 리스트 렌더링 (Status 글자 기준 보정)
    SIPUSTOCK.DRAWTYPE = function (type) {
        const _node = document.getElementById('list_stock');
        if (!_node) return;
        _node.innerHTML = '';

        const signals = Array.isArray(SIPUSTOCK.DATA) ? SIPUSTOCK.DATA : Object.values(SIPUSTOCK.DATA);

        signals.forEach(s => {
            const statusText = (s.status || "").toUpperCase(); 

			if (type !== "ALL") {
				// STABLE 필터를 선택했을 때 NEUTRAL도 함께 보여줌
				if (type === "STABLE") {
					if (statusText !== "STABLE" && statusText !== "NEUTRAL") return;
				} 
				// 그 외 필터는 정확히 일치할 때만 노출
				else if (type === "DIVERGENCE" && statusText !== "DIVERGENCE") return;
				else if (type === "HOT" && statusText !== "HOT") return;
				else if (type === "COLD" && statusText !== "COLD") return;
				else if (type === "FREEZE" && statusText !== "FREEZE") return;
			}
			
            const score = parseFloat(s.score) || 0;
            const price = parseFloat(s.p) || 0;
            const priceColor = s.pc === "green" ? "#28a745" : s.pc === "red" ? "#dc3545" : "#ccc";

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:bold; color:#fff;">${s.t}</td>
                <td style="color:${priceColor}; font-family:monospace;">$${price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td class="text-center">${s.status || '---'}</td>
                <td class="text-center">${s.sb === true ? "📡" : ""}</td>
                <td style="font-family:monospace;">${score.toFixed(1)}</td>
                <th scope="row">
                    <button type="button" class="btn btn-secondary sharp-btn" 
                            onclick="SIPUSTOCK.OPEN_MODAL('${s.t}')">
						<i class="fa-solid fa-arrow-up-right-from-square"></i>
					</button>
                </th>
            `;
            _node.appendChild(tr);
        });
    };

// 4. 모달 상세 보기 보정
    SIPUSTOCK.OPEN_MODAL = (symbol) => {
        fetch(`./stock/data/${symbol}.json`)
            .then(re => re.json())
            .then(data => {
                SIPUSTOCK.DETAIL_DATA = data; // 전역에 상세 데이터 저장
                const signals = Array.isArray(SIPUSTOCK.DATA) ? SIPUSTOCK.DATA : Object.values(SIPUSTOCK.DATA);
                const s = signals.find(item => item.t === symbol);
                if (!s) return;
				
				// 1. 헤더 정보 및 야후 링크 설정
                document.getElementById('modal-ticker').innerText = s.t;
				const yahooBtn = document.getElementById('yahoo-link');
				if (yahooBtn) {
					yahooBtn.href = `https://finance.yahoo.com/quote/${s.t}`;
					yahooBtn.title = `${s.t} Yahoo Finance 바로가기`;
				}
                document.getElementById('modal-price').innerText = `$${parseFloat(s.p).toLocaleString(undefined, {minimumFractionDigits: 2})}`;
                document.getElementById('modal-score').innerText = parseFloat(s.score).toFixed(1);
                
                document.getElementById('detail-modal').classList.remove('hidden');

                // 2. 순수 소셜/뉴스 피드만 렌더링
				const feed = document.getElementById('social-feed');
				if (feed) {
					feed.innerHTML = '';
					const allLinks = [...(data.links.news || []), ...(data.links.social || [])];
					allLinks.forEach(link => {
						feed.insertAdjacentHTML("beforeend", `
							<div style="border:1px solid #333; padding:10px; margin-bottom:5px; background:#1a1a1a;">
								<small style="color:#666; text-transform:uppercase;">${link.platform || 'INFO'}</small>
								<a href="${link.link || link.url}" target="_blank" style="color:#ccc; display:block; text-decoration:none;">
									<strong>${link.title}</strong>
								</a>
							</div>`);
					});
				}
				
                // 초기 차트는 recent 데이터로 표시
                if (data.history && data.history.recent) {
                    SIPUSTOCK.renderChart(data.history.recent);
                    // 탭 초기화
                    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active', 'bg-[#444]'));
                    document.querySelector('.period-btn').classList.add('active', 'bg-[#444]');
                }
            });
    };

    // [추가] 기간 변경 함수
    SIPUSTOCK.CHANGE_PERIOD = function(period) {
        if (!SIPUSTOCK.DETAIL_DATA || !SIPUSTOCK.DETAIL_DATA.history[period]) return;
        
        // 버튼 스타일 변경
        const btns = document.querySelectorAll('.period-btn');
        btns.forEach(btn => {
            btn.classList.remove('active', 'bg-[#444]');
            if(btn.innerText.toLowerCase() === period) btn.classList.add('active', 'bg-[#444]');
        });

        SIPUSTOCK.renderChart(SIPUSTOCK.DETAIL_DATA.history[period]);
    };
	
	
    SIPUSTOCK.closeModal = function() { document.getElementById('detail-modal').classList.add('hidden'); };

    // 5. Chart.js (sc 필드 사용)
    SIPUSTOCK.renderChart = (history) => {
        const chartEl = document.getElementById('historyChart');
        if (!chartEl) return;
        const ctx = chartEl.getContext('2d');
        if (SIPUSTOCK.CHART_OBJ) SIPUSTOCK.CHART_OBJ.destroy();
		// [보정] 가격(p)과 스코어(sc)가 모두 0보다 큰 유효한 데이터만 추출
		const validData = history.filter(h => parseFloat(h.p) > 0 && parseFloat(h.sc) > 0);

		if (validData.length === 0) {
			console.warn("표시할 유효한 데이터가 없습니다.");
			return;
		}
		
        SIPUSTOCK.CHART_OBJ = new Chart(ctx, {
            data: {
                labels: validData.map(h => {
                    const d = new Date(h.t * 1000);
                    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
                }),
                datasets: [
                    { type: 'line', data: validData.map(h => parseFloat(h.sc) || 0), borderColor: '#888', borderWidth: 2, pointRadius: 0, tension: 0.2, yAxisID: 'y' },
                    { type: 'line', data: validData.map(h => parseFloat(h.p) || 0), borderColor: '#444', borderWidth: 1, borderDash: [5, 5], pointRadius: 0, yAxisID: 'y1' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#555', font: { size: 10 } }, grid: { display: false } },
                    y: { position: 'left', ticks: { color: '#777' }, grid: { color: '#222' } },
                    y1: { position: 'right', grid: { display: false }, ticks: { color: '#444' } }
                }
            }
        });
    };

    SIPUSTOCK.run = function () { SIPUSTOCK.LOADDATA(); };
    return SIPUSTOCK;
})(window.SIPUSTOCK || {}, jQuery);

SIPUSTOCK.run();