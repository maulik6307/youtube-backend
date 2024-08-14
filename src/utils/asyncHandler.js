const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;

//=================SECOND APPROACH=========================//

/*

const asyncHandler=(fun)=>async (req,res,next)=>{


  try{
  await fun(req,res,next)
  }catch(err){
  res.status(err.code || 500).json({
  
  resposeCode:500,
  message:err.message
  })
  }

  }


*/
