var http = require("http");
var url = require('url');
var fs = require('fs');
var io = require('socket.io');
var mysql = require('mysql');
var mysql2 = require('mysql2/promise');
var user_info = [];

var server = http.createServer(function(request, response) {
      console.log('Connection');
});

server.listen(8100);

process.on('unhandledRejection', error => {
      console.error('unhandledRejection', error);
      process.exit(1)
});

var serv_io = io.listen(server);
serv_io.sockets.on('connection', function(socket) {OnClientConnected(socket)});
serv_io.sockets.on('disconnection', function(socket) {OnClientDisconnected(socket)});

var mysqldbs = {
      host: "127.0.0.1",
      user: "",
      password: ",
      database: ""
};

var mysqldbm = {
      host: "127.0.0.1",
      user: "",
      password: "",
      database: ""
};

var db= null;
var dbm= null;
var db2 = null;
var db3 = null;
var db4 = null;
var db5 = null;
var db6 = null;
var db7 = null;
var dbcv = null;
var cvup = null;
var CUser= null;
var cust= null;

function OnClientConnected(socket) {
      
      //服务器监听客服登入事件
      socket.on('login', function(name,ip){
            
            user_info.push({'socketid' : socket.id, 'UserName': name, 'UserIP' : ip});

            CheckUserName(name,socket);

      });
      
      socket.on('Offline', function(name){
            
            socket.disconnect();

            for(i=0; i<user_info.length+1; i++) {
                  if(user_info[i] != null || typeof(user_info[i]) != 'undefined'){
                        if(user_info[i].socketid.length>0){

                              if(user_info[i].socketid==socket.id){
                                    OnlineCustserviceExit(user_info[i].UserName);
                                    user_info.splice(i,1);
                                    break;
                              }
                        }
                  }
            }
      });
      
      socket.on('disconnect',function(){
      
            socket.disconnect();
            /*
            網路可能忽然斷線或機子關閉
            最後確定斷掉OSI模型 Transport Layer  傳輸層
             */
            for(i=0; i<user_info.length+1; i++) {
                  if(user_info[i] != null || typeof(user_info[i]) != 'undefined'){
                        if(user_info[i].socketid.length>0){
                              if(user_info[i].socketid==socket.id){
                                    OnlineCustserviceExit(user_info[i].UserName);
                                    user_info.splice(i,1);
                                    break;
                              }
                        }
                  }
            }
            


      
      });
      
      socket.on('OnlineReview',function(websocketid,CustsUserName,cid,UserName){
            OnlineReview(websocketid,CustsUserName,cid,UserName);
      });
      
      socket.on('OnlineMassageNotice',function(websocketid,cid,UserName){
            
            OnlineMassageNotice(websocketid,cid,UserName);
            
      });
      
      socket.on('OnlineMassageSend',function(CustsUserName,cid,UserName,content,Date,onlineip){
            
            
            OnlineMassageSend(CustsUserName,cid,UserName,content,Date,onlineip);
            
      });
      socket.on('OnlineImagesSend',function(CustsUserName,cid,UserName,images,Date,onlineip){
            OnlineImagesSend(CustsUserName,cid,UserName,images,Date,onlineip);
      });
      
      socket.on('OnlineExit',function(cid){
            OnlineExit(cid);
      });
      
      
      socket.on('OnlineCuteView',function(CustomerServiceMsg_ID){
            OnlineCuteView(CustomerServiceMsg_ID);
      });
      
      socket.on('Signoutupdate',function(msg){
            serv_io.sockets.emit('Signoutupdateclick', msg);
      });
}

function OnClientDisconnected(socket) {
      console.log("已離線");
}


StartJobAmount();

async function StartJobAmount(){
      
      try{
            
            //console.log("線上人數:"+user_info.length);
            
            if(user_info.length>0){
      
                  db2 =  await mysql2.createConnection(mysqldbs);
                  
                  const [rows, fields] = await db2.query("select ShopId,UserName  from JobAmountLog where Status = '2'", []);
                  
                  if(rows.length > 0) {
                        serv_io.sockets.emit('JobAmountLogMsg', rows);
                  } else {
                        serv_io.sockets.emit('JobAmountLogMsg','0');
                  }
                  
                  const [rowstwo, fieldstwo] = await db2.query("select DepositApplication_ID,UserName  from DepositApplication where DepositType='1' AND Status = '0'", []);
                  if(rowstwo.length > 0){
                        serv_io.sockets.emit('SendOnScoreMsg', rowstwo);
                  } else {
                        serv_io.sockets.emit('SendOnScoreMsg', '0');
                  }
                  
                  
                  const [rowsThree, fieldsThree] = await db2.query("select DepositApplication_ID,UserName  from DepositApplication where DepositType='2' AND Status = '0'", []);
                  if(rowsThree.length > 0){
                        serv_io.sockets.emit('SendNextpointsMsg', rowsThree);
                  } else {
                        serv_io.sockets.emit('SendNextpointsMsg', '0');
                  }
                  
                  
                  var Today=new Date();
                  var datelist =Today.getFullYear()+ "-" + (Today.getMonth()+1<10 ? '0' : '')+(Today.getMonth()+1) + "-" +  (Today.getDate()<10 ? '0' : '') + Today.getDate() ;
                  var StartDate =  datelist + " 00:00:00";
                  var EndDate = datelist + " 23:59:59";

                  const [rowsFour, fieldsFour] = await db2.query("select * from CustomerServiceBridge where  updated_at BETWEEN '"+StartDate+"' AND '"+EndDate+"'", []);
      
                  //console.log('Check有訊息'+rowsFour.length);
                  
                  if(rowsFour.length > 0){
                        CheckCustomerServiceMsg(rowsFour,StartDate,EndDate);
                  }

                  
                  const [rowsFive, fieldsFive] = await db2.query("select count(*) as CountNum from CustomerServiceMsg where Receiver='System' AND CuteView='0'", []);
                  
                  //console.log(rowsFive[0]['CountNum']);
                  
                  serv_io.sockets.emit('OnlineCount', rowsFive[0]['CountNum']);
      

                  await db2.end();
      
                  /*
                  await db2.destroy();
                  */
                  

            }

      } catch(err) {
            
            console.log(err);
            
            await db2.end();
            //await db2.destroy();
            
      } finally {
            

            
            setTimeout(function(){
                  
                  
                  StartJobAmount();
                  
            }, 10000);
            
      }
}
async function CheckUserName(UserName,socket){
      try{
      
            CUser=  await mysql2.createConnection(mysqldbs);
            
            const [rows,fields]=await CUser.query("select count(*) as CountNum from allusers where UserName='"+ UserName +"' OR UserName='"+UserName.toLowerCase()+"'",[]);
            if(rows[0]['CountNum'] > 0){
                  serv_io.sockets.connected[socket.id].emit('UserMsg',socket.id);
            } else {
                  socket.disconnect();
            }
            await CUser.end();
            //await CUser.destroy();
      
      } catch(err) {
      
            console.log(err);
            await CUser.end();
            //await CUser.destroy();
      }
      
}

async function OnlineCuteView(CustomerServiceMsg_ID){
      try{
            cvup =  await mysql2.createConnection(mysqldbs);
            
            await cvup.query("update CustomerServiceMsg set CuteView='1' where CustomerServiceMsg_ID='"+CustomerServiceMsg_ID+"'", []);
            
            await cvup.end();
            //await cvup.destroy();
      
      } catch(err) {
      
            console.log(err);
            await cvup.end();
            //await cvup.destroy();
      }
}


async function CheckCustomerServiceMsg(data,StartDate,EndDate){
 
      try{

            dbcv =  await mysql2.createConnection(mysqldbs);
      
            for (var i in data){

                  const [rows,fields]=await dbcv.query("select count(*) as CountNum from CustomerServiceMsg where UserName='"+ data[i].UserName +"' AND  Receiver='System' AND CuteView='0' ",[]);

                  
                  if(rows[0]['CountNum']>0){
                        serv_io.sockets.emit('OnlineUser',[{'cid':data[i].cid,'Receiver':data[i].Receiver,'UserName':data[i].UserName,'created_at':data[i].created_at,'updated_at':data[i].updated_at,'updatedunix':data[i].updatedunix}]);
                  }
                 
      
            }
            
            await dbcv.end();
            //await dbcv.destroy();
      
      } catch(err) {
      
            //console.log(err);
            await dbcv.end();
            //await dbcv.destroy();
      }
      
}

async function OnlineReview(websocketid,CustsUserName,cid,UserName){
      try{
            

            db =  await mysql2.createConnection(mysqldbs);
      
            dbm=  await mysql2.createConnection(mysqldbm);
            
            
            const [rows, fields] = await db.query("select * from CustomerServiceBridge where cid='"+cid+"'", []);
            
            if(typeof rows[0]['Receiver'] != "undefined" && rows[0]['Receiver'].length > 0){
                  


                  await dbm.query("INSERT INTO CustomerServiceLog  SET  cid='"+rows[0]['cid']+"',Receiver='"+rows[0]['Receiver']+"',UserName='"+rows[0]['UserName'] +"', created_at='"+rows[0]['created_at']+"',updated_at='"+rows[0]['updated_at']+"'", []);
                  await dbm.end();

                  serv_io.sockets.emit('LoadMassageCl', [{"check":"1","Receiver":rows[0]['Receiver'],"cid":cid,"UserName":UserName}]);

            } else {
                  

                  
  
                  
                  await dbm.query("update CustomerServiceBridge set Receiver='"+CustsUserName+"' where cid='"+cid+"'", []);
                  
                  await dbm.query("INSERT INTO CustomerServiceLog  SET  cid='"+rows[0]['cid']+"',Receiver='"+CustsUserName+"', UserName='"+ UserName +"',created_at='"+rows[0]['created_at']+"',updated_at='"+rows[0]['updated_at']+"'", []);
                  await dbm.end();
                  serv_io.sockets.emit('LoadMassage', [{"check":"0","Receiver":CustsUserName,"cid":cid,"UserName":UserName}]);
                  serv_io.sockets.emit('LoadMassageCl', [{"check":"1","Receiver":CustsUserName,"cid":cid,"UserName":UserName}]);
            }

            
            
            
            await db.end();
            //await db.destroy();
            
      } catch(err) {
            
            console.log(err);
            await db.end();
            //await db.destroy();
      }
}


//循環讀取留言
async function OnlineMassageNotice(websocketid,cid,UserName){
      try{

            
  
      
                  db4 = await mysql2.createConnection(mysqldbs);
                  
                  const [rows, fields] = await db4.query("select c.*,m.IconUrl from CustomerServiceMsg c LEFT JOIN allusers m USING(UserName) where c.UserName='"+UserName+"' ORDER BY c.updated_at ASC LIMIT 100", []);

                  if(rows.length > 0){
      
                        //console.log('讀取到資料送到客服人員端,資料共有'+rows.length);
                        
                        if(serv_io.sockets.connected[websocketid]){
                             
                              serv_io.sockets.connected[websocketid].emit('LoadMassageList', rows);
                        } else {
                              serv_io.sockets.emit('LoadMassageList', rows);
                        }
                        
                        
                  }
                  
                  
                  await db4.end();
 
      } catch(err) {
            
            console.log(err);
            await db4.end();
            //await db4.destroy();
            
      }
}


async function OnlineMassageSend(CustsUserName,cid,UserName,content,Date,onlineip){
      
      
      try{
            
  
            
            db5 = await mysql2.createConnection(mysqldbm);
            await db5.query("INSERT INTO CustomerServiceMsg  SET  UserName='"+UserName+"',Receiver='"+CustsUserName+"', StaffID='"+cid+"', Message='"+content+"',UserIP='"+onlineip+"',created_at='"+Date+"',updated_at='"+Date+"'", []);
            
            await db5.end();
            //await db5.destroy();
            
      } catch(err) {
            
            console.log(err);
            await db5.end();
            //await db5.destroy();
            
      }
}

//客服斷線
async function OnlineCustserviceExit(User){
      try{
      
            cust = await mysql2.createConnection(mysqldbm);
            await cust.query("UPDATE `CustomerServiceBridge`  SET Receiver='' WHERE Receiver='"+User+"'", []);
            await cust.end();
      } catch(err) {
      
            console.log(err);
            await cust.end();
            //await cust.destroy();
      
      }
}

async function OnlineExit(cid){
      try{
            

            if(cid.length > 0){
                  
                  
                  db6 = await mysql2.createConnection(mysqldbm);
                  
                  await db6.query("UPDATE `CustomerServiceBridge`  SET Receiver='' WHERE cid='"+cid+"'", []);
                  
                  await db6.end();
         
                  
            }
      } catch(err) {
            
            console.log(err);
            await db6.end();
 
            
      }
}


async function OnlineImagesSend(CustsUserName,cid,UserName,images,Date,onlineip){
      try{
            
  
            
            db7 = await mysql2.createConnection(mysqldbm);
            
            await db7.query("INSERT INTO CustomerServiceMsg  SET  UserName='"+UserName+"',Receiver='"+CustsUserName+"', StaffID='"+cid+"', Base64Image='"+images+"',UserIP='"+onlineip+"',created_at='"+Date+"',updated_at='"+Date+"'", []);
            
            
            await db7.end();
 
            
      } catch(err) {
            
            console.log(err);
      
            
      }
}







