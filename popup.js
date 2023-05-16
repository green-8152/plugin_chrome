var monitor_info = document.getElementById("monitor_info")
var power_button = document.getElementById("power_button")
var reload_button = document.getElementById("reload_button")
var search_process = document.getElementById("search_process")

var is_turn_on = false

chrome.runtime.sendMessage('get_popup_status', (response) => {
    if (response['status'] === false){
        popup_turn_off()
    }
    else{
        popup_turn_on()
    }
})

function get_data_from_background(){
    chrome.runtime.sendMessage('get_data', (response) => {
        console.log(response)
        let all_methods = get_amount_all_methods_map(response)
        let all_fqdn = get_all_fqdn(response)

        create_html_elems(all_methods, all_fqdn)
    })
}

function popup_turn_off(){
    power_button.className = 'turn_off'
    search_process.className = 'search_process invisible'
    is_turn_on = false
}

function popup_turn_on(){
    power_button.className = 'turn_on'
    search_process.className = 'search_process visible'
    is_turn_on = true
}

function send_popup_status_to_background(){
    if (is_turn_on){
        chrome.runtime.sendMessage('set_popup_status_on')
    }
    else{
        chrome.runtime.sendMessage('set_popup_status_off')
    }
    
}

power_button.addEventListener('click', ()=>{
    if (power_button.className == 'turn_off'){
        popup_turn_on()
    }
    else{
        popup_turn_off()
    }
    send_popup_status_to_background()
})

reload_button.addEventListener('click', ()=>{
    chrome.runtime.sendMessage('reset_extention')
})

function get_amount_all_methods_map(response){
    let all_methods = new Map()

    for (fqdn in response){
        let methods = response[fqdn]['methods']
        for (let method in methods){
            if (!all_methods.has(method)){
                all_methods.set(method, methods[method])
            }
            else{
                new_value = all_methods.get(method) + methods[method]
                all_methods.set(method, new_value)
            }
        }
    }
    
    return all_methods
}

function get_all_fqdn(response){
    let all_fqdn = new Map()

    for (fqdn in response){
        all_fqdn.set(fqdn, response[fqdn]['urls'].length)
    }

    return all_fqdn
}

function get_sort_array(all_elem){
    let sort_array = []
    let amount_requests = []

    for (var [key, value] of all_elem){
        amount_requests.push(value)
    }
    amount_requests.sort((a, b) => b - a)

    for (let i = 0; i < amount_requests.length; i++){
        for (var [key, value] of all_elem){
            if (value === amount_requests[i]){
                sort_array.push(key)
            }
        }
    }

    return sort_array
}

function get_amount_all_methods(all_methods){
    let amount = 0
    for (var [key, value] of all_methods){
        amount += value
    }
    return amount
}

function create_html_elems(all_methods, all_fqdn){
    del_html_elems()

    let amount = get_amount_all_methods(all_methods)

    let div_monitor = document.createElement('div')
    div_monitor.id = 'monitor_info'
    document.body.append(div_monitor)

    let div_caption_stats = document.createElement('div')
    div_caption_stats.innerHTML = `<h1>Общая статистика</h1>`
    div_monitor.append(div_caption_stats)

    let div = document.createElement('div')
    div.innerHTML = `<h2>Всего запросов: ${amount}</h2>`
    div_monitor.append(div)

    let div_diagram_methods = document.createElement('div')
    div_diagram_methods.style.width = '200px'
    div_diagram_methods.style.height = '30px'
    div_diagram_methods.style.display = 'flex'

    let colors = ['yellow', 'orange', 'blue', 'black', 'green', 'red']
    let color_index = 0

    let sort_methods = get_sort_array(all_methods)

    for (let i = 0; i < sort_methods.length; i++){
        let div = document.createElement('div')
        div.innerHTML = `<h2>Всего ${sort_methods[i]} запросов: ${all_methods.get(sort_methods[i])} (${calculate_persantage_of_part(all_methods.get(sort_methods[i]), amount)} %)</h2>`
        div_monitor.append(div)
    }

    for (var [key, value] of all_methods){
        let div_color = document.createElement('div')
        div_color.style.backgroundColor = colors[color_index++]
        div_color.style.width = `${calculate_persantage_of_part(value, amount) * 2}px`
        div_color.style.height = `20px`
        div_diagram_methods.append(div_color)
    }

    div_monitor.append(div_diagram_methods)

    let sort_fqdns = get_sort_array(all_fqdn)

    let div_meth = document.createElement('div')
    if (sort_fqdns.length > 0){
        div_meth.innerHTML = `<h2>${get_name_for_top_sites_caption(sort_fqdns)}</h2>`
    }
    div_monitor.append(div_meth)

    for (let i = 0; i < sort_fqdns.length; i++){
        if(i == 5) break
        let div = document.createElement('div')
        div.innerHTML = `<h2>${i + 1}. ${sort_fqdns[i]}: ${all_fqdn.get(sort_fqdns[i])} (${calculate_persantage_of_part(all_fqdn.get(sort_fqdns[i]), amount)} %)</h2>`
        div_monitor.append(div)
    }
}

function get_name_for_top_sites_caption(sort_fqdns){
    switch (sort_fqdns.length) {
        case 1:
            return 'Топ 1 сайт:'
        case 2:
        case 3:
        case 4:
            return `Топ ${sort_fqdns.length} сайта:`
        default:
            return 'Топ 5 сайтов:'
    }
}

function calculate_persantage_of_part(amount_method, amount_all_methods){
    return Math.round((amount_method / amount_all_methods) * 100)
}

function del_html_elems(){
    let monitor_info = document.getElementById('monitor_info')

    monitor_info.remove()
}

var timer = setInterval(function() {
  if (is_turn_on) {
    get_data_from_background()
  }
}, 5000)