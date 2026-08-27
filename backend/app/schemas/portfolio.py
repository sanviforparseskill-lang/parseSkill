from pydantic import BaseModel


class PortfolioConfigOut(BaseModel):
    is_public: bool
    slug: str | None
    theme: str
    sections: dict | None
    featured_project_ids: list[str]


class PortfolioConfigUpdate(BaseModel):
    theme: str | None = None
    sections: dict | None = None
    featured_project_ids: list[str] | None = None
    slug: str | None = None


class PublicPortfolio(BaseModel):
    handle: str
    display_name: str | None
    tagline: str | None
    avatar_url: str | None
    theme: str
    sections: dict | None
    top_projects: list[dict]
    top_role: dict | None
