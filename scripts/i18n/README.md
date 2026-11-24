# Public website languages

English is the source of truth. Spanish (`es`) and Simplified Chinese (`zh-Hans`, URL `/zh-hans/`) are static translations, not an external translation widget.

Run `python scripts/i18n/build.py` after editing the English pages or translation catalogue. The generator preserves raw scripts, SVG, form field names and backend option values. `catalog.json` contains exact English text keys; `translations.tsv` maps its numeric keys to Spanish and Chinese. `extras.tsv` contains accessible labels and dynamic interface messages. Keep columns tab-separated.

Run `python scripts/i18n/check.py` and `node --check assets/i18n/language.js` before publishing. The static checks need Python lxml. Generated pages are committed for GitHub Pages; no new hosting service is needed.

The globe opens a language-only native dialog. Cancel, Escape and the close control leave the page unchanged. Confirm remembers only the language in localStorage. Direct localized links take priority; English entry pages use the saved preference. In-progress submissions prompt before a language change discards them. Submitted content and file names must never be translated by the interface observer.

The research article remains English, with a clear notice when a reader chooses another language. No localized research article is published without review. Classroom Studio is a separate application; its account and student-language behavior are unchanged. The unlisted workshop-review and submission-check tools are not translated by this website release. Editorial review and receipt emails remain English.

These translations were prepared with AI assistance and checked for structural completeness and function; an independent fluent-language review has not yet been completed. Recheck translations whenever substantive policy copy changes. English-source links are supplied on the translated contributor guide and privacy pages.

The selector has no country/region field. Russian and Korean are not added in this release. The language preference is not transmitted with manuscripts and does not alter permissions, delivery or manuscript requirements.
