var profileData = null

function appendProfileName(id,elm,img_id) {
    id = id || nw.rootID

    $(elm).append('<img id="'+img_id+'" src="'+nw.picture(id)+'">'+'<span>'+nw.whois(id)+'</span>')

    if (nw.gender(id) == 'm') {
        $(elm).css('background', '#7AE0FF')
    } else {
        $(elm).css('background', '#FF99CC')
    }
}

function appendProfile(id,elm,img_class) {
    id = id || nw.rootID

    $(elm).append('<div><img class="'+img_class+'" src="'+nw.picture(id)+'">'+'<span>'+nw.whois(id)+'</span></div>')

    if (nw.gender(id) == 'm') {
        $(elm+' div').css('background', '#7AE0FF')
    } else {
        $(elm+' div').css('background', '#FF99CC')
    }
}

function injectHeartStats() {
    var data_length = profileData.up.length
    if(profileData) {
        if(data_length === 0) {
            return
        } else if(data_length <= 25) {
            for(var i = 0; i < data_length; i++) {
                appendProfile(profileData.up[i][0],'#rankings-heart','rankings-img')
            }
        } else {
            for(var i = 0; i < 25; i++) {
                appendProfile(profileData.up[i][0],'#rankings-heart','rankings-img')
            }
        }
    }
}

function injectDislikeStats() {
    var data_length = profileData.down.length
    if(profileData) {
        if(data_length === 0) {
            return
        } else if(data_length <= 25) {
            for(var i = 0; i < data_length; i++) {
                appendProfile(profileData.down[i][0],'#rankings-dislike','rankings-img')
            }
        } else {
            for(var i = 0; i < 25; i++) {
                appendProfile(profileData.down[i][0],'#rankings-dislike','rankings-img')
            }
        }
    }
}

function injectProfile(id) {
    profileData = getProfileData(id)

	$(document).ready(function(){
		$('#rankings').css({'height':$(document).height()-300})

		appendProfileName(id,'#profile-name','profile-img')
        injectHeartStats()
        injectDislikeStats()

		$('#profile-name').hover(function() {
            $('#profile-name span').stop().fadeTo(1,0,function(){
                var stats = getStats(id)
                var profile = '<div id="profile-name-stats"><svg class="svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'
                + 'version="1.1" x="0px" y="0px" viewbox="0 0 32 28" xml:space="preserve" enable-background="new 0 0 32 28"><g><g>'
                + '<path d="M16 3.844C14.387 1.578 11.871 0 8.887 0 3.984 0 0 3.992 0 8.891v0.734L16.006 28 32 9.625V8.891C32 3.992'
                + ' 28.016 0 23.115 0 20.131 0 17.615 1.578 16 3.844z" fill="#000000"/></g></g></svg>'+stats[0]
                + '  <svg class="svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'
                + 'version="1.1" x="0px" y="0px" viewbox="0 0 29 29" xml:space="preserve" enable-background="new 0 0 32 28"><g>'
                + '<polygon points="28,22.398 19.594,14 28,5.602 22.398,0 14,8.402 5.598,0 0,5.602 8.398,14 0,22.398    5.598,28 14,19.598 22.398,28  "'
                + ' fill="#000000"/></g></svg>'+stats[1]+'</div>'
                $('#profile-name').prepend(profile)
            })
        }, function() {
            $('#profile-name-stats').remove()
            $('#profile-name span').stop().fadeTo(1,1)
        })

        $('#rankings-heart div').click(function() {
            var new_id = profileData.up[$(this).index()][0]
            $('#profile-container').fadeOut('fast', function() {
                emptyProfile()
                injectProfile(new_id)
                $(this).fadeIn('fast')
            })
        })

        $('#rankings-dislike div').click(function() {
            var new_id = profileData.down[$(this).index()][0]
            $('#profile-container').fadeOut('fast', function() {
                emptyProfile()
                injectProfile(new_id)
                $(this).fadeIn('fast')
            })
        })

        $('#rankings-heart div').hover(function() {
            var index = $(this).index()
            $('#rankings-heart div span').eq(index).stop().fadeTo(1,0,function(){
                var profile = '<div id="profile-stats"><img src="images/heart_fill.svg"/> '+matchData[id][profileData.up[index][0]].up+'</div>'
                $('#rankings-heart div').eq(index).prepend(profile)
            })
        }, function() {
            $('#profile-stats').remove()
            $('#rankings-heart div span').stop().fadeTo(1,1)
        })

        $('#rankings-dislike div').hover(function() {
            var index = $(this).index()
            $('#rankings-dislike div span').eq(index).stop().fadeTo(1,0,function(){
                var profile = '<div id="profile-stats"><img src="images/x.svg"/> '+matchData[id][profileData.down[index][0]].down+'</div>'
                $('#rankings-dislike div').eq(index).prepend(profile)
            })
        }, function() {
            $('#profile-stats').remove()
            $('#rankings-dislike div span').stop().fadeTo(1,1)
        })
	})
}

function emptyProfile() {
    $('#profile-name').empty()
    $('#rankings-heart').empty()
    $('#rankings-dislike').empty()
}
