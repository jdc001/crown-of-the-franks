# Receiving bug reports

When a player taps **Settings → Report a bug** (or **Report it** on the bar that appears after an error), the game builds a report and sends it to the address in `BUG_ENDPOINT` at the top of `js/bugs.js`.

A report contains: the version, map, house, turn and date; the device (browser string, screen size, whether it runs from the home screen); the settings; the player's last 80 moves; up to 20 error messages with their stack traces; the last 40 lines of the chronicle; the player's note; and, if they leave the box ticked, the whole game, gzipped.

Until `BUG_ENDPOINT` is set, the report goes to the share sheet (Mail, Messages, Files) as a `.json` file, or downloads.

## The receiver: a free Google Apps Script

It saves every report as a file in a Google Drive folder and emails you a summary with a link to it. No server, no cost.

1. Go to https://script.google.com and choose **New project**. Name it "Anointed bug reports".
2. Replace the code with the script below. Put your own address in `EMAIL`.
3. **Deploy → New deployment**. Type: **Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy, and allow the permissions it asks for (Drive and Gmail).
4. Copy the web app URL (it ends in `/exec`) and paste it into `BUG_ENDPOINT` in `js/bugs.js`. Then bump the version and publish.

```js
const FOLDER_NAME = 'Anointed bug reports';
const EMAIL = 'you@example.com';

function doPost(e) {
  const body = e.postData ? e.postData.contents : '';
  let r = {}; try { r = JSON.parse(body); } catch (x) { }
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
  const name = `bug ${r.v || '?'} ${r.map || ''} ${r.house || ''} T${r.turn ?? ''} ${new Date().toISOString()}.json`;
  const file = folder.createFile(name, body, 'application/json');
  const d = r.device || {};
  const errs = (r.errors || []).map(x => '- ' + x.msg).join('\n') || 'none';
  MailApp.sendEmail(EMAIL, `Anointed bug: v${r.v} ${r.map} ${(r.note || '').slice(0, 60)}`,
    `${r.note || '(no note)'}\n\nVersion ${r.v} · ${r.map} · ${r.house} · turn ${r.turn} (${r.date})\n` +
    `Device: ${d.ua}\nScreen: ${d.w}×${d.h} · ${d.layout} · home screen: ${d.standalone}\n\n` +
    `Errors:\n${errs}\n\nLast moves:\n${(r.crumbs || []).slice(-15).join('\n')}\n\nFull report: ${file.getUrl()}`);
  return ContentService.createTextOutput('ok');
}
```

Gmail limits a free account's script to about 100 emails a day, which is plenty. To stop the emails but keep the files, delete the `MailApp` line.

## Replaying a player's game

Open the game in a desktop browser, open the developer console, and run `bugLoad(<the report's JSON text>)`. The saved game in the report loads as if it were yours. Or send the report file to Claude to investigate.

## App Store privacy label

Because reports are only sent when the player asks, declare **Diagnostics → Crash data and Other diagnostic data**, *not linked to the user's identity*, *not used for tracking*, purpose *App functionality*.
