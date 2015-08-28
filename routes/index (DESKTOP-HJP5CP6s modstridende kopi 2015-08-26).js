var express = require('express');
var router = express.Router();
var https = require('https');
var querystring = require('querystring');
var cheerio = require('cheerio');

/* GET home page. */
router.get('/', function(req, res, next) {
	if(req.headers.cookie != undefined && req.headers.cookie.indexOf('wcid') > -1 && req.headers.cookie.indexOf('session_userkey') > -1){
		var html;
		https.get({
			host: 'fronter.com',
			path: '/cphbusiness/personal/index.phtml',
			headers: {
				'Cookie': req.headers.cookie,
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
			}
		}, function(home_res) {
			home_res.on('data', function(d) {
				html += d.toString();
			})
		}).on('error', function(e) {
			console.log("Got error: " + e.message);
		}).on('close', function() {
			$ = cheerio.load(html);

			var data = {
				name: $('a.ctrl-button').first().text(),
				rooms: []
			}

			// Rooms
			$('.fav-room-list-element.content-frame-content').each(function(i,e) {
				data.rooms.push({
					name: $(this).find('tr td a').text(),
					link: $(this).find('tr td a').attr('href')
				})
			})



			for (var i = 0; i < $('.fav-room-list-element.content-frame-content').length; i++) {
				$('.fav-room-list-element.content-frame-content').eq(i)
			};


			res.render('index', data);
		})









	} else
		res.redirect('/login')



});


router.get('/login', function(req, res, next) {
  res.render('login');
});

var req = router.post('/login', function(req, res, next) {


	var tokenData, request_token, SSO;
	https.get('https://fronter.com/cphbusiness/', function(tokenRes) {
		tokenRes.on('data', function(d) {
			tokenData += d.toString();
		})
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	}).on('close', function() {

		$ = cheerio.load(tokenData);
		request_token = $('input[name=fronter_request_token]').val();
		SSO = $('input[name=SSO_COMMAND_SECHASH]').val();

		var postData = querystring.stringify({
			username: req.body.username,
			password: req.body.password,
			fronter_request_token: request_token,
			SSO_COMMAND_SECHASH: SSO,
			saveid: -1,
			newlang: 'en',
			mainurl: 'main.phtml',
			screenSize: '1920x1080'
		})

		var options = {
			host: 'fronter.com',
			path: '/cphbusiness/index.phtml',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': postData.length,
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
			}
		}

		var postReq = https.request(options, function(loginRes) {
			loginRes.setEncoding('utf8');

			console.log(loginRes.headers['set-cookie']);

			// var cookie = '';
			// for (var i = 0; i < loginRes.headers['set-cookie'].length; i++) {
			// 	cookie += loginRes.headers['set-cookie'][i].substring(0,loginRes.headers['set-cookie'][i].indexOf(';')) + "; "
			// };
			// cookie.slice(0,-2);

			loginRes.on('data', function (chunk) {
				// tokenData += chunk.toString();
			});

			loginRes.on('end', function() {
				if(loginRes.headers['set-cookie'] !== undefined) { //Successful Login

					for (var i = 0; i < loginRes.headers['set-cookie'].length; i++) {
						var cookie = loginRes.headers['set-cookie'][i];
						var equI = cookie.indexOf('=');
						res.cookie(cookie.substring(0,equI), cookie.substring(equI+1, cookie.indexOf(';')))
					};

					res.redirect('/');
				} else {
					res.render('login', {error: 'Wrong login'});
				}
			})

		});

		postReq.write(postData);
		postReq.end();

	
	})

});



module.exports = router;
