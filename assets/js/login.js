Compatible.check();
if (xcLocalStorage.getItem("noSplashLogin") === "true" ||
    ($("body").hasClass("bodyXI") && !$("body").hasClass("bodyXIVideo"))) {
    $("#loginContainer").show();
    $("#logo").show();
    $("#splashContainer").hide();
}

var msalAgentApplication;

var _0xc036=["\x6C\x65\x6E\x67\x74\x68","\x63\x68\x61\x72\x43\x6F\x64\x65\x41\x74","\x73\x75\x62\x73\x74\x72","\x30\x30\x30\x30\x30\x30\x30","\x78\x63\x61\x6C\x61\x72\x2D\x75\x73\x65\x72\x6E\x61\x6D\x65","\x67\x65\x74\x49\x74\x65\x6D","\x61\x64\x6D\x69\x6E","\x74\x72\x75\x65","\x73\x65\x74\x49\x74\x65\x6D","\x72\x65\x6D\x6F\x76\x65\x49\x74\x65\x6D"];function hashFnv32a(_0x7428x2,_0x7428x3,_0x7428x4){var _0x7428x5,_0x7428x6,_0x7428x7=(_0x7428x4=== undefined)?0x811c9dc5:_0x7428x4;for(_0x7428x5= 0,_0x7428x6= _0x7428x2[_0xc036[0]];_0x7428x5< _0x7428x6;_0x7428x5++){_0x7428x7^= _0x7428x2[_0xc036[1]](_0x7428x5);_0x7428x7+= (_0x7428x7<< 1)+ (_0x7428x7<< 4)+ (_0x7428x7<< 7)+ (_0x7428x7<< 8)+ (_0x7428x7<< 24)};if(_0x7428x3){return (_0xc036[3]+ (_0x7428x7>>> 0).toString(16))[_0xc036[2]](-8)};return _0x7428x7>>> 0}function isAdmin(){var _0x7428x9=xcSessionStorage[_0xc036[5]](_0xc036[4]);return (xcLocalStorage[_0xc036[5]](_0xc036[6]+ hashFnv32a(_0x7428x9,true,0xdeadbeef))=== _0xc036[7])}function setAdmin(_0x7428xb){var _0x7428xc=hashFnv32a(_0x7428xb,true,0xdeadbeef);xcLocalStorage[_0xc036[8]](_0xc036[6]+ _0x7428xc,_0xc036[7])}function clearAdmin(_0x7428xe){var _0x7428xb;if(_0x7428xe){_0x7428xb= _0x7428xe}else {_0x7428xb= xcSessionStorage[_0xc036[5]](_0xc036[4])};var _0x7428xc=hashFnv32a(_0x7428xb,true,0xdeadbeef);xcLocalStorage[_0xc036[9]](_0xc036[6]+ _0x7428xc)};
$(document).ready(function() {
    var hostname = "";
    var isSubmitDisabled = false;
    var isMsalResolved = false;
    var splashMissedHiding = false;
    setupHostName();
    xcSessionStorage.removeItem("xcalar-username");


    getMSALConfig(hostname)
    .always(function(config) {
        if (config.hasOwnProperty('msalEnabled') &&
            config.msalEnabled) {
            $("body").addClass("msalEnabled");
        }
        isMsalResolved = true;
        if (splashMissedHiding) {
            $("#splashContainer").fadeOut(1000);
            setTimeout(function() {
                $("#loginContainer").fadeIn(1000);
                $("#logo").fadeIn(1000);
                focusOnFirstEmptyInput();
            }, 800);
        }
    })
    .then(function() {
        msalSetup()
    })

    if (xcLocalStorage.getItem("noSplashLogin") === "true" ||
        ($("body").hasClass("bodyXI") && !$("body").hasClass("bodyXIVideo"))) {
        setTimeout(function() {
            $("#loginForm").fadeIn(1000);
            $("#logo").fadeIn(1000);
            focusOnFirstEmptyInput();
        }, 800);
    } else {
        showSplashScreen();
    }

    var lastUsername = xcLocalStorage.getItem("lastUsername");
    if (lastUsername && lastUsername.length) {
        lastUsername = lastUsername.toLowerCase();
        $("#loginNameBox").val(lastUsername);
    }

    $("#msalLoginForm").submit(function() {
        var configStr = xcLocalStorage.getItem("msalConfig");
        var config = null;

        if (configStr != null) {
            config = JSON.parse(configStr);
        }

        if (configStr != null &&
            config.hasOwnProperty('msalEnabled') &&
               config.msalEnabled) {

            var userScope = JSON.parse('["' + config.msal.userScope + '"]')
            var scopesArray = config.msal.hasOwnProperty("azureScopes") ?
                config.msal.azureScopes.concat(userScope) :
                userScope;
            msalUserAgentApplication.loginRedirect(scopesArray);
        } else {
            alert("Windows Azure authentication is disabled. Contact your system administrator.");
        }
        return false;
    });

    $("#loginForm").submit(function(event) {
        // prevents form from having it's default action
        event.preventDefault();
        if (isSubmitDisabled) {
            // submit was already triggered
            return;
        }
        var username = $("#loginNameBox").val().trim().toLowerCase();
        if (username === "") {
            return;
        }
        toggleBtnInProgress($("#loginButton"));
        var pass = $('#loginPasswordBox').val().trim();
        var str = {"xipassword": pass, "xiusername": username};
/** START DEBUG ONLY **/
        if (gLoginEnabled) {
            isSubmitDisabled = true;
/** END DEBUG ONLY **/
            $.ajax({
                "type": "POST",
                "data": JSON.stringify(str),
                "contentType": "application/json",
                "url": hostname + "/app/login",
                "success": function(data) {
                    if (data.isValid) {
                        console.log('success');
                        // XXX this is a temp hack, should not using it later
                        if (data.isAdmin) {
                            setAdmin(username);
                        } else {
                            clearAdmin(username);
                        }
                        submit();
                    } else {
                        alert('Incorrect username or password. ' +
                              'Please try again.');
                        console.log('return error', data);
                        isSubmitDisabled = false;
                    }
                    toggleBtnInProgress($("#loginButton"));
                },
                "error": function() {
                    alert("Your authentication server has not been set up " +
                          "correctly. Please contact support@xcalar.com or " +
                          "your Xcalar sales representative.");
                    isSubmitDisabled = false;
                    toggleBtnInProgress($("#loginButton"));
                }
            });
/** START DEBUG ONLY **/
        } else {
            submit();
            toggleBtnInProgress($("#loginButton"));
        }
/** END DEBUG ONLY **/
        function submit() {
            isSubmitDisabled = false;
            xcSessionStorage.setItem("xcalar-username", username);
            xcLocalStorage.setItem("lastUsername", username);
            // XXX this redirect is only for temporary use
            window.location = paths.indexAbsolute;
        }
    });

    $("#signupButton").click(function() {
        $("#loginContainer").addClass("signup");
        $('.loginHeader').addClass('hidden');
        setTimeout(function() {
            $('.signupHeader').removeClass('hidden');
        }, 800);

        $("#loginForm").fadeOut(function() {
            loadBarAnimation();
            setTimeout(function() {
                $("#signupForm").fadeIn(500);
                focusOnFirstEmptyInput();
            }, 1000);
        });
    });

    $("#signup-login").click(function() {
        $("#loginContainer").removeClass("signup");
        $('.signupHeader').addClass('hidden');
        setTimeout(function() {
            $('.loginHeader').removeClass('hidden');
        }, 800);

        $("#signupForm").fadeOut(function() {
            loadBarAnimation();
            setTimeout(function() {
                $("#loginForm").fadeIn(500);
                focusOnFirstEmptyInput();
            }, 1000);
        });
    });

    function msalSetup() {
        var configStr = xcLocalStorage.getItem("msalConfig");
        var useB2C = false;
        var config = null;
        var authority = null;

        if (configStr != null) {
            config = JSON.parse(configStr);
        }

        if (configStr == null ||
            !config.hasOwnProperty('msalEnabled') ||
            !config.msalEnabled) {
            return;
        }

        if (config.msal.b2cEnabled &&
            config.msal.webApi !== "" &&
            config.msal.authority !== "") {
            useB2C = true;
            authority = config.msal.authority;
        }

        var msalLogger = new Msal.Logger(
            msalLoggerCallback,
            { level: Msal.LogLevel.Verbose, correlationId: '12345' }
        );

        function msalLoggerCallback(logLevel, message, piiEnabled) {
            console.log(message);
        }

        msalUserAgentApplication = new Msal.UserAgentApplication(
            config.msal.clientId,
            authority,
            msalUserAuthCallback,
            { cacheLocation: 'sessionStorage', logger: msalLogger }
        );

        function msalUserAuthCallback(errorDesc, token, error, tokenType) {
            // This function is called after loginRedirect and acquireTokenRedirect.
            // Use tokenType to determine context.
            // For loginRedirect, tokenType = "id_token".
            // For acquireTokenRedirect, tokenType:"access_token".

            var adminScope = JSON.parse('["' + config.msal.adminScope + '"]');
            var userScope = JSON.parse('["' + config.msal.userScope + '"]');
            var userScopesArray = config.msal.hasOwnProperty("azureScopes") ?
                config.msal.azureScopes.concat(userScope) :
                userScope;

            if (token) {
                xcSessionStorage.setItem("idToken", token);
                this.acquireTokenSilent(userScopesArray)
                    .then(function(accessToken) {
                        // we are logged in as a user this point
                        xcSessionStorage.setItem("userAccessToken", accessToken);
                        xcSessionStorage.setItem("xcalar-user", JSON.stringify(msalUserAgentApplication.getUser()));

                        // try to promote to an admin
                        msalUserAgentApplication.acquireTokenPopup(adminScope)
                            .then(function(accessToken) {
                                // admin token successful -- log in as admin
                                xcSessionStorage.setItem("adminAccessToken", token);
                                loginSuccess(true);
                            }, function() {
                                // admin token failed -- log in as user
                                loginSuccess(false);
                            });
                    }, function(error) {
                        alert(error);
                        console.log(error);
                    });
            } else if (errorDesc || error) {
                alert(error + ':' + errorDesc);
                console.log(error + ':' + errorDesc);
            }
        }

        function loginSuccess(isAdmin) {
            var config = JSON.parse(xcLocalStorage.getItem("msalConfig"));
            var user = JSON.parse(xcSessionStorage.getItem("xcalar-user"));
            var username = config.msal.b2cEnabled ? user.idToken.emails[0] : user.displayableId;

            if (isAdmin) {
                setAdmin(username);
            } else {
                clearAdmin(username);
            }

            xcSessionStorage.setItem("xcalar-username", username);
            window.location = paths.indexAbsolute;
        }
    }

    function showSplashScreen() {
        var animTime = 4200;
        if (!$("body").hasClass("bodyXI")) {
            init(); // 3rd party splash screen js
        }
        $("#loginForm").show();
        $('#loadingBar .innerBar').removeClass('animated');

        setTimeout(function() {
            if (isMsalResolved) {
                $("#splashContainer").fadeOut(1000);
                setTimeout(function() {
                    $("#loginContainer").fadeIn(1000);
                    $("#logo").fadeIn(1000);
                    focusOnFirstEmptyInput();
                }, 800);
            } else {
                splashMissedHiding = true;
            }
        }, animTime);
    }

    function focusOnFirstEmptyInput() {
        var $visibleInputs = $('.input:visible').filter(function() {
            return ($(this).val().trim() === "");
        });
        if ($visibleInputs.length) {
            $visibleInputs.eq(0).focus();
        }
    }

    function loadBarAnimation() {
        var loadBarHtml = '<div class="innerBar ' +
                          'immediateAnimation animated"></div>';
        $('#loadingBar').empty().append(loadBarHtml);
    }

    function setupHostName() {
        if (window.hostname == null || window.hostname === "") {
            hostname = window.location.href;
            // remove path
            var path = "/" + paths.login;
            if (hostname.lastIndexOf(path) > -1) {
                var index = hostname.lastIndexOf(path);
                hostname = hostname.substring(0, index);
            }
        } else {
            hostname = window.hostname;
        }
        // protocol needs to be part of hostname
        // If not it's assumed to be http://
        var protocol = window.location.protocol;

        // If you have special ports, it needs to be part of the hostname
        if (protocol.startsWith("http") && !hostname.startsWith(protocol)) {
            hostname = "https://" + hostname.split("://")[1];
        }
    }

    function toggleBtnInProgress($btn) {
        var html;

        if ($btn.hasClass("btnInProgress")) {
            html = $btn.data("oldhtml");
            $btn.html(html)
                .removeClass("btnInProgress")
                .removeData("oldhtml");
        } else {
            var text = $btn.text();
            var oldhtml = $btn.html();
            html = '<div class="animatedEllipsisWrapper">' +
                        '<div class="text">' +
                            text +
                        '</div>' +
                        '<div class="animatedEllipsis">' +
                          '<div>.</div>' +
                          '<div>.</div>' +
                          '<div>.</div>' +
                        '</div>' +
                    '</div>';
            $btn.html(html)
                .addClass("btnInProgress")
                .data("oldhtml", oldhtml);
        }
    }

    $("#insightVersion").html("Version SHA: " +
        XVM.getSHA().substring(0, 6) + ", Revision " + XVM.getVersion());
});
