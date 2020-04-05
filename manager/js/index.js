$(document).ready(() => {
    copyDir('/manager', '/test/test/test')
        .then(e => {
            console.log(e)
            alert(e)
        })
});