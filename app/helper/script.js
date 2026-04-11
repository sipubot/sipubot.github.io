// ===== 사용자 정의 변환 함수 =====
// 이 함수를 수정하여 원하는 변환 로직을 구현하세요
function customTransform(type, rows, inputDelimiter, outputDelimiter) {
    // rows: 2차원 배열 (각 행이 배열로 분리됨)
    // inputDelimiter: 입력 구분자
    // outputDelimiter: 출력 구분자
    
    // 유효성 검사
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return '';
    }
    
    // 구글 시트 호환성: 탭 문자를 실제 탭 문자로 변환
    let actualDelimiter = outputDelimiter;
    if (outputDelimiter === '\\t' || outputDelimiter === '\\t') {
        actualDelimiter = '\t';
    }
    
    // 기본 변환: 단순히 구분자만 변경
    if (!type || type === 'default') {
        return rows.map(row => {
            if (!Array.isArray(row)) return String(row);
            return row.join(actualDelimiter);
        }).join('\n');
    }
    
    //ibkr 예시 
    //2026-03-03 	U***45252 	DIREXION DAILY SEMI BULL 3X 	Buy 	SOXL 	7.00 	53.1000  USD 	-371.70 	0.01 	-371.69 
    //2026-04-07 	U***45252 	SGOV(US46436E7186) Cash Dividend USD 0.292689 per Share (Ordinary Dividend) 	Dividend 	SGOV 	- 	- 	87.81 	- 	87.81
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
            // IBKR 특정 변환 로직
            //ticker, quantity, price, currency, total, fee 등 필요한 필드 추출 및 재배치
            ticker = row[4].split(' ').join('').trim(); // 예시에서는 4번째 열이 "Buy SOXL" 형태
            quantity = Math.abs(+row[5].trim()); // 무조건 양수
            total = (row[7].replace(',', '')).trim(); // 예시에서는 9번째 열이 "-371.70" 형태
            fee = Math.abs(+row[8].trim()).toFixed(2); // 무조건 양수 소수점 2자리
            if (row[2].includes('Dividend')) {
                dividend = (row[9].replace(',', '')).trim(); // 예시에서는 10번째 열이 "-87.81" 형태
                total = ''; // 배당인 경우 매매 관련 데이터셋팅 안함
                fee = '';
                quantity = '';
                isDividend = true;
            }

        } else if (type === 'CHSC') {
            // CHSC 특정 변환 로직
            //2003/6/26, 오후 8:56:34	TRD	BOT +10 SOXL @52.60	$0.00	$0.00	-$526.00	$19,715.20
            //4/10/26, 10:49:19 PM	TRD	BOT +4 SMCZ @37.00	$0.00	$0.00	-$148.00	$33,204.53

            ticker = row[2].split(' ')[2].trim(); // 예시에서는 3번째 열이 "BOT +10 SOXL @52.60" 형태
            quantity = Math.abs(+row[2].split(' ')[1].trim()); // "+10"에서 수량 추출
            total = (row[5].split('$').join('')).trim(); // 예시에서는 6번째 열이 총액
            fee = 0;
        }

        //SOXL  7.00        -371.70 * -1    Math.round(fee * -1, 2)
        //매도일때
        //SOXL  7.00        -371.70         Math.round(fee, 2)

        //매수일때 토탈이 음수면 매수이니
		console.log(total, actualDelimiter);
        if (isDividend) {
            return [ticker, '', '', '', '', '', dividend].join(actualDelimiter);
        } else if (total < 0 ) {
            return [ticker, quantity,'',Math.abs(total), '', fee, ''].join(actualDelimiter);
        } else {
            return [ticker,'', quantity , '', Math.abs(total), fee, ''].join(actualDelimiter);
        }
    }).reverse().join('\n');


    // ===== 커스텀 변환 예시들 =====
    // 예시 1: 마크다운 테이블로 변환
    /*
    const header = processedRows[0];
    const separator = header.map(() => '---').join('|');
    const lines = [
        '|' + header.join('|') + '|',
        '|' + separator + '|',
        ...processedRows.slice(1).map(row => '|' + row.join('|') + '|')
    ];
    return lines.join('\n');
    */

    // 예시 2: JSON 배열로 변환
    /*
    const headers = processedRows[0];
    const data = processedRows.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = row[i]);
        return obj;
    });
    return JSON.stringify(data, null, 2);
    */

    // 예시 3: HTML 테이블로 변환
    /*
    const html = [
        '<table>',
        '  <thead>',
        '    <tr><th>' + processedRows[0].join('</th><th>') + '</th></tr>',
        '  </thead>',
        '  <tbody>',
        ...processedRows.slice(1).map(row =>
        '    <tr><td>' + row.join('</td><td>') + '</td></tr>'),
        '  </tbody>',
        '</table>'
    ];
    return html.join('\n');
    */
}
// ===== 사용자 정의 변환 함수 끝 =====

// 구분자 감지 함수
function detectDelimiter(text) {
    const lines = text.trim().split('\n').slice(0, 5); // 처음 5줄만 검사
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
function parseText( text, delimiter) {
    if (!text.trim()) return [];

    const lines = text.trim().split('\n');
    return lines.map(line => {
        if (delimiter === '  ') {
            // 두 칸 이상 공백을 구분자로 처리
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
        // 입력 구분자 결정
        let inputDelimiter = document.getElementById('inputDelimiter').value;
        if (inputDelimiter === 'auto') {
            inputDelimiter = detectDelimiter(inputText);
        }

        // 출력 구분자 결정
        let outputDelimiter = document.getElementById('outputDelimiter').value;
        if (outputDelimiter === 'custom') {
            const custom = document.getElementById('customDelimiter').value;
            outputDelimiter = custom || '\t'; // 기본값은 탭
        }

        // 파싱 및 변환
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

// 출력 구분자 변경 시 커스텀 입력 필드 토글
document.getElementById('outputDelimiter').addEventListener('change', function() {
    const customInput = document.getElementById('customDelimiter');
    customInput.style.display = this.value === 'custom' ? 'inline-block' : 'none';
});

// 자동 변환 설정
let debounceTimer;
document.getElementById('inputText').addEventListener('input', function() {
    if (document.getElementById('autoConvert').checked) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(convert, 500);
    }
});

// 옵션 변경 시 자동 변환
document.querySelectorAll('.option-item input, .option-item select').forEach(el => {
    el.addEventListener('change', function() {
        if (document.getElementById('autoConvert').checked && document.getElementById('inputText').value) {
            convert();
        }
    });
});

// 페이지 로드 시 입력란에 포커스
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('inputText').focus();
});
