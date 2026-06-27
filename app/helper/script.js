// ===== 사용자 정의 변환 함수 =====
function customTransform(type, rows, inputDelimiter, outputDelimiter) {
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return '';
    }
    
    let actualDelimiter = outputDelimiter;
    if (outputDelimiter === '\\t' || outputDelimiter === '\\t') {
        actualDelimiter = '\t';
    }
    
    if (!type || type === 'default') {
        return rows.map(row => {
            if (!Array.isArray(row)) return String(row);
            return row.join(actualDelimiter);
        }).join('\n');
    }
    
    return rows.map(row => {
        if (!Array.isArray(row)) return '';
        
        console.log(row);
        let ticker = ''; 
        let quantity = '';
        let total = '';
        let fee = '';
        let dividend = ''; 
        let isDividend = false;

        if (type === 'IBKR') {
            ticker = row[4].split(' ').join('').trim();
            quantity = Math.abs(+row[5].trim());
            total = (row[7].replace(',', '')).trim();
            fee = Math.abs(+row[8].trim()).toFixed(2);
            if (row[2].includes('Dividend')) {
                dividend = (row[9].replace(',', '')).trim();
                total = '';
                fee = '';
                quantity = '';
                isDividend = true;
            }

        } else if (type === 'CHSC') {
        //6/10/26, 6:19:48 PM	JRN	IBM CORP -1.27 US$	$0.00	$0.00	-$1.27	$30,960.13
        //6/10/26, 6:19:48 PM	DOI	Qualified Dividend - IBM CORP 8.45 US$	$0.00	$0.00	$8.45	$30,961.40
        //chsc 배당은 매도와 같은 라인에 붙어있다. 매도라인에서 배당이 있으면 배당으로 간주한다.
            ticker = row[2].split(' ')[2].trim();
            quantity = Math.abs(+row[2].split(' ')[1].trim());
            total = (row[5].split('$').join('').split(',').join('')).trim();
            fee = Math.abs(row[3].split('$').join('').split(',').join('').trim());
            if (row[1].trim() === 'DOI' || row[1].trim() === 'JRN') {
                isDividend = true;
                ticker = ""; //추출불가 
                dividend = total;
            }

        }

        
        console.log(total, actualDelimiter);
        if (isDividend) {
            return [ticker, '', '', '', '', '', dividend].join(actualDelimiter);
        } else if (total < 0 ) {
            return [ticker, quantity,'', Math.abs(total), '', fee, '', ''].join(actualDelimiter);
        } else {
            console.log(Math.abs(+total));
            return [ticker,'', quantity , '', Math.abs(total), fee, ''].join(actualDelimiter);
        }
    }).reverse().join('\n');
}

// 구분자 감지 함수
function detectDelimiter(text) {
    const lines = text.trim().split('\n').slice(0, 5);
    const delimiters = ['\t', ',', '|', '  '];
    let bestDelimiter = '\t';
    let maxCount = 0;

    for (const delim of delimiters) {
        const counts = lines.map(line => (line.split(delim).length - 1));
        const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
        if (avgCount > maxCount) {
            maxCount = avgCount;
            bestDelimiter = delim;
        }
    }
    return bestDelimiter;
}

// 텍스트를 행/열로 파싱
function parseText(text, delimiter) {
    if (!text.trim()) return [];
    const lines = text.trim().split('\n');
    return lines.map(line => {
        if (delimiter === '  ') {
            return line.split(/\s{2,}/);
        }
        return line.split(delimiter);
    });
}

// 변환 실행
function convert(type = 'default') {
    const inputText = document.getElementById('inputText').value;
    const outputTextarea = document.getElementById('outputText');
    const statusDiv = document.getElementById('status');

    if (!inputText.trim()) {
        statusDiv.textContent = '입력 데이터가 없습니다.';
        statusDiv.className = 'status error';
        return;
    }

    try {
        let inputDelimiter = document.getElementById('inputDelimiter').value;
        if (inputDelimiter === 'auto') {
            inputDelimiter = detectDelimiter(inputText);
        }

        let outputDelimiter = document.getElementById('outputDelimiter').value;
        if (outputDelimiter === 'custom') {
            const custom = document.getElementById('customDelimiter').value;
            outputDelimiter = custom || '\t';
        }

        const rows = parseText(inputText, inputDelimiter);
        const result = customTransform(type, rows, inputDelimiter, outputDelimiter);

        outputTextarea.value = result;
        statusDiv.textContent = `변환 완료: ${rows.length}행 × ${rows[0]?.length || 0}열`;
        statusDiv.className = 'status success';
    } catch (error) {
        statusDiv.textContent = '변환 오류: ' + error.message;
        statusDiv.className = 'status error';
        console.error(error);
    }
}

// 출력 복사
async function copyOutput() {
    const outputText = document.getElementById('outputText').value;
    const statusDiv = document.getElementById('status');

    if (!outputText) {
        statusDiv.textContent = '복사할 내용이 없습니다.';
        statusDiv.className = 'status error';
        return;
    }

    try {
        await navigator.clipboard.writeText(outputText);
        statusDiv.textContent = '클립보드에 복사되었습니다!';
        statusDiv.className = 'status success';
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status';
        }, 2000);
    } catch (err) {
        statusDiv.textContent = '복사 실패: ' + err.message;
        statusDiv.className = 'status error';
    }
}

// 전체 지우기
function clearAll() {
    document.getElementById('inputText').value = '';
    document.getElementById('outputText').value = '';
    document.getElementById('status').textContent = '';
    document.getElementById('inputText').focus();
}

// 탭 전환 함수
function switchTab(tabId, buttonElement) {
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(el => {
        el.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    if (buttonElement) {
        buttonElement.classList.add('active');
    }
}

// ========== Stock 거래 데이터 변환 ==========

let stockHeaderDetected = false;
let stockHeaderTokens = null;

function parseNumber(s) {
    if (!s) return null;
    s = String(s).trim().replace(/\$/g, '').replace(/,/g, '');
    if (s === '') return null;
    const n = Number(s);
    return Number.isNaN(n) ? null : n;
}

function parseStockLine(line) {
    const raw = line.replace(/\r?\n$/, '');
    if (!raw.trim()) return null;
    const tokens = raw.split(/\t|\s{2,}/).map(t => t);

    let rateRaw = null;
    let exchangeRate = null;
    let rateTokenIndex = -1;
    const colStr = document.getElementById('rateCol').value;
    const n = parseInt(colStr, 10);
    if (!Number.isNaN(n) && n > 0) {
        const idx = n - 1;
        if (idx < tokens.length) {
            const tok = tokens[idx];
            const isNum = /^[-+]?\$?\d{1,3}(?:,\d{3})*(?:\.\d+)?$|^[-+]?\$?\d+(?:\.\d+)?$/.test(tok);
            if (isNum) {
                rateRaw = tok;
                exchangeRate = parseNumber(rateRaw);
                rateTokenIndex = idx;
            }
        }
    }

    function getTok(i) {
        return (i >= 0 && i < tokens.length) ? tokens[i].trim() : null;
    }
console.log('Tokens:', tokens, 'Rate:', exchangeRate);
    // 월 정보에서 년도가 없으면 현재 연도 붙이기
    let monthCode = getTok(0);
    console.log('Original month code:', monthCode);
    console.log('Month code pattern test:', monthCode && /^\d{2}-\d{2}$/.test(monthCode));  
    // 테스트코드 수정 01-01 로 들어온다.
    if (monthCode && /^\d{2}-\d{2}$/.test(monthCode)) {
        const currentYear = new Date().getFullYear();
        monthCode = currentYear + '-' + monthCode;
    }

    const obj = {
        raw: raw,
        tokens: tokens,
        rate_token_index: rateTokenIndex,
        exchange_rate_raw: rateRaw,
        exchange_rate: exchangeRate,
        date: monthCode,
        month_code: monthCode,
        ticker: getTok(2),
        buy_qty: getTok(3),
        sell_qty: getTok(4),
        buy_amount: getTok(5),
        sell_amount: getTok(6),
        fee: getTok(7),
        deposit_dividend: getTok(8),
        avg_price: getTok(9),
        month: getTok(10),
    };

    ['buy_qty','sell_qty','buy_amount','sell_amount','fee','avg_price','month_code','month', 'exchange_rate', 'deposit_dividend'].forEach(k=>{
        if (obj[k] !== null && obj[k] !== undefined) {
            obj[k] = String(obj[k]);
        }
        if (obj[k] != null && obj[k] !== '') {
            const v = obj[k].replace(/\$/g,'').replace(/,/g,'').trim();
            const m = Number(v);
            if (!Number.isNaN(m)) obj[k] = m;
        }
    });

    return obj;
}

function parseStockText(text) {
    const lines = text.split(/\r?\n/);
    const rows = [];
    let startIdx = 0;
    if (stockHeaderDetected) startIdx = 1;

    for (let i = 0; i < lines.length; i++) {
        const ln = lines[i];
        if (i < startIdx) continue;
        const parsed = parseStockLine(ln);
        if (parsed) rows.push(parsed);
    }
    return rows;
}

function convertStock() {
    const raw = document.getElementById('stockInput').value || '';
    const rows = parseStockText(raw);
    rows.sort((a, b) => {
        try {
            return new Date(a.tokens[0]) - new Date(b.tokens[0]);
        } catch (e) { return 0; }
    });

    const list = [];
    const seen = new Set();
    for (const r of rows) {
        const date = (r.tokens && r.tokens[0]) ? r.tokens[0] : null;
        const rate = (r.exchange_rate !== null && r.exchange_rate !== undefined) ? r.exchange_rate : null;
        if (!date || rate === null) continue;
        const key = date + '|' + rate;
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({ date: date, rate: Number(rate) });
    }

    document.getElementById('stockOutput').value = JSON.stringify(list);
    document.getElementById('stockStatus').textContent = '환율 변환 완료';
    document.getElementById('stockStatus').className = 'status success';
}

function extractBuySell() {
    const raw = document.getElementById('stockInput').value || '';
    const rows = parseStockText(raw);
    const account = document.getElementById('accountSelect').value;
    const extracted = [];

    for (const r of rows) {
        if (r.buy_qty && r.buy_amount || r.sell_qty && r.sell_amount) {
            extracted.push([account, r.ticker, r.date, r.buy_qty, r.sell_qty, r.buy_amount, r.sell_amount, r.fee].join('\t'));
        }
    }
    document.getElementById('stockOutput').value = extracted.join('\n');
    document.getElementById('stockStatus').textContent = `매수/매도 ${extracted.length}건 추출됨`;
    document.getElementById('stockStatus').className = 'status success';
}

function extractDividend() {
    const raw = document.getElementById('stockInput').value || '';
    const rows = parseStockText(raw);
    const account = document.getElementById('accountSelect').value;
    const extracted = [];

    let tempDividend = null;
    let tempDate = null;
    let tempTicker = null;

    for (const r of rows) {
        if (["예수금","이자","기타"].includes(r.ticker)) {
            continue;
        } else if (r.deposit_dividend && r.deposit_dividend > 0) {
            tempDividend = r.deposit_dividend;
            tempDate = r.date;
            tempTicker = r.ticker;
        } else if (tempDividend && tempDate === r.date && tempTicker === r.ticker) {
            const tax = r.deposit_dividend && r.deposit_dividend < 0 ? r.deposit_dividend : null;
            extracted.push([account, tempTicker, tempDate, tempDividend, tax * -1 || ''].join('\t'));
            tempDividend = null;
            tempDate = null;
            tempTicker = null;
        }
    }
    document.getElementById('stockOutput').value = extracted.join('\n');
    document.getElementById('stockStatus').textContent = `배당 ${extracted.length}건 추출됨`;
    document.getElementById('stockStatus').className = 'status success';
}

function extractOther() {
    const raw = document.getElementById('stockInput').value || '';
    const rows = parseStockText(raw);
    const extracted = [];

    for (const r of rows) {
        if (["예수금","이자","기타"].includes(r.ticker)) {
            extracted.push([r.date, r.ticker, r.deposit_dividend].join('\t'));
        }
    }
    document.getElementById('stockOutput').value = extracted.join('\n');
    document.getElementById('stockStatus').textContent = `기타 거래 ${extracted.length}건 추출됨`;
    document.getElementById('stockStatus').className = 'status success';
}

function extractTicker() {
    const raw = document.getElementById('stockInput').value || '';
    const rows = parseStockText(raw);
    const tickers = new Set();

    for (const r of rows) {
        if (["예수금","이자","기타"].includes(r.ticker)) {
            continue;
        }
        if (r.ticker) {
            tickers.add(r.ticker);
        }
    }
    document.getElementById('stockOutput').value = Array.from(tickers).sort().join('\n');
    document.getElementById('stockStatus').textContent = `티커 ${tickers.size}개 추출됨`;
    document.getElementById('stockStatus').className = 'status success';
}

function loadFile() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files.length) {
        document.getElementById('stockStatus').textContent = '파일을 선택하세요';
        document.getElementById('stockStatus').className = 'status error';
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const txt = e.target.result;
        document.getElementById('stockInput').value = txt;
        detectStockHeader(txt);
        convertStock();
    };
    reader.onerror = function() {
        document.getElementById('stockStatus').textContent = '파일 읽기 오류';
        document.getElementById('stockStatus').className = 'status error';
    };
    reader.readAsText(file, 'utf-8');
}

function detectStockHeader(text) {
    stockHeaderDetected = false;
    stockHeaderTokens = null;
    if (!text) return false;
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0);
    if (lines.length === 0) return false;
    const first = lines[0];
    const tokens = first.split(/\t|\s{2,}/).map(t=>t);
    if (tokens.length < 2) return false;
    const wanted = ['일자','월','종목','매수','매도','매수액','매도액','수수료','예치/배당','평단','월','환율'];
    let foundAny = false;
    for (let i=0;i<tokens.length;i++){
        const tnorm = tokens[i].replace(/\s+/g,'');
        for (const w of wanted){
            if (tnorm.indexOf(w) !== -1) { foundAny = true; break; }
        }
        if (foundAny) break;
    }
    if (!foundAny) return false;
    
    let rateIdx = -1;
    for (let i=0;i<tokens.length;i++){
        const t = tokens[i].replace(/\s+/g,'').toLowerCase();
        if (t.indexOf('환율') !== -1) { rateIdx = i; break; }
    }
    if (rateIdx >= 0) {
        document.getElementById('rateCol').value = String(rateIdx+1);
    }
    stockHeaderDetected = true;
    stockHeaderTokens = tokens;
    return true;
}

async function copyStockOutput() {
    const outputText = document.getElementById('stockOutput').value;
    const statusDiv = document.getElementById('stockStatus');

    if (!outputText) {
        statusDiv.textContent = '복사할 내용이 없습니다.';
        statusDiv.className = 'status error';
        return;
    }

    try {
        await navigator.clipboard.writeText(outputText);
        statusDiv.textContent = '클립보드에 복사되었습니다!';
        statusDiv.className = 'status success';
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status';
        }, 2000);
    } catch (err) {
        statusDiv.textContent = '복사 실패: ' + err.message;
        statusDiv.className = 'status error';
    }
}

function clearStock() {
    document.getElementById('stockInput').value = '';
    document.getElementById('stockOutput').value = '';
    document.getElementById('stockStatus').textContent = '';
    document.getElementById('fileInput').value = '';
    stockHeaderDetected = false;
}

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    const outputDelimiter = document.getElementById('outputDelimiter');
    if (outputDelimiter) {
        outputDelimiter.addEventListener('change', function() {
            const customInput = document.getElementById('customDelimiter');
            if (customInput) {
                customInput.style.display = this.value === 'custom' ? 'inline-block' : 'none';
            }
        });
    }

    const inputText = document.getElementById('inputText');
    if (inputText) {
        inputText.focus();
        let debounceTimer;
        inputText.addEventListener('input', function() {
            if (document.getElementById('autoConvert').checked) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(convert, 500);
            }
        });
    }

    document.querySelectorAll('.option-item input, .option-item select').forEach(el => {
        el.addEventListener('change', function() {
            if (document.getElementById('autoConvert').checked && document.getElementById('inputText').value) {
                convert();
            }
        });
    });
});
