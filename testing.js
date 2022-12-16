import axios from "axios";
const linkStart = "https://cdn.discordapp.com/attachments/1025526944776867952";

// const chunk = axios.get(`${linkStart}/1051471107733082163/blob`, { cancelToken: source.token, responseType: 'arraybuffer' });

let controller = new AbortController();
let { signal } = controller;
axios.get(`${linkStart}/1051471107733082163/blob`, {
    signal
}).then(function (response) {
    //...
});
// cancel the request
try {
    controller.abort();
} catch (err) {
    console.log(err.message);
}