# etho-app-example

The ethoinformatics mobile app framework is designed to enable the collection of flexible data structures in an offline environment.  The researchers/users are working in difficult locations where network connectivity is minimal to non-existent, so typical client-server architecture is not an option.  In addition, the data of interest to the researchers varies dramatically between research teams and even between research sites for the same research team.

Rather than rely on a remote database connection, the app uses PouchDb to sync an entire Couch database to the device.  The mobile user can then interact with this local copy exactly like a user would typically interact with a remote database.  On the rare occasion that a network connection is available, a user can sync to a central server using the etho-admin tool.

In order to support a diverse set of data structures, the mobile app goes to great lengths to avoid hard coding any data structures directly.  Instead, it exposes a set of functions for defining and consuming data structures.  It is important to note that there is no single ethoinformatics mobile app.  Instead, the ethoinformatics team provides a framework that may customized with metadata in order to produce an app with it's own unique data structures.    

The ethoinformatics mobile app framework is a NodeJS module and is published for public use through the Node Package Manager(NPM).  Users can create a NodeJS project and install the ethoformatics module as dependency just like any other node module.  Once installed, users plug metadata and small javascript functions in to the framework to generate a mobile app customized for their specific needs.  The core features are offline data storage and sync, generated data entry/edit forms, a map view for geographic data and a timeline view for temporal data.

Getting started
===============
First, you must create a new node project and install the ethoinfo-framework as a dependency.  Note that these instructions are applicable to NodeJS projects of all kinds.

```bash
> mkdir my-project
> cd my-project
> npm init
> npm install --save ethoinfo-framework
````

This creates a new NodeJS application and installs the ethoinfo-framework as a dependency.  We are now ready to start creating a custom app.

Create an index.js file that starts with
```js
var app = require('ethoinfo-framework');
```
The above `app` variable exposes all the functions we need to interact with the ethoinfo-framework.  The most important function available on `app` is the `createDomain` function, so let's cover what makes an ethoinfo-framework domain.

Domains
-------
A domain encapsulates both a data format and functions used for interacting with the data.  For example, if I want to record basic characteristics of every primate I encounter then I could start by defining a primate domain like so:
```js
var primateDomain = app.createDomain({name: 'primate'});
primateDomain.register('form-fields', {
  name: { type: 'text'},
  sex: { type: 'select', items: [{value: 'Male'}, {value: 'Female'}]},
  age: { type: 'select', items: [{value: 'Young'}, {value: 'Old'}]},
  encounterDateTime: { type: 'dateTime' },
});
```
The above code defines a simple data structure with four fields: `name`, `sex`, `age` and `encounterDateTime`.
This example is already runnable and if you were to do so, then you'd end up with a dashboard that was empty accept for a "Add Primate" button.  Clicking "Add Primate" would launch a generated form with the four fields we just defined.  By default, a fifth field `remarks` is always added to all domains.  So, the user would additionally be able to record long notes on the `primate.remarks` field.

Admittedly, no one is interested in data this simple.  It is definitely possible to encounter the same primate more than once, so let's start by addressing this.  In addition, I want to record the distance between the researcher and the primate during the encounter as well as the duration of the encounter in minutes, so let's create a second domain and call it "encounter".

```js
var encounterDomain = app.createDomain({name: 'encounter'});
encounterDomain.register('form-fields', {
  encounterDateTime: { type: 'datetime' },
  distanceFromPrimate: { type: 'number'},
  duration: { type: 'number' },
});
```
We now have two separate domains, but we know they are related.  We can tell the app framework that they are related like so:
```js
primateDomain.register('encounters', encounterDomain);
```

Building the app at this point results in a more interesting interaction.  We are able to record new primates and record our encounter with the primate, but we are also able to pull up the primate record and add new encounters as they occur.

We could could also use the built-in sync capabilities of the app and view the recond in couch.  The record in couch might look like this:
```js
{
  "_id": "x42423-32423-3423432",
  "_rev": "1-2323223423432",
  "_domainName": "primate",
  "name": "Ralph",
  "sex": "Male",
  "age": "Old",
  "encounters": [
    {
      "_id": "abc-12232-213123",
      "_domainName": "encounter",
      "encounterDateTime": "2015-08-20 13:30:21",
      "duration": 17,
      "distance": 123,
    },
    { 
      "_id": "xyz-ewrr-werewwer",
      "_domainName": "encounter",
      "encounterDateTime": "2015-08-22 11:10:48",
      "duration": 5,
      "distance": 44,
    }
  ]
}
```

You'll notice the fields that we have defined are present, but there are additional fields that we did not explicitly define.  All of these "extra" fields begin with an underscore and can be safely ignored.  The _id and _rev fields are created by Pouch and Couch, while the _domainName field is used internally by the ethoinfo-framework.

Services
--------
So far we've only customized our domains with metadata, but we can also customize our domains with code services.  For example, one of the views supported by the ethoinfo-framework is the timeline view.  It would be great if we could plot our encounters on the timeline.  In order to do this, the ethoinfo-framework just needs to know how to get start and stop times from an encounter.  Getting the start time from an encounter is easy.
```js
encounterDomain.register('get-start-time', function(encounter){
  return encounter.encounterDateTime;
});
```
Getting an end time from an encounter is a little harder because we only indirectly store the end time:
```js
encounterDomain.register('get-end-time', function(encounter){
  var startDateTime = new Date(encounter.encounterDateTime);
  var durationInMilliseconds = encounter.duration*1000*60;
  return new Date(startDateTime.getTime() + durationInMilliseconds);
});
```

Framework settings
------------------
`setting` is another function available on the `app` variable and is used to set global variables the framework needs to do it's job.  Two settings you'll want to set are used for connecting with the central couch db.  If you don't set these variables then the user will be prompted for them each time a sync is performed.
```js
app.setting('couch-base-url', 'http://demo.ethoinformatics.org:5984/your-database-name-here');
app.setting('couch-username', 'your-username');
