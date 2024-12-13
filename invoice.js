// ***********************************************
// المتغيرات العامة
// ***********************************************
let items = [];
let invoices = [];
let currentInvoiceIndex = 0;
const itemCache = {}; // تخزين مؤقت للأصناف

function showLoadingSpinner() {
    document.getElementById("loading-spinner").style.display = "block";
}

function hideLoadingSpinner() {
    document.getElementById("loading-spinner").style.display = "none";
}

// ***********************************************
// دالة عامة لجلب البيانات من API
// ***********************************************

async function fetchData(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        throw error; // إعادة تمرير الخطأ ليتم التعامل معه في مكان الاستدعاء
    }
}
// ***********************************************
// دالة عامة لعرض الرسائل في واجهة المستخدم
// ***********************************************
function displayMessage(message, type) {
    const container = document.getElementById("message-container");
    if (!container) {
        console.error("Message container not found!");
        return;
    }

    // تعيين النص والنوع
    container.textContent = message;
    container.className = `message ${type}`;
    container.style.display = "block";

    // إتاحة الإغلاق اليدوي بجانب الاختفاء التلقائي
    setTimeout(() => {
        container.style.display = "none";
    }, 5000);
}


// ***********************************************

// مثال على استخدام الدوال
async function fetchItems() {
    try {
        items = await fetchData('http://84.46.240.24:8000/api/items_list/');
        console.log("Fetched items:", items);
    } catch (error) {
        console.error("Error fetching items:", error);
    }
}

async function fetchInvoices() {
    showLoadingSpinner(); // عرض مؤشر التحميل
    try {
        // جلب بيانات الفواتير من API
        invoices = await fetchData('http://84.46.240.24:8000/api/invoices_list');

        if (invoices.length > 0) {
            // ترتيب الفواتير حسب `inv_id`
            invoices.sort((a, b) => a.inv_id - b.inv_id);
            console.log("الفواتير المرتبة:", invoices);
        } else {
            displayMessage("لا توجد فواتير متاحة.", "info");
        }
    } catch (error) {
        console.error("خطأ أثناء جلب الفواتير:", error);
        displayMessage("حدث خطأ أثناء جلب الفواتير.", "error");
    } finally {
        hideLoadingSpinner(); // إخفاء مؤشر التحميل
        resetInvoiceForm(); // تصفير الحقول
    }
}

// ***********************************************
// دالة عامة لتعبئة قائمة (Select أو Datalist) ديناميكيًا
// ***********************************************
async function populateList(apiUrl, elementId, type = 'datalist', valueField = 'id', textField = 'name') {
    try {
        const data = await fetchData(apiUrl); // جلب البيانات من API
        const element = document.getElementById(elementId);

        if (!element) {
            console.error(`Element with ID "${elementId}" not found.`);
            return;
        }

        if (type === 'datalist') {
            // تعبئة عنصر Datalist
            element.innerHTML = data.map(item => 
                `<option value="${item[textField]}" data-id="${item[valueField]}"></option>`
            ).join('');
        } else if (type === 'select') {
            // تعبئة عنصر Select
            element.innerHTML = `<option value="">اختر...</option>` +
                data.map(item => 
                    `<option value="${item[valueField]}">${item[textField]}</option>`
                ).join('');
        } else {
            console.error(`Invalid type "${type}". Supported types: "datalist", "select".`);
        }
    } catch (error) {
        console.error(`Error populating ${type} "${elementId}":`, error);
    }
}

function validateInput(inputId, datalistId, onValid, onInvalid) {
    const input = document.getElementById(inputId);
    const datalist = document.getElementById(datalistId);

    if (!input || !datalist) {
        console.error(`Input أو datalist بمعرف ${inputId} أو ${datalistId} غير موجود.`);
        return;
    }

    const datalistOptions = Array.from(datalist.options);

    input.addEventListener("blur", (event) => {
        const enteredValue = event.target.value.trim();
        const selectedOption = datalistOptions.find(option => option.value === enteredValue);

        if (selectedOption) {
            // إذا كانت القيمة المدخلة صحيحة
            if (onValid && typeof onValid === "function") {
                onValid(selectedOption);
            }
        } else {
            // إذا كانت القيمة المدخلة غير صحيحة
            if (onInvalid && typeof onInvalid === "function") {
                onInvalid();
            }
        }
    });
}


        function validateAndSetCustomer() {
            const customerInput = document.getElementById("cust");
            const customerName = customerInput.value.trim();
            const datalist = document.getElementById("custlist");

            if (!datalist) {
                console.error("Datalist 'custlist' not found!");
                return;
            }

            const datalistOptions = Array.from(datalist.options);

            // البحث عن العميل في الخيارات
            const selectedCustomer = datalistOptions.find(option => option.value === customerName);

            if (selectedCustomer) {
                // تعيين معرف العميل إذا كان الاسم صالحًا
                customerInput.setAttribute("data-id", selectedCustomer.getAttribute("data-id"));
            } else {
                // إذا لم يكن الاسم صالحًا
                alert("القيمة المدخلة غير صحيحة. يرجى اختيار قيمة من القائمة.");
                customerInput.value = ""; // إعادة تعيين الحقل
                customerInput.removeAttribute("data-id"); // إزالة المعرف
            }
        }



    async function setInvoiceNumber() {
    try {
        const data = await fetchData('http://84.46.240.24:8000/api/invoices_list');
        const maxId = data.reduce((max, inv) => Math.max(max, inv.id || 0), 0); // الحصول على الرقم التسلسلي
        const maxInvoiceId = data.reduce((max, inv) => Math.max(max, inv.inv_id || 0), 0); // الحصول على رقم الفاتورة
        
        document.getElementById("id").value = maxId + 1; // تعيين الرقم التسلسلي
        document.getElementById("inv_id").value = maxInvoiceId + 1; // تعيين رقم الفاتورة
    } catch (error) {
        console.error("Error setting invoice number:", error);
        document.getElementById("id").value = 1; // الرقم التسلسلي الافتراضي
        document.getElementById("inv_id").value = 1; // رقم الفاتورة الافتراضي
    }
    }
   
    // جلب الحساب المرتبط بالعميل
    async function setAccountForCustomer(customerId) {
    try {
        const customers = await fetchData('http://84.46.240.24:8000/api/customers_list');
        const accounts = await fetchData('http://84.46.240.24:8000/api/accounts_list');

        // العثور على العميل بناءً على معرفه
        const customer = customers.find(cust => cust.id == customerId);
        if (customer) {
            // العثور على الحساب المرتبط بالعميل
            const account = accounts.find(acc => acc.id == customer.acc);
            if (account) {
                document.getElementById("acc").innerHTML = `<option value="${account.id}" selected>${account.acc_name}</option>`;
            } else {
                document.getElementById("acc").innerHTML = '<option value="">لا يوجد حساب مرتبط</option>';
            }
        } else {
            document.getElementById("acc").innerHTML = '<option value="">يرجى اختيار عميل صحيح</option>';
        }
    } catch (error) {
        console.error("Error setting account for customer:", error);
        document.getElementById("acc").innerHTML = '<option value="">حدث خطأ أثناء جلب الحساب</option>';
    }
}



    function updateStatusIndicator(step) {
    const steps = document.querySelectorAll('.step');
    const lines = document.querySelectorAll('.line');

    steps.forEach((stepElement, index) => {
        stepElement.querySelector('.circle').classList.remove('active', 'completed');
        if (index < step - 1) {
            stepElement.querySelector('.circle').classList.add('completed');
        } else if (index === step - 1) {
            stepElement.querySelector('.circle').classList.add('active');
        }
    });

    lines.forEach((line, index) => {
        line.style.backgroundColor = index < step - 1 ? '#28a745' : '#ccc';
    });
}


// ***********************************************
// وظائف إنشاء الفواتير
// ***********************************************

async function initializeInvoice() {
    // تصفير الحقول
    resetInvoiceForm();

    // تعيين التاريخ والوقت الحالي
    const currentDate = new Date().toISOString().slice(0, 16); // تنسيق yyyy-MM-ddTHH:mm
    document.getElementById("inv_date").value = currentDate;

    // تعيين نوع الفاتورة الافتراضي
    const invType = document.getElementById("inv_type").value || "1";
    document.getElementById("invoice-type-text").textContent = getInvoiceTypeText(invType);

    // تحديث الترقيم الخاص بالفاتورة
    try {
        const invoices = await fetchData('http://84.46.240.24:8000/api/invoices_list');
        const maxId = invoices.reduce((max, inv) => Math.max(max, inv.id || 0), 0);
        const maxInvoiceId = invoices.reduce((max, inv) => Math.max(max, inv.inv_id || 0), 0);

        document.getElementById("id").value = maxId + 1; // تعيين الرقم التسلسلي الجديد
        document.getElementById("inv_id").value = maxInvoiceId + 1; // تعيين رقم الفاتورة الجديد
    } catch (error) {
        console.error("Error setting invoice number:", error);
        document.getElementById("id").value = 1; // الرقم التسلسلي الافتراضي
        document.getElementById("inv_id").value = 1; // رقم الفاتورة الافتراضي
    }

    // تصفير جدول التفاصيل
    clearInvoiceDetails();

    // إضافة صف جديد فارغ
    ensureLastRowExists();

    // تحديث حالة الفاتورة إلى "قيد الإنشاء"
    updateStatusIndicator(1);

    console.log("Invoice initialized successfully.");
}

async function addNewInvoice() {
    await initializeInvoice(); // استدعاء الدالة المشتركة
    document.getElementById("invoice-type-text").textContent = getInvoiceTypeText("1"); // افتراضيًا "شراء"
    displayMessage("تم إنشاء فاتورة جديدة.", "success");
}



// وظيفة تصفير الحقول وجعل الصفحة جاهزة للإدخال
function resetInvoiceForm() {
    document.getElementById("id").value = ""; // رقم تسلسلي فارغ
    document.getElementById("inv_id").value = ""; // رقم فاتورة فارغ
    document.getElementById("inv_date").value = ""; // تاريخ فارغ
    document.getElementById("inv_type").value = "1"; // نوع الفاتورة الافتراضي
    document.getElementById("inv_amt").value = "0.00"; // المبلغ الافتراضي
    document.getElementById("inv_notes").value = ""; // ملاحظات فارغة
    document.getElementById("commit").checked = false; // حالة الحفظ
    document.getElementById("cust").value = ""; // العميل الافتراضي
    document.getElementById("acc").value = ""; // الحساب الافتراضي

    // مسح تفاصيل الفاتورة
    clearInvoiceDetails();
}

function ensureLastRowExists() {
    const tableBody = document.getElementById("invoice-details-table").querySelector("tbody");
    const rows = Array.from(tableBody.rows);

    // إذا لم يكن هناك صفوف أو كان الصف الأخير مكتملًا، أضف صفًا جديدًا
    if (rows.length === 0 || isRowFilled(rows[rows.length - 1])) {
        addDetailRow();
    }
}

function addDetailRow() {
    const tableBody = document.getElementById("invoice-details-table").querySelector("tbody");
    const row = document.createElement("tr");

    // تعيين معرفات الحقول ديناميكيًا بناءً على عدد الصفوف
    const rowIndex = tableBody.rows.length + 1;
    const itemDatalistId = `items-datalist-${rowIndex}`;
    const itemInputId = `item-input-${rowIndex}`;

    row.innerHTML = `
        <td>${rowIndex}</td>
        <td>
            <input class="form-control item-select" list="${itemDatalistId}" id="${itemInputId}" placeholder="اختر الصنف..." autocomplete="off">
            <datalist id="${itemDatalistId}">
                ${items.map(item => `<option value="${item.item_name}" data-id="${item.id}"></option>`).join('')}
            </datalist>
        </td>
        <td><input type="number" class="form-control item-qty" placeholder="الكمية" value="0"></td>
        <td><input type="number" class="form-control item-price" placeholder="السعر" value="0.00"></td>
        <td>15%</td>
        <td class="item-tax">0.00</td>
        <td class="item-total">0.00</td>
        <td>
            <button class="btn btn-danger btn-sm" onclick="removeDetailRow(this)">حذف</button>
        </td>
    `;

    tableBody.appendChild(row);

    // تحديث الأحداث
    enableRowAutoAdd();
    enableCellHighlight();
    validateItemInput();
}


function editDetailRow(button) {
    const row = button.closest("tr");
    const qtyInput = row.querySelector(".item-qty");
    const priceInput = row.querySelector(".item-price");

    // السماح بتعديل القيم
    qtyInput.disabled = false;
    priceInput.disabled = false;

    // تغيير الزر إلى "حفظ"
    button.textContent = "حفظ";
    button.className = "btn btn-success btn-sm";
    button.onclick = function () {
        saveDetailRow(row, button);
    };
}

function saveDetailRow(row, button) {
    const qtyInput = row.querySelector(".item-qty");
    const priceInput = row.querySelector(".item-price");

    // منع التعديل
    qtyInput.disabled = true;
    priceInput.disabled = true;

    // إعادة الزر إلى "تعديل"
    button.textContent = "تعديل";
    button.className = "btn btn-primary btn-sm";
    button.onclick = function () {
        editDetailRow(button);
    };

    // تحديث الإجماليات
    updateTotals();
}

function createItemSelect() {
    const select = document.createElement("select");
    select.className = "form-control item-select";

    // تعبئة القائمة بأسماء الأصناف
    select.innerHTML = '<option value="">اختر الصنف...</option>' + 
        items.map(item => `<option value="${item.id}">${item.item_name}</option>`).join('');

    select.addEventListener("change", ensureLastRowExists); // إضافة صف جديد عند تغيير القيمة
    return select;
}

function isRowFilled(row) {
    const itemInput = row.querySelector(".item-select");
    const qtyInput = row.querySelector(".item-qty");
    const priceInput = row.querySelector(".item-price");

    const qty = parseFloat(qtyInput?.value || 0);
    const price = parseFloat(priceInput?.value || 0);

    return itemInput.value.trim() !== "" && qty > 0 && price > 0;
}

function enableRowAutoAdd() {
    const tableBody = document.getElementById("invoice-details-table").querySelector("tbody");
    tableBody.addEventListener("input", (event) => {
        const targetRow = event.target.closest("tr");

        // تحقق من إجماليات الصف
        updateRowTotals(targetRow);

        // تحقق إذا كان الصف الأخير ممتلئًا، وإذا كان ممتلئًا أضف صفًا جديدًا
        const rows = Array.from(tableBody.rows);
        if (isRowFilled(rows[rows.length - 1])) {
            addDetailRow();
        }

        // تحديث الإجماليات الكلية
        updateTotals();
    });
}


function updateRowTotals(row) {
    const qtyInput = row.querySelector(".item-qty");
    const priceInput = row.querySelector(".item-price");
    const taxCell = row.querySelector(".item-tax");
    const totalCell = row.querySelector(".item-total");

    const qty = parseFloat(qtyInput?.value || 0);
    const price = parseFloat(priceInput?.value || 0);

    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
        taxCell.textContent = "0.00";
        totalCell.textContent = "0.00";
        return;
    }

    const tax = qty * price * 0.15; // حساب الضريبة بنسبة 15%
    const total = qty * price + tax; // الإجمالي

    // تحديث القيم في الجدول
    taxCell.textContent = tax.toFixed(2);
    totalCell.textContent = total.toFixed(2);
}

// تفعيل الدالة عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    enableRowAutoAdd();
});

function calculateTotals(rows) {
    let totalBeforeTax = 0, totalTax = 0, totalAfterTax = 0;

    rows.forEach(row => {
        const qtyInput = row.querySelector(".item-qty");
        const priceInput = row.querySelector(".item-price");

        const qty = parseFloat(qtyInput?.value || 0);
        const price = parseFloat(priceInput?.value || 0);

        if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) return;

        const tax = qty * price * 0.15;
        const total = qty * price + tax;

        totalBeforeTax += qty * price;
        totalTax += tax;
    });

    totalAfterTax = totalBeforeTax + totalTax;

    return { totalBeforeTax, totalTax, totalAfterTax };
}


function updateTotals() {
    const rows = Array.from(document.querySelectorAll("#invoice-details-table tbody tr"));
    const { totalBeforeTax, totalTax, totalAfterTax } = calculateTotals(rows);

    document.getElementById("total-amount").textContent = totalBeforeTax.toFixed(2);
    document.getElementById("total-tax").textContent = totalTax.toFixed(2);
    document.getElementById("total-after-tax").textContent = totalAfterTax.toFixed(2);

    document.getElementById("inv_amt").value = totalBeforeTax.toFixed(2);
    document.getElementById("inv_tax").value = totalTax.toFixed(2);
    document.getElementById("inv_net").value = totalAfterTax.toFixed(2);
}


function updateInvoiceAmount() {
    const totalAmount = parseFloat(document.getElementById("total-amount").textContent) || 0;

    const formattedAmount = totalAmount > 999999 ? 999999.99 : totalAmount.toFixed(2);

    document.getElementById("inv_amt").value = formattedAmount;
}

function validateItemInput() {
    const itemInputs = document.querySelectorAll(".item-select");

    itemInputs.forEach(input => {
        input.addEventListener("blur", (event) => {
            const value = event.target.value.trim(); 
            const validItem = items.find(item => item.item_name === value);

            if (!validItem && value !== "") { 
                alert("الصنف الذي أدخلته غير موجود في القائمة. يرجى اختيار صنف صحيح.");
                event.target.value = ""; 
            }
        });
    });
}

function validateInputs() {
    const rows = document.querySelectorAll("#invoice-details-table tbody tr");
    let valid = true;

    rows.forEach(row => {
        const qtyInput = row.querySelector(".item-qty");
        const priceInput = row.querySelector(".item-price");

        if (!qtyInput.value || parseFloat(qtyInput.value) <= 0) {
            qtyInput.classList.add("is-invalid");
            valid = false;
        } else {
            qtyInput.classList.remove("is-invalid");
        }

        if (!priceInput.value || parseFloat(priceInput.value) <= 0) {
            priceInput.classList.add("is-invalid");
            valid = false;
        } else {
            priceInput.classList.remove("is-invalid");
        }
    });

    return valid;
}

// ***********************************************
// وظائف حفظ الفواتير
// ***********************************************
async function saveInvoice() {
    updateStatusIndicator(2);

    // التحقق من صحة الإدخال
    validateAndSetCustomer();
    const customerId = document.getElementById("cust").dataset.id;

    if (!customerId) {
        displayMessage("يرجى اختيار عميل صحيح قبل الحفظ.", "error");
        updateStatusIndicator(1);
        return;
    }

    showLoadingSpinner();

    try {
        updateInvoiceAmount(); // حساب الإجمالي

        const invoiceData = {
            inv_id: document.getElementById("inv_id").value,
            inv_date: new Date(document.getElementById("inv_date").value).toISOString(),
            inv_type: "1",
            inv_amt: parseFloat(document.getElementById("inv_amt").value).toFixed(2), // إجمالي الفاتورة
            inv_tax: parseFloat(document.getElementById("total-tax").textContent).toFixed(2), // إجمالي الضريبة
            inv_net: parseFloat(document.getElementById("total-after-tax").textContent).toFixed(2), // الصافي بعد الضريبة
            inv_notes: document.getElementById("inv_notes").value || null,
            inv_status: true,
            commit: false, // سيتم تحديثه بعد نجاح الحفظ
            cr_date: new Date().toISOString(),
            cust: parseInt(customerId), // استخدام معرف العميل
            acc: parseInt(document.getElementById("acc").value) || null
        };

        console.log("Saving Invoice:", invoiceData);

        const response = await fetch('http://84.46.240.24:8000/api/api_create_invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoiceData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error Response:", errorData);
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const savedInvoice = await response.json();

        displayMessage("تم حفظ الفاتورة بنجاح!", "success");
        updateStatusIndicator(3);

        // حفظ تفاصيل الفاتورة بعد حفظ الفاتورة الرئيسية
        const detailsSaved = await saveInvoiceDetails(savedInvoice.id);
        if (!detailsSaved) throw new Error("Failed to save invoice details.");
    } catch (error) {
        console.error("Error saving invoice:", error.message, error);
        displayMessage("حدث خطأ أثناء حفظ الفاتورة. يرجى التحقق من البيانات.", "error");
        updateStatusIndicator(1);
    } finally {
        hideLoadingSpinner();
    }
}

async function saveInvoiceDetails(invoiceId) {
    const tableRows = document.getElementById("invoice-details-table").querySelector("tbody").rows;
    let allDetailsSaved = true; // متغير لتتبع نجاح الحفظ

    for (const row of tableRows) {
        const itemInput = row.querySelector(".item-select");
        const qtyInput = row.querySelector(".item-qty");
        const priceInput = row.querySelector(".item-price");

        const itemName = itemInput.value.trim();
        const qty = parseFloat(qtyInput.value);
        const price = parseFloat(priceInput.value);

        // العثور على الصنف بناءً على الاسم
        const selectedItem = items.find(item => item.item_name === itemName);

        if (!selectedItem || isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
            console.warn(`Skipping invalid row: ${row.rowIndex + 1}`);
            continue; // قم بتخطي الصف
        }

        const detail = {
            inv_dtl_id: row.rowIndex + 1, // معرف فريد لكل صف
            item_qty: qty.toFixed(2), // الكمية
            item_price: price.toFixed(2), // السعر
            inv_tax: "15.00", // نسبة الضريبة
            tax_amt: (qty * price * 0.15).toFixed(2), // قيمة الضريبة
            inv_status: true, // حالة الفاتورة
            cr_date: new Date().toISOString(), // تاريخ الإنشاء
            inv: invoiceId, // رقم الفاتورة
            item: selectedItem.id, // معرف الصنف
        };

        console.log("Detail prepared for API:", detail);

        try {
            const response = await fetch('http://84.46.240.24:8000/api/api_create_invoice_dtl', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(detail),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error Response:", errorData);
                throw new Error(`Failed to create invoice detail for row ${row.rowIndex + 1}. Status: ${response.status}`);
            }

            const result = await response.json();
            console.log(`Row ${row.rowIndex + 1} saved successfully:`, result);
        } catch (error) {
            console.error(`Error saving row ${row.rowIndex + 1}:`, error.message, error);
            displayMessage(`حدث خطأ أثناء حفظ الصف ${row.rowIndex + 1}. يرجى التحقق من البيانات.`, "error");
            allDetailsSaved = false; // تعيين الحالة إلى فشل
        }
    }

    if (!allDetailsSaved) {
        displayMessage("تعذر حفظ تفاصيل الفاتورة. يرجى التحقق من البيانات.", "error");
    }

    return allDetailsSaved;
}

// ***********************************************
// وظائف حذف الفواتير
// ***********************************************
async function deleteInvoice() {
    const invoiceId = document.getElementById("id").value;

    // نافذة التأكيد
    const confirmation = confirm("هل أنت متأكد أنك تريد حذف هذه الفاتورة؟ لن تتمكن من استعادتها لاحقًا.");
    if (!confirmation) {
        return; // إيقاف العملية إذا اختار المستخدم "إلغاء"
    }

    try {
        const detailsResponse = await fetch(`http://84.46.240.24:8000/api/invoices_dtl_list`);
        if (!detailsResponse.ok) throw new Error(`HTTP Error: ${detailsResponse.status}`);
        const details = await detailsResponse.json();

        const detailsToDelete = details.filter(detail => detail.inv == invoiceId);

        for (const detail of detailsToDelete) {
            const deleteDetailResponse = await fetch(`http://84.46.240.24:8000/api/api_delete_invoice_dtl/${detail.id}`, {
                method: 'DELETE',
            });

            if (!deleteDetailResponse.ok) {
                const errorDetail = await deleteDetailResponse.json();
                console.error(`Error deleting detail ID ${detail.id}:`, errorDetail);
                throw new Error(`HTTP Error when deleting detail ID ${detail.id}: ${deleteDetailResponse.status}`);
            }

            console.log(`Invoice detail ID ${detail.id} deleted successfully.`);
        }

        const deleteInvoiceResponse = await fetch(`http://84.46.240.24:8000/api/api_delete_invoice/${invoiceId}`, {
            method: 'DELETE',
        });

        if (!deleteInvoiceResponse.ok) {
            const errorInvoice = await deleteInvoiceResponse.json();
            console.error("Error deleting invoice:", errorInvoice);
            throw new Error(`HTTP Error when deleting invoice: ${deleteInvoiceResponse.status}`);
        }

        displayMessage("تم حذف الفاتورة وجميع التفاصيل المرتبطة بها بنجاح.", "success");
        addNewInvoice();
    } catch (error) {
        console.error("Error deleting invoice and details:", error.message, error);
        displayMessage("حدث خطأ أثناء حذف الفاتورة أو التفاصيل المرتبطة بها.", "error");
    }
}

// ***********************************************
// وظائف التنقل بين الفواتير
function navigateToInvoice(direction) {
    if (invoices.length === 0) {
        displayMessage("لا توجد فواتير متاحة.", "error");
        return;
    }

    console.log(`التنقل إلى الفاتورة: ${direction}`);
    console.log(`الفهرس الحالي: ${currentInvoiceIndex}`);

    switch (direction) {
        case 'first':
            currentInvoiceIndex = 0;
            break;
        case 'last':
            currentInvoiceIndex = invoices.length - 1;
            break;
        case 'prev':
            if (currentInvoiceIndex > 0) {
                currentInvoiceIndex--;
            } else {
                displayMessage("أنت بالفعل في أول فاتورة.", "info");
                return;
            }
            break;
        case 'next':
            if (currentInvoiceIndex < invoices.length - 1) {
                currentInvoiceIndex++;
            } else {
                displayMessage("أنت بالفعل في آخر فاتورة.", "info");
                return;
            }
            break;
        default:
            displayMessage("اتجاه غير معروف.", "error");
            return;
    }

    loadInvoice(currentInvoiceIndex);
}

function loadInvoice(index) {
    if (index < 0 || index >= invoices.length) {
        displayMessage("الفاتورة غير موجودة.", "error");
        return;
    }

    const invoice = invoices[index];
    console.log(`تحميل الفاتورة ذات الفهرس ${index}:`, invoice);

    // تعبئة الحقول بناءً على بيانات الفاتورة
    document.getElementById("id").value = invoice.id || "";
    document.getElementById("inv_id").value = invoice.inv_id || "";
    document.getElementById("inv_date").value = invoice.inv_date
        ? new Date(invoice.inv_date).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16); // إذا لم يكن هناك تاريخ، استخدم التاريخ الحالي
    document.getElementById("inv_type").value = invoice.inv_type || "";
    document.getElementById("inv_amt").value = invoice.inv_amt || "0.00";
    document.getElementById("inv_notes").value = invoice.inv_notes || "";
    document.getElementById("commit").checked = invoice.commit || false;
    document.getElementById("cust").value = invoice.cust || "";
    document.getElementById("acc").value = invoice.acc || "";

    // جلب وعرض تفاصيل الفاتورة
    fetchInvoiceDetails(invoice.id);
}


async function fetchInvoiceDetails(invoiceId) {
    try {
        const response = await fetch('http://84.46.240.24:8000/api/invoices_dtl_list');
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const details = await response.json();

        // تصفية التفاصيل بناءً على رقم الفاتورة
        const invoiceDetails = details.filter(detail => detail.inv == invoiceId);
        if (invoiceDetails.length === 0) {
            console.warn(`لا توجد تفاصيل للفاتورة رقم ${invoiceId}.`);
            clearInvoiceDetails(); // مسح التفاصيل إذا لم تكن هناك بيانات
            return;
        }

        displayInvoiceDetails(invoiceDetails); // عرض التفاصيل
    } catch (error) {
        console.error("Error fetching invoice details:", error);
    }
}

function displayInvoiceDetails(details) {
    const tableBody = document.getElementById("invoice-details-table").querySelector("tbody");
    tableBody.innerHTML = ""; // مسح الصفوف القديمة

    details.forEach((detail, index) => {
        const row = document.createElement("tr");
        const itemDatalistId = `items-datalist-${index + 1}`;
        const itemInputId = `item-input-${index + 1}`;

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <input class="form-control item-select" list="${itemDatalistId}" id="${itemInputId}" value="${getItemName(detail.item)}" placeholder="اختر الصنف...">
                <datalist id="${itemDatalistId}">
                    ${items.map(item => `<option value="${item.item_name}">`).join('')}
                </datalist>
            </td>
            <td>${detail.item_qty}</td>
            <td>${detail.item_price}</td>
            <td>${detail.inv_tax}%</td>
            <td>${detail.tax_amt}</td>
            <td>${(parseFloat(detail.item_qty) * parseFloat(detail.item_price) + parseFloat(detail.tax_amt)).toFixed(2)}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="removeDetailRow(this)">حذف</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    updateTotals();
}

function clearInvoiceDetails() {
    const tableBody = document.getElementById("invoice-details-table").querySelector("tbody");
    tableBody.innerHTML = ""; // مسح كل الصفوف
}

// جلب اسم الصنف
function getItemName(itemId) {
    const item = items.find(i => i.id == itemId);
    if (!item) {
        console.warn(`الصنف غير موجود (ID: ${itemId})`);
    }
    return item ? item.item_name : "غير معروف";
}

// ***********************************************
// وظائف العرض والتفاعل
// ***********************************************

function enableTableNavigation() {
    const table = document.getElementById("invoice-details-table");
    const inputs = Array.from(table.querySelectorAll("input"));

    inputs.forEach((input, index) => {
        input.addEventListener("keydown", (event) => {
            const key = event.key;
            let targetIndex;

            switch (key) {
                case "ArrowUp": // التنقل إلى الأعلى
                    targetIndex = index - table.rows[0].cells.length;
                    break;
                case "ArrowDown": // التنقل إلى الأسفل
                    targetIndex = index + table.rows[0].cells.length;
                    break;
                case "ArrowLeft": // التنقل إلى اليسار
                    targetIndex = index - 1;
                    break;
                case "ArrowRight": // التنقل إلى اليمين
                case "Enter": // التعامل مع Enter كالسهم اليمين
                    targetIndex = index + 1;
                    break;
                default:
                    return; // إيقاف التنفيذ إذا كان المفتاح ليس من الأسهم أو Enter
            }

            // منع التنقل خارج نطاق الجدول
            if (targetIndex >= 0 && targetIndex < inputs.length) {
                inputs[targetIndex].focus();
                event.preventDefault();
            }
        });
    });
}

function enableCellHighlight() {
    const inputs = document.querySelectorAll("#invoice-details-table input");

    inputs.forEach(input => {
        input.addEventListener("focus", (event) => {
            event.target.select(); // تحديد النص بالكامل
        });
    });
}


function disableNumberScroll() {
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault(); // منع التمرير
            }
        });
    });
}

function getInvoiceTypeText(type) {
    switch (type) {
        case "1":
            return "شراء";
        case "2":
            return "بيع";
        case "3":
            return "مردود شراء";
        case "4":
            return "مردود بيع";
        default:
            return "--";
    }
}


// تحميل البيانات عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", async () => {
    // تحميل البيانات الأساسية
    await fetchItems();
    await populateList('http://84.46.240.24:8000/api/customers_list', 'custlist', 'datalist', 'id', 'cust_name');
    console.log("Datalist content:", document.getElementById('custlist').innerHTML);

    // تهيئة الفاتورة
    await initializeInvoice();
    document.getElementById("invoice-number").textContent = document.getElementById("inv_id").value || "--";
    document.getElementById("invoice-date").textContent = document.getElementById("inv_date").value || "--";

    // تفعيل الوظائف المساعدة
    enableTableNavigation();
    disableNumberScroll();
    validateItemInput();
    ensureLastRowExists();
    enableCellHighlight();
    enableRowAutoAdd();
    // عناصر الإدخال
    const custInput = document.getElementById("cust");
    const custList = document.getElementById("custlist");
    const accSelect = document.getElementById("acc");

    // التحقق من وجود العناصر
    if (custInput && custList && accSelect) {
        // حدث الكتابة (input)
        custInput.addEventListener("input", (event) => {
            const datalistOptions = Array.from(custList.options);
            const selectedOption = datalistOptions.find(option => option.value === event.target.value);

            if (selectedOption) {
                event.target.setAttribute("data-id", selectedOption.getAttribute("data-id"));
            } else {
                event.target.removeAttribute("data-id");
                console.warn("القيمة المدخلة غير موجودة في القائمة.");
            }
        });

        // حدث التغيير (change)
        document.getElementById("cust").addEventListener("change", async (event) => {
            const selectedCustomerId = event.target.getAttribute("data-id");

            if (selectedCustomerId) {
                await setAccountForCustomer(selectedCustomerId);
            } else {
                console.warn("لم يتم اختيار عميل صحيح.");
                document.getElementById("acc").innerHTML = '<option value="">يرجى اختيار عميل صحيح</option>';
            }
        });

    } else {
        console.error("العناصر المطلوبة (cust, custlist, acc) غير موجودة في الصفحة.");
    }
});

