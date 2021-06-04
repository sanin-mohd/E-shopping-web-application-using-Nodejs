const { ObjectID, ObjectId } = require('bson');
const { response } = require('express');
var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')
var userHelpers=require('../helpers/user-helpers')
const varifyLogin=((req,res,next)=>{
  if(req.session.userLoggedIn){
    next()

  }else{
    res.redirect('/login')

  }

})


/* GET home page. */
router.get('/',async function(req, res, next) {
  let user=req.session.user
  let cartCount=5
  console.log('-------------User -----'+user);
  if(user){
    cartCount=await userHelpers.getCartCount(user._id)
     
  }
  console.log('#################cartCount############'+cartCount);
   
  console.log('-------------------------Logged In User------------------------------')
  console.log(user);
  productHelper.getAllproducts().then((products)=>{
    console.log('---------------cart products--------------'+products)
    res.render('index',{products,user,cartCount})
    
  })
  
  
});
router.get('/login',(req,res)=>{
  if(req.session.user){
    res.redirect('/')
  }
  else{
    res.render('./user/login',{loginErr:req.session.userLoginErr})
    req.session.userLoginErr=false

  }
 
  
}) 
router.get('/signup',(req,res)=>{
  res.render('./user/signup')
})
router.post('/signup',(req,res)=>{
    userHelpers.doSignup(req.body).then((response)=>{
      console.log(response)
      
      req.session.user=response
      req.session.userLoggedIn=true
      res.redirect('/')
    })
})
router.post('/login',(req,res)=>{
  console.log(req.body);
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status)
    { 
      req.session.user=response.user
      req.session.userLoggedIn=true
      res.redirect('/')
    }    
    else{
      req.session.userLoginErr=true
      res.redirect('/login')
    }
  })

})
router.get('/logout',(req,res)=>{
  req.session.user=null
  res.redirect('/login')
})
router.get('/cart',varifyLogin,async(req,res)=>{
  let products=await userHelpers.getCartProduct(req.session.user._id)
  let totalValue=await userHelpers.getTotalAmount(req.session.user._id)
  console.log('-----------this is cart items---------');
  console.log(products);

  
  res.render('user/cart',{products,user:req.session.user,totalValue})
})
router.get('/add-to-cart/:id',(req,res)=>{
  console.log("API Call");
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
    //res.redirect('/')
  })
})
router.post('/change-product-quantity',(req,res,next)=>{
  console.log("----------body----------")
  console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then((response)=>{
    res.json(response)
    
  })
})
router.get('/place-order',varifyLogin,async(req,res)=>{
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/delivery',{total,user:req.session.user})
})
router.post('/place-order',async(req,res)=>{
  console.log("-----------------this is a post place order call---------------------");
  console.log(req.body)
  let products=await userHelpers.getCartProductList(req.body.userId)
  let totalPrice=await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['paymentMethod']==='COD'){
      res.json({codtatus:true})

    }else{
      userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
        res.json(response)

      })

    }
      
  })
  
})
router.get('/placedOrder',async(req,res)=>{
  let orders=await userHelpers.getUserOrders(req.session.user._id)
  
  res.render('user/placedOrder',{user:req.session.user,orders})
})
router.post('/verify-payment',((req,res)=>{
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then((response)=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log('payment succsess');
      res.json({status:true})
    })

  }).catch((err)=>{
    console.log(err);
    res.json({status:false})
  })


}))


module.exports = router;
