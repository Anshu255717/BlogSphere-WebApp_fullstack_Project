module.exports=(req,res,next)=>{
  if( req.session.tempAdmin)
  {
      next();
  }
  else
  {
      res.redirect('/');
  }
}