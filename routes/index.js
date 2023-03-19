var express = require('express');
var router = express.Router();
const tools = require('../tools')
const mysql = require('mysql')
const jwt = require('jsonwebtoken')
require('dotenv').config()
/* GET home page. */
router.get('/', function(req, res, next) {
  res.status(200).json({

  })
});

  


router.post('/register',async(req,res)=>{
    var conn = await tools.connectTodb()
    if (req.body.name && req.body.email &&  req.body.password){
            user = { 
                name:  String(req.body.name),
                email: String(req.body.email),
                password: String(req.body.password)

             }
            exists = await tools.exists(user.email,conn)
            if (exists === false){
                var sql = `insert into users (name,email,password) values (${mysql.escape(user.name)},${mysql.escape(user.email)},SHA1(${mysql.escape(user.password)}))`
                conn.query(sql,async(err)=>{
                    if(err){
                        throw err
                    }else{
                        getUser = await tools.getUser(user.email,conn)
                        const token = jwt.sign({id:getUser.id,name:getUser.name,email:getUser.email},"secret")
                        res.cookie('jwt',token,{
                            httpOnly:true,
                            maxAge:24 * 60 * 60 * 1000 //oneday           
                        })
                        res.status(201).send("success")
                    }
                })
            }else{
                res.status(400).send({message:'email already exist'})
            }                        
        

    }else{
        res.status(200).send('Vous devez preciser tous les champs')
    }
            
    
})


router.post('/login',async(req,res)=>{
    console.log(typeof req.body)
    if (req.body.login &&  req.body.password){
        user = { 
            login: String(req.body.login),
            password: String(req.body.password)

         }
        conn = await tools.connectTodb()
        verif = await tools.verif(user.login,user.password,conn)
        if(verif === false){
            res.status(404).send({message:"Non reconnu verifier vos coordonnées"})
        }else{
            const getUser = await tools.getUser(user.login,conn)
            const token = jwt.sign({id:getUser.id,login:getUser.login,nom:getUser.nom,prenom:getUser.prenom,mail:getUser.mail,poste:getUser.poste,direction:getUser.direction,niveau:getUser.niveau,privilege:getUser.privilege},process.env.SECRET_KEY)
            res.cookie('jwt',token,{
                httpOnly:true,
                maxAge:24 * 60 * 60 * 1000 //oneday           
            })
            res.status(200).send({message:"success"})
        }

    }else{
        res.status(400).send({message:'Vous devez preciser tous les champs'})
    }

})

router.get('/user',(req,res)=>{
    try{
        const cookie = req.cookies['jwt']
        const claims = jwt.verify(cookie,process.env.SECRET_KEY)
        res.status(200).json(claims)
    }catch(err){
        return res.status(401).send(
            err
        )     
    }
})

router.get('/logout',(req,res)=>{
    res.cookie('jwt',"",{
        maxAge:0
    })
    return res.status(200).send({message:'Success'})
})

module.exports = router;
