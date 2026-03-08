import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path from 'path';

export const createGitPushAction = () =>
  createTemplateAction({
    id: 'custom:git-push',
    description: 'Push scaffolded files to an existing repository',

    schema: {
      input: z =>
        z.object({
          repoUrl: z.string(),
          branch: z.string().optional().default('main'),
          commitMessage: z.string().optional(),
        }),
    },

    async handler(ctx) {
      const { repoUrl, branch, commitMessage } = ctx.input;

      const workspace = ctx.workspacePath;
      const cloneDir = path.join(workspace, 'repo');

      const git = simpleGit();

      ctx.logger.info(`Cloning ${repoUrl}`);

      await git.clone(repoUrl, cloneDir);

      const repoGit = simpleGit(cloneDir);

      await repoGit.checkout(branch);

      const files = await fs.readdir(workspace);

      for (const file of files) {
        if (file === 'repo') continue;

        await fs.copy(
          path.join(workspace, file),
          path.join(cloneDir, file),
        );
      }

      await repoGit.add('.');
      await repoGit.commit(
        commitMessage || 'Backstage scaffold commit',
      );

      await repoGit.push('origin', branch);

      ctx.logger.info('Push completed');
    },
  });