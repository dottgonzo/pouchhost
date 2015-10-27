var rp=require('request-promise-json');
var Promise=require('promise');
var couchjsonconf=require('couchjsonconf');


var couchdbconf=require('../conf.json').couchdb.external_url;
var server=couchjsonconf(couchdbconf);




function testdbexist(db,user,password){
  return new Promise(function (resolve, reject) {
if(user&&password){
    var link=server.protocol+'//'+user+':'+password+'@'+server.host+'/'+db;
} else{
  var link=server.href+'/'+db;

}
  rp.get(link).then(function(dbdoc){
    resolve(dbdoc);
}).catch(function(err){
  reject(err);

})
})
}

module.exports={
  user:function(user,password){
  return new Promise(function (resolve, reject) {

    console.log(server.href)

  if(user&&password){

    testdbexist('_users/org.couchdb.user:'+user).then(function(userdb){
for(var i=0;i<userdb.db.length;i++){
  if(userdb.db[i].dbtype=='mine'){
    var onedb=userdb.db[i].dbname;

  }
}



testdbexist(onedb).then(function(){

  testdbexist(onedb,user,password).then(function(){

          resolve({success:true});



        }).catch(function(err){
          reject("Wrong password","error","Couchtest");

        })


      }).catch(function(err){
        reject("db not present","error","Couchtest");

      })


    }).catch(function(err){
      reject("Wrong username","error","Couchtest");

    })
  } else{

    reject("Malformed user & password data","error","Couchtest");
  }
    })
},


userdb:function(user,password,app_id){
return new Promise(function (resolve, reject) {

  console.log(server.href)

if(user&&password){

  testdbexist('_users/org.couchdb.user:'+user).then(function(userdb){
for(var i=0;i<userdb.db.length;i++){
  if(userdb.db[i].dbtype=='mine'&&userdb.db[i].app_id==app_id){
  var onedb=userdb.db[i].dbname;
var thedb=userdb.db[i]
}
}



testdbexist(onedb).then(function(){

testdbexist(onedb,user,password).then(function(){

        resolve({success:true,db:thedb});



      }).catch(function(err){
        reject("Wrong password","error","Couchtest");

      })


    }).catch(function(err){
      reject("db not present","error","Couchtest");

    })


  }).catch(function(err){
    reject("Wrong username","error","Couchtest");

  })
} else{

  reject("Malformed user & password data","error","Couchtest");
}
  })
},

dbexist:function(db){
testdbexist(db).then(function(){
  return true
})
}

};
