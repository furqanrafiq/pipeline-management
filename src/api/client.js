import axios from 'axios'
const apiUrl = import.meta.env.VITE_API_URL;
console.log("apiurl",apiUrl)

const client = axios.create({
    baseURL: apiUrl,
    timeout: 10000,
})

export default client