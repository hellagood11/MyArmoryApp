//handle form submission
function handleFeedbackSubmit(event){
    event.preventDefault();

    //get the values from the form
    const nameInput = document.getElementById('reviewerName');
    const ratingInput = document.getElementById('reviewRating');
    const commentsInput = document.getElementById('reviewerComments');

    const name = nameInput.value.trim(); // trim name so there is no whitespace
    const ratingValue = parseInt(ratingInput.value); // convert rating to integer
    const comments = commentsInput.value.trim(); // trim comments so there is no whitespace


    //validate input and warn if some fields are not filled out
    if (!name || !ratingValue || !comments) {
        alert('Please fill in all fields before submitting your feedback.');
        return;
    }

    const stars = '★'.repeat(ratingValue) + '☆'.repeat(5 - ratingValue); // create star rating string
    // build new review object
    const reviewCard = document.createElement('div');
    reviewCard.className = 'card review-card';
    reviewCard.innerHTML = `
        <div class="review-header">
            <strong>${escapteHtml(name)}</strong>
            <span class="rating">${stars}</span>
        </div>
        <p>${escapteHtml(comments)}</p>
    `;

    //add the card to the list of reviews
    const reviewsList = document.getElementById('reviews-list');
    if (reviewsList) {
        reviewsList.prepend(reviewCard); // add new review to the top of the list
    }

    document.getElementById('feedbackForm').reset(); // reset the form after submission
    // prevent from HTML injection by escaping special characters in the input
    function escapteHtml(str) {
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

    //event listener for the form submission
    document.addEventListener('DOMContentLoaded', () => {
        const feedbackForm = document.getElementById('feedbackForm');
        if (feedbackForm) {
            feedbackForm.addEventListener('submit', handleFeedbackSubmit);
        }
    });
}