var requests = new Map()

var popup_is_turn_on = false

function on_before_request_call_back(requestDetails){
    if (popup_is_turn_on){
        request_handler(requestDetails)
    }
}

function type_checking(fqdn){
    let value_of_fqdn = requests.get(fqdn)

    if (typeof value_of_fqdn == 'undefined'){
        let map = new Map()
        map.set('methods', new Map())
        map.set('urls', [])
        map.set('bodys', [])
        requests.set(fqdn, map)
        return
    }
}

function request_method_handler(fqdn, method){
    type_checking(fqdn)

    let value_of_fqdn = requests.get(fqdn)
    let methods = requests.get(fqdn).get('methods')

    for (var [key, value] of methods){
        if (method === key){
            methods.set(key, ++value)
            return
        }
    }

    requests.set(fqdn, value_of_fqdn.set('methods', methods.set(method, 1)))
}

function request_body_handler(fqdn, bytes){
    type_checking(fqdn)

    let body = decodeURIComponent(String.fromCharCode.apply(null, new Uint8Array(bytes)))

    let value_of_fqdn = requests.get(fqdn)
    let bodys = requests.get(fqdn).get('bodys')

    bodys.push(body)
    requests.set(fqdn, value_of_fqdn.set('bodys', bodys))
}

function request_url_handler(fqdn, url){
    type_checking(fqdn)

    let value_of_fqdn = requests.get(fqdn)
    let urls = requests.get(fqdn).get('urls')

    urls.push(url)
    requests.set(fqdn, value_of_fqdn.set('urls', urls))
}

function request_handler(requestDetails){
    let request_url = requestDetails.url
    let request_method = requestDetails.method
    var fqdn = get_fqdn(request_url)
    
    try{
        var body = requestDetails.requestBody.raw[0].bytes
        request_body_handler(fqdn, body)
    }
    catch (TypeError){}

    request_url_handler(fqdn, request_url)
    request_method_handler(fqdn, request_method)
}

function get_fqdn(url){
    var fqdn = '';
    for (let i = 0; i < url.length; i++){
        if (url[i] === '/' && url[i + 1] === '/'){
            let j = i + 2;
            for (j; j < url.length; j++){
                if (url[j] === '/' || url[j] === '?') break
                fqdn += url[j]
            }
        }
    }
    return fqdn;
}

chrome.webRequest.onBeforeRequest.addListener(
    on_before_request_call_back,
    {urls: ["<all_urls>"]},
    ["requestBody"]
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(requests)
    switch (message) {
        case 'get_data':
            let data = {}

            for (var [key, value] of requests){
                data[key] = value
                let k = data[key]
                k['methods'] = Object.fromEntries(value.get('methods'))
                k['urls'] = value.get('urls')
                k['bodys'] = value.get('bodys')
            }

            sendResponse(data);

            break;
        case 'set_popup_status_off':
            popup_is_turn_on = false
            break;
        case 'set_popup_status_on':
            popup_is_turn_on = true
            break;
        case 'get_popup_status':
            sendResponse({'status': popup_is_turn_on});
            break;
        case 'reset_extention':
            requests = new Map()
            break
        default:
            break;
    }
})