/// <reference path="../typings/tsd.d.ts" />

import { ExtensionContext, commands, window, workspace, QuickPickItem, QuickPickOptions, TextEditor } from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as Q from 'q';
import * as mkdirp from 'mkdirp';

export function activate(context: ExtensionContext) {

  console.log('Your extension "vscode-new-file" is now active!');

  let disposable = commands.registerCommand('extension.createNewFile', () => {

    const File = new FileController();

    File.showFileNameDialog()
      .then(File.determineFullPath)
      .then(File.createFile)
      .then(File.openFileInEditor)
      .catch((err) => {
        if (err) {
          window.showErrorMessage(err);
        }
      });
  });

  context.subscriptions.push(disposable);
}

export class FileController {
  public showFileNameDialog(): Q.Promise<string> {
    const deferred: Q.Deferred<string> = Q.defer<string>();

    window.showInputBox({
      placeHolder: 'File path relative to workspace root',
      value: '',
      prompt: 'Enter path of file to create or open.'
    }).then((relativeFilePath) => {
      if (relativeFilePath) {
        deferred.resolve(relativeFilePath);
      }
    });

    return deferred.promise;
  }

  public createFile(newFileName): Q.Promise<string> {
    const deferred: Q.Deferred<string> = Q.defer<string>();
    let dirname: string = path.dirname(newFileName);
    let fileExists: boolean = fs.existsSync(newFileName);

    if (!fileExists) {
      mkdirp.sync(dirname);

      fs.appendFile(newFileName, '', (err) => {
        if (err) {
          deferred.reject(err.message);
          return;
        }

        deferred.resolve(newFileName);
      });
    } else {
      deferred.resolve(newFileName);
    }

    return deferred.promise;
  }

  public openFileInEditor(fileName): Q.Promise<TextEditor> {
    const deferred: Q.Deferred<TextEditor> = Q.defer<TextEditor>();

    workspace.openTextDocument(fileName).then((textDocument) => {
      if (!textDocument) {
        deferred.reject('Could not open file!');
        return;
      }

      window.showTextDocument(textDocument).then((editor) => {
        if (!editor) {
          deferred.reject('Could not show document!');
          return;
        }

        deferred.resolve(editor);
      });
    });

    return deferred.promise;
  }

  public determineFullPath(filePath): Q.Promise<string> {
    const deferred: Q.Deferred<string> = Q.defer<string>();
    let suggestedPath: string = path.join(workspace.rootPath, filePath);

    deferred.resolve(suggestedPath);
    return deferred.promise;
  }
}