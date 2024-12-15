// ***********************************************
// المتغيرات العامة
// ***********************************************
let items = [];
let invoices = [];
let currentInvoiceIndex = 0;
const itemCache = {}; 

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
        throw error; 
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

    container.textContent = message;
    container.className = `message ${type}`;
    container.style.display = "block";

    setTimeout(() => {
        container.style.display = "none";
    }, 5000);
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}


// ***********************************************

async function fetchItems() {
    try {
        items = await fetchData('http://84.46.240.24:8000/api/items_list/');
        console.log("Fetched items:", items);
    } catch (error) {
        console.error("Error fetching items:", error);
    }
}

async function fetchInvoices() {
    showLoadingSpinner(); 
    try {
        invoices = await fetchData('http://84.46.240.24:8000/api/invoices_list');

        if (invoices.length > 0) {
            invoices.sort((a, b) => a.inv_id - b.inv_id);
            console.log("الفواتير المرتبة:", invoices);
        } else {
            displayMessage("لا توجد فواتير متاحة.", "info");
        }
    } catch (error) {
        console.error("خطأ أثناء جلب الفواتير:", error);
        displayMessage("حدث خطأ أثناء جلب الفواتير.", "error");
    } finally {
        hideLoadingSpinner(); 
        resetInvoiceForm(); 
    }
}

// ***********************************************
// دالة عامة لتعبئة قائمة (Select أو Datalist) 
// ***********************************************
async function populateList(apiUrl, elementId, type = 'datalist', valueField = 'id', textField = 'name') {
    try {
        const data = await fetchData(apiUrl); 
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

            const selectedCustomer = datalistOptions.find(option => option.value === customerName);

            if (selectedCustomer) {

                customerInput.setAttribute("data-id", selectedCustomer.getAttribute("data-id"));
            } else {

                alert("القيمة المدخلة غير صحيحة. يرجى اختيار قيمة من القائمة.");
                customerInput.value = ""; 
                customerInput.removeAttribute("data-id"); 
            }
        }

        async function setInvoiceNumber() {
            try {
                const invoices = await fetchData('http://84.46.240.24:8000/api/invoices_list');
                if (!invoices || invoices.length === 0) {
                    document.getElementById("id").value = 1;
                    document.getElementById("inv_id").textContent = 1;
                    return;
                }

                invoices.sort((a, b) => a.inv_id - b.inv_id);

                const maxId = invoices.reduce((max, inv) => Math.max(max, inv.id || 0), 0);
                const maxInvoiceId = invoices.reduce((max, inv) => Math.max(max, inv.inv_id || 0), 0);
        
                document.getElementById("id").value = maxId + 1; 
                document.getElementById("inv_id").textContent = maxInvoiceId + 1;
            } catch (error) {
                console.error("Error setting invoice number:", error);
                document.getElementById("id").value = 1; 
                document.getElementById("inv_id").textContent = 1; 
            }
        }
        

        async function setCustomerDetails(customerId) {
            try {
                // جلب قائمة العملاء
                const customers = await fetchData('http://84.46.240.24:8000/api/customers_list');
                const accounts = await fetchData('http://84.46.240.24:8000/api/accounts_list');
        
                // العثور على العميل بناءً على المعرف
                const customer = customers.find(cust => cust.id == customerId);
        
                if (customer) {
                    // إعداد معلومات العميل (VAT، العنوان، ورقم الهاتف)
                    const customerInfo = `${customer.vat_no || ''}, ${customer.address || ''}, ${customer.mobile || ''}`;
                    document.getElementById("customer-info").textContent = customerInfo;
        
                    // إعداد الحساب المرتبط بالعميل
                    const account = accounts.find(acc => acc.id == customer.acc);
                    if (account) {
                        document.getElementById("acc").innerHTML = `<option value="${account.id}" selected>${account.acc_name}</option>`;
                    } else {
                        document.getElementById("acc").innerHTML = '<option value="">لا يوجد حساب مرتبط</option>';
                    }
                } else {
                    // إذا لم يتم العثور على العميل
                    document.getElementById("customer-info").textContent = "لم يتم العثور على معلومات العميل.";
                    document.getElementById("acc").innerHTML = '<option value="">يرجى اختيار عميل صحيح</option>';
                }
            } catch (error) {
                // التعامل مع الأخطاء
                console.error("Error setting customer details:", error);
                document.getElementById("customer-info").textContent = "حدث خطأ أثناء جلب معلومات العميل.";
                document.getElementById("acc").innerHTML = '<option value="">حدث خطأ أثناء جلب الحساب</option>';
            }
        }

        function updateStatusIndicator(currentStep) {
            const steps = document.querySelectorAll('#status-indicator .step');
            steps.forEach((step, index) => {
                const circle = step.querySelector('.circle');
                const line = step.querySelector('.line');
                const text = step.querySelector('span');
        
                if (index < currentStep) {
                    step.classList.add('completed');
                    step.classList.remove('active');
                    circle.classList.add('completed');
                    text.classList.add('completed');
                } else if (index === currentStep) {
                    step.classList.add('active');
                    circle.classList.add('active');
                    text.classList.add('active');
                } else {
                    step.classList.remove('completed', 'active');
                    circle.classList.remove('completed', 'active');
                    text.classList.remove('completed', 'active');
                }
            });
        }
        
// ***********************************************
// وظائف إنشاء الفواتير
// ***********************************************

async function initializeInvoice() {
    resetInvoiceForm();

    const invType = getQueryParam('inv_type') || "2";
    document.getElementById("inv_type").textContent = getInvoiceTypeText(invType);
    document.getElementById("inv_type").setAttribute("data-inv-type", invType);

    const nextInvoiceNumber = await getNextInvoiceNumber(invType);
    document.getElementById("inv_id").textContent = nextInvoiceNumber;

    const currentDate = new Date().toISOString().slice(0, 16);
    document.getElementById("inv_date").value = currentDate;

    clearInvoiceDetails();
    ensureLastRowExists();
    updateStatusIndicator(1);
}

async function getNextInvoiceNumber(invType) {
    try {
        // جلب قائمة الفواتير
        const invoices = await fetchData('http://84.46.240.24:8000/api/invoices_list');

        // تصفية الفواتير بناءً على النوع
        const filteredInvoices = invoices.filter(inv => inv.inv_type == invType);

        // حساب أعلى رقم فاتورة وزيادته
        const maxInvoiceId = filteredInvoices.reduce((max, inv) => Math.max(max, inv.inv_id || 0), 0);

        return maxInvoiceId + 1;
    } catch (error) {
        console.error("Error fetching next invoice number:", error);
        return 1; // في حال حدوث خطأ يتم الترقيم من 1
    }
}

async function addNewInvoice() {
    try {
        resetInvoiceForm(); // تنظيف الشاشة مع الحفاظ على inv_type

        const currentInvoiceType = document.getElementById("inv_type").getAttribute("data-inv-type");
        const nextInvoiceNumber = await getNextInvoiceNumber(currentInvoiceType);

        // إعداد البيانات الجديدة
        document.getElementById("inv_id").textContent = nextInvoiceNumber;
        document.getElementById("inv_type").textContent = getInvoiceTypeText(currentInvoiceType);

        displayMessage(`تم تهيئة فاتورة جديدة (${getInvoiceTypeText(currentInvoiceType)}) برقم ${nextInvoiceNumber}.`, "success");

        ensureLastRowExists();
        updateStatusIndicator(1);
    } catch (error) {
        console.error("Error adding new invoice:", error);
        displayMessage("حدث خطأ أثناء تجهيز الفاتورة الجديدة.", "error");
    }
}

function resetInvoiceForm() {
    const currentInvoiceType = document.getElementById("inv_type").getAttribute("data-inv-type");

    document.getElementById("id").value = "";
    document.getElementById("inv_id").textContent = "";
    document.getElementById("inv_date").value = new Date().toISOString().slice(0, 16);
    document.getElementById("inv_type").textContent = getInvoiceTypeText(currentInvoiceType);
    document.getElementById("inv_type").setAttribute("data-inv-type", currentInvoiceType);
    document.getElementById("inv_amt").value = "0.00";
    document.getElementById("inv_notes").value = "";
    document.getElementById("cust").value = "";
    document.getElementById("acc").value = "";

    clearInvoiceDetails();
    updateTotals();
}


function ensureLastRowExists() {
    const tableBody = document.getElementById("invoice-details-table").querySelector("tbody");
    const rows = Array.from(tableBody.rows);

    if (rows.length === 0 || isRowFilled(rows[rows.length - 1])) {
        addDetailRow();
    }
}

function addDetailRow() {
    const tableBody = document.getElementById("invoice-details-table").querySelector("tbody");
    const row = document.createElement("tr");

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
            <button class="btn btn-danger btn-sm" onclick="removeDetailRow(this)"><i class="fas fa-trash"></i></button>
        </td>
    `;

    tableBody.appendChild(row);

    enableRowAutoAdd();
    enableCellHighlight();
    validateItemInput();
}


function editDetailRow(button) {
    const row = button.closest("tr");
    const qtyInput = row.querySelector(".item-qty");
    const priceInput = row.querySelector(".item-price");

    qtyInput.disabled = false;
    priceInput.disabled = false;

    button.textContent = "حفظ";
    button.className = "btn btn-success btn-sm";
    button.onclick = function () {
        saveDetailRow(row, button);
    };
}

function saveDetailRow(row, button) {
    const qtyInput = row.querySelector(".item-qty");
    const priceInput = row.querySelector(".item-price");

    qtyInput.disabled = true;
    priceInput.disabled = true;

    button.textContent = "تعديل";
    button.className = "btn btn-primary btn-sm";
    button.onclick = function () {
        editDetailRow(button);
    };

    updateTotals();
}

function createItemSelect() {
    const select = document.createElement("select");
    select.className = "form-control item-select";

    select.innerHTML = '<option value="">اختر الصنف...</option>' + 
        items.map(item => `<option value="${item.id}">${item.item_name}</option>`).join('');

    select.addEventListener("change", ensureLastRowExists); 
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

        updateRowTotals(targetRow);


        const rows = Array.from(tableBody.rows);
        if (isRowFilled(rows[rows.length - 1])) {
            addDetailRow();
        }
        updateItemCount();
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

    const tax = qty * price * 0.15; 
    const total = qty * price + tax; 

    taxCell.textContent = tax.toFixed(2);
    totalCell.textContent = total.toFixed(2);
}

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

    validateAndSetCustomer();
    const customerId = document.getElementById("cust").dataset.id;

    if (!customerId) {
        displayMessage("يرجى اختيار عميل صحيح قبل الحفظ.", "error");
        updateStatusIndicator(1);
        return;
    }

    showLoadingSpinner();

    try {
        updateInvoiceAmount();

        const invoiceData = {
            inv_id: document.getElementById("inv_id").textContent,
            inv_type: document.getElementById("inv_type").getAttribute("data-inv-type"),
            inv_date: new Date(document.getElementById("inv_date").value).toISOString(),
            inv_amt: parseFloat(document.getElementById("total-after-tax").textContent).toFixed(2),
            inv_tax: parseFloat(document.getElementById("total-tax").textContent).toFixed(2),
            inv_net: parseFloat(document.getElementById("total-amount").textContent).toFixed(2),
            inv_notes: document.getElementById("inv_notes").value || null,
            inv_status: true,
            commit: true, // التأكيد على حفظ commit = true
            cr_date: new Date().toISOString(),
            cust: parseInt(customerId),
            acc: parseInt(document.getElementById("acc").value) || null
        };

        // توليد QR Code وحفظه كنص
        const qrCodeText = generateQRCode(invoiceData);
        invoiceData.inv_qr = qrCodeText; // تخزين النص في inv_qr

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
    let allDetailsSaved = true;

    for (const row of tableRows) {
        const itemInput = row.querySelector(".item-select");
        const qtyInput = row.querySelector(".item-qty");
        const priceInput = row.querySelector(".item-price");

        const itemName = itemInput.value.trim();
        const qty = parseFloat(qtyInput.value);
        const price = parseFloat(priceInput.value);


        const selectedItem = items.find(item => item.item_name === itemName);

        if (!selectedItem || isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
            console.warn(`Skipping invalid row: ${row.rowIndex + 1}`);
            continue; 
        }

        const detail = {
            inv_dtl_id: row.rowIndex + 1,
            item_qty: qty.toFixed(0), 
            item_price: price.toFixed(2), 
            inv_tax: "15.00",
            tax_amt: (qty * price * 0.15).toFixed(0),
            inv_status: true, 
            cr_date: new Date().toISOString(), 
            inv: invoiceId, 
            item: selectedItem.id, 
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

    const confirmation = confirm("هل أنت متأكد أنك تريد حذف هذه الفاتورة؟ لن تتمكن من استعادتها لاحقًا.");
    if (!confirmation) {
        return;
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

    document.getElementById("id").value = invoice.id || "";
    document.getElementById("inv_id").textContent = invoice.inv_id || "";
    document.getElementById("inv_date").value = invoice.inv_date
        ? new Date(invoice.inv_date).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16); 
    document.getElementById("inv_type").textContent = invoice.inv_type || "";
    document.getElementById("inv_amt").value = invoice.inv_amt || "0.00";
    document.getElementById("inv_notes").value = invoice.inv_notes || "";
    document.getElementById("commit").checked = invoice.commit || false;
    document.getElementById("cust").value = invoice.cust || "";
    document.getElementById("acc").value = invoice.acc || "";

    fetchInvoiceDetails(invoice.id);
}


async function fetchInvoiceDetails(invoiceId) {
    try {
        const response = await fetch('http://84.46.240.24:8000/api/invoices_dtl_list');
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const details = await response.json();

        const invoiceDetails = details.filter(detail => detail.inv == invoiceId);
        if (invoiceDetails.length === 0) {
            console.warn(`لا توجد تفاصيل للفاتورة رقم ${invoiceId}.`);
            clearInvoiceDetails();
            return;
        }

        displayInvoiceDetails(invoiceDetails);
    } catch (error) {
        console.error("Error fetching invoice details:", error);
    }
}

function displayInvoiceDetails(details) {
    const tableBody = document.getElementById("invoice-details-table").querySelector("tbody");
    tableBody.innerHTML = ""; 

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
    tableBody.innerHTML = ""; 
}

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
                    targetIndex = index + 1;
                    break;
                case "ArrowRight": // التنقل إلى اليمين
                    targetIndex = index - 1;
                case "Enter": 
                    targetIndex = index + 1;
                    break;
                default:
                    return; 
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

function updateItemCount() {
    const tableBody = document.getElementById("invoice-details-table").querySelector("tbody");
    const rows = Array.from(tableBody.rows).filter(row => {
        const itemInput = row.querySelector(".item-select");
        return itemInput && itemInput.value.trim() !== "";
    });

    document.getElementById("total-items").textContent = rows.length; // تحديث الحقل بعدد الأصناف
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
    document.getElementById("inv_id").textContent = document.getElementById("inv_id").textContent || "--";
    document.getElementById("invoice-date").textContent = document.getElementById("inv_date").value || "--";

    // تفعيل الوظائف المساعدة
    enableTableNavigation();
    disableNumberScroll();
    validateItemInput();
    ensureLastRowExists();
    enableCellHighlight();
    enableRowAutoAdd();
    updateItemCount(); 
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
                await setCustomerDetails(selectedCustomerId);
            } else {
                document.getElementById("customer-info").textContent = "";
                document.getElementById("acc").innerHTML = '<option value="">يرجى اختيار عميل صحيح</option>';
            }
        });        

    } else {
        console.error("العناصر المطلوبة (cust, custlist, acc) غير موجودة في الصفحة.");
    }
});
function generateQRCode(invoiceData) {
    const sellerName = "شركة ثمار الصفاء المتميزة التجارية"; // اسم البائع
    const vatNumber = "311452959900003"; // رقم الضريبة
    const invoiceDate = new Date(invoiceData.inv_date).toISOString(); // تنسيق ISO8601
    const totalAmount = invoiceData.inv_amt; // المبلغ شامل الضريبة
    const vatAmount = invoiceData.inv_tax; // الضريبة المضافة

    // بناء بيانات TLV
    const tlvData = [
        encodeTLV(1, sellerName),
        encodeTLV(2, vatNumber),
        encodeTLV(3, invoiceDate),
        encodeTLV(4, totalAmount),
        encodeTLV(5, vatAmount)
    ].join('');

    // تحويل البيانات إلى Base64
    const base64Data = btoa(tlvData);

    // توليد QR Code إلى عنصر canvas
    QRCode.toCanvas(document.getElementById('qr-code'), base64Data, { width: 128 }, function (error) {
        if (error) {
            console.error("QR Code generation failed:", error);
        } else {
            console.log("QR Code generated successfully!");
        }
    });

    // إرجاع قيمة Base64 النصية لاستخدامها في inv_qr
    return base64Data;
}


function encodeTLV(tag, value) {
    const valueBytes = new TextEncoder().encode(value);
    const lengthBytes = [valueBytes.length];
    const tagBytes = [tag];
    return new Uint8Array([...tagBytes, ...lengthBytes, ...valueBytes]).reduce(
        (str, byte) => str + String.fromCharCode(byte),
        ''
    );
}
