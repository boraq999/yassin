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

// قائمة البروكسيات - ضع رابط Cloudflare الخاص بك هنا كأول خيار
const PROXIES = [
    {
        name: 'Cloudflare Worker (Private)',
        // استبدل الرابط أدناه بالرابط الذي حصلت عليه من Cloudflare
        getUrl: (target) => `https://cbl-proxy.alharethalalem.workers.dev/?url=${encodeURIComponent(target)}`
    },
    {
        name: 'AllOrigins',
        getUrl: (target) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`
    },
    {
        name: 'CodeTabs',
        getUrl: (target) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`
    }
];

async function fetchFromCBL(selectedCurrency = 'الدولار الأمريكي') {
    const apiURL = 'https://cbl-proxy.alharethalalem.workers.dev/'; // رابط الـ API الخاص بك

    // تحديث العلم والاسم فوراً
    document.getElementById('target-flag').innerText = CURRENCY_FLAGS[selectedCurrency] || '🏳️';
    document.getElementById('target-name').innerText = selectedCurrency;

    try {
        console.log(`🔄 جلب البيانات من الـ API الخاص...`);
        const response = await fetch(apiURL);

        if (!response.ok) throw new Error('فشل الاتصال بالـ API');

        const result = await response.json();

        if (result.status === 'success') {
            const currencyData = result.data.find(c => c.currency.includes(selectedCurrency));

            if (currencyData) {
                updateUI(currencyData);
            } else {
                throw new Error('العملة غير موجودة في النشرة');
            }
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.warn(`❌ فشل الـ API الخاص:`, error.message);
        // خيار احتياطي: العودة للبروكسيات العامة إذا تعطل الـ Worker
        showError(error.message);
    }
}

function updateUI(data) {
    console.table(data);
    // حقن النصوص مع الأرقام النظيفة لمنع التكرار
    document.getElementById('buy').innerHTML = `<span style="font-family: 'Tajawal', sans-serif; font-size: 1.1rem; font-weight: 700; color: #94a3b8; margin-left: 8px;"></span> ${data.buy} <span style="font-size: 0.9rem; color: #94a3b8; margin-right: 4px;">د.ل</span>`;
    document.getElementById('sell').innerHTML = `<span style="font-family: 'Tajawal', sans-serif; font-size: 1.1rem; font-weight: 700; color: #94a3b8; margin-left: 8px;"></span> ${data.sell} <span style="font-size: 0.9rem; color: #94a3b8; margin-right: 4px;">د.ل</span>`;
    document.getElementById('avg').innerHTML = `<span style="font-family: 'Tajawal', sans-serif; font-size: 2.2rem; font-weight: 900; color: #fff; margin-left: 12px;"></span> ${data.avg} <span style="font-size: 1.4rem; color: #94a3b8; margin-right: 8px;">د.ل</span>`;
    document.getElementById('date').innerText = "نشرة بتاريخ: " + data.date;

    document.getElementById('loader-container').style.display = 'none';
    const container = document.getElementById('data-container');
    container.style.display = 'grid';
    container.classList.remove('fade-in');
    void container.offsetWidth; // force reflow
    container.classList.add('fade-in');
}

function showError(msg) {
    document.getElementById('loader-container').innerHTML = `
        <div style="background: rgba(239, 68, 68, 0.1); padding: 30px; border-radius: 24px; border: 1px solid rgba(239, 68, 68, 0.2); backdrop-filter: blur(10px);">
            <p style="color: #fca5a5; font-weight: 700; margin-bottom: 10px; font-size: 1.2rem;">⚠️ فشل جلب البيانات</p>
            <p style="color: #f87171; font-size: 0.9rem; margin-bottom: 20px;">${msg || 'خطأ في الاتصال بخادم المصرف المركزي'}</p>
            <button onclick="location.reload()" style="background: #ef4444; color: white; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: 600; transition: 0.3s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">إعادة المحاولة</button>
        </div>
    `;
}

// تهيئة الأحداث
window.onload = () => {
    const select = document.getElementById('currency-select');

    // بدء الجلب بالعملة المختارة افتراضياً
    fetchFromCBL(select ? select.value : 'الدولار الأمريكي');

    if (select) {
        select.onchange = (e) => {
            resetUI();
            fetchFromCBL(e.target.value);
        };
    }
};

function resetUI() {
    document.getElementById('loader-container').style.display = 'block';
    document.getElementById('data-container').style.display = 'none';
}
