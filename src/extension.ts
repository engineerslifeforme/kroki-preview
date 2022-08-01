// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TextDocument, Uri, Webview } from "vscode";
import fetch from 'node-fetch';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "kroki-preview" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('kroki-preview.preview', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const pathString = path.join(context.extensionPath, 'media','test.html')
		const pathToHtml = vscode.Uri.file(
			pathString
		);
		const pathUri = pathToHtml.with({scheme: 'vscode-resource'}); 
		const panel = vscode.window.createWebviewPanel(
			'krokiPreview', // Identifies the type of the webview. Used internally
			'Kroki Preview', // Title of the panel displayed to the user
			vscode.ViewColumn.One, // Editor column to show the new webview panel in.
			{
				enableScripts: true
			  }
		);

		const editor = vscode.window.activeTextEditor;

		if (editor) {
			let document = editor.document;

			// Get the document text
			const documentText = document.getText();

			// DO SOMETHING WITH `documentText`

			let data;

			const body = JSON.stringify({
				diagram_source: documentText,
				diagram_type: "plantuml",
				output_format: "svg"
			});

			console.log(body);
			// "https://kroki.k8s.elsys.gtri.org"
			(async () => {
				const response = await fetch(
					"https://kroki.io", {
						method: 'post',
						body: body,
						headers: { 'Content-Type': 'application/json' }
					});
				data = await response.text();
				console.log(data);
				panel.webview.html = data;
			})();
		}

		// And set its HTML content
		// panel.webview.html = getWebviewContent();
		// panel.webview.html = fs.readFileSync(pathUri.fsPath,'utf8');
		const content = fixLinks(
			fs.readFileSync(pathUri.fsPath,'utf8'),
			pathString,
			panel.webview);
		//panel.webview.html = content;
		
	});

	context.subscriptions.push(disposable);
}

function getWebviewContent() {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Cat Coding</title>
  </head>
  <body>
	  <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
  </body>
  </html>`;
  }

// this method is called when your extension is deactivated
export function deactivate() {}

function fixLinks(document: string, documentPath: string, webView: Webview): string {
    return document.replace(
        new RegExp('((?:src=|href=|background-image:url\\()[\'\"])(.*?)([\'\"])', 'gmi'),
        (subString: string, p1: string, p2: string, p3: string): string => {
          const lower = p2.toLowerCase();
          if (p2.startsWith('#') || lower.startsWith('http://') || lower.startsWith('https://')) {
              return subString;
          }
          const index = p2.indexOf('?');
          if (index > - 1) {
            p2 = p2.substr(0, index);
          }
          const newPath = Uri.file(path.join(path.dirname(documentPath), p2));
          const newUrl = [
              p1,
              webView.asWebviewUri(newPath),
              p3,
          ].join('');
          return newUrl;
        },
    );
  }
