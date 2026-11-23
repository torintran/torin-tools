import type { CheatSheet } from './type.ts';

const git = 'https://git-scm.com/docs/git-';
const gh = 'https://cli.github.com/manual/gh_';

export const gitGithub: CheatSheet = {
  id: 'git-github',
  name: 'Git & GitHub',
  keywords: ['git', 'github', 'gh', 'branch', 'commit', 'pull request', 'release', 'tag'],
  groups: [
    { title: ['Git in your repository', 'Git trong repository'], commands: [
      ['See changed and staged files before committing.', 'Xem tệp đã sửa và tệp đã stage trước khi commit.', 'git status --short', git + 'status'],
      ['Create and switch to a feature branch.', 'Tạo và chuyển sang nhánh tính năng.', 'git switch -c feature/my-change', git + 'switch'],
      ['Stage one file for the next commit.', 'Stage một tệp cho commit tiếp theo.', 'git add -- path/to/file', git + 'add'],
      ['Review the changes staged for the next commit.', 'Rà nội dung đã stage cho commit tiếp theo.', 'git diff --cached', git + 'diff'],
      ['Commit the staged changes with a short message.', 'Tạo commit từ thay đổi đã stage, kèm mô tả ngắn.', 'git commit -m "Describe the change"', git + 'commit'],
      ['Push the branch and set its upstream on origin.', 'Đẩy nhánh và đặt upstream trên origin.', 'git push -u origin feature/my-change', git + 'push'],
      ['Create an annotated release tag at the current commit.', 'Tạo tag phát hành có chú thích tại commit hiện tại.', 'git tag -a v1.0.0 -m "Release v1.0.0"', git + 'tag'],
      ['Push only the specified tag to origin.', 'Đẩy tag được chỉ định lên origin.', 'git push origin tag v1.0.0', git + 'push'],
    ] },
    { title: ['GitHub CLI', 'GitHub CLI'], commands: [
      ['Check which GitHub account the CLI is using.', 'Kiểm tra tài khoản GitHub mà CLI đang dùng.', 'gh auth status', gh + 'auth_status'],
      ['Open a pull request from the current branch using commit information.', 'Mở pull request từ nhánh hiện tại và điền nội dung từ commit.', 'gh pr create --base main --fill', gh + 'pr_create'],
      ['Check the CI status of a pull request.', 'Xem trạng thái CI của pull request.', 'gh pr checks 123', gh + 'pr_checks'],
      ['Create a draft release for an existing remote tag.', 'Tạo bản phát hành nháp từ tag đã có trên remote.', 'gh release create v1.0.0 --verify-tag --draft --generate-notes', gh + 'release_create'],
      ['Inspect release details and attached assets.', 'Xem chi tiết bản phát hành và tệp đính kèm.', 'gh release view v1.0.0', gh + 'release_view'],
    ] },
  ],
};
