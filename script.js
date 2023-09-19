// Code for textarea auto-resizing
document.addEventListener('input', function (e) {
    if (e.target.tagName.toLowerCase() === 'textarea') {
        autoFitContent(e.target);
    }
});

function autoFitContent(textarea) {
    textarea.style.height = 'auto';  // Reset the height
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

document.querySelectorAll('textarea').forEach(function (textarea) {
    autoFitContent(textarea);
});

// Your new code starts here
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('upload-form');
    const mainFileInput = document.getElementById('main-file');
    const newValueInput = document.getElementById('new-value');
    const rowTitleInput = document.getElementById('row-title');
    const columnTitleInput = document.getElementById('column-title');
    const progressBarFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    const downloadLink = document.getElementById('download-link');

    let parsedCSV = [];
    let changes = [];

    function removeSpacesAndAlphabets(inputStr) {
        return inputStr.replace(/[\sA-Za-z]+/g, '');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = mainFileInput.files[0];
        if (file) {
            Papa.parse(file, {
                encoding: "utf-8",  // Specify UTF-8 encoding here
                complete: function(results) {
                    parsedCSV = results.data;
                    modifyCSV();
                    displayChangesInTable();
                },
                error: function(error) {
                    alert('Error parsing CSV: ' + error.message);
                }
            });
        }
    });

    function modifyCSV() {
        const rowTitles = rowTitleInput.value.split(',').map(title => removeSpacesAndAlphabets(title.trim()));
        const columnTitles = columnTitleInput.value.split(',').map(title => removeSpacesAndAlphabets(title.trim()));
        const newValue = newValueInput.value;

        const columnIndices = columnTitles.map(title => parsedCSV[0].indexOf(title)).filter(index => index !== -1);

        if (columnIndices.length !== columnTitles.length) {
            alert('One or more column titles not found');
            return;
        }

        const rowIndices = [];
        rowTitles.forEach(rowTitle => {
            for (let i = 0; i < parsedCSV.length; i++) {
                if (parsedCSV[i][0] === rowTitle) {
                    rowIndices.push(i);
                    break;
                }
            }
        });

        if (rowIndices.length !== rowTitles.length) {
            alert('One or more row titles not found');
            return;
        }

        rowIndices.forEach(rowIndex => {
            columnIndices.forEach(columnIndex => {
                changes.push({
                    rowTitle: parsedCSV[rowIndex][0],
                    columnTitle: parsedCSV[0][columnIndex],
                    oldValue: parsedCSV[rowIndex][columnIndex],
                    newValue: newValue
                });
                parsedCSV[rowIndex][columnIndex] = newValue;
            });
        });

        updateProgressBar(100);

        const csvString = Papa.unparse(parsedCSV);
        const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });  // Add BOM for UTF-8
        const url = URL.createObjectURL(blob);

        downloadLink.href = url;
        downloadLink.download = 'updated.csv';
    }

    function updateProgressBar(percentage) {
        progressBarFill.style.width = `${percentage}%`;
        progressPercentage.textContent = `${percentage}%`;
    }


    function displayChangesInTable() {
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');
    
        ['Tier code', 'Frequency range (MHz)', 'Previous Holder', 'New Holder'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
    
        thead.appendChild(headerRow);
        table.appendChild(thead);
    
        const tierGroups = {}; // For grouping rows by Tier code
        let totalCount = 0; // Initialize total count
    
        changes.forEach(change => {
            const tr = document.createElement('tr');
            tr.style.display = 'none'; // Hide rows by default
    
            [change.rowTitle, change.columnTitle, change.oldValue, change.newValue].forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                tr.appendChild(td);
            });
    
            totalCount++; // Increment the total count for every change
    
            if (!tierGroups[change.rowTitle]) {
                tierGroups[change.rowTitle] = {
                    rows: [],
                    count: 0
                };
            }
            
            tierGroups[change.rowTitle].count++;
            tierGroups[change.rowTitle].rows.push(tr);
        });
    
        Object.entries(tierGroups).forEach(([tierCode, groupData]) => {
            const toggleButtonRow = document.createElement('tr');
            const toggleButtonCell = document.createElement('td');
            toggleButtonCell.colSpan = 4;
    
            const toggleButton = document.createElement('button');
            toggleButton.textContent = `${tierCode}`;
            toggleButton.addEventListener('click', () => {
                groupData.rows.forEach(row => {
                    if (row.style.display === 'none') {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
    
            toggleButtonCell.appendChild(toggleButton);
            toggleButtonRow.appendChild(toggleButtonCell);
            tbody.appendChild(toggleButtonRow);
    
            const tierCountRow = document.createElement('tr');
            tierCountRow.innerHTML = `
                <td colspan="3">${tierCode} Count</td>
                <td>${groupData.count}</td>
            `;
            
            groupData.rows.forEach(row => tbody.appendChild(row));
            tbody.appendChild(tierCountRow);
        });
    
        // Add total count to the table at the end
        const totalCountRow = document.createElement('tr');
        totalCountRow.innerHTML = `
            <td colspan="3">Total Count</td>
            <td>${totalCount}</td>
        `;
        tbody.appendChild(totalCountRow); // Append the total count row to the tbody

        table.appendChild(tbody);    
        const changesTableDiv = document.getElementById('changes-table');
        if (changesTableDiv.firstChild) {
            changesTableDiv.removeChild(changesTableDiv.firstChild);
        }
        changesTableDiv.appendChild(table);
    }
    
    document.getElementById('reset-btn').addEventListener('click', () => {
        mainFileInput.value = '';
        newValueInput.value = '';
        rowTitleInput.value = '';
        columnTitleInput.value = '';
        updateProgressBar(0);
        
        // Clear table content
        const changesTableDiv = document.getElementById('changes-table');
        if (changesTableDiv.firstChild) {
            changesTableDiv.removeChild(changesTableDiv.firstChild);
        }
    });
});