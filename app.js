// create module for custom directives
var app = angular.module('priorityApp', ['d3']);

// controller business logic
app.controller('mainCtrl', function ($scope, $http) {

$http.get('model.json').
	then(function(response) {
		$scope.events = response.data.events;
		$scope.importanceWeight = response.data.importanceWeight;
		$scope.urgencyWeight = response.data.urgencyWeight;
		console.log($scope.events);

		var reorderEvents = function (importanceWeight, urgencyWeight) {
			var k =  -importanceWeight/urgencyWeight;
			for (i=0; i < $scope.events.length; i++) {
				var tempScore = Math.abs(k*$scope.events[i].importance - $scope.events[i].urgency + 100*(1-k) )/Math.sqrt(k*k+1);
				$scope.events[i].score = tempScore.toFixed(2);
				console.log($scope.events[i].key);
				console.log(tempScore.toFixed(2));
			}
		};
		reorderEvents($scope.importanceWeight, $scope.urgencyWeight);
		$scope.$watch('[events, importanceWeight, urgencyWeight]', function(newVals, oldVals) {
			return reorderEvents(newVals[1], newVals[2]);
		}, true);

		var updateWeights = function (urgencyWeight) {
			$scope.importanceWeight = 100.1 - urgencyWeight;
		}
		updateWeights($scope.urgencyWeight);
		$scope.$watch('urgencyWeight', function(newVals, oldVals) {
		  return updateWeights(newVals);
		}, true);

		var saveData = function($scope) {

		};
	}, function() {
	 // log error
	 console.log("Error");
	});
});

app.directive('d3Chart', ['d3Service', function(d3Service) {
	return {
		restrict: 'EA',
		scope: {
			events: '=',
			importanceweight: '=',
			urgencyweight: '='
		},
		link: function(scope, element, attrs) {
			d3Service.d3().then(function(d3) {
				// our d3 code will go here
				// Set the dimensions of the canvas / graph
				var margin = {top: 30, right: 20, bottom: 30, left: 50},
				canvasWidth = 500,
				canvasHeight = 500,
				chartWidth = canvasWidth - margin.left - margin.right,
				chartHeight = canvasHeight - margin.top - margin.bottom;
				// Adds the svg canvas
				var svg = d3.select(element[0])
	            .append('svg')
				.attr("width", chartWidth + margin.left + margin.right)
				.attr("height", chartHeight + margin.top + margin.bottom)
				.append("g")
				.attr("transform",
					"translate(" + margin.left + "," + margin.top + ")");

				var render = function( events, importanceweight, urgencyweight ) {
					// remove all previous items before render
					svg.selectAll('*').remove();

					// If we don't pass any data, return out of the element
					if (!events) return;

					// Set the ranges
					var x = d3.scale.linear().domain([0, 100]).range([0, chartWidth]);
					var y = d3.scale.linear().domain([0, 100]).range([chartHeight, 0]);
					// Define the axes
					var xAxis = d3.svg.axis().scale(x)
						.orient("bottom").ticks(5);

					var yAxis = d3.svg.axis().scale(y)
						.orient("left").ticks(5);

					svg.selectAll("dot")
						.data(events)
						.enter().append("circle")
						.attr("r", 3.5)
						.attr("cx", function(datum) { return x(datum.importance); })
						.attr("cy", function(datum) { return y(datum.urgency); });
					svg.selectAll("label")
						.data(events)
						.enter().append("text")
						.attr("x", function(datum) { return x(datum.importance); })
						.attr("y", function(datum) { return y(datum.urgency)+20; })
						.attr("text-anchor", "middle")
						.text( function(datum) { return datum.key; });

					// Add the X Axis
					svg.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + chartHeight + ")")
					.call(xAxis);

					// Add the Y Axis
					svg.append("g")
					.attr("class", "y axis")
					.call(yAxis);
					//for testing. Draw a line with given slope
					var slope = importanceweight/urgencyweight;
					svg.append("path")
					.attr("d", "M 400 400 l -400 -"+ 400*slope  )
					.attr("style", "stroke:rgb(255,0,0);stroke-width:2");
				};
				render(scope.events, scope.importanceweight, scope.urgencyweight );
				scope.$watch('[events, importanceweight, urgencyweight]', function(newVals, oldVals) {
				  return render(newVals[0], newVals[1], newVals[2]);
				}, true);
			});
		}
	};
}]);

