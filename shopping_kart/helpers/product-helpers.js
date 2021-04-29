var db=require('../config/connection')
var collection=require('../config/collections')
var ObjectId=require('mongodb').ObjectId;
const collections = require('../config/collections');


module.exports={

addProduct:(product,callback)=>{
    console.log(product);
    db.get().collection('product').insertOne(product).then((data)=>{
        console.log(data)
        callback(data.ops[0]._id)
    })

},
getAllproducts:()=>{
    return new Promise(async (resolve,reject)=>{
        let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
        resolve(products)
    })
},
deleteProduct:(productId)=>{
    return new Promise((resolve,reject)=>{
        console.log('--------this string id will be deleted --------'+productId);
        console.log('----------------this is objectId of the product----------'+ObjectId(productId));
        db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:ObjectId(productId)}).then((response)=>{
            console.log(response);
            resolve(response)
        })

    }) 
},
getProductDetails:(productId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(productId)}).then((product)=>{
            resolve(product)
        })
    })
},
updateProduct:(proId,productDetails)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId},{$set:
            {
                name:productDetails.name,
                category:productDetails.category,
                price:productDetails.price,
                description:productDetails.description

            }}).then((response)=>{
                resolve(response)
            })
    })
}
}