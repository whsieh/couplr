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
            $('#profile-name span').stop().fadeTo('fast',0,function(){
                var stats = getStats(id)
                var profile = '<div id="profile-name-stats"><img src="images/heart_fill.svg"/>'+stats[0]+' <img src="images/x.svg"/>'+stats[1]+'</div>'
                $('#profile-name').prepend(profile)
            })
        }, function() {
            $('#profile-name-stats').remove()
            $('#profile-name span').stop().fadeTo('fast',1)
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
