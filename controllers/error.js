exports.get404 =(req,res,next)=>{
    res.status(404).render('404',{pageTitle:'404',path :'/404'});

};

exports.get505 = (req,res,next)=>{
    res.status(500).render('505',{pageTitle:'505',path :'/505'});

};
