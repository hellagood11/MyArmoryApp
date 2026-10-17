//function to handle escaping HTML special characters
function escapeHtml(str) {
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

//handle form submission
function handleFeedbackSubmit(event) {
    event.preventDefault();

    //get the values from the form
    const nameInput = document.getElementById('reviewerName');
    const ratingInput = document.getElementById('reviewRating');
    const commentsInput = document.getElementById('reviewerComments');

    const name = nameInput.value.trim(); // trim name so there is no whitespace
    const ratingValue = Number(ratingInput.value); // convert rating to integer
    const comments = commentsInput.value.trim(); // trim comments so there is no whitespace


    //validate input and warn if some fields are not filled out
    if (!name || !Number.isInteger(ratingValue) ||
        ratingValue < 1 || ratingValue > 5 || !comments) {
        alert('Enter your name, select a rating from 1 to 5, and provide comments.');
        return;
    }

    const stars = '★'.repeat(ratingValue) + '☆'.repeat(5 - ratingValue); // create star rating string
    // build new review object
    const reviewCard = document.createElement('div');
    reviewCard.className = 'card review-card';
    reviewCard.dataset.rating = String(ratingValue);
    reviewCard.innerHTML = `
        <div class="review-header">
            <strong>${escapeHtml(name)}</strong>
            <span class="rating">${stars}</span>
        </div>
        <p>${escapeHtml(comments)}</p>
    `;

    //add the card to the list of reviews
    const reviewsList = document.getElementById('reviews-list');
    if (reviewsList) {
        reviewsList.prepend(reviewCard); // add new review to the top of the list
        updateReviewFilter();
    }

    document.getElementById('feedbackForm').reset(); // reset the form after submission

}

function updateReviewFilter() {
    const reviewsList = document.getElementById('reviews-list');
    const ratingFilter = document.getElementById('ratingFilter');
    const reviewCount = document.getElementById('reviewCount');

    if (!reviewsList || !ratingFilter || !reviewCount) return;

    const cards = reviewsList.querySelectorAll('.review-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const matchesRating =
            ratingFilter.value === 'all' ||
            card.dataset.rating === ratingFilter.value;

        card.hidden = !matchesRating;
        if (matchesRating) visibleCount++;
    });

    reviewCount.textContent =
        `Showing ${visibleCount} of ${cards.length} reviews`;
}


document.addEventListener('DOMContentLoaded', () => {
    const inventoryList = document.getElementById('inventoryList');

    // Other pages do not have an inventory list.
    if (!inventoryList) return;

    const searchInput = document.getElementById('inventorySearch');
    const typeFilter = document.getElementById('inventoryTypeFilter');
    const status = document.getElementById('inventoryStatus');
    const notice = document.getElementById('inventoryNotice');
    const inventoryForm = document.getElementById('inventoryForm');
    const addItemDialog = document.getElementById('addItemDialog');
    const openAddItemButton = document.getElementById('openAddItem');
    const closeAddItemButton = document.getElementById('closeAddItem');

    const itemNameInput = document.getElementById('itemName');
    const itemTypeInput = document.getElementById('itemType');
    const itemCaliberInput = document.getElementById('itemCaliber');
    const quantityInput = document.getElementById('itemQuantity');
    const quantityGroup = document.getElementById('quantityGroup');
    const editingItemId = document.getElementById('editingItemId');
    const dialogHeading = document.getElementById('add-item-heading');
    const saveItemButton = document.getElementById('saveItemButton');

    let nextItemId = 1;

    // Give existing HTML cards unique IDs and record their quantities.
    inventoryList.querySelectorAll('.inventory-card').forEach(card => {
        card.dataset.id = `item-${nextItemId++}`;

        const quantityText = [...card.querySelectorAll('p')]
            .find(p => p.textContent.trim().startsWith('Quantity:'));

        card.dataset.quantity = quantityText
            ? quantityText.textContent
                .replace(/^Quantity:\s*/, '')
                .replace(/\s*rounds$/, '')
            : '';
    });

    // Update the quantity field based on the selected item type.
    function updateQuantityField() {
        const isAmmunition = itemTypeInput.value === 'ammunition';

        quantityGroup.hidden = !isAmmunition;
        quantityInput.disabled = !isAmmunition;
        quantityInput.required = isAmmunition;

        if (!isAmmunition) {
            quantityInput.value = '';
        }
    }

    itemTypeInput.addEventListener('change', updateQuantityField);

    // Open the form in Add mode.
    function openAddMode() {
        inventoryForm.reset();
        editingItemId.value = '';

        dialogHeading.textContent = 'Add an Inventory Item';
        saveItemButton.textContent = 'Add to Inventory';

        updateQuantityField();
        status.textContent = '';
    }

    openAddItemButton.addEventListener('click', () => {
        openAddMode();
        addItemDialog.showModal();
    });

    closeAddItemButton.addEventListener('click', () => {
        addItemDialog.close();
    });

    addItemDialog.addEventListener('click', event => {
        if (event.target === addItemDialog) {
            addItemDialog.close();
        }
    });

    // Apply the current search and type filters.
    function filterInventory() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedType = typeFilter.value;
        let visibleCount = 0;

        inventoryList.querySelectorAll('.inventory-card').forEach(card => {
            const matchesText = card.dataset.search.includes(searchTerm);
            const matchesType = selectedType === 'all' ||
                card.dataset.type === selectedType;

            card.hidden = !(matchesText && matchesType);

            if (!card.hidden) visibleCount++;
        });

        status.textContent = `${visibleCount} inventory item(s) shown.`;
    }

    searchInput.addEventListener('input', filterInventory);
    typeFilter.addEventListener('change', filterInventory);

    // Show a notice when the user hovers over a card.
    function addMouseFeedback(card) {
        card.addEventListener('mouseenter', () => {
            const heading = card.querySelector('h3');
            notice.textContent =
                `Viewing inventory entry: ${heading.textContent}`;
        });
    }

    inventoryList.querySelectorAll('.inventory-card')
        .forEach(addMouseFeedback);

    // Create or refresh a card using safe text-based DOM updates.
    function renderCard(card, item) {
        card.dataset.id = item.id;
        card.dataset.type = item.type;
        card.dataset.quantity = item.quantity ?? '';
        card.dataset.search =
            `${item.name} ${item.caliber}`.toLowerCase();

        const heading = document.createElement('h3');
        heading.textContent = item.name;

        const typeText = document.createElement('p');
        typeText.textContent =
            `Type: ${item.type === 'firearm' ? 'Firearm' : 'Ammunition'}`;

        const caliberText = document.createElement('p');
        caliberText.textContent = `Caliber: ${item.caliber}`;

        const elements = [heading, typeText, caliberText];

        // Preserve quantities for existing firearm entries.
        if (item.type === 'ammunition' || item.quantity !== null) {
            const quantityText = document.createElement('p');
            quantityText.textContent = item.type === 'ammunition'
                ? `Quantity: ${item.quantity} rounds`
                : `Quantity: ${item.quantity}`;

            elements.push(quantityText);
        }

        const editButton = document.createElement('button');
        editButton.className = 'cta-btn edit-item-btn';
        editButton.type = 'button';
        editButton.textContent = 'Edit';

        elements.push(editButton);
        card.replaceChildren(...elements);
    }

    // Open the existing dialog in Edit mode for the selected card.
    inventoryList.addEventListener('click', event => {
        const button = event.target.closest('.edit-item-btn');
        if (!button) return;

        const card = button.closest('.inventory-card');
        if (!card) return;

        const paragraphs = [...card.querySelectorAll('p')];

        const caliberText = paragraphs.find(p =>
            p.textContent.startsWith('Caliber:')
        );

        editingItemId.value = card.dataset.id;
        itemNameInput.value = card.querySelector('h3').textContent;
        itemTypeInput.value = card.dataset.type;
        itemCaliberInput.value = caliberText.textContent
            .replace(/^Caliber:\s*/, '');

        updateQuantityField();

        if (itemTypeInput.value === 'ammunition') {
            quantityInput.value = card.dataset.quantity;
        }

        dialogHeading.textContent = 'Edit Inventory Item';
        saveItemButton.textContent = 'Save Changes';
        status.textContent = '';

        addItemDialog.showModal();
    });

    // Handle both adding a new item and editing an existing one.
    inventoryForm.addEventListener('submit', event => {
        event.preventDefault();

        const name = itemNameInput.value.trim();
        const type = itemTypeInput.value;
        const caliber = itemCaliberInput.value.trim();

        const quantity = type === 'ammunition'
            ? Number(quantityInput.value)
            : null;

        if (
            !name ||
            !caliber ||
            (type === 'ammunition' &&
                (!Number.isInteger(quantity) || quantity < 0))
        ) {
            status.textContent = type === 'ammunition'
                ? 'Enter a name, caliber, and whole-number quantity of zero or more.'
                : 'Enter an item name and caliber.';
            return;
        }

        const id = editingItemId.value;
        const isEditing = Boolean(id);

        let card;

        if (isEditing) {
            card = [...inventoryList.querySelectorAll('.inventory-card')]
                .find(existingCard => existingCard.dataset.id === id);

            if (!card) {
                status.textContent =
                    'The item could not be found. Please try again.';
                return;
            }
        } else {
            card = document.createElement('article');
            card.className = 'card inventory-card';
            card.dataset.id = `item-${nextItemId++}`;

            // Set up hover feedback once for the new card.
            addMouseFeedback(card);
        }

        // Preserve the existing firearm quantity if applicable.
        const savedQuantity = type === 'firearm' && isEditing &&
            card.dataset.quantity !== ''
                ? card.dataset.quantity
                : null;

        const item = {
            id: card.dataset.id,
            name,
            type,
            caliber,
            quantity: type === 'ammunition' ? quantity : savedQuantity
        };

        renderCard(card, item);

        if (!isEditing) {
            inventoryList.prepend(card);
        }

        inventoryForm.reset();
        editingItemId.value = '';
        updateQuantityField();
        addItemDialog.close();

        filterInventory();

        status.textContent = isEditing
            ? `${name} was updated successfully.`
            : `${name} was added to your inventory.`;

        notice.textContent = '';
    });

    updateQuantityField();
    filterInventory();

    
});
document.addEventListener('DOMContentLoaded', () => {
    const ratingFilter = document.getElementById('ratingFilter');

    if (!ratingFilter) return;

    ratingFilter.addEventListener('change', updateReviewFilter);

    // Apply the initial filter and update the review count.
    updateReviewFilter();
});
// event listener for the feedback form submission
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('ballisticsForm');
    if (!form) return;
    // Get references to the message, results, and chart container elements
    const message = document.getElementById('ballisticsMessage');
    const results = document.getElementById('ballisticsResults');
    const chartContainer = document.getElementById('graph-output');
    const svgNamespace = 'http://www.w3.org/2000/svg';
    //function to create an SVG element with specified attributes for the bullet drop chart
    function makeSvgElement(name, attributes = {}) {
        const element = document.createElementNS(svgNamespace, name);
        Object.entries(attributes).forEach(([attribute, value]) => {
            element.setAttribute(attribute, String(value));
        });
        return element;
    }
    // function to render the bullet drop chart based on the provided muzzle velocity
    function renderDropChart(velocity) {
        const distances = Array.from({ length: 31 }, (_, index) => index * 10);
        const drops = distances.map(distance => {
            if (distance === 0) return 0;
            const timeOfFlight = (distance * 3) / velocity;
            return -16.087 * (timeOfFlight ** 2) * 12;
        });
        // Check if all calculated drops are finite numbers; if not, throw an error indicating that the velocity is too low to plot a finite trajectory.
        if (!drops.every(Number.isFinite)) {
            throw new RangeError('The entered velocity is too low to plot a finite trajectory.');
        }

        const chart = makeSvgElement('svg', {
            viewBox: '0 0 700 300',
            role: 'img',
            'aria-labelledby': 'drop-chart-title drop-chart-description',
            focusable: 'false'
        });
        // Add a title and description to the SVG 
        const title = makeSvgElement('title', { id: 'drop-chart-title' });
        title.textContent = 'Estimated bullet drop over distance';
        const description = makeSvgElement('desc', { id: 'drop-chart-description' });
        description.textContent =
            `Estimated drop from 0 to 300 yards for a muzzle velocity of ${velocity} feet per second.`;
        chart.append(title, description);
        // Define the plotting area for the chart and calculate the maximum drop value to scale the y-axis appropriately.
        const plot = { left: 62, right: 680, top: 25, bottom: 238 };
        const maximumDrop = Math.max(...drops.map(drop => Math.abs(drop)), 1);
        const pointFor = (distance, drop) => {
            const x = plot.left + (distance / 300) * (plot.right - plot.left);
            const y = plot.top + (Math.abs(drop) / maximumDrop) * (plot.bottom - plot.top);
            return `${x},${y}`;
        };
        // Draw horizontal grid lines and labels for the y-axis at 0, 50%, and 100% of the maximum drop.
        [0, 0.5, 1].forEach(fraction => {
            const y = plot.top + fraction * (plot.bottom - plot.top);
            const grid = makeSvgElement('line', {
                x1: plot.left, y1: y, x2: plot.right, y2: y,
                class: 'chart-grid-line'
            });
            chart.append(grid);
            // Add labels for the y-axis indicating the drop in inches at each grid line.
            const label = makeSvgElement('text', {
                x: plot.left - 10, y: y + 4, 'text-anchor': 'end',
                class: 'chart-label'
            });
            label.textContent = `${(-maximumDrop * fraction).toFixed(0)} in`;
            chart.append(label);
        });
        // Draw vertical grid lines and labels for the x-axis at 0, 100, 200, and 300 yards.
        [0, 100, 200, 300].forEach(distance => {
            const x = plot.left + (distance / 300) * (plot.right - plot.left);
            chart.append(makeSvgElement('line', {
                x1: x, y1: plot.top, x2: x, y2: plot.bottom,
                class: 'chart-grid-line'
            }));
            const label = makeSvgElement('text', {
                x, y: plot.bottom + 22, 'text-anchor': 'middle',
                class: 'chart-label'
            });
            label.textContent = String(distance);
            chart.append(label);
        });
        // Draw the trajectory line representing the bullet drop over distance using a polyline element.
        chart.append(makeSvgElement('polyline', {
            points: distances.map((distance, index) => pointFor(distance, drops[index])).join(' '),
            class: 'trajectory-line'
        }));
        // Add labels for the y-axis and x-axis to indicate the units of measurement.
        const xLabel = makeSvgElement('text', {
            x: (plot.left + plot.right) / 2, y: 292,
            'text-anchor': 'middle', class: 'chart-axis-label'
        });
        xLabel.textContent = 'Distance (yards)';
        chart.append(xLabel);

        chartContainer.replaceChildren(chart);
        createDropTable(distances, drops);
    }

    function createDropTable(distances, drops){
        const tableBody = document.getElementById('drop-table-body');
        tableBody.innerHTML = '';
        distances.forEach((distance, index) => {
            const row = document.createElement('tr');
            const distanceCell = document.createElement('td');
            distanceCell.textContent = distance;
            const dropCell = document.createElement('td');
            dropCell.textContent = drops[index].toFixed(2);
            row.appendChild(distanceCell);
            row.appendChild(dropCell);
            tableBody.appendChild(row);
        });
    }
    // Add an event listener to the ballistics form to handle the submission and perform calculations for energy and momentum based on the input values.
    form.addEventListener('submit', event => {
        event.preventDefault();
        message.textContent = '';
        // Get the bullet weight in grains and muzzle velocity in feet per second from the form inputs, converting them to numbers.
        const grains = Number(form.elements.grains.value);
        const velocity = Number(form.elements.velocity.value);
        if (!Number.isFinite(grains) || grains <= 0 ||
            !Number.isFinite(velocity) || velocity <= 0) {
            message.textContent = 'Enter a bullet weight and muzzle velocity greater than zero.';
            results.hidden = true;
            return;
        }
        // Convert grains to kilograms and feet per second to meters per second for calculations.
        const kilograms = grains / 15432.3584;
        const metersPerSecond = velocity * 0.3048;
        const energyJoules = 0.5 * kilograms * (metersPerSecond ** 2);
        const momentumMetric = kilograms * metersPerSecond;
        const energyFootPounds = (grains * (velocity ** 2)) / 450436;
        const momentumImperial = (grains * velocity) / 225218;
        // Check if the calculated energy and momentum values are finite numbers; if not, display an error message indicating that the values are outside the supported range.
        if (![energyJoules, momentumMetric, energyFootPounds, momentumImperial]
            .every(Number.isFinite)) {
            message.textContent = 'Those values are outside the calculator’s supported range.';
            results.hidden = true;
            return;
        }
        // Attempt to render the bullet drop chart with the provided velocity, handling any RangeError that may occur if the velocity is too low to plot a finite trajectory.
        try {
            renderDropChart(velocity);
        } catch (error) {
            if (!(error instanceof RangeError)) throw error;
            message.textContent = error.message;
            results.hidden = true;
            return;
        }
        // Update the results section with the calculated energy and momentum values, formatted to two decimal places for energy and four decimal places for momentum.
        document.getElementById('energy-imp').textContent = energyFootPounds.toFixed(2);
        document.getElementById('energy-metric').textContent = energyJoules.toFixed(2);
        document.getElementById('momentum-imp').textContent = momentumImperial.toFixed(4);
        document.getElementById('momentum-metric').textContent = momentumMetric.toFixed(4);
        results.hidden = false;
    });
});

const csvFiles = [
    { path: "pistolReloading.csv", source: "Pistol" },
    { path: "rifleReloading.csv", source: "Rifle" }
];


let allRows = [];
let headers = [];
let cartridgeColumn = "";

async function loadReloadingData() {
    const loading = document.getElementById("loading");
    const headerRow = document.getElementById("table-header");
    const tableBody = document.getElementById("table-body");
    const table = document.getElementById("reloading-table");

    try {
        const results = await Promise.all(
            csvFiles.map(file => {
                return new Promise((resolve, reject) => {
                    Papa.parse(file.path, {
                        download: true,
                        header: true,
                        skipEmptyLines: "greedy",

                        complete: result => {
                            if (result.errors.length > 0) {
                                console.warn(
                                    `Parsing issues in ${file.path}:`,
                                    result.errors
                                );
                            }

                            resolve({
                                ...result,
                                source: file.source
                            });
                        },

                        error: error => reject(
                            new Error(`${file.path}: ${error.message}`)
                        )
                    });
                });
            })
        );

        headers = results[0].meta.fields || [];

        if (headers.length === 0) {
            throw new Error("No column headers found.");
        }

        // Check that both files have the same columns.
        const matchingHeaders = results.every(result => {
            const fileHeaders = result.meta.fields || [];

            return headers.length === fileHeaders.length &&
                headers.every(header => fileHeaders.includes(header));
        });

        if (!matchingHeaders) {
            throw new Error(
                "The CSV files have different column headers."
            );
        }

        // Find the cartridge column, ignoring capitalization.
        cartridgeColumn = headers.find(
            header => header.trim().toLowerCase() === "cartridge"
        );

        if (!cartridgeColumn) {
            throw new Error(
                'Could not find a "Cartridge" column in the CSV headers.'
            );
        }

        // Combine rows and attach their source labels.
        allRows = results.flatMap(result =>
            result.data.map(row => ({
                ...row,
                Source: result.source
            }))
        );

        buildTableHeaders();
        populateCartridgeFilter();
        applyFilters();

        table.hidden = false;

    } catch (error) {
        console.error("Error loading reloading data:", error);
        loading.textContent =
            `Unable to load reloading data: ${error.message}`;
        loading.classList.add("error");
        table.hidden = true;
    }
}

function buildTableHeaders() {
    const headerRow = document.getElementById("table-header");
    headerRow.replaceChildren();

    ["Source", ...headers].forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
    });
}

function populateCartridgeFilter() {
    const cartridgeFilter = document.getElementById("cartridge-filter");

    // Get unique, non-empty cartridge names.
    const cartridges = [
        ...new Set(
            allRows
                .map(row => (row[cartridgeColumn] ?? "").trim())
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

    // Rebuild the dropdown.
    cartridgeFilter.replaceChildren();

    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All Cartridges";
    cartridgeFilter.appendChild(allOption);

    cartridges.forEach(cartridge => {
        const option = document.createElement("option");
        option.value = cartridge;
        option.textContent = cartridge;
        cartridgeFilter.appendChild(option);
    });
}

function applyFilters() {
    const sourceFilter = document.getElementById("source-filter").value;
    const cartridgeFilter =
        document.getElementById("cartridge-filter").value;

    const filteredRows = allRows.filter(row => {
        const matchesSource =
            sourceFilter === "all" || row.Source === sourceFilter;

        const matchesCartridge =
            cartridgeFilter === "all" ||
            (row[cartridgeColumn] ?? "").trim() === cartridgeFilter;

        return matchesSource && matchesCartridge;
    });

    renderTable(filteredRows);

    const loading = document.getElementById("loading");
    loading.classList.remove("error");
    loading.textContent =
        `Showing ${filteredRows.length} of ${allRows.length} entries.`;
}

function renderTable(rows) {
    const tableBody = document.getElementById("table-body");
    tableBody.replaceChildren();

    rows.forEach(row => {
        const tr = document.createElement("tr");

        // Source column.
        const sourceCell = document.createElement("td");
        sourceCell.textContent = row.Source;
        tr.appendChild(sourceCell);

        // CSV data columns.
        headers.forEach(header => {
            const td = document.createElement("td");
            td.textContent = row[header] ?? "";
            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    });
}

// Update the table whenever either dropdown changes.
document.getElementById("source-filter").addEventListener(
    "change",
    applyFilters
);

document.getElementById("cartridge-filter").addEventListener(
    "change",
    applyFilters
);

loadReloadingData();