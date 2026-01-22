async function fetchFromCBL() {
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

        let usdData = null;

        rows.forEach(row => {
            const text = row.innerText;
            // البحث عن الدولار الأمريكي بالتحديد (وليس الأسترالي أو الكندي)
            if (text.includes('الدولار الأمريكي') || text.includes('USD')) {
                const cols = row.querySelectorAll('td');
                console.log(usdData);

                if (cols.length >= 6) {
                    usdData = {
                        date: cols[0].innerText.trim(),
                        avg: cols[3].innerText.trim(),
                        sell: cols[4].innerText.trim(),
                        buy: cols[5].innerText.trim()
                    };
                }
            }
        });

        if (usdData) {
            console.table(usdData);

            document.getElementById('buy').innerText = usdData.buy;
            document.getElementById('sell').innerText = usdData.sell;
            document.getElementById('avg').innerText = usdData.avg;
            document.getElementById('date').innerText = "تاريخ النشرة: " + usdData.date;

            document.getElementById('loader-container').style.display = 'none';
            document.getElementById('data-container').style.display = 'block';
        } else {
            throw new Error("تعذر العثور على جدول العملات في الصفحة");
        }

    } catch (error) {
        console.error("تفاصيل الخطأ:", error);
        document.getElementById('loader-container').innerHTML =
            `<p style="color:red">فشل الجلب: ${error.message}<br>
            <small>تأكد من فتح الصفحة عبر سيرفر (Live Server) وليس كملف عادي.</small></p>
            <button onclick="location.reload()" style="padding:5px 10px; cursor:pointer">إعادة محاولة</button>`;
    }
}

window.onload = fetchFromCBL;
