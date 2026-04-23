# cp-town-pulse
Capstone/group project for Team 1, the number 1 team, of Code Platoon - India E&amp;W

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#nstallation)
3. [Branching](#contributing)
4. [Commits](#commits)
5. [Contacts](#built-by)

### <u>Prerequisites</u>
- Docker & Docker Compose V2
- Python 3.12+
- Node.js 20+
- GNU Make

### <u>Tech Stack</u>
- **Frontend:** React, Vite, MUI
- **Backend:** Django (Python), Django REST Framework
- **Database:** PostgreSQL
- **DevOps:** Docker, Docker Compose, Makefile
- **APIs:** Socrata Discovery API (Government Data)



### <u>Environment Variables</u>
Copy the example file to `.env` and fill in your keys:
`cp backend/.env.example backend/.env`

### <u>Environment Setup</u>
The main scripting for this repo is completed using Makefile recipes. Makefiles can be overly complicated quickly, so only basic setup commands are included.

Make commands are executed like ```make \<command>\``` from your terminal.

```make help``` will provide a list of commands that can be used, as well as a short description.

Quick examples would be:
```
# bring up the docker stack
make up

# bring down the docker stack
make down

# remove everything  and kill the ports being used
make clean-start

# Django commands:
make migrate


- Makefiles **MUST** be indented using tabs and not spaces.
```

## Contributing
All contribuitions are welcome, but should be done through branching. 

### <u>Production Branch</u>
Production code will be made using the main branch. Any merging into the main branch will require a pull request to be opened and reviewed by one codeowner. 

### <u>Local Development Branch</u>
This is the code that is to be used as a demo. This code is maintained to always work locally, regardless of environment. 

### <u>Contributor Branch</u>
This is the code being worked on by individual developers. The branch names should be as follows:
1. ```\<dev-name>\-local-dev``` for general development.
2. ```feature-\<name-of-feature>\``` for specific features. 
3. ```bug-\<issue-number>\``` can be used for work completed on tracked issues. 


## Commits
Every effort should be made to follow the [Conventional Commit Standards](https://www.conventionalcommits.org/en/v1.0.0/#summary). That standard is summarized as:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Some examples of this format would be:
- Commit message with scope
    ```
    feat(lang): add Polish language
    ```
- Commit message with description and breaking change footer
    ```
    feat: allow provided config object to extend other configs

    BREAKING CHANGE: `extends` key in config file is now used for extending other config files

## Built By
* **Jose Medrano** - [GitHub](https://github.com/JoseMMedranoJr) | [LinkedIn](linkedin.com/in/josemmedranojr)
* **Logan Pederson** - [GitHub](https://github.com/pioneeremory) | [LinkedIn](https://www.linkedin.com/in/logan-pederson/)
* **Nicholas Van Doren** - [GitHub](https://github.com/Duzel33) | [LinkedIn](link)
* **W. Scott Walker** - [GitHub](https://github.com/wswalker87) | [LinkedIn](www.linkedin.com/in/scottwalkerdev)
