document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#btn-post').addEventListener('click', post);
    $('#following_posts').click(()=>load_posts('following'));
    
    // By default
    //load_posts('all');
    document.querySelectorAll('[class^="follow-"]').forEach( follow_a => {
        follow_a.onclick = () => fetch_follow_user(follow_a.dataset.user)
    });

    document.querySelectorAll('[id^="edit-"]').forEach( edit_a => {
        edit_a.onclick = () => {
            $(`#content-${edit_a.dataset.id}`).toggle();
            $(`#content-edit-${edit_a.dataset.id}`).toggle();
            $(`#save-${edit_a.dataset.id}`).toggle();
        }
    });

    document.querySelectorAll('[id^="save-"]').forEach( a => {
        a.onclick = () => {
            edit_post(a.dataset.id);
            $(`#content-${a.dataset.id}`).show();
            $(`#content-edit-${a.dataset.id}`).hide();
            $(`#save-${a.dataset.id}`).hide();
        }
    });

    document.querySelectorAll('[id^="like-"]').forEach( a => {
        a.onclick = () => {
            fetch('/like_post/' + a.dataset.id)
                .then(response => response.json())
                .then(
                    data => $('#like-num-'+a.dataset.id).text(data.likes));
        }
    });

    $('.full-screen').hide();
});

function post() {
    const $body = document.querySelector('#input-area').value;
    fetch('/new_post', {
        method: 'POST',
        body: JSON.stringify({
            body: $body
        })
    });
    //.then(response => response.json())
    // .then(result => {
    //     console.log(result);
    // });

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
    const $content = document.querySelector(`#content-edit-${post_id}`).value;
    fetch('/edit_post', {
        method: 'POST',
        body: JSON.stringify({
            content: $content,
            id: post_id
        })
    })
    .then(response => {
        if (response.status == 403) {
            throw new Error('You are not the post owner (JS).');
        } else {
            return response.json();
        }
    })
    .then( data => $(`#content-${post_id}`).text(data.content) )
    .catch( err => alert(err));
}

function load_posts(scope) {

    $('#all-posts').empty();

    fetch('/posts/' + scope)
        .then(response =>  response.json())
        .then(posts => {
            for (let i=0; i<posts.length; i++) {
                document.querySelector(`#edit-${posts[i].id}`).addEventListener('click', ()=>edit_post(posts[i].id));
                if (posts[i].liked) {
                    $(`#like-${posts[i].id}`).text('Unlike');
                } else {
                    $(`#like-${posts[i].id}`).text('Like');
                }
            }
        });
}