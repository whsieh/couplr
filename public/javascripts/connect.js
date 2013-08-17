function parseUri (str) {
    var o   = parseUri.options,
    m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
    uri = {},
    i   = 14;
    while (i--) uri[o.key[i]] = m[i] || "";
    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) uri[o.q.name][$1] = $2;
    });
    return uri;
};

parseUri.options = {
    strictMode: false,
    key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
    q:   {
        name:   "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
};

$(document).ready(function() {
    window.fbAsyncInit = function() {
        FB.init({
            appId: '582584861772287', // App ID
            status: true, // check login status
            cookie: true, // enable cookies to allow the server to access the session
            xfbml: true  // parse XFBML
        });

        function permissions() {
            // Prompt user to extend permissions upon each login
            // If user declines, proceed to match with basic permissions
            console.log('Extending permissions...')
            FB.login(function(response) {
                FB.api('me/permissions', function(res) {
                    // User logged in with full permissions, redirect to matches
                    if ('read_stream' in res.data[0]) {
                        window.location.replace('/match');
                    // Need extended permissions from user
                    }
                });
            }, {scope: ['read_stream',
                        'user_birthday',
                        'friends_birthday']});
        }

        $('#basic-button').click(function() {
            FB.getLoginStatus(function(response) {
                if (response.status === 'connected') {
                    FB.api('me/permissions', function(res) {
                    // User logged in with full permissions, redirect to matches
                        if ('read_stream' in res.data[0]) {
                            window.location.replace('/match');
                        // Need extended permissions from user
                        } else {
                            permissions()
                        }
                    })
                // User is logged in but has not authenticated
                } else if (response.status === 'not_authorized') {
                    permissions()
                // the user isn't logged in to Facebook.
                } else {
                    permissions();
                }
            });
        });

        // $('#extended-button').click(function() {
        //     permissions()
        // });
    };

    // Load the SDK Asynchronously
    (function(d){
        var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement('script'); js.id = id; js.async = true;
        js.src = "//connect.facebook.net/en_US/all.js";
        ref.parentNode.insertBefore(js, ref);
    }(document));
});
