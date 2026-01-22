// خريطة الأعلام للعملات
const CURRENCY_FLAGS = {
    'الدولار الأمريكي': '🇺🇸',
    'اليورو': '🇪🇺',
    'الجنيه الاسترليني': '🇬🇧',
    'الدولار الكندي': '🇨🇦',
    'الدولار الاسترالي': '🇦🇺',
    'الفرنك السويسري': '🇨🇭',
    'الين الياباني': '🇯🇵',
    'اليوان الصيني': '🇨🇳',
    'الدينار التونسي': '🇹🇳',
    'الدرهم المغربي': '🇲🇦',
    'الجنيه المصري': '🇪🇬'
};

// قائمة بروكسيات بديلة للتجربة
const PROXIES = [
    {
        name: 'AllOrigins',
        getUrl: (target) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`
    },
    {
        name: 'CodeTabs',
        getUrl: (target) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`
    },
    {
        name: 'CORS Anywhere',
        getUrl: (target) => `https://cors-anywhere.herokuapp.com/${target}`
    }
];

async function fetchFromCBL(selectedCurrency = 'الدولار الأمريكي') {
    const targetUrl = 'https://cbl.gov.ly/currency-exchange-rates/';
    let lastError = null;

    // تحديث العلم في الواجهة فوراً
    document.getElementById('target-flag').innerText = CURRENCY_FLAGS[selectedCurrency] || '🏳️';
    document.getElementById('target-name').innerText = selectedCurrency;

    for (let i = 0; i < PROXIES.length; i++) {
        const proxy = PROXIES[i];
        const proxyUrl = proxy.getUrl(targetUrl);

        try {
            console.log(`🔄 محاولة ${i + 1}: ${proxy.name}...`);

            const response = await fetch(proxyUrl, {
                signal: AbortSignal.timeout(12000)
            });

            if (!response.ok) throw new Error(`Status ${response.status}`);

            const html = await response.text();
            if (!html || html.length < 500) throw new Error('Invalid HTML response');

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const rows = doc.querySelectorAll('tr');

            let currencyData = null;

            rows.forEach(row => {
                const text = row.innerText;
                if (text.includes(selectedCurrency)) {
                    const cols = row.querySelectorAll('td');
                    if (cols.length >= 6) {
                        currencyData = {
                            name: selectedCurrency,
                            date: cols[0].textContent.trim(),
                            avg: cols[3].textContent.trim(),
                            sell: cols[4].textContent.trim(),
                            buy: cols[5].textContent.trim()
                        };
                    }
                }
            });

            if (currencyData) {
                updateUI(currencyData);
                return;
            } else {
                throw new Error('Currency row not found');
            }

        } catch (error) {
            console.warn(`❌ ${proxy.name} failed:`, error.message);
            lastError = error;
        }
    }

    showError(lastError?.message);
}

function updateUI(data) {
    document.getElementById('buy').innerText = data.buy;
    document.getElementById('sell').innerText = data.sell;
    document.getElementById('avg').innerText = data.avg;
    document.getElementById('date').innerText = "نشرة بتاريخ: " + data.date;

    document.getElementById('loader-container').style.display = 'none';
    document.getElementById('data-container').style.display = 'block';
}

function showError(msg) {
    document.getElementById('loader-container').innerHTML = `
        <div style="background: #fef2f2; padding: 20px; border-radius: 20px; border: 1px solid #fee2e2;">
            <p style="color: #991b1b; font-weight: 700; margin-bottom: 10px;">⚠️ فشل جلب البيانات</p>
            <p style="color: #b91c1c; font-size: 0.85rem; margin-bottom: 15px;">${msg || 'خطأ في الاتصال بخادم المصرف المركزي'}</p>
            <button onclick="location.reload()" style="background: #991b1b; color: white; border: none; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-weight: 600;">إعادة المحاولة</button>
        </div>
    `;
}

// تهيئة الأحداث
window.onload = () => {
    fetchFromCBL();

    const select = document.getElementById('currency-select');
    const refreshBtn = document.getElementById('refresh-btn');

    select.onchange = (e) => {
        resetUI();
        fetchFromCBL(e.target.value);
    };

    refreshBtn.onclick = () => {
        resetUI();
        fetchFromCBL(select.value);
    };
};

function resetUI() {
    document.getElementById('loader-container').style.display = 'block';
    document.getElementById('data-container').style.display = 'none';
}
