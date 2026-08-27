"""Boilerplate-aware technology extraction (Section 5.2 Steps 1-2).

Two responsibilities kept separate on purpose:
  - `extract_technologies`: what libraries/tools does this repo use.
  - `boilerplate_weight`: how much should this repo's usage count, given
    fork/template/authorship/substantive-code signals.
Both feed into project.contribution_weight and, downstream,
inference/confidence.py.
"""

from __future__ import annotations

import json
import re

# Known scaffold structures (Section 5.2 "Template detection"). Real
# detection compares a structural hash against known generators; this is a
# lightweight heuristic version keyed on telltale files/deps, tightened once
# Appendix B's empirical threshold work happens.
_TEMPLATE_SIGNATURES = {
    "create-react-app": {"react-scripts"},
    "next.js": {"next"},
    "vite": {"vite"},
    "django-cookiecutter": {"cookiecutter"},
}

# Structural fingerprints for scaffolds that don't declare themselves as a
# dependency (e.g. a repo can use React without CRA/Vite). Each entry is the
# set of near-untouched boilerplate paths that generator produces; if a repo
# has all of them AND the commit/line-count signals below say the user barely
# touched the code, it's almost certainly an unmodified scaffold checkout.
_STRUCTURAL_TEMPLATE_SIGNATURES = {
    "create-react-app": {"public/index.html", "src/App.js", "src/index.js", "src/App.css", "src/index.css"},
    "vite-react": {"index.html", "src/main.jsx", "src/App.jsx", "vite.config.js"},
    "next.js": {"next.config.js", "pages/_app.js", "pages/index.js"},
    "next.js-app-router": {"next.config.js", "app/layout.tsx", "app/page.tsx"},
    "express-generator": {"bin/www", "app.js", "views/index.jade", "public/stylesheets/style.css"},
    "django-startproject": {"manage.py"},
}

_MANIFEST_PARSERS: dict[str, str] = {
    "package.json": "npm",
    "requirements.txt": "pypi",
    "Pipfile": "pypi",
    "pyproject.toml": "pypi",
    "pom.xml": "maven",
    "build.gradle": "maven",
    "Cargo.toml": "cargo",
    "go.mod": "go",
    "Gemfile": "gem",
    "composer.json": "composer",
    "Dockerfile": "docker",
    "docker-compose.yml": "docker",
}


def extract_technologies(manifests: dict[str, str]) -> list[dict]:
    """Returns [{name, ecosystem, source_file}, ...] deduped by name."""
    found: dict[str, dict] = {}

    if "package.json" in manifests:
        for name in _parse_package_json(manifests["package.json"]):
            found[name] = {"name": name, "ecosystem": "npm", "source_file": "package.json"}

    if "requirements.txt" in manifests:
        for name in _parse_requirements_txt(manifests["requirements.txt"]):
            found[name] = {"name": name, "ecosystem": "pypi", "source_file": "requirements.txt"}

    if "Cargo.toml" in manifests:
        for name in _parse_cargo_toml(manifests["Cargo.toml"]):
            found[name] = {"name": name, "ecosystem": "cargo", "source_file": "Cargo.toml"}

    if "go.mod" in manifests:
        for name in _parse_go_mod(manifests["go.mod"]):
            found[name] = {"name": name, "ecosystem": "go", "source_file": "go.mod"}

    if "Pipfile" in manifests:
        for name in _parse_pipfile(manifests["Pipfile"]):
            found.setdefault(name, {"name": name, "ecosystem": "pypi", "source_file": "Pipfile"})

    if "pyproject.toml" in manifests:
        for name in _parse_pyproject_toml(manifests["pyproject.toml"]):
            found.setdefault(name, {"name": name, "ecosystem": "pypi", "source_file": "pyproject.toml"})

    if "pom.xml" in manifests:
        for name in _parse_pom_xml(manifests["pom.xml"]):
            found[name] = {"name": name, "ecosystem": "maven", "source_file": "pom.xml"}

    if "build.gradle" in manifests:
        for name in _parse_build_gradle(manifests["build.gradle"]):
            found.setdefault(name, {"name": name, "ecosystem": "maven", "source_file": "build.gradle"})

    if "Gemfile" in manifests:
        for name in _parse_gemfile(manifests["Gemfile"]):
            found[name] = {"name": name, "ecosystem": "gem", "source_file": "Gemfile"}

    if "composer.json" in manifests:
        for name in _parse_composer_json(manifests["composer.json"]):
            found[name] = {"name": name, "ecosystem": "composer", "source_file": "composer.json"}

    if "Dockerfile" in manifests:
        found["Docker"] = {"name": "Docker", "ecosystem": "docker", "source_file": "Dockerfile"}

    if "docker-compose.yml" in manifests:
        found["Docker Compose"] = {"name": "Docker Compose", "ecosystem": "docker", "source_file": "docker-compose.yml"}

    if manifests.get("_has_ci_workflows"):
        found["GitHub Actions"] = {"name": "GitHub Actions", "ecosystem": "cicd", "source_file": ".github/workflows"}

    if any(p in manifests.get("_repo_paths", []) for p in _K8S_MARKER_PATHS):
        found["Kubernetes"] = {"name": "Kubernetes", "ecosystem": "orchestration", "source_file": "k8s manifest"}

    return list(found.values())


_K8S_MARKER_PATHS = {
    "k8s/deployment.yaml",
    "kubernetes/deployment.yaml",
    "helm/Chart.yaml",
    "Chart.yaml",
    "manifests/deployment.yaml",
}


def _parse_pipfile(content: str) -> list[str]:
    """[packages]/[dev-packages] sections are simple `name = "version"` (or
    `name = {...}`) lines — no need for a full TOML parser for the dep names."""
    names: list[str] = []
    section = None
    for line in content.splitlines():
        line = line.strip()
        if line.startswith("["):
            section = line.strip("[]")
            continue
        if section in ("packages", "dev-packages") and "=" in line:
            names.append(line.split("=")[0].strip().strip('"'))
    return names


def _parse_pyproject_toml(content: str) -> list[str]:
    """Handles both PEP 621 `[project] dependencies = [...]` and Poetry's
    `[tool.poetry.dependencies]` table, without a full TOML parser."""
    names: list[str] = []

    deps_match = re.search(r"dependencies\s*=\s*\[(.*?)\]", content, re.DOTALL)
    if deps_match:
        for entry in re.findall(r'"([^"]+)"', deps_match.group(1)):
            match = re.match(r"^([A-Za-z0-9_.\-]+)", entry)
            if match:
                names.append(match.group(1))

    in_poetry_deps = False
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("[tool.poetry.dependencies") or stripped.startswith("[tool.poetry.dev-dependencies"):
            in_poetry_deps = True
            continue
        if stripped.startswith("["):
            in_poetry_deps = False
            continue
        if in_poetry_deps and "=" in stripped:
            name = stripped.split("=")[0].strip().strip('"')
            if name and name.lower() != "python":
                names.append(name)

    return names


def _parse_pom_xml(content: str) -> list[str]:
    names = []
    for dep_block in re.findall(r"<dependency>(.*?)</dependency>", content, re.DOTALL):
        match = re.search(r"<artifactId>([^<]+)</artifactId>", dep_block)
        if match:
            names.append(match.group(1).strip())
    return names


def _parse_build_gradle(content: str) -> list[str]:
    names = []
    for match in re.finditer(r"""(?:implementation|api|compile|testImplementation)\s*[\(\s]?['"]([^'":]+):([^'":]+):[^'"]*['"]""", content):
        names.append(f"{match.group(1)}:{match.group(2)}")
    return names


def _parse_gemfile(content: str) -> list[str]:
    names = []
    for line in content.splitlines():
        match = re.match(r"""\s*gem\s+['"]([^'"]+)['"]""", line)
        if match:
            names.append(match.group(1))
    return names


def _parse_composer_json(content: str) -> list[str]:
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return []
    deps = {**data.get("require", {}), **data.get("require-dev", {})}
    return [name for name in deps if name != "php"]


def detect_architecture_patterns(repo_paths: list[str]) -> list[str]:
    """Heuristic structural-pattern detection from a repo's file tree
    (Section 5.3 Step 2): looks for directory-naming conventions that signal
    a recognizable architecture, rather than parsing framework config. Real
    detection would need per-framework awareness (e.g. Django app layout vs
    Rails MVC vs a generic layered service) — this covers the common,
    language-agnostic signals.
    """
    dirs = {p.split("/")[0].lower() for p in repo_paths if "/" in p}
    nested_dirs = {"/".join(p.split("/")[:2]).lower() for p in repo_paths if p.count("/") >= 1}

    patterns = []
    if {"controllers", "models", "views"} & dirs or {"app/controllers", "app/models", "app/views"} & nested_dirs:
        patterns.append("MVC")
    if "api" in dirs or "routes" in dirs or "endpoints" in dirs:
        patterns.append("API layer")
    if "services" in dirs or "usecases" in dirs or "domain" in dirs:
        patterns.append("Service/domain layer")
    if "repositories" in dirs or "repository" in dirs or "dao" in dirs:
        patterns.append("Repository pattern")
    if "components" in dirs and ("pages" in dirs or "routes" in dirs or "views" in dirs):
        patterns.append("Component-based frontend")
    if "microservices" in dirs or "services" in dirs and len([d for d in nested_dirs if d.startswith("services/")]) > 1:
        patterns.append("Microservices")
    if "migrations" in dirs or "alembic" in dirs:
        patterns.append("Migration-managed schema")
    if "workers" in dirs or "jobs" in dirs or "queue" in dirs or "tasks" in dirs:
        patterns.append("Background job processing")
    if "tests" in dirs or "test" in dirs or "__tests__" in dirs or "spec" in dirs:
        patterns.append("Test suite")
    return patterns


def has_tests(repo_paths: list[str]) -> bool:
    test_dir_names = {"test", "tests", "__tests__", "spec", "specs"}
    if any(p.split("/")[0].lower() in test_dir_names for p in repo_paths):
        return True
    return any(re.search(r"(^|/)(test_|_test\.|\.test\.|\.spec\.)", p, re.IGNORECASE) for p in repo_paths)


def _parse_package_json(content: str) -> list[str]:
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return []
    deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
    return list(deps.keys())


def _parse_requirements_txt(content: str) -> list[str]:
    names = []
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        match = re.match(r"^([A-Za-z0-9_.\-]+)", line)
        if match:
            names.append(match.group(1))
    return names


def _parse_cargo_toml(content: str) -> list[str]:
    in_deps = False
    names = []
    for line in content.splitlines():
        line = line.strip()
        if line.startswith("[dependencies"):
            in_deps = True
            continue
        if line.startswith("[") and not line.startswith("[dependencies"):
            in_deps = False
            continue
        if in_deps and "=" in line:
            names.append(line.split("=")[0].strip())
    return names


def _parse_go_mod(content: str) -> list[str]:
    names = []
    for line in content.splitlines():
        line = line.strip()
        match = re.match(r"^([\w./\-]+)\s+v[\d.]+", line)
        if match and "/" in match.group(1):
            names.append(match.group(1))
    return names


def detect_template(dependency_names: set[str], repo_paths: list[str] | None = None) -> str | None:
    """Dependency-signature match first (cheap, catches most cases); falls
    back to a structural fingerprint match against `repo_paths` for
    generators that don't declare themselves as a dependency."""
    for template, signature in _TEMPLATE_SIGNATURES.items():
        if signature & dependency_names:
            return template

    if repo_paths:
        path_set = set(repo_paths)
        for template, required_paths in _STRUCTURAL_TEMPLATE_SIGNATURES.items():
            if required_paths <= path_set:
                return template

    return None


def boilerplate_weight(
    *,
    is_fork: bool,
    has_significant_original_commits: bool,
    is_template_derived: bool,
    non_template_commit_count: int,
    non_config_lines_authored: int,
) -> float:
    """Section 5.2 Step 2 weighting cascade. Order matters: fork status is
    checked first since it overrides everything else."""
    if is_fork and not has_significant_original_commits:
        return 0.20
    if is_template_derived and non_template_commit_count < 15:
        return 0.30
    if non_config_lines_authored < 100:
        return 0.40
    return 1.0
