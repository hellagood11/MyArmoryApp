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
    }

    document.getElementById('feedbackForm').reset(); // reset the form after submission

}

document.addEventListener('DOMContentLoaded', () => {
    const inventoryList = document.getElementById('inventoryList');

    // Other pages, such as Reviews, do not have an inventory list.
    if (!inventoryList) return;

    const searchInput = document.getElementById('inventorySearch');
    const typeFilter = document.getElementById('inventoryTypeFilter');
    const status = document.getElementById('inventoryStatus');
    const notice = document.getElementById('inventoryNotice');
    const inventoryForm = document.getElementById('inventoryForm');

    const itemTypeInput = document.getElementById('itemType');
    const quantityGroup = document.getElementById('quantityGroup');
    const quantityInput = document.getElementById('itemQuantity');

    function filterInventory() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedType = typeFilter.value;
        let visibleCount = 0;

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

    // Interaction 1: update results as the user types.
    searchInput.addEventListener('input', filterInventory);

    // Interaction 2: filter by firearms or ammunition.
    typeFilter.addEventListener('change', filterInventory);

    // Interaction 3: expand/collapse item details with a button click.
    inventoryList.addEventListener('click', event => {
        const button = event.target.closest('.details-toggle');
        if (!button) return;

        const card = button.closest('.inventory-card');
        const details = card.querySelector('.item-details');
        const isExpanded = button.getAttribute('aria-expanded') === 'true';

        details.hidden = isExpanded;
        button.setAttribute('aria-expanded', String(!isExpanded));
        button.textContent = isExpanded ? 'Show details' : 'Hide details';
    });

    function addMouseFeedback(card) {
        // Mouse event: identify the inventory item the pointer enters.
        card.addEventListener('mouseenter', () => {
            notice.textContent = `Viewing inventory entry: ${card.querySelector('h3').textContent}`;
        });
    }

    inventoryList.querySelectorAll('.inventory-card').forEach(addMouseFeedback);

    // Interaction 4: validate and add an item submitted through the form.
    inventoryForm.addEventListener('submit', event => {
        event.preventDefault();

        const name = document.getElementById('itemName').value.trim();
        const type = document.getElementById('itemType').value;
        const caliber = document.getElementById('itemCaliber').value.trim();
        const quantity = type === 'ammunition'
            ? Number(document.getElementById('itemQuantity').value)
            : null;

        if (!name || !caliber ||
            (type === 'ammunition' &&
             (!Number.isInteger(quantity) || quantity < 0))) {
            status.textContent = type === 'ammunition'
                ? 'Enter a name, caliber, and whole-number quantity of zero or more.'
                : 'Enter an item name and caliber.';
            return;
        }

        const card = document.createElement('article');
        card.className = 'card inventory-card';
        card.dataset.type = type;
        card.dataset.search = `${name} ${caliber}`.toLowerCase();

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

        const detailsButton = document.createElement('button');
        detailsButton.className = 'cta-btn details-toggle';
        detailsButton.type = 'button';
        detailsButton.textContent = 'Show details';
        detailsButton.setAttribute('aria-expanded', 'false');

        const details = document.createElement('p');
        details.className = 'item-details';
        details.textContent = 'Personal inventory entry.';
        details.hidden = true;

        card.append(heading, typeText, caliberText);

        if (type === 'ammunition') {
            card.append(quantityText);
        }

        card.append(detailsButton, details);
        inventoryList.prepend(card);
        addMouseFeedback(card);

        inventoryForm.reset();
        filterInventory();
        status.textContent = `${name} was added to your inventory.`;
    });

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
    updateQuantityField();

    filterInventory();
});
