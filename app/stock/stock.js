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
    socialChartObj: null
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
