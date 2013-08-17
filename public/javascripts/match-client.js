
var preMatches = new BinaryHeap(function(a,b) {
    return a[2]>b[2]
})
var matches = new BinaryHeap(function(a,b) {
    return a[2]>b[2]
})
var matchHistory = []
var currentMatches = {}
var usePreMatches = true
var curMatch = null
var nextMatch = null
var blocked = false
var searchSuggest = null
var isSearching = false
var isMatchSection = true

function initMatchUI() {
    console.log('(+) [Pre-]Matches initialized.')
    inject()
}
 
initRootNetwork()
 
$.blockUI.defaults.message = 'Loading matches...'
$.blockUI.defaults.overlayCSS.cursor = 'default'
$.blockUI.defaults.css.cursor = 'default'
$.blockUI({ css: { 
        'font-size': '2.5em',
        border: 'none', 
        padding: '15px', 
        backgroundColor: '#000', 
        '-webkit-border-radius': '10px', 
        '-moz-border-radius': '10px', 
        opacity: .5,
        color: '#fff',
    }
});
 
function loadContinuousMatches() {
    if (matches.size() < 30) {
        loadMatches(100)
    }
}
 
function getNextMatch() {
    if (usePreMatches) {
        if (preMatches.size() == 0) {
            return null
        } else {
            var m = preMatches.pop()
            return m
        }
    } else {
        while (matches.size() == 0) {
            loadMatches()
        }
        var m = matches.pop()
        return m
    }
}

// Keyboard input...
var captureKeys = function($) {
    var inputField,
    documentKeydown = function(event) {
        var keyCode = event.keyCode || event.which
        // Reserve select keys
        if(keyCode === 13 || keyCode === 91 || keyCode === 18 || keyCode === 17 || keyCode === 9 
            || keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40 || keyCode === 27) {
            switch(keyCode) {
                case 38:
                    if(!blocked) {
                        $('#heart').css({'opacity':1})
                        heartAnimation(function() {
                            $('#heart').fadeTo('fast',.6)
                        })
                        heart()
                        curMatch = nextMatch
                        nextMatch = getNextMatch()
                    }
                    break
                case 40:
                    if(!blocked) {
                        $('#dislike').css({'opacity':1})
                        dislikeAnimation(function() {
                            $('#dislike').fadeTo('fast',.6)
                        })
                        dislike()
                        curMatch = nextMatch
                        nextMatch = getNextMatch()
                    }
                    break
            }
            return
        } else {
            var target = event.target, tagName = target.tagName.toLowerCase();
            if(!blocked) {
                $.blockUI({ 
                    message: $('#match-form'),
                    css: { 
                        backgroundColor: 'transparent',
                        border: 'none',
                        width: '100%',
                        top: '30%',
                        left: 'auto',
                        right: 'auto'
                    },
                    overlayCSS: {
                        opacity: .85
                    }
                })
                blocked = true
            }
            if(target !== inputField.get(0)) {
                if(tagName === 'input' || tagName === 'textarea') {
                    return true;
                }
                target = inputField.get(0);
                inputField.focus();
            }
        }
    };
    $.fn.captureKeys = function(){
        return this.each(function(i){
            if(i === 0) {
                inputField = $(this);
                $(document).bind('keydown', documentKeydown);
                inputField
                    .focus(function() {
                        $(document).unbind('keydown');
                    })
                    .blur(function() {
                        $(document).bind('keydown', documentKeydown);
                    });
            }
        });
    };
}
captureKeys(jQuery)
 
 
function setProgress(percent, $element, delay) {
    delay = delay || 100
    var progressBarWidth = percent * $element.width() / 100
    $element.find('div').animate({width: progressBarWidth}, delay, function() {
        if(percent == 100) {
            $element.fadeOut('slow')
        }
    })
}

function growlUI() {
    $.blockUI({ 
        message: $('#growlUI'),
        fadeIn: 700, 
        fadeOut: 700, 
        timeout: 2000, 
        showOverlay: false, 
        centerY: false, 
        css: { 
            width: ($('#growlUI').width()+10) + 'px', 
            top: '15px', 
            left: '', 
            right: '15px', 
            border: 'none', 
            padding: '10px', 
            backgroundColor: '#000', 
            '-webkit-border-radius': '10px', 
            '-moz-border-radius': '10px', 
            opacity: .6, 
            color: '#fff',
            cursor: 'default'
        },
        overlayCSS: {  
            cursor: 'default' 
        }
    })
}
 
function appendMatch(match) {
    match = match || curMatch

    $('#match-left').append('<span>' + nw.whois(match[0]) + '</span><img class="match-img" src="' + nw.picture(match[0]) + '">')
    $('#match-right').append('<img class="match-img" src="' + nw.picture(match[1]) + '">' + '<span>' + nw.whois(match[1]) + '</span>')

    if (nw.gender(match[0]) == 'm') {
        $('#match-left').css('background', '#7AE0FF')
    } else {
        $('#match-left').css('background', '#FF99CC')
    }
 
    if (nw.gender(match[1]) == 'm') {
        $('#match-right').css('background', '#7AE0FF')
    } else {
        $('#match-right').css('background', '#FF99CC')
    }
}
 
function heart() {
    addMatch(curMatch[0],curMatch[1],'up')
    matchHistory.push(curMatch)
    $('#match').hide('slide', {direction: 'left'}, 400, function() {
        $('#match-left').empty()
        $('#match-right').empty()
        appendMatch(curMatch)
        $('#match').show('slide', {direction: 'right'}, 400)
    })
}

function heartAnimation(callback) {
    $('#heart').animate({
        'height': '65px',
        'width': '65px',
    }, 50, function() {
        $('#heart').animate({
            'height': '60px',
            'width': '60px',
        }, 50, function() {
            $('#heart').animate({
                'height': '68px',
                'width': '68px'
            }, 75, function() {
                $('#heart').animate({
                    'height': '60px',
                    'width': '60px'
                }, 100, function() {
                    if(callback != undefined) {
                        callback()
                    }
                })
            })
        })
    })
}
 
function skip() {
    addMatch(curMatch[0],curMatch[1],'skip')
    matchHistory.push(curMatch)
    $('#match').fadeOut('fast', function() {
        $('#match-left').empty()
        $('#match-right').empty()
        appendMatch(curMatch)
        $('#match').fadeIn('slow')
    })
}

function skipAnimation(callback) {
    $('#skip').animate({
        'height': '75px'
    }, 200, function() {
        $('#skip').animate({
            'height': '60px'
        }, 200, function() {
            if(callback != undefined) {
                callback()
            }
        })
    })
}
 
function dislike() {
    addMatch(curMatch[0],curMatch[1],'down')
    matchHistory.push(curMatch)
    $('#match').hide('slide', {direction: 'right'}, 400, function() {
        $('#match-left').empty()
        $('#match-right').empty()
        appendMatch(curMatch)
        $('#match').show('slide', {direction: 'left'}, 400)
    })
}

function dislikeAnimation(callback) {
    $('#dislike').animate({
        'height': '50px',
        'width': '50px',
    }, 200, function() {
        $('#dislike').animate({
            'height': '60px',
            'width': '60px',
        }, 200, function() {
            if(callback != undefined) {
                callback()
            }
        })
    })
}

function voted(match) {
    match = match || curMatch
    var m0 = match[0],
        m1 = match[1]
    if(m1 in matchData && m0 in matchData[m1]) {
        var m = matchData[m1][m0]

        if (m.voted === 'up') {
            heartAnimation()
            $('#heart').css({'opacity':1})
        } else if (m.voted === 'skip') {
            skipAnimation()
            $('#skip').css({'opacity':1})
        } else if (m.voted === 'down'){
            dislikeAnimation()
            $('#dislike').css({'opacity':1})
        }
    } else {
        $('#selections svg').fadeTo('fast',.6)
        return
    }
}

function suggestAnimation() {
    $('#left-input-wrapper').animate({'right':'191px'}, 300, function() {
        var partners = rankPartners($('#left-input').attr('search_id')),
            suggestions = []
        searchSuggest.length = 0
        for (var i = 0; i < partners.length; i++) {
            var contact = partners[i]
            suggestions.push({
                label:contact.name,
                value:contact.id,
                picture:contact.picture
            })
        }
        searchSuggest.push.apply(searchSuggest,suggestions)
        if (searchSuggest.length > 0) {
            var label = searchSuggest[0].label,
                value = searchSuggest[0].value
            $('#right-input').val(label)
            $('#right-input').attr('search_id',value)
        }
        $('#left-input-wrapper').css({
            '-webkit-border-radius':'6px 0px 0px 6px',
            '-moz-border-radius':'6px 0px 0px 6px'
        })
        $('#right-input-wrapper').fadeIn('slow').css({'display':'inline-block'})
        $('#right-input').focus().select()
    })
}

function suggestReset() {
    $('#left-input-wrapper').css({
        '-webkit-border-radius': '6px',
        '-moz-border-radius': '6px',
        'right': '0'
    })
    $('#right-input-wrapper').css({
        'display': 'none'
    })
}

function getID(name) {
    name = name.toLowerCase()
    var uid = null
    for (var id in nw.contacts) {
        if (nw.contacts[id].name.toLowerCase() === name) {
            return id
        }
    }
    return null
}

function getStats(id) {
    stats = [0,0]

    if(id in matchData) {
        for(var id1 in matchData[id]) {
            var m = matchData[id][id1]
            stats[0] += m.up
            stats[1] += m.down
        }
    }
    return stats
}

function transitionToProfile(id) {
    id = id || nw.rootID

    $('#match-container').hide('slide', {direction: 'left'}, 250, function() {
        $('#profile-container').show('slide', {direction: 'right'}, 250, function() {
            $('#rankings-left').fadeIn('fast')
            $('#rankings-right').fadeIn('fast')
        })
    })
    $('#profile-button').css({
        'box-shadow':'2.5px 2.5px 1px #888888',
        'text-shadow':'1px 1px 1px rgba(0,0,0,0.3)',
        'margin':'-2.5px 0px 0px -2.5px' 
    }).animate({right:($(document).width()-80)},500,function() {
        $(this).css({
            'left':'20px',
            'right':'auto'
        })
    })
    setTimeout(function() {
        $('#profile-button img').fadeTo('fast',0,function() {
            $('#profile-button').empty()
            $('#profile-button').append('<svg class="svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'
            + 'version="1.1" x="0px" y="0px" viewbox="0 0 32 28" xml:space="preserve" enable-background="new 0 0 32 28"><g><g>'
            + '<path d="M16 3.844C14.387 1.578 11.871 0 8.887 0 3.984 0 0 3.992 0 8.891v0.734L16.006 28 32 9.625V8.891C32 3.992'
            + ' 28.016 0 23.115 0 20.131 0 17.615 1.578 16 3.844z" fill="#FF3333"/></g></g></svg>')
        })
    }, 250)
    isMatchSection = false
    emptyProfile()
    injectProfile(id)
}

function transitionToMatch() {
    $('#profile-container').hide('slide', {direction: 'right'}, 250, function() {
        $('#match-container').show('slide', {direction: 'left'}, 250)
    })
    $('#profile-button').css({
        'box-shadow':'2.5px 2.5px 1px #888888',
        'text-shadow':'1px 1px 1px rgba(0,0,0,0.3)',
        'margin':'-2.5px 0px 0px -2.5px',
        'left':'auto',
        'right':($(document).width()-80)
    }).animate({right:'20px'},500)
    setTimeout(function() {
        $('#profile-button .svg').fadeTo('fast',0,function() {
            $('#profile-button').empty()
            $('#profile-button').append('<img src="' + nw.picture(nw.rootID) + '">')
            $('#profile-button img').css({
                '-webkit-border-radius':'10px',
                '-moz-border-radius':'10px'
            })
        })
    }, 250)
    isMatchSection = true
}

function inject() {
    $(document).ready(function() {
        // growlUI
        $('#growlUI').append('Welcome, ' + nw.whois(nw.rootID))
        $('#growlUI').append('<img src="' + nw.picture(nw.rootID) + '">')
        growlUI()
 
        // START PROFILE BUTTON
        setTimeout(function() {
            $('#profile-button').append('<img src="' + nw.picture(nw.rootID) + '">')
            $('#profile-button img').css({
                '-webkit-border-radius':'10px',
                '-moz-border-radius':'10px'
            })
            $('#profile-button').fadeIn('slow')
        }, 2000)

        $('#profile-button').hover(function() {
            $(this).css({
                'box-shadow':'none',
                'margin':'2.5px 0px 0px 2.5px'
            })
        }, function() {
            $(this).css({
                'box-shadow':'2.5px 2.5px 1px #888888',
                'text-shadow':'1px 1px 1px rgba(0,0,0,0.3)',
                'margin':'-2.5px 0px 0px -2.5px' 
            })
        })

        $('#profile-button').click(function() {
            if(isMatchSection) {
                transitionToProfile()
            } else {
                transitionToMatch()
            }
        })
        // END PROFILE BUTTON
 
        // PRIME FIRST MATCH
        curMatch = getNextMatch()
        nextMatch = getNextMatch()
        appendMatch()
        $('#match').fadeIn('fast', function() {
            $('#selections').fadeIn('fast')
        })
         
        $('#selections svg').click(function() {
            var index = $(this).index();

            if(index == 0) {
                heartAnimation()
                heart()
            }
            else if(index == 1) {
                skipAnimation()
                skip()
            }
            else {
                dislikeAnimation()
                dislike()
            }
            // No longer a selected match
            isSearching = false
            curMatch = nextMatch
            nextMatch = getNextMatch()
        })
 
        $(function() {
            $('#left-input').captureKeys()
        })
 
        $('#left-input').keydown(function (e) {
            var code = e.keycode || e.which
            if ((code === 9 || code === 13) && isMatchSection) {
                e.preventDefault()
                suggestAnimation()
            } else if ((code === 9 ||code === 13 && !isMatchSection)) {
                e.preventDefault()
                $.unblockUI({
                    onUnblock: function() {
                        var id = $('#left-input').attr('search_id')
                        if (id === '') {
                            id = getID($('#left-input').val())
                        }
                        if (id) {
                            $('#profile-container').fadeOut('fast', function() {
                                emptyProfile()
                                injectProfile(id)
                                $(this).fadeIn('fast')
                            })
                        }
                        $('#left-input').val('')
                    }
                })
                blocked = false
                return false
            }
        })

        $('#right-input').keydown(function(e) {
            var code = e.keycode || e.which
            if (code === 13) {
                $.unblockUI({
                    onUnblock: function() {
                        var id1 = $('#left-input').attr('search_id'),
                            id2 = $('#right-input').attr('search_id')
                        if (id1 === '') {
                            id1 = getID($('#left-input').val())
                        }
                        if (id2 === '') {
                            id2 = getID($('#left-input').val())
                        }
                        if (id1 && id2) {
                            $('#match').hide('slide', {direction: 'up'}, 400, function() {
                                if (!isSearching) {
                                    matches.push(nextMatch)
                                    nextMatch = curMatch
                                    curMatch = [id1,id2,10]
                                } else {
                                    curMatch = [id1,id2,10]
                                }
                                isSearching = true
                                $('#match-left').empty()
                                $('#match-right').empty()
                                appendMatch()
                                voted()
                                $('#match').show('slide', {direction: 'up'}, 400)
                            })
                        }
                        $('#left-input').val('')
                        $('#right-input').val('')
                        suggestReset()
                    }
                })
                blocked = false
                return false
            }
        })

        var fullContacts = []
        for (var id in nw.contacts) {
            fullContacts.push({
                label:contacts[id].name,
                value:contacts[id].id,
                picture:contacts[id].picture
            })
        }
        fullContacts = fullContacts.sort(function(a,b) {
            return hScore(nw.rootID,b.value,false) - hScore(nw.rootID,a.value,false)
        })
        $('#left-input').attr('search_id','')
        $('#left-input').autocomplete({
            minLength:1,
            source: fullContacts,
            focus: function(event,ui) {
                $('#left-input').val(ui.item.label)
                $('#left-input').attr('search_id',ui.item.value)
                return false
            },
            select: function(event,ui) {
                $('#left-input').val(ui.item.label)
                $('#left-input').attr('search_id',ui.item.value)
                return false
            }
        }).data('ui-autocomplete')._renderItem = function (ul, item) {
            var picURL = item.picture.data.url
            return $('<li />')
                .data('item.autocomplete', item)
                .append('<a><img width=\'32px\' height=\'32px\' src=\'' + picURL + '\' />' + item.label + '</a>')
                .appendTo(ul)
        }

        var partners = rankPartners($('#left-input').attr('search_id'))
        searchSuggest = []
        for (var i = 0; i < partners.length; i++) {
            var contact = partners[i]
            searchSuggest.push({
                label:contact.name,
                value:contact.id,
                picture:contact.picture
            })
        }
        $('#right-input').autocomplete({
            minLength:1,
            source:searchSuggest,
            focus: function(event,ui) {
                $('#right-input').val(ui.item.label)
                $('#right-input').attr('search_id',ui.item.value)
                return false
            },
            select: function(event,ui) {
                $('#right-input').val(ui.item.label)
                $('#right-input').attr('search_id',ui.item.value)
                return false
            }
        }).data('ui-autocomplete')._renderItem = function (ul, item) {
            var picURL = item.picture.data.url
            return $('<li />')
                .data('item.autocomplete', item)
                .append('<a><img width=\'32px\' height=\'32px\' src=\'' + picURL + '\' />' + item.label + '</a>')
                .appendTo(ul)
        }

        $(document).keyup(function(e) {
            if (e.keyCode === 27) {
                if(blocked) {
                    $.unblockUI({
                        onUnblock: function() {
                            $('#left-input').val('')
                            $('#right-input').val('')
                            suggestReset()
                        }
                    })
                    blocked = false
                }
            }
        });

        $('#match-left').hover(function() {
            $('#match-left span').stop().fadeTo('fast',0,function(){
                var stats = getStats(curMatch[0])
                var left = '<div id="match-left-stats"><img src="images/heart_fill.svg"/>'+stats[0]+' <img src="images/x.svg"/>'+stats[1]+'</div>'
                $('#match-left').prepend(left)
            })
        }, function() {
            $('#match-left-stats').remove()
            $('#match-left span').stop().fadeTo('fast',1)
        })

        $('#match-right').hover(function() {
            $('#match-right span').stop().fadeTo('fast',0,function(){
                var stats = getStats(curMatch[1])
                var right = '<div id="match-right-stats"><img src="images/heart_fill.svg"/>'+stats[0]+' <img src="images/x.svg"/>'+stats[1]+'</div>'
                $('#match-right').prepend(right)
            })
        }, function() {
            $('#match-right-stats').remove()
            $('#match-right span').stop().fadeTo('fast',1)
        })

        $('#match-left').click(function() {
            transitionToProfile(curMatch[0])
        })

        $('#match-right').click(function() {
            transitionToProfile(curMatch[1])
        })

        // TEXT HOVERING
        $('.hover').hover(function() {
            var index = $(this).index()

            if(index === 0) {
                $('#skip').fadeTo('fast', .6)
                $('#dislike').fadeTo('fast', .6)
            } else if(index === 1) {
                $('#heart').fadeTo('fast', .6)
                $('#dislike').fadeTo('fast', .6)
            } else {
                $('#heart').fadeTo('fast', .6)
                $('#skip').fadeTo('fast', .6)
            }
            $(this).fadeTo('fast', 1)}, function() {
                $(this).fadeTo('fast', .6)
            }
        );
    })
}
