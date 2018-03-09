// ==UserScript==
// @name        Proxer-Playlist
// @author      Dravorle
// @description Fügt Proxer.me eine Playlist-Funktion hinzu. Durch ein Klick auf den Button "Zur Playlist hinzufügen" kann eine Folge eingereiht werden, danach kann über die Play-Funktion abgespielt werden.
// @include     https://proxer.me*
// @include     https://stream.proxer.me/embed-*
// @version     1.3: Support für das schwarze Design eingebaut, Script nimmt jetzt das Design, welches ausgewählt ist
// @version     1.2: Settings-Seite eingebaut ... auch wenn sie nicht viel bringt
// @version     1.1: Videos starten jetzt nicht mehr im Hintergrund und die Playlist kann nicht mehr geöffnet werden, wenn kein Element eingereiht ist.
// @version     1.0: Release-Version, derzeit nur Proxer-Stream unterstützt, weitere werden folgen, wenn erwünscht. Code muss an einigen Stellen noch aufgeräumt werden, Verbesserungen folgen.
// @version     0.1: Erster Umzug
// @connect     proxer.me
// @grant       GM_xmlhttpRequest
// @namespace   dravorle.proxer.me
// @run-at      document-end
// ==/UserScript==
$.fn.appendText = function (str) {
    return this.each(function(){ $(this).text( $(this).text() + str); });
};

var css = "#Proxer-Playlist{width:100px;height:45px;background-color:var(--main);display:inline;border-right:1px solid var(--accent2);border-top:1px solid var(--accent2);border-radius:0 10px 0 0;bottom:0;left:0;position:fixed;padding:5px;z-index:1;color:var(--text);transition:all .25s ease}#Proxer-Playlist.active{width:300px;height:525px}#Proxer-Playlist_Toggle{width:100%;text-align:center;cursor:pointer;user-select:none}#Proxer-Playlist_Toggle span{margin-top:5px;display:block}#Proxer-Playlist.active #Proxer-Playlist_Toggle span:after{content:'\\25BC'}#Proxer-Playlist.inactive #Proxer-Playlist_Toggle span:after{content:'\\25B2'}#Proxer-Playlist_Content{margin-top:5px;width:100%;height:calc(100% - 50px);overflow:auto;border:1px solid var(--accent)}#Proxer-Playlist_Content > div.entry{border-bottom:1px solid var(--accent);padding:5px;display:flex;justify-content:space-between;align-items:center}div.entry > div{margin:2px;max-width:135px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.noContent{text-align:center}.menuPlaylist{display:inline-block;padding:1px 6px;text-decoration:none;color:var(--menuspecial);border:1px solid var(--accent);border-radius:6px}.menuPlaylist:hover{background-color:var(--menuspecial);color:var(--menuspecialtext)}#Proxer-Playlist_Content > div:nth-child(even){background-color:var(--mainhighlight)}#Proxer-Playlist.active > #Proxer-Playlist_Content{display:block}#Proxer-Playlist.inactive > #Proxer-Playlist_Content{display:none}#Proxer-Playlist_Player > div{display:block;position:fixed;left:0;top:0;width:100%;height:100%;z-index:10;transition:all .25s ease;background-color:rgba(0,0,0,.75)}#Proxer-Playlist_Player > video{position:fixed;height:504px;width:728px;left:50%;top:50%;transform:translate(-50%,-50%);background-color:#000;z-index:15}.wMirror .menu[title=Proxer-Playlist]{user-select:none;margin-top:5px;width:250px}.menu[data-support=false],.menuPlaylist[data-support=false]{pointer-events:none;opacity:.5}.fa-up:before{content:'\\21d1'}.fa-down:before{content:'\\21d3'}.fa-settings:before{content:'\\2699'}.SettingsWrapper{display:flex;align-items:center;justify-content:space-around;flex-wrap:wrap}.settings{text-transform:capitalize;margin:5px}";

var cssDesigns = [];
cssDesigns["gray"] = ":root{--main:#5E5E5E;--mainhighlight:#757575;--accent:#FFF;--accent2:#777;--text:#FFF;--menuspecial:#FFF;--menuspecialtext:#000}";
cssDesigns["black"] = ":root{--main:#000;--mainhighlight:#161616;--accent:#FFF;--accent2:#FFF;--text:#FFF;--menuspecial:#FFF;--menuspecialtext:#000}";
cssDesigns["iLoveEnes#Augenkrebs"] = ":root{--main:#fa00ff;--mainhighlight:#fa2bff;--accent:#FFF;--accent2:#FFF;--text:#FFF;--menuspecial:#FFF;--menuspecialtext:#000}";

//Noch nicht eingebaut, Default > Gray
cssDesigns["old_blue"] = cssDesigns["gray"];

//Sind wir mal ehrlich, wer benutzt das schon? Sieht doch kacke aus. Aber wenn die Leute schon Augenkrebs haben, dann doch bitte richtig!
cssDesigns["pantsu"] = cssDesigns["iLoveEnes#Augenkrebs"] ;

var supportedHosters = ["proxer-stream"];
var Settings;
var PlaylistVideo;

Startup();
$(document).ajaxSuccess(function() {
    Startup();
});

function Startup() {
    if( $("#ProxerPlaylistCheck").length > 0 ) {
        return;
    }
    //Test-Element in #main setzen, wenn dieses gesetzt ist, dann hat das Script alle nötigen Elemente innerhalb #main auch bereits gesetzt und muss diese nicht neu machen!
    $("<input type='hidden' id='ProxerPlaylistCheck' />").appendTo("#main");
    injectStyle();
    
    $(".colorbox").on("click", function() {
        injectStyle( $(this).attr("class").split(" ")[1] );
    });
    
    Settings = GetSettings();

    /*
    * Prüfen auf welcher Seite man sich gerade befindet und dementsprechend andere Funktion ausführen
    */
    var CurrPage = window.location.href;
    if(CurrPage.indexOf("//stream.proxer.me") > -1) {
        //StartStreamPage();
    } else if(CurrPage.indexOf("//proxer.me/ucp?s=Proxer-Playlist") > -1) {
        CreateSettingNavigationPoint(true);
    } else if(CurrPage.indexOf("//proxer.me/ucp") > -1) {
        CreateSettingNavigationPoint();
    }
    StartDefault();
}

function injectStyle( style = null ) {
    var proxerStyle = (style !==null)?style:$("head link[rel='stylesheet'][href*='/css/color/']").attr("title");
    if( $("head style").length > 0 ) {
        $("head style").first().text( cssDesigns[ proxerStyle ]+css);
    } else {
        $("<style>"+cssDesigns[ proxerStyle ]+css+"</style>").appendTo("head");
    }
}

function StartDefault() {
    //Button zum zufügen in die Playlist unter die Mirror einfügen, wenn mindestens ein Mirror vorhanden ist
    if( $(".menu.changeMirror").length > 0 ) {
        $("<br /><a href='javascript:;' class='menu' data-support='"+ isSupported( $("a.menu.active").attr("id").substr(7)) +"' title='Proxer-Playlist'>Zur Playlist hinzufügen</a>").appendTo("td.wMirror");
        $("a.menu.changeMirror").on("click", function() {
            $("a.menu[title='Proxer-Playlist']").attr("data-support", isSupported( $(this).attr("id").substr(7) ) );
        });
        $("a.menu[title='Proxer-Playlist']").on("click", function() {
            AddToPlaylist( { AnimeTitle: $("span.wName").text(), Lang: $("span.wLanguage").text(), Ep: $("#wContainer span.wEp").text(), Hoster: $("a.menu.active").attr("id").substr(7), Code: $("div.wStream > iframe").attr("src").match(/([a-z0-9]{12})/g)[0] } );
        });
    }
    
    //Playlist-Button unten Links einbauen & mit Informationen füllen, wenn es bisher nicht existiert - sonst nichts tun
    if( $("#Proxer-Playlist").length > 0 ) {
        return;
    }
    $("#wrapper").after( $("<div id='Proxer-Playlist' class='"+( (Settings["active"] === true)?("active"):("inactive") )+"'> <div id='Proxer-Playlist_Toggle'> <a class='menuPlaylist' title='Play'><i class='fa fa-play'></i></a> <a class='menuPlaylist' href='/ucp?s=Proxer-Playlist' data-ajax='true' title='Settings'><i class='fa fa-settings'></i></a><br /><span> Playlist </span> </div> <div id='Proxer-Playlist_Content'>  </div> </div>") );
    $("#Proxer-Playlist_Toggle span").on("click", function() {
        setActiveState( $("#Proxer-Playlist").hasClass("active") );
    });
    
    $("#Proxer-Playlist_Toggle a[title='Play']").on("click", function() {
        if( $("#Proxer-Playlist_Content .entry").length > 0 ) {
            StartPlay();
        }
    });
    
    UpdatePlaylist();
}

function StartStreamPage() {
    $("<button class='Btn_TogglePlaylist'>+</button>").appendTo("div.flowplayer");
    $(".Btn_TogglePlaylist").on("click", function() {
        parent.postMessage($("video source").attr("src"), "*");
    });
}

function StartSettingsPage() {
    StartDefault();
    $(".inner").html("");
    $(".inner").append("<div class='SettingsWrapper'></div>");
    
    $("<p> Hier könnten noch mehr Einstellungen kommen, wenn ich dazu komme ... ALL HAIL LOLIS </p>").appendTo(".inner");
    
    var keys = [ "Proxer-Playlist", "Proxer-Playlist_Settings" ];
    var _total = 0;
    for(var i = 0; i < keys.length; i++) {
            _total += ( typeof(localStorage[keys[i]]) !== "undefined" )? ( ( (localStorage[keys[i]].length + keys[i].length) * 2 ) / 1024 ) : 0;
    }
    $("<br /> <br /><p> Script belegt "+ _total.toFixed(2) + " KB LocalStorage-Speicher. </p>").appendTo(".inner");
    
    for(_s in Settings) {
        var type = typeof Settings[_s];

        if( type === "boolean" ) {
            $("<div class='settings'><label>"+_s+"</label> <input id='"+_s+"' type='checkbox' "+( (Settings[_s]===true)?("checked"):"" )+"/></div>").appendTo(".SettingsWrapper");
        }
    }
    $(".settings input").on("change", function() {
        var tmp = {};
        tmp[$(this).attr("id")] = $(this).is(":checked");
        Settings = SetSettings( tmp );
        
        if( $(this).attr("id") === "active") {
            setActiveState( !Settings["active"] );
        }
        
        create_message(0, 5000, $(this).attr("id") + "-Wert gespeichert.");
    });
}

function CreateSettingNavigationPoint(active = false) {
    if(active) {
        $("#main ul#simple-navi li.active").removeClass("active");
        $("<li class='active'><a href='/ucp?s=Proxer-Playlist'>Proxer-Playlist</a></li>").appendTo("#main ul#simple-navi");
        
        StartSettingsPage();
    } else {
        $("<li><a href='/ucp?s=Proxer-Playlist'>Proxer-Playlist</a></li>").appendTo("#main ul#simple-navi");
    }
}

function StartPlay() {
    if( $("#Proxer-Playlist_Player").length === 0 ) {
        $("<div id='Proxer-Playlist_Player' data-current=''><div></div><video oncontextmenu='return(false);' controls controlsList='nodownload'>></video></div>").appendTo("body");
        PlaylistVideo = $("#Proxer-Playlist_Player video")[0];
        
        PlaylistVideo.volume = Settings["volume"];
        
        $("#Proxer-Playlist_Player div").on("click", function() {
            $(this).parent().hide();
            
            PlaylistVideo.pause();
            Settings = SetSettings( { lastCode: $(this).parent().attr("data-current") } );
            if( Settings["savePosition"] === true ) {
                Settings = SetSettings( { resumeTimer: PlaylistVideo.currentTime } );
            }
        });
        
        $("#Proxer-Playlist_Player video").on("volumechange", function() {
            Settings = SetSettings( { volume: PlaylistVideo.volume } );
        });
        
        $("#Proxer-Playlist_Player video").on("click", function() {
            if( PlaylistVideo.paused ) {
                PlaylistVideo.play();
            } else {
                PlaylistVideo.pause();
            }
        });
        
        $("#Proxer-Playlist_Player video").on("pause", function() {
            if ( Settings["savePosition"] === true ) {
                Settings = SetSettings( { resumeTimer: PlaylistVideo.currentTime } );
            }
        });
        
        $("#Proxer-Playlist_Player video").on("canplay", function() {
            if( Settings["fullscreen"] === true && !isFullscreen() ) {
                //Currently not working either way ._.
                //openFullscreen();
            }
            if( $(this).parent().is(":visible") ) {
                PlaylistVideo.play();
            }
        });
        
        $("#Proxer-Playlist_Player video").on("ended", function() {
            console.log("Video ended, check for next video");
            RemoveFromPlaylist();
            
            if( $("#Proxer-Playlist_Content .entry").length > 0 ) {
                console.log("Found next video, loading!");
                loadVideo();
            } else {
                console.log("No Videos left, closing");
                //Wenn Fullscreen offen ist, dann schließen
                if( isFullscreen() ) {
                    closeFullscreen();
                }
                $("#Proxer-Playlist_Player div").trigger("click");
            }
        });
    } else {
        $("#Proxer-Playlist_Player").show();
    }
    
    loadVideo();
}

function loadVideo() {
    //Video vorbereiten, Link raussuchen und Werte in den Player geben
    var currCode = $("#Proxer-Playlist_Player").attr("data-current");
    var firstItem = $("#Proxer-Playlist_Content .entry").first();
    if( currCode !== "" ) {
        //Wenn bereits ein Video geladen ist, dann prüfen ob dieses noch das erste Element in der Playlist ist, sonst austauschen
        if( currCode !== firstItem.attr("data-code") ) {
            //Das erste Item hat inzwischen gewechselt, neues Item laden und alle vorher gespeicherten Werte bereinigen!
            $("#Proxer-Playlist_Player").attr("data-current", firstItem.attr("data-code"));
            
            //PlaylistVideo.src = handleRequest(firstItem.attr("data-hoster"), firstItem.attr("data-code"));
            handleRequest(firstItem.attr("data-hoster"), firstItem.attr("data-code"));
            
            Settings = SetSettings( { lastCode: firstItem.attr("data-code"), resumeTimer: 0 } );
        } else {
            //Kein neuladen erforderlich, einfach nur wieder starten!
            PlaylistVideo.play();
        }
    } else {
        //Bisher wurde kein Video geladen, schauen welches Video das letzte mal geladen war, wenn dies wieder geladen werden soll, dann laden & Fortschritt einfügen
        if( Settings["lastCode"] === firstItem.attr("data-code") ) {
            //Video einfügen und Fortschritt setzen
            $("#Proxer-Playlist_Player").attr("data-current", firstItem.attr("data-code"));
            
            //PlaylistVideo.src = handleRequest(firstItem.attr("data-hoster"), firstItem.attr("data-code"));
            handleRequest(firstItem.attr("data-hoster"), firstItem.attr("data-code"));
            
            if( Settings["savePosition"] === true ) {
                PlaylistVideo.currentTime = Settings["resumeTimer"];
            }
        } else {
            //Erstes Video laden und Werte bereinigen
            $("#Proxer-Playlist_Player").attr("data-current", firstItem.attr("data-code"));
            
            //PlaylistVideo.src = handleRequest(firstItem.attr("data-hoster"), firstItem.attr("data-code"));
            handleRequest(firstItem.attr("data-hoster"), firstItem.attr("data-code"));
            
            Settings = SetSettings( { lastCode: firstItem.attr("data-code"), resumeTimer: 0 } );
        }
    }
}

function handleRequest(hoster, code) {
    GM_xmlhttpRequest({
        method: "GET",
        url: getMirrorUrl(hoster, code),
        onload: function(response) {
            //Video-Url aus Response lesen
            var videoUrl = "";            
            switch(hoster) {
                case "proxer-stream":
                    videoUrl = $(response.responseText).find("source").attr("src");
                    break;
                default:

                    break;
            }
            PlaylistVideo.src = videoUrl;
        }
    });
}

function getMirrorUrl(hoster, code) {
    //Später noch anpassen, dass hier der Link je nach Hoster angepasst wird, wie in Proxer hinterlegt.
    return "https://stream.proxer.me/embed-"+code+"-728x504.html?utype=over9000";
}

function setActiveState(isActive) {
    if(isActive) {
        $("#Proxer-Playlist").switchClass( "active", "inactive" );
    } else {
        $("#Proxer-Playlist").switchClass( "inactive", "active" );
    }
    Settings = SetSettings( { active: !isActive } );
}

function isSupported(id) {
    return( $.inArray(id, supportedHosters) > -1 );
}

function isFullscreen() {
    return (document.fullscreen === true || document.webkitIsFullScreen === true || document.mozFullScreen === true );
}

//Currently not working due to restrictions of API requiring a user interaction
function openFullscreen() {
    if(PlaylistVideo.requestFullscreen) {
        PlaylistVideo.requestFullscreen();
    } else if(PlaylistVideo.mozRequestFullScreen) {
        PlaylistVideo.mozRequestFullScreen();
    } else if(PlaylistVideo.webkitRequestFullscreen) {
        PlaylistVideo.webkitRequestFullscreen();
    }
}

function closeFullscreen() {
    if(document.exitFullscreen) {
        document.exitFullscreen();
    } else if(document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if(document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
}

function UpdatePlaylist(clear = true) {
    if(clear) {
        $("#Proxer-Playlist_Content").children().remove();
    }
    var Items = GetPlaylistItems();
    if(Items.length > 0) {
        for(var i = 0; i < Items.length; i++) {
            var _i = Items[i];           
            
            var imgLang = "<img src='/images/flag/"+( (_i["Lang"]=="EngSub"||_i["Lang"]=="EngDub")?("english"):("german") )+".gif'/>";
            var title = "<div title='"+_i["AnimeTitle"]+"'>"+_i["AnimeTitle"]+"</div><div>#"+_i["Ep"]+"</div>";
            
            var aUp = "<div><a href='javascript:;' title='MoveUp' class='menuPlaylist'> <i class='fa fa-up'></i> </a>";
            var aDown = " <a href='javascript:;' title='MoveDown' class='menuPlaylist'> <i class='fa fa-down'></i> </a>";
            var aRemove = " <a href='javascript:;' title='Remove' class='menuPlaylist'> <i class='fa fa-times'></i> </a></div>";
            
            $("<div class='entry' data-pos='"+i+"' data-code='"+_i["Code"]+"' data-hoster='"+_i["Hoster"]+"'>"+imgLang+" "+title+" "+aUp+aDown+aRemove+"</div>").appendTo("#Proxer-Playlist_Content");
        }
        
        $(".entry a[Title='MoveUp']").on("click", function() {
            // FUNCTION FOR MOVING EPISODE UP IN POSITION, nur möglich wenn derzeitige Position > 0
            if( $(this).parent().parent().attr("data-pos") > 0 ) {
                MoveItemInPlaylist( $(this).parent().parent().attr("data-pos"), -1 );
            }
        });
        
        $(".entry a[Title='MoveDown']").on("click", function() {
            // FUNCTION FOR MOVING EPISODE DOWN IN POSITION, nur möglich, wenn derzeitige Position < maxPosition
            if( $(this).parent().parent().attr("data-pos") < ($("#Proxer-Playlist_Content").children().length - 1) ) {
                MoveItemInPlaylist( $(this).parent().parent().attr("data-pos"), 1 );
            }
        });
        
        $(".entry a[Title='Remove']").on("click", function() {
            // FUNCTION FOR DELETING EPISODE FROM PLAYLIST
            RemoveFromPlaylist( $(this).parent().parent().attr("data-pos") );
        });
    } else {
        $("<div class='noContent'> Keine Folgen in der Playlist! </div>").appendTo("#Proxer-Playlist_Content");
    }
}

function AddToPlaylist(eObj) {
    var currItems = GetPlaylistItems();
    currItems.push(eObj);
    WriteToStorage( "Proxer-Playlist", currItems );
    create_message(0, 5000, eObj["AnimeTitle"]+" #"+eObj["Ep"]+" zur Playlist zugefügt!");
    UpdatePlaylist();
}

function RemoveFromPlaylist(id = 0) {
    var currItems = GetPlaylistItems();
    currItems.splice( id, 1 );
    WriteToStorage( "Proxer-Playlist", currItems );
    UpdatePlaylist();
}

function MoveItemInPlaylist(id, direction) {
    var currItems = GetPlaylistItems();
    var targetId = (+id) + (+direction);
    currItems.splice( targetId, 0, currItems.splice( id, 1 )[0] );
    WriteToStorage( "Proxer-Playlist", currItems );
    UpdatePlaylist();
}

function GetPlaylistItems() {
    var Items = GetFromStorage("Proxer-Playlist");
    return (Items !== null)?Items:[];
}

//Einstellung aus LocalStorage auslesen
function GetSettings(key = null) {
    var Settings = GetFromStorage("Proxer-Playlist_Settings");
    if(Settings === null) {
        Settings = SetSettings();
    }
    return (key!==null)?Settings[key]:Settings;
}

//Einstellungen durchgehen und in LocalStorage schreiben
function SetSettings(settings = null) {
    //Wenn Input = null, dann Standardeinstellungen schreiben
    if(settings === null) {
        var defaultSettings = { active: false, fullscreen: false, savePosition: true, nextEpisodeTimer: 0, volume: 1.0, lastCode: "", resumeTimer: 0 };
        WriteToStorage( "Proxer-Playlist_Settings", defaultSettings );
        return defaultSettings;
    }
    
    var currSettings = GetSettings();
    for( var key in settings ) {
        currSettings[key] = settings[key];
    }
    WriteToStorage( "Proxer-Playlist_Settings", currSettings );
    return currSettings;
}

function GetFromStorage(key) {
    return JSON.parse( localStorage.getItem(key) );
}

function WriteToStorage(key, jObj) {
    localStorage.setItem( key, JSON.stringify(jObj) );
}
