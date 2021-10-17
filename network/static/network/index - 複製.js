document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#btn-post').addEventListener('click', post);
    $('#following_posts').click(()=>load_posts('following'));
    
    // By default
    load_posts('all');
    $('.full-screen').hide();
});

function post() {
    const $body = document.querySelector('#input-area').value;
    console.log($body)
    fetch('/new_post', {
        method: 'POST',
        body: JSON.stringify({
            body: $body
        })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
    });

}

function fetch_follow_user(username) {
    fetch('/follow_user/' + username)
        .then(response => response.json())
        .then(data => {
            $('.full-screen').empty();
            $('.full-screen').append($(`<div class='text'></div>`).html(`${data.message}<br><a href="javascript:;" class="btn-close">Close</a>`));
            $('.full-screen').show();
            $('.btn-close').click( () => { 
                $('.full-screen').hide(); 
                $('.full-screen').empty();
            });
        } );
}

function edit_post(post_id) {
    $(`.post-list#post-${post_id}>b`).hide();
    //fetch('' + post_id);
}

function load_posts(scope) {

    $('#all-posts').empty();

    fetch('/posts/' + scope)
        .then(response =>  response.json())
        .then(posts => {
            let users = [];
            for (let i=0; i<posts.length; i++) {
                $('#all-posts').append(
                    $("<div class='div-post'></div>").append(
                        $(`<table class='post-list' id='post-${i}'></table>`).append(
                            $("<b></b>").html(`${posts[i].content}<br/>`)
                        )
                    )
                );
                $('#post-' + i).append($(`<a></a>`).html(`Edit<br>`));
                document.querySelector(`.post-list#post-${i}>a`).addEventListener('click', ()=>edit_post(posts[i].id));
                $('#post-' + i).append($(`<a class="follow-${posts[i].user}" href="javascript:;"></a>`).html(`${posts[i].user}\n`));
                if (!users.includes(posts[i].user)) {
                    users.push(posts[i].user);
                }
                $('#post-' + i).append($(`<p></p>`).html(`${posts[i].timestamp}\n`));
                if (posts[i].liked) {
                    $('#post-' + i).append($(`<a id='like-${posts[i].id}' href="javascript:;"></a>`).html(`Unlike`));
                } else {
                    $('#post-' + i).append($(`<a id='like-${posts[i].id}' href="javascript:;"></a>`).html(`Like`));
                }
                $('#like-' + posts[i].id).click( () => {
                    fetch('/like_post/' + posts[i].id);
                    if ($('#like-' + posts[i].id).text() == 'Like') {
                        $('#like-' + posts[i].id).text('Unlike');
                        $('#like-num-' + posts[i].id).text(parseInt($('#like-num-' + posts[i].id).text()) + 1);
                    } else {
                        $('#like-' + posts[i].id).text('Like');
                        $('#like-num-' + posts[i].id).text(parseInt($('#like-num-' + posts[i].id).text()) - 1);
                    }
                });
                $('#post-' + i).append(`<br>Likes: `);
                $('#post-' + i).append($(`<span id='like-num-${posts[i].id}'></span>`).text(`${posts[i].likes}`));
            }
            return users;
        })
        .then(users => {
            for (let i=0; i<users.length; i++) {
                links = document.getElementsByClassName('follow-' + users[i]);
                for (let k=0; k<links.length; k++) {
                    links[k].addEventListener('click', ()=>fetch_follow_user(users[i]));
                }
            }
        });
}