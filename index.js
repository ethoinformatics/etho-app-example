var app = require('ethoinfo-framework');

var primateDomain = app.createDomain({name: 'primate'});
primateDomain.register('form-fields', {
	name: { type: 'text'},
	sex: { type: 'select', items: [{value: 'Male'}, {value: 'Female'}]},
	age: { type: 'select', items: [{value: 'Young'}, {value: 'Old'}]},
});

var encounterDomain = app.createDomain({name: 'encounter'});
encounterDomain.register('form-fields', {
	mood: { type: 'select', items: [{value: 'Happy'}, {value: 'Sad'},]},
});

primateDomain.register('encounters', encounterDomain);

encounterDomain.register('get-begin-time', function(encounter){
	return encounter.beginTime;
});

encounterDomain.register('get-end-time', function(encounter){
	return encounter.endTime || Date.now();
});

encounterDomain.register('short-description', 'mood');

app.run();
