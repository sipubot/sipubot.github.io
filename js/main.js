var SipuMain = (function(SipuMain, $, undefined) {
  var DATA = {
    MASTER_URL: "",
    IMOJI_LIST : ["status-sad.png","status-nom.png","status-hap.png"],
    IMOJI_BACK : ["#ef6f45","#c0c0c0","#94de59"]
  };

  var VERIFY = {
    OnlyChar: function(obj) {
      obj = obj.replace(/[^(가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9)]/gi, "");
      return obj;
    },
    OutSpecial: function(obj) {
      obj = obj.replace(/[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi, ""); // 특수문자 제거
      return obj;
    },
    OnlyNumber: function(obj) {
      obj = obj.replace(/[^\d\.]/g, "");
      return obj;
    },
    RemoveQuot: function(obj) {
      obj = obj.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
      return obj;
    },
    RemoveJQ: function(obj) {
      obj = obj.replace(".", "").replace("#", "");
      return obj;
    },
		UrlLinker : function (obj) {
			var urlRegex = /(https?:\/\/[^\s]+)/g;
	    return obj.replace(urlRegex, function(url) {
	        return '<a href="' + url + '" target="_blank">&#128279</a>';
	    });
		}
  };

  var NODES = {
    init: function() {
      var node = document.getElementsByTagName("*");
      var datatag = "data-node";
      var attrValue = "None";
      var tag = "";
      for (var i = 0; i < node.length; i++) {
        if (node[i].hasAttribute(datatag) || node[i].getAttribute(datatag) !== null) {
          if (node[i].getAttribute(datatag).length > 0) {
            attrValue = node[i].getAttribute(datatag);
          }
          tag = node[i].tagName;
          if (!NODES[tag]) {
            NODES[tag] = {};
          }
          if (!NODES[tag][attrValue]) {
            NODES[tag][attrValue] = [];
          }
          NODES[tag][attrValue].push(node[i]);
        }
      }
    },
    log: function() {
      console.log(this);
    }
  };
  //노드맵은 초기 생성필요
  NODES.init();

  var REQUEST = {
    LINK: {
      MASTER: DATA.MASTER_URL,
    },
    RQLINK: "",
    RQTYPE: "POST",
    RQDATA: {
      TIMELINE: ""
    },
    rqPermit: true,
    rQCallbackMethod: {},
    rQMethod: {},
    rqQ: function(namespace) {
      if (!REQUEST.rqPermit) {
        return false;
      }
      $.ajax({
          url: REQUEST.RQLINK,
          type: REQUEST.RQTYPE,
          data: REQUEST.RQDATA,
          beforeSend: function(xhr) {
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType("application/json");
            }
          },
          dataType: 'json',
          scriptCharset: "utf-8",
          error: function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
          }
        })
        .done(function(data) {
          if (typeof REQUEST.rQCallbackMethod[namespace] === "function") {
            REQUEST.rQCallbackMethod[namespace](data);
          }
        })
        .fail(function() {
          console.log("송수신 실패");
        });
    },
    rQMethodSet: function(namespace, addURL, func, callback) {
      REQUEST.rQMethod[namespace] = function() {
        REQUEST.RQLINK = REQUEST.LINK.MASTER + addURL;
        REQUEST.RQDATA.RQ = namespace;
        func();
        REQUEST.rqQ(namespace);
      };
      REQUEST.rQCallbackMethod[namespace] = callback;
    },
    init: function() {},
    log: function() {
      console.log(this);
    }
  };

  var EVENT = {
    BUTTON: {},
    INPUT: {},
    setClick: function(namespace, func) {
      $.each(NODES.BUTTON[namespace], function(i) {
        $(this).click(function() {
          func();
        });
      });
    },
    setEnter: function(namespace, func) {
      $.each(NODES.INPUT[namespace], function(i) {
        $(this).keydown(function(e) {
          if (e.which == 13) {
            func();
          }
        });
      });
    },
    setTrigger: function() {},
    initFunc: {},
    init: function() {
      $.each(EVENT.initFunc, function(key, func) {
        if (typeof EVENT.initFunc[key] === "function") {
          func.apply();
        }
      });
    },
    trigger: function() {
      this.setTrigger();
    },
    log: function() {
      console.log(this);
    }
  };

  function getNode(tagName) {
    var temp = {};
    var node = document.getElementsByTagName("*");
    var datatag = tagName;
    var attrValue = "None";
    var tag = "";
    for (var i = 0; i < node.length; i++) {
      if (node[i].hasAttribute(datatag) || node[i].getAttribute(datatag) !== null) {
        if (node[i].getAttribute(datatag).length > 0) {
          attrValue = node[i].getAttribute(datatag);
        }
        tag = node[i].tagName;
        if (!temp[tag]) {
          temp[tag] = {};
        }
        if (!temp[tag][attrValue]) {
          temp[tag][attrValue] = [];
        }
        temp[tag][attrValue].push(node[i]);
      }
    }
    return temp;
  }

  var MAPPING = {
    UL: {
      Stat: function() {
        $.each(arguments[0], function(index, data) {
          $(NODES.UL.App).append('<li style="background-image : url(' + data.ImageLink + ')"><a href="' + data.Link + '" title="' + data.Title + '" target="_blank"></a></li>');
        });
      },
      App: function() {
        $(NODES.UL.App).empty();
        $.each(arguments[0], function(index, data) {
          $(NODES.UL.App).append('<li style="background-image : url(' + data.ImageLink + ')"><a href="' + data.Link + '" title="' + data.Title + '" target="_blank"></a></li>');
        });
      },
      Link: function() {
        $(NODES.UL.Link).empty();
        $.each(arguments[0], function(index, data) {
          $(NODES.UL.Link).append('<li style="background-image : url(' + data.ImageLink + ')"><a href="' + data.Link + '" title="' + data.Title + '" target="_blank"></a></li>');
        });
      },
      Board: function() {
        $(NODES.UL.Board).empty();
        $.each(arguments[0], function(index, data) {
          if (index < 10) {
            $(NODES.UL.Board).append('<li>' + VERIFY.UrlLinker(data.Qut) + '<time>' + data.Time + '</time></li>');
          }
        });
      }
    },
    SPAN: {
      Bio: function() {
        $(NODES.SPAN.Bio).empty();
        $(NODES.SPAN.Bio).html(arguments[0][0].Qut);
      }
    }
  };

  REQUEST.rQMethodSet("BoardInsert", "/QutInsert", function () {
    REQUEST.RQDATA.TIMELINE = VERIFY.RemoveQuot($(NODES.TEXTAREA.BoardInsert).val());
  }, function () {
    $(NODES.UL.Board).prepend('<li>' + VERIFY.UrlLinker($(NODES.TEXTAREA.BoardInsert).val()) + '<time>now</time></li>');
	$(NODES.TEXTAREA.BoardInsert).val("");
  });

  EVENT.setClick("BoardInsert", function () {
    if ($(NODES.TEXTAREA.BoardInsert).val().length < 2) {
       return false;
    } else {
       REQUEST.rQMethod.BoardInsert();
    }
  });
  EVENT.initFunc.Bio = function() {
    $.getJSON(DATA.MASTER_URL + "data/datamain.json", MAPPING.SPAN.Bio);
  };
  EVENT.initFunc.App = function() {
    $.getJSON(DATA.MASTER_URL + "data/dataapp.json", MAPPING.UL.App);
  };
  EVENT.initFunc.Link = function() {
    $.getJSON(DATA.MASTER_URL + "data/datalink.json", MAPPING.UL.Link);
  };
  EVENT.initFunc.Board = function() {
    $.getJSON(DATA.MASTER_URL + "data/databoard.json", MAPPING.UL.Board);
  };
  EVENT.initFunc.Profile = function() {
    life();
    SetStat();
  };


  function life() {
    var sheep = 0;
    var sp = document.getElementById('lifetime');
    var sp2 = document.getElementById('lifeplace');
    var startval = 1089658152;
    var func = function() {
      var addval = new Date() - new Date("2015-01-01");
      var nowHour = new Date().getUTCHours();
      if (nowHour > -1 && nowHour < 14) {
        nowHour = nowHour + 9;
      } else {
        nowHour = nowHour - 15;
      }
      sp.innerHTML = startval + Math.floor(addval / 1000);
      sp2.innerHTML = getPlace(nowHour);
    };

    function getPlace(h) {
      var weekNumber = (new Date()).getDay();
      if (0 < weekNumber && 5 >= weekNumber) {
        switch (true) {
          case (7 > h):
            sheep++;
            return sheep + " sheep... zzZ";
          case (18 > h && 7 <= h):
            sheep = 0;
            return "Mining Coin";
          case (18 <= h && 21 > h):
            return "Exercise";
          case (21 <= h):
            return "FreeTime on Week!";
          default:

        }
      } else {
        switch (true) {
          case (7 > h):
            sheep++;
            return sheep + " sheep... zzZ";
          case (7 <= h):
            sheep = 0;
            return "Weekend Plan!";
          default:
        }
      }
    }
    setInterval(func, 1000);
  }
  
  function SetStat() {
	$.getJSON(DATA.MASTER_URL + "json/dataperson.json", Rfunc);
	function Rfunc(v) {
		var passpoint = 10;
		var wa = v.map(function (a) {
				return +a["WAdata"];
		}).slice(0, 7); 
		var point = [50, 20, 10, 5, 3, 2];
		var rp = Array.apply(null, Array(6)).map(function (a, i) {
				return wa[i] - wa[i + 1] >= passpoint ? point[i] : 0;
		}).reduce(function (s, a) {
				return s + a;
		}, 0);  
		var picidx = [Math.round((+v[0]["PAdata"])/53)
		    ,Math.round((+v[0]["GAdata"])/53)
			,Math.round(rp/53)];
		var node = $(".Status > li");
		$.each(node,function (i,n) {
			$(n).css("background-image","url(/icon/"+DATA.IMOJI_LIST[picidx[i]]+")");
			$(n).css("background-color",DATA.IMOJI_BACK[picidx[i]]);
		});
	}
  }
 
  SipuMain.run = function() {
    // 기본실행
    REQUEST.init();
    EVENT.init();
  };
  return SipuMain;
})(window.SipuMain || {}, jQuery);
SipuMain.run();
