# MAD VILLAGE
![Node.js](https://img.shields.io/badge/Node.js-v20.x-green.svg) ![Vue.js](https://img.shields.io/badge/Vue.js-3.x-brightgreen.svg) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4.x-blue.svg) ![socket.io](https://img.shields.io/badge/socket.io-4.x-lightgrey.svg)

![Mad Village Game](./vuejs/src/assets/background.png)

## About
This game is based on the classic "Werewolf" game, but with some key differences. The basic structure still involves two main groups: the **villagers** and the **werewolves**. However, the **villagers** are further divided into two traits: *good* and *mad*. The good villagers are those who can perform actions during the game, while the *mad* villagers are unable to take any actions.

The **werewolves**, representing the *bad* traits, have the ability to perform more actions than the villagers. The gameplay is divided into several phases, each with specific actions:

- The Night Phase: During this phase, players choose the targets and perform actions.
- The Day Phase: Reported the results of the actions taken in the night phase.
- The Discussion Phase: Players are allowed to chat with each other, discuss the events of the night and try to figure out who the werewolves are.
- The Vote Phase: Players then vote on who they believe should be hanged. The player with the most votes is eliminated from the game.

The game will *end* when one of the following conditions is met:

- The number of villagers is less than or equal to the number of werewolves.
- There are no werewolves left in the game.

## Install

*Note: The testing is on progress*

### Backend
```
cd expressjs
npm install
nodemon
```

Add your env configuration: [Backend config](./expressjs/README.md)

### Frontend
```
cd vuejs
npm install
npm run dev
```

Add your env configuration: [Frontend config](./vuejs/README.md)

## Credits

### Assets
- Characters: [shubibubi](https://shubibubi.itch.io)
- Map and Houses: [cypor](https://cypor.itch.io)
- Bow: [stealthix](https://stealthix.itch.io)
- Medkit: [josupixel](https://josupixel.itch.io)

### Game
- Development: [Me](https://github.com/toi-la-qanh) btw :)
- Idea: [Mafia (party game)](https://en.wikipedia.org/wiki/Mafia_(party_game)), [Ultimate Werewolf](https://en.wikipedia.org/wiki/Ultimate_Werewolf)

### Others
- [Google Fonts](https://fonts.google.com/icons)
- [Font Awesome Icons](https://fontawesome.com/icons)