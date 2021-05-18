
var db=require('../config/connection')
var collection=require('../config/collections')
var bcryptc=require('bcrypt')
var collections = require('../config/collections')
var ObjectId=require('mongodb').ObjectId;
const { response } = require('express');
const Razorpay=require('razorpay');
const crypto = require('crypto');
const { resolve } = require('path');
let hmac = crypto.createHmac('sha256', 'ACddbd1ieWMOwGubiDFRpqVz');
var instance = new Razorpay({
    key_id: 'rzp_test_5p6bbDSO1mvrZB',
    key_secret: 'ACddbd1ieWMOwGubiDFRpqVz',
  });

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
                    db.get().collection(collection.CART_COLLECTION).updateOne({username:ObjectId(userId),'products.item':ObjectId(proId)},
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
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
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
    },
    changeProductQuantity:(details)=>{
        console.log("----------------details--------------")
        console.log(details)
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        return new Promise((resolve,reject)=>{
            if(details.quantity==1 && details.count==-1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:ObjectId(details.cart)},
                {
                    $pull:{
                        products:{item:ObjectId(details.product)}
                    }
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            }
            else{

            }
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:ObjectId(details.cart),'products.item':ObjectId(details.product)},
                    {$inc:{'products.$.quantity':details.count}}).then((response)=>{resolve(true)})

        })

    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{username:ObjectId(userId)},
    
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
    
    
                        item:'$products.item',
                        quantity:'$products.quantity'
    
    
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{
                        _id:'null',
                        total:{$sum:{$multiply:['$quantity','$product.price']}}
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
            console.log(total[0].total);
            resolve(total[0].total)
        })
    
    
    },
    placeOrder:(order,products,total)=>{
        return new Promise((resolve,reject)=>{
            console.log(order,products,total);
            let status=order['payment-method']==='COD'? 'placed':'pending'

            let orderObj={
                deliveryDetails:{
                    address:order.address,
                    mobile:order.mobile,
                    pincode:order.pincode

                },
                userId:ObjectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalprice:total,
                date:new Date(),
                status:status,
                


            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).removeOne({username:ObjectId(order.userId)})
                resolve(response.ops[0]._id)
            })
        })

    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({username:ObjectId(userId)})
            resolve(cart.products)
        })

    },
    getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:ObjectId(userId)}).toArray()
            console.log(orders);
            resolve(orders)
        })

    },
    generateRazorpay:(orderId,totalprice)=>{
        return new Promise((resolve,reject)=>{
            var options = {
                amount: totalprice*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                console.log("---------------------------New Order-----------------------------------------------------",order);
                resolve(order)
            });

        })

    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }
            else{
                reject()
            }

        })

    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},{
                $set:{
                    status:'placed'
                }
            }).then(()=>{resolve()})
        })

    }
    
}