var express = require('express');
const { render } = require('../app');
const productHelpers = require('../helpers/product-helpers');
const { deleteProduct } = require('../helpers/product-helpers');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelper.getAllproducts().then((products)=>{
    res.render('admin/view-products',{admin:true,products})
    console.log(products)
  })
  
  
});
router.get('/add-products',function(req,res){
  res.render('admin/add-products',{})
});
router.post('/add-products',(req,res)=>{
  console.log(req.body)
  console.log(req.files.image)

  productHelper.addProduct(req.body,(id)=>{
    let img=req.files.image
     console.log(id)
     img.mv('./public/images/'+id+'.jpg',(err)=>{
       if(!err){
        productHelper.getAllproducts().then((products)=>{
          res.render('admin/view-products',{admin:true,products})
          console.log(products)
        })
        }else{
          console.log("--------------------------------------------error------------------------------")
        }
     })
    
  })

});
router.get('/edit-products/:id',async(req,res)=>{
  
  let product=await productHelpers.getProductDetails(req.params.id)
  res.render('admin/edit-products',{product})
  console.log('----------------------Edit below product details------------------------');
  console.log(product);
})
router.post('/edit-products/:id',async(req,res)=>{
  productHelper.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    let image=req.files.image
    if(image){
      image.mv('./public/images/'+req.params.id+'.jpg')
    }
  })  
})
router.get('/delete-products/:id',(req,res)=>{
  let productId=req.params.id
  console.log(productId);
  productHelpers.deleteProduct(productId).then((response)=>{
    res.redirect('/admin')
  })

})

module.exports = router;
