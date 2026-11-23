import { docker } from './docker.ts';
import { gitGithub } from './git-github.ts';
import { kubernetes } from './kubernetes.ts';

export const cheatSheetsRoute = 'cheat-sheets';
export const cheatSheets = [docker, kubernetes, gitGithub];

export function cheatSheetRoute(id: string) {
  return `${cheatSheetsRoute}/${id}`;
}

export function cheatSheetForRoute(route: string) {
  return cheatSheets.find(({ id }) => cheatSheetRoute(id) === route);
}
