angular.module('conduit.controllers').controller('PageCtrl', function ($scope, $filter,
ArticlesService, AttributesService, BooksService, ArrayTools) {
	
	/**
	 * Wait for the articles promise to resolve; will be inherited by child scopes.
	 */
	ArticlesService.getArticles().then(function(data) {

		$scope.articles = data;
		
		//Add the first (__config.MIN_RENDERED_CARDS * 2) cards to the DOM so the user has something to start with.
		//Enough cards must be added to ensure that scrolling is possible so the infinite scroll event will be triggered
		for(var i = 0; i < __config.MIN_RENDERED_CARDS * 2 && i < $scope.articles.length; i++)
			$scope.articles[i].build = true;
		
		//Set the first article to be active (shown in the viewer)
		if($scope.articles[0])
		{
			$scope.articles[0].active = true;
			$scope.articles[0].activeInBook = false;
		}					
	}).catch( function() {
		//Who needs error messages?
	});
	
	/**
	 * Wait for the attributes promise to resolve; will be inherited by child scopes.
	 */
	AttributesService.getAttributes().then( function(data) {
		$scope.attributes = data;
	}).catch( function() {
			
	});	
	
	/**
	 * Wait for the books promise to resolve; will be inherited by child scopes.
	 */
	BooksService.getBooks().then( function(data) {
		$scope.books = data;

		//Set the first book to be selected by default
		if($scope.books[0])
			$scope.selectedBook = $scope.books[0];
	}).catch( function() {
			
	});
	
	//Make sure our scope has a user object
	$scope.user = {
			name: '',
		};
	
	/**
	 * When passed a user object, set minimum user properties
	 * 
	 * @param {object} user User object (eg user.name, user.id, user.email, etc)
	 */
	$scope.setUserInfo = function (user) {
		if(user.name && user.name != '')
			$scope.user.name = user.name;
		if($scope.user.name == '')
			$scope.user.name = "Unknown User";
	}
	
	//Card Activation
		
		//These variables keep track of the last element that was selected
		$scope.currentParent = 'Feed';
		$scope.currentIndex = 0;
		
		/**
		 * Given a parent element, such as 'Feed' or 'Book', activate the appropriate card. If no id is given or no parent is given,
		 * this function will attempt to make a best guess of which card to activate.
		 * 
		 * @param {string} parent A string, 'Feed' or 'Book', that represents which stream the card is in; optional, default varies
		 * @param {string} id The id of the card to be activated; optional, default varies
		 */
		$scope.activateCard = function(parent, id) {			
			var index;
			
			//Enforce minimums
			if(!$scope.articles)
				return;
			
			//Collect id index if given
			if(id)
				index = ArrayTools.getIndex($scope.articles, id);
			
			//Set the old article to be inactive and read
			$scope.articles[$scope.currentIndex].active = false;
			$scope.articles[$scope.currentIndex].read = true;
			
			/*If no parent or index are given, pick the next card to be selected based on the last known selection
				Order:
					1st visible element below in current parent
					1st visible element above in current parent
					1st visible element in the opposite parent*/
			if(!parent && !index)
			{
				parent = $scope.currentParent
				//Check current parent
				for(var i = $scope.currentIndex; i < $scope.articles.length; i++)
					if($scope.articles[i]["in" + parent])
					{
						index = i;
						break;
					}
				if(!index)
					for(var i = $scope.currentIndex; i >= 0; i--)
						if($scope.articles[i]["in" + parent])
						{
							index = i;
							break;
						}
				
				//Switch to other parent
				if(!index)	
					switch(parent) {
						case 'Feed':
							parent = 'Book';
							break;
						default:
							parent = 'Feed';
							break;
					}
				if(!index)
					for(var i = 0; i < $scope.articles.length; i++)
						if($scope.articles[i]["in" + parent])
						{
							index = i;
							break;
						}
			}
			
			if(!index)
				index = 0;

			//Set the state of the new article to active
			$scope.articles[index].active = true;
			//Determine *where* the new article is active, based on the parent variable
			switch(parent) {
				case 'Feed':
					$scope.articles[index].activeInBook = false;
					break;
				default:
					$scope.articles[index].activeInBook = true;
					break;
			}
			
			//Update trackers
			$scope.currentParent = parent;
			$scope.currentIndex = index;			
		}
	
		/**
		 * Given an article and an attribute, determine whether or not the attribute icon should be shown for that article.
		 * This utilizes the configuration defined in attributes.json. Boolean compares return the boolean value and arrays
		 * return true if they are not empty.
		 * 
		 * @param {object} _article The article to check
		 * @param {object} attr The attribute to check
		 * 
		 * @return True if the attribute icon should be shown, false if it should be hidden
		 */
		$scope.showAttribute = function(_article, attr) {
			//If the article has the compare property
			if(_article[attr.compare])
			{
				//If type is boolean, return true if the boolean is true
				if((typeof(_article[attr.compare]) === "boolean") && _article[attr.compare])
					return true;
				//If type is array, return true if the array is not empty
				if(_article[attr.compare].constructor === Array && _article[attr.compare].length > 0)
					return true;	
			}
			
			return false;
		}
});