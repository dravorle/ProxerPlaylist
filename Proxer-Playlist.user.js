// ==UserScript==
// @name        Proxer-Playlist
// @author      Dravorle
// @description Fügt Proxer.me eine Playlist-Funktion hinzu. Durch ein Klick auf den Button "Zur Playlist hinzufügen" kann eine Folge eingereiht werden, danach kann über die Play-Funktion abgespielt werden.
// @include     https://proxer.me*
// @supportURL  https://proxer.me/forum/283/384556
// @updateURL   https://github.com/dravorle/ProxerPlaylist/raw/master/Proxer-Playlist.user.js
// @version     1.6.5: Kleine Veränderungen am Proxer-Player
// @version     1.6.4: Einbau des Proxer-Streams fertiggestellt
// @version     1.6.3: Vorbereitungen um einige Funktionen auszulagern
// @version     1.6.2: Vollbild-Funktion verschoben um sie API-Konform und damit funktionsfähig zu machen
// @version     1.6.1: Kleiner CSS-Fehler, der dafür sorgte, dass Items komisch dargestellt werden
// @version     1.6: Support für Mp4Upload & Streamcloud aktiviert
// @version     1.5.2: Fehler behoben, der dafür sorgte, dass der Player automatisch gestartet hat, wenn man zurückspult
// @version     1.5.1: Kleine Änderungen
// @version     1.5: Support für Mp4Upload vorbereitet, erste Tests mit Streamcloud ausgeführt (vorübergehend beides noch deaktiviert), Anzeige der Lade-Animation, wenn der Stream noch nicht geladen ist, kleine Aufräumarbeiten am Code
// @version     1.4: Design-Integration verbessert, nicht unterstützte Designs haben jetzt ein Default-Wert und werden in einem eigenen Style-Tag gespeichert
// @version     1.3: Support für das schwarze Design eingebaut, Script nimmt jetzt das Design, welches ausgewählt ist
// @version     1.2: Settings-Seite eingebaut ... auch wenn sie nicht viel bringt
// @version     1.1: Videos starten jetzt nicht mehr im Hintergrund und die Playlist kann nicht mehr geöffnet werden, wenn kein Element eingereiht ist.
// @version     1.0: Release-Version, derzeit nur Proxer-Stream unterstützt, weitere werden folgen, wenn erwünscht. Code muss an einigen Stellen noch aufgeräumt werden, Verbesserungen folgen.
// @version     0.1: Erster Umzug
// @require     https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require     https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js
// @require     https://cdn.proxer.me/libs/psplayer/psplayer.js?1
// @connect     proxer.me
// @connect     mp4upload.com
// @connect     streamcloud.eu
// @grant       GM_xmlhttpRequest
// @namespace   dravorle.proxer.me
// @run-at      document-end
// ==/UserScript==
$.fn.appendText = function (str) {
    return this.each(function(){ $(this).text( $(this).text() + str); });
};

var css = "#Proxer-Playlist{width:100px;height:45px;background-color:var(--main);display:inline;border-right:1px solid var(--accent2);border-top:1px solid var(--accent2);border-radius:0 10px 0 0;bottom:0;left:0;position:fixed;padding:5px;z-index:1;color:var(--text);transition:all .25s ease}#Proxer-Playlist.active{width:300px;height:525px}#Proxer-Playlist_Toggle{width:100%;text-align:center;cursor:pointer;user-select:none}#Proxer-Playlist_Toggle span{margin-top:5px;display:block}#Proxer-Playlist.active #Proxer-Playlist_Toggle span:after{content:'\\25BC'}#Proxer-Playlist.inactive #Proxer-Playlist_Toggle span:after{content:'\\25B2'}#Proxer-Playlist_Content{margin-top:5px;width:100%;height:calc(100% - 50px);overflow:auto;border:1px solid var(--accent)}#Proxer-Playlist_Content > div.entry{border-bottom:1px solid var(--accent);padding:5px;display:flex;justify-content:space-between;align-items:center}div.entry > div{margin:2px;max-width:135px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap}div.entry > div[title]{min-width:135px}.noContent{text-align:center}.menuPlaylist{display:inline-block;padding:1px 6px;text-decoration:none;color:var(--menuspecial);border:1px solid var(--accent);border-radius:6px}.menuPlaylist:hover{background-color:var(--menuspecial);color:var(--menuspecialtext)}#Proxer-Playlist_Content > div:nth-child(even){background-color:var(--mainhighlight)}#Proxer-Playlist.active > #Proxer-Playlist_Content{display:block}#Proxer-Playlist.inactive > #Proxer-Playlist_Content{display:none}#Proxer-Playlist_Player > div.dim{display:block;position:fixed;left:0;top:0;width:100%;height:100%;z-index:10;transition:all .25s ease;background-color:rgba(0,0,0,.75)}#Proxer-Playlist_Player div.playerWrapper{position:fixed;height:504px;width:728px;left:50%;top:50%;transform:translate(-50%,-50%);z-index:15}#Proxer-Playlist_Player video{background:url(https://proxer.me/images/misc/loading.gif) 50% no-repeat;background-color:#000}div.plyr__video-wrapper{cursor:pointer}.wMirror .menu[title=Proxer-Playlist]{user-select:none;margin-top:5px;margin-bottom:5px;width:250px}.menu[data-support=false],.menuPlaylist[data-support=false]{pointer-events:none;opacity:.5}.fa-up:before{content:'\\21d1'}.fa-down:before{content:'\\21d3'}.fa-settings:before{content:'\\2699'}.fa-share:before{content:'\\f152'}.SettingsWrapper{display:flex;align-items:center;justify-content:space-around;flex-wrap:wrap}.settings{text-transform:capitalize;margin:5px}";

var cssDesigns = [];
cssDesigns["gray"] = ":root{--main:#5E5E5E;--mainhighlight:#757575;--accent:#FFF;--accent2:#777;--text:#FFF;--menuspecial:#FFF;--menuspecialtext:#000}";
cssDesigns["black"] = ":root{--main:#000;--mainhighlight:#161616;--accent:#FFF;--accent2:#FFF;--text:#FFF;--menuspecial:#FFF;--menuspecialtext:#000}";
cssDesigns["iLoveEnes#Augenkrebs"] = ":root{--main:#fa00ff;--mainhighlight:#fa2bff;--accent:#FFF;--accent2:#FFF;--text:#FFF;--menuspecial:#FFF;--menuspecialtext:#000}";

//Noch nicht eingebaut, Default > Gray
cssDesigns["old_blue"] = cssDesigns["gray"];

//Sind wir mal ehrlich, wer benutzt das schon? Sieht doch kacke aus. Aber wenn die Leute schon Augenkrebs haben, dann doch bitte richtig!
cssDesigns["pantsu"] = cssDesigns["iLoveEnes#Augenkrebs"];

var supportedHosters = ["proxer-stream", "mp4upload", "streamcloud2"];
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
    
    injectStyle( cssDesigns[ $("head link[rel='stylesheet'][href*='/css/color/']").attr("title") ], "Proxer-Playlist_Design" );
    injectStyle( css, "Proxer-Playlist_Style" );
    
    injectStyle( "//cdn.proxer.me/libs/psplayer/psplayer.css", "Proxer-Playlist_PS", true );
    
    $(".colorbox").on("click", function() {
        injectStyle( cssDesigns[ $(this).attr("class").split(" ")[1] ], "Proxer-Playlist_Design" );
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
    
    trigger( "PlaylistInitiated" );
}

//Style wird mit einer ID in den Head von Proxer injected, dadurch ist es jederzeit möglich von einem Zusatzscript ebenfalls Styles für die Playlist einzufügen
function injectStyle( _css, id = null, reference = false ) {
    if(reference) {
        if( $( "head link#"+id ).length == 0 ) {
            $( "<link id='"+id+"' rel='stylesheet' type='text/css' href='"+_css+"' />" ).appendTo( "head" );
        } else {
            $( "head link#"+id ).attr("src", _css);
        }
    } else {
        if( id === null ) { id = "Proxer-Playlist_Style"; };
        if( $( "head style#"+id ).length == 0 ) {
            $( "<style id='"+id+"'> "+_css+" </style>" ).appendTo( "head" );
        } else {
            $( "head style#"+id ).text( _css );
        }
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
            var hoster = streams[s_id].type;
            var code = streams[s_id].code;
            
            AddToPlaylist( { AnimeTitle: $("span.wName").text(), Lang: $("span.wLanguage").text(), Ep: $("#wContainer span.wEp").text(), Hoster: hoster, Code: code } );
        });
    }
    
    //Playlist-Button unten links einbauen & mit Informationen füllen, wenn es bisher nicht existiert - sonst nichts tun
    if( $("#Proxer-Playlist").length > 0 ) {
        return;
    }
    $("#wrapper").after( $("<div id='Proxer-Playlist' class='"+( (Settings["active"] === true)?("active"):("inactive") )+"'> <div id='Proxer-Playlist_Toggle'> <a class='menuPlaylist' title='Play'><i class='fa fa-play'></i></a> <a class='menuPlaylist' href='/ucp?s=Proxer-Playlist' title='Settings'><i class='fa fa-settings'></i></a><br /><span> Playlist </span> </div> <div id='Proxer-Playlist_Content'>  </div> </div>") );
    $("#Proxer-Playlist_Toggle span").on("click", function() {
        setActiveState( $("#Proxer-Playlist").hasClass("active") );
    });
    
    $("#Proxer-Playlist_Toggle a[title='Play']").on("click", function() {
        if( $("#Proxer-Playlist_Content .entry").length > 0 ) {
            StartPlay();
            
            if( Settings["fullscreen"] === true && !isFullscreen() ) {
                openFullscreen();
            }
        }
    });
    
    UpdatePlaylist();
}

//TODO: Überarbeitung der Einstellungen, Beschreibung hinzufügen, mehr Einstellungen!
function StartSettingsPage() {
    StartDefault();
    $(".inner").eq(0).html("");
    $(".inner").eq(0).append("<div class='SettingsWrapper'></div>");
    
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
        $("<div id='Proxer-Playlist_Player' data-current=''><div class='dim'></div><div class='playerWrapper'><video class='plyr'></video></div></div>").appendTo("body");
        
        plyr.setup( { clickToPlay: false, iconUrl: "https://proxer.me/images/misc/psplayer.svg", volumeMax: 100 } );
        
        PlaylistVideo = $("#Proxer-Playlist_Player video")[0];
        PlaylistVideo.volume = Settings["volume"];
        
        trigger( "SetupPlyr" );
        
        $("#Proxer-Playlist_Player div.dim").on("click", function() {
            $(this).parent().hide();
            PlaylistVideo.pause();
        });
        
        $("#Proxer-Playlist_Player video").on("volumechange", function() {
            Settings = SetSettings( { volume: PlaylistVideo.volume } );
        });
        
        $("#Proxer-Playlist_Player div.plyr__video-wrapper").on("click", function() {
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
        
        $("#Proxer-Playlist_Player video").on("loadeddata", function() {
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
                $("#Proxer-Playlist_Player div.dim").trigger("click");
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
            handleRequest(firstItem.attr("data-hoster"), firstItem.attr("data-code"));
            
            if( Settings["savePosition"] === true ) {
                PlaylistVideo.currentTime = Settings["resumeTimer"];
            }
        } else {
            //Erstes Video laden und Werte bereinigen
            $("#Proxer-Playlist_Player").attr("data-current", firstItem.attr("data-code"));
            handleRequest(firstItem.attr("data-hoster"), firstItem.attr("data-code"));
            
            Settings = SetSettings( { lastCode: firstItem.attr("data-code"), resumeTimer: 0 } );
        }
    }
}

function handleRequest(hoster, code) {
    var method = "GET";
    var data = "";
    var header = {};
    if(hoster === "streamcloud2") {
        method = "POST";
        data = "op=download2&usr_login=&id="+code;
        header = { "Content-Type": "application/x-www-form-urlencoded" };
    }
    
    GM_xmlhttpRequest({
        method: method,
        url: getMirrorUrl(hoster, code),
        data: data,
        headers: header,
        onload: function(response) {
            //Video-Url aus Response lesen
            var videoUrl = "";
            switch(hoster) {
                case "proxer-stream":
                    videoUrl = $(response.responseText).find("source").attr("src");
                    break;
                case "mp4upload":                    
                    //Link der Source aus dem Code auslesen, da versuchen die doch echt es zu verstecken ;3
                    var regex = /\|([w]{3}\d+)\|.*\|video\|([a-z1-9]*)\|(\d+)\|/g;
                    var result = regex.exec(response.responseText);
                    videoUrl = "https://"+result[1]+".mp4upload.com:"+result[3]+"/d/"+result[2]+"/video.mp4";
                    break;
                case "streamcloud2":
                    var regex = /file\: \"(http\:\/\/.*video.mp4)\"/g;
                    videoUrl = regex.exec(response.responseText)[1];
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
    var url = "";
    switch(hoster) {
        case "proxer-stream":
            url = "https://stream.proxer.me/embed-"+code+"-728x504.html?utype=over9000";
            break;
        case "mp4upload":
            url = "https://www.mp4upload.com/embed-"+code+".html";
            break;
        case "streamcloud2":
            url = "http://streamcloud.eu/"+code;
            break;
        default:
            break;
    }
    return url;
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

function trigger(eventName) {
    console.log( "Triggered: " + eventName );
    $(window).trigger( eventName );
}