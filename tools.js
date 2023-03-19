const mysql = require('mysql')
const { get } = require('./routes')
require('dotenv').config()

function connectTodb(){
    return new Promise((resolve,reject)=>{

           var conn = mysql.createConnection({
                host:process.env.DB_HOST,
                port:process.env.DB_PORT,
                database:process.env.DB_NAME,
                user: process.env.DB_USER,
                password:process.env.DB_PASSWORD
            })

            conn.connect((err)=>{
                if (err){
                    reject(err)
                }else{
                    resolve(conn)
                }
            })

    })
}



function exists(email,conn){
    return new Promise((resolve,reject)=>{
        var sql = `select mail from utilisateurs where mail = ${mysql.escape(email)}`
        conn.query(sql,(err,result)=>{
            if (err){
                reject(err)
            }else{
                if (result.length > 0){
                    resolve(true)
                }else{
                    resolve(false)
                }
            }
        })
    })

}

function verif(login,password,conn){
    return new Promise((resolve,reject)=>{
        var sql = `select login,pass from utilisateurs where login = ${mysql.escape(login)} and pass = SHA1(${mysql.escape(password)})`
        conn.query(sql,(err,result)=>{
            if (err){
                reject(err)
            }else{
                if (result.length > 0){
                    resolve(result)
                }else{
                    resolve(false)
                }
            }
        })
    })

}

function getData(conn){

    return new Promise((resolve,reject)=>{
        var sql = `SELECT nom_adr,prenom_adr,DATE_FORMAT(date_dem, "%d/%m/%Y"),DATE_FORMAT(date_ef_pol, "%d/%m/%Y"),DATE_FORMAT(date_ech, "%d/%m/%Y"),lib_act,fr_dem,cnas_dem,mtt_remb FROM demande d,polices p,actes a,adherents ad WHERE d.id_pol=p.id_pol and d.id_act = a.id_act and d.id_adr = ad.id_adr  limit 30`
        conn.query(sql,(err,result)=>{
            if (err){
                reject(err)
            }else{
                if (result.length > 0){
                    resolve(result)
                }else{
                    resolve(false)
                }
            }
        })
    }) 
  
}
//DATE_FORMAT(p.date_ef_pol, "%d/%m/%Y") as date_ef_pol
function getDemande(conn){
    return new Promise((resolve,reject)=>{
        var sql =`select DISTINCT id_clt,nom_clt 
        from clients 
        where id_clt in 
                        (select p.id_clt from polices p,demande d where p.id_pol=d.id_pol and d.et_dem=5)`
        conn.query(sql,(err,result)=>{
            if (err){
                reject(err)
            }else{
                if (result.length > 0){
                    resolve(result)
                }else{
                    resolve(false)
                }
            }
        })
    })
}

function getDemandeWithId(conn,id){
    return new Promise((resolve,reject)=>{
        var sql =`SELECT d.id_dem , a.nom_adr, a.prenom_adr,DATE_FORMAT(d.date_dem, "%d/%m/%Y"),DATE_FORMAT(p.date_ef_pol, "%d/%m/%Y"),DATE_FORMAT(p.date_ech, "%d/%m/%Y"),ac.lib_act 
        from demande d,polices p, clients c,adherents a, actes ac 
        WHERE d.id_pol = p.id_pol and d.id_act = ac.id_act and d.id_adr=a.id_adr and p.id_clt = c.id_clt and c.id_clt = ${mysql.escape(id)}
                   `
        conn.query(sql,(err,result)=>{
            if (err){
                reject(err)
            }else{
                if (result.length > 0){
                    resolve(result)
                }else{
                    resolve(false)
                }
            }
        })
    })
}


function getAct(conn,id){
    return new Promise(async(resolve,reject)=>{
        var sql = `select p.id_pol,p.nom_pol,fr_dem,cnas_dem,mtt_remb,id_benef from demande d,polices p , actes a  where d.id_dem = ${id} and d.id_act = a.id_act and p.id_pol = d.id_pol`
        conn.query(sql,async(err,result)=>{
            if(err){
                reject(err)
            }else{
                if (result[0].id_benef === 0){
                     resolve({
                               data:{
                                     id_police : result[0].id_pol,
                                     police:result[0].nom_pol,
                                     beneficiair:'Lui meme',
                                     montant_demande:result[0].fr_dem+" DZA",
                                     rembourcement_cnas:result[0].cnas_dem+" DZA",
                                     montant_rembourse:result[0].mtt_remb+" DZA"
                                    },
                               columns:[
                                  "Idetifiant police",
                                  "Nom police",
                                  "Benificiaire",
                                  "Montant demande",
                                  "Remboursement CNAS",
                                  "Montant remboursé"
                               ],
                               type:0
                            })
                }else{
                     const benef = await getBeneficier(result[0].id_benef)
                     resolve({
                        data:{
                            id_police : result[0].id_pol,
                            police:result[0].nom_pol,
                            beneficiair:benef[0].lib_tben,
                            nom_benificiair:benef[0].nom_benef,
                            prenom_beneficiair:benef[0].prenom_benef,
                            date_naiss:benef[0].date_nais_benef,
                            montant_demande:result[0].fr_dem+" DZA",
                            rembourcement_cnas:result[0].cnas_dem+" DZA",
                            montant_rembourse:result[0].mtt_remb+" DZA"
                        },
                        columns:[
                            "Idetifiant police",
                            "Nom police",
                            "Benificiere",
                            "Nom benificiaire",
                            "Prenom beneficiaire",
                            "Date de naissance",
                            "Montant demande",
                            "Remboursement CNAS",
                            "Montant remboursé"
                         ],
                         type:1
                     })
                }
            }
        })
    })
}

function getBeneficier(id){
    return new Promise((resolve,reject)=>{
        var sql =` select lib_tben,nom_benef,prenom_benef,DATE_FORMAT(date_nais_benef, "%d/%m/%Y") as date_nais_benef
        from beneficiaire b, type_benef t
        where id_benef = ${id} and b.type_benef=t.id_tben`
        conn.query(sql,(err,result)=>{
            if(err){
                reject(err)
            }else{
               resolve(result)
            }
        })
    })

    
}

function getUser(login,conn){
    return new Promise((resolve,reject)=>{
        var sql = `select id_user,login,nom,prenom,mail,poste,direction,niveau,privilege from utilisateurs where login = ${mysql.escape(login)}`
        conn.query(sql,(err,result)=>{
            if (err){
                reject(err)
            }else{
                console.log(result[0])
                resolve({id:result[0].id_user,login:result[0].login,nom:result[0].nom,prenom:result[0].prenom,mail:result[0].mail,poste:result[0].poste,direction:result[0].direction,niveau:result[0].niveau,privilege:result[0].privilege})
            }
        })
    })
}

module.exports = {
    connectTodb,
    exists,
    verif,
    getUser,
    getData,
    getDemande,
    getDemandeWithId,
    getAct
}