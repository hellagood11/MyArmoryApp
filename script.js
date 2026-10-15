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

    // Other pages, such as Reviews, do not have an inventory list.
    if (!inventoryList) return;


    //contants for inventory management
    const searchInput = document.getElementById('inventorySearch');
    const typeFilter = document.getElementById('inventoryTypeFilter');
    const status = document.getElementById('inventoryStatus');
    const notice = document.getElementById('inventoryNotice');
    const inventoryForm = document.getElementById('inventoryForm');

    const itemTypeInput = document.getElementById('itemType');
    const quantityGroup = document.getElementById('quantityGroup');
    const quantityInput = document.getElementById('itemQuantity');

    // filter inventory items based on search term and type filter
    function filterInventory() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedType = typeFilter.value;
        let visibleCount = 0;
        // Loop through each inventory card and determine if it should be visible based on the search term and selected type.
        inventoryList.querySelectorAll('.inventory-card').forEach(card => {
            const matchesText = card.dataset.search.includes(searchTerm);
            const matchesType = selectedType === 'all' ||
                card.dataset.type === selectedType;
            const isVisible = matchesText && matchesType;

            card.hidden = !isVisible;
            if (isVisible) visibleCount++;
        });

        status.textContent = `${visibleCount} inventory item(s) shown.`;
    }

    //user interaction 1: filter inventory items as the user types in the search input.
    searchInput.addEventListener('input', filterInventory);

    // user interaction 2: filter inventory items when the user changes the type filter.
    typeFilter.addEventListener('change', filterInventory);

    // user interaction 3: toggle the visibility of item details when the user clicks the "Show details" button.
    inventoryList.addEventListener('click', event => {
        const button = event.target.closest('.details-toggle');
        if (!button) return;

        const card = button.closest('.inventory-card');
        const details = card.querySelector('.item-details');
        const isExpanded = button.getAttribute('aria-expanded') === 'true';

        details.hidden = isExpanded;
        button.setAttribute('aria-expanded', String(!isExpanded));
        button.textContent = isExpanded ? 'Show details' : 'Hide details';//show different text based on the state of the details section
    });

    function addMouseFeedback(card) {
        // When the user hovers over an inventory card, update the notice text to indicate which item is being viewed.
        card.addEventListener('mouseenter', () => {
            notice.textContent = `Viewing inventory entry: ${card.querySelector('h3').textContent}`;
        });
    }
    // Add mouse feedback to all existing inventory cards.
    inventoryList.querySelectorAll('.inventory-card').forEach(addMouseFeedback);

    // user interaction 4: handle the submission of the inventory form to add a new item to the inventory list.
    inventoryForm.addEventListener('submit', event => {
        event.preventDefault();
        //get the values from the form inputs
        const name = document.getElementById('itemName').value.trim();
        const type = document.getElementById('itemType').value;
        const caliber = document.getElementById('itemCaliber').value.trim();
        const quantity = type === 'ammunition'
            ? Number(document.getElementById('itemQuantity').value)
            : null;
        //validate the input values and display an error message if any required fields are missing or invalid
        if (!name || !caliber ||
            (type === 'ammunition' &&
             (!Number.isInteger(quantity) || quantity < 0))) {
            status.textContent = type === 'ammunition'
                ? 'Enter a name, caliber, and whole-number quantity of zero or more.'
                : 'Enter an item name and caliber.';
            return;
        }
        //create a new inventory card element and populate it with the input values
        const card = document.createElement('article');
        card.className = 'card inventory-card';
        card.dataset.type = type;
        card.dataset.search = `${name} ${caliber}`.toLowerCase();
        // create and append the heading, type, caliber, quantity, details button, and details paragraph to the card
        const heading = document.createElement('h3');
        heading.textContent = name;

        const typeText = document.createElement('p');
        typeText.textContent = `Type: ${type === 'firearm' ? 'Firearm' : 'Ammunition'}`;

        const caliberText = document.createElement('p');
        caliberText.textContent = `Caliber: ${caliber}`;

        const quantityText = document.createElement('p');
        quantityText.textContent = type === 'ammunition'
            ? `Quantity: ${quantity} rounds`
            : `Quantity: ${quantity}`;
        // create a button to toggle the visibility of the item details
        const detailsButton = document.createElement('button');
        detailsButton.className = 'cta-btn details-toggle';
        detailsButton.type = 'button';
        detailsButton.textContent = 'Show details';
        detailsButton.setAttribute('aria-expanded', 'false');
        // create a paragraph to hold the item details, initially hidden
        const details = document.createElement('p');
        details.className = 'item-details';
        details.textContent = 'Personal inventory entry.';
        details.hidden = true;
        // append the heading, type, caliber, and quantity (if applicable) to the card
        card.append(heading, typeText, caliberText);
        // only append the quantity text if the item is ammunition
        if (type === 'ammunition') {
            card.append(quantityText);
        }

        card.append(detailsButton, details);
        inventoryList.prepend(card);
        addMouseFeedback(card);
        // reset the form, filter the inventory to show the new item, and update the status message
        inventoryForm.reset();
        filterInventory();
        status.textContent = `${name} was added to your inventory.`;
    });
    //update the visibility and requirements of the quantity input field based on the selected item type
    function updateQuantityField() {
        const isAmmunition = itemTypeInput.value === 'ammunition';

        quantityGroup.hidden = !isAmmunition;
        quantityInput.disabled = !isAmmunition;
        quantityInput.required = isAmmunition;

        if (!isAmmunition) {
            quantityInput.value = '';
        }
    }
    // add an event listener to the item type input to update the quantity field when the selection changes
    itemTypeInput.addEventListener('change', updateQuantityField);
    updateQuantityField();
    //initially filter the inventory to show all items when the page loads
    filterInventory();
// Set up the review filter functionality
    const ratingFilter = document.getElementById('ratingFilter');
// If the rating filter exists on the page, add an event listener to update the review filter when the selection changes.
    if (ratingFilter) {
        ratingFilter.addEventListener('change', updateReviewFilter);
        updateReviewFilter();
    }
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
