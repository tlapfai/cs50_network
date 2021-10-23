
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("following", views.index, {'scope': 'following'}, name="following"), 
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("user/<int:scope>", views.index, name="user"),
    #API routes
    path("new_post", views.new_post, name="new_post"),
    path("posts/<str:scope>", views.load_posts, name="load_posts"),
    path("like_post/<int:post_id>", views.like_post, name="like_post"),
    path("follow_user/<str:target_username>", views.follow_user, name="follow_user"),
    path("edit_post", views.edit_post, name="edit_post"),
    path("edit_profile", views.edit_profile, name="edit_profile")
]
