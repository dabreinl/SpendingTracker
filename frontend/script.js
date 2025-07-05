// frontend/script.js - Updated for new UI elements and confirmation modal
document.addEventListener('DOMContentLoaded', () => {

    // --- Element Selectors ---
    const body = document.body;
    const fixedCostsList = document.getElementById('fixed-costs-list');
    const variableCostsList = document.getElementById('variable-costs-list');
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const expenseNameInput = document.getElementById('expense-name-input');
    const expenseAmountInput = document.getElementById('expense-amount-input');
    const expenseDescriptionInput = document.getElementById('expense-description-input');
    const clearFixedBtn = document.getElementById('clear-fixed-btn');
    const clearVariableBtn = document.getElementById('clear-variable-btn');
    const totalFixedFooter = document.getElementById('total-fixed-footer');
    const totalVariableFooter = document.getElementById('total-variable-footer');
    const grandTotalEl = document.getElementById('grand-total');
    const currencySelector = document.getElementById('currency-selector');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const datePickerBtn = document.getElementById('date-picker-toggle-btn');
    const datePickerModal = document.getElementById('date-picker-modal');
    const prevYearBtn = document.getElementById('prev-year-btn');
    const nextYearBtn = document.getElementById('next-year-btn');
    const displayedYearEl = document.getElementById('displayed-year');
    const monthGrid = document.getElementById('month-grid');
    const openImportModalBtn = document.getElementById('open-import-modal-btn');
    const importModal = document.getElementById('import-modal');
    const importModalCloseBtn = document.getElementById('import-modal-close-btn');
    const importFixedList = document.getElementById('import-fixed-list');
    const importVariableList = document.getElementById('import-variable-list');
    const importSelectedBtn = document.getElementById('import-selected-btn');
    const salaryInput = document.getElementById('salary-input');
    const fixedBudgetSlider = document.getElementById('fixed-budget-slider');
    const variableBudgetSlider = document.getElementById('variable-budget-slider');
    const fixedPercentDisplay = document.getElementById('fixed-percent-display');
    const variablePercentDisplay = document.getElementById('variable-percent-display');
    const saveBudgetBtn = document.getElementById('save-budget-btn');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationTitle = document.getElementById('confirmation-title');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmActionBtn = document.getElementById('confirm-action-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

    // --- Icons ---
    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M4 10l4 4L16 6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    // --- State Variables ---
    const API_URL = '/api/costs';
    const MIN_YEAR = 2020;
    const now = new Date();
    let selectedYear = now.getFullYear();
    let selectedMonth = now.getMonth() + 1;
    let displayedYearInPicker = selectedYear;
    let currentCurrency = currencySelector.value;
    let allCosts = [];
    let monthlySummary = [];
    let currentlyEditingId = null;
    let confirmCallback = null;

    // --- Utility Functions ---
    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currentCurrency, minimumFractionDigits: 2 }).format(amount);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // --- API Functions ---
    const fetchAPI = async (url, options = {}) => {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
                throw new Error(errorData.error || `Network response was not ok: ${response.statusText}`);
            }
            if (response.status === 204) return null; // Handle No Content response
            return response.json();
        } catch (error) {
            console.error('API Error:', error);
            // Here you could implement a user-facing error message (e.g., a toast notification)
            throw error;
        }
    };

    const fetchBudget = (year, month) => fetchAPI(`${API_URL}/budget/${year}/${month}`);
    const saveBudget = async () => {
        const budgetData = {
            salary: parseFloat(salaryInput.value) || 0,
            fixed_percent: parseInt(fixedBudgetSlider.value),
            variable_percent: parseInt(variableBudgetSlider.value)
        };
        await fetchAPI(`${API_URL}/budget/${selectedYear}/${selectedMonth}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(budgetData),
        });
        saveBudgetBtn.classList.add('is-success');
        saveBudgetBtn.querySelector('span').textContent = 'Saved!';
        setTimeout(() => {
            saveBudgetBtn.classList.remove('is-success');
            saveBudgetBtn.querySelector('span').textContent = 'Save Budget';
        }, 2000);
        renderCosts();
    };
    const fetchMonthlySummary = () => fetchAPI(`${API_URL}/summary`).then(data => { monthlySummary = data; });
    
    const fetchAndRenderCosts = async () => {
        if (!selectedYear || !selectedMonth) return;
        const url = new URL(API_URL, window.location.origin);
        url.searchParams.append('year', selectedYear);
        url.searchParams.append('month', String(selectedMonth).padStart(2, '0'));
        allCosts = await fetchAPI(url) || [];
        renderCosts();
    };

    const addCost = async (name, amount, description, type) => {
        let isValid = true;
        if (!name) {
            expenseNameInput.classList.add('shake');
            isValid = false;
        }
        if (!amount) {
            expenseAmountInput.classList.add('shake');
            isValid = false;
        }

        if(!isValid) {
            setTimeout(() => {
                expenseNameInput.classList.remove('shake');
                expenseAmountInput.classList.remove('shake');
            }, 500);
            return;
        }

        const dateForExpense = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01T12:00:00`;
        try {
            await fetchAPI(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, amount, description, type, date: dateForExpense }),
            });
            expenseNameInput.value = '';
            expenseAmountInput.value = '';
            expenseDescriptionInput.value = '';
            expenseNameInput.focus();
            await fetchMonthlySummary();
            await fetchAndRenderCosts();
        } catch (error) {
            console.error("Failed to add cost:", error);
        }
    };

    const deleteCost = (costId) => fetchAPI(`${API_URL}/${costId}`, { method: 'DELETE' }).then(() => { fetchMonthlySummary(); fetchAndRenderCosts(); });
    
    const clearCosts = (costType) => {
        const url = new URL(`${API_URL}/clear/${costType}`, window.location.origin);
        url.searchParams.append('year', selectedYear);
        url.searchParams.append('month', String(selectedMonth).padStart(2, '0'));
        fetchAPI(url, { method: 'DELETE' }).then(() => { fetchMonthlySummary(); fetchAndRenderCosts(); });
    };

    const updateCost = (costId, costData) => fetchAPI(`${API_URL}/${costId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(costData) }).then(fetchAndRenderCosts);
    const updateCostType = (costId, newType) => fetchAPI(`${API_URL}/${costId}/type`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: newType }) }).then(fetchAndRenderCosts);
    
    const fetchAllPreviousCosts = () => {
        const url = new URL(`${API_URL}/all_previous`, window.location.origin);
        url.searchParams.append('year', selectedYear);
        url.searchParams.append('month', String(selectedMonth).padStart(2, '0'));
        return fetchAPI(url);
    };

    const batchAddCosts = (costs) => {
        fetchAPI(`${API_URL}/batch_add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(costs),
        }).then(() => {
            fetchMonthlySummary();
            fetchAndRenderCosts();
        });
    };

    const updateCheckedStatus = (costId, isChecked) => fetchAPI(`${API_URL}/${costId}/checked`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_checked: isChecked }) });

    // --- Rendering Functions ---
    const renderCosts = () => {
        let totalFixed = 0; let totalVariable = 0;
        const fixedItems = allCosts.filter(c => c.cost_type === 'fixed');
        const variableItems = allCosts.filter(c => c.cost_type === 'variable');

        const createCostItemHTML = (cost) => {
            const descriptionText = cost.description || '';
            const isChecked = cost.is_checked === 1;
            const checkboxId = `cost-check-${cost.id}`;
            const descriptionHTML = (descriptionText && descriptionText !== 'null') ? `<p class="cost-description">${descriptionText}</p>` : '';
            return `<div class="cost-item-main" draggable="true"><div class="custom-checkbox"><input type="checkbox" class="cost-checkbox" id="${checkboxId}" ${isChecked ? 'checked' : ''}><label for="${checkboxId}" class="visual">${checkIcon}</label></div><div class="cost-details"><div class="view-mode"><div class="cost-main-info"><span class="cost-name">${cost.name}</span><span class="cost-amount">${formatCurrency(cost.amount)}</span></div>${descriptionHTML}</div><div class="edit-mode"><div class="edit-name-amount"><input type="text" class="edit-name" value="${cost.name}" required><input type="number" class="edit-amount" value="${cost.amount}" min="0.01" step="0.01" required></div><textarea class="edit-description" rows="2" placeholder="Description...">${descriptionText}</textarea></div></div></div><div class="item-actions"><button class="edit-btn" aria-label="Edit"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"></path></svg></button><button class="delete-btn" aria-label="Delete"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></button><button class="save-btn" aria-label="Save"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></button><button class="cancel-btn" aria-label="Cancel"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg></button></div>`;
        };

        const populateList = (listElement, items) => {
            listElement.innerHTML = '';
            if (items.length === 0) {
                const message = listElement === fixedCostsList ? 'Log your first fixed cost.' : 'Log your first variable cost.';
                listElement.innerHTML = `<li class="empty-list-message">${message}</li>`;
            } else {
                items.forEach((cost, index) => {
                    const li = document.createElement('li');
                    li.dataset.id = cost.id;
                    li.draggable = true;
                    li.style.animationDelay = `${index * 50}ms`;
                    if(cost.is_checked) li.classList.add('is-checked');
                    li.innerHTML = createCostItemHTML(cost);
                    listElement.appendChild(li);
                });
            }
        };
        
        populateList(fixedCostsList, fixedItems);
        populateList(variableCostsList, variableItems);
        
        fixedItems.forEach(c => totalFixed += c.amount);
        variableItems.forEach(c => totalVariable += c.amount);

        const currentSalary = parseFloat(salaryInput.value) || 0;
        const currentFixedPercent = parseInt(fixedBudgetSlider.value);
        const currentVariablePercent = parseInt(variableBudgetSlider.value);
        const fixedBudget = currentSalary * (currentFixedPercent / 100);
        const variableBudget = currentSalary * (currentVariablePercent / 100);

        renderTotal(totalFixedFooter, 'Fixed', totalFixed, fixedBudget);
        renderTotal(totalVariableFooter, 'Variable', totalVariable, variableBudget);
        grandTotalEl.textContent = formatCurrency(totalFixed + totalVariable);
    };
    
    const renderTotal = (footerElement, label, total, budget) => {
        const percentage = (budget > 0 && total > 0) ? Math.min((total / budget) * 100, 100) : 0;
        const isOverBudget = total > budget && budget > 0;

        footerElement.innerHTML = `
            <div class="total-row">
                <span class="total-label">Total ${label}</span>
                <span class="total-amount">${formatCurrency(total)}</span>
            </div>
            <div class="total-row">
                <span class="total-label">${label} Budget</span>
                <span class="total-amount">${formatCurrency(budget)}</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${percentage}%"></div>
            </div>
        `;
        footerElement.classList.toggle('over-budget', isOverBudget);
    };

    const updateBudgetUI = (budgetData) => {
        if (!budgetData) return;
        salaryInput.value = budgetData.salary > 0 ? budgetData.salary : '';
        fixedBudgetSlider.value = budgetData.fixed_percent;
        variableBudgetSlider.value = budgetData.variable_percent;
        fixedPercentDisplay.textContent = budgetData.fixed_percent;
        variablePercentDisplay.textContent = budgetData.variable_percent;
        renderCosts();
    };

    // --- Modal & UI Functions ---
    const openModal = (modal) => modal.classList.remove('hidden');
    const closeModal = (modal) => modal.classList.add('hidden');
    const applyTheme = (theme) => { body.setAttribute('data-theme', theme); themeToggleBtn.innerHTML = theme === 'dark' ? sunIcon : moonIcon; localStorage.setItem('theme', theme); };
    const updateDatePickerButtonText = () => { datePickerBtn.textContent = `${monthNames[selectedMonth - 1]} ${selectedYear}`; };
    const renderMonthGrid = (year) => {
        monthGrid.innerHTML = '';
        displayedYearEl.textContent = year;
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        for (let i = 1; i <= 12; i++) {
            if (year > currentYear || (year === currentYear && i > currentMonth)) continue;
            if (year < MIN_YEAR) continue;
            const monthCell = document.createElement('div');
            monthCell.classList.add('month-cell');
            monthCell.textContent = monthNames[i - 1].substring(0, 3);
            monthCell.dataset.month = i;
            monthCell.dataset.year = year;
            const monthStr = String(i).padStart(2, '0');
            if (monthlySummary.some(s => s.year == year && s.month == monthStr)) monthCell.classList.add('has-data');
            if (year === selectedYear && i === selectedMonth) monthCell.classList.add('is-selected');
            monthGrid.appendChild(monthCell);
        }
        prevYearBtn.disabled = year <= MIN_YEAR;
        nextYearBtn.disabled = year >= currentYear;
    };

    const renderImportModal = (costs) => {
        importFixedList.innerHTML = ''; importVariableList.innerHTML = '';
        const fixedItems = costs.filter(c => c.cost_type === 'fixed');
        const variableItems = costs.filter(c => c.cost_type === 'variable');
        if (costs.length === 0) { importFixedList.innerHTML = '<li class="empty-list-message">Nothing to import.</li>'; return; }
        
        const createListItem = (cost) => {
            const listItem = document.createElement('li');
            const checkboxId = `import-checkbox-${cost.id}`;
            const descriptionText = cost.description || '';
            const descriptionHTML = (descriptionText && descriptionText !== 'null') ? `<p class="cost-description">${descriptionText}</p>` : '';
            const originDate = new Date(cost.created_at);
            const originMonth = monthNames[originDate.getUTCMonth()];
            const originYear = originDate.getUTCFullYear();
            const dateHTML = `<span class="import-item-date">from ${originMonth} ${originYear}</span>`;

            listItem.innerHTML = `
                <label for="${checkboxId}" class="import-item-label">
                    <div class="custom-checkbox">
                        <input type="checkbox" id="${checkboxId}" 
                               data-name="${cost.name}" 
                               data-amount="${cost.amount}" 
                               data-type="${cost.cost_type}" 
                               data-description="${cost.description || ''}">
                        <span class="visual">${checkIcon}</span>
                    </div>
                    <div class="import-item-details">
                        <div class="cost-main-info">
                            <span class="cost-name">${cost.name}</span>
                            <span class="cost-amount">${formatCurrency(cost.amount)}</span>
                        </div>
                        ${descriptionHTML}
                        ${dateHTML}
                    </div>
                </label>`;
            return listItem;
        };

        fixedItems.forEach(cost => importFixedList.appendChild(createListItem(cost)));
        variableItems.forEach(cost => importVariableList.appendChild(createListItem(cost)));
    };

    const openConfirmationModal = (title, message, onConfirm) => {
        confirmationTitle.textContent = title;
        confirmationMessage.textContent = message;
        confirmCallback = onConfirm;
        openModal(confirmationModal);
    };
    const enterEditMode = (listItem) => {
        if (currentlyEditingId) {
            const otherItem = document.querySelector(`.costs-list li[data-id='${currentlyEditingId}']`);
            if (otherItem) exitEditMode(otherItem);
        }
        listItem.classList.add('is-editing');
        currentlyEditingId = listItem.dataset.id;
        listItem.querySelector('.edit-name').focus();
    };
    const exitEditMode = (listItem) => {
        listItem.classList.remove('is-editing');
        currentlyEditingId = null;
    };

    // --- Event Listeners ---
    addExpenseBtn.addEventListener('click', () => { const selectedType = document.querySelector('input[name="expense-type"]:checked').value; addCost(expenseNameInput.value, expenseAmountInput.value, expenseDescriptionInput.value, selectedType); });
    datePickerBtn.addEventListener('click', () => { displayedYearInPicker = selectedYear; renderMonthGrid(displayedYearInPicker); openModal(datePickerModal); });
    document.querySelectorAll('.modal-overlay').forEach(overlay => overlay.addEventListener('click', (e) => closeModal(e.target.closest('.modal-container'))));
    prevYearBtn.addEventListener('click', () => { displayedYearInPicker--; renderMonthGrid(displayedYearInPicker); });
    nextYearBtn.addEventListener('click', () => { displayedYearInPicker++; renderMonthGrid(displayedYearInPicker); });
    monthGrid.addEventListener('click', async (e) => {
        if (e.target.classList.contains('month-cell')) {
            selectedYear = parseInt(e.target.dataset.year);
            selectedMonth = parseInt(e.target.dataset.month);
            updateDatePickerButtonText();
            closeModal(datePickerModal);
            const budgetData = await fetchBudget(selectedYear, selectedMonth);
            await fetchAndRenderCosts();
            updateBudgetUI(budgetData);
        }
    });
    openImportModalBtn.addEventListener('click', async () => { const previousCosts = await fetchAllPreviousCosts(); renderImportModal(previousCosts); openModal(importModal); });
    importModalCloseBtn.addEventListener('click', () => closeModal(importModal));
    importSelectedBtn.addEventListener('click', () => {
        const selectedCheckboxes = document.querySelectorAll('#import-modal input[type="checkbox"]:checked');
        if (selectedCheckboxes.length === 0) { alert('Please select at least one expense to import.'); return; }
        const dateForNewExpenses = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01T12:00:00`;
        const costsToImport = Array.from(selectedCheckboxes).map(cb => ({ name: cb.dataset.name, amount: parseFloat(cb.dataset.amount), type: cb.dataset.type, description: cb.dataset.description, date: dateForNewExpenses }));
        batchAddCosts(costsToImport);
        closeModal(importModal);
    });
    clearFixedBtn.addEventListener('click', () => openConfirmationModal('Clear Fixed Costs?', `This will delete all FIXED costs for ${monthNames[selectedMonth - 1]} ${selectedYear}.`, () => clearCosts('fixed')));
    clearVariableBtn.addEventListener('click', () => openConfirmationModal('Clear Variable Costs?', `This will delete all VARIABLE costs for ${monthNames[selectedMonth - 1]} ${selectedYear}.`, () => clearCosts('variable')));
    confirmActionBtn.addEventListener('click', () => { if (confirmCallback) { confirmCallback(); } closeModal(confirmationModal); });
    confirmCancelBtn.addEventListener('click', () => closeModal(confirmationModal));
    currencySelector.addEventListener('change', (e) => { currentCurrency = e.target.value; renderCosts(); });
    themeToggleBtn.addEventListener('click', () => { const newTheme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; applyTheme(newTheme); });
    salaryInput.addEventListener('input', renderCosts);
    [fixedBudgetSlider, variableBudgetSlider].forEach(slider => {
        slider.addEventListener('input', (e) => {
            let fixedVal = parseInt(fixedBudgetSlider.value);
            let varVal = parseInt(variableBudgetSlider.value);
            if (fixedVal + varVal > 100) {
                if (e.target === fixedBudgetSlider) {
                    variableBudgetSlider.value = 100 - fixedVal;
                } else {
                    fixedBudgetSlider.value = 100 - varVal;
                }
            }
            fixedPercentDisplay.textContent = fixedBudgetSlider.value;
            variablePercentDisplay.textContent = variableBudgetSlider.value;
            renderCosts();
        });
    });
    saveBudgetBtn.addEventListener('click', saveBudget);

    // Drag & Drop Logic
    let draggedItem = null;
    document.addEventListener('dragstart', (e) => { const itemMain = e.target.closest('.cost-item-main'); if (itemMain) { draggedItem = itemMain.closest('li'); setTimeout(() => { draggedItem.classList.add('dragging'); }, 0); } });
    document.addEventListener('dragend', () => { if (draggedItem) { draggedItem.classList.remove('dragging'); draggedItem = null; } });
    [fixedCostsList, variableCostsList].forEach(list => {
        list.addEventListener('dragover', (e) => { e.preventDefault(); const draggingItem = document.querySelector('.dragging'); if (draggingItem && draggingItem.parentElement !== list) { list.classList.add('drag-over'); } });
        list.addEventListener('dragleave', () => list.classList.remove('drag-over'));
        list.addEventListener('drop', (e) => { e.preventDefault(); list.classList.remove('drag-over'); if (draggedItem && draggedItem.parentElement !== list) { const costId = draggedItem.dataset.id; const newType = list.id === 'fixed-costs-list' ? 'fixed' : 'variable'; updateCostType(costId, newType); } });
    });

    // Cost Item Actions (Event Delegation)
    const handleItemActions = async (e) => {
        const target = e.target;
        const listItem = target.closest('li');
        if (!listItem) return;
        
        // Checkbox click
        if (target.classList.contains('cost-checkbox') || target.closest('.custom-checkbox')) {
            const checkbox = listItem.querySelector('.cost-checkbox');
            const costId = listItem.dataset.id;
            const isChecked = checkbox.checked;
            listItem.classList.toggle('is-checked', isChecked);
            await updateCheckedStatus(costId, isChecked);
            return;
        }

        // Action buttons
        const actionButton = target.closest('.item-actions button');
        if (!actionButton) return;
        const costId = listItem.dataset.id;
        if (actionButton.classList.contains('edit-btn')) { enterEditMode(listItem); }
        if (actionButton.classList.contains('cancel-btn')) { exitEditMode(listItem); renderCosts(); }
        if (actionButton.classList.contains('delete-btn')) { openConfirmationModal('Delete Expense?', 'Are you sure you want to delete this item?', () => deleteCost(costId)); }
        if (actionButton.classList.contains('save-btn')) {
            const name = listItem.querySelector('.edit-name').value;
            const amount = listItem.querySelector('.edit-amount').value;
            const description = listItem.querySelector('.edit-description').value;
            if (!name || !amount) { alert('Name and amount cannot be empty.'); return; }
            await updateCost(costId, { name, amount, description });
        }
    };
    [fixedCostsList, variableCostsList].forEach(list => list.addEventListener('click', handleItemActions));

    // Global Keydown Listener
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-container:not(.hidden)').forEach(closeModal);
            if (currentlyEditingId) {
                const item = document.querySelector(`.costs-list li[data-id='${currentlyEditingId}']`);
                if (item) { exitEditMode(item); renderCosts(); }
            }
        }
        if (e.key === 'Enter' && currentlyEditingId) {
            const listItem = document.querySelector(`.costs-list li[data-id='${currentlyEditingId}']`);
            if (listItem && document.activeElement.closest('li') === listItem) {
                e.preventDefault();
                listItem.querySelector('.save-btn').click();
            }
        }
    });

    // --- Initial Load ---
    const initializeApp = async () => {
        applyTheme(localStorage.getItem('theme') || 'light');
        updateDatePickerButtonText();
        try {
            await fetchMonthlySummary();
            const budgetData = await fetchBudget(selectedYear, selectedMonth);
            await fetchAndRenderCosts();
            updateBudgetUI(budgetData);
            // Remove loading class after initial animations
            setTimeout(() => body.classList.remove('loading'), 500);
        } catch (error) {
            console.error("Failed to initialize app:", error);
            body.classList.remove('loading');
        }
    };
    
    initializeApp();
});
