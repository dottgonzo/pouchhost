var express = require('express'),
cors = require('cors'),
app     = express(),
PouchDB = require('pouchdb'),
uid=require('uid'),
reload = require('reload'),
http = require('http'),
rs = require('random-strings'),
request = require('request'),
bodyParser = require('body-parser'),
cookieParser = require('cookie-parser'),
pathExists = require('path-exists'), // controlla semplicemente se esiste la cartella o il file
cp = require('cp'), // copia (sconsigliato per cartelle con tanti file e sottocartelle)
mkdir = require('mkdir-p'), // crea una cartella o una cartella annidata, senza senza chiedere nulla
nodemailer = require('nodemailer'),
fs = require('fs'),
jwt = require('jsonwebtoken'),
sio = require('socket.io'),
socketioJwt   = require("socketio-jwt"),
_ = require('lodash'),
follow = require('follow'),
nano = require('nano');


var conf = './conf.json'; // file di configurazione
if(!pathExists.sync(conf)){
  console.log('conf file not present')
  cp.sync('./conf.example.json', conf)
}
config = require('simpler-config').load(require(conf)); // carica il file di configurazione (si poteva usare anche un modulo che leggeva un json semplicemente, ma questo ha alcune funzionalità che possono tornare utili)





var couch_domain_with_port = config.couchdb.internal_url.domain+':'+config.couchdb.internal_url.port;
var couch_url = config.couchdb.internal_url.protocol+'://'+config.couchdb.username+':'+config.couchdb.password+'@'+couch_domain_with_port;

var logger='logger=new function(){this.host="'+config.host.url+'";this.couchdbprotocol="'+config.couchdb.external_url.protocol+'";this.couchdb="'+config.couchdb.external_url.domain+':'+config.couchdb.external_url.port+'"};'


nano = nano(couch_url);


if(!pathExists.sync('./db')){
  mkdir.sync('./db');
  console.log('db folder created')

}
app.set('view engine', 'ejs');
app.use(cookieParser())
app.use(express.static('public'));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // to support URL-encoded bodies
app.set('port', process.env.PORT || config.host.port)
app.use(cors());
var PouchDB = PouchDB.defaults({prefix: './db/'});
PouchDB.plugin(require('pouchdb-authentication'));
app.use('/db', require('express-pouchdb')(PouchDB)); // controllare

var server = http.createServer(app);

follow(couch_url+"/_db_updates", function(error, change) {
  console.log(change);
  if(!error) {
    console.log("Got change number " + change.seq + ": " + change.id);
  }
})






var io            = sio(server);
io.use(socketioJwt.authorize({
  secret: config.secret,
  handshake: true
}));
var users=[];
io.on('connection', function (socket) {
    console.log(socket.decoded_token.user, 'connected');



    request.get(couch_url+'/_users/org.couchdb.user:'+socket.decoded_token.user, function(error, response, body) {
      var doc=JSON.parse(body);
      var dbsapp=[];
for (var d=0;d<doc.db.length;d++){
if(doc.db[d].app_id==socket.decoded_token.app_id && doc.db[d].dbtype=='mine'){
  var dbtosync=doc.db[d];
  console.log(doc.db[d].dbname);
  var couchdburl=config.couchdb.external_url.protocol+'://'+doc.db[d].slave.username+':'+doc.db[d].slave.password+'@'+config.couchdb.external_url.domain+':'+config.couchdb.external_url.port+config.couchdb.external_url.baseURL+doc.db[d].dbname;


  socket.emit('authenticated', {user:socket.decoded_token.user,couchdb:couchdburl});
  if(!_.findWhere(users, { 'user': socket.decoded_token.user }) ){
    var feed = new follow.Feed({db:couchdburl, include_docs:true,since:'now'});

    feed.on('change', function(change) {
      console.log(change);
      console.log('Doc ' + change.id + ' in change ' + change.seq + ' is neither stinky nor ugly.');
    })
    feed.follow();

var feeds=[];
feeds[0]=feed;

    users.push({user:socket.decoded_token.user,slavedb:doc.db[d].dbname,slave:doc.db[d].slave,feeds:feeds});
    console.log(users)


var personal = nano.db.use(doc.db[d].dbname);
var appdb = nano.db.use('app_'+socket.decoded_token.app_id);

appdb.get('config',function(err,body){

var dbconf=body;
personal.get('config',function(err,body){
console.log(body)
    if((err && err.error=='not_found')||body.version!=dbconf.version){


      personal.insert({_id:"config",version:dbconf.version,dbtype:"config"});

      appdb.list({startkey_docid:"template_",endkey_docid:"template_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",include_docs:true},function(err,templates){

        _.map(templates.rows,function(t){
          var template=t.doc;
          template.dbtype="template";
          personal.insert(_.omit(template,'_rev'));

        })

      });

      appdb.list({startkey_docid:"component_",endkey_docid:"component_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",include_docs:true},function(err,components){

var comps=[];
        _.map(components.rows,function(c){
var component=_.omit(c.doc,['_rev']);
component.dbtype="components";

comps.push(component);

        })
        personal.insert({_id:'components',components:comps});

      });

      appdb.list({startkey_docid:"page_",endkey_docid:"page_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",include_docs:true},function(err,pages){

        _.map(pages.rows,function(p){
var page=p.doc;
page.dbtype="pageview";
personal.insert(_.omit(page,'_rev'));

        })



      });
    } else if (err){
      console.log(err);

    }


})

})



  }




}

}


});
    socket.on('disconnect', function() { // controlla se è l'ultimo client dell'utente connesso!!!!!!!!!!!!!!!!!!!!!!

var userdisco=true;
    _.map(_.toArray(io.sockets.connected),function(s){
if(s.decoded_token.user==socket.decoded_token.user){
  userdisco=false;

}

    })

    if (userdisco){
      var rowuser=_.findWhere(users, { 'user': socket.decoded_token.user });
      _.map(rowuser.feeds,function(f){
      f.stop();

      })

      users=_.without(users,rowuser);
      console.log(socket.decoded_token.user, 'disconnect');


    }

      console.log('Got disconnect!');



   });

  });

// setInterval(function () { // ESOSO PUT DOWN ON PRODUCTION
//   if(users.length){
//  //console.log(users[0].user)
//   _.times(_.toArray(io.sockets.connected).length,function(n){
//
//   console.log(n+_.toArray(io.sockets.connected)[n].decoded_token.user)
//
//   })
//   }
//
// }, 5000);


  request.get(couch_url+'/_users/org.couchdb.user:'+config.couchdb.username, function(error, response, body) {

    if (!error && response.statusCode == 200) { // crea l'applicazione madre
    request.get(couch_url+'/app_main', function(error, response, body) {

  if (error || response.statusCode != 200) {


    putapp('main',config.couchdb.username,function(status){

console.log(status)

    })


}

    })

} else{
  console.log('check couchdbuser on conf.json')
  process.exit(1)


}
})



server.listen(config.host.port, '0.0.0.0');



var db = new PouchDB(couch_url+'/_users', {skipSetup: true});



var confirmDB = new PouchDB('confirms');




var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: config.mail.user,
    pass: config.mail.password
  }
});




function db_name(kind,data){
  switch(kind){
    case 'member':
return 'mem_'+uid(3)+'_'+data.app_id+'_'+data.username;

    break

    case 'machine':

    return 'mach_'+uid(6)+'_'+data.app_id;

    break


  }
}




function registerMail(to,code){
  var mailOptions = {
    from: config.mail.senderAddr, // 'Fred Foo ✔ <foo@blurdybloop.com>' sender address
    to: to, // list of receivers
    subject: 'Confirmation email from site ✔', // Subject line
    text: 'This is your confirmation link '+config.host.url+'/confirm?code='+code, // plaintext body
    html: '<b>Hello world ✔</b> This is your confirmation link '+config.host.url+'/confirm?code='+code // html body
  };

  transporter.sendMail(mailOptions, function(error, info){
    if(error){
      return console.log(error);
    }
    console.log('Message sent: ' + info.response);

  });


};


function recoverMail(to){
  var mailOptions = {
    from: config.mail.senderAddr, // 'Fred Foo ✔ <foo@blurdybloop.com>' sender address
    to: to, // list of receivers
    subject: 'Confirmation email from site ✔', // Subject line
    text: 'Hello world ✔', // plaintext body
    html: '<b>Hello world ✔</b>' // html body
  };

  transporter.sendMail(mailOptions, function(error, info){
    if(error){
      return console.log(error);
    }
    console.log('Message sent: ' + info.response);

  });


};

function notifyMail(to,subj,txt,from){
  var mailOptions = {
    from: config.mail.senderAddr, // 'Fred Foo ✔ <foo@blurdybloop.com>' sender address
    to: to, // list of receivers
    subject: 'Confirmation email from site ✔', // Subject line
    text: 'Hello world ✔', // plaintext body
    html: '<b>Hello world ✔</b>' // html body
  };

  transporter.sendMail(mailOptions, function(error, info){
    if(error){
      return console.log(error);
    }
    console.log('Message sent: ' + info.response);

  });


};





function putapp(app_id,username,callback){


var newuserdb=db_name('member',{username:username,app_id:app_id});

  request.get(couch_url+'/_users/org.couchdb.user:'+username, function(error, response, body) {
    if (!error && response.statusCode == 200) {

    var doc=JSON.parse(body);

if(!doc.db){
  doc.db=[]

}

            request.get(couch_url+'/app_'+app_id, function(error, response, body) {

                if (!error && response.statusCode == 200) { // si iscrive all'applicazione
  var newapp=false;
  var status={success:true,status:202,desc:"app subscribed",data:{app_id:app_id}}

            } else{ //create new public app db
              var newapp=true;

              request.put(couch_url+'/app_'+app_id, function(error, response, body) {



              request({  //create new public app db
                method: "PUT",
                uri: couch_url+'/app_'+app_id+'/_design/auth',
                json: {
    "language": "javascript",
    "validate_doc_update": "function(n,o,u){if(n._id&&!n._id.indexOf(\"_local/\"))return;if(!u||!u.roles||u.roles.indexOf(\"app_"+app_id+"\")==-1){throw({forbidden:'Denied.'})}}"
  }
              }, function(error, response, body) {
                console.log('auth');

  console.log(body);
  console.log('auth');

                 //create read only


              })
            })
            var status={success:true,status:201,desc:"app created",data:{app_id:app_id}}

            }











              var info = JSON.parse(body);
              var slavename='sl_'+username+'_'+uid(6);
              var slavepassword=uid(12);

              var newdb={app_id:app_id,dbname:newuserdb,slave:{username:slavename,password:slavepassword},dbtype:"mine",roles:['owner']};


              request({
                method: "PUT",
                uri: couch_url+'/_users/org.couchdb.user:'+slavename,
                json: {"name": slavename,"roles": ['slave'],app:{db:newuserdb,user:username},dbtype:"userslave","type": "user","password": slavepassword}
              }, function(error, response, body) {

                doc.db.push(newdb);
  if (newapp){
    doc.roles.push('app_'+app_id);
    var startapp={app_id:app_id,dbname:'app_'+app_id,dbtype:"application",roles:['owner']};

                doc.db.push(startapp);

  }
                request({
                  method: "PUT",
                  uri: couch_url+'/_users/org.couchdb.user:'+username,
                  json: doc
                }, function(error, response, body) {




                  request.put(couch_url+'/'+newuserdb, function(error, response, body) {




                    request({
                      method: "PUT",
                      uri: couch_url+'/'+newuserdb+'/_security',
                      json: {"members":{"names":[username,slavename],"roles":[] } }
                    }, function(error, response, body) {



                      confirmDB.post({confirm:false}).then(function(doc){
                        //  registerMail('darioyzf@gmail.com',doc.id); // TO BE ALIVE

                      }).catch(function(err){


                      });



                      callback(status)


                    })

                  })


                })



              })


















        })
}
        })



}






app.get('/confirm', function (req, res) {
  console.log(req.query);

  var code=req.query.code;
  console.log(code);
  if (req.body && code){
    confirmDB.get(code).then(function(doc){
      console.log(doc);

      doc.confirm=true;
      confirmDB.put(doc).then(function(){

        res.redirect('/ready.html');
        notifyMail('darioyzf@gmail.com');

      }).catch(function(err){

        console.log(err);

      });

    }).catch(function(err){



    })


  }



});


app.get('/import/logger.js', function (req, res) {
  fs.readFile('./public/lib/logger.js', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    //  var filejs=data+';logger=new function(){this.host="http://127.0.0.1:5000";}';
    res.format({
      'application/javascript': function(){


        res.send(logger+data);

        //  res.send(filejs);
      }
    });

  });

});

app.get('/page/auth.html', function (req, res) {
  fs.readFile('./public/auth.html', 'utf8', function (err,data) {

    if (err) {
      return console.log(err);
    }
    //  var filejs=data+';logger=new function(){this.host="http://127.0.0.1:5000";}';


    res.send(data+'<script>'+logger+'</script></body></html>');

    //  res.send(filejs);



  });


});
app.get('/users/:user', function (req, res) {

if (req.cookies.UL){
  try {
  var decoded = jwt.verify(req.cookies.UL, config.secret);

if(decoded.user==req.params.user){
  res.json(decoded);

} else{
  res.redirect('/page/auth.html?action=login&app_id=main');

}

} catch(err) {
  // err
  console.log(err)
  res.redirect('/page/auth.html?action=login&app_id=main');

}
}




});

app.get('/page/list.html', function (req, res) {
  fs.readFile('./public/list.html', 'utf8', function (err,data) {

    if (err) {
      return console.log(err);
    }
    //  var filejs=data+';logger=new function(){this.host="http://127.0.0.1:5000";}';


    res.send(data+'<script>'+logger+'</script></body></html>');

    //  res.send(filejs);


  });


});

app.get('/reset', function (req, res) {
  console.log(req.query);

  var code=req.query.code;
  console.log(code);
  if (req.body && code){
    resetDB.get(code).then(function(doc){
      console.log(doc);

      confirmDB.remove(doc).then(function(){

        res.redirect('/page/auth.html?reset='+code);


      }).catch(function(err){

        console.log(err);

      });

    }).catch(function(err){



    })


  }



});

function testapp_id(app_id,cb){
  request.get(couch_url+'/app_'+app_id, function(error, response, body) {


    if (!error && response.statusCode == 200) {

      cb({ok:'ok'});

    } else {


      cb({error:'wrong username'});


    }


  })
}
function testauth(username,passw,cb){

  testuser(username,function(data){
    if(data.ok){
      request.get(couch_url+'/_users/org.couchdb.user:'+username, function(error, response, body) {

        var doc=JSON.parse(body);

        var oldbs=JSON.parse(body).db;

        var oldb=false;

        for(var i=0;i<oldbs.length;i++){
          if (oldbs[i].dbtype=='mine'){
            oldb=oldbs[i].dbname;
          }
        }



        request.get(config.couchdb.internal_url.protocol+'://'+username+':'+passw+'@'+couch_domain_with_port+'/'+oldb, function(error, response, body) {

          if (!error && response.statusCode == 200) {

            cb({ok:'ok'});

          } else {


            cb({error:'wrong username'});


          }

})

})
    } else{
      cb(data)

    }
  })



}


function testuser(username,cb){
  request.get(couch_url+'/_users/org.couchdb.user:'+username, function(error, response, body) {


    if (!error && response.statusCode == 200) {

      cb({ok:'ok'});

    } else {


      cb({error:'wrong username'});


    }


  })
}

app.post('/testuser', function (req, res) {
  var username=req.body.username;

  testuser(username,function(data){

      res.json(data)


  })

});





app.post('/sharemach', function (req, res) {
  var username=req.body.username;
  var passw=req.body.passw;
  var app_id=req.body.app_id;
  var label=req.body.label;
  var newusername=req.body.newusername;


  request.get(couch_url+'/_users/org.couchdb.user:'+username, function(error, response, body) {
    if (!error && response.statusCode == 200) {


      var oldbs=JSON.parse(body).db;

      var machine=false;

      for(var i=0;i<oldbs.length;i++){
        if (oldbs[i].app_id==app_id&&oldbs[i].dbtype=='machine'&&oldbs[i].label==label){
          machine=oldbs[i].dbname;
          var machinedb=oldbs[i].dbname;
          var machineuser=oldbs[i].slave.username;
          var machinepassw=oldbs[i].slave.password;
          var machinetoken=oldbs[i].slave.token;

        }
      }

      if (machine){



        request.get(config.couchdb.internal_url.protocol+'://'+username+':'+passw+'@'+couch_domain_with_port+'/'+oldbs[0].dbname, function(error, response, body) {
          if (!error && response.statusCode == 200) {


            request.get(couch_url+'/_users/org.couchdb.user:'+newusername, function(error, response, body) {
              if (!error && response.statusCode == 200) {

                var doc=JSON.parse(body);
                var dbs=JSON.parse(body).db;

                var mach=false;

                for(var i=0;i<dbs.length;i++){
                  if (dbs[i].app_id==app_id&&dbs[i].dbtype=='machine'&&dbs[i].label==label){
                    var mach=true;

                  }
                }
if(mach){


  res.json({warning:newusername+' can manage the machine right now'});


} else {
var dbuser=false
  for(var i=0;i<oldbs.length;i++){
    if (oldbs[i].app_id==app_id&&oldbs[i].dbtype=='mine'){

      var dbuser=oldbs[i].dbname;
      var dbslaveuser=oldbs[i].slave.username;
      var dbslavepassword=oldbs[i].slave.password;

    }
  }

if(dbuser){





                var newdb={app_id:app_id,dbname:machinedb,slave:{username:machineuser,password:machinepassw,token:machinetoken},label:label,dbtype:"machine",roles:['shared']};


                doc.db.push(newdb)


                request({
                  method: "PUT",
                  uri: couch_url+'/_users/org.couchdb.user:'+newusername,
                  json: doc
                }, function(error, response, body) {

                  request.get(couch_url+'/_users/org.couchdb.user:'+machineuser, function(error, response, body) {
                    updateslave=JSON.parse(body);
                    updateslave.app.users.push(newusername);

                    request({
                      method: "PUT",
                      uri: couch_url+'/_users/org.couchdb.user:'+machineuser,
                      json: updateslave
                    }, function(error, response, body) {
                      res.json({ok:'ok'});
                    })



                  })




                })

              } else{

                                res.json({error:'user not registered this application'});

              }

}

              } else{


                res.json({error:'wrong member'});


              }


            })

          } else{
            res.json({error:'wrong password'});




          }





        })



      } else{

        res.json({error:'wrong machine'});


      }

    } else{
      res.json({error:'wrong username'});


    }

  })





});

app.post('/authm', function (req, res) {

  var token=req.body.token;
  var decoded = jwt.verify(token, config.secret,{ignoreExpiration:true});

if(decoded&&decoded.user&&decoded.password){
  request.get(couch_url+'/_users/org.couchdb.user:'+username, function(error, response, body) {
    if (!error && response.statusCode == 200) {

  res.json({user:'present',password:decoded.password,db:JSON.parse(body).app.db});
}else{
  res.json({warning:'token error'});
}
})
}
})

app.post('/createmachine', function (req, res) {
  var username=req.body.username;
  var app_id=req.body.app_id;
  var passw=req.body.passw;
  var label=req.body.label;

  request.get(couch_url+'/_users/org.couchdb.user:'+username, function(error, response, body) {
    if (!error && response.statusCode == 200) {


      var doc=JSON.parse(body);

      var oldbs=JSON.parse(body).db;

      var machine=false;

      for(var i=0;i<oldbs.length;i++){
        if (oldbs[i].app_id==app_id&&oldbs[i].dbtype=='machine'&&oldbs[i].label==label){
          machine=oldbs[i].dbname;
        }
      }

      if (machine){
        res.json({warning:'present'});

      } else{
        for(var i=0;i<oldbs.length;i++){
          if (oldbs[i].app_id==app_id&&oldbs[i].dbtype=='mine'){
            dbuser=oldbs[i].dbname;
            dbslaveuser=oldbs[i].slave.username;
            dbslavepassword=oldbs[i].slave.password;

          }
        }
        request.get(config.couchdb.internal_url.protocol+'://'+username+':'+passw+'@'+couch_domain_with_port+'/'+oldbs[0].dbname, function(error, response, body) {

          if (!error && response.statusCode == 200) { // ok crealo

            var newuserdb=db_name('machine',{app_id:app_id});

            var info = JSON.parse(body);
            var slavename='slmach_'+username+'_'+uid(6);
            var slavepassword=uid(12);


            var token = jwt.sign({ user: slavename, password: slavepassword }, config.secret);
            var newdb={app_id:app_id,dbname:newuserdb,slave:{username:slavename,password:slavepassword,token:token},label:label,dbtype:"machine",roles:['owner']};




            request({
              method: "PUT",
              uri: couch_url+'/_users/org.couchdb.user:'+slavename,
              json: {"name": slavename,"roles": ['slave'],app:{db:newuserdb,users:[username]},dbtype:"userslave","type": "user","password": slavepassword}
            }, function(error, response, body) {

              doc.db.push(newdb)


              request({
                method: "PUT",
                uri: couch_url+'/_users/org.couchdb.user:'+username,
                json: doc
              }, function(error, response, body) {
                console.log(body) // Show the HTML for the Google homepage.

                console.log('ooo') // Show the HTML for the Google homepage.

                request.put(couch_url+'/'+newuserdb, function(error, response, body) {
                  console.log(body) // Show the HTML for the Google homepage.



                  request({
                    method: "PUT",
                    uri: couch_url+'/'+newuserdb+'/_security',
                    json: {"members":{"names":[username,slavename],"roles":[] } }
                  }, function(error, response, body) {
                    console.log(body) // Show the HTML for the Google homepage.


                    confirmDB.post({confirm:false}).then(function(doc){
                      //  registerMail('darioyzf@gmail.com',doc.id); // TO BE ALIVE

                    }).catch(function(err){

                      res.json({error:'boh'});

                    });


res.json({success:true,data:{database:newuserdb,slave:{user:slavename,password:slavepassword},label:label}});


                  })

                })


              })



            })







          } else{

            res.json({error:'wrong password'});




          }

        })


      }


    } else{

      res.json({error:'wrong username'});

    }
  })
})



function getuser_machines(username,passw,app_id,cb){



testapp_id(app_id,function(data){
  if(data.ok){


        testauth(username,passw,function(data){

          if(data.ok){
            request.get(couch_url+'/_users/org.couchdb.user:'+username, function(error, response, body) {

              var doc=JSON.parse(body);

              var oldbs=JSON.parse(body).db;

              var oldb=false;
var machines=[];
var appdb
              for(var i=0;i<oldbs.length;i++){
                if (oldbs[i].app_id==app_id&&oldbs[i].dbtype=='machine'){
                  oldbs[i].slave.database=oldbs[i].dbname;
                  oldbs[i].slave.label=oldbs[i].label;
                  var machinecrede=oldbs[i].slave;
                  machinecrede.label=oldbs[i].label;
                  machines.push(machinecrede);
                } else if(oldbs[i].app_id==app_id&&oldbs[i].dbtype=='mine'){
                    appdb={db:oldbs[i].dbname,slaveuser:oldbs[i].slave.username,slavepassw:oldbs[i].slave.password};
                    
                }
              }

              cb({appdb:appdb,machines:machines})



})


          } else{
            cb(data)

          }

        })




  } else{
    cb(data)

  }
})


}

app.post('/getmachines', function (req, res) {
  var username=req.body.username;
  var app_id=req.body.app_id;
  var passw=req.body.passw;


getuser_machines(username,passw,app_id,function(data){
  res.json({data:data})

})

})

app.post('/auth', function (req, res) {

  var email=req.body.email;
  var username=req.body.username;
  var app_id=req.body.app_id;

  var passw=req.body.passw;
  console.log(app_id)


  if (req.body.register && req.body.register== 'true'){
    var newuserdb=db_name('member',{username:username,app_id:app_id});



  } else { // todo autentica con jwt

    var newuserdb=false;

  }

console.log(db_name('member',{username:username,app_id:app_id})+'dd');

  request.get(couch_url+'/_users/org.couchdb.user:'+username, function(error, response, body) {


    if (!error && response.statusCode == 200) {

      var doc=JSON.parse(body);

      var oldbs=JSON.parse(body).db;

      var oldb=false;

      for(var i=0;i<oldbs.length;i++){
        if (oldbs[i].app_id==app_id&&oldbs[i].dbtype=='mine'){
          oldb=oldbs[i].dbname;
          slavedb=oldbs[i].slave;
        }
      }



      request.get(config.couchdb.internal_url.protocol+'://'+username+':'+passw+'@'+couch_domain_with_port+'/'+oldbs[0].dbname, function(error, response, body) {


        if (!error && response.statusCode == 200) { // ok crealo








      if (newuserdb && oldb){ // tenta di registrare un db esistente, restituisce il vecchio
        res.json({warning:'present'});
      } else if(newuserdb && oldbs[0] && oldbs[0].dbname){ // vuol creare un nuovo db (è un utente preesistente)


putapp(app_id,username,function(status){

  res.json(status);


})




      } else if(oldb){ // login puro



            console.log(body);
            var profile={
              user:username,
              app_id:app_id,
              email:doc.email
            }


            authorizesocket(res,profile,200);



      } else if(!newuserdb && !oldb && oldbs[0]) {
        res.json({error:'wrong app'});


      }

    } else { // error
      res.json({error:'wrong username/password'});

    }


  })

    } else if (newuserdb && email){ // nuovo utente
      var info = JSON.parse(body);

      var slavename='sl_'+username+'_'+uid(6);
      var slavepassword=uid(12);

      request.get(couch_url+'/app_'+app_id, function(error, response, body) { // register to this app

          if (!error && response.statusCode == 200) {

      request({
        method: "PUT",
        uri: couch_url+'/_users/org.couchdb.user:'+slavename,
        json: {"name": slavename,"roles": ['slave'],app:{db:newuserdb,user:username},dbtype:"userslave","type": "user","password": slavepassword}
      }, function(error, response, body) {


        //  registerMail('darioyzf@gmail.com',doc.id); // TO BE ALIVE




var doc={"name": username,"email":email,"db":[{app_id:app_id,dbname:newuserdb,slave:{username:slavename,password:slavepassword},dbtype:"mine",roles:['owner']}],"roles": ['user'],"type": "user","password": passw};


        request({
          method: "PUT",
          uri: couch_url+'/_users/org.couchdb.user:'+username,
          json: doc
        }, function(error, response, body) {

          request.put(couch_url+'/'+newuserdb, function(error, response, body) {


            request({
              method: "PUT",
              uri: couch_url+'/'+newuserdb+'/_security',
              json: {"members":{"names":[username,slavename],"roles":[] } }
            }, function(error, response, body) {
              console.log(body)


              confirmDB.post({confirm:false}).then(function(doc){
                //  registerMail('darioyzf@gmail.com',doc.id); // TO BE ALIVE

              }).catch(function(err){

                res.json({error:'boh'});

              });




  var profile={
    user:username,
    app_id:app_id,
    email:doc.email
  }


  authorizesocket(res,profile,200);
            })

          })


        })


      }) // fine sottoscrizione app


} else {
console.log('error: new user tried to create new app')
  res.json({error:'new user can\'t create app'});

}
})





    } else {


      res.json({error:'wrong username'});


    }


  });

});


function authorizesocket(res,profile,code){

  var token = jwt.sign(profile, config.secret, { expiresInMinutes: 60*5 });

res.json({success:true,status:code,token: token});

}



reload(server, app);
server.on('error', onError);




server.on('listening', onListening);
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}


function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + config.host.port
    : 'Port ' +  config.host.port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}
