var nano=require('nano')('http://localhost:5984');

var app=nano.use('app_main');


app.list({startkey_docid:"page_",endkey_docid:"page_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",include_docs:true},function(err,components){

console.log(components)
})
