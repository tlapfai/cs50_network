from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django import forms
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt, csrf_protect
import json

from django.core.paginator import Paginator
from .models import User, Post


class PostForm(forms.Form):
    content = forms.CharField(widget=forms.Textarea(attrs={'rows':'4', 'cols':'150', 'id':'input-area'}), label=' ', required=True)

#@login_required
def index(request, scope=''):
    temp = {}
    # for paginator
    if scope == 'following':
        post_list = Post.objects.filter(user__in=request.user.following.all())
    elif scope == '':
        post_list = Post.objects.all()
    else:
        post_list = Post.objects.filter(user=User.objects.get(id=scope))
        temp['looking_user'] = User.objects.get(id=scope)

    post_list = post_list.order_by("-timestamp").all()
    paginator = Paginator(post_list, 3)
    page_obj = paginator.get_page(request.GET.get('page'))
    #----------------------
    temp['post_form'] = PostForm().as_table()
    temp['page_obj'] = page_obj

    return render(request, "network/index.html", temp)


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


@login_required
def load_posts(request, scope):

    if scope == 'all':
        posts = Post.objects.all()
    elif scope == 'following':
        posts = Post.objects.filter(user__in=request.user.following.all())
    else:
        return JsonResponse({"error": "Invalid scope."}, status=400)

    # Return emails in reverse chronologial order
    posts = posts.order_by("-timestamp").all()
    paginator = Paginator(posts, 3)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    return JsonResponse([post.serialize(request.user) for post in page_obj.object_list], safe=False)


@login_required
@csrf_exempt
def new_post(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    data = json.loads(request.body)
    content = data.get("body", "")
    post = Post(user=request.user, content=content)
    post.save()
    return JsonResponse({"message": "Posted successfully."}, status=201)

@login_required
@csrf_exempt
def edit_post(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    data = json.loads(request.body) # data is a dict
    id = data.get("id") # type(id) is str, but it still work
    try:
        post = Post.objects.get(user=request.user, pk=id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "You are not the post owner."}, status=403)

    post.content = data.get("content")
    post.save()
    return JsonResponse({"message": "Post edited successfully.", 
        "content": post.content
    }, status=201)

@login_required
@csrf_exempt
def like_post(request, post_id):
    if request.method == "GET":
        post = Post.objects.get(pk=post_id)
        user = request.user
        if post.liked(user):
            post.likers.remove(user)
        else:
            post.likers.add(user)
        return JsonResponse({ "likes": len(post.likers.all()) })
    else:
        return JsonResponse({ "error": "GET request required." }, status=400)

@login_required
@csrf_exempt
def follow_user(request, target_username):
    try:
        target_user = User.objects.get(username=target_username)
    except User.DoesNotExist:
        return JsonResponse({"message": "User not found."}, status=404)

    if request.method == "GET":
        target_user = User.objects.get(username=target_username)
        iam = User.objects.get(username=request.user)
        if target_user ==  iam:
            return JsonResponse({'message': 'You cannot follow yourself.'})
        else:
            if target_user.followed_by(iam):
                target_user.followers.remove(iam)
                return JsonResponse({'message': f"You unfollowed {target_user.username}."})
            else:
                target_user.followers.add(iam)
                return JsonResponse({'message': f"You followed {target_user.username}."})
    else:
        return JsonResponse({ "error": "GET request required." }, status=400)

        