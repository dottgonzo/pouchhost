// require logger

// require('pouchdb') & $ jquery
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}


var token, socket;
        function connect () {
          socket = io.connect(logger.host+((getCookie('UL')!='') ? ('?token=' + JSON.parse(getCookie('UL'))) : ''), {
            'forceNew': true
          });
          socket.on('authenticated', function (c) {
            console.log(c);
          }).on('connect', function () {
            console.log('- connect');
          }).on('disconnect', function () {
            console.log('- disconnected');
          }).on("error", function(error) {
  if (error.type == "UnauthorizedError" || error.code == "invalid_token") {
    // redirect user to login page perhaps?
    console.log("User's token has expired");
  }
  console.log(error);

});
        }
        connect(); //connect now, it will drop




function Logg(username,password,app_id,register,callback){
  $.post(logger.host+'/auth',{username:username,passw:password,app_id:app_id,register:register},function(data){
    Authorized(data);

callback(data);
})
}
function Regg(email,username,password,app_id,callback){
  $.post(logger.host+'/auth',{email:email,username:username,passw:password,app_id:app_id,register:true},function(data){
    Authorized(data);

callback(data);
})
}
function Mach(username,password,app_id,label,callback){
  $.post(logger.host+'/createmachine',{username:username,passw:password,app_id:app_id,label:label},function(data){
    Authorized(data);

callback(data);
})
}
function Sharemach(username,password,app_id,label,newusername,callback){
  $.post(logger.host+'/sharemach',{username:username,passw:password,app_id:app_id,label:label,newusername:newusername},function(data){
callback(data);
})
}
function Regapp(username,password,app_id,callback){
  logg(username,password,app_id,true,function(data){
    Authorized(data);

callback(data);
})
}


function Logi(username,password,app_id,callback){
  Logg(username,password,app_id,false,function(data){
callback(data);
})

}

DBstatus='loading';

 if(getCookie('UL')){
// Catchdata(JSON.parse(getCookie('UL')));
  } else{
    Authologi=false;
    DBstatus='offline';

if(localStorage.mine_db&&localStorage.app_db){
  db = new PouchDB(localStorage.mine_db);
  pubDB = new PouchDB('app_'+localStorage.app_db);
} else{
  db=false;
  pubDB=false;
}



  }


function Catchdata(dbs){
  Authologi=dbs;
  var master=false;
  var appdb=false;

for(var i=0;i<dbs.length;i++){
  if (dbs[i].dbtype=='mine'){
    master=dbs[i];
  }
  if (dbs[i].dbtype=='application'){
    appdb=dbs[i];
  }
}


  db = new PouchDB(master.dbname);
  pubDB = new PouchDB('app_'+master.app_id);
  var remoteDB = new PouchDB(logger.couchdbprotocol+'://'+master.slave.username+':'+master.slave.password+'@'+logger.couchdb+'/'+master.dbname);

syncDB=db.sync(remoteDB,{live:true,retry:true}).on('change', function () {
  // replication paused (e.g. user went offline)
  DBstatus='active';
  console.log('active');

}).on('paused', function () {
  // replication paused (e.g. user went offline)
  DBstatus='offline';
  console.log('offline');

}).on('active', function () {
  // replicate resumed (e.g. user went back online)
  DBstatus='active';
  console.log('active');

}).on('denied', function (info) {
  // a document failed to replicate, e.g. due to permissions
  DBstatus='auth_error';
  console.log('auth_error');

}).on('complete', function (info) {
  // handle complete
  DBstatus='closed';
  console.log('closed');

}).on('error', function (err) {
  // handle error
  DBstatus='error';
  console.log('error');

});



if(appdb){

var remotepublicDB = new PouchDB(logger.couchdbprotocol+'://'+master.slave.username+':'+master.slave.password+'@'+logger.couchdb+'/app_'+master.app_id);
syncpubDB=pubDB.sync(remotepublicDB,{live:true,retry:true});

}


}


function Autologout(){
  var expire=new Date((new Date()).getTime() - 10 * 24 * 60 * 60 * 1000);

  syncDB.cancel();
  localStorage.removeItem('mine_db');
  localStorage.removeItem('app_db');
  document.cookie='UL=; expires="'+expire+'"';
  Authologi=false;
  DBstatus='offline';
  db=false;
  pubDB=false;
}




function Authorized(data){
  var expire=new Date((new Date()).getTime() + 7 * 24 * 60 * 60 * 1000);
// if (data.ok&&data.dbs){
//   for(var i=0;i<data.dbs.length;i++){
//     if (data.dbs[i].dbtype=='mine'){
//       master=data.dbs[i].dbname;
//     }
//
//   }
//
// localStorage.setItem('mine_db', master);
// localStorage.setItem('app_db', data.dbs[0].app_id);
//
//   document.cookie='UL='+JSON.stringify(data.dbs)+'; expires="'+expire+'"';
// Catchdata(data.dbs)
//
//
// }

document.cookie='UL='+JSON.stringify(data.token)+'; expires="'+expire+'"';
connect();


}
var backlog=false;

function fromiframelogged(data){
console.log(data);
  if(backlog&&data){

    if (data.token){
      Authorized(data);

    }

    backlog(data);

  backlog=false;

  }
  $("#loginwin").fadeOut( 'slow', function() {
    $("#loginwin").remove();
  });

}

function LoggWin(action,app_id,callback){

  var width=400;
  var height=200;

  var html='<iframe id="framelogin" src="'+logger.host+'/page/auth.html?action='+action+'&app_id='+app_id+'&target=iframe" width="'+width+'" height="'+height+'" frameBorder="0"></iframe>';

if($("#ifamewinlog").attr('id')){
  $("#ifamewinlog").html(html);


} else{
  $('body').append('<div id="loginwin" style="display:none;z-index:100;top:0px;left:0px;width:100%;height:'+$(window).height()+'px;position:fixed;background-color:rgba(0,0,0,0.6);"><div id="ifamewinlog" style="background-color:white;z-index:101;position: fixed;top: 50%;left: 50%;width:'+width+'px;height: '+height+'px;margin-left: -'+(width/2)+'px;margin-top: -'+(height/2)+'px;"> '+html+' </div></div>');
  $('#loginwin').fadeIn('slow');
  $('#loginwin').click(function(){
    fromiframelogged();

  })
}


backlog=callback;


}
