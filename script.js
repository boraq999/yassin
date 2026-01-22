async function fetchFromCBL(selectedCurrency = 'الدولار الأمريكي') {
    const targetUrl = 'https://cbl.gov.ly/currency-exchange-rates/';

    // سنحاول استخدام بروكسي مختلف (codetabs) فهو أحياناً أسرع وأكثر استقراراً
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;

    try {
        console.log("جاري محاولة الاتصال...");
        const response = await fetch(proxyUrl);

        if (!response.ok) throw new Error(`خطأ في الاستجابة: ${response.status}`);

        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const rows = doc.querySelectorAll('tr');

        let currencyData = null;

        rows.forEach(row => {
            const text = row.innerText;
            // البحث عن العملة المحددة
            if (text.includes(selectedCurrency)) {
                const cols = row.querySelectorAll('td');

                if (cols.length >= 6) {
                    currencyData = {
                        name: selectedCurrency,
                        date: cols[0].innerText.trim(),
                        unit: cols[2].innerText.trim(),
                        avg: cols[3].innerText.trim(),
                        sell: cols[4].innerText.trim(),
                        buy: cols[5].innerText.trim()
                    };
                }
            }
        });

        if (currencyData) {
            console.table(currencyData);

            document.getElementById('currency-name').innerText = currencyData.name;
            document.getElementById('buy').innerText = currencyData.buy;
            document.getElementById('sell').innerText = currencyData.sell;
            document.getElementById('avg').innerText = currencyData.avg;
            document.getElementById('date').innerText = "تاريخ النشرة: " + currencyData.date;

            document.getElementById('loader-container').style.display = 'none';
            document.getElementById('data-container').style.display = 'block';
        } else {
            throw new Error(`تعذر العثور على بيانات ${selectedCurrency} في الصفحة`);
        }

    } catch (error) {
        console.error("تفاصيل الخطأ:", error);
        document.getElementById('loader-container').innerHTML =
            `<p style="color:red">فشل الجلب: ${error.message}<br>
            <small>تأكد من فتح الصفحة عبر سيرفر (Live Server) وليس كملف عادي.</small></p>
            <button onclick="location.reload()" style="padding:5px 10px; cursor:pointer">إعادة محاولة</button>`;
    }
}

// عند تحميل الصفحة، جلب الدولار الأمريكي (الافتراضي)
window.onload = function () {
    fetchFromCBL('الدولار الأمريكي');

    // إضافة مستمع للتغيير في القائمة المنسدلة
    const currencySelect = document.getElementById('currency-select');
    currencySelect.addEventListener('change', function () {
        // إظهار مؤشر التحميل
        document.getElementById('loader-container').style.display = 'block';
        document.getElementById('data-container').style.display = 'none';

        // جلب بيانات العملة الجديدة
        const selectedCurrency = this.value;
        fetchFromCBL(selectedCurrency);
    });
};
