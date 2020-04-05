$(document).ready(() => {
    $('#change').click(() => {
        read('./index.html')
            .then(e => {
                console.log(e)
                alert(e)
            })
            .catch(e => {
                alert(e)
            })
    })
});