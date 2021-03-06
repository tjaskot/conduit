/* The ArticlesService makes all of the articles available in a global, editable promise. */
angular.module('conduit.services').factory('ArticlesService', function($q, $http,
DataSourceService, RssLiteService, ComplexPropertyTools, __config) { 

	var articles = 	DataSourceService.getSources().then(function(sources) {
		
		var queries = [];

		//Create the static query Promise for our sample data
		queries.push($http.get(__config.articlesUrl)
				.then(function(response) {
					return response.data;
				}))

		//Run through all of the sources
		for(var i = 0; i < sources.length; i++)
		{
			//Id the rss sources, defer the promsies, and added them to our query array
			if(sources[i].type && ~sources[i].type.indexOf("rss"))
			{
				var deferred = $q.defer();
    			queries[i] = deferred.promise;
				makeRssCall(deferred, i);
			}
		}
			//The code that $q will call when attempting to fill the promises
			function makeRssCall(deferred, i) {
				(function(source) {
					RssLiteService.readUrl(sources[i].link)
						.then(function(feed) {
							deferred.resolve(formatRss(feed, source));
						})
					})(sources[i])//Make sure to pass the source on to the callback so that it can be properly formatted
			};

		//Request all promises from our queries array, concat them, and return
		return $q.all(queries).then(function(results) {
			var fullResponse = [];
			for(var i = 0; i < results.length; i++)
				fullResponse = fullResponse.concat(results[i]);
			return fullResponse;
		});			
	});
	
  var getArticles = function() {
		return articles;
	};

	//Format rss sources into the accepted Conduit JSON format
	var formatRss = function(feed, source)
	{
		var articles = [];
		for(var i = 0; i < feed.length; i++)
		{
			var temp = {};
			for(var j = 0; j < source.binding.length; j++)
				temp[source.binding[j].local] = feed[i][source.binding[j].source];
			temp.source = source.name
			articles.push(forceArticleCompliance(temp));
		}

		for(var i = 0; i < articles.length; i++)
		{
			articles[i].tags.push(source.tag);
			for(var j = 0; j < source.tags.length; j++)
				if(source.tags[j])
					articles[i].tags.push(ComplexPropertyTools.getComplexProperty(articles[i], source.tags[j]));
		}

		console.log(articles);

		return articles;
	}

//Force the article to have the minimum fields and set defaults if none given
	var forceArticleCompliance = function(article) {
		
		//Set booleans
		if(typeof article.wasRead == "undefined")
			article.wasRead = false;
		if(typeof article.inFeed == "undefined")
			article.inFeed = true;
		if(typeof article.inBook == "undefined")
			article.inBook = false;

		//Set fields created by conduit
		if(typeof article.books == "undefined")
			article.books = [];
		if(typeof article.comments == "undefined")
			article.comments = [];

		//Set fields required by conduit
		if(typeof article.date == "undefined")
			article.date = new Date();
		if(!article.id || article.id === "")
			article.id = generateUUID();
		if(typeof article.title == "undefined")
			article.title = "";
		if(typeof article.text == "undefined")
			article.text = "";
		if(typeof article.images == "undefined")
			article.images = [];
		if(typeof article.selectedImage == "undefined")
			article.selectedImage = 0;
		if(typeof article.tags == "undefined")
			article.tags = [];
		if(typeof article.source == "undefined")
			article.source = "";

		return article;
	}

	//RFC4122 version 4 compliant; the chance of a collision is less than 1 in 2.71 quintillion
	var generateUUID = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
		});
	}
	
	return {
	  getArticles: getArticles,
		formatRss: formatRss
	};		
});