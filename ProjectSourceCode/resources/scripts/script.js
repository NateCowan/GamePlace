console.log('balls');
document.addEventListener('DOMContentLoaded', () => {
    // get filter dropdown
    const filter = document.querySelector("#FILTER");

    // when dropdown changes call function to send info to index.js
    filter.addEventListener('change', () => {
        var text = filter.value;
        sendToServer(text);
    });
});


// takes info and calls route in index.js
function sendToServer(text) {
    fetch('/filter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application-json'
        },
        body: JSON.stringify({ genre: text}),
    })
    .then(data => {
        console.log('Fetched genre: ',data);
    })
    .catch(err => {
        console.log('Error: ',err);
    });
}
