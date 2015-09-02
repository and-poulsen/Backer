var express = require('express');
var router = express.Router();
var https = require('https');
var querystring = require('querystring');
var cheerio = require('cheerio');

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.post('/login', function(req, res, next) {
	console.log("loginpost")

	var tokenData, request_token, SSO;
	https.get('https://fronter.com/cphbusiness/', function(tokenRes) {
		tokenRes.on('data', function(d) {
			// console.log(d.toString());
			tokenData += d.toString();
		})
		tokenRes.on('end', function() {
			console.log("endinside")
			console.log("got fronter login page")
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
					console.log("logged in, responding with cookie");

					var tempCookie = "";

					for (var i = 0; i < loginRes.headers['set-cookie'].length; i++) {
						var cookie = loginRes.headers['set-cookie'][i];
						var equI = cookie.indexOf('=');
						//res.cookie(cookie.substring(0,equI), cookie.substring(equI+1, cookie.indexOf(';')))

						tempCookie += cookie.substring(0,equI) + "=" + cookie.substring(equI+1, cookie.indexOf(';')) + "; ";
					};

					res.send({
						success: true,
						cookies: tempCookie
					});

					//res.redirect('/');
				} else {
					res.render('login', {error: 'Wrong login'});
				}
			})

		});

			postReq.write(postData);
			postReq.end();

			
		})
	});
});


module.exports = router;