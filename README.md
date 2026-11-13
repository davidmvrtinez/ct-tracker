# CT Tracker

A private iPhone web app for tracking patient CT scans, from the request to the imaging center through upload to Materialise.

- Patient names, dates of birth, exact surgery dates and notes are stored **only on your iPhone**. They are never in this repo or in Google.
- The Google Sheet (for Claude Duet) gets only the case code (initials + birth year + side, like `JS-85-R`), surgeon, procedure, side, hospital, stage, follow-up dates, the surgery *week*, and imaging center contact info.
- This repo holds code only. No patient data is ever committed.

---

## 1. Put it on GitHub Pages (about 5 minutes)

1. On github.com, click **New repository** and name it something like `ct-tracker`. Public is fine because the repo contains only code.
2. Upload every file in this folder.
   - From a computer: `git init && git add . && git commit -m "CT Tracker" && git branch -M main && git remote add origin https://github.com/YOUR-USERNAME/ct-tracker.git && git push -u origin main`
   - Or drag the files into the repo page in your browser (**Add file → Upload files**).
3. In the repo, go to **Settings → Pages**. Under *Source*, pick **Deploy from a branch**, then **main** and **/ (root)**, then **Save**.
4. After about a minute your app is at `https://YOUR-USERNAME.github.io/ct-tracker/`.

## 2. Install it on your iPhone

1. Open that link in **Safari**.
2. Tap **Share**, then **Add to Home Screen**.
3. **Always open it from the home screen icon.** The home screen app keeps its own data, separate from Safari.

Then go to **Setup** in the app and add your surgeons, imaging centers and hospitals. The procedures (Reverse, Anatomic, Reverse Augment, Anatomic Augment) are already there.

## 3. Connect the Google Sheet (for Duet)

1. In Google Sheets, create a blank sheet named **CT Tracker**.
2. Go to **Extensions → Apps Script**. Delete what's there, then paste in everything from `Code.gs`.
3. In the app, go to **Setup → Google Sheet sync**, tap **New** next to *Secret key*, and copy the key.
4. Back in Apps Script, replace `PASTE-YOUR-SECRET-KEY-HERE` with that key and save.
5. Click **Deploy → New deployment**. Next to *Select type*, click the gear icon and choose **Web app**:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**. The app has no Google sign-in, so this setting is required; the secret key keeps everyone else out.
   - Click **Deploy**, approve the permissions, and copy the **Web app URL**.
6. In the app, paste the URL, tap **Save & sync now**, and look for "Synced". Your sheet now has **Active**, **Completed** and **About** tabs.

From then on, every change you make in the app syncs automatically.

> If you edit `Code.gs` later, go to **Deploy → Manage deployments → Edit → Version: New version** so the change takes effect.

### Optional: morning email digest (works even without Duet)
In Apps Script, choose `installDailyDigest` from the function dropdown and click **Run**. Every weekday at about 7 AM you'll get an email listing follow-ups due, CTs to upload and surgeries coming up soon. No email is sent if nothing needs attention.

## 4. Set up Claude Duet

1. Make sure the Google account that owns the Sheet is connected to Claude (Google Drive connector).
2. In the app, open **Setup → Duet setup message**, tap **Copy**, and send it to Duet.

## How it works

| | |
|---|---|
| **Case code** | First initial + last initial, birth year, side: `JS-85-R`. A duplicate gets a number added (`JS-85-R2`). |
| **Stages** | Requested → Received → Uploaded. Marking a patient Uploaded moves them to **Completed**, and **Reopen** brings them back. |
| **Follow-ups** | Due 2 business days after the request. Tapping **Log follow-up** resets the clock to 2 more business days. You can also set a specific date, for example if the center says it's sending Monday. Weekends are skipped; holidays aren't. |
| **Urgency** | 🔴 surgery within 7 days, or a follow-up due today or overdue · 🟠 surgery within 21 days, or CT received but not uploaded · 🟢 on track |
| **Filters** | By surgeon, and by surgery date (≤ 7 days, ≤ 2 weeks, ≤ 30 days, not scheduled), plus search. |
| **Email button** | Opens your Mail app with a ready-to-send follow-up to the imaging center. |

## Backups

Because patient names live only on the phone, tap **Setup → Export backup** now and then and save the file to the Files app or iCloud Drive. **Restore** loads a backup back in, for example on a new phone.

## Updating the app

Push changes to GitHub. The app picks them up the next time you open it with internet. Your data isn't affected.
