var SIPUSTOCK = (function (SIPUSTOCK, $, undefined) {
    "use strict";

    /* ==========================================
       SIPUSTOCK 차트 애플리케이션 메인 모듈
       ========================================== */

    // 전역 변수 정의
    SIPUSTOCK.DATA = {}; 
    SIPUSTOCK.DETAIL_DATA = null;
    SIPUSTOCK.MAIN_CHART_OBJ = null;
    SIPUSTOCK.SOCIAL_CHART_OBJ = null;

    // 차트 설정 상수
    const CHART_CONFIG = {
        COLORS: {
            PRICE: '#28a745',  // 가격 라인 - 녹색 (시각적으로 더 선명)
            SCORE: '#007bff',  // 스코어 라인 - 파란색 (시각적으로 더 선명)
            VOLUME_UP: '#28a745',
            VOLUME_DOWN: '#dc3545',
            SOCIAL_POSITIVE: '#28a745',
            SOCIAL_NEGATIVE: '#dc3545',
            SENTIMENT: '#ffc107'  // 감성 라인 - 노란색 (시각적으로 더 선명)
        },
        SIZES: {
            MAIN_HEIGHT: 200,
            SOCIAL_HEIGHT: 150,
            FONT_SIZE: 10
        },
        LABELS: {
            PRICE: 'Price',
            SCORE: 'Score',
            VOLUME: 'Volume (%)',
            SOCIAL_ACTIVITY: 'Social Activity',
            SENTIMENT: 'Sentiment'
        }
    };

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
				else if (type === "HIGH_MOMENTUM" && (parseFloat(s.ms) || 0) < 75) return;
			}

            const score = parseFloat(s.score) || 0;
            const price = parseFloat(s.p) || 0;
            const priceColor = s.pc === "green" ? "#28a745" : s.pc === "red" ? "#dc3545" : "#ccc";

            // ⭐ 스마트 메트릭 활용 (압축된 필드명 사용)
            const newsTrend = parseFloat(s.nt) || 0;
            const momentumScore = parseFloat(s.ms) || 50;
            const eventCount = parseInt(s.ec) || 0;

            // 📊 STATUS를 의미 있는 아이콘 + 색상으로 변환
            let statusDisplay = '⚪';
            let statusColor = '#777';
            let statusBg = '';
            if (statusText === "HOT") {
                statusDisplay = '🔥';
                statusColor = '#fff';
                statusBg = 'background: linear-gradient(45deg, #ff6b35, #ff4757); border-radius: 3px; padding: 2px 4px;';
            } else if (statusText === "DIVERGENCE") {
                statusDisplay = '⚠️';
                statusColor = '#fff';
                statusBg = 'background: linear-gradient(45deg, #ffa726, #fb8c00); border-radius: 3px; padding: 2px 4px;';
            } else if (statusText === "STABLE") {
                statusDisplay = '📈';
                statusColor = '#28a745';
            } else if (statusText === "COLD") {
                statusDisplay = '❄️';
                statusColor = '#17a2b8';
            } else if (statusText === "FREEZE") {
                statusDisplay = '🧊';
                statusColor = '#6c757d';
            }

            // 📡 SIGNAL을 더 의미 있게 (소셜 활성도 + 이벤트)
            let signalDisplay = '';
            if (s.sb === true) {
                signalDisplay = '📡';
                if (eventCount > 0) {
                    signalDisplay += '<sup style="color:#ffd700; font-size:8px;">' + eventCount + '</sup>';
                }
            } else if (eventCount > 0) {
                signalDisplay = '🔔';
            }

            // 📊 SCORE를 0-100 범위로 변환: (score + 1) / 2 * 100
            const normalizedScore = ((score + 1) / 2) * 100;
            let scoreDisplay = normalizedScore.toFixed(1);
            let scoreStyle = 'font-family:monospace;';
            if (normalizedScore >= 80) {
                scoreStyle += 'color:#28a745; font-weight:bold; text-shadow: 0 0 3px #28a74540;';
            } else if (normalizedScore >= 60) {
                scoreStyle += 'color:#ffc107; font-weight:bold;';
            } else if (normalizedScore >= 40) {
                scoreStyle += 'color:#fd7e14;';
            } else {
                scoreStyle += 'color:#dc3545;';
            }

            // 트렌드 기반 직관적 아이콘 (사람이 직관적으로 이해하기 쉽도록)
            let trendIcon = '⚪'; // 중립
            let trendColor = '#777';
            if (newsTrend > 0.3) {
                trendIcon = '📈'; // 강한 상승
                trendColor = '#28a745';
            } else if (newsTrend > 0.1) {
                trendIcon = '↗️'; // 상승
                trendColor = '#20c997';
            } else if (newsTrend < -0.3) {
                trendIcon = '📉'; // 강한 하락
                trendColor = '#dc3545';
            } else if (newsTrend < -0.1) {
                trendIcon = '↘️'; // 하락
                trendColor = '#fd7e14';
            }

            // 모멘텀 점수를 시각적 게이지로 표현
            const momentumPercent = Math.min(100, Math.max(0, momentumScore));
            const momentumBar = `<div style="width:40px; height:4px; background:#333; border-radius:2px; overflow:hidden; display:inline-block; margin-left:2px;">
                <div style="width:${momentumPercent}%; height:100%; background:linear-gradient(90deg, #dc3545 0%, #ffc107 50%, #28a745 100%); border-radius:2px;"></div>
            </div>`;

            // 이벤트 표시 개선 (불꽃 아이콘으로 더 눈에 띄게)
            const eventIndicator = eventCount > 0 ? `<i class="fa-solid fa-fire" style="color:#ffd700; margin-left:2px;" title="${eventCount} events"></i>` : '';

            // 모멘텀 기반 강조 (75점 이상은 금색 테두리)
            const rowStyle = momentumScore > 75 ? 'border-left: 3px solid #ffd700; background: linear-gradient(90deg, rgba(255,215,0,0.05) 0%, transparent 100%);' : '';

            const tr = document.createElement('tr');
            tr.setAttribute('style', rowStyle);
            tr.innerHTML = `
                <td style="font-weight:bold; color:#fff;">${s.t}</td>
                <td style="color:${priceColor}; font-family:monospace;">$${price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td class="text-center" style="${statusBg}" title="${statusText}"><span style="color:${statusColor};">${statusDisplay}</span></td>
                <td class="text-center">${signalDisplay}</td>
                <td style="${scoreStyle}">${scoreDisplay}</td>
                <td style="text-align:center; font-size:14px;" title="News trend: ${newsTrend > 0 ? '+' : ''}${newsTrend.toFixed(1)}">${trendIcon}</td>
                <td style="font-family:monospace; font-size:11px; text-align:center;">${momentumScore.toFixed(0)}${momentumBar}${eventIndicator}</td>
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
                const normalizedScore = ((s.score + 1) / 2) * 100;
                let scoreDisplay = normalizedScore.toFixed(1);
                document.getElementById('modal-score').innerText = scoreDisplay;

                // ⭐ 스마트 메트릭 표시 추가 (압축된 필드명 사용)
                const newsTrend = parseFloat(s.nt) || 0;
                const socialTrend = parseFloat(s.st) || 0;
                const momentumScore = parseFloat(s.ms) || 50;
                const eventCount = parseInt(s.ec) || 0;
                const topPlatform = 'N/A';

                // 스마트 메트릭 정보 표시 (더 직관적으로 개선)
                const getTrendIcon = (trend) => {
                    if (trend > 0.3) return '🚀'; // 강한 상승
                    if (trend > 0.1) return '📈'; // 상승
                    if (trend < -0.3) return '📉'; // 강한 하락
                    if (trend < -0.1) return '📊'; // 하락
                    return '➡️'; // 중립
                };

                const metricsHtml = `
                    <div style="margin-top: 15px; padding: 15px; background: #1a1a1a; border-radius: 8px; border: 1px solid #333;">
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center;">
                            <div>
                                <div style="font-size: 20px; margin-bottom: 5px;">${getTrendIcon(newsTrend)}</div>
                                <small style="color: #888; display: block;">News</small>
                                <span style="color: ${newsTrend > 0.1 ? '#28a745' : newsTrend < -0.1 ? '#dc3545' : '#777'}; font-weight: bold; font-size: 12px;">
                                    ${newsTrend > 0 ? '+' : ''}${newsTrend.toFixed(1)}
                                </span>
                            </div>
                            <div>
                                <div style="font-size: 20px; margin-bottom: 5px;">${getTrendIcon(socialTrend)}</div>
                                <small style="color: #888; display: block;">Social</small>
                                <span style="color: ${socialTrend > 0.1 ? '#28a745' : socialTrend < -0.1 ? '#dc3545' : '#777'}; font-weight: bold; font-size: 12px;">
                                    ${socialTrend > 0 ? '+' : ''}${socialTrend.toFixed(1)}
                                </span>
                            </div>
                            <div>
                                <div style="font-size: 20px; margin-bottom: 5px;">⚡</div>
                                <small style="color: #888; display: block;">Momentum</small>
                                <span style="color: ${momentumScore > 70 ? '#28a745' : momentumScore < 40 ? '#dc3545' : '#ffd700'}; font-weight: bold; font-size: 12px;">
                                    ${momentumScore.toFixed(0)}
                                </span>
                            </div>
                            <div>
                                <div style="font-size: 20px; margin-bottom: 5px;">${eventCount > 0 ? '🔥' : '💤'}</div>
                                <small style="color: #888; display: block;">Events</small>
                                <span style="color: ${eventCount > 0 ? '#ffd700' : '#777'}; font-weight: bold; font-size: 12px;">
                                    ${eventCount}
                                </span>
                            </div>
                        </div>
                    </div>
                `;

                // 기존 스마트 메트릭 요소 제거 (중복 방지)
                const existingMetrics = document.querySelector('.smart-metrics-container');
                if (existingMetrics) {
                    existingMetrics.remove();
                }

                // 기존 price/score 정보 영역에 스마트 메트릭 추가
                const infoRow = document.querySelector('.row.mb-4');
                if (infoRow) {
                    const metricsDiv = document.createElement('div');
                    metricsDiv.className = 'smart-metrics-container';
                    metricsDiv.innerHTML = metricsHtml;
                    infoRow.insertAdjacentElement('afterend', metricsDiv);
                }
                
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
                    SIPUSTOCK.renderChart(data.history.recent, 'recent');
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

        SIPUSTOCK.renderChart(SIPUSTOCK.DETAIL_DATA.history[period], period);
    };
	
	
    SIPUSTOCK.closeModal = function() { document.getElementById('detail-modal').classList.add('hidden'); };

    /**
     * 차트 렌더링 메인 함수
     * @param {Array} history - 히스토리 데이터 배열
     * @param {string} period - 기간 (예: "1d", "1w", "1m")
     */
    SIPUSTOCK.renderChart = (history, period) => {
        // 유효성 검사
        if (!Array.isArray(history) || history.length === 0) {
            console.warn("히스토리 데이터가 없습니다.");
            return;
        }

        try {
            // 메인 차트 렌더링
            SIPUSTOCK.renderMainChart(history, period);
            
            // 소셜 차트 렌더링
            SIPUSTOCK.renderSocialChart(history);
        } catch (error) {
            console.error("차트 렌더링 중 오류 발생:", error);
        }
    };

    /**
     * 메인 차트 렌더링 (가격/스코어 + 거래량)
     * @param {Array} history - 히스토리 데이터 배열
     * @param {string} period - 기간 (예: "1d", "1w", "1m")
     */
    SIPUSTOCK.renderMainChart = (history, period) => {
        const mainChartEl = document.getElementById('mainChart');
        if (!mainChartEl) return;

        const mainCtx = mainChartEl.getContext('2d');
        if (SIPUSTOCK.MAIN_CHART_OBJ) {
            SIPUSTOCK.MAIN_CHART_OBJ.destroy();
        }

        // 유효한 데이터 필터링
        const validData = history.filter(h => 
            parseFloat(h.p) > 0
        );

        if (validData.length === 0) {
            console.warn("메인 차트에 표시할 유효한 데이터가 없습니다.");
            return;
        }

        // 데이터 전처리 (sc: -1~1 범위를 0~100으로 노말라이징)
        const labels = SIPUSTOCK.formatTimeLabels(validData);
        const priceData = validData.map(h => parseFloat(h.p) || 0);
        const scoreData = validData.map(h => ((parseFloat(h.sc) || 0) + 1) / 2 * 100);
        const volumeData = SIPUSTOCK.normalizeVolumeData(validData);
        const priceColors = SIPUSTOCK.getPriceColors(validData);

        // 차트 옵션 설정
        const chartOptions = SIPUSTOCK.getMainChartOptions(period);

        const datasets = [
            // 가격 차트 (항상 표시)
            {
                label: CHART_CONFIG.LABELS.PRICE,
                data: priceData,
                borderColor: CHART_CONFIG.COLORS.PRICE,
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.2,
                yAxisID: 'y',
                fill: false
            },
            // 스코어 차트 (항상 표시)
            {
                label: CHART_CONFIG.LABELS.SCORE,
                data: scoreData,
                borderColor: CHART_CONFIG.COLORS.SCORE,
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.2,
                yAxisID: 'y',
                fill: false
            }
        ];

        // 🎯 period가 "recent"가 아닐 때만 거래량 차트 추가
        if (period !== 'recent') {
            datasets.push({
                label: CHART_CONFIG.LABELS.VOLUME,
                data: volumeData,
                backgroundColor: priceColors,
                borderColor: priceColors,
                borderWidth: 1,
                yAxisID: 'y1',
                type: 'bar',
                order: 0
            });
        }

        SIPUSTOCK.MAIN_CHART_OBJ = new Chart(mainCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets 
            },
            options: chartOptions
        });
    };

    /**
     * 소셜 차트 렌더링 (소셜 활동 + 감성 분석)
     * @param {Array} history - 히스토리 데이터 배열
     */
    SIPUSTOCK.renderSocialChart = (history) => {
        const socialChartEl = document.getElementById('socialChart');
        if (!socialChartEl) return;

        const socialCtx = socialChartEl.getContext('2d');
        if (SIPUSTOCK.SOCIAL_CHART_OBJ) {
            SIPUSTOCK.SOCIAL_CHART_OBJ.destroy();
        }

        // 유효한 데이터 필터링 (bi: Buzz Index, s: Sentiment)
        const validData = history.filter(h => 
            parseFloat(h.bi) > 0 || parseFloat(h.s) !== 0
        );

        if (validData.length === 0) {
            console.warn("소셜 차트에 표시할 유효한 데이터가 없습니다.");
            return;
        }

        // 데이터 전처리
        const labels = SIPUSTOCK.formatTimeLabels(validData);
        const socialData = validData.map(h => parseFloat(h.bi) || 0);
        const sentimentData = validData.map(h => ((parseFloat(h.s) || 0) + 1) / 2);
        const socialColors = SIPUSTOCK.getSocialColors(validData);

        // 차트 옵션 설정
        const chartOptions = SIPUSTOCK.getSocialChartOptions();

        SIPUSTOCK.SOCIAL_CHART_OBJ = new Chart(socialCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    // 소셜 활동 바 차트
                    {
                        label: CHART_CONFIG.LABELS.SOCIAL_ACTIVITY,
                        data: socialData,
                        backgroundColor: socialColors,
                        borderColor: socialColors,
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    // 감성 점수 라인 차트
                    {
                        label: CHART_CONFIG.LABELS.SENTIMENT,
                        data: sentimentData,
                        borderColor: CHART_CONFIG.COLORS.SENTIMENT,
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.2,
                        yAxisID: 'y1',
                        type: 'line',
                        fill: false
                    }
                ]
            },
            options: chartOptions
        });
    };

    /**
     * 시간 라벨 포맷팅 (축에 맞게 조정)
     * @param {Array} data - 데이터 배열
     * @returns {Array} 포맷팅된 시간 라벨 배열
     */
    SIPUSTOCK.formatTimeLabels = (data) => {
        return data.map(h => {
            const d = new Date(h.t * 1000);
            // 날짜가 짤리지 않도록 충분한 길이 확보
            return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        });
    };

    /**
     * 거래량 데이터 정규화
     * @param {Array} data - 원본 데이터 배열
     * @returns {Array} 정규화된 거래량 배열
     */
    SIPUSTOCK.normalizeVolumeData = (data) => {
        const maxVolume = Math.max(...data.map(h => parseFloat(h.vol) || 0));
        return data.map(h => {
            const vol = parseFloat(h.vol) || 0;
            return maxVolume > 0 ? (vol / maxVolume) * 100 : 0;
        });
    };

    /**
     * 가격 변동에 따른 색상 결정
     * @param {Array} data - 원본 데이터 배열
     * @returns {Array} 색상 배열
     */
    SIPUSTOCK.getPriceColors = (data) => {
        return data.map((h, i) => {
            if (i === 0) return CHART_CONFIG.COLORS.PRICE; // 첫 번째는 기본 색상
            const prevPrice = parseFloat(data[i-1].p) || 0;
            const currPrice = parseFloat(h.p) || 0;
            return currPrice >= prevPrice ? 
                CHART_CONFIG.COLORS.VOLUME_UP : 
                CHART_CONFIG.COLORS.VOLUME_DOWN;
        });
    };

    /**
     * 소셜 활동 색상 결정 (감성에 따라)
     * @param {Array} data - 원본 데이터 배열
     * @returns {Array} 색상 배열
     */
    SIPUSTOCK.getSocialColors = (data) => {
        return data.map(h => {
            const sentiment = parseFloat(h.s) || 0;
            return sentiment >= 0.5 ? 
                CHART_CONFIG.COLORS.SOCIAL_POSITIVE : 
                CHART_CONFIG.COLORS.SOCIAL_NEGATIVE;
        });
    };

    /**
     * 메인 차트 옵션 반환
     * @returns {Object} 차트 옵션 객체
     */
    SIPUSTOCK.getMainChartOptions = (period) => {
        const scales = {
            x: {
                ticks: { 
                    color: '#555', 
                    font: { size: CHART_CONFIG.SIZES.FONT_SIZE } 
                },
                grid: { display: false }
            },
            y: {
                position: 'left',
                ticks: { color: '#777' },
                grid: { color: '#222' },
                title: {
                    display: true,
                    text: 'Price / Score',
                    color: '#888',
                    font: { size: CHART_CONFIG.SIZES.FONT_SIZE }
                }
            }
        };

        // 🎯 period가 "recent"가 아닐 때만 거래량 Y축 추가
        if (period !== 'recent') {
            scales.y1 = {
                position: 'right',
                ticks: { color: '#777' },
                grid: { display: false },
                title: {
                    display: true,
                    text: 'Volume (%)',
                    color: '#888',
                    font: { size: CHART_CONFIG.SIZES.FONT_SIZE }
                }
            };
        }

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#888',
                        font: { size: CHART_CONFIG.SIZES.FONT_SIZE }
                    }
                }
            },
            scales: scales 
        };
    };

    /**
     * 소셜 차트 옵션 반환
     * @returns {Object} 차트 옵션 객체
     */
    SIPUSTOCK.getSocialChartOptions = () => {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#888',
                        font: { size: CHART_CONFIG.SIZES.FONT_SIZE }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { 
                        color: '#555', 
                        font: { size: CHART_CONFIG.SIZES.FONT_SIZE } 
                    },
                    grid: { display: false }
                },
                y: {
                    position: 'left',
                    ticks: { color: '#777' },
                    grid: { color: '#222' },
                    title: {
                        display: true,
                        text: 'Social Activity',
                        color: '#888',
                        font: { size: CHART_CONFIG.SIZES.FONT_SIZE }
                    }
                },
                y1: {
                    position: 'right',
                    ticks: { color: '#777', min: 0, max: 1 },
                    grid: { display: false },
                    title: {
                        display: true,
                        text: 'Sentiment (0-1)',
                        color: '#888',
                        font: { size: CHART_CONFIG.SIZES.FONT_SIZE }
                    }
                }
            }
        };
    };

    SIPUSTOCK.run = function () { SIPUSTOCK.LOADDATA(); };
    return SIPUSTOCK;
})(window.SIPUSTOCK || {}, jQuery);

SIPUSTOCK.run();