// frontend/script.js
document.addEventListener('DOMContentLoaded', () => {

    const body = document.body;
    const fixedCostsList = document.getElementById('fixed-costs-list');
    const variableCostsList = document.getElementById('variable-costs-list');
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const expenseNameInput = document.getElementById('expense-name-input');
    const expenseAmountInput = document.getElementById('expense-amount-input');
    const expenseDescriptionInput = document.getElementById('expense-description-input');
    const clearFixedBtn = document.getElementById('clear-fixed-btn');
    const clearVariableBtn = document.getElementById('clear-variable-btn');
    const totalFixedEl = document.getElementById('total-fixed');
    const totalVariableEl = document.getElementById('total-variable');
    const grandTotalEl = document.getElementById('grand-total');
    const currencySelector = document.getElementById('currency-selector');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const datePickerBtn = document.getElementById('date-picker-toggle-btn');
    const datePickerModal = document.getElementById('date-picker-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const prevYearBtn = document.getElementById('prev-year-btn');
    const nextYearBtn = document.getElementById('next-year-btn');
    const displayedYearEl = document.getElementById('displayed-year');
    const monthGrid = document.getElementById('month-grid');
    const openImportModalBtn = document.getElementById('open-import-modal-btn');
    const importModal = document.getElementById('import-modal');
    const importModalOverlay = document.getElementById('import-modal-overlay');
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

    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M4 10l4 4L16 6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const API_URL = '/api/costs';
    const MIN_YEAR = 2025;
    const now = new Date();
    let selectedYear = now.getFullYear();
    let selectedMonth = now.getMonth() + 1;
    let displayedYearInPicker = selectedYear;
    let currentCurrency = currencySelector.value;
    let allCosts = [];
    let monthlySummary = [];
    let currentlyEditingId = null;

    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currentCurrency }).format(amount);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const fetchBudget = async (year, month) => { try { const response = await fetch(`${API_URL}/budget/${year}/${month}`); const budgetData = await response.json(); updateBudgetUI(budgetData); } catch (error) { console.error('Failed to fetch budget:', error); } };
    const saveBudget = async () => { const budgetData = { salary: parseFloat(salaryInput.value) || 0, fixed_percent: parseInt(fixedBudgetSlider.value), variable_percent: parseInt(variableBudgetSlider.value) }; try { await fetch(`${API_URL}/budget/${selectedYear}/${selectedMonth}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(budgetData), }); renderCosts(); } catch (error) { console.error('Failed to save budget:', error); } };
    const fetchMonthlySummary = async () => { try { const response = await fetch(`${API_URL}/summary`); monthlySummary = await response.json(); } catch (error) { console.error('Failed to fetch monthly summary:', error); } };
    const fetchAndRenderCosts = async () => { if (!selectedYear || !selectedMonth) return; try { const url = new URL(API_URL, window.location.origin); url.searchParams.append('year', selectedYear); url.searchParams.append('month', String(selectedMonth).padStart(2, '0')); const response = await fetch(url); if (!response.ok) throw new Error('Network response was not ok'); allCosts = await response.json(); renderCosts(); } catch (error) { console.error('Failed to fetch costs:', error); } };
    const addCost = async (name, amount, description, type) => { if (!name || !amount) { alert('Please enter both name and amount.'); return; } const dateForExpense = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01T12:00:00`; try { await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, amount, description, type, date: dateForExpense }), }); expenseNameInput.value = ''; expenseAmountInput.value = ''; expenseDescriptionInput.value = ''; expenseNameInput.focus(); await fetchMonthlySummary(); await fetchAndRenderCosts(); } catch (error) { console.error('Error adding cost:', error); } };
    const deleteCost = async (costId) => { try { await fetch(`${API_URL}/${costId}`, { method: 'DELETE' }); await fetchMonthlySummary(); await fetchAndRenderCosts(); } catch (error) { console.error(`Error deleting cost ${costId}:`, error); } };
    const clearCosts = async (costType) => { try { const url = new URL(`${API_URL}/clear/${costType}`, window.location.origin); url.searchParams.append('year', selectedYear); url.searchParams.append('month', String(selectedMonth).padStart(2, '0')); await fetch(url, { method: 'DELETE' }); await fetchMonthlySummary(); await fetchAndRenderCosts(); } catch (error) { console.error(`Error clearing ${costType} costs:`, error); } };
    const updateCost = async (costId, costData) => { try { await fetch(`${API_URL}/${costId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(costData), }); await fetchAndRenderCosts(); } catch (error) { console.error(`Error updating cost ${costId}:`, error); } };
    const updateCostType = async (costId, newType) => { try { await fetch(`${API_URL}/${costId}/type`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: newType }), }); await fetchAndRenderCosts(); } catch (error) { console.error(`Error updating cost type for ${costId}:`, error); } };
    const fetchAllPreviousCosts = async () => { const url = new URL(`${API_URL}/all_previous`, window.location.origin); url.searchParams.append('year', selectedYear); url.searchParams.append('month', String(selectedMonth).padStart(2, '0')); try { const response = await fetch(url); return await response.json(); } catch (error) { console.error('Failed to fetch previous costs:', error); return []; } };
    const batchAddCosts = async (costs) => { try { await fetch(`${API_URL}/batch_add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(costs), }); await fetchMonthlySummary(); await fetchAndRenderCosts(); } catch (error) { console.error('Error batch adding costs:', error); } };
    const updateCheckedStatus = async (costId, isChecked) => { try { await fetch(`${API_URL}/${costId}/checked`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_checked: isChecked }), }); } catch (error) { console.error(`Error updating checked status for ${costId}:`, error); fetchAndRenderCosts(); } };

    const renderCosts = () => {
        let totalFixed = 0; let totalVariable = 0;
        const fixedItems = allCosts.filter(c => c.cost_type === 'fixed');
        const variableItems = allCosts.filter(c => c.cost_type === 'variable');
        const createCostItemHTML = (cost) => { const descriptionText = cost.description || ''; const isChecked = cost.is_checked === 1; const checkboxId = `cost-check-${cost.id}`; const descriptionHTML = (descriptionText && descriptionText !== 'null') ? `<p class="cost-description">${descriptionText}</p>` : ''; return `<div class="cost-item-main" draggable="true"><div class="custom-checkbox"><input type="checkbox" class="cost-checkbox" id="${checkboxId}" ${isChecked ? 'checked' : ''}><label for="${checkboxId}" class="visual">${checkIcon}</label></div><div class="cost-details"><div class="view-mode"><div class="cost-main-info"><span class="cost-name">${cost.name}</span><span class="cost-amount">${formatCurrency(cost.amount)}</span></div>${descriptionHTML}</div><div class="edit-mode"><div class="edit-name-amount"><input type="text" class="edit-name" value="${cost.name}" required><input type="number" class="edit-amount" value="${cost.amount}" min="0.01" step="0.01" required></div><textarea class="edit-description" rows="2" placeholder="Description...">${descriptionText}</textarea></div></div></div><div class="item-actions"><button class="edit-btn" aria-label="Edit"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"></path></svg></button><button class="delete-btn" aria-label="Delete"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></button><button class="save-btn" aria-label="Save"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></button><button class="cancel-btn" aria-label="Cancel"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg></button></div>`; };
        const populateList = (listElement, items, totalCounter) => { listElement.innerHTML = ''; if (items.length === 0) { const message = listElement === fixedCostsList ? 'No fixed costs for this month.' : 'No variable costs for this month.'; listElement.innerHTML = `<li class="empty-list-message">${message}</li>`; } else { items.forEach(cost => { const li = document.createElement('li'); li.dataset.id = cost.id; li.draggable = true; if(cost.is_checked) li.classList.add('is-checked'); li.innerHTML = createCostItemHTML(cost); listElement.appendChild(li); totalCounter(cost.amount); }); } };
        populateList(fixedCostsList, fixedItems, (amount) => totalFixed += amount);
        populateList(variableCostsList, variableItems, (amount) => totalVariable += amount);
        const currentSalary = parseFloat(salaryInput.value) || 0;
        const currentFixedPercent = parseInt(fixedBudgetSlider.value);
        const currentVariablePercent = parseInt(variableBudgetSlider.value);
        const fixedBudget = currentSalary * (currentFixedPercent / 100); const variableBudget = currentSalary * (currentVariablePercent / 100);
        totalFixedEl.innerHTML = `Total Fixed: <span class="amount">${formatCurrency(totalFixed)}</span> <span class="budget-limit">/ ${formatCurrency(fixedBudget)}</span>`;
        totalVariableEl.innerHTML = `Total Variable: <span class="amount">${formatCurrency(totalVariable)}</span> <span class="budget-limit">/ ${formatCurrency(variableBudget)}</span>`;
        grandTotalEl.textContent = `Grand Total: ${formatCurrency(totalFixed + totalVariable)}`;
        totalFixedEl.classList.toggle('over-budget', totalFixed > fixedBudget && fixedBudget > 0);
        totalVariableEl.classList.toggle('over-budget', totalVariable > variableBudget && variableBudget > 0);
    };
    const updateBudgetUI = (budgetData) => { salaryInput.value = budgetData.salary > 0 ? budgetData.salary : ''; fixedBudgetSlider.value = budgetData.fixed_percent; variableBudgetSlider.value = budgetData.variable_percent; fixedPercentDisplay.textContent = budgetData.fixed_percent; variablePercentDisplay.textContent = budgetData.variable_percent; renderCosts(); };
    const renderMonthGrid = (year) => { monthGrid.innerHTML = ''; displayedYearEl.textContent = year; const currentYear = new Date().getFullYear(); const currentMonth = new Date().getMonth() + 1; for (let i = 1; i <= 12; i++) { if (year === currentYear && i > currentMonth) continue; if (year < MIN_YEAR) continue; const monthCell = document.createElement('div'); monthCell.classList.add('month-cell'); monthCell.textContent = monthNames[i - 1].substring(0, 3); monthCell.dataset.month = i; monthCell.dataset.year = year; const monthStr = String(i).padStart(2, '0'); if (monthlySummary.some(s => s.year == year && s.month == monthStr)) { monthCell.classList.add('has-data'); } if (year === selectedYear && i === selectedMonth) { monthCell.classList.add('is-selected'); } monthGrid.appendChild(monthCell); } prevYearBtn.disabled = year <= MIN_YEAR; nextYearBtn.disabled = year >= currentYear; };
    const openDatePicker = () => { displayedYearInPicker = selectedYear; renderMonthGrid(displayedYearInPicker); datePickerModal.classList.remove('hidden'); };
    const closeDatePicker = () => datePickerModal.classList.add('hidden');
    const updateDatePickerButtonText = () => { datePickerBtn.textContent = `${monthNames[selectedMonth - 1]} ${selectedYear}`; };
    const renderImportModal = (costs) => { importFixedList.innerHTML = ''; importVariableList.innerHTML = ''; const fixedItems = costs.filter(c => c.cost_type === 'fixed'); const variableItems = costs.filter(c => c.cost_type === 'variable'); if (costs.length === 0) { importFixedList.innerHTML = '<li class="empty-list-message">Nothing to import yet!</li>'; return; } const createListItem = (cost) => { const listItem = document.createElement('li'); const checkboxId = `import-checkbox-${cost.id}`; const descriptionHTML = (cost.description && cost.description !== 'null') ? `<p class="cost-description">${cost.description}</p>` : ''; const originDate = new Date(cost.created_at); const originMonth = monthNames[originDate.getUTCMonth()]; const originYear = originDate.getUTCFullYear(); const dateHTML = `<span class="import-item-date">from ${originMonth} ${originYear}</span>`; listItem.innerHTML = `<input type="checkbox" id="${checkboxId}" data-name="${cost.name}" data-amount="${cost.amount}" data-type="${cost.cost_type}" data-description="${cost.description || ''}"><label for="${checkboxId}"><div class="cost-main-info"><span class="cost-name">${cost.name}</span><span class="cost-amount">${formatCurrency(cost.amount)}</span></div>${descriptionHTML}${dateHTML}</label>`; return listItem; }; fixedItems.forEach(cost => importFixedList.appendChild(createListItem(cost))); variableItems.forEach(cost => importVariableList.appendChild(createListItem(cost))); };
    const openImportModal = async () => { const previousCosts = await fetchAllPreviousCosts(); renderImportModal(previousCosts); importModal.classList.remove('hidden'); };
    const closeImportModal = () => importModal.classList.add('hidden');
    const applyTheme = (theme) => { body.setAttribute('data-theme', theme); themeToggleBtn.innerHTML = theme === 'dark' ? sunIcon : moonIcon; localStorage.setItem('theme', theme); };
    const enterEditMode = (listItem) => { if (currentlyEditingId) { const otherItem = document.querySelector(`.costs-list li[data-id='${currentlyEditingId}']`); if (otherItem) exitEditMode(otherItem); } listItem.classList.add('is-editing'); currentlyEditingId = listItem.dataset.id; listItem.querySelector('.edit-name').focus();};
    const exitEditMode = (listItem) => { listItem.classList.remove('is-editing'); currentlyEditingId = null; };
    
    addExpenseBtn.addEventListener('click', () => { const selectedType = document.querySelector('input[name="expense-type"]:checked').value; addCost(expenseNameInput.value, expenseAmountInput.value, expenseDescriptionInput.value, selectedType); });
    datePickerBtn.addEventListener('click', openDatePicker);
    modalOverlay.addEventListener('click', closeDatePicker);
    prevYearBtn.addEventListener('click', () => { displayedYearInPicker--; renderMonthGrid(displayedYearInPicker); });
    nextYearBtn.addEventListener('click', () => { displayedYearInPicker++; renderMonthGrid(displayedYearInPicker); });
    monthGrid.addEventListener('click', async (e) => { if (e.target.classList.contains('month-cell')) { selectedYear = parseInt(e.target.dataset.year); selectedMonth = parseInt(e.target.dataset.month); updateDatePickerButtonText(); closeDatePicker(); await fetchBudget(selectedYear, selectedMonth); await fetchAndRenderCosts(); } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!datePickerModal.classList.contains('hidden')) closeDatePicker(); if (!importModal.classList.contains('hidden')) closeImportModal(); if (currentlyEditingId) { const item = document.querySelector(`.costs-list li[data-id='${currentlyEditingId}']`); if (item) { exitEditMode(item); renderCosts(); } } } });
    openImportModalBtn.addEventListener('click', openImportModal);
    importModalOverlay.addEventListener('click', closeImportModal);
    importModalCloseBtn.addEventListener('click', closeImportModal);
    importSelectedBtn.addEventListener('click', () => { const selectedCheckboxes = document.querySelectorAll('#import-modal input[type="checkbox"]:checked'); if (selectedCheckboxes.length === 0) { alert('Please select at least one expense to import.'); return; } const dateForNewExpenses = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01T12:00:00`; const costsToImport = Array.from(selectedCheckboxes).map(cb => ({ name: cb.dataset.name, amount: parseFloat(cb.dataset.amount), type: cb.dataset.type, description: cb.dataset.description, date: dateForNewExpenses, })); batchAddCosts(costsToImport); closeImportModal(); });
    clearFixedBtn.addEventListener('click', () => { const monthName = monthNames[selectedMonth - 1]; if (confirm(`Are you sure you want to delete all FIXED costs for ${monthName} ${selectedYear}?`)) clearCosts('fixed'); });
    clearVariableBtn.addEventListener('click', () => { const monthName = monthNames[selectedMonth - 1]; if (confirm(`Are you sure you want to delete all VARIABLE costs for ${monthName} ${selectedYear}?`)) clearCosts('variable'); });
    currencySelector.addEventListener('change', (e) => { currentCurrency = e.target.value; renderCosts(); });
    themeToggleBtn.addEventListener('click', () => { const newTheme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; applyTheme(newTheme); });
    salaryInput.addEventListener('input', () => renderCosts());
    fixedBudgetSlider.addEventListener('input', (e) => {
        let currentFixed = parseInt(e.target.value);
        let currentVariable = parseInt(variableBudgetSlider.value);
        if (currentFixed + currentVariable > 100) { variableBudgetSlider.value = 100 - currentFixed; variablePercentDisplay.textContent = variableBudgetSlider.value; }
        fixedPercentDisplay.textContent = currentFixed;
        renderCosts();
    });
    variableBudgetSlider.addEventListener('input', (e) => {
        let currentVariable = parseInt(e.target.value);
        let currentFixed = parseInt(fixedBudgetSlider.value);
        if (currentFixed + currentVariable > 100) { fixedBudgetSlider.value = 100 - currentVariable; fixedPercentDisplay.textContent = fixedBudgetSlider.value; }
        variablePercentDisplay.textContent = currentVariable;
        renderCosts();
    });
    saveBudgetBtn.addEventListener('click', saveBudget);
    let draggedItem = null;
    document.addEventListener('dragstart', (e) => { const itemMain = e.target.closest('.cost-item-main'); if (itemMain) { draggedItem = itemMain.closest('li'); setTimeout(() => { draggedItem.classList.add('dragging'); }, 0); } });
    document.addEventListener('dragend', () => { if (draggedItem) { draggedItem.classList.remove('dragging'); draggedItem = null; } });
    [fixedCostsList, variableCostsList].forEach(list => { list.addEventListener('dragover', (e) => { e.preventDefault(); const draggingItem = document.querySelector('.dragging'); if (draggingItem && draggingItem.parentElement !== list) { list.classList.add('drag-over'); } }); list.addEventListener('dragleave', () => list.classList.remove('drag-over')); list.addEventListener('drop', (e) => { e.preventDefault(); list.classList.remove('drag-over'); if (draggedItem && draggedItem.parentElement !== list) { const costId = draggedItem.dataset.id; const newType = list.id === 'fixed-costs-list' ? 'fixed' : 'variable'; updateCostType(costId, newType); } }); });
    const handleItemActions = async (e) => { const target = e.target; if (target.classList.contains('cost-checkbox') || target.closest('.custom-checkbox')) { const listItem = target.closest('li'); const checkbox = listItem.querySelector('.cost-checkbox'); const costId = listItem.dataset.id; const isChecked = checkbox.checked; listItem.classList.toggle('is-checked', isChecked); await updateCheckedStatus(costId, isChecked); return; } const actionButton = target.closest('.item-actions button'); if (!actionButton) return; const listItem = actionButton.closest('li'); const costId = listItem.dataset.id; if (actionButton.classList.contains('edit-btn')) { enterEditMode(listItem); } if (actionButton.classList.contains('cancel-btn')) { exitEditMode(listItem); renderCosts(); } if (actionButton.classList.contains('delete-btn')) { if (confirm('Are you sure you want to delete this item?')) deleteCost(costId); } if (actionButton.classList.contains('save-btn')) { const name = listItem.querySelector('.edit-name').value; const amount = listItem.querySelector('.edit-amount').value; const description = listItem.querySelector('.edit-description').value; if (!name || !amount) { alert('Name and amount cannot be empty.'); return; } await updateCost(costId, { name, amount, description }); } };
    fixedCostsList.addEventListener('click', handleItemActions);
    variableCostsList.addEventListener('click', handleItemActions);
    const handleItemKeydown = (e) => { if (e.key !== 'Enter' || !e.target.matches('.edit-name, .edit-amount, .edit-description')) return; e.preventDefault(); const listItem = e.target.closest('li'); const saveBtn = listItem.querySelector('.save-btn'); if (saveBtn) { saveBtn.click(); } };
    fixedCostsList.addEventListener('keydown', handleItemKeydown);
    variableCostsList.addEventListener('keydown', handleItemKeydown);

    // --- Initial Load ---
    const initializeApp = async () => { applyTheme(localStorage.getItem('theme') || 'light'); updateDatePickerButtonText(); await fetchBudget(selectedYear, selectedMonth); await fetchMonthlySummary(); await fetchAndRenderCosts(); };
    initializeApp();
});