# Lessons Learned

- React UMD errors are fixed via tsconfig.json jsx:react-jsx, never by editing component files.
- Never create components outside src/app/components/ — mixing Cursor Agent and Claude Code caused two folders (src/components/ and src/app/components/) that had to be manually consolidated.
