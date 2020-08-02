# Rotten_Tomatoes_Netflix_Chrome_Extension
![Extension Ex](RT_Netflix_Ext_Ex.png)

## Description
A chrome extension that adds Rotten Tomatoes's critic and audience reviews to the Netflix browser.

## How To Use
1) Get an API key from uNoGS API and paste it the "NETFLIX_DATA_API_KEY" string varible inside the content.js file . (The uNoGS API limits calls to a hundred a day. Any call over the 100 allotment results in a 10 cent charge.) [Website](https://rapidapi.com/unogs/api/unogsNG)
2) Add the extension to Chrome (see the "Manage apps and extensions" section) [Website](https://support.google.com/chromebook/answer/2588006?hl=en)
3) Drag and drop the file to the extensions page.
4) Once it is loaded, click the "details" button for the extension.
5) Go to the "site access" section, select "on specific sites", and add the following url: https://www.netflix.com/
6) Go to the Netflix website, login, and refresh your page and you should see a tomato icon when a content image is in focus.
7) Click the icon to see the score for show.

## Resources Used
- Rotten Tomatoes Website [Website](https://www.rottentomatoes.com/)
- Allorigins Proxy Server [Website](https://allorigins.win/)
- uNoGS API -- an unofficial Netflix API -- for Netflix content database [About](https://rapidapi.com/unogs/api/unogsng/details)
- Telugu Gameboy's, "How to Build an IMDb Chrome Extension for Netflix Using JavaScript" [Tutorial](https://www.youtube.com/watch?v=_CER5Hoc6F0)
