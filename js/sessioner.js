/* Contains helper functions and stuff to help other functions
    Author : Balukidi N
    Date : 15 Jan. 2019
    Twitter: @Olfredos6
*/
let sessioner = {}

sessioner.currentlyViewingClient = null
sessioner.previousContents = []
sessioner.identity = null
sessioner.bankingSettings = null
sessioner.contentInPopUp = false
sessioner.state = {}

sessioner.debounce = (func, wait, immediate) => {
    var timeout;
    return function () {
        var context = this,
            args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) {
                func.apply(context, args);
            }
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait || 200);
        if (callNow) {
            func.apply(context, args);
        }
    };
};


sessioner.save = _ => {
    let html = document.getElementById("top-card-body").innerHTML
    // only save if content is not empty
    if (html.trim() != "" && html.indexOf("@doNotSave") == -1)
        sessioner.previousContents.push(html)
}

sessioner.getPrevious = _ => {
    if (sessioner.previousContents.length > 0) {
        if (sessioner.previousContents[sessioner.previousContents.length - 1].indexOf(`<h5 class="card-title">Liste des comptes</h5>`) != -1) {
            viewParentAccount(sessioner.currentlyViewingClient[0].userData.banking_no)
        }
        document.getElementById("top-card-body").innerHTML = sessioner.previousContents.pop()
    }
    else {
        // If nothing left inside our content session array, we make sure that we load the menu
        if (document.getElementById("top-card-body").innerHTML != menuHTML && !sessioner.currentAgent.fidelity_card_number)
            sessioner.loadMenu()
    }
}


sessioner.loadCentralContent = (title, content) => {
    html =
        `<div class="card">
        <div class="card-header">
            <h4 class="card-title"  id="header-central-content">${title}</h4>
            <hr>
        </div>
        <div class="card-body">
            ${content}
            </div>
    </div>`
    if (html != menuHTML) {
        // We only save the content if it's different from the menu
        sessioner.save()
    }
    try {
        document.querySelector('#accounts-list').innerHTML = html
    }
    catch{
        // cause it might be missing, we use parent
        document.querySelector('#parent-acc-content').innerHTML = html
    }
}

sessioner.displayServerFeedbackNotification = (statusCode = 6, message = false, callback = () => { }, container=null) => {
    // if callback exists, execute it first then notify as intended
    callback()
    const codesAndMessage = {
        200: "Requête effectuée avec succès",
        400: "Données incorrectes",
        401: "Accès interdit",
        403: "Action interdite",
        404: "Ressource introuvable",
        405: "Interaction non permise",
        408: "La requête a pris trop de temps. Elle a été abandonnée",
        429: "Veuillez cliquer une seule fois et patienter",
        500: "La requête n'a pas pu aboutir dû à une erreur interne",
        501: "La requête n'est pas traitable pour le moment",
        503: "Service non disponible",
    }

    let title = `Erreur ${statusCode}`
    // If the message wasn't passed along, we give it a default value 
    if (!message)
        message = codesAndMessage[statusCode] == undefined ? "Veuillez reessayer. Si l'erreur persiste, contactez l'admistrateur du système" : codesAndMessage[statusCode]
    // compute notification styling
    let style = "info" // default style
    if (statusCode >= 200 && statusCode < 300) {
        style = "success"
        title = `Status ${statusCode}`
    }
    else if (statusCode >= 300 && statusCode < 400) {
        style = "warning"
        title = `Status ${statusCode}`
    }
    else if (statusCode >= 400 || statusCode == 6)
        style = "danger"
    let html = `<div class="alert alert-${style} alert-dismissible fade show" id="alert" style="margin-bottom: .15rem!important;">
                    <button type="button" aria-hidden="true" class="close" data-dismiss="alert" aria-label="Close">
                        <i class="nc-icon nc-simple-remove"></i>
                    </button>
                    <span>${(new Date($.now())).toLocaleTimeString()}| <b> ${title} - </b> ${message}</span>
                </div>`
    /* content can either be displayed inside the normal container or inside the modal.
        inside the normal container, notifications are displayed before the element with
        id top-card-body. inside the the pop-up, right after the pop-up's pop-up-container-body
    */
    if(container == null){
    document.getElementById(`${sessioner.contentInPopUp ? "pop-up-container-body" : "top-card-body"}`).insertAdjacentHTML("afterbegin", html)
    document.getElementsByClassName("alert")[0].scrollIntoView({ block: "start" }) // scroll to the latest alert
    }
    else{
        document.querySelector(container).insertAdjacentHTML("beforeend", html)
    }
}

const menuHTML = `
<div class="col-lg-3 col-md-6 col-sm-6 card-menu-wrapper">
    <div class="card card-stats card-menu" id="menu-btn-search" onclick="$('#keyword').focus()">
        <div class="card-body ">
            <div class="row">
                <div class="col-5 col-md-4">
                    <div class="icon-big text-center icon-warning">
                        <i class="nc-icon nc-zoom-split menu-icon"></i>
                    </div>
                </div>
                <div class="col-7 col-md-8">
                    <div class="numbers">
                        <p class="card-category">comptes/clients</p>
                        <p class="card-title">Chercher
                        </p>
                        <p>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="col-lg-3 col-md-6 col-sm-6 card-menu-wrapper">
        <div class="card card-stats card-menu" id="menu-btn-register" onclick="sessioner.loadContent(registrationForm)">
            <div class="card-body ">
                <div class="row">
                    <div class="col-5 col-md-4">
                        <div class="icon-big text-center icon-warning">
                            <i class="fas fa-user-plus menu-icon"></i>
                        </div>
                    </div>
                    <div class="col-7 col-md-8">
                        <div class="numbers">
                            <p class="card-category">nouveau compte</p>
                            <p class="card-title">Enregistrer
                            </p>
                            <p>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="col-lg-3 col-md-6 col-sm-6 card-menu-wrapper" id="menu-btn-approve-acc" style="display: none">
        <div class="card card-stats card-menu" onclick="viewAccountsToValidate()">
            <div class="card-body ">
                <div class="row">
                    <div class="col-5 col-md-4">
                        <div class="icon-big text-center icon-warning">
                            <i class="fas fa-certificate menu-icon"></i>
                        </div>
                    </div>
                    <div class="col-7 col-md-8">
                        <div class="numbers">
                            <p class="card-category" id="count-acc-to-approve"><i class="fas fa-spinner fa-spin"></i></p>
                            <p class="card-title">Approuver
                            </p>
                            <p>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="col-lg-3 col-md-6 col-sm-6 card-menu-wrapper" id="menu-btn-reverse" style="display: none">
        <div class="card card-stats card-menu" onclick="sessioner.loadContent(templates.transReverserForm, in_pop_up=true)">
            <div class="card-body ">
                <div class="row">
                    <div class="col-5 col-md-4">
                        <div class="icon-big text-center icon-warning">
                            <i class="fas fa-history menu-icon"></i>
                        </div>
                    </div>
                    <div class="col-7 col-md-8">
                        <div class="numbers">
                            <p class="card-category">Transactions</p>
                            <p class="card-title">Retourner
                            </p>
                            <p>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="col-lg-3 col-md-6 col-sm-6 card-menu-wrapper" id="menu-btn-share-mamanger" style="display: none">
        <div class="card card-stats card-menu" id="menu-btn-register" onclick="Shares.manage()">
            <div class="card-body ">
                <div class="row">
                    <div class="col-5 col-md-4">
                        <div class="icon-big text-center icon-warning">
                            <i class="fas fa-hands-helping menu-icon"></i>
                        </div>
                    </div>
                    <div class="col-7 col-md-8">
                        <div class="numbers">
                            <p class="card-category">Gestion des Parts Sociales</p>
                            <p class="card-title">Achat/Vente
                            </p>
                            <p>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`
sessioner.loadMenu = _ => {
    try {
        sessioner.loadContent(menuHTML)
        var customMenu = setInterval(() => {
            if (sessioner.currentAgent)
                if (sessioner.currentAgent.tag == "SOMM-ET") {
                    $("#menu-btn-reverse").show()
                    $("#menu-btn-share-mamanger").show()
                    clearInterval(customMenu)
                }
        }, 1000)
        // Re-run notifiers
        if (typeof (notifier) == "object") {
            notifier.accountToApprove()
        }
    }
    catch{
        Console.log("Failde to load Menu")
        sessioner.displayServerFeedbackNotification("Le menu n'a pas puêtre chargé")
    }

}


sessioner.dateToReadable = val => {
    try {
        let date = new Date(Date.parse(val));
        let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        return date.toLocaleDateString("fr-FR", options)
    }
    catch{
        return val
    }
}

sessioner.formatDate = (date) => {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [day, month, year].join('-');
}

// We start be asking if this guy is a client or not?

sessioner.compare = function (obj1, obj2) {
    let authorAt = "https://gist.github.com/nicbell/6081098"
    //Loop through properties in object 1
    for (var p in obj1) {
        //Check property exists on both objects
        if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;

        switch (typeof (obj1[p])) {
            //Deep compare objects
            case 'object':
                if (!sessioner.compare(obj1[p], obj2[p])) return false;
                break;
            //Compare function code
            case 'function':
                if (typeof (obj2[p]) == 'undefined' || (p != 'compare' && obj1[p].toString() != obj2[p].toString())) return false;
                break;
            //Compare values
            default:
                if (obj1[p] != obj2[p]) return false;
        }
    }

    //Check object 2 for any extra properties
    for (var p in obj2) {
        if (typeof (obj2[p]) == 'undefined') return false;
    }
    return true;
};

sessioner.showOptionsUnderAccountDetails = () => {
    document.querySelector('#account-details').lastElementChild.innerHTML = sessioner.optionsUnderAccountDetails
}


sessioner.objectFilter = (obj, key, val) => {
    //    returns a filtered version of obj with element filtered by val on key
    obj.array.forEach(element => {

    });
}

sessioner.getTimeElpasedString = (datetime, depth = 1, lang = 'FR') => {
    /*
        depth = 0 means start at milliseconds
        depth = 1 means start at seconds
    */
    datetime = Date.parse(datetime).getElapsed()
    // console.log(datetime)
    let dividers = [1000, 60, 60, 24, 7]
    let str = ''
    let units = {
        "EN": ["milliseconds", "seconds", "minutes", "hours", "days"],
        "FR": ["tierces", "secondes", "minutes", "heures", "jours"]
    }
    let reminders = []
    dividers.forEach(d => {
        reminders.push(datetime % d)
        datetime = parseInt(datetime / d)
    })
    reminders = reminders.slice(depth).reverse()
    units = units[lang].slice(depth).reverse()
    for (let i = 0; i < reminders.length; i++) {
        // skip which is equal to zero
        if (reminders[i] != 0)
            str += `${reminders[i]} ${units[i]} `
    }
    if (lang == "EN")
        return str + "ago"
    else if (lang == "FR")
        return "Il y a " + str
}

sessioner.numberToReadable = (number) => {
    let formated_number = NaN
    if (number !== "") {
        try {
            if (typeof (number) != "number") number = parseFloat(number)
            formated_number = (Math.round((number + Number.EPSILON) * 1000) / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        }
        catch (e) {
            console.log("Failed to format number.");
        }
    }
    else{
        formated_number = ""
    }
    return formated_number
}

sessioner.remove_null_values_from_object = obj => {
    temp_obj = {}
    for (let item in obj) {
      if (obj[item] && item !== 'reset'/** for sessioner reset command */) {
        temp_obj[item] = obj[item]
      }
    }
    return temp_obj
}

sessioner.keep_witdh = (element_id)=>{
    setInterval(() => {
        let wdt =  $(document).width()
        if (wdt>=576) document.querySelector(`#${element_id}`).style.width = "100%"
        if (wdt>=768) document.querySelector(`#${element_id}`).style.width = "75%"
        if (wdt>=1200) document.querySelector(`#${element_id}`).style.width = "55%"
        if (wdt>1600) document.querySelector(`#${element_id}`).style.width = "49%"
        if (wdt>1632) document.querySelector(`#${element_id}`).style.width = "45%"
        if (wdt>1791) document.querySelector(`#${element_id}`).style.width = "40%"
        if (wdt>1900) document.querySelector(`#${element_id}`).style.width = "30%"
        try{
            document.querySelector("#wdt").innerHTML = "tdd_wdt " + wdt
        }catch{
            // pass
        }
        
        // if ($(document).height()) {
        //     latest_max_height = $(document).height()
        // }
        // console.log($(document).height())
    }, 250)
}

sessioner.keep_witdh_at_percentage = (element_id, percentage)=>{
    setInterval(() => {
        // let wdt =  $(document).width()
        // if (wdt>=576) document.querySelector(`#${element_id}`).style.width = "100%"
        // if (wdt>=768) document.querySelector(`#${element_id}`).style.width = "75%"
        // if (wdt>=1200) document.querySelector(`#${element_id}`).style.width = "55%"
        // if (wdt>1600) document.querySelector(`#${element_id}`).style.width = "49%"
        // if (wdt>1632) document.querySelector(`#${element_id}`).style.width = "45%"
        // if (wdt>1791) document.querySelector(`#${element_id}`).style.width = "40%"
        // if (wdt>1900) document.querySelector(`#${element_id}`).style.width = "30%"
        try{
            document.querySelector(`#${element_id}`).style.width = `${percentage}%`
        }catch{
            // pass
        }
        
        // if ($(document).height()) {
        //     latest_max_height = $(document).height()
        // }
        // console.log($(document).height())
    }, 250)
}

// runs function on location update
sessioner.hashReducer = {
    fn: function () {
        // function to run whenever the hash value changes
        let hash = location.hash.replace("#", "")
        if(sessioner.hashReducer.actions.hasOwnProperty(hash))
            sessioner.hashReducer.actions[hash]()
        else
            console.log("No action registered for hash change")
    },
    actions: {
        // action -> function map
    }
}
sessioner.window.onhashchange = hashReducer.fn



/********************   SSEXEC  **********************************/
sessioner.ssexec = () => {
    /**
     * Executes a function passed as parameter to the href when the page finishes loading
     * Implementation inspired from www.sitepoint.com/call-javascript-function-string-without-using-eval
     */
    let fn = new URL(location.href).searchParams.get("ss_exec")
    let params = new URL(location.href).searchParams.get("p").split(",")
    let _fn = window[fn]
    // check if any of the parameter is a function and convert it
    let callback = eval(new URL(location.href).searchParams.get("fp"))
    // params.forEach((p,i) => {
    //     p_fn = window[p]
    //     if(typeof(p)=='function') params[i] = window[p]
    //     else if(typeof(eval(p))  === 'function') params[i] = window[p]
    // })
    if(typeof(_fn) === 'function') _fn.apply(null, params.concat(callback))
}

// event to be used to trigger the execution. If not triggered, it won't run
sessioner.ssexecEvent = new Event('fire_ssexec') 
// use window.dispatchEvent(sessioner.ssexecEvent) to trigger
// window.addEventListener('DOMContentLoaded', ()=> sessioner.ssexec())
window.addEventListener('fire_ssexec',  ()=> sessioner.ssexec())
/********************   SSEXEC  **********************************/
