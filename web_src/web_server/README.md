## Table of Contents

- [1. Project Structure](#1-project-structure)
- [2. Call Hierarchy](#2-call-hierarchy)
- [3. Code Logic](#3-code-logic)
- [4. To-Do Items](#4-to-do-items)
- [5. Naming Conventions](#5-naming-conventions)
- [6. Commit Guidelines](#6-commit-guidelines)


## 1. Project Structure

The file and directory structure of the project is as follows:

- src: Source code
- test: Test code
- lib: Dependency libraries and Dependency scripts
- doc: Documentation
- config: Configuration files
- scripts: Script files
- release: Release versions
- README.md: Project overview
- package.json: Project configuration

## 2. Call Hierarchy

The call hierarchy is divided into six layers, where upper layers can call lower layers, but lower layers cannot call upper layers.

| Layer | Contents |
|---------|---------|
| 1 | index.js |
| 2 | server |
| 3 | modules |
| 5 | common |
| 6 | lib, config |

## 3. Code Logic

(1) The core code consists of four objects: HTTP server object, HTTP API object, video stream API object, and log object.

(2) All four objects are implemented using the singleton design pattern to ensure uniqueness.

(3) The HTTP server object and log object start when the KVM is powered on.

(4) The HTTP API object, and video stream API object start only when the service is started.

## 4. Naming Conventions

In programming, there are several common naming conventions:

Camel Case: The first word starts with a lowercase letter, and the first letter of each subsequent word is capitalized. Example: firstName.

Pascal Case: The first letter of each word is capitalized. Example: FirstName.

Snake Case: Words are connected with underscores (_), and all letters are lowercase. Example: first_name.

Kebab Case: Words are connected with hyphens (-), and all letters are lowercase. Example: first-name.

Constant Case: All letters are capitalized, and words are connected with underscores (_). Example: FIRST_NAME.

| Naming Content | Naming Convention | Example |
|--|--|--|
| Enum Type | Pascal Case | Direction |
| Enum Value | Constant Case | UP_LEFT |
| Constant | Constant Case | MATH_VALUE |
| Class | Pascal Case | HttpServer |
| Class Property | Camel Case with underscore prefix | _value |
| Class Getter/Setter | Camel Case | value |
| Class Private Method | Camel Case with underscore prefix | _test() |
| Class Public Method | Camel Case | test() |
| Class Private Static Property | Camel Case with underscore prefix | _value |
| Class Public Static Property | Camel Case | value |
| Class Private Static Method | Camel Case with underscore prefix | _test() |
| Class Public Static Method | Camel Case | test() |
| Global Variable | Camel Case | value |
| Local Variable | Camel Case | value |
| Function Name | Camel Case | runServer() |
| File Name | Snake Case | http_server.js |

## 5. Commit Guidelines

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

## 6. How to build
You need to build client first, then cp dist to server, then build server.
```
# build client
cd web_client
npm install
npm run build
cp -r dist ../web_server
cd ../

# build server
cd ./web_server
npm install
npm run clean
npm run build
```

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
