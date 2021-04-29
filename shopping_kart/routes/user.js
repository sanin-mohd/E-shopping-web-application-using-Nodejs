var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')
var userHelpers=require('../helpers/user-helpers')
const varifyLogin=((req,res,next)=>{
  if(req.session.loggedIn){
    next()

  }else{
    res.redirect('/login')

  }

})


/* GET home page. */
router.get('/',async function(req, res, next) {
  let user=req.session.user
  let cartCount=2
  console.log('-------------User cart-----'+user);
  if(user){
    cartCount=await userHelpers.getCartCount(user._id)
  }
   
  console.log('-------------------------Logged In User------------------------------')
  console.log(user);
  productHelper.getAllproducts().then((products)=>{
    res.render('index',{products,user,cartCount})
    console.log(products)
  })
  
  
});
router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }
  else{
    res.render('./user/login',{loginErr:req.session.loginErr})
    req.session.loginErr=false

  }
 
  
}) 
router.get('/signup',(req,res)=>{
  res.render('./user/signup')
})
router.post('/signup',(req,res)=>{
    userHelpers.doSignup(req.body).then((response)=>{
      console.log(response)
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    })
})
router.post('/login',(req,res)=>{
  console.log(req.body);
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status)
    { req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }    
    else{
      req.session.loginErr=true
      res.redirect('/login')
    }
  })

})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})
router.get('/cart',varifyLogin,async(req,res)=>{
  let products=await userHelpers.getCartProduct(req.session.user._id)
  console.log('-----------this is cart items---------');
  console.log(products);
  
  res.render('user/cart',{products,user:req.session.user})
})
router.get('/add-to-cart/:id',varifyLogin,(req,res)=>{
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.redirect('/')
  })
})


module.exports = router;
