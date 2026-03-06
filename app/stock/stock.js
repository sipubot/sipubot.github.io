/* ==========================================
   SIPUSTOCK Chart Application (Refactored)
   ========================================== */

const CONFIG = {
    COLORS: {
        PRICE: '#28a745',
        SCORE: '#007bff',
        VOLUME_UP: '#28a745',
        VOLUME_DOWN: '#dc3545',
        SOCIAL_POSITIVE: '#28a745',
        SOCIAL_NEGATIVE: '#dc3545',
        SENTIMENT: '#ffc107'
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

const STATE = {
    data: {},
    detailData: null,
    mainChartObj: null,
    socialChartObj: null,
    // ⭐ v1.6.0: 새로운 차트 객체들
    financialRadarObj: null,
    valuationGaugeObj: null,
    scoreBreakdownObj: null
};

// ------------------------------------------
// 1. Data Service
// ------------------------------------------
class StockData {
    static async fetchOverview() {
        try {
            const re = await fetch("./stock/data/_overview.json");
            const data = await re.json();
            STATE.data = data.signals || data;
            return STATE.data;
        } catch (err) {
            console.error("Data Load Error:", err);
        }
    }

    static async fetchDetail(symbol) {
        try {
            const re = await fetch(`./stock/data/${symbol}.json`);
            const data = await re.json();
            STATE.detailData = data;
            return data;
        } catch (err) {
            console.error("Detail Load Error:", err);
        }
    }
}

// ------------------------------------------
// 2. Chart Service
// ------------------------------------------
class StockChart {
    static renderChart(history, period) {
        if (!Array.isArray(history) || history.length === 0) return;
        this.renderMainChart(history, period);
        this.renderSocialChart(history);
    }

    // ⭐ v1.6.0: 재무 지표 레이더 차트
    static renderFinancialRadar(financial) {
        const ctx = document.getElementById('financialRadar')?.getContext('2d');
        if (!ctx || !financial) return;
        if (STATE.financialRadarObj) STATE.financialRadarObj.destroy();

        // 재무 지표 정규화 (0-100 스케일)
        const normalize = (value, good, bad, inverse = false) => {
            if (!value || value === 0) return 50;
            let score;
            if (inverse) {
                // 낮을수록 좋은 지표 (PER, PBR, 부채비율)
                score = ((bad - value) / (bad - good)) * 100;
            } else {
                // 높을수록 좋은 지표 (ROE, 유동비율)
                score = ((value - bad) / (good - bad)) * 100;
            }
            return Math.max(0, Math.min(100, score));
        };

        const data = {
            labels: ['PER', 'PBR', 'PSR', 'ROE', '부채비율', '유동비율'],
            datasets: [{
                label: '재무건전성',
                data: [
                    normalize(financial.pe_ratio, 15, 30, true),      // PER: 낮을수록 좋음
                    normalize(financial.pb_ratio, 1.5, 3, true),      // PBR: 낮을수록 좋음
                    normalize(financial.ps_ratio, 2, 5, true),        // PSR: 낮을수록 좋음
                    normalize(financial.roe, 5, 20, false),           // ROE: 높을수록 좋음
                    normalize(financial.debt_ratio, 200, 50, true),   // 부채비율: 낮을수록 좋음
                    normalize(financial.current_ratio, 100, 200, false) // 유동비율: 높을수록 좋음
                ],
                backgroundColor: 'rgba(40, 167, 69, 0.2)',
                borderColor: '#28a745',
                borderWidth: 2,
                pointBackgroundColor: '#28a745',
                pointBorderColor: '#fff',
                pointRadius: 4
            }]
        };

        STATE.financialRadarObj = new Chart(ctx, {
            type: 'radar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const labels = ['PER', 'PBR', 'PSR', 'ROE', '부채비율', '유동비율'];
                                const raw = [financial.pe_ratio, financial.pb_ratio, financial.ps_ratio, financial.roe, financial.debt_ratio, financial.current_ratio];
                                return `${labels[ctx.dataIndex]}: ${raw[ctx.dataIndex]?.toFixed(2) || 'N/A'}`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        min: 0,
                        max: 100,
                        ticks: { display: false },
                        pointLabels: {
                            color: '#ccc',
                            font: { size: 11 }
                        },
                        grid: { color: '#333' },
                        angleLines: { color: '#444' }
                    }
                }
            }
        });
    }

    // ⭐ v1.6.0: 기업가치 괴리율 게이지 차트
    static renderValuationGauge(valuation) {
        const ctx = document.getElementById('valuationGauge')?.getContext('2d');
        if (!ctx || !valuation) return;
        if (STATE.valuationGaugeObj) STATE.valuationGaugeObj.destroy();

        const upside = parseFloat(valuation.upside_potential) || 0;
        const grade = valuation.grade || 'C';
        const gradeColors = { 'A': '#28a745', 'B': '#6bcf7f', 'C': '#ffc107', 'D': '#fd7e14', 'F': '#dc3545' };
        const color = gradeColors[grade] || '#ffc107';

        STATE.valuationGaugeObj = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['적정가 대비 괴리율'],
                datasets: [{
                    data: [Math.max(-30, Math.min(50, upside))],
                    backgroundColor: upside > 0 ? '#28a745' : '#dc3545',
                    borderWidth: 0,
                    barThickness: 30
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: () => `적정가: $${valuation.fair_value?.toFixed(2) || 'N/A'} / 현재가: $${valuation.current_price?.toFixed(2) || 'N/A'}`
                        }
                    }
                },
                scales: {
                    x: {
                        min: -30,
                        max: 50,
                        ticks: {
                            color: '#888',
                            callback: (v) => v + '%'
                        },
                        grid: { color: '#333' }
                    },
                    y: { display: false }
                }
            },
            plugins: [{
                id: 'centerLabel',
                afterDraw: (chart) => {
                    const { ctx, chartArea } = chart;
                    const centerX = chartArea.left + (chartArea.right - chartArea.left) / 2;
                    const centerY = chartArea.top + (chartArea.bottom - chartArea.top) / 2;
                    ctx.save();
                    ctx.font = 'bold 14px Arial';
                    ctx.fillStyle = color;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${upside > 0 ? '+' : ''}${upside.toFixed(1)}%`, centerX, centerY);
                    ctx.font = '12px Arial';
                    ctx.fillStyle = '#888';
                    ctx.fillText(`등급 ${grade}`, centerX, centerY + 20);
                    ctx.restore();
                }
            }]
        });
    }

    // ⭐ v1.6.0: 스코어 브레이크다운 도넛 차트
    static renderScoreBreakdown(breakdown) {
        const ctx = document.getElementById('scoreBreakdown')?.getContext('2d');
        if (!ctx || !breakdown) return;
        if (STATE.scoreBreakdownObj) STATE.scoreBreakdownObj.destroy();

        // 점수가 0보다 큰 데이터만 필터링 (최소값 0.001로 표시)
        const rawData = [
            { label: '기술', score: breakdown.technical?.score || 0, weight: breakdown.technical?.weight || 0.3 },
            { label: '재무', score: breakdown.financial?.score || 0, weight: breakdown.financial?.weight || 0.2 },
            { label: '뉴스', score: breakdown.news?.score || 0, weight: breakdown.news?.weight || 0.2 },
            { label: '소셜', score: breakdown.social?.score || 0, weight: breakdown.social?.weight || 0.3 }
        ];

        // 0~100 스케일로 변환하고 최소값 보장
        const data = rawData.map(d => ({
            label: d.label,
            // -1~1 → 0~100 변환, 최소 5%는 표시
            value: Math.max(5, ((d.score + 1) / 2) * 100),
            rawScore: d.score,
            weight: d.weight
        }));

        STATE.scoreBreakdownObj = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => `${d.label} (${(d.weight * 100).toFixed(0)}%)`),
                datasets: [{
                    data: data.map(d => d.value),
                    backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '50%',
                layout: {
                    padding: { top: 5, right: 5, bottom: 5, left: 5 }
                },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { 
                            color: '#ccc', 
                            font: { size: 10 }, 
                            boxWidth: 12,
                            padding: 8
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const d = data[ctx.dataIndex];
                                const scorePercent = ((d.rawScore + 1) / 2 * 100).toFixed(1);
                                return `${d.label}: ${scorePercent}점 (가중치 ${(d.weight * 100).toFixed(0)}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    static renderMainChart(history, period) {
        const ctx = document.getElementById('mainChart')?.getContext('2d');
        if (!ctx) return;
        if (STATE.mainChartObj) STATE.mainChartObj.destroy();

        const validData = history.filter(h => parseFloat(h.p) > 0);
        const labels = validData.map(h => {
            const d = new Date(h.t * 1000);
            return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        });
        const priceData = validData.map(h => parseFloat(h.p) || 0);
        
        // Scale score to price range
        const prices = validData.map(h => parseFloat(h.p) || 0);
        const minP = Math.min(...prices);
        const rangeP = Math.max(...prices) - minP || 1;
        const scoreData = validData.map(h => minP + (((parseFloat(h.sc) || 0) + 1) / 2) * rangeP);

        const volMax = Math.max(...validData.map(h => parseFloat(h.vol) || 0)) || 1;
        const volData = validData.map(h => (parseFloat(h.vol) / volMax) * 100);
        const volColors = validData.map((h, i) => {
            if (i === 0) return CONFIG.COLORS.PRICE;
            return parseFloat(h.p) >= parseFloat(validData[i-1].p) ? CONFIG.COLORS.VOLUME_UP : CONFIG.COLORS.VOLUME_DOWN;
        });

        const datasets = [
            { label: CONFIG.LABELS.PRICE, data: priceData, borderColor: '#fff', borderWidth: 2, pointRadius: 0, yAxisID: 'y' },
            { label: CONFIG.LABELS.SCORE, data: scoreData, borderColor: CONFIG.COLORS.SCORE, borderWidth: 2, pointRadius: 0, yAxisID: 'y' }
        ];

        if (period !== 'recent') {
            datasets.push({ label: CONFIG.LABELS.VOLUME, data: volData, backgroundColor: volColors, type: 'bar', yAxisID: 'y1' });
        }

        STATE.mainChartObj = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: this.getOptions(period, 'Price / Score', 'Volume (%)')
        });
    }

    static renderSocialChart(history) {
        const ctx = document.getElementById('socialChart')?.getContext('2d');
        if (!ctx) return;
        if (STATE.socialChartObj) STATE.socialChartObj.destroy();

        const validData = history.filter(h => parseFloat(h.bi) > 0 || parseFloat(h.s) !== 0);
        const labels = validData.map(h => {
            const d = new Date(h.t * 1000);
            return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        });
        const socialData = validData.map(h => parseFloat(h.bi) || 0);
        const sentimentData = validData.map(h => ((parseFloat(h.s) || 0) + 1) / 2);
        const socialColors = validData.map(h => {
            const s = (parseFloat(h.s) + 1) / 2;
            return s > 0.5 ? '#28a745' : s < 0.5 ? '#dc3545' : '#6c757d';
        });

        STATE.socialChartObj = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: CONFIG.LABELS.SOCIAL_ACTIVITY, data: socialData, borderColor: '#ffc107', borderWidth: 2, pointRadius: 0, yAxisID: 'y' },
                    { label: CONFIG.LABELS.SENTIMENT, data: sentimentData, backgroundColor: socialColors, type: 'bar', yAxisID: 'y1' }
                ]
            },
            options: this.getOptions('social', 'Social Activity', 'Sentiment (0-1)')
        });
    }

    static getOptions(period, leftTitle, rightTitle) {
        const scales = {
            x: { ticks: { color: '#555', font: { size: 10 }, maxTicksLimit: 6 }, grid: { display: false } },
            y: { position: 'left', ticks: { color: '#777' }, grid: { color: '#222' }, title: { display: true, text: leftTitle, color: '#888' } }
        };
        if (period !== 'recent' && period !== 'social') {
            scales.y1 = { position: 'right', ticks: { color: '#777' }, grid: { display: false }, title: { display: true, text: rightTitle, color: '#888' } };
        }
        if (period === 'social') {
            scales.y1 = { type: 'linear', position: 'right', min: 0, max: 1, ticks: { color: '#777', stepSize: 0.5 }, grid: { display: false }, title: { display: true, text: rightTitle, color: '#888' } };
        }
        // 기존 bottom 여백 복원 (차트가 컨테이너 밖으로 튀어나오는 것 방지)
        const isMain = period !== 'social';
        return {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: { top: 5, right: 10, bottom: isMain ? 50 : 40, left: 5 }
            },
            plugins: { legend: { display: true, labels: { color: '#888', font: { size: 10 } } } },
            scales
        };
    }
}

// ------------------------------------------
// 3. UI Controller
// ------------------------------------------
class StockUI {
    static async filter(type, element) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        if (element) element.classList.add('active');
        this.renderList(type);
    }

    static renderList(type) {
        const node = document.getElementById('list_stock');
        if (!node) return;
        node.innerHTML = '';

        const signals = Array.isArray(STATE.data) ? STATE.data : Object.values(STATE.data);
        signals.forEach(s => {
            const status = (s.status || "").toUpperCase();
            if (type !== "ALL") {
                if (type === "STABLE" && status !== "STABLE" && status !== "NEUTRAL") return;
                else if (type === "DIVERGENCE" && status !== "DIVERGENCE") return;
                else if (type === "HOT" && status !== "HOT") return;
                else if (type === "COLD" && status !== "COLD") return;
                else if (type === "FREEZE" && status !== "FREEZE") return;
                else if (type === "HIGH_MOMENTUM" && (parseFloat(s.ms) || 0) < 75) return;
                else if (type !== "STABLE" && type !== "HIGH_MOMENTUM" && status !== type) return;
            }

            const tr = document.createElement('tr');
            if (parseFloat(s.ms) > 75) tr.style.cssText = 'border-left: 3px solid #ffd700; background: rgba(255,215,0,0.05);';
            
            const pc = s.pc === "green" ? "#28a745" : s.pc === "red" ? "#dc3545" : "#ccc";
            const score = (((parseFloat(s.score) || 0) + 1) / 2) * 100;
            const scoreColor = score >= 80 ? "#28a745" : score >= 60 ? "#ffc107" : score >= 40 ? "#fd7e14" : "#dc3545";
            const nt = parseFloat(s.nt) || 0;
            const momentum = Math.min(100, Math.max(0, parseFloat(s.ms) || 50));

            const momentumBar = `<div style="width:40px; height:4px; background:#333; border-radius:2px; overflow:hidden; display:inline-block; margin-left:2px;"><div style="width:${momentum}%; height:100%; background:linear-gradient(90deg, #dc3545 0%, #ffc107 50%, #28a745 100%); border-radius:2px;"></div></div>`;
            const eventCount = parseInt(s.ec) || 0;
            const eventIndicator = eventCount > 0 ? `<i class="fa-solid fa-fire" style="color:#ffd700; margin-left:2px;" title="${eventCount} events"></i>` : '';

            tr.innerHTML = `
                <td class="font-weight-bold" style="color:#fff;">${s.t}</td>
                <td style="color:${pc}; font-family:monospace;">$${(parseFloat(s.p) || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                ${this.getStatusCell(status)}
                <td class="text-center">${s.sb === true ? '📡' : ''}${eventCount > 0 ? '🔔' : ''}</td>
                <td style="color:${scoreColor}; font-family:monospace; font-weight:bold;">${score.toFixed(1)}</td>
                <td class="text-center" style="font-size:14px;">${nt > 0.1 ? '📈' : nt < -0.1 ? '📉' : '➡️'}</td>
                <td style="font-family:monospace; font-size:11px; text-align:center;">${momentum.toFixed(0)}${momentumBar}${eventIndicator}</td>
                <td class="text-center"><button class="btn btn-sm btn-secondary py-0 px-2" onclick="window.SIPUSTOCK.OPEN_MODAL('${s.t}')"><i class="fa-solid fa-arrow-up-right-from-square"></i></button></td>
            `;
            node.appendChild(tr);
        });
    }

    static getStatusCell(status) {
        if (status === "HOT")
            return `<td class="text-center" title="HOT"><span style="background:linear-gradient(45deg,#ff6b35,#ff4757);border-radius:3px;padding:2px 4px;">🔥</span></td>`;
        if (status === "DIVERGENCE")
            return `<td class="text-center" title="DIVERGENCE"><span style="background:linear-gradient(45deg,#ffa726,#fb8c00);border-radius:3px;padding:2px 4px;">⚠️</span></td>`;
        if (status === "STABLE")
            return `<td class="text-center" title="STABLE"><span style="color:#28a745;">📈</span></td>`;
        if (status === "COLD")
            return `<td class="text-center" title="COLD"><span style="color:#17a2b8;">❄️</span></td>`;
        if (status === "FREEZE")
            return `<td class="text-center" title="FREEZE"><span style="color:#6c757d;">🧊</span></td>`;
        return `<td class="text-center">⚪</td>`;
    }

    static async openModal(symbol) {
        const data = await StockData.fetchDetail(symbol);
        if (!data) return;
        const s = (Array.isArray(STATE.data) ? STATE.data : Object.values(STATE.data)).find(i => i.t === symbol);
        
        document.getElementById('modal-ticker').innerText = symbol;

        const yahooBtn = document.getElementById('yahoo-link');
        if (yahooBtn) yahooBtn.href = `https://finance.yahoo.com/quote/${symbol}`;

        document.getElementById('modal-price').innerText = `$${(parseFloat(s?.p)||0).toLocaleString(undefined, {minimumFractionDigits:2})}`;
        document.getElementById('modal-score').innerText = ((((parseFloat(s?.score)||0)+1)/2)*100).toFixed(1);
        
        const feed = document.getElementById('social-feed');
        if (feed) {
            feed.innerHTML = '';
            [...(data.links?.news || []), ...(data.links?.social || [])].forEach(l => {
                feed.insertAdjacentHTML('beforeend', `<div style="border:1px solid #333; padding:5px; margin-bottom:5px; background:#1a1a1a;"><small style="color:#666;">${l.platform||'INFO'}</small><a href="${l.link||l.url}" target="_blank" style="color:#ccc; display:block; text-decoration:none; font-size:12px;">${l.title}</a></div>`);
            });
        }

        // ⭐ v1.6.0: 재무/기업가치/스코어 브레이크다운 차트 렌더링
        const financialContainer = document.getElementById('financial-metrics-container');
        if (financialContainer) {
            financialContainer.style.display = data.financial ? 'block' : 'none';
            if (data.financial) {
                setTimeout(() => {
                    StockChart.renderFinancialRadar(data.financial);
                }, 100);
            }
        }

        const valuationContainer = document.getElementById('valuation-container');
        if (valuationContainer) {
            valuationContainer.style.display = data.valuation ? 'block' : 'none';
            if (data.valuation) {
                setTimeout(() => {
                    StockChart.renderValuationGauge(data.valuation);
                }, 150);
            }
        }

        const scoreBreakdownContainer = document.getElementById('score-breakdown-container');
        if (scoreBreakdownContainer) {
            scoreBreakdownContainer.style.display = data.score_breakdown ? 'block' : 'none';
            if (data.score_breakdown) {
                setTimeout(() => {
                    StockChart.renderScoreBreakdown(data.score_breakdown);
                }, 200);
            }
        }

        // 기간 버튼 초기화
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.period-btn')?.classList.add('active');
        
        // Bootstrap 4 modal open (jQuery 사용)
        $('#detail-modal').modal('show');
        setTimeout(() => StockChart.renderChart(data.history.recent, 'recent'), 300);
    }

    static changePeriod(period) {
        if (!STATE.detailData?.history[period]) return;
        document.querySelectorAll('.period-btn').forEach(b => b.classList.toggle('active', b.getAttribute('onclick')?.includes(period)));
        StockChart.renderChart(STATE.detailData.history[period], period);
    }
}

// ------------------------------------------
// 4. Global API & Init
// ------------------------------------------
window.SIPUSTOCK = {
    FILTER: (t, e) => StockUI.filter(t, e),
    OPEN_MODAL: (s) => StockUI.openModal(s),
    CHANGE_PERIOD: (p) => StockUI.changePeriod(p),
    closeModal: () => $('#detail-modal').modal('hide')
};

document.addEventListener('DOMContentLoaded', async () => {
    await StockData.fetchOverview();
    StockUI.filter("ALL", document.querySelector('.filter-btn'));
});
