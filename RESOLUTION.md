tests/site-contract.test.mjs: the allowed external-host list was extended on both sides — main added the
user./org./auth. login subdomains, this PR added ores-chat.github.io for the CSP-pinned footer launcher.
Kept the union so the site contract test admits every documented host.
