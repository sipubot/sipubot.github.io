/* ==========================================
   SIPUSTOCK Chart Application (Refactored)
   ========================================== */

// ------------------------------------------
// 1. Data Service
// ------------------------------------------
class StockData {
    static async loadTickerDataNav() {
        try {
            const response = await fetch('./stock/tickers.json');        
            const tickerData = await response.json();

            document.getElementById('ticker-nav').innerHTML = tickerData.map(ticker => `
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="StockData.loadMarkdown('${ticker}')">${ticker}</a>
                </li>
            `).join('');
        } catch (error) {
            console.error('Error fetching ticker data:', error);
        }
    }

    static async loadMarkdown(ticker) {
        try {
        // 원하시는 마크다운 파일명으로 변경 가능합니다.
        const response = await fetch(`./stock/tickers/${ticker}.md`);
        // get yahoo finance link with new tab
        const yahooLink = `https://finance.yahoo.com/quote/${ticker}`;  
        //edgar link
        const edgarLink = `https://www.sec.gov/cgi-bin/browse-edgar?CIK=${ticker}&owner=exclude&action=getcompany`;

        if (!response.ok) {
                throw new Error('마크다운 파일을 불러오지 못했습니다.');
            }
            
            const markdownText = await response.text();
            const markdownWithLink = `[Edgar](${edgarLink})\n\n[Yahoo Finance](${yahooLink})\n\n${markdownText}`;

            // 4. 브라우저에 로드된 marked 라이브러리로 변환 후 주입
            document.getElementById('stock-container').innerHTML = marked.parse(markdownWithLink);
        } catch (error) {
            document.getElementById('stock-container').innerHTML = `<p style="color:red;">에러 발생: ${error.message}</p>`;
        }
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
    await StockData.loadTickerDataNav();
});