// Escape text before inserting into HTML
function escapeHtml(str) {
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

// Review form handling
function handleFeedbackSubmit(event) {
    event.preventDefault();

    const nameInput = document.getElementById("reviewerName");
    const ratingInput = document.getElementById("reviewRating");
    const commentsInput = document.getElementById("reviewerComments");

    const name = nameInput.value.trim();
    const ratingValue = Number(ratingInput.value);
    const comments = commentsInput.value.trim();

    if (!name || !Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5 || !comments) {
        alert("Enter your name, select a rating from 1 to 5, and provide comments.");
        return;
    }

    const stars = "★".repeat(ratingValue) + "☆".repeat(5 - ratingValue);

    const reviewCard = document.createElement("div");
    reviewCard.className = "card review-card";
    reviewCard.dataset.rating = String(ratingValue);
    reviewCard.innerHTML = `
        <div class="review-header">
            <strong>${escapeHtml(name)}</strong>
            <span class="rating">${stars}</span>
        </div>
        <p>${escapeHtml(comments)}</p>
    `;

    const reviewsList = document.getElementById("reviews-list");
    if (reviewsList) {
        reviewsList.prepend(reviewCard);
        updateReviewFilter();
    }

    document.getElementById("feedbackForm").reset();
}

function updateReviewFilter() {
    const reviewsList = document.getElementById("reviews-list");
    const ratingFilter = document.getElementById("ratingFilter");
    const reviewCount = document.getElementById("reviewCount");

    if (!reviewsList || !ratingFilter || !reviewCount) return;

    const cards = reviewsList.querySelectorAll(".review-card");
    let visibleCount = 0;

    cards.forEach(card => {
        const matchesRating =
            ratingFilter.value === "all" ||
            card.dataset.rating === ratingFilter.value;

        card.hidden = !matchesRating;
        if (matchesRating) visibleCount++;
    });

    reviewCount.textContent = `Showing ${visibleCount} of ${cards.length} reviews`;
}

document.addEventListener("DOMContentLoaded", () => {
    const inventoryList = document.getElementById("inventoryList");
    if (!inventoryList) return;

    const searchInput = document.getElementById("inventorySearch");
    const typeFilter = document.getElementById("inventoryTypeFilter");
    const status = document.getElementById("inventoryStatus");
    const notice = document.getElementById("inventoryNotice");
    const inventoryForm = document.getElementById("inventoryForm");
    const addItemDialog = document.getElementById("addItemDialog");
    const openAddItemButton = document.getElementById("openAddItem");
    const closeAddItemButton = document.getElementById("closeAddItem");

    const itemNameInput = document.getElementById("itemName");
    const itemTypeInput = document.getElementById("itemType");
    const itemCaliberInput = document.getElementById("itemCaliber");
    const quantityInput = document.getElementById("itemQuantity");
    const quantityGroup = document.getElementById("quantityGroup");
    const editingItemId = document.getElementById("editingItemId");
    const dialogHeading = document.getElementById("add-item-heading");
    const saveItemButton = document.getElementById("saveItemButton");

    function updateQuantityField() {
        const isAmmunition = itemTypeInput.value === "ammunition";

        quantityGroup.hidden = !isAmmunition;
        quantityInput.disabled = !isAmmunition;
        quantityInput.required = isAmmunition;

        if (!isAmmunition) {
            quantityInput.value = "";
        }
    }

    function filterInventory() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedType = typeFilter.value;
        let visibleCount = 0;

        inventoryList.querySelectorAll(".inventory-card").forEach(card => {
            const matchesText = card.dataset.search.includes(searchTerm);
            const matchesType = selectedType === "all" || card.dataset.type === selectedType;

            card.hidden = !(matchesText && matchesType);
            if (!card.hidden) visibleCount++;
        });

        status.textContent = `${visibleCount} inventory item(s) shown.`;
    }

    function addMouseFeedback(card) {
        card.addEventListener("mouseenter", () => {
            const heading = card.querySelector("h3");
            notice.textContent = heading ? `Viewing inventory entry: ${heading.textContent}` : "";
        });
    }

    function renderInventoryCard(item) {
        const card = document.createElement("article");
        card.className = "card inventory-card";
        card.dataset.id = item._id;
        card.dataset.type = item.itemType || "firearm";
        card.dataset.quantity = String(item.quantity ?? "");
        card.dataset.search = `${item.name} ${item.caliber}`.toLowerCase();

        const heading = document.createElement("h3");
        heading.textContent = item.name;

        const typeText = document.createElement("p");
        typeText.textContent =
            `Type: ${item.itemType === "firearm" ? "Firearm" : "Ammunition"}`;

        const caliberText = document.createElement("p");
        caliberText.textContent = `Caliber: ${item.caliber}`;

        const quantityText = document.createElement("p");
        quantityText.textContent =
            item.itemType === "ammunition"
                ? `Quantity: ${item.quantity} rounds`
                : `Quantity: ${item.quantity}`;

        const editButton = document.createElement("button");
        editButton.className = "cta-btn edit-item-btn";
        editButton.type = "button";
        editButton.textContent = "Edit";

        const deleteButton = document.createElement("button");
        deleteButton.className = "cta-btn";
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.style.marginTop = "0.75rem";

        editButton.addEventListener("click", () => {
            editingItemId.value = item._id;
            itemNameInput.value = item.name;
            itemTypeInput.value = item.itemType || "firearm";
            itemCaliberInput.value = item.caliber;

            updateQuantityField();

            if (item.itemType === "ammunition") {
                quantityInput.value = item.quantity;
            }

            dialogHeading.textContent = "Edit Inventory Item";
            saveItemButton.textContent = "Save Changes";
            status.textContent = "";
            addItemDialog.showModal();
        });

        deleteButton.addEventListener("click", async () => {
            if (!window.confirm(`Delete "${item.name}" from your inventory?`)) {
                return;
            }

            try {
                const response = await fetch(`/api/inventory/${item._id}`, {
                    method: "DELETE"
                });

                if (!response.ok) throw new Error("Delete failed");

                status.textContent = `${item.name} was deleted successfully.`;
                await loadInventory();
            } catch (error) {
                console.error(error);
                status.textContent = "Could not delete inventory item.";
            }
        });

        card.append(heading, typeText, caliberText, quantityText, editButton, deleteButton);
        addMouseFeedback(card);

        return card;
    }

    async function loadInventory() {
        try {
            const response = await fetch("/api/inventory");
            if (!response.ok) throw new Error("Could not load inventory");

            const items = await response.json();

            inventoryList.innerHTML = "";

            items.forEach(item => {
                const card = renderInventoryCard(item);
                inventoryList.appendChild(card);
            });

            filterInventory();
            status.textContent = `${items.length} inventory item(s) shown.`;
        } catch (error) {
            console.error(error);
            status.textContent = "Unable to load inventory from the database.";
        }
    }

    function openAddMode() {
        inventoryForm.reset();
        editingItemId.value = "";
        dialogHeading.textContent = "Add an Inventory Item";
        saveItemButton.textContent = "Add to Inventory";
        updateQuantityField();
        status.textContent = "";
    }

    openAddItemButton.addEventListener("click", () => {
        openAddMode();
        addItemDialog.showModal();
    });

    closeAddItemButton.addEventListener("click", () => {
        addItemDialog.close();
    });

    addItemDialog.addEventListener("click", event => {
        if (event.target === addItemDialog) {
            addItemDialog.close();
        }
    });

    searchInput.addEventListener("input", filterInventory);
    typeFilter.addEventListener("change", filterInventory);
    itemTypeInput.addEventListener("change", updateQuantityField);

    inventoryForm.addEventListener("submit", async event => {
        event.preventDefault();

        const name = itemNameInput.value.trim();
        const itemType = itemTypeInput.value;
        const caliber = itemCaliberInput.value.trim();
        const quantity =
            itemType === "ammunition"
                ? Number(quantityInput.value)
                : 1;

        if (
            !name ||
            !caliber ||
            (itemType === "ammunition" &&
                (!Number.isInteger(quantity) || quantity < 0))
        ) {
            status.textContent =
                itemType === "ammunition"
                    ? "Enter a name, caliber, and whole-number quantity of zero or more."
                    : "Enter an item name and caliber.";
            return;
        }

        const payload = {
            name,
            itemType,
            caliber,
            quantity
        };

        const isEditing = Boolean(editingItemId.value);
        const url = isEditing
            ? `/api/inventory/${editingItemId.value}`
            : "/api/inventory";
        const method = isEditing ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Request failed");
            }

            inventoryForm.reset();
            editingItemId.value = "";
            updateQuantityField();
            addItemDialog.close();

            status.textContent = isEditing
                ? `${name} was updated successfully.`
                : `${name} was added to your inventory.`;

            notice.textContent = "";
            await loadInventory();
        } catch (error) {
            console.error(error);
            status.textContent = error.message || "Could not save inventory item.";
        }
    });

    updateQuantityField();
    loadInventory();
});

document.addEventListener("DOMContentLoaded", () => {
    const ratingFilter = document.getElementById("ratingFilter");
    if (!ratingFilter) return;

    ratingFilter.addEventListener("change", updateReviewFilter);
    updateReviewFilter();
});

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("ballisticsForm");
    if (!form) return;

    const message = document.getElementById("ballisticsMessage");
    const results = document.getElementById("ballisticsResults");
    const chartContainer = document.getElementById("graph-output");
    const svgNamespace = "http://www.w3.org/2000/svg";

    function makeSvgElement(name, attributes = {}) {
        const element = document.createElementNS(svgNamespace, name);
        Object.entries(attributes).forEach(([attribute, value]) => {
            element.setAttribute(attribute, String(value));
        });
        return element;
    }

    function renderDropChart(velocity) {
        const distances = Array.from({ length: 31 }, (_, index) => index * 10);
        const drops = distances.map(distance => {
            if (distance === 0) return 0;
            const timeOfFlight = (distance * 3) / velocity;
            return -16.087 * (timeOfFlight ** 2) * 12;
        });

        if (!drops.every(Number.isFinite)) {
            throw new RangeError("The entered velocity is too low to plot a finite trajectory.");
        }

        const chart = makeSvgElement("svg", {
            viewBox: "0 0 700 300",
            role: "img",
            "aria-labelledby": "drop-chart-title drop-chart-description",
            focusable: "false"
        });

        const title = makeSvgElement("title", { id: "drop-chart-title" });
        title.textContent = "Estimated bullet drop over distance";

        const description = makeSvgElement("desc", { id: "drop-chart-description" });
        description.textContent =
            `Estimated drop from 0 to 300 yards for a muzzle velocity of ${velocity} feet per second.`;

        chart.append(title, description);

        const plot = { left: 62, right: 680, top: 25, bottom: 238 };
        const maximumDrop = Math.max(...drops.map(drop => Math.abs(drop)), 1);

        const pointFor = (distance, drop) => {
            const x = plot.left + (distance / 300) * (plot.right - plot.left);
            const y = plot.top + (Math.abs(drop) / maximumDrop) * (plot.bottom - plot.top);
            return `${x},${y}`;
        };

        [0, 0.5, 1].forEach(fraction => {
            const y = plot.top + fraction * (plot.bottom - plot.top);
            const grid = makeSvgElement("line", {
                x1: plot.left, y1: y, x2: plot.right, y2: y,
                class: "chart-grid-line"
            });
            chart.append(grid);

            const label = makeSvgElement("text", {
                x: plot.left - 10, y: y + 4, "text-anchor": "end",
                class: "chart-label"
            });
            label.textContent = `${(-maximumDrop * fraction).toFixed(0)} in`;
            chart.append(label);
        });

        [0, 100, 200, 300].forEach(distance => {
            const x = plot.left + (distance / 300) * (plot.right - plot.left);
            chart.append(makeSvgElement("line", {
                x1: x, y1: plot.top, x2: x, y2: plot.bottom,
                class: "chart-grid-line"
            }));

            const label = makeSvgElement("text", {
                x, y: plot.bottom + 22, "text-anchor": "middle",
                class: "chart-label"
            });
            label.textContent = String(distance);
            chart.append(label);
        });

        chart.append(makeSvgElement("polyline", {
            points: distances.map((distance, index) => pointFor(distance, drops[index])).join(" "),
            class: "trajectory-line"
        }));

        const xLabel = makeSvgElement("text", {
            x: (plot.left + plot.right) / 2, y: 292,
            "text-anchor": "middle", class: "chart-axis-label"
        });
        xLabel.textContent = "Distance (yards)";
        chart.append(xLabel);

        chartContainer.replaceChildren(chart);
        createDropTable(distances, drops);
    }

    function createDropTable(distances, drops) {
        const tableBody = document.getElementById("drop-table-body");
        tableBody.innerHTML = "";

        distances.forEach((distance, index) => {
            const row = document.createElement("tr");

            const distanceCell = document.createElement("td");
            distanceCell.textContent = distance;

            const dropCell = document.createElement("td");
            dropCell.textContent = drops[index].toFixed(2);

            row.appendChild(distanceCell);
            row.appendChild(dropCell);
            tableBody.appendChild(row);
        });
    }

    form.addEventListener("submit", event => {
        event.preventDefault();
        message.textContent = "";

        const grains = Number(form.elements.grains.value);
        const velocity = Number(form.elements.velocity.value);

        if (!Number.isFinite(grains) || grains <= 0 ||
            !Number.isFinite(velocity) || velocity <= 0) {
            message.textContent = "Enter a bullet weight and muzzle velocity greater than zero.";
            results.hidden = true;
            return;
        }

        const kilograms = grains / 15432.3584;
        const metersPerSecond = velocity * 0.3048;
        const energyJoules = 0.5 * kilograms * (metersPerSecond ** 2);
        const momentumMetric = kilograms * metersPerSecond;
        const energyFootPounds = (grains * (velocity ** 2)) / 450436;
        const momentumImperial = (grains * velocity) / 225218;

        if (![energyJoules, momentumMetric, energyFootPounds, momentumImperial].every(Number.isFinite)) {
            message.textContent = "Those values are outside the calculator’s supported range.";
            results.hidden = true;
            return;
        }

        try {
            renderDropChart(velocity);
        } catch (error) {
            if (!(error instanceof RangeError)) throw error;
            message.textContent = error.message;
            results.hidden = true;
            return;
        }

        document.getElementById("energy-imp").textContent = energyFootPounds.toFixed(2);
        document.getElementById("energy-metric").textContent = energyJoules.toFixed(2);
        document.getElementById("momentum-imp").textContent = momentumImperial.toFixed(4);
        document.getElementById("momentum-metric").textContent = momentumMetric.toFixed(4);
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
    const table = document.getElementById("reloading-table");

    if (!loading || !table) return;

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
                                console.warn(`Parsing issues in ${file.path}:`, result.errors);
                            }

                            resolve({
                                ...result,
                                source: file.source
                            });
                        },
                        error: error => reject(new Error(`${file.path}: ${error.message}`))
                    });
                });
            })
        );

        headers = results[0].meta.fields || [];

        if (headers.length === 0) {
            throw new Error("No column headers found.");
        }

        const matchingHeaders = results.every(result => {
            const fileHeaders = result.meta.fields || [];
            return headers.length === fileHeaders.length &&
                headers.every(header => fileHeaders.includes(header));
        });

        if (!matchingHeaders) {
            throw new Error("The CSV files have different column headers.");
        }

        cartridgeColumn = headers.find(
            header => header.trim().toLowerCase() === "cartridge"
        );

        if (!cartridgeColumn) {
            throw new Error('Could not find a "Cartridge" column in the CSV headers.');
        }

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
        loading.textContent = `Unable to load reloading data: ${error.message}`;
        loading.classList.add("error");
        table.hidden = true;
    }
}

function buildTableHeaders() {
    const headerRow = document.getElementById("table-header");
    if (!headerRow) return;

    headerRow.replaceChildren();

    ["Source", ...headers].forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
    });
}

function populateCartridgeFilter() {
    const cartridgeFilter = document.getElementById("cartridge-filter");
    if (!cartridgeFilter) return;

    const cartridges = [
        ...new Set(
            allRows
                .map(row => (row[cartridgeColumn] ?? "").trim())
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

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
    const sourceFilter = document.getElementById("source-filter");
    const cartridgeFilter = document.getElementById("cartridge-filter");
    const loading = document.getElementById("loading");

    if (!sourceFilter || !cartridgeFilter || !loading) return;

    const selectedSource = sourceFilter.value;
    const selectedCartridge = cartridgeFilter.value;

    const filteredRows = allRows.filter(row => {
        const matchesSource =
            selectedSource === "all" || row.Source === selectedSource;

        const matchesCartridge =
            selectedCartridge === "all" ||
            (row[cartridgeColumn] ?? "").trim() === selectedCartridge;

        return matchesSource && matchesCartridge;
    });

    renderTable(filteredRows);

    loading.classList.remove("error");
    loading.textContent = `Showing ${filteredRows.length} of ${allRows.length} entries.`;
}

function renderTable(rows) {
    const tableBody = document.getElementById("table-body");
    if (!tableBody) return;

    tableBody.replaceChildren();

    rows.forEach(row => {
        const tr = document.createElement("tr");

        const sourceCell = document.createElement("td");
        sourceCell.textContent = row.Source;
        tr.appendChild(sourceCell);

        headers.forEach(header => {
            const td = document.createElement("td");
            td.textContent = row[header] ?? "";
            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const sourceFilter = document.getElementById("source-filter");
    const cartridgeFilter = document.getElementById("cartridge-filter");

    if (sourceFilter) {
        sourceFilter.addEventListener("change", applyFilters);
    }

    if (cartridgeFilter) {
        cartridgeFilter.addEventListener("change", applyFilters);
    }

    loadReloadingData();
});