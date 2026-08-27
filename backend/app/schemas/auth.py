from pydantic import BaseModel


class CurrentUser(BaseModel):
    id: str
    github_handle: str
    display_name: str | None = None
    avatar_url: str | None = None
    onboarded: bool
