const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());

let games = {};
let currentGameId = 0;

//juurimappaus antaa aloitus tiedon ja kertoo mistä postman pyynnön esimerkit löytyvät
app.get('/', (req, res) => {
    res.json({
        message: "MuistiPeli, pelia ohjetaan end-pointien avulla, jotka löytyvät readme-tiedostosta"
    });
});

//alustaa uuden pelin eli luo laudan ja antaa sille ID:n
app.post('/api/game', (req, res) => {
    const gameId = ++currentGameId;
    const { size = 4 } = req.body; // Oletusarvoisesti 4x4 pelilauta
    games[gameId] = { size, board: initializeBoard(size), moves: 0, completed: false, matchedPairs: 0 };
    res.json({ gameId, message: "Peli Luotu", size });
});

//näyttää käynnissä olevan pelin tilanteen ID:n perusteella
app.get('/api/game/:id', (req, res) => {
    const { id } = req.params;
    const game = games[id];
    if (game) {
        res.json({ gameId: id, board: game.board.map((card, index) => card.matched ? null : index), moves: game.moves, completed: game.completed });
    } else {
        res.status(404).send('tarkista yhteys');
    }
});

//tekee uuden siirron, jos se on mahdollinen toteuttaa.(paikkalla ei ole yhdistettyä paria
// tai peli ei ole lopetettu.)
app.post('/api/game/move', (req, res) => {
    const { gameId, position1, position2 } = req.body;
    const game = games[gameId];
    if (game && !game.completed && validMove(game, position1, position2)) {
        const result = makeMove(game, position1, position2);
        res.json(result);
    } else {
        res.status(404).send('Siirto ei mahdollinen tai peli lapaisty');
    }
});
//laudan luonti
function initializeBoard(size) {
    let cards = [];
    let totalPairs = (size * size) / 2;
    for (let i = 1; i <= totalPairs; i++) {
        cards.push({id: i, matched: false}, {id: i, matched: false});
    }

    // Sekoita kortit
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    return cards;
}

//siirron logiikka
function makeMove(game, position1, position2) {
    if (game.board[position1].id === game.board[position2].id) {
        game.board[position1].matched = true;
        game.board[position2].matched = true;
        game.moves++;
        game.matchedPairs++;
        if (game.matchedPairs * 2 === game.size * game.size) {
            game.completed = true;
        }
        return { correct: true, completed: game.completed };
    } else {
        game.moves++;
        return { correct: false, completed: game.completed };
    }
}

//tarkistaa siirron mahdollisuuden
function validMove(game, position1, position2) {
    return position1 !== position2 && !game.board[position1].matched && !game.board[position2].matched;
}

app.listen(port, () => {
    console.log(`Memory Game API running on http://localhost:${port}`); //mikä vain lokaali portti jonka päättää avata.
});
