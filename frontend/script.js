// frontend/script.js
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
    const savingsGoalInput = document.getElementById('savings-goal-input');
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
    const analyzeDataBtn = document.getElementById('analyze-data-btn');
    const analysisModal = document.getElementById('analysis-modal');
    const analysisTitle = document.getElementById('analysis-title');
    const analysisModalCloseBtn = document.getElementById('analysis-modal-close-btn');
    const analysisChooserModal = document.getElementById('analysis-chooser-modal');
    const analysisChooserCloseBtn = document.getElementById('analysis-chooser-close-btn');
    const analysisOptionsGrid = document.querySelector('.analysis-options-grid');
    const analysisChartElement = document.getElementById('analysis-chart');
    const chartNoDataMessage = document.getElementById('chart-no-data-message');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatLoader = document.getElementById('chat-loader');
    const chatRecordBtn = document.getElementById('chat-record-btn');
    const visualizerCanvas = document.getElementById('visualizer');
    const visualizerCtx = visualizerCanvas.getContext('2d');
    const importFileBtn = document.getElementById('import-file-btn');
    const fileUploadInput = document.getElementById('file-upload-input');

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
    let analysisChartInstance = null;
    let lastChartData = null;
    let lastChartTitle = null;
    let mediaRecorder;
    let isRecording = false;
    let audioChunks = [];
    let audioContext;
    let analyser;
    let visualizerFrameId;
    let dataArray;
    let bufferLength;

    // --- Utility Functions ---
    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currentCurrency, minimumFractionDigits: 2 }).format(amount);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // --- API Functions ---
    const fetchAPI = async (url, options = {}) => {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
                throw new Error(errorData.error || `Network response was not ok: ${response.statusText}`);
            }
            if (response.status === 204) return null;
            return response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    };

    const fetchBudget = (year, month) => fetchAPI(`${API_URL}/budget/${year}/${month}`);

    const saveBudget = async () => {
        saveBudgetBtn.disabled = true;
        const budgetData = {
            salary: parseFloat(salaryInput.value) || 0,
            savings_goal: parseFloat(savingsGoalInput.value) || 0,
            fixed_percent: parseInt(fixedBudgetSlider.value),
            variable_percent: parseInt(variableBudgetSlider.value)
        };

        try {
            await fetchAPI(`${API_URL}/budget/${selectedYear}/${selectedMonth}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(budgetData),
            });

            saveBudgetBtn.classList.remove('is-error');
            saveBudgetBtn.classList.add('is-success');
            saveBudgetBtn.querySelector('span').textContent = 'Saved!';
        } catch (error) {
            console.error("Failed to save budget:", error);
            saveBudgetBtn.classList.remove('is-success');
            saveBudgetBtn.classList.add('is-error');
            saveBudgetBtn.querySelector('span').textContent = 'Failed!';
        } finally {
            setTimeout(() => {
                saveBudgetBtn.classList.remove('is-success', 'is-error');
                saveBudgetBtn.querySelector('span').textContent = 'Save Budget';
                saveBudgetBtn.disabled = false;
            }, 2000);
            renderCosts();
        }
    };

    const fetchMonthlySummary = () => fetchAPI(`${API_URL}/summary`).then(data => { monthlySummary = data; });
    const fetchIncomeHistory = () => fetchAPI('/api/budgets/history');
    const fetchCostsHistory = () => fetchAPI('/api/costs/history');

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
        if (!name) { expenseNameInput.classList.add('shake'); isValid = false; }
        if (!amount) { expenseAmountInput.classList.add('shake'); isValid = false; }

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

    const recognizeFile = async (file) => {
        const formData = new FormData();
        formData.append('document_file', file);

        addChatMessage("Analyzing your document, please wait...", "bot");
        chatLoader.classList.remove('hidden');

        try {
            const response = await fetch('/api/recognize', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'File recognition failed');
            }

            const data = await response.json();
            handleRecognitionResponse(data);

        } catch (error) {
            console.error("Recognition API error:", error);
            addChatMessage("Sorry, I had trouble processing that file. Please try again.", "bot");
        } finally {
            chatLoader.classList.add('hidden');
        }
    };

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
            return `<div class="cost-item-main" draggable="true"><div class="custom-checkbox"><input type="checkbox" class="cost-checkbox" id="${checkboxId}" ${isChecked ? 'checked' : ''}><label for="${checkboxId}" class="visual">${checkIcon}</label></div><div class="cost-details"><div class="view-mode"><div class="cost-main-info"><span class="cost-name">${cost.name}</span><span class="cost-amount">${formatCurrency(cost.amount)}</span></div>${descriptionHTML}</div><div class="edit-mode"><div class="edit-name-amount"><input type="text" class="edit-name" value="${cost.name}" required><input type="number" class="edit-amount" value="${cost.amount}" min="0.01" step="0.01" required></div><textarea class="edit-description" rows="2" placeholder="Description...">${descriptionText}</textarea></div></div></div><div class="item-actions"><button class="edit-btn" aria-label="Edit"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"></path></svg></button><button class="delete-btn" aria-label="Delete"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></button><button class="save-btn" aria-label="Save"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></button></div>`;
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
        const defaults = { salary: 0, savings_goal: 0, fixed_percent: 40, variable_percent: 30 };
        const data = { ...defaults, ...budgetData };

        salaryInput.value = data.salary > 0 ? data.salary : '';
        savingsGoalInput.value = data.savings_goal > 0 ? data.savings_goal : '';
        fixedBudgetSlider.value = data.fixed_percent;
        variableBudgetSlider.value = data.variable_percent;
        fixedPercentDisplay.textContent = data.fixed_percent;
        variablePercentDisplay.textContent = data.variable_percent;
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

    const updateSlidersFromSavings = () => {
        const salary = parseFloat(salaryInput.value) || 0;
        const savings = parseFloat(savingsGoalInput.value) || 0;
        if (salary === 0) return;
        const spendableAmount = Math.max(0, salary - savings);
        const spendablePercent = Math.round((spendableAmount / salary) * 100);
        const halfSpendPercent = Math.floor(spendablePercent / 2);
        fixedBudgetSlider.value = halfSpendPercent;
        variableBudgetSlider.value = spendablePercent - halfSpendPercent;
        fixedPercentDisplay.textContent = fixedBudgetSlider.value;
        variablePercentDisplay.textContent = variableBudgetSlider.value;
        renderCosts();
    };

    const handleSliderAdjustment = (e) => {
        const salary = parseFloat(salaryInput.value) || 0;
        const savings = parseFloat(savingsGoalInput.value) || 0;

        if (salary === 0) {
            fixedPercentDisplay.textContent = fixedBudgetSlider.value;
            variablePercentDisplay.textContent = variableBudgetSlider.value;
            renderCosts();
            return;
        }

        const spendableAmount = Math.max(0, salary - savings);
        const maxCombinedPercent = Math.round((spendableAmount / salary) * 100);
        const changedSlider = e.target;
        const otherSlider = (changedSlider === fixedBudgetSlider) ? variableBudgetSlider : fixedBudgetSlider;
        let changedValue = parseInt(changedSlider.value);
        let otherValue = maxCombinedPercent - changedValue;
        if (otherValue < 0) {
            changedSlider.value = maxCombinedPercent;
            otherSlider.value = 0;
        } else {
            otherSlider.value = otherValue;
        }
        fixedPercentDisplay.textContent = fixedBudgetSlider.value;
        variablePercentDisplay.textContent = variableBudgetSlider.value;
        renderCosts();
    };

    const processHistoryData = (incomeHistory, costsHistory, chartType) => {
        const allEntries = [
            ...incomeHistory.map(i => ({ year: i.year, month: i.month })),
            ...(costsHistory || []).map(c => ({ year: parseInt(c.year), month: parseInt(c.month) }))
        ];
        if (allEntries.length === 0) return null;
        allEntries.sort((a, b) => a.year - b.year || a.month - b.month);
        const firstEntry = allEntries[0];
        const lastEntry = allEntries[allEntries.length - 1];
        const incomeMap = new Map(incomeHistory.map(item => [`${item.year}-${item.month}`, item.salary]));
        const costsMap = new Map();
        if (costsHistory) {
            costsHistory.forEach(item => {
                const key = `${item.year}-${parseInt(item.month, 10)}`;
                if (!costsMap.has(key)) costsMap.set(key, {});
                costsMap.get(key)[item.cost_type] = item.total;
            });
        }
        let currentDate = new Date(firstEntry.year, firstEntry.month - 1);
        const lastDate = new Date(lastEntry.year, lastEntry.month - 1);
        const labels = [];
        const data = [];
        while (currentDate <= lastDate) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const key = `${year}-${month}`;
            labels.push(`${shortMonthNames[month - 1]} ${String(year).slice(-2)}`);
            const monthlyCosts = costsMap.get(key) || {};
            switch(chartType) {
                case 'income': data.push(incomeMap.get(key) || 0); break;
                case 'fixed': data.push(monthlyCosts.fixed || 0); break;
                case 'variable': data.push(monthlyCosts.variable || 0); break;
                case 'overall': data.push((monthlyCosts.fixed || 0) + (monthlyCosts.variable || 0)); break;
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        const processedData = { labels, data };
        lastChartData = processedData;
        return processedData;
    };

    const renderChart = (processedData, chartTitle) => {
        if (analysisChartInstance) {
            analysisChartInstance.destroy();
        }
        analysisTitle.textContent = chartTitle;
        lastChartTitle = chartTitle;

        if (!processedData || processedData.data.every(d => d === 0)) {
            chartNoDataMessage.textContent = `No data available for "${chartTitle}".`;
            chartNoDataMessage.style.display = 'block';
            analysisChartElement.style.display = 'none';
            return;
        }

        chartNoDataMessage.style.display = 'none';
        analysisChartElement.style.display = 'block';

        const currentCtx = analysisChartElement.getContext('2d');
        const bodyStyles = getComputedStyle(document.body);
        const gridColor = bodyStyles.getPropertyValue('--border').trim();
        const labelColor = bodyStyles.getPropertyValue('--text-secondary').trim();
        const textColor = bodyStyles.getPropertyValue('--text-primary').trim();
        const surfaceColor = bodyStyles.getPropertyValue('--surface').trim();

        analysisChartInstance = new Chart(currentCtx, {
            type: 'line',
            data: {
                labels: processedData.labels,
                datasets: [{
                    label: chartTitle,
                    data: processedData.data,
                    borderColor: '#2A65F7',
                    backgroundColor: function(context) {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea || chartArea.bottom <= chartArea.top) return null;
                        try {
                            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            gradient.addColorStop(0, 'rgba(42, 101, 247, 0.4)');
                            gradient.addColorStop(1, 'rgba(42, 101, 247, 0)');
                            return gradient;
                        } catch (error) { return 'rgba(42, 101, 247, 0.2)'; }
                    },
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#2A65F7',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBorderColor: surfaceColor,
                    pointBorderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: surfaceColor, titleColor: textColor, bodyColor: textColor,
                        borderColor: gridColor, borderWidth: 1, padding: 10, displayColors: false,
                        callbacks: { label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}` }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: labelColor, callback: (value) => formatCurrency(value) },
                        grid: { color: gridColor }
                    },
                    x: { ticks: { color: labelColor }, grid: { display: false } }
                }
            }
        });
    };

    const generateAndShowChart = async (chartType) => {
        closeModal(analysisChooserModal);
        analysisTitle.textContent = 'Loading Chart Data...';
        openModal(analysisModal);
        const [incomeHistory, costsHistory] = await Promise.all([ fetchIncomeHistory(), fetchCostsHistory() ]);
        const chartTitles = {
            income: 'Income History', fixed: 'Fixed Costs History',
            variable: 'Variable Costs History', overall: 'Overall Costs History'
        };
        const processedData = processHistoryData(incomeHistory, costsHistory, chartType);
        renderChart(processedData, chartTitles[chartType]);
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

    themeToggleBtn.addEventListener('click', () => {
        const newTheme = body.getAttribute('data-theme') === 'dark' ? 'neutral' : 'dark';
        applyTheme(newTheme);
        if (!analysisModal.classList.contains('hidden') && lastChartData) {
            renderChart(lastChartData, lastChartTitle);
        }
    });

    salaryInput.addEventListener('input', updateSlidersFromSavings);
    savingsGoalInput.addEventListener('input', updateSlidersFromSavings);
    [fixedBudgetSlider, variableBudgetSlider].forEach(slider => slider.addEventListener('input', handleSliderAdjustment));
    saveBudgetBtn.addEventListener('click', saveBudget);

    analyzeDataBtn.addEventListener('click', () => openModal(analysisChooserModal));
    analysisChooserCloseBtn.addEventListener('click', () => closeModal(analysisChooserModal));
    document.getElementById('analysis-chooser-overlay').addEventListener('click', () => closeModal(analysisChooserModal));
    analysisOptionsGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('analysis-option-btn')) {
            const chartType = e.target.dataset.chartType;
            generateAndShowChart(chartType);
        }
    });

    analysisModalCloseBtn.addEventListener('click', () => closeModal(analysisModal));
    document.getElementById('analysis-modal-overlay').addEventListener('click', () => closeModal(analysisModal));

    if(importFileBtn) { importFileBtn.addEventListener('click', () => { fileUploadInput.click(); }); }
    if(fileUploadInput) {
        fileUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) { recognizeFile(file); }
            e.target.value = null;
        });
    }

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

        if (target.classList.contains('cost-checkbox') || target.closest('.custom-checkbox')) {
            const checkbox = listItem.querySelector('.cost-checkbox');
            const costId = listItem.dataset.id;
            const isChecked = checkbox.checked;
            listItem.classList.toggle('is-checked', isChecked);
            await updateCheckedStatus(costId, isChecked);
            return;
        }

        const actionButton = target.closest('.item-actions button');
        if (!actionButton) return;
        const costId = listItem.dataset.id;
        if (actionButton.classList.contains('edit-btn')) { enterEditMode(listItem); }
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

    // --- Chat Logic ---
    const addChatMessage = (htmlContent, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${sender}-message`);

        let formattedHtml = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedHtml = formattedHtml.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formattedHtml = formattedHtml.replace(/\n/g, '<br>');

        const analyzingMsg = chatMessages.querySelector('.bot-message:last-child');
        if (analyzingMsg && analyzingMsg.textContent.startsWith("Analyzing your document")) {
            analyzingMsg.remove();
        }

        messageElement.innerHTML = formattedHtml;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const addConfirmationMessage = (message, pendingActions) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', 'bot-message');

        let formattedHtml = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedHtml = formattedHtml.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formattedHtml = formattedHtml.replace(/\n/g, '<br>');

        const actionsHtml = `
            <div class="chat-actions"
                 data-tool-name='${pendingActions.tool_name}'
                 data-expenses='${JSON.stringify(pendingActions.tool_args)}'>
                <button class="chat-action-btn chat-confirm-btn">Confirm</button>
                <button class="chat-action-btn chat-cancel-btn">Cancel</button>
            </div>
        `;

        messageElement.innerHTML = formattedHtml + actionsHtml;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleRecognitionResponse = (response) => {
        if (response.pending_actions && response.pending_actions.tool_args && response.pending_actions.tool_args.length > 0) {
            addConfirmationMessage(response.reply, response.pending_actions);
        } else {
            addChatMessage(response.reply, 'bot');
        }
    };

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        addChatMessage(message, 'user');
        chatInput.value = '';
        chatLoader.classList.remove('hidden');
        chatInput.disabled = true;

        try {
            const response = await fetchAPI('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    year: selectedYear,
                    month: selectedMonth
                })
            });
            if (response.pending_actions) {
                addConfirmationMessage(response.reply, response.pending_actions);
            } else {
                addChatMessage(response.reply, 'bot');
            }
        } catch (error) {
            addChatMessage("Sorry, I'm having trouble connecting to my brain right now. Please try again later.", 'bot');
        } finally {
            chatLoader.classList.add('hidden');
            chatInput.disabled = false;
            chatInput.focus();
        }
    });

    chatMessages.addEventListener('click', async (e) => {
        const confirmBtn = e.target.closest('.chat-confirm-btn');
        const cancelBtn = e.target.closest('.chat-cancel-btn');
        const actionsContainer = e.target.closest('.chat-actions');
        if (!actionsContainer) return;

        if (confirmBtn) {
            const toolName = actionsContainer.dataset.toolName;
            const toolArgs = JSON.parse(actionsContainer.dataset.expenses);

            if (toolName === 'create_expenses') {
                const dateForNewExpenses = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01T12:00:00`;
                const costsToImport = toolArgs.map(cost => ({
                    ...cost,
                    description: cost.description || null,
                    date: dateForNewExpenses
                }));
                await batchAddCosts(costsToImport);
                addChatMessage("Done! I've added those expenses for you.", 'bot');
            } else if (toolName === 'edit_expense') {
                const expenseToEdit = allCosts.find(c => c.name.toLowerCase() === toolArgs.original_name.toLowerCase());
                if (expenseToEdit) {
                    const updatePayload = {
                        name: toolArgs.new_name || expenseToEdit.name,
                        amount: toolArgs.new_amount || expenseToEdit.amount,
                        cost_type: toolArgs.new_type || expenseToEdit.cost_type,
                        description: toolArgs.new_description !== undefined ? toolArgs.new_description : expenseToEdit.description,
                    };
                    await updateCost(expenseToEdit.id, updatePayload);
                    addChatMessage("Great, I've updated that expense for you.", 'bot');
                } else {
                    addChatMessage(`Sorry, I couldn't find an expense named '${toolArgs.original_name}' to edit.`, 'bot');
                }
            }
        }
        if (cancelBtn) { addChatMessage("Okay, I've cancelled the request.", 'bot'); }
        actionsContainer.remove();
    });

    // --- Audio Visualizer and Recording Logic ---
    const drawVisualizer = () => {
        if (!isRecording) return;
        visualizerFrameId = requestAnimationFrame(drawVisualizer);
        analyser.getByteTimeDomainData(dataArray);
        visualizerCtx.fillStyle = 'rgba(0, 0, 0, 0)';
        visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        visualizerCtx.lineWidth = 2;
        visualizerCtx.strokeStyle = getComputedStyle(body).getPropertyValue('--accent').trim();
        visualizerCtx.beginPath();
        const sliceWidth = visualizerCanvas.width * 1.0 / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * visualizerCanvas.height / 2;
            if (i === 0) { visualizerCtx.moveTo(x, y); } else { visualizerCtx.lineTo(x, y); }
            x += sliceWidth;
        }
        visualizerCtx.lineTo(visualizerCanvas.width, visualizerCanvas.height / 2);
        visualizerCtx.stroke();
    };

    const handleRecording = async () => {
        if (isRecording) {
            mediaRecorder.stop();
            isRecording = false;
            cancelAnimationFrame(visualizerFrameId);
            chatForm.classList.remove('recording');
            chatRecordBtn.classList.remove('recording');
            audioContext.close();
            chatInput.placeholder = "Transcribing...";
            chatInput.disabled = true;
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                isRecording = true;
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                mediaRecorder.addEventListener("dataavailable", event => { audioChunks.push(event.data); });
                mediaRecorder.start();
                audioContext = new AudioContext();
                const source = audioContext.createMediaStreamSource(stream);
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;
                bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);
                source.connect(analyser);
                chatForm.classList.add('recording');
                chatRecordBtn.classList.add('recording');
                chatInput.placeholder = "Recording... Click again to stop.";
                drawVisualizer();
                mediaRecorder.addEventListener("stop", async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const formData = new FormData();
                    formData.append('audio_file', audioBlob, 'recording.webm');
                    try {
                        const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Transcription failed');
                        }
                        const data = await response.json();
                        chatInput.value = data.transcript;
                    } catch (error) {
                        console.error("Transcription error:", error);
                        addChatMessage(`Sorry, I couldn't understand that. Please try again.`, 'bot');
                    } finally {
                        chatInput.placeholder = "Ask or start recording...";
                        chatInput.disabled = false;
                        chatInput.focus();
                        stream.getTracks().forEach(track => track.stop());
                    }
                });
            } catch (err) {
                console.error("Error accessing microphone:", err);
                addChatMessage("I need microphone access to hear you. Please enable it in your browser settings.", 'bot');
                isRecording = false;
            }
        }
    };

    chatRecordBtn.addEventListener('click', handleRecording);

    // --- Initial Load ---
    const initializeApp = async () => {
        applyTheme(localStorage.getItem('theme') || 'neutral');
        updateDatePickerButtonText();
        chatLoader.classList.add('hidden');
        try {
            await fetchMonthlySummary();
            const budgetData = await fetchBudget(selectedYear, selectedMonth);
            await fetchAndRenderCosts();
            updateBudgetUI(budgetData);
            const welcomeMessage = `Welcome to Momentum! Here's how to get started:
            \n- **Set Your Budget**: Use the 'Monthly Budget' card to set your income and savings goals.
            - **Log Expenses**: Add costs manually, or just tell me, like *"add $15 for lunch and $4.50 for coffee"*.
            - **Use Your Voice**: Click the microphone to record commands.
            - **Scan a Receipt**: Use the 'Import from File' button to have me scan a document for expenses.
            \nHow can I help you get started?`;
            addChatMessage(welcomeMessage, 'bot');
            setTimeout(() => body.classList.remove('loading'), 300);
        } catch (error) {
            console.error("Failed to initialize app:", error);
            body.classList.remove('loading');
        }
    };

    initializeApp();
});