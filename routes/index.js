var express = require('express');
var router = express.Router();
var https = require('https');
var querystring = require('querystring');
var cheerio = require('cheerio');

// Home
router.get('/', function(req, res, next) {
		var html;
		https.get({
			host: 'fronter.com',
			path: '/cphbusiness/personal/index.phtml',
			headers: {
				'Cookie': req.headers.cookie,
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
			}
		}, function(response) {
			response.on('data', function(d) {
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
				var c = 0;
				for (var i = 0; i < data.rooms.length; i++) {
					if(data.rooms[i].name == $(this).find('tr td a').text())
						c++;
				};
				if(c == 0)
					data.rooms.push({
						name: $(this).find('tr td a').text(),
						link: "/room/" + $(this).find('tr td a').attr('href').substring($(this).find('tr td a').attr('href').indexOf("edit=") + 6)
					})
			})
			console.log(data.rooms);
			res.render('index', data);
		})
});
// curl "https://fronter.com/cphbusiness/prjframe/index.phtml?orderid=0&toolprjid=474978041&logstat_toolid=25&mo=2" -H "Accept-Encoding: gzip, deflate, sdch" -H "Accept-Language: en-US,en;q=0.8,da;q=0.6" -H "Upgrade-Insecure-Requests: 1" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" -H "Cache-Control: max-age=0" -H "Cookie: wcid=fed1b78739f9f928; session_userkey=4fe093cde1ad16ee812ea91111deab32; __cfduid=d6757e7a5d5ea4558cbdc2ab38f0d17831438269569" -H "Connection: keep-alive" --compressed


// Room
router.get('/room/:id', function(req, res, next) {
	var html;

	quickGet('cphbusiness/prjframe/chp.phtml?edit=' + req.params.id + '&viaChp=1', req, function() {
		quickGet('/cphbusiness/contentframeset.phtml?goto_prjid=' + req.params.id, req, function() {
			quickGet('/cphbusiness/navbar.phtml?goto_prjid=' + req.params.id, req, function() {

				https.get({
					host: 'fronter.com',
					path: '/cphbusiness/prjframe/index.phtml?orderid=0&toolprjid=' + req.params.id + '&logstat_toolid=25&mo=2',
					headers: createHeaders(req)
				}, function(response) {
					response.on('data', function(d) {
						html += d.toString();
					})
				}).on('error', function(e) {
					console.log("Got error: " + e.message);
				}).on('close', function() {
					$ = cheerio.load(html);

					var data = {
						rooms: []
					}
					// Rooms
					$('.mybookmarks-element tr td.tablelist-text a').each(function(i,e) {
						var c = 0;
						for (var i = 0; i < data.rooms.length; i++) {
							if(data.rooms[i].name == $(this).text())
								c++;
						};
						if(c == 0) {
							var l = $(this).attr('href');
							l = l.substring(l.indexOf('iid=') + 4);
							l = '/tree/' + l.substring(0, l.indexOf('&sechash'));
							data.rooms.push({
								name: $(this).text(),
								link: l
							})
						}
					})
					// res.send(html);
					res.render('index', data);
				})
			})
		})
	})
});

// Tree
router.get('/tree/:id', function(req, res, next) {
	var html;

	https.get({
		host: 'fronter.com',
		path: '/cphbusiness/links/structureprops.phtml?temp=temp&init_load=1&treeid=' + req.params.id,
		headers: createHeaders(req)
	}, function(response) {
		response.on('data', function(d) {
			html += d.toString();
		})
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	}).on('close', function() {
		$ = cheerio.load(html);

		var data = {
			rooms: []
		}

		// Folders
		// console.log($('.content-of-selected-folder').text());
		$('.content-of-selected-folder tr td label a').each(function(i,e) {
			var c = 0;
			for (var i = 0; i < data.rooms.length; i++) {
				if(data.rooms[i].name == $(this).text())
					c++;
			};
			if(c == 0) {
				var link = $(this).attr('href'), type;

				if(link.contains('treeid')) {
					type = 'tree';
					link = '/tree/' + getId(link, 'treeid=', '');
				} else if(link.contains('url_redirect')) {
					type = 'redirect';
					link = '/redirect/' + getId(link, 'id=', '')
				} else if(link.contains('/files.phtml')) {
					type = 'file';
					link = '/file?path=' + encodeURIComponent(getId(link, 'files.phtml/', ''))
				} else if(link.contains('player/index.php')) {
					type = 'file';
					link = '/file?path=' + getId(link,'files.phtml%2F', '');
				}

				data.rooms.push({
					name: $(this).text(),
					link: link,
					type: type
				})
			}
		})
		res.render('index', data);
	})

});


// File
router.get('/file', function(req, res, next) {
	var html;
	// if(req.query.path.contains())
	https.get({
		host: 'fronter.com',
		path: '/cphbusiness/links/files.phtml/' + req.query.path,
		headers: createHeaders(req)
	}, function(response) {
		res.writeHeader(response.statusCode, response.headers);
		response.pipe(res);
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	}).on('close', function() {
		// res.send("hi");
		// res.render('index', data);
	})

});

// Redirect
router.get('/redirect/:id', function(req, res, next) {
	var html;
	https.get({
		host: 'fronter.com',
		path: '/cphbusiness/links/url_redirect.phtml?id=' + req.params.id,
		headers: createHeaders(req)
	}, function(response) {
		response.on('data', function(d) {
			html += d.toString();
		})
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	}).on('close', function() {
		console.log(html);
		console.log("REDIRECT TO: " + getId(html,' location.replace("', '");'));
		res.redirect(getId(html,'location.replace("', '");'));
		// res.render('index', data);
	})

});








var getId = function(string, before, after) {
	string.replace(/\n/g, '');
	string = string.substring(string.indexOf(before) + before.length);
	if(after.length > 0)
		return string.substring(0, string.indexOf(after));
	return string;
		
}




if (!('contains' in String.prototype)) {
  String.prototype.contains = function(str, startIndex) {
    return ''.indexOf.call(this, str, startIndex) !== -1;
  };
}


var quickGet = function(url, req, cb) {
	console.log("getting: " + url);
	https.get({
		host: 'fronter.com',
		path: url,
		headers: createHeaders(req)
	}, function(response) {
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	}).on('close', function() {
		console.log("gotem");
		cb();
	})
}


var createHeaders = function(req) {
	var r = {
		'Cookie': req.headers.cookie,
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
		// 'Accept-Encoding': 'gzip, deflate, sdch',
		'Accept-Language': 'en-US,en;q=0.8,da;q=0.6',
		'Host': 'fronter.com',
		'Cache-Control': 'max-age=0',
		'Upgrade-Insecure-Requests': 1
	};
	return r;
}

module.exports = router;
