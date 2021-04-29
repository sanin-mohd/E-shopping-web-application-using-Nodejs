
var db=require('../config/connection')
var collection=require('../config/collections')
var bcryptc=require('bcrypt')
var collections = require('../config/collections')
var ObjectId=require('mongodb').ObjectId;


module.exports={
    doSignup:(userData)=>{
            return new  Promise(async(resolve,reject)=>{
            userData.password=await bcryptc.hash(userData.password,10 ) // (std) 10 for much fast to do encryption
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.ops[0])
            })
                
            
            
        })
        

    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collections.USER_COLLECTION).findOne({email:userData.email})
            
            if(user){
                bcryptc.compare(userData.password,user.password).then((result)=>{
                    if(result){

                        console.log('Login successfull');
                        response.status=true
                        response.user=user
                        resolve(response)

                    }
                    else{
                        
                        console.log('Login failed.......');
                        resolve({status:false})
                    }
                })

            }else{
                resolve({status:false});
                console.log(user);
                
            }
        })
    },
    addToCart:((proId,userId)=>{
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({username:ObjectId(userId)})
            if(userCart){
                db.get().collection(collection.CART_COLLECTION).updateOne({username:ObjectId(userId)},{
                    
                        $push:{products:ObjectId(proId)}
                    
                }).then((response)=>{
                    resolve()
                })
            }else{
                let cartObject={
                    username:ObjectId(userId),
                    products:[ObjectId(proId)]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObject).then((response)=>{
                    resolve()
                })

            }


        })
    }),
    getCartProduct:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{username:ObjectId(userId)},

                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        let:{proList:'$products'},
                        pipeline:[
                            {
                                $match:{
                                    $expr:{
                                        $in:['$_id',"$$proList"]
                                    }
                                }
                            }

                        ],
                        as:'cartItems'
                    }
                }
            ]).toArray()
            resolve(cartItems[0].cartItems)
        })

    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            if(cart){
                resolve(cart.products.length)

            }else{
                resolve()
            }
        })
    }
}