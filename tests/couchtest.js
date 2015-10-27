var couchtest=require('../modules/couchtest');
var verb=require('verbo');
couchtest.user('aa','aa').then(function(d){
verb(d)
}).catch(function(err){
verb(err,"error","boh")
});
