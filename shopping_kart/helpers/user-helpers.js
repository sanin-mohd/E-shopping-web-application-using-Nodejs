
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
            let proObj={
               item:ObjectId(proId),
               quantity:1  
            }

        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({username:ObjectId(userId)})
            if(userCart){
                let proExist=userCart.products.findIndex(product=>product.item==proId)
                if(proExist!=-1)
                {
                    db.get().collection(collection.CART_COLLECTION).updateOne({'products.item':ObjectId(proId)},
                    {$inc:{'products.$.quantity':1}}).then(()=>{resolve()})
                }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({username:ObjectId(userId)},{
                    
                        $push:{products:proObj}
                    
                }).then((response)=>{
                    resolve()
                })
                }
            }else{
                let cartObject={
                    username:ObjectId(userId),
                    products:[proObj]
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
                    $unwind:'$products'
                },
                {
                    $project:{


                        item:"$products.item",
                        quantity:"$products.quantity"


                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                }
               /* {
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
                */
               
            ]).toArray()
            console.log(cartItems[0].products);
            resolve(cartItems)
        })

    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=null
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({username:ObjectId(userId)})
            if(cart){
                count=cart.products.length
            }
            resolve(count)
        })
    }
}