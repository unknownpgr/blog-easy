$(document).ready(() => {
    copy('./index.html', '/index.html')
        .then(e => {
            console.log(e)
            alert(e)
        })
        .catch(e => {
            alert(e)
        })
});