// frontend/script.js
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selections ---
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

    // --- SVG Icons ---
    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

    // --- State & Constants ---
    const API_URL = '/api/costs';
    const MIN_YEAR = 2025;
    const now = new Date();
    let selectedYear = now.getFullYear();
    let selectedMonth = now.getMonth() + 1;
    let displayedYearInPicker = selectedYear;
    let currentCurrency = currencySelector.value;
    let allCosts = [];
    let monthlySummary = [];

    // --- Helper & Formatting Functions ---
    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currentCurrency }).format(amount);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // --- API Communication ---
    const fetchMonthlySummary = async () => { try { const response = await fetch(`${API_URL}/summary`); monthlySummary = await response.json(); } catch (error) { console.error('Failed to fetch monthly summary:', error); } };
    const fetchAndRenderCosts = async () => { if (!selectedYear || !selectedMonth) return; try { const url = new URL(API_URL, window.location.origin); url.searchParams.append('year', selectedYear); url.searchParams.append('month', String(selectedMonth).padStart(2, '0')); const response = await fetch(url); if (!response.ok) throw new Error('Network response was not ok'); allCosts = await response.json(); renderCosts(); } catch (error) { console.error('Failed to fetch costs:', error); } };
    const addCost = async (name, amount, description, type) => { if (!name || !amount) { alert('Please enter both name and amount.'); return; } const dateForExpense = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01T12:00:00`; try { await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, amount, description, type, date: dateForExpense }), }); expenseNameInput.value = ''; expenseAmountInput.value = ''; expenseDescriptionInput.value = ''; expenseNameInput.focus(); await fetchMonthlySummary(); await fetchAndRenderCosts(); } catch (error) { console.error('Error adding cost:', error); } };
    const deleteCost = async (costId) => { try { await fetch(`${API_URL}/${costId}`, { method: 'DELETE' }); await fetchMonthlySummary(); await fetchAndRenderCosts(); } catch (error) { console.error(`Error deleting cost ${costId}:`, error); } };
    const clearCosts = async (costType) => { try { const url = new URL(`${API_URL}/clear/${costType}`, window.location.origin); url.searchParams.append('year', selectedYear); url.searchParams.append('month', String(selectedMonth).padStart(2, '0')); await fetch(url, { method: 'DELETE' }); await fetchMonthlySummary(); await fetchAndRenderCosts(); } catch (error) { console.error(`Error clearing ${costType} costs:`, error); } };
    const updateCostType = async (costId, newType) => { try { await fetch(`${API_URL}/${costId}/type`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: newType }), }); await fetchAndRenderCosts(); } catch (error) { console.error(`Error updating cost ${costId}:`, error); } };
    const fetchAllPreviousCosts = async () => { const url = new URL(`${API_URL}/all_previous`, window.location.origin); url.searchParams.append('year', selectedYear); url.searchParams.append('month', String(selectedMonth).padStart(2, '0')); try { const response = await fetch(url); return await response.json(); } catch (error) { console.error('Failed to fetch previous costs:', error); return []; } };
    const batchAddCosts = async (costs) => { try { await fetch(`${API_URL}/batch_add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(costs), }); await fetchMonthlySummary(); await fetchAndRenderCosts(); } catch (error) { console.error('Error batch adding costs:', error); } };
    
    // --- Rendering Logic ---
    const renderCosts = () => {
        fixedCostsList.innerHTML = ''; variableCostsList.innerHTML = ''; let totalFixed = 0; let totalVariable = 0;
        const fixedItems = allCosts.filter(c => c.cost_type === 'fixed');
        const variableItems = allCosts.filter(c => c.cost_type === 'variable');
        
        if (fixedItems.length === 0) {
            fixedCostsList.innerHTML = '<li class="empty-list-message">No fixed costs for this month.</li>';
        } else {
            fixedItems.forEach(cost => {
                const listItem = document.createElement('li'); listItem.setAttribute('draggable', 'true'); listItem.dataset.id = cost.id;
                const descriptionHTML = (cost.description && cost.description !== 'null') ? `<p class="cost-description">${cost.description}</p>` : '';
                listItem.innerHTML = `<div class="cost-details"><div class="cost-main-info"><span class="cost-name">${cost.name}</span><span class="cost-amount">${formatCurrency(cost.amount)}</span></div>${descriptionHTML}</div><button class="delete-btn" data-id="${cost.id}" aria-label="Delete item"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>`;
                fixedCostsList.appendChild(listItem); totalFixed += cost.amount;
            });
        }
        
        if (variableItems.length === 0) {
            variableCostsList.innerHTML = '<li class="empty-list-message">No variable costs for this month.</li>';
        } else {
            variableItems.forEach(cost => {
                const listItem = document.createElement('li'); listItem.setAttribute('draggable', 'true'); listItem.dataset.id = cost.id;
                const descriptionHTML = (cost.description && cost.description !== 'null') ? `<p class="cost-description">${cost.description}</p>` : '';
                listItem.innerHTML = `<div class="cost-details"><div class="cost-main-info"><span class="cost-name">${cost.name}</span><span class="cost-amount">${formatCurrency(cost.amount)}</span></div>${descriptionHTML}</div><button class="delete-btn" data-id="${cost.id}" aria-label="Delete item"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>`;
                variableCostsList.appendChild(listItem); totalVariable += cost.amount;
            });
        }

        totalFixedEl.textContent = `Fixed: ${formatCurrency(totalFixed)}`; totalVariableEl.textContent = `Variable: ${formatCurrency(totalVariable)}`; grandTotalEl.textContent = `Grand Total: ${formatCurrency(totalFixed + totalVariable)}`;
    };
    
    // --- THIS FUNCTION IS NOW COMPLETE AND CORRECTED ---
    const renderMonthGrid = (year) => {
        monthGrid.innerHTML = '';
        displayedYearEl.textContent = year;
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        for (let i = 1; i <= 12; i++) {
            if (year === currentYear && i > currentMonth) continue;
            if (year < MIN_YEAR) continue;
            
            const monthCell = document.createElement('div');
            monthCell.classList.add('month-cell');
            monthCell.textContent = monthNames[i - 1].substring(0, 3);
            monthCell.dataset.month = i;
            monthCell.dataset.year = year;

            const monthStr = String(i).padStart(2, '0');
            if (monthlySummary.some(s => s.year == year && s.month == monthStr)) {
                monthCell.classList.add('has-data');
            }
            if (year === selectedYear && i === selectedMonth) {
                monthCell.classList.add('is-selected');
            }
            monthGrid.appendChild(monthCell);
        }
        prevYearBtn.disabled = year <= MIN_YEAR;
        nextYearBtn.disabled = year >= currentYear;
    };
    
    const openDatePicker = () => { displayedYearInPicker = selectedYear; renderMonthGrid(displayedYearInPicker); datePickerModal.classList.remove('hidden'); };
    const closeDatePicker = () => datePickerModal.classList.add('hidden');
    const updateDatePickerButtonText = () => { datePickerBtn.textContent = `${monthNames[selectedMonth - 1]} ${selectedYear}`; };

    const renderImportModal = (costs) => {
        importFixedList.innerHTML = ''; importVariableList.innerHTML = '';
        const fixedItems = costs.filter(c => c.cost_type === 'fixed');
        const variableItems = costs.filter(c => c.cost_type === 'variable');
        if (costs.length === 0) {
            importFixedList.innerHTML = '<li class="empty-list-message">Nothing to import yet!</li>';
            return;
        }
        const createListItem = (cost) => {
            const listItem = document.createElement('li'); const checkboxId = `import-checkbox-${cost.id}`;
            const descriptionHTML = (cost.description && cost.description !== 'null') ? `<p class="cost-description">${cost.description}</p>` : '';
            listItem.innerHTML = `<input type="checkbox" id="${checkboxId}" data-name="${cost.name}" data-amount="${cost.amount}" data-type="${cost.cost_type}" data-description="${cost.description || ''}"><label for="${checkboxId}"><div class="cost-main-info"><span class="cost-name">${cost.name}</span><span class="cost-amount">${formatCurrency(cost.amount)}</span></div>${descriptionHTML}</label>`;
            return listItem;
        };
        fixedItems.forEach(cost => importFixedList.appendChild(createListItem(cost)));
        variableItems.forEach(cost => importVariableList.appendChild(createListItem(cost)));
    };
    const openImportModal = async () => { const previousCosts = await fetchAllPreviousCosts(); renderImportModal(previousCosts); importModal.classList.remove('hidden'); };
    const closeImportModal = () => importModal.classList.add('hidden');
    
    const applyTheme = (theme) => { body.setAttribute('data-theme', theme); themeToggleBtn.innerHTML = theme === 'dark' ? sunIcon : moonIcon; localStorage.setItem('theme', theme); };
    
    addExpenseBtn.addEventListener('click', () => { const selectedType = document.querySelector('input[name="expense-type"]:checked').value; addCost(expenseNameInput.value, expenseAmountInput.value, expenseDescriptionInput.value, selectedType); });
    datePickerBtn.addEventListener('click', openDatePicker);
    modalOverlay.addEventListener('click', closeDatePicker);
    prevYearBtn.addEventListener('click', () => { displayedYearInPicker--; renderMonthGrid(displayedYearInPicker); });
    nextYearBtn.addEventListener('click', () => { displayedYearInPicker++; renderMonthGrid(displayedYearInPicker); });
    monthGrid.addEventListener('click', (e) => { if (e.target.classList.contains('month-cell')) { selectedYear = parseInt(e.target.dataset.year); selectedMonth = parseInt(e.target.dataset.month); updateDatePickerButtonText(); closeDatePicker(); fetchAndRenderCosts(); } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && (!datePickerModal.classList.contains('hidden') || !importModal.classList.contains('hidden'))) { closeDatePicker(); closeImportModal(); } });
    openImportModalBtn.addEventListener('click', openImportModal);
    importModalOverlay.addEventListener('click', closeImportModal);
    importModalCloseBtn.addEventListener('click', closeImportModal);
    importSelectedBtn.addEventListener('click', () => {
        const selectedCheckboxes = document.querySelectorAll('#import-modal input[type="checkbox"]:checked');
        if (selectedCheckboxes.length === 0) { alert('Please select at least one expense to import.'); return; }
        const dateForNewExpenses = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01T12:00:00`;
        const costsToImport = Array.from(selectedCheckboxes).map(cb => ({ name: cb.dataset.name, amount: parseFloat(cb.dataset.amount), type: cb.dataset.type, description: cb.dataset.description, date: dateForNewExpenses, }));
        batchAddCosts(costsToImport);
        closeImportModal();
    });
    clearFixedBtn.addEventListener('click', () => { const monthName = monthNames[selectedMonth - 1]; if (confirm(`Are you sure you want to delete all FIXED costs for ${monthName} ${selectedYear}?`)) clearCosts('fixed'); });
    clearVariableBtn.addEventListener('click', () => { const monthName = monthNames[selectedMonth - 1]; if (confirm(`Are you sure you want to delete all VARIABLE costs for ${monthName} ${selectedYear}?`)) clearCosts('variable'); });
    let draggedItem = null;
    document.addEventListener('dragstart', (e) => { if (e.target.matches('.costs-list li')) { draggedItem = e.target; setTimeout(() => e.target.classList.add('dragging'), 0); } });
    document.addEventListener('dragend', () => { if (draggedItem) { draggedItem.classList.remove('dragging'); draggedItem = null; } });
    [fixedCostsList, variableCostsList].forEach(list => { list.addEventListener('dragover', (e) => { e.preventDefault(); list.classList.add('drag-over'); }); list.addEventListener('dragleave', () => list.classList.remove('drag-over')); list.addEventListener('drop', (e) => { e.preventDefault(); list.classList.remove('drag-over'); if (draggedItem && draggedItem.parentElement !== list) { const costId = draggedItem.dataset.id; const newType = list.id === 'fixed-costs-list' ? 'fixed' : 'variable'; updateCostType(costId, newType); } }); });
    currencySelector.addEventListener('change', (e) => { currentCurrency = e.target.value; renderCosts(); });
    themeToggleBtn.addEventListener('click', () => { const newTheme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; applyTheme(newTheme); });
    document.body.addEventListener('click', (e) => { const deleteButton = e.target.closest('.delete-btn'); if (deleteButton) { const costId = deleteButton.dataset.id; if (confirm('Are you sure you want to delete this item?')) deleteCost(costId); } });

    const initializeApp = async () => {
        applyTheme(localStorage.getItem('theme') || 'light');
        updateDatePickerButtonText();
        await fetchMonthlySummary();
        await fetchAndRenderCosts();
    };
    initializeApp();
});