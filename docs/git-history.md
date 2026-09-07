# Git history and collaboration

Forgejo is canonical: https://git.nebula-1.com/nebula/tint
GitHub mirror: https://github.com/MylesLandais/tint
The private nebula organization is owned by warbee and lain.
GitHub remains public, including mirrored dev and historical branches.

## Branches

- `dev` is the default working tree. Branch from it for new work and send reviews to Forgejo.
- `stable` is the former GitHub `main` baseline. Promote tested work through reviewed merge commits; it is not an automatic deployment branch.
- Imported feature branches retain their names. `archive/github/*`, `archive/local/*`, and (for Tint) `archive/standalone/*` preserve the exact source tips observed during migration. They are historical snapshots, not additional supported source trees.
- Original commits, authors, merges, and tags are retained. Divergent same-name tags use `archive/<source>/...` names.

The dev tree combines the standalone feat/feed-policy-notify line with GitHub main and the component changes formerly local to End’s Tint submodule. It retains the client, feed, policy, notification and calendar work together with the workspace layouts, framebuffer and collaborative code editor.

## Context and recovery

The 2026-09-07 migration imported GitHub PRs, discussions on those PRs, labels, milestones, releases and wiki content where supported. Original GitHub URLs remain useful context; new issues and reviews belong in Forgejo. Git mirroring replicates branches and tags, not subsequent issue/PR activity.

The administrators retain a private migration archive with source-ref inventories, Git bundles, working patches, untracked files, stash recovery, PR review/timeline exports, CI metadata and validation logs. Raw recovery material and credentials are not part of the public mirror.

## Cloning and synchronization

```sh
git clone --recurse-submodules https://git.nebula-1.com/nebula/tint.git
```

Use your own Forgejo access token for HTTPS or your registered SSH key through the tailnet Git endpoint. Local `origin` points to Forgejo and `github` retains the original GitHub URL. Push and merge in Forgejo. A repository-scoped SSH deploy key permits Forgejo to update GitHub after pushes, with an hourly retry. Check Settings → Repository → Mirror Settings for the last result and use Synchronize Now to retry.

Do not independently push to GitHub: its refs are replicas and can be overwritten by synchronization. Preserve an unexpected GitHub-only commit in Forgejo before retrying a mirror. Private repositories require explicit repository or organization membership.
