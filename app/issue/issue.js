var SIPUISSUE = (function (SIPUISSUE, $, undefined) {
    "use strict";
    //util here
    var VERIFY = {
        OnlyChar: function (obj) {
            obj = obj.replace(/[^(가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9)]/gi, "");
            return obj;
        },
        OutSpecial: function (obj) {
            obj = obj.replace(/[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi, ""); // 특수문자 제거    
            return obj;
        },
        OnlyNumber: function (obj) {
            obj = obj.replace(/[^\d\.]/g, "");
            return obj;
        },
        RemoveQuot: function (obj) {
            obj = obj.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
            return obj;
        },
        RemoveJQ: function (obj) {
            obj = obj.replace(".", "").replace("#", "");
            return obj;
        },
        UrlLinker: function (obj) {
            var urlRegex = /(https?:\/\/[^\s]+)/g;
            return obj.replace(urlRegex, function (url) {
                return '<a href="' + url + '" target="_blank">&#128279</a>';
            });
        },
        Length: function (obj) {
            return typeof (obj) === "string" && obj.length > 3;
        }
    };
    function init() {
        fetch("./app/issue/list.json")
        .then(re=>re.json())
        .then(data=>{
            console.log(data)
           var ul = document.getElementById("list");
           var text = "";
           data.map(a=>{
                text += `<li><a href="${(a.more =="디시") ? "https://gall.dcinside.com"+a.link : a.link}" target="_blank" >${a.title}</a></li>`;
            });
            ul.innerHTML = text;
        });
    }

    SIPUISSUE.run = function () {
        init();
        //life();
        //Snail.start();
    };
    return SIPUISSUE;
})(window.SIPUISSUE || {}, jQuery);
SIPUISSUE.run();
