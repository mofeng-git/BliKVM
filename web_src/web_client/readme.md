## 1. How to run this project
```
cd web_client
npm install
npm run dev
```
If you change somecode, you want to test, you can run web client in your pc. Before install and run, you need change `dev_device_ip` in config.js to your blikvm ip.

If you want compile client inside the blikvm v4 allwinner, you need to
```
export NODE_OPTIONS=--max-old-space-size=4096
```
## 2. Commit Guidelines

The recommended format is as follows:
```
<type>: <subject>
```
`type` is the change category, with the following options:

- `feature` or `feat`: new function
- `fix`: fix bug
- `docs`: Documentation changes
- `style`: format (changes that do not affect code operation)
- `refactor`: Refactoring (that is, code changes that are not new features or bug fixes)
- `test`: add test
- `merge`: code merge
- `revert`: roll back to a certain commit
- `build`: used to update build configurations, development tools, etc.
- `chore`: Miscellaneous, other non-functional changes

`subject` is a short description of the commit, which is recommended to be no more than 50 characters.

## License
Copyright (C) 2018-2024 by blicube info@blicube.com

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see https://www.gnu.org/licenses/.
