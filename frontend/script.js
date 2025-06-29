// frontend/script.js

document.addEventListener('DOMContentLoaded', () => {

    // DOM Element Selections
    const fixedCostsList = document.getElementById('fixed-costs-list'), variableCostsList = document.getElementById('variable-costs-list'), addExpenseBtn = document.getElementById('add-expense-btn'), expenseNameInput = document.getElementById('expense-name-input'), expenseAmountInput = document.getElementById('expense-amount-input'), clearFixedBtn = document.getElementById('clear-fixed-btn'), clearVariableBtn = document.getElementById('clear-variable-btn'), totalFixedEl = document.getElementById('total-fixed'), totalVariableEl = document.getElementById('total-variable'), grandTotalEl = document.getElementById('grand-total'), currencySelector = document.getElementById('currency-selector'), themeToggleBtn = document.getElementById('theme-toggle-btn'), body = document.body, yearSelector = document.getElementById('year-selector'), monthSelector = document.getElementById('month-selector');
    
    // SVG Icons
    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

    // State
    let currentCurrency = currencySelector.value, allCosts = [];
    const API_URL = '/api/costs';

    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currentCurrency }).format(amount);

    // API Communication
    const fetchAndRenderCosts = async () => {
        const year = yearSelector.value, month = monthSelector.value;
        if (!year || !month) return;
        try {
            const url = new URL(API_URL, window.location.origin);
            url.searchParams.append('year', year);
            url.searchParams.append('month', month);
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            allCosts = await response.json();
            renderCosts();
        } catch (error) { console.error('Failed to fetch costs:', error); }
    };

    // --- MODIFIED: The addCost function now resets the view to the current month ---
    const addCost = async (name, amount, type) => {
        if (!name || !amount) {
            alert('Please enter both name and amount.');
            return;
        }
        try {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, amount, type }),
            });
            expenseNameInput.value = '';
            expenseAmountInput.value = '';
            expenseNameInput.focus();

            // BUG FIX: Set date selectors to the current month/year before fetching
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

            // Update selectors and repopulate months if year changed
            if (yearSelector.value != currentYear) {
                yearSelector.value = currentYear;
                populateMonths(currentYear);
            }
            monthSelector.value = currentMonth;
            
            await fetchAndRenderCosts();
        } catch (error) {
            console.error('Error adding cost:', error);
        }
    };
    
    const deleteCost = async (costId) => { try { await fetch(`${API_URL}/${costId}`, { method: 'DELETE' }); await fetchAndRenderCosts(); } catch (error) { console.error(`Error deleting cost ${costId}:`, error); } };
    
    const clearCosts = async (costType) => {
        const year = yearSelector.value, month = monthSelector.value;
        try {
            const url = new URL(`${API_URL}/clear/${costType}`, window.location.origin);
            url.searchParams.append('year', year);
            url.searchParams.append('month', month);
            await fetch(url, { method: 'DELETE' });
            await fetchAndRenderCosts();
        } catch (error) { console.error(`Error clearing ${costType} costs:`, error); }
    };

    const updateCostType = async (costId, newType) => { try { await fetch(`${API_URL}/${costId}/type`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: newType }), }); await fetchAndRenderCosts(); } catch (error) { console.error(`Error updating cost ${costId}:`, error); } };

    // Rendering Logic (unchanged)
    const renderCosts = () => { fixedCostsList.innerHTML = ''; variableCostsList.innerHTML = ''; let totalFixed = 0; let totalVariable = 0; allCosts.forEach(cost => { const listItem = document.createElement('li'); listItem.setAttribute('draggable', 'true'); listItem.dataset.id = cost.id; listItem.innerHTML = `<div class="cost-details"><span class="cost-name">${cost.name}</span><span class="cost-amount">${formatCurrency(cost.amount)}</span></div><button class="delete-btn" data-id="${cost.id}" aria-label="Delete item"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>`; if (cost.cost_type === 'fixed') { fixedCostsList.appendChild(listItem); totalFixed += cost.amount; } else if (cost.cost_type === 'variable') { variableCostsList.appendChild(listItem); totalVariable += cost.amount; } }); totalFixedEl.textContent = `Fixed: ${formatCurrency(totalFixed)}`; totalVariableEl.textContent = `Variable: ${formatCurrency(totalVariable)}`; grandTotalEl.textContent = `Grand Total: ${formatCurrency(totalFixed + totalVariable)}`; };
    
    // Theme Management (unchanged)
    const applyTheme = (theme) => { body.setAttribute('data-theme', theme); themeToggleBtn.innerHTML = theme === 'dark' ? sunIcon : moonIcon; localStorage.setItem('theme', theme); };

    // Date Selector Logic (helper function needs to be accessible for the fix)
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const populateMonths = (selectedYear) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        let lastSelectedMonth = monthSelector.value;
        monthSelector.innerHTML = '';
        const endMonth = (selectedYear === currentYear) ? currentMonth : 11;
        
        for (let i = 0; i <= endMonth; i++) {
            const option = document.createElement('option');
            const monthValue = String(i + 1).padStart(2, '0');
            option.value = monthValue;
            option.textContent = monthNames[i];
            monthSelector.appendChild(option);
        }

        // Try to re-select the previously selected month if it exists in the new list
        if (Array.from(monthSelector.options).some(opt => opt.value === lastSelectedMonth)) {
             monthSelector.value = lastSelectedMonth;
        }
    };

    const initDateSelectors = () => {
        const now = new Date(), currentYear = now.getFullYear(), minYear = 2025;
        for (let y = currentYear; y >= minYear; y--) {
            const option = document.createElement('option');
            option.value = y;
            option.textContent = y;
            yearSelector.appendChild(option);
        }
        yearSelector.value = currentYear;
        populateMonths(currentYear);
        monthSelector.value = String(now.getMonth() + 1).padStart(2, '0');
    };

    // Event Listeners
    addExpenseBtn.addEventListener('click', () => { const selectedType = document.querySelector('input[name="expense-type"]:checked').value; addCost(expenseNameInput.value, expenseAmountInput.value, selectedType); });
    expenseAmountInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addExpenseBtn.click() });
    currencySelector.addEventListener('change', (e) => { currentCurrency = e.target.value; renderCosts() });
    themeToggleBtn.addEventListener('click', () => { const newTheme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; applyTheme(newTheme) });
    yearSelector.addEventListener('change', () => { populateMonths(parseInt(yearSelector.value)); fetchAndRenderCosts(); });
    monthSelector.addEventListener('change', fetchAndRenderCosts);
    clearFixedBtn.addEventListener('click', () => { const monthName = monthSelector.options[monthSelector.selectedIndex].text, year = yearSelector.value; if (confirm(`Are you sure you want to delete all FIXED costs for ${monthName} ${year}?`)) { clearCosts('fixed'); } });
    clearVariableBtn.addEventListener('click', () => { const monthName = monthSelector.options[monthSelector.selectedIndex].text, year = yearSelector.value; if (confirm(`Are you sure you want to delete all VARIABLE costs for ${monthName} ${year}?`)) { clearCosts('variable'); } });
    document.body.addEventListener('click', (e) => { const deleteButton = e.target.closest('.delete-btn'); if (deleteButton) { const costId = deleteButton.dataset.id; if (confirm('Are you sure you want to delete this item?')) deleteCost(costId); } });
    let draggedItem = null;
    document.addEventListener('dragstart', (e) => { if (e.target.matches('.costs-list li')) { draggedItem = e.target; setTimeout(() => e.target.classList.add('dragging'), 0); } });
    document.addEventListener('dragend', () => { if (draggedItem) { draggedItem.classList.remove('dragging'); draggedItem = null; } });
    [fixedCostsList, variableCostsList].forEach(list => { list.addEventListener('dragover', (e) => { e.preventDefault(); list.classList.add('drag-over'); }); list.addEventListener('dragleave', () => list.classList.remove('drag-over')); list.addEventListener('drop', (e) => { e.preventDefault(); list.classList.remove('drag-over'); if (draggedItem && draggedItem.parentElement !== list) { const costId = draggedItem.dataset.id; const newType = list.id === 'fixed-costs-list' ? 'fixed' : 'variable'; updateCostType(costId, newType); } }); });

    // Initial Load
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    initDateSelectors();
    fetchAndRenderCosts();
});