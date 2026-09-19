from django.urls import path
from .views import UserListView, UserDetailUpdateDeleteView, users_with_stats, create_user, tasks_for_role_selection

urlpatterns = [
    path("accounts/users/", UserListView.as_view(), name="accounts-users"),
    path("users/<int:pk>/", UserDetailUpdateDeleteView.as_view(), name="user-detail"),
    path("users/with_stats/", users_with_stats, name="users-with-stats"),
    path("users/create/", create_user, name="create-user"),
    path("users/tasks_for_role_selection/", tasks_for_role_selection, name="tasks-for-role-selection"),
]

