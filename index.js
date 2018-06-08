const API = "api.speedrunslive.com";
const PAGE_SIZE = 20;

var results = [];
var resultsDOM = $("#results");

function pad2(n) {
	return (n < 10) ? "0" + n : n;
}

function parseDuration(s) {
	return pad2(Math.floor(s/3600)) + ":" + pad2(Math.floor((s % 3600)/60)) + ":" + pad2(Math.floor((s % 60)));
}

function createResultRow(result) {
	var row = $("<tr/>");
	row.append("<td>" + result.id + "</td>");
	row.append("<td>" + new Date(result.date*1000) + "</td>");
	row.append("<td>" + parseDuration(result.stats.min) + "</td>");
	row.append("<td>" + parseDuration(result.stats.max) + "</td>");
	row.append("<td>" + parseDuration(result.stats.diff) + "</td>");
	return row;
}

function parseResult(result, player) {
	var stats = {
		"min": 0,
		"max": 0,
		"mean": 0,
		"time": 0,
		"diff": 0,
		"percentile": 0
	};
	var completed = 0;
	
	$.each(result, function(element) {
		if (element.place == 1) {
			stats.min = element.time;
		}
		if (element.time > stats.time) {
			stats.max = element.time;
		}
		if (element.place != -1) {
			stats.mean += element.time;
			completed++;
		}
		if (element.player == player) {
			stats.time = element.time;
			stats.percentile = element.place;
		}
	});
	stats.diff = stats.time - stats.min;	
	stats.mean = stats.mean / completed;
	stats.percentile = stats.percentile / completed;
	
	return stats;
}

function getResults(game, player) {
	var queries = [];

	var page = 1;
	var lastPage = false;

	while (!lastPage) {
		var query = $.get(API + "/pastraces?game=" + game + "&player=" + player + "&page=" + page).done(function(data) {
			$.each(data.pastraces, function(race) {
				result = {"id": data.race.id, "date": data.race.date, stats: parseResult(race.results, player)}
				results.add(result);
			});
			
			if (data.count > PAGE_SIZE * page) {
				page++;
			} else {
				lastPage = true;
			}
		}).fail(function(data, status) {
			// TODO: pass status back through promise
			break;
		});
		queries.add(query);
	}
	
	return $.when(queries);
}

function execute() {
	getResults("alttphacks", "estragon0").done( function {
		results.sort(function(a, b) { return ((a.date > b.date) ? -1 : ((a.date < b.date) ? 1 : 0)); });
		summaryStats = {stats: {"min": 0, "max": 0, "diff": 0}};
		
		$.each(results, function(result) {
			summaryStats.min += result.stats.min;
			summaryStats.max += result.stats.max;
			summaryStats.diff += result.stats.diff;
			createResultRow(result).appendTo(resultsDOM);
		});
		createResultRow(summaryStats).addClass("summary").appendTo(resultsDOM);
	}).fail( function {
		// TODO: pls
		alert("Query failed");
	});
}

var button = $("button");
button.on("click", execute);
