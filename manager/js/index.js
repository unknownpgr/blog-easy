$(document).ready(() => {
    mkdir('/test/test/test')
        .then(e => {
            console.log(e)
            alert(e)
        })
        .catch(e => {
            alert(e)
        })
});