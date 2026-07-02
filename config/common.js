const capitalizeFirstLetter = (string) => {
    if (!string || string === "") {
        return ""
    }
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const validateEmailWithoutSpecial = (email) => {
    if (!email || email === "") {
        return ""
    }
    let re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    return re.test(email);
}

const validatePassword = (password) => {
    if (!password || password === "") {
        return ""
    }
    let re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/g;
    return re.test(password);
}

const convertUTCTimeToLocalTime = (UTCDateString) => {
    var convertdLocalTime = new Date(UTCDateString);

    var hourOffset = convertdLocalTime.getTimezoneOffset() / 60;

    convertdLocalTime.setHours(convertdLocalTime.getHours() + hourOffset);

    return convertdLocalTime;
}

const formatMoney = (num) => {
    if (!num || num === "") return "0"
    return Number(num).toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

const formatMoneyCoin = (num, fixed = 3) => {
    if (!num || num === '') return '0';
    let data = Number(Number(num || '0').toFixed(fixed)).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    data = data.replace(/,/g, '-');
    data = data.replace(/\./g, ',');
    data = data.replace(/-/g, '.');
    return data;
}

const formatNumberCoin = (num) => {
    if (!num) return 0
    num = parseFloat(num).toFixed(8)
    return parseFloat(num).toLocaleString("en", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 8
    });
}

const SECRET_KEY = "pOWI7geiVlbr1aBRbBpbGYA02fsb7O";

const upperCaseFirstString = (string) => {
    if (!string || string === "") return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const blackListInputNumber = (e) => {
    // Allow: backspace, delete, tab, escape, enter and .
    if ([46, 8, 9, 27, 13, 110].includes(e.keyCode)
        // Allow: Ctrl+A,Ctrl+C,Ctrl+V, Command+A
        || ((e.keyCode === 65 || e.keyCode === 86 || e.keyCode === 67) && (e.ctrlKey === true || e.metaKey === true))
        // Allow: home, end, left, right, down, up
        || (e.keyCode >= 35 && e.keyCode <= 40)
    ) {
        return true
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        return false
    }
    return true
}

const blackListInputNumberWithoutDot = (e) => {
    // Allow: backspace, delete, tab, escape, enter and .
    if ([46, 8, 9, 27, 13, 110, 190].includes(e.keyCode)
        // Allow: Ctrl+A,Ctrl+C,Ctrl+V, Command+A
        || ((e.keyCode === 65 || e.keyCode === 86 || e.keyCode === 67) && (e.ctrlKey === true || e.metaKey === true))
        // Allow: home, end, left, right, down, up
        || (e.keyCode >= 35 && e.keyCode <= 40)
    ) {
        return true
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        return false
    }
    return true
}

const apiUploadUrl = `${process.env.REACT_APP_API_URL}/uploads/`

const convertToSlug = (str) => {
    // Chuyển hết sang chữ thường
    str = str.toLowerCase();

    // xóa dấu
    str = str
        .normalize('NFD') // chuyển chuỗi sang unicode tổ hợp
        .replace(/[\u0300-\u036f]/g, ''); // xóa các ký tự dấu sau khi tách tổ hợp

    // Thay ký tự đĐ
    str = str.replace(/[đĐ]/g, 'd');

    // Xóa ký tự đặc biệt
    str = str.replace(/([^0-9a-z-\s])/g, '');

    // Xóa khoảng trắng thay bằng ký tự -
    str = str.replace(/(\s+)/g, '-');

    // Xóa ký tự - liên tiếp
    str = str.replace(/-+/g, '-');

    // xóa phần dư - ở đầu & cuối
    str = str.replace(/^-+|-+$/g, '');

    // return
    return str;
}

const checkString = (str) => {
    var format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if (str.match(format)) {
        return true;
    } else {
        return false;
    }
}

const jsonToHtml = (jsonStr) => {
    // const obj = JSON.parse(jsonStr);

    let html = '';
    jsonStr["blocks"].forEach(function (block, index) {
        switch (block['type']) {
            case 'paragraph':
                html += '<p>' + block['data']['text'] + '</p>';
                break;

            case 'header':
                html += '<h' + block['data']['level'] + '>' + block['data']['text'] + '</h' + block['data']['level'] + '>';
                break;

            case 'raw':
                html += block['data']['html'];
                break;

            case 'list':
                const lsType = (block['data']['style'] === 'ordered') ? 'ol' : 'ul';
                html += '<' + lsType + '>';
                block['data']['items'].forEach(function (item, index) {
                    html += '<li>' + item + '</li>';
                });
                html += '</' + lsType + '>';
                break;

            case 'code':
                html += '<pre><code class="language-' + block['data']['lang'] + '">' + block['data']['code'] + '</code></pre>';
                break;

            case 'image':
                html += '<div class="img_pnl"><img src="' + block['data']['file']['url'] + '" /></div>';
                break;
            case 'simpleImage':
                html += '<div class="img_pnl"><img src="' + block['data']['url'] + '" /></div>';
                break;
            case 'embed':
                if (block['data']['service'] === 'youtube') {
                    html += '<div class="embed-responsive embed-responsive-16by9"><iframe class="embed-responsive-item" style="width:100%;height:500px" src="' + block['data']['embed'] + '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
                }
                break;

            default:

                break;
        }
    });
    return html;
}

const jsonToText = (jsonStr) => {
    // const obj = JSON.parse(jsonStr);

    let html = '';
    jsonStr["blocks"].forEach(function (block, index) {
        switch (block['type']) {
            case 'paragraph':
                html += '' + block['data']['text'] + `
`;
                break;
            default:
                break;
        }
    });

    return html;
}

const checkNoImg = (name, image) => {
    if (image) {
        return image
    }
    if (name) {
        return `https://icotar.com/initials/${encodeURI(name)}.png?bg=06527E`
    }
    return 'https://icotar.com/avatar/craig.png?bg=06527E'
}

const formatMoneyNormal = (text) => {
    return text.toLocaleString()
}

// const formatMoney = (num) => {
//     if (!num || num === "") return "0";
//     let numberMoney = Number(num)
//       .toFixed(0)
//       .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
//     numberMoney = (numberMoney + "").replace(/,/g, "*");
//     numberMoney = numberMoney.replace(/\./g, ",");
//     numberMoney = numberMoney.replace(/\*/g, ".");
//     return numberMoney;
//   };

module.exports = {
    capitalizeFirstLetter,
    checkString,
    jsonToHtml,
    jsonToText,
    checkNoImg,
    formatMoneyNormal,
    formatMoney,
    formatMoneyCoin,
    formatMoneyCoin,
    formatNumberCoin,
    blackListInputNumber,
    blackListInputNumberWithoutDot,
    convertToSlug,
    convertUTCTimeToLocalTime
}