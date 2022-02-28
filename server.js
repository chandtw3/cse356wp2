const express = require('express')
const path = require('path');
const mongoose = require('mongoose')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const nodemailer = require('nodemailer')
const dotenv = require('dotenv').config()
const connection = require('./db')
const { User, validate } = require('./models/user')


const app = express()

const port = 3000;

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use('/css', express.static('css'))
app.use(cookieParser())
app.use(session({
	secret: 'keyboard cat',
	resave: true,
	saveUninitialized: true
}));


app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

gameId = 0


mongoose.Promise = global.Promise;
(async () => await connection())();
// mongoose.connect(`mongodb://admin:password@localhost:27017`, {useNewUrlParser: true}, function (err) {
//   if (err) throw err;
//   console.log("successfully connected");
// })
const db = mongoose.connection

let transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		service: 'gmail',
		port: 587,
		secure: false,
		auth: {
				user: process.env.MAIL_USERNAME,
				pass: process.env.MAIL_PASSWORD,
		}
})


app.get('/', (req, res) => {
	res.render('index', { title: 'SUP SUP', message: 'HEY!'})
})

app.post('/adduser', async (req, res) => {
	console.log(req.body)
	res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
	// First Validate The Request
	// const { error } = validate(req.body);
	// if (error) {
	// 		console.log('Invalid user creation');
	// 		return res.json({ status: "ERROR" });
	// }
	// Check if this user already exisits
	let user = await User.findOne({ email: req.body.email });
	if (user) {
			console.log('user already exists');
			return res.json({ status: "ERROR" });
	} else {
			// Insert the new user if they do not exist yet
			user = new User({
					username: req.body.username,
					email: req.body.email,
					password: req.body.password,
					verified: false
			});
			await user.save();
			console.log(user);
			console.log('sent to: ' + req.body.email);
			let mailOptions = {
				from: '"CSE356-415" <cse356415@gmail.com>',
				to: req.body.email,
				subject: 'Verification Password',
				text: "uniquepasswordlol",
				html: "<div>uniquepasswordlol</div>"
			}
			let info  = await transporter.sendMail(mailOptions, function(error, info) {
				if (error){
					console.log(error);
					res.json({ status: "OK" })
				}
				console.log('Message sent: ' + info.response);
			});
			res.json({ status: "OK" });
	}
})  

app.post('/verify', async (req, res) => {
	res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
	console.log(req.body);
	let user = await User.findOne({ email: req.body.email});
	if (user && req.body.key === "abracadabra") {
		console.log(user);
		await User.updateOne({ email: req.body.email }, { verified: true});
		user = await User.findOne({ email: req.body.email });
		console.log('verified')
		res.json({ status: "OK" })
	} else {
		console.log('failed to verify');
		res.json({ status: "ERROR" });
	}
})

app.post('/login', async (req, res) => {
	res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
		let user = await User.findOne({ username: req.body.username, password: req.body.password, verified: true });
		if(req.cookies.id === req.sessionID) {
			console.log('Already logged in')
			res.json({ status: "ERROR" });
		}
		else if (user) {
				console.log('Found user: ' + req.body.username);
				console.log('Session ID: ' + req.sessionID);
				if (req.cookies.games == undefined) {
					req.session.games = []
					req.session.score = {"human": 0, "wopr": 0, "tie": 0}
				} 
				res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
				res.cookie('id', req.sessionID).json({ status: "OK" });
		} else {
			console.log('Could not find user: ' + req.body.username)
			res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
			res.json({ status: "ERROR" });
		} 
})

app.post('/logout', (req, res) => {
	res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
	if(req.cookies.id !== req.sessionID) {
			console.log('Not logged in');
			res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
			res.json({ status: "ERROR" });
	}
	else {
		res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
		res.cookie('id', "").json({ status: "OK"})
	}
})

app.get('/ttt', (req, res) => {
	res.render('play', { grid: grid })
})

const checkWinner = (grid) => {
	// rows
	if (grid[0] === grid[1] && grid[1] === grid[2] && grid[0] != " ") return grid[0]
	if (grid[3] === grid[4] && grid[4] === grid[5] && grid[3] != " ") return grid[3]
	if (grid[6] === grid[7] && grid[7] === grid[8] && grid[6] != " ") return grid[6]

	// cols
	if (grid[0] === grid[3] && grid[3] === grid[6] && grid[0] != " ") return grid[0]
	if (grid[1] === grid[4] && grid[4] === grid[7] && grid[1] != " ") return grid[1]
	if (grid[2] === grid[5] && grid[5] === grid[8] && grid[2] != " ") return grid[2]

	// diag
	if (grid[0] === grid[4] && grid[4] === grid[8] && grid[0] != " ") return grid[0]
	if (grid[2] === grid[4] && grid[4] === grid[6] && grid[2] != " ") return grid[2]
	if ((grid.indexOf(" ")) == -1) {
		return "tie"
	} 
	return ' ';
}

const makeBotTurn = (grid) => {
		for(let i = 0; i < grid.length; ++i){
			if(grid[i] === ' '){
				grid[i] = "O";
				return checkWinner(grid);
			}
		}
		return ' ';

}

const resetGrid = () =>{
	console.log("resetting grid")
	grid = Array(9).fill(' ');
	winner = ' '; //Hi dennis
}


app.post('/ttt/play', (req, res) => {
	res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
	if(req.cookies.id !== req.sessionID) {
		console.log('Not logged in')
		res.json({ status: "ERROR" });
	}
	else {
		// Making a new game because the last game has been completed
		if (req.session.games.length == 0) {
			game = {
					"id": gameId,
					"start_date": new Date(),
					"grid": [" ", " "," "," "," "," "," "," "," "],
					"winner": " "
				}
				gameId++
				req.session.games.push(game)
		}
		curr = req.session.games[req.session.games.length-1]
		move = req.body.move
		if (move == null) {
			// Make it outside?
			return res.json({ status: "OK", grid: curr.grid, winner: curr.winner}); // If move is null, dont make a move and send json
		}
		else {
			if (curr.grid[move] !== " ") return res.json({ status: "OK", grid: curr.grid, winner: curr.winner});
			curr.grid[move] = "X"
			winner = checkWinner(curr.grid)
			if (winner === ' ') {
				makeBotTurn(curr.grid)
				winner = checkWinner(curr.grid)
				if (winner !== ' ') {
					curr.winner = winner
					if (winner === "tie") req.session.score.tie++
					else if (winner === "O") req.session.score.wopr++
					else req.session.score.human++
					game = {
						"id": gameId,
						"start_date": new Date(),
						"grid": [" ", " "," "," "," "," "," "," "," "],
						"winner": " "
					}
					gameId++
					req.session.games.push(game)
					console.log(req.session)
					
					return res.json({grid: curr.grid, winner: curr.winner})
				} else {
					return res.json({grid: curr.grid, winner: curr.winner})
				}
			}
			curr.winner = winner
			if (winner === "tie") req.session.score.tie++
			else if (winner === "O") req.session.score.wopr++
			else req.session.score.human++
			game = {
				"id": gameId,
				"start_date": new Date(),
				"grid": [" ", " "," "," "," "," "," "," "," "],
				"winner": " "
			}
			gameId++
			console.log(req.session)
			req.session.games.push(game)
			return res.json({grid: curr.grid, winner: curr.winner})
		}
	}
})

app.post('/listgames', (req,res) =>{
	console.log("LIST GAMES")
	res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
	whatever = req.session.games.map(({id, start_date, ...rest}) =>{return {id, start_date}})
	console.log(whatever)
	return res.json({status: "OK", games: whatever});

})

app.post('/getgame', (req,res) =>{
	res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
	id = parseInt(req.body.id);
	let requested_game;
	for(let i = 0; i < req.session.games.length; i++) {
		if(req.session.games[i].id == id) {
			requested_game = req.session.games[i];
			break;
		}
	}
	return res.json({status: "OK", grid:requested_game.grid, winner:requested_game.winner})
})

app.post('/getscore', (req,res) =>{
	res.setHeader("X-CSE356", "61f9e6a83e92a433bf4fc9fa")
	let { human, wopr, tie } = req.session.score;
	return res.json({status: "OK", human: human, wopr: wopr, tie: tie})

})

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})