# Contributing to Databox

The databox project welcomes contributions via pull requests. This document 
sets out the process for contibuting. 

## Reporting issues

Found a problem? Got a feature request? Then plese open an issue on the main 
[Databox repository](https://github.com/me-box/databox/). First check that 
[the issue database](https://github.com/me-box/databox/issues)
doesn't already include that problem or suggestion before submitting.

When reporting issues, always include:

* The OS version.
* The output of `docker version`.
* Steps required to reproduce the problem

### Pull requests are always welcome
Before contributing large or high impact changes, make the effort to coordinate
with the maintainers of the project before submitting a pull request. This
prevents you from doing extra work that may or may not be merged.

Large PRs that are just submitted without any prior communication are unlikely
to be successful.

Typically, the best methods of accomplishing this are to submit an issue,
stating the problem. This issue can include a problem statement and a
checklist with requirements. If solutions are proposed, alternatives should be
listed and eliminated. Even if the criteria for elimination of a solution is
frivolous, say so.

### Conventions

#### Branch Naming

Fork the repository and make changes on your fork in a feature branch:

- If it's a bug fix branch, name it XXXX-something where XXXX is the number of
	the issue. 
- If it's a feature branch, create an enhancement issue to announce
	your intentions, and name it XXXX-something where XXXX is the number of the
	issue.

Submit tests for your changes. See [TESTING.md](./TESTING.md) for details.

Update the documentation when creating or modifying features. Test your
documentation changes for clarity, concision, and correctness, as well as a
clean documentation build. 

Pull request descriptions should be as clear as possible and include a reference
to all the issues that they address.

#### Commit Messages

Commit messages should start with a capitalized and short summary (max. 50 chars)
written in the imperative, followed by an optional, more detailed explanatory
text which is separated from the summary by an empty line.

please see [How to Write a Git Commit Message](http://chris.beams.io/posts/git-commit/)
for guidence. 

### Review

Code review comments may be added to your pull request. Discuss, then make the
suggested modifications and push additional commits to your feature branch. Post
a comment after pushing. New commits show up in the pull request automatically,
but the reviewers are notified only when you comment.

Pull requests must be cleanly rebased on top of master without multiple branches
mixed into the PR.

