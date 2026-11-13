async function fetchGet(link, callback) {
    const request = fetch(link).then(response => {
        if (!response.ok) {
            throw new Error('Error fetching ' + link + ': ' + response.status + ' ' + response.statusText)
        }
        return response.text()
    })

    const result = typeof callback === 'function'
        ? request.then(data => {
            callback(data)
            return data
        })
        : request

    try {
        return await result
    } catch (error) {
        console.error('fetchGet failed:', error)
        throw error
    }
}
// Использование: 
/*fetchGet(link, (data) => {
    alert(data)
});*/

window.fetchGet = fetchGet;