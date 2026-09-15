# Releasing

Vexa is not published to npm. A release is a git tag `vX.Y.Z` on `main` plus a GitHub Release that carries the packed tarball. Hosts depend on either:

```json
"vexa": "github:GA-MO/vexa#v0.1.0"
"vexa": "https://github.com/GA-MO/vexa/releases/download/v0.1.0/vexa-0.1.0.tgz"
```

Both resolve to the same files: `package.json` `files` limits the package to `src/` (about 120 KB packed), `exports` point at the TypeScript source, `private: true` stays so nothing can be pushed to a registry by accident.

## Cut a release

```bash
bun run release 0.2.0
```

`scripts/release.ts` refuses unless you are on `main`, the tree is clean and `main` matches `origin/main`. It then runs `bun run typecheck`, sets `version` in the root `package.json`, rewrites every install snippet from the previous version to the new one (`README.md`, `website/content/docs/get-started.mdx`, `website/content/docs/examples/starters.mdx`, both starter READMEs), commits `Release v0.2.0`, tags `v0.2.0` and pushes the branch and the tag.

`.github/workflows/release.yml` runs on the tag: it checks that `package.json` matches the tag, typechecks, `bun pm pack`, and creates the GitHub Release with the tarball and generated notes. The Pages workflow deploys the docs from the same push, so the docs and the release always name the same version.

## Version numbers

Semver, pre-1.0: bump the minor for anything a host may have to change (a renamed prop, a new required option, a changed default such as the currency), the patch for fixes and additions that keep every existing host working. Write the host-facing change in the commit message; the release notes are generated from commit titles since the previous tag.

## Before running the script

- `bun run typecheck` passes and the pages you touched were opened (CLAUDE.md rules).
- Every host-facing change is documented in `website/content/docs` (config-reference for a new option).
- Nothing else waits in the working tree: the script commits with `git add -A`.

## If something goes wrong

- The workflow failed: fix on `main`, then `git tag -d vX.Y.Z && git push origin :vX.Y.Z` and run the script again with the same version after reverting the release commit, or release the next patch version instead.
- A release must be pulled: delete the GitHub Release and the tag; hosts that pinned the tag keep working from their lockfile until they upgrade.

## Adding a file that must ship

Anything a host imports has to live under `src/`; everything else (`examples/`, `website/`, `docs/`, `scripts/`, `mcp/`) is excluded from the package. A new entry point needs a line in `exports` and the matching `paths` entry in every example and website tsconfig (see `vexa/mock` for the pattern).
